// 盘点文件名中含不可见字符（U+F00D 等）的"垃圾同名文件"。
// 背景：仓库里存在成对的 X.js 与 X.js\uF00D，后者只有 99 字节、内容仅一行
// `// @ts-nocheck -- …` 注释，是历史脚本误写留下的残渣；因为名字尾随不可见字符，
// 常规的 *.js 匹配（check.mjs / analyze-fields.mjs / 人工 ls）都看不见它们。
// 用法: node scripts/find-invisible-name-files.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'output', '.workbuddy-ai']);
// 文件名里的"隐形"字符：控制字符、零宽/双向格式符、BOM、私用区（U+F00D 等）
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\uE000-\uF8FF]/u;

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

const files = walk('.');
const junk = [];
for (const file of files) {
  const base = path.basename(file);
  if (!INVISIBLE.test(base)) continue;
  const stat = fs.statSync(file);
  const head = fs.readFileSync(file, 'utf8').split('\n').slice(0, 2).join(' ⏎ ').slice(0, 100);
  const clean = file.replace(INVISIBLE, '');
  junk.push({
    file,
    escaped: base.replace(INVISIBLE, (c) => '\\u' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')),
    size: stat.size,
    twinExists: fs.existsSync(clean),
    head,
  });
}

console.log(`含不可见字符的文件名：${junk.length} 个`);
for (const j of junk) {
  console.log(`  ${j.size}B  twin=${j.twinExists ? 'yes' : 'NO '}  ${j.escaped}  ::  ${j.head}`);
}
const allJunkLike = junk.every((j) => j.twinExists);
console.log(`\n全部都有同名正常文件（twin=yes）：${allJunkLike}`);
