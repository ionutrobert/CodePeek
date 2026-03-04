export function initializeContentScript() {
  console.log('Initializing Code Peek content script...');
  return Promise.resolve();
}

export function getAllElements() {
  return document.querySelectorAll('*');
}

export function getElementSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.trim().split(' ').filter(Boolean);
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
    }
  }
  
  return element.tagName.toLowerCase();
}

export function getContrastRatio(color1, color2) {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

export function getRelativeLuminance(color) {
  const rgb = parseColor(color);
  if (!rgb) return 0;
  
  const sRGB = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

export function parseColor(color) {
  if (!color || color === 'transparent' || color === 'inherit' || color === 'initial') {
    return null;
  }
  
  const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
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
  
  const rgbMatch = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map(s => s.trim());
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

export function rgbToHex(rgb) {
  const parsed = parseColor(rgb);
  if (!parsed) return null;
  
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(parsed[0])}${toHex(parsed[1])}${toHex(parsed[2])}`;
}

export function isValidColor(color) {
  const testElement = document.createElement('div');
  testElement.style.color = '';
  testElement.style.color = color;
  return testElement.style.color !== '';
}

export function isTransparent(color) {
  return color === 'transparent' || 
         color === 'rgba(0, 0, 0, 0)' || 
         (color.includes('rgba') && parseFloat(color.match(/[\d.]+\s*\)/)?.[0] || '1') === 0);
}

export function normalizeColor(color) {
  if (!color || color === 'transparent') return null;
  
  const hex = rgbToHex(color);
  return hex || color;
}

export async function waitForDOMReady() {
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }
  return Promise.resolve();
}

export function throttle(func, wait) {
  let timeout;
  return (...args) => {
    const later = () => {
      timeout = null;
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function debounce(func, wait, immediate = false) {
  let timeout;
  return (...args) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}
