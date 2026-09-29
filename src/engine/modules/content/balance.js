/** 全局成长参数、药水修正和升级列表。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { randomInt } from "../core/math.js";
// 升级实现和卷轴目录由 runtime/index.js 在初始化时提供。
// 数值与内容定义不再反向导入玩法模块。
export var experienceCurve, healthCurve, spiritCurve, damageCurve, armorCurve, monsterDamageCurve, monsterArmorCurve, monsterAttackCurve, monsterDefenceCurve, monsterHealthCurve, monsterExperienceCurve, itemStatCurve, itemGoldCurve, dungeonPriceCurve, monsterUnlockPriceCurve, scrollPriceCurve, globalUpgradePriceCurve, MONSTER_RANK_KILL_STEP, DUNGEON_WALK_SPEED, WORLD_WALK_SPEED, DEFAULT_MULTI_ATTACK_CHANCE, DEFAULT_CHAIN_CHANCE, DEFAULT_MINION_LIMIT, BASE_INVENTORY_CAPACITY, RETREAT_HEALTH_RATIO, RETREAT_SPIRIT_RATIO, MAX_PRESTIGE_INVENTORY_BONUS, walkingSpeedBonus, dungeonCostBonus, itemCostBonus, scrollCapacityBonus, potionCapacityBonus, partyCapacityBonus, potionDurationBonus, potionPowerBonus, offlineTimeBonus, equipmentQualityBonus, attackCooldownBonus, healthRegenerationBonus, spiritRegenerationBonus, BASE_POTION_CAPACITY, doubleKillsModifier, doubleGoldModifier, doubleExperienceModifier, walkingSpeedModifier, fasterFarmingModifier, fasterInfestationModifier, infiniteScrollsModifier, extraMonstersModifier, guaranteedItemDropsModifier, potionDurationModifier, freeSpellsModifier, farmKillsModifier, docileMonstersModifier, itemGoldModifier, frailMonstersModifier, autoScrollsModifier, doubleGoldDropsModifier, doubleItemDropsModifier, treasureRoomModifier, bossEncounterModifier, CHEST_ITEM_QUALITY_BONUS, CHEST_ITEM_LEVEL_BONUS, MIN_ROOM_DIMENSION, MAX_ROOM_SIZE, ROOM_SPACING, globalUpgradeDefinitions, VISIBLE_MONSTER_LEVELS, BASE_HIGHER_ITEM_CHANCE, LOWER_ITEM_LEVEL_CHANCE, itemRarityProbabilities, itemRarityTiers, EFFECT_FRAME_DURATION_MS, PROJECTILE_FRAME_DURATION_MS, globalUpgradesById, globalUpgradesToIndex, upgradeIndexKey, upgradeIndexEntry, characterLevelUpgrades, equipmentUpgrades, globalUpgrades, scrollUpgradeIndex, scrollUpgrades, monsterLevelUpgrades, castleUpgrades, itemPurchaseUpgrades, achievementClaimUpgrades, farmAndDungeonUpgrades, monsterUpgradeCollection, characterUpgradeCollection, quickUpgradeCollection, upgradeCollections;
export function rollGoldDrop() {
  var minGold = globalUpgradeDefinitions.minGoldPerDrop.currentValue,
    goldRollSpan = Math.max(0, globalUpgradeDefinitions.maxGoldPerDrop.currentValue - minGold),
    goldMultiplier = doubleGoldModifier.currentValue;
  return (minGold + randomInt(goldRollSpan)) * goldMultiplier;
}
export function initializeContentBalance(dependencies) {
  experienceCurve = {
    power: 2.1,
    coefficient: 500,
    growth: 1.005,
    base: 100
  };
  healthCurve = {
    power: 1.5,
    coefficient: 15,
    growth: 1.017,
    base: 85
  };
  spiritCurve = {
    power: 1.5,
    coefficient: 15,
    growth: 1.017,
    base: 85
  };
  damageCurve = {
    power: 1.6,
    coefficient: 25,
    growth: 1.017,
    base: 22
  };
  armorCurve = {
    power: 1.8,
    coefficient: 15,
    growth: 1.015,
    base: 15
  };
  monsterDamageCurve = {
    power: 1.7,
    coefficient: 1,
    growth: 1.0017,
    base: 30
  };
  monsterArmorCurve = {
    power: 1.7,
    coefficient: 1,
    growth: 1.0017,
    base: 25
  };
  monsterAttackCurve = {
    power: 1.7,
    coefficient: 1,
    growth: 1.0017,
    base: 30
  };
  monsterDefenceCurve = {
    power: 1.7,
    coefficient: 1,
    growth: 1.0017,
    base: 25
  };
  monsterHealthCurve = {
    power: 1.7,
    coefficient: 1,
    growth: 1.0018,
    base: 15
  };
  monsterExperienceCurve = {
    power: 1.24,
    coefficient: 1,
    growth: 1.0002,
    base: 4
  };
  itemStatCurve = {
    power: 1.8,
    coefficient: 15,
    growth: 1.015,
    base: 15
  };
  itemGoldCurve = {
    power: 1.8,
    coefficient: 15,
    growth: 1.015,
    base: 15
  };
  dungeonPriceCurve = {
    power: 1.7,
    coefficient: 120,
    growth: 1.018,
    base: 100
  };
  monsterUnlockPriceCurve = {
    power: 1.02,
    coefficient: 100,
    growth: 1.01,
    base: 100
  };
  scrollPriceCurve = {
    power: 1.4,
    coefficient: 250,
    growth: 1.018,
    base: 100
  };
  globalUpgradePriceCurve = {
    power: 1.02,
    coefficient: 50,
    growth: 1.01,
    base: 100
  };
  MONSTER_RANK_KILL_STEP = 20;
  DUNGEON_WALK_SPEED = 1.3;
  WORLD_WALK_SPEED = 1.5;
  DEFAULT_MULTI_ATTACK_CHANCE = 25;
  DEFAULT_CHAIN_CHANCE = 25;
  DEFAULT_MINION_LIMIT = 1;
  BASE_INVENTORY_CAPACITY = 20;
  RETREAT_HEALTH_RATIO = 0.4;
  RETREAT_SPIRIT_RATIO = 0.3;
  MAX_PRESTIGE_INVENTORY_BONUS = 10;
  walkingSpeedBonus = {
    currentValue: 1,
    defaultValue: 1,
    levelIncrement: 0.1
  };
  dungeonCostBonus = {
    currentValue: 1,
    defaultValue: 1,
    levelIncrement: -0.1
  };
  itemCostBonus = {
    currentValue: 1,
    defaultValue: 1,
    levelIncrement: -0.1
  };
  scrollCapacityBonus = {
    currentValue: 0,
    defaultValue: 0,
    levelIncrement: 10
  };
  potionCapacityBonus = {
    currentValue: 0,
    defaultValue: 0,
    levelIncrement: 1
  };
  partyCapacityBonus = {
    currentValue: 0,
    defaultValue: 0,
    levelIncrement: 1
  };
  potionDurationBonus = {
    currentValue: 0,
    defaultValue: 0,
    levelIncrement: 120
  };
  potionPowerBonus = {
    currentValue: 0,
    defaultValue: 0,
    levelIncrement: 20
  };
  offlineTimeBonus = {
    currentValue: 0,
    defaultValue: 0,
    levelIncrement: 72E5
  };
  equipmentQualityBonus = {
    currentValue: 0,
    defaultValue: 0,
    levelIncrement: 0.01
  };
  attackCooldownBonus = {
    currentValue: 0,
    defaultValue: 0,
    levelIncrement: -1
  };
  healthRegenerationBonus = {
    currentValue: 0,
    defaultValue: 0,
    levelIncrement: 1
  };
  spiritRegenerationBonus = {
    currentValue: 0,
    defaultValue: 0,
    levelIncrement: 1
  };
  BASE_POTION_CAPACITY = 6;
  doubleKillsModifier = {
    currentValue: 1,
    defaultValue: 1,
    activeValue: 2
  };
  doubleGoldModifier = {
    currentValue: 1,
    defaultValue: 1,
    activeValue: 2
  };
  doubleExperienceModifier = {
    currentValue: 1,
    defaultValue: 1,
    activeValue: 2
  };
  walkingSpeedModifier = {
    currentValue: 1,
    defaultValue: 1,
    activeValue: 1.25
  };
  fasterFarmingModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  fasterInfestationModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  infiniteScrollsModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  extraMonstersModifier = {
    currentValue: 0,
    defaultValue: 0,
    activeValue: 10
  };
  guaranteedItemDropsModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  potionDurationModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  freeSpellsModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  farmKillsModifier = {
    currentValue: 1,
    defaultValue: 1,
    activeValue: 2
  };
  docileMonstersModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  itemGoldModifier = {
    currentValue: 1,
    defaultValue: 1,
    activeValue: 1.2
  };
  frailMonstersModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  autoScrollsModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  doubleGoldDropsModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  doubleItemDropsModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  treasureRoomModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  bossEncounterModifier = {
    currentValue: false,
    defaultValue: false,
    activeValue: true
  };
  CHEST_ITEM_QUALITY_BONUS = 15;
  CHEST_ITEM_LEVEL_BONUS = 10;
  MIN_ROOM_DIMENSION = 5;
  MAX_ROOM_SIZE = 10;
  ROOM_SPACING = 5;
  globalUpgradeDefinitions = {
    itemDropChance: {
      settingId: "itemDropChance",
      title: "更多道具掉落",
      description: "每次杀怪道具掉落几率+2%",
      currentValue: 40,
      baseValue: 40,
      perLevelIncrement: 2,
      purchasedLevels: 0,
      maxValue: 100,
      cost: 40,
      baseCost: 1,
      costPerLevel: 11
    },
    maxMonsters: {
      settingId: "maxMonstersPerRoom",
      title: "等多怪物",
      description: "房间内最多怪物数量(+2)",
      currentValue: 8,
      baseValue: 8,
      perLevelIncrement: 2,
      purchasedLevels: 0,
      maxValue: 50,
      cost: 100,
      baseCost: 2,
      costPerLevel: 11
    },
    minMonsters: {
      settingId: "minMonstersPerRoom",
      title: "平均怪物计数",
      description: "房间内最少怪物数量(+1)",
      currentValue: 0,
      baseValue: 0,
      perLevelIncrement: 1,
      purchasedLevels: 0,
      maxValue: 50,
      cost: 140,
      baseCost: 2,
      costPerLevel: 11
    },
    itemQualityChance: {
      settingId: "betterItemRarityChance",
      title: "稀有道具掉落",
      description: "更加稀有道具掉落几率(+2%)",
      currentValue: 0,
      baseValue: 0,
      perLevelIncrement: 2,
      purchasedLevels: 0,
      maxValue: 30,
      cost: 120,
      baseCost: 3,
      costPerLevel: 11
    },
    higherLevelItemChance: {
      settingId: "itemLevelBonus",
      title: "道具等级加成",
      description: "更高等级道具掉落几率(+3%)",
      currentValue: 0,
      baseValue: 0,
      perLevelIncrement: 3,
      purchasedLevels: 0,
      maxValue: 30,
      cost: 160,
      baseCost: 4,
      costPerLevel: 11
    },
    maxGoldPerDrop: {
      settingId: "maxGoldPerDrop",
      title: "最大黄金掉落",
      description: "最大掉落黄金数量+25",
      currentValue: 15,
      baseValue: 15,
      perLevelIncrement: 25,
      purchasedLevels: 0,
      maxValue: 2500,
      cost: 200,
      baseCost: 6,
      costPerLevel: 11
    },
    minGoldPerDrop: {
      settingId: "minGoldPerDrop",
      title: "最小黄金掉落",
      description: "最小掉落黄金数量+10",
      currentValue: 0,
      baseValue: 0,
      perLevelIncrement: 10,
      purchasedLevels: 0,
      maxValue: 2E3,
      cost: 300,
      baseCost: 10,
      costPerLevel: 11
    },
    goldDropChance: {
      settingId: "goldDropChance",
      title: "更多黄金掉落",
      description: "每次杀怪黄金掉落几率+5%",
      currentValue: 25,
      baseValue: 25,
      perLevelIncrement: 5,
      purchasedLevels: 0,
      maxValue: 100,
      cost: 200,
      baseCost: 5,
      costPerLevel: 11
    },
    scrollDropChance: {
      settingId: "scrollDropChance",
      title: "更多卷轴掉落",
      description: "每次杀怪卷轴掉落几率+2%",
      currentValue: 20,
      baseValue: 20,
      perLevelIncrement: 2,
      purchasedLevels: 0,
      maxValue: 40,
      cost: 200,
      baseCost: 7,
      costPerLevel: 11
    },
    potionDropChance: {
      settingId: "potionDropChance",
      title: "更多药剂掉落",
      description: "每次杀怪药剂掉落几率+0.5%",
      currentValue: 1,
      baseValue: 1,
      perLevelIncrement: 0.5,
      purchasedLevels: 0,
      maxValue: 5,
      cost: 300,
      baseCost: 8,
      costPerLevel: 11
    },
    treasureChance: {
      settingId: "treasureChestChance",
      title: "更多财宝箱",
      description: "遇到财宝箱几率+2%",
      currentValue: 5,
      baseValue: 5,
      perLevelIncrement: 2,
      purchasedLevels: 0,
      maxValue: 20,
      cost: 340,
      baseCost: 9,
      costPerLevel: 11
    }
  };
  VISIBLE_MONSTER_LEVELS = 5;
  BASE_HIGHER_ITEM_CHANCE = 0.1;
  LOWER_ITEM_LEVEL_CHANCE = 0.15;
  itemRarityProbabilities = [0.8, 0.16, 0.036, 0.0036, 4E-4];
  itemRarityTiers = [{
    tierId: 0,
    statMultiplier: 1,
    elementalEffectChance: 0.2
  }, {
    tierId: 1,
    statMultiplier: 1.2,
    elementalEffectChance: 0.5
  }, {
    tierId: 2,
    statMultiplier: 1.35,
    elementalEffectChance: 0.75
  }, {
    tierId: 3,
    statMultiplier: 1.5,
    elementalEffectChance: 0.9
  }, {
    tierId: 4,
    statMultiplier: 1.65,
    elementalEffectChance: 0.99
  }];
  EFFECT_FRAME_DURATION_MS = 170;
  PROJECTILE_FRAME_DURATION_MS = 60;
  globalUpgradesById = {};
  globalUpgradesToIndex = globalUpgradeDefinitions;
  for (upgradeIndexKey in globalUpgradesToIndex) {
    if (Object.prototype.hasOwnProperty.call(globalUpgradesToIndex, upgradeIndexKey)) {
      upgradeIndexEntry = globalUpgradesToIndex[upgradeIndexKey];
      if (upgradeIndexEntry.settingId) {
        if (globalUpgradesById[upgradeIndexEntry.settingId]) {
          console.log("setting object duplicate settingId: " + upgradeIndexEntry.settingId + " setting: " + upgradeIndexKey);
        } else {
          globalUpgradesById[upgradeIndexEntry.settingId] = upgradeIndexEntry;
        }
      } else {
        console.log("setting object missing settingId: " + upgradeIndexKey);
      }
    }
  }
  characterLevelUpgrades = [new dependencies.LevelUpUpgrade(0), new dependencies.LevelUpUpgrade(1), new dependencies.LevelUpUpgrade(2), new dependencies.LevelUpUpgrade(3), new dependencies.LevelUpUpgrade(4)];
  equipmentUpgrades = [new dependencies.EquipBestItemUpgrade(5), new dependencies.EquipItemUpgrade(0, 5), new dependencies.EquipItemUpgrade(1, 5), new dependencies.EquipItemUpgrade(2, 5), new dependencies.EquipItemUpgrade(3, 5), new dependencies.EquipItemUpgrade(4, 5)];
  globalUpgrades = [new dependencies.GlobalUpgrade(globalUpgradeDefinitions.goldDropChance), new dependencies.GlobalUpgrade(globalUpgradeDefinitions.maxGoldPerDrop), new dependencies.GlobalUpgrade(globalUpgradeDefinitions.minGoldPerDrop), new dependencies.GlobalUpgrade(globalUpgradeDefinitions.itemDropChance), new dependencies.GlobalUpgrade(globalUpgradeDefinitions.scrollDropChance), new dependencies.GlobalUpgrade(globalUpgradeDefinitions.potionDropChance), new dependencies.GlobalUpgrade(globalUpgradeDefinitions.itemQualityChance), new dependencies.GlobalUpgrade(globalUpgradeDefinitions.maxMonsters), new dependencies.GlobalUpgrade(globalUpgradeDefinitions.minMonsters), new dependencies.GlobalUpgrade(globalUpgradeDefinitions.higherLevelItemChance), new dependencies.GlobalUpgrade(globalUpgradeDefinitions.treasureChance)];
  scrollUpgrades = [];
  for (scrollUpgradeIndex = 0; scrollUpgradeIndex < dependencies.scrollDefinitions.length; scrollUpgradeIndex++) {
    scrollUpgrades.push(new dependencies.ScrollUpgrade(dependencies.scrollDefinitions[scrollUpgradeIndex].scrollId));
  }
  monsterLevelUpgrades = [new dependencies.UnlockMonsterLevelUpgrade(), new dependencies.RetireMonsterLevelUpgrade()];
  castleUpgrades = [new dependencies.PurchaseCastleUpgrade(0), new dependencies.PurchaseCastleUpgrade(1), new dependencies.PurchaseCastleUpgrade(2), new dependencies.PurchaseCastleUpgrade(3)];
  itemPurchaseUpgrades = [new dependencies.PurchaseItemUpgrade(0), new dependencies.PurchaseItemUpgrade(1), new dependencies.PurchaseItemUpgrade(2), new dependencies.PurchaseItemUpgrade(3)];
  achievementClaimUpgrades = [new dependencies.ClaimAchievementUpgrade(0), new dependencies.ClaimAchievementUpgrade(1), new dependencies.ClaimAchievementUpgrade(2), new dependencies.ClaimAchievementUpgrade(3)];
  farmAndDungeonUpgrades = [new dependencies.AutoPurchaseDungeonUpgrade(), new dependencies.CollectFarmUpgrade()];
  monsterUpgradeCollection = new dependencies.UpgradeCollection([globalUpgrades, monsterLevelUpgrades], true);
  characterUpgradeCollection = new dependencies.UpgradeCollection([characterLevelUpgrades], false);
  quickUpgradeCollection = new dependencies.UpgradeCollection([farmAndDungeonUpgrades, characterLevelUpgrades, equipmentUpgrades, globalUpgrades, monsterLevelUpgrades, castleUpgrades, itemPurchaseUpgrades, achievementClaimUpgrades, scrollUpgrades], true);
  upgradeCollections = [monsterUpgradeCollection, characterUpgradeCollection, quickUpgradeCollection];
}
