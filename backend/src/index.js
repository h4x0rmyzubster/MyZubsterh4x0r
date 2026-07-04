console.log('🚀 Avvio del backend...');

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'myzubster-backend' });
});

// ============ ROTTA GROQ (mock) ============
app.post('/api/test/groq', async (req, res) => {
    try {
        const { title, category } = req.body;
        if (!title || !category) {
            return res.status(400).json({ error: 'Titolo e categoria sono obbligatori' });
        }
        res.json({ 
            success: true, 
            description: `Servizio professionale di "${title}" (categoria: ${category}). Qualità e affidabilità garantite.`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ROTTA COMPETENZE ============
const skillRoutes = require('./routes/skillRoutes');
app.use('/api/skills', skillRoutes);

// ============ ROTTA PRENOTAZIONI ============
const bookingRoutes = require('./routes/bookings');
app.use('/api/bookings', bookingRoutes);

// ============ AVVIA IL SERVER ============
app.listen(port, () => {
    console.log(`✅ Server avviato sulla porta ${port}`);
    console.log(`🌐 http://localhost:${port}/health`);
});