// ==========================================
// base.js - RUNS IN THE WEB BROWSER
// ==========================================

let currentPages = [];
let currentPageIndex = 0;
let rawStoryText = "";
let isAnimating = false;

// 1. Dynamic Pagination: Measures text against the actual DOM element height
function paginateTextDynamically() {
  if (!rawStoryText) return;
  
  const pageContainer = document.getElementById('left-page-content');
  if (!pageContainer) return;

  // Create a hidden tester element to measure text wrapping
  const tester = document.createElement('div');
  tester.className = 'page-content';
  tester.style.position = 'absolute';
  tester.style.visibility = 'hidden';
  tester.style.width = pageContainer.clientWidth + 'px';
  tester.style.height = pageContainer.clientHeight + 'px';
  document.body.appendChild(tester);

  const paragraphs = rawStoryText.split('\n\n');
  currentPages = [];
  let currentHTML = "";

  for (let i = 0; i < paragraphs.length; i++) {
    const p = `<p>${paragraphs[i].trim()}</p>`;
    tester.innerHTML = currentHTML + p;

    // If adding this paragraph exceeds the container height, save the page and start a new one
    if (tester.scrollHeight > tester.clientHeight) {
      if (currentHTML !== "") {
        currentPages.push(currentHTML);
        currentHTML = p; 
      } else {
        // Fallback: If a single paragraph is larger than a page, just force it in
        currentPages.push(p);
        currentHTML = "";
      }
    } else {
      currentHTML += p;
    }
  }
  
  if (currentHTML) currentPages.push(currentHTML);
  document.body.removeChild(tester);
}

window.onload = () => {
  const isStoryMode = window.location.pathname.includes('/stories/');
  const logoPath = isStoryMode ? '../../../assets/logo.svg' : '../../assets/logo.svg';
  
  const headerHTML = `
    <header id="main-header" style="cursor: pointer;" onclick="window.location.href='${isStoryMode ? '../bookshelf.html' : 'bookshelf.html'}'">
      <div class="logo-container">
        <div class="logo"><img src="${logoPath}" alt="DWS Logo" /></div>
        <div class="animated-text" id="animated-text">
          <span>S</span><span>t</span><span>o</span><span>r</span><span>i</span><span>e</span><span>s</span>
        </div>
      </div>
    </header>
  `;
  document.body.insertAdjacentHTML('afterbegin', headerHTML);

  setTimeout(() => { document.getElementById('animated-text').classList.add('show'); }, 1200);

  if (isStoryMode) {
    initializeStoryReader();
  } else {
    initializeBookshelf();
  }
};

// Recalculate pages if the user resizes their window
window.addEventListener('resize', () => {
  if (document.getElementById('reader-view') && document.getElementById('reader-view').classList.contains('active')) {
    paginateTextDynamically();
    // Ensure we don't go out of bounds after resize
    if (currentPageIndex >= currentPages.length) {
      currentPageIndex = Math.max(0, currentPages.length - (currentPages.length % 2 === 0 ? 2 : 1));
    }
    updatePageContent();
  }
});

function initializeBookshelf() {
  const mainContent = document.getElementById('bookshelf');
  const grid = document.getElementById('bookshelf-grid');

  if (typeof storyDatabase !== 'undefined') {
    storyDatabase.forEach(book => {
      const bookDiv = document.createElement('div');
      bookDiv.className = 'book-item';
      const bgStyle = book.coverImage ? `background-image: url('${book.coverImage}');` : `background-color: ${book.coverColor};`;

      bookDiv.innerHTML = `
        <div class="book-3d-container" onclick="window.location.href='${book.url}'">
          <div class="book-front" style="${bgStyle}">${!book.coverImage ? book.title : ''}</div>
          <div class="book-spine" style="${bgStyle}"></div>
        </div>
        <div class="book-info">
          <h2>${book.title}</h2>
          <p>${book.description}</p>
        </div>
      `;
      grid.appendChild(bookDiv);
    });
  }

  setTimeout(() => {
    document.getElementById('main-header').classList.add('shrunk');
    mainContent.style.display = 'block';
    setTimeout(() => { mainContent.classList.add('visible'); }, 50); 
  }, 3500);
}

function initializeStoryReader() {
  const readerHTML = `
    <div id="reader-view">
      <div class="open-book-container" id="open-book">
        <div class="page left-page" onclick="flipPageBackward()">
          <div class="page-content" id="left-page-content"></div>
          <div class="page-number" id="left-page-num"></div>
          <div class="click-hint left" id="left-hint">◀</div>
        </div>
        <div class="page right-page" onclick="flipPageForward()">
          <div class="page-content" id="right-page-content"></div>
          <div class="page-number" id="right-page-num"></div>
          <div class="click-hint right" id="right-hint">▶</div>
        </div>
        <div class="turning-page" id="turning-page">
          <div class="page-face front"><div class="page-content" id="turn-front-content"></div></div>
          <div class="page-face back"><div class="page-content" id="turn-back-content"></div></div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', readerHTML);

  const metaScript = document.getElementById('story-meta').innerText;
  rawStoryText = document.getElementById('story-text').innerText.trim();
  const bookData = JSON.parse(metaScript);

  if (bookData.themeColor) document.body.style.background = bookData.themeColor;

  setTimeout(() => {
    document.getElementById('main-header').classList.add('shrunk');
    const reader = document.getElementById('reader-view');
    reader.style.display = 'flex';
    
    // Paginate dynamically once the container is visible to get accurate measurements
    paginateTextDynamically();
    if (currentPages.length > 0) {
      currentPages[0] = `<h1>${bookData.title}</h1>` + currentPages[0];
    }
    
    updatePageContent();
    setTimeout(() => { reader.classList.add('active'); }, 50);
  }, 3500);
}

function updatePageContent() {
  document.getElementById('left-page-content').innerHTML = currentPages[currentPageIndex] || "";
  document.getElementById('left-page-num').innerText = currentPages[currentPageIndex] ? (currentPageIndex + 1) : "";
  document.getElementById('right-page-content').innerHTML = currentPages[currentPageIndex + 1] || "";
  document.getElementById('right-page-num').innerText = currentPages[currentPageIndex + 1] ? (currentPageIndex + 2) : "";

  // Reset turning page state securely
  const turnPageElement = document.getElementById('turning-page');
  turnPageElement.style.transition = 'none';
  turnPageElement.classList.remove('is-flipping');
  
  // Update visibility of the subtle corner arrows
  document.getElementById('left-hint').style.display = currentPageIndex > 0 ? 'block' : 'none';
  document.getElementById('right-hint').style.display = (currentPageIndex + 2) < currentPages.length ? 'block' : 'none';
}

function flipPageForward() {
  if (isAnimating || currentPageIndex + 2 >= currentPages.length) return;
  isAnimating = true;

  const turnPageElement = document.getElementById('turning-page');
  
  // Set up the faces for the turning page
  document.getElementById('turn-front-content').innerHTML = currentPages[currentPageIndex + 1] || "";
  document.getElementById('turn-back-content').innerHTML = currentPages[currentPageIndex + 2] || "";

  // Update underlying right page so it reveals the next text
  document.getElementById('right-page-content').innerHTML = currentPages[currentPageIndex + 3] || "";
  document.getElementById('right-page-num').innerText = currentPages[currentPageIndex + 3] ? (currentPageIndex + 4) : "";

  // Apply smooth bezier transition
  turnPageElement.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
  turnPageElement.classList.add('is-flipping');

  setTimeout(() => {
    currentPageIndex += 2;
    updatePageContent(); 
    isAnimating = false;
  }, 800); 
}

function flipPageBackward() {
  if (isAnimating || currentPageIndex === 0) return;
  isAnimating = true;

  const turnPageElement = document.getElementById('turning-page');

  // To flip backwards seamlessly, we instantly flip the turning page to the left side (-180deg) without animating
  turnPageElement.style.transition = 'none';
  turnPageElement.classList.add('is-flipping');

  // Setup the faces: The back face is currently showing on the left. The front face will land on the right.
  document.getElementById('turn-back-content').innerHTML = currentPages[currentPageIndex] || "";
  document.getElementById('turn-front-content').innerHTML = currentPages[currentPageIndex - 1] || "";

  // Instantly update the underlying left page so the previous text is ready
  document.getElementById('left-page-content').innerHTML = currentPages[currentPageIndex - 2] || "";
  document.getElementById('left-page-num').innerText = currentPages[currentPageIndex - 2] ? (currentPageIndex - 1) : "";

  // Force the browser to register the instant setup before animating
  void turnPageElement.offsetWidth;

  // Animate the page falling back to the right
  turnPageElement.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
  turnPageElement.classList.remove('is-flipping');

  setTimeout(() => {
    currentPageIndex -= 2;
    updatePageContent();
    isAnimating = false;
  }, 800);
}
