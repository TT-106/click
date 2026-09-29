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
// --cryptic：把混淆器风格的两位短名（qa / la / Gb / Ua 这类）一并纳入改名范围。
// 默认口径保持不变（只名单字母），避免影响正在并行使用本工具的任务；
// 白名单外的短名才算债，新增白名单项必须在 review 里说明理由。
const CRYPTIC_ALLOW = new Set([
  'x', 'y', 'z',
  'id', 'to', 'on', 'in', 'at', 'if', 'no', 'ok', 'is', 'of',
  'xp', 'ui', 'db', 'hq',
]);
const WANT_CRYPTIC = process.argv.includes('--cryptic');
// 短名口径含 `$` 前缀（实测 src/engine/modules 里有 `$` x3、`$c` x3 共 6 个纯混淆名）；
// 不纳入的话这 6 个永远不进指标、也永远没人改。
const MATCH = WANT_CRYPTIC
  ? (name) => /^[$A-Za-z]{1,2}$/.test(name) && !CRYPTIC_ALLOW.has(name)
  : (name) => SINGLE.test(name) || name === '$';
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

/** 该绑定全部"可改名"的标识符节点，带上下文：赋值左侧的节点额外记录其右值起始位置，
 *  供拆分改名时把 `a = x` 整段改写成 `var a新名 = x`（一次连续区间替换，不留 `var y = y = x`）。 */
/** 子树里是否读到这个名字本身。自带递归 walker：babel 的 traverse 对裸节点要求
 *  scope/parentPath，从一个非 Program 节点起遍会直接抛错。
 *  跳过 a.foo 里的 foo 与 {a: 1} 里的键——它们是属性名，不是对本绑定的读取。 */
function readsName(subtree, name) {
  const stack = [subtree];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (Array.isArray(node)) { stack.push(...node); continue; }
    if (node.type === 'Identifier' && node.name === name) return true;
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'type' || key === 'extra') continue;
      // 非计算成员表达式的属性名、对象字面量的键：都不是标识符读取
      if ((node.type === 'MemberExpression' && !node.computed && key === 'property')
        || ((node.type === 'ObjectProperty' || node.type === 'Property') && key === 'key')) continue;
      // 函数/类的形参名与内部同名声明属于另一个作用域，保守起见仍继续遍历（会由区间覆盖检查兜住）
      stack.push(node[key]);
    }
  }
  return false;
}

function collectEntries(b, onError) {
  const entries = [{ node: b.identifier, role: 'decl' }];
  for (const rp of b.referencePaths) {
    if (rp.node.type !== 'Identifier') { onError(b.identifier.name + ': 引用不是 Identifier'); continue; }
    entries.push({ node: rp.node, role: 'ref' });
  }
  for (const v of b.constantViolations) {
    const n = v.node;
    if (n.type === 'AssignmentExpression') {
      entries.push({
        node: n.left,
        // 复合赋值（a += x / a ||= y）不是"重新绑定"，改成 var 会丢掉旧值累积
        role: n.operator === '=' ? 'assign' : 'compound',
        assignRightStart: n.right.start,
        // 右值读到本绑定（a = a + 1、a = a.bookcasesLooted）：拆名后会变成
        // var y = y + 1（NaN）或 var y = y.prop（TypeError），必须拒绝
        selfReadInRight: readsName(n.right, b.identifier.name),
      });
    } else if (n.type === 'UpdateExpression') entries.push({ node: n.argument, role: 'update' });
    else if (n.type === 'VariableDeclarator') entries.push({ node: n.id, role: 'declarator' });
    // for-in / for-of 的头既是"写"也是绑定本身的赋值点。
    // 缺这一支时，`for (se in spells)` 这类改名的自检会报"未支持的赋值形态"，
    // 整表被拒（R27 game-save 切片实测，被迫手工改 3 处）。
    else if (n.type === 'ForInStatement' || n.type === 'ForOfStatement') entries.push({ node: n.left, role: 'forhead' });
    else if (n.type === 'Identifier') entries.push({ node: n, role: 'other' });
    else onError(b.identifier.name + ': 未支持的赋值形态 ' + n.type);
  }
  const uniq = new Map();
  for (const e of entries) uniq.set(e.node.start + ':' + e.node.end, e);
  return [...uniq.values()];
}

function collectNodes(b, onError) {
  return collectEntries(b, onError).map((e) => e.node);
}

const seenStarts = new Map();
const byKey = new Map();
const scopeNamesByKey = new Map(); // 函数键 -> 该作用域内**全部**绑定名（含非短名），用于新名冲突检测
const push = (key, b) => {
  if (seenStarts.has(b.identifier.start)) return;
  seenStarts.set(b.identifier.start, true);
  if (!byKey.has(key)) byKey.set(key, []);
  byKey.get(key).push(b);
};
/** 把作用域里的所有名字（不只是短名）登记为该键的"已占用名"。
 *  缺了这一步，把一个字母拆/改成函数里已存在的语义名会写出重复 var——
 *  `var view = "existing"` 之后再落一条 `var view = 2` 是合法 JS，
 *  后者直接覆盖前者的值，tsc 与四条自检都不报错（R26 party-creation 切片实测）。 */
const registerScopeNames = (key, scope) => {
  const set = scopeNamesByKey.get(key) || new Set();
  // 只下钻块/try/catch 这类"同一个函数体内"的作用域：
  // 函数级 `var item` 与块内 `let item` 同名是硬语法错误（already declared），必须看见；
  // 嵌套函数自己的形参只是合法遮蔽，不下钻，否则常见名字（item/view/row）全被误判成冲突。
  const FUNCTIONISH = new Set(['function', 'arrow-function', 'class-method', 'method', 'module']);
  const add = (s) => {
    for (const name of Object.keys(s.bindings)) set.add(name);
    for (const child of s.childScopes || []) if (!FUNCTIONISH.has(child.type)) add(child);
  };
  add(scope);
  scopeNamesByKey.set(key, set);
};

traverse(parse(src, { sourceType: 'module' }), {
  'FunctionDeclaration|FunctionExpression'(p) {
    const key = fnKeyFor(p);
    if (!key) return;
    registerScopeNames(key, p.scope);
    for (const b of Object.values(p.scope.bindings)) {
      if (!MATCH(b.identifier.name)) continue;
      if (b.scope !== p.scope && !(b.kind === 'var' && b.scope.parent === p.scope)) continue;
      push(key, b);
    }
  },
  Program(p) {
    registerScopeNames('@module', p.scope);
    for (const b of Object.values(p.scope.bindings)) {
      if (MATCH(b.identifier.name) && b.scope === p.scope) push('@module', b);
    }
  },
  Scope(p) {
    for (const b of Object.values(p.scope.bindings)) {
      if (MATCH(b.identifier.name) && !seenStarts.has(b.identifier.start)) push('@other', b);
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
  console.log(`${fileRel}: ${WANT_CRYPTIC ? '短名（1–2 字母，白名单外）' : '单字母'}绑定 ${rows.length} 个，函数键 ${new Set(rows.map((r) => r.key)).size} 个`);
  for (const r of rows) {
    const where = (r.toLine > r.fromLine || r.violations > 0)
      ? '行 ' + r.fromLine + '-' + r.toLine + ' 重赋值 ' + r.violations
      : '行 ' + r.fromLine;
    const lookup = r.key === '@other' ? r.name + '@' + r.declLine : r.name;
    console.log('  ' + String(r.key).padEnd(32) + ' ' + lookup + '  ' + String(r.kind).padEnd(8)
      + ' ×' + String(r.occurrences).padStart(3) + '  ' + where);
  }
  const other = rows.filter((r) => r.key === '@other');
  if (other.length) console.log('注意：@other 行的绑定不在具名函数键下（匿名函数/块作用域/对象方法），表里的旧名请写成 名@声明行。');
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
  for (const b of bindings) {
    // @other 里的同名绑定是彼此独立的（每个匿名作用域各有一个 a），必须按声明行区分。
    const lookup = key === '@other' ? `${b.identifier.name}@${lineOf(b.identifier.start)}` : b.identifier.name;
    if (m.has(lookup)) { console.error(`内部错误：${key} 下重复键 ${lookup}`); process.exit(1); }
    m.set(lookup, b);
  }
  bindingIndex.set(key, m);
}

for (const [key, entries] of Object.entries(table)) {
  const m = bindingIndex.get(key);
  if (!m) { errors.push('函数键未命中任何单字母绑定: ' + key); continue; }
  for (const [oldName, spec] of Object.entries(entries)) {
    const binding = m.get(oldName);
    if (!binding) { errors.push(key + ': 找不到单字母绑定 "' + oldName + '"'); continue; }
    const nodeEntries = collectEntries(binding, (msg) => errors.push(key + ': ' + msg));
    const nodes = nodeEntries.map((e) => e.node);
    const windows = typeof spec === 'string' ? [{ name: spec, fromLine: -Infinity, toLine: Infinity }] : spec;
    if (windows.find((w) => !w || !w.name || !/^[A-Za-z_$][\w$]*$/.test(w.name))) {
      errors.push(key + '.' + oldName + ': 新名不合法'); continue;
    }
    const occupied = scopeNamesByKey.get(key) || new Set();
    const clash = windows.find((w) => w.name !== oldName && occupied.has(w.name));
    if (clash) {
      errors.push(`${key}.${oldName}: 新名 "${clash.name}" 在该函数作用域里已被占用——`
        + '改名会写出重复声明（var 重声明会覆盖既有值；块级 let 同名直接 SyntaxError）。换一个名字。');
      continue;
    }
    const dupWindow = windows.map((w) => w.name).filter((n, i, arr) => arr.indexOf(n) !== i);
    if (dupWindow.length) {
      errors.push(`${key}.${oldName}: 同一绑定的多个区间用了相同新名 ${[...new Set(dupWindow)].join(',')}（等于没拆）`);
      continue;
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
    // 拆分后每个新名字都必须有声明点。原绑定的声明只落在其中一个区间；其余区间若只改名，
    // `a = x` 就变成给未声明变量赋值——ESM 严格模式 ReferenceError、tsc TS2304，
    // 而"行数不变 / 字面量不变 / 导出不变"三项断言全都察觉不到（R26 targeting 切片实测出这个洞）。
    // 做法：该区间内第一次出现若是赋值左侧，就把 `a = ` 整段（到右值起始处）改写成 `var 新名 = `，
    // 一次连续替换，绝不产生 `var y = y = x` 这种双重赋值；行数与求值次序都不变。
    // 第一次出现不是赋值（读、自增、裸 for-init 等）就拒绝这一刀并说明原因——
    // 那种位置要改必须先做结构性改写，超出"只改绑定名"的授权。
    const declLine = lineOf(binding.identifier.start);
    const declareSpans = new Map();
    let blocked = false;
    for (const w of windows) {
      if (windows.length === 1) break;
      if (declLine >= w.fromLine && declLine <= w.toLine) continue;
      const inWin = nodeEntries
        .filter((e) => lineOf(e.node.start) >= w.fromLine && lineOf(e.node.start) <= w.toLine)
        .sort((x, y) => x.node.start - y.node.start);
      const first = inWin[0];
      const unsafeRole = !first || first.role !== 'assign';
      const selfRead = first && first.role === 'assign' && first.selfReadInRight;
      if (unsafeRole || selfRead) {
        const why = !first ? '该区间没有任何出现'
          : unsafeRole ? `第一次出现（行 ${lineOf(first.node.start)}，形态 ${first.role}）不是单纯赋值左侧`
            : `第一次出现（行 ${lineOf(first.node.start)}）的右值仍读到本绑定`;
        errors.push(`${key}.${oldName}: 区间 ${w.fromLine}-${w.toLine} 不含声明点，且${why}——`
          + '直接改名会引用未声明变量或把旧值丢掉（a += x 变 var y = x；a = a + 1 变 var y = y + 1 得 NaN）。'
          + '保留原字母，或另行授权结构性改写。');
        blocked = true;
        continue;
      }
      declareSpans.set(first.node.start + ':' + first.node.end, {
        start: first.node.start, end: first.assignRightStart, text: 'var ' + w.name + ' = ',
      });
    }
    if (blocked) continue;
    for (const e of nodeEntries) {
      const ln = lineOf(e.node.start);
      const w = windows.find((x) => ln >= x.fromLine && ln <= x.toLine);
      const span = declareSpans.get(e.node.start + ':' + e.node.end);
      if (span) { edits.push({ start: span.start, end: span.end, text: span.text }); continue; }
      edits.push({ start: e.node.start, end: e.node.end, text: w.name });
    }
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
    Scope(p) { for (const b of Object.values(p.scope.bindings)) if (MATCH(b.identifier.name)) n += 1; },
  });
  return n;
}
console.log('写盘完成：' + fileRel + ' 剩余单字母绑定（全作用域口径）' + left);
