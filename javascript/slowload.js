window.addEventListener('load', () => {
  const queue = Array.from(document.querySelectorAll('[loading="slow"]'));
  const MAX_CONCURRENT = 3; // Load 3 heavy elements at a time in the background
  let activeCount = 0;
  let currentIndex = 0;

  const runWhenIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 150));

  // Smoothly triggers the CSS fade-in on the next painted frame
  function revealElement(el) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('slow-loaded');
        // Clean up will-change after the 650ms fade finishes to free GPU memory
        setTimeout(() => {
          el.style.willChange = 'auto';
        }, 700);
      });
    });
  }

  // Loads a single media node and waits for full decoding before resolving
  function loadSingleMedia(node) {
    return new Promise((resolve) => {
      const src = node.getAttribute('data-src');
      const bg = node.getAttribute('data-bg');

      if (src) {
        node.onload = async () => {
          // Decode bitmap off the main thread so the fade animation never stutters
          if (node.tagName === 'IMG' && 'decode' in node) {
            try { await node.decode(); } catch (e) {}
          }
          resolve();
        };
        node.onerror = () => resolve();

        node.src = src;
        node.removeAttribute('data-src');

        if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
          node.onloadeddata = () => resolve();
          node.load();
        }
      } else if (bg) {
        const img = new Image();
        img.onload = async () => {
          if ('decode' in img) {
            try { await img.decode(); } catch (e) {}
          }
          node.style.backgroundImage = `url('${bg}')`;
          node.removeAttribute('data-bg');
          resolve();
        };
        img.onerror = () => resolve();
        img.src = bg;
      } else {
        resolve();
      }
    });
  }

  // Processes an element (and any deferred children inside it if it's a container)
  async function processSlowElement(el) {
    const childTargets = Array.from(el.querySelectorAll('[data-src], [data-bg]'));
    
    if (el.hasAttribute('data-src') || el.hasAttribute('data-bg')) {
      await loadSingleMedia(el);
    } else if (childTargets.length > 0) {
      await Promise.all(childTargets.map(loadSingleMedia));
    }

    revealElement(el);
  }

  // Background worker pump
  function nextInQueue() {
    while (activeCount < MAX_CONCURRENT && currentIndex < queue.length) {
      const el = queue[currentIndex++];
      activeCount++;

      runWhenIdle(async () => {
        await processSlowElement(el);
        activeCount--;
        nextInQueue();
      });
    }
  }

  nextInQueue();
});
