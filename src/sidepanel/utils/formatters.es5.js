// Formatters utility - Plain ES5 JavaScript
var formatters = {
  formatFileSize: function(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  formatLoadTime: function(ms) {
    if (!ms || ms < 0) return '-';
    return ms + ' ms';
  },
  
  formatNumber: function(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};
