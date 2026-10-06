import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { _electron as electron } from 'playwright';

const root = path.resolve(import.meta.dirname, '..'), output = path.join(root, 'output/playwright/expedition');
const profile = path.join(output, `desktop-profile-${Date.now()}`, 'data');
await mkdir(path.dirname(profile), { recursive: true });
const packaged = process.env.DESKTOP_EXECUTABLE, environment = { ...process.env }; delete environment.ELECTRON_RUN_AS_NODE;
const errors = [], evidence = { packaged: Boolean(packaged), profile }; let application;
const worldSave = async () => JSON.parse(JSON.parse(await readFile(path.join(profile, 'adventure.json'), 'utf8')).storage.C2_OPEN_WORLD_V1);
async function launch() {
  application = await electron.launch({ ...(packaged ? { executablePath: path.resolve(packaged) } : {}), args: [...(packaged ? [] : [root]), `--desktop-profile=${profile}`], env: environment, timeout: 60000 });
  const page = await application.firstWindow();
  page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.locator('#desktop-mode').waitFor({ state: 'visible', timeout: 30000 }); return page;
}
async function exit(page) {
  const closed = application.waitForEvent('close', { timeout: 12000 });
  try { await page.evaluate(() => window.companionDesktop.quit()); } catch (error) { if (!page.isClosed()) throw error; }
  await closed;
  application = null;
}
try {
  let page = await launch(); await page.locator('#recommended-party').click(); await page.locator('#begin-adventure').click();
  await page.waitForFunction(() => document.body.classList.contains('desktop-compact'));
  await page.locator('#desktop-mode').click(); await page.locator('#village-speed').click(); await page.locator('#village-speed').click(); await page.locator('#desktop-mode').click();
  await page.waitForFunction(() => Number(document.querySelector('#desktop-discovery').textContent.match(/携带 (\d+)/)?.[1]) >= 30, null, { timeout: 45000 });
  await page.locator('#desktop-pause').click(); await page.locator('#desktop-inventory').click();
  await page.locator('[data-owner="1"]').click(); await page.locator('[data-item]').last().click();
  assert.ok(await page.locator('.inventory-item-image').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
  const prefix = packaged ? 'packaged-' : 'desktop-';
  await page.screenshot({ path: path.join(output, `${prefix}backpack-compact.png`) });
  evidence.compact = await page.locator('#expedition-inventory').evaluate(dialog => ({ width: innerWidth, height: innerHeight, bounds: dialog.getBoundingClientRect().toJSON(), columns: getComputedStyle(dialog.querySelector('.inventory-body')).gridTemplateColumns }));
  assert.ok(evidence.compact.bounds.bottom <= evidence.compact.height && evidence.compact.bounds.top >= 44);
  assert.ok(await page.locator('#inventory-return').isVisible());
  await page.keyboard.press('Escape'); await page.locator('#desktop-mode').click(); await page.locator('#village-inventory').click();
  await page.screenshot({ path: path.join(output, `${prefix}backpack.png`) });
  const carried = await worldSave(); await page.locator('#inventory-return').click(); await page.keyboard.press('Escape');
  await page.locator('#desktop-mode').click(); await page.locator('#desktop-pause').click();
  await page.waitForFunction(() => document.querySelector('#desktop-status').textContent === '营地休整中', null, { timeout: 30000 });
  await page.locator('#desktop-pause').click(); await page.locator('#desktop-save').click();
  await page.waitForFunction(() => document.querySelector('#toast-message').textContent === '旅途已保存。');
  const banked = await worldSave(), total = stacks => Object.values(stacks).reduce((sum, count) => sum + count, 0);
  assert.equal(total(banked.expedition.warehouse), carried.expedition.bags.reduce((sum, bag) => sum + total(bag), 0));
  assert.equal(banked.expedition.completed, 1); assert.ok(banked.expedition.bags.every(bag => total(bag) === 0));
  await exit(page); page = await launch();
  await page.waitForFunction(() => document.querySelector('#desktop-pause').textContent === '继续');
  assert.deepEqual(await worldSave(), banked);
  await page.locator('#desktop-inventory').click(); await page.locator('[data-owner="warehouse"]').click();
  assert.match(await page.locator('#inventory-bag-title').textContent(), /收获/);
  await page.screenshot({ path: path.join(output, `${prefix}warehouse.png`) });
  evidence.warehouse = banked.expedition.warehouse; evidence.collected = banked.expedition.collected;
  await page.keyboard.press('Escape'); await exit(page);
  const saveFile = path.join(profile, 'adventure.json'), desktopRecord = JSON.parse(await readFile(saveFile, 'utf8'));
  const damaged = JSON.stringify({ ...banked, expedition: { ...banked.expedition, version: 99 } });
  const classic = desktopRecord.storage.C2_V1_001;
  desktopRecord.storage.C2_OPEN_WORLD_V1 = damaged;
  desktopRecord.storage.C2_OPEN_WORLD_V1_backup = JSON.stringify(banked);
  await writeFile(saveFile, JSON.stringify(desktopRecord));
  page = await launch();
  await page.locator('#desktop-recovery').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#desktop-status').textContent(), '记录未恢复');
  await page.locator('#desktop-recovery').click();
  await page.waitForFunction(() => !document.body.classList.contains('desktop-compact'));
  page.once('dialog', dialog => dialog.dismiss()); await page.locator('#village-restore').click();
  assert.equal(JSON.parse(await readFile(saveFile, 'utf8')).storage.C2_OPEN_WORLD_V1, damaged);
  page.once('dialog', dialog => dialog.accept()); await page.locator('#village-restore').click();
  await page.waitForFunction(() => document.querySelector('#village-notice').textContent.includes('已从备份恢复'));
  const recovered = JSON.parse(await readFile(saveFile, 'utf8')).storage;
  assert.deepEqual(JSON.parse(recovered.C2_OPEN_WORLD_V1), banked);
  assert.equal(recovered.C2_OPEN_WORLD_V1_backup, JSON.stringify(banked));
  assert.equal(recovered.C2_OPEN_WORLD_V1_before_recovery, damaged);
  assert.equal(recovered.C2_V1_001, classic, '原野恢复不能改动经典队伍记录');
  await page.screenshot({ path: path.join(output, `${prefix}recovered.png`) });
  await exit(page); page = await launch();
  // 恢复入口展开为管理模式，该窗口偏好会保存；重启后显式进入原野。
  await page.locator('#enter-village').click();
  await page.waitForFunction(() => document.querySelector('#desktop-pause').textContent === '继续');
  assert.deepEqual(await worldSave(), banked, '桌面恢复必须在退出后从磁盘精确恢复');
  evidence.recovery = { diskConfirmed: true, cancelProtected: true, rawArchived: true, restartExact: true };
  await exit(page);
  assert.deepEqual(errors, []); evidence.errors = errors; evidence.passed = true;
  await writeFile(path.join(output, `${prefix}results.json`), JSON.stringify(evidence, null, 2));
  console.log('✓ 真实 Windows 小窗/管理背包、返程归仓、坏档恢复/取消/留档、磁盘退出与重启精确恢复通过');
} catch (error) {
  const page = application?.windows()[0];
  if (page && !page.isClosed()) {
    await page.screenshot({ path: path.join(output, 'desktop-recovery-failure.png') });
    evidence.failure = await page.evaluate(() => ({ notice: document.querySelector('#village-notice')?.textContent, state: document.querySelector('#village-state')?.textContent, toast: document.querySelector('#toast-message')?.textContent }));
  }
  evidence.errors = errors;
  await writeFile(path.join(output, 'desktop-recovery-failure.json'), JSON.stringify(evidence, null, 2));
  throw error;
} finally { if (application) await application.close(); }
