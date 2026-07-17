// routes/skills.js
const express = require('express');
const { Op } = require('sequelize');
const { Skill, User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Crea una nuova competenza (solo seller)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, price, currency, estimatedDuration, deliveryTime } = req.body;

    if (!title || !description || !category || !price) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }

    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo i seller possono pubblicare competenze' });
    }

    const skill = await Skill.create({
      sellerId: req.user.id,
      title,
      description,
      category,
      price,
      currency: currency || 'USD',
      estimatedDuration,
      deliveryTime
    });

    res.status(201).json(skill);
  } catch (error) {
    console.error('❌ Errore creazione competenza:', error);
    res.status(500).json({ error: 'Errore creazione competenza' });
  }
});

// Recupera tutte le competenze (con filtro)
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const where = { isActive: true };

    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (minPrice) where.price = { [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) {
      where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
    }

    const skills = await Skill.findAll({
      where,
      include: [{ model: User, as: 'seller', attributes: ['id', 'username', 'fullName', 'rating'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(skills);
  } catch (error) {
    console.error('❌ Errore recupero competenze:', error);
    res.status(500).json({ error: 'Errore recupero competenze' });
  }
});

// Recupera una competenza per ID
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findByPk(req.params.id, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'username', 'fullName', 'rating', 'bio'] }]
    });

    if (!skill) {
      return res.status(404).json({ error: 'Competenza non trovata' });
    }

    skill.views += 1;
    await skill.save();

    res.json(skill);
  } catch (error) {
    console.error('❌ Errore recupero competenza:', error);
    res.status(500).json({ error: 'Errore recupero competenza' });
  }
});

module.exports = router;