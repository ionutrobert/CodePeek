// Typography Tab - Premium Nested Layout (V2)
var typographyTab = {
  render: function (data) {
    var container;
    var html;
    var families;
    var i;
    var group;
    var variants;
    var displayName;
    var headingCount;
    var bodyCount;
    var totalUsage;
    var k;
    var variantUsage;
    var j;
    var v;
    var weightName;
    var isHeading;
    var usageLabel;
    var usageToneClass;
    var weightToneClass;

    this.ensureHierarchyStyles();
    container = document.getElementById("typography-content");
    if (!container) return;

    if (!data || !data.typography || data.typography.length === 0) {
      container.innerHTML =
        '<div class="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] opacity-60">No fonts detected</div>';
      return;
    }

    html =
      '<div class="tab-content">';

    html += '<div class="neu-page-header">';
    html += '<div class="neu-section-dot"></div>';
    html += '<div>';
    html += '<h2 class="neu-page-title">Typography</h2>';
    html += '<div class="neu-page-subtitle">Font Families</div>';
    html += '</div>';
    html += '</div>';

    families = data.typography;

    for (i = 0; i < families.length; i++) {
      group = families[i];
      variants = group.variants || [];
      displayName =
        group.name || group.family.split(",")[0].replace(/['"]/g, "");
      headingCount = 0;
      bodyCount = 0;
      totalUsage = 0;

      for (k = 0; k < variants.length; k++) {
        variantUsage = parseInt(variants[k].count, 10) || 1;
        totalUsage += variantUsage;
        if (variants[k].tag.indexOf("h") === 0) {
          headingCount += variantUsage;
        } else {
          bodyCount += variantUsage;
        }
      }

      html += '<div class="font-group font-group-wrap">';

      html += '<details class="typography-family-group p-6 bg-white border border-slate-200 rounded-[32px] shadow-sm mb-6 hover:border-brand-200 transition-all group"' +
        (i === 0 ? ' open' : '') +
        '>';
      html += '<summary class="typography-family-summary">';
      html += '<div class="flex items-start justify-between gap-4">';
      html += '<div class="min-w-0">';
      html +=
        '<div class="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1.5">FAMILY</div>';
      html +=
        '<h3 class="text-2xl font-black text-slate-900 tracking-tighter">' +
        displayName +
        "</h3>";
      html += '<div class="flex flex-wrap items-center gap-2 mt-3">';
      html +=
        '<span class="bg-brand-50 text-brand-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">' +
        variants.length +
        ' variants</span>';
      html +=
        '<span class="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">' +
        totalUsage +
        ' usages</span>';
      if (headingCount > 0) {
        html +=
          '<span class="bg-brand-50/70 text-brand-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Heading ' +
          headingCount +
          '</span>';
      }
      if (bodyCount > 0) {
        html +=
          '<span class="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Body ' +
          bodyCount +
          '</span>';
      }
      html += '</div>';
      html += '</div>';
      html += '<div class="flex items-center gap-3 shrink-0">';
      html += '<div class="typography-family-toggle flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 border border-slate-200 shadow-sm">';
      html += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</summary>';

      html += '<div class="typography-family-content">';

      html +=
        '<div class="py-8 px-5 bg-slate-50/50 rounded-2xl text-center overflow-hidden mb-6 border border-white/50 backdrop-blur-sm relative">';
      html +=
        '<span class="text-4xl tracking-tighter text-slate-800 whitespace-nowrap" style="font-family:' +
        group.family +
        '">ABCabc123 &!$</span>';
      html += "</div>";

      html += '<div class="space-y-3">';
      html += '<div class="flex items-center justify-between gap-3 px-1">';
      html += '<div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Variants</div>';
      html += '<div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight, tag, size, usage</div>';
      html += '</div>';

      for (j = 0; j < variants.length; j++) {
        v = variants[j];
        weightName = this.getWeightName(v.weight);
        isHeading = v.tag.indexOf("h") === 0;
        usageLabel = isHeading ? "Heading" : "Body";
        usageToneClass = isHeading
          ? "bg-brand-50 text-brand-600 border-brand-100"
          : "bg-slate-50 text-slate-600 border-slate-200";
        weightToneClass = isHeading
          ? "bg-brand-50 text-brand-600 border-brand-100"
          : "bg-slate-50 text-slate-700 border-slate-100";

        html +=
          '<div class="typography-variant-card ' +
          (isHeading ? 'typography-variant-card-heading' : 'typography-variant-card-body') +
          ' p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-brand-300 transition-all mb-4 last:mb-0">';
        html += '<div class="flex items-start justify-between gap-4">';
        html += '<div class="flex items-center gap-4 min-w-0">';

        html +=
          '<div class="typography-variant-weight w-12 h-12 rounded-2xl flex items-center justify-center text-[11px] font-black ' +
          weightToneClass +
          ' border shadow-sm transition-transform">' +
          v.weight +
          "</div>";

        html += '<div class="min-w-0">';
        html += '<div class="flex flex-wrap items-center gap-2 mb-2">';
        html +=
          '<span class="text-[11px] font-black text-slate-900 uppercase tracking-widest">' +
          weightName.toUpperCase() +
          "</span>";
        html +=
          '<span class="px-1.5 py-0.5 bg-slate-100 text-[8px] font-black text-slate-400 rounded-sm uppercase tracking-tighter">' +
          v.tag +
          "</span>";
        html +=
          '<span class="px-2 py-0.5 text-[8px] font-black rounded-full uppercase tracking-widest border ' +
          usageToneClass +
          '">' +
          usageLabel +
          '</span>';
        html += "</div>";
        html += '<div class="flex flex-wrap items-center gap-2">';
        html +=
          '<span class="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-none">' +
          v.size +
          '</span>';
        html +=
          '<span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">' +
          (v.count || 1) +
          ' usages</span>';
        html += '</div>';
        html += "</div>";
        html += "</div>";
        html += '<div class="text-right shrink-0">';
        html += '<div class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</div>';
        html +=
          '<div class="text-sm font-black ' +
          (isHeading ? 'text-brand-600' : 'text-slate-600') +
          '">' +
          usageLabel +
          '</div>';
        html += '</div>';
        html += "</div>";
      }

      html += "</div>";
      html += "</div>";
      html += "</details>";
      html += "</div>";
    }

    html += "</div>";
    container.innerHTML = html;
  },

  getWeightName: function (w) {
    w = parseInt(w);
    if (w <= 300) return "Light";
    if (w <= 400) return "Regular";
    if (w <= 500) return "Medium";
    if (w <= 600) return "SemiBold";
    if (w <= 700) return "Bold";
    return "Black";
  },

  ensureHierarchyStyles: function () {
    if (document.getElementById("typography-hierarchy-styles")) return;

    var styleEl = document.createElement("style");
    styleEl.id = "typography-hierarchy-styles";
    styleEl.textContent =
      '.typography-family-group{display:block;overflow:hidden;}' +
      '.typography-family-summary{list-style:none;cursor:pointer;display:block;}' +
      '.typography-family-summary::-webkit-details-marker{display:none;}' +
      '.typography-family-summary:focus-visible{outline:2px solid var(--brand-500);outline-offset:4px;border-radius:24px;}' +
      '.typography-family-toggle{transition:transform .25s ease,background-color .25s ease,color .25s ease;}' +
      '.typography-family-group[open] .typography-family-toggle{transform:rotate(180deg);background-color:var(--brand-50);color:var(--brand-600);}' +
      '.typography-family-content{padding-top:1.5rem;}' +
      '.typography-variant-card{position:relative;}' +
      '.typography-variant-card:hover .typography-variant-weight{transform:scale(1.05);}' +
      '.typography-variant-card:before{content:"";position:absolute;left:0;top:16px;bottom:16px;width:4px;border-radius:999px;opacity:.85;}' +
      '.typography-variant-card-heading:before{background:linear-gradient(180deg,var(--brand-300),var(--brand-100));}' +
      '.typography-variant-card-body:before{background:linear-gradient(180deg,#cbd5e1,rgba(226,232,240,0.6));}' +
      '.typography-family-group:not([open]){margin-bottom:0;}' +
      '.dark-mode .typography-family-summary:focus-visible{outline-color:var(--brand-text);}' +
      '.dark-mode .typography-variant-card-heading:before{background:linear-gradient(180deg,var(--brand-text),rgba(162,147,255,0.4));}' +
      '.dark-mode .typography-variant-card-body:before{background:linear-gradient(180deg,rgba(203,213,225,0.8),rgba(100,116,139,0.35));}';
    document.head.appendChild(styleEl);
  }
};
