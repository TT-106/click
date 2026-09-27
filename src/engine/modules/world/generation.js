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
/** @typedef {{moveUpLeft: (room: DungeonRoom) => void, shiftLeft: (room: DungeonRoom) => void, shiftUp: (room: DungeonRoom) => void, connectRooms: () => boolean, placeStairs: () => boolean, createStairs: (room: DungeonRoom, entrance: boolean) => DungeonStairs, canPlaceDoorAt: (doors: unknown[], column: number, row: number) => boolean}} LayoutMethods */
export function DungeonLayoutGenerator(a, b, c, d, f) {
  this.seededRandom = d;
  this.widthInTiles = a;
  this.heightInTiles = b;
  this.tileGrid = c;
  this.hasSecondEntrance = f;
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
export function placeHorizontalStairs(a, b, c) {
  var d = b.doorList,
    f = 0,
    g,
    h,
    l = b.tileRow - 1;
  h = b.tileColumn + randomIntFrom(a.seededRandom, b.widthInTiles);
  for (g = !a.canPlaceDoorAt(d, h, l); !g && 6 > f;) {
    f++;
    h = b.tileColumn + randomIntFrom(a.seededRandom, b.widthInTiles);
    g = !a.canPlaceDoorAt(d, h, l);
  }
  if (!g) {
    return null;
  }
  a = new DungeonStairs(b);
  a.isVerticalStairs = false;
  positionStairs(a, h, l);
  a.showsStairs = c;
  return a;
}
export function placeVerticalStairs(a, b, c) {
  var d = b.doorList,
    f = 0,
    g,
    h = b.tileColumn - 1,
    l;
  l = b.tileRow + randomIntFrom(a.seededRandom, b.heightInTiles);
  for (g = !a.canPlaceDoorAt(d, h, l); !g && 6 > f;) {
    f++;
    l = b.tileRow + randomIntFrom(a.seededRandom, b.heightInTiles);
    g = !a.canPlaceDoorAt(d, h, l);
  }
  if (!g) {
    return null;
  }
  a = new DungeonStairs(b);
  a.isVerticalStairs = true;
  positionStairs(a, h, l);
  a.showsStairs = c;
  return a;
}
export function findNearestConnectedRoom(a, b, c, d) {
  c.push(b);
  var f = b.connectedRooms;
  if (0 === f.length) {
    return b;
  }
  var g = b.squaredDistanceToRoom(d),
    h,
    l,
    n;
  for (n = 0; n < f.length; n++) {
    h = f[n];
    if (!(0 <= c.indexOf(h) || h === d)) {
      h = findNearestConnectedRoom(a, h, c, d);
      l = h.squaredDistanceToRoom(d);
      if (l < g) {
        g = l;
        b = h;
      }
    }
  }
  return b;
}
export function roomOverlapsExisting(a, b) {
  var c, d;
  for (c = 0; c < a.roomList.length; c++) {
    d = a.roomList[c];
    var f;
    if (f = b !== d) {
      f = a.roomSpacing;
      f = !(b.tileColumn + b.widthInTiles + f < d.tileColumn || b.tileColumn > d.tileColumn + d.widthInTiles + f || b.tileRow + b.heightInTiles + f < d.tileRow || b.tileRow > d.tileRow + d.heightInTiles + f);
    }
    if (f) {
      return true;
    }
  }
  return false;
}
export function CastleLayoutGenerator(a, b, c, d) {
  this.seededRandom = d;
  this.widthInTiles = a;
  this.heightInTiles = b;
  this.tileGrid = c;
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
export function appendDungeonRoom(a, b, c, d, f, g) {
  b = new DungeonRoom(b, c, d, f, g);
  c = a.nextRoomId++;
  b.roomId = c;
  a.roomList.push(b);
  b.paintTiles(a.tileGrid);
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
  this.sp = 0;
}
export function generateDungeonLevel(a, b, c, d) {
  var f = game.level;
  f.sp = a;
  var seededRandom = new SeededRandom(a);
  f.roomList.length = 0;
  f.hallwayList.length = 0;
  f.entranceDoor = null;
  f.exitDoor = null;
  if (f.tileGrid) {
    clearDungeonTiles(f);
  } else {
    f.createTileGrid();
  }
  if (11 === b) {
    c = new CastleLayoutGenerator(f.widthInTiles, f.heightInTiles, f.tileGrid, seededRandom);
    c.generate();
  } else {
    for (a = 0, c = new DungeonLayoutGenerator(f.widthInTiles, f.heightInTiles, f.tileGrid, seededRandom, c); !c.generate();) {
      console.log("Level generation failed for seed: " + f.sp + " attempt: " + a);
      a++;
      f.sp++;
      new SeededRandom(f.sp);
      clearDungeonTiles(f);
    }
  }
  f.roomList = c.roomList;
  f.hallwayList = c.hallwayList;
  f.entranceDoor = c.entranceDoor;
  f.exitDoor = c.exitDoor;
  c = getDungeonTheme(b);
  for (b = 0; b < f.roomList.length; b++) {
    f.roomList[b].applyTheme(c, f.tileGrid);
  }
  for (b = 0; b < f.hallwayList.length; b++) {
    f.hallwayList[b].applyTheme(c, f.tileGrid);
  }
  clearItemDrops();
  b = game.goldDrops;
  if (0 < b.drops.length) {
    b.drops.length = 0;
  }
  b = game.scrollDrops;
  if (0 < b.drops.length) {
    b.drops.length = 0;
  }
  b = game.potionDrops;
  if (0 < b.drops.length) {
    b.drops.length = 0;
  }
  b = game.treasure;
  if (0 < b.targets.length) {
    b.targets.length = 0;
    b.targetByRoomId = {};
  }
  clearScrollTargets();
  resetEncounter();
  clearVisualEffects();
  clearMonsters();
  if (d) {
    revealRoom(f.entranceDoor.leadsTo);
    d = f.entranceDoor.leadsTo;
    c = getAllies();
    for (b = 0; b < c.length; b++) {
      var ally = c[b],
        h = d;
      a = ally.position;
      a.currentHallway = null;
      a.room = h;
      ally.actionType = IDLE_ACTION;
      clearMovementTarget(a);
      var stairs = h.stairs;
      setVector(a.levelPosition, stairs.pixelColumn, stairs.pixelRow);
    }
    populateEncounter(d);
    spawnRoomTreasure(f.entranceDoor.leadsTo);
  }
}
export function clearDungeonTiles(a) {
  var b, c, d;
  for (c = 0; c < a.widthInTiles; c++) {
    for (d = a.tileGrid[c], b = 0; b < a.heightInTiles; b++) {
      var f = d[b];
      f.backgroundSprite = null;
      f.decorationSprite = null;
      f.cachedBackgroundSprite = null;
      f.floorType = EMPTY_TILE;
      f.tileEffect = null;
      f.remainingEffectDamage = 0;
    }
  }
}
export function findRoom(a) {
  var b = game.level,
    c;
  for (c = 0; c < b.roomList.length; c++) {
    if (b.roomList[c].roomId === a) {
      return b.roomList[c];
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
    a: {
      var a = this.minRoomCount + randomIntFrom(this.seededRandom, this.maxRoomCount - this.minRoomCount),
        b,
        c,
        d = this.minRoomDimension,
        f = this.maxRoomDimension,
        g,
        h,
        l = 0;
      for (b = 0; b < a; b++) {
        g = d + randomIntFrom(this.seededRandom, f - d);
        h = d + randomIntFrom(this.seededRandom, f - d);
        c = new DungeonRoom(1 + randomIntFrom(this.seededRandom, this.widthInTiles - g - 1), 1 + randomIntFrom(this.seededRandom, this.heightInTiles - h - 1), g, h, 0);
        for (l = 0; roomOverlapsExisting(this, c);) {
          var n = c,
            p = 1 + randomIntFrom(this.seededRandom, this.widthInTiles - g - 1),
            s = 1 + randomIntFrom(this.seededRandom, this.heightInTiles - h - 1);
          n.tileColumn = p;
          n.tileRow = s;
          l++;
          if (15 < l) {
            break a;
          }
        }
        g = this.nextRoomId++;
        c.roomId = g;
        this.roomList.push(c);
        g = c;
        methods.moveUpLeft(g);
        h = undefined;
        for (h = 0; 3 > h; h++) {
          if (0.5 > this.seededRandom.random()) {
            methods.shiftLeft(g);
            methods.shiftUp(g);
          } else {
            methods.shiftUp(g);
            methods.shiftLeft(g);
          }
        }
        /** @type {{paintTiles: (grid: unknown) => void}} */ (/** @type {unknown} */ (c)).paintTiles(this.tileGrid);
      }
    }
    return methods.connectRooms() ? methods.placeStairs() ? true : (console.log("failed to create stairs."), false) : false;
  };
  DungeonLayoutGenerator.prototype.connectRooms = function () {
    var a,
      b,
      c,
      d = [],
      f,
      g,
      h = new HallwayPathfinder(this.widthInTiles, this.heightInTiles, this.tileGrid);
    for (a = 1; a < this.roomList.length; a++) {
      b = this.roomList[a];
      d.length = 0;
      c = findNearestConnectedRoom(this, this.roomList[a - 1], d, b);
      g = Date.now();
      f = findHallwayPath(h, b, c);
      if (!f) {
        return a = Date.now(), console.log("Failed to generate hallway in " + (a - g) + " millis"), false;
      }
      g = this.nextHallwayId++;
      f.hallwayId = g;
      this.hallwayList.push(f);
      f.paintTiles(this.tileGrid);
      c.connectedRooms.push(b);
      b.connectedRooms.push(c);
    }
    return true;
  };
  DungeonLayoutGenerator.prototype.placeStairs = function () {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    for (var a = this.roomList[randomIntFrom(this.seededRandom, this.roomList.length)], b = this.roomList[randomIntFrom(this.seededRandom, this.roomList.length)]; b === a;) {
      b = this.roomList[randomIntFrom(this.seededRandom, this.roomList.length)];
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
    this.entranceDoor = methods.createStairs(a, !this.hasSecondEntrance);
    this.exitDoor = methods.createStairs(b, secondEntrance);
    return null != this.entranceDoor && null != this.exitDoor;
  };
  DungeonLayoutGenerator.prototype.createStairs = function (a, b) {
    var c;
    if (0.5 > this.seededRandom.random()) {
      if (!(c = placeHorizontalStairs(this, a, b))) {
        c = placeVerticalStairs(this, a, b);
      }
    } else {
      if (!(c = placeVerticalStairs(this, a, b))) {
        c = placeHorizontalStairs(this, a, b);
      }
    }
    return c ? a.stairs = c : null;
  };
  DungeonLayoutGenerator.prototype.canPlaceDoorAt = function (a, b, c) {
    var d;
    for (d = 0; d < a.length; d++) {
      if (1 >= Math.abs(a[d].tileColumn - b) && 1 >= Math.abs(a[d].tileRow - c)) {
        return true;
      }
    }
    return false;
  };
  DungeonLayoutGenerator.prototype.moveUpLeft = function (a) {
    var b, c;
    for (b = true; b;) {
      b = a.tileColumn;
      c = a.tileRow;
      if (1 === b && 1 === c) {
        break;
      }
      a.moveUpLeft();
      if (roomOverlapsExisting(this, a)) {
        var d = a;
        d.tileColumn = b;
        d.tileRow = c;
        b = false;
      } else {
        b = true;
      }
    }
  };
  DungeonLayoutGenerator.prototype.shiftLeft = function (a) {
    var b, c;
    for (b = true; b;) {
      b = a.tileColumn;
      c = a.tileRow;
      if (1 === b) {
        break;
      }
      a.shiftLeft();
      if (roomOverlapsExisting(this, a)) {
        var d = a;
        d.tileColumn = b;
        d.tileRow = c;
        b = false;
      } else {
        b = true;
      }
    }
  };
  DungeonLayoutGenerator.prototype.shiftUp = function (a) {
    var b, c;
    for (b = true; b;) {
      b = a.tileColumn;
      c = a.tileRow;
      if (1 === c) {
        break;
      }
      a.shiftUp();
      if (roomOverlapsExisting(this, a)) {
        var d = a;
        d.tileColumn = b;
        d.tileRow = c;
        b = false;
      } else {
        b = true;
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
    var a,
      b,
      c,
      d,
      f = new HallwayPathfinder(this.widthInTiles, this.heightInTiles, this.tileGrid);
    for (a = 1; a < this.roomList.length; a++) {
      if (b = this.roomList[a - 1], c = this.roomList[a], d = findHallwayPath(f, b, c)) {
        var g = this.nextHallwayId++;
        d.hallwayId = g;
        this.hallwayList.push(d);
        d.paintTiles(this.tileGrid);
        c.connectedRooms.push(b);
        b.connectedRooms.push(c);
      } else {
        console.log("failed to generate hallway. bummer.");
      }
    }
  };
  CastleLayoutGenerator.prototype.placeStairs = function () {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    var a = this.roomList[this.roomList.length - 1];
    this.entranceDoor = methods.createStairs(this.roomList[0], false);
    this.exitDoor = methods.createStairs(a, false);
  };
  CastleLayoutGenerator.prototype.createStairs = function (a, b) {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    var c = new DungeonStairs(a),
      d = a.doorList,
      f,
      g;
    if (0.5 > Math.random()) {
      f = a.tileColumn - 1;
      for (g = a.tileRow + randomIntFrom(this.seededRandom, a.heightInTiles); methods.canPlaceDoorAt(d, f, g);) {
        g = a.tileRow + randomIntFrom(this.seededRandom, a.heightInTiles);
      }
      c.isVerticalStairs = true;
    } else {
      g = a.tileRow - 1;
      for (f = a.tileColumn + randomIntFrom(this.seededRandom, a.widthInTiles); methods.canPlaceDoorAt(d, f, g);) {
        f = a.tileColumn + randomIntFrom(this.seededRandom, a.widthInTiles);
      }
      c.isVerticalStairs = false;
    }
    positionStairs(c, f, g);
    c.showsStairs = b;
    return a.stairs = c;
  };
  CastleLayoutGenerator.prototype.canPlaceDoorAt = function (a, b, c) {
    var d;
    for (d = 0; d < a.length; d++) {
      if (1 >= Math.abs(a[d].tileColumn - b) && 1 >= Math.abs(a[d].tileRow - c)) {
        return true;
      }
    }
    return false;
  };
  DungeonDecorationGenerator.prototype.Xw = function (a) {
    var b = a.tileColumn,
      c = a.tileRow - 1;
    a = b + 1 + randomIntFrom(this.seededRandom, b + a.widthInTiles - 1 - b - 2);
    setVector(this.spawnPointScratch, a, c);
    return this.spawnPointScratch;
  };
  DungeonDecorationGenerator.prototype.Zw = function (a) {
    var b = a.tileColumn - 1,
      c = a.tileRow;
    a = c + 1 + randomIntFrom(this.seededRandom, c + a.heightInTiles - 1 - c - 2);
    setVector(this.spawnPointScratch, b, a);
    return this.spawnPointScratch;
  };
  DungeonLevel.prototype.createTileGrid = function () {
    var a, b, c, d, f;
    this.tileGrid = [];
    for (b = 0; b < this.widthInTiles; b++) {
      c = [];
      d = b * game.tileSize;
      for (a = 0; a < this.heightInTiles; a++) {
        f = a * game.tileSize;
        c.push(new DungeonTile(b, a, d, f));
      }
      this.tileGrid.push(c);
    }
  };
  DungeonLevel.prototype.getTileAt = function (a, b) {
    return 0 > a || a >= this.widthInTiles || 0 > b || b >= this.heightInTiles ? null : this.tileGrid[a][b];
  };
  DungeonLevel.prototype.pixelToTileColumn = function (a) {
    return a / game.tileSize | 0;
  };
  DungeonLevel.prototype.pixelToTileRow = function (a) {
    return a / game.tileSize | 0;
  };
}
