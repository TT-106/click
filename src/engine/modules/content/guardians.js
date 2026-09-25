/** 城堡守卫和首领外观定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { MELEE_ATTACK_RANGE, RANGED_ATTACK_RANGE, RANGED_MIN_DISTANCE, casterStatMultipliers, guardianStatMultipliers } from "./classes.js";
import { ChainDamageBehavior, HealBehavior, IdleBehavior, MeleeAttackBehavior, RangedAttackBehavior, SummonBehavior } from "../ai/behaviors.js";
import { electricSpellDefinitions, ninjaSpellDefinitions, poisonCloudSpell } from "./spells.js";
import { MELEE_ACTION_TYPE } from "../ai/targeting.js";
export var castleGuardianDefinitions, bossSpriteDefinitions, bossClass;
export function initializeContentGuardians() {
  castleGuardianDefinitions = [{
    characterClass: 0,
    className: "Guardian Fighter",
    Ws: false,
    spriteName: "HumanFighter33.PNG",
    defaultName: "Zog",
    descriptionText: "",
    fe: false,
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
    nb: function () {
      return [new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new IdleBehavior(1)];
    },
    Jm: [],
    Nr: []
  }, {
    characterClass: 3,
    className: "Guardian Mage",
    Ws: false,
    spriteName: "HumanMage11.PNG",
    defaultName: "Zar",
    descriptionText: "",
    fe: false,
    tb: [{
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
    kc: null,
    nb: function () {
      return [new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new HealBehavior(RANGED_ATTACK_RANGE, 90), new SummonBehavior(RANGED_ATTACK_RANGE, 85, 4), new IdleBehavior(1)];
    },
    Jm: [electricSpellDefinitions.br, poisonCloudSpell],
    Nr: [{
      statBonusValue: 1,
      statType: 21
    }]
  }, {
    characterClass: 2,
    className: "Elven Archer",
    Ws: false,
    spriteName: "HB_Elvenarcher1.PNG",
    defaultName: "Seth",
    descriptionText: "",
    fe: false,
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
    YE: null,
    nb: function () {
      return [new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 90, MELEE_ACTION_TYPE, false), new IdleBehavior(1)];
    },
    Jm: [],
    Nr: [{
      statBonusValue: 1,
      statType: 23
    }, {
      statBonusValue: 40,
      statType: 24
    }]
  }, {
    characterClass: 8,
    className: "Ninja Warrior",
    Ws: false,
    spriteName: "Ninja.PNG",
    defaultName: "N",
    descriptionText: "",
    fe: false,
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
    statMultipliers: {
      Xf: 1.1,
      Qf: 0.8,
      Rf: 1.1,
      Zf: 1.1,
      Cf: 0.8,
      Ef: 1.1
    },
    kc: null,
    nb: function () {
      return [new ChainDamageBehavior(RANGED_ATTACK_RANGE, 95), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 90), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 85, MELEE_ACTION_TYPE, false), new IdleBehavior(1)];
    },
    Jm: [ninjaSpellDefinitions.Hx],
    Nr: [{
      statBonusValue: 15,
      statType: 17
    }, {
      statBonusValue: 2,
      statType: 18
    }, {
      statBonusValue: 25,
      statType: 19
    }, {
      statBonusValue: 2,
      statType: 10
    }, {
      statBonusValue: 1,
      statType: 28
    }]
  }];
  bossSpriteDefinitions = [{
    spriteName: "CubeGelatinous.PNG",
    Ia: "Gelatinous Cube"
  }, {
    spriteName: "FrogGiantGreen.PNG",
    Ia: "Green Frog"
  }, {
    spriteName: "OgreBlack.PNG",
    Ia: "Black Ogre"
  }, {
    spriteName: "OrcRedKing.PNG",
    Ia: "Orc King"
  }, {
    spriteName: "XornBlades.PNG",
    Ia: "Xorn"
  }, {
    spriteName: "GolemBrownStick.PNG",
    Ia: "Brown Golem"
  }, {
    spriteName: "GolemDragonRed.PNG",
    Ia: "Red Dragon Golem"
  }, {
    spriteName: "GolemElectric.PNG",
    Ia: "Golem"
  }, {
    spriteName: "GiantTwoHeaded.PNG",
    Ia: ""
  }, {
    spriteName: "GiantCloud.PNG",
    Ia: ""
  }, {
    spriteName: "GiantFire.PNG",
    Ia: ""
  }, {
    spriteName: "GiantFrost.PNG",
    Ia: ""
  }, {
    spriteName: "DrakeGiantWhite.PNG",
    Ia: ""
  }, {
    spriteName: "DrakeGiantRed2.PNG",
    Ia: ""
  }, {
    spriteName: "DrakeGiantGrey.PNG",
    Ia: ""
  }, {
    spriteName: "DrakeGiantBronze.PNG",
    Ia: ""
  }, {
    spriteName: "DragonGiantBoneRed.PNG",
    Ia: ""
  }, {
    spriteName: "DragonGiantBoneGrey.PNG",
    Ia: ""
  }, {
    spriteName: "DragonAncientLordBlack.PNG",
    Ia: ""
  }, {
    spriteName: "DragonAncientLordGreen.PNG",
    Ia: ""
  }, {
    spriteName: "DragonAncientLordRed.PNG",
    Ia: ""
  }, {
    spriteName: "Pheonix.PNG",
    Ia: ""
  }, {
    spriteName: "Race14Grey.PNG",
    Ia: ""
  }, {
    spriteName: "SkeletonKing.PNG",
    Ia: ""
  }, {
    spriteName: "SpiritFire.PNG",
    Ia: ""
  }, {
    spriteName: "SpriteFire.PNG",
    Ia: ""
  }, {
    spriteName: "TrollWater.PNG",
    Ia: ""
  }, {
    spriteName: "TrollKing.PNG",
    Ia: ""
  }, {
    spriteName: "TrollZombie.PNG",
    Ia: ""
  }, {
    spriteName: "Unique7.PNG",
    Ia: ""
  }, {
    spriteName: "WarElephantBrown.PNG",
    Ia: ""
  }, {
    spriteName: "WarElephantGrey.PNG",
    Ia: ""
  }, {
    spriteName: "Xorn4Armed.PNG",
    Ia: ""
  }, {
    spriteName: "AngelRed.PNG",
    Ia: ""
  }, {
    spriteName: "ElementalStone.PNG",
    Ia: ""
  }, {
    spriteName: "GolemBrownCaped.PNG",
    Ia: ""
  }, {
    spriteName: "GryphonRed.PNG",
    Ia: ""
  }, {
    spriteName: "Hydra10HeadRed.PNG",
    Ia: ""
  }];
  bossClass = {
    characterClass: 0,
    className: "Boss",
    Ws: false,
    defaultName: "Boss",
    descriptionText: "",
    fe: false,
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
    statMultipliers: {
      Xf: 1.7,
      Qf: 1.1,
      Rf: 1.6,
      Zf: 1,
      Cf: 10,
      Ef: 1.5
    },
    kc: null,
    nb: function () {
      return [new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new IdleBehavior(1)];
    },
    eu: [],
    WC: [{
      statBonusValue: 30,
      statType: 17
    }, {
      statBonusValue: 2,
      statType: 18
    }, {
      statBonusValue: 40,
      statType: 19
    }, {
      statBonusValue: 3,
      statType: 10
    }]
  };
}
