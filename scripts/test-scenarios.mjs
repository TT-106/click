// 场景差分矩阵：同一变异存档驱动原版与重构引擎，逐步推进并比较完整存档状态。
// 运行前置：node scripts/serve.mjs（默认 http://127.0.0.1:4173）。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import saveCodec from '../src/engine/save-codec.js';
import {
  decodeFixture, encodeSave, summarize,
  withPotions, withScrolls, withGold, withKills, withPointPools, withFarmableDungeon, withTurns, withElapsed, withOfflineProcessing, withBackgroundProcessing,
  withVictories, withClassSpell, withCastleVictory, withReclassedSpell, withEquippedItem, withResurrectionTrial, withSkillPoints, withExperience, withCharacterClass, withAttackableCastle, withClaimableAchievements, withAchievementThresholds, withoutFields, withFieldValues, withEmptyBackpacks,
  HARNESS_FIXED_NOW,
} from '../tests/scenarios/save-mutations.mjs';

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:4173';
const base = decodeFixture();
const BASELINE_MONSTER_LEVELS = base.monsterTypes?.monsterLevelStates?.length ?? 0;
const BASELINE_MAX_LEVEL = Math.max(1, ...(base.adventurers ?? []).map(a => a.characteristicsComponent?.characterLevel ?? 1));

// 场景定义：steps 中的每个 (推进回合数, 断言钩子) 依次执行。
// U7：升级购买在存档里有四处可观察量——全局升级表、冒险点花费、成就领取、技能树布尔表。
// 技能升级写在角色的 upgrades1..4 布尔表里，取任一 true 即证明购买真的落到角色身上。
const BASELINE_SKILLS = (base.adventurers ?? []).map((a) =>
  ['upgrades1', 'upgrades2', 'upgrades3', 'upgrades4'].reduce((n, k) => n + Object.values(a[k] ?? {}).filter(Boolean).length, 0));
const BASELINE_SKILL_TOTAL = BASELINE_SKILLS.reduce((n, v) => n + v, 0);
const BASELINE_SETTINGS_TOTAL = Object.values(base.settings?.upgrades ?? {}).reduce((n, v) => n + v, 0);
const BASELINE_SPELL_TOTAL = (base.adventurers ?? []).reduce((n, a) => n + (a.spells?.length ?? 0), 0);
const upgradedSomething = (s) => {
  const families = [];
  if (Object.values(s.settings?.upgrades ?? {}).reduce((n, v) => n + v, 0) > BASELINE_SETTINGS_TOTAL) families.push('settings');
  if ((s.pointManagerState?.spentAdventurePoints ?? 0) > 0) families.push('adventurePoints');
  if ((s.achievements ?? []).some(a => a.upgradePurchased)) families.push('achievementClaim');
  if ((s.monsterTypes?.monsterLevelStates?.length ?? 0) > BASELINE_MONSTER_LEVELS) families.push('monsterLevels');
  if ((s.adventurers ?? []).some(a => (a.characteristicsComponent?.characterLevel ?? 1) > BASELINE_MAX_LEVEL)) families.push('characterLevels');
  if ((s.adventurers ?? []).reduce((n, a, i) => n + ['upgrades1','upgrades2','upgrades3','upgrades4'].reduce((m, k) => m + Object.values(a[k] ?? {}).filter(Boolean).length, 0), 0) > BASELINE_SKILL_TOTAL) families.push('skillTrees');
  if ((s.adventurers ?? []).reduce((n, a) => n + (a.spells?.length ?? 0), 0) > BASELINE_SPELL_TOTAL) families.push('spells');
  return {
    upgraded: families.length > 0,
    settingsPurchased: families.includes('settings'),
    characterLeveled: families.includes('characterLevels'),
    skillLearned: families.includes('skillTrees'),
    spellLearned: families.includes('spells'),
    note: '购买命中的升级族: ' + (families.join(' + ') || '无'),
  };
};
const monsterLevelWasUnlocked = (s) => ({
  monsterUnlocked: (s.monsterTypes?.maxUnlockedLevel ?? 1) > (base.monsterTypes?.maxUnlockedLevel ?? 1)
    && (s.monsterTypes?.monsterLevelStates?.length ?? 0) > BASELINE_MONSTER_LEVELS,
  note: `怪物最高等级 ${s.monsterTypes?.maxUnlockedLevel}，等级表 ${s.monsterTypes?.monsterLevelStates?.length}，队伍最低等级 ${Math.min(...(s.adventurers ?? []).map(a => a.characteristicsComponent?.characterLevel ?? 1))}，可用击杀 ${s.party?.kills}`,
});
const monsterLevelWasRetired = (s) => ({
  minLevelRetired: (s.monsterTypes?.minUnlockedLevel ?? 1) > (base.monsterTypes?.minUnlockedLevel ?? 1),
  maxLevelUnlocked: (s.monsterTypes?.maxUnlockedLevel ?? 1) >= 3,
  retiredLevelExcluded: (s.monsterTypes?.monsterLevelStates?.[0]?.level ?? 1) > 1,
  note: `最低等级 ${s.monsterTypes?.minUnlockedLevel}，最高等级 ${s.monsterTypes?.maxUnlockedLevel}，首个有效怪物等级 ${s.monsterTypes?.monsterLevelStates?.[0]?.level}，等级表长度 ${s.monsterTypes?.monsterLevelStates?.length}`,
});
const criticalHitSkillsLearned = (s) => {
  const fighter = s.adventurers?.[0];
  const ranger = s.adventurers?.[2];
  const fighterCrits = [
    fighter?.upgrades1?.criticalHitChanceFighter1,
    fighter?.upgrades2?.criticalHitChanceFighter2,
    fighter?.upgrades3?.criticalHitChanceFighter3,
    fighter?.upgrades4?.criticalHitChanceFighter4,
  ].filter(Boolean).length;
  const rangerCrits = [
    ranger?.upgrades1?.criticalHitChanceRanger1,
    ranger?.upgrades2?.criticalHitChanceRanger2,
    ranger?.upgrades3?.criticalHitChanceRanger3,
  ].filter(Boolean).length;
  return {
    criticalSkillsActive: fighterCrits >= 4 && rangerCrits >= 3,
    note: `战士暴击技能 ${fighterCrits}/4，游侠暴击技能 ${rangerCrits}/3，已激活暴击技能总数 ${fighterCrits + rangerCrits}`,
  };
};
const pointUpgradeWasPurchased = (s) => ({
  pointUpgradePurchased: (s.pointManagerState?.spentAdventurePoints ?? 0) > (base.pointManagerState?.spentAdventurePoints ?? 0)
    && (s.pointManagerState?.pointUpgrades ?? []).some(u => u.upgradePurchased),
});
const multiplePointUpgradesPurchased = (s) => {
  const basePurchased = new Set((base.pointManagerState?.pointUpgrades ?? []).filter(u => u.upgradePurchased).map(u => u.upgradeId));
  const newly = (s.pointManagerState?.pointUpgrades ?? []).filter(u => u.upgradePurchased && !basePurchased.has(u.upgradeId));
  return {
    distinctPointUpgradesBought: newly.length,
    pointsSpent: (s.pointManagerState?.spentAdventurePoints ?? 0) - (base.pointManagerState?.spentAdventurePoints ?? 0),
  };
};
const manualEquipSwapped = (s) => {
  const adv = (s.adventurers ?? [])[0] ?? {};
  const equippedNames = (adv.equippedItemCollection ?? []).map(x => x.itemName);
  const invNames = (adv.inventory ?? []).map(x => x.itemName);
  const equipEvents = (s.pointManagerState?.pointsByType ?? []).find(p => p.pointEventType === 21)?.count ?? 0;
  const baseEquipEvents = (base.pointManagerState?.pointsByType ?? []).find(p => p.pointEventType === 21)?.count ?? 0;
  return {
    swapDone: equippedNames.includes('金属的权杖') && invNames.includes('人民之美好的权杖'),
    itemEquippedGrew: equipEvents > baseEquipEvents,
  };
};
// U7 长尾（U134）：type 3「装备背包散件」购买必须真实改变装备槽（相对 fixture 基线），
// 且 equipItem 的点数事件（type 21）真实增长——两项都由各端独立证明，再进入完整 DTO 差分。
const equipmentActuallyChanged = (s) => {
  const digest = (save) => (save.adventurers ?? []).map(a => (a.equippedItemCollection ?? []).map(e => e.itemName).sort().join('|'));
  const equipEvents = (s.pointManagerState?.pointsByType ?? []).find(p => p.pointEventType === 21)?.count ?? 0;
  const baseEquipEvents = (base.pointManagerState?.pointsByType ?? []).find(p => p.pointEventType === 21)?.count ?? 0;
  return {
    equipmentChanged: JSON.stringify(digest(s)) !== JSON.stringify(digest(base)),
    itemEquippedGrew: equipEvents > baseEquipEvents,
  };
};
const barbarianGrew = (s) => {
  const adv = (s.adventurers ?? [])[3] ?? {};
  const bAdv = (base.adventurers ?? [])[3] ?? {};
  const bits = (t) => ['upgrades1', 'upgrades2', 'upgrades3', 'upgrades4']
    .reduce((n, k) => n + Object.values(t?.[k] ?? {}).filter(Boolean).length, 0);
  return {
    classKept: adv.characterClass === 1,
    skillsLearned: bits(adv) > bits(bAdv),
    spellsLearned: (adv.spells?.length ?? 0) > (bAdv.spells?.length ?? 0),
  };
};
const attackSkillsLearned = (s) => {
  const fighter = s.adventurers?.[0];
  const ranger = s.adventurers?.[2];
  const bits = (who, names) => {
    const trees = [who?.upgrades1, who?.upgrades2, who?.upgrades3, who?.upgrades4];
    return names.reduce((n, k) => n + (trees.some(tree => tree?.[k]) ? 1 : 0), 0);
  };
  const multi = bits(fighter, ['attacksPerTurnFighter1', 'attacksPerTurnFighter2', 'attacksPerTurnFighter3',
    'additionalAttackPercentFighter1', 'additionalAttackPercentFighter2', 'additionalAttackPercentFighter3']);
  const chain = bits(ranger, ['ricochetCountRanger1', 'ricochetCountRanger2', 'ricochetCountRanger3', 'ricochetCountRanger4',
    'ricochetPercentRanger1', 'ricochetPercentRanger2', 'ricochetPercentRanger3', 'ricochetPercentRanger4']);
  return { multiLearned: multi, chainLearned: chain, enough: multi >= 4 && chain >= 6 };
};
const multipleAchievementsClaimed = (s) => ({
  appliedDelta: (s.achievementManager?.achievements ?? []).filter(a => a.applied).length
    - (base.achievementManager?.achievements ?? []).filter(a => a.applied).length,
  killRewardGrew: ((s.pointManagerState?.pointsByType ?? []).find(p => p.pointEventType === 1)?.points ?? 0)
    > ((base.pointManagerState?.pointsByType ?? []).find(p => p.pointEventType === 1)?.points ?? 0),
});
const castleAttackPlanned = (s) => ({
  attackPlanned: (s.castleManager?.castleStates ?? []).filter(c => c.attackScheduled || c.conquered).length
    > (base.castleManager?.castleStates ?? []).filter(c => c.attackScheduled || c.conquered).length,
});
const achievementWasClaimed = (s) => ({
  achievementClaimed: (s.achievementManager?.achievements ?? []).filter(a => a.applied).length
    > (base.achievementManager?.achievements ?? []).filter(a => a.applied).length,
});
// 成就进度临界值（NEXT-ARCHITECTURE-PROMPT §4）：直接对账 requirementType 9（farmsPurchased）
// 与 17（doorsOpened）两条进度计算的临界点。同一场景内一负一正，证明"成就检查节拍真的跑了、
// 判定真的按 requiredCount 比较"，而不是靠两端存档相等这种弱断言。
const achievementObtained = (s, id) => (s.achievementManager?.achievements ?? []).find(a => a.achievementId === id)?.obtained === true;
const achievementThresholdBelow = (s) => ({
  achievementBelowThreshold: achievementObtained(s, 'farmsPurchased5') === false,
  achievementAtThreshold: achievementObtained(s, 'doorsOpened100K') === true,
});
const achievementThresholdMet = (s) => ({
  achievementThresholdReached: achievementObtained(s, 'farmsPurchased5') === true,
  achievementAtThreshold: achievementObtained(s, 'doorsOpened100K') === true,
});
const equipmentChanged = (s) => ({
  equipmentChanged: (s.adventurers ?? []).some((a, i) =>
    JSON.stringify(a.equippedItemCollection) !== JSON.stringify(base.adventurers?.[i]?.equippedItemCollection)),
  itemEquipEvents: (s.pointManagerState?.pointsByType ?? []).find(p => p.pointEventType === 21)?.count
    > (base.pointManagerState?.pointsByType ?? []).find(p => p.pointEventType === 21)?.count,
});
const scrollWasCast = (s) => ({ scrollCast: (s.statistics?.scrollsUsed ?? 0) > (base.statistics?.scrollsUsed ?? 0) });
const farmWasPurchased = (s) => ({
  farmPurchased: (s.farms?.length ?? 0) > 0 && (s.statistics?.farmsPurchased ?? 0) > 0,
});
const farmWasHarvested = (s) => ({
  farmHarvested: (s.statistics?.farmedKills ?? 0) > 0,
  farmedKillsCleared: (s.dungeonManagerState?.farmedKills ?? 0) === 0,
});
const farmCycleAdvanced = (s) => ({
  farmCycleHarvestCount: (s.statistics?.farmedKills ?? 0) >= 200,
  farmCleared: s.dungeonManagerState?.dungeonStates?.find(d => d.dungeonFarm)?.cleared === true,
});
const treasureWasLooted = (s) => ({
  treasureLooted: (s.statistics?.treasureChestsLooted ?? 0) > (base.statistics?.treasureChestsLooted ?? 0),
});
const weaponRackWasLooted = (s) => ({
  weaponRackLooted: (s.statistics?.weaponRacksLooted ?? 0) > (base.statistics?.weaponRacksLooted ?? 0),
});
const bookcaseWasLooted = (s) => ({
  bookcaseLooted: (s.statistics?.bookcasesLooted ?? 0) > (base.statistics?.bookcasesLooted ?? 0),
});
const groundDropsWereCollected = (s) => ({
  noLootSpell: (s.adventurers ?? []).every(a => (a.spells?.length ?? 0) === 0),
  collectedDropTypes: [9, 10, 11, 12].filter(type =>
    (s.pointManagerState?.pointsByType ?? []).find(p => p.pointEventType === type)?.count
      > (base.pointManagerState?.pointsByType ?? []).find(p => p.pointEventType === type)?.count),
});
// P-3 远古稀有度：recordItemFound 的 case 4（statistics.js:115）在 fixture 概率下从未被驱动。
const ancientItemWasFound = (s) => ({
  ancientFound: (s.statistics?.ancientItemsFound ?? 0) > (base.statistics?.ancientItemsFound ?? 0),
});
// 差分原版正常开局路径：reset 后经各自原生开局闭包建队，验证创建真的发生且形态正确。
const createdPartyMatches = (s) => ({
  partyCreated: s.partyCreated === true,
  adventurerCount: (s.adventurers ?? []).length,
});
// P-1 技能消费证据：鸡王几率技能（statType 30）购买位必须写进 upgrades4，
// 且召唤鸡群法术必须真实施法（几率掷骰只发生在施法生成小鸡时，actions.js:172-179）。
const chickenChanceOwned = (i) => (s) => ({
  chanceSkillOwned: (s.adventurers?.[i]?.upgrades4 ?? {}).barbarianChanceChickenKing === true,
});
const chickenChanceSkillOwned = chickenChanceOwned(0);
// U7 长尾：ScrollUpgrade（type 12）购买后 scrollInventory 的 upgradeCount 必须增长。
const scrollUpgradePurchased = (s) => ({
  scrollUpgraded: (s.scrollInventory ?? []).some(x => (x.upgradeCount ?? 0) > 0),
});
// P-1 被动族（statType 10）：冷却缩减购买位写进 upgrades4。
const fighterCooldownSkillOwned = (s) => ({
  chanceSkillOwned: (s.adventurers?.[0]?.upgrades4 ?? {}).fasterAttacksFighter3 === true,
});
// P-5 健壮性矩阵：接受步要求队伍完好；拒绝步的快照为 null（两端都必须拒绝）。
const robustnessLoadedOk = (s) => ({
  adventurersIntact: (s?.adventurers ?? []).length === 4 && s?.partyCreated === true,
});
const robustnessRejected = (s) => ({
  loadRejected: s === null,
});
const chickenChanceSkillConsumed = (s) => ({
  chanceSkillOwned: [0, 1, 2, 3].every(i => (s.adventurers?.[i]?.upgrades4 ?? {}).barbarianChanceChickenKing === true),
  spellCast: (s.statistics?.spellCastCount ?? 0) > (base.statistics?.spellCastCount ?? 0),
});
// U7：药水激活在视图之外没有入口，激活后存档里只有 statistics.potionsUsed 可证。
const potionWasUsed = (s) => ({ potionUsed: (s.statistics?.potionsUsed ?? 0) > 0 });
const backgroundProgressWasDisabled = (s) => ({
  backgroundProgressDisabled: s.gameOptions?.inactiveTabProcessingEnabled === false,
});
// P-1 增益族期望值：由 fixture 分量按 statValue 公式独立推导（itemValue+levelValue 的基数
// 加 skillBonusPercent 的百分比增益），不读取实现——这是期望侧与实现侧的独立对账。
const statValueOf = (adventurerIndex, componentKey, skillBonusPercent) => {
  const c = (base.adventurers ?? [])[adventurerIndex]?.characteristicsComponent?.[componentKey];
  if (!c) throw new Error(`fixture 缺少 ${componentKey}`);
  const itemLevel = c.itemValue + c.levelValue;
  return itemLevel + Math.floor((c.skillBonusPercent + skillBonusPercent) / 100 * itemLevel);
};
const scenarios = [
  {
    name: 'rendered-scene',
    // 渲染面差分：400 帧真实帧循环（含 view.render），断言两端都真的画出像素，
    // 再照常比较完整存档；渲染异常由 console 捕获通道兜住。
    make: () => base,
    steps: [
      { frames: 1300 },
      { turns: 300 },
    ],
  },
  {
    name: 'long-run-9000',
    make: () => base,
    steps: [[3000, null], [3000, null], [3000, null]],
  },
  {
    name: 'offline-1h',
    make: () => withElapsed(withOfflineProcessing(base, true), 3600e3),
    offline: true,
    steps: [[0, snap => ({ changed: summarize(snap).gold > base.party.gold })], [200, null]],
    // 载入后离线结算应带来金币增长（两端都必须真的做了离线处理）
  },
  {
    name: 'offline-8h',
    make: () => withElapsed(withOfflineProcessing(base, true), 8 * 3600e3),
    offline: true,
    steps: [[0, snap => ({ changed: summarize(snap).kills > base.party.kills })], [200, null]],
  },
  {
    name: 'offline-13h-capped',
    make: () => withElapsed(withOfflineProcessing(base, true), 13 * 3600e3),
    offline: true,
    expectedOfflineDuration: 12 * 3600e3,
    steps: [[0, snap => ({ changed: summarize(snap).kills > base.party.kills })], [200, null]],
  },
  {
    name: 'offline-disabled',
    make: () => withElapsed(withOfflineProcessing(base, false), 3600e3),
    offline: true,
    steps: [[0, snap => ({ unchanged: summarize(snap).gold === base.party.gold })], [200, null]],
  },
  {
    name: 'potions-active',
    make: () => withPotions(base, ['doubleKills', 'randomBossEncounter', 'doubleGold'], { active: true }),
    steps: [[600, null], [600, null]],
  },
  {
    name: 'potions-inactive-auto',
    make: () => withPotions(base, ['doubleKills', 'doubleExperience', 'randomTreasureRoom']),
    steps: [[600, null], [600, null]],
  },
  {
    name: 'scrolls-stocked',
    make: () => withScrolls(base, [
      { scrollId: 'shockScroll', count: 99 },
      { scrollId: 'spiderWebScroll', count: 50 },
      { scrollId: 'arrowScroll', count: 50 },
      { scrollId: 'fireBallScroll', count: 20 },
    ]),
    steps: [[600, null], [600, null]],
  },
  {
    name: 'fireball-blast-stun',
    make: () => withClassSpell(base, 4, '火球'),
    // 第一步同时直接计数 blastStunSpell（cat=2、statusEffectTypeId=14）被施加到活怪物上的次数，
    // 两端都必须 > 0 且数值相等；效果队列不入存档，因此这是独立的直接观察。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), effectType: 14 }, [3000, null]],
  },
  {
    // 施法后的状态效果施加分支：spellCategoryId=2 且 statusEffectTypeId=4，
    // 会走 combat/actions.js 的效果应用与 characters/character.js 的 cat2/type4 特判。
    name: 'spell-status-transform',
    make: () => withClassSpell(base, 4, '转变怪物'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 增益法术分支：spellCategoryId=3 且 statusEffectTypeId=5，
    // 加成结果写入存档的 spellBonusPercent，因此属于可直接对账的可观察量。
    name: 'spell-buff-armor',
    make: () => withClassSpell(base, 6, '提高护甲'),
    // allyEffectType=5：cat=3「提高护甲」的 statusEffectTypeId=5，效果落在**队友**身上，
    // 因此必须用盟友侧观察器（活怪物队列里永远看不到），两端施加次数都要 >0 且相等。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), allyEffectType: 5 }, [3000, null]],
  },
  {
    // 召唤类分支：spellCategoryId=9 → applySpellEffect 走 summonSpellMinion，
    // 召唤数写入存档统计 minionsSummoned，因此两端各自的增长可直接对账。
    name: 'spell-summon-ghost-skeleton',
    make: () => withReclassedSpell(base, 3, 9, '幽灵骷髅'),
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, summoned: snap.statistics.minionsSummoned > base.statistics.minionsSummoned }) }, [3000, null]],
  },
  {
    // 召唤+移除目标分支：spellCategoryId=11 先把目标怪从活怪物列表 splice 掉再召唤
    name: 'spell-summon-skeleton-army',
    make: () => withReclassedSpell(base, 3, 9, '骷髅军队'),
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, summoned: snap.statistics.minionsSummoned > base.statistics.minionsSummoned }) }, [3000, null]],
  },
  {
    // 召唤类分支：spellCategoryId=10（德鲁伊 狼群）。与 cat=9 共用 summonSpellMinion 分支
    // （actions.js:154 的 `10 === d || 9 === d`），因此可观测量同为存档统计 minionsSummoned。
    // 补这条是为了消掉「cat=10 无任何场景驱动」的覆盖空洞——由 scripts/check-spell-coverage.mjs 发现。
    name: 'spell-summon-wolf-pack',
    make: () => withReclassedSpell(base, 3, 10, '狼群'),
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, summoned: snap.statistics.minionsSummoned > base.statistics.minionsSummoned }) }, [3000, null]],
  },
  {
    // 控制类分支：spellCategoryId=2、statusEffectTypeId=0（睡眠），
    // 用逐帧扫描直接计数睡眠落到活怪物上的次数。
    name: 'spell-sleep',
    make: () => withReclassedSpell(base, 3, 10, '睡眠'),
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), effectType: 0 }, [3000, null]],
  },
  {
    // 治疗分支：spellCategoryId=1（牧师 治疗）。两端各自断言实际施法，再比较完整存档。
    name: 'spell-heal',
    make: () => withReclassedSpell(base, 3, 6, '治疗'),
    // healNumbers：cat=1 治疗分支写 `showFloatingText(h, g, "+" + f, "#00FF00")`，
    // 因此采样正号整数浮动文字即可直接对账「治疗真的落到队友身上」，两端条数与累计回血都必须 >0 且相等。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), healNumbers: true }, [3000, null]],
  },
  {
    // 弹射范围伤害分支：spellCategoryId=4、bo:true（火法师 火环）。
    name: 'spell-area-bounce',
    make: () => withReclassedSpell(base, 3, 4, '火环'),
    // damageNumbers：本步改用逐帧采样伤害浮动文字（pattern ^-[0-9]+$），对每个伤害类法术给出
    // 与存档无关的**直接可观测量**——两端伤害文本条数与累计扣血必须都 >0 且完全相等。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), damageNumbers: true }, [3000, null]],
  },
  {
    // 连锁伤害分支：spellCategoryId=5（电法师 连锁闪电）。
    name: 'spell-chain-lightning',
    make: () => withReclassedSpell(base, 3, 3, '连锁闪电'),
    // damageNumbers：本步改用逐帧采样伤害浮动文字（pattern ^-[0-9]+$），对每个伤害类法术给出
    // 与存档无关的**直接可观测量**——两端伤害文本条数与累计扣血必须都 >0 且完全相等。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), damageNumbers: true }, [3000, null]],
  },
  {
    // 落雨型范围伤害分支：spellCategoryId=6（电法师 闪电雨）。
    name: 'spell-rain-damage',
    make: () => withReclassedSpell(base, 3, 3, '闪电雨'),
    // damageNumbers：本步改用逐帧采样伤害浮动文字（pattern ^-[0-9]+$），对每个伤害类法术给出
    // 与存档无关的**直接可观测量**——两端伤害文本条数与累计扣血必须都 >0 且完全相等。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), damageNumbers: true }, [3000, null]],
  },
  {
    // 弹跳投射物分支：spellCategoryId=13（死灵法师 绿色死亡）。
    name: 'spell-bouncing-projectile',
    make: () => withReclassedSpell(base, 3, 9, '绿色死亡'),
    // damageNumbers：本步改用逐帧采样伤害浮动文字（pattern ^-[0-9]+$），对每个伤害类法术给出
    // 与存档无关的**直接可观测量**——两端伤害文本条数与累计扣血必须都 >0 且完全相等。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), damageNumbers: true }, [3000, null]],
  },
  {
    // 远程法术分支需要已装备的远程武器：原版与重构版的 createAttackAction 都把 equipment.projectileWeapon
    // 交给无空值保护的 getProjectileAnimation，因此改职业后要补回槽 61 的投射武器（itemTypeId 取自引擎注册表）。
    // 唯一的 td:false 定义：spellCategoryId=12（忍者 快速打击，槽 62 飞镖 → projectileAnimationId=3）。
    name: 'spell-deferred-strike',
    make: () => withEquippedItem(withReclassedSpell(base, 3, 8, '快速打击'), 3, '2081168329', '62', 8),
    // damageNumbers：本步改用逐帧采样伤害浮动文字（pattern ^-[0-9]+$），对每个伤害类法术给出
    // 与存档无关的**直接可观测量**——两端伤害文本条数与累计扣血必须都 >0 且完全相等。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }), damageNumbers: true }, [3000, null]],
  },
  {
    // 拾取分支：spellCategoryId=14（盗贼 立即搜索），一次收集本层全部金币/物品/卷轴/药水掉落。
    name: 'spell-instant-search',
    make: () => withEquippedItem(withReclassedSpell(base, 3, 7, '立即搜索'), 3, '41393542', '61', 7),
    // cat=14 立即搜索的直接可观测量：它会收集本层全部掉落，因此拾取统计必须真实增长。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, itemsFound: snap.statistics.itemsFound > base.statistics.itemsFound }) }, [3000, null]],
  },
  {
    // 宝箱发现分支：spellCategoryId=15（盗贼 发现财宝箱）→ hw.prototype.wu 置宝箱已发现。
    name: 'spell-find-chest',
    make: () => withEquippedItem(withReclassedSpell(base, 3, 7, '发现财宝箱'), 3, '41393542', '61', 7),
    // cat=15（发现财宝箱）的直接可观测量：财宝目标的 selected 旗标只有本法术与财宝房按钮
    // 两个写点（场景从不驱动按钮），且该法术的 AI 评分（behaviors.js getFinalScore）只在
    // "房间有未开启、未选中的财宝"时非零，故 selected 计数增长 ⟺ 法术真的发现并选中了财宝。
    // selected 不入存档，是存档差分之外的独立证据。（此前曾试过的 treasureChestsLooted 增长
    // 断言与此不同：是否开箱取决于 AI 是否走到箱子，order-dependent flaky，已按宁缺勿滥回退。）
    steps: [
      { turns: 0, selectedTreasure: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }) },
      [3000, null],
    ],
  },
  {
    // 复活分支：spellCategoryId=16（牧师 复活）要求场上已有昏迷的冒险者，昏迷只在 resolveCharacterDefeat 里产生。
    // 因此用随机首领药水提供致命敌人、把三名队友压到 1 级 1 血，并清空其他队员法术，
    // 使两端的 spellCastCount 增长只能归因于牧师的复活；stunned 断言证明前置确实达成。
    name: 'spell-resurrect',
    make: () => withResurrectionTrial(base, { casterIndex: 3, victimIndexes: [0, 1, 2] }),
    steps: [[1500, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, stunned: snap.statistics.characterStunnedCount > 0 })], [1500, null]],
  },
  {
    // 鸡群分支：spellCategoryId=17（鸡王 召唤鸡群）走 Math.random 概率选模板再 spawnMinion，
    // 召唤数写入存档统计 minionsSummoned，属于可直接对账的增长。
    name: 'spell-chicken-swarm',
    make: () => withReclassedSpell(base, 3, 11, '召唤鸡群'),
    // 召唤 + 伤害双重可观测：召唤数写入存档统计（minionsSummoned），同时逐帧采样伤害浮动文字
    // 直接对账「召唤出来的鸡真的在造成伤害」，两端条数与累计扣血都必须 >0 且完全相等。
    steps: [{ turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, summoned: snap.statistics.minionsSummoned > base.statistics.minionsSummoned }), damageNumbers: true }, [3000, null]],
  },
  {
    // 城堡征战与首领遭遇全流程：只剩最后一座城堡待攻克，队伍走进城堡，
    // 击溃守卫并在 5 号房间遭遇城堡首领（characterType=4），击杀首领产出浮动文字"击杀首领!"，
    // 随后从出口离开触发 iw() 征服尾部（解锁邻区、recordCastleConquered）与胜利瞬间。
    name: 'castle-victory',
    make: () => withCastleVictory(base),
    steps: [
      { turns: 15000, trackBoss: true, check: snap => ({
        victory: snap.gameWon === true && snap.victoryCount === 1
          && snap.statistics.castlesConquered === 1
          && snap.castleManager.castleStates.every(c => c.conquered),
      }) },
        { turns: 30, victoryPanel: 30 },
    ],
  },
  {
    name: 'combat-damage-numbers',
    // 伤害数字直接观测闭环：500 回合实战，harness 逐帧直接采样两端浮动文字层，
    // 对账负数伤害文本数量（57 次）与累计总伤害（-616 点），验证伤害计算、飘字挂载与文本序列全等。
    make: () => base,
    steps: [
      { turns: 500, damageNumbers: true },
    ],
  },
  {
    name: 'gold-windfall',
    make: () => withGold(base, 1000000),
    steps: [[600, null], [600, null]],
  },
  {
    name: 'upgrades-purchased',
    // U7：升级购买只有视图层入口。给足金币、经验和技能点，
    // 两端分别调用升级对象的同一购买方法，再验证三个升级族均实际改变。
    make: () => withExperience(withSkillPoints(withGold(base, 1000000), 5), 500000),
    steps: [
      { turns: 600, purchaseUpgrades: 60, check: upgradedSomething },
      { turns: 900, purchaseUpgrades: 60, check: upgradedSomething },
      { turns: 900 },
    ],
  },
  {
    name: 'monster-level-unlocked',
    // UnlockMonsterLevelUpgrade 同时要求击杀余额与队伍最低等级；经验值用于先购买角色等级。
    make: () => withKills(withExperience(withGold(base, 1000000), 500000), 1000000),
    steps: [
      { turns: 600, purchaseUpgrades: 60 },
      { turns: 900, purchaseUpgrades: 60, check: monsterLevelWasUnlocked },
      { turns: 900, check: monsterLevelWasUnlocked },
    ],
  },
  {
    name: 'monster-level-retired',
    // RetireMonsterLevelUpgrade (type=11) 要求 minUnlockedLevel < partyMinLevel 且 minUnlockedLevel < maxUnlockedLevel - 1。
    // 队伍先升级至 3+ 级并解锁怪物等级 2 与 3 (maxUnlockedLevel=3+)，随后退休怪物等级 1，minUnlockedLevel 升至 2。
    make: () => withKills(withExperience(withGold(base, 1000000), 500000), 1000000),
    steps: [
      { turns: 600, purchaseUpgrades: 60 },
      { turns: 900, purchaseUpgrades: 60 },
      { turns: 900, purchaseUpgrades: 60 },
      { turns: 900, purchaseUpgrades: 60, check: monsterLevelWasRetired },
      { turns: 900, check: monsterLevelWasRetired },
    ],
  },
  {
    name: 'combat-critical-hits',
    // 玩家暴击闭环：注入经验与技能点（60 点/人，四棵树 36 节点全竞争，20 点会被兄弟节点挤掉暴击节点），
    // 战士与游侠在 5 轮升级中解锁 7 个暴击几率技能（Fighter 4 档 + Ranger 3 档），
    // 随后在 1000 回合实战中直接采样“暴击!”浮动文字（两端同为 6 次，无技能时为 0），验证跳过护甲伤害与 RNG 顺序一致。
    make: () => withSkillPoints(withExperience(withGold(base, 1000000), 500000), 60),
    steps: [
      { turns: 300, purchaseUpgrades: 60 },
      { turns: 300, purchaseUpgrades: 60 },
      { turns: 300, purchaseUpgrades: 60 },
      { turns: 300, purchaseUpgrades: 60 },
      { turns: 300, purchaseUpgrades: 60, check: criticalHitSkillsLearned },
      { turns: 1000, floatingText: '暴击!', check: criticalHitSkillsLearned },
    ],
  },
  {
    name: 'skill-combat-effects',
    // 技能战斗效果层闭环：习得战士多重攻击（statType 18 extraAttackCount + 19 extraAttackChance，
    // 走 performMultiAttack 分支）与游侠跳弹（statType 23 chainCount + 24 chainChance，投射命中后
    // createChainAction 沿 Xs 链扩展），随后 1500 回合实战直接采样伤害飘字数量与总量——
    // 技能生效必然抬高攻击频次与弹跳次数，两端飘字计数/求和必须一致且 DTO 全等。
    make: () => withSkillPoints(withExperience(withGold(base, 1000000), 500000), 60),
    steps: [
      { turns: 300, purchaseUpgrades: 60 },
      { turns: 300, purchaseUpgrades: 60, check: attackSkillsLearned },
      { turns: 1500, damageNumbers: true, check: attackSkillsLearned },
    ],
  },
  {
    name: 'adventure-points-spent',
    // 击杀事件每次给 1 点；载入时按 count 重算余额，不直接篡改运行时可用点数。
    make: () => withPointPools(base, { 1: { points: 1000000, count: 1000000 } }),
    steps: [
      { turns: 600, purchasePointUpgrades: 1, check: pointUpgradeWasPurchased },
      { turns: 600, check: pointUpgradeWasPurchased },
    ],
  },
  {
    name: 'point-upgrades-multiple',
    // 一次性注入 5 亿冒险点（23 项总造价 164.5M），驱动购买全部 23 种点数升级，
    // 断言 settings.upgrades 中不同 upgradeId 的 purchasedLevels 超基线数量 >= 5 且两端相等。
    make: () => withPointPools(base, { 1: { points: 500000000, count: 500000000 } }),
    steps: [
      { turns: 600, purchasePointUpgrades: 23, check: multiplePointUpgradesPurchased },
      { turns: 600, check: multiplePointUpgradesPurchased },
    ],
  },
  {
    name: 'manual-equip-swap',
    // 手动装备交换：背包中的"金属的权杖"（slot 20，价值 30）手动装进当前装备"人民之美好的权杖"（slot 20，价值 13）
    // 的槽位；equipItem 把旧装备送回背包，Qk 包装器发 itemEquipped 点数事件（type 21）。
    // turns=0 立即执行，避免自然掉落移动背包索引。
    make: () => base,
    steps: [
      { turns: 0, equipFromInventory: { charIndex: 0, itemName: '金属的权杖' }, check: manualEquipSwapped },
      // 第二步只跑自然推进做 DTO 全等：600 回合内商店会卖掉换下的旧装备，
      // 交换状态断言只在装备动作后立即做（第一步）。
      { turns: 600 },
    ],
  },
  {
    name: 'class-barbarian-growth',
    // 职业装载闭环：职业表不存在职业 5（12 个正式职业 + Monster/Scroll Character 两个特殊类型）；
    // 默认阵容已含职业 0/2/6/4，法术场景装载 3/7/8/9/10/11——唯一从未装载的正式职业是 1（野蛮人）。
    // 本场景把队员 3（火法师）改为野蛮人并补上职业匹配的槽 21 锤类武器（itemTypeId = hash("锤"+sprite)），
    // 驱动四棵职业专属技能树购买（含 LearnSpellUpgrade 学会 重锤/愤怒）与等级成长，再自然战斗推进。
    make: () => withSkillPoints(
      withExperience(withGold(withCharacterClass(withEquippedItem(base, 3, -1496887723, '21', 1), 3, 1), 1000000), 500000),
      20),
    steps: [
      { turns: 300, purchaseUpgrades: 60 },
      { turns: 300, purchaseUpgrades: 60 },
      { turns: 300, purchaseUpgrades: 60, check: barbarianGrew },
      { turns: 1000, check: barbarianGrew },
    ],
  },
  {
    name: 'castle-attack-planned',
    // type=13"攻击城堡"（原版 ms）没有金币花费——购买即把城堡 attackScheduled 置 true，
    // 门控是 maxUnlockedLevel >= requiredMonsterLevel 而非金币；验收矩阵"城堡"行的
    // "购买/进攻花费"提法系旧账误记。场景把唯一未锁城堡摆成可进攻态（地牢清空），
    // 经 quickUpgradeCollection 里 4 个 itemPurchaseUpgrades 槽驱动购买，随后自然推进。
    make: () => withAttackableCastle(base),
    steps: [
      { turns: 0, purchaseUpgrades: 60, check: castleAttackPlanned },
      { turns: 900, check: castleAttackPlanned },
    ],
  },
  {
    name: 'achievement-claimed',
    // 原版 fixture 已有 monsterKills100 obtained=true/applied=false，无需制造不可能的成就状态。
    make: () => base,
    steps: [
      { turns: 600, claimAchievement: true, check: achievementWasClaimed },
      { turns: 600, check: achievementWasClaimed },
    ],
  },
  {
    name: 'achievement-rewards-multiple',
    // 成就奖励机制闭环：全部 328 项成就的奖励是同一机制 increasePointEventReward(typeId, Vt)，
    // 差别只在事件类型与点数。把 8 个未获得成就置为"已达成未领取"（优先击杀类），
    // 驱动 4 个领取槽多轮刷新领取（limit 8），断言 applied 至少增长 3 且击杀事件奖励行
    // pointsByType[1].points（= reward × count，count 注入 1,000,000）真实抬升。
    make: () => withPointPools(withClaimableAchievements(base, 8), { 1: { points: 1000000, count: 1000000 } }),
    steps: [
      { turns: 0, claimAchievement: 8, check: multipleAchievementsClaimed },
      { turns: 600 },
    ],
  },
  {
    name: 'achievement-threshold-below',
    // 成就进度临界值下侧：farmsPurchased=4 < requiredCount 5 → farmsPurchased5 必须仍未获得；
    // 同一场景里 doorsOpened=100000 恰好达标 → doorsOpened100K 必须已获得（正对照，
    // 证明成就检查节拍确实执行过，负断言不是因为"根本没跑"）。
    make: () => withAchievementThresholds(base, { farmsPurchased: 4, doorsOpened: 100000 }),
    steps: [
      { turns: 40, check: achievementThresholdBelow },
      { turns: 200, check: achievementThresholdBelow },
    ],
  },
  {
    name: 'achievement-threshold-met',
    // 同一临界值的上侧：farmsPurchased=5 恰好达标。与上一条配对，构成 requiredCount 两侧的差分；
    // 两端各自的 obtained 必须与期望一致，再比对完整存档。
    make: () => withAchievementThresholds(base, { farmsPurchased: 5, doorsOpened: 100000 }),
    steps: [
      { turns: 40, check: achievementThresholdMet },
      { turns: 200, check: achievementThresholdMet },
    ],
  },
  {
    name: 'auto-equipped',
    // fixture 每人背包里已有强于当前装备的物品；原版/重构版走同一个升级 type=4。
    make: () => base,
    steps: [
      { turns: 0, equipBestItems: true, check: equipmentChanged },
      { turns: 900, check: equipmentChanged },
    ],
  },
  {
    name: 'spell-visual-effects',
    // 法术视觉特效直接对账：特效池不入存档 DTO，是差分盲区（facts#41 同类）。harness
    // countVisualEffects 逐帧差分采样池内 VisualEffect.impactEffectName（创建次序=战斗事件次序），
    // 火法师装载火球术（cat=2 弹射投射）自然施法 3000 回合，断言两端特效总数/逐类计数/顺序一致。
    make: () => withClassSpell(base, 4, '火球术'),
    steps: [
      { turns: 3000, spellEffects: true },
      { turns: 1000, spellEffects: true },
    ],
  },
  {
    name: 'scroll-cast-in-combat',
    // 全 6 类卷轴（休克、蛛网、箭矢、火雨、闪电、火球）：活怪物存在时逐一施放，断言使用统计真实增长与两端状态等价
    make: () => withScrolls(base, [
      { scrollId: 'shockScroll', count: 10 },
      { scrollId: 'spiderWebScroll', count: 10 },
      { scrollId: 'arrowScroll', count: 10 },
      { scrollId: 'fireRainScroll', count: 10 },
      { scrollId: 'chainedLightningScroll', count: 10 },
      { scrollId: 'fireBallScroll', count: 10 },
    ]),
    steps: [
      { castScrollDuringCombat: 3000, scrollId: 'shockScroll', check: scrollWasCast },
      { castScrollDuringCombat: 3000, scrollId: 'spiderWebScroll', check: scrollWasCast },
      { castScrollDuringCombat: 3000, scrollId: 'arrowScroll', check: scrollWasCast },
      { castScrollDuringCombat: 3000, scrollId: 'fireRainScroll', check: scrollWasCast },
      { castScrollDuringCombat: 3000, scrollId: 'chainedLightningScroll', check: scrollWasCast },
      { castScrollDuringCombat: 3000, scrollId: 'fireBallScroll', check: scrollWasCast },
      { turns: 900, check: scrollWasCast },
    ],
  },
  {
    name: 'dungeon-farm-purchased',
    // 城堡已征服、对应地牢已清、金币足够；购买后实体与统计必须真正落盘。
    make: () => withGold(withFarmableDungeon(base), 1000000),
    steps: [
      { turns: 0, purchaseDungeonFarm: true, check: farmWasPurchased },
      { turns: 900, check: farmWasPurchased },
    ],
  },
  {
    name: 'dungeon-row-farm-purchased',
    // 地牢列表行直接持有 PurchaseDungeonUpgrade，不在全局 upgradeCollections 中。
    make: () => withGold(withFarmableDungeon(base), 1000000),
    steps: [
      { turns: 0, purchaseDungeonRowFarm: true, check: farmWasPurchased },
      { turns: 900, check: farmWasPurchased },
    ],
  },
  {
    name: 'treasure-chest-looted',
    make: () => base,
    steps: [
      { lootTreasureDuringExplore: 15000, check: treasureWasLooted },
      { turns: 900, check: treasureWasLooted },
    ],
  },
  {
    name: 'weapon-rack-looted',
    make: () => base,
    steps: [
      { lootTreasureDuringExplore: 30000, treasureKind: 2, check: weaponRackWasLooted },
      { turns: 900, check: weaponRackWasLooted },
    ],
  },
  {
    name: 'bookcase-looted',
    // 书架生成稀疏且随迷宫布局变化：场景组合一变（新场景插入会移动全局随机流位置），
    // 30000 帧窗口可能恰好停在无书架可搜的布局上（全矩阵两次 53/53 绿后第三次失败即此因）。
    // 与 ground-drops 的跨场景流漂移同型，加宽探索窗口降低布局敏感度。
    make: () => base,
    steps: [
      { lootTreasureDuringExplore: 60000, treasureKind: 3, check: bookcaseWasLooted },
      { turns: 900, check: bookcaseWasLooted },
    ],
  },
  {
    name: 'ground-drops-collected',
    // fixture 四人均无已学法术，不会走“立即搜索”旁路；9/10/11/12 四种点数事件分别对应常规金币/卷轴/药水/物品拾取。
    make: () => {
      assert.ok(base.adventurers.every(a => (a.spells?.length ?? 0) === 0), '地面掉落场景的 fixture 不得带已学法术');
      return base;
    },
    steps: [
      // 全量矩阵下前序场景的 RNG 漂移会让某类掉落在 9000 回合窗口内恰好缺采样；
      // 15000 回合的长视野只降低漏采样概率，不改变“自然行走拾取四类掉落”的场景语义。
      { turns: 15000, check: groundDropsWereCollected },
      { turns: 15000, check: groundDropsWereCollected },
    ],
  },
  {
    name: 'dungeon-farm-harvested',
    // 购买农场后推演 1300 回合（>1200 回合生产周期），通过 AutoPurchaseDungeonUpgrade（type=9）收获产出并清零
    make: () => withGold(withFarmableDungeon(base), 1000000),
    steps: [
      { turns: 0, purchaseDungeonFarm: true, check: farmWasPurchased },
      { turns: 1300, harvestFarmKills: true, check: farmWasHarvested },
      { turns: 500, check: farmWasHarvested },
    ],
  },
  {
    name: 'dungeon-farm-cycle-long-term',
    // 长期周期跨越：购买 -> 1200+回合成熟收获 -> 再跨越 1500 回合再侵袭(cleared=false) -> 再次成熟(1200回合)二次收获
    make: () => withGold(withFarmableDungeon(base), 1000000),
    steps: [
      { turns: 0, purchaseDungeonFarm: true, check: farmWasPurchased },
      { turns: 1300, harvestFarmKills: true, check: farmWasHarvested },
      { turns: 1600 },
      { turns: 1300, harvestFarmKills: true, check: farmCycleAdvanced },
    ],
  },
  {
    name: 'rendered-scene-narrow',
    // Canvas 多视口：700px 窄视口下 1300 帧真实帧循环（含 view.render），
    // 逐像素 FNV 指纹与落盘存档断言同 rendered-scene；画布分辨率随视口变化，
    // 两端仍须逐像素一致。与 E2E 的 1440/1024/375 三档 DOM 检查互补。
    make: () => base,
    viewport: { width: 700, height: 900 },
    steps: [
      { frames: 1300 },
    ],
  },
  {
    name: 'autosave-payload',
    // 自动保存计时分支 + 落盘字节比对：两端跑同样的真实帧循环，比较写进 localStorage 的原文。
    make: () => base,
    steps: [
      { frames: 1300 },
    ],
  },
  {
    name: 'potions-activated',
    // U7：三瓶未激活药水入库 → 推进 → 直接驱动 Potion.activate（视图层唯一入口）→ 再推进差分。
    make: () => withPotions(base, ['doubleGold', 'doubleKills', 'walkingSpeed']),
    steps: [
      { turns: 300, activatePotions: 3, check: potionWasUsed },
      [600, null],
    ],
  },
  {
    name: 'background-progress-disabled',
    // allowBackgroundProgress（inactiveTabProcessingEnabled）为假时，
    // 标签页切出后即使时钟发生 >1000ms 大间隙（frameGap=5000ms），两端也严格不进入离线追赶
    make: () => withBackgroundProcessing(base, false),
    steps: [
      { frameGap: 5000, check: backgroundProgressWasDisabled },
      { turns: 300, check: backgroundProgressWasDisabled },
    ],
  },
  {
    name: 'late-horizon',
    make: () => withTurns(base, base.turnNumber + 1000000),
    steps: [[500, null], [500, null]],
  },
  {
    name: 'veteran-run',
    make: () => withVictories(base, 3),
    steps: [[600, null], [600, null]],
  },
  {
    // 胜利重置：保留统计、清空当前冒险状态、立即回写存档
    name: 'prestige-restart',
    make: () => base,
    restart: true,
    steps: [[300, null], [300, null]],
  },
  {
    // 完全重置：回到开局状态（比较重置后的完整存档）
    name: 'full-reset',
    make: () => base,
    reset: true,
    steps: [[1, null]],
  },
  {
    // P-3 远古稀有度：itemRarityProbabilities 的远古档概率 4E-4，固定 LCG 下从未自然命中，
    // recordItemFound 的 case 4 因此从未被驱动。两端各自用己方 generateItem 构造一件
    // 合法 rarity=4 物品作为真实地面掉落放进队员所在房间，由原版 AI 认领→拾取路径
    // （TravelWorldBehavior → actionType 6 → character.js recordItemFound）驱动统计；
    // 拾取后完整 DTO 差分（远古物品会以一致字段进入同一队员的 inventory）。
    // 第二步证明统计落盘后稳定。追加在矩阵末尾，不扰动既有场景的采样窗口。
    name: 'ancient-item-found',
    make: () => base,
    steps: [
      { turns: 0, seedAncientItemDrop: { maxTurns: 4000, rarity: 4 }, check: ancientItemWasFound },
      { turns: 900, check: ancientItemWasFound },
    ],
  },
  {
    // P-7 Canvas 多视口：1920×1080 宽视口（既有覆盖为默认与 700×900）下 1300 帧真实帧循环，
    // 逐像素 FNV 指纹与落盘存档断言同 rendered-scene。追加在矩阵末尾，不扰动既有场景。
    name: 'rendered-scene-wide',
    make: () => base,
    viewport: { width: 1920, height: 1080 },
    steps: [
      { frames: 1300 },
    ],
  },
  {
    // P-7 Canvas 多视口：375×667 最小视口（与 E2E 的 375 档 DOM 检查同宽）。
    // 布局最紧凑、面板堆叠最极端时两端仍须逐像素一致。
    name: 'rendered-scene-tiny',
    make: () => base,
    viewport: { width: 375, height: 667 },
    steps: [
      { frames: 1300 },
    ],
  },
  {
    // 差分原版正常开局路径（U132 补课，阶段 3 验收项）：harness 内部先 reset 到两端一致的
    // 空白态（full-reset 场景已证空白 DTO 全等），再用**镜像字段写入**驱动各自的原生开局
    // 闭包——原版 Az 控制器（Vb/Ww/$i，c2.js:26306-26312、onclick 26363-26414）↔ 重构
    // PartyCreationView（selectedCharacters/validParty/startButton）——以同一份 4 人阵容建队，
    // 推进 300 回合做完整 DTO 差分；第二步证明队伍可持续演进且两端仍逐检查点相等。
    name: 'party-creation-differential',
    make: () => base,
    steps: [
      { turns: 0, createPartyFromBlank: { members: [
        { classIndex: 0, defaultName: '远征队长' },
        { classIndex: 1, defaultName: '圣光' },
        { classIndex: 2, defaultName: '猎风' },
        { classIndex: 3, defaultName: '霜语' },
      ], turns: 300 }, check: createdPartyMatches },
      { turns: 900, check: createdPartyMatches },
    ],
  },
  {
    // P-1 主动族切片：鸡王几率技能（statType 30，25%）。
    // 购买 barbarianChanceChickenKing（鸡王技能树4末位，actions.js:172 消费 stats.barbarianChickenChance）
    // 后，召唤鸡群（cat=17）每次施法生成小鸡时以 25% 掷出"野蛮人小鸡!"——浮动文字直接对账
    // 几率技能的战斗效果；固定 LCG 下两端各自购买→施法→掷骰，条数必须 >0 且相等。
    // 几率位写进 upgrades4（DTO）+ 施法计数归因 + 完整存档差分兜底。
    name: 'skill-chicken-king-barbarian-chance',
    // 全员改鸡王并注入召唤鸡群：4 倍施法频次让 25% 几率掷骰在固定 LCG 下有足够的
    // 确定性采样量（单角色 6000 回合仅 2 次施法、0 命中的坏运气实测过）。
    make: () => withSkillPoints([0, 1, 2, 3].reduce((acc, i) => withReclassedSpell(acc, i, 11, '召唤鸡群'), base), 12),
    steps: [
      { turns: 0, purchaseCharacterSkill: { charIndex: [0, 1, 2, 3], skillId: 'barbarianChanceChickenKing' }, check: chickenChanceSkillOwned },
      { turns: 6000, floatingText: '野蛮人小鸡!', check: chickenChanceSkillConsumed },
      { turns: 900, check: chickenChanceSkillConsumed },
    ],
  },
  {
    // P-1 被动族切片：战士快速攻击 I-III（statType 10，各 -2 冷却）。
    // 定向购买 fasterAttacksFighter3 连带购入前置链（AR1→FA1→AR2→FA2→暴击4→AR3→FA3），
    // 只读观察战斗节奏公式 getAttackCooldown（stats.js:40）的输出：
    // reduction 0→6、有效冷却 12→6——这正是 character.js:134 canAttack 判定攻击时机用的同一个值。
    // 随后 1500 回合自然战斗做完整 DTO 差分。
    name: 'skill-faster-attacks-cooldown',
    make: () => withSkillPoints(base, 12),
    steps: [
      { turns: 0, readAttackCooldownProbe: { charIndex: 0, expectReduction: 0, expectCooldown: 12 } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 0, skillId: 'fasterAttacksFighter3' }, check: fighterCooldownSkillOwned },
      { turns: 0, readAttackCooldownProbe: { charIndex: 0, expectReduction: 6, expectCooldown: 6 } },
      { turns: 1500 },
    ],
  },
  {
    // U133 主线二（U132 开局切片的对抗性复核）：同一份 4 人简单姓名阵容，
    // 原版端走遗留按钮闭包（原版无产品入口），重构端走产品 adapter.startParty
    // （校验→escapeName→PartyCreationView.prototype.startParty→paused=false）。
    // runner 的两端完整 DTO 相等断言给出「重构产品入口 ≡ 原版遗留入口」；
    // 与 party-creation-differential（重构遗留 ≡ 原版遗留）串联即得
    // 「重构产品入口 ≡ 重构遗留入口」，排除 U132 切片改变开局行为的反例。
    // 姓名取无可转义字符的简单中文名，escapeName 为恒等，两侧选择数组逐字段同构。
    name: 'party-entry-product-differential',
    make: () => base,
    steps: [
      { turns: 0, createPartyFromBlank: { mode: 'product', members: [
        { classIndex: 0, defaultName: '远征队长' },
        { classIndex: 1, defaultName: '圣光' },
        { classIndex: 2, defaultName: '猎风' },
        { classIndex: 3, defaultName: '霜语' },
      ], turns: 300 }, check: createdPartyMatches },
      { turns: 900, check: createdPartyMatches },
    ],
  },
  {
    // P-7 游戏内状态对照：法术特效密集战斗（3 号队员改火法师并装载"闪电雨"）。
    // spellCast 检查先断言两端都真的进入"法术高频释放"状态，再 1300 帧逐像素指纹——
    // 与 rendered-scene 的自然战斗相比，这是法术特效池高负载的另一种渲染状态。
    // 指纹对任何渲染差异敏感；若真有差异属于缺陷，不改指纹或容差。
    // （曾尝试随机首领药水 + trackBoss：15000 回合长窗受团灭重开、药水背包容量与
    //   点数升级赠药等 order-dependent 机制叠加影响，按否决条款放弃该变体，
    //   取证过程见 output/overnight-u133/progress.md CP4。）
    // P-1 被动族切片（statType 2/6 增益族，覆盖 132+ 条定义中的代表）：
    // 战士树 1 前置链购买 improvedDamageFighter3 连带 dmg1(+10%)/hp1(+20%)/dmg2(+10%)/
    // hp2(+20%)/暴击2/dmg3(+10%)。只读探针直读 statValue 组合值（stats.js:14，全部战斗公式的输入）：
    // damage 27→29（+30%）、maxHealth 按 +40% 公式期望——期望值全部由 fixture 分量推导，非抄实现。
    name: 'skill-improved-damage-statvalue',
    make: () => withSkillPoints(base, 12),
    steps: [
      { turns: 0, statValueProbe: { charIndex: 0, component: 'damage', expectSkillBonus: 0, expectValue: statValueOf(0, 'damageComponent', 0) } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 0, skillId: 'improvedDamageFighter3' }, check: fighterCooldownSkillOwned },
      { turns: 0, statValueProbe: { charIndex: 0, component: 'damage', expectSkillBonus: 30, expectValue: statValueOf(0, 'damageComponent', 30) } },
      { turns: 0, statValueProbe: { charIndex: 0, component: 'maxHealth', expectSkillBonus: 40, expectValue: statValueOf(0, 'maxHealthComponent', 40) } },
      { turns: 1200 },
    ],
  },
  {
    // P-1 被动族切片（statType 26 召唤上限）：largerFlockChickenKing 每级 +1。
    // 只读探针直读 stats.maxSummonedMinions（原版 gl）：鸡王默认上限 1（DEFAULT_MINION_LIMIT），
    // 购买 largerFlockChickenKing1（树 2 前置链含 LearnSpell 召唤鸡群——withReclassedSpell 已注入
    // 同名法术，实现侧 purchased 守卫会安全跳过）后上限 2。消费点 behaviors.js:1418,1462。
    // P-1 被动族切片（statType 3/4/5）：战士树 1/4/3 三条前置链分别购买
    // improvedArmorFighter3 / improvedAttackRatingFighter3 / improvedDefenseRatingFighter3
    // （各 +10%×3）。只读探针直读 statValue：armor/attackRating/defenceRating 三个组合值
    // 按各自 +30% 公式期望变化，期望由 fixture 独立推导。
    name: 'skill-improved-combat-stat-bonuses',
    make: () => withSkillPoints(base, 60),
    steps: [
      { turns: 0, statValueProbe: { charIndex: 0, component: 'armor', expectSkillBonus: 0, expectValue: statValueOf(0, 'armorComponent', 0) } },
      { turns: 0, statValueProbe: { charIndex: 0, component: 'attackRating', expectSkillBonus: 0, expectValue: statValueOf(0, 'attackRatingComponent', 0) } },
      { turns: 0, statValueProbe: { charIndex: 0, component: 'defenceRating', expectSkillBonus: 0, expectValue: statValueOf(0, 'defenceRatingComponent', 0) } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 0, skillId: 'improvedArmorFighter3' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 0, skillId: 'improvedAttackRatingFighter3' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 0, skillId: 'improvedDefenseRatingFighter3' } },
      { turns: 0, statValueProbe: { charIndex: 0, component: 'armor', expectSkillBonus: 30, expectValue: statValueOf(0, 'armorComponent', 30) } },
      { turns: 0, statValueProbe: { charIndex: 0, component: 'attackRating', expectSkillBonus: 30, expectValue: statValueOf(0, 'attackRatingComponent', 30) } },
      { turns: 0, statValueProbe: { charIndex: 0, component: 'defenceRating', expectSkillBonus: 30, expectValue: statValueOf(0, 'defenceRatingComponent', 30) } },
      { turns: 1200 },
    ],
  },
  {
    // P-1 被动族切片（statType 8/7）：生命回复与法力上限。
    // member 0（战士）买 improvedDefenseRatingFighter3 前置链附带 healthRegenerationFighter1/2
    // （statType 8，各 +1）→ healthRegenBonus 0→2，消费点 tick.js:42 每 3 回合回复公式；
    // member 1（牧师）买 improvedSpiritPriest2 前置链（spirit1/2 各 +20）→ maxSpirit
    // skillBonusPercent 0→40，statValue 探针（statType 7 走分量公式）。两端各自购买+探针，
    // 完整 DTO 差分兜底。
    name: 'skill-regen-spirit-bonuses',
    make: () => withSkillPoints(base, 60),
    steps: [
      { turns: 0, readRegenProbe: { charIndex: 0, expectBonus: 0 } },
      { turns: 0, statValueProbe: { charIndex: 1, component: 'maxSpirit', expectSkillBonus: 0, expectValue: statValueOf(1, 'maxSpiritComponent', 0) } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 0, skillId: 'improvedDefenseRatingFighter3' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 1, skillId: 'improvedSpiritPriest2' } },
      { turns: 0, readRegenProbe: { charIndex: 0, expectBonus: 2 } },
      { turns: 0, statValueProbe: { charIndex: 1, component: 'maxSpirit', expectSkillBonus: 40, expectValue: statValueOf(1, 'maxSpiritComponent', 40) } },
      { turns: 1200 },
    ],
  },
  {
    // P-1 被动族切片（statType 11-15 法术强度）：牧师五条前置链分别购买
    // improvedHealingSpell(11)/improvedDamageSpell(12)/improvedArmorSpell(13)/
    // improvedAttackRatingSpell(14)/improvedDefenseRatingSpell(15)（各 +2）。
    // 只读探针直读五个增益强度字段（actions.js:94,131,134,137,140 治疗/增益量公式的输入）。
    name: 'skill-priest-spell-potencies',
    make: () => withSkillPoints(base, 60),
    steps: [
      { turns: 0, buffPotencyProbe: { charIndex: 1, expect: {} } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 1, skillId: 'improvedHealingSpellPriest' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 1, skillId: 'improvedDamageSpellPriest' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 1, skillId: 'improvedArmorSpellPriest' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 1, skillId: 'improvedAttackRatingSpellPriest' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 1, skillId: 'improvedDefenseRatingSpellPriest' } },
      { turns: 0, buffPotencyProbe: { charIndex: 1, expect: { heal: 2, damage: 2, armor: 2, attackRating: 2, defenceRating: 2 } } },
      { turns: 1200 },
    ],
  },
  {
    // P-1 被动族（statType 1 伤害抵抗）：战士树 1 全链购买 ignoreDamageFighter1-4（各 +10），
    // damageResistance 0→40；消费点 actions.js:587（伤害计算减伤）。
    // P-1 主动族（statType 31 忍者小鸡几率）：与 30 同构——全员鸡王只购
    // ninjaChanceChickenKing（25%，不购 barbarian/rogue 几率以免级联竞争），
    // 召唤鸡群生成小鸡时掷出"忍者小鸡!"（actions.js:176，消费 stats.ninjaChickenChance）。
    name: 'skill-ninja-chance-chicken',
    make: () => withSkillPoints([0, 1, 2, 3].reduce((acc, i) => withReclassedSpell(acc, i, 11, '召唤鸡群'), base), 60),
    steps: [
      { turns: 0, purchaseCharacterSkill: { charIndex: [0, 1, 2, 3], skillId: 'ninjaChanceChickenKing' } },
      { turns: 12000, floatingText: '忍者小鸡!', },
    ],
  },
  {
    // P-1 主动族（statType 32 盗贼小鸡几率）：与上同构，目标文本"盗贼小鸡!"。
    // 单独购买 rogueChance（不与 31/30 共投）→ 级联无竞争，盗贼分支 25%/次施法。
    name: 'skill-rogue-chance-chicken',
    make: () => withSkillPoints([0, 1, 2, 3].reduce((acc, i) => withReclassedSpell(acc, i, 11, '召唤鸡群'), base), 60),
    steps: [
      { turns: 0, purchaseCharacterSkill: { charIndex: [0, 1, 2, 3], skillId: 'rogueChanceChickenKing' } },
      { turns: 12000, floatingText: '盗贼小鸡!', },
    ],
  },
  {
    // P-1 被动族（statType 1 伤害抵抗）：战士树 1 全链购买 ignoreDamageFighter1-4（各 +10），
    // damageResistance 0→40；消费点 actions.js:587（伤害计算减伤）。
    // U7 长尾（ScrollUpgrade，type 12）：卷轴升级购买只有 quickUpgradeCollection 的
    // scrollUpgrades 行可达（refresh→canPurchase→purchase，需要解锁卷轴 + 施法者等级门槛 + 金币）。
    // 购买后 DTO 的 scrollInventory[].upgradeCount 增长，两端各自断言 + 完整差分。
    name: 'scroll-upgrades-purchased',
    make: () => {
      const s = withGold(withScrolls(base, [
        { scrollId: 'shockScroll', count: 99 },
        { scrollId: 'spiderWebScroll', count: 99 },
        { scrollId: 'arrowScroll', count: 99 },
        { scrollId: 'fireRainScroll', count: 99 },
        { scrollId: 'chainedLightningScroll', count: 99 },
        { scrollId: 'fireBallScroll', count: 99 },
      ]), 100000000);
      for (const a of s.adventurers) a.characteristicsComponent.characterLevel = 99;
      return s;
    },
    steps: [
      { turns: 0, purchaseUpgrades: 80, check: scrollUpgradePurchased },
      { turns: 600 },
    ],
  },
  {
    // P-1 被动族（statType 16 施法花费缩减）：直读 getSpellSpiritCost 公式输出
    //（stats.js:52；原版 bu，c2.js:21284-21286）。牧师（6）购买 spellCostPriest2
    //（前置链含 spellCostPriest1，各 +10）→ reduction 0→20，公式输出 base-floor(20%×base)，
    // 上限 statValue(maxSpirit)。与战斗决策同源：施法可施性判定使用同一函数。
    name: 'skill-spellcost-reduction-probe',
    make: () => withSkillPoints(withReclassedSpell(base, 1, 6, '治疗'), 60),
    steps: [
      { turns: 0, spellCostProbe: { charIndex: 1, expectReduction: 0 } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 1, skillId: 'spellCostPriest2' } },
      { turns: 0, spellCostProbe: { charIndex: 1, expectReduction: 20 } },
      { turns: 600 },
    ],
  },
  {
    // P-5 边界值变异矩阵（U133 第二批）：越界/极值赋值——负回合数、负卷轴库存、
    // 超大胜利数、负冒险点。两端同接受（继续推进 DTO 全等）或同拒绝。
    name: 'save-boundary-values-matrix',
    make: () => base,
    steps: [
      { loadSave: { save: withFieldValues(base, [['turnNumber', -5]]), turns: 200, expectReject: false }, check: robustnessLoadedOk },
      { loadSave: { save: withFieldValues(base, [['scrollInventory.0.count', -1]]), turns: 200, expectReject: false }, check: robustnessLoadedOk },
      { loadSave: { save: withFieldValues(base, [['victoryCount', 1000000]]), turns: 200, expectReject: false }, check: robustnessLoadedOk },
      { loadSave: { save: withFieldValues(base, [['pointManagerState.spentAdventurePoints', -50]]), turns: 200, expectReject: false }, check: robustnessLoadedOk },
      { loadSave: { save: withFieldValues(base, [['dungeonManagerState.dungeonStates.0.levelCount', 999]]), turns: 200, expectReject: false }, check: robustnessLoadedOk },
    ],
  },
  {
    // P-1 被动族（statType 1 伤害抵抗）：战士树 1 全链购买 ignoreDamageFighter1-4（各 +10），
    // damageResistance 0→40；消费点 actions.js:587（伤害计算减伤）。
    // P-7 游戏内状态对照（农场）：购买农场后进入农场主题地牢（G2_Town01 贴纸、农场装饰、
    // 成熟期作物状态），与自然地牢渲染状态显著不同。购买步骤断言农场真实购得（farms 增长），
    // 随后 1300 帧逐像素指纹两端一致。追加在矩阵末尾，不扰动既有场景。
    name: 'rendered-scene-farm',
    make: () => withGold(withFarmableDungeon(base), 1000000),
    steps: [
      { turns: 0, purchaseDungeonFarm: true, check: farmWasPurchased },
      { turns: 600 },
      { frames: 1300 },
    ],
  },
  {
    name: 'skill-ignore-damage-resistance',
    make: () => withSkillPoints(withCharacterClass(base, 0, 0), 60),
    steps: [
      { turns: 0, skillFieldProbe: { charIndex: 0, expect: { damageResistance: 0 } } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 0, skillId: 'ignoreDamageFighter4' } },
      { turns: 0, skillFieldProbe: { charIndex: 0, expect: { damageResistance: 40 } } },
      { turns: 1200 },
    ],
  },
  {
    // P-1 被动族（statType 9 精神回复 / 16 施法花费缩减）：牧师（6）。
    // spiritRegenerationPriest1 的前置链（tree4 idx0-5）同时包含 spellCostPriest1/2（各 +10）→
    // spellCostReduction 0→20（stats.js:52 施法花费公式输入）；spiritRegenBonus 0→1（tick.js:47）。
    name: 'skill-priest-spellcost-spiritregen',
    make: () => withSkillPoints(withCharacterClass(base, 1, 6), 60),
    steps: [
      { turns: 0, skillFieldProbe: { charIndex: 1, expect: { spellCostReduction: 0, spiritRegenBonus: 0 } } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 1, skillId: 'spellCostPriest2' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 1, skillId: 'spiritRegenerationPriest1' } },
      { turns: 0, skillFieldProbe: { charIndex: 1, expect: { spellCostReduction: 20, spiritRegenBonus: 1 } } },
      { turns: 1200 },
    ],
  },
  {
    // P-1 被动族（statType 20 睡眠/蛛网目标 + 21 连锁闪电弧 + 22 闪电雨范围）：电法师（3）。
    // improvedSpiderWeb3 链 → controlTargetBonus 0→5（character.js:900 睡眠目标数公式）；
    // improvedChainLightning3 链 → chainArcBonus 0→6（character.js:513 连锁闪电弧数）；
    // improvedLightningRain2 链 → rainAreaBonus 0→2（character.js:586 闪电雨范围）。
    name: 'skill-electromancer-control-chain-rain',
    make: () => withSkillPoints(withCharacterClass(base, 2, 3), 60),
    steps: [
      { turns: 0, skillFieldProbe: { charIndex: 2, expect: { controlTargetBonus: 0, chainArcBonus: 0, rainAreaBonus: 0 } } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 2, skillId: 'improvedSpiderWebMageElectric3' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 2, skillId: 'improvedChainLightningMageElectric3' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 2, skillId: 'improvedLightningRainMageElectric2' } },
      { turns: 0, skillFieldProbe: { charIndex: 2, expect: { controlTargetBonus: 5, chainArcBonus: 6, rainAreaBonus: 2 } } },
      { turns: 1200 },
    ],
  },
  {
    // P-1 被动族（statType 22 火雨范围 / 25 火球半径 / 27 转变目标）：火法师（4）。
    // improvedFireRain2 链 → rainAreaBonus 0→2（character.js:586）；improvedFireball2 链 →
    // areaRadiusBonus 0→2（character.js:677、tick.js:300，+1/级）；improvedTurnMonsters3 链 →
    // transformTargetBonus 0→5（character.js:902 转变目标数）。
    name: 'skill-pyromancer-area-transform-rain',
    make: () => withSkillPoints(withCharacterClass(base, 3, 4), 60),
    steps: [
      { turns: 0, skillFieldProbe: { charIndex: 3, expect: { rainAreaBonus: 0, areaRadiusBonus: 0, transformTargetBonus: 0 } } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 3, skillId: 'improvedFireRainMageFire2' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 3, skillId: 'improvedFireballMageFire2' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 3, skillId: 'improvedTurnMonsters3' } },
      { turns: 0, skillFieldProbe: { charIndex: 3, expect: { rainAreaBonus: 2, areaRadiusBonus: 2, transformTargetBonus: 5 } } },
      { turns: 1200 },
    ],
  },
  {
    // P-1 被动族（statType 28 迅捷打击链长 / 29 绿死弹射次数）：
    // member 0 改忍者（8）：swiftStrikeUpgradeNinja2 前置链 → swiftStrikeTargetBonus 0→2
    //（character.js:857 链长公式）；member 1 改死灵（9）：greenDeathRicochetCountNecromancer3
    // 前置链 → ricochetCountBonus 0→3（character.js:878 弹射次数公式）。
    name: 'skill-swiftstrike-ricochet-field-probes',
    // 如实边界：改职成员无职业匹配武器，长窗推进会在战斗中触发 R4 已知的空投射武器
    // 缺陷路径（两端同点同错，evaluate 直接抛错）——故本场景只做 turns:0 的
    // 「购买 → 字段直读探针」，不推进战斗；写入侧证据成立，消费点为静态引用
    //（character.js:857/878）。
    make: () => withSkillPoints(withCharacterClass(withCharacterClass(base, 0, 8), 1, 9), 60),
    steps: [
      { turns: 0, skillFieldProbe: { charIndex: 0, expect: { swiftStrikeTargetBonus: 0 } } },
      { turns: 0, skillFieldProbe: { charIndex: 1, expect: { ricochetCountBonus: 0 } } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 0, skillId: 'swiftStrikeUpgradeNinja2' } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 1, skillId: 'greenDeathRicochetCountNecromancer3' } },
      { turns: 0, skillFieldProbe: { charIndex: 0, expect: { swiftStrikeTargetBonus: 2 } } },
      { turns: 0, skillFieldProbe: { charIndex: 1, expect: { ricochetCountBonus: 3 } } },
    ],
  },
  {
    name: 'skill-larger-flock-summon-limit',
    make: () => withSkillPoints(withReclassedSpell(base, 3, 11, '召唤鸡群'), 12),
    steps: [
      { turns: 0, summonLimitProbe: { charIndex: 3, expectLimit: 1 } },
      { turns: 0, purchaseCharacterSkill: { charIndex: 3, skillId: 'largerFlockChickenKing1' } },
      { turns: 0, summonLimitProbe: { charIndex: 3, expectLimit: 2 } },
      { turns: 1200 },
    ],
  },
  {
    name: 'rendered-scene-spellstorm',
    make: () => withReclassedSpell(base, 3, 3, '闪电雨'),
    steps: [
      { turns: 3000, check: snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount }) },
      { frames: 1300 },
    ],
  },
  {
    // P-5 存档恢复鲁棒性矩阵（U133）：以真实原版 fixture 为基底做字段删除变异，
    // 两端各自经真实恢复路径载入，断言「同接受或同拒绝」+ 接受后继续推进完整 DTO 差分。
    // 取证（game-save.js 恢复路径）：turnNumber 等 `?: 0` 默认；pointManagerState/gameOptions/
    // scrollInventory/potionInventory 整块 `if` 守卫；world 无守卫（缺失必抛，两端同拒）。
    // 这是健壮性测试，不冒充第二份真实历史存档；P-5 多版本结论维持 PARTIAL。
    name: 'save-robustness-field-matrix',
    make: () => base,
    steps: [
      { loadSave: { save: withoutFields(base, ['turnNumber']), turns: 200, expectReject: false }, check: robustnessLoadedOk },
      { loadSave: { save: withoutFields(base, ['pointManagerState']), turns: 200, expectReject: false }, check: robustnessLoadedOk },
      { loadSave: { save: withoutFields(base, ['gameOptions']), turns: 200, expectReject: false }, check: robustnessLoadedOk },
      { loadSave: { save: withoutFields(base, ['dungeonManagerState.dungeonStates.3.clearedTurn']), turns: 200, expectReject: false }, check: robustnessLoadedOk },
      { loadSave: { save: withoutFields(base, ['dungeonManagerState.farmedKills']), turns: 200, expectReject: false }, check: robustnessLoadedOk },
      { loadSave: { save: withoutFields(base, ['world']), turns: 0, expectReject: true }, check: robustnessRejected },
    ],
  },
  {
    // U7 长尾收口（U134）：EquipItemUpgrade（type 3「装备背包散件」）端到端差分——自然拾取先行。
    // 取证（upgrades.js:490-495 ↔ c2.js:16586）：purchase 经 item.inventory（原版 nj，= owner 角色）
    // 调 Character.equipItem（原版 Qk）；背链由 generateItem（items.js:203 ↔ c2.js `b.nj = c`）与
    // 拾取路径 addInventoryItem（character.js:1033 ↔ c2.js:22215）建立；恢复路径同样建立
    // （game-save.js:489 ↔ c2.js:29097）——U133"恢复存档惰性/未建背链"假说已被取证否定。
    // 真实门控是 canPurchase 的候选列表长度条件：game.inventories.list（原版 Game.Di.Fj）
    // 由 tick.js:490-508 在 inventory.dirty 时重建（仅含"优于已装备"的散件），fixture 背包塞满时
    // 长度 ≈60，"≤5"永不满足 → type 3 行永不可购（这才是 U133 12 次购买零装备变化的根因）。
    // 场景不写装备槽、不伪造背链：先清空背包（withEmptyBackpacks，两端同变异），再让两端各自用
    // 己方 generateItem 造一件远古物品（职业/槽位与拾取者同源）放在队员脚下，AI 认领→拾取
    // 建立 owner 背链并置 dirty → 候选列表恰含该散件（长度 1 ≤ 5）→ 驱动 type 3 行真实购买。
    // 反向验证：把重构侧 EquipItemUpgrade.prototype.purchase 改为空操作 → 装备槽摘要不再变化，场景必须变红。
    name: 'equip-item-upgrade-pickup-first',
    make: () => withEmptyBackpacks(base),
    steps: [
      { turns: 0, seedAncientItemDrop: { maxTurns: 4000, rarity: 4 }, check: ancientItemWasFound },
      { turns: 2, purchaseEquipItemUpgrades: 5, check: equipmentActuallyChanged },
      { turns: 300 },
    ],
  },
  {
    // U134 第 4 轮（P-7 视口扩展）：900×1600 竖长视口下 1300 帧真实帧循环，
    // 逐像素 FNV 指纹 + 落盘存档断言同 rendered-scene 系（断言机制沿用既有 machinery，
    // 其反向验证已在引入时做过——本场景为纯配置扩展，不新增断言逻辑）。
    // REMAINING-WORK §3.1 写明的"可行的下一步"；Canvas 行按 R7 维持 PARTIAL。
    name: 'rendered-scene-tall',
    make: () => base,
    viewport: { width: 900, height: 1600 },
    steps: [
      { frames: 1300 },
    ],
  },
];

// SCENARIO_FILTER=a,b 只跑指定场景，便于新场景快速迭代；不设置时跑全部。
const filter = process.env.SCENARIO_FILTER?.split(',').map(s => s.trim()).filter(Boolean);
const selected = filter?.length ? scenarios.filter(s => filter.includes(s.name)) : scenarios;
if (filter?.length && selected.length !== filter.length) {
  console.error(`SCENARIO_FILTER 含未注册场景: ${filter.join(',')} —— 实际匹配 ${selected.length}`);
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const failures = [];
try {
  const pages = await Promise.all([true, false].map(async original => {
    // 每端独立浏览器上下文：自动保存写的是同一个 localStorage 键，
    // 共用上下文会让后写者覆盖前者，两端写入内容就没法对比了。
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack));
    // loop.js 把渲染异常吞成 console.log("Caught error. …")，只听 pageerror 会漏掉整条渲染路径
    page.on('console', message => {
      const text = message.text();
      const url = (message.location() || {}).url || '';
      if (url.endsWith('/favicon.ico')) return; // 浏览器自发请求，与引擎无关
      if (message.type() === 'error' || text.startsWith('Caught error')) errors.push(`[console] ${text}`);
    });
    await page.goto(`${baseURL}/tests/engine-harness.html${original ? '?original' : ''}`);
    await page.waitForFunction(() => Boolean(window.harness), null, { timeout: 10000, polling: 100 });
    return { page, original, errors };
  }));
  const engineErrors = () => pages.flatMap(p => p.errors);

  for (const scenario of selected) {
    const saveText = encodeSave(scenario.make());
    try {
      // 多视口支持：场景声明 viewport 时在两端同时切换（渲染分辨率随视口变化）
      if (scenario.viewport) {
        await Promise.all(pages.map(p => p.page.setViewportSize(scenario.viewport)));
      }
      // 两端载入同一变异存档（harness.load 内部重置随机种子，保证相同随机流起点）
      const loaded = await Promise.all(pages.map(p => p.page.evaluate(text => window.harness.load(text), saveText)));
      assert.deepEqual(loaded, [true, true], '两端都必须成功载入');

      if (scenario.expectedOfflineDuration !== undefined) {
        const durations = await Promise.all(pages.map(p => p.page.evaluate(() => window.harness.offlineDuration())));
        assert.deepEqual(durations, [scenario.expectedOfflineDuration, scenario.expectedOfflineDuration], '两端都必须触发 12 小时离线上限');
      }

      await Promise.all(pages.map(p => p.page.evaluate(ms => window.harness.setTime(ms), HARNESS_FIXED_NOW)));

      // 离线场景：驱动帧循环完成离线结算（时间随帧前移）
      if (scenario.offline) {
        const offlineStates = await Promise.all(pages.map(p => p.page.evaluate(() => window.harness.advanceOffline())));
        try {
          assert.deepEqual(offlineStates[1], offlineStates[0], '离线结算后状态分叉');
        } catch (error) {
          await fs.mkdir('output/scenarios', { recursive: true });
          await fs.writeFile('output/scenarios/offline-original.json', JSON.stringify(offlineStates[0], null, 2));
          await fs.writeFile('output/scenarios/offline-refactored.json', JSON.stringify(offlineStates[1], null, 2));
          throw error;
        }
        // 离线确实发生时：序列化写入"当前时刻"，而 advanceOffline 期间时钟已随帧前移
        if (scenario.name !== 'offline-disabled') {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            const after = summarize(offlineStates[i]);
            assert.equal(after.timestamp > HARNESS_FIXED_NOW, true, `${label} 离线后时间戳应已前移`);
          }
        }
      }

      // 重置类场景：驱动两端各自的 reset/restart 原生入口后比较完整状态
      if (scenario.restart || scenario.reset) {
        const method = scenario.restart ? 'restart' : 'reset';
        const resetStates = await Promise.all(pages.map(p => p.page.evaluate(m => window.harness[m](), method)));
        try {
          assert.deepEqual(resetStates[1], resetStates[0], '重置后状态分叉');
        } catch (error) {
          await fs.mkdir('output/scenarios', { recursive: true });
          await fs.writeFile(`output/scenarios/${scenario.name}-reset-original.json`, JSON.stringify(resetStates[0], null, 2));
          await fs.writeFile(`output/scenarios/${scenario.name}-reset-refactored.json`, JSON.stringify(resetStates[1], null, 2));
          throw error;
        }
      }

      let previous = await Promise.all(pages.map(p => p.page.evaluate(() => window.harness.snapshot())));
      for (const rawStep of scenario.steps) {
        // 步骤可以是 [turns, check] 或 { turns, check, effectType, purchaseUpgrades, purchasePointUpgrades, activatePotions }
        // effectType 表示这一步改用"逐帧扫描活怪物效果队列"的推进方式，并直接对账施加次数。
        // purchaseUpgrades 表示这一步先推进再驱动升级购买（U7：只有视图层会触发的路径）。
        const step = Array.isArray(rawStep) ? { turns: rawStep[0], check: rawStep[1] } : rawStep;
        const { turns, check, effectType, purchaseUpgrades, purchasePointUpgrades, claimAchievement, equipBestItems, purchaseEquipItemUpgrades, castScrollDuringCombat, scrollId, purchaseDungeonFarm, purchaseDungeonRowFarm, harvestFarmKills, lootTreasureDuringExplore, treasureKind, activatePotions, floatingText, damageNumbers, healNumbers, spellEffects, allyEffectType, trackBoss, frames, frameGap, victoryPanel, equipFromInventory, seedAncientItemDrop, selectedTreasure, createPartyFromBlank, purchaseCharacterSkill, readAttackCooldownProbe, loadSave, statValueProbe, summonLimitProbe, readRegenProbe, buffPotencyProbe, skillFieldProbe, spellCostProbe, boundaryValues } = step;
        const results = await Promise.all(pages.map(async p => {
          await p.page.evaluate(ms => window.harness.setTime(ms), HARNESS_FIXED_NOW);
          // 重置后无队伍：走真实帧循环（守卫路径），而非裸推进
          if (scenario.restart || scenario.reset) return { snapshot: await p.page.evaluate(n => window.harness.idle(n), turns) };
          if (effectType !== undefined) return p.page.evaluate(a => window.harness.countEffectApplications(a.turns, a.effectType), { turns, effectType });
          // allyEffectType：增益类法术（cat=3 提高护甲等）的效果落在**施法者队伍**身上，
          // 活怪物队列里永远看不到，故走盟友侧观察器。
          if (allyEffectType !== undefined) return p.page.evaluate(a => window.harness.countAllyEffectApplications(a.turns, a.allyEffectType), { turns, allyEffectType });
          if (purchaseUpgrades !== undefined) return p.page.evaluate(a => window.harness.purchaseUpgrades(a), { turns, limit: purchaseUpgrades });
          if (purchasePointUpgrades !== undefined) return p.page.evaluate(a => window.harness.purchasePointUpgrades(a), { turns, limit: purchasePointUpgrades });
          if (claimAchievement) return p.page.evaluate(a => window.harness.claimAchievement(a), { turns, limit: claimAchievement === true ? 1 : claimAchievement });
          if (equipBestItems) return p.page.evaluate(a => window.harness.equipBestItems(a), { turns });
          // U7：定向驱动 type 3「装备背包散件」行（真实 refresh→canPurchaseNow→purchase 链）
          if (purchaseEquipItemUpgrades !== undefined) return p.page.evaluate(a => window.harness.purchaseEquipItemUpgrades(a), { turns, limit: purchaseEquipItemUpgrades });
          if (castScrollDuringCombat !== undefined) return p.page.evaluate(a => window.harness.castScrollDuringCombat(a), { maxTurns: castScrollDuringCombat, scrollId });
          if (purchaseDungeonFarm) return p.page.evaluate(a => window.harness.purchaseDungeonFarm(a), { turns });
          if (purchaseDungeonRowFarm) return p.page.evaluate(a => window.harness.purchaseDungeonRowFarm(a), { turns });
          if (harvestFarmKills) return p.page.evaluate(a => window.harness.harvestFarmKills(a), { turns });
          if (lootTreasureDuringExplore !== undefined) return p.page.evaluate(a => window.harness.lootTreasureDuringExplore(a), { maxTurns: lootTreasureDuringExplore, kind: treasureKind });
          if (activatePotions !== undefined) return p.page.evaluate(a => window.harness.activatePotions(a), { turns, limit: activatePotions });
          if (floatingText !== undefined) return p.page.evaluate(a => window.harness.countFloatingText(a), { turns, text: floatingText });
          if (damageNumbers !== undefined) return p.page.evaluate(a => window.harness.countFloatingText(a), { turns, pattern: '^-[0-9]+$' });
          // healNumbers：治疗分支的直接可观测量。cat=1 在 actions.js 里写 `showFloatingText(h, g, "+" + f, "#00FF00")`，
          // 因此采样正号整数文本即可证明「治疗真的落到了队友身上」，且与存档 DTO 无关。
          if (healNumbers !== undefined) return p.page.evaluate(a => window.harness.countFloatingText(a), { turns, pattern: '^\\+[0-9]+$' });
          if (spellEffects !== undefined) return p.page.evaluate(a => window.harness.countVisualEffects(a), { turns });
          if (trackBoss !== undefined) return p.page.evaluate(a => window.harness.trackBossEncounter(a), { turns });
          if (victoryPanel !== undefined) return p.page.evaluate(n => { window.harness.idle(n); return window.harness.observeVictoryPanel(); }, victoryPanel);
          if (equipFromInventory !== undefined) return p.page.evaluate(a => window.harness.equipFromInventory(a), equipFromInventory);
          // P-3：注入远古掉落物后逐帧推进直到 AI 真的拾取（两端拾取发生在同一回合）
          if (seedAncientItemDrop !== undefined) return p.page.evaluate(a => window.harness.seedAncientItemDrop(a), seedAncientItemDrop);
          // P-2：推进并统计"被法术选中的财宝目标"（selected 不入存档，只能运行时直接观察）
          if (selectedTreasure !== undefined) return p.page.evaluate(a => window.harness.countSelectedTreasure(a), { turns: selectedTreasure });
          // 差分原版正常开局路径：reset 后镜像字段写入驱动各自原生开局闭包建队
          if (createPartyFromBlank !== undefined) return p.page.evaluate(a => window.harness.createPartyFromBlank(a), createPartyFromBlank);
          // P-1：按定义 id 定向购买一个角色技能（真实技能树购买路径）
          if (purchaseCharacterSkill !== undefined) return p.page.evaluate(a => window.harness.purchaseCharacterSkill(a), purchaseCharacterSkill);
          // P-1 被动族：只读观察有效攻击冷却（getAttackCooldown 输出）
          if (readAttackCooldownProbe !== undefined) return p.page.evaluate(a => window.harness.readAttackCooldown(a), readAttackCooldownProbe);
          // P-1 增益族：只读直读组合属性 statValue（与全部战斗公式同源）
          if (statValueProbe !== undefined) return p.page.evaluate(a => window.harness.readStatValue(a), statValueProbe);
          // P-1 召唤上限：只读直读 stats.maxSummonedMinions（召唤行为门控值）
          if (summonLimitProbe !== undefined) return p.page.evaluate(a => window.harness.readSummonLimit(a), summonLimitProbe);
          // P-1 生命回复：只读直读 stats.healthRegenBonus（tick.js:42 回复公式输入）
          if (readRegenProbe !== undefined) return p.page.evaluate(a => window.harness.readRegenBonus(a), readRegenProbe);
          // P-1 法术强度：只读直读五个增益强度字段（治疗/增益法术量公式的输入）
          if (buffPotencyProbe !== undefined) return p.page.evaluate(a => window.harness.readBuffPotencies(a), buffPotencyProbe);
          // P-1 剩余被动族：一次直读全部剩余技能字段
          if (skillFieldProbe !== undefined) return p.page.evaluate(a => window.harness.readSkillFields(a), skillFieldProbe);
          // P-1 施法花费：直读 getSpellSpiritCost 公式输出（base/reduction/discounted/maxSpirit 上限）
          if (spellCostProbe !== undefined) return p.page.evaluate(a => window.harness.readSpellCostProbe(a), spellCostProbe);
          // P-5 边界值矩阵：载入越界值变异存档（两端同接受或同拒绝）
          if (boundaryValues !== undefined) {
            const text = encodeSave(withFieldValues(base, boundaryValues.entries));
            return p.page.evaluate(async a => {
              try {
                window.harness.load(a.text);
              } catch (error) {
                return { loadFailed: true, snapshot: null };
              }
              return { loadFailed: false, snapshot: await window.harness.advance(a.turns) };
            }, { text, turns: boundaryValues.turns });
          }
          // P-5 健壮性矩阵：载入变异存档（两端同接受或同拒绝），接受则推进并照常完整差分
          if (loadSave !== undefined) {
            const text = encodeSave(loadSave.save);
            return p.page.evaluate(async a => {
              try {
                window.harness.load(a.text);
              } catch (error) {
                return { loadFailed: true, snapshot: null };
              }
              return { loadFailed: false, snapshot: await window.harness.advance(a.turns) };
            }, { text, turns: loadSave.turns });
          }
          if (frameGap !== undefined) return p.page.evaluate(n => window.harness.advanceFrameGap(n), frameGap);
          // frames：走真实帧循环（loop.tick 内含 view.render 的 try/catch），随后读画布不透明像素
          if (frames !== undefined) return p.page.evaluate(n => {
            localStorage.removeItem('C2_V1_001'); // 抹掉载入时的写入，剩下的只能是自动保存
            // 把"距上次保存"拨回 310s：自动保存只在 now - lastSavedAt > 300s 时触发，
            // 而 lastSavedAt 可能被载入时写入钉在场景序-dependent 的累积时钟上，
            // 导致 325s 的帧窗口是否跨过 300s 阈值取决于场景顺序。回拨后每次 frames
            // 场景都确定性地覆盖自动保存分支（等价于"游戏已挂机 5 分钟未存盘"）。
            window.harness.rewindAutosaveTimer();
            const snapshot = window.harness.idle(n);
            const savedAfter = localStorage.getItem('C2_V1_001');
            const diag = savedAfter ? null : window.harness.autosaveDiagnostics();
            return { snapshot, ink: window.harness.canvasInk(), savedAfter, diag };
          }, frames);
          return { snapshot: await p.page.evaluate(turns => window.harness.advance(turns), turns) };
        }));
        const states = results.map(r => r.snapshot);
        try {
          assert.deepEqual(states[1], states[0], `推进 ${turns} 回合后状态分叉`);
        } catch (error) {
          await fs.mkdir('output/scenarios', { recursive: true });
          const tag = `${scenario.name}-${previous[0].turnNumber}`;
          await fs.writeFile(`output/scenarios/${tag}-original.json`, JSON.stringify(states[0], null, 2));
          await fs.writeFile(`output/scenarios/${tag}-refactored.json`, JSON.stringify(states[1], null, 2));
          // 全保真序列化复核（含 -0/NaN/undefined）：若字符串相等，则是序列化盲区差异，打印首处分叉
          const s = await Promise.all(pages.map(p => p.page.evaluate(() => JSON.stringify(window.harness.snapshot(), (k, v) => {
            if (typeof v === 'number') { if (Number.isNaN(v)) return '⟂NaN'; if (Object.is(v, -0)) return '⟂-0'; }
            return v === undefined ? '⟂undef' : v;
          }))));
          if (s[0] === s[1]) {
            console.error(`  [诊断] 全保真序列化完全一致 —— playwright 反序列化层差异（对象原型/键顺序）`);
          } else {
            let i = 0; while (i < s[0].length && s[0][i] === s[1][i]) i++;
            console.error(`  [诊断] 首处分叉 @${i}\n  ORIG: ${s[0].slice(Math.max(0, i - 100), i + 60)}\n  REF : ${s[1].slice(Math.max(0, i - 100), i + 60)}`);
          }
          throw error;
        }
        if (purchaseUpgrades !== undefined) {
          const counts = results.map(r => r.purchased);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(counts[i] > 0, `${label} 端必须真的完成至少一次升级购买`);
          }
          assert.equal(counts[1], counts[0], `两端完成的购买次数不一致（原版 ${counts[0]} / 重构版 ${counts[1]}）`);
          if (scenario.name === 'upgrades-purchased') {
            for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
              assert.ok((results[i].purchasedByType[6] ?? 0) > 0, `${label} 端必须真的购买 LearnSpellUpgrade（type=6）`);
            }
            assert.equal(results[1].purchasedByType[6], results[0].purchasedByType[6], '两端购买法术升级次数不同');
          }
          console.log(`  · 两端各自完成升级购买 ${counts[0]} 次`);
          if (process.env.SCENARIO_VERBOSE) console.log(`  · 购买类型 ${JSON.stringify(results[0].purchasedByType)} / ${JSON.stringify(results[1].purchasedByType)}`);
        }
        if (purchasePointUpgrades !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].purchased > 0, `${label} 端必须真的完成冒险点升级购买（ready=${results[i].readyCount}, balance=${results[i].availablePoints}）`);
          }
          assert.equal(results[1].purchased, results[0].purchased, '两端冒险点升级购买次数不同');
        }
        if (claimAchievement) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].claimed > 0, `${label} 端必须真的领取至少一项成就`);
          }
          assert.equal(results[1].claimed, results[0].claimed, '两端领取的成就数不同');
        }
        if (equipBestItems) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].equipped > 0, `${label} 端必须真的执行自动装备升级`);
          }
          assert.equal(results[1].equipped, results[0].equipped, '两端自动装备升级次数不同');
        }
        if (purchaseEquipItemUpgrades !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].purchased > 0, `${label} 端必须真的完成 type 3（装备背包散件）购买`);
            assert.notDeepEqual(results[i].equipmentAfter, results[i].equipmentBefore, `${label} 端 type 3 购买后装备槽摘要必须变化（候选列表为空或 purchase 未生效时摘要不变）`);
          }
          assert.equal(results[1].purchased, results[0].purchased, '两端 type 3 装备散件购买次数不同');
          console.log(`  · type 3 装备散件购买 两端各 ${results[0].purchased} 次，装备槽摘要均真实变化（${JSON.stringify(results[0].equipmentBefore)} → ${JSON.stringify(results[0].equipmentAfter)}）`);
        }
        if (castScrollDuringCombat !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].attempts > 0 && results[i].cast > 0, `${label} 端必须在有怪物时真的施放卷轴`);
          }
          assert.equal(results[1].cast, results[0].cast, '两端卷轴施放次数不同');
          assert.equal(results[1].scrollId, results[0].scrollId, '两端施放的卷轴 ID 不同');
        }
        if (frameGap !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.equal(results[i].turnDelta, 1, `${label} 在 allowBackgroundProgress 关闭时即使帧差 5000ms 也只能推进 1 回合`);
          }
          assert.equal(results[1].turnDelta, results[0].turnDelta, '两端后台时钟跳变后的推进回合数不同');
        }
        if (purchaseDungeonFarm || purchaseDungeonRowFarm) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].purchased > 0, `${label} 端必须真的购买地牢农场`);
          }
          assert.equal(results[1].purchased, results[0].purchased, '两端农场购买次数不同');
        }
        if (harvestFarmKills) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].harvested > 0, `${label} 端必须真的收获地牢农场`);
            assert.ok(results[i].killsHarvested > 0, `${label} 端收获的击杀数必须大于 0`);
          }
          assert.equal(results[1].harvested, results[0].harvested, '两端农场收获次数不同');
          assert.equal(results[1].killsHarvested, results[0].killsHarvested, '两端农场收获击杀数不同');
        }
        if (frames !== undefined) {
          const inks = results.map(r => r.ink);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(inks[i].nonBackgroundInk > 0, `${label} 端经过 ${frames} 帧真实渲染后画布上没有任何精灵像素（不透明像素 ${inks[i].ink}，与背景同色说明只填了底色）`);
          }
          assert.equal(inks[1].pixelsHash, inks[0].pixelsHash, `两端渲染输出逐像素指纹不一致（原版 ${inks[0].pixelsHash} / 重构版 ${inks[1].pixelsHash}）`);
          console.log(`  · 渲染后画布：非背景像素 两端各 ${inks[0].nonBackgroundInk}，逐像素指纹相同 = ${inks[0].pixelsHash}（画布数 ${inks[0].canvasCount}）`);
          // 落盘内容比对：两端写进 localStorage 的原文解码后必须表示同一状态。
          // 压缩原文本身不做逐字节比对——gameTimestamp 取真实挂钟，两端写入时刻不同；
          // 自动保存的“触发时机”同样不可比（见 unresolved U8）。
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(typeof results[i].savedAfter === 'string' && results[i].savedAfter.length > 0, `${label} 端跑过 ${frames} 帧（${frames * 250 / 1000}s 模拟时间）后自动保存没有写入 localStorage；诊断 ${JSON.stringify(results[i].diag)}`);
          }
          const savedStates = results.map(r => JSON.parse(saveCodec.decompress(r.savedAfter)));
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.equal(typeof savedStates[i].saveKey, 'string', `${label} 端落盘原文无法解码为存档`);
            delete savedStates[i].gameTimestamp; // 挂钟读数，两端写入时刻不同，不参与比对
          }
          assert.deepEqual(savedStates[1], savedStates[0], '两端落盘的存档内容不一致');
          console.log(`  · 两端落盘存档解码后一致（${results[0].savedAfter.length} / ${results[1].savedAfter.length} 字节，回合 ${savedStates[0].turnNumber}）`);
        }
        if (activatePotions !== undefined) {
          const attempts = results.map(r => r.attempted);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(attempts[i] > 0, `${label} 端库存里必须真的有待激活药水`);
          }
          assert.equal(attempts[1], attempts[0], `两端尝试激活的药水数不一致（原版 ${attempts[0]} / 重构版 ${attempts[1]}）`);
        }
        if (allyEffectType !== undefined) {
          const counts = results.map(r => r.applications);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(counts[i] > 0, `${label} 必须真的观察到 type=${allyEffectType} 增益落到队友身上`);
          }
          assert.equal(counts[1], counts[0], `两端 type=${allyEffectType} 盟友增益施加次数不一致（原版 ${counts[0]} / 重构版 ${counts[1]}）`);
          console.log(`  · 盟友侧 type=${allyEffectType} 直接计数两端一致 = ${counts[0]}`);
        }
        if (effectType !== undefined) {
          const counts = results.map(r => r.applications);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(counts[i] > 0, `${label} 必须真的观察到 type=${effectType} 效果被施加到活怪物`);
          }
          assert.equal(counts[1], counts[0], `两端 type=${effectType} 施加次数不一致（原版 ${counts[0]} / 重构版 ${counts[1]}）`);
          console.log(`  · type=${effectType} 直接计数两端一致 = ${counts[0]}`);
        }
        if (floatingText !== undefined) {
          const counts = results.map(r => r.count);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(counts[i] > 0, `${label} 必须真正触发浮动文字（text=${floatingText}）`);
          }
          assert.equal(counts[1], counts[0], `两端浮动文字（text=${floatingText}）触发次数不一致（原版 ${counts[0]} / 重构版 ${counts[1]}）`);
          console.log(`  · 浮动文字（${floatingText}）直接计数两端一致 = ${counts[0]}`);
        }
        if (damageNumbers !== undefined) {
          const counts = results.map(r => r.count);
          const sums = results.map(r => r.sum);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(counts[i] > 0, `${label} 必须真正生成伤害浮动文字`);
            assert.ok(sums[i] < 0, `${label} 伤害浮动文字累计总和必须小于 0`);
          }
          assert.equal(counts[1], counts[0], `两端伤害浮动文字数量不一致（原版 ${counts[0]} / 重构版 ${counts[1]}）`);
          assert.equal(sums[1], sums[0], `两端伤害浮动文字总和不一致（原版 ${sums[0]} / 重构版 ${sums[1]}）`);
          console.log(`  · 伤害数字直接计数与总伤害两端一致 = ${counts[0]} 次, 累计扣血 ${sums[0]}`);
        }
        if (healNumbers !== undefined) {
          const counts = results.map(r => r.count);
          const sums = results.map(r => r.sum);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(counts[i] > 0, `${label} 必须真正生成治疗浮动文字`);
            assert.ok(sums[i] > 0, `${label} 治疗浮动文字累计总和必须大于 0`);
          }
          assert.equal(counts[1], counts[0], `两端治疗浮动文字数量不一致（原版 ${counts[0]} / 重构版 ${counts[1]}）`);
          assert.equal(sums[1], sums[0], `两端治疗浮动文字总和不一致（原版 ${sums[0]} / 重构版 ${sums[1]}）`);
          console.log(`  · 治疗数字直接计数与总治疗量两端一致 = ${counts[0]} 次, 累计回血 ${sums[0]}`);
        }
        if (spellEffects !== undefined) {
          const totals = results.map(r => r.total);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(totals[i] >= 20, `${label} 特效池必须采样到足够视觉特效（实际 ${totals[i]}）`);
          }
          assert.equal(totals[1], totals[0], `两端特效总数不一致（原版 ${totals[0]} / 重构版 ${totals[1]}）`);
          assert.deepEqual(results[1].namesByType, results[0].namesByType, `两端逐类特效计数不一致（原版 ${JSON.stringify(results[0].namesByType)} / 重构版 ${JSON.stringify(results[1].namesByType)}）`);
          assert.deepEqual(results[1].namesInOrder, results[0].namesInOrder, `两端特效创建顺序不一致`);
          console.log(`  · 特效池逐帧采样两端一致 = ${totals[0]} 个特效，${Object.keys(results[0].namesByType).length} 种`);
        }
        if (trackBoss !== undefined) {
          const encounters = results.map(r => r.bossEncounterTurns);
          const seens = results.map(r => r.bossSeenTurns);
          const kills = results.map(r => r.bossKills);
          const names = results.map(r => r.bossNames);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(encounters[i] > 0, `${label} 必须真正进入首领遭遇状态（encounter.isBossEncounter === true）`);
            assert.ok(seens[i] > 0, `${label} 必须真正生成并看到 characterType=4 的首领怪物`);
            assert.ok(kills[i] > 0, `${label} 必须真正击败首领并产出"击杀首领!"浮动文字`);
            assert.ok(names[i].length > 0, `${label} 必须具备生成的首领遭遇名称`);
            assert.equal(states[i].statistics.castlesConquered, 1, `${label} 必须攻克城堡`);
          }
          assert.equal(encounters[1], encounters[0], `两端首领遭遇持续回合数不一致（原版 ${encounters[0]} / 重构版 ${encounters[1]}）`);
          assert.equal(seens[1], seens[0], `两端首领存活回合数不一致（原版 ${seens[0]} / 重构版 ${seens[1]}）`);
          assert.equal(kills[1], kills[0], `两端击杀首领次数不一致（原版 ${kills[0]} / 重构版 ${kills[1]}）`);
          assert.deepEqual(names[1], names[0], `两端首领遭遇名称不一致（原版 ${names[0]} / 重构版 ${names[1]}）`);
          console.log(`  · 首领遭遇全指标两端一致 = 首领战 ${encounters[0]} 回合, 首领存活 ${seens[0]} 回合, 击杀首领 ${kills[0]} 次, 首领名称 [${names[0].join(', ')}]`);
        }
        if (victoryPanel !== undefined) {
          const panels = results.map(r => r.gameOverVisible);
          const texts = results.map(r => r.gameOverText);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(panels[i], '' + label + ' 胜利后必须直接观察到 gameOverTabContent 面板可见（帧渲染后 DOM display !== none）');
            assert.ok(texts[i].length > 0, '' + label + ' 胜利面板必须有实际内容');
          }
          assert.equal(texts[1], texts[0], '两端胜利面板文本不一致');
          console.log('  · 胜利终局面板两端可见且文本一致（' + texts[0].length + ' 字符）');
        }
        if (lootTreasureDuringExplore !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].selected > 0, `${label} 端必须选择角色所在房间的财宝房目标物；最多曾生成 ${results[i].spawned} 个`);
            assert.ok(results[i].looted > 0, `${label} 端必须真的搜索财宝房目标物`);
          }
          assert.equal(results[1].selected, results[0].selected, '两端选择宝箱次数不同');
        }
        if (seedAncientItemDrop !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].seeded, `${label} 端必须成功生成 rarity=4 掉落物`);
            assert.ok(results[i].collected, `${label} 端必须在 ${seedAncientItemDrop.maxTurns} 回合内被 AI 真的拾取`);
          }
          assert.equal(results[1].turns, results[0].turns, `两端拾取注入掉落物所耗回合数不同（原版 ${results[0].turns} / 重构版 ${results[1].turns}）`);
          assert.equal(results[1].waited, results[0].waited, `两端等待进房的回合数不同（原版 ${results[0].waited} / 重构版 ${results[1].waited}）`);
          console.log(`  · 注入的远古掉落物两端均被拾取（等进房 ${results[0].waited} 回合 + 拾取 ${results[0].turns} 回合，物品「${results[0].itemName}」）`);
        }
        if (selectedTreasure !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].selections > 0, `${label} 端必须观察到财宝目标被发现财宝箱法术选中（selected false→true 跳变 ${results[i].selections} 次）`);
          }
          assert.equal(results[1].selections, results[0].selections, `两端财宝选中跳变次数不同（原版 ${results[0].selections} / 重构版 ${results[1].selections}）`);
          console.log(`  · 被法术选中的财宝目标跳变数两端一致 = ${results[0].selections}`);
        }
        if (createPartyFromBlank !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].created, `${label} 端经原生开局闭包建队必须成功（partyCreated=true）`);
          }
          assert.equal(results[1].waited, results[0].waited, `两端等待组队面板重挂载的帧数不同（原版 ${results[0].waited} / 重构版 ${results[1].waited}）`);
          console.log(`  · 双端原生开局路径建队成功（等面板重挂载 ${results[0].waited} 帧 + 推进 ${createPartyFromBlank.turns} 回合，随后完整 DTO 差分）`);
        }
        if (purchaseCharacterSkill !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(results[i].purchased, `${label} 端必须真的购买技能 ${purchaseCharacterSkill.skillId}（结果 ${results[i].purchased ? 'ok' : results[i].reason}）`);
          }
          console.log(`  · 定向购买技能 ${purchaseCharacterSkill.skillId} 两端成功（真实技能树购买路径）`);
        }
        if (readAttackCooldownProbe !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            if (readAttackCooldownProbe.expectReduction !== undefined) assert.equal(results[i].reduction, readAttackCooldownProbe.expectReduction, `${label} attackCooldownReduction 应为 ${readAttackCooldownProbe.expectReduction}（实际 ${results[i].reduction}）`);
            if (readAttackCooldownProbe.expectCooldown !== undefined) assert.equal(results[i].cooldown, readAttackCooldownProbe.expectCooldown, `${label} 有效攻击冷却应为 ${readAttackCooldownProbe.expectCooldown}（实际 ${results[i].cooldown}）`);
          }
          console.log(`  · 冷却缩减观察两端一致：reduction=${results[0].reduction} 有效冷却=${results[0].cooldown}（getAttackCooldown，canAttack 同源）`);
        }
        if (statValueProbe !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            if (statValueProbe.expectSkillBonus !== undefined) assert.equal(results[i].skillBonusPercent, statValueProbe.expectSkillBonus, `${label} ${statValueProbe.component} skillBonusPercent 应为 ${statValueProbe.expectSkillBonus}（实际 ${results[i].skillBonusPercent}）`);
            if (statValueProbe.expectValue !== undefined) assert.equal(results[i].value, statValueProbe.expectValue, `${label} ${statValueProbe.component} 组合值应为 ${statValueProbe.expectValue}（实际 ${results[i].value}）`);
          }
          console.log(`  · ${statValueProbe.component} 组合值两端一致 = ${results[0].value}（skillBonus ${results[0].skillBonusPercent}%，statValue 公式）`);
        }
        if (summonLimitProbe !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            if (summonLimitProbe.expectLimit !== undefined) assert.equal(results[i].limit, summonLimitProbe.expectLimit, `${label} maxSummonedMinions 应为 ${summonLimitProbe.expectLimit}（实际 ${results[i].limit}）`);
          }
          console.log(`  · 召唤上限两端一致 = ${results[0].limit}（behaviors.js 召唤门控同源）`);
        }
        if (readRegenProbe !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            if (readRegenProbe.expectBonus !== undefined) assert.equal(results[i].bonus, readRegenProbe.expectBonus, `${label} healthRegenBonus 应为 ${readRegenProbe.expectBonus}（实际 ${results[i].bonus}）`);
          }
          console.log(`  · 生命回复加成两端一致 = ${results[0].bonus}（tick.js:42 回复公式同源）`);
        }
        if (skillFieldProbe !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            for (const [key, expectV] of Object.entries(skillFieldProbe.expect ?? {})) {
              assert.equal(results[i].fields[key], expectV, `${label} ${key} 应为 ${expectV}（实际 ${results[i].fields[key]}）`);
            }
          }
          console.log(`  · 技能字段探针两端一致 = ${JSON.stringify(results[0].fields)}`);
        }
        if (boundaryValues !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.equal(results[i].loadFailed, boundaryValues.expectReject, `${label} 端载入越界变异存档的接受/拒绝与预期不符（loadFailed=${results[i].loadFailed}）`);
          }
          console.log(`  · 边界值变异两端同${boundaryValues.expectReject ? '拒' : '受'}（${boundaryValues.turns} 回合推进后完整 DTO 差分照常）`);
        }
        if (spellCostProbe !== undefined) {
          const er = spellCostProbe.expectReduction;
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            if (er !== undefined) assert.equal(results[i].reduction, er, `${label} spellCostReduction 应为 ${er}（实际 ${results[i].reduction}）`);
            const expected = Math.min(results[i].base - Math.floor(er / 100 * results[i].base), results[i].maxSpiritValue);
            assert.equal(results[i].discounted, expected, `${label} 施法花费应为 ${expected}（实际 ${results[i].discounted}，base=${results[i].base}）`);
          }
          console.log(`  · 施法花费公式探针两端一致 reduction=${results[0].reduction} base=${results[0].base} discounted=${results[0].discounted}（getSpellSpiritCost/bu 同源）`);
        }
        if (buffPotencyProbe !== undefined) {
          const expect = buffPotencyProbe.expect || {};
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            for (const key of ['heal', 'damage', 'armor', 'attackRating', 'defenceRating']) {
              if (expect[key] !== undefined) assert.equal(results[i][key], expect[key], `${label} ${key}Potency 应为 ${expect[key]}（实际 ${results[i][key]}）`);
            }
          }

          const p0 = results[0];
          console.log(`  · 法术强度五字段两端一致 heal=${p0.heal} damage=${p0.damage} armor=${p0.armor} attackRating=${p0.attackRating} defenceRating=${p0.defenceRating}（actions.js:94,131-140 公式同源）`);
        }
        if (loadSave !== undefined) {
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.equal(results[i].loadFailed, loadSave.expectReject, `${label} 端载入变异存档的接受/拒绝与预期不符（loadFailed=${results[i].loadFailed}）`);
          }
          console.log(`  · 变异存档两端同${loadSave.expectReject ? '拒' : '受'}（${loadSave.turns} 回合推进后完整 DTO 差分照常）`);
        }
        // 场景有效性断言：对每一端独立验证"场景确实产生了预期效果"
        for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
          if (check) {
            const verdict = check(states[i]);
            if (verdict.changed !== undefined) assert.equal(verdict.changed, true, `${label} 离线后金币应增长`);
            if (verdict.unchanged !== undefined) assert.equal(verdict.unchanged, true, `${label} 关闭离线后金币不应变化`);
            if (verdict.spellCast !== undefined) assert.equal(verdict.spellCast, true, `${label} 法术场景必须实际施法`);
            if (verdict.summoned !== undefined) assert.equal(verdict.summoned, true, `${label} 召唤场景必须真的召唤出随从`);
            if (verdict.stunned !== undefined) assert.equal(verdict.stunned, true, `${label} 必须真的出现冒险者被击倒（昏迷前置）`);
            if (verdict.upgraded !== undefined) assert.equal(verdict.upgraded, true, `${label} 必须真的完成至少一次升级购买`);
            if (verdict.settingsPurchased !== undefined) assert.equal(verdict.settingsPurchased, true, `${label} 全局设置升级必须真实增长`);
            if (verdict.characterLeveled !== undefined) assert.equal(verdict.characterLeveled, true, `${label} 角色等级必须真实上升`);
            if (verdict.skillLearned !== undefined) assert.equal(verdict.skillLearned, true, `${label} 技能树布尔位必须真实解锁`);
            if (verdict.spellLearned !== undefined) assert.equal(verdict.spellLearned, true, `${label} 已学法术必须真实增加`);
            if (verdict.criticalSkillsActive !== undefined) assert.equal(verdict.criticalSkillsActive, true, `${label} 战士与游侠暴击技能必须全部习得；${verdict.note}`);
            if (verdict.monsterUnlocked !== undefined) assert.equal(verdict.monsterUnlocked, true, `${label} 怪物最高解锁等级和存档等级表长度必须真实增长；${verdict.note}`);
            if (verdict.minLevelRetired !== undefined) assert.equal(verdict.minLevelRetired, true, `${label} 怪物最低解锁等级（minUnlockedLevel）必须真实增长（退休）；${verdict.note}`);
            if (verdict.maxLevelUnlocked !== undefined) assert.equal(verdict.maxLevelUnlocked, true, `${label} 退休前置：最高解锁怪物等级必须达到 3 级；${verdict.note}`);
            if (verdict.retiredLevelExcluded !== undefined) assert.equal(verdict.retiredLevelExcluded, true, `${label} 首个有效怪物等级必须大于 1（等级 1 已退休排除）；${verdict.note}`);
            if (verdict.pointUpgradePurchased !== undefined) assert.equal(verdict.pointUpgradePurchased, true, `${label} 冒险点必须真实支出且升级状态必须变为已购买`);
            if (verdict.distinctPointUpgradesBought !== undefined) assert.ok(verdict.distinctPointUpgradesBought >= 5, `${label} 必须购买至少 5 种不同点数升级（实际 ${verdict.distinctPointUpgradesBought}）`);
            if (verdict.pointsSpent !== undefined) assert.ok(verdict.pointsSpent > 0, `${label} 购买点数升级必须真实支出冒险点（实际 ${verdict.pointsSpent}）`);
            if (verdict.swapDone !== undefined) assert.equal(verdict.swapDone, true, `${label} 手动装备交换未发生（金属的权杖应已装备、人民之美好的权杖应回背包）`);
            if (verdict.itemEquippedGrew !== undefined) assert.equal(verdict.itemEquippedGrew, true, `${label} itemEquipped 点数事件（type 21）必须增长`);
            if (verdict.classKept !== undefined) assert.equal(verdict.classKept, true, `${label} 改职业后的存档必须保持野蛮人（characterClass 1）`);
            if (verdict.skillsLearned !== undefined) assert.equal(verdict.skillsLearned, true, `${label} 野蛮人四棵技能树的解锁布尔位必须真实增长`);
            if (verdict.spellsLearned !== undefined) assert.equal(verdict.spellsLearned, true, `${label} 野蛮人必须经 LearnSpellUpgrade 真实学会职业法术`);
            if (verdict.attackPlanned !== undefined) assert.equal(verdict.attackPlanned, true, `${label} 攻击城堡计划（type 13 → attackScheduled）必须真实发生`);
            if (verdict.appliedDelta !== undefined) assert.ok(verdict.appliedDelta >= 3, `${label} 多次领取后 applied 计数必须至少增长 3（实际 ${verdict.appliedDelta}）`);
            if (verdict.killRewardGrew !== undefined) assert.equal(verdict.killRewardGrew, true, `${label} 击杀事件奖励（pointsByType[1].points = reward × count）必须真实抬升`);
            if (verdict.enough !== undefined) assert.equal(verdict.enough, true, `${label} 战士多重攻击位 ${verdict.multiLearned}/6、游侠跳弹位 ${verdict.chainLearned}/8 必须真实习得（多重 ≥4 且跳弹 ≥6）`);
            if (verdict.multiLearned !== undefined) assert.ok(verdict.multiLearned >= 4, `${label} 战士多重攻击技能位必须至少习得 4 个（实际 ${verdict.multiLearned}/6）`);
            if (verdict.chainLearned !== undefined) assert.ok(verdict.chainLearned >= 6, `${label} 游侠跳弹链技能位必须至少习得 6 个（实际 ${verdict.chainLearned}/8）`);
            if (verdict.achievementClaimed !== undefined) assert.equal(verdict.achievementClaimed, true, `${label} 成就奖励必须真实领取并标记 applied`);
            if (verdict.achievementBelowThreshold !== undefined) assert.equal(verdict.achievementBelowThreshold, true, `${label} farmsPurchased=4 低于 requiredCount=5，farmsPurchased5 必须仍未获得（进度判定确实按 requiredCount 比较）`);
            if (verdict.achievementThresholdReached !== undefined) assert.equal(verdict.achievementThresholdReached, true, `${label} farmsPurchased=5 达到 requiredCount，farmsPurchased5 必须已获得`);
            if (verdict.achievementAtThreshold !== undefined) assert.equal(verdict.achievementAtThreshold, true, `${label} doorsOpened=100000 达到 requiredCount，doorsOpened100K 必须已获得（证明成就检查节拍真的执行）`);
            if (verdict.equipmentChanged !== undefined) assert.equal(verdict.equipmentChanged, true, `${label} 自动装备后装备槽必须真实变化`);
            if (verdict.itemEquipEvents !== undefined) assert.equal(verdict.itemEquipEvents, true, `${label} 装备物品事件计数必须真实增长`);
            if (verdict.scrollCast !== undefined) assert.equal(verdict.scrollCast, true, `${label} 卷轴使用统计必须真实增长`);
            if (verdict.backgroundProgressDisabled !== undefined) assert.equal(verdict.backgroundProgressDisabled, true, `${label} 选项 inactiveTabProcessingEnabled 必须为 false 且保存进存档`);
            if (verdict.farmPurchased !== undefined) assert.equal(verdict.farmPurchased, true, `${label} 农场实体与购买统计必须真实增长`);
            if (verdict.farmHarvested !== undefined) assert.equal(verdict.farmHarvested, true, `${label} 农场收获击杀统计（farmedKills）必须真实增长且大于 0`);
            if (verdict.farmedKillsCleared !== undefined) assert.equal(verdict.farmedKillsCleared, true, `${label} 农场收获后待收获击杀池必须已被清零`);
            if (verdict.farmCycleHarvestCount !== undefined) assert.equal(verdict.farmCycleHarvestCount, true, `${label} 农场完整生命周期多次收获累计击杀必须达到预期`);
            if (verdict.farmCleared !== undefined) assert.equal(verdict.farmCleared, true, `${label} 农场在收获时必须处于已清理成熟状态`);
            if (verdict.treasureLooted !== undefined) assert.equal(verdict.treasureLooted, true, `${label} 财宝箱拾取统计必须真实增长`);
            if (verdict.itemsFound !== undefined) assert.equal(verdict.itemsFound, true, `${label} 立即搜索必须真的拾取到物品（itemsFound 统计增长）`);
            if (verdict.weaponRackLooted !== undefined) assert.equal(verdict.weaponRackLooted, true, `${label} 武器架拾取统计必须真实增长`);
            if (verdict.bookcaseLooted !== undefined) assert.equal(verdict.bookcaseLooted, true, `${label} 书架拾取统计必须真实增长`);
            if (verdict.collectedDropTypes !== undefined) assert.deepEqual(verdict.collectedDropTypes, [9, 10, 11, 12], `${label} 四种地面掉落物必须分别被拾取（9=金币、10=卷轴、11=药水、12=物品）`);
            if (verdict.noLootSpell !== undefined) assert.equal(verdict.noLootSpell, true, `${label} 地面掉落场景不得在推进中学会“立即搜索”旁路法术`);
            if (verdict.potionUsed !== undefined) assert.equal(verdict.potionUsed, true, `${label} 必须真的激活至少一瓶药水（potionsUsed 增长）`);
            if (verdict.note && i === 0) console.log(`  · ${verdict.note}`);
            if (verdict.victory !== undefined) assert.equal(verdict.victory, true, `${label} 必须真的走完征服尾部并触发胜利`);
            if (verdict.ancientFound !== undefined) assert.equal(verdict.ancientFound, true, `${label} 远古物品统计（ancientItemsFound）必须经真实拾取路径增长`);
            if (verdict.scrollUpgraded !== undefined) assert.equal(verdict.scrollUpgraded, true, `${label} 卷轴升级必须真实购买（upgradeCount 增长）`);
            if (verdict.partyCreated !== undefined) assert.equal(verdict.partyCreated, true, `${label} 建队后 partyCreated 必须为 true`);
            if (verdict.adventurerCount !== undefined) assert.equal(verdict.adventurerCount, 4, `${label} 建队后必须有 4 名冒险者（实际 ${verdict.adventurerCount}）`);
            // 防呆（本项目真实踩过）：check 返回的键若没在上面被断言，检查会静默变成**空断言**——
            // 例如新场景写了 `itemsFound: ...` 却忘了补断言行，测试照样全绿。这里显式列出全部已处理键，
            // 出现未知键即失败，逼迫补断言；键清单由本文件的断言行机械抽取，勿手改。
            const handledVerdictKeys = new Set(["achievementAtThreshold","achievementBelowThreshold","achievementClaimed","achievementThresholdReached","adventurerCount","ancientFound","adventurersIntact","loadRejected","scrollUpgraded","appliedDelta","attackPlanned","backgroundProgressDisabled","bookcaseLooted","chainLearned","chanceSkillOwned","changed","characterLeveled","classKept","collectedDropTypes","criticalSkillsActive","distinctPointUpgradesBought","enough","equipmentChanged","farmCleared","farmCycleHarvestCount","farmHarvested","farmPurchased","farmedKillsCleared","itemEquipEvents","itemEquippedGrew","itemsFound","killRewardGrew","maxLevelUnlocked","minLevelRetired","monsterUnlocked","multiLearned","noLootSpell","note","partyCreated","pointUpgradePurchased","pointsSpent","potionUsed","retiredLevelExcluded","scrollCast","settingsPurchased","skillLearned","skillsLearned","spellCast","spellLearned","spellsLearned","stunned","summoned","swapDone","treasureLooted","unchanged","upgraded","victory","weaponRackLooted"]);
            const unknownVerdictKeys = Object.keys(verdict).filter(k => !handledVerdictKeys.has(k));
            assert.deepEqual(unknownVerdictKeys, [], `${label} check 返回了未被断言的键：${unknownVerdictKeys.join(", ")}（请在 runner 里补断言，否则该检查是空的）`);
          }
        }
        previous = states;
      }
      const errors = engineErrors();
      assert.deepEqual(errors, [], `${scenario.name} 浏览器异常`);
      console.log(`✓ ${scenario.name}`);
    } catch (error) {
      failures.push(scenario.name);
      if (process.env.SCENARIO_VERBOSE) console.error(error);
      console.error(`✗ ${scenario.name}: ${error.message.split('\n').slice(0, process.env.SCENARIO_VERBOSE ? 8 : 1).join(' | ')}`);
    }
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(`失败场景: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`✓ ${selected.length} / ${scenarios.length} 个差分场景通过`);
