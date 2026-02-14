/**
 * Central image store with pub/sub event system.
 */

/** @type {ImageEntry[]} */
let images = [];

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/**
 * @typedef {Object} ImageEntry
 * @property {string} id
 * @property {File} file
 * @property {string} originalName
 * @property {number} width
 * @property {number} height
 * @property {HTMLCanvasElement|null} thumbnail
 * @property {{ x: number, y: number, w: number, h: number }} cropRect
 * @property {boolean} cropManual
 * @property {Blob|null} processed
 * @property {string} outputName
 */

export function subscribe(event, callback) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(callback);
  return () => listeners.get(event).delete(callback);
}

function emit(event, data) {
  const cbs = listeners.get(event);
  if (cbs) cbs.forEach((cb) => cb(data));
}

export function getImages() {
  return images;
}

export function getImageById(id) {
  return images.find((img) => img.id === id);
}

export function getCount() {
  return images.length;
}

/**
 * Add files to the store. Creates ImageEntry objects with thumbnails.
 */
export async function addImages(files, createThumbnailFn) {
  const newEntries = [];

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;

    const id = crypto.randomUUID();
    const { canvas, width, height } = await createThumbnailFn(file);

    const entry = {
      id,
      file,
      originalName: file.name,
      width,
      height,
      thumbnail: canvas,
      cropRect: { x: 0, y: 0, w: 1, h: 1 },
      cropManual: false,
      processed: null,
      outputName: '',
    };

    images.push(entry);
    newEntries.push(entry);
  }

  if (newEntries.length > 0) {
    emit('images-added', newEntries);
    emit('count-changed', images.length);
  }

  return newEntries;
}

export function removeImage(id) {
  const idx = images.findIndex((img) => img.id === id);
  if (idx === -1) return;
  images.splice(idx, 1);
  emit('image-removed', id);
  emit('count-changed', images.length);
}

export function updateCropRect(id, cropRect, manual = true) {
  const entry = getImageById(id);
  if (!entry) return;
  entry.cropRect = cropRect;
  entry.cropManual = manual;
  emit('crop-updated', { id, cropRect });
}

export function setProcessed(id, blob, outputName) {
  const entry = getImageById(id);
  if (!entry) return;
  entry.processed = blob;
  entry.outputName = outputName;
  emit('image-processed', { id, blob, outputName });
}

export function clearAll() {
  images = [];
  emit('images-cleared');
  emit('count-changed', 0);
}

export function resetAllCrops() {
  for (const entry of images) {
    if (!entry.cropManual) {
      emit('crop-updated', { id: entry.id, cropRect: entry.cropRect });
    }
  }
}

export function clearProcessedState() {
  for (const entry of images) {
    entry.processed = null;
    entry.outputName = '';
  }
  emit('processed-cleared');
}
