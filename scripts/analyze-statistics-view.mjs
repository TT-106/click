// 逆向辅助：从 StatisticsView.update() 的「缓存字段 → DOM 单元格」配对模式
// 与 fr() 的 (行标签, 列) 结构，自动推导每个混淆字段的统计语义。
// 用法: node scripts/analyze-statistics-view.mjs src/engine/modules/views/information.js
import fs from 'node:fs';

const file = process.argv[2] || 'src/engine/modules/views/information.js';
const src = fs.readFileSync(file, 'utf8');
const lines = src.split('\n');

// ---- 1. 提取构造函数中的成员初始化（-1 = 数字缓存，null = DOM 单元格） ----
const cacheFields = [];
const domFields = [];
for (const m of src.matchAll(/this\.[\w$]+ = this\.[\w$]+ = [^;]*;/g)) {
  const stmt = m[0];
  const isCache = / = -1;\s*$/.test(stmt);
  const isDom = / = null;\s*$/.test(stmt);
  if (!isCache && !isDom) continue;
  const names = [...stmt.matchAll(/this\.(\w+)/g)].map((x) => x[1]);
  // 链式赋值 a = b = ... = value → 全部同类型
  for (const n of names) (isCache ? cacheFields : domFields).push(n);
}

// ---- 2. 解析 update() 变量声明：local -> 表达式 ----
const updateMatch = src.match(/StatisticsView\.prototype\.update = [\s\S]*?\n  \};/);
if (!updateMatch) throw new Error('未找到 update 方法');
const updateBody = updateMatch[0];
const localExpr = new Map();
for (const m of updateBody.matchAll(/(\w+) = (game\.[\w.$]+|[a-z]\.\w+),\n/g)) {
  localExpr.set(m[1], m[2]);
}
for (const m of updateBody.matchAll(/(\w+) = (game\.[\w.$]+|[a-z]\.\w+);\n/g)) {
  localExpr.set(m[1], m[2]);
}
// 形如 `f = floorNumber(...)` 之类的后续复用不覆盖首个语义来源

// ---- 3. 解析「缓存 → 单元格」配对 ----
const pairs = [];
const pairRe = /if \(this\.(\w+) != (\w+)\) \{\s*\n\s*this\.\1 = \2;\s*\n\s*this\.(\w+)\.innerHTML = ([^\n]+);\s*\n\s*\}/g;
for (const m of updateBody.matchAll(pairRe)) {
  const [, cache, local, dom, expr] = m;
  pairs.push({ cache, local, dom, expr: expr.trim() });
}
// 三缓存合一（游戏时间时分秒）
const multiRe = /if \((this\.(\w+) != (\w+) \|\| this\.(\w+) != (\w+) \|\| this\.(\w+) != (\w+))\) \{([\s\S]*?)\n    \}/g;
for (const m of updateBody.matchAll(multiRe)) {
  const block = m[8];
  const domM = block.match(/this\.(\w+)\.innerHTML = ([^\n]+);/);
  if (domM) pairs.push({ cache: [m[2], m[4], m[6]].join('/'), local: [m[3], m[5], m[7]].join('/'), dom: domM[1], expr: domM[2].trim() });
}

// ---- 4. 解析 fr() 的单元格 → (行标签, 列) ----
const frMatch = src.match(/StatisticsView\.prototype\.fr = [\s\S]*?\n  \};/);
if (!frMatch) throw new Error('未找到 fr 方法');
const frBody = frMatch[0];
const cellInfo = new Map();
let currentLabel = null;
for (const line of frBody.split('\n')) {
  const lm = line.match(/appendStatisticsRow\(this, "([^"]+)"/);
  if (lm) currentLabel = lm[1];
  const cm = line.match(/this\.(\w+) = this\.getStatisticCell\(row, (\d)\)/);
  if (cm) cellInfo.set(cm[1], { label: currentLabel, col: Number(cm[2]) });
}

// ---- 5. 输出 ----
console.log(`缓存字段 ${cacheFields.length} 个，DOM 单元格 ${domFields.length} 个，配对 ${pairs.length} 组\n`);
const COL = ['', '当前(run)', '总计(lifetime)'];
console.log('| 缓存字段 | 语义来源 | DOM 单元格 | 行 | 列 | 表达式 |');
console.log('|---|---|---|---|---|---|');
for (const p of pairs) {
  const expr = localExpr.get(p.local) || p.local;
  const info = cellInfo.get(p.dom) || { label: '?', col: 0 };
  console.log(`| ${p.cache} | ${expr} | ${p.dom} | ${info.label} | ${COL[info.col] || info.col} | ${p.expr.slice(0, 40)} |`);
}

// ---- 6. 未配对的成员 ----
const paired = new Set();
for (const p of pairs) { p.cache.split('/').forEach((c) => paired.add(c)); paired.add(p.dom); }
const cacheOnly = cacheFields.filter((f) => !paired.has(f));
const domOnly = domFields.filter((f) => !paired.has(f));
if (cacheOnly.length) console.log(`\n未配对的缓存字段: ${cacheOnly.join(', ')}`);
if (domOnly.length) console.log(`\n未配对的 DOM 单元格: ${domOnly.join(', ')}`);