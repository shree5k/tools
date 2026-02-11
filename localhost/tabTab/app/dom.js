(() => {
  /**
   * dom.js
   * - Tiny DOM helpers around the grid.
   * - Centralizes how we locate a cell and how we read/write cell text.
   * - Tab-aware: getCell finds cells in the currently active sheet.
   */
  window.TabTab = window.TabTab || {};

  const dom = {
    /**
     * Get the currently active sheet element
     */
    getActiveSheet() {
      const activeTab = TabTab.state?.activeTab || 'tone-of-voice';
      return document.querySelector(`.sheet[data-tab="${activeTab}"]`) || document.getElementById('sheet');
    },

    /**
     * Get a cell by row/col from the active sheet
     */
    getCell(row, col) {
      const sheet = dom.getActiveSheet();
      return sheet?.querySelector(`.cell.data-cell[data-row="${row}"][data-col="${col}"]`) || null;
    },

    /**
     * Get a cell from a specific sheet by tab ID
     */
    getCellInSheet(row, col, tabId) {
      const sheet = document.querySelector(`.sheet[data-tab="${tabId}"]`);
      return sheet?.querySelector(`.cell.data-cell[data-row="${row}"][data-col="${col}"]`) || null;
    },

    getCellEditor(cell) {
      return cell?.querySelector('.cell-input') || null;
    },

    getCellContentEl(cell) {
      return cell?.querySelector('.cell-content') || null;
    },

    getCellText(cell) {
      const editor = dom.getCellEditor(cell);
      if (editor) return (editor.value || '').trim();
      const content = dom.getCellContentEl(cell);
      return (content?.textContent || '').trim();
    },

    setCellText(cell, text) {
      const editor = dom.getCellEditor(cell);
      const content = dom.getCellContentEl(cell);
      if (editor) editor.value = text ?? '';
      if (content) content.textContent = text ?? '';
    }
  };

  TabTab.dom = dom;
})();
