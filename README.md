# Code Peek

A Chrome extension for inspecting CSS, colors, typography, and assets from any website.

## Features

- **Overview** - Page summary, link preview (Open Graph), typography, colors, contrast scanner
- **Colors** - Extract all colors with one-click copy
- **Typography** - Font families, sizes, weights analysis
- **Assets** - Images, SVGs, background images
- **Inspect Mode** - Click any element to view computed styles

## Installation

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Open Chrome at `chrome://extensions/`
5. Enable "Developer mode" (top right)
6. Click "Load unpacked" → select the `dist/` folder

## Development

```bash
npm install
npm run build   # Production build
```

## Keyboard Shortcuts

- `Ctrl+Shift+P` - Toggle side panel
- `Ctrl+Shift+I` - Toggle inspect mode

## Files

- `src/` - Source code
- `dist/` - Built extension (load this in Chrome)
- `build/` - Build scripts

## License

MIT
