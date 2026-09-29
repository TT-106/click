/** 地牢网格、房间、门、走廊与可见性。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { distanceToPoint, randomInt, randomIntFrom, setVector } from "../core/math.js";
import { game } from "../runtime/game.js";
import { rollGoldDrop, treasureRoomModifier } from "../content/balance.js";
import { GoldDrop } from "../loot/treasure.js";
import { TILE_SIZE } from "../core/screen-layout.js";
export var EMPTY_TILE;
export function DungeonTile(tileColumn, tileRow, pixelColumn, pixelRow) {
  this.tileColumn = tileColumn;
  this.tileRow = tileRow;
  this.pixelColumn = pixelColumn;
  this.pixelRow = pixelRow;
  this.cachedBackgroundSprite = this.decorationSprite = this.backgroundSprite = null;
  this.floorType = EMPTY_TILE;
  this.tileEffect = null;
  this.remainingEffectDamage = 0;
}
export function setTileEffect(tile, tileEffect) {
  tile.tileEffect = tileEffect;
  tile.remainingEffectDamage = tileEffect ? randomInt(tileEffect.remainingEffectDamage) : 0;
}
export function DungeonRoom(tileColumn, tileRow, widthInTiles, heightInTiles, encounterType) {
  this.roomId = 0;
  this.tileColumn = tileColumn;
  this.tileRow = tileRow;
  this.widthInTiles = widthInTiles;
  this.heightInTiles = heightInTiles;
  this.encounterType = encounterType;
  this.connectedRooms = [];
  this.doorList = [];
  this.tileGrid = this.theme = this.stairs = null;
  this.discovered = false;
}
export function roomLeftPixels(room) {
  return room.tileColumn * TILE_SIZE;
}
export function roomRightPixels(room) {
  return room.tileColumn * TILE_SIZE + room.widthInTiles * TILE_SIZE;
}
export function roomTopPixels(room) {
  return room.tileRow * TILE_SIZE;
}
export function roomBottomPixels(room) {
  return room.tileRow * TILE_SIZE + room.heightInTiles * TILE_SIZE;
}
export function roomContainsTile(room, tileColumn, tileRow) {
  return tileColumn >= room.tileColumn && tileColumn < room.tileColumn + room.widthInTiles && tileRow >= room.tileRow && tileRow < room.tileRow + room.heightInTiles;
}
export function isRoomBorder(room, tileColumn, tileRow) {
  return tileRow === room.tileRow - 1 || tileRow === room.tileRow + room.heightInTiles ? tileColumn >= room.tileColumn - 1 && tileColumn <= room.tileColumn + room.widthInTiles : tileColumn === room.tileColumn - 1 || tileColumn === room.tileColumn + room.widthInTiles ? tileRow >= room.tileRow - 1 && tileRow <= room.tileRow + room.heightInTiles : false;
}
export function revealRoom(room) {
  var wasHidden = !room.discovered;
  room.discovered = true;
  if (wasHidden) {
    if (0 === room.encounterType && treasureRoomModifier.currentValue && 0.25 > Math.random()) {
      room.encounterType = 3;
    }
    var leftColumn = room.tileColumn,
      rightColumn = leftColumn + room.widthInTiles, doorIndex, wallPoint, innerLeftColumn, goldAmount,
      topRow = room.tileRow, door, rowLimit, decorationRow, spawnPoint, floorSpriteName, goldTile,
      bottomRow = topRow + room.heightInTiles, decorationColumn, columnList,
      doorList = room.doorList,
      tile, tileGrid, innerTopRow,
      columnIndex, innerRightColumn, innerBottomRow,
      wallNSSprite, rowIndex, floorColumnList,
      floorSprite = game.terrainSprites.getSprite(room.theme.floor), decorationSets, decorationSet, wallDecorations, decorations, wallSpriteName;
    wallNSSprite = game.terrainSprites.getSprite(room.theme.wallSprites.wallNS);
    var wallEWSprite = game.terrainSprites.getSprite(room.theme.wallSprites.wallEW);
    tile = room.tileGrid[leftColumn - 1][topRow - 1];
    tile.setBackgroundSprite(floorSprite);
    tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.wallSprites.wallSW));
    tile = room.tileGrid[rightColumn][topRow - 1];
    tile.setBackgroundSprite(floorSprite);
    tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.wallSprites.wallNW));
    tile = room.tileGrid[leftColumn - 1][bottomRow];
    tile.setBackgroundSprite(floorSprite);
    tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.wallSprites.wallES));
    tile = room.tileGrid[rightColumn][bottomRow];
    tile.setBackgroundSprite(floorSprite);
    tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.wallSprites.wallNE));
    for (columnIndex = leftColumn; columnIndex < rightColumn; columnIndex++) {
      tile = room.tileGrid[columnIndex][topRow - 1];
      tile.setBackgroundSprite(floorSprite);
      if (!tile.decorationSprite) {
        tile.setDecorationSprite(wallNSSprite);
      }
    }
    for (columnIndex = leftColumn; columnIndex < rightColumn; columnIndex++) {
      tile = room.tileGrid[columnIndex][bottomRow];
      tile.setBackgroundSprite(floorSprite);
      if (!tile.decorationSprite) {
        tile.setDecorationSprite(wallNSSprite);
      }
    }
    for (rowIndex = topRow; rowIndex < bottomRow; rowIndex++) {
      tile = room.tileGrid[leftColumn - 1][rowIndex];
      tile.setBackgroundSprite(floorSprite);
      if (!tile.decorationSprite) {
        tile.setDecorationSprite(wallEWSprite);
      }
    }
    for (rowIndex = topRow; rowIndex < bottomRow; rowIndex++) {
      tile = room.tileGrid[rightColumn][rowIndex];
      tile.setBackgroundSprite(floorSprite);
      if (!tile.decorationSprite) {
        tile.setDecorationSprite(wallEWSprite);
      }
    }
    for (columnIndex = leftColumn; columnIndex < rightColumn; columnIndex++) {
      for (floorColumnList = room.tileGrid[columnIndex], rowIndex = topRow; rowIndex < bottomRow; rowIndex++) {
        tile = floorColumnList[rowIndex];
        tile.setBackgroundSprite(floorSprite);
      }
    }
    for (doorIndex = 0; doorIndex < doorList.length; doorIndex++) {
      door = doorList[doorIndex];
      tile = room.tileGrid[door.tileColumn][door.tileRow];
      tile.setBackgroundSprite(floorSprite);
      if (door.horizontalPassage) {
        if (door.isOpen) {
          tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.doorSprites.doorOpenASprite));
        } else {
          tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.doorSprites.doorClosedASprite));
        }
      } else {
        if (door.isOpen) {
          tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.doorSprites.doorOpenBSprite));
        } else {
          tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.doorSprites.doorClosedBSprite));
        }
      }
    }
    if (room.stairs) {
      tile = room.tileGrid[room.stairs.tileColumn][room.stairs.tileRow];
      tile.setBackgroundSprite(floorSprite);
      if (room.stairs.isVerticalStairs) {
        if (room.stairs.showsStairs) {
          tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.stairs.stairsDownNSSprite));
        } else {
          tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.stairs.stairDoorASprite));
        }
      } else {
        if (room.stairs.showsStairs) {
          tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.stairs.stairsDownEWSprite));
        } else {
          tile.setDecorationSprite(game.terrainSprites.getSprite(room.theme.stairs.stairDoorBSprite));
        }
      }
    }
    decorationSets = room.theme.decorationSets;
    tileGrid = room.tileGrid;
    decorations = game.decorations;
    if (!(!decorationSets || 0 === decorationSets.length || 0.2 > decorations.seededRandom.random() || !(decorationSet = 1 === decorationSets.length ? decorationSets[0] : randomIntFrom(decorations.seededRandom, decorationSets.length)))) {
      if (decorationSet.floorDecorations && 0 < decorationSet.floorDecorations.length) {
        if (decorationColumn = room.tileColumn, decorationRow = room.tileRow, rowLimit = decorationRow + room.heightInTiles - 1, decorationColumn = decorationColumn + 1 + randomIntFrom(decorations.seededRandom, decorationColumn + room.widthInTiles - 1 - decorationColumn - 2), decorationRow = decorationRow + 1 + randomIntFrom(decorations.seededRandom, rowLimit - decorationRow - 2), setVector(decorations.spawnPointScratch, decorationColumn, decorationRow), spawnPoint = decorations.spawnPointScratch, tile = tileGrid[spawnPoint.x][spawnPoint.y], tile) {
          if (!tile.decorationSprite) {
            if (floorSpriteName = decorationSet.floorDecorations[randomIntFrom(decorations.seededRandom, decorationSet.floorDecorations.length)]) {
              tile.setDecorationSprite(game.terrainSprites.getSprite(floorSpriteName));
            } else {
              console.log("failed to select floor sprite.");
            }
          }
        } else {
          console.log("invalid level tile. col=" + spawnPoint.x + " row=" + spawnPoint.y);
        }
      }
      if (0.5 > decorations.seededRandom.random()) {
        wallPoint = decorations.pickNorthWallPoint(room);
        wallDecorations = decorationSet.horizontalWallDecorations;
      } else {
        wallPoint = decorations.pickWestWallPoint(room);
        wallDecorations = decorationSet.verticalWallDecorations;
      }
      if (wallPoint && wallDecorations && 0 !== wallDecorations.length && canPlaceRoomObject(room, wallPoint)) {
        if (tile = tileGrid[wallPoint.x][wallPoint.y], tile) {
          if (!tile.cachedBackgroundSprite) {
            if (wallSpriteName = wallDecorations[randomIntFrom(decorations.seededRandom, wallDecorations.length)]) {
              tile.cachedBackgroundSprite = game.terrainSprites.getSprite(wallSpriteName);
            } else {
              console.log("failed to select wall sprite.");
            }
          }
        } else {
          console.log("invalid level tile. col=" + wallPoint.x + " row=" + wallPoint.y);
        }
      }
    }
    if (3 === room.encounterType) {
      for (innerLeftColumn = room.tileColumn + 1, innerRightColumn = innerLeftColumn + room.widthInTiles, innerTopRow = room.tileRow + 1, innerBottomRow = innerTopRow + room.heightInTiles, columnIndex = innerLeftColumn; columnIndex < innerRightColumn; columnIndex++) {
        for (columnList = room.tileGrid[columnIndex], rowIndex = innerTopRow; rowIndex < innerBottomRow; rowIndex++) {
          if (0.8 > Math.random()) {
            goldAmount = 2 * rollGoldDrop();
            if (0 < goldAmount) {
              goldTile = columnList[rowIndex];
              game.goldDrops.drops.push(new GoldDrop(goldAmount, goldTile.getPixelX(), goldTile.getPixelY(), room));
            }
          }
        }
      }
    }
  }
}
export function clampPointToRoom(room, position, padding) {
  if (position) {
    var positionX = position.x,
      positionY = position.y,
      minX = (room.tileColumn - 1) * TILE_SIZE + padding,
      maxX = roomRightPixels(room) - padding,
      minY = (room.tileRow - 1) * TILE_SIZE + padding, maxY;
    maxY = roomBottomPixels(room) - padding;
    if (positionX < minX) {
      positionX = minX;
    } else {
      if (positionX > maxX) {
        positionX = maxX;
      }
    }
    if (positionY < minY) {
      positionY = minY;
    } else {
      if (positionY > maxY) {
        positionY = maxY;
      }
    }
    setVector(position, positionX, positionY);
  }
}
export function isPointNearDoor(room, position) {
  if (!room.doorList) {
    return false;
  }
  var doorIndex;
  for (doorIndex = 0; doorIndex < room.doorList.length; doorIndex++) {
    if (distanceToPoint(position, room.doorList[doorIndex].pixelColumn, room.doorList[doorIndex].pixelRow) < TILE_SIZE) {
      return true;
    }
  }
  return false;
}
export function canPlaceRoomObject(room, point) {
  var tileColumn = point.x,
    tileRow = point.y,
    doorIndex;
  for (doorIndex = 0; doorIndex < room.doorList.length; doorIndex++) {
    if (tileColumn === room.doorList[doorIndex].tileColumn && tileRow === room.doorList[doorIndex].tileRow) {
      return false;
    }
  }
  return room.stairs && tileColumn === room.stairs.tileColumn && tileRow === room.stairs.tileRow ? false : true;
}
export function DungeonDoor(leadsTo) {
  this.pixelRow = this.pixelColumn = this.tileRow = this.tileColumn = 0;
  this.isOpen = false;
  this.horizontalPassage = true;
  this.leadsTo = leadsTo;
  this.hallway = null;
}
export function DungeonStairs(leadsTo) {
  this.leadsTo = leadsTo;
  this.pixelRow = this.pixelColumn = this.tileRow = this.tileColumn = 0;
  this.showsStairs = this.isVerticalStairs = true;
}
export function positionStairs(stairs, tileColumn, tileRow) {
  stairs.tileColumn = tileColumn;
  stairs.tileRow = tileRow;
  stairs.pixelColumn = tileColumn * TILE_SIZE;
  stairs.pixelRow = tileRow * TILE_SIZE;
}
export function DungeonHallway(roomA, doorA, roomB, doorB) {
  this.hallwayId = 0;
  this.roomA = roomA;
  this.doorA = doorA;
  this.roomB = roomB;
  this.doorB = doorB;
  this.pathTiles = [];
  this.tileGrid = this.theme = null;
  this.discovered = false;
}
export function getOppositeDoor(hallway, door) {
  if (door === hallway.doorA) {
    return hallway.doorB;
  }
  if (door === hallway.doorB) {
    return hallway.doorA;
  }
  console.log("failed to find opposite door in hallway");
  return null;
}
export function revealHallway(hallway, discovered) {
  var shouldReveal = discovered && !hallway.discovered;
  hallway.discovered = discovered;
  if (shouldReveal) {
    var pathTiles = hallway.pathTiles,
      pathTile,
      tile,
      pathIndex,
      floorSprite = game.terrainSprites.getSprite(hallway.theme.floor),
      wallNSSprite = game.terrainSprites.getSprite(hallway.theme.wallSprites.wallNS),
      wallEWSprite = game.terrainSprites.getSprite(hallway.theme.wallSprites.wallEW),
      wallNWSprite = game.terrainSprites.getSprite(hallway.theme.wallSprites.wallNW),
      wallSWSprite = game.terrainSprites.getSprite(hallway.theme.wallSprites.wallSW),
      wallNESprite = game.terrainSprites.getSprite(hallway.theme.wallSprites.wallNE),
      wallESSprite = game.terrainSprites.getSprite(hallway.theme.wallSprites.wallES),
      wallNEWSprite = game.terrainSprites.getSprite(hallway.theme.wallSprites.wallNEW),
      wallESWSprite = game.terrainSprites.getSprite(hallway.theme.wallSprites.wallESW),
      wallNESSprite = game.terrainSprites.getSprite(hallway.theme.wallSprites.wallNES),
      wallNSWSprite = game.terrainSprites.getSprite(hallway.theme.wallSprites.wallNSW);
    for (pathIndex = 0; pathIndex < pathTiles.length; pathIndex++) {
      pathTile = pathTiles[pathIndex];
      tile = hallway.tileGrid[pathTile.x][pathTile.y];
      tile.setBackgroundSprite(floorSprite);
    }
    var previousPathTile = null,
      nextPathTile = null,
      tileColumn,
      tileRow,
      previousIsNorth, previousIsSouth,
      previousIsWest,
      previousIsEast,
      nextIsNorth,
      nextIsSouth,
      nextIsEast,
      nextIsWest;
    for (pathIndex = 0; pathIndex < pathTiles.length; pathIndex++) {
      pathTile = pathTiles[pathIndex];
      nextPathTile = pathIndex + 1 < pathTiles.length ? pathTiles[pathIndex + 1] : null;
      tileColumn = pathTile.x;
      tileRow = pathTile.y;
      if (!previousPathTile) {
        tile = hallway.tileGrid[tileColumn][tileRow];
        tile.setBackgroundSprite(floorSprite);
        if (hallway.doorA.horizontalPassage) {
          if (hallway.doorA.isOpen) {
            tile.setDecorationSprite(game.terrainSprites.getSprite(hallway.theme.doorSprites.doorOpenASprite));
          } else {
            tile.setDecorationSprite(game.terrainSprites.getSprite(hallway.theme.doorSprites.doorClosedASprite));
          }
        } else {
          if (hallway.doorA.isOpen) {
            tile.setDecorationSprite(game.terrainSprites.getSprite(hallway.theme.doorSprites.doorOpenBSprite));
          } else {
            tile.setDecorationSprite(game.terrainSprites.getSprite(hallway.theme.doorSprites.doorClosedBSprite));
          }
        }
        nextIsNorth = tileRow > nextPathTile.y;
        nextIsSouth = tileRow < nextPathTile.y;
        nextIsWest = tileColumn > nextPathTile.x;
        nextIsEast = tileColumn < nextPathTile.x;
        if (nextIsWest) {
          tile = hallway.tileGrid[tileColumn][tileRow - 1];
          tile.setBackgroundSprite(floorSprite);
          tile.setDecorationSprite(wallNEWSprite);
          tile = hallway.tileGrid[tileColumn][tileRow + 1];
          tile.setBackgroundSprite(floorSprite);
          tile.setDecorationSprite(wallNEWSprite);
        } else {
          if (nextIsEast) {
            tile = hallway.tileGrid[tileColumn][tileRow - 1];
            tile.setBackgroundSprite(floorSprite);
            tile.setDecorationSprite(wallESWSprite);
            tile = hallway.tileGrid[tileColumn][tileRow + 1];
            tile.setBackgroundSprite(floorSprite);
            tile.setDecorationSprite(wallESWSprite);
          } else {
            if (nextIsNorth) {
              tile = hallway.tileGrid[tileColumn + 1][tileRow];
              tile.setBackgroundSprite(floorSprite);
              tile.setDecorationSprite(wallNESSprite);
              tile = hallway.tileGrid[tileColumn - 1][tileRow];
              tile.setBackgroundSprite(floorSprite);
              tile.setDecorationSprite(wallNESSprite);
            } else {
              if (nextIsSouth) {
                tile = hallway.tileGrid[tileColumn + 1][tileRow];
                tile.setBackgroundSprite(floorSprite);
                tile.setDecorationSprite(wallNSWSprite);
                tile = hallway.tileGrid[tileColumn - 1][tileRow];
                tile.setBackgroundSprite(floorSprite);
                tile.setDecorationSprite(wallNSWSprite);
              }
            }
          }
        }
      }
      if (!nextPathTile) {
        tile = hallway.tileGrid[tileColumn][tileRow];
        tile.setBackgroundSprite(floorSprite);
        if (hallway.doorB.horizontalPassage) {
          if (hallway.doorB.isOpen) {
            tile.setDecorationSprite(game.terrainSprites.getSprite(hallway.theme.doorSprites.doorOpenASprite));
          } else {
            tile.setDecorationSprite(game.terrainSprites.getSprite(hallway.theme.doorSprites.doorClosedASprite));
          }
        } else {
          if (hallway.doorB.isOpen) {
            tile.setDecorationSprite(game.terrainSprites.getSprite(hallway.theme.doorSprites.doorOpenBSprite));
          } else {
            tile.setDecorationSprite(game.terrainSprites.getSprite(hallway.theme.doorSprites.doorClosedBSprite));
          }
        }
        previousIsSouth = tileRow < previousPathTile.y;
        previousIsNorth = tileRow > previousPathTile.y;
        previousIsEast = tileColumn < previousPathTile.x;
        if (previousIsWest = tileColumn > previousPathTile.x) {
          tile = hallway.tileGrid[tileColumn][tileRow - 1];
          tile.setBackgroundSprite(floorSprite);
          tile.setDecorationSprite(wallNEWSprite);
          tile = hallway.tileGrid[tileColumn][tileRow + 1];
          tile.setBackgroundSprite(floorSprite);
          tile.setDecorationSprite(wallNEWSprite);
        } else {
          if (previousIsEast) {
            tile = hallway.tileGrid[tileColumn][tileRow - 1];
            tile.setBackgroundSprite(floorSprite);
            tile.setDecorationSprite(wallESWSprite);
            tile = hallway.tileGrid[tileColumn][tileRow + 1];
            tile.setBackgroundSprite(floorSprite);
            tile.setDecorationSprite(wallESWSprite);
          } else {
            if (previousIsNorth) {
              tile = hallway.tileGrid[tileColumn + 1][tileRow];
              tile.setBackgroundSprite(floorSprite);
              tile.setDecorationSprite(wallNESSprite);
              tile = hallway.tileGrid[tileColumn - 1][tileRow];
              tile.setBackgroundSprite(floorSprite);
              tile.setDecorationSprite(wallNESSprite);
            } else {
              if (previousIsSouth) {
                tile = hallway.tileGrid[tileColumn + 1][tileRow];
                tile.setBackgroundSprite(floorSprite);
                tile.setDecorationSprite(wallNSWSprite);
                tile = hallway.tileGrid[tileColumn - 1][tileRow];
                tile.setBackgroundSprite(floorSprite);
                tile.setDecorationSprite(wallNSWSprite);
              }
            }
          }
        }
      }
      if (previousPathTile && nextPathTile) {
        previousIsSouth = tileRow < previousPathTile.y;
        previousIsNorth = tileRow > previousPathTile.y;
        previousIsEast = tileColumn < previousPathTile.x;
        previousIsWest = tileColumn > previousPathTile.x;
        nextIsNorth = tileRow > nextPathTile.y;
        nextIsSouth = tileRow < nextPathTile.y;
        nextIsWest = tileColumn > nextPathTile.x;
        nextIsEast = tileColumn < nextPathTile.x;
        if (previousIsSouth && nextIsWest) {
          paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow], floorSprite, wallEWSprite, false);
          paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow - 1], floorSprite, wallNWSprite, true);
          paintHallwayTile(hallway.tileGrid[tileColumn][tileRow - 1], floorSprite, wallNSSprite, false);
          paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow + 1], floorSprite, wallNWSprite, true);
        } else {
          if (previousIsSouth && nextIsNorth) {
            paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow], floorSprite, wallEWSprite, false);
            paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow], floorSprite, wallEWSprite, false);
          } else {
            if (previousIsSouth && nextIsEast) {
              paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow], floorSprite, wallEWSprite, false);
              paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow - 1], floorSprite, wallSWSprite, true);
              paintHallwayTile(hallway.tileGrid[tileColumn][tileRow - 1], floorSprite, wallNSSprite, false);
              paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow + 1], floorSprite, wallSWSprite, true);
            } else {
              if (previousIsNorth && nextIsWest) {
                paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow], floorSprite, wallEWSprite, false);
                paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow + 1], floorSprite, wallNESprite, true);
                paintHallwayTile(hallway.tileGrid[tileColumn][tileRow + 1], floorSprite, wallNSSprite, false);
                paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow - 1], floorSprite, wallNESprite, true);
              } else {
                if (previousIsNorth && nextIsSouth) {
                  paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow], floorSprite, wallEWSprite, false);
                  paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow], floorSprite, wallEWSprite, false);
                } else {
                  if (previousIsNorth && nextIsEast) {
                    paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow], floorSprite, wallEWSprite, false);
                    paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow + 1], floorSprite, wallESSprite, true);
                    paintHallwayTile(hallway.tileGrid[tileColumn][tileRow + 1], floorSprite, wallNSSprite, false);
                    paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow - 1], floorSprite, wallESSprite, true);
                  } else {
                    if (previousIsEast && nextIsWest) {
                      paintHallwayTile(hallway.tileGrid[tileColumn][tileRow - 1], floorSprite, wallNSSprite, false);
                      paintHallwayTile(hallway.tileGrid[tileColumn][tileRow + 1], floorSprite, wallNSSprite, false);
                    } else {
                      if (previousIsEast && nextIsSouth) {
                        paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow], floorSprite, wallEWSprite, false);
                        paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow - 1], floorSprite, wallSWSprite, true);
                        paintHallwayTile(hallway.tileGrid[tileColumn][tileRow - 1], floorSprite, wallNSSprite, false);
                        paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow + 1], floorSprite, wallSWSprite, true);
                      } else {
                        if (previousIsEast && nextIsNorth) {
                          paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow], floorSprite, wallEWSprite, false);
                          paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow + 1], floorSprite, wallESSprite, true);
                          paintHallwayTile(hallway.tileGrid[tileColumn][tileRow + 1], floorSprite, wallNSSprite, false);
                          paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow - 1], floorSprite, wallESSprite, true);
                        } else {
                          if (previousIsWest && nextIsNorth) {
                            paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow], floorSprite, wallEWSprite, false);
                            paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow + 1], floorSprite, wallNESprite, true);
                            paintHallwayTile(hallway.tileGrid[tileColumn][tileRow + 1], floorSprite, wallNSSprite, false);
                            paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow - 1], floorSprite, wallNESprite, true);
                          } else {
                            if (previousIsWest && nextIsSouth) {
                              paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow], floorSprite, wallEWSprite, false);
                              paintHallwayTile(hallway.tileGrid[tileColumn + 1][tileRow - 1], floorSprite, wallNWSprite, true);
                              paintHallwayTile(hallway.tileGrid[tileColumn][tileRow - 1], floorSprite, wallNSSprite, false);
                              paintHallwayTile(hallway.tileGrid[tileColumn - 1][tileRow + 1], floorSprite, wallNWSprite, true);
                            } else {
                              if (previousIsWest && nextIsEast) {
                                paintHallwayTile(hallway.tileGrid[tileColumn][tileRow - 1], floorSprite, wallNSSprite, false);
                                paintHallwayTile(hallway.tileGrid[tileColumn][tileRow + 1], floorSprite, wallNSSprite, false);
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      previousPathTile = pathTile;
    }
  }
}
export function paintHallwayTile(tile, floorSprite, wallSprite, forceDecoration) {
  if (1 !== tile.floorType) {
    tile.setBackgroundSprite(floorSprite);
    if (!(!forceDecoration && tile.decorationSprite)) {
      tile.setDecorationSprite(wallSprite);
    }
  }
}
export function initializeWorldRooms() {
  DungeonTile.prototype.getTileColumn = function () {
    return this.tileColumn;
  };
  DungeonTile.prototype.getTileRow = function () {
    return this.tileRow;
  };
  DungeonTile.prototype.getPixelX = function () {
    return this.pixelColumn;
  };
  DungeonTile.prototype.getPixelY = function () {
    return this.pixelRow;
  };
  DungeonTile.prototype.setBackgroundSprite = function (sprite) {
    this.backgroundSprite = sprite;
  };
  DungeonTile.prototype.setDecorationSprite = function (sprite) {
    this.decorationSprite = sprite;
  };
  DungeonTile.prototype.setRemainingEffectDamage = function (remainingEffectDamage) {
    this.remainingEffectDamage = remainingEffectDamage;
  };
  EMPTY_TILE = 0;
  DungeonRoom.prototype.applyTheme = function (theme, tileGrid) {
    this.theme = theme;
    this.tileGrid = tileGrid;
  };
  DungeonRoom.prototype.moveUpLeft = function () {
    if (1 < this.tileColumn) {
      this.tileColumn--;
    }
    if (1 < this.tileRow) {
      this.tileRow--;
    }
  };
  DungeonRoom.prototype.shiftLeft = function () {
    if (1 < this.tileColumn) {
      this.tileColumn--;
    }
  };
  DungeonRoom.prototype.shiftUp = function () {
    if (1 < this.tileRow) {
      this.tileRow--;
    }
  };
  DungeonRoom.prototype.paintTiles = function (tileGrid) {
    /** @type {{paintFloor: (grid: unknown) => void}} */ (/** @type {unknown} */ (this)).paintFloor(tileGrid);
    var columnIndex, rowIndex, columnList;
    rowIndex = this.tileRow - 1;
    for (columnIndex = this.tileColumn - 1; columnIndex < this.tileColumn + this.widthInTiles + 1; columnIndex++) {
      tileGrid[columnIndex][rowIndex].floorType = 2;
    }
    rowIndex = this.tileRow + this.heightInTiles;
    for (columnIndex = this.tileColumn - 1; columnIndex < this.tileColumn + this.widthInTiles + 1; columnIndex++) {
      tileGrid[columnIndex][rowIndex].floorType = 2;
    }
    columnIndex = this.tileColumn - 1;
    columnList = tileGrid[columnIndex];
    for (rowIndex = this.tileRow - 1; rowIndex < this.tileRow + this.heightInTiles + 1; rowIndex++) {
      columnList[rowIndex].floorType = 2;
    }
    columnIndex = this.tileColumn + this.widthInTiles;
    columnList = tileGrid[columnIndex];
    for (rowIndex = this.tileRow - 1; rowIndex < this.tileRow + this.heightInTiles + 1; rowIndex++) {
      columnList[rowIndex].floorType = 2;
    }
  };
  DungeonRoom.prototype.paintFloor = function (tileGrid) {
    var columnList,
      columnIndex,
      rightColumn = this.tileColumn + this.widthInTiles,
      bottomRow = this.tileRow + this.heightInTiles,
      rowIndex;
    for (columnIndex = this.tileColumn; columnIndex < rightColumn; columnIndex++) {
      for (columnList = tileGrid[columnIndex], rowIndex = this.tileRow; rowIndex < bottomRow; rowIndex++) {
        columnList[rowIndex].floorType = 1;
      }
    }
  };
  DungeonRoom.prototype.squaredDistanceToRoom = function (otherRoom) {
    var deltaX = otherRoom.tileColumn + otherRoom.widthInTiles / 2 - (this.tileColumn + this.widthInTiles / 2), deltaY;
    deltaY = otherRoom.tileRow + otherRoom.heightInTiles / 2 - (this.tileRow + this.heightInTiles / 2);
    return deltaX * deltaX + deltaY * deltaY;
  };
  DungeonHallway.prototype.applyTheme = function (theme, tileGrid) {
    this.theme = theme;
    this.tileGrid = tileGrid;
  };
  DungeonHallway.prototype.paintTiles = function (tileGrid) {
    var pathTile, pathIndex, eastColumnList;
    for (pathIndex = 0; pathIndex < this.pathTiles.length; pathIndex++) {
      pathTile = this.pathTiles[pathIndex];
      var tileColumn = pathTile.x, tileRow;
      tileRow = pathTile.y;
      var westColumnList = tileGrid[tileColumn - 1],
        centerColumnList = tileGrid[tileColumn],
        eastColumnList = tileGrid[tileColumn + 1];
      westColumnList[tileRow - 1].floorType = 2;
      westColumnList[tileRow].floorType = 2;
      westColumnList[tileRow + 1].floorType = 2;
      centerColumnList[tileRow - 1].floorType = 2;
      centerColumnList[tileRow].floorType = 2;
      centerColumnList[tileRow + 1].floorType = 2;
      eastColumnList[tileRow - 1].floorType = 2;
      eastColumnList[tileRow].floorType = 2;
      eastColumnList[tileRow + 1].floorType = 2;
    }
    /** @type {{paintFloor: (grid: unknown) => void}} */ (/** @type {unknown} */ (this)).paintFloor(tileGrid);
  };
  DungeonHallway.prototype.paintFloor = function (tileGrid) {
    var pathTile, pathIndex;
    for (pathIndex = 0; pathIndex < this.pathTiles.length; pathIndex++) {
      pathTile = this.pathTiles[pathIndex];
      tileGrid[pathTile.x][pathTile.y].floorType = 1;
    }
    tileGrid[this.doorA.tileColumn][this.doorA.tileRow].floorType = 3;
    tileGrid[this.doorB.tileColumn][this.doorB.tileRow].floorType = 3;
  };
}
