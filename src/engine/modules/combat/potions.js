/** 药水定义、库存与临时修正。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { BASE_POTION_CAPACITY, autoScrollsModifier, bossEncounterModifier, docileMonstersModifier, doubleExperienceModifier, doubleGoldDropsModifier, doubleGoldModifier, doubleItemDropsModifier, doubleKillsModifier, extraMonstersModifier, farmKillsModifier, fasterFarmingModifier, fasterInfestationModifier, frailMonstersModifier, freeSpellsModifier, guaranteedItemDropsModifier, infiniteScrollsModifier, itemGoldModifier, potionCapacityBonus, potionDurationModifier, treasureRoomModifier, walkingSpeedModifier } from "../content/balance.js";
export var potionDefinitions;
export function Potion(a) {
  this.potionId = a.potionId;
  this.potionSprite = game.itemSprites.getSprite(a.potionSprite);
  this.displayName = a.displayName;
  this.effectLabel = a.effectLabel;
  this.modifierId = a.modifierId;
  this.active = false;
  this.activationTurn = 0;
  this.mg = getPotionModifier(this.modifierId);
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
  this.potion = a;
  this.Qp = b;
  this.Rp = c;
  this.oE = d;
  this.collected = false;
  this.claimedBy = null;
  this.claimDistance = 0;
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
  this.potionList = [];
}
export function resetPotionInventory() {
  var a = game.potions;
  if (0 < a.potionList.length) {
    var b;
    for (b = 0; b < a.potionList.length; b++) {
      setPotionActive(a.potionList[b], false);
    }
    a.potionList.length = 0;
  }
}
export function addPotion(a) {
  var b = game.potions;
  if (a && b.potionList.length < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue) {
    b.potionList.push(a);
  }
}
export function initializeCombatPotions() {
  potionDefinitions = [{
    potionId: "doubleGoldDropValue",
    displayName: "双倍黄金",
    effectLabel: "黄金掉落x2",
    potionSprite: "PotionLargeRose.PNG",
    modifierId: 2
  }, {
    potionId: "doubleKills",
    displayName: "双倍杀戮",
    effectLabel: "杀戮翻倍",
    potionSprite: "PotionLargeViolet.PNG",
    modifierId: 1
  }, {
    potionId: "doubleExperience",
    displayName: "双倍经验",
    effectLabel: "经验翻倍",
    potionSprite: "PotionPurple.PNG",
    modifierId: 3
  }, {
    potionId: "speedWalker",
    displayName: "快速行走",
    effectLabel: "+25%速度",
    potionSprite: "PotionShortRuby.PNG",
    modifierId: 4
  }, {
    potionId: "fasterFarming",
    displayName: "快速收获",
    effectLabel: "提高收获速度",
    potionSprite: "PotionTallGreen.PNG",
    modifierId: 5
  }, {
    potionId: "fasterInfestation",
    displayName: "快速侵扰",
    effectLabel: "快速开始收获",
    potionSprite: "PotionSquareBlue.PNG",
    modifierId: 6
  }, {
    potionId: "infiniteScrolls",
    displayName: "无限卷轴",
    effectLabel: "开火",
    potionSprite: "PotionShortSilver.PNG",
    modifierId: 7
  }, {
    potionId: "moreMonsters",
    displayName: "更多怪物",
    effectLabel: "每个房间内怪物+10",
    potionSprite: "PotionRoundedTopaz.PNG",
    modifierId: 8
  }, {
    potionId: "guaranteedItemDrops",
    displayName: "100%道具掉落",
    effectLabel: "所有怪物掉落道具",
    potionSprite: "PotionShortPink.PNG",
    modifierId: 9
  }, {
    potionId: "potionDuration",
    displayName: "药剂持续更久",
    effectLabel: "梅塔药剂",
    potionSprite: "PotionRed.PNG",
    modifierId: 10
  }, {
    potionId: "freeSpellCasting",
    displayName: "法术无消耗",
    effectLabel: "法术不消耗法力",
    potionSprite: "PotionTriangularYellow.PNG",
    modifierId: 11
  }, {
    potionId: "moreKillsPerFarm",
    displayName: "每次收获更多杀戮",
    effectLabel: "收获杀戮翻倍",
    potionSprite: "PotionEmerald.PNG",
    modifierId: 12
  }, {
    potionId: "docileMonsters",
    displayName: "驯养怪物",
    effectLabel: "怪物无害",
    potionSprite: "PotionShortTan.PNG",
    modifierId: 13
  }, {
    potionId: "higherItemValues",
    displayName: "道具价值",
    effectLabel: "新道具+20%黄金",
    potionSprite: "PotionTallYellow2.PNG",
    modifierId: 14
  }, {
    potionId: "frailMonsters",
    displayName: "脆弱怪物",
    effectLabel: "怪物容易死亡",
    potionSprite: "PotionShortOrange.PNG",
    modifierId: 15
  }, {
    potionId: "autoFiringScrolls",
    displayName: "卷轴自动开火",
    effectLabel: "卷轴无需消耗自动使用",
    potionSprite: "PotionLargeGreen.PNG",
    modifierId: 16
  }, {
    potionId: "doubleGoldDrops",
    displayName: "双倍黄金掉落",
    effectLabel: "每个怪物掉落双倍黄金",
    potionSprite: "PotionTriangularRuby.PNG",
    modifierId: 17
  }, {
    potionId: "doubleItemDrops",
    displayName: "双倍道具掉落",
    effectLabel: "每个怪物掉落双倍道具",
    potionSprite: "PotionLargeTan.PNG",
    modifierId: 18
  }, {
    potionId: "randomTreasureRoom",
    displayName: "随机财宝室",
    effectLabel: "25%几率/房间",
    potionSprite: "PotionShortTan2.PNG",
    modifierId: 19
  }, {
    potionId: "randomBossEncounter",
    displayName: "随机首领战",
    effectLabel: "20%几率/房间",
    potionSprite: "PotionTallBrown.PNG",
    modifierId: 20
  }];
  Potion.prototype.aw = function () {
    if (!(this.active || !this.active && isPotionModifierActive(this))) {
      this.active = true;
      this.activationTurn = game.state.turnNumber;
      if (this.mg) {
        this.mg.currentValue = this.mg.activeValue;
      }
      game.state.statisticsRecorder.recordPotionUsed();
    }
  };
  PotionDrop.prototype.oh = function (a) {
    this.collected = a;
  };
  PotionDrop.prototype.Re = function (a) {
    this.claimedBy = a;
  };
  PotionDrop.prototype.getClaimDistance = function () {
    return this.claimDistance;
  };
  PotionDrop.prototype.setClaimDistance = function (a) {
    this.claimDistance = a;
  };
  PotionDropRegistry.prototype.zl = function () {
    var a;
    for (a = 0; a < this.Hf.length; a++) {
      this.Hf[a].Re(null);
      this.Hf[a].setClaimDistance(0);
    }
  };
  PotionInventory.prototype.bw = function (a) {
    if (a) {
      var b = this.potionList.indexOf(a);
      if (-1 < b) {
        this.potionList.splice(b, 1);
      }
      if (a.active) {
        setPotionActive(a, false);
      }
    }
  };
}
