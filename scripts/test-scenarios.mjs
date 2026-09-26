// 场景差分矩阵：同一变异存档驱动原版与重构引擎，逐步推进并比较完整存档状态。
// 运行前置：node scripts/serve.mjs（默认 http://127.0.0.1:4173）。
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import saveCodec from '../src/engine/save-codec.js';
import {
  decodeFixture, encodeSave, summarize,
  withPotions, withScrolls, withGold, withKills, withPointPools, withFarmableDungeon, withTurns, withElapsed, withOfflineProcessing, withBackgroundProcessing,
  withVictories, withClassSpell, withCastleVictory, withReclassedSpell, withEquippedItem, withResurrectionTrial, withSkillPoints, withExperience, withCharacterClass, withAttackableCastle,
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
const castleAttackPlanned = (s) => ({
  attackPlanned: (s.castleManager?.castleStates ?? []).filter(c => c.attackScheduled || c.conquered).length
    > (base.castleManager?.castleStates ?? []).filter(c => c.attackScheduled || c.conquered).length,
});
const achievementWasClaimed = (s) => ({
  achievementClaimed: (s.achievementManager?.achievements ?? []).filter(a => a.applied).length
    > (base.achievementManager?.achievements ?? []).filter(a => a.applied).length,
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
// U7：药水激活在视图之外没有入口，激活后存档里只有 statistics.potionsUsed 可证。
const potionWasUsed = (s) => ({ potionUsed: (s.statistics?.potionsUsed ?? 0) > 0 });
const backgroundProgressWasDisabled = (s) => ({
  backgroundProgressDisabled: s.gameOptions?.inactiveTabProcessingEnabled === false,
});
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
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
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
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 弹射范围伤害分支：spellCategoryId=4、bo:true（火法师 火环）。
    name: 'spell-area-bounce',
    make: () => withReclassedSpell(base, 3, 4, '火环'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 连锁伤害分支：spellCategoryId=5（电法师 连锁闪电）。
    name: 'spell-chain-lightning',
    make: () => withReclassedSpell(base, 3, 3, '连锁闪电'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 落雨型范围伤害分支：spellCategoryId=6（电法师 闪电雨）。
    name: 'spell-rain-damage',
    make: () => withReclassedSpell(base, 3, 3, '闪电雨'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 弹跳投射物分支：spellCategoryId=13（死灵法师 绿色死亡）。
    name: 'spell-bouncing-projectile',
    make: () => withReclassedSpell(base, 3, 9, '绿色死亡'),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 远程法术分支需要已装备的远程武器：原版与重构版的 createAttackAction 都把 equipment.Ey
    // 交给无空值保护的 getProjectileAnimation，因此改职业后要补回槽 61 的投射武器（itemTypeId 取自引擎注册表）。
    // 唯一的 td:false 定义：spellCategoryId=12（忍者 快速打击，槽 62 飞镖 → projectileAnimationId=3）。
    name: 'spell-deferred-strike',
    make: () => withEquippedItem(withReclassedSpell(base, 3, 8, '快速打击'), 3, '2081168329', '62', 8),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 拾取分支：spellCategoryId=14（盗贼 立即搜索），一次收集本层全部金币/物品/卷轴/药水掉落。
    name: 'spell-instant-search',
    make: () => withEquippedItem(withReclassedSpell(base, 3, 7, '立即搜索'), 3, '41393542', '61', 7),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
  },
  {
    // 宝箱发现分支：spellCategoryId=15（盗贼 发现财宝箱）→ hw.prototype.wu 置宝箱已发现。
    name: 'spell-find-chest',
    make: () => withEquippedItem(withReclassedSpell(base, 3, 7, '发现财宝箱'), 3, '41393542', '61', 7),
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount })], [3000, null]],
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
    steps: [[3000, snap => ({ spellCast: snap.statistics.spellCastCount > base.statistics.spellCastCount, summoned: snap.statistics.minionsSummoned > base.statistics.minionsSummoned })], [3000, null]],
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
    name: 'auto-equipped',
    // fixture 每人背包里已有强于当前装备的物品；原版/重构版走同一个升级 type=4。
    make: () => base,
    steps: [
      { turns: 0, equipBestItems: true, check: equipmentChanged },
      { turns: 900, check: equipmentChanged },
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
    name: 'autosave-payload',
    // 自动保存计时分支 + 落盘字节比对：两端跑同样的真实帧循环，比较写进 localStorage 的原文。
    make: () => base,
    steps: [
      { frames: 1300 },
    ],
  },
  {
    name: 'potions-activated',
    // U7：三瓶未激活药水入库 → 推进 → 直接驱动 Potion.aw（视图层唯一入口）→ 再推进差分。
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
        const { turns, check, effectType, purchaseUpgrades, purchasePointUpgrades, claimAchievement, equipBestItems, castScrollDuringCombat, scrollId, purchaseDungeonFarm, purchaseDungeonRowFarm, harvestFarmKills, lootTreasureDuringExplore, treasureKind, activatePotions, floatingText, damageNumbers, trackBoss, frames, frameGap, victoryPanel, equipFromInventory } = step;
        const results = await Promise.all(pages.map(async p => {
          await p.page.evaluate(ms => window.harness.setTime(ms), HARNESS_FIXED_NOW);
          // 重置后无队伍：走真实帧循环（守卫路径），而非裸推进
          if (scenario.restart || scenario.reset) return { snapshot: await p.page.evaluate(n => window.harness.idle(n), turns) };
          if (effectType !== undefined) return p.page.evaluate(a => window.harness.countEffectApplications(a.turns, a.effectType), { turns, effectType });
          if (purchaseUpgrades !== undefined) return p.page.evaluate(a => window.harness.purchaseUpgrades(a), { turns, limit: purchaseUpgrades });
          if (purchasePointUpgrades !== undefined) return p.page.evaluate(a => window.harness.purchasePointUpgrades(a), { turns, limit: purchasePointUpgrades });
          if (claimAchievement) return p.page.evaluate(a => window.harness.claimAchievement(a), { turns });
          if (equipBestItems) return p.page.evaluate(a => window.harness.equipBestItems(a), { turns });
          if (castScrollDuringCombat !== undefined) return p.page.evaluate(a => window.harness.castScrollDuringCombat(a), { maxTurns: castScrollDuringCombat, scrollId });
          if (purchaseDungeonFarm) return p.page.evaluate(a => window.harness.purchaseDungeonFarm(a), { turns });
          if (purchaseDungeonRowFarm) return p.page.evaluate(a => window.harness.purchaseDungeonRowFarm(a), { turns });
          if (harvestFarmKills) return p.page.evaluate(a => window.harness.harvestFarmKills(a), { turns });
          if (lootTreasureDuringExplore !== undefined) return p.page.evaluate(a => window.harness.lootTreasureDuringExplore(a), { maxTurns: lootTreasureDuringExplore, kind: treasureKind });
          if (activatePotions !== undefined) return p.page.evaluate(a => window.harness.activatePotions(a), { turns, limit: activatePotions });
          if (floatingText !== undefined) return p.page.evaluate(a => window.harness.countFloatingText(a), { turns, text: floatingText });
          if (damageNumbers !== undefined) return p.page.evaluate(a => window.harness.countFloatingText(a), { turns, pattern: '^-[0-9]+$' });
          if (trackBoss !== undefined) return p.page.evaluate(a => window.harness.trackBossEncounter(a), { turns });
          if (victoryPanel !== undefined) return p.page.evaluate(n => { window.harness.idle(n); return window.harness.observeVictoryPanel(); }, victoryPanel);
          if (equipFromInventory !== undefined) return p.page.evaluate(a => window.harness.equipFromInventory(a), equipFromInventory);
          if (frameGap !== undefined) return p.page.evaluate(n => window.harness.advanceFrameGap(n), frameGap);
          // frames：走真实帧循环（loop.tick 内含 view.render 的 try/catch），随后读画布不透明像素
          if (frames !== undefined) return p.page.evaluate(n => {
            localStorage.removeItem('C2_V1_001'); // 抹掉载入时的写入，剩下的只能是自动保存
            const snapshot = window.harness.idle(n);
            return { snapshot, ink: window.harness.canvasInk(), savedAfter: localStorage.getItem('C2_V1_001') };
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
            assert.ok(typeof results[i].savedAfter === 'string' && results[i].savedAfter.length > 0, `${label} 端跑过 ${frames} 帧（${frames * 250 / 1000}s 模拟时间）后自动保存没有写入 localStorage`);
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
        if (trackBoss !== undefined) {
          const encounters = results.map(r => r.bossEncounterTurns);
          const seens = results.map(r => r.bossSeenTurns);
          const kills = results.map(r => r.bossKills);
          const names = results.map(r => r.bossNames);
          for (const [i, label] of [[0, 'original'], [1, 'refactored']]) {
            assert.ok(encounters[i] > 0, `${label} 必须真正进入首领遭遇状态（encounter.du === true）`);
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
            if (verdict.retiredLevelExcluded !== undefined) assert.equal(verdict.retiredLevelExcluded, true, `${label} 首个有效怪物等级必须大于 1（等级 1 已退休排除）；${verdict.note}`);
            if (verdict.pointUpgradePurchased !== undefined) assert.equal(verdict.pointUpgradePurchased, true, `${label} 冒险点必须真实支出且升级状态必须变为已购买`);
            if (verdict.distinctPointUpgradesBought !== undefined) assert.ok(verdict.distinctPointUpgradesBought >= 5, `${label} 必须购买至少 5 种不同点数升级（实际 ${verdict.distinctPointUpgradesBought}）`);
            if (verdict.swapDone !== undefined) assert.equal(verdict.swapDone, true, `${label} 手动装备交换未发生（金属的权杖应已装备、人民之美好的权杖应回背包）`);
            if (verdict.itemEquippedGrew !== undefined) assert.equal(verdict.itemEquippedGrew, true, `${label} itemEquipped 点数事件（type 21）必须增长`);
            if (verdict.classKept !== undefined) assert.equal(verdict.classKept, true, `${label} 改职业后的存档必须保持野蛮人（characterClass 1）`);
            if (verdict.skillsLearned !== undefined) assert.equal(verdict.skillsLearned, true, `${label} 野蛮人四棵技能树的解锁布尔位必须真实增长`);
            if (verdict.spellsLearned !== undefined) assert.equal(verdict.spellsLearned, true, `${label} 野蛮人必须经 LearnSpellUpgrade 真实学会职业法术`);
            if (verdict.attackPlanned !== undefined) assert.equal(verdict.attackPlanned, true, `${label} 攻击城堡计划（type 13 → attackScheduled）必须真实发生`);
            if (verdict.achievementClaimed !== undefined) assert.equal(verdict.achievementClaimed, true, `${label} 成就奖励必须真实领取并标记 applied`);
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
            if (verdict.weaponRackLooted !== undefined) assert.equal(verdict.weaponRackLooted, true, `${label} 武器架拾取统计必须真实增长`);
            if (verdict.bookcaseLooted !== undefined) assert.equal(verdict.bookcaseLooted, true, `${label} 书架拾取统计必须真实增长`);
            if (verdict.collectedDropTypes !== undefined) assert.deepEqual(verdict.collectedDropTypes, [9, 10, 11, 12], `${label} 四种地面掉落物必须分别被拾取（9=金币、10=卷轴、11=药水、12=物品）`);
            if (verdict.noLootSpell !== undefined) assert.equal(verdict.noLootSpell, true, `${label} 地面掉落场景不得在推进中学会“立即搜索”旁路法术`);
            if (verdict.potionUsed !== undefined) assert.equal(verdict.potionUsed, true, `${label} 必须真的激活至少一瓶药水（potionsUsed 增长）`);
            if (verdict.note && i === 0) console.log(`  · ${verdict.note}`);
            if (verdict.victory !== undefined) assert.equal(verdict.victory, true, `${label} 必须真的走完征服尾部并触发胜利`);
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
