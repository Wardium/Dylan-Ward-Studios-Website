// ==========================================
// 1. STATE & CONFIGURATION
// ==========================================
let triggerWindowTimeout;
let isAuthTriggered = false;
let isLowResourceMode = false;
let isNormalModeForced = false;
let pendingImageQueue = [];

const STEALTH_WINDOW_MS = 2000; // 2-second window to click and trigger redirect
const FPS_THRESHOLD = 30;       // Drop below 30 FPS triggers Low Resource Mode
const COOKIE_NAME = 'dws_force_normal_mode';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// 2. COOKIE HELPERS
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
    // Check if the user previously turned off Low Resource Mode via the switch
    if (getCookie(COOKIE_NAME) === 'true') {
        isNormalModeForced = true;
        console.log("[Perf] Cookie detected: Normal Mode forced by user preference.");
    } else {
        initPerformanceMonitor();
    }

    // Open the 2-second stealth click window
    document.addEventListener('click', handleStealthTrigger);

    triggerWindowTimeout = setTimeout(() => {
        if (!isAuthTriggered) {
            document.removeEventListener('click', handleStealthTrigger);
            console.log("[Auth] 2-second stealth window expired. Remaining on public site.");
        }
    }, STEALTH_WINDOW_MS);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStealthAndPerformance);
} else {
    initStealthAndPerformance();
}

function handleStealthTrigger(e) {
    // Ignore clicks on the Liquid Glass notification bar so toggling doesn't trigger redirect
    if (e && e.target && e.target.closest('#dws-glass-toast')) return;
    if (isAuthTriggered) return;

    isAuthTriggered = true;
    clearTimeout(triggerWindowTimeout);
    document.removeEventListener('click', handleStealthTrigger);
    console.log("[Auth] Stealth trigger activated within 2s window.");

    checkAuthorization();
}

// ==========================================
// 4. LOW-RESOURCE & FPS DETECTION ENGINE
// ==========================================
function initPerformanceMonitor() {
    if (isNormalModeForced) return;

    // A. Static Hardware Heuristics
    const lowRAM = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSoftwareGPU = checkSoftwareWebGL();

    if ((lowRAM && lowCPU) || prefersReducedMotion || isSoftwareGPU) {
        enableLowResourceMode("Hardware heuristics (Low RAM/CPU or software renderer)");
        return;
    }

    // B. Dynamic Real-Time FPS Monitor
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
            return (
                renderer.includes('swiftshader') ||
                renderer.includes('llvmpipe') ||
                renderer.includes('basic render driver')
            );
        }
    } catch (e) {
        return false;
    }
    return false;
}

function enableLowResourceMode(reason) {
    if (isLowResourceMode || isNormalModeForced) return;
    isLowResourceMode = true;
    console.warn(`[Perf] Low Resource Mode ENABLED: ${reason}`);

    // 1. Inject low-spec CSS (excluding the auth overlay and the liquid glass toast)
    const perfStyle = document.createElement('style');
    perfStyle.id = 'dws-low-resource-styles';
    perfStyle.innerHTML = `
        body.dws-low-spec *:not(#dws-auth-overlay):not(#dws-auth-overlay *):not(#dws-glass-toast):not(#dws-glass-toast *) {
            animation-duration: 0.05s !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.05s !important;
            box-shadow: none !important;
            text-shadow: none !important;
            backdrop-filter: none !important;
            filter: none !important;
        }
        body.dws-low-spec img {
            image-rendering: optimizeSpeed !important;
        }
    `;
    document.head.appendChild(perfStyle);
    document.body.classList.add('dws-low-spec');

    // 2. Downgrade image quality & stagger pending downloads (saving originals for reversal)
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
    showLowResourceToast();
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

    // Persist preference in browser cookie for 1 year
    setCookie(COOKIE_NAME, 'true', 365);
    console.log("[Perf] Low Resource Mode DISABLED by user. Cookie saved.");

    // 1. Remove low-spec CSS classes and stylesheet
    document.body.classList.remove('dws-low-spec');
    const perfStyle = document.getElementById('dws-low-resource-styles');
    if (perfStyle) perfStyle.remove();

    // 2. Restore all images to full quality and immediately load any queued assets
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
}

// ==========================================
// 5. LIQUID GLASS NOTIFICATION BAR
// ==========================================
function showLowResourceToast() {
    if (document.getElementById('dws-glass-toast')) return;

    const toastStyle = document.createElement('style');
    toastStyle.id = 'dws-glass-toast-style';
    toastStyle.innerHTML = `
        #dws-glass-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000000;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 20px;
            border-radius: 999px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05));
            backdrop-filter: blur(18px) saturate(180%);
            -webkit-backdrop-filter: blur(18px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.28);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.45);
            color: #ffffff;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13.5px;
            font-weight: 500;
            letter-spacing: 0.3px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
            transform: translateY(-150%);
            opacity: 0;
            transition: transform 0.5s cubic-bezier(0.2
