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
          }, { frameId: 0 }, function(response) {
            if (chrome.runtime.lastError) {
              var err = chrome.runtime.lastError.message;
              
              // Suppress expected errors for chrome:// URLs (protected pages)
              if (err.indexOf('Cannot access a chrome:// URL') !== -1) {
                if (callback) callback({ success: false, error: err });
                return;
              }
              
// Suppress expected errors silently
if (err.indexOf('Receiving end does not exist') !== -1 && attempts < maxAttempts) {
chrome.runtime.sendMessage({
type: 'INJECT_CONTENT_SCRIPT',
tabId: tabId
}, function(injResp) {
if (chrome.runtime.lastError) {
// Tab might be closed, suppress error
if (callback) callback({ success: false, error: 'Tab not available' });
return;
}
 setTimeout(function() {
 attempts = 0;
 attempt();
 }, 1000);
});
return;
}
              
                if (callback) callback({ success: false, error: err });
              }
             else if (callback) {
             clearTimeout(timeoutId);
             callback(response || { success: true });
           }
         });
         
 if (callback) {
 timeoutId = setTimeout(function() {
 if (attempts < maxAttempts) {
 attempt();
 } else {
 callback({ success: false, error: 'Page not responding. Try refreshing the page.' });
 }
 }, 5000);
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
   },
   
   toggleRulers: function(enabled, unit, callback) {
     this.sendMessage('TOGGLE_RULERS', { enabled: enabled, unit: unit }, callback);
   },
   
updateRulerUnit: function(unit, callback) {
    this.sendMessage('UPDATE_RULER_UNIT', { unit: unit }, callback);
  },

   setDistanceLinesVisible: function(visible, callback) {
     this.sendMessage('SET_DISTANCE_LINES_VISIBLE', { visible: visible }, callback);
   },

   setContextMenuVisible: function(visible, callback) {
     this.sendMessage('SET_CONTEXT_MENU_VISIBLE', { visible: visible }, callback);
   }
 };
