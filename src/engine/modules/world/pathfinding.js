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
    tileIndex = grid.usedTiles.indexOf(tileKey);
  if (-1 < tileIndex) {
    var node = grid.usedNodes[tileIndex];
  } else {
    var nodePool = grid.nodePool;
    if (0 < nodePool.pooledNodes.length) {
      var pooledNode = node = nodePool.pooledNodes.shift();
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
      node = new PathNode(grid, tile);
    }
    grid.usedNodes.push(node);
    grid.usedTiles.push(tileKey);
  }
  return node;
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
      goalNode = getPathNode(pathfinder.grid, toCenterTile),
      expandedNode,
      nodeGrid,
      nodeTile,
      neighborList,
      nodeTileColumn,
      foundPath,
      alreadyVisited,
      candidateCost,
      grandparentNode,
      searchStep = /** @type {any} */ (0);
    pathfinder.open.nodes.length = 0;
    pathfinder.open.push(startNode);
    for (startNode.visited = true; 0 < pathfinder.open.nodes.length;) {
      searchStep++;
      if (500 < searchStep) {
        console.log("path finding failure. too many iterations");
        foundPath = null;
        break a;
      }
      var currentNode = pathfinder.open.pop();
      if (currentNode.tile === goalNode.tile) {
        foundPath = reconstructPath(currentNode);
        break a;
      }
      currentNode.closed = true;
      expandedNode = currentNode;
      if (0 === expandedNode.neighbors.length) {
        nodeGrid = expandedNode.grid;
        nodeTile = expandedNode.tile;
        neighborList = expandedNode.neighbors;
        nodeTileColumn = nodeTile.getTileColumn();
        var nodeTileRow = expandedNode.tile.getTileRow();
        var nodeTileIsDoorway = !(roomContainsTile(nodeGrid.fromRoom, nodeTileColumn, nodeTileRow) || roomContainsTile(nodeGrid.toRoom, nodeTileColumn, nodeTileRow)) && (isRoomBorder(nodeGrid.fromRoom, nodeTileColumn, nodeTileRow) || isRoomBorder(nodeGrid.toRoom, nodeTileColumn, nodeTileRow));
        if (isHallwayWalkable(nodeGrid, nodeTileColumn, nodeTileRow - 1, nodeTileIsDoorway, 0)) {
          neighborList.push(getPathNode(nodeGrid, nodeGrid.tileGrid[nodeTileColumn][nodeTileRow - 1]));
        }
        if (isHallwayWalkable(nodeGrid, nodeTileColumn - 1, nodeTileRow, nodeTileIsDoorway, 3)) {
          neighborList.push(getPathNode(nodeGrid, nodeGrid.tileGrid[nodeTileColumn - 1][nodeTileRow]));
        }
        if (isHallwayWalkable(nodeGrid, nodeTileColumn + 1, nodeTileRow, nodeTileIsDoorway, 1)) {
          neighborList.push(getPathNode(nodeGrid, nodeGrid.tileGrid[nodeTileColumn + 1][nodeTileRow]));
        }
        if (isHallwayWalkable(nodeGrid, nodeTileColumn, nodeTileRow + 1, nodeTileIsDoorway, 2)) {
          neighborList.push(getPathNode(nodeGrid, nodeGrid.tileGrid[nodeTileColumn][nodeTileRow + 1]));
        }
      }
      var neighbors = currentNode.neighbors;
      for (var neighborIndex = 0; neighborIndex < neighbors.length; neighborIndex++) {
        var neighbor = neighbors[neighborIndex];
        if (!neighbor.closed && (candidateCost = currentNode.costSoFar + neighbor.position.distanceTo(currentNode.position), alreadyVisited = neighbor.visited, !alreadyVisited || candidateCost < neighbor.costSoFar)) {
          neighbor.parent = currentNode;
          if (alreadyVisited) {
            pathfinder.open.remove(neighbor);
            neighbor.costSoFar = candidateCost;
          } else {
            if (0 > neighbor.heuristicScore) {
              var heuristicFactor = neighbor.parent ? (grandparentNode = neighbor.parent.parent) && neighbor.position.x !== grandparentNode.position.x && neighbor.position.y !== grandparentNode.position.y ? 1.3 : 1 : 1;
              neighbor.heuristicScore = neighbor.position.distanceTo(goalNode.position) * heuristicFactor;
            }
            neighbor.costSoFar = candidateCost;
            neighbor.visited = true;
          }
          pathfinder.open.push(neighbor);
        }
      }
    }
    console.log("ran out of open nodes before finding path");
    foundPath = null;
  }
  var pathGrid = pathfinder.grid;
  var nodeIndex = 0;
  for (; nodeIndex < pathGrid.usedNodes.length; nodeIndex++) {
    pathGrid.nodePool.pooledNodes.push(pathGrid.usedNodes[nodeIndex]);
  }
  pathGrid.usedNodes.length = 0;
  pathGrid.usedTiles.length = 0;
  var pathTiles = foundPath;
  if (pathTiles) {
    var doorFrom = new DungeonDoor(fromRoom);
    var doorTo = new DungeonDoor(toRoom);
    var builtHallway = new DungeonHallway(fromRoom, doorFrom, toRoom, doorTo);
    fromRoom.doorList.push(doorFrom);
    toRoom.doorList.push(doorTo);
    doorFrom.hallway = builtHallway;
    doorTo.hallway = builtHallway;
    var pathIndex = 0;
    for (; pathIndex < pathTiles.length; pathIndex++) {
      var pathTile = pathTiles[pathIndex];
      if (!roomContainsTile(fromRoom, pathTile.x, pathTile.y) && !roomContainsTile(toRoom, pathTile.x, pathTile.y)) {
        if (roomContainsTile(toRoom, pathTile.x, pathTile.y)) {
          break;
        }
        if (isRoomBorder(fromRoom, pathTile.x, pathTile.y)) {
          var positionedDoor = doorFrom;
          var doorTileColumn = pathTile.x;
          var doorTileRow = pathTile.y;
          positionedDoor.tileColumn = doorTileColumn;
          positionedDoor.tileRow = doorTileRow;
          positionedDoor.pixelColumn = doorTileColumn * TILE_SIZE;
          positionedDoor.pixelRow = doorTileRow * TILE_SIZE;
          doorFrom.horizontalPassage = pathTile.x != pathTiles[pathIndex + 1].x;
        } else {
          if (isRoomBorder(toRoom, pathTile.x, pathTile.y)) {
            positionedDoor = doorTo;
            doorTileColumn = pathTile.x;
            doorTileRow = pathTile.y;
            positionedDoor.tileColumn = doorTileColumn;
            positionedDoor.tileRow = doorTileRow;
            positionedDoor.pixelColumn = doorTileColumn * TILE_SIZE;
            positionedDoor.pixelRow = doorTileRow * TILE_SIZE;
            doorTo.horizontalPassage = pathTile.x != pathTiles[pathIndex - 1].x;
          }
        }
        builtHallway.pathTiles.push(pathTile);
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
