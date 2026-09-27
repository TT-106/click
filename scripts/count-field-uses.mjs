// 逆向辅助：统计一组字段名在指定文件内的成员访问次数（`.NAME` 形式），
// 用于重命名前确认命中数是否符合「构造 + reset + update」等预期结构。
// 用法: node scripts/count-field-uses.mjs <file> "name1,name2,..."
import fs from 'node:fs';

const file = process.argv[2];
const names = process.argv[3].split(',').map((s) => s.trim()).filter(Boolean);
const src = fs.readFileSync(file, 'utf8');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let out = [];
for (const n of names) {
  const re = new RegExp('\\.' + esc(n) + '\\b', 'g');
  const m = src.match(re);
  out.push(`${n}: ${m ? m.length : 0}`);
}
console.log(out.join('\n'));