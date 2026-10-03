import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
await fs.mkdir('output/playwright/presentation', { recursive: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.text().startsWith('Caught error')) errors.push(message.text()); });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173');
  await page.locator('#app-content').waitFor({ state: 'visible' });
  await page.locator('#recommended-party').click();
  await page.locator('#begin-adventure').click();
  await page.locator('#expedition-screen').waitFor({ state: 'visible' });
  await page.waitForFunction(async () => (await import('/src/engine/adapter.js')).engine.snapshot().turn > 2);
  const originalSave = (await fs.readFile('tests/fixtures/original.c2save', 'utf8')).trim();
  // 本检查使用 fixture 的场景，刷新时间戳以排除历史日期触发的离线结算；原文件不修改。
  const sceneSave = await page.evaluate(async code => {
    const { runtime } = await import('/src/engine/internal-api.js');
    const data = JSON.parse(runtime.decode(code));
    data.gameTimestamp = Date.now();
    return runtime.encode(JSON.stringify(data));
  }, originalSave);
  await page.locator('#open-saves').click();
  await page.locator('.import-section summary').click();
  await page.locator('#save-code').fill(sceneSave);
  await page.locator('#import-save').click();
  await page.locator('#save-dialog').waitFor({ state: 'hidden' });
  await page.waitForFunction(async () => {
    const { runtime } = await import('/src/engine/internal-api.js');
    return runtime.game.view.panels.find(panel => panel.elementId === 'gameTabContent')?.childViews.find(child => child.elementId === 'gameCanvas')?.presentationStyle === 'clean';
  });
  const result = await page.evaluate(async () => {
    const { engine } = await import('/src/engine/adapter.js');
    const { runtime } = await import('/src/engine/internal-api.js');
    const { SceneRenderer, DepthSortedRenderer, drawWorldTileRow } = await import('/src/engine/modules/rendering/scene.js');
    const { TILE_SIZE } = await import('/src/engine/modules/core/screen-layout.js');
    const { createMapPresentation } = await import('/src/engine/modules/rendering/presentation.js');
    engine.pause(true);
    const sprite = runtime.game.terrainSprites.getSprite('L1_Terrain049.PNG');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 100;
    const context = canvas.getContext('2d');
    const pixels = () => new Uint8Array(context.getImageData(0, 0, 100, 100).data);
    const changed = (left, right) => left.reduce((count, value, index) => count + Number(value !== right[index]), 0);
    const draw = (style, offset) => {
      const renderer = new SceneRenderer(context);
      renderer.presentation = style === 'clean' ? createMapPresentation() : null;
      context.imageSmoothingEnabled = style !== 'clean';
      context.clearRect(0, 0, 100, 100);
      renderer.drawSprite(sprite, offset, 10, 'ground');
      return pixels();
    };
    const drawWalls = (style, offset) => {
      const renderer = new DepthSortedRenderer();
      renderer.presentation = style === 'clean' ? createMapPresentation() : null;
      renderer.context = context;
      renderer.scratchVector.x = 200 + offset;
      renderer.scratchVector.y = 200;
      context.clearRect(0, 0, 100, 100);
      renderer.drawSpriteDepth(sprite, 100, 0, 4, 4, 56, 0, 'scenery');
      renderer.drawSpriteDepth(sprite, 0, 100, 16, 4, 56, 0, 'scenery');
      renderer.sortCommands();
      return { order: renderer.renderCommands.map(command => command.screenX), image: pixels() };
    };
    const classicWalls = [drawWalls('classic', -.25), drawWalls('classic', .25)];
    const cleanWalls = [drawWalls('clean', -.25), drawWalls('clean', .25)];
    const camera = runtime.game.camera;
    const world = runtime.game.world;
    const originalCamera = { ...camera };
    const originalCenter = [world.worldCenterX, world.worldCenterY];
    const column = Math.floor(world.worldCenterX / TILE_SIZE) + 1;
    const row = Math.floor(world.worldCenterY / TILE_SIZE);
    const boundary = column * TILE_SIZE;
    const tileY = (style, centerX) => {
      world.worldCenterX = centerX;
      world.worldCenterY = row * TILE_SIZE;
      const remainderX = Math.round(centerX % TILE_SIZE);
      camera.tileColumn = centerX / TILE_SIZE | 0;
      camera.tileRow = row;
      camera.viewportOffsetX = remainderX;
      camera.viewportOffsetY = Math.round(remainderX / 2);
      let screenY;
      drawWorldTileRow({
        presentation: style === 'clean' ? createMapPresentation() : null,
        drawSprite(_sprite, _x, y) { screenY = Math.round(y); },
        spriteRenderer: { drawSpriteDepth() {} }
      }, row, column, column + 1);
      return screenY;
    };
    let tileBoundary;
    try {
      tileBoundary = Object.fromEntries(['classic', 'clean'].map(style => [style, [tileY(style, boundary - .1), tileY(style, boundary + .1)]]));
    } finally {
      Object.assign(camera, originalCamera);
      [world.worldCenterX, world.worldCenterY] = originalCenter;
    }
    const presentation = createMapPresentation();
    presentation.drawSprite(context, sprite, 10, 10, 56, 'ground');
    const initialCache = presentation.metrics.cachedSprites;
    for (let frame = 0; frame < 60; frame++) presentation.drawSprite(context, sprite, 10, 10, 56, 'ground');
    const cacheAfter = presentation.metrics.cachedSprites;
    presentation.drawSprite(context, sprite, -60, -60, 56, 'ground');
    const originalNow = Date.now;
    const fixedTime = originalNow();
    Date.now = () => fixedTime;
    let saveUnchanged;
    try {
      const beforeStyle = engine.serialize();
      for (const style of ['classic', 'clean', 'classic', 'clean']) engine.setPresentation(style);
      saveUnchanged = beforeStyle === engine.serialize();
    } finally { Date.now = originalNow; }
    const view = runtime.game.view.panels.find(panel => panel.elementId === 'gameTabContent').childViews.find(child => child.elementId === 'gameCanvas');
    return {
      groundClassicChanges: changed(draw('classic', 10.1), draw('classic', 10.3)),
      groundCleanChanges: changed(draw('clean', 10.1), draw('clean', 10.3)),
      classicWallOrders: classicWalls.map(frame => frame.order), cleanWallOrders: cleanWalls.map(frame => frame.order),
      classicWallChanges: changed(classicWalls[0].image, classicWalls[1].image),
      cleanWallChanges: changed(cleanWalls[0].image, cleanWalls[1].image), tileBoundary,
      initialCache, cacheAfter, culledSprites: presentation.metrics.culledSprites,
      saveUnchanged, defaultStyle: view.presentationStyle,
      smoothing: view.renderer.context.imageSmoothingEnabled
    };
  });
  await fs.writeFile('output/playwright/presentation/diagnostics.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
  assert.notDeepEqual(result.classicWallOrders[0], result.classicWallOrders[1], '墙面排序反例未触发旧机制');
  assert.deepEqual(result.cleanWallOrders[0], result.cleanWallOrders[1], '相机微移仍改变同深度墙面的排序');
  assert.equal(result.cleanWallChanges, 0, '固定墙面出现帧间闪动');
  assert.ok(result.tileBoundary.classic[1] > result.tileBoundary.classic[0], '地面格边界反向跳动反例未触发');
  assert.ok(result.tileBoundary.clean[1] <= result.tileBoundary.clean[0], '相机前移过格边界时地面反向跳动');
  assert.ok(result.groundClassicChanges > 0, '地形亚像素采样反例未触发');
  assert.equal(result.groundCleanChanges, 0, '同一像素格内的亚像素微移仍导致纹理闪动');
  assert.equal(result.cacheAfter, result.initialCache, '已缓存地形仍逐帧重建');
  assert.equal(result.culledSprites, 1, '画外精灵未被剔除');
  assert.equal(result.saveUnchanged, true, '切换画面改变了存档或随机流');
  assert.equal(result.defaultStyle, 'clean');
  assert.equal(result.smoothing, false);

  const scenes = await page.evaluate(async () => {
    const { runtime } = await import('/src/engine/internal-api.js');
    const { engine } = await import('/src/engine/adapter.js');
    const { advanceSimulation } = await import('/src/engine/modules/simulation/tick.js');
    const view = runtime.game.view.panels.find(panel => panel.elementId === 'gameTabContent').childViews.find(child => child.elementId === 'gameCanvas');
    const compare = () => {
      const frames = {};
      for (const style of ['classic', 'clean']) {
        view.setPresentation(style);
        view.update();
        const context = view.renderer.context;
        const pixels = context.getImageData(0, 0, context.canvas.width, context.canvas.height).data;
        let brightness = 0;
        for (let index = 0; index < pixels.length; index += 4) brightness += .2126 * pixels[index] + .7152 * pixels[index + 1] + .0722 * pixels[index + 2];
        frames[style] = { brightness: brightness / (pixels.length / 4), cachedSprites: view.renderer.presentation?.metrics.cachedSprites || 0 };
      }
      return { world: runtime.game.worldActive, frames };
    };
    const world = compare();
    let turns = 0;
    while (runtime.game.worldActive && turns++ < 10000) advanceSimulation(15);
    // 自然帧循环更新地牢相机；直接 advanceSimulation 不会更新相机投影。
    engine.pause(false);
    await new Promise(resolve => setTimeout(resolve, 50));
    engine.pause(true);
    return { world, dungeon: compare(), turns };
  });
  console.log(JSON.stringify(scenes, null, 2));
  assert.equal(scenes.world.world, true, '夹具未覆盖大地图绘制');
  assert.equal(scenes.dungeon.world, false, '自然推进未进入地牢');
  for (const scene of [scenes.world, scenes.dungeon]) {
    assert.ok(scene.frames.clean.cachedSprites > 0, '实际场景未经过清晰地形缓存');
    assert.ok(scene.frames.clean.brightness < scene.frames.classic.brightness * .9, '实际场景的地形对比未降低');
  }
  await fs.writeFile('output/playwright/presentation/scenes.json', JSON.stringify(scenes, null, 2) + '\n');

  for (const style of ['classic', 'clean']) {
    await page.locator('#header-settings').click();
    await page.locator('#presentation-style').selectOption(style);
    await page.locator('#main-nav [data-page="expedition"]').click();
    await page.evaluate(async () => {
      const { runtime } = await import('/src/engine/internal-api.js');
      const view = runtime.game.view.panels.find(panel => panel.elementId === 'gameTabContent').childViews.find(child => child.elementId === 'gameCanvas');
      view.update();
    });
    await page.locator('#pause-overlay').evaluate(node => node.style.visibility = 'hidden');
    await page.screenshot({ path: `output/playwright/presentation/fixture-${style}.png` });
  }

  const layouts = [];
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1280, height: 720 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(viewport);
    const bounds = await page.locator('#gameCanvas').boundingBox();
    await page.screenshot({ path: `output/playwright/presentation/layout-${viewport.width}.png`, fullPage: true });
    assert.ok(bounds.y < 100, `${viewport.width}px 地图仍被顶部说明下推`);
    assert.equal(await page.locator('.app-header').count(), 0);
    assert.equal(await page.locator('#page-heading').isVisible(), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '主体横向溢出');
    await page.locator('#open-saves').click();
    await page.locator('#save-dialog').waitFor({ state: 'visible' });
    await page.locator('#close-saves').click();
    await page.locator('#header-settings').click();
    await page.locator('#presentation-style').selectOption('classic');
    assert.equal(await page.evaluate(() => localStorage.getItem('C2_PRESENTATION_V1')), 'classic');
    await page.locator('#presentation-style').selectOption('clean');
    await page.locator('#main-nav [data-page="expedition"]').click();
    // 暂时隐藏暂停提示以记录地图本身；游戏保持暂停。
    await page.locator('#pause-overlay').evaluate(node => node.style.visibility = 'hidden');
    await page.screenshot({ path: `output/playwright/presentation/layout-${viewport.width}.png`, fullPage: true });
    layouts.push({ ...viewport, mapTop: bounds.y, mapWidth: bounds.width, mapHeight: bounds.height });
  }
  await page.reload();
  await page.locator('#expedition-screen').waitFor({ state: 'visible' });
  const storedStyle = await page.evaluate(async () => {
    const { runtime } = await import('/src/engine/internal-api.js');
    const view = runtime.game.view.panels.find(panel => panel.elementId === 'gameTabContent').childViews.find(child => child.elementId === 'gameCanvas');
    return view.presentationStyle;
  });
  assert.equal(storedStyle, 'clean');
  assert.deepEqual(errors, [], '画面优化存在浏览器错误');
  await fs.writeFile('output/playwright/presentation/layouts.json', JSON.stringify(layouts, null, 2) + '\n');
  console.log('✓ 地形采样、墙面稳定排序、缓存/剔除、存档不变、1440/1280/375px 布局与侧栏入口');
} finally { await browser.close(); }
