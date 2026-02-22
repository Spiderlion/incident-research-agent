const axios = require('axios');
const config = require('../config');

/**
 * Searches Google Images using SerpApi.
 * @param {string} query Search query
 * @returns {Promise<Array>} Array of raw image result objects for the normalizer
 */
async function search(query) {
    if (!config.apiKeys.serpapi) {
        console.warn('⚠️ [SEARCH] Skipping Image search: missing SerpApi key.');
        return [];
    }

    console.log(`[SEARCH] Querying Google Images (SerpApi) for: "${query}"`);

    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                q: query,
                api_key: config.apiKeys.serpapi,
                engine: 'google',
                tbm: 'isch', // Image search
                num: 10 // Get top 10 results
            }
        });

        const image_results = response.data.images_results || [];
        const results = image_results.slice(0, 10).map(item => ({
            title: item.title,
            link: item.link,
            media_type: 'image',
            media_url: item.original, // High-res image
            thumbnail: item.thumbnail,
            source: item.source
        }));

        return results;
    } catch (error) {
        console.error('❌ [SEARCH] SerpApi Image error:', error.response?.data?.error || error.message);
        // Do not throw so it doesn't crash the orchestrator
        return [];
    }
}

module.exports = { search };
