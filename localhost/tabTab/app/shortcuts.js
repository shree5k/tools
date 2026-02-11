(() => {
  /**
   * shortcuts.js
   * - Registers keyboard behavior for the grid (when NOT editing):
   *   - Arrow navigation + Shift+Arrow range expansion
   *   - Tab/Shift+Tab movement + Tab Tab to run Generate
   *   - Cmd/Ctrl+C copy, Delete clears, Enter edits, Cmd/Ctrl+Enter generate-below
   */
  window.TabTab = window.TabTab || {};

  const { state } = TabTab;
  const { copyTextToClipboard, getSelectedRangeTSV } = TabTab.clipboard;
  const { applyRangeSelection, moveSelection } = TabTab.selection;

  function registerKeyboardShortcuts() {
    document.addEventListener('keydown', ev => {
      const selectedCell = state.selectedCell;
      if (!selectedCell) return;
      if (selectedCell.classList.contains('editing')) return;

      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      // Cmd/Ctrl + Enter: generate into below cell
      if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
        ev.preventDefault();
        TabTab.generation.generateIntoBelowCell(selectedCell);
        return;
      }

      // Tab twice quickly: Generate (single Tab does nothing - use arrows to navigate)
      if (ev.key === 'Tab') {
        ev.preventDefault();

        state.tabTapCount += 1;
        if (state.tabTapTimer) clearTimeout(state.tabTapTimer);
        state.tabTapTimer = setTimeout(() => {
          state.tabTapCount = 0;
          state.tabTapTimer = null;
        }, 350);

        if (state.tabTapCount >= 2) {
          state.tabTapCount = 0;
          if (state.tabTapTimer) clearTimeout(state.tabTapTimer);
          state.tabTapTimer = null;
          TabTab.generation.generateAllCopy();
        }
        // Single Tab does nothing - no cell movement
        return;
      }

      // Copy selection
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'c' || ev.key === 'C')) {
        ev.preventDefault();
        copyTextToClipboard(getSelectedRangeTSV());
        return;
      }

      // Paste into selected cell(s)
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'v' || ev.key === 'V')) {
        ev.preventDefault();
        navigator.clipboard.readText().then(text => {
          if (!text || !state.selectedCell) return;
          
          const r = parseInt(state.selectedCell.dataset.row);
          if (r === 1) return; // Don't paste into header row
          
          // Handle multi-line/TSV paste
          const lines = text.split('\n');
          const startRow = parseInt(state.selectedCell.dataset.row);
          const startCol = parseInt(state.selectedCell.dataset.col);
          
          TabTab.history.withTransaction('paste', () => {
            lines.forEach((line, rowOffset) => {
              const cols = line.split('\t');
              cols.forEach((cellText, colOffset) => {
                const targetCell = TabTab.dom.getCell(startRow + rowOffset, startCol + colOffset);
                if (!targetCell) return;
                const targetRow = parseInt(targetCell.dataset.row);
                if (targetRow === 1) return; // Skip header row
                
                TabTab.history.applyCellChange(targetCell, {
                  text: cellText.trim(),
                  meta: { sourceText: null, tone: null }
                });
              });
            });
          });
        }).catch(() => {
          // Clipboard access denied - fall back to letting browser handle it
        });
        return;
      }

      // Delete / Backspace clears selection
      if (ev.key === 'Backspace' || ev.key === 'Delete') {
        ev.preventDefault();
        const shouldSkipCell = cell => {
          // Never delete tone/header row (row 1)
          const r = parseInt(cell?.dataset?.row);
          return r === 1;
        };

        TabTab.history.withTransaction('clear', () => {
          if (state.selectionRange) {
            for (let r = state.selectionRange.minRow; r <= state.selectionRange.maxRow; r++) {
              for (let c = state.selectionRange.minCol; c <= state.selectionRange.maxCol; c++) {
                const cell = TabTab.dom.getCell(r, c);
                if (!cell) continue;
                if (shouldSkipCell(cell)) continue;
                TabTab.history.applyCellChange(cell, { text: '', meta: { sourceText: null, tone: null } });
              }
            }
          } else {
            if (shouldSkipCell(selectedCell)) return;
            TabTab.history.applyCellChange(selectedCell, { text: '', meta: { sourceText: null, tone: null } });
          }
        });
        
        // Refresh the selection outline after cells resize
        requestAnimationFrame(() => {
          if (TabTab.outline?.refreshRangeOutline) {
            TabTab.outline.refreshRangeOutline();
          }
        });
        return;
      }

      // Undo / Redo (outside textarea edit mode)
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'z' || ev.key === 'Z')) {
        ev.preventDefault();
        if (ev.shiftKey) TabTab.history.redo();
        else TabTab.history.undo();
        return;
      }

      // Arrow navigation (+ Shift range expansion)
      const arrowMap = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1]
      };
      if (ev.key in arrowMap) {
        ev.preventDefault();
        const [dr, dc] = arrowMap[ev.key];

        if (ev.shiftKey) {
          const anchor = state.selectionAnchorCell || state.selectedCell;
          state.selectionAnchorCell = anchor;
          moveSelection(dr, dc, { preserveRange: true });
          applyRangeSelection(anchor, state.selectedCell);
        } else {
          moveSelection(dr, dc);
          state.selectionAnchorCell = state.selectedCell;
        }
        return;
      }

      // Enter edits
      if (ev.key === 'Enter') {
        ev.preventDefault();
        TabTab.sheet.startEdit(state.selectedCell);
        return;
      }

      if (ev.key === 'F2') {
        ev.preventDefault();
        TabTab.sheet.startEdit(state.selectedCell);
        return;
      }

      // Typing begins edit
      if (ev.key.length === 1 && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
        ev.preventDefault();
        TabTab.sheet.startEdit(state.selectedCell, { initialText: ev.key });
      }
    });
  }

  TabTab.shortcuts = { registerKeyboardShortcuts };
})();


