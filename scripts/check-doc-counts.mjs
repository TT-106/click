// 文档里的"可数指标"必须与脚本/代码实况一致（可复跑的机械核对）。
//
// 背景：场景数、单测数、不变量条数、语法检查文件数在历史上被反复写错（45/48/50/52/59/60 并存，
// 每次都要人工通篇搜一遍）。本脚本把它变成一条门禁：**当前态文档**里凡声称这些计数的地方，
// 数字必须等于从源码实测出来的值。
//
// 范围（刻意收窄，避免把历史日志误判为漂移）：
//   纳入 = 四份报告 + docs/formulas/*.md + docs/REMAINING-WORK.md + docs/architecture.md
//          + docs/architecture-debt.md + docs/runtime-entrypoints.md
//   排除 = docs/WORKSTATE.md（按批次记录的流水账）、docs/reverse-engineering/**（研究日志，
//          R5 红线禁止回退/覆盖）、docs/baseline.md 与 docs/persistence.md 的"快照"段
//          ——它们的数字是**当时**的实测记录，不是当前承诺。
//
// 用法: node scripts/check-doc-counts.mjs
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------- 实测口径
function listJs(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listJs(full, out);
    else if (/\.(js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}
const syntaxFileCount = ['src', 'scripts', 'tests'].flatMap((d) => listJs(d)).length;
const unitTestFiles = fs.readdirSync('tests/unit').filter((f) => f.endsWith('.test.mjs'));
const unitTestCount = unitTestFiles.reduce((n, f) => n + (fs.readFileSync(`tests/unit/${f}`, 'utf8').match(/^test\(/gm) || []).length, 0);
const scenarioCount = (fs.readFileSync('scripts/test-scenarios.mjs', 'utf8').match(/^    name: '/gm) || []).length;
const lintInvariantCount = (fs.readFileSync('scripts/lint-invariants.mjs', 'utf8').match(/^\/\/ \d+\)/gm) || []).length;

const METRICS = [
  {
    name: '差分场景数',
    real: scenarioCount,
    patterns: [
      /(\d+)\s*个场景/g,
      /(\d+)\s*场景差分矩阵/g,
      /差分场景\s*\*\*(\d+)\s*\/\s*(\d+)\*\*/g,
      /\*\*(\d+)\s*场景\*\*/g,
      /（(\d+)\s*场景表/g,
      /(\d+)\s*场景矩阵/g,
      /(\d+)\s*场景（/g,
      /(\d+)\s*场景差分/g,
      /现有\s*(\d+)\s*场景/g,
    ],
  },
  {
    name: '语法检查文件数',
    real: syntaxFileCount,
    patterns: [/(\d+)\s*文件语法/g],
  },
  {
    name: '单测条数',
    real: unitTestCount,
    patterns: [/L1 单元（(\d+)\s*项）/g, /（(\d+)\s*单测）/g, /(\d+)\s*单测/g],
  },
  {
    name: 'lint 不变量条数',
    real: lintInvariantCount,
    patterns: [/(\d+)\s*条不变量/g],
  },
];

const GATED_FILES = [
  'REFACTOR_REPORT.md',
  'COMPATIBILITY_REPORT.md',
  'PERFORMANCE_REPORT.md',
  'MIGRATION_MAP.md',
  'docs/REMAINING-WORK.md',
  'docs/architecture.md',
  'docs/architecture-debt.md',
  'docs/runtime-entrypoints.md',
  ...fs.readdirSync('docs/formulas').filter((f) => f.endsWith('.md')).map((f) => `docs/formulas/${f}`),
];

const problems = [];
let checked = 0;
for (const file of GATED_FILES) {
  if (!fs.existsSync(file)) continue;
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const metric of METRICS) {
      for (const re of metric.patterns) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(line))) {
          const nums = m.slice(1).filter(Boolean).map(Number);
          checked++;
          if (!nums.includes(metric.real)) {
            problems.push(`${file}:${i + 1} ${metric.name} 写的是 "${m[0].trim()}"，实况为 ${metric.real}`);
          }
        }
      }
    }
  });
}

console.log('可数指标一致性（实测口径）：');
for (const metric of METRICS) console.log(`  ${metric.name} = ${metric.real}`);
console.log(`核对当前态文档 ${GATED_FILES.length} 份、${checked} 处数字表述`);
if (problems.length) {
  console.log(`\n✗ ${problems.length} 处与实况不符：`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('✓ 全部一致。');
