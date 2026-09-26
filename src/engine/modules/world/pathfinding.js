/** 走廊路径查找、开放集与节点池。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { Vector2, copyVector, setVector } from "../core/math.js";
import { DungeonDoor, DungeonHallway, EMPTY_TILE, isRoomBorder, roomContainsTile } from "./rooms.js";
import { game } from "../runtime/game.js";
export function PathfindingGrid(a, b, c) {
  this.fl = a;
  this.Nj = b;
  this.tileGrid = c;
  this.oB = new PathNodePool();
  this.Ip = [];
  this.Sw = [];
  this.Cl = this.Bl = null;
}
export function getPathNode(a, b) {
  var c = "" + (b.Ai() * a.Nj + b.Bi()),
    d = a.Sw.indexOf(c);
  if (-1 < d) {
    d = a.Ip[d];
  } else {
    d = a.oB;
    if (0 < d.nx.length) {
      var f = d = d.nx.shift();
      f.Fl = a;
      f.ss = b;
      f.xk = 0;
      f.Ko = -1;
      f.rl = null;
      f.It = false;
      f.closed = false;
      setVector(f.gh, b.Ai(), b.Bi());
      f.Hs.length = 0;
    } else {
      d = new PathNode(a, b);
    }
    a.Ip.push(d);
    a.Sw.push(c);
  }
  return d;
}
export function isHallwayWalkable(a, b, c, d, f) {
  return 0 > b - 1 || 0 > c - 1 || b + 1 >= a.fl || c + 1 >= a.Nj ? false : roomContainsTile(a.Bl, b, c) ? !isNearRoomCorner(b, c, a.Bl) : roomContainsTile(a.Cl, b, c) ? !isNearRoomCorner(b, c, a.Cl) : isRoomBorder(a.Bl, b, c) || isRoomBorder(a.Cl, b, c) ? !d : 0 === f || 2 === f ? a.tileGrid[b - 1][c].floorType === EMPTY_TILE && a.tileGrid[b + 1][c].floorType === EMPTY_TILE : a.tileGrid[b][c - 1].floorType === EMPTY_TILE && a.tileGrid[b][c + 1].floorType === EMPTY_TILE;
}
export function isNearRoomCorner(a, b, c) {
  var d = c.tileColumn,
    f = d + c.widthInTiles - 1,
    g = c.tileRow;
  return 2 > Math.abs(g - b) && (2 > Math.abs(d - a) || 2 > Math.abs(f - a)) || 2 > Math.abs(g + c.heightInTiles - 1 - b) && (2 > Math.abs(d - a) || 2 > Math.abs(f - a)) ? true : false;
}
export function PathNode(a, b) {
  this.Fl = a;
  this.ss = b;
  this.xk = 0;
  this.Ko = -1;
  this.rl = null;
  this.closed = this.It = false;
  this.gh = new Vector2();
  setVector(this.gh, b.Ai(), b.Bi());
  this.Hs = [];
}
export function reconstructPath(a) {
  var b;
  b = a.rl ? reconstructPath(a.rl) : [];
  var c = new Vector2();
  copyVector(c, a.gh);
  b.push(c);
  return b;
}
export function PathNodePool() {
  this.nx = [];
}
export function PathOpenSet() {
  this.Ui = [];
}
export function HallwayPathfinder(a, b, c) {
  this.tileGrid = c;
  this.Fl = new PathfindingGrid(a, b, c);
  this.open = new PathOpenSet();
}
export function findHallwayPath(a, b, c) {
  var d = a.tileGrid[b.tileColumn + b.widthInTiles / 2 | 0][b.tileRow + b.heightInTiles / 2 | 0],
    f = a.tileGrid[c.tileColumn + c.widthInTiles / 2 | 0][c.tileRow + c.heightInTiles / 2 | 0],
    g = a.Fl;
  g.Bl = b;
  g.Cl = c;
  a: {
    var g = getPathNode(a.Fl, d),
      f = getPathNode(a.Fl, f),
      h,
      l,
      n,
      p,
      s,
      d = /** @type {any} */ (0);
    a.open.Ui.length = 0;
    a.open.push(g);
    for (g.It = true; 0 < a.open.Ui.length;) {
      d++;
      if (500 < d) {
        console.log("path finding failure. too many iterations");
        f = null;
        break a;
      }
      g = a.open.pop();
      if (g.ss === f.ss) {
        f = reconstructPath(g);
        break a;
      }
      g.closed = true;
      h = g;
      if (0 === h.Hs.length) {
        l = h.Fl;
        n = h.ss;
        p = h.Hs;
        s = n.Ai();
        n = n.Bi();
        var u = !(roomContainsTile(l.Bl, s, n) || roomContainsTile(l.Cl, s, n)) && (isRoomBorder(l.Bl, s, n) || isRoomBorder(l.Cl, s, n));
        if (isHallwayWalkable(l, s, n - 1, u, 0)) {
          p.push(getPathNode(l, l.tileGrid[s][n - 1]));
        }
        if (isHallwayWalkable(l, s - 1, n, u, 3)) {
          p.push(getPathNode(l, l.tileGrid[s - 1][n]));
        }
        if (isHallwayWalkable(l, s + 1, n, u, 1)) {
          p.push(getPathNode(l, l.tileGrid[s + 1][n]));
        }
        if (isHallwayWalkable(l, s, n + 1, u, 2)) {
          p.push(getPathNode(l, l.tileGrid[s][n + 1]));
        }
      }
      h = h.Hs;
      for (s = 0; s < h.length; s++) {
        if (l = h[s], !l.closed && (p = g.xk + l.gh.ac(g.gh), n = l.It, !n || p < l.xk)) {
          l.rl = g;
          if (n) {
            a.open.remove(l);
            l.xk = p;
          } else {
            if (0 > l.Ko) {
              n = l.rl ? (n = l.rl.rl) && l.gh.x !== n.gh.x && l.gh.y !== n.gh.y ? 1.3 : 1 : 1;
              l.Ko = l.gh.ac(f.gh) * n;
            }
            l.xk = p;
            l.It = true;
          }
          a.open.push(l);
        }
      }
    }
    console.log("ran out of open nodes before finding path");
    f = null;
  }
  a = a.Fl;
  for (d = 0; d < a.Ip.length; d++) {
    a.oB.nx.push(a.Ip[d]);
  }
  a.Ip.length = 0;
  a.Sw.length = 0;
  if (a = f) {
    g = new DungeonDoor(b);
    h = new DungeonDoor(c);
    l = new DungeonHallway(b, g, c, h);
    b.Nc.push(g);
    c.Nc.push(h);
    g.Yk = l;
    h.Yk = l;
    for (f = 0; f < a.length; f++) {
      if (d = a[f], !roomContainsTile(b, d.x, d.y) && !roomContainsTile(c, d.x, d.y)) {
        if (roomContainsTile(c, d.x, d.y)) {
          break;
        }
        if (isRoomBorder(b, d.x, d.y)) {
          p = g;
          s = d.x;
          n = d.y;
          p.wj = s;
          p.xj = n;
          p.me = s * game.tileSize;
          p.ne = n * game.tileSize;
          g.Ho = d.x != a[f + 1].x;
        } else {
          if (isRoomBorder(c, d.x, d.y)) {
            p = h;
            s = d.x;
            n = d.y;
            p.wj = s;
            p.xj = n;
            p.me = s * game.tileSize;
            p.ne = n * game.tileSize;
            h.Ho = d.x != a[f - 1].x;
          }
        }
        l.Sk.push(d);
      }
    }
    b = l;
  } else {
    b = null;
  }
  return b;
}
export function initializeWorldPathfinding() {
  PathOpenSet.prototype.push = function (a) {
    var b,
      c = a.xk + a.Ko;
    for (b = 0; b < this.Ui.length; b++) {
      var d = this.Ui[b];
      if (c <= d.xk + d.Ko) {
        this.Ui.splice(b, 0, a);
        return;
      }
    }
    this.Ui.push(a);
  };
  PathOpenSet.prototype.pop = function () {
    return this.Ui.shift();
  };
  PathOpenSet.prototype.remove = function (a) {
    a = this.Ui.indexOf(a);
    if (-1 !== a) {
      this.Ui.splice(a, 1);
    } else {
      console.log("failed to find node in queue for removal!!!!!!!!!!");
    }
  };
}
