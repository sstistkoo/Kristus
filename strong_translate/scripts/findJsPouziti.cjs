const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'js');
const regex = /\bpouziti\b/g;

let found = 0;
function scan(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scan(full);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNo = content.slice(0, match.index).split('\n').length;
        console.log(`${full.replace(/^.*[\\/]/, '')}:${lineNo} -> ${content.slice(match.index-20, match.index+20).replace(/\n/g,' ')}`);
        found++;
      }
    }
  }
}
scan(root);
if (found === 0) console.log('No lowercase pouziti in js/ (excluding tests)');