/**
 * Překlady AI promptů z i18n (klíče aiPrompts.*) s fallbackem na strong_prompts / core.
 */
import { t } from './i18n.js';
import core from '../strong_translator_core_new.js';
import prompts from '../strong_prompts.js';

const { FINAL_PROMPT, PROMPT_LIBRARY_BASE } = prompts;

function tp(key, fallback) {
  const v = t(key);
  return v !== key ? v : fallback;
}

// Načte překlad podle cílového jazyka překladu (strong_target_lang)
function tTargetLang(key, fallback) {
  const targetLang = (localStorage.getItem('strong_target_lang') || 'cz').toLowerCase();
  // Mapování na kód souboru prompts
  const langToFileCode = {
    cz: 'cs', cs: 'cs', sk: 'sk', pl: 'pl', de: 'de', fr: 'fr', es: 'es', it: 'it',
    pt: 'pt', ru: 'ru', uk: 'uk', bg: 'bg', ro: 'ro', da: 'da', fi: 'fi', hu: 'hu',
    nl: 'nl', no: 'no', sv: 'sv', ar: 'ar', el: 'el', tr: 'tr', 'zh-cn': 'zh_CN',
    ja: 'ja', ko: 'ko', he: 'he', en: 'en', gr: 'el'
  };
  const fileCode = langToFileCode[targetLang] || 'cs';
  
  // Zkusíme načíst z UI_MESSAGES (byly načteny mergePromptPacksIntoLoaded)
  const UI_MESSAGES = window?.UI_MESSAGES || {};
  const promptMessages = UI_MESSAGES[fileCode] || UI_MESSAGES.cs || {};
  const v = promptMessages[key];
  return v !== undefined ? v : fallback;
}

export function getResolvedSystemMessage() {
  return tTargetLang('aiPrompts.core.system', core.SYSTEM_MESSAGE);
}

export function getResolvedDefaultPrompt() {
  return tp('aiPrompts.core.userDefault', core.DEFAULT_PROMPT);
}

export function getResolvedFinalPrompt() {
   const commonBatchDefault = tp('aiPrompts.common.batchDefault', DEFAULT_PROMPT);
   return {
     name: tp('aiPrompts.final.name', FINAL_PROMPT.name),
     desc: tp('aiPrompts.final.desc', FINAL_PROMPT.desc),
     text: commonBatchDefault
   };
 }

export function getResolvedPromptLibraryBase() {
     const base = JSON.parse(JSON.stringify(PROMPT_LIBRARY_BASE));
     const defText = getResolvedDefaultPrompt();
     const sysText = getResolvedSystemMessage();
     const commonBatchDefault = tp('aiPrompts.common.batchDefault', DEFAULT_PROMPT);
     if (base.default?.[0]) {
         const o = base.default[0];
         o.name = tp('aiPrompts.lib.default.name', o.name);
         o.desc = tp('aiPrompts.lib.default.desc', o.desc);
         o.text = defText;
         o.system = tp('aiPrompts.lib.default.system', sysText);
     }
     const simpleCats = ['detailed', 'concise', 'literal'];
     for (const cat of simpleCats) {
         if (base[cat]?.[0]) {
             const o = base[cat][0];
             o.name = tp(`aiPrompts.lib.${cat}.name`, o.name);
             o.desc = tp(`aiPrompts.lib.${cat}.desc`, o.desc);
             o.text = tp(`aiPrompts.lib.${cat}.text`, commonBatchDefault);
             o.system = tp(`aiPrompts.lib.${cat}.system`, sysText);
         }
     }
     if (Array.isArray(base.library)) {
         for (let i = 0; i < base.library.length; i++) {
             const p = `aiPrompts.lib.stack${i}`;
             const o = base.library[i];
             o.name = tp(`${p}.name`, o.name);
             o.desc = tp(`${p}.desc`, o.desc);
             o.text = tp(`${p}.text`, commonBatchDefault);
             o.system = tp(`${p}.system`, sysText);
         }
     }
     return base;
 }

export function getResolvedModelTestCatalog(fallbackCat) {
  const out = {};
  for (const [id, v] of Object.entries(fallbackCat || {})) {
    const label = tp(`aiPrompts.mt.${id}.label`, v.label);
    const template = tp(`aiPrompts.mt.${id}.template`, v.template);
    const entry = { label, template };
    if (v.topicLabel != null) {
      entry.topicLabel = tp(`aiPrompts.mt.${id}.topicLabel`, v.topicLabel);
    }
    out[id] = entry;
  }
  return out;
}
