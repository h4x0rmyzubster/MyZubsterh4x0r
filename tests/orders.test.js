// tests/orders.test.js
const request = require('supertest');
const app = require('../server');
const Order = require('../models/Order');

describe('📦 Test Ordini', () => {
  let authToken;
  let orderId;

  beforeEach(async () => {
    // Registra e ottieni token
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@test.com',
        password: 'Password123!',
        name: 'Test User'
      });
    authToken = res.body.token;
  });

  describe('POST /api/orders', () => {
    it('✅ Dovrebbe creare un ordine con dati validi', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { name: 'Prodotto Test', quantity: 2, price: 10 }
          ],
          total: 20,
          currency: 'XMR'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.order).toHaveProperty('id');
      expect(response.body.order.total).toBe(20);
      expect(response.body.order.status).toBe('pending');
      expect(response.body.order.userId).toBeDefined();

      orderId = response.body.order.id;
    });

    it('❌ Dovrebbe fallire senza token JWT', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          items: [{ name: 'Prodotto Test', quantity: 1, price: 10 }],
          total: 10
        })
        .expect(401);

      expect(response.body.error).toBe('Token mancante o formato non valido. Usa: Bearer <token>');
    });

    it('❌ Dovrebbe fallire se items è vuoto', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [],
          total: 0
        })
        .expect(400);

      expect(response.body.error).toBe('items deve essere un array non vuoto');
    });

    it('❌ Dovrebbe fallire se total non è positivo', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ name: 'Prodotto Test', quantity: 1, price: 10 }],
          total: -5
        })
        .expect(400);

      expect(response.body.error).toBe('total deve essere un numero positivo');
    });
  });

  describe('GET /api/orders/user/me', () => {
    beforeEach(async () => {
      // Crea un ordine
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ name: 'Prodotto Test', quantity: 1, price: 10 }],
          total: 10
        });
      orderId = res.body.order.id;
    });

    it('✅ Dovrebbe recuperare gli ordini dell utente', async () => {
      const response = await request(app)
        .get('/api/orders/user/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.orders).toBeInstanceOf(Array);
      expect(response.body.orders.length).toBeGreaterThan(0);
      expect(response.body.orders[0]._id).toBe(orderId);
    });

    it('❌ Dovrebbe fallire senza token', async () => {
      const response = await request(app)
        .get('/api/orders/user/me')
        .expect(401);

      expect(response.body.error).toBe('Token mancante o formato non valido. Usa: Bearer <token>');
    });
  });

  describe('PUT /api/orders/:orderId/cancel', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ name: 'Prodotto Test', quantity: 1, price: 10 }],
          total: 10
        });
      orderId = res.body.order.id;
    });

    it('✅ Dovrebbe annullare un ordine in stato pending', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.order.status).toBe('cancelled');
    });

    it('❌ Dovrebbe fallire se ordine non esiste', async () => {
      const fakeId = '60f7b3b5b5b5b5b5b5b5b5b5';
      const response = await request(app)
        .put(`/api/orders/${fakeId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Ordine non trovato');
    });
  });
});