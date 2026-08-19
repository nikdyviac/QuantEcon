const fs = require('fs');
const h = fs.readFileSync('content/ch12.html', 'utf8');

// Find the first live-cell end and what comes after
const lc = h.indexOf('class="live-cell"');
const afterCell = h.indexOf('</div>\n</div>', lc + 1000);
console.log('After first cell block:');
console.log(h.substring(afterCell, afterCell + 400));

// Check if there's a </section> closing before content div
const sec = h.indexOf('</section>', lc);
console.log('\n</section> after first cell at char', sec);
console.log(h.substring(sec - 30, sec + 100));

// Check the MJX inline math containers - they have inline styles
const mjx = h.indexOf('mjx-container');
console.log('\nFirst mjx-container:');
console.log(h.substring(mjx - 20, mjx + 150));
