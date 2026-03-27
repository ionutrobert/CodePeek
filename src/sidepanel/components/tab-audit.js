// Tab: Audit (Developer Mode)
// Accessibility & performance quick checks
var auditTab = {
  render: function(pageData) {
    var container = document.getElementById("audit-content");
    if (!container) return;

    // Request page stats to get contrast issues etc.
    if (typeof messaging !== "undefined") {
      messaging.sendMessage("EXTRACT_PAGE_DATA", {}, function(res) {
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
    auditTab.ensureCollapseStyles();
    var container = document.getElementById("audit-content");
    if (!container) return;

    var issues = data.contrastIssues || [];
    var totalAssets = (data.assets || []).length;

    var html = '<div class="tab-content">';

    // Standardized Page Header
    html += '<div class="neu-page-header">';
    html += '<div class="neu-section-dot"></div>';
    html += '<div>';
    html += '<h2 class="neu-page-title">Audit</h2>';
    html += '<div class="neu-page-subtitle">Accessibility & Performance</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="space-y-6">';

    var chevronIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6"></path></svg>';
    var buildCollapseHeader = function(targetId, title, expanded) {
      var ariaState = expanded ? 'true' : 'false';
      return '<button type="button" class="neu-section-header audit-collapse-trigger" data-collapse-target="' + targetId + '" style="margin-bottom: 12px;" aria-expanded="' + ariaState + '"><div class="neu-section-dot"></div><div class="neu-section-title">' + title + '</div><span class="audit-collapse-icon" aria-hidden="true">' + chevronIcon + '</span></button>';
    };

    // Accessibility Section
    html += '<div class="neu-card" style="padding: 20px;">';
    html += buildCollapseHeader('audit-accessibility-content', 'Accessibility', true);
    html += '<div id="audit-accessibility-content" class="audit-collapse-content">';
    if (issues.length === 0) {
      html += '<div class="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl"><div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div><div><div class="text-sm font-bold text-green-800">No Issues Found</div><div class="text-xs text-green-600">All elements pass WCAG AA contrast standards.</div></div></div>';
    } else {
      html += '<div class="space-y-2">';
      issues.forEach(function(issue) {
        var ratio = issue.ratio ? issue.ratio.toFixed(2) : 'N/A';
        var aa = issue.aa ? 'text-green-600' : 'text-red-500';
        var aaa = issue.aaa ? 'text-green-600' : 'text-red-500';
        html += '<div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">';
        html += '<div class="text-xs font-mono text-slate-600">' + issue.selector + '</div>';
        html += '<div class="text-xs text-slate-500">Ratio: <span class="font-bold text-slate-700">' + ratio + '</span></div>';
        html += '<div class="text-xs">AA: <span class="' + aa + '">' + (issue.aa ? '✓' : '✗') + '</span>, AAA: <span class="' + aaa + '">' + (issue.aaa ? '✓' : '✗') + '</span></div>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div></div>';

    // Performance Section (basic)
    var totalSizeKB = (data.size || 0) / 1024;
    var assetSizes = data.assets ? data.assets.filter(function(a) { return a.width && a.height; }) : [];
    var largeAssets = assetSizes.filter(function(a) { return (a.width * a.height) > 100000; }); // >0.1MP

    html += '<div class="bg-white border border-slate-200 rounded-xl p-4 mt-4">';
    html += buildCollapseHeader('audit-performance-content', 'Performance', true);
    html += '<div id="audit-performance-content" class="audit-collapse-content">';
    html += '<div class="grid grid-cols-2 gap-4 text-xs">';
    html += '<div><span class="text-slate-500">Stylesheets</span><div class="text-lg font-bold text-slate-900">' + (data.stylesheets || 0) + '</div></div>';
    html += '<div><span class="text-slate-500">CSS Rules</span><div class="text-lg font-bold text-slate-900">' + (data.rules || 0) + '</div></div>';
    html += '<div><span class="text-slate-500">Est. CSS Size</span><div class="text-lg font-bold text-slate-900">' + (totalSizeKB > 1024 ? (totalSizeKB / 1024).toFixed(1) + ' MB' : totalSizeKB.toFixed(1) + ' KB') + '</div></div>';
    html += '<div><span class="text-slate-500">Images</span><div class="text-lg font-bold text-slate-900">' + totalAssets + '</div></div>';
    html += '</div>';
    if (largeAssets.length > 0) {
      html += '<div class="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">';
      html += '⚠️ ' + largeAssets.length + ' large image(s) may affect performance.';
      html += '</div>';
    }
    html += '</div></div>';

    // Links section placeholder for Task 8
    html += '<div class="bg-white border border-slate-200 rounded-xl p-4 mt-4">';
    html += buildCollapseHeader('audit-links-content', 'Links', false);
    html += '<div id="audit-links-content" class="audit-collapse-content collapsed">';
    html += '<div class="text-xs text-slate-500">Checking internal links...</div>';
    html += '</div></div>';

    html += '</div>';
    container.innerHTML = html;
    auditTab.setupCollapsibleSections(container);
    auditTab.fetchLinks();
  },

  fetchLinks: function() {
    if (typeof messaging !== 'undefined') {
      messaging.sendMessage('CHECK_BROKEN_LINKS', {}, function(res) {
        var content = document.getElementById('audit-links-content');
        var links;
        var html;
        if (!content) return;

        if (res && res.success && res.data) {
          links = res.data;
          html = '';
          if (links.length === 0) {
            html = '<div class="text-xs text-slate-500">No internal links found on this page.</div>';
          } else {
            html = '<div class="text-xs text-slate-500 mb-2">' + links.length + ' internal link(s) found</div>';
            html += '<div class="space-y-1 max-h-48 overflow-y-auto">';
            links.forEach(function(link) {
              var displayUrl = link.url.length > 60 ? link.url.substring(0, 60) + '...' : link.url;
              var displayText;
              html += '<div class="py-1 border-b border-slate-100 last:border-0">';
              html += '<div class="text-xs font-mono text-slate-600 truncate" title="' + link.url + '">' + displayUrl + '</div>';
              if (link.text) {
                displayText = link.text.length > 40 ? link.text.substring(0, 40) + '...' : link.text;
                html += '<div class="text-xs text-slate-400 truncate">"' + displayText + '"</div>';
              }
              html += '</div>';
            });
            html += '</div>';
          }
          content.innerHTML = html;
        } else {
          content.innerHTML = '<div class="text-xs text-red-500">Failed to check links.</div>';
        }
      });
    }
  },

  ensureCollapseStyles: function() {
    if (document.getElementById('audit-collapse-styles')) return;
    var styleEl = document.createElement('style');
    styleEl.id = 'audit-collapse-styles';
    styleEl.textContent = '.audit-collapse-trigger{width:100%;border:none;background:transparent;padding:0;display:flex;align-items:center;gap:0.75rem;cursor:pointer;}.audit-collapse-trigger .neu-section-dot{flex-shrink:0;}.audit-collapse-trigger .neu-section-title{flex:1;font-weight:600;}.audit-collapse-trigger:focus-visible{outline:2px solid #2563eb;outline-offset:3px;}.audit-collapse-icon{margin-left:auto;display:inline-flex;align-items:center;justify-content:center;transition:transform .3s ease;}.audit-collapse-icon.rotated{transform:rotate(-90deg);}.audit-collapse-content{overflow:hidden;max-height:999px;opacity:1;transition:max-height .28s ease,opacity .28s ease;}.audit-collapse-content.collapsed{max-height:0;opacity:0;}';
    document.head.appendChild(styleEl);
  },

  setupCollapsibleSections: function(parent) {
    if (!parent) return;
    var triggers = parent.querySelectorAll('[data-collapse-target]');
    triggers.forEach(function(trigger) {
      var targetId = trigger.getAttribute('data-collapse-target');
      if (!targetId) return;
      var target = parent.querySelector('#' + targetId);
      if (!target) return;
      var icon = trigger.querySelector('.audit-collapse-icon');
      var collapsed = target.classList.contains('collapsed');
      trigger.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      target.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
      if (icon) {
        icon.classList.toggle('rotated', collapsed);
      }
      if (trigger.dataset.collapseInit) return;
      trigger.addEventListener('click', function() {
        var isCollapsed = target.classList.toggle('collapsed');
        target.setAttribute('aria-hidden', isCollapsed ? 'true' : 'false');
        trigger.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        if (icon) {
          icon.classList.toggle('rotated', isCollapsed);
        }
      });
      trigger.dataset.collapseInit = 'true';
    });
  }
};
