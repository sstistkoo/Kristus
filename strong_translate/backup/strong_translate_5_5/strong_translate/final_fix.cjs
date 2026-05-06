/***** FINAL FIX FOR applySelectedPrompt *****/
const fs = require('fs');
const plPath = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
let pl = fs.readFileSync(plPath, 'utf8');

// The exact old pattern in the file (note: uses double quotes)
const old = `    localStorage.setItem("strong_custom_system_prompt", sysVal);
    setMainPrompt(userVal, "custom");

    if (state.selectedPromptCategory === "custom") {
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
    showToast(t("toast.prompt.savedApplied"));
  }`;

const newCode = `    // For built-in categories (default, detailed, concise, literal, test, library, custom)
    // Save as user-added prompt to the current category
    const category = state.selectedPromptCategory;

    // Check if this exact prompt already exists in user-added for this category
    const userAdded = getStoredUserAddedPrompts();
    if (userAdded[category] && userAdded[category].some(p => p.text === userVal)) {
      showToast(t("toast.prompt.duplicate") || "Tento prompt již existuje v kategorii");
      return;
    }

    const existingName = state.PROMPT_LIBRARY[category]?.[state.selectedPromptIndex]?.name || "";
    const desc = existingName ? existingName : (t("prompt.library.userAdded") || "Vlastní");

    const success = addUserPromptToCategory(category, desc, "", userVal, sysVal);
    if (!success) {
      showToast(t("toast.prompt.duplicate") || "Tento prompt již existuje v kategorii");
      return;
    }

    localStorage.setItem("strong_custom_system_prompt", sysVal);
    setMainPrompt(userVal, "custom");

    if (category === "custom") {
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
    showToast(t("toast.prompt.savedApplied"));
  }`;

const before = pl.includes(old);
console.log('Old pattern found:', before);

pl = pl.replace(old, newCode);
fs.writeFileSync(plPath, pl);

const after = pl.includes('userAdded[category] && userAdded[category].some');
console.log('New pattern exists:', after);
console.log('Success:', !before === false && after);
