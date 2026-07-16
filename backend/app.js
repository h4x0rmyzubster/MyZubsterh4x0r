// app.js - MyZubster Backend (con JWT e MOCK DIRETTO per Monero)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importa i servizi
const { convertUSDToXMR } = require('./services/exchangeRate');
const { startPaymentMonitor, addOrderToMonitor } = require('./services/paymentMonitor');

// Importa il database
const db = require('./models');

// Importa l'autenticazione
const { authenticateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

// Configurazione Monero
const MONERO_RPC_URL = process.env.MONERO_RPC_URL || 'http://host.docker.internal:18083';
const MONERO_NETWORK = process.env.MONERO_NETWORK || 'testnet';
const MONERO_MIN_CONFIRMATIONS = parseInt(process.env.MONERO_MIN_CONFIRMATIONS) || 10;

console.log(`🔒 Monero Network: ${MONERO_NETWORK}`);
console.log(`🔢 Min confirmations: ${MONERO_MIN_CONFIRMATIONS}`);

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug: log dei body ricevuti
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.path.startsWith('/api/auth')) {
    console.log(`📨 Body ricevuto (${req.method} ${req.path}):`, req.body);
  }
  next();
});

// ========== GENERAZIONE MOCK PER SUBADDRESS ==========
function generateMockSubaddress(label) {
  const mockAddress = `MOCK_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  console.log(`🧪 [MOCK] Subaddress generato: ${mockAddress} (label: ${label})`);
  return mockAddress;
}

// ========== ROUTES ==========

// Rotte di autenticazione (PUBBLICHE)
app.use('/api/auth', authRoutes);

// ========== ROTTE PROTETTE ==========
app.use('/api/orders', authenticateToken);

// 1. Crea un ordine (MOCK DIRETTO - senza RPC)
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'USD', customerEmail } = req.body;

    if (!amount || !customerEmail) {
      return res.status(400).json({ 
        error: 'Campi mancanti: amount, customerEmail' 
      });
    }

    const orderCount = await db.Order.count();
    const addressIndex = orderCount + 1;
    const label = `order_${addressIndex}`;

    // 🔑 Genera direttamente un mock (senza tentare RPC)
    const moneroAddress = generateMockSubaddress(label);
    console.log(`🧪 [MOCK] Subaddress generato per ordine: ${moneroAddress}`);

    // 💱 Converti l'importo USD in XMR
    const moneroAmount = await convertUSDToXMR(amount);

    // Crea l'ordine nel database
    const newOrder = await db.Order.create({
      amount,
      currency,
      customerEmail,
      moneroAddress,
      moneroAmount,
      addressIndex,
      status: 'pending',
      network: MONERO_NETWORK
    });

    // Aggiungi al monitoraggio
    addOrderToMonitor(newOrder);

    console.log(`📦 Ordine creato: #${newOrder.id}`);
    console.log(`💰 Importo da pagare: ${moneroAmount.toFixed(8)} XMR`);

    res.status(201).json(newOrder);

  } catch (error) {
    console.error('❌ Errore creazione ordine:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 2. Recupera tutti gli ordini
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await db.Order.findAll({ order: [['createdAt', 'DESC']] });
    res.json(orders);
  } catch (error) {
    console.error('❌ Errore recupero ordini:', error);
    res.status(500).json({ error: 'Errore recupero ordini' });
  }
});

// 3. Recupera un ordine per ID
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await db.Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    res.json(order);
  } catch (error) {
    console.error('❌ Errore recupero ordine:', error);
    res.status(500).json({ error: 'Errore recupero ordine' });
  }
});

// 4. Recupera ordini per stato
app.get('/api/orders/status/:status', authenticateToken, async (req, res) => {
  try {
    const status = req.params.status;
    const orders = await db.Order.findAll({
      where: { status },
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('❌ Errore recupero ordini per stato:', error);
    res.status(500).json({ error: 'Errore recupero ordini' });
  }
});

// 5. Health check (PUBBLICA)
app.get('/api/health', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    const totalOrders = await db.Order.count();
    const pendingOrders = await db.Order.count({ where: { status: 'pending' } });
    const completedOrders = await db.Order.count({ where: { status: 'completed' } });

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'MyZubster Backend',
      version: '1.3.0',
      database: 'connected',
      authentication: 'enabled (JWT)',
      monero: {
        mode: 'MOCK (RPC disabilitato)',
        network: MONERO_NETWORK,
        minConfirmations: MONERO_MIN_CONFIRMATIONS
      },
      stats: { totalOrders, pendingOrders, completedOrders }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Root (PUBBLICA)
app.get('/', (req, res) => {
  res.json({
    message: 'MyZubster Backend API',
    version: '1.3.0',
    authentication: 'JWT required for /api/orders',
    endpoints: {
      auth: { login: 'POST /api/auth/login', me: 'GET /api/auth/me (requires token)' },
      orders: {
        create: 'POST /api/orders (requires token)',
        list: 'GET /api/orders (requires token)',
        get: 'GET /api/orders/:id (requires token)',
        status: 'GET /api/orders/status/:status (requires token)'
      },
      health: 'GET /api/health (public)'
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// ========== SYNC DATABASE & START ==========
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Connessione PostgreSQL stabilita');

    await db.sequelize.sync({ alter: true });
    console.log('📦 Database sincronizzato');

    app.listen(PORT, () => {
      console.log(`🚀 Server avviato su http://localhost:${PORT}`);
      console.log(`📦 Modalità: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🧪 Monero mode: MOCK (RPC disabilitato)`);
      console.log(`🌐 Monero Network: ${MONERO_NETWORK}`);
      console.log(`🔐 JWT Authentication: ENABLED`);
      console.log(`📊 Fee Service: MOCK (2%)`);
      
      startPaymentMonitor();
    });
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;