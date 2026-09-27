// 组合检查：语法检查全部源码 → 单元测试。parity/E2E 需要浏览器，由 test:parity / test:e2e 单独运行。
import { execFileSync, spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

// 注意：本环境（Windows）下 spawnSync/execFileSync 使用**管道** stdio 会稳定抛 EBUSY，
// 而异步 spawn 的管道 stdio 正常。语法检查需要逐文件捕获 stderr，故改用异步 spawn。
function runCaptured(cmd, args) {
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

async function listJs(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listJs(full));
    else if (/\.(js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const targets = [];
for (const dir of ['src', 'scripts', 'tests']) {
  try { targets.push(...await listJs(dir)); } catch { /* 目录可缺省 */ }
}

let failures = 0;
for (const file of targets) {
  const result = await runCaptured(process.execPath, ['--check', file]);
  if (result.status !== 0) {
    failures++;
    const detail = result.stderr || (result.error && String(result.error)) || '';
    console.error(`✗ 语法错误: ${file}\n${detail}`);
  }
}
console.log(`✓ 语法检查 ${targets.length} 个文件`);

// M10 类型检查（JSDoc 渐进策略；范围见 tsconfig.json，@ts-nocheck 文件随类型化逐个摘除）
try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { stdio: 'inherit' });
  console.log('✓ typecheck 通过');
} catch {
  failures++;
  console.error('✗ typecheck 失败');
}

try {
  const unitTests = (await listJs('tests/unit')).filter(file => file.endsWith('.test.mjs'));
  if (!unitTests.length) throw new Error('tests/unit 下没有测试文件');
  execFileSync(process.execPath, ['--test', ...unitTests], { stdio: 'inherit' });
} catch {
  failures++;
}

process.exit(failures ? 1 : 0);
