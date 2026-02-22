# Requirements Analysis & Setup Guide

## 1. Software to Install

### Node.js
- **Purpose**: Runtime environment for the Express backend and scripts.
- **Version**: Minimum v18.x recommended.
- **Download**: [nodejs.org](https://nodejs.org/)

### npm
- **Purpose**: Package manager for installing backend dependencies. (Included with Node.js).

### yt-dlp
- **Purpose**: A command-line program to download videos from YouTube and other sites. Needed here to extract direct streamable URLs from YouTube videos to embed natively.
- **Windows Install**: `winget install yt-dlp` or download `yt-dlp.exe` and add to PATH.
- **macOS Install**: `brew install yt-dlp`
- **Linux Install**: `sudo apt install yt-dlp` or `python3 -m pip install -U yt-dlp`

### ffmpeg
- **Purpose**: Multimedia framework required by `yt-dlp` to process, mux, and transcode media streams effectively. 
- **Windows Install**: `winget install ffmpeg`
- **macOS Install**: `brew install ffmpeg`
- **Linux Install**: `sudo apt install ffmpeg`

### Puppeteer
- **Purpose**: An npm package that automatically downloads and installs a compatible Chromium browser binary. It is used to run a headless browser to scrape Google News where no public API is available.

---

## 2. npm Packages Needed

Below are the required packages and their purpose:
- `express`: Web framework to serve the backend `/api/research` endpoint.
- `cors`: Middleware to allow cross-origin requests from the future frontend.
- `dotenv`: Loads environment parameters securely from a `.env` file.
- `puppeteer`: Headless browser automation for news scraping.
- `axios` / `node-fetch`: To make HTTP requests to APIs (like SerpApi and YouTube).
- `googleapis`: Official Google client library for the YouTube Data API v3.

**Single npm install command**:
```bash
npm install express cors dotenv puppeteer axios googleapis
```

---

## 3. API Keys & External Services Needed

### SerpApi (Google Search)
- **Purpose**: Extracts structured data directly from Google Search.
- **Signup**: [https://serpapi.com](https://serpapi.com)
- **Limits**: The free tier provides 100 searches per month.

### YouTube Data API v3
- **Purpose**: Used to search for YouTube videos related to the incident, fetch metadata, upload dates, and thumbnail links.
- **Signup**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create a new or select an existing project.
  3. Navigate to "APIs & Services" > "Library".
  4. Search for "YouTube Data API v3" and click "Enable".
  5. Go to "Credentials", click "Create Credentials" > "API Key".

### Gemini API (Optional for AI Enhancements)
- **Purpose**: To summarize findings, create an incident timeline, or extract key insights from raw text.
- **Signup**: [Google AI Studio](https://aistudio.google.com)

### OpenAI API (Optional)
- **Purpose**: Alternative to Gemini for AI analysis and enhancements.
- **Signup**: [platform.openai.com](https://platform.openai.com)

---

## 4. Automation Scripts
- `setup.sh`: Bash script for Linux/macOS to check software requirements, automatically run `npm install`, and scaffold the `.env` template.
- `setup.bat`: Batch script for Windows doing the exact same environment checks and scaffolding.
