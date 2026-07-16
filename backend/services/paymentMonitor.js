// services/paymentMonitor.js - Monitoraggio pagamenti Monero
const cron = require('node-cron');
const axios = require('axios');

const MONERO_MIN_CONFIRMATIONS = parseInt(process.env.MONERO_MIN_CONFIRMATIONS) || 10;

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
    const moneroRpcUrl = process.env.MONERO_RPC_URL || 'http://host.docker.internal:18083';
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
    
    if (response.data.result && response.data.result.in) {
      const transfers = response.data.result.in;
      
      for (const transfer of transfers) {
        const amountReceived = parseFloat(transfer.amount) / 1e12;
        const requiredAmount = order.moneroAmount;
        const tolerance = requiredAmount * 0.05;
        const minRequired = requiredAmount - tolerance;
        
        if (amountReceived >= minRequired) {
          const confirmations = transfer.confirmations || 0;
          
          console.log(`🔍 [Monitor] Transazione su ordine #${order.id}: ${amountReceived.toFixed(8)} XMR, conferme: ${confirmations}`);
          
          if (confirmations >= MONERO_MIN_CONFIRMATIONS) {
            // ✅ Pagamento confermato!
            console.log(`✅ [Monitor] PAGAMENTO CONFERMATO per ordine #${order.id} (${confirmations} conferme)`);
            console.log(`   📦 Richiesto: ${requiredAmount.toFixed(8)} XMR, Ricevuto: ${amountReceived.toFixed(8)} XMR`);
            console.log(`   🔗 TxID: ${transfer.txid}`);
            
            order.status = 'completed';
            order.paidAt = new Date().toISOString();
            order.txHash = transfer.txid;
            order.confirmations = confirmations;
            order.amountReceived = amountReceived;
            
            console.log(`🎉 Ordine #${order.id} completato!`);
          } else {
            // ⏳ In attesa di conferme
            console.log(`⏳ [Monitor] Ordine #${order.id} in attesa di conferme (${confirmations}/${MONERO_MIN_CONFIRMATIONS})`);
            order.confirmations = confirmations;
          }
        } else if (amountReceived > 0) {
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
  orders
};