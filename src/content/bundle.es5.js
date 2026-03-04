
// Code Peek Content Script Bundle
// Generated: 2026-03-02T09:36:48.152Z

function initializeContentScript() {
  console.log('Initializing Code Peek content script...');
  return Promise.resolve();
}

function getAllElements() {
  return document.querySelectorAll('*');
}

function getElementSelector(element) {
  if (element.id) {
    return '#' + (element.id) + '';
  }
  
  if (element.className) {
    var classes = element.className.trim().split(' ').filter(Boolean);
    if (classes.length > 0) {
      return '${element.tagName.toLowerCase()}.' + (classes.join('.')) + '';
    }
  }
  
  return element.tagName.toLowerCase();
}

function getContrastRatio(color1, color2) {
  var l1 = getRelativeLuminance(color1);
  var l2 = getRelativeLuminance(color2);
  
  var lighter = Math.max(l1, l2);
  var darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(color) {
  var rgb = parseColor(color);
  if (!rgb) return 0;
  
  var sRGB = rgb.map(c  { return {
    c = c / 255; }
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

function parseColor(color) {
  if (!color || color === 'transparent' || color === 'inherit' || color === 'initial') {
    return null;
  }
  
  var hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    var hex = hexMatch[1];
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
        255
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.substr(0, 2), 16),
        parseInt(hex.substr(2, 2), 16),
        parseInt(hex.substr(4, 2), 16),
        255
      ];
    }
    if (hex.length === 8) {
      return [
        parseInt(hex.substr(0, 2), 16),
        parseInt(hex.substr(2, 2), 16),
        parseInt(hex.substr(4, 2), 16),
        parseInt(hex.substr(6, 2), 16)
      ];
    }
  }
  
  var rgbMatch = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    var parts = rgbMatch[1].split(',').map(s  { return s.trim()); }
    if (parts.length === 3) {
      return [
        parseInt(parts[0]),
        parseInt(parts[1]),
        parseInt(parts[2]),
        255
      ];
    }
    if (parts.length === 4) {
      return [
        parseInt(parts[0]),
        parseInt(parts[1]),
        parseInt(parts[2]),
        Math.round(parseFloat(parts[3]) * 255)
      ];
    }
  }
  
  if (color === 'black') return [0, 0, 0, 255];
  if (color === 'white') return [255, 255, 255, 255];
  
  return null;
}

function rgbToHex(rgb) {
  var parsed = parseColor(rgb);
  if (!parsed) return null;
  
  var toHex = function(n) {
    var hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return '#${toHex(parsed[0])}${toHex(parsed[1])}' + (toHex(parsed[2])) + '';
}

function isValidColor(color) {
  var testElement = document.createElement('div');
  testElement.style.color = '';
  testElement.style.color = color;
  return testElement.style.color !== '';
}

function isTransparent(color) {
  return color === 'transparent' || 
         color === 'rgba(0, 0, 0, 0)' || 
         (color.indexOf('rgba') !== -1 && parseFloat(color.match(/[\d.]+\s*\)/)?.[0] || '1') === 0);
}

function normalizeColor(color) {
  if (!color || color === 'transparent') return null;
  
  var hex = rgbToHex(color);
  return hex || color;
}

async function waitForDOMReady() {
  if (document.readyState === 'loading') {
    await new Promise(resolve  { return {
      document.addEventListener('DOMContentLoaded', resolve); }
    });
  }
  return Promise.resolve();
}

function throttle(func, wait) {
  var timeout;
  return function(...args) {
    var later = function() {
      timeout = null;
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function debounce(func, wait, immediate = false) {
  var timeout;
  return function(...args) {
    var later = function() {
      timeout = null;
      if (!immediate) func(...args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}




function extractColorsFromPage() {
  var colors = new Set();
  var elements = getAllElements();
  
  elements.forEach(element  { return {
    var computedStyle = window.getComputedStyle(element); }
    
    extractColorFromProperty(computedStyle, 'color', colors);
    extractColorFromProperty(computedStyle, 'backgroundColor', colors);
    extractColorFromProperty(computedStyle, 'borderColor', colors);
    extractColorFromProperty(computedStyle, 'borderTopColor', colors);
    extractColorFromProperty(computedStyle, 'borderRightColor', colors);
    extractColorFromProperty(computedStyle, 'borderBottomColor', colors);
    extractColorFromProperty(computedStyle, 'borderLeftColor', colors);
    extractColorFromProperty(computedStyle, 'outlineColor', colors);
    extractColorFromProperty(computedStyle, 'fill', colors);
    extractColorFromProperty(computedStyle, 'stroke', colors);
    
    extractGradientColors(computedStyle.backgroundImage, colors);
    extractShadowColors(computedStyle.textShadow, colors);
    extractShadowColors(computedStyle.boxShadow, colors);
  });
  
  extractColorsFromStylesheets(colors);
  
  var colorArray = Array.from(colors)
    .filter(color  { return color && isValidColor(color))
    .map(color => ({
      value: color,
      instances: countColorInstances(color, elements)
    }))
    .sort((a, b) => b.instances - a.instances); }
  
  return colorArray;
}

function extractColorFromProperty(style, property, colors) {
  var color = style[property];
  if (color && !isTransparent(color)) {
    var normalized = normalizeColor(color);
    if (normalized) {
      colors.add(normalized);
    }
  }
}

function extractGradientColors(gradient, colors) {
  if (!gradient || gradient === 'none') return;
  
  var colorMatches = gradient.match(/(#[0-9a-f]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\))/gi);
  if (colorMatches) {
    colorMatches.forEach(color  { return {
      var normalized = normalizeColor(color); }
      if (normalized) colors.add(normalized);
    });
  }
}

function extractShadowColors(shadow, colors) {
  if (!shadow || shadow === 'none') return;
  
  var parts = shadow.split(' ');
  parts.forEach(part  { return {
    var normalized = normalizeColor(part); }
    if (normalized) colors.add(normalized);
  });
}

function extractColorsFromStylesheets(colors) {
  try {
    var sheets = Array.from(document.styleSheets);
    
    sheets.forEach(sheet  { return {
      try {
        var rules = Array.from(sheet.cssRules || sheet.rules || []); }
        
        rules.forEach(rule  { return {
          if (rule.style) {
            for (var i = 0; } i < rule.style.length; i++) {
              var property = rule.style[i];
              var value = rule.style[property];
              
              if (value && isColorProperty(property)) {
                var normalized = normalizeColor(value);
                if (normalized) colors.add(normalized);
              }
            }
          }
          
          if (rule.style && rule.style.backgroundImage) {
            extractGradientColors(rule.style.backgroundImage, colors);
          }
          
          if (rule.style && rule.style.textShadow) {
            extractShadowColors(rule.style.textShadow, colors);
          }
          
          if (rule.style && rule.style.boxShadow) {
            extractShadowColors(rule.style.boxShadow, colors);
          }
        });
      } catch (e) {
        console.warn('Could not access stylesheet:', sheet.href, e);
      }
    });
  } catch (e) {
    console.warn('Could not extract colors from stylesheets:', e);
  }
}

function isColorProperty(property) {
  var colorProperties = [
    'color', 'backgroundColor', 'borderColor', 'borderTopColor',
    'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'fill', 'stroke', 'textDecorationColor',
    'columnRuleColor', 'webkitTextFillColor', 'webkitTextStrokeColor'
  ];
  return colorProperties.indexOf(property) !== -1;
}

function countColorInstances(targetColor, elements) {
  var count = 0;
  
  elements.forEach(element  { return {
    var computedStyle = window.getComputedStyle(element); }
    
    if (colorMatches(computedStyle.color, targetColor) ||
        colorMatches(computedStyle.backgroundColor, targetColor) ||
        colorMatches(computedStyle.borderColor, targetColor)) {
      count++;
    }
  });
  
  return count;
}

function colorMatches(color1, color2) {
  var normalized1 = normalizeColor(color1);
  var normalized2 = normalizeColor(color2);
  return normalized1 === normalized2;
}

function categorizeColors(colors) {
  var categories = {
    backgrounds: [],
    text: [],
    accents: [],
    borders: [],
    shadows: [],
    links: [],
    states: {
      error: [],
      success: [],
      warning: [],
      info: []
    },
    svg: []
  };
  
  colors.forEach(color  { return {
    var category = detectColorCategory(color, colors); }
    if (category && categories[category]) {
      categories[category].push(color);
    }
  });
  
  return categories;
}

function detectColorCategory(color, allColors) {
  var { value } = color;
  
  if (isStateColor(value)) {
    return getStateColorCategory(value);
  }
  
  if (isBackgroundColor(value, allColors)) {
    return 'backgrounds';
  }
  
  if (isTextColor(value, allColors)) {
    return 'text';
  }
  
  if (isAccentColor(value)) {
    return 'accents';
  }
  
  return 'accents';
}

function isStateColor(color) {
  var states = {
    error: ['#dc3545', '#e53e3e', '#f56565'],
    success: ['#28a745', '#38a169', '#48bb78'],
    warning: ['#ffc107', '#d69e2e', '#ecc94b'],
    info: ['#17a2b8', '#3182ce', '#4299e1']
  };
  
  var hex = normalizeColor(color);
  return Object.values(states).flat().includes(hex);
}

function getStateColorCategory(color) {
  var states = {
    error: ['#dc3545', '#e53e3e', '#f56565'],
    success: ['#28a745', '#38a169', '#48bb78'],
    warning: ['#ffc107', '#d69e2e', '#ecc94b'],
    info: ['#17a2b8', '#3182ce', '#4299e1']
  };
  
  var hex = normalizeColor(color);
  
  for (var [category, colors] of Object.entries(states)) {
    if (colors.indexOf(hex) !== -1) {
      return 'states.' + (category) + '';
    }
  }
  
  return 'accents';
}

function isBackgroundColor(color, allColors) {
  var lightColors = allColors.filter(c  { return isLightColor(c.value)); }
  var darkColors = allColors.filter(c  { return isDarkColor(c.value)); }
  
  return lightColors.some(c  { return c.value === color) || darkColors.some(c => c.value === color); }
}

function isTextColor(color, allColors) {
  return !isBackgroundColor(color, allColors) && !isAccentColor(color);
}

function isAccentColor(color) {
  var accentColorKeywords = ['primary', 'accent', 'brand', 'highlight'];
  var hex = normalizeColor(color);
  
  return accentColorKeywords.some(keyword  { return color.indexOf(keyword) !== -1 || hex.indexOf(keyword) !== -1); }
}

function isLightColor(color) {
  var rgb = parseColor(color);
  if (!rgb) return false;
  
  var [r, g, b] = rgb;
  var brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 200;
}

function isDarkColor(color) {
  var rgb = parseColor(color);
  if (!rgb) return false;
  
  var [r, g, b] = rgb;
  var brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 100;
}




function extractTypographyFromPage() {
  var typography = new Map();
  var elements = getAllElements();
  
  elements.forEach(element  { return {
    if (!isTextualElement(element)) return; }
    
    var computedStyle = window.getComputedStyle(element);
    var tagName = element.tagName.toLowerCase();
    
    var key = generateTypographyKey(computedStyle, tagName);
    
    if (!typography.has(key)) {
      typography.set(key, {
        tagName: tagName,
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        lineHeight: computedStyle.lineHeight,
        letterSpacing: computedStyle.letterSpacing,
        color: normalizeColor(computedStyle.color),
        textTransform: computedStyle.textTransform,
        textDecoration: computedStyle.textDecoration,
        instances: 0,
        elements: []
      });
    }
    
    var entry = typography.get(key);
    entry.instances++;
    entry.elements.push(element);
  });
  
  return Array.from(typography.values());
}

function isTextualElement(element) {
  var textualElements = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div', 'a', 'button', 'label',
    'li', 'td', 'th', 'blockquote', 'cite',
    'figcaption', 'small', 'strong', 'em', 'b', 'i'
  ];
  
  var tagName = element.tagName.toLowerCase();
  var hasTextContent = element.textContent && element.textContent.trim().length > 0;
  
  return textualElements.indexOf(tagName) !== -1 && hasTextContent;
}

function generateTypographyKey(computedStyle, tagName) {
  var fontFamily = computedStyle.fontFamily;
  var fontSize = computedStyle.fontSize;
  var fontWeight = computedStyle.fontWeight;
  var lineHeight = computedStyle.lineHeight;
  var letterSpacing = computedStyle.letterSpacing;
  var color = normalizeColor(computedStyle.color);
  var textTransform = computedStyle.textTransform;
  var textDecoration = computedStyle.textDecoration;
  
  return '${tagName}|${fontFamily}|${fontSize}|${fontWeight}|${lineHeight}|${letterSpacing}|${color}|${textTransform}|' + (textDecoration) + '';
}

function categorizeTypography(typography) {
  var categories = {
    headings: {
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: []
    },
    paragraphs: [],
    links: [],
    buttons: [],
    captions: [],
    code: [],
    other: []
  };
  
  typography.forEach(item  { return {
    var category = detectTypographyCategory(item); }
    
    if (category.indexOf('headings.') === 0) {
      var level = category.split('.')[1];
      categories.headings[level].push(item);
    } else if (categories[category]) {
      categories[category].push(item);
    } else {
      categories.other.push(item);
    }
  });
  
  Object.keys(categories.headings).forEach(key  { return {
    categories.headings[key].sort((a, b) => b.instances - a.instances); }
  });
  
  Object.keys(categories).forEach(key  { return {
    if (key !== 'headings') {
      categories[key].sort((a, b) => b.instances - a.instances); }
    }
  });
  
  return categories;
}

function detectTypographyCategory(item) {
  var tagName = item.tagName;
  
  if (tagName.match(/^h[1-6]$/)) {
    return 'headings.' + (tagName) + '';
  }
  
  if (tagName === 'a' || tagName === 'button') {
    return 'links';
  }
  
  if (tagName === 'button' || (item.fontWeight === 'bold' && parseInt(item.fontSize) > 14)) {
    return 'buttons';
  }
  
  if (tagName === 'small' || parseInt(item.fontSize) < 12) {
    return 'captions';
  }
  
  if (tagName === 'code' || tagName === 'pre' || tagName === 'kbd' || tagName === 'samp') {
    return 'code';
  }
  
  if (tagName === 'p') {
    return 'paragraphs';
  }
  
  return 'other';
}

function getTypographyHierarchy(typography) {
  var sizes = typography.map(item  { return ({
    ...item,
    numericSize: parseFloat(item.fontSize)
  })).sort((a, b) => b.numericSize - a.numericSize); }
  
  return sizes;
}

function getFontStack(fontFamily) {
  return fontFamily.split(',').map(font  { return {
    return font.trim().replace(/['"]/g, ''); }
  }).filter(Boolean);
}

function getPrimaryFont(fontStack) {
  return fontStack[0] || 'system-ui';
}

function generateFontPreview(fontFamily, fontSize, fontWeight) {
  var fontStack = getFontStack(fontFamily);
  var primaryFont = getPrimaryFont(fontStack);
  
  return {
    characters: 'AaBbCcDdEeFf123',
    fontFamily: primaryFont,
    fontSize: fontSize,
    fontWeight: fontWeight
  };
}


function extractAssetsFromPage() {
  var assets = {
    images: [],
    svgs: [],
    backgrounds: []
  };
  
  extractImages(assets.images);
  extractSVGs(assets.svgs);
  extractBackgroundImages(assets.backgrounds);
  
  return assets;
}

function extractImages(imageArray) {
  var imgElements = document.querySelectorAll('img[src]');
  
  imgElements.forEach(img  { return {
    var src = img.src; }
    var alt = img.alt || '';
    
    if (isValidAssetUrl(src)) {
      imageArray.push({
        type: 'img',
        url: src,
        alt: alt,
        filename: getFilenameFromUrl(src),
        extension: getExtensionFromUrl(src),
        dimensions: {
          width: img.width,
          height: img.height
        }
      });
    }
  });
  
  var imageSources = Array.from(document.querySelectorAll('source[srcset]'));
  imageSources.forEach(source  { return {
    var srcset = source.srcset; }
    if (srcset) {
      var sources = parseSrcset(srcset);
      sources.forEach(src  { return {
        if (isValidAssetUrl(src.url)) {
          imageArray.push({
            type: 'img',
            url: src.url,
            alt: '',
            filename: getFilenameFromUrl(src.url),
            extension: getExtensionFromUrl(src.url),
            dimensions: {
              width: parseInt(src.width) || 0,
              height: 0
            },
            source: 'srcset'
          }); }
        }
      });
    }
  });
  
  return imageArray.sortfunction((a, b) {
    var scoreA = a.dimensions.width * a.dimensions.height;
    var scoreB = b.dimensions.width * b.dimensions.height;
    return scoreB - scoreA;
  });
}

function extractSVGs(svgArray) {
  var svgElements = document.querySelectorAll('svg');
  
  svgElements.forEachfunction((svg, index) {
    var svgString = svg.outerHTML;
    var bbox = svg.getBBox();
    
    svgArray.push({
      type: 'svg',
      url: createSVGDataURL(svgString),
      filename: 'svg-' + (index) + '.svg',
      extension: 'svg',
      dimensions: {
        width: bbox.width,
        height: bbox.height
      },
      content: svgString
    });
  });
  
  var objectElements = document.querySelectorAll('object[type="image/svg+xml"], object[data$=".svg"]');
  objectElements.forEachfunction((obj, index) {
    if (obj.data) {
      svgArray.push({
        type: 'svg-object',
        url: obj.data,
        filename: getFilenameFromUrl(obj.data) || 'svg-object-' + (index) + '.svg',
        extension: 'svg',
        dimensions: {
          width: obj.width || obj.offsetWidth,
          height: obj.height || obj.offsetHeight
        }
      });
    }
  });
  
  var embedElements = document.querySelectorAll('embed[type="image/svg+xml"], embed[src$=".svg"]');
  embedElements.forEachfunction((embed, index) {
    if (embed.src) {
      svgArray.push({
        type: 'svg-embed',
        url: embed.src,
        filename: getFilenameFromUrl(embed.src) || 'svg-embed-' + (index) + '.svg',
        extension: 'svg',
        dimensions: {
          width: embed.width || embed.offsetWidth,
          height: embed.height || embed.offsetHeight
        }
      });
    }
  });
  
  return svgArray;
}

function extractBackgroundImages(backgroundArray) {
  var elements = document.querySelectorAll('*');
  
  elements.forEachfunction((element, index) {
    var computedStyle = window.getComputedStyle(element);
    var backgroundImage = computedStyle.backgroundImage;
    
    if (backgroundImage && backgroundImage !== 'none') {
      var urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/i);
      if (urlMatch) {
        var url = urlMatch[1];
        
        if (isValidAssetUrl(url) && !isDataURL(url)) {
          var rect = element.getBoundingClientRect();
          
          backgroundArray.push({
            type: 'background',
            url: url,
            filename: getFilenameFromUrl(url),
            extension: getExtensionFromUrl(url),
            dimensions: {
              width: rect.width,
              height: rect.height
            },
            selector: generateElementSelector(element),
            position: computedStyle.backgroundPosition,
            size: computedStyle.backgroundSize,
            repeat: computedStyle.backgroundRepeat
          });
        }
      }
    }
  });
  
  return backgroundArray.filter((asset, index, self)  { return index === self.findIndex(a => a.url === asset.url)
  ).sortfunction((a, b) {
    var areaA = a.dimensions.width * a.dimensions.height; }
    var areaB = b.dimensions.width * b.dimensions.height;
    return areaB - areaA;
  });
}

function isValidAssetUrl(url) {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return isDataURL(url);
  }
}

function isDataURL(url) {
  return url.indexOf('data:') === 0;
}

function getFilenameFromUrl(url) {
  try {
    var pathname = new URL(url).pathname;
    return pathname.split('/').pop().split('?')[0];
  } catch (e) {
    return 'asset';
  }
}

function getExtensionFromUrl(url) {
  var filename = getFilenameFromUrl(url);
  return filename.split('.').pop().toLowerCase();
}

function parseSrcset(srcset) {
  return srcset.split(',').map(src  { return {
    var parts = src.trim().split(' '); }
    return {
      url: parts[0],
      width: parts[1] ? parts[1].replace(/\D/g, '') : null
    };
  });
}

function createSVGDataURL(svgString) {
  var encoded = encodeURIComponent(svgString);
  return 'data:image/svg+xml;utf8,' + (encoded) + '';
}

function generateElementSelector(element) {
  if (element.id) {
    return '#' + (element.id) + '';
  }
  
  if (element.className && typeof element.className === 'string') {
    var classes = element.className.trim().split(' ').filter(Boolean);
    if (classes.length > 0) {
      return '${element.tagName.toLowerCase()}.' + (classes.join('.')) + '';
    }
  }
  
  return element.tagName.toLowerCase();
}

function getAssetStats(assets) {
  var total = assets.images.length + assets.svgs.length + assets.backgrounds.length;
  
  var imageFormats = {};
  assets.images.forEach(img  { return {
    imageFormats[img.extension] = (imageFormats[img.extension] || 0) + 1; }
  });
  
  return {
    total,
    images: assets.images.length,
    svgs: assets.svgs.length,
    backgrounds: assets.backgrounds.length,
    formats: imageFormats
  };
}


// Globals
var _domExtractor = {
  initializeContentScript,
  getAllElements,
  getElementSelector,
  getContrastRatio,
  getRelativeLuminance,
  parseColor,
  rgbToHex,
  isValidColor,
  isTransparent,
  normalizeColor,
  waitForDOMReady,
  throttle,
  debounce
};

var _colorExtractor = {
  extractColorsFromPage,
  categorizeColors
};

var _typographyExtractor = {
  extractTypographyFromPage,
  categorizeTypography,
  getTypographyHierarchy,
  getFontStack,
  getPrimaryFont,
  generateFontPreview
};

var _assetExtractor = {
  extractAssetsFromPage,
  getAssetStats
};

// Main entry point
// Content Script Index - Plain ES5
// Handles all page extraction and inspect mode

(function() {
  'use strict';
  
  console.log('Code Peek content script loading...');
  
  // Initialize on load
  function init() {
    console.log('Code Peek initialized');
  }
  
  // Handle messages from side panel
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      console.log('Content received:', message.type);
      
      switch (message.type) {
        case 'EXTRACT_PAGE_DATA':
          handleExtractPageData(sendResponse);
          break;
          
        case 'EXTRACT_COLORS':
          handleExtractColors(sendResponse);
          break;
          
        case 'EXTRACT_TYPOGRAPHY':
          handleExtractTypography(sendResponse);
          break;
          
        case 'EXTRACT_ASSETS':
          handleExtractAssets(sendResponse);
          break;
          
        case 'EXTRACT_ELEMENT_STYLES':
          handleExtractElementStyles(message.payload, sendResponse);
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
          console.warn('Unknown message:', message.type);
          sendResponse({ success: false, error: 'Unknown type' });
      }
      
      return true;
    });
  }
  
  // Extract all page data
  function handleExtractPageData(sendResponse) {
    try {
      var data = {
        colors: extractAllColors(),
        typography: extractAllTypography(),
        assets: extractAllAssets()
      };
      sendResponse({ success: true, data: data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  // Extract colors
  function handleExtractColors(sendResponse) {
    try {
      var colors = extractAllColors();
      sendResponse({ success: true, data: colors });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  // Extract typography
  function handleExtractTypography(sendResponse) {
    try {
      var typography = extractAllTypography();
      sendResponse({ success: true, data: typography });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  // Extract assets
  function handleExtractAssets(sendResponse) {
    try {
      var assets = extractAllAssets();
      sendResponse({ success: true, data: assets });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  // Extract element styles
  function handleExtractElementStyles(payload, sendResponse) {
    try {
      var selector = payload.selector;
      var element = document.querySelector(selector);
      
      if (!element) {
        sendResponse({ success: false, error: 'Element not found' });
        return;
      }
      
      var computedStyle = window.getComputedStyle(element);
      var rect = element.getBoundingClientRect();
      
      var data = {
        element: {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          selector: selector
        },
        styles: {
          fontFamily: computedStyle.fontFamily,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
          lineHeight: computedStyle.lineHeight,
          letterSpacing: computedStyle.letterSpacing,
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor,
          padding: {
            top: computedStyle.paddingTop,
            right: computedStyle.paddingRight,
            bottom: computedStyle.paddingBottom,
            left: computedStyle.paddingLeft
          },
          margin: {
            top: computedStyle.marginTop,
            right: computedStyle.marginRight,
            bottom: computedStyle.marginBottom,
            left: computedStyle.marginLeft
          },
          border: {
            top: computedStyle.borderTopWidth,
            right: computedStyle.borderRightWidth,
            bottom: computedStyle.borderBottomWidth,
            left: computedStyle.borderLeftWidth
          },
          width: computedStyle.width,
          height: computedStyle.height,
          display: computedStyle.display,
          position: computedStyle.position
        },
        dimensions: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        }
      };
      
      sendResponse({ success: true, data: data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  // === Color Extraction ===
  function extractAllColors() {
    var colors = {};
    var elements = document.querySelectorAll('*');
    
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var style = window.getComputedStyle(el);
      
      var props = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];
      for (var j = 0; j < props.length; j++) {
        var color = style[props[j]];
        if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
          colors[color] = (colors[color] || 0) + 1;
        }
      }
    }
    
    var result = [];
    for (var c in colors) {
      result.push({ color: c, count: colors[c] });
    }
    
    result.sort(function(a, b) { return b.count - a.count; });
    return result.slice(0, 100);
  }
  
  // === Typography Extraction ===
  function extractAllTypography() {
    var fonts = {};
    var elements = document.querySelectorAll('*');
    
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var style = window.getComputedStyle(el);
      var key = style.fontFamily + '|' + style.fontSize + '|' + style.fontWeight;
      
      fonts[key] = (fonts[key] || 0) + 1;
    }
    
    var result = [];
    for (var f in fonts) {
      var parts = f.split('|');
      result.push({
        family: parts[0],
        size: parts[1],
        weight: parts[2],
        count: fonts[f]
      });
    }
    
    result.sort(function(a, b) { return b.count - a.count; });
    return result.slice(0, 50);
  }
  
  // === Asset Extraction ===
  function extractAllAssets() {
    var assets = [];
    
    // Images
    var images = document.querySelectorAll('img');
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (img.src) {
        assets.push({
          type: 'image',
          src: img.src,
          width: img.width || 0,
          height: img.height || 0
        });
      }
    }
    
    return assets;
  }
  
  // === Inspect Mode ===
  var inspectActive = false;
  var highlightEl = null;
  var infoEl = null;
  
  function startInspectMode() {
    console.log('Starting inspect mode...');
    inspectActive = true;
    
    document.addEventListener('mousemove', handleInspectMouseMove, true);
    document.addEventListener('click', handleInspectClick, true);
    
    document.body.classList.add('code-peek-inspecting');
  }
  
  function stopInspectMode() {
    console.log('Stopping inspect mode...');
    inspectActive = false;
    
    document.removeEventListener('mousemove', handleInspectMouseMove, true);
    document.removeEventListener('click', handleInspectClick, true);
    
    removeHighlight();
    document.body.classList.remove('code-peek-inspecting');
  }
  
  function handleInspectMouseMove(event) {
    if (!inspectActive) return;
    
    var element = event.target;
    if (element === document.body || element === document.documentElement) return;
    
    showHighlight(element);
  }
  
  function handleInspectClick(event) {
    if (!inspectActive) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    var element = event.target;
    if (element === document.body || element === document.documentElement) return;
    
    inspectElement(element);
  }
  
  function showHighlight(element) {
    removeHighlight();
    
    var rect = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    
    // Create highlight box
    highlightEl = document.createElement('div');
    highlightEl.id = 'code-peek-highlight';
    highlightEl.style.cssText = 'position:fixed;' +
      'top:' + rect.top + 'px;' +
      'left:' + rect.left + 'px;' +
      'width:' + rect.width + 'px;' +
      'height:' + rect.height + 'px;' +
      'border:2px solid #3b82f6;' +
      'background:rgba(59,130,246,0.1);' +
      'pointer-events:none;' +
      'z-index:999999;';
    
    document.body.appendChild(highlightEl);
    
    // Create info tooltip
    infoEl = document.createElement('div');
    infoEl.id = 'code-peek-info';
    infoEl.style.cssText = 'position:fixed;' +
      'top:' + (rect.top - 30) + 'px;' +
      'left:' + rect.left + 'px;' +
      'background:#1f2937;' +
      'color:#fff;' +
      'padding:4px 8px;' +
      'border-radius:4px;' +
      'font-size:12px;' +
      'font-family:monospace;' +
      'pointer-events:none;' +
      'z-index:1000000;' +
      'white-space:nowrap;';
    
    var tagName = element.tagName.toLowerCase();
    var className = element.className ? '.' + element.className.split(' ').join('.') : '';
    infoEl.textContent = tagName + className + ' ' + Math.round(rect.width) + 'x' + Math.round(rect.height);
    
    document.body.appendChild(infoEl);
  }
  
  function removeHighlight() {
    if (highlightEl) {
      highlightEl.remove();
      highlightEl = null;
    }
    if (infoEl) {
      infoEl.remove();
      infoEl = null;
    }
  }
  
  function inspectElement(element) {
    var selector = getSelector(element);
    var computedStyle = window.getComputedStyle(element);
    var rect = element.getBoundingClientRect();
    
    var data = {
      element: {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        selector: selector
      },
      styles: {
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        padding: {
          top: computedStyle.paddingTop,
          right: computedStyle.paddingRight,
          bottom: computedStyle.paddingBottom,
          left: computedStyle.paddingLeft
        },
        margin: {
          top: computedStyle.marginTop,
          right: computedStyle.marginRight,
          bottom: computedStyle.marginBottom,
          left: computedStyle.marginLeft
        },
        border: {
          top: computedStyle.borderTopWidth,
          right: computedStyle.borderRightWidth,
          bottom: computedStyle.borderBottomWidth,
          left: computedStyle.borderLeftWidth
        },
        width: computedStyle.width,
        height: computedStyle.height,
        display: computedStyle.display
      },
      dimensions: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      }
    };
    
    // Send to side panel
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'ELEMENT_INSPECTED',
        payload: data
      });
    }
    
    // Stop inspect mode after selection
    stopInspectMode();
  }
  
  function getSelector(element) {
    if (element.id) {
      return '#' + element.id;
    }
    
    if (element.className && typeof element.className === 'string') {
      var classes = element.className.trim().split(' ').filter(Boolean);
      if (classes.length > 0) {
        return element.tagName.toLowerCase() + '.' + classes.join('.');
      }
    }
    
    return element.tagName.toLowerCase();
  }
  
  // Initialize
  init();
  
})();


console.log('✅ Code Peek content script bundle loaded');
