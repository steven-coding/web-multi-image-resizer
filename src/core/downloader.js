import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Download all processed images as a ZIP.
 */
export async function downloadAllAsZip(entries, onProgress) {
  const zip = new JSZip();
  const processed = entries.filter((e) => e.processed);

  if (processed.length === 0) return;

  for (let i = 0; i < processed.length; i++) {
    const entry = processed[i];
    onProgress?.({ current: i + 1, total: processed.length });
    zip.file(entry.outputName, entry.processed);
  }

  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 1 } },
    (meta) => {
      onProgress?.({ current: meta.percent | 0, total: 100, zipping: true });
    }
  );

  saveAs(blob, 'images.zip');
}

/**
 * Download a single processed image.
 */
export function downloadSingle(entry) {
  if (!entry.processed) return;
  saveAs(entry.processed, entry.outputName);
}
