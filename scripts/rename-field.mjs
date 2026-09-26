// 语义重命名执行器：把单个混淆字段名在给定文件中替换为语义名，并在写盘前校验
// 命中数、行数、字符串字面量多重集与缩进结构。任一校验失败则整批不写盘。
// 用法: node scripts/rename-field.mjs <old>=<new> <file...> --expect <count>
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('用法: rename-field.mjs <old>=<new> <file...> --expect <total>');
  process.exit(2);
}
const [mapping, ...rest] = args;
const expectIdx = rest.indexOf('--expect');
if (expectIdx === -1) {
  console.error('缺少 --expect <total>');
  process.exit(2);
}
const expected = Number(rest[expectIdx + 1]);
const files = rest.filter((_, i) => i < expectIdx);
const [oldName, newName] = mapping.split('=');
if (!oldName || !newName) {
  console.error('映射格式应为 <old>=<new>');
  process.exit(2);
}

const stripQuotes = (s) => s.replace(/^["']|["']$/g, '');
const literalsOf = (s) => (s.match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g) || []).sort();

const escapeRe = (text) => text.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
const escaped = escapeRe(oldName);
const memberRe = new RegExp('\\.' + escaped + '\\b', 'g');
const keyRe = new RegExp('^([ \\t]*)' + escaped + ':', 'gm');
const shorthandRe = new RegExp('^([ \\t]*)' + escaped + '\\s*,', 'gm');
// M10 的窄签名标注写在 /** @typedef ... */ / /** @type {...} */ 注释里，
// 成员名不带前导点，因此只在含这两个标记的行内替换 `NAME:`。
const typedefKeyRe = new RegExp('([\\{,\\s])' + escaped + ':(?=\\s)', 'g');
const isTypeAnnotation = (line) => line.includes('@typedef') || line.includes('@type {');

const staged = [];
let totalHits = 0;
for (const file of files) {
  const orig = fs.readFileSync(file, 'utf8');
  const origLines = orig.split('\n');
  let hits = 0;
  const bump = (to) => () => { hits++; return to; };
  let next = orig.replace(memberRe, bump('.' + newName));
  next = next.replace(keyRe, (_m, ind) => { hits++; return ind + newName + ':'; });
  next = next.replace(shorthandRe, (_m, ind) => { hits++; return ind + newName + ','; });
  next = next.split('\n').map((line) => (isTypeAnnotation(line)
    ? line.replace(typedefKeyRe, (_m2, pre) => { hits++; return pre + newName + ':'; })
    : line)).join('\n');

  const newLines = next.split('\n');
  if (newLines.length !== origLines.length) {
    throw new Error(`${file}: 行数由 ${origLines.length} 变为 ${newLines.length}`);
  }
  for (let i = 0; i < origLines.length; i++) {
    const a = origLines[i], b = newLines[i];
    if (a === b) continue;
    const leadA = a.slice(0, a.length - a.trimStart().length);
    const leadB = b.slice(0, b.length - b.trimStart().length);
    if (leadA !== leadB) throw new Error(`${file}:${i + 1} 缩进改变 ${JSON.stringify(leadA)} -> ${JSON.stringify(leadB)}`);
  }
  const before = literalsOf(orig).join('\n');
  const after = literalsOf(next).join('\n');
  if (before !== after) throw new Error(`${file}: 字符串字面量多重集发生变化`);
  totalHits += hits;
  staged.push({ file, orig, next, hits });
}

if (totalHits !== expected) {
  throw new Error(`${oldName}: 命中 ${totalHits} 次，期望 ${expected} 次（未写盘）`);
}
for (const { file, next, hits } of staged) {
  fs.writeFileSync(file, next);
  console.log(`${file}: ${hits} 处  ${oldName} -> ${newName}`);
}
console.log(`合计 ${totalHits} 处已写入。`);

// 事后全库回扫：同名字段若还有残留在别处（尤其是另一文件里的数据表字面量键），
// 读取端就会拿到 undefined。本轮这类事故真实发生过（rarity 表的键在 balance.js，
// 读取端在 items.js），差分流水在 99 回合后才发现，故在此当场报出。
const leftoverRe = new RegExp('(^|[ \\t])' + escaped + ':|\\.' + escaped + '\\b');
const stagedFiles = new Set(staged.map((s) => s.file.split(path.sep).join('/')));
const leftovers = [];
(function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { scan(full); continue; }
    if (!full.endsWith('.js') || stagedFiles.has(full.split(path.sep).join('/'))) continue;
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    lines.forEach((line, i) => { if (leftoverRe.test(line)) leftovers.push(`${full}:${i + 1}: ${line.trim().slice(0, 90)}`); });
  }
})('src');
if (leftovers.length) {
  console.log(`\n!! 残留 ${oldName}（不在本次文件表内，可能是另一文件里的数据表键或同名他类字段）：`);
  console.log(leftovers.slice(0, 12).join('\n'));
}
