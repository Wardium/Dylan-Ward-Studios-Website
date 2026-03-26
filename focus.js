document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Inject only the smooth transition rule so it animates beautifully
  const style = document.createElement('style');
  style.innerHTML = `
    main, .section-container, .scrollsection, .arrow {
      transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1) !important;
    }
  `;
  document.head.appendChild(style);

  let isFullscreen = false;

  // --- SINGLE CLICK LISTENER ---
  window.addEventListener('click', (e) => {
    
    // Only trigger if clicking inside the scrollable area
    if (!e.target.closest('.scrollsection')) return;
    
    // Ignore links, buttons, and embeds
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;
    
    isFullscreen = !isFullscreen;

    // Grab the exact elements
    const mainEl = document.querySelector('main');
    const containerEl = document.querySelector('.section-container');
    const scrollSections = document.querySelectorAll('.scrollsection');
    const arrows = document.querySelectorAll('.arrow');

    if (isFullscreen) {
      // 2. APPLY INLINE OVERRIDES (This forces the CSS to obey)
      if (mainEl) {
        mainEl.style.setProperty('margin', '0', 'important');
        mainEl.style.setProperty('height', '100dvh', 'important');
        mainEl.style.setProperty('max-width', '100%', 'important');
        mainEl.style.setProperty('border-radius', '0', 'important');
      }
      
      if (containerEl) {
        containerEl.style.setProperty('height', '100dvh', 'important');
        containerEl.style.setProperty('max-width', '100%', 'important');
        containerEl.style.setProperty('border-radius', '0', 'important');
      }
      
      scrollSections.forEach(sec => {
        sec.style.setProperty('padding-top', '0', 'important');
        sec.style.setProperty('padding-bottom', '0', 'important');
      });
      
      arrows.forEach(a => {
        a.style.setProperty('opacity', '0', 'important');
        a.style.setProperty('pointer-events', 'none', 'important');
      });
      
      document.body.style.overflow = 'hidden';

    } else {
      // 3. REMOVE INLINE OVERRIDES (This snaps everything back to normal)
      if (mainEl) {
        mainEl.style.removeProperty('margin');
        mainEl.style.removeProperty('height');
        mainEl.style.removeProperty('max-width');
        mainEl.style.removeProperty('border-radius');
      }
      
      if (containerEl) {
        containerEl.style.removeProperty('height');
        containerEl.style.removeProperty('max-width');
        containerEl.style.removeProperty('border-radius');
      }
      
      scrollSections.forEach(sec => {
        sec.style.removeProperty('padding-top');
        sec.style.removeProperty('padding-bottom');
      });
      
      arrows.forEach(a => {
        a.style.removeProperty('opacity');
        a.style.removeProperty('pointer-events');
      });
      
      document.body.style.overflow = '';
    }
    
  }, { capture: true });
});
