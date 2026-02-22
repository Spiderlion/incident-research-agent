const trendingNews = require('../src/services/trendingNews');
const config = require('../src/config');

// Vercel Serverless Function Handler
module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Vercel deployment keys check
    if (process.env.VERCEL) {
        if (!config.apiKeys.serpapi) {
            console.error('❌ [VERCEL] Missing required environment variables: SERPAPI_KEY');
            return res.status(500).json({ error: 'Missing required environment variable: SERPAPI_KEY. Please configure them in the Vercel dashboard.' });
        }
    }

    try {
        const period = req.query.period || 'today';
        console.log(`\n📈 [API-VERCEL] Fetching trending news for period: ${period}`);

        const results = await trendingNews.fetchTrending(period);

        console.log(`✅ [API-VERCEL] Trending news fetched successfully. Return ${results.length} items.`);
        return res.status(200).json(results);
    } catch (error) {
        console.error(`❌ [API-VERCEL] Error fetching trending news:`, error.message);
        return res.status(500).json({ error: 'Internal server error fetching trending news.' });
    }
};
