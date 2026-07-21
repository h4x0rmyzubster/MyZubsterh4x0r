const Order = require('../models/Order');
const moneroService = require('./moneroService');

const MONITOR_INTERVAL = parseInt(process.env.MONITOR_INTERVAL || '30000', 10); // 30 secondi
const CONFIRMATIONS_REQUIRED = parseInt(process.env.MONERO_CONFIRMATIONS || '1', 10);

/**
 * Monitora gli ordini in attesa di pagamento
 */
const monitorPayments = async () => {
  console.log(`[PaymentMonitor] 🔍 Scansione pagamenti in corso...`);

  // Trova ordini con pagamento in sospeso e non scaduti
  const pendingOrders = await Order.find({
    moneroPaymentStatus: { $in: ['pending', 'detected'] },
    moneroSubaddress: { $ne: null },
    moneroPaymentExpiresAt: { $gt: new Date() },
  });

  if (pendingOrders.length === 0) {
    console.log(`[PaymentMonitor] Nessun ordine in attesa.`);
    return;
  }

  console.log(`[PaymentMonitor] Trovati ${pendingOrders.length} ordini da verificare.`);

  for (const order of pendingOrders) {
    try {
      await checkOrderPayment(order);
    } catch (error) {
      console.error(`[PaymentMonitor] Errore per ordine ${order._id}:`, error.message);
    }
  }
};

/**
 * Verifica un singolo ordine
 */
const checkOrderPayment = async (order) => {
  const result = await moneroService.checkPayment(
    order.moneroSubaddress,
    order.totalPrice,
    CONFIRMATIONS_REQUIRED
  );

  if (result.received) {
    order.moneroPaymentStatus = result.isConfirmed ? 'confirmed' : 'detected';
    order.moneroPaymentTxid = result.txid;
    order.moneroPaymentAmount = result.amount;
    order.moneroPaymentConfirmations = result.confirmations || 0;

    if (result.isConfirmed) {
      order.moneroPaymentConfirmedAt = new Date();
      order.status = 'paid';
      console.log(`✅ [PaymentMonitor] Ordine ${order._id} confermato! Txid: ${result.txid}`);
    } else {
      order.moneroPaymentDetectedAt = new Date();
      console.log(`⏳ [PaymentMonitor] Ordine ${order._id} rilevato (in attesa di conferme). Txid: ${result.txid}`);
    }

    await order.save();
  }
};

/**
 * Avvia il monitoraggio periodico
 */
const startMonitoring = () => {
  console.log(`🚀 [PaymentMonitor] Avviato (intervallo: ${MONITOR_INTERVAL}ms)`);
  
  // Esegui subito il primo controllo
  monitorPayments();

  // Poi esegui a intervalli regolari
  setInterval(monitorPayments, MONITOR_INTERVAL);
};

module.exports = { startMonitoring };
