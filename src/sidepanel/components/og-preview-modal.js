// OG Preview Modal - Nothing Design System
var ogPreviewModal = (function () {
  var activeModal = null;
  var keydownHandler = null;

  var defaultPlatforms = [
    { platform: 'Facebook', width: 1200, height: 630, aspectRatio: '1.91:1', accentColor: '#1877F2', safeZone: 90, displaySize: '1200×630' },
    { platform: 'Twitter/X', width: 1200, height: 600, aspectRatio: '2:1', accentColor: '#000000', safeZone: 80, displaySize: '1200×600' },
    { platform: 'LinkedIn', width: 1200, height: 627, aspectRatio: '1.91:1', accentColor: '#0A66C2', safeZone: 95, displaySize: '1200×627' },
    { platform: 'WhatsApp', width: 300, height: 200, aspectRatio: '1.5:1', accentColor: '#25D366', safeZone: 70, displaySize: '300×200' },
    { platform: 'Slack', width: 360, height: 190, aspectRatio: '1.9:1', accentColor: '#4A154B', safeZone: 75, displaySize: '360×190' },
    { platform: 'Discord', width: 400, height: 209, aspectRatio: '1.9:1', accentColor: '#5865F2', safeZone: 80, displaySize: '400×209' },
    { platform: 'Pinterest', width: 1200, height: 630, aspectRatio: '1.91:1', accentColor: '#E60023', safeZone: 100, displaySize: '1200×630' }
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

  var getDisplayDomain = function (url) {
    var value = url ? String(url) : '';
    var match = value.match(/^[a-z]+:\/\/([^\/]+)/i);
    return match && match[1] ? match[1] : value.replace(/^https?:\/\//i, '');
  };

  var getSafeZoneInfo = function (platform) {
    var safeZone = platform.safeZone || 100;
    if (safeZone >= 100) return null;
    var cropPct = 100 - safeZone;
    return {
      safeZone: safeZone,
      cropPct: cropPct,
      cropPerSide: cropPct / 2
    };
  };

  var buildContent = function (ogData, pageData) {
    var hasData = ogData && (ogData.title || ogData.description || ogData.image);
    var platforms = defaultPlatforms;
    var html = '';

    // Status Card
    html += '<div class="card" style="margin-bottom: var(--space-lg);">';
    html += '<div style="display: flex; align-items: center; gap: var(--space-md);">';
    html += '<div style="flex: 1; min-width: 0;">';
    html += '<div class="text-label" style="margin-bottom: var(--space-xs);">OPEN GRAPH</div>';
    html += '<div class="text-primary">' + (hasData ? 'OG DATA READY' : 'NO OG DATA') + '</div>';
    html += '</div>';
    if (ogData && ogData.url) {
      html += '<div class="tag">' + truncateText(getDisplayDomain(ogData.url), 30) + '</div>';
    }
    html += '</div>';
    if (!hasData) {
      html += '<div class="text-secondary" style="margin-top: var(--space-md); font-size: var(--body-sm);">Add og:title, og:description, and og:image meta tags.</div>';
    }
    html += '</div>';

    // Platform Tabs
    html += '<div class="subtabs" style="margin-bottom: var(--space-md);">';
    for (var i = 0; i < platforms.length; i++) {
      var isActive = i === 0;
      html += '<button class="subtab-btn' + (isActive ? ' active' : '') + '" data-platform="' + platforms[i].platform + '" style="font-size: 10px; padding: var(--space-sm) var(--space-sm);">';
      html += truncateText(platforms[i].platform, 8).toUpperCase();
      html += '</button>';
    }
    html += '</div>';

    // Preview Panels
    for (var j = 0; j < platforms.length; j++) {
      var platform = platforms[j];
      var safeInfo = getSafeZoneInfo(platform);
      var isHidden = j !== 0;
      var platformId = 'og-panel-' + platform.platform.toLowerCase().replace(/[^a-z0-9]/g, '-');

      html += '<div id="' + platformId + '" class="og-preview-panel' + (isHidden ? ' hidden' : '') + '" style="display: ' + (isHidden ? 'none' : 'block') + ';">';

      // Platform Header
      html += '<div class="card-compact" style="margin-bottom: var(--space-md); display: flex; justify-content: space-between; align-items: center;">';
      html += '<div>';
      html += '<div class="text-label">' + platform.platform.toUpperCase() + '</div>';
      html += '<div class="text-primary" style="font-size: var(--subheading);">' + platform.width + ' × ' + platform.height + '</div>';
      html += '</div>';
      html += '<div class="tag">' + platform.aspectRatio + '</div>';
      html += '</div>';

      // Image Preview
      html += '<div style="position: relative; width: 100%; aspect-ratio: ' + platform.width + ' / ' + platform.height + '; background-color: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">';

      if (ogData && ogData.image) {
        html += '<img src="' + escapeHtml(ogData.image) + '" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">';

        if (safeInfo) {
          // Safe zone overlay
          html += '<div style="position: absolute; inset: ' + safeInfo.cropPerSide + '%; border: 1px dashed var(--text-secondary); pointer-events: none;"></div>';

          // Crop warning
          html += '<div style="position: absolute; bottom: var(--space-sm); left: 50%; transform: translateX(-50%); padding: var(--space-xs) var(--space-sm); background-color: var(--surface); border: 1px solid var(--border-visible); font-family: var(--font-mono); font-size: var(--caption); color: var(--text-secondary);">';
          html += safeInfo.cropPct + '% CROP ZONE';
          html += '</div>';
        }
      } else {
        html += '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: var(--space-sm);">';
        html += '<div class="text-label">NO IMAGE</div>';
        html += '</div>';
      }

      html += '</div>'; // image container

      // Meta Info
      if (ogData && ogData.title) {
        html += '<div style="margin-top: var(--space-md); padding: var(--space-md); background-color: var(--surface); border-radius: var(--radius-md);">';
        html += '<div class="text-primary" style="font-size: var(--subheading); margin-bottom: var(--space-xs);">' + escapeHtml(truncateText(ogData.title, 60)) + '</div>';
        if (ogData.description) {
          html += '<div class="text-secondary" style="font-size: var(--body-sm);">' + escapeHtml(truncateText(ogData.description, 100)) + '</div>';
        }
        html += '</div>';
      }

      html += '</div>'; // panel
    }

    return html;
  };

  var activateTab = function (platformName) {
    var buttons = document.querySelectorAll('.og-preview-tab-btn');
    var panels = document.querySelectorAll('.og-preview-panel');

    for (var i = 0; i < buttons.length; i++) {
      var isActive = buttons[i].getAttribute('data-platform') === platformName;
      buttons[i].classList.toggle('active', isActive);
    }

    for (var j = 0; j < panels.length; j++) {
      var panel = panels[j];
      var isMatch = panel.id === 'og-panel-' + platformName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      panel.style.display = isMatch ? 'block' : 'none';
    }
  };

  var bindTabs = function () {
    var buttons = document.querySelectorAll('.og-preview-tab-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        activateTab(this.getAttribute('data-platform'));
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
      content: buildContent(ogData, pageData || {}),
      width: '480px',
      onClose: function () {
        activeModal = null;
      }
    });

    activeModal.show();
    bindTabs();
  };

  return {
    open: open
  };
})();
