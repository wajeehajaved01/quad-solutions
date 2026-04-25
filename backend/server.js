const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));

// ── Health check ────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: 'Quad Solutions API running ✅' }));

// ── DB + Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('❌ DB connection failed:', err.message);
        process.exit(1);
    });