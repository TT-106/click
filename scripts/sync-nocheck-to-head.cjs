// U1/M10 修复辅助：将工作树的 @ts-nocheck 状态与 HEAD 对齐。
const { execSync } = require('child_process');
const fs = require('fs');
const files = execSync('git ls-files src/engine', { encoding: 'utf8' })
  .split('\n').filter(Boolean);
let fixed = 0;
for (const p of files) {
  let head = '';
  try {
    head = execSync('git show HEAD:' + JSON.stringify(p), { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch { continue; }
  const headNo = head.includes('@ts-nocheck');
  let cur = fs.readFileSync(p, 'utf8');
  const curNo = cur.includes('@ts-nocheck');
  if (headNo === curNo) continue;
  if (headNo && !curNo) {
    cur = '// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）\n' + cur;
  } else {
    cur = cur.replace(/\/\/ @ts-nocheck[^\r\n]*\r?\n/, '');
  }
  fs.writeFileSync(p, cur);
  fixed++;
  console.log('synced:', p, '→', headNo ? 'nocheck' : 'clean');
}
console.log('合计', fixed);
