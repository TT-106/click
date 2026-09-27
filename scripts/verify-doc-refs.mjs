// 文档 file:line 引用可回源校验（规范 §P2："每行证据必须仍可回源"）。
// 从 md 文件里抽出 `path/to/file.js:123` / `:123-456` 形态的引用，逐个解析：
//   1) 文件是否存在（按若干候选根目录解析）
//   2) 行号是否在文件行数范围内
// 只报告"解析不到 / 越界"的引用，供人工判断是行号漂移还是路径笔误。
// 用法: node scripts/verify-doc-refs.mjs [file.md ...]   默认 REFACTOR_REPORT.md 等四份报告
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['.', 'src', 'src/engine/modules', 'src/ui', 'src/data', 'archive/original', 'tests', 'scripts', 'docs'];

const defaultDocs = ['REFACTOR_REPORT.md', 'COMPATIBILITY_REPORT.md', 'PERFORMANCE_REPORT.md', 'MIGRATION_MAP.md'];
// 无参数时默认检查"根目录四份报告 + docs/ 下全部 md"——只查四份报告会漏掉
// docs/formulas/*、docs/rng.md 等引用密度最高的文件（曾经因此漏报 4 条越界）。
function collectDocs() {
  const out = [...defaultDocs];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(full); }
      else if (e.name.endsWith('.md')) out.push(full);
    }
  };
  if (fs.existsSync('docs')) walk('docs');
  return out;
}
const docs = process.argv.slice(2).length ? process.argv.slice(2) : collectDocs();

const REF = /`([A-Za-z0-9_\-./]+\.(?:js|mjs|json|md|css|html|c2save)):(\d+)(?:-(\d+))?`/g;

// 仓库文件按 basename 建索引：文档里大量引用写作裸文件名（`loop.js:87`），
// 需要靠唯一 basename 反查真实路径；同名多份时报歧义而不猜。
const SKIP = new Set(['node_modules', '.git', 'dist', 'output', '.workbuddy-ai']);
const byBase = new Map();
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP.has(e.name)) continue;
      walk(path.join(dir, e.name));
    } else {
      const list = byBase.get(e.name) ?? [];
      list.push(path.normalize(path.join(dir, e.name)));
      byBase.set(e.name, list);
    }
  }
})('.');

function resolveRef(rel, needLine) {
  for (const root of ROOTS) {
    const cand = path.normalize(path.join(root, rel));
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return { file: cand };
  }
  const base = path.basename(rel);
  const hits = byBase.get(base);
  if (!hits) return { file: null };
  if (hits.length === 1) return { file: hits[0] };
  // 同名多份：只报告歧义，不猜。docs/formulas/*.md 已在文首声明缩写约定
  // （`character.js` = `characters/character.js`），因此这些引用不算错误。
  return { file: null, ambiguous: hits };
}

let total = 0;
let unresolved = 0;
let ambiguous = 0;
let outOfRange = 0;
for (const doc of docs) {
  if (!fs.existsSync(doc)) continue;
  const text = fs.readFileSync(doc, 'utf8');
  const seen = new Set();
  for (const m of text.matchAll(REF)) {
    const [full, rel, startStr, endStr] = m;
    const key = `${rel}:${startStr}`;
    if (seen.has(key)) continue;
    seen.add(key);
    total++;
    const { file, ambiguous: amb } = resolveRef(rel, Number(endStr ?? startStr));
    if (amb) {
      ambiguous++;
      console.log(`~ 同名歧义  ${doc}  ->  ${rel}:${startStr}（候选：${amb.map((h) => path.relative('.', h)).join(' / ')}）`);
      continue;
    }
    if (!file) {
      unresolved++;
      console.log(`? 解析不到  ${doc}  ->  ${rel}:${startStr}`);
      continue;
    }
    const lines = fs.readFileSync(file, 'utf8').split('\n').length;
    const end = Number(endStr ?? startStr);
    if (end > lines) {
      outOfRange++;
      console.log(`! 行号越界  ${doc}  ->  ${rel}:${startStr}${endStr ? '-' + endStr : ''}（${path.relative('.', file)} 仅 ${lines} 行）`);
    }
  }
}

console.log(`\n共检查 ${total} 条唯一 file:line 引用：解析不到 ${unresolved} 条，同名歧义 ${ambiguous} 条（按文档声明的缩写约定视为可接受），行号越界 ${outOfRange} 条。`);
console.log('（"解析不到"通常说明路径写法与仓库布局不一致；"越界"通常说明改名批移动了行号。）');
