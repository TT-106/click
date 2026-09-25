// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 冒险点数事件、奖励和升级定义。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
export var POINT_EVENT_ENCOUNTER, POINT_EVENT_LEVEL_CLEARED, POINT_EVENT_DUNGEON_CLEARED, killPointEvent, spellPointEvent, encounterPointEvent, levelClearedPointEvent, dungeonClearedPointEvent, castleConqueredPointEvent, chestPointEvent, bookcasePointEvent, weaponRackPointEvent, scrollFoundPointEvent, potionFoundPointEvent, itemFoundPointEvent, goldFoundPointEvent, summonPointEvent, uncommonItemPointEvent, rareItemPointEvent, historicItemPointEvent, ancientItemPointEvent, itemSoldPointEvent, itemEquippedPointEvent, levelUpPointEvent, pointEventsById, pointEventDefinitions, pointUpgradeDefinitions;
export function resetAdventurePoints() {
  var a = game.state.ae;
  a.Dd = 0;
  a.An = 0;
  a.Qi = {};
  a.pj = {};
  var b, c;
  for (b = 0; b < pointEventDefinitions.length; b++) {
    c = pointEventDefinitions[b];
    c.Fb = c.Dc;
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
  var b = game.state.ae,
    c = pointEventsById[a];
  if (c) {
    c = c.Fb;
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
  var c = game.state.ae,
    d = pointEventsById[a];
  if (d) {
    d.Fb += b;
    recalculateAdventurePoints(c);
  } else {
    console.log("error: point settings not found: " + a);
  }
}
export function recalculateAdventurePoints(a) {
  var b, c, d, f;
  for (b = a.Dd = 0; b < pointEventDefinitions.length; b++) {
    f = pointEventDefinitions[b].pointEventTypeId;
    c = pointEventDefinitions[b].Fb;
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
    Fb: 1,
    Dc: 1,
    yc: 1,
    Fc: "杀死一个怪物",
    Gc: "杀死怪物"
  };
  spellPointEvent = {
    pointEventTypeId: 2,
    Fb: 1,
    Dc: 1,
    yc: 1,
    Fc: "打开一扇门",
    Gc: "打开门"
  };
  encounterPointEvent = {
    pointEventTypeId: POINT_EVENT_ENCOUNTER,
    Fb: 5,
    Dc: 5,
    yc: 5,
    Fc: "胜一场遭遇战",
    Gc: "遭遇战胜利"
  };
  levelClearedPointEvent = {
    pointEventTypeId: POINT_EVENT_LEVEL_CLEARED,
    Fb: 100,
    Dc: 100,
    yc: 100,
    Fc: "清空一个关卡",
    Gc: "清空关卡"
  };
  dungeonClearedPointEvent = {
    pointEventTypeId: POINT_EVENT_DUNGEON_CLEARED,
    Fb: 300,
    Dc: 300,
    yc: 300,
    Fc: "清理一个地牢",
    Gc: "征服地牢"
  };
  castleConqueredPointEvent = {
    pointEventTypeId: 19,
    Fb: 2E3,
    Dc: 2E3,
    yc: 2E3,
    Fc: "征服一座城堡",
    Gc: "征服城堡"
  };
  chestPointEvent = {
    pointEventTypeId: 6,
    Fb: 50,
    Dc: 50,
    yc: 50,
    Fc: "搜索一个财宝箱",
    Gc: "搜索财宝箱"
  };
  bookcasePointEvent = {
    pointEventTypeId: 7,
    Fb: 50,
    Dc: 50,
    yc: 50,
    Fc: "搜索一个武器架",
    Gc: "搜索武器架"
  };
  weaponRackPointEvent = {
    pointEventTypeId: 8,
    Fb: 50,
    Dc: 50,
    yc: 50,
    Fc: "搜索一个书架",
    Gc: "搜索书架"
  };
  scrollFoundPointEvent = {
    pointEventTypeId: 10,
    Fb: 2,
    Dc: 2,
    yc: 2,
    Fc: "找到一个卷轴",
    Gc: "找到卷轴"
  };
  potionFoundPointEvent = {
    pointEventTypeId: 11,
    Fb: 15,
    Dc: 15,
    yc: 15,
    Fc: "找到一瓶药剂",
    Gc: "找到药剂"
  };
  itemFoundPointEvent = {
    pointEventTypeId: 12,
    Fb: 1,
    Dc: 1,
    yc: 1,
    Fc: "找到一件道具",
    Gc: "找到道具"
  };
  goldFoundPointEvent = {
    pointEventTypeId: 9,
    Fb: 1,
    Dc: 1,
    yc: 1,
    Fc: "找到黄金",
    Gc: "找到黄金"
  };
  summonPointEvent = {
    pointEventTypeId: 18,
    Fb: 15,
    Dc: 15,
    yc: 15,
    Fc: "召唤一个宠物",
    Gc: "召唤宠物"
  };
  uncommonItemPointEvent = {
    pointEventTypeId: 13,
    Fb: 5,
    Dc: 5,
    yc: 5,
    Fc: "找到一件罕见道具",
    Gc: "找到罕见道具"
  };
  rareItemPointEvent = {
    pointEventTypeId: 14,
    Fb: 25,
    Dc: 25,
    yc: 25,
    Fc: "找到一件稀有道具",
    Gc: "找到稀有道具"
  };
  historicItemPointEvent = {
    pointEventTypeId: 15,
    Fb: 200,
    Dc: 200,
    yc: 200,
    Fc: "找到一件历史道具",
    Gc: "找到历史道具"
  };
  ancientItemPointEvent = {
    pointEventTypeId: 16,
    Fb: 2E3,
    Dc: 2E3,
    yc: 2E3,
    Fc: "找到一件远古道具",
    Gc: "找到远古道具"
  };
  itemSoldPointEvent = {
    pointEventTypeId: 17,
    Fb: 1,
    Dc: 1,
    yc: 1,
    Fc: "卖出一件道具",
    Gc: "卖出道具"
  };
  itemEquippedPointEvent = {
    pointEventTypeId: 21,
    Fb: 10,
    Dc: 10,
    yc: 10,
    Fc: "装备一件道具",
    Gc: "装备道具"
  };
  levelUpPointEvent = {
    pointEventTypeId: 22,
    Fb: 400,
    Dc: 400,
    yc: 400,
    Fc: "角色升一级",
    Gc: "升级"
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
    Yb: "moreScrollsInStack",
    title: "更多卷轴",
    mc: "最大卷轴+10",
    Gb: 5E5,
    Tb: 1
  }, {
    Yb: "cheaperFarms",
    title: "便宜农场",
    mc: "10%农场折扣",
    Gb: 1E6,
    Tb: 5
  }, {
    Yb: "extraPotionSlot1",
    title: "额外药剂槽",
    mc: "多一瓶药剂",
    Gb: 25E5,
    Tb: 3
  }, {
    Yb: "extraPotionSlot2",
    title: "额外药剂槽",
    mc: "多一瓶药剂",
    Gb: 25E5,
    Tb: 3
  }, {
    Yb: "walkingSpeedBoost1",
    title: "行走速度提升",
    mc: "行走速度提高10%",
    Gb: 4E6,
    Tb: 2
  }, {
    Yb: "walkingSpeedBoost2",
    title: "行走速度提升",
    mc: "行走速度提高10%",
    Gb: 4E6,
    Tb: 2
  }, {
    Yb: "offlineTimeBonus1",
    title: "离线时间加成功",
    mc: "+2小时",
    Gb: 5E6,
    Tb: 9
  }, {
    Yb: "offlineTimeBonus2",
    title: "离线时间加成功",
    mc: "+2小时",
    Gb: 5E6,
    Tb: 9
  }, {
    Yb: "cheaperMonsterLevels",
    title: "便宜怪物等级",
    mc: "10%等级折扣",
    Gb: 6E6,
    Tb: 6
  }, {
    Yb: "cheaperMonsterLevels2",
    title: "便宜怪物等级",
    mc: "10%等级折扣",
    Gb: 6E6,
    Tb: 6
  }, {
    Yb: "itemSales1",
    title: "道具卖价提高",
    mc: "商店回收价提高10%",
    Gb: 8E6,
    Tb: 10
  }, {
    Yb: "itemSales2",
    title: "道具卖价提高",
    mc: "商店回收价提高10%",
    Gb: 8E6,
    Tb: 10
  }, {
    Yb: "moreFarmKills1",
    title: "每次收获更多杀戮",
    mc: "收获杀戮+20",
    Gb: 7E6,
    Tb: 8
  }, {
    Yb: "moreFarmKills2",
    title: "每次收获更多杀戮",
    mc: "收获杀戮+20",
    Gb: 7E6,
    Tb: 8
  }, {
    Yb: "potionTurnDuration1",
    title: "药剂持续",
    mc: "持续时间延长15%",
    Gb: 8E6,
    Tb: 7
  }, {
    Yb: "potionTurnDuration",
    title: "药剂持续",
    mc: "持续时间延长15%",
    Gb: 8E6,
    Tb: 7
  }, {
    Yb: "extraCharacterSlot",
    title: "第5个角色栏",
    mc: "更多杀戮",
    Gb: 1E7,
    Tb: 4
  }, {
    Yb: "coolDownTurn1",
    title: "永久快速攻击",
    mc: "攻击冷却回合-1",
    Gb: 11E6,
    Tb: 11
  }, {
    Yb: "coolDownTurn2",
    title: "永久快速攻击",
    mc: "攻击冷却回合-1",
    Gb: 11E6,
    Tb: 11
  }, {
    Yb: "healthRegeneration1",
    title: "快速治愈",
    mc: "队伍回复+1%",
    Gb: 12E6,
    Tb: 12
  }, {
    Yb: "healthRegeneration2",
    title: "快速治愈",
    mc: "队伍回复+1%",
    Gb: 12E6,
    Tb: 12
  }, {
    Yb: "spiritRegeneration1",
    title: "法力回复",
    mc: "队伍回复+1%",
    Gb: 13E6,
    Tb: 13
  }, {
    Yb: "spiritRegeneration2",
    title: "法力回复",
    mc: "队伍回复+1%",
    Gb: 13E6,
    Tb: 13
  }];
}
