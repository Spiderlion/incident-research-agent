#!/bin/bash
echo "🚀 Starting Incident Research Agent Setup (Linux/macOS)..."

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please download it from https://nodejs.org/ (Minimum v18+)"
else
    echo "✅ Node.js is installed: $(node -v)"
fi

# 2. Setup npm and packages
if [ ! -f "package.json" ]; then
    echo "📦 Initializing package.json..."
    npm init -y > /dev/null
fi

echo "📦 Installing npm dependencies..."
npm install express cors dotenv puppeteer axios googleapis

# 3. Check yt-dlp
if ! command -v yt-dlp &> /dev/null; then
    echo "❌ yt-dlp is not installed. Install using: python3 -m pip install -U yt-dlp or brew install yt-dlp (macOS)"
else
    echo "✅ yt-dlp is installed."
fi

# 4. Check ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed. Required by yt-dlp."
    echo "   Ubuntu/Debian: sudo apt install ffmpeg"
    echo "   macOS: brew install ffmpeg"
else
    echo "✅ ffmpeg is installed."
fi

# 5. Create .env placeholders
if [ ! -f ".env" ]; then
    echo "⚙️ Creating blank .env file..."
    cat <<EOT >> .env
SERPAPI_KEY=
YOUTUBE_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
PORT=3000
NODE_ENV=development
YT_DLP_PATH=yt-dlp
PUPPETEER_HEADLESS=true
EOT
    echo "✅ .env file created with empty placeholders."
else
    echo "✅ .env already exists, skipping creation."
fi

echo "🎉 Setup scripts complete! Please check any ❌ warnings above."
