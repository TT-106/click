// 对**构建产物**跑端到端：dist/ 一直只被静态审计（文件清单、有没有混进原版档案），
// 而 e2e 打的是源码树（serve.mjs 默认 root = 仓库根）。也就是说"发布出去的那份"从没被执行过。
// 本脚本：npm run build → 用 serve --dist 起在独立端口 → 等就绪 → 跑同一套 test-browser → 收掉服务。
//
//   node scripts/e2e-dist.mjs [--no-build]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.DIST_PORT || 4175);
const URL_BASE = `http://127.0.0.1:${PORT}`;
const skipBuild = process.argv.includes('--no-build');

const run = (cmd, args, opts = {}) => new Promise((resolve) => {
  const child = spawn(cmd, args, { cwd: ROOT, stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...opts.env } });
  let out = '';
  if (!opts.inherit) { child.stdout.on('data', (d) => { out += d; process.stdout.write(d); }); child.stderr.on('data', (d) => { out += d; process.stderr.write(d); }); }
  child.on('close', (code) => resolve({ code, out }));
  return child;
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
  console.error('✗ dist/index.html 不存在，先跑 npm run build');
  process.exit(1);
}

if (!skipBuild) {
  process.stdout.write('构建 dist ... ');
  const b = await run(process.execPath, ['scripts/build.mjs']);
  console.log(b.code === 0 ? '✓' : `✗ exit=${b.code}`);
  if (b.code !== 0) process.exit(1);
}

const server = spawn(process.execPath, ['scripts/serve.mjs', '--dist'], {
  cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(PORT) },
});
server.stdout.on('data', () => {});
server.stderr.on('data', (d) => process.stderr.write(`[serve] ${d}`));
let ready = false;
for (let i = 0; i < 60; i++) {
  await sleep(250);
  try {
    const r = await fetch(`${URL_BASE}/index.html`);
    if (r.ok) { ready = true; break; }
  } catch { /* 还没起来 */ }
}
if (!ready) { console.error('✗ dist 服务器未就绪'); server.kill?.(); process.exit(1); }

// 关键：入口必须是 src/app.js，且页面里不能出现原版档案
const html = await (await fetch(`${URL_BASE}/index.html`)).text();
const entryBad = /<script[^>]+src="[^"]*(archive|c2\.js)/i.test(html);
console.log(`dist 页面入口检查：${entryBad ? '✗ 指向了原版档案' : '✓ 只加载 src/app.js'}`);
const appJs = await fetch(`${URL_BASE}/src/app.js`);
console.log(`dist/src/app.js 可取：${appJs.ok ? '✓' : '✗ ' + appJs.status}`);

process.stdout.write('对 dist 跑 e2e ... ');
const e2e = await run(process.execPath, ['scripts/test-browser.mjs'], { env: { TEST_URL: URL_BASE } });
console.log(e2e.code === 0 ? '✓ 0' : `✗ ${e2e.code}`);
server.kill?.();
process.exitCode = entryBad || !appJs.ok || e2e.code !== 0 ? 1 : 0;
