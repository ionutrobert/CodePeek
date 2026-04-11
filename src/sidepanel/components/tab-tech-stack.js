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

    // Count total detected items
    var totalItems = 0;
    if (data.frameworks) totalItems += data.frameworks.length;
    if (data.css) totalItems += data.css.length;
    if (data.build) totalItems += data.build.length;
    if (data.cms) totalItems += data.cms.length;
    if (data.plugins) totalItems += data.plugins.length;

    var html = '<div class="tab-content">';

    // Standard page header
    html += '<div class="page-header">';
    html += '<div class="page-title">TECH STACK</div>';
    html += '<div class="page-subtitle">' + totalItems + ' technologies detected · ' + (data.confidence.overall || 0) + '% confidence</div>';
    html += '</div>';

    // Tech sections container
    html += '<div class="tech-sections">';

		if (data.frameworks && data.frameworks.length > 0) {
			html += this.makeSection('Frameworks', data.frameworks);
		}

		if (data.css && data.css.length > 0) {
			html += this.makeSection('CSS & UI', data.css);
		}

		if (data.build && data.build.length > 0) {
			html += this.makeSection('Build Tools', data.build);
		}

		if (data.cms && data.cms.length > 0) {
			html += this.makeCMSSection(data.cms);
		}

		if (data.plugins && data.plugins.length > 0) {
			html += this.makeSection('Libraries & Plugins', data.plugins);
		}

  if (totalItems === 0) {
    html += '<div class="empty-state-enhanced">';
    
    // Check if we have basic tech data
    if (data.basicTech) {
      var basic = data.basicTech;
      var hasAny = basic.hasStylesheets || basic.hasInlineStyles || basic.hasScripts || basic.hasInlineScripts;
      
      if (hasAny) {
        html += '<div class="empty-state-title">STATIC SITE</div>';
        html += '<div class="empty-state-reason mt-sm">No frameworks detected. Basic technologies:</div>';
        html += '<div class="tech-tags mt-md">';
        if (basic.hasStylesheets || basic.hasInlineStyles) {
          html += '<span class="tech-tag">' + (basic.totalStylesheets || 0) + ' Stylesheet' + (basic.totalStylesheets !== 1 ? 's' : '') + '</span>';
        }
        if (basic.hasInlineStyles) {
          html += '<span class="tech-tag">Inline CSS</span>';
        }
        if (basic.hasScripts) {
          html += '<span class="tech-tag">' + (basic.totalScripts || 0) + ' Script' + (basic.totalScripts !== 1 ? 's' : '') + '</span>';
        }
        if (basic.hasInlineScripts) {
          html += '<span class="tech-tag">Inline JS</span>';
        }
        html += '</div>';
      } else {
        html += '<div class="empty-state-title">NO TECHNOLOGIES DETECTED</div>';
        html += '<div class="empty-state-reason">This page has no detected frameworks or libraries.</div>';
      }
    } else {
      html += '<div class="empty-state-title">NO FRAMEWORKS DETECTED</div>';
      html += '<div class="empty-state-reason">This appears to be a static site without major frameworks.</div>';
    }
    
    html += '</div>';
  }

		html += '</div>';
		html += '</div>';

		container.innerHTML = html;
	},

  makeSection: function(title, items) {
    if (!items || items.length === 0) return '';
    var html = '<section class="section">';
    html += '<div class="section-label">' + title + '</div>';
    html += '<div class="tech-tags">';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var itemName = typeof item === 'string' ? item : (item.name || item);
      html += '<span class="tech-tag">' + this.escapeHtml(itemName) + '</span>';
    }
    html += '</div>';
    html += '</section>';
    return html;
  },

  makeCMSSection: function(cmsList) {
    if (!cmsList || cmsList.length === 0) return '';
    var html = '<section class="section">';
    html += '<div class="section-label">CMS & Platforms</div>';
    html += '<div class="cms-list">';
    for (var i = 0; i < cmsList.length; i++) {
      var cms = cmsList[i];
      var cmsName = typeof cms === 'string' ? cms : (cms.name || cms);
      html += '<div class="cms-item">';
      html += '<span class="cms-name">' + this.escapeHtml(cmsName) + '</span>';
      if (cms.plugins && cms.plugins.length > 0) {
        html += '<span class="cms-plugins-count">' + cms.plugins.length + ' plugins</span>';
        html += '<div class="cms-plugins">';
        for (var j = 0; j < Math.min(cms.plugins.length, 5); j++) {
          html += '<span class="plugin-tag">' + this.escapeHtml(cms.plugins[j]) + '</span>';
        }
        if (cms.plugins.length > 5) {
          html += '<span class="plugin-more">+' + (cms.plugins.length - 5) + ' more</span>';
        }
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '</section>';
    return html;
  },

	escapeHtml: function(str) {
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
};
