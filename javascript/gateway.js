window.addEventListener('load', () => {
    // Wait 3 seconds before checking auth
    setTimeout(checkAuthorization, 3000);
});

// Standard sleep for non-interruptible moments
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Global states for the cancel logic
let isCancelled = false;
let activeGlitchTimers = [];
let glitchElements = [];

// A custom sleep function that instantly breaks if 'isCancelled' becomes true
async function interruptibleSleep(ms) {
    const steps = Math.floor(ms / 100);
    for (let i = 0; i < steps; i++) {
        if (isCancelled) return false;
        await sleep(100);
    }
    const remainder = ms % 100;
    if (remainder > 0 && !isCancelled) await sleep(remainder);
    return !isCancelled;
}

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
            console.log("[Auth] 5. Access GRANTED. Beginning animation sequence...");
            await runConnectionSequence(data.dashboard_url);
        } else {
            console.warn("[Auth] 5. Access DENIED (or missing target URL). Remaining on public site.");
        }
    } catch (error) {
        console.error("[Auth] FATAL ERROR: The fetch request failed completely.", error);
    }
}

async function runConnectionSequence(dashboardUrl) {
    isCancelled = false;
    
    // 1. Inject Styles (Including the Cancel Button and the Death Animation)
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
        
        /* Cancel Button Styling */
        #dws-cancel-btn {
            position: absolute; bottom: 15px; background: transparent; color: #ff003c;
            border: 1px solid #ff003c; border-radius: 4px; padding: 6px 16px;
            font-family: monospace; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
        }
        #dws-cancel-btn:hover { background: #ff003c; color: #000; box-shadow: 0 0 10px #ff003c; }
        
        @keyframes flow { 100% { left: 100%; } }
        @keyframes blink { 50% { opacity: 0; } }
        
        /* Box Glitching Away Animation */
        .box-glitch-out { animation: box-die 0.4s forwards !important; }
        @keyframes box-die {
            0% { transform: translate(-50%, -50%) scale(1) skew(0deg); opacity: 1; }
            20% { transform: translate(-55%, -45%) scale(1.1) skew(15deg); filter: invert(1); }
            40% { transform: translate(-45%, -55%) scale(0.9) skew(-20deg); opacity: 0.8; }
            60% { transform: translate(-50%, -48%) scale(1.05) skew(5deg); opacity: 0.5; color: red; }
            100% { transform: translate(-50%, -50%) scale(0) skew(40deg); opacity: 0; display: none; }
        }
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
        <div class="dws-text" id="auth-text">CONNECTED</div>
        <button id="dws-cancel-btn">CANCEL</button>
    `;
    document.body.appendChild(overlay);

    // Bind the cancel event
    document.getElementById('dws-cancel-btn').addEventListener('click', executeCancel);

    // 3. Begin Animation Sequence
    const proceed0 = await interruptibleSleep(50); 
    if (!proceed0) return;
    overlay.style.opacity = '1';
    
    // Start initial background glitch with only 3 elements
    startBackgroundGlitch(3);
    
    const proceed1 = await interruptibleSleep(800); 
    if (!proceed1) return;

    document.getElementById('node-pc').classList.add('active');
    document.getElementById('line-1').classList.add('glowing');
    
    // --- THIS IS THE 3 SECOND CANCEL WINDOW ---
    const proceed2 = await interruptibleSleep(3000); 
    if (!proceed2) return; 

    // Once past 3 seconds, remove the cancel button and lock in
    document.getElementById('dws-cancel-btn').style.display = 'none';

    // Connection successful, ramp up glitch to 8 elements
    startBackgroundGlitch(5); 

    document.getElementById('line-1').classList.replace('glowing', 'solid');
    document.getElementById('node-web').classList.add('active');
    
    await interruptibleSleep(500);
    document.getElementById('line-2').classList.add('blinking');
    
    const randomWait = Math.floor(Math.random() * 1000) + 1000;
    await interruptibleSleep(randomWait);
    
    document.getElementById('line-2').classList.replace('blinking', 'solid');
    document.getElementById('node-server').classList.add('active');
    await interruptibleSleep(800);

    // 4. The Final Transition
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.borderRadius = '0px';
    
    document.getElementById('node-container').style.opacity = '0';
    await interruptibleSleep(500);
    
    document.getElementById('node-container').style.display = 'none';
    document.getElementById('auth-text').style.opacity = '1';
    
    await interruptibleSleep(1200);
    window.location.href = dashboardUrl;
}

// Spawns a specific number of independent glitch "slots"
function startBackgroundGlitch(countToAdd) {
    if (glitchElements.length === 0) {
        const rawElements = document.querySelectorAll('body *:not(#dws-auth-overlay):not(#dws-auth-overlay *):not(#dws-auth-blocker)');
        glitchElements = Array.from(rawElements).filter(el => {
            return el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.tagName !== 'META' && el.tagName !== 'LINK';
        });
    }

    for (let i = 0; i < countToAdd; i++) {
        fireGlitchSlot();
    }
}

// The recursive glitch loop for a single element slot
function fireGlitchSlot() {
    if (isCancelled || glitchElements.length === 0) return;
    
    const randomEl = glitchElements[Math.floor(Math.random() * glitchElements.length)];
    
    const x = (Math.random() * 40 - 20);
    const y = (Math.random() * 40 - 20);
    const skewX = (Math.random() * 60 - 30);
    const hue = Math.floor(Math.random() * 360);
    
    // Apply styling
    randomEl.style.transition = 'transform 0.1s linear, filter 0.1s linear';
    randomEl.style.transform = `translate(${x}px, ${y}px) skew(${skewX}deg)`;
    randomEl.style.filter = `hue-rotate(${hue}deg) ${Math.random() > 0.8 ? 'invert(1)' : ''}`;
    randomEl.style.opacity = Math.random() * 0.7 + 0.3;
    
    // Calculate a random delay for the NEXT movement (between 200ms and 800ms)
    const delay = Math.floor(Math.random() * 600) + 200;
    
    // Fire this specific slot again after the delay
    const tId = setTimeout(fireGlitchSlot, delay);
    activeGlitchTimers.push(tId);
}

// Executes when the CANCEL button is clicked
function executeCancel() {
    isCancelled = true;
    
    // 1. Terminate all active glitch timers
    activeGlitchTimers.forEach(tId => clearTimeout(tId));
    activeGlitchTimers = [];
    
    // 2. Revert the website back to normal instantly
    glitchElements.forEach(el => {
        el.style.removeProperty('transform');
        el.style.removeProperty('filter');
        el.style.removeProperty('opacity');
        el.style.removeProperty('transition');
    });
    
    // 3. Hide the nodes and the button
    document.getElementById('dws-cancel-btn').style.display = 'none';
    document.getElementById('node-container').style.display = 'none';
    
    // 4. Update the text to "Severed" in red
    const authText = document.getElementById('auth-text');
    authText.innerHTML = 'CONNECTION<br>SEVERED';
    authText.style.color = '#ff003c';
    authText.style.opacity = '1';
    
    // 5. Trigger the final failure sequence
    setTimeout(() => {
        authText.innerHTML = 'CONNECTION<br>FAILED...';
        const overlay = document.getElementById('dws-auth-overlay');
        
        // Throw the CSS animation class onto the box
        overlay.classList.add('box-glitch-out');
        
        // Remove the elements entirely once the animation finishes
        setTimeout(() => {
            overlay.remove();
            const blocker = document.getElementById('dws-auth-blocker');
            if (blocker) blocker.remove();
        }, 500); 
    }, 1500); 
}
