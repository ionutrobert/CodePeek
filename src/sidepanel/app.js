// Sidepanel App - Nothing Design System (ES5)
var DEBUG = true;

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
  panelMode: "sidebar", // 'sidebar' or 'floating'
  floatingPosition: { top: 16, right: 16 },
  floatingSize: { width: 400, height: 500 },
  isDragging: false,
  isResizing: false,
  dragOffset: { x: 0, y: 0 },
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
    this.loadPanelSettings();
    this.checkFirstTimeInspectHighlight();

  // Minimal delay for content script injection
  var self = this;
  setTimeout(function () {
    self.refreshData();
  }, 300);

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
var btn = e.target.closest(".nav-item");
if (btn && btn.dataset.tab) {
self.switchTab(btn.dataset.tab);
}
});
} else {
// Fallback
document.addEventListener("click", function(e) {
var btn = e.target.closest(".nav-item");
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

  // Dark Mode Toggle (both button and track in utility menu)
  var darkBtn = document.getElementById("dark-mode-toggle");
  var darkModeTrack = document.getElementById("dark-mode-track");
  
  var handleDarkModeToggle = function() {
    self.setDarkMode(!self.isDarkMode);
  };
  
  if (darkBtn) {
    darkBtn.onclick = handleDarkModeToggle;
  }
  if (darkModeTrack) {
    darkModeTrack.onclick = handleDarkModeToggle;
    darkModeTrack.onkeydown = function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDarkModeToggle();
      }
    };
  }

    // Continuous Inspect Toggle
    var continuousToggle = document.getElementById("continuous-inspect-toggle");
    if (continuousToggle) {
      continuousToggle.onclick = function () {
        self.toggleContinuousInspect();
      };
    }

// Mode switch via neumorphic pill toggle
  var modeOptionDesign = document.getElementById("mode-option-design");
  var modeOptionDev = document.getElementById("mode-option-dev");
  
  if (modeOptionDesign) {
  modeOptionDesign.onclick = function() {
  if (self.mode !== "designer") {
  self.switchMode("designer");
  }
  };
  }
  
  if (modeOptionDev) {
  modeOptionDev.onclick = function() {
  if (self.mode !== "developer") {
  self.switchMode("developer");
  }
  };
  }
  
// Also check for old switch button (backward compatibility)
  var modeSwitchBtn = document.getElementById("mode-switch");
  if (modeSwitchBtn) {
    modeSwitchBtn.onclick = function() {
      var newMode = self.mode === "designer" ? "developer" : "designer";
      self.switchMode(newMode);
    };
  }

  // Float toggle button
  var floatBtn = document.getElementById("float-toggle");
  if (floatBtn) {
    floatBtn.onclick = function () {
      self.togglePanelMode();
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

  var shortcutsBtn = document.getElementById("shortcuts-btn");
  if (shortcutsBtn) {
    shortcutsBtn.onclick = function () {
      if (typeof shortcutsModal !== "undefined" && shortcutsModal.open) {
        shortcutsModal.open();
        var menu = document.getElementById("utility-menu");
        if (menu) menu.classList.add("hidden");
      }
    };
  }

  var showTipsBtn = document.getElementById("show-tips-btn");
  if (showTipsBtn) {
    showTipsBtn.onclick = function () {
      localStorage.removeItem("codepeek_onboarding_seen");
      self.refreshData();
      var menu = document.getElementById("utility-menu");
      if (menu) menu.classList.add("hidden");
      self.showNotification("Tips", "Onboarding tips restored");
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

  // Keyboard shortcuts for quick tab navigation
  document.addEventListener('keydown', function(e) {
    // Ignore if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }
    
    var key = e.key.toUpperCase();
    var shortcuts = {
      'C': 'colors',
      'T': 'typography',
      'A': 'assets',
      'O': 'overview',
      'I': 'inspect',
      'R': 'rulers'
    };
    
    if (shortcuts[key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var targetTab = shortcuts[key];
      var availableTabs = self.tabsByMode[self.mode] || [];
      if (availableTabs.indexOf(targetTab) !== -1) {
        e.preventDefault();
        self.switchTab(targetTab);
      }
    }
  });
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

document.querySelectorAll(".nav-item").forEach(function (btn) {
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
    
    // If elements don't exist, the tab hasn't been rendered yet - that's okay
    if (!all || !cats) {
      this.colorSubtab = subId;
      return;
    }

    all.classList.add("hidden");
    cats.classList.add("hidden");

    var active = document.getElementById("colors-subtab-" + subId);
    if (active) active.classList.remove("hidden");

    document.querySelectorAll(".subtab-btn").forEach(function (btn) {
      if (btn.dataset.subtab === subId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Persist color subtab selection
    this.colorSubtab = subId;
    this.saveSettings();
  },

  // Render bottom tab bar — Nothing design
  renderTabBar: function () {
    var container = document.getElementById("tab-bar");
    if (!container) return;
    container.innerHTML = "";

    var tabs = this.tabsByMode[this.mode] || [];
    var self = this;

    tabs.forEach(function(tabId) {
      var btn = document.createElement("button");
      btn.className = "nav-item";
      btn.setAttribute("data-tab", tabId);
      btn.setAttribute("role", "tab");
      btn.setAttribute("type", "button");

      var labels = {
        overview: "OVERVIEW",
        colors: "COLORS",
        typography: "TYPE",
        assets: "ASSETS",
        inspect: "INSPECT",
        rulers: "RULERS",
        'tech-stack': "STACK",
        'code-snippets': "CODE",
        audit: "AUDIT"
      };

      var icons = {
        overview: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
        colors: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" stroke-dasharray="2 2"/></svg>',
        typography: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>',
        assets: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
        inspect: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
        rulers: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M21.3 15.3 8.7 2.7a2.4 2.4 0 0 0-3.4 0l-2.6 2.6a2.4 2.4 0 0 0 0 3.4l12.6 12.6a2.4 2.4 0 0 0 3.4 0l2.6-2.6a2.4 2.4 0 0 0 0-3.4Z"/><path d="m7.5 10.5 2 2M10.5 7.5l2 2"/></svg>',
        'tech-stack': '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>',
        'code-snippets': '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>',
        audit: '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>'
      };

      var label = labels[tabId] || tabId.toUpperCase();
      var icon = icons[tabId] || '';

      if (tabId === self.activeTab) {
        btn.classList.add("active");
      }

      btn.innerHTML = icon + '<span class="nav-label">' + label + '</span>';
      btn.dataset.tab = tabId;
      container.appendChild(btn);
    });
  },

switchMode: function(newMode) {
  if (this.mode === newMode) return;
  this.mode = newMode;

  // Update mode toggle UI - Neumorphic pill design
  var designOption = document.getElementById("mode-option-design");
  var devOption = document.getElementById("mode-option-dev");

  if (designOption && devOption) {
  if (newMode === "designer") {
  // Switch to DESIGN
  designOption.classList.add("active");
  devOption.classList.remove("active");
  } else {
  // Switch to DEV
  devOption.classList.add("active");
  designOption.classList.remove("active");
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
    if (!btn) return;

    if (this.isInspecting) {
      btn.classList.add("text-accent");
      btn.style.borderColor = "var(--accent)";
      messaging.sendMessage("START_INSPECT_MODE", null, function () {
      });
    } else {
      btn.classList.remove("text-accent");
      btn.style.borderColor = "";
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
      html.classList.remove("light-mode");
      html.classList.add("dark-mode");
      if (track) track.classList.add("active");
    } else {
      html.classList.remove("dark-mode");
      html.classList.add("light-mode");
      if (track) track.classList.remove("active");
    }

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ darkMode: val }, function() {
        if (chrome.runtime.lastError) {
          console.error("[ERROR] chrome.storage.local.set(darkMode) FAILED:", chrome.runtime.lastError.message);
        }
      });
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

      // Apply dark mode UI — Nothing design system
      var html = document.documentElement;
      var track = document.getElementById("dark-mode-track");
      if (darkMode) {
        html.classList.remove("light-mode");
        html.classList.add("dark-mode");
        if (track) track.classList.add("active");
      } else {
        html.classList.remove("dark-mode");
        html.classList.add("light-mode");
        if (track) track.classList.remove("active");
      }

      // Update mode switch UI — Segmented control
      var modeOptionDesign = document.getElementById("mode-option-design");
      var modeOptionDev = document.getElementById("mode-option-dev");

      if (modeOptionDesign && modeOptionDev) {
        if (mode === "designer") {
          modeOptionDesign.classList.add("active");
          modeOptionDev.classList.remove("active");
        } else {
          modeOptionDev.classList.add("active");
          modeOptionDesign.classList.remove("active");
        }
      }

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
      developerActiveTab: this.mode === "developer" ? this.activeTab : (this.developerActiveTab || "overview"),
      panelMode: this.panelMode,
      floatingPosition: this.floatingPosition,
      floatingSize: this.floatingSize
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
        track.classList.add("active");
      } else {
        track.classList.remove("active");
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
        // Get the ACTIVE tab - the one the user is currently viewing
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (chrome.runtime && chrome.runtime.lastError) {
            self.showNotification("Failed", "Could not get active tab.");
            return;
          }
          var activeTab = tabs && tabs[0];
          if (!activeTab) {
            self.showNotification("Failed", "No active tab found.");
            return;
          }
          var url = activeTab.url || '';
          // Only screenshot http/https/file URLs
          if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            self.showNotification("Failed", "Cannot screenshot this page type.");
            return;
          }
          self.sendCaptureMessage(activeTab.id);
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
      if (res && res.success && res.dataUrl) {
        self.downloadScreenshot(res.dataUrl, res.filename);
      } else {
        var errorMsg = res && res.error ? res.error : "Could not capture page.";
        self.showNotification("Failed", errorMsg);
      }
    });
  },

  downloadScreenshot: function(dataUrl, filename) {
    var self = this;
    var downloadFilename = filename || 'fullpage.png';

    // Use chrome.downloads API for reliable extension downloads
    if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download({
        url: dataUrl,
        filename: downloadFilename,
        saveAs: false
      }, function(downloadId) {
        if (chrome.runtime.lastError) {
          console.error('[DEBUG] chrome.downloads error:', chrome.runtime.lastError.message);
          // Fallback to <a> click
          self.triggerDownload(dataUrl, downloadFilename);
        } else {
          self.showNotification("Success", "Full-page screenshot saved!");
        }
      });
    } else {
      self.triggerDownload(dataUrl, downloadFilename);
      self.showNotification("Success", "Full-page screenshot saved!");
    }
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
    toast.className = "toast-notification";
    toast.innerHTML = '<span class="text-secondary">[' + title.toUpperCase() + ']</span> <span class="text-primary">' + msg + '</span>';
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.classList.add("toast-hiding");
      setTimeout(function () {
        toast.remove();
      }, 250);
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

// ========== FLOATING PANEL METHODS ==========
  togglePanelMode: function () {
    var self = this;
    if (DEBUG) console.log('[Code Peek] togglePanelMode called, current mode:', this.panelMode);

    if (this.panelMode === 'sidebar') {
      // Switch to floating mode
      this.panelMode = 'floating';
      this.saveSettings();

      // Send message via chrome.runtime directly to ensure delivery
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        if (DEBUG) console.log('[Code Peek] Sending CREATE_FLOATING_PANEL via chrome.runtime');

        chrome.runtime.sendMessage({
          type: 'CREATE_FLOATING_PANEL',
          payload: {
            position: this.floatingPosition,
            size: this.floatingSize,
            mode: this.mode,
            activeTab: this.activeTab,
            isDarkMode: this.isDarkMode
          }
        }, function(response) {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.error('[Code Peek] CREATE_FLOATING_PANEL error:', chrome.runtime.lastError.message);
            self.panelMode = 'sidebar';
            self.showNotification('Error', 'Failed to create floating panel: ' + chrome.runtime.lastError.message);
            return;
          }
          if (DEBUG) console.log('[Code Peek] CREATE_FLOATING_PANEL response:', response);
          if (!response || !response.success) {
            console.error('[Code Peek] CREATE_FLOATING_PANEL failed:', response);
            self.panelMode = 'sidebar';
            self.showNotification('Error', 'Failed to create floating panel');
            return;
          }
          // Close the sidebar after floating panel is created
          setTimeout(function() {
            if (typeof chrome !== 'undefined' && chrome.sidePanel) {
              chrome.sidePanel.setOptions({ enabled: false });
            }
            window.close();
          }, 100);
        });
      } else {
        console.error('[Code Peek] chrome.runtime not available');
        this.panelMode = 'sidebar';
        this.showNotification('Error', 'Extension context not available');
      }
    }
  },

  applyPanelMode: function () {
    // This is now handled in content script
    // Just update UI state
    var floatBtn = document.getElementById('float-toggle');
    var iconSidebar = document.getElementById('float-icon-sidebar');
    var iconFloating = document.getElementById('float-icon-floating');

    if (this.panelMode === 'floating') {
      if (floatBtn) floatBtn.setAttribute('aria-pressed', 'true');
      if (iconSidebar) iconSidebar.classList.add('hidden');
      if (iconFloating) iconFloating.classList.remove('hidden');
    } else {
      if (floatBtn) floatBtn.setAttribute('aria-pressed', 'false');
      if (iconSidebar) iconSidebar.classList.remove('hidden');
      if (iconFloating) iconFloating.classList.add('hidden');
    }
  },

  loadPanelSettings: function () {
    var self = this;
    
    // Check if running in floating iframe (has ?floating=true in URL)
    var params = new URLSearchParams(window.location.search);
    var isFloatingIframe = params.get('floating') === 'true';
    
    if (isFloatingIframe) {
      // Running in iframe - set to floating mode
      this.panelMode = 'floating';
      this.applyPanelMode();
      return;
    }
    
    // Running in actual sidebar - always start as sidebar mode
    // Reset any previously saved floating state
    this.panelMode = 'sidebar';
    this.applyPanelMode();
    
    // Still load position/size settings for when we go floating
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['floatingPosition', 'floatingSize'], function (data) {
        if (data.floatingPosition) self.floatingPosition = data.floatingPosition;
        if (data.floatingSize) self.floatingSize = data.floatingSize;
      });
    }
  }
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

CodePeekApp.checkFirstTimeInspectHighlight = function() {
  var hasSeenInspectHighlight = localStorage.getItem('codepeek_inspect_highlight_seen');
  if (!hasSeenInspectHighlight) {
    var inspectBtn = document.getElementById('inspect-toggle');
    if (inspectBtn) {
      inspectBtn.classList.add('btn-icon-first-time');
      setTimeout(function() {
        inspectBtn.classList.remove('btn-icon-first-time');
        localStorage.setItem('codepeek_inspect_highlight_seen', 'true');
      }, 6000);
    }
  }
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
