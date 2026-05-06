/**
 * Step 2 & 3: Insert user-added prompts functions, update rebuildPromptLibrary
 */
const fs = require('fs');
const path = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
let c = fs.readFileSync(path, 'utf8');

// Insert getStoredUserAddedPrompts and saveStoredUserAddedPrompts after saveStoredImportedPromptLibrary
const insert1 = `  function getStoredUserAddedPrompts() {
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

`;
c = c.replace(
  `  function saveStoredImportedPromptLibrary(data) {
    localStorage.setItem(PROMPT_LIBRARY_IMPORTED_KEY, JSON.stringify(data || {}));
  }

  function rebuildPromptLibrary`,
  `  function saveStoredImportedPromptLibrary(data) {
    localStorage.setItem(PROMPT_LIBRARY_IMPORTED_KEY, JSON.stringify(data || {}));
  }

${insert1}  function rebuildPromptLibrary`
);

// Update rebuildPromptLibrary to merge user-added prompts  
const oldRebuild = `  function rebuildPromptLibrary(currentSavedPrompt = '') {
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
    const customEntries = [];`;

const newRebuild = `  function rebuildPromptLibrary(currentSavedPrompt = '') {
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
    const customEntries = [];`;

c = c.replace(oldRebuild, newRebuild);

fs.writeFileSync(path, c);
console.log('Step 2+3 done - inserted user prompt functions and updated rebuildPromptLibrary');
