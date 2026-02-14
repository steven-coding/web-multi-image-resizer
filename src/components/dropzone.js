import { $ } from '../utils/dom.js';

/**
 * Initialize the dropzone component.
 * @param {Function} onFiles - callback with FileList
 */
export function initDropzone(onFiles) {
  const dropzone = $('#dropzone');
  const fileInput = $('#file-input');
  const btnAdd = $('#btn-add');

  // Click to open file picker
  dropzone.addEventListener('click', () => fileInput.click());
  btnAdd.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      onFiles([...fileInput.files]);
      fileInput.value = '';
    }
  });

  // Drag & drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) onFiles(files);
  });

  // Also allow drop on the whole content area when images exist
  const content = $('#content');
  content.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  content.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) onFiles(files);
  });
}

export function showDropzone(show) {
  const dropzone = $('#dropzone');
  const grid = $('#image-grid');
  dropzone.hidden = !show;
  grid.hidden = show;
}
