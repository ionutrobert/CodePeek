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
      container.innerHTML = '<div class="p-8 text-center text-slate-400">Select an element with the Inspect tool to export its code.</div>';
      return;
    }

    var rawHtml = app.lastInspected.html || '';
    var formatted = this.formatHtml(rawHtml);
    var escaped = this.escapeHtml(formatted);

    var html = '<div class="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Element Export</h3>';
    html += '<span class="text-xs text-slate-500">Raw HTML</span>';
    html += '</div>';
    html += '<div class="relative">';
    html += '<textarea id="export-html" class="w-full h-64 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" readonly>' + escaped + '</textarea>';
    html += '<button id="copy-html-btn" class="absolute top-2 right-2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Copy</button>';
    html += '</div>';
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
    // Very basic formatting: indent tags
    var formatted = '';
    var pad = 0;
    html.split(/>\s*</).forEach(function(node) {
      if (node.match(/^\/\w/)) pad -= 1;
      var indent = Math.max(pad, 0);
      formatted += '  '.repeat(indent) + '<' + node + '>\n';
      if (node.match(/^<?\w[^>]*[^\/]$/)) pad += 1;
    });
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
