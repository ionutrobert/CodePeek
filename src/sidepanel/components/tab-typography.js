// Typography Tab - Premium Nested Layout (V2)
var typographyTab = {
  render: function (data) {
    var container = document.getElementById("typography-content");
    if (!container) return;

    if (!data || !data.typography || data.typography.length === 0) {
      container.innerHTML =
        '<div class="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] opacity-60">No fonts detected</div>';
      return;
    }

    var html =
      '<div class="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">';

    // Tab Header
    html += '<div class="px-1 mb-2">';
    html +=
      '<h2 class="text-xl font-black text-slate-900 tracking-tight">Typography</h2>';
    html +=
      '<p class="text-[10px] text-slate-700 font-black uppercase tracking-widest mt-1">NESTED FAMILY GROUPS</p>';
    html += "</div>";

    // Families are now properly grouped objects
    var families = data.typography;

    for (var i = 0; i < families.length; i++) {
      var group = families[i];
      var displayName =
        group.name || group.family.split(",")[0].replace(/['"]/g, "");

      html += '<div class="font-group font-group-wrap">';

      // Family Header and Preview Bundle
      html +=
        '<div class="p-6 bg-white border border-slate-200 rounded-[32px] shadow-sm mb-6 hover:border-brand-200 transition-all group">';
      html += '<div class="flex items-center justify-between mb-6">';
      html += "<div>";
      html +=
        '<div class="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">FAMILY</div>';
      html +=
        '<h3 class="text-2xl font-black text-slate-900 tracking-tighter">' +
        displayName +
        "</h3>";
      html += "</div>";
      html +=
        '<div class="bg-brand-50 text-brand-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">' +
        group.variants.length +
        " variants</div>";
      html += "</div>";

      // Font Preview Strip
      html +=
        '<div class="py-8 px-5 bg-slate-50/50 rounded-2xl text-center overflow-hidden mb-8 border border-white/50 backdrop-blur-sm relative">';
      html +=
        '<span class="text-4xl tracking-tighter text-slate-800 whitespace-nowrap" style="font-family:' +
        group.family +
        '">ABCabc123 &!$</span>';
      html += "</div>";

      // Nested Variants
      html += '<div class="space-y-4">';
      var variants = group.variants;

      for (var j = 0; j < variants.length; j++) {
        var v = variants[j];
        var weightName = this.getWeightName(v.weight);
        var isHeading = v.tag.indexOf("h") === 0;

        html +=
          '<div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-brand-300 transition-all flex items-center justify-between group/vcard mb-4 last:mb-0">';
        html += '<div class="flex items-center gap-4">';

        // Weight Badge Card
        html +=
          '<div class="w-12 h-12 rounded-2xl flex items-center justify-center text-[11px] font-black ' +
          (isHeading
            ? "bg-brand-50 text-brand-600 border-brand-100"
            : "bg-slate-50 text-slate-700 border-slate-100") +
          ' border shadow-sm group-hover/vcard:scale-105 transition-transform">' +
          v.weight +
          "</div>";

        html += "<div>";
        html += '<div class="flex items-center gap-2 mb-1">';
        html +=
          '<span class="text-[11px] font-black text-slate-900 uppercase tracking-widest">' +
          weightName.toUpperCase() +
          "</span>";
        html +=
          '<span class="px-1.5 py-0.5 bg-slate-100 text-[8px] font-black text-slate-400 rounded-sm uppercase tracking-tighter">' +
          v.tag +
          "</span>";
        html += "</div>";
        html +=
          '<div class="text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none">' +
          v.size +
          " • " +
          (v.count || 1) +
          " USAGES" +
          "</div>";
        html += "</div>";
        html += "</div>";
        html += "</div>";
      }

      html += "</div>"; // End Variants
      html += "</div>"; // End Family Card
      html += "</div>"; // End Font Group
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
};
