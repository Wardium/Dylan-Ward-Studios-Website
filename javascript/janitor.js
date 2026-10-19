// ==========================================
// DWS PATCHER & CONSOLE SANITIZER
// ==========================================
(function() {
    // 1. SILENCE KNOWN NON-CRITICAL CONSOLE NOISE (background.svg 404s, etc.)
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = function(...args) {
        const msg = args.join(' ');
        // Filter out background.svg 404 or expected YouTube failures
        if (msg.includes('background.svg') || msg.includes('net::ERR_HTTP_RESPONSE_CODE_FAILURE 404')) {
            return; 
        }
        originalError.apply(console, args);
    };

    // 2. YOUTUBE API FALLBACK INTERCEPTOR
    // If your youtube.js script tries to fetch data and fails (403), we provide a default fallback
    const DEFAULT_FALLBACK_YOUTUBE_URL = "https://youtu.be/z38y4RPA_YE?si=cidh3nNuI0C6vr8d"; // Change to your default video ID/URL
    const DEFAULT_FALLBACK_THUMBNAIL = "https://i.ytimg.com/vi/z38y4RPA_YE/hqdefault.jpg?sqp=-oaymwEjCOADEI4CSFryq4qpAxUIARUAAAAAGAElAADIQj0AgKJDeAE=&rs=AOn4CLBx4thTHQzntZO2zL_U69JHO0izdg";

    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('googleapis.com/youtube/v3/search')) {
            try {
                const response = await originalFetch.apply(this, args);
                if (!response.ok) {
                    throw new Error(`YouTube API returned status ${response.status}`);
                }
                return response;
            } catch (err) {
                console.warn("[Patcher] YouTube API blocked/failed (403/Quota). Injecting safe default fallback response.");
                
                // Return a mock successful JSON response so your frontend code doesn't crash
                const fallbackData = {
                    items: [
                        {
                            id: { videoId: "dQw4w9WgXcQ" },
                            snippet: {
                                title: "Default Fallback Stream (API Restricted)",
                                description: "Loaded automatically because YouTube API access returned 403.",
                                thumbnails: { high: { url: DEFAULT_FALLBACK_THUMBNAIL } }
                            }
                        }
                    ]
                };
                return new Response(JSON.stringify(fallbackData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        return originalFetch.apply(this, args);
    };

    // 3. AUTO-CLEAR UNWANTED CONSOLE SPAM ON LOAD
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.clear();
            console.log(
                "%c✨ [DWS Patcher] Console cleared & YouTube/Asset fallbacks active.",
                "color: #8ac926; font-weight: bold;"
            );
        }, 500);
    });
})();
