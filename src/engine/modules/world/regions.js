/** 区域布局、地牢命名与城堡解锁。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { hashCoordinates, randomIntFrom } from "../core/math.js";
import { game } from "../runtime/game.js";
import { refreshWorldBlocks } from "./terrain.js";
import { castleTheme, caveTheme, chamberTheme, dungeonTheme, iceDungeonTheme, ironMineTheme, stoneDungeonTheme, templeTheme, towerTheme, woodenMineTheme } from "../content/dungeon-themes.js";
export var WORLD_BLOCK_COLUMNS, WORLD_BLOCK_ROWS, WORLD_ORIGIN_COLUMN, WORLD_ORIGIN_ROW;
export function DungeonNameGenerator(a) {
  this.seededRandom = a;
  this.dungeonAdjectives = "可恶的 遗弃的 讨厌的 诅咒的 有害的 血腥的 痛苦的 诅咒的 毁坏的 矛盾的 爬行的 该死的 破旧的 厌恶的 黑暗的 昏暗的 遗弃的 发狂的 死亡的 深渊的 积灰的 不安的 荒凉的 潮湿的 粗短的 恶心的 不安的 害怕的 犯规的 禁止的 不好的 遗忘的 肮脏的 可怕的 灰暗的 地狱的 可恨的 可怕的 潮湿的 感染的 感染的 地狱的 有害的 诽谤的 可憎的 厌恶的 失去的 发霉的 神秘的 无情的 雾霾的 下流的 不好的 崩坏的 恶心的 调皮的 正常的 恶臭的 讨厌的 可憎的 厌恶的 反对的 有毒的 苍白的 污染的 腐坏的 毁灭的 糟糕的 腐臭的 驱蚊的 敌对的 发散的 恶心的 恶臭的 腐臭的 破碎的 恶心的 笼罩的 悲伤的 秘密的 阴影的 折磨的 折磨的 邪恶的 未知的 无名的 邪恶的 低语的 邪恶的".split(" ");
  this.dungeonNouns = "地洞 地窖 洞穴 窑洞 空洞 兽穴 深洞 迷宫 陵墓 墓穴 迷宫 沼泽 矿坑 通道 矿井 地道 底层 地穴 水坑 隧道".split(" ");
  this.cryptNouns = "地下墓穴 地窖 膛室 窄小通道 停尸房 土窖 坟墓 石窟 地狱 阴间 陵墓 太平间 墓地 藏骨堂 神圣庇护所 埋葬所 坟墓 拱顶".split(" ");
  this.lairNouns = "庇护所;屠宰场;地牢;暗黑;次元;领域;熔炉;地狱;地下密牢;深渊;监狱;屠宰场;刑讯室;拱顶".split(";");
  this.towerNouns = "钟楼 城堡 监视哨 尖塔 巨石 方尖碑 柱子 避难所 矮塔 高塔 炮塔 堡垒".split(" ");
  this.templeNouns = "修道院 皇宫 大教堂 礼拜堂 女修道院 高坛 内阁 大使馆 讲台 万神殿 小修道院 圣物箱 圣堂 密室 圣殿 圣庙 神殿 寺庙".split(" ");
  this.monumentNouns = "石冢 纪念碑 大厦 巨石 古迹 纪念馆 纪念堂 土堆 方尖碑 金字塔 宫殿 悬崖 古迹 神殿 献祭场 坟墓 遗迹".split(" ");
  this.castleNouns = "城堡 堡垒 城塞 城堡 酒庄 房产 堡垒 要塞 防务 边塞 军防 礼堂 防务 舱室 保管室 宅邸 庄园 宫殿 大厦 大本营 别墅".split(" ");
  this.iceAdjectives = "北极的;敏锐的;痛苦的;寒冷的;冷冻的;严寒的;冰冻的;霜冻的;冻结的;寒冬的;冰寒的;冰川的;冰镇的;冰冷的;冻僵的;霜降的;雪白的;刺骨的;麻木的;颤抖的;下雪的".split(";");
}
export function generateDungeonName(a, b) {
  var c;
  a: switch (b) {
    case 3:
      c = a.iceAdjectives[randomIntFrom(a.seededRandom, a.iceAdjectives.length)];
      break a;
    default:
      c = a.dungeonAdjectives[randomIntFrom(a.seededRandom, a.dungeonAdjectives.length)];
  }
  return "" + c + "" + getDungeonNoun(a, b);
}
export function getDungeonNoun(a, b) {
  switch (b) {
    case 0:
    case 2:
    case 3:
    case 1:
      return a.dungeonNouns[randomIntFrom(a.seededRandom, a.dungeonNouns.length)];
    case 4:
    case 5:
      return a.towerNouns[randomIntFrom(a.seededRandom, a.towerNouns.length)];
    case 6:
      return a.lairNouns[randomIntFrom(a.seededRandom, a.lairNouns.length)];
    case 7:
    case 8:
      return a.monumentNouns[randomIntFrom(a.seededRandom, a.monumentNouns.length)];
    case 9:
      return a.cryptNouns[randomIntFrom(a.seededRandom, a.cryptNouns.length)];
    case 10:
      return a.templeNouns[randomIntFrom(a.seededRandom, a.templeNouns.length)];
    case 11:
      return a.castleNouns[randomIntFrom(a.seededRandom, a.castleNouns.length)];
    default:
      return a.lairNouns[randomIntFrom(a.seededRandom, a.lairNouns.length)];
  }
}
export function WorldRegion(a, b, c) {
  this.regionKey = a;
  this.regionColumn = b;
  this.regionRow = c;
  this.castle = null;
}
export function Castle(a, b, c, d, f, g) {
  this.castleId = a;
  this.castleName = b;
  this.regionColumn = c;
  this.regionRow = d;
  this.worldPixelX = f;
  this.worldPixelY = g;
  this.dungeonsConquered = this.conquered = false;
  this.regionLocked = true;
  this.attackScheduled = false;
  this.requiredMonsterLevel = this.conqueredDungeonCount = 0;
  this.regions = [];
  this.dungeonList = [];
}
export function canAttackCastle(a) {
  return !a.regionLocked && !a.conquered && a.dungeonsConquered && !a.attackScheduled;
}
export function refreshCastleConquest(a) {
  if (a.dungeonsConquered || a.conquered) {
    a.conqueredDungeonCount = a.dungeonList.length;
  } else {
    var b;
    for (b = a.conqueredDungeonCount = 0; b < a.dungeonList.length; b++) {
      if (a.dungeonList[b].conquered) {
        a.conqueredDungeonCount++;
      }
    }
    if (a.conqueredDungeonCount === a.dungeonList.length) {
      a.dungeonsConquered = true;
      b = game.castles;
      b.nextRequiredMonsterLevel++;
      a.requiredMonsterLevel = b.nextRequiredMonsterLevel;
      invalidateCastleRevision();
    }
    if (canAttackCastle(a)) {
      refreshAttackableCastles(a);
    }
  }
}
export function RegionLayout() {
  this.BA = game.regions.regionGridOriginColumn;
  this.EA = game.regions.regionGridOriginRow;
  var a = game.regions;
  this.maxRegionColumn = a.regionGridOriginColumn + a.regionGridSpan;
  a = game.regions;
  this.maxRegionRow = a.regionGridOriginRow + a.regionGridSpan;
}
export function getWestRegion(a, b, c, d) {
  return b - 1 >= a.BA && (a = b - 1 + "_" + c, !d[a]) ? game.regions.byKey[a] : null;
}
export function getEastRegion(a, b, c, d) {
  return b + 1 < a.maxRegionColumn && (a = b + 1 + "_" + c, !d[a]) ? game.regions.byKey[a] : null;
}
export function getNorthRegion(a, b, c, d) {
  return c - 1 >= a.EA && (a = b + "_" + (c - 1), !d[a]) ? game.regions.byKey[a] : null;
}
export function getSouthRegion(a, b, c, d) {
  return c + 1 < a.maxRegionRow && (a = b + "_" + (c + 1), !d[a]) ? game.regions.byKey[a] : null;
}
export function chooseAdjacentRegion(a, b, c, d) {
  var f = b.regionColumn;
  b = b.regionRow;
  if (0.5 > d.random()) {
    if (0.5 > d.random()) {
      if ((d = getWestRegion(a, f, b, c)) || (d = getEastRegion(a, f, b, c)) || (d = getSouthRegion(a, f, b, c))) {
        return d;
      }
      d = getNorthRegion(a, f, b, c);
    } else {
      if ((d = getEastRegion(a, f, b, c)) || (d = getWestRegion(a, f, b, c)) || (d = getNorthRegion(a, f, b, c))) {
        return d;
      }
      d = getSouthRegion(a, f, b, c);
    }
  } else if (0.5 > d.random()) {
    if ((d = getNorthRegion(a, f, b, c)) || (d = getSouthRegion(a, f, b, c)) || (d = getEastRegion(a, f, b, c))) {
      return d;
    }
    d = getWestRegion(a, f, b, c);
  } else {
    if ((d = getSouthRegion(a, f, b, c)) || (d = getNorthRegion(a, f, b, c)) || (d = getWestRegion(a, f, b, c))) {
      return d;
    }
    d = getEastRegion(a, f, b, c);
  }
  if (d) {
    return d;
  }
}
export function resetCastles() {
  var a = game.castles;
  a.attackableCastles.length = 0;
  a.scheduledCastles.length = 0;
  a.revision = 0;
  a.nextRequiredMonsterLevel = 1;
  var b;
  for (b = 0; b < a.castleList.length; b++) {
    var c = a.castleList[b];
    c.conquered = false;
    c.regionLocked = true;
    c.attackScheduled = false;
    c.conqueredDungeonCount = 0;
    c.requiredMonsterLevel = 0;
    c.dungeonsConquered = 0 === c.dungeonList.length;
  }
}
export function unlockStartingRegion() {
  /** @type {any} */
  var a = game.world.worldBlocks[1][1];
  a = a.regionColumn + "_" + a.regionRow;
  var b = findCastleByRegion(a);
  if (b) {
    b.regionLocked = false;
    refreshWorldBlocks(game.world);
  } else {
    console.log("failed to find world block owner castle: " + a);
  }
}
export function findCastle(a) {
  return (a = game.castles.castleRegistry[a]) ? a : null;
}
export function findCastleByRegion(a) {
  return (a = game.castles.ju[a]) ? a : null;
}
export function refreshAttackableCastles(a) {
  var b = game.castles;
  b.revision++;
  var c = b.attackableCastles.indexOf(a);
  if (canAttackCastle(a)) {
    if (0 > c) {
      b.attackableCastles.push(a);
      sortCastles(b, b.attackableCastles);
    }
  } else {
    if (-1 < c) {
      b.attackableCastles.splice(c, 1);
    }
  }
}
export function refreshScheduledCastles(a) {
  var b = game.castles;
  b.revision++;
  var c = b.scheduledCastles.indexOf(a);
  if (a.attackScheduled) {
    if (0 > c) {
      b.scheduledCastles.push(a);
      sortCastles(b, b.scheduledCastles);
    }
  } else {
    if (-1 < c) {
      b.scheduledCastles.splice(c, 1);
    }
  }
}
export function invalidateCastleRevision() {
  game.castles.revision++;
}
export function sortCastles(a, b) {
  if (!(!b || 2 > b.length)) {
    b.sort(a.GE);
  }
}
export function getDungeonTheme(a) {
  switch (a) {
    case 0:
      return stoneDungeonTheme;
    case 1:
      return stoneDungeonTheme;
    case 2:
      return towerTheme;
    case 3:
      return iceDungeonTheme;
    case 4:
      return templeTheme;
    case 5:
      return woodenMineTheme;
    case 6:
      return ironMineTheme;
    case 7:
      return templeTheme;
    case 8:
      return chamberTheme;
    case 9:
      return caveTheme;
    case 10:
      return dungeonTheme;
    case 11:
      return castleTheme;
    default:
      return dungeonTheme;
  }
}
export function getDungeonMapSprite(a) {
  switch (a) {
    case 0:
      return "L2_Terrain068.PNG";
    case 1:
      return "L2_Terrain070.PNG";
    case 2:
      return "L2_Terrain069.PNG";
    case 3:
      return "L2_Terrain071.PNG";
    case 4:
      return "L2_Terrain081.PNG";
    case 5:
      return "L2_Terrain082.PNG";
    case 6:
      return "L2_DungeonE.PNG";
    case 7:
      return "L2_Terrain090.PNG";
    case 8:
      return "L2_Terrain091.PNG";
    case 9:
      return "L2_Terrain095.PNG";
    case 10:
      return "L2_Terrain099.PNG";
    default:
      return "L2_Terrain068.PNG";
  }
}
export function initializeWorldRegions() {
  WORLD_BLOCK_COLUMNS = 19;
  WORLD_BLOCK_ROWS = 18;
  WORLD_ORIGIN_COLUMN = 100;
  WORLD_ORIGIN_ROW = 100;
  Castle.prototype.setConquered = function (a) {
    this.conquered = a;
  };
  Castle.prototype.refreshConquest = function () {
    refreshCastleConquest(this);
  };
  Castle.prototype.levelSeed = function () {
    return hashCoordinates(this.regionColumn, this.regionRow, 1);
  };
}
