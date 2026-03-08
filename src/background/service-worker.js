// Service worker for Code Peek - Plain ES5
// Keep alive to handle messages

console.log("Code Peek service worker starting...");

// Global error handler to prevent crashes
if (typeof window !== 'undefined') {
  window.onerror = function(msg, url, line) {
    console.error("SW Global Error:", msg, "at", url + ":" + line);
    return true;
  };
  window.onunhandledrejection = function(e) {
    console.error("SW Unhandled Rejection:", e.reason);
  };
}

// Configure side panel on install
chrome.runtime.onInstalled.addListener(function (details) {
  console.log("Installed:", details.reason);

  if (chrome.sidePanel) {
    chrome.sidePanel.setOptions(
      {
        enabled: true,
        path: "sidepanel/index.html",
      },
      function () {
        console.log("Side panel configured");
      }
    );
  }
});

// Open side panel when icon clicked
chrome.action.onClicked.addListener(function (tab) {
  console.log("Icon clicked");

  if (chrome.sidePanel) {
    chrome.sidePanel.open({ windowId: tab.windowId }, function () {
      console.log("Side panel opened");
    });
  }
});

// Handle messages from side panel
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Prevent any exception from breaking the listener
  try {
    console.log("SW received:", message.type);

  // Handle download messages
  if (message.type === "DOWNLOAD_FILE") {
    handleDownload(message.payload, sendResponse);
    return true;
  }

  if (message.type === "DOWNLOAD_CSS_COLLECTION") {
    handleDownloadCSSCollection(message.payload, sendResponse);
    return true;
  }

  if (message.type === "DOWNLOAD_CSS_URL") {
    handleDownloadCSSUrl(message.payload, sendResponse);
    return true;
  }

  // Inject content script into a tab on demand
  if (message.type === "INJECT_CONTENT_SCRIPT") {
    var tabId = message.tabId;
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ["src/content/bundle.js"],
      },
      function (results) {
        if (chrome.runtime.lastError) {
          console.error("Injection failed:", chrome.runtime.lastError.message);
          // Don't send error - content script may already be loaded
          try { sendResponse({ success: false, error: chrome.runtime.lastError.message }); } catch (e) {}
        } else {
          console.log("Content script injected into tab", tabId);
          try { sendResponse({ success: true }); } catch (e) {}
        }
      }
    );
    return true; // keep channel open
  }

  // Handle sidepanel close: disable inspect and measure in active tab
  if (message.type === "SIDEPANEL_CLOSED") {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "DISABLE_INSPECT_AND_MEASURE" });
      }
    });
    if (sendResponse) sendResponse({ success: true });
    return true;
  }

   // Messages FROM extension page (side panel) -> handle screenshot actions first
   if (message.type === "CAPTURE_FULL_PAGE") {
     handleFullPageCapture(message, sendResponse);
     return true;
   }

   if (message.type === "CAPTURE_VISIBLE_TAB") {
     chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
       if (chrome.runtime.lastError) {
         try {
           sendResponse({
             success: false,
             error: chrome.runtime.lastError.message,
           });
         } catch (e) {}
       } else {
         try {
           sendResponse({ success: true, dataUrl: dataUrl });
         } catch (e) {}
       }
     });
     return true;
   }

   // Messages FROM content script (sender.tab exists) -> forward to extension pages (side panel)
   if (sender.tab) {
     try {
       chrome.runtime.sendMessage(message, function (response) {
         try {
           sendResponse({ received: true });
         } catch (e) {
           console.error("Error in forward callback:", e);
         }
       });
     } catch (err) {
       console.error("Error forwarding from content:", err);
       // Still respond to content to prevent hangs
       try { sendResponse({ received: false, error: err.message }); } catch (e2) {}
     }
     return true;
   }

   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
     if (tabs && tabs[0]) {
       chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
         try {
           if (chrome.runtime.lastError) {
             console.log(
               "Error sending to content:",
               chrome.runtime.lastError.message
             );
             try {
               sendResponse({
                 success: false,
                 error: chrome.runtime.lastError.message,
               });
             } catch (e) {}
           } else {
             try {
               sendResponse(response || { success: false });
             } catch (e) {}
           }
         } catch (e) {
           console.error("Error in tabs.sendMessage callback:", e);
         }
       });
     } else {
       try {
         sendResponse({ success: false, error: "No tab" });
       } catch (e) {
         console.error("Error sending no-tab response:", e);
       }
     }
   });
   return true;
  } catch (e) {
    console.error("SW unhandled error in onMessage:", e);
    // Try to respond to avoid hangs
    try { sendResponse({ success: false, error: e.message }); } catch (e2) {}
    return true;
  }
});

function handleFullPageCapture(message, sendResponse) {
  var tabId = message && message.tabId;
  var captureStartTime = Date.now();

  function startCapture(tab) {
    // Generate filename for download
    var filename = "fullpage.png";
    if (tab && tab.title && tab.url) {
      try {
        var hostname = new URL(tab.url).hostname;
        var title = tab.title.substring(0, 80).replace(/[\\/:*?"<>|]/g, "_");
        if (hostname && title) filename = hostname + " - " + title + ".png";
      } catch (e) {}
    }

    // Helper to safely restore scrollbars and sticky elements
    function cleanupAndRespond(response) {
      chrome.tabs.sendMessage(tab.id, { type: "SHOW_STICKY_FIXED" }, { frameId: 0 }, function() {
        chrome.tabs.sendMessage(tab.id, { type: "SHOW_SCROLLBARS" }, { frameId: 0 }, function() {
          try {
            sendResponse(response);
          } catch(e) {}
        });
      });
    }

    // Step 1: Hide scrollbars
    chrome.tabs.sendMessage(tab.id, { type: "HIDE_SCROLLBARS" }, { frameId: 0 }, function(hideResult) {
      if (chrome.runtime.lastError) {
        console.error('[DEBUG] HIDE_SCROLLBARS failed:', chrome.runtime.lastError.message);
        cleanupAndRespond({ success: false, error: "Failed to hide scrollbars: " + chrome.runtime.lastError.message });
        return;
      }

      // Step 2: Scroll to top-left
      chrome.tabs.sendMessage(tab.id, { type: "SCROLL_TO", payload: { x: 0, y: 0 } }, { frameId: 0 }, function(scrollResult) {
        if (chrome.runtime.lastError) {
          console.error('[DEBUG] Initial SCROLL_TO failed:', chrome.runtime.lastError.message);
          cleanupAndRespond({ success: false, error: "Failed to scroll: " + chrome.runtime.lastError.message });
          return;
        }

        // Step 3: Get page dimensions
        chrome.tabs.sendMessage(tab.id, { type: "GET_SCROLL_DIMENSIONS" }, { frameId: 0 }, function(dim) {
          if (chrome.runtime.lastError || !dim || !dim.success) {
            var errMsg = (chrome.runtime.lastError && chrome.runtime.lastError.message) || "Failed to get dimensions";
            console.error('[DEBUG] GET_SCROLL_DIMENSIONS failed:', errMsg);
            cleanupAndRespond({ success: false, error: errMsg });
            return;
          }

          var totalWidth = dim.data.width;
          var totalHeight = dim.data.height;
          var vw = dim.data.viewportWidth;
          var vh = dim.data.viewportHeight;
          var cols = Math.ceil(totalWidth / vw);
          var rows = Math.ceil(totalHeight / vh);

          console.log('[DEBUG] Page dimensions:', totalWidth, 'x', totalHeight, 'Viewport:', vw, 'x', vh, 'Grid:', cols, 'x', rows);

          var captures = [];
          var currentRow = 0;
          var currentCol = 0;
          var firstCapture = true;

          function captureNext() {
            if (currentRow >= rows) {
              // All captures complete
              console.log('[DEBUG] All captures complete, total:', captures.length, 'Time:', Date.now() - captureStartTime, 'ms');
              cleanupAndRespond({
                success: true,
                captures: captures,
                totalWidth: totalWidth,
                totalHeight: totalHeight,
                filename: filename
              });
              return;
            }

            var x = currentCol * vw;
            var y = currentRow * vh;

            // Clamp scroll position to not exceed page bounds
            if (x > totalWidth - vw) x = Math.max(0, totalWidth - vw);
            if (y > totalHeight - vh) y = Math.max(0, totalHeight - vh);

            // Scroll to position and wait for render
            chrome.tabs.sendMessage(tab.id, { type: "SCROLL_TO", payload: { x: x, y: y } }, { frameId: 0 }, function() {
              if (chrome.runtime.lastError) {
                console.error('[DEBUG] SCROLL_TO failed at', x, y, ':', chrome.runtime.lastError.message);
                // Continue to next tile despite error
                advanceToNext();
                return;
              }

              // Capture the viewport
              chrome.tabs.captureVisibleTab(tab.id, { format: "png" }, function(dataUrl) {
                if (chrome.runtime.lastError) {
                  console.error('[DEBUG] captureVisibleTab failed at', x, y, ':', chrome.runtime.lastError.message);
                } else if (dataUrl) {
                  console.log('[DEBUG] Captured tile at', x, y, 'size:', dataUrl.length);
                  captures.push({
                    dataUrl: dataUrl,
                    offsetX: x,
                    offsetY: y
                  });
                } else {
                  console.warn('[DEBUG] captureVisibleTab returned null/empty at', x, y);
                }

                // On first capture, hide sticky/fixed elements
                if (firstCapture) {
                  firstCapture = false;
                  chrome.tabs.sendMessage(tab.id, { type: "HIDE_STICKY_FIXED" }, { frameId: 0 }, function() {
                    advanceToNext();
                  });
                } else {
                  advanceToNext();
                }
              });
            });
          }

          function advanceToNext() {
            currentCol++;
            if (currentCol >= cols) {
              currentCol = 0;
              currentRow++;
            }
            // Small delay between captures to allow UI to settle
            setTimeout(captureNext, 50);
          }

          // Start the capture loop
          captureNext();
        });
      });
    });
  }

  if (tabId) {
    chrome.tabs.get(tabId, function(tab, getError) {
      if (getError || !tab) {
        // Fallback to active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          var tab = tabs[0];
          if (!tab) {
            try { sendResponse({ success: false, error: "No active tab" }); } catch(e) {}
            return;
          }
          startCapture(tab);
        });
        return;
      }
      startCapture(tab);
    });
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs[0];
      if (!tab) {
        try { sendResponse({ success: false, error: "No active tab" }); } catch(e) {}
        return;
      }
      startCapture(tab);
    });
  }
}

function handleDownload(payload, sendResponse) {
  var filename = payload.filename || "download.txt";
  var content = payload.content || "";
  var mimeType = payload.mimeType || "text/plain";

  var blob = new Blob([content], { type: mimeType });
  var url = URL.createObjectURL(blob);

  chrome.downloads.download(
    {
      url: url,
      filename: filename,
      saveAs: false,
    },
    function (downloadId) {
      if (chrome.runtime.lastError) {
        try {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } catch (e) {}
      } else {
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 1000);
        try {
          sendResponse({ success: true, downloadId: downloadId });
        } catch (e) {}
      }
    }
  );
}

function handleDownloadCSSCollection(payload, sendResponse) {
  var assets = payload.assets || [];
  var combined = "";

  for (var i = 0; i < assets.length; i++) {
    combined += "/* " + assets[i].filename + " */\n";
    combined += assets[i].content + "\n\n";
  }

  var timestamp = new Date().toISOString().split("T")[0];
  handleDownload(
    {
      filename: "css-collection-" + timestamp + ".css",
      content: combined,
      mimeType: "text/css",
    },
    sendResponse
  );
}

function handleDownloadCSSUrl(payload, sendResponse) {
  var url = payload.url;
  if (!url) {
    try {
      sendResponse({ success: false, error: "No URL provided" });
    } catch (e) {}
    return;
  }

  // Fetch the CSS file
  fetch(url)
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.text();
    })
    .then(function (css) {
      var filename = url.split("/").pop() || "stylesheet.css";
      handleDownload(
        {
          filename: filename,
          content: css,
          mimeType: "text/css",
        },
        sendResponse
      );
    })
    .catch(function (error) {
      console.error("Failed to fetch CSS:", error);
      try {
        sendResponse({ success: false, error: error.message });
      } catch (e) {}
    });
}

console.log("Service worker ready");
