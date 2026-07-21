const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');

// Applica auth a tutte le route
router.use(auth);

// GET /api/offers - Lista tutte le offerte (pubblica)
router.get('/', async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate('skill', 'title category')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    console.error('Errore recupero offerte:', error);
    res.status(500).json({ error: 'Errore nel recupero delle offerte' });
  }
});

// GET /api/offers/:id - Dettaglio offerta
router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('skill', 'title category description')
      .populate('user', 'name email');
    if (!offer) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }
    res.json(offer);
  } catch (error) {
    console.error('Errore recupero offerta:', error);
    res.status(500).json({ error: 'Errore nel recupero dell\'offerta' });
  }
});

// POST /api/offers - Crea una nuova offerta
router.post('/', async (req, res) => {
  try {
    const { title, description, price, skill, category } = req.body;
    const userId = req.user._id;

    // Verifica che la skill esista e appartenga all'utente
    const skillExists = await Skill.findOne({ _id: skill, user: userId });
    if (!skillExists) {
      return res.status(404).json({ error: 'Skill non trovata o non appartiene all\'utente' });
    }

    const offer = new Offer({
      user: userId,
      skill,
      title,
      description,
      price,
      category: category || skillExists.category, // usa la categoria della skill se non fornita
      availableFrom: new Date(),
      availableDays: [1, 2, 3, 4, 5],
      timeSlot: 'tutto il giorno',
      status: 'attiva'
    });

    await offer.save();
    await offer.populate('skill', 'title category');
    await offer.populate('user', 'name email');

    res.status(201).json({ success: true, offer });
  } catch (error) {
    console.error('Errore creazione offerta:', error);
    res.status(500).json({ error: 'Errore nella creazione dell\'offerta' });
  }
});

// PUT /api/offers/:id - Aggiorna un'offerta
router.put('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }
    if (offer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const { title, description, price, status, availableFrom, availableDays, timeSlot } = req.body;
    offer.title = title || offer.title;
    offer.description = description || offer.description;
    offer.price = price || offer.price;
    offer.status = status || offer.status;
    offer.availableFrom = availableFrom || offer.availableFrom;
    offer.availableDays = availableDays || offer.availableDays;
    offer.timeSlot = timeSlot || offer.timeSlot;

    await offer.save();
    res.json({ success: true, offer });
  } catch (error) {
    console.error('Errore aggiornamento offerta:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'offerta' });
  }
});

// DELETE /api/offers/:id - Elimina un'offerta
router.delete('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }
    if (offer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    await offer.deleteOne();
    res.json({ success: true, message: 'Offerta eliminata' });
  } catch (error) {
    console.error('Errore eliminazione offerta:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione dell\'offerta' });
  }
});

module.exports = router;
