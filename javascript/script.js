document.addEventListener('DOMContentLoaded', () => {
  // ----------------------
  // RANDOM BACKGROUND SVG
  // ----------------------
  const backgrounds = [
    'assets/background1.svg',
    'assets/background2.svg',
    'assets/background3.svg',
    'assets/background4.svg',
    'assets/background5.svg',
    'assets/background6.svg',
    'assets/background7.svg'
  ];

  const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  const cssBgValue = `url('${randomBg}')`;

  const introOverlay = document.querySelector('.intro-overlay');
  const bgSharp = document.getElementById('bg-sharp');
  const bgBlur = document.getElementById('bg-blur');

  if (introOverlay) introOverlay.style.backgroundImage = cssBgValue;
  if (bgSharp) bgSharp.style.backgroundImage = cssBgValue;
  if (bgBlur) bgBlur.style.backgroundImage = cssBgValue;

  if (document.body) {
    document.body.style.background = 'none';
  }

  // ----------------------
  // INITIAL SECTIONS
  // ----------------------
  let sections = Array.from(document.querySelectorAll('.section:not(.dev-section)'));
  const leftArrow = document.querySelector('.arrow.left');
  const rightArrow = document.querySelector('.arrow.right');
  let current = 0;
  let isAnimating = false;
  let transitionTimeout = null;

  // Ensure the first section starts active and others do not
  if (sections.length > 0) {
    sections.forEach((sec, idx) => {
      sec.classList.toggle('active', idx === 0);
    });
  }

  // ----------------------
  // SECTION TRANSITION
  // ----------------------
  function showSection(newIndex, direction, force = false) {
    if (sections.length === 0) return;
    if ((!force && isAnimating) || newIndex === current) return;

    // If forcing a jump (e.g., dev unlock), cancel any in-flight animation
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
      transitionTimeout = null;
    }

    isAnimating = true;

    const currentSection = sections[current];
    const nextSection = sections[newIndex];

    // Clean animation classes off all sections, keep current & next active during transition
    sections.forEach(sec => {
      sec.classList.remove(
        'slide-in-from-left',
        'slide-in-from-right',
        'slide-out-to-left',
        'slide-out-to-right'
      );
      if (sec !== currentSection && sec !== nextSection) {
        sec.classList.remove('active');
      }
    });

    // Stage the incoming section
    if (direction === 'right') {
      nextSection.classList.add('slide-in-from-right');
    } else {
      nextSection.classList.add('slide-in-from-left');
    }

    nextSection.classList.add('active');

    // Force browser reflow so the starting position registers before sliding
    void nextSection.offsetWidth;

    // Trigger slide animation
    if (direction === 'right') {
      if (currentSection) currentSection.classList.add('slide-out-to-left');
      nextSection.classList.remove('slide-in-from-right');
    } else {
      if (currentSection) currentSection.classList.add('slide-out-to-right');
      nextSection.classList.remove('slide-in-from-left');
    }

    transitionTimeout = setTimeout(() => {
      if (currentSection && currentSection !== nextSection) {
        currentSection.classList.remove('active', 'slide-out-to-left', 'slide-out-to-right');
      }
      current = newIndex;
      isAnimating = false;
      transitionTimeout = null;
    }, 500);
  }

  // ----------------------
  // SECRET COMBO & NAVIGATION
  // ----------------------
  const secretCombo = ['left', 'right', 'right', 'left', 'right'];
  let inputSequence = [];
  let comboTimeout = null;
  let devUnlocked = false;

  function checkSecretCombo(direction) {
    inputSequence.push(direction);
    if (inputSequence.length > secretCombo.length) {
      inputSequence.shift();
    }

    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
      inputSequence = [];
    }, 3000);

    if (
      !devUnlocked &&
      inputSequence.length === secretCombo.length &&
      inputSequence.every((val, index) => val === secretCombo[index])
    ) {
      inputSequence = [];
      return unlockDevSection();
    }
    return false;
  }

  function unlockDevSection() {
    if (devUnlocked) return false;
    const devSection = document.querySelector('.dev-section');
    if (!devSection) return false;

    devSection.classList.remove('hidden');
    sections.push(devSection);
    devUnlocked = true;

    const newIndex = sections.indexOf(devSection);
    showSection(newIndex, 'right', true);
    return true;
  }

  if (rightArrow) {
    rightArrow.addEventListener('click', () => {
      // Check combo first so we don't trigger two transitions at once
      if (checkSecretCombo('right')) return;
      if (sections.length === 0) return;

      const newIndex = (current + 1) % sections.length;
      showSection(newIndex, 'right');
    });
  }

  if (leftArrow) {
    leftArrow.addEventListener('click', () => {
      if (checkSecretCombo('left')) return;
      if (sections.length === 0) return;

      const newIndex = (current - 1 + sections.length) % sections.length;
      showSection(newIndex, 'left');
    });
  }

  // ----------------------
  // INTRO ANIMATION
  // ----------------------
  const main = document.querySelector('main');
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');

  if (header) {
    header.style.opacity = '0';
    header.style.transition = 'opacity 1s ease';
  }
  if (footer) {
    footer.style.opacity = '0';
    footer.style.transition = 'opacity 1s ease';
  }

  function runIntroAnimation() {
    const overlay = document.querySelector('.intro-overlay');
    const introLogo = document.querySelector('.intro-logo');

    setTimeout(() => {
      if (overlay) overlay.classList.add('fade-out');

      setTimeout(() => {
        if (introLogo) {
          introLogo.removeAttribute('src');
          introLogo.remove();
        }
      }, 1000);

      if (main) main.classList.add('main-fly-in');
      if (header) header.style.opacity = '1';
      if (footer) footer.style.opacity = '1';
    }, 2450);
  }

  // Handle case where window 'load' already fired before script attached
  if (document.readyState === 'complete') {
    runIntroAnimation();
  } else {
    window.addEventListener('load', runIntroAnimation);
  }
});
