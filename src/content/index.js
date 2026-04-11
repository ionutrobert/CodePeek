// Content Script - Plain ES5, no transpilation
(function () {
  var DEBUG = true;
"use strict";

// Cached canvas for color parsing (performance optimization)
var _colorCanvas = null;
var _colorCtx = null;

if (DEBUG) console.log("Code Peek content script starting...");

// Safe sendMessage wrapper - handles "Extension context invalidated" errors
var extensionValid = true;
function safeSendMessage(message, callback) {
  if (!extensionValid) {
    if (DEBUG) console.log("Code Peek: Extension context invalid, skipping message");
    return;
  }
  try {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
      if (DEBUG) console.log("Code Peek: chrome.runtime not available");
      return;
    }
    chrome.runtime.sendMessage(message, callback || function() {});
  } catch (e) {
    if (e.message && e.message.indexOf("Extension context invalidated") !== -1) {
      extensionValid = false;
      if (DEBUG) console.log("Code Peek: Extension context invalidated - stopping all messaging");
    } else {
      console.error("Code Peek: sendMessage error", e);
    }
  }
}

  // Global error handler – prevents crashes from breaking everything
  window.onerror = function (msg, url, line) {
    // Suppress extension context invalidated errors completely
    if (msg && msg.indexOf("Extension context invalidated") !== -1) {
      extensionValid = false;
      return true; // suppress completely, no console output
    }
    // Suppress other extension-related errors
    if (url && url.indexOf('chrome-extension://') !== -1) {
      return true; // suppress extension errors
    }
    console.error("Code Peek Global Error:", msg, "at", url + ":" + line);
    return true; // suppress default
  };

// Page unload detection – notify side panel that context is going away
window.addEventListener("beforeunload", function () {
  if (DEBUG) console.log("Code Peek: Page unloading");
  safeSendMessage({ type: "PAGE_UNLOADED" });
});

  // === INSPECT MODE ===
  var inspectActive = false;
  var highlightEl = null;
  var infoEl = null;
  var parentHighlightEl = null;
  var distanceLines = [];
  var distanceLinesEnabled = true;
  var lastHoverLog = 0;
  var contextMenuEnabled = true; // Show info box on hover during inspect
  var codeSelectActive = false;
  var codeSelectHintEl = null;
  var codeSelectCursorStyleEl = null;
  var pendingCodeSelectResponse = null;

  // === MEASURE MODE ===
  var measureMode = false;
  var measureStartEl = null;
  var measureOverlay = null;

  function startInspectMode() {
    if (codeSelectActive) {
      stopCodeSelectMode({ success: false, cancelled: true, error: "Code selection cancelled because Inspect mode started." });
    }
    if (inspectActive) {
      if (DEBUG) console.log("Code Peek: startInspectMode called but already active");
      return;
    }
    inspectActive = true;
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("click", onClick, true);
    document.body.classList.add("code-peek-inspecting");
    if (DEBUG) console.log("Code Peek: Inspect mode ACTIVE");
  }

  function stopInspectMode() {
    if (!inspectActive) {
      if (DEBUG) console.log("Code Peek: stopInspectMode called but already inactive");
      return;
    }
    inspectActive = false;
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("click", onClick, true);
    removeHighlight();
    document.body.classList.remove("code-peek-inspecting");
    if (DEBUG) console.log("Code Peek: Inspect mode INACTIVE");
  }

  function showCodeSelectHint() {
    if (codeSelectHintEl) return;

    codeSelectHintEl = document.createElement("div");
    codeSelectHintEl.id = "code-peek-code-select-hint";
    codeSelectHintEl.textContent = "Code Peek: click any element to capture its code. Press Esc to cancel.";
    codeSelectHintEl.style.cssText = "position:fixed;top:16px;right:16px;max-width:320px;background:rgba(15,23,42,0.94);color:#fff;padding:10px 14px;border-radius:999px;font-size:12px;font-family:Arial,sans-serif;line-height:1.4;pointer-events:none;z-index:2147483647;box-shadow:0 10px 30px rgba(15,23,42,0.22);";
    document.body.appendChild(codeSelectHintEl);
  }

  function hideCodeSelectHint() {
    if (codeSelectHintEl) {
      codeSelectHintEl.remove();
      codeSelectHintEl = null;
    }
  }

  function enableCodeSelectCursor() {
    if (!codeSelectCursorStyleEl) {
      codeSelectCursorStyleEl = document.createElement("style");
      codeSelectCursorStyleEl.id = "code-peek-code-select-cursor";
      codeSelectCursorStyleEl.textContent = 'html[data-code-peek-code-select="true"], html[data-code-peek-code-select="true"] * { cursor: crosshair !important; }';
      document.head.appendChild(codeSelectCursorStyleEl);
    }
    document.documentElement.setAttribute("data-code-peek-code-select", "true");
  }

  function disableCodeSelectCursor() {
    document.documentElement.removeAttribute("data-code-peek-code-select");
  }

  function stopCodeSelectMode(response) {
    var callback = pendingCodeSelectResponse;

    codeSelectActive = false;
    pendingCodeSelectResponse = null;
    document.removeEventListener("click", onCodeSelectClick, true);
    document.removeEventListener("keydown", onCodeSelectKeydown, true);
    hideCodeSelectHint();
    disableCodeSelectCursor();

    if (callback) {
      try {
        callback(response || { success: false, cancelled: true, error: "Code selection cancelled." });
      } catch (e) {}
    }
  }

  function onCodeSelectClick(e) {
    var target = null;

    if (!codeSelectActive) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    target = e.target;
    if (!target || target === document.documentElement || target === document.body) {
      target = document.body;
    }

    stopCodeSelectMode({
      success: true,
      data: extractElementCode(target),
      selector: getSelector(target)
    });
  }

  function onCodeSelectKeydown(e) {
    if (!codeSelectActive) return;

    if ((e.key && e.key === "Escape") || e.keyCode === 27) {
      e.preventDefault();
      e.stopPropagation();
      stopCodeSelectMode({ success: false, cancelled: true, error: "Code selection cancelled." });
    }
  }

  function startCodeSelectMode(sendResponse) {
    if (inspectActive) {
      sendResponse({ success: false, error: "Inspect mode is active. Turn it off before using the Code tab selector." });
      return false;
    }

    if (codeSelectActive) {
      sendResponse({ success: false, error: "The Code tab selector is already active." });
      return false;
    }

    codeSelectActive = true;
    pendingCodeSelectResponse = sendResponse;
    document.addEventListener("click", onCodeSelectClick, true);
    document.addEventListener("keydown", onCodeSelectKeydown, true);
    enableCodeSelectCursor();
    showCodeSelectHint();
    return true;
  }

  function onMouseMove(e) {
    if (!inspectActive) return;
    // Throttle log to once per second
    var now = Date.now();
    if (now - (window.lastHoverLogTime || 0) > 1000) {
      if (DEBUG) console.log(
        "Code Peek: mouse move (inspect active) at",
        new Date().toISOString(),
      );
      window.lastHoverLogTime = now;
    }
    if (e.target === document.body || e.target === document.documentElement)
      return;
    try {
      showHighlight(e.target);
    } catch (err) {
      console.error("Code Peek: onMouseMove error", err);
    }
  }

function onClick(e) {
  // Prevent default behavior and stop propagation FIRST
  // This ensures clicks don't trigger navigation or form submission
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  if (!inspectActive) {
    if (DEBUG) console.log("Code Peek: onClick ignored (inspectActive false)");
    return;
  }
  try {
    if (e.target === document.body || e.target === document.documentElement)
      return;

    var target = e.target;
    // Handle transparency/inner elements by picking the topmost meaningful element if needed
    // (Standard behavior for now is just the target)

    if (DEBUG) console.log("Code Peek: clicking on", target.tagName.toLowerCase());
    inspectElement(target);

    // REMOVED: stopInspectMode() and messaging to sidepanel about stopping
    // We want the inspector to stay ACTIVE until explicitly toggled off.
  } catch (err) {
    console.error("Code Peek: onClick error", err);
  }
}

  function showHighlight(el) {
    removeHighlight();
    var rect = el.getBoundingClientRect();

    // Highlight box
    highlightEl = document.createElement("div");
    highlightEl.id = "code-peek-highlight";
     highlightEl.style.cssText =
       "position:fixed;top:" +
       rect.top +
       "px;left:" +
       rect.left +
       "px;width:" +
       rect.width +
       "px;height:" +
       rect.height +
       "px;border:2px solid #2563eb;background:rgba(37,99,235,0.15);pointer-events:none;z-index:2147483647;box-shadow:0 0 0 4px rgba(37,99,235,0.1);";
     document.body.appendChild(highlightEl);

     // Info tooltip with dimensions (only if context menu enabled)
     if (contextMenuEnabled) {
       infoEl = document.createElement("div");
       infoEl.id = "code-peek-info";
       var tagName = el.tagName ? el.tagName.toLowerCase() : "element";
       var classAttr = el.getAttribute("class") || "";
       var first = classAttr.split(" ")[0];
       var className = first ? "." + first : "";

       var info =
         tagName +
         className +
         " " +
         Math.round(rect.width) +
         "×" +
         Math.round(rect.height);

       // Add distances to viewport edges
       var vw = window.innerWidth;
       var vh = window.innerHeight;

       // Check if element is fixed or absolute to adjust tooltip position
       var isFixed = window.getComputedStyle(el).position === "fixed";

       info +=
         " | L:" +
         Math.round(rect.left) +
         " T:" +
         Math.round(rect.top) +
         " R:" +
         Math.round(vw - (rect.left + rect.width)) +
         " B:" +
         Math.round(vh - (rect.top + rect.height));

        infoEl.textContent = info;

        var tooltipTop = rect.top - 30;
        if (tooltipTop < 10) tooltipTop = rect.top + rect.height + 10;

infoEl.style.cssText =
    "position:" +
    (isFixed ? "fixed" : "fixed") +
    ";top:" +
    tooltipTop +
    "px;left:" +
    rect.left +
    "px;background:#1f2937;color:#fff;padding:6px 10px;border-radius:6px;font-size:14px;font-weight:600;font-family:monospace;pointer-events:none;z-index:1000000;white-space:nowrap;";
        document.body.appendChild(infoEl);
     }

     // Draw distance lines to parent and highlight parent if enabled
     if (distanceLinesEnabled) {
       var parent = el.parentElement;
       var parentRect = parent ? parent.getBoundingClientRect() : null;
       if (parentRect && parent !== document.body && parent !== document.documentElement) {
         // Create parent highlight (muted)
         parentHighlightEl = document.createElement('div');
         parentHighlightEl.style.cssText = 'position:fixed;top:' + parentRect.top + 'px;left:' + parentRect.left + 'px;width:' + parentRect.width + 'px;height:' + parentRect.height + 'px;border:2px dashed rgba(245,158,11,0.3);pointer-events:none;z-index:2147483643;box-sizing:border-box;';
         document.body.appendChild(parentHighlightEl);
         // Draw distance lines
         drawDistanceLines(rect, parentRect);
       }
     }
   }

  function removeHighlight() {
    if (highlightEl) {
      highlightEl.remove();
      highlightEl = null;
    }
    if (infoEl) {
      infoEl.remove();
      infoEl = null;
    }
    if (parentHighlightEl) {
      parentHighlightEl.remove();
      parentHighlightEl = null;
    }
    distanceLines.forEach(function(el) { el.remove(); });
    distanceLines = [];
  }

    function drawDistanceLines(childRect, parentRect) {
      if (!childRect || !parentRect) return;

      var color = "rgba(245, 158, 11, 0.6)";
      var lineZ = 2147483645;
      var labelZ = 2147483646;

      function addLine(isVertical, left, top, length) {
        if (length <= 0) return;

        var line = document.createElement("div");
        line.style.position = "fixed";
        line.style.left = left + "px";
        line.style.top = top + "px";
        line.style.pointerEvents = "none";
        line.style.zIndex = String(lineZ);

        if (isVertical) {
          line.style.width = "1px";
          line.style.height = length + "px";
          line.style.borderLeft = "1px dashed " + color;
        } else {
          line.style.width = length + "px";
          line.style.height = "1px";
          line.style.borderBottom = "1px dashed " + color;
        }

        document.body.appendChild(line);
        distanceLines.push(line);

var label = document.createElement("div");
    label.textContent = Math.round(length) + " px";
    label.style.position = "fixed";
    label.style.left = (isVertical ? left : left + length / 2) + "px";
    label.style.top = (isVertical ? top + length / 2 : top) + "px";
    label.style.transform = "translate(-50%, -50%)";
    label.style.color = "#fff";
    label.style.background = color;
    label.style.fontFamily = "monospace";
    label.style.fontSize = "13px";
    label.style.fontWeight = "600";
    label.style.padding = "3px 7px";
    label.style.borderRadius = "4px";
    label.style.whiteSpace = "nowrap";
    label.style.pointerEvents = "none";
    label.style.zIndex = String(labelZ);

        document.body.appendChild(label);
        distanceLines.push(label);
      }

      // Top gap (distance from child top to parent top)
      var topGap = childRect.top - parentRect.top;
      if (topGap > 0) {
        addLine(true, childRect.left + childRect.width/2, parentRect.top, topGap);
      }

      // Bottom gap (distance from child bottom to parent bottom)
      var bottomGap = parentRect.bottom - childRect.bottom;
      if (bottomGap > 0) {
        addLine(true, childRect.left + childRect.width/2, childRect.bottom, bottomGap);
      }

      // Left gap
      var leftGap = childRect.left - parentRect.left;
      if (leftGap > 0) {
        addLine(false, parentRect.left, childRect.top + childRect.height/2, leftGap);
      }

      // Right gap
      var rightGap = parentRect.right - childRect.right;
      if (rightGap > 0) {
        addLine(false, childRect.right, childRect.top + childRect.height/2, rightGap);
      }
    }

    function inspectElement(el) {
     var selector = getSelector(el);
     var style = window.getComputedStyle(el);
     var rect = el.getBoundingClientRect();
     
     // Handle transparent backgrounds by walking up DOM
     var bgColor = style.backgroundColor;
     if (bgColor === "transparent" || bgColor === "rgba(0, 0, 0, 0)") {
       var parent = el.parentElement;
       while (parent && (bgColor === "transparent" || bgColor === "rgba(0, 0, 0, 0)")) {
         var parentStyle = window.getComputedStyle(parent);
         bgColor = parentStyle.backgroundColor;
         parent = parent.parentElement;
       }
     }

     var data = {
       element: {
         tagName: el.tagName,
         className: el.getAttribute("class") || "",
         id: el.id || "",
         selector: selector,
       },
       styles: {
         fontFamily: style.fontFamily,
         fontSize: style.fontSize,
         fontWeight: style.fontWeight,
         color: style.color,
         backgroundColor: bgColor,
         padding: {
           top: Math.round(parseFloat(style.paddingTop)) || 0,
           right: Math.round(parseFloat(style.paddingRight)) || 0,
           bottom: Math.round(parseFloat(style.paddingBottom)) || 0,
           left: Math.round(parseFloat(style.paddingLeft)) || 0,
         },
margin: {
      top: Math.round(parseFloat(style.marginTop)) || 0,
      right: Math.round(parseFloat(style.marginRight)) || 0,
      bottom: Math.round(parseFloat(style.marginBottom)) || 0,
      left: Math.round(parseFloat(style.marginLeft)) || 0,
    },
         borderRadius: {
           topLeft: style.borderTopLeftRadius || "0px",
           topRight: style.borderTopRightRadius || "0px",
           bottomRight: style.borderBottomRightRadius || "0px",
           bottomLeft: style.borderBottomLeftRadius || "0px",
         },
         lineHeight: style.lineHeight,
         letterSpacing: style.letterSpacing,
         border: {
           top: parseFloat(style.borderTopWidth) || 0,
           right: parseFloat(style.borderRightWidth) || 0,
           bottom: parseFloat(style.borderBottomWidth) || 0,
           left: parseFloat(style.borderLeftWidth) || 0,
         },
         width: style.width,
         height: style.height,
         display: style.display,
       },
       dimensions: {
         width: rect.width,
         height: rect.height,
         top: rect.top,
         left: rect.left,
       },
  html: el.outerHTML // For element export
  };

  // Send data to side panel
  safeSendMessage({
    type: "ELEMENT_INSPECTED",
    payload: data,
  });
  if (DEBUG) console.log("Code Peek: Data sent for", el.tagName);

  // Keep inspect mode active – do NOT call stopInspectMode()
}

  function getSelector(el) {
    if (!el) return "unknown";
    if (el.id) return "#" + el.id;
    var classAttr = el.getAttribute("class") || "";
    var classes = String(classAttr)
      .trim()
      .split(" ")
      .filter(function (c) {
        return c;
      });
    if (classes.length > 0) {
      return el.tagName.toLowerCase() + "." + classes[0];
    }
    return el.tagName.toLowerCase();
  }

  // Asset helper functions
  function isValidAssetUrl(url) {
    if (!url) return false;
    // Skip data URIs (too large), chrome URLs, about:blank
    if (url.indexOf("data:") === 0) return false;
    if (url.indexOf("chrome://") === 0) return false;
    if (url.indexOf("about:blank") === 0) return false;
    return true;
  }

  function getFilenameFromUrl(url) {
    try {
      var path = url.split("?")[0].split("#")[0];
      var parts = path.split("/");
      return parts[parts.length - 1] || "unknown";
    } catch (e) {
      return "unknown";
    }
  }

	function getExtensionFromUrl(url) {
		try {
			var filename = getFilenameFromUrl(url);
			var dot = filename.lastIndexOf(".");
			if (dot > 0) {
				var ext = filename.substring(dot + 1).toLowerCase();
				// Validate it's a known image format
				var validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'avif', 'heic', 'heif', 'tiff', 'tif'];
				if (validExtensions.indexOf(ext) !== -1) {
					return ext;
				}
			}
			// Try to detect from URL patterns or content-type hints
			if (url.indexOf('image/png') !== -1) return 'png';
			if (url.indexOf('image/jpeg') !== -1 || url.indexOf('image/jpg') !== -1) return 'jpg';
			if (url.indexOf('image/gif') !== -1) return 'gif';
			if (url.indexOf('image/webp') !== -1) return 'webp';
			if (url.indexOf('image/svg') !== -1) return 'svg';
			if (url.indexOf('image/avif') !== -1) return 'avif';
		} catch (e) {}
		return "";
	}

  function createSVGDataURL(svgString) {
    // Encode SVG as data URL, limit size to 50KB
    try {
      var encoded = encodeURIComponent(svgString);
      if (encoded.length > 50000) {
        // Truncate very large SVGs
        svgString = svgString.substring(0, 50000) + "...";
        encoded = encodeURIComponent(svgString);
      }
      return "data:image/svg+xml," + encoded;
    } catch (e) {
      return "";
    }
  }

// === EXTRACTION FUNCTIONS ===

// Extract inline styles and JS from an element
function extractElementCode(element) {
  if (!element) return null;
  
  var result = {
    html: element.outerHTML,
    inlineStyles: null,
    inlineJS: []
  };
  
  // Extract inline styles
  var styleAttr = element.getAttribute('style');
  if (styleAttr) {
    result.inlineStyles = styleAttr;
  }
  
  // Extract inline event handlers
  var eventAttrs = [
    'onclick', 'onmouseover', 'onmouseout', 'onmouseenter', 'onmouseleave',
    'onload', 'onerror', 'onsubmit', 'onchange', 'onfocus', 'onblur',
    'onkeydown', 'onkeyup', 'onkeypress', 'oninput', 'ondblclick',
    'oncontextmenu', 'onwheel', 'ondrag', 'ondragstart', 'ondragend',
    'ondragover', 'ondragenter', 'ondragleave', 'ondrop', 'onscroll',
    'onresize', 'onanimationstart', 'onanimationend', 'ontransitionend'
  ];
  
  eventAttrs.forEach(function(attr) {
    var value = element.getAttribute(attr);
    if (value) {
      result.inlineJS.push({
        attr: attr,
        value: value
      });
    }
  });
  
  return result;
}

function extractColors() {
    var colors = {};
    var elements = document.querySelectorAll(
      "body *:not(script):not(style):not(link):not(meta)",
    );

    var maxElements = 1500;
    var step = Math.max(1, Math.floor(elements.length / maxElements));
    var count = 0;

    for (var i = 0; i < elements.length && count < maxElements; i += step) {
      count++;
      var el = elements[i];
      try {
        var style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;

        var props = [
          { name: "color", source: "text" },
          { name: "backgroundColor", source: "background" },
          { name: "borderColor", source: "border" },
        ];

        for (var j = 0; j < props.length; j++) {
          var p = props[j];
          var color = style[p.name];
          if (
            color &&
            color !== "transparent" &&
            color !== "rgba(0, 0, 0, 0)" &&
            color !== "initial"
          ) {
            if (!colors[color]) {
              colors[color] = {
                color: color,
                total: 0,
                text: 0,
                background: 0,
                border: 0,
              };
            }
            colors[color].total++;
            colors[color][p.source]++;
          }
        }
      } catch (err) {}
    }

    var result = [];
    for (var c in colors) {
      result.push(colors[c]);
    }
    result.sort(function (a, b) {
      return b.total - a.total;
    });
    return result.slice(0, 80);
  }



  function extractTypography() {
    var families = {};
    var elements = document.querySelectorAll(
      "body *:not(script):not(style):not(link):not(meta)",
    );

    var count = 0;
    var maxElements = 1200; // Increased sample size

    for (var i = 0; i < elements.length && count < maxElements; i++) {
      var el = elements[i];
      var style = window.getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        !(el.innerText || el.textContent || "").trim()
      )
        continue;

      var familyRaw = style.fontFamily;
      if (!familyRaw || familyRaw === "none") continue;

      var nameRaw = familyRaw.split(",")[0] || "";
      var name = nameRaw.replace(/['"]/g, "").trim();
      if (!families[name]) {
        families[name] = {
          family: familyRaw,
          name: name,
          totalCount: 0,
          variants: {},
        };
      }

      var size = style.fontSize;
      var weight = style.fontWeight;
      var variantKey = size + "|" + weight;

      if (!families[name].variants[variantKey]) {
        families[name].variants[variantKey] = {
          size: size,
          weight: weight,
          count: 0,
          tag: el.tagName.toLowerCase(),
        };
      }

      families[name].variants[variantKey].count++;
      families[name].totalCount++;
      count++;
    }

    var result = [];
    for (var n in families) {
      var variantsArray = [];
      for (var vKey in families[n].variants) {
        variantsArray.push(families[n].variants[vKey]);
      }
      variantsArray.sort(function (a, b) {
        return b.count - a.count;
      });

      result.push({
        family: families[n].family,
        name: families[n].name,
        totalCount: families[n].totalCount,
        variants: variantsArray,
      });
    }

    result.sort(function (a, b) {
      return b.totalCount - a.totalCount;
    });
    return result.slice(0, 15);
  }

function extractAssets() {
var assets = [];

// Extract images - be more lenient
var images = document.querySelectorAll("img[src]");
var imgCount = 0;
var maxImages = 50;
for (var i = 0; i < images.length && imgCount < maxImages; i++) {
var img = images[i];
var src = img.src;
if (src && isValidAssetUrl(src)) {
var w = img.naturalWidth || img.width || img.offsetWidth || 0;
var h = img.naturalHeight || img.height || img.offsetHeight || 0;
assets.push({
type: "image",
src: src,
filename: getFilenameFromUrl(src),
extension: getExtensionFromUrl(src),
width: w,
height: h,
});
imgCount++;
}
}

    // Extract srcset sources (limited)
    var sources = document.querySelectorAll("source[srcset]");
    var srcCount = 0;
    var maxSrc = 25;
    for (var i = 0; i < sources.length && srcCount < maxSrc; i++) {
      var source = sources[i];
      var srcset = source.srcset;
      if (srcset) {
        var parts = srcset.split(",").map(function (part) {
          return (part || "").trim().split(" ")[0];
        });
        for (var j = 0; j < parts.length && srcCount < maxSrc; j++) {
          var url = parts[j];
          try {
            url = new URL(url, document.baseURI).href;
          } catch (e) {}

          if (isValidAssetUrl(url)) {
            assets.push({
              type: "image",
              src: url,
              filename: getFilenameFromUrl(url),
              extension: getExtensionFromUrl(url),
              width: 0,
              height: 0,
              source: "srcset",
            });
          }
        }
      }
    }

    // Extract inline SVG elements
    var svgElements = document.querySelectorAll("svg");
    for (var i = 0; i < svgElements.length; i++) {
      var svg = svgElements[i];
      var bbox = svg.getBBox();
      var svgString = svg.outerHTML;
      assets.push({
        type: "svg",
        src: createSVGDataURL(svgString),
        filename: "svg-" + i + ".svg",
        extension: "svg",
        width: bbox.width || 0,
        height: bbox.height || 0,
        content: svgString,
      });
    }

    // Extract background images
    var allElements = document.querySelectorAll("*");
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      var computed = window.getComputedStyle(el);
      var bgImage = computed.backgroundImage;
      if (bgImage && bgImage !== "none") {
        var urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (urlMatch) {
          var url = urlMatch[1];
          try {
            url = new URL(url, document.baseURI).href;
          } catch (e) {}

          if (isValidAssetUrl(url) && !seenAsset(assets, url)) {
            var rect = el.getBoundingClientRect();
            if (rect.width > 8 && rect.height > 8) {
              assets.push({
                type: "background",
                src: url,
                filename: getFilenameFromUrl(url),
                extension: getExtensionFromUrl(url),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                selector: getSelector(el),
              });
            }
          }
        }
      }
    }

// Deduplicate and filter
var seen = {};
var filtered = [];
for (var i = 0; i < assets.length; i++) {
var asset = assets[i];
if (!seen[asset.src]) {
seen[asset.src] = true;
filtered.push(asset);
}
}

return filtered;
}

  function seenAsset(assets, url) {
    for (var i = 0; i < assets.length; i++) {
      if (assets[i].src === url) return true;
    }
    return false;
  }

   function extractPageStats() {
     var stats = {
       title: "",
       host: "",
       stylesheets: 0,
       rules: 0,
       size: 0,
       loadTime: 0,
       stylesheetsList: [],
       contrastIssues: [],
     };

     // Extract title and host
     try {
       stats.title = document.title || "";
       stats.host = window.location.hostname || "";
     } catch (e) {}

     // Get load time
    try {
      if (window.performance && window.performance.timing) {
        var t = window.performance.timing;
        stats.loadTime = t.loadEventEnd - t.navigationStart;
        if (stats.loadTime <= 0) {
          stats.loadTime = Date.now() - t.navigationStart;
        }
      }
    } catch (e) {}

    var sheets = document.styleSheets;
    stats.stylesheets = sheets.length;

    try {
      // Limit sheet processing to avoid hangs on complex sites
      var maxSheets = Math.min(sheets.length, 15);
      for (var i = 0; i < maxSheets; i++) {
        var sheet = sheets[i];
        var href = sheet.href || "inline";
        var ruleCount = 0;
        try {
          if (sheet.cssRules) {
            ruleCount = sheet.cssRules.length;
          }
        } catch (e) {
          ruleCount = 0;
        }

        var name = "inline";
        if (href !== "inline") {
          try {
            var url = new URL(href);
            name = url.pathname.split("/").pop() || url.hostname;
          } catch (e) {
            name = href.split("/").pop() || "stylesheet";
          }
        }

        stats.rules += ruleCount;
        stats.stylesheetsList.push({
          href: href,
          title: name,
          rules: ruleCount,
        });
      }
    } catch (e) {
      console.error("Error extracting page stats:", e);
    }

    // Optimize size calculation (don't loop every single k if too many)
    var totalSize = 0;
    var maxRulesForSize = 500;
    var rulesCounted = 0;
    for (var j = 0; j < Math.min(sheets.length, 10); j++) {
      try {
        if (sheets[j].cssRules) {
          var sRules = sheets[j].cssRules;
          for (
            var k = 0;
            k < sRules.length && rulesCounted < maxRulesForSize;
            k++
          ) {
            if (sRules[k].cssText) {
              totalSize += sRules[k].cssText.length;
              rulesCounted++;
            }
          }
        }
      } catch (e) {}
    }
    // Extrapolate size if we hit the cap
    if (rulesCounted >= maxRulesForSize && stats.rules > maxRulesForSize) {
      stats.size = Math.round((totalSize / rulesCounted) * stats.rules);
    } else {
      stats.size = totalSize;
    }

var elements = document.querySelectorAll(
"p, span, h1, h2, h3, h4, h5, h6, a, button, li",
);
var maxContrast = 50;
var contrastCount = 0;
var seenSelectors = {};

for (var i = 0; i < elements.length && contrastCount < maxContrast; i++) {
var el = elements[i];
try {
var style = window.getComputedStyle(el);
var fg = style.color;
var bg = style.backgroundColor;

// If background is transparent, try to get parent background
var parent = el.parentElement;
var depth = 0;
var maxDepth = 10;
while (
(bg === "transparent" || bg === "rgba(0, 0, 0, 0)") &&
parent &&
depth < maxDepth
) {
try {
bg = window.getComputedStyle(parent).backgroundColor;
} catch (error) {
break;
}

if (parent.tagName === "BODY" || parent.tagName === "HTML") {
break;
}

parent = parent.parentElement;
depth++;
}

// Skip if still transparent
if (!bg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)") {
continue;
}

// Skip duplicate selectors
var selector = getSimpleSelector(el);
if (seenSelectors[selector]) {
continue;
}

if (fg && fg !== "transparent") {
var ratio = calculateContrastRatio(fg, bg);
if (ratio < 4.5) {
seenSelectors[selector] = true;
contrastCount++;
var fontSize = parseFloat(style.fontSize);
var isLarge =
fontSize >= 24 || (fontSize >= 18.66 && style.fontWeight >= 700);

stats.contrastIssues.push({
tag: el.tagName.toLowerCase(),
fg: fg,
bg: bg,
ratio: ratio,
isLarge: isLarge,
aa: ratio >= (isLarge ? 3 : 4.5),
aaa: ratio >= (isLarge ? 4.5 : 7),
selector: selector,
});
}
}
} catch (e) {}
}

return stats;
}

function calculateContrastRatio(color1, color2) {
var c1 = parseColor(color1);
var c2 = parseColor(color2);
if (!c1 || !c2) {
console.warn('[Code Peek] Failed to parse colors:', color1, color2);
return 1;
}

var blended1 = blendColorOverWhite(c1);
var blended2 = blendColorOverWhite(c2);

var l1 = getLuminance(blended1.r, blended1.g, blended1.b);
var l2 = getLuminance(blended2.r, blended2.g, blended2.b);
var lighter = Math.max(l1, l2);
var darker = Math.min(l1, l2);
var ratio = (lighter + 0.05) / (darker + 0.05);
return Math.round(ratio * 100) / 100;
}

// Blend a color with alpha over a white background
function blendColorOverWhite(color) {
  if (color.a >= 1) {
    return color;
  }
  var alpha = color.a;
  return {
    r: Math.round(color.r * alpha + 255 * (1 - alpha)),
    g: Math.round(color.g * alpha + 255 * (1 - alpha)),
    b: Math.round(color.b * alpha + 255 * (1 - alpha)),
  };
}

function parseColor(str) {
  if (!str) return null;
  
  // Normalize string
  str = String(str).trim();
  
  // Handle transparent/null colors
  if (str === "transparent" || str === "rgba(0, 0, 0, 0)" || str === "rgba(0,0,0,0)") {
    return null;
  }
  
  // Handle invalid concatenated colors (sometimes CSS returns multiple values)
  if (str.indexOf(') ') !== -1 && str.indexOf('(') !== -1) {
    // Take the first color only
    var firstParen = str.indexOf(')');
    str = str.substring(0, firstParen + 1);
  }

  // Handle rgb/rgba directly
var directMatch = str.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([01]?\.\d+|\d+\.?\d*))?\s*\)$/);
if (directMatch) {
var alpha = 1;
if (directMatch[4] !== undefined && directMatch[4] !== "") {
alpha = parseFloat(directMatch[4]);
if (alpha < 0) alpha = 0;
if (alpha > 1) alpha = 1;
}
return {
r: parseInt(directMatch[1]),
g: parseInt(directMatch[2]),
b: parseInt(directMatch[3]),
a: alpha,
};
}

// Handle hex directly
if (str.charAt(0) === "#") {
var hex = str.slice(1);
if (hex.length === 3) {
hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
}
if (hex.length === 6 && /^[0-9a-fA-F]{6}$/.test(hex)) {
return {
r: parseInt(hex.slice(0, 2), 16),
g: parseInt(hex.slice(2, 4), 16),
b: parseInt(hex.slice(4, 6), 16),
a: 1,
};
}
if (hex.length === 8 && /^[0-9a-fA-F]{8}$/.test(hex)) {
return {
r: parseInt(hex.slice(0, 2), 16),
g: parseInt(hex.slice(2, 4), 16),
b: parseInt(hex.slice(4, 6), 16),
a: parseInt(hex.slice(6, 8), 16) / 255,
};
}
}

  // For modern color formats (oklch, lab, color(), etc), use canvas for conversion
  try {
    if (!_colorCanvas) {
      _colorCanvas = document.createElement('canvas');
      _colorCanvas.width = 1;
      _colorCanvas.height = 1;
      _colorCtx = _colorCanvas.getContext('2d', { willReadFrequently: true });
    }
    _colorCtx.fillStyle = '#000000';
    _colorCtx.fillStyle = str;
    _colorCtx.fillRect(0, 0, 1, 1);
    var data = _colorCtx.getImageData(0, 0, 1, 1).data;
    return {
      r: data[0],
      g: data[1],
      b: data[2],
      a: data[3] / 255,
    };
  } catch (e) {
console.warn('[Code Peek] Color parsing failed:', str, e.message);
}

return null;
}

  function getLuminance(r, g, b) {
    var a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

   function getSimpleSelector(el) {
     if (!el) return "element";
     if (el.id) return "#" + el.id;
     var classText =
       typeof el.className === "string"
         ? el.className
         : el.getAttribute
           ? el.getAttribute("class") || ""
           : "";
     var firstClass = String(classText).trim().split(" ")[0];
     return firstClass ? "." + firstClass : el.tagName.toLowerCase();
   }

// === BROKEN LINK DETECTION ===
function checkBrokenLinks() {
  var links = Array.from(document.querySelectorAll('a[href]'));
  var currentOrigin = window.location.origin;
  var currentUrl = window.location.href.split('#')[0].split('?')[0];

  // Filter: internal links only, skip non-HTTP protocols
  var internalLinks = links
    .filter(function(link) {
      var href = link.href;
      // Skip empty or invalid
      if (!href || href === '') return false;
      // Skip javascript: protocol
      if (href.indexOf('javascript:') === 0) return false;
      // Skip mailto: protocol
      if (href.indexOf('mailto:') === 0) return false;
      // Skip tel: protocol
      if (href.indexOf('tel:') === 0) return false;
      // Skip anchor-only links (same page navigation)
      if (href.indexOf('#') === 0) return false;
      // Skip if href is just anchor on current page
      if (href.indexOf('#') > 0) {
        var baseHref = href.split('#')[0];
        if (baseHref === currentUrl || baseHref === '') return false;
      }
      // Only include internal links (same origin)
      if (href.indexOf(currentOrigin) !== 0) return false;
      return true;
    })
    .slice(0, 50); // Limit to first 50 to prevent hang

  // Return link info (URL and text)
  return internalLinks.map(function(link) {
    return {
      url: link.href,
      text: (link.innerText || link.textContent || '').trim().slice(0, 50)
    };
  });
}

function detectTechStack() {
  // Use TechDetector module if available (bundled from tech-detector.js)
  if (typeof TechDetector !== 'undefined' && TechDetector.detect) {
    var raw = TechDetector.detect();

    // Helper to extract names from TechDetector results (which are {name, icon, version} objects)
    function extractNames(arr) {
      if (!arr || !Array.isArray(arr)) return [];
      return arr.map(function(item) {
        return typeof item === 'string' ? item : (item.name || item);
      });
    }

    // Normalize to expected UI structure
    var result = {
      frameworks: extractNames(raw.frameworks),
      css: extractNames(raw.cssFrameworks),
      build: [], // TechDetector doesn't have separate build tools
      cms: raw.cms || [], // CMS items are objects with {name, plugins}
      plugins: [],
      basicTech: raw.basicTech || null,
      confidence: { overall: 0 }
    };

    // Extract WordPress plugins if detected
    if (raw.wordpress && raw.wordpress.plugins) {
      result.plugins = raw.wordpress.plugins.slice();
    }

    // Extract e-commerce as plugins
    if (raw.ecommerce && raw.ecommerce.length > 0) {
      result.plugins = result.plugins.concat(extractNames(raw.ecommerce));
    }

    // Extract libraries as additional info
    if (raw.libraries && raw.libraries.length > 0) {
      result.plugins = result.plugins.concat(extractNames(raw.libraries));
    }

    // Extract analytics
    if (raw.analytics && raw.analytics.length > 0) {
      result.plugins = result.plugins.concat(extractNames(raw.analytics));
    }

    // Calculate confidence
    var totalSignals = result.frameworks.length + result.css.length +
      result.build.length + result.cms.length + result.plugins.length;
    result.confidence.overall = Math.min(100, totalSignals * 12);

    return result;
  }

	// Fallback inline detection
	var result = {
		frameworks: [],
		css: [],
		build: [],
		cms: [],
		plugins: [],
		confidence: {}
	};

	var html = document.documentElement.innerHTML || '';
	var bodyClasses = (document.body && document.body.className) || '';

	// Detect JavaScript frameworks
	if (window.React || window.ReactDOM) result.frameworks.push('React');
	if (window.Vue) result.frameworks.push('Vue');
	if (window.angular) result.frameworks.push('Angular');
	if (window.svelte) result.frameworks.push('Svelte');
	if (window.Ember) result.frameworks.push('Ember');
	if (window.Backbone) result.frameworks.push('Backbone');

	// Detect Next.js via __NEXT_DATA__ global or __next element
	if (window.__NEXT_DATA__ || document.getElementById('__next')) {
		result.frameworks.push('Next.js');
	}

	// Detect Nuxt via __NUXT__ global or __nuxt element
	if (window.__NUXT__ || document.getElementById('__nuxt') || document.getElementById('__layout')) {
		result.frameworks.push('Nuxt');
	}

	// Detect SvelteKit via sveltekit in scripts
	var svelteKitScripts = document.querySelectorAll('script[src*="sveltekit"], script[type="module"]');
	svelteKitScripts.forEach(function(s) {
		if (s.src && s.src.indexOf('sveltekit') !== -1) {
			if (result.frameworks.indexOf('SvelteKit') === -1) result.frameworks.push('SvelteKit');
		}
	});

	// Detect Astro via astro: prefix in scripts or __astro__ global
	if (window.__astro__ || html.indexOf('astro:') !== -1) {
		result.frameworks.push('Astro');
	}

	// Detect jQuery
	if (window.jQuery) {
		result.frameworks.push('jQuery');
		if (window.jQuery.fn && window.jQuery.fn.modal) result.css.push('Bootstrap (via jQuery)');
	}

	// Detect Tailwind CSS by utility class patterns
	if (/\b(bg|text|flex|grid|p|m|pt|pr|pb|pl|mx|my|w|h|min-w|max-w|border|rounded|shadow|opacity|z|inset|absolute|relative|fixed|sticky)-[a-z0-9]+\b/.test(html)) {
		result.css.push('Tailwind CSS');
	}

	// Detect Bootstrap via class patterns
	if (/\b(container|row|col(?:-sm|-md|-lg|-xl)?)\b/.test(html)) {
		result.css.push('Bootstrap');
	}

	// Detect Bulma
	if (/\b(is-active|is-primary|is-success|has-text-centered)\b/.test(html)) {
		result.css.push('Bulma');
	}

	// Detect build tools from script src
	var scripts = document.querySelectorAll('script[src]');
	scripts.forEach(function(s) {
		var src = s.src.toLowerCase();
		if (src.indexOf('webpack') !== -1 && result.build.indexOf('Webpack') === -1) result.build.push('Webpack');
		if (src.indexOf('vite') !== -1 && result.build.indexOf('Vite') === -1) result.build.push('Vite');
		if (src.indexOf('parcel') !== -1 && result.build.indexOf('Parcel') === -1) result.build.push('Parcel');
		if (src.indexOf('next') !== -1 && result.frameworks.indexOf('Next.js') === -1) result.frameworks.push('Next.js');
		if (src.indexOf('nuxt') !== -1 && result.frameworks.indexOf('Nuxt') === -1) result.frameworks.push('Nuxt');
		if (src.indexOf('gatsby') !== -1 && result.frameworks.indexOf('Gatsby') === -1) result.frameworks.push('Gatsby');
	});

	// === CMS DETECTION ===

	// WordPress detection - multiple signals
	var wordpressSignals = 0;
	var wpPluginNames = [];

	// Check for wp- class prefixes
	if (/\bwp-[a-z]+\b/.test(bodyClasses) || /\bwp-[a-z]+\b/.test(html)) {
		wordpressSignals++;
	}

	// Check for /wp-content/ in URLs
	var assets = document.querySelectorAll('script[src], link[href], img[src]');
	assets.forEach(function(asset) {
		var url = (asset.src || asset.href || '').trim();
		if (!url) return;
		var normalized = url.toLowerCase();
		if (normalized.indexOf('/wp-content/') !== -1) {
			wordpressSignals++;
		}
		// Extract plugin names
		var pluginMatch = url.match(/\/wp-content\/plugins\/([^\/?#]+)/i);
		if (pluginMatch && pluginMatch[1]) {
			var pluginName = pluginMatch[1];
			try {
				pluginName = decodeURIComponent(pluginName);
			} catch (e) {}
			pluginName = pluginName.replace(/[^a-zA-Z0-9_-]/g, '');
			if (pluginName && wpPluginNames.indexOf(pluginName) === -1) {
				wpPluginNames.push(pluginName);
			}
		}
	});

	// Check for window.wp global
	if (window.wp) {
		wordpressSignals++;
	}

	// Check for WordPress-specific meta generator
	var metaGenerator = document.querySelector('meta[name="generator"][content*="WordPress"]');
	if (metaGenerator) {
		wordpressSignals++;
	}

	if (wordpressSignals > 0) {
		result.cms.push({
			name: 'WordPress',
			plugins: wpPluginNames.sort()
		});
	}

	// WooCommerce detection
	var wooCommerceDetected = false;
	if (window.wc || window.wcSettings) {
		wooCommerceDetected = true;
	}
	if (/\bwoocommerce\b|\bwc-\w+\b/.test(bodyClasses) || /\bwoocommerce\b/.test(html)) {
		wooCommerceDetected = true;
	}
	if (wooCommerceDetected) {
		result.plugins.push('WooCommerce');
	}

	// Elementor detection
	var elementorDetected = false;
	if (window.elementorFrontend || window.elementor) {
		elementorDetected = true;
	}
	if (/\belementor\b|\belementor-\w+\b/.test(bodyClasses) || /\belementor\b/.test(html)) {
		elementorDetected = true;
	}
	var elementorStyles = document.querySelectorAll('link[href*="elementor"]');
	if (elementorStyles.length > 0) {
		elementorDetected = true;
	}
	if (elementorDetected) {
		result.plugins.push('Elementor');
	}

	// Yoast SEO detection
	if (window.yoast || window.YoastSEO) {
		result.plugins.push('Yoast SEO');
	}

	// Jetpack detection
	if (window.Jetpack) {
		result.plugins.push('Jetpack');
	}

	// Shopify detection
	var shopifyDetected = false;
	if (window.Shopify) {
		shopifyDetected = true;
	}
	var shopifyScripts = document.querySelectorAll('script[src*="cdn.shopify.com"], script[src*="shopify"]');
	if (shopifyScripts.length > 0) {
		shopifyDetected = true;
	}
	if (shopifyDetected && !result.cms.some(function(c) { return c.name === 'Shopify'; })) {
		result.cms.push({ name: 'Shopify', plugins: [] });
	}

	// Drupal detection
	var drupalDetected = false;
	if (window.Drupal) {
		drupalDetected = true;
	}
	var drupalSettings = document.querySelector('script[data-drupal-selector]');
	if (drupalSettings) {
		drupalDetected = true;
	}
	if (/\bDrupal\b/.test(html)) {
		drupalDetected = true;
	}
	if (drupalDetected && !result.cms.some(function(c) { return c.name === 'Drupal'; })) {
		result.cms.push({ name: 'Drupal', plugins: [] });
	}

	// Joomla detection
	if (window.Joomla) {
		if (!result.cms.some(function(c) { return c.name === 'Joomla'; })) {
			result.cms.push({ name: 'Joomla', plugins: [] });
		}
	}

	// Webflow detection
	var webflowDetected = false;
	if (window.Webflow) {
		webflowDetected = true;
	}
	var webflowScripts = document.querySelectorAll('script[src*="webflow"]');
	if (webflowScripts.length > 0) {
		webflowDetected = true;
	}
	if (/\bwf-\w+\b/.test(html)) {
		webflowDetected = true;
	}
	if (webflowDetected && !result.cms.some(function(c) { return c.name === 'Webflow'; })) {
		result.cms.push({ name: 'Webflow', plugins: [] });
	}

	// Squarespace detection
	if (window.Squarespace) {
		if (!result.cms.some(function(c) { return c.name === 'Squarespace'; })) {
			result.cms.push({ name: 'Squarespace', plugins: [] });
		}
	}

	// Wix detection
	if (window.wixBiSession || window.wixPerformanceMeasurements) {
		if (!result.cms.some(function(c) { return c.name === 'Wix'; })) {
			result.cms.push({ name: 'Wix', plugins: [] });
		}
	}

	// Deduplicate arrays
	var seen = {};
	result.frameworks = result.frameworks.filter(function(item) {
		return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	});
	seen = {};
	result.css = result.css.filter(function(item) {
		return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	});
	seen = {};
	result.build = result.build.filter(function(item) {
		return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	});
	seen = {};
	result.plugins = result.plugins.filter(function(item) {
		return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	});

	// Calculate confidence based on signals count
	var totalSignals = result.frameworks.length + result.css.length + result.build.length + result.cms.length + result.plugins.length;
	result.confidence.overall = Math.min(100, totalSignals * 15);

	return result;
}

if (
     typeof chrome !== "undefined" &&
     chrome.runtime &&
     chrome.runtime.onMessage
   ) {
     chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
       if (DEBUG) console.log("Content received:", msg.type);
       try {
         switch (msg.type) {
           case "EXTRACT_PAGE_DATA":
             var pageData = extractPageStats();
             pageData.colors = extractColors();
             pageData.typography = extractTypography();
             pageData.assets = extractAssets();
             pageData.meta = extractMetaTags();
             sendResponse({ success: true, data: pageData });
             break;
          case "EXTRACT_COLORS":
            sendResponse({ success: true, data: extractColors() });
            break;
          case "EXTRACT_TYPOGRAPHY":
            sendResponse({ success: true, data: extractTypography() });
            break;
case "EXTRACT_ASSETS":
          sendResponse({ success: true, data: extractAssets() });
          break;
         case "EXTRACT_ELEMENT_CODE":
           var selector = msg.payload && msg.payload.selector;
           var element = null;
           if (selector) {
             try {
              element = document.querySelector(selector);
            } catch (e) {}
          }
           if (element) {
             sendResponse({ success: true, data: extractElementCode(element) });
           } else {
             sendResponse({ success: false, error: "Element not found" });
           }
           break;
         case "START_CODE_ELEMENT_SELECT":
           return startCodeSelectMode(sendResponse);
         case "STOP_CODE_ELEMENT_SELECT":
           stopCodeSelectMode({ success: false, cancelled: true, error: "Code selection cancelled." });
           sendResponse({ success: true });
           break;
         case "START_INSPECT_MODE":
             startInspectMode();
             sendResponse({ success: true });
             break;
          case "STOP_INSPECT_MODE":
            stopInspectMode();
            sendResponse({ success: true });
            break;
case "SCROLL_TO":
      window.scrollTo(msg.payload.x || 0, msg.payload.y || 0);
      setTimeout(function () {
        sendResponse({ success: true });
      }, 150);
      break;
    case "SCROLL_TO_POSITION":
      window.scrollTo(0, msg.payload.y || 0);
      setTimeout(function () {
        sendResponse({ success: true });
      }, 150);
      break;
            case "GET_SCROLL_DIMENSIONS":
             sendResponse({
               success: true,
               data: {
                 width: Math.max(
                   document.documentElement.scrollWidth,
                   document.body.scrollWidth,
                 ),
                 height: Math.max(
                   document.documentElement.scrollHeight,
                   document.body.scrollHeight,
                 ),
                 viewportWidth: window.innerWidth,
                 viewportHeight: window.innerHeight,
               },
              });
              break;
              
              case "HIDE_SCROLLBARS":
                var styleId = "code-peek-screenshot-hide";
                if (!document.getElementById(styleId)) {
                  var style = document.createElement("style");
                  style.id = styleId;
                  style.textContent = '*::-webkit-scrollbar { display: none !important; }';
                  document.head.appendChild(style);
                }
                sendResponse({ success: true });
                break;
              
              case "SHOW_SCROLLBARS":
                var styleEl = document.getElementById("code-peek-screenshot-hide");
                if (styleEl) styleEl.remove();
                sendResponse({ success: true });
                break;
              
              case "HIDE_STICKY_FIXED":
                var hiddenCount = 0;
                var all = document.querySelectorAll('*');
                for (var i = 0; i < all.length; i++) {
                  var el = all[i];
                  var pos = window.getComputedStyle(el).position;
                  if (pos === 'sticky' || pos === 'fixed') {
                    if (!el.dataset._screenshotOriginalDisplay) {
                      el.dataset._screenshotOriginalDisplay = el.style.display;
                      el.style.display = 'none';
                      hiddenCount++;
                    }
                  }
                }
                sendResponse({ success: true, hiddenCount: hiddenCount });
                break;
              
               case "SHOW_STICKY_FIXED":
                 var all = document.querySelectorAll('*');
                 for (var i = 0; i < all.length; i++) {
                   var el = all[i];
                   if (el.dataset._screenshotOriginalDisplay !== undefined) {
                     el.style.display = el.dataset._screenshotOriginalDisplay;
                     delete el.dataset._screenshotOriginalDisplay;
                   }
                 }
                 sendResponse({ success: true });
                 break;
              
               case "SET_DISTANCE_LINES_VISIBLE":
                 distanceLinesEnabled = !!msg.payload.visible;
                 if (!distanceLinesEnabled) {
                   distanceLines.forEach(function(el) { el.remove(); });
                   distanceLines = [];
                 }
                 sendResponse({ success: true });
                 break;

              case "SET_CONTEXT_MENU_VISIBLE":
                 contextMenuEnabled = !!msg.payload.visible;
                 if (!contextMenuEnabled && infoEl) {
                   infoEl.remove();
                   infoEl = null;
                 }
                 sendResponse({ success: true });
                 break;

               case "DISABLE_INSPECT_AND_MEASURE":
                  if (inspectActive) stopInspectMode();
                  if (measureMode) toggleMeasureMode(false);
                  sendResponse({ success: true });
                  break;

case "RESET_ALL_OVERLAYS":
      if (inspectActive) stopInspectMode();
      if (rulersActive) disableRulersOverlay();
      if (measureMode) toggleMeasureMode(false);
      removeHighlight();
      clearMeasurementOverlay();
      clearMeasureHighlights();
      if (floatingPanelEl) destroyFloatingPanel();
      sendResponse({ success: true });
      break;

case "CREATE_FLOATING_PANEL":
        if (DEBUG) console.log('[Code Peek] CREATE_FLOATING_PANEL received');
        createFloatingPanel(msg.payload);
        sendResponse({ success: true });
        break;

    case "CLOSE_FLOATING_PANEL":
      if (floatingPanelEl) destroyFloatingPanel();
      sendResponse({ success: true });
      break;
                
case "GET_TECH_STACK":
          sendResponse({
            success: true,
            data: detectTechStack()
          });
          break;
        case "CHECK_BROKEN_LINKS":
          sendResponse({
            success: true,
            data: checkBrokenLinks()
          });
          break;
            case "TOGGLE_RULERS":
              if (msg.payload.enabled) {
                enableRulersOverlay(msg.payload.unit);
              } else {
                disableRulersOverlay();
              }
              sendResponse({ success: true });
              break;
             case "UPDATE_RULER_UNIT":
               updateRulerUnit(msg.payload.unit);
               sendResponse({ success: true });
               break;
              case "CLEAR_RULERS_GUIDES":
                rulers.forEach(function(r) {
    if (r.element.parentNode) r.element.parentNode.removeChild(r.element);
  });
  rulers = [];

  safeSendMessage({ type: 'RULERS_CLEARED' });

  sendResponse({ success: true });
  break;

case "REMOVE_RULER":
                 var id = msg.payload.id;
                 var idx = rulers.findIndex(function(r) { return r.id === id; });
                 if (idx !== -1) {
                   var r = rulers[idx];
                   if (r.element.parentNode) r.element.parentNode.removeChild(r.element);
                   rulers.splice(idx, 1);
                 }
                 sendResponse({ success: true });
                 break;

case "TOGGLE_MEASURE_MODE":
toggleMeasureMode(!!msg.payload.enabled);
sendResponse({ success: true });
break;
case "HIGHLIGHT_ELEMENT":
var highlightSelector = msg.selector;
var highlightTag = msg.tag;
var highlightEl = null;
if (highlightSelector) {
try {
highlightEl = document.querySelector(highlightSelector);
} catch (e) {}
}
if (!highlightEl && highlightTag) {
var candidates = document.querySelectorAll(highlightTag);
for (var hi = 0; hi < candidates.length; hi++) {
var c = candidates[hi];
var cStyle = window.getComputedStyle(c);
var cBg = cStyle.backgroundColor;
if (cBg && cBg !== 'transparent' && cBg !== 'rgba(0, 0, 0, 0)') {
highlightEl = c;
break;
}
}
}
if (highlightEl) {
var rect = highlightEl.getBoundingClientRect();
var existingHighlight = document.getElementById('code-peek-contrast-highlight');
if (existingHighlight) existingHighlight.remove();
var highlightDiv = document.createElement('div');
highlightDiv.id = 'code-peek-contrast-highlight';
highlightDiv.style.cssText = 'position: fixed; top: ' + rect.top + 'px; left: ' + rect.left + 'px; width: ' + rect.width + 'px; height: ' + rect.height + 'px; border: 2px solid #ff0000; background: rgba(255, 0, 0, 0.1); pointer-events: none; z-index: 2147483647; box-sizing: border-box;';
document.body.appendChild(highlightDiv);
highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
sendResponse({ success: true });
break;
case "CLEAR_HIGHLIGHT":
var highlightToRemove = document.getElementById('code-peek-contrast-highlight');
if (highlightToRemove) highlightToRemove.remove();
sendResponse({ success: true });
break;
default:
               sendResponse({ success: false, error: "Unknown type" });
        }
      } catch (e) {
        console.error("Content script error:", e);
        var stack = e.stack || 'No stack trace';
        sendResponse({ success: false, error: e.message + '\n' + stack });
      }
      return true;
    });
  }

  // Extract Open Graph, Twitter Card, and other meta tags
  function extractMetaTags() {
    var meta = {
      title: document.title,
      pageTitle: document.title,
      description: "",
      pageDescription: "",
      image: "",
      url: window.location.href,
      favicon: "",
      og: {},
      twitter: {},
      canonical: ""
    };

    function toAbsoluteUrl(url) {
      var resolver;
      if (!url) return "";
      try {
        resolver = document.createElement("a");
        resolver.href = url;
        return resolver.href || url;
      } catch (e) {
        return url;
      }
    }

    // Get meta description
    var descEl = document.querySelector('meta[name="description"]');
    if (descEl) {
      meta.description = descEl.getAttribute("content") || "";
      meta.pageDescription = meta.description;
    }

    // Get canonical URL
    var canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) meta.canonical = toAbsoluteUrl(canonicalEl.getAttribute("href") || "");

    // Get favicon
    var faviconEl = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    if (faviconEl) meta.favicon = toAbsoluteUrl(faviconEl.getAttribute("href") || "");

// Open Graph tags
  var ogTags = document.querySelectorAll('meta[property^="og:"]');
  for (var i = 0; i < ogTags.length; i++) {
    var prop = ogTags[i].getAttribute("property");
    var content = ogTags[i].getAttribute("content") || "";
    if (prop) {
      var key = prop.replace(/^og:/, "").toLowerCase();
      // Handle og:image, og:image:url, og:image:secure_url as 'image'
      if (key === "image" || key === "image:url" || key === "image:secure_url") {
        if (content) meta.og.image = toAbsoluteUrl(content);
      } else {
        meta.og[key] = (key === "url") ? toAbsoluteUrl(content) : content;
      }
    }
  }

    // Twitter Card tags
    var twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
    for (var j = 0; j < twitterTags.length; j++) {
      var name = twitterTags[j].getAttribute("name");
      var content = twitterTags[j].getAttribute("content") || "";
      if (name) {
        var key = name.replace(/^twitter:/, "").toLowerCase();
        meta.twitter[key] = key === "image"
          ? toAbsoluteUrl(content)
          : content;
      }
    }

    // Use OG image as primary, fallback to twitter image
    if (meta.og.image) {
      meta.image = meta.og.image;
    } else if (meta.twitter.image) {
      meta.image = meta.twitter.image;
    }

    // Use OG title/description as primary, fallback to standard ones
    if (meta.og.title) {
      meta.title = meta.og.title;
    }
    if (meta.og.description) {
      meta.description = meta.og.description;
    }

    return meta;
  }

   // === RULERS OVERLAY ===
   var rulersActive = false;
   var rulersUnit = 'px';
   var rulersOverlay = null;
   var rulersTooltip = null;
   var rulers = []; // { id, type: 'vertical'|'horizontal', position: number (x or y), element: DOMElement }
   var nextRulerId = 1;
   var dragRuler = null;
  var justDragged = false;
var justDragged = false;
   var dragStartX = 0, dragStartY = 0, dragStartPos = 0;

  function enableRulersOverlay(unit) {
    if (rulersActive) return;
    rulersActive = true;
    rulersUnit = unit || 'px';
    
    createRulersOverlay();
    document.addEventListener('mousemove', onRulersMouseMove, true);
    document.addEventListener('click', onRulersClick, true);
    document.addEventListener('keydown', onRulersKeyDown, true);
    if (DEBUG) console.log('Code Peek: Rulers overlay enabled');
  }

   function disableRulersOverlay() {
     if (!rulersActive) return;
     rulersActive = false;
     
     if (rulersOverlay && rulersOverlay.parentNode) {
       rulersOverlay.parentNode.removeChild(rulersOverlay);
     }
  if (rulersTooltip && rulersTooltip.parentNode) {
    rulersTooltip.parentNode.removeChild(rulersTooltip);
  }
  rulers.forEach(function(r) {
    if (r.element.parentNode) r.element.parentNode.removeChild(r.element);
  });
  rulers = [];

  safeSendMessage({ type: 'RULERS_CLEARED' });

  document.removeEventListener('mousemove', onRulersMouseMove, true);
  document.removeEventListener('click', onRulersClick, true);
  document.removeEventListener('keydown', onRulersKeyDown, true);
     if (DEBUG) console.log('Code Peek: Rulers overlay disabled');
   }

  function updateRulerUnit(unit) {
    rulersUnit = unit || 'px';
    if (DEBUG) console.log('Code Peek: Ruler unit updated to', rulersUnit);
  }

  function createRulersOverlay() {
    rulersOverlay = document.createElement('div');
    rulersOverlay.id = 'code-peek-rulers-overlay';
    // Use auto to capture mouse events for placing markers
    rulersOverlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:auto;z-index:2147483647;font-family:monospace;font-size:11px;cursor:crosshair;';
    
    var rulerH = document.createElement('div');
    rulerH.style.cssText = 'position:absolute;top:0;left:0;right:0;height:20px;background:linear-gradient(90deg,#f59e0b 1px,transparent 1px);background-size:100px 100%;border-bottom:1px solid #f59e0b;pointer-events:none;';
    
    var rulerV = document.createElement('div');
    rulerV.style.cssText = 'position:absolute;top:0;left:0;width:20px;bottom:0;background:linear-gradient(180deg,#f59e0b 1px,transparent 1px);background-size:100% 100px;border-right:1px solid #f59e0b;pointer-events:none;';
    
    rulersOverlay.appendChild(rulerH);
    rulersOverlay.appendChild(rulerV);
    document.body.appendChild(rulersOverlay);
    
    rulersTooltip = document.createElement('div');
    rulersTooltip.id = 'code-peek-rulers-tooltip';
    rulersTooltip.style.cssText = 'position:fixed;background:#1e293b;color:#fff;padding:6px 10px;border-radius:6px;pointer-events:none;z-index:2147483648;display:none;white-space:pre;font-size:12px;line-height:1.4;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:monospace;';
    document.body.appendChild(rulersTooltip);
  }

  function onRulersMouseMove(e) {
    if (!rulersActive || !rulersTooltip) return;
    
    var x = e.clientX;
    var y = e.clientY;
    var w = window.innerWidth;
    var h = window.innerHeight;
    
    var convert = function(val) {
      return rulersUnit === 'px' ? Math.round(val) + 'px' : (val/16).toFixed(2) + 'rem';
    };
    
    var xVal = convert(x);
    var yVal = convert(y);
    var wVal = convert(w);
    var hVal = convert(h);
    
    var rect = e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : null;
    
     var html = '━━━━━━━━━━━━\n';
     html += 'Viewport: ' + wVal + ' × ' + hVal + '\n';
     html += 'Cursor:  ' + xVal + ' , ' + yVal + '\n';
     
     if (rect && rect.width > 0 && rect.height > 0) {
       var elemW = convert(rect.width);
       var elemH = convert(rect.height);
       html += 'Element: ' + elemW + ' × ' + elemH + '\n';
       
       var distTop = convert(rect.top);
       var distLeft = convert(rect.left);
       var distRight = convert(w - (rect.left + rect.width));
       var distBottom = convert(h - (rect.top + rect.height));
       html += 'Edges:\n';
       html += '  T: ' + distTop + '\n';
       html += '  R: ' + distRight + '\n';
       html += '  B: ' + distBottom + '\n';
       html += '  L: ' + distLeft;
     }
    
    rulersTooltip.innerHTML = html;
    rulersTooltip.style.display = 'block';
    rulersTooltip.style.left = (x + 12) + 'px';
    rulersTooltip.style.top = (y + 12) + 'px';
    
    // Visual indicator for line orientation (cursor changes based on Shift key)
    if (rulersOverlay) {
      rulersOverlay.style.cursor = e.shiftKey ? 'row-resize' : 'col-resize';
    }
  }

    function onRulersClick(e) {
      if (!rulersActive) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      // Ignore if click originated from a ruler element
      if (e.target.dataset && e.target.dataset.rulerId) {
        return;
      }
      
      // Ignore click that immediately follows a drag (mouseup generates click event)
      if (justDragged) {
        justDragged = false;
        return;
      }
      
      var feedback = document.createElement('div');
     feedback.textContent = 'Marker placed' + (e.shiftKey ? ' (horizontal)' : ' (vertical)');
     feedback.style.cssText = 'position:fixed;background:#1e293b;color:#fff;padding:4px 8px;border-radius:4px;font-size:11px;font-family:monospace;pointer-events:none;z-index:2147483649;white-space:nowrap;opacity:0;transition:opacity 0.2s;';
     feedback.style.left = (e.clientX + 12) + 'px';
     feedback.style.top = (e.clientY + 12) + 'px';
     document.body.appendChild(feedback);
     
     setTimeout(function() { feedback.style.opacity = '1'; }, 10);
     setTimeout(function() {
       feedback.style.opacity = '0';
       setTimeout(function() {
         if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
       }, 200);
     }, 800);
     
      var isHorizontal = e.shiftKey;
      var guide = document.createElement('div');
      if (isHorizontal) {
        guide.style.cssText = 'position:fixed;left:0;width:100%;height:10px;top:' + (e.clientY - 5) + 'px;z-index:2147483647;cursor:row-resize;pointer-events:auto;' +
          'background:linear-gradient(to bottom, transparent 4.5px, #f59e0b 4.5px, #f59e0b 5.5px, transparent 5.5px);';
      } else {
        guide.style.cssText = 'position:fixed;top:0;height:100%;width:10px;left:' + (e.clientX - 5) + 'px;z-index:2147483647;cursor:col-resize;pointer-events:auto;' +
          'background:linear-gradient(to right, transparent 4.5px, #f59e0b 4.5px, #f59e0b 5.5px, transparent 5.5px);';
      }
     
     var id = nextRulerId++;
     guide.dataset.rulerId = id;

  var rulerObj = { id: id, type: isHorizontal ? 'horizontal' : 'vertical', position: isHorizontal ? e.clientY : e.clientX, element: guide };
  rulers.push(rulerObj);

  guide.addEventListener('mousedown', function(ev) { onRulerMouseDown(ev, rulerObj); });

  document.body.appendChild(guide);

  safeSendMessage({
    type: 'RULER_ADDED',
    payload: { id: id, type: rulerObj.type, position: rulerObj.position }
  });
}

function onRulersKeyDown(e) {
  if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
    rulers.forEach(function(r) {
      if (r.element.parentNode) r.element.parentNode.removeChild(r.element);
    });
    rulers = [];

    safeSendMessage({ type: 'RULERS_CLEARED' });

    if (DEBUG) console.log('Code Peek: All guides cleared');
  }
}

function onRulerMouseDown(e, ruler) {
     if (e.button !== 0) return;
     e.stopPropagation();
     e.preventDefault();
     dragRuler = ruler;
     dragStartX = e.clientX;
     dragStartY = e.clientY;
     dragStartPos = ruler.position;
     window.addEventListener('mousemove', onRulerMouseMove);
     window.addEventListener('mouseup', onRulerMouseUp);
   }

   function onRulerMouseMove(e) {
     if (!dragRuler) return;
     e.preventDefault();
     var dx = e.clientX - dragStartX;
     var dy = e.clientY - dragStartY;
     var newPos = dragRuler.type === 'vertical' ? dragStartPos + dx : dragStartPos + dy;
  var el = dragRuler.element;
  if (dragRuler.type === 'vertical') {
    el.style.left = newPos + 'px';
  } else {
    el.style.top = newPos + 'px';
  }
  dragRuler.position = newPos;
}

function onRulerMouseUp(e) {
  if (!dragRuler) return;
  // Mark that a drag just occurred to suppress the subsequent click event
  justDragged = true;
  safeSendMessage({
    type: 'RULER_UPDATED',
    payload: { id: dragRuler.id, position: dragRuler.position }
  });
  dragRuler = null;
      window.removeEventListener('mousemove', onRulerMouseMove);
      window.removeEventListener('mouseup', onRulerMouseUp);
    }

     // === MEASURE MODE ===
     var measureHighlights = []; // Store highlight elements for both selections

      function toggleMeasureMode(enable) {
        if (enable) {
          if (measureMode) return;
          measureMode = true;
          measureStartEl = null;
          clearMeasurementOverlay();
          clearMeasureHighlights();
          // Disable rulers overlay if active to avoid pointer events blocking clicks
          if (rulersActive) disableRulersOverlay();
          document.addEventListener('click', onMeasureClick, true);
          document.addEventListener('keydown', onMeasureKeyDown, true);
          if (DEBUG) console.log('Code Peek: Measure mode ACTIVE');
        } else {
          if (!measureMode) return;
          measureMode = false;
          document.removeEventListener('click', onMeasureClick, true);
          document.removeEventListener('keydown', onMeasureKeyDown, true);
          clearMeasurementOverlay();
          clearMeasureHighlights();
          measureStartEl = null;
          if (DEBUG) console.log('Code Peek: Measure mode INACTIVE');
        }
      }

      function onMeasureKeyDown(e) {
        if (!measureMode) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          // Cancel current selection, stay in measure mode
          clearMeasureHighlights();
          measureStartEl = null;
        }
      }

      function clearMeasurementOverlay() {
       if (measureOverlay && measureOverlay.parentNode) {
         measureOverlay.parentNode.removeChild(measureOverlay);
       }
       measureOverlay = null;
     }

     function clearMeasureHighlights() {
       measureHighlights.forEach(function(hl) {
         if (hl.parentNode) hl.parentNode.removeChild(hl);
       });
       measureHighlights = [];
     }

     function showHighlightFixed(el, color, opacity) {
       var rect = el.getBoundingClientRect();
       var highlight = document.createElement('div');
       highlight.style.cssText = 'position:fixed;top:' + rect.top + 'px;left:' + rect.left + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px;border:3px solid ' + color + ';background:' + rgbaString(color, 0.25) + ';pointer-events:none;z-index:2147483647;box-shadow:0 0 0 6px ' + color + '33;transition:opacity 0.2s;';
       document.body.appendChild(highlight);
       measureHighlights.push(highlight);
       // Keep until measurement completed or mode off
     }

     function rgbaString(color, opacity) {
       // Simple conversion for common colors; for production use a proper hex->rgba
       if (color === '#f59e0b') return 'rgba(245,158,11,' + opacity + ')';
       if (color === '#2563eb') return 'rgba(37,99,235,' + opacity + ')';
       return 'rgba(245,158,11,' + opacity + ')';
     }

      function computeRectDistance(r1, r2) {
        var dx = 0, dy = 0;
        var p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 };

        // Horizontal separation
        if (r1.right < r2.left) {
          dx = r2.left - r1.right;
          p1.x = r1.right;
          p2.x = r2.left;
        } else if (r2.right < r1.left) {
          dx = r1.left - r2.right;
          p1.x = r1.left;
          p2.x = r2.right;
        } else {
          dx = 0;
          var overlapLeft = Math.max(r1.left, r2.left);
          var overlapRight = Math.min(r1.right, r2.right);
          var midX = (overlapLeft + overlapRight) / 2;
          p1.x = midX;
          p2.x = midX;
        }

        // Vertical separation
        if (r1.bottom < r2.top) {
          dy = r2.top - r1.bottom;
          p1.y = r1.bottom;
          p2.y = r2.top;
        } else if (r2.bottom < r1.top) {
          dy = r1.top - r2.bottom;
          p1.y = r1.top;
          p2.y = r2.bottom;
        } else {
          dy = 0;
          var overlapTop = Math.max(r1.top, r2.top);
          var overlapBottom = Math.min(r1.bottom, r2.bottom);
          var midY = (overlapTop + overlapBottom) / 2;
          p1.y = midY;
          p2.y = midY;
        }

        var distance = Math.hypot(dx, dy);
        return { p1: p1, p2: p2, distance: distance };
      }

      function drawMeasurementLine(x1, y1, x2, y2, distance) {
        clearMeasurementOverlay();
        var length = Math.hypot(x2 - x1, y2 - y1);
        var angle = Math.atan2(y2 - y1, x2 - x1);
        var line = document.createElement('div');
        line.style.cssText = 'position:fixed;left:' + x1 + 'px;top:' + y1 + 'px;width:' + length + 'px;height:3px;background:linear-gradient(to right, #f59e0b, #f59e0b);pointer-events:none;z-index:2147483647;transform-origin:0 0;transform:rotate(' + angle + 'rad);box-shadow:0 1px 3px rgba(0,0,0,0.3);';
        var midX = (x1 + x2) / 2;
        var midY = (y1 + y2) / 2;
        var label = document.createElement('div');
        label.style.cssText = 'position:fixed;left:' + midX + 'px;top:' + (midY - 14) + 'px;transform:translate(-50%, -50%);background:rgba(30,41,59,0.95);color:#fff;padding:4px 8px;border-radius:6px;font-size:12px;font-family:monospace;white-space:nowrap;pointer-events:none;z-index:2147483647;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
        label.textContent = Math.round(distance) + 'px';
        measureOverlay = document.createElement('div');
        measureOverlay.appendChild(line);
        measureOverlay.appendChild(label);
        document.body.appendChild(measureOverlay);
      }

      function onMeasureClick(e) {
        if (!measureMode) return;
        e.stopPropagation();
        e.preventDefault();
        var el = e.target;
        if (el.id && el.id.indexOf('code-peek-') !== -1) return;
        if (!el || el === document.body) return;

        if (!measureStartEl) {
    measureStartEl = el;
    showHighlightFixed(el, '#f59e0b');
  } else {
    var endEl = el;
    var r1 = measureStartEl.getBoundingClientRect();
    var r2 = endEl.getBoundingClientRect();
    var result = computeRectDistance(r1, r2);
    // Highlight second element as well
    showHighlightFixed(endEl, '#f59e0b');
    drawMeasurementLine(result.p1.x, result.p1.y, result.p2.x, result.p2.y, result.distance);
    safeSendMessage({
      type: 'MEASUREMENT_COMPLETE',
      payload: { distance: Math.round(result.distance) }
    });
    // Reset start for next measurement while staying in measure mode
    measureStartEl = null;
  }
}

// === FLOATING PANEL ===
var floatingPanelEl = null;
var floatingIframe = null;
var floatingDragState = {
  isDragging: false,
  isResizing: false,
  resizeEdge: null,
  offsetX: 0,
  offsetY: 0,
  startWidth: 0,
  startHeight: 0,
  startLeft: 0,
  startTop: 0
};

function createFloatingPanel(config) {
  if (floatingPanelEl) {
    if (DEBUG) console.log('[Code Peek] Floating panel already exists');
    return;
  }

  if (DEBUG) console.log('[Code Peek] Creating floating panel with config:', config);

  var top = config.position ? config.position.top : 16;
  var right = config.position ? config.position.right : 16;
  var width = config.size ? config.size.width : 400;
  var height = config.size ? config.size.height : 500;

  // Save floating panel state to storage
  safeSendMessage({
    type: 'SAVE_FLOATING_STATE',
    payload: {
      active: true,
      position: { top: top, right: right },
      size: { width: width, height: height }
    }
  });

  // Create panel container
  var panel = document.createElement('div');
  panel.id = 'code-peek-floating-panel';
  panel.style.cssText = 'position:fixed;top:' + top + 'px;right:' + right + 'px;width:' + width + 'px;height:' + height + 'px;z-index:2147483647;display:flex;flex-direction:column;background:#000;border:1px solid #222;border-radius:8px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.5);';

  // Create header for dragging
  var header = document.createElement('div');
  header.id = 'cp-floating-header';
  header.style.cssText = 'flex-shrink:0;height:48px;background:#000;border-bottom:1px solid #222;display:flex;align-items:center;justify-content:space-between;padding:0 12px;cursor:move;user-select:none;';
  header.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><span style="font-family:\'Space Mono\',monospace;font-size:12px;font-weight:700;color:#fff;letter-spacing:-0.5px;">CODE PEEK</span></div><div style="display:flex;gap:4px;"><button id="cp-float-close" title="Close" style="background:transparent;border:none;color:#999;cursor:pointer;padding:6px;border-radius:4px;display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg></button></div>';

  panel.appendChild(header);

// Create iframe to load sidepanel content
  var iframe = document.createElement('iframe');
  iframe.id = 'cp-floating-iframe';
  iframe.style.cssText = 'flex:1;border:none;width:100%;height:100%;background:#000;';

  // Load the sidepanel HTML
  // File is at src/sidepanel/index.html
  // Pass floating mode via postMessage instead of query string
  iframe.src = chrome.runtime.getURL('src/sidepanel/index.html');

  panel.appendChild(iframe);

  // Create edge resize handles (full sides, invisible, cursor indicates resize)
  // Right edge (full height, excluding header for better UX)
  var edgeRight = document.createElement('div');
  edgeRight.className = 'cp-float-resize-edge';
  edgeRight.dataset.edge = 'right';
  edgeRight.dataset.corner = 'bottom-right';
  edgeRight.style.cssText = 'position:absolute;right:0;top:48px;bottom:0;width:6px;cursor:ew-resize;z-index:10;';
  panel.appendChild(edgeRight);

  // Bottom edge (full width)
  var edgeBottom = document.createElement('div');
  edgeBottom.className = 'cp-float-resize-edge';
  edgeBottom.dataset.edge = 'bottom';
  edgeBottom.dataset.corner = 'bottom-right';
  edgeBottom.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:6px;cursor:ns-resize;z-index:10;';
  panel.appendChild(edgeBottom);

  // Left edge (full height, excluding header for better UX)
  var edgeLeft = document.createElement('div');
  edgeLeft.className = 'cp-float-resize-edge';
  edgeLeft.dataset.edge = 'left';
  edgeLeft.dataset.corner = 'bottom-left';
  edgeLeft.style.cssText = 'position:absolute;left:0;top:48px;bottom:0;width:6px;cursor:ew-resize;z-index:10;';
  panel.appendChild(edgeLeft);

  // Top edge (full width excluding header drag area - header handles top drag)
  var edgeTop = document.createElement('div');
  edgeTop.className = 'cp-float-resize-edge';
  edgeTop.dataset.edge = 'top';
  edgeTop.style.cssText = 'position:absolute;top:0;left:0;right:0;height:6px;cursor:ns-resize;z-index:10;';
  panel.appendChild(edgeTop);

  // Add hover styles via CSS injection
  var resizeStyle = document.createElement('style');
  resizeStyle.textContent = '.cp-float-resize:hover svg{opacity:0.7!important;}';
  document.head.appendChild(resizeStyle);

  document.body.appendChild(panel);
  floatingPanelEl = panel;
  floatingIframe = iframe;

  // Drag events on header
  header.addEventListener('mousedown', function(e) {
    if (e.target.closest('button')) return;
    floatingDragState.isDragging = true;
    floatingDragState.offsetX = e.clientX - panel.offsetLeft;
    floatingDragState.offsetY = e.clientY - panel.offsetTop;
    e.preventDefault();
  });

  // Resize events for edges
  var edgeHandles = panel.querySelectorAll('.cp-float-resize-edge');
  edgeHandles.forEach(function(handle) {
    handle.addEventListener('mousedown', function(e) {
      floatingDragState.isResizing = true;
      floatingDragState.resizeEdge = handle.dataset.edge;
      floatingDragState.startWidth = panel.offsetWidth;
      floatingDragState.startHeight = panel.offsetHeight;
      floatingDragState.startLeft = panel.offsetLeft;
      floatingDragState.startTop = panel.offsetTop;
      e.preventDefault();
    });
  });

  // Button events
  document.getElementById('cp-float-close').addEventListener('click', function() {
    destroyFloatingPanel();
  });

  document.addEventListener('mousemove', onFloatingMouseMove);
  document.addEventListener('mouseup', onFloatingMouseUp);
}

function showReturnToSidebarToast() {
  // Check if toast already exists
  if (document.getElementById('cp-sidebar-toast')) return;
  
  var toast = document.createElement('div');
  toast.id = 'cp-sidebar-toast';
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1f2937;color:#fff;padding:12px 20px;border-radius:8px;font-family:system-ui,sans-serif;font-size:14px;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:slideIn 0.3s ease;';
  toast.innerHTML = 'Click the <strong>Code Peek</strong> extension icon to reopen the sidebar';
  
  // Add animation keyframes
  var style = document.createElement('style');
  style.textContent = '@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
  document.head.appendChild(style);
  
  document.body.appendChild(toast);
  
  // Auto-remove after 5 seconds
  setTimeout(function() {
    if (toast.parentNode) {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(function() { toast.remove(); }, 300);
    }
  }, 5000);
}

function onFloatingMouseMove(e) {
  if (!floatingPanelEl) return;

  if (floatingDragState.isDragging) {
    var newLeft = e.clientX - floatingDragState.offsetX;
    var newTop = e.clientY - floatingDragState.offsetY;

    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - floatingPanelEl.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - floatingPanelEl.offsetHeight));

    floatingPanelEl.style.left = newLeft + 'px';
    floatingPanelEl.style.top = newTop + 'px';
    floatingPanelEl.style.right = 'auto';
  }

if (floatingDragState.isResizing) {
    var rect = floatingPanelEl.getBoundingClientRect();

    // Edge resizing
    if (floatingDragState.resizeEdge === 'right') {
      var newWidth = Math.max(320, Math.min(e.clientX - rect.left, 800));
      floatingPanelEl.style.width = newWidth + 'px';
    } else if (floatingDragState.resizeEdge === 'bottom') {
      var newHeight = Math.max(400, Math.min(e.clientY - rect.top, window.innerHeight * 0.9));
      floatingPanelEl.style.height = newHeight + 'px';
    } else if (floatingDragState.resizeEdge === 'left') {
      var newWidth = Math.max(320, Math.min(rect.right - e.clientX, 800));
      var newLeft = rect.right - newWidth;
      floatingPanelEl.style.width = newWidth + 'px';
      floatingPanelEl.style.left = newLeft + 'px';
      floatingPanelEl.style.right = 'auto';
    } else if (floatingDragState.resizeEdge === 'top') {
      var newHeight = Math.max(400, Math.min(rect.bottom - e.clientY, window.innerHeight * 0.9));
      var newTop = rect.bottom - newHeight;
      floatingPanelEl.style.height = newHeight + 'px';
      floatingPanelEl.style.top = newTop + 'px';
    }
  }
}

function onFloatingMouseUp(e) {
  floatingDragState.isDragging = false;
  floatingDragState.isResizing = false;
  floatingDragState.resizeEdge = null;
}

function destroyFloatingPanel() {
  if (floatingPanelEl) {
    floatingPanelEl.remove();
    floatingPanelEl = null;
    floatingIframe = null;
  }
  document.removeEventListener('mousemove', onFloatingMouseMove);
  document.removeEventListener('mouseup', onFloatingMouseUp);
  
  // Clear floating panel state from storage
  safeSendMessage({ type: 'CLEAR_FLOATING_STATE' });
}

// Handle postMessage from iframe (e.g., RETURN_TO_SIDEBAR)
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'RETURN_TO_SIDEBAR') {
    if (DEBUG) console.log('[Code Peek] RETURN_TO_SIDEBAR message received');
    destroyFloatingPanel();
  }
});

// Restore floating panel if it was active before navigation
function restoreFloatingPanelIfActive() {
  if (floatingPanelEl) return; // Already exists
  
  safeSendMessage({ type: 'GET_FLOATING_STATE' }, function(response) {
    if (response && response.success && response.data && response.data.active) {
      if (DEBUG) console.log('[Code Peek] Restoring floating panel');
      createFloatingPanel({
        position: response.data.position || { top: 16, right: 16 },
        size: response.data.size || { width: 400, height: 500 }
      });
    }
  });
}

// Try to restore after a short delay (let page settle)
setTimeout(restoreFloatingPanelIfActive, 100);

if (DEBUG) console.log("Code Peek content script ready");
})();
