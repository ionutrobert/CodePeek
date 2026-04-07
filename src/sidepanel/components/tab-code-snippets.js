// Tab: Code Snippets (Developer Mode)
// Nothing Design - Element Export
var codeSnippetsTab = {
  render: function(pageData) {
    var container = document.getElementById("code-snippets-content");
    if (!container) return;
    var state = this.getState();
    var currentData = this.getCurrentData();
    var currentSelector = this.getCurrentSelector();
    var statusMessage = this.getStatusMessage(state, currentSelector, currentData);

    var html = '<div class="code-snippets-tab">';

    // Page Header
    html += '<div class="page-header">';
    html += '<div class="section-indicator"></div>';
    html += '<div class="header-text">';
    html += '<h1 class="page-title">Code Snippets</h1>';
    html += '<p class="page-subtitle">Element Export</p>';
    html += '</div>';
    html += '<button id="code-select-btn" class="action-btn">' + (state.isSelecting ? 'Cancel' : 'Select') + '</button>';
    html += '</div>';

    // Status Bar
    var statusClass = state.errorMessage ? 'status-error' : 'status-info';
    html += '<div class="status-bar ' + statusClass + '">';
    html += '<span class="status-label">' + (state.errorMessage ? 'Error' : 'Status') + '</span>';
    html += '<span class="status-text">' + this.escapeHtml(statusMessage) + '</span>';
    if (currentSelector) {
      html += '<span class="status-selector">' + this.escapeHtml(currentSelector) + '</span>';
    }
    html += '</div>';

    // Raw HTML Section
    html += '<section class="code-section">';
    html += '<div class="section-header-inline">';
    html += '<span class="section-label">Raw HTML</span>';
    html += '<button id="copy-html-btn" class="copy-btn-small">Copy</button>';
    html += '</div>';
    html += '<textarea id="export-html" class="code-textarea" readonly placeholder="Select an element to view its markup."></textarea>';
    html += '</section>';

    // Inline Styles Section
    html += '<section id="inline-styles-section" class="code-section hidden">';
    html += '<div class="section-header-inline">';
    html += '<span class="section-label">Inline Styles</span>';
    html += '<button id="copy-styles-btn" class="copy-btn-small">Copy</button>';
    html += '</div>';
    html += '<textarea id="inline-styles-text" class="code-textarea code-textarea-sm" readonly></textarea>';
    html += '</section>';

    // Inline JS Section
    html += '<section id="inline-js-section" class="code-section hidden">';
    html += '<div class="section-header-inline">';
    html += '<span class="section-label">Inline JavaScript</span>';
    html += '<button id="copy-js-btn" class="copy-btn-small">Copy</button>';
    html += '</div>';
    html += '<div id="inline-js-content" class="js-items"></div>';
    html += '</section>';

    html += '<div class="hint-text">Use Select Element to pick any element from the page</div>';

    html += '</div>';

    container.innerHTML = html;

    this.displayExtractedCode(currentData);

    var self = this;

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

    var copyStylesBtn = document.getElementById("copy-styles-btn");
    if (copyStylesBtn) {
      copyStylesBtn.onclick = function() {
        var stylesText = document.getElementById("inline-styles-text");
        if (stylesText) {
          self.copyToClipboard(stylesText.value, copyStylesBtn);
        }
      };
    }

    var copyJsBtn = document.getElementById("copy-js-btn");
    if (copyJsBtn) {
      copyJsBtn.onclick = function() {
        var allJs = [];
        var jsContent = document.getElementById("inline-js-content");
        if (jsContent) {
          var items = jsContent.querySelectorAll('.js-item');
          for (var i = 0; i < items.length; i++) {
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
    if (!window.CodePeekApp) { window.CodePeekApp = app; }
    if (!app.codeSnippetsState) {
      app.codeSnippetsState = { isSelecting: false, selectedData: null, selectedSelector: '', errorMessage: '' };
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
      return { html: app.lastInspected.html, inlineStyles: null, inlineJS: [] };
    }

    return null;
  },

  getCurrentSelector: function() {
    var app = window.CodePeekApp || {};
    var state = this.getState();

    if (state.selectedSelector) { return state.selectedSelector; }

    if (app.lastInspected && app.lastInspected.element && app.lastInspected.element.selector) {
      return app.lastInspected.element.selector;
    }

    return '';
  },

  getStatusMessage: function(state, selector, currentData) {
    if (state.errorMessage) { return state.errorMessage; }
    if (state.isSelecting) { return 'Click any element to capture. Press Escape to cancel.'; }
    if (state.selectedData && state.selectedData.html) { return 'Showing code from selector.'; }
    if (currentData && currentData.html && selector) { return 'Showing latest Inspect selection.'; }
    return 'Select Element starts an independent picker.';
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
        state.errorMessage = 'No active tab available.';
        self.render(window.CodePeekApp && window.CodePeekApp.pageData);
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { type: 'START_CODE_ELEMENT_SELECT' }, function(response) {
        if (chrome.runtime.lastError) {
          state.isSelecting = false;
          state.errorMessage = chrome.runtime.lastError.message || 'Selection failed.';
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
          state.errorMessage = response && response.error ? response.error : 'No code returned.';
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

      chrome.tabs.sendMessage(tabs[0].id, { type: 'STOP_CODE_ELEMENT_SELECT' }, function() {
        state.isSelecting = false;
        state.errorMessage = '';
        self.render(window.CodePeekApp && window.CodePeekApp.pageData);
      });
    });
  },

  displayExtractedCode: function(data) {
    var self = this;
    var htmlField = document.getElementById('export-html');
    if (htmlField) {
      htmlField.value = data && data.html ? this.formatHtml(data.html) : '';
    }

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

    var jsSection = document.getElementById("inline-js-section");
    var jsContent = document.getElementById("inline-js-content");

    if (jsSection && jsContent) {
      jsContent.innerHTML = '';

      if (data && data.inlineJS && data.inlineJS.length > 0) {
        jsSection.classList.remove('hidden');

        for (var i = 0; i < data.inlineJS.length; i++) {
          (function(handler) {
            var itemDiv = document.createElement('div');
            itemDiv.className = 'js-item';

            var labelDiv = document.createElement('div');
            labelDiv.className = 'js-label';
            labelDiv.textContent = handler.attr;
            itemDiv.appendChild(labelDiv);

            var codeDiv = document.createElement('div');
            codeDiv.className = 'js-code';
            codeDiv.textContent = handler.value;
            itemDiv.appendChild(codeDiv);

            var copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn-small';
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
    return parts.map(function(part) { return ' ' + part.trim() + ';'; }).join('\n');
  },

  formatHtml: function(html) {
    var formatted = '';
    var pad = 0;
    var parts = html.split(/>\s*</);

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      var isLast = (i === parts.length - 1);

      if (part.charAt(0) === '/') {
        pad = Math.max(0, pad - 1);
      }

      formatted += this.getIndent(pad);

      var tag;
      if (parts.length === 1) {
        tag = part;
      } else {
        if (i === 0) { tag = part + '>'; }
        else if (isLast) { tag = '<' + part; }
        else { tag = '<' + part + '>'; }
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
    for (var i = 0; i < size; i++) { spaces += '  '; }
    return spaces;
  },

  escapeHtml: function(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  flashButton: function(btn, text) {
    var original = btn.textContent;
    btn.textContent = text;
    setTimeout(function() { btn.textContent = original; }, 1500);
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
