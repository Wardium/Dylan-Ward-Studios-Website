document.addEventListener("DOMContentLoaded", () => {
  // Target the div where the content will go
  const container = document.getElementById("bookshelf-container");

  // Safety check to ensure the database loaded correctly
  if (typeof storyDatabase === "undefined") {
    console.error("storyDatabase not found. Check the path to database.js.");
    return;
  }

  // This string will hold all the generated HTML
  let htmlContent = "";

  // Loop through each item in your database
  storyDatabase.forEach(book => {
    
    // Provide a fallback image just in case "coverImage" is left completely empty ("")
    const coverImg = book.coverImage ? book.coverImage : "path/to/placeholder-image.jpg";

    // Append your formatted HTML to the string, inserting the object data using template literals (${})
    htmlContent += `
      <div class="glass-block col-half">
        <h2>${book.title}</h2>
        <p>${book.description}</p>
      </div>

      <div style="cursor: pointer;" class="glass-block media-block col-half expandable-link" data-iframe-src="${book.url}" loading="lazy">
              <img src="${coverImg}" alt="${book.title} Cover" loading="lazy">
            </div>
    `;
  });

  // Inject the final compiled HTML into the page
  container.innerHTML = htmlContent;
});
