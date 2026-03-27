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
  var html = '<div class="tab-content">';
  var measureButtonClasses = '';

  // Standardized Page Header
  html += '<div class="neu-page-header">';
  html += '<div class="neu-section-dot"></div>';
  html += '<div>';
  html += '<h2 class="neu-page-title">Rulers</h2>';
  html += '<div class="neu-page-subtitle">Measurement Tools</div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="space-y-4">';

  // Tools Section - Neumorphic
  html += '<div class="neu-card" style="padding: 20px;">';
  html += '<div class="flex items-center justify-between mb-4">';
  html += '<div class="neu-section-header" style="margin-bottom: 0;">';
  html += '<div class="neu-section-dot"></div>';
  html += '<div class="neu-section-title">Tools</div>';
  html += '</div>';
  html += '<button id="rulers-help-btn" class="neu-btn-icon" title="How to use rulers" style="width: 32px; height: 32px;">?</button>';
  html += '</div>';

  // Tool 1: Ruler Overlay - Neumorphic switch
  html += '<div class="flex items-center justify-between py-3 border-b" style="border-color: var(--border-subtle);">';
  html += '<div class="flex items-center gap-3">';
  html += '<div class="neu-btn-icon" style="width: 40px; height: 40px;">';
  html += '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M6 7v10h12V7M8 7v3m3-3v2m3-2v3m3-3v2M6 17h12"></path></svg>';
  html += '</div>';
  html += '<div>';
  html += '<div class="text-sm font-medium" style="color: var(--text-primary);">Ruler Overlay</div>';
  html += '<div class="text-xs" style="color: var(--text-muted);">Show horizontal/vertical guides</div>';
  html += '</div>';
  html += '</div>';
  html += '<button id="rulers-toggle" class="neu-switch-track ' + (this.isActive ? 'active' : '') + '">';
  html += '<div class="neu-switch-thumb"></div>';
  html += '</button>';
  html += '</div>';

  // Tool 2: Measure Distance - Neumorphic switch
  html += '<div class="flex items-center justify-between py-3">';
  html += '<div class="flex items-center gap-3">';
  html += '<div class="neu-btn-icon" style="width: 40px; height: 40px;">';
  html += '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
  html += '</div>';
  html += '<div>';
  html += '<div class="text-sm font-medium" style="color: var(--text-primary);">Measure Distance</div>';
  html += '<div class="text-xs" style="color: var(--text-muted);">Click two elements to measure</div>';
  html += '</div>';
  html += '</div>';
  html += '<button id="measure-distance-btn" class="neu-switch-track ' + (this.isMeasuring ? 'active' : '') + '">';
  html += '<div class="neu-switch-thumb"></div>';
  html += '</button>';
  html += '</div>';

  html += '</div>';

  // Settings Section - Neumorphic
  html += '<div class="neu-card-inset" style="padding: 20px;">';
  html += '<div class="neu-section-header" style="margin-bottom: 12px;">';
  html += '<div class="neu-section-dot"></div>';
  html += '<div class="neu-section-title">Settings</div>';
  html += '</div>';

  // Unit selector - Neumorphic
  html += '<div class="flex items-center justify-between py-3">';
  html += '<span class="text-sm" style="color: var(--text-secondary);">Unit</span>';
  html += '<select id="rulers-unit" class="neu-input" style="width: auto; min-width: 120px;">';
  html += '<option value="px" ' + (this.unit === 'px' ? 'selected' : '') + '>Pixels (px)</option>';
  html += '<option value="rem" ' + (this.unit === 'rem' ? 'selected' : '') + '>REM</option>';
  html += '<option value="em" ' + (this.unit === 'em' ? 'selected' : '') + '>EM</option>';
  html += '</select>';
  html += '</div>';

  // Clear All button - Neumorphic danger
  html += '<div class="mt-4 pt-4" style="border-top: 1px solid var(--border-subtle);">';
  html += '<button id="rulers-clear-all" class="neu-btn" style="width: 100%; color: var(--error-text);">Clear All Markers</button>';
  html += '</div>';

  html += '</div>';

    // Toast for measure mode
    html += '<div id="measure-mode-toast" class="hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[130] max-w-[340px] px-4 py-2.5 text-xs font-semibold bg-slate-800 text-white border border-slate-700 rounded-xl shadow-2xl">Click 2 elements to measure distance. Press ESC to cancel.</div>';
    
    // Current measurement display
    html += '<div id="rulers-measurement" class="bg-brand-50 border border-brand-200 rounded-2xl p-4 hidden">';
    html += '<h4 class="text-xs font-black text-brand-600 uppercase tracking-widest mb-2">Current Measurement</h4>';
    html += '<div id="measurement-display" class="text-2xl font-black text-brand-700">--</div>';
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
            if (self.isActive) {
              toggleBtn.classList.add('active');
            } else {
              toggleBtn.classList.remove('active');
            }
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
              var thumb;
              self.isMeasuring = !self.isMeasuring;
              if (self.isMeasuring) {
                measureBtn.classList.remove('bg-slate-200');
                measureBtn.classList.add('bg-brand-500');
                thumb = measureBtn.querySelector('div');
                if (thumb) thumb.classList.add('translate-x-6');
                if (typeof showToast === 'function') {
                  showToast('Click 2 elements to measure distance. Press ESC to cancel.', 5000, 'measure-mode-toast');
                }
              } else {
                measureBtn.classList.remove('bg-brand-500');
                measureBtn.classList.add('bg-slate-200');
                thumb = measureBtn.querySelector('div');
                if (thumb) thumb.classList.remove('translate-x-6');
                if (typeof hideToast === 'function') {
                  hideToast('measure-mode-toast');
                }
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
              var item;
              var id;
              if (deleteBtn) {
                item = deleteBtn.closest('[data-ruler-id]');
                if (item) {
                  id = parseInt(item.dataset.rulerId, 10);
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
    var w;
    var h;
    if (display && container) {
      if (data && data.width !== undefined) {
        container.classList.remove('hidden');
        w = data.width;
        h = data.height;
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
      var item;
      var posDisplay;
      var span;
      if (ruler) {
        ruler.position = position;
        item = document.querySelector('#rulers-list [data-ruler-id="' + id + '"]');
        if (item) {
          posDisplay = this.unit === 'px' ? position + 'px' : (position/16).toFixed(2) + 'rem';
          span = item.querySelector('span');
          if (span) span.textContent = ruler.type.charAt(0).toUpperCase() + ruler.type.slice(1) + ': ' + posDisplay;
        }
      }
    },
    
    removeRuler: function(id) {
      var idx = this.rulers.findIndex(function(r) { return r.id === id; });
      var item;
      if (idx !== -1) {
        this.rulers.splice(idx, 1);
        item = document.querySelector('#rulers-list [data-ruler-id="' + id + '"]');
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
      item.className = 'flex items-center justify-between p-2 bg-slate-50 rounded-lg';
     item.dataset.rulerId = ruler.id;
     var posDisplay = this.unit === 'px' ? ruler.position + 'px' : (ruler.position/16).toFixed(2) + 'rem';
     var typeLabel = ruler.type === 'vertical' ? 'Vertical' : 'Horizontal';
      item.innerHTML = '<span class="text-xs font-mono text-slate-700">' + typeLabel + ': ' + posDisplay + '</span>' +
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
