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

module.exports = {
    generateSummary
};
