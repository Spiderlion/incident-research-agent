const searchOrchestrator = require('./searchOrchestrator');
const { GoogleGenAI } = require('@google/genai');
const config = require('../config');

const RELEVANCE_PROMPT = `You are a content strategy ranker. I am providing you with a specific Instagram Channel's Content DNA Profile, and a list of trending web search results.
Your job is to evaluate how relevant each search result is to the specific channel's DNA and format style.

Return ONLY a valid JSON array of objects. DO NOT wrap the output in markdown code blocks like \`\`\`json. DO NOT add any conversational text.

For each result, return this exact structure:
[
  {
    "url": "the original url of the matched context",
    "relevance_score": number between 1 and 10,
    "relevance_reason": "One sentence explaining why this fits or doesn't fit the channel's DNA.",
    "suggested_angle": "How this channel would uniquely cover this story based on their reel_style_guide."
  }
]`;

/**
 * Generates 3 highly targeted search queries marrying the channel's DNA keywords with current events.
 */
function buildQueriesFromDNA(dnaProfile) {
    if (!dnaProfile.search_keywords || dnaProfile.search_keywords.length === 0) {
        return [`${dnaProfile.primary_topics[0] || 'news'} trending today`];
    }

    // Pick 3 pseudo-random keywords from the profile
    const keywords = [...dnaProfile.search_keywords].sort(() => 0.5 - Math.random()).slice(0, 3);

    return [
        `${keywords[0]} latest news today`,
        `${keywords[1]} trending viral this week`,
        `${keywords[2]} recent update 2026`
    ];
}

/**
 * Main service to execute a channel-filtered web search.
 */
async function searchForChannel(dnaProfile) {
    console.log(`\n🕵️‍♂️ [CHANNEL-SEARCH] Initiating filtered search for channel: ${dnaProfile.channel}`);

    // 1. Build Targeted Queries
    const targetQueries = buildQueriesFromDNA(dnaProfile);
    console.log(`[CHANNEL-SEARCH] Generated target queries:`, targetQueries);

    // 2. Run standard Search Orchestrator for all queries concurrently
    const searchPromises = targetQueries.map(q => searchOrchestrator.runAll(q));
    const allResultsGroups = await Promise.allSettled(searchPromises);

    // 3. Flatten and deduplicate by URL
    const uniqueResultsMap = new Map();
    for (const group of allResultsGroups) {
        if (group.status === 'fulfilled') {
            for (const result of group.value) {
                if (result.source_link && !uniqueResultsMap.has(result.source_link)) {
                    uniqueResultsMap.set(result.source_link, result);
                }
            }
        }
    }
    const allResults = Array.from(uniqueResultsMap.values());
    console.log(`[CHANNEL-SEARCH] Gathered ${allResults.length} unique results from web across all queries.`);

    if (allResults.length === 0) return [];

    // 4. Send to Gemini for DNA Relevance Ranking
    if (!config.apiKeys.gemini) {
        console.warn(`⚠️ [CHANNEL-SEARCH] Missing GEMINI_API_KEY. Returning top 20 unranked results gracefully.`);
        return allResults.slice(0, 20);
    }

    const ai = new GoogleGenAI({ apiKey: config.apiKeys.gemini });

    // Map Down the payload to save massive context tokens
    const contextToScore = allResults.map(r => ({
        url: r.source_link,
        title: r.title,
        snippet: r.description || r.body || '',
        platform: r.platform
    }));

    const promptContext = `Channel DNA Profile:\n${JSON.stringify(dnaProfile, null, 2)}\n\nWeb Results to Score:\n${JSON.stringify(contextToScore, null, 2)}`;

    console.log(`[CHANNEL-SEARCH] Sending ${contextToScore.length} results to Gemini for relevance ranking...`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: [
                { role: 'user', parts: [{ text: RELEVANCE_PROMPT + '\n\n' + promptContext }] }
            ],
            config: {
                temperature: 0.2, // Low temp for analytical ranking
                responseMimeType: 'application/json'
            }
        });

        const scoredResults = JSON.parse(response.text);

        // 5. Merge scores back into the main results list
        const enrichedResults = [];
        for (const sr of scoredResults) {
            // Only keep results scoring 5 or higher
            if (sr.relevance_score >= 5) {
                const originalResult = uniqueResultsMap.get(sr.url);
                if (originalResult) {
                    enrichedResults.push({
                        ...originalResult,
                        relevance_score: sr.relevance_score,
                        relevance_reason: sr.relevance_reason,
                        suggested_angle: sr.suggested_angle
                    });
                }
            }
        }

        // 6. Sort by highest score first, slice top 20
        enrichedResults.sort((a, b) => b.relevance_score - a.relevance_score);
        console.log(`✅ [CHANNEL-SEARCH] Successfully filtered down to ${enrichedResults.length} highly relevant items for ${dnaProfile.channel}.`);

        return enrichedResults.slice(0, 20);

    } catch (error) {
        console.error(`❌ [CHANNEL-SEARCH] Gemini Ranking failed:`, error.message);
        console.warn(`[CHANNEL-SEARCH] Returning unranked results as fallback.`);
        return allResults.slice(0, 20);
    }
}

module.exports = {
    searchForChannel
};
