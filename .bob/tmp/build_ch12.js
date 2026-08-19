const fs = require('fs');

const src = fs.readFileSync('content/cons_smooth.html', 'utf8');

// ── 1. Extract article body (from <section id="consumption-smoothing"> to end of main)
const articleStart = src.indexOf('<section class="tex2jax_ignore mathjax_ignore" id="consumption-smoothing">');
const articleEnd   = src.indexOf('</main>', articleStart);
let article = src.substring(articleStart, articleEnd);

// ── 2. Strip Sphinx chrome we don't want
// Remove headerlink anchors
article = article.replace(/<a class="headerlink"[^>]*>#<\/a>/g, '');
// Remove copy buttons
article = article.replace(/<button class="copybtn[\s\S]*?<\/button>/g, '');
// Remove cell wrapper divs, keep only pre content
// We'll handle cells specially below

// ── 3. Replace all ipython3 code cells with live-cell markup
// Pattern: the whole cell docutils container including optional output
let cellIdx = 0;
article = article.replace(
  /<div class="cell docutils container">\s*<div class="cell_input docutils container">\s*<div class="highlight-ipython3 notranslate"><div class="highlight"><pre id="codecell\d+">([\s\S]*?)<\/pre>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>(\s*<div class="cell_output docutils container">([\s\S]*?)<\/div>\s*<\/div>)?/g,
  (match, codeHtml, _outBlock, outHtml) => {
    // Strip HTML tags to get plain code
    let code = codeHtml
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .trim();

    // Extract static output text if present (for display as default)
    let staticOut = '';
    if (outHtml) {
      staticOut = outHtml
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .trim();
    }

    const safeCode = code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeOut = staticOut
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const i = cellIdx++;
    return `<div class="live-cell" id="wrap${i}">
  <div class="cell-gutter">In&nbsp;[${i+1}]</div>
  <div class="cell-body">
    <textarea class="cell-code" id="src${i}">${safeCode}</textarea>
    <div class="cm-host" id="cm${i}"></div>
    <div class="cell-bar">
      <button class="run-btn" id="btn${i}" onclick="runCell(${i})">▶&nbsp;Run</button>
      <span class="cell-msg" id="msg${i}"></span>
    </div>
    <div class="cell-out${staticOut ? ' has-content' : ''}" id="out${i}">${safeOut ? '<pre>'+safeOut+'</pre>' : ''}</div>
  </div>
</div>`;
  }
);

// ── 4. Clean up remaining Sphinx wrappers around non-ipython code blocks (e.g. exercise hints)
article = article.replace(/<div class="highlight-none notranslate"><div class="highlight"><pre[^>]*>([\s\S]*?)<\/pre><\/div><\/div>/g,
  (m, inner) => {
    const text = inner.replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim();
    return `<pre class="plain-code">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`;
  }
);

// ── 5. Fix section heading numbers (remove span wrappers, keep text)
article = article.replace(/<span class="section-number">([\d.]+\s*)<\/span>/g, '$1');

// ── 6. Fix internal cross-refs to point to quantecon.org
article = article.replace(/href="#equation-[^"]*"/g, 'href="#"');
article = article.replace(/<a class="reference internal" href="([^"]*)">/g, (m, href) => {
  if (href.startsWith('http')) return m;
  if (href.startsWith('#')) return `<a class="ref" href="${href}">`;
  return `<a class="ref" href="https://intro.quantecon.org/${href}" target="_blank" rel="noopener">`;
});

// ── 7. Fix bibtex citations
article = article.replace(/<span class="bibtex-citation"[^>]*>\[([\s\S]*?)\]<\/span>/g, (m, inner) => {
  return `[${inner}]`;
});

const totalCells = cellIdx;

// ── 8. Build final HTML
const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Ch 12 — Consumption Smoothing · QuantEcon</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
<script>
window.MathJax = {
  tex: {
    inlineMath:[['$','$'],['\\\\(','\\\\)']],
    displayMath:[['$$','$$'],['\\\\[','\\\\]']],
    processEscapes:true,
    macros:{argmax:'arg\\\\,max',argmin:'arg\\\\,min',EE:'\\\\mathbb{E}',RR:'\\\\mathbb{R}'}
  },
  svg:{fontCache:'global',scale:0.9,displayAlign:'center'}
};
</script>
<script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{
  font-family:"IBM Plex Sans",-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased;
  background:#0a0e1a;
  color:rgba(224,247,250,.85);
  min-height:100vh;
  position:relative;
}
body::before,body::after{
  content:"";position:fixed;border-radius:50%;pointer-events:none;z-index:0;
  animation:blob 18s ease-in-out infinite alternate;
}
body::before{width:700px;height:700px;top:-200px;left:-220px;
  background:radial-gradient(circle,rgba(6,182,212,.1),transparent 70%);}
body::after{width:600px;height:600px;bottom:-180px;right:-200px;animation-duration:24s;
  background:radial-gradient(circle,rgba(16,185,129,.07),transparent 70%);}
@keyframes blob{0%{transform:translate(0,0) scale(1);}100%{transform:translate(40px,30px) scale(1.1);}}

/* ── nav ── */
nav.topbar{
  position:sticky;top:0;z-index:20;
  border-bottom:1px solid rgba(6,182,212,.12);
  background:rgba(10,14,26,.9);backdrop-filter:blur(12px);
}
.topbar-inner{max-width:860px;margin:0 auto;padding:0 2rem;height:48px;
  display:flex;align-items:center;justify-content:space-between;}
.brand{font-family:"IBM Plex Mono",monospace;font-size:.82rem;font-weight:500;
  text-decoration:none;color:rgba(103,232,249,.7);letter-spacing:.04em;}
.brand:hover{color:#67e8f9;}
.back{font-family:"IBM Plex Mono",monospace;font-size:.75rem;
  color:rgba(103,232,249,.4);text-decoration:none;transition:color .15s;}
.back:hover{color:#67e8f9;}

/* ── loading banner ── */
#banner{
  position:fixed;bottom:1.25rem;right:1.25rem;z-index:30;
  background:#0d1224;border:1px solid rgba(6,182,212,.3);
  padding:.55rem 1rem;font-family:"IBM Plex Mono",monospace;font-size:.7rem;
  color:#67e8f9;border-radius:4px;display:flex;align-items:center;gap:.5rem;
  transition:opacity .6s;
}
#banner.done{opacity:0;pointer-events:none;}
.spin{width:11px;height:11px;border:2px solid rgba(103,232,249,.2);
  border-top-color:#67e8f9;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

/* ── content ── */
.content{max-width:860px;margin:0 auto;padding:3rem 2rem 6rem;position:relative;z-index:1;}

h1{font-size:1.75rem;font-weight:300;color:#f0f4ff;letter-spacing:-.01em;
  margin-bottom:1.75rem;padding-bottom:.75rem;border-bottom:1px solid rgba(6,182,212,.15);}
h1 .section-number{color:rgba(103,232,249,.4);font-size:1.2rem;}
h2{font-size:1.1rem;font-weight:500;color:#e0f7fa;margin:2.5rem 0 .75rem;}
h2 .section-number{color:rgba(103,232,249,.35);font-size:.85rem;font-weight:400;}
h3{font-size:.95rem;font-weight:500;color:#a7f3d0;margin:1.75rem 0 .5rem;}
h3 .section-number{color:rgba(52,211,153,.4);font-size:.8rem;font-weight:400;}
h4{font-size:.88rem;font-weight:500;color:#6ee7b7;margin:1.25rem 0 .4rem;}

p{line-height:1.75;margin-bottom:.9rem;color:rgba(224,247,250,.75);}
ul,ol{padding-left:1.5rem;margin-bottom:.9rem;}
li{line-height:1.7;color:rgba(224,247,250,.7);margin-bottom:.2rem;}
strong{color:#e0f7fa;font-weight:600;}
a{color:#67e8f9;text-decoration:none;border-bottom:1px solid rgba(103,232,249,.2);}
a:hover{border-bottom-color:#67e8f9;}
a.ref{color:rgba(103,232,249,.6);font-size:.9em;}
code{background:rgba(6,182,212,.12);color:#a7f3d0;padding:.1em .35em;
  border-radius:3px;font-family:"IBM Plex Mono",monospace;font-size:.85em;}

/* math */
.math{overflow-x:auto;margin:1.1rem 0;padding:.25rem 0;}
mjx-container{color:rgba(224,247,250,.9) !important;}

/* admonitions */
.admonition{background:rgba(6,182,212,.06);border-left:3px solid rgba(6,182,212,.35);
  padding:.9rem 1.1rem;margin:1.25rem 0;border-radius:0 4px 4px 0;}
.admonition-title{font-weight:600;color:#67e8f9;margin-bottom:.4rem;font-size:.9rem;}
.admonition p{margin-bottom:0;font-size:.88rem;}

/* exercises */
.exercise,.proof{background:rgba(52,211,153,.05);border-left:3px solid rgba(52,211,153,.3);
  padding:.9rem 1.1rem;margin:1.5rem 0;border-radius:0 4px 4px 0;}
.exercise-title,.proof-title{font-weight:600;color:#34d399;margin-bottom:.5rem;font-size:.88rem;}

/* plain code block */
pre.plain-code{background:#0d1224;border:1px solid rgba(6,182,212,.15);
  padding:.75rem 1rem;border-radius:4px;font-family:"IBM Plex Mono",monospace;
  font-size:.8rem;color:rgba(103,232,249,.6);overflow-x:auto;margin:1rem 0;}

/* ── live cells ── */
.live-cell{
  display:grid;grid-template-columns:42px 1fr;
  margin:1.25rem 0;border:1px solid rgba(6,182,212,.18);
  border-radius:4px;overflow:hidden;
}
.cell-gutter{
  background:#080b14;border-right:1px solid rgba(6,182,212,.1);
  font-family:"IBM Plex Mono",monospace;font-size:.65rem;color:rgba(103,232,249,.3);
  padding:.75rem .25rem 0;text-align:center;white-space:nowrap;
  user-select:none;
}
.cell-body{min-width:0;}
.cm-host .CodeMirror{
  height:auto;background:#0d1224;color:#e0f7fa;
  font-family:"IBM Plex Mono",monospace;font-size:.82rem;
  border:none;padding:.4rem 0;
}
.CodeMirror-scroll{min-height:1.5rem;}
.CodeMirror-gutters{background:#0d1224;border-right:1px solid rgba(6,182,212,.1) !important;}
.CodeMirror-linenumber{color:rgba(103,232,249,.2) !important;font-size:.72rem;}
.CodeMirror-cursor{border-left:2px solid #67e8f9 !important;}
.CodeMirror-selected{background:rgba(6,182,212,.18) !important;}
/* syntax */
.cm-s-default .cm-keyword{color:#c084fc !important;}
.cm-s-default .cm-def{color:#67e8f9 !important;}
.cm-s-default .cm-string,.cm-s-default .cm-string-2{color:#86efac !important;}
.cm-s-default .cm-comment{color:rgba(103,232,249,.38) !important;font-style:italic;}
.cm-s-default .cm-number{color:#f9a8d4 !important;}
.cm-s-default .cm-operator{color:#67e8f9 !important;}
.cm-s-default .cm-builtin{color:#fcd34d !important;}
.cm-s-default .cm-variable,.cm-s-default .cm-variable-2{color:#e0f7fa !important;}
.cm-s-default .cm-atom{color:#f9a8d4 !important;}

.cell-bar{
  display:flex;align-items:center;gap:.6rem;
  background:#080b14;border-top:1px solid rgba(6,182,212,.08);
  padding:.3rem .6rem;
}
.run-btn{
  font-family:"IBM Plex Mono",monospace;font-size:.68rem;font-weight:500;
  background:#34d399;color:#030712;border:none;
  padding:.22rem .7rem;border-radius:2px;cursor:pointer;transition:background .15s;
}
.run-btn:hover:not(:disabled){background:#6ee7b7;}
.run-btn:disabled{background:rgba(52,211,153,.25);color:rgba(3,7,18,.4);cursor:not-allowed;}
.cell-msg{font-family:"IBM Plex Mono",monospace;font-size:.65rem;color:rgba(103,232,249,.4);}

.cell-out{
  background:#060912;border-top:1px solid rgba(6,182,212,.08);
  font-family:"IBM Plex Mono",monospace;font-size:.8rem;
  color:#86efac;max-height:500px;overflow-y:auto;display:none;
}
.cell-out.has-content{display:block;}
.cell-out pre{padding:.6rem .75rem;white-space:pre-wrap;word-break:break-word;margin:0;}
.cell-out.error pre{color:#fca5a5;}
.cell-out img{max-width:100%;display:block;padding:.4rem .5rem;}

/* eqno */
.eqno{float:right;font-family:"IBM Plex Mono",monospace;font-size:.72rem;
  color:rgba(103,232,249,.3);margin-left:1rem;}

/* toggle (exercise/solution) */
.toggle summary{cursor:pointer;color:#34d399;font-size:.88rem;font-weight:500;
  list-style:none;padding:.4rem 0;}
.toggle summary::-webkit-details-marker{display:none;}
.toggle[open] summary{margin-bottom:.6rem;}

@media(max-width:640px){
  .live-cell{grid-template-columns:28px 1fr;}
  .cell-gutter{font-size:.55rem;padding:.5rem .1rem 0;}
  h1{font-size:1.35rem;}
}
@media(prefers-reduced-motion:reduce){
  body::before,body::after{animation:none;}
}
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

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"></script>

<script>
// ── Mount CodeMirror editors after DOM ready ──
const editors = {};

function initEditors() {
  document.querySelectorAll('.cell-code').forEach(ta => {
    const id = ta.id; // e.g. "src0"
    const idx = id.replace('src','');
    const host = document.getElementById('cm'+idx);
    if (!host || editors[idx]) return;
    const code = ta.value
      .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
    const cm = CodeMirror(host, {
      value: code,
      mode: 'python',
      lineNumbers: true,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      viewportMargin: Infinity,
      extraKeys: {
        'Shift-Enter': function() { runCell(parseInt(idx)); },
        'Tab': function(cm) { cm.execCommand('indentMore'); },
        'Shift-Tab': function(cm) { cm.execCommand('indentLess'); }
      }
    });
    editors[idx] = cm;
    ta.style.display = 'none';
  });
}

document.addEventListener('DOMContentLoaded', initEditors);

// ── Pyodide ──
let pyodide = null;
let pyodideReady = false;
const runQueue = [];

(async function() {
  try {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js';
    document.head.appendChild(s);
    await new Promise((res,rej) => { s.onload=res; s.onerror=rej; });

    pyodide = await loadPyodide();

    document.getElementById('btext').textContent = 'Installing numpy & matplotlib…';
    await pyodide.loadPackage(['numpy','matplotlib']);

    pyodide.runPython(\`
import sys, io, matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
\`);

    pyodideReady = true;
    const b = document.getElementById('banner');
    b.innerHTML = '✓ Python ready — Shift+Enter to run';
    b.style.background = 'rgba(52,211,153,.12)';
    b.style.borderColor = 'rgba(52,211,153,.3)';
    b.style.color = '#34d399';
    setTimeout(() => b.classList.add('done'), 2500);

    // enable all run buttons
    document.querySelectorAll('.run-btn').forEach(b => b.disabled = false);

  } catch(e) {
    document.getElementById('btext').textContent = 'Python load failed: '+e.message;
  }
})();

// Disable all run buttons until ready
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.run-btn').forEach(b => b.disabled = true);
});

async function runCell(idx) {
  if (!pyodideReady) return;
  const btn = document.getElementById('btn'+idx);
  const out = document.getElementById('out'+idx);
  const msg = document.getElementById('msg'+idx);
  const code = editors[idx] ? editors[idx].getValue() :
    document.getElementById('src'+idx).value
      .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');

  btn.disabled = true;
  btn.textContent = '…';
  msg.textContent = 'running';
  out.innerHTML = '';
  out.className = 'cell-out';

  try {
    pyodide.runPython('sys.stdout = io.StringIO(); sys.stderr = io.StringIO()');
    await pyodide.runPythonAsync(code);

    const stdout = pyodide.runPython('sys.stdout.getvalue()');
    const stderr = pyodide.runPython('sys.stderr.getvalue()');

    const figNums = pyodide.runPython('len(plt.get_fignums())');

    let html = '';
    if (stdout.trim()) html += '<pre>'+esc(stdout)+'</pre>';
    if (stderr.trim()) html += '<pre style="color:#fca5a5">'+esc(stderr)+'</pre>';

    if (figNums > 0) {
      const imgs = pyodide.runPython(\`
import io as _io, base64 as _b64
_out = []
for _fn in plt.get_fignums():
    _fig = plt.figure(_fn)
    _buf = _io.BytesIO()
    _fig.savefig(_buf, format='png', bbox_inches='tight', dpi=130,
                 facecolor='#060912', edgecolor='none')
    _buf.seek(0)
    _out.append(_b64.b64encode(_buf.read()).decode())
plt.close('all')
_out
\`).toJs();
      for (const b64 of imgs) {
        html += '<img src="data:image/png;base64,'+b64+'" alt="plot">';
      }
    }

    if (html) {
      out.innerHTML = html;
      out.classList.add('has-content');
    }
    msg.textContent = '';

  } catch(e) {
    let errText = '';
    try { errText = pyodide.runPython('sys.stderr.getvalue()'); } catch(_){}
    out.innerHTML = '<pre>'+esc(errText || e.message)+'</pre>';
    out.classList.add('has-content','error');
    msg.textContent = 'error';
  }

  btn.disabled = false;
  btn.textContent = '▶ Run';
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
</script>

</body>
</html>`;

fs.writeFileSync('content/ch12.html', out, 'utf8');
const size = Math.round(fs.statSync('content/ch12.html').size / 1024);
console.log('Done. Size:', size, 'KB. Cells:', cellIdx);
