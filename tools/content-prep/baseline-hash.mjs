// T0 基线工具:对保护范围文件做 SHA256 清单。
// 用法: node tools/content-prep/baseline-hash.mjs <output-list.txt>
// 只读扫描,不改任何被扫文件。
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, sep, resolve, isAbsolute } from 'node:path';

const root = process.cwd();
const outPath = process.argv[2];
const comparison = process.argv[3];
if (!outPath) {
  console.error('usage: node tools/content-prep/baseline-hash.mjs <output-list.txt> [--compare=baseline.txt]');
  process.exit(2);
}
const outputRelative = relative(resolve(root, 'output'), resolve(root, outPath));
if (outputRelative.startsWith('..') || isAbsolute(outputRelative)) throw new Error('哈希清单输出必须在 output/ 内');
if (comparison && !comparison.startsWith('--compare=')) throw new Error('比较参数必须为 --compare=baseline.txt');
const comparePath = comparison?.slice('--compare='.length);
if (comparePath && resolve(comparePath) === resolve(outPath)) throw new Error('不能覆盖待比较的基线');

// 保护范围(相对 root)。目录递归;单文件直接列。
const protectedPaths = [
  'src',
  'index.html',
  'scripts',
  'tests',
  'desktop',
  'package.json',
  'package-lock.json',
  'assets/themes',
  'assets/actors', // 可能不存在,记录 missing
  'assets/vendor',
  'spritesheet',
  'images',
  'docs/ECONOMY-BASE-DESIGN-V1.md',
  'docs/BUILDING-ASSET-RESEARCH.md',
  'archive/original',
];

const skipDirs = new Set(['node_modules', '.git', '__pycache__']);

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      yield* walk(join(dir, entry.name));
    } else if (entry.isFile()) {
      yield join(dir, entry.name);
    }
  }
}

const lines = [];
let hashed = 0;
let bytes = 0;
const missing = [];

for (const p of protectedPaths) {
  const abs = join(root, p);
  if (!existsSync(abs)) {
    missing.push(p);
    continue;
  }
  const st = statSync(abs);
  const files = st.isFile() ? [abs] : [...walk(abs)];
  for (const f of files) {
    const buf = readFileSync(f);
    const h = createHash('sha256').update(buf).digest('hex').toUpperCase();
    lines.push(`${h}  ${relative(root, f).split(sep).join('/')}`);
    hashed += 1;
    bytes += buf.length;
  }
}

lines.sort();
const header = [
  `# protected-baseline ${new Date().toISOString()}`,
  `# root: ${root}`,
  `# files: ${hashed}, bytes: ${bytes}`,
  `# missing-paths: ${missing.length ? missing.join(',') : '(none)'}`,
  '',
];
writeFileSync(outPath, header.join('\n') + lines.join('\n') + '\n', 'utf8');
console.log(`hashed ${hashed} files, ${bytes} bytes; missing: ${missing.length ? missing.join(',') : 'none'}`);
console.log(`written: ${outPath}`);
if (comparePath) {
  const parseLines = text => new Map(text.split(/\r?\n/).filter(line => /^[A-F0-9]{64}  /i.test(line))
    .map(line => [line.slice(66), line.slice(0, 64).toUpperCase()]));
  const baseline = parseLines(readFileSync(comparePath, 'utf8'));
  if (!baseline.size) throw new Error('比较基线没有任何有效文件哈希');
  const current = parseLines(lines.join('\n'));
  const changed = [...baseline].filter(([path, hash]) => current.has(path) && current.get(path) !== hash).map(([path]) => path);
  const removed = [...baseline.keys()].filter(path => !current.has(path));
  const added = [...current.keys()].filter(path => !baseline.has(path));
  const report = { baselineFiles: baseline.size, currentFiles: current.size, changed, removed, added,
    unchanged: baseline.size - changed.length - removed.length };
  writeFileSync(outPath + '.comparison.json', JSON.stringify(report, null, 2) + '\n');
  console.log(`比对: ${report.unchanged}/${baseline.size} 一致, ${changed.length} 变化, ${removed.length} 缺失, ${added.length} 新增`);
  if (changed.length || removed.length || added.length) process.exitCode = 1;
}
