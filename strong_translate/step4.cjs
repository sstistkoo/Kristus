// Apply step 4: add user prompt management functions after deleteSecondaryPrompt
const fs = require('fs');
const path = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
let c = fs.readFileSync(path, 'utf8');

const old = `  function deleteSecondaryPrompt() {
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

  function applySecondaryPrompt() {`;

const insert = `  function deleteSecondaryPrompt() {
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

  function applySecondaryPrompt() {`;

c = c.replace(old, insert);
fs.writeFileSync(path, c);
console.log('Step 4 done - added user prompt management functions');
