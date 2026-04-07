#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📦 Starting Code Peek production build...');

// Remove dist
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });

// 1. Bundle content script
console.log('  ⦿ Preparing content script...');
const contentScript = fs.readFileSync('src/content/index.js', 'utf8');
fs.mkdirSync('dist/src/content', { recursive: true });
fs.writeFileSync('dist/src/content/bundle.js', contentScript);

// 2. Build Tailwind
console.log('  ⦿ Building Tailwind CSS...');
const { execSync } = require('child_process');
try {
  execSync('npx tailwindcss -i src/sidepanel/styles/input.css -o src/sidepanel/styles/generated.css --minify', { stdio: 'inherit' });
} catch(e) {}

// 3. Copy manifest
console.log('  ⦿ Copying manifest...');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

// Fix paths in manifest for dist structure
manifest.background.service_worker = 'background/service-worker.js';
manifest.side_panel.default_path = 'sidepanel/index.html';

fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));

// 4. Copy icons
console.log('  ⦿ Copying icons...');
fs.cpSync('icons', 'dist/icons', { recursive: true });

// 5. Copy sidepanel - just copy the source files directly
console.log(' ⦿ Copying sidepanel...');
fs.mkdirSync('dist/sidepanel', { recursive: true });

// Copy culori library
if (fs.existsSync('node_modules/culori/bundled/culori.min.js')) {
fs.copyFileSync('node_modules/culori/bundled/culori.min.js', 'dist/sidepanel/culori.min.js');
console.log('  - Copied culori.min.js');
}

var sidepanelFiles = [
'index.html',
'error-handler.js',
'app.js',
'components/tab-overview.js',
'components/tab-colors.js',
'components/tab-typography.js',
'components/tab-assets.js',
'components/element-inspector.js',
'components/color-picker.js', // ADDED
'components/tab-rulers.js',
'components/tab-tech-stack.js',
'components/tab-code-snippets.js',
'components/tab-audit.js',
'components/modal-component.js',
'components/og-preview-modal.js',
'components/brand-guide-modal.js',
'utils/messaging.js',
'utils/formatters.js',
'utils/og-preview-data.js',
'utils/report-generator.js',
'utils/report-template.js',
'styles/generated.css',
'styles/main.css'
];

sidepanelFiles.forEach(function(file) {
var srcPath = path.join('src/sidepanel', file);
var destPath = path.join('dist/sidepanel', file);
if (fs.existsSync(srcPath)) {
fs.mkdirSync(path.dirname(destPath), { recursive: true });
fs.copyFileSync(srcPath, destPath);
}
});

// 6. Copy background
console.log('  ⦿ Copying background...');
fs.mkdirSync('dist/background', { recursive: true });
fs.copyFileSync('src/background/service-worker.js', 'dist/background/service-worker.js');

console.log('\n✅ Production build complete!');

// Count files
var count = 0;
function countFiles(dir) {
  var files = fs.readdirSync(dir);
  files.forEach(function(f) {
    var fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      countFiles(fp);
    } else {
      count++;
    }
  });
}
countFiles('dist');

var size = 0;
function calcSize(dir) {
  var files = fs.readdirSync(dir);
  files.forEach(function(f) {
    var fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      calcSize(fp);
    } else {
      size += fs.statSync(fp).size;
    }
  });
}
calcSize('dist');

console.log('📊 Files:', count);
console.log('📊 Size:', (size / 1024).toFixed(2), 'KB');
