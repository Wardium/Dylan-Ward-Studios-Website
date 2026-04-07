const fs = require('fs');
const path = require('path');

// Paths relative to where build.js is located
const storiesDir = path.join(__dirname, 'stories');
const outputFile = path.join(__dirname, 'database.js');

let allStories = [];

console.log(`\n🔍 Looking for story HTML files in: ${storiesDir}`);

if (fs.existsSync(storiesDir)) {
  const files = fs.readdirSync(storiesDir);
  let htmlFiles = files.filter(file => file.endsWith('.html'));
  
  if (htmlFiles.length === 0) {
    console.warn("⚠️ No .html files found in the 'stories' folder.");
  }

  htmlFiles.forEach(file => {
    const filePath = path.join(storiesDir, file);
    const rawHtml = fs.readFileSync(filePath, 'utf8');
    
    // Looks for 'id="story-meta"' anywhere inside a <script> tag
    const metaRegex = /<script[^>]*id=["']story-meta["'][^>]*>([\s\S]*?)<\/script>/i;
    const match = rawHtml.match(metaRegex);
    
    if (match && match[1]) {
      try {
        // THE FIX: Replace non-breaking spaces and zero-width characters with regular spaces
        let cleanJsonString = match[1]
          .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ')
          .trim();

        const storyData = JSON.parse(cleanJsonString);
        
        // Inject the URL dynamically
        storyData.url = `/expansions/DWSStories/stories/${file}`;
        
        allStories.push(storyData);
        console.log(`✅ Successfully extracted: ${storyData.title || file}`);
      } catch (error) {
        console.error(`❌ Error parsing JSON inside ${file}.`, error.message);
      }
    } else {
      console.warn(`⏭️ Skipped ${file}: Could not find <script id="story-meta"> block.`);
    }
  });
} else {
  console.error("🚨 Stories directory not found! Please make sure a folder named 'stories' is next to build.js.");
}

// Write the combined array to database.js
const jsContent = `const storyDatabase = ${JSON.stringify(allStories, null, 2)};`;

fs.writeFileSync(outputFile, jsContent);
console.log(`\n🎉 Done! Built database.js with ${allStories.length} stories.\n`);
