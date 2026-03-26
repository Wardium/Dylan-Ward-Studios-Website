document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Create a dedicated style element and put it in the head
  const dynamicStyles = document.createElement('style');
  dynamicStyles.id = 'fullscreen-overrides';
  document.head.appendChild(dynamicStyles);

  // 2. Define the exact rules you figured out, plus the smooth transition
  const activeCSS = `
    .main-fly-in, main {
      margin: 0 !important;
      height: 100% !important;
      border-radius: 0 !important;
      transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1) !important;
    }
    .scrollsection {
      padding-top: 0 !important;
      transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1) !important;
    }
    .section-container {
      height: 100% !important;
      border-radius: 0 !important;
      transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1) !important;
    }
    .arrow {
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 0.4s ease !important;
    }
  `;

  // 3. Define the rules for when it shrinks back (just the transitions)
  const inactiveCSS = `
    .main-fly-in, main, .scrollsection, .section-container, .arrow {
      transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1) !important;
    }
  `;

  // Start with inactive CSS
  dynamicStyles.innerHTML = inactiveCSS;

  // --- SINGLE CLICK LISTENER ---
  window.addEventListener('click', (e) => {
    
    // Only trigger if clicking inside the scrollable area
    if (!e.target.closest('.scrollsection')) return;
    
    // Ignore clicks on links, buttons, and your YouTube embeds
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;
    
    // Toggle the state
    const isFullscreen = document.body.classList.toggle('fullscreen-active');
    
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      // Inject your winning CSS rules
      dynamicStyles.innerHTML = activeCSS;
    } else {
      document.body.style.overflow = '';
      // Remove the rules so it snaps back, keeping only the transition
      dynamicStyles.innerHTML = inactiveCSS;
    }
    
  }, { capture: true }); 
});
