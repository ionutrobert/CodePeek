#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📦 Syncing Code Peek extension...');

// Ensure dist structure exists
const dirs = [
  'dist',
  'dist/content',
  'dist/background',
  'dist/sidepanel',
  'dist/sidepanel/components',
  'dist/sidepanel/utils',
  'dist/sidepanel/styles',
  'dist/icons'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 1. Copy content script
console.log(' ⦿ Syncing content script...');
fs.copyFileSync('src/content/index.js', 'dist/content/bundle.js');

// 2. Copy manifest (with fixed paths)
console.log(' ⦿ Syncing manifest...');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const distManifest = {
  ...manifest,
  background: { service_worker: 'background/service-worker.js' },
  side_panel: { default_path: 'sidepanel/index.html' },
  content_scripts: [{
    ...manifest.content_scripts[0],
    js: ['content/bundle.js']
  }]
};
fs.writeFileSync('dist/manifest.json', JSON.stringify(distManifest, null, 2));

// 3. Copy background
console.log(' ⦿ Syncing background...');
fs.copyFileSync('src/background/service-worker.js', 'dist/background/service-worker.js');

// 4. Copy icons
console.log(' ⦿ Syncing icons...');
fs.cpSync('icons', 'dist/icons', { recursive: true, force: true });

// 5. Copy sidepanel files
console.log(' ⦿ Syncing sidepanel...');
const sidepanelFiles = [
  'index.html',
  'error-handler.js',
  'app.js',
  'culori.min.js',
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
  'utils/messaging.js',
  'utils/formatters.js',
  'utils/og-preview-data.js',
  'utils/report-generator.js',
  'utils/report-template.js',
  'styles/main.css'
];

sidepanelFiles.forEach(file => {
  const srcPath = path.join('src/sidepanel', file);
  const destPath = path.join('dist/sidepanel', file);
  if (fs.existsSync(srcPath)) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
  } else if (file === 'culori.min.js' && fs.existsSync('node_modules/culori/bundled/culori.min.js')) {
    fs.copyFileSync('node_modules/culori/bundled/culori.min.js', destPath);
  }
});

console.log('\n✅ Sync complete!');
