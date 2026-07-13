// controllers/orderController.js
const { Order } = require('../models');
const paymentService = require('../services/paymentService');
const feeService = require('../services/feeService');

// ========== CREATE ORDER ==========
exports.createOrder = async (req, res) => {
  try {
    // Prende l'userId dal token (utente autenticato)
    const userId = req.user.id;
    const { items, total, currency, shippingAddress, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items deve essere un array non vuoto' });
    }
    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ error: 'total deve essere un numero positivo' });
    }

    const order = new Order({
      userId, // 👈 ora prende da req.user.id
      items,
      total,
      currency: currency || 'XMR',
      shippingAddress: shippingAddress || {},
      notes: notes || '',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();

    console.log(`[Order] ✅ Ordine creato: ${order.orderNumber} (${order._id}) per user ${userId}`);

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        total: order.total,
        currency: order.currency,
        status: order.status,
        items: order.items,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('[Order] ❌ Errore creazione ordine:', error);
    res.status(500).json({
      error: 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== GET ORDER ==========
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    res.json(order);
  } catch (error) {
    console.error('[Order] ❌ Errore getOrder:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========== GET USER ORDERS ==========
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id; // Usa l'utente autenticato
    const { limit = 50, status } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 100));

    res.json({
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('[Order] ❌ Errore getUserOrders:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========== START PAYMENT ==========
exports.startPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { amount, currency } = req.body;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    if (!order.isPayable()) {
      return res.status(400).json({
        error: 'Ordine non pagabile',
        status: order.status,
        paymentStatus: order.paymentStatus
      });
    }

    // Calcola fee (opzionale)
    const fee = await feeService.calculateFee(amount || order.total);
    console.log(`[Payment] Fee calcolata: ${fee}`);

    // Crea pagamento
    const payment = await paymentService.createPayment(
      orderId,
      amount || order.total,
      currency || order.currency
    );

    order.paymentId = payment.id;
    order.paymentStatus = 'pending';
    await order.save();

    res.json({
      success: true,
      payment: {
        id: payment.id,
        address: payment.address,
        qrCode: payment.qrCode,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        memo: payment.memo,
        createdAt: payment.createdAt,
        expiresAt: payment.expiresAt,
        fee
      }
    });
  } catch (error) {
    console.error('[Payment] ❌ Errore startPayment:', error);
    res.status(500).json({
      error: 'Errore durante l\'avvio del pagamento',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== GET PAYMENT STATUS ==========
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    // Recupera il pagamento dal mock
    const payment = await paymentService.getPaymentStatus(paymentId);

    // Verifica che l'ordine associato appartenga all'utente
    const order = await Order.findOne({ paymentId, userId });
    if (!order) {
      return res.status(403).json({ error: 'Accesso negato a questo pagamento' });
    }

    res.json(payment);
  } catch (error) {
    console.error('[Payment] ❌ Errore getPaymentStatus:', error);
    res.status(404).json({ error: error.message });
  }
};

// ========== CANCEL ORDER ==========
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    if (!order.isCancellable()) {
      return res.status(400).json({
        error: 'Ordine non annullabile',
        status: order.status,
        paymentStatus: order.paymentStatus
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Ordine annullato',
      order
    });
  } catch (error) {
    console.error('[Order] ❌ Errore cancelOrder:', error);
    res.status(500).json({ error: error.message });
  }
};