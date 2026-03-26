// Assets Tab - Neumorphic Redesign
var assetsTab = {
  render: function (data) {
  var container = document.getElementById("assets-content");
  if (!container) return;

  var assets = data && data.assets ? data.assets : [];
  var i;
  var a;
  var name;

  if (assets.length === 0) {
  container.innerHTML =
  '<div class="col-span-full py-20 text-center font-bold uppercase tracking-widest text-[10px] opacity-40" style="color: var(--text-muted);">No media found</div>';
  return;
  }

  var html = '<div class="tab-content">';

  // Standardized Page Header
  html += '<div class="neu-page-header">';
  html += '<div class="neu-section-dot"></div>';
  html += '<div>';
  html += '<h2 class="neu-page-title">Assets</h2>';
  html += '<div class="neu-page-subtitle">Images & Media</div>';
  html += '</div>';
  html += '</div>';

  html +=
  '<div class="grid grid-cols-2 gap-4 w-full">';

  for (i = 0; i < Math.min(assets.length, 50); i++) {
  a = assets[i];
  name = (a.src ? a.src.split("/").pop() : "Asset").split("?")[0];
  if (name.length > 20) name = name.substring(0, 17) + "...";

  // Neumorphic asset card
  html +=
  '<div class="neu-card group relative overflow-hidden flex flex-col" style="padding: 0;">';

  html +=
  '<div class="neu-card-inset aspect-square flex items-center justify-center relative overflow-hidden group/img-wrap" style="border-radius: var(--neu-radius) var(--neu-radius) 0 0;">';
  html +=
  '<img src="' +
  a.src +
  '" class="max-w-[80%] max-h-[80%] object-contain group-hover:scale-110 transition-transform duration-500 ease-out">';

  // Action buttons - appear on hover
  html +=
  '<div class="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">';
  html +=
  '<button class="neu-btn neu-btn-icon asset-action-btn" data-action="open" data-url="' +
  a.src +
  '" title="Open image" style="width: 36px; height: 36px;"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></button>';
  html +=
  '<button class="neu-btn neu-btn-icon asset-action-btn" data-action="copy" data-url="' +
  a.src +
  '" title="Copy URL" style="width: 36px; height: 36px;"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></button>';
  html += "</div>";
  html += "</div>";

  html += '<div class="p-3 mt-auto" style="background-color: var(--bg-primary);">';
  html +=
  '<div class="text-[9px] font-bold uppercase tracking-widest mb-1 truncate" style="color: var(--text-secondary);">' +
  name +
  "</div>";
  html += '<div class="flex items-center justify-between">';
  html +=
  '<span class="text-[10px] font-bold tracking-tighter" style="color: var(--text-primary);">' +
  (a.width || "?") +
  "×" +
  (a.height || "?") +
  "</span>";
  html +=
  '<span class="neu-badge neu-badge-accent">' +
  (a.extension || "IMG") +
  "</span>";
  html += "</div>";
  html += "</div>";

  html += "</div>";
  }

  html += "</div></div>";
  container.innerHTML = html;

  // Bind programmatic listeners for CSP compliance
  container.querySelectorAll(".asset-action-btn").forEach(function (btn) {
  btn.onclick = function (e) {
  var action = this.dataset.action;
  var url = this.dataset.url;
  if (action === "open") {
  // Use chrome.downloads to download instead of window.open (data URLs blocked)
  if (typeof chrome !== "undefined" && chrome.downloads) {
  chrome.downloads.download({ url: url }, function (id) {
  if (chrome.runtime.lastError) {
  // Fallback: open in new tab if downloads fail
  window.open(url, "_blank");
  }
  });
  } else {
  window.open(url, "_blank");
  }
  }
  else if (action === "copy" && typeof CodePeekApp !== "undefined")
  CodePeekApp.copyText(url);
  };
  });
  },
};
