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
export function Dungeon(dungeonId, dungeonName, dungeonType, worldColumn, worldRow, regionColumn, regionRow, levelCount, ownerCastle) {
  this.dungeonId = dungeonId;
  this.dungeonName = dungeonName;
  this.dungeonType = dungeonType;
  this.farmCost = 0;
  this.hasSecondEntrance = !(4 === dungeonType || 5 === dungeonType || 7 === dungeonType || 8 === dungeonType);
  this.mapSprite = getDungeonMapSprite(dungeonType);
  this.conquered = this.isFarm = this.cleared = this.discovered = false;
  this.farmStartTurn = this.clearedTurn = 0;
  this.worldColumn = worldColumn;
  this.worldRow = worldRow;
  this.regionColumn = regionColumn;
  this.regionRow = regionRow;
  this.levelCount = levelCount;
  this.currentLevelIndex = 0;
  this.region = ownerCastle;
}
export function canFarmDungeon(dungeon) {
  return dungeon.discovered && dungeon.conquered && !dungeon.isFarm && dungeon.region.conquered;
}
export function randomDungeonType(seededRandom) {
  switch (randomIntFrom(seededRandom, 11)) {
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
  this.dungeonRegistry = {};
  this.discoveredDungeonCount = 0;
  this.attackable = [];
  this.cleared = [];
  this.farms = [];
  this.discovered = [];
  this.farmable = [];
  this.sortingEnabled = true;
  this.pendingFarmKills = 0;
  this.compareByFarmCost = function (leftDungeon, rightDungeon) {
    return floorNumber(leftDungeon.farmCost * dungeonCostBonus.currentValue) < floorNumber(rightDungeon.farmCost * dungeonCostBonus.currentValue) ? -1 : 1;
  };
}
export function resetDungeons() {
  var dungeonManager = game.dungeons;
  dungeonManager.discovered.length = 0;
  dungeonManager.attackable.length = 0;
  dungeonManager.cleared.length = 0;
  dungeonManager.farms.length = 0;
  dungeonManager.farmable.length = 0;
  dungeonManager.discoveredDungeonCount = 0;
  dungeonManager.pendingFarmKills = 0;
  var dungeonIndex;
  for (dungeonIndex = 0; dungeonIndex < dungeonManager.dungeonList.length; dungeonIndex++) {
    var dungeon = dungeonManager.dungeonList[dungeonIndex];
    dungeon.discovered = false;
    dungeon.cleared = false;
    dungeon.conquered = false;
    dungeon.isFarm = false;
    dungeon.farmStartTurn = 0;
    dungeon.clearedTurn = 0;
  }
}
export function discoverDungeon(dungeon) {
  var dungeonManager = game.dungeons;
  if (0 > dungeonManager.discovered.indexOf(dungeon)) {
    dungeonManager.discovered.push(dungeon);
    dungeonManager.discoveredDungeonCount++;
  }
  if (dungeon.discovered && !dungeon.cleared && !dungeon.isFarm && 0 > dungeonManager.attackable.indexOf(dungeon)) {
    dungeonManager.attackable.push(dungeon);
    sortDungeons(dungeonManager, dungeonManager.attackable);
  }
  refreshFarmableDungeons(dungeonManager, dungeon);
}
export function refreshFarmableDungeons(dungeonManager, dungeon) {
  var farmableIndex = dungeonManager.farmable.indexOf(dungeon);
  if (canFarmDungeon(dungeon)) {
    if (0 > farmableIndex) {
      dungeonManager.farmable.push(dungeon);
      sortDungeons(dungeonManager, dungeonManager.farmable);
    }
  } else {
    if (-1 < farmableIndex) {
      dungeonManager.farmable.splice(farmableIndex, 1);
    }
  }
}
export function registerDungeonFarm(dungeon) {
  var dungeonManager = game.dungeons;
  if (0 > dungeonManager.farms.indexOf(dungeon)) {
    dungeonManager.farms.push(dungeon);
    sortDungeons(dungeonManager, dungeonManager.farms);
  }
  var attackableIndex = dungeonManager.attackable.indexOf(dungeon);
  if (-1 < attackableIndex) {
    dungeonManager.attackable.splice(attackableIndex, 1);
  }
  var clearedIndex = dungeonManager.cleared.indexOf(dungeon);
  if (-1 < clearedIndex) {
    dungeonManager.cleared.splice(clearedIndex, 1);
  }
  refreshFarmableDungeons(dungeonManager, dungeon);
}
export function sortDungeons(dungeonManager, dungeonList) {
  if (!(!dungeonManager.sortingEnabled || !dungeonList || 2 > dungeonList.length)) {
    dungeonList.sort(dungeonManager.compareByFarmCost);
  }
}
export function Farm(dungeonId, farmColumn, farmRow) {
  this.dungeonId = dungeonId;
  this.farmColumn = farmColumn;
  this.farmRow = farmRow;
}
export function FarmRegistry() {
  this.farmList = [];
  this.farmsById = {};
  this.farmSpriteName = "L2_Town01.PNG";
}
export function resetFarms() {
  var farmRegistry = game.farms;
  farmRegistry.farmList.length = 0;
  farmRegistry.farmsById = {};
}
export function registerFarm(farmRegistry, farm) {
  farmRegistry.farmList.push(farm);
  farmRegistry.farmsById[farm.dungeonId] = farm;
  var farmTile = game.world.getTileAtPixel(farm.farmColumn, farm.farmRow);
  if (farmTile) {
    farmTile.setDecorationSprite(game.terrainSprites.getSprite(farmRegistry.farmSpriteName));
  }
}
export function Shop(dungeonId, worldColumn, worldRow) {
  this.dungeonId = dungeonId;
  this.worldColumn = worldColumn;
  this.worldRow = worldRow;
}
export function ShopRegistry() {
  this.shopList = [];
  this.shopsById = {};
  this.collectedGold = 0;
  this.shopSpriteNames = "L2_Terrain089.PNG L2_Terrain077.PNG L2_Terrain077.PNG L2_Terrain076.PNG L2_Terrain078.PNG L2_Terrain079.PNG L2_Terrain083.PNG L2_Terrain084.PNG L2_Terrain085.PNG".split(" ");
}
export function resetShops() {
  var shopRegistry = game.shops;
  shopRegistry.shopList.length = 0;
  shopRegistry.collectedGold = 0;
  shopRegistry.shopsById = {};
}
export function randomShopSprite(shopRegistry) {
  return shopRegistry.shopSpriteNames[randomInt(shopRegistry.shopSpriteNames.length)];
}
export function initializeWorldDungeons() {
  Dungeon.prototype.setConquered = function (isConquered) {
    this.conquered = isConquered;
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
  Dungeon.prototype.getRegionColumn = function () {
    return this.regionColumn;
  };
  Dungeon.prototype.getRegionRow = function () {
    return this.regionRow;
  };
  Dungeon.prototype.levelSeed = function () {
    return hashCoordinates(this.worldColumn, this.worldRow, this.currentLevelIndex);
  };
  Dungeon.prototype.advanceLevel = function () {
    this.currentLevelIndex++;
    resetEncounter();
    game.state.statisticsRecorder.recordLevelCleared();
    if (this.currentLevelIndex < this.levelCount) {
      generateDungeonLevel((/** @type {any} */ (this)).levelSeed(), this.dungeonType, this.hasSecondEntrance, true);
      awardAdventurePoints(POINT_EVENT_LEVEL_CLEARED);
      recordGameEvent("Dungeon", "进入等级" + this.currentLevelIndex);
    } else {
      game.currentDungeon = null;
      this.conquered = this.cleared = game.worldActive = true;
      this.clearedTurn = game.state.turnNumber;
      game.dungeons.registerClearedDungeon(this);
      this.region.refreshConquest();
      game.state.statisticsRecorder.recordDungeonCleared();
      awardAdventurePoints(POINT_EVENT_DUNGEON_CLEARED);
      recordGameEvent("Dungeon", "Dungeon Cleared");
      var allyIndex,
        allyPosition,
        allyList = getAllies(),
        ally;
      for (allyIndex = 0; allyIndex < allyList.length; allyIndex++) {
        ally = allyList[allyIndex];
        allyPosition = ally.position;
        clearMovementTarget(allyPosition);
        allyPosition.currentHallway = null;
        allyPosition.room = null;
        ally.actionType = IDLE_ACTION;
      }
      clearItemDrops(game.itemDrops);
    }
  };
  DungeonRegistry.prototype.setFarmedKills = function (farmedKills) {
    this.pendingFarmKills = farmedKills;
  };
  DungeonRegistry.prototype.registerClearedDungeon = function (dungeon) {
    if (0 > this.cleared.indexOf(dungeon)) {
      this.cleared.push(dungeon);
      sortDungeons(this, this.cleared);
    }
    var attackableIndex = this.attackable.indexOf(dungeon);
    if (-1 < attackableIndex) {
      this.attackable.splice(attackableIndex, 1);
    }
    refreshFarmableDungeons(this, dungeon);
  };
  FarmRegistry.prototype.jitterCoordinate = function (coordinate) {
    var jitterAmount = 1 + randomInt(2);
    return 0.5 > Math.random() ? coordinate - jitterAmount : coordinate + jitterAmount;
  };
  ShopRegistry.prototype.addShop = function (shop) {
    this.shopList.push(shop);
    this.shopsById[shop.dungeonId] = shop;
    var shopTile = game.world.getTileAtPixel(shop.worldColumn, shop.worldRow);
    if (shopTile) {
      var shopSprite = game.terrainSprites.getSprite(randomShopSprite(this));
      shopTile.setDecorationSprite(shopSprite);
    }
  };
  ShopRegistry.prototype.jitterCoordinate = function (coordinate) {
    return 0.5 > Math.random() ? coordinate - 4 : coordinate + 4;
  };
}
