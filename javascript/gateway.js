// ==========================================
// 1. STATE & CONFIGURATION
// ==========================================
const MENU_CONFIG = {
    topPosition: "10px",      // Distance of the pill from the top
    rightPosition: "17px",    // Distance of the pill from the right
    hoverZoneWidth: "60px",   // Smaller corner trigger width
    hoverZoneHeight: "50px",  // Smaller corner trigger height
    buttonSize: "2.3rem",       // Size of the circular buttons
    expandedWidth: "190px",   // Width of the button when hovered to show text
    autoOpenDelay: 2450,      // 2.45 seconds before opening on first visit
    autoHideDelay: 4000,      // 4 seconds before it leaves if untouched
    maxReadabilityScale: 2.5  // Max multiplier ceiling for Readability Mode
};

let triggerWindowTimeout;
let isCancelled = false;
let isAuthChecked = false;
let isLowResourceMode = false;
let isNormalModeForced = false;
let pendingImageQueue = [];
let pillHideTimeout;

const STEALTH_WINDOW_MS = 2450; // Matched to your 2.45s requirement
const FPS_THRESHOLD = 30;
const COOKIE_NAME = 'dws_force_normal_mode';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// 2. STORAGE HELPERS
// ==========================================
function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
}

// ==========================================
// 3. INITIALIZATION & 2.45s STEALTH GATEWAY
// ==========================================
function initStealthAndPerformance() {
    if (getCookie(COOKIE_NAME) === 'true') {
        isNormalModeForced = true;
        console.log("[Perf] Cookie detected: Normal Mode forced by user preference.");
    } else {
        initPerformanceMonitor();
    }

    console.log(
        "%c[Auth] ⏱️ 2.45s Stealth Window OPEN. Click anywhere on the page to test login...",
        "color: #00e5ff; font-weight: bold;"
    );

    // Listen for a click within the 2.45-second window
    document.addEventListener('click', handleStealthClick);

    // Close the window after 2.45 seconds if no click happened
    triggerWindowTimeout = setTimeout(() => {
        document.removeEventListener('click', handleStealthClick);
        if (!isAuthChecked) {
            console.log(
                "%c[Auth] 🔒 2.45s Stealth Window EXPIRED (No click detected). Remaining on public site.",
                "color: #888888;"
            );
        }
    }, STEALTH_WINDOW_MS);

    initLiquidGlassMenu();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStealthAndPerformance);
} else {
    initStealthAndPerformance();
}

function handleStealthClick(e) {
    // Ignore clicks on the Liquid Glass menu
    if (e && e.target && e.target.closest('#dws-glass-pill, #dws-menu-hover-zone')) return;
    if (isAuthChecked) return;

    clearTimeout(triggerWindowTimeout);
    document.removeEventListener('click', handleStealthClick);
    
    console.log(
        "%c[Auth] 🖱️ Stealth Click registered inside 2.45s window! Contacting Gatekeeper...",
        "color: #ffca3a; font-weight: bold;"
    );
    checkAuthorization();
}

async function checkAuthorization() {
    if (isAuthChecked) return;
    isAuthChecked = true;

    console.group("%c[Auth] Gatekeeper Verification Diagnostic", "color: #00e5ff; font-weight: bold;");
    console.log("1. Current Page Origin:", window.location.origin);
    console.log("2. Target Endpoint: https://auth.teamexist.com/api/verify (POST)");

    // Warn immediately if testing from an origin not in ALLOWED_ORIGINS
    const allowedOrigins = ["https://teamexist.com", "https://www.teamexist.com"];
    if (!allowedOrigins.includes(window.location.origin)) {
        console.warn(
            `⚠️ CORS WARNING: You are testing from '${window.location.origin}', which is NOT in your Flask ALLOWED_ORIGINS list! The browser will block this request.`
        );
    }

    try {
        const response = await fetch('https://auth.teamexist.com/api/verify', {
            method: 'POST',          // MUST be POST to match your Flask route!
            credentials: 'include',  // Sends your 'dws_auth' cookie across subdomains
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timestamp: Date.now() })
        });

        console.log(`3. HTTP Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.error(`❌ Server returned HTTP ${response.status}. Check if method is POST.`);
            console.groupEnd();
            return;
        }

        const data = await response.json();
        console.log("4. Raw JSON Payload from Server:", data);

        if (data.debug) {
            console.table(data.debug);
        }

        if (data.authorized && data.dashboard_url) {
            console.log(
                `%c✅ [Auth] ACCESS GRANTED! Redirecting to: ${data.dashboard_url}`,
                "color: #8ac926; font-weight: bold; font-size: 13px;"
            );
            console.groupEnd();

            if (typeof runConnectionSequence === 'function') {
                await runConnectionSequence(data.dashboard_url);
            } else {
                window.location.href = data.dashboard_url;
            }
        } else {
            console.warn(
                "%c⛔ [Auth] ACCESS DENIED by server. You are not logged in (or cookie 'dws_auth' is missing/invalid).",
                "color: #ff595e; font-weight: bold;"
            );
            console.groupEnd();
        }
    } catch (error) {
        console.error("❌ [Auth] NETWORK / CORS FAILURE:", error);
        console.info(
            "💡 Troubleshooting Tip: If you see 'Failed to fetch', check two things:\n" +
            "1. Are you on https://teamexist.com or https://www.teamexist.com?\n" +
            "2. Was your 'dws_auth' cookie set with domain='.teamexist.com' and SameSite='None'; Secure=True?"
        );
        console.groupEnd();
    }
}

// ==========================================
// 4. LOW-RESOURCE & FPS DETECTION ENGINE
// ==========================================
function initPerformanceMonitor() {
    if (isNormalModeForced) return;

    const lowRAM = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSoftwareGPU = checkSoftwareWebGL();

    if ((lowRAM && lowCPU) || prefersReducedMotion || isSoftwareGPU) {
        enableLowResourceMode("Hardware heuristics (Low RAM/CPU or software renderer)");
        return;
    }

    let frameCount = 0;
    let lastTime = performance.now();
    let lowFpsStrikes = 0;
    const monitorStart = lastTime;

    function checkFrame(now) {
        if (isLowResourceMode || isNormalModeForced) return;

        frameCount++;
        const elapsed = now - lastTime;

        if (elapsed >= 1000) {
            if (!document.hidden) {
                const currentFps = Math.round((frameCount * 1000) / elapsed);
                if (currentFps < FPS_THRESHOLD) {
                    lowFpsStrikes++;
                    if (lowFpsStrikes >= 2) {
                        enableLowResourceMode(`Sustained FPS drop detected (${currentFps} FPS)`);
                        return;
                    }
                } else {
                    lowFpsStrikes = 0;
                }
            }
            frameCount = 0;
            lastTime = now;
        }

        if (now - monitorStart < 12000) {
            requestAnimationFrame(checkFrame);
        }
    }
    requestAnimationFrame(checkFrame);
}

function checkSoftwareWebGL() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return true;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
            return (renderer.includes('swiftshader') || renderer.includes('llvmpipe') || renderer.includes('basic render'));
        }
    } catch (e) { return false; }
    return false;
}

function enableLowResourceMode(reason) {
    if (isLowResourceMode) return;
    isLowResourceMode = true;
    isNormalModeForced = false;
    setCookie(COOKIE_NAME, 'false', 365);
    console.warn(`[Perf] Low Resource Mode ENABLED: ${reason}`);

    const perfStyle = document.createElement('style');
    perfStyle.id = 'dws-low-resource-styles';
    perfStyle.innerHTML = `
        body.dws-low-spec *:not(#dws-auth-overlay):not(#dws-auth-overlay *):not(#dws-glass-pill):not(#dws-glass-pill *) {
            animation-duration: 0.05s !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.05s !important;
            box-shadow: none !important;
            text-shadow: none !important;
            backdrop-filter: none !important;
            filter: none !important;
        }
        body.dws-low-spec img { image-rendering: optimizeSpeed !important; }
    `;
    document.head.appendChild(perfStyle);
    document.body.classList.add('dws-low-spec');

    const images = Array.from(document.querySelectorAll('img'));
    pendingImageQueue = [];

    images.forEach(img => {
        img.decoding = 'async';
        img.loading = 'lazy';
        img.fetchPriority = 'low';

        if (img.srcset) {
            img.dataset.origSrcset = img.srcset;
            const firstCandidate = img.srcset.split(',')[0].trim().split(' ')[0];
            if (firstCandidate) img.src = firstCandidate;
            img.removeAttribute('srcset');
        }

        if (!img.complete && img.src) {
            img.dataset.queuedSrc = img.src;
            pendingImageQueue.push({ el: img, src: img.src });
            img.removeAttribute('src');
        }
    });

    staggerImageQueue();
    updateMenuVisuals();
}

async function staggerImageQueue() {
    while (pendingImageQueue.length > 0 && isLowResourceMode) {
        const item = pendingImageQueue.shift();
        if (item && item.el) {
            item.el.src = item.src;
            delete item.el.dataset.queuedSrc;
        }
        await sleep(150);
    }
}

function disableLowResourceMode() {
    isLowResourceMode = false;
    isNormalModeForced = true;
    setCookie(COOKIE_NAME, 'true', 365);
    console.log("[Perf] Low Resource Mode DISABLED by user. Cookie saved.");

    document.body.classList.remove('dws-low-spec');
    const perfStyle = document.getElementById('dws-low-resource-styles');
    if (perfStyle) perfStyle.remove();

    const images = Array.from(document.querySelectorAll('img'));
    images.forEach(img => {
        img.decoding = 'auto';
        img.loading = 'eager';
        img.fetchPriority = 'auto';

        if (img.dataset.queuedSrc) {
            img.src = img.dataset.queuedSrc;
            delete img.dataset.queuedSrc;
        }
        if (img.dataset.origSrcset) {
            img.srcset = img.dataset.origSrcset;
            delete img.dataset.origSrcset;
        }
    });

    pendingImageQueue = [];
    updateMenuVisuals();
}

// ==========================================
// 5. READABILITY MODE (BOUNDARY-AWARE)
// ==========================================
function toggleReadabilityMode(enable) {
    localStorage.setItem('dws_readability_mode', enable ? 'true' : 'false');
    
    const targetClasses = ['glass-block', 'banner-container', 'banner-overlay'];
    const allowedClasses = [...targetClasses, 'col-half', 'col-full'];

    const containers = Array.from(document.querySelectorAll('*')).filter(el => {
        const cls = Array.from(el.classList).filter(c => c !== 'fancy-clickable-parent');
        return cls.length > 0 && targetClasses.some(t => cls.includes(t)) && cls.every(c => allowedClasses.includes(c));
    });

    containers.forEach(container => {
        if (typeof container._clearIdleTimeout === 'function') {
            container._clearIdleTimeout();
        }

        const textElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, strong, em, blockquote');
        if (textElements.length === 0) return;

        textElements.forEach(el => {
            if (!el.dataset.origFontSize) {
                el.dataset.origFontSize = parseFloat(window.getComputedStyle(el).fontSize);
            }
        });

        if (enable) {
            textElements.forEach(el => el.style.transition = 'none');
            
            let testMultiplier = 1.0;
            const parentRect = container.getBoundingClientRect();

            while (testMultiplier < MENU_CONFIG.maxReadabilityScale) {
                testMultiplier += 0.05;
                textElements.forEach(el => {
                    const orig = parseFloat(el.dataset.origFontSize);
                    el.style.fontSize = (orig * testMultiplier) + 'px';
                });

                let hitEdge = false;
                if (testMultiplier > 1.05) {
                    textElements.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        if (rect.bottom > parentRect.bottom - 4 || rect.right > parentRect.right - 4) {
                            hitEdge = true;
                        }
                    });
                }

                if (hitEdge) {
                    testMultiplier -= 0.05;
                    break;
                }
            }

            const finalMultiplier = Math.max(1, testMultiplier);
            const startMult = parseFloat(container.dataset.fontMultiplier || "1");
            
            textElements.forEach(el => {
                const orig = parseFloat(el.dataset.origFontSize);
                el.style.fontSize = (orig * startMult) + 'px';
                void el.offsetWidth; 
                el.style.transition = 'font-size 0.6s cubic-bezier(0.42, 0, 0.58, 1), transform 0.4s cubic-bezier(0.42, 0, 0.58, 1), color 0.4s ease';
                el.style.fontSize = (orig * finalMultiplier) + 'px';
            });

            container.dataset.fontMultiplier = finalMultiplier.toString();
        } else {
            container.dataset.fontMultiplier = "1";
            textElements.forEach(el => {
                const orig = parseFloat(el.dataset.origFontSize);
                el.style.transition = 'font-size 0.6s cubic-bezier(0.42, 0, 0.58, 1), transform 0.4s cubic-bezier(0.42, 0, 0.58, 1), color 0.4s ease';
                el.style.fontSize = orig + 'px';
            });
        }
    });

    updateMenuVisuals();
}

// ==========================================
// 6. LIQUID GLASS PILL MENU (LIGHT/DARK + MOBILE)
// ==========================================
function initLiquidGlassMenu() {
    if (document.getElementById('dws-glass-pill')) return;

    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --pill-top: ${MENU_CONFIG.topPosition};
            --pill-right: ${MENU_CONFIG.rightPosition};
            --pill-btn-size: ${MENU_CONFIG.buttonSize};
            
            /* Light Mode Default: Cloudy White Glass Base */
            --pill-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.20));
            --pill-border: rgba(255, 255, 255, 0.5);
            --pill-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.7);
            --btn-bg: rgba(255, 255, 255, 0.25);
            --btn-hover-bg: rgba(255, 255, 255, 0.45);
            --btn-text: rgba(15, 15, 15, 0.85);
        }

        /* Automatic OS Dark Mode: Cloudy Black Glass Base */
        @media (prefers-color-scheme: dark) {
            :root {
                --pill-bg: linear-gradient(135deg, rgba(20, 20, 24, 0.68), rgba(10, 10, 12, 0.45));
                --pill-border: rgba(255, 255, 255, 0.14);
                --pill-shadow: 0 12px 35px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.12);
                --btn-bg: rgba(255, 255, 255, 0.06);
                --btn-hover-bg: rgba(255, 255, 255, 0.14);
                --btn-text: rgba(255, 255, 255, 0.9);
            }
        }

        #dws-menu-hover-zone {
            position: fixed;
            top: 0;
            right: 0;
            width: ${MENU_CONFIG.hoverZoneWidth};
            height: ${MENU_CONFIG.hoverZoneHeight};
            z-index: 999998;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
        }

        #dws-glass-pill {
            position: fixed;
            top: var(--pill-top);
            right: var(--pill-right);
            z-index: 999999;
            display: flex;
            gap: 8px;
            padding: 6px;
            border-radius: 999px;
            background: var(--pill-bg);
            backdrop-filter: blur(22px) saturate(180%);
            -webkit-backdrop-filter: blur(22px) saturate(180%);
            border: 1px solid var(--pill-border);
            box-shadow: var(--pill-shadow);
            transform: translateY(calc(-100% - var(--pill-top) - 25px));
            transition: transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease, border 0.4s ease;
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
        }

        #dws-glass-pill.visible {
            transform: translateY(0);
        }

        .dws-pill-btn {
            display: flex;
            align-items: center;
            height: var(--pill-btn-size);
            width: var(--pill-btn-size);
            border-radius: 999px;
            background: var(--btn-bg);
            border: 1px solid transparent;
            color: var(--btn-text);
            cursor: pointer;
            overflow: hidden;
            transition: width 0.45s cubic-bezier(0.25, 1, 0.5, 1), background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
            white-space: nowrap;
        }

        .dws-pill-btn svg {
            min-width: var(--pill-btn-size);
            height: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
        }

        .dws-pill-btn span {
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13px;
            font-weight: 500;
            padding-right: 16px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        /* FIX: Expand BOTH buttons whenever the pill itself is hovered or touch-expanded! 
           This prevents buttons from shifting away from the mouse when switching between them. */
        #dws-glass-pill:hover .dws-pill-btn,
        #dws-glass-pill.touch-expanded .dws-pill-btn {
            width: ${MENU_CONFIG.expandedWidth};
        }

        #dws-glass-pill:hover .dws-pill-btn span,
        #dws-glass-pill.touch-expanded .dws-pill-btn span {
            opacity: 1;
            transition-delay: 0.08s;
        }

        .dws-pill-btn:hover {
            background: var(--btn-hover-bg);
        }

        /* Active "Glowing White" State */
        .dws-pill-btn.active {
            background: rgba(255, 255, 255, 0.96) !important;
            color: #000000 !important;
            box-shadow: 0 0 16px rgba(255, 255, 255, 0.75), inset 0 0 6px rgba(255, 255, 255, 1);
            border: 1px solid #ffffff;
        }

        /* Mobile Responsive Adjustments so it never overflows small phone screens */
        @media (max-width: 480px) {
            :root {
                --pill-top: 12px;
                --pill-right: 12px;
            }
            #dws-glass-pill:hover .dws-pill-btn,
            #dws-glass-pill.touch-expanded .dws-pill-btn {
                width: 158px;
            }
            .dws-pill-btn span {
                font-size: 11.5px;
                padding-right: 12px;
            }
        }
    `;
    document.head.appendChild(style);

    const hoverZone = document.createElement('div');
    hoverZone.id = 'dws-menu-hover-zone';
    
    const pill = document.createElement('div');
    pill.id = 'dws-glass-pill';
    
    pill.innerHTML = `
        <div class="dws-pill-btn" id="btn-low-res">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                <line x1="2" y1="22" x2="22" y2="2"></line>
            </svg>
            <span>Low Resource Mode</span>
        </div>
        <div class="dws-pill-btn" id="btn-readability">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Readability Mode</span>
        </div>
    `;

    document.body.appendChild(hoverZone);
    document.body.appendChild(pill);

    const btnLowRes = document.getElementById('btn-low-res');
    const btnReadability = document.getElementById('btn-readability');

    const showMenu = (isTouch = false) => {
        pill.classList.add('visible');
        if (isTouch) pill.classList.add('touch-expanded');
        clearTimeout(pillHideTimeout);
    };

    const triggerHideMenu = () => {
        clearTimeout(pillHideTimeout);
        pillHideTimeout = setTimeout(() => {
            pill.classList.remove('visible', 'touch-expanded');
        }, MENU_CONFIG.autoHideDelay);
    };

    // Desktop Hover Events
    hoverZone.addEventListener('mouseenter', () => showMenu(false));
    hoverZone.addEventListener('mouseleave', triggerHideMenu);
    pill.addEventListener('mouseenter', () => showMenu(false));
    pill.addEventListener('mouseleave', triggerHideMenu);

    // Mobile Touch Events (Tap top-right corner to open & expand, tap outside to close)
    hoverZone.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        showMenu(true);
        triggerHideMenu();
    }, { passive: true });

    pill.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        showMenu(true);
        triggerHideMenu();
    }, { passive: true });

    document.addEventListener('touchstart', (e) => {
        if (pill.classList.contains('visible') && !e.target.closest('#dws-glass-pill, #dws-menu-hover-zone')) {
            pill.classList.remove('visible', 'touch-expanded');
            clearTimeout(pillHideTimeout);
        }
    }, { passive: true });

    // Button Toggles
    btnLowRes.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isLowResourceMode) { disableLowResourceMode(); } 
        else { enableLowResourceMode('User manually toggled menu'); }
        triggerHideMenu();
    });

    btnReadability.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCurrentlyEnabled = localStorage.getItem('dws_readability_mode') === 'true';
        toggleReadabilityMode(!isCurrentlyEnabled);
        triggerHideMenu();
    });

    if (localStorage.getItem('dws_readability_mode') === 'true') {
        setTimeout(() => toggleReadabilityMode(true), 150);
    }
    
    // First-open drop down after 2.45s
    if (!localStorage.getItem('dws_pill_first_open')) {
        setTimeout(() => {
            // Auto-expand labels on mobile devices during first open so phone users can read them
            const isMobileDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
            showMenu(isMobileDevice);
            triggerHideMenu();
            localStorage.setItem('dws_pill_first_open', 'true');
        }, MENU_CONFIG.autoOpenDelay);
    }
}

function updateMenuVisuals() {
    const btnLowRes = document.getElementById('btn-low-res');
    const btnReadability = document.getElementById('btn-readability');
    
    if (btnLowRes) {
        if (isLowResourceMode) btnLowRes.classList.add('active');
        else btnLowRes.classList.remove('active');
    }
    
    if (btnReadability) {
        if (localStorage.getItem('dws_readability_mode') === 'true') btnReadability.classList.add('active');
        else btnReadability.classList.remove('active');
    }
}
