(() => {
  /**
   * outline.js
   * - Draws the continuous rectangular outline overlay for selection/drag ranges.
   * - Uses `TabTab.state.rangeOutlineEl` and updates its position on the next frame.
   */
  window.TabTab = window.TabTab || {};

  const { state } = TabTab;
  const { getCell } = TabTab.dom;

  function ensureRangeOutline() {
    if (state.rangeOutlineEl) return state.rangeOutlineEl;
    const container = document.querySelector('.sheet-container');
    if (!container) return null;
    state.rangeOutlineEl = document.createElement('div');
    state.rangeOutlineEl.className = 'range-outline';
    container.appendChild(state.rangeOutlineEl);
    return state.rangeOutlineEl;
  }

  function hideRangeOutline() {
    if (!state.rangeOutlineEl) return;
    state.rangeOutlineEl.style.display = 'none';
    state.rangeOutlineEl.classList.remove('dragging', 'final');
    state.currentOutlineRange = null;
    state.currentOutlineMode = null;
  }

  function refreshRangeOutline() {
    if (!state.rangeOutlineEl || !state.currentOutlineRange || !state.currentOutlineMode) return;

    const { minRow, minCol, maxRow, maxCol } = state.currentOutlineRange;
    const mode = state.currentOutlineMode;

    const container = document.querySelector('.sheet-container');
    const topLeft = getCell(minRow, minCol);
    const bottomRight = getCell(maxRow, maxCol);
    if (!container || !topLeft || !bottomRight) return;

    const containerRect = container.getBoundingClientRect();
    const tl = topLeft.getBoundingClientRect();
    const br = bottomRight.getBoundingClientRect();

    state.rangeOutlineEl.style.left = `${Math.round(tl.left - containerRect.left)}px`;
    state.rangeOutlineEl.style.top = `${Math.round(tl.top - containerRect.top)}px`;
    state.rangeOutlineEl.style.width = `${Math.round(br.right - tl.left)}px`;
    state.rangeOutlineEl.style.height = `${Math.round(br.bottom - tl.top)}px`;
    state.rangeOutlineEl.style.display = 'block';

    state.rangeOutlineEl.classList.remove('dragging', 'final');
    if (mode === 'dragging') state.rangeOutlineEl.classList.add('dragging');
    if (mode === 'final') state.rangeOutlineEl.classList.add('final');
  }

  function showRangeOutline({ minRow, minCol, maxRow, maxCol, mode }) {
    const outline = ensureRangeOutline();
    if (!outline) return;

    if (state.rangeOutlineHideTimer) {
      clearTimeout(state.rangeOutlineHideTimer);
      state.rangeOutlineHideTimer = null;
    }

    state.currentOutlineRange = { minRow, minCol, maxRow, maxCol };
    state.currentOutlineMode = mode;
    requestAnimationFrame(() => refreshRangeOutline());
  }

  TabTab.outline = { showRangeOutline, hideRangeOutline, refreshRangeOutline };
})();


