document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.expandable-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const container = link.closest('.section-container');
      if (!container) return;

      container.classList.add('has-active-expansion');

      // Hide navigation arrows
      document.querySelectorAll('.arrow').forEach(arrow => {
        arrow.classList.add('web-infinity-hide-navigation');
      });

      // Build the overlay
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

      // --- INITIAL GEOMETRY CALCULATION ---
      const computedStyle = window.getComputedStyle(link);
      const borderRadius = computedStyle.borderRadius || '0px';

      const setupGeometry = () => {
        const cRect = container.getBoundingClientRect();
        const lRect = link.getBoundingClientRect();
        return {
          top: lRect.top - cRect.top,
          left: lRect.left - cRect.left,
          width: lRect.width,
          height: lRect.height
        };
      };

      const startGeo = setupGeometry();

      // Mount iframe
      iframe.src = link.getAttribute('data-iframe-src') || 'about:blank';

      // Snap the portal to the exact size and position of the clicked element
      portal.style.transition = 'none';
      portal.style.top = `${startGeo.top}px`;
      portal.style.left = `${startGeo.left}px`;
      portal.style.width = `${startGeo.width}px`;
      portal.style.height = `${startGeo.height}px`;
      portal.style.borderRadius = borderRadius;
      
      void overlay.offsetWidth; // Force browser reflow

      // Turn transitions back on and expand to fullscreen
      portal.style.transition = ''; 
      overlay.classList.add('active'); 
      
      // Lock both HTML and Body
      document.documentElement.classList.add('web-infinity-no-scroll');
      document.body.classList.add('web-infinity-no-scroll');
      
      portal.style.top = '0px';
      portal.style.left = '0px';
      portal.style.width = '100%';
      portal.style.height = '100%';
      portal.style.borderRadius = '0px';

      // --- HANDLE CLOSING ---
      closeBtn.onclick = () => {
        // Fast fade-out for the iframe and close button so they don't linger
        iframe.style.transition = 'opacity 0.2s ease';
        iframe.style.opacity = '0';
        closeBtn.style.transition = 'opacity 0.2s ease';
        closeBtn.style.opacity = '0';

        // Add closing class for the delayed background fade-out
        overlay.classList.remove('active');
        overlay.classList.add('closing'); 
        
        // Recalculate geometry in case window was resized while open
        const endGeo = setupGeometry();

        // Shrink physically back to the exact starting shape
        portal.style.top = `${endGeo.top}px`;
        portal.style.left = `${endGeo.left}px`;
        portal.style.width = `${endGeo.width}px`;
        portal.style.height = `${endGeo.height}px`;
        portal.style.borderRadius = borderRadius;
        
        // Bring arrows back
        document.querySelectorAll('.arrow').forEach(arrow => {
          arrow.classList.remove('web-infinity-hide-navigation');
        });

        // Cleanup DOM after the 0.8s CSS transition finishes
        setTimeout(() => {
          container.classList.remove('has-active-expansion');
          overlay.remove(); 
          
          // Unlock both HTML and Body
          document.documentElement.classList.remove('web-infinity-no-scroll');
          document.body.classList.remove('web-infinity-no-scroll'); 
        }, 800);
      };
    });
  });
});
