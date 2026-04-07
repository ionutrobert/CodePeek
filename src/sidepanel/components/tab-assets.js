// Assets Tab - Nothing Design System
var assetsTab = {
  requestId: 0,

  render: function (data) {
    var container = document.getElementById("assets-content");
    var fallbackAssets = data && data.assets ? data.assets : [];
    var self = this;

    if (!container) return;

    this.renderPanel(container, fallbackAssets, true, null);

    if (typeof messaging === "undefined" || !messaging.extractAssets) {
      this.renderPanel(container, fallbackAssets, false, "Asset scan unavailable.");
      return;
    }

    this.requestId += 1;
    var currentRequestId = this.requestId;

    messaging.extractAssets(function (response) {
      if (currentRequestId !== self.requestId) return;

      if (response && response.success && response.data) {
        self.renderPanel(container, response.data, false, null);
        return;
      }

      self.renderPanel(container, fallbackAssets, false, response && response.error ? response.error : "Could not refresh assets.");
    });
  },

  renderPanel: function (container, assets, isRefreshing, errorMessage) {
    var html = '<div class="tab-content">';

    // Page Header
    html += '<div class="page-header">';
    html += '<div class="page-title">ASSETS</div>';
    html += '<div class="page-subtitle">Images & Media</div>';
    html += '</div>';

    // Stats
    html += '<div class="stat-section" style="border-bottom: none;">';
    html += '<div style="display: flex; justify-content: space-between; align-items: baseline;">';
    html += '<span class="text-label">FOUND</span>';
    html += '<span class="text-display" style="font-size: var(--heading);">' + (assets ? assets.length : 0) + '</span>';
    html += '</div>';
    html += '</div>';

    if (isRefreshing) {
      html += '<div style="padding: var(--space-md); background-color: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: var(--space-md);">';
      html += '<span class="loading-text loading-bracket">SCANNING</span>';
      html += '</div>';
    }

    if (errorMessage) {
      html += '<div style="padding: var(--space-md); border: 1px solid var(--accent); border-radius: var(--radius-md); margin-bottom: var(--space-md);">';
      html += '<span class="text-accent" style="font-family: var(--font-mono); font-size: var(--caption); letter-spacing: 0.04em;">[CACHED RESULTS]</span>';
      html += '<div class="text-secondary" style="margin-top: var(--space-xs); font-size: var(--body-sm);">' + this.escapeHtml(errorMessage) + '</div>';
      html += '</div>';
    }

    if (!assets || assets.length === 0) {
      if (!isRefreshing) {
        html += '<div class="empty-state">';
        html += '<div class="empty-state-title">NO MEDIA FOUND</div>';
        html += '<div class="empty-state-text">No downloadable images or SVG assets detected.</div>';
        html += '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
      return;
    }

    // Asset List
    for (var i = 0; i < assets.length; i++) {
      html += this.renderAssetCard(assets[i], i);
    }

    html += '</div>';
    container.innerHTML = html;
    this.bindActions(container, assets);
  },

  renderAssetCard: function (asset, index) {
    var filename = this.getFilename(asset, index);
    var assetType = this.getTypeLabel(asset);
    var format = this.getFormatLabel(asset);
    var dimensions = this.getDimensionsLabel(asset);
    var source = this.getSourceLabel(asset);
    var origin = this.getOriginLabel(asset);
    var secondaryAction = this.getSecondaryAction(asset);
    var html = '';

    html += '<div class="card" style="margin-bottom: var(--space-md);">';

    // Header
    html += '<div style="display: flex; align-items: flex-start; gap: var(--space-md); margin-bottom: var(--space-md);">';
    
    // Icon
    html += '<div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-visible); border-radius: var(--radius-md); color: var(--text-secondary);">';
    html += this.getAssetIcon(asset);
    html += '</div>';

    // Info
    html += '<div style="flex: 1; min-width: 0;">';
    html += '<div style="display: flex; flex-wrap: wrap; gap: var(--space-xs); margin-bottom: var(--space-xs);">';
    html += '<span class="tag">' + this.escapeHtml(assetType) + '</span>';
    html += '<span class="tag">' + this.escapeHtml(format) + '</span>';
    if (source) {
      html += '<span class="tag">' + this.escapeHtml(source) + '</span>';
    }
    html += '</div>';
    html += '<div class="text-primary" style="font-size: var(--body-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="' + this.escapeHtml(filename) + '">' + this.escapeHtml(filename) + '</div>';
    html += '<div class="text-mono" style="font-size: var(--caption); color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="' + this.escapeHtml(origin) + '">' + this.escapeHtml(origin) + '</div>';
    html += '</div>';
    html += '</div>';

    // Meta Grid
    html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background-color: var(--border); margin-bottom: var(--space-md); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">';
    html += '<div style="padding: var(--space-sm); background-color: var(--black); text-align: center;">';
    html += '<div class="text-label" style="margin-bottom: var(--space-2xs);">TYPE</div>';
    html += '<div class="text-primary" style="font-size: var(--body-sm);">' + this.escapeHtml(assetType) + '</div>';
    html += '</div>';
    html += '<div style="padding: var(--space-sm); background-color: var(--black); text-align: center;">';
    html += '<div class="text-label" style="margin-bottom: var(--space-2xs);">FORMAT</div>';
    html += '<div class="text-primary" style="font-size: var(--body-sm);">' + this.escapeHtml(format) + '</div>';
    html += '</div>';
    html += '<div style="padding: var(--space-sm); background-color: var(--black); text-align: center;">';
    html += '<div class="text-label" style="margin-bottom: var(--space-2xs);">SIZE</div>';
    html += '<div class="text-primary" style="font-size: var(--body-sm);">' + this.escapeHtml(dimensions) + '</div>';
    html += '</div>';
    html += '</div>';

    // Actions
    html += '<div style="display: flex; gap: var(--space-sm);">';
    html += '<button type="button" class="btn btn-primary" data-action="download" data-index="' + index + '" style="flex: 1;">DOWNLOAD</button>';
    html += '<button type="button" class="btn btn-secondary asset-action-btn" data-action="' + secondaryAction.action + '" data-index="' + index + '" title="' + this.escapeHtml(secondaryAction.title) + '">';
    html += secondaryAction.icon;
    html += '</button>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  bindActions: function (container, assets) {
    var buttons = container.querySelectorAll('.asset-action-btn, .btn-primary[data-action="download"]');
    var self = this;

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].onclick = function () {
        var index = parseInt(this.getAttribute('data-index'), 10);
        var action = this.getAttribute('data-action');
        if (isNaN(index) || !assets[index]) return;
        self.handleAction(action, assets[index], index, this);
      };
    }
  },

  handleAction: function (action, asset, index, button) {
    if (action === 'download') {
      this.downloadAsset(asset, index, button);
      return;
    }

    if (action === 'copy-url') {
      this.copyText(asset.src || '');
      return;
    }

    if (action === 'copy-svg') {
      this.copyText(asset.content || asset.src || '');
    }
  },

  downloadAsset: function (asset, index, button) {
    var downloadUrl = asset && asset.src ? asset.src : '';
    var filename = this.getDownloadName(asset, index);
    var self = this;

    if (!downloadUrl) {
      this.notify('ERROR', 'Asset missing source URL.');
      return;
    }

    if (asset && asset.type === 'svg' && asset.content && downloadUrl.indexOf('data:') !== 0) {
      downloadUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(asset.content);
    }

    if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download({ url: downloadUrl, filename: filename, saveAs: false }, function () {
        if (chrome.runtime.lastError) {
          self.downloadAssetFallback(asset, filename, button);
          return;
        }
        self.notify('SAVED', filename);
      });
      return;
    }

    this.downloadWithAnchor(downloadUrl, filename);
    this.notify('SAVED', filename);
  },

  downloadAssetFallback: function (asset, filename, button) {
    var self = this;
    var runtime = typeof chrome !== 'undefined' ? chrome.runtime : null;

    if (asset && asset.content && runtime && runtime.sendMessage) {
      runtime.sendMessage({ type: 'DOWNLOAD_FILE', payload: { filename: filename, content: asset.content, mimeType: 'image/svg+xml' } }, function (response) {
        if (chrome.runtime.lastError || !response || !response.success) {
          self.downloadWithAnchor(asset.src, filename);
          self.notify('SAVED', filename);
          return;
        }
        self.notify('SAVED', filename);
      });
      return;
    }

    this.downloadWithAnchor(asset.src, filename);
    this.notify('SAVED', filename);
  },

  downloadWithAnchor: function (url, filename) {
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  getFilename: function (asset, index) {
    var filename = asset && asset.filename ? asset.filename : '';

    if (!filename && asset && asset.src) {
      filename = asset.src.split('/').pop().split('?')[0];
    }

    if (!filename) {
      filename = 'asset-' + (index + 1);
      if (asset && asset.type === 'svg') filename += '.svg';
    }

    return filename;
  },

  getDownloadName: function (asset, index) {
    var filename = this.getFilename(asset, index);
    var extension = asset && asset.extension ? String(asset.extension).toLowerCase() : '';

    filename = this.sanitizeFilename(filename);

    if (!extension && asset && asset.type === 'svg') {
      extension = 'svg';
    }

    if (extension && filename.toLowerCase().slice(-(extension.length + 1)) !== '.' + extension) {
      filename += '.' + extension;
    }

    return filename;
  },

  sanitizeFilename: function (filename) {
    var cleaned = String(filename || 'asset').replace(/[\\/:*?"<>|]+/g, '-');
    cleaned = cleaned.replace(/\s+/g, '-');
    cleaned = cleaned.replace(/-+/g, '-');
    cleaned = cleaned.replace(/^[-.]+|[-.]+$/g, '');
    if (!cleaned) cleaned = 'asset';
    return cleaned;
  },

  getTypeLabel: function (asset) {
    if (asset && asset.type === 'svg') return 'SVG';
    return 'IMAGE';
  },

  getFormatLabel: function (asset) {
    var extension = asset && asset.extension ? String(asset.extension) : '';
    if (extension) return extension.toUpperCase();
    if (asset && asset.type === 'svg') return 'SVG';
    return 'UNKNOWN';
  },

  getDimensionsLabel: function (asset) {
    var width = asset && asset.width ? Math.round(asset.width) : 0;
    var height = asset && asset.height ? Math.round(asset.height) : 0;

    if (width > 0 && height > 0) {
      return width + ' × ' + height;
    }

    return '—';
  },

  getSourceLabel: function (asset) {
    if (asset && asset.source === 'srcset') return 'SRCSET';
    if (asset && asset.type === 'svg') return 'INLINE';
    return '';
  },

  getOriginLabel: function (asset) {
    if (!asset || !asset.src) return 'Generated asset';
    if (asset.src.indexOf('data:') === 0) return 'Inline page asset';
    return asset.src;
  },

  getSecondaryAction: function (asset) {
    if (asset && asset.type === 'svg' && asset.content) {
      return { action: 'copy-svg', title: 'Copy SVG markup', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16h8M8 12h8m-5-4h5M8 20h8a2 2 0 002-2V6l-4-4H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>' };
    }

    return { action: 'copy-url', title: 'Copy asset URL', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>' };
  },

  getAssetIcon: function (asset) {
    if (asset && asset.type === 'svg') {
      return '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 8l-4 4 4 4m10-8l4 4-4 4M14 4l-4 16"></path></svg>';
    }

    return '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-8-8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
  },

  copyText: function (text) {
    if (typeof CodePeekApp !== 'undefined' && CodePeekApp.copyText) {
      CodePeekApp.copyText(text);
      return;
    }

    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.notify('COPIED', 'Asset details copied.');
    } catch (e) {
      this.notify('ERROR', 'Copy failed.');
    }
    document.body.removeChild(textarea);
  },

  notify: function (title, message) {
    if (typeof CodePeekApp !== 'undefined' && CodePeekApp.showNotification) {
      CodePeekApp.showNotification(title, message);
    }
  },

  escapeHtml: function (value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
