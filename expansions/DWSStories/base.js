const fs = require('fs');
const path = require('path');

const storiesDir = path.join(__dirname, 'stories');
const outputFile = path.join(__dirname, 'database.js');

let allStories = [];

console.log(`Looking for HTML stories in: ${storiesDir}`);

if (fs.existsSync(storiesDir)) {
  fs.readdirSync(storiesDir).forEach(file => {
    // Only look for HTML files now!
    if (file.endsWith('.html')) {
      const filePath = path.join(storiesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for the special JSON block inside the HTML
      const metaMatch = content.match(/<script id="story-meta" type="application\/json">([\s\S]*?)<\/script>/);
      
      if (metaMatch && metaMatch[1]) {
        try {
          const meta = JSON.parse(metaMatch[1]);
          // Auto-generate the path to this specific HTML file
          meta.url = `stories/${file}`; 
          allStories.push(meta);
          console.log(`Successfully mapped link for: ${file}`);
        } catch (error) {
          console.error(`Error parsing JSON metadata in ${file}. Check for commas/quotes!`, error);
        }
      } else {
        console.warn(`Skipped ${file}: No <script id="story-meta"> block found.`);
      }
    }
  });
}

const jsContent = `const storyDatabase = ${JSON.stringify(allStories, null, 2)};`;
fs.writeFileSync(outputFile, jsContent);
console.log(`Successfully built database.js with ${allStories.length} HTML links.`);
