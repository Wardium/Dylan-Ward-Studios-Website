window.addEventListener('load', () => {
    setTimeout(checkAuthorization, 3000);
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let isCancelled = false;
let glitchElements = [];
let glitchSlots = []; // New array to hold the independent targeting loops

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
        
        #dws-cancel-btn {
            position: absolute; bottom: 15px; background: transparent; color: #ff003c;
            border: 1px solid #ff003c; border-radius: 4px; padding: 6px 16px;
            font-family: monospace; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
        }
        #dws-cancel-btn:hover { background: #ff003c; color: #000; box-shadow: 0 0 10px #ff003c; }
        
        @keyframes flow { 100% { left: 100%; } }
        @keyframes blink { 50% { opacity: 0; } }
        
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

    document.getElementById('dws-cancel-btn').addEventListener('click', executeCancel);

    // 3. Begin Animation Sequence
    const proceed0 = await interruptibleSleep(50); 
    if (!proceed0) return;
    overlay.style.opacity = '1';
    
    // Start initial glitch with 15 active target slots
    startBackgroundGlitch(15);
    
    const proceed1 = await interruptibleSleep(800); 
    if (!proceed1) return;

    document.getElementById('node-pc').classList.add('active');
    document.getElementById('line-1').classList.add('glowing');
    
    const proceed2 = await interruptibleSleep(3000); 
    if (!proceed2) return; 

    document.getElementById('dws-cancel-btn').style.display = 'none';

    // Inject 15 more slots for the finale
    startBackgroundGlitch(15); 

    document.getElementById('line-1').classList.replace('glowing', 'solid');
    document.getElementById('node-web').classList.add('active');
    
    await interruptibleSleep(500);
    document.getElementById('line-2').classList.add('blinking');
    
    const randomWait = Math.floor(Math.random() * 1000) + 1000;
    await interruptibleSleep(randomWait);
    
    document.getElementById('line-2').classList.replace('blinking', 'solid');
    document.getElementById('node-server').classList.add('active');
    await interruptibleSleep(800);

    // 4. Final Transition
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

function startBackgroundGlitch(countToAdd) {
    if (glitchElements.length === 0) {
        const rawElements = document.querySelectorAll('body *:not(#dws-auth-overlay):not(#dws-auth-overlay *):not(#dws-auth-blocker)');
        glitchElements = Array.from(rawElements).filter(el => {
            return el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.tagName !== 'META' && el.tagName !== 'LINK';
        });
    }

    for (let i = 0; i < countToAdd; i++) {
        // Create an independent slot object that tracks its own targets and timers
        let slot = {
            targetElement: null,
            targetTimer: null,
            animTimer: null
        };
        glitchSlots.push(slot);
        runSlotTargetLoop(slot);
        runSlotAnimLoop(slot);
    }
}

// 1. Target Loop: Picks a new element to torment every 500ms
function runSlotTargetLoop(slot) {
    if (isCancelled || glitchElements.length === 0) return;
    
    // Clean up the previous element before moving on
    if (slot.targetElement) {
        slot.targetElement.style.removeProperty('transform');
        slot.targetElement.style.removeProperty('filter');
        slot.targetElement.style.removeProperty('color');
        slot.targetElement.style.removeProperty('textShadow');
        slot.targetElement.style.removeProperty('boxShadow');
        slot.targetElement.style.removeProperty('opacity');
        slot.targetElement.style.removeProperty('transition');
    }

    // Pick a new element for this slot
    slot.targetElement = glitchElements[Math.floor(Math.random() * glitchElements.length)];
    
    // Switch elements in exactly 500ms
    slot.targetTimer = setTimeout(() => runSlotTargetLoop(slot), 500);
}

// 2. Animation Loop: Thrashes the current targeted element rapidly
function runSlotAnimLoop(slot) {
    if (isCancelled) return;
    
    if (slot.targetElement) {
        const x = (Math.random() * 300 - 150); 
        const y = (Math.random() * 300 - 150); 
        const rot = (Math.random() * 180 - 90); 
        const skewX = (Math.random() * 60 - 30); 
        const skewY = (Math.random() * 60 - 30); 
        const scale = 0.5 + Math.random() * 1.5; 
        const hue = Math.floor(Math.random() * 360);
        
        const flipX = Math.random() > 0.85 ? 180 : 0;
        const flipY = Math.random() > 0.85 ? 180 : 0;
        
        const colors = ['#ff003c', '#00aaff', '#00ffcc', '#ff00ff', '#ffff00'];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        
        const shadowDist = Math.random() * 15;
        const textShadow = `${shadowDist}px ${Math.random()*5}px rgba(255,0,60,0.9), -${shadowDist}px -${Math.random()*5}px rgba(0,170,255,0.9)`;
        
        // Accelerated transitions for the thrashing effect
        slot.targetElement.style.transition = 'transform 0.03s linear, filter 0.03s linear, color 0.03s linear';
        slot.targetElement.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) rotateX(${flipX}deg) rotateY(${flipY}deg) skew(${skewX}deg, ${skewY}deg) scale(${scale})`;
        slot.targetElement.style.filter = `hue-rotate(${hue}deg) ${Math.random() > 0.6 ? 'invert(1)' : ''} blur(${Math.random() > 0.8 ? '3px' : '0px'})`;
        slot.targetElement.style.color = chosenColor;
        slot.targetElement.style.textShadow = textShadow;
        slot.targetElement.style.boxShadow = Math.random() > 0.5 ? `0 0 ${Math.random() * 30 + 10}px ${chosenColor}` : 'none'; 
        slot.targetElement.style.opacity = Math.random() * 0.8 + 0.2;
    }
    
    // Extremely fast independent jitter delay (between 20ms and 80ms)
    const delay = Math.floor(Math.random() * 60) + 20;
    slot.animTimer = setTimeout(() => runSlotAnimLoop(slot), delay);
}

function executeCancel() {
    isCancelled = true;
    
    // Halt all slot loops immediately
    glitchSlots.forEach(slot => {
        clearTimeout(slot.targetTimer);
        clearTimeout(slot.animTimer);
    });
    glitchSlots = [];
    
    // INSTANTLY snap every single element back to perfect reality
    glitchElements.forEach(el => {
        el.style.removeProperty('transform');
        el.style.removeProperty('filter');
        el.style.removeProperty('color');
        el.style.removeProperty('textShadow');
        el.style.removeProperty('boxShadow');
        el.style.removeProperty('opacity');
        el.style.removeProperty('transition');
    });
    
    document.getElementById('dws-cancel-btn').style.display = 'none';
    document.getElementById('node-container').style.display = 'none';
    
    const authText = document.getElementById('auth-text');
    authText.innerHTML = 'CONNECTION<br>SEVERED';
    authText.style.color = '#ff003c';
    authText.style.opacity = '1';
    
    setTimeout(() => {
        authText.innerHTML = 'CONNECTION<br>FAILED...';
        const overlay = document.getElementById('dws-auth-overlay');
        overlay.classList.add('box-glitch-out');
        
        setTimeout(() => {
            overlay.remove();
            const blocker = document.getElementById('dws-auth-blocker');
            if (blocker) blocker.remove();
        }, 500); 
    }, 1500); 
}
