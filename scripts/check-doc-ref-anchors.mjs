// 文档正文里的 `path.js:123-456` 引用可回源**内容**校验（verify-doc-refs 只管存在与越界）。
//
// 为什么需要：verify-doc-refs 能抓"行号超出文件长度"，但解耦切片只会让文件**变长**，
// 于是所有旧行号仍然"在界内"，却指向别的代码——这正是"文档与代码相互矛盾"这一类
// 项目明令禁止的收尾状态，而且是静默的。本脚本用一个可解释的判据抓它：
//   取引用所在的那一行文档，抽出其中反引号里的标识符（长度 >= 2，排除常见虚词），
//   再看被引用的源码区间（上下各扩 4 行缓冲）里有没有出现其中**任意一个**。
//   一个都没出现 => 这条引用的行号大概率已经漂移，进待人工复核清单。
// 这是启发式：文档可能只写中文说明、或引用的是概念而非具体符号，因此本脚本**默认只报告**，
// 棘轮模式（--compare-baseline）只在"待复核数超过基线"时失败，避免把噪音当进步。
//
//   node scripts/check-doc-ref-anchors.mjs [--docs a.md,b.md] [--json] [--update-baseline]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf('--' + name);
  return i === -1 ? dflt : argv[i + 1];
};
const UPDATE = argv.includes('--update-baseline');
const BASELINE = path.join(ROOT, 'artifacts', 'doc-ref-anchors-baseline.json');

const DOC_LIST = (arg('docs', '') || '').split(',').filter(Boolean);
const docs = DOC_LIST.length ? DOC_LIST : (function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!['node_modules', '.git', 'dist', 'output'].includes(e.name)) walk(path.join(dir, e.name), acc); }
    else if (e.name.endsWith('.md')) acc.push(path.relative(ROOT, path.join(dir, e.name)).split(path.sep).join('/'));
  }
  return acc;
})('docs');

const SRC_ROOTS = ['src/engine/modules', 'src', '.', 'tests', 'scripts', 'archive/original'];
const RESOLVE_CACHE = new Map();
function resolveSource(ref) {
  if (RESOLVE_CACHE.has(ref)) return RESOLVE_CACHE.get(ref);
  let hit = null;
  for (const root of SRC_ROOTS) {
    const p = path.join(ROOT, root, ref);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) { hit = p; break; }
  }
  RESOLVE_CACHE.set(ref, hit);
  return hit;
}

const STOP = new Set(['js', 'mjs', 'md', 'json', 'the', 'if', 'else', 'for', 'return', 'null', 'true', 'false', 'src', 'var', 'let', 'const', 'function']);
const REF_RE = /([A-Za-z0-9_\-./\\]+\.js)(?::(\d+))(?:\s*[-–]\s*(\d+))?/g;

const findings = [];
let checkedRefs = 0;
for (const doc of docs) {
  const abs = path.join(ROOT, doc);
  if (!fs.existsSync(abs)) continue;
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  lines.forEach((lineText, idx) => {
    if (!/\.js:\d/.test(lineText)) return;
    // 反引号里的标识符就是这条引用声称"那里有这个东西"的锚点
    const anchors = [...lineText.matchAll(/`([^`]+)`/g)]
      .map((m) => m[1])
      // 反引号里常常是路径（`src/engine/modules/characters/movement.js`），它贡献的
      // characters/movement 这类词永远不可能出现在被引用区间里，只会制造假阳性 —— 路径型 chunk 整个跳过
      .filter((chunk) => !/[/.]/.test(chunk))
      .flatMap((chunk) => chunk.match(/[A-Za-z_$][\w$]{2,}/g) || [])
      .filter((t) => !STOP.has(t.toLowerCase()));
    if (!anchors.length) return;
    for (const m of lineText.matchAll(REF_RE)) {
      const [, rel, startStr, endStr] = m;
      const file = resolveSource(rel);
      if (!file) continue;
      const srcLines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
      const start = Number(startStr);
      const end = endStr ? Number(endStr) : start;
      if (start > srcLines.length || end > srcLines.length) continue; // 交给 verify-doc-refs
      checkedRefs++;
      const from = Math.max(0, start - 1 - 4);
      const to = Math.min(srcLines.length, end + 4);
      const window = srcLines.slice(from, to).join('\n');
      const hit = anchors.some((a) => window.includes(a));
      if (hit) continue;
      findings.push({ doc, line: idx + 1, ref: rel + ':' + start + (endStr ? '-' + end : ''), anchors: [...new Set(anchors)].slice(0, 6) });
    }
  });
}

const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : null;
if (UPDATE) {
  fs.writeFileSync(BASELINE, JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), checkedRefs, suspect: findings.length }, null, 2) + '\n');
  console.log('基线已写入 artifacts/doc-ref-anchors-baseline.json：checked=' + checkedRefs + ' suspect=' + findings.length);
  process.exit(0);
}
if (argv.includes('--json')) {
  // 机读模式只输出 JSON：混进一行说明文本会让下游 JSON.parse 直接失败（踩过）
  process.stdout.write(JSON.stringify({ checkedRefs, suspect: findings.length, findings }, null, 2));
} else {
  console.log(`文档正文行引用的锚点校验：解析 ${checkedRefs} 条带锚点的引用，其中源码区间内找不到任何锚点 => ${findings.length} 条待人工复核`);
  for (const f of findings.slice(0, 25)) console.log(`  ${f.doc}:${f.line} -> ${f.ref}  锚点=${f.anchors.join(',')}`);
  if (findings.length > 25) console.log(`  …另有 ${findings.length - 25} 条（--json 看全量）`);
}
if (baseline && findings.length > baseline.suspect) {
  console[argv.includes('--json') ? 'error' : 'log'](`\n✗ 比基线增加 ${findings.length - baseline.suspect} 条（基线 ${baseline.suspect}）：新增的切片改动没把受影响的正文引用一起搬过去。`);
  process.exitCode = 1;
} else if (baseline && !argv.includes('--json')) {
  console.log(`（基线 ${baseline.suspect}，本次 ${findings.length}）`);
}
