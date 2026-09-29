/** 药水定义、库存与临时修正。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { BASE_POTION_CAPACITY, autoScrollsModifier, bossEncounterModifier, docileMonstersModifier, doubleExperienceModifier, doubleGoldDropsModifier, doubleGoldModifier, doubleItemDropsModifier, doubleKillsModifier, extraMonstersModifier, farmKillsModifier, fasterFarmingModifier, fasterInfestationModifier, frailMonstersModifier, freeSpellsModifier, guaranteedItemDropsModifier, infiniteScrollsModifier, itemGoldModifier, potionCapacityBonus, potionDurationModifier, treasureRoomModifier, walkingSpeedModifier } from "../content/balance.js";
export var potionDefinitions;
export function Potion(definition, itemSprites) {
  this.potionId = definition.potionId;
  this.potionSprite = itemSprites.getSprite(definition.potionSprite);
  this.displayName = definition.displayName;
  this.effectLabel = definition.effectLabel;
  this.modifierId = definition.modifierId;
  this.active = false;
  this.activationTurn = 0;
  this.modifier = getPotionModifier(this.modifierId);
}
export function setPotionActive(potion, active) {
  var wasActive = potion.active;
  potion.active = active;
  if (potion.active && !wasActive) {
    if (potion.modifier) {
      potion.modifier.currentValue = potion.modifier.activeValue;
    }
  } else {
    if (!potion.active && wasActive && potion.modifier) {
      potion.modifier.currentValue = potion.modifier.defaultValue;
    }
  }
}
export function getPotionModifier(modifierId) {
  switch (modifierId) {
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
  console.log("potion type error: " + modifierId);
  return null;
}
export function isPotionModifierActive(potion) {
  return potion.modifier && potion.modifier.currentValue === potion.modifier.activeValue;
}
export function PotionDrop(potion, x, y, room) {
  this.potion = potion;
  this.levelPositionX = x;
  this.levelPositionY = y;
  this.room = room;
  this.collected = false;
  this.claimedBy = null;
  this.claimDistance = 0;
}
export function PotionDropRegistry() {
  this.drops = [];
}
export function removePotionDrop(drop, registry) {
  const index = registry.drops.indexOf(drop);
  if (-1 < index) {
    registry.drops.splice(index, 1);
  }
}
export function PotionInventory() {
  this.potionList = [];
}
export function resetPotionInventory(inventory) {
  if (0 < inventory.potionList.length) {
    for (let potionIndex = 0; potionIndex < inventory.potionList.length; potionIndex++) {
      setPotionActive(inventory.potionList[potionIndex], false);
    }
    inventory.potionList.length = 0;
  }
}
export function addPotion(potion, inventory) {
  if (potion && inventory.potionList.length < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue) {
    inventory.potionList.push(potion);
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
  Potion.prototype.activate = function (runtimeState) {
    if (!(this.active || !this.active && isPotionModifierActive(this))) {
      this.active = true;
      this.activationTurn = runtimeState.turnNumber;
      if (this.modifier) {
        this.modifier.currentValue = this.modifier.activeValue;
      }
      runtimeState.statisticsRecorder.recordPotionUsed();
    }
  };
  PotionDrop.prototype.setCollected = function (collected) {
    this.collected = collected;
  };
  PotionDrop.prototype.setClaimedBy = function (character) {
    this.claimedBy = character;
  };
  PotionDrop.prototype.getClaimDistance = function () {
    return this.claimDistance;
  };
  PotionDrop.prototype.setClaimDistance = function (distance) {
    this.claimDistance = distance;
  };
  PotionDropRegistry.prototype.releaseClaims = function () {
    var dropIndex;
    for (dropIndex = 0; dropIndex < this.drops.length; dropIndex++) {
      this.drops[dropIndex].setClaimedBy(null);
      this.drops[dropIndex].setClaimDistance(0);
    }
  };
  PotionInventory.prototype.removePotion = function (potion) {
    if (potion) {
      var potionIndex = this.potionList.indexOf(potion);
      if (-1 < potionIndex) {
        this.potionList.splice(potionIndex, 1);
      }
      if (potion.active) {
        setPotionActive(potion, false);
      }
    }
  };
}
