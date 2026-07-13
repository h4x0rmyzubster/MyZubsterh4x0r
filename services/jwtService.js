// services/jwtService.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'myzubster_super_secret_key_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class JWTService {
  // Genera un token per l'utente
  generateToken(userId, email, role) {
    return jwt.sign(
      { userId, email, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verifica il token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Decodifica il token (senza verificare)
  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = new JWTService();