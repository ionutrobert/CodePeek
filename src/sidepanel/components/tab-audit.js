// Tab: Audit (Developer Mode)
// Nothing Design - Accessibility & Performance
var auditTab = {
  render: function(pageData) {
    var container = document.getElementById("audit-content");
    if (!container) return;

    if (typeof messaging !== "undefined") {
      messaging.sendMessage("EXTRACT_PAGE_DATA", {}, function(res) {
        if (res && res.success) {
          auditTab.display(res.data);
        } else {
          container.innerHTML = '<div class="error-state"><div class="error-message">Failed to audit page</div></div>';
        }
      });
    } else {
      container.innerHTML = '<div class="loading-state"><div class="loading-label">Loading...</div></div>';
    }
  },

  display: function(data) {
    auditTab.ensureCollapseStyles();
    var container = document.getElementById("audit-content");
    if (!container) return;

    var issues = data.contrastIssues || [];
    var totalAssets = (data.assets || []).length;

    var html = '<div class="audit-tab">';

    // Page Header
    html += '<div class="page-header">';
    html += '<div class="section-indicator"></div>';
    html += '<div class="header-text">';
    html += '<h1 class="page-title">Audit</h1>';
    html += '<p class="page-subtitle">Accessibility & Performance</p>';
    html += '</div>';
    html += '</div>';

    // Accessibility Section
    html += '<section class="audit-section">';
    html += this.buildCollapseHeader('audit-accessibility-content', 'Accessibility', true);
    html += '<div id="audit-accessibility-content" class="audit-collapse-content">';

    if (issues.length === 0) {
      html += '<div class="audit-pass">';
      html += '<div class="audit-pass-icon">✓</div>';
      html += '<div class="audit-pass-text">No contrast issues found</div>';
      html += '<div class="audit-pass-detail">All elements pass WCAG AA</div>';
      html += '</div>';
    } else {
      html += '<div class="audit-issues">';
      issues.forEach(function(issue) {
        var ratio = issue.ratio ? issue.ratio.toFixed(2) : 'N/A';
        html += '<div class="audit-issue">';
        html += '<div class="audit-issue-selector">' + auditTab.escapeHtml(issue.selector) + '</div>';
        html += '<div class="audit-issue-meta">';
        html += '<span class="audit-ratio">' + ratio + '</span>';
        html += '<div class="audit-badges">';
        html += '<span class="badge ' + (issue.aa ? 'pass' : 'fail') + '">AA ' + (issue.aa ? '✓' : '✗') + '</span>';
        html += '<span class="badge ' + (issue.aaa ? 'pass' : 'fail') + '">AAA ' + (issue.aaa ? '✓' : '✗') + '</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
    html += '</section>';

    // Performance Section
    var totalSizeKB = (data.size || 0) / 1024;
    var assetSizes = data.assets ? data.assets.filter(function(a) { return a.width && a.height; }) : [];
    var largeAssets = assetSizes.filter(function(a) { return (a.width * a.height) > 100000; });

    html += '<section class="audit-section">';
    html += this.buildCollapseHeader('audit-performance-content', 'Performance', true);
    html += '<div id="audit-performance-content" class="audit-collapse-content">';
    html += '<div class="metrics-grid">';
    html += '<div class="metric-item"><div class="metric-value">' + (data.stylesheets || 0) + '</div><div class="metric-label">Stylesheets</div></div>';
    html += '<div class="metric-item"><div class="metric-value">' + (data.rules || 0) + '</div><div class="metric-label">CSS Rules</div></div>';
    html += '<div class="metric-item"><div class="metric-value">' + (totalSizeKB > 1024 ? (totalSizeKB / 1024).toFixed(1) + 'MB' : totalSizeKB.toFixed(1) + 'KB') + '</div><div class="metric-label">Est. Size</div></div>';
    html += '<div class="metric-item"><div class="metric-value">' + totalAssets + '</div><div class="metric-label">Images</div></div>';
    html += '</div>';

    if (largeAssets.length > 0) {
      html += '<div class="audit-warning">' + largeAssets.length + ' large image(s) may affect performance</div>';
    }
    html += '</div>';
    html += '</section>';

    // Links Section
    html += '<section class="audit-section">';
    html += this.buildCollapseHeader('audit-links-content', 'Links', false);
    html += '<div id="audit-links-content" class="audit-collapse-content collapsed">';
    html += '<div class="loading-label">Checking internal links...</div>';
    html += '</div>';
    html += '</section>';

    html += '</div>';

    container.innerHTML = html;
    auditTab.setupCollapsibleSections(container);
    auditTab.fetchLinks();
  },

  buildCollapseHeader: function(targetId, title, expanded) {
    var ariaState = expanded ? 'true' : 'false';
    var chevronIcon = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
    return '<button type="button" class="collapse-trigger" data-collapse-target="' + targetId + '" aria-expanded="' + ariaState + '">' +
      '<div class="section-indicator"></div>' +
      '<span class="section-label">' + title + '</span>' +
      '<span class="collapse-icon' + (expanded ? '' : ' rotated') + '">' + chevronIcon + '</span>' +
      '</button>';
  },

  fetchLinks: function() {
    if (typeof messaging !== 'undefined') {
      messaging.sendMessage('CHECK_BROKEN_LINKS', {}, function(res) {
        var content = document.getElementById('audit-links-content');
        if (!content) return;

        var html = '';
        if (res && res.success && res.data) {
          var links = res.data;
          if (links.length === 0) {
            html = '<div class="empty-label">No internal links found</div>';
          } else {
            html = '<div class="section-info">' + links.length + ' internal link(s)</div>';
            html += '<div class="links-list">';
            links.forEach(function(link) {
              var displayUrl = link.url.length > 50 ? link.url.substring(0, 50) + '...' : link.url;
              html += '<div class="link-item">';
              html += '<div class="link-url" title="' + auditTab.escapeHtml(link.url) + '">' + auditTab.escapeHtml(displayUrl) + '</div>';
              if (link.text) {
                var displayText = link.text.length > 35 ? link.text.substring(0, 35) + '...' : link.text;
                html += '<div class="link-text">"' + auditTab.escapeHtml(displayText) + '"</div>';
              }
              html += '</div>';
            });
            html += '</div>';
          }
          content.innerHTML = html;
        } else {
          content.innerHTML = '<div class="status-error">Failed to check links</div>';
        }
      });
    }
  },

  ensureCollapseStyles: function() {
    if (document.getElementById('audit-collapse-styles')) return;
    var styleEl = document.createElement('style');
    styleEl.id = 'audit-collapse-styles';
    styleEl.textContent = '.collapse-trigger{width:100%;border:none;background:transparent;padding:0;display:flex;align-items:center;gap:var(--space-sm);cursor:pointer;}.collapse-trigger .section-indicator{flex-shrink:0;}.collapse-trigger .section-label{flex:1;font-family:var(--font-mono);font-size:var(--label);text-transform:uppercase;letter-spacing:0.08em;color:var(--text-secondary);}.collapse-trigger:focus-visible{outline:2px solid var(--text-primary);outline-offset:2px;}.collapse-icon{display:inline-flex;align-items:center;justify-content:center;color:var(--text-secondary);transition:transform var(--duration-normal) var(--ease-out);}.collapse-icon.rotated{transform:rotate(-90deg);}.audit-collapse-content{overflow:hidden;max-height:999px;opacity:1;transition:max-height var(--duration-normal) var(--ease-out),opacity var(--duration-normal) var(--ease-out);}.audit-collapse-content.collapsed{max-height:0;opacity:0;}';
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
      var icon = trigger.querySelector('.collapse-icon');
      var collapsed = target.classList.contains('collapsed');
      trigger.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      target.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
      if (trigger.dataset.collapseInit) return;
      trigger.addEventListener('click', function() {
        var isCollapsed = target.classList.toggle('collapsed');
        target.setAttribute('aria-hidden', isCollapsed ? 'true' : 'false');
        trigger.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        if (icon) { icon.classList.toggle('rotated', isCollapsed); }
      });
      trigger.dataset.collapseInit = 'true';
    });
  },

  escapeHtml: function(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};
