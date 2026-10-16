document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject the ultra-smooth CSS animations into the head
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      /* Perfectly smooth acceleration and deceleration */
      --ultra-smooth: cubic-bezier(0.42, 0, 0.58, 1); 
    }

    /* All animations now incorporate var(--text-scale, 1) so they respect the "held" size */
    
    /* Animation 1: Smooth, slow 3D Spin */
    @keyframes smoothSpin3D {
      0% { transform: perspective(800px) rotateY(0deg) scale(var(--text-scale, 1)); filter: blur(0px); }
      50% { transform: perspective(800px) rotateY(180deg) scale(calc(var(--text-scale, 1) + 0.05)); filter: blur(4px); }
      100% { transform: perspective(800px) rotateY(360deg) scale(var(--text-scale, 1)); filter: blur(0px); }
    }

    /* Animation 2: Soft Jump and Spin */
    @keyframes smoothJumpSpin {
      0% { transform: translateY(0) rotate(0deg) scale(var(--text-scale, 1)); filter: blur(0px); }
      50% { transform: translateY(-15px) rotate(180deg) scale(calc(var(--text-scale, 1) + 0.05)); filter: blur(3px); }
      100% { transform: translateY(0) rotate(360deg) scale(var(--text-scale, 1)); filter: blur(0px); }
    }

    /* Animation 3: Gentle grow then shrink back */
    @keyframes smoothPulseGrow {
      0%, 100% { transform: scale(var(--text-scale, 1)); }
      50% { transform: scale(calc(var(--text-scale, 1) + 0.15)); }
    }

    /* Animation 4: Text softly pops toward you */
    @keyframes smoothContentPop {
      0%, 100% { transform: scale(var(--text-scale, 1)) translateZ(0); }
      50% { transform: scale(calc(var(--text-scale, 1) + 0.1)) translateZ(20px); }
    }

    /* Animation 5: Rainbow Color Cycle */
    @keyframes smoothRainbow {
      0% { color: var(--orig-color); transform: scale(var(--text-scale, 1)); }
      20% { color: #ff595e; transform: scale(calc(var(--text-scale, 1) + 0.02)); }
      40% { color: #ffca3a; transform: scale(calc(var(--text-scale, 1) + 0.04)); }
      60% { color: #8ac926; transform: scale(calc(var(--text-scale, 1) + 0.04)); }
      80% { color: #1982c4; transform: scale(calc(var(--text-scale, 1) + 0.02)); }
      100% { color: var(--orig-color); transform: scale(var(--text-scale, 1)); }
    }
    
    /* Pop back animation for when the text gets too big */
    @keyframes popBack {
      0% { transform: scale(var(--pop-start-scale, 3)); }
      50% { transform: scale(0.8); }
      100% { transform: scale(1); }
    }

    /* Assigning classes to animations with slow, smooth durations */
    .anim-spin-3d { animation: smoothSpin3D 1.8s var(--ultra-smooth) forwards; }
    .anim-jump-spin { animation: smoothJumpSpin 1.4s var(--ultra-smooth) forwards; }
    .anim-pulse-grow { animation: smoothPulseGrow 1.2s var(--ultra-smooth) forwards; }
    .anim-content-pop { animation: smoothContentPop 1.2s var(--ultra-smooth) forwards; }
    .anim-rainbow { animation: smoothRainbow 2s var(--ultra-smooth) forwards; }
    .anim-pop-back { animation: popBack 0.6s var(--ultra-smooth) forwards; }

    /* Required for text elements */
    .fancy-text-target {
      will-change: transform, filter, color;
      transform-origin: center center;
      /* Base transform uses the scale variable so it remembers its size */
      transform: scale(var(--text-scale, 1));
      transition: transform 0.1s linear; /* Smooths out the requestAnimationFrame */
    }
    
    span.fancy-text-target, a.fancy-text-target, strong.fancy-text-target, em.fancy-text-target {
      display: inline-block;
    }
    
    .fancy-clickable-parent {
      cursor: pointer;
      user-select: none; /* Prevents text highlighting while holding */
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
      
      // Initialize scale tracking for this container
      el.dataset.currentScale = "1";

      let holdRequest;
      let isHolding = false;
      let holdStartTime = 0;

      // Start holding
      const startHold = (e) => {
        if (el.dataset.isAnimating === 'true') return;
        
        isHolding = true;
        holdStartTime = Date.now();
        const textElements = el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, strong, em, blockquote');
        
        // Save original color for the rainbow animation before we do anything
        textElements.forEach(textEl => {
          textEl.classList.add('fancy-text-target');
          if (!textEl.style.getPropertyValue('--orig-color')) {
            const computedColor = window.getComputedStyle(textEl).color;
            textEl.style.setProperty('--orig-color', computedColor);
          }
        });

        // The growth loop
        const growText = () => {
          if (!isHolding) return;
          
          let currentScale = parseFloat(el.dataset.currentScale);
          currentScale += 0.015; // Speed of the growth
          
          // Max size threshold (change 2.5 if you want it to grow larger/smaller before popping)
          if (currentScale >= 2.5) {
            isHolding = false;
            el.dataset.currentScale = "1";
            
            textElements.forEach(textEl => {
              textEl.style.setProperty('--pop-start-scale', currentScale);
              textEl.style.setProperty('--text-scale', "1");
              textEl.classList.add('anim-pop-back');
              
              textEl.addEventListener('animationend', function popEnd() {
                textEl.classList.remove('anim-pop-back');
                textEl.removeEventListener('animationend', popEnd);
              }, { once: true });
            });
            return;
          }

          el.dataset.currentScale = currentScale.toString();
          textElements.forEach(textEl => {
            textEl.style.setProperty('--text-scale', currentScale);
          });

          holdRequest = requestAnimationFrame(growText);
        };
        
        // Start growing after a tiny delay so quick clicks don't grow instantly
        setTimeout(() => { if (isHolding) growText(); }, 100);
      };

      // End holding
      const endHold = (e) => {
        if (!isHolding) return;
        isHolding = false;
        cancelAnimationFrame(holdRequest);

        const holdDuration = Date.now() - holdStartTime;
        
        // If they held for less than 200ms, treat it as a CLICK (trigger random animation)
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

      // Desktop mouse events
      el.addEventListener('mousedown', startHold);
      el.addEventListener('mouseup', endHold);
      el.addEventListener('mouseleave', endHold);
      
      // Mobile touch events
      el.addEventListener('touchstart', (e) => { startHold(e); }, {passive: true});
      el.addEventListener('touchend', endHold);
      el.addEventListener('touchcancel', endHold);
    }
  });
});
