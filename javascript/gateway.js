window.addEventListener('load', () => {
    // Wait 3 seconds before checking auth
    setTimeout(checkAuthorization, 3000);
});

// Helper function for the animation timings
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function checkAuthorization() {
    console.log("[Auth] 1. Initiating authorization check...");
    try {
        console.log("[Auth] 2. Sending fetch request to API with credentials included...");
        
        const response = await fetch('https://auth.teamexist.com/api/verify', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`[Auth] 3. Received response. HTTP Status: ${response.status}`);
        
        const data = await response.json();
        console.log("[Auth] 4. Decoded JSON payload from server:", data);
        
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
    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #dws-auth-overlay {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 400px; height: 200px; background: #000000; border-radius: 20px;
            z-index: 999999; display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: all 0.8s ease-in-out;
            box-shadow: 0 0 30px rgba(0,0,0,0.8); color: white; font-family: monospace;
        }
        /* Lock out background clicking */
        #dws-auth-blocker {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999998;
        }
        .dws-node-container { display: flex; align-items: center; justify-content: center; width: 100%; transition: opacity 0.5s; }
        .dws-node { width: 40px; height: 40px; fill: #444; transition: fill 0.5s, filter 0.5s; }
        
        /* Blue Colors */
        .dws-node.active { fill: #00aaff; filter: drop-shadow(0 0 8px #00aaff); }
        .dws-line { height: 4px; width: 60px; background: #333; margin: 0 15px; position: relative; overflow: hidden; }
        .dws-line::after {
            content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, #00aaff, transparent); transition: opacity 0.3s; opacity: 0;
        }
        .dws-line.glowing::after { opacity: 1; animation: flow 1s linear infinite; }
        .dws-line.blinking::after { opacity: 1; animation: blink 0.2s step-end infinite; }
        .dws-line.solid { background: #00aaff; box-shadow: 0 0 8px #00aaff; }
        
        /* Absolute positioning forces it to stay perfectly centered */
        .dws-text { position: absolute; font-size: 1.2rem; opacity: 0; transition: opacity 0.5s; font-weight: bold; letter-spacing: 2px; }
        
        @keyframes flow { 100% { left: 100%; } }
        @keyframes blink { 50% { opacity: 0; } }
        
        .glitch-element { transition: all 0.08s ease-out; pointer-events: none; }
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
    `;
    document.body.appendChild(overlay);

    // 3. Begin Animation Sequence
    await sleep(50); 
    overlay.style.opacity = '1';
    await sleep(800); 

    document.getElementById('node-pc').classList.add('active');
    document.getElementById('line-1').classList.add('glowing');
    
    await sleep(1000);
    document.getElementById('line-1').classList.replace('glowing', 'solid');
    document.getElementById('node-web').classList.add('active');
    
    await sleep(500);
    document.getElementById('line-2').classList.add('blinking');
    
    // --- EARLY GLITCH IGNITION ---
    startBackgroundGlitch();
    
    const randomWait = Math.floor(Math.random() * 1000) + 1000;
    await sleep(randomWait);
    
    document.getElementById('line-2').classList.replace('blinking', 'solid');
    document.getElementById('node-server').classList.add('active');
    await sleep(800);

    // 4. The Transition
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

function startBackgroundGlitch() {
    // Grab elements and filter out hidden/structural tags to prevent DOM errors
    const rawElements = document.querySelectorAll('body *:not(#dws-auth-overlay):not(#dws-auth-overlay *):not(#dws-auth-blocker)');
    const elements = Array.from(rawElements).filter(el => {
        return el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.tagName !== 'META';
    });
    
    elements.forEach(el => {
        el.classList.add('glitch-element');
    });

    let intensity = 1;
    let elementsPerTick = 2;
    
    // Ramp up the madness aggressively over the next 2.5 seconds
    const rampUpInterval = setInterval(() => {
        intensity += 0.8;
        elementsPerTick += 4;
        
        // Cap the intensity to prevent complete browser lockups
        if (intensity >= 15) {
            clearInterval(rampUpInterval);
        }
    }, 150);

    const glitchColors = ['#ff003c', '#00aaff', '#00ffcc', '#ff00ff', '#ffff00', '#ffffff'];

    setInterval(() => {
        // Mutate multiple elements rapidly based on current intensity
        for (let i = 0; i < elementsPerTick; i++) {
            if (elements.length === 0) break;
            
            const randomEl = elements[Math.floor(Math.random() * elements.length)];
            
            // 1. Math for heavy skew, translation, and scaling
            const x = (Math.random() * 40 - 20) * (intensity / 2);
            const y = (Math.random() * 40 - 20) * (intensity / 2);
            const skewX = (Math.random() * 60 - 30) * (intensity / 3);
            const skewY = (Math.random() * 60 - 30) * (intensity / 3);
            const scale = 1 + (Math.random() * 0.8 - 0.4) * (intensity / 6);
            
            // 2. Trippy Chromatic & Filter Effects
            const hueRotate = Math.floor(Math.random() * 360);
            const blurAmt = Math.random() > 0.7 ? `${Math.random() * 4}px` : '0px';
            const invertAmt = Math.random() > 0.8 ? '100%' : '0%';
            
            // 3. Chromatic Aberration Text Shadows (Harsh Red/Cyan splits)
            const rgbOffset = Math.random() * 6 * intensity;
            const textShadow = `${rgbOffset}px 0px 0px rgba(255,0,0,0.8), -${rgbOffset}px 0px 0px rgba(0,255,255,0.8)`;
            
            // Apply transformations
            randomEl.style.transform = `translate(${x}px, ${y}px) skew(${skewX}deg, ${skewY}deg) scale(${scale})`;
            randomEl.style.filter = `hue-rotate(${hueRotate}deg) blur(${blurAmt}) invert(${invertAmt})`;
            randomEl.style.textShadow = textShadow;
            randomEl.style.opacity = Math.random() * 0.6 + 0.4;
            
            // Blast the colors with neon hex codes
            randomEl.style.color = glitchColors[Math.floor(Math.random() * glitchColors.length)];
            
            // Randomly corrupt the background slightly
            if (Math.random() > 0.85) {
                const bgColors = ['rgba(255,0,60,0.3)', 'rgba(0,170,255,0.3)', 'rgba(0,255,204,0.3)'];
                randomEl.style.backgroundColor = bgColors[Math.floor(Math.random() * bgColors.length)];
            }
        }
    }, 50); // Fire every 50ms for a highly chaotic, high-framerate tear
}
