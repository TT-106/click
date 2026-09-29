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

// 4) 源码里不得出现 TODO/FIXME/HACK/@ts-ignore/eslint-disable，也不得残留"反向验证探针"
//    探针词尾（tileRowTYPO 这类大写破坏标记）并入同一条检查的动因：R27 的检查点提交
//    7a2c981 把一个仍在运行的智能体的探针一起收了进去，loop.js 多出一行
//    `camera.tileRowTYPO = centerY / game.tileSize | 0;`。那是**写给不存在属性的死写**，
//    存档差分、89 条场景、像素指纹、e2e、typecheck 全部照绿（它确实不改变可观测行为），
//    只有静态名字检查能发现。流程侧的配套纪律：检查点提交只收已交回的智能体文件。
{
  const re = /\b(TODO|FIXME|HACK)\b|@ts-ignore|eslint-disable|\b[A-Za-z_$][\w$]*(TYPO|SABOTAGE|DELETEME|BROKENBY)[A-Za-z_$]*\b/;
  const offenders = walk('src').filter((f) => f.endsWith('.js') && re.test(fs.readFileSync(f, 'utf8')));
  if (offenders.length) problems.push(`源码含 TODO/FIXME/HACK/规则豁免或残留破坏探针：${offenders.join(', ')}`);
  else notes.push('源码无待办标记、规则豁免与残留探针 ✓');
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

// 7) 每个 spellCategoryId 都必须有差分场景驱动（防止新增法术类别时漏场景）
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

// 8) 成就定义表与判定实现必须一致（328 条定义 × 28 种 requirementType）
{
  const r = await run(process.execPath, ['scripts/check-achievement-requirements.mjs']);
  if (r.status !== 0 || !/✓ 定义表与判定实现完全一致/.test(r.stdout || '')) {
    problems.push('成就定义表与判定实现不一致（见 check-achievement-requirements 输出）');
  } else {
    const m = (r.stdout || '').match(/定义条数\s*(\d+)/);
    notes.push(`成就定义表与判定实现一致 ✓（${m ? m[1] : '?'} 条定义 × 28 种 requirementType）`);
  }
}

// 9) 存档 DTO schema 必须与"真实形态"一致（声明 / fixture / 序列化器两分支 / 嵌套 typedef）
{
  const r = await run(process.execPath, ['scripts/audit-save-schema.mjs']);
  if (r.status !== 0 || !/顶层键完全一致/.test(r.stdout || '')) {
    problems.push('存档 DTO schema 与真实形态不一致（见 audit-save-schema 输出）');
  } else {
    const m = (r.stdout || '').match(/② 真实原版 fixture\s+(\d+) 键/);
    notes.push(`存档 DTO schema 与四种形态一致 ✓（顶层 ${m ? m[1] : '?'} 键）`);
  }
}

// 10) 当前态文档里的可数指标（场景数/单测数/不变量条数/语法检查文件数）必须与源码实况一致
{
  const r = await run(process.execPath, ['scripts/check-doc-counts.mjs']);
  if (r.status !== 0 || !/✓ 全部一致/.test(r.stdout || '')) {
    problems.push('文档可数指标与源码实况不一致（见 check-doc-counts 输出）');
  } else {
    const pairs = [...(r.stdout || '').matchAll(/^\s{2}(.+?) = (\d+)$/gm)].map((m) => `${m[1]} ${m[2]}`);
    notes.push(`文档可数指标与实况一致 ✓（${pairs.join('、')}）`);
  }
}

// 11) 未提交改动里不得有"改名之外且未逐条授权"的结构变动
// 存在理由：本会话的检查点提交把某智能体的探针 camera.tileRowTYPO = centerY / game.tileSize | 0
// 收进了历史（7a2c981），parity / 89 个差分场景 / 像素指纹 / e2e / typecheck 全绿——只有结构对账能看见它。
{
  const r = await run(process.execPath, ['scripts/verify-structure-invariant.mjs', 'HEAD']);
  const m = (r.stdout || '').match(/待人工判定 (\d+) 行/);
  if (r.status !== 0 || !m || Number(m[1]) !== 0) {
    problems.push(`未提交改动含 ${m ? m[1] : '?'} 处无法归入授权模式的结构变动（见 verify-structure-invariant 输出；`
      + '确需新增语句就把它加进 artifacts/structure-allowlist.json 并写清理由）');
  } else {
    const s = (r.stdout || '').match(/已授权结构变动 (\d+) 行/);
    notes.push(`工作树无改名之外的未授权结构变动 ✓（已授权 ${s ? s[1] : '0'} 行）`);
  }
}

// 报告：类型债务的当前规模（只报告，不失败——它是"债"，不是"违规"；防止数字只存在于某次对话里）
{
  const files = walk('src').filter((f) => f.endsWith('.js'));
  let anyCasts = 0;
  let unknownLines = 0;
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    // 必须用精确的 cast 语法：宽松匹配 @type {any} 会把注释里对它的"提及"也算进去
    anyCasts += (text.match(/\/\*\* @type \{any\} \*\//g) || []).length;
    // unknown 按**行数**计（与 docs/m10-type-debt.md 的口径一致：grep -rn "\bunknown\b" ... | wc -l）
    unknownLines += text.split('\n').filter((line) => /\bunknown\b/.test(line)).length;
  }
  notes.push(`类型债务（仅报告）：${anyCasts} 处 @type {any}、${unknownLines} 行含 unknown —— 台账 docs/m10-type-debt.md`);
}

console.log('lint 不变量检查：');
for (const n of notes) console.log(`  ✓ ${n}`);
if (problems.length) {
  console.log('\n✗ 不变量被破坏：');
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('\n✓ 全部不变量保持。');
