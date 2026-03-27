// Tab: Code Snippets (Developer Mode)
// Export element as HTML/CSS/React/Vue
var codeSnippetsTab = {
  render: function(pageData) {
    var container = document.getElementById("code-snippets-content");
    if (!container) return;
    var state = this.getState();
    var currentData = this.getCurrentData();
    var currentSelector = this.getCurrentSelector();
    var statusMessage = this.getStatusMessage(state, currentSelector, currentData);

    var html = '<div class="tab-content">';

    // Standardized Page Header
    html += '<div class="neu-page-header">';
    html += '<div class="neu-section-dot"></div>';
    html += '<div>';
    html += '<h2 class="neu-page-title">Code Snippets</h2>';
    html += '<div class="neu-page-subtitle">Element Export</div>';
    html += '</div>';
    html += '<button id="code-select-btn" class="neu-btn neu-btn-small neu-btn-primary">' + (state.isSelecting ? 'Cancel Select' : 'Select Element') + '</button>';
    html += '</div>';

    html += '<div class="rounded-2xl border px-4 py-3 mb-4 ' + (state.errorMessage ? 'border-red-200 bg-red-50 text-red-700' : 'border-brand-100 bg-brand-50/70 text-slate-600') + '">';
    html += '<div class="text-[10px] font-black uppercase tracking-widest mb-1 ' + (state.errorMessage ? 'text-red-600' : 'text-brand-600') + '">';
    html += state.errorMessage ? 'Selection Error' : 'Selector Status';
    html += '</div>';
    html += '<div class="text-xs leading-relaxed">' + this.escapeHtml(statusMessage) + '</div>';
    if (currentSelector) {
      html += '<div class="mt-3 inline-flex items-center rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-[10px] font-mono text-slate-600">';
      html += this.escapeHtml(currentSelector);
      html += '</div>';
    }
    html += '</div>';

    // Raw HTML Section
    html += '<div class="space-y-4">';
    html += '<div class="flex items-center justify-between">';
    html += '<span class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Raw HTML</span>';
    html += '<button id="copy-html-btn" class="neu-btn neu-btn-small">Copy</button>';
    html += '</div>';
    html += '<textarea id="export-html" class="w-full h-48 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" readonly placeholder="Select an element to view its markup."></textarea>';
    html += '</div>';

    // Inline Styles Section (will be populated dynamically)
    html += '<div id="inline-styles-section" class="space-y-2 hidden">';
    html += '<div class="flex items-center justify-between">';
    html += '<span class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Inline Styles</span>';
    html += '<button id="copy-styles-btn" class="neu-btn neu-btn-small">Copy</button>';
    html += '</div>';
    html += '<textarea id="inline-styles-text" class="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" readonly></textarea>';
    html += '</div>';

    // Inline JS Section (will be populated dynamically)
    html += '<div id="inline-js-section" class="space-y-2 hidden">';
    html += '<div class="flex items-center justify-between">';
    html += '<span class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Inline JavaScript</span>';
    html += '<button id="copy-js-btn" class="neu-btn neu-btn-small">Copy</button>';
    html += '</div>';
    html += '<div id="inline-js-content" class="space-y-2"></div>';
    html += '</div>';

    html += '<div class="text-xs text-slate-500 italic">Use "Select Element" to pick any element directly from the page without using Inspect mode.</div>';

    container.innerHTML = html;

    this.displayExtractedCode(currentData);

    var self = this;

    // Copy HTML button
    var copyHtmlBtn = document.getElementById("copy-html-btn");
    if (copyHtmlBtn) {
      copyHtmlBtn.onclick = function() {
        var htmlField = document.getElementById("export-html");
        if (htmlField && htmlField.value) {
          self.copyToClipboard(htmlField.value, copyHtmlBtn);
        } else {
          self.flashButton(copyHtmlBtn, 'No code');
        }
      };
    }

    var selectBtn = document.getElementById("code-select-btn");
    if (selectBtn) {
      selectBtn.onclick = function() {
        if (self.getState().isSelecting) {
          self.stopElementSelection(selectBtn);
        } else {
          self.startElementSelection(selectBtn);
        }
      };
    }

    // Copy styles button
    var copyStylesBtn = document.getElementById("copy-styles-btn");
    if (copyStylesBtn) {
      copyStylesBtn.onclick = function() {
        var stylesText = document.getElementById("inline-styles-text");
        if (stylesText) {
          self.copyToClipboard(stylesText.value, copyStylesBtn);
        }
      };
    }

    // Copy JS button
    var copyJsBtn = document.getElementById("copy-js-btn");
    if (copyJsBtn) {
      copyJsBtn.onclick = function() {
        var allJs = [];
        var items;
        var i;
        var jsContent = document.getElementById("inline-js-content");
        if (jsContent) {
          items = jsContent.querySelectorAll('.inline-js-item');
          for (i = 0; i < items.length; i++) {
            allJs.push(items[i].textContent);
          }
          if (allJs.length > 0) {
            self.copyToClipboard(allJs.join('\n\n'), copyJsBtn);
          } else {
            self.flashButton(copyJsBtn, 'No JS');
          }
        }
      };
    }
  },

  getState: function() {
    var app = window.CodePeekApp || {};
    if (!window.CodePeekApp) {
      window.CodePeekApp = app;
    }
    if (!app.codeSnippetsState) {
      app.codeSnippetsState = {
        isSelecting: false,
        selectedData: null,
        selectedSelector: '',
        errorMessage: ''
      };
    }
    return app.codeSnippetsState;
  },

  getCurrentData: function() {
    var app = window.CodePeekApp || {};
    var state = this.getState();

    if (state.selectedData && state.selectedData.html) {
      return state.selectedData;
    }

    if (app.lastInspected && app.lastInspected.html) {
      return {
        html: app.lastInspected.html,
        inlineStyles: null,
        inlineJS: []
      };
    }

    return null;
  },

  getCurrentSelector: function() {
    var app = window.CodePeekApp || {};
    var state = this.getState();

    if (state.selectedSelector) {
      return state.selectedSelector;
    }

    if (app.lastInspected && app.lastInspected.element && app.lastInspected.element.selector) {
      return app.lastInspected.element.selector;
    }

    return '';
  },

  getStatusMessage: function(state, selector, currentData) {
    if (state.errorMessage) {
      return state.errorMessage;
    }

    if (state.isSelecting) {
      return 'Click any page element to capture its HTML, inline styles, and inline event handlers. Press Escape to cancel.';
    }

    if (state.selectedData && state.selectedData.html) {
      return 'Showing code captured by the Code tab selector. Select another element at any time.';
    }

    if (currentData && currentData.html && selector) {
      return 'Showing the latest Inspect selection. Use Select Element to choose code directly from the Code tab.';
    }

    return 'Select Element starts an independent picker just for the Code tab and does not depend on Inspect mode.';
  },

  startElementSelection: function(btn) {
    var self = this;
    var state = this.getState();
    var originalText = btn.textContent;
    state.isSelecting = true;
    state.errorMessage = '';
    btn.textContent = 'Selecting...';
    btn.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0]) {
        state.isSelecting = false;
        state.errorMessage = 'No active browser tab is available for code selection.';
        self.render(window.CodePeekApp && window.CodePeekApp.pageData);
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'START_CODE_ELEMENT_SELECT'
      }, function(response) {
        if (chrome.runtime.lastError) {
          state.isSelecting = false;
          state.errorMessage = chrome.runtime.lastError.message || 'Code selection could not start on this page.';
          self.render(window.CodePeekApp && window.CodePeekApp.pageData);
          return;
        }

        btn.textContent = originalText;
        btn.disabled = false;

        if (response && response.success && response.data) {
          state.selectedData = response.data;
          state.selectedSelector = response.selector || '';
          state.errorMessage = '';
        } else if (response && response.cancelled) {
          state.errorMessage = '';
        } else {
          state.errorMessage = response && response.error ? response.error : 'Element selection did not return any code.';
        }

        state.isSelecting = false;
        self.render(window.CodePeekApp && window.CodePeekApp.pageData);
      });
    });
  },

  stopElementSelection: function(btn) {
    var self = this;
    var state = this.getState();

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Stopping...';
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0]) {
        state.isSelecting = false;
        self.render(window.CodePeekApp && window.CodePeekApp.pageData);
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'STOP_CODE_ELEMENT_SELECT'
      }, function() {
        state.isSelecting = false;
        state.errorMessage = '';
        self.render(window.CodePeekApp && window.CodePeekApp.pageData);
      });
    });
  },

  displayExtractedCode: function(data) {
    var self = this;
    var i;
    var htmlField = document.getElementById('export-html');
    if (htmlField) {
      htmlField.value = data && data.html ? this.formatHtml(data.html) : '';
    }

    // Display inline styles
    var stylesSection = document.getElementById("inline-styles-section");
    var stylesText = document.getElementById("inline-styles-text");

    if (stylesSection && stylesText) {
      if (data && data.inlineStyles) {
        stylesSection.classList.remove('hidden');
        stylesText.value = this.formatInlineStyles(data.inlineStyles);
      } else {
        stylesSection.classList.add('hidden');
        stylesText.value = '';
      }
    }

    // Display inline JS
    var jsSection = document.getElementById("inline-js-section");
    var jsContent = document.getElementById("inline-js-content");

    if (jsSection && jsContent) {
      jsContent.innerHTML = '';

      if (data && data.inlineJS && data.inlineJS.length > 0) {
        jsSection.classList.remove('hidden');

        for (i = 0; i < data.inlineJS.length; i++) {
          (function(handler) {
            var itemDiv = document.createElement('div');
            itemDiv.className = 'inline-js-item bg-slate-50 border border-slate-200 rounded-lg p-2';

            var labelDiv = document.createElement('div');
            labelDiv.className = 'text-xs font-semibold text-brand-600 mb-1';
            labelDiv.textContent = handler.attr;
            itemDiv.appendChild(labelDiv);

            var codeDiv = document.createElement('div');
            codeDiv.className = 'font-mono text-xs text-slate-700 break-all';
            codeDiv.textContent = handler.value;
            itemDiv.appendChild(codeDiv);

            var copyBtn = document.createElement('button');
            copyBtn.className = 'neu-btn neu-btn-small mt-2';
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = function() {
              self.copyToClipboard(handler.attr + '="' + handler.value + '"', copyBtn);
            };
            itemDiv.appendChild(copyBtn);

            jsContent.appendChild(itemDiv);
          })(data.inlineJS[i]);
        }
      } else {
        jsSection.classList.add('hidden');
      }
    }
  },

  formatInlineStyles: function(styles) {
    if (!styles) return '';
    var parts = styles.split(';').filter(function(p) { return p.trim(); });
    var formatted = parts.map(function(part) {
      var trimmed = part.trim();
      return '  ' + trimmed + ';';
    });
    return formatted.join('\n');
  },

  formatHtml: function(html) {
    var formatted = '';
    var pad = 0;
    var parts = html.split(/>\s*</);
    var i, part, isLast, tag;

    for (i = 0; i < parts.length; i++) {
      part = parts[i];
      isLast = (i === parts.length - 1);

      if (part.charAt(0) === '/') {
        pad = Math.max(0, pad - 1);
      }

      formatted += this.getIndent(pad);

      if (parts.length === 1) {
        tag = part;
      } else {
        if (i === 0) {
          tag = part + '>';
        } else if (isLast) {
          tag = '<' + part;
        } else {
          tag = '<' + part + '>';
        }
      }
      formatted += tag + '\n';

      if (part.charAt(0) !== '/' && part.charAt(part.length - 1) !== '/') {
        pad++;
      }
    }

    return formatted.trim();
  },

  getIndent: function(size) {
    var spaces = '';
    var i;
    for (i = 0; i < size; i++) {
      spaces += ' ';
    }
    return spaces;
  },

  escapeHtml: function(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  flashButton: function(btn, text) {
    var original = btn.textContent;
    btn.textContent = text;
    setTimeout(function() {
      btn.textContent = original;
    }, 1500);
  },

  copyToClipboard: function(text, btn) {
    navigator.clipboard.writeText(text).then(function() {
      var original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function() { btn.textContent = original; }, 2000);
    }).catch(function(err) {
      alert('Copy failed: ' + err);
    });
  }
};
