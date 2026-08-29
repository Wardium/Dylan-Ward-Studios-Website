window.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.logo');
  if (!logo) return; // Failsafe if logo doesn't exist

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
      backdrop-filter: blur(4px); /* Subtle background blur */
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
      /* Responsive grid: 4 columns on desktop, 2 on mobile */
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
      /* Glassmorphism Styling */
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25), inset 0 0 20px rgba(255, 255, 255, 0.05);
      
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: inherit; /* Matches your site's font */
      font-weight: 600;
      font-size: 1.15rem;
      letter-spacing: 1px;
      text-shadow: 0px 2px 4px rgba(0,0,0,0.5);
      cursor: pointer;
      transform: scale(0); /* Hidden by default */
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

  // --- 2. Build the DOM Elements ---
  const overlay = document.createElement('div');
  overlay.id = 'dws-menu-overlay';
  document.body.appendChild(overlay);

  const container = document.createElement('div');
  container.id = 'dws-menu-container';
  document.body.appendChild(container);

  // THIS WAS MISSING: We need to define the array before pushing to it!
  const bubbleElements = [];

  // Loop over menuItems
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
  
    // Pass both the index (for the wave math) and the target page
    bubble.addEventListener('click', () => {
      if (!isAnimating) triggerWaveAndNavigate(index, item.target);
    });
  });

  // --- 3. Animation Logic ---

  function toggleMenu() {
    if (isAnimating) return;
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu() {
    isAnimating = true;
    isOpen = true;

    // Backup logo styles and force it above the overlay
    originalLogoZIndex = logo.style.zIndex;
    originalLogoPosition = logo.style.position;
    logo.style.position = getComputedStyle(logo).position === 'static' ? 'relative' : getComputedStyle(logo).position;
    logo.style.zIndex = '9999';

    // Show overlay
    overlay.classList.add('active');

    // Get Logo's absolute center position
    const logoRect = logo.getBoundingClientRect();
    const logoCenter = {
      x: logoRect.left + logoRect.width / 2,
      y: logoRect.top + logoRect.height / 2
    };

    // Animate each bubble from the logo to its grid slot
    bubbleElements.forEach((el, i) => {
      const rect = el.wrap.getBoundingClientRect();
      const bubbleCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      // Math to find the distance between logo and target slot
      const dx = logoCenter.x - bubbleCenter.x;
      const dy = logoCenter.y - bubbleCenter.y;

      // Ensure elements are visible for animation
      el.bubble.style.opacity = '1';

      // The Squash and Stretch flight path via WAAPI
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
        el.span.style.opacity = '1'; // Fade text in
        if (i === bubbleElements.length - 1) isAnimating = false;
      };
    });
  }

  function closeMenu() {
    isAnimating = true;
    isOpen = false;

    // Fade overlay out
    overlay.classList.remove('active');

    // Get Logo center again in case the user resized the window
    const logoRect = logo.getBoundingClientRect();
    const logoCenter = {
      x: logoRect.left + logoRect.width / 2,
      y: logoRect.top + logoRect.height / 2
    };

    bubbleElements.forEach((el, i) => {
      el.span.style.opacity = '0'; // Hide text

      const rect = el.wrap.getBoundingClientRect();
      const dx = logoCenter.x - (rect.left + rect.width / 2);
      const dy = logoCenter.y - (rect.top + rect.height / 2);

      // Suck them back into the logo (Reverse stagger order)
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
          // Restore logo styles
          logo.style.zIndex = originalLogoZIndex;
          logo.style.position = originalLogoPosition;
        }
      };
    });
  }

  // THIS WAS ALSO MISSING: targetPage needs to be in the function parameters
  function triggerWaveAndNavigate(clickedIndex, targetPage) {
    isAnimating = true;

    // Calculate maximum delay to know when the wave is entirely finished
    let maxDelay = 0;

    bubbleElements.forEach((el, i) => {
      el.span.style.opacity = '0'; 

      // Calculate delay based on how far this index is from the clicked index (creates the wave)
      const indexDistance = Math.abs(clickedIndex - i);
      const delayMs = indexDistance * 50; 
      if (delayMs > maxDelay) maxDelay = delayMs;

      // Pop and disappear
      el.bubble.animate([
        { transform: 'scale(1)', opacity: 1, offset: 0 },
        { transform: 'scale(1.15)', opacity: 1, offset: 0.3 }, // Grow slightly
        { transform: 'scale(0)', opacity: 0, offset: 1 } // Fade and shrink
      ], {
        duration: 350,
        easing: 'ease-out',
        delay: delayMs,
        fill: 'forwards'
      });
    });

    // Wait for the wave to finish + a tiny buffer
    setTimeout(() => {
        overlay.classList.remove('active'); 
        
        setTimeout(() => {
          logo.style.zIndex = originalLogoZIndex;
          logo.style.position = originalLogoPosition;
          isOpen = false;
          isAnimating = false;
    
          // Call the specific page assigned to that bubble
          if (window.navigateToPage) {
            window.navigateToPage(targetPage); 
          } else {
            console.error("window.navigateToPage function not found.");
          }
        }, 400); 
      }, maxDelay + 350); 
    }

  // --- 4. Event Listeners ---
  logo.addEventListener('click', toggleMenu);
  
  // Optional: Clicking the empty overlay space closes the menu
  overlay.addEventListener('click', () => {
    if (!isAnimating && isOpen) closeMenu();
  });
});
