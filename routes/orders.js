// routes/orders.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth'); // 👈 Importa il middleware

// POST /api/orders - Crea nuovo ordine (protetto)
router.post('/', authenticate, orderController.createOrder);

// GET /api/orders/:orderId - Ottieni ordine (protetto)
router.get('/:orderId', authenticate, orderController.getOrder);

// GET /api/orders/user/me - Ottieni ordini dell'utente autenticato (protetto)
router.get('/user/me', authenticate, orderController.getUserOrders);

// PUT /api/orders/:orderId/cancel - Annulla ordine (protetto)
router.put('/:orderId/cancel', authenticate, orderController.cancelOrder);

// POST /api/orders/:orderId/pay - Avvia pagamento (protetto)
router.post('/:orderId/pay', authenticate, orderController.startPayment);

// GET /api/orders/payments/:paymentId/status - Stato pagamento (protetto)
router.get('/payments/:paymentId/status', authenticate, orderController.getPaymentStatus);

module.exports = router;