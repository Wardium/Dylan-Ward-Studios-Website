window.addEventListener('load', () => {
  // 1. Check if there's a hashtag in the URL (e.g., "stories" from #stories)
  const hash = window.location.hash.substring(1);
  if (!hash) return; // If no hash, do nothing!

  const targetSection = document.getElementById(hash);
  if (!targetSection) return; // If the hash is a typo, do nothing!

  // 2. Create an invisible "shield" to block user clicks during the auto-scroll
  const shield = document.createElement('div');
  shield.style.position = 'fixed';
  shield.style.top = '0';
  shield.style.left = '0';
  shield.style.width = '100vw';
  shield.style.height = '100vh';
  shield.style.zIndex = '9999'; // Put it above EVERYTHING
  shield.style.cursor = 'wait'; // Show a loading spinner mouse
  document.body.appendChild(shield);

  // 3. Wait for your Intro Animation to finish before moving
  // Adjust this 2800ms if you need it to wait slightly longer or shorter
  setTimeout(() => {
    const rightArrow = document.querySelector('.arrow.right');

    // 4. Start the auto-clicker loop
    const clickInterval = setInterval(() => {
      
      // Check if the target section is now the active one
      if (targetSection.classList.contains('active')) {
        clearInterval(clickInterval); // Stop clicking
        shield.remove();              // Destroy the invisible shield
        return;
      }

      // If we aren't there yet, click the right arrow!
      // Using 600ms to give a tiny 100ms safety buffer over your 500ms animation lock
      rightArrow.click();

    }, 600); 

  }, 2800); 
});
