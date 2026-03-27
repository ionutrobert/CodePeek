// Assets Tab - Neumorphic Redesign
var assetsTab = {
  requestId: 0,

  render: function (data) {
    var container = document.getElementById("assets-content");
    var fallbackAssets = data && data.assets ? data.assets : [];
    var self = this;
    var currentRequestId;

    if (!container) return;

    this.renderPanel(container, fallbackAssets, true, null);

    if (typeof messaging === "undefined" || !messaging.extractAssets) {
      this.renderPanel(
        container,
        fallbackAssets,
        false,
        "Live asset scan is unavailable in this tab."
      );
      return;
    }

    this.requestId += 1;
    currentRequestId = this.requestId;

    messaging.extractAssets(function (response) {
      if (currentRequestId !== self.requestId) return;

      if (response && response.success && response.data) {
        self.renderPanel(container, response.data, false, null);
        return;
      }

      self.renderPanel(
        container,
        fallbackAssets,
        false,
        response && response.error
          ? response.error
          : "Could not refresh the asset list from the page."
      );
    });
  },

  renderPanel: function (container, assets, isRefreshing, errorMessage) {
    var html = '<div class="tab-content">';
    var i;

    assets = assets || [];

    html += '<div class="neu-page-header">';
    html += '<div class="neu-section-dot"></div>';
    html += '<div class="min-w-0">';
    html += '<h2 class="neu-page-title">Assets</h2>';
    html += '<div class="neu-page-subtitle">Images & Media</div>';
    html += '</div>';
    html += '<span class="neu-badge">' + assets.length + ' found</span>';
    html += '</div>';

    if (isRefreshing) {
      html +=
        '<div class="neu-card-inset mb-4 px-4 py-3 rounded-2xl border border-white/50">';
      html += '<div class="flex items-center gap-3">';
      html +=
        '<div class="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center shadow-sm">';
      html +=
        '<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8m0 0a8 8 0 018 8m-8-8v4"></path></svg>';
      html += '</div>';
      html += '<div>';
      html += '<div class="text-[10px] font-black uppercase tracking-widest text-brand-600">Refreshing asset list</div>';
      html += '<div class="text-[11px] text-slate-500">Requesting the latest media from the content script.</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }

    if (errorMessage) {
      html +=
        '<div class="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">';
      html += '<div class="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Using cached results</div>';
      html +=
        '<div class="text-[11px] text-amber-800 leading-relaxed">' +
        this.escapeHtml(errorMessage) +
        '</div>';
      html += '</div>';
    }

    if (assets.length === 0 && !isRefreshing) {
      html +=
        '<div class="neu-card px-6 py-16 text-center">' +
        '<div class="w-14 h-14 mx-auto mb-4 rounded-3xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center">' +
        '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-8-8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' +
        '</div>' +
        '<div class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">No media found</div>' +
        '<div class="text-[11px] text-slate-500">This page did not return any downloadable images or SVG assets.</div>' +
        '</div>';
      html += '</div>';
      container.innerHTML = html;
      return;
    }

    html += '<div class="space-y-4">';
    for (i = 0; i < assets.length; i++) {
      html += this.renderAssetCard(assets[i], i);
    }
    html += '</div>';
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

    html += '<div class="neu-card p-4">';
    html += '<div class="flex items-start gap-3">';
    html +=
      '<div class="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center flex-shrink-0 shadow-sm">';
    html += this.getAssetIcon(asset);
    html += '</div>';
    html += '<div class="min-w-0 flex-1">';
    html += '<div class="flex flex-wrap items-center gap-2 mb-2">';
    html += '<span class="neu-badge neu-badge-accent">' + this.escapeHtml(assetType) + '</span>';
    html += '<span class="neu-badge">' + this.escapeHtml(format) + '</span>';
    if (source) {
      html += '<span class="neu-badge">' + this.escapeHtml(source) + '</span>';
    }
    html += '</div>';
    html += '<div class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Filename</div>';
    html +=
      '<div class="text-sm font-black text-slate-900 leading-snug truncate" title="' +
      this.escapeHtml(filename) +
      '">' +
      this.escapeHtml(filename) +
      '</div>';
    html +=
      '<div class="text-[11px] text-slate-500 font-mono truncate mt-1" title="' +
      this.escapeHtml(origin) +
      '">' +
      this.escapeHtml(origin) +
      '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="grid grid-cols-3 gap-2 mt-4">';
    html += this.renderMetaBlock('Type', assetType);
    html += this.renderMetaBlock('Format', format);
    html += this.renderMetaBlock('Size', dimensions);
    html += '</div>';

    html += '<div class="flex items-center gap-2 mt-4">';
    html +=
      '<button type="button" class="neu-btn flex-1 asset-action-btn" data-action="download" data-index="' +
      index +
      '" style="padding: 10px 14px;">';
    html +=
      '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12m0 0l4-4m-4 4l-4-4m-5 8h18"></path></svg>';
    html += '<span class="text-[11px] font-black uppercase tracking-widest">Download</span>';
    html += '</button>';
    html +=
      '<button type="button" class="neu-btn asset-action-btn" data-action="' +
      secondaryAction.action +
      '" data-index="' +
      index +
      '" title="' +
      this.escapeHtml(secondaryAction.title) +
      '" style="padding: 10px 12px; min-width: 52px;">';
    html += secondaryAction.icon;
    html += '</button>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  renderMetaBlock: function (label, value) {
    return (
      '<div class="neu-card-inset rounded-2xl px-3 py-2 text-center border border-white/50">' +
      '<div class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">' +
      this.escapeHtml(label) +
      '</div>' +
      '<div class="text-[11px] font-black text-slate-800 leading-tight break-words">' +
      this.escapeHtml(value) +
      '</div>' +
      '</div>'
    );
  },

  bindActions: function (container, assets) {
    var buttons = container.querySelectorAll('.asset-action-btn');
    var i;
    var self = this;

    for (i = 0; i < buttons.length; i++) {
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
      this.notify('Failed', 'This asset is missing a downloadable source URL.');
      return;
    }

    if (
      asset &&
      asset.type === 'svg' &&
      asset.content &&
      downloadUrl.indexOf('data:') !== 0
    ) {
      downloadUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(asset.content);
    }

    if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download(
        {
          url: downloadUrl,
          filename: filename,
          saveAs: false,
        },
        function () {
          if (chrome.runtime.lastError) {
            self.downloadAssetFallback(asset, filename, button);
            return;
          }
          self.notify('Saved', filename + ' downloaded.');
        }
      );
      return;
    }

    this.downloadWithAnchor(downloadUrl, filename);
    this.notify('Saved', filename + ' downloaded.');
  },

  downloadAssetFallback: function (asset, filename, button) {
    var self = this;
    var runtime = typeof chrome !== 'undefined' ? chrome.runtime : null;

    if (asset && asset.content && runtime && runtime.sendMessage) {
      runtime.sendMessage(
        {
          type: 'DOWNLOAD_FILE',
          payload: {
            filename: filename,
            content: asset.content,
            mimeType: 'image/svg+xml',
          },
        },
        function (response) {
          if (chrome.runtime.lastError || !response || !response.success) {
            self.downloadWithAnchor(asset.src, filename);
            self.notify('Saved', filename + ' downloaded.');
            return;
          }
          self.notify('Saved', filename + ' downloaded.');
        }
      );
      return;
    }

    this.downloadWithAnchor(asset.src, filename);
    this.notify('Saved', filename + ' downloaded.');
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
    return 'Image';
  },

  getFormatLabel: function (asset) {
    var extension = asset && asset.extension ? String(asset.extension) : '';

    if (extension) return extension.toUpperCase();
    if (asset && asset.type === 'svg') return 'SVG';
    return 'Unknown';
  },

  getDimensionsLabel: function (asset) {
    var width = asset && asset.width ? Math.round(asset.width) : 0;
    var height = asset && asset.height ? Math.round(asset.height) : 0;

    if (width > 0 && height > 0) {
      return width + ' x ' + height;
    }

    return 'Unknown';
  },

  getSourceLabel: function (asset) {
    if (asset && asset.source === 'srcset') return 'Srcset';
    if (asset && asset.type === 'svg') return 'Inline';
    return '';
  },

  getOriginLabel: function (asset) {
    if (!asset || !asset.src) return 'Generated asset';
    if (asset.src.indexOf('data:') === 0) return 'Inline page asset';
    return asset.src;
  },

  getSecondaryAction: function (asset) {
    if (asset && asset.type === 'svg' && asset.content) {
      return {
        action: 'copy-svg',
        title: 'Copy SVG markup',
        icon:
          '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16h8M8 12h8m-5-4h5M8 20h8a2 2 0 002-2V6l-4-4H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>',
      };
    }

    return {
      action: 'copy-url',
      title: 'Copy asset URL',
      icon:
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>',
    };
  },

  getAssetIcon: function (asset) {
    if (asset && asset.type === 'svg') {
      return '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8l-4 4 4 4m10-8l4 4-4 4M14 4l-4 16"></path></svg>';
    }

    return '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-8-8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
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
      this.notify('Copied', 'Asset details copied to clipboard.');
    } catch (e) {
      this.notify('Failed', 'Could not copy the asset details.');
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
  },
};
