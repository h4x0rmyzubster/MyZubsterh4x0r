// server.js - Marketplace Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 4000;

// ========== MIDDLEWARE ==========
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// ========== ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Marketplace API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rotte
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/orders', require('./routes/orders'));

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error('❌ Errore:', err.stack);
  res.status(500).json({
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// ========== SYNC DATABASE & START ==========
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Connessione PostgreSQL stabilita');

    await db.sequelize.sync({ alter: true });
    console.log('📦 Database sincronizzato (marketplace)');

    app.listen(PORT, () => {
      console.log(`🚀 Marketplace avviato su http://localhost:${PORT}`);
      console.log(`📦 Modalità: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 MyZubster API: ${process.env.MYZUBSTER_API_URL || 'non configurato'}`);
    });
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;