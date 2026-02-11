(() => {
  /**
   * config.js
   * - Loads config files (prompts, tone guidance, default column headers).
   * - Supports multiple configs for different tabs (tone-of-voice, default).
   * - Exposes helpers used by generation + sheet rendering:
   *   - `loadConfig()`, `loadConfigForTab()`, `getColumnHeaderDefault(col)`, `buildUserPrompt(tone, inputText)`
   */
  window.TabTab = window.TabTab || {};

  /**
   * Writing guidelines extracted from ott-ux-copy-guide.json
   * These are appended to prompts for better copy quality.
   */
  const writingGuidelines = {
    // Voice: "you" centered, not "we" centered
    voiceRules: [
      'Use "you" and "your" — speak directly to the user',
      'Avoid "we" statements — focus on the user\'s experience, not the company',
      'Use contractions (you\'re, it\'s, we\'ll) — sounds more natural'
    ],

    // Writing rules - DO
    doRules: [
      'Use sentence case for headlines and buttons',
      'Write in present tense',
      'Use active voice',
      'Keep sentences under 20 words',
      'Test copy by reading it aloud',
      'Consider the user\'s emotional state in each context'
    ],

    // Writing rules - DON'T
    dontRules: [
      'Use ALL CAPS (except for brand acronyms)',
      'Use exclamation marks excessively (one per screen max)',
      'Use jargon: buffer, cache, bandwidth, render',
      'Use filler phrases: "In order to", "Please note that", "It should be noted"',
      'Use passive voice: "Your password has been changed" → "Password changed"',
      'Use double negatives',
      'Be overly apologetic for minor issues',
      'Use "please" in buttons (it\'s implied)'
    ],

    // Word choices - prefer/avoid pairs
    wordChoices: [
      { prefer: 'show', avoid: 'program, series, content' },
      { prefer: 'movie', avoid: 'film, feature, title' },
      { prefer: 'episode', avoid: 'installment, chapter' },
      { prefer: 'search', avoid: 'find, look up, query' },
      { prefer: 'home', avoid: 'main, landing, dashboard' },
      { prefer: 'account', avoid: 'profile, user settings' },
      { prefer: 'sign in', avoid: 'log in, login' },
      { prefer: 'sign out', avoid: 'log out, logout' },
      { prefer: 'free trial', avoid: 'trial period, trial membership' },
      { prefer: 'subscription', avoid: 'membership, plan, package' },
      { prefer: 'Watch', avoid: 'View, Play Content' }
    ],

    // Quality checklist
    qualityChecklist: [
      'Is it clear on first read?',
      'Is it as short as it can be without losing meaning?',
      'Does it tell users what to do next?',
      'Does it match the emotional context?',
      'Would you say this to a friend?',
      'Does it avoid jargon and tech-speak?',
      'Does it work for first-time and returning users?'
    ]
  };

  // Config file mapping per tab
  const configFiles = {
    'tone-of-voice': 'config.json',
    'default': 'default-config.json'
  };

  const cfg = {
    // Store configs per tab
    configs: {},
    
    // Currently active config (based on active tab)
    appConfig: null,
    activeTab: 'tone-of-voice',

    /**
     * Load the main config (for backward compatibility and initial load)
     */
    async loadConfig() {
      await cfg.loadConfigForTab('tone-of-voice');
      cfg.appConfig = cfg.configs['tone-of-voice'];
    },

    /**
     * Load config for a specific tab
     */
    async loadConfigForTab(tabId) {
      const configFile = configFiles[tabId] || 'config.json';
      
      // Return cached config if already loaded
      if (cfg.configs[tabId]) {
        cfg.appConfig = cfg.configs[tabId];
        cfg.activeTab = tabId;
        console.log('Config switched to:', cfg.appConfig.meta?.name);
        return cfg.configs[tabId];
      }

      try {
        const response = await fetch(configFile);
        if (!response.ok) throw new Error(`Failed to load ${configFile}: ${response.status}`);
        const config = await response.json();
        cfg.configs[tabId] = config;
        cfg.appConfig = config;
        cfg.activeTab = tabId;
        console.log('Config loaded:', config.meta?.name, config.meta?.version);
        return config;
      } catch (err) {
        console.error(`Error loading ${configFile}:`, err);
        // Fallback to minimal defaults
        const fallback = {
          columnHeaders: [],
          prompts: {
            system: 'You rewrite UX copy. Return only the rewritten text, nothing else.',
            userTemplate: 'Rewrite this copy:\n\n{inputText}\n\nReturn only the rewritten text.'
          },
          toneGuidance: {},
          generationSettings: { temperature: 0.85 }
        };
        cfg.configs[tabId] = fallback;
        cfg.appConfig = fallback;
        cfg.activeTab = tabId;
        return fallback;
      }
    },

    /**
     * Switch to a different tab's config
     */
    async switchConfig(tabId) {
      await cfg.loadConfigForTab(tabId);
    },

    /**
     * Get column header for current active config
     */
    getColumnHeaderDefault(colIndex) {
      if (!cfg.appConfig || !cfg.appConfig.columnHeaders) return '';
      return cfg.appConfig.columnHeaders[colIndex] || '';
    },

    /**
     * Get column headers for a specific tab
     */
    getColumnHeadersForTab(tabId) {
      const config = cfg.configs[tabId];
      return config?.columnHeaders || [];
    },

    getToneGuidance(tone) {
      const key = (tone || '').toLowerCase().trim();
      if (cfg.appConfig?.toneGuidance?.[key]) return cfg.appConfig.toneGuidance[key];
      return `Rewrite in a ${tone} style.`;
    },

    /**
     * Returns formatted writing guidelines to append to prompts.
     */
    getWritingGuidelines() {
      const lines = [];

      // Voice rules (you vs we)
      lines.push('## Voice');
      writingGuidelines.voiceRules.forEach(rule => lines.push(`- ${rule}`));

      // Word choices
      lines.push('\n## Word Choices');
      writingGuidelines.wordChoices.forEach(({ prefer, avoid }) => {
        lines.push(`- Use "${prefer}" not "${avoid}"`);
      });

      // Quick quality check
      lines.push('\n## Before You Return');
      writingGuidelines.qualityChecklist.slice(0, 4).forEach(q => lines.push(`- ${q}`));

      return lines.join('\n');
    },

    /**
     * Returns the full writing guidelines (for debugging or detailed prompts).
     */
    getFullWritingGuidelines() {
      const lines = [];

      lines.push('## Voice');
      writingGuidelines.voiceRules.forEach(rule => lines.push(`- ${rule}`));

      lines.push('\n## DO');
      writingGuidelines.doRules.forEach(rule => lines.push(`- ${rule}`));

      lines.push('\n## DON\'T');
      writingGuidelines.dontRules.forEach(rule => lines.push(`- ${rule}`));

      lines.push('\n## Word Choices');
      writingGuidelines.wordChoices.forEach(({ prefer, avoid }) => {
        lines.push(`- Use "${prefer}" not "${avoid}"`);
      });

      lines.push('\n## Quality Checklist');
      writingGuidelines.qualityChecklist.forEach(q => lines.push(`- ${q}`));

      return lines.join('\n');
    },

    buildUserPrompt(tone, inputText) {
      const toneGuide = cfg.getToneGuidance(tone);
      const template =
        cfg.appConfig?.prompts?.userTemplate ||
        'Rewrite this UX copy in a {tone} tone:\n\n{inputText}\n\nReturn only the rewritten text.';

      // Build prompt from template
      let prompt = template
        .replace('{tone}', tone)
        .replace('{toneGuidance}', toneGuide)
        .replace('{inputText}', inputText);

      // Only append guidelines if explicitly requested via placeholder
      if (template.includes('{writingGuidelines}')) {
        prompt = prompt.replace('{writingGuidelines}', cfg.getWritingGuidelines());
      }

      return prompt;
    }
  };

  // Expose guidelines for debugging/inspection
  cfg.writingGuidelines = writingGuidelines;

  TabTab.config = cfg;
})();
