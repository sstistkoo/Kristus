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
  return {
    name: tp('aiPrompts.final.name', FINAL_PROMPT.name),
    desc: tp('aiPrompts.final.desc', FINAL_PROMPT.desc),
    text: tp('aiPrompts.final.text', FINAL_PROMPT.text)
  };
}

export function getResolvedPromptLibraryBase() {
    const base = JSON.parse(JSON.stringify(PROMPT_LIBRARY_BASE));
    const defText = getResolvedDefaultPrompt();
    const sysText = getResolvedSystemMessage();
    if (base.default?.[0]) {
        const o = base.default[0];
        o.name = tp('aiPrompts.lib.default.name', o.name);
        o.desc = tp('aiPrompts.lib.default.desc', o.desc);
        o.text = defText;
        o.system = tp('aiPrompts.lib.default.system', sysText);
    }
    if (base.detailed?.[0]) {
        const o = base.detailed[0];
        o.name = tp('aiPrompts.lib.detailed.name', o.name);
        o.desc = tp('aiPrompts.lib.detailed.desc', o.desc);
        o.text = tp('aiPrompts.lib.detailed.text', o.text);
        o.system = tp('aiPrompts.lib.detailed.system', sysText);
    }
    if (base.concise?.[0]) {
        const o = base.concise[0];
        o.name = tp('aiPrompts.lib.concise.name', o.name);
        o.desc = tp('aiPrompts.lib.concise.desc', o.desc);
        o.text = tp('aiPrompts.lib.concise.text', o.text);
        o.system = tp('aiPrompts.lib.concise.system', sysText);
    }
    if (base.literal?.[0]) {
        const o = base.literal[0];
        o.name = tp('aiPrompts.lib.literal.name', o.name);
        o.desc = tp('aiPrompts.lib.literal.desc', o.desc);
        o.text = tp('aiPrompts.lib.literal.text', o.text);
        o.system = tp('aiPrompts.lib.literal.system', sysText);
    }
    if (Array.isArray(base.library)) {
        for (let i = 0; i < base.library.length; i++) {
            const p = `aiPrompts.lib.stack${i}`;
            const o = base.library[i];
            o.name = tp(`${p}.name`, o.name);
            o.desc = tp(`${p}.desc`, o.desc);
            o.text = tp(`${p}.text`, o.text);
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
