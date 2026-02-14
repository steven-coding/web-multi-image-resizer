/**
 * Create an offscreen canvas with given dimensions.
 */
export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Convert canvas to Blob.
 */
export function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to encode as ${mimeType}`));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Create a thumbnail ImageBitmap from a File, fitting within maxSize.
 */
export async function createThumbnail(file, maxSize = 200) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  let thumbW, thumbH;
  if (width > height) {
    thumbW = Math.min(width, maxSize);
    thumbH = Math.round((height / width) * thumbW);
  } else {
    thumbH = Math.min(height, maxSize);
    thumbW = Math.round((width / height) * thumbH);
  }

  const canvas = createCanvas(thumbW, thumbH);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, thumbW, thumbH);
  bitmap.close();

  return { canvas, width, height };
}
