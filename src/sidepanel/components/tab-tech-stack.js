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

  var html = '<div class="tab-content">';

  // Standardized Page Header
  html += '<div class="neu-page-header">';
  html += '<div class="neu-section-dot"></div>';
  html += '<div>';
  html += '<h2 class="neu-page-title">Tech Stack</h2>';
  html += '<div class="neu-page-subtitle">Detected Technologies</div>';
  html += '</div>';
  html += '<span class="neu-badge">' + (data.confidence.overall || 0) + '% confidence</span>';
  html += '</div>';

  html += '<div class="space-y-6">';

    function makeSection(title, items) {
      if (!items || items.length === 0) return '';
      var h = '<div class="bg-white border border-slate-200 rounded-xl p-4">';
      h += '<h4 class="text-[11px] font-bold text-slate-500 uppercase mb-3">' + title + '</h4>';
      h += '<div class="flex flex-wrap gap-2">';
      items.forEach(function(item) {
        h += '<span class="px-3 py-1 bg-slate-200 text-slate-800 rounded-lg text-xs font-mono border border-slate-300">' + item + '</span>';
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
