import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { _electron as electron } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'output/playwright/desktop'); await mkdir(output, { recursive: true });
const profile = path.join(await mkdtemp(path.join(output, 'profile-')), 'data');
const packaged = process.argv.find(argument => argument.startsWith('--packaged='))?.slice('--packaged='.length);
const environment = { ...process.env }; delete environment.ELECTRON_RUN_AS_NODE;
const errors = [], evidence = { packaged: Boolean(packaged), profile };
let application;
async function launch(ready = true) {
  application = await electron.launch({ ...(packaged ? { executablePath: path.resolve(packaged) } : {}), args: [...(packaged ? [] : [root]), `--desktop-profile=${profile}`], env: environment, timeout: 60000 });
  const page = await application.firstWindow();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  if (ready) {
    await page.locator('#app-content').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#desktop-mode').waitFor({ state: 'visible' });
  }
  return page;
}
const nativeState = () => application.evaluate(({ BrowserWindow }) => {
  const window = BrowserWindow.getAllWindows()[0];
  return { bounds: window.getBounds(), content: window.getContentBounds(), pinned: window.isAlwaysOnTop(), visible: window.isVisible(), minimized: window.isMinimized(), sandbox: window.webContents.getLastWebPreferences().sandbox, node: window.webContents.getLastWebPreferences().nodeIntegration };
});
const checkpoint = () => readFile(path.join(profile, 'adventure.json'), 'utf8').then(JSON.parse);
const worldSave = async () => JSON.parse((await checkpoint()).storage.C2_OPEN_WORLD_V1);
async function exit(page) {
  const closed = application.waitForEvent('close', { timeout: 12000 });
  try { await page.evaluate(() => window.companionDesktop.quit()); }
  catch (error) { if (!page.isClosed()) throw error; }
  await closed;
}
try {
  let page = await launch();
  assert.ok(await page.locator('#setup-screen').isVisible());
  await page.locator('#recommended-party').click(); await page.locator('#begin-adventure').click();
  await page.waitForFunction(() => document.body.classList.contains('desktop-compact') && document.querySelector('#village-state').textContent === '自动探索中');
  evidence.initial = await nativeState(); assert.equal(evidence.initial.sandbox, true); assert.equal(evidence.initial.node, false);
  const frozenClassicTurn = await page.evaluate(async () => (await import('./src/engine/adapter.js')).engine.snapshot().turn);
  assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
  await page.locator('#desktop-pin').click(); assert.equal((await nativeState()).pinned, true);
  await page.locator('#desktop-mode').click(); assert.ok((await nativeState()).bounds.width >= 800);
  await page.screenshot({ path: path.join(output, packaged ? 'packaged-management.png' : 'management.png') });
  await page.locator('#open-saves').click();
  assert.match(await page.locator('#save-dialog > p').textContent(), /这台电脑/);
  await page.locator('#save-now').click();
  await page.waitForFunction(() => document.querySelector('#toast-message').textContent === '旅途已保存。');
  await page.locator('#close-saves').click();
  await page.locator('#desktop-mode').click();
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(640, 400));
  await page.waitForTimeout(600);
  await page.locator('#desktop-pause').click();
  evidence.foregroundMetrics = await application.evaluate(({ app }) => app.getAppMetrics().map(({ type, cpu, memory }) => ({ type, cpu, memory })));
  await page.waitForFunction(() => document.querySelector('#desktop-pause').textContent === '继续');
  await page.keyboard.press('Control+s');
  await page.waitForFunction(() => document.querySelector('#toast-message').textContent === '旅途已保存。');
  const paused = await worldSave(); assert.equal(paused.paused, true);
  await page.waitForTimeout(1100); assert.deepEqual(await worldSave(), paused, '暂停时世界时钟和坐标保持');
  await page.screenshot({ path: path.join(output, packaged ? 'packaged-companion.png' : 'companion.png') });

  await page.evaluate(async () => {
    const { ExplorationRenderer } = await import('./src/engine/exploration/renderer.js');
    const draw = ExplorationRenderer.prototype.draw; window.desktopDrawCount = 0;
    ExplorationRenderer.prototype.draw = function (...args) { window.desktopDrawCount++; return draw.apply(this, args); };
  });
  await page.locator('#desktop-pause').click();
  await page.locator('#desktop-hide').click(); await page.waitForTimeout(300);
  assert.equal((await nativeState()).visible, false);
  const draws = await page.evaluate(() => window.desktopDrawCount);
  await page.waitForTimeout(2400);
  assert.equal(await page.evaluate(() => window.desktopDrawCount), draws, '收进托盘后停止地图绘制');
  const hidden = await worldSave(); assert.ok(hidden.timeMs > paused.timeMs, '托盘期间仍由独立时钟推进探索');
  assert.equal(await page.evaluate(async () => (await import('./src/engine/adapter.js')).engine.snapshot().turn), frozenClassicTurn, '观赏时不推进经典战斗');
  evidence.hidden = { simulationAdvancedMs: hidden.timeMs - paused.timeMs, drawsWhileHidden: 0 };
  evidence.hiddenMetrics = await application.evaluate(({ app }) => app.getAppMetrics().map(({ type, cpu, memory }) => ({ type, cpu, memory })));
  await application.evaluate(({ BrowserWindow }) => { const window = BrowserWindow.getAllWindows()[0]; window.show(); window.webContents.send('desktop:command', { action: 'pause' }); });
  await page.waitForFunction(() => document.querySelector('#desktop-pause').textContent === '继续');
  await page.locator('#desktop-save').click(); await page.waitForTimeout(150);
  const beforeRestart = await worldSave(); evidence.beforeRestart = beforeRestart.members;
  assert.ok((await checkpoint()).storage.C2_V1_001);
  await exit(page);

  page = await launch();
  await page.waitForFunction(() => document.querySelector('#desktop-pause').textContent === '继续');
  assert.deepEqual(await worldSave(), beforeRestart, '退出和重启从磁盘恢复暂停态、半步路线与全局位置');
  assert.equal(await page.evaluate(async () => (await import('./src/engine/adapter.js')).engine.snapshot().turn), frozenClassicTurn, '桌面重启不暗中结算经典战斗');
  evidence.restored = await nativeState(); assert.equal(evidence.restored.pinned, true);
  assert.equal(evidence.restored.content.width, 640); assert.equal(evidence.restored.content.height, 400);
  // 实际系统窗口的关闭事件只收进托盘，实例保留。
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
  await page.waitForTimeout(150); assert.equal((await nativeState()).visible, false);
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].show());
  await exit(page);
  assert.deepEqual(errors, [], '桌面窗口没有脚本或资源错误');
  evidence.errors = [...errors];
  // 故障注入仅使用本次自动创建的测试目录，验证原文件不会被空白记录覆盖。
  const corrupt = '{bad-json'; await writeFile(path.join(profile, 'adventure.json'), corrupt);
  page = await launch(false); await page.locator('#retry-load').waitFor({ state: 'visible' });
  assert.match(await page.locator('#loading-message').textContent(), /原文件已保留/);
  assert.equal(await readFile(path.join(profile, 'adventure.json'), 'utf8'), corrupt);
  evidence.corruptFilePreserved = true; await exit(page);
  evidence.passed = true;
  await writeFile(path.join(output, packaged ? 'packaged-results.json' : 'results.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  const page = application?.windows()[0];
  if (page && !page.isClosed()) {
    await page.screenshot({ path: path.join(output, 'failure.png') });
    console.error(JSON.stringify({ errors, body: await page.locator('body').innerText(), desktop: await nativeState() }, null, 2));
  }
  throw error;
} finally {
  if (application) { try { await application.close(); } catch { /* 已退出。 */ } }
}
