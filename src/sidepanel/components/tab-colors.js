// Colors Tab - Premium Redesign with Culori support
var colorsTab = {
  selectedColor: null,
  culoriAvailable: typeof culori !== 'undefined',

  // Convert any CSS color to hex using culori library
  colorToHex: function(color) {
  if (!color || typeof color !== 'string') return null;
  
  // If culori is available, use it
  if (this.culoriAvailable && culori && culori.parse) {
  try {
  var parsed = culori.parse(color);
  if (parsed) {
  var rgb = culori.rgb(parsed);
  if (rgb && typeof rgb.r === 'number' && typeof rgb.g === 'number' && typeof rgb.b === 'number') {
  var r = Math.round(rgb.r * 255);
  var g = Math.round(rgb.g * 255);
  var b = Math.round(rgb.b * 255);
  var hexR = r.toString(16);
  var hexG = g.toString(16);
  var hexB = b.toString(16);
  if (hexR.length < 2) hexR = '0' + hexR;
  if (hexG.length < 2) hexG = '0' + hexG;
  if (hexB.length < 2) hexB = '0' + hexB;
  return '#' + hexR + hexG + hexB;
  }
  }
  } catch (e) {
  // Culori couldn't parse, fall through to manual methods
  }
  }
  
  // Fallback: manual parsing
  var raw = color.trim();
  
  // Already hex
  if (raw.startsWith('#')) {
  if (raw.length === 4) {
  return '#' + raw[1] + raw[1] + raw[2] + raw[2] + raw[3] + raw[3];
  }
  return raw.toLowerCase();
  }
  
  // Try RGB/RGBA format
  var rgbMatch = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
  var r = parseInt(rgbMatch[1], 10);
  var g = parseInt(rgbMatch[2], 10);
  var b = parseInt(rgbMatch[3], 10);
  var hexR = r.toString(16);
  var hexG = g.toString(16);
  var hexB = b.toString(16);
  if (hexR.length < 2) hexR = '0' + hexR;
  if (hexG.length < 2) hexG = '0' + hexG;
  if (hexB.length < 2) hexB = '0' + hexB;
  return '#' + hexR + hexG + hexB;
  }
  
  return null;
  },

  normalizeColor: function(color) {
  if (!color) return { hex: null, display: 'unknown', raw: color };
  var raw = color.trim();
  
  // Use culori if available
  var hex = this.colorToHex(color);
  if (hex) {
  return { hex: hex, display: hex, raw: raw };
  }
  
  // For unparseable colors, return raw as display but null hex for dedup
  return { hex: null, display: raw, raw: raw };
  },

render: function (data) {
  var self = this;
  var container = document.getElementById("tab-colors");
  if (!container) {
  console.error('[Colors Tab] No container found');
  return;
  }

  // Check if already rendered (has the container structure)
  if (!document.getElementById("colors-subtab-container")) {
  console.log('[Colors Tab] Initial render, building structure');
  // Initial render - build the full structure
  var html = '<div class="tab-content">';
  
  // Standardized Page Header
  html += '<div class="neu-page-header">';
  html += '<div class="neu-section-dot"></div>';
  html += '<div>';
  html += '<h2 class="neu-page-title">Colors</h2>';
  html += '<div class="neu-page-subtitle">Color Palette</div>';
  html += '</div>';
  html += '</div>';

  // Subtabs container
  html += '<div id="colors-subtab-container" class="space-y-4">';
  // Neumorphic pill navigation for subtabs
  html += '<div class="neu-nav-pill" style="margin-bottom: 20px;">';
  html +=
  '<button class="color-subtab-button neu-nav-pill-item active" data-subtab="all">All</button>';
  html +=
  '<button class="color-subtab-button neu-nav-pill-item" data-subtab="categories">Categories</button>';
  html += "</div>";
  html +=
  '<div id="colors-subtab-all"><div id="colors-grid" class="mt-4"></div></div>';
  html +=
  '<div id="colors-subtab-categories" class="hidden"><div id="color-categories" class="mt-4"></div></div>';
  html += '</div>'; // Close colors-subtab-container
  
  // Palette Generator Section
  html += '<div id="color-harmonies" class="neu-card-inset mt-6" style="padding: 20px; border-radius: var(--neu-radius);"></div>';
  
  html += '</div>'; // Close tab-content
  container.innerHTML = html;

  // Re-bind subtab buttons
  document.querySelectorAll(".color-subtab-button").forEach(function (btn) {
  btn.onclick = function () {
  document.querySelectorAll(".color-subtab-button").forEach(function(b) {
  b.classList.remove("active");
  });
  this.classList.add("active");
  if (typeof CodePeekApp !== "undefined")
  CodePeekApp.switchColorSubtab(this.dataset.subtab);
  };
  });
  }

  console.log('[Colors Tab] Rendering colors:', data.colors ? data.colors.length : 0);

  try {
  // Render All Colors Grid
  this.renderAll(data.colors || []);

  // Render Categories
  this.renderCategories(data.colors || []);
  } catch (e) {
  console.error('[Colors Tab] Error rendering:', e);
  }

  // Attach click listeners to color swatches
  setTimeout(function() {
  var swatches = document.querySelectorAll("#colors-grid [data-color]");
  console.log('[Colors Tab] Attaching click handlers, count:', swatches.length);
  swatches.forEach(function(swatch) {
  swatch.onclick = function() {
  var hex = this.getAttribute('data-color');
  swatches.forEach(s => {
  s.classList.remove("ring-2", "ring-brand-500");
  });
  this.classList.add("ring-2", "ring-brand-500");
  self.selectedColor = hex;
  try {
  self.renderHarmonies(hex);
  } catch (e) {
  console.error('[Colors Tab] Error rendering harmonies:', e);
  }
  };
  });
  }, 50);
  },

renderAll: function (colors) {
  var grid = document.getElementById("colors-grid");
  var i, rawColor, c, html, uniqueColors, seenHexes, colorObj;
  if (!grid) return;

  if (!colors || colors.length === 0) {
  grid.innerHTML =
  '<div class="neu-empty-state"><div class="neu-empty-state-text">No colors found</div></div>';
  return;
  }

  // Deduplicate colors by normalized hex value (use display value for dedup if hex is null)
  uniqueColors = [];
  seenHexes = {};
  seenDisplays = {};
  for (i = 0; i < colors.length; i++) {
  rawColor = colors[i].color;
  colorObj = this.normalizeColor(rawColor);
  // Use hex for dedup if available, otherwise use display value
  var dedupKey = colorObj.hex || colorObj.display;
  // Skip if already seen
  if (seenHexes[dedupKey]) continue;
  seenHexes[dedupKey] = true;
  uniqueColors.push(colorObj);
  }

  html =
  '<div class="grid grid-cols-5 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">';
  for (i = 0; i < uniqueColors.length; i++) {
  colorObj = uniqueColors[i];
  var bgColor = colorObj.hex || colorObj.raw;
  var displayValue = colorObj.display;
  
  html += '<div class="group cursor-pointer" data-color="' + bgColor + '">';
  // Color swatch - use the computed hex or raw for display
  html +=
  '<div class="aspect-square rounded-lg shadow-sm w-full cursor-pointer transition-transform hover:scale-105" style="background-color:' +
  bgColor +
  '"></div>';
  // Show display value (hex or raw color string)
  html += '<div class="mt-1.5 flex items-center justify-between gap-1">';
  html += '<div class="text-[8px] font-mono text-slate-600 truncate" title="' + colorObj.raw + '">' + displayValue + '</div>';
  html += '<button type="button" class="copy-hex shrink-0 h-5 w-5 rounded-md border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-400 transition-colors inline-flex items-center justify-center" data-hex="' + bgColor + '" title="Copy ' + bgColor + '">';
  html += '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
  html += '</button>';
  html += '</div>';
  html += "</div>";
  }
  html += "</div>";
  grid.innerHTML = html;
  
  // Attach copy handlers
  var self = this;
  setTimeout(function() {
  var copyBtns = grid.querySelectorAll('.copy-hex');
  for (var j = 0; j < copyBtns.length; j++) {
  copyBtns[j].onclick = function(e) {
  e.stopPropagation();
  var hex = this.getAttribute('data-hex');
  if (navigator.clipboard && navigator.clipboard.writeText) {
  navigator.clipboard.writeText(hex);
  } else {
  var textarea = document.createElement('textarea');
  textarea.value = hex;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  }
  // Visual feedback
  this.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
  setTimeout(function(btn) {
  btn.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
  }.bind(null, this), 1500);
  };
  }
  }, 50);
  },

  // Generate color harmonies for a given hex color
  generateHarmonies: function(hex) {
    var rgb = this.hexToRgb(hex);
    if (!rgb) return {};
    var hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    var h = hsl.h, s = hsl.s, l = hsl.l;
    var isGrayscale = s < 10;

if (isGrayscale) {
      var tints = [];
      var shades = [];
      var i;

      // For black (l=0), only show tints (lighter)
      // For white (l=100), only show shades (darker)
      // For grays in between, show both
      
      if (l < 20) {
        // Near black - only tints
        for (i = 1; i <= 5; i++) {
          var tintLightness = Math.min(100, l + (i * 15));
          tints.push(this.hslToHex(h, s, tintLightness));
        }
        return {
          original: hex,
          isGrayscale: true,
          tints: tints,
          shades: []
        };
      } else if (l > 80) {
        // Near white - only shades
        for (i = 1; i <= 5; i++) {
          var shadeLightness = Math.max(0, l - (i * 15));
          shades.push(this.hslToHex(h, s, shadeLightness));
        }
        return {
          original: hex,
          isGrayscale: true,
          tints: [],
          shades: shades
        };
      } else {
        // Middle grays - show both
        for (i = 1; i <= 5; i++) {
          var tintLightness = Math.min(100, l + (i * 12));
          tints.push(this.hslToHex(h, s, tintLightness));
        }
        for (i = 1; i <= 5; i++) {
          var shadeLightness = Math.max(0, l - (i * 12));
          shades.push(this.hslToHex(h, s, shadeLightness));
        }
        return {
          original: hex,
          isGrayscale: true,
          tints: tints,
          shades: shades
        };
      }
    }

    function clamp(x) { return Math.max(0, Math.min(360, x)); }

    return {
      original: hex,
      isGrayscale: false,
      complementary: this.hslToHex(clamp(h + 180), s, l),
      analogous: [
        this.hslToHex(clamp(h + 30), s, l),
        this.hslToHex(clamp(h - 30), s, l)
      ],
      triadic: [
        this.hslToHex(clamp(h + 120), s, l),
        this.hslToHex(clamp(h - 120), s, l)
      ],
      tetradic: [
        this.hslToHex(clamp(h + 90), s, l),
        this.hslToHex(clamp(h + 180), s, l),
        this.hslToHex(clamp(h + 270), s, l)
      ]
    };
  },

  renderHarmonies: function(hex) {
    var container = document.getElementById("color-harmonies");
    if (!container) return;
    var schemes = this.generateHarmonies(hex);
    var html = '<h4 class="text-sm font-black text-slate-900 mb-3">Palette Generator</h4>';
    html += '<div class="grid grid-cols-2 gap-4">';

    if (schemes.isGrayscale) {
      html += renderScheme('Tints (Lighter)', schemes.tints);
      html += renderScheme('Shades (Darker)', schemes.shades);
      html += '</div>';
      container.innerHTML = html;

      setTimeout(function() {
        var copyBtns = container.querySelectorAll('.copy-hex');
        for (var i = 0; i < copyBtns.length; i++) {
          copyBtns[i].onclick = function() {
            var hex = this.getAttribute('data-hex');
            copyHexValue(hex, this);
          };
        }
      }, 50);
      return;
    }

    function flashCopyButton(btn) {
      if (!btn) return;
      btn.classList.add('text-green-600', 'border-green-500', 'bg-green-50');
      setTimeout(function() {
        btn.classList.remove('text-green-600', 'border-green-500', 'bg-green-50');
      }, 1100);
    }

    function copyHexValue(hexValue, btn) {
      var app = window.CodePeekApp;

      if (app && typeof app.copyText === 'function') {
        app.copyText(hexValue);
        flashCopyButton(btn);
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hexValue).then(function() {
          flashCopyButton(btn);
          if (app && typeof app.showNotification === 'function') {
            app.showNotification('Success', 'Copied to clipboard!');
          }
        }).catch(function() {
          var textarea = document.createElement('textarea');
          textarea.value = hexValue;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            flashCopyButton(btn);
            if (app && typeof app.showNotification === 'function') {
              app.showNotification('Success', 'Copied to clipboard!');
            }
          } catch (err) {
            console.error('Copy failed:', err);
          }
          document.body.removeChild(textarea);
        });
        return;
      }

      var fallbackTextarea = document.createElement('textarea');
      fallbackTextarea.value = hexValue;
      fallbackTextarea.style.position = 'fixed';
      fallbackTextarea.style.opacity = '0';
      document.body.appendChild(fallbackTextarea);
      fallbackTextarea.select();
      try {
        document.execCommand('copy');
        flashCopyButton(btn);
        if (app && typeof app.showNotification === 'function') {
          app.showNotification('Success', 'Copied to clipboard!');
        }
      } catch (e) {
        console.error('Copy failed:', e);
      }
      document.body.removeChild(fallbackTextarea);
    }

    // Helper to render scheme with copy buttons
    function renderScheme(title, colorsArr) {
      var h = '<div class="bg-white border border-slate-200 rounded-xl p-3">';
      h += '<div class="text-[10px] font-bold text-slate-500 uppercase mb-2">' + title + '</div>';
      h += '<div class="flex gap-2">';
      colorsArr.forEach(function(c) {
        h += '<div class="flex-1 min-w-0">';
        h += '<div class="aspect-square rounded-lg shadow-sm w-full cursor-pointer transition-transform hover:scale-105" style="background-color:' + c + '"></div>';
        h += '<div class="mt-1.5 flex items-center justify-between gap-1">';
        h += '<div class="text-[9px] font-mono text-slate-600 truncate">' + c + '</div>';
        h += '<button type="button" class="copy-hex shrink-0 h-5 w-5 rounded-md border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-400 transition-colors inline-flex items-center justify-center" data-hex="' + c + '" title="Copy ' + c + '">';
        h += '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
        h += '</button>';
        h += '</div>';
        h += '</div>';
      });
      h += '</div></div>';
      return h;
    }

    html += renderScheme('Complementary', [schemes.original, schemes.complementary]);
    html += renderScheme('Analogous', schemes.analogous);
    html += renderScheme('Triadic', schemes.triadic);
    html += renderScheme('Tetradic', schemes.tetradic);

    html += '</div>';
    container.innerHTML = html;

    // Attach copy handlers
    setTimeout(function() {
      var copyBtns = container.querySelectorAll('.copy-hex');
      for (var i = 0; i < copyBtns.length; i++) {
        copyBtns[i].onclick = function() {
          var hex = this.getAttribute('data-hex');
          copyHexValue(hex, this);
        };
      }
    }, 50);
  },

  // Color conversion utilities
  hexToRgb: function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  rgbToHsl: function(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h*360, s: s*100, l: l*100 };
  },

hslToHex: function(h, s, l) {
  s /= 100; l /= 100;
  var c = (1 - Math.abs(2*l - 1)) * s;
  var x = c * (1 - Math.abs((h/60) % 2 - 1));
  var m = l - c/2;
  var r=0, g=0, b=0;
  var hexR, hexG, hexB;
  if (0 <= h && h < 60) { r=c; g=x; b=0; }
  else if (60 <= h && h < 120) { r=x; g=c; b=0; }
  else if (120 <= h && h < 180) { r=0; g=c; b=x; }
  else if (180 <= h && h < 240) { r=0; g=x; b=c; }
  else if (240 <= h && h < 300) { r=x; g=0; b=c; }
  else if (300 <= h && h < 360) { r=c; g=0; b=x; }
  hexR = Math.round((r+m)*255).toString(16);
  hexG = Math.round((g+m)*255).toString(16);
  hexB = Math.round((b+m)*255).toString(16);
  if (hexR.length < 2) hexR = '0' + hexR;
  if (hexG.length < 2) hexG = '0' + hexG;
  if (hexB.length < 2) hexB = '0' + hexB;
  return '#' + hexR + hexG + hexB;
  },

renderCategories: function (colors) {
  var container = document.getElementById("color-categories");
  if (!container) return;

  var brands = [];
  var grays = [];
  var seenHexes = {};
  var rawColor, c, i, dedupKey;

  for (i = 0; i < colors.length; i++) {
  rawColor = colors[i].color;
  c = this.normalizeColor(rawColor);
  // Skip if couldn't normalize
  if (!c || !c.display) continue;
  // Use hex for dedup if available, otherwise use display
  dedupKey = c.hex || c.display;
  // Skip duplicates
  if (seenHexes[dedupKey]) continue;
  seenHexes[dedupKey] = true;
  // Use the background color (hex if available, otherwise raw)
  var bgColor = c.hex || c.raw;
  if (this.isGray(bgColor)) grays.push({ raw: bgColor, hex: c.display });
  else brands.push({ raw: bgColor, hex: c.display });
  }

    var html =
      '<div class="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">';

    // Render sections as wrapping grids
    html += this.renderSection("Brand Colors", brands);
    html += this.renderSection("Neutrals", grays);

    html += "</div>";
    container.innerHTML = html;
  },

  renderSection: function (title, list) {
    if (list.length === 0) return "";

    var html = '<div class="color-section">';
    html +=
      '<h4 class="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">' +
      title +
      "</h4>";
    // Wrapping grid instead of flex-nowrap overflow-x
    html += '<div class="grid grid-cols-3 gap-3">';

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var c = item.hex;
      var rawColor = item.raw;
      html +=
        '<div class="bg-white border border-slate-100 rounded-2xl p-2.5 shadow-sm hover:border-brand-200 transition-all hover:-translate-y-1">';
      html +=
        '<div class="aspect-square rounded-xl mb-3 shadow-inner border border-black/5" style="background-color:' +
        rawColor +
        '"></div>';
      html +=
        '<div class="text-[10px] font-black text-slate-900 font-mono tracking-tighter uppercase mb-0.5 truncate">' +
        c +
        "</div>";
      html +=
        '<div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Primary</div>';
      html += "</div>";
    }

    html += "</div></div>";
    return html;
  },

isGray: function (color) {
  var rgb, match, r, g, b, diff;
  
  // If it's a hex color
  if (color.startsWith('#')) {
  rgb = this.hexToRgb(color);
  if (rgb) {
  diff = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
  return diff < 20;
  }
  }
  
  // If it's RGB format
  match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
  r = parseInt(match[1]);
  g = parseInt(match[2]);
  b = parseInt(match[3]);
  diff = Math.max(r, g, b) - Math.min(r, g, b);
  return diff < 20;
  }
  
  return false;
  },
};
