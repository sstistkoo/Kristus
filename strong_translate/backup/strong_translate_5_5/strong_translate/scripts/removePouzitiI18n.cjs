const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, '..', 'i18n');
const keysToRemove = ['topic.label.pouziti', 'export.field.usage', 'field.usage'];

fs.readdirSync(i18nDir).forEach(file => {
  if (!file.endsWith('.json')) return;
  const full = path.join(i18nDir, file);
  let obj = JSON.parse(fs.readFileSync(full, 'utf8'));
  let changed = false;
  for (const k of keysToRemove) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      delete obj[k];
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(full, JSON.stringify(obj, null, 2), 'utf8');
    console.log('Updated', file);
  }
});
