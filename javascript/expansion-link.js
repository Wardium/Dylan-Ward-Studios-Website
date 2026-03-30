document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.expandable-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const container = link.closest('.section-container');
      if (!container) return;

      container.classList.add('has-active-expansion');

      // Hide the arrows globally
      document.querySelectorAll('.arrow').forEach(arrow => {
        arrow.classList.add('web-infinity-hide-arrow');
      });

      // Always create a fresh overlay to ensure no stuck state
      let overlay = document.createElement('div');
      overlay.className = 'web-infinity-overlay';
      overlay.innerHTML = `
        <div class="web-infinity-portal">
          <div class="web-infinity-bg"></div>
          <iframe class="web-infinity-iframe"></iframe>
        </div>
        <button class="web-infinity-close">✕</button>
      `;
      container.appendChild(overlay);

      const portal = overlay.querySelector('.web-infinity-portal');
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

      // Snap the PORTAL (not just the bg) to the element
      portal.style.transition = 'none';
      portal.style.clipPath = `circle(${startRadius}px at ${originX}px ${originY}px)`;
      void overlay.offsetWidth; // Force reflow

      // Expand the portal
      portal.style.transition = 'clip-path 1.2s cubic-bezier(0.25, 1, 0.3, 1)';
      overlay.classList.add('active');
      portal.style.clipPath = `circle(150% at ${originX}px ${originY}px)`;

      closeBtn.onclick = () => {
        overlay.classList.remove('active');
        
        // Shrink the portal back
        portal.style.clipPath = `circle(${startRadius}px at ${originX}px ${originY}px)`;
        
        // Bring the arrows back immediately as the portal shrinks
        document.querySelectorAll('.arrow').forEach(arrow => {
          arrow.classList.remove('web-infinity-hide-arrow');
        });

        // Exact timing match (1200ms) to nuke it from orbit
        setTimeout(() => {
          container.classList.remove('has-active-expansion');
          overlay.remove(); // Literally delete it from the DOM. No more stuck circles.
        }, 1200); 
      };
    });
  });
});
