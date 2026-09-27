// 原子标识符重命名：在一次正则 pass 内完成多对多映射，用于「名字循环置换」
// （如曲线名 monsterDamageCurve→monsterHealthCurve 且 monsterHealthCurve→monsterDamageCurve）。
// 逐条 rename-field 会在中间态互相污染，此处不可用；必须单 pass 查表替换。
// 用法: node scripts/rename-identifiers-atomic.mjs <mapping.json> [--dry]
// mapping.json: {"files":[...], "map":{"old":"new", ...}}
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const mapFile = args.find((a) => !a.startsWith('--'));
const raw = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
const files = raw.files;
const map = raw.map;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const oldNames = Object.keys(map);
const re = new RegExp('\\b(' + oldNames.map(esc).join('|') + ')\\b', 'g');
const literalsOf = (s) => (s.match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g) || []).sort();

const hitsPerName = new Map();
const staged = [];
for (const file of files) {
  const orig = fs.readFileSync(file, 'utf8');
  let hits = 0;
  const next = orig.replace(re, (m) => { hits++; hitsPerName.set(m, (hitsPerName.get(m) || 0) + 1); return map[m]; });
  const origLines = orig.split('\n');
  const newLines = next.split('\n');
  if (newLines.length !== origLines.length) {
    throw new Error(`${file}: 行数变化（整批未写盘）`);
  }
  for (let i = 0; i < origLines.length; i++) {
    if (origLines[i] === newLines[i]) continue;
    const leadA = origLines[i].slice(0, origLines[i].length - origLines[i].trimStart().length);
    const leadB = newLines[i].slice(0, newLines[i].length - newLines[i].trimStart().length);
    if (leadA !== leadB) throw new Error(`${file}:${i + 1} 缩进改变（整批未写盘）`);
  }
  if (literalsOf(orig).join('\n') !== literalsOf(next).join('\n')) {
    throw new Error(`${file}: 字符串字面量多重集变化（整批未写盘）`);
  }
  staged.push({ file, orig, next, hits });
}

for (const [name, n] of hitsPerName) console.log(`${name} → ${map[name]}: ${n} 处`);
const total = [...hitsPerName.values()].reduce((a, b) => a + b, 0);
console.log(`合计 ${total} 处。`);

if (dry) {
  console.log('--dry：校验通过，未写盘。');
} else {
  for (const s of staged) {
    if (s.orig !== s.next) fs.writeFileSync(s.file, s.next);
  }
  console.log(`已写入 ${staged.length} 个文件。`);
}

// 回扫：确认旧名已全部消失。
// 注意：若新名与旧名集合有交集（名字置换），回扫必然命中合法的新名，故跳过并说明。
const swapped = Object.values(map).some((n) => oldNames.includes(n));
if (swapped) {
  console.log('\n（名字置换：回扫跳过——新名与旧名有交集，命中无法区分合法新名与残留。）');
} else {
  const checkRe = new RegExp('\\b(' + oldNames.map(esc).join('|') + ')\\b');
  const leftovers = [];
  for (const root of ['src', 'tests', 'scripts']) {
    if (!fs.existsSync(root)) continue;
    (function scan(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { scan(full); continue; }
        if (!/\.(js|mjs)$/.test(full)) continue;
        const lines = fs.readFileSync(full, 'utf8').split('\n');
        lines.forEach((line, i) => {
          if (checkRe.test(line)) leftovers.push(`${full}:${i + 1}: ${line.trim().slice(0, 100)}`);
        });
      }
    })(root);
  }
  console.log(leftovers.length ? `\n!! 旧名残留 ${leftovers.length} 处：\n${leftovers.slice(0, 10).join('\n')}` : '\n回扫：无旧名残留。');
}