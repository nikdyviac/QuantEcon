const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');

// The .content div closes prematurely after every live-cell because
// the build regex left an extra </div> after each cell block.
// Pattern: each cell ends with </div>\n</div>\n</div> but the last </div>
// is a stray Sphinx wrapper close that closes .content.

// Strategy: 
// 1. Find where .content opens
// 2. Find where </body> starts  
// 3. Move everything between the premature </div> and </body> inside .content

const contentOpen = h.indexOf('<div class="content">');

// Find all stray </div> closures by looking for the pattern:
// </div>\n</div>\n\n<p>  -- this is cell </div> + stray </div> + next paragraph
// Replace with just </div>\n\n<p>
let fixCount = 0;
// Pattern after a live-cell: the cell ends with:
//   </div>    <- cell-out
//   </div>    <- cell-body  
//   </div>    <- live-cell wrapper
//   </div>    <- STRAY - this is leftover from Sphinx's cell docutils container
//   <p> or <section> or <div class="live-cell"> etc

h = h.replace(/(<\/div>\n<\/div>\n)<\/div>\n(<(?:p|section|h[1-6]|div class="live-cell"|ul|ol|div class="admonition|div class="exercise|div class="math))/g, (m, cellClose, next) => {
  fixCount++;
  return cellClose + next;
});

console.log('Fixed stray </div> count:', fixCount);

// Also fix the mjx-container display issue - they were hidden because we set display:inline
// which conflicted. Remove the bad override and replace with something safe.
h = h.replace(
  'mjx-container{max-width:100%;overflow-x:auto;position:static !important;display:inline !important;}',
  'mjx-container{max-width:100%;overflow-x:auto;}'
);
h = h.replace(
  '.math mjx-container{display:block !important;overflow-x:auto;}',
  '.math mjx-container{display:block;overflow-x:auto;}'
);

fs.writeFileSync('content/ch12.html', h);
console.log('done, size:', Math.round(h.length/1024), 'KB');

// Verify: where does .content close now?
let depth = 0;
let i = contentOpen;
while (i < h.length) {
  if (h.substring(i, i+4) === '<div') { depth++; i+=4; continue; }
  if (h.substring(i, i+6) === '</div>') {
    depth--;
    if (depth === 0) { console.log('.content now closes at char:', i); break; }
    i+=6; continue;
  }
  i++;
}
console.log('Total file length:', h.length);
