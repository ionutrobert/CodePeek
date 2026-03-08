// Sidepanel App - Premium Lavender Design System (ES5)

// Find the web content tab in the current window (exclude extension pages)
function findContentTab(callback) {
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
    if (callback) callback(null);
    return;
  }
  chrome.tabs.query({ currentWindow: true }, function(tabs) {
    if (chrome.runtime && chrome.runtime.lastError) {
      if (callback) callback(null);
      return;
    }
    var contentTab = null;
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var url = t.url || '';
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
        contentTab = t;
        break;
      }
    }
    callback(contentTab);
  });
}

var CodePeekApp = {
  activeTab: "overview",
  isInspecting: false,
  pageData: null,
  isDarkMode: false,
  continuousInspect: false,
  colorSubtab: "all", // 'all' or 'categories' for colors tab
  _toastTimer: null,
  mode: "designer", // 'designer' or 'developer'
  dataCache: {
    pageData: null,
    timestamp: 0,
    url: null
  },
  tabsByMode: {
    designer: ["overview", "colors", "typography", "assets", "rulers", "inspect"],
    developer: ["overview", "tech-stack", "code-snippets", "audit", "inspect"]
  },

  init: function () {
    this.bindEvents();
    this.loadSettings();

    // Defer initial data refresh to ensure content script injection and DOM ready
    var self = this;
    setTimeout(function () {
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
          self.invalidateCache();
          self.refreshData();
        }
      });
    }

    // Verify storage after init
    setTimeout(function() {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(null, function(data) {
        });
      }
    }, 2000);
  },

  bindEvents: function () {
    var self = this;

    // Navigation - event delegation on tab-bar container (or document if container not yet)
    var tabBar = document.getElementById("tab-bar");
    if (tabBar) {
      tabBar.addEventListener("click", function(e) {
        var btn = e.target.closest(".nav-button");
        if (btn && btn.dataset.tab) {
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
        self.toggleInspectMode();
      };
    }

    // Dark Mode Toggle
    var darkBtn = document.getElementById("dark-mode-toggle");
    if (darkBtn) {
      darkBtn.onclick = function () {
        self.setDarkMode(!self.isDarkMode);
      };
    }

    // Continuous Inspect Toggle
    var continuousToggle = document.getElementById("continuous-inspect-toggle");
    if (continuousToggle) {
      continuousToggle.onclick = function () {
        self.toggleContinuousInspect();
      };
    }

    // Mode switch via new switch button
    var modeSwitchBtn = document.getElementById("mode-switch");
    var modeSwitchThumb = document.getElementById("mode-switch-thumb");
    var modeLabelDesign = document.getElementById("mode-label-design");
    var modeLabelDev = document.getElementById("mode-label-dev");
    if (modeSwitchBtn) {
      modeSwitchBtn.onclick = function() {
        var newMode = self.mode === "designer" ? "developer" : "designer";
        self.switchMode(newMode);
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
        // Reset overlays before closing, wait for message to be sent
        findContentTab(function(tab) {
          if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'RESET_ALL_OVERLAYS' }, function() {
              if (chrome.runtime && chrome.runtime.lastError) {
                window.close();
                return;
              }
              setTimeout(function() { window.close(); }, 50);
            });
          } else {
            window.close();
          }
        });
      };
    }
  },

  refreshData: function () {
    var self = this;

    // Query active tab to avoid refreshing on extension pages
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (chrome.runtime.lastError) {
          console.error('[ERROR] tabs.query failed:', chrome.runtime.lastError.message);
          return;
        }
        var activeTab = tabs && tabs[0];
        if (!activeTab) return;

        // Check if active tab is an extension page (skip)
        if (activeTab.url && activeTab.url.startsWith('chrome-extension://')) {
          return;
        }

        // Check if URL is allowed (http, https, file)
        var url = activeTab.url || '';
        if (!/^https?:/.test(url) && !/^file:/.test(url)) {
          self.loadTabScript('overview', function() {
            if (typeof overviewTab !== 'undefined' && overviewTab.renderError) {
              overviewTab.renderError('Cannot extract data from this page. Please navigate to a website (http, https, or file URL).');
            }
          });
          return;
        }

        var now = Date.now();
        var cacheAge = now - self.dataCache.timestamp;
        if (self.dataCache.pageData && self.dataCache.url === url && cacheAge < 300000) {
          self.pageData = self.dataCache.pageData;
          self.loadTabScript(self.activeTab, function() {
            self.renderActiveTab();
          });
          return;
        }

        // Proceed with data extraction with retry logic
        var attempts = 0;
        var maxAttempts = 3;

        function attemptExtract() {
          attempts++;
          messaging.sendMessage("EXTRACT_PAGE_DATA", null, function (res) {
            if (res && res.success) {
              self.pageData = res.data;
              self.dataCache.pageData = res.data;
              self.dataCache.timestamp = Date.now();
              self.dataCache.url = url;
              // Lazy load tab script before rendering
              self.loadTabScript(self.activeTab, function() {
                self.renderActiveTab();
              });
            } else if (attempts < maxAttempts) {
              var delay = 200 * attempts; // 200ms, 400ms, 600ms
              setTimeout(attemptExtract, delay);
            } else {
              var errMsg = res && res.error ? res.error : 'No response';
              console.error('[ERROR] Failed to load data after ' + maxAttempts + ' attempts. Last error:', errMsg);
              // Show error UI with specific message
              self.loadTabScript('overview', function() {
                if (typeof overviewTab !== 'undefined' && overviewTab.renderError) {
                  overviewTab.renderError('Failed to load page data.<br><small class="text-slate-500">Error: ' + errMsg + '</small>');
                } else {
                  alert('Failed to load page data: ' + errMsg);
                }
              });
            }
          });
        }

        attemptExtract();
      });
    }
  },

  invalidateCache: function () {
    this.dataCache.pageData = null;
    this.dataCache.timestamp = 0;
    this.dataCache.url = null;
  },

  switchTab: function (tabId, save) {
    if (save === undefined) save = true;
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

    // Persist active tab selection
    if (save) this.saveSettings();

    // If switching to colors tab, ensure correct subtab is shown
    if (tabId === "colors") {
      this.switchColorSubtab(this.colorSubtab);
    }

    // Lazy load tab script and then render
    var self = this;
    this.loadTabScript(tabId, function() {
      self.renderActiveTab();
    });
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
        btn.classList.add("bg-white", "shadow-sm", "text-brand-600");
        btn.classList.remove("text-slate-400");
      } else {
        btn.classList.remove("bg-white", "shadow-sm", "text-brand-600");
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
      btn.innerHTML = '<div class="p-2.5 px-3 rounded-2xl text-slate-600 group-[.active]:text-brand-500 transition-all hover:bg-slate-100 active:scale-90">' + icon + '</div><div class="text-[10px] font-black uppercase tracking-wider mt-1 text-slate-600 group-[.active]:text-brand-500">' + label + '</div>';
      btn.className += " nav-button";
      btn.dataset.tab = tabId;
      container.appendChild(btn);
    });
  },

  switchMode: function(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;
    
    // Update mode switch UI
    var modeSwitch = document.getElementById("mode-switch");
    var modeSwitchThumb = document.getElementById("mode-switch-thumb");
    var modeLabelDesign = document.getElementById("mode-label-design");
    var modeLabelDev = document.getElementById("mode-label-dev");
    
    if (modeSwitch && modeSwitchThumb) {
      if (newMode === "designer") {
        // Switch to DESIGN - thumb on left, DESIGN label active
        modeSwitch.classList.remove("bg-brand-500");
        modeSwitch.classList.add("bg-slate-200");
        modeSwitchThumb.style.transform = "translateX(0)";
        if (modeLabelDesign) {
          modeLabelDesign.classList.remove("text-slate-400");
          modeLabelDesign.classList.add("text-slate-700");
        }
        if (modeLabelDev) {
          modeLabelDev.classList.remove("text-slate-700");
          modeLabelDev.classList.add("text-slate-400");
        }
      } else {
        // Switch to DEV - thumb on right, DEV label active
        modeSwitch.classList.remove("bg-slate-200");
        modeSwitch.classList.add("bg-brand-500");
        modeSwitchThumb.style.transform = "translateX(22px)";
        if (modeLabelDesign) {
          modeLabelDesign.classList.remove("text-slate-700");
          modeLabelDesign.classList.add("text-slate-400");
        }
        if (modeLabelDev) {
          modeLabelDev.classList.remove("text-slate-400");
          modeLabelDev.classList.add("text-slate-700");
        }
      }
    }
    
    var modeSelect = document.getElementById("mode-select");
    if (modeSelect) modeSelect.value = newMode;
    this.renderTabBar();
    var tab = (newMode === "designer") ? (this.designerActiveTab || "overview") : (this.developerActiveTab || "overview");
    this.switchTab(tab, true); // Save after tab switch to persist active tab for this mode
    // Persist mode change to storage
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
    var indicator = btn ? btn.querySelector("div.rounded-full") : null;
    if (!btn) return;

    if (this.isInspecting) {
      // INSPECT MODE ACTIVE - turn indicator red with glow
      btn.classList.add("bg-brand-500", "text-white", "border-brand-600");
      btn.classList.remove("bg-slate-50", "text-slate-900");
      if (indicator) {
        indicator.classList.add("inspect-active");
        indicator.classList.remove("bg-slate-300");
        indicator.classList.add("bg-red-500", "shadow-red-500/50", "shadow-[0_0_10px_rgba(239,68,68,0.8)]");
      }
      messaging.sendMessage("START_INSPECT_MODE", null, function () {
      });
    } else {
      // INSPECT MODE INACTIVE - back to gray
      btn.classList.remove("bg-brand-500", "text-white", "border-brand-600");
      btn.classList.add("bg-slate-50", "text-slate-900");
      if (indicator) {
        indicator.classList.remove("inspect-active");
        indicator.classList.remove("bg-red-500", "shadow-red-500/50", "shadow-[0_0_10px_rgba(239,68,68,0.8)]");
        indicator.classList.add("bg-slate-300");
      }
      messaging.sendMessage("STOP_INSPECT_MODE", null);
    }
  },

  setDarkMode: function (val) {

    var oldVal = this.isDarkMode;
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

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ darkMode: val }, function() {
        if (chrome.runtime.lastError) {
          console.error("[ERROR] chrome.storage.local.set(darkMode) FAILED:", chrome.runtime.lastError.message);
        } else {
          // Verify
          chrome.storage.local.get(['darkMode'], function(res) {
            if (chrome.runtime.lastError) {
              console.error("[ERROR] Verify get failed:", chrome.runtime.lastError.message);
            } else {
            }
          });
        }
      });
    } else {
      console.warn("[WARN] chrome.storage.local not available for storing darkMode!");
    }
  },

  loadSettings: function () {
    var self = this;

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['darkMode', 'continuousInspect', 'mode', 'designerActiveTab', 'developerActiveTab', 'colorSubtab'], function (res) {
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
          contThumb.style.transform = "translateX(16px)";
        } else {
          contTrack.classList.replace("bg-brand-500", "bg-slate-200");
          contThumb.style.transform = "translateX(0)";
        }
      }

      // Update mode switch UI
      var modeSwitch = document.getElementById("mode-switch");
      var modeSwitchThumb = document.getElementById("mode-switch-thumb");
      var modeLabelDesign = document.getElementById("mode-label-design");
      var modeLabelDev = document.getElementById("mode-label-dev");
      
      if (modeSwitch && modeSwitchThumb) {
        if (mode === "designer") {
          modeSwitch.classList.remove("bg-brand-500");
          modeSwitch.classList.add("bg-slate-200");
          modeSwitchThumb.style.transform = "translateX(0)";
          if (modeLabelDesign) {
            modeLabelDesign.classList.remove("text-slate-400");
            modeLabelDesign.classList.add("text-slate-700");
          }
          if (modeLabelDev) {
            modeLabelDev.classList.remove("text-slate-700");
            modeLabelDev.classList.add("text-slate-400");
          }
        } else {
          modeSwitch.classList.remove("bg-slate-200");
          modeSwitch.classList.add("bg-brand-500");
          modeSwitchThumb.style.transform = "translateX(22px)";
          if (modeLabelDesign) {
            modeLabelDesign.classList.remove("text-slate-700");
            modeLabelDesign.classList.add("text-slate-400");
          }
          if (modeLabelDev) {
            modeLabelDev.classList.remove("text-slate-400");
            modeLabelDev.classList.add("text-slate-700");
          }
        }
      }
      
      var modeSelect = document.getElementById("mode-select");
      if (modeSelect) modeSelect.value = mode;

      // Render tab bar for current mode
      self.renderTabBar();

      // Determine initial tab based on mode
      var initialTab = (mode === "designer") ? designerTab : developerTab;

      // Switch to initial tab (no save)
      setTimeout(function() {
        self.switchTab(initialTab, false);
        if (initialTab === "colors") {
          setTimeout(function() {
            self.switchColorSubtab(self.colorSubtab);
          }, 100);
        }
      }, 50);

    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyWhenReady);
    } else {
      applyWhenReady();
    }
  },

  saveSettings: function () {
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
        }
      });
    }
  },

  updateContinuousInspectUI: function () {
    var track = document.getElementById("continuous-track");
    var thumb = document.getElementById("continuous-thumb");
    if (track && thumb) {
      if (this.continuousInspect) {
        track.classList.replace("bg-slate-200", "bg-brand-500");
        thumb.style.transform = "translateX(16px)";
      } else {
        track.classList.replace("bg-brand-500", "bg-slate-200");
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
    try {
      this.showNotification("Capturing...", "Please don't scroll.");
      var self = this;
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.tabs.query({ currentWindow: true }, function(tabs) {
          if (chrome.runtime && chrome.runtime.lastError) {
            self.showNotification("Failed", "Could not read browser tabs.");
            return;
          }
          var targetTab = null;
          // Find a content tab (non-extension, non-chrome URL)
          for (var i = 0; i < tabs.length; i++) {
            var t = tabs[i];
            var url = t.url || '';
            if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
              targetTab = t;
              break;
            }
          }
          var targetTabId = targetTab ? targetTab.id : null;
          if (!targetTabId) {
            console.warn('[DEBUG] No content tab found, fallback to active');
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
              if (chrome.runtime && chrome.runtime.lastError) {
                self.showNotification("Failed", "Could not get active tab.");
                return;
              }
              targetTabId = tabs && tabs[0] ? tabs[0].id : null;
              self.sendCaptureMessage(targetTabId);
            });
            return;
          }
          self.sendCaptureMessage(targetTabId);
        });
      } else {
        console.error('[DEBUG] chrome.runtime not available for screenshot');
      }
    } catch (e) {
      console.error('[DEBUG] captureFullScreenshot exception:', e);
    }
  },

  sendCaptureMessage: function(tabId) {
    var self = this;
    chrome.runtime.sendMessage({
      type: "CAPTURE_FULL_PAGE",
      tabId: tabId
    }, function (res) {
      if (chrome.runtime && chrome.runtime.lastError) {
        self.showNotification("Failed", "Could not capture page.");
        return;
      }
      if (res && res.success) {
        self.stitchAndDownload(res.captures, res.totalWidth, res.totalHeight, res.filename);
      } else {
        self.showNotification("Failed", "Could not capture page.");
      }
    });
  },

  stitchAndDownload: function(captures, totalWidth, totalHeight, filename) {
    var canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    var ctx = canvas.getContext('2d');
    var pending = captures.length;
    if (pending === 0) {
      console.error('[DEBUG] No captures received');
      this.showNotification("Failed", "No captures received.");
      return;
    }
    var self = this;
    var completed = 0;
    var failed = 0;

    captures.forEach(function(cap) {
      var img = new Image();
      img.onload = function() {
        // Calculate actual dimensions to draw, handling partial tiles on edges
        var drawWidth = Math.min(img.width, totalWidth - cap.offsetX);
        var drawHeight = Math.min(img.height, totalHeight - cap.offsetY);

        if (drawWidth > 0 && drawHeight > 0) {
          // Draw only the visible portion of the captured tile
          ctx.drawImage(img, 0, 0, drawWidth, drawHeight, cap.offsetX, cap.offsetY, drawWidth, drawHeight);
        } else {
        }

        pending--;
        completed++;

        if (pending === 0) {
          self.finalizeScreenshot(canvas, filename, completed, failed);
        }
      };
      img.onerror = function() {
        console.error('[DEBUG] Failed to load capture image at offset', cap.offsetX, cap.offsetY);
        pending--;
        failed++;
        if (pending === 0) {
          self.finalizeScreenshot(canvas, filename, completed, failed);
        }
      };
      img.src = cap.dataUrl;
    });
  },

  finalizeScreenshot: function(canvas, filename, completed, failed) {
    var self = this;

    canvas.toBlob(function(blob) {
      if (!blob) {
        self.showNotification("Failed", "Could not create image blob.");
        return;
      }

      var url = URL.createObjectURL(blob);
      var downloadFilename = filename || 'fullpage.png';

      // Use chrome.downloads API for reliable extension downloads
      if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
        chrome.downloads.download({
          url: url,
          filename: downloadFilename,
          saveAs: false
        }, function(downloadId) {
          if (chrome.runtime.lastError) {
            console.error('[DEBUG] chrome.downloads error:', chrome.runtime.lastError.message);
            // Fallback to <a> click
            self.triggerDownload(url, downloadFilename);
          } else {
            self.showNotification("Success", "Full-page screenshot saved!");
          }
          setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
        });
      } else {
        self.triggerDownload(url, downloadFilename);
        self.showNotification("Success", "Full-page screenshot saved!");
        setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
      }
    }, 'image/png');
  },

  triggerDownload: function(url, filename) {
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  showToast: function (message, duration, toastId) {
    var id = toastId || "measure-mode-toast";
    var timeout = typeof duration === "number" ? duration : 5000;
    var toast = document.getElementById(id);
    var self = this;

    if (!toast) {
      this.showNotification("Info", message);
      return;
    }

    toast.textContent = message || "";
    toast.classList.remove("hidden");

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }

    this._toastTimer = setTimeout(function () {
      self._toastTimer = null;
      self.hideToast(id);
    }, timeout);
  },

  hideToast: function (toastId) {
    var id = toastId || "measure-mode-toast";
    var toast = document.getElementById(id);

    if (toast) {
      toast.classList.add("hidden");
    }

    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }
  },

  showNotification: function (title, msg) {
    var toast = document.createElement("div");
    toast.className = "fixed top-4 right-4 z-[100] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 min-w-[240px] animate-in slide-in-from-top-4 duration-300";
    toast.innerHTML =
      '<div class="flex items-start gap-3">' +
      '<div class="p-2 bg-brand-50 text-brand-600 rounded-xl"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>' +
      "<div>" +
      '<div class="text-xs font-black text-slate-900 uppercase tracking-widest mb-0.5">' + title + "</div>" +
      '<div class="text-[11px] text-slate-500 font-medium">' + msg + "</div>" +
      "</div></div>";

    document.body.appendChild(toast);
    setTimeout(function () {
      toast.classList.add("animate-out", "fade-out", "slide-out-to-top-2");
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 3000);
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
    if (msg && msg.type === "RULER_ADDED") {
      if (typeof rulersTab !== 'undefined') {
        rulersTab.addRuler(msg.payload);
      }
      if (sendResponse) sendResponse({ success: true });
    } else if (msg && msg.type === "RULER_UPDATED") {
      if (typeof rulersTab !== 'undefined') {
        rulersTab.updateRuler(msg.payload.id, msg.payload.position);
      }
      if (sendResponse) sendResponse({ success: true });
    } else if (msg && msg.type === "RULERS_CLEARED") {
      if (typeof rulersTab !== 'undefined') {
        rulersTab.clearRulers();
      }
      if (sendResponse) sendResponse({ success: true });
    } else if (msg && msg.type === "ELEMENT_INSPECTED") {
      this.lastInspected = msg.payload;
      this.switchTab("inspect");
      if (!this.continuousInspect && this.isInspecting) {
        this.toggleInspectMode();
      }
      if (sendResponse) sendResponse({ success: true });
    } else if (msg && msg.type === "MEASUREMENT_COMPLETE") {
      if (typeof rulersTab !== 'undefined' && typeof rulersTab.showMeasurement === 'function') {
        rulersTab.showMeasurement(msg.payload.distance);
      }
      if (sendResponse) sendResponse({ success: true });
    } else {
      if (sendResponse) sendResponse({ success: false, error: 'Unknown message type' });
    }
  },
};

// Lazy loading for tab scripts
CodePeekApp.loadedTabs = {};

CodePeekApp.loadTabScript = function(tabName, callback) {
  // Map tab names to their script file names and global object names
  var tabScriptMap = {
    overview: { script: 'tab-overview.js', global: 'overviewTab' },
    colors: { script: 'tab-colors.js', global: 'colorsTab' },
    typography: { script: 'tab-typography.js', global: 'typographyTab' },
    assets: { script: 'tab-assets.js', global: 'assetsTab' },
    inspect: { script: 'element-inspector.js', global: 'elementInspector' },
    rulers: { script: 'tab-rulers.js', global: 'rulersTab' },
    'tech-stack': { script: 'tab-tech-stack.js', global: 'techStackTab' },
    'code-snippets': { script: 'tab-code-snippets.js', global: 'codeSnippetsTab' },
    audit: { script: 'tab-audit.js', global: 'auditTab' }
  };

  var tabInfo = tabScriptMap[tabName];
  if (!tabInfo) {
    if (callback) callback();
    return;
  }

  // Check if already loaded
  if (this.loadedTabs[tabName] || window[tabInfo.global]) {
    this.loadedTabs[tabName] = true;
    if (callback) callback();
    return;
  }

  var self = this;
  var script = document.createElement('script');
  script.src = 'components/' + tabInfo.script + '?v=2';
  script.onload = function() {
    self.loadedTabs[tabName] = true;
    if (callback) callback();
  };
  script.onerror = function() {
    console.error('[ERROR] Failed to load tab script:', tabName);
    if (callback) callback();
  };
  document.head.appendChild(script);
};

window.CodePeekApp = CodePeekApp;

function showToast(message, duration, toastId) {
  if (window.CodePeekApp && typeof window.CodePeekApp.showToast === "function") {
    window.CodePeekApp.showToast(message, duration, toastId);
  }
}

function hideToast(toastId) {
  if (window.CodePeekApp && typeof window.CodePeekApp.hideToast === "function") {
    window.CodePeekApp.hideToast(toastId);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  CodePeekApp.init();
});

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    CodePeekApp.handleMessage(msg, sender, sendResponse);
  });
}

// When sidepanel closes, turn off all overlays in the content tab
window.addEventListener('unload', function () {
  findContentTab(function(tab) {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'RESET_ALL_OVERLAYS' }, function () {
        if (chrome.runtime && chrome.runtime.lastError) {
          return;
        }
      });
    }
  });
});
