import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'i18n', 'en.json');
let content = fs.readFileSync(file, 'utf8');
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
console.log('File length:', content.length);

try {
  JSON.parse(content);
  console.log('JSON is valid');
} catch (e) {
  console.log('Error:', e.message);
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1], 10);
    console.log('Error at index:', pos);
    // Find line number
    const lines = content.slice(0, pos).split('\n');
    console.log('Line number:', lines.length);
    console.log('Line content:', lines[lines.length-1]);
    console.log('--- context ---');
    console.log(content.slice(Math.max(0, pos-100), Math.min(content.length, pos+100)));
  }
}
