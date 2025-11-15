document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbw5IIoGYCrQh1vCGxokHl5Uiy2sE-dW7ITA0KmBu2DGB78hKM64pQpH__9GkcJdgoLe/exec';
  const SHEET_NAME = 'Sheet1';

  const recipeDisplay = document.getElementById('recipe-display');
  const buttons = document.querySelectorAll('.phone-button');
  const addRecipeForm = document.getElementById('add-recipe-form');
  const addColumnSelect = document.getElementById('add-column');
  const openAddSheetBtn = document.getElementById('open-add-sheet');
  const closeAddSheetBtn = document.getElementById('close-add-sheet');
  const addSheetOverlay = document.getElementById('add-sheet-overlay');
  const chipButtons = document.querySelectorAll('.chip');
  const showAllToggle = document.getElementById('show-all-toggle');
  const inlineUpdateButton = document.getElementById('enable-inline-update');
  const addStatus = document.getElementById('add-status');

  let currentlyActiveButton = null;
  let recipesData = null;
  let isLoading = false;
  let currentRecipe = null;
  let inlineUpdateStatusEl = null;
  let currentTimeKey = null;
  let showAllMode = false;

  updateInlineButtonState();

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

  function updateInlineButtonState() {
    if (!inlineUpdateButton) return;
    inlineUpdateButton.disabled = showAllMode || !currentRecipe || !currentRecipe.id;
  }

  function renderCurrentRecipe(message) {
    if (!recipeDisplay) return;
    inlineUpdateStatusEl = null;

    if (message) {
      recipeDisplay.innerHTML = `<p>${message}</p>`;
      updateInlineButtonState();
      return;
    }

    if (showAllMode) {
      if (!currentTimeKey) {
        recipeDisplay.innerHTML = '<p>Select a time to view recipes.</p>';
        updateInlineButtonState();
        return;
      }
      const list = recipesData?.[currentTimeKey];
      if (!list || list.length === 0) {
        recipeDisplay.innerHTML = `<p>No recipes available for ${currentTimeKey.toLowerCase()}.</p>`;
        updateInlineButtonState();
        return;
      }
      const items = list.map(recipe => `<li>${recipe.value}</li>`).join('');
      recipeDisplay.innerHTML = `
        <div class="all-recipes">
          <div class="all-recipes-title">${currentTimeKey} recipes</div>
          <ol class="all-recipes-list">${items}</ol>
        </div>
      `;
      updateInlineButtonState();
      return;
    }

    if (!currentRecipe) {
      recipeDisplay.innerHTML = '<p>Select a time to get a recipe.</p>';
      updateInlineButtonState();
      return;
    }

    recipeDisplay.innerHTML = `<p>${currentRecipe.value}</p>`;
    updateInlineButtonState();
  }

  function openAddSheet() {
    if (!addSheetOverlay) return;
    syncAddChipsWithCurrentTime();
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

  function showInlineUpdateForm() {
    if (!currentRecipe || !currentRecipe.id) return;
    recipeDisplay.innerHTML = `
      <form id="inline-update-form" class="inline-update-form">
        <label>
          Editing ${currentRecipe.label || currentRecipe.column} recipe
          <textarea name="value" required>${currentRecipe.value}</textarea>
        </label>
        <div class="inline-update-actions">
          <button type="button" id="cancel-inline-update">Cancel</button>
          <button type="submit">Update</button>
        </div>
        <p class="status-message" id="inline-update-status"></p>
      </form>
    `;
    const inlineForm = document.getElementById('inline-update-form');
    inlineUpdateStatusEl = document.getElementById('inline-update-status');
    const cancelButton = document.getElementById('cancel-inline-update');
    cancelButton?.addEventListener('click', () => {
      inlineUpdateStatusEl = null;
      renderCurrentRecipe();
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
      currentRecipe.value = newValue;
      renderCurrentRecipe();
      await fetchRecipes();
    } catch (error) {
      console.error(error);
      setStatus(inlineUpdateStatusEl, error.message || 'Failed to update recipe.', true);
    }
  }

  // Fetch recipes from API
  async function fetchRecipes() {
    if (isLoading) return;
    
    try {
      isLoading = true;
      const url = buildApiUrl('read');
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        // Transform API data into recipe arrays
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
        if (showAllMode) {
          renderCurrentRecipe();
        }
        return recipes;
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      currentRecipe = null;
      recipeDisplay.innerHTML = '<p>Error loading recipes. Please try again.</p>';
      updateInlineButtonState();
      return null;
    } finally {
      isLoading = false;
    }
  }

  // Get random recipe for a specific time
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

  function setRandomRecipeForTime(timeKey) {
    const randomRecipe = getRandomRecipe(timeKey);
    if (randomRecipe) {
      currentRecipe = {
        id: randomRecipe.id,
        value: randomRecipe.value,
        column: timeKey.toLowerCase(),
        label: timeKey,
      };
      return true;
    }
    currentRecipe = null;
    return false;
  }

  async function submitAddRecipe(payload) {
    const url = buildApiUrl('write', payload);
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to add recipe');
    }
    return result;
  }

  async function submitUpdateRecipe({ id, column, value }) {
    const url = buildApiUrl('update', { id, column, value });
    const response = await fetch(url);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update recipe');
    }
    return result;
  }

  // Initialize: Fetch recipes on page load
  fetchRecipes().then(() => {
    if (recipesData) {
      currentRecipe = null;
      renderCurrentRecipe('Ready! Select a time to get a recipe.');
    }
  });

  if (openAddSheetBtn) {
    openAddSheetBtn.addEventListener('click', () => {
      openAddSheet();
    });
  }

  if (closeAddSheetBtn) {
    closeAddSheetBtn.addEventListener('click', () => {
      closeAddSheet();
    });
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
      // Deactivate previously active button
      if (currentlyActiveButton) {
        currentlyActiveButton.classList.remove('active');
      }
      // Activate the clicked button
      button.classList.add('active');
      currentlyActiveButton = button;

      const time = button.dataset.time;
      if (!time) {
        return;
      }
      currentTimeKey = time;
      
      // Show loading state
      recipeDisplay.innerHTML = '<p>Loading...</p>';
      currentRecipe = null;
      inlineUpdateStatusEl = null;
      updateInlineButtonState();

      // Ensure we have recipes data
      if (!recipesData) {
        await fetchRecipes();
      }

      if (showAllMode) {
        renderCurrentRecipe();
      } else if (setRandomRecipeForTime(time)) {
        renderCurrentRecipe();
      } else {
        renderCurrentRecipe('No recipes available for this time. Please try again later.');
      }

      syncAddChipsWithCurrentTime(time);
    });
  });

  if (inlineUpdateButton) {
    inlineUpdateButton.addEventListener('click', () => {
      if (!currentRecipe || !currentRecipe.id) {
        return;
      }
      showInlineUpdateForm();
    });
  }

  if (showAllToggle) {
    showAllToggle.addEventListener('change', () => {
      showAllMode = showAllToggle.checked;
      if (showAllMode) {
        currentRecipe = null;
      } else if (currentTimeKey) {
        setRandomRecipeForTime(currentTimeKey);
      }
      renderCurrentRecipe();
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
      } catch (error) {
        console.error(error);
        setStatus(addStatus, error.message || 'Failed to add recipe.', true);
      }
    });
  }

});
