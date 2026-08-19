const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');
const bodyClose = h.indexOf('</body>');
const co = h.indexOf('<div class="content">');

// Walk and collect ALL depth-0 exits - each one is a stray </div> that needs removing
let depth = 0, i = co;
const toRemove = []; // positions of stray </div> chars

while (i < bodyClose) {
  if (h.substring(i,i+4) === '<div') { depth++; i+=4; continue; }
  if (h.substring(i,i+6) === '</div>') {
    depth--;
    if (depth === 0) {
      // This is a stray close - mark it for removal (replace with nothing)
      toRemove.push(i);
      // Don't advance depth below 0 - treat as if depth stays at 0
      depth = 0;
    }
    i+=6; continue;
  }
  i++;
}

console.log('Stray </div> positions to remove:', toRemove.length);

// Remove them from right to left so positions stay valid
let result = h;
for (let j = toRemove.length - 1; j >= 0; j--) {
  const pos = toRemove[j];
  result = result.substring(0, pos) + result.substring(pos + 6);
}

// Now add the single correct closing </div> for .content right before the scripts
// Find scripts in the fixed file
const scriptsMarker = result.indexOf('\r\n<link rel="stylesheet"');
const scriptsMarker2 = result.indexOf('\n<link rel="stylesheet"');
const sm = Math.min(
  scriptsMarker > -1 ? scriptsMarker : Infinity,
  scriptsMarker2 > -1 ? scriptsMarker2 : Infinity
);
console.log('Scripts at:', sm, 'in result of length:', result.length);

// Insert </div> before scripts
result = result.substring(0, sm) + '\n</div>' + result.substring(sm);

fs.writeFileSync('content/ch12.html', result, 'utf8');
console.log('Written:', Math.round(result.length/1024), 'KB');

// Verify: should be exactly 1 depth-0 exit now
let h2 = result;
let depth2 = 0, i2 = h2.indexOf('<div class="content">');
const closes2 = [];
while (i2 < h2.indexOf('</body>')) {
  if (h2.substring(i2,i2+4) === '<div') { depth2++; i2+=4; continue; }
  if (h2.substring(i2,i2+6) === '</div>') { depth2--; if(depth2===0) closes2.push(i2); i2+=6; continue; }
  i2++;
}
console.log('Depth-0 exits after fix:', closes2.length, '(should be 1)');
if(closes2[0]) console.log('At:', closes2[0], h2.substring(closes2[0]-10, closes2[0]+20));
