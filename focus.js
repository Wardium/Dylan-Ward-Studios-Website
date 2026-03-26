document.addEventListener('DOMContentLoaded', () => {
  
  // --- SINGLE CLICK LISTENER ---
  window.addEventListener('click', (e) => {
    
    // 1. Only trigger if clicking somewhere inside the scrollable area
    if (!e.target.closest('.scrollsection')) return;
    
    // 2. Ignore clicks on links, buttons, and your YouTube embeds
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;
    
    // 3. Toggle the master class on the body to trigger your CSS rules
    document.body.classList.toggle('fullscreen-active');
    
    // 4. Lock the background scrolling if we are in fullscreen
    if (document.body.classList.contains('fullscreen-active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
  }, { capture: true }); // Capture phase ensures it beats your other scripts
});
