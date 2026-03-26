document.addEventListener('DOMContentLoaded', () => {
  // Grab all the specific elements
  const container = document.querySelector('.section-container');
  const mainElement = document.querySelector('main') || document.querySelector('.main-fly-in');
  const scrollSections = document.querySelectorAll('.scrollsection');
  const arrows = document.querySelectorAll('.arrow');
  
  if (!container) return;

  let isFullscreen = false;
  let lastTap = 0;

  const toggleFullscreen = () => {
    isFullscreen = !isFullscreen;
    
    if (isFullscreen) {
      // Add the class directly to each element
      container.classList.add('fullscreen-mode');
      if (mainElement) mainElement.classList.add('fullscreen-mode');
      scrollSections.forEach(sec => sec.classList.add('fullscreen-mode'));
      arrows.forEach(a => a.classList.add('hide-ui'));
      
      document.body.style.overflow = 'hidden';
    } else {
      // Remove the class from each element
      container.classList.remove('fullscreen-mode');
      if (mainElement) mainElement.classList.remove('fullscreen-mode');
      scrollSections.forEach(sec => sec.classList.remove('fullscreen-mode'));
      arrows.forEach(a => a.classList.remove('hide-ui'));
      
      document.body.style.overflow = '';
    }
  };

  // --- DESKTOP: Double Click (Capture Phase) ---
  window.addEventListener('dblclick', (e) => {
    if (!e.target.closest('.scrollsection')) return;
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
      e.preventDefault(); 
    }
    lastTap = currentTime;
  }, { capture: true });
});
