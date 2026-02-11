(() => {
  /**
   * history.js
   * - Lightweight undo stack for grid operations when not in a textarea's native undo.
   * - Records transactions of cell text + metadata changes and replays them on Cmd/Ctrl+Z.
   *
   * What it tracks per cell:
   * - text (via TabTab.dom.setCellText)
   * - dataset.sourceText / dataset.tone (used for generation/series behavior)
   */
  window.TabTab = window.TabTab || {};

  const { getCellText, setCellText } = TabTab.dom;

  const undoStack = [];
  const redoStack = [];
  let currentTx = null;
  let isApplying = false;

  function snapshotMeta(cell) {
    return {
      sourceText: cell?.dataset?.sourceText ?? null,
      tone: cell?.dataset?.tone ?? null
    };
  }

  function applyMeta(cell, meta) {
    if (!cell || !meta) return;
    if (meta.sourceText == null) delete cell.dataset.sourceText;
    else cell.dataset.sourceText = meta.sourceText;

    if (meta.tone == null) delete cell.dataset.tone;
    else cell.dataset.tone = meta.tone;
  }

  function beginTransaction(label = '') {
    if (isApplying) return;
    if (currentTx) return;
    currentTx = { label, changes: new Map() };
  }

  function endTransaction() {
    if (isApplying) return;
    if (!currentTx) return;
    if (currentTx.changes.size > 0) {
      undoStack.push(currentTx);
      redoStack.length = 0;
    }
    currentTx = null;
  }

  function withTransaction(label, fn) {
    beginTransaction(label);
    try {
      return fn();
    } finally {
      endTransaction();
    }
  }

  function recordCellChange(cell, { beforeText, afterText, beforeMeta, afterMeta } = {}) {
    if (isApplying) return;
    if (!cell) return;
    if (!currentTx) beginTransaction('auto');

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return;
    const key = `${row}:${col}`;

    const existing = currentTx.changes.get(key);
    if (!existing) {
      currentTx.changes.set(key, {
        cellRef: { row, col },
        beforeText: beforeText ?? getCellText(cell),
        afterText: afterText ?? getCellText(cell),
        beforeMeta: beforeMeta ?? snapshotMeta(cell),
        afterMeta: afterMeta ?? snapshotMeta(cell)
      });
      return;
    }

    // Keep earliest before*, update latest after*
    existing.afterText = afterText ?? getCellText(cell);
    existing.afterMeta = afterMeta ?? snapshotMeta(cell);
  }

  /**
   * Apply a cell update and record it in the current transaction.
   * Use `beforeText/beforeMeta` to avoid recording transient states (e.g. "Writing...").
   */
  function applyCellChange(cell, { text, meta, beforeText, beforeMeta } = {}) {
    if (!cell) return;
    const bt = beforeText ?? getCellText(cell);
    const bm = beforeMeta ?? snapshotMeta(cell);

    setCellText(cell, text ?? '');
    applyMeta(cell, meta ?? snapshotMeta(cell));

    const at = getCellText(cell);
    const am = snapshotMeta(cell);
    recordCellChange(cell, { beforeText: bt, afterText: at, beforeMeta: bm, afterMeta: am });
  }

  function undo() {
    if (isApplying) return;
    const tx = undoStack.pop();
    if (!tx) return;

    isApplying = true;
    try {
      // Reverse apply per cell
      for (const change of tx.changes.values()) {
        const cell = TabTab.dom.getCell(change.cellRef.row, change.cellRef.col);
        if (!cell) continue;
        setCellText(cell, change.beforeText ?? '');
        applyMeta(cell, change.beforeMeta ?? { sourceText: null, tone: null });
      }
    } finally {
      isApplying = false;
    }

    redoStack.push(tx);
  }

  function redo() {
    if (isApplying) return;
    const tx = redoStack.pop();
    if (!tx) return;

    isApplying = true;
    try {
      for (const change of tx.changes.values()) {
        const cell = TabTab.dom.getCell(change.cellRef.row, change.cellRef.col);
        if (!cell) continue;
        setCellText(cell, change.afterText ?? '');
        applyMeta(cell, change.afterMeta ?? { sourceText: null, tone: null });
      }
    } finally {
      isApplying = false;
    }

    undoStack.push(tx);
  }

  TabTab.history = {
    beginTransaction,
    endTransaction,
    withTransaction,
    recordCellChange,
    applyCellChange,
    undo,
    redo
  };
})();


