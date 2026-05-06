const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const regex = /\bPOUZITI\b/g;

let totalFound = 0;
function scan(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git' && file !== 'scripts') {
      scan(full);
    } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.json')) {
      const content = fs.readFileSync(full, 'utf8');
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNo = content.slice(0, match.index).split('\n').length;
        console.log(`${full}:${lineNo} -> ${content.slice(match.index - 20, match.index + 20).replace(/\n/g, ' ')}`);
        totalFound++;
      }
    }
  }
}
scan(root);
if (totalFound === 0) console.log('No uppercase POUZITI references found.');