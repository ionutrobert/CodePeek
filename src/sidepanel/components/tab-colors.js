// Colors Tab - Nothing Design System
var colorsTab = {
  selectedColor: null,

  isCuloriAvailable: function () {
    return typeof culori !== "undefined" && culori && culori.parse;
  },

  colorToHex: function (color) {
    if (!color || typeof color !== "string") return null;

    if (this.isCuloriAvailable()) {
      try {
        var parsed = culori.parse(color);
        if (parsed) {
          var rgb = culori.rgb(parsed);
          if (rgb && typeof rgb.r === "number" && typeof rgb.g === "number" && typeof rgb.b === "number") {
            var r = Math.round(rgb.r * 255);
            var g = Math.round(rgb.g * 255);
            var b = Math.round(rgb.b * 255);
            var hexR = r.toString(16);
            var hexG = g.toString(16);
            var hexB = b.toString(16);
            if (hexR.length < 2) hexR = "0" + hexR;
            if (hexG.length < 2) hexG = "0" + hexG;
            if (hexB.length < 2) hexB = "0" + hexB;
            return "#" + hexR + hexG + hexB;
          }
        }
      } catch (e) {}
    }

    var raw = color.trim();
    if (raw.startsWith("#")) {
      if (raw.length === 4) {
        return "#" + raw[1] + raw[1] + raw[2] + raw[2] + raw[3] + raw[3];
      }
      return raw.toLowerCase();
    }

    var rgbMatch = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      var r = parseInt(rgbMatch[1], 10);
      var g = parseInt(rgbMatch[2], 10);
      var b = parseInt(rgbMatch[3], 10);
      var hexR = r.toString(16);
      var hexG = g.toString(16);
      var hexB = b.toString(16);
      if (hexR.length < 2) hexR = "0" + hexR;
      if (hexG.length < 2) hexG = "0" + hexG;
      if (hexB.length < 2) hexB = "0" + hexB;
      return "#" + hexR + hexG + hexB;
    }

    return null;
  },

  normalizeColor: function (color) {
    if (!color) return { hex: null, display: "unknown", raw: color };
    var raw = color.trim();
    var hex = this.colorToHex(color);
    if (hex) {
      return { hex: hex, display: hex, raw: raw };
    }
    return { hex: null, display: raw, raw: raw };
  },

  render: function (data) {
    var self = this;
    var container = document.getElementById("tab-colors");
    if (!container) {
      console.error("[Colors Tab] No container found");
      return;
    }

    if (!document.getElementById("colors-subtab-container")) {
      var html = '<div class="tab-content">';

      // Page Header
      html += '<div class="page-header">';
      html += '<div class="page-title">COLORS</div>';
      html += '<div class="page-subtitle">Palette Analysis</div>';
      html += "</div>";

      // Subtabs
      html += '<div id="colors-subtab-container">';
      html += '<div class="subtabs">';
      html += '<button class="subtab-btn active" data-subtab="all">ALL</button>';
      html += '<button class="subtab-btn" data-subtab="categories">CATEGORIES</button>';
      html += "</div>";
      html += '<div id="colors-subtab-all"><div id="colors-grid"></div></div>';
      html += '<div id="colors-subtab-categories" class="hidden"><div id="color-categories"></div></div>';
      html += "</div>";

      // Palette Generator
      html += '<div id="color-harmonies" class="harmonies-section"></div>';

      html += "</div>";
      container.innerHTML = html;

      document.querySelectorAll(".subtab-btn").forEach(function (btn) {
        btn.onclick = function () {
          document.querySelectorAll(".subtab-btn").forEach(function (b) {
            b.classList.remove("active");
          });
          this.classList.add("active");
          if (typeof CodePeekApp !== "undefined") CodePeekApp.switchColorSubtab(this.dataset.subtab);
        };
      });
    }

    try {
      this.renderAll(data.colors || []);
      this.renderCategories(data.colors || []);
    } catch (e) {
      console.error("[Colors Tab] Error rendering:", e);
    }

    setTimeout(function () {
      var swatches = document.querySelectorAll("#colors-grid [data-color]");
      swatches.forEach(function (swatch) {
        swatch.onclick = function () {
          var hex = this.getAttribute("data-color");
          swatches.forEach(function (s) {
            s.classList.remove("selected");
          });
          this.classList.add("selected");
          self.selectedColor = hex;
          try {
            self.renderHarmonies(hex);
          } catch (e) {
            console.error("[Colors Tab] Error rendering harmonies:", e);
          }
        };
      });
    }, 50);
  },

  renderAll: function (colors) {
    var grid = document.getElementById("colors-grid");
    if (!grid) return;

    if (!colors || colors.length === 0) {
      grid.innerHTML = '<div class="empty-label">NO COLORS FOUND</div>';
      return;
    }

    var uniqueColors = [];
    var seenHexes = {};
    for (var i = 0; i < colors.length; i++) {
      var rawColor = colors[i].color;
      var colorObj = this.normalizeColor(rawColor);
      var dedupKey = colorObj.hex || colorObj.display;
      if (seenHexes[dedupKey]) continue;
      seenHexes[dedupKey] = true;
      uniqueColors.push(colorObj);
    }

    var html = '<div class="color-grid-full">';
    for (var i = 0; i < uniqueColors.length; i++) {
      var colorObj = uniqueColors[i];
      var bgColor = colorObj.hex || colorObj.raw;
      var displayValue = colorObj.display;

      html += '<div class="color-item" data-color="' + bgColor + '">';
      html += '<div class="color-swatch-large" style="background-color:' + bgColor + '"></div>';
      html += '<div class="color-info">';
      html += '<span class="color-hex">' + displayValue + "</span>";
      html += '<button class="copy-btn" data-hex="' + bgColor + '" title="Copy">';
      html += '<svg class="copy-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      html += "</button>";
      html += "</div>";
      html += "</div>";
    }
    html += "</div>";
    grid.innerHTML = html;

    setTimeout(function () {
      var copyBtns = grid.querySelectorAll(".copy-btn");
      for (var j = 0; j < copyBtns.length; j++) {
        copyBtns[j].onclick = function (e) {
          e.stopPropagation();
          var hex = this.getAttribute("data-hex");
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(hex);
          } else {
            var textarea = document.createElement("textarea");
            textarea.value = hex;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
          }
          this.classList.add("copied");
          var btn = this;
          setTimeout(function () {
            btn.classList.remove("copied");
          }, 1500);
        };
      }
    }, 50);
  },

  generateHarmonies: function (hex) {
    var rgb = this.hexToRgb(hex);
    if (!rgb) return {};
    var hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    var h = hsl.h,
      s = hsl.s,
      l = hsl.l;
    var isGrayscale = s < 10;

    if (isGrayscale) {
      var tints = [];
      var shades = [];
      if (l < 20) {
        for (var i = 1; i <= 5; i++) {
          tints.push(this.hslToHex(h, s, Math.min(100, l + i * 15)));
        }
        return { original: hex, isGrayscale: true, tints: tints, shades: [] };
      } else if (l > 80) {
        for (var i = 1; i <= 5; i++) {
          shades.push(this.hslToHex(h, s, Math.max(0, l - i * 15)));
        }
        return { original: hex, isGrayscale: true, tints: [], shades: shades };
      } else {
        for (var i = 1; i <= 5; i++) {
          tints.push(this.hslToHex(h, s, Math.min(100, l + i * 12)));
          shades.push(this.hslToHex(h, s, Math.max(0, l - i * 12)));
        }
        return { original: hex, isGrayscale: true, tints: tints, shades: shades };
      }
    }

    function clamp(x) {
      return Math.max(0, Math.min(360, x));
    }

    return {
      original: hex,
      isGrayscale: false,
      complementary: this.hslToHex(clamp(h + 180), s, l),
      analogous: [this.hslToHex(clamp(h + 30), s, l), this.hslToHex(clamp(h - 30), s, l)],
      triadic: [this.hslToHex(clamp(h + 120), s, l), this.hslToHex(clamp(h - 120), s, l)],
      tetradic: [this.hslToHex(clamp(h + 90), s, l), this.hslToHex(clamp(h + 180), s, l), this.hslToHex(clamp(h + 270), s, l)],
    };
  },

  renderHarmonies: function (hex) {
    var container = document.getElementById("color-harmonies");
    if (!container) return;
    var schemes = this.generateHarmonies(hex);
    var html = '<div class="section-label">PALETTE GENERATOR</div>';
    html += '<div class="harmonies-grid">';

    if (schemes.isGrayscale) {
      html += this.renderScheme("TINTS", schemes.tints);
      html += this.renderScheme("SHADES", schemes.shades);
    } else {
      html += this.renderScheme("COMPLEMENTARY", [schemes.original, schemes.complementary]);
      html += this.renderScheme("ANALOGOUS", schemes.analogous);
      html += this.renderScheme("TRIADIC", schemes.triadic);
      html += this.renderScheme("TETRADIC", schemes.tetradic);
    }

    html += "</div>";
    container.innerHTML = html;

    setTimeout(function () {
      var copyBtns = container.querySelectorAll(".copy-btn");
      for (var i = 0; i < copyBtns.length; i++) {
        copyBtns[i].onclick = function () {
          var hexVal = this.getAttribute("data-hex");
          if (navigator.clipboard) {
            navigator.clipboard.writeText(hexVal);
          }
          this.classList.add("copied");
          var btn = this;
          setTimeout(function () {
            btn.classList.remove("copied");
          }, 1500);
        };
      }
    }, 50);
  },

  renderScheme: function (title, colorsArr) {
    var html = '<div class="scheme-item">';
    html += '<div class="scheme-label">' + title + "</div>";
    html += '<div class="scheme-colors">';
    colorsArr.forEach(function (c) {
      html += '<div class="scheme-color">';
      html += '<div class="scheme-swatch" style="background-color:' + c + '"></div>';
      html += '<div class="scheme-info">';
      html += '<span class="scheme-hex">' + c + "</span>";
      html += '<button class="copy-btn" data-hex="' + c + '" title="Copy">';
      html += '<svg class="copy-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      html += "</button>";
      html += "</div>";
      html += "</div>";
    });
    html += "</div></div>";
    return html;
  },

  hexToRgb: function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  rgbToHsl: function (r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  },

  hslToHex: function (h, s, l) {
    s /= 100;
    l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2;
    var r = 0,
      g = 0,
      b = 0;
    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (300 <= h && h < 360) {
      r = c;
      g = 0;
      b = x;
    }
    var hexR = Math.round((r + m) * 255).toString(16);
    var hexG = Math.round((g + m) * 255).toString(16);
    var hexB = Math.round((b + m) * 255).toString(16);
    if (hexR.length < 2) hexR = "0" + hexR;
    if (hexG.length < 2) hexG = "0" + hexG;
    if (hexB.length < 2) hexB = "0" + hexB;
    return "#" + hexR + hexG + hexB;
  },

  renderCategories: function (colors) {
    var container = document.getElementById("color-categories");
    if (!container) return;

    var brands = [];
    var grays = [];
    var seenHexes = {};

    for (var i = 0; i < colors.length; i++) {
      var rawColor = colors[i].color;
      var c = this.normalizeColor(rawColor);
      if (!c || !c.display) continue;
      var dedupKey = c.hex || c.display;
      if (seenHexes[dedupKey]) continue;
      seenHexes[dedupKey] = true;
      var bgColor = c.hex || c.raw;
      if (this.isGray(bgColor)) grays.push({ raw: bgColor, hex: c.display });
      else brands.push({ raw: bgColor, hex: c.display });
    }

    var html = '<div class="categories-section">';

    html += '<div class="category-group">';
    html += '<div class="section-label">BRAND COLORS</div>';
    html += '<div class="category-grid">';
    for (var i = 0; i < brands.length; i++) {
      var item = brands[i];
      html += '<div class="category-item">';
      html += '<div class="category-swatch" style="background-color:' + item.raw + '"></div>';
      html += '<div class="category-hex">' + item.hex + "</div>";
      html += "</div>";
    }
    if (brands.length === 0) html += '<div class="empty-label">NONE DETECTED</div>';
    html += "</div></div>";

    html += '<div class="category-group">';
    html += '<div class="section-label">NEUTRALS</div>';
    html += '<div class="category-grid">';
    for (var i = 0; i < grays.length; i++) {
      var item = grays[i];
      html += '<div class="category-item">';
      html += '<div class="category-swatch" style="background-color:' + item.raw + '"></div>';
      html += '<div class="category-hex">' + item.hex + "</div>";
      html += "</div>";
    }
    if (grays.length === 0) html += '<div class="empty-label">NONE DETECTED</div>';
    html += "</div></div>";

    html += "</div>";
    container.innerHTML = html;
  },

  isGray: function (color) {
    var rgb, match, diff;
    if (color.startsWith("#")) {
      rgb = this.hexToRgb(color);
      if (rgb) {
        diff = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
        return diff < 20;
      }
    }
    match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      var r = parseInt(match[1]);
      var g = parseInt(match[2]);
      var b = parseInt(match[3]);
      diff = Math.max(r, g, b) - Math.min(r, g, b);
      return diff < 20;
    }
    return false;
  },
};
