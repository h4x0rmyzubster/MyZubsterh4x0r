// controllers/authController.js
const User = require('../models/User');
const jwtService = require('../services/jwtService');

// ========== REGISTRAZIONE ==========
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validazioni
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Dati mancanti. Richiesti: email, password, name'
      });
    }

    // Controlla se l'utente esiste già
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email già registrata' });
    }

    // Crea l'utente
    const user = new User({ email, password, name });
    await user.save();

    // Genera token
    const token = jwtService.generateToken(user._id, user.email, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Errore registrazione:', error);
    res.status(500).json({
      error: 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== LOGIN ==========
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono obbligatori' });
    }

    // Trova l'utente (includi password)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Verifica la password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Aggiorna ultimo login
    user.lastLogin = new Date();
    await user.save();

    // Genera token
    const token = jwtService.generateToken(user._id, user.email, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({
      error: 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== PROFILO UTENTE ==========
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json(user);
  } catch (error) {
    console.error('Errore profilo:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};

// ========== AGGIORNA PROFILO ==========
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    if (name) user.name = name;
    if (email) {
      // Controlla se l'email è già usata da un altro utente
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email già in uso da un altro utente' });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Errore aggiornamento profilo:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
};