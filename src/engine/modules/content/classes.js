/** 职业、初始装备、技能树与行为配置。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { barbarianSpellDefinitions, chickenSpellDefinitions, druidSpellDefinitions, electricSpellDefinitions, fighterSpellDefinitions, fireSpellDefinitions, necromancerSpellDefinitions, ninjaSpellDefinitions, priestSpellDefinitions, rogueSpellDefinitions } from "./spells.js";
import { CharacterSkillUpgrade, LearnSpellUpgrade } from "../progression/upgrades.js";
import { additionalAttackPercentFighter1Definition, additionalAttackPercentFighter2Definition, additionalAttackPercentFighter3Definition, attacksPerTurnFighter1Definition, attacksPerTurnFighter2Definition, attacksPerTurnFighter3Definition, criticalHitChanceFighter1Definition, criticalHitChanceFighter2Definition, criticalHitChanceFighter3Definition, criticalHitChanceFighter4Definition, fasterAttacksFighter1Definition, fasterAttacksFighter2Definition, fasterAttacksFighter3Definition, healthRegenerationFighter1Definition, healthRegenerationFighter2Definition, healthRegenerationFighter3Definition, ignoreDamageFighter1Definition, ignoreDamageFighter2Definition, ignoreDamageFighter3Definition, ignoreDamageFighter4Definition, improvedArmorFighter1Definition, improvedArmorFighter2Definition, improvedArmorFighter3Definition, improvedAttackRatingFighter1Definition, improvedAttackRatingFighter2Definition, improvedAttackRatingFighter3Definition, improvedDamageFighter1Definition, improvedDamageFighter2Definition, improvedDamageFighter3Definition, improvedDefenseRatingFighter1Definition, improvedDefenseRatingFighter2Definition, improvedDefenseRatingFighter3Definition, improvedHealthFighter1Definition, improvedHealthFighter2Definition, improvedHealthFighter3Definition } from "./skills/fighter.js";
import { MELEE_ACTION_TYPE, armorSpellDefinition, attackRatingSpellDefinition, chainedLightningSpellDefinition, damageSpellDefinition, defenseRatingSpellDefinition, detectTreasureChestSpellDefinition, fireBallSpellDefinition, fireBlastSpellDefinition, fireRainSpellDefinition, greenDeathSpellDefinition, healSpellDefinition, hurtSpellDefinition, instantLootSpellDefinition, lightningRainSpellDefinition, minorHealSpellDefinition, rageSpellDefinition, reviveSpellDefinition, shockSpellDefinition, sledgeHammerSpellDefinition, sleepSpellDefinition, spiderWebSpellDefinition, stealthSpellDefinition, summonChickensSpellDefinition, summonDogSpellDefinition, summonGuardChickenSpellDefinition, summonPhantomSkullSpellDefinition, summonSkeletonArmySpellDefinition, summonWolfPackSpellDefinition, swiftStrikeSpellDefinition, tauntSpellDefinition, turnMonsterSpellDefinition } from "../ai/targeting.js";
import { ApplyEffectBehavior, AreaDamageBehavior, AreaSpellBehavior, ChainDamageBehavior, ChangeFloorBehavior, CompanionSpellBehavior, EnterCastleBehavior, EnterDungeonBehavior, FollowLeaderBehavior, GuardRangedBehavior, HealBehavior, LifeDrainBehavior, LootChestBehavior, LootGoldBehavior, LootItemBehavior, LootPotionBehavior, LootScrollBehavior, MeleeAttackBehavior, OpportunisticAttackBehavior, PartyBuffBehavior, RangedAttackBehavior, ReviveBehavior, SelfSpellBehavior, StunnedBehavior, SummonBehavior, TargetSpellBehavior, TravelWorldBehavior, UseShopBehavior, WaitBehavior } from "../ai/behaviors.js";
import { fasterAttacksPriest1Definition, healthRegenerationPriest1Definition, healthRegenerationPriest2Definition, ignoreDamagePriest1Definition, ignoreDamagePriest2Definition, improvedArmorPriest1Definition, improvedArmorPriest2Definition, improvedArmorPriest3Definition, improvedArmorSpellPriestDefinition, improvedAttackRatingPriest1Definition, improvedAttackRatingPriest2Definition, improvedAttackRatingPriest3Definition, improvedAttackRatingSpellPriestDefinition, improvedDamagePriest1Definition, improvedDamagePriest2Definition, improvedDamagePriest3Definition, improvedDamageSpellPriestDefinition, improvedDefenseRatingPriest1Definition, improvedDefenseRatingPriest2Definition, improvedDefenseRatingPriest3Definition, improvedDefenseRatingSpellPriestDefinition, improvedHealingSpellPriestDefinition, improvedHealthPriest1Definition, improvedHealthPriest2Definition, improvedSpiritPriest1Definition, improvedSpiritPriest2Definition, spellCostPriest1Definition, spellCostPriest2Definition, spiritRegenerationPriest1Definition, spiritRegenerationPriest2Definition } from "./skills/priest.js";
import { criticalHitChanceRanger1Definition, criticalHitChanceRanger2Definition, criticalHitChanceRanger3Definition, criticalHitChanceRanger4Definition, fasterAttacksRanger1Definition, fasterAttacksRanger2Definition, fasterAttacksRanger3Definition, healthRegenerationRanger1Definition, healthRegenerationRanger2Definition, healthRegenerationRanger3Definition, improvedArmorRanger1Definition, improvedArmorRanger2Definition, improvedArmorRanger3Definition, improvedAttackRatingRanger1Definition, improvedAttackRatingRanger2Definition, improvedAttackRatingRanger3Definition, improvedDamageRanger1Definition, improvedDamageRanger2Definition, improvedDamageRanger3Definition, improvedDefenseRatingRanger1Definition, improvedDefenseRatingRanger2Definition, improvedDefenseRatingRanger3Definition, improvedHealthRanger1Definition, improvedHealthRanger2Definition, improvedHealthRanger3Definition, ricochetCountRanger1Definition, ricochetCountRanger2Definition, ricochetCountRanger3Definition, ricochetCountRanger4Definition, ricochetPercentRanger1Definition, ricochetPercentRanger2Definition, ricochetPercentRanger3Definition, ricochetPercentRanger4Definition } from "./skills/ranger.js";
import { fasterAttacksMageFire1Definition, fasterAttacksMageFire2Definition, healthRegenerationMageFire1Definition, healthRegenerationMageFire2Definition, improvedArmorMageFire1Definition, improvedArmorMageFire2Definition, improvedArmorMageFire3Definition, improvedAttackRatingMageFire1Definition, improvedAttackRatingMageFire2Definition, improvedAttackRatingMageFire3Definition, improvedDamageMageFire1Definition, improvedDamageMageFire2Definition, improvedDamageMageFire3Definition, improvedDefenseRatingMageFire1Definition, improvedDefenseRatingMageFire2Definition, improvedDefenseRatingMageFire3Definition, improvedFireRainMageFire1Definition, improvedFireRainMageFire2Definition, improvedFireballMageFire1Definition, improvedFireballMageFire2Definition, improvedHealthMageFire1Definition, improvedHealthMageFire2Definition, improvedSpiritMageFire1Definition, improvedSpiritMageFire2Definition, improvedTurnMonsters1Definition, improvedTurnMonsters2Definition, improvedTurnMonsters3Definition, spellCostMageFire1Definition, spellCostMageFire2Definition, spiritRegenerationMageFire1Definition, spiritRegenerationMageFire2Definition } from "./skills/pyromancer.js";
import { additionalAttackPercentRogue1Definition, additionalAttackPercentRogue2Definition, additionalAttackPercentRogue3Definition, additionalAttackPercentRogue4Definition, attacksPerTurnRogue1Definition, attacksPerTurnRogue1Definition2, criticalHitChanceRogue1Definition, criticalHitChanceRogue2Definition, criticalHitChanceRogue3Definition, fasterAttacksRogue1Definition, fasterAttacksRogue2Definition, fasterAttacksRogue3Definition, healthRegenerationRogue1Definition, healthRegenerationRogue2Definition, healthRegenerationRogue3Definition, improvedArmorRogue1Definition, improvedArmorRogue2Definition, improvedArmorRogue3Definition, improvedAttackRatingRogue1Definition, improvedAttackRatingRogue2Definition, improvedAttackRatingRogue3Definition, improvedDamageRogue1Definition, improvedDamageRogue2Definition, improvedDamageRogue3Definition, improvedDefenseRatingRogue1Definition, improvedDefenseRatingRogue2Definition, improvedDefenseRatingRogue3Definition, improvedHealthRogue1Definition, improvedHealthRogue2Definition, improvedHealthRogue3Definition, improvedSpiritRogue1Definition, spiritRegenerationRogue1Definition, spiritRegenerationRogue2Definition } from "./skills/rogue.js";
import { fasterAttacksDruid1Definition, fasterAttacksDruid2Definition, healthRegenerationDruid1Definition, healthRegenerationDruid2Definition, improvedArmorDruid1Definition, improvedArmorDruid2Definition, improvedArmorDruid3Definition, improvedAttackRatingDruid1Definition, improvedAttackRatingDruid2Definition, improvedAttackRatingDruid3Definition, improvedDamageDruid1Definition, improvedDamageDruid2Definition, improvedDamageDruid3Definition, improvedDefenseRatingDruid1Definition, improvedDefenseRatingDruid2Definition, improvedDefenseRatingDruid3Definition, improvedHealthDruid1Definition, improvedHealthDruid2Definition, improvedSleepDruid1Definition, improvedSleepDruid2Definition, improvedSleepDruid3Definition, improvedSpiritDruid1Definition, improvedSpiritDruid2Definition, largerWolfPackDruid1Definition, largerWolfPackDruid2Definition, largerWolfPackDruid3Definition, largerWolfPackDruid4Definition, largerWolfPackDruid5Definition, spellCostDruid1Definition, spellCostDruid2Definition, spiritRegenerationDruid1Definition, spiritRegenerationDruid2Definition } from "./skills/druid.js";
import { criticalHitChanceBarbarian1Definition, criticalHitChanceBarbarian2Definition, criticalHitChanceBarbarian3Definition, criticalHitChanceBarbarian4Definition, fasterAttacksBarbarian1Definition, fasterAttacksBarbarian2Definition, fasterAttacksBarbarian3Definition, healthRegenerationBarbarian1Definition, healthRegenerationBarbarian2Definition, healthRegenerationBarbarian3Definition, ignoreDamageBarbarian1Definition, ignoreDamageBarbarian2Definition, ignoreDamageBarbarian3Definition, improvedArmorBarbarian1Definition, improvedArmorBarbarian2Definition, improvedArmorBarbarian3Definition, improvedAttackRatingBarbarian1Definition, improvedAttackRatingBarbarian2Definition, improvedAttackRatingBarbarian3Definition, improvedDamageBarbarian1Definition, improvedDamageBarbarian2Definition, improvedDamageBarbarian3Definition, improvedDefenseRatingBarbarian1Definition, improvedDefenseRatingBarbarian2Definition, improvedDefenseRatingBarbarian3Definition, improvedHealthBarbarian1Definition, improvedHealthBarbarian2Definition, improvedHealthBarbarian3Definition, improvedSledgeHammerBarbarian1Definition, improvedSledgeHammerBarbarian2Definition, improvedSpiritBarbarian1Definition, improvedSpiritBarbarian2Definition, spiritRegenerationBarbarian1Definition, spiritRegenerationBarbarian2Definition } from "./skills/barbarian.js";
import { fasterAttacksMageElectric1Definition, fasterAttacksMageElectric2Definition, healthRegenerationMageElectric1Definition, healthRegenerationMageElectric2Definition, improvedArmorMageElectric1Definition, improvedArmorMageElectric2Definition, improvedArmorMageElectric3Definition, improvedAttackRatingMageElectric1Definition, improvedAttackRatingMageElectric2Definition, improvedAttackRatingMageElectric3Definition, improvedChainLightningMageElectric1Definition, improvedChainLightningMageElectric2Definition, improvedChainLightningMageElectric3Definition, improvedDamageMageElectric1Definition, improvedDamageMageElectric2Definition, improvedDamageMageElectric3Definition, improvedDefenseRatingMageElectric1Definition, improvedDefenseRatingMageElectric2Definition, improvedDefenseRatingMageElectric3Definition, improvedHealthMageElectric1Definition, improvedHealthMageElectric2Definition, improvedLightningRainMageElectric1Definition, improvedLightningRainMageElectric2Definition, improvedSpiderWebMageElectric1Definition, improvedSpiderWebMageElectric2Definition, improvedSpiderWebMageElectric3Definition, improvedSpiritMageElectric1Definition, improvedSpiritMageElectric2Definition, spellCostMageElectric1Definition, spellCostMageElectric2Definition, spiritRegenerationMageElectric1Definition, spiritRegenerationMageElectric2Definition } from "./skills/electromancer.js";
import { additionalAttackPercentNinja1Definition, additionalAttackPercentNinja2Definition, additionalAttackPercentNinja3Definition, additionalAttackPercentNinja4Definition, attacksPerTurnNinja1Definition, attacksPerTurnNinja2Definition, attacksPerTurnNinja3Definition, criticalHitChanceNinja1Definition, criticalHitChanceNinja2Definition, criticalHitChanceNinja3Definition, criticalHitChanceNinja4Definition, criticalHitChanceNinja5Definition, fasterAttacksNinja1Definition, fasterAttacksNinja2Definition, fasterAttacksNinja3Definition, healthRegenerationNinja1Definition, healthRegenerationNinja2Definition, healthRegenerationNinja3Definition, improvedArmorNinja1Definition, improvedArmorNinja2Definition, improvedArmorNinja3Definition, improvedAttackRatingNinja1Definition, improvedAttackRatingNinja2Definition, improvedAttackRatingNinja3Definition, improvedDamageNinja1Definition, improvedDamageNinja2Definition, improvedDamageNinja3Definition, improvedDefenseRatingNinja1Definition, improvedDefenseRatingNinja2Definition, improvedDefenseRatingNinja3Definition, improvedHealthNinja1Definition, improvedHealthNinja2Definition, improvedHealthNinja3Definition, swiftStrikeUpgradeNinja1Definition, swiftStrikeUpgradeNinja2Definition } from "./skills/ninja.js";
import { fasterAttacksNecromancer1Definition, fasterAttacksNecromancer2Definition, greenDeathRicochetCountNecromancer1Definition, greenDeathRicochetCountNecromancer2Definition, greenDeathRicochetCountNecromancer3Definition, healthRegenerationNecromancer1Definition, healthRegenerationNecromancer2Definition, improvedArmorNecromancer1Definition, improvedArmorNecromancer2Definition, improvedArmorNecromancer3Definition, improvedAttackRatingNecromancer1Definition, improvedAttackRatingNecromancer2Definition, improvedAttackRatingNecromancer3Definition, improvedDamageNecromancer1Definition, improvedDamageNecromancer2Definition, improvedDamageNecromancer3Definition, improvedDefenseRatingNecromancer1Definition, improvedDefenseRatingNecromancer2Definition, improvedDefenseRatingNecromancer3Definition, improvedHealthNecromancer1Definition, improvedHealthNecromancer2Definition, improvedHealthNecromancer3Definition, improvedSpiritNecromancer1Definition, improvedSpiritNecromancer2Definition, largerSkeletonArmyNecromancer1Definition, largerSkeletonArmyNecromancer2Definition, largerSkeletonArmyNecromancer3Definition, spellCostNecromancer1Definition, spellCostNecromancer2Definition, spiritRegenerationNecromancer1Definition, spiritRegenerationNecromancer2Definition } from "./skills/necromancer.js";
import { barbarianChanceChickenKingDefinition, fasterAttacksChickenKing1Definition, fasterAttacksChickenKing2Definition, healthRegenerationChickenKing1Definition, healthRegenerationChickenKing2Definition, improvedArmorChickenKing1Definition, improvedArmorChickenKing2Definition, improvedArmorChickenKing3Definition, improvedAttackRatingChickenKing1Definition, improvedAttackRatingChickenKing2Definition, improvedAttackRatingChickenKing3Definition, improvedDamageChickenKing1Definition, improvedDamageChickenKing2Definition, improvedDamageChickenKing3Definition, improvedDefenseRatingChickenKing1Definition, improvedDefenseRatingChickenKing2Definition, improvedDefenseRatingChickenKing3Definition, improvedHealthChickenKing1Definition, improvedHealthChickenKing2Definition, improvedSpiritChickenKing1Definition, improvedSpiritChickenKing2Definition, largerFlockChickenKing1Definition, largerFlockChickenKing2Definition, largerFlockChickenKing3Definition, largerFlockChickenKing4Definition, largerFlockChickenKing5Definition, largerFlockChickenKing6Definition, ninjaChanceChickenKingDefinition, rogueChanceChickenKingDefinition, spellCostChickenKing1Definition, spellCostChickenKing2Definition, spiritRegenerationChickenKing1Definition, spiritRegenerationChickenKing2Definition } from "./skills/chicken-king.js";
export var MELEE_ATTACK_RANGE, RANGED_ATTACK_RANGE, RANGED_MIN_DISTANCE, casterStatMultipliers, guardianStatMultipliers, minionStatMultipliers, fighterClass, priestClass, rangerClass, pyromancerClass, rogueClass, druidClass, barbarianClass, electromancerClass, ninjaClass, necromancerClass, chickenKingClass, classesById, adventurerClasses, monsterClass, scrollCasterClass;
export function initializeContentClasses() {
  MELEE_ATTACK_RANGE = 50;
  RANGED_ATTACK_RANGE = 140;
  RANGED_MIN_DISTANCE = 50;
  casterStatMultipliers = {
    damageMultiplier: 1.15,
    armorMultiplier: 0.9,
    attackRatingMultiplier: 1,
    defenceRatingMultiplier: 0.9,
    maxHealthMultiplier: 0.9,
    maxSpiritMultiplier: 1.15
  };
  guardianStatMultipliers = {
    damageMultiplier: 1,
    armorMultiplier: 1,
    attackRatingMultiplier: 1,
    defenceRatingMultiplier: 1,
    maxHealthMultiplier: 1,
    maxSpiritMultiplier: 1
  };
  minionStatMultipliers = {
    damageMultiplier: 1,
    armorMultiplier: 0.8,
    attackRatingMultiplier: 1,
    defenceRatingMultiplier: 0.8,
    maxHealthMultiplier: 0.5,
    maxSpiritMultiplier: 1.1
  };
  fighterClass = {
    characterClass: 0,
    className: "战士",
    shortName: "战士",
    spriteName: "HumanFighter2.PNG",
    defaultName: "雨果",
    descriptionText: "坦克角色.强力的近战攻击.",
    requiredVictories: 0,
    fe: false,
    slotStatBonusList: [{
      slot: "20",
      statType: 1
    }, {
      slot: "80",
      statType: 2
    }, {
      slot: "40",
      statType: 4
    }, {
      slot: "120",
      statType: 5
    }, {
      slot: "101",
      statType: 3
    }, {
      slot: "185",
      statType: 6
    }],
    statMultipliers: {
      damageMultiplier: 0.95,
      armorMultiplier: 1,
      attackRatingMultiplier: 0.95,
      defenceRatingMultiplier: 1.1,
      maxHealthMultiplier: 1.1,
      maxSpiritMultiplier: 0.9
    },
    kc: fighterSpellDefinitions,
    Qg: function () {
      return [new CharacterSkillUpgrade(improvedArmorFighter1Definition), new CharacterSkillUpgrade(ignoreDamageFighter1Definition), new CharacterSkillUpgrade(improvedArmorFighter2Definition), new CharacterSkillUpgrade(ignoreDamageFighter2Definition), new CharacterSkillUpgrade(criticalHitChanceFighter1Definition), new CharacterSkillUpgrade(improvedArmorFighter3Definition), new CharacterSkillUpgrade(ignoreDamageFighter3Definition), new LearnSpellUpgrade(tauntSpellDefinition), new CharacterSkillUpgrade(ignoreDamageFighter4Definition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedDamageFighter1Definition), new CharacterSkillUpgrade(improvedHealthFighter1Definition), new CharacterSkillUpgrade(improvedDamageFighter2Definition), new CharacterSkillUpgrade(improvedHealthFighter2Definition), new CharacterSkillUpgrade(criticalHitChanceFighter2Definition), new CharacterSkillUpgrade(improvedDamageFighter3Definition), new CharacterSkillUpgrade(improvedHealthFighter3Definition), new CharacterSkillUpgrade(attacksPerTurnFighter3Definition), new CharacterSkillUpgrade(additionalAttackPercentFighter1Definition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedDefenseRatingFighter1Definition), new CharacterSkillUpgrade(healthRegenerationFighter1Definition), new CharacterSkillUpgrade(improvedDefenseRatingFighter2Definition), new CharacterSkillUpgrade(healthRegenerationFighter2Definition), new CharacterSkillUpgrade(criticalHitChanceFighter3Definition), new CharacterSkillUpgrade(improvedDefenseRatingFighter3Definition), new CharacterSkillUpgrade(healthRegenerationFighter3Definition), new CharacterSkillUpgrade(attacksPerTurnFighter1Definition), new CharacterSkillUpgrade(additionalAttackPercentFighter2Definition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(improvedAttackRatingFighter1Definition), new CharacterSkillUpgrade(fasterAttacksFighter1Definition), new CharacterSkillUpgrade(improvedAttackRatingFighter2Definition), new CharacterSkillUpgrade(fasterAttacksFighter2Definition), new CharacterSkillUpgrade(criticalHitChanceFighter4Definition), new CharacterSkillUpgrade(improvedAttackRatingFighter3Definition), new CharacterSkillUpgrade(fasterAttacksFighter3Definition), new CharacterSkillUpgrade(attacksPerTurnFighter2Definition), new CharacterSkillUpgrade(additionalAttackPercentFighter3Definition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new LootGoldBehavior(98), new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  priestClass = {
    characterClass: 6,
    className: "牧师",
    shortName: "牧师",
    spriteName: "HumanPriest4.PNG",
    defaultName: "克罗诺斯",
    descriptionText: "医生兼杀手.利用近战伤害加成法术帮助队伍.",
    requiredVictories: 0,
    fe: false,
    slotStatBonusList: [{
      slot: "22",
      statType: 1
    }, {
      slot: "163",
      statType: 5
    }, {
      slot: "82",
      statType: 2
    }, {
      slot: "41",
      statType: 4
    }, {
      slot: "181",
      statType: 3
    }, {
      slot: "145",
      statType: 6
    }],
    statMultipliers: {
      damageMultiplier: 0.95,
      armorMultiplier: 1,
      attackRatingMultiplier: 0.95,
      defenceRatingMultiplier: 1.05,
      maxHealthMultiplier: 1,
      maxSpiritMultiplier: 1.05
    },
    kc: priestSpellDefinitions,
    Qg: function () {
      return [new LearnSpellUpgrade(healSpellDefinition), new CharacterSkillUpgrade(improvedArmorPriest1Definition), new LearnSpellUpgrade(armorSpellDefinition), new CharacterSkillUpgrade(improvedHealingSpellPriestDefinition), new CharacterSkillUpgrade(improvedArmorPriest2Definition), new CharacterSkillUpgrade(healthRegenerationPriest2Definition), new CharacterSkillUpgrade(improvedArmorPriest3Definition), new CharacterSkillUpgrade(improvedArmorSpellPriestDefinition), new CharacterSkillUpgrade(fasterAttacksPriest1Definition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedHealthPriest1Definition), new CharacterSkillUpgrade(improvedDamagePriest1Definition), new LearnSpellUpgrade(damageSpellDefinition), new CharacterSkillUpgrade(improvedHealthPriest2Definition), new CharacterSkillUpgrade(improvedDamagePriest2Definition), new CharacterSkillUpgrade(ignoreDamagePriest1Definition), new CharacterSkillUpgrade(spiritRegenerationPriest2Definition), new CharacterSkillUpgrade(improvedDamagePriest3Definition), new CharacterSkillUpgrade(improvedDamageSpellPriestDefinition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedSpiritPriest1Definition), new CharacterSkillUpgrade(improvedAttackRatingPriest1Definition), new LearnSpellUpgrade(attackRatingSpellDefinition), new CharacterSkillUpgrade(improvedSpiritPriest2Definition), new CharacterSkillUpgrade(improvedAttackRatingPriest2Definition), new CharacterSkillUpgrade(healthRegenerationPriest1Definition), new CharacterSkillUpgrade(improvedAttackRatingPriest3Definition), new CharacterSkillUpgrade(ignoreDamagePriest2Definition), new CharacterSkillUpgrade(improvedAttackRatingSpellPriestDefinition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(spellCostPriest1Definition), new CharacterSkillUpgrade(improvedDefenseRatingPriest1Definition), new LearnSpellUpgrade(defenseRatingSpellDefinition), new CharacterSkillUpgrade(spellCostPriest2Definition), new CharacterSkillUpgrade(improvedDefenseRatingPriest3Definition), new CharacterSkillUpgrade(spiritRegenerationPriest1Definition), new CharacterSkillUpgrade(improvedDefenseRatingPriest2Definition), new CharacterSkillUpgrade(improvedDefenseRatingSpellPriestDefinition), new LearnSpellUpgrade(reviveSpellDefinition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new ReviveBehavior(MELEE_ATTACK_RANGE, 94), new LifeDrainBehavior(RANGED_ATTACK_RANGE, 90), new PartyBuffBehavior(RANGED_ATTACK_RANGE, 6, 81), new PartyBuffBehavior(RANGED_ATTACK_RANGE, 5, 80), new PartyBuffBehavior(RANGED_ATTACK_RANGE, 7, 79), new PartyBuffBehavior(RANGED_ATTACK_RANGE, 8, 78), new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 60, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  rangerClass = {
    characterClass: 2,
    className: "游侠",
    shortName: "游侠",
    spriteName: "FemaleRanger01.PNG",
    defaultName: "艾丽",
    descriptionText: "美丽又致命.远程攻击.",
    requiredVictories: 0,
    fe: false,
    slotStatBonusList: [{
      slot: "60",
      statType: 1
    }, {
      slot: "23",
      statType: 3
    }, {
      slot: "83",
      statType: 2
    }, {
      slot: "143",
      statType: 5
    }, {
      slot: "3",
      statType: 4
    }],
    statMultipliers: {
      damageMultiplier: 1.15,
      armorMultiplier: 0.9,
      attackRatingMultiplier: 1.15,
      defenceRatingMultiplier: 0.9,
      maxHealthMultiplier: 0.9,
      maxSpiritMultiplier: 0.9
    },
    kc: null,
    Qg: function () {
      return [new CharacterSkillUpgrade(improvedArmorRanger1Definition), new CharacterSkillUpgrade(ricochetCountRanger1Definition), new CharacterSkillUpgrade(improvedArmorRanger2Definition), new CharacterSkillUpgrade(ricochetPercentRanger1Definition), new CharacterSkillUpgrade(criticalHitChanceRanger1Definition), new CharacterSkillUpgrade(healthRegenerationRanger1Definition), new CharacterSkillUpgrade(improvedArmorRanger3Definition), new CharacterSkillUpgrade(fasterAttacksRanger2Definition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedDamageRanger1Definition), new CharacterSkillUpgrade(criticalHitChanceRanger2Definition), new CharacterSkillUpgrade(ricochetCountRanger2Definition), new CharacterSkillUpgrade(improvedDamageRanger2Definition), new CharacterSkillUpgrade(ricochetPercentRanger2Definition), new CharacterSkillUpgrade(improvedHealthRanger1Definition), new CharacterSkillUpgrade(improvedDamageRanger3Definition), new CharacterSkillUpgrade(healthRegenerationRanger3Definition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedDefenseRatingRanger1Definition), new CharacterSkillUpgrade(healthRegenerationRanger2Definition), new CharacterSkillUpgrade(improvedDefenseRatingRanger2Definition), new CharacterSkillUpgrade(ricochetCountRanger3Definition), new CharacterSkillUpgrade(criticalHitChanceRanger3Definition), new CharacterSkillUpgrade(ricochetPercentRanger3Definition), new CharacterSkillUpgrade(improvedDefenseRatingRanger3Definition), new CharacterSkillUpgrade(improvedHealthRanger3Definition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(improvedAttackRatingRanger1Definition), new CharacterSkillUpgrade(improvedHealthRanger2Definition), new CharacterSkillUpgrade(improvedAttackRatingRanger2Definition), new CharacterSkillUpgrade(fasterAttacksRanger1Definition), new CharacterSkillUpgrade(ricochetCountRanger4Definition), new CharacterSkillUpgrade(improvedAttackRatingRanger3Definition), new CharacterSkillUpgrade(ricochetPercentRanger4Definition), new CharacterSkillUpgrade(fasterAttacksRanger3Definition), new CharacterSkillUpgrade(criticalHitChanceRanger4Definition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 90, MELEE_ACTION_TYPE, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  pyromancerClass = {
    characterClass: 4,
    className: "火法师",
    shortName: "火法师",
    spriteName: "FemaleMage01.PNG",
    defaultName: "娜塔莎",
    descriptionText: "法术为基础的远程攻击.火焰魔法.",
    requiredVictories: 0,
    fe: true,
    slotStatBonusList: [{
      slot: "27",
      statType: 1
    }, {
      slot: "86",
      statType: 2
    }, {
      slot: "122",
      statType: 4
    }, {
      slot: "161",
      statType: 5
    }, {
      slot: "141",
      statType: 3
    }, {
      slot: "183",
      statType: 6
    }],
    statMultipliers: casterStatMultipliers,
    kc: fireSpellDefinitions,
    Qg: function () {
      return [new LearnSpellUpgrade(fireBlastSpellDefinition), new CharacterSkillUpgrade(improvedDamageMageFire1Definition), new CharacterSkillUpgrade(healthRegenerationMageFire2Definition), new CharacterSkillUpgrade(improvedDamageMageFire2Definition), new CharacterSkillUpgrade(improvedHealthMageFire2Definition), new CharacterSkillUpgrade(improvedDamageMageFire3Definition), new CharacterSkillUpgrade(improvedSpiritMageFire2Definition), new CharacterSkillUpgrade(fasterAttacksMageFire1Definition), new CharacterSkillUpgrade(spiritRegenerationMageFire2Definition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedAttackRatingMageFire1Definition), new LearnSpellUpgrade(turnMonsterSpellDefinition), new CharacterSkillUpgrade(improvedAttackRatingMageFire2Definition), new CharacterSkillUpgrade(improvedTurnMonsters1Definition), new CharacterSkillUpgrade(improvedAttackRatingMageFire3Definition), new CharacterSkillUpgrade(improvedTurnMonsters2Definition), new CharacterSkillUpgrade(fasterAttacksMageFire2Definition), new CharacterSkillUpgrade(improvedTurnMonsters3Definition), new CharacterSkillUpgrade(spiritRegenerationMageFire1Definition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedArmorMageFire1Definition), new CharacterSkillUpgrade(improvedHealthMageFire1Definition), new LearnSpellUpgrade(fireRainSpellDefinition), new CharacterSkillUpgrade(improvedArmorMageFire2Definition), new CharacterSkillUpgrade(healthRegenerationMageFire1Definition), new CharacterSkillUpgrade(improvedFireRainMageFire1Definition), new CharacterSkillUpgrade(improvedArmorMageFire3Definition), new CharacterSkillUpgrade(spellCostMageFire2Definition), new CharacterSkillUpgrade(improvedFireRainMageFire2Definition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(improvedDefenseRatingMageFire1Definition), new CharacterSkillUpgrade(improvedSpiritMageFire1Definition), new LearnSpellUpgrade(fireBallSpellDefinition), new CharacterSkillUpgrade(improvedDefenseRatingMageFire2Definition), new CharacterSkillUpgrade(improvedFireballMageFire1Definition), new CharacterSkillUpgrade(improvedDefenseRatingMageFire3Definition), new CharacterSkillUpgrade(improvedFireballMageFire2Definition), new CharacterSkillUpgrade(spellCostMageFire1Definition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new AreaDamageBehavior(RANGED_ATTACK_RANGE, 95), new TargetSpellBehavior(RANGED_ATTACK_RANGE, 95), new SummonBehavior(RANGED_ATTACK_RANGE, 85, 4), new ApplyEffectBehavior(RANGED_ATTACK_RANGE, 60, 4), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  rogueClass = {
    characterClass: 7,
    className: "盗贼",
    shortName: "盗贼",
    spriteName: "HumanThief4.PNG",
    defaultName: "凯西",
    descriptionText: "潜行攻击.远程进战两相宜.强大的寻宝能力.",
    requiredVictories: 0,
    fe: false,
    slotStatBonusList: [{
      slot: "24",
      statType: 3
    }, {
      slot: "25",
      statType: 4
    }, {
      slot: "61",
      statType: 1
    }, {
      slot: "84",
      statType: 2
    }, {
      slot: "100",
      statType: 5
    }, {
      slot: "88",
      statType: 6
    }],
    statMultipliers: guardianStatMultipliers,
    kc: rogueSpellDefinitions,
    Qg: function () {
      return [new CharacterSkillUpgrade(improvedArmorRogue1Definition), new CharacterSkillUpgrade(improvedArmorRogue2Definition), new CharacterSkillUpgrade(spiritRegenerationRogue1Definition), new CharacterSkillUpgrade(improvedArmorRogue3Definition), new LearnSpellUpgrade(stealthSpellDefinition), new CharacterSkillUpgrade(spiritRegenerationRogue2Definition), new CharacterSkillUpgrade(attacksPerTurnRogue1Definition2), new CharacterSkillUpgrade(improvedSpiritRogue1Definition), new CharacterSkillUpgrade(additionalAttackPercentRogue2Definition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedDamageRogue1Definition), new CharacterSkillUpgrade(improvedHealthRogue1Definition), new CharacterSkillUpgrade(criticalHitChanceRogue1Definition), new CharacterSkillUpgrade(improvedDamageRogue2Definition), new CharacterSkillUpgrade(improvedHealthRogue2Definition), new CharacterSkillUpgrade(criticalHitChanceRogue2Definition), new CharacterSkillUpgrade(improvedDamageRogue3Definition), new CharacterSkillUpgrade(improvedHealthRogue3Definition), new CharacterSkillUpgrade(criticalHitChanceRogue3Definition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedDefenseRatingRogue1Definition), new CharacterSkillUpgrade(healthRegenerationRogue1Definition), new CharacterSkillUpgrade(improvedDefenseRatingRogue2Definition), new CharacterSkillUpgrade(healthRegenerationRogue2Definition), new CharacterSkillUpgrade(additionalAttackPercentRogue3Definition), new CharacterSkillUpgrade(improvedDefenseRatingRogue3Definition), new CharacterSkillUpgrade(healthRegenerationRogue3Definition), new CharacterSkillUpgrade(additionalAttackPercentRogue4Definition), new LearnSpellUpgrade(instantLootSpellDefinition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(improvedAttackRatingRogue1Definition), new CharacterSkillUpgrade(fasterAttacksRogue1Definition), new CharacterSkillUpgrade(attacksPerTurnRogue1Definition), new CharacterSkillUpgrade(improvedAttackRatingRogue2Definition), new CharacterSkillUpgrade(fasterAttacksRogue2Definition), new CharacterSkillUpgrade(additionalAttackPercentRogue1Definition), new CharacterSkillUpgrade(improvedAttackRatingRogue3Definition), new CharacterSkillUpgrade(fasterAttacksRogue3Definition), new LearnSpellUpgrade(detectTreasureChestSpellDefinition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new LootItemBehavior(98), new GuardRangedBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new OpportunisticAttackBehavior(95), new ChangeFloorBehavior(), new LootPotionBehavior(75), new LootChestBehavior(70), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  druidClass = {
    characterClass: 10,
    className: "德鲁伊",
    shortName: "德鲁伊",
    spriteName: "HumanDruid01.PNG",
    defaultName: "德拉格",
    descriptionText: "强大的召唤师/牧师的结合体.能召唤野狼和一只宠物狗.",
    requiredVictories: 0,
    fe: true,
    slotStatBonusList: [{
      slot: "31",
      statType: 1
    }, {
      slot: "91",
      statType: 2
    }, {
      slot: "202",
      statType: 6
    }, {
      slot: "203",
      statType: 5
    }, {
      slot: "164",
      statType: 3
    }, {
      slot: "7",
      statType: 4
    }],
    statMultipliers: guardianStatMultipliers,
    kc: druidSpellDefinitions,
    Qg: function () {
      return [new LearnSpellUpgrade(summonWolfPackSpellDefinition), new CharacterSkillUpgrade(improvedDamageDruid1Definition), new CharacterSkillUpgrade(largerWolfPackDruid1Definition), new CharacterSkillUpgrade(improvedDamageDruid2Definition), new CharacterSkillUpgrade(fasterAttacksDruid1Definition), new CharacterSkillUpgrade(improvedDamageDruid3Definition), new CharacterSkillUpgrade(largerWolfPackDruid5Definition), new CharacterSkillUpgrade(fasterAttacksDruid2Definition), new LearnSpellUpgrade(minorHealSpellDefinition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedAttackRatingDruid1Definition), new LearnSpellUpgrade(sleepSpellDefinition), new CharacterSkillUpgrade(improvedAttackRatingDruid2Definition), new CharacterSkillUpgrade(improvedSleepDruid1Definition), new CharacterSkillUpgrade(improvedAttackRatingDruid3Definition), new CharacterSkillUpgrade(improvedSleepDruid2Definition), new CharacterSkillUpgrade(spiritRegenerationDruid1Definition), new CharacterSkillUpgrade(spiritRegenerationDruid2Definition), new CharacterSkillUpgrade(improvedSleepDruid3Definition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedArmorDruid1Definition), new CharacterSkillUpgrade(improvedHealthDruid1Definition), new CharacterSkillUpgrade(healthRegenerationDruid1Definition), new CharacterSkillUpgrade(largerWolfPackDruid3Definition), new CharacterSkillUpgrade(improvedArmorDruid2Definition), new CharacterSkillUpgrade(improvedHealthDruid2Definition), new CharacterSkillUpgrade(healthRegenerationDruid2Definition), new CharacterSkillUpgrade(largerWolfPackDruid2Definition), new CharacterSkillUpgrade(improvedArmorDruid3Definition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(improvedDefenseRatingDruid1Definition), new CharacterSkillUpgrade(improvedSpiritDruid1Definition), new CharacterSkillUpgrade(improvedDefenseRatingDruid2Definition), new CharacterSkillUpgrade(spellCostDruid1Definition), new CharacterSkillUpgrade(improvedSpiritDruid2Definition), new CharacterSkillUpgrade(improvedDefenseRatingDruid3Definition), new CharacterSkillUpgrade(largerWolfPackDruid4Definition), new CharacterSkillUpgrade(spellCostDruid2Definition), new LearnSpellUpgrade(summonDogSpellDefinition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new SelfSpellBehavior(90), new AreaSpellBehavior(RANGED_ATTACK_RANGE, 85, 10), new LifeDrainBehavior(RANGED_ATTACK_RANGE, 75), new ApplyEffectBehavior(RANGED_ATTACK_RANGE, 60, 0), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  barbarianClass = {
    characterClass: 1,
    className: "野蛮人",
    shortName: "野蛮人",
    eF: false,
    spriteName: "BarbarianFighter4.PNG",
    defaultName: "拉戈尔",
    descriptionText: "坦克角色.能力:愤怒,猛锤.",
    requiredVictories: 1,
    fe: false,
    slotStatBonusList: [{
      slot: "21",
      statType: 1
    }, {
      slot: "81",
      statType: 2
    }, {
      slot: "102",
      statType: 3
    }, {
      slot: "144",
      statType: 5
    }, {
      slot: "180",
      statType: 4
    }, {
      slot: "4",
      statType: 6
    }],
    statMultipliers: {
      damageMultiplier: 1.05,
      armorMultiplier: 0.95,
      attackRatingMultiplier: 1.05,
      defenceRatingMultiplier: 0.95,
      maxHealthMultiplier: 1,
      maxSpiritMultiplier: 1
    },
    kc: barbarianSpellDefinitions,
    Qg: function () {
      return [new CharacterSkillUpgrade(improvedArmorBarbarian1Definition), new CharacterSkillUpgrade(ignoreDamageBarbarian1Definition), new LearnSpellUpgrade(sledgeHammerSpellDefinition), new CharacterSkillUpgrade(improvedArmorBarbarian2Definition), new CharacterSkillUpgrade(ignoreDamageBarbarian2Definition), new CharacterSkillUpgrade(improvedSledgeHammerBarbarian1Definition), new CharacterSkillUpgrade(improvedArmorBarbarian3Definition), new CharacterSkillUpgrade(ignoreDamageBarbarian3Definition), new CharacterSkillUpgrade(improvedSledgeHammerBarbarian2Definition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedDamageBarbarian1Definition), new CharacterSkillUpgrade(improvedHealthBarbarian1Definition), new CharacterSkillUpgrade(improvedDamageBarbarian2Definition), new CharacterSkillUpgrade(criticalHitChanceBarbarian1Definition), new CharacterSkillUpgrade(improvedHealthBarbarian2Definition), new CharacterSkillUpgrade(improvedDamageBarbarian3Definition), new CharacterSkillUpgrade(improvedHealthBarbarian3Definition), new CharacterSkillUpgrade(criticalHitChanceBarbarian2Definition), new LearnSpellUpgrade(rageSpellDefinition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedDefenseRatingBarbarian1Definition), new CharacterSkillUpgrade(healthRegenerationBarbarian1Definition), new CharacterSkillUpgrade(improvedDefenseRatingBarbarian2Definition), new CharacterSkillUpgrade(improvedSpiritBarbarian1Definition), new CharacterSkillUpgrade(healthRegenerationBarbarian2Definition), new CharacterSkillUpgrade(improvedDefenseRatingBarbarian3Definition), new CharacterSkillUpgrade(healthRegenerationBarbarian3Definition), new CharacterSkillUpgrade(improvedSpiritBarbarian2Definition), new CharacterSkillUpgrade(criticalHitChanceBarbarian3Definition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(improvedAttackRatingBarbarian1Definition), new CharacterSkillUpgrade(fasterAttacksBarbarian1Definition), new CharacterSkillUpgrade(spiritRegenerationBarbarian1Definition), new CharacterSkillUpgrade(improvedAttackRatingBarbarian2Definition), new CharacterSkillUpgrade(fasterAttacksBarbarian2Definition), new CharacterSkillUpgrade(improvedAttackRatingBarbarian3Definition), new CharacterSkillUpgrade(spiritRegenerationBarbarian2Definition), new CharacterSkillUpgrade(fasterAttacksBarbarian3Definition), new CharacterSkillUpgrade(criticalHitChanceBarbarian4Definition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new LootScrollBehavior(98), new AreaDamageBehavior(MELEE_ATTACK_RANGE, 100), new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  electromancerClass = {
    characterClass: 3,
    className: "电法师",
    shortName: "电法师",
    spriteName: "HumanMage15.PNG",
    defaultName: "凯恩",
    descriptionText: "法术为基础的远程攻击.电气魔法.",
    requiredVictories: 1,
    fe: true,
    slotStatBonusList: [{
      slot: "26",
      statType: 1
    }, {
      slot: "85",
      statType: 2
    }, {
      slot: "121",
      statType: 4
    }, {
      slot: "160",
      statType: 5
    }, {
      slot: "140",
      statType: 3
    }, {
      slot: "182",
      statType: 6
    }],
    statMultipliers: casterStatMultipliers,
    kc: electricSpellDefinitions,
    Qg: function () {
      return [new LearnSpellUpgrade(shockSpellDefinition), new CharacterSkillUpgrade(improvedDamageMageElectric1Definition), new CharacterSkillUpgrade(healthRegenerationMageElectric2Definition), new CharacterSkillUpgrade(improvedDamageMageElectric2Definition), new CharacterSkillUpgrade(improvedHealthMageElectric2Definition), new CharacterSkillUpgrade(improvedDamageMageElectric3Definition), new CharacterSkillUpgrade(improvedSpiritMageElectric2Definition), new CharacterSkillUpgrade(fasterAttacksMageElectric1Definition), new CharacterSkillUpgrade(spiritRegenerationMageElectric2Definition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedAttackRatingMageElectric1Definition), new LearnSpellUpgrade(spiderWebSpellDefinition), new CharacterSkillUpgrade(improvedAttackRatingMageElectric2Definition), new CharacterSkillUpgrade(improvedSpiderWebMageElectric1Definition), new CharacterSkillUpgrade(improvedAttackRatingMageElectric3Definition), new CharacterSkillUpgrade(improvedSpiderWebMageElectric2Definition), new CharacterSkillUpgrade(fasterAttacksMageElectric2Definition), new CharacterSkillUpgrade(improvedSpiderWebMageElectric3Definition), new CharacterSkillUpgrade(spiritRegenerationMageElectric1Definition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedArmorMageElectric1Definition), new CharacterSkillUpgrade(improvedHealthMageElectric1Definition), new LearnSpellUpgrade(lightningRainSpellDefinition), new CharacterSkillUpgrade(improvedArmorMageElectric2Definition), new CharacterSkillUpgrade(healthRegenerationMageElectric1Definition), new CharacterSkillUpgrade(improvedLightningRainMageElectric1Definition), new CharacterSkillUpgrade(improvedArmorMageElectric3Definition), new CharacterSkillUpgrade(spellCostMageElectric2Definition), new CharacterSkillUpgrade(improvedLightningRainMageElectric2Definition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(improvedDefenseRatingMageElectric1Definition), new CharacterSkillUpgrade(improvedSpiritMageElectric1Definition), new LearnSpellUpgrade(chainedLightningSpellDefinition), new CharacterSkillUpgrade(improvedDefenseRatingMageElectric2Definition), new CharacterSkillUpgrade(improvedChainLightningMageElectric1Definition), new CharacterSkillUpgrade(improvedDefenseRatingMageElectric3Definition), new CharacterSkillUpgrade(improvedChainLightningMageElectric2Definition), new CharacterSkillUpgrade(spellCostMageElectric1Definition), new CharacterSkillUpgrade(improvedChainLightningMageElectric3Definition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new HealBehavior(RANGED_ATTACK_RANGE, 95), new TargetSpellBehavior(RANGED_ATTACK_RANGE, 95), new SummonBehavior(RANGED_ATTACK_RANGE, 85, 4), new ApplyEffectBehavior(RANGED_ATTACK_RANGE, 60, 1), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  ninjaClass = {
    characterClass: 8,
    className: "忍者",
    shortName: "忍者",
    spriteName: "Ninja.PNG",
    defaultName: "明治",
    descriptionText: "喜欢在海滩上散步和杀死怪物.",
    requiredVictories: 2,
    fe: false,
    slotStatBonusList: [{
      slot: "29",
      statType: 3
    }, {
      slot: "62",
      statType: 1
    }, {
      slot: "89",
      statType: 4
    }, {
      slot: "186",
      statType: 2
    }, {
      slot: "5",
      statType: 5
    }, {
      slot: "33",
      statType: 6
    }],
    statMultipliers: {
      damageMultiplier: 1.1,
      armorMultiplier: 0.9,
      attackRatingMultiplier: 1.1,
      defenceRatingMultiplier: 1.1,
      maxHealthMultiplier: 1,
      maxSpiritMultiplier: 1
    },
    kc: ninjaSpellDefinitions,
    Qg: function () {
      return [new CharacterSkillUpgrade(improvedArmorNinja1Definition), new CharacterSkillUpgrade(attacksPerTurnNinja1Definition), new LearnSpellUpgrade(swiftStrikeSpellDefinition), new CharacterSkillUpgrade(improvedArmorNinja2Definition), new CharacterSkillUpgrade(criticalHitChanceNinja4Definition), new CharacterSkillUpgrade(swiftStrikeUpgradeNinja1Definition), new CharacterSkillUpgrade(improvedArmorNinja3Definition), new CharacterSkillUpgrade(criticalHitChanceNinja5Definition), new CharacterSkillUpgrade(swiftStrikeUpgradeNinja2Definition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedDamageNinja1Definition), new CharacterSkillUpgrade(improvedHealthNinja1Definition), new CharacterSkillUpgrade(criticalHitChanceNinja1Definition), new CharacterSkillUpgrade(improvedDamageNinja2Definition), new CharacterSkillUpgrade(improvedHealthNinja2Definition), new CharacterSkillUpgrade(criticalHitChanceNinja2Definition), new CharacterSkillUpgrade(improvedDamageNinja3Definition), new CharacterSkillUpgrade(improvedHealthNinja3Definition), new CharacterSkillUpgrade(criticalHitChanceNinja3Definition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedDefenseRatingNinja1Definition), new CharacterSkillUpgrade(healthRegenerationNinja1Definition), new CharacterSkillUpgrade(attacksPerTurnNinja2Definition), new CharacterSkillUpgrade(improvedDefenseRatingNinja2Definition), new CharacterSkillUpgrade(healthRegenerationNinja2Definition), new CharacterSkillUpgrade(additionalAttackPercentNinja3Definition), new CharacterSkillUpgrade(improvedDefenseRatingNinja3Definition), new CharacterSkillUpgrade(healthRegenerationNinja3Definition), new CharacterSkillUpgrade(additionalAttackPercentNinja4Definition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(improvedAttackRatingNinja1Definition), new CharacterSkillUpgrade(fasterAttacksNinja1Definition), new CharacterSkillUpgrade(attacksPerTurnNinja3Definition), new CharacterSkillUpgrade(improvedAttackRatingNinja2Definition), new CharacterSkillUpgrade(fasterAttacksNinja2Definition), new CharacterSkillUpgrade(additionalAttackPercentNinja1Definition), new CharacterSkillUpgrade(improvedAttackRatingNinja3Definition), new CharacterSkillUpgrade(fasterAttacksNinja3Definition), new CharacterSkillUpgrade(additionalAttackPercentNinja2Definition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new ChainDamageBehavior(RANGED_ATTACK_RANGE, 95), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 90), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 85, MELEE_ACTION_TYPE, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  necromancerClass = {
    characterClass: 9,
    className: "死灵法师",
    shortName: "死灵法师",
    spriteName: "Unique1.PNG",
    defaultName: "无名",
    descriptionText: "召唤者:唤醒骷髅军队.",
    requiredVictories: 2,
    fe: true,
    slotStatBonusList: [{
      slot: "30",
      statType: 1
    }, {
      slot: "90",
      statType: 2
    }, {
      slot: "200",
      statType: 6
    }, {
      slot: "201",
      statType: 5
    }, {
      slot: "6",
      statType: 3
    }, {
      slot: "124",
      statType: 4
    }],
    statMultipliers: casterStatMultipliers,
    kc: necromancerSpellDefinitions,
    Qg: function () {
      return [new LearnSpellUpgrade(hurtSpellDefinition), new CharacterSkillUpgrade(improvedDamageNecromancer1Definition), new CharacterSkillUpgrade(healthRegenerationNecromancer2Definition), new CharacterSkillUpgrade(improvedDamageNecromancer2Definition), new CharacterSkillUpgrade(improvedHealthNecromancer2Definition), new CharacterSkillUpgrade(improvedDamageNecromancer3Definition), new CharacterSkillUpgrade(improvedSpiritNecromancer2Definition), new CharacterSkillUpgrade(fasterAttacksNecromancer1Definition), new CharacterSkillUpgrade(spiritRegenerationNecromancer2Definition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedAttackRatingNecromancer1Definition), new LearnSpellUpgrade(summonSkeletonArmySpellDefinition), new CharacterSkillUpgrade(spiritRegenerationNecromancer1Definition), new CharacterSkillUpgrade(improvedAttackRatingNecromancer2Definition), new CharacterSkillUpgrade(largerSkeletonArmyNecromancer2Definition), new CharacterSkillUpgrade(improvedHealthNecromancer3Definition), new CharacterSkillUpgrade(improvedAttackRatingNecromancer3Definition), new CharacterSkillUpgrade(fasterAttacksNecromancer2Definition), new CharacterSkillUpgrade(largerSkeletonArmyNecromancer3Definition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedArmorNecromancer1Definition), new CharacterSkillUpgrade(improvedHealthNecromancer1Definition), new CharacterSkillUpgrade(improvedArmorNecromancer2Definition), new CharacterSkillUpgrade(largerSkeletonArmyNecromancer1Definition), new CharacterSkillUpgrade(healthRegenerationNecromancer1Definition), new CharacterSkillUpgrade(improvedArmorNecromancer3Definition), new CharacterSkillUpgrade(spellCostNecromancer2Definition), new LearnSpellUpgrade(summonPhantomSkullSpellDefinition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(improvedDefenseRatingNecromancer1Definition), new CharacterSkillUpgrade(improvedSpiritNecromancer1Definition), new LearnSpellUpgrade(greenDeathSpellDefinition), new CharacterSkillUpgrade(improvedDefenseRatingNecromancer2Definition), new CharacterSkillUpgrade(greenDeathRicochetCountNecromancer1Definition), new CharacterSkillUpgrade(spellCostNecromancer1Definition), new CharacterSkillUpgrade(greenDeathRicochetCountNecromancer2Definition), new CharacterSkillUpgrade(improvedDefenseRatingNecromancer3Definition), new CharacterSkillUpgrade(greenDeathRicochetCountNecromancer3Definition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new SelfSpellBehavior(94), new CompanionSpellBehavior(RANGED_ATTACK_RANGE, 90), new SummonBehavior(RANGED_ATTACK_RANGE, 89, 13), new SummonBehavior(RANGED_ATTACK_RANGE, 85, 4), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  chickenKingClass = {
    characterClass: 11,
    className: "鸡王",
    shortName: "鸡王",
    spriteName: "Unique4.PNG",
    defaultName: "家禽领主",
    descriptionText: "纯鸡召唤者.",
    requiredVictories: 3,
    fe: true,
    slotStatBonusList: [{
      slot: "32",
      statType: 1
    }, {
      slot: "92",
      statType: 2
    }, {
      slot: "204",
      statType: 6
    }, {
      slot: "125",
      statType: 5
    }, {
      slot: "165",
      statType: 3
    }, {
      slot: "205",
      statType: 4
    }],
    statMultipliers: casterStatMultipliers,
    kc: chickenSpellDefinitions,
    Qg: function () {
      return [new LearnSpellUpgrade(summonChickensSpellDefinition), new CharacterSkillUpgrade(improvedArmorChickenKing1Definition), new CharacterSkillUpgrade(healthRegenerationChickenKing2Definition), new CharacterSkillUpgrade(improvedHealthChickenKing2Definition), new CharacterSkillUpgrade(improvedArmorChickenKing2Definition), new CharacterSkillUpgrade(largerFlockChickenKing1Definition), new CharacterSkillUpgrade(improvedSpiritChickenKing2Definition), new CharacterSkillUpgrade(improvedArmorChickenKing3Definition), new CharacterSkillUpgrade(rogueChanceChickenKingDefinition)];
    },
    Rg: function () {
      return [new CharacterSkillUpgrade(improvedDamageChickenKing1Definition), new CharacterSkillUpgrade(spiritRegenerationChickenKing1Definition), new CharacterSkillUpgrade(improvedDamageChickenKing2Definition), new CharacterSkillUpgrade(fasterAttacksChickenKing1Definition), new CharacterSkillUpgrade(improvedDamageChickenKing3Definition), new CharacterSkillUpgrade(largerFlockChickenKing3Definition), new CharacterSkillUpgrade(spiritRegenerationChickenKing2Definition), new LearnSpellUpgrade(summonGuardChickenSpellDefinition)];
    },
    Sg: function () {
      return [new CharacterSkillUpgrade(improvedAttackRatingChickenKing1Definition), new CharacterSkillUpgrade(improvedHealthChickenKing1Definition), new CharacterSkillUpgrade(largerFlockChickenKing4Definition), new CharacterSkillUpgrade(improvedAttackRatingChickenKing2Definition), new CharacterSkillUpgrade(healthRegenerationChickenKing1Definition), new CharacterSkillUpgrade(largerFlockChickenKing5Definition), new CharacterSkillUpgrade(improvedAttackRatingChickenKing3Definition), new CharacterSkillUpgrade(spellCostChickenKing2Definition), new CharacterSkillUpgrade(ninjaChanceChickenKingDefinition)];
    },
    Tg: function () {
      return [new CharacterSkillUpgrade(improvedDefenseRatingChickenKing1Definition), new CharacterSkillUpgrade(improvedSpiritChickenKing1Definition), new CharacterSkillUpgrade(largerFlockChickenKing6Definition), new CharacterSkillUpgrade(improvedDefenseRatingChickenKing2Definition), new CharacterSkillUpgrade(spellCostChickenKing1Definition), new CharacterSkillUpgrade(largerFlockChickenKing2Definition), new CharacterSkillUpgrade(improvedDefenseRatingChickenKing3Definition), new CharacterSkillUpgrade(fasterAttacksChickenKing2Definition), new CharacterSkillUpgrade(barbarianChanceChickenKingDefinition)];
    },
    createBehaviors: function () {
      return [new FollowLeaderBehavior(), new StunnedBehavior(99), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new SelfSpellBehavior(90), new AreaSpellBehavior(RANGED_ATTACK_RANGE, 85, 17), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  classesById = {};
  classesById[0] = fighterClass;
  classesById[6] = priestClass;
  classesById[2] = rangerClass;
  classesById[7] = rogueClass;
  classesById[8] = ninjaClass;
  classesById[1] = barbarianClass;
  classesById[3] = electromancerClass;
  classesById[4] = pyromancerClass;
  classesById[9] = necromancerClass;
  classesById[10] = druidClass;
  classesById[11] = chickenKingClass;
  adventurerClasses = [fighterClass, priestClass, rangerClass, pyromancerClass, rogueClass, druidClass, barbarianClass, electromancerClass, ninjaClass, necromancerClass, chickenKingClass];
  monsterClass = {
    characterClass: 12,
    className: "Monster",
    bF: 50,
    cF: 160,
    kc: null,
    tb: null,
    statMultipliers: null
  };
  scrollCasterClass = {
    characterClass: 0,
    className: "Scroll Character",
    spriteName: "",
    defaultName: "Scroll Character",
    descriptionText: "Scroll Character Description",
    requiredVictories: 0,
    fe: false,
    slotStatBonusList: [{
      slot: "230",
      statType: 1
    }, {
      slot: "231",
      statType: 2
    }, {
      slot: "232",
      statType: 3
    }, {
      slot: "233",
      statType: 4
    }, {
      slot: "234",
      statType: 5
    }, {
      slot: "235",
      statType: 6
    }],
    statMultipliers: {
      damageMultiplier: 1.2,
      armorMultiplier: 1,
      attackRatingMultiplier: 500,
      defenceRatingMultiplier: 1,
      maxHealthMultiplier: 1,
      maxSpiritMultiplier: 1
    }
  };
}
