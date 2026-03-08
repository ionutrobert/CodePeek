// Tab: Code Snippets (Developer Mode)
// Export element as HTML/CSS/React/Vue
var codeSnippetsTab = {
  render: function(pageData) {
    var container = document.getElementById("code-snippets-content");
    if (!container) return;
    container.innerHTML = '';

    // Check if an element is selected
    var app = window.CodePeekApp;
    if (!app || !app.lastInspected || !app.lastInspected.html) {
      container.innerHTML = '<div class="p-8 text-center text-slate-500">Select an element with the Inspect tool to export its code.</div>';
      return;
    }

    var rawHtml = app.lastInspected.html || '';
    var formatted = this.formatHtml(rawHtml);
    var escaped = this.escapeHtml(formatted);

    var html = '<div class="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">';
html += '<div class="flex items-center justify-between mb-2">';
html += '<h3 class="text-sm font-black text-slate-800 uppercase tracking-wider">Element Export</h3>';
html += '<button id="copy-html-btn" class="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">Copy</button>';
html += '</div>';
html += '<textarea id="export-html" class="w-full h-64 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" readonly>' + escaped + '</textarea>';
    html += '<div class="text-xs text-slate-500 italic">Note: This copies the raw HTML of the selected element. Inlining computed styles is coming soon.</div>';
    html += '</div>';

    container.innerHTML = html;

    var self = this;
    var copyBtn = document.getElementById("copy-html-btn");
    if (copyBtn) {
      copyBtn.onclick = function() {
        self.copyToClipboard(formatted, copyBtn);
      };
    }
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
      
      formatted += '  '.repeat(pad);
      
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

  escapeHtml: function(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
