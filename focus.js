document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.section-container');
  const arrows = document.querySelectorAll('.arrow');
  
  if (!container) return;

  let isFullscreen = false;

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

  // --- SINGLE CLICK (Capture Phase) ---
  window.addEventListener('click', (e) => {
    // 1. Only trigger if clicking somewhere inside the scrollable content
    if (!e.target.closest('.scrollsection')) return;
    
    // 2. Ignore clicks on links, buttons, and your youtube videos 
    //    so the user can still interact with your content normally!
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;
    
    toggleFullscreen();
  }, { capture: true });
});
