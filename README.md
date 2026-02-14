# Multi Image Resizer

Browser-based tool for batch image processing — crop, resize, watermark, rename, and download as ZIP. Runs entirely in the browser, no server upload required.

## Features

- **Batch Processing** — Process any number of images at once
- **Interactive Crop** — Drag & drop cropping directly on the preview
- **Resize** — Target dimensions with automatic aspect ratio calculation
- **Watermark** — Text watermarks with configurable position, font, and opacity
- **Border** — Optional border with customizable color and width
- **Rename** — Pattern-based file renaming (e.g., `photo-001`, `photo-002`, …)
- **Output Formats** — JPEG, PNG, WebP, AVIF
- **ZIP Download** — Download all processed images bundled together
- **Persistent Settings** — Configuration saved in browser (localStorage)
- **Virtual Scrolling** — Performant even with hundreds of images

Supported input formats: JPEG, PNG, WebP, AVIF, GIF, BMP.

## Quick Start

```bash
npm install
npm run dev
```

The Vite dev server will start and open the app at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

The build output is in `dist/` and can be deployed to any static web server.

## Architecture

Vanilla JavaScript (ES Modules), no framework. Built with Vite.

```
src/
├── main.js                 # Entry point, wires all components together
├── style.css               # Complete styling (dark theme, CSS variables)
├── core/
│   ├── image-store.js      # Central state with pub/sub event system
│   ├── processor.js        # Image pipeline: Crop → Resize → Border → Watermark → Encode
│   ├── settings.js         # Load/save settings (localStorage)
│   ├── cropper.js          # Crop calculations (normalized 0–1 coordinates)
│   ├── watermark.js        # Render watermark on canvas
│   └── downloader.js       # Create and download ZIP
├── components/
│   ├── virtual-grid.js     # Virtual list — renders only visible cards
│   ├── image-card.js       # Image card with crop overlay and drag interaction
│   ├── settings-panel.js   # Sidebar with accordion settings
│   ├── toolbar.js          # Action bar (Add, Process, ZIP, Clear)
│   └── dropzone.js         # Drag & drop / file selection
└── utils/
    ├── dom.js              # DOM helpers: el(), $(), $$()
    ├── format.js           # File sizes, MIME types, filenames
    └── canvas-helpers.js   # Canvas/Blob helper functions
```

### Data Flow

```
File Upload → ImageStore (Pub/Sub) → VirtualGrid (Display) → Processor (Canvas Pipeline) → ZIP Download
```

The **ImageStore** holds all state and notifies components via events (`images-added`, `crop-updated`, `image-processed`, …). Components are loosely coupled and communicate exclusively through the store.

## Tech Stack

| Library | Purpose |
|---|---|
| [Pica](https://github.com/nodeca/pica) | High-quality image resizing with unsharp mask |
| [JSZip](https://stuk.github.io/jszip/) | Create ZIP archives in the browser |
| [FileSaver.js](https://github.com/nicolo-ribaudo/FileSaver.js) | Trigger blob downloads |
| [Vite](https://vitejs.dev/) | Dev server and build tool |
