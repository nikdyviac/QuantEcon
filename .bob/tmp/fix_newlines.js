// Fix data-code attributes: replace raw newlines inside attribute values with &#10;
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../content/ch12.html');
let html = fs.readFileSync(filePath, 'utf8');

// Replace raw newlines inside data-code="..." with &#10;
// The attribute always starts with data-code=" and ends at the closing ">
// We need to find each data-code="..." span and encode newlines within it

let result = '';
let i = 0;
const marker = 'data-code="';

while (i < html.length) {
    const start = html.indexOf(marker, i);
    if (start === -1) {
        result += html.slice(i);
        break;
    }
    // Copy everything up to and including data-code="
    result += html.slice(i, start + marker.length);
    
    // Now find the closing quote - must handle escaped quotes (&quot; is fine, but not raw ")
    let j = start + marker.length;
    let attrVal = '';
    while (j < html.length) {
        if (html[j] === '"') {
            // closing quote
            break;
        }
        attrVal += html[j];
        j++;
    }
    
    // Encode newlines in the attribute value
    const encoded = attrVal.replace(/\r\n/g, '&#10;').replace(/\r/g, '&#10;').replace(/\n/g, '&#10;');
    result += encoded + '"';
    i = j + 1; // skip past the closing quote
}

fs.writeFileSync(filePath, result, 'utf8');
console.log('Done. Encoded newlines in data-code attributes.');

// Verify: count &#10; occurrences
const fixed = fs.readFileSync(filePath, 'utf8');
const count = (fixed.match(/&#10;/g) || []).length;
console.log('Total &#10; encoded:', count);
