// 成就需求表的机械核对（NEXT-ARCHITECTURE-PROMPT §4：表驱动检查 + 定义表↔实现一致）。
//
// 为什么需要它：328 条成就定义（`requirementType` 1-28）与两个判定函数的 switch 是**两处**独立维护的
// 数据；历史上出现过"定义表写了新类型但判定函数没处理"这类静默错位。本脚本把两者绑死：
//   1) 用 achievementId 的**命名约定**独立推导"这条成就该读哪个统计字段"（不抄 switch）；
//   2) 对全部 328 条定义 × 多组哨兵数据，逐一断言实现返回值 == 规格期望值；
//   3) 断言 isVictoryAchievement 标志与 requirementType 23-27 严格等价；
//   4) 断言原版怪癖：未知 requirementType → getAchievementProgress 返回 undefined（switch 无 default）、
//      hasVictoryAchievement 返回 false（有 default）。
// 退出码 1 = 定义表与实现不一致。
//
// 用法: node scripts/check-achievement-requirements.mjs
import assert from 'node:assert/strict';
import {
  achievementDefinitions,
  initializeProgressionAchievements,
  getAchievementProgress,
  hasVictoryAchievement,
} from '../src/engine/modules/progression/achievements.js';

initializeProgressionAchievements();

// ---------------------------------------------------------------- 规格（独立于实现）
// achievementId 前缀 → 该成就读取的 lifetimeStatistics 字段。characterLevel* 是唯一例外：
// 它读"队伍最高等级"（partyMaxLevel），而不是统计字段。
const PREFIX_SPEC = [
  [/^monsterKills/, 'directKills'],
  [/^scrollKills/, 'scrollKills'],
  [/^scrollUses/, 'scrollsUsed'],
  [/^potionUses/, 'potionsUsed'],
  [/^treasureChests/, 'treasureChestsLooted'],
  [/^weaponRacks/, 'weaponRacksLooted'],
  [/^bookcases/, 'bookcasesLooted'],
  [/^itemsSold/, 'itemsSold'],
  [/^farmsPurchased/, 'farmsPurchased'],
  [/^dungeonsCleared/, 'dungeonsCleared'],
  [/^castlesConquered/, 'castlesConquered'],
  [/^spellsCast/, 'spellCastCount'],
  [/^meleeAttacks/, 'meleeAttackCount'],
  [/^rangedAttacks/, 'rangedAttackCount'],
  [/^minionsSummoned/, 'minionsSummoned'],
  [/^characterLevel/, 'partyMaxLevel'],
  [/^doorsOpened/, 'doorsOpened'],
  [/^uncommonItemsFound/, 'uncommonItemsFound'],
  [/^rareItemsFound/, 'rareItemsFound'],
  [/^historicItemsFound/, 'historicItemsFound'],
  [/^ancientItemsFound/, 'ancientItemsFound'],
  [/^itemsFound/, 'itemsFound'],
  [/^minionKills/, 'minionKills'],
];
const VICTORY_TYPES = new Set([23, 24, 25, 26, 27]);
const ALL_TYPES = [...new Set(achievementDefinitions.map((d) => d.requirementType))].sort((a, b) => a - b);

// lifetimeStatistics 的完整字段集（与 progression/statistics.js 的 RunStatistics 构造器一致）
const LIFETIME_FIELDS = [
  'playedMillis', 'turnCount', 'doorsOpened', 'roomsCleared', 'levelsCleared', 'dungeonsCleared',
  'castlesConquered', 'farmsPurchased', 'totalGoldFromMonsters', 'totalGoldFromItems', 'directKills',
  'scrollKills', 'minionKills', 'farmedKills', 'characterStunnedCount', 'meleeAttackCount',
  'rangedAttackCount', 'spellCastCount', 'potionsUsed', 'scrollsUsed', 'minionsSummoned', 'itemsSold',
  'itemsFound', 'uncommonItemsFound', 'rareItemsFound', 'historicItemsFound', 'ancientItemsFound',
  'treasureChestsLooted', 'weaponRacksLooted', 'bookcasesLooted',
];
const CLASSES = [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11];
const PARTY_MAX_LEVEL_SENTINEL = 4242;

function makeLifetime(mode) {
  const stats = {};
  LIFETIME_FIELDS.forEach((field, i) => { stats[field] = mode === 'zero' ? 0 : 1000 + i * 7; });
  return stats;
}

function makeVictory(kind) {
  const vs = {
    partySize1Victories: 0, partySize2Victories: 0, partySize3Victories: 0,
    singleClassVictories: 0, maxContinuationVictories: 0,
    classVictories: {}, soloClassVictories: {},
  };
  if (kind === 'party2') vs.partySize2Victories = 1;
  if (kind === 'singleClass') vs.singleClassVictories = 1;
  if (kind === 'byClass') for (const c of CLASSES) vs.classVictories[c] = 1;
  if (kind === 'continuation3') vs.maxContinuationVictories = 3;
  if (kind === 'soloByClass') for (const c of CLASSES) vs.soloClassVictories[c] = 1;
  if (kind === 'all') {
    vs.partySize1Victories = vs.partySize2Victories = vs.partySize3Victories = 1;
    vs.singleClassVictories = 1;
    vs.maxContinuationVictories = 9;
    for (const c of CLASSES) { vs.classVictories[c] = 1; vs.soloClassVictories[c] = 1; }
  }
  return vs;
}

// 规格：给定定义与数据，该函数**应当**返回什么
const progressSpec = (def, data) => {
  const spec = PREFIX_SPEC.find(([re]) => re.test(def.id));
  if (!spec) return { unresolved: true };
  return { value: spec[1] === 'partyMaxLevel' ? data.partyMaxLevel : data.lifetimeStatistics[spec[1]] };
};
const victorySpec = (def, vs) => {
  switch (def.requirementType) {
    case 23:
      return 1 === def.requiredCount ? vs.partySize1Victories > 0
        : 2 === def.requiredCount ? vs.partySize2Victories > 0
          : 3 === def.requiredCount ? vs.partySize3Victories > 0 : false;
    case 24: return vs.singleClassVictories > 0;
    case 25: return (vs.classVictories[def.characterClass] || 0) > 0;
    case 26: return vs.maxContinuationVictories >= def.requiredCount;
    case 27: return (vs.soloClassVictories[def.characterClass] || 0) > 0;
    default: return false;
  }
};

const problems = [];
let progressAssertions = 0;
let victoryAssertions = 0;

// ------------------------------------------------ 1) isVictoryAchievement ⇔ requirementType 23-27
for (const def of achievementDefinitions) {
  const expected = VICTORY_TYPES.has(def.requirementType);
  if (!!def.isVictoryAchievement !== expected) {
    problems.push(`${def.id}: isVictoryAchievement=${!!def.isVictoryAchievement} 与 requirementType=${def.requirementType} 不一致`);
  }
}

// ------------------------------------------------ 2) 定义表类型集 ⊆ 判定函数处理集（经真实调用判定）
for (const type of ALL_TYPES) {
  const sample = achievementDefinitions.find((d) => d.requirementType === type);
  const data = { lifetimeStatistics: makeLifetime('sentinel'), victoryStatistics: makeVictory('all'), partyMaxLevel: PARTY_MAX_LEVEL_SENTINEL };
  const got = VICTORY_TYPES.has(type) ? hasVictoryAchievement(sample, data) : getAchievementProgress(sample, data);
  if (got === undefined) problems.push(`requirementType ${type}（${sample.id}）未被判定函数处理（返回 undefined）`);
}

// ------------------------------------------------ 3) 逐条定义 × 多组哨兵数据：实现 == 规格
for (const def of achievementDefinitions) {
  for (const mode of ['sentinel', 'zero']) {
    const data = {
      lifetimeStatistics: makeLifetime(mode),
      victoryStatistics: makeVictory('zero'),
      partyMaxLevel: mode === 'zero' ? 0 : PARTY_MAX_LEVEL_SENTINEL,
    };
    if (!VICTORY_TYPES.has(def.requirementType)) {
      const spec = progressSpec(def, data);
      if (spec.unresolved) {
        problems.push(`${def.id}: achievementId 不匹配任何已知前缀规格（请在 PREFIX_SPEC 里声明它读哪个字段）`);
        continue;
      }
      const got = getAchievementProgress(def, data);
      progressAssertions++;
      if (got !== spec.value) {
        problems.push(`${def.id}（type ${def.requirementType}, ${mode}）: 实现返回 ${got}，规格期望 ${spec.value}`);
      }
    }
  }
  if (VICTORY_TYPES.has(def.requirementType)) {
    for (const kind of ['zero', 'party2', 'singleClass', 'byClass', 'continuation3', 'soloByClass', 'all']) {
      const vs = makeVictory(kind);
      const data = { lifetimeStatistics: makeLifetime('sentinel'), victoryStatistics: vs, partyMaxLevel: PARTY_MAX_LEVEL_SENTINEL };
      const got = hasVictoryAchievement(def, data);
      const want = victorySpec(def, vs);
      victoryAssertions++;
      if (got !== want) problems.push(`${def.id}（type ${def.requirementType}, ${kind}）: 实现返回 ${got}，规格期望 ${want}`);
    }
  }
}

// ------------------------------------------------ 4) 原版怪癖：未知 requirementType
{
  const data = { lifetimeStatistics: makeLifetime('sentinel'), victoryStatistics: makeVictory('all'), partyMaxLevel: PARTY_MAX_LEVEL_SENTINEL };
  const unknown = { id: 'unknownTypeProbe', requirementType: 999, requiredCount: 1 };
  const p = getAchievementProgress(unknown, data);
  const v = hasVictoryAchievement(unknown, data);
  if (p !== undefined) problems.push(`未知 requirementType：getAchievementProgress 应返回 undefined（原版 switch 无 default），实际 ${p}`);
  if (v !== false) problems.push(`未知 requirementType：hasVictoryAchievement 应返回 false（原版有 default），实际 ${v}`);
}

// ------------------------------------------------ 报告
console.log('成就需求表核对：');
console.log(`  定义条数 ${achievementDefinitions.length}；requirementType 集合 [${ALL_TYPES.join(', ')}]（${ALL_TYPES.length} 种）`);
console.log(`  非胜利类（getAchievementProgress）断言 ${progressAssertions} 条；胜利类（hasVictoryAchievement）断言 ${victoryAssertions} 条`);
console.log(`  isVictoryAchievement ⇔ requirementType ∈ {23..27}：${achievementDefinitions.filter((d) => d.isVictoryAchievement).length} 条标记，已逐条核对`);
if (problems.length) {
  console.log(`\n✗ 定义表与实现不一致 ${problems.length} 处：`);
  for (const p of problems.slice(0, 40)) console.log(`  - ${p}`);
  if (problems.length > 40) console.log(`  … 另有 ${problems.length - 40} 处`);
  process.exit(1);
}
console.log('\n✓ 定义表与判定实现完全一致（含未知类型怪癖）。');
