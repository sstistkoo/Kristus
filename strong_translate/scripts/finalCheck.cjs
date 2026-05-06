const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const regex = /\bpouziti\b/gi; // case-insensitive

let total = 0;
function scan(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git' || file === 'scripts') continue;
      scan(full);
    } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.json')) {
      // skip our scanning scripts
      if (file.endsWith('findPouziti.cjs') || file.endsWith('findUppercasePouziti.cjs') || file.endsWith('findJsPouziti.cjs') || file.endsWith('findTestPouziti.cjs') || file.endsWith('findTestPouzitiUpper.cjs')) continue;
      const content = fs.readFileSync(full, 'utf8');
      let match;
      while ((match = regex.exec(content)) !== null) {
        // Skip comments? We'll just report.
        const lineNo = content.slice(0, match.index).split('\n').length;
        console.log(`${full.replace(/^.*[\\/]/, '')}:${lineNo} -> ${content.slice(match.index-20, match.index+20).replace(/\n/g,' ')}`);
        total++;
      }
    }
  }
}
scan(root);
if (total === 0) console.log('No references to pouziti/POUZITI found in source.');