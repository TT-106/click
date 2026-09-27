// 逆向辅助：统计给定字段名集合在指定文件之外的引用位置，用于评估重命名的属主边界。
// 用法: node scripts/find-field-refs.mjs <ownerfile> <name1,name2,...>
import fs from 'node:fs';
import path from 'node:path';

const owner = path.normalize(process.argv[2]);
const names = process.argv[3].split(',').map((s) => s.trim()).filter(Boolean);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hits = new Map();
for (const n of names) hits.set(n, []);

for (const root of ['src', 'tests', 'scripts', 'index.html']) {
  if (!fs.existsSync(root)) continue;
  if (!fs.statSync(root).isDirectory()) {
    const src = fs.readFileSync(root, 'utf8');
    for (const n of names) {
      const re = new RegExp('\\.' + esc(n) + '\\b', 'g');
      const m = src.match(re);
      if (m) hits.get(n).push(`${root}(${m.length})`);
    }
    continue;
  }
  (function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { scan(full); continue; }
      if (!/\.(js|mjs|json|html)$/.test(full)) continue;
      if (path.normalize(full) === owner) continue;
      const src = fs.readFileSync(full, 'utf8');
      for (const n of names) {
        const re = new RegExp('\\.' + esc(n) + '\\b', 'g');
        const m = src.match(re);
        if (m) hits.get(n).push(`${path.relative('.', full)}(${m.length})`);
      }
    }
  })(root);
}

let total = 0;
for (const [n, list] of hits) {
  if (!list.length) continue;
  total++;
  console.log(`${n}: ${list.join(', ')}`);
}
console.log(`\n有外部引用的字段 ${total} / ${names.length}`);