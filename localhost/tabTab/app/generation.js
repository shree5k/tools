(() => {
  /**
   * generation.js
   * - All “generate copy” behavior lives here:
   *   - Calls Ollama (`/api/chat`) with prompts from `config.json`
   *   - Drag-fill generation (`fillDraggedRange`)
   *   - Button/TabTab “Generate” (`generateAllCopy`, which appends to next empty row)
   *   - Cmd/Ctrl+Enter generates into the cell below (`generateIntoBelowCell`)
   */
  window.TabTab = window.TabTab || {};

  const { state } = TabTab;
  const { ROWS, DATA_COLS } = TabTab.consts;
  const { getCell, getCellContentEl, getCellText, setCellText } = TabTab.dom;
  const { selectCell } = TabTab.selection;
  const { showRangeOutline } = TabTab.outline;

  function saveOllamaModel(model) {
    localStorage.setItem('ollama_model', (model || '').trim());
  }

  function saveOpenAIKey(key) {
    localStorage.setItem('openai_api_key', (key || '').trim());
  }

  function saveClaudeKey(key) {
    localStorage.setItem('claude_api_key', (key || '').trim());
  }

  function saveGeminiKey(key) {
    localStorage.setItem('gemini_api_key', (key || '').trim());
  }

  function getProvider() {
    return (localStorage.getItem('provider') || document.getElementById('provider-select')?.value || 'ollama').trim();
  }

  function getOpenAIModel() {
    return (localStorage.getItem('openai_model') || document.getElementById('openai-model-select')?.value || 'gpt-4o-mini').trim();
  }

  function getClaudeModel() {
    return (localStorage.getItem('claude_model') || document.getElementById('claude-model-select')?.value || 'claude-3-5-sonnet-latest').trim();
  }

  function getOpenAIKey() {
    return (localStorage.getItem('openai_api_key') || document.getElementById('openai-api-key')?.value || '').trim();
  }

  function getClaudeKey() {
    return (localStorage.getItem('claude_api_key') || document.getElementById('claude-api-key')?.value || '').trim();
  }

  function getGeminiKey() {
    return (localStorage.getItem('gemini_api_key') || document.getElementById('gemini-api-key')?.value || '').trim();
  }

  function getGeminiModel() {
    // Clear invalid cached model names from older versions
    const cached = localStorage.getItem('gemini_model');
    if (cached && cached.includes('-latest')) {
      localStorage.removeItem('gemini_model');
    }
    return (localStorage.getItem('gemini_model') || document.getElementById('gemini-model-select')?.value || '').trim();
  }

  /**
   * Fetch available Gemini models from the API and populate the dropdown.
   * Only shows models that support generateContent.
   */
  async function fetchGeminiModels(apiKey) {
    if (!apiKey) return;
    const select = document.getElementById('gemini-model-select');
    if (!select) return;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await res.json();
      if (!res.ok || !data.models) return;

      // Filter to models that support generateContent
      const generateModels = data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''))
        .sort();

      if (generateModels.length === 0) return;

      // Remember current selection
      const current = select.value;

      // Rebuild dropdown
      select.innerHTML = '';
      generateModels.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      });

      // Restore selection if still available, otherwise pick first
      if (generateModels.includes(current)) {
        select.value = current;
      } else {
        select.value = generateModels[0];
      }
      localStorage.setItem('gemini_model', select.value);
    } catch (e) {
      console.warn('Failed to fetch Gemini models:', e);
    }
  }

  function getOllamaModel() {
    return (localStorage.getItem('ollama_model') || document.getElementById('ollama-model')?.value || '').trim();
  }

  function getToneForCol(col) {
    const toneCell = getCell(1, col);
    return toneCell ? getCellText(toneCell) : '';
  }

  // Loading text options for cells (randomly picked)
  const LOADING_TEXTS = [
    'Writing...',
    'Words go brrr...'
  ];
  
  function getRandomLoadingText() {
    return LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)];
  }

  // Minimum time to show loading text so shimmer is visible
  const MIN_SHIMMER_TIME = 500; // ms - at least ~1 shimmer cycle

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up model output - strip markdown formatting and wrapper phrases
   */
  function cleanupModelOutput(text) {
    if (!text) return '';
    
    let cleaned = text;
    
    // Strip markdown bold/italic
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
    
    // Strip common wrapper phrases at the start
    cleaned = cleaned
      .replace(/^(Here is|Here's|This is|I've rewritten|I have rewritten|Rewritten|The rewritten)[^:\n]*[:\n]\s*/i, '')
      .replace(/^(Output|Result|Answer)[:\n]\s*/i, '');
    
    // Strip trailing instruction echoes
    cleaned = cleaned
      .replace(/\s*Same meaning[,.]?\s*different wording\.?\s*$/i, '')
      .replace(/\s*Keep(ing)? the same meaning\.?\s*$/i, '')
      .replace(/\s*Return only the rewritten text\.?\s*$/i, '');
    
    // Strip code blocks if present
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
    
    // Take only the first non-empty line if multiple lines with headers
    const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length > 1) {
      // If first line looks like a label, skip it
      const firstLine = lines[0];
      if (firstLine.endsWith(':') || /^(Rewritten|Output|Result|Here)/i.test(firstLine)) {
        cleaned = lines.slice(1).join('\n').trim();
      }
    }
    
    return cleaned.trim();
  }

  async function generateWithOllama({ model, tone, inputText }) {
    const systemPrompt =
      TabTab.config.appConfig?.prompts?.system ||
      'You rewrite UX copy into the requested tone. Return only the rewritten text, nothing else.';
    const userPrompt = TabTab.config.buildUserPrompt(tone, inputText);
    const temperature = TabTab.config.appConfig?.generationSettings?.temperature ?? 0.85;

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        options: { temperature }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data?.error || `Request failed (${response.status})`;
      throw new Error(msg);
    }

    let generated = data?.message?.content?.trim() || '';
    if ((generated.startsWith('"') && generated.endsWith('"')) || (generated.startsWith("'") && generated.endsWith("'"))) {
      generated = generated.slice(1, -1).trim();
    }
    generated = cleanupModelOutput(generated);
    if (!generated) throw new Error('Empty response from Ollama');
    return generated;
  }

  async function generateWithOpenAI({ model, apiKey, tone, inputText }) {
    const systemPrompt =
      TabTab.config.appConfig?.prompts?.system ||
      'You rewrite UX copy into the requested tone. Return only the rewritten text, nothing else.';
    const userPrompt = TabTab.config.buildUserPrompt(tone, inputText);
    const temperature = TabTab.config.appConfig?.generationSettings?.temperature ?? 0.85;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data?.error?.message || `Request failed (${response.status})`;
      throw new Error(msg);
    }

    let generated = data?.choices?.[0]?.message?.content?.trim() || '';
    if ((generated.startsWith('"') && generated.endsWith('"')) || (generated.startsWith("'") && generated.endsWith("'"))) {
      generated = generated.slice(1, -1).trim();
    }
    generated = cleanupModelOutput(generated);
    if (!generated) throw new Error('Empty response from OpenAI');
    return generated;
  }

  async function generateWithClaude({ model, apiKey, tone, inputText }) {
    const systemPrompt =
      TabTab.config.appConfig?.prompts?.system ||
      'You rewrite UX copy into the requested tone. Return only the rewritten text, nothing else.';
    const userPrompt = TabTab.config.buildUserPrompt(tone, inputText);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Note: required by Anthropic to allow direct browser calls (not recommended for production)
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data?.error?.message || data?.error || `Request failed (${response.status})`;
      throw new Error(msg);
    }

    let generated = (data?.content || [])
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('')
      .trim();

    if ((generated.startsWith('"') && generated.endsWith('"')) || (generated.startsWith("'") && generated.endsWith("'"))) {
      generated = generated.slice(1, -1).trim();
    }
    generated = cleanupModelOutput(generated);
    if (!generated) throw new Error('Empty response from Claude');
    return generated;
  }

  async function generateWithGemini({ model, apiKey, tone, inputText }) {
    const systemPrompt =
      TabTab.config.appConfig?.prompts?.system ||
      'You rewrite UX copy into the requested tone. Return only the rewritten text, nothing else.';
    const userPrompt = TabTab.config.buildUserPrompt(tone, inputText);
    
    // Combine system + user prompt since v1 API handles system instructions differently
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: combinedPrompt }]
        }],
        generationConfig: {
          temperature: TabTab.config.appConfig?.generationSettings?.temperature ?? 0.85
        }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data?.error?.message || `Request failed (${response.status})`;
      throw new Error(msg);
    }

    let generated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if ((generated.startsWith('"') && generated.endsWith('"')) || (generated.startsWith("'") && generated.endsWith("'"))) {
      generated = generated.slice(1, -1).trim();
    }
    generated = cleanupModelOutput(generated);
    if (!generated) throw new Error('Empty response from Gemini');
    return generated;
  }

  async function generateCopy({ tone, inputText }) {
    const provider = getProvider();
    if (provider === 'ollama') {
      const model = getOllamaModel();
      if (!model) throw new Error('Please choose an Ollama model first.');
      return await generateWithOllama({ model, tone, inputText });
    }
    if (provider === 'openai') {
      const apiKey = getOpenAIKey();
      if (!apiKey) throw new Error('Please enter your OpenAI API key.');
      const model = getOpenAIModel();
      return await generateWithOpenAI({ model, apiKey, tone, inputText });
    }
    if (provider === 'claude') {
      const apiKey = getClaudeKey();
      if (!apiKey) throw new Error('Please enter your Anthropic API key.');
      const model = getClaudeModel();
      return await generateWithClaude({ model, apiKey, tone, inputText });
    }
    if (provider === 'gemini') {
      const apiKey = getGeminiKey();
      if (!apiKey) throw new Error('Please enter your Google AI API key.');
      const model = getGeminiModel();
      return await generateWithGemini({ model, apiKey, tone, inputText });
    }
    throw new Error(`Unknown provider: ${provider}`);
  }

  async function generateIntoBelowCell(fromCell) {
    if (!fromCell) return;

    const startRow = parseInt(fromCell.dataset.row);
    const startCol = parseInt(fromCell.dataset.col);
    if (Number.isNaN(startRow) || Number.isNaN(startCol)) return;
    if (startRow === 1) {
      alert('Select a non-header cell to generate from.');
      return;
    }

    const sourceText = getCellText(fromCell);
    if (!sourceText) {
      alert('Please enter some text in the current cell first.');
      return;
    }

    const targetRow = startRow + 1;
    if (targetRow > ROWS) return;

    const tone = getToneForCol(startCol) || 'neutral';
    const targetCell = getCell(targetRow, startCol);
    const contentEl = getCellContentEl(targetCell);
    if (!targetCell || !contentEl) return;

    const beforeText = getCellText(targetCell);
    const beforeMeta = { sourceText: targetCell.dataset.sourceText ?? null, tone: targetCell.dataset.tone ?? null };

    selectCell(targetCell);
    contentEl.textContent = getRandomLoadingText();
    contentEl.classList.add('generating');
    
    const shimmerStart = Date.now();

    try {
      const generated = await generateCopy({ tone, inputText: sourceText });
      
      // Ensure shimmer shows for at least MIN_SHIMMER_TIME
      const elapsed = Date.now() - shimmerStart;
      if (elapsed < MIN_SHIMMER_TIME) {
        await delay(MIN_SHIMMER_TIME - elapsed);
      }
      
      TabTab.history.withTransaction('generate-below', () => {
        TabTab.history.applyCellChange(targetCell, {
          text: generated,
          meta: { sourceText, tone },
          beforeText,
          beforeMeta
        });
      });
      contentEl.classList.remove('generating');
    } catch (err) {
      const errText = '⚠ Error: ' + (err?.message || String(err));
      TabTab.history.withTransaction('generate-below', () => {
        TabTab.history.applyCellChange(targetCell, {
          text: errText,
          meta: { sourceText: null, tone: null },
          beforeText,
          beforeMeta
        });
      });
      contentEl.classList.remove('generating');
      console.error('Error:', err);
    }
  }

  // Simple variation hints - just different adjectives to steer creativity
  const variationHints = [
    'different words',
    'shorter',
    'warmer',
    'punchier',
    'friendlier',
    'simpler',
    'bolder',
    'softer',
    'snappier',
    'casual',
    'polished',
    'energetic',
    'inviting',
    'direct',
    'fresh'
  ];

  function getVariationHint(index) {
    return variationHints[index % variationHints.length];
  }

  async function fillDraggedRange({ startRow, startCol, minRow, maxRow, minCol, maxCol }) {
    const startCell = getCell(startRow, startCol);
    const sourceText = getCellText(startCell);
    if (!sourceText) {
      alert('Please enter some text in the starting cell first, then drag to fill.');
      return;
    }

    let variationIndex = 0;
    // Track outputs per column (same tone) - prevents duplicates down a column
    const columnOutputs = {};
    
    TabTab.history.beginTransaction('drag-fill');
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r === startRow && c === startCol) continue;

        const tone = getToneForCol(c) || getToneForCol(startCol) || 'neutral';
        const targetCell = getCell(r, c);
        const contentEl = getCellContentEl(targetCell);
        if (!targetCell || !contentEl) continue;

        const beforeText = getCellText(targetCell);
        const beforeMeta = { sourceText: targetCell.dataset.sourceText ?? null, tone: targetCell.dataset.tone ?? null };

        contentEl.textContent = getRandomLoadingText();
        contentEl.classList.add('generating');
        showRangeOutline({ minRow, minCol, maxRow, maxCol, mode: 'final' });

        // Initialize column tracking if needed
        if (!columnOutputs[c]) columnOutputs[c] = [];
        
        // Build input - avoid recent outputs from same column (same tone)
        let inputText = sourceText;
        const recentForCol = columnOutputs[c].slice(-3);
        if (recentForCol.length > 0) {
          inputText += ` [not: ${recentForCol.join('/')}]`;
        }
        
        const shimmerStart = Date.now();
        
        try {
          const generated = await generateCopy({
            tone,
            inputText
          });

          // Track this output for this column
          columnOutputs[c].push(generated);

          // Ensure shimmer shows for at least MIN_SHIMMER_TIME
          const elapsed = Date.now() - shimmerStart;
          if (elapsed < MIN_SHIMMER_TIME) {
            await delay(MIN_SHIMMER_TIME - elapsed);
          }

          TabTab.history.applyCellChange(targetCell, {
            text: generated,
            meta: { sourceText, tone },
            beforeText,
            beforeMeta
          });
          contentEl.classList.remove('generating');
          showRangeOutline({ minRow, minCol, maxRow, maxCol, mode: 'final' });
        } catch (err) {
          TabTab.history.applyCellChange(targetCell, {
            text: '⚠ Error: ' + (err?.message || String(err)),
            meta: { sourceText: null, tone: null },
            beforeText,
            beforeMeta
          });
          contentEl.classList.remove('generating');
          showRangeOutline({ minRow, minCol, maxRow, maxCol, mode: 'final' });
          console.error('Error:', err);
        }

        variationIndex++;
      }
    }
    TabTab.history.endTransaction();
  }

  // Expose variation prompts for potential UI use
  TabTab.variationHints = variationHints;

  function getToneColsPresent() {
    const cols = [];
    for (let col = 0; col < DATA_COLS; col++) {
      const tone = getToneForCol(col);
      if (tone) cols.push(col);
    }
    return cols;
  }

  function findNextEmptyOutputRow(toneCols) {
    for (let row = 3; row <= ROWS; row++) {
      let rowIsEmpty = true;
      for (const col of toneCols) {
        const cell = getCell(row, col);
        const text = cell ? getCellText(cell) : '';
        if (text) {
          rowIsEmpty = false;
          break;
        }
      }
      if (rowIsEmpty) return row;
    }
    return null;
  }

  async function generateAllCopy() {
    const btn = document.querySelector('.generate-btn');
    btn.disabled = true;
    btn.textContent = 'Writing...';

    // Use only the selected cell's text - no fallback
    if (!state.selectedCell) {
      alert('Please select a cell first.');
      btn.disabled = false;
      btn.textContent = 'Start Writing';
      return;
    }
    
    const r = parseInt(state.selectedCell.dataset.row);
    if (r === 1) {
      alert('Please select a cell below the header row.');
      btn.disabled = false;
      btn.textContent = 'Start Writing';
      return;
    }
    
    const sourceText = getCellText(state.selectedCell);
    if (!sourceText) {
      alert('The selected cell is empty. Please enter some text first.');
      btn.disabled = false;
      btn.textContent = 'Start Writing';
      return;
    }

    // Check which tab is active
    const activeTab = state.activeTab || 'tone-of-voice';
    
    if (activeTab === 'default') {
      // DEFAULT TAB: Generate 10 cells down in the current column
      await generateColumnCells(sourceText);
    } else {
      // TONE OF VOICE TAB: Generate across the row (existing behavior)
      await generateRowCells(sourceText);
    }

    btn.disabled = false;
    btn.textContent = 'Start Writing';
  }

  /**
   * Generate across a row using each column's tone (Tone of Voice tab behavior)
   */
  async function generateRowCells(sourceText) {
    const toneCols = getToneColsPresent();
    if (toneCols.length === 0) {
      alert('Please add at least one tone in row 1 (a column header) first.');
      return;
    }

    const targetRow = findNextEmptyOutputRow(toneCols);
    if (!targetRow) {
      alert(`No empty output row available (rows 3-${ROWS} are already filled for the active tone columns).`);
      return;
    }

    TabTab.history.beginTransaction('generate-row');
    for (let col = 0; col < DATA_COLS; col++) {
      const tone = getToneForCol(col);
      if (!tone) continue;

      const targetCell = getCell(targetRow, col);
      const contentEl = getCellContentEl(targetCell);
      if (!targetCell || !contentEl) continue;

      const beforeText = getCellText(targetCell);
      const beforeMeta = { sourceText: targetCell.dataset.sourceText ?? null, tone: targetCell.dataset.tone ?? null };

      contentEl.textContent = getRandomLoadingText();
      contentEl.classList.add('generating');
      
      const shimmerStart = Date.now();

      try {
        const generated = await generateCopy({ tone, inputText: sourceText });
        
        // Ensure shimmer shows for at least MIN_SHIMMER_TIME
        const elapsed = Date.now() - shimmerStart;
        if (elapsed < MIN_SHIMMER_TIME) {
          await delay(MIN_SHIMMER_TIME - elapsed);
        }
        
        TabTab.history.applyCellChange(targetCell, {
          text: generated,
          meta: { sourceText, tone },
          beforeText,
          beforeMeta
        });
        contentEl.classList.remove('generating');
      } catch (err) {
        TabTab.history.applyCellChange(targetCell, {
          text: '⚠ Error: ' + (err?.message || String(err)),
          meta: { sourceText: null, tone: null },
          beforeText,
          beforeMeta
        });
        contentEl.classList.remove('generating');
        console.error('Error:', err);
      }
    }
    TabTab.history.endTransaction();
  }

  /**
   * Generate 10 cells down in the current column (Default tab behavior)
   */
  async function generateColumnCells(sourceText) {
    const selectedCol = parseInt(state.selectedCell.dataset.col);
    const selectedRow = parseInt(state.selectedCell.dataset.row);
    
    // Get the column header (UI context)
    const context = getToneForCol(selectedCol);
    if (!context) {
      alert('This column has no header. Please select a column with a header (e.g., CTA Button, Tray Title).');
      return;
    }

    // Generate 10 cells starting from the cell BELOW the selected one
    const startRow = selectedRow + 1;
    if (startRow > ROWS) {
      alert('No rows available below the selected cell.');
      return;
    }
    const cellsToGenerate = 10;
    const maxRow = Math.min(startRow + cellsToGenerate - 1, ROWS);
    
    // Track previous outputs to avoid duplicates
    const previousOutputs = [];

    TabTab.history.beginTransaction('generate-column');
    
    for (let row = startRow; row <= maxRow; row++) {
      const targetCell = getCell(row, selectedCol);
      const contentEl = getCellContentEl(targetCell);
      if (!targetCell || !contentEl) continue;

      const beforeText = getCellText(targetCell);
      const beforeMeta = { sourceText: targetCell.dataset.sourceText ?? null, tone: targetCell.dataset.tone ?? null };

      contentEl.textContent = getRandomLoadingText();
      contentEl.classList.add('generating');
      
      const shimmerStart = Date.now();

      // Build input with avoid list
      let inputText = sourceText;
      const recentOutputs = previousOutputs.slice(-3);
      if (recentOutputs.length > 0) {
        inputText += ` [not: ${recentOutputs.join('/')}]`;
      }

      try {
        const generated = await generateCopy({ tone: context, inputText });
        
        // Track this output
        previousOutputs.push(generated);

        // Ensure shimmer shows for at least MIN_SHIMMER_TIME
        const elapsed = Date.now() - shimmerStart;
        if (elapsed < MIN_SHIMMER_TIME) {
          await delay(MIN_SHIMMER_TIME - elapsed);
        }

        TabTab.history.applyCellChange(targetCell, {
          text: generated,
          meta: { sourceText, tone: context },
          beforeText,
          beforeMeta
        });
        contentEl.classList.remove('generating');
      } catch (err) {
        TabTab.history.applyCellChange(targetCell, {
          text: '⚠ Error: ' + (err?.message || String(err)),
          meta: { sourceText: null, tone: null },
          beforeText,
          beforeMeta
        });
        contentEl.classList.remove('generating');
        console.error('Error:', err);
      }
    }
    
    TabTab.history.endTransaction();
  }

  TabTab.generation = {
    saveOllamaModel,
    saveOpenAIKey,
    saveClaudeKey,
    saveGeminiKey,
    fetchGeminiModels,
    getOllamaModel,
    getGeminiKey,
    getToneForCol,
    generateWithOllama,
    generateIntoBelowCell,
    fillDraggedRange,
    generateAllCopy
  };
})();


