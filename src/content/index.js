// Content Script - Plain ES5, no transpilation
(function () {
  "use strict";

  console.log("Code Peek content script starting...");

  // Global error handler – prevents crashes from breaking everything
  window.onerror = function (msg, url, line) {
    console.error("Code Peek Global Error:", msg, "at", url + ":" + line);
    return true; // suppress default
  };

  // Page unload detection – notify side panel that context is going away
  window.addEventListener("beforeunload", function () {
    console.log("Code Peek: Page unloading");
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({ type: "PAGE_UNLOADED" });
      } catch (e) {}
    }
  });

  // === INSPECT MODE ===
  var inspectActive = false;
  var highlightEl = null;
  var infoEl = null;
  var lastHoverLog = 0;

  function startInspectMode() {
    if (inspectActive) {
      console.log("Code Peek: startInspectMode called but already active");
      return;
    }
    inspectActive = true;
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("click", onClick, true);
    document.body.classList.add("code-peek-inspecting");
    console.log("Code Peek: Inspect mode ACTIVE");
  }

  function stopInspectMode() {
    if (!inspectActive) {
      console.log("Code Peek: stopInspectMode called but already inactive");
      return;
    }
    inspectActive = false;
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("click", onClick, true);
    removeHighlight();
    document.body.classList.remove("code-peek-inspecting");
    console.log("Code Peek: Inspect mode INACTIVE");
  }

  function onMouseMove(e) {
    if (!inspectActive) return;
    // Throttle log to once per second
    var now = Date.now();
    if (now - (window.lastHoverLogTime || 0) > 1000) {
      console.log(
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
    if (!inspectActive) {
      console.log("Code Peek: onClick ignored (inspectActive false)");
      return;
    }
    try {
      e.preventDefault();
      e.stopPropagation();
      if (e.target === document.body || e.target === document.documentElement)
        return;

      var target = e.target;
      // Handle transparency/inner elements by picking the topmost meaningful element if needed
      // (Standard behavior for now is just the target)

      console.log("Code Peek: clicking on", target.tagName.toLowerCase());
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
      "px;border:2px solid #3b82f6;background:rgba(59,130,246,0.15);pointer-events:none;z-index:999999;";
    document.body.appendChild(highlightEl);

    // Info tooltip with dimensions
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
      "px;background:#1f2937;color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;font-family:monospace;pointer-events:none;z-index:1000000;white-space:nowrap;";
    document.body.appendChild(infoEl);
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
  }

  function inspectElement(el) {
    var selector = getSelector(el);
    var style = window.getComputedStyle(el);
    var rect = el.getBoundingClientRect();

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
        backgroundColor: style.backgroundColor,
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
    };

    // Send data to side panel with robust retry to handle transient errors
    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.sendMessage
    ) {
      var maxAttempts = 4;
      var attempt = 0;
      var delay = 100;
      function sendData() {
        attempt++;
        try {
          chrome.runtime.sendMessage({
            type: "ELEMENT_INSPECTED",
            payload: data,
          });
          console.log("Code Peek: Data sent for", el.tagName);
        } catch (err) {
          console.error("Code Peek: sendMessage failed (attempt " + attempt + "):", err);
          if (attempt < maxAttempts) {
            setTimeout(sendData, delay);
            delay *= 2; // exponential backoff
          } else {
            console.error("Code Peek: All retries exhausted. Extension may need to be reloaded.");
            // Could show a notification/in-app message here if API available
          }
        }
      }
      sendData();
    } else {
      console.warn("Code Peek: chrome.runtime.sendMessage not available");
    }

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
        return filename.substring(dot + 1).toLowerCase();
      }
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

  function extractPageStats() {
    var stats = {
      title: document.title,
      host: window.location.host,
      stylesheets: 0,
      rules: 0,
      size: 0,
      loadTime: 0,
      stylesheetsList: [],
      contrastIssues: [],
    };

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
      var maxSheetsProcessing = Math.min(sheets.length, 15);
      for (var i = 0; i < maxSheetsProcessing; i++) {
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
    return stats;
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

    // Limit to first 50 images to prevent hang
    var images = document.querySelectorAll("img[src]");
    var imgCount = 0;
    var maxImages = 50;
    for (var i = 0; i < images.length && imgCount < maxImages; i++) {
      var img = images[i];
      var src = img.src;
      if (src && isValidAssetUrl(src)) {
        var w = img.width || img.offsetWidth || 0;
        var h = img.height || img.offsetHeight || 0;
        if (w > 0 && h > 0) {
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
        if (asset.width >= 8 && asset.height >= 8) {
          filtered.push(asset);
        }
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

    for (var i = 0; i < elements.length && contrastCount < maxContrast; i++) {
      var el = elements[i];
      try {
        var style = window.getComputedStyle(el);
        var fg = style.color;
        var bg = style.backgroundColor;

        // If background is transparent, try to get parent background
        var parent = el.parentElement;
        while (bg === "transparent" || (bg === "rgba(0, 0, 0, 0)" && parent)) {
          bg = window.getComputedStyle(parent).backgroundColor;
          parent = parent.parentElement;
        }

        if (fg && bg && fg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
          var ratio = calculateContrastRatio(fg, bg);
          if (ratio < 4.5) {
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
              selector: getSimpleSelector(el),
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
    if (!c1 || !c2) return 1;
    var l1 = getLuminance(c1.r, c1.g, c1.b);
    var l2 = getLuminance(c2.r, c2.g, c2.b);
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function parseColor(str) {
    if (!str || str === "transparent" || str === "rgba(0, 0, 0, 0)")
      return null;

    // Create a singleton dummy element for color normalization if it doesn't exist
    if (!window._codePeekParser) {
      var div = document.createElement("div");
      div.id = "code-peek-color-parser";
      div.style.cssText =
        "display:none !important; visibility:hidden !important; position:fixed !important; top:-9999px !important;";
      document.documentElement.appendChild(div);
      window._codePeekParser = div;
    }

    try {
      window._codePeekParser.style.color = "rgb(0,0,0)"; // Baseline reset
      window._codePeekParser.style.color = str;
      var computed = window.getComputedStyle(window._codePeekParser).color;

      // Browser returns color in rgb() or rgba() format after normalization
      var m = computed.match(
        /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d?\.\d+|\d+))?\)/,
      );
      if (m) {
        return {
          r: parseInt(m[1]),
          g: parseInt(m[2]),
          b: parseInt(m[3]),
          a: m[4] !== undefined ? parseFloat(m[4]) : 1,
        };
      }
    } catch (e) {
      console.warn("Code Peek: Color normalization failed", str);
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

   if (
     typeof chrome !== "undefined" &&
     chrome.runtime &&
     chrome.runtime.onMessage
   ) {
     chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
       console.log("Content received:", msg.type);
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
            }, 150); // Give time for rendering
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
          default:
            sendResponse({ success: false, error: "Unknown type" });
        }
      } catch (e) {
        console.error("Content script error:", e);
        sendResponse({ success: false, error: e.message });
      }
      return true;
    });
  }

  // Extract Open Graph, Twitter Card, and other meta tags
  function extractMetaTags() {
    var meta = {
      title: document.title,
      description: "",
      image: "",
      url: window.location.href,
      favicon: "",
      og: {},
      twitter: {},
      canonical: ""
    };

    // Get meta description
    var descEl = document.querySelector('meta[name="description"]');
    if (descEl) meta.description = descEl.getAttribute("content") || "";

    // Get canonical URL
    var canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) meta.canonical = canonicalEl.getAttribute("href") || "";

    // Get favicon
    var faviconEl = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    if (faviconEl) meta.favicon = faviconEl.getAttribute("href") || "";

    // Open Graph tags
    var ogTags = document.querySelectorAll('meta[property^="og:"]');
    for (var i = 0; i < ogTags.length; i++) {
      var prop = ogTags[i].getAttribute("property");
      var content = ogTags[i].getAttribute("content") || "";
      if (prop) {
        var key = prop.replace(/^og:/, "").toLowerCase();
        meta.og[key] = content;
      }
    }

    // Twitter Card tags
    var twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
    for (var j = 0; j < twitterTags.length; j++) {
      var name = twitterTags[j].getAttribute("name");
      var content = twitterTags[j].getAttribute("content") || "";
      if (name) {
        var key = name.replace(/^twitter:/, "").toLowerCase();
        meta.twitter[key] = content;
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

  console.log("Code Peek content script ready");
})();
