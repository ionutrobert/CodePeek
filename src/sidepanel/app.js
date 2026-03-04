// Sidepanel App - Premium Lavender Design System (ES5)
var CodePeekApp = {
  activeTab: "overview",
  isInspecting: false,
  pageData: null,
  isDarkMode: false,
  continuousInspect: false,
  colorSubtab: "all", // 'all' or 'categories' for colors tab
  mode: "designer", // 'designer' or 'developer'
  tabsByMode: {
    designer: ["overview", "colors", "typography", "rulers", "inspect"],
    developer: ["overview", "tech-stack", "code-snippets", "audit", "inspect"]
  },

  init: function () {
    console.log("[DEBUG] CodePeekApp.init() called", new Date().toISOString());
    this.bindEvents();
    this.loadSettings();
    // Defer initial data refresh to ensure content script injection and DOM ready
    var self = this;
    setTimeout(function () {
      console.log("[DEBUG] Initial refreshData after delay");
      self.refreshData();
    }, 1500);

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

    // Navigation - event delegation on tab-bar container (or document if container not yet)
    var tabBar = document.getElementById("tab-bar");
    if (tabBar) {
      tabBar.addEventListener("click", function(e) {
        var btn = e.target.closest(".nav-button");
        if (btn && btn.dataset.tab) {
          console.log("[DEBUG] Navigate to:", btn.dataset.tab);
          self.switchTab(btn.dataset.tab);
        }
      });
    } else {
      // Fallback
      document.addEventListener("click", function(e) {
        var btn = e.target.closest(".nav-button");
        if (btn && btn.dataset.tab) self.switchTab(btn.dataset.tab);
      });
    }

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

    // Mode switch via dropdown
    var modeSelect = document.getElementById("mode-select");
    if (modeSelect) {
      modeSelect.addEventListener("change", function() {
        var newMode = this.value;
        if (newMode === "designer" || newMode === "developer") {
          console.log("[DEBUG] Mode switch to:", newMode);
          self.switchMode(newMode);
        }
      });
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

  // Render bottom tab bar based on current mode
  renderTabBar: function () {
    var container = document.getElementById("tab-bar");
    if (!container) return;
    container.innerHTML = ""; // Clear existing

    var tabs = this.tabsByMode[this.mode] || [];
    var self = this;

    tabs.forEach(function(tabId) {
      var btn = document.createElement("button");
      btn.className = "tab-button flex flex-col items-center gap-1 group relative py-2";
      btn.setAttribute("data-tab", tabId);
      // Icon and label based on tabId (same as before but mapped)
      var icons = {
        overview: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>',
        colors: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>',
        typography: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
        assets: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
        inspect: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>',
        rulers: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v16h16V4H4z" stroke-dasharray="4 4"/><path d="M4 4h16v16H4z" fill="none" stroke-dasharray="4 4"/></svg>',
        'tech-stack': '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>',
        'code-snippets': '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>',
        audit: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>'
      };
      var labels = {
        overview: "Overview",
        colors: "Colors",
        typography: "Typography",
        assets: "Assets",
        inspect: "Inspect",
        rulers: "Rulers",
        'tech-stack': "Tech",
        'code-snippets': "Code",
        audit: "Audit"
      };
      var icon = icons[tabId] || '';
      var label = labels[tabId] || tabId;
      btn.innerHTML = '<div class="p-2.5 px-3 rounded-2xl group-[.active]:bg-brand-500 group-[.active]:text-white text-slate-400 transition-all hover:bg-slate-100 dark:hover:bg-slate-900 group-[.active]:shadow-lg group-[.active]:shadow-brand-500/20 active:scale-90">' + icon + '</div><div class="text-[10px] font-black uppercase tracking-wider mt-1 group-[.active]:text-brand-500">' + label + '</div>';
      btn.className += " nav-button";
      btn.dataset.tab = tabId;
      container.appendChild(btn);
    });
  },

  switchMode: function(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;
    this.saveSettings();
    // Update UI: badge, menu, tab bar
    this.renderTabBar();
    // Switch to active tab for this mode
    var tab = (newMode === "designer") ? (this.designerActiveTab || "overview") : (this.developerActiveTab || "overview");
    this.switchTab(tab, false); // don't save yet, already saving mode
  },

  switchTab: function(tabId, save) {
    if (save === undefined) save = true;
    this.activeTab = tabId;
    // Hide all tab contents
    document.querySelectorAll(".tab-content").forEach(function(el) {
      el.classList.add("hidden");
    });
    var activeEl = document.getElementById("tab-" + tabId);
    if (activeEl) activeEl.classList.remove("hidden");

    // Update nav buttons highlight
    document.querySelectorAll(".tab-bar .nav-button, .nav-button").forEach(function(btn) {
      if (btn.dataset.tab === tabId) btn.classList.add("active");
      else btn.classList.remove("active");
    });

    this.renderActiveTab();

    // Persist active tab for current mode
    if (this.mode === "designer") this.designerActiveTab = tabId;
    else this.developerActiveTab = tabId;
    if (save) this.saveSettings();
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
      case "rulers":
        if (typeof rulersTab !== "undefined") rulersTab.render(this.pageData);
        break;
      case "tech-stack":
        if (typeof techStackTab !== "undefined") techStackTab.render(this.pageData);
        break;
      case "code-snippets":
        if (typeof codeSnippetsTab !== "undefined") codeSnippetsTab.render(this.pageData);
        break;
      case "audit":
        if (typeof auditTab !== "undefined") auditTab.render(this.pageData);
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
      chrome.storage.local.get(['darkMode', 'continuousInspect', 'mode', 'designerActiveTab', 'developerActiveTab', 'colorSubtab'], function (res) {
        console.log("[DEBUG] storage.get callback:", res);
        if (chrome.runtime.lastError) {
          console.error("[ERROR] chrome.storage.local.get() FAILED:", chrome.runtime.lastError.message);
          // Apply defaults
          self.applyAllSettings(false, false, "designer", "overview", "all");
          return;
        }

        var darkVal = (res && res.darkMode !== undefined) ? res.darkMode : false;
        var contVal = (res && res.continuousInspect !== undefined) ? res.continuousInspect : false;
        var modeVal = (res && res.mode === 'designer' || res.mode === 'developer') ? res.mode : "designer";
        var designerTab = (res && res.designerActiveTab && self.isValidTab(res.designerActiveTab, 'designer')) ? res.designerActiveTab : "overview";
        var developerTab = (res && res.developerActiveTab && self.isValidTab(res.developerActiveTab, 'developer')) ? res.developerActiveTab : "overview";
        var colorSub = (res && res.colorSubtab && (res.colorSubtab === 'all' || res.colorSubtab === 'categories')) ? res.colorSubtab : "all";

        self.applyAllSettings(darkVal, contVal, modeVal, designerTab, developerTab, colorSub);
      });
    } else {
      console.warn("[WARN] chrome.storage.local not available!");
      self.applyAllSettings(false, false, "designer", "overview", "all");
    }
  },

  isValidTab: function(tab, mode) {
    var tabs = this.tabsByMode[mode] || [];
    return tabs.indexOf(tab) !== -1;
  },

  applyAllSettings: function(darkMode, continuousInspect, mode, designerTab, developerTab, colorSubtab) {
    console.log("[DEBUG] applyAllSettings called with:", {darkMode, continuousInspect, mode, designerTab, developerTab, colorSubtab});
    var self = this;

    function applyWhenReady() {
      // Set state
      self.isDarkMode = darkMode;
      self.continuousInspect = continuousInspect;
      self.mode = mode;
      self.colorSubtab = colorSubtab;

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

      // Update mode badge and menu
      var modeBadge = document.getElementById("mode-badge");
      if (modeBadge) {
        modeBadge.textContent = "[" + (mode === "designer" ? "DESIGN" : "DEV") + "]";
        modeBadge.className = "px-2 py-1 rounded text-xs font-bold " + (mode === "designer" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300");
      }
      var modeSelect = document.getElementById("mode-select");
      if (modeSelect) modeSelect.value = mode;

      // Render tab bar for current mode
      self.renderTabBar();

      // Determine initial tab based on mode
      var initialTab = (mode === "designer") ? designerTab : developerTab;
      console.log("[DEBUG] Initial tab for mode", mode, ":", initialTab);

      // Switch to initial tab (no save)
      setTimeout(function() {
        self.switchTab(initialTab, false);
        if (initialTab === "colors") {
          setTimeout(function() {
            self.switchColorSubtab(self.colorSubtab);
          }, 100);
        }
      }, 50);

      console.log("[DEBUG] All settings applied");
    }

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
      colorSubtab: this.colorSubtab,
      mode: this.mode,
      activeTab: this.activeTab
    });
    // Build save object including per-mode active tabs
    var saveData = {
      darkMode: this.isDarkMode,
      continuousInspect: this.continuousInspect,
      colorSubtab: this.colorSubtab,
      mode: this.mode,
      designerActiveTab: this.mode === "designer" ? this.activeTab : (this.designerActiveTab || "overview"),
      developerActiveTab: this.mode === "developer" ? this.activeTab : (this.developerActiveTab || "overview")
    };
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(saveData, function() {
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
