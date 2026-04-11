// OG Preview image error handler utility
function handleOgImageError(img) {
  img.style.display = 'none';
  var parent = img.parentElement;
  if (parent) {
    var placeholder = document.createElement('div');
    placeholder.className = 'og-image-placeholder';
    placeholder.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: var(--caption); color: var(--text-secondary);';
    placeholder.textContent = 'IMAGE UNAVAILABLE';
    parent.appendChild(placeholder);
  }
}

// Overview Tab - Nothing Design System
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  var k = 1024;
  var sizes = ["B", "KB", "MB"];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

var overviewTab = {
load: function () {
var self = this;
var container = document.getElementById("tab-overview");
if (container) {
container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><div class="loading-label">SCANNING</div><div class="loading-hint">Analyzing page design system...</div></div>';
}

    messaging.extractAll(function (response) {
      if (response && response.success && response.data) {
        self.renderStats(response.data);
      } else {
        self.renderError();
      }
    });
  },

  renderStats: function (data) {
    var self = this;
    var container = document.getElementById("tab-overview");
    if (!container) return;

    console.log('[DEBUG] renderStats received data:', JSON.stringify(data, null, 2));

    if (!data) {
      container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><div class="loading-label">LOADING</div></div>';
      return;
    }

var html = '<div class="tab-content">';

  // First-time onboarding tip - guides users to most relevant action
  var hasSeenOnboarding = localStorage.getItem('codepeek_onboarding_seen');
  if (!hasSeenOnboarding) {
    html += '<div class="onboarding-tip" id="onboarding-tip">';
    html += '<div class="onboarding-content">';
    html += '<div class="onboarding-icon">✦</div>';
    html += '<div class="onboarding-text">';
      html += '<strong>QUICK START</strong><br>';
      html += 'Use the <span class="accent-text">inspect</span> tool to analyze specific elements, or browse tabs below.';
      html += '<div class="onboarding-shortcuts">';
      html += '<span class="onboarding-shortcut-item"><kbd>C</kbd> Colors</span>';
      html += '<span class="onboarding-shortcut-item"><kbd>T</kbd> Type</span>';
      html += '<span><kbd>A</kbd> Assets</span>';
      html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '<button class="onboarding-dismiss" id="dismiss-onboarding" aria-label="Dismiss">✕</button>';
    html += '</div>';
  }

  // Page Header - Tab Title
  html += '<div class="page-header">';
  html += '<div class="page-title">OVERVIEW</div>';
  html += '<div class="page-subtitle">Page Analysis</div>';
  html += '</div>';

  // Page Info (secondary info)
  html += '<div class="overview-page-info">';
  html += '<div class="overview-page-title">' + self.escapeHtml(data.title || "UNTITLED") + '</div>';
  html += '<div class="overview-page-host">' + self.escapeHtml(data.host || "unknown-host") + '</div>';
  html += '</div>';

 // OG Preview (if available) - moved before typography
 var hasOgData = data.meta && data.meta.og && (data.meta.og.title || data.meta.og.description || data.meta.og.image);
 if (hasOgData) {
 var og = data.meta.og || {};
 var ogImage = og.image || '';
 html += '<div class="stat-section">';
 html += '<div class="section-label">OG PREVIEW</div>';
 html += '<div class="og-preview-trigger" id="og-preview-trigger">';
 if (ogImage) {
 html += '<div class="og-image-container">';
 html += '<img src="' + self.escapeHtml(ogImage) + '" alt="OG Preview" loading="lazy" class="og-preview-img">';
 html += '<div class="og-overlay-text">CLICK FOR DETAILS</div>';
 html += '</div>';
 } else {
 html += '<div class="og-preview-card">';
 html += '<div class="og-preview-card-text text-secondary">NO OG IMAGE</div>';
 html += '<div class="og-preview-card-text-primary text-primary">CLICK FOR DETAILS</div>';
 html += '</div>';
 }
 html += '</div>';
 html += '</div>';
 }

 // Typography Stats (Secondary Layer)
    var fonts = data.typography || [];
    var headings = fonts.length > 0 ? fonts[0].family.split(",")[0].replace(/['"]/g, "") : "Not detected";
    var body = fonts.length > 1 ? fonts[1].family.split(",")[0].replace(/['"]/g, "") : headings;

    html += '<div class="stat-section">';
    html += '<div class="section-label">TYPOGRAPHY</div>';
    html += '<div class="stat-grid">';
    html += '<div class="stat-row"><span class="stat-label">HEADINGS</span><span class="stat-value">' + self.escapeHtml(headings) + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">BODY</span><span class="stat-value">' + self.escapeHtml(body) + '</span></div>';
    html += '</div>';
    html += '</div>';

    // Color Palette (Tertiary Layer)
    var colors = data.colors || [];
    html += '<div class="stat-section">';
    html += '<div class="section-label">COLORS</div>';
    html += '<div class="color-grid">';
    for (var m = 0; m < Math.min(colors.length, 12); m++) {
      html += '<div class="color-swatch" style="background-color:' + colors[m].color + '" title="' + colors[m].color + '"></div>';
    }
    if (colors.length === 0) {
      html += '<div class="empty-label">NO COLORS DETECTED</div>';
    }
html += '</div>';
html += '<button class="link-btn" id="overview-show-colors">SHOW ALL →</button>';
html += '</div>';

// Contrast Issues
var issueCount = (data.contrastIssues || []).length;
html += '<div class="stat-section">';
html += '<div class="section-label">CONTRAST</div>';
if (issueCount > 0) {
var worst = data.contrastIssues[0];
html += '<div class="contrast-hero">';
html += '<div class="contrast-ratio">' + worst.ratio.toFixed(2) + '</div>';
html += '<div class="contrast-unit">RATIO</div>';
html += '</div>';
html += '<div class="contrast-issues">';
for (var x = 0; x < Math.min(issueCount, 3); x++) {
var issue = data.contrastIssues[x];
html += '<div class="contrast-item" data-selector="' + self.escapeHtml(issue.selector) + '" data-tag="' + self.escapeHtml(issue.tag) + '">';
html += '<span class="contrast-selector">' + self.escapeHtml(issue.selector) + '</span>';
html += '<span class="contrast-value failing">' + issue.ratio.toFixed(2) + '</span>';
html += '</div>';
}
html += '<button class="link-btn" id="toggle-contrast-details">SEE ALL →</button>';
html += '</div>';
html += '<div id="contrast-details-list" class="contrast-details hidden">';
for (var y = 0; y < data.contrastIssues.length; y++) {
var issue = data.contrastIssues[y];
html += '<div class="contrast-detail-item" data-selector="' + self.escapeHtml(issue.selector) + '" data-tag="' + self.escapeHtml(issue.tag) + '">';
html += '<div class="contrast-detail-row">';
html += '<span class="contrast-detail-selector">' + self.escapeHtml(issue.selector) + '</span>';
html += '<div class="contrast-badges">';
html += '<span class="badge ' + (issue.aa ? "pass" : "fail") + '">AA</span>';
html += '<span class="badge ' + (issue.aaa ? "pass" : "fail") + '">AAA</span>';
html += '<span class="contrast-ratio-badge">' + issue.ratio.toFixed(2) + '</span>';
html += '</div>';
html += '</div>';
                html += '<div class="contrast-colors">';
                  html += '<div class="contrast-color-preview" style="background-color:' + issue.fg + '" aria-label="Foreground color"></div>';
                  html += '<span class="contrast-color-code">' + issue.fg + '</span>';
                  html += '<span class="contrast-on">on</span>';
                  html += '<div class="contrast-color-preview" style="background-color:' + issue.bg + '" aria-label="Background color"></div>';
                  html += '<span class="contrast-color-code">' + issue.bg + '</span>';
                  html += '</div>';
 html += '</div>';
 }
 html += '</div>';
 } else {
 html += '<div class="contrast-pass">';
 html += '<div class="contrast-pass-icon">✓</div>';
 html += '<div class="contrast-pass-text">ALL PASSING</div>';
 html += '</div>';
 }
 html += '</div>';

    // CSS Metrics
    var stats = [
      { label: "STYLESHEETS", value: data.stylesheets || 0 },
      { label: "CSS RULES", value: data.rules || 0 },
      { label: "CSS SIZE", value: formatBytes(data.size || 0) },
      { label: "LOAD TIME", value: (data.loadTime || 0) + "ms" },
    ];

    html += '<div class="stat-section">';
    html += '<div class="section-label">CSS METRICS</div>';
    html += '<div class="metrics-grid">';
    for (var n = 0; n < stats.length; n++) {
      html += '<div class="metric-item">';
      html += '<div class="metric-value">' + stats[n].value + '</div>';
      html += '<div class="metric-label">' + stats[n].label + '</div>';
      html += '</div>';
    }
 html += '</div>';
 html += '</div>';

 html += '</div>';

 container.innerHTML = html;

    // OG Preview Modal trigger
    var ogTrigger = document.getElementById("og-preview-trigger");
    if (ogTrigger) {
      ogTrigger.onclick = function () {
        if (typeof ogPreviewModal !== "undefined" && ogPreviewModal.open) {
          ogPreviewModal.open(data);
        }
      };
    }

    // OG image error handling
    var ogImages = document.querySelectorAll(".og-preview-img");
    for (var ogi = 0; ogi < ogImages.length; ogi++) {
      ogImages[ogi].onerror = function() {
        this.style.display = 'none';
        var container = this.closest(".og-image-container");
        if (container) {
          var placeholder = document.createElement("div");
          placeholder.className = "og-image-placeholder";
          placeholder.style.cssText = "width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: var(--caption); color: var(--text-secondary);";
          placeholder.textContent = "IMAGE UNAVAILABLE";
          container.appendChild(placeholder);
        }
      };
    }

// Contrast details toggle
var contrastToggle = document.getElementById("toggle-contrast-details");
var contrastDetails = document.getElementById("contrast-details-list");
if (contrastToggle && contrastDetails) {
contrastToggle.onclick = function () {
contrastDetails.classList.toggle("hidden");
this.textContent = contrastDetails.classList.contains("hidden") ? "SEE ALL →" : "HIDE ↑";
};
}

// Contrast item hover highlighting
var contrastItems = document.querySelectorAll(".contrast-item, .contrast-detail-item");
for (var ci = 0; ci < contrastItems.length; ci++) {
contrastItems[ci].addEventListener("mouseenter", function() {
var selector = this.getAttribute("data-selector");
var tag = this.getAttribute("data-tag");
if (selector && typeof chrome !== "undefined" && chrome.tabs) {
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
if (tabs[0]) {
chrome.tabs.sendMessage(tabs[0].id, {
type: "HIGHLIGHT_ELEMENT",
selector: selector,
tag: tag
});
}
});
}
});
contrastItems[ci].addEventListener("mouseleave", function() {
if (typeof chrome !== "undefined" && chrome.tabs) {
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
if (tabs[0]) {
chrome.tabs.sendMessage(tabs[0].id, { type: "CLEAR_HIGHLIGHT" });
}
});
}
});
}

// Show all colors
var showColorsBtn = document.getElementById("overview-show-colors");
if (showColorsBtn && typeof CodePeekApp !== "undefined") {
showColorsBtn.onclick = function () {
CodePeekApp.switchTab("colors");
};
}

// Onboarding dismiss
var onboardingTip = document.getElementById("onboarding-tip");
var dismissBtn = document.getElementById("dismiss-onboarding");
if (dismissBtn && onboardingTip) {
dismissBtn.onclick = function () {
localStorage.setItem('codepeek_onboarding_seen', 'true');
onboardingTip.style.display = 'none';
};
}
},

  renderError: function (msg) {
    var container = document.getElementById("tab-overview");
    if (container) {
      var errorMsg = msg ? '<div class="error-message">' + this.escapeHtml(msg) + '</div>' : '';
      container.innerHTML =
        '<div class="error-state">' +
        '<div class="error-title">FAILED TO LOAD</div>' +
        errorMsg +
        '<button class="retry-btn" id="retry-load">RETRY</button>' +
        "</div>";
    }
    var retryBtn = document.getElementById("retry-load");
    if (retryBtn) {
      retryBtn.onclick = function () {
        if (typeof CodePeekApp !== "undefined" && CodePeekApp.refreshData) {
          CodePeekApp.refreshData();
        }
      };
    }
  },

  escapeHtml: function (str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  getOgPreviewCards: function (data) {
    var meta = (data && data.meta) || {};
    var og = meta.og || {};
    var twitter = meta.twitter || {};
    var fallbackTitle = og.title || twitter.title || meta.title || meta.pageTitle || data.title || "Untitled page";
    var fallbackDescription = og.description || twitter.description || meta.description || meta.pageDescription || "No description available";
    var fallbackImage = og.image || twitter.image || meta.image || "";
    var fallbackUrl = og.url || meta.canonical || meta.url || "";

    return [
      {
        size: "1200×630",
        ratioClass: "aspect-[1.91/1]",
        platforms: [
          { name: "Facebook", accent: "bg-[#1877F2] text-white", badge: "f" },
          { name: "Discord", accent: "bg-[#5865F2] text-white", badge: "D" },
          { name: "Slack", accent: "bg-[#4A154B] text-white", badge: "S" },
          { name: "WhatsApp", accent: "bg-[#25D366] text-white", badge: "W" },
          { name: "Pinterest", accent: "bg-[#E60023] text-white", badge: "P" },
        ],
        title: og.title || fallbackTitle,
        description: og.description || fallbackDescription,
        image: og.image || fallbackImage,
        url: og.url || fallbackUrl,
      },
      {
        size: "1200×627",
        ratioClass: "aspect-[1.91/1]",
        platforms: [{ name: "LinkedIn", accent: "bg-[#0A66C2] text-white", badge: "in" }],
        title: og.title || twitter.title || fallbackTitle,
        description: og.description || twitter.description || fallbackDescription,
        image: og.image || twitter.image || fallbackImage,
        url: og.url || meta.canonical || fallbackUrl,
      },
      {
        size: "1200×600",
        ratioClass: "aspect-[2/1]",
        platforms: [{ name: "Twitter/X", badge: "X" }],
        title: twitter.title || og.title || fallbackTitle,
        description: twitter.description || og.description || fallbackDescription,
        image: twitter.image || og.image || fallbackImage,
        url: meta.canonical || og.url || fallbackUrl,
      },
    ];
  },

  getPreviewPlatformNames: function (platforms) {
    var names = [];
    if (!platforms || !platforms.length) return "";
    for (var i = 0; i < platforms.length; i++) {
      names.push(platforms[i].name || "Unknown");
    }
    return names.join(", ");
  },
};
