// 剩余混淆字段的"按模块积压"视图：读取 artifacts/obfuscated-fields.json，
// 按模块路径聚合待办字母数，用于挑选下一批（同模块成组改名风险最低）。
// 用法: node scripts/show-field-backlog.mjs [topN]
import fs from 'node:fs';

const list = JSON.parse(fs.readFileSync('artifacts/obfuscated-fields.json', 'utf8'));
const arr = Array.isArray(list) ? list : list.fields;
const top = Number(process.argv[2] || 25);

const byModule = new Map();
for (const it of arr) {
  for (const f of it.files) {
    const mod = f.split('modules').pop().split(/[\\/]/).filter(Boolean).join('/');
    if (!byModule.has(mod)) byModule.set(mod, []);
    byModule.get(mod).push(it.name);
  }
}
const rows = [...byModule].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
console.log(`剩余混淆字段 ${arr.length} 个（按模块积压，显示前 ${Math.min(top, rows.length)}）`);
for (const [mod, names] of rows.slice(0, top)) {
  console.log(`${String(names.length).padStart(3)}  ${mod}  ${names.join(' ')}`);
}
console.log(`\n合计模块数 ${byModule.size}`);
