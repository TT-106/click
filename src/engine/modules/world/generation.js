// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
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
  this.gd = [];
  this.tf = this.Ce = null;
  this.Xp = this.Zo = 0;
}
export function placeHorizontalStairs(a, b, c) {
  var d = b.Nc,
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
  var d = b.Nc,
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
  var g = b.Ud(d),
    h,
    l,
    n;
  for (n = 0; n < f.length; n++) {
    h = f[n];
    if (!(0 <= c.indexOf(h) || h === d)) {
      h = findNearestConnectedRoom(a, h, c, d);
      l = h.Ud(d);
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
  this.gd = [];
  this.tf = this.Ce = null;
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
  this.rc = this.sc = 120;
  this.tileGrid = null;
  this.roomList = [];
  this.gd = [];
  this.tf = this.Ce = null;
  this.sp = 0;
}
export function generateDungeonLevel(a, b, c, d) {
  var f = game.level;
  f.sp = a;
  var g = new SeededRandom(a);
  f.roomList.length = 0;
  f.gd.length = 0;
  f.Ce = null;
  f.tf = null;
  if (f.tileGrid) {
    clearDungeonTiles(f);
  } else {
    f.Aw();
  }
  if (11 === b) {
    c = new CastleLayoutGenerator(f.rc, f.sc, f.tileGrid, g);
    c.rw();
  } else {
    for (a = 0, c = new DungeonLayoutGenerator(f.rc, f.sc, f.tileGrid, g, c); !c.rw();) {
      console.log("Level generation failed for seed: " + f.sp + " attempt: " + a);
      a++;
      f.sp++;
      new SeededRandom(f.sp);
      clearDungeonTiles(f);
    }
  }
  f.roomList = c.roomList;
  f.gd = c.gd;
  f.Ce = c.Ce;
  f.tf = c.tf;
  c = getDungeonTheme(b);
  for (b = 0; b < f.roomList.length; b++) {
    f.roomList[b].xx(c, f.tileGrid);
  }
  for (b = 0; b < f.gd.length; b++) {
    f.gd[b].xx(c, f.tileGrid);
  }
  clearItemDrops();
  b = game.goldDrops;
  if (0 < b.pe.length) {
    b.pe.length = 0;
  }
  b = game.scrollDrops;
  if (0 < b.kf.length) {
    b.kf.length = 0;
  }
  b = game.potionDrops;
  if (0 < b.Hf.length) {
    b.Hf.length = 0;
  }
  b = game.treasure;
  if (0 < b.Mn.length) {
    b.Mn.length = 0;
    b.Dt = {};
  }
  clearScrollTargets();
  resetEncounter();
  clearVisualEffects();
  clearMonsters();
  if (d) {
    revealRoom(f.Ce.$d);
    d = f.Ce.$d;
    c = getAllies();
    for (b = 0; b < c.length; b++) {
      var g = c[b],
        h = d;
      a = g.position;
      a.cd = null;
      a.room = h;
      g.actionType = IDLE_ACTION;
      clearMovementTarget(a);
      g = h.stairs;
      setVector(a.levelPosition, g.tq, g.uq);
    }
    populateEncounter(d);
    spawnRoomTreasure(f.Ce.$d);
  }
}
export function clearDungeonTiles(a) {
  var b, c, d;
  for (c = 0; c < a.rc; c++) {
    for (d = a.tileGrid[c], b = 0; b < a.sc; b++) {
      var f = d[b];
      f.Jn = null;
      f.Yf = null;
      f.bt = null;
      f.Rb = EMPTY_TILE;
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
    this.Xp = this.Zo = 0;
    this.roomList.length = 0;
    this.gd.length = 0;
    this.tf = this.Ce = null;
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
        this.yx(g);
        h = undefined;
        for (h = 0; 3 > h; h++) {
          if (0.5 > this.seededRandom.random()) {
            this.shiftLeft(g);
            this.gt(g);
          } else {
            this.gt(g);
            this.shiftLeft(g);
          }
        }
        c.Bq(this.tileGrid);
      }
    }
    return this.ru() ? this.uu() ? true : (console.log("failed to create stairs."), false) : false;
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
      this.gd.push(f);
      f.Bq(this.tileGrid);
      c.ro.push(b);
      b.ro.push(c);
    }
    return true;
  };
  DungeonLayoutGenerator.prototype.uu = function () {
    for (var a = this.roomList[randomIntFrom(this.seededRandom, this.roomList.length)], b = this.roomList[randomIntFrom(this.seededRandom, this.roomList.length)]; b === a;) {
      b = this.roomList[randomIntFrom(this.seededRandom, this.roomList.length)];
    }
    var c = false;
    if (game.currentDungeon) {
      c = game.currentDungeon;
      c = c.currentLevelIndex >= c.levelCount - 1;
    } else {
      if (game.currentCastle) {
        c = true;
      }
    }
    c = c ? !this.Aj : this.Aj;
    this.Ce = this.to(a, !this.Aj);
    this.tf = this.to(b, c);
    return null != this.Ce && null != this.tf;
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
    this.Xp = this.Zo = 0;
    this.roomList.length = 0;
    this.gd.length = 0;
    this.tf = this.Ce = null;
    appendDungeonRoom(this, 1, 1, 15, 15, 1);
    appendDungeonRoom(this, 51, 1, 15, 15, 1);
    appendDungeonRoom(this, 56, 31, 5, 5, 3);
    appendDungeonRoom(this, 51, 46, 15, 15, 1);
    appendDungeonRoom(this, 1, 46, 15, 15, 1);
    appendDungeonRoom(this, 1, 69, 15, 15, 2);
    appendDungeonRoom(this, 27, 74, 5, 5, 3);
    this.ru();
    this.uu();
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
        this.gd.push(d);
        d.Bq(this.tileGrid);
        c.ro.push(b);
        b.ro.push(c);
      } else {
        console.log("failed to generate hallway. bummer.");
      }
    }
  };
  CastleLayoutGenerator.prototype.uu = function () {
    var a = this.roomList[this.roomList.length - 1];
    this.Ce = this.to(this.roomList[0], false);
    this.tf = this.to(a, false);
  };
  CastleLayoutGenerator.prototype.to = function (a, b) {
    var c = new DungeonStairs(a),
      d = a.Nc,
      f,
      g;
    if (0.5 > Math.random()) {
      f = a.tileColumn - 1;
      for (g = a.tileRow + randomIntFrom(this.seededRandom, a.heightInTiles); this.dl(d, f, g);) {
        g = a.tileRow + randomIntFrom(this.seededRandom, a.heightInTiles);
      }
      c.Fq = true;
    } else {
      g = a.tileRow - 1;
      for (f = a.tileColumn + randomIntFrom(this.seededRandom, a.widthInTiles); this.dl(d, f, g);) {
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
    for (b = 0; b < this.rc; b++) {
      c = [];
      d = b * game.tileSize;
      for (a = 0; a < this.sc; a++) {
        f = a * game.tileSize;
        c.push(new DungeonTile(b, a, d, f));
      }
      this.tileGrid.push(c);
    }
  };
  DungeonLevel.prototype.getTileAt = function (a, b) {
    return 0 > a || a >= this.rc || 0 > b || b >= this.sc ? null : this.tileGrid[a][b];
  };
  DungeonLevel.prototype.Ai = function (a) {
    return a / game.tileSize | 0;
  };
  DungeonLevel.prototype.Bi = function (a) {
    return a / game.tileSize | 0;
  };
}
