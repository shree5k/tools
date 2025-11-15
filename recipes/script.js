document.addEventListener('DOMContentLoaded', () => {
  const SHEET_NAME = 'Sheet1';

  const recipeDisplay = document.getElementById('recipe-display');
  // NEW: Content area for scrolling
  const recipeContent = document.getElementById('recipe-content');
  // NEW: Fixed footer area
  const asciiFooter = document.getElementById('ascii-footer');
  
  const buttons = document.querySelectorAll('.phone-button');
  const addRecipeForm = document.getElementById('add-recipe-form');
  const addColumnSelect = document.getElementById('add-column');
  const openAddSheetBtn = document.getElementById('open-add-sheet');
  const closeAddSheetBtn = document.getElementById('close-add-sheet');
  const addSheetOverlay = document.getElementById('add-sheet-overlay');
  const chipButtons = document.querySelectorAll('.chip');
  const addStatus = document.getElementById('add-status');
  const showRecipesButton = document.getElementById('show-recipes-button');
  const timeKeypad = document.getElementById('time-keypad');
  const shuffleButton = document.getElementById('shuffle-button'); 
  const actionKeypad = document.getElementById('action-keypad');
  const API_BASE_URL = `https://script.google.com/macros/s/${apiId}/exec`;

  // ... (rest of variable declarations) ...

  const ASCII_ART = `
<pre>
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⡀⠀⠀⠀⢀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⠋⠉⣿⣤⣤⡾⠏⠛⢷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢨⣿⣳⣿⠡⣠⣄⣚⣿⡟⣗⡄⠐⣈⣻⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠟⠁⣀⠛⢋⡿⢻⡿⢻⠟⠁⣿⣿⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠛⠉⠉⠉⠉⠓⠶⣶⠲⠖⠒⠛⠒⠛⠒⠓⠓⠒⠒⠒⠶⠿⠶⣿⣿⣶⡿⢁⣾⣿⣄⠀⠀⠀⠀⠀⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣠⣴⡟⠀⠀⠀⠀⣀⣤⣄⣀⠈⠳⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠟⢁⡾⠛⢿⠿⣧⣄⡉⠀⠈⠿⣿⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣠⡴⠚⠉⣽⠃⠀⠀⢀⡴⠋⠉⠉⠙⢦⡀⠹⣦⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⠀⣀⡴⠋⣠⠞⠁⠀⠈⠀⠉⠙⠳⣦⣀⠠⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢀⣴⠛⠁⠀⠀⢀⣿⢀⠀⠀⢸⠀⠀⠀⠀⠀⠀⢳⠀⠹⣇⠔⡁⠀⣰⠌⢀⣈⣭⠿⠛⢉⣴⣾⣷⣤⣄⣀⡀⠀⠀⠀⠀⠀⠙⢷⣟⢿⡇⠀⠀⠀⠀⠀⠀⠀⠀
⢀⡿⠁⠀⠀⠀⣠⡼⣷⠸⡄⠀⠉⢷⡀⠀⠀⠀⢀⡼⠀⠀⣿⢀⣉⣷⡶⠿⢿⣏⣤⠶⣿⣿⡽⣶⣭⣉⠻⣯⡙⠳⢤⣀⠀⠀⠀⠀⢹⣾⣧⠀⠀⠀⠀⠀⠀⠀⠀
⢸⡇⠀⠀⣠⢾⡟⠂⢻⡆⢳⣄⡀⠀⠙⠶⠤⠴⠛⠡⠔⢻⣿⣻⣿⡴⠶⠛⢻⣏⣡⣾⠿⠷⣤⣦⣴⣽⣷⣞⢿⡌⠘⢏⢳⣄⠀⠀⢀⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀
⠈⣷⡄⢰⡏⠰⠓⢠⡴⠿⡾⠿⢷⡀⠀⠀⠀⠀⠀⠀⣠⣾⣟⣿⡌⣷⣤⣴⡿⢛⣩⡴⠶⠳⣿⠿⢿⣿⠾⣿⡟⠋⠁⠀⠲⢽⡆⢀⣼⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣿⣿⣶⣿⣄⠀⠸⣧⣀⣀⣀⣽⣟⣶⠶⡶⢶⣶⣫⣿⣋⣉⣙⣿⠌⣿⢷⡿⢻⡇⠀⠀⠀⠘⣻⠶⣶⠾⠟⢹⠆⠀⠀⢀⣼⣷⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢻⡌⠻⢿⣿⣷⣶⣬⣍⢻⣏⠻⣿⣟⠻⠿⢛⣻⣧⣌⣉⣉⣭⠟⢠⣿⡐⢿⣆⠻⣦⣀⣀⣴⠟⣠⡟⠀⢀⣀⣤⣴⣾⣿⣿⠟⢁⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢿⣦⣀⠉⠛⠿⣿⣻⣿⣿⠷⢿⣿⣿⣽⣟⣻⣤⣉⣛⣫⣥⡀⢀⣸⣇⣼⣟⣶⣤⣭⣭⣴⣾⣿⠶⢿⢛⣏⣹⡴⠛⠁⢀⣴⣾⠿⣿⣟⣷⣦⠀⠀⠀⠀⠀⠀
⠀⠀⠈⣿⣿⣿⣶⣤⣀⡈⠉⠛⠛⠶⠶⣦⣭⣎⣭⣋⣟⣙⣛⣛⣻⣛⣛⣛⣏⣻⣍⣯⣭⣱⡶⠶⠿⠓⠛⠋⠉⣀⡄⠀⣠⣟⣾⠃⠀⠈⠙⠛⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠈⠻⣿⣷⢯⡿⣽⢿⣶⣶⡲⣤⠤⣄⣀⣀⣁⣈⣉⡉⠉⠁⠉⠉⠉⣈⣁⣈⣀⣀⣀⡤⣤⠴⣲⠒⣏⣿⠏⠀⡴⣧⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠙⢿⣿⣽⣻⣟⣮⣟⣷⡌⢳⡘⢬⢲⡡⢎⠭⣙⠏⢯⡹⢭⡙⢥⠚⡔⡣⣜⢡⠞⣠⢛⡤⢯⡴⢬⡷⣞⣷⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠙⢷⣿⣟⣾⡽⣾⢿⡆⡝⣆⠣⡜⣡⢋⢆⡛⢦⠱⢦⡙⢦⠛⣬⠱⡌⠮⡜⢥⣋⡜⢯⣤⣞⣵⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⣯⣿⣯⣟⣿⣶⣌⠳⡜⢤⢋⠦⡙⢦⡙⠦⡙⢦⠹⢤⠓⣍⠞⡸⢆⡱⢎⣽⠿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⠛⠻⣿⣾⣿⣷⣯⡘⢣⠞⡲⢩⠦⣙⠲⣍⠲⡙⢦⡙⢦⣩⣵⣾⠿⡟⢣⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡄⠠⠰⠘⢿⣿⣿⡿⣿⣷⣮⣵⣧⣾⣤⣷⣬⣧⣽⣶⣿⣿⣿⣿⠃⢃⠀⠂⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣤⣤⣄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣍⡀⠂⠌⠛⢿⣿⣿⣿⣽⣯⣿⣽⣯⣿⣽⣿⣽⣷⣿⠿⠋⠡⠈⠁⠈⠼⠃⢀⣀⣠⣤⠤⠶⠶⠚⠛⠋⠉⠉⠀⠀⣐⣿⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠳⠦⣔⣀⠊⠉⠉⠛⠛⠛⠿⠻⠟⠟⠻⠛⠛⠩⠙⣀⣂⣤⣤⣶⠶⠶⠒⠚⠋⠉⠉⠀⠀⢀⣀⣀⣴⣤⣶⠶⠶⢿⡟⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⠉⠐⠀⠉⠐⢠⣥⣬⣭⠶⠷⠞⠛⠋⠉⠉⣀⣀⣀⣠⣒⣤⣥⣬⠶⠶⢿⠛⠻⠭⠉⠁⠀⠀⠈⠉⠀⣀⣀⣤⡀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣤⡤⠤⠶⠒⠛⠋⢉⠉⣁⣀⣠⣤⣤⣴⠶⠾⠾⠟⠛⠛⠙⠉⠉⠀⠀⢀⣀⣀⣠⣤⠤⠤⠶⠖⠚⠛⠛⠉⠉⠉⠁⢀⣿
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣶⠛⠛⠉⢉⣀⣀⣠⣤⣤⣴⠶⠾⠛⠛⠛⠉⠉⠀⠀⣀⣀⣀⣤⣤⡤⠶⠶⠖⠚⠛⠋⠉⠉⠁⠀⢀⣀⣠⣤⣠⣤⣤⣤⡶⠶⠿⠟⣛⡏
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⠶⠛⠛⠋⠉⠉⣁⣀⣀⣄⡤⡤⠤⠶⠖⠒⠚⠛⠉⠉⢉⡀⣀⣀⣠⣤⣤⣤⣴⠶⠶⠷⠟⠾⠛⠛⠉⠉⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠖⠚⠛⠉⠉⠉⣁⣀⣤⣄⣠⣤⣤⣴⠶⠶⠶⠛⠛⠛⠋⠙⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⠶⠶⠞⠛⠛⠛⠛⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
</pre>
`;

  let currentlyActiveButton = null;
  let recipesData = null;
  let isLoading = false;
  let currentRecipe = null;
  let inlineUpdateStatusEl = null;
  let currentTimeKey = null;
  let isShowingRecipesView = false; 

  // Initializing the fixed ASCII footer
  if (asciiFooter) {
      asciiFooter.innerHTML = ASCII_ART;
      asciiFooter.classList.add('hidden'); // Ensure it starts hidden until renderInitialRecipes is called
  }

  updateViewVisibility(); 
  updateHeaderButtonsState(); 

  function buildApiUrl(action, params = {}) {
    const searchParams = new URLSearchParams({
      action,
      path: SHEET_NAME,
      ...params,
    });
    return `${API_BASE_URL}?${searchParams.toString()}`;
  }

  function setStatus(element, message, isError = false) {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('error', 'success');
    if (message) {
      element.classList.add(isError ? 'error' : 'success');
    }
  }

  function setChipSelection(value) {
    if (!value) return;
    chipButtons.forEach(chip => {
      if (chip.dataset.value === value) {
        chip.classList.add('selected');
      } else {
        chip.classList.remove('selected');
      }
    });
  }

  function syncAddChipsWithCurrentTime(preferredTime) {
    if (!addColumnSelect) return;
    let target = preferredTime?.toLowerCase();
    if (!target && currentlyActiveButton) {
      target = currentlyActiveButton.dataset.time?.toLowerCase();
    }
    if (!target) {
      target = addColumnSelect.value || 'morning';
    }
    addColumnSelect.value = target;
    setChipSelection(target);
  }

  syncAddChipsWithCurrentTime(addColumnSelect?.value || 'morning');

  function updateHeaderButtonsState() {
    if (!shuffleButton) return;

    if (isShowingRecipesView) {
      shuffleButton.disabled = true;
    } else {
      shuffleButton.disabled = false;
    }
  }

  function updateViewVisibility() {
    if (isShowingRecipesView) {
      timeKeypad.classList.remove('hidden');
      actionKeypad.classList.add('hidden');
      asciiFooter?.classList.add('hidden'); // Hide ASCII footer in list view
      showRecipesButton.textContent = 'Random Suggestions';
    } else {
      timeKeypad.classList.add('hidden');
      actionKeypad.classList.remove('hidden');
      asciiFooter?.classList.remove('hidden'); // Show ASCII footer in random view
      showRecipesButton.textContent = 'Show Recipes';
    }
    updateHeaderButtonsState();
  }

  function getRandomTimeKey() {
    const times = ['Morning', 'Afternoon', 'Night'];
    return times[Math.floor(Math.random() * times.length)];
  }
  
  function renderRecipeDisplayMessage(message) {
      if (!recipeContent) return;
      recipeContent.innerHTML = `<p>${message}</p>`;
      currentRecipe = null;
      updateHeaderButtonsState();
  }

  // UPDATED: Simple, plain UI with IDs added to the end of each line
  function renderInitialRecipes() {
    if (!recipesData) {
        renderRecipeDisplayMessage('Loading recipes...');
        return;
    }

    const morning = getRandomRecipe('Morning');
    const afternoon = getRandomRecipe('Afternoon');
    const night = getRandomRecipe('Night');
    
    currentRecipe = null;
    currentTimeKey = null;

    // Helper to format the suggestion line with ID
    const formatSuggestionLine = (time, recipe) => {
        const idDisplay = recipe && recipe.id ? ` (ID: ${recipe.id})` : '';
        const value = recipe ? recipe.value + idDisplay : 'No recipe available';
        
        // Using simple P and STRONG for hierarchy
        return `<p><strong>${time}:</strong> ${value}</p>`;
    };

    const content = `
        ${formatSuggestionLine('Morning', morning)}
        ${formatSuggestionLine('Afternoon', afternoon)}
        ${formatSuggestionLine('Night', night)}
        <h4><i>lets cook</i></h4>
    `;
    
    // Inject content into the scrolling container
    recipeContent.innerHTML = content;
    updateHeaderButtonsState();
  }

  function renderAllRecipesForTime(timeKey) {
    if (!recipeContent) return;
    inlineUpdateStatusEl = null;

    const list = recipesData?.[timeKey];
    if (!list || list.length === 0) {
        renderRecipeDisplayMessage(`No recipes available for ${timeKey}.`);
        return;
    }
    
    const column = timeKey.toLowerCase();

    const items = list.map(recipe => {
        // Embed ID and column for double-click to work
        const dataAttributes = recipe.id 
            ? `data-id="${recipe.id}" data-column="${column}" data-label="${timeKey}"`
            : '';
        return `<li ${dataAttributes} style="cursor: pointer;" title="Double-tap to edit">${recipe.value}</li>`;
    }).join('');

    const content = `
        <div class="all-recipes">
            <div class="all-recipes-title">${timeKey} recipes</div>
            <ol class="all-recipes-list">${items}</ol>
        </div>
    `;

    // Inject content into the scrolling container
    recipeContent.innerHTML = content;
    currentRecipe = null;
    updateHeaderButtonsState();
  }

  function openAddSheet() {
    if (!addSheetOverlay) return;
    syncAddChipsWithCurrentTime(currentTimeKey);
    setStatus(addStatus, '');
    addSheetOverlay.classList.add('visible');
    addSheetOverlay.setAttribute('aria-hidden', 'false');
    const firstField = addRecipeForm?.querySelector('textarea, input, select');
    if (firstField instanceof HTMLElement) {
      firstField.focus();
    }
  }

  function closeAddSheet() {
    if (!addSheetOverlay) return;
    addSheetOverlay.classList.remove('visible');
    addSheetOverlay.setAttribute('aria-hidden', 'true');
  }

  function showInlineUpdateForm(recipeData) {
    const recipe = recipeData;
    if (!recipe || !recipe.id) return;

    currentRecipe = recipe; 

    const formContent = `
      <form id="inline-update-form" class="inline-update-form">
        <label>
          Editing ${recipe.label || recipe.column} recipe (ID: ${recipe.id})
          <textarea name="value" required>${recipe.value}</textarea>
        </label>
        <div class="inline-update-actions">
          <button type="button" id="cancel-inline-update">Cancel</button>
          <button type="submit">Update</button>
        </div>
        <p class="status-message" id="inline-update-status"></p>
      </form>
    `;
    
    // Inject form into the scrolling container
    recipeContent.innerHTML = formContent;
    
    const inlineForm = document.getElementById('inline-update-form');
    inlineUpdateStatusEl = document.getElementById('inline-update-status');
    const cancelButton = document.getElementById('cancel-inline-update');
    
    cancelButton?.addEventListener('click', () => {
      inlineUpdateStatusEl = null;
      if (isShowingRecipesView) {
        renderAllRecipesForTime(currentTimeKey); 
      } else {
        renderInitialRecipes(); 
      }
    });
    
    inlineForm?.addEventListener('submit', onInlineUpdateSubmit);
    const textarea = inlineForm?.querySelector('textarea');
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.focus();
    }
  }

  async function onInlineUpdateSubmit(event) {
    event.preventDefault();
    if (!currentRecipe || !currentRecipe.id) return; 
    
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const textarea = form.querySelector('textarea');
    if (!(textarea instanceof HTMLTextAreaElement)) {
      return;
    }
    const newValue = textarea.value.trim();
    if (!newValue) {
      setStatus(inlineUpdateStatusEl, 'Recipe cannot be empty.', true);
      return;
    }
    setStatus(inlineUpdateStatusEl, 'Updating recipe...');
    try {
      await submitUpdateRecipe({
        id: currentRecipe.id,
        column: currentRecipe.column,
        value: newValue,
      });
      await fetchRecipes();
      
      if (isShowingRecipesView) {
        renderAllRecipesForTime(currentTimeKey);
      } else {
        renderInitialRecipes(); 
      }
    } catch (error) {
      console.error(error);
      setStatus(inlineUpdateStatusEl, error.message || 'Failed to update recipe.', true);
    }
  }

  async function fetchRecipes() {
    if (isLoading) return;
    
    try {
      isLoading = true;
      const url = buildApiUrl('read', { cache: Date.now() }); // Added cache buster for immediate refresh
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        const recipes = {
          Morning: [],
          Afternoon: [],
          Night: []
        };
        
        result.data.forEach(item => {
          const rowId = item.id ?? item.ID ?? item.Id ?? item.rowId ?? null;
          if (item.morning) {
            recipes.Morning.push({ id: rowId ? String(rowId) : null, value: item.morning });
          }
          if (item.afternoon) {
            recipes.Afternoon.push({ id: rowId ? String(rowId) : null, value: item.afternoon });
          }
          if (item.night) {
            recipes.Night.push({ id: rowId ? String(rowId) : null, value: item.night });
          }
        });
        
        recipesData = recipes;
        return recipes;
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      currentRecipe = null;
      renderRecipeDisplayMessage('Error loading recipes. Please try again.');
      return null;
    } finally {
      isLoading = false;
    }
  }

  function getRandomRecipe(time) {
    if (!recipesData) {
      return null;
    }
    const availableRecipes = recipesData[time];
    if (availableRecipes && availableRecipes.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableRecipes.length);
      return availableRecipes[randomIndex];
    }
    return null;
  }

  // Initializer
  fetchRecipes().then(() => {
    if (recipesData) {
      renderInitialRecipes(); 
      updateViewVisibility(); 
    }
  });
  
  if (recipeContent) {
    recipeContent.addEventListener('dblclick', (event) => {
        // Double-click is ONLY relevant in the 'Show Recipes' list view
        if (!isShowingRecipesView) return;

        let target = event.target;
        let recipeData = null;

        while (target && target !== recipeContent) {
            if (target.tagName === 'LI' && target.dataset.id) {
                recipeData = {
                    id: target.dataset.id,
                    column: target.dataset.column,
                    label: target.dataset.label,
                    value: target.textContent.trim()
                };
                break;
            }
            target = target.parentElement;
        }
        
        if (recipeData) {
            showInlineUpdateForm(recipeData);
        }
    });
  }


  if (openAddSheetBtn) {
    openAddSheetBtn.addEventListener('click', openAddSheet);
  }

  if (closeAddSheetBtn) {
    closeAddSheetBtn.addEventListener('click', closeAddSheet);
  }

  if (addSheetOverlay) {
    addSheetOverlay.addEventListener('click', (event) => {
      if (event.target === addSheetOverlay) {
        closeAddSheet();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && addSheetOverlay?.classList.contains('visible')) {
      closeAddSheet();
    }
  });

  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      if (!isShowingRecipesView) return; 

      if (currentlyActiveButton) {
        currentlyActiveButton.classList.remove('active');
      }
      button.classList.add('active');
      currentlyActiveButton = button;

      const time = button.dataset.time;
      if (!time) {
        return;
      }
      currentTimeKey = time;
      
      renderRecipeDisplayMessage('Loading...');

      if (!recipesData) {
        await fetchRecipes();
      }

      renderAllRecipesForTime(time);
      syncAddChipsWithCurrentTime(time);
    });
  });

  if (shuffleButton) {
    shuffleButton.addEventListener('click', () => {
        if (shuffleButton.disabled) return; 
        
        if (!recipesData) {
            renderRecipeDisplayMessage('Loading recipes...');
            fetchRecipes().then(renderInitialRecipes);
        } else {
            renderInitialRecipes(); 
        }
    });
  }
  
  if (showRecipesButton && timeKeypad) {
    showRecipesButton.addEventListener('click', () => {
      isShowingRecipesView = !isShowingRecipesView; 

      if (currentlyActiveButton) {
        currentlyActiveButton.classList.remove('active');
        currentlyActiveButton = null;
      }

      updateViewVisibility(); 

      if (isShowingRecipesView) {
        currentTimeKey = null;
        currentRecipe = null;
        renderRecipeDisplayMessage('Select a time to view all recipes.');
      } else {
        renderInitialRecipes();
      }
    });
  }

  chipButtons.forEach(chip => {
    chip.addEventListener('click', () => {
      const value = chip.dataset.value;
      if (!value || !addColumnSelect) {
        return;
      }
      addColumnSelect.value = value;
      setChipSelection(value);
    });
  });

  if (addRecipeForm) {
    addRecipeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(addRecipeForm);
      const column = formData.get('column')?.toString().trim().toLowerCase();
      const value = formData.get('value')?.toString().trim();

      if (!column || !value) {
        setStatus(addStatus, 'Time and recipe are required.', true);
        return;
      }

      setStatus(addStatus, 'Adding recipe...');

      try {
        await submitAddRecipe({ [column]: value });
        setStatus(addStatus, `Recipe added to ${column}.`);
        addRecipeForm.reset();
        syncAddChipsWithCurrentTime(column);
        closeAddSheet();
        await fetchRecipes();
        
        if (isShowingRecipesView && currentTimeKey) {
            renderAllRecipesForTime(currentTimeKey);
        } else {
            renderInitialRecipes();
        }

      } catch (error) {
        console.error(error);
        setStatus(addStatus, error.message || 'Failed to add recipe.', true);
      }
    });
  }

});