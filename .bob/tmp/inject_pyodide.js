const fs = require('fs');

let html = fs.readFileSync('content/cons_smooth.html', 'utf8');

// 1. ── Strip the original <head> external CSS/JS loads that reference local files
//    (they're broken anyway since we don't have cons_smooth_files/ served)
//    We keep only MathJax config + add our own head injections.

// 2. Inject Pyodide + CodeMirror into <head>
const headInject = `
  <!-- ═══ Live Python runtime ═══ -->
  <script>
    // Patch MathJax config before it loads
    window.MathJax = {
      loader: {load: ['[tex]/boldsymbol']},
      tex: {
        packages: {'[+]': ['boldsymbol']},
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
        processEscapes: true,
      },
      svg: { fontCache: 'global', scale: 0.92, displayAlign: 'center' },
    };
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"></script>
  <style>
    /* ── page chrome ── */
    body { background:#0a0e1a !important; color:#e0f7fa !important; font-family:"IBM Plex Sans",-apple-system,sans-serif !important; }
    .qe-page__content { max-width:860px; margin:0 auto; padding:2rem 2rem 6rem; }
    /* hide all nav/sidebar/toolbar cruft */
    .qe-sidebar,.qe-toolbar,.page__header,.bd-header,.navbar,
    header,.qe-sidebar__toc,.toc-entry,.btn__sidebar,
    .page-toc,.qe-page__nav,.bd-sidebar { display:none !important; }
    /* headings */
    h1,h2,h3,h4 { color:#e0f7fa !important; }
    h1 { font-size:1.8rem; font-weight:300; border-bottom:1px solid rgba(6,182,212,.2); padding-bottom:.75rem; margin-bottom:1.5rem; }
    h2 { font-size:1.2rem; font-weight:500; margin-top:2.5rem; }
    h3 { font-size:1rem; font-weight:500; color:#a7f3d0 !important; }
    p, li { color:rgba(224,247,250,.8); line-height:1.7; }
    a { color:#67e8f9; }
    code { background:rgba(6,182,212,.1); padding:.1em .35em; border-radius:3px; font-size:.88em; color:#a7f3d0; }
    .admonition { background:rgba(6,182,212,.07); border-left:3px solid rgba(6,182,212,.4); padding:1rem 1.25rem; margin:1.5rem 0; border-radius:0 4px 4px 0; }
    .admonition-title { font-weight:600; color:#67e8f9; margin-bottom:.5rem; }
    /* math */
    mjx-container { color:#e0f7fa !important; }
    .math { overflow-x:auto; margin:1rem 0; }
    /* back link */
    .qe-back { display:inline-flex; align-items:center; gap:.4rem; font-family:"IBM Plex Mono",monospace; font-size:.75rem; color:rgba(103,232,249,.5); text-decoration:none; margin-bottom:2rem; }
    .qe-back:hover { color:#67e8f9; }

    /* ── live cell ── */
    .live-cell { margin:1.25rem 0; border:1px solid rgba(6,182,212,.2); border-radius:4px; overflow:hidden; }
    .live-cell .CodeMirror {
      height:auto; font-size:.83rem; font-family:"IBM Plex Mono",monospace;
      background:#0d1224; color:#e0f7fa;
      border:none; padding:.25rem 0;
    }
    .CodeMirror-scroll { min-height:2rem; }
    .CodeMirror-gutters { background:#0d1224; border-right:1px solid rgba(6,182,212,.12); }
    .CodeMirror-linenumber { color:rgba(103,232,249,.25); }
    /* syntax */
    .cm-keyword  { color:#c084fc !important; }
    .cm-def      { color:#67e8f9 !important; }
    .cm-string   { color:#a7f3d0 !important; }
    .cm-comment  { color:rgba(103,232,249,.4) !important; font-style:italic; }
    .cm-number   { color:#f9a8d4 !important; }
    .cm-operator { color:#67e8f9 !important; }
    .cm-builtin  { color:#fcd34d !important; }
    .cm-variable,.cm-variable-2 { color:#e0f7fa !important; }

    .live-cell-toolbar {
      display:flex; align-items:center; justify-content:space-between;
      background:#0d1224; border-top:1px solid rgba(6,182,212,.12);
      padding:.3rem .6rem; gap:.5rem;
    }
    .run-btn {
      font-family:"IBM Plex Mono",monospace; font-size:.7rem; font-weight:500;
      color:#0d1224; background:#34d399; border:none; padding:.25rem .75rem;
      cursor:pointer; border-radius:2px; white-space:nowrap;
      transition:background .15s;
    }
    .run-btn:hover { background:#6ee7b7; }
    .run-btn:disabled { background:rgba(52,211,153,.3); color:rgba(13,18,36,.5); cursor:not-allowed; }
    .run-btn.running { background:rgba(52,211,153,.4); }
    .cell-status { font-family:"IBM Plex Mono",monospace; font-size:.65rem; color:rgba(103,232,249,.4); }
    .live-cell-output {
      background:#080b14; border-top:1px solid rgba(6,182,212,.08);
      padding:.6rem .75rem; font-family:"IBM Plex Mono",monospace; font-size:.8rem;
      white-space:pre-wrap; color:#a7f3d0; max-height:400px; overflow-y:auto;
      display:none;
    }
    .live-cell-output.has-content { display:block; }
    .live-cell-output.error { color:#fca5a5; }
    .live-cell-output img { max-width:100%; display:block; margin:.5rem 0; border-radius:2px; }

    /* pyodide loading banner */
    #pyodide-banner {
      position:fixed; bottom:1rem; right:1rem; z-index:999;
      background:#0d1224; border:1px solid rgba(6,182,212,.3);
      padding:.6rem 1rem; font-family:"IBM Plex Mono",monospace; font-size:.7rem;
      color:#67e8f9; border-radius:4px; display:flex; align-items:center; gap:.5rem;
    }
    .spinner { width:12px; height:12px; border:2px solid rgba(103,232,249,.2); border-top-color:#67e8f9; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  </style>
`;

// 3. Replace all the broken external <link> / <script> references in <head>
//    Keep only the MathJax inline config block (which we override anyway)
html = html.replace(/<link rel="preconnect"[^>]*>/g, '');
html = html.replace(/<link rel="preload"[^>]*>/g, '');
html = html.replace(/<link [^>]*href="cons_smooth_files[^>]*>/g, '');
html = html.replace(/<link [^>]*href="https:\/\/intro\.quantecon\.org[^>]*>/g, '');
html = html.replace(/<script [^>]*src="cons_smooth_files[^>]*><\/script>/g, '');
html = html.replace(/<script [^>]*src="https:\/\/intro\.quantecon\.org[^>]*><\/script>/g, '');
// Remove gtag / dataLayer blocks
html = html.replace(/<script>\s*window\.dataLayer[\s\S]*?<\/script>/g, '');
// Remove duplicate MathJax window assignment (keep only first)
let mjaxCount = 0;
html = html.replace(/<script>window\.MathJax[\s\S]*?<\/script>/g, () => {
  mjaxCount++;
  return mjaxCount === 1 ? '' : ''; // remove all; we inject our own
});
// Remove the original MathJax loader script block
html = html.replace(/<script>\s*MathJax\s*=[\s\S]*?<\/script>/g, '');
html = html.replace(/<script defer="defer"[^>]*tex-mml-chtml[^>]*><\/script>/g, '');

// 4. Inject our head additions before </head>
html = html.replace('</head>', headInject + '</head>');

// 5. Add back-link and pyodide banner just after <body>
const bodyInject = `
<div id="pyodide-banner"><div class="spinner"></div><span id="pyodide-status">Loading Python…</span></div>
<div style="max-width:860px;margin:0 auto;padding:1.5rem 2rem 0;">
  <a class="qe-back" href="../quantecon-chapters-for-alm-retirement-investment.html">← back to chapters</a>
</div>
`;
html = html.replace('<body>', '<body>' + bodyInject);

// 6. Replace each ipython3 code cell with a live cell
let cellIndex = 0;
html = html.replace(
  /<div class="cell docutils container">\s*<div class="cell_input docutils container">\s*<div class="highlight-ipython3 notranslate"><div class="highlight"><pre id="codecell(\d+)">([\s\S]*?)<\/pre>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>(\s*<div class="cell_output docutils container">[\s\S]*?<\/div>\s*<\/div>)?/g,
  (match, id, codeHtml) => {
    // Extract plain text from the highlighted spans
    let code = codeHtml
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .trim();

    const escaped = code
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    const idx = cellIndex++;
    return `
<div class="live-cell" id="cell-wrap-${idx}">
  <textarea id="cell-src-${idx}" style="display:none">${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
  <div id="cell-editor-${idx}"></div>
  <div class="live-cell-toolbar">
    <span class="cell-status" id="cell-status-${idx}">In [${idx+1}]</span>
    <button class="run-btn" id="cell-run-${idx}" onclick="runCell(${idx})">▶ Run</button>
  </div>
  <div class="live-cell-output" id="cell-out-${idx}"></div>
</div>`;
  }
);

// 7. Inject the runtime script before </body>
const bodyScript = `
<script>
// ── CodeMirror editors ──
const editors = {};
document.querySelectorAll('[id^="cell-src-"]').forEach(ta => {
  const idx = ta.id.replace('cell-src-','');
  const code = ta.textContent
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  const cm = CodeMirror(document.getElementById('cell-editor-'+idx), {
    value: code,
    mode: 'python',
    theme: 'default',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    viewportMargin: Infinity,
    extraKeys: {
      'Shift-Enter': () => runCell(parseInt(idx)),
      'Tab': cm => cm.execCommand('indentMore'),
    }
  });
  editors[idx] = cm;
});

// ── Pyodide ──
let pyodide = null;
let pyodideReady = false;

async function loadPyodide() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js';
  document.head.appendChild(script);
  await new Promise(r => script.onload = r);
  pyodide = await loadPyodide();
  // redirect stdout/stderr
  pyodide.runPython(\`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
  \`);
  // pre-install packages
  document.getElementById('pyodide-status').textContent = 'Installing packages…';
  await pyodide.loadPackage(['numpy', 'matplotlib']);
  // configure matplotlib for inline output
  pyodide.runPython(\`
import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
\`);
  pyodideReady = true;
  document.getElementById('pyodide-banner').innerHTML = '✓ Python ready — Shift+Enter to run';
  setTimeout(() => {
    document.getElementById('pyodide-banner').style.opacity = '0';
    document.getElementById('pyodide-banner').style.transition = 'opacity 1s';
    setTimeout(() => document.getElementById('pyodide-banner').style.display='none', 1000);
  }, 2000);
}

loadPyodide();

async function runCell(idx) {
  if (!pyodideReady) {
    alert('Python is still loading, please wait…');
    return;
  }
  const btn = document.getElementById('cell-run-'+idx);
  const out = document.getElementById('cell-out-'+idx);
  const status = document.getElementById('cell-status-'+idx);
  const code = editors[idx].getValue();

  btn.disabled = true;
  btn.classList.add('running');
  btn.textContent = '…';
  status.textContent = 'In [*]';
  out.innerHTML = '';
  out.classList.remove('has-content','error');

  try {
    // clear buffers
    pyodide.runPython('import sys, io; sys.stdout = io.StringIO(); sys.stderr = io.StringIO()');

    let result;
    try {
      result = await pyodide.runPythonAsync(code);
    } catch(err) {
      const stderr = pyodide.runPython('import sys; sys.stderr.getvalue()');
      throw new Error(stderr || err.message);
    }

    const stdout = pyodide.runPython('import sys; sys.stdout.getvalue()');
    const stderr = pyodide.runPython('import sys; sys.stderr.getvalue()');

    // check for matplotlib figures
    const figCount = pyodide.runPython(\`
import matplotlib.pyplot as plt
len(plt.get_fignums())
\`);

    let html = '';
    if (stdout) html += '<span>' + escHtml(stdout) + '</span>';
    if (stderr) html += '<span style="color:#fca5a5">' + escHtml(stderr) + '</span>';

    if (figCount > 0) {
      const figs = pyodide.runPython(\`
import matplotlib.pyplot as plt, io, base64
imgs = []
for fn in plt.get_fignums():
    fig = plt.figure(fn)
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=120, facecolor='#080b14', edgecolor='none')
    buf.seek(0)
    imgs.append(base64.b64encode(buf.read()).decode())
plt.close('all')
imgs
\`).toJs();
      for (const b64 of figs) {
        html += '<img src="data:image/png;base64,' + b64 + '">';
      }
    }

    if (html) {
      out.innerHTML = html;
      out.classList.add('has-content');
    }
    status.textContent = 'Out [' + (idx+1) + ']';

  } catch(err) {
    out.textContent = err.message;
    out.classList.add('has-content','error');
    status.textContent = 'Error';
  }

  btn.disabled = false;
  btn.classList.remove('running');
  btn.textContent = '▶ Run';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
</script>
`;
html = html.replace('</body>', bodyScript + '</body>');

fs.writeFileSync('content/ch12.html', html, 'utf8');
console.log('Done — wrote content/ch12.html');
console.log('File size:', Math.round(fs.statSync('content/ch12.html').size / 1024), 'KB');
