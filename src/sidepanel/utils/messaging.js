// Messaging utility - Plain ES5 JavaScript
var messaging = {
  sendMessage: function(type, payload, callback) {
    var self = this;
    
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      if (callback) callback({ success: false, error: 'Chrome API not available' });
      return;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || !tabs[0]) {
        if (callback) callback({ success: false, error: 'No active tab' });
        return;
      }
      
      var tabId = tabs[0].id;
      var attempts = 0;
      var maxAttempts = 4;
      var timeoutId = null;
      
      function attempt() {
        attempts++;
        chrome.tabs.sendMessage(tabId, {
          type: type,
          payload: payload || {}
        }, function(response) {
          if (chrome.runtime.lastError) {
            var err = chrome.runtime.lastError.message;
            console.log('Message error (attempt ' + attempts + '):', err);
            
            // If content script not present, try to inject and retry
            if (err.indexOf('Receiving end does not exist') !== -1 && attempts < maxAttempts) {
              chrome.runtime.sendMessage({
                type: 'INJECT_CONTENT_SCRIPT',
                tabId: tabId
              }, function(injResp) {
                // Wait longer for script to initialize on slow pages
                setTimeout(function() {
                  // Reset attempts after successful injection to give it a fair shot
                  attempts = 0;
                  attempt();
                }, 500);
              });
              return;
            }
            
            if (callback) callback({ success: false, error: err });
          } else if (callback) {
            clearTimeout(timeoutId);
            callback(response || { success: false });
          }
        });
        
        // Add 10s timeout to prevent hanging
        if (callback) {
          timeoutId = setTimeout(function() {
            if (attempts < maxAttempts) {
              console.log('Message timeout, retrying...');
              attempt();
            } else {
              console.log('Message failed after timeout');
              callback({ success: false, error: 'Timeout - content script not responding' });
            }
          }, 10000);
        }
      }
      
      attempt();
    });
  },
  
  // Convenience methods
  extractColors: function(callback) {
    this.sendMessage('EXTRACT_COLORS', {}, callback);
  },
  
  extractTypography: function(callback) {
    this.sendMessage('EXTRACT_TYPOGRAPHY', {}, callback);
  },
  
  extractAssets: function(callback) {
    this.sendMessage('EXTRACT_ASSETS', {}, callback);
  },
  
  extractAll: function(callback) {
    this.sendMessage('EXTRACT_PAGE_DATA', {}, callback);
  },
  
  startInspect: function(callback) {
    this.sendMessage('START_INSPECT_MODE', {}, callback);
  },
  
  stopInspect: function(callback) {
    this.sendMessage('STOP_INSPECT_MODE', {}, callback);
  },
  
  downloadFile: function(filename, content, mimeType, callback) {
    this.sendMessage('DOWNLOAD_FILE', {
      filename: filename,
      content: content,
      mimeType: mimeType
    }, callback);
  }
};
