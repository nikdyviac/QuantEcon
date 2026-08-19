const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');
const co = h.indexOf('<div class="content">');

// Walk div depth to find ALL depth-0 exits
let depth = 0, i = co;
const bodyClose = h.indexOf('</body>');
const closes = [];
while (i < bodyClose) {
  if (h.substring(i,i+4) === '<div') { depth++; i+=4; continue; }
  if (h.substring(i,i+6) === '</div>') {
    depth--;
    if (depth === 0) closes.push({pos: i, ctx: h.substring(i-30,i+30)});
    i+=6; continue;
  }
  i++;
}
console.log('Number of depth-0 exits:', closes.length);
closes.forEach((c,idx) => console.log(`  [${idx}] pos=${c.pos}:`, JSON.stringify(c.ctx)));
console.log('Body close at:', bodyClose, '| Total length:', h.length);
