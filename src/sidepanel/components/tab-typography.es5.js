// Minimal Typography Tab - Plain ES5 JavaScript
var typographyTab = {
  fonts: [],
  
  load: function() {
    console.log('Loading typography tab...');
    this.extractFonts();
    this.renderFonts();
  },
  
  refresh: function() {
    this.load();
  },
  
  extractFonts: function() {
    var fonts = {};
    var elements = document.querySelectorAll('*');
    
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var style = window.getComputedStyle(el);
      var font = style.fontFamily;
      
      if (font) {
        fonts[font] = (fonts[font] || 0) + 1;
      }
    }
    
    this.fonts = [];
    for (var f in fonts) {
      this.fonts.push({ family: f, count: fonts[f] });
    }
    
    this.fonts.sort(function(a, b) { return b.count - a.count; });
    this.fonts = this.fonts.slice(0, 20);
  },
  
  renderFonts: function() {
    var container = document.getElementById('typography-content');
    if (!container) return;
    
    if (this.fonts.length === 0) {
      container.innerHTML = '<div class="text-gray-400 text-center py-8">No fonts found</div>';
      return;
    }
    
    var html = '<div class="space-y-2">';
    for (var i = 0; i < this.fonts.length; i++) {
      var f = this.fonts[i];
      html += '<div class="p-3 bg-gray-700 rounded">';
      html += '<div class="font-medium">' + f.family + '</div>';
      html += '<div class="text-gray-400 text-sm">' + f.count + ' elements</div>';
      html += '</div>';
    }
    html += '</div>';
    
    container.innerHTML = html;
  }
};
