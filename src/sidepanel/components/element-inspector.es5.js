// Minimal Element Inspector - Plain ES5 JavaScript
var elementInspector = {
  display: function(data) {
    console.log('Element inspected:', data);
    
    // Show the inspector panel
    var inspector = document.getElementById('element-inspector');
    if (inspector) {
      inspector.classList.remove('hidden');
    }
    
    var container = document.getElementById('inspector-content');
    if (!container) return;
    
    if (!data) {
      container.innerHTML = '<div class="text-gray-400">Click an element to inspect</div>';
      return;
    }
    
    var el = data.element || {};
    var styles = data.styles || {};
    var dims = data.dimensions || {};
    
    var html = '';
    
    // Element info
    html += '<div class="mb-3">';
    html += '<div class="text-lg font-bold text-blue-400">' + el.tagName + '</div>';
    if (el.className) {
      html += '<div class="text-xs text-gray-400">' + el.className + '</div>';
    }
    if (el.id) {
      html += '<div class="text-xs text-gray-400">#' + el.id + '</div>';
    }
    html += '</div>';
    
    // Dimensions
    html += '<div class="bg-gray-700 rounded p-2 mb-3">';
    html += '<div class="text-xs text-gray-400 mb-1">Dimensions</div>';
    html += '<div class="flex justify-between text-sm">';
    html += '<span>W: <span class="text-blue-400">' + Math.round(dims.width) + 'px</span></span>';
    html += '<span>H: <span class="text-blue-400">' + Math.round(dims.height) + 'px</span></span>';
    html += '</div>';
    html += '</div>';
    
    // Box model
    html += '<div class="bg-gray-700 rounded p-2 mb-3">';
    html += '<div class="text-xs text-gray-400 mb-1">Box Model</div>';
    
    var pad = styles.padding || {};
    var mar = styles.margin || {};
    var bor = styles.border || {};
    
    html += '<div class="text-xs space-y-1">';
    html += '<div><span class="text-gray-400">Padding:</span> ' + pad.top + ' ' + pad.right + ' ' + pad.bottom + ' ' + pad.left + '</div>';
    html += '<div><span class="text-gray-400">Margin:</span> ' + mar.top + ' ' + mar.right + ' ' + mar.bottom + ' ' + mar.left + '</div>';
    html += '<div><span class="text-gray-400">Border:</span> ' + bor.top + ' ' + bor.right + ' ' + bor.bottom + ' ' + bor.left + '</div>';
    html += '</div>';
    html += '</div>';
    
    // Typography
    html += '<div class="bg-gray-700 rounded p-2 mb-3">';
    html += '<div class="text-xs text-gray-400 mb-1">Typography</div>';
    html += '<div class="text-xs">';
    html += '<div><span class="text-gray-400">Font:</span> ' + (styles.fontFamily || '-') + '</div>';
    html += '<div><span class="text-gray-400">Size:</span> ' + (styles.fontSize || '-') + '</div>';
    html += '<div><span class="text-gray-400">Weight:</span> ' + (styles.fontWeight || '-') + '</div>';
    html += '</div>';
    html += '</div>';
    
    // Colors
    html += '<div class="bg-gray-700 rounded p-2 mb-3">';
    html += '<div class="text-xs text-gray-400 mb-1">Colors</div>';
    html += '<div class="flex items-center gap-2">';
    html += '<div class="w-6 h-6 rounded border border-gray-500" style="background:' + (styles.color || 'transparent') + '"></div>';
    html += '<span class="text-xs">' + (styles.color || '-') + '</span>';
    html += '</div>';
    html += '<div class="flex items-center gap-2 mt-1">';
    html += '<div class="w-6 h-6 rounded border border-gray-500" style="background:' + (styles.backgroundColor || 'transparent') + '"></div>';
    html += '<span class="text-xs">' + (styles.backgroundColor || '-') + '</span>';
    html += '</div>';
    html += '</div>';
    
    // Selector
    if (el.selector) {
      html += '<div class="bg-gray-700 rounded p-2">';
      html += '<div class="text-xs text-gray-400 mb-1">Selector</div>';
      html += '<code class="text-xs text-green-400 break-all">' + el.selector + '</code>';
      html += '</div>';
    }
    
    container.innerHTML = html;
  },
  
  clear: function() {
    var container = document.getElementById('inspector-content');
    if (container) {
      container.innerHTML = '<div class="text-gray-400">Click an element to inspect</div>';
    }
  }
};
