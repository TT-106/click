// M10 辅助：按 tsc 错误数管理 @ts-nocheck。
// 用法：node scripts/m10-nocheck.mjs <errors-file> <max-errors>
// errors-file 为 `npx tsc 2>&1 | grep -oE "^src/[^(]+" | sort | uniq -c` 风格输出（计数 路径）。
// 错误数 ≤ max-errors 的文件保持无 nocheck（已纳入检查），其余恢复 nocheck。
import fs from 'node:fs';

const [, , errorsFile, maxArg] = process.argv;
const max = Number(maxArg || 0);
const keep = fs.readFileSync(errorsFile, 'utf8')
  .split('\n')
  .map(l => l.trim())
  .filter(Boolean)
  .filter(l => /^\d+\s+src\//.test(l))
  .filter(l => Number(l.split(/\s+/)[0]) <= max)
  .map(l => l.split(/\s+/).slice(1).join(' ').split('\\').join('/'));

const walk = (d, out) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = d + '/' + e.name;
    if (e.isDirectory()) walk(f, out);
    else if (e.name.endsWith('.js')) out.push(f);
  }
};
const all = [];
walk('src/engine', all);

let kept = 0, restored = 0;
for (const p of all) {
  const norm = p.split('\\').join('/');
  const inKeep = keep.some(k => norm.endsWith(k) || norm === k);
  let s = fs.readFileSync(p, 'utf8');
  const hasNocheck = s.includes('@ts-nocheck');
  if (inKeep && hasNocheck) {
    s = s.replace(/\/\/ @ts-nocheck[^\r\n]*\r?\n/, '');
    fs.writeFileSync(p, s);
    kept++;
    console.log('kept (nocheck removed):', p);
  } else if (!inKeep && !hasNocheck) {
    s = '// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）\n' + s;
    fs.writeFileSync(p, s);
    restored++;
    console.log('restored:', p);
  }
}
console.log(`合计：新纳入 ${kept} 个，回退 ${restored} 个`);
