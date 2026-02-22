const express = require('express');
const router = express.Router();
const trendingNews = require('../services/trendingNews');
const config = require('../config');

router.get('/', async (req, res) => {
    // Vercel deployment keys check
    if (process.env.VERCEL) {
        if (!config.apiKeys.serpapi) {
            console.error('❌ [VERCEL] Missing required environment variables: SERPAPI_KEY');
            return res.status(500).json({ error: 'Missing required environment variable: SERPAPI_KEY. Please configure them in the Vercel dashboard.' });
        }
    }

    try {
        const period = req.query.period || 'today';
        console.log(`\n📈 [API] Fetching trending news for period: ${period}`);

        const results = await trendingNews.fetchTrending(period);

        console.log(`✅ [API] Trending news fetched successfully. Return ${results.length} items.`);
        return res.status(200).json(results);
    } catch (error) {
        console.error(`❌ [API] Error fetching trending news:`, error.message);
        return res.status(500).json({ error: 'Internal server error fetching trending news.' });
    }
});

module.exports = router;
