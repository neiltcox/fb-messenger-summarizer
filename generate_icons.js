const fs = require('fs');
const { createCanvas } = require('canvas');

// Create icons directory if it doesn't exist
if (!fs.existsSync('icons')) {
    fs.mkdirSync('icons');
}

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a73e8';
    ctx.fillRect(0, 0, size, size);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', size/2, size/2);

    // Save to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icons/icon${size}.png`, buffer);
}

// Generate icons in required sizes
[16, 48, 128].forEach(size => generateIcon(size)); 