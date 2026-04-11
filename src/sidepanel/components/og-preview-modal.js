// OG Preview Modal - Nothing Design System
var ogPreviewModal = (function () {
  var activeModal = null;

  var defaultPlatforms = [
    { platform: 'WhatsApp', width: 300, height: 200, safeZone: 70, displaySize: '300×200' },
    { platform: 'Slack', width: 360, height: 190, safeZone: 75, displaySize: '360×190' },
    { platform: 'Discord', width: 400, height: 209, safeZone: 80, displaySize: '400×209' },
    { platform: 'Twitter/X', width: 1200, height: 600, safeZone: 80, displaySize: '1200×600' },
    { platform: 'Facebook', width: 1200, height: 630, safeZone: 90, displaySize: '1200×630' },
    { platform: 'LinkedIn', width: 1200, height: 627, safeZone: 95, displaySize: '1200×627' },
    { platform: 'Pinterest', width: 1200, height: 630, safeZone: 100, displaySize: '1200×630' }
  ];

  var escapeHtml = function (value) {
    var text = value == null ? '' : String(value);
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  var truncateText = function (text, maxLength) {
    if (!text) return '';
    var str = String(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  };

  var buildContent = function (ogData) {
    var hasData = ogData && (ogData.title || ogData.description || ogData.image);
    var mostRestrictive = defaultPlatforms[0];
    var html = '';

    html += '<div style="margin-bottom: var(--space-md);">';
    html += '<label class="text-label" style="display: block; margin-bottom: var(--space-xs);">PLATFORM</label>';
    html += '<select id="og-platform-select" style="width: 100%; padding: var(--space-sm); background: var(--surface); border: 1px solid var(--border-visible); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--body-sm); cursor: pointer;">';
    for (var i = 0; i < defaultPlatforms.length; i++) {
      var p = defaultPlatforms[i];
      var cropLabel = p.safeZone < 100 ? ' (' + (100 - p.safeZone) + '% crop)' : '';
      html += '<option value="' + p.platform + '"' + (i === 0 ? ' selected' : '') + '>' + p.platform + ' — ' + p.displaySize + cropLabel + '</option>';
    }
    html += '</select>';
    html += '</div>';

    html += '<div id="og-preview-container" style="position: relative; width: 100%; aspect-ratio: ' + mostRestrictive.width + ' / ' + mostRestrictive.height + '; background-color: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">';

    if (ogData && ogData.image) {
      html += '<img id="og-preview-img" src="' + escapeHtml(ogData.image) + '" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">';
      html += '<div id="og-safezone-overlay" style="position: absolute; inset: ' + (100 - mostRestrictive.safeZone) / 2 + '%; border: 2px dashed var(--text-secondary); pointer-events: none;"></div>';
      html += '<a href="' + escapeHtml(ogData.image) + '" target="_blank" rel="noopener" style="position: absolute; top: var(--space-sm); right: var(--space-sm); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--surface); border: 1px solid var(--border-visible); border-radius: var(--radius-sm); cursor: pointer; text-decoration: none;" title="Open image in new tab">';
      html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-secondary);"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
      html += '</a>';
    } else {
      html += '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: var(--space-sm);">';
      html += '<div class="text-label">NO IMAGE</div>';
      html += '</div>';
    }

    html += '</div>';

    html += '<div id="og-crop-warning" style="margin-top: var(--space-sm); padding: var(--space-sm); background-color: var(--surface); border: 1px solid var(--border-visible); border-radius: var(--radius-sm); text-align: center;">';
    html += '<span class="text-secondary" style="font-family: var(--font-mono); font-size: var(--caption);">' + (100 - mostRestrictive.safeZone) + '% CROP ZONE — EDGES MAY BE CUT OFF</span>';
    html += '</div>';

    if (ogData && ogData.title) {
      html += '<div style="margin-top: var(--space-md); padding: var(--space-md); background-color: var(--surface); border-radius: var(--radius-md);">';
      html += '<div class="text-primary" style="font-size: var(--subheading); margin-bottom: var(--space-xs);">' + escapeHtml(truncateText(ogData.title, 60)) + '</div>';
      if (ogData.description) {
        html += '<div class="text-secondary" style="font-size: var(--body-sm);">' + escapeHtml(truncateText(ogData.description, 100)) + '</div>';
      }
      if (ogData.url) {
        html += '<div class="text-label" style="margin-top: var(--space-sm); color: var(--text-disabled);">' + escapeHtml(truncateText(ogData.url, 60)) + '</div>';
      }
      html += '</div>';
    }

    return html;
  };

  var updatePreview = function (platformName) {
    var platform = null;
    for (var i = 0; i < defaultPlatforms.length; i++) {
      if (defaultPlatforms[i].platform === platformName) {
        platform = defaultPlatforms[i];
        break;
      }
    }
    if (!platform) return;

    var container = document.getElementById('og-preview-container');
    var warning = document.getElementById('og-crop-warning');
    if (!container) return;

    container.style.aspectRatio = platform.width + ' / ' + platform.height;

    var overlay = document.getElementById('og-safezone-overlay');
    if (overlay) {
      var cropPerSide = (100 - platform.safeZone) / 2;
      overlay.style.inset = cropPerSide + '%';
      overlay.style.display = platform.safeZone < 100 ? 'block' : 'none';
    }

    if (warning) {
      if (platform.safeZone < 100) {
        warning.innerHTML = '<span class="text-secondary" style="font-family: var(--font-mono); font-size: var(--caption);">' + (100 - platform.safeZone) + '% CROP ZONE — EDGES MAY BE CUT OFF</span>';
        warning.style.display = 'block';
      } else {
        warning.style.display = 'none';
      }
    }
  };

  var bindEvents = function () {
    var select = document.getElementById('og-platform-select');
    if (select) {
      select.addEventListener('change', function () {
        updatePreview(this.value);
      });
    }
  };

  var open = function (pageData) {
    var ogData = {};

    if (typeof ogPreviewData !== 'undefined' && ogPreviewData && typeof ogPreviewData.extractOgData === 'function') {
      try {
        ogData = ogPreviewData.extractOgData(pageData || {});
      } catch (e) {
        ogData = { title: '', description: '', image: '', url: '' };
      }
    }

    if (!window.createModal || typeof window.createModal !== 'function') {
      console.error('Modal component not available');
      return;
    }

    if (activeModal) {
      activeModal.destroy();
      activeModal = null;
    }

    activeModal = window.createModal({
      title: 'OG PREVIEW',
      content: buildContent(ogData),
      width: '480px',
      onClose: function () {
        activeModal = null;
      }
    });

    activeModal.show();
    bindEvents();
  };

  return {
    open: open
  };
})();
