/** 地牢、城堡楼层生成和装饰。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { MAX_ROOM_SIZE, MIN_ROOM_DIMENSION, ROOM_SPACING } from "../content/balance.js";
import { SeededRandom, Vector2, randomIntFrom, setVector } from "../core/math.js";
import { DungeonRoom, DungeonStairs, DungeonTile, EMPTY_TILE, positionStairs, revealRoom } from "./rooms.js";
import { HallwayPathfinder, findHallwayPath } from "./pathfinding.js";
import { game } from "../runtime/game.js";
import { getDungeonTheme } from "./regions.js";
import { clearItemDrops } from "../loot/items.js";
import { clearScrollTargets } from "../combat/scrolls.js";
import { clearMonsters, getAllies, populateEncounter, resetEncounter } from "../combat/encounters.js";
import { clearVisualEffects } from "../rendering/sprites.js";
import { IDLE_ACTION } from "../ai/targeting.js";
import { clearMovementTarget } from "../characters/movement.js";
import { spawnRoomTreasure } from "../loot/treasure.js";
/** @typedef {{generate: () => boolean, moveUpLeft: (room: DungeonRoom) => void, shiftLeft: (room: DungeonRoom) => void, shiftUp: (room: DungeonRoom) => void, connectRooms: () => boolean, placeStairs: () => boolean, createStairs: (room: DungeonRoom, entrance: boolean) => DungeonStairs, canPlaceDoorAt: (doors: unknown[], column: number, row: number) => boolean}} LayoutMethods */
export function DungeonLayoutGenerator(widthInTiles, heightInTiles, tileGrid, seededRandom, hasSecondEntrance) {
  this.seededRandom = seededRandom;
  this.widthInTiles = widthInTiles;
  this.heightInTiles = heightInTiles;
  this.tileGrid = tileGrid;
  this.hasSecondEntrance = hasSecondEntrance;
  this.roomSpacing = ROOM_SPACING;
  this.minRoomCount = MIN_ROOM_DIMENSION;
  this.maxRoomCount = MAX_ROOM_SIZE;
  this.maxRoomDimension = 15;
  this.minRoomDimension = 8;
  this.roomList = [];
  this.hallwayList = [];
  this.exitDoor = this.entranceDoor = null;
  this.nextRoomId = this.nextHallwayId = 0;
}
export function placeHorizontalStairs(generator, room, showsStairs) {
  var doorList = room.doorList,
    attemptCount = 0,
    doorAvailable,
    stairsColumn,
    stairsRow = room.tileRow - 1;
  stairsColumn = room.tileColumn + randomIntFrom(generator.seededRandom, room.widthInTiles);
  for (doorAvailable = !generator.canPlaceDoorAt(doorList, stairsColumn, stairsRow); !doorAvailable && 6 > attemptCount;) {
    attemptCount++;
    stairsColumn = room.tileColumn + randomIntFrom(generator.seededRandom, room.widthInTiles);
    doorAvailable = !generator.canPlaceDoorAt(doorList, stairsColumn, stairsRow);
  }
  if (!doorAvailable) {
    return null;
  }
  var stairs = new DungeonStairs(room);
  stairs.isVerticalStairs = false;
  positionStairs(stairs, stairsColumn, stairsRow);
  stairs.showsStairs = showsStairs;
  return stairs;
}
export function placeVerticalStairs(generator, room, showsStairs) {
  var doorList = room.doorList,
    attemptCount = 0,
    doorAvailable,
    stairsColumn = room.tileColumn - 1,
    stairsRow;
  stairsRow = room.tileRow + randomIntFrom(generator.seededRandom, room.heightInTiles);
  for (doorAvailable = !generator.canPlaceDoorAt(doorList, stairsColumn, stairsRow); !doorAvailable && 6 > attemptCount;) {
    attemptCount++;
    stairsRow = room.tileRow + randomIntFrom(generator.seededRandom, room.heightInTiles);
    doorAvailable = !generator.canPlaceDoorAt(doorList, stairsColumn, stairsRow);
  }
  if (!doorAvailable) {
    return null;
  }
  var stairs = new DungeonStairs(room);
  stairs.isVerticalStairs = true;
  positionStairs(stairs, stairsColumn, stairsRow);
  stairs.showsStairs = showsStairs;
  return stairs;
}
export function findNearestConnectedRoom(generator, room, visitedRooms, targetRoom) {
  visitedRooms.push(room);
  var connectedRooms = room.connectedRooms;
  if (0 === connectedRooms.length) {
    return room;
  }
  var bestDistance = room.squaredDistanceToRoom(targetRoom),
    candidateRoom,
    candidateDistance,
    connectedIndex;
  for (connectedIndex = 0; connectedIndex < connectedRooms.length; connectedIndex++) {
    candidateRoom = connectedRooms[connectedIndex];
    if (!(0 <= visitedRooms.indexOf(candidateRoom) || candidateRoom === targetRoom)) {
      candidateRoom = findNearestConnectedRoom(generator, candidateRoom, visitedRooms, targetRoom);
      candidateDistance = candidateRoom.squaredDistanceToRoom(targetRoom);
      if (candidateDistance < bestDistance) {
        bestDistance = candidateDistance;
        room = candidateRoom;
      }
    }
  }
  return room;
}
export function roomOverlapsExisting(generator, room) {
  var roomIndex, existingRoom;
  for (roomIndex = 0; roomIndex < generator.roomList.length; roomIndex++) {
    existingRoom = generator.roomList[roomIndex];
    var overlaps;
    if (overlaps = room !== existingRoom) {
      var spacing = generator.roomSpacing;
      overlaps = !(room.tileColumn + room.widthInTiles + spacing < existingRoom.tileColumn || room.tileColumn > existingRoom.tileColumn + existingRoom.widthInTiles + spacing || room.tileRow + room.heightInTiles + spacing < existingRoom.tileRow || room.tileRow > existingRoom.tileRow + existingRoom.heightInTiles + spacing);
    }
    if (overlaps) {
      return true;
    }
  }
  return false;
}
export function CastleLayoutGenerator(widthInTiles, heightInTiles, tileGrid, seededRandom) {
  this.seededRandom = seededRandom;
  this.widthInTiles = widthInTiles;
  this.heightInTiles = heightInTiles;
  this.tileGrid = tileGrid;
  this.roomSpacing = 5;
  this.minRoomCount = 4;
  this.maxRoomCount = 9;
  this.maxRoomDimension = 18;
  this.minRoomDimension = 6;
  this.roomList = [];
  this.hallwayList = [];
  this.exitDoor = this.entranceDoor = null;
  this.nextRoomId = this.nextHallwayId = 0;
}
export function appendDungeonRoom(generator, tileColumn, tileRow, widthInTiles, heightInTiles, encounterType) {
  var room = new DungeonRoom(tileColumn, tileRow, widthInTiles, heightInTiles, encounterType);
  var roomId = generator.nextRoomId++;
  room.roomId = roomId;
  generator.roomList.push(room);
  (/** @type {{paintTiles: (grid: unknown) => void}} */ (/** @type {unknown} */ (room))).paintTiles(generator.tileGrid);
}
export function DungeonDecorationGenerator() {
  this.spawnPointScratch = new Vector2();
  this.seededRandom = new SeededRandom(3);
}
export function DungeonLevel() {
  this.centerY = this.centerX = 0;
  this.widthInTiles = this.heightInTiles = 120;
  this.tileGrid = null;
  this.roomList = [];
  this.hallwayList = [];
  this.exitDoor = this.entranceDoor = null;
  this.levelSeed = 0;
}
export function generateDungeonLevel(levelSeed, dungeonTypeId, hasSecondEntrance, placeParty) {
  var level = game.level;
  level.levelSeed = levelSeed;
  var seededRandom = new SeededRandom(levelSeed);
  level.roomList.length = 0;
  level.hallwayList.length = 0;
  level.entranceDoor = null;
  level.exitDoor = null;
  if (level.tileGrid) {
    clearDungeonTiles(level);
  } else {
    level.createTileGrid();
  }
  var layoutGenerator;
  if (11 === dungeonTypeId) {
    layoutGenerator = new CastleLayoutGenerator(level.widthInTiles, level.heightInTiles, level.tileGrid, seededRandom);
    (/** @type {LayoutMethods} */ (/** @type {unknown} */ (layoutGenerator))).generate();
  } else {
    for (var attempt = 0, layoutGeneratorCandidate = new DungeonLayoutGenerator(level.widthInTiles, level.heightInTiles, level.tileGrid, seededRandom, hasSecondEntrance); !(/** @type {LayoutMethods} */ (/** @type {unknown} */ (layoutGeneratorCandidate))).generate();) {
      console.log("Level generation failed for seed: " + level.levelSeed + " attempt: " + attempt);
      attempt++;
      level.levelSeed++;
      new SeededRandom(level.levelSeed);
      clearDungeonTiles(level);
    }
    layoutGenerator = layoutGeneratorCandidate;
  }
  level.roomList = layoutGenerator.roomList;
  level.hallwayList = layoutGenerator.hallwayList;
  level.entranceDoor = layoutGenerator.entranceDoor;
  level.exitDoor = layoutGenerator.exitDoor;
  var theme = getDungeonTheme(dungeonTypeId);
  var areaIndex;
  for (areaIndex = 0; areaIndex < level.roomList.length; areaIndex++) {
    level.roomList[areaIndex].applyTheme(theme, level.tileGrid);
  }
  for (areaIndex = 0; areaIndex < level.hallwayList.length; areaIndex++) {
    level.hallwayList[areaIndex].applyTheme(theme, level.tileGrid);
  }
  clearItemDrops(game.itemDrops);
  var goldDrops = game.goldDrops;
  if (0 < goldDrops.drops.length) {
    goldDrops.drops.length = 0;
  }
  var scrollDrops = game.scrollDrops;
  if (0 < scrollDrops.drops.length) {
    scrollDrops.drops.length = 0;
  }
  var potionDrops = game.potionDrops;
  if (0 < potionDrops.drops.length) {
    potionDrops.drops.length = 0;
  }
  var treasure = game.treasure;
  if (0 < treasure.targets.length) {
    treasure.targets.length = 0;
    treasure.targetByRoomId = {};
  }
  clearScrollTargets();
  resetEncounter();
  clearVisualEffects(game.effects);
  clearMonsters();
  if (placeParty) {
    revealRoom(level.entranceDoor.leadsTo);
    var entranceRoom = level.entranceDoor.leadsTo;
    var allies = getAllies();
    for (var allyIndex = 0; allyIndex < allies.length; allyIndex++) {
      var ally = allies[allyIndex],
        allyPosition = ally.position;
      allyPosition.currentHallway = null;
      allyPosition.room = entranceRoom;
      ally.actionType = IDLE_ACTION;
      clearMovementTarget(allyPosition);
      var stairs = entranceRoom.stairs;
      setVector(allyPosition.levelPosition, stairs.pixelColumn, stairs.pixelRow);
    }
    populateEncounter(entranceRoom);
    spawnRoomTreasure(level.entranceDoor.leadsTo);
  }
}
export function clearDungeonTiles(level) {
  var tileRowIndex, tileColumnList, tileColumnIndex;
  for (tileColumnIndex = 0; tileColumnIndex < level.widthInTiles; tileColumnIndex++) {
    for (tileColumnList = level.tileGrid[tileColumnIndex], tileRowIndex = 0; tileRowIndex < level.heightInTiles; tileRowIndex++) {
      var tile = tileColumnList[tileRowIndex];
      tile.backgroundSprite = null;
      tile.decorationSprite = null;
      tile.cachedBackgroundSprite = null;
      tile.floorType = EMPTY_TILE;
      tile.tileEffect = null;
      tile.remainingEffectDamage = 0;
    }
  }
}
export function findRoom(roomId) {
  var level = game.level,
    roomIndex;
  for (roomIndex = 0; roomIndex < level.roomList.length; roomIndex++) {
    if (level.roomList[roomIndex].roomId === roomId) {
      return level.roomList[roomIndex];
    }
  }
  return null;
}
export function initializeWorldGeneration() {
  DungeonLayoutGenerator.prototype.generate = function () {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    this.nextRoomId = this.nextHallwayId = 0;
    this.roomList.length = 0;
    this.hallwayList.length = 0;
    this.exitDoor = this.entranceDoor = null;
    roomPlacement: {
      var roomTargetCount = this.minRoomCount + randomIntFrom(this.seededRandom, this.maxRoomCount - this.minRoomCount),
        roomIndex,
        room,
        minDimension = this.minRoomDimension,
        maxDimension = this.maxRoomDimension,
        roomWidth,
        roomHeight,
        placementAttempts = 0;
      for (roomIndex = 0; roomIndex < roomTargetCount; roomIndex++) {
        roomWidth = minDimension + randomIntFrom(this.seededRandom, maxDimension - minDimension);
        roomHeight = minDimension + randomIntFrom(this.seededRandom, maxDimension - minDimension);
        room = new DungeonRoom(1 + randomIntFrom(this.seededRandom, this.widthInTiles - roomWidth - 1), 1 + randomIntFrom(this.seededRandom, this.heightInTiles - roomHeight - 1), roomWidth, roomHeight, 0);
        for (placementAttempts = 0; roomOverlapsExisting(this, room);) {
          var retryRoom = room,
            retryColumn = 1 + randomIntFrom(this.seededRandom, this.widthInTiles - roomWidth - 1),
            retryRow = 1 + randomIntFrom(this.seededRandom, this.heightInTiles - roomHeight - 1);
          retryRoom.tileColumn = retryColumn;
          retryRoom.tileRow = retryRow;
          placementAttempts++;
          if (15 < placementAttempts) {
            break roomPlacement;
          }
        }
        var roomId = this.nextRoomId++;
        room.roomId = roomId;
        this.roomList.push(room);
        var placedRoom = room;
        methods.moveUpLeft(placedRoom);
        var jitterRound;
        for (jitterRound = 0; 3 > jitterRound; jitterRound++) {
          if (0.5 > this.seededRandom.random()) {
            methods.shiftLeft(placedRoom);
            methods.shiftUp(placedRoom);
          } else {
            methods.shiftUp(placedRoom);
            methods.shiftLeft(placedRoom);
          }
        }
        /** @type {{paintTiles: (grid: unknown) => void}} */ (/** @type {unknown} */ (room)).paintTiles(this.tileGrid);
      }
    }
    return methods.connectRooms() ? methods.placeStairs() ? true : (console.log("failed to create stairs."), false) : false;
  };
  DungeonLayoutGenerator.prototype.connectRooms = function () {
    var roomIndex,
      room,
      connectedRoom,
      visitedRooms = [],
      hallway,
      hallwayId,
      pathfinder = new HallwayPathfinder(this.widthInTiles, this.heightInTiles, this.tileGrid);
    for (roomIndex = 1; roomIndex < this.roomList.length; roomIndex++) {
      room = this.roomList[roomIndex];
      visitedRooms.length = 0;
      connectedRoom = findNearestConnectedRoom(this, this.roomList[roomIndex - 1], visitedRooms, room);
      var startTime = Date.now();
      hallway = findHallwayPath(pathfinder, room, connectedRoom);
      if (!hallway) {
        var endTime = Date.now();
        console.log("Failed to generate hallway in " + (endTime - startTime) + " millis");
        return false;
      }
      hallwayId = this.nextHallwayId++;
      hallway.hallwayId = hallwayId;
      this.hallwayList.push(hallway);
      hallway.paintTiles(this.tileGrid);
      connectedRoom.connectedRooms.push(room);
      room.connectedRooms.push(connectedRoom);
    }
    return true;
  };
  DungeonLayoutGenerator.prototype.placeStairs = function () {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    var entranceRoom = this.roomList[randomIntFrom(this.seededRandom, this.roomList.length)],
      exitRoom = this.roomList[randomIntFrom(this.seededRandom, this.roomList.length)];
    for (;exitRoom === entranceRoom;) {
      exitRoom = this.roomList[randomIntFrom(this.seededRandom, this.roomList.length)];
    }
    var isLastLevel = false;
    if (game.currentDungeon) {
      const currentDungeon = game.currentDungeon;
      isLastLevel = currentDungeon.currentLevelIndex >= currentDungeon.levelCount - 1;
    } else {
      if (game.currentCastle) {
        isLastLevel = true;
      }
    }
    const secondEntrance = isLastLevel ? !this.hasSecondEntrance : this.hasSecondEntrance;
    this.entranceDoor = methods.createStairs(entranceRoom, !this.hasSecondEntrance);
    this.exitDoor = methods.createStairs(exitRoom, secondEntrance);
    return null != this.entranceDoor && null != this.exitDoor;
  };
  DungeonLayoutGenerator.prototype.createStairs = function (room, showsStairs) {
    var stairs;
    if (0.5 > this.seededRandom.random()) {
      if (!(stairs = placeHorizontalStairs(this, room, showsStairs))) {
        stairs = placeVerticalStairs(this, room, showsStairs);
      }
    } else {
      if (!(stairs = placeVerticalStairs(this, room, showsStairs))) {
        stairs = placeHorizontalStairs(this, room, showsStairs);
      }
    }
    return stairs ? room.stairs = stairs : null;
  };
  DungeonLayoutGenerator.prototype.canPlaceDoorAt = function (doorList, column, row) {
    var doorIndex;
    for (doorIndex = 0; doorIndex < doorList.length; doorIndex++) {
      if (1 >= Math.abs(doorList[doorIndex].tileColumn - column) && 1 >= Math.abs(doorList[doorIndex].tileRow - row)) {
        return true;
      }
    }
    return false;
  };
  DungeonLayoutGenerator.prototype.moveUpLeft = function (room) {
    var moved, previousColumn, previousRow;
    for (moved = true; moved;) {
      previousColumn = room.tileColumn;
      previousRow = room.tileRow;
      if (1 === previousColumn && 1 === previousRow) {
        break;
      }
      room.moveUpLeft();
      if (roomOverlapsExisting(this, room)) {
        var restoredRoom = room;
        restoredRoom.tileColumn = previousColumn;
        restoredRoom.tileRow = previousRow;
        moved = false;
      } else {
        moved = true;
      }
    }
  };
  DungeonLayoutGenerator.prototype.shiftLeft = function (room) {
    var moved, previousColumn, previousRow;
    for (moved = true; moved;) {
      previousColumn = room.tileColumn;
      previousRow = room.tileRow;
      if (1 === previousColumn) {
        break;
      }
      room.shiftLeft();
      if (roomOverlapsExisting(this, room)) {
        var restoredRoom = room;
        restoredRoom.tileColumn = previousColumn;
        restoredRoom.tileRow = previousRow;
        moved = false;
      } else {
        moved = true;
      }
    }
  };
  DungeonLayoutGenerator.prototype.shiftUp = function (room) {
    var moved, previousColumn, previousRow;
    for (moved = true; moved;) {
      previousColumn = room.tileColumn;
      previousRow = room.tileRow;
      if (1 === previousRow) {
        break;
      }
      room.shiftUp();
      if (roomOverlapsExisting(this, room)) {
        var restoredRoom = room;
        restoredRoom.tileColumn = previousColumn;
        restoredRoom.tileRow = previousRow;
        moved = false;
      } else {
        moved = true;
      }
    }
  };
  CastleLayoutGenerator.prototype.generate = function () {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    this.nextRoomId = this.nextHallwayId = 0;
    this.roomList.length = 0;
    this.hallwayList.length = 0;
    this.exitDoor = this.entranceDoor = null;
    appendDungeonRoom(this, 1, 1, 15, 15, 1);
    appendDungeonRoom(this, 51, 1, 15, 15, 1);
    appendDungeonRoom(this, 56, 31, 5, 5, 3);
    appendDungeonRoom(this, 51, 46, 15, 15, 1);
    appendDungeonRoom(this, 1, 46, 15, 15, 1);
    appendDungeonRoom(this, 1, 69, 15, 15, 2);
    appendDungeonRoom(this, 27, 74, 5, 5, 3);
    methods.connectRooms();
    methods.placeStairs();
  };
  CastleLayoutGenerator.prototype.connectRooms = function () {
    var roomIndex,
      previousRoom,
      room,
      hallway,
      pathfinder = new HallwayPathfinder(this.widthInTiles, this.heightInTiles, this.tileGrid);
    for (roomIndex = 1; roomIndex < this.roomList.length; roomIndex++) {
      if (previousRoom = this.roomList[roomIndex - 1], room = this.roomList[roomIndex], hallway = findHallwayPath(pathfinder, previousRoom, room)) {
        var hallwayId = this.nextHallwayId++;
        hallway.hallwayId = hallwayId;
        this.hallwayList.push(hallway);
        hallway.paintTiles(this.tileGrid);
        room.connectedRooms.push(previousRoom);
        previousRoom.connectedRooms.push(room);
      } else {
        console.log("failed to generate hallway. bummer.");
      }
    }
  };
  CastleLayoutGenerator.prototype.placeStairs = function () {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    var lastRoom = this.roomList[this.roomList.length - 1];
    this.entranceDoor = methods.createStairs(this.roomList[0], false);
    this.exitDoor = methods.createStairs(lastRoom, false);
  };
  CastleLayoutGenerator.prototype.createStairs = function (room, showsStairs) {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    var stairs = new DungeonStairs(room),
      doorList = room.doorList,
      stairsColumn,
      stairsRow;
    if (0.5 > Math.random()) {
      stairsColumn = room.tileColumn - 1;
      for (stairsRow = room.tileRow + randomIntFrom(this.seededRandom, room.heightInTiles); methods.canPlaceDoorAt(doorList, stairsColumn, stairsRow);) {
        stairsRow = room.tileRow + randomIntFrom(this.seededRandom, room.heightInTiles);
      }
      stairs.isVerticalStairs = true;
    } else {
      stairsRow = room.tileRow - 1;
      for (stairsColumn = room.tileColumn + randomIntFrom(this.seededRandom, room.widthInTiles); methods.canPlaceDoorAt(doorList, stairsColumn, stairsRow);) {
        stairsColumn = room.tileColumn + randomIntFrom(this.seededRandom, room.widthInTiles);
      }
      stairs.isVerticalStairs = false;
    }
    positionStairs(stairs, stairsColumn, stairsRow);
    stairs.showsStairs = showsStairs;
    return room.stairs = stairs;
  };
  CastleLayoutGenerator.prototype.canPlaceDoorAt = function (doorList, column, row) {
    var doorIndex;
    for (doorIndex = 0; doorIndex < doorList.length; doorIndex++) {
      if (1 >= Math.abs(doorList[doorIndex].tileColumn - column) && 1 >= Math.abs(doorList[doorIndex].tileRow - row)) {
        return true;
      }
    }
    return false;
  };
  DungeonDecorationGenerator.prototype.pickNorthWallPoint = function (room) {
    var roomColumn = room.tileColumn,
      wallRow = room.tileRow - 1;
    var wallColumn = roomColumn + 1 + randomIntFrom(this.seededRandom, roomColumn + room.widthInTiles - 1 - roomColumn - 2);
    setVector(this.spawnPointScratch, wallColumn, wallRow);
    return this.spawnPointScratch;
  };
  DungeonDecorationGenerator.prototype.pickWestWallPoint = function (room) {
    var wallColumn = room.tileColumn - 1,
      roomRow = room.tileRow;
    var wallRow = roomRow + 1 + randomIntFrom(this.seededRandom, roomRow + room.heightInTiles - 1 - roomRow - 2);
    setVector(this.spawnPointScratch, wallColumn, wallRow);
    return this.spawnPointScratch;
  };
  DungeonLevel.prototype.createTileGrid = function () {
    var tileRowIndex, tileColumnIndex, tileColumnList, columnPixel, rowPixel;
    this.tileGrid = [];
    for (tileColumnIndex = 0; tileColumnIndex < this.widthInTiles; tileColumnIndex++) {
      tileColumnList = [];
      columnPixel = tileColumnIndex * game.tileSize;
      for (tileRowIndex = 0; tileRowIndex < this.heightInTiles; tileRowIndex++) {
        rowPixel = tileRowIndex * game.tileSize;
        tileColumnList.push(new DungeonTile(tileColumnIndex, tileRowIndex, columnPixel, rowPixel));
      }
      this.tileGrid.push(tileColumnList);
    }
  };
  DungeonLevel.prototype.getTileAt = function (tileColumn, tileRow) {
    return 0 > tileColumn || tileColumn >= this.widthInTiles || 0 > tileRow || tileRow >= this.heightInTiles ? null : this.tileGrid[tileColumn][tileRow];
  };
  DungeonLevel.prototype.pixelToTileColumn = function (pixel) {
    return pixel / game.tileSize | 0;
  };
  DungeonLevel.prototype.pixelToTileRow = function (pixel) {
    return pixel / game.tileSize | 0;
  };
}
