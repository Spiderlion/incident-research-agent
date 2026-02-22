/**
 * Maps varying search results to the unified JSON schema.
 * @param {Object} item Raw data from the specific platform
 * @param {string} platform The origin platform ('youtube', 'google', 'news')
 * @returns {Object} Unified item schema
 */
function normalizeResult(item, platform) {
    const schema = {
        platform: platform,
        media_type: 'article', // Default, will override below
        title: '',
        media_url: '',
        thumbnail: null,
        source_link: '',
        timestamp: null,
        description: null,
        body: null,
    };

    switch (platform) {
        case 'google':
            schema.media_type = item.media_type || 'article'; // Could be 'image' if we extracted one
            schema.title = item.title || '';
            schema.media_url = item.media_url || '';
            schema.thumbnail = item.thumbnail || null;
            schema.source_link = item.link || '';
            schema.description = item.snippet || null;
            break;

        case 'youtube':
            schema.media_type = 'video';
            schema.title = item.title || '';
            // media_url will either be the direct stream or the embed fallback
            schema.media_url = item.media_url || item.embed_url || '';
            schema.thumbnail = item.thumbnail || null;
            schema.source_link = item.source_link || '';
            schema.timestamp = item.publishedAt || null;
            schema.description = item.description || null;
            break;

        case 'news':
            schema.media_type = 'article';
            schema.title = item.title || '';
            schema.source_link = item.url || '';
            schema.timestamp = item.date || null;
            schema.description = item.snippet || null;
            schema.thumbnail = item.thumbnail || null;
            schema.source = item.source || 'News Source';
            break;

        case 'google_images':
            schema.media_type = 'image';
            schema.title = item.title || '';
            schema.source_link = item.link || '';
            schema.media_url = item.media_url || '';
            schema.thumbnail = item.thumbnail || null;
            schema.source = item.source || 'Image Source';
            break;

        default:
            console.warn(`[NORMALIZE] Unknown platform type: ${platform}`);
    }

    return schema;
}

module.exports = { normalizeResult };
