document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.expandable-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const container = link.closest('.section-container');
      if (!container) return;

      container.classList.add('has-active-expansion');

      // Hide the navigation arrows uniquely
      document.querySelectorAll('.arrow').forEach(arrow => {
        arrow.classList.add('web-infinity-hide-navigation');
      });

      // Dynamically create and inject the overlay
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
      
      const targetInsets = {
        top: (linkRect.top - containerRect.top) / containerRect.height * 100,
        right: (containerRect.width - (linkRect.left + linkRect.width - containerRect.left)) / containerRect.width * 100,
        bottom: (containerRect.height - (linkRect.top + linkRect.height - containerRect.top)) / containerRect.height * 100,
        left: (linkRect.left - containerRect.left) / containerRect.width * 100
      };

      const startInsets = { top: 0, right: 0, bottom: 0, left: 0 }; // Full container
      const intermediateInsets = { top: 100, right: 100, bottom: 100, left: 100 }; // Effectively hidden inset

      iframe.src = link.getAttribute('data-iframe-src') || 'about:blank';

      // Set initial portal clip-path (effectively hidden)
      portal.style.clipPath = `inset(100%)`; 
      void overlay.offsetWidth; // Force reflow

      // --- Simple Easing Function ---
      const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

      // --- JavaScript Animation for Opening (Wobbly) ---
      let startTime = null;
      const xDuration = 1000; // 1s for X expansion
      const yDuration = 1400; // 1.4s for Y expansion (slower makes it wobblyish)

      const animateOpen = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const xProgress = Math.min(elapsed / xDuration, 1);
        const yProgress = Math.min(elapsed / yDuration, 1);

        const xEase = easeInOutCubic(xProgress);
        const yEase = easeInOutCubic(yProgress);

        const currentInsets = {
          top: targetInsets.top * (1 - yEase),
          right: targetInsets.right * (1 - xEase),
          bottom: targetInsets.bottom * (1 - yEase),
          left: targetInsets.left * (1 - xEase)
        };

        portal.style.clipPath = `inset(${currentInsets.top}% ${currentInsets.right}% ${currentInsets.bottom}% ${currentInsets.left}%)`;

        if (xProgress < 1 || yProgress < 1) {
          requestAnimationFrame(animateOpen);
        } else {
          // Open animation complete, finalize states
          portal.style.clipPath = `inset(0%)`; // Snap to full container
          overlay.classList.add('has-scaler'); // Activate close button/scaler transitions
          // Smoothly fade in iframe via CSS now that expansion is done
          iframe.style.transition = 'opacity 1.2s ease'; 
          iframe.style.opacity = '1'; 
        }
      };

      requestAnimationFrame(animateOpen); // Start open animation

      // --- Handle Closing ---
      closeBtn.onclick = () => {
        // Immediately fade out close button and iframe smoothly
        closeBtn.style.transition = 'opacity 0.4s ease'; closeBtn.style.opacity = '0';
        iframe.style.transition = 'opacity 1.2s ease'; iframe.style.opacity = '0'; // Simultaneously fade while shrinking

        // --- JavaScript Animation for Closing (Smooth) ---
        let closeStartTime = null;
        const closeDuration = 1200; // 1.2s smooth shrink (equal X/Y timing for non-wobbly close)

        const animateClose = (timestamp) => {
          if (!closeStartTime) closeStartTime = timestamp;
          const elapsed = timestamp - closeStartTime;
          const progress = Math.min(elapsed / closeDuration, 1);
          const ease = easeInOutCubic(progress);

          const currentInsets = {
            top: targetInsets.top * ease,
            right: targetInsets.right * ease,
            bottom: targetInsets.bottom * ease,
            left: targetInsets.left * ease
          };

          portal.style.clipPath = `inset(${currentInsets.top}% ${currentInsets.right}% ${currentInsets.bottom}% ${currentInsets.left}%)`;

          if (progress < 1) {
            requestAnimationFrame(animateClose);
          } else {
            // Close animation complete, clean up
            container.classList.remove('has-active-expansion');
            overlay.remove(); // Nuke the entire overlay from DOM
            // Reveal arrows
            document.querySelectorAll('.arrow').forEach(arrow => {
              arrow.classList.remove('web-infinity-hide-navigation');
            });
          }
        };

        requestAnimationFrame(animateClose); // Start close animation
      };
    });
  });
});
