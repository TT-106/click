/** 药水定义、库存与临时修正。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { BASE_POTION_CAPACITY, autoScrollsModifier, bossEncounterModifier, docileMonstersModifier, doubleExperienceModifier, doubleGoldDropsModifier, doubleGoldModifier, doubleItemDropsModifier, doubleKillsModifier, extraMonstersModifier, farmKillsModifier, fasterFarmingModifier, fasterInfestationModifier, frailMonstersModifier, freeSpellsModifier, guaranteedItemDropsModifier, infiniteScrollsModifier, itemGoldModifier, potionCapacityBonus, potionDurationModifier, treasureRoomModifier, walkingSpeedModifier } from "../content/balance.js";
export var potionDefinitions;
export function Potion(a) {
  this.potionId = a.potionId;
  this.jc = game.itemSprites.getSprite(a.jc);
  this.uc = a.uc;
  this.tc = a.tc;
  this.vc = a.vc;
  this.active = false;
  this.activationTurn = 0;
  this.mg = getPotionModifier(this.vc);
}
export function setPotionActive(a, b) {
  var c = a.active;
  a.active = b;
  if (a.active && !c) {
    if (a.mg) {
      a.mg.currentValue = a.mg.activeValue;
    }
  } else {
    if (!a.active && c && a.mg) {
      a.mg.currentValue = a.mg.defaultValue;
    }
  }
}
export function getPotionModifier(a) {
  switch (a) {
    case 2:
      return doubleGoldModifier;
    case 1:
      return doubleKillsModifier;
    case 3:
      return doubleExperienceModifier;
    case 4:
      return walkingSpeedModifier;
    case 5:
      return fasterFarmingModifier;
    case 6:
      return fasterInfestationModifier;
    case 7:
      return infiniteScrollsModifier;
    case 8:
      return extraMonstersModifier;
    case 9:
      return guaranteedItemDropsModifier;
    case 10:
      return potionDurationModifier;
    case 11:
      return freeSpellsModifier;
    case 12:
      return farmKillsModifier;
    case 13:
      return docileMonstersModifier;
    case 14:
      return itemGoldModifier;
    case 15:
      return frailMonstersModifier;
    case 16:
      return autoScrollsModifier;
    case 17:
      return doubleGoldDropsModifier;
    case 18:
      return doubleItemDropsModifier;
    case 19:
      return treasureRoomModifier;
    case 20:
      return bossEncounterModifier;
  }
  console.log("potion type error: " + a);
  return null;
}
export function isPotionModifierActive(a) {
  return a.mg && a.mg.currentValue === a.mg.activeValue;
}
export function PotionDrop(a, b, c, d) {
  this.hc = a;
  this.Qp = b;
  this.Rp = c;
  this.oE = d;
  this.gc = false;
  this.Zc = null;
  this.ph = 0;
}
export function PotionDropRegistry() {
  this.Hf = [];
}
export function removePotionDrop(a) {
  var b = game.potionDrops;
  a = b.Hf.indexOf(a);
  if (-1 < a) {
    b.Hf.splice(a, 1);
  }
}
export function PotionInventory() {
  this.re = [];
}
export function resetPotionInventory() {
  var a = game.potions;
  if (0 < a.re.length) {
    var b;
    for (b = 0; b < a.re.length; b++) {
      setPotionActive(a.re[b], false);
    }
    a.re.length = 0;
  }
}
export function addPotion(a) {
  var b = game.potions;
  if (a && b.re.length < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue) {
    b.re.push(a);
  }
}
export function initializeCombatPotions() {
  potionDefinitions = [{
    potionId: "doubleGoldDropValue",
    uc: "双倍黄金",
    tc: "黄金掉落x2",
    jc: "PotionLargeRose.PNG",
    vc: 2
  }, {
    potionId: "doubleKills",
    uc: "双倍杀戮",
    tc: "杀戮翻倍",
    jc: "PotionLargeViolet.PNG",
    vc: 1
  }, {
    potionId: "doubleExperience",
    uc: "双倍经验",
    tc: "经验翻倍",
    jc: "PotionPurple.PNG",
    vc: 3
  }, {
    potionId: "speedWalker",
    uc: "快速行走",
    tc: "+25%速度",
    jc: "PotionShortRuby.PNG",
    vc: 4
  }, {
    potionId: "fasterFarming",
    uc: "快速收获",
    tc: "提高收获速度",
    jc: "PotionTallGreen.PNG",
    vc: 5
  }, {
    potionId: "fasterInfestation",
    uc: "快速侵扰",
    tc: "快速开始收获",
    jc: "PotionSquareBlue.PNG",
    vc: 6
  }, {
    potionId: "infiniteScrolls",
    uc: "无限卷轴",
    tc: "开火",
    jc: "PotionShortSilver.PNG",
    vc: 7
  }, {
    potionId: "moreMonsters",
    uc: "更多怪物",
    tc: "每个房间内怪物+10",
    jc: "PotionRoundedTopaz.PNG",
    vc: 8
  }, {
    potionId: "guaranteedItemDrops",
    uc: "100%道具掉落",
    tc: "所有怪物掉落道具",
    jc: "PotionShortPink.PNG",
    vc: 9
  }, {
    potionId: "potionDuration",
    uc: "药剂持续更久",
    tc: "梅塔药剂",
    jc: "PotionRed.PNG",
    vc: 10
  }, {
    potionId: "freeSpellCasting",
    uc: "法术无消耗",
    tc: "法术不消耗法力",
    jc: "PotionTriangularYellow.PNG",
    vc: 11
  }, {
    potionId: "moreKillsPerFarm",
    uc: "每次收获更多杀戮",
    tc: "收获杀戮翻倍",
    jc: "PotionEmerald.PNG",
    vc: 12
  }, {
    potionId: "docileMonsters",
    uc: "驯养怪物",
    tc: "怪物无害",
    jc: "PotionShortTan.PNG",
    vc: 13
  }, {
    potionId: "higherItemValues",
    uc: "道具价值",
    tc: "新道具+20%黄金",
    jc: "PotionTallYellow2.PNG",
    vc: 14
  }, {
    potionId: "frailMonsters",
    uc: "脆弱怪物",
    tc: "怪物容易死亡",
    jc: "PotionShortOrange.PNG",
    vc: 15
  }, {
    potionId: "autoFiringScrolls",
    uc: "卷轴自动开火",
    tc: "卷轴无需消耗自动使用",
    jc: "PotionLargeGreen.PNG",
    vc: 16
  }, {
    potionId: "doubleGoldDrops",
    uc: "双倍黄金掉落",
    tc: "每个怪物掉落双倍黄金",
    jc: "PotionTriangularRuby.PNG",
    vc: 17
  }, {
    potionId: "doubleItemDrops",
    uc: "双倍道具掉落",
    tc: "每个怪物掉落双倍道具",
    jc: "PotionLargeTan.PNG",
    vc: 18
  }, {
    potionId: "randomTreasureRoom",
    uc: "随机财宝室",
    tc: "25%几率/房间",
    jc: "PotionShortTan2.PNG",
    vc: 19
  }, {
    potionId: "randomBossEncounter",
    uc: "随机首领战",
    tc: "20%几率/房间",
    jc: "PotionTallBrown.PNG",
    vc: 20
  }];
  Potion.prototype.aw = function () {
    if (!(this.active || !this.active && isPotionModifierActive(this))) {
      this.active = true;
      this.activationTurn = game.state.turnNumber;
      if (this.mg) {
        this.mg.currentValue = this.mg.activeValue;
      }
      game.state.aa.cs();
    }
  };
  PotionDrop.prototype.oh = function (a) {
    this.gc = a;
  };
  PotionDrop.prototype.Re = function (a) {
    this.Zc = a;
  };
  PotionDrop.prototype.Ud = function () {
    return this.ph;
  };
  PotionDrop.prototype.Se = function (a) {
    this.ph = a;
  };
  PotionDropRegistry.prototype.zl = function () {
    var a;
    for (a = 0; a < this.Hf.length; a++) {
      this.Hf[a].Re(null);
      this.Hf[a].Se(0);
    }
  };
  PotionInventory.prototype.bw = function (a) {
    if (a) {
      var b = this.re.indexOf(a);
      if (-1 < b) {
        this.re.splice(b, 1);
      }
      if (a.active) {
        setPotionActive(a, false);
      }
    }
  };
}
