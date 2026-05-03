/**
 * Step 7: Update updatePromptActions to add delete button for user-added prompts
 */
const fs = require('fs');
const path = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js';
let c = fs.readFileSync(path, 'utf8');

// First replacement - the function signature with template literal handling
const old = `    if (category === 'secondary') {
      actionsContainer.innerHTML = ` + '`;';

const updated = `    if (category === 'secondary') {
      actionsContainer.innerHTML = ` + '`;';

// These are actually the same - skip that replacement
// Now add the delete button in the else branch
const old2 = `    } else {
      actionsContainer.innerHTML = ` + '`;';

const updated2 = `    } else {
      const entry = state.PROMPT_LIBRARY[category]?.[state.selectedPromptIndex];
      const isUserAdded = entry && isUserAddedPrompt(category, entry.name, entry.text);
      const deleteBtn = isUserAdded
        ? '<button type="button" class="prompt-btn red" onclick="handleDeleteUserPrompt()" title="Smazat tento prompt">🗑 Smazat</button>'
        : '';
      actionsContainer.innerHTML = ` + '`';

c = c.replace(old2, updated2);

fs.writeFileSync(path, c);
console.log('Step 7 done - updated updatePromptActions');
