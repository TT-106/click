import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenWorldSession } from '../../src/engine/exploration/open-world-session.js';
import { Expedition, bagWeight, itemCount } from '../../src/engine/exploration/expedition.js';
import { resourceAt } from '../../src/engine/exploration/resources.js';
import { EXPEDITION_RULES, EXPEDITION_ITEMS } from '../../src/data/expedition-items.js';

const make = (seed = '原野-01') => new OpenWorldSession(seed, 4, { expedition: true });
const clone = value => JSON.parse(JSON.stringify(value));
const advance = (session, predicate, limit = 8000) => {
  for (let index = 0; index < limit; index++) { if (predicate(session)) return; session.tick(240); }
  assert.ok(predicate(session), '远征没有在有界时间内到达预期阶段');
};

test('资源覆盖层：同种子坐标可重建，不能落在水面、树或桥上，地形版本不变化', () => {
  const session = make(), original = JSON.stringify(session.world.cells);
  const nodes = session.resources(); assert.ok(nodes.length > 50);
  for (const node of nodes) {
    const cell = session.generator.getCell(node.x, node.y);
    assert.deepEqual(resourceAt(session.generator, cell), node);
    assert.ok(cell.walkable && !cell.water && cell.kind !== 'bridge');
    assert.ok(EXPEDITION_ITEMS[node.itemId]);
  }
  assert.equal(JSON.stringify(session.world.cells), original);
  assert.deepEqual(make().resources(), nodes);
});

test('每角色堆叠：均衡分配、有限负重，重复或放不下的节点不扣资源', () => {
  const journey = new Expedition({ x: 0, y: 0 }, 2);
  const node = (x, amount = 3) => ({ x, y: 0, itemId: 'wood', amount });
  assert.equal(journey.collect(node(1), 1).member, 0); assert.equal(journey.collect(node(2), 2).member, 1);
  assert.equal(journey.collect(node(1), 3), null); assert.equal(itemCount(journey.bags[0]), 3);
  for (let index = 3; index < 17; index++) journey.collect(node(index), index);
  assert.ok(journey.bags.every(bag => bagWeight(bag) === EXPEDITION_RULES.capacity));
  assert.equal(journey.collect(node(100), 100), null); assert.equal(journey.collected.has('100,0'), false);
});

test('真实远征：自动拾取 → 装满前逐格返程 → 归仓一次 → 自动再出发；收获守恒', () => {
  const session = make(); let carried = 0;
  advance(session, current => current.expedition.phase === 'returning');
  carried = session.snapshot().expedition.carried; assert.ok(carried > 0);
  assert.ok(session.expedition.bags.every(bag => bagWeight(bag) <= EXPEDITION_RULES.capacity));
  const collected = session.expedition.collected.serialize();
  advance(session, current => current.expedition.phase === 'resting');
  assert.deepEqual(session.members[0], session.expedition.camp);
  assert.equal(itemCount(session.expedition.warehouse), carried);
  assert.ok(session.expedition.bags.every(bag => itemCount(bag) === 0));
  const stored = itemCount(session.expedition.warehouse); session.expedition.bank(session.timeMs);
  assert.equal(itemCount(session.expedition.warehouse), stored, '重复结算不能重复归仓');
  assert.deepEqual(session.expedition.collected.serialize(), collected);
  advance(session, current => current.expedition.phase === 'exploring');
  assert.equal(session.expedition.outing, 2); assert.equal(session.expedition.completed, 1);
});

test('返程跨区块：沿实际走过的路线返营地，成员每步相邻、可行走，自动采集不穿墙', () => {
  const session = make('远行资源'); let returning = false;
  for (let index = 0; index < 2400; index++) {
    const before = session.members.map(point => ({ ...point })); session.tick(240);
    if (session.expedition.phase === 'returning') returning = true;
    session.members.forEach((point, offset) => {
      assert.ok(Math.abs(point.x - before[offset].x) + Math.abs(point.y - before[offset].y) <= 1);
      assert.ok(session.generator.getCell(point.x, point.y).walkable);
    });
  }
  assert.ok(returning && session.expedition.completed > 1);
  assert.ok(session.generator.generated.size > 9, '采集返程循环仍须走出初始活动窗口');
  assert.ok(session.generator.chunks.size <= 25);
});

test('远征存档：采集中、返程中、休整中可精确恢复并续跑，暂停不积累材料', () => {
  const session = make();
  for (const predicate of [current => current.expedition.holdMs > 0, current => current.expedition.phase === 'returning' && current.path.length > 0, current => current.expedition.phase === 'resting']) {
    advance(session, predicate);
    const saved = clone(session.serialize()), restored = OpenWorldSession.restore(saved, 4, { expedition: true });
    assert.deepEqual(restored.serialize(), saved);
    for (let index = 0; index < 40; index++) { session.tick(120); restored.tick(120); assert.deepEqual(restored.serialize(), session.serialize()); }
    restored.paused = true; const before = restored.serialize(); restored.tick(1000, 12); assert.deepEqual(restored.serialize(), before);
  }
});

test('旧原野存档：以当前位置建营地，不移动队伍、不改发现历史；缩编不会丢携带材料', () => {
  const old = new OpenWorldSession('原野-01'); for (let index = 0; index < 200; index++) old.tick(240);
  const saved = old.serialize(), migrated = OpenWorldSession.restore(saved, 4, { expedition: true });
  assert.deepEqual(migrated.members, old.members); assert.deepEqual(migrated.expedition.camp, old.members[0]);
  assert.deepEqual(migrated.discovered.serialize(), old.discovered.serialize());
  advance(migrated, current => current.expedition.bags.every(bag => itemCount(bag) > 0));
  const before = migrated.snapshot().expedition;
  const fewer = OpenWorldSession.restore(clone(migrated.serialize()), 2, { expedition: true }).snapshot().expedition;
  assert.equal(fewer.carried + fewer.stored, before.carried + before.stored);
});

test('损坏背包、未知材料、过载、伪造返程、未访问采集、无效阶段拒绝恢复', () => {
  const session = make(); advance(session, current => current.expedition.holdMs > 0);
  const saved = clone(session.serialize());
  const mutations = [journey => { journey.version = 99; }, journey => { journey.bags[0].unknown = 1; },
    journey => { journey.bags[0].wood = 1000; }, journey => { journey.warehouse.wood = -1; },
    journey => { journey.route = [{ x: 800000, y: 800000 }]; }, journey => { journey.phase = 'resting'; },
    journey => { journey.completed = 99; }, journey => { journey.holdMs = -1; }, journey => { journey.lastPickup.timeMs = 9999999999; }];
  for (const mutate of mutations) { const damaged = clone(saved); mutate(damaged.expedition); assert.throws(() => OpenWorldSession.restore(damaged)); }
});

test('背包归属：重排队伍按角色身份恢复，离队材料安全归仓，新增队员为空包', () => {
  const session = new OpenWorldSession('原野-01', 4, { expedition: true, ownerIds: ['甲', '乙', '丙', '丁'] });
  advance(session, current => current.expedition.bags.every(bag => itemCount(bag) > 0));
  const saved = clone(session.serialize()), bags = saved.expedition.bags;
  const restored = OpenWorldSession.restore(saved, 4, { expedition: true, ownerIds: ['丁', '甲', '新', '乙'] });
  assert.deepEqual(restored.expedition.bags, [bags[3], bags[0], {}, bags[1]]);
  assert.equal(itemCount(restored.expedition.warehouse), itemCount(bags[2]));
  assert.equal(restored.snapshot().expedition.carried + restored.snapshot().expedition.stored, session.snapshot().expedition.carried);
});
