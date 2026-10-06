import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createNaturalTerrain } from '../../src/engine/exploration/natural-terrain.js';
import { NaturalWorld } from '../../src/engine/exploration/natural-world.js';
import { OpenWorldSession, OPEN_WORLD_SAVE_KEY } from '../../src/engine/exploration/open-world-session.js';
import { TileHistory } from '../../src/engine/exploration/tile-history.js';
import { cellAt, cellKey, neighbors } from '../../src/engine/exploration/navigation.js';
import { buildGroundPatches } from '../../src/engine/exploration/terrain-contours.js';
import { generateForestVillage } from '../../src/engine/exploration/forest-village.js';

test('自然世界：不同访问顺序、负坐标及缓存淘汰后，整个区块仍逐字相同', () => {
  const first = new NaturalWorld('跨界'), second = new NaturalWorld('跨界');
  const original = JSON.stringify(first.getChunk(-1, 0));
  for (const [x, y] of [[0, 0], [-2, 0], [-1, 1], [-1, -1]]) second.getChunk(x, y);
  assert.equal(JSON.stringify(second.getChunk(-1, 0)), original);
  for (let index = 1; index < 30; index++) first.getChunk(index, -2);
  assert.equal(first.chunks.size, 25); assert.ok(!first.chunks.has('-1,0'));
  assert.equal(JSON.stringify(first.getChunk(-1, 0)), original);
  assert.notEqual(JSON.stringify(new NaturalWorld('另一片').getChunk(-1, 0)), original);
});

test('自然地貌：跨零点和区块边界连续采样，远处出现多种生境和自然水域', () => {
  const terrain = createNaturalTerrain('原野-01'), kinds = new Set();
  for (let y = -192; y <= 192; y += 4) for (let x = -192; x <= 192; x += 4) kinds.add(terrain.sample(x, y).kind);
  for (const kind of ['grass', 'meadow', 'highland', 'wetland', 'water', 'bank']) assert.ok(kinds.has(kind), kind);
  for (const x of [-33, -32, -1, 0, 31, 32, 63, 64]) {
    const left = terrain.field(x, 17), right = terrain.field(x + 1, 17);
    assert.ok(Math.abs(left.height - right.height) < .05, `边界跳变 ${x}`);
    assert.ok(Math.abs(left.moisture - right.moisture) < .05);
  }
  const generator = new NaturalWorld('原野-01');
  for (const [x, y] of [[-1, -1], [0, 0], [31, 32], [32, 31]]) {
    const cell = generator.getCell(x, y), sample = terrain.sample(x, y);
    assert.equal(cell.height, sample.height); assert.equal(cell.moisture, sample.moisture); assert.equal(cell.water, sample.water);
  }
});

test('自然建筑：选址保持干燥、占地不重叠，不同区域数量与类型来自环境', () => {
  const generator = new NaturalWorld('原野-01'), counts = new Set(), types = new Set();
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
    const chunk = generator.getChunk(x, y);
    counts.add(chunk.points.length);
    for (const building of chunk.buildings) {
      types.add(building.preset);
      for (let row = building.top; row < building.top + building.height; row++) for (let column = building.left; column < building.left + building.width; column++) {
        assert.ok(!generator.terrain.field(column, row).water, '房屋不能填河');
        const cell = generator.getCell(column, row);
        assert.equal(cell.area, building.id);
      }
      assert.ok(generator.getCell(building.approach.x, building.approach.y).walkable, '门外不能被树封堵');
      const point = generator.resolvePoint(building.id);
      assert.ok(point && generator.getCell(point.x, point.y).walkable);
    }
  }
  assert.ok(counts.has(0) && counts.size >= 3, '不能每个区域固定三栋房屋');
  assert.deepEqual([...types].sort(), ['herbalist', 'storehouse', 'workshop']);
});

test('自然道路与桥：桥仅跨短水段，道路不穿房屋，区块接缝与相邻步一致', () => {
  const generator = new NaturalWorld('桥接验证'); let bridgeCount = 0, roadCount = 0;
  for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
    const chunk = generator.getChunk(x, y);
    for (const crossing of chunk.crossings) {
      assert.ok(crossing.cells.length > 0 && crossing.cells.length <= 4); bridgeCount++;
      assert.ok(!generator.terrain.field(crossing.start.x, crossing.start.y).water);
      assert.ok(!generator.terrain.field(crossing.end.x, crossing.end.y).water);
      for (const cell of crossing.cells) { assert.ok(generator.terrain.field(cell.x, cell.y).water); assert.equal(generator.getCell(cell.x, cell.y).kind, 'bridge'); }
    }
    for (const road of chunk.roads) {
      roadCount++;
      road.cells.forEach((cell, index) => {
        assert.ok(generator.getCell(cell.x, cell.y).walkable, '道路不能被区块边缘截断或穿墙');
        if (index) assert.equal(Math.abs(cell.x - road.cells[index - 1].x) + Math.abs(cell.y - road.cells[index - 1].y), 1);
      });
    }
  }
  assert.ok(bridgeCount > 0 && roadCount > 0);
});

test('活动窗口：全局负坐标导航不串行，过边界不读下一行，轮廓使用世界坐标', () => {
  const generator = new NaturalWorld('原野-01'), world = generator.ensureAround({ x: -1, y: -1 });
  assert.equal(world.originX, -64); assert.equal(world.originY, -64);
  assert.equal(cellAt(world, world.originX + world.width, world.originY), undefined);
  assert.equal(cellAt(world, world.originX - 1, world.originY + 1), undefined);
  for (const [x, y] of neighbors(world, -1, -1)) assert.ok(Math.abs(x + 1) + Math.abs(y + 1) === 1 && cellAt(world, x, y).walkable);
  const known = new Set(world.cells.map(cell => cellKey(cell.x, cell.y)));
  const patches = buildGroundPatches(world, known, new Set(), [{ kind: 'water', members: ['water'] }], { left: -50, top: -50, right: -40, bottom: -40 });
  assert.ok(patches.every(patch => patch.x >= -50 && patch.x < -40 && patch.y >= -50 && patch.y < -40));
});

test('探索历史：负坐标区块位图精确往返，重复格不膨胀，错误编码和重复区块拒绝', () => {
  const history = new TileHistory();
  for (let y = -32; y < 32; y++) for (let x = -32; x < 32; x++) history.add(cellKey(x, y)).add(cellKey(x, y));
  assert.equal(history.size, 4096); assert.equal(history.chunks.size, 4);
  const records = history.serialize(), restored = TileHistory.restore(records);
  assert.deepEqual([...restored].sort(), [...history].sort()); assert.ok(JSON.stringify(records).length < 1000);
  assert.throws(() => TileHistory.restore([...records, records[0]]));
  assert.throws(() => TileHistory.restore([{ ...records[0], bits: 'x' }]));
  assert.throws(() => history.add('0,1,2')); assert.throws(() => history.add('1000001,0'));
});

test('连续自动探索：两个种子实际跨区块，队员沿可走格跟随，不存在全世界完成状态', () => {
  for (const seed of ['原野-01', '原野-验证']) {
    const session = new OpenWorldSession(seed), positions = new Set();
    for (let index = 0; index < 1000; index++) {
      const previous = session.members.map(member => ({ ...member })); session.tick(240);
      session.members.forEach((member, offset) => {
        assert.ok(Math.abs(member.x - previous[offset].x) + Math.abs(member.y - previous[offset].y) <= 1);
        assert.ok(cellAt(session.world, member.x, member.y).walkable, '不能穿墙、穿树或潜水');
      });
      positions.add(`${session.world.chunkX},${session.world.chunkY}`);
    }
    assert.ok(positions.size >= 4, `没有持续扩展 ${seed}`);
    assert.ok(session.generator.generated.size > 9); assert.ok(session.generator.chunks.size <= 25);
    assert.equal(session.complete, false); assert.ok(session.discovered.size > 1000);
  }
});

test('世界存档：半步刷新和跨区块续跑严格一致，暂停时保持位置和进度', () => {
  assert.equal(OPEN_WORLD_SAVE_KEY, 'C2_OPEN_WORLD_V1');
  const session = new OpenWorldSession('原野-01');
  for (let index = 0; index < 700; index++) session.tick(240);
  session.tick(120);
  const restored = OpenWorldSession.restore(JSON.parse(JSON.stringify(session.serialize())));
  assert.deepEqual(restored.serialize(), session.serialize());
  for (let index = 0; index < 120; index++) { restored.tick(120); session.tick(120); assert.deepEqual(restored.serialize(), session.serialize()); }
  restored.paused = true; const before = restored.serialize(); restored.tick(1000, 12); assert.deepEqual(restored.serialize(), before);
});

test('世界存档：伪造版本、跳步、越界、目标、地点、位图与时钟均拒绝，旧 v3 指纹保持', () => {
  const session = new OpenWorldSession('原野-01'); for (let index = 0; index < 120; index++) session.tick(240);
  const good = session.serialize();
  for (const save of [null, {}, { ...good, generatorVersion: 2 }, { ...good, members: [{ x: 1000000, y: 0 }] },
    { ...good, path: [{ x: 500, y: 500 }] }, { ...good, target: { x: 50, y: 50 } }, { ...good, timeMs: -1 },
    { ...good, completedPoints: ['structure:0,0'] }, { ...good, knownPoints: ['structure:999999999,0'] },
    { ...good, visited: [] }, { ...good, waiting: true }, { ...good, generated: [] }, { ...good, generated: ['invalid'] }, { ...good, discovered: [{ chunkX: 0, chunkY: 0, bits: 'bad' }] }]) assert.throws(() => OpenWorldSession.restore(save));
  const hashes = { '旧村-01': '6deeb8792c0c7fa8e5d96bf11f42cfe0612842a0b59432c28a00eee6d8604ae3',
    '旧村-存档': 'e6ba8e98f15aceae704fcfe3a8876fe2c06efca892b099b5d86dd95bcaa1bf95' };
  for (const [seed, hash] of Object.entries(hashes)) assert.equal(createHash('sha256').update(JSON.stringify(generateForestVillage(seed, 3))).digest('hex'), hash);
});
