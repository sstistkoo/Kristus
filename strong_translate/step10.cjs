/**
 * Step 10: Update main.js - add window.handleDeleteUserPrompt
 */
const fs = require('fs');
const path = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/main.js';
let c = fs.readFileSync(path, 'utf8');

const old = `window.showPromptLibraryModal = promptLibraryApi.showPromptLibraryModal;
window.closePromptLibraryModal = promptLibraryApi.closePromptLibraryModal;
window.selectPrompt = promptLibraryApi.selectPrompt;
 window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;
window.exportPromptLibraryToTxt = promptLibraryApi.exportPromptLibraryToTxt;
window.importPromptLibraryFromFile = promptLibraryApi.importPromptLibraryFromFile;`;

const updated = `window.showPromptLibraryModal = promptLibraryApi.showPromptLibraryModal;
window.closePromptLibraryModal = promptLibraryApi.closePromptLibraryModal;
window.selectPrompt = promptLibraryApi.selectPrompt;
 window.applySelectedPrompt = promptLibraryApi.applySelectedPrompt;
window.handleDeleteUserPrompt = promptLibraryApi.handleDeleteUserPrompt;
window.exportPromptLibraryToTxt = promptLibraryApi.exportPromptLibraryToTxt;
window.importPromptLibraryFromFile = promptLibraryApi.importPromptLibraryFromFile;`;

c = c.replace(old, updated);
fs.writeFileSync(path, c);
console.log('Step 10 done - updated main.js window exports');
