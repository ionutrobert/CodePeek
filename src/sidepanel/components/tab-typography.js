// Typography Tab - Nothing Design System
var typographyTab = {
  render: function (data) {
    var container = document.getElementById("typography-content");
    if (!container) return;

    if (!data || !data.typography || data.typography.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-title">NO FONTS DETECTED</div></div>';
      return;
    }

    var html = '<div class="tab-content">';

    // Page Header
    html += '<div class="page-header">';
    html += '<div class="page-title">TYPOGRAPHY</div>';
    html += '<div class="page-subtitle">Font Families</div>';
    html += '</div>';

    var families = data.typography;

    for (var i = 0; i < families.length; i++) {
      var group = families[i];
      var variants = group.variants || [];
      var displayName = group.name || group.family.split(",")[0].replace(/['"]/g, "");
      var headingCount = 0;
      var bodyCount = 0;
      var totalUsage = 0;

      for (var k = 0; k < variants.length; k++) {
        var variantUsage = parseInt(variants[k].count, 10) || 1;
        totalUsage += variantUsage;
        if (variants[k].tag.indexOf("h") === 0) {
          headingCount += variantUsage;
        } else {
          bodyCount += variantUsage;
        }
      }

      // Font Family Card
      html += '<div class="card" style="margin-bottom: var(--space-md);">';
      
      // Header
      html += '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-md);">';
      html += '<div>';
      html += '<div class="text-label" style="margin-bottom: var(--space-xs);">FAMILY</div>';
      html += '<div class="text-display-md" style="font-size: 24px;">' + this.escapeHtml(displayName) + '</div>';
      html += '</div>';
      html += '<div style="text-align: right;">';
      html += '<div class="stat-value">' + variants.length + '</div>';
      html += '<div class="stat-label">VARIANTS</div>';
      html += '</div>';
      html += '</div>';

      // Stats row
      html += '<div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-md); padding-bottom: var(--space-md); border-bottom: 1px solid var(--border);">';
      html += '<div class="stat-row" style="border: none; flex: 1;">';
      html += '<span class="stat-label">USAGES</span>';
      html += '<span class="stat-value">' + totalUsage + '</span>';
      html += '</div>';
      if (headingCount > 0) {
        html += '<div class="stat-row" style="border: none; flex: 1;">';
        html += '<span class="stat-label">HEADINGS</span>';
        html += '<span class="stat-value">' + headingCount + '</span>';
        html += '</div>';
      }
      if (bodyCount > 0) {
        html += '<div class="stat-row" style="border: none; flex: 1;">';
        html += '<span class="stat-label">BODY</span>';
        html += '<span class="stat-value">' + bodyCount + '</span>';
        html += '</div>';
      }
      html += '</div>';

      // Preview
      html += '<div style="padding: var(--space-lg); background-color: var(--surface-raised); border-radius: var(--radius-md); text-align: center; margin-bottom: var(--space-md);">';
      html += '<span style="font-size: 32px; font-family: ' + group.family + '; color: var(--text-primary);">ABCabc123</span>';
      html += '</div>';

      // Variants Section Header
      html += '<div class="section-header" style="margin-bottom: var(--space-sm);">';
      html += '<div class="section-label">VARIANTS</div>';
      html += '<div class="text-label" style="color: var(--text-disabled);">WEIGHT, TAG, SIZE</div>';
      html += '</div>';

      // Variants List
      for (var j = 0; j < variants.length; j++) {
        var v = variants[j];
        var weightName = this.getWeightName(v.weight);
        var isHeading = v.tag.indexOf("h") === 0;

        html += '<div class="list-item" style="flex-wrap: wrap; gap: var(--space-sm);">';
        
        // Weight Badge
        html += '<div style="display: flex; align-items: center; gap: var(--space-sm); min-width: 80px;">';
        html += '<span class="tag" style="' + (isHeading ? 'border-color: var(--text-display); color: var(--text-display);' : '') + '">' + v.weight + '</span>';
        html += '</div>';

        // Info
        html += '<div style="flex: 1; min-width: 120px;">';
        html += '<span class="text-primary" style="font-weight: 500;">' + weightName.toUpperCase() + '</span>';
        html += '<span class="text-secondary" style="margin-left: var(--space-sm); font-size: var(--caption);">' + v.tag + '</span>';
        html += '</div>';

        // Size
        html += '<div class="text-mono" style="color: var(--text-primary);">' + v.size + '</div>';

        // Usage count
        html += '<div class="text-label">' + (v.count || 1) + ' USAGES</div>';

        // Role indicator
        html += '<div style="min-width: 60px;">';
        html += '<span class="text-label" style="' + (isHeading ? 'color: var(--text-display);' : '') + '">' + (isHeading ? 'HEADING' : 'BODY') + '</span>';
        html += '</div>';

        html += '</div>';
      }

      html += '</div>'; // card
    }

    html += '</div>';
    container.innerHTML = html;
  },

  getWeightName: function (w) {
    var weight = parseInt(w);
    if (weight <= 300) return "Light";
    if (weight <= 400) return "Regular";
    if (weight <= 500) return "Medium";
    if (weight <= 600) return "SemiBold";
    if (weight <= 700) return "Bold";
    return "Black";
  },

  escapeHtml: function (str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
};
