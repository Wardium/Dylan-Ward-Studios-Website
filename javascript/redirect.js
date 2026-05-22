window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.substring(1);
  if (!hash) return;

  // Determine if we are in the special "#console" sequence mode
  const isConsoleMode = (hash === 'console');
  let targetSection = null;

  if (!isConsoleMode) {
    // Regular routing mode (Fixed from const to let to prevent reassignment errors)
    targetSection = document.querySelector(`[data-id="${hash}"]`);
    
    if (!targetSection) {
      targetSection = document.querySelector(`[data-aliases~="${hash}"]`);
    }
    
    if (!targetSection) return;
  }

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

  // 2. Grab both arrows
  const rightArrow = document.querySelector('.arrow.right');
  const leftArrow = document.querySelector('.arrow.left');
  
  // The Bot's State Variables
  let isResting = false; 
  let wasAnimatingLastCheck = false;
  
  // Adjust this to change how long it pauses BETWEEN pages
  const extraRestTimeMs = 200; 

  // Console Sequence State
  const consoleSequence = ['left', 'right', 'right', 'left', 'right'];
  let currentSequenceIndex = 0;

  function clickToTarget() {
    // 1. Victory Check
    if (isConsoleMode) {
      // If we've finished the sequence, remove the shield
      if (currentSequenceIndex >= consoleSequence.length) {
        shield.remove();
        // You can add logic here to open your console or trigger the final event
        return; 
      }
    } else {
      // Normal routing: wait for target section to be active
      if (targetSection.classList.contains('active')) {
        shield.remove(); 
        return; 
      }
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
      
      if (isConsoleMode) {
        // Execute the next move in the console sequence
        const move = consoleSequence[currentSequenceIndex];
        if (move === 'left' && leftArrow) leftArrow.click();
        else if (move === 'right' && rightArrow) rightArrow.click();
        
        currentSequenceIndex++;
      } else {
        // Normal routing: just keep clicking right
        if (rightArrow) rightArrow.click();
      }
      
      // Failsafe: Force the bot to rest immediately after a click just in case
      // the DOM takes a few milliseconds to add the animation classes
      isResting = true;
      setTimeout(() => { isResting = false; }, 50); 
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
      }, 300);

    } else if (!introOverlay) {
      clearInterval(checkIntro);
      clickToTarget();
    }
  }, 100);
});
