import test from 'node:test';
import assert from 'node:assert/strict';
import { projectActor, projectLegacyTile, projectLegacyPosition, projectMap, unprojectMap, visibleTileBounds, visualDepthPosition } from '../../src/engine/modules/rendering/projection.js';
import { installTileVisualAccessors } from '../../src/engine/modules/world/tile-visuals.js';
import { DungeonLevel } from '../../src/engine/modules/world/generation.js';
import { DepthSortedRenderer, initializeRenderingScene, resetRenderCommand } from '../../src/engine/modules/rendering/scene.js';

test('地牢本体创建静态展示物件容器', () => {
  assert.deepEqual(new DungeonLevel().sceneObjects, []);
});

test('显式保留27×13地面与27×13.5角色的历史投影差异', () => {
  const camera = { tileColumn: 0, tileRow: 0, viewportOffsetX: 0, viewportOffsetY: 0 };
  assert.deepEqual(projectLegacyTile(1, 0, camera), { x: 397, y: 238 });
  assert.deepEqual(projectLegacyPosition(27, 0, camera), { x: 397, y: 238 });
  assert.deepEqual(projectActor(27, 0, 0, 0), { x: 397, y: 238.5 });
  assert.deepEqual(projectMap(27, 0, 0, 0), { x: 397, y: 238 });
});

test('地图正逆变换覆盖负坐标、小数相机和显示高度', () => {
  for (const [x, y, centerX, centerY, elevation] of [[-45.5, 91.25, 2.3, -12.8, 37], [3000, -1500, 1290, 97, 0], [0, 0, 0, 0, 0]]) {
    const screen = projectMap(x, y, centerX, centerY, elevation);
    const world = unprojectMap(screen.x, screen.y, centerX, centerY, elevation);
    assert.ok(Math.abs(world.x - x) < 1e-10);
    assert.ok(Math.abs(world.y - y) < 1e-10);
  }
});

test('候选窗包含基点在屏幕外而高大图片进入屏幕内的地块', () => {
  const centerX = 2700, centerY = 2700;
  const extent = { left: -64, top: -220, right: 64, bottom: 0 };
  const bounds = visibleTileBounds(centerX, centerY, extent);
  // 图片基点位于视口底部以下180px，但顶部仍进入画面。
  const origin = unprojectMap(370, 630, centerX, centerY);
  assert.ok(origin.x / 27 >= bounds.minColumn && origin.x / 27 <= bounds.maxColumn);
  assert.ok(origin.y / 27 >= bounds.minRow && origin.y / 27 <= bounds.maxRow);
  const baseline = visibleTileBounds(centerX, centerY, { left: 0, top: 0, right: 54, bottom: 54 });
  assert.ok(bounds.maxRow > baseline.maxRow && bounds.maxColumn > baseline.maxColumn);
});

test('遮挡按世界脚点与多格前沿计算，图片高度不改变深度', () => {
  const short = { size: { width: 64, height: 64 }, depthOffset: { x: 0, y: 0 }, footprint: { columns: 1, rows: 1 } };
  const tall = { ...short, size: { width: 64, height: 220 } };
  assert.deepEqual(visualDepthPosition(81, 108, short), visualDepthPosition(81, 108, tall));
  assert.deepEqual(visualDepthPosition(81, 108, { ...tall, depthOffset: { x: 3, y: 5 }, footprint: { columns: 2, rows: 3 } }), { x: 111, y: 167 });
});

test('真实命令排序允许人物从高墙后走到高墙前，同深度显式层只作平局规则', () => {
  initializeRenderingScene();
  const makeSprite = (name, layer, height) => ({ name, frame: {
    image: {}, source: { x: 0, y: 0, width: 64, height }, size: { width: 64, height },
    anchor: { x: 32, y: height }, origin: { x: 27, y: 26 }, offset: { x: 0, y: 0 },
    depthOffset: { x: 0, y: 0 }, footprint: { columns: 1, rows: 1 }, layer
  } });
  const wall = makeSprite('wall', 'scenery', 220), actor = makeSprite('actor', 'actor', 96);
  const order = (actorX, wallX = 150) => {
    const drawn = [];
    const renderer = new DepthSortedRenderer();
    renderer.context = {};
    renderer.presentation = { depthKey: (x, y) => -(x + y), drawSprite: (_context, sprite) => drawn.push(sprite.name) };
    renderer.drawSpriteDepth(wall, wallX, 50, 10, 10, 64, 0, 'scenery');
    renderer.drawSpriteDepth(actor, actorX, 50, 10, 10, 64, 0, 'actor');
    renderer.sortCommands();
    return drawn;
  };
  assert.deepEqual(order(100), ['actor', 'wall']);
  assert.deepEqual(order(200), ['wall', 'actor']);
  assert.deepEqual(order(150), ['wall', 'actor']);
  // overlay依然尊重世界深度，名称并不表示强制全局在最前面。
  actor.frame.layer = 'overlay';
  assert.deepEqual(order(100), ['actor', 'wall']);
  const renderer = new DepthSortedRenderer();
  const drawn = [];
  renderer.context = {};
  renderer.presentation = { depthKey: (x, y) => -(x + y), drawSprite: (_context, sprite) => drawn.push(sprite.name) };
  renderer.drawSpriteDepth(wall, 0, 0, 10, 10, 64, 0);
  renderer.drawSpriteDepth(actor, 0, 0, 10, 10, 64, 0);
  renderer.drawSpriteDepth(wall, 0, 0, 10, 10, 64, 0);
  renderer.commandIndex = 0;
  renderer.renderCommands.forEach(resetRenderCommand);
  renderer.drawSpriteDepth(actor, -100000, -100000, 10, 10, 64, 0);
  renderer.drawSpriteDepth(wall, -110000, -100000, 10, 10, 64, 0);
  renderer.sortCommands();
  assert.deepEqual(drawn, ['wall', 'actor'], '活动命令不能被空命令的1e5哨兵挤出绘制范围');
});

test('旧tile Sprite接口存储ID并在替换素材后立即解析新对象', () => {
  const first = { name: 'terrain.wall.stone', frame: { size: { width: 54, height: 54 } } };
  const second = { name: first.name, frame: { size: { width: 90, height: 160 } } };
  const sprites = new Map([[first.name, first]]);
  class Tile {}
  installTileVisualAccessors(Tile.prototype, () => ({ getSprite: id => sprites.get(id) }), [{ entity: 'decorationSprite', idField: 'decorationAssetId', mode: 'scenery' }]);
  const tile = new Tile();
  tile.decorationSprite = first;
  assert.equal(tile.decorationAssetId, first.name);
  assert.equal(tile.decorationSprite, first);
  sprites.set(first.name, second);
  assert.equal(tile.decorationSprite, second);
  tile.decorationSprite = null;
  assert.equal(tile.decorationAssetId, null);
  assert.equal(tile.decorationSprite, null);
});
