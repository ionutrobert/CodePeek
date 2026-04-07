var reportGenerator = (function () {
  function ensureArray(value) {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.slice();
    }
    return [value];
  }

  function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeTechStack(source) {
    var items = [];
    var keys;
    var ki;
    var key;
    var list;
    var li;
    if (!source) {
      return items;
    }

    if (Array.isArray(source)) {
      items = source.slice();
    } else if (isObject(source)) {
      keys = ['frameworks', 'css', 'build', 'plugins', 'cms', 'technologies'];
      for (ki = 0; ki < keys.length; ki++) {
        key = keys[ki];
        list = ensureArray(source[key]);
        for (li = 0; li < list.length; li++) {
          items.push(list[li]);
        }
      }
    } else if (typeof source === 'string') {
      items.push(source);
    }

    if (!items.length && source && source.name) {
      items.push(source.name);
    }

    return items;
  }

  function normalizeColors(colors) {
    var list = ensureArray(colors);
    var normalized = [];
    var i;
    var entry;
    var value;
    var name;
    for (i = 0; i < list.length; i++) {
      entry = list[i];
      if (!entry) {
        continue;
      }
      value = null;
      name = null;
      if (typeof entry === 'string') {
        value = entry;
      } else if (entry.hex || entry.value || entry.color) {
        value = entry.hex || entry.value || entry.color;
        name = entry.name;
      }
      if (value) {
        normalized.push({
          name: name || 'Color ' + (i + 1),
          value: value
        });
      }
    }
    return normalized;
  }

  function normalizeTypography(typography) {
    var list = ensureArray(typography);
    var normalized = [];
    var i;
    var entry;
    var name;
    var stack;
    var sample;
    var variants;
    var variant;
    var descriptor;
    for (i = 0; i < list.length; i++) {
      if (normalized.length >= 8) {
        break;
      }
      entry = list[i];
      if (!entry) {
        continue;
      }
      name = entry.label || entry.name || entry.family || 'Font ' + (i + 1);
      stack = entry.stack || entry.family || entry.value || '';
      sample = 'The quick brown fox jumps over the lazy dog';
      variants = entry.variants || [];
      if (variants.length) {
        variant = variants[0];
        if (variant.tag) {
          sample = variant.tag;
        }
        descriptor = [];
        if (variant.size) {
          descriptor.push('size ' + variant.size);
        }
        if (variant.weight) {
          descriptor.push('weight ' + variant.weight);
        }
        if (descriptor.length) {
          sample += ' (' + descriptor.join(', ') + ')';
        }
      }
      normalized.push({
        label: name,
        stack: stack,
        sample: sample
      });
    }
    return normalized;
  }

  function buildAccessibilityIssues(data) {
    var issues = [];
    var contrast = ensureArray(data && data.contrastIssues);
    var ci;
    var issue;
    var ratio;
    var selector;
    var altText = data && data.altText;
    var missing = altText && ensureArray(altText.missing);
    var empty = altText && ensureArray(altText.empty);
    var mi;
    var missingItem;
    var target;
    var ei;
    var emptyItem;
    var emptyTarget;
    var headings = data && data.headings;
    var counts = headings && headings.counts;
    for (ci = 0; ci < contrast.length; ci++) {
      issue = contrast[ci];
      ratio = issue && issue.ratio ? ' ratio ' + issue.ratio.toFixed(2) : '';
      selector = issue && issue.selector ? issue.selector : 'Unknown element';
      issues.push('Contrast issue on ' + selector + ratio);
    }

    for (mi = 0; mi < (missing || []).length; mi++) {
      missingItem = missing[mi];
      target = (missingItem && missingItem.selector) || (missingItem && missingItem.src) || 'Image';
      issues.push('Missing alt text: ' + target);
    }
    for (ei = 0; ei < (empty || []).length; ei++) {
      emptyItem = empty[ei];
      emptyTarget = (emptyItem && emptyItem.selector) || (emptyItem && emptyItem.src) || 'Image';
      issues.push('Empty alt text: ' + emptyTarget);
    }

    if (counts && counts.h1 > 1) {
      issues.push('Multiple H1 headings detected: ' + counts.h1);
    }
    return issues;
  }

  function buildAccessibilitySummary(data, issues) {
    var parts = [];
    var contrastCount = ensureArray(data && data.contrastIssues).length;
    if (contrastCount) {
      parts.push('Contrast issues: ' + contrastCount);
    }
    var missingAlt = (data && data.altText && ensureArray(data.altText.missing).length) || 0;
    if (missingAlt) {
      parts.push('Missing alt text: ' + missingAlt);
    }
    if (!parts.length && !issues.length) {
      return 'No obvious accessibility issues detected.';
    }
    if (!parts.length && issues.length) {
      return issues.length + ' potential accessibility issues flagged.';
    }
    return parts.join(' • ');
  }

  function buildPerformanceMetrics(data) {
    var metrics = [];
    function addMetric(label, value) {
      if (value === undefined || value === null || value === '') {
        value = 'N/A';
      }
      metrics.push({ title: label, value: value });
    }

    addMetric('Load time', typeof data.loadTime === 'number' ? Math.round(data.loadTime) + ' ms' : 'N/A');
    addMetric('Stylesheets', typeof data.stylesheets === 'number' ? data.stylesheets : 'N/A');
    addMetric('CSS rules', typeof data.rules === 'number' ? data.rules : 'N/A');
    addMetric('Estimated CSS size', typeof data.size === 'number' ? Math.round(data.size / 1024) + ' KB' : 'N/A');

    var assets = ensureArray(data && data.assets);
    addMetric('Total assets scanned', assets.length);

    var contrastCount = ensureArray(data && data.contrastIssues).length;
    addMetric('Contrast issues', contrastCount);

    var missingAlt = (data && data.altText && ensureArray(data.altText.missing).length) || 0;
    addMetric('Missing alt text', missingAlt);

    if (!metrics.length) {
      metrics.push({ title: 'Metrics', value: 'No performance data available.' });
    }
    return metrics;
  }

  function buildReportPayload(auditData) {
    var data = auditData || {};
    var meta = data.meta || {};
    var title = data.pageTitle || data.title || meta.pageTitle || meta.title || 'Untitled page';
    var url = data.url || meta.canonical || meta.url || (meta.og && meta.og.url) || '#';
    var generatedAt = data.generatedAt || new Date().toISOString();
    var seoSource = data.seo || meta;

    var seo = {
      title: seoSource.title || title,
      description: seoSource.description || meta.description || '',
      keywords: seoSource.keywords || meta.keywords || '',
      score: typeof seoSource.score === 'number' ? seoSource.score : (typeof data.seoScore === 'number' ? data.seoScore : '')
    };

    var techSource = data.techStack || data.detectedTech || data.technology || data.tech;
    var accessibilityIssues = buildAccessibilityIssues(data);
    return {
      title: title,
      url: url,
      generatedAt: generatedAt,
      timestamp: generatedAt,
      meta: meta,
      seo: seo,
      accessibility: {
        summary: buildAccessibilitySummary(data, accessibilityIssues),
        issues: accessibilityIssues
      },
      performance: {
        score: typeof data.performanceScore === 'number' ? data.performanceScore : (data.performance && data.performance.score) || '',
        metrics: buildPerformanceMetrics(data)
      },
      techStack: normalizeTechStack(techSource),
      colors: normalizeColors(data.colors),
      typography: normalizeTypography(data.typography)
    };
  }

  function revokeUrlLater(url) {
    setTimeout(function () {
      if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      }
    }, 1000);
  }

  function openReportUrl(url) {
    if (!url) {
      return;
    }
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: url }, function () {
        revokeUrlLater(url);
      });
      return;
    }
    if (typeof window !== 'undefined' && window.open) {
      window.open(url, '_blank');
      revokeUrlLater(url);
      return;
    }
    revokeUrlLater(url);
  }

  function generateReport(auditData) {
    var html;
    var payload = buildReportPayload(auditData);
    if (typeof generateReportHtml === 'function') {
      try {
        html = generateReportHtml(payload);
      } catch (error) {
        html = '<html><body><h1>Error: Report template failed to render</h1><p>' + (error && error.message ? error.message : 'Unknown error') + '</p></body></html>';
      }
    } else {
      html = '<html><body><h1>Error: Report template not loaded</h1></body></html>';
    }

    if (!html) {
      html = '<html><body><h1>Error: Empty report content</h1></body></html>';
    }

    var blob;
    try {
      blob = new Blob([html], { type: 'text/html' });
    } catch (createError) {
      html = '<html><body><h1>Error: Unable to create report blob</h1><p>' + (createError && createError.message ? createError.message : '') + '</p></body></html>';
      blob = new Blob([html], { type: 'text/html' });
    }

    var url;
    try {
      url = URL.createObjectURL(blob);
    } catch (urlError) {
      console.error('Report generator: failed to create URL', urlError);
      return;
    }

    openReportUrl(url);
  }

  return {
    generateReport: generateReport
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = reportGenerator;
}

if (typeof window !== 'undefined') {
  window.reportGenerator = window.reportGenerator || {};
  window.reportGenerator.generateReport = window.reportGenerator.generateReport || reportGenerator.generateReport;
}
