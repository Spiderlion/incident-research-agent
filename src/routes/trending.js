const express = require('express');
const router = express.Router();
const trendingNews = require('../services/trendingNews');

router.get('/', async (req, res) => {
    try {
        const period = req.query.period || 'today';
        console.log(`\n📈 [API] Received trending request for period: "${period}"`);

        const results = await trendingNews.fetchTrending(period);

        console.log(`✅ [API] Trending query completed. Returning ${results.length} total results.`);
        return res.status(200).json(results);
    } catch (error) {
        console.error(`❌ [API] Error fetching trending news:`, error.message);
        return res.status(500).json({ error: 'Internal server error fetching trending news.' });
    }
});

module.exports = router;
