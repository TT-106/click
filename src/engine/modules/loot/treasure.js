/** 金币掉落、宝箱生成和拾取。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { Vector2, randomInt, setVector } from "../core/math.js";
import { getMonsters } from "../combat/encounters.js";
import { globalUpgradeDefinitions } from "../content/balance.js";
import { canPlaceRoomObject } from "../world/rooms.js";
import { TILE_SIZE } from "../core/screen-layout.js";
/** 金币/宝箱所需的三个容器由组合根注入（与 views.monsters / views.character 同一形状）。
 *  绑的都是**容器对象本身**：game.goldDrops、game.treasure、game.state 在 runtime/game.js 的对象字面量里
 *  只构造一次，src/ 内 `.goldDrops =`/`.treasure =`/`game.state =` 整对象重赋值各 0 处；只有 game.state.party
 *  会在 resetRun 里整体换成新 PartyState（runtime/game.js:365），所以这里绑 state 容器、每次现读 .party，
 *  绝不绑 party 本身，否则重开一局后绑到的就是过期快照。未绑定就用到会立刻抛。 */
var boundGoldDrops = null;
var boundSessionState = null;
var boundTreasure = null;
export function bindLootTreasure(goldDrops, state, treasure) {
  boundGoldDrops = goldDrops;
  boundSessionState = state;
  boundTreasure = treasure;
}
function goldDropRegistryRef() {
  if (!boundGoldDrops) {
    throw new Error('宝藏掉落尚未绑定金币掉落表：请在组合根调用 bindLootTreasure(game.goldDrops, game.state, game.treasure)');
  }
  return boundGoldDrops;
}
function treasureState() {
  if (!boundSessionState) {
    throw new Error('宝藏掉落尚未绑定会话状态：请在组合根调用 bindLootTreasure(game.goldDrops, game.state, game.treasure)');
  }
  return boundSessionState;
}
function treasureRegistryRef() {
  if (!boundTreasure) {
    throw new Error('宝藏掉落尚未绑定宝箱登记表：请在组合根调用 bindLootTreasure(game.goldDrops, game.state, game.treasure)');
  }
  return boundTreasure;
}
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
export function removeGoldDrop(goldDrop) {
  var goldDropRegistry = goldDropRegistryRef();
  var dropIndex = goldDropRegistry.drops.indexOf(goldDrop);
  if (-1 < dropIndex) {
    goldDropRegistry.drops.splice(dropIndex, 1);
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
    treasureState().party.setTargetTreasureChest(null);
  }
}
export function TreasureRegistry() {
  this.targets = [];
  this.targetByRoomId = {};
  this.targetDefinitions = [];
  this.spawnPointScratch = new Vector2();
}
export function spawnRoomTreasure(room) {
  var treasureRegistry = treasureRegistryRef();
    var hasMonsters = 0 < getMonsters().length;
  if (!getRoomTreasure(treasureRegistry, room)) {
    if (3 != room.encounterType) {
      if (!hasMonsters && 2 > room.doorList.length) {
        return;
      }
      var treasureSpawnChance = globalUpgradeDefinitions.treasureChance.currentValue / 100;
      if (Math.random() > treasureSpawnChance) {
        return;
      }
    }
    var chestDefinition = treasureRegistry.targetDefinitions[randomInt(treasureRegistry.targetDefinitions.length)],
      isWestWall = 0.5 > Math.random(),
      hasWallPoint,
      wallPoint;
    hasWallPoint = false;
    for (var attemptCount = 0; !hasWallPoint && 10 > attemptCount;) {
      wallPoint = isWestWall ? treasureRegistry.pickWestWallPoint(room) : treasureRegistry.pickNorthWallPoint(room);
      if (!(hasWallPoint = canPlaceRoomObject(room, wallPoint))) {
        wallPoint = null;
      }
      attemptCount++;
    }
    if (wallPoint) {
      var chestLevelX = wallPoint.x * TILE_SIZE;
      var chestLevelY = wallPoint.y * TILE_SIZE;
      if (!chestDefinition.flushPlacement) {
        if (isWestWall) {
          chestLevelX += TILE_SIZE;
        } else {
          chestLevelY += TILE_SIZE;
        }
      }
      var chest = new TreasureChest(chestLevelX, chestLevelY, room, chestDefinition, isWestWall);
      treasureRegistry.targets.push(chest);
      treasureRegistry.targetByRoomId[chest.room.roomId] = chest;
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
  TreasureRegistry.prototype.pickNorthWallPoint = function (room) {
    var roomTileRow = room.tileRow;
    var tileColumn = room.tileColumn + randomInt(room.widthInTiles);
    setVector(this.spawnPointScratch, tileColumn, roomTileRow - 1);
    return this.spawnPointScratch;
  };
  TreasureRegistry.prototype.pickWestWallPoint = function (room) {
    var roomTileColumn = room.tileColumn;
    var tileRow = room.tileRow + randomInt(room.heightInTiles);
    setVector(this.spawnPointScratch, roomTileColumn - 1, tileRow);
    return this.spawnPointScratch;
  };
}
