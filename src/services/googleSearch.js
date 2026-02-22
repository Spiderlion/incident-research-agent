const axios = require('axios');
const config = require('../config');

/**
 * Searches Google using SerpApi. Extracts top 5 normal organic results and images.
 * @param {string} query Search query
 * @returns {Promise<Array>} Array of raw result objects for the normalizer
 */
async function search(query) {
    if (!config.apiKeys.serpapi) {
        console.warn('⚠️ [SEARCH] Skipping Google search: missing SerpApi key.');
        return [];
    }

    console.log(`[SEARCH] Querying Google (SerpApi) for: "${query}"`);

    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                q: query,
                api_key: config.apiKeys.serpapi,
                engine: 'google',
                num: 5 // Get top 5 results
            }
        });

        const organic_results = response.data.organic_results || [];
        const results = organic_results.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            media_type: item.thumbnail ? 'image' : 'article',
            thumbnail: item.thumbnail || null
        }));

        return results;
    } catch (error) {
        console.error('❌ [SEARCH] SerpApi error:', error.response?.data?.error || error.message);
        throw error;
    }
}

module.exports = { search };
