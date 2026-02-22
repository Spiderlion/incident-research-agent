const { spawn } = require('child_process');
const config = require('../config');

/**
 * Attempts to extract a direct streamable video URL using yt-dlp.
 * Spawns yt-dlp as a child process.
 * @param {string} videoUrl The original YouTube video URL
 * @returns {Promise<string>} The direct media URL or null if it fails/timeouts
 */
function extractMedia(videoUrl) {
    return new Promise((resolve) => {
        // Vercel Serverless Check
        if (process.env.VERCEL === "1") {
            console.warn(`⚠️ [EXTRACT] yt-dlp not available in serverless environment, using embed fallback for ${videoUrl}`);
            return resolve(null); // Return null immediately so frontend falls back to iframe embed
        }

        // 15 seconds timeout as per requirements
        const timeout = setTimeout(() => {
            console.warn(`⏳ [EXTRACT] Timeout extracting media for ${videoUrl}. Falling back.`);
            resolve(null);
        }, 15000);

        console.log(`[EXTRACT] Spawning yt-dlp for direct media URL: ${videoUrl}`);
        // -g gets the URL, -f specifies format (best matching video+audio mp4)
        const ytdlp = spawn(config.scraper.ytDlpPath, ['-g', '-f', 'best[ext=mp4]', videoUrl]);

        let output = '';
        let errorOutput = '';

        ytdlp.stdout.on('data', (data) => {
            output += data.toString();
        });

        ytdlp.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        ytdlp.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0 && output) {
                console.log(`✅ [EXTRACT] Successfully extracted direct media URL for ${videoUrl}`);
                resolve(output.trim());
            } else {
                console.warn(`⚠️ [EXTRACT] yt-dlp failed for ${videoUrl} (code ${code}):`, errorOutput.trim().substring(0, 100) || 'No output');
                resolve(null);
            }
        });

        ytdlp.on('error', (err) => {
            clearTimeout(timeout);
            console.warn(`⚠️ [EXTRACT] Subprocess error running yt-dlp ->`, err.message);
            // Fails gracefully
            resolve(null);
        });
    });
}

module.exports = { extractMedia };
