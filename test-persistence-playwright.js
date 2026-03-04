/**
 * Automated test for Code Peek extension persistence
 * Uses Service Worker target to get extension ID
 */
const { chromium } = require('playwright');

async function runTest() {
  console.log('🧪 Starting Code Peek Persistence Test\n');
  
  const extensionPath = 'C:\\Work\\Chrome Extensions\\Code Peek\\extension\\dist';
  
  // Launch browser with extension
  const browser = await chromium.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox'
    ]
  });
  
  const context = await browser.newContext();
  
  // Wait for extension's service worker to appear
  console.log('Waiting for extension service worker...');
  let swWorker = null;
  for (let i = 0; i < 20; i++) {
    const targets = browser.targets();
    const swTarget = targets.find(t => t.type() === 'service_worker' && t.url().includes('service-worker.js'));
    if (swTarget) {
      try {
        swWorker = await swTarget.worker();
        break;
      } catch (e) {}
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  if (!swWorker) {
    console.error('❌ Service worker not found');
    await browser.close();
    process.exit(1);
  }
  
  // Get extension ID from service worker context
  const extensionId = await swWorker.evaluate(() => chrome.runtime.id);
  console.log('✅ Extension ID:', extensionId);
  
  const sidepanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
  console.log('Sidepanel URL:', sidepanelUrl);
  
  // Create a page to load the side panel
  const page = await context.newPage();
  
  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('[DEBUG]') || txt.includes('setDarkMode') || txt.includes('loadSettings') || txt.includes('Applied dark')) {
      console.log('PAGE LOG:', txt);
    } else if (txt.includes('ERROR') || txt.includes('WARN')) {
      console.error('PAGE ERROR:', txt);
    }
  });
  
  page.on('pageerror', err => {
    console.error('Page error:', err.message);
  });
  
  console.log('\n--- Step 1: Load side panel ---');
  await page.goto(sidepanelUrl, { waitUntil: 'domcontentloaded' });
  
  try {
    await page.waitForFunction(() => window.CodePeekApp && typeof window.CodePeekApp.isDarkMode !== 'undefined', { timeout: 10000 });
    console.log('✅ App initialized');
  } catch (e) {
    console.error('❌ App did not initialize');
    await browser.close();
    process.exit(1);
  }
  
  const state1 = await page.evaluate(() => ({
    isDarkMode: window.CodePeekApp.isDarkMode,
    htmlClass: document.documentElement.className,
    thumbPos: document.getElementById('dark-mode-thumb')?.style.transform
  }));
  console.log('Initial state:', state1);
  
  console.log('\n--- Step 2: Enable dark mode ---');
  const toggle = await page.$('#dark-mode-toggle');
  if (!toggle) {
    console.error('❌ Dark mode toggle not found');
    await browser.close();
    process.exit(1);
  }
  await toggle.click();
  await page.waitForTimeout(500);
  
  const state2 = await page.evaluate(() => ({
    isDarkMode: window.CodePeekApp.isDarkMode,
    htmlClass: document.documentElement.className,
    thumbPos: document.getElementById('dark-mode-thumb')?.style.transform
  }));
  console.log('After toggle:', state2);
  
  const stored = await page.evaluate(() => {
    return new Promise(resolve => {
      chrome.storage.local.get(['darkMode'], res => resolve(res.darkMode));
    });
  });
  console.log('Stored darkMode:', stored);
  
  if (stored !== true) {
    console.warn('⚠️ darkMode storage value is not true (expected true)');
  }
  
  console.log('\n--- Step 3: Reload side panel (simulate close/reopen) ---');
  await page.reload({ waitUntil: 'domcontentloaded' });
  
  try {
    await page.waitForFunction(() => window.CodePeekApp && typeof window.CodePeekApp.isDarkMode !== 'undefined', { timeout: 10000 });
    await page.waitForTimeout(1000);
  } catch (e) {
    console.error('❌ App failed to reinitialize after reload');
  }
  
  const state3 = await page.evaluate(() => ({
    isDarkMode: window.CodePeekApp.isDarkMode,
    htmlClass: document.documentElement.className,
    thumbPos: document.getElementById('dark-mode-thumb')?.style.transform
  }));
  console.log('After reload:', state3);
  
  const success = state3.isDarkMode === true && state3.htmlClass.includes('dark-mode');
  console.log('\n' + (success ? '✅' : '❌') + ` PERSISTENCE TEST ${success ? 'PASSED' : 'FAILED'}!`);
  
  // Save screenshot
  await page.screenshot({ path: 'test-result.png', fullPage: true });
  console.log('Screenshot saved to test-result.png');
  
  await browser.close();
  process.exit(success ? 0 : 1);
}

runTest().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
