const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');
const config = require('../config');

// System prompt to enforce the JSON structure output and neutral tone
const SYSTEM_PROMPT = `You are a professional incident analyst. Your task is to summarize real-time incident data into a factual, neutral briefing.
Extract exactly the following information and output ONLY a valid JSON object matching the schema below. DO NOT wrap the output in markdown code blocks like \`\`\`json. DO NOT add any conversational text.

Required JSON Schema:
{
  "headline": "A single bold line summarizing the core incident in one sentence.",
  "what_happened": "2-3 sentences explaining the incident (who, what, where, when) based purely on the data.",
  "current_status": "1-2 sentences on the latest known update or current impact.",
  "key_sources": [
    { "name": "Source Name", "url": "URL of the source" }
  ]
}

CRITICAL RULES:
- Do NOT mention the search process, how many results were found, or the "provided data". ONLY describe the incident itself.
- Tone MUST be neutral, factual, and professional. No speculation or opinions.
- If the provided context is completely insufficient or unrelated to an incident, gracefully output: { "headline": "Insufficient Information", "what_happened": "Limited information available at this time.", "current_status": "Awaiting further updates.", "key_sources": [] }
- Extract the 2-3 most credible sources from the context and include their names and URLs.`;

async function generateSummary(query, context) {
    if (!context || context.trim() === '') {
        return createFallbackSummary(query);
    }

    const prompt = `Query: "${query}"\n\nIncident Data Context:\n${context}`;

    // Try Gemini first
    if (config.apiKeys.gemini) {
        try {
            console.log(`[AI-SUMMARY] Attempting summary generation via Gemini API...`);
            const ai = new GoogleGenAI({ apiKey: config.apiKeys.gemini });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: [
                    { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }
                ],
                config: {
                    temperature: 0.1,
                    responseMimeType: 'application/json'
                }
            });

            return JSON.parse(response.text);
        } catch (geminiError) {
            console.warn(`[AI-SUMMARY] Gemini API failed:`, geminiError.message);
            // Fallthrough to OpenAI or fallback
        }
    }

    // Try OpenAI fallback
    if (config.apiKeys.openai) {
        try {
            console.log(`[AI-SUMMARY] Attempting summary generation via OpenAI API...`);
            const openai = new OpenAI({ apiKey: config.apiKeys.openai });

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (openaiError) {
            console.warn(`[AI-SUMMARY] OpenAI API failed:`, openaiError.message);
            // Fallthrough to fallback
        }
    }

    // Ultimate fallback if no keys or both APIs fail
    console.warn(`[AI-SUMMARY] All AI providers failed or missing keys. Returning fallback summary.`);
    return createFallbackSummary(query);
}

function createFallbackSummary(query) {
    return {
        headline: `Incident Review: ${query}`,
        what_happened: `Multiple web results, news articles, and videos were retrieved for "${query}".`,
        current_status: "Please refer to the gathered sources below for specific details and live updates.",
        key_sources: []
    };
}

const CHANNEL_SYSTEM_PROMPT = `You are a content strategist for a specific Instagram channel.
Based on the channel's content DNA and the trending web results provided, generate a content intelligence brief.
Return ONLY a valid JSON object matching the schema below. DO NOT wrap the output in markdown code blocks like \`\`\`json. DO NOT add any conversational text.

Required JSON Schema:
{
  "headline": "The single biggest trending story/topic right now that fits this channel perfectly — one punchy sentence",
  "why_this_fits": "Two sentences explaining why this topic matches this channel's DNA and audience",
  "trending_angle": "The specific angle or hook this channel should take on this topic — different from generic coverage",
  "reel_brief": {
    "hook": "The exact opening line or visual concept for the reel — written in this channel tone",
    "structure": [
      {
        "section": "string",
        "content": "what to say/show here",
        "duration_seconds": number
      }
    ],
    "key_facts": ["3-5 specific facts from the web results to include in the reel"],
    "cta": "closing line written in this channel voice",
    "hashtags": ["15 hashtags matching this channel style"],
    "music_mood": "string"
  },
  "other_trending_topics": [
    {
      "topic": "string",
      "why_relevant": "string",
      "quick_angle": "string"
    }
  ] // 3-4 runner up topics
}`;

async function generateChannelSummary(dnaProfile, topResults) {
    if (!dnaProfile || !topResults || topResults.length === 0) {
        return createFallbackChannelSummary(dnaProfile?.channel || 'Unknown Channel');
    }

    const contextContext = topResults.map(r => `Title: ${r.title}\nSnippet: ${r.description || r.body || ''}\nURL: ${r.source_link}`).join('\n\n');
    const prompt = `Channel DNA Profile:\n${JSON.stringify(dnaProfile, null, 2)}\n\nTrending Web Results:\n${contextContext}\n\nChannel's Reel Style Guide:\n${JSON.stringify(dnaProfile.reel_style_guide, null, 2)}`;

    // Try Gemini first
    if (config.apiKeys.gemini) {
        try {
            console.log(`[AI-SUMMARY] Attempting channel summary generation for ${dnaProfile.channel} via Gemini API...`);
            const ai = new GoogleGenAI({ apiKey: config.apiKeys.gemini });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: [
                    { role: 'user', parts: [{ text: CHANNEL_SYSTEM_PROMPT + '\n\n' + prompt }] }
                ],
                config: {
                    temperature: 0.3,
                    responseMimeType: 'application/json'
                }
            });

            return JSON.parse(response.text);
        } catch (geminiError) {
            console.warn(`[AI-SUMMARY] Gemini API failed for channel summary:`, geminiError.message);
            // Fallthrough to OpenAI or fallback
        }
    }

    // Try OpenAI fallback
    if (config.apiKeys.openai) {
        try {
            console.log(`[AI-SUMMARY] Attempting channel summary generation via OpenAI API...`);
            const openai = new OpenAI({ apiKey: config.apiKeys.openai });

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: CHANNEL_SYSTEM_PROMPT },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (openaiError) {
            console.warn(`[AI-SUMMARY] OpenAI API failed for channel summary:`, openaiError.message);
            // Fallthrough to fallback
        }
    }

    console.warn(`[AI-SUMMARY] All AI providers failed. Returning fallback channel summary.`);
    return createFallbackChannelSummary(dnaProfile.channel);
}

function createFallbackChannelSummary(channelName) {
    return {
        headline: `Trending Output for ${channelName}`,
        why_this_fits: "Analyzed multiple sources to compile this report.",
        trending_angle: "Focus on the key facts presented in current events.",
        reel_brief: {
            hook: "Latest updates incoming.",
            structure: [
                { section: "Intro", content: "Brief context.", duration_seconds: 5 },
                { section: "Body", content: "Main details.", duration_seconds: 15 },
                { section: "Outro", content: "See facts.", duration_seconds: 5 }
            ],
            key_facts: ["Reference sources for details."],
            cta: "Stay tuned for more updates.",
            hashtags: ["#news", "#trending"],
            music_mood: "Neutral"
        },
        other_trending_topics: []
    };
}

module.exports = {
    generateSummary,
    generateChannelSummary
};
