(() => {
  /**
   * tabs.js
   * - Handles sheet tab switching (like Google Sheets tabs at the bottom).
   * - Each tab has its own sheet grid with independent data and config.
   * - Default sheet has same functionality as main sheet.
   */
  window.TabTab = window.TabTab || {};

  const { state } = TabTab;

  // Track which tab is active
  state.activeTab = 'default';

  // Store sheet data per tab (so switching tabs preserves content)
  state.tabData = {
    'tone-of-voice': null,
    'default': null
  };

  async function initTabs() {
    const tabButtons = document.querySelectorAll('.sheet-tab');
    
    tabButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const tabId = btn.dataset.tab;
        if (tabId === state.activeTab) return;
        
        await switchTab(tabId);
      });
    });

    // Load the default config and initialize the default sheet
    await TabTab.config.loadConfigForTab('default');
    initDefaultSheet();
    
    // Select first editable cell (row 2, col 0) in default sheet
    const defaultSheet = document.getElementById('sheet-default');
    const firstCell = defaultSheet?.querySelector('.cell.data-cell[data-row="2"][data-col="0"]');
    if (firstCell) {
      TabTab.selection?.selectCell?.(firstCell);
      state.selectionAnchorCell = firstCell;
    }
  }

  async function switchTab(tabId) {
    // Clear selection before switching
    if (state.selectedCell) {
      state.selectedCell.classList.remove('focused');
    }
    state.selectedCell = null;
    state.selectionRange = null;
    state.selectionAnchorCell = null;
    TabTab.outline?.hideRangeOutline?.();

    // Switch to the tab's config
    await TabTab.config.switchConfig(tabId);

    // Update active tab button
    document.querySelectorAll('.sheet-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Show/hide sheets
    document.querySelectorAll('.sheet').forEach(sheet => {
      sheet.classList.toggle('is-hidden', sheet.dataset.tab !== tabId);
    });

    // Show/hide how-to content for the active tab
    document.querySelectorAll('.howto-content').forEach(content => {
      content.classList.toggle('is-hidden', content.dataset.tab !== tabId);
    });

    state.activeTab = tabId;

    // Select first editable cell (row 2, col 0) in new sheet
    const newSheet = document.querySelector(`.sheet[data-tab="${tabId}"]`);
    const firstCell = newSheet?.querySelector('.cell.data-cell[data-row="2"][data-col="0"]');
    if (firstCell) {
      TabTab.selection?.selectCell?.(firstCell);
      state.selectionAnchorCell = firstCell;
    }
  }

  function initDefaultSheet() {
    const defaultSheet = document.getElementById('sheet-default');
    if (!defaultSheet) return;

    const { ROWS, DATA_COLS, COLS } = TabTab.consts;
    const columnHeaders = TabTab.config.getColumnHeadersForTab('default');
    const { selectCell, applyRangeSelection } = TabTab.selection;

    // Corner cell
    const corner = document.createElement('div');
    corner.className = 'cell corner';
    defaultSheet.appendChild(corner);

    // Column headers (A, B, C...) with click to select column
    for (let c = 0; c < DATA_COLS; c++) {
      const colHeader = document.createElement('div');
      colHeader.className = 'cell col-header';
      colHeader.textContent = COLS[c];
      colHeader.dataset.col = String(c);
      colHeader.addEventListener('click', () => {
        if (state.activeTab !== 'default') return;
        const top = TabTab.dom.getCell(1, c);
        const bottom = TabTab.dom.getCell(ROWS, c);
        if (!top || !bottom) return;
        state.selectionAnchorCell = top;
        selectCell(top, { preserveRange: true });
        applyRangeSelection(top, bottom);
      });
      defaultSheet.appendChild(colHeader);
    }

    // Data rows
    for (let row = 1; row <= ROWS; row++) {
      // Row header (1, 2, 3...) with click to select row
      const rowHeader = document.createElement('div');
      rowHeader.className = 'cell row-header';
      rowHeader.textContent = row;
      rowHeader.dataset.row = String(row);
      rowHeader.addEventListener('click', () => {
        if (state.activeTab !== 'default') return;
        const left = TabTab.dom.getCell(row, 0);
        const right = TabTab.dom.getCell(row, DATA_COLS - 1);
        if (!left || !right) return;
        state.selectionAnchorCell = left;
        selectCell(left, { preserveRange: true });
        applyRangeSelection(left, right);
      });
      defaultSheet.appendChild(rowHeader);

      // Data cells
      for (let col = 0; col < DATA_COLS; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell data-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.sheet = 'default';

        // Row 1 is the header row with context types
        if (row === 1) {
          cell.classList.add('tone-header');
        }

        const content = document.createElement('div');
        content.className = 'cell-content';
        
        // Set header values for row 1
        if (row === 1 && columnHeaders[col]) {
          content.textContent = columnHeaders[col];
        }
        
        cell.appendChild(content);

        const editor = document.createElement('textarea');
        editor.className = 'cell-input';
        editor.rows = 1;
        
        if (row === 1) {
          editor.placeholder = 'UI context...';
          editor.value = columnHeaders[col] || '';
        } else {
          editor.placeholder = 'Enter text...';
          editor.value = '';
        }
        
        cell.appendChild(editor);

        const fillHandle = document.createElement('div');
        fillHandle.className = 'fill-handle';
        fillHandle.addEventListener('mousedown', e => {
          if (state.activeTab !== 'default') return;
          TabTab.drag.startDrag(e, cell);
        });
        cell.appendChild(fillHandle);

        // Mousedown - prevent default for non-editing cells
        cell.addEventListener('mousedown', ev => {
          if (state.activeTab !== 'default') return;
          if (cell.classList.contains('editing')) return;
          if (ev.target?.classList?.contains('fill-handle')) return;
          ev.preventDefault();
        });

        // Click to select (with shift for range)
        cell.addEventListener('click', ev => {
          if (state.activeTab !== 'default') return;
          if (ev.shiftKey) {
            const anchor = state.selectionAnchorCell || state.selectedCell || cell;
            state.selectionAnchorCell = anchor;
            selectCell(cell, { preserveRange: true });
            applyRangeSelection(anchor, cell);
            return;
          }
          selectCell(cell);
          state.selectionAnchorCell = cell;
        });

        // Double-click to edit
        cell.addEventListener('dblclick', () => {
          if (state.activeTab !== 'default') return;
          TabTab.sheet?.startEdit?.(cell);
        });

        // Editor events
        editor.addEventListener('blur', () => {
          if (cell.classList.contains('editing')) TabTab.sheet?.stopEdit?.(cell);
        });
        editor.addEventListener('input', () => {
          if (!cell.classList.contains('editing')) return;
          TabTab.sheet?.autosizeTextarea?.(editor);
        });
        editor.addEventListener('keydown', ev => {
          if (state.activeTab !== 'default') return;
          
          // Cmd/Ctrl+Enter: generate into below cell
          if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
            ev.preventDefault();
            TabTab.sheet?.stopEdit?.(cell);
            TabTab.generation?.generateIntoBelowCell?.(cell);
            return;
          }
          // Enter: commit and move down
          if (ev.key === 'Enter' && !ev.shiftKey) {
            ev.preventDefault();
            TabTab.sheet?.stopEdit?.(cell);
            TabTab.selection?.moveSelection?.(1, 0);
            return;
          }
          // Shift+Enter: commit and move up
          if (ev.key === 'Enter' && ev.shiftKey) {
            ev.preventDefault();
            TabTab.sheet?.stopEdit?.(cell);
            TabTab.selection?.moveSelection?.(-1, 0);
            return;
          }
          // Escape: cancel edit
          if (ev.key === 'Escape') {
            ev.preventDefault();
            TabTab.sheet?.stopEdit?.(cell);
          }
        });

        defaultSheet.appendChild(cell);
      }
    }
  }

  function getActiveSheet() {
    return document.querySelector(`.sheet[data-tab="${state.activeTab}"]`);
  }

  TabTab.tabs = {
    initTabs,
    switchTab,
    getActiveSheet
  };
})();
