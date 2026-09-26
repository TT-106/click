/** 地牢状态、农场、商店及相关索引。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { getDungeonMapSprite } from "./regions.js";
import { game } from "../runtime/game.js";
import { floorNumber, hashCoordinates, randomInt, randomIntFrom, recordGameEvent } from "../core/math.js";
import { getAllies, resetEncounter } from "../combat/encounters.js";
import { generateDungeonLevel } from "./generation.js";
import { POINT_EVENT_DUNGEON_CLEARED, POINT_EVENT_LEVEL_CLEARED, awardAdventurePoints } from "../progression/points.js";
import { clearMovementTarget } from "../characters/movement.js";
import { IDLE_ACTION } from "../ai/targeting.js";
import { clearItemDrops } from "../loot/items.js";
import { dungeonCostBonus } from "../content/balance.js";
export function Dungeon(a, b, c, d, f, g, h, l, n) {
  this.dungeonId = a;
  this.dungeonName = b;
  this.dungeonType = c;
  this.farmCost = 0;
  this.hasSecondEntrance = !(4 === c || 5 === c || 7 === c || 8 === c);
  this.Fo = getDungeonMapSprite(c);
  this.conquered = this.isFarm = this.cleared = this.discovered = false;
  this.farmStartTurn = this.clearedTurn = 0;
  this.worldColumn = d;
  this.worldRow = f;
  this.WE = g;
  this.XE = h;
  this.levelCount = l;
  this.currentLevelIndex = 0;
  this.region = n;
}
export function canFarmDungeon(a) {
  return a.discovered && a.conquered && !a.isFarm && a.region.conquered;
}
export function randomDungeonType(a) {
  switch (randomIntFrom(a, 11)) {
    case 0:
      return 0;
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
      return 4;
    case 5:
      return 5;
    case 6:
      return 6;
    case 7:
      return 7;
    case 8:
      return 8;
    case 9:
      return 9;
    case 10:
      return 10;
    default:
      return 0;
  }
}
export function DungeonRegistry() {
  this.dungeonList = [];
  this.Do = {};
  this.discoveredDungeonCount = 0;
  this.attackable = [];
  this.cleared = [];
  this.farms = [];
  this.discovered = [];
  this.farmable = [];
  this.lt = true;
  this.pendingFarmKills = 0;
  this.EE = function (a, b) {
    return floorNumber(a.farmCost * dungeonCostBonus.currentValue) < floorNumber(b.farmCost * dungeonCostBonus.currentValue) ? -1 : 1;
  };
}
export function resetDungeons() {
  var a = game.dungeons;
  a.discovered.length = 0;
  a.attackable.length = 0;
  a.cleared.length = 0;
  a.farms.length = 0;
  a.farmable.length = 0;
  a.discoveredDungeonCount = 0;
  a.pendingFarmKills = 0;
  var b;
  for (b = 0; b < a.dungeonList.length; b++) {
    var c = a.dungeonList[b];
    c.discovered = false;
    c.cleared = false;
    c.conquered = false;
    c.isFarm = false;
    c.farmStartTurn = 0;
    c.clearedTurn = 0;
  }
}
export function discoverDungeon(a) {
  var b = game.dungeons;
  if (0 > b.discovered.indexOf(a)) {
    b.discovered.push(a);
    b.discoveredDungeonCount++;
  }
  if (a.discovered && !a.cleared && !a.isFarm && 0 > b.attackable.indexOf(a)) {
    b.attackable.push(a);
    sortDungeons(b, b.attackable);
  }
  refreshFarmableDungeons(b, a);
}
export function refreshFarmableDungeons(a, b) {
  var c = a.farmable.indexOf(b);
  if (canFarmDungeon(b)) {
    if (0 > c) {
      a.farmable.push(b);
      sortDungeons(a, a.farmable);
    }
  } else {
    if (-1 < c) {
      a.farmable.splice(c, 1);
    }
  }
}
export function registerDungeonFarm(a) {
  var b = game.dungeons;
  if (0 > b.farms.indexOf(a)) {
    b.farms.push(a);
    sortDungeons(b, b.farms);
  }
  var c = b.attackable.indexOf(a);
  if (-1 < c) {
    b.attackable.splice(c, 1);
  }
  c = b.cleared.indexOf(a);
  if (-1 < c) {
    b.cleared.splice(c, 1);
  }
  refreshFarmableDungeons(b, a);
}
export function sortDungeons(a, b) {
  if (!(!a.lt || !b || 2 > b.length)) {
    b.sort(a.EE);
  }
}
export function Farm(a, b, c) {
  this.dungeonId = a;
  this.kw = b;
  this.lw = c;
}
export function FarmRegistry() {
  this.nw = [];
  this.jw = {};
  this.Gz = "L2_Town01.PNG";
}
export function resetFarms() {
  var a = game.farms;
  a.nw.length = 0;
  a.jw = {};
}
export function registerFarm(a, b) {
  a.nw.push(b);
  a.jw[b.dungeonId] = b;
  var c = game.world.getTileAtPixel(b.kw, b.lw);
  if (c) {
    c.setDecorationSprite(game.terrainSprites.getSprite(a.Gz));
  }
}
export function Shop(a, b, c) {
  this.dungeonId = a;
  this.iq = b;
  this.jq = c;
}
export function ShopRegistry() {
  this.ht = [];
  this.zx = {};
  this.collectedGold = 0;
  this.tB = "L2_Terrain089.PNG L2_Terrain077.PNG L2_Terrain077.PNG L2_Terrain076.PNG L2_Terrain078.PNG L2_Terrain079.PNG L2_Terrain083.PNG L2_Terrain084.PNG L2_Terrain085.PNG".split(" ");
}
export function resetShops() {
  var a = game.shops;
  a.ht.length = 0;
  a.collectedGold = 0;
  a.zx = {};
}
export function randomShopSprite(a) {
  return a.tB[randomInt(a.tB.length)];
}
export function initializeWorldDungeons() {
  Dungeon.prototype.tx = function (a) {
    this.conquered = a;
  };
  Dungeon.prototype.getPixelX = function () {
    return game.world.tileToPixelX(this.worldColumn);
  };
  Dungeon.prototype.getPixelY = function () {
    return game.world.tileToPixelY(this.worldRow);
  };
  Dungeon.prototype.getWorldColumn = function () {
    return this.worldColumn;
  };
  Dungeon.prototype.getWorldRow = function () {
    return this.worldRow;
  };
  Dungeon.prototype.vw = function () {
    return this.WE;
  };
  Dungeon.prototype.ww = function () {
    return this.XE;
  };
  Dungeon.prototype.er = function () {
    return hashCoordinates(this.worldColumn, this.worldRow, this.currentLevelIndex);
  };
  Dungeon.prototype.iw = function () {
    this.currentLevelIndex++;
    resetEncounter();
    game.state.statisticsRecorder.$r();
    if (this.currentLevelIndex < this.levelCount) {
      generateDungeonLevel((/** @type {any} */ (this)).er(), this.dungeonType, this.hasSecondEntrance, true);
      awardAdventurePoints(POINT_EVENT_LEVEL_CLEARED);
      recordGameEvent("Dungeon", "进入等级" + this.currentLevelIndex);
    } else {
      game.currentDungeon = null;
      this.conquered = this.cleared = game.worldActive = true;
      this.clearedTurn = game.state.turnNumber;
      game.dungeons.Is(this);
      this.region.Is();
      game.state.statisticsRecorder.recordDungeonCleared();
      awardAdventurePoints(POINT_EVENT_DUNGEON_CLEARED);
      recordGameEvent("Dungeon", "Dungeon Cleared");
      var a,
        b,
        c = getAllies(),
        d;
      for (a = 0; a < c.length; a++) {
        d = c[a];
        b = d.position;
        clearMovementTarget(b);
        b.currentHallway = null;
        b.room = null;
        d.actionType = IDLE_ACTION;
      }
      clearItemDrops();
    }
  };
  DungeonRegistry.prototype.setFarmedKills = function (a) {
    this.pendingFarmKills = a;
  };
  DungeonRegistry.prototype.Is = function (a) {
    if (0 > this.cleared.indexOf(a)) {
      this.cleared.push(a);
      sortDungeons(this, this.cleared);
    }
    var b = this.attackable.indexOf(a);
    if (-1 < b) {
      this.attackable.splice(b, 1);
    }
    refreshFarmableDungeons(this, a);
  };
  FarmRegistry.prototype.Yw = function (a) {
    var b = 1 + randomInt(2);
    return 0.5 > Math.random() ? a - b : a + b;
  };
  ShopRegistry.prototype.Ut = function (a) {
    this.ht.push(a);
    this.zx[a.dungeonId] = a;
    if (a = game.world.getTileAtPixel(a.iq, a.jq)) {
      var b = game.terrainSprites.getSprite(randomShopSprite(this));
      a.setDecorationSprite(b);
    }
  };
  ShopRegistry.prototype.Yw = function (a) {
    return 0.5 > Math.random() ? a - 4 : a + 4;
  };
}
