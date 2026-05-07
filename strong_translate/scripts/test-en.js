import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'i18n', 'en.json');
let content = fs.readFileSync(file, 'utf8');
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
try {
  const data = JSON.parse(content);
  console.log('en.json parsed OK, keys:', Object.keys(data).length);
} catch (e) {
  console.error('Parse error:', e.message);
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1], 10);
    const lines = content.slice(0, pos).split('\n');
    console.log('Line:', lines.length, 'col?');
    console.log('Context:', content.slice(Math.max(0, pos-50), pos+50));
  }
}
