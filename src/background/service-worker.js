// Service worker for Code Peek - Plain ES5
var DEBUG = false;

if (DEBUG) console.log("Code Peek service worker starting...");

var SCREENSHOT_API_BASE = "https://cloudflare-screenshot-api.hassanrkbiz.workers.dev";
var MAX_HEIGHT = 10000;
var OVERLAP = 50;

if (typeof window !== 'undefined') {
  window.onerror = function(msg, url, line) {
    console.error("SW Global Error:", msg, "at", url + ":" + line);
    return true;
  };
  window.onunhandledrejection = function(e) {
    console.error("SW Unhandled Rejection:", e.reason);
  };
}

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

chrome.action.onClicked.addListener(function (tab) {
  if (DEBUG) console.log("Icon clicked");

  if (chrome.sidePanel) {
    chrome.sidePanel.open({ windowId: tab.windowId }, function () {
      if (DEBUG) console.log("Side panel opened");
    });
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  var tabId, hostname, title, filename;
  
  try {
    if (DEBUG) console.log("SW received:", message.type);

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

    if (message.type === "INJECT_CONTENT_SCRIPT") {
      tabId = message.tabId;
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ["src/content/bundle.js"],
        },
        function (results) {
          if (chrome.runtime.lastError) {
            console.error("Injection failed:", chrome.runtime.lastError.message);
            try { sendResponse({ success: false, error: chrome.runtime.lastError.message }); } catch (e) {}
          } else {
            if (DEBUG) console.log("Content script injected into tab", tabId);
            try { sendResponse({ success: true }); } catch (e) {}
          }
        }
      );
      return true;
    }

    if (message.type === "SIDEPANEL_CLOSED") {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "DISABLE_INSPECT_AND_MEASURE" });
        }
      });
      if (sendResponse) sendResponse({ success: true });
      return true;
    }

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
    try { sendResponse({ success: false, error: e.message }); } catch (e2) {}
    return true;
  }
});

function handleFullPageCapture(message, sendResponse) {
  var tabId = message && message.tabId;
  var captureStartTime = Date.now();
  var currentTabUrl = "";

  // Check if URL is restricted and cannot be captured
  function isRestrictedUrl(url) {
    var i;
    if (!url) return false;
    var restricted = ["chrome://", "chrome-extension://", "about:", "edge://", "brave://", "vivaldi://", "opera://", "file:///"];
    for (i = 0; i < restricted.length; i++) {
      if (url.indexOf(restricted[i]) === 0) return true;
    }
    return false;
  }

  // Get user-friendly error message for capture failures
  function getUserFriendlyError(errorMsg, url) {
    if (!errorMsg) errorMsg = "";
    errorMsg = errorMsg.toLowerCase();
    
    if (isRestrictedUrl(url)) {
      return "Cannot capture screenshots of browser pages (chrome://, about:, etc.). Please navigate to a regular website.";
    }
    if (errorMsg.indexOf("permission") !== -1 || errorMsg.indexOf("activetab") !== -1) {
      return "Screenshot permission not available. Click the extension icon and try again.";
    }
    if (errorMsg.indexOf("cannot access") !== -1 || errorMsg.indexOf("no tab") !== -1) {
      return "Cannot access this page. The page may be protected or not fully loaded.";
    }
    if (errorMsg.indexOf("invalid url") !== -1) {
      return "Invalid page URL. Please navigate to a valid website.";
    }
    // Return original error if no friendly match
    return "Screenshot failed: " + (errorMsg || "Unknown error");
  }

  function getActiveTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs && tabs[0];
      if (!tab) {
        try { sendResponse({ success: false, error: "No active tab found. Please open a webpage first." }); } catch(e) {}
        return;
      }
      // Check for restricted URLs before proceeding
      if (isRestrictedUrl(tab.url)) {
        try {
          sendResponse({
            success: false,
            error: getUserFriendlyError("", tab.url)
          });
        } catch(e) {}
        return;
      }
      currentTabUrl = tab.url || "";
      callback(tab);
    });
  }

  function sendMessageToTab(targetTabId, msg, callback) {
    chrome.tabs.sendMessage(targetTabId, msg, function(response) {
      if (chrome.runtime.lastError) {
        callback({ success: false, error: chrome.runtime.lastError.message });
      } else {
        callback(response || { success: false, error: "No response" });
      }
    });
  }

  function captureViewport(windowId, callback) {
    chrome.tabs.captureVisibleTab(windowId, { format: "png" }, function(dataUrl) {
      var friendlyError;
      if (chrome.runtime.lastError) {
        friendlyError = getUserFriendlyError(chrome.runtime.lastError.message, currentTabUrl);
        callback({ success: false, error: friendlyError });
      } else if (!dataUrl) {
        callback({ success: false, error: "Screenshot returned empty. Please try again." });
      } else {
        callback({ success: true, dataUrl: dataUrl });
      }
    });
  }

  function loadImage(dataUrl, callback) {
    var img = new Image();
    img.onload = function() {
      callback({ success: true, width: img.width, height: img.height, img: img });
    };
    img.onerror = function() {
      callback({ success: false, error: "Failed to load image" });
    };
    img.src = dataUrl;
  }

  function stitchImages(images, totalWidth, totalHeight, callback) {
    var canvas, ctx, y, i, img, drawY, reader;
    
    try {
      canvas = new OffscreenCanvas(totalWidth, totalHeight);
      ctx = canvas.getContext('2d');
      y = 0;
      
      for (i = 0; i < images.length; i++) {
        img = images[i];
        drawY = Math.max(0, y - (i > 0 ? OVERLAP : 0));
        ctx.drawImage(img.img, 0, drawY);
        y += img.height - OVERLAP;
      }

      canvas.convertToBlob({ type: 'image/png' }).then(function(blob) {
        reader = new FileReader();
        reader.onload = function() {
          callback({ success: true, dataUrl: reader.result });
        };
        reader.onerror = function() {
          callback({ success: false, error: "Failed to convert blob" });
        };
        reader.readAsDataURL(blob);
      }).catch(function(err) {
        callback({ success: false, error: err.message });
      });
    } catch (e) {
      callback({ success: false, error: e.message });
    }
  }

  function captureFullPage(tab) {
    var targetTabId = tab.id;
    var windowId = tab.windowId;
    var dims, pageHeight, pageWidth, viewportHeight, viewportWidth, filename, hostname, title;

    sendMessageToTab(targetTabId, { type: "GET_SCROLL_DIMENSIONS" }, function(dimResponse) {
      if (!dimResponse.success) {
        captureViewportOnly(tab, "Failed to get dimensions: " + (dimResponse.error || "unknown"));
        return;
      }

      dims = dimResponse.data;
      pageHeight = Math.min(dims.height, MAX_HEIGHT);
      pageWidth = dims.width;
      viewportHeight = dims.viewportHeight;
      viewportWidth = dims.viewportWidth;

      if (pageHeight <= viewportHeight) {
        captureViewportOnly(tab, null);
        return;
      }

      filename = "screenshot.png";
      if (tab && tab.title && tab.url) {
        try {
          hostname = new URL(tab.url).hostname;
          title = tab.title.substring(0, 80).replace(/[\\/:*?"<>|]/g, "_");
          if (hostname && title) filename = hostname + " - " + title + ".png";
        } catch (e) {}
      }

      sendMessageToTab(targetTabId, { type: "HIDE_STICKY_FIXED" }, function(hideResponse) {
        if (!hideResponse.success) {
          if (DEBUG) console.log('[DEBUG] Failed to hide sticky elements, continuing anyway');
        }

        scrollToAndCapture(targetTabId, pageHeight - viewportHeight, function() {
          setTimeout(function() {
            scrollToAndCapture(targetTabId, 0, function() {
              setTimeout(function() {
                captureSections(tab, targetTabId, windowId, pageHeight, viewportHeight, viewportWidth, filename, function(result) {
                  sendMessageToTab(targetTabId, { type: "SHOW_STICKY_FIXED" }, function() {
                    if (result.success) {
                      try {
                        sendResponse({
                          success: true,
                          dataUrl: result.dataUrl,
                          filename: result.filename
                        });
                      } catch(e) {}
                    } else {
                      try {
                        sendResponse({ success: false, error: result.error });
                      } catch(e) {}
                    }
                  });
                });
              }, 300);
            });
          }, 500);
        });
      });
    });
  }

  function scrollToAndCapture(targetTabId, position, callback) {
    sendMessageToTab(targetTabId, { type: "SCROLL_TO_POSITION", payload: { y: position } }, function() {
      setTimeout(callback, 150);
    });
  }

  function captureSections(tab, targetTabId, windowId, pageHeight, viewportHeight, viewportWidth, filename, finalCallback) {
    var images = [];
    var currentY = 0;
    var sectionIndex = 0;

    function captureNext() {
      if (currentY >= pageHeight) {
        stitchImages(images, viewportWidth, pageHeight, function(stitchResult) {
          if (stitchResult.success) {
            finalCallback({ success: true, dataUrl: stitchResult.dataUrl, filename: filename });
          } else {
            if (images.length > 0) {
              finalCallback({ success: true, dataUrl: images[0].img.src, filename: filename });
            } else {
              finalCallback({ success: false, error: stitchResult.error });
            }
          }
        });
        return;
      }

      scrollToAndCapture(targetTabId, currentY, function() {
        captureViewport(windowId, function(captureResult) {
          if (!captureResult.success) {
            if (images.length > 0) {
              stitchImages(images, viewportWidth, Math.min(currentY, pageHeight), function(stitchResult) {
                if (stitchResult.success) {
                  finalCallback({ success: true, dataUrl: stitchResult.dataUrl, filename: filename });
                } else {
                  finalCallback({ success: false, error: captureResult.error });
                }
              });
            } else {
              finalCallback({ success: false, error: captureResult.error });
            }
            return;
          }

          loadImage(captureResult.dataUrl, function(imgResult) {
            if (!imgResult.success) {
              finalCallback({ success: false, error: imgResult.error });
              return;
            }

            images.push(imgResult);
            sectionIndex++;
            currentY += viewportHeight - OVERLAP;
            setTimeout(captureNext, 100);
          });
        });
      });
    }

    captureNext();
  }

  function captureViewportOnly(tab, errorMsg) {
    var filename = "screenshot.png";
    var hostname, title, friendlyError;

    if (DEBUG && errorMsg) console.log('[DEBUG] Falling back to viewport capture:', errorMsg);

    if (tab && tab.title && tab.url) {
      try {
        hostname = new URL(tab.url).hostname;
        title = tab.title.substring(0, 80).replace(/[\\/:*?"<>|]/g, "_");
        if (hostname && title) filename = hostname + " - " + title + ".png";
      } catch (e) {}
    }

    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, function(dataUrl) {
      if (chrome.runtime.lastError) {
        friendlyError = getUserFriendlyError(chrome.runtime.lastError.message, tab.url);
        try { sendResponse({ success: false, error: friendlyError }); } catch(e) {}
        return;
      }
      if (!dataUrl) {
        try { sendResponse({ success: false, error: "Screenshot returned empty. Please try again." }); } catch(e) {}
        return;
      }
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
        getActiveTab(captureFullPage);
        return;
      }
      captureFullPage(tab);
    });
  } else {
    getActiveTab(captureFullPage);
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
  var i, timestamp;

  for (i = 0; i < assets.length; i++) {
    combined += "/* " + assets[i].filename + " */\n";
    combined += assets[i].content + "\n\n";
  }

  timestamp = new Date().toISOString().split("T")[0];
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
