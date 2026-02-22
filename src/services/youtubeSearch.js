const { google } = require('googleapis');
const config = require('../config');
const { extractMedia } = require('./mediaExtractor');

const youtube = google.youtube({
    version: 'v3',
    auth: config.apiKeys.youtube
});

/**
 * Searches YouTube for top 5 videos and attempts to extract direct media streams.
 * @param {string} query Search query
 * @returns {Promise<Array>} Array of raw video objects for the normalizer
 */
async function search(query) {
    if (!config.apiKeys.youtube) {
        console.warn('⚠️ [SEARCH] Skipping YouTube search: missing API key.');
        return [];
    }

    console.log(`[SEARCH] Querying YouTube Data API for: "${query}"`);

    try {
        const response = await youtube.search.list({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: 5
        });

        const items = response.data.items || [];

        // Process all videos concurrently to try to extract direct URLs using yt-dlp
        const extractionPromises = items.map(async (item) => {
            const videoId = item.id.videoId;
            const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            const snippet = item.snippet;

            // Attempt to extract the stream URL with the yt-dlp wrapper service
            const directUrl = await extractMedia(watchUrl);

            return {
                videoId,
                title: snippet.title,
                description: snippet.description,
                thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
                publishedAt: snippet.publishedAt,
                source_link: watchUrl,
                embed_url: embedUrl,
                media_url: directUrl || embedUrl // Fallback to embed if extraction fails as per requirements
            };
        });

        const extractedResults = await Promise.all(extractionPromises);
        return extractedResults;

    } catch (error) {
        console.error('❌ [SEARCH] YouTube API error:', error.message);
        throw error;
    }
}

module.exports = { search };
