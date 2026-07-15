// src/services/api.js
import axios from 'axios';

// FORZATO per sviluppo (per evitare problemi con .env)
const API_BASE_URL = 'http://localhost:5000/api';

// Crea istanza axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== CSRF TOKEN MANAGEMENT ==========
let csrfToken = localStorage.getItem('csrfToken');

export const fetchCsrfToken = async () => {
  try {
    const response = await api.get('/csrf-token');
    csrfToken = response.data.csrfToken;
    localStorage.setItem('csrfToken', csrfToken);
    return csrfToken;
  } catch (error) {
    console.error('Errore recupero CSRF token:', error);
    return null;
  }
};

// Interceptor per il token JWT
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      if (csrfToken) {
        config.headers['CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor per gestire errori di CSRF
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
      console.log('🔄 CSRF token scaduto, rinnovo...');
      await fetchCsrfToken();
      const config = error.config;
      config.headers['CSRF-Token'] = csrfToken;
      return api(config);
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ==========
export const register = (email, password, name) => 
  api.post('/auth/register', { email, password, name });

export const login = (email, password) => 
  api.post('/auth/login', { email, password });

export const getProfile = () => 
  api.get('/auth/profile');

export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('Refresh token non disponibile');
  }
  const response = await api.post('/auth/refresh', { refreshToken });
  const { token } = response.data;
  localStorage.setItem('token', token);
  return token;
};

// ========== ORDERS ==========
export const createOrder = (items, total, currency = 'XMR') => 
  api.post('/orders', { items, total, currency });

export const getOrders = () => 
  api.get('/orders/user/me');

export const getOrder = (orderId) => 
  api.get(`/orders/${orderId}`);

export const cancelOrder = (orderId) => 
  api.put(`/orders/${orderId}/cancel`);

// ========== PAYMENTS ==========
export const startPayment = (orderId, amount) => 
  api.post(`/orders/${orderId}/pay`, { amount });

export const getPaymentStatus = (paymentId) => 
  api.get(`/orders/payments/${paymentId}/status`);

export const getPaymentDetails = (orderId) => 
  api.get(`/orders/${orderId}/payment-details`);

export default api;