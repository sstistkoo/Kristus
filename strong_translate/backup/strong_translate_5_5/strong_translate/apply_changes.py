import os

path = '/Users/stistko/CascadeProjects/Kristus/strong_translate/js/promptLibrary.js'
with open(path, 'r') as f:
    content = f.read()

# 1. Add USER_ADDED_PROMPTS_KEY
content = content.replace(
    "  const SECONDARY_PROMPTS_KEY = 'strong_secondary_prompts';",
    "  const SECONDARY_PROMPTS_KEY = 'strong_secondary_prompts';\n  const USER_ADDED_PROMPTS_KEY = 'strong_user_added_prompts';"
)

# 2. Add getStoredUserAddedPrompts and saveStoredUserAddedPrompts
content = content.replace(
    """  function saveStoredImportedPromptLibrary(data) {
    localStorage.setItem(PROMPT_LIBRARY_IMPORTED_KEY, JSON.stringify(data || {}));
  }

  function saveStoredCustomPromptLibrary(customEntries) {""",
    """  function saveStoredImportedPromptLibrary(data) {
    localStorage.setItem(PROMPT_LIBRARY_IMPORTED_KEY, JSON.stringify(data || {}));
  }

  function getStoredUserAddedPrompts() {
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

  function saveStoredCustomPromptLibrary(customEntries) {"""
)

# 3. Update rebuildPromptLibrary
content = content.replace(
    """  function rebuildPromptLibrary(currentSavedPrompt = '') {
    state.PROMPT_LIBRARY = clonePromptLibraryBase();
    const importedByCategory = getStoredImportedPromptLibrary();
    for (const [category, prompts] of Object.entries(importedByCategory)) {
      if (!Array.isArray(prompts)) continue;
      if (!state.PROMPT_LIBRARY[category]) state.PROMPT_LIBRARY[category] = [];
      for (const item of prompts) {
        if (!item || typeof item.text !== 'string') continue;
        if (!state.PROMPT_LIBRARY[category].some((p) => p.text === item.text)) {
          state.PROMPT_LIBRARY[category].push({
            name: String(item.name || t('prompt.library.imported.name')),
            desc: String(item.desc || t('prompt.library.imported.desc')),
            text: item.text
          });
        }
      }
    }
    const customSaved = localStorage.getItem('strong_custom_prompt');
    const importedCustom = getStoredCustomPromptLibrary();
    const customEntries = [];""",
    """  function rebuildPromptLibrary(currentSavedPrompt = '') {
    state.PROMPT_LIBRARY = clonePromptLibraryBase();
    const importedByCategory = getStoredImportedPromptLibrary();
    for (const [category, prompts] of Object.entries(importedByCategory)) {
      if (!Array.isArray(prompts)) continue;
      if (!state.PROMPT_LIBRARY[category]) state.PROMPT_LIBRARY[category] = [];
      for (const item of prompts) {
        if (!item || typeof item.text !== 'string') continue;
        if (!state.PROMPT_LIBRARY[category].some((p) => p.text === item.text)) {
          state.PROMPT_LIBRARY[category].push({
            name: String(item.name || t('prompt.library.imported.name')),
            desc: String(item.desc || t('prompt.library.imported.desc')),
            text: item.text
          });
        }
      }
    }
    // Merge user-added prompts for each category
    const userAddedByCategory = getStoredUserAddedPrompts();
    for (const [category, prompts] of Object.entries(userAddedByCategory)) {
      if (!Array.isArray(prompts)) continue;
      if (!state.PROMPT_LIBRARY[category]) state.PROMPT_LIBRARY[category] = [];
      for (const item of prompts) {
        if (!item || typeof item.text !== 'string') continue;
        if (!state.PROMPT_LIBRARY[category].some((p) => p.text === item.text)) {
          state.PROMPT_LIBRARY[category].push({
            name: String(item.name || t('prompt.library.untitled')),
            desc: String(item.desc || ''),
            text: item.text,
            system: item.system || ''
          });
        }
      }
    }
    const customSaved = localStorage.getItem('strong_custom_prompt');
    const importedCustom = getStoredCustomPromptLibrary();
    const customEntries = [];"""
)

with open(path, 'w') as f:
    f.write(content)

print(f'Applied basic changes to {path}')
print(f'Lines: {len(content.split(chr(10)))}')
