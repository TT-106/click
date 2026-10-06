// 真实入口、跨区块续跑和产品绘制通道；夹具只用于明确姿态与自然地貌的视觉检查。
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import definitions from '../src/data/assets.generated.js';

const output = 'output/playwright/open-world';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true }), errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173');
  await page.locator('#app-content').waitFor({ state: 'visible' });
  await page.locator('#recommended-party').click(); await page.locator('#begin-adventure').click();
  await page.locator('#expedition-screen').waitFor({ state: 'visible' });
  await page.evaluate(async () => {
    (await import('/src/engine/adapter.js')).engine.pause(true);
    const { ExplorationSession, EXPLORATION_SAVE_KEY } = await import('/src/engine/exploration/session.js');
    localStorage.setItem(EXPLORATION_SAVE_KEY, JSON.stringify(new ExplorationSession('旧村-01').serialize()));
  });
  const readClassicSave = () => page.evaluate(async () => {
    const { engine } = await import('/src/engine/adapter.js'), { runtime } = await import('/src/engine/internal-api.js');
    const dto = JSON.parse(runtime.decode(engine.serialize())); delete dto.gameTimestamp; return dto;
  });
  const before = await readClassicSave(), legacyBefore = await page.evaluate(() => localStorage.getItem('C2_FOREST_VILLAGE_V1'));
  await page.locator('#enter-village').click();
  await page.waitForFunction(() => document.querySelector('#village-state').textContent === '自动探索中');
  await page.locator('#village-speed').click(); await page.locator('#village-speed').click();
  await page.waitForFunction(() => {
    const save = JSON.parse(localStorage.getItem('C2_OPEN_WORLD_V1') || 'null'); return save?.generated.length >= 18;
  }, null, { timeout: 45000 });
  await page.locator('#village-pause').click();
  const readWorldSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('C2_OPEN_WORLD_V1')));
  const paused = await readWorldSave(); assert.equal(paused.paused, true);
  await page.waitForTimeout(350); assert.deepEqual(await readWorldSave(), paused);
  await page.screenshot({ path: `${output}/live-exploration.png` });
  assert.deepEqual(await readClassicSave(), before, '开放世界不能改变经典存档或 RNG');
  assert.equal(await page.evaluate(() => localStorage.getItem('C2_FOREST_VILLAGE_V1')), legacyBefore, '旧村记录保持原样');
  await page.reload(); await page.locator('#app-content').waitFor({ state: 'visible' });
  await page.evaluate(async () => (await import('/src/engine/adapter.js')).engine.pause(true));
  await page.locator('#enter-village').click();
  await page.waitForFunction(() => document.querySelector('#village-state').textContent === '已暂停');
  assert.deepEqual(await readWorldSave(), paused, '刷新续接全局位置、历史、路线与半步进度');
  await page.locator('#village-overview').click(); await page.screenshot({ path: `${output}/live-surroundings.png` });

  const results = await page.evaluate(async () => {
    const { createAssetCatalog } = await import('/src/engine/modules/rendering/asset-catalog.js');
    const { default: definitions } = await import('/src/data/assets.generated.js');
    const { OpenWorldSession } = await import('/src/engine/exploration/open-world-session.js');
    const { ExplorationRenderer } = await import('/src/engine/exploration/renderer.js');
    const { cellKey } = await import('/src/engine/exploration/navigation.js');
    const assets = createAssetCatalog({ definitions, bundle: 'forest-village' });
    while (!assets.isLoaded()) { if (assets.getErrors().length) throw new Error(assets.getErrors().join(';')); await new Promise(resolve => setTimeout(resolve, 20)); }
    const canvas = document.createElement('canvas'); canvas.id = 'village-visual-fixture'; canvas.style.cssText = 'width:1200px;height:620px;display:block'; document.body.append(canvas);
    const game = (await import('/src/engine/internal-api.js')).runtime.game;
    const heroes = game.state.adventurers.map(hero => ({ sprite: game.monsterSprites.getSprite(hero.classDefinition.spriteName) }));
    const session = new OpenWorldSession('原野-01', heroes.length), renderer = new ExplorationRenderer(canvas, assets, heroes);
    const revealWindow = () => session.world.cells.forEach(cell => session.discovered.add(cellKey(cell.x, cell.y)));
    const pose = (x, y) => {
      session.members.forEach(member => Object.assign(member, { x, y })); session.trail = []; session.path = []; session.reveal(); revealWindow(); renderer.draw(session);
    };
    const building = [...session.world.buildings].sort((a, b) => Math.abs(a.left) + Math.abs(a.top) - Math.abs(b.left) - Math.abs(b.top))[0];
    if (!building) throw new Error('自然姿态夹具找不到建筑');
    pose(building.left + building.width, building.door.y);
    const frontOrder = renderer.commands.map(command => command.id), exterior = session.world.objects.find(object => object.building === building.id && object.exterior);
    const front = frontOrder.indexOf(exterior.id) < frontOrder.indexOf('hero-0');
    pose(building.left - 1, building.top + 1);
    const backOrder = renderer.commands.map(command => command.id), back = backOrder.indexOf('hero-0') < backOrder.indexOf(exterior.id);
    pose(building.left + 2, building.top + 2);
    const cutaway = !renderer.commands.some(command => command.id === exterior.id) && renderer.hiddenRoofs >= 1;
    const furniture = session.world.objects.find(object => object.building === building.id && object.visualId === 'village.hay');
    const furnitureVisible = renderer.commands.some(command => command.id === furniture.id);
    const cachedPatches = renderer.groundPatches; renderer.draw(session);
    const groundCacheRetained = cachedPatches === renderer.groundPatches;
    const cachedPixels = renderer.surface.getContext('2d').getImageData(0, 0, renderer.surface.width, renderer.surface.height).data;
    renderer.surfaceKey = null; renderer.draw(session);
    const rebuiltPixels = renderer.surface.getContext('2d').getImageData(0, 0, renderer.surface.width, renderer.surface.height).data;
    const surfacePixelParity = cachedPixels.every((value, index) => value === rebuiltPixels[index]);
    const showRegion = position => {
      renderer.overview = false; pose(position.x, position.y);
      const started = performance.now(); for (let index = 0; index < 10; index++) renderer.draw(session);
      const counts = {};
      for (const cell of session.world.cells) counts[cell.kind] = (counts[cell.kind] || 0) + 1;
      return { position, origin: { x: session.world.originX, y: session.world.originY }, counts, buildings: session.world.buildings.map(house => ({ id: house.id, preset: house.preset, x: house.left, y: house.top })),
        patches: renderer.groundPatches.length, curvedPatches: renderer.groundPatches.filter(patch => patch.contours.some(contour => contour.some(command => command[0] === 'Q'))).length,
        averageRepeatedDrawMs: (performance.now() - started) / 10, commands: renderer.commands.length };
    };
    // 同一世界中按环境选实际坐标；展示夹具探明窗口，产品入口始终从迷雾开始。
    const regions = [];
    for (const biome of ['forest', 'wetland', 'highland']) {
      let selected = null;
      for (let y = -128; y <= 128 && !selected; y += 4) for (let x = -128; x <= 128; x += 4) {
        const cell = session.generator.terrain.sample(x, y);
        if (cell.biome === biome && cell.walkable && (biome !== 'wetland' || session.generator.terrain.field(x + 8, y).water)) { selected = { x, y, biome }; break; }
      }
      if (!selected) throw new Error(`没有找到生境 ${biome}`);
      regions.push(selected);
    }
    window.villageVisualFixture = { session, renderer, pose, building, showRegion };
    return { front, back, cutaway, furnitureVisible, groundCacheRetained, surfacePixelParity, regions, resources: assets.getStatus(), generatorVersion: session.world.generatorVersion, dpr: canvas.width / canvas.clientWidth };
  });
  assert.ok(results.front && results.back && results.cutaway && results.furnitureVisible);
  assert.ok(results.groundCacheRetained, '相同可见范围不能逐帧重建地表轮廓');
  assert.ok(results.surfacePixelParity, '缓存地表与强制重建的像素必须一致');
  assert.equal(results.dpr, 2); assert.equal(results.resources.registered, definitions.filter(definition => definition.bundle === 'forest-village').length);
  await page.locator('#village-visual-fixture').screenshot({ path: `${output}/natural-interior.png` });
  await page.evaluate(() => { const { pose, building } = window.villageVisualFixture; pose(building.left + building.width, building.door.y); });
  await page.locator('#village-visual-fixture').screenshot({ path: `${output}/natural-exterior.png` });
  results.terrainSamples = [];
  for (const position of results.regions) {
    const sample = await page.evaluate(position => window.villageVisualFixture.showRegion(position), position);
    assert.ok(sample.curvedPatches > 0 && sample.patches > 0, '产品 Renderer 必须实际绘制自然地表过渡');
    results.terrainSamples.push(sample);
    await page.locator('#village-visual-fixture').screenshot({ path: `${output}/biome-${position.biome}.png` });
  }
  await page.evaluate(() => document.querySelector('#village-visual-fixture').remove());
  await page.locator('[data-page="settings"]').click();
  assert.ok(await page.locator('#village-screen').isHidden());
  assert.equal(await page.evaluate(async () => (await import('/src/engine/adapter.js')).engine.snapshot().paused), true);
  await page.locator('[data-page="expedition"]').click(); await page.locator('#toggle-pause').click();
  await page.locator('#enter-village').click(); await page.locator('[data-page="heroes"]').click();
  assert.equal(await page.evaluate(async () => (await import('/src/engine/adapter.js')).engine.snapshot().paused), false);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.locator('[data-page="expedition"]').click(); await page.locator('#enter-village').click();
  await page.waitForFunction(() => { const canvas = document.querySelector('#village-canvas'); return canvas.width === Math.round(canvas.clientWidth * 2); });
  const mobile = await page.evaluate(() => ({ width: innerWidth, contentWidth: document.documentElement.scrollWidth, canvasWidth: document.querySelector('#village-canvas').clientWidth }));
  assert.ok(mobile.contentWidth <= mobile.width + 1, '375px 开放世界界面不能横向溢出');
  await page.screenshot({ path: `${output}/live-mobile.png` });
  results.mobile = mobile; results.live = { generatedChunks: paused.generated.length, position: paused.members[0], saveBytes: JSON.stringify(paused).length, refreshedSaveIdentical: true, legacySaveUnchanged: true };
  assert.deepEqual(errors, []);
  await writeFile(`${output}/diagnostics.json`, JSON.stringify({ ...results, errors, classicSaveUnchanged: true, ignoredSaveFields: ['gameTimestamp'], navigationRestoresPause: true }, null, 2));
  console.log('✓ 真实入口跨区域探索、刷新续接、自然地貌、木屋遮挡/室内、地表缓存、DPR 2、375px、旧村/经典存档隔离全部通过');
} finally { await browser.close(); }
