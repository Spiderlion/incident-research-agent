const config = require('../config');

/**
 * Validates the presence of essentially required environment variables at startup.
 * Logs warnings but does not necessarily crash the process, ensuring resilience.
 */
function validateEnvironment() {
    if (!config.apiKeys.serpapi) {
        console.warn('⚠️ WARNING: SERPAPI_KEY is not set. Google search will not work.');
    } else {
        console.log('✅ SERPAPI_KEY is configured.');
    }

    if (!config.apiKeys.youtube) {
        console.warn('⚠️ WARNING: YOUTUBE_API_KEY is not set. YouTube search will not work.');
    } else {
        console.log('✅ YOUTUBE_API_KEY is configured.');
    }

    if (!config.apiKeys.gemini && !config.apiKeys.openai) {
        console.warn('ℹ️ INFO: No AI API keys (Gemini/OpenAI) are set. AI enhancements will be disabled.');
    }
}

module.exports = { validateEnvironment };
