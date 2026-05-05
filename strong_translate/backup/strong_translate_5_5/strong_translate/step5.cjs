// Apply step 5: update showAddCustomPromptModal to save to current category
const fs = require('fs');
const path = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
let c = fs.readFileSync(path, 'utf8');

const old = `  function showAddCustomPromptModal() {
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
  }`;

const updated = `  function showAddCustomPromptModal() {
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
  }`;

c = c.replace(old, updated);
fs.writeFileSync(path, c);
console.log('Step 5 done - updated showAddCustomPromptModal');
