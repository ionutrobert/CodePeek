// Messaging utility - Plain ES5 JavaScript
var messaging = {
  sendMessage: function(type, payload) {
    return new Promise(function(resolve) {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: type,
          payload: payload
        }, function(response) {
          resolve(response || { success: false });
        });
      } else {
        resolve({ success: false, error: 'Chrome API not available' });
      }
    });
  }
};
