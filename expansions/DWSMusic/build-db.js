const fs = require('fs');
const path = require('path');

const albumsDir = path.join(__dirname, 'albums');
const outputFile = path.join(__dirname, 'database.js');

let musicDatabase = [];
let albumIdCounter = 1;

// Read the /albums directory
const folders = fs.readdirSync(albumsDir);

folders.forEach(folder => {
    const folderPath = path.join(albumsDir, folder);
    
    // Only process actual directories
    if (fs.statSync(folderPath).isDirectory()) {
        const infoPath = path.join(folderPath, 'info.txt');
        const filesInAlbum = fs.readdirSync(folderPath);
        
        // Default values if info.txt is missing
        let title = folder;
        let description = "No description provided.";

        // Parse info.txt
        if (fs.existsSync(infoPath)) {
            const infoContent = fs.readFileSync(infoPath, 'utf-8');
            const lines = infoContent.split('\n');
            lines.forEach(line => {
                if (line.startsWith('Title:')) title = line.replace('Title:', '').trim();
                if (line.startsWith('Description:')) description = line.replace('Description:', '').trim();
            });
        }

        // Find cover image and audio files
        let coverFile = filesInAlbum.find(f => f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg'));
        let audioFiles = filesInAlbum.filter(f => f.toLowerCase().endsWith('.mp3') || f.toLowerCase().endsWith('.wav'));

        // Format tracks
        let tracks = audioFiles.map(file => {
            // Cleans up the filename to look like a title (removes .mp3 and underscores)
            let cleanTitle = file.replace(/\.[^/.]+$/, "").replace(/_/g, " "); 
            return {
                title: cleanTitle,
                src: `albums/${folder}/${file}`
            };
        });

        // Add to database
        musicDatabase.push({
            id: albumIdCounter++,
            title: title,
            description: description,
            coverImage: coverFile ? `albums/${folder}/${coverFile}` : null,
            tracks: tracks
        });
    }
});

// Write the database to a .js file that HTML can read
const jsOutput = `// THIS FILE IS AUTO-GENERATED. DO NOT EDIT DIRECTLY.\nconst musicDatabase = ${JSON.stringify(musicDatabase, null, 2)};`;

fs.writeFileSync(outputFile, jsOutput);
console.log('✅ database.js successfully generated! Your albums are ready.');
