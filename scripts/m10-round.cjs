// M10 批处理：对指定文件移除 @ts-nocheck 并报告各自的 tsc 错误数。
// 用法：node scripts/m10-round.cjs file1 file2 ...
const { execSync } = require('child_process');
const fs = require('fs');
const files = process.argv.slice(2);
for (const p of files) {
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('@ts-nocheck')) {
    s = s.replace(/\/\/ @ts-nocheck[^\r\n]*\r?\n/, '');
    fs.writeFileSync(p, s);
  }
}
let out = '';
try { out = execSync('npx tsc 2>&1', { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }); } catch (e) { out = e.stdout || ''; }
const byFile = {};
for (const line of out.split('\n')) {
  const m = line.match(/^(src\/[^(]+)\((\d+),\d+\): error (TS\d+)/);
  if (m) (byFile[m[1]] = byFile[m[1]] || []).push(m[3] + '@' + m[2]);
}
for (const p of files) {
  const errs = byFile[p.split('\\').join('/')] || [];
  console.log((errs.length ? 'FAIL ' : 'OK ') + p + (errs.length ? ' -> ' + errs.join(', ') : ''));
}
