(() => {
  /**
   * drag.js
   * - Fill-handle drag interaction:
   *   - Shows a preview range while dragging
   *   - On drop, triggers generation into the selected rectangle via `generation.fillDraggedRange`
   * - Keeps the “dot” on the origin cell during drag via `body.is-dragging-range` CSS.
   */
  window.TabTab = window.TabTab || {};

  const { state } = TabTab;
  const { getCell } = TabTab.dom;
  const { clearFillPreview, selectCell } = TabTab.selection;
  const { showRangeOutline, hideRangeOutline } = TabTab.outline;

  function startDrag(e, cell) {
    e.preventDefault();
    e.stopPropagation();

    state.isDragging = true;
    state.dragStartCell = cell;
    state.dragEndCell = null;
    document.body.classList.add('is-dragging-range');
    state.dragStartCell.classList.add('drag-origin');

    // End edit mode before dragging
    if (cell.classList.contains('editing')) TabTab.sheet.stopEdit(cell);
    selectCell(cell);

    const startRow = parseInt(cell.dataset.row);
    const startCol = parseInt(cell.dataset.col);
    showRangeOutline({ minRow: startRow, minCol: startCol, maxRow: startRow, maxCol: startCol, mode: 'dragging' });

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
  }

  function onDragMove(e) {
    if (!state.isDragging) return;

    const target = document.elementFromPoint(e.clientX, e.clientY);
    const cell = target?.closest('.cell.data-cell');
    if (!cell || !cell.dataset.row || !cell.dataset.col) return;

    const startRow = parseInt(state.dragStartCell.dataset.row);
    const startCol = parseInt(state.dragStartCell.dataset.col);
    const endRow = parseInt(cell.dataset.row);
    const endCol = parseInt(cell.dataset.col);

    if (state.dragEndCell && state.dragEndCell.dataset.row === cell.dataset.row && state.dragEndCell.dataset.col === cell.dataset.col) return;

    clearFillPreview();

    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r === startRow && c === startCol) continue;
        const previewCell = getCell(r, c);
        if (previewCell) previewCell.classList.add('fill-preview');
      }
    }

    showRangeOutline({ minRow, minCol, maxRow, maxCol, mode: 'dragging' });
    state.dragEndCell = cell;
  }

  async function onDragEnd() {
    if (!state.isDragging) return;

    state.isDragging = false;
    document.body.classList.remove('is-dragging-range');
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    if (state.dragStartCell) state.dragStartCell.classList.remove('drag-origin');

    if (state.dragEndCell && state.dragStartCell) {
      const startRow = parseInt(state.dragStartCell.dataset.row);
      const startCol = parseInt(state.dragStartCell.dataset.col);
      const endRow = parseInt(state.dragEndCell.dataset.row);
      const endCol = parseInt(state.dragEndCell.dataset.col);

      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);

      showRangeOutline({ minRow, minCol, maxRow, maxCol, mode: 'final' });

      if (state.dragEndCell !== state.dragStartCell) selectCell(state.dragEndCell);
      await TabTab.generation.fillDraggedRange({ startRow, startCol, minRow, maxRow, minCol, maxCol });
    }

    clearFillPreview();
    state.dragStartCell = null;
    state.dragEndCell = null;

    if (state.rangeOutlineHideTimer) clearTimeout(state.rangeOutlineHideTimer);
    state.rangeOutlineHideTimer = setTimeout(() => {
      hideRangeOutline();
      state.rangeOutlineHideTimer = null;
    }, 1200);
  }

  TabTab.drag = { startDrag };
})();


