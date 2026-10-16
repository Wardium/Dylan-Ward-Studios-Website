document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject the ultra-smooth CSS animations into the head
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      --ultra-smooth: cubic-bezier(0.42, 0, 0.58, 1); 
    }
    
    /* Random animations now use standard transforms since font-size handles the actual scaling */
    @keyframes smoothSpin3D {
      0% { transform: perspective(800px) rotateY(0deg); filter: blur(0px); }
      50% { transform: perspective(800px) rotateY(180deg) scale(1.05); filter: blur(4px); }
      100% { transform: perspective(800px) rotateY(360deg); filter: blur(0px); }
    }

    @keyframes smoothJumpSpin {
      0% { transform: translateY(0) rotate(0deg); filter: blur(0px); }
      50% { transform: translateY(-15px) rotate(180deg) scale(1.05); filter: blur(3px); }
      100% { transform: translateY(0) rotate(360deg); filter: blur(0px); }
    }

    @keyframes smoothPulseGrow {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }

    @keyframes smoothContentPop {
      0%, 100% { transform: scale(1) translateZ(0); }
      50% { transform: scale(1.1) translateZ(20px); }
    }

    @keyframes smoothRainbow {
      0% { color: var(--orig-color); transform: scale(1); }
      20% { color: #ff595e; transform: scale(1.02); }
      40% { color: #ffca3a; transform: scale(1.04); }
      60% { color: #8ac926; transform: scale(1.04); }
      80% { color: #1982c4; transform: scale(1.02); }
      100% { color: var(--orig-color); transform: scale(1); }
    }

    .anim-spin-3d { animation: smoothSpin3D 1.8s var(--ultra-smooth) forwards; }
    .anim-jump-spin { animation: smoothJumpSpin 1.4s var(--ultra-smooth) forwards; }
    .anim-pulse-grow { animation: smoothPulseGrow 1.2s var(--ultra-smooth) forwards; }
    .anim-content-pop { animation: smoothContentPop 1.2s var(--ultra-smooth) forwards; }
    .anim-rainbow { animation: smoothRainbow 2s var(--ultra-smooth) forwards; }

    .fancy-text-target {
      will-change: transform, filter, color, font-size;
      transform-origin: center center;
    }
    
    span.fancy-text-target, a.fancy-text-target, strong.fancy-text-target, em.fancy-text-target {
      display: inline-block;
    }
    
    .fancy-clickable-parent {
      cursor: pointer;
      user-select: none; 
      -webkit-user-select: none;
    }
  `;
  document.head.appendChild(style);

  // 2. Class rules
  const targetClasses = ['glass-block', 'banner-container', 'banner-overlay'];
  const allowedClasses = [...targetClasses, 'col-half', 'col-full'];
  
  const animationClasses = [
    'anim-spin-3d', 
    'anim-jump-spin', 
    'anim-pulse-grow', 
    'anim-content-pop', 
    'anim-rainbow'
  ];

  // 3. Find elements and attach listeners
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(el => {
    const classListArray = Array.from(el.classList);
    if (classListArray.length === 0) return;

    const hasTargetClass = targetClasses.some(cls => classListArray.includes(cls));
    if (!hasTargetClass) return;

    const isStrictlyAllowed = classListArray.every(cls => allowedClasses.includes(cls));

    if (isStrictlyAllowed) {
      el.classList.add('fancy-clickable-parent');
      el.dataset.fontMultiplier = "1";

      let holdRequest;
      let isHolding = false;
      let holdStartTime = 0;

      const startHold = (e) => {
        if (el.dataset.isAnimating === 'true') return;
        
        isHolding = true;
        holdStartTime = Date.now();
        const textElements = el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, strong, em, blockquote');
        
        textElements.forEach(textEl => {
          textEl.classList.add('fancy-text-target');
          
          // Store original color for the rainbow effect
          if (!textEl.style.getPropertyValue('--orig-color')) {
            const computedStyle = window.getComputedStyle(textEl);
            textEl.style.setProperty('--orig-color', computedStyle.color);
          }
          
          // Store original font-size in pixels so we can multiply it
          if (!textEl.dataset.origFontSize) {
            const computedStyle = window.getComputedStyle(textEl);
            textEl.dataset.origFontSize = parseFloat(computedStyle.fontSize);
          }
          
          // Remove transition so requestAnimationFrame is buttery smooth
          textEl.style.transition = 'none';
        });

        const growText = () => {
          if (!isHolding) return;
          
          let multiplier = parseFloat(el.dataset.fontMultiplier);
          // SLOWER growth speed
          multiplier += 0.003; 
          
          let hitEdge = false;
          const parentRect = el.getBoundingClientRect();

          // Apply the new font size
          textElements.forEach(textEl => {
            const origSize = parseFloat(textEl.dataset.origFontSize);
            textEl.style.fontSize = (origSize * multiplier) + 'px';
          });

          // Check if the wrapped text overflows the bottom or right of the box
          // We wait until multiplier > 1.05 so it doesn't pop instantly if it already touches the edge normally
          if (multiplier > 1.05) {
            textElements.forEach(textEl => {
              const rect = textEl.getBoundingClientRect();
              // A 2px buffer so it pops right before breaching the container
              if (rect.bottom > parentRect.bottom - 2 || rect.right > parentRect.right - 2) {
                hitEdge = true;
              }
            });
          }
          
          // Trigger the pop-back if it touches the edges or hits a fallback 3.5x max limit
          if (hitEdge || multiplier >= 3.5) {
            isHolding = false;
            el.dataset.fontMultiplier = "1";
            
            textElements.forEach(textEl => {
              const origSize = parseFloat(textEl.dataset.origFontSize);
              
              // Smoothly transition font-size for the bounce effect
              textEl.style.transition = 'font-size 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
              // Shrink slightly below original size to create the "squeeze" bounce
              textEl.style.fontSize = (origSize * 0.85) + 'px';
              
              // Wait for the squeeze to finish, then pop back to normal 1x size
              setTimeout(() => {
                textEl.style.transition = 'font-size 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                textEl.style.fontSize = origSize + 'px';
                
                // Clear inline transition styling once fully settled
                setTimeout(() => { textEl.style.transition = 'none'; }, 400);
              }, 300);
            });
            return;
          }

          el.dataset.fontMultiplier = multiplier.toString();
          holdRequest = requestAnimationFrame(growText);
        };
        
        setTimeout(() => { if (isHolding) growText(); }, 100);
      };

      const endHold = (e) => {
        if (!isHolding) return;
        isHolding = false;
        cancelAnimationFrame(holdRequest);

        const holdDuration = Date.now() - holdStartTime;
        
        // If it was a quick click (< 200ms), trigger the random animations
        if (holdDuration < 200) {
          const textElements = el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, strong, em, blockquote');
          if (textElements.length === 0) return;

          const randomAnim = animationClasses[Math.floor(Math.random() * animationClasses.length)];
          el.dataset.isAnimating = 'true';

          textElements.forEach(textEl => {
            textEl.classList.add(randomAnim);
          });

          const firstTextEl = textElements[0];
          firstTextEl.addEventListener('animationend', () => {
            textElements.forEach(textEl => {
              textEl.classList.remove(randomAnim);
            });
            el.dataset.isAnimating = 'false';
          }, { once: true });
        }
      };

      el.addEventListener('mousedown', startHold);
      el.addEventListener('mouseup', endHold);
      el.addEventListener('mouseleave', endHold);
      
      el.addEventListener('touchstart', (e) => { startHold(e); }, {passive: true});
      el.addEventListener('touchend', endHold);
      el.addEventListener('touchcancel', endHold);
    }
  });
});
