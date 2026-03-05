# Code Peek

A Chrome extension for inspecting CSS, colors, typography, and assets from any website.

## Features

- **Overview** - Page summary, link preview (Open Graph), typography, colors, contrast scanner
- **Colors** - Extract all colors with one-click copy
- **Typography** - Font families, sizes, weights analysis
- **Assets** - Images, SVGs, background images
- **Inspect Mode** - Click any element to view computed styles
- **Rulers & Measurement**
  - Place draggable rulers on the page with coordinate list
  - Measure distance between two elements (edge-to-edge) with visual overlay
- **Distance Lines** - See distances from element to its parent while inspecting
- **Full-Page Screenshot** - Capture entire page with proper filename and sticky element handling

## v0.2.0 Highlights

- New **Measure Distance** mode: select two elements to see precise edge-to-edge distance with highlights and labels
- **Rulers** overhaul: drag to move, unit conversion (px/rem), Clear All, scrollable list
- **Distance lines** toggle now persists and works correctly across sessions
- **Continuous inspect** toggle moved to inspector panel and persisted
- **Sidepanel close cleanup**: all overlays automatically turn off when closing the panel
- **Context menu** toggle: control the info box during inspect
- **Screenshot** improvements: filename uses site + page title; sticky/fixed elements hidden after first tile
- Numerous UX refinements and bug fixes

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
