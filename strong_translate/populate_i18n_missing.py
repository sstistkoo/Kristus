import json, os, glob

i18n_dir = "i18n"
base_file = os.path.join(i18n_dir, "en.json")
with open(base_file, "r", encoding="utf-8") as f:
    base = json.load(f)

keys_to_add = ["confirm.clearTranslations", "toast.translationsCleared"]
updated_count = 0

for lang_file in glob.glob(os.path.join(i18n_dir, "*.json")):
    filename = os.path.basename(lang_file)
    if filename in ("en.json", "cs.json"):
        continue  # už máme
    with open(lang_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    changed = False
    for key in keys_to_add:
        if key not in data:
            data[key] = base[key]  # fallback z en
            changed = True
    if changed:
        with open(lang_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        print(f"Updated {filename}")
        updated_count += 1

print(f"Done – updated {updated_count} language files")
