// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth'); // 👈 Aggiunto: route autenticazione

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🔄 Avvio server...');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ========== ROTTE ==========
app.use('/api/auth', authRoutes);    // 👈 Nuova rotta per autenticazione
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MyZubster Backend',
    database: 'MongoDB',
    blockchain: {
      web3: process.env.WEB3_PROVIDER,
      feeContract: process.env.FEE_CONTRACT_ADDRESS
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'MyZubster Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      health: '/api/health'
    }
  });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error('❌ Errore server:', err.stack);
  res.status(500).json({
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// ========== AVVIO SERVER ==========
if (process.env.NODE_ENV !== 'test') {
  console.log('🔄 Connessione al database...');
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server avviato su http://localhost:${PORT}`);
      console.log(`📦 Modalità: ${process.env.NODE_ENV || 'development'}`);
    });
  }).catch(err => {
    console.error('❌ Errore fatale:', err);
    process.exit(1);
  });
} else {
  console.log('🧪 Ambiente test: server non avviato');
}

module.exports = app;