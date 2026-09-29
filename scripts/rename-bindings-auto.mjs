// 单字母局部绑定语义化改名工具（作用域感知，只改绑定标识符本身）。
//
//   node scripts/rename-bindings-auto.mjs --file <rel> --report
//   node scripts/rename-bindings-auto.mjs --file <rel> --table <json> [--dry]
//
// 表：{ "<函数键|@module>": { "<旧名>": "<新名>" } }
// 一名多义用行区间拆分：{ "<旧名>": [{name,fromLine,toLine}, ...] }
//
// 约束：只替换 binding.identifier / referencePaths / 赋值左值，不触碰成员属性 a.x、对象键、
// JSDoc、字符串；位置编辑不改行数与行尾；函数键与旧名必须命中；拆分区间必须穷尽且不重叠；
// 写盘后断言行数、字面量多重集、导出集合不变。指标口径同 audit-architecture.mjs。
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const SINGLE = /^[A-Za-z]$/;
const arg = (n, f = null) => {
  const i = process.argv.indexOf('--' + n);
  if (i === -1) return f;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
};

const fileRel = arg('file');
if (!fileRel) { console.error('缺少 --file'); process.exit(2); }
const FILE = path.resolve(process.cwd(), fileRel);
const src = fs.readFileSync(FILE, 'utf8');
const lineOf = (pos) => src.slice(0, pos).split('\n').length;

function fnKeyFor(p) {
  const node = p.node;
  if (node.type === 'FunctionDeclaration' && node.id) return node.id.name;
  const parent = p.parentPath;
  if (parent && parent.node.type === 'AssignmentExpression' && parent.node.right === node) {
    const l = parent.node.left;
    if (l.type === 'MemberExpression' && !l.computed && l.property.type === 'Identifier') {
      if (l.object.type === 'MemberExpression' && !l.object.computed
        && l.object.object.type === 'Identifier' && l.object.property.name === 'prototype') {
        return l.object.object.name + '.' + l.property.name;
      }
      if (l.object.type === 'Identifier') return l.object.name + '.' + l.property.name;
    }
  }
  return null;
}

const kindOf = (b) => {
  const t = b.path.node.type;
  if (t === 'FunctionDeclaration') return 'function';
  if (t === 'ClassDeclaration' || t === 'ClassExpression') return 'class';
  if (t.indexOf('Import') === 0) return 'import';
  return b.kind;
};

function collectNodes(b, onError) {
  const nodes = [b.identifier];
  for (const rp of b.referencePaths) {
    if (rp.node.type !== 'Identifier') { onError(b.identifier.name + ': 引用不是 Identifier'); continue; }
    nodes.push(rp.node);
  }
  for (const v of b.constantViolations) {
    const n = v.node;
    if (n.type === 'AssignmentExpression') nodes.push(n.left);
    else if (n.type === 'UpdateExpression') nodes.push(n.argument);
    else if (n.type === 'VariableDeclarator') nodes.push(n.id);
    else if (n.type === 'Identifier') nodes.push(n);
    else onError(b.identifier.name + ': 未支持的赋值形态 ' + n.type);
  }
  const uniq = new Map();
  for (const n of nodes) uniq.set(n.start + ':' + n.end, n);
  return [...uniq.values()];
}

const seenStarts = new Set();
const byKey = new Map();
const push = (key, b) => {
  if (seenStarts.has(b.identifier.start)) return;
  seenStarts.add(b.identifier.start);
  if (!byKey.has(key)) byKey.set(key, []);
  byKey.get(key).push(b);
};

traverse(parse(src, { sourceType: 'module' }), {
  'FunctionDeclaration|FunctionExpression'(p) {
    const key = fnKeyFor(p);
    if (!key) return;
    for (const b of Object.values(p.scope.bindings)) {
      if (!SINGLE.test(b.identifier.name)) continue;
      if (b.scope !== p.scope && !(b.kind === 'var' && b.scope.parent === p.scope)) continue;
      push(key, b);
    }
  },
  Program(p) {
    for (const b of Object.values(p.scope.bindings)) {
      if (SINGLE.test(b.identifier.name) && b.scope === p.scope) push('@module', b);
    }
  },
  Scope(p) {
    for (const b of Object.values(p.scope.bindings)) {
      if (SINGLE.test(b.identifier.name) && !seenStarts.has(b.identifier.start)) push('@other', b);
    }
  },
});

export function scanBindings() {
  const rows = [];
  for (const [key, bindings] of byKey) {
    for (const b of bindings) {
      const nodes = collectNodes(b, () => {});
      const lines = nodes.map((n) => lineOf(n.start));
      rows.push({ key, name: b.identifier.name, kind: kindOf(b), nodes,
        declLine: lineOf(b.identifier.start), occurrences: nodes.length,
        fromLine: Math.min(...lines), toLine: Math.max(...lines), violations: b.constantViolations.length });
    }
  }
  rows.sort((x, y) => (x.key === '@other' ? 1 : 0) - (y.key === '@other' ? 1 : 0)
    || String(x.key).localeCompare(String(y.key)) || x.declLine - y.declLine);
  return rows;
}

function literalMultiset(text) {
  const acc = [];
  traverse(parse(text, { sourceType: 'module' }), {
    StringLiteral(p) { acc.push('S' + p.node.value); },
    NumericLiteral(p) { acc.push('N' + p.node.value); },
    BigIntLiteral(p) { acc.push('B' + p.node.value); },
    RegExpLiteral(p) { acc.push('R' + p.node.pattern); },
    ExportNamedDeclaration(p) {
      const d = p.node.declaration;
      if (d && d.id) acc.push('E' + d.id.name);
      if (d && d.type === 'VariableDeclaration') {
        for (const dd of d.declarations) if (dd.id.type === 'Identifier') acc.push('E' + dd.id.name);
      }
      for (const s of p.node.specifiers || []) acc.push('E' + s.exported.name);
    },
  });
  return acc.sort().join('|');
}

if (arg('report')) {
  const rows = scanBindings();
  console.log(fileRel + ': 单字母绑定 ' + rows.length + ' 个，函数键 ' + new Set(rows.map((r) => r.key)).size + ' 个');
  for (const r of rows) {
    const where = (r.toLine > r.fromLine || r.violations > 0)
      ? '行 ' + r.fromLine + '-' + r.toLine + ' 重赋值 ' + r.violations
      : '行 ' + r.fromLine;
    console.log('  ' + String(r.key).padEnd(32) + ' ' + r.name + '  ' + String(r.kind).padEnd(8)
      + ' ×' + String(r.occurrences).padStart(3) + '  ' + where);
  }
  const other = rows.filter((r) => r.key === '@other');
  if (other.length) console.log('注意：' + other.length + ' 个不在具名函数键下（匿名函数/块作用域/对象方法），需按行号人工定位。');
  process.exit(0);
}

const tablePath = arg('table');
if (!tablePath) { console.error('缺少 --table <json> 或 --report'); process.exit(2); }
const table = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), tablePath), 'utf8'));
const errors = [];
const edits = [];
const bindingIndex = new Map();
for (const [key, bindings] of byKey) {
  const m = new Map();
  for (const b of bindings) m.set(b.identifier.name, b);
  bindingIndex.set(key, m);
}

for (const [key, entries] of Object.entries(table)) {
  const m = bindingIndex.get(key);
  if (!m) { errors.push('函数键未命中任何单字母绑定: ' + key); continue; }
  for (const [oldName, spec] of Object.entries(entries)) {
    const binding = m.get(oldName);
    if (!binding) { errors.push(key + ': 找不到单字母绑定 "' + oldName + '"'); continue; }
    const nodes = collectNodes(binding, (msg) => errors.push(key + ': ' + msg));
    const windows = typeof spec === 'string' ? [{ name: spec, fromLine: -Infinity, toLine: Infinity }] : spec;
    if (windows.find((w) => !w || !w.name || !/^[A-Za-z_$][\w$]*$/.test(w.name))) {
      errors.push(key + '.' + oldName + ': 新名不合法'); continue;
    }
    if (windows.some((w) => w.name !== oldName && m.has(w.name))) {
      errors.push(key + '.' + oldName + ': 新名与该函数已有语义名冲突'); continue;
    }
    const covered = nodes.map((n) => {
      const ln = lineOf(n.start);
      return windows.filter((w) => ln >= w.fromLine && ln <= w.toLine).length;
    });
    const uncovered = covered.filter((c) => c === 0).length;
    const doubled = covered.filter((c) => c > 1).length;
    if (uncovered || doubled) {
      const miss = nodes.filter((n, i) => covered[i] === 0).map((n) => lineOf(n.start));
      errors.push(key + '.' + oldName + ': 区间不完整（未覆盖 ' + uncovered + ' 处：行 '
        + miss.slice(0, 12).join(',') + '；重叠 ' + doubled + ' 处）');
      continue;
    }
    nodes.forEach((n) => {
      const ln = lineOf(n.start);
      const w = windows.find((x) => ln >= x.fromLine && ln <= x.toLine);
      edits.push({ start: n.start, end: n.end, text: w.name });
    });
  }
}

if (errors.length) { console.error('拒绝写盘，错误 ' + errors.length + ' 条:\n' + errors.join('\n')); process.exit(1); }

const seen = new Map();
for (const e of edits) {
  const k = e.start + ':' + e.end;
  if (seen.has(k) && seen.get(k).text !== e.text) { console.error('同位置不同改名: ' + k); process.exit(1); }
  seen.set(k, e);
}
const deduped = [...seen.values()].sort((x, y) => y.start - x.start);
for (let i = 1; i < deduped.length; i++) {
  if (deduped[i].end > deduped[i - 1].start) { console.error('编辑区间重叠'); process.exit(1); }
}
let out = src;
for (const e of deduped) out = out.slice(0, e.start) + e.text + out.slice(e.end);

const linesOk = src.split('\n').length === out.split('\n').length;
const literalsOk = literalMultiset(src) === literalMultiset(out);
const loneLfOk = out.replace(/\r\n/g, '').includes('\n') === src.replace(/\r\n/g, '').includes('\n');
parse(out, { sourceType: 'module' });
console.log('标识符编辑 ' + deduped.length + ' 处；行数不变 ' + linesOk + '；字面量+导出不变 ' + literalsOk + '；行尾保持 ' + loneLfOk);
if (!linesOk || !literalsOk || !loneLfOk) { console.error('自检失败，拒绝写盘'); process.exit(1); }
if (arg('dry')) { console.log('（--dry 未写盘）'); process.exit(0); }
fs.writeFileSync(FILE, out);
const left = scanBindingsOf(out);
function scanBindingsOf(text) {
  let n = 0;
  traverse(parse(text, { sourceType: 'module' }), {
    Scope(p) { for (const b of Object.values(p.scope.bindings)) if (SINGLE.test(b.identifier.name)) n += 1; },
  });
  return n;
}
console.log('写盘完成：' + fileRel + ' 剩余单字母绑定（全作用域口径）' + left);
