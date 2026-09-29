/** 区域布局、地牢命名与城堡解锁。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { hashCoordinates, randomIntFrom } from "../core/math.js";
import { game } from "../runtime/game.js";
import { refreshWorldBlocks } from "./terrain.js";
import { castleTheme, caveTheme, chamberTheme, dungeonTheme, iceDungeonTheme, ironMineTheme, stoneDungeonTheme, templeTheme, towerTheme, woodenMineTheme } from "../content/dungeon-themes.js";
export var WORLD_BLOCK_COLUMNS, WORLD_BLOCK_ROWS, WORLD_ORIGIN_COLUMN, WORLD_ORIGIN_ROW;
export function DungeonNameGenerator(seededRandom) {
  this.seededRandom = seededRandom;
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
export function generateDungeonName(nameGenerator, dungeonType) {
  var adjective;
  a: switch (dungeonType) {
    case 3:
      adjective = nameGenerator.iceAdjectives[randomIntFrom(nameGenerator.seededRandom, nameGenerator.iceAdjectives.length)];
      break a;
    default:
      adjective = nameGenerator.dungeonAdjectives[randomIntFrom(nameGenerator.seededRandom, nameGenerator.dungeonAdjectives.length)];
  }
  return "" + adjective + "" + getDungeonNoun(nameGenerator, dungeonType);
}
export function getDungeonNoun(nameGenerator, dungeonType) {
  switch (dungeonType) {
    case 0:
    case 2:
    case 3:
    case 1:
      return nameGenerator.dungeonNouns[randomIntFrom(nameGenerator.seededRandom, nameGenerator.dungeonNouns.length)];
    case 4:
    case 5:
      return nameGenerator.towerNouns[randomIntFrom(nameGenerator.seededRandom, nameGenerator.towerNouns.length)];
    case 6:
      return nameGenerator.lairNouns[randomIntFrom(nameGenerator.seededRandom, nameGenerator.lairNouns.length)];
    case 7:
    case 8:
      return nameGenerator.monumentNouns[randomIntFrom(nameGenerator.seededRandom, nameGenerator.monumentNouns.length)];
    case 9:
      return nameGenerator.cryptNouns[randomIntFrom(nameGenerator.seededRandom, nameGenerator.cryptNouns.length)];
    case 10:
      return nameGenerator.templeNouns[randomIntFrom(nameGenerator.seededRandom, nameGenerator.templeNouns.length)];
    case 11:
      return nameGenerator.castleNouns[randomIntFrom(nameGenerator.seededRandom, nameGenerator.castleNouns.length)];
    default:
      return nameGenerator.lairNouns[randomIntFrom(nameGenerator.seededRandom, nameGenerator.lairNouns.length)];
  }
}
export function WorldRegion(regionKey, regionColumn, regionRow) {
  this.regionKey = regionKey;
  this.regionColumn = regionColumn;
  this.regionRow = regionRow;
  this.castle = null;
}
export function Castle(castleId, castleName, regionColumn, regionRow, worldPixelX, worldPixelY) {
  this.castleId = castleId;
  this.castleName = castleName;
  this.regionColumn = regionColumn;
  this.regionRow = regionRow;
  this.worldPixelX = worldPixelX;
  this.worldPixelY = worldPixelY;
  this.dungeonsConquered = this.conquered = false;
  this.regionLocked = true;
  this.attackScheduled = false;
  this.requiredMonsterLevel = this.conqueredDungeonCount = 0;
  this.regions = [];
  this.dungeonList = [];
}
export function canAttackCastle(castle) {
  return !castle.regionLocked && !castle.conquered && castle.dungeonsConquered && !castle.attackScheduled;
}
export function refreshCastleConquest(castle) {
  if (castle.dungeonsConquered || castle.conquered) {
    castle.conqueredDungeonCount = castle.dungeonList.length;
  } else {
    var dungeonIndex;
    for (dungeonIndex = castle.conqueredDungeonCount = 0; dungeonIndex < castle.dungeonList.length; dungeonIndex++) {
      if (castle.dungeonList[dungeonIndex].conquered) {
        castle.conqueredDungeonCount++;
      }
    }
    if (castle.conqueredDungeonCount === castle.dungeonList.length) {
      castle.dungeonsConquered = true;
      var castleManager = game.castles;
      castleManager.nextRequiredMonsterLevel++;
      castle.requiredMonsterLevel = castleManager.nextRequiredMonsterLevel;
      invalidateCastleRevision();
    }
    if (canAttackCastle(castle)) {
      refreshAttackableCastles(castle);
    }
  }
}
export function RegionLayout() {
  this.minRegionColumn = game.regions.regionGridOriginColumn;
  this.minRegionRow = game.regions.regionGridOriginRow;
  var regionManager = game.regions;
  this.maxRegionColumn = regionManager.regionGridOriginColumn + regionManager.regionGridSpan;
  regionManager = game.regions;
  this.maxRegionRow = regionManager.regionGridOriginRow + regionManager.regionGridSpan;
}
export function getWestRegion(a, regionColumn, regionRow, occupiedRegionKeys) {
  return regionColumn - 1 >= a.minRegionColumn && (a = regionColumn - 1 + "_" + regionRow, !occupiedRegionKeys[a]) ? game.regions.byKey[a] : null;
}
export function getEastRegion(a, regionColumn, regionRow, occupiedRegionKeys) {
  return regionColumn + 1 < a.maxRegionColumn && (a = regionColumn + 1 + "_" + regionRow, !occupiedRegionKeys[a]) ? game.regions.byKey[a] : null;
}
export function getNorthRegion(a, regionColumn, regionRow, occupiedRegionKeys) {
  return regionRow - 1 >= a.minRegionRow && (a = regionColumn + "_" + (regionRow - 1), !occupiedRegionKeys[a]) ? game.regions.byKey[a] : null;
}
export function getSouthRegion(a, regionColumn, regionRow, occupiedRegionKeys) {
  return regionRow + 1 < a.maxRegionRow && (a = regionColumn + "_" + (regionRow + 1), !occupiedRegionKeys[a]) ? game.regions.byKey[a] : null;
}
export function chooseAdjacentRegion(regionLayout, b, occupiedRegionKeys, d) {
  var regionColumn = b.regionColumn;
  b = b.regionRow;
  if (0.5 > d.random()) {
    if (0.5 > d.random()) {
      if ((d = getWestRegion(regionLayout, regionColumn, b, occupiedRegionKeys)) || (d = getEastRegion(regionLayout, regionColumn, b, occupiedRegionKeys)) || (d = getSouthRegion(regionLayout, regionColumn, b, occupiedRegionKeys))) {
        return d;
      }
      d = getNorthRegion(regionLayout, regionColumn, b, occupiedRegionKeys);
    } else {
      if ((d = getEastRegion(regionLayout, regionColumn, b, occupiedRegionKeys)) || (d = getWestRegion(regionLayout, regionColumn, b, occupiedRegionKeys)) || (d = getNorthRegion(regionLayout, regionColumn, b, occupiedRegionKeys))) {
        return d;
      }
      d = getSouthRegion(regionLayout, regionColumn, b, occupiedRegionKeys);
    }
  } else if (0.5 > d.random()) {
    if ((d = getNorthRegion(regionLayout, regionColumn, b, occupiedRegionKeys)) || (d = getSouthRegion(regionLayout, regionColumn, b, occupiedRegionKeys)) || (d = getEastRegion(regionLayout, regionColumn, b, occupiedRegionKeys))) {
      return d;
    }
    d = getWestRegion(regionLayout, regionColumn, b, occupiedRegionKeys);
  } else {
    if ((d = getSouthRegion(regionLayout, regionColumn, b, occupiedRegionKeys)) || (d = getNorthRegion(regionLayout, regionColumn, b, occupiedRegionKeys)) || (d = getWestRegion(regionLayout, regionColumn, b, occupiedRegionKeys))) {
      return d;
    }
    d = getEastRegion(regionLayout, regionColumn, b, occupiedRegionKeys);
  }
  if (d) {
    return d;
  }
}
export function resetCastles() {
  var castleManager = game.castles;
  castleManager.attackableCastles.length = 0;
  castleManager.scheduledCastles.length = 0;
  castleManager.revision = 0;
  castleManager.nextRequiredMonsterLevel = 1;
  var castleIndex;
  for (castleIndex = 0; castleIndex < castleManager.castleList.length; castleIndex++) {
    var castle = castleManager.castleList[castleIndex];
    castle.conquered = false;
    castle.regionLocked = true;
    castle.attackScheduled = false;
    castle.conqueredDungeonCount = 0;
    castle.requiredMonsterLevel = 0;
    castle.dungeonsConquered = 0 === castle.dungeonList.length;
  }
}
export function unlockStartingRegion() {
  /** @type {any} */
  var a = game.world.worldBlocks[1][1];
  a = a.regionColumn + "_" + a.regionRow;
  var ownerCastle = findCastleByRegion(a);
  if (ownerCastle) {
    ownerCastle.regionLocked = false;
    refreshWorldBlocks(game.world);
  } else {
    console.log("failed to find world block owner castle: " + a);
  }
}
export function findCastle(a) {
  return (a = game.castles.castleRegistry[a]) ? a : null;
}
export function findCastleByRegion(a) {
  return (a = game.castles.byRegionKey[a]) ? a : null;
}
export function refreshAttackableCastles(castle) {
  var castleManager = game.castles;
  castleManager.revision++;
  var attackableIndex = castleManager.attackableCastles.indexOf(castle);
  if (canAttackCastle(castle)) {
    if (0 > attackableIndex) {
      castleManager.attackableCastles.push(castle);
      sortCastles(castleManager, castleManager.attackableCastles);
    }
  } else {
    if (-1 < attackableIndex) {
      castleManager.attackableCastles.splice(attackableIndex, 1);
    }
  }
}
export function refreshScheduledCastles(castle) {
  var castleManager = game.castles;
  castleManager.revision++;
  var scheduledIndex = castleManager.scheduledCastles.indexOf(castle);
  if (castle.attackScheduled) {
    if (0 > scheduledIndex) {
      castleManager.scheduledCastles.push(castle);
      sortCastles(castleManager, castleManager.scheduledCastles);
    }
  } else {
    if (-1 < scheduledIndex) {
      castleManager.scheduledCastles.splice(scheduledIndex, 1);
    }
  }
}
export function invalidateCastleRevision() {
  game.castles.revision++;
}
export function sortCastles(castleManager, castleList) {
  if (!(!castleList || 2 > castleList.length)) {
    castleList.sort(castleManager.compareCastles);
  }
}
export function getDungeonTheme(dungeonType) {
  switch (dungeonType) {
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
export function getDungeonMapSprite(dungeonType) {
  switch (dungeonType) {
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
  Castle.prototype.setConquered = function (isConquered) {
    this.conquered = isConquered;
  };
  Castle.prototype.refreshConquest = function () {
    refreshCastleConquest(this);
  };
  Castle.prototype.levelSeed = function () {
    return hashCoordinates(this.regionColumn, this.regionRow, 1);
  };
}
