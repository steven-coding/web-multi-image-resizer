/**
 * Format bytes as a human-readable string.
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
}

/**
 * Sanitize a filename by removing invalid characters.
 */
export function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
}

/**
 * Get the file extension for a given output format.
 */
export function getExtension(format) {
  const map = { jpeg: 'jpg', webp: 'webp', avif: 'avif', png: 'png' };
  return map[format] || 'jpg';
}

/**
 * Get MIME type for a given format string.
 */
export function getMimeType(format) {
  const map = {
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    avif: 'image/avif',
    png: 'image/png',
  };
  return map[format] || 'image/jpeg';
}

/**
 * Get the filename stem (without extension).
 */
export function getFilenameStem(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}
