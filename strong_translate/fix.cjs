const fs = require('fs');
let d = fs.readFileSync('js/translation/topicRepair.js', 'utf8');
const search = "} = deps;\r\nfunction getTopicSourceTextForPreview(key, topicId) {";
const replace = "} = deps;\r\n\r\nconst FALLBACK_TOPIC_ORDER = ['definice', 'vyznam', 'kjv', 'pouziti', 'puvod', 'specialista'];\r\n\r\nfunction getFailedTopicsForFallbackFn(translationEntry) {\r\n  const t = translationEntry || {};\r\n  const failed = [];\r\n  for (const topicId of FALLBACK_TOPIC_ORDER) {\r\n    const val = String(t[topicId] || '').trim();\r\n    if (!hasMeaningfulValue(val)) {\r\n      failed.push(topicId);\r\n      continue;\r\n    }\r\n    if (topicId === 'definice' && isDefinitionLowQuality(val)) {\r\n      failed.push(topicId);\r\n    }\r\n  }\r\n  return failed;\r\n}\r\n\r\nfunction getTopicSourceTextForPreview(key, topicId) {";
let d2 = d.replace(search, replace);
fs.writeFileSync('js/translation/topicRepair.js', d2, 'utf8');
console.log('OK - replaced');
