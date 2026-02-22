require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKeys: {
    serpapi: process.env.SERPAPI_KEY,
    youtube: process.env.YOUTUBE_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  },
  scraper: {
    ytDlpPath: process.env.YT_DLP_PATH || 'yt-dlp',
    puppeteerHeadless: process.env.PUPPETEER_HEADLESS !== 'false',
  },
};
