// Tab: Tech Stack (Developer Mode)
// Nothing Design - Detected Technologies
var techStackTab = {
  render: function(pageData) {
    var container = document.getElementById("tech-stack-content");
    if (!container) return;

    if (typeof messaging !== 'undefined') {
      messaging.sendMessage('GET_TECH_STACK', {}, function(res) {
        if (res && res.success) {
          techStackTab.display(res.data);
        } else {
          container.innerHTML = '<div class="error-state"><div class="error-message">Failed to detect tech stack</div></div>';
        }
      });
    } else {
      container.innerHTML = '<div class="loading-state"><div class="loading-label">Loading...</div></div>';
    }
  },

  display: function(data) {
    var container = document.getElementById("tech-stack-content");
    if (!container) return;

    var html = '<div class="tech-stack-tab">';

    // Page Header
    html += '<div class="page-header">';
    html += '<div class="section-indicator"></div>';
    html += '<div class="header-text">';
    html += '<h1 class="page-title">Tech Stack</h1>';
    html += '<p class="page-subtitle">Detected Technologies</p>';
    html += '</div>';
    html += '<div class="confidence-badge">' + (data.confidence.overall || 0) + '%</div>';
    html += '</div>';

    html += '<div class="tech-sections">';

    html += this.makeSection('Frameworks', data.frameworks);
    html += this.makeSection('CSS & UI', data.css);
    html += this.makeSection('Build Tools', data.build);
    html += this.makeCMSSection(data.cms);
    html += this.makeSection('Plugins', data.plugins);

    if (data.frameworks.length === 0 && data.css.length === 0 && data.build.length === 0 && (!data.cms || data.cms.length === 0) && (!data.plugins || data.plugins.length === 0)) {
      html += '<div class="empty-label">No tech stack detected</div>';
    }

    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
  },

  makeSection: function(title, items) {
    if (!items || items.length === 0) return '';
    var html = '<section class="tech-section">';
    html += '<div class="section-label">' + title + '</div>';
    html += '<div class="tech-tags">';
    items.forEach(function(item) {
      html += '<span class="tech-tag">' + this.escapeHtml(item) + '</span>';
    }, this);
    html += '</div>';
    html += '</section>';
    return html;
  },

  makeCMSSection: function(cmsList) {
    if (!cmsList || cmsList.length === 0) return '';
    var html = '<section class="tech-section">';
    html += '<div class="section-label">CMS & Platforms</div>';
    html += '<div class="cms-list">';
    cmsList.forEach(function(cms) {
      html += '<div class="cms-item">';
      html += '<span class="cms-name">' + this.escapeHtml(cms.name) + '</span>';
      if (cms.plugins && cms.plugins.length > 0) {
        html += '<span class="cms-plugin-count">' + cms.plugins.length + ' plugins</span>';
        html += '<div class="cms-plugins">';
        cms.plugins.slice(0, 5).forEach(function(plugin) {
          html += '<span class="plugin-tag">' + this.escapeHtml(plugin) + '</span>';
        }, this);
        if (cms.plugins.length > 5) {
          html += '<span class="plugin-more">+' + (cms.plugins.length - 5) + '</span>';
        }
        html += '</div>';
      }
      html += '</div>';
    }, this);
    html += '</div>';
    html += '</section>';
    return html;
  },

  escapeHtml: function(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};
