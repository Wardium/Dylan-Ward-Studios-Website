document.addEventListener('DOMContentLoaded', () => {
  const transitionElements = document.querySelectorAll('.seamless-redirect');

  transitionElements.forEach(el => {
    el.addEventListener('click', function(e) {
      e.preventDefault(); // Stop the link from loading immediately

      // Get the destination URL from href or data-href
      const targetUrl = this.getAttribute('href') || this.getAttribute('data-href');
      if (!targetUrl) return;

      // 1. Get exact position and dimensions of the clicked element
      const rect = this.getBoundingClientRect();
      
      // 2. Clone the element so we don't break the actual page layout
      const clone = this.cloneNode(true);

      // 3. Detect the user's default browser theme (Light vs Dark mode)
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Most browsers use pure white or a very dark grey (#121212) for their defaults
      const targetColor = isDarkMode ? '#121212' : '#ffffff'; 

      // 4. Set the clone's initial starting position to perfectly match the original
      clone.classList.add('redirect-clone');
      clone.style.top = `${rect.top}px`;
      clone.style.left = `${rect.left}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      
      // Copy the exact computed border radius of the original element
      const computedStyle = window.getComputedStyle(this);
      clone.style.borderRadius = computedStyle.borderRadius;
      clone.style.backgroundColor = computedStyle.backgroundColor;

      // Add the clone to the screen and hide the original
      document.body.appendChild(clone);
      this.style.opacity = '0';

      // Force the browser to register the clone's initial state before animating
      clone.offsetWidth; 

      // 5. Trigger the expansion and color change
      clone.classList.add('expanding');
      clone.style.backgroundColor = targetColor;

      // 6. Wait for the CSS transition to finish (600ms), then redirect
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 600); 
    });
  });
});
