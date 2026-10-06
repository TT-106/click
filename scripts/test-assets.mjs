// 浏览器验收：真实 Image/Canvas、旧实例热替换、多尺寸动画、地图遮挡与存档隔离。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { loadAssetDefinitions } from './import-assets.mjs';

const output = 'output/playwright/assets';
await fs.mkdir(output, { recursive: true });
const importedExample = (await loadAssetDefinitions(undefined, { includeDisabled: true })).find(definition => definition.id === 'example.slime');
assert.ok(importedExample, '缺少经自动帧扫描编译的示例素材包');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => {
    if (message.type() === 'error' || message.text().startsWith('Caught error')) errors.push(message.text());
  });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173');
  await page.locator('#app-content').waitFor({ state: 'visible' });
  await page.locator('#recommended-party').click();
  await page.locator('#begin-adventure').click();
  await page.locator('#expedition-screen').waitFor({ state: 'visible' });
  await page.waitForFunction(async () => (await import('/src/engine/adapter.js')).engine.snapshot().turn > 2);

  const result = await page.evaluate(async importedExample => {
    const { runtime } = await import('/src/engine/internal-api.js');
    const { engine } = await import('/src/engine/adapter.js');
    const { DepthSortedRenderer, drawWorldCharacters, drawWorldTileRow, drawSceneObjects } = await import('/src/engine/modules/rendering/scene.js');
    const { resolveEntityVisual } = await import('/src/engine/modules/rendering/entity-visual.js');
    const { frameGeometry, resolveSpriteFrame } = await import('/src/engine/modules/rendering/frame.js');
    const { projectActor, projectMap, unprojectMap, visualDepthPosition, visibleTileBounds } = await import('/src/engine/modules/rendering/projection.js');
    const { createMapPresentation } = await import('/src/engine/modules/rendering/presentation.js');
    const { getSpritePreview, spriteBackground } = await import('/src/engine/modules/rendering/preview.js');
    const { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } = await import('/src/engine/modules/core/screen-layout.js');
    engine.pause(true);
    const game = runtime.game;
    const who = game.state.adventurers[0];
    const oldSprite = who.getSprite(), oldAlias = oldSprite.getName();
    const saved = {
      turn: game.state.turnNumber, accumulator: game.lifecycle.turnTimeAccumulator,
      position: { ...who.position.worldPosition }, lastAttackTurn: who.lastAttackTurn,
      objects: game.world.sceneObjects,
    };
    const originalNow = Date.now, fixedNow = originalNow();
    Date.now = () => fixedNow;
    const initialSave = engine.serialize();
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const png = (width, height, color) => {
      const image = document.createElement('canvas'); image.width = width; image.height = height;
      const context = image.getContext('2d');
      context.fillStyle = color; context.fillRect(0, 0, width, height);
      return image.toDataURL('image/png');
    };
    const colors = { red: [255, 0, 0, 255], green: [0, 255, 0, 255], blue: [0, 0, 255, 255], orange: [255, 128, 0, 255] };
    const equalPixel = (pixel, color) => pixel.every((value, index) => value === color[index]);
    const canvas = document.createElement('canvas');
    canvas.id = 'asset-validation-canvas'; canvas.width = VIEWPORT_WIDTH; canvas.height = VIEWPORT_HEIGHT;
    canvas.style.cssText = 'display:block;width:740px;height:450px;margin:16px;background:#172024';
    document.body.append(canvas);
    const drawing = canvas.getContext('2d');
    const pixel = (x, y) => [...drawing.getImageData(Math.round(x), Math.round(y), 1, 1).data];
    const makeRenderer = () => {
      drawing.clearRect(0, 0, canvas.width, canvas.height);
      const sprites = new DepthSortedRenderer();
      sprites.presentation = createMapPresentation(); sprites.setContext(drawing); sprites.presentation.beginFrame(drawing);
      return { sprites, renderer: { context: drawing, presentation: sprites.presentation, spriteRenderer: sprites } };
    };
    try {
      const frames = {
        idle_01: { source: { image: png(40, 80, '#ff0000') } },
        idle_02: { source: { image: png(64, 112, '#00ff00') } },
        walk_NE: { source: { image: png(48, 96, '#ff0000') } },
        walk_NW: { source: { image: png(48, 96, '#00ff00') } },
        walk_SE: { source: { image: png(48, 96, '#0000ff') } },
        walk_SW: { source: { image: png(48, 96, '#ffff00') } },
      };
      const sprite = await game.assets.register({
        id: 'test.animated-actor', group: 'actors', replace: oldAlias, frames,
        clips: {
          idle: { frames: ['idle_01', 'idle_02'], fps: 4 },
          walk: { frames: ['walk_SE'], fps: 8, directions: Object.fromEntries(['NE', 'NW', 'SE', 'SW'].map(direction => [direction, ['walk_' + direction]])) },
          attack: { frames: ['idle_01', 'idle_02'], fps: 10, loop: false },
        },
      });
      const wall = await game.assets.register({ id: 'test.tall-wall', group: 'terrain', source: { image: png(180, 220, '#0000ff') }, origin: { x: 27, y: 40 } });
      const tree = await game.assets.register({ id: 'test.offscreen-tree', group: 'terrain', source: { image: png(960, 280, '#ff8000') }, origin: { x: 0, y: 0 } });
      const second = await game.assets.register({ id: 'test.prop-second', group: 'terrain', frames: {
        idle_01: { source: { image: png(30, 70, '#ffff00') } }, idle_02: { source: { image: png(30, 70, '#ff8000') } },
      }, origin: { x: 0, y: 0 }, clips: { idle: { frames: ['idle_01', 'idle_02'], fps: 4 } } });
      // 附带仓库的独立图片示例也必须在真实浏览器中加载成功。
      const sample = await game.assets.register({ ...importedExample, id: 'test.imported-slime' });
      check(sample.frame.size.height > sample.frame.size.width, '仓库导入示例的不同尺寸图片没有归一化');
      check(who.getSprite() === oldSprite, '替换不应重写游戏实体持有的旧精灵');
      check(game.assets.resolve(oldSprite, 'actors') === sprite, '旧实体引用没有解析为新素材');
      check(sprite.getName() === oldAlias, '替换改变存档资源名称');
      check(game.monsterSprites.getSprite(oldAlias) === sprite, '旧查询门面未返回新资源');
      const preview = getSpritePreview(oldSprite, 'portrait');
      check(preview.url.startsWith('data:image/png') && preview.x === 0 && preview.y === 0, '角色面板预览仍按旧图集裁切');
      check(spriteBackground(oldSprite, 'portrait').includes('data:image/png'), '背景预览没有晚解析旧实例热替换');

      const probe = { lastAttackTurn: -10, position: {}, isDead: false };
      const animation = [];
      for (const timeMs of [0, 250, 500]) {
        const visual = resolveEntityVisual(probe, sprite, { timeMs, x: 0, y: 0 });
        const { sprites } = makeRenderer();
        sprites.drawSpriteDepth(visual, 0, 0, 370, 225, visual.frame.size.width, 0);
        sprites.sortCommands();
        const bounds = frameGeometry(visual.frame, 370, 225);
        const foot = { x: bounds.x + visual.frame.anchor.x, y: bounds.y + visual.frame.anchor.y };
        const color = pixel(foot.x, foot.y - 8);
        check(equalPixel(color, timeMs === 250 ? colors.green : colors.red), '多帧图片没有真实绘出对应帧');
        animation.push({ timeMs, frameIndex: visual.frameIndex, size: visual.frame.size, foot, pixel: color });
      }
      check(animation.every(frame => frame.foot.x === animation[0].foot.x && frame.foot.y === animation[0].foot.y), '多尺寸帧脚点发生跳动');
      const directions = [];
      for (const [dx, dy, direction] of [[1, 0, 'SE'], [-1, 0, 'NW'], [0, 1, 'SW'], [0, -1, 'NE']]) {
        const moving = { position: {}, lastAttackTurn: -10 };
        resolveEntityVisual(moving, sprite, { timeMs: 0, x: 0, y: 0 });
        const visual = resolveEntityVisual(moving, sprite, { timeMs: 10, x: dx, y: dy });
        check(visual.direction === direction && visual.frame === sprite.frames['walk_' + direction], '四方向动画未按投影方位选择');
        directions.push(visual.direction);
      }

      // 旧地图实例里的 sprite 引用不能因资源替换而失效。
      const column = game.world.pixelToTileColumn(game.world.worldCenterX);
      const row = game.world.pixelToTileRow(game.world.worldCenterY);
      const tile = game.world.getTileAtPixel(column, row);
      check(Boolean(tile?.backgroundSprite), '实际地图验证没有取得可绘制地块');
      const oldTileSprite = tile.backgroundSprite;
      const floor = await game.assets.register({ id: 'test.replaced-floor', group: 'terrain', replace: oldTileSprite.getName(), source: { image: png(54, 54, '#ff8000') }, anchor: { x: 0, y: 0 }, origin: { x: 0, y: 0 } });
      let hotTile;
      drawWorldTileRow({ presentation: createMapPresentation(), drawSprite(value) { hotTile = value; }, spriteRenderer: { drawSpriteDepth() {} } }, row, column, column + 1);
      check(game.world.getTileAtPixel(column, row) === tile && tile.backgroundAssetId === oldTileSprite.getName() && hotTile === floor, '实际旧 Tile 的语义 ID 或热替换解析不正确');

      const originalRandom = Math.random;
      Math.random = () => { throw new Error('素材播放或排序消耗了游戏随机流'); };
      let wiredFrames, behindPixel, frontPixel, offscreenPixel, objectCount, footprintDepth, objectFrames;
      try {
        // 使用真实角色和实际 drawWorldCharacters 接线，模拟时间变化不修改游戏推进函数。
        who.position.worldPosition.x = game.world.worldCenterX;
        who.position.worldPosition.y = game.world.worldCenterY;
        const readWorldFrame = (turn, accumulator) => {
          game.state.turnNumber = turn; game.lifecycle.turnTimeAccumulator = accumulator;
          const { sprites, renderer } = makeRenderer();
          drawWorldCharacters(renderer, [who]);
          const command = sprites.renderCommands.find(command => command.isSet);
          check(command.sprite.frame, '实际场景未接入 entity 动画播放器');
          sprites.sortCommands();
          return { index: command.sprite.frameIndex, pixel: pixel(397, 257), bounds: frameGeometry(resolveSpriteFrame(command.sprite), command.screenX, command.screenY, command.renderSize) };
        };
        wiredFrames = [readWorldFrame(saved.turn, 0), readWorldFrame(saved.turn + 1, 0)];
        check(wiredFrames[0].index === 0 && wiredFrames[1].index === 1, '实际角色渲染未用累计模拟时间推进多帧');
        check(equalPixel(wiredFrames[0].pixel, colors.red) && equalPixel(wiredFrames[1].pixel, colors.green), '实际场景动画帧像素不正确');

        // 高墙按脚点排序：同一像素在角色处于墙后时蓝、墙前时红。
        const centerX = game.world.worldCenterX, centerY = game.world.worldCenterY;
        const actorFrame = { frame: sprite.frames.idle_01, visualResolved: true };
        const overlap = (delta, cameraDelta = 0) => {
          const { sprites } = makeRenderer();
          const wallScreen = projectActor(centerX, centerY, centerX + cameraDelta, centerY);
          const actorScreen = projectActor(centerX + delta, centerY + delta, centerX + cameraDelta, centerY);
          sprites.drawSpriteDepth(wall, centerX, centerY, wallScreen.x, wallScreen.y, 180, 0, 'scenery');
          sprites.drawSpriteDepth(actorFrame, centerX + delta, centerY + delta, actorScreen.x, actorScreen.y, 40, 0, 'actor');
          sprites.sortCommands();
          return { pixel: pixel(wallScreen.x + 27, wallScreen.y - 20), order: sprites.renderCommands.filter(command => command.isSet).map(command => command.sprite.id || 'actor') };
        };
        behindPixel = overlap(-20).pixel; frontPixel = overlap(20).pixel;
        check(equalPixel(behindPixel, colors.blue) && equalPixel(frontPixel, colors.red), '高墙前后遮挡不按逻辑脚点切换');
        check(JSON.stringify(overlap(20, -.25).order) === JSON.stringify(overlap(20, .25).order), '相机微移改变实体前后关系');
        footprintDepth = visualDepthPosition(centerX, centerY, wall.frame, { columns: 2, rows: 2 });
        check(footprintDepth.x === centerX + TILE_SIZE && footprintDepth.y === centerY + TILE_SIZE, '2×2物件未按占地前沿计算深度');

        // 物件图像基点在窗外，960px图像仍有一部分进入视口；第二物件独立排序。
        const outsidePosition = unprojectMap(-80, 225, centerX, centerY);
        game.world.sceneObjects = [
          { visualId: tree.id, position: outsidePosition },
          { visualId: second.id, position: unprojectMap(650, 300, centerX, centerY), footprint: { columns: 2, rows: 1 } },
        ];
        const { sprites, renderer } = makeRenderer();
        drawSceneObjects(renderer, game.world, true); objectCount = sprites.commandIndex; sprites.sortCommands();
        offscreenPixel = pixel(20, 100);
        check(objectCount === 2 && equalPixel(offscreenPixel, colors.orange), '窗外基点的大图或多个场景物件未真实绘制');
        const extent = game.assets.getVisualExtent();
        const bounds = visibleTileBounds(centerX, centerY, extent);
        check(outsidePosition.x / TILE_SIZE >= bounds.minColumn && outsidePosition.x / TILE_SIZE <= bounds.maxColumn && outsidePosition.y / TILE_SIZE >= bounds.minRow && outsidePosition.y / TILE_SIZE <= bounds.maxRow, '候选范围排除了视觉仍入窗的大图基点');
        objectFrames = [];
        for (const turn of [100, 101]) {
          game.state.turnNumber = turn; game.lifecycle.turnTimeAccumulator = 0;
          const scene = makeRenderer(); drawSceneObjects(scene.renderer, game.world, true);
          const animated = scene.sprites.renderCommands.find(command => command.sprite?.getName?.() === second.getName());
          objectFrames.push(animated.sprite.frameIndex); scene.sprites.sortCommands();
        }
        check(objectFrames[0] === 0 && objectFrames[1] === 1, '实际场景物件的 idle clip 没有播放');

        // 存档字节对比发生在恢复所有临时世界状态后。
        game.state.turnNumber = saved.turn; game.lifecycle.turnTimeAccumulator = saved.accumulator;
        Object.assign(who.position.worldPosition, saved.position); who.lastAttackTurn = saved.lastAttackTurn;
        if (saved.objects === undefined) delete game.world.sceneObjects; else game.world.sceneObjects = saved.objects;
        check(engine.serialize() === initialSave, '注册、替换或动画状态改变了存档字节');
      } finally { Math.random = originalRandom; }

      // 在实际 GameCanvasView 中画出替换后的角色与多个物件，保留截图证据。
      const expedition = game.view.panels.find(panel => panel.elementId === 'gameTabContent');
      const summary = expedition.childViews.find(child => child.elementId === 'gameTabAdventurerInfo0');
      summary.reset(); summary.render();
      const portraitBackground = document.querySelector('#gameTabAdventurerInfo0 .characterImage')?.style.backgroundImage || '';
      check(portraitBackground.includes('data:image/png'), '实际角色信息面板刷新后仍显示旧图集');
      const actualView = expedition.childViews.find(child => child.elementId === 'gameCanvas');
      actualView.setPresentation('clean'); actualView.update();
      const sceneMetrics = { drawnSprites: actualView.renderer.presentation.metrics.drawnSprites, registered: game.assets.getStatus().registered };
      check(sceneMetrics.drawnSprites > 0, '实际 GameCanvasView 没有绘出场景');
      // 对照画布展示正常锚点的大墙、前后实体、独立导入示例和双图像物件。
      const proof = makeRenderer();
      const centerX = game.world.worldCenterX, centerY = game.world.worldCenterY;
      for (const [value, x, y] of [[wall, centerX, centerY], [{ frame: sprite.frames.idle_01, visualResolved: true }, centerX - 20, centerY - 20], [sample, centerX + 45, centerY + 45], [second, centerX + 120, centerY - 100]]) {
        const screen = projectActor(x, y, centerX, centerY);
        proof.sprites.drawSpriteDepth(value, x, y, screen.x, screen.y, resolveSpriteFrame(value).size.width, 0, value.group === 'terrain' ? 'scenery' : 'actor');
      }
      proof.sprites.sortCommands();
      drawing.fillStyle = '#dfe8e0'; drawing.font = '16px Microsoft YaHei UI';
      drawing.fillText('资源验证：高墙遮挡 / 独立导入示例 / 多尺寸帧统一脚点', 20, 420);
      return { oldAlias, registered: game.assets.getStatus().registered, animation, directions, wiredFrames, behindPixel, frontPixel, offscreenPixel, objectCount, objectFrames, footprintDepth, hotTile: hotTile.id, sampleSize: sample.frame.size, portraitPreview: { x: preview.x, y: preview.y, width: preview.width, height: preview.height, actualPanelUpdated: true }, sceneMetrics, saveUnchanged: true, rngUntouched: true };
    } finally {
      Date.now = originalNow;
      game.state.turnNumber = saved.turn; game.lifecycle.turnTimeAccumulator = saved.accumulator;
      Object.assign(who.position.worldPosition, saved.position); who.lastAttackTurn = saved.lastAttackTurn;
      if (saved.objects === undefined) delete game.world.sceneObjects; else game.world.sceneObjects = saved.objects;
    }
  }, importedExample);
  await fs.writeFile(`${output}/diagnostics.json`, JSON.stringify(result, null, 2) + '\n');
  await page.locator('#asset-validation-canvas').screenshot({ path: `${output}/occlusion-and-import.png` });
  await page.locator('#gameCanvas').screenshot({ path: `${output}/actual-world.png` });
  assert.deepEqual(errors, [], '浏览器或被旧帧循环捕获的渲染异常');
  assert.equal(result.saveUnchanged, true);
  assert.equal(result.rngUntouched, true);
  console.log(JSON.stringify(result, null, 2));
  console.log('✓ 真实 PNG/独立图片注册、旧实例热替换、多尺寸多帧、四方向、实际世界渲染、高墙遮挡、多个物件、窗外大图、存档与 RNG 隔离');
  await context.close();
} finally { await browser.close(); }
