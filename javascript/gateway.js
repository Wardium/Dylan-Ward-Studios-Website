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
        
        /* Updated Blue Colors */
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
        
        .glitch-element { transition: transform 0.1s, opacity 0.1s; pointer-events: none; }
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
    
    const randomWait = Math.floor(Math.random() * 1000) + 1000;
    await sleep(randomWait);
    
    document.getElementById('line-2').classList.replace('blinking', 'solid');
    document.getElementById('node-server').classList.add('active');
    await sleep(800);

    // 4. The Transition & Glitch
    startBackgroundGlitch();
    
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
    // Grab elements and filter out hidden/structural tags to prevent errors
    const rawElements = document.querySelectorAll('body *:not(#dws-auth-overlay):not(#dws-auth-overlay *):not(#dws-auth-blocker)');
    const elements = Array.from(rawElements).filter(el => {
        return el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.tagName !== 'META';
    });
    
    elements.forEach(el => el.classList.add('glitch-element'));

    setInterval(() => {
        // Only modify 4 random elements per tick to keep browser performance butter-smooth
        for (let i = 0; i < 4; i++) {
            if (elements.length === 0) break;
            
            const randomEl = elements[Math.floor(Math.random() * elements.length)];
            
            const x = Math.random() * 20 - 10;
            const y = Math.random() * 20 - 10;
            const skew = Math.random() * 30 - 15;
            
            randomEl.style.transform = `translate(${x}px, ${y}px) skew(${skew}deg)`;
            randomEl.style.color = Math.random() > 0.5 ? '#ff003c' : '#00aaff';
            randomEl.style.opacity = Math.random() * 0.8 + 0.2;
            randomEl.style.backgroundColor = Math.random() > 0.9 ? 'white' : 'transparent';
        }
    }, 80);
}
