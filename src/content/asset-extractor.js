export function extractAssetsFromPage() {
  const assets = {
    images: [],
    svgs: [],
    backgrounds: []
  };
  
  extractImages(assets.images);
  extractSVGs(assets.svgs);
  extractBackgroundImages(assets.backgrounds);
  
  return assets;
}

function extractImages(imageArray) {
  const imgElements = document.querySelectorAll('img[src]');
  
  imgElements.forEach(img => {
    const src = img.src;
    const alt = img.alt || '';
    
    if (isValidAssetUrl(src)) {
      imageArray.push({
        type: 'img',
        url: src,
        alt: alt,
        filename: getFilenameFromUrl(src),
        extension: getExtensionFromUrl(src),
        dimensions: {
          width: img.width,
          height: img.height
        }
      });
    }
  });
  
  const imageSources = Array.from(document.querySelectorAll('source[srcset]'));
  imageSources.forEach(source => {
    const srcset = source.srcset;
    if (srcset) {
      const sources = parseSrcset(srcset);
      sources.forEach(src => {
        if (isValidAssetUrl(src.url)) {
          imageArray.push({
            type: 'img',
            url: src.url,
            alt: '',
            filename: getFilenameFromUrl(src.url),
            extension: getExtensionFromUrl(src.url),
            dimensions: {
              width: parseInt(src.width) || 0,
              height: 0
            },
            source: 'srcset'
          });
        }
      });
    }
  });
  
  return imageArray.sort((a, b) => {
    const scoreA = a.dimensions.width * a.dimensions.height;
    const scoreB = b.dimensions.width * b.dimensions.height;
    return scoreB - scoreA;
  });
}

function extractSVGs(svgArray) {
  const svgElements = document.querySelectorAll('svg');
  
  svgElements.forEach((svg, index) => {
    const svgString = svg.outerHTML;
    const bbox = svg.getBBox();
    
    svgArray.push({
      type: 'svg',
      url: createSVGDataURL(svgString),
      filename: `svg-${index}.svg`,
      extension: 'svg',
      dimensions: {
        width: bbox.width,
        height: bbox.height
      },
      content: svgString
    });
  });
  
  const objectElements = document.querySelectorAll('object[type="image/svg+xml"], object[data$=".svg"]');
  objectElements.forEach((obj, index) => {
    if (obj.data) {
      svgArray.push({
        type: 'svg-object',
        url: obj.data,
        filename: getFilenameFromUrl(obj.data) || `svg-object-${index}.svg`,
        extension: 'svg',
        dimensions: {
          width: obj.width || obj.offsetWidth,
          height: obj.height || obj.offsetHeight
        }
      });
    }
  });
  
  const embedElements = document.querySelectorAll('embed[type="image/svg+xml"], embed[src$=".svg"]');
  embedElements.forEach((embed, index) => {
    if (embed.src) {
      svgArray.push({
        type: 'svg-embed',
        url: embed.src,
        filename: getFilenameFromUrl(embed.src) || `svg-embed-${index}.svg`,
        extension: 'svg',
        dimensions: {
          width: embed.width || embed.offsetWidth,
          height: embed.height || embed.offsetHeight
        }
      });
    }
  });
  
  return svgArray;
}

function extractBackgroundImages(backgroundArray) {
  const elements = document.querySelectorAll('*');
  
  elements.forEach((element, index) => {
    const computedStyle = window.getComputedStyle(element);
    const backgroundImage = computedStyle.backgroundImage;
    
    if (backgroundImage && backgroundImage !== 'none') {
      const urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/i);
      if (urlMatch) {
        const url = urlMatch[1];
        
        if (isValidAssetUrl(url) && !isDataURL(url)) {
          const rect = element.getBoundingClientRect();
          
          backgroundArray.push({
            type: 'background',
            url: url,
            filename: getFilenameFromUrl(url),
            extension: getExtensionFromUrl(url),
            dimensions: {
              width: rect.width,
              height: rect.height
            },
            selector: generateElementSelector(element),
            position: computedStyle.backgroundPosition,
            size: computedStyle.backgroundSize,
            repeat: computedStyle.backgroundRepeat
          });
        }
      }
    }
  });
  
  return backgroundArray.filter((asset, index, self) => 
    index === self.findIndex(a => a.url === asset.url)
  ).sort((a, b) => {
    const areaA = a.dimensions.width * a.dimensions.height;
    const areaB = b.dimensions.width * b.dimensions.height;
    return areaB - areaA;
  });
}

function isValidAssetUrl(url) {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return isDataURL(url);
  }
}

function isDataURL(url) {
  return url.startsWith('data:');
}

function getFilenameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop().split('?')[0];
  } catch (e) {
    return 'asset';
  }
}

function getExtensionFromUrl(url) {
  const filename = getFilenameFromUrl(url);
  return filename.split('.').pop().toLowerCase();
}

function parseSrcset(srcset) {
  return srcset.split(',').map(src => {
    const parts = src.trim().split(' ');
    return {
      url: parts[0],
      width: parts[1] ? parts[1].replace(/\D/g, '') : null
    };
  });
}

function createSVGDataURL(svgString) {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml;utf8,${encoded}`;
}

function generateElementSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(' ').filter(Boolean);
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
    }
  }
  
  return element.tagName.toLowerCase();
}

export function getAssetStats(assets) {
  const total = assets.images.length + assets.svgs.length + assets.backgrounds.length;
  
  const imageFormats = {};
  assets.images.forEach(img => {
    imageFormats[img.extension] = (imageFormats[img.extension] || 0) + 1;
  });
  
  return {
    total,
    images: assets.images.length,
    svgs: assets.svgs.length,
    backgrounds: assets.backgrounds.length,
    formats: imageFormats
  };
}
