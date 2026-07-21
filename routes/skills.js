const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');

// Applica autenticazione a tutte le route
router.use(auth);

// GET /api/skills - Lista tutte le skill dell'utente loggato
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user._id });
    res.json(skills);
  } catch (error) {
    console.error('Errore recupero skills:', error);
    res.status(500).json({ error: 'Errore nel recupero delle skill' });
  }
});

// GET /api/skills/:id - Dettaglio skill
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill non trovata' });
    }
    res.json(skill);
  } catch (error) {
    console.error('Errore recupero skill:', error);
    res.status(500).json({ error: 'Errore nel recupero della skill' });
  }
});

// POST /api/skills - Crea una nuova skill
router.post('/', async (req, res) => {
  try {
    const skillData = {
      ...req.body,
      user: req.user._id, // Aggiunge l'utente dal token
    };
    const skill = new Skill(skillData);
    await skill.save();
    res.status(201).json(skill);
  } catch (error) {
    console.error('Errore creazione skill:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/skills/:id - Aggiorna una skill
router.put('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill non trovata' });
    }
    if (skill.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    Object.assign(skill, req.body);
    await skill.save();
    res.json(skill);
  } catch (error) {
    console.error('Errore aggiornamento skill:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/skills/:id - Elimina una skill
router.delete('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill non trovata' });
    }
    if (skill.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    await skill.deleteOne();
    res.json({ success: true, message: 'Skill eliminata' });
  } catch (error) {
    console.error('Errore eliminazione skill:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione della skill' });
  }
});

module.exports = router;
