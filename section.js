// ----------------------
// SECTION SWITCHING
// ----------------------
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
  const container = document.querySelector('.section-container');

  // Animate container height
  const nextHeight = nextSection.scrollHeight;
  container.style.height = container.offsetHeight + "px"; // start from current
  requestAnimationFrame(() => {
    container.style.height = nextHeight + "px"; // animate to new
  });

  // Reset classes
  sections.forEach(sec => sec.classList.remove(
    'slide-in-from-left',
    'slide-in-from-right',
    'slide-out-to-left',
    'slide-out-to-right',
    'active'
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
    currentSection.classList.remove(
      'active',
      'slide-out-to-left',
      'slide-out-to-right'
    );
    current = newIndex;
    isAnimating = false;

    // Reset container height to auto
    container.style.height = "auto";
  }, 500); // match CSS transition
}

// Arrow events
rightArrow.addEventListener('click', () => {
  const newIndex = (current + 1) % sections.length;
  showSection(newIndex, 'right');
});

leftArrow.addEventListener('click', () => {
  const newIndex = (current - 1 + sections.length) % sections.length;
  showSection(newIndex, 'left');
});
