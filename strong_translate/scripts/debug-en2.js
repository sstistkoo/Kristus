import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'i18n', 'en.json');
const content = fs.readFileSync(file, 'utf8');
console.log('File length:', content.length);

try {
  JSON.parse(content);
  console.log('JSON is valid');
} catch (e) {
  console.log('Error message:', e.message);
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1], 10);
    console.log('Error at position:', pos);
    console.log('Context (before):', content.slice(Math.max(0, pos-100), pos));
    console.log('Context (after):', content.slice(pos, Math.min(content.length, pos+100)));
  }
}
