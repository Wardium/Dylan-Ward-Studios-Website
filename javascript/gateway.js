// 1. Stealth Cancel Setup
let authTimeout;
let isCancelled = false;

window.addEventListener('load', () => {

    document.addEventListener('click', stealthCancel);
    authTimeout = setTimeout(checkAuthorization, 5000);

    
});

function stealthCancel() {
    if (!isCancelled) {
        isCancelled = true;
        clearTimeout(authTimeout);
        document.removeEventListener('click', stealthCancel);
        console.log("[Auth] Aborted. Stealth cancel triggered by user click.");
    }
}

// 2. Standard Variables
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function checkAuthorization() {
    // The 2-second window has closed. Remove the stealth listener so clicks do nothing.
    document.removeEventListener('click', stealthCancel);
    if (isCancelled) return;

    console.log("[Auth] 1. Initiating authorization check...");
    try {
        const response = await fetch('https://auth.teamexist.com/api/verify', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (isCancelled) return; // Final safeguard
        
        const data = await response.json();
        
        if (data.authorized && data.dashboard_url) {
            console.log("[Auth] Access GRANTED. Beginning animation sequence...");
            await runConnectionSequence(data.dashboard_url);
        } else {
            console.warn("[Auth] Access DENIED (or missing target URL). Remaining on public site.");
        }
    } catch (error) {
        console.error("[Auth] FATAL ERROR: The fetch request failed completely.", error);
    }
}

async function runConnectionSequence(dashboardUrl) {
    // 1. Inject Styles (Cleaned up, no cancel button CSS required)
    const style = document.createElement('style');
    style.innerHTML = `
        #dws-auth-overlay {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 400px; height: 200px; background: #000000; border-radius: 20px;
            z-index: 999999; display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: all 0.8s ease-in-out;
            box-shadow: 0 0 30px rgba(0,0,0,0.8); color: white; font-family: monospace;
        }
        #dws-auth-blocker {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999998;
        }
        .dws-node-container { display: flex; align-items: center; justify-content: center; width: 100%; transition: opacity 0.5s; }
        .dws-node { width: 40px; height: 40px; fill: #444; transition: fill 0.5s, filter 0.5s; }
        
        .dws-node.active { fill: #00aaff; filter: drop-shadow(0 0 8px #00aaff); }
        .dws-line { height: 4px; width: 60px; background: #333; margin: 0 15px; position: relative; overflow: hidden; }
        .dws-line::after {
            content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, #00aaff, transparent); transition: opacity 0.3s; opacity: 0;
        }
        .dws-line.glowing::after { opacity: 1; animation: flow 1s linear infinite; }
        .dws-line.blinking::after { opacity: 1; animation: blink 0.2s step-end infinite; }
        .dws-line.solid { background: #00aaff; box-shadow: 0 0 8px #00aaff; }
        
        .dws-text { position: absolute; font-size: 1.2rem; opacity: 0; transition: opacity 0.5s; font-weight: bold; letter-spacing: 2px; text-align: center; }
        
        @keyframes flow { 100% { left: 100%; } }
        @keyframes blink { 50% { opacity: 0; } }
    `;
    document.head.appendChild(style);

    // 2. Create the Overlay and Blocker
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
        <div class="dws-text" id="auth-text"></div>
    `;
    document.body.appendChild(overlay);

    // 3. Begin Unstoppable Animation Sequence
    await sleep(50); 
    overlay.style.opacity = '1';
    
    // Start initial glitch with 5 active target slots
    startBackgroundGlitch(1);
    
    await sleep(800); 

    document.getElementById('node-pc').classList.add('active');
    document.getElementById('line-1').classList.add('glowing');
    
    await sleep(1500); 

    // Inject 5 more slots for the finale
    startBackgroundGlitch(2); 

    document.getElementById('line-1').classList.replace('glowing', 'solid');
    document.getElementById('node-web').classList.add('active');
    
    await sleep(500);
    document.getElementById('line-2').classList.add('blinking');
    
    const randomWait = Math.floor(Math.random() * 1000) + 1000;
    await sleep(randomWait);
    
    document.getElementById('line-2').classList.replace('blinking', 'solid');
    document.getElementById('node-server').classList.add('active');
    await sleep(800);

    // 4. Final Transition
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.borderRadius = '0px';
    
    document.getElementById('node-container').style.opacity = '0';
    await sleep(500);
    
    document.getElementById('node-container').style.display = 'none';
    document.getElementById('auth-text').style.opacity = '1';
    
    await sleep(1200);
    window.location.href = dashboardUrl;
}

// 4. The Unstoppable Glitch Loops
let glitchElements = [];
let heavyElements = []; // Dedicated array for the big layout sections

function startBackgroundGlitch(countToAdd) {
    if (glitchElements.length === 0) {
        // Grab everything for general chaos
        const rawElements = document.querySelectorAll('body *:not(#dws-auth-overlay):not(#dws-auth-overlay *):not(#dws-auth-blocker)');
        glitchElements = Array.from(rawElements).filter(el => {
            return el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.tagName !== 'META' && el.tagName !== 'LINK';
        });
        
        // Specifically grab your main sections to ensure they get destroyed
        const heavyRaw = document.querySelectorAll('.section, .section-container');
        heavyElements = Array.from(heavyRaw).filter(el => {
             return !el.closest('#dws-auth-overlay') && !el.closest('#dws-auth-blocker');
        });
    }

    for (let i = 0; i < countToAdd; i++) {
        let slot = { targetElement: getRandomTarget() };
        runSlotAnimLoop(slot);
    }
}

// Helper to pick a new target, heavily biased toward your major sections
function getRandomTarget() {
    // 25% chance to hit a major structural element (if they exist on the page)
    if (heavyElements.length > 0 && Math.random() < 0.25) {
        return heavyElements[Math.floor(Math.random() * heavyElements.length)];
    }
    if (glitchElements.length > 0) {
        return glitchElements[Math.floor(Math.random() * glitchElements.length)];
    }
    return null;
}

function runSlotAnimLoop(slot) {
    if (slot.targetElement) {
        const el = slot.targetElement;
        
        // Detect if the target is an image, vector, or one of your big sections
        const isImgOrHeavy = el.tagName === 'IMG' || el.tagName === 'PICTURE' || el.tagName === 'SVG' || heavyElements.includes(el);

        const x = (Math.random() * 300 - 150); 
        const y = (Math.random() * 300 - 150); 
        const rot = (Math.random() * 180 - 90); 
        const skewX = (Math.random() * 60 - 30); 
        const skewY = (Math.random() * 60 - 30); 
        const scale = 0.5 + Math.random() * 1.5; 
        const hue = Math.floor(Math.random() * 360);
        
        // If it's an image/heavy element, chance to flip jumps from 15% to 60%
        const flipX = (isImgOrHeavy && Math.random() > 0.4) ? 180 : (Math.random() > 0.85 ? 180 : 0);
        const flipY = (isImgOrHeavy && Math.random() > 0.4) ? 180 : (Math.random() > 0.85 ? 180 : 0);
        
        const colors = ['#ff003c', '#00aaff', '#00ffcc', '#ff00ff', '#ffff00'];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        
        const shadowDist = Math.random() * 15;
        const textShadow = `${shadowDist}px ${Math.random()*5}px rgba(255,0,60,0.9), -${shadowDist}px -${Math.random()*5}px rgba(0,170,255,0.9)`;
        
        // Base filter logic
        let filterStr = `hue-rotate(${hue}deg) blur(${Math.random() > 0.8 ? '3px' : '0px'})`;
        
        // "Deep fry" effect specifically for images and big layout blocks
        if (isImgOrHeavy) {
            // High contrast, over-saturation, and high chance of inverting colors
            filterStr += ` invert(${Math.random() > 0.4 ? 1 : 0}) contrast(${Math.random() * 3 + 1}) saturate(${Math.random() * 5 + 1})`;
        } else {
            filterStr += ` ${Math.random() > 0.6 ? 'invert(1)' : ''}`;
        }

        // Apply styles (using hardware accelerated CSS to save the rendering engine)
        el.style.transition = 'transform 0.03s linear, filter 0.03s linear, color 0.03s linear';
        el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) rotateX(${flipX}deg) rotateY(${flipY}deg) skew(${skewX}deg, ${skewY}deg) scale(${scale})`;
        el.style.filter = filterStr;
        el.style.color = chosenColor;
        el.style.textShadow = textShadow;
        el.style.boxShadow = Math.random() > 0.5 ? `0 0 ${Math.random() * 30 + 10}px ${chosenColor}` : 'none'; 
        el.style.opacity = Math.random() * 0.8 + 0.2;

        // Apply chaotic blend modes specifically to images to ruin backgrounds underneath them
        if (el.tagName === 'IMG' && Math.random() > 0.5) {
            el.style.mixBlendMode = Math.random() > 0.5 ? 'difference' : 'color-dodge';
        }

        // 50% chance to abandon this element in its ruined state and grab a new one
        if (Math.random() > 0.5) {
            slot.targetElement = getRandomTarget();
        }
    } else {
        slot.targetElement = getRandomTarget();
    }
    
    const delay = Math.floor(Math.random() * 60) + 20;
    setTimeout(() => runSlotAnimLoop(slot), delay);
}
