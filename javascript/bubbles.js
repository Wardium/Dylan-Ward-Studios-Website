window.addEventListener('DOMContentLoaded', () => {
  console.log("DWS Menu Script: Initializing Seamless Bubble Engine...");

  let logo = document.querySelector('.logo');
  if (!logo) console.warn("DWS Menu Script: Element '.logo' not found on initial load.");

  // --- Configuration ---
  const menuItems = [
    { text: 'Home', target: 'main' },
    { text: 'About', target: 'about' },
    { text: 'Games', target: 'game' },
    { text: 'Music', target: 'sounds' },
    { text: 'Video', target: 'youtube' },
    { text: 'Software', target: 'github' },
    { text: 'Stories', target: 'book' },
    { text: 'Social', target: 'socials' }
  ];
  
  let isOpen = false;
  let isAnimating = false;
  let originalLogoZIndex = '';
  let originalLogoPosition = '';

  // --- 1. Inject Premium Glassmorphism & Floating CSS ---
  const style = document.createElement('style');
  style.innerHTML = `
    /* Force pointer cursor on the logo and all its children */
    .logo, .logo * {
      cursor: pointer !important;
    }

    /* Overlay */
    #dws-menu-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9997;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.5s ease;
      backdrop-filter: blur(6px); 
      -webkit-backdrop-filter: blur(6px);
    }
    #dws-menu-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    /* Pull logo and ALL its children above the overlay */
    .logo-active-over-menu {
      position: relative !important;
      z-index: 9999 !important;
    }
    .logo-active-over-menu * {
      z-index: 9999 !important;
    }

    /* Container Grid - Increased size to fill the screen better */
    #dws-menu-container {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 95vw;
      max-width: 1100px; 
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); 
      gap: 40px;
      z-index: 9998;
      pointer-events: none;
    }

    /* Animation Layers */
    .dws-bubble-wrap {
      aspect-ratio: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0; /* Hidden before flight */
    }
    .dws-float-layer {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: dws-float 6s ease-in-out infinite;
    }

    /* The Perfect Circle Bubble */
    .dws-bubble-visual {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      border-radius: 50%; /* Perfect Circle */
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3), inset 0 0 25px rgba(255, 255, 255, 0.1);
      cursor: pointer;
      pointer-events: auto;
      transition: background 0.3s ease, border 0.3s ease;
    }

    .dws-bubble-visual:hover {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.5);
    }

    /* The Text Layer */
    .dws-bubble-text {
      position: relative;
      z-index: 2;
      color: white;
      font-family: inherit;
      font-weight: 600;
      font-size: 1.4rem; /* Slightly larger text to match bigger bubbles */
      letter-spacing: 1.5px;
      text-shadow: 0px 2px 6px rgba(0,0,0,0.6);
      pointer-events: none;
      opacity: 0; /* Fades in later */
      transition: opacity 0.4s ease;
    }

    /* Keyframes for the Float Physics */
    @keyframes dws-float {
      0%, 100% { transform: translateY(0) translateX(0); }
      33% { transform: translateY(-12px) translateX(6px); }
      66% { transform: translateY(10px) translateX(-4px); }
    }
  `;
  document.head.appendChild(style);

  // --- 2. Build the DOM Elements ---
  const overlay = document.createElement('div');
  overlay.id = 'dws-menu-overlay';
  document.body.appendChild(overlay);

  const container = document.createElement('div');
  container.id = 'dws-menu-container';
  document.body.appendChild(container);

  const bubbleElements = [];

  menuItems.forEach((item, index) => {
    // 1. The wrapper (Handles JS Flyout & scale)
    const wrap = document.createElement('div');
    wrap.className = 'dws-bubble-wrap';
  
    // 2. The float layer (Handles CSS floating up/down)
    const floatLayer = document.createElement('div');
    floatLayer.className = 'dws-float-layer';
    
    // Offset the float animations randomly so they don't move perfectly in sync
    floatLayer.style.animationDelay = `-${Math.random() * 5}s`; 

    // 3. The Bubble visual (Perfect circle)
    const visual = document.createElement('div');
    visual.className = 'dws-bubble-visual';
    
    // 4. The Text 
    const span = document.createElement('span');
    span.className = 'dws-bubble-text';
    span.innerText = item.text; 
    
    floatLayer.appendChild(visual);
    floatLayer.appendChild(span);
    wrap.appendChild(floatLayer);
    container.appendChild(wrap);
    
    bubbleElements.push({ wrap, visual, span, index });
  
    // Listen for clicks on the visual bubble
    visual.addEventListener('click', () => {
      if (!isAnimating) triggerWaveAndNavigate(index, item.target);
    });
  });

  // --- 3. Animation Logic ---
  function toggleMenu(activeLogoElement) {
    if (isAnimating) return;
    logo = activeLogoElement; 
    if (isOpen) closeMenu();
    else openMenu();
  }

  function openMenu() {
    isAnimating = true;
    isOpen = true;

    // Secure logo z-index
    originalLogoZIndex = logo.style.zIndex;
    originalLogoPosition = logo.style.position;
    logo.classList.add('logo-active-over-menu');

    overlay.classList.add('active');

    const logoRect = logo.getBoundingClientRect();
    const logoCenter = {
      x: logoRect.left + logoRect.width / 2,
      y: logoRect.top + logoRect.height / 2
    };

    // 1. Reset everything into the grid completely invisibly
    bubbleElements.forEach(el => {
      el.wrap.getAnimations().forEach(anim => anim.cancel());
      el.wrap.style.transform = 'none'; 
      el.wrap.style.opacity = '0'; 
    });

    // 2. Force browser to recalculate the fresh layout BEFORE proceeding
    void container.offsetWidth; 

    bubbleElements.forEach((el, i) => {
      // 3. Measure where the grid wants the bubble to be
      const rect = el.wrap.getBoundingClientRect();
      const bubbleCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      const dx = logoCenter.x - bubbleCenter.x;
      const dy = logoCenter.y - bubbleCenter.y;

      // 4. THE ANTI-FLICKER FIX: Teleport the invisible bubble to the logo and crush it to scale(0)
      el.wrap.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
      
      // 5. Now it's safe to make it visible (because it's scaled to 0, you can't see it yet)
      el.wrap.style.opacity = '1';

      // 6. Animate from the logo out to the grid
      const animation = el.wrap.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(0)`, offset: 0 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5}px) scale(1.2, 0.8)`, offset: 0.4 }, 
        { transform: `translate(${dx * 0.15}px, ${dy * 0.15}px) scale(0.9, 1.1)`, offset: 0.7 }, 
        { transform: `translate(0, 0) scale(1)`, offset: 1 } 
      ], {
        duration: 800,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', 
        delay: i * 45, 
        fill: 'forwards'
      });

      animation.onfinish = () => {
        el.span.style.opacity = '1'; 
        if (i === bubbleElements.length - 1) isAnimating = false;
      };
    });
  }

  function closeMenu() {
    isAnimating = true;
    isOpen = false;

    overlay.classList.remove('active');

    const logoRect = logo.getBoundingClientRect();
    const logoCenter = {
      x: logoRect.left + logoRect.width / 2,
      y: logoRect.top + logoRect.height / 2
    };

    bubbleElements.forEach((el, i) => {
      el.span.style.opacity = '0'; 

      const rect = el.wrap.getBoundingClientRect();
      const dx = logoCenter.x - (rect.left + rect.width / 2);
      const dy = logoCenter.y - (rect.top + rect.height / 2);

      const animation = el.wrap.animate([
        { transform: `translate(0, 0) scale(1)` },
        { transform: `translate(${dx}px, ${dy}px) scale(0)` }
      ], {
        duration: 450,
        easing: 'ease-in',
        delay: (bubbleElements.length - 1 - i) * 30, 
        fill: 'forwards'
      });

      animation.onfinish = () => {
        el.wrap.style.opacity = '0'; // Hide it fully once it lands in the logo
        if (i === 0) { 
          isAnimating = false;
          logo.classList.remove('logo-active-over-menu');
        }
      };
    });
  }

  function triggerWaveAndNavigate(clickedIndex, targetPage) {
    isAnimating = true;
    let maxDelay = 0;

    bubbleElements.forEach((el, i) => {
      el.span.style.opacity = '0'; 

      const indexDistance = Math.abs(clickedIndex - i);
      const delayMs = indexDistance * 55; 
      if (delayMs > maxDelay) maxDelay = delayMs;

      el.wrap.animate([
        { transform: 'scale(1)', opacity: 1, offset: 0 },
        { transform: 'scale(1.15)', opacity: 1, offset: 0.3 }, 
        { transform: 'scale(0)', opacity: 0, offset: 1 } 
      ], {
        duration: 350,
        easing: 'ease-out',
        delay: delayMs,
        fill: 'forwards'
      });
    });

    setTimeout(() => {
        overlay.classList.remove('active'); 
        
        setTimeout(() => {
          logo.classList.remove('logo-active-over-menu');
          isOpen = false;
          isAnimating = false;
    
          if (window.navigateToPage) {
            window.navigateToPage(targetPage); 
          } else {
            console.error("Error: window.navigateToPage function is NOT DEFINED.");
          }
        }, 500); 
      }, maxDelay + 350); 
    }

  // --- 4. Event Listeners ---
  document.addEventListener('click', (e) => {
    const clickedLogo = e.target.closest('.logo');
    if (clickedLogo) {
      e.preventDefault(); 
      toggleMenu(clickedLogo);
    }
  });
  
  overlay.addEventListener('click', () => {
    if (!isAnimating && isOpen) closeMenu();
  });
});
