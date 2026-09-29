// 成就进度判定的单元差分（NEXT-ARCHITECTURE-PROMPT §4 的首个纵向切片）。
//
// 切片前：getAchievementProgress / hasVictoryAchievement 内部直读全局单例
// （game.state.lifetimeStatistics / victoryStatistics / party），要验证任何一个 requirementType
// 都必须启动 runtime/index.js 并把 game 喂到某个状态——单测无法触及。
// 切片后：判定逻辑以显式数据（AchievementCheckData）为输入，本文件**不启动引擎、不构造 game**。
//
// 覆盖三件事：
//   1) 28 个 requirementType 的字段映射（规格表写在测试里，与实现分开维护）；
//   2) 未知 requirementType 的原版怪癖：progress → undefined、victory → false；
//   3) partyMaxLevel 的惰性求值：只有 requirementType 16 会读它。
//   4) R27 起的组合根注入契约：未绑定会话状态时三个入口都点名报错；绑定后省略 data 的
//      入口读的就是注入的那个对象（换的是数据来源，不是判定逻辑）。
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  achievementDefinitions,
  initializeProgressionAchievements,
  getAchievementProgress,
  hasVictoryAchievement,
  getAchievementCheckData,
  bindAchievementProgress,
} from '../../src/engine/modules/progression/achievements.js';

initializeProgressionAchievements();

// requirementType → 该类型读取的 lifetimeStatistics 字段（16 读队伍最高等级，见下）
const TYPE_FIELDS = {
  1: 'directKills', 2: 'scrollKills', 3: 'scrollsUsed', 4: 'potionsUsed', 5: 'treasureChestsLooted',
  6: 'weaponRacksLooted', 7: 'bookcasesLooted', 8: 'itemsSold', 9: 'farmsPurchased',
  10: 'dungeonsCleared', 11: 'castlesConquered', 12: 'spellCastCount', 13: 'meleeAttackCount',
  14: 'rangedAttackCount', 15: 'minionsSummoned', 16: null, 17: 'doorsOpened', 18: 'itemsFound',
  19: 'uncommonItemsFound', 20: 'rareItemsFound', 21: 'historicItemsFound', 22: 'ancientItemsFound',
  28: 'minionKills',
};
const VICTORY_TYPES = [23, 24, 25, 26, 27];

const definitionOfType = (type) => achievementDefinitions.find((d) => d.requirementType === type);

/** 构造一份"每个字段都不同"的数据；任何字段串位都会让断言失败。 */
function sentinelData() {
  const lifetimeStatistics = {};
  let n = 1000;
  for (const field of Object.values(TYPE_FIELDS)) {
    if (!field || field in lifetimeStatistics) continue;
    lifetimeStatistics[field] = n;
    n += 7;
  }
  return {
    lifetimeStatistics,
    victoryStatistics: {
      partySize1Victories: 0, partySize2Victories: 0, partySize3Victories: 0,
      singleClassVictories: 0, maxContinuationVictories: 0, classVictories: {}, soloClassVictories: {},
    },
    partyMaxLevel: 4242,
  };
}

test('每个 requirementType 读取且只读取它对应的统计字段', () => {
  const data = sentinelData();
  const covered = [];
  for (const [type, field] of Object.entries(TYPE_FIELDS)) {
    const definition = definitionOfType(Number(type));
    assert.ok(definition, `定义表里应有 requirementType ${type} 的成就`);
    const got = getAchievementProgress(definition, data);
    const want = field === null ? data.partyMaxLevel : data.lifetimeStatistics[field];
    assert.equal(got, want, `requirementType ${type}（${definition.id}）应读 ${field ?? 'partyMaxLevel'}`);
    covered.push(Number(type));
  }
  // 覆盖性：本表必须与定义表出现过的类型集完全一致，否则新增类型会静默漏测
  const tableTypes = [...new Set(achievementDefinitions.map((d) => d.requirementType))].filter((t) => !VICTORY_TYPES.includes(t)).sort((a, b) => a - b);
  assert.deepEqual(covered.sort((a, b) => a - b), tableTypes, 'TYPE_FIELDS 必须覆盖定义表里全部非胜利类 requirementType');
});

test('victory 类 23-27 只读 victoryStatistics，且与 requiredCount / characterClass 对齐', () => {
  const base = sentinelData();
  const party1 = definitionOfType(23);
  const party2 = achievementDefinitions.find((d) => d.requirementType === 23 && d.requiredCount === 2);
  const byClass = definitionOfType(25);
  const soloByClass = definitionOfType(27);
  const continuation = definitionOfType(26);

  // 全零 → 全部未达成
  for (const type of VICTORY_TYPES) {
    for (const definition of achievementDefinitions.filter((d) => d.requirementType === type)) {
      assert.equal(hasVictoryAchievement(definition, base), false, `${definition.id} 在全零胜利统计下必须为 false`);
    }
  }

  const data = { ...base, victoryStatistics: { ...base.victoryStatistics, partySize2Victories: 1, classVictories: { [byClass.characterClass]: 1 } } };
  assert.equal(hasVictoryAchievement(party1, data), false, 'requiredCount=1 只看 partySize1Victories');
  assert.equal(hasVictoryAchievement(party2, data), true, 'requiredCount=2 看 partySize2Victories');
  assert.equal(hasVictoryAchievement(byClass, data), true, 'type 25 看 classVictories[characterClass]');
  assert.equal(hasVictoryAchievement(soloByClass, data), false, 'type 27 看 soloClassVictories，不受 classVictories 影响');

  const continuationData = { ...base, victoryStatistics: { ...base.victoryStatistics, maxContinuationVictories: continuation.requiredCount } };
  assert.equal(hasVictoryAchievement(continuation, continuationData), true, 'type 26 比较 maxContinuationVictories >= requiredCount');
});

test('未知 requirementType 的原版怪癖被忠实保留', () => {
  const data = sentinelData();
  const unknown = { id: 'unknownTypeProbe', requirementType: 999, requiredCount: 1 };
  // switch 无 default：进度返回 undefined（不要"修"成 0）
  assert.equal(getAchievementProgress(unknown, data), undefined);
  // hasVictoryAchievement 有 default：返回 false
  assert.equal(hasVictoryAchievement(unknown, data), false);
});

test('partyMaxLevel 惰性求值：只有 requirementType 16 会读它', () => {
  const lifetimeStatistics = {};
  for (const field of Object.values(TYPE_FIELDS)) if (field) lifetimeStatistics[field] = 5;
  let reads = 0;
  const data = {
    lifetimeStatistics,
    victoryStatistics: { partySize1Victories: 0, partySize2Victories: 0, partySize3Victories: 0, singleClassVictories: 0, maxContinuationVictories: 0, classVictories: {}, soloClassVictories: {} },
    get partyMaxLevel() { reads++; return 77; },
  };
  // type 1：不得触碰 partyMaxLevel（getPartyMaxLevel 会写 party.cachedMaxLevel，提前求值即行为变更）
  assert.equal(getAchievementProgress(definitionOfType(1), data), 5);
  assert.equal(reads, 0, '非 16 类不得读取 partyMaxLevel');
  // type 16：必须读到
  assert.equal(getAchievementProgress(definitionOfType(16), data), 77);
  assert.equal(reads, 1);
});

test('未绑定会话状态时三个入口都必须抛错（R27 起改为组合根注入，不再读全局 game）', () => {
  // 原断言是 assert.throws(..., TypeError)：那时省略 data 会去读尚未存在的 game 对象，
  // 由 undefined 的属性访问抛 TypeError——报错信息毫无意义。本切片把 game.state 的读取
  // 换成 bindAchievementProgress(game.state) 注入后，未装配改由显式守卫抛带名字的错误。
  // 断言意图不变（"装配漏了必须炸"），但契约更明确：错误文案点名该调哪个组合根函数。
  assert.throws(() => getAchievementCheckData(), /成就进度尚未绑定会话状态/);
  assert.throws(() => getAchievementProgress(definitionOfType(1)), /成就进度尚未绑定会话状态/);
  assert.throws(() => hasVictoryAchievement(definitionOfType(23)), /成就进度尚未绑定会话状态/);
});

test('组合根绑定后，省略 data 的入口读的就是注入的那个状态对象', () => {
  // 正向补一条：绑定只换数据来源，不换判定逻辑——同样两份统计，注入前后结果必须一致。
  const lifetimeStatistics = {};
  for (const field of Object.values(TYPE_FIELDS)) if (field) lifetimeStatistics[field] = 5;
  const injected = {
    achievements: { achievementList: [], obtainedList: [], claimQueue: [] },
    lifetimeStatistics,
    victoryStatistics: { partySize1Victories: 3, partySize2Victories: 0, partySize3Victories: 0, singleClassVictories: 0, maxContinuationVictories: 0, classVictories: {}, soloClassVictories: {} },
    party: {},
  };
  bindAchievementProgress(injected);
  const data = getAchievementCheckData();
  assert.equal(data.lifetimeStatistics, injected.lifetimeStatistics, '注入的累计统计对象被原样取用');
  assert.equal(data.victoryStatistics, injected.victoryStatistics, '注入的胜利统计对象被原样取用');
  assert.equal(getAchievementProgress(definitionOfType(1), data), 5);
});
