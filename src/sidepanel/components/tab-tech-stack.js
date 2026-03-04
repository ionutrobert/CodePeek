// Tab: Tech Stack (Developer Mode)
// Detects frameworks, libraries, build tools
var techStackTab = {
  render: function(pageData) {
    var container = document.getElementById("tech-stack-content");
    if (!container) return;

    // Request tech stack from content script
    if (typeof messaging !== 'undefined') {
      messaging.sendMessage('GET_TECH_STACK', {}, function(res) {
        if (res && res.success) {
          techStackTab.display(res.data);
        } else {
          container.innerHTML = '<div class="p-4 text-red-500">Failed to detect tech stack. Try inspecting the page first.</div>';
        }
      });
    } else {
      container.innerHTML = '<div class="p-4 text-slate-500">Messaging not ready.</div>';
    }
  },

  display: function(data) {
    var container = document.getElementById("tech-stack-content");
    if (!container) return;

    var html = '<div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">';
    
    // Header
    html += '<div class="flex items-center justify-between mb-4">';
    html += '<h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Detected Stack</h3>';
    html += '<span class="px-2 py-1 bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 text-xs font-bold rounded">' + (data.confidence.overall || 0) + '% confident</span>';
    html += '</div>';
    
    function makeSection(title, items) {
      if (!items || items.length === 0) return '';
      var h = '<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">';
      h += '<h4 class="text-[11px] font-bold text-slate-500 uppercase mb-3">' + title + '</h4>';
      h += '<div class="flex flex-wrap gap-2">';
      items.forEach(function(item) {
        h += '<span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono">' + item + '</span>';
      });
      h += '</div></div>';
      return h;
    }
    
    html += makeSection('Frameworks', data.frameworks);
    html += makeSection('CSS & UI Libraries', data.css);
    html += makeSection('Build Tools', data.build);
    
    if (data.frameworks.length === 0 && data.css.length === 0 && data.build.length === 0) {
      html += '<div class="p-4 text-slate-500 text-center">No obvious tech stack detected. The site might be using custom or less common tools.</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
  }
};
