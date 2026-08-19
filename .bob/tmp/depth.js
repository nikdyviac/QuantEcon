const fs = require('fs');
const h = fs.readFileSync('content/ch12.html', 'utf8');

const contentStart = h.indexOf('<div class="content">');

// Walk character by character tracking div depth to find where .content closes
let depth = 0;
let i = contentStart;
let closeAt = -1;
while (i < h.length) {
  if (h.substring(i, i+4) === '<div') { depth++; i+=4; continue; }
  if (h.substring(i, i+6) === '</div>') {
    depth--;
    if (depth === 0) { closeAt = i; break; }
    i+=6; continue;
  }
  i++;
}

console.log('.content closes at char:', closeAt);
console.log('Context around close:');
console.log(h.substring(closeAt - 200, closeAt + 50));

// Now check what comes right after
console.log('\nWhat comes after .content closes:');
console.log(h.substring(closeAt + 6, closeAt + 500));
