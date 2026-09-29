// 单字母局部绑定语义化改名工具（作用域感知，只改绑定标识符本身）。
//
//   node scripts/rename-bindings-v2.mjs --file <rel> --report
//   node scripts/rename-bindings-v2.mjs --file <rel> --table <json> [--dry]
//
// 表：{ "<函数键|@module>": { "<旧名>": "<新名>" } }
// 一名多义用行区间拆分：{ "<旧名>": [{name,fromLine,toLine}, ...] }
//
// 约束：只替换 binding.identifier / referencePaths / 赋值左值，不触碰成员属性 a.x、对象键、
// JSDoc、字符串；位置编辑不改行数与行尾；函数键与旧名必须命中；拆分区间必须穷尽且不重叠；
// 写盘后断言行数、字面量多重集、导出集合不变。指标口径同 audit-architecture.mjs。
//
// ---- output/rename-next.mjs 相对 scripts/ 版本的增量（本波次试验田，勿直接依赖）----
// 1) 区间可写 {"name":"quantityRow","fromLine":4,"toLine":9,"rhsKeep":"buttonTable"}：
//    该区间第一次出现是"自读写"（`b = b.insertRow(1)`，左值是本绑定、右值又读到本绑定）时，
//    左值改写成新名，而**落在这条赋值右值区间内的本绑定出现**一律改写成 rhsKeep 指定的名字
//    （= 上一段的新名）。天真地把右值也改成本段新名会得到 `var q = q.insertRow(1)`，
//    运行时 undefined/NaN，而行数/字面量/导出三项自检全都察觉不到。
//    表里写了 rhsKeep 但右值不含本绑定 → 拒绝（误用）；右值含本绑定但没给 rhsKeep → 拒绝并提示可用 rhsKeep。
// 2) 区间第一次出现是 `var a = 右值`（var 重声明，形态 declarator）时视为自带声明点：只改名、不插 var。
//    裸 `var a;`（无 init）仍然拒绝——重声明不赋值，拆名后本段读到的是 undefined。
// 3) 循环携带闸：自读写所在循环内若还有**属于其它区间**的本绑定出现 → 拒绝。
//    那种值是跨迭代携带的累加器/游标（`a += n` / `i = i + 1` 一族），按行拆段会让下一轮读到 undefined；
//    这正是 R4 要原样保留的原版怪癖，不能被"看起来更干净"的改名破坏。（偏保守：循环内每轮都会重写的
//    安全形状也会被拒，宁可让人工处理，不放过跨迭代的。）
// 4) 语法位置：`if (d = x, d.y)` 的逗号表达式、`for (b = c = 0; ...)` 的链式赋值这类位置，
//    插 `var` 会写出非法语法——旧实现在写盘前的重新解析处抛裸 SyntaxError，现在改成显式拒绝并说明原因。
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
    entries.push({ node: rp.node, role: 'ref', path: rp });
  }
  for (const v of b.constantViolations) {
    const n = v.node;
    if (n.type === 'AssignmentExpression') {
      entries.push({
        node: n.left,
        // 复合赋值（a += x / a ||= y）不是"重新绑定"，改成 var 会丢掉旧值累积
        role: n.operator === '=' ? 'assign' : 'compound',
        assignRightStart: n.right.start,
        assignRightEnd: n.right.end,
        rightNode: n.right,
        path: v,
        // 右值读到本绑定（a = a + 1、a = a.bookcasesLooted）：天真拆名会变成
        // var y = y + 1（NaN）或 var y = y.prop（TypeError）。
        // 现在这类"自读写"可以走 rhsKeep（把右值映射到上一段的新名）放行；
        // 没给 rhsKeep 时仍拒绝。
        selfReadInRight: readsName(n.right, b.identifier.name),
      });
    } else if (n.type === 'UpdateExpression') entries.push({ node: n.argument, role: 'update' });
    else if (n.type === 'VariableDeclarator') {
      // 中段 var 重声明：`var a = 右值`。var 关键字本就在行内（或本就在同一条 var 语句的句首），
      // 所以这一刀自带声明点——只改名，不插 var。init 缺省（裸 `var a;`）时重声明**不赋值**，
      // 拆名会让本段读到 undefined，必须拒绝。
      entries.push({
        node: n.id,
        role: 'declarator',
        assignRightStart: n.init ? n.init.start : null,
        assignRightEnd: n.init ? n.init.end : null,
        rightNode: n.init || null,
        path: v,
        selfReadInRight: n.init ? readsName(n.init, b.identifier.name) : false,
      });
    }
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

const LOOP_TYPES = new Set(['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement']);
const FUNC_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression',
  'ClassMethod', 'ObjectMethod', 'ClassPrivateMethod']);

/** path 走到 stopNode（含）的路上是否跨过一个函数边界。跨过 → 这次读取是"延后读"
 *  （闭包/回调，真正执行时刻在赋值之后），rhsKeep 的"上一段的名字"就不再等价，必须拒绝。
 *  走不到 stopNode（结构意外）也按延后读处理——宁可拒多。
 *  从 path 自己开始走：`a = a` 这种"右值整个就是本绑定"的退化形状里 path.node 就是 stopNode。 */
function crossesFunctionOrMissing(path, stopNode) {
  let p = path;
  let guard = 0;
  while (p && guard++ < 4000) {
    if (p.node === stopNode) return false;
    if (FUNC_TYPES.has(p.node.type)) return true;
    p = p.parentPath;
  }
  return true;
}

/** path 的所有祖先循环（源文本范围用于判定"同一循环内还有别的区间出现"）。 */
function enclosingLoops(path) {
  const loops = [];
  let p = path ? path.parentPath : null;
  let guard = 0;
  while (p && guard++ < 4000) {
    if (LOOP_TYPES.has(p.node.type)) loops.push(p.node);
    p = p.parentPath;
  }
  return loops;
}

/** 插 `var` 的安全语法位置：只有"整条 ExpressionStatement 就是这个赋值"才合法。
 *  `if (d = x, d.y)`（逗号表达式）、`for (b = c = 0; ...)`（链式/for 头）、`return a = 1`、
 *  `() => a = 1` 都不行——旧实现在那里会写出非法语法，然后在写盘前的重新解析处抛裸 SyntaxError。 */
function varInsertPositionSafe(path) {
  const p = path && path.parentPath;
  if (!p) return false;
  return p.node.type === 'ExpressionStatement' && p.node.expression === path.node;
}

/** 支配性：插进去的 `var y = ...` 只有无条件执行才安全。
 *  `if (x) { a = a + 1 } out.push(a)` 拆成 `if (x) { var y = seed+1 } out.push(y)` 后，
 *  x 为假时 y 是 undefined —— 行数/字面量/导出/行尾四条自检全都看不见（夹具
 *  gap-conditional-first-write 实证：x=false 时 [0] 变 [null]）。
 *  这里取结构化代码的保守近似：声明点的分支链必须被本区间每一处出现包含。 */
const BRANCH_TYPES = new Set(['IfStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement',
  'WhileStatement', 'DoWhileStatement', 'SwitchStatement', 'TryStatement',
  'ConditionalExpression', 'LogicalExpression']);

function branchChain(path) {
  const chain = [];
  let p = path ? path.parentPath : null;
  let guard = 0;
  while (p && guard++ < 4000) {
    if (FUNC_TYPES.has(p.node.type)) break;
    // test / discriminant 自己就是"决定走不走"的位置，不算被分支保护
    if (BRANCH_TYPES.has(p.node.type) && p.key !== 'test' && p.key !== 'discriminant') chain.push(p.node);
    p = p.parentPath;
  }
  return chain;
}

function escapesChain(declChain, occPath) {
  const occ = branchChain(occPath);
  return !declChain.every((nd) => occ.includes(nd));
}

// collectNodes 已并入 collectEntries（--report 现在还要看右值自读），不再单列。
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
      const entries = collectEntries(b, () => {});
      const nodes = entries.map((e) => e.node);
      const lines = nodes.map((n) => lineOf(n.start));
      rows.push({ key, name: b.identifier.name, kind: kindOf(b), nodes,
        declLine: lineOf(b.identifier.start), occurrences: nodes.length,
        fromLine: Math.min(...lines), toLine: Math.max(...lines), violations: b.constantViolations.length,
        // 右值读到本绑定的写点：拆名时可以用 rhsKeep 放行（见文件头说明）
        selfReads: entries.filter((e) => e.selfReadInRight).length });
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
      + ' ×' + String(r.occurrences).padStart(3) + '  ' + where
      + (r.selfReads ? '  右值自读 ' + r.selfReads + '（拆分需 rhsKeep）' : ''));
  }
  const other = rows.filter((r) => r.key === '@other');
  if (other.length) console.log('注意：@other 行的绑定不在具名函数键下（匿名函数/块作用域/对象方法），表里的旧名请写成 名@声明行。');
  if (rows.some((r) => r.selfReads)) {
    console.log('提示：形如 a = a.x / a = a + 1 的"自读写"在拆分区间里可写 {"name":"新名","fromLine":L,"toLine":M,"rhsKeep":"上一段的新名"}，'
      + '工具会把该赋值右值里的本绑定映射到上一段的新名（右值必须映射到上一段，否则得到 var y = y.x）。');
  }
  process.exit(0);
}

const tablePath = arg('table');
if (!tablePath) { console.error('缺少 --table <json> 或 --report'); process.exit(2); }
const table = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), tablePath), 'utf8'));
const errors = [];
const waivers = []; // 支配性豁免记录：写盘前打印，供人工复核（不静默放行）
const edits = [];
let rhsKeepApplied = 0;
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
    // 两种自带/可补齐声明点的形态：
    //   assign     `a = 右值`  → 把 `a = ` 整段（到右值起始处）改写成 `var 新名 = `，一次连续替换，
    //                            绝不产生 `var y = y = x` 这种双重赋值；行数与求值次序都不变。
    //                            前提是这条赋值整行就是一条语句（见 varInsertPositionSafe）。
    //   declarator `var a = 右值`（var 重声明）→ var 关键字本就在行内，只改名，不插 var。
    // 其余第一次出现形态（读、自增、复合赋值、for-in/of 头……）一律拒绝这一刀并说明原因——
    // 那种位置要改必须先做结构性改写，超出"只改绑定名"的授权。
    // 右值读到本绑定（自读写）时：必须由表里显式给出 rhsKeep（上一段的新名），并且过循环携带闸。
    const declLine = lineOf(binding.identifier.start);
    const declareSpans = new Map();
    const rhsKeepRanges = [];
    const winOf = new Map();
    for (const e of nodeEntries) {
      const ln = lineOf(e.node.start);
      winOf.set(e, windows.find((x) => ln >= x.fromLine && ln <= x.toLine));
    }
    let blocked = false;
    const reject = (w, msg) => {
      errors.push(`${key}.${oldName}: 区间 ${w.fromLine}-${w.toLine} ${msg}`);
      blocked = true;
    };
    if (windows.length === 1) {
      if (windows.some((w) => w.rhsKeep !== undefined && w.rhsKeep !== null)) {
        errors.push(`${key}.${oldName}: 单区间整体改名不需要 rhsKeep——所有出现都换成同一个名字，`
          + 'a = a.r 改名后仍是 y = y.r，等价。删掉 rhsKeep。');
        continue;
      }
    }
    for (const w of windows) {
      if (windows.length === 1) break;
      if (w.rhsKeep !== undefined && w.rhsKeep !== null && declLine >= w.fromLine && declLine <= w.toLine) {
        reject(w, `含原声明点，不需要 rhsKeep:"${w.rhsKeep}"（该段的自读写改名后仍自读，等价）。删掉 rhsKeep。`);
        continue;
      }
      if (declLine >= w.fromLine && declLine <= w.toLine) continue;
      const inWin = nodeEntries
        .filter((e) => lineOf(e.node.start) >= w.fromLine && lineOf(e.node.start) <= w.toLine)
        .sort((x, y) => x.node.start - y.node.start);
      const first = inWin[0];
      const keep = w.rhsKeep;
      const isWrite = !!first && (first.role === 'assign' || first.role === 'declarator');
      const firstLine = first ? lineOf(first.node.start) : 0;
      if (!first || !isWrite) {
        const why = !first ? '该区间没有任何出现'
          : `第一次出现（行 ${firstLine}，形态 ${first.role}）不是单纯赋值左侧`;
        reject(w, `不含声明点，且${why}——`
          + '直接改名会引用未声明变量或把旧值丢掉（a += x 变 var y = x；a = a + 1 变 var y = y + 1 得 NaN）。'
          + '保留原字母，或另行授权结构性改写。rhsKeep 只放行"右值读到本绑定"这一类，救不了这一条。');
        continue;
      }
      if (first.role === 'declarator' && first.assignRightStart === null) {
        reject(w, `的第一次出现（行 ${firstLine}）是裸 var 重声明（没有 init）——重声明不赋值，`
          + '拆名后本段读到的是 undefined 而不是上一段的值。保留原字母，或先做结构性改写。');
        continue;
      }
      const selfRead = !!first.selfReadInRight;
      if (selfRead && !keep) {
        reject(w, '不含声明点，且第一次出现（行 ' + firstLine + '）的右值读到本绑定（`a = a.x` / `a = a + 1` 形状）——'
          + '天真拆名会得到 var y = y.x（undefined/TypeError）或 var y = y + 1（NaN），'
          + '而"行数不变 / 字面量不变 / 导出不变"三条自检全都发现不了。'
          + '若右值读的是**上一段**的值，给这个区间加 "rhsKeep":"上一段的新名" 重试'
          + '（例如 {"name":"quantityRow","fromLine":4,"toLine":9,"rhsKeep":"buttonTable"}，'
          + '会把右值里的本绑定映射成 buttonTable）；若是循环里跨迭代携带的累加器/游标，请保留原字母。');
        continue;
      }
      if (keep && !selfRead) {
        reject(w, `写了 rhsKeep:"${keep}"，但第一次出现（行 ${firstLine}）的右值并没有读到本绑定——`
          + 'rhsKeep 用错了位置（写了却不生效会被静默忽略，所以这里直接拒绝）。删掉它，或把 rhsKeep 放到自读写那一段。');
        continue;
      }
      if (keep) {
        if (typeof keep !== 'string' || !/^[A-Za-z_$][\w$]*$/.test(keep)) {
          reject(w, '的 rhsKeep 不是合法标识符: ' + JSON.stringify(keep));
          continue;
        }
        if (keep === w.name) {
          reject(w, `的 rhsKeep 与本区间新名同名（都是 "${keep}"）——那正是 var y = y.x 的破坏形状，`
            + '右值必须落到**上一段**的新名上。');
          continue;
        }
        if (!windows.some((x) => x !== w && x.name === keep)) {
          reject(w, `的 rhsKeep:"${keep}" 不是本绑定任何其他区间的新名——自读写的右值只能映射到同一绑定另一段的新名，`
            + '写成别的名字会引用作用域里不存在的变量（ReferenceError，三项自检看不见）。'
            + '本表可用名：' + windows.map((x) => x.name).join(' / '));
          continue;
        }
        // 循环携带闸（关键安全条件）。两条：
        //  1) 同一个循环内还有属于其它区间的本绑定出现 → 拒绝（表式规定的闸）。
        //  2) 本循环内没有"更早的、其它区间的写"重新赋值本绑定 → 也拒绝：右值读到的值只可能来自
        //     上一轮迭代（累加器 `a = a + rows[i]`）或循环之前（游标 `a = a.cloneNode()`），
        //     拆段后它不再跨迭代推进，而三项自检全看不见。这是 1) 漏掉的那一半。
        const WRITE_ROLES = new Set(['assign', 'declarator', 'update', 'compound', 'forhead', 'decl']);
        const inRhsOfFirst = (e) => e.node.start >= first.assignRightStart && e.node.end <= first.assignRightEnd;
        const loops = enclosingLoops(first.path);
        let carried = null;
        let noRewrite = null;
        for (const L of loops) {
          const others = nodeEntries.filter((e) => e !== first && !inRhsOfFirst(e)
            && e.node.start >= L.start && e.node.end <= L.end && winOf.get(e) !== w);
          if (others.length) { carried = others[0]; break; }
        }
        if (!carried && loops.length) {
          const inner = loops[0];
          const before = nodeEntries.filter((e) => e !== first && !inRhsOfFirst(e)
            && e.node.start >= inner.start && e.node.end <= inner.end
            && e.node.start < first.node.start && winOf.get(e) !== w
            && WRITE_ROLES.has(e.role));
          if (!before.length) noRewrite = inner;
        }
        if (carried) {
          reject(w, `的自读写（行 ${firstLine}）位于循环体内，`
            + `而同一个循环里还有属于其它区间的本绑定出现（行 ${lineOf(carried.node.start)}，形态 ${carried.role}）——`
            + '那是跨迭代携带的累加器/游标（`for (...; i = i + 1; ...)`、`a += n` 一族）。'
            + '按行拆段后它在下一轮读到的是 undefined 或上一段的旧值，累加/游标推进就地消失，'
            + '而这正是 R4 要原样保留的原版怪癖。拒绝这一刀：保留原字母，或另行授权结构性改写。');
          continue;
        }
        if (noRewrite) {
          reject(w, `的自读写（行 ${firstLine}）在循环体内（循环起于第 ${lineOf(noRewrite.start)} 行），`
            + '而这个循环里没有任何其它区间的写在这条自读写之前重新赋值本绑定——'
            + '右值读到的只能来自上一轮迭代（累加器 `a = a + rows[i]`）或循环之前（游标 `a = a.cloneNode()`）。'
            + '拆段后这段携带就地消失（三项自检看不见）。保留原字母，或另行授权结构性改写。');
          continue;
        }
        // 右值里的本绑定出现：必须同区间（否则区间边界切在右值中间），且不能跨函数边界（闭包延后读）。
        let bad = null;
        for (const e of nodeEntries) {
          if (e === first) continue;
          if (!(e.node.start >= first.assignRightStart && e.node.end <= first.assignRightEnd)) continue;
          if (winOf.get(e) !== w) { bad = { kind: 'boundary', e }; break; }
          if (crossesFunctionOrMissing(e.path, first.rightNode)) { bad = { kind: 'closure', e }; break; }
        }
        if (bad) {
          reject(w, bad.kind === 'boundary'
            ? `的右值里有一处本绑定出现（行 ${lineOf(bad.e.node.start)}）不落在本区间内——区间边界切在了这条赋值的右值中间，`
              + 'rhsKeep 表达不了。把区间边界挪到整条语句之外。'
            : `的右值里有一处本绑定出现（行 ${lineOf(bad.e.node.start)}）跨过了函数边界（回调/闭包里的延后读）——`
              + '它在赋值完成后才执行，读到的应当是本区间的新值而不是上一段，映射成 rhsKeep 是错的。拒绝。');
          continue;
        }
        rhsKeepRanges.push({ win: w, from: first.assignRightStart, to: first.assignRightEnd, name: keep });
      }
      if (first.role === 'assign') {
        if (!varInsertPositionSafe(first.path)) {
          const pt = first.path && first.path.parentPath ? first.path.parentPath.node.type : '未知';
          reject(w, `的第一次出现（行 ${firstLine}）是赋值，但它不在"整条语句就是这次赋值"的语法位置（父节点 ${pt}）——`
            + '把 a = x 改写成 var y = x 会写出非法语法：逗号表达式 `if (d = x, d.y)` 里插 var 是 SyntaxError，'
            + '`for (b = c = 0; ...)` 的 for 头与链式赋值同理（旧实现会在那里抛裸 SyntaxError，什么提示都没有）。'
            + '这一刀需要先做结构性改写（把赋值提成独立语句），超出"只改绑定名"的授权。保留原字母。');
          continue;
        }
        const declChain = branchChain(first.path);
        if (declChain.length) {
          const escape = nodeEntries.find((e) => e !== first && winOf.get(e) === w && escapesChain(declChain, e.path));
          if (escape) {
            const where = declChain.map((nd) => nd.type + '@' + lineOf(nd.start)).join(' + ');
            if (typeof w.dominationWaiver === 'string' && w.dominationWaiver.trim()) {
              waivers.push(`${key}.${oldName} 区间 ${w.fromLine}-${w.toLine}：要插的声明（行 ${firstLine}）在 ${where} 内，`
                + `第 ${lineOf(escape.node.start)} 行跳出该分支；dominationWaiver 授权：${w.dominationWaiver.trim()}`);
            } else {
              reject(w, `要插的声明（行 ${firstLine}）位于 ${where} 之内，`
                + `而本区间第 ${lineOf(escape.node.start)} 行那次出现（形态 ${escape.role}）跳出了这层分支——`
                + '分支没走时新名字是 undefined，原来的值被静默丢掉（`[0]` 变 `[null]` 那一类）。'
                + '行数/字面量/导出/行尾四条自检都看不见它。若你能证明这条分支必走（例如条件是上一行刚赋的常量），'
                + '就给这个区间加 "dominationWaiver":"<证明>"；证明不了就保留原字母。');
              continue;
            }
          }
        }
        declareSpans.set(first.node.start + ':' + first.node.end, {
          start: first.node.start, end: first.assignRightStart, text: 'var ' + w.name + ' = ',
        });
      }
      // declarator：var 关键字本就在行内，只改名，不产生额外的 span
    }
    if (blocked) continue;
    for (const e of nodeEntries) {
      const w = winOf.get(e);
      const span = declareSpans.get(e.node.start + ':' + e.node.end);
      if (span) { edits.push({ start: span.start, end: span.end, text: span.text }); continue; }
      let text = w.name;
      // 自读写放行：落在这条赋值右值区间内的本绑定出现，改写成上一段的新名（rhsKeep）
      for (const r of rhsKeepRanges) {
        if (r.win === w && e.node.start >= r.from && e.node.end <= r.to) { text = r.name; rhsKeepApplied += 1; break; }
      }
      edits.push({ start: e.node.start, end: e.node.end, text });
    }
  }
}

if (waivers.length) console.log('支配性豁免 ' + waivers.length + ' 条（每条都要人工复核证明成立）:\n' + waivers.join('\n'));
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

// 改名后的文本必须还能解析。这里的失败要么是上面的语法位置判定漏了，要么是表把两个
// 区间切在了同一条语句内部。旧实现让它冒成未捕获的 SyntaxError（调用方只看到裸堆栈，
// 不知道是哪个区间/哪一行），现在改成显式拒绝并回显首个出错位置。仍然在写盘之前。
try {
  parse(out, { sourceType: 'module' });
} catch (e) {
  const at = e && e.loc ? `（行 ${e.loc.line} 列 ${e.loc.column}）` : '';
  console.error('拒绝写盘：改名后的文本无法重新解析' + at + ' —— ' + (e && e.message ? e.message.split('\n')[0] : String(e))
    + '\n这通常是赋值处在逗号表达式 / for 头 / 链式赋值等不允许 var 的语法位置（应被上面拦下却没拦住），'
    + '或区间边界切进了同一条语句。保留原字母，或改用更宽的区间边界。');
  process.exit(1);
}

const linesOk = src.split('\n').length === out.split('\n').length;
const literalsOk = literalMultiset(src) === literalMultiset(out);
const loneLfOk = out.replace(/\r\n/g, '').includes('\n') === src.replace(/\r\n/g, '').includes('\n');
console.log('标识符编辑 ' + deduped.length + ' 处（其中 rhsKeep 自读写右值映射 ' + rhsKeepApplied
  + ' 处）；行数不变 ' + linesOk + '；字面量+导出不变 ' + literalsOk + '；行尾保持 ' + loneLfOk);
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
