// Typography Tab - Nothing Design System
var typographyTab = {
render: function (data) {
var container = document.getElementById("typography-content");
if (!container) return;

  if (!data || !data.typography || data.typography.length === 0) {
    var emptyHtml = '<div class="tab-content">';
    emptyHtml += '<div class="empty-state-enhanced">';
    emptyHtml += '<div class="empty-state-title">NO FONTS DETECTED</div>';
    emptyHtml += '<div class="empty-state-reason">Possible causes:</div>';
    emptyHtml += '<ul class="empty-state-list">';
    emptyHtml += '<li>System fonts only (inherits from OS)</li>';
    emptyHtml += '<li>Web fonts still loading</li>';
    emptyHtml += '<li>Dynamic font injection</li>';
    emptyHtml += '</ul>';
    emptyHtml += '<div class="empty-state-action">Refresh the page or use the element picker for details.</div>';
    emptyHtml += '</div>';
    emptyHtml += '</div>';
    container.innerHTML = emptyHtml;
    return;
  }

var html = '<div class="tab-content">';

html += '<div class="page-header">';
html += '<div class="page-title">TYPOGRAPHY</div>';
html += '<div class="page-subtitle">Font Families</div>';
html += '</div>';

var families = data.typography.slice(0);

// Sort families by total usage (most used first)
families.sort(function(a, b) {
var aUsage = a.totalCount || 0;
var bUsage = b.totalCount || 0;
return bUsage - aUsage;
});

  for (var i = 0; i < families.length; i++) {
  var group = families[i];
  var variants = (group.variants || []).slice(0);
  var displayName = group.name || group.family.split(",")[0].replace(/['"]/g, "");

  // Sort variants: weight ascending, then size descending
  variants.sort(function(a, b) {
  var weightA = parseInt(a.weight) || 400;
  var weightB = parseInt(b.weight) || 400;
  if (weightA !== weightB) return weightA - weightB;
  var sizeA = parseInt(a.size) || 16;
  var sizeB = parseInt(b.size) || 16;
  return sizeB - sizeA;
  });

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

  var cardId = 'font-card-' + i;
  var maxVisible = 3;
  var hasMany = variants.length > maxVisible;

  html += '<div class="card mb-md" id="' + cardId + '">';

  html += '<div class="flex-row flex-between mb-md">';
  html += '<div>';
  html += '<div class="text-label mb-xs">FAMILY</div>';
  html += '<div class="text-display-md" style="font-size: 24px;">' + this.escapeHtml(displayName) + '</div>';
  html += '</div>';
  html += '<div class="text-right">';
  html += '<div class="stat-value">' + variants.length + '</div>';
  html += '<div class="stat-label">VARIANTS</div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="flex-row flex-gap-md mb-md" style="padding-bottom: var(--space-md); border-bottom: 1px solid var(--border);">';
  html += '<div class="stat-row stat-row-borderless">';
  html += '<span class="stat-label">USAGES</span>';
  html += '<span class="stat-value">' + totalUsage + '</span>';
  html += '</div>';
  if (headingCount > 0) {
  html += '<div class="stat-row stat-row-borderless">';
  html += '<span class="stat-label">HEADINGS</span>';
  html += '<span class="stat-value">' + headingCount + '</span>';
  html += '</div>';
  }
  if (bodyCount > 0) {
  html += '<div class="stat-row stat-row-borderless">';
  html += '<span class="stat-label">BODY</span>';
  html += '<span class="stat-value">' + bodyCount + '</span>';
  html += '</div>';
  }
  html += '</div>';

  // Variants header - aligned with columns
  html += '<div class="variant-row mb-sm" style="padding: var(--space-xs) 0; border-bottom: 1px solid var(--border);">';
  html += '<div style="min-width: 80px;"><span class="text-label">WEIGHT</span></div>';
  html += '<div style="flex: 1; min-width: 120px;"><span class="text-label">TAG</span></div>';
  html += '<div style="min-width: 60px;"><span class="text-label">SIZE</span></div>';
  html += '<div style="min-width: 70px;"><span class="text-label">USAGE</span></div>';
  html += '<div style="min-width: 60px;"><span class="text-label">ROLE</span></div>';
  html += '</div>';

  for (var j = 0; j < variants.length; j++) {
  var v = variants[j];
  var weightName = this.getWeightName(v.weight);
  var isHeading = v.tag.indexOf("h") === 0;
  var isHidden = j >= maxVisible;

  html += '<div class="list-item' + (isHidden ? ' hidden-variant' : '') + ' variant-row"' + (isHidden ? ' style="display: none;"' : '') + ' data-card="' + cardId + '">';

  html += '<div style="min-width: 80px;">';
  html += '<span class="tag" style="' + (isHeading ? 'border-color: var(--text-display); color: var(--text-display);' : '') + '">' + v.weight + '</span>';
  html += '</div>';

  html += '<div style="flex: 1; min-width: 120px;">';
  html += '<span class="text-primary" style="font-weight: 500;">' + weightName.toUpperCase() + '</span>';
  html += '<span class="text-secondary ml-sm" style="font-size: var(--caption);">' + v.tag + '</span>';
  html += '</div>';

  html += '<div style="min-width: 60px;">';
  html += '<span class="text-mono">' + v.size + '</span>';
  html += '</div>';

  html += '<div style="min-width: 70px;">';
  html += '<span class="text-label">' + (v.count || 1) + '</span>';
  html += '</div>';

  html += '<div style="min-width: 60px;">';
  html += '<span class="text-label" style="' + (isHeading ? 'color: var(--text-display);' : '') + '">' + (isHeading ? 'HEADING' : 'BODY') + '</span>';
  html += '</div>';

  html += '</div>';
  }

  if (hasMany) {
  html += '<button class="link-btn show-more-variants mt-sm" data-card="' + cardId + '" data-expanded="false">SHOW ' + (variants.length - maxVisible) + ' MORE ↓</button>';
  }

  html += '</div>';
  }

html += '</div>';
container.innerHTML = html;

this.bindVariantToggles();
},

bindVariantToggles: function() {
var buttons = document.querySelectorAll('.show-more-variants');
for (var i = 0; i < buttons.length; i++) {
buttons[i].onclick = function() {
var cardId = this.getAttribute('data-card');
var expanded = this.getAttribute('data-expanded') === 'true';
var variants = document.querySelectorAll('[data-card="' + cardId + '"].hidden-variant');
for (var j = 0; j < variants.length; j++) {
variants[j].style.display = expanded ? 'none' : 'flex';
}
this.textContent = expanded ? this.textContent.replace('HIDE', 'SHOW').replace('↑', '↓') : 'HIDE ↑';
this.setAttribute('data-expanded', !expanded);
};
}
},

getWeightName: function (w) {
var weight = parseInt(w);
if (weight <= 100) return "Thin";
if (weight <= 200) return "ExtraLight";
if (weight <= 300) return "Light";
if (weight <= 400) return "Regular";
if (weight <= 500) return "Medium";
if (weight <= 600) return "SemiBold";
if (weight <= 700) return "Bold";
if (weight <= 800) return "ExtraBold";
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
