const fs = require('fs');
const path = require('path');

// These paths are relative to where this build.js file is located
const storiesDir = path.join(__dirname, 'stories');
const outputFile = path.join(__dirname, 'database.js');

let allStories = [];

console.log(`Looking for stories in: ${storiesDir}`);

// Read all files in the stories directory
if (fs.existsSync(storiesDir)) {
  fs.readdirSync(storiesDir).forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(storiesDir, file);
      const rawData = fs.readFileSync(filePath, 'utf8');
      
      try {
        const storyData = JSON.parse(rawData);
        allStories.push(storyData);
        console.log(`Successfully loaded: ${file}`);
      } catch (error) {
        console.error(`Error parsing ${file}. Make sure it is valid JSON!`, error);
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
