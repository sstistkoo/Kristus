/**
 * Step 8: Update export section to include new functions
 */
const fs = require('fs');
const path = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
let c = fs.readFileSync(path, 'utf8');

const old = `  return {
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
      };`;

const updated = `  return {
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
      };`;

c = c.replace(old, updated);
fs.writeFileSync(path, c);
console.log('Step 8 done - updated export section');
