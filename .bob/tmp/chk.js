const fs = require('fs');
const h = fs.readFileSync('content/ch12.html', 'utf8');

// Check textarea src0 content
const i = h.indexOf('id="src0"');
console.log('src0 textarea:', JSON.stringify(h.substring(i, i+200)));
