// Code Peek - Side Panel App
// Plain JavaScript (ES5 compatible)

(function() {
  'use strict';
  
  // State
  var currentTab = 'overview';
  var inspectMode = false;
  var pageData = null;
  
  // DOM Elements
  var tabButtons, tabContents, inspectToggle, inspectToggleBtn;
  
  // Initialize
  function init() {
    console.log('Initializing Code Peek app...');
    
    tabButtons = document.querySelectorAll('.tab-button');
    tabContents = document.querySelectorAll('.tab-content');
    inspectToggleBtn = document.getElementById('inspect-toggle');
    
    bindEvents();
    loadCurrentTab();
    setupMessageListener();
  }
  
  // Bind event listeners
  function bindEvents() {
    // Tab switching
    tabButtons.forEach(function(button) {
      button.addEventListener('click', function(e) {
        var tab = e.target.dataset.tab;
        switchTab(tab);
      });
    });
    
    // Inspect mode toggle
    if (inspectToggleBtn) {
      inspectToggleBtn.addEventListener('click', toggleInspectMode);
    }
    
    // Close inspector
    var closeInspector = document.getElementById('close-inspector');
    if (closeInspector) {
      closeInspector.addEventListener('click', closeInspectorPanel);
    }
    
    // Refresh buttons
    var refreshOverview = document.getElementById('refresh-overview');
    if (refreshOverview) {
      refreshOverview.addEventListener('click', function() {
        refreshTab('overview');
      });
    }
    
    var refreshTypography = document.getElementById('refresh-typography');
    if (refreshTypography) {
      refreshTypography.addEventListener('click', function() {
        refreshTab('typography');
      });
    }
    
    // Export colors
    var exportColors = document.getElementById('export-colors');
    if (exportColors) {
      exportColors.addEventListener('click', function() {
        if (typeof colorsTab !== 'undefined' && colorsTab.showExportModal) {
          colorsTab.showExportModal();
        }
      });
    }
    
    // Download all CSS
    var downloadCSS = document.getElementById('download-all-css');
    if (downloadCSS) {
      downloadCSS.addEventListener('click', function() {
        if (typeof overviewTab !== 'undefined' && overviewTab.downloadAllCSS) {
          overviewTab.downloadAllCSS();
        }
      });
    }
    
    // Download all assets
    var downloadAssets = document.getElementById('download-all-assets');
    if (downloadAssets) {
      downloadAssets.addEventListener('click', function() {
        if (typeof assetsTab !== 'undefined' && assetsTab.downloadAll) {
          assetsTab.downloadAll();
        }
      });
    }
  }
  
  // Switch tab
  function switchTab(tab) {
    console.log('Switching to tab:', tab);
    currentTab = tab;
    
    // Update button styles
    tabButtons.forEach(function(btn) {
      btn.classList.remove('active', 'border-b-2', 'border-blue-400', 'text-blue-400');
      btn.classList.add('text-gray-400');
    });
    
    var activeButton = document.querySelector('[data-tab="' + tab + '"]');
    if (activeButton) {
      activeButton.classList.add('active', 'border-b-2', 'border-blue-400', 'text-blue-400');
      activeButton.classList.remove('text-gray-400');
    }
    
    // Show/hide content
    tabContents.forEach(function(content) {
      content.classList.add('hidden');
    });
    
    var activeContent = document.getElementById('tab-' + tab);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }
    
    // Load tab data
    loadCurrentTab();
  }
  
  // Load current tab data
  function loadCurrentTab() {
    console.log('Loading tab:', currentTab);
    
    try {
      switch (currentTab) {
        case 'overview':
          if (typeof overviewTab !== 'undefined' && overviewTab.load) {
            overviewTab.load();
          }
          break;
        case 'colors':
          if (typeof colorsTab !== 'undefined' && colorsTab.load) {
            colorsTab.load();
          }
          break;
        case 'typography':
          if (typeof typographyTab !== 'undefined' && typographyTab.load) {
            typographyTab.load();
          }
          break;
        case 'assets':
          if (typeof assetsTab !== 'undefined' && assetsTab.load) {
            assetsTab.load();
          }
          break;
      }
    } catch (error) {
      console.error('Failed to load tab:', currentTab, error);
      showError('Failed to load ' + currentTab + ': ' + error.message);
    }
  }
  
  // Refresh tab
  function refreshTab(tab) {
    console.log('Refreshing tab:', tab);
    
    try {
      switch (tab) {
        case 'overview':
          if (typeof overviewTab !== 'undefined' && overviewTab.refresh) {
            overviewTab.refresh();
          }
          break;
        case 'typography':
          if (typeof typographyTab !== 'undefined' && typographyTab.refresh) {
            typographyTab.refresh();
          }
          break;
        case 'colors':
          if (typeof colorsTab !== 'undefined' && colorsTab.refresh) {
            colorsTab.refresh();
          }
          break;
        case 'assets':
          if (typeof assetsTab !== 'undefined' && assetsTab.refresh) {
            assetsTab.refresh();
          }
          break;
      }
    } catch (error) {
      console.error('Failed to refresh tab:', tab, error);
      showError('Failed to refresh ' + tab + ': ' + error.message);
    }
  }
  
  // Toggle inspect mode
  function toggleInspectMode() {
    inspectMode = !inspectMode;
    
    if (inspectMode) {
      inspectToggleBtn.textContent = 'Inspect Mode: ON';
      inspectToggleBtn.classList.add('bg-red-600', 'hover:bg-red-700');
      inspectToggleBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      startInspectMode();
    } else {
      inspectToggleBtn.textContent = 'Inspect Mode: OFF';
      inspectToggleBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
      inspectToggleBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
      stopInspectMode();
    }
  }
  
  // Start inspect mode
  function startInspectMode() {
    console.log('Starting inspect mode...');
    
    if (typeof messaging !== 'undefined' && messaging.sendMessage) {
      messaging.sendMessage('START_INSPECT_MODE', {}).then(function(response) {
        if (response && response.success) {
          var inspector = document.getElementById('element-inspector');
          if (inspector) {
            inspector.classList.remove('hidden');
          }
        }
      }).catch(function(error) {
        console.error('Failed to start inspect mode:', error);
        showError('Failed to start inspect mode');
      });
    }
  }
  
  // Stop inspect mode
  function stopInspectMode() {
    console.log('Stopping inspect mode...');
    
    if (typeof messaging !== 'undefined' && messaging.sendMessage) {
      messaging.sendMessage('STOP_INSPECT_MODE', {}).catch(function(error) {
        console.error('Failed to stop inspect mode:', error);
      });
    }
    
    var inspector = document.getElementById('element-inspector');
    if (inspector) {
      inspector.classList.add('hidden');
    }
    
    closeInspectorPanel();
  }
  
  // Close inspector panel
  function closeInspectorPanel() {
    if (typeof elementInspector !== 'undefined' && elementInspector.clear) {
      elementInspector.clear();
    }
    var inspector = document.getElementById('element-inspector');
    if (inspector) {
      inspector.classList.add('hidden');
    }
  }
  
  // Setup message listener
  function setupMessageListener() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        console.log('Side panel received message:', message.type);
        
        switch (message.type) {
          case 'ELEMENT_INSPECTED':
            // Show inspector panel
            var inspector = document.getElementById('element-inspector');
            if (inspector) {
              inspector.classList.remove('hidden');
            }
            // Display the data
            if (typeof elementInspector !== 'undefined' && elementInspector.display) {
              elementInspector.display(message.payload);
            }
            break;
          case 'PAGE_DATA_UPDATED':
            pageData = message.payload;
            break;
          case 'ERROR':
            showError(message.payload.error);
            break;
        }
        
        sendResponse({ received: true });
        return true;
      });
    }
  }
  
  // Show error message
  function showError(message) {
    var errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-900 border border-red-700 text-red-100 px-3 py-2 rounded mb-3 text-sm';
    errorDiv.innerHTML = '<strong>Error:</strong> ' + message;
    
    var container = document.querySelector('#tab-' + currentTab);
    if (container) {
      container.insertBefore(errorDiv, container.firstChild);
      setTimeout(function() {
        errorDiv.remove();
      }, 5000);
    }
  }
  
  // Show success message
  function showSuccess(message) {
    var successDiv = document.createElement('div');
    successDiv.className = 'bg-green-900 border border-green-700 text-green-100 px-3 py-2 rounded mb-3 text-sm';
    successDiv.innerHTML = '<strong>Success:</strong> ' + message;
    
    var container = document.querySelector('#tab-' + currentTab);
    if (container) {
      container.insertBefore(successDiv, container.firstChild);
      setTimeout(function() {
        successDiv.remove();
      }, 3000);
    }
  }
  
  // Set assets view
  function setAssetsView(view) {
    if (typeof assetsTab !== 'undefined' && assetsTab.setView) {
      assetsTab.setView(view);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose to global scope
  window.CodePeekApp = {
    switchTab: switchTab,
    refreshTab: refreshTab,
    toggleInspectMode: toggleInspectMode,
    closeInspector: closeInspectorPanel,
    showError: showError,
    showSuccess: showSuccess,
    setAssetsView: setAssetsView
  };
  
})();
