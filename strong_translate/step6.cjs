/**
 * Step 6: Update applySelectedPrompt to handle non-custom categories
 */
const fs = require('fs');
const path = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
let c = fs.readFileSync(path, 'utf8');

const old = ` function applySelectedPrompt() {
    const sysEl = document.getElementById('librarySystemPrompt');
    const userEl = document.getElementById('libraryUserPrompt');
    const sysVal = sysEl ? sysEl.value.trim() : '';
    const userVal = userEl ? userEl.value.trim() : '';

    if (!sysVal) {
      showToast(t('toast.prompt.systemEmpty') || 'Systémový prompt nesmí být prázdný');
      return;
    }
    if (!userVal) {
      showToast(t('toast.prompt.empty') || 'Uživatelský prompt nesmí být prázdný');
      return;
    }

    if (state.selectedPromptCategory === 'secondary') {
      const name = prompt(t('prompt.library.namePrompt') || 'Zadej název promptu:', 'Sekundární prompt');
      if (!name) return;
      const desc = prompt(t('prompt.library.descPrompt') || 'Zadej popis (volitelné):', '') || '';

      const newPrompt = { name, desc, system: sysVal, user: userVal };
      const prompts = getStoredSecondaryPrompts();
      prompts.push(newPrompt);
      saveStoredSecondaryPrompts(prompts);
      state.selectedPromptIndex = prompts.length - 1;
      renderPromptList();
      showToast(t('toast.prompt.saved') || 'Sekundární prompt uložen');
      return;
    }

    localStorage.setItem('strong_custom_system_prompt', sysVal);
    setMainPrompt(userVal, 'custom');

    if (state.selectedPromptCategory === 'custom') {
      const imported = getStoredCustomPromptLibrary().filter((item) => item.text !== userVal);
      saveStoredCustomPromptLibrary(imported);
      rebuildPromptLibrary(userVal);
      const index = state.selectedPromptIndex;
      const customEntries = state.PROMPT_LIBRARY.custom || [];
      if (customEntries[index]) {
        customEntries[index] = { ...customEntries[index], system: sysVal, text: userVal };
        state.PROMPT_LIBRARY.custom = customEntries;
      }
    }

    closePromptLibraryModal();
    showToast(t('toast.prompt.savedApplied') || 'Prompt uložen a aplikován');
  }`;

const updated = ` function applySelectedPrompt() {
    const sysEl = document.getElementById('librarySystemPrompt');
    const userEl = document.getElementById('libraryUserPrompt');
    const sysVal = sysEl ? sysEl.value.trim() : '';
    const userVal = userEl ? userEl.value.trim() : '';

    if (!sysVal) {
      showToast(t('toast.prompt.systemEmpty') || 'Systémový prompt nesmí být prázdný');
      return;
    }
    if (!userVal) {
      showToast(t('toast.prompt.empty') || 'Uživatelský prompt nesmí být prázdný');
      return;
    }

    if (state.selectedPromptCategory === 'secondary') {
      const name = prompt(t('prompt.library.namePrompt') || 'Zadej název promptu:', 'Sekundární prompt');
      if (!name) return;
      const desc = prompt(t('prompt.library.descPrompt') || 'Zadej popis (volitelné):', '') || '';

      const newPrompt = { name, desc, system: sysVal, user: userVal };
      const prompts = getStoredSecondaryPrompts();
      prompts.push(newPrompt);
      saveStoredSecondaryPrompts(prompts);
      state.selectedPromptIndex = prompts.length - 1;
      renderPromptList();
      showToast(t('toast.prompt.saved') || 'Sekundární prompt uložen');
      return;
    }

    // For built-in categories (default, detailed, concise, literal, test, library, custom)
    // Save as user-added prompt to the current category
    const category = state.selectedPromptCategory;

    // Check if this exact prompt already exists in user-added for this category
    const userAdded = getStoredUserAddedPrompts();
    if (userAdded[category] && userAdded[category].some(p => p.text === userVal)) {
      showToast(t('toast.prompt.duplicate') || 'Tento prompt již existuje v kategorii');
      return;
    }

    const existingName = state.PROMPT_LIBRARY[category]?.[state.selectedPromptIndex]?.name || '';
    const desc = existingName ? existingName : (t('prompt.library.userAdded') || 'Vlastní');

    const success = addUserPromptToCategory(category, desc, '', userVal, sysVal);
    if (!success) {
      showToast(t('toast.prompt.duplicate') || 'Tento prompt již existuje v kategorii');
      return;
    }

    localStorage.setItem('strong_custom_system_prompt', sysVal);
    setMainPrompt(userVal, 'custom');

    if (category === 'custom') {
      const imported = getStoredCustomPromptLibrary().filter((item) => item.text !== userVal);
      saveStoredCustomPromptLibrary(imported);
      rebuildPromptLibrary(userVal);
      const index = state.selectedPromptIndex;
      const customEntries = state.PROMPT_LIBRARY.custom || [];
      if (customEntries[index]) {
        customEntries[index] = { ...customEntries[index], system: sysVal, text: userVal };
        state.PROMPT_LIBRARY.custom = customEntries;
      }
    }

    closePromptLibraryModal();
    showToast(t('toast.prompt.savedApplied') || 'Prompt uložen a aplikován');
  }`;

c = c.replace(old, updated);
fs.writeFileSync(path, c);
console.log('Step 6 done - updated applySelectedPrompt');
