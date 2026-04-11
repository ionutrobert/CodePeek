// Shortcuts Modal - Nothing Design System
var shortcutsModal = {
  _currentTrigger: null,
  _isVisible: false,
  _keyHandler: null,
  _overlay: null,

  open: function() {
    var existing = document.getElementById('shortcuts-modal-overlay');
    if (existing) {
      existing.remove();
    }

    this._currentTrigger = document.activeElement;
    this._overlay = null;

    var self = this;
    var overlay = document.createElement('div');
    overlay.id = 'shortcuts-modal-overlay';
    overlay.className = 'modal-backdrop';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-labelledby', 'shortcuts-modal-title');
    this._overlay = overlay;

  var html = '<div class="modal-content modal-content-sm" tabindex="-1">';
  html += '<div class="modal-header">';
  html += '<h2 id="shortcuts-modal-title" class="modal-title">KEYBOARD SHORTCUTS</h2>';
  html += '<button class="modal-close" id="shortcuts-modal-close" aria-label="Close shortcuts" type="button">&times;</button>';
  html += '</div>';
  html += '<div class="modal-body">';

  var shortcuts = [
    { key: 'C', action: 'Colors', desc: 'Switch to Colors tab' },
    { key: 'T', action: 'Typography', desc: 'Switch to Typography tab' },
    { key: 'A', action: 'Assets', desc: 'Switch to Assets tab' },
    { key: 'O', action: 'Overview', desc: 'Switch to Overview tab' },
    { key: 'I', action: 'Inspect', desc: 'Switch to Inspect tab' },
    { key: 'R', action: 'Rulers', desc: 'Switch to Rulers tab' }
  ];

  html += '<div class="shortcuts-list">';
  for (var i = 0; i < shortcuts.length; i++) {
    var s = shortcuts[i];
    html += '<div class="shortcut-item">';
    html += '<kbd class="shortcut-key">' + s.key + '</kbd>';
    html += '<div class="shortcut-info">';
    html += '<span class="shortcut-action">' + s.action + '</span>';
    html += '<span class="shortcut-desc">' + s.desc + '</span>';
    html += '</div>';
    html += '</div>';
  }
  html += '</div>';

  html += '<div class="shortcut-hint">';
  html += '<p>Press any key to navigate. Shortcuts work when not typing in an input field.</p>';
  html += '</div>';

  html += '</div>';
  html += '</div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    this._isVisible = true;

    var closeBtn = document.getElementById('shortcuts-modal-close');

    if (closeBtn) {
      closeBtn.onclick = function() {
        self.close();
      };
    }

    overlay.onclick = function(e) {
      if (e.target === overlay) {
        self.close();
      }
    };

    this._keyHandler = function(e) {
      if (!self._isVisible) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        self.close();
        return;
      }

      if (e.key === 'Tab') {
        self._trapFocus(e);
      }
    };

    document.addEventListener('keydown', this._keyHandler);

    setTimeout(function() {
      if (closeBtn) closeBtn.focus();
    }, 50);
  },

  _trapFocus: function(e) {
    var overlay = this._overlay;
    if (!overlay) return;
    var focusables = overlay.querySelectorAll('a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    var list = [];
    for (var i = 0; i < focusables.length; i++) {
      list.push(focusables[i]);
    }

    if (list.length === 0) {
      e.preventDefault();
      return;
    }

    var first = list[0];
    var last = list[list.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
      return;
    }
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
      return;
    }
  },

  close: function() {
    var overlay = document.getElementById('shortcuts-modal-overlay');
    if (overlay) {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.remove();
    }

    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }

    this._isVisible = false;

    if (this._currentTrigger && typeof this._currentTrigger.focus === 'function') {
      this._currentTrigger.focus();
    }
    this._currentTrigger = null;
  }
};
