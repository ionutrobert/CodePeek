#!/usr/bin/env node

const fs = require('fs');

console.log('🚀 Preparing content script...');

// Just copy the clean index.js to bundle.js
const content = fs.readFileSync('src/content/index.js', 'utf8');

fs.writeFileSync('src/content/bundle.js', content);
fs.writeFileSync('dist/content.js', content);

console.log('✅ Content script prepared');
console.log('✅ Size:', Math.round(content.length / 1024) + 'KB');
