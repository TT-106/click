/** 冒险点数事件、奖励和升级定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
export var POINT_EVENT_ENCOUNTER, POINT_EVENT_LEVEL_CLEARED, POINT_EVENT_DUNGEON_CLEARED, killPointEvent, spellPointEvent, encounterPointEvent, levelClearedPointEvent, dungeonClearedPointEvent, castleConqueredPointEvent, chestPointEvent, bookcasePointEvent, weaponRackPointEvent, scrollFoundPointEvent, potionFoundPointEvent, itemFoundPointEvent, goldFoundPointEvent, summonPointEvent, uncommonItemPointEvent, rareItemPointEvent, historicItemPointEvent, ancientItemPointEvent, itemSoldPointEvent, itemEquippedPointEvent, levelUpPointEvent, pointEventsById, pointEventDefinitions, pointUpgradeDefinitions;
export function resetAdventurePoints() {
  var a = game.state.adventurePoints;
  a.Dd = 0;
  a.An = 0;
  a.Qi = {};
  a.pj = {};
  var b, c;
  for (b = 0; b < pointEventDefinitions.length; b++) {
    c = pointEventDefinitions[b];
    c.currentPointReward = c.basePointReward;
    if (a.Qi[c.pointEventTypeId]) {
      console.log("error - duplicate point event type: " + c.pointEventTypeId);
    }
    a.Qi[c.pointEventTypeId] = 0;
    a.pj[c.pointEventTypeId] = 0;
  }
  for (b = 0; b < a.tl.length; b++) {
    a.tl[b].og();
  }
}
export function awardAdventurePoints(a) {
  var b = game.state.adventurePoints,
    c = pointEventsById[a];
  if (c) {
    c = c.currentPointReward;
    b.Dd += c;
    var d = b.Qi[a];
    if (!d) {
      d = 0;
    }
    var f = b.pj[a];
    if (!f) {
      f = 0;
    }
    f++;
    b.Qi[a] = d + c;
    b.pj[a] = f;
  } else {
    console.log("error: point settings not found: " + a);
  }
}
export function increasePointEventReward(a, b) {
  var c = game.state.adventurePoints,
    d = pointEventsById[a];
  if (d) {
    d.currentPointReward += b;
    recalculateAdventurePoints(c);
  } else {
    console.log("error: point settings not found: " + a);
  }
}
export function recalculateAdventurePoints(a) {
  var b, c, d, f;
  for (b = a.Dd = 0; b < pointEventDefinitions.length; b++) {
    f = pointEventDefinitions[b].pointEventTypeId;
    c = pointEventDefinitions[b].currentPointReward;
    if (!(d = a.pj[f])) {
      d = 0;
    }
    c *= d;
    a.Qi[f] = c;
    a.Dd += c;
  }
  a.Dd -= a.An;
  if (0 > a.Dd) {
    a.Dd = 0;
  }
}
export function initializeProgressionPoints() {
  POINT_EVENT_ENCOUNTER = 3;
  POINT_EVENT_LEVEL_CLEARED = 4;
  POINT_EVENT_DUNGEON_CLEARED = 5;
  killPointEvent = {
    pointEventTypeId: 1,
    currentPointReward: 1,
    basePointReward: 1,
    achievementPointBonus: 1,
    fullEventLabel: "杀死一个怪物",
    shortEventLabel: "杀死怪物"
  };
  spellPointEvent = {
    pointEventTypeId: 2,
    currentPointReward: 1,
    basePointReward: 1,
    achievementPointBonus: 1,
    fullEventLabel: "打开一扇门",
    shortEventLabel: "打开门"
  };
  encounterPointEvent = {
    pointEventTypeId: POINT_EVENT_ENCOUNTER,
    currentPointReward: 5,
    basePointReward: 5,
    achievementPointBonus: 5,
    fullEventLabel: "胜一场遭遇战",
    shortEventLabel: "遭遇战胜利"
  };
  levelClearedPointEvent = {
    pointEventTypeId: POINT_EVENT_LEVEL_CLEARED,
    currentPointReward: 100,
    basePointReward: 100,
    achievementPointBonus: 100,
    fullEventLabel: "清空一个关卡",
    shortEventLabel: "清空关卡"
  };
  dungeonClearedPointEvent = {
    pointEventTypeId: POINT_EVENT_DUNGEON_CLEARED,
    currentPointReward: 300,
    basePointReward: 300,
    achievementPointBonus: 300,
    fullEventLabel: "清理一个地牢",
    shortEventLabel: "征服地牢"
  };
  castleConqueredPointEvent = {
    pointEventTypeId: 19,
    currentPointReward: 2E3,
    basePointReward: 2E3,
    achievementPointBonus: 2E3,
    fullEventLabel: "征服一座城堡",
    shortEventLabel: "征服城堡"
  };
  chestPointEvent = {
    pointEventTypeId: 6,
    currentPointReward: 50,
    basePointReward: 50,
    achievementPointBonus: 50,
    fullEventLabel: "搜索一个财宝箱",
    shortEventLabel: "搜索财宝箱"
  };
  bookcasePointEvent = {
    pointEventTypeId: 7,
    currentPointReward: 50,
    basePointReward: 50,
    achievementPointBonus: 50,
    fullEventLabel: "搜索一个武器架",
    shortEventLabel: "搜索武器架"
  };
  weaponRackPointEvent = {
    pointEventTypeId: 8,
    currentPointReward: 50,
    basePointReward: 50,
    achievementPointBonus: 50,
    fullEventLabel: "搜索一个书架",
    shortEventLabel: "搜索书架"
  };
  scrollFoundPointEvent = {
    pointEventTypeId: 10,
    currentPointReward: 2,
    basePointReward: 2,
    achievementPointBonus: 2,
    fullEventLabel: "找到一个卷轴",
    shortEventLabel: "找到卷轴"
  };
  potionFoundPointEvent = {
    pointEventTypeId: 11,
    currentPointReward: 15,
    basePointReward: 15,
    achievementPointBonus: 15,
    fullEventLabel: "找到一瓶药剂",
    shortEventLabel: "找到药剂"
  };
  itemFoundPointEvent = {
    pointEventTypeId: 12,
    currentPointReward: 1,
    basePointReward: 1,
    achievementPointBonus: 1,
    fullEventLabel: "找到一件道具",
    shortEventLabel: "找到道具"
  };
  goldFoundPointEvent = {
    pointEventTypeId: 9,
    currentPointReward: 1,
    basePointReward: 1,
    achievementPointBonus: 1,
    fullEventLabel: "找到黄金",
    shortEventLabel: "找到黄金"
  };
  summonPointEvent = {
    pointEventTypeId: 18,
    currentPointReward: 15,
    basePointReward: 15,
    achievementPointBonus: 15,
    fullEventLabel: "召唤一个宠物",
    shortEventLabel: "召唤宠物"
  };
  uncommonItemPointEvent = {
    pointEventTypeId: 13,
    currentPointReward: 5,
    basePointReward: 5,
    achievementPointBonus: 5,
    fullEventLabel: "找到一件罕见道具",
    shortEventLabel: "找到罕见道具"
  };
  rareItemPointEvent = {
    pointEventTypeId: 14,
    currentPointReward: 25,
    basePointReward: 25,
    achievementPointBonus: 25,
    fullEventLabel: "找到一件稀有道具",
    shortEventLabel: "找到稀有道具"
  };
  historicItemPointEvent = {
    pointEventTypeId: 15,
    currentPointReward: 200,
    basePointReward: 200,
    achievementPointBonus: 200,
    fullEventLabel: "找到一件历史道具",
    shortEventLabel: "找到历史道具"
  };
  ancientItemPointEvent = {
    pointEventTypeId: 16,
    currentPointReward: 2E3,
    basePointReward: 2E3,
    achievementPointBonus: 2E3,
    fullEventLabel: "找到一件远古道具",
    shortEventLabel: "找到远古道具"
  };
  itemSoldPointEvent = {
    pointEventTypeId: 17,
    currentPointReward: 1,
    basePointReward: 1,
    achievementPointBonus: 1,
    fullEventLabel: "卖出一件道具",
    shortEventLabel: "卖出道具"
  };
  itemEquippedPointEvent = {
    pointEventTypeId: 21,
    currentPointReward: 10,
    basePointReward: 10,
    achievementPointBonus: 10,
    fullEventLabel: "装备一件道具",
    shortEventLabel: "装备道具"
  };
  levelUpPointEvent = {
    pointEventTypeId: 22,
    currentPointReward: 400,
    basePointReward: 400,
    achievementPointBonus: 400,
    fullEventLabel: "角色升一级",
    shortEventLabel: "升级"
  };
  pointEventsById = {};
  pointEventsById[1] = killPointEvent;
  pointEventsById[2] = spellPointEvent;
  pointEventsById[POINT_EVENT_ENCOUNTER] = encounterPointEvent;
  pointEventsById[POINT_EVENT_LEVEL_CLEARED] = levelClearedPointEvent;
  pointEventsById[POINT_EVENT_DUNGEON_CLEARED] = dungeonClearedPointEvent;
  pointEventsById[19] = castleConqueredPointEvent;
  pointEventsById[6] = chestPointEvent;
  pointEventsById[7] = bookcasePointEvent;
  pointEventsById[8] = weaponRackPointEvent;
  pointEventsById[10] = scrollFoundPointEvent;
  pointEventsById[11] = potionFoundPointEvent;
  pointEventsById[12] = itemFoundPointEvent;
  pointEventsById[9] = goldFoundPointEvent;
  pointEventsById[18] = summonPointEvent;
  pointEventsById[13] = uncommonItemPointEvent;
  pointEventsById[14] = rareItemPointEvent;
  pointEventsById[15] = historicItemPointEvent;
  pointEventsById[16] = ancientItemPointEvent;
  pointEventsById[17] = itemSoldPointEvent;
  pointEventsById[21] = itemEquippedPointEvent;
  pointEventsById[22] = levelUpPointEvent;
  pointEventDefinitions = [killPointEvent, spellPointEvent, encounterPointEvent, levelClearedPointEvent, dungeonClearedPointEvent, castleConqueredPointEvent, chestPointEvent, bookcasePointEvent, weaponRackPointEvent, scrollFoundPointEvent, potionFoundPointEvent, itemFoundPointEvent, goldFoundPointEvent, summonPointEvent, uncommonItemPointEvent, rareItemPointEvent, historicItemPointEvent, ancientItemPointEvent, itemSoldPointEvent, itemEquippedPointEvent, levelUpPointEvent];
  pointUpgradeDefinitions = [{
    upgradeId: "moreScrollsInStack",
    title: "更多卷轴",
    descriptionText: "最大卷轴+10",
    pointCost: 5E5,
    bonusIndex: 1
  }, {
    upgradeId: "cheaperFarms",
    title: "便宜农场",
    descriptionText: "10%农场折扣",
    pointCost: 1E6,
    bonusIndex: 5
  }, {
    upgradeId: "extraPotionSlot1",
    title: "额外药剂槽",
    descriptionText: "多一瓶药剂",
    pointCost: 25E5,
    bonusIndex: 3
  }, {
    upgradeId: "extraPotionSlot2",
    title: "额外药剂槽",
    descriptionText: "多一瓶药剂",
    pointCost: 25E5,
    bonusIndex: 3
  }, {
    upgradeId: "walkingSpeedBoost1",
    title: "行走速度提升",
    descriptionText: "行走速度提高10%",
    pointCost: 4E6,
    bonusIndex: 2
  }, {
    upgradeId: "walkingSpeedBoost2",
    title: "行走速度提升",
    descriptionText: "行走速度提高10%",
    pointCost: 4E6,
    bonusIndex: 2
  }, {
    upgradeId: "offlineTimeBonus1",
    title: "离线时间加成功",
    descriptionText: "+2小时",
    pointCost: 5E6,
    bonusIndex: 9
  }, {
    upgradeId: "offlineTimeBonus2",
    title: "离线时间加成功",
    descriptionText: "+2小时",
    pointCost: 5E6,
    bonusIndex: 9
  }, {
    upgradeId: "cheaperMonsterLevels",
    title: "便宜怪物等级",
    descriptionText: "10%等级折扣",
    pointCost: 6E6,
    bonusIndex: 6
  }, {
    upgradeId: "cheaperMonsterLevels2",
    title: "便宜怪物等级",
    descriptionText: "10%等级折扣",
    pointCost: 6E6,
    bonusIndex: 6
  }, {
    upgradeId: "itemSales1",
    title: "道具卖价提高",
    descriptionText: "商店回收价提高10%",
    pointCost: 8E6,
    bonusIndex: 10
  }, {
    upgradeId: "itemSales2",
    title: "道具卖价提高",
    descriptionText: "商店回收价提高10%",
    pointCost: 8E6,
    bonusIndex: 10
  }, {
    upgradeId: "moreFarmKills1",
    title: "每次收获更多杀戮",
    descriptionText: "收获杀戮+20",
    pointCost: 7E6,
    bonusIndex: 8
  }, {
    upgradeId: "moreFarmKills2",
    title: "每次收获更多杀戮",
    descriptionText: "收获杀戮+20",
    pointCost: 7E6,
    bonusIndex: 8
  }, {
    upgradeId: "potionTurnDuration1",
    title: "药剂持续",
    descriptionText: "持续时间延长15%",
    pointCost: 8E6,
    bonusIndex: 7
  }, {
    upgradeId: "potionTurnDuration",
    title: "药剂持续",
    descriptionText: "持续时间延长15%",
    pointCost: 8E6,
    bonusIndex: 7
  }, {
    upgradeId: "extraCharacterSlot",
    title: "第5个角色栏",
    descriptionText: "更多杀戮",
    pointCost: 1E7,
    bonusIndex: 4
  }, {
    upgradeId: "coolDownTurn1",
    title: "永久快速攻击",
    descriptionText: "攻击冷却回合-1",
    pointCost: 11E6,
    bonusIndex: 11
  }, {
    upgradeId: "coolDownTurn2",
    title: "永久快速攻击",
    descriptionText: "攻击冷却回合-1",
    pointCost: 11E6,
    bonusIndex: 11
  }, {
    upgradeId: "healthRegeneration1",
    title: "快速治愈",
    descriptionText: "队伍回复+1%",
    pointCost: 12E6,
    bonusIndex: 12
  }, {
    upgradeId: "healthRegeneration2",
    title: "快速治愈",
    descriptionText: "队伍回复+1%",
    pointCost: 12E6,
    bonusIndex: 12
  }, {
    upgradeId: "spiritRegeneration1",
    title: "法力回复",
    descriptionText: "队伍回复+1%",
    pointCost: 13E6,
    bonusIndex: 13
  }, {
    upgradeId: "spiritRegeneration2",
    title: "法力回复",
    descriptionText: "队伍回复+1%",
    pointCost: 13E6,
    bonusIndex: 13
  }];
}
