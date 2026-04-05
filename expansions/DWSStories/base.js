// ==========================================
// base.js - RUNS IN THE WEB BROWSER
// ==========================================

function paginateText(rawText) {
  if (!rawText) return [];
  const paragraphs = rawText.split('\n\n');
  const pages = [];
  let currentPageHTML = "";
  const maxCharsPerPage = 315; 

  paragraphs.forEach(p => {
    if ((currentPageHTML.length + p.length) > maxCharsPerPage && currentPageHTML.length > 0) {
      pages.push(currentPageHTML);
      currentPageHTML = `<p>${p}</p>`;
    } else {
      currentPageHTML += `<p>${p}</p>`;
    }
  });
  if (currentPageHTML.length > 0) pages.push(currentPageHTML);
  return pages;
}

let currentPages = [];
let currentPageIndex = 0;

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
      <div class="back-btn" onclick="window.location.href='../bookshelf.html'">← Back to Bookshelf</div>
      <div class="open-book-container" id="open-book">
        <div class="page left-page">
          <div class="page-content" id="left-page-content"></div>
          <div class="page-number" id="left-page-num"></div>
        </div>
        <div class="page right-page" onclick="flipPageForward()">
          <div class="page-content" id="right-page-content"></div>
          <div class="page-number" id="right-page-num"></div>
          <div class="click-hint right">▶</div>
        </div>
        <div class="turning-page" id="turning-page" onclick="flipPageForward()">
          <div class="page-face front"><div class="page-content" id="turn-front-content"></div></div>
          <div class="page-face back"><div class="page-content" id="turn-back-content"></div></div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', readerHTML);

  const metaScript = document.getElementById('story-meta').innerText;
  const rawText = document.getElementById('story-text').innerText;
  const bookData = JSON.parse(metaScript);

  if (bookData.themeColor) document.body.style.background = bookData.themeColor;
  
  currentPages = paginateText(rawText.trim());
  if (currentPages.length > 0) {
    currentPages[0] = `<h1>${bookData.title}</h1>` + currentPages[0];
  }

  setTimeout(() => {
    document.getElementById('main-header').classList.add('shrunk');
    const reader = document.getElementById('reader-view');
    reader.style.display = 'flex';
    updatePageContent();
    setTimeout(() => { reader.classList.add('active'); }, 50);
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
  document.getElementById('turn-front-content').innerHTML = currentPages[currentPageIndex + 1] || "";
  
  const rightHint = document.querySelector('.click-hint.right');
  if (currentPageIndex + 2 >= currentPages.length) {
     rightHint.style.display = 'none';
     turnPageElement.style.cursor = 'default';
  } else {
     rightHint.style.display = 'block';
     turnPageElement.style.cursor = 'pointer';
  }
}

function flipPageForward() {
  if (currentPageIndex + 2 >= currentPages.length) return;
  const turnPageElement = document.getElementById('turning-page');
  
  document.getElementById('turn-back-content').innerHTML = currentPages[currentPageIndex + 2] || "";
  document.getElementById('right-page-content').innerHTML = currentPages[currentPageIndex + 3] || "";
  document.getElementById('right-page-num').innerText = currentPages[currentPageIndex + 3] ? (currentPageIndex + 4) : "";

  turnPageElement.style.transition = 'transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)';
  turnPageElement.classList.add('is-flipping');

  setTimeout(() => {
    currentPageIndex += 2;
    updatePageContent(); 
  }, 800); 
}
