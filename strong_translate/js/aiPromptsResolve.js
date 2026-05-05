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

const TOPIC_SYSTEM_PROMPT_STORAGE_PREFIX = 'strong_topic_system_prompt_v1_';

function getTopicSystemPromptStorageKey(topicId) {
  return `${TOPIC_SYSTEM_PROMPT_STORAGE_PREFIX}${topicId}`;
}

export function getTopicSystemPromptTemplate(topicId) {
  const key = getTopicSystemPromptStorageKey(topicId);
  const stored = localStorage.getItem(key);
  if (stored !== null) return stored.trim();
  return '';
}

export function saveTopicSystemPrompt(text, topicId) {
  const key = getTopicSystemPromptStorageKey(topicId);
  if (text && text.trim()) {
    localStorage.setItem(key, text.trim());
  } else {
    localStorage.removeItem(key);
  }
}

export function resetTopicSystemPrompt(topicId) {
  const key = getTopicSystemPromptStorageKey(topicId);
  localStorage.removeItem(key);
}

export function getResolvedSystemMessage(topicId = null) {
  // If a topic ID is provided and a topic-specific system prompt exists, use it.
  // Otherwise fall back to the global custom/system prompt.
  if (topicId) {
    const topicSpecific = getTopicSystemPromptTemplate(topicId);
    if (topicSpecific) return topicSpecific;
  }
  const custom = (typeof localStorage !== 'undefined')
    ? (localStorage.getItem('strong_custom_system_prompt') || '')
    : '';
  if (custom && custom.trim()) return custom.trim();
  return tp('aiPrompts.core.system', core.SYSTEM_MESSAGE);
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
