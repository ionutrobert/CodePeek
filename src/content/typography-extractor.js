import { getAllElements, normalizeColor } from './dom-extractor.js';

export function extractTypographyFromPage() {
  const typography = new Map();
  const elements = getAllElements();
  
  elements.forEach(element => {
    if (!isTextualElement(element)) return;
    
    const computedStyle = window.getComputedStyle(element);
    const tagName = element.tagName.toLowerCase();
    
    const key = generateTypographyKey(computedStyle, tagName);
    
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
    
    const entry = typography.get(key);
    entry.instances++;
    entry.elements.push(element);
  });
  
  return Array.from(typography.values());
}

function isTextualElement(element) {
  const textualElements = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div', 'a', 'button', 'label',
    'li', 'td', 'th', 'blockquote', 'cite',
    'figcaption', 'small', 'strong', 'em', 'b', 'i'
  ];
  
  const tagName = element.tagName.toLowerCase();
  const hasTextContent = element.textContent && element.textContent.trim().length > 0;
  
  return textualElements.includes(tagName) && hasTextContent;
}

function generateTypographyKey(computedStyle, tagName) {
  const fontFamily = computedStyle.fontFamily;
  const fontSize = computedStyle.fontSize;
  const fontWeight = computedStyle.fontWeight;
  const lineHeight = computedStyle.lineHeight;
  const letterSpacing = computedStyle.letterSpacing;
  const color = normalizeColor(computedStyle.color);
  const textTransform = computedStyle.textTransform;
  const textDecoration = computedStyle.textDecoration;
  
  return `${tagName}|${fontFamily}|${fontSize}|${fontWeight}|${lineHeight}|${letterSpacing}|${color}|${textTransform}|${textDecoration}`;
}

export function categorizeTypography(typography) {
  const categories = {
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
  
  typography.forEach(item => {
    const category = detectTypographyCategory(item);
    
    if (category.startsWith('headings.')) {
      const level = category.split('.')[1];
      categories.headings[level].push(item);
    } else if (categories[category]) {
      categories[category].push(item);
    } else {
      categories.other.push(item);
    }
  });
  
  Object.keys(categories.headings).forEach(key => {
    categories.headings[key].sort((a, b) => b.instances - a.instances);
  });
  
  Object.keys(categories).forEach(key => {
    if (key !== 'headings') {
      categories[key].sort((a, b) => b.instances - a.instances);
    }
  });
  
  return categories;
}

function detectTypographyCategory(item) {
  const tagName = item.tagName;
  
  if (tagName.match(/^h[1-6]$/)) {
    return `headings.${tagName}`;
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

export function getTypographyHierarchy(typography) {
  const sizes = typography.map(item => ({
    ...item,
    numericSize: parseFloat(item.fontSize)
  })).sort((a, b) => b.numericSize - a.numericSize);
  
  return sizes;
}

export function getFontStack(fontFamily) {
  return fontFamily.split(',').map(font => {
    return font.trim().replace(/['"]/g, '');
  }).filter(Boolean);
}

export function getPrimaryFont(fontStack) {
  return fontStack[0] || 'system-ui';
}

export function generateFontPreview(fontFamily, fontSize, fontWeight) {
  const fontStack = getFontStack(fontFamily);
  const primaryFont = getPrimaryFont(fontStack);
  
  return {
    characters: 'AaBbCcDdEeFf123',
    fontFamily: primaryFont,
    fontSize: fontSize,
    fontWeight: fontWeight
  };
}
