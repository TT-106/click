import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { generateForestVillage, GENERATOR_VERSION } from '../../src/engine/exploration/forest-village.js';
import { cellAt, cellKey, neighbors, pathField, pathFrom } from '../../src/engine/exploration/navigation.js';
import { ExplorationSession, EXPLORATION_SAVE_KEY } from '../../src/engine/exploration/session.js';

const SEEDS = Array.from({ length: 100 }, (_, index) => `旧村-${String(index).padStart(2, '0')}`);
// 自动探索每步都做一次可见性搜索，成本远高于生成；用前 50 个种子取样，其余由生成器不变量覆盖。
const EXPLORE_SEEDS = SEEDS.slice(0, 50);
const reachableSet = (world) => new Set(world.reachable);

test('生成器：100 个固定种子的兴趣点、出口与房屋入口全部可达，且每栋房屋有内部空间', () => {
  for (const seed of SEEDS) {
    const world = generateForestVillage(seed);
    const reachable = reachableSet(world);
    assert.equal(world.generatorVersion, GENERATOR_VERSION, `${seed}: 生成器版本`);
    assert.ok(reachable.has(cellKey(world.entrance.x, world.entrance.y)), `${seed}: 入口不可达`);
    assert.ok(reachable.has(cellKey(world.exit.x, world.exit.y)), `${seed}: 出口不可达`);
    assert.ok(world.points.length >= 5, `${seed}: 兴趣点过少`);
    for (const point of world.points) assert.ok(reachable.has(cellKey(point.x, point.y)), `${seed}: 兴趣点不可达 ${point.label}`);
    for (const building of world.buildings) {
      assert.ok(reachable.has(cellKey(building.door.x, building.door.y)), `${seed}: 门被封堵 ${building.id}`);
      let interior = 0;
      for (let y = building.top + 1; y < building.top + building.height - 1; y++)
        for (let x = building.left + 1; x < building.left + building.width - 1; x++)
          if (reachable.has(cellKey(x, y))) interior++;
      assert.ok(interior >= 1, `${seed}: 房屋无内部可达空间 ${building.id}`);
    }
  }
});

test('生成器：同一只种子逐字复现，不同种子产生不同建筑布局', () => {
  const first = generateForestVillage('旧村-复现');
  const second = generateForestVillage('旧村-复现');
  assert.deepEqual(first.cells, second.cells);
  assert.deepEqual(first.objects, second.objects);
  assert.deepEqual(first.buildings, second.buildings);
  assert.notDeepEqual(generateForestVillage('旧村-甲').objects, generateForestVillage('旧村-乙').objects);
});

test('生成器：环路存在——切断任一桥，广场一侧仍能经由另一座桥到达北侧出口', () => {
  const world = generateForestVillage('旧村-环路');
  const reachable = reachableSet(world);
  assert.ok(reachable.has(cellKey(world.exit.x, world.exit.y)));
  // 河流只有两处桥；断言两处桥都承载通行，说明骨架不是单链。
  const bridges = world.cells.filter(cell => cell.kind === 'bridge' && cell.walkable);
  assert.equal(bridges.length, 8, '应为两处 2×2 桥面');
  const rows = [...new Set(bridges.map(cell => cell.y))].sort((a, b) => a - b);
  const clusters = rows.filter((row, index) => index === 0 || row - rows[index - 1] > 1);
  assert.equal(clusters.length, 2, '应存在两处彼此分离的过河点');
  for (const crossing of world.crossings) {
    for (const cell of crossing.cells) cellAt(world, cell.x, cell.y).walkable = false;
    assert.ok(pathField(world, world.entrance).distances.has(cellKey(world.exit.x, world.exit.y)), '拆掉一座桥仍应能经另一座桥绕行');
    for (const cell of crossing.cells) cellAt(world, cell.x, cell.y).walkable = true;
  }
  for (const crossing of world.crossings) for (const cell of crossing.cells) cellAt(world, cell.x, cell.y).walkable = false;
  assert.ok(!pathField(world, world.entrance).distances.has(cellKey(world.exit.x, world.exit.y)), '拆掉两座桥后必须被河流隔断，不能从河底或地图边界绕过');
});

test('导航：BFS 距离与回溯路径一致，路径每步都是可走邻格', () => {
  const world = generateForestVillage('旧村-导航');
  const field = pathField(world, world.entrance);
  const target = world.points.find(point => point.id === 'ruins');
  assert.ok(field.distances.has(cellKey(target.x, target.y)), '遗迹应可达');
  const path = pathFrom(field, target);
  assert.equal(path.length, field.distances.get(cellKey(target.x, target.y)), '路径长度应等于实际步数');
  let cursor = { ...world.entrance };
  for (const step of path) {
    const adjacent = neighbors(world, cursor.x, cursor.y).some(([x, y]) => x === step.x && y === step.y);
    assert.ok(adjacent, `路径出现非相邻步 ${JSON.stringify(step)}`);
    cursor = step;
  }
  assert.deepEqual(cursor, { x: target.x, y: target.y }, '路径应终止于目标');
});

test('导航：目标不在搜索域内时返回空路径，而不是硬走直线', () => {
  const world = generateForestVillage('旧村-越界');
  const field = pathField(world, world.entrance);
  assert.deepEqual(pathFrom(field, { x: 0, y: 0 }), []);
  assert.deepEqual(pathFrom(field, { x: -5, y: 3 }), []);
});

test('自动探索：50 个取样种子都能探明可达区域并发现全部兴趣点', () => {
  for (const seed of EXPLORE_SEEDS) {
    const session = new ExplorationSession(seed, 4);
    let steps = 0;
    while (!session.complete && steps < 5000) { session.tick(240); steps++; }
    const snapshot = session.snapshot();
    assert.ok(session.complete, `${seed}: 探索未完成（${steps} 步，${snapshot.discovered}/${snapshot.total}）`);
    assert.equal(snapshot.points, snapshot.pointTotal, `${seed}: 兴趣点未全部发现`);
    assert.equal(snapshot.discovered, snapshot.total, `${seed}: 未走遍可达区域`);
    for (const member of session.members) assert.ok(reachableSet(session.world).has(cellKey(member.x, member.y)), `${seed}: 队员走到不可达格`);
  }
});

test('自动探索：队员逐格跟随，从不产生对角跳跃', () => {
  const session = new ExplorationSession('旧村-跟随', 4);
  let previous = session.members.map(member => ({ ...member }));
  for (let step = 0; step < 400 && !session.complete; step++) {
    session.tick(240);
    session.members.forEach((member, index) => {
      const before = previous[index];
      assert.ok(Math.abs(member.x - before.x) + Math.abs(member.y - before.y) <= 1, `第 ${index} 名队员发生跨格移动`);
    });
    previous = session.members.map(member => ({ ...member }));
  }
});

test('自动探索：隔墙的孤立兴趣点不会被追，探索仍能完成', () => {
  const width = 10, height = 8;
  const cells = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      cells.push({ x, y, kind: x === 5 ? 'wall' : 'grass', walkable: x !== 5, area: 'outside', elevation: 0 });
  const world = {
    seed: '隔离测试', generatorVersion: GENERATOR_VERSION, width, height, cells,
    objects: [], buildings: [],
    points: [{ id: 'near', label: '近处', x: 2, y: 2 }, { id: 'island', label: '孤岛', x: 7, y: 3 }],
    entrance: { x: 1, y: 1 }, exit: { x: 1, y: 1 },
  };
  const field = pathField(world, world.entrance);
  world.reachable = [...field.distances.keys()];
  assert.ok(!field.distances.has(cellKey(7, 3)), '前提：孤岛必须不可达');

  const session = new ExplorationSession('旧村-隔离', 2);
  session.world = world; session.members = [{ x: 1, y: 1 }, { x: 1, y: 1 }];
  session.discovered = new Set(); session.visited = new Set(); session.completedPoints = new Set();
  session.path = []; session.target = null; session.trail = []; session.complete = false;
  session.reveal();
  let steps = 0;
  while (!session.complete && steps < 3000) {
    session.tick(240); steps++;
    assert.notEqual(session.target?.id, 'island', '不应把隔墙目标设为探索目标');
    assert.ok(session.members.every(member => field.distances.has(cellKey(member.x, member.y))), '队员不应越过墙');
  }
  const snapshot = session.snapshot();
  assert.ok(session.complete, '隔离地图仍应探索完成');
  assert.equal(snapshot.points, 1, '只应发现可达兴趣点');
  assert.ok(snapshot.discovered <= world.reachable.length, '发现格不应超过可达格');
});

test('存档：序列化往返保持队伍、发现与进度，键名稳定', () => {
  assert.equal(EXPLORATION_SAVE_KEY, 'C2_FOREST_VILLAGE_V1');
  const session = new ExplorationSession('旧村-存档', 4);
  for (let step = 0; step < 250; step++) session.tick(240);
  const save = session.serialize();
  assert.equal(save.generatorVersion, GENERATOR_VERSION);
  assert.deepEqual(Object.keys(save).sort(), ['completedPoints', 'discovered', 'generatorVersion', 'members', 'path', 'paused', 'progress', 'seed', 'target', 'timeMs', 'visited']);
  const restored = ExplorationSession.restore(JSON.parse(JSON.stringify(save)), 4);
  assert.deepEqual(restored.members, session.members);
  assert.deepEqual([...restored.discovered].sort(), [...session.discovered].sort());
  assert.deepEqual([...restored.completedPoints].sort(), [...session.completedPoints].sort());
  assert.equal(restored.timeMs, session.timeMs);
  // 刷新后必须保持跟随阵型：队员站位就是领队走过路径，trail[i-1] 必须等于 members[i]。
  assert.deepEqual(restored.trail, session.members.slice(1).map(member => ({ x: member.x, y: member.y })), '恢复后跟随队列应重建');
  // 恢复后继续推进应与原会话同步。
  restored.tick(240); session.tick(240);
  assert.deepEqual(restored.members, session.members);
});

test('存档：版本、种子、越界、伪造兴趣点与非法时钟一律拒绝', () => {
  const session = new ExplorationSession('旧村-校验', 4);
  for (let step = 0; step < 120; step++) session.tick(240);
  const good = session.serialize();
  const rejected = [
    null,
    undefined,
    {},
    { ...good, generatorVersion: 999 },
    { ...good, seed: '' },
    { ...good, seed: 'x'.repeat(65) },
    { ...good, members: [] },
    { ...good, members: [{ x: -1, y: -1 }] },
    { ...good, members: [{ x: 999, y: 999 }] },
    { ...good, visited: ['999,999'] },
    { ...good, discovered: ['1,1,1'] },
    { ...good, discovered: [1] },
    { ...good, completedPoints: ['不存在的地点'] },
    { ...good, paused: 'yes' },
    { ...good, timeMs: -1 },
    { ...good, progress: -1 },
    { ...good, path: [{ x: 0, y: 0 }] },
    { ...good, target: { x: 999, y: 999 } },
  ];
  for (const sample of rejected) {
    assert.throws(() => ExplorationSession.restore(sample, 4), `恶意存档未被拒绝: ${JSON.stringify(sample)?.slice(0, 80)}`);
  }
  assert.doesNotThrow(() => ExplorationSession.restore(JSON.parse(JSON.stringify(good)), 4));
});

test('探索场景不消费经典 RNG：模块源码不引用 Math.random 或 randomInt', async () => {
  const directory = path.resolve(import.meta.dirname, '../../src/engine/exploration');
  for (const name of (await readdir(directory)).filter(name => name.endsWith('.js'))) {
    const source = await readFile(path.join(directory, name), 'utf8');
    assert.ok(!/Math\.random/.test(source), `${name} 不得调用 Math.random`);
    assert.ok(!/\brandomInt\b/.test(source), `${name} 不得调用经典 randomInt`);
  }
});
