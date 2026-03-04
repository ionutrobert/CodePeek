// Color Picker Utility - Plain ES5
var ColorPicker = (function() {
  'use strict';

  var modal = null;
  var previewLarge = null;
  var hexInput = null;
  var rgbInput = null;
  var hslInput = null;
  var nativePicker = null;
  var contrastWhite = null;
  var contrastBlack = null;
  var currentColor = '#000000';
  
  function init() {
    modal = document.getElementById('color-picker-modal');
    if (!modal) return;
    
    previewLarge = document.getElementById('color-preview-large');
    hexInput = document.getElementById('color-hex-input');
    rgbInput = document.getElementById('color-rgb-input');
    hslInput = document.getElementById('color-hsl-input');
    nativePicker = document.getElementById('native-color-picker');
    contrastWhite = document.getElementById('contrast-white');
    contrastBlack = document.getElementById('contrast-black');
    
    bindEvents();
  }
  
  function bindEvents() {
    // Close button
    var closeBtn = document.getElementById('close-color-picker');
    if (closeBtn) {
      closeBtn.addEventListener('click', hide);
    }
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        hide();
      }
    });
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hide();
      }
    });
    
    // Native color picker change
    if (nativePicker) {
      nativePicker.addEventListener('input', function() {
        var hex = nativePicker.value;
        updateFromHex(hex);
      });
    }
    
    // Copy buttons
    var copyHex = document.getElementById('copy-hex');
    var copyRgb = document.getElementById('copy-rgb');
    var copyHsl = document.getElementById('copy-hsl');
    
    if (copyHex) copyHex.addEventListener('click', copyHexToClipboard);
    if (copyRgb) copyRgb.addEventListener('click', copyRgbToClipboard);
    if (copyHsl) copyHsl.addEventListener('click', copyHslToClipboard);
  }
  
  function show(hexColor) {
    if (!modal) return;
    
    // Ensure hex has # prefix
    if (!hexColor.startsWith('#')) {
      hexColor = '#' + hexColor;
    }
    
    // Validate hex
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
      hexColor = '#000000';
    }
    
    currentColor = hexColor;
    updateFromHex(hexColor);
    modal.classList.remove('hidden');
    
    // Focus native picker
    if (nativePicker) {
      nativePicker.value = hexColor;
    }
  }
  
  function hide() {
    if (modal) {
      modal.classList.add('hidden');
    }
  }
  
  function updateFromHex(hex) {
    currentColor = hex;
    
    // Update preview
    if (previewLarge) {
      previewLarge.style.backgroundColor = hex;
    }
    
    // Update hex input
    if (hexInput) {
      hexInput.value = hex.toUpperCase();
    }
    
    // Convert to RGB
    var rgb = hexToRgb(hex);
    if (rgb) {
      var rgbStr = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
      if (rgbInput) rgbInput.value = rgbStr;
      
      // Convert to HSL
      var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      if (hsl) {
        var hslStr = 'hsl(' + Math.round(hsl.h) + ', ' + Math.round(hsl.s) + '%, ' + Math.round(hsl.l) + '%)';
        if (hslInput) hslInput.value = hslStr;
      }
      
      // Calculate contrast ratios
      if (contrastWhite) {
        var whiteContrast = getLuminanceContrast(255, 255, 255, rgb.r, rgb.g, rgb.b);
        contrastWhite.textContent = whiteContrast.toFixed(2) + ':1';
        contrastWhite.className = 'text-xs font-mono ' + (whiteContrast >= 4.5 ? 'text-emerald-400' : 'text-yellow-400');
      }
      
      if (contrastBlack) {
        var blackContrast = getLuminanceContrast(0, 0, 0, rgb.r, rgb.g, rgb.b);
        contrastBlack.textContent = blackContrast.toFixed(2) + ':1';
        contrastBlack.className = 'text-xs font-mono ' + (blackContrast >= 4.5 ? 'text-emerald-400' : 'text-yellow-400');
      }
    }
    
    // Update native picker
    if (nativePicker) {
      nativePicker.value = hex;
    }
  }
  
  function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Handle shorthand (3 digits)
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    var num = parseInt(hex, 16);
    if (isNaN(num)) return null;
    
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }
  
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
    };
  }
  
  function getLuminance(r, g, b) {
    var a = [r, g, b].map(function(v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }
  
  function getLuminanceContrast(r1, g1, b1, r2, g2, b2) {
    var l1 = getLuminance(r1, g1, b1);
    var l2 = getLuminance(r2, g2, b2);
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  function copyHexToClipboard() {
    copyToClipboard(hexInput.value);
    showFeedback('HEX copied!');
  }
  
  function copyRgbToClipboard() {
    copyToClipboard(rgbInput.value);
    showFeedback('RGB copied!');
  }
  
  function copyHslToClipboard() {
    copyToClipboard(hslInput.value);
    showFeedback('HSL copied!');
  }
  
  function copyToClipboard(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Copy failed:', err);
    }
    document.body.removeChild(textarea);
  }
  
  function showFeedback(message) {
    var feedback = document.createElement('div');
    feedback.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-3 py-2 rounded shadow-lg text-sm z-50';
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(function() {
      feedback.remove();
    }, 2000);
  }
  
  // Public API
  return {
    init: init,
    show: show,
    hide: hide,
    updateFromHex: updateFromHex
  };
})();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ColorPicker.init);
} else {
  ColorPicker.init();
}
