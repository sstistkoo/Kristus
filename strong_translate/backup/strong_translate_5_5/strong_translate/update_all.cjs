/***** Complete Update Script - CRLF-aware *****/
const fs = require('fs');
const PLPath = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
const mainPath = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/main.js';

let pl = fs.readFileSync(PLPath, 'utf8');
let main = fs.readFileSync(mainPath, 'utf8');

const CRLF = '\r\n';
const LF = '\n';

// Helper
function ok(name, condition) {
  console.log((condition ? '✓' : '✗'), name);
  return condition;
}

// 1. Add USER_ADDED_PROMPTS_KEY constant
const old1 = `  const SECONDARY_PROMPTS_KEY = 'strong_secondary_prompts';${CRLF}`;
const new1 = `  const SECONDARY_PROMPTS_KEY = 'strong_secondary_prompts';${CRLF}  const USER_ADDED_PROMPTS_KEY = 'strong_user_added_prompts';${CRLF}`;
pl = pl.replace(old1, new1);
ok('USER_ADDED_PROMPTS_KEY', pl.includes('USER_ADDED_PROMPTS_KEY'));

// 2. Add getStoredUserAddedPrompts and saveStoredUserAddedPrompts
const old2 = `  function saveStoredImportedPromptLibrary(data) {${CRLF}    localStorage.setItem(PROMPT_LIBRARY_IMPORTED_KEY, JSON.stringify(data || {}));${CRLF}  }${CRLF}${CRLF}  function rebuildPromptLibrary`;
const new2 = `  function saveStoredImportedPromptLibrary(data) {${CRLF}    localStorage.setItem(PROMPT_LIBRARY_IMPORTED_KEY, JSON.stringify(data || {}));${CRLF}  }${CRLF}${CRLF}  function getStoredUserAddedPrompts() {${CRLF}    try {${CRLF}      const raw = localStorage.getItem(USER_ADDED_PROMPTS_KEY);${CRLF}      const parsed = raw ? JSON.parse(raw) : {};${CRLF}      if (!parsed || typeof parsed !== 'object') return {};${CRLF}      return parsed;${CRLF}    } catch {${CRLF}      return {};${CRLF}    }${CRLF}  }${CRLF}${CRLF}  function saveStoredUserAddedPrompts(data) {${CRLF}    localStorage.setItem(USER_ADDED_PROMPTS_KEY, JSON.stringify(data || {}));${CRLF}  }${CRLF}${CRLF}  function rebuildPromptLibrary`;
pl = pl.replace(old2, new2);
ok('get/set user-added prompts', pl.includes('function getStoredUserAddedPrompts'));

// 3. Update rebuildPromptLibrary to merge user-added prompts
const old3 = `    const customSaved = localStorage.getItem('strong_custom_prompt');${CRLF}    const importedCustom = getStoredCustomPromptLibrary();${CRLF}    const customEntries = [];`;
const new3 = `    // Merge user-added prompts for each category${CRLF}    const userAddedByCategory = getStoredUserAddedPrompts();${CRLF}    for (const [category, prompts] of Object.entries(userAddedByCategory)) {${CRLF}      if (!Array.isArray(prompts)) continue;${CRLF}      if (!state.PROMPT_LIBRARY[category]) state.PROMPT_LIBRARY[category] = [];${CRLF}      for (const item of prompts) {${CRLF}        if (!item || typeof item.text !== 'string') continue;${CRLF}        if (!state.PROMPT_LIBRARY[category].some((p) => p.text === item.text)) {${CRLF}          state.PROMPT_LIBRARY[category].push({${CRLF}            name: String(item.name || t('prompt.library.untitled')),${CRLF}            desc: String(item.desc || ''),${CRLF}            text: item.text,${CRLF}            system: item.system || ''${CRLF}          });${CRLF}        }${CRLF}      }${CRLF}    }${CRLF}    const customSaved = localStorage.getItem('strong_custom_prompt');${CRLF}    const importedCustom = getStoredCustomPromptLibrary();${CRLF}    const customEntries = [];`;
pl = pl.replace(old3, new3);
ok('rebuildPromptLibrary merge user-added', pl.includes('userAddedByCategory'));

// 4. Add user prompt functions after deleteSecondaryPrompt
const old4 = `  function deleteSecondaryPrompt() {${CRLF}    const index = state.selectedPromptIndex;${CRLF}    if (index < 0) {${CRLF}      showToast(t('toast.prompt.selectFirst') || 'Nejprve vyber prompt k smazání');${CRLF}      return;${CRLF}    }${CRLF}${CRLF}    if (!confirm(t('toast.prompt.confirmDelete') || 'Opravdu smazat tento prompt?')) return;${CRLF}${CRLF}    const prompts = getStoredSecondaryPrompts();${CRLF}    if (index >= prompts.length) return;${CRLF}${CRLF}    prompts.splice(index, 1);${CRLF}    saveStoredSecondaryPrompts(prompts);${CRLF}${CRLF}    state.selectedPromptIndex = -1;${CRLF}    loadDualEditorForCurrentSelection();${CRLF}    renderPromptList();${CRLF}    showToast(t('toast.prompt.deleted') || 'Prompt smazán');${CRLF}  }${CRLF}${CRLF}  function applySecondaryPrompt() {`;
const new4 = `  function deleteSecondaryPrompt() {${CRLF}    const index = state.selectedPromptIndex;${CRLF}    if (index < 0) {${CRLF}      showToast(t('toast.prompt.selectFirst') || 'Nejprve vyber prompt k smazání');${CRLF}      return;${CRLF}    }${CRLF}${CRLF}    if (!confirm(t('toast.prompt.confirmDelete') || 'Opravdu smazat tento prompt?')) return;${CRLF}${CRLF}    const prompts = getStoredSecondaryPrompts();${CRLF}    if (index >= prompts.length) return;${CRLF}${CRLF}    prompts.splice(index, 1);${CRLF}    saveStoredSecondaryPrompts(prompts);${CRLF}${CRLF}    state.selectedPromptIndex = -1;${CRLF}    loadDualEditorForCurrentSelection();${CRLF}    renderPromptList();${CRLF}    showToast(t('toast.prompt.deleted') || 'Prompt smazán');${CRLF}  }${CRLF}${CRLF}  function addUserPromptToCategory(category, name, desc, text, system) {${CRLF}    const userAdded = getStoredUserAddedPrompts();${CRLF}    if (!userAdded[category]) userAdded[category] = [];${CRLF}    // Check for duplicate${CRLF}    if (userAdded[category].some((p) => p.text === text)) {${CRLF}      return false;${CRLF}    }${CRLF}    userAdded[category].push({${CRLF}      name: name,${CRLF}      desc: desc || '',${CRLF}      text: text,${CRLF}      system: system || ''${CRLF}    });${CRLF}    saveStoredUserAddedPrompts(userAdded);${CRLF}    return true;${CRLF}  }${CRLF}${CRLF}  function deleteUserPromptByIndex(category, index) {${CRLF}    const userAdded = getStoredUserAddedPrompts();${CRLF}    if (!userAdded[category] || !Array.isArray(userAdded[category]) || index < 0 || index >= userAdded[category].length) {${CRLF}      return false;${CRLF}    }${CRLF}    userAdded[category].splice(index, 1);${CRLF}    saveStoredUserAddedPrompts(userAdded);${CRLF}    return true;${CRLF}  }${CRLF}${CRLF}  function isUserAddedPrompt(category, name, text) {${CRLF}    const userAdded = getStoredUserAddedPrompts();${CRLF}    if (!userAdded[category] || !Array.isArray(userAdded[category])) return false;${CRLF}    return userAdded[category].some(p => p.text === text && p.name === name);${CRLF}  }${CRLF}${CRLF}  function handleDeleteUserPrompt() {${CRLF}    const category = state.selectedPromptCategory;${CRLF}    const index = state.selectedPromptIndex;${CRLF}    const prompts = state.PROMPT_LIBRARY[category] || [];${CRLF}    const entry = prompts[index];${CRLF}    if (!entry) {${CRLF}      showToast(t('toast.prompt.selectFirst') || 'Nejprve vyber prompt k smazání');${CRLF}      return;${CRLF}    }${CRLF}    if (!confirm(t('toast.prompt.confirmDelete') || 'Opravdu smazat tento prompt?')) return;${CRLF}    const userAdded = getStoredUserAddedPrompts();${CRLF}    if (!userAdded[category] || !Array.isArray(userAdded[category])) {${CRLF}      showToast(t('toast.prompt.notUserAdded') || 'Tento prompt nelze smazat');${CRLF}      return;${CRLF}    }${CRLF}    const userIndex = userAdded[category].findIndex(p => p.text === entry.text && p.name === entry.name);${CRLF}    if (userIndex < 0) {${CRLF}      showToast(t('toast.prompt.notUserAdded') || 'Tento prompt nelze smazat');${CRLF}      return;${CRLF}    }${CRLF}    deleteUserPromptByIndex(category, userIndex);${CRLF}    rebuildPromptLibrary(localStorage.getItem('strong_prompt') || '');${CRLF}    state.selectedPromptIndex = Math.max(0, Math.min(state.selectedPromptIndex, prompts.length - 2));${CRLF}    loadDualEditorForCurrentSelection();${CRLF}    renderPromptList();${CRLF}    showToast(t('toast.prompt.deleted') || 'Prompt smazán');${CRLF}  }${CRLF}${CRLF}  function applySecondaryPrompt() {`;
pl = pl.replace(old4, new4);
ok('user prompt management functions', pl.includes('function handleDeleteUserPrompt'));

// 5. Update showAddCustomPromptModal
const old5 = `  function showAddCustomPromptModal() {${CRLF}    const name = prompt(t('prompt.library.namePrompt') || 'Zadej název nového promptu:', '');${CRLF}    if (!name) return;${CRLF}${CRLF}    const desc = prompt(t('prompt.library.descPrompt') || 'Zadej popis promptu (volitelné):', '') || '';${CRLF}${CRLF}    const sysEl = document.getElementById('librarySystemPrompt');${CRLF}    const userEl = document.getElementById('libraryUserPrompt');${CRLF}    const newPrompt = {${CRLF}      name: name,${CRLF}      desc: desc,${CRLF}      text: userEl ? userEl.value : '',${CRLF}      system: sysEl ? sysEl.value : getActiveSystemMessage()${CRLF}    };${CRLF}${CRLF}    const existing = getStoredCustomPromptLibrary();${CRLF}    existing.push(newPrompt);${CRLF}    saveStoredCustomPromptLibrary(existing);${CRLF}    rebuildPromptLibrary(localStorage.getItem('strong_prompt') || '');${CRLF}    renderPromptList();${CRLF}    showToast(t('toast.prompt.saved') || 'Prompt uložen');${CRLF}  }`;
const new5 = `  function showAddCustomPromptModal() {${CRLF}    const category = state.selectedPromptCategory;${CRLF}    const sysEl = document.getElementById('librarySystemPrompt');${CRLF}    const userEl = document.getElementById('libraryUserPrompt');${CRLF}    const currentUserText = userEl ? userEl.value.trim() : '';${CRLF}    const currentSystemText = sysEl ? sysEl.value.trim() : '';${CRLF}${CRLF}    if (!currentUserText) {${CRLF}      showToast(t('toast.prompt.empty') || 'Uživatelský prompt nesmí být prázdný');${CRLF}      return;${CRLF}    }${CRLF}${CRLF}    const name = prompt(t('prompt.library.namePrompt') || 'Zadej název nového promptu:', '');${CRLF}    if (!name) return;${CRLF}${CRLF}    const desc = prompt(t('prompt.library.descPrompt') || 'Zadej popis promptu (volitelné):', '') || '';${CRLF}${CRLF}    const success = addUserPromptToCategory(category, name, desc, currentUserText, currentSystemText);${CRLF}    if (!success) {${CRLF}      showToast(t('toast.prompt.duplicate') || 'Tento prompt již existuje v kategorii');${CRLF}      return;${CRLF}    }${CRLF}${CRLF}    rebuildPromptLibrary(localStorage.getItem('strong_prompt') || '');${CRLF}    renderPromptList();${CRLF}    showToast(t('toast.prompt.saved') || 'Prompt uložen');${CRLF}  }`;
pl = pl.replace(old5, new5);
ok('showAddCustomPromptModal', pl.includes('const category = state.selectedPromptCategory;'));

// 6. Update applySelectedPrompt for non-custom categories
const old6 = `    localStorage.setItem('strong_custom_system_prompt', sysVal);${CRLF}    setMainPrompt(userVal, 'custom');${CRLF}${CRLF}    if (state.selectedPromptCategory === 'custom') {${CRLF}      const imported = getStoredCustomPromptLibrary().filter((item) => item.text !== userVal);${CRLF}      saveStoredCustomPromptLibrary(imported);${CRLF}      rebuildPromptLibrary(userVal);${CRLF}      const index = state.selectedPromptIndex;${CRLF}      const customEntries = state.PROMPT_LIBRARY.custom || [];${CRLF}      if (customEntries[index]) {${CRLF}        customEntries[index] = { ...customEntries[index], system: sysVal, text: userVal };${CRLF}        state.PROMPT_LIBRARY.custom = customEntries;${CRLF}      }${CRLF}    }${CRLF}${CRLF}    closePromptLibraryModal();${CRLF}    showToast(t('toast.prompt.savedApplied') || 'Prompt uložen a aplikován');${CRLF}  }`;
const new6 = `    // For built-in categories (default, detailed, concise, literal, test, library, custom)${CRLF}    // Save as user-added prompt to the current category${CRLF}    const category = state.selectedPromptCategory;${CRLF}${CRLF}    // Check if this exact prompt already exists in user-added for this category${CRLF}    const userAdded = getStoredUserAddedPrompts();${CRLF}    if (userAdded[category] && userAdded[category].some(p => p.text === userVal)) {${CRLF}      showToast(t('toast.prompt.duplicate') || 'Tento prompt již existuje v kategorii');${CRLF}      return;${CRLF}    }${CRLF}${CRLF}    const existingName = state.PROMPT_LIBRARY[category]?.[state.selectedPromptIndex]?.name || '';${CRLF}    const desc = existingName ? existingName : (t('prompt.library.userAdded') || 'Vlastní');${CRLF}${CRLF}    const success = addUserPromptToCategory(category, desc, '', userVal, sysVal);${CRLF}    if (!success) {${CRLF}      showToast(t('toast.prompt.duplicate') || 'Tento prompt již existuje v kategorii');${CRLF}      return;${CRLF}    }${CRLF}${CRLF}    localStorage.setItem('strong_custom_system_prompt', sysVal);${CRLF}    setMainPrompt(userVal, 'custom');${CRLF}${CRLF}    if (category === 'custom') {${CRLF}      const imported = getStoredCustomPromptLibrary().filter((item) => item.text !== userVal);${CRLF}      saveStoredCustomPromptLibrary(imported);${CRLF}      rebuildPromptLibrary(userVal);${CRLF}      const index = state.selectedPromptIndex;${CRLF}      const customEntries = state.PROMPT_LIBRARY.custom || [];${CRLF}      if (customEntries[index]) {${CRLF}        customEntries[index] = { ...customEntries[index], system: sysVal, text: userVal };${CRLF}        state.PROMPT_LIBRARY.custom = customEntries;${CRLF}      }${CRLF}    }${CRLF}${CRLF}    closePromptLibraryModal();${CRLF}    showToast(t('toast.prompt.savedApplied') || 'Prompt uložen a aplikován');${CRLF}  }`;
pl = pl.replace(old6, new6);
ok('applySelectedPrompt non-custom', pl.includes('userAdded[category]'));

// 7. Update updatePromptActions for delete button
const old7 = `    } else {${CRLF}      actionsContainer.innerHTML = `;
const new7 = `    } else {${CRLF}      const entry = state.PROMPT_LIBRARY[category]?.[state.selectedPromptIndex];${CRLF}      const isUserAdded = entry && isUserAddedPrompt(category, entry.name, entry.text);${CRLF}      const deleteBtn = isUserAdded${CRLF}        ? '<button type="button" class="prompt-btn red" onclick="handleDeleteUserPrompt()" title="Smazat tento prompt">🗑 Smazat</button>'${CRLF}        : '';${CRLF}      actionsContainer.innerHTML = `;
pl = pl.replace(old7, new7);
ok('updatePromptActions delete button', pl.includes('deleteBtn'));

// 8. Update exports - getStoredUserAddedPrompts
const old8a = `        getStoredImportedPromptLibrary,${CRLF}        saveStoredImportedPromptLibrary,${CRLF}        rebuildPromptLibrary,`;
const new8a = `        getStoredImportedPromptLibrary,${CRLF}        saveStoredImportedPromptLibrary,${CRLF}        getStoredUserAddedPrompts,${CRLF}        rebuildPromptLibrary,`;
pl = pl.replace(old8a, new8a);
ok('export getStoredUserAddedPrompts', pl.includes('getStoredUserAddedPrompts,'));

// 9. Update exports - handleDeleteUserPrompt
const old8b = `        showAddCustomPromptModal,${CRLF}        updatePromptStatusIndicator,${CRLF}        updatePromptActions,`;
const new8b = `        showAddCustomPromptModal,${CRLF}        handleDeleteUserPrompt,${CRLF}        updatePromptStatusIndicator,${CRLF}        updatePromptActions,`;
pl = pl.replace(old8b, new8b);
ok('export handleDeleteUserPrompt', pl.includes('handleDeleteUserPrompt,'));

/*** main.js modifications ***/

// 10. Add getStoredUserAddedPrompts to main.js imports
const mainOld1 = `        getStoredImportedPromptLibrary,${CRLF}        saveStoredImportedPromptLibrary,${CRLF}        rebuildPromptLibrary,`;
const mainNew1 = `        getStoredImportedPromptLibrary,${CRLF}        saveStoredImportedPromptLibrary,${CRLF}        getStoredUserAddedPrompts,${CRLF}        rebuildPromptLibrary,`;
main = main.replace(mainOld1, mainNew1);
ok('main.js getStoredUserAddedPrompts import', main.includes('getStoredUserAddedPrompts,'));

// 11. Add handleDeleteUserPrompt to main.js imports
const mainOld2 = `        showAddCustomPromptModal,${CRLF}        updatePromptStatusIndicator,${CRLF}        updatePromptActions,`;
const mainNew2 = `        showAddCustomPromptModal,${CRLF}        handleDeleteUserPrompt,${CRLF}        updatePromptStatusIndicator,${CRLF}        updatePromptActions,`;
main = main.replace(mainOld2, mainNew2);
ok('main.js handleDeleteUserPrompt import', main.includes('handleDeleteUserPrompt,'));

// 12. Add window.handleDeleteUserPrompt export
const mainOld3 = `window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;`;
const mainNew3 = `window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;${CRLF}window.handleDeleteUserPrompt = promptLibraryApi.handleDeleteUserPrompt;`;
main = main.replace(mainOld3, mainNew3);
ok('main.js window.handleDeleteUserPrompt', main.includes('window.handleDeleteUserPrompt'));

/*** Write files ***/
fs.writeFileSync(PLPath, pl);
fs.writeFileSync(mainPath, main);

console.log('');
console.log('=== All updates completed ===');
