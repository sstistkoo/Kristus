/***** Verification Script *****/
const fs = require('fs');
const pl = fs.readFileSync('/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js', 'utf8');
const main = fs.readFileSync('/Users/stistko/CascadeProjects/Kristus/strong_translate/js/main.js', 'utf8');

function check(name, condition) {
  console.log((condition ? '✓' : '✗'), name);
  return condition;
}

console.log('=== promptLibrary.js ===');
const checks = [
  ['USER_ADDED_PROMPTS_KEY constant', pl.includes('USER_ADDED_PROMPTS_KEY')],
  ['getStoredUserAddedPrompts function', pl.includes('function getStoredUserAddedPrompts')],
  ['saveStoredUserAddedPrompts function', pl.includes('function saveStoredUserAddedPrompts')],
  ['addUserPromptToCategory function', pl.includes('function addUserPromptToCategory')],
  ['deleteUserPromptByIndex function', pl.includes('function deleteUserPromptByIndex')],
  ['isUserAddedPrompt function', pl.includes('function isUserAddedPrompt')],
  ['handleDeleteUserPrompt function', pl.includes('function handleDeleteUserPrompt')],
  ['rebuildPromptLibrary merge user-added', pl.includes('userAddedByCategory')],
  ['showAddCustomPromptModal uses category', pl.includes('const category = state.selectedPromptCategory;') && pl.includes('showAddCustomPromptModal')],
  ['applySelectedPrompt checks userAdded[category]', pl.includes('userAdded[category] && userAdded[category].some')],
  ['updatePromptActions has deleteBtn', pl.includes('deleteBtn')],
  ['getStoredUserAddedPrompts in exports', pl.includes('getStoredUserAddedPrompts,')],
  ['handleDeleteUserPrompt in exports', pl.includes('handleDeleteUserPrompt,')],
];
checks.forEach(([name, cond]) => check(name, cond));

console.log('');
console.log('=== main.js ===');
const mainChecks = [
  ['getStoredUserAddedPrompts import', main.includes('getStoredUserAddedPrompts,')],
  ['handleDeleteUserPrompt import', main.includes('handleDeleteUserPrompt,')],
  ['window.handleDeleteUserPrompt export', main.includes('window.handleDeleteUserPrompt')],
];
mainChecks.forEach(([name, cond]) => check(name, cond));
