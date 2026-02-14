# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build

No test runner or linter is configured.

## Architecture

Vanilla JavaScript (ES Modules) browser app for batch image resizing/cropping/watermarking. Built with Vite, no framework. English-language UI (`index.html` sets `lang="en"`).

### Data Flow

```
File Input → ImageStore (pub/sub) → VirtualGrid (render) → Processor (canvas pipeline) → Downloader (ZIP)
```

### Layers

**State (`core/image-store.js`)** — Central store holding `ImageEntry` objects with pub/sub events (`images-added`, `image-removed`, `crop-updated`, `image-processed`, etc.). Components subscribe to store events for loose coupling.

**Processing (`core/processor.js`)** — Pipeline: decode (createImageBitmap) → calculate dimensions → crop → resize (Pica with unsharp mask) → border → watermark → encode to blob. All settings-driven.

**Crop (`core/cropper.js`)** — Crop rects stored as normalized 0–1 coordinates, converted to pixels only during rendering/processing.

**Components (`components/`)** — Each component creates its own DOM elements using `el()` helper from `utils/dom.js`. `VirtualGrid` only renders visible cards (buffer of 2 rows) for performance. `ImageCard` handles interactive crop overlay with mouse+touch drag. `SettingsPanel` uses accordion sections.

**Persistence (`core/settings.js`)** — Settings saved to localStorage under key `multi-image-resizer-settings` with deep merge against defaults.

**Entry point (`main.js`)** — Initializes all components, wires event handlers, subscribes to store events, manages UI state transitions.

### Key Libraries

- **pica** — High-quality image resizing
- **jszip** + **file-saver** — ZIP creation and download

### DOM Helpers

`utils/dom.js` exports `el(tag, attrs, ...children)`, `$(selector)`, `$$(selector)` — used throughout for element creation instead of innerHTML.
