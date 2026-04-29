import json
import xml.etree.ElementTree as ET
import re
from collections import defaultdict


def clean_html(text):
    if not text:
        return ""
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<b>", "", text)
    text = re.sub(r"</b>", "", text)
    text = re.sub(r"<i>", "", text)
    text = re.sub(r"</i>", "", text)
    text = re.sub(r"<ref=[^>]*>([^<]*)</ref>", r"[\1]", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = " ".join(text.split())
    return text


def sort_strongs_keys(keys, prefix):
    def key_func(k):
        num_str = k.replace(prefix, "")
        m = re.match(r"^(\d+)([a-zA-Z]*)$", num_str)
        if m:
            return (int(m.group(1)), m.group(2) or "")
        return (0, "")

    return sorted(keys, key=key_func)


# Load data
with open("stepbible_data/data/stepbible-tbesg.json", "r", encoding="utf-8") as f:
    step_greek = json.load(f)
with open("stepbible_data/data/stepbible-tbesh.json", "r", encoding="utf-8") as f:
    step_heb_raw = json.load(f)
with open("strongsgreek.json", "r", encoding="utf-8") as f:
    our_greek = json.load(f)
with open("stronghebrew.json", "r", encoding="utf-8") as f:
    our_heb = json.load(f)
with open("strong_bible_cz.json", "r", encoding="utf-8") as f:
    cz_data = json.load(f)

# Parse Greek XML for BETA
tree_g = ET.parse("strongsgreek.xml")
root_g = tree_g.getroot()
beta_codes = {}
for entry_xml in root_g.findall(".//entry", {}):
    strongs_attr = entry_xml.get("strongs", "")
    if strongs_attr:
        key = str(int(strongs_attr)).zfill(4)
        greek_elem = entry_xml.find("greek")
        if greek_elem is not None:
            beta_val = greek_elem.get("BETA", "")
            if beta_val:
                beta_codes[key] = beta_val

# Parse Hebrew XML for TWOT + notes
tree_h = ET.parse("StrongHebrewG.xml")
root_h = tree_h.getroot()
ns = {"osis": "http://www.bibletechnologies.net/2003/OSIS/namespace"}
xml_extra = {}
for entry_xml in root_h.findall('.//osis:div[@type="entry"]', ns):
    w_elem = entry_xml.find(".//osis:w[@ID]", ns)
    if w_elem is None:
        continue
    hebrew_id = w_elem.get("ID", "")
    if not hebrew_id:
        continue
    gloss = w_elem.get("gloss", "")
    note_elems = entry_xml.findall(".//osis:note", ns)
    xml_notes = {}
    for note in note_elems:
        ntype = note.get("type", "")
        if ntype in ("exegesis", "translation", "explanation", "x-typo", "x-corr"):
            parts = []
            if note.text:
                parts.append(note.text)
            for child in note:
                if child.text:
                    parts.append(child.text)
                if child.tail:
                    parts.append(child.tail)
            text = "".join(parts).strip()
            if text:
                xml_notes[ntype] = text
    if gloss or xml_notes:
        xml_extra[hebrew_id] = {"gloss": gloss.strip(), "notes": xml_notes}

# ============================================================
# PRE-PROCESS HEBREW: merge suffix entries into base
# ============================================================
print("Merging Hebrew entries...")
heb_by_base = defaultdict(list)  # base_num_str -> list of (full_key, entry)
for full_key, entry in step_heb_raw.items():
    # H0122a -> base "122", suffix "a"
    m = re.match(r"^H0*(\d+)([a-zA-Z]*)$", full_key)
    if not m:
        continue
    base_num = m.group(1)
    suffix = m.group(2)
    heb_by_base[base_num].append((full_key, entry, suffix))

print(f"  Base Hebrew numbers (without suffix): {len(heb_by_base)}")
print(f"  Total STEPBible Hebrew entries: {sum(len(v) for v in heb_by_base.values())}")

# ============================================================
# OUTPUT
# ============================================================
output_lines = []

# ============================================================
# GREEK
# ============================================================
print("Processing Greek...")
g_count = 0
for step_key in sort_strongs_keys(step_greek.keys(), "G"):
    entry = step_greek[step_key]
    num = step_key.replace("G", "").lstrip("0") or "0"

    # Header
    lemma_full = entry.get("lemma", "")
    greek_word = (
        lemma_full.split(",")[0].strip() if "," in lemma_full else lemma_full.strip()
    )
    output_lines.append(f"G{num} | {greek_word}")

    # BETA
    beta = beta_codes.get(num.zfill(4), "")
    if beta:
        output_lines.append(f"BETA: {beta}")

    # Transliteration
    translit = entry.get("transliteration", "")
    if translit:
        output_lines.append(f"Transliteration: {translit}")

    # Morphology
    morph = entry.get("morphology", "")
    if morph:
        output_lines.append(f"Morphology: {morph}")

    # Definition (rich, cleaned)
    definition_raw = entry.get("definition", "")
    definition_clean = clean_html(definition_raw)
    if definition_clean:
        lines = definition_clean.split("\n")
        main_def = lines[0].strip()
        if main_def:
            output_lines.append(f"Definice: {main_def}")
        # Additional numbered meanings (if they are separate)
        for line in lines[1:]:
            line = line.strip()
            if line:
                output_lines.append(f"Význam: {line}")
    else:
        # Fallback
        fallback = (
            our_greek["entries"].get(num.zfill(4), {})
            or our_greek["entries"].get(num, {})
        ).get("definition", "")
        if fallback:
            output_lines.append(f"Definice: {fallback}")

    # Gloss (short KJV-like)
    gloss = entry.get("gloss", "")
    if gloss and gloss.lower() != greek_word.lower():
        output_lines.append(f"KJV Významy: {gloss}")

    # See Also (from our JSON)
    our_entry = our_greek["entries"].get(num.zfill(4), {}) or our_greek["entries"].get(
        num, {}
    )
    see_array = our_entry.get("see") or []
    if see_array:
        refs = []
        for ref in see_array:
            lang = ref.get("language", "")
            s = ref.get("strongs", "")
            if lang and s:
                prefix = "G" if lang == "GREEK" else "H"
                # Fix: for Hebrew in Greek see, use H with zero-padding stripped
                if lang == "HEBREW":
                    s = str(int(s))  # "0175" -> "175"
                refs.append(f"{prefix}{s}")
        if refs:
            output_lines.append(f"Viz také: {', '.join(refs)}")

    # Czech
    cz_entry = cz_data.get("entries", {}).get(f"G{num}", {})
    cz_text = cz_entry.get("definitions_cz", "")
    if cz_text:
        output_lines.append(f"Česky: {' '.join(cz_text.split())}")

    output_lines.append("")
    g_count += 1

print(f"  Greek entries written: {g_count}")

# ============================================================
# HEBREW
# ============================================================
print("Processing Hebrew (merged)...")
h_count = 0
for base_num in sorted(heb_by_base.keys(), key=int):
    # All suffix variants for this base
    variants = heb_by_base[base_num]

    # Determine the "main" entry: look for suffix "" (exact match) first
    main_entry = None
    main_suffix = ""
    for full_key, entry, suffix in variants:
        if suffix == "":
            main_entry = entry
            main_suffix = suffix
            break
    # If no exact, take first
    if main_entry is None:
        main_entry = variants[0][1]
        main_suffix = variants[0][2]

    hebrew_id = f"H{base_num}"

    # Header: use lemma from main variant (fallback to first)
    lemma = main_entry.get("lemma", "")
    if not lemma:
        lemma = variants[0][1].get("lemma", "")
    output_lines.append(f"{hebrew_id} | {lemma}")

    # Transliteration (from main)
    translit = main_entry.get("transliteration", "")
    if translit:
        output_lines.append(f"Transliteration: {translit}")

    # Morphology (from main)
    morph = main_entry.get("morphology", "")
    if morph:
        output_lines.append(f"Morphology: {morph}")

    # Combine definitions from ALL variants
    all_defs = []
    for _, entry_var, suffix in variants:
        raw_def = entry_var.get("definition", "")
        clean_def = clean_html(raw_def)
        if clean_def:
            all_defs.append(clean_def)

    if all_defs:
        # If multiple variants, separate them clearly
        if len(all_defs) == 1:
            def_text = all_defs[0]
        else:
            # Join with double newline to separate senses
            def_text = "\n\n".join(all_defs)
        # Split into lines
        lines = def_text.split("\n")
        # First line is main gloss
        main_line = lines[0].strip()
        if main_line:
            output_lines.append(f"Definice: {main_line}")
        # Rest as Význam (numbered senses)
        remaining = []
        for line in lines[1:]:
            line = line.strip()
            if line:
                remaining.append(line)
        if remaining:
            output_lines.append(f"Význam:\n  {'\n  '.join(remaining)}")

    # Gloss (short)
    gloss = main_entry.get("gloss", "")
    if gloss and gloss != lemma:
        output_lines.append(f"KJV Významy: {gloss}")

    # TWOT from XML
    extra = xml_extra.get(hebrew_id, {})
    twot = extra.get("gloss", "")
    if twot:
        output_lines.append(f"TWOT: {twot}")

    # Notes from JSON+XML
    notes = {}
    json_notes = our_heb["entries"].get(base_num, {}).get("notes") or {}
    if json_notes:
        notes.update(json_notes)
    xml_notes = extra.get("notes", {})
    if xml_notes:
        notes.update(xml_notes)
    if notes:
        parts = []
        if "translation" in notes:
            t = " ".join(str(notes["translation"]).split())
            if t:
                parts.append(f"Překlad: {t}")
        if "exegesis" in notes:
            e = " ".join(str(notes["exegesis"]).split())
            if e:
                parts.append(f"Etymol: {e}")
        if "explanation" in notes:
            x = " ".join(str(notes["explanation"]).split())
            if x:
                parts.append(f"Vysvětlení: {x}")
        if parts:
            output_lines.append(f"Poznámky:\n  {'\n  '.join(parts)}")

    # Greek refs from our JSON
    greek_refs = our_heb["entries"].get(base_num, {}).get("greek_refs") or []
    if greek_refs:
        cleaned = [r.replace(":", "").strip() for r in greek_refs if r]
        if cleaned:
            output_lines.append(f"Řecké refs: {', '.join(cleaned)}")

    # Czech
    cz_entry = cz_data.get("entries", {}).get(hebrew_id, {})
    cz_text = cz_entry.get("definitions_cz", "")
    if cz_text:
        output_lines.append(f"Česky: {' '.join(cz_text.split())}")

    output_lines.append("")
    h_count += 1

print(f"  Hebrew entries written: {h_count}")

# Write
with open("strong_updated_detailed_cs.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output_lines))

print(f"\nGenerated strong_updated_detailed_cs.txt")
print(f"  Total lines: {len(output_lines)}")
import re

g_cnt = sum(1 for l in output_lines if re.match(r"^G\d+", l))
h_cnt = sum(1 for l in output_lines if re.match(r"^H\d+", l))
print(f"  Greek entries: {g_cnt}")
print(f"  Hebrew entries: {h_cnt}")
print(f"  Total entries: {g_cnt + h_cnt}")
