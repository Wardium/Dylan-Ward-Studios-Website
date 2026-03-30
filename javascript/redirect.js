document.addEventListener('DOMContentLoaded', () => {
  const transitionElements = document.querySelectorAll('.seamless-redirect');

  transitionElements.forEach(el => {
    el.addEventListener('click', function(e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      
      const targetUrl = this.getAttribute('href') || this.getAttribute('data-href');
      if (!targetUrl) return;

      e.preventDefault(); 

      const rect = this.getBoundingClientRect();
      const clone = this.cloneNode(true);
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const targetColor = isDarkMode ? '#202124' : '#ffffff'; 

      // Setup Clone
      clone.classList.add('redirect-clone');
      Object.assign(clone.style, {
        position: 'fixed',
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
        zIndex: '9999',
        pointerEvents: 'none',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)' // Your new Ease-Out
      });
      
      const computedStyle = window.getComputedStyle(this);
      clone.style.borderRadius = computedStyle.borderRadius;
      clone.style.backgroundColor = computedStyle.backgroundColor;

      document.body.appendChild(clone);
      
      // Hide original
      this.style.opacity = '0';
      this.classList.add('redirect-hidden-original');

      // Trigger Animation
      requestAnimationFrame(() => {
        clone.classList.add('expanding');
        // Expand to fill viewport
        Object.assign(clone.style, {
          top: '0',
          left: '0',
          width: '100vw',
          height: '100vh',
          borderRadius: '0',
          backgroundColor: targetColor
        });
      });

      // REDIRECT: Only redirect after the bulk of the animation is done
      // but DO NOT clean up here.
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 800); 
    });
  });
});

// THE CLEANUP FUNCTION
function resetRedirectAnimation() {
  document.querySelectorAll('.redirect-clone').forEach(c => c.remove());
  document.querySelectorAll('.redirect-hidden-original').forEach(el => {
    el.style.opacity = '1';
    el.classList.remove('redirect-hidden-original');
  });
}

// THE BELT: Trigger when returning to the page
window.addEventListener('pageshow', (event) => {
  if (event.persisted || document.querySelector('.redirect-clone')) {
    // requestAnimationFrame forces iOS Safari to acknowledge the DOM change and repaint
    requestAnimationFrame(() => {
      resetRedirectAnimation();
    });
  }
});

// THE SUSPENDERS: Trigger right before the browser takes the cache snapshot
window.addEventListener('pagehide', () => {
  resetRedirectAnimation();
});
