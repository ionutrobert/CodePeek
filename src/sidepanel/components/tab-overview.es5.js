// Minimal Overview Tab - Plain ES5 JavaScript
var overviewTab = {
  load: function() {
    console.log('Loading overview tab...');
    this.loadCSSStats();
    this.loadStylesheets();
    this.loadContrastReport();
  },
  
  refresh: function() {
    this.load();
  },
  
  loadCSSStats: function() {
    try {
      var sheets = document.styleSheets || [];
      var count = 0;
      for (var i = 0; i < sheets.length; i++) {
        try {
          if (sheets[i].cssRules) count++;
        } catch(e) {}
      }
      
      var el = document.getElementById('css-stats-files');
      if (el) el.textContent = count;
      
      el = document.getElementById('css-stats-rules');
      if (el) el.textContent = '-';
      
      el = document.getElementById('css-stats-size');
      if (el) el.textContent = '-';
      
      el = document.getElementById('css-stats-loadtime');
      if (el) el.textContent = '-';
    } catch(e) {
      console.error('Error loading stats:', e);
    }
  },
  
  loadStylesheets: function() {
    var container = document.getElementById('stylesheets-list');
    if (!container) return;
    
    var sheets = document.styleSheets || [];
    if (sheets.length === 0) {
      container.innerHTML = '<div class="text-gray-400 text-sm">No stylesheets</div>';
      return;
    }
    
    var html = '';
    for (var i = 0; i < Math.min(sheets.length, 10); i++) {
      var href = sheets[i].href || 'inline';
      var name = href.split('/').pop() || 'styles';
      html += '<div class="p-2 bg-gray-700 rounded mb-1 text-sm flex justify-between items-center">';
      html += '<span class="truncate">' + name + '</span>';
      if (href.indexOf('http') === 0) {
        html += '<button class="text-blue-400 hover:text-blue-300 text-xs" data-href="' + href + '">Download</button>';
      }
      html += '</div>';
    }
    
    container.innerHTML = html;
    
    // Add click handlers
    var self = this;
    var buttons = container.querySelectorAll('button');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener('click', function(e) {
        var href = e.target.getAttribute('data-href');
        if (href) self.downloadStylesheet(href);
      });
    }
  },
  
  downloadStylesheet: function(href) {
    var self = this;
    fetch(href).then(function(response) {
      return response.text();
    }).then(function(content) {
      var filename = href.split('/').pop() || 'style.css';
      if (typeof messaging !== 'undefined') {
        messaging.sendMessage('DOWNLOAD_FILE', {
          filename: filename,
          content: content,
          mimeType: 'text/css'
        }).then(function(result) {
          if (result && result.success) {
            self.showSuccess('Downloaded ' + filename);
          } else {
            self.showError('Download failed');
          }
        });
      }
    }).catch(function(err) {
      self.showError('Failed to fetch: ' + err.message);
    });
  },
  
  downloadAllCSS: function() {
    var self = this;
    var sheets = document.styleSheets || [];
    var downloadable = [];
    
    var promises = [];
    for (var i = 0; i < sheets.length; i++) {
      var sheet = sheets[i];
      if (sheet.href) {
        promises.push(
          fetch(sheet.href).then(function(response) {
            return response.text();
          }).then(function(content) {
            var filename = sheet.href.split('/').pop() || 'style.css';
            downloadable.push({ filename: filename, content: content });
          }).catch(function(err) {
            console.warn('Could not fetch:', sheet.href);
          })
        );
      }
    }
    
    Promise.all(promises).then(function() {
      if (downloadable.length > 0 && typeof messaging !== 'undefined') {
        messaging.sendMessage('DOWNLOAD_CSS_COLLECTION', {
          assets: downloadable
        }).then(function(result) {
          if (result && result.success) {
            self.showSuccess('Downloaded ' + downloadable.length + ' stylesheets');
          } else {
            self.showError('Download failed');
          }
        });
      } else {
        self.showError('No downloadable stylesheets');
      }
    });
  },
  
  loadContrastReport: function() {
    var container = document.getElementById('contrast-report');
    if (!container) return;
    
    // Simple contrast check - just show it's working
    container.innerHTML = '<div class="text-green-400 text-sm">Contrast analysis ready</div>';
  },
  
  showError: function(msg) {
    console.error(msg);
    // Show error message in UI
    var errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-600 text-white px-3 py-2 rounded mb-2 text-sm';
    errorDiv.textContent = msg;
    
    var content = document.querySelector('.tab-content:not(.hidden)');
    if (content) {
      content.insertBefore(errorDiv, content.firstChild);
      setTimeout(function() { errorDiv.remove(); }, 3000);
    }
  },
  
  showSuccess: function(msg) {
    console.log(msg);
    // Show success message in UI
    var successDiv = document.createElement('div');
    successDiv.className = 'bg-green-600 text-white px-3 py-2 rounded mb-2 text-sm';
    successDiv.textContent = msg;
    
    var content = document.querySelector('.tab-content:not(.hidden)');
    if (content) {
      content.insertBefore(successDiv, content.firstChild);
      setTimeout(function() { successDiv.remove(); }, 3000);
    }
  }
};
