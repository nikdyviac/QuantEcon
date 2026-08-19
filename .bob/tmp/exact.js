const fs = require('fs');
const h = fs.readFileSync('content/ch12.html', 'utf8');
const contentOpen = h.indexOf('<div class="content">');

// Walk to find where .content closes
let depth = 0, i = contentOpen, closeAt = -1;
while (i < h.length) {
  if (h.substring(i,i+4) === '<div') { depth++; i+=4; continue; }
  if (h.substring(i,i+6) === '</div>') { depth--; if(depth===0){closeAt=i;break;} i+=6; continue; }
  i++;
}
// Show exact bytes around the close point
console.log('Closes at:', closeAt);
// Show with visible whitespace markers
const ctx = h.substring(closeAt-300, closeAt+30);
console.log(JSON.stringify(ctx));
