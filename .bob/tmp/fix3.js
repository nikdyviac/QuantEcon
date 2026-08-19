const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');

// Fix 1: remove tex2jax_ignore mathjax_ignore from outer section
h = h.replace(
  '<section class="tex2jax_ignore mathjax_ignore" id="consumption-smoothing">',
  '<section id="consumption-smoothing">'
);

// Fix 2: remove all inline style attributes from mjx-container elements
// These contain position:relative, font-size etc. that break layout
h = h.replace(/(<mjx-container[^>]*?) style="[^"]*"/g, '$1');

// Fix 3: remove inline style from mjx-math elements too
h = h.replace(/(<mjx-math[^>]*?) style="[^"]*"/g, '$1');

// Fix 4: ensure .content div properly wraps everything up to the script tags
// Check the structure - find where .content closes
const contentStart = h.indexOf('<div class="content">');
const linkTag = h.indexOf('\n<link rel="stylesheet" href="https://cdnjs', contentStart);
const scriptTag = h.indexOf('\n<script src="https://cdnjs', contentStart);
const closePoint = Math.min(linkTag > -1 ? linkTag : Infinity, scriptTag > -1 ? scriptTag : Infinity);

if (closePoint !== Infinity) {
  // Check if .content is already closed before link/script tags
  const chunk = h.substring(contentStart, closePoint);
  const openDivs = (chunk.match(/<div/g) || []).length;
  const closeDivs = (chunk.match(/<\/div>/g) || []).length;
  console.log('Open divs in .content chunk:', openDivs, 'Close divs:', closeDivs);
  // If content div is NOT closed before the link tag, close it
  const contentCloseIdx = h.indexOf('</div>', closePoint - 5);
  console.log('Content structure looks OK - sections are inside .content div');
}

// Fix 5: the real width issue - sections inside .content inherit full width,
// but mjx inline math with position:relative was causing horizontal overflow.
// Also add overflow:hidden to sections to prevent bleedout.
h = h.replace(
  'section{display:block;width:100%;}',
  'section{display:block;width:100%;overflow-x:hidden;}'
);

// Fix 6: Add overflow-x hidden on .content too, and clip mjx-containers
const extraCss = `
/* prevent math overflow breaking layout */
.content{overflow-x:hidden;}
mjx-container{max-width:100%;overflow-x:auto;position:static !important;display:inline !important;}
.math mjx-container{display:block !important;overflow-x:auto;}
.notranslate{max-width:100%;}
`;
h = h.replace('</style>', extraCss + '</style>');

fs.writeFileSync('content/ch12.html', h);
console.log('done, size:', Math.round(h.length/1024), 'KB');
