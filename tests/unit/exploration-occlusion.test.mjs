import test from 'node:test';
import assert from 'node:assert/strict';
import { orderSceneCommands } from '../../src/engine/exploration/occlusion.js';
import { generateForestVillage } from '../../src/engine/exploration/forest-village.js';

const frame = { size: { width: 270, height: 200 }, anchor: { x: 135, y: 150 }, origin: { x: 0, y: 0 }, offset: { x: 0, y: 0 } };
const building = { id: 'house', frame, x: 0, y: 0, worldX: 2, worldY: 2, depth: 216, occlusionBounds: { left: -.5, top: -.5, right: 4.5, bottom: 4.5 } };
const actor = (x, y) => ({ id: 'actor', frame, x: 0, y: 0, worldX: x, worldY: y, depth: (x + y) * 27 });

test('多格建筑遮挡：两个前门方向的人都在建筑前，即使 x+y 小于建筑最前角', () => {
  for (const point of [actor(5, 2), actor(2, 5)]) {
    assert.ok(point.depth < building.depth, '反例必须击穿仅按最前角排序的旧方案');
    assert.deepEqual(orderSceneCommands([point, building]).map(command => command.id), ['house', 'actor']);
  }
  for (const point of [actor(-1, 4), actor(4, -1)]) assert.deepEqual(orderSceneCommands([building, point]).map(command => command.id), ['actor', 'house']);
});

test('建筑预设：每栋只有一个完整外观，门朝向真实通行边，没有逐格铺斜屋顶', () => {
  const world = generateForestVillage('建筑-验收');
  assert.equal(world.buildings.length, 3);
  assert.equal(world.objects.filter(object => object.exterior).length, 3);
  assert.equal(world.objects.filter(object => object.roof).length, 0);
  assert.equal(new Set(world.objects.filter(object => object.exterior).map(object => object.visualId)).size, 3);
  for (const house of world.buildings) {
    const walls = world.objects.filter(object => object.building === house.id && object.interiorOnly);
    assert.equal(walls.filter(object => object.door).length, 1);
    assert.ok(walls.filter(object => object.cutaway).length > 0);
  }
  for (const cell of world.cells) {
    if (cell.kind === 'grass' && !cell.walkable && cell.x > 0 && cell.y > 0 && cell.x < world.width - 1 && cell.y < world.height - 1) {
      assert.ok(world.objects.some(object => object.x === cell.x && object.y === cell.y), `草地 ${cell.x},${cell.y} 不能凭空阻挡人物`);
    }
  }
});
