window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.substring(1);
  if (!hash) return; 

  const targetSection = document.getElementById(hash);
  if (!targetSection) return; 

  // 1. Deploy the shield
  const shield = document.createElement('div');
  shield.style.position = 'fixed';
  shield.style.top = '0';
  shield.style.left = '0';
  shield.style.width = '100vw';
  shield.style.height = '100vh';
  shield.style.zIndex = '9999'; 
  shield.style.cursor = 'wait'; 
  document.body.appendChild(shield);

  const rightArrow = document.querySelector('.arrow.right');
  
  // The Bot's State Variables
  let isResting = false; 
  let wasAnimatingLastCheck = false;
  
  // Adjust this to change how long it pauses BETWEEN pages
  const extraRestTimeMs = 200; 

  function clickToTarget() {
    // 1. Victory Check
    if (targetSection.classList.contains('active')) {
      shield.remove(); 
      return; 
    }

    // 2. Read the current DOM state
    const isCurrentlyAnimating = !!document.querySelector('.slide-out-to-left, .slide-out-to-right');

    // 3. Did the animation JUST finish? If yes, trigger the rest period.
    if (wasAnimatingLastCheck && !isCurrentlyAnimating) {
      isResting = true;
      setTimeout(() => {
        isResting = false;
      }, extraRestTimeMs);
    }
    
    // Remember this state for the next loop
    wasAnimatingLastCheck = isCurrentlyAnimating;

    // 4. Action Phase: Only click if nothing is moving AND we aren't resting
    if (!isCurrentlyAnimating && !isResting) {
      rightArrow.click();
      
      // Failsafe: Force the bot to rest immediately after a click just in case
      // the DOM takes a few milliseconds to add the animation classes
      isResting = true;
      setTimeout(() => { isResting = false; }, 100); 
    }

    // Check again in 50ms
    setTimeout(clickToTarget, 50);
  }

  // Watcher for the Intro Animation
  const checkIntro = setInterval(() => {
    const introOverlay = document.querySelector('.intro-overlay');
    
    if (introOverlay && introOverlay.classList.contains('fade-out')) {
      clearInterval(checkIntro);
      
      // Wait for the fly-in to settle
      setTimeout(() => {
        clickToTarget();
      }, 1500);

    } else if (!introOverlay) {
      clearInterval(checkIntro);
      clickToTarget();
    }
  }, 100);
});
