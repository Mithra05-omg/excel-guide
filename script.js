/* Search, filters, dark mode, copy buttons and the printed cheat sheet.
   The content itself is in data.js. */

const LEVELS = [
  { id: 'all', name: 'All' },
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'expert', name: 'Expert' },
  { id: 'shortcut', name: 'Shortcuts' },
  { id: 'fix', name: 'Fixes' },
  { id: 'task', name: 'Everyday tasks' },
  { id: 'forgot', name: 'When you forget' }
];
const USAGE = [
  { id: 'all', name: 'All' },
  { id: 'daily', name: 'Daily' },
  { id: 'sometimes', name: 'Sometimes' },
  { id: 'rare', name: 'Rare' }
];
const USAGE_RANK = { daily: 0, sometimes: 1, rare: 2 };
const USAGE_LABEL = { daily: 'Used daily', sometimes: 'Used sometimes', rare: 'Rarely used' };
const PAGE = 120;   // cards shown before the "Show more" button

const LEVEL_NAME = {};
LEVELS.forEach(function (l) { LEVEL_NAME[l.id] = l.name; });

const $ = function (id) { return document.getElementById(id); };
const input = $('q');
let level = 'all';
let usage = 'all';
let cat = 'all';
let shown = PAGE;
let showAll = false;   // the "Show all examples" switch

/* ---------- helpers ---------- */
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function words(query) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/* Escape the text, then wrap the searched words in <mark>. */
function mark(text, ws) {
  const out = esc(text);
  if (!ws.length) return out;
  const pattern = ws.map(function (w) {
    return esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|');
  return out.replace(new RegExp('(' + pattern + ')(?![^&]*;)', 'gi'), '<mark>$1</mark>');
}

function versionLabel(v) {
  return v === '365' ? 'Needs Microsoft 365' : 'Needs Excel ' + v + ' or newer';
}

/* Prepare one lowercase search string per item. */
ITEMS.forEach(function (it, i) {
  it._i = i;
  it._title = it.t.toLowerCase();
  it._all = [it.t, it.d, it.e, it.a, it.alt, it.tip, it.k, it.cat, LEVEL_NAME[it.l]]
    .filter(Boolean).join(' ').toLowerCase();
});

/* ---------- search ---------- */
function search(query) {
  const ws = words(query);
  const found = [];
  ITEMS.forEach(function (it, i) {
    if (level !== 'all' && it.l !== level) return;
    if (usage !== 'all' && it.u !== usage) return;
    if (cat !== 'all' && it.cat !== cat) return;
    let score = 0;
    for (let n = 0; n < ws.length; n++) {
      if (it._all.indexOf(ws[n]) === -1) return;            // every word must match
      if (it._title === ws[n]) score += 6;                   // exact title
      else if (it._title.indexOf(ws[n]) === 0) score += 3;   // title starts with it
      else if (it._title.indexOf(ws[n]) !== -1) score += 2;  // title contains it
    }
    found.push({ it: it, score: score, rank: USAGE_RANK[it.u] === undefined ? 1 : USAGE_RANK[it.u], i: i });
  });
  // best match first, then the most used, then the original order
  found.sort(function (a, b) { return b.score - a.score || a.rank - b.rank || a.i - b.i; });
  return found.map(function (f) { return f.it; });
}

/* ---------- render ---------- */
function card(it, ws) {
  let h = '<article class="card" style="--c:var(--' + it.l + ')">';
  h += '<div class="tag">' + LEVEL_NAME[it.l] + '</div>';
  h += '<h2>' + mark(it.t, ws) + '</h2>';
  let meta = '';
  if (it.cat) meta += '<span class="badge">' + esc(it.cat) + '</span>';
  if (it.u) meta += '<span class="badge ' + it.u + '">' + USAGE_LABEL[it.u] + '</span>';
  if (it.v) meta += '<span class="badge ver">' + versionLabel(it.v) + '</span>';
  if (meta) h += '<div class="meta">' + meta + '</div>';
  h += '<p>' + mark(it.d, ws) + '</p>';
  if (it.e) {
    h += '<div class="ex"><code>' + mark(it.e, ws) + '</code>' +
         '<button class="copy" type="button" data-copy="' + esc(it.e) + '">Copy</button></div>';
  }
  if (it.a) h += '<p class="ans"><span class="lbl">Answer:</span> ' + mark(it.a, ws) + '</p>';
  if (it.alt) h += '<p class="alt"><span class="lbl">Another way:</span> ' + mark(it.alt, ws) + '</p>';
  if (it.tip) h += '<p class="tip"><span class="lbl">Tip:</span> ' + mark(it.tip, ws) + '</p>';
  h += '<button class="exbtn" type="button" data-i="' + it._i + '" aria-expanded="' + showAll + '">' +
       '<span class="chev">v</span> <span class="exlbl">' + (showAll ? 'Hide example' : 'Show example') + '</span></button>';
  h += '<div class="pic"' + (showAll ? '' : ' hidden') + '>' + (showAll ? renderPic(it) : '') + '</div>';
  return h + '</article>';
}

function render(keepShown) {
  if (!keepShown) shown = PAGE;
  const query = input.value.trim();
  const ws = words(query);
  const list = search(query);
  $('results').innerHTML = list.slice(0, shown).map(function (it) { return card(it, ws); }).join('');
  $('empty').hidden = list.length > 0;
  $('moreBtn').hidden = list.length <= shown;
  $('moreBtn').textContent = 'Show more (' + (list.length - shown) + ' left)';
  $('count').textContent = list.length + (list.length === 1 ? ' result' : ' results') +
    (query ? ' for "' + query + '"' : '') +
    (level !== 'all' ? ' in ' + LEVEL_NAME[level] : '') +
    (cat !== 'all' ? ', ' + cat : '') +
    (usage !== 'all' ? ', ' + USAGE_LABEL[usage].toLowerCase() : '');
  $('clearBtn').style.visibility = query ? 'visible' : 'hidden';
}

function renderFilters() {
  $('filters').innerHTML = LEVELS.map(function (l) {
    const n = l.id === 'all' ? ITEMS.length : ITEMS.filter(function (it) { return it.l === l.id; }).length;
    return '<button type="button" class="chip' + (l.id === level ? ' on' : '') + '" data-level="' + l.id + '"' +
           (l.id === 'all' ? '' : ' style="--c:var(--' + l.id + ')"') + '>' +
           l.name + '<span class="n">' + n + '</span></button>';
  }).join('');

  $('usage').innerHTML = '<span class="lead">How often used:</span>' + USAGE.map(function (u) {
    return '<button type="button" class="chip' + (u.id === usage ? ' on' : '') + '" data-usage="' + u.id + '">' +
           u.name + '</button>';
  }).join('');
}

function renderCategories() {
  const counts = {};
  const order = [];
  ITEMS.forEach(function (it) {
    if (!it.cat) return;
    if (!counts[it.cat]) { counts[it.cat] = 0; order.push(it.cat); }
    counts[it.cat]++;
  });
  order.sort();
  $('cat').innerHTML = '<option value="all">All categories</option>' + order.map(function (c) {
    return '<option value="' + esc(c) + '">' + esc(c) + ' (' + counts[c] + ')</option>';
  }).join('');
}

function renderSample() {
  const letters = ['', 'A', 'B', 'C', 'D', 'E'];
  let h = '<table class="xl"><tr>' + letters.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr>';
  SAMPLE.forEach(function (row, r) {
    h += '<tr><th>' + (r + 1) + '</th>' + row.map(function (v) {
      return '<td' + (r > 0 && !isNaN(v) ? ' class="num"' : '') + '>' + esc(v) + '</td>';
    }).join('') + '</tr>';
  });
  $('sample').innerHTML = h + '</table>';
}

/* ---------- events ---------- */
input.addEventListener('input', function () { render(); });

$('clearBtn').addEventListener('click', function () {
  input.value = '';
  render();
  input.focus();
});

$('filters').addEventListener('click', function (ev) {
  const chip = ev.target.closest('.chip');
  if (!chip) return;
  level = chip.dataset.level;
  renderFilters();
  render();
});

$('usage').addEventListener('click', function (ev) {
  const chip = ev.target.closest('.chip');
  if (!chip) return;
  usage = chip.dataset.usage;
  renderFilters();
  render();
});

$('cat').addEventListener('change', function () {
  cat = $('cat').value;
  render();
});

$('moreBtn').addEventListener('click', function () {
  shown += PAGE;
  render(true);
});

/* Show example / Hide example on one card */
$('results').addEventListener('click', function (ev) {
  const btn = ev.target.closest('.exbtn');
  if (!btn) return;
  const pic = btn.nextElementSibling;
  const open = pic.hidden;
  if (open && !pic.innerHTML) pic.innerHTML = renderPic(ITEMS[+btn.dataset.i]);
  pic.hidden = !open;
  btn.setAttribute('aria-expanded', open);
  btn.querySelector('.exlbl').textContent = open ? 'Hide example' : 'Show example';
});

/* Show all examples switch */
$('allBtn').addEventListener('click', function () {
  showAll = !showAll;
  $('allBtn').textContent = showAll ? 'Hide all examples' : 'Show all examples';
  render(true);
});

/* Copy buttons */
$('results').addEventListener('click', function (ev) {
  const btn = ev.target.closest('.copy');
  if (!btn) return;
  const text = btn.dataset.copy;
  const done = function () {
    btn.textContent = 'Copied';
    setTimeout(function () { btn.textContent = 'Copy'; }, 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
  } else {
    fallbackCopy(text);
    done();
  }
});

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) { /* ignore */ }
  document.body.removeChild(ta);
}

/* Press / to jump to the search box, Esc to clear it */
document.addEventListener('keydown', function (ev) {
  if (ev.key === '/' && document.activeElement !== input) {
    ev.preventDefault();
    input.focus();
    input.select();
  } else if (ev.key === 'Escape' && document.activeElement === input) {
    input.value = '';
    render();
  }
});

/* ---------- dark mode ---------- */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $('themeBtn').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
}

(function () {
  let saved = null;
  try { saved = localStorage.getItem('excel-guide-theme'); } catch (e) { /* ignore */ }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark ? 'dark' : 'light'));
})();

$('themeBtn').addEventListener('click', function () {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  setTheme(next);
  try { localStorage.setItem('excel-guide-theme', next); } catch (e) { /* ignore */ }
});

/* ---------- printed cheat sheet (items with c: 1 in data.js) ---------- */
function buildCheat() {
  let h = '<h1>Excel cheat sheet</h1><div class="cols">';
  LEVELS.slice(1).forEach(function (l) {
    const rows = ITEMS.filter(function (it) { return it.l === l.id && it.c; });
    if (!rows.length) return;
    h += '<h3>' + l.name + '</h3><table>';
    rows.forEach(function (it) {
      const isFormula = l.id === 'beginner' || l.id === 'intermediate' || l.id === 'expert';
      const left = isFormula && it.e ? it.e : it.t;
      h += '<tr><td>' + esc(left) + '</td><td>' + esc(it.d.split('. ')[0].replace(/\.$/, '')) + '</td></tr>';
    });
    h += '</table>';
  });
  $('cheat').innerHTML = h + '</div>';
}

$('printBtn').addEventListener('click', function () {
  buildCheat();
  document.body.classList.add('printing');
  window.print();
});
window.addEventListener('afterprint', function () {
  document.body.classList.remove('printing');
});

/* ---------- example pictures ---------- */
const PIC = typeof PICS === 'undefined' ? {} : PICS;
const RIBBON = ['File', 'Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'View', 'Developer',
                'Table Design', 'Chart Design', 'PivotTable Analyze'];

function colNum(letters) { return letters.length === 1 ? letters.charCodeAt(0) - 64 : 99; }

/* Finds cell references in a formula and colours them, like Excel does when you press F2. */
function scanFormula(f) {
  const refs = [];
  const seen = {};
  const html = f.split(/("[^"]*")/).map(function (part, n) {
    if (n % 2) return esc(part);                       // text inside quotes
    const re = /\$?([A-Z]{1,2})\$?(\d{1,3})(?::\$?([A-Z]{1,2})\$?(\d{1,3}))?/g;
    let out = '', last = 0, m;
    while ((m = re.exec(part))) {
      const before = part[m.index - 1] || '';
      const after = part[m.index + m[0].length] || '';
      if (/[A-Za-z0-9_.!@\[]/.test(before) || /[A-Za-z0-9_(!]/.test(after)) continue;
      const key = m[0].replace(/\$/g, '');
      if (seen[key] === undefined) {
        seen[key] = refs.length;
        const c1 = colNum(m[1]), r1 = +m[2];
        const c2 = m[3] ? colNum(m[3]) : c1, r2 = m[4] ? +m[4] : r1;
        refs.push({ c1: Math.min(c1, c2), c2: Math.max(c1, c2), r1: Math.min(r1, r2), r2: Math.max(r1, r2) });
      }
      out += esc(part.slice(last, m.index)) + '<span class="rf k' + (seen[key] % 4) + '">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return out + esc(part.slice(last));
  }).join('');
  return { html: html, refs: refs };
}

function fxBar(html) {
  return '<div class="fx"><i>fx</i><code>' + html + '</code></div>';
}

/* Draws a mini sheet. cellClass(col, row) may return extra CSS classes for a cell. */
function miniGrid(rows, cellClass) {
  let cols = 0;
  rows.forEach(function (r) { cols = Math.max(cols, r.length); });
  let h = '<div class="grid-scroll"><table class="xl mini"><tr><th></th>';
  for (let c = 1; c <= cols; c++) h += '<th>' + String.fromCharCode(64 + c) + '</th>';
  h += '</tr>';
  rows.forEach(function (row, r) {
    h += '<tr><th>' + (r + 1) + '</th>';
    for (let c = 1; c <= cols; c++) {
      let v = row[c - 1] === undefined ? '' : String(row[c - 1]);
      const cls = [];
      while (v && '!+<>^'.indexOf(v[0]) !== -1) {       // markers used by the fix pictures
        cls.push({ '!': 'bad', '+': 'good', '<': 'lft', '>': 'rgt', '^': 'tri' }[v[0]]);
        v = v.slice(1);
      }
      if (cls.indexOf('lft') === -1 && cls.indexOf('rgt') === -1 && v !== '' && !isNaN(v.replace(/[,%]/g, ''))) cls.push('rgt');
      const extra = cellClass ? cellClass(c, r + 1) : '';
      if (extra) cls.push(extra);
      h += '<td' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + esc(v) + '</td>';
    }
    h += '</tr>';
  });
  return h + '</table></div>';
}

/* Formula picture: formula bar, the sheet with the used cells coloured, and the result. */
function formulaPic(it) {
  const scan = scanFormula(it.e);
  const refs = scan.refs;
  const over = PIC[it.t] && PIC[it.t].sheet;
  const maxCol = it.cat === 'Database' ? 7 : 5;
  const onlyA1B1 = refs.length > 0 && refs.every(function (r) { return r.r1 === 1 && r.r2 === 1 && r.c2 <= 2; });
  const inSample = refs.length > 0 &&
    refs.every(function (r) { return r.c2 <= maxCol && r.r2 <= 6; }) &&
    refs.some(function (r) { return r.r2 >= 2; });

  let sheet = over || (it.cat === 'Date and Time' && onlyA1B1 ? 'dates' : inSample ? 'sample' : 'none');
  let rows = null, note = '';
  if (sheet === 'dates') {
    rows = [['<01/10/2026', '<25/12/2026']];
    note = 'A1 and B1 hold two dates.';
  } else if (sheet === 'sample') {
    rows = SAMPLE.map(function (r) { return r.slice(); });
    if (it.cat === 'Database') {
      rows.forEach(function (r, n) { r.push('', n === 0 ? 'Region' : n === 1 ? 'North' : ''); });
      note = 'G1:G2 holds the condition: Region is North.';
    }
  }

  let h = fxBar(scan.html);
  if (rows) {
    h += miniGrid(rows, function (c, r) {
      for (let n = 0; n < refs.length; n++) {
        const f = refs[n];
        if (c >= f.c1 && c <= f.c2 && r >= f.r1 && r <= f.r2) return 'hl k' + (n % 4);
      }
      return '';
    });
    h += '<p class="cap">' + (note || 'The coloured cells are the ones the formula uses.') + '</p>';
  }
  h += '<div class="res"><span>Result</span><b>' + (it.a ? esc(it.a) : 'Depends on your data') + '</b></div>';
  return h;
}

/* Shortcut picture: the keys drawn as keycaps. */
function keysPic(title) {
  if (title === 'Shortcuts on a Mac') return '<div class="keys"><kbd>Ctrl</kbd><span>becomes</span><kbd>Cmd</kbd></div>';
  let note = '';
  const base = title.replace(/\s*\(([^)]*)\)/g, function (all, inner) { note = inner; return ''; }).trim();
  let together = false, sequence = false;
  let h = '';
  base.split(' or ').forEach(function (group, g) {
    let mods = [];
    group.split(' / ').forEach(function (alt, a) {
      let steps = alt.split(/, then |, /).map(function (st) { return st.split(' + '); });
      if (a > 0 && steps.length === 1 && steps[0].length === 1 && mods.length) steps[0] = mods.concat(steps[0]);
      else mods = steps[0].slice(0, -1);
      if (g > 0 || a > 0) h += '<div class="or">or</div>';
      h += '<div class="keys">' + steps.map(function (keys) {
        if (keys.length > 1) together = true;
        return keys.map(function (k) { return '<kbd>' + esc(k.trim()) + '</kbd>'; }).join('<span>+</span>');
      }).join('<span class="then">then</span>') + '</div>';
      if (steps.length > 1) sequence = true;
    });
  });
  const caps = [];
  if (together) caps.push('Hold the first key(s) and press the last one.');
  if (sequence) caps.push('Where it says "then", let go and press the next key.');
  if (!together && !sequence) caps.push('Press this one key.');
  if (note) caps.push('Note: ' + note + '.');
  return h + '<p class="cap">' + caps.join(' ') + '</p>';
}

function pathPic(steps) {
  return '<div class="path">' + steps.map(function (s) {
    s = s.replace(/^then /, '');
    return '<span class="chipstep' + (RIBBON.indexOf(s) !== -1 ? ' tab' : '') + '">' + esc(s) + '</span>';
  }).join('<span class="arrow">&gt;</span>') + '</div>';
}

/* Click path picture: each sentence is a step. A list like "Data, Sort, OK" becomes buttons with arrows. */
function stepsPic(text, label) {
  const clean = text.replace(/\b\d+\. /g, '');
  const sentences = clean.split(/\. +/).map(function (s) { return s.replace(/\.$/, '').trim(); }).filter(Boolean);
  let h = label ? '<div class="sub">' + label + '</div>' : '';
  h += '<ol class="steps">';
  sentences.forEach(function (s) {
    const parts = s.split(', ');
    const isPath = parts.length >= 2 && /^[A-Z]/.test(parts[0]) &&
      parts.every(function (p) { return p && p.split(' ').length <= 6; });
    h += '<li>' + (isPath ? pathPic(parts) : esc(s)) + '</li>';
  });
  return h + '</ol>';
}

/* Fix picture: before and after sheets, plus the buttons or keys that fix it. */
function fixPic(p) {
  let h = '';
  if (p.before) {
    h += '<div class="ba">';
    [['before', 'Before', p.before], ['after', 'After', p.after]].forEach(function (x) {
      h += '<div class="side ' + x[0] + '"><div class="sub">' + x[1] + '</div>' +
           (x[2].f ? fxBar(esc(x[2].f)) : '') + miniGrid(x[2].rows) +
           (x[2].note ? '<p class="cap">' + esc(x[2].note) + '</p>' : '') + '</div>';
    });
    h += '</div>';
  }
  if (p.path) h += '<div class="sub">Where to click</div>' + pathPic(p.path);
  if (p.keys) h += '<div class="sub">Keys to press</div>' + keysPic(p.keys);
  return h;
}

function renderPic(it) {
  const p = PIC[it.t];
  if (p && (p.before || p.path || p.keys)) return fixPic(p);
  if (it.l === 'shortcut') return keysPic(it.t);
  if (it.e && it.e[0] === '=') return formulaPic(it);
  const old = /use ([A-Z0-9.]+) in new work/.exec(it.d);
  if (old) return '<div class="path"><span class="chipstep">' + esc(it.t) + '</span><span class="arrow">&gt;</span>' +
                  '<span class="chipstep tab">' + old[1] + '</span></div><p class="cap">Old name on the left, the name to use now on the right.</p>';
  return stepsPic(it.d, 'Steps') + (it.alt ? stepsPic(it.alt, 'Another way') : '');
}

/* ---------- start ---------- */
renderSample();
renderFilters();
renderCategories();
render();
