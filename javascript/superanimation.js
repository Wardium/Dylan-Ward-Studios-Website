document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject the ultra-smooth CSS animations into the head
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      --ultra-smooth: cubic-bezier(0.42, 0, 0.58, 1); 
    }
    
    @keyframes smoothSpin3D {
      0% { transform: perspective(800px) rotateY(0deg) scale(var(--text-scale, 1)); filter: blur(0px); }
      50% { transform: perspective(800px) rotateY(180deg) scale(calc(var(--text-scale, 1) + 0.05)); filter: blur(4px); }
      100% { transform: perspective(800px) rotateY(360deg) scale(var(--text-scale, 1)); filter: blur(0px); }
    }

    @keyframes smoothJumpSpin {
      0% { transform: translateY(0) rotate(0deg) scale(var(--text-scale, 1)); filter: blur(0px); }
      50% { transform: translateY(-15px) rotate(180deg) scale(calc(var(--text-scale, 1) + 0.05)); filter: blur(3px); }
      100% { transform: translateY(0) rotate(360deg) scale(var(--text-scale, 1)); filter: blur(0px); }
    }

    @keyframes smoothPulseGrow {
      0%, 100% { transform: scale(var(--text-scale, 1)); }
      50% { transform: scale(calc(var(--text-scale, 1) + 0.15)); }
    }

    @keyframes smoothContentPop {
      0%, 100% { transform: scale(var(--text-scale, 1)) translateZ(0); }
      50% { transform: scale(calc(var(--text-scale, 1) + 0.1)) translateZ(20px); }
    }

    @keyframes smoothRainbow {
      0% { color: var(--orig-color); transform: scale(var(--text-scale, 1)); }
      20% { color: #ff595e; transform: scale(calc(var(--text-scale, 1) + 0.02)); }
      40% { color: #ffca3a; transform: scale(calc(var(--text-scale, 1) + 0.04)); }
      60% { color: #8ac926; transform: scale(calc(var(--text-scale, 1) + 0.04)); }
      80% { color: #1982c4; transform: scale(calc(var(--text-scale, 1) + 0.02)); }
      100% { color: var(--orig-color); transform: scale(var(--text-scale, 1)); }
    }
    
    @keyframes popBack {
      0% { transform: scale(var(--pop-start-scale, 3)); }
      50% { transform: scale(0.85); }
      100% { transform: scale(1); }
    }

    .anim-spin-3d { animation: smoothSpin3D 1.8s var(--ultra-smooth) forwards; }
    .anim-jump-spin { animation: smoothJumpSpin 1.4s var(--ultra-smooth) forwards; }
    .anim-pulse-grow { animation: smoothPulseGrow 1.2s var(--ultra-smooth) forwards; }
    .anim-content-pop { animation: smoothContentPop 1.2s var(--ultra-smooth) forwards; }
    .anim-rainbow { animation: smoothRainbow 2s var(--ultra-smooth) forwards; }
    .anim-pop-back { animation: popBack 0.6s var(--ultra-smooth) forwards; }

    .fancy-text-target {
      will-change: transform, filter, color;
      transform-origin: center center;
      transform: scale(var(--text-scale, 1));
      transition: transform 0.05s linear; 
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
      el.dataset.currentScale = "1";

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
          if (!textEl.style.getPropertyValue('--orig-color')) {
            const computedColor = window.getComputedStyle(textEl).color;
            textEl.style.setProperty('--orig-color', computedColor);
          }
        });

        const growText = () => {
          if (!isHolding) return;
          
          let currentScale = parseFloat(el.dataset.currentScale);
          currentScale += 0.005; // SLOWER GROWTH SPEED
          
          let hitEdge = false;
          const parentRect = el.getBoundingClientRect();

          // Only start checking edges after a slight scale so it doesn't instantly pop if padding is 0
          if (currentScale > 1.05) {
            textElements.forEach(textEl => {
              const rect = textEl.getBoundingClientRect();
              // Check if the scaled text has hit the physical boundaries of its container
              if (
                rect.left <= parentRect.left + 5 || 
                rect.right >= parentRect.right - 5 || 
                rect.top <= parentRect.top + 5 || 
                rect.bottom >= parentRect.bottom - 5
              ) {
                hitEdge = true;
              }
            });
          }
          
          // Trigger the pop-back if it touches the edges or hits an extreme fallback limit
          if (hitEdge || currentScale >= 5) {
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
        
        setTimeout(() => { if (isHolding) growText(); }, 100);
      };

      const endHold = (e) => {
        if (!isHolding) return;
        isHolding = false;
        cancelAnimationFrame(holdRequest);

        const holdDuration = Date.now() - holdStartTime;
        
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
