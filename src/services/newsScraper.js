const axios = require('axios');
const config = require('../config');

/**
 * Searches Google News using SerpApi.
 * @param {string} query Search query
 * @returns {Promise<Array>} Array of raw news objects for the normalizer
 */
async function scrape(query) {
    if (!config.apiKeys.serpapi) {
        console.warn('⚠️ [SEARCH] Skipping News search: missing SerpApi key.');
        return [];
    }

    console.log(`[SEARCH] Querying Google News (SerpApi) for: "${query}"`);

    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                q: query,
                api_key: config.apiKeys.serpapi,
                engine: 'google',
                tbm: 'nws', // News search
                num: 5 // Get top 5 results
            }
        });

        const news_results = response.data.news_results || [];
        const results = news_results.map(item => ({
            title: item.title,
            url: item.link,
            source: item.source,
            date: item.date,
            snippet: item.snippet,
            thumbnail: item.thumbnail || null
        }));

        return results;
    } catch (error) {
        console.error('❌ [SEARCH] SerpApi News error:', error.response?.data?.error || error.message);
        return [];
    }
}

module.exports = { scrape };
