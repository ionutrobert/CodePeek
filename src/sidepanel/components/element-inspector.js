// Element Inspector - Premium ES5 Redesign
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cssEscape(str) {
  if (!str) return "";
  return String(str).replace(/["'\\]/g, "\\$&");
}

var elementInspector = {
  display: function (data, containerId) {
    var self = this;
    var container = containerId
      ? document.getElementById(containerId)
      : document.getElementById("inspect-content");
    if (!container) return;

    if (!data) {
      this.clear();
      return;
    }

    var el = data.element || {};
    var styles = data.styles || {};
    var dims = data.dimensions || {};
    var p = styles.padding || { top: 0, right: 0, bottom: 0, left: 0 };
    var m = styles.margin || { top: 0, right: 0, bottom: 0, left: 0 };
    var br = styles.borderRadius || {
      topLeft: "0px",
      topRight: "0px",
      bottomRight: "0px",
      bottomLeft: "0px",
    };

    var totalW = Math.round(dims.width) || 0;
    var totalH = Math.round(dims.height) || 0;

    var html =
      '<div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400 pb-8">';

    // Header with Back button
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<div class="flex items-center gap-2">';
    html +=
      '<button id="inspect-back" class="p-2 -ml-2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg></button>';
    html +=
      '<h2 class="text-xl font-black text-slate-800 dark:text-white tracking-tight">Inspector</h2>';
    html += "</div>";
    html += "</div>";

    // Selector Info
    html += '<div class="mb-4">';
    html +=
      '<div class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Element</div>';
    var classNames = el.className ? el.className.split(" ").join(".") : "";
    html +=
      '<div class="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight mb-4">';
    html +=
      '<span class="text-brand-600">' +
      (el.tagName ? el.tagName.toLowerCase() : "div") +
      "</span>";
    html +=
      '<span class="text-slate-800 dark:text-slate-100' +
      (classNames ? '">.' + classNames : '">') +
      "</span>";
    html += "</div>";

    // Hover Toggle Mockup
    html += '<div class="flex items-center gap-2 pt-2">';
    html +=
      '<div id="context-mockup" class="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer"><div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform"></div></div>';
    html +=
      '<span class="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Context menu while hovering</span></div>';
    html += "</div>";

    // Premium Box Model Visualizer with Numbers
    html +=
      '<div class="relative py-12 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl mt-4">';
    // Margin Box
    html +=
      '<div class="w-full max-w-[260px] aspect-[16/10] border border-dashed border-slate-300 dark:border-slate-600 rounded-[32px] flex items-center justify-center relative">';
    html +=
      '<span class="absolute top-1 text-[8px] font-black text-slate-700 dark:text-slate-400">' +
      m.top +
      "</span>";
    html +=
      '<span class="absolute right-2 text-[8px] font-black text-slate-700 dark:text-slate-400">' +
      m.right +
      "</span>";
    html +=
      '<span class="absolute bottom-1 text-[8px] font-black text-slate-700 dark:text-slate-400">' +
      m.bottom +
      "</span>";
    html +=
      '<span class="absolute left-2 text-[8px] font-black text-slate-700 dark:text-slate-400">' +
      m.left +
      "</span>";

    // Padding Area
    html +=
      '<div class="w-[80%] h-[80%] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-inner flex items-center justify-center relative"' +
      ' style="border-top-left-radius:' +
      (br.topLeft || "24px") +
      "; border-top-right-radius:" +
      (br.topRight || "24px") +
      "; border-bottom-right-radius:" +
      (br.bottomRight || "24px") +
      "; border-bottom-left-radius:" +
      (br.bottomLeft || "24px") +
      ';">';
    html +=
      '<span class="absolute top-1 text-[8px] font-black text-slate-900 dark:text-white">' +
      p.top +
      "</span>";
    html +=
      '<span class="absolute right-2 text-[8px] font-black text-slate-900 dark:text-white">' +
      p.right +
      "</span>";
    html +=
      '<span class="absolute bottom-1 text-[8px] font-black text-slate-900 dark:text-white">' +
      p.bottom +
      "</span>";
    html +=
      '<span class="absolute left-2 text-[8px] font-black text-slate-900 dark:text-white">' +
      p.left +
      "</span>";

    // Content Box
    html +=
      '<div class="w-[50%] h-[35%] bg-slate-900 border border-slate-700 text-white shadow-2xl flex items-center justify-center font-mono font-black text-[11px] z-10"' +
      ' style="border-top-left-radius:' +
      (br.topLeft || "6px") +
      "; border-top-right-radius:" +
      (br.topRight || "6px") +
      "; border-bottom-right-radius:" +
      (br.bottomRight || "6px") +
      "; border-bottom-left-radius:" +
      (br.bottomLeft || "6px") +
      ';">';
    html += totalW + "×" + totalH;
    html += "</div>";
    html += "</div></div></div>";

    // Text Properties Grid
    html += '<div class="pt-8">';
    html +=
      '<h4 class="text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-4">TEXT PROPERTIES</h4>';

    var propsData = [
      {
        label: "Font Family",
        value: (styles.fontFamily || "").split(",")[0].replace(/['"]/g, ""),
        copy: true,
      },
      { label: "Font Size", value: styles.fontSize || "0px", copy: false },
      {
        label: "Line Height",
        value: styles.lineHeight || "normal",
        copy: false,
      },
      { label: "Font Weight", value: styles.fontWeight || "400", copy: false },
      {
        label: "Letter Spacing",
        value: styles.letterSpacing || "normal",
        copy: false,
      },
      {
        label: "Text color",
        value: styles.color || "#000",
        swatch: true,
        copy: true,
      },
    ];

    html += '<div class="space-y-4">';
    for (var k = 0; k < propsData.length; k++) {
      var prop = propsData[k];
      html += '<div class="flex items-center justify-between group">';
      html +=
        '<span class="text-xs text-slate-500 dark:text-slate-400 font-bold">' +
        prop.label +
        "</span>";
      html += '<div class="flex items-center gap-2">';
      if (prop.copy) {
        html +=
          '<button class="inspect-copy-btn p-1.5 text-slate-400 dark:text-slate-200 hover:text-brand-500 dark:hover:text-brand-400 transition-all cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 mr-1" data-value="' +
          prop.value +
          '"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></button>';
      }
      if (prop.swatch) {
        html +=
          '<div class="w-3 h-3 rounded-full shadow-sm border border-slate-200" style="background-color:' +
          prop.value +
          '"></div>';
      }
      html +=
        '<span class="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">' +
        prop.value +
        "</span>";
      html += "</div></div>";
    }
    html += "</div></div>";

    // Border Radius Section
    html += '<div class="pt-8">';
    html +=
      '<h4 class="text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-4">BORDER RADIUS</h4>';
    html += '<div class="grid grid-cols-2 gap-3">';
    var rads = [
      { l: "Top Left", v: br.topLeft || "0px" },
      { l: "Top Right", v: br.topRight || "0px" },
      { l: "Bottom Right", v: br.bottomRight || "0px" },
      { l: "Bottom Left", v: br.bottomLeft || "0px" },
    ];
    for (var r = 0; r < rads.length; r++) {
      html +=
        '<div class="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">';
      html +=
        '<span class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">' +
        rads[r].l +
        "</span>";
      html +=
        '<span class="text-[10px] font-black text-slate-900 dark:text-white">' +
        rads[r].v +
        "</span>";
      html += "</div>";
    }
    html += "</div></div>";

    // Colors
    html += '<div class="pt-8">';
    html +=
      '<h4 class="text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-4">BACKGROUND</h4>';
    html +=
      '<div class="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-white shadow-xl">';
    html +=
      '<span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Detected</span>';
    html += '<div class="flex items-center gap-3">';
    html +=
      '<span class="text-xs font-black font-mono tracking-tighter uppercase">' +
      (styles.backgroundColor || "Transparent") +
      "</span>";
    html +=
      '<div class="w-4 h-4 rounded-md shadow-inner border border-white/20" style="background-color:' +
      (styles.backgroundColor || "transparent") +
      '"></div>';
    html += "</div></div>";

    html += "</div></div>";

    container.innerHTML = html;

    // Bind events programmatically
    var backBtn = document.getElementById("inspect-back");
    if (backBtn && typeof CodePeekApp !== "undefined") {
      backBtn.onclick = function () {
        CodePeekApp.switchTab("overview");
      };
    }

    var mockup = document.getElementById("context-mockup");
    if (mockup) {
      mockup.onclick = function () {
        var thumb = this.querySelector("div");
        var isActive = this.classList.toggle("bg-brand-500");
        this.classList.toggle("bg-slate-200", !isActive);
        thumb.style.transform = isActive ? "translateX(16px)" : "translateX(0)";
      };
    }

    container.querySelectorAll(".inspect-copy-btn").forEach(function (btn) {
      btn.onclick = function () {
        if (typeof CodePeekApp !== "undefined")
          CodePeekApp.copyText(this.dataset.value);
      };
    });
  },

  copyText: function (text, btn) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(textarea);
  },

  clear: function () {
    var container = document.getElementById("inspect-content");
    if (container) {
      container.innerHTML =
        '<div class="flex flex-col items-center justify-center py-20 text-slate-300"><div class="w-12 h-12 mb-4 opacity-10"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div><p class="text-[10px] font-black uppercase tracking-widest">No element selected</p></div>';
    }
  },
};
