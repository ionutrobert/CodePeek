// Overview Tab - Plain ES5 JavaScript
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  var k = 1024;
  var sizes = ["B", "KB", "MB"];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

var overviewTab = {
  load: function () {
    console.log("Loading overview tab...");
    var self = this;
    var container = document.getElementById("tab-overview");
    if (container) {
      container.innerHTML = '<div class="space-y-6 pb-6"><div class="flex items-center justify-between mb-4"><div class="h-8 w-32 bg-slate-200 rounded animate-pulse"></div><div class="w-20 h-8 bg-slate-200 rounded animate-pulse"></div></div><div class="px-1 mb-6"><div class="h-7 w-3/4 bg-slate-200 rounded animate-pulse mb-2"></div><div class="h-4 w-1/2 bg-slate-200 rounded animate-pulse"></div></div><div class="grid grid-cols-2 gap-3 mb-6"><div class="h-20 bg-slate-200 rounded-2xl animate-pulse"></div><div class="h-20 bg-slate-200 rounded-2xl animate-pulse"></div></div><div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6"><div class="h-5 w-1/3 bg-slate-200 rounded animate-pulse mb-4"></div><div class="space-y-2"><div class="h-4 w-full bg-slate-200 rounded animate-pulse"></div><div class="h-4 w-5/6 bg-slate-200 rounded animate-pulse"></div></div></div></div>';
    }

    // 1. Initial Scan
    messaging.extractAll(function (response) {
      if (response && response.success && response.data) {
        self.renderStats(response.data);
      } else {
        self.renderError();
      }
    });
  },

  renderStats: function (data) {
    var self = this;
    var container = document.getElementById("tab-overview");
    var hasOgData;
    var hasTwitterData;
    var previewImg;
    var cardTitle;
    var cardDesc;
    var displayUrl;
    var fonts;
    var headings;
    var body;
    var colors;
    var issueCount;
    var worst;
    var issue;
    var m;
    var x;
    var y;
    var n;
    if (!container) return;

    if (!data) {
      container.innerHTML =
        '<div class="space-y-6 pb-6 animate-in fade-in duration-300">' +
        '<div class="flex items-center gap-3 px-1 pt-1">' +
        '<div class="relative w-5 h-5 flex-shrink-0">' +
        '<span class="absolute inset-0 rounded-full border-2 border-brand-100"></span>' +
        '<span class="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 border-r-brand-400 animate-spin"></span>' +
        '</div>' +
        '<div>' +
        '<div class="text-[10px] font-black uppercase tracking-widest text-brand-500">Loading Overview</div>' +
        '<div class="text-[11px] text-slate-500">Scanning page styles and metadata...</div>' +
        '</div>' +
        '</div>' +
        '<div class="space-y-3">' +
        '<div class="h-20 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-brand-50 animate-pulse"></div>' +
        '<div class="grid grid-cols-2 gap-3">' +
        '<div class="h-16 rounded-2xl border border-brand-100 bg-brand-50/80 animate-pulse"></div>' +
        '<div class="h-16 rounded-2xl border border-brand-100 bg-brand-50/80 animate-pulse"></div>' +
        '</div>' +
        '<div class="h-28 rounded-2xl border border-slate-200 bg-slate-50/80 animate-pulse"></div>' +
        '</div>' +
        '</div>';
      return;
    }

    // Build the Dashboard HTML from scratch for premium look
    var html =
      '<div class="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">';

    // 1. Upgrade Banner
    html += '<div class="flex items-center justify-between mb-4">';
    html +=
      '<h2 class="text-xl font-black text-slate-800 tracking-tight">Overview</h2>';
    html +=
      '<button class="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg border border-pink-100 shadow-sm hover:scale-105 transition-all cursor-pointer group">';
    html +=
      '<svg class="w-4 h-4 text-pink-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    html +=
      '<span class="text-[10px] font-black uppercase tracking-widest">Upgrade</span>';
    html += "</button></div>";

    // 2. Site Details (Title and Host)
    html += '<div class="px-1">';
    html +=
      '<h3 class="text-lg font-black text-slate-900 truncate leading-tight mb-1">' +
      self.escapeHtml(data.title || "Target Site") +
      "</h3>";
    html +=
      '<p class="text-[11px] text-slate-500 font-mono truncate">' +
      self.escapeHtml(data.host || "unknown-host") +
      "</p>";
    html += "</div>";

    // 2b. Social Preview Card (Open Graph / Twitter Card)
    // Only show if there's actual OG or Twitter Card data
    hasOgData = data.meta && data.meta.og && (data.meta.og.title || data.meta.og.description || data.meta.og.image);
    hasTwitterData = data.meta && data.meta.twitter && (data.meta.twitter.title || data.meta.twitter.description || data.meta.twitter.image);
    if (hasOgData || hasTwitterData) {
       html += '<div class="mt-6">';
       html +=
         '<h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Link Preview</h4>';
       
       // Preview Card
       html += '<div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">';
       
        // Image (if available)
        previewImg = data.meta.image || "";
        if (previewImg) {
          html +=
            '<div class="aspect-video w-full bg-slate-100 overflow-hidden relative">';
          html +=
            '<img src="' +
            self.escapeHtml(previewImg) +
            '" class="w-full h-full object-cover" id="og-image">';
          html += "</div>";
        }
       
       // Content
       html += '<div class="p-4">';
       
       // Title
       cardTitle = data.meta.og.title || data.meta.twitter.title || data.meta.title || "";
       if (cardTitle) {
         html +=
            '<h5 class="text-sm font-bold text-slate-900 leading-snug mb-2 line-clamp-2">' +
           self.escapeHtml(cardTitle) +
           "</h5>";
       }
       
       // Description
       cardDesc = data.meta.og.description || data.meta.twitter.description || data.meta.description || "";
       if (cardDesc) {
         html +=
            '<p class="text-[11px] text-slate-600 leading-relaxed line-clamp-3 mb-3">' +
           self.escapeHtml(cardDesc) +
           "</p>";
       }
       
       // URL / Domain
       displayUrl = data.meta.og.url || data.meta.url || data.host || "";
       if (displayUrl) {
         html +=
            '<div class="flex items-center gap-2 text-[10px] font-mono text-slate-500 truncate">';
          // Favicon
          if (data.meta.favicon) {
            html +=
              '<img src="' +
              self.escapeHtml(data.meta.favicon) +
              '" class="w-4 h-4 rounded-sm flex-shrink-0">';
          }
         html +=
           '<span class="truncate">' +
           self.escapeHtml(displayUrl) +
           "</span></div>";
       }
       
       html += "</div></div></div>";
     }

    // 3. Typography Summary Cards
    html += '<div class="mt-8">';
    html +=
      '<h4 class="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Typography</h4>';
    html += '<div class="space-y-3">';

    fonts = data.typography || [];
    headings = "No headings found";
    body = "Not detected";

    // Pick most prominent
    if (fonts.length > 0) {
      headings = fonts[0].family.split(",")[0].replace(/['"]/g, "");
      body = (fonts[1] || fonts[0]).family.split(",")[0].replace(/['"]/g, "");
    }

    html +=
      '<div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-brand-300 transition-all flex items-center justify-between group">';
    html += "<div>";
    html +=
      '<div class="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">HEADINGS</div>';
    html +=
      '<div class="text-[15px] font-black text-slate-900">' +
      headings +
      "</div></div>";
    html +=
      '<div class="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-black">H1</div>';
    html += "</div>";

    html +=
      '<div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-brand-300 transition-all flex items-center justify-between group">';
    html += "<div>";
    html +=
      '<div class="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">BODY TEXT</div>';
    html +=
      '<div class="text-[15px] font-black text-slate-900">' +
      body +
      "</div></div>";
    html +=
      '<div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold">Aa</div>';
    html += "</div>";
    html += "</div></div>";

    // 4. Color Palette Section
    html += '<div class="mt-8">';
    html += '<div class="flex items-center justify-between mb-4">';
    html +=
      '<h4 class="text-[11px] font-black text-slate-700 uppercase tracking-widest">Color Palette</h4>';
    html +=
      '<button class="text-[10px] font-black text-brand-500 uppercase tracking-widest hover:text-brand-600 transition-colors cursor-pointer" id="overview-show-colors">Show all</button></div>';

    colors = data.colors || [];
    html += '<div class="grid grid-cols-6 gap-2">';
    for (m = 0; m < Math.min(colors.length, 12); m++) {
      html +=
        '<div class="aspect-square rounded-lg border border-slate-300/30 shadow-sm flex-shrink-0 cursor-pointer hover:scale-110 transition-transform" style="background-color:' +
        colors[m].color +
        '" title="' +
        colors[m].color +
        '"></div>';
    }
    if (colors.length === 0)
      html +=
        '<div class="col-span-full text-[10px] text-slate-500 font-bold italic uppercase tracking-widest opacity-60">No colors detected</div>';
    html += "</div></div>";

    // 5. Contrast Scanner
    html += '<div class="mt-8">';
    issueCount = (data.contrastIssues || []).length;
    html += '<div class="flex items-center gap-2 mb-4">';
    html +=
      '<h4 class="text-[11px] font-black text-slate-700 uppercase tracking-widest">Contrast Scanner</h4>';
    html +=
      '<span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md">' +
      issueCount +
      "</span></div>";

    if (issueCount > 0) {
      // Find Worst Aspect
      worst = data.contrastIssues[0];
      html +=
        '<div class="p-5 bg-white border border-slate-100 rounded-[28px] shadow-sm group hover:border-brand-100 transition-all">';
      html += '<div class="flex items-center justify-between mb-4">';
      html += '<div class="flex items-center gap-3">';
      html +=
        '<div class="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm">Aa</div>';
      html +=
        '<div><div class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ratio</div>';
      html +=
        '<div class="text-xl font-black text-slate-800 tracking-tighter">' +
        worst.ratio.toFixed(2) +
        " : 1</div></div></div>";
      html +=
        '<span class="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-full border border-red-100">Failing</span></div>';

      // Top Issues List (Replaces confusing #1 bubbles)
      html += '<div class="space-y-2 mt-4">';
      html +=
        '<div class="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-2">TOP CONTRAST ISSUES</div>';

      for (x = 0; x < Math.min(issueCount, 3); x++) {
        issue = data.contrastIssues[x];
        html +=
          '<div class="flex items-center justify-between text-[10px] bg-slate-50 p-2 rounded-xl border border-slate-100">';
        html +=
          '<span class="font-bold text-slate-800 truncate w-32">' +
          issue.selector +
          "</span>";
        html +=
          '<span class="font-black text-red-500">' +
          issue.ratio.toFixed(2) +
          "</span>";
        html += "</div>";
      }

      html +=
        '<button class="w-full mt-2 py-2 text-[10px] font-black text-brand-500 uppercase tracking-widest cursor-pointer hover:bg-slate-50 rounded-xl transition-all" id="toggle-contrast-details">See all issues</button>';
      html += "</div>";

      // Hidden Detailed List
      html += '<div id="contrast-details-list" class="hidden pt-4 space-y-2">';
      for (y = 0; y < data.contrastIssues.length; y++) {
        issue = data.contrastIssues[y];
        html +=
          '<div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">';
        html += '<div class="flex items-center justify-between">';
        html +=
          '<span class="text-[10px] font-bold text-slate-800 truncate w-32">' +
          issue.selector +
          "</span>";
        html += '<div class="flex items-center gap-1.5">';
        html +=
          '<span class="px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ' +
          (issue.aa
            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
            : "bg-red-50 text-red-600 border border-red-100") +
          '">AA</span>';
        html +=
          '<span class="px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ' +
          (issue.aaa
            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
            : "bg-slate-100 text-slate-400 border border-slate-200") +
          '">AAA</span>';
        html +=
          '<span class="ml-1 text-[10px] font-black ' +
          (issue.ratio < 3 ? "text-red-500" : "text-amber-500") +
          '">' +
          issue.ratio.toFixed(2) +
          "</span>";
        html += "</div>";
        html += "</div>";
        html += '<div class="flex items-center gap-2">';
        html +=
          '<div class="w-3 h-3 rounded-sm border border-slate-200" style="background-color:' +
          issue.fg +
          '"></div>';
        html +=
          '<span class="text-[8px] font-mono text-slate-400">' +
          issue.fg +
          "</span>";
        html += '<span class="text-[8px] text-slate-300">on</span>';
        html +=
          '<div class="w-3 h-3 rounded-sm border border-slate-200" style="background-color:' +
          issue.bg +
          '"></div>';
        html +=
          '<span class="text-[8px] font-mono text-slate-400">' +
          issue.bg +
          "</span>";
        html += "</div></div>";
      }
      html += "</div></div>";
    } else {
      html +=
        '<div class="p-6 bg-emerald-50 border border-emerald-100 rounded-[28px] text-center">';
      html +=
        '<div class="text-emerald-600 font-black text-xs uppercase tracking-widest mb-1">Production Ready</div>';
      html +=
        '<div class="text-[10px] text-emerald-600/60 font-medium">All elements pass WCAG AA contrast standards.</div></div>';
    }
    html += "</div>";

     // 6. CSS Information Grid
     html += '<div class="mt-8">';
     html +=
       '<h4 class="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">CSS Metrics</h4>';
     html += '<div class="grid grid-cols-2 gap-3 pb-8">';

     var stats = [
       {
         label: "Stylesheets",
         value: data.stylesheets || 0,
         icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z",
       },
       {
         label: "CSS Rules",
         value: data.rules || 0,
         icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
       },
       {
         label: "CSS Size",
         value: formatBytes(data.size || 0),
         icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
       },
       {
         label: "Load Time",
         value: (data.loadTime || 0) + "ms",
         icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
       },
     ];

    for (n = 0; n < stats.length; n++) {
      html +=
        '<div class="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-brand-300 transition-all group">';
      html +=
        '<div class="flex items-center gap-2 mb-2"><svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="' +
        stats[n].icon +
        '"></path></svg>';
      html +=
        '<span class="text-[9px] font-black text-slate-700 uppercase tracking-widest">' +
        stats[n].label.toUpperCase() +
        "</span></div>";
      html +=
        '<span class="text-lg font-black text-slate-900 tracking-tighter">' +
        stats[n].value +
        "</span></div>";
    }
    html += "</div></div>";
    html += "</div>";

    container.innerHTML = html;

    // Attach "Coming Soon" for Upgrade button
    var upgradeBtn = container.querySelector(".bg-pink-50");
    if (upgradeBtn) {
      upgradeBtn.onclick = function () {
        if (typeof CodePeekApp !== "undefined") {
          CodePeekApp.showNotification(
            "Upgrade Coming Soon",
            "This feature is currently in development.",
          );
        } else {
          alert("Upgrade feature coming soon!");
        }
      };
    }

    // Bind events
    var showColorsBtn = document.getElementById("overview-show-colors");
    if (showColorsBtn && typeof CodePeekApp !== "undefined") {
      showColorsBtn.onclick = function () {
        CodePeekApp.switchTab("colors");
      };
    }

    var contrastToggle = document.getElementById("toggle-contrast-details");
    if (contrastToggle) {
      contrastToggle.onclick = function () {
        var details = document.getElementById("contrast-details-list");
        var isHidden;
        if (details) {
          isHidden = details.classList.toggle("hidden");
          contrastToggle.innerText = isHidden ? "See Details" : "Hide Details";
        }
      };
    }
  },

  renderError: function (msg) {
    var container = document.getElementById("tab-overview");
    var errorMsg;
    if (container) {
      errorMsg = msg ? '<div class="text-sm text-slate-500 mb-4">' + this.escapeHtml(msg) + '</div>' : '';
      container.innerHTML =
        '<div class="flex flex-col items-center justify-center py-20 text-slate-600">' +
        '<div class="text-xl font-black mb-4">Failed to load data</div>' +
        errorMsg +
        '<button id="retry-load" class="px-6 py-2 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-600 transition-colors shadow-sm active:scale-95">Retry</button>' +
        '</div>';
    }
    var retryBtn = document.getElementById("retry-load");
    if (retryBtn) {
      retryBtn.onclick = function() {
        if (typeof CodePeekApp !== "undefined" && CodePeekApp.refreshData) {
          CodePeekApp.refreshData();
        }
      };
    }
  },

  escapeHtml: function (str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  showSuccess: function (msg) {
    if (typeof CodePeekApp !== "undefined" && CodePeekApp.showSuccess) {
      CodePeekApp.showSuccess(msg);
    }
  },
};
