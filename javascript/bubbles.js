window.addEventListener('DOMContentLoaded', () => {
  console.log("DWS Menu Script: DOMContentLoaded fired. Initializing...");

  // We won't strictly return if the logo isn't found right away, 
  // just in case your logo is injected by another script a split-second later.
  let logo = document.querySelector('.logo');
  if (!logo) {
    console.warn("DWS Bubblest: Element '.logo' not found on initial load. (If it gets added dynamically later, clicks will still work!)");
  } else {
    console.log("DWS Bubbles: Successfully found the logo on load:", logo);
  }

  // --- Configuration ---
  const menuItems = [
    { text: 'Home', target: 'home' },
    { text: 'About', target: 'about' },
    { text: 'Games', target: 'games' },
    { text: 'Music', target: 'music' },
    { text: 'Video', target: 'video' },
    { text: 'Software', target: 'software' },
    { text: 'Stories', target: 'stories' },
    { text: 'Social', target: 'social' }
  ];
  
  // State variables
  let isOpen = false;
  let isAnimating = false;
  let originalLogoZIndex = '';
  let originalLogoPosition = '';

  // --- 1. Inject Premium Glassmorphism & Layout CSS ---
  const style = document.createElement('style');
  style.innerHTML = `
    #dws-menu-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.65);
      z-index: 9997;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s ease;
      backdrop-filter: blur(4px); 
      -webkit-backdrop-filter: blur(4px);
    }
    #dws-menu-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    #dws-menu-container {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 90vw;
      max-width: 650px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 25px;
      z-index: 9998;
      pointer-events: none;
    }
    .dws-bubble-wrap {
      aspect-ratio: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dws-bubble {
      width: 100%; 
      height: 100%;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25), inset 0 0 20px rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: inherit;
      font-weight: 600;
      font-size: 1.15rem;
      letter-spacing: 1px;
      text-shadow: 0px 2px 4px rgba(0,0,0,0.5);
      cursor: pointer;
      transform: scale(0);
      pointer-events: auto;
      will-change: transform, opacity;
    }
    .dws-bubble span {
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    .dws-bubble:hover {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
  `;
  document.head.appendChild(style);
  console.log("DWS Menu Script: CSS and styling injected.");

  // --- 2. Build the DOM Elements ---
  const overlay = document.createElement('div');
  overlay.id = 'dws-menu-overlay';
  document.body.appendChild(overlay);

  const container = document.createElement('div');
  container.id = 'dws-menu-container';
  document.body.appendChild(container);

  const bubbleElements = [];

  menuItems.forEach((item, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'dws-bubble-wrap';
  
    const bubble = document.createElement('div');
    bubble.className = 'dws-bubble';
    
    const span = document.createElement('span');
    span.innerText = item.text; 
    
    bubble.appendChild(span);
    wrap.appendChild(bubble);
    container.appendChild(wrap);
    
    bubbleElements.push({ wrap, bubble, span, index });
  
    bubble.addEventListener('click', () => {
      console.log(`DWS Menu Script: Bubble clicked -> [${item.text}] targeting [${item.target}]`);
      if (!isAnimating) triggerWaveAndNavigate(index, item.target);
    });
  });
  console.log("DWS Menu Script: Created 8 bubbles.");

  // --- 3. Animation Logic ---
  function toggleMenu(activeLogoElement) {
    console.log("DWS Menu Script: toggleMenu called. isOpen:", isOpen, "| isAnimating:", isAnimating);
    if (isAnimating) return;

    // Refresh our logo reference just in case it was dynamically replaced
    logo = activeLogoElement; 

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu() {
    console.log("DWS Menu Script: Opening menu...");
    isAnimating = true;
    isOpen = true;

    originalLogoZIndex = logo.style.zIndex;
    originalLogoPosition = logo.style.position;
    logo.style.position = getComputedStyle(logo).position === 'static' ? 'relative' : getComputedStyle(logo).position;
    logo.style.zIndex = '9999';

    overlay.classList.add('active');

    const logoRect = logo.getBoundingClientRect();
    const logoCenter = {
      x: logoRect.left + logoRect.width / 2,
      y: logoRect.top + logoRect.height / 2
    };

    bubbleElements.forEach((el, i) => {
      const rect = el.wrap.getBoundingClientRect();
      const bubbleCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      const dx = logoCenter.x - bubbleCenter.x;
      const dy = logoCenter.y - bubbleCenter.y;

      el.bubble.style.opacity = '1';

      const animation = el.bubble.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(0)`, offset: 0 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5}px) scale(1.2, 0.8)`, offset: 0.4 }, 
        { transform: `translate(${dx * 0.15}px, ${dy * 0.15}px) scale(0.9, 1.1)`, offset: 0.7 }, 
        { transform: `translate(0, 0) scale(1)`, offset: 1 } 
      ], {
        duration: 700,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', 
        delay: i * 40, 
        fill: 'forwards'
      });

      animation.onfinish = () => {
        el.span.style.opacity = '1';
        if (i === bubbleElements.length - 1) {
          isAnimating = false;
          console.log("DWS Menu Script: Open animation finished.");
        }
      };
    });
  }

  function closeMenu() {
    console.log("DWS Menu Script: Closing menu...");
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

      const animation = el.bubble.animate([
        { transform: `translate(0, 0) scale(1)` },
        { transform: `translate(${dx}px, ${dy}px) scale(0)` }
      ], {
        duration: 400,
        easing: 'ease-in',
        delay: (bubbleElements.length - 1 - i) * 30, 
        fill: 'forwards'
      });

      animation.onfinish = () => {
        if (i === 0) { 
          isAnimating = false;
          logo.style.zIndex = originalLogoZIndex;
          logo.style.position = originalLogoPosition;
          console.log("DWS Menu Script: Close animation finished.");
        }
      };
    });
  }

  function triggerWaveAndNavigate(clickedIndex, targetPage) {
    console.log("DWS Menu Script: Triggering wave effect...");
    isAnimating = true;

    let maxDelay = 0;

    bubbleElements.forEach((el, i) => {
      el.span.style.opacity = '0'; 

      const indexDistance = Math.abs(clickedIndex - i);
      const delayMs = indexDistance * 50; 
      if (delayMs > maxDelay) maxDelay = delayMs;

      el.bubble.animate([
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
          logo.style.zIndex = originalLogoZIndex;
          logo.style.position = originalLogoPosition;
          isOpen = false;
          isAnimating = false;
    
          console.log(`DWS Menu Script: Navigation sequence starting for target: ${targetPage}`);
          if (window.navigateToPage) {
            window.navigateToPage(targetPage); 
          } else {
            console.error("DWS Menu Script Error: window.navigateToPage function is NOT DEFINED globally.");
          }
        }, 400); 
      }, maxDelay + 350); 
    }

  // --- 4. Event Listeners ---
  // Using EVENT DELEGATION to ensure clicks on children (like SVG paths) always work
  document.addEventListener('click', (e) => {
    // Traverse up the DOM tree from the clicked element to see if it, or its parents, have the class .logo
    const clickedLogo = e.target.closest('.logo');
    
    if (clickedLogo) {
      console.log("DWS Menu Script: .logo (or its child) was clicked!", e.target);
      e.preventDefault(); // Stop any default link behavior if it's an <a> tag
      toggleMenu(clickedLogo);
    }
  });
  
  overlay.addEventListener('click', () => {
    if (!isAnimating && isOpen) {
        console.log("DWS Menu Script: Overlay background clicked, closing menu.");
        closeMenu();
    }
  });

  console.log("DWS Menu Script: Initialization complete. Waiting for clicks.");
});
