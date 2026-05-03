// Apply step 2: add user-added prompts functions
const fs = require('fs');
const path = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
let c = fs.readFileSync(path, 'utf8');

// Add USER_ADDED prompts functions after existing saveStoredImportedPromptLibrary
const insert = `  function getStoredUserAddedPrompts() {
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

${insert}  function rebuildPromptLibrary`
);
fs.writeFileSync(path, c);
console.log('Step 2 done - inserted get/set user-added prompts');
