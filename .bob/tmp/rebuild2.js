const fs = require('fs');
const src = fs.readFileSync('content/cons_smooth.html', 'utf8');

// ── 1. Extract article body
const articleStart = src.indexOf('<section class="tex2jax_ignore mathjax_ignore" id="consumption-smoothing">');
const articleEnd   = src.indexOf('</main>', articleStart);
let article = src.substring(articleStart, articleEnd);

// ── 2. Remove tex2jax_ignore so math elements are left intact (they are pre-rendered mjx-container)
article = article.replace(' class="tex2jax_ignore mathjax_ignore"', '');

// ── 3. Strip nav/section chrome
article = article.replace(/<a class="headerlink"[^>]*>#<\/a>/g, '');
article = article.replace(/<button class="copybtn[\s\S]*?<\/button>/g, '');
article = article.replace(/<section[^>]*>/g, '<div class="qe-section">');
article = article.replace(/<\/section>/g, '</div>');

// ── 4. Replace code cells using a simple marker-based approach
// Find each .cell.docutils.container block by scanning for the opening tag,
// then find the matching close by tracking div depth

function extractCellBlocks(html) {
  const cells = [];
  const marker = '<div class="cell docutils container">';
  let pos = 0;
  while (true) {
    const start = html.indexOf(marker, pos);
    if (start === -1) break;
    // Walk forward tracking div depth to find the matching close
    let depth = 0, i = start;
    while (i < html.length) {
      if (html.substring(i, i+4) === '<div') { depth++; i+=4; continue; }
      if (html.substring(i, i+6) === '</div>') {
        depth--;
        if (depth === 0) {
          cells.push({ start, end: i+6, html: html.substring(start, i+6) });
          pos = i + 6;
          break;
        }
        i+=6; continue;
      }
      i++;
    }
    if (depth !== 0) break; // safety
  }
  return cells;
}

const cellBlocks = extractCellBlocks(article);
console.log('Found cell blocks:', cellBlocks.length);

// For each cell block, extract code and static output
let cellIdx = 0;
const replacements = [];
for (const cell of cellBlocks) {
  const codeMatch = cell.html.match(/<pre id="codecell\d+">([\s\S]*?)<\/pre>/);
  if (!codeMatch) continue;

  const isOutput = cell.html.includes('highlight-myst-ansi') || cell.html.includes('cell_output');
  const isCode   = cell.html.includes('highlight-ipython3') || cell.html.includes('highlight-none');

  // Skip pure output cells (they appear separately sometimes)
  if (!isCode) continue;

  const codeHtml = codeMatch[1];
  let code = codeHtml.replace(/<[^>]+>/g,'')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')
    .replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();

  // Look for output block inside same cell
  const outMatch = cell.html.match(/<div class="output[^"]*"[^>]*>[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/);
  let staticOut = '';
  if (outMatch) {
    staticOut = outMatch[1].replace(/<[^>]+>/g,'')
      .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim();
  }

  const safeCode = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const safeOut  = staticOut.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const i = cellIdx++;

  const replacement = `<div class="live-cell" id="wrap${i}">
  <div class="cell-gutter">In&nbsp;[${i+1}]</div>
  <div class="cell-body">
    <textarea class="cell-code" id="src${i}">${safeCode}</textarea>
    <div class="cm-host" id="cm${i}"></div>
    <div class="cell-bar">
      <button class="run-btn" id="btn${i}" onclick="runCell(${i})">▶&nbsp;Run</button>
      <span class="cell-msg" id="msg${i}"></span>
    </div>
    <div class="cell-out${staticOut?' has-content':''}" id="out${i}">${safeOut?'<pre>'+safeOut+'</pre>':''}</div>
  </div>
</div>`;

  replacements.push({ ...cell, replacement });
}

console.log('Code cells replaced:', cellIdx);

// Apply replacements from end to start (to preserve positions)
replacements.sort((a,b) => b.start - a.start);
for (const r of replacements) {
  article = article.substring(0, r.start) + r.replacement + article.substring(r.end);
}

// ── 5. Fix cross-refs
article = article.replace(/(<a class="reference internal" href=")([^"#][^"]*?)(")/g,
  (m, pre, href, post) => href.startsWith('http') ? m : `${pre}https://intro.quantecon.org/${href}${post}`);

// ── 6. Balance divs
const opens  = (article.match(/<div/g)||[]).length;
const closes = (article.match(/<\/div>/g)||[]).length;
console.log('Article divs - opens:', opens, 'closes:', closes, 'delta:', opens-closes);

// Remove excess </div>
if (closes > opens) {
  let depth = 0, result = '', i = 0, removed = 0;
  while (i < article.length) {
    if (article.substring(i,i+4) === '<div') { depth++; result += '<div'; i+=4; }
    else if (article.substring(i,i+6) === '</div>') {
      if (depth > 0) { depth--; result += '</div>'; }
      else removed++;
      i+=6;
    } else { result += article[i]; i++; }
  }
  console.log('Removed', removed, 'stray </div> tags');
  article = result;
} else if (opens > closes) {
  // Add missing closes at end
  article += '</div>'.repeat(opens - closes);
  console.log('Added', opens-closes, 'missing </div> tags');
}

// Final check
const o2 = (article.match(/<div/g)||[]).length;
const c2 = (article.match(/<\/div>/g)||[]).length;
console.log('Final balance:', o2, 'open,', c2, 'close →', o2===c2?'BALANCED ✓':'UNBALANCED delta='+(o2-c2));

// ── 7. Build HTML
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Ch 12 — Consumption Smoothing · QuantEcon</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:"IBM Plex Sans",-apple-system,sans-serif;-webkit-font-smoothing:antialiased;
  background:#0a0e1a;color:rgba(224,247,250,.85);min-height:100vh;}
body::before,body::after{content:"";position:fixed;border-radius:50%;pointer-events:none;z-index:0;animation:blob 18s ease-in-out infinite alternate;}
body::before{width:700px;height:700px;top:-200px;left:-220px;background:radial-gradient(circle,rgba(6,182,212,.1),transparent 70%);}
body::after{width:600px;height:600px;bottom:-180px;right:-200px;animation-duration:24s;background:radial-gradient(circle,rgba(16,185,129,.07),transparent 70%);}
@keyframes blob{0%{transform:translate(0,0) scale(1);}100%{transform:translate(40px,30px) scale(1.1);}}
@keyframes spin{to{transform:rotate(360deg);}}

nav.topbar{position:sticky;top:0;z-index:20;border-bottom:1px solid rgba(6,182,212,.12);background:rgba(10,14,26,.9);backdrop-filter:blur(12px);}
.topbar-inner{max-width:860px;margin:0 auto;padding:0 2rem;height:48px;display:flex;align-items:center;justify-content:space-between;}
.brand{font-family:"IBM Plex Mono",monospace;font-size:.82rem;font-weight:500;text-decoration:none;color:rgba(103,232,249,.7);letter-spacing:.04em;}
.brand:hover{color:#67e8f9;}
.back{font-family:"IBM Plex Mono",monospace;font-size:.75rem;color:rgba(103,232,249,.4);text-decoration:none;transition:color .15s;}
.back:hover{color:#67e8f9;}
#banner{position:fixed;bottom:1.25rem;right:1.25rem;z-index:30;background:#0d1224;border:1px solid rgba(6,182,212,.3);padding:.55rem 1rem;font-family:"IBM Plex Mono",monospace;font-size:.7rem;color:#67e8f9;border-radius:4px;display:flex;align-items:center;gap:.5rem;transition:opacity .6s;}
#banner.done{opacity:0;pointer-events:none;}
.spin{width:11px;height:11px;border:2px solid rgba(103,232,249,.2);border-top-color:#67e8f9;border-radius:50%;animation:spin .7s linear infinite;}

.content{max-width:860px;margin:0 auto;padding:3rem 2rem 6rem;position:relative;z-index:1;overflow-x:hidden;}
.qe-section{display:block;width:100%;}

h1{font-size:1.75rem;font-weight:300;color:#f0f4ff;letter-spacing:-.01em;margin-bottom:1.75rem;padding-bottom:.75rem;border-bottom:1px solid rgba(6,182,212,.15);}
h2{font-size:1.1rem;font-weight:500;color:#e0f7fa;margin:2.5rem 0 .75rem;}
h3{font-size:.95rem;font-weight:500;color:#a7f3d0;margin:1.75rem 0 .5rem;}
h4{font-size:.88rem;font-weight:500;color:#6ee7b7;margin:1.25rem 0 .4rem;}
p{line-height:1.75;margin-bottom:.9rem;color:rgba(224,247,250,.75);}
ul,ol{padding-left:1.5rem;margin-bottom:.9rem;}
li{line-height:1.7;color:rgba(224,247,250,.7);margin-bottom:.2rem;}
strong{color:#e0f7fa;font-weight:600;}
a{color:#67e8f9;text-decoration:none;border-bottom:1px solid rgba(103,232,249,.2);}
a:hover{border-bottom-color:#67e8f9;}
code{background:rgba(6,182,212,.12);color:#a7f3d0;padding:.1em .35em;border-radius:3px;font-family:"IBM Plex Mono",monospace;font-size:.85em;}

/* math - mjx-container is pre-rendered by Sphinx, just style it */
.math.notranslate{overflow-x:auto;margin:1rem 0;padding:.25rem 0;}
.math mjx-container{display:block;}
mjx-container{max-width:100%;vertical-align:middle;}
mjx-math{color:rgba(224,247,250,.9);}
mjx-c,mjx-mi,mjx-mo,mjx-mn,mjx-mrow,mjx-msup,mjx-msub,mjx-mfrac,mjx-munderover{color:rgba(224,247,250,.9);}

.admonition{background:rgba(6,182,212,.06);border-left:3px solid rgba(6,182,212,.35);padding:.9rem 1.1rem;margin:1.25rem 0;border-radius:0 4px 4px 0;}
.admonition-title{font-weight:600;color:#67e8f9;margin-bottom:.4rem;font-size:.9rem;}
.admonition p{margin-bottom:0;font-size:.88rem;}
.admonition.note > .admonition-title::before{content:"Note  ";}
pre.plain-code{background:#0d1224;border:1px solid rgba(6,182,212,.15);padding:.75rem 1rem;border-radius:4px;font-family:"IBM Plex Mono",monospace;font-size:.8rem;color:rgba(103,232,249,.6);overflow-x:auto;margin:1rem 0;}
.eqno{float:right;font-family:"IBM Plex Mono",monospace;font-size:.72rem;color:rgba(103,232,249,.3);}

/* live cells */
.live-cell{display:grid;grid-template-columns:42px 1fr;margin:1.25rem 0;border:1px solid rgba(6,182,212,.18);border-radius:4px;overflow:hidden;min-width:0;max-width:100%;}
.cell-gutter{background:#080b14;border-right:1px solid rgba(6,182,212,.1);font-family:"IBM Plex Mono",monospace;font-size:.65rem;color:rgba(103,232,249,.3);padding:.75rem .25rem 0;text-align:center;white-space:nowrap;user-select:none;}
.cell-body{min-width:0;overflow:hidden;}
.CodeMirror,.CodeMirror-scroll,.CodeMirror-sizer,.CodeMirror-lines,.CodeMirror-gutters,.CodeMirror-gutter,.CodeMirror-gutter-wrapper{background:#0d1224 !important;}
.CodeMirror{color:#e0f7fa !important;height:auto !important;font-family:"IBM Plex Mono",monospace !important;font-size:.82rem !important;}
.CodeMirror-gutters{border-right:1px solid rgba(6,182,212,.1) !important;}
.CodeMirror-linenumber{color:rgba(103,232,249,.22) !important;}
.CodeMirror-cursor{border-left:2px solid #67e8f9 !important;}
.CodeMirror-selected{background:rgba(6,182,212,.18) !important;}
.cm-s-default .cm-keyword{color:#c084fc !important;}
.cm-s-default .cm-def{color:#67e8f9 !important;}
.cm-s-default .cm-string,.cm-s-default .cm-string-2{color:#86efac !important;}
.cm-s-default .cm-comment{color:rgba(103,232,249,.38) !important;font-style:italic;}
.cm-s-default .cm-number{color:#f9a8d4 !important;}
.cm-s-default .cm-operator{color:#67e8f9 !important;}
.cm-s-default .cm-builtin{color:#fcd34d !important;}
.cm-s-default .cm-variable,.cm-s-default .cm-variable-2{color:#e0f7fa !important;}
.cell-bar{display:flex;align-items:center;gap:.6rem;background:#080b14;border-top:1px solid rgba(6,182,212,.08);padding:.3rem .6rem;}
.run-btn{font-family:"IBM Plex Mono",monospace;font-size:.68rem;font-weight:500;background:#34d399;color:#030712;border:none;padding:.22rem .7rem;border-radius:2px;cursor:pointer;transition:background .15s;}
.run-btn:hover:not(:disabled){background:#6ee7b7;}
.run-btn:disabled{background:rgba(52,211,153,.25);color:rgba(3,7,18,.4);cursor:not-allowed;}
.cell-msg{font-family:"IBM Plex Mono",monospace;font-size:.65rem;color:rgba(103,232,249,.4);}
.cell-out{background:#060912;border-top:1px solid rgba(6,182,212,.08);font-family:"IBM Plex Mono",monospace;font-size:.8rem;color:#86efac;max-height:500px;overflow-y:auto;display:none;}
.cell-out.has-content{display:block;}
.cell-out pre{padding:.6rem .75rem;white-space:pre-wrap;word-break:break-word;margin:0;}
.cell-out.error pre{color:#fca5a5;}
.cell-out img{max-width:100%;display:block;padding:.4rem .5rem;}

@media(max-width:640px){.live-cell{grid-template-columns:28px 1fr;}h1{font-size:1.35rem;}}
@media(prefers-reduced-motion:reduce){body::before,body::after{animation:none;}}
</style>
</head>
<body>
<div id="banner"><div class="spin"></div><span id="btext">Loading Python…</span></div>
<nav class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="../index.html">QUANTECON / NOTES</a>
    <a class="back" href="../quantecon-chapters-for-alm-retirement-investment.html">← back</a>
  </div>
</nav>
<div class="content">
${article}
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"></script>
<script>
const editors={};
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.cell-code').forEach(ta=>{
    const idx=ta.id.replace('src','');
    const code=ta.value.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
    editors[idx]=CodeMirror(document.getElementById('cm'+idx),{
      value:code,mode:'python',lineNumbers:true,indentUnit:4,tabSize:4,
      indentWithTabs:false,viewportMargin:Infinity,
      extraKeys:{'Shift-Enter':()=>runCell(+idx),'Tab':cm=>cm.execCommand('indentMore')}
    });
    ta.style.display='none';
  });
  document.querySelectorAll('.run-btn').forEach(b=>b.disabled=true);
});
let pyodide=null,pyReady=false;
(async()=>{
  try{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js';
    document.head.appendChild(s);
    await new Promise((r,j)=>{s.onload=r;s.onerror=j;});
    pyodide=await loadPyodide();
    document.getElementById('btext').textContent='Installing packages…';
    await pyodide.loadPackage(['numpy','matplotlib']);
    pyodide.runPython(\`
import sys,io,matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
sys.stdout=io.StringIO()
sys.stderr=io.StringIO()
\`);
    pyReady=true;
    const b=document.getElementById('banner');
    b.innerHTML='✓ Python ready — Shift+Enter to run';
    b.style.background='rgba(52,211,153,.12)';b.style.borderColor='rgba(52,211,153,.3)';b.style.color='#34d399';
    setTimeout(()=>b.classList.add('done'),2500);
    document.querySelectorAll('.run-btn').forEach(b=>b.disabled=false);
  }catch(e){document.getElementById('btext').textContent='Load failed: '+e.message;}
})();
async function runCell(idx){
  if(!pyReady)return;
  const btn=document.getElementById('btn'+idx),out=document.getElementById('out'+idx),msg=document.getElementById('msg'+idx);
  const code=editors[idx]?editors[idx].getValue():document.getElementById('src'+idx).value.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  btn.disabled=true;btn.textContent='…';msg.textContent='running';
  out.innerHTML='';out.className='cell-out';
  try{
    pyodide.runPython('sys.stdout=io.StringIO();sys.stderr=io.StringIO()');
    await pyodide.runPythonAsync(code);
    const stdout=pyodide.runPython('sys.stdout.getvalue()');
    const stderr=pyodide.runPython('sys.stderr.getvalue()');
    const figNums=pyodide.runPython('len(plt.get_fignums())');
    let html='';
    if(stdout.trim())html+='<pre>'+esc(stdout)+'</pre>';
    if(stderr.trim())html+='<pre style="color:#fca5a5">'+esc(stderr)+'</pre>';
    if(figNums>0){
      const imgs=pyodide.runPython(\`
import io as _io,base64 as _b
_r=[]
for _f in plt.get_fignums():
  _buf=_io.BytesIO()
  plt.figure(_f).savefig(_buf,format='png',bbox_inches='tight',dpi=130,facecolor='#060912',edgecolor='none')
  _buf.seek(0);_r.append(_b.b64encode(_buf.read()).decode())
plt.close('all');_r
\`).toJs();
      for(const b64 of imgs)html+='<img src="data:image/png;base64,'+b64+'">';
    }
    if(html){out.innerHTML=html;out.classList.add('has-content');}
    msg.textContent='';
  }catch(e){
    let t='';try{t=pyodide.runPython('sys.stderr.getvalue()');}catch(_){}
    out.innerHTML='<pre>'+esc(t||e.message)+'</pre>';
    out.classList.add('has-content','error');msg.textContent='error';
  }
  btn.disabled=false;btn.textContent='▶ Run';
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
</script>
</body></html>`;

fs.writeFileSync('content/ch12.html', html, 'utf8');
console.log('Final size:', Math.round(html.length/1024), 'KB');
