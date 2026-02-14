import { el } from '../utils/dom.js';
import { formatFileSize } from '../utils/format.js';
import { clampCropRect } from '../core/cropper.js';
import * as store from '../core/image-store.js';

/**
 * Create an image card DOM element with crop overlay.
 */
export function createImageCard(entry, settings) {
  const card = el('div', { class: 'image-card', dataset: { id: entry.id } });

  // Preview container
  const preview = el('div', { class: 'image-card__preview' });

  // Thumbnail canvas
  const canvas = el('canvas', { class: 'image-card__canvas' });
  canvas.width = entry.thumbnail.width;
  canvas.height = entry.thumbnail.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(entry.thumbnail, 0, 0);
  preview.appendChild(canvas);

  // Crop overlay
  const cropOverlay = el('div', { class: 'image-card__crop-overlay' });
  const cropRect = el('div', { class: 'image-card__crop-rect' });
  cropOverlay.appendChild(cropRect);
  preview.appendChild(cropOverlay);

  // Remove button
  const removeBtn = el('button', { class: 'image-card__remove', title: 'Remove' });
  removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    store.removeImage(entry.id);
  });
  preview.appendChild(removeBtn);

  card.appendChild(preview);

  // Info section
  const info = el('div', { class: 'image-card__info' });
  info.appendChild(el('div', { class: 'image-card__name', title: entry.originalName }, entry.originalName));
  info.appendChild(
    el('div', { class: 'image-card__meta' }, `${entry.width}×${entry.height} · ${formatFileSize(entry.file.size)}`)
  );
  const statusEl = el('div', { class: 'image-card__status' });
  statusEl.hidden = true;
  info.appendChild(statusEl);
  card.appendChild(info);

  // Set up crop drag
  setupCropDrag(cropRect, cropOverlay, entry);

  // Initial crop position
  updateCropRectPosition(cropRect, cropOverlay, entry.cropRect);

  return card;
}

/**
 * Update the visual crop rectangle position.
 */
export function updateCropRectPosition(cropRectEl, overlayEl, cropRect) {
  const ow = overlayEl.clientWidth || overlayEl.offsetWidth;
  const oh = overlayEl.clientHeight || overlayEl.offsetHeight;

  if (ow === 0 || oh === 0) {
    // Defer until layout is ready
    requestAnimationFrame(() => updateCropRectPosition(cropRectEl, overlayEl, cropRect));
    return;
  }

  // Get the canvas (thumbnail) to calculate actual image display area
  const canvas = overlayEl.previousElementSibling;
  if (!canvas || canvas.tagName !== 'CANVAS') {
    cropRectEl.style.left = `${cropRect.x * 100}%`;
    cropRectEl.style.top = `${cropRect.y * 100}%`;
    cropRectEl.style.width = `${cropRect.w * 100}%`;
    cropRectEl.style.height = `${cropRect.h * 100}%`;
    return;
  }

  // Calculate how the image is actually displayed with object-fit: contain
  const imgAspect = canvas.width / canvas.height;
  const containerAspect = ow / oh;

  let displayWidth, displayHeight, offsetX, offsetY;

  if (imgAspect > containerAspect) {
    // Image is wider than container - fits to width
    displayWidth = ow;
    displayHeight = ow / imgAspect;
    offsetX = 0;
    offsetY = (oh - displayHeight) / 2;
  } else {
    // Image is taller than container - fits to height
    displayHeight = oh;
    displayWidth = oh * imgAspect;
    offsetX = (ow - displayWidth) / 2;
    offsetY = 0;
  }

  // Apply crop rect relative to the actual displayed image
  const left = offsetX + cropRect.x * displayWidth;
  const top = offsetY + cropRect.y * displayHeight;
  const width = cropRect.w * displayWidth;
  const height = cropRect.h * displayHeight;

  cropRectEl.style.left = `${left}px`;
  cropRectEl.style.top = `${top}px`;
  cropRectEl.style.width = `${width}px`;
  cropRectEl.style.height = `${height}px`;
}

/**
 * Setup mouse/touch drag for the crop rectangle.
 */
function setupCropDrag(cropRectEl, overlayEl, entry) {
  let dragging = false;
  let startX, startY, startCropX, startCropY;

  function onStart(e) {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;

    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX;
    startY = point.clientY;
    startCropX = entry.cropRect.x;
    startCropY = entry.cropRect.y;

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  function onMove(e) {
    if (!dragging) return;
    e.preventDefault();

    const point = e.touches ? e.touches[0] : e;

    // Calculate displayed image dimensions
    const canvas = overlayEl.previousElementSibling;
    if (!canvas || canvas.tagName !== 'CANVAS') return;

    const ow = overlayEl.clientWidth;
    const oh = overlayEl.clientHeight;
    const imgAspect = canvas.width / canvas.height;
    const containerAspect = ow / oh;

    let displayWidth, displayHeight;
    if (imgAspect > containerAspect) {
      displayWidth = ow;
      displayHeight = ow / imgAspect;
    } else {
      displayHeight = oh;
      displayWidth = oh * imgAspect;
    }

    const dx = (point.clientX - startX) / displayWidth;
    const dy = (point.clientY - startY) / displayHeight;

    const newRect = clampCropRect({
      x: startCropX + dx,
      y: startCropY + dy,
      w: entry.cropRect.w,
      h: entry.cropRect.h,
    });

    entry.cropRect = newRect;
    store.updateCropRect(entry.id, newRect, true);
    updateCropRectPosition(cropRectEl, overlayEl, newRect);
  }

  function onEnd() {
    dragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
  }

  cropRectEl.addEventListener('mousedown', onStart);
  cropRectEl.addEventListener('touchstart', onStart, { passive: false });
}

/**
 * Update card status after processing.
 */
export function updateCardStatus(cardEl, blob) {
  const statusEl = cardEl.querySelector('.image-card__status');
  if (statusEl && blob) {
    statusEl.textContent = `✓ ${formatFileSize(blob.size)}`;
    statusEl.hidden = false;
  }
}
