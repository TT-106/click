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
/** @typedef {{yx: (room: DungeonRoom) => void, shiftLeft: (room: DungeonRoom) => void, gt: (room: DungeonRoom) => void, ru: () => boolean, uu: () => boolean, to: (room: DungeonRoom, entrance: boolean) => DungeonStairs, dl: (doors: unknown[], column: number, row: number) => boolean}} LayoutMethods */
export function DungeonLayoutGenerator(a, b, c, d, f) {
  this.seededRandom = d;
  this.fl = a;
  this.Nj = b;
  this.tileGrid = c;
  this.Aj = f;
  this.iB = ROOM_SPACING;
  this.Ow = MIN_ROOM_DIMENSION;
  this.xA = MAX_ROOM_SIZE;
  this.wA = 15;
  this.DA = 8;
  this.roomList = [];
  this.hallwayList = [];
  this.tf = this.entranceDoor = null;
  this.Xp = this.Zo = 0;
}
export function placeHorizontalStairs(a, b, c) {
  var d = b.doorList,
    f = 0,
    g,
    h,
    l = b.tileRow - 1;
  h = b.tileColumn + randomIntFrom(a.seededRandom, b.widthInTiles);
  for (g = !a.dl(d, h, l); !g && 6 > f;) {
    f++;
    h = b.tileColumn + randomIntFrom(a.seededRandom, b.widthInTiles);
    g = !a.dl(d, h, l);
  }
  if (!g) {
    return null;
  }
  a = new DungeonStairs(b);
  a.Fq = false;
  positionStairs(a, h, l);
  a.sq = c;
  return a;
}
export function placeVerticalStairs(a, b, c) {
  var d = b.doorList,
    f = 0,
    g,
    h = b.tileColumn - 1,
    l;
  l = b.tileRow + randomIntFrom(a.seededRandom, b.heightInTiles);
  for (g = !a.dl(d, h, l); !g && 6 > f;) {
    f++;
    l = b.tileRow + randomIntFrom(a.seededRandom, b.heightInTiles);
    g = !a.dl(d, h, l);
  }
  if (!g) {
    return null;
  }
  a = new DungeonStairs(b);
  a.Fq = true;
  positionStairs(a, h, l);
  a.sq = c;
  return a;
}
export function findNearestConnectedRoom(a, b, c, d) {
  c.push(b);
  var f = b.ro;
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
      f = a.iB;
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
  this.fl = a;
  this.Nj = b;
  this.tileGrid = c;
  this.iB = 5;
  this.Ow = 4;
  this.xA = 9;
  this.wA = 18;
  this.DA = 6;
  this.roomList = [];
  this.hallwayList = [];
  this.tf = this.entranceDoor = null;
  this.Xp = this.Zo = 0;
}
export function appendDungeonRoom(a, b, c, d, f, g) {
  b = new DungeonRoom(b, c, d, f, g);
  c = a.Xp++;
  b.roomId = c;
  a.roomList.push(b);
  b.Bq(a.tileGrid);
}
export function DungeonDecorationGenerator() {
  this.yh = new Vector2();
  this.seededRandom = new SeededRandom(3);
}
export function DungeonLevel() {
  this.Li = this.Ki = 0;
  this.widthInTiles = this.heightInTiles = 120;
  this.tileGrid = null;
  this.roomList = [];
  this.hallwayList = [];
  this.tf = this.entranceDoor = null;
  this.sp = 0;
}
export function generateDungeonLevel(a, b, c, d) {
  var f = game.level;
  f.sp = a;
  var seededRandom = new SeededRandom(a);
  f.roomList.length = 0;
  f.hallwayList.length = 0;
  f.entranceDoor = null;
  f.tf = null;
  if (f.tileGrid) {
    clearDungeonTiles(f);
  } else {
    f.Aw();
  }
  if (11 === b) {
    c = new CastleLayoutGenerator(f.widthInTiles, f.heightInTiles, f.tileGrid, seededRandom);
    c.rw();
  } else {
    for (a = 0, c = new DungeonLayoutGenerator(f.widthInTiles, f.heightInTiles, f.tileGrid, seededRandom, c); !c.rw();) {
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
  f.tf = c.tf;
  c = getDungeonTheme(b);
  for (b = 0; b < f.roomList.length; b++) {
    f.roomList[b].xx(c, f.tileGrid);
  }
  for (b = 0; b < f.hallwayList.length; b++) {
    f.hallwayList[b].xx(c, f.tileGrid);
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
      setVector(a.levelPosition, stairs.tq, stairs.uq);
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
      f.Jn = null;
      f.Yf = null;
      f.bt = null;
      f.floorType = EMPTY_TILE;
      f.tileEffect = null;
      f.li = 0;
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
  DungeonLayoutGenerator.prototype.rw = function () {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    this.Xp = this.Zo = 0;
    this.roomList.length = 0;
    this.hallwayList.length = 0;
    this.tf = this.entranceDoor = null;
    a: {
      var a = this.Ow + randomIntFrom(this.seededRandom, this.xA - this.Ow),
        b,
        c,
        d = this.DA,
        f = this.wA,
        g,
        h,
        l = 0;
      for (b = 0; b < a; b++) {
        g = d + randomIntFrom(this.seededRandom, f - d);
        h = d + randomIntFrom(this.seededRandom, f - d);
        c = new DungeonRoom(1 + randomIntFrom(this.seededRandom, this.fl - g - 1), 1 + randomIntFrom(this.seededRandom, this.Nj - h - 1), g, h, 0);
        for (l = 0; roomOverlapsExisting(this, c);) {
          var n = c,
            p = 1 + randomIntFrom(this.seededRandom, this.fl - g - 1),
            s = 1 + randomIntFrom(this.seededRandom, this.Nj - h - 1);
          n.tileColumn = p;
          n.tileRow = s;
          l++;
          if (15 < l) {
            break a;
          }
        }
        g = this.Xp++;
        c.roomId = g;
        this.roomList.push(c);
        g = c;
        methods.yx(g);
        h = undefined;
        for (h = 0; 3 > h; h++) {
          if (0.5 > this.seededRandom.random()) {
            methods.shiftLeft(g);
            methods.gt(g);
          } else {
            methods.gt(g);
            methods.shiftLeft(g);
          }
        }
        /** @type {{Bq: (grid: unknown) => void}} */ (/** @type {unknown} */ (c)).Bq(this.tileGrid);
      }
    }
    return methods.ru() ? methods.uu() ? true : (console.log("failed to create stairs."), false) : false;
  };
  DungeonLayoutGenerator.prototype.ru = function () {
    var a,
      b,
      c,
      d = [],
      f,
      g,
      h = new HallwayPathfinder(this.fl, this.Nj, this.tileGrid);
    for (a = 1; a < this.roomList.length; a++) {
      b = this.roomList[a];
      d.length = 0;
      c = findNearestConnectedRoom(this, this.roomList[a - 1], d, b);
      g = Date.now();
      f = findHallwayPath(h, b, c);
      if (!f) {
        return a = Date.now(), console.log("Failed to generate hallway in " + (a - g) + " millis"), false;
      }
      g = this.Zo++;
      f.hallwayId = g;
      this.hallwayList.push(f);
      f.Bq(this.tileGrid);
      c.ro.push(b);
      b.ro.push(c);
    }
    return true;
  };
  DungeonLayoutGenerator.prototype.uu = function () {
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
    const secondEntrance = isLastLevel ? !this.Aj : this.Aj;
    this.entranceDoor = methods.to(a, !this.Aj);
    this.tf = methods.to(b, secondEntrance);
    return null != this.entranceDoor && null != this.tf;
  };
  DungeonLayoutGenerator.prototype.to = function (a, b) {
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
  DungeonLayoutGenerator.prototype.dl = function (a, b, c) {
    var d;
    for (d = 0; d < a.length; d++) {
      if (1 >= Math.abs(a[d].wj - b) && 1 >= Math.abs(a[d].xj - c)) {
        return true;
      }
    }
    return false;
  };
  DungeonLayoutGenerator.prototype.yx = function (a) {
    var b, c;
    for (b = true; b;) {
      b = a.tileColumn;
      c = a.tileRow;
      if (1 === b && 1 === c) {
        break;
      }
      a.yx();
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
  DungeonLayoutGenerator.prototype.gt = function (a) {
    var b, c;
    for (b = true; b;) {
      b = a.tileColumn;
      c = a.tileRow;
      if (1 === c) {
        break;
      }
      a.gt();
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
  CastleLayoutGenerator.prototype.rw = function () {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    this.Xp = this.Zo = 0;
    this.roomList.length = 0;
    this.hallwayList.length = 0;
    this.tf = this.entranceDoor = null;
    appendDungeonRoom(this, 1, 1, 15, 15, 1);
    appendDungeonRoom(this, 51, 1, 15, 15, 1);
    appendDungeonRoom(this, 56, 31, 5, 5, 3);
    appendDungeonRoom(this, 51, 46, 15, 15, 1);
    appendDungeonRoom(this, 1, 46, 15, 15, 1);
    appendDungeonRoom(this, 1, 69, 15, 15, 2);
    appendDungeonRoom(this, 27, 74, 5, 5, 3);
    methods.ru();
    methods.uu();
  };
  CastleLayoutGenerator.prototype.ru = function () {
    var a,
      b,
      c,
      d,
      f = new HallwayPathfinder(this.fl, this.Nj, this.tileGrid);
    for (a = 1; a < this.roomList.length; a++) {
      if (b = this.roomList[a - 1], c = this.roomList[a], d = findHallwayPath(f, b, c)) {
        var g = this.Zo++;
        d.hallwayId = g;
        this.hallwayList.push(d);
        d.Bq(this.tileGrid);
        c.ro.push(b);
        b.ro.push(c);
      } else {
        console.log("failed to generate hallway. bummer.");
      }
    }
  };
  CastleLayoutGenerator.prototype.uu = function () {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    var a = this.roomList[this.roomList.length - 1];
    this.entranceDoor = methods.to(this.roomList[0], false);
    this.tf = methods.to(a, false);
  };
  CastleLayoutGenerator.prototype.to = function (a, b) {
    const methods = /** @type {LayoutMethods} */ (/** @type {unknown} */ (this));
    var c = new DungeonStairs(a),
      d = a.doorList,
      f,
      g;
    if (0.5 > Math.random()) {
      f = a.tileColumn - 1;
      for (g = a.tileRow + randomIntFrom(this.seededRandom, a.heightInTiles); methods.dl(d, f, g);) {
        g = a.tileRow + randomIntFrom(this.seededRandom, a.heightInTiles);
      }
      c.Fq = true;
    } else {
      g = a.tileRow - 1;
      for (f = a.tileColumn + randomIntFrom(this.seededRandom, a.widthInTiles); methods.dl(d, f, g);) {
        f = a.tileColumn + randomIntFrom(this.seededRandom, a.widthInTiles);
      }
      c.Fq = false;
    }
    positionStairs(c, f, g);
    c.sq = b;
    return a.stairs = c;
  };
  CastleLayoutGenerator.prototype.dl = function (a, b, c) {
    var d;
    for (d = 0; d < a.length; d++) {
      if (1 >= Math.abs(a[d].wj - b) && 1 >= Math.abs(a[d].xj - c)) {
        return true;
      }
    }
    return false;
  };
  DungeonDecorationGenerator.prototype.Xw = function (a) {
    var b = a.tileColumn,
      c = a.tileRow - 1;
    a = b + 1 + randomIntFrom(this.seededRandom, b + a.widthInTiles - 1 - b - 2);
    setVector(this.yh, a, c);
    return this.yh;
  };
  DungeonDecorationGenerator.prototype.Zw = function (a) {
    var b = a.tileColumn - 1,
      c = a.tileRow;
    a = c + 1 + randomIntFrom(this.seededRandom, c + a.heightInTiles - 1 - c - 2);
    setVector(this.yh, b, a);
    return this.yh;
  };
  DungeonLevel.prototype.Aw = function () {
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
  DungeonLevel.prototype.Ai = function (a) {
    return a / game.tileSize | 0;
  };
  DungeonLevel.prototype.Bi = function (a) {
    return a / game.tileSize | 0;
  };
}
