var ogPreviewData = {
platformPresets: [
{ platform: 'Facebook', width: 1200, height: 630, aspectRatio: '1.91:1', accentColor: '#1877F2' },
{ platform: 'Twitter', width: 1200, height: 628, aspectRatio: '1.91:1', accentColor: '#000000' },
{ platform: 'LinkedIn', width: 1200, height: 627, aspectRatio: '1.91:1', accentColor: '#0A66C2' },
{ platform: 'WhatsApp', width: 400, height: 210, aspectRatio: '1.9:1', accentColor: '#25D366' },
{ platform: 'Slack', width: 400, height: 210, aspectRatio: '1.9:1', accentColor: '#4A154B' }
],

extractOgData: function(pageData) {
var meta = (pageData && pageData.meta) || {};
var og = meta.og || {};
var twitter = meta.twitter || {};

var title = og.title || twitter.title || meta.title || meta.pageTitle || (pageData && pageData.title) || 'Untitled';
var description = og.description || twitter.description || meta.description || meta.pageDescription || '';
var image = og.image || og['image:url'] || og['image:secure_url'] || twitter.image || twitter['image'] || meta.image || '';
var url = og.url || meta.canonical || meta.url || (pageData && pageData.url) || '';

return {
title: title,
description: description,
image: image,
url: url,
platforms: this.platformPresets.slice(0)
};
}
};

if (typeof module !== 'undefined' && module.exports) {
module.exports = ogPreviewData;
}
