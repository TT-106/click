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
    unusedClassFlag: false,
    spriteName: "HumanFighter33.PNG",
    defaultName: "Zog",
    descriptionText: "",
    startsWithSpell: false,
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
    statMultipliers: guardianStatMultipliers,
    spellDefinitions: null,
    createBehaviors: function () {
      return [new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new IdleBehavior(1)];
    },
    innateSpells: [],
    statBonusList: []
  }, {
    characterClass: 3,
    className: "Guardian Mage",
    unusedClassFlag: false,
    spriteName: "HumanMage11.PNG",
    defaultName: "Zar",
    descriptionText: "",
    startsWithSpell: false,
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
    spellDefinitions: null,
    createBehaviors: function () {
      return [new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new HealBehavior(RANGED_ATTACK_RANGE, 90), new SummonBehavior(RANGED_ATTACK_RANGE, 85, 4), new IdleBehavior(1)];
    },
    innateSpells: [electricSpellDefinitions.chainLightningSpell, poisonCloudSpell],
    statBonusList: [{
      statBonusValue: 1,
      statType: 21
    }]
  }, {
    characterClass: 2,
    className: "Elven Archer",
    unusedClassFlag: false,
    spriteName: "HB_Elvenarcher1.PNG",
    defaultName: "Seth",
    descriptionText: "",
    startsWithSpell: false,
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
    statMultipliers: guardianStatMultipliers,
    spellDefinitions: null,
    YE: null,
    createBehaviors: function () {
      return [new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 95), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 90, MELEE_ACTION_TYPE, false), new IdleBehavior(1)];
    },
    innateSpells: [],
    statBonusList: [{
      statBonusValue: 1,
      statType: 23
    }, {
      statBonusValue: 40,
      statType: 24
    }]
  }, {
    characterClass: 8,
    className: "Ninja Warrior",
    unusedClassFlag: false,
    spriteName: "Ninja.PNG",
    defaultName: "N",
    descriptionText: "",
    startsWithSpell: false,
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
      armorMultiplier: 0.8,
      attackRatingMultiplier: 1.1,
      defenceRatingMultiplier: 1.1,
      maxHealthMultiplier: 0.8,
      maxSpiritMultiplier: 1.1
    },
    spellDefinitions: null,
    createBehaviors: function () {
      return [new ChainDamageBehavior(RANGED_ATTACK_RANGE, 95), new RangedAttackBehavior(RANGED_MIN_DISTANCE, RANGED_ATTACK_RANGE, 90), new MeleeAttackBehavior(RANGED_ATTACK_RANGE, 85, MELEE_ACTION_TYPE, false), new IdleBehavior(1)];
    },
    innateSpells: [ninjaSpellDefinitions.quickStrikeSpell],
    statBonusList: [{
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
    bossName: "Gelatinous Cube"
  }, {
    spriteName: "FrogGiantGreen.PNG",
    bossName: "Green Frog"
  }, {
    spriteName: "OgreBlack.PNG",
    bossName: "Black Ogre"
  }, {
    spriteName: "OrcRedKing.PNG",
    bossName: "Orc King"
  }, {
    spriteName: "XornBlades.PNG",
    bossName: "Xorn"
  }, {
    spriteName: "GolemBrownStick.PNG",
    bossName: "Brown Golem"
  }, {
    spriteName: "GolemDragonRed.PNG",
    bossName: "Red Dragon Golem"
  }, {
    spriteName: "GolemElectric.PNG",
    bossName: "Golem"
  }, {
    spriteName: "GiantTwoHeaded.PNG",
    bossName: ""
  }, {
    spriteName: "GiantCloud.PNG",
    bossName: ""
  }, {
    spriteName: "GiantFire.PNG",
    bossName: ""
  }, {
    spriteName: "GiantFrost.PNG",
    bossName: ""
  }, {
    spriteName: "DrakeGiantWhite.PNG",
    bossName: ""
  }, {
    spriteName: "DrakeGiantRed2.PNG",
    bossName: ""
  }, {
    spriteName: "DrakeGiantGrey.PNG",
    bossName: ""
  }, {
    spriteName: "DrakeGiantBronze.PNG",
    bossName: ""
  }, {
    spriteName: "DragonGiantBoneRed.PNG",
    bossName: ""
  }, {
    spriteName: "DragonGiantBoneGrey.PNG",
    bossName: ""
  }, {
    spriteName: "DragonAncientLordBlack.PNG",
    bossName: ""
  }, {
    spriteName: "DragonAncientLordGreen.PNG",
    bossName: ""
  }, {
    spriteName: "DragonAncientLordRed.PNG",
    bossName: ""
  }, {
    spriteName: "Pheonix.PNG",
    bossName: ""
  }, {
    spriteName: "Race14Grey.PNG",
    bossName: ""
  }, {
    spriteName: "SkeletonKing.PNG",
    bossName: ""
  }, {
    spriteName: "SpiritFire.PNG",
    bossName: ""
  }, {
    spriteName: "SpriteFire.PNG",
    bossName: ""
  }, {
    spriteName: "TrollWater.PNG",
    bossName: ""
  }, {
    spriteName: "TrollKing.PNG",
    bossName: ""
  }, {
    spriteName: "TrollZombie.PNG",
    bossName: ""
  }, {
    spriteName: "Unique7.PNG",
    bossName: ""
  }, {
    spriteName: "WarElephantBrown.PNG",
    bossName: ""
  }, {
    spriteName: "WarElephantGrey.PNG",
    bossName: ""
  }, {
    spriteName: "Xorn4Armed.PNG",
    bossName: ""
  }, {
    spriteName: "AngelRed.PNG",
    bossName: ""
  }, {
    spriteName: "ElementalStone.PNG",
    bossName: ""
  }, {
    spriteName: "GolemBrownCaped.PNG",
    bossName: ""
  }, {
    spriteName: "GryphonRed.PNG",
    bossName: ""
  }, {
    spriteName: "Hydra10HeadRed.PNG",
    bossName: ""
  }];
  bossClass = {
    characterClass: 0,
    className: "Boss",
    unusedClassFlag: false,
    defaultName: "Boss",
    descriptionText: "",
    startsWithSpell: false,
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
      damageMultiplier: 1.7,
      armorMultiplier: 1.1,
      attackRatingMultiplier: 1.6,
      defenceRatingMultiplier: 1,
      maxHealthMultiplier: 10,
      maxSpiritMultiplier: 1.5
    },
    spellDefinitions: null,
    createBehaviors: function () {
      return [new MeleeAttackBehavior(MELEE_ATTACK_RANGE, 90, 2, false), new IdleBehavior(1)];
    },
    innateSpells: [],
    statBonusList: [{
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
