import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'output/playwright/expedition'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const evidence = {}, errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 980 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173');
  await page.locator('#app-content').waitFor({ state: 'visible' });
  await page.locator('#recommended-party').click(); await page.locator('#begin-adventure').click();
  await page.evaluate(async () => (await import('./src/engine/adapter.js')).engine.pause(true));
  const classic = await page.evaluate(async () => {
    const { engine } = await import('./src/engine/adapter.js'), { runtime } = await import('./src/engine/internal-api.js');
    const state = JSON.parse(runtime.decode(engine.serialize())); delete state.gameTimestamp; return state;
  });
  await page.locator('#enter-village').click();
  await page.waitForFunction(() => document.querySelector('#village-state').textContent === '自动探索中');
  await page.locator('#village-speed').click(); await page.locator('#village-speed').click();
  await page.waitForFunction(() => {
    const save = JSON.parse(localStorage.getItem('C2_OPEN_WORLD_V1') || 'null');
    return save?.expedition?.bags.reduce((sum, bag) => sum + Object.values(bag).reduce((total, count) => total + count, 0), 0) >= 35;
  }, null, { timeout: 45000 });
  await page.locator('#village-pause').click();
  const worldSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('C2_OPEN_WORLD_V1')));
  const carried = await worldSave(); evidence.collected = carried.expedition.collected;
  assert.ok(carried.expedition.bags.every(bag => Object.keys(bag).length));
  await page.locator('#village-inventory').click();
  await page.locator('#expedition-inventory').waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-owner][aria-pressed=true]').count(), 1);
  assert.ok(await page.locator('.inventory-slot[data-item]').count() > 0);
  assert.ok(await page.locator('.inventory-item-image').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
  await page.locator('[data-owner="1"]').click();
  assert.match(await page.locator('#inventory-bag-title').textContent(), /背包/);
  await page.locator('[data-item]').last().click();
  const selected = await page.locator('[data-item][aria-pressed=true]').getAttribute('data-item');
  assert.ok(selected); assert.ok((await page.locator('.inventory-detail h3').textContent()).length);
  await page.screenshot({ path: `${output}/backpack.png` });
  // 键盘关闭、焦点恢复，B 打开；打开背包不切换游戏页或改变暂停态。
  await page.keyboard.press('Escape'); assert.ok(await page.locator('#village-inventory').evaluate(button => button === document.activeElement));
  await page.keyboard.press('b'); assert.ok(await page.locator('#expedition-inventory').isVisible());
  await page.locator('[data-filter="矿物"]').click();
  assert.equal(await page.locator('[data-filter="矿物"]').getAttribute('aria-pressed'), 'true');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.screenshot({ path: `${output}/backpack-mobile.png` });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.ok(await page.locator('#expedition-inventory').evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth + 1));
  await page.setViewportSize({ width: 1280, height: 980 });
  await page.locator('#inventory-return').click();
  await page.keyboard.press('Escape'); await page.locator('#village-pause').click();
  await page.waitForFunction(() => {
    const save = JSON.parse(localStorage.getItem('C2_OPEN_WORLD_V1')); return save?.expedition?.phase === 'resting';
  }, null, { timeout: 30000 });
  await page.locator('#village-pause').click();
  const banked = await worldSave(); evidence.warehouse = banked.expedition.warehouse;
  assert.ok(banked.expedition.bags.every(bag => Object.keys(bag).length === 0));
  const sum = stacks => Object.values(stacks).reduce((total, count) => total + count, 0);
  assert.equal(sum(banked.expedition.warehouse), carried.expedition.bags.reduce((total, bag) => total + sum(bag), 0));
  assert.equal(banked.expedition.completed, 1);
  await page.locator('#village-inventory').click(); await page.locator('[data-owner="warehouse"]').click();
  await page.screenshot({ path: `${output}/warehouse.png` });
  await page.locator('.inventory-credits summary').click();
  assert.match(await page.locator('.inventory-credits').textContent(), /BizmasterStudios.*CC BY 4\.0/);
  await page.keyboard.press('Escape');
  const after = await page.evaluate(async () => {
    const { engine } = await import('./src/engine/adapter.js'), { runtime } = await import('./src/engine/internal-api.js');
    const state = JSON.parse(runtime.decode(engine.serialize())); delete state.gameTimestamp; return state;
  });
  assert.deepEqual(after, classic, '观赏期间新资源不能改变经典保存、装备或随机流');
  await page.reload(); await page.locator('#app-content').waitFor({ state: 'visible' });
  await page.evaluate(async () => (await import('./src/engine/adapter.js')).engine.pause(true));
  await page.locator('#enter-village').click();
  await page.waitForFunction(() => document.querySelector('#village-state').textContent === '已暂停');
  assert.deepEqual(await worldSave(), banked, '刷新保留营地库存、角色归属、采集记录、返程结算和时钟');
  // 损坏新字段时原野入口保留原 JSON；不能被自动保存替换为空库存。
  const damaged = { ...banked, expedition: { ...banked.expedition, version: 99 } };
  await page.locator('#village-exit').click();
  await page.evaluate(({ damaged, banked }) => {
    localStorage.setItem('C2_OPEN_WORLD_V1', JSON.stringify(damaged));
    localStorage.setItem('C2_OPEN_WORLD_V1_backup', JSON.stringify(banked));
  }, { damaged, banked });
  await page.reload(); await page.locator('#app-content').waitFor({ state: 'visible' });
  await page.locator('#enter-village').click(); await page.locator('#village-notice').waitFor({ state: 'visible' });
  assert.match(await page.locator('#village-notice').textContent(), /原文件已保留/);
  await page.waitForTimeout(1800); assert.deepEqual(await worldSave(), damaged);
  assert.equal(await page.locator('#village-state').textContent(), '临时探索 · 未保存');
  assert.ok(await page.locator('#village-restore').isEnabled());
  page.once('dialog', dialog => dialog.dismiss()); await page.locator('#village-restore').click();
  assert.deepEqual(await worldSave(), damaged, '取消恢复不能写回主记录');
  await page.setViewportSize({ width: 375, height: 812 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${output}/recovery-mobile.png` });
  await page.setViewportSize({ width: 1280, height: 980 });
  page.once('dialog', dialog => dialog.accept()); await page.locator('#village-restore').click();
  await page.waitForFunction(() => document.querySelector('#village-notice').textContent.includes('已从备份恢复'));
  assert.deepEqual(await worldSave(), banked);
  const recovered = await page.evaluate(() => ({ backup: JSON.parse(localStorage.getItem('C2_OPEN_WORLD_V1_backup')), before: JSON.parse(localStorage.getItem('C2_OPEN_WORLD_V1_before_recovery')) }));
  assert.deepEqual(recovered.backup, banked); assert.deepEqual(recovered.before, damaged);
  await page.screenshot({ path: `${output}/recovered.png` });
  await page.reload(); await page.locator('#app-content').waitFor({ state: 'visible' });
  await page.locator('#enter-village').click();
  await page.waitForFunction(() => document.querySelector('#village-state').textContent === '已暂停');
  assert.deepEqual(await worldSave(), banked, '恢复后刷新不能重复入库或丢材料');
  // 备份同样坏时不解除保存保护；重开也不能把坏主键顶进备份。
  await page.locator('#village-exit').click();
  await page.evaluate(save => {
    localStorage.setItem('C2_OPEN_WORLD_V1', JSON.stringify(save));
    localStorage.setItem('C2_OPEN_WORLD_V1_backup', '{broken-backup');
  }, damaged);
  await page.reload(); await page.locator('#app-content').waitFor({ state: 'visible' }); await page.locator('#enter-village').click();
  page.once('dialog', dialog => dialog.accept()); await page.locator('#village-restore').click();
  await page.waitForFunction(() => document.querySelector('#village-notice').textContent.includes('备份记录同样无法载入'));
  assert.deepEqual(await worldSave(), damaged);
  page.once('dialog', dialog => dialog.dismiss()); await page.locator('#village-restart').click();
  assert.deepEqual(await worldSave(), damaged);
  page.once('dialog', dialog => dialog.accept()); await page.locator('#village-restart').click();
  await page.waitForFunction(() => document.querySelector('#toast-message').textContent.startsWith('已开启新世界'));
  assert.notDeepEqual(await worldSave(), damaged);
  assert.equal(await page.evaluate(() => localStorage.getItem('C2_OPEN_WORLD_V1_backup')), '{broken-backup');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('C2_OPEN_WORLD_V1_before_recovery'))), damaged);
  evidence.recovery = { cancelProtected: true, restored: true, rawArchived: true, reloadExact: true, invalidBackupProtected: true };
  assert.deepEqual(errors, []); evidence.errors = errors; evidence.passed = true;
  await writeFile(`${output}/results.json`, JSON.stringify(evidence, null, 2));
  console.log('✓ 自动采集、背包、归仓、刷新、真实恢复/取消/坏备份/坏档重开、经典隔离与 375px 界面通过');
} catch (error) {
  const page = browser.contexts()[0]?.pages()[0]; if (page) await page.screenshot({ path: `${output}/failure.png` });
  throw error;
} finally { await browser.close(); }
