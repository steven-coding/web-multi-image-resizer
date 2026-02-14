import Pica from 'pica';
import { cropRectToPixels } from './cropper.js';
import { applyWatermark } from './watermark.js';
import { createCanvas, canvasToBlob } from '../utils/canvas-helpers.js';
import { getMimeType, getExtension, getFilenameStem, sanitizeFilename } from '../utils/format.js';

const pica = new Pica();

/**
 * Process a single image through the full pipeline.
 * Returns { blob, outputName }.
 */
export async function processImage(entry, settings, index) {
  // Step 1: Decode
  const bitmap = await createImageBitmap(entry.file);
  const srcW = bitmap.width;
  const srcH = bitmap.height;

  // Step 2: Calculate target dimensions
  let targetW = settings.targetWidth || 0;
  let targetH = settings.targetHeight || 0;

  if (targetW && !targetH) {
    targetH = Math.round((srcH / srcW) * targetW);
  } else if (!targetW && targetH) {
    targetW = Math.round((srcW / srcH) * targetH);
  } else if (!targetW && !targetH) {
    targetW = srcW;
    targetH = srcH;
  }

  // Step 3: Crop
  const crop = cropRectToPixels(entry.cropRect, srcW, srcH);
  const cropCanvas = createCanvas(crop.sw, crop.sh);
  const cropCtx = cropCanvas.getContext('2d');
  cropCtx.drawImage(bitmap, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.sw, crop.sh);
  bitmap.close();

  // Step 4: Resize with pica
  const resizeCanvas = createCanvas(targetW, targetH);
  await pica.resize(cropCanvas, resizeCanvas, {
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2,
  });

  // Step 5: Border
  let finalCanvas = resizeCanvas;
  const border = settings.border;
  if (border && border.enabled && border.size > 0) {
    const bSize = border.size;
    const bW = targetW + bSize * 2;
    const bH = targetH + bSize * 2;
    finalCanvas = createCanvas(bW, bH);
    const bCtx = finalCanvas.getContext('2d');
    bCtx.fillStyle = border.color || '#ffffff';
    bCtx.fillRect(0, 0, bW, bH);
    bCtx.drawImage(resizeCanvas, bSize, bSize);
  }

  // Step 6: Watermark
  if (settings.watermark && settings.watermark.enabled) {
    const wCtx = finalCanvas.getContext('2d');
    applyWatermark(wCtx, finalCanvas.width, finalCanvas.height, settings.watermark);
  }

  // Step 7: Encode
  const mime = getMimeType(settings.outputFormat);
  const quality = settings.outputFormat === 'png' ? undefined : settings.quality / 100;
  const blob = await canvasToBlob(finalCanvas, mime, quality);

  // Step 8: Generate output name
  const outputName = generateOutputName(entry, settings, index);

  return { blob, outputName };
}

/**
 * Process all images with progress callback.
 */
export async function processAll(entries, settings, onProgress) {
  const results = [];
  for (let i = 0; i < entries.length; i++) {
    onProgress?.({ current: i + 1, total: entries.length, name: entries[i].originalName });
    const result = await processImage(entries[i], settings, i);
    results.push({ entry: entries[i], ...result });
  }
  return results;
}

function generateOutputName(entry, settings, index) {
  const ext = getExtension(settings.outputFormat);
  const rename = settings.rename;

  if (rename && rename.enabled && rename.pattern) {
    const num = (rename.startNumber || 1) + index;
    const padLen = (rename.pattern.match(/x+/)?.[0] || 'xxx').length;
    const padded = String(num).padStart(padLen, '0');
    let name = rename.pattern
      .replace(/x+/, padded)
      .replace(/ORIGINAL-NAME/g, getFilenameStem(entry.originalName));
    return sanitizeFilename(name) + '.' + ext;
  }

  return sanitizeFilename(getFilenameStem(entry.originalName)) + '.' + ext;
}
