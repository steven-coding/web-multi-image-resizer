import { $ } from '../utils/dom.js';

/**
 * Initialize toolbar buttons.
 */
export function initToolbar({ onProcess, onDownload, onClear }) {
  const btnProcess = $('#btn-process');
  const btnDownload = $('#btn-download');
  const btnClear = $('#btn-clear');

  btnProcess.addEventListener('click', onProcess);
  btnDownload.addEventListener('click', onDownload);
  btnClear.addEventListener('click', () => {
    if (confirm('Alle Bilder entfernen?')) onClear();
  });
}

export function updateToolbarState(imageCount, hasProcessed) {
  const btnProcess = $('#btn-process');
  const btnDownload = $('#btn-download');
  const btnClear = $('#btn-clear');

  btnProcess.disabled = imageCount === 0;
  btnDownload.disabled = !hasProcessed;
  btnClear.disabled = imageCount === 0;
}

export function setProcessing(active) {
  const btnProcess = $('#btn-process');
  const btnAdd = $('#btn-add');

  if (active) {
    btnProcess.disabled = true;
    btnProcess.querySelector('span').textContent = 'Verarbeite…';
    btnAdd.disabled = true;
  } else {
    btnProcess.disabled = false;
    btnProcess.querySelector('span').textContent = 'Verarbeiten';
    btnAdd.disabled = false;
  }
}

export function showProgress(show, current = 0, total = 0, text = '') {
  const bar = $('#progress-bar');
  const fill = $('#progress-fill');
  const textEl = $('#progress-text');

  bar.hidden = !show;

  if (show) {
    const percent = total > 0 ? (current / total) * 100 : 0;
    fill.style.width = `${percent}%`;
    textEl.textContent = text || `${current} / ${total}`;
  }
}

export function updateStatus(text) {
  $('#status-text').textContent = text;
}
