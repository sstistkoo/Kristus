/***** FINAL MAIN.JS UPDATE *****/
const fs = require('fs');
const mainPath = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/main.js';
let m = fs.readFileSync(mainPath, 'utf8');

// Add getStoredUserAddedPrompts to imports
m = m.replace(
  '  saveStoredImportedPromptLibrary,\r\n  rebuildPromptLibrary,',
  '  saveStoredImportedPromptLibrary,\r\n  getStoredUserAddedPrompts,\r\n  rebuildPromptLibrary,'
);

// Add handleDeleteUserPrompt and updatePromptActions
m = m.replace(
  '  updatePromptStatusIndicator\r\n} = promptLibraryApi;',
  '  updatePromptStatusIndicator,\r\n  handleDeleteUserPrompt,\r\n  updatePromptActions,\r\n} = promptLibraryApi;'
);

// Add secondary prompt imports (check if not already present)
if (!m.includes('getStoredSecondaryPrompts,')) {
  m = m.replace(
    '} = promptLibraryApi;\r\ninitializePromptLibrary();',
    '} = promptLibraryApi;\r\n\r\n// Secondary prompts\r\nconst {\r\n  getStoredSecondaryPrompts,\r\n  saveStoredSecondaryPrompts,\r\n  showSecondaryPromptsModal,\r\n  closeSecondaryPromptsModal,\r\n  renderSecondaryPromptList,\r\n  selectSecondaryPrompt,\r\n  addSecondaryPrompt,\r\n  saveSecondaryPrompt,\r\n  updateSecondaryPrompt,\r\n  deleteSecondaryPrompt,\r\n  loadSecondaryEditorForCurrentSelection,\r\n  applySecondaryPrompt,\r\n} = promptLibraryApi;\r\n\r\ninitializePromptLibrary();'
  );
}

// Add window.handleDeleteUserPrompt export
if (!m.includes('window.handleDeleteUserPrompt')) {
  m = m.replace(
    'window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;',
    'window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;\r\nwindow.handleDeleteUserPrompt = promptLibraryApi.handleDeleteUserPrompt;'
  );
}

fs.writeFileSync(mainPath, m);
console.log('main.js updated successfully');
