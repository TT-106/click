// 结构对账：比较同一文件在两个版本间的**非标识符结构**，用来抓"改名之外的改动"。
//
// 为什么需要：本会话真出过一次事故——检查点提交把某个智能体插进去的反向验证探针
// （`camera.tileRowTYPO = centerY / game.tileSize | 0;`）一起收进 HEAD。那是写给
// 不存在属性的死写，parity / 89 个差分场景 / 像素指纹 / e2e / typecheck 全绿。
// 名字检查（lint 第 4 条）只能抓带标记词的那种；这条从结构入手：把标识符全抹成
// 同一个 token 后比对骨架，凡是落在"已授权结构模式"之外的形状变动都要人读。
//
// 已授权结构模式（归一化后即视为"同一行"）：
//   1. import 行增删改 —— 解耦切片把常量/依赖注入进来；
//   2. `x.y` 成员深度变化 —— 解耦切片把 game.tileSize 换成裸常量 TILE_SIZE；
//   3. `var` 关键字位置 —— 改名工具把原声明拆给另一段名字时，在段首重赋值处补声明
//      （函数作用域，与原声明同 extent；此模式已用 --file 逐处人工读过）；
//   4. 纯括号/标点行 —— 且本文件变动行上的 { } 收支为 0（完整块的骨架；多塞一个 } 或少一个 {
//      会让收支不为 0，照样报红）；
//   5. artifacts/structure-allowlist.json 里逐条列出的插入/删除行 —— 键是**抹平后的骨架文本**
//      加计数上限，只能人工读过那一处之后加，diff 里看得见理由。注入 bind setter 这类
//      合法的新语句走这条，而不是放宽归一化（把 I() 折成 I 会让"插一个函数调用"的破坏隐身，
//      而插调用正是本文件要防的那一类）。
// 已知盲区（诚实声明）：归一化把成员深度抹平，所以"把 this.a 换成 this.b 之类
// 只改成员名的破坏"这条看不见——那种破坏由 typecheck、audit:dead-reads 和
// lint 的标记词检查负责；本检查负责的是**形状**：多一行、少一行、改运算符、改字面量。
//
//   node scripts/verify-structure-invariant.mjs [<base-ref>] [--file=<rel>] [--explain]
// 默认 base = 会话起点 8bb7451，比对 src/engine/modules 下全部 .js（工作树现状 vs base）。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const BASE = argv.find((a) => !a.startsWith('--')) || '8bb7451';
const ONLY = (argv.find((a) => a.startsWith('--file=')) || '').slice(7);
const EXPLAIN = argv.includes('--explain');
const ALL = argv.includes('--all');

const KEYWORDS = new Set(['var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'typeof', 'instanceof', 'in', 'of', 'this', 'null', 'true', 'false', 'void', 'delete', 'try', 'catch', 'finally', 'throw', 'class', 'extends', 'super', 'default', 'export', 'import', 'from', 'async', 'await', 'yield']);

/** 骨架：标识符 -> I，字符串/数字/运算符/标点/行结构保留 */
function skeleton(src) {
  const noComment = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''));
  const out = [];
  noComment.split(/\r?\n/).forEach((raw, i) => {
    const line = raw
      .replace(/\/\/.*$/, '')
      .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, (s) => ` ${s} `)
      .replace(/[$A-Za-z_][A-Za-z0-9_$]*/g, (m) => (KEYWORDS.has(m) ? m : 'I'))
      .replace(/\s+/g, ' ')
      .trim();
    // 空白行与纯注释行不进比对：否则"新写一段 JSDoc"会被当成凭空插入的语句，行号也跟着错位
    if (line) out.push([i + 1, line]);
  });
  return out;
}

const IMPORT_LINE = /^import (?:\{[^}]*\}|\*) from (?:"[^"]*"|'[^']*') ;$/;

// 逐条授权清单：artifacts/structure-allowlist.json
//   [{ "file": "src/engine/modules/...", "line": "<骨架文本（标识符已抹平）>", "reason": "为什么这不是破坏" }]
// 键是**抹平后的骨架文本**，不是标识符名——改名不会让授权失效（这条踩过：门禁按局部名找代码，
// 重构一改名就瞎了）。新增条目只能在读过那一处之后手工加，diff 里看得见。
let allowList = [];
try {
  allowList = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts', 'structure-allowlist.json'), 'utf8'))
    .map((e) => ({ file: e.file, line: e.line.replace(/\s+/g, ' ').trim(), reason: e.reason }));
} catch { allowList = []; }
function allowlisted(rel, line) {
  const hit = allowList.find((e) => (e.file === rel || rel.endsWith(e.file))
    && e.line === line && (!e.max || (e.used || 0) < e.max));
  if (!hit) return null;
  hit.used = (hit.used || 0) + 1;
  return hit.reason;
}

/** 归一化：把三条已授权模式抹平（成员深度、var 关键字、import 行） */
function normalize(line) {
  if (IMPORT_LINE.test(line)) return 'IMPORT';
  return line.replace(/\.I/g, '').replace(/\bvar /g, '');
}

// 两端收缩 + 中段 LCS（受 MAX_LCS 保护；超限则整段交人工，绝不静默放过）
const MAX_LCS = 3000;
function align(a, b) {
  let lo = 0;
  while (lo < a.length && lo < b.length && a[lo] === b[lo]) lo++;
  let ao = a.length, bo = b.length;
  while (ao > lo && bo > lo && a[ao - 1] === b[bo - 1]) { ao--; bo--; }
  const ops = [];
  for (let i = 0; i < lo; i++) ops.push(['same', i, i]);
  const midA = a.slice(lo, ao), midB = b.slice(lo, bo);
  if (midA.length * midB.length > MAX_LCS * MAX_LCS || midA.length + midB.length > 2 * MAX_LCS) {
    return { ops, overflow: true, m: midA.length, n: midB.length };
  }
  const m = midA.length, n = midB.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = midA[i] === midB[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (midA[i] === midB[j]) { ops.push(['same', lo + i, lo + j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push(['del', lo + i, lo + j]); i++; }
    else { ops.push(['add', lo + i, lo + j]); j++; }
  }
  while (i < m) { ops.push(['del', lo + i, lo + j]); i++; }
  while (j < n) { ops.push(['add', lo + i, lo + j]); j++; }
  for (let k = ao, l = bo; k < a.length; k++, l++) ops.push(['same', k, l]);
  return { ops, overflow: false, m, n };
}

function engineFiles() {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js')) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
    }
  })(path.join(ROOT, 'src/engine/modules'));
  return out;
}

const files = ONLY ? [ONLY] : engineFiles();
let compared = 0, filesChanged = 0, sameRaw = 0, sameNormalized = 0;
let unexplainedTotal = 0, overflowFiles = 0, loneOps = 0;
const unexplained = [];
const tally = new Map();
function count(why, n) { tally.set(why, (tally.get(why) || 0) + n); }

for (const rel of files) {
  let baseSrc;
  try { baseSrc = execFileSync('git', ['show', `${BASE}:${rel}`], { encoding: 'utf8', maxBuffer: 1 << 28 }); }
  catch { continue; }
  const curSrc = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const aRows = skeleton(baseSrc), bRows = skeleton(curSrc);
  const a = aRows.map((r) => r[1]), b = bRows.map((r) => r[1]);
  compared++;
  const { ops, overflow, m, n } = align(a.map(normalize), b.map(normalize));
  if (overflow) {
    overflowFiles++;
    unexplainedTotal++;
    if (unexplained.length < 60) unexplained.push(`${rel}: 中段过大 ${m}x${n}，无法自动对齐，需 --file 单独看`);
    continue;
  }
  let fileUn = 0;
  // 括号脚手架判定：一段完整的新块（或整块搬移）在变动行上的 { } 收支必然为 0；
  // 多塞一个 } 或少一个 { 的破坏会让收支不为 0，所以只有一行纯括号、且本文件收支为 0 时
  // 才把纯括号行当作已授权块的骨架放行，其余情况照旧进人工判定。
  let braceDelta = 0;
  const signedBraces = (line) => (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
  for (const [kind, ai, bi] of ops) {
    if (kind === 'same') {
      const dl = a[ai], cl = b[bi];
      if (dl === cl) continue;
      braceDelta += signedBraces(cl) - signedBraces(dl);
      continue;
    }
    braceDelta += (kind === 'add' ? 1 : -1) * signedBraces(kind === 'del' ? a[ai] : b[bi]);
  }
  const bracesBalanced = braceDelta === 0;
  const isBraceOnly = (line) => /^[[\]{}();,]+$/.test(line);
  for (let oi = 0; oi < ops.length; oi++) {
    const [kind, ai, bi] = ops[oi];
    if (kind === 'same') {
      const dl = a[ai], cl = b[bi];
      if (dl === cl) continue;
      sameRaw++;
      if (IMPORT_LINE.test(dl) || IMPORT_LINE.test(cl)) count('import 行（解耦切片：常量/依赖注入）', 1);
      else if (dl.replace(/\.I/g, '') === cl.replace(/\.I/g, '')) count('成员深度变化（解耦切片：game.X -> 裸标识符）', 1);
      else count('var 关键字位置（改名工具 autoDeclare）', 1);
      sameNormalized++;
      continue;
    }
    // 插入/删除整行：只有 import 行是授权的（解耦切片新增依赖；删 import 由 build 兜）
    if (kind === 'add' && IMPORT_LINE.test(b[bi])) { count('新增 import 行（解耦切片）', 1); continue; }
    if (kind === 'del' && IMPORT_LINE.test(a[ai])) { count('删除 import 行（解耦切片）', 1); continue; }
    const whyAllowed = allowlisted(rel, kind === 'add' ? b[bi] : a[ai]);
    if (whyAllowed) { count('逐条授权的插入/删除', 1); continue; }
    if (bracesBalanced && isBraceOnly(kind === 'add' ? b[bi] : a[ai])) { count('纯括号脚手架（本文件变动行括号收支为 0）', 1); continue; }
    unexplainedTotal++; fileUn++;
    const line = kind === 'del' ? a[ai] : b[bi];
    const srcLine = kind === 'del' ? aRows[ai][0] : bRows[bi][0];
    // 对面方向 3 个 op 内没有配对的 del/add —— 凭空多出一整条语句，正是"探针/破坏"的形状
    let paired = false;
    for (let k = Math.max(0, oi - 3); k <= Math.min(ops.length - 1, oi + 3); k++) {
      if (k === oi) continue;
      if (ops[k][0] === (kind === 'add' ? 'del' : 'add')) { paired = true; break; }
    }
    if (!paired) loneOps++;
    if (unexplained.length < (ALL ? Infinity : 60))
      unexplained.push(`${paired ? '     ' : '孤立!'} ${rel}:${srcLine} ${kind === 'del' ? '-' : '+'} ${line.slice(0, 150)}`);
  }
  if (fileUn) filesChanged++;
}

if (EXPLAIN) {
  for (const [why, num] of [...tally].sort((x, y) => y[1] - x[1])) console.log(`${String(num).padStart(6)}  ${why}`);
  console.log('');
}
const sanctionedTotal = [...tally.values()].reduce((x, y) => x + y, 0);
console.log(`结构对账：${compared} 个文件（base=${BASE}）；已授权结构变动 ${sanctionedTotal} 行，待人工判定 ${unexplainedTotal} 行（涉及 ${filesChanged + overflowFiles} 个文件），其中无配对插入/删除 ${loneOps} 行`);
const idle = allowList.filter((e) => !e.used);
if (idle.length) console.log(`提示：授权清单里有 ${idle.length} 条本次未被用到（可能是历史条目，删掉或留着都行，但它不再保护任何东西）：`);
for (const e of idle) console.log(`  闲置 ${e.file} :: ${e.line.slice(0, 70)}`);
if (unexplained.length) {
  console.log('\n待人工判定的变动（最多列 60 条）:');
  for (const u of unexplained) console.log('  ' + u);
}
process.exitCode = unexplainedTotal ? 1 : 0;
