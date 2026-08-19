const fs = require('fs');
const h = fs.readFileSync('content/ch12.html', 'utf8');

// Check: is cm-host inside cell-body alongside the textarea?
const i = h.indexOf('id="wrap0"');
console.log('Cell 0 structure:');
console.log(h.substring(i, i+500));
