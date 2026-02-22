const googleSearch = require('./googleSearch');
const youtubeSearch = require('./youtubeSearch');
const newsScraper = require('./newsScraper');
const imageSearch = require('./imageSearch');
const { normalizeResult } = require('../utils/normalizer');

/**
 * Coordinates all search operations in parallel to save time.
 * If one fails, it gracefully captures the error and continues with the others.
 * @param {string} query User's natural language search query
 * @returns {Array} Array of normalized unified JSON results
 */
async function runAll(query) {
    console.log(`[ORCHESTRATOR] Starting parallel searches for: "${query}"`);

    // We wrap each service call in a try/catch so a single failure doesn't crash Promise.all
    const safeSearch = async (sourceName, searchFn) => {
        try {
            const results = await searchFn(query);
            console.log(`✅ [ORCHESTRATOR] ${sourceName} completed with ${results.length} results.`);
            return results;
        } catch (error) {
            console.error(`❌ [ORCHESTRATOR] ${sourceName} failed:`, error.message);
            return []; // Return empty array on failure so others can proceed
        }
    };

    const [googleData, youtubeData, newsData, imageData] = await Promise.all([
        safeSearch('Google Search', googleSearch.search),
        safeSearch('YouTube Search', youtubeSearch.search),
        safeSearch('News Scraper', newsScraper.scrape),
        safeSearch('Image Search', imageSearch.search)
    ]);

    // Normalize all results
    const normalizedResults = [
        ...googleData.map(item => normalizeResult(item, 'google')),
        ...youtubeData.map(item => normalizeResult(item, 'youtube')),
        ...newsData.map(item => normalizeResult(item, 'news')),
        ...imageData.map(item => normalizeResult(item, 'google_images'))
    ];

    return normalizedResults;
}

module.exports = { runAll };
