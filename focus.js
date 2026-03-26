document.addEventListener('DOMContentLoaded', () => {
  // We still grab the container to animate it
  const container = document.querySelector('.section-container');
  const arrows = document.querySelectorAll('.arrow');
  
  // BUT we also grab all the individual scroll sections that sit on top
  const scrollSections = document.querySelectorAll('.scrollsection');
  
  if (!container || scrollSections.length === 0) return;

  let isFullscreen = false;
  let lastTap = 0;

  const toggleFullscreen = () => {
    isFullscreen = !isFullscreen;
    
    if (isFullscreen) {
      container.classList.add('fullscreen-mode');
      arrows.forEach(arrow => arrow.classList.add('hide-ui'));
      document.body.style.overflow = 'hidden';
    } else {
      container.classList.remove('fullscreen-mode');
      arrows.forEach(arrow => arrow.classList.remove('hide-ui'));
      document.body.style.overflow = '';
    }
  };

  // Attach the listeners to EVERY scroll section directly
  scrollSections.forEach(section => {
    
    // --- DESKTOP: Double Click Listener ---
    section.addEventListener('dblclick', (e) => {
      // Ignore clicks on links, buttons, and IFRAMES (like your YouTube embeds)
      if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;
      
      window.getSelection().removeAllRanges(); 
      toggleFullscreen();
    });

    // --- MOBILE: Double Tap Listener ---
    section.addEventListener('touchend', (e) => {
      if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0) {
        toggleFullscreen();
        // e.preventDefault(); // Uncomment this ONLY if mobile double-tap still zooms the whole webpage
      }
      lastTap = currentTime;
    });
    
  });
});
