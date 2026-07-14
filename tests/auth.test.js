// tests/auth.test.js
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('🔐 Test Autenticazione', () => {
  
  describe('POST /api/auth/register', () => {
    it('✅ Dovrebbe registrare un nuovo utente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Password123!',
          name: 'Test User'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.email).toBe('test@test.com');
      expect(response.body.user.name).toBe('Test User');
    });

    it('❌ Dovrebbe fallire se manca email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'Password123!',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.error).toBe('Dati mancanti. Richiesti: email, password, name');
    });

    it('❌ Dovrebbe fallire se email già registrata', async () => {
      // Crea un utente
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Password123!',
          name: 'Test User'
        });

      // Tenta di registrarlo di nuovo
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Password123!',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.error).toBe('Email già registrata');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crea un utente prima del login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Password123!',
          name: 'Test User'
        });
    });

    it('✅ Dovrebbe fare login con credenziali corrette', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.email).toBe('test@test.com');
    });

    it('❌ Dovrebbe fallire se email non esiste', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!'
        })
        .expect(401);

      expect(response.body.error).toBe('Credenziali non valide');
    });

    it('❌ Dovrebbe fallire se password errata', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'WrongPassword!'
        })
        .expect(401);

      expect(response.body.error).toBe('Credenziali non valide');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Password123!',
          name: 'Test User'
        });
      refreshToken = res.body.refreshToken;
    });

    it('✅ Dovrebbe rinnovare il token con refresh token valido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('❌ Dovrebbe fallire se refresh token mancante', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(401);

      expect(response.body.error).toBe('Refresh token mancante');
    });

    it('❌ Dovrebbe fallire se refresh token non valido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(403);

      expect(response.body.error).toBe('Refresh token non valido o scaduto');
    });
  });
});