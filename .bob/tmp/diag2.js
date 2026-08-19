const fs = require('fs');
const h = fs.readFileSync('content/ch12.html', 'utf8');

// Find .content div open and close
const contentOpen = h.indexOf('<div class="content">');
// Find all </section> and </div> after content
let depth = 0;
let i = contentOpen;
let sectionDepth = 0;
let issues = [];

// Count section opens vs closes inside .content
const contentChunk = h.substring(contentOpen, contentOpen + 5000);
const sectionOpens = (contentChunk.match(/<section/g) || []).length;
const sectionCloses = (contentChunk.match(/<\/section>/g) || []).length;
console.log('In first 5000 chars of .content:');
console.log('  <section opens:', sectionOpens);
console.log('  </section> closes:', sectionCloses);

// Also check: does the outer section have tex2jax_ignore?
const outerSection = h.substring(contentOpen, contentOpen + 200);
console.log('\nOuter section tag:');
console.log(outerSection);

// Check mjx-container inline styles
const mjxIdx = h.indexOf('mjx-container class="MathJax');
if (mjxIdx > -1) {
  console.log('\nFirst mjx-container inline style:');
  console.log(h.substring(mjxIdx, mjxIdx + 120));
}

// Check if MathJax script is present
console.log('\nMathJax script present:', h.includes('tex-chtml.js'));
console.log('MathJax config present:', h.includes('window.MathJax'));
console.log('tex2jax_ignore on outer section:', h.includes('tex2jax_ignore'));
