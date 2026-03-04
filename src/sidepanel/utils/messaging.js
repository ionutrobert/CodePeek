// Messaging utility - Plain ES5 JavaScript
var messaging = {
   sendMessage: function(type, payload, callback) {
     var self = this;
     
     if (typeof chrome === 'undefined' || !chrome.runtime) {
       if (callback) callback({ success: false, error: 'Chrome API not available' });
       return;
     }
     
     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
       if (chrome.runtime.lastError) {
         if (callback) callback({ success: false, error: chrome.runtime.lastError.message });
         return;
       }
       if (!tabs || !tabs[0]) {
         if (callback) callback({ success: false, error: 'No active tab' });
         return;
       }
       
       var tabId = tabs[0].id;
       var attempts = 0;
       var maxAttempts = 3;
       var timeoutId = null;
       
       function attempt() {
         attempts++;
         chrome.tabs.sendMessage(tabId, {
           type: type,
           payload: payload || {}
         }, function(response) {
           if (chrome.runtime.lastError) {
             var err = chrome.runtime.lastError.message;
             
             // Suppress expected errors for chrome:// URLs and protected pages
             if (err.indexOf('Cannot access a chrome:// URL') !== -1 ||
                 err.indexOf('Receiving end does not exist') !== -1) {
               if (callback) callback({ success: false, error: err });
               return;
             }
             
             if (console && console.debug) console.debug('[DEBUG] Message error (attempt ' + attempts + '):', err);
             
             // If content script not present, try to inject and retry (but only once)
             if (err.indexOf('Receiving end does not exist') !== -1 && attempts < maxAttempts) {
               chrome.runtime.sendMessage({
                 type: 'INJECT_CONTENT_SCRIPT',
                 tabId: tabId
               }, function(injResp) {
                 if (chrome.runtime.lastError) {
                   if (console && console.debug) console.debug('[DEBUG] Injection request failed:', chrome.runtime.lastError.message);
                   if (callback) callback({ success: false, error: chrome.runtime.lastError.message });
                   return;
                 }
                 setTimeout(function() {
                   attempts = 0;
                   attempt();
                 }, 300);
               });
               return;
             }
             
             if (callback) callback({ success: false, error: err });
           } else if (callback) {
             clearTimeout(timeoutId);
             callback(response || { success: true });
           }
         });
         
         if (callback) {
           timeoutId = setTimeout(function() {
             if (attempts < maxAttempts) {
               if (console && console.debug) console.debug('[DEBUG] Message timeout, retrying...');
               attempt();
             } else {
               callback({ success: false, error: 'Timeout - content script not responding' });
             }
           }, 8000);
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
