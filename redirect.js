document.addEventListener('DOMContentLoaded', () => {
  const transitionElements = document.querySelectorAll('.seamless-redirect');

  transitionElements.forEach(el => {
    el.addEventListener('click', function(e) {
      // 1. Allow modifier keys (Ctrl+Click, Cmd+Click) to open in a new tab normally
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      
      e.preventDefault(); 

      const targetUrl = this.getAttribute('href') || this.getAttribute('data-href');
      if (!targetUrl) return;

      const rect = this.getBoundingClientRect();
      const clone = this.cloneNode(true);

      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const targetColor = isDarkMode ? '#202124' : '#ffffff'; 

      clone.classList.add('redirect-clone');
      clone.style.top = `${rect.top}px`;
      clone.style.left = `${rect.left}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      
      const computedStyle = window.getComputedStyle(this);
      clone.style.borderRadius = computedStyle.borderRadius;
      clone.style.backgroundColor = computedStyle.backgroundColor;

      document.body.appendChild(clone);
      
      this.classList.add('redirect-hidden-original');
      this.style.opacity = '0';

      clone.offsetWidth; 

      clone.classList.add('expanding');
      clone.style.backgroundColor = targetColor;

      // THE FIX: Trigger redirect, then immediately clean up the DOM
      setTimeout(() => {
        // Step A: Tell the browser to go to the new page
        window.location.href = targetUrl;

        // Step B: 50 milliseconds later, destroy the clone and reset the original.
        // The user won't see this happen because the browser is already freezing the UI 
        // to load the next page, but it ensures the bfcache saves a clean page.
        setTimeout(() => {
          clone.remove();
          el.style.opacity = '1';
          el.classList.remove('redirect-hidden-original');
        }, 100); 

      }, 600); 
    });
  });
});

// FALLBACK: Broad pageshow cleanup just in case
window.addEventListener('pageshow', () => {
  document.querySelectorAll('.redirect-clone').forEach(c => c.remove());
  document.querySelectorAll('.redirect-hidden-original').forEach(el => {
    el.style.opacity = '1';
    el.classList.remove('redirect-hidden-original');
  });
});
