#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Starting Code Peek production build...');

// Remove dist (handle locked folders on Windows)
if (fs.existsSync('dist')) {
  try {
    fs.rmSync('dist', { recursive: true, force: true });
  } catch (e) {
    if (process.platform === 'win32') {
      console.log(' ⚠ dist folder locked, using robocopy...');
      execSync('rd /s /q dist', { stdio: 'ignore' });
    } else {
      throw e;
    }
  }
}
fs.mkdirSync('dist', { recursive: true });

// 1. Bundle content script (include tech-detector)
console.log(' ⦿ Preparing content script...');
const techDetector = fs.readFileSync('src/content/tech-detector.js', 'utf8');
let contentScript = fs.readFileSync('src/content/index.js', 'utf8');

// Fix paths for dist (remove src/ prefix from sidepanel URLs)
contentScript = contentScript.replace(/src\/sidepanel/g, 'sidepanel');

fs.mkdirSync('dist/content', { recursive: true });
// Prepend tech-detector before content script
fs.writeFileSync('dist/content/bundle.js', techDetector + '\n\n' + contentScript);

// 2. Nothing Design System - no Tailwind build needed
console.log(' ⦿ Nothing Design System - using main.css only');

// 3. Copy manifest
console.log(' ⦿ Copying manifest...');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

// Fix paths in manifest for dist structure
manifest.background.service_worker = 'background/service-worker.js';
manifest.side_panel.default_path = 'sidepanel/index.html';
manifest.content_scripts[0].js = ['content/bundle.js'];
manifest.web_accessible_resources[0].resources = [
  'sidepanel/index.html',
  'sidepanel/styles/main.css',
  'sidepanel/app.js',
  'sidepanel/floating-mode.js',
  'sidepanel/utils/*.js',
  'sidepanel/components/*.js',
  'sidepanel/culori.min.js'
];

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
  'floating-mode.js',
  'components/tab-overview.js',
  'components/tab-colors.js',
  'components/tab-typography.js',
  'components/tab-assets.js',
  'components/element-inspector.js',
  'components/color-picker.js',
  'components/tab-rulers.js',
  'components/tab-tech-stack.js',
  'components/tab-code-snippets.js',
  'components/tab-audit.js',
  'components/modal-component.js',
  'components/og-preview-modal.js',
  'components/brand-guide-modal.js',
  'components/shortcuts-modal.js',
  'utils/messaging.js',
  'utils/formatters.js',
  'utils/og-preview-data.js',
  'utils/report-generator.js',
  'utils/report-template.js',
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
console.log(' ⦿ Copying background...');
fs.mkdirSync('dist/background', { recursive: true });
var serviceWorker = fs.readFileSync('src/background/service-worker.js', 'utf8');
// Fix paths for dist (remove src/ prefix from sidepanel URLs)
serviceWorker = serviceWorker.replace(/src\/sidepanel/g, 'sidepanel');
// Set IS_DEV_MODE to false for dist builds
serviceWorker = serviceWorker.replace(/IS_DEV_MODE/g, 'false');
fs.writeFileSync('dist/background/service-worker.js', serviceWorker);
console.log(' - Fixed service-worker.js paths for dist');

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
