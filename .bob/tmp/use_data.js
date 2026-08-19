const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');

// Replace each <textarea class="cell-code" id="srcN">CODE</textarea>
// with a <div class="cell-code" id="srcN" style="display:none">CODE</div>
// AND store the raw code as a data attribute on the adjacent cm-host div.
// This removes all textarea parsing ambiguity.

let count = 0;
h = h.replace(/<textarea class="cell-code" id="src(\d+)">([\s\S]*?)<\/textarea>\s*\n\s*<div class="cm-host" id="cm(\d+)"><\/div>/g, (m, idx1, code, idx2) => {
  // code is the raw HTML-encoded Python (may contain &lt; &gt; &amp;)
  // Store it as data-code on the cm-host, and as the textarea value
  count++;
  // Escape for a data attribute (code already has &lt; etc for < > &, those are fine in data attrs)
  return `<div class="cm-host" id="cm${idx1}" data-code="${code.replace(/"/g, '&quot;').replace(/\r\n/g,'\n').replace(/\r/g,'\n')}"></div>`;
});

console.log('Replaced', count, 'textarea+cm-host pairs');

// Update the JS to read from data-code attribute
h = h.replace(
  `(function initEditors(){
  document.querySelectorAll('.cell-code').forEach(ta=>{
    const idx=ta.id.replace('src','');
    // Decode HTML entities and normalise line endings
    const raw=ta.textContent;
    const code=raw.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\\r\\n/g,'\\n').replace(/\\r/g,'\\n');
    const host=document.getElementById('cm'+idx);
    if(!host)return;
    editors[idx]=CodeMirror(host,{
      value:code,mode:'python',lineNumbers:true,indentUnit:4,tabSize:4,
      indentWithTabs:false,viewportMargin:Infinity,
      extraKeys:{'Shift-Enter':()=>runCell(+idx),'Tab':cm=>cm.execCommand('indentMore')}
    });
    ta.style.display='none';
  });
  document.querySelectorAll('.run-btn').forEach(b=>b.disabled=true);
})();`,
  `(function initEditors(){
  document.querySelectorAll('[data-code]').forEach(host=>{
    const idx=host.id.replace('cm','');
    // Decode HTML entities stored in data-code attribute
    const raw=host.dataset.code;
    const code=raw.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\\r\\n/g,'\\n').replace(/\\r/g,'\\n');
    editors[idx]=CodeMirror(host,{
      value:code,mode:'python',lineNumbers:true,indentUnit:4,tabSize:4,
      indentWithTabs:false,viewportMargin:Infinity,
      extraKeys:{'Shift-Enter':()=>runCell(+idx),'Tab':cm=>cm.execCommand('indentMore')}
    });
  });
  document.querySelectorAll('.run-btn').forEach(b=>b.disabled=true);
})();`
);

// Update runCell to read from editors only (no textarea fallback needed anymore)
h = h.replace(
  `  const src=document.getElementById('src'+idx);
  const code=editors[idx]?editors[idx].getValue():(src.value||src.textContent).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');`,
  `  const code=editors[idx]?editors[idx].getValue():'';`
);

fs.writeFileSync('content/ch12.html', h);
console.log('Done, size:', Math.round(h.length/1024), 'KB');

// Verify first cm-host
const i = h.indexOf('id="cm0"');
console.log('cm0:', h.substring(i, i+120));
