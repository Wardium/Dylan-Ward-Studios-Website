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
const introOverlay = document.querySelector('.intro-overlay');

// Dynamically override CSS background for overlay
introOverlay.style.background = `url('${randomBg}') no-repeat center center`;
introOverlay.style.backgroundSize = 'cover';
document.body.style.background = `url('${randomBg}') no-repeat center center fixed`;
document.body.style.backgroundSize = 'cover';

// ----------------------
// INITIAL SECTIONS (EXCLUDE DEV SECTION)
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
// SECRET DEV SECTION LOGIC
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

  // Make it visible
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

header.style.opacity = '0';
footer.style.opacity = '0';
header.style.transition = 'opacity 1s ease';
footer.style.transition = 'opacity 1s ease';

window.addEventListener('DOMContentLoaded', () => {
  const introOverlay = document.querySelector('.intro-overlay');
  setTimeout(() => introOverlay.classList.add('fade-out'), 2200);
  setTimeout(() => {
    main.classList.add('main-fly-in');
    header.style.opacity = '1';
    footer.style.opacity = '1';
  }, 1300);
});