// app.js - MyZubster Backend (con monitoraggio pagamenti e tasso di cambio)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importa i servizi
const { convertUSDToXMR } = require('./services/exchangeRate');
const { startPaymentMonitor, addOrderToMonitor, getOrders, getOrdersByStatus } = require('./services/paymentMonitor');

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
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log(`📨 Body ricevuto (${req.method} ${req.path}):`, req.body);
  }
  next();
});

// ========== ROUTES ==========

// 1. Crea un ordine e genera un subaddress Monero
app.post('/api/orders', async (req, res) => {
  try {
    const { amount, currency = 'USD', customerEmail } = req.body;

    if (!amount || !customerEmail) {
      return res.status(400).json({ 
        error: 'Campi mancanti: amount, customerEmail' 
      });
    }

    // 🔑 Genera un nuovo subaddress via RPC Monero
    const moneroRpcUrl = process.env.MONERO_RPC_URL || 'http://localhost:18083';
    
    // Ottieni l'indice del prossimo subaddress (in base al numero di ordini)
    const addressIndex = getOrders().length + 1;
    const label = `order_${addressIndex}`;

    const response = await fetch(`${moneroRpcUrl}/json_rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '0',
        method: 'create_address',
        params: {
          account_index: 0,
          label: label
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ Errore RPC Monero:', data.error);
      return res.status(500).json({ 
        error: 'Errore nella generazione del subaddress', 
        details: data.error 
      });
    }

    const moneroAddress = data.result.address;
    
    // 💱 Converti l'importo USD in XMR usando il tasso di cambio reale
    const moneroAmount = await convertUSDToXMR(amount);

    // Crea l'ordine
    const newOrder = {
      id: addressIndex,
      amount,
      currency,
      customerEmail,
      moneroAddress,
      moneroAmount,
      addressIndex,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Aggiungi al monitoraggio
    addOrderToMonitor(newOrder);

    console.log(`📦 Ordine creato: #${newOrder.id}`);
    console.log(`🔑 Subaddress generato: ${moneroAddress}`);
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
app.get('/api/orders', (req, res) => {
  const allOrders = getOrders();
  res.json(allOrders);
});

// 3. Recupera un ordine per ID
app.get('/api/orders/:id', (req, res) => {
  const order = getOrders().find(o => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: 'Ordine non trovato' });
  }
  res.json(order);
});

// 4. Recupera ordini per stato
app.get('/api/orders/status/:status', (req, res) => {
  const status = req.params.status;
  const filteredOrders = getOrdersByStatus(status);
  res.json(filteredOrders);
});

// 5. Health check
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MyZubster Backend',
    version: '1.1.0',
    database: 'in-memory (test)',
    monero: {
      rpc: process.env.MONERO_RPC_URL,
      network: process.env.MONERO_NETWORK
    },
    stats: {
      totalOrders: getOrders().length,
      pendingOrders: getOrdersByStatus('pending').length,
      completedOrders: getOrdersByStatus('completed').length
    }
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'MyZubster Backend API',
    version: '1.1.0',
    endpoints: {
      health: '/api/health',
      orders: '/api/orders',
      ordersStatus: '/api/orders/status/:status'
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

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
  console.log(`📦 Modalità: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Monero RPC: ${process.env.MONERO_RPC_URL || 'non configurato'}`);
  console.log(`📊 Fee Service: MOCK (2%)`);
  
  // Avvia il monitoraggio pagamenti
  startPaymentMonitor();
});

module.exports = app;