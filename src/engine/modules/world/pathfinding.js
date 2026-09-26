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
  this.usedNodes = [];
  this.usedTiles = [];
  this.toRoom = this.fromRoom = null;
}
export function getPathNode(a, b) {
  var c = "" + (b.getTileColumn() * a.Nj + b.getTileRow()),
    d = a.usedTiles.indexOf(c);
  if (-1 < d) {
    d = a.usedNodes[d];
  } else {
    d = a.oB;
    if (0 < d.pooledNodes.length) {
      var f = d = d.pooledNodes.shift();
      f.Fl = a;
      f.ss = b;
      f.costSoFar = 0;
      f.heuristicScore = -1;
      f.parent = null;
      f.visited = false;
      f.closed = false;
      setVector(f.position, b.getTileColumn(), b.getTileRow());
      f.neighbors.length = 0;
    } else {
      d = new PathNode(a, b);
    }
    a.usedNodes.push(d);
    a.usedTiles.push(c);
  }
  return d;
}
export function isHallwayWalkable(a, b, c, d, f) {
  return 0 > b - 1 || 0 > c - 1 || b + 1 >= a.fl || c + 1 >= a.Nj ? false : roomContainsTile(a.fromRoom, b, c) ? !isNearRoomCorner(b, c, a.fromRoom) : roomContainsTile(a.toRoom, b, c) ? !isNearRoomCorner(b, c, a.toRoom) : isRoomBorder(a.fromRoom, b, c) || isRoomBorder(a.toRoom, b, c) ? !d : 0 === f || 2 === f ? a.tileGrid[b - 1][c].floorType === EMPTY_TILE && a.tileGrid[b + 1][c].floorType === EMPTY_TILE : a.tileGrid[b][c - 1].floorType === EMPTY_TILE && a.tileGrid[b][c + 1].floorType === EMPTY_TILE;
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
  this.costSoFar = 0;
  this.heuristicScore = -1;
  this.parent = null;
  this.closed = this.visited = false;
  this.position = new Vector2();
  setVector(this.position, b.getTileColumn(), b.getTileRow());
  this.neighbors = [];
}
export function reconstructPath(a) {
  var b;
  b = a.parent ? reconstructPath(a.parent) : [];
  var c = new Vector2();
  copyVector(c, a.position);
  b.push(c);
  return b;
}
export function PathNodePool() {
  this.pooledNodes = [];
}
export function PathOpenSet() {
  this.nodes = [];
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
  g.fromRoom = b;
  g.toRoom = c;
  a: {
    var g = getPathNode(a.Fl, d),
      f = getPathNode(a.Fl, f),
      h,
      l,
      n,
      p,
      s,
      d = /** @type {any} */ (0);
    a.open.nodes.length = 0;
    a.open.push(g);
    for (g.visited = true; 0 < a.open.nodes.length;) {
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
      if (0 === h.neighbors.length) {
        l = h.Fl;
        n = h.ss;
        p = h.neighbors;
        s = n.getTileColumn();
        n = n.getTileRow();
        var u = !(roomContainsTile(l.fromRoom, s, n) || roomContainsTile(l.toRoom, s, n)) && (isRoomBorder(l.fromRoom, s, n) || isRoomBorder(l.toRoom, s, n));
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
      h = h.neighbors;
      for (s = 0; s < h.length; s++) {
        if (l = h[s], !l.closed && (p = g.costSoFar + l.position.distanceTo(g.position), n = l.visited, !n || p < l.costSoFar)) {
          l.parent = g;
          if (n) {
            a.open.remove(l);
            l.costSoFar = p;
          } else {
            if (0 > l.heuristicScore) {
              n = l.parent ? (n = l.parent.parent) && l.position.x !== n.position.x && l.position.y !== n.position.y ? 1.3 : 1 : 1;
              l.heuristicScore = l.position.distanceTo(f.position) * n;
            }
            l.costSoFar = p;
            l.visited = true;
          }
          a.open.push(l);
        }
      }
    }
    console.log("ran out of open nodes before finding path");
    f = null;
  }
  a = a.Fl;
  for (d = 0; d < a.usedNodes.length; d++) {
    a.oB.pooledNodes.push(a.usedNodes[d]);
  }
  a.usedNodes.length = 0;
  a.usedTiles.length = 0;
  if (a = f) {
    g = new DungeonDoor(b);
    h = new DungeonDoor(c);
    l = new DungeonHallway(b, g, c, h);
    b.doorList.push(g);
    c.doorList.push(h);
    g.hallway = l;
    h.hallway = l;
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
          p.pixelColumn = s * game.tileSize;
          p.pixelRow = n * game.tileSize;
          g.horizontalPassage = d.x != a[f + 1].x;
        } else {
          if (isRoomBorder(c, d.x, d.y)) {
            p = h;
            s = d.x;
            n = d.y;
            p.wj = s;
            p.xj = n;
            p.pixelColumn = s * game.tileSize;
            p.pixelRow = n * game.tileSize;
            h.horizontalPassage = d.x != a[f - 1].x;
          }
        }
        l.pathTiles.push(d);
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
      c = a.costSoFar + a.heuristicScore;
    for (b = 0; b < this.nodes.length; b++) {
      var d = this.nodes[b];
      if (c <= d.costSoFar + d.heuristicScore) {
        this.nodes.splice(b, 0, a);
        return;
      }
    }
    this.nodes.push(a);
  };
  PathOpenSet.prototype.pop = function () {
    return this.nodes.shift();
  };
  PathOpenSet.prototype.remove = function (a) {
    a = this.nodes.indexOf(a);
    if (-1 !== a) {
      this.nodes.splice(a, 1);
    } else {
      console.log("failed to find node in queue for removal!!!!!!!!!!");
    }
  };
}
