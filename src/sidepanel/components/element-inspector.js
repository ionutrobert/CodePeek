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

    container.classList.add("transition-all", "duration-300", "ease-out");

    if (!data || !data.element) {
      this.renderEmptyState(container);
      return;
    }

    container.dataset.inspectorState = "active";
    container.style.minHeight = "";
    container.style.maxHeight = "";

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
    var k, prop, r;

    var html =
      '<div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400 pb-8">';

    // Header with Back button
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<div class="flex items-center gap-2">';
    html +=
      '<button id="inspect-back" class="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg></button>';
    html +=
      '<h2 class="text-xl font-black text-slate-800 tracking-tight">Inspector</h2>';
    html += "</div>";
    html += "</div>";

    // Selector Info
    html += '<div class="mb-4">';
    html +=
      '<div class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Element</div>';
    var classNames = el.className ? el.className.split(" ").join(".") : "";
    html +=
      '<div class="text-lg font-black text-slate-800 tracking-tight leading-tight mb-4">';
    html +=
      '<span class="text-brand-600">' +
      (el.tagName ? el.tagName.toLowerCase() : "div") +
      "</span>";
    html +=
      '<span class="text-slate-800' +
      (classNames ? '">.' + classNames : '">') +
      "</span>";
    html += "</div>";

// Settings Button
html += '<div class="flex items-center justify-end pt-2 pb-2">';
html += '<button id="inspector-settings-btn" class="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">';
html += '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>';
html += 'Settings';
html += '</button>';
html += '</div>';

// Settings Modal (hidden by default)
html += '<div id="inspector-settings-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">';
html += '<div class="bg-white border border-slate-200 rounded-2xl p-4 w-64 shadow-2xl">';
html += '<div class="flex items-center justify-between mb-3">';
html += '<h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Inspector Settings</h4>';
html += '<button id="close-inspector-settings" class="text-slate-400 hover:text-slate-600">';
html += '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
html += '</button>';
html += '</div>';
html += '<div class="space-y-3">';
// Context menu toggle
html += '<div class="flex items-center justify-between">';
html += '<span class="text-xs text-slate-600">Context menu</span>';
html += '<div id="context-mockup" class="w-8 h-4 bg-slate-200 rounded-full relative cursor-pointer"><div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform"></div></div>';
html += '</div>';
// Distance lines toggle
html += '<div class="flex items-center justify-between">';
html += '<span class="text-xs text-slate-600">Show distance lines</span>';
html += '<div id="distance-lines-toggle" class="w-8 h-4 bg-slate-200 rounded-full relative cursor-pointer"><div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform"></div></div>';
html += '</div>';
// Continuous inspect toggle
html += '<div class="flex items-center justify-between">';
html += '<span class="text-xs text-slate-600">Continuous inspect</span>';
html += '<div id="inspector-continuous-toggle" class="w-8 h-4 bg-slate-200 rounded-full relative cursor-pointer"><div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform"></div></div>';
html += '</div>';
html += '</div>';
html += '</div>';
html += '</div>';

  // Premium Box Model Visualizer with Numbers
    html +=
      '<div class="relative py-12 flex items-center justify-center bg-slate-50/50 rounded-3xl mt-4">';
    // Margin Box
    html +=
      '<div class="w-full max-w-[260px] aspect-[16/10] border border-dashed border-slate-300 rounded-[32px] flex items-center justify-center relative">';
    html +=
      '<span class="absolute top-1 text-[8px] font-black text-slate-700">' +
      m.top +
      "</span>";
    html +=
      '<span class="absolute right-2 text-[8px] font-black text-slate-700">' +
      m.right +
      "</span>";
    html +=
      '<span class="absolute bottom-1 text-[8px] font-black text-slate-700">' +
      m.bottom +
      "</span>";
    html +=
      '<span class="absolute left-2 text-[8px] font-black text-slate-700">' +
      m.left +
      "</span>";

    // Padding Area
    html +=
      '<div class="w-[80%] h-[80%] border border-slate-200 bg-white shadow-inner flex items-center justify-center relative"' +
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
      '<span class="absolute -top-3 left-0 rounded-full bg-slate-900 px-2 py-1 text-[8px] font-black text-white shadow-sm whitespace-nowrap">' +
      (br.topLeft || "0px") +
      "</span>";
    html +=
      '<span class="absolute -top-3 right-0 rounded-full bg-slate-900 px-2 py-1 text-[8px] font-black text-white shadow-sm whitespace-nowrap">' +
      (br.topRight || "0px") +
      "</span>";
    html +=
      '<span class="absolute -bottom-3 right-0 rounded-full bg-slate-900 px-2 py-1 text-[8px] font-black text-white shadow-sm whitespace-nowrap">' +
      (br.bottomRight || "0px") +
      "</span>";
    html +=
      '<span class="absolute -bottom-3 left-0 rounded-full bg-slate-900 px-2 py-1 text-[8px] font-black text-white shadow-sm whitespace-nowrap">' +
      (br.bottomLeft || "0px") +
      "</span>";
    html +=
      '<span class="absolute top-1 text-[8px] font-black text-slate-900">' +
      p.top +
      "</span>";
    html +=
      '<span class="absolute right-2 text-[8px] font-black text-slate-900">' +
      p.right +
      "</span>";
    html +=
      '<span class="absolute bottom-1 text-[8px] font-black text-slate-900">' +
      p.bottom +
      "</span>";
    html +=
      '<span class="absolute left-2 text-[8px] font-black text-slate-900">' +
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
      '<h4 class="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4">TEXT PROPERTIES</h4>';

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
    for (k = 0; k < propsData.length; k++) {
      prop = propsData[k];
      html += '<div class="flex items-center justify-between group">';
      html +=
        '<span class="text-xs text-slate-500 font-bold">' +
        prop.label +
        "</span>";
      html += '<div class="flex items-center gap-2">';
      if (prop.copy) {
        html +=
          '<button class="inspect-copy-btn p-1.5 text-slate-400 hover:text-brand-500 transition-all cursor-pointer rounded-lg hover:bg-slate-100 mr-1" data-value="' +
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
        '<span class="text-xs font-black text-slate-800 tracking-tight">' +
        prop.value +
        "</span>";
      html += "</div></div>";
    }
    html += "</div></div>";

    // Colors
    html += '<div class="pt-8">';
    html +=
      '<h4 class="text-[11px] font-black text-slate-700 uppercase tracking-widest mb-4">BACKGROUND</h4>';
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

var contextToggle = document.getElementById("context-mockup");
  if (contextToggle && typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(['contextMenuEnabled'], function(result) {
      var isActive = result.contextMenuEnabled !== undefined ? result.contextMenuEnabled : true;
      // Set initial visual state
      if (isActive) {
        contextToggle.classList.add("bg-brand-500");
        contextToggle.classList.remove("bg-slate-200");
      } else {
        contextToggle.classList.remove("bg-brand-500");
        contextToggle.classList.add("bg-slate-200");
      }
      var thumb = contextToggle.querySelector("div");
      if (thumb) thumb.style.transform = isActive ? "translateX(16px)" : "";
      
      // Send initial state to content script
      if (typeof messaging !== 'undefined') {
        messaging.setContextMenuVisible(isActive);
      }
      
      // Bind click handler (once)
      if (!contextToggle.hasAttribute('data-bound')) {
        contextToggle.onclick = function () {
          var thumb = this.querySelector("div");
          var newActive = this.classList.toggle("bg-brand-500");
          this.classList.toggle("bg-slate-200", !newActive);
          thumb.style.transform = newActive ? "translateX(16px)" : "";
          // Persist state
          chrome.storage.local.set({ contextMenuEnabled: newActive });
          if (typeof messaging !== 'undefined') {
            messaging.setContextMenuVisible(newActive);
          }
        };
        contextToggle.setAttribute('data-bound', 'true');
      }
    });
  }

  // Distance Lines Toggle - send message to content script, persist state
  var distanceToggle = document.getElementById("distance-lines-toggle");
  if (distanceToggle && typeof messaging !== "undefined" && typeof chrome !== "undefined" && chrome.storage) {
    // Load saved state (default true)
    chrome.storage.local.get(['distanceLinesEnabled'], function(result) {
      var isActive = result.distanceLinesEnabled !== undefined ? result.distanceLinesEnabled : true;
      // Set initial visual state
      if (isActive) {
        distanceToggle.classList.add("bg-brand-500");
        distanceToggle.classList.remove("bg-slate-200");
      } else {
        distanceToggle.classList.remove("bg-brand-500");
        distanceToggle.classList.add("bg-slate-200");
      }
      var thumb = distanceToggle.querySelector("div");
      if (thumb) thumb.style.transform = isActive ? "translateX(16px)" : "";
      
      // Bind click handler (once)
      if (!distanceToggle.hasAttribute('data-bound')) {
        distanceToggle.onclick = function () {
          var thumb = this.querySelector("div");
          var newActive = this.classList.toggle("bg-brand-500");
          this.classList.toggle("bg-slate-200", !newActive);
          thumb.style.transform = newActive ? "translateX(16px)" : "";
          // Persist state
          chrome.storage.local.set({ distanceLinesEnabled: newActive });
          messaging.setDistanceLinesVisible(newActive, function (response) {
            if (typeof console !== "undefined" && console.debug)
              console.debug("[DEBUG] Distance lines toggle:", newActive, response);
          });
        };
        distanceToggle.setAttribute('data-bound', 'true');
      }
    });
  }

  // Continuous Inspect Toggle - toggle CodePeekApp.continuousInspect and persist
  var continuousToggle = document.getElementById("inspector-continuous-toggle");
  if (continuousToggle && typeof CodePeekApp !== "undefined" && typeof chrome !== "undefined" && chrome.storage) {
    // Initialize from CodePeekApp.continuousInspect (already loaded from storage)
    if (CodePeekApp.continuousInspect) {
      continuousToggle.classList.remove("bg-slate-200");
      continuousToggle.classList.add("bg-brand-500");
      continuousToggle.querySelector("div").style.transform = "translateX(16px)";
    }
    continuousToggle.onclick = function () {
      var thumb = this.querySelector("div");
      var isActive = this.classList.toggle("bg-brand-500");
      this.classList.toggle("bg-slate-200", !isActive);
      thumb.style.transform = isActive ? "translateX(16px)" : "translateX(0)";
      CodePeekApp.continuousInspect = isActive;
      // Persist
      chrome.storage.local.set({ continuousInspect: isActive });
      if (typeof console !== "undefined" && console.debug)
        console.debug("[DEBUG] Continuous inspect:", isActive);
      // Update the utility menu toggle to match
      var utilityTrack = document.getElementById("continuous-track");
      var utilityThumb = document.getElementById("continuous-thumb");
      if (utilityTrack && utilityThumb) {
        utilityTrack.classList.toggle("bg-brand-500", isActive);
        utilityTrack.classList.toggle("bg-slate-200", !isActive);
        utilityThumb.style.transform = isActive ? "translateX(16px)" : "translateX(0)";
      }
    };
  }

  // Settings modal handlers
  var settingsBtn = document.getElementById("inspector-settings-btn");
  var settingsModal = document.getElementById("inspector-settings-modal");
  var closeSettingsBtn = document.getElementById("close-inspector-settings");
  
  if (settingsBtn && settingsModal) {
    settingsBtn.onclick = function() {
      settingsModal.classList.remove("hidden");
    };
  }
  
  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.onclick = function() {
      settingsModal.classList.add("hidden");
    };
  }
  
  // Close modal when clicking outside
  if (settingsModal) {
    settingsModal.onclick = function(e) {
      if (e.target === settingsModal) {
        settingsModal.classList.add("hidden");
      }
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

  renderEmptyState: function (container) {
    if (!container) return;
    container.classList.add("transition-all", "duration-300", "ease-out");
    container.dataset.inspectorState = "empty";
    container.style.minHeight = "140px";
    container.style.maxHeight = "240px";
    var emptyHtml =
      '<div class="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center text-slate-500 animate-in fade-in duration-300">' +
      '<div class="w-14 h-14 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 shadow-inner border border-slate-200">' +
      '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.5 15.5l4.5 4.5m-7-3.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z"></path>' +
      '</svg>' +
      '</div>' +
      '<p class="text-sm font-black text-slate-700 tracking-tight">Click an element to inspect</p>' +
      '<p class="text-xs text-slate-400 uppercase tracking-wider">Select an element to view details</p>' +
      '</div>';
    container.innerHTML = emptyHtml;
  },

  clear: function () {
    var container = document.getElementById("inspect-content");
    if (container) {
      this.renderEmptyState(container);
    }
  },
};
