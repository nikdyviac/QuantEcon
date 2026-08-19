const fs = require('fs');
const src = fs.readFileSync('content/cons_smooth.html', 'utf8');

// Test the regex on the source
let count = 0;
const re = /<div class="cell docutils container">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>(\s*<div class="cell_output[\s\S]*?<\/div>\s*<\/div>\s*)?<\/div>/g;
let m;
while((m = re.exec(src)) !== null) {
  const codeMatch = m[0].match(/<pre id="codecell(\d+)">/);
  const id = codeMatch ? codeMatch[1] : '?';
  console.log('Matched cell', id, 'at pos', m.index, 'length', m[0].length);
  count++;
}
console.log('Total matched:', count);

// Also count how many codecell IDs exist in total
const allCells = src.match(/<pre id="codecell\d+"/g) || [];
console.log('Total codecell pre tags:', allCells.length);
