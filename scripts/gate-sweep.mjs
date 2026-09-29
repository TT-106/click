// 一次性总门禁扫描：把"证明行为等价 + 证明没回退"的全部检查串起来跑，
// 逐条回显退出码并落盘日志（工程纪律：禁止 `| tail` 吞退出码，退出码必须来自命令本身）。
//
//   node scripts/gate-sweep.mjs [--quick]     # --quick 跳过 soak/perf/frames 三条慢门
//
// 输出：控制台一张表 + output/gate-sweep/<时间戳>/ 下的逐条日志与 summary.txt
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const quick = process.argv.includes('--quick');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dir = path.join(ROOT, 'output', 'gate-sweep', stamp);
fs.mkdirSync(dir, { recursive: true });

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const logPath = path.join(dir, `${opts.log || String(cmd).replace(/[^a-z0-9]+/gi, '-')}.log`);
    const out = fs.createWriteStream(logPath);
    const child = spawn(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...opts.env } });
    child.stdout.pipe(out, { end: false });
    child.stderr.pipe(out, { end: false });
    child.on('close', (code) => { out.end(); resolve({ name: opts.log || cmd, code, log: path.relative(ROOT, logPath).split(path.sep).join('/') }); });
  });
}
// 用 node 跑工程内脚本
function run(name, args, opts = {}) {
  return new Promise((resolve) => {
    const logPath = path.join(dir, `${name.replace(/[^a-z0-9]+/gi, '-')}.log`);
    const out = fs.createWriteStream(logPath);
    const child = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(out, { end: false });
    child.stderr.pipe(out, { end: false });
    child.on('close', (code) => {
      out.end();
      resolve({ name, code, log: path.relative(ROOT, logPath).split(path.sep).join('/'), slow: !!opts.slow });
    });
  });
}

const gates = [
  ['lint', ['scripts/lint-invariants.mjs']],
  ['build', ['scripts/build.mjs']],
  ['typecheck', ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json']],
  ['check', ['scripts/check.mjs']],
  ['test-unit', ['--test', 'tests/unit/achievement-progress.test.mjs', 'tests/unit/format.test.mjs', 'tests/unit/inventory-decouple.test.mjs', 'tests/unit/point-awards.test.mjs', 'tests/unit/rng.test.mjs', 'tests/unit/save-codec.test.mjs', 'tests/unit/sprite-lookup.test.mjs']],
  ['audit-arch-ratchet', ['scripts/audit-architecture.mjs', '--json']],
  ['dead-reads-ratchet', ['scripts/find-dead-reads.mjs']],
  ['doc-mappings', ['scripts/check-doc-mappings.mjs']],
  ['doc-snippets', ['scripts/check-doc-snippets.mjs']],
  ['doc-refs', ['scripts/verify-doc-refs.mjs']],
  ['spell-coverage', ['scripts/check-spell-coverage.mjs']],
  ['achievements', ['scripts/check-achievement-requirements.mjs']],
  ['production-boundary', ['scripts/audit-production-boundary.mjs']],
  ['parity', ['scripts/test-parity.mjs']],
  ['scenarios', ['scripts/test-scenarios.mjs']],
  ['e2e', ['scripts/test-browser.mjs']],
  ['e2e-dist', ['scripts/e2e-dist.mjs']],
  ['perf', ['scripts/measure-perf.mjs']],
  ['soak', ['scripts/test-soak.mjs'], true],
  ['perf-frames', ['scripts/measure-frames.mjs'], true],
];

const results = [];
for (const [name, args, slow] of gates) {
  if (quick && slow) { console.log(`  跳过（--quick）：${name}`); continue; }
  process.stdout.write(`运行 ${name} ... `);
  const r = await run(name, args, { slow });
  results.push(r);
  console.log(r.code === 0 ? '✓ 0' : `✗ ${r.code}`);
}

// 工作树卫生 + 数据流/命名指标（这些不是"门"，是随附证据）
const extra = [];
// 注意：必须用真正的 git 可执行文件。早期版本把 git 的参数交给 process.execPath（node），
// node 将 "-c core.automismatch=true" 当成入口脚本路径，报 MODULE_NOT_FOUND 并以 1 退出——
// 一条永远红的假失败门，看起来像"工作树有空白问题"，其实检查器根本没跑 git。
extra.push(await runCmd('git', ['diff', '--check'], { log: 'git-diff-check' }));
extra.push(await runCmd('git', ['diff', '--cached', '--check'], { log: 'git-diff-cached-check' }));
extra.push(await run('naming-metrics', ['scripts/audit-architecture.mjs']));

const lines = [];
lines.push(`总门禁扫描 ${stamp}${quick ? '（--quick）' : ''}`);
for (const r of [...results, ...extra]) {
  lines.push(`  ${r.code === 0 ? '✓' : '✗'} ${r.name.padEnd(24)} exit=${r.code}  ${r.log}`);
}
const failed = [...results, ...extra].filter((r) => r.code !== 0);
lines.push('');
lines.push(failed.length ? `✗ ${failed.length} 条非零退出：${failed.map((f) => f.name).join(', ')}` : '✓ 全部退出码为 0');
const text = lines.join('\n');
console.log('\n' + text);
fs.writeFileSync(path.join(dir, 'summary.txt'), text + '\n');
process.exitCode = failed.length ? 1 : 0;
