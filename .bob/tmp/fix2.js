const fs = require('fs');
let h = fs.readFileSync('content/ch12.html', 'utf8');

// Replace the entire layout block — from .content{ to the end of the section rule
// We'll replace all three bad rules at once with one clean rule
h = h.replace(
  `.content{max-width:860px;margin:0 auto;padding:3rem 2rem 6rem;position:relative;z-index:1;}
.content section,.content section *{max-width:100%;}
section{max-width:860px;margin-left:auto;margin-right:auto;padding:0 2rem;position:relative;z-index:1;box-sizing:border-box;}`,
  `/* ── layout: everything constrained to 860px via a single wrapper ── */
.content{max-width:860px;margin:0 auto;padding:3rem 2rem 6rem;position:relative;z-index:1;}
.content > section, .content section{display:block;width:100%;}`
);

// Fix CodeMirror white gutter + background comprehensively
// Remove the partial fix we added before and replace with a full block
h = h.replace(
  '\n.CodeMirror{background:#0d1224 !important;color:#e0f7fa !important;}\n.CodeMirror-scroll{background:#0d1224 !important;}\n.CodeMirror-sizer{background:#0d1224 !important;}\n',
  ''
);

// Inject comprehensive CodeMirror dark override right before </style>
const cmOverride = `
/* ── force dark theme on ALL CodeMirror elements ── */
.CodeMirror, .CodeMirror-scroll, .CodeMirror-sizer,
.CodeMirror-gutter, .CodeMirror-gutters,
.CodeMirror-lines { background: #0d1224 !important; }
.CodeMirror { color: #e0f7fa !important; }
.CodeMirror-gutters { border-right: 1px solid rgba(6,182,212,.12) !important; width: auto !important; }
.CodeMirror-gutter-wrapper, .CodeMirror-linenumber { background: #0d1224 !important; color: rgba(103,232,249,.22) !important; }
`;
h = h.replace('</style>', cmOverride + '</style>');

fs.writeFileSync('content/ch12.html', h);
console.log('done, size:', Math.round(h.length/1024), 'KB');
