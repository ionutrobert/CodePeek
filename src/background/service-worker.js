// Service worker for Code Peek - Plain ES5
var DEBUG = false;
// Keep alive to handle messages

if (DEBUG) console.log("Code Peek service worker starting...");

// Screenshot API configuration
var SCREENSHOT_API_BASE = "https://cloudflare-screenshot-api.hassanrkbiz.workers.dev";

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
  if (DEBUG) console.log("Installed:", details.reason);

  if (chrome.sidePanel) {
    chrome.sidePanel.setOptions(
      {
        enabled: true,
        path: "sidepanel/index.html",
      },
      function () {
        if (DEBUG) console.log("Side panel configured");
      }
    );
  }
});

// Open side panel when icon clicked
chrome.action.onClicked.addListener(function (tab) {
  if (DEBUG) console.log("Icon clicked");

  if (chrome.sidePanel) {
    chrome.sidePanel.open({ windowId: tab.windowId }, function () {
      if (DEBUG) console.log("Side panel opened");
    });
  }
});

// Handle messages from side panel
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Prevent any exception from breaking the listener
  try {
    if (DEBUG) console.log("SW received:", message.type);

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
          if (DEBUG) console.log("Content script injected into tab", tabId);
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
             if (DEBUG) console.log(
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

  function getActiveTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs && tabs[0];
      if (!tab) {
        try { sendResponse({ success: false, error: "No active tab" }); } catch(e) {}
        return;
      }
      callback(tab);
    });
  }

  function captureCurrentViewport(tab) {
    // Generate filename
    var filename = "screenshot.png";
    if (tab && tab.title && tab.url) {
      try {
        var hostname = new URL(tab.url).hostname;
        var title = tab.title.substring(0, 80).replace(/[\\/:*?"<>|]/g, "_");
        if (hostname && title) filename = hostname + " - " + title + ".png";
      } catch (e) {}
    }

    // Capture the visible viewport - this captures exactly what user sees
    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, function(dataUrl) {
      if (chrome.runtime.lastError) {
        console.error('[DEBUG] captureVisibleTab failed:', chrome.runtime.lastError.message);
        try { sendResponse({ success: false, error: "Screenshot failed: " + chrome.runtime.lastError.message }); } catch(e) {}
        return;
      }

      if (!dataUrl) {
        try { sendResponse({ success: false, error: "Screenshot returned empty" }); } catch(e) {}
        return;
      }

      if (DEBUG) console.log('[DEBUG] Viewport screenshot captured, time:', Date.now() - captureStartTime, 'ms');
      try {
        sendResponse({
          success: true,
          dataUrl: dataUrl,
          filename: filename
        });
      } catch(e) {}
    });
  }

  if (tabId) {
    chrome.tabs.get(tabId, function(tab) {
      if (chrome.runtime.lastError || !tab) {
        getActiveTab(captureCurrentViewport);
        return;
      }
      captureCurrentViewport(tab);
    });
  } else {
    getActiveTab(captureCurrentViewport);
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

if (DEBUG) console.log("Service worker ready");
