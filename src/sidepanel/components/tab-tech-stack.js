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

    function makeCMSSection(cmsList) {
      if (!cmsList || cmsList.length === 0) return '';
      var h = '<div class="bg-white border border-slate-200 rounded-xl p-4">';
      h += '<h4 class="text-[11px] font-bold text-slate-500 uppercase mb-3">CMS & Platforms</h4>';
      h += '<div class="space-y-3">';
      cmsList.forEach(function(cms) {
        h += '<div class="flex items-center gap-2">';
        h += '<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-mono border border-blue-200">' + cms.name + '</span>';
        if (cms.plugins && cms.plugins.length > 0) {
          h += '<span class="text-[10px] text-slate-500">' + cms.plugins.length + ' plugins</span>';
        }
        h += '</div>';
        if (cms.plugins && cms.plugins.length > 0) {
          h += '<div class="ml-4 mt-2 flex flex-wrap gap-1">';
          cms.plugins.slice(0, 5).forEach(function(plugin) {
            h += '<span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">' + plugin + '</span>';
          });
          if (cms.plugins.length > 5) {
            h += '<span class="px-2 py-0.5 text-slate-400 text-[10px]">+' + (cms.plugins.length - 5) + ' more</span>';
          }
          h += '</div>';
        }
      });
      h += '</div></div>';
      return h;
    }

    html += makeSection('Frameworks', data.frameworks);
    html += makeSection('CSS & UI Libraries', data.css);
    html += makeSection('Build Tools', data.build);
    html += makeCMSSection(data.cms);
    html += makeSection('Plugins & Extensions', data.plugins);

    if (data.frameworks.length === 0 && data.css.length === 0 && data.build.length === 0 && (!data.cms || data.cms.length === 0) && (!data.plugins || data.plugins.length === 0)) {
      html += '<div class="p-4 text-slate-500 text-center">No obvious tech stack detected. The site might be using custom or less common tools.</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }
};
