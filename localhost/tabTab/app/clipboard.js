(() => {
  /**
   * clipboard.js
   * - Implements copy behavior for the grid:
   *   - Copies current cell text, or
   *   - Copies the selected rectangle as TSV (tabs/newlines) for easy pasting into Sheets.
   * - Includes a fallback when `navigator.clipboard` is unavailable.
   */
  window.TabTab = window.TabTab || {};

  const { state } = TabTab;
  const { getCell, getCellText } = TabTab.dom;

  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fallback for pages without clipboard permission (or file://)
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', 'true');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (e) {
        return false;
      }
    }
  }

  function getSelectedRangeTSV() {
    if (state.selectionRange) {
      const rows = [];
      for (let r = state.selectionRange.minRow; r <= state.selectionRange.maxRow; r++) {
        const cols = [];
        for (let c = state.selectionRange.minCol; c <= state.selectionRange.maxCol; c++) {
          const cell = getCell(r, c);
          cols.push(cell ? (getCellText(cell) || '') : '');
        }
        rows.push(cols.join('\t'));
      }
      return rows.join('\n');
    }
    return state.selectedCell ? (getCellText(state.selectedCell) || '') : '';
  }

  TabTab.clipboard = { copyTextToClipboard, getSelectedRangeTSV };
})();


