'use strict';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  leftPath: null,
  rightPath: null,
  leftText: '',
  rightText: '',
  themeMode: 'system',
  unsubSystemTheme: null,
  // Diff options
  ignoreWhitespace: false,
  ignoreCase: false,
  inlineMode: 'word', // 'word' | 'char'
  // Input modes and typed content
  leftMode: 'file',
  rightMode: 'file',
  leftTyped: '',
  rightTyped: '',
  lastMismatchKey: null,
};

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function splitLines(s) {
  if (s.length === 0) return [];
  return s.split(/\r\n|\r|\n/);
}

// Myers diff for arrays with customizable equality
function myersDiff(A, B, equals = (x, y) => x === y) {
  const N = A.length, M = B.length;
  const MAX = N + M;
  const OFFSET = MAX;
  let V = new Int32Array(2 * MAX + 1);
  V[OFFSET + 1] = 0;
  const trace = [];

  for (let D = 0; D <= MAX; D++) {
    for (let k = -D; k <= D; k += 2) {
      let x;
      if (k === -D) {
        x = V[OFFSET + k + 1];
      } else if (k !== D && V[OFFSET + k - 1] < V[OFFSET + k + 1]) {
        x = V[OFFSET + k + 1];
      } else {
        x = V[OFFSET + k - 1] + 1;
      }
      let y = x - k;
      while (x < N && y < M && equals(A[x], B[y])) { x++; y++; }
      V[OFFSET + k] = x;
      if (x >= N && y >= M) {
        trace.push(V.slice());
        return backtrackMyers(trace, A, B, OFFSET, equals);
      }
    }
    trace.push(V.slice());
  }
  return [];
}

function backtrackMyers(trace, A, B, OFFSET, equals = (x, y) => x === y) {
  let x = A.length;
  let y = B.length;
  const ops = [];
  for (let D = trace.length - 1; D > 0; D--) {
    const V = trace[D - 1];
    const k = x - y;
    let prevK;
    if (k === -D || (k !== D && V[OFFSET + k - 1] < V[OFFSET + k + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = V[OFFSET + prevK];
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', a: A[x - 1], b: B[y - 1] });
      x--; y--;
    }

    if (x === prevX) {
      ops.push({ type: 'insert', b: B[y - 1] });
      y--;
    } else {
      ops.push({ type: 'delete', a: A[x - 1] });
      x--;
    }
  }
  // Finish the start snake
  while (x > 0 && y > 0 && equals(A[x - 1], B[y - 1])) {
    ops.push({ type: 'equal', a: A[x - 1], b: B[y - 1] });
    x--; y--;
  }
  return ops.reverse();
}

// Tokenization for inline diffs
function tokenizeInline(s, mode) {
  if (mode === 'char') return [...s];
  const tokens = [];
  const re = /(\s+|[A-Za-z0-9_]+|[^\sA-Za-z0-9_])/g;
  let m;
  while ((m = re.exec(s)) !== null) tokens.push(m[0]);
  return tokens;
}

function makeTokenEquals({ ignoreWhitespace, ignoreCase }) {
  const isWS = (t) => /^\s+$/.test(t);
  return (a, b) => {
    const aWS = isWS(a), bWS = isWS(b);
    if (ignoreWhitespace && (aWS || bWS)) return aWS && bWS;
    if (aWS || bWS) return a === b;
    if (ignoreCase) return a.toLowerCase() === b.toLowerCase();
    return a === b;
  };
}

function inlineDiffTokens(a, b, opts) {
  const A = tokenizeInline(a, opts.mode);
  const B = tokenizeInline(b, opts.mode);
  const eq = makeTokenEquals(opts);
  const ops = myersDiff(A, B, eq);
  // collapse ops to segments
  const segs = [];
  for (const op of ops) {
    if (op.type === 'equal') {
      if (segs.length && segs[segs.length - 1].t === 'eq') segs[segs.length - 1].s += op.a;
      else segs.push({ t: 'eq', s: op.a });
    } else if (op.type === 'insert') {
      if (segs.length && segs[segs.length - 1].t === 'ins') segs[segs.length - 1].s += op.b;
      else segs.push({ t: 'ins', s: op.b });
    } else if (op.type === 'delete') {
      if (segs.length && segs[segs.length - 1].t === 'del') segs[segs.length - 1].s += op.a;
      else segs.push({ t: 'del', s: op.a });
    }
  }
  return segs;
}

function lcsMatrixLines(a, b) {
  const n = a.length, m = b.length;
  const L = Array(n + 1);
  for (let i = 0; i <= n; i++) L[i] = new Int32Array(m + 1);
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) L[i][j] = L[i - 1][j - 1] + 1;
      else L[i][j] = Math.max(L[i - 1][j], L[i][j - 1]);
    }
  }
  return L;
}

function diffLines(aLines, bLines) {
  return myersDiff(aLines, bLines, (x, y) => x === y);
}

function lcsMatrixChars(a, b) {
  const n = a.length, m = b.length;
  const L = Array(n + 1);
  for (let i = 0; i <= n; i++) L[i] = new Int16Array(m + 1);
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) L[i][j] = L[i - 1][j - 1] + 1;
      else L[i][j] = Math.max(L[i - 1][j], L[i][j - 1]);
    }
  }
  return L;
}

function diffChars(a, b) {
  if (a === b) return [{ t: 'eq', s: a }];
  const A = [...a], B = [...b];
  const L = lcsMatrixChars(A, B);
  let i = A.length, j = B.length;
  const segs = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && A[i - 1] === B[j - 1]) {
      segs.push({ t: 'eq', s: A[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || L[i][j - 1] >= L[i - 1][j])) {
      segs.push({ t: 'ins', s: B[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || L[i][j - 1] < L[i - 1][j])) {
      segs.push({ t: 'del', s: A[i - 1] });
      i--;
    }
  }
  segs.reverse();
  // merge adjacent of same type
  const merged = [];
  for (const seg of segs) {
    if (merged.length && merged[merged.length - 1].t === seg.t) merged[merged.length - 1].s += seg.s;
    else merged.push({ ...seg });
  }
  return merged;
}

function opsToRows(ops) {
  const rows = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i];
    if (op.type === 'equal') {
      rows.push({ type: 'equal', left: op.a, right: op.b });
      i++;
      continue;
    }
    const dels = [];
    const ins = [];
    while (i < ops.length && (ops[i].type === 'delete' || ops[i].type === 'insert')) {
      if (ops[i].type === 'delete') dels.push(ops[i].a);
      else ins.push(ops[i].b);
      i++;
    }
    const n = Math.max(dels.length, ins.length);
    for (let k = 0; k < n; k++) {
      const left = k < dels.length ? dels[k] : '';
      const right = k < ins.length ? ins[k] : '';
      const type = left && right ? 'replace' : (left ? 'delete' : 'insert');
      rows.push({ type, left, right });
    }
  }
  return rows;
}

function renderSegments(line, mode) {
  // mode: 'left' or 'right'
  return escapeHtml(line);
}

function renderRowHTML(idx, row, lnLeft, lnRight) {
  const classes = `row ${row.type}`;
  const leftContent = (row.type === 'replace' || row.type === 'equal')
    ? renderInlineDiff(row.left, row.right, 'left')
    : escapeHtml(row.left || '');
  const rightContent = (row.type === 'replace' || row.type === 'equal')
    ? renderInlineDiff(row.left, row.right, 'right')
    : escapeHtml(row.right || '');

  return (
    `<div class="${classes}">` +
      `<div class="ln left">${lnLeft ?? ''}</div>` +
      `<div class="code left">${leftContent || '&nbsp;'}</div>` +
      `<div class="ln right">${lnRight ?? ''}</div>` +
      `<div class="code right">${rightContent || '&nbsp;'}</div>` +
    `</div>`
  );
}

function renderInlineDiff(a, b, side) {
  if (a === b) return escapeHtml(a);
  const segs = inlineDiffTokens(a, b, {
    mode: state.inlineMode,
    ignoreWhitespace: state.ignoreWhitespace,
    ignoreCase: state.ignoreCase,
  });
  let html = '';
  for (const seg of segs) {
    if (seg.t === 'eq') html += escapeHtml(seg.s);
    else if (seg.t === 'ins') html += side === 'right' ? `<span class="segment ins">${escapeHtml(seg.s)}</span>` : '';
    else if (seg.t === 'del') html += side === 'left' ? `<span class="segment del">${escapeHtml(seg.s)}</span>` : '';
  }
  return html || '&nbsp;';
}

function getActiveText(side) {
  return side === 'left'
    ? (state.leftMode === 'file' ? state.leftText : state.leftTyped)
    : (state.rightMode === 'file' ? state.rightText : state.rightTyped);
}

function extOf(p) {
  if (!p) return '';
  const m = /\.([^.\\\/]+)$/.exec(p);
  return m ? m[1].toLowerCase() : '';
}

function renderDiff() {
  const container = $('#diff');
  const left = getActiveText('left');
  const right = getActiveText('right');

  // If both are files, require same extension
  if (state.leftMode === 'file' && state.rightMode === 'file' && state.leftPath && state.rightPath) {
    const e1 = extOf(state.leftPath);
    const e2 = extOf(state.rightPath);
    if (e1 && e2 && e1 !== e2) {
      const key = `${e1}|${e2}|${state.leftPath}|${state.rightPath}`;
      if (state.lastMismatchKey !== key) {
        state.lastMismatchKey = key;
        alert(`Cannot compare files of different types. Left is .${e1}, right is .${e2}.\nBoth files should have the same extension.`);
      }
      container.innerHTML = '<div class="placeholder">Select two files with the same extension to compare</div>';
      return;
    }
  }

  if (!left || !right) {
    container.innerHTML = '<div class="placeholder">Choose or drop two files to see differences</div>';
    return;
  }

  const aLines = splitLines(left);
  const bLines = splitLines(right);
  const ops = diffLines(aLines, bLines);
  const rows = opsToRows(ops);

  let html = '';
  let lnA = 1, lnB = 1;
  rows.forEach((row, idx) => {
    const leftLineNo = row.left !== '' && row.left !== undefined ? lnA : '';
    const rightLineNo = row.right !== '' && row.right !== undefined ? lnB : '';
    html += renderRowHTML(idx, row, leftLineNo, rightLineNo);
    if (row.left !== '' && row.left !== undefined) lnA++;
    if (row.right !== '' && row.right !== undefined) lnB++;
  });

  container.innerHTML = html;
}

async function pick(side) {
  const filePath = await window.api.openFile();
  if (!filePath) return;
  const res = await window.api.readFile(filePath);
  if (!res.ok) {
    alert('Failed to read file: ' + res.error);
    return;
  }
  if (side === 'left') {
    state.leftMode = 'file';
    document.getElementById('mode-left-file').checked = true;
    document.getElementById('left-panel').classList.remove('text-mode');
    state.leftPath = filePath; state.leftText = res.content; $('#left-path').textContent = filePath;
  } else {
    state.rightMode = 'file';
    document.getElementById('mode-right-file').checked = true;
    document.getElementById('right-panel').classList.remove('text-mode');
    state.rightPath = filePath; state.rightText = res.content; $('#right-path').textContent = filePath;
  }
  state.lastMismatchKey = null; // reset to allow future mismatch alert if needed
  renderDiff();
}

function setupDropzone(el, side) {
  const onDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); el.classList.remove('dragover');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    const filePath = file.path || null;
    if (!filePath) return;
    const res = await window.api.readFile(filePath);
    if (!res.ok) { alert('Failed to read file: ' + res.error); return; }
    if (side === 'left') {
      state.leftMode = 'file';
      document.getElementById('mode-left-file').checked = true;
      document.getElementById('left-panel').classList.remove('text-mode');
      state.leftPath = filePath; state.leftText = res.content; $('#left-path').textContent = filePath;
    } else {
      state.rightMode = 'file';
      document.getElementById('mode-right-file').checked = true;
      document.getElementById('right-panel').classList.remove('text-mode');
      state.rightPath = filePath; state.rightText = res.content; $('#right-path').textContent = filePath;
    }
    state.lastMismatchKey = null;
    renderDiff();
  };
  el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('dragover'); });
  el.addEventListener('dragleave', () => el.classList.remove('dragover'));
  el.addEventListener('drop', onDrop);
}

function applyTheme(mode) {
  state.themeMode = mode;
  localStorage.setItem('themeMode', mode);

  const root = document.documentElement;
  const setTheme = (t) => root.setAttribute('data-theme', t);

  if (state.unsubSystemTheme) { state.unsubSystemTheme(); state.unsubSystemTheme = null; }

  if (mode === 'system') {
    window.api.getSystemTheme().then(setTheme);
    state.unsubSystemTheme = window.api.onSystemThemeUpdated(setTheme);
  } else {
    setTheme(mode);
  }
}

function setupThemeControls() {
  const saved = localStorage.getItem('themeMode');
  const initial = saved || 'system';
  const input = $(`#theme-${initial}`);
  if (input) input.checked = true;
  applyTheme(initial);

  $$('#theme-segmented input[name="theme"]').forEach(el => {
    el.addEventListener('change', () => {
      if (el.checked) applyTheme(el.value);
    });
  });
}

function setupDiffOptionsControls() {
  const ws = localStorage.getItem('optIgnoreWS') === '1';
  const ic = localStorage.getItem('optIgnoreCase') === '1';
  const inlineMode = localStorage.getItem('inlineMode') || 'word';

  state.ignoreWhitespace = ws;
  state.ignoreCase = ic;
  state.inlineMode = inlineMode === 'char' ? 'char' : 'word';

  const wsEl = document.getElementById('opt-ignore-ws');
  const icEl = document.getElementById('opt-ignore-case');
  const inlineWord = document.getElementById('inline-word');
  const inlineChar = document.getElementById('inline-char');

  if (wsEl) wsEl.checked = ws;
  if (icEl) icEl.checked = ic;
  if (inlineWord && inlineChar) {
    if (state.inlineMode === 'word') inlineWord.checked = true; else inlineChar.checked = true;
  }

  wsEl?.addEventListener('change', (e) => {
    state.ignoreWhitespace = e.target.checked;
    localStorage.setItem('optIgnoreWS', e.target.checked ? '1' : '0');
    renderDiff();
  });
  icEl?.addEventListener('change', (e) => {
    state.ignoreCase = e.target.checked;
    localStorage.setItem('optIgnoreCase', e.target.checked ? '1' : '0');
    renderDiff();
  });
  document.querySelectorAll('#inline-mode input[name="inline"]').forEach(el => {
    el.addEventListener('change', () => {
      if (el.checked) {
        state.inlineMode = el.value;
        localStorage.setItem('inlineMode', el.value);
        renderDiff();
      }
    });
  });
}

function setupModeControls() {
  const leftPanel = document.getElementById('left-panel');
  const rightPanel = document.getElementById('right-panel');

  const apply = (side, mode) => {
    if (side === 'left') {
      state.leftMode = mode;
      leftPanel.classList.toggle('text-mode', mode === 'text');
    } else {
      state.rightMode = mode;
      rightPanel.classList.toggle('text-mode', mode === 'text');
    }
    renderDiff();
  };

  document.getElementById('mode-left-file').addEventListener('change', (e) => { if (e.target.checked) apply('left', 'file'); });
  document.getElementById('mode-left-text').addEventListener('change', (e) => { if (e.target.checked) apply('left', 'text'); });
  document.getElementById('mode-right-file').addEventListener('change', (e) => { if (e.target.checked) apply('right', 'file'); });
  document.getElementById('mode-right-text').addEventListener('change', (e) => { if (e.target.checked) apply('right', 'text'); });

  // Default panels state
  leftPanel.classList.toggle('text-mode', state.leftMode === 'text');
  rightPanel.classList.toggle('text-mode', state.rightMode === 'text');
}

function setupTyping() {
  const lt = document.getElementById('left-text');
  const rt = document.getElementById('right-text');
  lt.addEventListener('input', () => { state.leftTyped = lt.value; renderDiff(); });
  rt.addEventListener('input', () => { state.rightTyped = rt.value; renderDiff(); });
}

function init() {
  $('#pick-left').addEventListener('click', () => pick('left'));
  $('#pick-right').addEventListener('click', () => pick('right'));

  setupDropzone($('#left-drop'), 'left');
  setupDropzone($('#right-drop'), 'right');

  setupModeControls();
  setupTyping();
  setupDiffOptionsControls();
  setupThemeControls();
}

document.addEventListener('DOMContentLoaded', init);

