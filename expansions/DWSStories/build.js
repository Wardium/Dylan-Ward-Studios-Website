const fs = require('fs');
const path = require('path');

const storiesDir = path.join(__dirname, 'stories');
const outputFile = path.join(__dirname, 'database.js');

let allStories = [];

// Read all files in the stories directory
fs.readdirSync(storiesDir).forEach(file => {
  if (file.endsWith('.json')) {
    const filePath = path.join(storiesDir, file);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const storyData = JSON.parse(rawData);
    allStories.push(storyData);
  }
});

// Sort by ID or title if you want, then write to database.js
const jsContent = `const storyDatabase = ${JSON.stringify(allStories, null, 2)};`;

fs.writeFileSync(outputFile, jsContent);
console.log(`Successfully built database.js with ${allStories.length} stories.`);
