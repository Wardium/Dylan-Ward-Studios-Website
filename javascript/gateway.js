// ==========================================
// 1. STATE & CONFIGURATION
// ==========================================
let triggerWindowTimeout;
let isAuthTriggered = false;
let isLowResourceMode = false;

const STEALTH_WINDOW_MS = 2000; // 2-second window to click and trigger redirect
const FPS_THRESHOLD = 30;       // Drop below 30 FPS triggers Low Resource Mode
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// 2. INITIALIZATION & 2-SECOND STEALTH TRIGGER
// ==========================================
function initStealthAndPerformance() {
    // Start hardware & FPS monitoring immediately
    initPerformanceMonitor();

    // Open the 2-second stealth click window
    document.addEventListener('click', handleStealthTrigger);

    triggerWindowTimeout = setTimeout(() => {
        if (!isAuthTriggered) {
            document.removeEventListener('click', handleStealthTrigger);
            console.log("[Auth] 2-second stealth window expired. Remaining on public site.");
        }
    }, STEALTH_WINDOW_MS);
}

// Attach as soon as DOM is interactive so heavy images don't delay the 2s window
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStealthAndPerformance);
} else {
    initStealthAndPerformance();
}

function handleStealthTrigger() {
    if (isAuthTriggered) return;
    isAuthTriggered = true;

    clearTimeout(triggerWindowTimeout);
    document.removeEventListener('click', handleStealthTrigger);
    console.log("[Auth] Stealth trigger activated within 2s window.");

    checkAuthorization();
}

// ==========================================
// 3. LOW-RESOURCE & FPS DETECTION ENGINE
// ==========================================
function initPerformanceMonitor() {
    // A. Static Hardware Heuristics
    const lowRAM = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSoftwareGPU = checkSoftwareWebGL();

    if ((lowRAM && lowCPU) || prefersReducedMotion || isSoftwareGPU) {
        enableLowResourceMode("Hardware heuristics (Low RAM/CPU or software renderer)");
        return;
    }

    // B. Dynamic Real-Time FPS Monitor (monitors for 12 seconds after load)
    let frameCount = 0;
    let lastTime = performance.now();
    let lowFpsStrikes = 0;
    const monitorStart = lastTime;

    function checkFrame(now) {
        if (isLowResourceMode) return; // Stop monitoring if already triggered

        frameCount++;
        const elapsed = now - lastTime;

        if (elapsed >= 1000) {
            // Only evaluate if tab is active in foreground
            if (!document.hidden) {
                const currentFps = Math.round((frameCount * 1000) / elapsed);
                if (currentFps < FPS_THRESHOLD) {
                    lowFpsStrikes++;
                    // Require 2 consecutive low-FPS seconds to avoid single-frame load spikes
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

        // Keep monitoring during initial page life or while auth sequence is active
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
    if (isLowResourceMode) return;
    isLowResourceMode = true;
    console.warn(`[Perf] Low Resource Mode ENABLED: ${reason}`);

    // 1. Speed up or kill animations and strip expensive rendering effects globally
    const perfStyle = document.createElement('style');
    perfStyle.id = 'dws-low-resource-styles';
    perfStyle.innerHTML = `
        body.dws-low-spec *:not(#dws-auth-overlay):not(#dws-auth-overlay *) {
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

    // 2. Downgrade image quality & stagger pending image downloads
    const images = Array.from(document.querySelectorAll('img'));
    const pendingImages = [];

    images.forEach(img => {
        img.decoding = 'async';
        img.loading = 'lazy';
        img.fetchPriority = 'low';

        // If responsive srcset exists, lock to the lowest-res source
        if (img.srcset) {
            const firstCandidate = img.srcset.split(',')[0].trim().split(' ')[0];
            if (firstCandidate) img.src = firstCandidate;
            img.removeAttribute('srcset');
        }

        // Queue unfinished images so they load sequentially instead of choking bandwidth/CPU
        if (!img.complete && img.src) {
            pendingImages.push({ el: img, src: img.src });
            img.removeAttribute('src');
        }
    });

    // Load queued images one at a time with a 150ms breather between each
    staggerImageQueue(pendingImages);
}

async function staggerImageQueue(queue) {
    for (const item of queue) {
        item.el.src = item.src;
        await sleep(150);
    }
}

// ==========================================
// 4. AUTHORIZATION CHECK
// ==========================================
async function checkAuthorization() {
    console.log("[Auth] 1. Initiating authorization check...");
    try {
        const response = await fetch('https://auth.teamexist.com/api/verify', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.authorized && data.dashboard_url) {
            console.log("[Auth] Access GRANTED. Beginning connection sequence...");
            await runConnectionSequence(data.dashboard_url);
        } else {
            console.warn("[Auth] Access DENIED (or missing target URL). Remaining on public site.");
        }
    } catch (error) {
        console.error("[Auth] FATAL ERROR: The fetch request failed completely.", error);
    }
}

// ==========================================
// 5. CONNECTION OVERLAY SEQUENCE
// ==========================================
async function runConnectionSequence(dashboardUrl) {
    // Scale timing down to 25% if device is in Low Resource Mode
    const timeScale = isLowResourceMode ? 0.25 : 1;
    const scaledSleep = ms => sleep(Math.max(20, Math.floor(ms * timeScale)));

    const style = document.createElement('style');
    style.innerHTML = `
        #dws-auth-overlay {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 400px; height: 200px; background: #000000; border-radius: 20px;
            z-index: 999999; display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: all ${0.8 * timeScale}s ease-in-out;
            box-shadow: 0 0 30px rgba(0,0,0,0.8); color: white; font-family: monospace;
        }
        #dws-auth-blocker {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999998;
        }
        .dws-node-container { display: flex; align-items: center; justify-content: center; width: 100%; transition: opacity ${0.5 * timeScale}s; }
        .dws-node { width: 40px; height: 40px; fill: #444; transition: fill ${0.4 * timeScale}s; }
        .dws-node.active { fill: #00aaff; }
        .dws-line { height: 4px; width: 60px; background: #333; margin: 0 15px; position: relative; overflow: hidden; }
        .dws-line::after {
            content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, #00aaff, transparent); opacity: 0;
        }
        .dws-line.glowing::after { opacity: 1; animation: dwsFlow ${1 * timeScale}s linear infinite; }
        .dws-line.blinking::after { opacity: 1; animation: dwsBlink 0.2s step-end infinite; }
        .dws-line.solid { background: #00aaff; }
        .dws-text { position: absolute; font-size: 1.2rem; opacity: 0; transition: opacity ${0.4 * timeScale}s; font-weight: bold; letter-spacing: 2px; text-align: center; }

        @keyframes dwsFlow { 100% { left: 100%; } }
        @keyframes dwsBlink { 50% { opacity: 0; } }
    `;
    document.head.appendChild(style);

    const blocker = document.createElement('div');
    blocker.id = 'dws-auth-blocker';
    document.body.appendChild(blocker);

    const overlay = document.createElement('div');
    overlay.id = 'dws-auth-overlay';
    overlay.innerHTML = `
        <div class="dws-node-container" id="node-container">
            <svg class="dws-node" id="node-pc" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>
            <div class="dws-line" id="line-1"></div>
            <svg class="dws-node" id="node-web" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <div class="dws-line" id="line-2"></div>
            <svg class="dws-node" id="node-server" viewBox="0 0 24 24"><path d="M2 15h20v4H2v-4zm0-6h20v4H2V9zm0-6h20v4H2V3zm3 14h2v2H5v-2zm0-6h2v2H5v-2zm0-6h2v2H5V5z"/></svg>
        </div>
        <div class="dws-text" id="auth-text">CONNECTED</div>
    `;
    document.body.appendChild(overlay);

    await scaledSleep(50);
    overlay.style.opacity = '1';

    // Only run background glitching if the system is not in Low Resource Mode
    if (!isLowResourceMode) {
        startBackgroundGlitch(1);
    }

    await scaledSleep(800);
    document.getElementById('node-pc').classList.add('active');
    document.getElementById('line-1').classList.add('glowing');

    await scaledSleep(1500);

    if (!isLowResourceMode) {
        startBackgroundGlitch(2);
    }

    document.getElementById('line-1').classList.replace('glowing', 'solid');
    document.getElementById('node-web').classList.add('active');

    await scaledSleep(500);
    document.getElementById('line-2').classList.add('blinking');

    const randomWait = Math.floor(Math.random() * 1000) + 1000;
    await scaledSleep(randomWait);

    document.getElementById('line-2').classList.replace('blinking', 'solid');
    document.getElementById('node-server').classList.add('active');
    await scaledSleep(800);

    // Final Transition
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.borderRadius = '0px';

    document.getElementById('node-container').style.opacity = '0';
    await scaledSleep(500);

    document.getElementById('node-container').style.display = 'none';
    document.getElementById('auth-text').style.opacity = '1';

    await scaledSleep(1200);
    window.location.href = dashboardUrl;
}

// ==========================================
// 6. LIGHTWEIGHT TRANSFORM GLITCH (MIRROR & FLIP)
// ==========================================
let glitchElements = [];
let heavyElements = [];

function startBackgroundGlitch(countToAdd) {
    if (isLowResourceMode) return;

    if (glitchElements.length === 0) {
        const rawElements = document.querySelectorAll('body *:not(#dws-auth-overlay):not(#dws-auth-overlay *):not(#dws-auth-blocker)');
        glitchElements = Array.from(rawElements).filter(el => {
            return !['SCRIPT', 'STYLE', 'META', 'LINK', 'BR', 'HR'].includes(el.tagName);
        });

        const heavyRaw = document.querySelectorAll('.section, .section-container, header, footer, main');
        heavyElements = Array.from(heavyRaw).filter(el => {
            return !el.closest('#dws-auth-overlay') && !el.closest('#dws-auth-blocker');
        });
    }

    for (let i = 0; i < countToAdd; i++) {
        const slot = { targetElement: getRandomTarget() };
        runSlotAnimLoop(slot);
    }
}

function getRandomTarget() {
    if (heavyElements.length > 0 && Math.random() < 0.3) {
        return heavyElements[Math.floor(Math.random() * heavyElements.length)];
    }
    if (glitchElements.length > 0) {
        return glitchElements[Math.floor(Math.random() * glitchElements.length)];
    }
    return null;
}

function runSlotAnimLoop(slot) {
    // Immediately abort loop if Low Resource Mode kicks in mid-animation
    if (isLowResourceMode) return;

    if (slot.targetElement) {
        const el = slot.targetElement;

        // Emphasize mirroring (-1 scale) and upside-down / cardinal rotations
        const mirrorX = Math.random() < 0.65 ? -1 : 1; // 65% chance horizontal mirror
        const mirrorY = Math.random() < 0.65 ? -1 : 1; // 65% chance upside-down vertical flip

        // Mix sharp 90/180/270 degree snaps with chaotic angles
        const cardinalAngles = [0, 90, 180, -90, 180];
        const rot = Math.random() < 0.7
            ? cardinalAngles[Math.floor(Math.random() * cardinalAngles.length)]
            : Math.floor(Math.random() * 360 - 180);

        // Subtle positional jitter without heavy layout thrashing
        const x = Math.floor(Math.random() * 80 - 40);
        const y = Math.floor(Math.random() * 80 - 40);

        // Pure GPU-composited transform (no filters, blurs, or shadows)
        el.style.willChange = 'transform';
        el.style.transition = 'transform 0.06s steps(2, end)';
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${mirrorX}, ${mirrorY})`;

        if (Math.random() > 0.45) {
            slot.targetElement = getRandomTarget();
        }
    } else {
        slot.targetElement = getRandomTarget();
    }

    // Relaxed tick rate (90ms - 180ms) keeps GPU load minimal while looking snappy
    const delay = Math.floor(Math.random() * 90) + 90;
    setTimeout(() => runSlotAnimLoop(slot), delay);
}
