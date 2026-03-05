// Colors Tab - Premium Redesign
var colorsTab = {
  selectedColor: null,

  normalizeColor: function(color) {
    if (!color) return '#000000';
    color = color.trim();
    if (color.startsWith('#')) {
      if (color.length === 4) {
        return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
      }
      return color;
    }
    var rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      var r = parseInt(rgbMatch[1], 10);
      var g = parseInt(rgbMatch[2], 10);
      var b = parseInt(rgbMatch[3], 10);
      return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    }
    return '#000000';
  },

   render: function (data) {
     var self = this;
     var container = document.getElementById("tab-colors");
     if (!container) return;

     // Add Title
     var html = '<div class="flex items-center justify-between mb-6">';
     html +=
       '<h2 class="text-xl font-black text-slate-800 dark:text-white tracking-tight">Colors</h2>';
     html += "</div>";

     // Check if subtabs exist, otherwise reset
     var subtabs = document.getElementById("colors-subtab-container");
     if (!subtabs) {
       html += '<div id="colors-subtab-container" class="space-y-4">';
       html +=
         '<div class="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">';
       html +=
         '<button class="color-subtab-button flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all bg-white dark:bg-slate-700 shadow-sm text-brand-600" data-subtab="all">All</button>';
       html +=
         '<button class="color-subtab-button flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all text-slate-400" data-subtab="categories">Cats</button>';
       html += "</div>";
       html +=
         '<div id="colors-subtab-all"><div id="colors-grid" class="mt-4"></div></div>';
       html +=
         '<div id="colors-subtab-categories" class="hidden"><div id="color-categories" class="mt-4"></div></div>';
       html += "</div>";
       container.innerHTML = html;

       // Re-bind subtab buttons
       document.querySelectorAll(".color-subtab-button").forEach(function (btn) {
         btn.onclick = function () {
           if (typeof CodePeekApp !== "undefined")
             CodePeekApp.switchColorSubtab(this.dataset.subtab);
         };
       });
     }

     // Render All Colors Grid
     this.renderAll(data.colors || []);

     // Render Categories
     this.renderCategories(data.colors || []);

     // Palette Generator Section (initially hidden, populated on click)
     if (!document.getElementById("color-harmonies")) {
       var harmSection = document.createElement("div");
       harmSection.id = "color-harmonies";
       harmSection.className = "mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500";
       container.appendChild(harmSection);
     }

      // Attach click listeners to color swatches
      setTimeout(function() {
        var swatches = document.querySelectorAll("#colors-grid .group");
        console.log('[DEBUG] Attaching swatch click handlers, count:', swatches.length);
        swatches.forEach(function(swatch) {
          swatch.onclick = function() {
            var hex = this.getAttribute('data-color');
            console.log('[DEBUG] Swatch clicked, hex:', hex);
            swatches.forEach(s => s.classList.remove('ring-2', 'ring-brand-500'));
            self.selectedColor = hex;
            self.renderHarmonies(hex);
            console.log('[DEBUG] renderHarmonies called');
          };
        });
      }, 50);
   },

  renderAll: function (colors) {
    var grid = document.getElementById("colors-grid");
    if (!grid) return;

    if (!colors || colors.length === 0) {
      grid.innerHTML =
        '<div class="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px] opacity-40">No colors found</div>';
      return;
    }

    var html =
      '<div class="grid grid-cols-5 gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-500">';
    for (var i = 0; i < colors.length; i++) {
      var rawColor = colors[i].color;
      var c = this.normalizeColor(rawColor);
      html += '<div class="group cursor-pointer" data-color="' + c + '">';
      html +=
        '<div class="aspect-square rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all group-hover:scale-110 group-hover:shadow-lg relative overflow-hidden" style="background-color:' +
        rawColor +
        '">';
      html +=
        '<div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>';
      html += "</div>";
      html +=
        '<div class="mt-2 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate text-center font-mono">' +
        c +
        "</div>";
      html += "</div>";
    }
    html += "</div>";
    grid.innerHTML = html;
  },

  // Generate color harmonies for a given hex color
  generateHarmonies: function(hex) {
    // Convert hex to HSL
    var rgb = this.hexToRgb(hex);
    if (!rgb) return {};
    var hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    var h = hsl.h, s = hsl.s, l = hsl.l;

    function clamp(x) { return Math.max(0, Math.min(360, x)); }

    return {
      original: hex,
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
    var html = '<h4 class="text-sm font-black text-slate-700 dark:text-slate-300 mb-3">Palette Generator</h4>';
    html += '<div class="grid grid-cols-2 gap-4">';

    // Helper to render scheme with copy buttons
    function renderScheme(title, colorsArr) {
      var h = '<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">';
      h += '<div class="text-[10px] font-bold text-slate-500 uppercase mb-2">' + title + '</div>';
      h += '<div class="flex gap-2">';
      colorsArr.forEach(function(c) {
        h += '<div class="flex-1 flex flex-col items-center">';
        h += '<div class="aspect-square rounded-lg shadow-sm w-full cursor-pointer group-hover:scale-105 transition-transform" style="background-color:' + c + '"></div>';
        h += '<div class="text-[9px] font-mono mt-1 truncate w-full text-center">' + c + '</div>';
        h += '<button class="copy-hex mt-1 text-[8px] text-slate-500 hover:text-brand-600 font-bold uppercase tracking-wider flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" data-hex="' + c + '">';
        h += '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
        h += 'Copy</button>';
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
    var self = this;
    setTimeout(function() {
      var copyBtns = container.querySelectorAll('.copy-hex');
      copyBtns.forEach(function(btn) {
        btn.onclick = function() {
          var hex = this.getAttribute('data-hex');
          navigator.clipboard.writeText(hex).then(function() {
            var original = btn.textContent;
            btn.textContent = 'Copied!';
            btn.classList.add('text-green-600');
            setTimeout(function() {
              btn.textContent = original;
              btn.classList.remove('text-green-600');
            }, 1500);
          }).catch(function(err) {
            console.error('Copy failed:', err);
          });
        };
      });
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
    if (0 <= h && h < 60) { r=c; g=x; b=0; }
    else if (60 <= h && h < 120) { r=x; g=c; b=0; }
    else if (120 <= h && h < 180) { r=0; g=c; b=x; }
    else if (180 <= h && h < 240) { r=0; g=x; b=c; }
    else if (240 <= h && h < 300) { r=x; g=0; b=c; }
    else if (300 <= h && h < 360) { r=c; g=0; b=x; }
    r = Math.round((r+m)*255).toString(16).padStart(2,'0');
    g = Math.round((g+m)*255).toString(16).padStart(2,'0');
    b = Math.round((b+m)*255).toString(16).padStart(2,'0');
    return '#' + r + g + b;
  },

  renderCategories: function (colors) {
    var container = document.getElementById("color-categories");
    if (!container) return;

    var brands = [];
    var grays = [];

    for (var i = 0; i < colors.length; i++) {
      var rawColor = colors[i].color;
      var c = this.normalizeColor(rawColor);
      if (this.isGray(rawColor)) grays.push({ raw: rawColor, hex: c });
      else brands.push({ raw: rawColor, hex: c });
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
      '<h4 class="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">' +
      title +
      "</h4>";
    // Wrapping grid instead of flex-nowrap overflow-x
    html += '<div class="grid grid-cols-3 gap-3">';

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var c = item.hex;
      var rawColor = item.raw;
      html +=
        '<div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm hover:border-brand-200 transition-all hover:-translate-y-1">';
      html +=
        '<div class="aspect-square rounded-xl mb-3 shadow-inner border border-black/5" style="background-color:' +
        rawColor +
        '"></div>';
      html +=
        '<div class="text-[10px] font-black text-slate-900 dark:text-white font-mono tracking-tighter uppercase mb-0.5 truncate">' +
        c +
        "</div>";
      html +=
        '<div class="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Primary</div>';
      html += "</div>";
    }

    html += "</div></div>";
    return html;
  },

  isGray: function (color) {
    var match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      var r = parseInt(match[1]),
        g = parseInt(match[2]),
        b = parseInt(match[3]);
      var diff = Math.max(r, g, b) - Math.min(r, g, b);
      return diff < 20;
    }
    return false;
  },
};
