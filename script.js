const sections = document.querySelectorAll('.section');
const leftArrow = document.querySelector('.arrow.left');
const rightArrow = document.querySelector('.arrow.right');
let current = 0;
let isAnimating = false;

function showSection(newIndex, direction) {
  if (isAnimating || newIndex === current) return;
  isAnimating = true;

  const currentSection = sections[current];
  const nextSection = sections[newIndex];

  // Reset transition classes
  sections.forEach(sec => sec.classList.remove(
    'slide-in-from-left',
    'slide-in-from-right',
    'slide-out-to-left',
    'slide-out-to-right',
    'active'
  ));

  // Start position for the incoming section
  if (direction === 'right') {
    nextSection.classList.add('slide-in-from-right');
  } else {
    nextSection.classList.add('slide-in-from-left');
  }

  // Make the new section visible
  nextSection.classList.add('active');

  // Force reflow to apply animation
  void nextSection.offsetWidth;

  // Animate both at the same time
  if (direction === 'right') {
    currentSection.classList.add('slide-out-to-left');
    nextSection.classList.remove('slide-in-from-right');
  } else {
    currentSection.classList.add('slide-out-to-right');
    nextSection.classList.remove('slide-in-from-left');
  }

  setTimeout(() => {
    currentSection.classList.remove(
      'active',
      'slide-out-to-left',
      'slide-out-to-right'
    );
    current = newIndex;
    isAnimating = false;
  }, 500); // duration (match CSS)
}

rightArrow.addEventListener('click', () => {
  const newIndex = (current + 1) % sections.length;
  showSection(newIndex, 'right');
});

leftArrow.addEventListener('click', () => {
  const newIndex = (current - 1 + sections.length) % sections.length;
  showSection(newIndex, 'left');
});

// Hide main content initially
const main = document.querySelector('main');
const header = document.querySelector('header');
const footer = document.querySelector('footer');

main.style.opacity = '0';
header.style.opacity = '0';
footer.style.opacity = '0';
main.style.transition = 'opacity 1s ease';
header.style.transition = 'opacity 1s ease';
footer.style.transition = 'opacity 1s ease';

// Intro animation
window.addEventListener('DOMContentLoaded', () => {
  const introOverlay = document.querySelector('.intro-overlay');

  // Fade out overlay after fall animation (~1s)
  setTimeout(() => {
    introOverlay.classList.add('fade-out');
  }, 1200);

  // Fade in website content after overlay starts fading
  setTimeout(() => {
    main.style.opacity = '1';
    header.style.opacity = '1';
    footer.style.opacity = '1';
  }, 1300); // slightly after overlay starts fading
});
// Fly in the frosted white section
const introSection = document.querySelector('.intro-frosted');

setTimeout(() => {
  introSection.classList.add('fly-in');
}, 1200); // after logo animation
