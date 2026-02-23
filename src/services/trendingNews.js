const config = require('../config');
const channelDNA = require('./channelDNA');

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
 * @param {string} channel The channel username (default: 'all')
 * @returns {Promise<Array>} Array of trending news objects
 */
async function fetchTrending(period = 'today', channel = 'all') {
    if (!config.apiKeys.serpapi) {
        console.warn('⚠️ [TRENDING] Missing SerpApi key.');
        return [];
    }

    const tbsValue = TIME_PERIODS[period] || TIME_PERIODS['today'];
    let searchQuery = 'news'; // Default global news

    if (channel !== 'all') {
        try {
            // Fetch cached DNA profile to get keywords/topics
            const profile = await channelDNA.getChannelDNA(channel);
            if (profile && profile.primary_topics && profile.primary_topics.length > 0) {
                // Combine top 2 topics into a broad trending search
                const topics = profile.primary_topics.slice(0, 2).join(' OR ');
                searchQuery = `(${topics}) news`;
                console.log(`[TRENDING] Contextualizing search for @${channel} with topics: ${topics}`);
            }
        } catch (e) {
            console.error(`[TRENDING] Could not fetch DNA for ${channel}, falling back to general news.`);
        }
    }

    console.log(`[TRENDING] Fetching top trending news for period: ${period} (tbs: ${tbsValue}, q: ${searchQuery})`);

    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                q: searchQuery, // Dynamic query based on channel
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
