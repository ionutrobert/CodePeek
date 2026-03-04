// Tab: Audit (Developer Mode)
// Accessibility & performance quick checks
var auditTab = {
  render: function(pageData) {
    var container = document.getElementById("audit-content");
    if (!container) return;

    // Request page stats to get contrast issues etc.
    if (typeof messaging !== 'undefined') {
      messaging.sendMessage('EXTRACT_PAGE_DATA', {}, function(res) {
        if (res && res.success) {
          auditTab.display(res.data);
        } else {
          container.innerHTML = '<div class="p-4 text-red-500">Failed to audit page. Ensure page is loaded.</div>';
        }
      });
    } else {
      container.innerHTML = '<div class="p-4 text-slate-500">Messaging not ready.</div>';
    }
  },

  display: function(data) {
    var container = document.getElementById("audit-content");
    if (!container) return;

    var issues = data.contrastIssues || [];
    var stats = data.stylesheets || {};
    var totalAssets = (data.assets || []).length;

    var html = '<div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">';

    // Accessibility Section
    html += '<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">';
    html += '<h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-3">Accessibility</h3>';
    if (issues.length === 0) {
      html += '<div class="flex items-center gap-2 text-green-600 dark:text-green-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> No contrast issues found!</div>';
    } else {
      html += '<div class="space-y-2">';
      issues.forEach(function(issue) {
        var ratio = issue.ratio ? issue.ratio.toFixed(2) : 'N/A';
        var aa = issue.aa ? 'text-green-600' : 'text-red-500';
        var aaa = issue.aaa ? 'text-green-600' : 'text-red-500';
        html += '<div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">';
        html += '<div class="text-xs font-mono text-slate-600 dark:text-slate-400">' + issue.selector + '</div>';
        html += '<div class="text-xs">Ratio: <span class="font-bold">' + ratio + '</span></div>';
        html += '<div class="text-xs">AA: <span class="' + aa + '">' + (issue.aa ? '✓' : '✗') + '</span>, AAA: <span class="' + aaa + '">' + (issue.aaa ? '✓' : '✗') + '</span></div>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';

    // Performance Section (basic)
    var totalSizeKB = (stats.size || 0) / 1024;
    var assetSizes = data.assets ? data.assets.filter(a => a.width && a.height) : [];
    var largeAssets = assetSizes.filter(a => (a.width * a.height) > 100000); // >0.1MP

    html += '<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mt-4">';
    html += '<h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-3">Performance</h3>';
    html += '<div class="grid grid-cols-2 gap-4 text-xs">';
    html += '<div><span class="text-slate-500">Stylesheets</span><div class="text-lg font-bold">' + (stats.stylesheets || 0) + '</div></div>';
    html += '<div><span class="text-slate-500">CSS Rules</span><div class="text-lg font-bold">' + (stats.rules || 0) + '</div></div>';
    html += '<div><span class="text-slate-500">Est. CSS Size</span><div class="text-lg font-bold">' + (totalSizeKB > 1024 ? (totalSizeKB/1024).toFixed(1) + ' MB' : totalSizeKB.toFixed(1) + ' KB') + '</div></div>';
    html += '<div><span class="text-slate-500">Images</span><div class="text-lg font-bold">' + data.assets.length + '</div></div>';
    html += '</div>';
    if (largeAssets.length > 0) {
      html += '<div class="mt-3 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">';
      html += '⚠️ ' + largeAssets.length + ' large image(s) may affect performance.';
      html += '</div>';
    }
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }
};