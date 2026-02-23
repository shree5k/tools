(() => {
  /**
   * init.js
   * - App entrypoint:
   *   - loads config
   *   - builds the sheet
   *   - wires UI + keyboard shortcuts
   * - Also exposes a couple functions on `window` so HTML attributes keep working:
   *   - `onclick="generateAllCopy()"`, `onchange="saveOllamaModel(...)"`
   */
  window.TabTab = window.TabTab || {};

  async function init() {
    // Load tone-of-voice config first for its sheet initialization
    await TabTab.config.loadConfigForTab('tone-of-voice');
    TabTab.sheet.initSheet(); // Tone of Voice sheet uses tone-of-voice config headers
    
    // Now load default config and initialize tabs (Default is the active tab)
    await TabTab.config.loadConfigForTab('default');
    await TabTab.tabs.initTabs(); // Initialize default sheet with default config headers
    TabTab.ui.setupHowToPopover();
    TabTab.ui.setupProviderPicker();
    TabTab.ui.setupModelPicker();
    TabTab.ui.setupLogoTap();
    TabTab.shortcuts.registerKeyboardShortcuts();

    // Preserve inline HTML handlers
    window.generateAllCopy = TabTab.generation.generateAllCopy;
    window.saveOllamaModel = TabTab.generation.saveOllamaModel;
    window.saveOpenAIKey = TabTab.generation.saveOpenAIKey;
    window.saveClaudeKey = TabTab.generation.saveClaudeKey;
    window.saveGeminiKey = TabTab.generation.saveGeminiKey;
  }

  // Kick off
  init();
})();


