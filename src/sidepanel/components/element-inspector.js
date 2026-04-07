// Element Inspector - Nothing Design System
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

var elementInspector = {
  display: function (data, containerId) {
    var self = this;
    var container = containerId
      ? document.getElementById(containerId)
      : document.getElementById("inspect-content");
    if (!container) return;

    container.classList.add("transition-all", "duration-300", "ease-out");

    if (!data || !data.element) {
      this.renderEmptyState(container);
      return;
    }

    container.dataset.inspectorState = "active";
    container.style.minHeight = "";
    container.style.maxHeight = "";

    var el = data.element || {};
    var styles = data.styles || {};
    var dims = data.dimensions || {};
    var p = styles.padding || { top: 0, right: 0, bottom: 0, left: 0 };
    var m = styles.margin || { top: 0, right: 0, bottom: 0, left: 0 };
    var br = styles.borderRadius || {
      topLeft: "0px",
      topRight: "0px",
      bottomRight: "0px",
      bottomLeft: "0px",
    };

    var totalW = Math.round(dims.width) || 0;
    var totalH = Math.round(dims.height) || 0;

    var html = '<div class="tab-content">';

    // Header with Back button
    html += '<div class="inspect-header">';
    html += '<button class="inspect-back" id="inspect-back">';
    html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
    html += "</button>";
    html += '<div class="inspect-title">INSPECTOR</div>';
    html += '<button class="inspect-settings-btn" id="inspector-settings-btn">';
    html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>';
    html += "</button>";
    html += "</div>";

    // Element Info
    var classNames = el.className ? el.className.split(" ").join(".") : "";
    html += '<div class="inspect-element">';
    html += '<div class="inspect-element-label">ELEMENT</div>';
    html += '<div class="inspect-element-tag">';
    html += '<span class="tag-name">' + (el.tagName ? el.tagName.toLowerCase() : "div") + "</span>";
    if (classNames) {
      html += '<span class="tag-classes">.' + classNames + "</span>";
    }
    html += "</div>";
    html += "</div>";

    // Settings Modal (hidden by default)
    html += '<div id="inspector-settings-modal" class="inspect-settings-modal hidden">';
    html += '<div class="inspect-settings-content">';
    html += '<div class="inspect-settings-header">';
    html += '<div class="inspect-settings-title">SETTINGS</div>';
    html += '<button class="inspect-settings-close" id="close-inspector-settings">';
    html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    html += "</button>";
    html += "</div>";

    // Context menu toggle
    html += '<div class="inspect-toggle">';
    html += '<span class="inspect-toggle-label">Context Menu</span>';
    html += '<div id="context-mockup" class="toggle-track"><div class="toggle-thumb"></div></div>';
    html += "</div>";

    // Distance lines toggle
    html += '<div class="inspect-toggle">';
    html += '<span class="inspect-toggle-label">Distance Lines</span>';
    html += '<div id="distance-lines-toggle" class="toggle-track"><div class="toggle-thumb"></div></div>';
    html += "</div>";

    // Continuous inspect toggle
    html += '<div class="inspect-toggle">';
    html += '<span class="inspect-toggle-label">Continuous</span>';
    html += '<div id="inspector-continuous-toggle" class="toggle-track"><div class="toggle-thumb"></div></div>';
    html += "</div>";

    html += "</div>";
    html += "</div>";

    // Box Model
    html += '<div class="box-model">';
    html += '<div class="box-outer">';
    html += '<span class="box-margin-label" style="top: 4px; left: 4px;">' + m.top + "</span>";
    html += '<span class="box-margin-label" style="top: 50%; right: 4px; transform: translateY(-50%);">' + m.right + "</span>";
    html += '<span class="box-margin-label" style="bottom: 4px; left: 4px;">' + m.bottom + "</span>";
    html += '<span class="box-margin-label" style="top: 50%; left: 4px; transform: translateY(-50%);">' + m.left + "</span>";
    html += '<div class="box-inner">';
    html += '<span class="box-padding-label" style="top: 4px; right: 4px;">' + p.top + "</span>";
    html += '<span class="box-padding-label" style="bottom: 4px; right: 4px;">' + p.right + "</span>";
    html += '<span class="box-padding-label" style="bottom: 4px; left: 4px;">' + p.bottom + "</span>";
    html += '<span class="box-padding-label" style="top: 50%; left: 4px; transform: translateY(-50%);">' + p.left + "</span>";
    html += '<div class="box-content">' + totalW + " × " + totalH + "</div>";
    html += "</div>";
    html += "</div>";
    html += "</div>";

    // Text Properties
    html += '<div class="inspect-section">';
    html += '<div class="inspect-section-label">TEXT PROPERTIES</div>';
    html += '<div class="inspect-props">';

    var propsData = [
      { label: "FONT FAMILY", value: (styles.fontFamily || "").split(",")[0].replace(/['"]/g, ""), copy: true },
      { label: "FONT SIZE", value: styles.fontSize || "0px", copy: false },
      { label: "LINE HEIGHT", value: styles.lineHeight || "normal", copy: false },
      { label: "FONT WEIGHT", value: styles.fontWeight || "400", copy: false },
      { label: "LETTER SPACING", value: styles.letterSpacing || "normal", copy: false },
      { label: "TEXT COLOR", value: styles.color || "#000", swatch: true, copy: true },
    ];

    for (var k = 0; k < propsData.length; k++) {
      var prop = propsData[k];
      html += '<div class="inspect-prop">';
      html += '<span class="inspect-prop-label">' + prop.label + "</span>";
      html += '<span class="inspect-prop-value">';
      if (prop.copy) {
        html += '<button class="copy-btn" data-value="' + prop.value + '">';
        html += '<svg class="copy-icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        html += "</button>";
      }
      if (prop.swatch) {
        html += '<span class="inspect-prop-swatch" style="background-color:' + prop.value + '"></span>';
      }
      html += prop.value;
      html += "</span>";
      html += "</div>";
    }

    html += "</div>";
    html += "</div>";

    // Background
    html += '<div class="inspect-section">';
    html += '<div class="inspect-section-label">BACKGROUND</div>';
    html += '<div class="inspect-props">';
    html += '<div class="inspect-prop">';
    html += '<span class="inspect-prop-label">COLOR</span>';
    html += '<span class="inspect-prop-value">';
    html += '<span class="inspect-prop-swatch" style="background-color:' + (styles.backgroundColor || "transparent") + '"></span>';
    html += (styles.backgroundColor || "Transparent");
    html += "</span>";
    html += "</div>";
    html += "</div>";
    html += "</div>";

    html += "</div>";

    container.innerHTML = html;

    // Bind events
    var backBtn = document.getElementById("inspect-back");
    if (backBtn && typeof CodePeekApp !== "undefined") {
      backBtn.onclick = function () {
        CodePeekApp.switchTab("overview");
      };
    }

    // Settings modal handlers
    var settingsBtn = document.getElementById("inspector-settings-btn");
    var settingsModal = document.getElementById("inspector-settings-modal");
    var closeSettingsBtn = document.getElementById("close-inspector-settings");

    if (settingsBtn && settingsModal) {
      settingsBtn.onclick = function () {
        settingsModal.classList.remove("hidden");
      };
    }

    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.onclick = function () {
        settingsModal.classList.add("hidden");
      };
    }

    if (settingsModal) {
      settingsModal.onclick = function (e) {
        if (e.target === settingsModal) {
          settingsModal.classList.add("hidden");
        }
      };
    }

    // Context Toggle
    var contextToggle = document.getElementById("context-mockup");
    if (contextToggle && typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["contextMenuEnabled"], function (result) {
        var isActive = result.contextMenuEnabled !== undefined ? result.contextMenuEnabled : true;
        if (isActive) {
          contextToggle.classList.add("active");
        }
        if (typeof messaging !== "undefined") {
          messaging.setContextMenuVisible(isActive);
        }

        if (!contextToggle.hasAttribute("data-bound")) {
          contextToggle.onclick = function () {
            var newActive = this.classList.toggle("active");
            chrome.storage.local.set({ contextMenuEnabled: newActive });
            if (typeof messaging !== "undefined") {
              messaging.setContextMenuVisible(newActive);
            }
          };
          contextToggle.setAttribute("data-bound", "true");
        }
      });
    }

    // Distance Lines Toggle
    var distanceToggle = document.getElementById("distance-lines-toggle");
    if (distanceToggle && typeof messaging !== "undefined" && typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["distanceLinesEnabled"], function (result) {
        var isActive = result.distanceLinesEnabled !== undefined ? result.distanceLinesEnabled : true;
        if (isActive) {
          distanceToggle.classList.add("active");
        }

        if (!distanceToggle.hasAttribute("data-bound")) {
          distanceToggle.onclick = function () {
            var newActive = this.classList.toggle("active");
            chrome.storage.local.set({ distanceLinesEnabled: newActive });
            messaging.setDistanceLinesVisible(newActive, function (response) {
              if (typeof console !== "undefined" && console.debug)
                console.debug("[DEBUG] Distance lines toggle:", newActive, response);
            });
          };
          distanceToggle.setAttribute("data-bound", "true");
        }
      });
    }

    // Continuous Inspect Toggle
    var continuousToggle = document.getElementById("inspector-continuous-toggle");
    if (continuousToggle && typeof CodePeekApp !== "undefined" && typeof chrome !== "undefined" && chrome.storage) {
      if (CodePeekApp.continuousInspect) {
        continuousToggle.classList.add("active");
      }
      continuousToggle.onclick = function () {
        var isActive = this.classList.toggle("active");
        CodePeekApp.continuousInspect = isActive;
        chrome.storage.local.set({ continuousInspect: isActive });
        if (typeof console !== "undefined" && console.debug)
          console.debug("[DEBUG] Continuous inspect:", isActive);

        var utilityTrack = document.getElementById("continuous-track");
        var utilityThumb = document.getElementById("continuous-thumb");
        if (utilityTrack && utilityThumb) {
          utilityTrack.classList.toggle("active", isActive);
        }
      };
    }

    // Copy buttons
    container.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.onclick = function () {
        if (typeof CodePeekApp !== "undefined") CodePeekApp.copyText(this.dataset.value);
      };
    });
  },

  renderEmptyState: function (container) {
    if (!container) return;
    container.classList.add("transition-all", "duration-300", "ease-out");
    container.dataset.inspectorState = "empty";
    container.style.minHeight = "140px";
    container.style.maxHeight = "240px";
    var emptyHtml =
      '<div class="loading-state">' +
      '<div class="loading-spinner"></div>' +
      '<div class="loading-label">CLICK AN ELEMENT TO INSPECT</div>' +
      "</div>";
    container.innerHTML = emptyHtml;
  },

  clear: function () {
    var container = document.getElementById("inspect-content");
    if (container) {
      this.renderEmptyState(container);
    }
  },
};
