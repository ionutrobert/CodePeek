// Tab: Rulers (Designer Mode)
// Nothing Design - Measurement Tools
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

    var html = '<div class="rulers-tab">';

    // Page Header - Nothing style
    html += '<div class="page-header">';
    html += '<div class="section-indicator"></div>';
    html += '<div class="header-text">';
    html += '<h1 class="page-title">Rulers</h1>';
    html += '<p class="page-subtitle">Measurement Tools</p>';
    html += '</div>';
    html += '</div>';

    // Tools Section
    html += '<section class="tools-section">';
    html += '<div class="section-header">';
    html += '<div class="section-indicator"></div>';
    html += '<span class="section-label">TOOLS</span>';
    html += '<button id="rulers-help-btn" class="help-btn" title="How to use rulers" aria-label="Help">?</button>';
    html += '</div>';

    // Tool 1: Ruler Overlay
    html += '<div class="tool-row">';
    html += '<div class="tool-info">';
    html += '<div class="tool-icon">';
    html += '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 7h16M6 7v10h12V7M8 7v3m3-3v2m3-2v3m3-3v2M6 17h12"/></svg>';
    html += '</div>';
    html += '<div class="tool-text">';
    html += '<span class="tool-name">Ruler Overlay</span>';
    html += '<span class="tool-desc">Show horizontal/vertical guides</span>';
    html += '</div>';
    html += '</div>';
    html += '<button id="rulers-toggle" class="toggle' + (this.isActive ? ' active' : '') + '" role="switch" aria-checked="' + this.isActive + '">';
    html += '<span class="toggle-track"></span>';
    html += '</button>';
    html += '</div>';

    // Tool 2: Measure Distance
    html += '<div class="tool-row">';
    html += '<div class="tool-info">';
    html += '<div class="tool-icon">';
    html += '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';
    html += '</div>';
    html += '<div class="tool-text">';
    html += '<span class="tool-name">Measure Distance</span>';
    html += '<span class="tool-desc">Click two elements to measure</span>';
    html += '</div>';
    html += '</div>';
    html += '<button id="measure-distance-btn" class="toggle' + (this.isMeasuring ? ' active' : '') + '" role="switch" aria-checked="' + this.isMeasuring + '">';
    html += '<span class="toggle-track"></span>';
    html += '</button>';
    html += '</div>';

    html += '</section>';

    // Settings Section
    html += '<section class="settings-section">';
    html += '<div class="section-header">';
    html += '<div class="section-indicator"></div>';
    html += '<span class="section-label">SETTINGS</span>';
    html += '</div>';

    // Unit selector
    html += '<div class="setting-row">';
    html += '<span class="setting-label">Unit</span>';
    html += '<select id="rulers-unit" class="unit-select">';
    html += '<option value="px"' + (this.unit === 'px' ? ' selected' : '') + '>Pixels (px)</option>';
    html += '<option value="rem"' + (this.unit === 'rem' ? ' selected' : '') + '>REM</option>';
    html += '<option value="em"' + (this.unit === 'em' ? ' selected' : '') + '>EM</option>';
    html += '</select>';
    html += '</div>';

    html += '</section>';

    // Current Measurement Display
    html += '<div id="rulers-measurement" class="measurement-display hidden">';
    html += '<div class="measurement-label">Current Measurement</div>';
    html += '<div id="measurement-display" class="measurement-value">--</div>';
    html += '</div>';

    // Rulers List
    html += '<section id="rulers-list" class="rulers-list"></section>';

    // Clear All - Danger action
    html += '<div class="action-row">';
    html += '<button id="rulers-clear-all" class="danger-btn">Clear All Markers</button>';
    html += '</div>';

    // Status bar for measure mode (inline, not toast)
    html += '<div id="measure-mode-status" class="status-bar hidden">';
    html += '<span class="status-text">Click 2 elements to measure distance</span>';
    html += '<kbd class="status-key">ESC</kbd>';
    html += '<span class="status-hint">to cancel</span>';
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
          toggleBtn.classList.toggle('active', self.isActive);
          toggleBtn.setAttribute('aria-checked', self.isActive);
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
          measureBtn.classList.toggle('active', self.isMeasuring);
          measureBtn.setAttribute('aria-checked', self.isMeasuring);

          var statusBar = document.getElementById('measure-mode-status');
          if (statusBar) {
            statusBar.classList.toggle('hidden', !self.isMeasuring);
          }

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
        var span = item.querySelector('.ruler-value');
        if (span) {
          span.textContent = ruler.type.charAt(0).toUpperCase() + ruler.type.slice(1) + ': ' + posDisplay;
        }
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
    if (!container) return;
    var item = document.createElement('div');
    item.className = 'ruler-item';
    item.dataset.rulerId = ruler.id;
    var posDisplay = this.unit === 'px' ? ruler.position + 'px' : (ruler.position/16).toFixed(2) + 'rem';
    var typeLabel = ruler.type === 'vertical' ? 'Vertical' : 'Horizontal';
    item.innerHTML = '<span class="ruler-value">' + typeLabel + ': ' + posDisplay + '</span>' +
      '<button class="delete-ruler" aria-label="Delete ruler">' +
      '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>' +
      '</button>';
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
