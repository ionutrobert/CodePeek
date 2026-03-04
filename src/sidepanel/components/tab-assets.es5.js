// Minimal Assets Tab - Plain ES5 JavaScript
var assetsTab = {
  assets: [],
  
  load: function() {
    console.log('Loading assets tab...');
    this.extractAssets();
    this.renderAssets();
  },
  
  refresh: function() {
    this.load();
  },
  
  extractAssets: function() {
    this.assets = [];
    
    // Find images
    var images = document.querySelectorAll('img');
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (img.src) {
        this.assets.push({
          type: 'image',
          src: img.src,
          width: img.width || 0,
          height: img.height || 0
        });
      }
    }
  },
  
  renderAssets: function() {
    var container = document.getElementById('assets-content');
    if (!container) return;
    
    if (this.assets.length === 0) {
      container.innerHTML = '<div class="col-span-4 text-gray-400 text-center py-8">No assets found</div>';
      return;
    }
    
    var html = '';
    for (var i = 0; i < this.assets.length; i++) {
      var a = this.assets[i];
      html += '<div class="bg-gray-700 rounded p-2">';
      html += '<img src="' + a.src + '" class="w-full h-20 object-cover mb-2">';
      html += '<div class="text-xs text-gray-400">' + a.width + 'x' + a.height + '</div>';
      html += '</div>';
    }
    
    container.innerHTML = html;
  },
  
  downloadAll: function() {
    var self = this;
    this.showSuccess('Found ' + this.assets.length + ' assets');
  },
  
  setView: function(view) {
    console.log('Set view:', view);
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
