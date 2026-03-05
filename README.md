# Code Peek

A Chrome extension for inspecting CSS, colors, typography, and assets from any website.

## Features

- **Inspect Mode** - Hover and click elements to view computed styles, dimensions, and margins
- **Distance Lines** - Visual dashed lines showing distance from element to its parent (toggleable)
- **Rulers** - Place horizontal/vertical rulers on the page; drag to reposition; view coordinates in a scrollable list; unit conversion (px/rem)
- **Measure Distance** - Select two elements to get edge-to-edge distance with visual line and label
- **Full-Page Screenshot** - Capture entire page; filename includes site and page title; handles sticky/fixed elements
- **Color & Typography Extraction** - Analyze colors, fonts, and assets from the current page
- **Persistent Settings** - Toggle states (inspect, distance lines, context menu, continuous inspect) are saved across sessions

## User Experience

- Clean, minimal sidepanel interface
- Intuitive toggles with visual feedback
- Overlay management: all modes automatically disable when sidepanel is closed
- Context menu (info tooltip) can be toggled on/off during inspect

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

## Files

- `src/` - Source code
- `dist/` - Built extension (load this in Chrome)
- `build/` - Build scripts

## License

MIT
