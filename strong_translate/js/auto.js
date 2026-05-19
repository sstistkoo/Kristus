import { state } from './state.js';
import { t } from './i18n.js';
import { PROVIDERS, AUTO_PROVIDER_ENABLED_KEY, PIPELINE_SECONDARY_ENABLED_KEY } from './config.js';
import { safeSetLocalStorage, safeRemoveLocalStorage } from './storage.js';

export function createAutoApi(deps) {
  const {
    state,
    t,
    getUiLang,
    PROVIDERS,
    AUTO_PROVIDER_ENABLED_KEY,
    AUTO_TOKEN_LIMIT_KEY,
    PIPELINE_SECONDARY_ENABLED_KEY,
    setPipelineSecondaryEnabled,
    syncSecondaryProviderToggles,
    getSecondaryNextOperationState,
    stopElapsedTimer,
    showToast,
    log,
    getNextBatch,
    updateETA,
    translateBatch,
    translateBatchForProvider,
    getCurrentApiKey,
    getPipelineModelForProvider,
    startElapsedTimer,
    updateStats,
    renderList,
    renderDetail
  } = deps;

  function toggleAuto() {
    if (state.autoRunning) {
      stopAuto();
      return;
    }
    startAuto();
  }

  function startAuto() {
    state.autoRunning = true;
    document.getElementById('btnAuto')?.classList.add('active');
    const btnAuto = document.getElementById('btnAuto');
    if (btnAuto) btnAuto.textContent = t('auto.button.stop');
    document.getElementById('autoPanel')?.classList.add('show');
    const autoInterval = document.getElementById('autoInterval');
    if (autoInterval) autoInterval.textContent = String(state.currentInterval);
    startAutoProviderCountdownTicker();
    if (isAutoTokenLimitReached()) {
      stopAuto();
      showToast(t('toast.auto.notStartedTokenLimit'));
      return;
    }
    // Spustit až po malém zpoždění, aby UI mohlo aktualizovat
    setTimeout(() => {
      if (state.autoRunning && !state.autoStepRunning) {
        runAutoStep();
      }
    }, 50);
  }

   function stopAuto() {
     state.autoRunning = false;
     state.autoSeqRunning = false; // zastavit i sequential mód
     state.autoStepRunning = false; // ← přidáno
     state.sideFallbackAbortVersion++;
     clearTimeout(state.autoTimer);
     clearInterval(state.autoCountTimer);
     document.getElementById('btnAuto')?.classList.remove('active');
     const btnAuto = document.getElementById('btnAuto');
     if (btnAuto) btnAuto.textContent = t('auto.button.start');
     if (window.innerWidth <= 600) {
       document.getElementById('autoPanel')?.classList.remove('show');
     }
     const countdown = document.getElementById('countdown');
     if (countdown) countdown.textContent = '—';
     updateAutoProviderCountdowns();
     stopElapsedTimer();
   }

  function setAutoProviderCountdownLabel(prov, text) {
    const el = document.getElementById(`autoCountdown_${prov}`);
    if (el) el.textContent = text;
  }

  function isAutoProviderEnabled(prov) {
    if (prov === 'gemini' || prov === 'openrouter') {
      const raw = localStorage.getItem(PIPELINE_SECONDARY_ENABLED_KEY + prov);
      if (raw === null) return true;
      return raw === '1';
    }
    const raw = localStorage.getItem(AUTO_PROVIDER_ENABLED_KEY + prov);
    if (raw === null) return true;
    return raw === '1';
  }

  function setAutoProviderEnabled(prov, enabled) {
    const on = !!enabled;
    if (prov === 'gemini' || prov === 'openrouter') {
      // Pro secondary providera použijeme pipeline funkci, která je async?
      // Ale tady potřebujeme sync. Zkompilujeme to špatně.
      // Musíme použít stejný mechanismus jako pro primary (localStorage).
      // Projedeme se: secondary toggle je malá hodnota, můžeme použít localStorage přímo.
      localStorage.setItem(PIPELINE_SECONDARY_ENABLED_KEY + prov, on ? '1' : '0');
      // Nebo volání setPipelineSecondaryEnabled? To je async a jsme v sync kontextu.
      // Zvolíme: použijeme localStorage přímo prosecondary, konzistence s primary.
      return;
    }
    localStorage.setItem(AUTO_PROVIDER_ENABLED_KEY + prov, on ? '1' : '0');
  }

  function initAutoProviderToggles() {
    ['groq', 'gemini', 'openrouter'].forEach((prov) => {
      const cb = document.getElementById(`autoEnable_${prov}`);
      if (!cb) return;
      cb.checked = isAutoProviderEnabled(prov);
      cb.onchange = () => {
        setAutoProviderEnabled(prov, cb.checked);
        updateAutoProviderCountdowns();
      };
    });
  }

  function updateAutoProviderCountdowns() {
    const mainLeft = Math.max(0, parseInt(document.getElementById('countdown')?.textContent || '0', 10) || 0);
    const providerLabel = (prov) => String(PROVIDERS[prov]?.label || prov).split(' ')[0];
    const groqLabel = 'Groq';

    if (!isAutoProviderEnabled('groq')) {
      setAutoProviderCountdownLabel('groq', t('provider.status.disabled', { label: groqLabel }));
    } else if (state.autoRunning) {
      setAutoProviderCountdownLabel(
        'groq',
        mainLeft > 0
          ? t('provider.status.nextIn', { label: groqLabel, seconds: mainLeft })
          : t('provider.status.running', { label: groqLabel })
      );
    } else {
      setAutoProviderCountdownLabel('groq', t('provider.status.ready', { label: groqLabel }));
    }

    ['gemini', 'openrouter'].forEach((prov) => {
      if (Date.now() < Number(state.providerFailBadgeUntil[prov] || 0)) {
        setAutoProviderCountdownLabel(prov, t('provider.status.failed', { label: providerLabel(prov) }));
        return;
      }
      if (!isAutoProviderEnabled(prov)) {
        setAutoProviderCountdownLabel(prov, t('provider.status.disabled', { label: providerLabel(prov) }));
        return;
      }
      const pending = Math.max(0, Number(state.providerFallbackPendingCount?.[prov] || 0));
      if (pending > 0) {
        setAutoProviderCountdownLabel(
          prov,
          t('auto.provider.processingPartial', { label: providerLabel(prov), pending })
        );
        return;
      }
      const nextState = getSecondaryNextOperationState(prov);
      if (nextState.exhausted && nextState.nextSec > 0) {
        setAutoProviderCountdownLabel(
          prov,
          t('auto.provider.waitingNextAttempt', { label: providerLabel(prov), seconds: nextState.nextSec })
        );
        return;
      }
      setAutoProviderCountdownLabel(prov, t('provider.status.ready', { label: providerLabel(prov) }));
    });
  }

  function startAutoProviderCountdownTicker() {
    stopAutoProviderCountdownTicker();
    updateAutoProviderCountdowns();
    state.autoProviderCountdownTimer = setInterval(updateAutoProviderCountdowns, 500);
  }

  function stopAutoProviderCountdownTicker() {
    clearInterval(state.autoProviderCountdownTimer);
    state.autoProviderCountdownTimer = null;
  }

  // ── POMOCNÉ: Zjistí aktivní providery s klíčem ──────────────────────────────
  function getActiveParallelProviders() {
    const all = ['groq', 'gemini', 'openrouter'];
    return all.filter(prov => {
      if (!isAutoProviderEnabled(prov)) return false;
      const key = getCurrentApiKey(prov);
      return key && key.trim().length > 0;
    });
  }

  async function runAutoStep() {
    if (!state.autoRunning || state.autoStepRunning) return;
    state.autoStepRunning = true;

    try {
      if (isAutoTokenLimitReached()) {
        stopAuto();
        log(t('auto.log.stoppedTokenLimit'));
        showToast(t('toast.auto.stoppedTokenLimit'));
        return;
      }

      const activeProviders = getActiveParallelProviders();
      if (!activeProviders.length) {
        stopAuto();
        log(t('auto.log.stoppedGroqDisabled'));
        const groqHint = t('auto.groqEnableHint');
        const autoLogEl = document.getElementById('autoLog');
        if (autoLogEl) autoLogEl.textContent = groqHint;
        showToast(t('toast.auto.enableGroq'));
        return;
      }

      const check = getNextBatch(1);
      if (!check.length) {
        stopAuto();
        showToast(t('toast.translation.done'));
        return;
      }

      const batchSize = state.currentBatchSize;
      const intervalMs = state.currentInterval * 1000;

      // Elapsed timer
      if (!state.startTime) {
        state.startTime = Date.now();
        startElapsedTimer();
      }

      log('Paralelní překlad: ' + activeProviders.join(', ') + ' (dávka ' + batchSize + ')');
      updateETA();

      // Každý provider je samostatný worker — bere dávky nezávisle dokud jsou hesla.
      // Sdílená atomická zámka: JS single-thread zaručuje že getNextBatch+_processing
      // proběhne celé bez přerušení (žádný await uvnitř).
      async function runProviderWorkerAtomic(prov) {
        const apiKey = getCurrentApiKey(prov);
        const model = getPipelineModelForProvider(prov);
        if (!apiKey || !model) {
          log('[' + prov + '] chybí klíč nebo model, worker se nespustí');
          return;
        }

        while (state.autoRunning) {
          if (isAutoTokenLimitReached()) break;

          // Atomicky vzít dávku a okamžitě označit _processing
          // (žádný await mezi getNextBatch a nastavením _processing = bezpečné)
          const batch = getNextBatch(batchSize);
          if (!batch.length) break;
          for (const key of batch) {
            if (!state.translated[key]) {
              state.translated[key] = { vyznam: null, _processing: true };
            }
          }

          log('[' + prov + '] prekladam: ' + batch[0] + '–' + batch[batch.length - 1]);
          const autoBatch = document.getElementById('autoBatch');
          if (autoBatch) autoBatch.textContent = batch[0] + '–' + batch[batch.length - 1];

          const result = await translateBatchForProvider(batch, prov, apiKey, model);

          updateStats();
          renderList();
          if (state.activeKey && state.translated[state.activeKey]) renderDetail();
          if (!state.autoRunning) break;

          // Vlastní interval — každý provider čeká svůj čas nezávisle
          let delay = intervalMs;
          if (result && result.rateLimited) {
            delay = Math.max(intervalMs, result.cooldownSeconds ? result.cooldownSeconds * 1000 : 60000);
            log('[' + prov + '] rate limit, cekam ' + Math.round(delay / 1000) + 's');
          }
          setAutoProviderCountdownLabel(prov, prov + ': ' + Math.round(delay / 1000) + 's');

          // Čekat interval — každý provider čeká svůj vlastní, nezávisle na ostatních
          const waitUntil = Date.now() + delay;
          while (state.autoRunning && Date.now() < waitUntil) {
            const left = Math.min(500, waitUntil - Date.now());
            await new Promise(resolve => setTimeout(resolve, left));
          }
        }
        setAutoProviderCountdownLabel(prov, prov + ': hotovo');
      }

      await Promise.all(activeProviders.map(prov => runProviderWorkerAtomic(prov)));

      updateStats();
      renderList();
      if (state.activeKey && state.translated[state.activeKey]) renderDetail();
      if (!state.autoRunning) return;

      if (isAutoTokenLimitReached()) {
        stopAuto();
        showToast(t('toast.auto.stoppedTokenLimit'));
        return;
      }

      // Jsou ještě nepřeložená hesla? Spustit další kolo.
      const remaining2 = getNextBatch(1);
      if (!remaining2.length) {
        stopAuto();
        showToast(t('toast.translation.done'));
      } else {
        // Pokračovat dalším kolem — finally nastaví autoStepRunning=false, pak setTimeout spustí nové kolo
        state.autoTimer = setTimeout(runAutoStep, 50);
      }

    } finally {
      state.autoStepRunning = false;
    }
  }

  // ── POSTUPNÝ MÓD ─────────────────────────────────────────────────────────────
  // Provider za providerem, každý čeká svůj interval než dostane další dávku
  async function runSequentialStep() {
    if (!state.autoSeqRunning || state.autoStepRunning) return;
    state.autoStepRunning = true;

    try {
      if (isAutoTokenLimitReached()) {
        stopAutoSequential();
        showToast(t('toast.auto.stoppedTokenLimit'));
        return;
      }

      const activeProviders = getActiveParallelProviders();
      if (!activeProviders.length) {
        stopAutoSequential();
        showToast(t('toast.auto.enableGroq'));
        return;
      }

      const batchSize = state.currentBatchSize;
      const intervalMs = state.currentInterval * 1000;

      if (!state.startTime) {
        state.startTime = Date.now();
        startElapsedTimer();
      }

      // Inicializace per-provider cooldown timestamps
      if (!state.seqProviderNextAllowed) {
        state.seqProviderNextAllowed = {};
      }
      for (const prov of activeProviders) {
        if (!state.seqProviderNextAllowed[prov]) state.seqProviderNextAllowed[prov] = 0;
      }

      // Rotace — index v poli aktivních providerů
      if (state.seqProviderIndex === undefined || state.seqProviderIndex >= activeProviders.length) {
        state.seqProviderIndex = 0;
      }

      let anyTranslated = false;
      let roundStart = state.seqProviderIndex;
      let checked = 0;

      while (state.autoSeqRunning && checked < activeProviders.length) {
        if (isAutoTokenLimitReached()) { stopAutoSequential(); return; }

        const prov = activeProviders[state.seqProviderIndex];
        state.seqProviderIndex = (state.seqProviderIndex + 1) % activeProviders.length;
        checked++;

        // Zkontrolovat jestli provider čeká (interval od posledního volání)
        const now = Date.now();
        const nextAllowed = state.seqProviderNextAllowed[prov] || 0;
        if (now < nextAllowed) {
          const waitSec = Math.ceil((nextAllowed - now) / 1000);
          setAutoProviderCountdownLabel(prov, prov + ': čeká ' + waitSec + 's');
          continue; // tento provider ještě nesmí, zkusíme další
        }

        // Nejdřív ověřit klíč a model PŘED getNextBatch — jinak by se klíče ztratily
        const apiKey = getCurrentApiKey(prov);
        const model = getPipelineModelForProvider(prov);
        if (!apiKey || !model) {
          log('[' + prov + '] chybí API klíč nebo model, přeskakuji');
          continue;
        }

        // Vzít dávku
        const batch = getNextBatch(batchSize);
        if (!batch.length) {
          stopAutoSequential();
          showToast(t('toast.translation.done'));
          return;
        }

        // Označit _processing
        for (const key of batch) {
          if (!state.translated[key]) {
            state.translated[key] = { vyznam: null, _processing: true };
          }
        }

        const autoBatch = document.getElementById('autoBatch');
        if (autoBatch) autoBatch.textContent = batch[0] + '–' + batch[batch.length - 1];
        log('[' + prov + '] postupně: ' + batch[0] + '–' + batch[batch.length - 1]);
        setAutoProviderCountdownLabel(prov, prov + ': překládám...');

        const result = await translateBatchForProvider(batch, prov, apiKey, model);
        anyTranslated = true;

        updateStats();
        renderList();
        if (state.activeKey && state.translated[state.activeKey]) renderDetail();

        // Nastavit cooldown pro tohoto providera
        let cooldown = intervalMs;
        if (result && result.rateLimited) {
          cooldown = Math.max(intervalMs, result.cooldownSeconds ? result.cooldownSeconds * 1000 : 60000);
          log('[' + prov + '] rate limit, cooldown ' + Math.round(cooldown / 1000) + 's');
        }
        state.seqProviderNextAllowed[prov] = Date.now() + cooldown;

        // Ukázat countdown pro tohoto providera
        let remSec = Math.round(cooldown / 1000);
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) countdownEl.textContent = String(remSec);
        clearInterval(state.autoCountTimer);
        state.autoCountTimer = setInterval(() => {
          remSec--;
          if (countdownEl) countdownEl.textContent = String(Math.max(0, remSec));
          if (remSec <= 0) clearInterval(state.autoCountTimer);
        }, 1000);

        break; // Jeden provider za kolo, pak plánujeme další kolo
      }

      if (!state.autoSeqRunning) return;

      // Naplánovat další kolo — hned nebo až nejdříve povolený provider bude ready
      const now = Date.now();
      const waits = activeProviders.map(p => Math.max(0, (state.seqProviderNextAllowed[p] || 0) - now));
      const minWait = waits.length ? Math.min(...waits) : 0; // min čekání = nejdřívější provider
      const nextIn = Math.min(Math.max(0, minWait), 1000); // kontrolovat max každou sekundu
      updateAutoProviderCountdowns();
      state.autoTimer = setTimeout(() => {
        state.autoStepRunning = false;
        runSequentialStep();
      }, Math.max(100, nextIn));

    } finally {
      state.autoStepRunning = false;
    }
  }

  // ── TOGGLE / START / STOP SEQUENTIAL ────────────────────────────────────────
  function toggleAutoSequential() {
    if (state.autoSeqRunning) {
      stopAutoSequential();
    } else {
      startAutoSequential();
    }
  }

  function startAutoSequential() {
    if (state.autoSeqRunning) return; // guard proti double-start
    if (state.autoRunning) {
      showToast('Nejdřív zastav paralelní AUTO');
      return;
    }
    state.autoSeqRunning = true;
    state.seqProviderIndex = 0;
    state.seqProviderNextAllowed = {};
    const btn = document.getElementById('btnAutoSeq');
    if (btn) btn.textContent = '■ Stop';
    document.getElementById('autoPanel')?.classList.add('show');
    if (!state.startTime) {
      state.startTime = Date.now();
      startElapsedTimer();
    }
    startAutoProviderCountdownTicker();
    setTimeout(() => {
      if (state.autoSeqRunning && !state.autoStepRunning) runSequentialStep();
    }, 50);
  }

  function stopAutoSequential() {
    state.autoSeqRunning = false;
    state.autoStepRunning = false;
    clearTimeout(state.autoTimer);
    clearInterval(state.autoCountTimer);
    const btn = document.getElementById('btnAutoSeq');
    if (btn) btn.textContent = '↻ Postupně';
    if (window.innerWidth <= 600) {
      document.getElementById('autoPanel')?.classList.remove('show');
    }
    const countdown = document.getElementById('countdown');
    if (countdown) countdown.textContent = '—';
    stopElapsedTimer();
    updateAutoProviderCountdowns();
  }

  function saveAutoTokenLimit() {
    const input = document.getElementById('autoTokenLimit');
    if (!input) return;
    const raw = String(input.value || '').trim();
    const value = parseInt(raw, 10);
    if (!raw || Number.isNaN(value) || value <= 0) {
      safeRemoveLocalStorage(AUTO_TOKEN_LIMIT_KEY, 'AUTO');
      input.value = '';
    } else {
      input.value = String(value);
      safeSetLocalStorage(AUTO_TOKEN_LIMIT_KEY, String(value), 'AUTO');
    }
    refreshTokenStatsDisplay();
  }

  function getAutoTokenLimit() {
    const input = document.getElementById('autoTokenLimit');
    const fromInput = parseInt(String(input?.value || '').trim(), 10);
    if (!Number.isNaN(fromInput) && fromInput > 0) return fromInput;
    const fromStorage = parseInt(localStorage.getItem(AUTO_TOKEN_LIMIT_KEY) || '0', 10);
    return Number.isNaN(fromStorage) ? 0 : Math.max(0, fromStorage);
  }

   function isAutoTokenLimitReached() {
     const limit = getAutoTokenLimit();
     if (limit <= 0) return false;
     const total = state.totalTokens.total;
     return total >= limit;
   }

  function refreshTokenStatsDisplay() {
    const el = document.getElementById('tokenStats');
    if (!el) return;
    const limit = getAutoTokenLimit();
    const suffix = limit > 0 ? ` / limit ${limit}` : '';
    el.textContent = t('stats.tokens', {
      input: state.groqTokens.in,
      output: state.groqTokens.out,
      total: state.groqTokens.total,
      suffix
    });
  }

  return {
    toggleAuto,
    startAuto,
    stopAuto,
    setAutoProviderCountdownLabel,
    isAutoProviderEnabled,
    setAutoProviderEnabled,
    initAutoProviderToggles,
    updateAutoProviderCountdowns,
    startAutoProviderCountdownTicker,
    stopAutoProviderCountdownTicker,
    runAutoStep,
    runSequentialStep,
    toggleAutoSequential,
    startAutoSequential,
    stopAutoSequential,
    saveAutoTokenLimit,
    getAutoTokenLimit,
    isAutoTokenLimitReached,
    refreshTokenStatsDisplay
  };
}
