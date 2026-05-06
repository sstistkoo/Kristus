/*****
 * Complete modification script for promptLibrary.js and main.js
 * Implements ability to add new prompts to any category from the prompt library
 *****/

const fs = require('fs');
const PLPath = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
const mainPath = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/main.js';

let pl = fs.readFileSync(PLPath, 'utf8');
let main = fs.readFileSync(mainPath, 'utf8');

/*** promptLibrary.js modifications ***/

// 1. Add USER_ADDED_PROMPTS_KEY constant
pl = pl.replace(
  "  const SECONDARY_PROMPTS_KEY = 'strong_secondary_prompts';",
  "  const SECONDARY_PROMPTS_KEY = 'strong_secondary_prompts';\n  const USER_ADDED_PROMPTS_KEY = 'strong_user_added_prompts';"
);

// 2. Add getStoredUserAddedPrompts and saveStoredUserAddedPrompts after saveStoredImportedPromptLibrary
pl = pl.replace(
  `  function saveStoredImportedPromptLibrary(data) {
    localStorage.setItem(PROMPT_LIBRARY_IMPORTED_KEY, JSON.stringify(data || {}));
  }

  function rebuildPromptLibrary`,
  `  function saveStoredImportedPromptLibrary(data) {
    localStorage.setItem(PROMPT_LIBRARY_IMPORTED_KEY, JSON.stringify(data || {}));
  }

  function getStoredUserAddedPrompts() {
    try {
      const raw = localStorage.getItem(USER_ADDED_PROMPTS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch {
      return {};
    }
  }

  function saveStoredUserAddedPrompts(data) {
    localStorage.setItem(USER_ADDED_PROMPTS_KEY, JSON.stringify(data || {}));
  }

  function rebuildPromptLibrary`
);

// 3. Update rebuildPromptLibrary to merge user-added prompts from each category
pl = pl.replace(
  `  function rebuildPromptLibrary(currentSavedPrompt = '') {
    state.PROMPT_LIBRARY = clonePromptLibraryBase();
    const importedByCategory = getStoredImportedPromptLibrary();
    for (const [category, prompts] of Object.entries(importedByCategory)) {
      if (!Array.isArray(prompts)) continue;
      if (!state.PROMPT_LIBRARY[category]) state.PROMPT_LIBRARY[category] = [];
      for (const item of prompts) {
        if (!item || typeof item.text !== 'string') continue;
        if (!state.PROMPT_LIBRARY[category].some((p) => p.text === item.text)) {
          state.PROMPT_LIBRARY[category].push({
            name: String(item.name || t('prompt.library.imported.name')),
            desc: String(item.desc || t('prompt.library.imported.desc')),
            text: item.text
          });
        }
      }
    }
    const customSaved = localStorage.getItem('strong_custom_prompt');
    const importedCustom = getStoredCustomPromptLibrary();
    const customEntries = [];`,
  `  function rebuildPromptLibrary(currentSavedPrompt = '') {
    state.PROMPT_LIBRARY = clonePromptLibraryBase();
    const importedByCategory = getStoredImportedPromptLibrary();
    for (const [category, prompts] of Object.entries(importedByCategory)) {
      if (!Array.isArray(prompts)) continue;
      if (!state.PROMPT_LIBRARY[category]) state.PROMPT_LIBRARY[category] = [];
      for (const item of prompts) {
        if (!item || typeof item.text !== 'string') continue;
        if (!state.PROMPT_LIBRARY[category].some((p) => p.text === item.text)) {
          state.PROMPT_LIBRARY[category].push({
            name: String(item.name || t('prompt.library.imported.name')),
            desc: String(item.desc || t('prompt.library.imported.desc')),
            text: item.text
          });
        }
      }
    }
    // Merge user-added prompts for each category
    const userAddedByCategory = getStoredUserAddedPrompts();
    for (const [category, prompts] of Object.entries(userAddedByCategory)) {
      if (!Array.isArray(prompts)) continue;
      if (!state.PROMPT_LIBRARY[category]) state.PROMPT_LIBRARY[category] = [];
      for (const item of prompts) {
        if (!item || typeof item.text !== 'string') continue;
        if (!state.PROMPT_LIBRARY[category].some((p) => p.text === item.text)) {
          state.PROMPT_LIBRARY[category].push({
            name: String(item.name || t('prompt.library.untitled')),
            desc: String(item.desc || ''),
            text: item.text,
            system: item.system || ''
          });
        }
      }
    }
    const customSaved = localStorage.getItem('strong_custom_prompt');
    const importedCustom = getStoredCustomPromptLibrary();
    const customEntries = [];`
);

// 4. Add user prompt management functions after deleteSecondaryPrompt
pl = pl.replace(
  `  function deleteSecondaryPrompt() {
    const index = state.selectedPromptIndex;
    if (index < 0) {
      showToast(t('toast.prompt.selectFirst') || 'Nejprve vyber prompt k smazání');
      return;
    }

    if (!confirm(t('toast.prompt.confirmDelete') || 'Opravdu smazat tento prompt?')) return;

    const prompts = getStoredSecondaryPrompts();
    if (index >= prompts.length) return;

    prompts.splice(index, 1);
    saveStoredSecondaryPrompts(prompts);

    state.selectedPromptIndex = -1;
    loadDualEditorForCurrentSelection();
    renderPromptList();
    showToast(t('toast.prompt.deleted') || 'Prompt smazán');
  }

  function applySecondaryPrompt() {`,
  `  function deleteSecondaryPrompt() {
    const index = state.selectedPromptIndex;
    if (index < 0) {
      showToast(t('toast.prompt.selectFirst') || 'Nejprve vyber prompt k smazání');
      return;
    }

    if (!confirm(t('toast.prompt.confirmDelete') || 'Opravdu smazat tento prompt?')) return;

    const prompts = getStoredSecondaryPrompts();
    if (index >= prompts.length) return;

    prompts.splice(index, 1);
    saveStoredSecondaryPrompts(prompts);

    state.selectedPromptIndex = -1;
    loadDualEditorForCurrentSelection();
    renderPromptList();
    showToast(t('toast.prompt.deleted') || 'Prompt smazán');
  }

  function addUserPromptToCategory(category, name, desc, text, system) {
    const userAdded = getStoredUserAddedPrompts();
    if (!userAdded[category]) userAdded[category] = [];
    // Check for duplicate
    if (userAdded[category].some((p) => p.text === text)) {
      return false;
    }
    userAdded[category].push({
      name: name,
      desc: desc || '',
      text: text,
      system: system || ''
    });
    saveStoredUserAddedPrompts(userAdded);
    return true;
  }

  function deleteUserPromptByIndex(category, index) {
    const userAdded = getStoredUserAddedPrompts();
    if (!userAdded[category] || !Array.isArray(userAdded[category]) || index < 0 || index >= userAdded[category].length) {
      return false;
    }
    userAdded[category].splice(index, 1);
    saveStoredUserAddedPrompts(userAdded);
    return true;
  }

  function isUserAddedPrompt(category, name, text) {
    const userAdded = getStoredUserAddedPrompts();
    if (!userAdded[category] || !Array.isArray(userAdded[category])) return false;
    return userAdded[category].some(p => p.text === text && p.name === name);
  }

  function handleDeleteUserPrompt() {
    const category = state.selectedPromptCategory;
    const index = state.selectedPromptIndex;
    const prompts = state.PROMPT_LIBRARY[category] || [];
    const entry = prompts[index];
    if (!entry) {
      showToast(t('toast.prompt.selectFirst') || 'Nejprve vyber prompt k smazání');
      return;
    }
    if (!confirm(t('toast.prompt.confirmDelete') || 'Opravdu smazat tento prompt?')) return;
    const userAdded = getStoredUserAddedPrompts();
    if (!userAdded[category] || !Array.isArray(userAdded[category])) {
      showToast(t('toast.prompt.notUserAdded') || 'Tento prompt nelze smazat');
      return;
    }
    const userIndex = userAdded[category].findIndex(p => p.text === entry.text && p.name === entry.name);
    if (userIndex < 0) {
      showToast(t('toast.prompt.notUserAdded') || 'Tento prompt nelze smazat');
      return;
    }
    deleteUserPromptByIndex(category, userIndex);
    rebuildPromptLibrary(localStorage.getItem('strong_prompt') || '');
    state.selectedPromptIndex = Math.max(0, Math.min(state.selectedPromptIndex, prompts.length - 2));
    loadDualEditorForCurrentSelection();
    renderPromptList();
    showToast(t('toast.prompt.deleted') || 'Prompt smazán');
  }

  function applySecondaryPrompt() {`
);

// 5. Update showAddCustomPromptModal to save to current category
pl = pl.replace(
  `  function showAddCustomPromptModal() {
    const name = prompt(t('prompt.library.namePrompt') || 'Zadej název nového promptu:', '');
    if (!name) return;

    const desc = prompt(t('prompt.library.descPrompt') || 'Zadej popis promptu (volitelné):', '') || '';

    const sysEl = document.getElementById('librarySystemPrompt');
    const userEl = document.getElementById('libraryUserPrompt');
    const newPrompt = {
      name: name,
      desc: desc,
      text: userEl ? userEl.value : '',
      system: sysEl ? sysEl.value : getActiveSystemMessage()
    };

    const existing = getStoredCustomPromptLibrary();
    existing.push(newPrompt);
    saveStoredCustomPromptLibrary(existing);
    rebuildPromptLibrary(localStorage.getItem('strong_prompt') || '');
    renderPromptList();
    showToast(t('toast.prompt.saved') || 'Prompt uložen');
  }`,
  `  function showAddCustomPromptModal() {
    const category = state.selectedPromptCategory;
    const sysEl = document.getElementById('librarySystemPrompt');
    const userEl = document.getElementById('libraryUserPrompt');
    const currentUserText = userEl ? userEl.value.trim() : '';
    const currentSystemText = sysEl ? sysEl.value.trim() : '';

    if (!currentUserText) {
      showToast(t('toast.prompt.empty') || 'Uživatelský prompt nesmí být prázdný');
      return;
    }

    const name = prompt(t('prompt.library.namePrompt') || 'Zadej název nového promptu:', '');
    if (!name) return;

    const desc = prompt(t('prompt.library.descPrompt') || 'Zadej popis promptu (volitelné):', '') || '';

    const success = addUserPromptToCategory(category, name, desc, currentUserText, currentSystemText);
    if (!success) {
      showToast(t('toast.prompt.duplicate') || 'Tento prompt již existuje v kategorii');
      return;
    }

    rebuildPromptLibrary(localStorage.getItem('strong_prompt') || '');
    renderPromptList();
    showToast(t('toast.prompt.saved') || 'Prompt uložen');
  }`
);

// 6. Update applySelectedPrompt to handle non-custom categories
pl = pl.replace(
  ` function applySelectedPrompt() {
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
  }`,
  ` function applySelectedPrompt() {
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
  }`
);

// 7. Update updatePromptActions to include delete button for user-added prompts
pl = pl.replace(
  `    } else {
      actionsContainer.innerHTML = `,
  `    } else {
      const entry = state.PROMPT_LIBRARY[category]?.[state.selectedPromptIndex];
      const isUserAdded = entry && isUserAddedPrompt(category, entry.name, entry.text);
      const deleteBtn = isUserAdded
        ? '<button type="button" class="prompt-btn red" onclick="handleDeleteUserPrompt()" title="Smazat tento prompt">🗑 Smazat</button>'
        : '';
      actionsContainer.innerHTML = `
);

// 8. Update export section to include new functions
pl = pl.replace(
  `  return {
        initializePromptLibrary,
        getStoredCustomPromptLibrary,
        saveStoredCustomPromptLibrary,
        getStoredImportedPromptLibrary,
        saveStoredImportedPromptLibrary,
        rebuildPromptLibrary,
        getSystemPromptForCurrentTask,
        isPromptAutoModeEnabled,
        setMainPrompt,
        applySystemPromptForCurrentTask,
        togglePromptModeQuick,
        updatePromptAutoButton,
        togglePromptAutoMode,
        showPromptLibraryModal,
        matchPromptToPreset,
        closePromptLibraryModal,
        renderPromptList,
        selectPrompt,
        applySelectedPrompt,
        exportPromptLibraryToTxt,
        importPromptLibraryFromFile,
        showAddCustomPromptModal,
        updatePromptStatusIndicator,
        updatePromptActions,
        // Secondary prompts
        getStoredSecondaryPrompts,
        saveStoredSecondaryPrompts,
        showSecondaryPromptsModal,
        closeSecondaryPromptsModal,
        renderSecondaryPromptList,
        selectSecondaryPrompt,
        addSecondaryPrompt,
        saveSecondaryPrompt,
        updateSecondaryPrompt,
        deleteSecondaryPrompt,
        loadSecondaryEditorForCurrentSelection,
        applySecondaryPrompt
      };`,
  `  return {
        initializePromptLibrary,
        getStoredCustomPromptLibrary,
        saveStoredCustomPromptLibrary,
        getStoredImportedPromptLibrary,
        saveStoredImportedPromptLibrary,
        getStoredUserAddedPrompts,
        rebuildPromptLibrary,
        getSystemPromptForCurrentTask,
        isPromptAutoModeEnabled,
        setMainPrompt,
        applySystemPromptForCurrentTask,
        togglePromptModeQuick,
        updatePromptAutoButton,
        togglePromptAutoMode,
        showPromptLibraryModal,
        matchPromptToPreset,
        closePromptLibraryModal,
        renderPromptList,
        selectPrompt,
        applySelectedPrompt,
        exportPromptLibraryToTxt,
        importPromptLibraryFromFile,
        showAddCustomPromptModal,
        handleDeleteUserPrompt,
        updatePromptStatusIndicator,
        updatePromptActions,
        // Secondary prompts
        getStoredSecondaryPrompts,
        saveStoredSecondaryPrompts,
        showSecondaryPromptsModal,
        closeSecondaryPromptsModal,
        renderSecondaryPromptList,
        selectSecondaryPrompt,
        addSecondaryPrompt,
        saveSecondaryPrompt,
        updateSecondaryPrompt,
        deleteSecondaryPrompt,
        loadSecondaryEditorForCurrentSelection,
        applySecondaryPrompt
      };`
);

/*** main.js modifications ***/

// 9. Add getStoredUserAddedPrompts and handleDeleteUserPrompt to imports
main = main.replace(
  `  const {
    initializePromptLibrary,
    getStoredCustomPromptLibrary,
    saveStoredCustomPromptLibrary,
    getStoredImportedPromptLibrary,
    saveStoredImportedPromptLibrary,
    rebuildPromptLibrary,
    getSystemPromptForCurrentTask,
    isPromptAutoModeEnabled,
    setMainPrompt,
    applySystemPromptForCurrentTask,
    togglePromptModeQuick,
    updatePromptAutoButton,
    togglePromptAutoMode,
    showPromptLibraryModal,
    matchPromptToPreset,
    closePromptLibraryModal,
    renderPromptList,
    selectPrompt,
    applySelectedPrompt,
    exportPromptLibraryToTxt,
    importPromptLibraryFromFile,
    showAddCustomPromptModal,
    updatePromptStatusIndicator,
    updatePromptActions,
    // Secondary prompts
    getStoredSecondaryPrompts,
    saveStoredSecondaryPrompts,
    showSecondaryPromptsModal,
    closeSecondaryPromptsModal,
    renderSecondaryPromptList,
    selectSecondaryPrompt,
    addSecondaryPrompt,
    saveSecondaryPrompt,
    updateSecondaryPrompt,
    deleteSecondaryPrompt,
    loadSecondaryEditorForCurrentSelection,
    applySecondaryPrompt
  } = promptLibraryApi;`,
  `  const {
    initializePromptLibrary,
    getStoredCustomPromptLibrary,
    saveStoredCustomPromptLibrary,
    getStoredImportedPromptLibrary,
    saveStoredImportedPromptLibrary,
    getStoredUserAddedPrompts,
    rebuildPromptLibrary,
    getSystemPromptForCurrentTask,
    isPromptAutoModeEnabled,
    setMainPrompt,
    applySystemPromptForCurrentTask,
    togglePromptModeQuick,
    updatePromptAutoButton,
    togglePromptAutoMode,
    showPromptLibraryModal,
    matchPromptToPreset,
    closePromptLibraryModal,
    renderPromptList,
    selectPrompt,
    applySelectedPrompt,
    exportPromptLibraryToTxt,
    importPromptLibraryFromFile,
    showAddCustomPromptModal,
    handleDeleteUserPrompt,
    updatePromptStatusIndicator,
    updatePromptActions,
    // Secondary prompts
    getStoredSecondaryPrompts,
    saveStoredSecondaryPrompts,
    showSecondaryPromptsModal,
    closeSecondaryPromptsModal,
    renderSecondaryPromptList,
    selectSecondaryPrompt,
    addSecondaryPrompt,
    saveSecondaryPrompt,
    updateSecondaryPrompt,
    deleteSecondaryPrompt,
    loadSecondaryEditorForCurrentSelection,
    applySecondaryPrompt
  } = promptLibraryApi;`
);

// 10. Add window.handleDeleteUserPrompt export
main = main.replace(
  `window.showPromptLibraryModal = promptLibraryApi.showPromptLibraryModal;
window.closePromptLibraryModal = promptLibraryApi.closePromptLibraryModal;
window.selectPrompt = promptLibraryApi.selectPrompt;
 window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;
window.exportPromptLibraryToTxt = promptLibraryApi.exportPromptLibraryToTxt;
window.importPromptLibraryFromFile = promptLibraryApi.importPromptLibraryFromFile;`,
  `window.showPromptLibraryModal = promptLibraryApi.showPromptLibraryModal;
window.closePromptLibraryModal = promptLibraryApi.closePromptLibraryModal;
window.selectPrompt = promptLibraryApi.selectPrompt;
 window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;
window.handleDeleteUserPrompt = promptLibraryApi.handleDeleteUserPrompt;
window.exportPromptLibraryToTxt = promptLibraryApi.exportPromptLibraryToTxt;
window.importPromptLibraryFromFile = promptLibraryApi.importPromptLibraryFromFile;`
);

/*** Write files ***/
fs.writeFileSync(PLPath, pl);
fs.writeFileSync(mainPath, main);

console.log('=== All modifications completed successfully ===');
console.log('promptLibrary.js and main.js have been updated.');
console.log('');
console.log('Summary of changes:');
console.log('1. Added USER_ADDED_PROMPTS_KEY constant to promptLibrary.js');
console.log('2. Added getStoredUserAddedPrompts() and saveStoredUserAddedPrompts() functions');
console.log('3. Updated rebuildPromptLibrary() to merge user-added prompts per category');
console.log('4. Added addUserPromptToCategory(), deleteUserPromptByIndex(), isUserAddedPrompt(), handleDeleteUserPrompt()');
console.log('5. Updated showAddCustomPromptModal() to save to current category (not just "custom")');
console.log('6. Updated applySelectedPrompt() to allow saving to any category');
console.log('7. Updated updatePromptActions() to show delete button for user-added prompts');
console.log('8. Exported new functions from promptLibrary.js');
console.log('9. Added imports to main.js');
console.log('10. Added window.handleDeleteUserPrompt export');
