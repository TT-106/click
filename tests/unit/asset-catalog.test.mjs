import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createAssetCatalog, validateAssetDefinition } from '../../src/engine/modules/rendering/asset-catalog.js';
import { importAssets, loadAssetDefinitions, readImageSize } from '../../scripts/import-assets.mjs';

function imageHarness(dimensions = {}) {
  const created = [];
  const failing = new Set();
  return {
    created, failing,
    imageFactory() {
      const image = {
        naturalWidth: 0, naturalHeight: 0,
        set src(url) {
          this.url = url;
          queueMicrotask(() => {
            if (failing.has(url)) this.onerror();
            else {
              [this.naturalWidth, this.naturalHeight] = dimensions[url] || [64, 96];
              this.onload();
            }
          });
        },
        get src() { return this.url; }
      };
      created.push(image);
      return image;
    }
  };
}
function legacyGroup() {
  const original = { name: 'Old.PNG', getName() { return this.name; } };
  const entries = { 'Old.PNG': original };
  return { original, getSprite(name) { return entries[name]; }, isLoaded() { return true; }, getSheetImage() { return null; } };
}

test('资源包隔离：经典启动不加载其它主题图片，也不扩大裁剪窗', async () => {
  const harness = imageHarness();
  const definitions = [{ id: 'village.large-tree', bundle: 'forest-village', group: 'terrain', source: { image: 'tree.png' }, size: { width: 300, height: 400 } }];
  const classic = createAssetCatalog({ definitions, imageFactory: harness.imageFactory });
  assert.equal(harness.created.length, 0);
  assert.equal(classic.getStatus().registered, 0);
  assert.deepEqual(classic.getVisualExtent('terrain'), { left: 0, right: 54, top: 0, bottom: 54 });
  const village = createAssetCatalog({ definitions, bundle: 'forest-village', imageFactory: harness.imageFactory });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(village.getStatus().registered, 1);
  assert.equal(harness.created.length, 1);
  assert.equal(village.group('terrain').getSprite('village.large-tree').frame.size.height, 400);
  assert.throws(() => validateAssetDefinition({ ...definitions[0], bundle: '../bad' }), /bundle/);
});

test('独图替换等待全部图片加载，旧 alias 和存档名称稳定，所有方向混尺寸帧均计入可见范围', async () => {
  const harness = imageHarness({ 'wide.png': [120, 100] });
  const legacy = legacyGroup();
  const catalog = createAssetCatalog({ legacyGroups: { actors: legacy }, imageFactory: harness.imageFactory });
  const operation = catalog.register({
    id: 'monster.slime', group: 'actors', replace: 'Old.PNG', aliases: ['slime'],
    frames: { idle: { source: { image: 'idle.png' } }, wide: { source: { image: 'wide.png' } } },
    clips: { idle: { frames: ['idle'], fps: 5 }, walk: { directions: { NE: ['idle', 'wide'], SW: ['wide', 'idle'] }, fps: 12 } }
  });
  assert.equal(catalog.group('actors').getSprite('Old.PNG'), legacy.original);
  assert.equal(catalog.isLoaded(), false);
  const sprite = await operation;
  assert.equal(catalog.group('actors').getSprite('monster.slime'), sprite);
  assert.equal(catalog.group('actors').getSprite('slime'), sprite);
  assert.equal(catalog.resolve(legacy.original), sprite);
  assert.equal(catalog.resolve('monster.slime'), sprite);
  assert.equal(catalog.resolve('missing'), undefined);
  assert.equal(sprite.getName(), 'Old.PNG');
  assert.deepEqual(sprite.frame.source, { x: 0, y: 0, width: 64, height: 96 });
  assert.deepEqual(sprite.clips.walk.directions.NE[1].size, { width: 120, height: 100 });
  assert.deepEqual(catalog.getVisualExtent(), { left: -33, right: 87, top: -60, bottom: 54 });
  assert.deepEqual(catalog.group('actors').getVisualExtent(), catalog.getVisualExtent());
  assert.deepEqual(catalog.getVisualExtent('terrain'), { left: 0, right: 54, top: 0, bottom: 54 });
  assert.deepEqual(catalog.group('terrain').getVisualExtent(), { left: 0, right: 54, top: 0, bottom: 54 });
  assert.deepEqual(catalog.group('items').getVisualExtent(), { left: 0, right: 32, top: 0, bottom: 32 });
  const extentCopy = catalog.getVisualExtent('terrain'); extentCopy.top = -999;
  assert.equal(catalog.getVisualExtent('terrain').top, 0);
  assert.equal(catalog.isLoaded(), true);
  const view = { frame: sprite.frames.wide, visualResolved: true, id: sprite.id };
  assert.equal(catalog.resolve(view), view);
});

test('同图集多帧共享 Image，rect/size/anchor 独立，失败替换保留原资源并可修复重试', async () => {
  const harness = imageHarness({ 'atlas.png': [128, 128] });
  const legacy = legacyGroup();
  const catalog = createAssetCatalog({ legacyGroups: { actors: legacy }, imageFactory: harness.imageFactory });
  const definition = {
    id: 'actor.replacement', group: 'actors', replace: 'Old.PNG',
    frames: {
      one: { source: { image: 'atlas.png', rect: { x: 0, y: 0, width: 20, height: 60 } }, size: { width: 40, height: 120 }, anchor: { x: 20, y: 110 } },
      two: { source: { image: 'atlas.png', rect: { x: 120, y: 0, width: 20, height: 80 } } }
    }, clips: { idle: { frames: ['one', 'two'] } }
  };
  await assert.rejects(catalog.register(definition), /裁切区域超出/);
  assert.equal(catalog.group('actors').getSprite('Old.PNG'), legacy.original);
  assert.equal(catalog.getErrors().length, 1);
  definition.frames.two.source.rect.x = 100;
  const sprite = await catalog.register(definition);
  assert.equal(harness.created.length, 1);
  assert.deepEqual(sprite.frames.one.size, { width: 40, height: 120 });
  assert.deepEqual(sprite.frames.two.size, { width: 20, height: 80 });
  assert.deepEqual(catalog.getErrors(), []);
  assert.equal(catalog.isLoaded(), true);
});

test('加载失败保留旧显示，报告路径；重试不被失败的 id/alias 预留锁住', async () => {
  const harness = imageHarness();
  harness.failing.add('broken.png');
  const legacy = legacyGroup();
  const catalog = createAssetCatalog({ legacyGroups: { actors: legacy }, imageFactory: harness.imageFactory });
  const definition = { id: 'new', group: 'actors', replace: 'Old.PNG', source: { image: 'broken.png' } };
  await assert.rejects(catalog.register(definition), /broken.png/);
  assert.equal(catalog.group('actors').getSprite('Old.PNG'), legacy.original);
  assert.equal(catalog.getStatus().loaded, false);
  harness.failing.delete('broken.png');
  await catalog.register(definition);
  assert.equal(catalog.isLoaded(), true);
  assert.equal(harness.created.length, 2);
});

test('未知状态、错拼字段值和碰撞都显式报错；不改变旧 SpriteSheet 继承键查找', async () => {
  const harness = imageHarness();
  const legacy = legacyGroup();
  const catalog = createAssetCatalog({ legacyGroups: { actors: legacy }, imageFactory: harness.imageFactory });
  assert.equal(typeof catalog.group('actors').getSprite('toString'), 'function');
  assert.throws(() => catalog.register({ id: 'Old.PNG', group: 'actors', source: { image: 'one.png' } }), /replace/);
  assert.throws(() => validateAssetDefinition({ id: 'one', group: 'actors', source: { image: 'one.png' }, clips: { wlak: { frames: [] } } }), /未知动画状态/);
  assert.throws(() => validateAssetDefinition({ id: 'one', group: 'actors', source: { image: 'one.png' }, layer: 'scenary' }), /未知绘制层/);
  await assert.rejects(catalog.register({ id: 'one', group: 'actors', source: { image: 'one.png' }, replace: 'Typo.PNG' }), /找不到旧资源/);
  await catalog.register({ id: 'one', group: 'actors', source: { image: 'one.png' } });
  assert.throws(() => catalog.register({ id: 'one', group: 'actors', source: { image: 'one.png' } }), /重复 id/);
});

test('旧图集异步注册后的名称碰撞仍被拒绝，不让加载顺序掩盖显式 replace 要求', async () => {
  const harness = imageHarness();
  const image = new EventTarget();
  let loaded = false;
  const entries = {};
  const legacy = { image, isLoaded: () => loaded, getSprite: name => entries[name] };
  const catalog = createAssetCatalog({ legacyGroups: { actors: legacy }, imageFactory: harness.imageFactory });
  const operation = catalog.register({ id: 'Old.PNG', group: 'actors', source: { image: 'one.png' } });
  entries['Old.PNG'] = { name: 'Old.PNG' };
  loaded = true;
  image.dispatchEvent(new Event('load'));
  await assert.rejects(operation, /显式使用 replace/);
  assert.equal(catalog.group('actors').getSprite('Old.PNG'), entries['Old.PNG']);
});

test('未指定组时从旧 sheet 身份解析物品/地形热替换，显式组不能跨组串图', async () => {
  const harness = imageHarness();
  const items = legacyGroup();
  items.original.spriteSheet = items;
  const catalog = createAssetCatalog({ legacyGroups: { items }, imageFactory: harness.imageFactory });
  const replacement = await catalog.register({ id: 'item.gold', group: 'items', replace: 'Old.PNG', source: { image: 'gold.png' } });
  assert.equal(catalog.resolve(items.original), replacement);
  assert.equal(catalog.resolve(items.original, 'actors'), items.original);
  assert.equal(catalog.resolve(replacement), replacement);
  assert.equal(catalog.resolve(replacement, 'terrain'), replacement);
});

test('角色与地形共用接地点，紧裁地板默认中心锚点，树木默认底部锚点', async () => {
  const harness = imageHarness({ 'floor.png': [54, 26], 'tree.png': [96, 160] });
  const catalog = createAssetCatalog({ imageFactory: harness.imageFactory });
  const floor = await catalog.register({ id: 'tile.floor', group: 'terrain', layer: 'ground', source: { image: 'floor.png' } });
  const tree = await catalog.register({ id: 'prop.tree', group: 'terrain', source: { image: 'tree.png' } });
  assert.deepEqual(floor.frame.origin, { x: 27, y: 40 });
  assert.deepEqual(floor.frame.anchor, { x: 27, y: 13 });
  assert.equal(floor.frame.origin.y - floor.frame.anchor.y, 27);
  assert.deepEqual(tree.frame.origin, { x: 27, y: 40 });
  assert.deepEqual(tree.frame.anchor, { x: 48, y: 160 });
  assert.deepEqual(catalog.getVisualExtent('terrain'), { left: -21, right: 75, top: -120, bottom: 54 });
  assert.deepEqual(catalog.getVisualExtent('actors'), { left: 0, right: 54, top: 0, bottom: 54 });
});

async function importFixture(t) {
  const base = await mkdtemp(path.join(os.tmpdir(), 'c2-assets-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const root = path.join(base, 'project');
  const directory = path.join(root, 'assets', 'slime');
  await mkdir(directory, { recursive: true });
  await mkdir(path.join(root, 'src', 'data'), { recursive: true });
  const svg = (width, height) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"/>`;
  await writeFile(path.join(directory, 'idle_01.svg'), svg(64, 96));
  await writeFile(path.join(directory, 'idle_10.svg'), svg(128, 64));
  await writeFile(path.join(directory, 'idle_02.svg'), svg(80, 100));
  const manifest = path.join(directory, 'asset.json');
  const definition = { id: 'monster.slime', group: 'actors', fps: 6 };
  await writeFile(manifest, JSON.stringify(definition));
  return { base, root, directory, manifest, definition, svg };
}

test('导入独图按编号排序，生成确定性静态清单；检测清单过期和禁用示例', async t => {
  const fixture = await importFixture(t);
  const [definition] = await loadAssetDefinitions(fixture.root);
  assert.deepEqual(definition.clips.idle.frames, ['idle_01', 'idle_02', 'idle_10']);
  assert.equal(definition.clips.idle.fps, 6);
  assert.deepEqual(definition.frames.idle_02.source, { image: 'assets/slime/idle_02.svg', rect: { x: 0, y: 0, width: 80, height: 100 } });
  await importAssets({ root: fixture.root });
  await importAssets({ root: fixture.root, check: true });
  const generated = await readFile(path.join(fixture.root, 'src/data/assets.generated.js'), 'utf8');
  assert.match(generated, /monster.slime/);
  await writeFile(fixture.manifest, JSON.stringify({ ...fixture.definition, enabled: false }));
  assert.deepEqual(await loadAssetDefinitions(fixture.root), []);
  assert.equal((await loadAssetDefinitions(fixture.root, { includeDisabled: true })).length, 1);
  await assert.rejects(importAssets({ root: fixture.root, check: true }), /不一致/);
});

test('导入器拒绝资源路径越界、越界 rect、重复 alias、未显式替换和未知自动帧状态', async t => {
  const fixture = await importFixture(t);
  await writeFile(path.join(fixture.base, 'outside.svg'), fixture.svg(40, 80));
  await writeFile(fixture.manifest, JSON.stringify({ id: 'bad', group: 'actors', source: { image: '../../../outside.svg' } }));
  await assert.rejects(loadAssetDefinitions(fixture.root), /越出项目目录/);
  await writeFile(fixture.manifest, JSON.stringify({ id: 'bad', group: 'actors', source: { image: 'idle_01.svg', rect: { x: 60, y: 0, width: 64, height: 96 } } }));
  await assert.rejects(loadAssetDefinitions(fixture.root), /裁切区域超出/);
  await writeFile(fixture.manifest, JSON.stringify([{ id: 'a', group: 'actors', aliases: ['duplicate'], source: { image: 'idle_01.svg' } }, { id: 'b', group: 'actors', aliases: ['duplicate'], source: { image: 'idle_02.svg' } }]));
  await assert.rejects(loadAssetDefinitions(fixture.root), /重复 alias/);
  await writeFile(fixture.manifest, JSON.stringify({ id: 'HumanFighter2.PNG', group: 'actors', source: { image: 'idle_01.svg' } }));
  await assert.rejects(loadAssetDefinitions(fixture.root), /显式声明 replace/);
  await writeFile(fixture.manifest, JSON.stringify({ ...fixture.definition, anchorTypo: { x: 1, y: 2 } }));
  await assert.rejects(loadAssetDefinitions(fixture.root), /未知配置字段 anchorTypo/);
  await writeFile(fixture.manifest, JSON.stringify(fixture.definition));
  await writeFile(path.join(fixture.directory, 'wlak_01.svg'), fixture.svg(20, 20));
  await assert.rejects(loadAssetDefinitions(fixture.root), /已知动画状态/);
});

test('SVG viewBox 不是 Image 像素尺寸，缺少显式画布大小拒绝导入避免静默裁掉图像', async t => {
  const fixture = await importFixture(t);
  const file = path.join(fixture.directory, 'idle_01.svg');
  await writeFile(file, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96"/>');
  await assert.rejects(readImageSize(file), /显式写出像素 width\/height/);
});

test('项目 disabled 独图示例具有真实尺寸和多帧，PNG 原图可读取尺寸', async () => {
  const project = path.resolve(import.meta.dirname, '../..');
  const definitions = await loadAssetDefinitions(project, { includeDisabled: true });
  const slime = definitions.find(definition => definition.id === 'example.slime');
  assert.deepEqual(slime.frames.idle_01.source.rect, { x: 0, y: 0, width: 64, height: 96 });
  assert.equal(slime.clips.walk.frames.length, 2);
  const png = await readImageSize(path.join(project, 'spritesheet/monsters.png'));
  assert.ok(png.width > 1000 && png.height > 1000);
});
