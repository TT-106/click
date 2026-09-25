// 组合检查：语法检查全部源码 → 单元测试。parity/E2E 需要浏览器，由 test:parity / test:e2e 单独运行。
import { execFileSync, spawnSync } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

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
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failures++;
    console.error(`✗ 语法错误: ${file}\n${result.stderr}`);
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
