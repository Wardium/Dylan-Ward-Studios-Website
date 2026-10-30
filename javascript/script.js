/ ----------------------
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

// Ensure body has no background so layers show through
document.body.style.background = 'none';

// Fetch the SVG once, create a single in-memory Blob URL, and apply to all 3 layers
fetch(randomBg)
  .then(response => response.blob())
  .then(blob => {
    const objectUrl = URL.createObjectURL(blob);
    const cssBgValue = `url('${objectUrl}')`;

    if (introOverlay) introOverlay.style.backgroundImage = cssBgValue;
    if (bgSharp) bgSharp.style.backgroundImage = cssBgValue;
    if (bgBlur) bgBlur.style.backgroundImage = cssBgValue;
  })
  .catch(err => {
    console.error('Error loading background SVG:', err);
    // Fallback if running via file:// protocol where fetch() is blocked by CORS
    const fallbackVal = `url('${randomBg}')`;
    if (introOverlay) introOverlay.style.backgroundImage = fallbackVal;
    if (bgSharp) bgSharp.style.backgroundImage = fallbackVal;
    if (bgBlur) bgBlur.style.backgroundImage = fallbackVal;
  });



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
if (rightArrow) {
  rightArrow.addEventListener('click', () => {
    const newIndex = (current + 1) % sections.length;
    showSection(newIndex, 'right');
    registerInput('right');
  });
}

if (leftArrow) {
  leftArrow.addEventListener('click', () => {
    const newIndex = (current - 1 + sections.length) % sections.length;
    showSection(newIndex, 'left');
    registerInput('left');
  });
}

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

window.addEventListener('load', () => {
  const introOverlay = document.querySelector('.intro-overlay');
  const introLogo = document.querySelector('.intro-logo');

  setTimeout(() => {
    if (introOverlay) introOverlay.classList.add('fade-out');
    // Unload the animated SVG after the fade-out finishes
    setTimeout(() => {
      if (introLogo) {
        introLogo.removeAttribute('src');
        introLogo.remove();
      }
    }, 1000);
  }, 2450);

  setTimeout(() => {
    if (main) main.classList.add('main-fly-in');
    if (header) header.style.opacity = '1';
    if (footer) footer.style.opacity = '1';
  }, 2450);
});
