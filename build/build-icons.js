// Simple build script to generate placeholder icons
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon-${size}.png`);
  
  // Create a simple SVG and convert it to base64 for a placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#3b82f6"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="${Math.floor(size * 0.6)}" font-family="monospace">C</text>
  </svg>`;
  
  // For simplicity, we'll just write a note about needing actual icons
  fs.writeFileSync(iconPath, `// Placeholder icon - size ${size}x${size}\n// Replace with actual PNG icon`);
  
  console.log(`Created placeholder icon: icon-${size}.png`);
});

console.log('Icon placeholders created! Replace these with actual PNG icons before publishing.');
process.exit(0);