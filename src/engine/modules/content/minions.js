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
    d: "Wolf.PNG",
    defaultName: "Howler",
    descriptionText: "A cool wolf that fights for a time.",
    Oi: -1,
    tb: [{
      r: "230",
      s: 1
    }, {
      r: "231",
      s: 2
    }, {
      r: "232",
      s: 3
    }, {
      r: "233",
      s: 4
    }, {
      r: "234",
      s: 5
    }, {
      r: "235",
      s: 6
    }],
    Ma: minionStatMultipliers,
    kc: null,
    nb: function () {
      return [new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  skeletonMinion = {
    characterClass: 0,
    oi: false,
    className: "Skeleton",
    d: "SkeletonFighter3.PNG",
    defaultName: "Bones",
    descriptionText: "A Skeletal Warrior.",
    Oi: -1,
    tb: [{
      r: "230",
      s: 1
    }, {
      r: "231",
      s: 2
    }, {
      r: "232",
      s: 3
    }, {
      r: "233",
      s: 4
    }, {
      r: "234",
      s: 5
    }, {
      r: "235",
      s: 6
    }],
    Ma: minionStatMultipliers,
    kc: null,
    nb: function () {
      return [new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  chickenMinion = {
    characterClass: 0,
    oi: false,
    className: "Chicken",
    d: "Chicken1.PNG",
    defaultName: "Chicken",
    descriptionText: "A chicken.",
    Oi: -1,
    tb: [{
      r: "230",
      s: 1
    }, {
      r: "231",
      s: 2
    }, {
      r: "232",
      s: 3
    }, {
      r: "233",
      s: 4
    }, {
      r: "234",
      s: 5
    }, {
      r: "235",
      s: 6
    }],
    Ma: minionStatMultipliers,
    kc: null,
    nb: function () {
      return [new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  barbarianChickenMinion = {
    characterClass: 1,
    oi: false,
    className: "Chicken",
    d: "Chicken1.PNG",
    defaultName: "Chicken",
    descriptionText: "A chicken.",
    Oi: -1,
    tb: [{
      r: "230",
      s: 1
    }, {
      r: "231",
      s: 2
    }, {
      r: "232",
      s: 3
    }, {
      r: "233",
      s: 4
    }, {
      r: "234",
      s: 5
    }, {
      r: "235",
      s: 6
    }],
    Ma: minionStatMultipliers,
    jl: [barbarianSpellDefinitions.wB],
    Bp: [],
    nb: function () {
      return [new AreaDamageBehavior(MELEE_ATTACK_RANGE, 100), new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  ninjaChickenMinion = {
    characterClass: 8,
    oi: false,
    className: "Chicken",
    d: "Chicken1.PNG",
    defaultName: "Chicken",
    descriptionText: "A chicken.",
    Oi: -1,
    tb: [{
      r: "29",
      s: 3
    }, {
      r: "62",
      s: 1
    }, {
      r: "89",
      s: 4
    }, {
      r: "186",
      s: 2
    }, {
      r: "5",
      s: 5
    }, {
      r: "33",
      s: 6
    }],
    Ma: minionStatMultipliers,
    jl: [ninjaSpellDefinitions.Hx],
    Bp: [{
      g: 1,
      f: 28
    }],
    nb: function () {
      return [new ChainDamageBehavior(RANGED_ATTACK_RANGE, 95), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 90), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 85, MELEE_ACTION_TYPE, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  rogueChickenMinion = {
    characterClass: 7,
    oi: false,
    className: "Chicken",
    d: "Chicken1.PNG",
    defaultName: "Chicken",
    descriptionText: "A chicken.",
    Oi: -1,
    tb: [{
      r: "24",
      s: 3
    }, {
      r: "25",
      s: 4
    }, {
      r: "61",
      s: 1
    }, {
      r: "84",
      s: 2
    }, {
      r: "100",
      s: 5
    }, {
      r: "88",
      s: 6
    }],
    Ma: minionStatMultipliers,
    jl: [rogueSpellDefinitions.IB],
    Bp: [],
    nb: function () {
      return [new LootItemBehavior(100), new GuardRangedBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new OpportunisticAttackBehavior(95), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  deathChickenMinion = {
    characterClass: 2,
    oi: true,
    className: "Death Chicken",
    d: "Chicken2.PNG",
    defaultName: "Death Chicken",
    descriptionText: "A death chicken.",
    Oi: -1,
    tb: [{
      r: "60",
      s: 1
    }, {
      r: "23",
      s: 3
    }, {
      r: "83",
      s: 2
    }, {
      r: "143",
      s: 5
    }, {
      r: "3",
      s: 4
    }],
    Ma: guardianStatMultipliers,
    kc: null,
    Bp: [{
      g: 2,
      f: 23
    }, {
      g: 40,
      f: 24
    }],
    nb: function () {
      return [new CooldownBehavior(160, 100), new SpecialAttackBehavior(RANGED_ATTACK_RANGE, 160, 95, MELEE_ACTION_TYPE), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 65, MELEE_ACTION_TYPE, false), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  phantomSkullMinion = {
    characterClass: 3,
    oi: true,
    className: "Phantom Skull",
    d: "PhantomSkull.PNG",
    defaultName: "Kryptax",
    descriptionText: "Floating Skull of Death.",
    Oi: -1,
    tb: [{
      r: "230",
      s: 1
    }, {
      r: "231",
      s: 2
    }, {
      r: "232",
      s: 3
    }, {
      r: "233",
      s: 4
    }, {
      r: "234",
      s: 5
    }, {
      r: "235",
      s: 6
    }],
    Ma: casterStatMultipliers,
    kc: null,
    jl: [electricSpellDefinitions.br, poisonCloudSpell],
    Bp: [{
      g: 3,
      f: 21
    }],
    nb: function () {
      return [new CooldownBehavior(160, 100), new HealBehavior(RANGED_ATTACK_RANGE, 95), new SummonBehavior(RANGED_ATTACK_RANGE, 85, 4), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  minionsBySpell = {};
  minionsBySpell[druidSpellDefinitions.LB.ta] = {
    characterClass: 6,
    oi: true,
    className: "Dog",
    d: "DogWhite.PNG",
    defaultName: "Scruffy",
    descriptionText: "His bite is bigger than his bark.",
    Oi: -1,
    tb: [{
      r: "230",
      s: 1
    }, {
      r: "231",
      s: 2
    }, {
      r: "232",
      s: 3
    }, {
      r: "233",
      s: 4
    }, {
      r: "234",
      s: 5
    }, {
      r: "235",
      s: 6
    }],
    Ma: guardianStatMultipliers,
    kc: null,
    jl: [priestSpellDefinitions.$z, priestSpellDefinitions.Zz],
    nb: function () {
      return [new CooldownBehavior(160, 100), new SpecialAttackBehavior(MELEE_ATTACK_RANGE, 160, 90, 2), new PartyBuffBehavior(RANGED_ATTACK_RANGE, 8, 35), new PartyBuffBehavior(RANGED_ATTACK_RANGE, 5, 30), new ChangeFloorBehavior(), new TravelWorldBehavior(60, 10), new EnterDungeonBehavior(60, 10), new EnterCastleBehavior(60, 10), new UseShopBehavior(60, 10), new WaitBehavior()];
    }
  };
  minionsBySpell[druidSpellDefinitions.PB.ta] = wolfMinion;
  minionsBySpell[necromancerSpellDefinitions.OB.ta] = skeletonMinion;
  minionsBySpell[necromancerSpellDefinitions.NB.ta] = phantomSkullMinion;
  minionsBySpell[chickenSpellDefinitions.KB.ta] = chickenMinion;
  minionsBySpell[chickenSpellDefinitions.MB.ta] = deathChickenMinion;
}
