// 语义重命名批处理执行器：一次事务处理多个字段映射，全部校验通过才写盘。
// 校验规则与 rename-field.mjs 完全一致（行数/缩进/字符串字面量多重集/命中数），
// 并在写盘后对全部旧名做全库回扫，报告不在本次文件表内的残留。
// 用法: node scripts/rename-fields-batch.mjs <mapping.json> [--dry]
// mapping.json 格式: [{"old":"Ek","new":"cachedRunItemsFound","files":["src/..."],"expect":4}, ...]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const mapFile = args.find((a) => !a.startsWith('--'));
if (!mapFile) {
  console.error('用法: rename-fields-batch.mjs <mapping.json> [--dry]');
  process.exit(2);
}
const raw = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
// 支持两种格式：数组 [{old,new,files,expect}] 或紧凑对象 {"files":[...], "map":{"Old":"New"}}
const mappings = Array.isArray(raw)
  ? raw
  : Object.entries(raw.map).map(([oldName, newName]) => ({ old: oldName, new: newName, files: raw.files, expect: 'auto' }));

const literalsOf = (s) => (s.match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g) || []).sort();
const escapeRe = (text) => text.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
const isTypeAnnotation = (line) => line.includes('@typedef') || line.includes('@type {');

// 收集全部涉及文件，逐个应用全部映射（读写一次，事务性写盘）
const allFiles = [...new Set(mappings.flatMap((m) => m.files))];
const state = new Map(); // file -> { orig, next, lines }
for (const file of allFiles) {
  const orig = fs.readFileSync(file, 'utf8');
  state.set(file, { orig, next: orig, hits: new Map() });
}

for (const { old: oldName, new: newName, files, expect } of mappings) {
  if (!oldName || !newName) throw new Error('映射缺少 old/new');
  const escaped = escapeRe(oldName);
  const memberRe = new RegExp('\\.' + escaped + '\\b', 'g');
  const keyRe = new RegExp('^([ \\t]*)' + escaped + ':', 'gm');
  const shorthandRe = new RegExp('^([ \\t]*)' + escaped + '\\s*,', 'gm');
  const typedefKeyRe = new RegExp('([\\{,\\s])' + escaped + ':(?=\\s)', 'g');
  let totalHits = 0;
  for (const file of files) {
    const s = state.get(file);
    let hits = 0;
    const bump = (to) => () => { hits++; return to; };
    let next = s.next.replace(memberRe, bump('.' + newName));
    next = next.replace(keyRe, (_m, ind) => { hits++; return ind + newName + ':'; });
    next = next.replace(shorthandRe, (_m, ind) => { hits++; return ind + newName + ','; });
    next = next.split('\n').map((line) => (isTypeAnnotation(line)
      ? line.replace(typedefKeyRe, (_m2, pre) => { hits++; return pre + newName + ':'; })
      : line)).join('\n');
    s.next = next;
    s.hits.set(oldName, (s.hits.get(oldName) || 0) + hits);
    totalHits += hits;
  }
  if (expect !== 'auto' && totalHits !== expect) {
    throw new Error(`${oldName} -> ${newName}: 命中 ${totalHits} 次，期望 ${expect} 次（整批未写盘）`);
  }
  console.log(`${oldName} -> ${newName}: ${totalHits} 处${expect === 'auto' ? ' (auto)' : ''}`);
}

// 行数 / 缩进 / 字符串字面量校验
for (const [file, s] of state) {
  if (s.orig === s.next) continue;
  const origLines = s.orig.split('\n');
  const newLines = s.next.split('\n');
  if (newLines.length !== origLines.length) {
    throw new Error(`${file}: 行数由 ${origLines.length} 变为 ${newLines.length}（整批未写盘）`);
  }
  for (let i = 0; i < origLines.length; i++) {
    const a = origLines[i], b = newLines[i];
    if (a === b) continue;
    const leadA = a.slice(0, a.length - a.trimStart().length);
    const leadB = b.slice(0, b.length - b.trimStart().length);
    if (leadA !== leadB) throw new Error(`${file}:${i + 1} 缩进改变（整批未写盘）`);
  }
  if (literalsOf(s.orig).join('\n') !== literalsOf(s.next).join('\n')) {
    throw new Error(`${file}: 字符串字面量多重集发生变化（整批未写盘）`);
  }
}

if (dry) {
  console.log('\n--dry：校验通过，未写盘。');
} else {
  for (const [file, s] of state) {
    if (s.orig === s.next) continue;
    fs.writeFileSync(file, s.next);
    console.log(`已写入 ${file}（${s.hits.size} 个字段受影响）`);
  }
  console.log(`\n合计 ${allFiles.length} 个文件已处理。`);
}

// 全库回扫：所有旧名在 src/tests/scripts 内的残留（不在本次文件表中的会报出）
const stagedFiles = new Set(allFiles.map((f) => path.normalize(f)));
const leftovers = [];
for (const root of ['src', 'tests', 'scripts']) {
  if (!fs.existsSync(root)) continue;
  (function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { scan(full); continue; }
      if (!/\.(js|mjs)$/.test(full)) continue;
      if (stagedFiles.has(path.normalize(full))) continue;
      const lines = fs.readFileSync(full, 'utf8').split('\n');
      lines.forEach((line, i) => {
        for (const { old: oldName } of mappings) {
          if (new RegExp('(^|[ \\t])' + escapeRe(oldName) + ':|\\.' + escapeRe(oldName) + '\\b').test(line)) {
            leftovers.push(`${oldName} @ ${full}:${i + 1}: ${line.trim().slice(0, 80)}`);
          }
        }
      });
    }
  })(root);
}
if (leftovers.length) {
  console.log(`\n!! 旧名残留 ${leftovers.length} 处（不在本次文件表内，可能属他类字段）：`);
  console.log(leftovers.slice(0, 20).join('\n'));
  if (leftovers.length > 20) console.log(`... 另有 ${leftovers.length - 20} 处`);
} else {
  console.log('\n全库回扫：无旧名残留。');
}