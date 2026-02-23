const { ApifyClient } = require('apify-client');
const { GoogleGenAI } = require('@google/genai');
const config = require('../config');
const fs = require('fs/promises');
const path = require('path');

const PROFILES_DIR = path.join(__dirname, '../../data/channel-profiles');

// Ensure the data directory exists
async function ensureDir() {
    try {
        await fs.mkdir(PROFILES_DIR, { recursive: true });
    } catch (err) {
        console.error('Error creating profiles directory:', err);
    }
}

const SYSTEM_PROMPT = `You are a content strategy analyst. Analyse these Instagram posts from a single creator and extract their content DNA.
Return ONLY a valid JSON object with this exact structure. DO NOT wrap the output in markdown code blocks like \`\`\`json. DO NOT add any conversational text.

{
  "channel": "username",
  "analysed_at": "ISO8601",
  "primary_topics": ["array of 5-8 core topics this channel covers"],
  "search_keywords": ["array of 15-20 specific search keywords and phrases that represent what this channel covers — these will be used to search Google and YouTube for trending content"],
  "content_tone": "one of: educational | entertainment | news | opinion | investigative | inspirational",
  "format_style": "describe in 2 sentences how this channel presents information — fast cuts or slow, text-heavy or visual, serious or casual, etc.",
  "target_audience": "describe the audience in 1 sentence",
  "avoid_topics": ["array of topics that would NOT fit this channel based on what is absent from their content"],
  "reel_style_guide": {
    "hook_pattern": "describe how this channel typically opens a reel based on caption analysis",
    "structure": "describe the typical content flow",
    "cta_style": "describe how they typically end posts",
    "tone_words": ["5-6 adjectives describing the voice"]
  }
}`;

async function scrapeInstagramPosts(username) {
    if (!config.apify.token) {
        throw new Error("Missing APIFY_API_TOKEN environment variable.");
    }
    const client = new ApifyClient({ token: config.apify.token });

    const input = {
        usernames: [username],
        resultsLimit: 20,
    };

    console.log(`[CHANNEL-DNA] Starting Apify scrape for ${username}...`);
    const run = await client.actor(config.apify.actorId).call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`[CHANNEL-DNA] Apify returned ${items.length} posts for ${username}.`);

    return items.map(p => ({
        caption: p.caption || '',
        hashtags: p.hashtags || [],
        type: p.type || 'unknown',
        likes: p.likesCount || 0,
        comments: p.commentsCount || 0,
        views: p.videoViewCount || 0,
        posted_at: p.timestamp || ''
    }));
}

async function analyzeWithGemini(username, posts) {
    if (!config.apiKeys.gemini) {
        throw new Error("Missing GEMINI_API_KEY environment variable.");
    }

    const ai = new GoogleGenAI({ apiKey: config.apiKeys.gemini });

    const promptContext = `Channel: ${username}\n\nRecent Posts Data:\n` + JSON.stringify(posts, null, 2);

    console.log(`[CHANNEL-DNA] Sending ${posts.length} posts to Gemini for DNA analysis...`);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + promptContext }] }
        ],
        config: {
            temperature: 0.2, // Low temp for structured analysis
            responseMimeType: 'application/json'
        }
    });

    const dnaProfile = JSON.parse(response.text);
    dnaProfile.channel = username; // Ensure username matches exactly
    dnaProfile.analysed_at = new Date().toISOString();
    return dnaProfile;
}

/**
 * Retrieves the DNA profile for a channel, either from cache or by analyzing fresh.
 */
async function getChannelDNA(username, forceRefresh = false) {
    await ensureDir();
    const cachePath = path.join(PROFILES_DIR, `${username}.json`);

    if (!forceRefresh) {
        try {
            const cachedData = await fs.readFile(cachePath, 'utf8');
            const profile = JSON.parse(cachedData);

            const analysedAt = new Date(profile.analysed_at);
            const now = new Date();
            const hoursSinceAnalysis = (now - analysedAt) / (1000 * 60 * 60);

            if (hoursSinceAnalysis < config.channels.cacheHours) {
                console.log(`[CHANNEL-DNA] Loaded cached DNA profile for ${username} (${hoursSinceAnalysis.toFixed(1)} hours old).`);
                return profile;
            } else {
                console.log(`[CHANNEL-DNA] Cache for ${username} is older than ${config.channels.cacheHours} hours. Refreshing...`);
            }
        } catch (err) {
            console.log(`[CHANNEL-DNA] No valid cache found for ${username}. Generating fresh profile...`);
        }
    } else {
        console.log(`[CHANNEL-DNA] Force refresh requested for ${username}.`);
    }

    try {
        const posts = await scrapeInstagramPosts(username);

        if (posts.length === 0) {
            throw new Error(`Apify returned 0 posts for ${username}`);
        }

        const profile = await analyzeWithGemini(username, posts);

        // Save to cache
        await fs.writeFile(cachePath, JSON.stringify(profile, null, 2));
        console.log(`✅ [CHANNEL-DNA] Successfully generated and cached profile for ${username}`);

        return profile;
    } catch (error) {
        console.error(`❌ [CHANNEL-DNA] Error building profile for ${username}:`, error.message);

        // Return a gracefully degraded dummy profile if APIs completely fail
        // Never break the search experience
        return {
            channel: username,
            analysed_at: new Date().toISOString(),
            primary_topics: ["Business", "Startups", "News"],
            search_keywords: ["business news today", "startup funding 2026", "brand strategy", "technology trends latest"],
            content_tone: "educational",
            format_style: "Fallback dynamic format based on current events.",
            target_audience: "Professionals and entrepreneurs",
            avoid_topics: [],
            reel_style_guide: {
                "hook_pattern": "Starts with a bold statement",
                "structure": "Standard hook -> context -> value",
                "cta_style": "Follow for more",
                "tone_words": ["informative", "fast-paced"]
            }
        };
    }
}

module.exports = {
    getChannelDNA
};
