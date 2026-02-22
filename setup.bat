@echo off
echo 🚀 Starting Incident Research Agent Setup (Windows)...

:: 1. Check Node.js
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please download it from https://nodejs.org/ ^(Minimum v18+^)
) ELSE (
    for /f "delims=" %%i in ('node -v') do echo ✅ Node.js is installed: %%i
)

:: 2. Setup npm and packages
IF NOT EXIST "package.json" (
    echo 📦 Initializing package.json...
    call npm init -y >nul
)

echo 📦 Installing npm dependencies...
call npm install express cors dotenv puppeteer axios googleapis

:: 3. Check yt-dlp
yt-dlp --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ yt-dlp is not installed. Please install it using: pip install yt-dlp or download yt-dlp.exe to your PATH.
) ELSE (
    echo ✅ yt-dlp is installed.
)

:: 4. Check ffmpeg
ffmpeg -version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ ffmpeg is not installed. Required by yt-dlp. Install via: winget install ffmpeg
) ELSE (
    echo ✅ ffmpeg is installed.
)

:: 5. Create .env placeholders
IF NOT EXIST ".env" (
    echo ⚙️ Creating blank .env file...
    echo SERPAPI_KEY=> .env
    echo YOUTUBE_API_KEY=>> .env
    echo GEMINI_API_KEY=>> .env
    echo OPENAI_API_KEY=>> .env
    echo PORT=3000>> .env
    echo NODE_ENV=development>> .env
    echo YT_DLP_PATH=yt-dlp>> .env
    echo PUPPETEER_HEADLESS=true>> .env
    echo ✅ .env file created with empty placeholders.
) ELSE (
    echo ✅ .env already exists, skipping creation.
)

echo 🎉 Setup scripts complete! Please check any ❌ warnings above.
pause
