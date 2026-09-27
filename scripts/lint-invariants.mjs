// 项目不变量 lint（无第三方依赖）。
//
// 目的：把本轮重构辛苦建立起来的"不变量"变成可自动回归的守卫——这些不变量一旦被无意破坏，
// 后果往往不是立刻报错，而是悄悄退化（混淆名回流、文档与代码脱节、隐形文件名垃圾重现等）。
// 与 `npm run check`（语法 + tsc + 单测）互补：check 保证"能跑"，lint 保证"没退化"。
//
// 用法: node scripts/lint-invariants.mjs        （npm run lint）
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const problems = [];
const notes = [];

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (err) => resolve({ status: null, stdout, stderr, error: err }));
    child.on('close', (code) => resolve({ status: code, stdout, stderr }));
  });
}

function walk(dir, out = [], skip = new Set(['node_modules', '.git', 'dist', 'output', '.workbuddy-ai'])) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!skip.has(e.name)) walk(path.join(dir, e.name), out, skip); }
    else out.push(path.join(dir, e.name));
  }
  return out;
}

// 1) 混淆属性名必须为 0（M12 的收官结论）
{
  const r = await run(process.execPath, ['scripts/analyze-fields.mjs']);
  const m = (r.stdout || '').match(/混淆属性总数:\s*(\d+)/);
  if (!m) problems.push('analyze-fields 未输出"混淆属性总数"');
  else if (Number(m[1]) !== 0) problems.push(`混淆属性名回流：${m[1]} 个（应为 0；见 artifacts/obfuscated-fields.json）`);
  else notes.push('混淆属性名 0 ✓');
}

// 2) 不得存在"文件名尾随隐形字符"的垃圾文件
{
  const INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\uE000-\uF8FF]/u;
  const junk = walk('.').filter((f) => INVISIBLE.test(path.basename(f)));
  if (junk.length) problems.push(`文件名含隐形字符：${junk.length} 个（用 scripts/find-invisible-name-files.mjs 盘点）`);
  else notes.push('无隐形字符文件名 ✓');
}

// 3) src/engine/modules 下不得有 @ts-nocheck（M10 的类型豁免已清零）
{
  const offenders = walk('src/engine/modules').filter((f) => f.endsWith('.js') && fs.readFileSync(f, 'utf8').includes('@ts-nocheck'));
  if (offenders.length) problems.push(`src/engine/modules 下仍有 @ts-nocheck：${offenders.length} 个`);
  else notes.push('src/engine/modules 无 @ts-nocheck ✓');
}

// 4) 源码里不得出现 TODO/FIXME/HACK/@ts-ignore/eslint-disable
{
  const re = /\b(TODO|FIXME|HACK)\b|@ts-ignore|eslint-disable/;
  const offenders = walk('src').filter((f) => f.endsWith('.js') && re.test(fs.readFileSync(f, 'utf8')));
  if (offenders.length) problems.push(`源码含 TODO/FIXME/HACK/@ts-ignore/eslint-disable：${offenders.join(', ')}`);
  else notes.push('源码无待办标记与规则豁免 ✓');
}

// 5) 文档 file:line 引用不得越界
{
  const r = await run(process.execPath, ['scripts/verify-doc-refs.mjs']);
  const m = (r.stdout || '').match(/行号越界\s*(\d+)\s*条/);
  if (!m) problems.push('verify-doc-refs 未输出"行号越界"计数');
  else if (Number(m[1]) !== 0) problems.push(`文档 file:line 越界 ${m[1]} 条（见 verify-doc-refs 输出）`);
  else notes.push('文档 file:line 引用无越界 ✓');
}

// 6) 存档契约：不得出现单字母存档键（历史结论：4,477 键全语义化）
{
  const r = await run(process.execPath, ['-e', `
    import('node:fs').then(async (fs) => {
      const { decodeFixture } = await import('./tests/scenarios/save-mutations.mjs');
      const save = decodeFixture();
      const bad = [];
      const walk = (o, p) => {
        if (!o || typeof o !== 'object') return;
        for (const [k, v] of Object.entries(o)) {
          if (/^[A-Za-z_$]{1,2}$/.test(k)) bad.push(p + k);
          walk(v, p + k + '.');
        }
      };
      walk(save, '');
      console.log('SINGLE_LETTER_KEYS=' + bad.length + (bad.length ? ' ' + bad.slice(0, 5).join(',') : ''));
    }).catch((e) => { console.log('SAVE_CHECK_ERROR ' + e.message); });
  `]);
  const m = (r.stdout || '').match(/SINGLE_LETTER_KEYS=(\d+)/);
  if (!m) problems.push('存档键检查未能执行（' + (r.stdout || r.stderr || '').trim().slice(0, 120) + '）');
  else if (Number(m[1]) !== 0) problems.push(`原版存档 fixture 出现单字母键 ${m[1]} 个（存档契约要求全语义化）`);
  else notes.push('原版存档 fixture 无单字母键 ✓');
}

// 6) 每个 spellCategoryId 都必须有差分场景驱动（防止新增法术类别时漏场景）
{
  const r = await run(process.execPath, ['scripts/check-spell-coverage.mjs']);
  const m = (r.stdout || '').match(/无场景\s*(\d+)\s*个/);
  if (!m) problems.push('check-spell-coverage 未输出"无场景"计数');
  else if (Number(m[1]) !== 0) problems.push(`有 ${m[1]} 个 spellCategoryId 没有差分场景驱动（见 check-spell-coverage 输出）`);
  else {
    const withObs = (r.stdout || '').match(/无直接可观测量\s*(\d+)\s*个/);
    notes.push(`法术类别全部有场景覆盖 ✓（其中 ${withObs ? withObs[1] : '?'} 类仅有计数归因，已在矩阵里写明）`);
  }
}

console.log('lint 不变量检查：');
for (const n of notes) console.log(`  ✓ ${n}`);
if (problems.length) {
  console.log('\n✗ 不变量被破坏：');
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('\n✓ 全部不变量保持。');
