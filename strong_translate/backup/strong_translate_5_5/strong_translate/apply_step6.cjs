/***** Apply step 6 to current promptLibrary.js *****/
const fs = require('fs');
const plPath = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
let pl = fs.readFileSync(plPath, 'utf8');

const CRLF = '\\r\\n';

const old = '    localStorage.setItem(\"strong_custom_system_prompt\", sysVal);' + CRLF +
  '    setMainPrompt(userVal, \"custom\");' + CRLF +
  '' + CRLF +
  '    if (state.selectedPromptCategory === \"custom\") {' + CRLF +
  '      const imported = getStoredCustomPromptLibrary().filter((item) => item.text !== userVal);' + CRLF +
  '      saveStoredCustomPromptLibrary(imported);' + CRLF +
  '      rebuildPromptLibrary(userVal);' + CRLF +
  '      const index = state.selectedPromptIndex;' + CRLF +
  '      const customEntries = state.PROMPT_LIBRARY.custom || [];' + CRLF +
  '      if (customEntries[index]) {' + CRLF +
  '        customEntries[index] = { ...customEntries[index], system: sysVal, text: userVal };' + CRLF +
  '        state.PROMPT_LIBRARY.custom = customEntries;' + CRLF +
  '      }' + CRLF +
  '    }' + CRLF +
  '' + CRLF +
  '    closePromptLibraryModal();' + CRLF +
  '    showToast(t(\"toast.prompt.savedApplied\") || \"Prompt uložen a aplikován\");' + CRLF +
  '  }';

const newCode = '    // For built-in categories (default, detailed, concise, literal, test, library, custom)' + CRLF +
  '    // Save as user-added prompt to the current category' + CRLF +
  '    const category = state.selectedPromptCategory;' + CRLF +
  '' + CRLF +
  '    // Check if this exact prompt already exists in user-added for this category' + CRLF +
  '    const userAdded = getStoredUserAddedPrompts();' + CRLF +
  '    if (userAdded[category] && userAdded[category].some(p => p.text === userVal)) {' + CRLF +
  '      showToast(t(\"toast.prompt.duplicate\") || \"Tento prompt již existuje v kategorii\");' + CRLF +
  '      return;' + CRLF +
  '    }' + CRLF +
  '' + CRLF +
  '    const existingName = state.PROMPT_LIBRARY[category]?.[state.selectedPromptIndex]?.name || \"\";' + CRLF +
  '    const desc = existingName ? existingName : (t(\"prompt.library.userAdded\") || \"Vlastní\");' + CRLF +
  '' + CRLF +
  '    const success = addUserPromptToCategory(category, desc, \"\", userVal, sysVal);' + CRLF +
  '    if (!success) {' + CRLF +
  '      showToast(t(\"toast.prompt.duplicate\") || \"Tento prompt již existuje v kategorii\");' + CRLF +
  '      return;' + CRLF +
  '    }' + CRLF +
  '' + CRLF +
  '    localStorage.setItem(\"strong_custom_system_prompt\", sysVal);' + CRLF +
  '    setMainPrompt(userVal, \"custom\");' + CRLF +
  '' + CRLF +
  '    if (category === \"custom\") {' + CRLF +
  '      const imported = getStoredCustomPromptLibrary().filter((item) => item.text !== userVal);' + CRLF +
  '      saveStoredCustomPromptLibrary(imported);' + CRLF +
  '      rebuildPromptLibrary(userVal);' + CRLF +
  '      const index = state.selectedPromptIndex;' + CRLF +
  '      const customEntries = state.PROMPT_LIBRARY.custom || [];' + CRLF +
  '      if (customEntries[index]) {' + CRLF +
  '        customEntries[index] = { ...customEntries[index], system: sysVal, text: userVal };' + CRLF +
  '        state.PROMPT_LIBRARY.custom = customEntries;' + CRLF +
  '      }' + CRLF +
  '    }' + CRLF +
  '' + CRLF +
  '    closePromptLibraryModal();' + CRLF +
  '    showToast(t(\"toast.prompt.savedApplied\") || \"Prompt uložen a aplikován\");' + CRLF +
  '  }';

pl = pl.replace(old, newCode);
fs.writeFileSync(plPath, pl);
console.log('Step 6 applied to promptLibrary.js');
