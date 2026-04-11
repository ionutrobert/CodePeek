// Floating mode detection and handlers
(function() {
  // Suppress extension context invalidated errors
  window.onerror = function(msg, url, line) {
    if (msg && msg.indexOf("Extension context invalidated") !== -1) {
      return true; // suppress completely
    }
    return false;
  };

  // Detect floating mode: either via query param OR by checking if we're in an iframe
  var params = new URLSearchParams(window.location.search);
  var isFloating = params.get('floating') === 'true' || (window.self !== window.top && window.parent !== window);

  if (isFloating) {
    document.body.classList.add('floating-mode');
    document.documentElement.classList.add('floating-mode');

    // Show return to sidebar button, hide close button
    var returnBtn = document.getElementById('return-to-sidebar');
    var floatToggle = document.getElementById('float-toggle');
    var closeBtn = document.getElementById('close-sidepanel');

    if (returnBtn) returnBtn.classList.remove('hidden');
    if (closeBtn) closeBtn.classList.add('hidden');

    // Detect if running from src/ folder (dev) or root (dist)
    // Check current URL to determine the correct path
    var currentPath = window.location.pathname;
    var isDevMode = currentPath.indexOf('/src/') !== -1;
    var sidepanelPath = isDevMode ? 'src/sidepanel/index.html' : 'sidepanel/index.html';
    console.log('[Code Peek] Detected mode:', isDevMode ? 'dev (src/)' : 'dist', '- using path:', sidepanelPath);

    // Open sidebar and close floating panel
    // MUST call chrome.sidePanel.open() synchronously to preserve user gesture
    function handleReturnToSidebar(e) {
      console.log('[Code Peek] Return to sidebar triggered');

      if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.windows) {
        // Get the window ID
        chrome.windows.getCurrent(function(win) {
          var windowId = win.id;
          console.log('[Code Peek] Opening sidebar for window:', windowId);

          // First setOptions to register the panel
          chrome.sidePanel.setOptions({
            enabled: true,
            path: sidepanelPath
          }, function() {
            if (chrome.runtime.lastError) {
              console.error('[Code Peek] Error setting options:', chrome.runtime.lastError.message);
              // Still try to close floating panel
              closeFloatingPanel();
              return;
            }

            // Now open the sidebar
            chrome.sidePanel.open({ windowId: windowId }, function() {
              if (chrome.runtime.lastError) {
                console.error('[Code Peek] Error opening sidebar:', chrome.runtime.lastError.message);
              } else {
                console.log('[Code Peek] Sidebar opened');
              }
              // Close the floating panel after sidebar opens (or fails)
              closeFloatingPanel();
            });
          });
        });
      } else {
        console.error('[Code Peek] Chrome APIs not available');
        closeFloatingPanel();
      }
    }

    function closeFloatingPanel() {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'RETURN_TO_SIDEBAR' }, '*');
      }
    }

    // Attach handlers to both buttons
    if (returnBtn) {
      returnBtn.addEventListener('click', handleReturnToSidebar);
    }

    if (floatToggle) {
      floatToggle.addEventListener('click', handleReturnToSidebar);
    }
  }
})();

