document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.section-container');
  const arrows = document.querySelectorAll('.arrow');
  
  if (!container) return;

  let isFullscreen = false;
  let lastTap = 0;

  // The core function to toggle the UI states
  const toggleFullscreen = () => {
    isFullscreen = !isFullscreen;
    
    if (isFullscreen) {
      container.classList.add('fullscreen-mode');
      arrows.forEach(arrow => arrow.classList.add('hide-ui'));
      // Prevent the underlying body from scrolling while expanded
      document.body.style.overflow = 'hidden';
    } else {
      container.classList.remove('fullscreen-mode');
      arrows.forEach(arrow => arrow.classList.remove('hide-ui'));
      // Restore scrolling
      document.body.style.overflow = '';
    }
  };

  // --- DESKTOP: Double Click Listener ---
  container.addEventListener('dblclick', (e) => {
    // Don't trigger if the user is double-clicking a link or a button
    if (e.target.closest('a') || e.target.closest('button')) return;
    
    // Prevent text highlighting on double click
    window.getSelection().removeAllRanges(); 
    toggleFullscreen();
  });

  // --- MOBILE: Double Tap Listener ---
  container.addEventListener('touchend', (e) => {
    // Don't trigger if the user is tapping a link or a button
    if (e.target.closest('a') || e.target.closest('button')) return;

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    // If the second tap happens within 300 milliseconds, it's a double tap
    if (tapLength < 300 && tapLength > 0) {
      toggleFullscreen();
      e.preventDefault(); // Stop any other browser behavior from triggering
    }
    lastTap = currentTime;
  });
});
