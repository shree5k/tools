(() => {
  /**
   * ui.js
   * - UI-only wiring that doesn't belong to grid mechanics.
   * - Currently: the “How to?” popover open/close + outside click + Escape close.
   */
  window.TabTab = window.TabTab || {};

  function setupModelPicker() {
    const select = document.getElementById('ollama-model-select');
    const input = document.getElementById('ollama-model');
    if (!select || !input) return;

    const DEFAULT_MODEL = 'llama3.2:latest';
    let lastCustom = '';

    function syncSelectToInput() {
      const value = (input.value || '').trim();
      const options = Array.from(select.options).map(o => o.value);
      if (options.includes(value)) {
        select.value = value;
      } else {
        select.value = '__custom__';
      }
    }

    function setInputVisible(visible) {
      input.classList.toggle('is-hidden', !visible);
    }

    function setInput(value) {
      input.value = value;
      if (typeof window.saveOllamaModel === 'function') window.saveOllamaModel(value);
    }

    // Initialize from localStorage if present; otherwise keep HTML default.
    const stored = (localStorage.getItem('ollama_model') || '').trim();
    if (stored) setInput(stored);
    else if (!input.value) setInput(DEFAULT_MODEL);

    // Decide whether stored/default is custom or predefined
    const optionValues = new Set(Array.from(select.options).map(o => o.value));
    if (optionValues.has((input.value || '').trim())) {
      select.value = (input.value || '').trim();
      setInputVisible(false);
    } else {
      select.value = '__custom__';
      lastCustom = (input.value || '').trim();
      setInputVisible(true);
    }

    select.addEventListener('change', () => {
      if (select.value === '__custom__') {
        // Restore last custom (or keep current input) and show the input
        const current = (input.value || '').trim();
        if (!current && lastCustom) setInput(lastCustom);
        setInputVisible(true);
        input.focus();
        input.select?.();
        return;
      }
      // Choosing a predefined model hides the input, keeps #ollama-model in sync
      setInput(select.value);
      setInputVisible(false);
    });

    input.addEventListener('input', () => {
      const v = (input.value || '').trim();
      if (v) lastCustom = v;
      // If user types a predefined value exactly, we can optionally snap select.
      // But we keep the select on Custom to avoid surprising switching.
    });

    // If input is hidden initially but input value doesn't match select, keep them aligned.
    if (select.value !== '__custom__') setInput(select.value);
  }

  function setupHowToPopover() {
    const btn = document.getElementById('howto-btn');
    const popover = document.getElementById('howto-popover');
    if (!btn || !popover) return;

    function close() {
      popover.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    function toggle() {
      const isOpen = popover.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });

    document.addEventListener('click', (e) => {
      if (!popover.classList.contains('open')) return;
      const target = e.target;
      if (popover.contains(target) || btn.contains(target)) return;
      close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!popover.classList.contains('open')) return;
      close();
    });
  }

  function setupProviderPicker() {
    const providerSelect = document.getElementById('provider-select');
    const ollamaGroup = document.getElementById('provider-ollama');
    const openaiGroup = document.getElementById('provider-openai');
    const claudeGroup = document.getElementById('provider-claude');

    if (!providerSelect || !ollamaGroup || !openaiGroup || !claudeGroup) return;

    const openaiKey = document.getElementById('openai-api-key');
    const claudeKey = document.getElementById('claude-api-key');
    const openaiModel = document.getElementById('openai-model-select');
    const claudeModel = document.getElementById('claude-model-select');

    function setVisible(el, visible) {
      el.classList.toggle('is-hidden', !visible);
    }

    function applyProvider(provider) {
      setVisible(ollamaGroup, provider === 'ollama');
      setVisible(openaiGroup, provider === 'openai');
      setVisible(claudeGroup, provider === 'claude');
    }

    // Load persisted values
    const storedProvider = (localStorage.getItem('provider') || providerSelect.value || 'ollama').trim();
    providerSelect.value = storedProvider;
    applyProvider(storedProvider);

    if (openaiKey) openaiKey.value = localStorage.getItem('openai_api_key') || '';
    if (claudeKey) claudeKey.value = localStorage.getItem('claude_api_key') || '';
    if (openaiModel) openaiModel.value = localStorage.getItem('openai_model') || openaiModel.value;
    if (claudeModel) claudeModel.value = localStorage.getItem('claude_model') || claudeModel.value;

    providerSelect.addEventListener('change', () => {
      const provider = providerSelect.value;
      localStorage.setItem('provider', provider);
      applyProvider(provider);
    });

    openaiModel?.addEventListener('change', () => localStorage.setItem('openai_model', openaiModel.value));
    claudeModel?.addEventListener('change', () => localStorage.setItem('claude_model', claudeModel.value));
  }

  function setupLogoTap() {
    const logos = document.querySelectorAll('.header-logo');
    let tapCount = 0;
    let tapTimer = null;
    const TAP_THRESHOLD = 6; // 4 rapid taps triggers the easter egg
    const TAP_WINDOW = 2000; // 2s window to count rapid taps
    
    function spawnFire() {
      const fire = document.createElement('img');
      fire.src = 'assets/fire-emoji.png';
      fire.className = 'floating-fire';
      // Random horizontal position across the viewport
      const randomX = Math.random() * (window.innerWidth - 60);
      fire.style.left = `${randomX}px`;
      document.body.appendChild(fire);
      
      fire.addEventListener('animationend', () => {
        fire.remove();
      });
    }
    
    function burstFires() {
      // Spawn multiple fires from the bottom
      const count = 5 + Math.floor(Math.random() * 4); // 5-8 fires
      for (let i = 0; i < count; i++) {
        setTimeout(() => spawnFire(), i * 80);
      }
    }
    
    logos.forEach(logo => {
      logo.addEventListener('click', (e) => {
        // Tap animation
        logo.classList.remove('tapped');
        void logo.offsetWidth;
        logo.classList.add('tapped');
        
        // Track rapid taps
        tapCount++;
        if (tapTimer) clearTimeout(tapTimer);
        tapTimer = setTimeout(() => {
          tapCount = 0;
        }, TAP_WINDOW);
        
        // Easter egg: burst fires on rapid taps
        console.log('Tap count:', tapCount);
        if (tapCount >= TAP_THRESHOLD) {
          console.log('🔥 Burst fires!');
          burstFires();
          tapCount = 0; // Reset so they can trigger again
        }
      });
      
      logo.addEventListener('animationend', () => {
        logo.classList.remove('tapped');
      });
    });
  }

  TabTab.ui = { setupHowToPopover, setupModelPicker, setupProviderPicker, setupLogoTap };
})();


