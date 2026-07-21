const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Offer = require('../models/Offer');
const moneroService = require('../services/moneroService');
const auth = require('../middleware/auth'); // Assicurati che esista

// Applica il middleware di autenticazione a TUTTE le route di orders
router.use(auth);

// GET /api/orders - Lista tutti gli ordini dell'utente
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

// GET /api/orders/:id - Dettaglio ordine
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('offer', 'title price description seller')
      .populate('buyer', 'name email');
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    // Verifica che l'utente sia il buyer o il seller
    if (order.buyer._id.toString() !== req.user._id.toString() && 
        order.offer.seller?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    res.json(order);
  } catch (error) {
    console.error('Errore recupero ordine:', error);
    res.status(500).json({ error: 'Errore nel recupero dell\'ordine' });
  }
});

// POST /api/orders - Crea un nuovo ordine (con subaddress Monero)
router.post('/', async (req, res) => {
  try {
    const { offerId, quantity = 1 } = req.body;
    const buyerId = req.user._id;

    // Verifica che l'offerta esista
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }

    // Calcola il totale
    const totalPrice = offer.price * quantity;

    // Crea l'ordine
    const order = new Order({
      offer: offerId,
      buyer: buyerId,
      quantity,
      totalPrice,
      status: 'pending',
      moneroPaymentStatus: 'pending',
    });

    // Salva l'ordine per ottenere l'ID
    await order.save();

    // Genera subaddress Monero per questo ordine
    try {
      const sub = await moneroService.generateSubaddress(`order-${order._id}`);
      order.moneroSubaddress = sub.address;
      order.moneroAddressIndex = sub.index;
      await order.save();
    } catch (moneroError) {
      console.error('Errore generazione subaddress:', moneroError);
      // Non bloccare la creazione dell'ordine, ma logga l'errore
    }

    // Popola i dati per la risposta
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
      },
    });
  } catch (error) {
    console.error('Errore creazione ordine:', error);
    res.status(500).json({ error: 'Errore nella creazione dell\'ordine' });
  }
});

// PUT /api/orders/:id - Aggiorna stato ordine
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('offer');
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    // Verifica che l'utente sia il venditore o il buyer (o admin)
    if (order.buyer._id.toString() !== req.user._id.toString() && 
        order.offer.seller?._id.toString() !== req.user._id.toString()) {
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

// DELETE /api/orders/:id - Cancella un ordine (solo se in stato pending)
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    if (order.buyer._id.toString() !== req.user._id.toString()) {
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
