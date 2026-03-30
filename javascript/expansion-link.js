document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.expandable-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const container = link.closest('.section-container');
      if (!container) return;

      container.classList.add('has-active-expansion');

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

      const img = link.querySelector('img');
      if (img) bg.style.backgroundImage = `url(${img.src})`;

      const containerRect = container.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();

      const originX = (linkRect.left - containerRect.left) + (linkRect.width / 2);
      const originY = (linkRect.top - containerRect.top) + (linkRect.height / 2);
      const startRadius = Math.max(linkRect.width, linkRect.height) / 2;

      iframe.src = link.getAttribute('data-iframe-src') || 'about:blank';

      bg.style.transition = 'none';
      bg.style.clipPath = `circle(${startRadius}px at ${originX}px ${originY}px)`;
      void overlay.offsetWidth; 

      // Slower 1.2s transition
      bg.style.transition = 'clip-path 1.2s cubic-bezier(0.25, 1, 0.3, 1)';
      overlay.classList.add('active');
      bg.style.clipPath = `circle(150% at ${originX}px ${originY}px)`;

      closeBtn.onclick = () => {
        // Immediately remove active class to fade out iframe and disable pointer events
        overlay.classList.remove('active');
        
        // Shrink back to the original square's location
        bg.style.clipPath = `circle(${startRadius}px at ${originX}px ${originY}px)`;
        
        // Match this timer (1200ms) EXACTLY to the CSS clip-path transition time (1.2s)
        setTimeout(() => {
          iframe.src = '';
          container.classList.remove('has-active-expansion'); // Restores your scrolling
          bg.style.clipPath = 'circle(0px at 50% 50%)'; // Failsafe to completely hide the circle
        }, 1200); 
      };
    });
  });
});
