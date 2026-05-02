import { ITEM_HEIGHT, PROVIDERS } from '../config.js';
import { isSideFallbackAborted, sleepMsWithAbort, runProviderFallbackTaskSequential } from '../ai/fallback.js';
import {
  buildSecondaryProviderModelCandidates,
  getRankedModelsForSecondary,
  getProviderConfiguredModelsForAI,
  getStaticFallbackModels
} from '../../strong_translator_ai.js';
import {
  hasMeaningfulValue, isDefinitionLowQuality, isTranslationComplete
} from './utils.js';
import core from '../../strong_translator_core_new.js';

const { buildRetryMessages } = core;

export function createBatchApi(deps) {
  const {
    state, t, escHtml,
    log, logError, logWarn,
    showToast,
    TOPIC_PROMPT_PRESET_MAP,
    parseTranslations,
    parseWithOpenRouterNormalization, applyFallbacksToParsedMap,
    extractTopicValueFromAI,
    shouldReplaceSpecialista,
    fillMissingVyznamFromSource, fillMissingKjvFromSource, annotateEnglishDefinitionsInTranslated,
    buildPromptMessages,
    callOnce, callAIWithRetry,
    getApiKeyForModelTest, getPipelineModelForProvider, getCurrentApiKey,
    getModelTestSelectedModelForProvider,
    resolveMainBatchProvider,
    appendModelTestUsage, buildModelTestMessages,
    isPipelineSecondaryEnabled,
    upsertModelTestStats, pushTestHistory,
    renderList, updateStats, renderDetail,
    startElapsedTimer, stopElapsedTimer, updateFailedCount,
    saveProgress,
    logTokenEntry, logEntry,
    getTranslationEngineLabel,
    isAutoProviderEnabled,
    translateSelected,
  } = deps;
function formatPreviewRawTranslation(rawDef) {
  const text = String(rawDef || '').trim();
  if (!text) return '—';
  const esc = escHtml(text);
  const formatted = esc
    .replace(/(VÝZNAM:|Význam:)/g, '<br><b>$1</b>')
    .replace(/(DEFINICE:|Definice:)/g, '<br><b>$1</b>')
    .replace(/(POUŽIT[ÍI]:|Použit[íi]:)/g, '<br><b>$1</b>')
    .replace(/(SPECIALISTA:|Specialista:|VÝKLAD:|Výklad:)/g, '<br><b>$1</b>');
  return formatted.replace(/^<br>/, '');
}

// -- PREKLAD — SINGLE --------------------------------------------
async function translateSingle(key) {
  const btn = document.querySelector('.translate-btn');
  if (btn) { btn.disabled = true; btn.textContent = t('translate.single.translating'); }
  
  const prov = resolveMainBatchProvider(document.getElementById('provider')?.value || '');
  const apiKey = getCurrentApiKey(prov);
  const model = getPipelineModelForProvider(prov) || document.getElementById('model').value;

   if (!apiKey) {
     showToast(t('toast.apiKey.enterForProvider', { provider: prov }));
     if (btn) { btn.disabled = false; btn.textContent = t('translate.single.button'); }
     return;
   }

   const e = state.entryMap.get(key);
  if (!e) {
    if (btn) { btn.disabled = false; btn.textContent = t('translate.single.button'); }
    return;
  }
  
  const messages = buildPromptMessages([e]);
  
  try {
    const raw = await callAIWithRetry(prov, apiKey, model, messages);
    log(`?? Preklad: ${getTranslationEngineLabel(raw, prov, model)}`);
    if (window.DEBUG_AI) {
    }
    let missingKeys = parseTranslations(raw.content, [key]);
    
    if (missingKeys.length > 0) {
      const entries = `${key}
DEF: ${e.definice || e.def || ''}
KJV: ${e.kjv || ''}
ORIG: ${e.orig || ''}`;
      const retryContent = t('batch.retry.missingG', { entries });
      
       const raw2 = await callOnce(prov, apiKey, model, buildRetryMessages(retryContent));
       missingKeys = parseTranslations(raw2.content, [key]);
     }

   } catch(e) {
     logError('translateSingle', e, {
       key,
       provider: prov,
       model
     });
     showToast(t('toast.error.withMessage', { message: e.message }));
   }
  
  if (btn) { btn.disabled = false; btn.textContent = t('translate.single.button'); }
  renderDetail();
  updateStats();
  renderList();
}

// -- PREKLAD — ZNOVU --------------------------------------------
async function retranslateSingle(key) {
  if (!confirm(t('confirm.retranslate', { key }))) return;
  
  // Oznac jako nepreložené pro další zpracování
  delete state.translated[key];
  saveProgress();
  
  // Vyber jen tento klíc
  state.selectedKeys.clear();
  state.selectedKeys.add(key);
  renderList();
  
  // Zavolej preklad
  await translateSelected();
}

// -- PREKLAD — DÁVKA ----------------------------------------------
async function translateNext() {
  if (state.autoRunning) return;
  const activeProvider = resolveMainBatchProvider(document.getElementById('provider')?.value || '');
  if (!isAutoProviderEnabled(activeProvider)) {
    showToast(t('toast.provider.enableOne'));
    return;
  }
  
  // Retry mode - použij state.retryKeysList místo getNextBatch
  let batch;
  if (state.retryMode && state.retryKeysList.length > 0) {
    batch = state.retryKeysList.slice(0, state.currentBatchSize);
    state.retryKeysList = state.retryKeysList.slice(state.currentBatchSize);
    if (state.retryKeysList.length === 0) {
      state.retryMode = false;
    }
  } else {
    batch = getNextBatch(state.currentBatchSize);
  }
  
  if (!batch.length) { 
    if (state.retryMode) {
      showToast(t('toast.retry.done'));
      state.retryMode = false;
    } else {
      showToast(t('toast.allTranslated')); 
    }
    stopElapsedTimer();
    return; 
  }
  
  // Info o retry módu
  if (state.retryMode) {
    document.getElementById('btnStep').title = t('batch.retry.remaining', { count: state.retryKeysList.length + batch.length });
  }
  
  document.getElementById('btnStep').disabled = true;
  document.getElementById('btnStep').textContent = t('btn.step.loading');
  await translateBatch(batch);
  document.getElementById('btnStep').disabled = false;
  document.getElementById('btnStep').textContent = t('btn.step.default');
  updateStats();
  renderList();
  if (state.activeKey && state.translated[state.activeKey]) renderDetail();
}

function jumpToStart() {
  const num = parseInt(document.getElementById('startFrom').value);
  if (!num || num < 1) { showToast(t('toast.jump.enterGNumber')); return; }
  const key = 'G' + num;
  const found = state.entryMap.get(key);
  if (!found) { showToast(t('toast.entry.notFoundInFile', { key: `G${num}` })); return; }

   // Oznac všechna hesla PRED tímto císlem jako preskocená (zachováme existující preklady)
   for (const e of state.entries) {
     const n = parseInt(e.key.slice(1));
     if (n < num && !state.translated[e.key]) {
       state.translated[e.key] = { vyznam: '—', definice: '(preskoceno)', puvod: '—', skipped: true };
     }
   }
   saveProgress();
   updateStats();
   renderList();
   showToast(t('toast.translation.resumeFrom', { key: `G${num}` }));
   // Scroll na heslo v listu (virtuální)
   setTimeout(() => {
     const scroll = document.getElementById('listScroll');
     const idx = state.filteredKeys.indexOf(key);
     if (idx !== -1) {
       scroll.scrollTop = idx * ITEM_HEIGHT - (scroll.clientHeight / 2) + (ITEM_HEIGHT / 2);
     }
   }, 0);
 }


function getNextBatch(size) {
  const result = [];
  const sourceLang = localStorage.getItem('strong_source_lang') || 'gr';
  const includeG = sourceLang === 'gr' || sourceLang === 'both';
  const includeH = sourceLang === 'he' || sourceLang === 'both';
  
  for (const e of state.entries) {
    if (result.length >= size) break;
    if (!state.translated[e.key] || state.translated[e.key].skipped) {
      const startsWithG = e.key.startsWith('G');
      const startsWithH = e.key.startsWith('H');
      
      if ((includeG && startsWithG) || (includeH && startsWithH)) {
        result.push(e.key);
      }
    }
  }
  return result;
}

const FALLBACK_TOPIC_ORDER = ['definice', 'vyznam', 'kjv', 'puvod', 'specialista'];

function getFailedTopicsForFallback(translationEntry) {
  const t = translationEntry || {};
  const failed = [];
  for (const topicId of FALLBACK_TOPIC_ORDER) {
    const val = String(t[topicId] || '').trim();
    if (!hasMeaningfulValue(val)) {
      failed.push(topicId);
      continue;
    }
    if (topicId === 'definice' && isDefinitionLowQuality(val)) {
      failed.push(topicId);
    }
  }
  return failed;
}

function getMissingTopicsForRepair(translationEntry) {
  const allMissing = getFailedTopicsForFallback(translationEntry);
  return allMissing.slice(0, 2);
}

function cloneTranslationTopicFields(entry) {
  const src = entry || {};
  return {
    vyznam: String(src.vyznam || ''),
    definice: String(src.definice || ''),
    kjv: String(src.kjv || ''),
    puvod: String(src.puvod || ''),
    specialista: String(src.specialista || '')
  };
}

function isBetterGenericTopicValue(prev, next) {
  const prevText = String(prev || '').trim();
  const nextText = String(next || '').trim();
  if (!hasMeaningfulValue(nextText)) return false;
  if (!hasMeaningfulValue(prevText)) return true;
  if (nextText.length >= prevText.length + 40) return true;
  return false;
}

function shouldReplaceTopicValue(topicId, previousValue, candidateValue) {
  const prev = String(previousValue || '').trim();
  const next = String(candidateValue || '').trim();
  if (!hasMeaningfulValue(next)) return false;
  if (!hasMeaningfulValue(prev)) return true;
  if (topicId === 'specialista') return shouldReplaceSpecialista(prev, next);
  if (topicId === 'definice') {
    if (isDefinitionLowQuality(next)) return false;
    if (isDefinitionLowQuality(prev) && !isDefinitionLowQuality(next)) return true;
    return isBetterGenericTopicValue(prev, next);
  }
  return isBetterGenericTopicValue(prev, next);
}

function preserveBetterTopicsAfterBatch(keys, previousMap) {
  const topics = ['vyznam', 'definice', 'kjv', 'puvod', 'specialista'];
  for (const key of (Array.isArray(keys) ? keys : [])) {
    const current = state.translated[key];
    if (!current) continue;
    const previous = previousMap?.[key] || {};
    for (const topicId of topics) {
      const prevVal = String(previous[topicId] || '').trim();
      const curVal = String(current[topicId] || '').trim();
      const acceptCurrent = shouldReplaceTopicValue(topicId, prevVal, curVal);
      if (!acceptCurrent && hasMeaningfulValue(prevVal)) {
        current[topicId] = prevVal;
      }
    }
  }
}

function getProviderCooldownLeftSec(prov) {
  const until = Number(state.providerCooldownUntil?.[prov] || 0);
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

function setProviderCooldown(prov, seconds, reason = '') {
  const sec = Math.max(0, Number(seconds) || 0);
  if (!Object.prototype.hasOwnProperty.call(state.providerCooldownUntil, prov)) return;
  state.providerCooldownUntil[prov] = sec > 0 ? (Date.now() + sec * 1000) : 0;
}

function getModelCooldownLeftSec(prov, model) {
  const map = state.providerModelCooldownUntil?.[prov];
  if (!map || !model) return 0;
  const until = Number(map[model] || 0);
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

function setModelCooldown(prov, model, seconds) {
  if (!model) return;
  if (!Object.prototype.hasOwnProperty.call(state.providerModelCooldownUntil, prov)) {
    state.providerModelCooldownUntil[prov] = {};
  }
  const sec = Math.max(0, Number(seconds) || 0);
  state.providerModelCooldownUntil[prov][model] = sec > 0 ? (Date.now() + sec * 1000) : 0;
}


function shouldAcceptTopicFallback(topicId, candidate) {
  if (!hasMeaningfulValue(candidate)) return false;
  if (topicId === 'definice' && isDefinitionLowQuality(candidate)) return false;
  return true;
}

function getSecondaryProviderModelCandidates(prov) {
  return buildSecondaryProviderModelCandidates({
    provider: prov,
    providers: PROVIDERS,
    selectedModel: getPipelineModelForProvider(prov) || getModelTestSelectedModelForProvider(prov) || '',
    rankedModels: getRankedModelsForSecondary(prov),
    maxNonGemini: 4
  });
}

function getSecondaryProviderModelQueue(prov) {
  const uniqueQueue = getSecondaryProviderModelCandidates(prov);
  if (!uniqueQueue.length) return [];
  const idx = Math.max(0, Number(state.providerModelRotationIndex?.[prov] || 0));
  const shift = idx % uniqueQueue.length;
  state.providerModelRotationIndex[prov] = idx + 1;
  return [...uniqueQueue.slice(shift), ...uniqueQueue.slice(0, shift)];
}

function getSecondaryNextOperationState(prov) {
  const queue = getSecondaryProviderModelCandidates(prov);
  if (!queue.length) return { exhausted: false, nextSec: 0 };
  const providerLeft = getProviderCooldownLeftSec(prov);
  let nextSec = Number.POSITIVE_INFINITY;
  let hasReadyNow = false;
  for (const model of queue) {
    const modelLeft = getModelCooldownLeftSec(prov, model);
    const opLeft = Math.max(providerLeft, modelLeft);
    if (opLeft <= 0) {
      hasReadyNow = true;
      break;
    }
    nextSec = Math.min(nextSec, opLeft);
  }
  if (hasReadyNow) return { exhausted: false, nextSec: 0 };
  if (!Number.isFinite(nextSec)) return { exhausted: false, nextSec: 0 };
  return { exhausted: true, nextSec: Math.max(1, Math.ceil(nextSec)) };
}

function getSecondaryRetryDelayMsByError(msgLower) {
  if (/resource_exhausted|too many|rate limit|429|high demand/.test(msgLower)) return 3000;
  if (/503|service unavailable|timeout|api timeout/.test(msgLower)) return 3000;
  if (/400|invalid/.test(msgLower)) return 1500;
  return 2500;
}

function getSecondaryCooldownSecByError(prov, rawMsg) {
  const msg = String(rawMsg || '');
  const low = msg.toLowerCase();
  if (prov === 'gemini' && (/resource_exhausted|429|high demand|limit vycerpán/.test(low))) {
    // U Gemini držíme cooldown hlavne per-model, ne per-provider.
    return 0;
  }
  if (/503|service unavailable|api timeout/.test(low)) return 5;
  if (/429|rate limit|too many|quota/.test(low)) {
    const parsed = rateInfoFromErrorMessage(msg)?.retryAfterSec || 0;
    return Math.max(3, Math.min(20, parsed || 6));
  }
  return 0;
}

function getSecondaryModelCooldownSecByError(prov, rawMsg) {
  const msg = String(rawMsg || '');
  const low = msg.toLowerCase();
  const retryAfter = rateInfoFromErrorMessage(msg)?.retryAfterSec || 0;
  const minMatch = low.match(/(\d+)\s*min/);
  const fromMinutes = minMatch ? (Number(minMatch[1]) || 0) * 60 : 0;
  if (prov === 'gemini' && (/limit vycerpán|resource_exhausted/.test(low))) {
    // Prefer explicit Retry-After from API over textual "~20min" hint.
    const preferred = retryAfter || fromMinutes || (20 * 60);
    return Math.max(20, Math.min(25 * 60, preferred));
  }
  if (/high demand|503|service unavailable/.test(low)) {
    return Math.max(20, Math.min(180, retryAfter || 45));
  }
  if (/429|rate limit|too many|quota/.test(low)) {
    return Math.max(20, Math.min(180, retryAfter || 30));
  }
  return 0;
}

async function requestTopicFallbackForProvider(prov, key, topicId, abortVersion) {
  if (isSideFallbackAborted(abortVersion)) return null;
  const apiKey = getApiKeyForModelTest(prov);
  const modelQueue = getSecondaryProviderModelQueue(prov);
  if (!apiKey || !modelQueue.length) return null;
  if (getProviderCooldownLeftSec(prov) > 0) return null;
  const entry = state.entryMap.get(key);
  if (!entry) return null;
  const promptType = TOPIC_PROMPT_PRESET_MAP[topicId];
  if (!promptType) return null;
  const messages = buildModelTestMessages([entry], 'auto-live', promptType, true);

  for (let i = 0; i < modelQueue.length; i++) {
    if (isSideFallbackAborted(abortVersion)) return null;
    const model = modelQueue[i];
    // Pokud je provider nebo model v cooldownu, neblokujeme frontu cekáním –
    // vrátíme null okamžite a témata pokracují pres druhý provider nebo príšte.
    if (getProviderCooldownLeftSec(prov) > 0) return null;
    const modelCooldownLeft = getModelCooldownLeftSec(prov, model);
    if (modelCooldownLeft > 0) {
      continue;
    }
    const reqStart = performance.now();
    try {
      const raw = await callOnce(prov, apiKey, model, messages);
      const reqMs = Math.round(performance.now() - reqStart);
      const parsed = {};
      const rawText = String(raw?.content || '');
      parseWithOpenRouterNormalization(rawText, [key], parsed);
      applyFallbacksToParsedMap([key], parsed);
      let candidate = String(parsed?.[key]?.[topicId] || '').trim();
      if (!candidate) {
        // Topic prompty mohou vracet cistou hodnotu pole bez parser-safe bloku.
        candidate = extractTopicValueFromAI(rawText, topicId, 'strict');
      }
      appendModelTestUsage(() => {}, prov, model, raw);
      if (shouldAcceptTopicFallback(topicId, candidate)) {
        log(`? Fallback ${prov}/${model} ${key}.${topicId} OK (${reqMs}ms)`);
        return { prov, model, value: candidate, reqMs };
      }
      log(`? Fallback ${prov}/${model} ${key}.${topicId}: odpoved neprošla kvalitou, zkouším další model.`);
    } catch (e) {
      const msg = String(e?.message || '');
      const msgLower = msg.toLowerCase();
      const isRate = /429|rate limit|too many|quota|resource_exhausted|high demand/.test(msgLower);
      const cooldownSec = getSecondaryCooldownSecByError(prov, msg);
      const modelCooldownSec = getSecondaryModelCooldownSecByError(prov, msg);
      if (modelCooldownSec > 0) setModelCooldown(prov, model, modelCooldownSec);
      if (cooldownSec > 0) setProviderCooldown(prov, cooldownSec, isRate ? 'rate limit' : 'provider error');
      state.providerFailBadgeUntil[prov] = Date.now() + 10000;
        // Pokud provider spadl do delšího cooldownu, fallback hned ukoncíme,
        // aby neblokoval další Groq dávky.
      // aby neblokoval další Groq dávky.
      if (cooldownSec >= 45) {
        return null;
      }
      const canTryNext = i < modelQueue.length - 1;
      if (canTryNext) {
        const waitMs = getSecondaryRetryDelayMsByError(msgLower);
        const cooldownMs = getProviderCooldownLeftSec(prov) * 1000;
        const effectiveWaitMs = Math.max(waitMs, cooldownMs);
        // Retry detail necháváme pouze v konzoli, AUTO rádek zustává strucný.
        const keptRunning = await sleepMsWithAbort(effectiveWaitMs, abortVersion);
        if (!keptRunning) return null;
      }
    }
  }
  return null;
}

async function runParallelTopicFallback(keys, abortVersion) {
  if (isSideFallbackAborted(abortVersion)) return;
  const keyList = Array.isArray(keys) ? keys : [];
  if (!keyList.length) return;
  const sideProviders = ['gemini', 'openrouter'].filter(prov => isPipelineSecondaryEnabled(prov));
  if (!sideProviders.length) {
    log('? Sekundární fallback vypnutý (žádný provider není zaškrtnut).');
    return;
  }
  // Každý klíc zpracuj paralelne, uvnitr klíce témata také paralelne.
  // Každý provider má vlastní sekvencní frontu (runProviderFallbackTaskSequential),
  // takže rate limit je chránen – soubežná témata se jen seradí do fronty providera.
  // Dríve: témata sekvencní ? pomalý OpenRouter blokoval Gemini pro další témata.
  await Promise.all(keyList.map(async (key) => {
    if (isSideFallbackAborted(abortVersion)) return;
    const t = state.translated[key] || {};
    const failedTopics = getFailedTopicsForFallback(t);
    if (!failedTopics.length) return;
     await Promise.all(failedTopics.map(async (topicId) => {
       if (isSideFallbackAborted(abortVersion)) return;
       // Spustit všechny enabled secondary providery paraleln?, vybrat prvního úsp?šného
       const results = await Promise.all(
         sideProviders.map(async (prov) => {
           return await runProviderFallbackTaskSequential(
             prov,
             () => requestTopicFallbackForProvider(prov, key, topicId, abortVersion)
           ).catch(() => null);
         })
       );
       const chosen = results.find(r => r != null) || null;
       if (!chosen) return;
       if (isSideFallbackAborted(abortVersion)) return;
       state.translated[key] = state.translated[key] || {};
       state.translated[key][topicId] = chosen.value;
       log(`? Fallback prevzat ${key}.${topicId} <= ${chosen.prov}/${chosen.model}`);
     }));
  }));
}

function enqueueSideFallbackBackground(keys) {
  const keyList = Array.isArray(keys) ? keys.filter(Boolean) : [];
  if (!keyList.length) return;
  const abortVersion = state.sideFallbackAbortVersion;
  // Inicializace queue pokud neexistuje
  if (!state.sideFallbackBackgroundQueue) {
    state.sideFallbackBackgroundQueue = Promise.resolve();
  }
  state.sideFallbackBackgroundQueue = state.sideFallbackBackgroundQueue
    .catch(() => undefined)
    .then(async () => {
      if (isSideFallbackAborted(abortVersion)) return;
      try {
        await runParallelTopicFallback(keyList, abortVersion);
      } catch (e) {}
    });
}

async function translateBatch(keys, depth = 0) {
  const preferredProvider = document.getElementById('provider')?.value || '';
  const prov   = resolveMainBatchProvider(preferredProvider);
  const model  = getPipelineModelForProvider(prov) || document.getElementById('model').value;
  // Klíc vždy dle aktuálního run providera
  const apiKey = getCurrentApiKey(prov);
  state.currentInterval = parseInt(document.getElementById('intervalRun').value);
  state.currentBatchSize = parseInt(document.getElementById('batchSizeRun').value);

  if (!apiKey) { showToast(t('toast.apiKey.enterForProvider', { provider: prov })); return { ok: false }; }

  // Start timer pri prvním prekladu
  if (!state.startTime) {
    state.startTime = Date.now();
    startElapsedTimer();
  }

  const batch = keys.map(k => state.entryMap.get(k)).filter(Boolean);
  const messages = buildPromptMessages(batch);

  const reqStart = performance.now();
  try {
    const previousMap = {};
    for (const key of keys) {
      previousMap[key] = cloneTranslationTopicFields(state.translated[key]);
    }
    const raw = await callAIWithRetry(prov, apiKey, model, messages);
    const reqMs = performance.now() - reqStart;
    const content = raw.content;
    log(`?? Preklad: ${getTranslationEngineLabel(raw, prov, model)}`);
    // Verbose logy pouze když je aktivní režim pro debug (window.DEBUG_AI = true v konzoli)
    if (window.DEBUG_AI) {
    }
    let missingKeys = parseTranslations(content, keys);
    preserveBetterTopicsAfterBatch(keys, previousMap);
    fillMissingVyznamFromSource(keys);
    fillMissingKjvFromSource(keys);
    annotateEnglishDefinitionsInTranslated(keys);
    
    // Log tokenu
    const usage = raw.usage || raw.usageMetadata;
    if (usage) {
      const inT = usage.prompt_tokens || usage.promptTokenCount || 0;
      const outT = usage.completion_tokens || usage.candidatesTokenCount || 0;
      const total = inT + outT;
      log(`?? ${prov}: ${inT} in / ${outT} out = ${total} celkem`);
      logTokenEntry(prov, inT, outT, total);
    }
    
    // Log do konzoly pro úspešné
    for (const key of keys) {
      const t = state.translated[key];
      if (t?.vyznam && t.vyznam !== '—') {
      }
    }
    logEntry(keys, content);
    
    // Ulož raw odpoved pro každý klíc (pro pozdejší zobrazení chyb)
    for (const key of keys) {
      if (state.translated[key]) {
        state.translated[key].raw = content;
      }
    }
    
     // Pokud neco chybí, zkus opravný retry
     if (missingKeys.length > 0) {
       log(`? Pokus o opravu formátu pro ${missingKeys.join(', ')}...`);
      const entries = keys.map((k) => {
        const e = state.entryMap.get(k);
        return e ? `${e.key} | ${e.greek}\nDEF: ${e.definice || e.def || ''}\nKJV: ${e.kjv || ''}` : '';
      }).join('\n\n');
      const retryContent = t('batch.retry.missingG', { entries });
      
      try {
        const raw2 = await callOnce(prov, apiKey, model, buildRetryMessages(retryContent));
        missingKeys = parseTranslations(raw2.content, keys);
        preserveBetterTopicsAfterBatch(keys, previousMap);
        fillMissingVyznamFromSource(keys);
        fillMissingKjvFromSource(keys);
        annotateEnglishDefinitionsInTranslated(keys);
        const retryCount = keys.length - missingKeys.length;
        if (retryCount > 0) {
          log(`? Opravný preklad: ${retryCount} hesel, chybí: ${missingKeys.length > 0 ? missingKeys.join(', ') : 'nic'}`);
        } else {
          log(`? Opravný preklad nepomohl, chybí: ${missingKeys.join(', ')}`);
        }
      } catch(e2) {
        log(`? Opravný pokus selhal: ${e2.message}`);
      }
    }
    
    // Fallback strategie: pokud po retry chybí cást dávky, zkus menší dávku.
    if (missingKeys.length > 0 && keys.length > 1 && depth < 4) {
      log(`? Fallback dávky: delím ${missingKeys.length} klícu na menší bloky (úroven ${depth + 1})`);
      const pivot = Math.ceil(missingKeys.length / 2);
      const chunks = [missingKeys.slice(0, pivot), missingKeys.slice(pivot)].filter(ch => ch.length > 0);
      for (const chunk of chunks) {
        if (chunk.length === 1) {
          await translateBatch(chunk, depth + 1);
        } else {
          await translateBatch(chunk, depth + 1);
        }
      }
    }

    // Sekundární fallback spouštej až po dokoncení všech pokusu hlavního providera pro danou dávku
    // (tj. pouze v top-level volání). Tím se vyhneme "strídání" provideru behem hlavního prekladu.
    if (depth === 0) {
      const keysBeforeSideFallback = keys.filter(k => !isTranslationComplete(state.translated[k]));
      if (keysBeforeSideFallback.length > 0) {
        log(`? Analýza po ${prov}: ${keysBeforeSideFallback.length} hesel má chyby/neúplná témata; sekundární topic fallback beží na pozadí.`);
        enqueueSideFallbackBackground(keysBeforeSideFallback);
      } else {
        log(`? Analýza po ${prov}: dávka kompletní, sekundární fallback není potreba.`);
      }
    }

    const translatedCount = keys.filter(k => isTranslationComplete(state.translated[k])).length;
    upsertModelTestStats(prov, model, {
      status: translatedCount === keys.length ? 'OK' : 'PARTIAL',
      okKeys: translatedCount,
      failedKeys: keys.length - translatedCount,
      totalKeys: keys.length,
      latencyMs: reqMs
    });
    pushTestHistory({
      type: 'translate-batch',
      provider: prov,
      model,
      total: keys.length,
      ok: translatedCount,
      missing: keys.length - translatedCount,
      avgLatencyMs: reqMs
    });
    if (translatedCount < keys.length) {
      // Oznac chybející hesla jako neúspešná
      for (const key of keys) {
        if (!isTranslationComplete(state.translated[key])) {
          state.translated[key] = state.translated[key] || {};
          if (!state.translated[key].vyznam || state.translated[key].vyznam === '—') {
            state.translated[key].vyznam = '—';
          }
        }
      }
      log(`? Pozor: Preloženo ${translatedCount}/${keys.length} hesel. Zkuste menší dávku.`);
      showToast(t('toast.translated.partial', { translated: translatedCount, total: keys.length }));
    }
    
     saveProgress();
     updateFailedCount();
     // logEntry already called above after initial parse
     log(`? Preloženo ${keys.length} hesel (${keys[0]}–${keys[keys.length-1]})`);
     return { ok: true };
} catch(e) {
      const reqMs = performance.now() - reqStart;
      const msg = (e?.message || '').toLowerCase();
      const isRate = msg.includes('429') || msg.includes('rate limit') || msg.includes('quota') || msg.includes('too many');
      upsertModelTestStats(prov, model, {
        status: isRate ? 'RATE_LIMITED' : 'ERROR',
        okKeys: 0,
        failedKeys: keys.length,
        totalKeys: keys.length,
        latencyMs: reqMs
      });
      if (isRate) {
        pushTestHistory({
          type: 'translate-batch',
          provider: prov,
          model,
          total: keys.length,
          ok: 0,
          missing: keys.length,
          avgLatencyMs: reqMs
        });
        const cooldownSeconds = Math.max(state.currentInterval, 60);
        logWarn('translateBatch', `Rate limit dávky ${keys[0]}-${keys[keys.length-1]}, odklad ${cooldownSeconds}s`, {
          provider: prov,
          keyRange: `${keys[0]}-${keys[keys.length-1]}`,
          cooldownSeconds,
          error: e.message
        });
        showToast(t('toast.rateLimit.retryIn', { seconds: cooldownSeconds }));
        return { ok: false, rateLimited: true, cooldownSeconds };
      }
      logError('translateBatch', e, {
        keys: keys.slice(0, 5), // first 5 keys only
        keyRange: `${keys[0]}-${keys[keys.length-1]}`,
        provider: prov,
        batchSize: keys.length
      });
      // Oznac chybná hesla jako neúspešná, aby šla zobrazit v "Neúspešné preklady"
      for (const key of keys) {
        if (!state.translated[key]) {
          state.translated[key] = { vyznam: '—', definice: '', puvod: '', specialista: '', raw: `CHYBA: ${e.message}` };
        }
      }
      saveProgress();
      pushTestHistory({
        type: 'translate-batch',
        provider: prov,
        model,
        total: keys.length,
        ok: 0,
        missing: keys.length,
        avgLatencyMs: reqMs
      });
      updateFailedCount();
      showToast(t('toast.error.withMessage', { message: e.message }));
      return { ok: false };
   }
}
  return {
    translateSingle,
    retranslateSingle,
    translateNext,
    jumpToStart,
    translateBatch,
    getNextBatch,
    getSecondaryNextOperationState,
    getFailedTopicsForFallback,
    getMissingTopicsForRepair,
    cloneTranslationTopicFields,
    shouldReplaceTopicValue,
    getProviderCooldownLeftSec,
    formatPreviewRawTranslation,
  };
}
