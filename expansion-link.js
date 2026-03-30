document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.expandable-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Target the specific section container this link lives inside
      const container = link.closest('.section-container');
      if (!container) return;

      // Lock container overflow temporarily
      container.classList.add('has-active-expansion');

      // Dynamically build the overlay if it hasn't been created for this section yet
      let overlay = container.querySelector('.web-infinity-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'web-infinity-overlay';
        overlay.innerHTML = `
          <div class="web-infinity-bg"></div>
          <iframe class="web-infinity-iframe"></iframe>
          <button class="web-infinity-close">✕</button>
        `;
        container.appendChild(overlay);
      }

      const bg = overlay.querySelector('.web-infinity-bg');
      const iframe = overlay.querySelector('.web-infinity-iframe');
      const closeBtn = overlay.querySelector('.web-infinity-close');

      // Grab the background image from the clicked block
      const img = link.querySelector('img');
      if (img) bg.style.backgroundImage = `url(${img.src})`;

      // Calculate relative geometry (bypasses window scroll offset issues)
      const containerRect = container.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();

      const originX = (linkRect.left - containerRect.left) + (linkRect.width / 2);
      const originY = (linkRect.top - containerRect.top) + (linkRect.height / 2);
      const startRadius = Math.max(linkRect.width, linkRect.height) / 2;

      // Mount iframe source
      iframe.src = link.getAttribute('data-iframe-src') || 'about:blank';

      // Snap circle to the element's exact location, then force a reflow
      bg.style.transition = 'none';
      bg.style.clipPath = `circle(${startRadius}px at ${originX}px ${originY}px)`;
      void overlay.offsetWidth; 

      // Trigger the liquid expansion
      bg.style.transition = 'clip-path 0.7s cubic-bezier(0.25, 1, 0.3, 1)';
      overlay.classList.add('active');
      bg.style.clipPath = `circle(150% at ${originX}px ${originY}px)`;

      // Reverse animation on close
      closeBtn.onclick = () => {
        overlay.classList.remove('active');
        bg.style.clipPath = `circle(${startRadius}px at ${originX}px ${originY}px)`;
        
        // Cleanup after animation completes
        setTimeout(() => {
          iframe.src = '';
          container.classList.remove('has-active-expansion');
        }, 700);
      };
    });
  });
});
