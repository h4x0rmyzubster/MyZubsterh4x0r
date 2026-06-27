require('dotenv').config();

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const { randomUUID, createHash } = require('crypto');
const PaymentTransaction = require('./models/PaymentTransaction');
const { sendPaymentConfirmedNotification } = require('./notifications/firebase');
const { loadPaymentConfig, normalizeConfirmations } = require('./payment/config');
const { MoneroClient } = require('./payment/moneroClient');
const { parseXmrToAtomic, formatAtomicToXmr, buildMoneroUri } = require('./payment/paymentService');

const app = express();
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster';
const callbackUrl = process.env.PAYMENT_STATUS_CALLBACK_URL || '';
const platformFeeRate = Number(process.env.PAYMENT_PLATFORM_FEE_RATE || 0.02);
const paymentConfig = loadPaymentConfig(process.env);
const moneroClient = new MoneroClient(paymentConfig);

let skills;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'myzubster-backend',
    storage: 'mongoose',
    moneroMode: paymentConfig.provider
  });
});

app.get('/api/skills/:skillId', async (req, res) => {
  try {
    const skill = await findSkillById(req.params.skillId);
    if (!skill) return res.status(404).json({ error: 'skill not found' });
    res.json(publicSkill(skill));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payment/create', async (req, res) => {
  try {
    const { amount, amountXmr, sellerId, ...options } = req.body || {};
    const transaction = await createPaymentTransaction(amountXmr ?? amount, sellerId, options);
    res.status(201).json(publicPayment(transaction, options.callbackUrl || callbackUrl || null));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/payment/status/:paymentId', async (req, res) => {
  try {
    const transaction = await checkPaymentStatus(req.params.paymentId, {
      callbackUrl: req.query.callbackUrl || callbackUrl || null
    });
    if (!transaction) return res.status(404).json({ error: 'payment not found' });

    res.json(publicPayment(transaction));
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.post('/api/payment/webhook', async (req, res) => {
  try {
    const { paymentId, status, confirmations, txIds, txids, paidAtomic, amountAtomic } = req.body || {};
    if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });

    const previous = await PaymentTransaction.findOne({ paymentId });
    if (!previous) return res.status(404).json({ error: 'payment not found' });

    const nextStatus = status ? toDbStatus(status) : 'confirmed';
    const paidAtomicValue = paidAtomic ?? amountAtomic ?? previous.paidAtomic ?? previous.amountAtomic;
    const update = {
      status: nextStatus,
      confirmations: Number(confirmations ?? (nextStatus === 'confirmed' ? previous.requiredConfirmations : previous.confirmations ?? 0)),
      paidAtomic: String(paidAtomicValue),
      paidXmr: formatAtomicToXmr(BigInt(String(paidAtomicValue))),
      txIds: txIds || txids || previous.txIds || [],
      updatedAt: new Date()
    };
    if (nextStatus === 'confirmed') update.confirmedAt = previous.confirmedAt || new Date();

    const transaction = await PaymentTransaction.findOneAndUpdate(
      { paymentId },
      { $set: update },
      { new: true }
    );

    const transitionedToConfirmed = !isConfirmedStatus(previous.status) && isConfirmedStatus(transaction.status);
    if (transitionedToConfirmed) {
      notifyPaymentConfirmed(transaction, req.body.callbackUrl || callbackUrl || null, transaction.txIds || []).catch((error) => {
        console.warn(`Payment notification failed for ${paymentId}: ${error.message}`);
      });
    }

    res.json(publicPayment(transaction));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

async function createPaymentTransaction(amount, sellerId, options = {}) {
  if (!sellerId || typeof sellerId !== 'string') {
    throw new Error('sellerId is required');
  }

  const amountAtomic = parseXmrToAtomic(amount);
  const amountValue = Number(formatAtomicToXmr(amountAtomic));
  const feeAmount = roundXmr(amountValue * platformFeeRate);
  const netAmount = roundXmr(amountValue - feeAmount);
  const paymentId = randomUUID();
  const description = options.description || 'MyZubster payment';
  const requiredConfirmations = normalizeConfirmations(options.confirmations ?? paymentConfig.defaultConfirmations);
  const label = `myzubster:${paymentId}:seller:${sellerId}`;
  const addressInfo = await moneroClient.createPaymentAddress({ label });

  return PaymentTransaction.create({
    paymentId,
    amount: amountValue,
    amountAtomic: amountAtomic.toString(),
    feeAmount,
    netAmount,
    sellerId: toObjectId(sellerId),
    buyerId: options.buyerId && mongoose.Types.ObjectId.isValid(options.buyerId) ? new mongoose.Types.ObjectId(options.buyerId) : null,
    status: 'pending',
    moneroAddress: addressInfo.address,
    paidAtomic: '0',
    paidXmr: '0',
    requiredConfirmations,
    confirmations: 0,
    subaddressIndex: addressInfo.subaddressIndex ?? null,
    externalId: addressInfo.externalId || null,
    moneroProvider: paymentConfig.provider,
    txIds: [],
    fcmToken: options.fcmToken || null,
    description,
    createdAt: new Date(),
    confirmedAt: null
  });
}

async function checkPaymentStatus(paymentId, options = {}) {
  const transaction = await PaymentTransaction.findOne({ paymentId });
  if (!transaction) return null;
  if (toApiStatus(transaction.status) === 'failed') return transaction;

  const amountAtomic = transaction.amountAtomic || parseXmrToAtomic(transaction.amount).toString();
  if (!transaction.amountAtomic) transaction.amountAtomic = amountAtomic;

  const chainState = await moneroClient.checkPayment({
    id: transaction.paymentId,
    address: transaction.moneroAddress,
    amountAtomic,
    requiredConfirmations: transaction.requiredConfirmations,
    subaddressIndex: transaction.subaddressIndex,
    externalId: transaction.externalId
  });

  const paidAtomic = BigInt(String(chainState.paidAtomic || 0));
  const requiredAmount = BigInt(amountAtomic);
  const confirmations = Number(chainState.confirmations || 0);
  const hasEnoughAmount = paidAtomic >= requiredAmount;
  const hasEnoughConfirmations = confirmations >= Number(transaction.requiredConfirmations || 0);
  const nextStatus = hasEnoughAmount && hasEnoughConfirmations
    ? 'confirmed'
    : hasEnoughAmount
      ? 'detected'
      : 'pending';
  const transitionedToConfirmed = !isConfirmedStatus(transaction.status) && isConfirmedStatus(nextStatus);

  transaction.status = nextStatus;
  transaction.paidAtomic = paidAtomic.toString();
  transaction.paidXmr = formatAtomicToXmr(paidAtomic);
  transaction.confirmations = confirmations;
  transaction.txIds = chainState.txIds || [];
  transaction.updatedAt = new Date();
  if (nextStatus === 'confirmed') transaction.confirmedAt = transaction.confirmedAt || new Date();
  await transaction.save();

  if (transitionedToConfirmed) {
    await notifyPaymentConfirmed(transaction, options.callbackUrl || null, transaction.txIds || []);
  }

  return transaction;
}

function roundXmr(value) {
  return Number(value.toFixed(12));
}

function toObjectId(value) {
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  // Prototype-friendly fallback for demo seller IDs such as "seller-demo" while the real users collection is not wired yet.
  return new mongoose.Types.ObjectId(createHash('sha1').update(String(value)).digest('hex').slice(0, 24));
}

async function findSkillById(skillId) {
  const selectors = [{ id: skillId }, { skillId }];
  if (mongoose.Types.ObjectId.isValid(skillId)) selectors.push({ _id: new mongoose.Types.ObjectId(skillId) });
  return skills.findOne({ $or: selectors });
}

function publicSkill(skill) {
  const user = skill.user || {
    id: skill.sellerId || skill.userId || '',
    name: skill.sellerName || skill.userName || 'Utente MyZubster',
    avatarUrl: skill.avatarUrl || null
  };

  return {
    id: String(skill.id || skill.skillId || skill._id),
    title: skill.title || skill.name || 'Competenza',
    category: skill.category || 'Generale',
    type: skill.type || 'Offerta',
    description: skill.description || '',
    priceXmr: skill.priceXmr ?? skill.price ?? null,
    distanceKm: skill.distanceKm ?? skill.distance ?? null,
    address: skill.address || null,
    sellerId: skill.sellerId || user.id,
    user: {
      id: user.id || skill.sellerId || '',
      name: user.name || 'Utente MyZubster',
      avatarUrl: user.avatarUrl || null
    }
  };
}

function publicPayment(transaction, paymentCallbackUrl = null) {
  const amountAtomic = BigInt(transaction.amountAtomic || parseXmrToAtomic(transaction.amount).toString());
  const paidAtomic = BigInt(String(transaction.paidAtomic || 0));
  const status = toApiStatus(transaction.status);
  const address = transaction.moneroAddress;
  return {
    paymentId: transaction.paymentId,
    address,
    moneroAddress: address,
    amount: transaction.amount,
    amountXmr: formatAtomicToXmr(amountAtomic),
    amountAtomic: amountAtomic.toString(),
    feeAmount: transaction.feeAmount,
    netAmount: transaction.netAmount,
    platformFeeRate,
    description: transaction.description,
    sellerId: String(transaction.sellerId),
    buyerId: transaction.buyerId ? String(transaction.buyerId) : null,
    requiredConfirmations: transaction.requiredConfirmations || 0,
    status,
    rawStatus: transaction.status,
    paidXmr: formatAtomicToXmr(paidAtomic),
    paidAtomic: paidAtomic.toString(),
    confirmations: transaction.confirmations || 0,
    txIds: transaction.txIds || [],
    subaddressIndex: transaction.subaddressIndex ?? null,
    externalId: transaction.externalId || null,
    moneroProvider: transaction.moneroProvider || paymentConfig.provider,
    uri: buildMoneroUri(address, amountAtomic, transaction.description || 'MyZubster payment'),
    callbackUrl: paymentCallbackUrl,
    fcmToken: transaction.fcmToken ? 'configured' : null,
    createdAt: transaction.createdAt,
    confirmedAt: transaction.confirmedAt,
    updatedAt: transaction.updatedAt || transaction.confirmedAt || transaction.createdAt
  };
}

function toApiStatus(status) {
  if (status === 'confermato' || status === 'confirmed') return 'confirmed';
  if (status === 'detected') return 'detected';
  if (status === 'fallito' || status === 'failed') return 'failed';
  return 'pending';
}

function toDbStatus(status) {
  const normalized = String(status).toLowerCase();
  if (normalized === 'confirmed' || normalized === 'confermato') return 'confirmed';
  if (normalized === 'detected') return 'detected';
  if (normalized === 'failed' || normalized === 'fallito') return 'failed';
  return 'pending';
}

function isConfirmedStatus(status) {
  return toApiStatus(status) === 'confirmed';
}

async function notifyPaymentConfirmed(transaction, paymentCallbackUrl, txIds = []) {
  await Promise.allSettled([
    notifyApp(transaction, paymentCallbackUrl, txIds),
    notifyPush(transaction)
  ]);
}

async function notifyPush(transaction) {
  if (transaction.notificationSentAt) return;
  const result = await sendPaymentConfirmedNotification({
    token: transaction.fcmToken,
    payment: {
      paymentId: transaction.paymentId,
      amount: transaction.amount
    }
  });
  if (result) {
    transaction.notificationSentAt = new Date();
    await transaction.save();
  }
}

async function notifyApp(transaction, paymentCallbackUrl, txIds = []) {
  if (!paymentCallbackUrl) return;
  const response = await fetch(paymentCallbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: transaction.paymentId,
      sellerId: String(transaction.sellerId),
      buyerId: transaction.buyerId ? String(transaction.buyerId) : null,
      status: toApiStatus(transaction.status),
      amount: transaction.amount,
      amountXmr: formatAtomicToXmr(BigInt(transaction.amountAtomic)),
      feeAmount: transaction.feeAmount,
      netAmount: transaction.netAmount,
      confirmations: transaction.confirmations,
      txIds
    })
  });
  if (!response.ok) throw new Error(`callback HTTP ${response.status}`);
}

async function start() {
  await mongoose.connect(mongoUri);
  skills = mongoose.connection.db.collection('skills');
  await skills.createIndex({ id: 1 });

  app.listen(port, () => {
    console.log(`MyZubster backend listening on http://0.0.0.0:${port}`);
    console.log(`MongoDB database: ${mongoose.connection.name}`);
    console.log(`Monero provider: ${paymentConfig.provider}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start MyZubster backend', error);
    process.exit(1);
  });
}

module.exports = {
  app,
  createPaymentTransaction,
  checkPaymentStatus
};
