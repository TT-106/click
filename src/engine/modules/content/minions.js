/** 召唤物与召唤法术映射。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { MELEE_ATTACK_RANGE, RANGED_ATTACK_RANGE, RANGED_MIN_DISTANCE, casterStatMultipliers, guardianStatMultipliers, minionStatMultipliers } from "./classes.js";
import { AreaDamageBehavior, ChainDamageBehavior, ChangeFloorBehavior, CooldownBehavior, EnterCastleBehavior, EnterDungeonBehavior, GuardRangedBehavior, HealBehavior, LootItemBehavior, MeleeAttackBehavior, OpportunisticAttackBehavior, PartyBuffBehavior, RangedAttackBehavior, SpecialAttackBehavior, SummonBehavior, TravelWorldBehavior, UseShopBehavior, WaitBehavior } from "../ai/behaviors.js";
import { barbarianSpellDefinitions, chickenSpellDefinitions, druidSpellDefinitions, electricSpellDefinitions, necromancerSpellDefinitions, ninjaSpellDefinitions, poisonCloudSpell, priestSpellDefinitions, rogueSpellDefinitions } from "./spells.js";
import { MELEE_ACTION_TYPE } from "../ai/targeting.js";
export var wolfMinion, skeletonMinion, chickenMinion, barbarianChickenMinion, ninjaChickenMinion, rogueChickenMinion, deathChickenMinion, phantomSkullMinion, minionsBySpell;
export function initializeContentMinions() {
  wolfMinion = {
    characterClass: 0,
    oi: false,
    className: "Wolf",
    spriteName: "Wolf.PNG",
    defaultName: "Howler",
    descriptionText: "A cool wolf that fights for a time.",
    Oi: -1,
    tb: [{
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
    statMultipliers: minionStatMultipliers,
    kc: null,
    createBehaviors: function () {
      return [new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  skeletonMinion = {
    characterClass: 0,
    oi: false,
    className: "Skeleton",
    spriteName: "SkeletonFighter3.PNG",
    defaultName: "Bones",
    descriptionText: "A Skeletal Warrior.",
    Oi: -1,
    tb: [{
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
    statMultipliers: minionStatMultipliers,
    kc: null,
    createBehaviors: function () {
      return [new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  chickenMinion = {
    characterClass: 0,
    oi: false,
    className: "Chicken",
    spriteName: "Chicken1.PNG",
    defaultName: "Chicken",
    descriptionText: "A chicken.",
    Oi: -1,
    tb: [{
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
    statMultipliers: minionStatMultipliers,
    kc: null,
    createBehaviors: function () {
      return [new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  barbarianChickenMinion = {
    characterClass: 1,
    oi: false,
    className: "Chicken",
    spriteName: "Chicken1.PNG",
    defaultName: "Chicken",
    descriptionText: "A chicken.",
    Oi: -1,
    tb: [{
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
    statMultipliers: minionStatMultipliers,
    jl: [barbarianSpellDefinitions.wB],
    Bp: [],
    createBehaviors: function () {
      return [new AreaDamageBehavior(MELEE_ATTACK_RANGE, 100), new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  ninjaChickenMinion = {
    characterClass: 8,
    oi: false,
    className: "Chicken",
    spriteName: "Chicken1.PNG",
    defaultName: "Chicken",
    descriptionText: "A chicken.",
    Oi: -1,
    tb: [{
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
    statMultipliers: minionStatMultipliers,
    jl: [ninjaSpellDefinitions.Hx],
    Bp: [{
      statBonusValue: 1,
      statType: 28
    }],
    createBehaviors: function () {
      return [new ChainDamageBehavior(RANGED_ATTACK_RANGE, 95), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 90), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 85, MELEE_ACTION_TYPE, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  rogueChickenMinion = {
    characterClass: 7,
    oi: false,
    className: "Chicken",
    spriteName: "Chicken1.PNG",
    defaultName: "Chicken",
    descriptionText: "A chicken.",
    Oi: -1,
    tb: [{
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
    statMultipliers: minionStatMultipliers,
    jl: [rogueSpellDefinitions.IB],
    Bp: [],
    createBehaviors: function () {
      return [new LootItemBehavior(100), new GuardRangedBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new OpportunisticAttackBehavior(95), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  deathChickenMinion = {
    characterClass: 2,
    oi: true,
    className: "Death Chicken",
    spriteName: "Chicken2.PNG",
    defaultName: "Death Chicken",
    descriptionText: "A death chicken.",
    Oi: -1,
    tb: [{
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
    statMultipliers: guardianStatMultipliers,
    kc: null,
    Bp: [{
      statBonusValue: 2,
      statType: 23
    }, {
      statBonusValue: 40,
      statType: 24
    }],
    createBehaviors: function () {
      return [new CooldownBehavior(160, 100), new SpecialAttackBehavior(RANGED_ATTACK_RANGE, 160, 95, MELEE_ACTION_TYPE), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 65, MELEE_ACTION_TYPE, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  phantomSkullMinion = {
    characterClass: 3,
    oi: true,
    className: "Phantom Skull",
    spriteName: "PhantomSkull.PNG",
    defaultName: "Kryptax",
    descriptionText: "Floating Skull of Death.",
    Oi: -1,
    tb: [{
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
    statMultipliers: casterStatMultipliers,
    kc: null,
    jl: [electricSpellDefinitions.br, poisonCloudSpell],
    Bp: [{
      statBonusValue: 3,
      statType: 21
    }],
    createBehaviors: function () {
      return [new CooldownBehavior(160, 100), new HealBehavior(RANGED_ATTACK_RANGE, 95), new SummonBehavior(RANGED_ATTACK_RANGE, 85, 4), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  minionsBySpell = {};
  minionsBySpell[druidSpellDefinitions.LB.name] = {
    characterClass: 6,
    oi: true,
    className: "Dog",
    spriteName: "DogWhite.PNG",
    defaultName: "Scruffy",
    descriptionText: "His bite is bigger than his bark.",
    Oi: -1,
    tb: [{
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
    statMultipliers: guardianStatMultipliers,
    kc: null,
    jl: [priestSpellDefinitions.$z, priestSpellDefinitions.Zz],
    createBehaviors: function () {
      return [new CooldownBehavior(160, 100), new SpecialAttackBehavior(MELEE_ATTACK_RANGE, 160, 90, 2), new PartyBuffBehavior(RANGED_ATTACK_RANGE, 8, 35), new PartyBuffBehavior(RANGED_ATTACK_RANGE, 5, 30), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  minionsBySpell[druidSpellDefinitions.PB.name] = wolfMinion;
  minionsBySpell[necromancerSpellDefinitions.OB.name] = skeletonMinion;
  minionsBySpell[necromancerSpellDefinitions.NB.name] = phantomSkullMinion;
  minionsBySpell[chickenSpellDefinitions.KB.name] = chickenMinion;
  minionsBySpell[chickenSpellDefinitions.MB.name] = deathChickenMinion;
}
