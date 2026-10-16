document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject the softer CSS animations into the head
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      --soft-ease: cubic-bezier(0.1, 0.9, 0.2, 1);
      --smooth-spin: cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    @keyframes softJumpSpin {
      0% { transform: translateY(0) rotate(0deg); filter: blur(0px); }
      50% { transform: translateY(-15px) rotate(180deg) scale(1.02); filter: blur(4px); }
      100% { transform: translateY(0) rotate(360deg) scale(1); filter: blur(0px); }
    }

    @keyframes softPulseGrow {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }

    @keyframes softSpin3D {
      0% { transform: perspective(800px) rotateY(0deg) rotateX(0deg); filter: blur(0px); }
      50% { transform: perspective(800px) rotateY(180deg) rotateX(5deg) scale(1.02); filter: blur(5px); }
      100% { transform: perspective(800px) rotateY(360deg) rotateX(0deg); filter: blur(0px); }
    }

    @keyframes softContentPop {
      0%, 100% { transform: scale(1) translateZ(0); }
      50% { transform: scale(1.08) translateZ(20px); }
    }

    @keyframes softSqueeze {
      0%, 100% { transform: scale(1, 1); }
      25% { transform: scale(0.95, 1.05); }
      50% { transform: scale(1.05, 0.95); }
      75% { transform: scale(0.98, 1.02); }
    }

    .anim-jump-spin { animation: softJumpSpin 0.6s var(--soft-ease) forwards; }
    .anim-pulse-grow { animation: softPulseGrow 0.4s var(--soft-ease) forwards; }
    .anim-spin-3d { animation: softSpin3D 0.7s var(--smooth-spin) forwards; }
    .anim-content-pop { animation: softContentPop 0.5s var(--soft-ease) forwards; }
    .anim-squeeze-pop { animation: softSqueeze 0.5s var(--soft-ease) forwards; }

    /* Required for text elements to animate properly */
    .fancy-text-target {
      will-change: transform, filter;
      transform-origin: center center;
    }
    
    /* Transforms don't work on inline elements, so we force them to inline-block while animating */
    span.fancy-text-target, a.fancy-text-target, strong.fancy-text-target, em.fancy-text-target {
      display: inline-block;
    }
    
    /* Keep the cursor pointer on the parent so users know they can click it */
    .fancy-clickable-parent {
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // 2. Define our class rules
  const targetClasses = ['glass-block', 'banner-container', 'banner-overlay'];
  const allowedClasses = [...targetClasses, 'col-half', 'col-full'];
  
  const animationClasses = [
    'anim-jump-spin', 
    'anim-pulse-grow', 
    'anim-spin-3d', 
    'anim-content-pop', 
    'anim-squeeze-pop'
  ];

  // 3. Find and attach listeners
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(el => {
    const classListArray = Array.from(el.classList);
    if (classListArray.length === 0) return;

    const hasTargetClass = targetClasses.some(cls => classListArray.includes(cls));
    if (!hasTargetClass) return;

    const isStrictlyAllowed = classListArray.every(cls => allowedClasses.includes(cls));

    if (isStrictlyAllowed) {
      el.classList.add('fancy-clickable-parent');

      el.addEventListener('click', function(e) {
        if (this.dataset.isAnimating === 'true') return;
        
        // Find all standard text elements inside the clicked container
        const textElements = this.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, strong, em, blockquote');
        
        if (textElements.length === 0) return;

        const randomAnim = animationClasses[Math.floor(Math.random() * animationClasses.length)];
        this.dataset.isAnimating = 'true';

        // Apply the animation to every text element inside
        textElements.forEach(textEl => {
          textEl.classList.add('fancy-text-target', randomAnim);
        });

        // Use the first text element to track when the animation finishes
        const firstTextEl = textElements[0];
        firstTextEl.addEventListener('animationend', () => {
          textElements.forEach(textEl => {
            textEl.classList.remove('fancy-text-target', randomAnim);
          });
          this.dataset.isAnimating = 'false';
        }, { once: true });
      });
    }
  });
});
