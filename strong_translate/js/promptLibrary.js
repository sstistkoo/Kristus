export function createPromptLibraryApi(deps) {
  const {
    state,
    t,
    getUiLang,
    getDefaultPrompt,
    getFinalPrompt,
    getPromptLibraryBase,
    enforceSpecialistaFormat,
    showToast,
    getActiveSystemMessage,
    getActiveMainPromptTemplate
  } = deps;

  const PROMPT_LIBRARY_CUSTOM_KEY = 'strong_prompt_library_custom';
  const PROMPT_LIBRARY_IMPORTED_KEY = 'strong_prompt_library_imported';

  function clonePromptLibraryBase() {
    return JSON.parse(JSON.stringify(getPromptLibraryBase() || {}));
  }

  function getStoredCustomPromptLibrary() {
    try {
      const raw = localStorage.getItem(PROMPT_LIBRARY_CUSTOM_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((p) => p && typeof p.name === 'string' && typeof p.desc === 'string' && typeof p.text === 'string');
    } catch {
      return [];
    }
  }

  function saveStoredCustomPromptLibrary(customEntries) {
    localStorage.setItem(PROMPT_LIBRARY_CUSTOM_KEY, JSON.stringify(customEntries || []));
  }

  function getStoredImportedPromptLibrary() {
    try {
      const raw = localStorage.getItem(PROMPT_LIBRARY_IMPORTED_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch {
      return {};
    }
  }

  function saveStoredImportedPromptLibrary(data) {
    localStorage.setItem(PROMPT_LIBRARY_IMPORTED_KEY, JSON.stringify(data || {}));
  }

  function rebuildPromptLibrary(currentSavedPrompt = '') {
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
    const customEntries = [];

    if (customSaved && customSaved.trim()) {
      customEntries.push({
        name: t('prompt.library.myOwn.name'),
        desc: t('prompt.library.myOwn.desc'),
        text: customSaved
      });
    }

    for (const item of importedCustom) {
      if (item.text !== customSaved) customEntries.push(item);
    }

    customEntries.push(getFinalPrompt());

    if (currentSavedPrompt && !customEntries.some((p) => p.text === currentSavedPrompt)) {
      customEntries.unshift({
        name: t('prompt.library.current.name'),
        desc: t('prompt.library.current.desc'),
        text: currentSavedPrompt
      });
    }

    state.PROMPT_LIBRARY.custom = customEntries;
  }

  function getSystemPromptForCurrentTask(context = 'batch') {
    let prompt = getDefaultPrompt();
    if (context === 'topic') {
      prompt += `\n\n${t('aiPrompts.topic.singleFieldExtra')}`;
    }
    return enforceSpecialistaFormat(prompt);
  }

  function isPromptAutoModeEnabled() {
    const saved = localStorage.getItem('strong_prompt_auto');
    return saved !== 'off';
  }

  function setMainPrompt(promptText, mode = 'custom') {
    const text = String(promptText || '').trim();
    state.isProgrammaticPromptSet = true;
    localStorage.setItem('strong_prompt', String(promptText || '').trim());
    localStorage.setItem('strong_prompt_mode', mode);
    const mainEditor = document.getElementById('promptEditor');
    if (mainEditor) {
      mainEditor.value = text;
      mainEditor.dispatchEvent(new Event('input'));
    }
    state.isProgrammaticPromptSet = false;
    updatePromptStatusIndicator();
  }

  function applySystemPromptForCurrentTask() {
    const context = state.topicPromptState ? 'topic' : 'batch';
    const systemPrompt = getSystemPromptForCurrentTask(context);
    setMainPrompt(systemPrompt, 'system');
    const sysEl = document.getElementById('librarySystemPrompt');
    if (sysEl) sysEl.value = systemPrompt;
    showToast(t('toast.systemPrompt.set', { mode: context === 'topic' ? t('common.topic') : t('common.batch') }));
  }

  function togglePromptModeQuick() {
    const mode = localStorage.getItem('strong_prompt_mode') || 'custom';
    const customSaved = localStorage.getItem('strong_custom_prompt') || '';
    if (mode === 'custom') {
      setMainPrompt(getSystemPromptForCurrentTask('batch'), 'system');
      showToast(t('toast.prompt.switchedSystem'));
      return;
    }
    if (customSaved.trim()) {
      setMainPrompt(customSaved, 'custom');
      showToast(t('toast.prompt.switchedCustom'));
      return;
    }
    showToast(t('toast.prompt.customNotSaved'));
  }

  function updatePromptAutoButton() {
    const btn = document.getElementById('btnPromptAuto');
    if (!btn) return;
    const on = isPromptAutoModeEnabled();
    btn.textContent = t('prompt.auto.button', { state: on ? t('common.on') : t('common.off') });
    btn.style.borderColor = on ? 'var(--grn)' : 'var(--brd)';
    btn.style.color = on ? 'var(--grn)' : 'var(--txt2)';
  }

  function togglePromptAutoMode() {
    const on = isPromptAutoModeEnabled();
    localStorage.setItem('strong_prompt_auto', on ? 'off' : 'on');
    updatePromptAutoButton();
    showToast(t('toast.autoPrompt.toggled', { state: on ? t('common.offLower') : t('common.onLower') }));
  }

  function showPromptLibraryModal() {
    const modal = document.getElementById('promptLibraryModal');
    const tabs = document.getElementById('promptTabs');
    const savedPrompt = localStorage.getItem('strong_prompt') || getDefaultPrompt();
    rebuildPromptLibrary(savedPrompt);

    // Initialize dual prompt editors
    const sysLib = document.getElementById('librarySystemPrompt');
    const userLib = document.getElementById('libraryUserPrompt');
    if (sysLib) sysLib.value = getActiveSystemMessage();
    if (userLib) userLib.value = getActiveMainPromptTemplate('batch');

    state.selectedPromptCategory = 'default';
    state.selectedPromptIndex = 0;
    const getPromptTabLabel = (cat) => {
      const map = { default: 'prompt.tab.default', detailed: 'prompt.tab.detailed', concise: 'prompt.tab.concise', literal: 'prompt.tab.literal', test: 'prompt.tab.test', custom: 'prompt.tab.custom' };
      return t(map[cat] || cat);
    };
    tabs.innerHTML = Object.keys(state.PROMPT_LIBRARY).map((cat) => `<div class="prompt-tab ${cat === 'default' ? 'active' : ''}" data-category="${cat}">${getPromptTabLabel(cat)}</div>`).join('');
    tabs.querySelectorAll('.prompt-tab').forEach((tab) => {
      tab.onclick = () => {
        tabs.querySelectorAll('.prompt-tab').forEach((x) => x.classList.remove('active'));
        tab.classList.add('active');
        state.selectedPromptCategory = tab.dataset.category;
        state.selectedPromptIndex = 0;
        loadDualEditorForCurrentSelection();
        renderPromptList();
      };
    });
    matchPromptToPreset(savedPrompt);
    const activeTab = tabs.querySelector('.prompt-tab.active');
    if (activeTab && activeTab.dataset.category !== state.selectedPromptCategory) {
      activeTab.classList.remove('active');
      const newActiveTab = tabs.querySelector(`.prompt-tab[data-category="${state.selectedPromptCategory}"]`);
      if (newActiveTab) newActiveTab.classList.add('active');
      loadDualEditorForCurrentSelection();
      renderPromptList();
    }
    loadDualEditorForCurrentSelection();
    renderPromptList();
    modal.classList.add('show');
    modal.onclick = (e) => { if (e.target === modal) closePromptLibraryModal(); };
  }

  function matchPromptToPreset(promptText) {
    const baseCategories = ['default', 'detailed', 'concise', 'literal', 'test', 'library'];
    let foundMatch = false;
    for (const category of baseCategories) {
      const prompts = state.PROMPT_LIBRARY[category];
      if (!Array.isArray(prompts)) continue;
      for (let i = 0; i < prompts.length; i++) {
        if (prompts[i].text === promptText) {
          state.selectedPromptCategory = category;
          state.selectedPromptIndex = i;
          foundMatch = true;
          break;
        }
      }
      if (foundMatch) break;
    }
    if (!foundMatch && Array.isArray(state.PROMPT_LIBRARY.custom)) {
      for (let i = 0; i < state.PROMPT_LIBRARY.custom.length; i++) {
        if (state.PROMPT_LIBRARY.custom[i].text === promptText) {
          state.selectedPromptCategory = 'custom';
          state.selectedPromptIndex = i;
          return;
        }
      }
    }
    if (!foundMatch) {
      state.selectedPromptCategory = 'custom';
      state.selectedPromptIndex = 0;
      rebuildPromptLibrary(promptText);
    }
  }

  function closePromptLibraryModal() {
    document.getElementById('promptLibraryModal').classList.remove('show');
  }

    function renderPromptList() {
      const list = document.getElementById('promptList');
      const prompts = state.PROMPT_LIBRARY[state.selectedPromptCategory] || [];
      if (prompts.length === 0) {
        list.innerHTML = `<div style="color:var(--txt3);font-size:11px;padding:10px">${t('prompt.library.emptyCategory')}</div>`;
        return;
      }
      list.innerHTML = prompts.map((p, idx) => `
      <div class="prompt-item ${idx === state.selectedPromptIndex ? 'selected' : ''}" data-index="${idx}" onclick="selectPrompt(${idx})">
        <div class="prompt-item-name">${p.name}</div>
        <div class="prompt-item-desc">${p.desc}</div>
      </div>
    `).join('');
    }

    function selectPrompt(index) {
      state.selectedPromptIndex = index;
      loadDualEditorForCurrentSelection();
      renderPromptList();
    }

    function applySelectedPrompt() {
      const sysEl = document.getElementById('librarySystemPrompt');
      const userEl = document.getElementById('libraryUserPrompt');
      const sysVal = sysEl ? sysEl.value.trim() : '';
      const userVal = userEl ? userEl.value.trim() : '';

      if (!sysVal) {
        showToast(t('toast.prompt.systemEmpty') || 'Systémový prompt nesmí být prázdný');
        return;
      }
      if (!userVal) {
        showToast(t('toast.prompt.empty') || 'Uživatelský prompt nesmí být prázdný');
        return;
      }

      localStorage.setItem('strong_custom_system_prompt', sysVal);
      setMainPrompt(userVal, 'custom');

      if (state.selectedPromptCategory === 'custom') {
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
      showToast(t('toast.prompt.savedApplied'));
    }

    function loadDualEditorForCurrentSelection() {
      const category = state.selectedPromptCategory;
      const index = state.selectedPromptIndex;
      const entry = (state.PROMPT_LIBRARY[category] || [])[index];
      if (!entry) return;
      const sysEl = document.getElementById('librarySystemPrompt');
      const userEl = document.getElementById('libraryUserPrompt');
      if (sysEl) sysEl.value = entry.system || getActiveSystemMessage();
      if (userEl) userEl.value = entry.text;
    }

    function exportPromptLibraryToTxt() {
    rebuildPromptLibrary(localStorage.getItem('strong_prompt') || '');
    const lines = ['# Strong Prompt Library Export v1', `# Generated: ${new Date().toISOString()}`];
    for (const [category, prompts] of Object.entries(state.PROMPT_LIBRARY)) {
      lines.push(`## CATEGORY: ${category}`);
      for (const prompt of prompts || []) {
        lines.push(`### PROMPT: ${prompt.name || t('prompt.library.untitled')}`);
        lines.push(`DESC: ${prompt.desc || ''}`);
        lines.push('---BEGIN---');
        lines.push(String(prompt.text || ''));
        lines.push('---END---');
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strong_prompty_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(t('toast.prompt.exported'));
  }

  function importPromptLibraryFromFile(input) {
    const file = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const regex = /## CATEGORY:\s*([^\n]+)\n### PROMPT:\s*([^\n]+)\nDESC:\s*([^\n]*)\n---BEGIN---\n([\s\S]*?)\n---END---/g;
        const importedCustom = [];
        const importedByCategory = getStoredImportedPromptLibrary();
        let totalImported = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
          const category = (match[1] || '').trim().toLowerCase();
          const name = (match[2] || '').trim() || t('prompt.library.imported.name');
          const desc = (match[3] || '').trim() || t('prompt.library.imported.desc');
          const body = (match[4] || '').trim();
          if (!body) continue;
          totalImported += 1;
          if (category === 'custom') {
            importedCustom.push({ name, desc, text: body });
            continue;
          }
          if (!importedByCategory[category]) importedByCategory[category] = [];
          if (!importedByCategory[category].some((p) => p.text === body)) importedByCategory[category].push({ name, desc, text: body });
        }
        const existingCustom = getStoredCustomPromptLibrary();
        const merged = [...existingCustom];
        for (const item of importedCustom) {
          if (!merged.some((e) => e.text === item.text)) merged.push(item);
        }
        saveStoredCustomPromptLibrary(merged);
        saveStoredImportedPromptLibrary(importedByCategory);
        rebuildPromptLibrary(localStorage.getItem('strong_prompt') || '');
        renderPromptList();
        showToast(t('toast.prompts.loaded.count', { count: totalImported }));
      } catch (err) {
        showToast(t('toast.prompt.importFailed'));
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  function updatePromptStatusIndicator() {
    const modeDot = document.getElementById('promptMode');
    const nameEl = document.getElementById('promptName');
    if (!modeDot || !nameEl) return;
    const currentPrompt = localStorage.getItem('strong_prompt') || '';
    const mode = localStorage.getItem('strong_prompt_mode') || 'custom';
    let matched = false;
    let matchedName = '';
    if (currentPrompt === getDefaultPrompt()) {
      matched = true;
      matchedName = t('prompt.library.original');
    }
    if (!matched) {
      for (const [category, prompts] of Object.entries(state.PROMPT_LIBRARY)) {
        for (const p of prompts) {
          if (p.text === currentPrompt && category !== 'custom') {
            matched = true;
            matchedName = p.name;
            break;
          }
        }
        if (matched) break;
      }
    }
    if (mode === 'system' || matched) {
      modeDot.style.background = 'var(--grn)';
      modeDot.style.boxShadow = '0 0 6px var(--grn)';
      nameEl.textContent = mode === 'system' ? t('prompt.status.systemAuto') : matchedName;
      nameEl.style.color = 'var(--grn)';
    } else {
      modeDot.style.background = 'var(--red)';
      modeDot.style.boxShadow = 'none';
      nameEl.textContent = currentPrompt ? t('prompt.status.customEdited') : t('prompt.status.none');
      nameEl.style.color = 'var(--red)';
    }
    if (!isPromptAutoModeEnabled()) nameEl.textContent += ` · ${t('prompt.status.autoOffSuffix')}`;
  }

    function initializePromptLibrary() {
      rebuildPromptLibrary(localStorage.getItem('strong_prompt') || getDefaultPrompt());
    }

    return {
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
      updatePromptStatusIndicator
    };
  }
