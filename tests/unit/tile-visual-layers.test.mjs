// tile 显示层（数据驱动）：
//   1. 固定层的**顺序与绘制通道**是数据（TILE_VISUAL_SLOTS），不是散在渲染代码里的三段；
//   2. 访问器的晚解析语义（assetId -> 目录取资源，找不到再用 fallback）必须与旧实现一致；
//   3. 动态层 tile.visualLayers 追加在固定层之后，用于家具/屋顶/前景，且不进存档。
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DUNGEON_TILE_VISUAL_SLOTS,
  TILE_LAYER_MODES,
  WORLD_TILE_VISUAL_SLOTS,
  addTileVisualLayer,
  installTileVisualAccessors,
  tileVisualCalls
} from '../../src/engine/modules/world/tile-visuals.js';

test('固定层的顺序与通道是数据（世界 2 层 / 地牢 3 层）', () => {
  assert.deepEqual(WORLD_TILE_VISUAL_SLOTS.map((s) => [s.entity, s.mode]), [
    ['backgroundSprite', 'ground'],
    ['decorationSprite', 'scenery']
  ]);
  assert.deepEqual(DUNGEON_TILE_VISUAL_SLOTS.map((s) => [s.entity, s.mode]), [
    ['backgroundSprite', 'ground'],
    ['decorationSprite', 'scenery'],
    ['cachedBackgroundSprite', 'sceneryRaised']
  ]);
  assert.deepEqual([...TILE_LAYER_MODES], ['ground', 'scenery', 'sceneryRaised']);
});

test('tileVisualCalls 按固定层顺序发出调用，空层被跳过', () => {
  const resolve = (v) => v || null;
  const tile = { backgroundSprite: 'BG', decorationSprite: null, cachedBackgroundSprite: 'WALL' };
  assert.deepEqual(tileVisualCalls(tile, WORLD_TILE_VISUAL_SLOTS, resolve).map((c) => [c.mode, c.sprite]), [
    ['ground', 'BG']
  ]);
  // 地牢：地板 + 墙（贴墙底图），decoration 为空被跳过，顺序仍是 ground -> sceneryRaised
  assert.deepEqual(tileVisualCalls(tile, DUNGEON_TILE_VISUAL_SLOTS, resolve).map((c) => [c.mode, c.sprite]), [
    ['ground', 'BG'],
    ['sceneryRaised', 'WALL']
  ]);
});

test('动态层追加在固定层之后（家具/屋顶/前景），通道可指定', () => {
  const tile = { backgroundSprite: 'BG' };
  addTileVisualLayer(tile, 'village.hay', 'scenery');
  addTileVisualLayer(tile, 'village.roof', 'sceneryRaised');
  const resolve = (v) => v || null;
  assert.deepEqual(tileVisualCalls(tile, WORLD_TILE_VISUAL_SLOTS, resolve).map((c) => [c.mode, c.sprite]), [
    ['ground', 'BG'],
    ['scenery', 'village.hay'],
    ['sceneryRaised', 'village.roof']
  ]);
  // 动态层默认通道为 scenery
  const only = {};
  addTileVisualLayer(only, 'x');
  assert.equal(only.visualLayers[0].mode, 'scenery');
});

test('addTileVisualLayer 拒绝未知通道', () => {
  assert.throws(() => addTileVisualLayer({}, 'x', 'bogus'), /未知 tile 显示层通道/);
});

test('访问器：assetId 经目录晚解析，未注册时用 fallback（与旧语义一致）', () => {
  function Tile() { this.backgroundAssetId = null; }
  const registry = new Map([['L1_Terrain014.PNG', { id: 'L1_Terrain014.PNG' }]]);
  const provider = () => ({ getSprite: (key) => registry.get(key) });
  installTileVisualAccessors(Tile.prototype, provider, WORLD_TILE_VISUAL_SLOTS);

  const tile = new Tile();
  // 字符串：记 id，读取时经目录解析
  tile.backgroundSprite = 'L1_Terrain014.PNG';
  assert.deepEqual(tile.backgroundSprite, { id: 'L1_Terrain014.PNG' });
  // 未注册的字符串：读取返回 null（不是抛错）
  tile.backgroundSprite = 'Nope.PNG';
  assert.equal(tile.backgroundSprite, null);
  // 非字符串对象：若目录里没有同名资源，则作为 fallback 原样返回（既有工具依赖这条）
  const mock = { name: 'MockSprite' };
  tile.backgroundSprite = mock;
  assert.equal(tile.backgroundSprite, mock);
});
