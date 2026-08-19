const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');
// Show all layout-relevant CSS rules
const styleMatch = h.match(/<style>([\s\S]*?)<\/style>/g) || [];
styleMatch.forEach((s,i) => {
  const lines = s.split('\n');
  lines.forEach((l, li) => {
    if(l.includes('max-width') || l.includes('section') || l.includes('CodeMirror{') || l.includes('.cm-host')) {
      console.log(`style[${i}] L${li}: ${l.trim().substring(0,120)}`);
    }
  });
});
