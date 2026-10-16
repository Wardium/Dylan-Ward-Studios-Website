document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject the high-quality, bouncy CSS animations into the head
  const style = document.createElement('style');
  style.innerHTML = `
    /* Premium bouncy easing curve for a professional feel */
    :root {
      --bounce-ease: cubic-bezier(0.34, 1.56, 0.64, 1);
      --smooth-ease: cubic-bezier(0.25, 1, 0.5, 1);
    }

    /* Animation 1: Jump up and spin */
    @keyframes fancyJumpSpin {
      0% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-25px) rotate(180deg) scale(1.05); }
      100% { transform: translateY(0) rotate(360deg) scale(1); }
    }

    /* Animation 2: Grow slightly then shrink back */
    @keyframes fancyPulseGrow {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }

    /* Animation 3: 3D Spin */
    @keyframes fancySpin3D {
      0% { transform: perspective(800px) rotateY(0deg) rotateX(0deg); }
      50% { transform: perspective(800px) rotateY(180deg) rotateX(10deg) scale(1.05); }
      100% { transform: perspective(800px) rotateY(360deg) rotateX(0deg); }
    }

    /* Animation 4: Text/Content pops toward you */
    @keyframes fancyContentPop {
      0%, 100% { transform: scale(1) translateZ(0); }
      50% { transform: scale(1.15) translateZ(40px); box-shadow: 0 15px 30px rgba(0,0,0,0.15); }
    }

    /* Animation 5: Squeeze and pop back (squash & stretch) */
    @keyframes fancySqueezePop {
      0%, 100% { transform: scale(1, 1); }
      25% { transform: scale(0.9, 1.1); }
      50% { transform: scale(1.1, 0.9); }
      75% { transform: scale(0.95, 1.05); }
    }

    /* Animation classes to toggle */
    .anim-jump-spin { animation: fancyJumpSpin 0.7s var(--bounce-ease) forwards; }
    .anim-pulse-grow { animation: fancyPulseGrow 0.5s var(--bounce-ease) forwards; }
    .anim-spin-3d { animation: fancySpin3D 0.8s var(--smooth-ease) forwards; }
    .anim-content-pop { animation: fancyContentPop 0.6s var(--bounce-ease) forwards; }
    .anim-squeeze-pop { animation: fancySqueezePop 0.6s var(--bounce-ease) forwards; }

    /* Ensure target elements can be transformed and look clickable */
    .fancy-clickable-target {
      cursor: pointer;
      transform-origin: center center;
      will-change: transform;
      transition: box-shadow 0.3s ease;
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
    
    // Skip elements with no classes
    if (classListArray.length === 0) return;

    // Must have at least one of the primary target classes
    const hasTargetClass = targetClasses.some(cls => classListArray.includes(cls));
    if (!hasTargetClass) return;

    // ALL classes on the element must be in the 'allowedClasses' list
    const isStrictlyAllowed = classListArray.every(cls => allowedClasses.includes(cls));

    if (isStrictlyAllowed) {
      // Add a helper class just for cursor styling and transform origin
      el.classList.add('fancy-clickable-target');

      el.addEventListener('click', function(e) {
        // Prevent clicking again while it's currently animating
        if (this.dataset.isAnimating === 'true') return;
        
        // Pick a random animation
        const randomAnim = animationClasses[Math.floor(Math.random() * animationClasses.length)];
        
        // Mark as animating and apply the class
        this.dataset.isAnimating = 'true';
        this.classList.add(randomAnim);

        // Remove the class once the animation finishes so it can be triggered again
        this.addEventListener('animationend', function handler() {
          this.classList.remove(randomAnim);
          this.dataset.isAnimating = 'false';
          this.removeEventListener('animationend', handler);
        });
      });
    }
  });
});
