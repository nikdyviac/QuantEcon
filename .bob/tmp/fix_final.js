const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');
const contentOpen = h.indexOf('<div class="content">');

// Walk to find where .content closes  
let depth = 0, i = contentOpen, closeAt = -1;
while (i < h.length) {
  if (h.substring(i,i+4) === '<div') { depth++; i+=4; continue; }
  if (h.substring(i,i+6) === '</div>') { depth--; if(depth===0){closeAt=i;break;} i+=6; continue; }
  i++;
}

// Find where </body> is
const bodyClose = h.indexOf('</body>');

// Everything between closeAt+6 and bodyClose-script_start needs to be inside .content
// Find where the <link and <script tags start (the CM/Pyodide scripts)
const scriptsStart = h.indexOf('\r\n<link rel="stylesheet" href="https://cdnjs', closeAt);
const scriptsStart2 = h.indexOf('\n<link rel="stylesheet" href="https://cdnjs', closeAt);
const scriptsAt = Math.min(
  scriptsStart > -1 ? scriptsStart : Infinity,
  scriptsStart2 > -1 ? scriptsStart2 : Infinity
);

console.log('Content closes at:', closeAt);
console.log('Scripts start at:', scriptsAt);
console.log('Body close at:', bodyClose);

// The stranded content is between closeAt+6 and scriptsAt
const strandedContent = h.substring(closeAt + 6, scriptsAt);
console.log('Stranded content length:', strandedContent.length);
console.log('Stranded content start:', strandedContent.substring(0, 80));

// Rebuild: remove the premature </div> and put closing </div> right before the scripts
const before = h.substring(0, closeAt);         // up to (not including) premature </div>
const stranded = h.substring(closeAt + 6, scriptsAt); // the orphaned content
const rest = h.substring(scriptsAt);            // scripts + runtime + </body>

const fixed = before + stranded + '\n</div>\n' + rest;

fs.writeFileSync('content/ch12.html', fixed, 'utf8');
console.log('Written. New size:', Math.round(fixed.length/1024), 'KB');

// Verify new close position
let h2 = fixed;
let depth2 = 0, i2 = h2.indexOf('<div class="content">'), closeAt2 = -1;
while (i2 < h2.length) {
  if (h2.substring(i2,i2+4) === '<div') { depth2++; i2+=4; continue; }
  if (h2.substring(i2,i2+6) === '</div>') { depth2--; if(depth2===0){closeAt2=i2;break;} i2+=6; continue; }
  i2++;
}
console.log('New .content close at:', closeAt2, '(should be near end, before scripts)');
console.log('Context:', JSON.stringify(fixed.substring(closeAt2-30, closeAt2+40)));
