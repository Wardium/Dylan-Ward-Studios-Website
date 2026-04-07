const fs = require('fs');
const path = require('path');

// Paths relative to where build.js is located
const storiesDir = path.join(__dirname, 'stories');
const outputFile = path.join(__dirname, 'database.js');

let allStories = [];

console.log(`Looking for story HTML files in: ${storiesDir}`);

if (fs.existsSync(storiesDir)) {
  fs.readdirSync(storiesDir).forEach(file => {
    if (file.endsWith('.html')) {
      const filePath = path.join(storiesDir, file);
      const rawHtml = fs.readFileSync(filePath, 'utf8');
      
      // Regex to find the content inside <script id="story-meta" type="application/json">
      const metaRegex = /<script\s+id="story-meta"\s+type="application\/json">([\s\S]*?)<\/script>/i;
      const match = rawHtml.match(metaRegex);
      
      if (match && match[1]) {
        try {
          const storyData = JSON.parse(match[1].trim());
          
          // Inject the URL dynamically based on your specified root path
          storyData.url = `/expansions/DWSStories/stories/${file}`;
          
          allStories.push(storyData);
          console.log(`Successfully extracted meta from: ${file}`);
        } catch (error) {
          console.error(`Error parsing JSON inside ${file}. Check your formatting!`, error);
        }
      } else {
        console.warn(`Skipped ${file}: No <script id="story-meta"> block found.`);
      }
    }
  });
} else {
  console.error("Stories directory not found! Please create it.");
}

// Write the combined array to database.js
const jsContent = `const storyDatabase = ${JSON.stringify(allStories, null, 2)};`;

fs.writeFileSync(outputFile, jsContent);
console.log(`Successfully built database.js with ${allStories.length} stories in ${outputFile}`);
