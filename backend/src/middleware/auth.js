const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================
// MIDDLEWARE DI AUTENTICAZIONE
// ============================================
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Token di autenticazione mancante'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token non valido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
        
        const user = await User.findById(decoded.userId || decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Utente non trovato'
            });
        }

        req.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role || 'user'
        };

        next();
    } catch (error) {
        console.error('Errore autenticazione:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Token non valido o scaduto'
        });
    }
};

// ============================================
// MIDDLEWARE DI AUTORIZZAZIONE
// ============================================
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Non autenticato'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Non hai i permessi necessari'
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize
};