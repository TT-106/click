/** 走廊路径查找、开放集与节点池。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { Vector2, copyVector, setVector } from "../core/math.js";
import { DungeonDoor, DungeonHallway, EMPTY_TILE, isRoomBorder, roomContainsTile } from "./rooms.js";
import { TILE_SIZE } from "../core/screen-layout.js";
export function PathfindingGrid(widthInTiles, heightInTiles, tileGrid) {
  this.widthInTiles = widthInTiles;
  this.heightInTiles = heightInTiles;
  this.tileGrid = tileGrid;
  this.nodePool = new PathNodePool();
  this.usedNodes = [];
  this.usedTiles = [];
  this.toRoom = this.fromRoom = null;
}
export function getPathNode(grid, tile) {
  var tileKey = "" + (tile.getTileColumn() * grid.heightInTiles + tile.getTileRow()),
    d = grid.usedTiles.indexOf(tileKey);
  if (-1 < d) {
    d = grid.usedNodes[d];
  } else {
    d = grid.nodePool;
    if (0 < d.pooledNodes.length) {
      var pooledNode = d = d.pooledNodes.shift();
      pooledNode.grid = grid;
      pooledNode.tile = tile;
      pooledNode.costSoFar = 0;
      pooledNode.heuristicScore = -1;
      pooledNode.parent = null;
      pooledNode.visited = false;
      pooledNode.closed = false;
      setVector(pooledNode.position, tile.getTileColumn(), tile.getTileRow());
      pooledNode.neighbors.length = 0;
    } else {
      d = new PathNode(grid, tile);
    }
    grid.usedNodes.push(d);
    grid.usedTiles.push(tileKey);
  }
  return d;
}
export function isHallwayWalkable(grid, tileColumn, tileRow, fromTileIsDoorway, directionId) {
  return 0 > tileColumn - 1 || 0 > tileRow - 1 || tileColumn + 1 >= grid.widthInTiles || tileRow + 1 >= grid.heightInTiles ? false : roomContainsTile(grid.fromRoom, tileColumn, tileRow) ? !isNearRoomCorner(tileColumn, tileRow, grid.fromRoom) : roomContainsTile(grid.toRoom, tileColumn, tileRow) ? !isNearRoomCorner(tileColumn, tileRow, grid.toRoom) : isRoomBorder(grid.fromRoom, tileColumn, tileRow) || isRoomBorder(grid.toRoom, tileColumn, tileRow) ? !fromTileIsDoorway : 0 === directionId || 2 === directionId ? grid.tileGrid[tileColumn - 1][tileRow].floorType === EMPTY_TILE && grid.tileGrid[tileColumn + 1][tileRow].floorType === EMPTY_TILE : grid.tileGrid[tileColumn][tileRow - 1].floorType === EMPTY_TILE && grid.tileGrid[tileColumn][tileRow + 1].floorType === EMPTY_TILE;
}
export function isNearRoomCorner(tileColumn, tileRow, room) {
  var roomLeftColumn = room.tileColumn,
    roomRightColumn = roomLeftColumn + room.widthInTiles - 1,
    roomTopRow = room.tileRow;
  return 2 > Math.abs(roomTopRow - tileRow) && (2 > Math.abs(roomLeftColumn - tileColumn) || 2 > Math.abs(roomRightColumn - tileColumn)) || 2 > Math.abs(roomTopRow + room.heightInTiles - 1 - tileRow) && (2 > Math.abs(roomLeftColumn - tileColumn) || 2 > Math.abs(roomRightColumn - tileColumn)) ? true : false;
}
export function PathNode(grid, tile) {
  this.grid = grid;
  this.tile = tile;
  this.costSoFar = 0;
  this.heuristicScore = -1;
  this.parent = null;
  this.closed = this.visited = false;
  this.position = new Vector2();
  setVector(this.position, tile.getTileColumn(), tile.getTileRow());
  this.neighbors = [];
}
export function reconstructPath(node) {
  var pathTiles;
  pathTiles = node.parent ? reconstructPath(node.parent) : [];
  var pathTile = new Vector2();
  copyVector(pathTile, node.position);
  pathTiles.push(pathTile);
  return pathTiles;
}
export function PathNodePool() {
  this.pooledNodes = [];
}
export function PathOpenSet() {
  this.nodes = [];
}
export function HallwayPathfinder(widthInTiles, heightInTiles, tileGrid) {
  this.tileGrid = tileGrid;
  this.grid = new PathfindingGrid(widthInTiles, heightInTiles, tileGrid);
  this.open = new PathOpenSet();
}
export function findHallwayPath(pathfinder, fromRoom, toRoom) {
  var fromCenterTile = pathfinder.tileGrid[fromRoom.tileColumn + fromRoom.widthInTiles / 2 | 0][fromRoom.tileRow + fromRoom.heightInTiles / 2 | 0],
    toCenterTile = pathfinder.tileGrid[toRoom.tileColumn + toRoom.widthInTiles / 2 | 0][toRoom.tileRow + toRoom.heightInTiles / 2 | 0],
    grid = pathfinder.grid;
  grid.fromRoom = fromRoom;
  grid.toRoom = toRoom;
  a: {
    var startNode = getPathNode(pathfinder.grid, fromCenterTile),
      f = getPathNode(pathfinder.grid, toCenterTile),
      h,
      l,
      n,
      p,
      nodeTileColumn,
      d = /** @type {any} */ (0);
    pathfinder.open.nodes.length = 0;
    pathfinder.open.push(startNode);
    for (startNode.visited = true; 0 < pathfinder.open.nodes.length;) {
      d++;
      if (500 < d) {
        console.log("path finding failure. too many iterations");
        f = null;
        break a;
      }
      var currentNode = pathfinder.open.pop();
      if (currentNode.tile === f.tile) {
        f = reconstructPath(currentNode);
        break a;
      }
      currentNode.closed = true;
      h = currentNode;
      if (0 === h.neighbors.length) {
        l = h.grid;
        n = h.tile;
        p = h.neighbors;
        nodeTileColumn = n.getTileColumn();
        n = n.getTileRow();
        var nodeTileIsDoorway = !(roomContainsTile(l.fromRoom, nodeTileColumn, n) || roomContainsTile(l.toRoom, nodeTileColumn, n)) && (isRoomBorder(l.fromRoom, nodeTileColumn, n) || isRoomBorder(l.toRoom, nodeTileColumn, n));
        if (isHallwayWalkable(l, nodeTileColumn, n - 1, nodeTileIsDoorway, 0)) {
          p.push(getPathNode(l, l.tileGrid[nodeTileColumn][n - 1]));
        }
        if (isHallwayWalkable(l, nodeTileColumn - 1, n, nodeTileIsDoorway, 3)) {
          p.push(getPathNode(l, l.tileGrid[nodeTileColumn - 1][n]));
        }
        if (isHallwayWalkable(l, nodeTileColumn + 1, n, nodeTileIsDoorway, 1)) {
          p.push(getPathNode(l, l.tileGrid[nodeTileColumn + 1][n]));
        }
        if (isHallwayWalkable(l, nodeTileColumn, n + 1, nodeTileIsDoorway, 2)) {
          p.push(getPathNode(l, l.tileGrid[nodeTileColumn][n + 1]));
        }
      }
      h = h.neighbors;
      for (var neighborIndex = 0; neighborIndex < h.length; neighborIndex++) {
        if (l = h[neighborIndex], !l.closed && (p = currentNode.costSoFar + l.position.distanceTo(currentNode.position), n = l.visited, !n || p < l.costSoFar)) {
          l.parent = currentNode;
          if (n) {
            pathfinder.open.remove(l);
            l.costSoFar = p;
          } else {
            if (0 > l.heuristicScore) {
              n = l.parent ? (n = l.parent.parent) && l.position.x !== n.position.x && l.position.y !== n.position.y ? 1.3 : 1 : 1;
              l.heuristicScore = l.position.distanceTo(f.position) * n;
            }
            l.costSoFar = p;
            l.visited = true;
          }
          pathfinder.open.push(l);
        }
      }
    }
    console.log("ran out of open nodes before finding path");
    f = null;
  }
  var a = pathfinder.grid;
  for (d = 0; d < a.usedNodes.length; d++) {
    a.nodePool.pooledNodes.push(a.usedNodes[d]);
  }
  a.usedNodes.length = 0;
  a.usedTiles.length = 0;
  if (a = f) {
    var doorFrom = new DungeonDoor(fromRoom);
    var doorTo = new DungeonDoor(toRoom);
    var builtHallway = new DungeonHallway(fromRoom, doorFrom, toRoom, doorTo);
    fromRoom.doorList.push(doorFrom);
    toRoom.doorList.push(doorTo);
    doorFrom.hallway = builtHallway;
    doorTo.hallway = builtHallway;
    for (f = 0; f < a.length; f++) {
      if (d = a[f], !roomContainsTile(fromRoom, d.x, d.y) && !roomContainsTile(toRoom, d.x, d.y)) {
        if (roomContainsTile(toRoom, d.x, d.y)) {
          break;
        }
        if (isRoomBorder(fromRoom, d.x, d.y)) {
          var positionedDoor = doorFrom;
          var doorTileColumn = d.x;
          n = d.y;
          positionedDoor.tileColumn = doorTileColumn;
          positionedDoor.tileRow = n;
          positionedDoor.pixelColumn = doorTileColumn * TILE_SIZE;
          positionedDoor.pixelRow = n * TILE_SIZE;
          doorFrom.horizontalPassage = d.x != a[f + 1].x;
        } else {
          if (isRoomBorder(toRoom, d.x, d.y)) {
            positionedDoor = doorTo;
            doorTileColumn = d.x;
            n = d.y;
            positionedDoor.tileColumn = doorTileColumn;
            positionedDoor.tileRow = n;
            positionedDoor.pixelColumn = doorTileColumn * TILE_SIZE;
            positionedDoor.pixelRow = n * TILE_SIZE;
            doorTo.horizontalPassage = d.x != a[f - 1].x;
          }
        }
        builtHallway.pathTiles.push(d);
      }
    }
    var hallway = builtHallway;
  } else {
    hallway = null;
  }
  return hallway;
}
export function initializeWorldPathfinding() {
  PathOpenSet.prototype.push = function (node) {
    var insertIndex,
      totalScore = node.costSoFar + node.heuristicScore;
    for (insertIndex = 0; insertIndex < this.nodes.length; insertIndex++) {
      var queuedNode = this.nodes[insertIndex];
      if (totalScore <= queuedNode.costSoFar + queuedNode.heuristicScore) {
        this.nodes.splice(insertIndex, 0, node);
        return;
      }
    }
    this.nodes.push(node);
  };
  PathOpenSet.prototype.pop = function () {
    return this.nodes.shift();
  };
  PathOpenSet.prototype.remove = function (node) {
    var nodeIndex = this.nodes.indexOf(node);
    if (-1 !== nodeIndex) {
      this.nodes.splice(nodeIndex, 1);
    } else {
      console.log("failed to find node in queue for removal!!!!!!!!!!");
    }
  };
}
