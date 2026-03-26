document.addEventListener('DOMContentLoaded', () => {
  const transitionElements = document.querySelectorAll('.seamless-redirect');

  transitionElements.forEach(el => {
    el.addEventListener('click', function(e) {
      e.preventDefault(); 

      const targetUrl = this.getAttribute('href') || this.getAttribute('data-href');
      if (!targetUrl) return;

      const rect = this.getBoundingClientRect();
      const clone = this.cloneNode(true);

      // FIX 1: The "Seamless" Dark Mode Grey
      // Chrome/Edge default dark loading screen is usually #202124. Safari is #1c1c1e.
      // We will use #202124 as it is the most common dark grey across modern browsers.
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
      
      // Tag the original element so we can easily find it if the user hits the back button
      this.classList.add('redirect-hidden-original');
      this.style.opacity = '0';

      clone.offsetWidth; // Force the browser to register the initial state

      clone.classList.add('expanding');
      clone.style.backgroundColor = targetColor;

      setTimeout(() => {
        window.location.href = targetUrl;
      }, 600); 
    });
  });
});

// FIX 2: The Back-Button (bfcache) Reset
// This listens for the page being restored from the browser's history cache
window.addEventListener('pageshow', (event) => {
  // event.persisted is true if the page was loaded from the back-forward cache
  if (event.persisted) {
    // 1. Find and destroy any animation clones left on the screen
    document.querySelectorAll('.redirect-clone').forEach(clone => {
      clone.remove();
    });
    
    // 2. Find the original clicked element and make it visible again
    document.querySelectorAll('.redirect-hidden-original').forEach(el => {
      el.style.opacity = '1';
      el.classList.remove('redirect-hidden-original');
    });
  }
});
