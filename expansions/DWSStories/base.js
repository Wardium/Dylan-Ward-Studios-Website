// ==========================================
// base.js - RUNS IN THE WEB BROWSER
// ==========================================

let currentPages = [];
let currentPageIndex = 0;
let rawStoryText = "";
let isAnimating = false;

function paginateTextDynamically() {
  if (!rawStoryText) return;
  const pageContainer = document.getElementById('right-page-content');
  if (!pageContainer) return;

  const maxHeight = pageContainer.clientHeight;
  if (maxHeight === 0) {
    setTimeout(paginateTextDynamically, 50);
    return;
  }

  const metaScript = document.getElementById('story-meta').innerText;
  const bookData = JSON.parse(metaScript);
  
  const coverHTML = `
    <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: var(--book-text);">
      <h1 style="font-size: clamp(2rem, 4vw, 3.5rem); margin: 0 0 15px 0;">${bookData.title}</h1>
      <div style="width: 50px; height: 3px; background: ${bookData.coverColor || '#333'}; margin-bottom: 20px; border-radius: 2px;"></div>
      <p style="font-size: clamp(1rem, 1.8vw, 1.2rem); font-style: italic; opacity: 0.8; margin: 0;">${bookData.description}</p>
    </div>
  `;

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
  
  currentPages = ["<div style='height:100%; width:100%;'></div>", coverHTML];
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
    currentPageIndex = Math.max(0, currentPages.length - (currentPages.length % 2 === 0 ? 2 : 1));
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
    <header id="main-header">
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
        <div class="book-info"><h2>${book.title}</h2><p>${book.description}</p></div>
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
          <div class="page-face front">
            <div class="page-content" id="turn-front-content"></div>
            <div class="page-number" id="turn-front-num"></div>
          </div>
          <div class="page-face back">
            <div class="page-content" id="turn-back-content"></div>
            <div class="page-number" id="turn-back-num"></div>
          </div>
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
    setTimeout(() => { paginateTextDynamically(); reader.classList.add('active'); }, 50);
  }, 3500);
}

function updatePageContent() {
  document.getElementById('left-page-content').innerHTML = currentPages[currentPageIndex] || "";
  document.getElementById('right-page-content').innerHTML = currentPages[currentPageIndex + 1] || "";
  
  document.getElementById('left-page-num').innerText = (currentPageIndex > 1 && currentPages[currentPageIndex]) ? (currentPageIndex) : "";
  document.getElementById('right-page-num').innerText = (currentPageIndex + 1 > 1 && currentPages[currentPageIndex + 1]) ? (currentPageIndex + 1) : "";

  const turnPageElement = document.getElementById('turning-page');
  turnPageElement.style.transition = 'none';
  turnPageElement.classList.remove('is-flipping');
  turnPageElement.style.opacity = '0'; 
  
  document.getElementById('left-hint').style.display = currentPageIndex > 0 ? 'block' : 'none';
  document.getElementById('right-hint').style.display = (currentPageIndex + 2) < currentPages.length ? 'block' : 'none';
}

function flipPageForward() {
  if (isAnimating || currentPageIndex + 2 >= currentPages.length) return;
  isAnimating = true;

  const turnPageElement = document.getElementById('turning-page');
  
  // Front face gets current Right page content & number
  document.getElementById('turn-front-content').innerHTML = currentPages[currentPageIndex + 1] || "";
  document.getElementById('turn-front-num').innerText = (currentPageIndex + 1 > 1 && currentPages[currentPageIndex + 1]) ? (currentPageIndex + 1) : "";

  // Back face gets NEXT Left page content & number
  document.getElementById('turn-back-content').innerHTML = currentPages[currentPageIndex + 2] || ""; 
  document.getElementById('turn-back-num').innerText = (currentPageIndex + 2 > 1 && currentPages[currentPageIndex + 2]) ? (currentPageIndex + 2) : "";
  
  turnPageElement.style.opacity = '1';

  document.getElementById('right-page-content').innerHTML = currentPages[currentPageIndex + 3] || "";
  document.getElementById('right-page-num').innerText = (currentPageIndex + 3 > 1 && currentPages[currentPageIndex + 3]) ? (currentPageIndex + 3) : "";

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
  
  // Back face (currently up on the left) gets current Left page content & number
  document.getElementById('turn-back-content').innerHTML = currentPages[currentPageIndex] || ""; 
  document.getElementById('turn-back-num').innerText = (currentPageIndex > 1 && currentPages[currentPageIndex]) ? (currentPageIndex) : "";

  // Front face gets PREVIOUS Right page content & number
  document.getElementById('turn-front-content').innerHTML = currentPages[currentPageIndex - 1] || "";
  document.getElementById('turn-front-num').innerText = (currentPageIndex - 1 > 1 && currentPages[currentPageIndex - 1]) ? (currentPageIndex - 1) : "";
  
  turnPageElement.style.opacity = '1';

  document.getElementById('left-page-content').innerHTML = currentPages[currentPageIndex - 2] || "";
  document.getElementById('left-page-num').innerText = (currentPageIndex - 2 > 1 && currentPages[currentPageIndex - 2]) ? (currentPageIndex - 2) : "";

  void turnPageElement.offsetWidth;

  turnPageElement.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
  turnPageElement.classList.remove('is-flipping');

  setTimeout(() => {
    currentPageIndex -= 2;
    updatePageContent(); 
    isAnimating = false;
  }, 800);
}
