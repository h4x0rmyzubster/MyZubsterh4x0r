require('dotenv').config();

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const { randomUUID, createHash } = require('crypto');
const PaymentTransaction = require('./models/PaymentTransaction');
const { sendPaymentConfirmedNotification } = require('./notifications/firebase');
const { parseXmrToAtomic, buildMoneroUri } = require('./payment/paymentService');

const app = express();
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster';
const callbackUrl = process.env.PAYMENT_STATUS_CALLBACK_URL || '';
const simulationDelayMs = Number(process.env.MONERO_PAYMENT_SIMULATION_MS || 10_000);
const platformFeeRate = Number(process.env.PAYMENT_PLATFORM_FEE_RATE || 0.02);

let skills;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'myzubster-backend', storage: 'mongoose', moneroMode: 'simulated' });
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
    const { amount, amountXmr, description, sellerId, buyerId, fcmToken, callbackUrl: requestCallbackUrl } = req.body || {};
    if (!sellerId || typeof sellerId !== 'string') {
      return res.status(400).json({ error: 'sellerId is required' });
    }

    const amountValue = normalizeAmount(amountXmr ?? amount);
    const paymentId = randomUUID();
    const moneroAddress = generateOneTimeMoneroAddress(paymentId);
    const feeAmount = roundXmr(amountValue * platformFeeRate);
    const netAmount = roundXmr(amountValue - feeAmount);

    const transaction = await PaymentTransaction.create({
      paymentId,
      amount: amountValue,
      feeAmount,
      netAmount,
      sellerId: toObjectId(sellerId),
      buyerId: buyerId && mongoose.Types.ObjectId.isValid(buyerId) ? new mongoose.Types.ObjectId(buyerId) : null,
      status: 'in_attesa',
      moneroAddress,
      fcmToken: fcmToken || null,
      description: description || 'MyZubster payment',
      confirmations: 0,
      createdAt: new Date(),
      confirmedAt: null
    });

    schedulePaymentSimulation(transaction.paymentId, requestCallbackUrl || callbackUrl || null);

    res.status(201).json(publicPayment(transaction, requestCallbackUrl || callbackUrl || null));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/payment/status/:paymentId', async (req, res) => {
  try {
    const transaction = await confirmDueSimulatedPayment(req.params.paymentId);
    if (!transaction) return res.status(404).json({ error: 'payment not found' });

    res.json({
      ...publicPayment(transaction),
      status: toApiStatus(transaction.status),
      amount: transaction.amount,
      confirmations: transaction.confirmations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payment/webhook', async (req, res) => {
  try {
    const { paymentId, status, confirmations, txIds } = req.body || {};
    if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });

    const nextStatus = status ? toDbStatus(status) : 'confermato';
    const update = {
      status: nextStatus,
      confirmations: Number(confirmations ?? (nextStatus === 'confermato' ? 10 : 0))
    };
    if (nextStatus === 'confermato') update.confirmedAt = new Date();

    const transaction = await PaymentTransaction.findOneAndUpdate(
      { paymentId },
      { $set: update },
      { new: true }
    );
    if (!transaction) return res.status(404).json({ error: 'payment not found' });

    notifyPaymentConfirmed(transaction, req.body.callbackUrl || callbackUrl || null, txIds || []).catch((error) => {
      console.warn(`Payment notification failed for ${paymentId}: ${error.message}`);
    });

    res.json(publicPayment(transaction));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

async function confirmDueSimulatedPayment(paymentId) {
  const transaction = await PaymentTransaction.findOne({ paymentId });
  if (!transaction) return null;
  if (transaction.status !== 'in_attesa' && transaction.status !== 'pending') return transaction;

  const elapsedMs = Date.now() - new Date(transaction.createdAt).getTime();
  if (elapsedMs < simulationDelayMs) return transaction;

  transaction.status = 'confermato';
  transaction.confirmations = 10;
  transaction.confirmedAt = transaction.confirmedAt || new Date();
  await transaction.save();
  await notifyPaymentConfirmed(transaction, null, []);
  return transaction;
}

function schedulePaymentSimulation(paymentId, paymentCallbackUrl) {
  setTimeout(async () => {
    try {
      const transaction = await PaymentTransaction.findOneAndUpdate(
        { paymentId, status: { $in: ['in_attesa', 'pending'] } },
        { $set: { status: 'confermato', confirmations: 10, confirmedAt: new Date() } },
        { new: true }
      );
      if (transaction) await notifyPaymentConfirmed(transaction, paymentCallbackUrl, []);
    } catch (error) {
      console.warn(`Simulated payment confirmation failed for ${paymentId}: ${error.message}`);
    }
  }, simulationDelayMs);
}

function normalizeAmount(value) {
  const atomic = parseXmrToAtomic(value);
  return Number(valueFromAtomic(atomic));
}

function valueFromAtomic(atomic) {
  const whole = atomic / 1_000_000_000_000n;
  const fraction = (atomic % 1_000_000_000_000n).toString().padStart(12, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function roundXmr(value) {
  return Number(value.toFixed(12));
}

function toObjectId(value) {
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  // Prototype-friendly fallback for demo seller IDs such as "seller-demo" while the real users collection is not wired yet.
  return new mongoose.Types.ObjectId(createHash('sha1').update(String(value)).digest('hex').slice(0, 24));
}

function generateOneTimeMoneroAddress(paymentId) {
  const digest = createHash('sha256').update(`myzubster:${paymentId}`).digest('hex');
  // Simulation-only address with a Monero-like shape. No private keys are generated or exposed to clients.
  return `8MyZubster${digest}${digest}`.slice(0, 95);
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
  const amountAtomic = parseXmrToAtomic(transaction.amount);
  const status = toApiStatus(transaction.status);
  const address = transaction.moneroAddress;
  return {
    paymentId: transaction.paymentId,
    address,
    moneroAddress: address,
    amount: transaction.amount,
    amountXmr: valueFromAtomic(amountAtomic),
    amountAtomic: amountAtomic.toString(),
    feeAmount: transaction.feeAmount,
    netAmount: transaction.netAmount,
    platformFeeRate,
    description: transaction.description,
    sellerId: String(transaction.sellerId),
    buyerId: transaction.buyerId ? String(transaction.buyerId) : null,
    requiredConfirmations: 10,
    status,
    rawStatus: transaction.status,
    paidXmr: status === 'confirmed' ? valueFromAtomic(amountAtomic) : '0',
    paidAtomic: status === 'confirmed' ? amountAtomic.toString() : '0',
    confirmations: transaction.confirmations || 0,
    txIds: [],
    uri: buildMoneroUri(address, amountAtomic, transaction.description || 'MyZubster payment'),
    callbackUrl: paymentCallbackUrl,
    fcmToken: transaction.fcmToken ? 'configured' : null,
    createdAt: transaction.createdAt,
    confirmedAt: transaction.confirmedAt,
    updatedAt: transaction.confirmedAt || transaction.createdAt
  };
}

function toApiStatus(status) {
  if (status === 'confermato' || status === 'confirmed') return 'confirmed';
  if (status === 'fallito' || status === 'failed') return 'failed';
  return 'pending';
}

function toDbStatus(status) {
  const normalized = String(status).toLowerCase();
  if (normalized === 'confirmed' || normalized === 'confermato') return 'confermato';
  if (normalized === 'failed' || normalized === 'fallito') return 'fallito';
  return 'in_attesa';
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
    console.log(`Monero mode: simulated confirmations after ${simulationDelayMs}ms`);
  });
}

start().catch((error) => {
  console.error('Failed to start MyZubster backend', error);
  process.exit(1);
});
