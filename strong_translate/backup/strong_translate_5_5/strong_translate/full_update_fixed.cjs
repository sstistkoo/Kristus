/***** Full Update Script - Fixed *****/
const fs = require('fs');
const PLPath = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
const mainPath = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/main.js';

let pl = fs.readFileSync(PLPath, 'utf8');
let main = fs.readFileSync(mainPath, 'utf8');

// Helper to verify a replacement worked
function verifyReplace(name, original, modified) {
  if (original === modified) {
    console.log('✗ FAILED:', name, '- string not replaced (match failed)');
    return false;
  }
  console.log('✓ OK:', name);
  return true;
}

let plBefore, plAfter;

// 1. Add USER_ADDED_PROMPTS_KEY
plBefore = pl;
pl = pl.replace(
  `  const SECONDARY_PROMPTS_KEY = 'strong_secondary_prompts';`,
  `  const SECONDARY_PROMPTS_KEY = 'strong_secondary_prompts';\n  const USER_ADDED_PROMPTS_KEY = 'strong_user_added_prompts';`
);
verifyReplace('USER_ADDED_PROMPTS_KEY', plBefore, pl);

// 2. Add get/set user-added prompts after saveStoredImportedPromptLibrary
plBefore = pl;
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
verifyReplace('getStoredUserAddedPrompts & saveStoredUserAddedPrompts', plBefore, pl);

// 3. Update rebuildPromptLibrary to merge user-added prompts
plBefore = pl;
pl = pl.replace(
  `    const customSaved = localStorage.getItem('strong_custom_prompt');
    const importedCustom = getStoredCustomPromptLibrary();
    const customEntries = [];`,
  `    // Merge user-added prompts for each category
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
verifyReplace('rebuildPromptLibrary merge user-added', plBefore, pl);

// 4. Add user prompt functions after deleteSecondaryPrompt
plBefore = pl;
const insertUserFuncs = `  function addUserPromptToCategory(category, name, desc, text, system) {
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

`;
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

${insertUserFuncs}  function applySecondaryPrompt() {`
);
verifyReplace('user prompt management functions', plBefore, pl);

// 5. Update showAddCustomPromptModal
plBefore = pl;
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
verifyReplace('showAddCustomPromptModal', plBefore, pl);

// 6. Update applySelectedPrompt
plBefore = pl;
pl = pl.replace(
  `    if (state.selectedPromptCategory === 'custom') {
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
  `    // For built-in categories (default, detailed, concise, literal, test, library, custom)
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
verifyReplace('applySelectedPrompt non-custom handling', plBefore, pl);

// 7. Update updatePromptActions for delete button
plBefore = pl;
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
verifyReplace('updatePromptActions delete button', plBefore, pl);

// 8. Update exports
plBefore = pl;
pl = pl.replace(
  `        showAddCustomPromptModal,
        updatePromptStatusIndicator,
        updatePromptActions,`,
  `        showAddCustomPromptModal,
        handleDeleteUserPrompt,
        updatePromptStatusIndicator,
        updatePromptActions,`
);
verifyReplace('export handleDeleteUserPrompt', plBefore, pl);

plBefore = pl;
pl = pl.replace(
  `        getStoredImportedPromptLibrary,
        saveStoredImportedPromptLibrary,
        rebuildPromptLibrary,`,
  `        getStoredImportedPromptLibrary,
        saveStoredImportedPromptLibrary,
        getStoredUserAddedPrompts,
        rebuildPromptLibrary,`
);
verifyReplace('export getStoredUserAddedPrompts', plBefore, pl);

/*** main.js updates ***/

// 9. main.js imports
mainBefore = main;
main = main.replace(
  `        getStoredImportedPromptLibrary,
        saveStoredImportedPromptLibrary,
        rebuildPromptLibrary,`,
  `        getStoredImportedPromptLibrary,
        saveStoredImportedPromptLibrary,
        getStoredUserAddedPrompts,
        rebuildPromptLibrary,`
);
verifyReplace('main.js getStoredUserAddedPrompts import', mainBefore, main);

mainBefore = main;
main = main.replace(
  `        showAddCustomPromptModal,
        updatePromptStatusIndicator,
        updatePromptActions,`,
  `        showAddCustomPromptModal,
        handleDeleteUserPrompt,
        updatePromptStatusIndicator,
        updatePromptActions,`
);
verifyReplace('main.js handleDeleteUserPrompt import', mainBefore, main);

// 10. main.js window export
mainBefore = main;
main = main.replace(
  `window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;`,
  `window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;
window.handleDeleteUserPrompt = promptLibraryApi.handleDeleteUserPrompt;`
);
verifyReplace('main.js window.handleDeleteUserPrompt export', mainBefore, main);

/*** Write files ***/
fs.writeFileSync(PLPath, pl);
fs.writeFileSync(mainPath, main);

console.log('');
console.log('=== All updates applied ===');
