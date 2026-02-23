const express = require('express');
const path = require('path');
const cors = require('cors');
const { validateEnvironment } = require('./utils/validator');
const config = require('./config');
const researchRoute = require('./routes/research');
const trendingRoute = require('./routes/trending');
const channelRoute = require('./routes/channel');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, '../public'))); // Serve the frontend dashboard

// Validate .env keys on startup
validateEnvironment();

// Routes
app.use('/api/research', researchRoute);
app.use('/api/trending', trendingRoute);
app.use('/api/channel', channelRoute);

// Basic health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Incident Research Agent is running.' });
});

// Start Express server locally or export for Vercel
const PORT = config.port || 3000;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n🚀 [SERVER] Starting in ${config.nodeEnv} mode...`);
        console.log(`✅ [SERVER] Listening at http://localhost:${PORT}`);
    });
}

// Export the Express app as a Serverless Function handler
module.exports = app;
