// Fix script - replaces corrupted section in content script
const fs = require('fs');
const path = require('path');

const contentFile = path.join(__dirname, '..', 'src', 'content', 'index.js');
let content = fs.readFileSync(contentFile, 'utf8');

// Find the line where extractPageStats starts (around line 380)
const lines = content.split('\n');

// Keep everything up to line 379 (index 378)
const goodPart = lines.slice(0, 379).join('\n');

// Clean replacement for extractPageStats and helpers + message handler
const cleanTail = `
function extractPageStats() {
  var stats = {
    stylesheets: 0,
    rules: 0,
    size: 0,
    loadTime: 0,
    stylesheetsList: [],
    contrastIssues: []
  };
  
  var sheets = document.styleSheets;
  stats.stylesheets = sheets.length;
  
  try {
    for (var i = 0; i < sheets.length; i++) {
      var sheet = sheets[i];
      var ruleCount = 0;
      try {
        if (sheet.cssRules) {
          ruleCount = sheet.cssRules.length;
        }
      } catch (e) {
        ruleCount = 0;
      }
      stats.rules += ruleCount;
      stats.stylesheetsList.push({
        href: sheet.href || 'inline',
        title: sheet.title || 'Untitled',
        rules: ruleCount
      });
    }
  } catch (e) {
    console.error('Error extracting page stats:', e);
  }
  
  var totalSize = 0;
  for (var j = 0; j < sheets.length; j++) {
    try {
      if (sheets[j].cssRules) {
        for (var k = 0; k < sheets[j].cssRules.length; k++) {
          if (sheets[j].cssRules[k].cssText) {
            totalSize += sheets[j].cssRules[k].cssText.length;
          }
        }
      }
    } catch(e) {}
  }
  stats.size = totalSize;
  
  var elements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, li');
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var style = window.getComputedStyle(el);
    var fg = style.color;
    var bg = style.backgroundColor;
    
    if (fg && bg && fg !== 'transparent' && bg !== 'transparent') {
      var ratio = calculateContrastRatio(fg, bg);
      if (ratio < 4.5) {
        stats.contrastIssues.push({
          element: el.tagName,
          text: fg,
          background: bg,
          ratio: ratio,
          selector: getSimpleSelector(el)
        });
      }
    }
  }
  
  return stats;
}

function calculateContrastRatio(color1, color2) {
  var c1 = parseColor(color1);
  var c2 = parseColor(color2);
  if (!c1 || !c2) return 1;
  var l1 = getLuminance(c1.r, c1.g, c1.b);
  var l2 = getLuminance(c2.r, c2.g, c2.b);
  var lighter = Math.max(l1, l2);
  var darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseColor(str) {
  var match = str.match(/^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
  if (match) {
    return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
  }
  if (str.charAt(0) === '#') {
    var hex = str.substring(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    var num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  return null;
}

function getLuminance(r, g, b) {
  var a = [r, g, b].map(function(v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getSimpleSelector(el) {
  if (el.id) return '#' + el.id;
  var classes = el.className ? el.className.split(' ')[0] : '';
  return classes ? '.' + classes : el.tagName.toLowerCase();
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    console.log('Content received:', msg.type);
    switch (msg.type) {
      case 'EXTRACT_PAGE_DATA':
        var pageData = extractPageStats();
        pageData.colors = extractColors();
        pageData.typography = extractTypography();
        pageData.assets = extractAssets();
        sendResponse({ success: true, data: pageData });
        break;
      case 'EXTRACT_COLORS':
        sendResponse({ success: true, data: extractColors() });
        break;
      case 'EXTRACT_TYPOGRAPHY':
        sendResponse({ success: true, data: extractTypography() });
        break;
      case 'EXTRACT_ASSETS':
        sendResponse({ success: true, data: extractAssets() });
        break;
      case 'START_INSPECT_MODE':
        startInspectMode();
        sendResponse({ success: true });
        break;
      case 'STOP_INSPECT_MODE':
        stopInspectMode();
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false, error: 'Unknown type' });
    }
    return true;
  });
}

console.log('Code Peek content script ready');
})();
`;

// Combine good part + clean tail
const fixedContent = goodPart + '\n' + cleanTail;

// Write back
fs.writeFileSync(contentFile, fixedContent, 'utf8');
console.log('Fixed content script - replaced corrupted section');
