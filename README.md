# Incident Research Agent

## Purpose
An AI-Powered Incident Research Agent that takes a natural language query, searches Google, YouTube, and News sources, extracts media, and returns a structured JSON report. It is designed to provide rapid situational awareness through a premium dashboard UI.

## System Architecture
```text
[User] -> (POST /api/research) -> [Express Server]
                                       |
          +----------------------------+-----------------------------+
          |                            |                             |
   [googleSearch.js]           [youtubeSearch.js]           [newsScraper.js]
    (SerpApi/GCS)             (YouTube Data API)             (Puppeteer)
          |                            |                             |
          v                            v                             v
    [Web Results]            [Video Metadata + yt-dlp]       [News Articles]
          |                            |                             |
          +----------------------------+-----------------------------+
                                       |
                               [normalizer.js]
                                       |
                               [Unified JSON] -> [User]
```

## Deliverables
1. `README.md` - Project scaffolding and documentation (Phase 1)
2. `setup.sh` & `setup.bat` - Automates environment setup (Phase 2)
3. `.env` & `.env.example` - Environment configuration (Phase 3)
4. `CHANGES.md` - Running changelog and project overview (Phase 4)
5. Express Backend API (`POST /api/research`) - Terminal testable (Phase 5)
6. Premium Dashboard UI (Frontend) - (Phase 6)

## Tech Stack
- **Node.js & Express**: Backend server & API routing
- **yt-dlp & ffmpeg**: YouTube video sub-extraction/streaming handling
- **Puppeteer**: Headless browser for scraping Google News
- **SerpApi / Google Custom Search**: Google search results extraction
- **YouTube Data API v3**: YouTube video metadata extraction
- **Gemini AI API / OpenAI API** (Optional): AI enhancement

## Folder Structure
```text
incident-research-agent/
├── src/
│   ├── server.js              # Express app entry point
│   ├── routes/
│   │   └── research.js        # POST /api/research route
│   ├── services/
│   │   ├── searchOrchestrator.js   # Coordinates all searches in parallel
│   │   ├── googleSearch.js         # SerpApi / Google Custom Search wrapper
│   │   ├── youtubeSearch.js        # YouTube Data API wrapper
│   │   ├── newsScraper.js          # Puppeteer-based news scraper
│   │   └── mediaExtractor.js       # yt-dlp wrapper for video extraction
│   ├── utils/
│   │   ├── normalizer.js      # Maps all results to unified JSON schema
│   │   └── validator.js       # Validates .env keys on startup
│   └── config/
│       └── index.js           # Centralized config from process.env
├── .env                       # Local environment variables
├── .env.example               # Template for environment variables
├── .gitignore                 # Git ignore file
├── package.json               # Node.js dependencies and scripts
├── README.md                  # Project documentation
├── CHANGES.md                 # Running change log and overview
└── setup.sh / setup.bat       # Automation scripts for setup
```

## How to Install and Run
1. Run `.\setup.bat` (Windows) or `./setup.sh` (Mac/Linux) to automatically install Node.js dependencies (`express`, `puppeteer`, etc.) and set up your environment.
2. The setup script will warn you if `Node.js`, `yt-dlp`, or `ffmpeg` are missing from your system. Please install them manually if warned.
3. Open the `.env` file and verify your API keys are present (SerpApi, YouTube, Gemini).
4. Run the API server manually during development: `npm start` or `node src/server.js`.


## API Endpoint Documentation

### `POST /api/research`
Executes parallel searches across configured sources and normalizes the output.

- **Request Body**:
  ```json
  {
    "query": "car accident in Indore today video"
  }
  ```
- **Response Schema** (Result Array & Summary Object):
  ```json
  {
    "results": [
      {
        "platform": "youtube | google | news | twitter",
        "media_type": "video | image | article",
        "title": "string",
        "media_url": "string",
        "thumbnail": "string | null",
        "source_link": "string",
        "timestamp": "ISO8601 string | null",
        "description": "string | null",
        "body": "string | null"
      }
    ],
    "summary": {
      "headline": "string",
      "what_happened": "string",
      "current_status": "string",
      "key_sources": [
        {
          "name": "string",
          "url": "string"
        }
      ]
    }
  }
  ```

### `GET /api/trending`
Fetches top trending news using SerpApi Google News with a modular time filter.

- **Query Parameters**: `period` (default: `today`). Supported: `today`, `yesterday`, `3days`, `week`, `month`.
- **Response Schema** (Array of objects):
  ```json
  [
    {
      "rank": 1,
      "title": "string",
      "link": "string",
      "source": "string",
      "date": "string | null",
      "snippet": "string | null",
      "thumbnail": "string | null"
    }
  ]
  ```

## Environment Variable Reference
| Key | Description |
|-----|-------------|
| `SERPAPI_KEY` | SerpApi key for Google search results |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `GEMINI_API_KEY` | (Optional) Gemini AI key for AI enhancements |
| `OPENAI_API_KEY` | (Optional) OpenAI API key |
| `PORT` | The port the Express server runs on (default: 3000) |
| `NODE_ENV` | Environment mode (`development` or `production`) |
| `YT_DLP_PATH` | Path to the `yt-dlp` executable |
| `PUPPETEER_HEADLESS` | Whether Puppeteer runs in headless mode (`true`/`false`) |

## Deploying to Vercel
You can easily deploy this frontend and backend directly to Vercel's free tier. The project uses Vercel Serverless Functions (`/api/research.js` and `/api/trending.js`) and static hosting for the frontend.

**Step 1 — Install Vercel CLI:**
```bash
npm install -g vercel
```

**Step 2 — Login to Vercel:**
```bash
vercel login
```
*(Opens browser, sign in with GitHub/Google/Email)*

**Step 3 — Link project:**
```bash
vercel link
```
*(Run from project root, follow prompts to create new project)*

**Step 4 — Add environment variables via Vercel Dashboard:**
1. Go to vercel.com → Your Project → Settings → Environment Variables
2. Add the following keys manually. **DO NOT upload your `.env` file.**
   - `SERPAPI_KEY`
   - `YOUTUBE_API_KEY`
   - `GEMINI_API_KEY` (or `OPENAI_API_KEY`)
3. Set their environment targeting to: **Production**, **Preview**, and **Development**.

**Step 5 — Deploy:**
```bash
vercel --prod
```
*(This deploys to your live production URL)*

**Step 6 — Test live endpoints:**
```bash
curl -X POST https://your-vercel-url.vercel.app/api/research \
-H "Content-Type: application/json" \
-d '{"query": "test incident query"}'
```

**Step 7 — For ongoing updates:**
Make changes locally → test with `npm run dev` or `npm run vercel-dev` → then run `vercel --prod` to push updates.

## Deployment Limitations on Vercel Free Tier
- **yt-dlp disabled**: Vercel serverless environments do not support the local `yt-dlp` CLI binary. The system automatically detects Vercel (`process.env.VERCEL`) and gracefully degrades to serving YouTube embed links exclusively for videos. Full video extraction runs only in local development.
- **Serverless Timeout**: Vercel Free tier has a 10s maximum execution limit per request. If searches take longer, Vercel will terminate the request.
- **Web Scraping Architecture**: Puppeteer (a headless browser) is far too memory-intensive for Vercel's free tier. *Note: As of Phase 7, Puppeteer was completely replaced by `SerpApi` which acts as our lightweight, 100% serverless-friendly alternative, negating the need for custom Cheerio parsers and avoiding memory limit crashes out of the box.*
