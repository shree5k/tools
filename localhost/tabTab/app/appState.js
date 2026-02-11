(() => {
  /**
   * appState.js
   * - Defines shared constants (ROWS/COLS) and a single shared state object.
   * - Other modules read/write `TabTab.state` instead of keeping their own globals.
   */
  window.TabTab = window.TabTab || {};

  TabTab.consts = {
    COLS: Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
    ROWS: 30, // Enough rows to fill most screens
    DATA_COLS: 26
  };

  TabTab.state = {
    isDragging: false,
    dragStartCell: null,
    dragEndCell: null,
    selectedCell: null,

    rangeOutlineEl: null,
    rangeOutlineHideTimer: null,
    currentOutlineRange: null,
    currentOutlineMode: null,

    selectionAnchorCell: null,
    selectionRange: null,

    tabTapTimer: null,
    tabTapCount: 0
  };
})();


