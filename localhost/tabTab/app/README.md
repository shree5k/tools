# `app/` module map (Tab Tab)

This folder contains small, focused modules that cooperate via the global `window.TabTab` namespace (simple, framework-free, works with plain `<script>` tags).

## Loading order (see `index.html`)
- `appState.js` → `config.js` → `dom.js` → `outline.js` → `selection.js` → `clipboard.js` → `generation.js` → `drag.js` → `sheet.js` → `shortcuts.js` → `ui.js` → `init.js`

## What each file is for
- **`appState.js`**: App constants (`ROWS`, `DATA_COLS`, `COLS`) and shared mutable state (`selectedCell`, drag state, range selection state).
- **`config.js`**: Loads `config.json` and provides prompt helpers (`getColumnHeaderDefault`, `buildUserPrompt`, tone guidance).
- **`dom.js`**: DOM helpers around cells (get cell, read/write text, access editor/content elements).
- **`outline.js`**: Draws the continuous selection/drag outline overlay (`.range-outline`) and keeps it in sync with layout changes.
- **`selection.js`**: Single-cell selection + range selection (Shift+Click / Shift+Arrow) and preview helpers.
- **`clipboard.js`**: Copy behavior (Cmd/Ctrl+C) including TSV formatting for ranges + clipboard fallback.
- **`generation.js`**: All generation logic (Ollama API calls, Generate button behavior, drag-fill generation, Cmd/Ctrl+Enter generate-below).
- **`drag.js`**: Fill-handle drag interaction (preview range while dragging, trigger fill on drop).
- **`sheet.js`**: Builds the grid and owns “edit mode” (double click / Enter to edit, autosize textarea).
- **`shortcuts.js`**: Keyboard shortcuts & navigation (arrows, Tab/Shift+Tab, Tab Tab to Generate, delete, type-to-edit).
- **`ui.js`**: UI-only helpers (currently the “How to?” popover open/close behavior).
- **`init.js`**: Bootstraps the app (load config, build grid, register shortcuts) and wires global handlers used by HTML attributes.


