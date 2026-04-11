// Colors Tab - Nothing Design System
var colorsTab = {
  selectedColor: null,

  isCuloriAvailable: function () {
    return typeof culori !== "undefined" && culori && culori.parse;
  },

  colorToHex: function (color) {
    var parsed, rgb, r, g, b, hexR, hexG, hexB, raw, rgbMatch;

    if (!color || typeof color !== "string") return null;

    if (this.isCuloriAvailable()) {
      try {
        parsed = culori.parse(color);
        if (parsed) {
          rgb = culori.rgb(parsed);
          if (rgb && typeof rgb.r === "number" && typeof rgb.g === "number" && typeof rgb.b === "number") {
            r = Math.round(rgb.r * 255);
            g = Math.round(rgb.g * 255);
            b = Math.round(rgb.b * 255);
            hexR = r.toString(16);
            hexG = g.toString(16);
            hexB = b.toString(16);
            if (hexR.length < 2) hexR = "0" + hexR;
            if (hexG.length < 2) hexG = "0" + hexG;
            if (hexB.length < 2) hexB = "0" + hexB;
            return "#" + hexR + hexG + hexB;
          }
        }
      } catch (e) {}
    }

    raw = color.trim();
    if (raw.startsWith("#")) {
      if (raw.length === 4) {
        return "#" + raw[1] + raw[1] + raw[2] + raw[2] + raw[3] + raw[3];
      }
      return raw.toLowerCase();
    }

    rgbMatch = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      r = parseInt(rgbMatch[1], 10);
      g = parseInt(rgbMatch[2], 10);
      b = parseInt(rgbMatch[3], 10);
      hexR = r.toString(16);
      hexG = g.toString(16);
      hexB = b.toString(16);
      if (hexR.length < 2) hexR = "0" + hexR;
      if (hexG.length < 2) hexG = "0" + hexG;
      if (hexB.length < 2) hexB = "0" + hexB;
      return "#" + hexR + hexG + hexB;
    }

    return null;
  },

  normalizeColor: function (color) {
    var raw, hex;
    if (!color) return { hex: null, display: "unknown", raw: color };
    raw = color.trim();
    hex = this.colorToHex(color);
    if (hex) {
      return { hex: hex, display: hex, raw: raw };
    }
    return { hex: null, display: raw, raw: raw };
  },

  render: function (data) {
    var self = this;
    var container = document.getElementById("colors-content");
    var html, swatches, colorSwatches, cs;

    if (!container) {
      console.error("[Colors Tab] No container found");
      return;
    }

    html = '<div class="tab-content">';

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

    html += '</div>';
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

    try {
      this.renderAll(data.colors || []);
      this.renderCategories(data.colors || []);
    } catch (e) {
      console.error("[Colors Tab] Error rendering:", e);
    }

    setTimeout(function () {
      swatches = document.querySelectorAll("#colors-grid [data-color]");
      swatches.forEach(function (swatch) {
        swatch.onclick = function () {
          swatches.forEach(function (s) {
            s.classList.remove("selected");
          });
          this.classList.add("selected");
        };
      });

      colorSwatches = document.querySelectorAll(".color-swatch-large");
      for (cs = 0; cs < colorSwatches.length; cs++) {
        colorSwatches[cs].addEventListener("keydown", function(e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.click();
          }
        });
      }
    }, 50);
  },

  renderAll: function (colors) {
    var self = this;
    var grid = document.getElementById("colors-grid");
    var uniqueColors, seenHexes, i, rawColor, colorObj, dedupKey, rgb, html;
    var bgColor, displayValue, hexElements, h, paletteBtns, p;

    if (!grid) return;

    if (!colors || colors.length === 0) {
      var emptyHtml = '<div class="empty-state-enhanced">';
      emptyHtml += '<div class="empty-state-title">NO COLORS FOUND</div>';
      emptyHtml += '<div class="empty-state-reason">This page might use:</div>';
      emptyHtml += '<ul class="empty-state-list">';
      emptyHtml += '<li>CSS-in-JS (styled-components, emotion)</li>';
      emptyHtml += '<li>Inline styles on elements</li>';
      emptyHtml += '<li>External stylesheets not yet loaded</li>';
      emptyHtml += '</ul>';
      emptyHtml += '<div class="empty-state-action">Try inspecting a specific element using the element picker.</div>';
      emptyHtml += '</div>';
      grid.innerHTML = emptyHtml;
      return;
    }

    uniqueColors = [];
    seenHexes = {};
    for (i = 0; i < colors.length; i++) {
      rawColor = colors[i].color;
      colorObj = this.normalizeColor(rawColor);
      dedupKey = colorObj.hex || colorObj.display;
      if (seenHexes[dedupKey]) continue;
      seenHexes[dedupKey] = true;

      // Calculate luminance for sorting
      if (colorObj.hex) {
        rgb = this.hexToRgb(colorObj.hex);
        if (rgb) {
          colorObj.luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        } else {
          colorObj.luminance = 128;
        }
      } else {
        colorObj.luminance = 128;
      }

      uniqueColors.push(colorObj);
    }

    // Sort by luminance (dark to light)
    uniqueColors.sort(function(a, b) {
      return a.luminance - b.luminance;
    });

    html = '<div class="color-grid-full">';
    for (i = 0; i < uniqueColors.length; i++) {
      colorObj = uniqueColors[i];
      bgColor = colorObj.hex || colorObj.raw;
      displayValue = colorObj.display;

      html += '<div class="color-card" data-color="' + bgColor + '">';
      html += '<div class="color-card-swatch" style="background-color:' + bgColor + '" role="button" tabindex="0" aria-label="Color ' + displayValue + '"></div>';
      html += '<div class="color-card-info">';
      html += '<span class="color-card-hex" data-hex="' + bgColor + '" title="Click to copy">' + displayValue + "</span>";
      html += '<button class="palette-btn" data-hex="' + bgColor + '" title="Generate Palette" aria-label="Generate palette for ' + displayValue + '">';
      html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>';
      html += "</button>";
      html += "</div>";
      html += "</div>";
    }
    html += "</div>";
    grid.innerHTML = html;

    setTimeout(function () {
      hexElements = grid.querySelectorAll(".color-card-hex");
      for (h = 0; h < hexElements.length; h++) {
        hexElements[h].onclick = function (e) {
          e.stopPropagation();
          self.copyToClipboard(this.getAttribute("data-hex"), this);
        };
      }

      paletteBtns = grid.querySelectorAll(".palette-btn");
      for (p = 0; p < paletteBtns.length; p++) {
        paletteBtns[p].onclick = function (e) {
          e.stopPropagation();
          self.openPaletteModal(this.getAttribute("data-hex"));
        };
      }
    }, 50);
  },

  copyToClipboard: function(text, element) {
    var self = this;
    var textarea;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        self.showCopyFeedback(element);
      });
    } else {
      textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      self.showCopyFeedback(element);
    }
  },

  showCopyFeedback: function(element) {
    element.classList.add("copied");
    if (typeof CodePeekApp !== "undefined" && CodePeekApp.showToast) {
      CodePeekApp.showToast("Copied!", 1500);
    }
    setTimeout(function() {
      element.classList.remove("copied");
    }, 1500);
  },

  openPaletteModal: function(hex) {
    var self = this;
    var schemes, content, modal, modalEl, copyBtns, i;

    if (typeof createModal === "undefined") {
      console.error("[Colors Tab] Modal component not available");
      return;
    }

    schemes = this.generateHarmonies(hex);
    content = '<div class="palette-modal-content">';

    // Original color display
    content += '<div class="palette-original">';
    content += '<div class="palette-original-swatch" style="background-color:' + hex + '"></div>';
    content += '<div class="palette-original-info">';
    content += '<div class="palette-original-hex">' + hex + '</div>';
    content += '</div>';
    content += '</div>';

    // Color schemes
    content += '<div class="palette-schemes">';

    if (schemes.isGrayscale) {
      if (schemes.tints && schemes.tints.length > 0) {
        content += this.renderPaletteSchemeModal("TINTS", schemes.tints);
      }
      if (schemes.shades && schemes.shades.length > 0) {
        content += this.renderPaletteSchemeModal("SHADES", schemes.shades);
      }
    } else {
      content += this.renderPaletteSchemeModal("COMPLEMENTARY", [schemes.original, schemes.complementary]);
      content += this.renderPaletteSchemeModal("ANALOGOUS", schemes.analogous);
      content += this.renderPaletteSchemeModal("TRIADIC", schemes.triadic);
      content += this.renderPaletteSchemeModal("TETRADIC", schemes.tetradic);
    }

    content += '</div>';
    content += '</div>';

    modal = createModal({
      title: 'PALETTE GENERATOR',
      content: content,
      width: '32rem'
    });

    modal.show();

    // Add click handlers for copy buttons in modal
    setTimeout(function() {
      modalEl = document.querySelector('.modal-content');
      if (!modalEl) return;

      copyBtns = modalEl.querySelectorAll('.copy-btn');
      for (i = 0; i < copyBtns.length; i++) {
        copyBtns[i].onclick = function() {
          var hexVal = this.getAttribute("data-hex");
          if (navigator.clipboard) {
            navigator.clipboard.writeText(hexVal);
          }
          this.classList.add("copied");
          if (typeof CodePeekApp !== "undefined" && CodePeekApp.showToast) {
            CodePeekApp.showToast("Copied!", 1500);
          }
          var btn = this;
          setTimeout(function() {
            btn.classList.remove("copied");
          }, 1500);
        };
      }
    }, 100);
  },

  renderPaletteSchemeModal: function(title, colorsArr) {
    var html = '<div class="palette-scheme">';
    html += '<div class="palette-scheme-label">' + title + '</div>';
    html += '<div class="palette-scheme-colors">';
    colorsArr.forEach(function(c) {
      html += '<div class="palette-scheme-color">';
      html += '<div class="palette-scheme-swatch" style="background-color:' + c + '"></div>';
      html += '<div class="palette-scheme-info">';
      html += '<span class="palette-scheme-hex">' + c + '</span>';
      html += '<button class="copy-btn" data-hex="' + c + '" title="Copy">';
      html += '<svg class="copy-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      html += '</button>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
    return html;
  },

  generateHarmonies: function (hex) {
    var rgb = this.hexToRgb(hex);
    var hsl, h, s, l, isGrayscale, tints, shades, i;
    var clamp = function(x) { return Math.max(0, Math.min(360, x)); };

    if (!rgb) return {};
    hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    h = hsl.h;
    s = hsl.s;
    l = hsl.l;
    isGrayscale = s < 10;

    if (isGrayscale) {
      tints = [];
      shades = [];
      if (l < 20) {
        for (i = 1; i <= 5; i++) {
          tints.push(this.hslToHex(h, s, Math.min(100, l + i * 15)));
        }
        return { original: hex, isGrayscale: true, tints: tints, shades: [] };
      } else if (l > 80) {
        for (i = 1; i <= 5; i++) {
          shades.push(this.hslToHex(h, s, Math.max(0, l - i * 15)));
        }
        return { original: hex, isGrayscale: true, tints: [], shades: shades };
      } else {
        for (i = 1; i <= 5; i++) {
          tints.push(this.hslToHex(h, s, Math.min(100, l + i * 12)));
          shades.push(this.hslToHex(h, s, Math.max(0, l - i * 12)));
        }
        return { original: hex, isGrayscale: true, tints: tints, shades: shades };
      }
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
    var schemes, html, copyBtns, i;

    if (!container) return;
    schemes = this.generateHarmonies(hex);
    html = '<div class="section-label">PALETTE GENERATOR</div>';
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
      copyBtns = container.querySelectorAll(".copy-btn");
      for (i = 0; i < copyBtns.length; i++) {
        copyBtns[i].onclick = function () {
          var hexVal = this.getAttribute("data-hex");
          if (navigator.clipboard) {
            navigator.clipboard.writeText(hexVal);
          }
          this.classList.add("copied");
          var btn = this;
          setTimeout(function () {
            btn.classList.remove("copied");
          }, 2500);
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
    var max, min, h, s, l, d;
    r /= 255;
    g /= 255;
    b /= 255;
    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      d = max - min;
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
    var c, x, m, r, g, b, hexR, hexG, hexB;
    s /= 100;
    l /= 100;
    c = (1 - Math.abs(2 * l - 1)) * s;
    x = c * (1 - Math.abs((h / 60) % 2 - 1));
    m = l - c / 2;
    r = 0;
    g = 0;
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
    hexR = Math.round((r + m) * 255).toString(16);
    hexG = Math.round((g + m) * 255).toString(16);
    hexB = Math.round((b + m) * 255).toString(16);
    if (hexR.length < 2) hexR = "0" + hexR;
    if (hexG.length < 2) hexG = "0" + hexG;
    if (hexB.length < 2) hexB = "0" + hexB;
    return "#" + hexR + hexG + hexB;
  },

  renderCategories: function (colors) {
    var self = this;
    var container = document.getElementById("color-categories");
    var brands, grays, seenHexes, i, rawColor, c, dedupKey, bgColor, rgb, luminance, html, bi, bItem, gi, gItem;
    var hexElements, h, paletteBtns, p;

    if (!container) return;

    brands = [];
    grays = [];
    seenHexes = {};

    for (i = 0; i < colors.length; i++) {
      rawColor = colors[i].color;
      c = this.normalizeColor(rawColor);
      if (!c || !c.display) continue;
      dedupKey = c.hex || c.display;
      if (seenHexes[dedupKey]) continue;
      seenHexes[dedupKey] = true;
      bgColor = c.hex || c.raw;
      rgb = this.hexToRgb(bgColor);
      luminance = rgb ? (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) : 128;
      if (this.isGray(bgColor)) {
        grays.push({ raw: bgColor, hex: c.display, luminance: luminance });
      } else {
        brands.push({ raw: bgColor, hex: c.display, luminance: luminance });
      }
    }

    brands.sort(function(a, b) { return a.luminance - b.luminance; });
    grays.sort(function(a, b) { return a.luminance - b.luminance; });

    html = '<div class="categories-section">';

    html += '<div class="category-group">';
    html += '<div class="section-label">BRAND COLORS</div>';
    html += '<div class="color-grid-full">';
    for (bi = 0; bi < brands.length; bi++) {
      bItem = brands[bi];
      html += '<div class="color-card">';
      html += '<div class="color-card-swatch" style="background-color:' + bItem.raw + '"></div>';
      html += '<div class="color-card-info">';
      html += '<span class="color-card-hex" data-hex="' + bItem.raw + '" title="Click to copy">' + bItem.hex + "</span>";
      html += '<button class="palette-btn" data-hex="' + bItem.raw + '" title="Generate Palette" aria-label="Generate palette for ' + bItem.hex + '">';
      html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>';
      html += "</button>";
      html += "</div>";
      html += "</div>";
    }
    if (brands.length === 0) html += '<div class="empty-label">NONE DETECTED</div>';
    html += "</div></div>";

    html += '<div class="category-group">';
    html += '<div class="section-label">NEUTRALS</div>';
    html += '<div class="color-grid-full">';
    for (gi = 0; gi < grays.length; gi++) {
      gItem = grays[gi];
      html += '<div class="color-card">';
      html += '<div class="color-card-swatch" style="background-color:' + gItem.raw + '"></div>';
      html += '<div class="color-card-info">';
      html += '<span class="color-card-hex" data-hex="' + gItem.raw + '" title="Click to copy">' + gItem.hex + "</span>";
      html += '<button class="palette-btn" data-hex="' + gItem.raw + '" title="Generate Palette" aria-label="Generate palette for ' + gItem.hex + '">';
      html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>';
      html += "</button>";
      html += "</div>";
      html += "</div>";
    }
    if (grays.length === 0) html += '<div class="empty-label">NONE DETECTED</div>';
    html += "</div></div>";

    html += "</div>";
    container.innerHTML = html;

    setTimeout(function () {
      hexElements = container.querySelectorAll(".color-card-hex");
      for (h = 0; h < hexElements.length; h++) {
        hexElements[h].onclick = function (e) {
          e.stopPropagation();
          self.copyToClipboard(this.getAttribute("data-hex"), this);
        };
      }

      paletteBtns = container.querySelectorAll(".palette-btn");
      for (p = 0; p < paletteBtns.length; p++) {
        paletteBtns[p].onclick = function (e) {
          e.stopPropagation();
          self.openPaletteModal(this.getAttribute("data-hex"));
        };
      }
    }, 50);
  },

  isGray: function (color) {
    var rgb, match, diff, r, g, b;
    if (color.startsWith("#")) {
      rgb = this.hexToRgb(color);
      if (rgb) {
        diff = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
        return diff < 20;
      }
    }
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
