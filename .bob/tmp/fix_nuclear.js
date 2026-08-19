const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');

// Find .content open and scripts start
const contentOpen = h.indexOf('<div class="content">');
const scriptsAt = h.indexOf('\r\n<link rel="stylesheet" href="https://cdnjs');

// Extract the article chunk
const articleChunk = h.substring(contentOpen + '<div class="content">'.length, scriptsAt);

// Strip ALL <section...> and </section> tags - they're the source of div-depth confusion
// (sections are semantic only, we don't need them for layout)
let cleanArticle = articleChunk
  .replace(/<section[^>]*>/g, '')
  .replace(/<\/section>/g, '');

// Also strip the extra </div>\n</div> pattern that comes after each live-cell
// Each live-cell ends: </div> (cell-out) </div> (cell-body) </div> (live-cell)
// But the build script added one extra </div> from Sphinx's wrapper
// Pattern: after the live-cell's </div>, there's one more stray </div>
cleanArticle = cleanArticle.replace(/<\/div>\r\n<\/div>\r\n(<(?!\/div))/g, '</div>\r\n$1');

// Build the fixed file
const before = h.substring(0, contentOpen);
const after = h.substring(scriptsAt);
const fixed = before + '<div class="content">\n' + cleanArticle + '\n</div>\n' + after;

fs.writeFileSync('content/ch12.html', fixed, 'utf8');
console.log('Written:', Math.round(fixed.length/1024), 'KB');

// Verify
let h2 = fixed;
const co = h2.indexOf('<div class="content">');
let depth = 0, i = co, closeAt = -1;
while (i < h2.length) {
  if (h2.substring(i,i+4) === '<div') { depth++; i+=4; continue; }
  if (h2.substring(i,i+6) === '</div>') { depth--; if(depth===0){closeAt=i;break;} i+=6; continue; }
  i++;
}
const sa = h2.indexOf('\r\n<link rel="stylesheet" href="https://cdnjs');
console.log('.content closes at:', closeAt, '| scripts at:', sa, '| match:', Math.abs(closeAt - sa) < 20);
console.log('Context:', JSON.stringify(h2.substring(closeAt-20, closeAt+30)));
