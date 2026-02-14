import { el, $ } from '../utils/dom.js';

/**
 * Create the settings panel with all accordion sections.
 * Returns { element, getSettings, onSettingsChange }
 */
export function initSettingsPanel(container, settings, onChange) {
  container.innerHTML = '';

  // === Dimensions Section ===
  const dimSection = createAccordion('Dimensions', true);
  const dimBody = dimSection.querySelector('.accordion__body');

  dimBody.appendChild(createFormRow(
    createNumberInput('Width (px)', 'target-width', settings.targetWidth, 0, 10000, 'Auto = 0'),
    createNumberInput('Height (px)', 'target-height', settings.targetHeight, 0, 10000, 'Auto = 0')
  ));

  container.appendChild(dimSection);

  // === Output Section ===
  const outSection = createAccordion('Output', true);
  const outBody = outSection.querySelector('.accordion__body');

  const formatGroup = el('div', { class: 'form-group' });
  formatGroup.appendChild(el('label', {}, 'Format'));
  const formatSelect = el('select', { id: 'output-format' });
  for (const [value, label] of [['jpeg', 'JPEG'], ['webp', 'WebP'], ['avif', 'AVIF'], ['png', 'PNG']]) {
    const opt = el('option', { value }, label);
    if (value === settings.outputFormat) opt.selected = true;
    formatSelect.appendChild(opt);
  }
  formatGroup.appendChild(formatSelect);
  outBody.appendChild(formatGroup);

  const qualityGroup = el('div', { class: 'form-group' });
  qualityGroup.appendChild(el('label', {}, `Quality: ${settings.quality}%`));
  const qualitySlider = el('input', {
    type: 'range', id: 'quality', min: '1', max: '100', value: String(settings.quality)
  });
  qualityGroup.appendChild(qualitySlider);
  outBody.appendChild(qualityGroup);

  container.appendChild(outSection);

  // === Rename Section ===
  const renameSection = createAccordion('Rename', false);
  const renameBody = renameSection.querySelector('.accordion__body');

  renameBody.appendChild(createCheckbox('Enable renaming', 'rename-enabled', settings.rename.enabled));

  const patternGroup = el('div', { class: 'form-group' });
  patternGroup.appendChild(el('label', {}, 'Pattern (xxx = number, ORIGINAL-NAME = name)'));
  patternGroup.appendChild(el('input', { type: 'text', id: 'rename-pattern', value: settings.rename.pattern }));
  renameBody.appendChild(patternGroup);

  renameBody.appendChild(createNumberInput('Start number', 'rename-start', settings.rename.startNumber, 0, 99999));

  const previewEl = el('div', { class: 'form-group' });
  previewEl.appendChild(el('label', {}, 'Preview'));
  const previewText = el('div', { class: 'image-card__meta', id: 'rename-preview' });
  previewEl.appendChild(previewText);
  renameBody.appendChild(previewEl);

  container.appendChild(renameSection);

  // === Event wiring ===
  function emitChange() {
    const s = collectSettings();
    onChange(s);
  }

  // Listen to all inputs
  container.addEventListener('input', emitChange);
  container.addEventListener('change', emitChange);

  // Quality label update
  qualitySlider.addEventListener('input', () => {
    qualityGroup.querySelector('label').textContent = `Quality: ${qualitySlider.value}%`;
  });

  // Rename preview update
  function updateRenamePreview() {
    const pattern = $('#rename-pattern').value;
    const start = parseInt($('#rename-start')?.value) || 1;
    const ext = formatSelect.value === 'png' ? 'png' : formatSelect.value === 'webp' ? 'webp' : formatSelect.value === 'avif' ? 'avif' : 'jpg';
    const lines = [];
    for (let i = 0; i < 3; i++) {
      const num = start + i;
      const padLen = (pattern.match(/x+/)?.[0] || 'xxx').length;
      const padded = String(num).padStart(padLen, '0');
      lines.push(pattern.replace(/x+/, padded).replace(/ORIGINAL-NAME/g, 'foto') + '.' + ext);
    }
    previewText.textContent = lines.join(', ') + '…';
  }

  container.addEventListener('input', updateRenamePreview);
  updateRenamePreview();

  function collectSettings() {
    return {
      targetWidth: parseInt($('#target-width').value) || 0,
      targetHeight: parseInt($('#target-height').value) || 0,
      maintainAspectRatio: true,
      outputFormat: formatSelect.value,
      quality: parseInt(qualitySlider.value),
      border: {
        enabled: false,
        size: 0,
        color: '#000000',
      },
      watermark: {
        enabled: false,
        text: '',
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffffff',
        opacity: 50,
        position: 'bottom-right',
      },
      rename: {
        enabled: $('#rename-enabled').checked,
        pattern: $('#rename-pattern').value,
        startNumber: parseInt($('#rename-start').value) || 1,
      },
    };
  }

  return { collectSettings };
}

// === Helper functions ===

function createAccordion(title, open) {
  const acc = el('div', { class: `accordion${open ? ' open' : ''}` });
  const header = el('div', { class: 'accordion__header' });
  header.appendChild(el('span', {}, title));
  header.innerHTML += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
  header.addEventListener('click', () => acc.classList.toggle('open'));
  acc.appendChild(header);
  acc.appendChild(el('div', { class: 'accordion__body' }));
  return acc;
}

function createNumberInput(label, id, value, min = 0, max = 99999, placeholder = '') {
  const group = el('div', { class: 'form-group' });
  group.appendChild(el('label', { for: id }, label));
  group.appendChild(el('input', {
    type: 'number', id, value: String(value), min: String(min), max: String(max), placeholder
  }));
  return group;
}

function createColorInput(label, id, value) {
  const group = el('div', { class: 'form-group' });
  group.appendChild(el('label', { for: id }, label));
  group.appendChild(el('input', { type: 'color', id, value }));
  return group;
}

function createCheckbox(label, id, checked) {
  const row = el('label', { class: 'checkbox-row' });
  const input = el('input', { type: 'checkbox', id });
  if (checked) input.checked = true;
  row.appendChild(input);
  row.appendChild(document.createTextNode(label));
  return el('div', { class: 'form-group' }, row);
}

function createFormRow(...children) {
  const row = el('div', { class: 'form-row' });
  for (const child of children) row.appendChild(child);
  return row;
}
