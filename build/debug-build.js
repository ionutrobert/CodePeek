#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUG BUILD STARTED');
console.log('Current directory:', process.cwd());

// Test 1: Can we create dist?
try {
  if (fs.existsSync('dist')) {
    console.log('✓ dist exists');
  } else {
    fs.mkdirSync('dist', { recursive: true });
    console.log('✓ Created dist');
  }
} catch (e) {
  console.error('✗ Failed to create dist:', e.message);
  process.exit(1);
}

// Test 2: Can we write manifest?
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  manifest.background.service_worker = 'background/service-worker.js';
  manifest.side_panel.default_path = 'sidepanel/index.html';
  
  fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));
  console.log('✓ Wrote dist/manifest.json');
  console.log('Manifest size:', fs.statSync('dist/manifest.json').size, 'bytes');
} catch (e) {
  console.error('✗ Failed to write manifest:', e.message);
  process.exit(1);
}

// Test 3: Can we create subfolders?
try {
  fs.mkdirSync('dist/icons', { recursive: true });
  console.log('✓ Created dist/icons');
  
  fs.mkdirSync('dist/sidepanel', { recursive: true });
  console.log('✓ Created dist/sidepanel');
  
  fs.mkdirSync('dist/background', { recursive: true });
  console.log('✓ Created dist/background');
  
  fs.mkdirSync('dist/src/content', { recursive: true });
  console.log('✓ Created dist/src/content');
} catch (e) {
  console.error('✗ Failed to create subfolders:', e.message);
  process.exit(1);
}

// Test 4: Can we copy a file?
try {
  const testContent = '// test';
  fs.writeFileSync('dist/src/content/test.js', testContent);
  console.log('✓ Wrote test file');
} catch (e) {
  console.error('✗ Failed to write test file:', e.message);
  process.exit(1);
}

console.log('\n✅ All tests passed!');
console.log('\nDist contents:');
const files = fs.readdirSync('dist', { recursive: true });
files.forEach(f => console.log('  -', f));
