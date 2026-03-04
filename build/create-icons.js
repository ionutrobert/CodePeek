const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

console.log('Creating icons with canvas...');

// Icons go in project root icons folder
const iconsDir = path.join(__dirname, '..', 'icons');

const sizes = [
  { size: 128, name: 'icon-128.png' },
  { size: 48, name: 'icon-48.png' },
  { size: 32, name: 'icon-32.png' },
  { size: 16, name: 'icon-16.png' }
];

sizes.forEach(({ size, name }) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Emerald circle background
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 1, 0, Math.PI * 2);
  ctx.fill();
  
  // White brackets {
  const scale = size / 128;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, Math.round(6 * scale));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Left bracket
  ctx.beginPath();
  ctx.moveTo(40 * scale, 40 * scale);
  ctx.lineTo(28 * scale, 64 * scale);
  ctx.lineTo(40 * scale, 88 * scale);
  ctx.stroke();
  
  // Right bracket  
  ctx.beginPath();
  ctx.moveTo(88 * scale, 40 * scale);
  ctx.lineTo(100 * scale, 64 * scale);
  ctx.lineTo(88 * scale, 88 * scale);
  ctx.stroke();
  
  const buffer = canvas.toBuffer('image/png');
  const filepath = path.join(iconsDir, name);
  fs.writeFileSync(filepath, buffer);
  console.log(`Created ${name}: ${buffer.length} bytes`);
});

console.log('Done!');
