// ==========================================
// 1. STATE & CONFIGURATION
// ==========================================
const MENU_CONFIG = {
    topPosition: "10px",      // Distance from the top of the screen
    rightPosition: "17px",    // Distance from the right of the screen
    buttonSize: "38px",       // Size of the circular buttons
    expandedWidth: "190px",   // Width of the button when hovered to show text
    autoOpenDelay: 2450,      // 2.45 seconds before opening on first visit
    autoHideDelay: 4000,      // 4 seconds before it leaves if untouched
    readabilityScale: 2.5     // How much larger the text gets in Readability mode
};

let triggerWindowTimeout;
let isAuthTriggered = false;
let isLowResourceMode = false;
let isNormalModeForced = false;
let pendingImageQueue = [];
let pillHideTimeout;

const STEALTH_WINDOW_MS = 2000;
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
// 3. INITIALIZATION & 2-SECOND STEALTH TRIGGER
// ==========================================
function initStealthAndPerformance() {
    if (getCookie(COOKIE_NAME) === 'true') {
        isNormalModeForced = true;
        console.log("[Perf] Cookie detected: Normal Mode forced by user preference.");
    } else {
        initPerformanceMonitor();
    }

    document.addEventListener('click', handleStealthTrigger);

    triggerWindowTimeout = setTimeout(() => {
        if (!isAuthTriggered) {
            document.removeEventListener('click', handleStealthTrigger);
            console.log("[Auth] 2-second stealth window expired. Remaining on public site.");
        }
    }, STEALTH_WINDOW_MS);

    // Initialize the new Pill Menu
    initLiquidGlassMenu();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStealthAndPerformance);
} else {
    initStealthAndPerformance();
}

function handleStealthTrigger(e) {
    // Ignore clicks on the Liquid Glass menu or hover zone
    if (e && e.target && e.target.closest('#dws-glass-pill, #dws-menu-hover-zone')) return;
    if (isAuthTriggered) return;

    isAuthTriggered = true;
    clearTimeout(triggerWindowTimeout);
    document.removeEventListener('click', handleStealthTrigger);
    console.log("[Auth] Stealth trigger activated within 2s window.");

    checkAuthorization();
}

// ==========================================
// AUTHENTICATION SEQUENCE
// ==========================================
async function checkAuthorization() {
    console.log("[Auth] 1. Initiating authorization check...");
    try {
        // You may need to add credentials: 'include' if your auth relies on cookies
        const response = await fetch('https://auth.teamexist.com/api/verify', {
            method: 'POST', // Or 'GET' depending on your API setup
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.authorized && data.dashboard_url) {
            console.log("[Auth] 5. Access GRANTED. Beginning animation sequence...");
            
            // Calls your external animation script before redirecting
            if (typeof runConnectionSequence === 'function') {
                await runConnectionSequence(data.dashboard_url);
            } else {
                // Fallback just in case the animation script isn't loaded
                window.location.href = data.dashboard_url;
            }
        } else {
            console.warn("[Auth] Access DENIED (or missing target URL). Remaining on public site.");
        }
    } catch (error) {
        console.error("[Auth] FATAL ERROR: The fetch request failed completely.", error);
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

        if (now - monitorStart < 12000 || isAuthTriggered) {
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
    updateMenuVisuals(); // Update button glow
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
    updateMenuVisuals(); // Update button glow
}

// ==========================================
// 5. READABILITY MODE
// ==========================================
function toggleReadabilityMode(enable) {
    localStorage.setItem('dws_readability_mode', enable ? 'true' : 'false');
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span:not(#dws-glass-pill *), a:not(#dws-glass-pill *), strong, em, blockquote');
    
    textElements.forEach(el => {
        if (!el.dataset.origFontSize) {
            el.dataset.origFontSize = window.getComputedStyle(el).fontSize;
        }
        
        // Smooth transition like the "hold to grow" effect
        el.style.transition = 'font-size 0.6s cubic-bezier(0.42, 0, 0.58, 1)';
        
        if (enable) {
            const origSize = parseFloat(el.dataset.origFontSize);
            el.style.fontSize = (origSize * MENU_CONFIG.readabilityScale) + 'px';
        } else {
            el.style.fontSize = el.dataset.origFontSize;
            setTimeout(() => { el.style.transition = 'none'; }, 600);
        }
    });
    updateMenuVisuals();
}

// ==========================================
// 6. LIQUID GLASS PILL MENU
// ==========================================
function initLiquidGlassMenu() {
    if (document.getElementById('dws-glass-pill')) return;

    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --pill-top: ${MENU_CONFIG.topPosition};
            --pill-right: ${MENU_CONFIG.rightPosition};
            --pill-btn-size: ${MENU_CONFIG.buttonSize};
        }

        #dws-menu-hover-zone {
            position: fixed;
            top: 0;
            right: 0;
            width: 150px;
            height: 120px;
            z-index: 999998;
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
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02));
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            transform: translateY(calc(-100% - var(--pill-top) - 20px));
            transition: transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
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
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid transparent;
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
            white-space: nowrap;
        }

        .dws-pill-btn svg {
            min-width: var(--pill-btn-size);
            height: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .dws-pill-btn span {
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13px;
            font-weight: 500;
            padding-right: 18px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .dws-pill-btn:hover {
            width: ${MENU_CONFIG.expandedWidth};
            background: rgba(255, 255, 255, 0.15);
        }

        .dws-pill-btn:hover span {
            opacity: 1;
            transition-delay: 0.1s;
        }

        /* Active "Glowing White" State */
        .dws-pill-btn.active {
            background: rgba(255, 255, 255, 0.95);
            color: #000;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.6), inset 0 0 5px rgba(255, 255, 255, 1);
            border: 1px solid rgba(255, 255, 255, 1);
        }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML
    const hoverZone = document.createElement('div');
    hoverZone.id = 'dws-menu-hover-zone';
    
    const pill = document.createElement('div');
    pill.id = 'dws-glass-pill';
    
    // Performance Leaf SVG & Readability Eye SVG
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

    // 3. Logic & Events
    const btnLowRes = document.getElementById('btn-low-res');
    const btnReadability = document.getElementById('btn-readability');

    const showMenu = () => {
        pill.classList.add('visible');
        clearTimeout(pillHideTimeout);
    };

    const triggerHideMenu = () => {
        clearTimeout(pillHideTimeout);
        pillHideTimeout = setTimeout(() => {
            pill.classList.remove('visible');
        }, MENU_CONFIG.autoHideDelay);
    };

    // Hover events for the invisible corner zone and the menu itself
    hoverZone.addEventListener('mouseenter', showMenu);
    hoverZone.addEventListener('mouseleave', triggerHideMenu);
    pill.addEventListener('mouseenter', showMenu);
    pill.addEventListener('mouseleave', triggerHideMenu);

    // Button Clicks
    btnLowRes.addEventListener('click', () => {
        if (isLowResourceMode) { disableLowResourceMode(); } 
        else { enableLowResourceMode('User manually toggled menu'); }
    });

    btnReadability.addEventListener('click', () => {
        const isCurrentlyEnabled = localStorage.getItem('dws_readability_mode') === 'true';
        toggleReadabilityMode(!isCurrentlyEnabled);
    });

    // 4. Initial State Checks
    // Restore readability from previous session
    if (localStorage.getItem('dws_readability_mode') === 'true') {
        // Need a tiny timeout to ensure the DOM text is loaded before scaling
        setTimeout(() => toggleReadabilityMode(true), 100);
    }
    
    // First open logic
    if (!localStorage.getItem('dws_pill_first_open')) {
        setTimeout(() => {
            showMenu();
            triggerHideMenu();
            localStorage.setItem('dws_pill_first_open', 'true');
        }, MENU_CONFIG.autoOpenDelay);
    }
}

// Updates the visual glow based on current variables
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
