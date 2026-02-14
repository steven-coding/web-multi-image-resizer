import { createImageCard, updateCropRectPosition } from './image-card.js';
import { $ } from '../utils/dom.js';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 230; // approximate total height with info
const CARD_GAP = 12;
const BUFFER_ROWS = 2;

/**
 * Virtual grid manages rendering only visible image cards.
 */
export class VirtualGrid {
  constructor(containerEl, scrollParent) {
    this.container = containerEl;
    this.scrollParent = scrollParent;
    this.entries = [];
    this.settings = null;
    this.renderedCards = new Map(); // id -> DOM element
    this.scrollContainer = null;

    this._init();
    this._onScroll = this._onScroll.bind(this);
    this.scrollParent.addEventListener('scroll', this._onScroll, { passive: true });

    // Recalc on resize
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _init() {
    this.container.innerHTML = '';
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'image-grid__scroll-container';
    this.viewport = document.createElement('div');
    this.viewport.className = 'image-grid__viewport';
    this.scrollContainer.appendChild(this.viewport);
    this.container.appendChild(this.scrollContainer);
  }

  setEntries(entries, settings) {
    this.entries = entries;
    this.settings = settings;
    this._update();
  }

  addEntries(newEntries, settings) {
    this.entries = [...this.entries, ...newEntries];
    this.settings = settings;
    this._update();
  }

  removeEntry(id) {
    this.entries = this.entries.filter((e) => e.id !== id);
    const card = this.renderedCards.get(id);
    if (card) {
      card.remove();
      this.renderedCards.delete(id);
    }
    this._update();
  }

  clear() {
    this.entries = [];
    this.renderedCards.clear();
    this.viewport.innerHTML = '';
    this.scrollContainer.style.height = '0px';
  }

  getCardElement(id) {
    return this.renderedCards.get(id);
  }

  _getColumns() {
    const containerWidth = this.container.clientWidth - 32; // padding
    return Math.max(1, Math.floor((containerWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP)));
  }

  _getTotalRows() {
    const cols = this._getColumns();
    return Math.ceil(this.entries.length / cols);
  }

  _update() {
    const cols = this._getColumns();
    const totalRows = this._getTotalRows();
    const totalHeight = totalRows * (CARD_HEIGHT + CARD_GAP);
    this.scrollContainer.style.height = `${totalHeight}px`;

    this._render();
  }

  _onScroll() {
    requestAnimationFrame(() => this._render());
  }

  _onResize() {
    this._update();
  }

  _render() {
    const cols = this._getColumns();
    const scrollTop = this.scrollParent.scrollTop;
    const viewportHeight = this.scrollParent.clientHeight;
    const rowHeight = CARD_HEIGHT + CARD_GAP;

    const firstVisibleRow = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_ROWS);
    const lastVisibleRow = Math.min(
      this._getTotalRows() - 1,
      Math.ceil((scrollTop + viewportHeight) / rowHeight) + BUFFER_ROWS
    );

    const firstIndex = firstVisibleRow * cols;
    const lastIndex = Math.min(this.entries.length - 1, (lastVisibleRow + 1) * cols - 1);

    // Determine which entries should be visible
    const visibleIds = new Set();
    for (let i = firstIndex; i <= lastIndex; i++) {
      visibleIds.add(this.entries[i].id);
    }

    // Remove cards no longer visible
    for (const [id, card] of this.renderedCards) {
      if (!visibleIds.has(id)) {
        card.remove();
        this.renderedCards.delete(id);
      }
    }

    // Add cards that should be visible
    for (let i = firstIndex; i <= lastIndex; i++) {
      const entry = this.entries[i];
      if (this.renderedCards.has(entry.id)) continue;

      const card = createImageCard(entry, this.settings);
      const row = Math.floor(i / cols);
      const col = i % cols;
      card.style.position = 'absolute';
      card.style.left = `${col * (CARD_WIDTH + CARD_GAP)}px`;
      card.style.top = `${row * (CARD_HEIGHT + CARD_GAP)}px`;

      this.viewport.appendChild(card);
      this.renderedCards.set(entry.id, card);

      // Update crop rect after card is in DOM
      requestAnimationFrame(() => {
        const overlay = card.querySelector('.image-card__crop-overlay');
        const rect = card.querySelector('.image-card__crop-rect');
        if (overlay && rect) {
          updateCropRectPosition(rect, overlay, entry.cropRect);
        }
      });
    }
  }

  /**
   * Refresh all crop overlays (e.g. when dimensions change).
   */
  refreshCropOverlays() {
    for (const [id, card] of this.renderedCards) {
      const entry = this.entries.find((e) => e.id === id);
      if (!entry) continue;
      const overlay = card.querySelector('.image-card__crop-overlay');
      const rect = card.querySelector('.image-card__crop-rect');
      if (overlay && rect) {
        updateCropRectPosition(rect, overlay, entry.cropRect);
      }
    }
  }

  destroy() {
    this.scrollParent.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
  }
}
