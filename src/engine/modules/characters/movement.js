/** 装备槽、坐标、寻路与群体分离。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { Vector2, addVector, assignVector, copyVector, multiplyVector, normalizeVector, setVector, subtractVector, vectorLength } from "../core/math.js";
import { game } from "../runtime/game.js";
import { getAllies, getMonsters } from "../combat/encounters.js";
export function Equipment(a, b) {
  this.characterClass = b;
  this.hw = {};
  this.Z = a;
  this.Ey = this.fz = null;
  var c;
  for (c = 0; c < a.length; c++) {
    this.hw[a[c]] = null;
  }
}
export function CharacterPosition(a, b) {
  this.ra = new Vector2();
  this.Gd = null;
  this.lj = new Vector2();
  this.Tl = new Vector2();
  this.Wc = new Vector2();
  this.Jw = b;
  this.MC = a;
  this.levelPosition = new Vector2();
  this.Db = new Vector2();
  this.room = this.cd = null;
  this.Ul = new Vector2();
  this.Sn = this.Rn = 0;
  this.Qb = new Vector2();
  this.Ug = null;
  this.dd = false;
  this.ed = this.Cc = this.Bc = null;
  this.fg = -1;
  this.Hh = this.aB = this.qj = null;
}
export function clearMovementTarget(a) {
  a.dd = true;
  a.Bc = null;
  a.Cc = null;
  a.ed = null;
  a.Ug = null;
  a.fg = -1;
}
export function applySeparationForce(a, b, c, d) {
  if (!a.Gd) {
    a.Gd = new Vector2();
  }
  if (a.levelPosition === c) {
    assignVector(a.Gd, a.levelPosition);
    subtractVector(a.Gd, b);
    normalizeVector(a.Gd);
    multiplyVector(a.Gd, d);
  } else {
    assignVector(a.Gd, a.levelPosition);
    subtractVector(a.Gd, c);
    b = vectorLength(a.Gd);
    if (0 !== b) {
      normalizeVector(a.Gd);
      multiplyVector(a.Gd, d * (1 - b / d));
    }
  }
}
export function setWorldDestination(a, b, c) {
  a.Rn = b;
  a.Sn = c;
  setVector(a.Ul, game.world.dc(b), game.world.ec(c));
}
export function findCheapestNeighbor(a, b) {
  var c = a.bc(),
    d = a.cc(),
    f,
    g,
    h = 1E9,
    l = null,
    n,
    p;
  for (n = -1; 1 >= n; n++) {
    for (p = -1; 1 >= p; p++) {
      if ((0 !== n || 0 !== p) && (f = game.world.hb(c + n, d + p)) && f !== b && (g = f.ln, !l || h > g)) {
        l = f;
        h = g;
      }
    }
  }
  if (!l) {
    console.log("failed to find cheapest neighbor");
  }
  return l;
}
export function separateDungeonCharacters(a) {
  setVector(a.lj, 0, 0);
  var b,
    c,
    d = false,
    f = getMonsters(),
    g = game.minions.eh,
    h;
  for (c = 0; c < game.state.adventurers.length; c++) {
    b = game.state.adventurers[c];
    b = b.position;
    if (b === a) {
      break;
    }
    h = a.levelPosition.ac(b.levelPosition);
    if (40 > h) {
      if (0 === h) {
        setVector(a.Wc, Math.random(), Math.random());
      } else {
        copyVector(a.Wc, a.levelPosition);
        subtractVector(a.Wc, b.levelPosition);
      }
      normalizeVector(a.Wc);
      addVector(a.lj, a.Wc);
      d = true;
    }
  }
  for (c = 0; c < g.length; c++) {
    b = g[c];
    b = b.position;
    if (b !== a) {
      h = a.levelPosition.ac(b.levelPosition);
      if (50 > h) {
        if (0 === h) {
          setVector(a.Wc, Math.random(), Math.random());
        } else {
          copyVector(a.Wc, a.levelPosition);
          subtractVector(a.Wc, b.levelPosition);
        }
        normalizeVector(a.Wc);
        addVector(a.lj, a.Wc);
        d = true;
      }
    }
  }
  for (c = 0; c < f.length; c++) {
    b = f[c];
    b = b.position;
    if (b !== a) {
      h = a.levelPosition.ac(b.levelPosition);
      if (50 > h) {
        if (0 === h) {
          setVector(a.Wc, Math.random(), Math.random());
        } else {
          copyVector(a.Wc, a.levelPosition);
          subtractVector(a.Wc, b.levelPosition);
        }
        normalizeVector(a.Wc);
        addVector(a.lj, a.Wc);
        d = true;
      }
    }
  }
  if (d) {
    normalizeVector(a.lj);
    multiplyVector(a.lj, 0.5);
  }
  return d;
}
export function separateWorldCharacters(a) {
  setVector(a.Tl, 0, 0);
  var b,
    c,
    d = false,
    f = getAllies(),
    g;
  for (c = 0; c < f.length; c++) {
    b = f[c];
    b = b.position;
    if (b !== a) {
      g = a.Db.ac(b.Db);
      if (40 > g) {
        if (0 === g) {
          setVector(a.Wc, Math.random(), Math.random());
        } else {
          copyVector(a.Wc, a.Db);
          subtractVector(a.Wc, b.Db);
        }
        normalizeVector(a.Wc);
        addVector(a.Tl, a.Wc);
        d = true;
      }
    }
  }
  if (d) {
    normalizeVector(a.Tl);
  }
  return d;
}
export function initializeCharactersMovement() {
  Equipment.prototype.ef = function (a) {
    return this.hw[a];
  };
  Equipment.prototype.So = function () {
    return this.fz;
  };
  Equipment.prototype.Qk = function (a) {
    this.hw[a.slot] = a;
    if (a.Cw()) {
      this.Ey = a;
    }
    if (1 === a.statType) {
      this.fz = a;
    }
  };
  CharacterPosition.prototype.dc = function () {
    return this.Db.x;
  };
  CharacterPosition.prototype.ec = function () {
    return this.Db.y;
  };
  CharacterPosition.prototype.Ob = function () {
    return this.levelPosition.x;
  };
  CharacterPosition.prototype.Pb = function () {
    return this.levelPosition.y;
  };
  CharacterPosition.prototype.et = function (a) {
    this.Bc = a;
  };
  CharacterPosition.prototype.rB = function (a) {
    this.ed = a;
  };
}
