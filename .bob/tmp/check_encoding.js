const fs = require('fs');
const html = fs.readFileSync('content/ch12.html', 'utf8');

// Find data-code for cm1
const start = html.indexOf('id="cm1" data-code="') + 'id="cm1" data-code="'.length;
const end = html.indexOf('">', start);
const val = html.slice(start, end);

console.log('raw stored value (JSON):', JSON.stringify(val.slice(0, 120)));
console.log('contains \\r:', val.includes('\r'));
console.log('contains \\n:', val.includes('\n'));
console.log('contains &#10;:', val.includes('&#10;'));
console.log('contains &#13;:', val.includes('&#13;'));
