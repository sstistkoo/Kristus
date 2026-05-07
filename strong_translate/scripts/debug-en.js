import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'i18n', 'en.json');
const content = fs.readFileSync(file, 'utf8');
const pos = 90177;
console.log('Char at pos:', JSON.stringify(content[pos]));
console.log('Context (-20/+40):', content.slice(pos - 20, pos + 40));
