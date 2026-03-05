// Tab: Rulers (Designer Mode)
// Provides overlay measurement tools
var rulersTab = {
  isActive: false,
  unit: 'px',
  rulers: [],
  isMeasuring: false,

  init: function() {
    console.log("[rulersTab] init");
  },

  render: function(pageData) {
    var container = document.getElementById("rulers-content");
    if (!container) return;
    var self = this;
    var html = '';
    
    html += '<div class="space-y-4">';
    
    // Controls section
    html += '<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">';
    html += '<h4 class="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Ruler Controls</h4>';
    
    // Toggle ruler overlay
    html += '<div class="flex items-center justify-between mb-3">';
    html += '<span class="text-sm font-medium text-slate-700 dark:text-slate-300">Show Rulers</span>';
    html += '<button id="rulers-toggle" class="relative w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition-colors ' + (this.isActive ? 'bg-brand-500' : '') + '">';
    html += '<div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ' + (this.isActive ? 'translate-x-6' : '') + '"></div>';
    html += '</button>';
    html += '</div>';
    
     // Unit selector
     html += '<div class="flex items-center justify-between">';
     html += '<span class="text-sm font-medium text-slate-700 dark:text-slate-300">Unit</span>';
     html += '<select id="rulers-unit" class="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">';
     html += '<option value="px" ' + (this.unit === 'px' ? 'selected' : '') + '>Pixels</option>';
     html += '<option value="rem" ' + (this.unit === 'rem' ? 'selected' : '') + '>REM</option>';
     html += '<option value="em" ' + (this.unit === 'em' ? 'selected' : '') + '>EM</option>';
     html += '</select>';
     html += '</div>';
     
      // Clear All button
      html += '<div class="mt-4 flex justify-end">';
      html += '<button id="rulers-clear-all" class="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Clear All Markers</button>';
       html += '</div>';

       // Measure Distance button
       html += '<div class="mt-4">';
       html += '<button id="measure-distance-btn" class="w-full px-3 py-2 text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">Measure Distance</button>';
       html += '</div>';
       
       html += '<div id="rulers-list" class="mt-4 space-y-2 max-h-48 overflow-y-auto"></div>';
      
      html += '</div>';
    
    // Info section
    html += '<div class="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">';
    html += '<h4 class="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">How to Use</h4>';
    html += '<ul class="text-xs text-slate-600 dark:text-slate-400 space-y-2">';
    html += '<li class="flex items-start gap-2"><span class="text-brand-500">1.</span> Toggle rulers on to see measurement overlay</li>';
    html += '<li class="flex items-start gap-2"><span class="text-brand-500">2.</span> Move your mouse to measure distances</li>';
    html += '<li class="flex items-start gap-2"><span class="text-brand-500">3.</span> Click to lock current measurement</li>';
    html += '<li class="flex items-start gap-2"><span class="text-brand-500">4.</span> Press Escape to clear measurements</li>';
    html += '</ul>';
    html += '</div>';
    
    // Current measurement display
    html += '<div id="rulers-measurement" class="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-2xl p-4 hidden">';
    html += '<h4 class="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2">Current Measurement</h4>';
    html += '<div id="measurement-display" class="text-2xl font-black text-brand-700 dark:text-brand-300">--</div>';
    html += '</div>';
    
    html += '</div>';
    
     container.innerHTML = html;
     
     this.renderRulersList();
     
      // Bind events
      setTimeout(function() {
        var toggleBtn = document.getElementById('rulers-toggle');
        if (toggleBtn) {
          toggleBtn.onclick = function() {
            self.isActive = !self.isActive;
            self.toggleRulers(self.isActive);
            self.render(pageData);
          };
        }
        
        var unitSelect = document.getElementById('rulers-unit');
        if (unitSelect) {
          unitSelect.onchange = function() {
            self.unit = this.value;
            self.updateUnit(self.unit);
          };
        }
        
          var clearBtn = document.getElementById('rulers-clear-all');
          if (clearBtn) {
            clearBtn.onclick = function() {
              if (typeof messaging !== 'undefined') {
                messaging.sendMessage('CLEAR_RULERS_GUIDES', {}, function(resp) {
                  console.log('Clear all markers response:', resp);
                });
              }
            };
          }

          var measureBtn = document.getElementById('measure-distance-btn');
          if (measureBtn) {
            measureBtn.onclick = function() {
              self.isMeasuring = !self.isMeasuring;
              // Toggle button style
              if (self.isMeasuring) {
                measureBtn.classList.add('bg-brand-500', 'text-white', 'border-brand-600');
                measureBtn.classList.remove('bg-blue-100', 'text-blue-700', 'dark:bg-blue-900/30', 'dark:text-blue-400');
              } else {
                measureBtn.classList.remove('bg-brand-500', 'text-white', 'border-brand-600');
                measureBtn.classList.add('bg-blue-100', 'text-blue-700', 'dark:bg-blue-900/30', 'dark:text-blue-400');
              }
              // Send toggle to content
              if (typeof messaging !== 'undefined') {
                messaging.sendMessage('TOGGLE_MEASURE_MODE', { enabled: self.isMeasuring });
              }
            };
          }
          
          var listContainer = document.getElementById('rulers-list');
         if (listContainer) {
           listContainer.addEventListener('click', function(e) {
             var deleteBtn = e.target.closest('.delete-ruler');
             if (deleteBtn) {
               var item = deleteBtn.closest('[data-ruler-id]');
               if (item) {
                 var id = parseInt(item.dataset.rulerId, 10);
                 if (!isNaN(id)) {
                   self.removeRuler(id);
                   if (typeof messaging !== 'undefined') {
                     messaging.sendMessage('REMOVE_RULER', { id: id });
                   }
                 }
               }
             }
           });
         }
      }, 50);
    
    this.init();
  },
  
  toggleRulers: function(enable) {
    if (typeof messaging !== 'undefined') {
      messaging.toggleRulers(enable, this.unit, function(resp) {
        console.log('Rulers toggled:', resp);
      });
    }
  },
  
  updateUnit: function(unit) {
    if (typeof messaging !== 'undefined') {
      messaging.updateRulerUnit(unit, function(resp) {
        console.log('Ruler unit updated:', resp);
      });
    }
    this.renderRulersList();
  },

  updateMeasurement: function(data) {
    var display = document.getElementById('measurement-display');
    var container = document.getElementById('rulers-measurement');
    if (display && container) {
      if (data && data.width !== undefined) {
        container.classList.remove('hidden');
        var w = data.width;
        var h = data.height;
        if (this.unit !== 'px') {
          w = (w / 16).toFixed(2);
          h = (h / 16).toFixed(2);
        }
        display.textContent = w + ' × ' + h + ' ' + this.unit;
      } else {
        container.classList.add('hidden');
      }
     }
   },
   
   addRuler: function(ruler) {
     this.rulers.push(ruler);
     this.renderRulerItemInto(ruler, document.getElementById('rulers-list'));
   },
   
   updateRuler: function(id, position) {
     var ruler = this.rulers.find(function(r) { return r.id === id; });
     if (ruler) {
       ruler.position = position;
       var item = document.querySelector('#rulers-list [data-ruler-id="' + id + '"]');
       if (item) {
         var posDisplay = this.unit === 'px' ? position + 'px' : (position/16).toFixed(2) + 'rem';
         var span = item.querySelector('span');
         if (span) span.textContent = ruler.type.charAt(0).toUpperCase() + ruler.type.slice(1) + ': ' + posDisplay;
       }
     }
   },
   
   removeRuler: function(id) {
     var idx = this.rulers.findIndex(function(r) { return r.id === id; });
     if (idx !== -1) {
       this.rulers.splice(idx, 1);
       var item = document.querySelector('#rulers-list [data-ruler-id="' + id + '"]');
       if (item) item.remove();
     }
   },
   
    clearRulers: function() {
      this.rulers = [];
      var container = document.getElementById('rulers-list');
      if (container) container.innerHTML = '';
    },
    
    showDistance: function(dist) {
      var display = document.getElementById('measurement-display');
      var container = document.getElementById('rulers-measurement');
      if (display && container) {
        display.textContent = dist + 'px';
        container.classList.remove('hidden');
      }
    },
    
    renderRulerItemInto: function(ruler, container) {
     var item = document.createElement('div');
     item.className = 'flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg';
     item.dataset.rulerId = ruler.id;
     var posDisplay = this.unit === 'px' ? ruler.position + 'px' : (ruler.position/16).toFixed(2) + 'rem';
     var typeLabel = ruler.type === 'vertical' ? 'Vertical' : 'Horizontal';
     item.innerHTML = '<span class="text-xs font-mono text-slate-700 dark:text-slate-300">' + typeLabel + ': ' + posDisplay + '</span>' +
       '<button class="delete-ruler p-1 text-slate-400 hover:text-red-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>';
     container.appendChild(item);
   },
   
   renderRulersList: function() {
     var container = document.getElementById('rulers-list');
     if (!container) return;
     container.innerHTML = '';
     this.rulers.forEach(function(ruler) {
       this.renderRulerItemInto(ruler, container);
     }, this);
   }
 };
