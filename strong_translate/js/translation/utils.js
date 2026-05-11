// js/translation/utils.js — pomocné funkce pro překlad
// Importováno přímo v batch.js, detail.js, list.js, header.js
import { state } from '../state.js';
import core from '../../strong_translator_core_new.js';

const { parseTranslations: parseTranslationsCore } = core;

// Lokální kopie pro getTranslationStateForKey (vyhýbá se circular dep s batch.js)
const _FALLBACK_TOPIC_ORDER = ['definice', 'vyznam', 'kjv', 'puvod', 'specialista'];

function isTopicManuallyApproved(key, topicId) {
  return state.topicRepairManuallyApproved?.has(`${key}:${topicId}`) || false;
}

function _countFailedTopics(translationEntry, key) {
  const e = translationEntry || {};
  let count = 0;
  for (const topicId of _FALLBACK_TOPIC_ORDER) {
    if (isTopicManuallyApproved(key, topicId)) continue;
    const val = String(e[topicId] || '').trim();
    if (!hasMeaningfulValue(val)) { count++; continue; }
    if (topicId === 'definice' && isDefinitionLowQuality(val)) count++;
  }
  return count;
}

export function hasMeaningfulValue(v) {
  const s = String(v || '').trim();
  return !!s && s !== '—' && s !== '(přeskočeno)';
}

/** Anglická část za „Originál:“ nesmí označit celou definici jako EN (běžné u CZ+AS dvojice). */
export function stripDefinitionOriginReferenceTail(text) {
  const s = String(text || '');
  const m = s.match(/\bOriginál\s*:/iu);
  if (!m || m.index === undefined || m.index <= 0) return s.trim();
  return s.slice(0, m.index).trim();
}

export function isDefinitionLikelyEnglish(text) {
  const s = stripDefinitionOriginReferenceTail(String(text || '').trim());
  if (!s) return false;
  const markers = [
    // Původní
    /\bwithout\b/i,
    /\bwith\b/i,
    /\bnot\b/i,
    /\bgood(?:ness)?\b/i,
    /\bto do\b/i,
    /\bjoy\b/i,
    /\bfrom\b/i,
    /\bmetaphor(?:ically)?\b/i,
    /\bsee word\b/i,
    /\bweight\b/i,

    // Rozšíření – základní anglické slova časté ve scholarly definicích
    /\bwhich\b/i,
    /\bsee\b/i,
    /\bthe\b/i,
    /\band\b/i,
    /\bor\b/i,
    /\bthat\b/i,
    /\bthose\b/i,
    /\bthese\b/i,
    /\balso\b/i,
    /\bfiguratively\b/i,
    /\bespecially\b/i,

    // Členy a一楼
    /\ba\b/i,
    /\ban\b/i,

    // Běžné anglické slovesa/přídavná jména ve významových definicích
    /\bis\b/i,
    /\bare\b/i,
    /\bwas\b/i,
    /\bwere\b/i,
    /\bbe\b/i,
    /\bbeen\b/i,
    /\bbeing\b/i,
    /\bhave\b/i,
    /\bhas\b/i,
    /\bhad\b/i,
    /\bdo\b/i,
    /\bdoes\b/i,
    /\bdid\b/i,
    /\bwill\b/i,
    /\bwould\b/i,
    /\bshall\b/i,
    /\bshould\b/i,
    /\bmay\b/i,
    /\bmight\b/i,
    /\bmust\b/i,
    /\bcan\b/i,
    /\bcould\b/i,

    // Zájmena
    /\bit\b/i,
    /\bits\b/i,
    /\bhe\b/i,
    /\bhim\b/i,
    /\bhis\b/i,
    /\bshe\b/i,
    /\bher\b/i,
    /\bthey\b/i,
    /\bthem\b/i,
    /\btheir\b/i,

    // Předpony ( detectable independently)
    /\bun\w+\b/i,
    /\bim\b/i,
    /\bil\b/i,
    /\bir\b/i,

    // Ostatní časté
    /\bas\b/i,
    /\bso\b/i,
    /\bbut\b/i,
    /\bif\b/i,
    /\bthen\b/i,
    /\bbecause\b/i,
    /\btherefore\b/i,
    /\bthus\b/i,
    /\bhence\b/i,
    /\bindeed\b/i,
    /\bof\b/i,
    /\bin\b/i,
    /\bon\b/i,
    /\bat\b/i,
    /\bby\b/i,
    /\bfor\b/i,
    /\bto\b/i,
    /\bwith\b/i, // already present
    /\bfrom\b/i  // already present
  ];
  return markers.some(re => re.test(s));
}

export function isDefinitionLowQuality(text) {
  const s = String(text || '').trim();
  if (!s) return true;
  if (isDefinitionLikelyEnglish(s)) return true;
  // UI artefakty nebo technický šum místo definice.
  if (/(🤖|✎|prompt|upravit|edit|button|klik)/i.test(s)) return true;
  // Definice má být věcná; krátké, ale smysluplné formulace nechceme trestat.
  const words = s.split(/\s+/).filter(Boolean);
  const hasStructure = /[,:;()]/.test(s);
  const hasCzechDiacritics = /[áčďéěíňóřšťúůýž]/i.test(s);
  // Povolit 1–2 slova, pokud obsahují českou diakritiku (jako "dávka")
  if (words.length <= 2 && hasCzechDiacritics) return false;
  if (words.length < 4) return true;
  if (s.length < 30 && !hasStructure) return true;
  if (words.length < 6 && s.length < 45 && !hasStructure && !hasCzechDiacritics) return true;
  return false;
}

export function isTranslationComplete(t, key) {
  if (!t || t.skipped) return false;
  const required = ['definice', 'puvod', 'kjv', 'specialista'];
  for (const field of required) {
    if (isTopicManuallyApproved(key, field)) continue;
    const val = String(t[field] || '').trim();
    if (!hasMeaningfulValue(val)) return false;
    if (field === 'definice' && isDefinitionLowQuality(val)) return false;
  }
  return true;
}

export function hasAnyTranslationContent(t) {
  if (!t || t.skipped) return false;
  const fields = ['vyznam', 'definice', 'puvod', 'kjv', 'specialista'];
  return fields.some(field => hasMeaningfulValue(t[field]));
}

export function getTranslationStateForKey(key) {
  const t = state.translated[key];
  if (!t || t.skipped) return 'pending';
  if (isTranslationComplete(t, key)) return 'done';
  if (!hasAnyTranslationContent(t)) return 'failed';
  const failedCount = _countFailedTopics(t, key);
  if (failedCount > 0 && failedCount <= 2) return 'missing_topic';
  return 'failed_partial';
}

export function fillMissingVyznamFromSource(keys) {
  if (!Array.isArray(keys)) return;
  for (const key of keys) {
    const t = state.translated[key];
    if (!t || hasMeaningfulValue(t.vyznam)) continue;
    const e = state.entryMap.get(key);
    const fallback = String(e?.vyznamCz || e?.cz || '').trim();
    if (fallback) {
      t.vyznam = fallback;
    }
  }
}

export function fillMissingKjvFromSource(keys) {
  if (!Array.isArray(keys)) return;
  for (const key of keys) {
    const t = state.translated[key];
    if (!t || hasMeaningfulValue(t.kjv)) continue;
    const e = state.entryMap.get(key);
    const fallback = String(e?.kjv || '').trim();
    if (fallback) {
      t.kjv = `${fallback} [POZN.: v angličtině ze vstupu]`;
    }
  }
}

export function annotateEnglishDefinitionsInTranslated(keys) {
  if (!Array.isArray(keys)) return;
  for (const key of keys) {
    const t = state.translated[key];
    if (!t) continue;
    if (!isDefinitionLikelyEnglish(t.definice)) continue;
    const original = String(t.definice || '').trim();
    if (!original) continue;
    if (/\[POZN\.: text je v angličtině - špatný překlad\]/.test(original)) continue;
    t.definice = `${original} [POZN.: text je v angličtině - špatný překlad]`;
  }
}

export function applyFallbacksToParsedMap(keys, parsedMap) {
  if (!Array.isArray(keys) || !parsedMap || typeof parsedMap !== 'object') return;
  for (const key of keys) {
    const t = parsedMap[key];
    if (!t) continue;
    const e = state.entryMap.get(key);
    if (!hasMeaningfulValue(t.vyznam)) {
      const vyznamFallback = String(e?.vyznamCz || e?.cz || '').trim();
      if (vyznamFallback) t.vyznam = vyznamFallback;
    }
    if (!hasMeaningfulValue(t.kjv)) {
      const kjvFallback = String(e?.kjv || '').trim();
      if (kjvFallback) t.kjv = `${kjvFallback} [POZN.: v angličtině ze vstupu]`;
    }
    if (isDefinitionLikelyEnglish(t.definice)) {
      t.definice = `${String(t.definice || '').trim()} [POZN.: text je v angličtině - špatný překlad]`.trim();
    }
  }
}

export function tryNormalizeNumberedOpenRouterResponse(raw, keys) {
  const text = String(raw || '').trim();
  if (!text) return null;
  if (/###\s*[GH]?\d+\s*###/i.test(text)) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const headerLine = lines.find(l => /^(?:\d+\.)?\s*[GH]\d+\b/i.test(l));
  if (!headerLine) return null;
  const keyMatch = headerLine.match(/([GH]\d+)/i);
  if (!keyMatch) return null;
  const foundKey = keyMatch[1].toUpperCase();
  if (Array.isArray(keys) && keys.length && !keys.includes(foundKey)) return null;

  const defLine = lines.find(l => /^DEF\s*:/i.test(l) || /^\d+\.\s*.*\|.*$/i.test(l) || /^\d+\.\s*[^\n]+$/i.test(l));
  const specialistaTail = lines.slice(Math.max(0, lines.length - 6)).join(' ');
  const normalized = [
    `###${foundKey}###`,
    `VYZNAM:`,
    `DEFINICE: ${defLine ? defLine.replace(/^\d+\.\s*/, '').replace(/^DEF\s*:/i, '').trim() : text.slice(0, 600)}`,
    `PUVOD:`,
    `KJV:`,
    `SPECIALISTA: ${specialistaTail || ''}`
  ].join('\n');
  return normalized;
}

export function parseWithOpenRouterNormalization(raw, keys, targetObj) {
  const missingOriginal = parseTranslationsCore(raw, keys, targetObj);
  if (!Array.isArray(missingOriginal) || missingOriginal.length === 0) {
    return { missing: missingOriginal || [], normalizedUsed: false, normalizedText: '' };
  }
  const normalized = tryNormalizeNumberedOpenRouterResponse(raw, keys);
  if (!normalized) {
    return { missing: missingOriginal, normalizedUsed: false, normalizedText: '' };
  }
  const missingAfterNorm = parseTranslationsCore(normalized, keys, targetObj);
  return {
    missing: Array.isArray(missingAfterNorm) ? missingAfterNorm : missingOriginal,
    normalizedUsed: (missingAfterNorm || []).length < missingOriginal.length,
    normalizedText: normalized
  };
}

export function getStrongKeyNumber(key) {
  const normalized = String(key || '').trim();
  const match = normalized.match(/^(?:[GH])?(\d+)$/i);
  if (!match) return Number.POSITIVE_INFINITY;
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export function isTopicValueProblematic(key, topicId, value, translatedEntry) {
  // Ignoruj, pokud bylo téma manuálně schváleno (uživatel označil jako v pořádku)
  if (state.topicRepairManuallyApproved?.has(`${key}:${topicId}`)) return null;

  // 1. Chybí hodnotu úplně
  if (!hasMeaningfulValue(value)) return 'missing';

  // 2. Pro definici - kontrola kvality/přímého angličtiny
  if (topicId === 'definice') {
    if (isDefinitionLowQuality(value)) return 'quality';
    if (isDefinitionLikelyEnglish(value)) return 'quality';
  }

  // 3. Pro KJV - pokud je velmi krátké (1-2 slova) a neobsahuje českou diakritiku → pravděpodobně chybí/špatný
  if (topicId === 'kjv') {
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    if (words.length <= 2 && !/[áčďéěíňóřšťúůýž]/i.test(value)) return 'quality';
  }

  // 4. Pro původ - pokud je příliš krátký (bez diakritiky/slov) → podezřelé
  if (topicId === 'puvod') {
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    if (words.length <= 2 && !/[áčďéěíňóřšťúůýžäöüß]/i.test(value)) return 'quality';
  }

  // 5. Pro význam - pokud je 1-2 slova bez diakritiky
  if (topicId === 'vyznam') {
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    if (words.length <= 2 && !/[áčďéěíňóřšťúůýž]/i.test(value)) return 'quality';
  }

  // 6. Specialista - pokud je velmi krátký (< 20 znaků) → neodborný
  if (topicId === 'specialista') {
    const s = String(value).trim();
    if (s.length < 20) return 'quality';
  }

  return null;
}

export function getFailedTopicsForFallback(translationEntry) {
  const t = translationEntry || {};
  const failed = [];
  for (const topicId of _FALLBACK_TOPIC_ORDER) {
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

export function getMissingTopicsForRepair(translationEntry) {
  const allMissing = getFailedTopicsForFallback(translationEntry);
  return allMissing.slice(0, 2);
}
