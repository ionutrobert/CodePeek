// Colors Tab - Premium Redesign
var colorsTab = {
  render: function (data) {
    var self = this;
    var container = document.getElementById("tab-colors");
    if (!container) return;

    // Add Title
    var html = '<div class="flex items-center justify-between mb-6">';
    html +=
      '<h2 class="text-xl font-black text-slate-800 dark:text-white tracking-tight">Colors</h2>';
    html += "</div>";

    // Check if subtabs exist, otherwise reset
    var subtabs = document.getElementById("colors-subtab-container");
    if (!subtabs) {
      html += '<div id="colors-subtab-container" class="space-y-4">';
      html +=
        '<div class="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">';
      html +=
        '<button class="color-subtab-button flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all bg-white dark:bg-slate-700 shadow-sm text-brand-600" data-subtab="all">All</button>';
      html +=
        '<button class="color-subtab-button flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all text-slate-400" data-subtab="categories">Cats</button>';
      html += "</div>";
      html +=
        '<div id="colors-subtab-all"><div id="colors-grid" class="mt-4"></div></div>';
      html +=
        '<div id="colors-subtab-categories" class="hidden"><div id="color-categories" class="mt-4"></div></div>';
      html += "</div>";
      container.innerHTML = html;

      // Re-bind subtab buttons
      document.querySelectorAll(".color-subtab-button").forEach(function (btn) {
        btn.onclick = function () {
          if (typeof CodePeekApp !== "undefined")
            CodePeekApp.switchColorSubtab(this.dataset.subtab);
        };
      });
    }

    // Render All Colors Grid
    this.renderAll(data.colors || []);

    // Render Categories
    this.renderCategories(data.colors || []);
  },

  renderAll: function (colors) {
    var grid = document.getElementById("colors-grid");
    if (!grid) return;

    if (!colors || colors.length === 0) {
      grid.innerHTML =
        '<div class="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px] opacity-40">No colors found</div>';
      return;
    }

    var html =
      '<div class="grid grid-cols-5 gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-500">';
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i].color;
      html += '<div class="group cursor-pointer">';
      html +=
        '<div class="aspect-square rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all group-hover:scale-110 group-hover:shadow-lg relative overflow-hidden" style="background-color:' +
        c +
        '">';
      html +=
        '<div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>';
      html += "</div>";
      html +=
        '<div class="mt-2 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate text-center font-mono">' +
        c +
        "</div>";
      html += "</div>";
    }
    html += "</div>";
    grid.innerHTML = html;
  },

  renderCategories: function (colors) {
    var container = document.getElementById("color-categories");
    if (!container) return;

    // Logic to categorize
    var brands = [];
    var grays = [];

    for (var i = 0; i < colors.length; i++) {
      var c = colors[i].color;
      if (this.isGray(c)) grays.push(c);
      else brands.push(c);
    }

    var html =
      '<div class="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">';

    // Render sections as wrapping grids
    html += this.renderSection("Brand Colors", brands);
    html += this.renderSection("Neutrals", grays);

    html += "</div>";
    container.innerHTML = html;
  },

  renderSection: function (title, list) {
    if (list.length === 0) return "";

    var html = '<div class="color-section">';
    html +=
      '<h4 class="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">' +
      title +
      "</h4>";
    // Wrapping grid instead of flex-nowrap overflow-x
    html += '<div class="grid grid-cols-3 gap-3">';

    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      html +=
        '<div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm hover:border-brand-200 transition-all hover:-translate-y-1">';
      html +=
        '<div class="aspect-square rounded-xl mb-3 shadow-inner border border-black/5" style="background-color:' +
        c +
        '"></div>';
      html +=
        '<div class="text-[10px] font-black text-slate-900 dark:text-white font-mono tracking-tighter uppercase mb-0.5 truncate">' +
        c +
        "</div>";
      html +=
        '<div class="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Primary</div>';
      html += "</div>";
    }

    html += "</div></div>";
    return html;
  },

  isGray: function (color) {
    var match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      var r = parseInt(match[1]),
        g = parseInt(match[2]),
        b = parseInt(match[3]);
      var diff = Math.max(r, g, b) - Math.min(r, g, b);
      return diff < 20;
    }
    return false;
  },
};
