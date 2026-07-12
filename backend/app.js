// =============================================
// MYZUBSTER - BACKEND SERVER (VERSIONE COMPLETA)
// =============================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARE - CORS CORRETTO
// =============================================

// Abilita CORS per tutte le origini (sviluppo)
app.use(cors());
app.options('*', cors()); // Gestisce le richieste preflight OPTIONS

// Middleware per forzare gli header CORS manualmente
app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Se è una richiesta OPTIONS (preflight), rispondi immediatamente
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// =============================================
// DATABASE MOCK (IN MEMORIA PER TEST)
// =============================================

const users = [];
let userIdCounter = 1;
const bookings = [];
let bookingIdCounter = 1;
const reviews = [];
let reviewIdCounter = 1;

// =============================================
// FEE SERVICE MOCK (per /fee/* routes)
// =============================================

console.log('⚖️ Inizializzazione Fee Service in modalità MOCK...');

const feeService = {
    getCurrentFeeConfig: async () => ({
        baseFee: 200,
        variableRate: 50,
        discountThreshold: 1000,
        discountRate: 100,
        governanceToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
    }),
    calculateAffineFee: async (amount, userVolume = 0) => {
        const fee = amount * 0.02;
        return {
            amount: amount / 100,
            userVolume: userVolume / 100,
            baseFee: fee / 100,
            variableFee: 0,
            totalFee: fee / 100,
            discount: 0,
            feePercentage: 2,
            config: await feeService.getCurrentFeeConfig()
        };
    },
    calculateDistribution: async (totalFee) => {
        const feeInCents = totalFee * 100;
        return {
            community: feeInCents * 0.40,
            developers: feeInCents * 0.25,
            governance: feeInCents * 0.20,
            treasury: feeInCents * 0.15,
            total: feeInCents,
            percentages: { community: 0.40, developers: 0.25, governance: 0.20, treasury: 0.15 }
        };
    },
    monitorFeeChanges: async () => {
        console.log('👁️ Monitoraggio fee: mock mode');
        return true;
    },
    createProposal: async (description, amount) => {
        console.log(`📝 Proposta creata (mock): ${description} - ${amount}`);
        return { success: true, proposalId: Date.now() };
    }
};

console.log('✅ Fee Service inizializzato in modalità MOCK');
console.log('📊 Fee: 2% (simulata)');

// =============================================
// ROUTE: REGISTRAZIONE
// =============================================

app.post('/api/auth/register', (req, res) => {
    console.log('📝 Richiesta di registrazione ricevuta:', req.body);
    
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Tutti i campi sono obbligatori'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                error: 'Le password non coincidono'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La password deve essere lunga almeno 6 caratteri'
            });
        }

        const existing = users.find(u => u.email === email);
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Email già registrata'
            });
        }

        const newUser = {
            id: userIdCounter++,
            name,
            email,
            password,
            role: 'user',
            skills: [],
            rating: 0,
            reviews: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        users.push(newUser);

        console.log('✅ Utente registrato:', newUser.email);
        console.log(`👥 Totale utenti: ${users.length}`);

        const token = `mock_jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    skills: newUser.skills,
                    rating: newUser.rating,
                    createdAt: newUser.createdAt
                },
                token
            }
        });

    } catch (error) {
        console.error('❌ Errore registrazione:', error);
        res.status(500).json({
            success: false,
            error: 'Errore interno del server'
        });
    }
});

// =============================================
// ROUTE: LOGIN
// =============================================

app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Tentativo di login:', req.body.email);
    
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email e password sono obbligatori'
            });
        }

        const user = users.find(u => u.email === email);
        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                error: 'Credenziali non valide'
            });
        }

        console.log('✅ Login effettuato:', user.email);

        const token = `mock_jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    skills: user.skills || [],
                    rating: user.rating || 0,
                    createdAt: user.createdAt
                },
                token
            }
        });

    } catch (error) {
        console.error('❌ Errore login:', error);
        res.status(500).json({
            success: false,
            error: 'Errore interno del server'
        });
    }
});

// =============================================
// ROUTE: PROFILO UTENTE
// =============================================

app.get('/api/users/profile', (req, res) => {
    try {
        const user = users[users.length - 1];
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utente non trovato'
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                skills: user.skills || [],
                rating: user.rating || 0,
                reviews: user.reviews || [],
                createdAt: user.createdAt,
                updatedAt: user.updatedAt || user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Errore get profile:', error);
        res.status(500).json({ success: false, error: 'Errore interno' });
    }
});

// =============================================
// ROUTE: LISTA UTENTI
// =============================================

app.get('/api/users', (req, res) => {
    try {
        res.json({
            success: true,
            data: users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role || 'user',
                skills: u.skills || [],
                rating: u.rating || 0
            }))
        });
    } catch (error) {
        console.error('❌ Errore get users:', error);
        res.status(500).json({ success: false, error: 'Errore interno' });
    }
});

// =============================================
// ROUTE: UTENTE BY ID
// =============================================

app.get('/api/users/:id', (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utente non trovato'
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                skills: user.skills || [],
                rating: user.rating || 0,
                reviews: user.reviews || [],
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Errore get user:', error);
        res.status(500).json({ success: false, error: 'Errore interno' });
    }
});

// =============================================
// ROUTE: SKILLS
// =============================================

app.post('/api/skills', (req, res) => {
    try {
        const { userId, skill } = req.body;
        
        if (!userId || !skill) {
            return res.status(400).json({
                success: false,
                error: 'userId e skill sono obbligatori'
            });
        }

        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utente non trovato'
            });
        }

        if (!user.skills) user.skills = [];
        if (!user.skills.includes(skill)) {
            user.skills.push(skill);
            user.updatedAt = new Date().toISOString();
        }

        res.json({
            success: true,
            data: { skills: user.skills }
        });

    } catch (error) {
        console.error('❌ Errore add skill:', error);
        res.status(500).json({ success: false, error: 'Errore interno' });
    }
});

app.get('/api/skills/:userId', (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utente non trovato'
            });
        }

        res.json({
            success: true,
            data: { skills: user.skills || [] }
        });

    } catch (error) {
        console.error('❌ Errore get skills:', error);
        res.status(500).json({ success: false, error: 'Errore interno' });
    }
});

app.get('/api/skills', (req, res) => {
    try {
        const allSkills = new Set();
        users.forEach(u => {
            if (u.skills) u.skills.forEach(s => allSkills.add(s));
        });

        res.json({
            success: true,
            data: Array.from(allSkills)
        });

    } catch (error) {
        console.error('❌ Errore get all skills:', error);
        res.status(500).json({ success: false, error: 'Errore interno' });
    }
});

// =============================================
// ROUTE: BOOKINGS (PRENOTAZIONI)
// =============================================

app.post('/api/bookings', (req, res) => {
    try {
        const { clientId, professionalId, skill, date, description } = req.body;

        if (!clientId || !professionalId || !skill || !date) {
            return res.status(400).json({
                success: false,
                error: 'Campi obbligatori mancanti'
            });
        }

        const newBooking = {
            id: bookingIdCounter++,
            clientId,
            professionalId,
            skill,
            date,
            description: description || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        bookings.push(newBooking);

        res.status(201).json({
            success: true,
            data: newBooking
        });

    } catch (error) {
        console.error('❌ Errore create booking:', error);
        res.status(500).json({ success: false, error: 'Errore interno' });
    }
});

app.get('/api/bookings', (req, res) => {
    try {
        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('❌ Errore get bookings:', error);
        res.status(500).json({ success: false, error: 'Errore interno' });
    }
});

// =============================================
// ROUTE: RECENSIONI
// =============================================

app.post('/api/reviews', (req, res) => {
    try {
        const { targetId, authorId, rating, text } = req.body;

        if (!targetId || !authorId || !rating || !text) {
            return res.status(400).json({
                success: false,
                error: 'Campi obbligatori mancanti'
            });
        }

        const newReview = {
            id: reviewIdCounter++,
            targetId,
            authorId,
            rating,
            text,
            createdAt: new Date().toISOString()
        };

        reviews.push(newReview);

        const targetUser = users.find(u => u.id === targetId);
        if (targetUser) {
            if (!targetUser.reviews) targetUser.reviews = [];
            targetUser.reviews.push(newReview);
            
            const totalRating = targetUser.reviews.reduce((sum, r) => sum + r.rating, 0);
            targetUser.rating = Math.round((totalRating / targetUser.reviews.length) * 10) / 10;
        }

        res.status(201).json({
            success: true,
            data: newReview
        });

    } catch (error) {
        console.error('❌ Errore create review:', error);
        res.status(500).json({ success: false, error: 'Errore interno' });
    }
});

app.get('/api/reviews/:targetId', (req, res) => {
    try {
        const targetId = parseInt(req.params.targetId);
        const userReviews = reviews.filter(r => r.targetId === targetId);

        res.json({
            success: true,
            data: userReviews
        });

    } catch (error) {
        console.error('❌ Errore get reviews:', error);
        res.status(500).json({ success: false, error: 'Errore interno' });
    }
});

// =============================================
// ROUTE: FEE CONFIG
// =============================================

app.get('/api/fee/config', async (req, res) => {
    try {
        const config = await feeService.getCurrentFeeConfig();
        res.json({
            success: true,
            data: config,
            mode: 'mock'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/fee/calculate', async (req, res) => {
    try {
        const { amount, userVolume = 0 } = req.body;
        const result = await feeService.calculateAffineFee(amount, userVolume);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =============================================
// ROUTE: PAGAMENTO
// =============================================

app.post('/api/payment/process', async (req, res) => {
    try {
        const { bookingId, amount, userAddress, userVolume = 0 } = req.body;

        if (!bookingId || !amount || !userAddress) {
            return res.status(400).json({
                success: false,
                error: 'Campi obbligatori: bookingId, amount, userAddress'
            });
        }

        const feeInfo = await feeService.calculateAffineFee(amount, userVolume);
        const distribution = await feeService.calculateDistribution(feeInfo.totalFee);
        const netAmount = amount - (feeInfo.totalFee * 100);

        res.json({
            success: true,
            data: {
                bookingId,
                amount: amount / 100,
                netAmount: netAmount / 100,
                feeInfo,
                distribution,
                txHash: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                moneroAddress: `4A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7B8C9D0E`,
                status: 'pending',
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Errore payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =============================================
// ROUTE: GOVERNANCE
// =============================================

app.post('/api/governance/proposal', async (req, res) => {
    try {
        const { description, amount } = req.body;
        const result = await feeService.createProposal(description, amount);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =============================================
// ROUTE: NOTIFICHE
// =============================================

const notifications = [];

app.get('/api/notifications', (req, res) => {
    res.json({ success: true, data: notifications });
});

app.post('/api/notifications', (req, res) => {
    const { userId, message, type } = req.body;
    const notif = {
        id: notifications.length + 1,
        userId,
        message,
        type: type || 'info',
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.push(notif);
    res.status(201).json({ success: true, data: notif });
});

// =============================================
// ROUTE: HEALTH CHECK
// =============================================

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        users: users.length,
        bookings: bookings.length,
        reviews: reviews.length,
        features: {
            feeDecentralization: true,
            governance: true,
            moneroIntegration: process.env.MONERO_RPC_URL ? true : false
        }
    });
});

// =============================================
// ROUTE 404 - NOT FOUND
// =============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Endpoint non trovato: ${req.method} ${req.url}`
    });
});

// =============================================
// ERROR HANDLER GLOBALE
// =============================================

app.use((err, req, res, next) => {
    console.error('❌ Errore globale:', err.stack);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Errore interno del server' 
            : err.message
    });
});

// =============================================
// AVVIO DEL SERVER
// =============================================

app.listen(PORT, () => {
    console.log('========================================');
    console.log(`✅ Server avviato su http://localhost:${PORT}`);
    console.log(`❤️ Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 CORS abilitato per: http://localhost:3001`);
    console.log(`👥 Utenti in memoria: ${users.length}`);
    console.log(`📊 Fee: 2% (mock)`);
    console.log('========================================');
});

// =============================================
// EXPORT PER TEST
// =============================================

module.exports = app;