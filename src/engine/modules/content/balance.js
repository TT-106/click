/** 全局成长参数、药水修正和升级列表。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { randomInt } from "../core/math.js";
import { AutoPurchaseDungeonUpgrade, ClaimAchievementUpgrade, CollectFarmUpgrade, EquipBestItemUpgrade, EquipItemUpgrade, GlobalUpgrade, LevelUpUpgrade, PurchaseCastleUpgrade, PurchaseItemUpgrade, RetireMonsterLevelUpgrade, ScrollUpgrade, UnlockMonsterLevelUpgrade, UpgradeCollection } from "../progression/upgrades.js";
import { scrollDefinitions } from "../combat/scrolls.js";
export var experienceCurve, healthCurve, spiritCurve, damageCurve, armorCurve, monsterHealthCurve, monsterSpiritCurve, monsterAttackCurve, monsterDefenceCurve, monsterDamageCurve, monsterArmorCurve, itemStatCurve, itemGoldCurve, dungeonPriceCurve, monsterUnlockPriceCurve, scrollPriceCurve, globalUpgradePriceCurve, MONSTER_RANK_KILL_STEP, DUNGEON_WALK_SPEED, WORLD_WALK_SPEED, DEFAULT_MULTI_ATTACK_CHANCE, DEFAULT_CHAIN_CHANCE, DEFAULT_MINION_LIMIT, BASE_INVENTORY_CAPACITY, RETREAT_HEALTH_RATIO, RETREAT_SPIRIT_RATIO, MAX_PRESTIGE_INVENTORY_BONUS, walkingSpeedBonus, dungeonCostBonus, itemCostBonus, scrollCapacityBonus, potionCapacityBonus, partyCapacityBonus, potionDurationBonus, potionPowerBonus, offlineTimeBonus, equipmentQualityBonus, attackCooldownBonus, healthRegenerationBonus, spiritRegenerationBonus, BASE_POTION_CAPACITY, doubleKillsModifier, doubleGoldModifier, doubleExperienceModifier, walkingSpeedModifier, fasterFarmingModifier, fasterInfestationModifier, infiniteScrollsModifier, extraMonstersModifier, guaranteedItemDropsModifier, potionDurationModifier, freeSpellsModifier, farmKillsModifier, docileMonstersModifier, itemGoldModifier, frailMonstersModifier, autoScrollsModifier, doubleGoldDropsModifier, doubleItemDropsModifier, treasureRoomModifier, bossEncounterModifier, CHEST_ITEM_QUALITY_BONUS, CHEST_ITEM_LEVEL_BONUS, MIN_ROOM_DIMENSION, MAX_ROOM_SIZE, ROOM_SPACING, globalUpgradeDefinitions, VISIBLE_MONSTER_LEVELS, BASE_HIGHER_ITEM_CHANCE, LOWER_ITEM_LEVEL_CHANCE, itemRarityProbabilities, itemRarityTiers, EFFECT_FRAME_DURATION_MS, PROJECTILE_FRAME_DURATION_MS, globalUpgradesById, globalUpgradesToIndex, upgradeIndexKey, upgradeIndexEntry, characterLevelUpgrades, equipmentUpgrades, globalUpgrades, scrollUpgradeIndex, scrollUpgrades, monsterLevelUpgrades, castleUpgrades, itemPurchaseUpgrades, achievementClaimUpgrades, farmAndDungeonUpgrades, monsterUpgradeCollection, characterUpgradeCollection, quickUpgradeCollection, upgradeCollections;
export function rollGoldDrop() {
  var a = globalUpgradeDefinitions.As.currentValue,
    b = Math.max(0, globalUpgradeDefinitions.ys.currentValue - a),
    c = doubleGoldModifier.currentValue;
  return (a + randomInt(b)) * c;
}
export function initializeContentBalance() {
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
  monsterHealthCurve = {
    power: 1.7,
    coefficient: 1,
    growth: 1.0017,
    base: 30
  };
  monsterSpiritCurve = {
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
  monsterDamageCurve = {
    power: 1.7,
    coefficient: 1,
    growth: 1.0018,
    base: 15
  };
  monsterArmorCurve = {
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
      e: "每次杀怪道具掉落几率+2%",
      currentValue: 40,
      baseValue: 40,
      perLevelIncrement: 2,
      purchasedLevels: 0,
      maxValue: 100,
      rd: 40,
      ah: 1,
      Pg: 11
    },
    maxMonsters: {
      settingId: "maxMonstersPerRoom",
      title: "等多怪物",
      e: "房间内最多怪物数量(+2)",
      currentValue: 8,
      baseValue: 8,
      perLevelIncrement: 2,
      purchasedLevels: 0,
      maxValue: 50,
      rd: 100,
      ah: 2,
      Pg: 11
    },
    minMonsters: {
      settingId: "minMonstersPerRoom",
      title: "平均怪物计数",
      e: "房间内最少怪物数量(+1)",
      currentValue: 0,
      baseValue: 0,
      perLevelIncrement: 1,
      purchasedLevels: 0,
      maxValue: 50,
      rd: 140,
      ah: 2,
      Pg: 11
    },
    itemQualityChance: {
      settingId: "betterItemRarityChance",
      title: "稀有道具掉落",
      e: "更加稀有道具掉落几率(+2%)",
      currentValue: 0,
      baseValue: 0,
      perLevelIncrement: 2,
      purchasedLevels: 0,
      maxValue: 30,
      rd: 120,
      ah: 3,
      Pg: 11
    },
    higherLevelItemChance: {
      settingId: "itemLevelBonus",
      title: "道具等级加成",
      e: "更高等级道具掉落几率(+3%)",
      currentValue: 0,
      baseValue: 0,
      perLevelIncrement: 3,
      purchasedLevels: 0,
      maxValue: 30,
      rd: 160,
      ah: 4,
      Pg: 11
    },
    ys: {
      settingId: "maxGoldPerDrop",
      title: "最大黄金掉落",
      e: "最大掉落黄金数量+25",
      currentValue: 15,
      baseValue: 15,
      perLevelIncrement: 25,
      purchasedLevels: 0,
      maxValue: 2500,
      rd: 200,
      ah: 6,
      Pg: 11
    },
    As: {
      settingId: "minGoldPerDrop",
      title: "最小黄金掉落",
      e: "最小掉落黄金数量+10",
      currentValue: 0,
      baseValue: 0,
      perLevelIncrement: 10,
      purchasedLevels: 0,
      maxValue: 2E3,
      rd: 300,
      ah: 10,
      Pg: 11
    },
    Lr: {
      settingId: "goldDropChance",
      title: "更多黄金掉落",
      e: "每次杀怪黄金掉落几率+5%",
      currentValue: 25,
      baseValue: 25,
      perLevelIncrement: 5,
      purchasedLevels: 0,
      maxValue: 100,
      rd: 200,
      ah: 5,
      Pg: 11
    },
    $s: {
      settingId: "scrollDropChance",
      title: "更多卷轴掉落",
      e: "每次杀怪卷轴掉落几率+2%",
      currentValue: 20,
      baseValue: 20,
      perLevelIncrement: 2,
      purchasedLevels: 0,
      maxValue: 40,
      rd: 200,
      ah: 7,
      Pg: 11
    },
    Ns: {
      settingId: "potionDropChance",
      title: "更多药剂掉落",
      e: "每次杀怪药剂掉落几率+0.5%",
      currentValue: 1,
      baseValue: 1,
      perLevelIncrement: 0.5,
      purchasedLevels: 0,
      maxValue: 5,
      rd: 300,
      ah: 8,
      Pg: 11
    },
    treasureChance: {
      settingId: "treasureChestChance",
      title: "更多财宝箱",
      e: "遇到财宝箱几率+2%",
      currentValue: 5,
      baseValue: 5,
      perLevelIncrement: 2,
      purchasedLevels: 0,
      maxValue: 20,
      rd: 340,
      ah: 9,
      Pg: 11
    }
  };
  VISIBLE_MONSTER_LEVELS = 5;
  BASE_HIGHER_ITEM_CHANCE = 0.1;
  LOWER_ITEM_LEVEL_CHANCE = 0.15;
  itemRarityProbabilities = [0.8, 0.16, 0.036, 0.0036, 4E-4];
  itemRarityTiers = [{
    Vp: 0,
    pp: 1,
    jp: 0.2
  }, {
    Vp: 1,
    pp: 1.2,
    jp: 0.5
  }, {
    Vp: 2,
    pp: 1.35,
    jp: 0.75
  }, {
    Vp: 3,
    pp: 1.5,
    jp: 0.9
  }, {
    Vp: 4,
    pp: 1.65,
    jp: 0.99
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
  characterLevelUpgrades = [new LevelUpUpgrade(0), new LevelUpUpgrade(1), new LevelUpUpgrade(2), new LevelUpUpgrade(3), new LevelUpUpgrade(4)];
  equipmentUpgrades = [new EquipBestItemUpgrade(5), new EquipItemUpgrade(0, 5), new EquipItemUpgrade(1, 5), new EquipItemUpgrade(2, 5), new EquipItemUpgrade(3, 5), new EquipItemUpgrade(4, 5)];
  globalUpgrades = [new GlobalUpgrade(globalUpgradeDefinitions.Lr), new GlobalUpgrade(globalUpgradeDefinitions.ys), new GlobalUpgrade(globalUpgradeDefinitions.As), new GlobalUpgrade(globalUpgradeDefinitions.itemDropChance), new GlobalUpgrade(globalUpgradeDefinitions.$s), new GlobalUpgrade(globalUpgradeDefinitions.Ns), new GlobalUpgrade(globalUpgradeDefinitions.itemQualityChance), new GlobalUpgrade(globalUpgradeDefinitions.maxMonsters), new GlobalUpgrade(globalUpgradeDefinitions.minMonsters), new GlobalUpgrade(globalUpgradeDefinitions.higherLevelItemChance), new GlobalUpgrade(globalUpgradeDefinitions.treasureChance)];
  scrollUpgrades = [];
  for (scrollUpgradeIndex = 0; scrollUpgradeIndex < scrollDefinitions.length; scrollUpgradeIndex++) {
    scrollUpgrades.push(new ScrollUpgrade(scrollDefinitions[scrollUpgradeIndex].scrollId));
  }
  monsterLevelUpgrades = [new UnlockMonsterLevelUpgrade(), new RetireMonsterLevelUpgrade()];
  castleUpgrades = [new PurchaseCastleUpgrade(0), new PurchaseCastleUpgrade(1), new PurchaseCastleUpgrade(2), new PurchaseCastleUpgrade(3)];
  itemPurchaseUpgrades = [new PurchaseItemUpgrade(0), new PurchaseItemUpgrade(1), new PurchaseItemUpgrade(2), new PurchaseItemUpgrade(3)];
  achievementClaimUpgrades = [new ClaimAchievementUpgrade(0), new ClaimAchievementUpgrade(1), new ClaimAchievementUpgrade(2), new ClaimAchievementUpgrade(3)];
  farmAndDungeonUpgrades = [new AutoPurchaseDungeonUpgrade(), new CollectFarmUpgrade()];
  monsterUpgradeCollection = new UpgradeCollection([globalUpgrades, monsterLevelUpgrades], true);
  characterUpgradeCollection = new UpgradeCollection([characterLevelUpgrades], false);
  quickUpgradeCollection = new UpgradeCollection([farmAndDungeonUpgrades, characterLevelUpgrades, equipmentUpgrades, globalUpgrades, monsterLevelUpgrades, castleUpgrades, itemPurchaseUpgrades, achievementClaimUpgrades, scrollUpgrades], true);
  upgradeCollections = [monsterUpgradeCollection, characterUpgradeCollection, quickUpgradeCollection];
}
