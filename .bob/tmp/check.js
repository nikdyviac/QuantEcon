const fs = require('fs');
const h = fs.readFileSync('content/ch12.html', 'utf8');
console.log('KB:', Math.round(h.length/1024));
console.log('has CM script:', h.includes('codemirror.min.js'));
console.log('has pyodide:', h.includes('pyodide.js'));
console.log('has initEditors:', h.includes('initEditors'));
console.log('live-cells:', h.split('class="live-cell"').length - 1);
console.log('cm-hosts:', h.split('class="cm-host"').length - 1);

const i0 = h.indexOf('id="src0"');
console.log('src0 ctx:', h.substring(i0, i0+200));

const i1 = h.indexOf('id="src1"');
console.log('src1 ctx:', h.substring(i1, i1+300));
