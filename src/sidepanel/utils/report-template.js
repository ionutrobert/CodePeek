function generateReportHtml(data) {
  var safeData = data || {};
  var title = safeData.title || '{{title}}';
  var url = safeData.url || '{{url}}';
  var timestamp = safeData.generatedAt || safeData.timestamp || '{{generated_at}}';
  var metaDescription = (safeData.meta && safeData.meta.description) || '{{meta_description}}';
  var seo = safeData.seo || {};
  var seoTitle = seo.title || title;
  var seoDescription = seo.description || metaDescription;
  var seoKeywords = seo.keywords;
  if (seoKeywords && seoKeywords.join) {
    seoKeywords = seoKeywords.join(', ');
  }
  var seoScore = typeof seo.score !== 'undefined' ? seo.score : '{{seo_score}}';
  var accessibility = safeData.accessibility || {};
  var accessibilitySummary = accessibility.summary || '{{accessibility_summary}}';
  var accessibilityIssues = accessibility.issues || [];
  var performance = safeData.performance || {};
  var performanceScore = typeof performance.score !== 'undefined' ? performance.score : '{{performance_score}}';
  var performanceMetrics = performance.metrics || [];
  var techStack = safeData.techStack || [];
  var colors = safeData.colors || [];
  var typography = safeData.typography || [];

  var metricsHtml = '';
  for (var i = 0; i < performanceMetrics.length; i++) {
    var metric = performanceMetrics[i];
    var label = '{{metric}}';
    var value = 'N/A';
    if (metric && typeof metric === 'object') {
      label = metric.title || metric.name || '{{metric_name}}';
      value = metric.value || metric.result || 'N/A';
    } else {
      label = metric;
    }
    metricsHtml += '<li><strong>' + label + ':</strong> ' + value + '</li>';
  }
  if (!metricsHtml) {
    metricsHtml = '<li>{{performance_metrics}}</li>';
  }

  var accessibilityHtml = '';
  for (var j = 0; j < accessibilityIssues.length; j++) {
    var issue = accessibilityIssues[j];
    var issueLabel = issue && issue.title ? issue.title : issue;
    var issueImpact = issue && issue.impact ? ' (' + issue.impact + ')' : '';
    accessibilityHtml += '<li>' + issueLabel + issueImpact + '</li>';
  }
  if (!accessibilityHtml) {
    accessibilityHtml = '<li>{{accessibility_issues}}</li>';
  }

  var stackHtml = '';
  for (var k = 0; k < techStack.length; k++) {
    var stackItem = techStack[k];
    var stackLabel = stackItem && stackItem.name ? stackItem.name : stackItem;
    if (stackLabel) {
      stackHtml += '<li>' + stackLabel + '</li>';
    }
  }
  if (!stackHtml) {
    stackHtml = '<li>{{tech_stack}}</li>';
  }

  var paletteHtml = '';
  for (var l = 0; l < colors.length; l++) {
    var palette = colors[l];
    var paletteName = 'Palette ' + (l + 1);
    var paletteValue = '';
    if (typeof palette === 'string') {
      paletteValue = palette;
    } else if (palette && palette.value) {
      paletteValue = palette.value;
      paletteName = palette.name || paletteName;
    } else if (palette && palette.hex) {
      paletteValue = palette.hex;
      paletteName = palette.name || paletteName;
    }
    paletteHtml +=
      '<div class="color-chip"><span class="color-swatch" style="background:' + paletteValue + ';"></span><strong>' +
      paletteName + '</strong><small>' + paletteValue + '</small></div>';
  }
  if (!paletteHtml) {
    paletteHtml =
      '<div class="color-chip"><span class="color-swatch" style="background:#2d3748"></span><strong>{{color_primary}}</strong><small>#2d3748</small></div>';
  }

  var typographyHtml = '';
  for (var m = 0; m < typography.length; m++) {
    var type = typography[m];
    var typeName = type && type.label ? type.label : type && type.family ? type.family : 'Font ' + (m + 1);
    var typeStack = type && type.stack ? type.stack : type && type.value ? type.value : '{{font_stack}}';
    var typeSample = type && type.sample ? type.sample : 'The quick brown fox jumps over the lazy dog';
    typographyHtml +=
      '<article class="type-card"><h3>' + typeName + '</h3><p>' + typeSample + '</p><small>' + typeStack + '</small></article>';
  }
  if (!typographyHtml) {
    typographyHtml =
      '<article class="type-card"><h3>{{font_primary}}</h3><p>The quick brown fox jumps over the lazy dog</p><small>{{font_stack}}</small></article>';
  }

  var styleLines = [
    ':root{font-family:"Source Sans Pro","Segoe UI",system-ui;line-height:1.6;background:#eef2f7;color:#111;}\n',
    'body{margin:0;background:#f8fafc;color:#0f172a;min-height:100vh;}\n',
    'body.dark-mode{background:#05070a;color:#f8fafc;}\n',
    'body.dark-mode header{background:#0f172a;}\n',
    'body.dark-mode main{background:#030712;color:#e2e8f0;}\n',
    'header{position:sticky;top:0;z-index:2;background:linear-gradient(135deg,#ffffff,#e2e8f0);padding:1.5rem 2rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;box-shadow:0 6px 16px rgba(15,23,42,0.15);}\n',
    'header h1{margin:0;font-size:1.5rem;}\n',
    'header .meta{font-size:0.9rem;color:#475569;margin:0;}\n',
    'header .meta + .meta{margin-top:0.25rem;}\n',
    'header button{border:none;padding:0.65rem 1.25rem;border-radius:999px;background:#111827;color:#fff;font-weight:600;cursor:pointer;transition:transform 180ms ease,background 180ms ease;}\n',
    'header button:focus{outline:2px solid #2563eb;outline-offset:2px;}\n',
    'body.dark-mode header button{background:#f9fafb;color:#111827;}\n',
    'main{padding:2rem;max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;}\n',
    'section{background:#fff;border-radius:16px;padding:1.25rem 1.5rem;border:1px solid rgba(15,23,42,0.08);box-shadow:0 12px 30px rgba(15,23,42,0.08);}\n',
    'body.dark-mode section{background:#0e1118;border-color:rgba(248,250,252,0.1);box-shadow:0 12px 30px rgba(15,23,42,0.6);}\n',
    'section h2{margin-top:0;margin-bottom:0.75rem;color:#0f172a;}\n',
    'body.dark-mode section h2{color:#e2e8f0;}\n',
    'section dl{margin:0;}section dl dt{font-weight:700;}section dl dd{margin:0 0 0.85rem;}\n',
    'section ul{padding-left:1rem;margin:0;}section ul li{margin-bottom:0.55rem;}\n',
    '#colors .color-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.75rem;}\n',
    '#colors .color-chip{border-radius:12px;padding:0.85rem 0.9rem;background:#f8fafc;border:1px solid rgba(15,23,42,0.08);display:flex;flex-direction:column;gap:0.35rem;box-shadow:0 6px 18px rgba(15,23,42,0.08);}\n',
    'body.dark-mode #colors .color-chip{background:#111827;border-color:rgba(248,250,252,0.15);box-shadow:0 6px 18px rgba(2,6,23,0.8);}\n',
    '#colors .color-swatch{width:100%;height:50px;border-radius:8px;display:block;box-shadow:inset 0 0 0 3px rgba(255,255,255,0.35);}\n',
    '#tech-stack ul{display:flex;flex-wrap:wrap;gap:0.5rem;padding-inline-start:0;list-style:none;margin:0;}\n',
    '#tech-stack ul li{padding:0.4rem 0.75rem;border-radius:999px;background:#eef2ff;border:1px solid #c7d2fe;font-size:0.85rem;font-weight:600;}\n',
    'body.dark-mode #tech-stack ul li{background:#1d2b44;border:1px solid rgba(248,250,252,0.2);}\n',
    '#typography .type-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;}\n',
    '#typography .type-card{border-radius:16px;padding:1rem;border:1px solid rgba(15,23,42,0.08);background:#f9fafb;}\n',
    'body.dark-mode #typography .type-card{background:#111827;border-color:rgba(248,250,252,0.1);}\n',
    '#typography .type-card h3{margin:0 0 0.35rem;font-size:1.1rem;}\n',
    '#typography .type-card p{margin:0 0 0.45rem;font-family:\'Source Sans Pro\',\'Segoe UI\',system-ui;}\n',
    '#typography .type-card small{font-size:0.8rem;color:#475569;}\n',
    'body.dark-mode #typography .type-card small{color:#cbd5f5;}\n',
    '@media (max-width:600px){header{flex-direction:column;margin-bottom:0;gap:1rem;}header h1{text-align:center;}main{padding:1.25rem;}body.dark-mode header{padding:1rem 1.25rem;}}\n',
    '@media print{body{background:#fff;color:#111;box-shadow:none;}header button{display:none;}header{position:static;box-shadow:none;}main{padding:0;}section{page-break-inside:avoid;border:1px solid #d1d5db;background:#fff;box-shadow:none;}}\n'
  ];

  var htmlParts = [];
  htmlParts.push('<!DOCTYPE html>');
  htmlParts.push('<html>');
  htmlParts.push('<head>');
  htmlParts.push('<meta charset=\'UTF-8\'>');
  htmlParts.push('<title>Code Peek Report - ' + url + '</title>');
  htmlParts.push('<style>');
  for (var si = 0; si < styleLines.length; si++) {
    htmlParts.push(styleLines[si]);
  }
  htmlParts.push('</style>');
  htmlParts.push('</head>');
  htmlParts.push('<body>');
  htmlParts.push('<header>');
  htmlParts.push('<div><h1>Code Peek report</h1><p class=\'meta\'>' + title + ' · ' + url + '</p><p class=\'meta\'>' + timestamp + '</p></div>');
  htmlParts.push('<button id=\'modeToggle\' type=\'button\'>Switch to dark mode</button>');
  htmlParts.push('</header>');
  htmlParts.push('<main>');
  htmlParts.push('<section id=\'seo\'>');
  htmlParts.push('<h2>SEO</h2>');
  htmlParts.push('<dl>');
  htmlParts.push('<dt>Title</dt><dd>' + seoTitle + '</dd>');
  htmlParts.push('<dt>Description</dt><dd>' + seoDescription + '</dd>');
  htmlParts.push('<dt>Keywords</dt><dd>' + (seoKeywords || '{{seo_keywords}}') + '</dd>');
  htmlParts.push('<dt>Score</dt><dd>' + seoScore + '</dd>');
  htmlParts.push('</dl>');
  htmlParts.push('</section>');
  htmlParts.push('<section id=\'accessibility\'>');
  htmlParts.push('<h2>Accessibility</h2>');
  htmlParts.push('<p>' + accessibilitySummary + '</p>');
  htmlParts.push('<ul>' + accessibilityHtml + '</ul>');
  htmlParts.push('</section>');
  htmlParts.push('<section id=\'performance\'>');
  htmlParts.push('<h2>Performance</h2>');
  htmlParts.push('<dl>');
  htmlParts.push('<dt>Lighthouse score</dt><dd>' + performanceScore + '</dd>');
  htmlParts.push('</dl>');
  htmlParts.push('<ul>' + metricsHtml + '</ul>');
  htmlParts.push('</section>');
  htmlParts.push('<section id=\'tech-stack\'>');
  htmlParts.push('<h2>Tech Stack</h2>');
  htmlParts.push('<ul>' + stackHtml + '</ul>');
  htmlParts.push('</section>');
  htmlParts.push('<section id=\'colors\'>');
  htmlParts.push('<h2>Colors</h2>');
  htmlParts.push('<div class=\'color-grid\'>' + paletteHtml + '</div>');
  htmlParts.push('</section>');
  htmlParts.push('<section id=\'typography\'>');
  htmlParts.push('<h2>Typography</h2>');
  htmlParts.push('<div class=\'type-grid\'>' + typographyHtml + '</div>');
  htmlParts.push('</section>');
  htmlParts.push('</main>');
  htmlParts.push('<script>');
  htmlParts.push('(function(){var toggle=document.getElementById(\'modeToggle\');if(!toggle){return;}toggle.addEventListener(\'click\',function(){var body=document.body;var isDark=body.className.indexOf(\'dark-mode\')!==-1;if(isDark){body.className=body.className.replace(/\bdark-mode\b/,\'\').trim();toggle.innerHTML=\'Switch to dark mode\';}else{body.className=(body.className+\' dark-mode\').trim();toggle.innerHTML=\'Switch to light mode\';}});})();');
  htmlParts.push('</script>');
  htmlParts.push('</body>');
  htmlParts.push('</html>');

  return htmlParts.join('');
}

var reportTemplate = {
  generateReportHtml: generateReportHtml
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = reportTemplate;
}
