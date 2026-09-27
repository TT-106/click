// 删除文件名尾随不可见字符（U+F00D）的垃圾同名文件。
// 每个垃圾文件都是 99 字节、内容仅一行 `// @ts-nocheck -- M10 渐进类型化：…`，
// 且必定存在同名正常文件（twin）。删除前逐条断言这三件事，任何不符即整批中止。
// 删除用 fs.unlinkSync（避免把含隐形字符的路径交给 git CLI），之后 git 会显示为 deleted，
// 用普通 commit 落地即可完整回滚。
// 用法: node scripts/remove-invisible-name-files.mjs [--apply]
import fs from 'node:fs';
import path from 'node:path';

const apply = process.argv.includes('--apply');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'output', '.workbuddy-ai']);
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\uE000-\uF8FF]/u;
const JUNK_LINE = '@ts-nocheck';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

const targets = [];
for (const file of walk('.')) {
  const base = path.basename(file);
  if (!INVISIBLE.test(base)) continue;
  const stat = fs.statSync(file);
  const text = fs.readFileSync(file, 'utf8');
  const twin = file.replace(INVISIBLE, '');
  const problems = [];
  if (stat.size > 200) problems.push(`体积 ${stat.size}B 过大`);
  if (!text.includes(JUNK_LINE)) problems.push('内容不含 @ts-nocheck');
  if (!fs.existsSync(twin)) problems.push('无同名正常文件');
  targets.push({ file, twin, size: stat.size, problems });
}

const bad = targets.filter((t) => t.problems.length);
if (bad.length) {
  console.error('以下文件不符合"可安全删除"的三条断言，整批中止：');
  for (const t of bad) console.error(`  ${t.file} :: ${t.problems.join('；')}`);
  process.exit(1);
}

console.log(`待删除 ${targets.length} 个垃圾同名文件（全部 99B、内容为 @ts-nocheck 注释、且存在同名正常文件）`);
for (const t of targets) console.log(`  ${t.size}B  ${path.basename(t.file).replace(INVISIBLE, (c) => '\\u' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'))}  ->  ${path.basename(t.twin)}`);

if (!apply) {
  console.log('\n--apply 未指定：仅盘点，未删除。');
} else {
  for (const t of targets) fs.unlinkSync(t.file);
  console.log(`\n已删除 ${targets.length} 个文件（git 中显示为 deleted，commit 后可完整回滚）。`);
}
