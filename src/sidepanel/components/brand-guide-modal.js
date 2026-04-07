// Brand Guide Modal - Nothing Design
var brandGuideModal = (function () {
  var overlayEl = null;
  var modalEl = null;
  var colorBodyEl = null;
  var typographyBodyEl = null;
  var logoBodyEl = null;
  var closeButtonEl = null;
  var exportButtonEls = [];
  var isVisible = false;
  var previousActiveElement = null;
  var logoRequestId = 0;
  var brandGuideState = {
    colors: [],
    typography: [],
    logo: null,
  };

  var exportButtons = ['Export CSS Variables', 'Export Tailwind Config', 'Export JSON', 'Export PNG Palette'];

  var colorRolePatterns = {
    primary: ['primary', 'main', 'brand', 'accent', 'theme'],
    secondary: ['secondary', 'muted', 'subtle', 'light'],
    background: ['bg', 'background', 'surface', 'base', 'canvas'],
    text: ['text', 'foreground', 'fg', 'font', 'copy'],
    border: ['border', 'outline', 'stroke', 'divider'],
    success: ['success', 'positive', 'valid', 'correct', 'safe'],
    error: ['error', 'danger', 'invalid', 'alert', 'wrong'],
    warning: ['warning', 'caution', 'attention', 'notice'],
    info: ['info', 'information', 'notice', 'help']
  };

  var detectColorRole = function(colorEntry) {
    var name = '';
    var selector = '';
    var searchText = '';
    var role = '';
    var patterns = [];
    var i = 0;

    if (typeof colorEntry === 'object' && colorEntry !== null) {
      name = (colorEntry.name || colorEntry.label || colorEntry.selector || '').toLowerCase();
      selector = (colorEntry.selector || colorEntry.property || '').toLowerCase();
    }

    searchText = name + ' ' + selector;

    for (role in colorRolePatterns) {
      if (colorRolePatterns.hasOwnProperty(role)) {
        patterns = colorRolePatterns[role];
        for (i = 0; i < patterns.length; i++) {
          if (searchText.indexOf(patterns[i]) !== -1) {
            return role.charAt(0).toUpperCase() + role.slice(1);
          }
        }
      }
    }

    return 'Accent';
  };

  var createSection = function (title, placeholder) {
    var wrapper = document.createElement('div');
    wrapper.className = 'brand-guide-section';

    var heading = document.createElement('div');
    heading.className = 'brand-guide-section-label';
    heading.textContent = title;
    wrapper.appendChild(heading);

    var body = document.createElement('div');
    body.className = 'brand-guide-panel';
    body.textContent = placeholder;
    wrapper.appendChild(body);

    return {
      wrapper: wrapper,
      body: body,
    };
  };

  var showNotification = function (title, message) {
    if (window.CodePeekApp && typeof window.CodePeekApp.showNotification === 'function') {
      window.CodePeekApp.showNotification(title, message);
      return;
    }
    if (window.console && typeof window.console.log === 'function') {
      window.console.log(title + ': ' + message);
    }
  };

  var downloadFile = function (content, filename, mimeType) {
    mimeType = mimeType || 'text/plain';
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };

  var exportCssVariables = function (colors) {
    var css = ':root {\n';
    var i, color, name, value;
    for (i = 0; i < colors.length; i++) {
      color = colors[i];
      if (typeof color === 'string') {
        value = color;
        name = 'color-' + (i + 1);
      } else {
        value = color.value || color.color || color;
        name = color.name || 'color-' + (i + 1);
      }
      name = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      css += ' --' + name + ': ' + value + ';\n';
    }
    css += '}';
    return css;
  };

  var exportTailwindConfig = function (colors, fonts) {
    var config = 'module.exports = {\n';
    config += ' theme: {\n';
    config += ' extend: {\n';
    config += ' colors: {\n';
    var i, color, name, value, escapedValue;
    for (i = 0; i < colors.length; i++) {
      color = colors[i];
      if (typeof color === 'string') {
        value = color;
        name = 'color-' + (i + 1);
      } else {
        value = color.value || color.color || color;
        name = color.name || color.label || 'color-' + (i + 1);
      }
      value = value ? String(value) : '';
      escapedValue = value.replace(/'/g, "\\'");
      name = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      config += " '" + name + "': '" + escapedValue + "'";
      if (i < colors.length - 1) { config += ','; }
      config += '\n';
    }
    config += ' },\n';
    config += ' fontFamily: {\n';
    var font, fontLabel, fontKey;
    for (i = 0; i < fonts.length; i++) {
      font = fonts[i];
      fontLabel = font && (font.family || font.name || font) ? font.family || font.name || font : '';
      if (!fontLabel) { fontLabel = 'Custom Font ' + (i + 1); }
      fontKey = font && (font.family || font.name || font) ? font.family || font.name || font : 'font-' + (i + 1);
      fontKey = fontKey.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (!fontKey) { fontKey = 'font-' + (i + 1); }
      fontLabel = fontLabel.replace(/'/g, "\\'");
      config += " '" + fontKey + "': ['" + fontLabel + "', 'sans-serif']";
      if (i < fonts.length - 1) { config += ','; }
      config += '\n';
    }
    config += ' }\n';
    config += ' }\n';
    config += ' }\n';
    config += '}';
    return config;
  };

  var exportJson = function (colors, fonts, logo) {
    var data = { colors: [], fonts: [], logo: logo || null };
    var i, color, font;
    for (i = 0; i < colors.length; i++) {
      color = colors[i];
      if (typeof color === 'string') {
        data.colors.push({ name: 'color-' + (i + 1), value: color });
      } else {
        data.colors.push({ name: color.name || 'color-' + (i + 1), value: color.value || color.color || color });
      }
    }
    for (i = 0; i < fonts.length; i++) {
      font = fonts[i];
      if (typeof font === 'string') {
        data.fonts.push({ name: font, family: font });
      } else {
        data.fonts.push({ name: font.name || font.family, family: font.family || font.name });
      }
    }
    return JSON.stringify(data, null, 2);
  };

  var exportPngPalette = function (colors, options) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var swatchWidth = 120;
    var swatchHeight = 120;
    var padding = 12;
    var cols = Math.min(colors.length, 4);
    var rows = Math.ceil(colors.length / 4);
    var showLabels = options && options.showLabels !== false;
    var showHex = options && options.showHex !== false;
    var labelHeight = showLabels || showHex ? 36 : 0;
    var i, color, x, y, hex, displayHex, role;

    canvas.width = cols * (swatchWidth + padding) + padding;
    canvas.height = rows * (swatchHeight + padding + labelHeight) + padding;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (i = 0; i < colors.length; i++) {
      color = colors[i];
      hex = '#cccccc';
      role = 'Accent';

      if (typeof color === 'string') {
        hex = color;
      } else if (color) {
        hex = color.value || color.color || color.hex || hex;
        role = color.role || detectColorRole(color);
      }

      displayHex = hex.toUpperCase();
      x = padding + (i % 4) * (swatchWidth + padding);
      y = padding + Math.floor(i / 4) * (swatchHeight + padding + labelHeight);

      ctx.fillStyle = hex;
      ctx.beginPath();
      ctx.roundRect(x, y, swatchWidth, swatchHeight, 8);
      ctx.fill();

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, swatchWidth, swatchHeight, 8);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';

      if (showLabels && role) {
        ctx.fillText(role, x + swatchWidth / 2, y + swatchHeight + 14);
      }

      if (showHex) {
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(displayHex, x + swatchWidth / 2, y + swatchHeight + (showLabels ? 28 : 14));
      }
    }

    return canvas.toDataURL('image/png');
  };

  var showPngPreviewModal = function(colors) {
    var dataUrl = exportPngPalette(colors, { showLabels: true, showHex: true });
    var overlay = document.createElement('div');
    var modal = document.createElement('div');
    var header = document.createElement('div');
    var title = document.createElement('h3');
    var closeBtn = document.createElement('button');
    var img = document.createElement('img');
    var actions = document.createElement('div');
    var copyBtn = document.createElement('button');
    var downloadBtn = document.createElement('button');

    overlay.className = 'brand-guide-preview-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    modal.className = 'brand-guide-preview-modal';

    header.className = 'brand-guide-preview-header';
    title.textContent = 'PNG Palette Preview';
    header.appendChild(title);

    closeBtn.type = 'button';
    closeBtn.className = 'brand-guide-preview-close';
    closeBtn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>';
    closeBtn.setAttribute('aria-label', 'Close preview');
    header.appendChild(closeBtn);
    modal.appendChild(header);

    img.src = dataUrl;
    img.className = 'brand-guide-preview-image';
    img.alt = 'Color palette preview';
    modal.appendChild(img);

    actions.className = 'brand-guide-preview-actions';

    copyBtn.type = 'button';
    copyBtn.className = 'btn-primary';
    copyBtn.textContent = 'Copy';
    actions.appendChild(copyBtn);

    downloadBtn.type = 'button';
    downloadBtn.className = 'btn-secondary';
    downloadBtn.textContent = 'Download';
    actions.appendChild(downloadBtn);

    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(function() { overlay.classList.add('visible'); }, 10);

    var closeModal = function() {
      overlay.classList.remove('visible');
      setTimeout(function() {
        if (overlay.parentElement) { overlay.parentElement.removeChild(overlay); }
      }, 200);
    };

    closeBtn.onclick = closeModal;
    overlay.onclick = function(e) { if (e.target === overlay) { closeModal(); } };

    copyBtn.onclick = function() {
      fetch(dataUrl)
        .then(function(res) { return res.blob(); })
        .then(function(blob) {
          if (navigator.clipboard && navigator.clipboard.write) {
            var item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item])
              .then(function() { showNotification('Copied', 'PNG palette copied'); })
              .catch(function() { showNotification('Error', 'Copy failed'); });
          } else {
            showNotification('Unavailable', 'Use Download instead');
          }
        });
    };

    downloadBtn.onclick = function() {
      var link = document.createElement('a');
      link.download = 'brand-palette.png';
      link.href = dataUrl;
      link.click();
      showNotification('Downloaded', 'PNG palette saved');
      closeModal();
    };
  };

  var getColorEntry = function (entry, index) {
    var value = '';
    var label = '';
    if (typeof entry === 'string') {
      value = entry;
    } else if (entry) {
      value = entry.value || entry.hex || entry.color || entry.raw || '';
      label = entry.name || entry.label || entry.title || entry.role || '';
    }

    value = value ? String(value) : '';
    if (!value) { return null; }
    if (!label) { label = 'Color ' + (index + 1); }

    return { label: label, value: value };
  };

  var cleanFontName = function (family) {
    var raw = family ? String(family) : '';
    if (!raw) { return 'Custom font'; }
    return raw.split(',')[0].replace(/["']/g, '').trim() || 'Custom font';
  };

  var getFontEntry = function (font) {
    var primaryVariant, family, name, style, sample, weight, fontStyle;
    if (typeof font === 'string') {
      family = font;
      name = cleanFontName(font);
      style = 'Regular';
      sample = 'The quick brown fox jumps over the lazy dog';
      return { family: family, name: name, style: style, sample: sample, weight: '', fontStyle: 'normal' };
    }

    if (!font) { return null; }

    primaryVariant = font.variants && font.variants.length ? font.variants[0] : null;
    family = font.family || font.fontFamily || font.name || font.label || '';
    name = font.name || font.label || cleanFontName(family);
    style = font.style || font.variant || '';
    sample = font.sample || 'The quick brown fox jumps over the lazy dog';
    weight = font.weight || '';
    fontStyle = font.fontStyle || 'normal';

    if (primaryVariant) {
      if (!style) {
        style = [primaryVariant.weight || '', primaryVariant.size || '', primaryVariant.tag || '']
          .join(' ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
      }
      if (!weight && primaryVariant.weight) { weight = primaryVariant.weight; }
      if (primaryVariant.style) { fontStyle = primaryVariant.style; }
    }

    if (!family) { family = name; }

    return {
      family: family,
      name: name || 'Custom font',
      style: style || 'Regular',
      sample: sample,
      weight: weight,
      fontStyle: fontStyle || 'normal',
    };
  };

  var renderLogoState = function (logoData) {
    var wrapper, imageEl, metaEl, sizeEl, sourceEl;
    if (!logoBodyEl) { return; }
    logoBodyEl.innerHTML = '';

    if (!logoData || !logoData.src) {
      logoBodyEl.textContent = 'No logo detected';
      return;
    }

    wrapper = document.createElement('div');
    wrapper.className = 'brand-guide-logo-content';

    imageEl = document.createElement('img');
    imageEl.src = logoData.src;
    imageEl.alt = logoData.alt || 'Detected logo';
    imageEl.className = 'brand-guide-logo-image';
    wrapper.appendChild(imageEl);

    metaEl = document.createElement('div');
    metaEl.className = 'brand-guide-logo-meta';

    sizeEl = document.createElement('p');
    sizeEl.className = 'brand-guide-logo-size';
    sizeEl.textContent = (logoData.width || 0) + ' x ' + (logoData.height || 0) + ' px';
    metaEl.appendChild(sizeEl);

    sourceEl = document.createElement('p');
    sourceEl.className = 'brand-guide-logo-source';
    sourceEl.textContent = logoData.src;
    metaEl.appendChild(sourceEl);

    wrapper.appendChild(metaEl);
    logoBodyEl.appendChild(wrapper);
  };

  var detectLogo = function (callback) {
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query || !chrome.scripting || !chrome.scripting.executeScript) {
      callback(null);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab, url;
      if (chrome.runtime && chrome.runtime.lastError) { callback(null); return; }
      if (!tabs || !tabs[0] || !tabs[0].id) { callback(null); return; }

      tab = tabs[0];
      url = tab.url || '';
      if (!/^https?:\/\//i.test(url) && !/^file:\/\//i.test(url)) { callback(null); return; }

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: function () {
            var rootSelectors = 'header, nav, [role="banner"], .header, .nav, .navbar, .logo, #header, #nav, #logo, [class*="logo"], [id*="logo"]';
            var roots = document.querySelectorAll(rootSelectors);
            var best = null;
            var bestScore = 0;
            var rootIndex, imageIndex, svgIndex, root, images, svgs, image, svg, rect, area, score, src, svgData, serializer;

            function isVisible(element) {
              var style = window.getComputedStyle(element);
              var rect = element.getBoundingClientRect();
              return style && style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') !== 0 && rect.width > 0 && rect.height > 0;
            }

            function getLogoBonus(element) {
              var className = (element.className || '').toLowerCase();
              var id = (element.id || '').toLowerCase();
              var bonus = 0;
              if (className.indexOf('logo') !== -1 || id.indexOf('logo') !== -1) bonus += 10000;
              if (className.indexOf('brand') !== -1 || id.indexOf('brand') !== -1) bonus += 5000;
              return bonus;
            }

            for (rootIndex = 0; rootIndex < roots.length; rootIndex++) {
              root = roots[rootIndex];
              if (!isVisible(root)) continue;
              images = root.querySelectorAll('img');
              for (imageIndex = 0; imageIndex < images.length; imageIndex++) {
                image = images[imageIndex];
                if (!isVisible(image)) continue;
                src = image.currentSrc || image.src || '';
                if (!src) continue;
                rect = image.getBoundingClientRect();
                area = rect.width * rect.height;
                score = area + getLogoBonus(image);
                if (score > bestScore) {
                  bestScore = score;
                  best = { src: src, alt: image.alt || '', width: Math.round(rect.width), height: Math.round(rect.height) };
                }
              }
              svgs = root.querySelectorAll('svg');
              for (svgIndex = 0; svgIndex < svgs.length; svgIndex++) {
                svg = svgs[svgIndex];
                if (!isVisible(svg)) continue;
                rect = svg.getBoundingClientRect();
                area = rect.width * rect.height;
                if (area < 100) continue;
                score = area + getLogoBonus(svg) + 2000;
                if (score > bestScore) {
                  bestScore = score;
                  try {
                    serializer = new XMLSerializer();
                    svgData = 'data:image/svg+xml,' + encodeURIComponent(serializer.serializeToString(svg));
                    best = { src: svgData, alt: svg.getAttribute('aria-label') || svg.getAttribute('title') || 'SVG Logo', width: Math.round(rect.width), height: Math.round(rect.height) };
                  } catch (e) {}
                }
              }
            }

            if (!best) {
              var standaloneLogos = document.querySelectorAll('[class*="logo"] img, [id*="logo"] img, .logo img, #logo img');
              for (imageIndex = 0; imageIndex < standaloneLogos.length; imageIndex++) {
                image = standaloneLogos[imageIndex];
                if (!isVisible(image)) continue;
                src = image.currentSrc || image.src || '';
                if (!src) continue;
                rect = image.getBoundingClientRect();
                best = { src: src, alt: image.alt || 'Logo', width: Math.round(rect.width), height: Math.round(rect.height) };
                break;
              }
            }

            return best;
          },
        },
        function (results) {
          if (chrome.runtime && chrome.runtime.lastError) { callback(null); return; }
          if (!results || !results.length) { callback(null); return; }
          callback(results[0].result || null);
        }
      );
    });
  };

  var updateLogo = function () {
    var requestId;
    if (!logoBodyEl) return;
    requestId = logoRequestId + 1;
    logoRequestId = requestId;
    brandGuideState.logo = null;
    logoBodyEl.textContent = 'Detecting logo...';

    detectLogo(function (logoData) {
      if (requestId !== logoRequestId || !logoBodyEl) return;
      brandGuideState.logo = logoData || null;
      renderLogoState(logoData);
    });
  };

  var handleExportCss = function () {
    var colors = brandGuideState.colors || [];
    var css = exportCssVariables(colors);
    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(css)
        .then(function () { showNotification('Copied', 'CSS variables copied'); })
        .catch(function () { showNotification('Error', 'Copy failed'); });
    }
    downloadFile(css, 'brand-colors.css', 'text/css');
  };

  var handleExportTailwind = function () {
    var colors = brandGuideState.colors || [];
    var fonts = brandGuideState.typography || [];
    var config = exportTailwindConfig(colors, fonts);
    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(config)
        .then(function () { showNotification('Copied', 'Tailwind config copied'); })
        .catch(function () { showNotification('Error', 'Copy failed'); });
    }
    downloadFile(config, 'tailwind.config.js', 'text/javascript');
  };

  var handleExportJson = function () {
    var colors = brandGuideState.colors || [];
    var fonts = brandGuideState.typography || [];
    var logo = brandGuideState.logo || null;
    var json = exportJson(colors, fonts, logo);

    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(json)
        .then(function () { showNotification('Copied', 'JSON copied'); })
        .catch(function () { showNotification('Error', 'Copy failed'); });
    }

    downloadFile(json, 'brand-guide.json', 'application/json');
  };

  var handleExportPng = function () {
    var colors = brandGuideState.colors || [];
    if (!colors.length) { showNotification('No Colors', 'Add colors to export'); return; }
    showPngPreviewModal(colors);
  };

  var getExportHandler = function (label) {
    if (label === 'Export CSS Variables') return handleExportCss;
    if (label === 'Export Tailwind Config') return handleExportTailwind;
    if (label === 'Export JSON') return handleExportJson;
    return handleExportPng;
  };

  var buildModal = function () {
    overlayEl = document.createElement('div');
    overlayEl.className = 'brand-guide-modal-overlay';
    overlayEl.setAttribute('role', 'presentation');

    var dialog = document.createElement('div');
    dialog.className = 'brand-guide-modal-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('tabindex', '-1');
    modalEl = dialog;

    var header = document.createElement('div');
    header.className = 'brand-guide-modal-header';

    var titleEl = document.createElement('h2');
    titleEl.className = 'brand-guide-modal-title';
    titleEl.textContent = 'Brand Guide';
    header.appendChild(titleEl);

    closeButtonEl = document.createElement('button');
    closeButtonEl.type = 'button';
    closeButtonEl.setAttribute('aria-label', 'Close Brand Guide');
    closeButtonEl.className = 'brand-guide-modal-close';
    closeButtonEl.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>';
    header.appendChild(closeButtonEl);

    var body = document.createElement('div');
    body.className = 'brand-guide-modal-body';

    var colorSection = createSection('Color Palette', 'Color palette will display here');
    colorBodyEl = colorSection.body;
    body.appendChild(colorSection.wrapper);

    var typographySection = createSection('Typography', 'Typography will display here');
    typographyBodyEl = typographySection.body;
    body.appendChild(typographySection.wrapper);

    var logoSection = createSection('Logo', 'Logo detection will display here');
    logoSection.body.classList.add('brand-guide-panel--logo');
    logoBodyEl = logoSection.body;
    body.appendChild(logoSection.wrapper);

    var exportHeading = document.createElement('div');
    exportHeading.className = 'brand-guide-section-label';
    exportHeading.textContent = 'Export';
    body.appendChild(exportHeading);

    var exportGrid = document.createElement('div');
    exportGrid.className = 'brand-guide-export-grid';
    var gridIndex, btn;
    for (gridIndex = 0; gridIndex < exportButtons.length; gridIndex++) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'brand-guide-export-btn';
      btn.textContent = exportButtons[gridIndex];
      btn._clickHandler = getExportHandler(exportButtons[gridIndex]);
      btn.addEventListener('click', btn._clickHandler);
      exportButtonEls.push(btn);
      exportGrid.appendChild(btn);
    }
    body.appendChild(exportGrid);

    dialog.appendChild(header);
    dialog.appendChild(body);
    overlayEl.appendChild(dialog);

    overlayEl.addEventListener('click', handleOverlayClick);
    closeButtonEl.addEventListener('click', close);
    document.addEventListener('keydown', handleKeyDown);

    document.body.appendChild(overlayEl);
    previousActiveElement = document.activeElement;
    setTimeout(function () {
      overlayEl.classList.add('brand-guide-modal-visible');
      dialog.classList.add('brand-guide-modal-open');
      if (dialog.focus) { dialog.focus(); }
    }, 20);
    isVisible = true;
  };

  var handleKeyDown = function (event) {
    if (!isVisible) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
  };

  var handleOverlayClick = function (event) {
    if (event.target === overlayEl) { close(); }
  };

  var cleanup = function () {
    var buttonIndex;
    if (!overlayEl) return;
    overlayEl.removeEventListener('click', handleOverlayClick);
    if (closeButtonEl) { closeButtonEl.removeEventListener('click', close); }
    document.removeEventListener('keydown', handleKeyDown);
    if (overlayEl.parentElement) { overlayEl.parentElement.removeChild(overlayEl); }
    overlayEl = null;
    modalEl = null;
    colorBodyEl = null;
    typographyBodyEl = null;
    logoBodyEl = null;
    closeButtonEl = null;
    if (exportButtonEls.length) {
      for (buttonIndex = 0; buttonIndex < exportButtonEls.length; buttonIndex++) {
        if (exportButtonEls[buttonIndex] && exportButtonEls[buttonIndex]._clickHandler) {
          exportButtonEls[buttonIndex].removeEventListener('click', exportButtonEls[buttonIndex]._clickHandler);
          exportButtonEls[buttonIndex]._clickHandler = null;
        }
      }
    }
    exportButtonEls = [];
    isVisible = false;
    logoRequestId = logoRequestId + 1;
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') { previousActiveElement.focus(); }
    previousActiveElement = null;
  };

  var close = function () {
    if (!isVisible || !overlayEl) { cleanup(); return; }
    overlayEl.classList.remove('brand-guide-modal-visible');
    if (modalEl) { modalEl.classList.remove('brand-guide-modal-open'); }
    setTimeout(function () { cleanup(); }, 200);
  };

  var open = function (colors, typography) {
    if (isVisible) {
      updateColors(colors || []);
      updateTypography(typography || []);
      updateLogo();
      return;
    }
    buildModal();
    updateColors(colors || []);
    updateTypography(typography || []);
    updateLogo();
  };

  var updateColors = function (colors) {
    if (!colorBodyEl) return;
    brandGuideState.colors = [];
    colorBodyEl.innerHTML = '';
    if (!colors || !colors.length) {
      colorBodyEl.textContent = 'Color palette will display here';
      return;
    }
    var palette = document.createElement('div');
    palette.className = 'brand-guide-color-grid';
    var entry, value, label, role, row, swatch, meta, nameEl, roleEl, valueEl, index, colorData;
    for (index = 0; index < colors.length; index++) {
      entry = colors[index] || {};
      colorData = getColorEntry(entry, index);
      if (!colorData) continue;
      role = detectColorRole(entry);
      colorData.role = role;
      brandGuideState.colors.push(colorData);
      value = colorData.value;
      label = colorData.label;

      row = document.createElement('div');
      row.className = 'brand-guide-color-row';

      swatch = document.createElement('span');
      swatch.className = 'brand-guide-color-swatch';
      swatch.style.backgroundColor = value;
      row.appendChild(swatch);

      meta = document.createElement('div');
      meta.className = 'brand-guide-color-meta';

      nameEl = document.createElement('span');
      nameEl.className = 'brand-guide-color-name';
      nameEl.textContent = label;

      roleEl = document.createElement('span');
      roleEl.className = 'brand-guide-color-role';
      roleEl.textContent = role;

      valueEl = document.createElement('span');
      valueEl.className = 'brand-guide-color-value';
      valueEl.textContent = value;

      meta.appendChild(nameEl);
      meta.appendChild(roleEl);
      meta.appendChild(valueEl);
      row.appendChild(meta);

      palette.appendChild(row);
    }
    if (!palette.childElementCount) {
      colorBodyEl.textContent = 'Color palette will display here';
      return;
    }
    colorBodyEl.appendChild(palette);
  };

  var updateTypography = function (fonts) {
    if (!typographyBodyEl) return;
    brandGuideState.typography = [];
    typographyBodyEl.innerHTML = '';
    if (!fonts || !fonts.length) {
      typographyBodyEl.textContent = 'Typography will display here';
      return;
    }
    var index, font, name, style, sample, block, header, nameEl, styleEl, sampleEl, stackEl, fontData;

    stackEl = document.createElement('div');
    stackEl.className = 'brand-guide-typography-list';

    for (index = 0; index < fonts.length; index++) {
      font = fonts[index] || {};
      fontData = getFontEntry(font);
      if (!fontData) continue;
      brandGuideState.typography.push(fontData);
      name = fontData.name;
      style = fontData.style;
      sample = fontData.sample;

      block = document.createElement('div');
      block.className = 'brand-guide-typography-item';

      header = document.createElement('div');
      header.className = 'brand-guide-typography-header';

      nameEl = document.createElement('p');
      nameEl.className = 'brand-guide-typography-name';
      nameEl.textContent = name;

      styleEl = document.createElement('p');
      styleEl.className = 'brand-guide-typography-style';
      styleEl.textContent = style;

      header.appendChild(nameEl);
      header.appendChild(styleEl);

      sampleEl = document.createElement('p');
      sampleEl.className = 'brand-guide-typography-sample';
      sampleEl.textContent = sample;
      sampleEl.style.fontFamily = fontData.family;
      if (fontData.weight) { sampleEl.style.fontWeight = fontData.weight; }
      if (fontData.fontStyle) { sampleEl.style.fontStyle = fontData.fontStyle; }

      block.appendChild(header);
      block.appendChild(sampleEl);
      stackEl.appendChild(block);
    }
    if (!stackEl.childElementCount) {
      typographyBodyEl.textContent = 'Typography will display here';
      return;
    }
    typographyBodyEl.appendChild(stackEl);
  };

  return {
    open: open,
    close: close,
    updateColors: updateColors,
    updateTypography: updateTypography,
  };
})();
