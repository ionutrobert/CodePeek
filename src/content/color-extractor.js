import { getAllElements, normalizeColor, isTransparent, isValidColor } from './dom-extractor.js';

export function extractColorsFromPage() {
  const colors = new Set();
  const elements = getAllElements();
  
  elements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    
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
  
  const colorArray = Array.from(colors)
    .filter(color => color && isValidColor(color))
    .map(color => ({
      value: color,
      instances: countColorInstances(color, elements)
    }))
    .sort((a, b) => b.instances - a.instances);
  
  return colorArray;
}

function extractColorFromProperty(style, property, colors) {
  const color = style[property];
  if (color && !isTransparent(color)) {
    const normalized = normalizeColor(color);
    if (normalized) {
      colors.add(normalized);
    }
  }
}

function extractGradientColors(gradient, colors) {
  if (!gradient || gradient === 'none') return;
  
  const colorMatches = gradient.match(/(#[0-9a-f]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\))/gi);
  if (colorMatches) {
    colorMatches.forEach(color => {
      const normalized = normalizeColor(color);
      if (normalized) colors.add(normalized);
    });
  }
}

function extractShadowColors(shadow, colors) {
  if (!shadow || shadow === 'none') return;
  
  const parts = shadow.split(' ');
  parts.forEach(part => {
    const normalized = normalizeColor(part);
    if (normalized) colors.add(normalized);
  });
}

function extractColorsFromStylesheets(colors) {
  try {
    const sheets = Array.from(document.styleSheets);
    
    sheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        
        rules.forEach(rule => {
          if (rule.style) {
            for (let i = 0; i < rule.style.length; i++) {
              const property = rule.style[i];
              const value = rule.style[property];
              
              if (value && isColorProperty(property)) {
                const normalized = normalizeColor(value);
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
  const colorProperties = [
    'color', 'backgroundColor', 'borderColor', 'borderTopColor',
    'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'fill', 'stroke', 'textDecorationColor',
    'columnRuleColor', 'webkitTextFillColor', 'webkitTextStrokeColor'
  ];
  return colorProperties.includes(property);
}

function countColorInstances(targetColor, elements) {
  let count = 0;
  
  elements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    
    if (colorMatches(computedStyle.color, targetColor) ||
        colorMatches(computedStyle.backgroundColor, targetColor) ||
        colorMatches(computedStyle.borderColor, targetColor)) {
      count++;
    }
  });
  
  return count;
}

function colorMatches(color1, color2) {
  const normalized1 = normalizeColor(color1);
  const normalized2 = normalizeColor(color2);
  return normalized1 === normalized2;
}

export function categorizeColors(colors) {
  const categories = {
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
  
  colors.forEach(color => {
    const category = detectColorCategory(color, colors);
    if (category && categories[category]) {
      categories[category].push(color);
    }
  });
  
  return categories;
}

function detectColorCategory(color, allColors) {
  const { value } = color;
  
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
  const states = {
    error: ['#dc3545', '#e53e3e', '#f56565'],
    success: ['#28a745', '#38a169', '#48bb78'],
    warning: ['#ffc107', '#d69e2e', '#ecc94b'],
    info: ['#17a2b8', '#3182ce', '#4299e1']
  };
  
  const hex = normalizeColor(color);
  return Object.values(states).flat().includes(hex);
}

function getStateColorCategory(color) {
  const states = {
    error: ['#dc3545', '#e53e3e', '#f56565'],
    success: ['#28a745', '#38a169', '#48bb78'],
    warning: ['#ffc107', '#d69e2e', '#ecc94b'],
    info: ['#17a2b8', '#3182ce', '#4299e1']
  };
  
  const hex = normalizeColor(color);
  
  for (const [category, colors] of Object.entries(states)) {
    if (colors.includes(hex)) {
      return `states.${category}`;
    }
  }
  
  return 'accents';
}

function isBackgroundColor(color, allColors) {
  const lightColors = allColors.filter(c => isLightColor(c.value));
  const darkColors = allColors.filter(c => isDarkColor(c.value));
  
  return lightColors.some(c => c.value === color) || darkColors.some(c => c.value === color);
}

function isTextColor(color, allColors) {
  return !isBackgroundColor(color, allColors) && !isAccentColor(color);
}

function isAccentColor(color) {
  const accentColorKeywords = ['primary', 'accent', 'brand', 'highlight'];
  const hex = normalizeColor(color);
  
  return accentColorKeywords.some(keyword => color.includes(keyword) || hex.includes(keyword));
}

function isLightColor(color) {
  const rgb = parseColor(color);
  if (!rgb) return false;
  
  const [r, g, b] = rgb;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 200;
}

function isDarkColor(color) {
  const rgb = parseColor(color);
  if (!rgb) return false;
  
  const [r, g, b] = rgb;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 100;
}
