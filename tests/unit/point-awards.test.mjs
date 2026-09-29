// 冒险点数模块的单元差分（R23 game 直连解耦切片）。
//
// 切片前：resetAdventurePoints / awardAdventurePoints / increasePointEventReward 内部直读
// 全局单例（game.state.adventurePoints），points.js 无法脱离引擎验证。
// 切片后：状态经 bindAdventurePoints 显式绑定（对象身份稳定，存档恢复原位更新），本文件
// **不启动引擎、不构造 game**，用手工构造的 adventurePoints 状态验证记账行为。
//
// 覆盖四件事：
//   1) reset 清零并按 21 类事件建零账户（含 currentPointReward 回落到 basePointReward）；
//   2) award 的计数/点数记账与未知事件类型的原版怪癖（console.log 且不改动）；
//   3) increasePointEventReward 提升奖励后 recalculate 按计数重算并扣减已花费、负值截断为 0；
//   4) 未绑定时 reset/award 直接抛错（绑定遗漏不可能静默通过）。
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bindAdventurePoints,
  initializeProgressionPoints,
  resetAdventurePoints,
  awardAdventurePoints,
  increasePointEventReward,
  recalculateAdventurePoints,
  pointEventDefinitions,
} from '../../src/engine/modules/progression/points.js';

initializeProgressionPoints();

function makeAdventurePointsState() {
  return {
    availablePoints: 123,
    spentPoints: 0,
    pointsByEventType: { 999: 456 },
    countsByEventType: { 999: 7 },
    pointUpgrades: [],
  };
}

test('bind 后 reset 清零并按事件定义建零账户，奖励回落到基准', () => {
  const fresh = makeAdventurePointsState();
  bindAdventurePoints({ adventurePoints: fresh });
  const killed = pointEventDefinitions.find((e) => e.pointEventTypeId === 1);
  killed.currentPointReward = 999; // 模拟升级提升过的奖励
  resetAdventurePoints();
  assert.equal(fresh.availablePoints, 0);
  assert.equal(fresh.spentPoints, 0);
  assert.equal(fresh.pointsByEventType[999], undefined); // 未知键被清掉
  assert.equal(fresh.countsByEventType[999], undefined);
  for (const event of pointEventDefinitions) {
    assert.equal(fresh.pointsByEventType[event.pointEventTypeId], 0);
    assert.equal(fresh.countsByEventType[event.pointEventTypeId], 0);
    assert.equal(event.currentPointReward, event.basePointReward);
  }
  assert.equal(pointEventDefinitions.length, 21);
});

test('award 按当前奖励记账点数与计数，未知类型只报错不改动', () => {
  const state = makeAdventurePointsState();
  bindAdventurePoints({ adventurePoints: state });
  resetAdventurePoints();
  awardAdventurePoints(1); // killPointEvent：base 1
  awardAdventurePoints(1);
  awardAdventurePoints(18); // summonPointEvent：base 15
  assert.equal(state.availablePoints, 17);
  assert.equal(state.countsByEventType[1], 2);
  assert.equal(state.pointsByEventType[1], 2);
  assert.equal(state.countsByEventType[18], 1);
  assert.equal(state.pointsByEventType[18], 15);
  // 未知类型：原版怪癖是 console.log 后不改动
  const errors = [];
  const originalLog = console.log;
  console.log = (message) => errors.push(message);
  try {
    awardAdventurePoints(424242);
  } finally {
    console.log = originalLog;
  }
  assert.equal(errors.length, 1);
  assert.match(errors[0], /point settings not found: 424242/);
  assert.equal(state.availablePoints, 17);
});

test('increasePointEventReward 提升奖励并重算，recalculate 扣减已花费并截断负值', () => {
  const state = makeAdventurePointsState();
  bindAdventurePoints({ adventurePoints: state });
  resetAdventurePoints();
  awardAdventurePoints(1);
  awardAdventurePoints(1);
  awardAdventurePoints(1); // 3 次 kill，每次 1 点
  assert.equal(state.availablePoints, 3);
  increasePointEventReward(1, 5); // kill 奖励 1 → 6，重算后 3 次 = 18
  assert.equal(state.availablePoints, 18);
  assert.equal(state.pointsByEventType[1], 18);
  // 扣减已花费：花费 20 → 可用 18 - 20 = -2 → 截断为 0
  state.spentPoints = 20;
  recalculateAdventurePoints(state);
  assert.equal(state.availablePoints, 0);
});

test('未绑定时调用直接抛错（绑定遗漏不可能静默通过）', () => {
  // 本文件的模块级绑定在同一进程内共享；这里用一个临时模块状态不可行，
  // 因此通过"错误的对象形状"验证绑定契约：缺字段时 reset 必须抛错而非静默。
  bindAdventurePoints({}); // 无 adventurePoints 子对象 → 绑定为 undefined
  assert.throws(() => resetAdventurePoints());
});
