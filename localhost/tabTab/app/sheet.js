(() => {
  /**
   * sheet.js
   * - Builds the grid DOM (headers + data cells).
   * - Owns edit-mode UX:
   *   - Single click selects, double click edits
   *   - Autosizes the textarea to “hug” text while editing
   *   - Commit-on-blur and Enter/Shift+Enter navigation while editing
   */
  window.TabTab = window.TabTab || {};

  const { COLS, ROWS, DATA_COLS } = TabTab.consts;
  const { getColumnHeaderDefault } = TabTab.config;
  const { getCell, getCellEditor, getCellContentEl } = TabTab.dom;
  const { selectCell, applyRangeSelection } = TabTab.selection;

  function autosizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function startEdit(cell, { initialText } = {}) {
    if (!cell) return;
    selectCell(cell);

    const editor = getCellEditor(cell);
    if (!editor) return;

    cell.classList.add('editing');
    editor.style.display = 'block';
    editor.focus();

    if (typeof initialText === 'string') {
      editor.value = initialText;
    } else {
      editor.value = getCellContentEl(cell)?.textContent ?? editor.value;
    }

    if (typeof initialText === 'string') {
      const end = editor.value.length;
      editor.setSelectionRange?.(end, end);
    } else {
      editor.select?.();
    }

    autosizeTextarea(editor);
  }

  function stopEdit(cell) {
    if (!cell) return;
    const editor = getCellEditor(cell);
    if (!editor) return;

    // Record edit as an undoable transaction, and clear generation metadata on manual edits.
    TabTab.history.withTransaction('edit', () => {
      TabTab.history.applyCellChange(cell, {
        text: editor.value ?? '',
        meta: { sourceText: null, tone: null }
      });
    });
    cell.classList.remove('editing');
    editor.style.display = '';
    editor.style.height = '';
  }

  function initSheet() {
    const modelInput = document.getElementById('ollama-model');
    if (modelInput) modelInput.value = localStorage.getItem('ollama_model') || modelInput.value || 'llama3.2:latest';

    const sheet = document.getElementById('sheet');
    if (!sheet) return;

    // Corner
    const corner = document.createElement('div');
    corner.className = 'cell corner';
    sheet.appendChild(corner);

    // Column headers A-Z
    for (let i = 0; i < DATA_COLS; i++) {
      const colHeader = document.createElement('div');
      colHeader.className = 'cell col-header';
      colHeader.textContent = COLS[i];
      colHeader.dataset.col = String(i);
      colHeader.addEventListener('click', () => {
        const top = getCell(1, i);
        const bottom = getCell(ROWS, i);
        if (!top || !bottom) return;
        TabTab.state.selectionAnchorCell = top;
        selectCell(top, { preserveRange: true });
        applyRangeSelection(top, bottom);
      });
      sheet.appendChild(colHeader);
    }

    for (let row = 1; row <= ROWS; row++) {
      const rowHeader = document.createElement('div');
      rowHeader.className = 'cell row-header';
      rowHeader.textContent = row;
      rowHeader.dataset.row = String(row);
      rowHeader.addEventListener('click', () => {
        const left = getCell(row, 0);
        const right = getCell(row, DATA_COLS - 1);
        if (!left || !right) return;
        TabTab.state.selectionAnchorCell = left;
        selectCell(left, { preserveRange: true });
        applyRangeSelection(left, right);
      });
      sheet.appendChild(rowHeader);

      for (let col = 0; col < DATA_COLS; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell data-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        if (row === 1) cell.classList.add('tone-header');

        const content = document.createElement('div');
        content.className = 'cell-content';
        cell.appendChild(content);

        const editor = document.createElement('textarea');
        editor.className = 'cell-input';
        editor.rows = 1;

        if (row === 1) {
          editor.placeholder = 'Brand tone...';
          editor.value = getColumnHeaderDefault(col);
        } else {
          editor.placeholder = 'Enter text...';
          editor.value = '';
        }
        content.textContent = editor.value;
        cell.appendChild(editor);

        const fillHandle = document.createElement('div');
        fillHandle.className = 'fill-handle';
        fillHandle.addEventListener('mousedown', e => TabTab.drag.startDrag(e, cell));
        cell.appendChild(fillHandle);

        cell.addEventListener('mousedown', ev => {
          if (cell.classList.contains('editing')) return;
          if (ev.target?.classList?.contains('fill-handle')) return;
          ev.preventDefault();
        });

        cell.addEventListener('click', ev => {
          if (ev.shiftKey) {
            const anchor = TabTab.state.selectionAnchorCell || TabTab.state.selectedCell || cell;
            TabTab.state.selectionAnchorCell = anchor;
            selectCell(cell, { preserveRange: true });
            applyRangeSelection(anchor, cell);
            return;
          }
          selectCell(cell);
          TabTab.state.selectionAnchorCell = cell;
        });

        cell.addEventListener('dblclick', () => startEdit(cell));

        editor.addEventListener('blur', () => {
          if (cell.classList.contains('editing')) stopEdit(cell);
        });
        editor.addEventListener('input', () => {
          if (!cell.classList.contains('editing')) return;
          autosizeTextarea(editor);
        });
        editor.addEventListener('keydown', ev => {
          if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
            ev.preventDefault();
            stopEdit(cell);
            TabTab.generation.generateIntoBelowCell(cell);
            return;
          }
          if (ev.key === 'Enter' && !ev.shiftKey) {
            ev.preventDefault();
            stopEdit(cell);
            TabTab.selection.moveSelection(1, 0);
            return;
          }
          if (ev.key === 'Enter' && ev.shiftKey) {
            ev.preventDefault();
            stopEdit(cell);
            TabTab.selection.moveSelection(-1, 0);
            return;
          }
          if (ev.key === 'Escape') {
            ev.preventDefault();
            stopEdit(cell);
          }
        });

        sheet.appendChild(cell);
      }
    }
  }

  TabTab.sheet = { initSheet, autosizeTextarea, startEdit, stopEdit };
})();


