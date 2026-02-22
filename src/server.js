const express = require('express');
const path = require('path');
const cors = require('cors');
const { validateEnvironment } = require('./utils/validator');
const config = require('./config');
const researchHandler = require('../api/research');
const trendingHandler = require('../api/trending');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, '../public'))); // Serve the frontend dashboard

// Validate .env keys on startup
validateEnvironment();

// Routes (Mapped to Serverless Functions)
app.post('/api/research', researchHandler);
app.get('/api/trending', trendingHandler);

// Basic health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Incident Research Agent is running.' });
});

// Start Express server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`\n🚀 [SERVER] Starting in ${config.nodeEnv} mode...`);
    console.log(`✅ [SERVER] Listening at http://localhost:${PORT}`);
});
