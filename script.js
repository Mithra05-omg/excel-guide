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
ITEMS.forEach(function (it) {
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

/* ---------- start ---------- */
renderSample();
renderFilters();
renderCategories();
render();
