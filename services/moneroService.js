const axios = require('axios');

const RPC_URL = process.env.MONERO_RPC_URL || 'http://127.0.0.1:18083/json_rpc';

const rpc = async (method, params = {}) => {
  try {
    const response = await axios.post(RPC_URL, {
      jsonrpc: '2.0',
      id: '0',
      method,
      params,
    });
    return response.data.result;
  } catch (error) {
    console.error(`[Monero RPC] Error in ${method}:`, error.response?.data || error.message);
    throw new Error(`Monero RPC error: ${method}`);
  }
};

const generateSubaddress = async (label = '') => {
  const result = await rpc('create_address', { label });
  return {
    address: result.address,
    index: result.address_index,
    label: result.label || label,
  };
};

const getBalance = async () => {
  const result = await rpc('get_balance');
  return {
    balance: result.balance / 1e12,
    unlockedBalance: result.unlocked_balance / 1e12,
  };
};

const checkPayment = async (address, expectedAmount, confirmations = 1) => {
  const transfers = await rpc('get_transfers', { in: true, account_index: 0 });
  const incoming = transfers.in || [];
  
  for (const tx of incoming) {
    if (tx.address === address && tx.amount / 1e12 >= expectedAmount && tx.confirmations >= confirmations) {
      return {
        received: true,
        amount: tx.amount / 1e12,
        txid: tx.txid,
        confirmations: tx.confirmations,
        timestamp: tx.timestamp,
      };
    }
  }
  return { received: false };
};

module.exports = {
  generateSubaddress,
  getBalance,
  checkPayment,
};
