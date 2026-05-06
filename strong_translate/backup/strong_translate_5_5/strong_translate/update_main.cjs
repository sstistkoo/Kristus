/***** Main.js Update Script *****/
const fs = require('fs');
const mainPath = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/main.js';

let main = fs.readFileSync(mainPath, 'utf8');
const CRLF = '\r\n';

// 1. Add getStoredUserAddedPrompts and handleDeleteUserPrompt to imports
let destructureStart = main.indexOf('const {');
// Find the one for promptLibraryApi
let apiDestructurePos = -1;
let attempts = 0;
let pos = destructureStart;
while (pos !== -1 && attempts < 10) {
  pos = main.indexOf('const {', pos + 1);
  attempts++;
  // Check if this is the promptLibraryApi destructuring (has initializePromptLibrary)
  if (pos >= 0 && main.substring(pos, pos + 200).includes('initializePromptLibrary')) {
    apiDestructurePos = pos;
    break;
  }
}

if (apiDestructurePos >= 0) {
  // Find the end of this destructuring (the line before '} = promptLibraryApi;')
  const destructuringEnd = main.indexOf('} = promptLibraryApi;', apiDestructurePos);
  const beforeDestructure = main.substring(0, destructuringEnd);
  const afterDestructure = main.substring(destructuringEnd);
  
  // Add getStoredUserAddedPrompts and handleDeleteUserPrompt to the imports
  const newDestructure = beforeDestructure
    .replace(
      `        saveStoredImportedPromptLibrary,${CRLF}        rebuildPromptLibrary,`,
      `        saveStoredImportedPromptLibrary,${CRLF}        getStoredUserAddedPrompts,${CRLF}        rebuildPromptLibrary,`
    )
    .replace(
      `        showAddCustomPromptModal,${CRLF}        updatePromptStatusIndicator,${CRLF}        updatePromptActions,`,
      `        showAddCustomPromptModal,${CRLF}        handleDeleteUserPrompt,${CRLF}        updatePromptStatusIndicator,${CRLF}        updatePromptActions,`
    );
  
  main = newDestructure + afterDestructure;
  console.log('Added imports to main.js destructuring');
}

// 2. Add window.handleDeleteUserPrompt export
const mainWindowExports = main.indexOf('window.handleDeleteUserPrompt');
if (mainWindowExports < 0) {
  main = main.replace(
    `window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;`,
    `window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;${CRLF}window.handleDeleteUserPrompt = promptLibraryApi.handleDeleteUserPrompt;`
  );
  console.log('Added window.handleDeleteUserPrompt export');
}

fs.writeFileSync(mainPath, main);
console.log('main.js update complete');
