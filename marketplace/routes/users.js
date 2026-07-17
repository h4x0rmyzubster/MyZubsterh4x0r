// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'marketplace_jwt_secret';

// Registrazione utente
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, fullName } = req.body;

    if (!email || !password || !username || !fullName) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      fullName
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Errore registrazione:', error);
    res.status(500).json({ error: 'Errore registrazione utente' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password obbligatori' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        bio: user.bio,
        rating: user.rating,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('❌ Errore login:', error);
    res.status(500).json({ error: 'Errore login' });
  }
});

// Recupera il profilo dell'utente autenticato
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    console.error('❌ Errore profilo:', error);
    res.status(500).json({ error: 'Errore recupero profilo' });
  }
});

// Diventa seller
router.post('/become-seller', auth, async (req, res) => {
  try {
    const { moneroAddress } = req.body;

    if (!moneroAddress) {
      return res.status(400).json({ error: 'Indirizzo Monero obbligatorio' });
    }

    const user = await User.findByPk(req.user.id);
    user.role = 'seller';
    user.moneroAddress = moneroAddress;
    await user.save();

    res.json({
      message: 'Ora sei un seller!',
      user: {
        id: user.id,
        role: user.role,
        moneroAddress: user.moneroAddress
      }
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento ruolo:', error);
    res.status(500).json({ error: 'Errore aggiornamento ruolo' });
  }
});

module.exports = router;