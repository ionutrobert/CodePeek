// Assets Tab - UI UX Pro Max Redesign
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
        '<div class="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px] opacity-40">No media found</div>';
      return;
    }

    var html = '<div class="p-4 space-y-6">';

    // Tab Header
    html += '<div class="px-1 mb-2">';
    html +=
      '<h2 class="text-xl font-black text-slate-900 tracking-tight">Assets</h2>';
    html +=
      '<p class="text-[10px] text-slate-700 font-black uppercase tracking-widest mt-1">STATIC RESOURCES FOUND</p>';
    html += "</div>";

    html +=
      '<div class="grid grid-cols-2 gap-2 bg-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">';

    for (i = 0; i < Math.min(assets.length, 50); i++) {
      a = assets[i];
      name = (a.src ? a.src.split("/").pop() : "Asset").split("?")[0];
      if (name.length > 20) name = name.substring(0, 17) + "...";

      html +=
        '<div class="group relative bg-white rounded-2xl overflow-hidden hover:z-10 transition-all flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 border border-slate-100">';

      html +=
        '<div class="aspect-square bg-slate-50/50 flex items-center justify-center p-4 relative overflow-hidden group/img-wrap">';
      html +=
        '<img src="' +
        a.src +
        '" class="max-w-[90%] max-h-[90%] object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500 ease-out">';

      // New Subtle Top-Right Overlay
      html +=
        '<div class="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">';
      html +=
        '<button class="asset-action-btn p-2 bg-white text-brand-600 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer" data-action="open" data-url="' +
        a.src +
        '" title="Open image"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></button>';
      html +=
        '<button class="asset-action-btn p-2 bg-white text-slate-800 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer" data-action="copy" data-url="' +
        a.src +
        '" title="Copy URL"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></button>';
      html += "</div>";
      html += "</div>";

      html += '<div class="p-3 bg-white mt-auto">';
      html +=
        '<div class="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1 truncate">' +
        name +
        "</div>";
      html += '<div class="flex items-center justify-between">';
      html +=
        '<span class="text-[10px] font-bold text-slate-900 tracking-tighter">' +
        (a.width || "?") +
        "×" +
        (a.height || "?") +
        "</span>";
      html +=
        '<span class="text-[8px] font-black text-brand-600 uppercase px-1.5 py-0.5 rounded-md tracking-widest bg-brand-50">' +
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
