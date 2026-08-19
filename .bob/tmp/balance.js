const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');

// Find .content div and balance its divs by removing excess </div> tags
const contentOpen = h.indexOf('<div class="content">');
const scriptOpen  = h.indexOf('\n<script src=');

let article = h.substring(contentOpen + '<div class="content">'.length, scriptOpen - 7); // -7 for \n</div>\n

// Count and fix imbalance
const opens  = (article.match(/<div/g)||[]).length;
const closes = (article.match(/<\/div>/g)||[]).length;
const excess = closes - opens;
console.log('Opens:', opens, 'Closes:', closes, 'Excess closes:', excess);

if (excess > 0) {
  // Remove `excess` </div> tags - pick the ones that appear as orphans
  // Strategy: walk and remove any </div> that would bring depth below 0
  let depth = 0, result = '', i = 0, removed = 0;
  while (i < article.length) {
    if (article.substring(i,i+4) === '<div') {
      depth++;
      result += '<div';
      i += 4;
    } else if (article.substring(i,i+6) === '</div>') {
      if (depth > 0) {
        depth--;
        result += '</div>';
      } else {
        removed++; // skip this stray close
      }
      i += 6;
    } else {
      result += article[i];
      i++;
    }
  }
  console.log('Removed', removed, 'stray </div> tags');
  article = result;
}

// Rebuild file
const before = h.substring(0, contentOpen + '<div class="content">'.length);
const after  = h.substring(scriptOpen - 7); // includes \n</div>\n<script...
h = before + '\n' + article + '\n' + after;

fs.writeFileSync('content/ch12.html', h);
console.log('Written:', Math.round(h.length/1024), 'KB');

// Verify
const a2 = (article.match(/<div/g)||[]).length;
const c2 = (article.match(/<\/div>/g)||[]).length;
console.log('Final balance:', a2, 'open,', c2, 'close →', a2===c2?'BALANCED ✓':'UNBALANCED delta='+(a2-c2));
