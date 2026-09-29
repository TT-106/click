/** 金币掉落、宝箱生成和拾取。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { Vector2, randomInt, setVector } from "../core/math.js";
import { getMonsters } from "../combat/encounters.js";
import { globalUpgradeDefinitions } from "../content/balance.js";
import { canPlaceRoomObject } from "../world/rooms.js";
export function GoldDrop(goldAmount, levelPositionX, levelPositionY, room) {
  this.goldAmount = goldAmount;
  this.levelPositionX = levelPositionX;
  this.levelPositionY = levelPositionY;
  this.room = room;
  this.collected = false;
  this.claimedBy = null;
  this.claimDistance = 0;
}
export function GoldDropRegistry() {
  this.drops = [];
  this.mediumGoldSprite = this.mediumGoldSprite = this.smallGoldSprite = null;
}
export function removeGoldDrop(a) {
  var goldDropRegistry = game.goldDrops;
  a = goldDropRegistry.drops.indexOf(a);
  if (-1 < a) {
    goldDropRegistry.drops.splice(a, 1);
  }
}
export function TreasureChest(levelX, levelY, room, definition, isWestWall) {
  this.levelX = levelX;
  this.levelY = levelY;
  this.room = room;
  this.opened = false;
  this.closedSpriteName = isWestWall ? definition.westWallVariants.closed : definition.standardVariants.closed;
  this.openedSpriteName = isWestWall ? definition.westWallVariants.opened : definition.standardVariants.opened;
  this.kind = definition.kind;
  this.westWall = isWestWall;
  this.definition = definition;
  this.selected = false;
}
export function setChestOpened(chest, isOpened) {
  if (chest.opened = isOpened) {
    chest.selected = false;
    game.state.party.setTargetTreasureChest(null);
  }
}
export function TreasureRegistry() {
  this.targets = [];
  this.targetByRoomId = {};
  this.targetDefinitions = [];
  this.spawnPointScratch = new Vector2();
}
export function spawnRoomTreasure(a) {
  var treasureRegistry = game.treasure;
    var hasMonsters = 0 < getMonsters().length;
  if (!getRoomTreasure(treasureRegistry, a)) {
    if (3 != a.encounterType) {
      if (!hasMonsters && 2 > a.doorList.length) {
        return;
      }
      var treasureSpawnChance = globalUpgradeDefinitions.treasureChance.currentValue / 100;
      if (Math.random() > treasureSpawnChance) {
        return;
      }
    }
    var chestDefinition = treasureRegistry.targetDefinitions[randomInt(treasureRegistry.targetDefinitions.length)],
      isWestWall = 0.5 > Math.random(),
      f,
      wallPoint;
    f = false;
    for (var attemptCount = 0; !f && 10 > attemptCount;) {
      wallPoint = isWestWall ? treasureRegistry.pickWestWallPoint(a) : treasureRegistry.pickNorthWallPoint(a);
      if (!(f = canPlaceRoomObject(a, wallPoint))) {
        wallPoint = null;
      }
      attemptCount++;
    }
    if (f = wallPoint) {
      var chestLevelX = f.x * game.tileSize;
      f = f.y * game.tileSize;
      if (!chestDefinition.flushPlacement) {
        if (isWestWall) {
          chestLevelX += game.tileSize;
        } else {
          f += game.tileSize;
        }
      }
      a = new TreasureChest(chestLevelX, f, a, chestDefinition, isWestWall);
      treasureRegistry.targets.push(a);
      treasureRegistry.targetByRoomId[a.room.roomId] = a;
    } else {
      console.log("failed to find treasure chest location.");
    }
  }
}
export function getRoomTreasure(treasureRegistry, room) {
  return room ? treasureRegistry.targetByRoomId[room.roomId] : null;
}
export function initializeLootTreasure() {
  GoldDrop.prototype.setCollected = function (collected) {
    this.collected = collected;
  };
  GoldDrop.prototype.setClaimedBy = function (character) {
    this.claimedBy = character;
  };
  GoldDrop.prototype.getClaimDistance = function () {
    return this.claimDistance;
  };
  GoldDrop.prototype.setClaimDistance = function (distance) {
    this.claimDistance = distance;
  };
  GoldDropRegistry.prototype.releaseClaims = function () {
    var dropIndex;
    for (dropIndex = 0; dropIndex < this.drops.length; dropIndex++) {
      this.drops[dropIndex].setClaimedBy(null);
      this.drops[dropIndex].setClaimDistance(0);
    }
  };
  TreasureRegistry.prototype.pickNorthWallPoint = function (a) {
    var roomTileRow = a.tileRow;
    a = a.tileColumn + randomInt(a.widthInTiles);
    setVector(this.spawnPointScratch, a, roomTileRow - 1);
    return this.spawnPointScratch;
  };
  TreasureRegistry.prototype.pickWestWallPoint = function (a) {
    var roomTileColumn = a.tileColumn;
    a = a.tileRow + randomInt(a.heightInTiles);
    setVector(this.spawnPointScratch, roomTileColumn - 1, a);
    return this.spawnPointScratch;
  };
}
