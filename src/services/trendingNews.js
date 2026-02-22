const axios = require('axios');
const config = require('../config');

// Modular configuration for time periods
// Adding new filters here will instantly support them via the ?period= custom parameter
const TIME_PERIODS = {
    'today': 'qdr:d',
    'yesterday': 'qdr:d', // SerpApi doesn't have an exact "yesterday" via qdr, typically we use 'd' (past 24h). We could use custom date ranges if strictly needed.
    '3days': 'qdr:w', // Approximation via week
    'week': 'qdr:w',
    'month': 'qdr:m',
    // Future filters to be added here
};

/**
 * Fetches top trending news using SerpApi Google News.
 * @param {string} period The time filter (default: today)
 * @returns {Promise<Array>} Array of trending news objects
 */
async function fetchTrending(period = 'today') {
    if (!config.apiKeys.serpapi) {
        console.warn('⚠️ [TRENDING] Missing SerpApi key.');
        return [];
    }

    const tbsValue = TIME_PERIODS[period] || TIME_PERIODS['today'];
    console.log(`[TRENDING] Fetching top trending news for period: ${period} (tbs: ${tbsValue})`);

    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                q: 'news', // Query for general news trending
                api_key: config.apiKeys.serpapi,
                engine: 'google',
                tbm: 'nws', // News search
                tbs: tbsValue, // Time filter
                num: 20 // Get top 20 trending
            }
        });

        const news_results = response.data.news_results || [];
        const results = news_results.map((item, index) => ({
            rank: index + 1,
            title: item.title,
            link: item.link,
            source: item.source,
            date: item.date,
            snippet: item.snippet,
            thumbnail: item.thumbnail || null
        }));

        return results;
    } catch (error) {
        console.error('❌ [TRENDING] SerpApi News error:', error.response?.data?.error || error.message);
        throw error;
    }
}

module.exports = { fetchTrending };
