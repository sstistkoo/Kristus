const SYSTEM_MESSAGE = `Jsi expert na biblistiku, koine řečtinu, hebrejštinu, aramejštinu a angličtinu. Tvým úkolem je vědecký překlad Strongova slovníku do češtiny.
 
FORMÁT ODPOVĚDI (Striktně dodržet):
###[číslo]###
V: [česky význam]
D: [věrný překlad EN definice do češtiny včetně závorek a značek]
P: [jazyk + původní písmo (český přepis v závorce) + etymologie]
K: [překlad hlavního KJV významu do češtiny]
S: [odborný český výklad 3-5 vět]
 
PRAVIDLA PRO ČEŠTINU A KVALITU:
 
PŘEPISY: U všech cizích slov (řečtina, hebrejština, aramejština) v poli P, D i S vždy doplň český fonetický přepis v závorce.
 
PŘEKLAD ODKAZŮ: Biblické zkratky v [ ] uvnitř pole D musí být v češtině (např. [Act] na [Sk], [Mat] na [Mt], [John] na [Jan]).
 
DŮSLEDNOST: Přelož vše z EN do CZ (včetně termínů jako properly, figuratively, lit., spec.).
 
NORMALIZACE: Nahraď __1. za 1. a __2. za 2.
 
K (KJV): Odvoď hlavní význam z kontextu a přelož jej do češtiny.
 
S (SPECIALISTA): [detailní odstavec 3-5 vět jako biblický specialista]. Odstavec má vysvětlit teologický a biblický význam slova v kontextu. Nepiš body ani seznam, jen souvislý odstavec.
 
OMEZENÍ:
 
Pole POUŽITÍ negeneruj (odkazy zůstávají v poli D, uživatel si je extrahuje sám).
 
Používej pouze jednopísmenné klíče (V, D, P, K, S) pro úsporu tokenů.`;

const DEFAULT_PROMPT = `Přelož následující hesla z angličtiny a originálních jazyků do češtiny podle pravidel. Doplňuj české přepisy v závorkách i v rámci překladu definice. Vrat pouze data bez komentářů.

HESLA:
{HESLA}`;

const CATEGORY_LABELS = {
   default: 'Default',
   detailed: 'Detailed',
   concise: 'Concise',
   literal: 'Literal',
   test: 'Test',
   library: 'Library',
   final: 'Final'
 };

const FINAL_PROMPT = {
  name: 'Final',
  desc: 'Complete translation with all fields',
  text: DEFAULT_PROMPT
};

const PROMPT_LIBRARY_BASE = {
      default: [{ name: 'System', desc: 'System default prompt', text: DEFAULT_PROMPT, system: '' }],
      detailed: [{ name: 'Detailed', desc: 'Detailed translation', text: DEFAULT_PROMPT, system: '' }],
      concise: [{ name: 'Concise', desc: 'Short translation', text: DEFAULT_PROMPT, system: '' }],
      literal: [{ name: 'Literal', desc: 'Literal translation', text: DEFAULT_PROMPT, system: '' }],
      sekundarni: [{ name: 'System', desc: 'System default prompt', text: DEFAULT_PROMPT, system: '' }],
      test: [],
      library: [
          { name: 'Precision', desc: 'High fidelity', text: DEFAULT_PROMPT, system: '' },
          { name: 'Theological', desc: 'Context emphasis', text: DEFAULT_PROMPT, system: '' },
          { name: 'Fast', desc: 'Short and fast', text: DEFAULT_PROMPT, system: '' }
      ]
 };

const MODEL_TEST_PROMPT_CATALOG = {
  preset_v1: { label: 'Fallback preset_v1', template: DEFAULT_PROMPT },
  preset_v2: { label: 'Fallback preset_v2', template: DEFAULT_PROMPT },
  preset_v3: { label: 'Fallback preset_v3', template: DEFAULT_PROMPT },
  preset_v4: { label: 'Fallback preset_v4', template: DEFAULT_PROMPT },
  preset_v5: { label: 'Fallback preset_v5', template: DEFAULT_PROMPT },
  preset_v6: { label: 'Fallback preset_v6', template: DEFAULT_PROMPT },
  preset_v7: { label: 'Fallback preset_v7', template: DEFAULT_PROMPT },
  preset_v8: { label: 'Fallback preset_v8', template: DEFAULT_PROMPT },
  preset_v9: { label: 'Fallback preset_v9', template: DEFAULT_PROMPT },
  preset_v10: { label: 'Fallback preset_v10', template: DEFAULT_PROMPT },
  preset_v11: { label: 'Fallback preset_v11', template: DEFAULT_PROMPT },
  preset_v12: { label: 'Fallback preset_v12', template: DEFAULT_PROMPT },
  preset_v13: { label: 'Fallback preset_v13', template: DEFAULT_PROMPT },
  preset_v14: { label: 'Fallback preset_v14', template: DEFAULT_PROMPT },
  preset_v15: { label: 'Fallback preset_v15', template: DEFAULT_PROMPT },
  preset_topic_definice: { label: 'Fallback preset_topic_definice', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_vyznam: { label: 'Fallback preset_topic_vyznam', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_kjv: { label: 'Fallback preset_topic_kjv', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_pouziti: { label: 'Fallback preset_topic_pouziti', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_puvod: { label: 'Fallback preset_topic_puvod', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_specialista: { label: 'Fallback preset_topic_specialista', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_definice_batch: { label: 'Fallback preset_topic_definice_batch', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_vyznam_batch: { label: 'Fallback preset_topic_vyznam_batch', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_kjv_batch: { label: 'Fallback preset_topic_kjv_batch', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_pouziti_batch: { label: 'Fallback preset_topic_pouziti_batch', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_puvod_batch: { label: 'Fallback preset_topic_puvod_batch', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_specialista_batch: { label: 'Fallback preset_topic_specialista_batch', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_vyznam_en: { label: 'Fallback preset_topic_vyznam_en', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_definice_en: { label: 'Fallback preset_topic_definice_en', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_kjv_en: { label: 'Fallback preset_topic_kjv_en', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_pouziti_en: { label: 'Fallback preset_topic_pouziti_en', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_puvod_en: { label: 'Fallback preset_topic_puvod_en', template: DEFAULT_PROMPT, topicLabel: 'Topic' },
  preset_topic_specialista_en: { label: 'Fallback preset_topic_specialista_en', template: DEFAULT_PROMPT, topicLabel: 'Topic' }
};

const strongPrompts = {
  SYSTEM_MESSAGE,
  DEFAULT_PROMPT,
  CATEGORY_LABELS,
  FINAL_PROMPT,
  PROMPT_LIBRARY_BASE,
  MODEL_TEST_PROMPT_CATALOG
};

export {
  SYSTEM_MESSAGE,
  DEFAULT_PROMPT,
  CATEGORY_LABELS,
  FINAL_PROMPT,
  PROMPT_LIBRARY_BASE,
  MODEL_TEST_PROMPT_CATALOG
};

export default strongPrompts;