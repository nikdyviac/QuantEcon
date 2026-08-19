const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');
const contentOpen = h.indexOf('<div class="content">');
const scriptsAt = h.indexOf('\r\n<link rel="stylesheet" href="https://cdnjs');

// Find ALL premature closes by walking div depth and recording each depth-0 hit before scriptsAt
let depth = 0, i = contentOpen;
const prematureCloses = [];
while (i < scriptsAt) {
  if (h.substring(i,i+4) === '<div') { depth++; i+=4; continue; }
  if (h.substring(i,i+6) === '</div>') {
    depth--;
    if (depth === 0) {
      prematureCloses.push(i);
      // After each premature close, depth resets to 0, but we continue
      // The next <div> will bring it back to 1
    }
    i+=6; continue;
  }
  i++;
}

console.log('Premature </div> closes:', prematureCloses.length);
prematureCloses.forEach((pos, idx) => {
  console.log(`  Close ${idx}: pos=${pos}`, JSON.stringify(h.substring(pos-20, pos+20)));
});
