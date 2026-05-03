/**
 * Step 9: Update main.js - add getStoredUserAddedPrompts and handleDeleteUserPrompt to imports
 */
const fs = require('fs');
const path = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/main.js';
let c = fs.readFileSync(path, 'utf8');

const old = `  const {
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
  } = promptLibraryApi;`;

const updated = `  const {
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
  } = promptLibraryApi;`;

c = c.replace(old, updated);
fs.writeFileSync(path, c);
console.log('Step 9 done - updated main.js imports');
