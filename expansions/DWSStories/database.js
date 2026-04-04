// --- AUTO PAGINATION ALGORITHM ---
function paginateText(rawText) {
  // Split the raw text by double line breaks (paragraphs)
  const paragraphs = rawText.split('\n\n');
  const pages = [];
  let currentPageHTML = "";
  const maxCharsPerPage = 600; // Adjust this if your font size changes

  paragraphs.forEach(p => {
    // If adding this paragraph exceeds our limit, push the current page and start a new one
    if ((currentPageHTML.length + p.length) > maxCharsPerPage && currentPageHTML.length > 0) {
      pages.push(currentPageHTML);
      currentPageHTML = `<p>${p}</p>`;
    } else {
      // Otherwise, keep adding to the current page
      currentPageHTML += `<p>${p}</p>`;
    }
  });
  
  // Push the final page if it has content left over
  if (currentPageHTML.length > 0) {
    pages.push(currentPageHTML);
  }
  
  return pages;
}

// --- UPDATED OPEN BOOK FUNCTION ---
function openBook(bookId) {
  currentBook = storyDatabase.find(b => b.id === bookId);
  
  // 1. Generate the pages dynamically from the raw text
  // We add the title as the very first element of the first page
  const formattedPages = paginateText(currentBook.text);
  formattedPages[0] = `<h1>${currentBook.title}</h1>` + formattedPages[0];
  
  // Store these dynamically generated pages back into the book object
  currentBook.pages = formattedPages;
  currentPageIndex = 0; 

  // 2. Change the website theme if the book has one
  if (currentBook.themeColor) {
    document.body.style.background = currentBook.themeColor;
  }

  const shelf = document.getElementById('bookshelf');
  const reader = document.getElementById('reader-view');

  shelf.classList.remove('visible');
  
  setTimeout(() => {
    shelf.style.display = 'none';
    updatePageContent(); 
    
    reader.style.display = 'flex';
    setTimeout(() => {
      reader.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);

  }, 500); 
}

// --- UPDATED CLOSE BOOK FUNCTION ---
function closeBook() {
  const shelf = document.getElementById('bookshelf');
  const reader = document.getElementById('reader-view');

  reader.classList.remove('active');
  
  // Reset the theme back to default when closing the book
  document.body.style.background = 'var(--bg-gradient)';
  
  setTimeout(() => {
    reader.style.display = 'none';
    
    shelf.style.display = 'block';
    setTimeout(() => {
       shelf.classList.add('visible');
    }, 50);
  }, 600);
}
