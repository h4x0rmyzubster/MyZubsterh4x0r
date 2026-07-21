const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Offer = require('../models/Offer');
const moneroService = require('../services/moneroService');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('offer', 'title price')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Errore recupero ordini:', error);
    res.status(500).json({ error: 'Errore nel recupero degli ordini' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('offer', 'title price description seller')
      .populate('buyer', 'name email');
    if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
    res.json(order);
  } catch (error) {
    console.error('Errore recupero ordine:', error);
    res.status(500).json({ error: 'Errore nel recupero dell\'ordine' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { offerId, quantity = 1 } = req.body;
    const buyerId = req.user._id;

    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ error: 'Offerta non trovata' });

    const totalPrice = offer.price * quantity;
    const expirySeconds = parseInt(process.env.PAYMENT_EXPIRY || '86400', 10);
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    const order = new Order({
      offer: offerId,
      buyer: buyerId,
      quantity,
      totalPrice,
      status: 'pending',
      moneroPaymentStatus: 'pending',
      moneroPaymentExpiresAt: expiresAt,
    });

    await order.save();

    try {
      const sub = await moneroService.generateSubaddress(`order-${order._id}`);
      order.moneroSubaddress = sub.address;
      order.moneroAddressIndex = sub.index;
      await order.save();
    } catch (moneroError) {
      console.error('Errore generazione subaddress:', moneroError);
    }

    await order.populate('offer', 'title price');
    await order.populate('buyer', 'name email');

    res.status(201).json({
      success: true,
      order,
      payment: {
        moneroSubaddress: order.moneroSubaddress,
        moneroAddressIndex: order.moneroAddressIndex,
        totalPrice: order.totalPrice,
        currency: 'XMR',
        expiresAt: order.moneroPaymentExpiresAt,
      },
    });
  } catch (error) {
    console.error('Errore creazione ordine:', error);
    res.status(500).json({ error: 'Errore nella creazione dell\'ordine' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    order.status = status || order.status;
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    console.error('Errore aggiornamento ordine:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'ordine' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Impossibile cancellare un ordine già elaborato' });
    }
    await order.deleteOne();
    res.json({ success: true, message: 'Ordine cancellato' });
  } catch (error) {
    console.error('Errore cancellazione ordine:', error);
    res.status(500).json({ error: 'Errore nella cancellazione dell\'ordine' });
  }
});

module.exports = router;
