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

  // Ensure the DOM has calculated the layout before we start measuring
  const maxHeight = pageContainer.clientHeight;
  if (maxHeight === 0) {
    setTimeout(paginateTextDynamically, 50);
    return;
  }

  // Create a perfect hidden clone to measure text heights precisely
  const tester = pageContainer.cloneNode(false);
  tester.style.position = 'absolute';
  tester.style.visibility = 'hidden';
  tester.style.pointerEvents = 'none';
  tester.style.top = '0';
  tester.style.left = '0';
  tester.style.width = pageContainer.clientWidth + 'px';
  tester.style.height = maxHeight + 'px';
  pageContainer.parentElement.appendChild(tester);

  // Safely split the text into paragraphs (handles different types of line breaks)
  const paragraphs = rawStoryText.split(/\n\s*\n/);
  currentPages = [];
  
  // Grab title to safely measure it on the first page
  const metaScript = document.getElementById('story-meta').innerText;
  const bookData = JSON.parse(metaScript);
  let currentHTML = `<h1>${bookData.title}</h1>`;

  for (let i = 0; i < paragraphs.length; i++) {
    let pText = paragraphs[i].trim();
    if (!pText) continue;

    let pHTML = `<p>${pText}</p>`;
    tester.innerHTML = currentHTML + pHTML;

    // If adding this paragraph exceeds the page height
    if (tester.scrollHeight > maxHeight) {
      if (currentHTML !== "") {
        currentPages.push(currentHTML);
        currentHTML = pHTML;
        tester.innerHTML = currentHTML;

        // If a SINGLE paragraph is so massive it exceeds the height on a blank page
        if (tester.scrollHeight > maxHeight) {
          currentHTML = breakLongParagraph(pText, tester, maxHeight, currentPages);
        }
      } else {
        // Fallback if the very first content is too large
        currentHTML = breakLongParagraph(pText, tester, maxHeight, currentPages);
      }
    } else {
      currentHTML += pHTML;
    }
  }

  if (currentHTML && currentHTML.trim() !== "") {
    currentPages.push(currentHTML);
  }

  // Cleanup hidden tester
  pageContainer.parentElement.removeChild(tester);
  
  // Ensure index isn't out of bounds if the user shrunk their window
  if (currentPageIndex >= currentPages.length) {
    currentPageIndex = Math.max(0, currentPages.length - (currentPages.length % 2 === 0 ? 2 : 1));
  }
  updatePageContent();
}

// Helper: Wraps long paragraphs word-by-word if they are larger than a single page
function breakLongParagraph(text, tester, maxHeight, pagesArray) {
  let words = text.split(" ");
  let tempHTML = "<p>";

  for (let w = 0; w < words.length; w++) {
    tester.innerHTML = tempHTML + words[w] + "</p>";
    if (tester.scrollHeight > maxHeight) {
      pagesArray.push(tempHTML.trim() + "</p>");
      tempHTML = "<p>" + words[w] + " ";
    } else {
      tempHTML += words[w] + " ";
    }
  }
  return tempHTML + "</p>";
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

// Recalculate pages seamlessly if the user resizes their window
window.addEventListener('resize', () => {
  if (document.getElementById('reader-view') && document.getElementById('reader-view').classList.contains('active')) {
    paginateTextDynamically();
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
    
    // The key fix: Wait 50ms so 'display: flex' applies dimensions before we measure
    setTimeout(() => { 
      paginateTextDynamically(); 
      reader.classList.add('active'); 
    }, 50);
  }, 3500);
}

function updatePageContent() {
  document.getElementById('left-page-content').innerHTML = currentPages[currentPageIndex] || "";
  document.getElementById('left-page-num').innerText = currentPages[currentPageIndex] ? (currentPageIndex + 1) : "";
  document.getElementById('right-page-content').innerHTML = currentPages[currentPageIndex + 1] || "";
  document.getElementById('right-page-num').innerText = currentPages[currentPageIndex + 1] ? (currentPageIndex + 2) : "";

  const turnPageElement = document.getElementById('turning-page');
  turnPageElement.style.transition = 'none';
  turnPageElement.classList.remove('is-flipping');
  
  document.getElementById('left-hint').style.display = currentPageIndex > 0 ? 'block' : 'none';
  document.getElementById('right-hint').style.display = (currentPageIndex + 2) < currentPages.length ? 'block' : 'none';
}

function flipPageForward() {
  if (isAnimating || currentPageIndex + 2 >= currentPages.length) return;
  isAnimating = true;

  const turnPageElement = document.getElementById('turning-page');
  
  document.getElementById('turn-front-content').innerHTML = currentPages[currentPageIndex + 1] || "";
  document.getElementById('turn-back-content').innerHTML = currentPages[currentPageIndex + 2] || "";

  document.getElementById('right-page-content').innerHTML = currentPages[currentPageIndex + 3] || "";
  document.getElementById('right-page-num').innerText = currentPages[currentPageIndex + 3] ? (currentPageIndex + 4) : "";

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

  turnPageElement.style.transition = 'none';
  turnPageElement.classList.add('is-flipping');

  document.getElementById('turn-back-content').innerHTML = currentPages[currentPageIndex] || "";
  document.getElementById('turn-front-content').innerHTML = currentPages[currentPageIndex - 1] || "";

  document.getElementById('left-page-content').innerHTML = currentPages[currentPageIndex - 2] || "";
  document.getElementById('left-page-num').innerText = currentPages[currentPageIndex - 2] ? (currentPageIndex - 1) : "";

  void turnPageElement.offsetWidth;

  turnPageElement.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
  turnPageElement.classList.remove('is-flipping');

  setTimeout(() => {
    currentPageIndex -= 2;
    updatePageContent();
    isAnimating = false;
  }, 800);
}
