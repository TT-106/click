// 逆向辅助：打印某字段名在 src/tests/scripts 内的所有成员访问行（带文件与行号），
// 用于跨文件字段的语义取证（成员访问、字面量键、typedef 标注均列出）。
// 用法: node scripts/show-field-uses.mjs <name> [name2 ...]
import fs from 'node:fs';
import path from 'node:path';

const names = process.argv.slice(2);
if (!names.length) { console.error('用法: show-field-uses.mjs <name> [name2 ...]'); process.exit(2); }
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

for (const root of ['src', 'tests', 'scripts']) {
  if (!fs.existsSync(root)) continue;
  (function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { scan(full); continue; }
      if (!/\.(js|mjs)$/.test(full)) continue;
      const lines = fs.readFileSync(full, 'utf8').split('\n');
      lines.forEach((line, i) => {
        for (const n of names) {
          const re = new RegExp('\\.' + esc(n) + '\\b|(^|[ \\t{])' + esc(n) + ':');
          if (re.test(line)) console.log(`${path.relative('.', full)}:${i + 1}: ${line.trim().slice(0, 130)}`);
        }
      });
    }
  })(root);
}