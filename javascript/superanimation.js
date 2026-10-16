document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject the softer, smoother CSS animations into the head
  const style = document.createElement('style');
  style.innerHTML = `
    /* Soft, smooth, quick-starting easing curves */
    :root {
      --soft-ease: cubic-bezier(0.1, 0.9, 0.2, 1);
      --smooth-spin: cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    /* Animation 1: Soft jump and spin with focal blur */
    @keyframes softJumpSpin {
      0% { transform: translateY(0) rotate(0deg); filter: blur(0px); }
      50% { transform: translateY(-15px) rotate(180deg) scale(1.02); filter: blur(4px); }
      100% { transform: translateY(0) rotate(360deg) scale(1); filter: blur(0px); }
    }

    /* Animation 2: Gentle grow then shrink back */
    @keyframes softPulseGrow {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }

    /* Animation 3: 3D Spin with out-of-focus blur */
    @keyframes softSpin3D {
      0% { transform: perspective(800px) rotateY(0deg) rotateX(0deg); filter: blur(0px); }
      50% { transform: perspective(800px) rotateY(180deg) rotateX(5deg) scale(1.02); filter: blur(5px); }
      100% { transform: perspective(800px) rotateY(360deg) rotateX(0deg); filter: blur(0px); }
    }

    /* Animation 4: Text/Content softly pops toward you */
    @keyframes softContentPop {
      0%, 100% { transform: scale(1) translateZ(0); }
      50% { transform: scale(1.08) translateZ(20px); }
    }

    /* Animation 5: Gentle squeeze and settle */
    @keyframes softSqueeze {
      0%, 100% { transform: scale(1, 1); }
      25% { transform: scale(0.95, 1.05); }
      50% { transform: scale(1.05, 0.95); }
      75% { transform: scale(0.98, 1.02); }
    }

    /* Animation classes to toggle (durations slightly shorter for a quicker start) */
    .anim-jump-spin { animation: softJumpSpin 0.6s var(--soft-ease) forwards; }
    .anim-pulse-grow { animation: softPulseGrow 0.4s var(--soft-ease) forwards; }
    .anim-spin-3d { animation: softSpin3D 0.7s var(--smooth-spin) forwards; }
    .anim-content-pop { animation: softContentPop 0.5s var(--soft-ease) forwards; }
    .anim-squeeze-pop { animation: softSqueeze 0.5s var(--soft-ease) forwards; }

    /* Helper class - removed transition to protect your original hover effects */
    .fancy-clickable-target {
      cursor: pointer;
      transform-origin: center center;
      will-change: transform, filter;
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

  // 3. Find and attach listeners to matching elements
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(el => {
    const classListArray = Array.from(el.classList);
    
    if (classListArray.length === 0) return;

    const hasTargetClass = targetClasses.some(cls => classListArray.includes(cls));
    if (!hasTargetClass) return;

    const isStrictlyAllowed = classListArray.every(cls => allowedClasses.includes(cls));

    if (isStrictlyAllowed) {
      el.classList.add('fancy-clickable-target');

      el.addEventListener('click', function(e) {
        if (this.dataset.isAnimating === 'true') return;
        
        const randomAnim = animationClasses[Math.floor(Math.random() * animationClasses.length)];
        
        this.dataset.isAnimating = 'true';
        this.classList.add(randomAnim);

        this.addEventListener('animationend', function handler() {
          this.classList.remove(randomAnim);
          this.dataset.isAnimating = 'false';
          this.removeEventListener('animationend', handler);
        });
      });
    }
  });
});
