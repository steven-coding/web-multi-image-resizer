import './style.css';
import * as store from './core/image-store.js';
import { loadSettings, saveSettings } from './core/settings.js';
import { calculateCenteredCropRect } from './core/cropper.js';
import { processAll } from './core/processor.js';
import { downloadAllAsZip } from './core/downloader.js';
import { createThumbnail } from './utils/canvas-helpers.js';
import { formatFileSize } from './utils/format.js';
import { $ } from './utils/dom.js';
import { initDropzone, showDropzone } from './components/dropzone.js';
import { initSettingsPanel } from './components/settings-panel.js';
import { initToolbar, updateToolbarState, setProcessing, showProgress, updateStatus } from './components/toolbar.js';
import { updateCardStatus } from './components/image-card.js';
import { VirtualGrid } from './components/virtual-grid.js';

// === State ===
let settings = loadSettings();
let virtualGrid;
let settingsPanel;

// === Init ===
function init() {
  // Settings panel
  settingsPanel = initSettingsPanel($('#sidebar-content'), settings, onSettingsChange);

  // Sidebar toggle
  $('#sidebar-toggle').addEventListener('click', () => {
    $('#sidebar').classList.toggle('collapsed');
  });

  // Virtual grid
  const content = $('#content');
  virtualGrid = new VirtualGrid($('#image-grid'), content);

  // Dropzone
  initDropzone(onFilesAdded);

  // Toolbar
  initToolbar({
    onProcess: onProcess,
    onDownload: onDownload,
    onClear: onClear,
  });

  // Store events
  store.subscribe('image-removed', (id) => {
    virtualGrid.removeEntry(id);
    updateUI();
  });

  store.subscribe('images-cleared', () => {
    virtualGrid.clear();
    updateUI();
  });

  store.subscribe('count-changed', () => {
    updateUI();
  });

  updateUI();
}

// === Handlers ===

async function onFilesAdded(files) {
  updateStatus(`Loading ${files.length} images…`);

  const newEntries = await store.addImages(files, createThumbnail);

  // Calculate initial crop rects
  for (const entry of newEntries) {
    const cropRect = calculateCenteredCropRect(
      entry.width, entry.height,
      settings.targetWidth, settings.targetHeight
    );
    store.updateCropRect(entry.id, cropRect, false);
  }

  virtualGrid.addEntries(newEntries, settings);
  showDropzone(false);
  updateUI();
}

function onSettingsChange(newSettings) {
  const dimensionsChanged =
    newSettings.targetWidth !== settings.targetWidth ||
    newSettings.targetHeight !== settings.targetHeight;

  settings = newSettings;
  saveSettings(settings);

  // Recalculate crop rects if dimensions changed
  if (dimensionsChanged) {
    for (const entry of store.getImages()) {
      if (!entry.cropManual) {
        const cropRect = calculateCenteredCropRect(
          entry.width, entry.height,
          settings.targetWidth, settings.targetHeight
        );
        store.updateCropRect(entry.id, cropRect, false);
      }
    }
    virtualGrid.refreshCropOverlays();
  }

  // Clear processed state since settings changed
  store.clearProcessedState();
  updateToolbarState(store.getCount(), false);
}

async function onProcess() {
  const images = store.getImages();
  if (images.length === 0) return;

  setProcessing(true);
  showProgress(true, 0, images.length);
  updateStatus('Processing…');

  try {
    const results = await processAll(images, settings, ({ current, total, name }) => {
      showProgress(true, current, total, `${current}/${total}: ${name}`);
      updateStatus(`Processing ${current}/${total}…`);
    });

    // Update store and cards
    for (const { entry, blob, outputName } of results) {
      store.setProcessed(entry.id, blob, outputName);
      const cardEl = virtualGrid.getCardElement(entry.id);
      if (cardEl) updateCardStatus(cardEl, blob);
    }

    const totalSize = results.reduce((sum, r) => sum + r.blob.size, 0);
    updateStatus(`${results.length} images processed (${formatFileSize(totalSize)})`);
    updateToolbarState(store.getCount(), true);
  } catch (err) {
    console.error('Processing failed:', err);
    updateStatus(`Error: ${err.message}`);
  } finally {
    setProcessing(false);
    showProgress(false);
  }
}

async function onDownload() {
  const images = store.getImages();
  const processed = images.filter((e) => e.processed);
  if (processed.length === 0) return;

  updateStatus('Creating ZIP…');
  showProgress(true, 0, 100);

  try {
    await downloadAllAsZip(processed, ({ current, total, zipping }) => {
      if (zipping) {
        showProgress(true, current, total, `ZIP: ${current}%`);
      } else {
        showProgress(true, current, total, `Packing ${current}/${total}…`);
      }
    });
    updateStatus('ZIP downloaded');
  } catch (err) {
    console.error('Download failed:', err);
    updateStatus(`Error: ${err.message}`);
  } finally {
    showProgress(false);
  }
}

function onClear() {
  store.clearAll();
  showDropzone(true);
  updateUI();
}

function updateUI() {
  const count = store.getCount();
  const hasProcessed = store.getImages().some((e) => e.processed);

  updateToolbarState(count, hasProcessed);

  if (count === 0) {
    showDropzone(true);
    updateStatus('Ready');
  } else {
    showDropzone(false);
    updateStatus(`${count} image${count !== 1 ? 's' : ''} loaded`);
  }
}

// === Start ===
init();
