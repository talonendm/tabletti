const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images'); // images-kansio
const outputFile = path.join(__dirname, 'images.json');

fs.readdir(imagesDir, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }
    // Suodatetaan vain kuvatiedostot
    const imageFiles = files.filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f));
    fs.writeFileSync(outputFile, JSON.stringify(imageFiles, null, 2));
    console.log(`images.json luotu: ${imageFiles.length} tiedostoa`);
});
