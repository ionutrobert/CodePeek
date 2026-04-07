// Modal Component - Nothing Design
var createModal = function (options) {
  options = options || {};
  var title = options.title || '';
  var content = options.content || '';
  var onClose = typeof options.onClose === 'function' ? options.onClose : null;
  var showCloseButton = options.showCloseButton !== false;
  var widthValue = options.width || '28rem';
  if (typeof widthValue === 'number') {
    widthValue = widthValue + 'px';
  }

  var overlay = document.createElement('div');
  overlay.className = 'modal-backdrop';
  overlay.setAttribute('aria-hidden', 'true');

  var dialog = document.createElement('div');
  dialog.className = 'modal-content';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('tabindex', '-1');
  var titleId = 'modal-title-' + Date.now();
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.style.maxWidth = widthValue;

  var header = document.createElement('div');
  header.className = 'modal-header';

  var titleEl = document.createElement('h2');
  titleEl.id = titleId;
  titleEl.className = 'modal-title';
  titleEl.textContent = title || 'Modal';
  header.appendChild(titleEl);

  var closeButton = null;
  if (showCloseButton) {
    closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'modal-close';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>';
    header.appendChild(closeButton);
  }

  var bodyWrapper = document.createElement('div');
  bodyWrapper.className = 'modal-body';
  bodyWrapper.innerHTML = content;

  dialog.appendChild(header);
  dialog.appendChild(bodyWrapper);
  overlay.appendChild(dialog);

  var trapTargets = function () {
    var elements = dialog.querySelectorAll(
      'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    var list = [];
    for (var i = 0; i < elements.length; i++) {
      list.push(elements[i]);
    }
    return list;
  };

  var focusFirst = function () {
    var focusables = trapTargets();
    if (focusables.length > 0) {
      focusables[0].focus();
      return;
    }
    if (closeButton) {
      closeButton.focus();
      return;
    }
    dialog.focus();
  };

  var currentTrigger = null;
  var isVisible = false;

  var handleKeyDown = function (event) {
    if (!isVisible) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      hide();
      return;
    }

    if (event.key === 'Tab') {
      var focusables = trapTargets();
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
        return;
      }
    }
  };

  var handleOverlayClick = function (event) {
    if (event.target === overlay) {
      hide();
    }
  };

  var show = function () {
    if (!overlay.parentElement) {
      document.body.appendChild(overlay);
    }
    currentTrigger = document.activeElement;
    overlay.setAttribute('aria-hidden', 'false');
    isVisible = true;
    document.addEventListener('keydown', handleKeyDown);
    setTimeout(focusFirst, 40);
  };

  var hide = function () {
    if (!isVisible) return;
    overlay.setAttribute('aria-hidden', 'true');
    isVisible = false;
    document.removeEventListener('keydown', handleKeyDown);
    if (currentTrigger && typeof currentTrigger.focus === 'function') {
      currentTrigger.focus();
    }
    if (onClose) {
      onClose();
    }
  };

  var destroy = function () {
    hide();
    overlay.removeEventListener('click', handleOverlayClick);
    if (closeButton) {
      closeButton.removeEventListener('click', hide);
    }
    if (overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
    }
  };

  var setContent = function (html) {
    bodyWrapper.innerHTML = html || '';
  };

  overlay.addEventListener('click', handleOverlayClick);
  if (closeButton) {
    closeButton.addEventListener('click', hide);
  }

  return {
    show: show,
    hide: hide,
    destroy: destroy,
    setContent: setContent
  };
};

if (typeof window !== 'undefined') {
  window.createModal = createModal;
}
