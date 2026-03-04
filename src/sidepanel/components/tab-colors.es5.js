// Minimal Colors Tab - Plain ES5 JavaScript
var colorsTab = {
  colors: [],
  
  load: function() {
    console.log('Loading colors tab...');
    this.extractColors();
    this.renderColors();
  },
  
  refresh: function() {
    this.load();
  },
  
  extractColors: function() {
    var colors = {};
    var elements = document.querySelectorAll('*');
    
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var style = window.getComputedStyle(el);
      
      var props = ['color', 'backgroundColor', 'borderColor'];
      for (var j = 0; j < props.length; j++) {
        var color = style[props[j]];
        if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
          colors[color] = (colors[color] || 0) + 1;
        }
      }
    }
    
    this.colors = [];
    for (var c in colors) {
      this.colors.push({ color: c, count: colors[c] });
    }
    
    this.colors.sort(function(a, b) { return b.count - a.count; });
    this.colors = this.colors.slice(0, 50);
  },
  
  renderColors: function() {
    var container = document.getElementById('colors-grid');
    if (!container) return;
    
    var countEl = document.getElementById('color-count');
    if (countEl) countEl.textContent = this.colors.length;
    
    if (this.colors.length === 0) {
      container.innerHTML = '<div class="col-span-8 text-gray-400 text-center py-8">No colors found</div>';
      return;
    }
    
    var html = '';
    for (var i = 0; i < this.colors.length; i++) {
      var c = this.colors[i];
      html += '<div class="aspect-square rounded cursor-pointer" style="background-color:' + c.color + '" title="' + c.color + ' (' + c.count + ')"></div>';
    }
    
    container.innerHTML = html;
  },
  
  switchSubtab: function(subtab) {
    console.log('Switching to:', subtab);
  },
  
  showExportModal: function() {
    var self = this;
    
    // Export as JSON
    var jsonContent = JSON.stringify(this.colors, null, 2);
    
    if (typeof messaging !== 'undefined') {
      messaging.sendMessage('DOWNLOAD_FILE', {
        filename: 'colors.json',
        content: jsonContent,
        mimeType: 'application/json'
      }).then(function(result) {
        if (result && result.success) {
          self.showSuccess('Colors exported!');
        }
      });
    }
  },
  
  showSuccess: function(msg) {
    var div = document.createElement('div');
    div.className = 'bg-green-600 text-white px-3 py-2 rounded mb-2 text-sm';
    div.textContent = msg;
    
    var content = document.querySelector('.tab-content:not(.hidden)');
    if (content) {
      content.insertBefore(div, content.firstChild);
      setTimeout(function() { div.remove(); }, 3000);
    }
  }
};
