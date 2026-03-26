document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.section-container');
  const arrows = document.querySelectorAll('.arrow');
  
  if (!container) return;

  let isFullscreen = false;
  let lastTap = 0;

  const toggleFullscreen = () => {
    isFullscreen = !isFullscreen;
    
    if (isFullscreen) {
      container.classList.add('fullscreen-mode');
      arrows.forEach(a => a.classList.add('hide-ui'));
      document.body.style.overflow = 'hidden';
    } else {
      container.classList.remove('fullscreen-mode');
      arrows.forEach(a => a.classList.remove('hide-ui'));
      document.body.style.overflow = '';
    }
  };

  // --- DESKTOP: Double Click (Capture Phase) ---
  // The { capture: true } at the end is the magic key that bypasses other scripts
  window.addEventListener('dblclick', (e) => {
    // Only proceed if the click happened inside a scrollsection
    if (!e.target.closest('.scrollsection')) return;
    
    // Still ignore links, buttons, and iframes
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;
    
    window.getSelection().removeAllRanges(); 
    toggleFullscreen();
  }, { capture: true });

  // --- MOBILE: Double Tap (Capture Phase) ---
  window.addEventListener('touchend', (e) => {
    if (!e.target.closest('.scrollsection')) return;
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      toggleFullscreen();
      // Only prevent default if we actually triggered the fullscreen
      e.preventDefault(); 
    }
    lastTap = currentTime;
  }, { capture: true });
});
