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
// INITIAL SECTIONS & ROUTING
// ----------------------
let sections = Array.from(document.querySelectorAll('.section:not(.dev-section)'));
const leftArrow = document.querySelector('.arrow.left');
const rightArrow = document.querySelector('.arrow.right');
let current = 0;
let isAnimating = false;

// 1. Instantly check hash before anything else!
const hash = window.location.hash.substring(1);
if (hash) {
  const targetIndex = sections.findIndex(sec => sec.id === hash);
  if (targetIndex !== -1) {
    sections[0].classList.remove('active');    // Turn off default Home
    current = targetIndex;                     // Update our SINGLE source of truth
    sections[current].classList.add('active'); // Make the linked section active
  }
}

// ----------------------
// SECTION TRANSITION
// ----------------------
function showSection(newIndex, direction) {
  if (isAnimating || newIndex === current) return;
  isAnimating = true;

  const currentSection = sections[current];
  const nextSection = sections[newIndex];
  const container = document.querySelector('.section-container');

  // Smooth height animation (brought over from section.js)
  if (container) {
    const nextHeight = nextSection.scrollHeight;
    container.style.height = container.offsetHeight + "px"; // Start from current
    requestAnimationFrame(() => {
      container.style.height = nextHeight + "px"; // Animate to new
    });
  }

  // Reset classes
  sections.forEach(sec => sec.classList.remove(
    'slide-in-from-left', 'slide-in-from-right',
    'slide-out-to-left', 'slide-out-to-right', 'active'
  ));

  // Set up incoming section
  if (direction === 'right') nextSection.classList.add('slide-in-from-right');
  else nextSection.classList.add('slide-in-from-left');

  nextSection.classList.add('active');
  
  // Force reflow
  void nextSection.offsetWidth;

  // Animate outgoing
  if (direction === 'right') currentSection.classList.add('slide-out-to-left');
  else currentSection.classList.add('slide-out-to-right');

  // Finish animation
  setTimeout(() => {
    currentSection.classList.remove('active', 'slide-out-to-left', 'slide-out-to-right');
    current = newIndex;
    isAnimating = false;

    // Reset container height to auto
    if (container) container.style.height = "auto";
  }, 500); // match CSS transition
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
// INTRO ANIMATION
// ----------------------
const main = document.querySelector('main');
const header = document.querySelector('header');
const footer = document.querySelector('footer');

header.style.opacity = '0';
footer.style.opacity = '0';
header.style.transition = 'opacity 1s ease';
footer.style.transition = 'opacity 1s ease';

window.addEventListener('load', () => {
  const introOverlay = document.querySelector('.intro-overlay');
  setTimeout(() => introOverlay.classList.add('fade-out'), 2200);
  setTimeout(() => {
    main.classList.add('main-fly-in');
    header.style.opacity = '1';
    footer.style.opacity = '1';
  }, 1300);
});
