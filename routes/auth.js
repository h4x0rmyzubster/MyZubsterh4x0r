// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register - Registrazione
router.post('/register', authController.register);

// POST /api/auth/login - Login
router.post('/login', authController.login);

// GET /api/auth/profile - Profilo utente (protetto)
router.get('/profile', authenticate, authController.getProfile);

// PUT /api/auth/profile - Aggiorna profilo (protetto)
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;