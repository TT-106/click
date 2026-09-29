// scripts/rename-bindings-v2.mjs 的验收夹具与跑批（可重复执行，跑进 output/ 的临时目录）。
// npm run test:rename-tool
//
//   node tests/rename-tool/run-tests.mjs
//
// 做的事：把下面内联的夹具写进 output/rename-tool-tests/cases/（源像）与 run/（跑批副本），
// 逐个用 rename-next.mjs 跑，断言：
//   成功用例 退出码 0 + 产物文本 === 期望文本 + 前后行为等价（动态 import 跑 go() 比对）；
//   拒绝用例 退出码 1 + 文件字节未被改动 + stderr 含指定片段 + 不是裸异常堆栈；
//   反证用例 手写的"天真拆名"版本必须与原行为**不同**（用来证明那道闸确实拦的是真 bug）。
// 退出码：全绿 0，任何一条不达预期 1。
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const DIR = path.join(ROOT, 'output', 'rename-tool-tests');
const CASES = path.join(DIR, 'cases');
const RUN = path.join(DIR, 'run');
const TOOL = path.join('scripts', 'rename-bindings-v2.mjs');

for (const d of [CASES, RUN]) fs.rmSync(d, { recursive: true, force: true });
for (const d of [CASES, RUN]) fs.mkdirSync(d, { recursive: true });

// ---------------------------------------------------------------- 夹具
// makeTable：极小假 DOM，够让夹具真跑起来（行为 oracle 用）。
const SHIM = `var log = [];
function makeTable(name) {
  var t = { name: name, rows: [], cells: [], style: {} };
  t.insertRow = function (i) {
    var r = { name: name + "#row" + i, cells: [], style: {} };
    r.insertCell = function (j) { var c = { name: r.name + "#cell" + j }; r.cells.push(c); return c; };
    t.rows.push(r);
    return r;
  };
  t.insertCell = function (j) { var c = { name: name + "#cell" + j }; t.cells.push(c); return c; };
  return t;
}
`;

const fixtures = {
  // -------------------------------------------------- 回归：已支持行为不得破坏
  'r-split-ok': `export function f(p) {
  var a = 1;
  p = a + 1;
  if (p) {
    a = 2;
    console.log(a);
  }
  return a + p;
}
`,
  'r-split-read': `export function g(p) {
  var a = 1;
  a = 2;
  return a + p;
}
`,
  'r-split-inc': `export function h(n) {
  var a = 0;
  for (n = 0; n < 3; n++) a += n;
  a++;
  return a;
}
`,
  'r-split-compound': `export function k(n) {
  var a = 0;
  for (n = 0; n < 3; n++) { a += n; }
  a += 1;
  return a;
}
`,
  'r-split-compound2': `export function q(n) {
  var a = 0;
  a = n;
  a += 5;
  return a;
}
`,
  'r-split-selfread': `export function m(n) {
  var a = 1;
  n = a;
  a = a + 5;
  return a + n;
}
`,
  'r-selfread2': `export function f(t) {
  var a = {r: 1};
  a = a.r;
  return a;
}
`,
  'r-collide': `export function f(items) {
  var view = "existing";
  var a = 1;
  a = 2;
  return a + view;
}
`,
  'r-forin-split': `export function m(obj) {
  var a = 1;
  a = 2;
  for (a in obj) { console.log(a); }
}
`,
  'r-forin-var': `export function k(obj) {
  var out = [];
  for (var a in obj) { out.push(a); }
  return out;
}
`,

  // -------------------------------------------------- 新能力正例
  // 题面原形：b = b.insertRow(1) —— assign 形态 + rhsKeep
  'n-stmt-rhskeep': SHIM + `export function build(view, out) {
  var b = makeTable(view.buttonElement);
  var nameRow = b.insertRow(0);
  b = b.insertRow(1);
  nameRow.insertCell(0);
  b.style.width = "100%";
  out.push(b.name, nameRow.name, b.style.width, nameRow.cells.length);
  return out;
}
export function go() { return build({ buttonElement: "qtyButton" }, []); }
`,
  // 多 declarator 的 var 语句里 var 重声明：quantityRow = buttonTable.insertRow(1)
  'n-redecl-rhskeep': SHIM + `export function loot(button, out) {
  var b = makeTable(button.name);
  b.style.width = "100%";
  var nameRow = b.insertRow(0),
    b = b.insertRow(1),
    cell = nameRow.insertCell(0);
  out.push(b.name, nameRow.name, cell.name, b.cells.length);
  return out;
}
export function go() { return loot({ name: "lootTable" }, []); }
`,
  // 成员链自读写（navigation/world 形状），且不在循环里
  'n-member-rhskeep': `export function render(adventurer, out) {
  var b = adventurer;
  b = b.classDefinition.shortName;
  out.push(b, b.length);
  return out;
}
export function go() { return render({ classDefinition: { shortName: "Rog" } }, []); }
`,
  // var 重声明 + rhsKeep（requirement 2 的正例：只改名，不插 var）
  'n-varredecl-rhskeep': `export function rowOf(source, out) {
  var a = source.table;
  out.push(a.name);
  var a = a.regionRow;
  out.push(a);
  return out;
}
export function go() { return rowOf({ table: { name: "T", regionRow: 7 } }, []); }
`,
  // var 重声明但不自读：只改名，不插 var（requirement 2 的普通形态）
  'n-varredecl-plain': `export function rowOf(source, other, out) {
  var a = source.table;
  out.push(a.name);
  var a = other.row;
  out.push(a.name);
  return out;
}
export function go() { return rowOf({ table: { name: "T" } }, { row: { name: "R" } }, []); }
`,
  // 右值跨行的自读写：映射按字符区间而非行号，证明多行右值也能正确落到上一段新名
  'n-rhskeep-multiline': `export function build(view, out) {
  var b = { name: view.buttonElement };
  var nameRow = { name: b.name };
  b = {
    name: b.name + "#row1",
  };
  out.push(b.name, nameRow.name);
  return out;
}
export function go() { return build({ buttonElement: "btn" }, []); }
`,
  // 退化自读写 `a = a`（右值整个就是本绑定）：走 stopNode 边界的那条路
  'n-selfassign-rhskeep': `export function id(x, out) {
  var a = x;
  out.push(a.n);
  a = a;
  out.push(a.n);
  return out;
}
export function go() { return id({ n: 5 }, []); }
`,
  // 同一条绑定里两段自读写（两个 rhsKeep 区间并存），验证多区间映射互不串台
  'n-double-rhskeep': `export function chain(out) {
  var b = { name: "root" };
  b = { name: b.name + "#1" };
  out.push(b.name);
  b = { name: b.name + "#2" };
  out.push(b.name);
  return out;
}
export function go() { return chain([]); }
`,
  // 整体改名（不拆分）时自读写照常放行：行为不得回归
  'r-whole-selfread': `export function f(t) {
  var a = {r: 1};
  a = a.r;
  return a;
}
export function go() { return f(0); }
`,

  // -------------------------------------------------- 新能力反例
  // (a1) 表式规定的闸：自读写在循环内 + 同循环内有其它区间的本绑定出现
  'x-loop-otherwindow': `export function walk(steps, n, out) {
  for (var a = 0, i = 0; i < n; i++) {
    a = a + steps[i];
    out.push(a);
  }
  return out;
}
`,
  // (a2) 额外闸：循环里唯一的自读写（声明在循环外）——累加器，跨迭代携带
  'x-loop-accumulator': `export function total(rows, n, out) {
  var a = 0;
  for (var i = 0; i < n; i++) {
    a = a + rows[i];
  }
  out.push(a);
  return out;
}
`,
  // (b) 写了 rhsKeep 但右值不含本绑定
  'x-rhskeep-unused': `export function f(p) {
  var a = 1;
  p = a + 1;
  if (p) {
    a = p * 2;
    console.log(a);
  }
  return a + p;
}
`,
  // (c1) 逗号表达式里的赋值
  'x-comma-expr': `export function pick(d, x, out) {
  var kept = 0;
  if (d = x, d.y) {
    kept = 1;
  }
  out.push(d, kept);
  return out;
}
`,
  // (c2) 链式赋值 for (b = c = 0; ...)
  'x-for-chained': `export function spin(limit, out) {
  var b, c;
  for (b = c = 0; b < limit; b++) {
    out.push(c);
    c = c + 2;
  }
  return out;
}
`,
  // (d) var 重声明自读写但不给 rhsKeep
  'x-varredecl-nokeep': `export function rowOf(source, out) {
  var a = source.table;
  out.push(a.name);
  var a = a.regionRow;
  out.push(a);
  return out;
}
`,
  // rhsKeep 拼错（不是本绑定任何其它区间的新名）
  'x-rhskeep-typo': `export function build(view, out) {
  var b = { name: view.buttonElement };
  var nameRow = { name: b.name };
  b = { name: b.name + "#row1" };
  out.push(b.name, nameRow.name);
  return out;
}
`,
  // rhsKeep 与本区间新名同名 —— 正是 var y = y.x 的破坏形状
  'x-rhskeep-self': `export function build(view, out) {
  var b = { name: view.buttonElement };
  var nameRow = { name: b.name };
  b = { name: b.name + "#row1" };
  out.push(b.name, nameRow.name);
  return out;
}
`,
  // 裸 var 重声明（无 init）：拆名后本段读到 undefined
  'x-bare-redecl': `export function bare(x, out) {
  var a = x;
  out.push(a);
  var a;
  out.push(a);
  return out;
}
`,
  // 右值里跨函数边界的延后读：rhsKeep 会把它锁在上一段的值上
  'x-closure-read': `export function bind(button, out) {
  var b = button;
  b = { get: function () { return b.id; } };
  out.push(b.get());
  return out;
}
`,
};

const tables = {
  // 第 5 行 `a = 2` 在 if 块内，第 9 行的读跳出该块 => 支配性检查会拒。
  // 这里给豁免并附证明：第 3 行 `p = a + 1` 使 p 恒为 2（真），if (p) 必走，插进去的 var 一定被执行。
  'r-split-ok': { f: { a: [{ name: 'firstHalf', fromLine: 1, toLine: 3 }, { name: 'secondHalf', fromLine: 4, toLine: 9, dominationWaiver: 'p 在第 3 行被赋 a+1=2，if (p) 必走，插入的声明一定执行' }] } },
  'n-domination-escape': { f: { a: [{ name: 'firstHalf', fromLine: 1, toLine: 3 }, { name: 'secondHalf', fromLine: 4, toLine: 9 }] } },
  'r-split-read': { g: { a: [{ name: 'firstHalf', fromLine: 1, toLine: 3 }, { name: 'secondHalf', fromLine: 4, toLine: 5 }] } },
  'r-split-inc': { h: { a: [{ name: 'total', fromLine: 1, toLine: 3 }, { name: 'bumped', fromLine: 4, toLine: 6 }] } },
  'r-split-compound': { k: { a: [{ name: 'acc', fromLine: 1, toLine: 3 }, { name: 'result', fromLine: 4, toLine: 6 }] } },
  'r-split-compound2': { q: { a: [{ name: 'seed', fromLine: 1, toLine: 3 }, { name: 'grown', fromLine: 4, toLine: 6 }] } },
  'r-split-selfread': { m: { a: [{ name: 'initial', fromLine: 1, toLine: 3 }, { name: 'bumped', fromLine: 4, toLine: 6 }] } },
  'r-selfread2': { f: { a: [{ name: 'table', fromLine: 1, toLine: 2 }, { name: 'value', fromLine: 3, toLine: 4 }] } },
  'r-collide': { f: { a: [{ name: 'first', fromLine: 1, toLine: 3 }, { name: 'view', fromLine: 4, toLine: 5 }] } },
  'r-dup': { f: { a: [{ name: 'same', fromLine: 1, toLine: 3 }, { name: 'same', fromLine: 4, toLine: 5 }] } },
  'r-forin-split': { m: { a: [{ name: 'seed', fromLine: 1, toLine: 3 }, { name: 'key', fromLine: 4, toLine: 5 }] } },
  'r-forin-var': { k: { a: 'spellKey' } },
  'r-whole-selfread': { f: { a: 'rowValue' } },
  'n-varredecl-plain': { rowOf: { a: [
    { name: 'tableRef', fromLine: 1, toLine: 3 },
    { name: 'otherRow', fromLine: 4, toLine: 7 },
  ] } },
  'n-rhskeep-multiline': { build: { b: [
    { name: 'buttonTable', fromLine: 1, toLine: 3 },
    { name: 'wrappedRow', fromLine: 4, toLine: 9, rhsKeep: 'buttonTable' },
  ] } },
  'n-selfassign-rhskeep': { id: { a: [
    { name: 'firstValue', fromLine: 1, toLine: 3 },
    { name: 'secondValue', fromLine: 4, toLine: 8, rhsKeep: 'firstValue' },
  ] } },
  'n-double-rhskeep': { chain: { b: [
    { name: 'root', fromLine: 1, toLine: 2 },
    { name: 'first', fromLine: 3, toLine: 4, rhsKeep: 'root' },
    { name: 'second', fromLine: 5, toLine: 8, rhsKeep: 'first' },
  ] } },
  'n-stmt-rhskeep': { build: { b: [
    { name: 'buttonTable', fromLine: 13, toLine: 15 },
    { name: 'quantityRow', fromLine: 16, toLine: 22, rhsKeep: 'buttonTable' },
  ] } },
  'n-redecl-rhskeep': { loot: { b: [
    { name: 'buttonTable', fromLine: 13, toLine: 16 },
    { name: 'quantityRow', fromLine: 17, toLine: 22, rhsKeep: 'buttonTable' },
  ] } },
  'n-member-rhskeep': { render: { b: [
    { name: 'adventurerRef', fromLine: 1, toLine: 2 },
    { name: 'shortName', fromLine: 3, toLine: 5, rhsKeep: 'adventurerRef' },
  ] } },
  'n-varredecl-rhskeep': { rowOf: { a: [
    { name: 'tableRef', fromLine: 1, toLine: 3 },
    { name: 'regionRowValue', fromLine: 4, toLine: 6, rhsKeep: 'tableRef' },
  ] } },
  'x-loop-otherwindow': { walk: { a: [
    { name: 'seed', fromLine: 1, toLine: 2 },
    { name: 'running', fromLine: 3, toLine: 7, rhsKeep: 'seed' },
  ] } },
  'x-loop-accumulator': { total: { a: [
    { name: 'seed', fromLine: 1, toLine: 3 },
    { name: 'running', fromLine: 4, toLine: 7, rhsKeep: 'seed' },
  ] } },
  'x-rhskeep-unused': { f: { a: [
    { name: 'firstHalf', fromLine: 1, toLine: 3 },
    { name: 'secondHalf', fromLine: 4, toLine: 8, rhsKeep: 'firstHalf' },
  ] } },
  'x-comma-expr': { pick: { d: [
    { name: 'incoming', fromLine: 1, toLine: 2 },
    { name: 'chosen', fromLine: 3, toLine: 7 },
  ] } },
  'x-for-chained': { spin: { c: [
    { name: 'cSeed', fromLine: 1, toLine: 2 },
    { name: 'cZero', fromLine: 3, toLine: 7 },
  ] } },
  'x-varredecl-nokeep': { rowOf: { a: [
    { name: 'tableRef', fromLine: 1, toLine: 3 },
    { name: 'regionRowValue', fromLine: 4, toLine: 6 },
  ] } },
  'x-rhskeep-typo': { build: { b: [
    { name: 'buttonTable', fromLine: 1, toLine: 3 },
    { name: 'quantityRow', fromLine: 4, toLine: 7, rhsKeep: 'buttonTabel' },
  ] } },
  'x-rhskeep-self': { build: { b: [
    { name: 'buttonTable', fromLine: 1, toLine: 3 },
    { name: 'quantityRow', fromLine: 4, toLine: 7, rhsKeep: 'quantityRow' },
  ] } },
  'x-bare-redecl': { bare: { a: [
    { name: 'seeded', fromLine: 1, toLine: 3 },
    { name: 'blank', fromLine: 4, toLine: 7 },
  ] } },
  'x-closure-read': { bind: { b: [
    { name: 'buttonRef', fromLine: 1, toLine: 2 },
    { name: 'wrapper', fromLine: 3, toLine: 5, rhsKeep: 'buttonRef' },
  ] } },
};

// 成功用例的期望产物文本（逐字符比对）
const expected = {
  'r-split-ok': `export function f(p) {
  var firstHalf = 1;
  p = firstHalf + 1;
  if (p) {
    var secondHalf = 2;
    console.log(secondHalf);
  }
  return secondHalf + p;
}
`,
  'r-forin-var': `export function k(obj) {
  var out = [];
  for (var spellKey in obj) { out.push(spellKey); }
  return out;
}
`,
  'r-whole-selfread': `export function f(t) {
  var rowValue = {r: 1};
  rowValue = rowValue.r;
  return rowValue;
}
export function go() { return f(0); }
`,
  'n-stmt-rhskeep': SHIM + `export function build(view, out) {
  var buttonTable = makeTable(view.buttonElement);
  var nameRow = buttonTable.insertRow(0);
  var quantityRow = buttonTable.insertRow(1);
  nameRow.insertCell(0);
  quantityRow.style.width = "100%";
  out.push(quantityRow.name, nameRow.name, quantityRow.style.width, nameRow.cells.length);
  return out;
}
export function go() { return build({ buttonElement: "qtyButton" }, []); }
`,
  'n-redecl-rhskeep': SHIM + `export function loot(button, out) {
  var buttonTable = makeTable(button.name);
  buttonTable.style.width = "100%";
  var nameRow = buttonTable.insertRow(0),
    quantityRow = buttonTable.insertRow(1),
    cell = nameRow.insertCell(0);
  out.push(quantityRow.name, nameRow.name, cell.name, quantityRow.cells.length);
  return out;
}
export function go() { return loot({ name: "lootTable" }, []); }
`,
  'n-member-rhskeep': `export function render(adventurer, out) {
  var adventurerRef = adventurer;
  var shortName = adventurerRef.classDefinition.shortName;
  out.push(shortName, shortName.length);
  return out;
}
export function go() { return render({ classDefinition: { shortName: "Rog" } }, []); }
`,
  'n-varredecl-rhskeep': `export function rowOf(source, out) {
  var tableRef = source.table;
  out.push(tableRef.name);
  var regionRowValue = tableRef.regionRow;
  out.push(regionRowValue);
  return out;
}
export function go() { return rowOf({ table: { name: "T", regionRow: 7 } }, []); }
`,
  'n-varredecl-plain': `export function rowOf(source, other, out) {
  var tableRef = source.table;
  out.push(tableRef.name);
  var otherRow = other.row;
  out.push(otherRow.name);
  return out;
}
export function go() { return rowOf({ table: { name: "T" } }, { row: { name: "R" } }, []); }
`,
  'n-rhskeep-multiline': `export function build(view, out) {
  var buttonTable = { name: view.buttonElement };
  var nameRow = { name: buttonTable.name };
  var wrappedRow = {
    name: buttonTable.name + "#row1",
  };
  out.push(wrappedRow.name, nameRow.name);
  return out;
}
export function go() { return build({ buttonElement: "btn" }, []); }
`,
  'n-selfassign-rhskeep': `export function id(x, out) {
  var firstValue = x;
  out.push(firstValue.n);
  var secondValue = firstValue;
  out.push(secondValue.n);
  return out;
}
export function go() { return id({ n: 5 }, []); }
`,
  'n-double-rhskeep': `export function chain(out) {
  var root = { name: "root" };
  var first = { name: root.name + "#1" };
  out.push(first.name);
  var second = { name: first.name + "#2" };
  out.push(second.name);
  return out;
}
export function go() { return chain([]); }
`,
};

// 拒绝用例：必须出现的提示片段（够定位是哪条闸）
const expectReject = {
  'r-split-read': ['第一次出现（行 4，形态 ref）不是单纯赋值左侧'],
  'r-split-inc': ['形态 update'],
  'r-split-compound': ['形态 compound'],
  'r-split-compound2': ['形态 compound'],
  'r-split-selfread': ['右值读到本绑定', 'rhsKeep'],
  'r-selfread2': ['右值读到本绑定', 'rhsKeep', 'var y = y.x'],
  'r-collide': ['已被占用'],
  'r-dup': ['相同新名'],
  'r-forin-split': ['形态 forhead'],
  'x-loop-otherwindow': ['同一个循环里还有属于其它区间的本绑定出现'],
  'x-loop-accumulator': ['只能来自上一轮迭代'],
  'x-rhskeep-unused': ['并没有读到本绑定'],
  'x-comma-expr': ['语法位置', 'SequenceExpression', '逗号表达式'],
  'x-for-chained': ['语法位置', 'AssignmentExpression', '链式赋值'],
  'x-varredecl-nokeep': ['右值读到本绑定', 'rhsKeep'],
  'x-rhskeep-typo': ['不是本绑定任何其他区间的新名'],
  'x-rhskeep-self': ['与本区间新名同名'],
  'x-bare-redecl': ['裸 var 重声明'],
  'x-closure-read': ['跨过了函数边界'],
};

// 反证：手写的"天真拆名"版本，行为必须与原文件不同（证明闸拦的是真 bug）
const counterExamples = [{
  id: 'c-loop-accumulator-naive',
  pre: `export function total(rows, n, out) {
  var a = 0;
  for (var i = 0; i < n; i++) {
    a = a + rows[i];
  }
  out.push(a);
  return out;
}
export function go() { return total([3, 3, 3], 3, []); }
`,
  // 天真拆名的结果：seed / running 各一段，累加就地消失
  post: `export function total(rows, n, out) {
  var seed = 0;
  for (var i = 0; i < n; i++) {
    var running = seed + rows[i];
  }
  out.push(running);
  return out;
}
export function go() { return total([3, 3, 3], 3, []); }
`,
}];

const results = [];
function record(id, ok, detail) { results.push({ id, ok, detail }); }

function writeCase(id, text) {
  fs.writeFileSync(path.join(CASES, id + '.js'), text);
}

function runTool(fileRel, tableRel, dry) {
  const argv = [path.join(ROOT, TOOL), '--file', fileRel, '--table', tableRel];
  if (dry) argv.push('--dry');
  const r = spawnSync(process.execPath, argv, { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// ---------------------------------------------------------- 逐条跑
// caseId -> 夹具：r-dup 复用 r-collide 的夹具（同一份源码，不同的表）。
const caseList = Object.keys(fixtures).map((id) => ({ caseId: id, fixtureId: id }));
caseList.push({ caseId: 'r-dup', fixtureId: 'r-collide' });

for (const { caseId, fixtureId } of caseList) {
  const id = caseId;
  const text = fixtures[fixtureId];
  writeCase(id, text);
  fs.writeFileSync(path.join(CASES, id + '.json'), JSON.stringify(tables[id], null, 1));
  const prePath = path.join(RUN, id + '.pre.js');
  const workPath = path.join(RUN, id + '.js');
  fs.writeFileSync(prePath, text);
  fs.writeFileSync(workPath, text);
  const before = fs.readFileSync(workPath, 'utf8');
  const fileRel = path.relative(ROOT, workPath).replace(/\\/g, '/');
  const tableRel = path.relative(ROOT, path.join(CASES, id + '.json')).replace(/\\/g, '/');
  const { code, out } = runTool(fileRel, tableRel, false);
  const after = fs.readFileSync(workPath, 'utf8');
  const stacked = /\n\s+at .*\(.+:\d+:\d+\)/.test(out) || /node:internal/.test(out);

  if (expectReject[id]) {
    const missing = expectReject[id].filter((frag) => !out.includes(frag));
    record(id, code === 1 && before === after && missing.length === 0 && !stacked,
      'exit=' + code + ' 未写盘=' + (before === after)
      + (missing.length ? ' 缺片段=' + JSON.stringify(missing) : '')
      + (stacked ? ' 出现裸堆栈' : '') + ' | ' + out.split('\n').slice(0, 3).join(' / '));
    continue;
  }

  // 成功用例
  const exp = expected[id];
  const textOk = after === exp;
  let oracle = 'n/a';
  if (textOk) {
    try {
      const pre = await import(pathToFileURL(prePath).href);
      const post = await import(pathToFileURL(workPath).href);
      if (typeof pre.go === 'function') {
        const a = JSON.stringify(pre.go());
        const b = JSON.stringify(post.go());
        oracle = a === b ? '等价(' + a + ')' : '不等价 pre=' + a + ' post=' + b;
      } else {
        oracle = '无 go()';
      }
    } catch (e) { oracle = 'oracle 抛错 ' + e.message; }
  }
  const linesOk = text.split('\n').length === after.split('\n').length;
  const okOracle = oracle === '无 go()' || oracle.startsWith('等价');
  record(id, code === 0 && textOk && linesOk && okOracle && !stacked,
    'exit=' + code + ' 文本=' + (textOk ? 'match' : 'DIFF') + ' 行数不变=' + linesOk + ' 行为' + oracle
    + (textOk ? '' : '\n--- got ---\n' + after));
}

// ---------------------------------------------------------- 反证（不跑工具）
for (const c of counterExamples) {
  const prePath = path.join(RUN, c.id + '.pre.js');
  const postPath = path.join(RUN, c.id + '.post.js');
  fs.writeFileSync(prePath, c.pre);
  fs.writeFileSync(postPath, c.post);
  const pre = await import(pathToFileURL(prePath).href);
  const post = await import(pathToFileURL(postPath).href);
  const a = JSON.stringify(pre.go());
  const b = JSON.stringify(post.go());
  record(c.id, a !== b, '原行为=' + a + ' 天真拆名=' + b + '（必须不同，否则这条反证没意义）');
}

// ---------------------------------------------------------- 第二反证：rhsKeep 少写会怎样
// 把 n-stmt-rhskeep 的"天真拆名"版本（右值也改成本段新名）跑一遍：必须与原行为不同
// —— 用来证明 rhsKeep 这条映射不是锦上添花，而是这类改名的必要条件。
{
  const id = 'c-rhskeep-naive';
  const prePath = path.join(RUN, id + '.pre.js');
  const postPath = path.join(RUN, id + '.post.js');
  fs.writeFileSync(prePath, fixtures['n-stmt-rhskeep']);
  fs.writeFileSync(postPath, expected['n-stmt-rhskeep']
    .replace('var quantityRow = buttonTable.insertRow(1);', 'var quantityRow = quantityRow.insertRow(1);'));
  const pre = await import(pathToFileURL(prePath).href);
  const post = await import(pathToFileURL(postPath).href);
  let a; let b;
  try { a = JSON.stringify(pre.go()); } catch (e) { a = '抛错 ' + e.constructor.name; }
  try { b = JSON.stringify(post.go()); } catch (e) { b = '抛错 ' + e.constructor.name; }
  record(id, a !== b, '原行为=' + a + ' 天真拆名=' + b + '（天真版本必须坏掉，否则这条夹具证明不了 rhsKeep 的必要性）');
}

// ---------------------------------------------------------- --dry 不得写盘
{
  const id = 'n-member-rhskeep';
  const workPath = path.join(RUN, 'dry-' + id + '.js');
  fs.writeFileSync(workPath, fixtures[id]);
  const before = fs.readFileSync(workPath, 'utf8');
  const { code, out } = runTool(path.relative(ROOT, workPath).replace(/\\/g, '/'),
    path.relative(ROOT, path.join(CASES, id + '.json')).replace(/\\/g, '/'), true);
  const after = fs.readFileSync(workPath, 'utf8');
  record('dry-no-write', code === 0 && before === after && out.includes('--dry 未写盘'),
    'exit=' + code + ' 未写盘=' + (before === after) + ' | ' + out.split('\n').slice(0, 2).join(' / '));
}

// ---------------------------------------------------------- 与 scripts/ 现版本对照
// 只跑对照，不改 scripts/，也不让旧版碰夹具（统统在 run/ 的副本上跑）。
const legacy = [
  { id: 'x-comma-expr', want: 'stack', why: '旧版在重新解析处抛裸 SyntaxError' },
  { id: 'x-for-chained', want: 'stack', why: '同上（链式赋值里插了两个 var）' },
  { id: 'n-stmt-rhskeep', want: 'reject', why: '旧版没有 rhsKeep，自读写一律拒' },
  { id: 'n-varredecl-rhskeep', want: 'reject', why: '旧版把 declarator 形态一律拒' },
  { id: 'r-split-ok', want: 'ok', why: '旧版支持的路径新版必须同样支持' },
];
for (const c of legacy) {
  const workPath = path.join(RUN, 'legacy-' + c.id + '.js');
  fs.writeFileSync(workPath, fixtures[c.id]);
  const fileRel = path.relative(ROOT, workPath).replace(/\\/g, '/');
  const tableRel = path.relative(ROOT, path.join(CASES, c.id + '.json')).replace(/\\/g, '/');
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'rename-bindings-auto.mjs'),
    '--file', fileRel, '--table', tableRel], { cwd: ROOT, encoding: 'utf8' });
  const text = (r.stdout || '') + (r.stderr || '');
  const stacked = /\n\s+at .*\(.+:\d+:\d+\)/.test(text) && /SyntaxError/.test(text);
  const untouched = fs.readFileSync(workPath, 'utf8') === fixtures[c.id];
  let ok;
  if (c.want === 'stack') ok = stacked && untouched;
  else if (c.want === 'reject') ok = r.status === 1 && !stacked && /拒绝写盘/.test(text) && untouched;
  else ok = r.status === 0 && !untouched;
  record('legacy/' + c.id, ok, '旧版 exit=' + r.status + (stacked ? ' 裸堆栈' : '')
    + ' 夹具未动=' + untouched + ' | ' + c.why + ' | ' + text.split('\n').slice(0, 2).join(' / '));
}

// ---------------------------------------------------------- 主智能体留的现成夹具
// 把 output/r27-tooltest/ 原样拷进本目录再跑（绝不碰原目录；那边 split-ok.js / forin-var.js
// 已被上一波成功跑消费过，内容就是产物，所以现在只剩非单字母绑定 → 只能报"找不到"，
// 因此真正的回归断言用上面重建的源像 r-split-ok / r-forin-var）。
// 对有 .log 的用例，断言新版的拒绝消息仍然包含旧版那句核心诊断。
const shipped = [
  ['split-read.js', 't-read.json', null],
  ['split-inc.js', 't-inc.json', null],
  ['split-compound.js', 't-compound.json', null],
  ['split-compound2.js', 't-compound2.json', 'compound2.log'],
  ['split-selfread.js', 't-selfread.json', null],
  ['selfread2.js', 't-selfread2.json', 'selfread2.log'],
  ['collide.js', 't-collide.json', 'collide.log'],
  ['collide.js', 't-dup.json', 'dup.log'],
  ['forin-split.js', 't-forin-split.json', 'forin-split.log'],
  ['split-ok.js', 't-ok.json', null],
  ['forin-var.js', 't-forin.json', null],
  ['forin.js', 't-forin.json', null],
];
const SHIPPED_SRC = path.join(ROOT, 'output', 'r27-tooltest');
const SHIPPED = path.join(DIR, 'shipped');
fs.mkdirSync(SHIPPED, { recursive: true });
for (const [jsName, jsonName, logName] of shipped) {
  const work = path.join(SHIPPED, jsName);
  fs.copyFileSync(path.join(SHIPPED_SRC, jsName), work);
  const table = path.join(SHIPPED, jsonName);
  fs.copyFileSync(path.join(SHIPPED_SRC, jsonName), table);
  const before = fs.readFileSync(work, 'utf8');
  const { code, out } = runTool(path.relative(ROOT, work).replace(/\\/g, '/'),
    path.relative(ROOT, table).replace(/\\/g, '/'), false);
  const after = fs.readFileSync(work, 'utf8');
  let core = null;
  if (logName) {
    const log = fs.readFileSync(path.join(SHIPPED_SRC, logName), 'utf8').split('\n')[1] || '';
    // 旧版 selfread 那句"仍读到本绑定"现在写成"读到本绑定"并附 rhsKeep 提示，核心诊断不变
    core = log.split('——')[0].replace('仍读到本绑定', '读到本绑定').trim();
  }
  const wrote = before !== after;
  // 这批夹具全部应当被拒且不写盘（两条 *_ok/forin-var 已被上一波消费成产物，只剩"找不到单字母绑定"）
  const ok = code === 1 && !wrote && (!core || out.includes(core));
  record('shipped/' + jsName.replace('.js', '') + '+' + jsonName.replace('.json', '').replace('t-', ''),
    ok, 'exit=' + code + ' 被改写=' + wrote + (core ? ' 含旧版核心诊断=' + out.includes(core) : '')
    + ' | ' + out.split('\n').slice(0, 2).join(' / '));
}

// ---------------------------------------------------------- 支配性：不给豁免就必须拒
// 同一个 r-split-ok 源像，但表里**不给** dominationWaiver：工具必须拒，且一个字节都不写。
// 这一条是 dominationWaiver 机制的存在理由——静默改坏不可接受，豁免必须留下可复核的书面证明。
{
  const id = 'n-domination-escape';
  const workPath = path.join(RUN, id + '.js');
  fs.writeFileSync(workPath, fixtures['r-split-ok']);
  const tablePath = path.join(CASES, id + '.json');
  fs.writeFileSync(tablePath, JSON.stringify(tables[id], null, 1));
  const before = fs.readFileSync(workPath, 'utf8');
  const { code, out } = runTool(path.relative(ROOT, workPath).replace(/\\/g, '/'),
    path.relative(ROOT, tablePath).replace(/\\/g, '/'), false);
  const after = fs.readFileSync(workPath, 'utf8');
  record('N ' + id, code === 1 && before === after && out.includes('dominationWaiver'),
    'exit=' + code + ' 夹具未动=' + (before === after) + ' | '
    + ((out.match(/区间 4-9[^\n]*/) || ['无诊断'])[0]).slice(0, 160));
}

// ---------------------------------------------------------- 已登记缺口（现由支配性检查关闭）
// 一个区间的"第一次出现"落在条件分支里时，插进去的 var 声明不再支配本段后续的读：
// 原绑定带着上一段的值走完全程，新变量在分支没进时是 undefined。
// 这一类 rhsKeep 救不了（它管的是右值，坏了的是本段自己的读），scripts/ 版同样没拦。
// 现在 rename-next 用 branchChain/escapesChain 判定支配性：无证明即拒，有 dominationWaiver
// 才放行并把豁免打印出来复核。下面这条断言"工具已拒绝"（工具回退时它会变红）。
{
  const id = 'gap-conditional-first-write';
  const src = `export function risky(x, out) {
  var a = 0;
  if (x) {
    a = a + 1;
  }
  out.push(a);
  return out;
}
export function go(x) { return risky(x, []); }
`;
  const table = { risky: { a: [
    { name: 'seed', fromLine: 1, toLine: 3 },
    { name: 'bumped', fromLine: 4, toLine: 8, rhsKeep: 'seed' },
  ] } };
  const workPath = path.join(RUN, id + '.js');
  fs.writeFileSync(workPath, src);
  const tablePath = path.join(CASES, id + '.json');
  fs.writeFileSync(tablePath, JSON.stringify(table, null, 1));
  const { code, out } = runTool(path.relative(ROOT, workPath).replace(/\\/g, '/'),
    path.relative(ROOT, tablePath).replace(/\\/g, '/'), false);
  const prePath = path.join(RUN, id + '.pre.js');
  fs.writeFileSync(prePath, src);
  let detail;
  let ok;
  if (code === 0) {
    const pre = await import(pathToFileURL(prePath).href);
    const post = await import(pathToFileURL(workPath).href);
    const a = JSON.stringify(pre.go(false));
    const b = JSON.stringify(post.go(false));
    ok = a !== b;
    detail = '工具 exit=0（接受了这一刀）；x=false 时原=' + a + ' 拆名后=' + b
      + ' —— 行为分叉而三项自检全绿，这是本工具的已知盲区';
  } else {
    ok = fs.readFileSync(workPath, 'utf8') === src;
    detail = '工具已拒绝这一刀且未写盘（支配性检查生效）；未动=' + ok
      + ' | ' + ((out.match(/区间 4-8[^\n]*/) || ['无诊断'])[0]).slice(0, 140);
  }
  record('GAP ' + id, ok, detail);
}

// ---------------------------------------------------------- 汇总
let failed = 0;
for (const r of results) {
  if (!r.ok) failed += 1;
  console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.id.padEnd(24) + r.detail);
}
console.log('\n合计 ' + results.length + ' 条，失败 ' + failed + ' 条');
process.exit(failed ? 1 : 0);
