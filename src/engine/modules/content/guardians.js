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
    d: "HumanFighter33.PNG",
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
    Ma: guardianStatMultipliers,
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
    d: "HumanMage11.PNG",
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
    Ma: casterStatMultipliers,
    kc: null,
    nb: function () {
      return [new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new HealBehavior(RANGED_ATTACK_RANGE, 90), new SummonBehavior(RANGED_ATTACK_RANGE, 85, 4), new IdleBehavior(1)];
    },
    Jm: [electricSpellDefinitions.br, poisonCloudSpell],
    Nr: [{
      g: 1,
      f: 21
    }]
  }, {
    characterClass: 2,
    className: "Elven Archer",
    Ws: false,
    d: "HB_Elvenarcher1.PNG",
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
    Ma: guardianStatMultipliers,
    kc: null,
    YE: null,
    nb: function () {
      return [new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 90, MELEE_ACTION_TYPE, false), new IdleBehavior(1)];
    },
    Jm: [],
    Nr: [{
      g: 1,
      f: 23
    }, {
      g: 40,
      f: 24
    }]
  }, {
    characterClass: 8,
    className: "Ninja Warrior",
    Ws: false,
    d: "Ninja.PNG",
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
    Ma: {
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
      g: 15,
      f: 17
    }, {
      g: 2,
      f: 18
    }, {
      g: 25,
      f: 19
    }, {
      g: 2,
      f: 10
    }, {
      g: 1,
      f: 28
    }]
  }];
  bossSpriteDefinitions = [{
    d: "CubeGelatinous.PNG",
    Ia: "Gelatinous Cube"
  }, {
    d: "FrogGiantGreen.PNG",
    Ia: "Green Frog"
  }, {
    d: "OgreBlack.PNG",
    Ia: "Black Ogre"
  }, {
    d: "OrcRedKing.PNG",
    Ia: "Orc King"
  }, {
    d: "XornBlades.PNG",
    Ia: "Xorn"
  }, {
    d: "GolemBrownStick.PNG",
    Ia: "Brown Golem"
  }, {
    d: "GolemDragonRed.PNG",
    Ia: "Red Dragon Golem"
  }, {
    d: "GolemElectric.PNG",
    Ia: "Golem"
  }, {
    d: "GiantTwoHeaded.PNG",
    Ia: ""
  }, {
    d: "GiantCloud.PNG",
    Ia: ""
  }, {
    d: "GiantFire.PNG",
    Ia: ""
  }, {
    d: "GiantFrost.PNG",
    Ia: ""
  }, {
    d: "DrakeGiantWhite.PNG",
    Ia: ""
  }, {
    d: "DrakeGiantRed2.PNG",
    Ia: ""
  }, {
    d: "DrakeGiantGrey.PNG",
    Ia: ""
  }, {
    d: "DrakeGiantBronze.PNG",
    Ia: ""
  }, {
    d: "DragonGiantBoneRed.PNG",
    Ia: ""
  }, {
    d: "DragonGiantBoneGrey.PNG",
    Ia: ""
  }, {
    d: "DragonAncientLordBlack.PNG",
    Ia: ""
  }, {
    d: "DragonAncientLordGreen.PNG",
    Ia: ""
  }, {
    d: "DragonAncientLordRed.PNG",
    Ia: ""
  }, {
    d: "Pheonix.PNG",
    Ia: ""
  }, {
    d: "Race14Grey.PNG",
    Ia: ""
  }, {
    d: "SkeletonKing.PNG",
    Ia: ""
  }, {
    d: "SpiritFire.PNG",
    Ia: ""
  }, {
    d: "SpriteFire.PNG",
    Ia: ""
  }, {
    d: "TrollWater.PNG",
    Ia: ""
  }, {
    d: "TrollKing.PNG",
    Ia: ""
  }, {
    d: "TrollZombie.PNG",
    Ia: ""
  }, {
    d: "Unique7.PNG",
    Ia: ""
  }, {
    d: "WarElephantBrown.PNG",
    Ia: ""
  }, {
    d: "WarElephantGrey.PNG",
    Ia: ""
  }, {
    d: "Xorn4Armed.PNG",
    Ia: ""
  }, {
    d: "AngelRed.PNG",
    Ia: ""
  }, {
    d: "ElementalStone.PNG",
    Ia: ""
  }, {
    d: "GolemBrownCaped.PNG",
    Ia: ""
  }, {
    d: "GryphonRed.PNG",
    Ia: ""
  }, {
    d: "Hydra10HeadRed.PNG",
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
    Ma: {
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
      g: 30,
      f: 17
    }, {
      g: 2,
      f: 18
    }, {
      g: 40,
      f: 19
    }, {
      g: 3,
      f: 10
    }]
  };
}
