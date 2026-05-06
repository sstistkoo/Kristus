const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'test');
const regex = /\bpouziti\b/g;

let found = 0;
for (const file of fs.readdirSync(root)) {
  if (!file.endsWith('.js')) continue;
  const full = path.join(root, file);
  const content = fs.readFileSync(full, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    const lineNo = content.slice(0, match.index).split('\n').length;
    console.log(`${file}:${lineNo} -> ${content.slice(match.index-20, match.index+20).replace(/\n/g,' ')}`);
    found++;
  }
}
if (found === 0) console.log('No pouziti in test files.');