const searchOrchestrator = require('../src/services/searchOrchestrator');
const aiSummary = require('../src/services/aiSummary');
const config = require('../src/config');

// Vercel Serverless Function Handler
module.exports = async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Vercel deployment keys check
    if (process.env.VERCEL) {
        if (!config.apiKeys.serpapi || !config.apiKeys.gemini) {
            console.error('❌ [VERCEL] Missing required environment variables: SERPAPI_KEY or GEMINI_API_KEY');
            return res.status(500).json({ error: 'Missing required environment variable: SERPAPI_KEY or GEMINI_API_KEY. Please configure them in the Vercel dashboard.' });
        }
    }

    try {
        const { query } = req.body;

        if (!query) {
            console.warn('⚠️ [API] Missing query in request body.');
            return res.status(400).json({ error: 'Query is required.' });
        }

        console.log(`\n🔍 [API-VERCEL] Received research query: "${query}"`);

        // Orchestrate parallel searches
        const results = await searchOrchestrator.runAll(query);

        // Build context from results for the AI summary
        console.log(`🧠 [API-VERCEL] Building context for AI summary...`);
        let contextText = '';

        // Take top 5 textual snippets across all results
        const textResults = results.filter(r => r.description || r.title).slice(0, 10);
        textResults.forEach(r => {
            contextText += `Source: ${r.source || r.platform}\n`;
            contextText += `Title: ${r.title}\n`;
            if (r.timestamp) contextText += `Date: ${r.timestamp}\n`;
            if (r.description) contextText += `Snippet: ${r.description}\n`;
            contextText += `---\n`;
        });

        // Generate the structured AI summary
        const summary = await aiSummary.generateSummary(query, contextText);

        console.log(`✅ [API-VERCEL] Query "${query}" completed successfully. Returning ${results.length} total results.`);
        return res.status(200).json({ results, summary });

    } catch (error) {
        console.error(`❌ [API-VERCEL] Error processing research request:`, error.message);
        // Never crash the request
        return res.status(500).json({ error: 'Internal server error during research orchestration.' });
    }
};
