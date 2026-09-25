// U1/M10 修复：以 50f02ee（批量事故前全绿态）的 @ts-nocheck 分布为基准重建工作树。
// 例外：newly-clean 清单中的文件保持无 nocheck（其类型修复已提交）。
const { execSync } = require('child_process');
const fs = require('fs');
const BASE = '50f02ee';
const NEWLY_CLEAN = new Set([
  'src/engine/modules/characters/minions.js',
  'src/engine/modules/persistence/entities.js',
  'src/engine/modules/rendering/sprites.js',
  'src/engine/modules/views/navigation.js',
  'src/engine/modules/views/base.js',
  'src/engine/modules/views/party-creation.js',
  'src/engine/modules/world/initialization.js',
]);
const files = execSync('git ls-files src/engine', { encoding: 'utf8' }).split('\n').filter(Boolean);
let fixed = 0, kept = 0;
for (const p of files) {
  if (NEWLY_CLEAN.has(p)) { kept++; continue; }
  let base = '';
  try { base = execSync(`git show ${BASE}:${JSON.stringify(p)}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }); } catch { continue; }
  const baseNo = base.includes('@ts-nocheck');
  let cur = fs.readFileSync(p, 'utf8');
  const curNo = cur.includes('@ts-nocheck');
  if (baseNo === curNo) continue;
  if (baseNo && !curNo) cur = '// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）\n' + cur;
  else cur = cur.replace(/\/\/ @ts-nocheck[^\r\n]*\r?\n/, '');
  fs.writeFileSync(p, cur);
  fixed++;
}
console.log(`修复 ${fixed} 个文件；新纳入保持 ${kept} 个`);
