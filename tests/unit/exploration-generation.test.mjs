import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { generateForestVillage } from '../../src/engine/exploration/forest-village.js';
import { ExplorationSession } from '../../src/engine/exploration/session.js';
import { cellAt, cellKey, pathField } from '../../src/engine/exploration/navigation.js';

test('布局生成：500 个种子覆盖三种宏观布局，每种布局都有不同房屋位置与弯曲河流', () => {
  const layouts = new Map();
  for (let index = 0; index < 500; index++) {
    const world = generateForestVillage(`布局-${index}`);
    const variations = layouts.get(world.layout.id) || new Set();
    variations.add(JSON.stringify(world.buildings.map(house => [house.left, house.top]))); layouts.set(world.layout.id, variations);
    const water = world.cells.filter(cell => cell.kind === 'water');
    assert.ok(new Set(water.map(cell => cell.x)).size > 2, '河流不能仍是两格直带');
    for (const house of world.buildings) {
      assert.ok(house.left > 0 && house.top > 0 && house.left + house.width < world.width && house.top + house.height < world.height);
      for (let y = house.top; y < house.top + house.height; y++) for (let x = house.left; x < house.left + house.width; x++) {
        assert.equal(cellAt(world, x, y).area, house.id, '建筑不能互相重叠或被河流覆盖');
      }
    }
  }
  assert.deepEqual([...layouts.keys()].sort(), ['riverside', 'two-banks', 'woodland']);
  assert.ok([...layouts.values()].every(variations => variations.size >= 10), '变化必须来自房屋布局，而不是只改变装饰');
});

test('道路生成：路径真实可走且相邻，100 个种子拆桥后仍有绕行，两桥全拆则隔断', () => {
  for (let index = 0; index < 100; index++) {
    const world = generateForestVillage(`道路-${index}`), key = cellKey(world.exit.x, world.exit.y);
    for (const road of world.roads) {
      for (let step = 0; step < road.cells.length; step++) {
        const cell = road.cells[step];
        assert.ok(cellAt(world, cell.x, cell.y).walkable, '道路不能穿过家具、墙壁、树干或水面');
        if (step) { const previous = road.cells[step - 1]; assert.equal(Math.abs(cell.x - previous.x) + Math.abs(cell.y - previous.y), 1); }
      }
    }
    for (const crossing of world.crossings) {
      for (const cell of crossing.cells) cellAt(world, cell.x, cell.y).walkable = false;
      assert.ok(pathField(world, world.entrance).distances.has(key), '另一座桥必须承担实际绕行');
      for (const cell of crossing.cells) cellAt(world, cell.x, cell.y).walkable = true;
    }
    for (const crossing of world.crossings) for (const cell of crossing.cells) cellAt(world, cell.x, cell.y).walkable = false;
    assert.ok(!pathField(world, world.entrance).distances.has(key), '弯折处不能出现隐形过河口');
  }
});

test('存档兼容：版本 2 地图与升级前完整指纹一致，续跑不改变地图和路线', () => {
  const hashes = { '旧村-01': '83bc2237f4106b25f941abf279599bbee04defaf6ef3a99c1cea0084d7b657ad',
    '旧村-存档': '1ab0fa18fef0080f546c4ad6873984ab22024346ad6fc371797680213fed4d87' };
  for (const [seed, hash] of Object.entries(hashes)) {
    assert.equal(createHash('sha256').update(JSON.stringify(generateForestVillage(seed, 2))).digest('hex'), hash);
    const old = new ExplorationSession(seed, 4, { generatorVersion: 2 });
    for (let step = 0; step < 250; step++) old.tick(240);
    old.tick(120);
    const restored = ExplorationSession.restore(JSON.parse(JSON.stringify(old.serialize())), 4);
    assert.deepEqual(restored.world, old.world); assert.equal(restored.serialize().generatorVersion, 2);
    for (let step = 0; step < 100; step++) { old.tick(120); restored.tick(120); assert.deepEqual(restored.serialize(), old.serialize()); }
  }
  assert.throws(() => generateForestVillage('不支持', 4));
});
