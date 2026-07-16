// services/paymentMonitor.js - Monitoraggio pagamenti Monero
const cron = require('node-cron');
const axios = require('axios');

// Array per tenere traccia degli ordini (in futuro, database)
let orders = [];

/**
 * Avvia il monitoraggio periodico dei pagamenti
 * Controlla ogni 60 secondi gli ordini in stato 'pending'
 */
function startPaymentMonitor() {
  // Cron job: ogni 60 secondi
  cron.schedule('*/60 * * * * *', async () => {
    const pendingOrders = orders.filter(o => o.status === 'pending');
    
    if (pendingOrders.length === 0) {
      // Nessun ordine in sospeso, salta il controllo
      return;
    }
    
    console.log(`🔍 [Monitor] Controllo ${pendingOrders.length} pagamenti in sospeso...`);
    
    for (const order of pendingOrders) {
      await checkPayment(order);
    }
  });
  
  console.log('✅ [Monitor] Avviato controllo pagamenti (ogni 60 secondi)');
  console.log(`📊 [Monitor] ${orders.length} ordini totali, ${orders.filter(o => o.status === 'pending').length} in sospeso`);
}

/**
 * Verifica se un ordine ha ricevuto il pagamento
 * @param {Object} order - L'ordine da controllare
 */
async function checkPayment(order) {
  try {
    const moneroRpcUrl = process.env.MONERO_RPC_URL || 'http://localhost:18083';
    const addressIndex = order.addressIndex || 1;
    
    const response = await axios.post(`${moneroRpcUrl}/json_rpc`, {
      jsonrpc: '2.0',
      id: '0',
      method: 'get_transfers',
      params: {
        in: true,
        account_index: 0,
        address_index: addressIndex
      }
    });
    
    // Verifica se ci sono transazioni in entrata
    if (response.data.result && response.data.result.in) {
      const transfers = response.data.result.in;
      
      for (const transfer of transfers) {
        // Converte da atomic unit (1e12) a XMR
        const amountReceived = parseFloat(transfer.amount) / 1e12;
        
        // Verifica se l'importo ricevuto è >= quanto dovuto (con tolleranza del 5%)
        const requiredAmount = order.moneroAmount;
        const tolerance = requiredAmount * 0.05; // 5% di tolleranza
        const minRequired = requiredAmount - tolerance;
        
        if (amountReceived >= minRequired) {
          // Pagamento ricevuto!
          console.log(`✅ [Monitor] PAGAMENTO RICEVUTO per ordine #${order.id}: ${amountReceived.toFixed(8)} XMR`);
          console.log(`   📦 Richiesto: ${requiredAmount.toFixed(8)} XMR, Ricevuto: ${amountReceived.toFixed(8)} XMR`);
          console.log(`   🔗 TxID: ${transfer.txid}`);
          
          // Aggiorna lo stato dell'ordine
          order.status = 'completed';
          order.paidAt = new Date().toISOString();
          order.txHash = transfer.txid;
          order.confirmations = transfer.confirmations || 0;
          order.amountReceived = amountReceived;
          
          console.log(`🎉 Ordine #${order.id} completato!`);
        } else if (amountReceived > 0) {
          // Pagamento parziale ricevuto
          console.log(`⚠️ [Monitor] Pagamento PARZIALE per ordine #${order.id}: ${amountReceived.toFixed(8)} XMR (richiesto: ${requiredAmount.toFixed(8)} XMR)`);
        }
      }
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.warn(`⚠️ [Monitor] Wallet RPC non disponibile (assicurati che monero-wallet-rpc sia in esecuzione)`);
    } else {
      console.error(`❌ [Monitor] Errore controllo ordine #${order.id}:`, error.message);
    }
  }
}

/**
 * Aggiunge un ordine al monitoraggio
 * @param {Object} order - L'ordine da aggiungere
 */
function addOrderToMonitor(order) {
  // Aggiunge l'ordine all'array (in futuro, al database)
  orders.push(order);
  console.log(`📌 [Monitor] Ordine #${order.id} aggiunto al monitoraggio`);
}

/**
 * Ottiene tutti gli ordini
 */
function getOrders() {
  return orders;
}

/**
 * Ottiene gli ordini per stato
 */
function getOrdersByStatus(status) {
  return orders.filter(o => o.status === status);
}

module.exports = { 
  startPaymentMonitor, 
  addOrderToMonitor, 
  getOrders, 
  getOrdersByStatus,
  orders // esportato per compatibilità con il codice esistente
};