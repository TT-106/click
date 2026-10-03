import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'output/playwright/map-motion';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [], errors = [];

async function measureMotion(page, setup, mode, scene, density) {
  const frames = [];
  let firstAnchor;
  for (let step = 0; step < 8; step++) {
    const position = await page.evaluate(async ({ step, mode, setup }) => {
      const { runtime } = await import('/src/engine/internal-api.js');
      const game = runtime.game;
      const view = game.view.panels.find(panel => panel.elementId === 'gameTabContent').childViews.find(child => child.elementId === 'gameCanvas');
      const fixture = window.mapMotionFixture;
      // 阴性控制只冻结后备尺寸，防止产品定时刷新覆盖测试里的旧采样条件。
      fixture.resize(mode === 'legacy-size' ? 740 : setup.width, mode === 'legacy-size' ? 450 : setup.height);
      const center = game.worldActive ? game.world : game.level;
      const x = fixture.origin[0] + step, y = fixture.origin[1] - step;
      if (game.worldActive) { center.worldCenterX = x; center.worldCenterY = y; }
      else { center.centerX = x; center.centerY = y; }
      game.camera.tileColumn = x / 27 | 0; game.camera.tileRow = y / 27 | 0;
      game.camera.viewportOffsetX = Math.round(x % 27) - Math.round(y % 27);
      game.camera.viewportOffsetY = Math.round((Math.round(x % 27) + Math.round(y % 27)) / 2);
      view.update();
      const context = view.renderer.context;
      const bounds = context.canvas.getBoundingClientRect();
      const density = window.devicePixelRatio;
      return { anchor: view.renderer.presentation.tileScreenX(0, 0, x, y, 27, 370) * context.getTransform().a, bufferWidth: context.canvas.width,
        raw: context.canvas.toDataURL().split(',')[1],
        clip: { x: Math.round(bounds.x * density) / density, y: Math.round(bounds.y * density) / density,
          width: setup.width / density, height: setup.height / density } };
    }, { step, mode, setup });
    if (step === 0) firstAnchor = position.anchor;
    // 使用固定的物理像素裁切，避免元素截图在分数 CSS 边界扩边并再次缩放。
    const screenshot = await page.screenshot({ clip: position.clip, path: `${output}/${density}-${scene}-${mode}-${step}.png` });
    await fs.writeFile(`${output}/${density}-${scene}-${mode}-${step}-buffer.png`, Buffer.from(position.raw, 'base64'));
    frames.push({ image: screenshot.toString('base64'), offset: firstAnchor - position.anchor, bufferWidth: position.bufferWidth });
  }
  return page.evaluate(async ({ frames, scene }) => {
    const images = [];
    for (const frame of frames) {
      const image = new Image(); image.src = 'data:image/png;base64,' + frame.image;
      await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      images.push({ width: canvas.width, height: canvas.height, pixels: context.getImageData(0, 0, canvas.width, canvas.height).data });
    }
    const base = images[0], scale = base.width / 740;
    // 大地图区域含雪地/树木；地牢区域对准经过检查的实际墙体精灵。
    const region = scene === 'world' ? [333, 481, 18, 90] : [374, 418, 225, 269];
    const [left, right, top, bottom] = region.map(value => Math.floor(value * scale));
    let luminanceMin = 255, luminanceMax = 0;
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      const offset = (y * base.width + x) * 4;
      const light = .2126 * base.pixels[offset] + .7152 * base.pixels[offset + 1] + .0722 * base.pixels[offset + 2];
      luminanceMin = Math.min(luminanceMin, light); luminanceMax = Math.max(luminanceMax, light);
    }
    const residuals = [];
    for (let frame = 1; frame < images.length; frame++) {
      const next = images[frame], shift = Math.round(frames[frame].offset * next.width / frames[frame].bufferWidth);
      let error = 0, count = 0;
      for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) for (let color = 0; color < 3; color++) {
        error += Math.abs(base.pixels[(y * base.width + x) * 4 + color] - next.pixels[(y * next.width + x - shift) * 4 + color]);
        count++;
      }
      residuals.push(error / count);
    }
    return { width: base.width, luminanceRange: luminanceMax - luminanceMin, meanResidual: residuals.reduce((sum, value) => sum + value, 0) / residuals.length, residuals };
  }, { frames, scene });
}

try {
  const code = (await fs.readFile('tests/fixtures/original.c2save', 'utf8')).trim();
  for (const density of [1, 1.25, 1.5, 2]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: density });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.text().startsWith('Caught error')) errors.push(message.text()); });
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173');
    await page.locator('#recommended-party').click(); await page.locator('#begin-adventure').click();
    await page.waitForFunction(async () => (await import('/src/engine/adapter.js')).engine.snapshot().turn > 2);
    let setup = await page.evaluate(async code => {
      const { runtime } = await import('/src/engine/internal-api.js');
      const { engine } = await import('/src/engine/adapter.js');
      const save = JSON.parse(runtime.decode(code)); save.gameTimestamp = Date.now();
      runtime.importSave(runtime.encode(JSON.stringify(save)));
      engine.pause(true); engine.setPresentation('clean');
      const game = runtime.game; game.renderEnabled = false;
      for (const option of ['showFps', 'showMapOverlay', 'showCombatText', 'showSpellEffects']) game.options[option] = false;
      const view = game.view.panels.find(panel => panel.elementId === 'gameTabContent').childViews.find(child => child.elementId === 'gameCanvas');
      window.mapMotionFixture = { origin: [Math.round(game.world.worldCenterX), Math.round(game.world.worldCenterY)], resize: view.setDisplaySize.bind(view) };
      view.setDisplaySize = () => {};
      document.querySelector('#pause-overlay').style.visibility = 'hidden';
      return { width: view.renderer.context.canvas.width, height: view.renderer.context.canvas.height };
    }, code);
    for (const scene of ['world', 'dungeon']) {
      if (scene === 'dungeon') await page.evaluate(async () => {
        const { runtime } = await import('/src/engine/internal-api.js');
        const { advanceSimulation } = await import('/src/engine/modules/simulation/tick.js');
        const { getMonsters } = await import('/src/engine/modules/combat/encounters.js');
        let turns = 0;
        while (runtime.game.worldActive && turns++ < 10000) advanceSimulation(15);
        if (runtime.game.worldActive) throw new Error('夹具自然推进未进入地牢');
        const level = runtime.game.level;
        const characters = [...runtime.game.state.adventurers, ...getMonsters()];
        const distanceToActors = tile => Math.min(...characters.map(character => (tile.getPixelX() - character.position.getLevelPositionX()) ** 2 + (tile.getPixelY() - character.position.getLevelPositionY()) ** 2));
        const wall = level.tileGrid.flat().filter(tile => tile.floorType === 2 && tile.backgroundSprite && (tile.decorationSprite || tile.cachedBackgroundSprite)).sort((left, right) => distanceToActors(right) - distanceToActors(left))[0];
        if (!wall) throw new Error('未找到已绘制的实际墙体，不能用空画面冒充动态检查');
        window.mapMotionFixture.origin = [wall.getPixelX(), wall.getPixelY()];
      });
      for (const mode of ['legacy-size', 'screen-pixels']) {
        const result = { density, scene, mode, ...await measureMotion(page, setup, mode, scene, density) };
        results.push(result); console.log(JSON.stringify(result));
        assert.ok(result.luminanceRange > 10, '测试区域没有实际纹理/墙体');
        if (mode === 'screen-pixels') assert.equal(result.meanResidual, 0, `${density} DPR ${scene} 移动改变了静态纹理`);
      }
    }
    if (density === 1 || density === 2) {
      await page.evaluate(async () => {
        const { runtime } = await import('/src/engine/internal-api.js');
        const view = runtime.game.view.panels.find(panel => panel.elementId === 'gameTabContent').childViews.find(child => child.elementId === 'gameCanvas');
        view.setDisplaySize = window.mapMotionFixture.resize;
      });
      await page.setViewportSize({ width: density === 1 ? 1280 : 375, height: density === 1 ? 720 : 812 });
      setup = await page.evaluate(async () => {
        const { runtime } = await import('/src/engine/internal-api.js');
        const { engine } = await import('/src/engine/adapter.js');
        engine.setPresentation('clean');
        const view = runtime.game.view.panels.find(panel => panel.elementId === 'gameTabContent').childViews.find(child => child.elementId === 'gameCanvas');
        view.setDisplaySize = () => {};
        const canvas = view.renderer.context.canvas;
        const expectedWidth = Math.floor(canvas.parentElement.getBoundingClientRect().width * devicePixelRatio);
        return { width: canvas.width, height: canvas.height, expectedWidth };
      });
      assert.equal(setup.width, setup.expectedWidth, '窗口尺寸变化没有更新物理像素画布');
      const result = { density, scene: 'dungeon-resized', mode: 'screen-pixels', ...await measureMotion(page, setup, 'screen-pixels', 'dungeon-resized', density) };
      results.push(result); console.log(JSON.stringify(result));
      assert.ok(result.luminanceRange > 10);
      assert.equal(result.meanResidual, 0, '窗口缩放后墙体出现移动纹理变化');
    }
    await context.close();
  }
  assert.ok(results.filter(result => result.mode === 'legacy-size').some(result => result.meanResidual > 1), '旧采样条件未触发移动条纹，检查没有反向验证');
  assert.deepEqual(errors, []);
  await fs.writeFile(`${output}/metrics.json`, JSON.stringify(results, null, 2) + '\n');
  console.log('✓ 实际大地图/地牢墙体：4 档像素密度、8 个移动帧及窗口缩放；旧采样反例有差异，屏幕像素绘制平移后完全一致');
} finally { await browser.close(); }
