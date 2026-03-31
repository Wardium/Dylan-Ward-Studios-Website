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

      // Grab the image source
      const img = link.querySelector('img');
      if (img) bg.style.backgroundImage = `url(${img.src})`;

      // --- THE GEOMETRY CALCULATION ---
      const containerRect = container.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      
      // Read the computed border-radius of the clicked block dynamically
      const computedStyle = window.getComputedStyle(link);
      const borderRadius = computedStyle.borderRadius || '0px';

      // Calculate distances from the edges of the section-container (in percentages)
      const topPct = ((linkRect.top - containerRect.top) / containerRect.height) * 100;
      const leftPct = ((linkRect.left - containerRect.left) / containerRect.width) * 100;
      const rightPct = ((containerRect.right - linkRect.right) / containerRect.width) * 100;
      const bottomPct = ((containerRect.bottom - linkRect.bottom) / containerRect.height) * 100;

      // Define the exact starting shape (matching the clicked element) and target shape (fullscreen)
      const initialClipPath = `inset(${topPct}% ${rightPct}% ${bottomPct}% ${leftPct}% round ${borderRadius})`;
      const fullscreenClipPath = `inset(0% 0% 0% 0% round 0px)`;

      // Mount iframe
      iframe.src = link.getAttribute('data-iframe-src') || 'about:blank';

      // Snap the portal to the exact size, position, and curve of the clicked element
      portal.style.transition = 'none';
      portal.style.clipPath = initialClipPath;
      void overlay.offsetWidth; // Force browser reflow to register the starting position

      // Turn transitions back on and expand to fullscreen
      portal.style.transition = 'clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      overlay.classList.add('active');
      portal.style.clipPath = fullscreenClipPath;

      // --- HANDLE CLOSING ---
      closeBtn.onclick = () => {
        // Fade out UI and iframe immediately
        overlay.classList.remove('active');
        
        // Shrink back to the exact starting shape and border-radius
        portal.style.clipPath = initialClipPath;
        
        // Bring arrows back
        document.querySelectorAll('.arrow').forEach(arrow => {
          arrow.classList.remove('web-infinity-hide-navigation');
        });

        // Cleanup DOM after the 0.8s CSS transition finishes
        setTimeout(() => {
          container.classList.remove('has-active-expansion');
          overlay.remove(); // Total cleanup
        }, 800); 
      };
    });
  });
});
