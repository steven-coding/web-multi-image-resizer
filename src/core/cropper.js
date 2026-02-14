/**
 * Calculate an initial centered crop rectangle (normalized 0-1).
 *
 * Given source dimensions and target dimensions, returns a crop rect
 * that fits the target aspect ratio, centered on the source.
 */
export function calculateCenteredCropRect(srcW, srcH, targetW, targetH) {
  // If no crop needed (auto height or auto width), use full image
  if (!targetW || !targetH) {
    return { x: 0, y: 0, w: 1, h: 1 };
  }

  const targetAspect = targetW / targetH;
  const srcAspect = srcW / srcH;

  let cropW, cropH;

  if (srcAspect > targetAspect) {
    // Source is wider than target: crop sides
    cropH = 1;
    cropW = (targetAspect / srcAspect);
  } else {
    // Source is taller than target: crop top/bottom
    cropW = 1;
    cropH = (srcAspect / targetAspect);
  }

  // Center the crop rectangle
  const x = (1 - cropW) / 2;
  const y = (1 - cropH) / 2;

  return { x, y, w: cropW, h: cropH };
}

/**
 * Convert normalized crop rect to pixel values.
 */
export function cropRectToPixels(cropRect, srcW, srcH) {
  return {
    sx: Math.round(cropRect.x * srcW),
    sy: Math.round(cropRect.y * srcH),
    sw: Math.round(cropRect.w * srcW),
    sh: Math.round(cropRect.h * srcH),
  };
}

/**
 * Clamp a crop rect so it stays within the image bounds (0-1).
 */
export function clampCropRect(rect) {
  const w = Math.min(rect.w, 1);
  const h = Math.min(rect.h, 1);
  const x = Math.max(0, Math.min(rect.x, 1 - w));
  const y = Math.max(0, Math.min(rect.y, 1 - h));
  return { x, y, w, h };
}
