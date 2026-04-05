// ==========================================
// base.js - RUNS IN THE WEB BROWSER
// ==========================================

let currentPages = [];
let currentPageIndex = 0;
let rawStoryText = "";
let isAnimating = false;

// 1. Dynamic Pagination: Measures against the single omni-page
function paginateTextDynamically() {
  if (!rawStoryText) return;
  const pageContainer = document.getElementById('main-page-content');
  if (!pageContainer) return;

  const maxHeight = pageContainer.clientHeight;
  if (maxHeight === 0) {
    setTimeout(paginateTextDynamically, 50);
    return;
  }

  // Generate Title/Cover Page
  const metaScript = document.getElementById('story-meta').innerText;
  const bookData = JSON.parse(metaScript);
  
  const coverHTML = `
    <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: var(--book-text);">
      <h1 style="font-size: clamp(2.5rem, 5vw, 4rem); margin: 0 0 15px 0;">${bookData.title}</h1>
      <div style="width: 50px; height: 3px; background: ${bookData.coverColor || '#333'}; margin-bottom: 20px; border-radius: 2px;"></div>
      <p style="font-size: clamp(1.1rem, 2.5vw, 1.4rem); font-style: italic; opacity: 0.8; margin: 0;">${bookData.description}</p>
    </div>
  `;

  // Create a hidden clone to measure text heights precisely
  const tester = pageContainer.cloneNode(false);
  tester.style.position = 'absolute';
  tester.style.visibility = 'hidden';
  tester.style.pointerEvents = 'none';
  tester.style.top = '0';
  tester.style.left = '0';
  tester.style.width = pageContainer.clientWidth + 'px';
  tester.style.height = maxHeight + 'px';
  pageContainer.parentElement.appendChild(tester);

  const paragraphs = rawStoryText.split(/\n\s*\n/);
  
  // Start array with the Cover Page
  currentPages = [coverHTML];
  let currentHTML = "";

  for (let i = 0; i < paragraphs.length; i++) {
    let pText = paragraphs[i].trim();
    if (!pText) continue;

    let pHTML = `<p>${pText}</p>`;
    tester.innerHTML = currentHTML + pHTML;

    if (tester.scrollHeight > maxHeight) {
      if (currentHTML !== "") {
        currentPages.push(currentHTML);
        currentHTML = pHTML;
        tester.innerHTML = currentHTML;

        if (tester.scrollHeight > maxHeight) {
          currentHTML = breakLongParagraph(pText, tester, maxHeight, currentPages);
        }
      } else {
        currentHTML = breakLongParagraph(pText, tester, maxHeight, currentPages);
      }
    } else {
      currentHTML += pHTML;
    }
  }

  if (currentHTML && currentHTML.trim() !== "") {
    currentPages.push(currentHTML);
  }

  pageContainer.parentElement.removeChild(tester);
  
  if (currentPageIndex >= currentPages.length) {
    currentPageIndex = Math.max(0, currentPages.length - 1);
  }
  updatePageContent();
}

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
        
        <div class="page main-page">
          <div class="page-content" id="main-page-content"></div>
          <div class="page-number" id="main-page-num"></div>
        </div>
        
        <div class="turning-page" id="turning-page">
          <div class="page-face front"><div class="page-content" id="turn-front-content"></div></div>
          <div class="page-face back"><div class="page-content" id="turn-back-content"></div></div>
        </div>

        <div class="click-zone left-zone" onclick="flipPageBackward()">
          <div class="click-hint" id="left-hint">◀</div>
        </div>
        <div class="click-zone right-zone" onclick="flipPageForward()">
          <div class="click-hint" id="right-hint">▶</div>
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
    
    setTimeout(() => { 
      paginateTextDynamically(); 
      reader.classList.add('active'); 
    }, 50);
  }, 3500);
}

function updatePageContent() {
  // Update the static text underneath
  document.getElementById('main-page-content').innerHTML = currentPages[currentPageIndex] || "";
  
  // Hide page number on the cover (index 0)
  document.getElementById('main-page-num').innerText = currentPageIndex === 0 ? "" : currentPageIndex;

  // Hide the turning page when resting
  const turnPageElement = document.getElementById('turning-page');
  turnPageElement.style.transition = 'none';
  turnPageElement.classList.remove('is-flipping');
  turnPageElement.style.opacity = '0'; 
  
  // Update navigation hints
  document.getElementById('left-hint').style.display = currentPageIndex > 0 ? 'block' : 'none';
  document.getElementById('right-hint').style.display = (currentPageIndex + 1) < currentPages.length ? 'block' : 'none';
}

function flipPageForward() {
  if (isAnimating || currentPageIndex + 1 >= currentPages.length) return;
  isAnimating = true;

  const turnPageElement = document.getElementById('turning-page');
  
  // Prepare the lifting sheet: Front matches the text we are currently looking at, Back is blank paper
  document.getElementById('turn-front-content').innerHTML = currentPages[currentPageIndex] || "";
  document.getElementById('turn-back-content').innerHTML = ""; 
  
  // Unhide the lifting sheet
  turnPageElement.style.opacity = '1';

  // The static page underneath instantly switches to the next page so it's revealed as the sheet lifts
  document.getElementById('main-page-content').innerHTML = currentPages[currentPageIndex + 1] || "";
  document.getElementById('main-page-num').innerText = (currentPageIndex + 1) === 0 ? "" : (currentPageIndex + 1);

  // Trigger smooth turn
  turnPageElement.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
  turnPageElement.classList.add('is-flipping');

  setTimeout(() => {
    currentPageIndex++;
    updatePageContent(); // This cleans up and hides the turning page again
    isAnimating = false;
  }, 800); 
}

function flipPageBackward() {
  if (isAnimating || currentPageIndex === 0) return;
  isAnimating = true;

  const turnPageElement = document.getElementById('turning-page');

  // Instantly position the invisible turning sheet flipped over to the left side
  turnPageElement.style.transition = 'none';
  turnPageElement.classList.add('is-flipping');
  
  // Setup the falling sheet: Front is blank paper, Back contains the previous page's text
  document.getElementById('turn-front-content').innerHTML = ""; 
  document.getElementById('turn-back-content').innerHTML = currentPages[currentPageIndex - 1] || "";
  
  // Unhide the sheet
  turnPageElement.style.opacity = '1';

  // Force reflow so the browser registers it on the left side before animating
  void turnPageElement.offsetWidth;

  // Animate the sheet falling back down onto the right side
  turnPageElement.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
  turnPageElement.classList.remove('is-flipping');

  setTimeout(() => {
    currentPageIndex--;
    updatePageContent(); // This cleans up and sets the main page to the new text
    isAnimating = false;
  }, 800);
}
