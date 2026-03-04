// Sidepanel App - Premium Lavender Design System (ES5)
var CodePeekApp = {
  activeTab: "overview",
  isInspecting: false,
  pageData: null,
  isDarkMode: false,
  continuousInspect: false, // Default: stop after one element

  init: function () {
    console.log("Code Peek App Initializing...");
    this.bindEvents();
    this.loadSettings();
    this.refreshData();

    // Auto-refresh when tab changes
    var self = this;
    if (
      typeof chrome !== "undefined" &&
      chrome.tabs &&
      chrome.tabs.onActivated
    ) {
      chrome.tabs.onActivated.addListener(function () {
        setTimeout(function () {
          self.refreshData();
        }, 300);
      });
      chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (changeInfo.status === "complete") {
          self.refreshData();
        }
      });
    }
  },

  bindEvents: function () {
    var self = this;

    // Navigation
    document.querySelectorAll(".nav-button").forEach(function (btn) {
      btn.onclick = function () {
        self.switchTab(this.dataset.tab);
      };
    });

    // Subtabs for Colors
    document.querySelectorAll(".color-subtab-button").forEach(function (btn) {
      btn.onclick = function () {
        self.switchColorSubtab(this.dataset.subtab);
      };
    });

    // Inspect Toggle
    var inspectBtn = document.getElementById("inspect-toggle");
    if (inspectBtn) {
      inspectBtn.onclick = function () {
        self.toggleInspectMode();
      };
    }

    // 3-Dot Menu
    var menuBtn = document.getElementById("menu-toggle");
    var menu = document.getElementById("utility-menu");
    if (menuBtn && menu) {
      menuBtn.onclick = function (e) {
        e.stopPropagation();
        menu.classList.toggle("hidden");
      };
      document.addEventListener("click", function () {
        menu.classList.add("hidden");
      });
    }

    // Dark Mode Toggle
    var darkBtn = document.getElementById("dark-mode-toggle");
    if (darkBtn) {
      darkBtn.onclick = function () {
        self.setDarkMode(!self.isDarkMode);
      };
    }

     // Screenshot
     var screenshotBtn = document.getElementById("screenshot-btn");
     if (screenshotBtn) {
       screenshotBtn.onclick = function () {
         self.captureFullScreenshot();
       };
     }

     // Continuous Inspect Toggle
     var continuousToggle = document.getElementById("continuous-inspect-toggle");
     if (continuousToggle) {
       continuousToggle.onclick = function () {
         self.toggleContinuousInspect();
       };
     }

     // Reload Extension
     var reloadBtn = document.getElementById("reload-extension-btn");
     if (reloadBtn) {
       reloadBtn.onclick = function () {
         if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.reload) {
           chrome.runtime.reload();
         } else {
           self.showNotification("Error", "Cannot reload extension");
         }
       };
     }

     // Close
     var closeBtn = document.getElementById("close-sidepanel");
     if (closeBtn) {
       closeBtn.onclick = function () {
         window.close();
       };
     }
   },

  refreshData: function () {
    var self = this;
    messaging.sendMessage("EXTRACT_PAGE_DATA", null, function (res) {
      if (res && res.success) {
        self.pageData = res.data;
        self.renderActiveTab();
      }
    });
  },

  switchTab: function (tabId) {
    this.activeTab = tabId;
    document.querySelectorAll(".tab-content").forEach(function (el) {
      el.classList.add("hidden");
    });
    var activeEl = document.getElementById("tab-" + tabId);
    if (activeEl) activeEl.classList.remove("hidden");

    document.querySelectorAll(".nav-button").forEach(function (btn) {
      if (btn.dataset.tab === tabId) btn.classList.add("active");
      else btn.classList.remove("active");
    });

    this.renderActiveTab();

    // Auto-initialize color subtabs if switching to colors
    if (tabId === "colors") {
      var self = this;
      setTimeout(function () {
        self.switchColorSubtab("all");
      }, 50);
    }
  },

  switchColorSubtab: function (subId) {
    var all = document.getElementById("colors-subtab-all");
    var cats = document.getElementById("colors-subtab-categories");
    if (!all || !cats) return;

    all.classList.add("hidden");
    cats.classList.add("hidden");

    var active = document.getElementById("colors-subtab-" + subId);
    if (active) active.classList.remove("hidden");

    document.querySelectorAll(".color-subtab-button").forEach(function (btn) {
      if (btn.dataset.subtab === subId) {
        btn.classList.add(
          "bg-white",
          "dark:bg-slate-700",
          "shadow-sm",
          "text-brand-600",
          "dark:text-brand-400",
        );
        btn.classList.remove("text-slate-400");
      } else {
        btn.classList.remove(
          "bg-white",
          "dark:bg-slate-700",
          "shadow-sm",
          "text-brand-600",
          "dark:text-brand-400",
        );
        btn.classList.add("text-slate-400");
      }
    });
  },

  renderActiveTab: function () {
    if (!this.pageData) return;

    switch (this.activeTab) {
      case "overview":
        if (typeof overviewTab !== "undefined")
          overviewTab.renderStats(this.pageData);
        break;
      case "colors":
        if (typeof colorsTab !== "undefined") colorsTab.render(this.pageData);
        break;
      case "typography":
        if (typeof typographyTab !== "undefined")
          typographyTab.render(this.pageData);
        break;
      case "assets":
        if (typeof assetsTab !== "undefined") assetsTab.render(this.pageData);
        break;
      case "inspect":
        if (typeof elementInspector !== "undefined") {
          // If no element selected, clear
          if (!this.lastInspected) elementInspector.clear();
          else elementInspector.display(this.lastInspected);
        }
        break;
    }
  },

  toggleInspectMode: function () {
    var self = this;
    this.isInspecting = !this.isInspecting;

    var btn = document.getElementById("inspect-toggle");
    var indicator = btn.querySelector("div");

    if (this.isInspecting) {
      btn.classList.add("bg-brand-500", "text-white", "border-brand-600");
      btn.classList.remove(
        "bg-slate-50",
        "text-slate-900",
        "dark:bg-slate-900",
        "dark:text-white",
      );
      indicator.classList.add("bg-white", "animate-pulse");
      indicator.classList.remove("bg-slate-300", "dark:bg-slate-600");

      messaging.sendMessage("START_INSPECT_MODE", null, function () {
        console.log("Inspect mode started");
      });
    } else {
      btn.classList.remove("bg-brand-500", "text-white", "border-brand-600");
      btn.classList.add(
        "bg-slate-50",
        "dark:bg-slate-900",
        "text-slate-900",
        "dark:text-white",
      );
      indicator.classList.remove("bg-white", "animate-pulse");
      indicator.classList.add("bg-slate-300", "dark:bg-slate-600");

      messaging.sendMessage("STOP_INSPECT_MODE", null);
    }
  },

  setDarkMode: function (val) {
    this.isDarkMode = val;
    var html = document.documentElement;
    var thumb = document.getElementById("dark-mode-thumb");
    var track = document.getElementById("dark-mode-track");

    if (val) {
      html.classList.add("dark-mode");
      if (thumb) thumb.style.transform = "translateX(16px)";
      if (track) track.classList.replace("bg-slate-200", "bg-brand-500");
    } else {
      html.classList.remove("dark-mode");
      if (thumb) thumb.style.transform = "translateX(0)";
      if (track) track.classList.replace("bg-brand-500", "bg-slate-200");
    }

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ darkMode: val });
    }
  },

  loadSettings: function () {
    var self = this;
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get(["darkMode", "continuousInspect"], function (res) {
        if (res && res.darkMode) self.setDarkMode(true);
        if (res && res.continuousInspect) {
          self.continuousInspect = true;
          self.updateContinuousInspectUI();
        }
      });
    }
  },

  saveSettings: function () {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({
        continuousInspect: this.continuousInspect
      });
    }
  },

  updateContinuousInspectUI: function () {
    var track = document.getElementById("continuous-track");
    var thumb = document.getElementById("continuous-thumb");
    if (track && thumb) {
      if (this.continuousInspect) {
        track.classList.replace("bg-slate-200", "bg-brand-500");
        track.classList.replace("dark:bg-slate-700", "dark:bg-brand-500");
        thumb.style.transform = "translateX(16px)";
      } else {
        track.classList.replace("bg-brand-500", "bg-slate-200");
        track.classList.replace("dark:bg-brand-500", "dark:bg-slate-700");
        thumb.style.transform = "translateX(0)";
      }
    }
  },

  toggleContinuousInspect: function () {
    this.continuousInspect = !this.continuousInspect;
    this.updateContinuousInspectUI();
    this.saveSettings();
  },

  captureFullScreenshot: function () {
    this.showNotification("Capturing...", "Please don't scroll.");
    var self = this;

    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.sendMessage
    ) {
      chrome.runtime.sendMessage({ type: "CAPTURE_FULL_PAGE" }, function (res) {
        if (res && res.success) {
          self.showNotification("Success", "Screenshot saved!");
        } else {
          self.showNotification("Failed", "Could not capture page.");
        }
      });
    }
  },

  showNotification: function (title, msg) {
    var toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 min-w-[240px] animate-in slide-in-from-top-4 duration-300";
    toast.innerHTML =
      '<div class="flex items-start gap-3">' +
      '<div class="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>' +
      "<div>" +
      '<div class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-0.5">' +
      title +
      "</div>" +
      '<div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">' +
      msg +
      "</div>" +
      "</div></div>";

    document.body.appendChild(toast);
    setTimeout(function () {
      toast.classList.add("animate-out", "fade-out", "slide-out-to-top-2");
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 3000);
  },

  showSuccess: function (msg) {
    this.showNotification("Success", msg);
  },

  copyText: function (text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      this.showNotification("Success", "Copied to clipboard!");
    } catch (e) {}
    document.body.removeChild(textarea);
  },

  handleMessage: function (msg, sender, sendResponse) {
    if (msg && msg.type === "ELEMENT_INSPECTED") {
      this.lastInspected = msg.payload;
      this.switchTab("inspect");
      
      // If continuous inspect is OFF, turn off inspect mode after one element
      if (!this.continuousInspect && this.isInspecting) {
        this.toggleInspectMode();
      }
      
      if (sendResponse) sendResponse({ success: true });
    }
  },
};

// Global Exposure
window.CodePeekApp = CodePeekApp;

// Auto Init
document.addEventListener("DOMContentLoaded", function () {
  CodePeekApp.init();
});

// Listener for messages from content script
if (
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.onMessage
) {
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    CodePeekApp.handleMessage(msg, sender, sendResponse);
  });
}
