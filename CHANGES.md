# Incident Research Agent Changelog

## Project Overview
The **AI-Powered Incident Research Agent** is designed to take a simple natural language query (like "car accident Indore today") and automatically perform a comprehensive search across multiple platforms simultaneously. 

Here is how the system works in plain English:
1. **The Request**: The user submits their query via our web dashboard.
2. **The Orchestrator**: Our backend receives the query and acts as a central coordinator `searchOrchestrator.js`. It immediately fires off three separate search tasks at the exact same time to save time.
3. **Google Search**: One task asks Google for general web results and images `googleSearch.js`.
4. **News Search**: A "headless browser" (an invisible Chrome window operated by our code) visits Google News, types in the query, and extracts the latest article headlines and links `newsScraper.js`.
5. **YouTube Search**: Another task asks YouTube for related videos `youtubeSearch.js`. When a video is found, we use a special tool (`yt-dlp`) to try and pull out the raw, direct video file so we can embed it beautifully `mediaExtractor.js`. 
6. **Data Formatting**: Once all three searches finish, the results look very different from each other. Our `normalizer.js` script takes all this messy, varied data and forces it into one clean, unified format.
7. **The Result**: The backend sends this clean, unified package of data back to the user's dashboard, where it is displayed in a premium, easy-to-read layout.

---

## Change Log

### Change #1 — Project Scaffolding & README
- **Date/Phase**: Phase 1
- **What was added**: `README.md` containing the project architecture, tech stack, and API documentation. Task tracking lists were also added to the internal tool.
- **What was removed/modified**: N/A
- **Why**: To establish the foundational documentation, clarify how the system works conceptually, and track deliverables.
- **How to revert**: Delete the `README.md` file.

### Change #2 — Requirements & Setup Scripts
- **Date/Phase**: Phase 2
- **What was added**: `REQUIREMENTS_ANALYSIS.md` explaining manual vs automated setup procedures. `setup.sh` and `setup.bat` scripts to fully automate dependency installation.
- **What was removed/modified**: N/A
- **Why**: To ensure any developer (or server) can easily install the required software (`node`, `npm packages`, `yt-dlp`, `ffmpeg`) with a single click.
- **How to revert**: Delete `REQUIREMENTS_ANALYSIS.md`, `setup.sh`, and `setup.bat`.

### Change #3 — Environment Variables & Gitignore
- **Date/Phase**: Phase 3
- **What was added**: `.env` containing local API keys (SerpApi, YouTube Data API, Gemini), `.env.example` as a safe template, and `.gitignore` preventing secrets from being committed.
- **What was removed/modified**: N/A
- **Why**: To securely store sensitive API keys and configuration values without hardcoding them into the app source code.
- **How to revert**: Delete `.env`, `.env.example`, and `.gitignore`.

### Change #4 — Backend Base Setup & Orchestrator
- **Date/Phase**: Phase 5
- **What was added**: `server.js`, `routes/research.js`, `services/searchOrchestrator.js`, `config/index.js`, and `utils/`.
- **What was removed/modified**: N/A
- **Why**: To establish the Express server foundation, centralize environment variable retrieval, and build the Orchestrator that will parallelize incoming tasks structure.
- **How to revert**: Delete the `src/config`, `src/utils`, `src/server.js`, `src/routes`, and `src/services/searchOrchestrator.js` files.

### Change #5 — Search Services & Test Script
- **Date/Phase**: Phase 5
- **What was added**: `services/googleSearch.js`, `services/youtubeSearch.js`, `services/newsScraper.js`, `services/mediaExtractor.js`, and `test-api.js`.
- **What was removed/modified**: N/A
- **Why**: To connect to the external APIs (SerpApi, YouTube) and headless browsers (Puppeteer), wrapping yt-dlp, and enabling terminal-based testing.
- **How to revert**: Delete the added modules and script.

### Change #6 — Frontend Dashboard & UI
- **Date/Phase**: Phase 6
- **What was added**: `public/index.html`, `public/css/style.css`, and `public/js/app.js`. Also updated `src/server.js` to serve static files.
- **What was removed/modified**: N/A
- **Why**: To provide a premium, modern, dark-themed dashboard that consumes the `/api/research` endpoint and visually organizes results with a masonry grid, video modals, and timeline toggles.
- **How to revert**: Delete the `public` directory and remove `express.static('public')` from `src/server.js`.

### Change #7 — UI & Data Enhancements
- **Date/Phase**: Phase 7
- **What was added**: `src/services/imageSearch.js`, `src/services/trendingNews.js`, and `src/routes/trending.js`. Added a new Trending panel and button to the frontend UI.
- **What was removed/modified**: Refactored `src/services/newsScraper.js` to use SerpApi instead of Puppeteer for much higher reliability and richer snippets. Tweaked masonry card padding, spacing, and hover states with media-specific glows.
- **Why**: To provide high-resolution image extractions, detailed news excerpts/thumbnails, a functional trending news drawer with click-to-search interaction, and a more open/premium overall feel.
- **How to revert**: Delete the new services/routes and revert the UI spacing/trending panel additions in public files.

### Change #8 — AI Summary Content Overhaul
- **Date/Phase**: Phase 8
- **What was added**: `src/services/aiSummary.js` to call the Gemini API (`gemini-2.5-pro`) or OpenAI fallback for semantic summarization.
- **What was removed/modified**: Removed the dummy summary string generation in `public/js/app.js`. Updated `src/routes/research.js` to build a text context from the top 10 search results and pass it to the new AI service. Redesigned the HTML/CSS in `#ai-summary` to display structured LLM properties (headline, what happened, status, sources) natively.
- **Why**: To provide actual intelligence instead of returning a hardcoded string of metrics. The AI now acts as an analyst reading the gathered data and outputting a factual briefing.
- **How to revert**: Remove `aiSummary.js` and revert `app.js` and `index.html` to generate a single string inside `<p id="summary-text">`.

### Change #9 — Vercel Deployment Setup
- **Date/Phase**: Phase 9
- **What was added**: `vercel.json` for deployment routing rules, `api/research.js` and `api/trending.js` as Vercel Serverless Functions. Added comprehensive Vercel deployment steps and limitations to `README.md`.
- **What was removed/modified**: Updated `package.json` with new `"dev"` and `"vercel-dev"` scripts. Modified `src/services/mediaExtractor.js` to detect `process.env.VERCEL` and gracefully skip `yt-dlp` extraction, returning `null` to ensure the frontend uses safe embed fallbacks.
- **Why**: To make the project smoothly deployable to Vercel's free tier, adapting the Express routes into Serverless Functions and bypassing CLI binaries (`yt-dlp`) that are unsupported in cloud serverless layers.
- **How to revert**: Delete the `api/` folder and `vercel.json`. Revert the scripts in `package.json`.
