// ----------------------
// RANDOM BACKGROUND SVG
// ----------------------
const backgrounds = [
  'assets/background1.svg',
  'assets/background2.svg',
  'assets/background3.svg',
  'assets/background4.svg'
];

const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];

// Get the elements
const introOverlay = document.querySelector('.intro-overlay');
const bgSharp = document.getElementById('bg-sharp');
const bgBlur = document.getElementById('bg-blur');

const cssBgValue = `url('${randomBg}')`;

// 1. Set Intro Overlay
if (introOverlay) {
  introOverlay.style.backgroundImage = cssBgValue;
}

// 2. Set Sharp Layer (Replaces body background)
if (bgSharp) {
  bgSharp.style.backgroundImage = cssBgValue;
}

// 3. Set Blur Layer
if (bgBlur) {
  bgBlur.style.backgroundImage = cssBgValue;
}

// Ensure body has no background so layers show through
document.body.style.background = 'none';

// ----------------------
// INITIAL SECTIONS 
// ----------------------
let sections = Array.from(document.querySelectorAll('.section:not(.dev-section)'));
const leftArrow = document.querySelector('.arrow.left');
const rightArrow = document.querySelector('.arrow.right');
let current = 0;
let isAnimating = false;

// ----------------------
// SECTION TRANSITION
// ----------------------
function showSection(newIndex, direction) {
  if (isAnimating || newIndex === current) return;
  isAnimating = true;

  const currentSection = sections[current];
  const nextSection = sections[newIndex];

  sections.forEach(sec => sec.classList.remove(
    'slide-in-from-left',
    'slide-in-from-right',
    'slide-out-to-left',
    'slide-out-to-right',
    'active'
  ));

  if (direction === 'right') nextSection.classList.add('slide-in-from-right');
  else nextSection.classList.add('slide-in-from-left');

  nextSection.classList.add('active');
  void nextSection.offsetWidth;

  if (direction === 'right') {
    currentSection.classList.add('slide-out-to-left');
    nextSection.classList.remove('slide-in-from-right');
  } else {
    currentSection.classList.add('slide-out-to-right');
    nextSection.classList.remove('slide-in-from-left');
  }

  setTimeout(() => {
    currentSection.classList.remove('active', 'slide-out-to-left', 'slide-out-to-right');
    current = newIndex;
    isAnimating = false;
  }, 500);
}

// ----------------------
// NAVIGATION
// ----------------------
rightArrow.addEventListener('click', () => {
  const newIndex = (current + 1) % sections.length;
  showSection(newIndex, 'right');
  registerInput('right');
});

leftArrow.addEventListener('click', () => {
  const newIndex = (current - 1 + sections.length) % sections.length;
  showSection(newIndex, 'left');
  registerInput('left');
});

// ----------------------
// SECTION LOGIC
// ----------------------
const secretCombo = ['left', 'right', 'right', 'left', 'right'];
let inputSequence = [];
let comboTimeout;
let devUnlocked = false;

function registerInput(direction) {
  inputSequence.push(direction);
  if (inputSequence.length > secretCombo.length) inputSequence.shift();

  clearTimeout(comboTimeout);
  comboTimeout = setTimeout(() => inputSequence = [], 3000);

  if (JSON.stringify(inputSequence) === JSON.stringify(secretCombo)) {
    unlockDevSection(); // no password
    inputSequence = [];
  }
}

function unlockDevSection() {
  if (devUnlocked) return;
  const devSection = document.querySelector('.dev-section');
  if (!devSection) return;

  devSection.classList.remove('hidden');

  // Add to sections array so arrows can scroll to it
  sections.push(devSection);
  devUnlocked = true;

  // Immediately show dev section, bypassing isAnimating
  const newIndex = sections.indexOf(devSection);

  // Temporarily disable isAnimating to force jump
  const prevAnimating = isAnimating;
  isAnimating = false;
  showSection(newIndex, 'right');
  isAnimating = prevAnimating;
}


// ----------------------
// INTRO ANIMATION (60FPS PACKED SVG PLAYER + AUTO-UNLOAD)
// ----------------------
const main = document.querySelector('main');
const header = document.querySelector('header');
const footer = document.querySelector('footer');

header.style.opacity = '0';
footer.style.opacity = '0';
header.style.transition = 'opacity 1s ease';
footer.style.transition = 'opacity 1s ease';

async function playIntroSequence() {
  const overlay = document.querySelector('.intro-overlay');
  if (!overlay) return;

  // Ensure .intro-logo is an <svg> element (auto-replaces <img> if still in HTML)
  let svgEl = overlay.querySelector('.intro-logo');
  if (svgEl && svgEl.tagName.toLowerCase() !== 'svg') {
    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    newSvg.setAttribute('class', svgEl.className);
    svgEl.replaceWith(newSvg);
    svgEl = newSvg;
  }

  let animData = null;

  try {
    // 1. Preload all packed SVG frames in a single request before playing
    const response = await fetch('assets/logo_anim.json');
    if (!response.ok) throw new Error('Failed to load logo_anim.json');
    animData = await response.json();

    svgEl.setAttribute('viewBox', animData.viewBox);
    svgEl.setAttribute('fill', '#ffffff');

    const totalFrames = animData.seq.length;
    const fps = animData.fps || 60;
    const frameDuration = 1000 / fps; // 16.67ms per frame (2.45s for 147 frames)
    const totalDurationMs = totalFrames * frameDuration;

    // Trigger main content fly-in ~900ms before the logo animation ends (matching your original offset)
    const flyInDelay = Math.max(0, totalDurationMs - 900);
    setTimeout(() => {
      main.classList.add('main-fly-in');
      header.style.opacity = '1';
      footer.style.opacity = '1';
    }, flyInDelay);

    // 2. Play frames at locked 60fps
    await new Promise((resolve) => {
      let startTime = null;
      let lastRenderedFrame = -1;

      function tick(now) {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const currentFrame = Math.floor(elapsed / frameDuration);

        if (currentFrame >= totalFrames) {
          // Ensure final frame is shown right as playback finishes
          const lastUniqueIdx = animData.seq[totalFrames - 1];
          svgEl.innerHTML = animData.frames[lastUniqueIdx];
          resolve();
          return;
        }

        // Only update the DOM when advancing to a new frame whose geometry changed
        if (currentFrame !== lastRenderedFrame) {
          const prevUniqueIdx = lastRenderedFrame >= 0 ? animData.seq[lastRenderedFrame] : -1;
          const nextUniqueIdx = animData.seq[currentFrame];

          if (nextUniqueIdx !== prevUniqueIdx) {
            svgEl.innerHTML = animData.frames[nextUniqueIdx];
          }
          lastRenderedFrame = currentFrame;
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });

  } catch (err) {
    console.error('Intro animation fallback:', err);
    main.classList.add('main-fly-in');
    header.style.opacity = '1';
    footer.style.opacity = '1';
  }

  // 3. Fade out overlay as soon as the 2.45s sequence finishes
  overlay.classList.add('fade-out');

  // 4. Unload SVGs and free memory once the CSS fade-out transition completes
  setTimeout(() => {
    animData = null;        // Release packed JSON strings for garbage collection
    if (svgEl) {
      svgEl.innerHTML = ''; // Strip all SVG <path> nodes from DOM
      svgEl.remove();
    }
    overlay.remove();       // Remove intro overlay completely from DOM
  }, 1000); // Adjust if your .fade-out CSS transition is longer than 1s
}

window.addEventListener('DOMContentLoaded', playIntroSequence);
});
