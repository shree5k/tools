(() => {
  /**
   * selection.js
   * - Owns single-cell selection and rectangular range selection.
   * - Handles visual classes (`focused`, `range-selected`) and calls `outline.showRangeOutline(...)`.
   */
  window.TabTab = window.TabTab || {};

  const { state } = TabTab;
  const { ROWS, DATA_COLS } = TabTab.consts;
  const { getCell, getCellText } = TabTab.dom;
  const { hideRangeOutline, showRangeOutline } = TabTab.outline;

  function clearFillPreview() {
    document.querySelectorAll('.fill-preview').forEach(c => c.classList.remove('fill-preview'));
  }

  function clearRangeSelection() {
    const sheet = TabTab.dom?.getActiveSheet?.() || document;
    sheet.querySelectorAll('.range-selected').forEach(c => c.classList.remove('range-selected'));
    state.selectionAnchorCell = null;
    state.selectionRange = null;
    hideRangeOutline();
  }

  function applyRangeSelection(anchorCell, activeCell) {
    if (!anchorCell || !activeCell) return;

    const ar = parseInt(anchorCell.dataset.row);
    const ac = parseInt(anchorCell.dataset.col);
    const rr = parseInt(activeCell.dataset.row);
    const rc = parseInt(activeCell.dataset.col);
    if ([ar, ac, rr, rc].some(Number.isNaN)) return;

    const minRow = Math.min(ar, rr);
    const maxRow = Math.max(ar, rr);
    const minCol = Math.min(ac, rc);
    const maxCol = Math.max(ac, rc);

    const sheet = TabTab.dom?.getActiveSheet?.() || document;
    sheet.querySelectorAll('.range-selected').forEach(c => c.classList.remove('range-selected'));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = getCell(r, c);
        if (cell) cell.classList.add('range-selected');
      }
    }

    state.selectionRange = {
      minRow,
      minCol,
      maxRow,
      maxCol,
      anchorRow: ar,
      anchorCol: ac,
      activeRow: rr,
      activeCol: rc
    };

    showRangeOutline({ minRow, minCol, maxRow, maxCol, mode: 'final' });
  }

  function selectCell(cell, { preserveRange = false } = {}) {
    if (!cell) return;

    // Commit any active edit when selecting another cell
    if (state.selectedCell && state.selectedCell !== cell && state.selectedCell.classList.contains('editing')) {
      TabTab.sheet.stopEdit(state.selectedCell);
    }

    if (!preserveRange && !state.isDragging) clearRangeSelection();

    const sheet = TabTab.dom?.getActiveSheet?.() || document;
    sheet.querySelectorAll('.cell.data-cell').forEach(c => c.classList.remove('focused'));
    cell.classList.add('focused');
    state.selectedCell = cell;
  }

  function moveSelection(deltaRow, deltaCol, { preserveRange = false } = {}) {
    if (!state.selectedCell) return;

    const row = parseInt(state.selectedCell.dataset.row);
    const col = parseInt(state.selectedCell.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return;

    const nextRow = Math.max(1, Math.min(ROWS, row + deltaRow));
    const nextCol = Math.max(0, Math.min(DATA_COLS - 1, col + deltaCol));
    const nextCell = getCell(nextRow, nextCol);
    if (nextCell) selectCell(nextCell, { preserveRange });
  }

  // Expose helpers used across modules
  TabTab.selection = {
    clearFillPreview,
    clearRangeSelection,
    applyRangeSelection,
    selectCell,
    moveSelection,
    getSelectedCellText: () => (state.selectedCell ? getCellText(state.selectedCell) : '')
  };
})();


