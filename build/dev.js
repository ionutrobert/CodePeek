#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Code Peek development build...');

// Clean and build function
function build() {
  console.log('\n📦 Building extension...');
  
  try {
    // 1. Bundle content scripts
    console.log('  ⦿ Bundling content scripts...');
    execSync('node build/bundle-content.js', { stdio: 'inherit' });
    
    // 2. Build Tailwind CSS
    console.log('  ⦿ Building Tailwind CSS...');
    execSync('npx tailwindcss -i src/sidepanel/styles/input.css -o src/sidepanel/styles/generated.css', { stdio: 'inherit' });
    
    // 3. Copy manifest and assets
    console.log('  ⦿ Copying assets...');
    fs.cpSync('manifest.json', 'dist/manifest.json', { force: true });
    fs.cpSync('icons', 'dist/icons', { recursive: true, force: true });
    
    // 4. Copy sidepanel files
    console.log('  ⦿ Copying sidepanel...');
    fs.cpSync('src/sidepanel', 'dist/sidepanel', { recursive: true, force: true });
    
    // 5. Copy background service worker
    console.log('  ⦿ Copying background script...');
    fs.cpSync('src/background/service-worker.js', 'dist/background/service-worker.js', { force: true });
    
    console.log('\n✅ Build complete!');
    console.log('\n📋 Next steps:');
    console.log('  1. Open Chrome → chrome://extensions/');
    console.log('  2. Enable Developer Mode (toggle in top right)');
    console.log('  3. Click "Load unpacked"');
    console.log('  4. Select the dist folder');
    console.log('  5. Click the Code Peek icon to test');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Initial build
build();

// Watch mode for development (if --watch flag provided)
if (process.argv.includes('--watch')) {
  console.log('\n👀 Watching for changes...\n');
  
  const watchedDirs = ['src', 'manifest.json'];
  
  watchedDirs.forEach(dir => {
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      console.log(`\n📝 File changed: ${filename}`);
      build();
    });
  });
}
