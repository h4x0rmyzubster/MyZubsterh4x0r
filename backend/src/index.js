require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { randomUUID } = require('crypto');
const { loadPaymentConfig, normalizeConfirmations } = require('./payment/config');
const { MoneroClient } = require('./payment/moneroClient');
const {
  parseXmrToAtomic,
  formatAtomicToXmr,
  buildMoneroUri
} = require('./payment/paymentService');

const app = express();
const paymentConfig = loadPaymentConfig(process.env);
const moneroClient = new MoneroClient(paymentConfig);
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster';
const mongoDbName = process.env.MONGODB_DB || new URL(mongoUri).pathname.replace(/^\//, '') || 'myzubster';
const callbackUrl = process.env.PAYMENT_STATUS_CALLBACK_URL || '';

let payments;
let skills;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'myzubster-backend', storage: 'mongodb' });
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
    const { amount, amountXmr, description, sellerId, confirmations, callbackUrl: requestCallbackUrl } = req.body || {};
    if (!sellerId || typeof sellerId !== 'string') {
      return res.status(400).json({ error: 'sellerId is required' });
    }

    const amountAtomic = parseXmrToAtomic(amountXmr ?? amount);
    const paymentId = randomUUID();
    const safeDescription = description || 'MyZubster payment';
    const requiredConfirmations = normalizeConfirmations(confirmations ?? paymentConfig.defaultConfirmations);
    const addressInfo = await moneroClient.createPaymentAddress({ label: `myzubster:${paymentId}:${sellerId}` });
    const now = new Date();

    const payment = {
      paymentId,
      sellerId,
      amount: Number(formatAtomicToXmr(amountAtomic)),
      amountXmr: formatAtomicToXmr(amountAtomic),
      amountAtomic: amountAtomic.toString(),
      description: safeDescription,
      address: addressInfo.address,
      recipientAddress: addressInfo.address,
      status: 'pending',
      confirmations: 0,
      requiredConfirmations,
      paidAtomic: '0',
      paidXmr: '0',
      txIds: [],
      subaddressIndex: addressInfo.subaddressIndex,
      externalId: addressInfo.externalId,
      callbackUrl: requestCallbackUrl || callbackUrl || null,
      uri: buildMoneroUri(addressInfo.address, amountAtomic, safeDescription),
      createdAt: now,
      updatedAt: now,
      confirmedAt: null
    };

    await payments.insertOne(payment);

    res.status(201).json(publicPayment(payment));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/payment/status/:paymentId', async (req, res) => {
  try {
    const payment = await payments.findOne({ paymentId: req.params.paymentId });
    if (!payment) return res.status(404).json({ error: 'payment not found' });

    const chainState = await moneroClient.checkPayment(toMoneroPaymentShape(payment));
    const paidAtomic = chainState.paidAtomic;
    const status = calculateStatus({
      paidAtomic,
      amountAtomic: BigInt(payment.amountAtomic),
      confirmations: chainState.confirmations,
      requiredConfirmations: payment.requiredConfirmations
    });

    const update = {
      status,
      confirmations: Number(chainState.confirmations || 0),
      paidAtomic: paidAtomic.toString(),
      paidXmr: formatAtomicToXmr(paidAtomic),
      txIds: chainState.txIds || [],
      updatedAt: new Date()
    };
    if (status === 'confirmed' && !payment.confirmedAt) update.confirmedAt = new Date();

    await payments.updateOne({ paymentId: payment.paymentId }, { $set: update });
    const updated = { ...payment, ...update };

    res.json(publicPayment(updated));
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.post('/api/payment/webhook', async (req, res) => {
  try {
    if (paymentConfig.webhookSecret) {
      const received = req.get('x-payment-secret') || req.get('x-moneropay-secret');
      if (received !== paymentConfig.webhookSecret) {
        return res.status(401).json({ error: 'invalid webhook secret' });
      }
    }

    const payload = req.body || {};
    const selector = webhookSelector(payload);
    if (!selector) return res.status(400).json({ error: 'paymentId, address, or externalId is required' });

    const payment = await payments.findOne(selector);
    if (!payment) return res.status(404).json({ error: 'payment not found' });

    const paidAtomic = BigInt(String(payload.amountAtomic ?? payload.amount_atomic ?? payload.paidAtomic ?? payload.paid_atomic ?? payment.paidAtomic ?? 0));
    const confirmations = Number(payload.confirmations ?? payment.confirmations ?? 0);
    const status = calculateStatus({
      paidAtomic,
      amountAtomic: BigInt(payment.amountAtomic),
      confirmations,
      requiredConfirmations: payment.requiredConfirmations
    });

    const update = {
      status,
      confirmations,
      paidAtomic: paidAtomic.toString(),
      paidXmr: formatAtomicToXmr(paidAtomic),
      txIds: payload.txIds || payload.txids || payment.txIds || [],
      updatedAt: new Date()
    };
    if (status === 'confirmed' && !payment.confirmedAt) update.confirmedAt = new Date();

    await payments.updateOne({ paymentId: payment.paymentId }, { $set: update });
    const updated = { ...payment, ...update };

    notifyApp(updated).catch((error) => {
      console.warn(`Payment callback failed for ${payment.paymentId}: ${error.message}`);
    });

    res.json(publicPayment(updated));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

async function findSkillById(skillId) {
  const selectors = [{ id: skillId }, { skillId }];
  if (ObjectId.isValid(skillId)) selectors.push({ _id: new ObjectId(skillId) });
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

function publicPayment(payment) {
  return {
    paymentId: payment.paymentId,
    address: payment.address,
    amount: payment.amount,
    amountXmr: payment.amountXmr,
    amountAtomic: payment.amountAtomic,
    description: payment.description,
    sellerId: payment.sellerId,
    requiredConfirmations: payment.requiredConfirmations,
    status: payment.status,
    paidXmr: payment.paidXmr || '0',
    paidAtomic: payment.paidAtomic || '0',
    confirmations: payment.confirmations || 0,
    txIds: payment.txIds || [],
    uri: payment.uri,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    confirmedAt: payment.confirmedAt
  };
}

function calculateStatus({ paidAtomic, amountAtomic, confirmations, requiredConfirmations }) {
  const hasEnoughAmount = paidAtomic >= amountAtomic;
  const hasEnoughConfirmations = Number(confirmations || 0) >= Number(requiredConfirmations || 0);
  if (hasEnoughAmount && hasEnoughConfirmations) return 'confirmed';
  if (hasEnoughAmount) return 'detected';
  return 'pending';
}

function toMoneroPaymentShape(payment) {
  return {
    id: payment.paymentId,
    externalId: payment.externalId,
    address: payment.address,
    amountAtomic: payment.amountAtomic,
    requiredConfirmations: payment.requiredConfirmations,
    subaddressIndex: payment.subaddressIndex,
    paidAtomic: payment.paidAtomic
  };
}

function webhookSelector(payload) {
  if (payload.paymentId || payload.payment_id || payload.id) {
    return { paymentId: payload.paymentId || payload.payment_id || payload.id };
  }
  if (payload.address) return { address: payload.address };
  if (payload.externalId || payload.external_id) return { externalId: payload.externalId || payload.external_id };
  return null;
}

async function notifyApp(payment) {
  if (!payment.callbackUrl) return;
  const response = await fetch(payment.callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: payment.paymentId,
      sellerId: payment.sellerId,
      status: payment.status,
      amount: payment.amount,
      confirmations: payment.confirmations,
      txIds: payment.txIds || []
    })
  });
  if (!response.ok) throw new Error(`callback HTTP ${response.status}`);
}

async function start() {
  const mongo = new MongoClient(mongoUri);
  await mongo.connect();
  const db = mongo.db(mongoDbName);
  payments = db.collection('monero_payments');
  skills = db.collection('skills');
  await payments.createIndex({ paymentId: 1 }, { unique: true });
  await payments.createIndex({ address: 1 }, { unique: true });
  await payments.createIndex({ sellerId: 1, createdAt: -1 });
  await skills.createIndex({ id: 1 });

  app.listen(port, () => {
    console.log(`MyZubster backend listening on http://0.0.0.0:${port}`);
    console.log(`MongoDB database: ${mongoDbName}`);
    console.log(`Monero provider: ${paymentConfig.provider}`);
  });
}

start().catch((error) => {
  console.error('Failed to start MyZubster backend', error);
  process.exit(1);
});
