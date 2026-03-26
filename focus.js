document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.section-container');
  const arrows = document.querySelectorAll('.arrow');
  
  if (!container) {
    console.error("TEST FAILED: Could not find .section-container");
    return;
  }

  console.log("TEST ACTIVE: Double-click anywhere on the page to test.");

  // Attach to the whole body so NOTHING can block it
  document.body.addEventListener('dblclick', (e) => {
    
    // Log exactly what element your mouse actually hit
    console.log("Double-clicked on element:", e.target);

    // Still ignore links and buttons so we don't break navigation
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) {
      console.log("Ignored: Clicked a link, button, or iframe.");
      return;
    }

    // Toggle the class
    container.classList.toggle('fullscreen-mode');

    // Check if it worked and hide/show arrows
    if (container.classList.contains('fullscreen-mode')) {
      console.log("SUCCESS: Added fullscreen-mode class.");
      arrows.forEach(a => a.classList.add('hide-ui'));
      document.body.style.overflow = 'hidden';
    } else {
      console.log("SUCCESS: Removed fullscreen-mode class.");
      arrows.forEach(a => a.classList.remove('hide-ui'));
      document.body.style.overflow = '';
    }
  });
});
