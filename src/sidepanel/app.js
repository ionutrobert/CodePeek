// Sidepanel App - Premium Lavender Design System (ES5)
// WITH DEBUG LOGGING AND FIX FOR PERSISTENCE
var CodePeekApp = {
  activeTab: "overview",
  isInspecting: false,
  pageData: null,
  isDarkMode: false,
  continuousInspect: false,
  colorSubtab: "all", // 'all' or 'categories' for colors tab

  init: function () {
    console.log("[DEBUG] CodePeekApp.init() called at:", new Date().toISOString());
    if (typeof chrome !== "undefined" && chrome.runtime) {
      console.log("[DEBUG] Extension ID:", chrome.runtime.id);
    }
    
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
    
     // Verify storage after init
    setTimeout(function() {
      console.log("[DEBUG] Storage check after init:");
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(null, function(data) {
          console.log("[DEBUG] Full storage:", data);
          console.log("[DEBUG] Storage keys:", Object.keys(data || {}));
        });
      }
    }, 2000);
  },

  bindEvents: function () {
    var self = this;
    console.log("[DEBUG] bindEvents() called");

    // Navigation
    document.querySelectorAll(".nav-button").forEach(function (btn) {
      btn.onclick = function () {
        console.log("[DEBUG] Navigate to:", this.dataset.tab);
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
        console.log("[DEBUG] Toggle inspect, isInspecting:", self.isInspecting);
        self.toggleInspectMode();
      };
    }

    // Dark Mode Toggle
    var darkBtn = document.getElementById("dark-mode-toggle");
    if (darkBtn) {
      darkBtn.onclick = function () {
        console.log("[DEBUG] Dark mode toggle clicked, current:", self.isDarkMode);
        self.setDarkMode(!self.isDarkMode);
      };
    }

    // Continuous Inspect Toggle
    var continuousToggle = document.getElementById("continuous-inspect-toggle");
    if (continuousToggle) {
      continuousToggle.onclick = function () {
        console.log("[DEBUG] Continuous inspect toggle, current:", self.continuousInspect);
        self.toggleContinuousInspect();
      };
    }

    // Other UI bindings...
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

    var screenshotBtn = document.getElementById("screenshot-btn");
    if (screenshotBtn) {
      screenshotBtn.onclick = function () {
        self.captureFullScreenshot();
      };
    }

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

    var closeBtn = document.getElementById("close-sidepanel");
    if (closeBtn) {
      closeBtn.onclick = function () {
        console.log("[DEBUG] Side panel close clicked");
        window.close();
      };
    }
  },

  refreshData: function () {
    console.log("[DEBUG] refreshData() called");
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
    
    // Persist active tab selection
    this.saveSettings();

    // If switching to colors tab, ensure correct subtab is shown
    if (tabId === "colors") {
      this.switchColorSubtab(this.colorSubtab);
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
        btn.classList.add("bg-white", "dark:bg-slate-700", "shadow-sm", "text-brand-600", "dark:text-brand-400");
        btn.classList.remove("text-slate-400");
      } else {
        btn.classList.remove("bg-white", "dark:bg-slate-700", "shadow-sm", "text-brand-600", "dark:text-brand-400");
        btn.classList.add("text-slate-400");
      }
    });
    
    // Persist color subtab selection
    this.colorSubtab = subId;
    this.saveSettings();
  },

  renderActiveTab: function () {
    if (!this.pageData) return;

    switch (this.activeTab) {
      case "overview":
        if (typeof overviewTab !== "undefined") overviewTab.renderStats(this.pageData);
        break;
      case "colors":
        if (typeof colorsTab !== "undefined") colorsTab.render(this.pageData);
        break;
      case "typography":
        if (typeof typographyTab !== "undefined") typographyTab.render(this.pageData);
        break;
      case "assets":
        if (typeof assetsTab !== "undefined") assetsTab.render(this.pageData);
        break;
      case "inspect":
        if (typeof elementInspector !== "undefined") {
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
    var indicator = btn ? btn.querySelector("div") : null;
    if (!btn) return;

    if (this.isInspecting) {
      btn.classList.add("bg-brand-500", "text-white", "border-brand-600");
      btn.classList.remove("bg-slate-50", "text-slate-900", "dark:bg-slate-900", "dark:text-white");
      if (indicator) {
        indicator.classList.add("bg-white", "animate-pulse");
        indicator.classList.remove("bg-slate-300", "dark:bg-slate-600");
      }
      messaging.sendMessage("START_INSPECT_MODE", null, function () {
        console.log("[DEBUG] START_INSPECT_MODE sent");
      });
    } else {
      btn.classList.remove("bg-brand-500", "text-white", "border-brand-600");
      btn.classList.add("bg-slate-50", "dark:bg-slate-900", "text-slate-900", "dark:text-white");
      if (indicator) {
        indicator.classList.remove("bg-white", "animate-pulse");
        indicator.classList.add("bg-slate-300", "dark:bg-slate-600");
      }
      messaging.sendMessage("STOP_INSPECT_MODE", null);
    }
  },

  setDarkMode: function (val) {
    console.log("[DEBUG] setDarkMode() called with:", val, "at:", new Date().toISOString());
    console.log("[DEBUG] chrome.storage.available:", !![chrome, chrome.storage, chrome.storage.local]);
    
    var oldVal = this.isDarkMode;
    this.isDarkMode = val;
    
    var html = document.documentElement;
    var thumb = document.getElementById("dark-mode-thumb");
    var track = document.getElementById("dark-mode-track");

    if (val) {
      html.classList.add("dark-mode");
      if (thumb) thumb.style.transform = "translateX(16px)";
      if (track) track.classList.replace("bg-slate-200", "bg-brand-500");
      console.log("[DEBUG] Applied dark mode classes");
    } else {
      html.classList.remove("dark-mode");
      if (thumb) thumb.style.transform = "translateX(0)";
      if (track) track.classList.replace("bg-brand-500", "bg-slate-200");
      console.log("[DEBUG] Removed dark mode classes");
    }

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      console.log("[DEBUG] Saving darkMode to chrome.storage.local:", val);
      chrome.storage.local.set({ darkMode: val }, function() {
        if (chrome.runtime.lastError) {
          console.error("[ERROR] chrome.storage.local.set(darkMode) FAILED:", chrome.runtime.lastError.message);
        } else {
          console.log("[DEBUG] chrome.storage.local.set(darkMode) succeeded");
          // Verify
          chrome.storage.local.get(['darkMode'], function(res) {
            if (chrome.runtime.lastError) {
              console.error("[ERROR] Verify get failed:", chrome.runtime.lastError.message);
            } else {
              console.log("[DEBUG] Verify read - darkMode:", res.darkMode);
            }
          });
        }
      });
    } else {
      console.warn("[WARN] chrome.storage.local not available for storing darkMode!");
    }
  },

  loadSettings: function () {
    console.log("[DEBUG] loadSettings() called at:", new Date().toISOString());
    var self = this;
    
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      console.log("[DEBUG] Calling chrome.storage.local.get() for settings");
      chrome.storage.local.get(['darkMode', 'continuousInspect', 'activeTab', 'colorSubtab'], function (res) {
        console.log("[DEBUG] storage.get callback, raw res:", res);
        if (chrome.runtime.lastError) {
          console.error("[ERROR] chrome.storage.local.get() FAILED:", chrome.runtime.lastError.message);
          // Apply defaults on error
          self.applyAllSettings(false, false, "overview", "all");
          return;
        }

        // Get values with defaults
        var darkVal = (res && res.darkMode !== undefined) ? res.darkMode : false;
        var contVal = (res && res.continuousInspect !== undefined) ? res.continuousInspect : false;
        var tabVal = (res && res.activeTab && ['overview', 'colors', 'typography', 'assets', 'inspect'].indexOf(res.activeTab) !== -1) ? res.activeTab : "overview";
        var colorSubtab = (res && res.colorSubtab && ['all', 'categories'].indexOf(res.colorSubtab) !== -1) ? res.colorSubtab : "all";

        console.log("[DEBUG] Settings from storage:", { darkMode: darkVal, continuousInspect: contVal, activeTab: tabVal, colorSubtab: colorSubtab });
        
        // Apply all settings together after DOM is ready
        self.applyAllSettings(darkVal, contVal, tabVal, colorSubtab);

        console.log("[DEBUG] loadSettings complete");
      });
    } else {
      console.warn("[WARN] chrome.storage.local not available! Using defaults.");
      self.applyAllSettings(false, false, "overview", "all");
    }
  },

  applyAllSettings: function(darkMode, continuousInspect, activeTab, colorSubtab) {
    console.log("[DEBUG] applyAllSettings called with:", {darkMode, continuousInspect, activeTab, colorSubtab});
    var self = this;
    
    // Wait for DOM to be ready (use requestAnimationFrame to ensure elements exist)
    function applyWhenReady() {
      // Set state first
      self.isDarkMode = darkMode;
      self.continuousInspect = continuousInspect;
      
      // Apply dark mode UI
      var html = document.documentElement;
      var thumb = document.getElementById("dark-mode-thumb");
      var track = document.getElementById("dark-mode-track");
      
      if (darkMode) {
        html.classList.add("dark-mode");
        if (thumb) thumb.style.transform = "translateX(16px)";
        if (track) track.classList.replace("bg-slate-200", "bg-brand-500");
      } else {
        html.classList.remove("dark-mode");
        if (thumb) thumb.style.transform = "translateX(0)";
        if (track) track.classList.replace("bg-brand-500", "bg-slate-200");
      }
      
      // Apply continuous inspect UI
      var contTrack = document.getElementById("continuous-track");
      var contThumb = document.getElementById("continuous-thumb");
      if (contTrack && contThumb) {
        if (continuousInspect) {
          contTrack.classList.replace("bg-slate-200", "bg-brand-500");
          contTrack.classList.replace("dark:bg-slate-700", "dark:bg-brand-500");
          contThumb.style.transform = "translateX(16px)";
        } else {
          contTrack.classList.replace("bg-brand-500", "bg-slate-200");
          contTrack.classList.replace("dark:bg-brand-500", "dark:bg-slate-700");
          contThumb.style.transform = "translateX(0)";
        }
      }
      
      // Apply active tab after a small delay to ensure content is ready
      setTimeout(function() {
        console.log("[DEBUG] Switching to stored activeTab:", activeTab);
        self.switchTab(activeTab);
        
        // Apply color subtab if on colors tab
        if (activeTab === "colors") {
          setTimeout(function() {
            console.log("[DEBUG] Switching to stored colorSubtab:", colorSubtab);
            self.switchColorSubtab(colorSubtab);
          }, 100);
        }
      }, 50);
      
      console.log("[DEBUG] All settings applied");
    }
    
    // Try immediately first
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyWhenReady);
    } else {
      applyWhenReady();
    }
  },

  saveSettings: function () {
    console.log("[DEBUG] saveSettings() called with:", {
      darkMode: this.isDarkMode,
      continuousInspect: this.continuousInspect,
      activeTab: this.activeTab,
      colorSubtab: this.colorSubtab
    });
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        darkMode: this.isDarkMode,
        continuousInspect: this.continuousInspect,
        activeTab: this.activeTab,
        colorSubtab: this.colorSubtab
      }, function() {
        if (chrome.runtime.lastError) {
          console.error("[ERROR] chrome.storage.local.set() FAILED:", chrome.runtime.lastError.message);
        } else {
          console.log("[DEBUG] chrome.storage.local.set() succeeded");
        }
      });
    }
  },

  updateContinuousInspectUI: function () {
    console.log("[DEBUG] updateContinuousInspectUI(), continuousInspect:", this.continuousInspect);
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
    console.log("[DEBUG] toggleContinuousInspect() clicked");
    this.continuousInspect = !this.continuousInspect;
    this.updateContinuousInspectUI();
    this.saveSettings();
  },

  captureFullScreenshot: function () {
    this.showNotification("Capturing...", "Please don't scroll.");
    var self = this;
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
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
    toast.className = "fixed top-4 right-4 z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 min-w-[240px] animate-in slide-in-from-top-4 duration-300";
    toast.innerHTML =
      '<div class="flex items-start gap-3">' +
      '<div class="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>' +
      "<div>" +
      '<div class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-0.5">' + title + "</div>" +
      '<div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">' + msg + "</div>" +
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
      if (!this.continuousInspect && this.isInspecting) {
        this.toggleInspectMode();
      }
      if (sendResponse) sendResponse({ success: true });
    }
  },
};

window.CodePeekApp = CodePeekApp;

document.addEventListener("DOMContentLoaded", function () {
  console.log("[DEBUG] DOMContentLoaded fired at:", new Date().toISOString());
  console.log("[DEBUG] Document readyState:", document.readyState);
  CodePeekApp.init();
});

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log("[DEBUG] Runtime message received:", msg.type);
    CodePeekApp.handleMessage(msg, sender, sendResponse);
  });
}

console.log("[DEBUG] app.js loaded at:", new Date().toISOString());
