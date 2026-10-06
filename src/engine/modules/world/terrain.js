/** 世界地形定义、噪声生成与滚动区块。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { SeededRandom, SimplexNoise, randomInt, setVector } from "../core/math.js";
import { game } from "../runtime/game.js";
import { WORLD_BLOCK_COLUMNS, WORLD_BLOCK_ROWS, WORLD_ORIGIN_COLUMN, WORLD_ORIGIN_ROW, findCastle, findCastleByRegion } from "./regions.js";
import { Shop, randomShopSprite } from "./dungeons.js";
import { TILE_SIZE } from "../core/screen-layout.js";
import { WORLD_TILE_VISUAL_SLOTS, installTileVisualAccessors } from './tile-visuals.js';
export var OCEAN_TERRAIN_CODE, shoreTileLookup, L2_ForestCanopy01Sprite, L2_ForestCanopy03Sprite, L2_ForestMaple03Sprite, L2_ForestPine01Sprite, L2_ForestPine02Sprite, L2_ForestPine03Sprite, L2_ForestPine07Sprite, L2_ForestPine08Sprite, L2_ForestPine09Sprite, L2_ForestMixed05Sprite, L2_ForestWillow03Sprite, L1_HillsSprite, L2_MountainBigEarth01Sprite, L2_MountainBigRock01Sprite, L2_MountainBigVolcano01Sprite, L2_MountainBigVolcanoActive01Sprite, L2_MountainBigVolcanoErupt01Sprite, L2_MountainRocky01Sprite, L2_MountainRocky02Sprite, L2_MountainRocky03Sprite, L2_MountainRocky04Sprite, L2_MountainRocky05Sprite, L2_Terrain041Sprite, L1_Terrain033Sprite, L2_MountainDesert01Sprite, L2_MountainDesert02Sprite, L2_MountainDesert03Sprite, L2_MountainDesert04Sprite, L2_MountainDesert05Sprite, L2_MountainDesert06Sprite, L2_ForestPine04Sprite, L2_ForestPine05Sprite, L2_ForestPine06Sprite, L2_Terrain040Sprite, L1_Terrain039Sprite;
export function FractalNoise(seed, lacunarity, persistence, octaveCount, baseFrequency) {
  var noise = this.simplexNoise = new SimplexNoise(),
    seededRandom,
    randomValues;
  seededRandom = new SeededRandom(seed);
  randomValues = [];
  for (var tableIndex = 0; 256 > tableIndex; tableIndex++) {
    randomValues[tableIndex] = Math.floor(256 * (/** @type {{random: () => number}} */ (/** @type {unknown} */ (seededRandom))).random());
  }
  noise.permutation = [];
  for (tableIndex = 0; 512 > tableIndex; tableIndex++) {
    noise.permutation[tableIndex] = randomValues[tableIndex & 255];
  }
  this.initialAmplitude = 1;
  this.lacunarity = lacunarity;
  this.persistence = persistence;
  this.octaveCount = octaveCount;
  this.baseFrequency = baseFrequency;
}
export function sampleNoise(noise, inputX, inputY) {
  var result = 0,
    amplitude = noise.initialAmplitude,
    frequency = noise.baseFrequency,
    octaveIndex;
  for (octaveIndex = 0; octaveIndex < noise.octaveCount; octaveIndex++) {
    var simplex = noise.simplexNoise,
      scaledX = inputX * frequency,
      scaledY = inputY * frequency;
    var skewSum = 0.5 * (scaledX + scaledY) * (simplex.sqrt3 - 1);
    var cellX = Math.floor(scaledX + skewSum);
    var cellY = Math.floor(scaledY + skewSum);
    var unskewFactor = (3 - simplex.sqrt3) / 6;
    var unskewSum = (cellX + cellY) * unskewFactor;
    var cellOriginX = cellX - unskewSum;
    var cellOriginY = cellY - unskewSum;
    var corner0X = scaledX - cellOriginX;
    var corner0Y = scaledY - cellOriginY;
    var corner1OffsetI, corner1OffsetJ;
    if (corner0X > corner0Y) {
      corner1OffsetI = 1;
      corner1OffsetJ = 0;
    } else {
      corner1OffsetI = 0;
      corner1OffsetJ = 1;
    }
    var corner1X = corner0X - corner1OffsetI + unskewFactor;
    var corner1Y = corner0Y - corner1OffsetJ + unskewFactor;
    var corner2X = corner0X - 1 + 2 * unskewFactor;
    var corner2Y = corner0Y - 1 + 2 * unskewFactor;
    var permIndexI = cellX & 255;
    var permIndexJ = cellY & 255;
    var gradientIndex0 = simplex.permutation[permIndexI + simplex.permutation[permIndexJ]] % 12;
    var gradientIndex1 = simplex.permutation[permIndexI + corner1OffsetI + simplex.permutation[permIndexJ + corner1OffsetJ]] % 12;
    var gradientIndex2 = simplex.permutation[permIndexI + 1 + simplex.permutation[permIndexJ + 1]] % 12;
    var corner0T = 0.5 - corner0X * corner0X - corner0Y * corner0Y;
    var corner0Contribution;
    if (0 > corner0T) {
      corner0Contribution = 0;
    } else {
      corner0T *= corner0T;
      corner0Contribution = corner0T * corner0T * (simplex.gradients[gradientIndex0][0] * corner0X + simplex.gradients[gradientIndex0][1] * corner0Y);
    }
    var corner1T = 0.5 - corner1X * corner1X - corner1Y * corner1Y;
    var corner1Contribution;
    if (0 > corner1T) {
      corner1Contribution = 0;
    } else {
      corner1T *= corner1T;
      corner1Contribution = corner1T * corner1T * (simplex.gradients[gradientIndex1][0] * corner1X + simplex.gradients[gradientIndex1][1] * corner1Y);
    }
    var corner2T = 0.5 - corner2X * corner2X - corner2Y * corner2Y;
    var corner2Contribution;
    if (0 > corner2T) {
      corner2Contribution = 0;
    } else {
      corner2T *= corner2T;
      corner2Contribution = corner2T * corner2T * (simplex.gradients[gradientIndex2][0] * corner2X + simplex.gradients[gradientIndex2][1] * corner2Y);
    }
    result += 70 * amplitude * (corner0Contribution + corner1Contribution + corner2Contribution);
    amplitude *= noise.persistence;
    frequency *= noise.lacunarity;
  }
  return result;
}
export function TerrainBiome() {
  this.densityNoise = new FractalNoise(5, 2, 0.5, 4, 0.003);
  this.variantNoise = new FractalNoise(2, 2, 0.5, 2, 1E-4);
  this.tileSpriteNames = [];
}
export function addTerrainTileSet(biome, spriteName) {
  biome.tileSpriteNames.push(spriteName);
}
export function DecorationBiome() {
  this.densityNoise = new FractalNoise(9, 2, 0.5, 4, 0.003);
  this.variantNoise = new FractalNoise(7, 2, 0.9, 1, 0.02);
  this.tileSpriteNames = [];
}
export function addDecorationTileSet(biome, spriteName) {
  biome.tileSpriteNames.push(spriteName);
}
export function WorldGenerator(widthInTiles, heightInTiles) {
  this.terrainNoise = new FractalNoise(10, 2.012, 0.5, 5, 1E-4);
  this.detailNoise = new FractalNoise(2, 2, 0.5, 3, 5E-4);
  this.terrainBiome = new TerrainBiome();
  addTerrainTileSet(this.terrainBiome, L2_ForestCanopy01Sprite);
  addTerrainTileSet(this.terrainBiome, L2_ForestCanopy03Sprite);
  addTerrainTileSet(this.terrainBiome, L2_ForestPine01Sprite);
  addTerrainTileSet(this.terrainBiome, L2_ForestPine02Sprite);
  addTerrainTileSet(this.terrainBiome, L2_ForestPine03Sprite);
  addTerrainTileSet(this.terrainBiome, L2_ForestPine07Sprite);
  addTerrainTileSet(this.terrainBiome, L2_ForestPine08Sprite);
  addTerrainTileSet(this.terrainBiome, L2_ForestPine09Sprite);
  addTerrainTileSet(this.terrainBiome, L2_ForestWillow03Sprite);
  addTerrainTileSet(this.terrainBiome, L2_ForestMixed05Sprite);
  addTerrainTileSet(this.terrainBiome, L2_ForestMaple03Sprite);
  this.decorationBiome = new DecorationBiome();
  addDecorationTileSet(this.decorationBiome, L2_MountainBigEarth01Sprite);
  addDecorationTileSet(this.decorationBiome, L2_MountainBigRock01Sprite);
  addDecorationTileSet(this.decorationBiome, L2_MountainBigVolcano01Sprite);
  addDecorationTileSet(this.decorationBiome, L2_MountainBigVolcanoActive01Sprite);
  addDecorationTileSet(this.decorationBiome, L2_MountainBigVolcanoErupt01Sprite);
  addDecorationTileSet(this.decorationBiome, L2_MountainRocky01Sprite);
  addDecorationTileSet(this.decorationBiome, L2_MountainRocky02Sprite);
  addDecorationTileSet(this.decorationBiome, L2_MountainRocky03Sprite);
  addDecorationTileSet(this.decorationBiome, L2_MountainRocky04Sprite);
  addDecorationTileSet(this.decorationBiome, L2_MountainRocky05Sprite);
  addDecorationTileSet(this.decorationBiome, L2_Terrain041Sprite);
  addDecorationTileSet(this.decorationBiome, L1_HillsSprite);
  this.snowTerrainBiome = new TerrainBiome();
  addTerrainTileSet(this.snowTerrainBiome, L2_ForestPine04Sprite);
  addTerrainTileSet(this.snowTerrainBiome, L2_ForestPine05Sprite);
  addTerrainTileSet(this.snowTerrainBiome, L2_ForestPine06Sprite);
  this.snowDecorationBiome = new DecorationBiome();
  addDecorationTileSet(this.snowDecorationBiome, L1_Terrain039Sprite);
  addDecorationTileSet(this.snowDecorationBiome, L2_Terrain040Sprite);
  this.mountainDesertDecorationBiome = new DecorationBiome();
  addDecorationTileSet(this.mountainDesertDecorationBiome, L2_MountainDesert01Sprite);
  addDecorationTileSet(this.mountainDesertDecorationBiome, L2_MountainDesert02Sprite);
  addDecorationTileSet(this.mountainDesertDecorationBiome, L1_Terrain033Sprite);
  addDecorationTileSet(this.mountainDesertDecorationBiome, L2_MountainDesert03Sprite);
  addDecorationTileSet(this.mountainDesertDecorationBiome, L2_MountainDesert04Sprite);
  addDecorationTileSet(this.mountainDesertDecorationBiome, L2_MountainDesert05Sprite);
  addDecorationTileSet(this.mountainDesertDecorationBiome, L2_MountainDesert06Sprite);
  this.widthInTiles = widthInTiles;
  this.heightInTiles = heightInTiles;
  this.mapEdgeSpriteName = this.lockedRegionSpriteName = "L1_Terrain015.PNG";
}
export function populateWorldBlock(generator, block) {
  var regionCastle = findCastleByRegion(block.regionColumn + "_" + block.regionRow),
    tileIndexColumn,
    tileIndexRow,
    worldOriginColumn = block.regionColumn * generator.widthInTiles,
    worldOriginRow = block.regionRow * generator.heightInTiles;
  for (tileIndexColumn = 0; tileIndexColumn <= generator.widthInTiles; tileIndexColumn++) {
    for (tileIndexRow = 0; tileIndexRow <= generator.heightInTiles; tileIndexRow++) {
      var terrainCode = getTerrainCode(generator, worldOriginColumn + tileIndexColumn, worldOriginRow + tileIndexRow, regionCastle),
        adjacentTile = undefined;
      if (adjacentTile = getBlockTile(block, tileIndexColumn - 1, tileIndexRow - 1)) {
        adjacentTile.quadBottomRightTerrainCode = terrainCode;
      }
      if (adjacentTile = getBlockTile(block, tileIndexColumn, tileIndexRow - 1)) {
        adjacentTile.quadBottomLeftTerrainCode = terrainCode;
      }
      if (adjacentTile = getBlockTile(block, tileIndexColumn - 1, tileIndexRow)) {
        adjacentTile.quadTopRightTerrainCode = terrainCode;
      }
      if (adjacentTile = getBlockTile(block, tileIndexColumn, tileIndexRow)) {
        adjacentTile.quadTopLeftTerrainCode = terrainCode;
      }
    }
  }
  for (tileIndexColumn = 0; tileIndexColumn < generator.widthInTiles; tileIndexColumn++) {
    for (tileIndexRow = 0; tileIndexRow < generator.heightInTiles; tileIndexRow++) {
      var shoreTile = getBlockTile(block, tileIndexColumn, tileIndexRow);
      var shoreSpriteName = undefined;
      if (!regionCastle || regionCastle.regionLocked) {
        shoreSpriteName = generator.lockedRegionSpriteName;
        shoreTile.terrainTypeKey = null;
        shoreTile.terrainMoveCost = 1E5;
      } else {
        var terrainTypeKey = shoreTile.quadTopLeftTerrainCode + shoreTile.quadTopRightTerrainCode + shoreTile.quadBottomLeftTerrainCode + shoreTile.quadBottomRightTerrainCode;
        shoreSpriteName = shoreTileLookup[terrainTypeKey];
        shoreTile.terrainTypeKey = terrainTypeKey;
        if (!shoreSpriteName) {
          console.log("no sprite found for key: [" + terrainTypeKey + "]");
          shoreSpriteName = shoreTileLookup.fallbackShoreSprite;
        }
        shoreTile.terrainMoveCost = "PPPP" === shoreTile.terrainTypeKey || "OOOO" === shoreTile.terrainTypeKey || "IIII" === shoreTile.terrainTypeKey ? 1E5 : 0;
      }
      var shoreSprite = game.terrainSprites.getSprite(shoreSpriteName);
      if (shoreSprite) {
        shoreTile.setBackgroundSprite(shoreSprite);
      }
    }
  }
  worldOriginColumn = block.regionColumn * generator.widthInTiles;
  worldOriginRow = block.regionRow * generator.heightInTiles;
  if (!regionCastle || regionCastle.regionLocked) {
    for (tileIndexColumn = 0; tileIndexColumn < generator.widthInTiles; tileIndexColumn++) {
      for (tileIndexRow = 0; tileIndexRow < generator.heightInTiles; tileIndexRow++) {
        var lockedTile = getBlockTile(block, tileIndexColumn, tileIndexRow);
        lockedTile.setDecorationSprite(null);
        lockedTile.terrainMoveCost = 1E5;
      }
    }
  } else {
    for (tileIndexColumn = 0; tileIndexColumn < generator.widthInTiles; tileIndexColumn++) {
      for (tileIndexRow = 0; tileIndexRow < generator.heightInTiles; tileIndexRow++) {
        var decoTile = getBlockTile(block, tileIndexColumn, tileIndexRow);
        var decoTerrainTypeKey = decoTile.terrainTypeKey;
        if (decoTerrainTypeKey) {
          var decoSprite = null,
            decoMoveCost = 0;
          if ("GGGG" === decoTerrainTypeKey) {
            if (decoSprite = generator.terrainBiome.getBackgroundSpriteAt(worldOriginColumn + tileIndexColumn, worldOriginRow + tileIndexRow)) {
              decoMoveCost = 10;
            } else {
              if (decoSprite = generator.decorationBiome.getDecorationSpriteAt(worldOriginColumn + tileIndexColumn, worldOriginRow + tileIndexRow)) {
                decoMoveCost = 1E4;
              }
            }
          } else {
            if ("DDDD" === decoTerrainTypeKey) {
              if (decoSprite = generator.mountainDesertDecorationBiome.getDecorationSpriteAt(worldOriginColumn + tileIndexColumn, worldOriginRow + tileIndexRow)) {
                decoMoveCost = 1E4;
              }
            } else {
              if ("SSSS" === decoTerrainTypeKey) {
                if (decoSprite = generator.snowTerrainBiome.getBackgroundSpriteAt(worldOriginColumn + tileIndexColumn, worldOriginRow + tileIndexRow)) {
                  decoMoveCost = 10;
                } else {
                  if (decoSprite = generator.snowDecorationBiome.getDecorationSpriteAt(worldOriginColumn + tileIndexColumn, worldOriginRow + tileIndexRow)) {
                    decoMoveCost = 1E4;
                  }
                }
              }
            }
          }
          if (decoSprite) {
            decoTile.terrainMoveCost += decoMoveCost;
            decoTile.setDecorationSprite(decoSprite);
          } else {
            decoTile.setDecorationSprite(null);
          }
        } else {
          decoTile.setDecorationSprite(null);
        }
      }
    }
  }
  var entranceTile, castleTile;
  if (regionCastle && !regionCastle.regionLocked) {
    var dungeon = game.dungeons.dungeonRegistry[block.regionColumn + "_" + block.regionRow] || null;
    if (dungeon) {
      var dungeonColumn = dungeon.getWorldColumn(),
        dungeonRow = dungeon.getWorldRow();
      entranceTile = game.world.getTileAtPixel(dungeonColumn, dungeonRow);
      if (entranceTile) {
        entranceTile.setDecorationSprite(game.terrainSprites.getSprite(dungeon.mapSprite));
      } else {
        console.log("no tile for: col=" + dungeonColumn + " row=" + dungeonRow);
        dungeon = null;
      }
    }
    if (dungeon) {
      var farm = game.farms.farmsById[dungeon.dungeonId];
      if (farm) {
        var farmTile = game.world.getTileAtPixel(farm.farmColumn, farm.farmRow);
        if (farmTile) {
          farmTile.setDecorationSprite(game.terrainSprites.getSprite(game.farms.farmSpriteName));
        }
      }
      generator.ensureShopForDungeon(dungeon);
    }
    var castle = findCastle(block.regionColumn + "_" + block.regionRow);
    if (castle) {
      var castlePixelX = castle.worldPixelX;
      var castlePixelY = castle.worldPixelY;
      castleTile = game.world.getTileAtPixel(castlePixelX, castlePixelY);
      if (castleTile) {
        castleTile.setDecorationSprite(game.terrainSprites.getSprite(game.castles.castleSpriteName));
      } else {
        console.log("no tile for: col=" + castlePixelX + " row=" + castlePixelY);
      }
    }
  }
  var edgeSprite = game.terrainSprites.getSprite(generator.mapEdgeSpriteName);
  var northCastle = findCastleByRegion(block.regionColumn + "_" + (block.regionRow - 1));
  var westCastle = findCastleByRegion(block.regionColumn - 1 + "_" + block.regionRow);
  var nwCastle = findCastleByRegion(block.regionColumn - 1 + "_" + (block.regionRow - 1));
  if (regionCastle != northCastle) {
    for (var edgeColumn = 0; edgeColumn < generator.widthInTiles; edgeColumn++) {
      var northEdgeTile = getBlockTile(block, edgeColumn, 0);
      northEdgeTile.setBackgroundSprite(edgeSprite);
      northEdgeTile.setDecorationSprite(null);
    }
  }
  if (regionCastle != westCastle) {
    for (var edgeRow = 0; edgeRow < generator.heightInTiles; edgeRow++) {
      var westEdgeTile = getBlockTile(block, 0, edgeRow);
      westEdgeTile.setBackgroundSprite(edgeSprite);
      westEdgeTile.setDecorationSprite(null);
    }
  }
  if (regionCastle === northCastle && regionCastle === westCastle && regionCastle != nwCastle) {
    var cornerTile = getBlockTile(block, 0, 0);
    cornerTile.setBackgroundSprite(edgeSprite);
    cornerTile.setDecorationSprite(null);
  }
}
export function getTerrainCode(generator, worldColumn, worldRow, regionCastle) {
  var noiseX = worldColumn * TILE_SIZE;
  var noiseY = worldRow * TILE_SIZE;
  var terrainNoiseValue = sampleNoise(generator.terrainNoise, noiseX, noiseY);
  if (!regionCastle || regionCastle.regionLocked) {
    if (0.5 > terrainNoiseValue) {
      var detailNoiseValue = sampleNoise(generator.detailNoise, noiseX, noiseY);
      if (-0.6 > detailNoiseValue) {
        return "P";
      }
    }
    return "D";
  }
  if (regionCastle.conquered) {
    if (0.5 > terrainNoiseValue) {
      detailNoiseValue = sampleNoise(generator.detailNoise, noiseX, noiseY);
      if (-0.6 > detailNoiseValue) {
        return OCEAN_TERRAIN_CODE;
      }
    }
    return "G";
  }
  if (0.5 > terrainNoiseValue) {
    detailNoiseValue = sampleNoise(generator.detailNoise, noiseX, noiseY);
    if (-0.6 > detailNoiseValue) {
      return "I";
    }
  }
  return "S";
}
export function WorldTile(worldColumn, worldRow) {
  this.worldColumn = worldColumn;
  this.worldRow = worldRow;
  this.pixelX = worldColumn * TILE_SIZE;
  this.pixelY = worldRow * TILE_SIZE;
  this.decorationSprite = this.backgroundSprite = null;
  this.terrainTypeKey = "GGGG";
  this.quadBottomRightTerrainCode = this.quadTopRightTerrainCode = this.quadBottomLeftTerrainCode = this.quadTopLeftTerrainCode = OCEAN_TERRAIN_CODE;
  this.terrainMoveCost = this.pathDistanceToDestination = 0;
}
export function WorldBlock(regionColumn, regionRow, generator) {
  this.tileGrid = [];
  this.regionColumn = regionColumn;
  this.regionRow = regionRow;
  this.heightInTiles = WORLD_BLOCK_ROWS;
  this.widthInTiles = WORLD_BLOCK_COLUMNS;
  this.tileOriginColumn = regionColumn * this.widthInTiles;
  this.tileOriginRow = regionRow * this.heightInTiles;
  this.tileEndColumn = this.tileOriginColumn + this.widthInTiles;
  this.tileEndRow = this.tileOriginRow + this.heightInTiles;
  this.pixelLeft = this.tileOriginColumn * TILE_SIZE;
  this.pixelRight = this.tileEndColumn * TILE_SIZE;
  this.pixelTop = this.tileOriginRow * TILE_SIZE;
  this.pixelBottom = this.tileEndRow * TILE_SIZE;
  this.generator = generator;
  (/** @type {WorldBlock & {createTileGrid: () => void}} */ (/** @type {unknown} */ (this))).createTileGrid();
}
export function repositionWorldBlock(block, regionColumn, regionRow, repopulateTiles) {
  block.regionColumn = regionColumn;
  block.regionRow = regionRow;
  block.tileOriginColumn = regionColumn * block.widthInTiles;
  block.tileOriginRow = regionRow * block.heightInTiles;
  block.tileEndColumn = block.tileOriginColumn + block.widthInTiles;
  block.tileEndRow = block.tileOriginRow + block.heightInTiles;
  block.pixelLeft = block.tileOriginColumn * TILE_SIZE;
  block.pixelRight = block.tileEndColumn * TILE_SIZE;
  block.pixelTop = block.tileOriginRow * TILE_SIZE;
  block.pixelBottom = block.tileEndRow * TILE_SIZE;
  if (repopulateTiles) {
    for (var tileColumn = 0; tileColumn < block.widthInTiles; tileColumn++) {
      var tileColumnList = block.tileGrid[tileColumn];
      for (var tileRow = 0; tileRow < block.heightInTiles; tileRow++) {
        var tile = tileColumnList[tileRow],
          worldColumn = block.tileOriginColumn + tileColumn,
          worldRow = block.tileOriginRow + tileRow;
        tile.worldColumn = worldColumn;
        tile.worldRow = worldRow;
        tile.pixelX = worldColumn * TILE_SIZE;
        tile.pixelY = worldRow * TILE_SIZE;
      }
    }
    populateWorldBlock(block.generator, block);
  }
}
export function worldBlockContains(block, pixelX, pixelY) {
  return pixelX >= block.pixelLeft && pixelX < block.pixelRight && pixelY >= block.pixelTop && pixelY < block.pixelBottom;
}
export function getBlockTile(block, tileColumn, tileRow) {
  return 0 > tileColumn || tileColumn >= block.widthInTiles || 0 > tileRow || tileRow >= block.heightInTiles ? null : block.tileGrid[tileColumn][tileRow];
}
export function WorldMap() {
  this.generator = new WorldGenerator(WORLD_BLOCK_COLUMNS, WORLD_BLOCK_ROWS);
  this.worldCenterY = this.worldCenterX = 0;
  this.blockOriginColumn = WORLD_ORIGIN_COLUMN;
  this.blockOriginRow = WORLD_ORIGIN_ROW;
  this.worldBlocks = [];
  // 静态展示物件：{ visualId, position: { x, y }, footprint? }；不参与碰撞或存档。
  this.sceneObjects = [];
  this.hasPartyPlaced = false;
}
export function createWorldBlocks(worldMap) {
  var blocks = [],
    blockRowList,
    blockColumnIndex,
    blockRowIndex;
  for (blockColumnIndex = 0; 3 > blockColumnIndex; blockColumnIndex++) {
    blockRowList = [];
    for (blockRowIndex = 0; 3 > blockRowIndex; blockRowIndex++) {
      blockRowList.push(new WorldBlock(blockColumnIndex + worldMap.blockOriginColumn, blockRowIndex + worldMap.blockOriginRow, worldMap.generator));
    }
    blocks.push(blockRowList);
  }
  return blocks;
}
export function placePartyInWorld() {
  var world = game.world;
  world.worldBlocks = createWorldBlocks(world);
  refreshWorldBlocks(world);
  world.worldCenterX = world.worldBlocks[1][1].pixelLeft + WORLD_BLOCK_COLUMNS * TILE_SIZE / 2 | 0;
  world.worldCenterY = world.worldBlocks[1][1].pixelTop + WORLD_BLOCK_ROWS * TILE_SIZE / 2 | 0;
  var adventurerIndex;
  for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
    var spawnX = world.worldCenterX + randomInt(30),
      spawnY = world.worldCenterY + randomInt(30);
    setVector(game.state.adventurers[adventurerIndex].position.worldPosition, spawnX, spawnY);
  }
  world.hasPartyPlaced = true;
}
export function refreshWorldBlocks(worldMap) {
  var blockColumnIndex, blockRowIndex;
  for (blockRowIndex = 0; 3 > blockRowIndex; blockRowIndex++) {
    for (blockColumnIndex = 0; 3 > blockColumnIndex; blockColumnIndex++) {
      var block = worldMap.worldBlocks[blockRowIndex][blockColumnIndex];
      populateWorldBlock(block.generator, block);
    }
  }
}
export function findNearestWorldColumn(tileColumn) {
  var world = game.world,
    blockColumnIndex,
    block,
    clampedColumn,
    distance,
    bestDistance = 1E9,
    nearestColumn = -1;
  for (blockColumnIndex = 0; blockColumnIndex < world.worldBlocks.length; blockColumnIndex++) {
    block = world.worldBlocks[blockColumnIndex][0];
    clampedColumn = tileColumn < block.tileOriginColumn ? block.tileOriginColumn : tileColumn >= block.tileEndColumn ? block.tileEndColumn - 1 : tileColumn;
    distance = Math.abs(tileColumn - clampedColumn);
    if (distance < bestDistance) {
      nearestColumn = clampedColumn;
      bestDistance = distance;
    }
  }
  return nearestColumn;
}
export function findNearestWorldRow(tileRow) {
  var blockRowIndex,
    block,
    clampedRow,
    distance,
    firstColumnBlocks = game.world.worldBlocks[0],
    bestDistance = 1E8,
    nearestRow = -1;
  for (blockRowIndex = 0; blockRowIndex < firstColumnBlocks.length; blockRowIndex++) {
    block = firstColumnBlocks[blockRowIndex];
    clampedRow = tileRow < block.tileOriginRow ? block.tileOriginRow : tileRow >= block.tileEndRow ? block.tileEndRow - 1 : tileRow;
    distance = Math.abs(tileRow - clampedRow);
    if (distance < bestDistance) {
      bestDistance = distance;
      nearestRow = clampedRow;
    }
  }
  return nearestRow;
}
export function initializeWorldTerrain() {
  installTileVisualAccessors(WorldTile.prototype, () => game.terrainSprites, WORLD_TILE_VISUAL_SLOTS);
  OCEAN_TERRAIN_CODE = "O";
  shoreTileLookup = {
    GOGO: "L1_ShoreEout.PNG",
    GOGG: "L1_ShoreNEin.PNG",
    OOGO: "L1_ShoreNEout.PNG",
    OOGG: "L1_ShoreNout.PNG",
    GGGO: "L1_ShoreSEin.PNG",
    GOOO: "L1_ShoreSEout.PNG",
    GGOO: "L1_ShoreSout.PNG",
    OGGG: "L1_ShoreWNin.PNG",
    OOOG: "L1_ShoreWNout.PNG",
    GOOG: "L1_ShoreWN-SE.PNG",
    OGOG: "L1_ShoreWout.PNG",
    GGOG: "L1_ShoreWSin.PNG",
    OGGO: "L1_ShoreWS-NE.PNG",
    OGOO: "L1_ShoreWSout.PNG",
    DDGG: "L1_GrassDesertEdgeE.PNG",
    DGDG: "L1_GrassDesertEdgeN.PNG",
    DDDG: "L1_GrassDesertEdgeNE.PNG",
    GGGD: "L1_GrassDesertEdgeNEin.PNG",
    DGDD: "L1_GrassDesertEdgeNW.PNG",
    GDGG: "L1_GrassDesertEdgeNWin.PNG",
    GDGD: "L1_GrassDesertEdgeS.PNG",
    DDGD: "L1_GrassDesertEdgeSE.PNG",
    GGDG: "L1_GrassDesertEdgeSEin.PNG",
    GDDD: "L1_GrassDesertEdgeSW.PNG",
    DGGG: "L1_GrassDesertEdgeSWin.PNG",
    GGDD: "L1_GrassDesertEdgeW.PNG",
    GSGG: "L1_SnowEdge01.PNG",
    GSGS: "L1_SnowEdge02.PNG",
    GGGS: "L1_SnowEdge03.PNG",
    SSGG: "L1_SnowEdge04.PNG",
    GGSS: "L1_SnowEdge05.PNG",
    SGGG: "L1_SnowEdge06.PNG",
    SGSG: "L1_SnowEdge07.PNG",
    GGSG: "L1_SnowEdge08.PNG",
    SGSS: "L1_SnowEdge09.PNG",
    SSSG: "L1_SnowEdge10.PNG",
    GSSS: "L1_SnowEdge11.PNG",
    SSGS: "L1_SnowEdge12.PNG",
    PPDD: "L1_DesertShoreE.PNG",
    PDPD: "L1_DesertShoreN.PNG",
    PPPD: "L1_DesertShoreNE.PNG",
    DDDP: "L1_DesertShoreNEin.PNG",
    PDPP: "L1_DesertShoreNW.PNG",
    DPDD: "L1_DesertShoreNWin.PNG",
    DPDP: "L1_DesertShoreS.PNG",
    PPDP: "L1_DesertShoreSE.PNG",
    DDPD: "L1_DesertShoreSEin.PNG",
    DPPP: "L1_DesertShoreSW.PNG",
    PDDD: "L1_DesertShoreSWin.PNG",
    DDPP: "L1_DesertShoreW.PNG",
    ISII: "L1_IceShore01.PNG",
    ISIS: "L1_IceShore02.PNG",
    IIIS: "L1_IceShore03.PNG",
    SSII: "L1_IceShore04.PNG",
    IISS: "L1_IceShore05.PNG",
    SIII: "L1_IceShore06.PNG",
    SISI: "L1_IceShore07.PNG",
    IISI: "L1_IceShore08.PNG",
    SISS: "L1_IceShore13.PNG",
    SSSI: "L1_IceShore14.PNG",
    ISSS: "L1_IceShore15.PNG",
    SSIS: "L1_IceShore16.PNG",
    GGGG: "L1_Terrain001.PNG",
    OOOO: "L1_Terrain005.PNG",
    DDDD: "L1_Terrain011.PNG",
    PPPP: "L1_Terrain004.PNG",
    SSSS: "L1_Terrain035.PNG",
    IIII: "L1_Terrain005.PNG",
    fallbackShoreSprite: "L1_Terrain048.PNG"
  };
  L2_ForestCanopy01Sprite = "L2_ForestCanopy01.PNG";
  L2_ForestCanopy03Sprite = "L2_ForestCanopy03.PNG";
  L2_ForestMaple03Sprite = "L2_ForestMaple03.PNG";
  L2_ForestPine01Sprite = "L2_ForestPine01.PNG";
  L2_ForestPine02Sprite = "L2_ForestPine02.PNG";
  L2_ForestPine03Sprite = "L2_ForestPine03.PNG";
  L2_ForestPine07Sprite = "L2_ForestPine07.PNG";
  L2_ForestPine08Sprite = "L2_ForestPine08.PNG";
  L2_ForestPine09Sprite = "L2_ForestPine09.PNG";
  L2_ForestMixed05Sprite = "L2_ForestMixed05.PNG";
  L2_ForestWillow03Sprite = "L2_ForestWillow03.PNG";
  L1_HillsSprite = "L1_Hills.PNG";
  L2_MountainBigEarth01Sprite = "L2_MountainBigEarth01.PNG";
  L2_MountainBigRock01Sprite = "L2_MountainBigRock01.PNG";
  L2_MountainBigVolcano01Sprite = "L2_MountainBigVolcano01.PNG";
  L2_MountainBigVolcanoActive01Sprite = "L2_MountainBigVolcanoActive01.PNG";
  L2_MountainBigVolcanoErupt01Sprite = "L2_MountainBigVolcanoErupt01.PNG";
  L2_MountainRocky01Sprite = "L2_MountainRocky01.PNG";
  L2_MountainRocky02Sprite = "L2_MountainRocky02.PNG";
  L2_MountainRocky03Sprite = "L2_MountainRocky03.PNG";
  L2_MountainRocky04Sprite = "L2_MountainRocky04.PNG";
  L2_MountainRocky05Sprite = "L2_MountainRocky05.PNG";
  L2_Terrain041Sprite = "L2_Terrain041.PNG";
  L1_Terrain033Sprite = "L1_Terrain033.PNG";
  L2_MountainDesert01Sprite = "L2_MountainDesert01.PNG";
  L2_MountainDesert02Sprite = "L2_MountainDesert02.PNG";
  L2_MountainDesert03Sprite = "L2_MountainDesert03.PNG";
  L2_MountainDesert04Sprite = "L2_MountainDesert04.PNG";
  L2_MountainDesert05Sprite = "L2_MountainDesert05.PNG";
  L2_MountainDesert06Sprite = "L2_MountainDesert06.PNG";
  L2_ForestPine04Sprite = "L2_ForestPine04.PNG";
  L2_ForestPine05Sprite = "L2_ForestPine05.PNG";
  L2_ForestPine06Sprite = "L2_ForestPine06.PNG";
  L2_Terrain040Sprite = "L2_Terrain040.PNG";
  L1_Terrain039Sprite = "L1_Terrain039.PNG";
  TerrainBiome.prototype.getBackgroundSpriteAt = function (worldColumn, worldRow) {
    var pixelX = worldColumn * TILE_SIZE,
      pixelY = worldRow * TILE_SIZE;
    if (-0.3 < sampleNoise(this.densityNoise, pixelX, pixelY)) {
      return null;
    }
    var variantIndex = (sampleNoise(this.variantNoise, pixelX, pixelY) - -0.8) / (2 / this.tileSpriteNames.length) | 0;
    return variantIndex > this.tileSpriteNames.length ? game.terrainSprites.getSprite("L2_Town01.PNG") : game.terrainSprites.getSprite(this.tileSpriteNames[variantIndex]);
  };
  DecorationBiome.prototype.getDecorationSpriteAt = function (worldColumn, worldRow) {
    var pixelX = worldColumn * TILE_SIZE,
      pixelY = worldRow * TILE_SIZE;
    if (-0.3 < sampleNoise(this.densityNoise, pixelX, pixelY)) {
      return null;
    }
    var variantIndex = (sampleNoise(this.variantNoise, pixelX, pixelY) - -0.8) / (0.1 / this.tileSpriteNames.length) | 0;
    return variantIndex > this.tileSpriteNames.length ? null : game.terrainSprites.getSprite(this.tileSpriteNames[variantIndex]);
  };
  WorldGenerator.prototype.ensureShopForDungeon = function (dungeon) {
    var shop;
    if (shop = game.shops.shopsById[dungeon.dungeonId]) {
      var shopTile = game.world.getTileAtPixel(shop.worldColumn, shop.worldRow);
      if (shopTile) {
        var shopSprite = game.terrainSprites.getSprite(randomShopSprite(game.shops));
        shopTile.setDecorationSprite(shopSprite);
      }
    } else {
      var shops = game.shops;
      var regionColumn = dungeon.getRegionColumn(),
        regionRow = dungeon.getRegionRow(),
        dungeonWorldColumn = dungeon.getWorldColumn(),
        dungeonWorldRow = dungeon.getWorldRow(),
        shopColumn = 1 + regionColumn * WORLD_BLOCK_COLUMNS + randomInt(WORLD_BLOCK_COLUMNS - 1),
        shopRow = 1 + regionRow * WORLD_BLOCK_ROWS + randomInt(WORLD_BLOCK_ROWS - 1);
      while (shopColumn === dungeonWorldColumn && shopRow === dungeonWorldRow) {
        shopColumn = 1 + regionColumn * WORLD_BLOCK_COLUMNS + randomInt(WORLD_BLOCK_COLUMNS - 1);
        shopRow = 1 + regionRow * WORLD_BLOCK_ROWS + randomInt(WORLD_BLOCK_ROWS - 1);
      }
      shops.addShop(new Shop(dungeon.dungeonId, shopColumn, shopRow));
    }
  };
  WorldTile.prototype.getPixelX = function () {
    return this.pixelX;
  };
  WorldTile.prototype.getPixelY = function () {
    return this.pixelY;
  };
  WorldTile.prototype.getWorldColumn = function () {
    return this.worldColumn;
  };
  WorldTile.prototype.getWorldRow = function () {
    return this.worldRow;
  };
  WorldTile.prototype.setBackgroundSprite = function (sprite) {
    this.backgroundSprite = sprite;
  };
  WorldTile.prototype.setDecorationSprite = function (sprite) {
    this.decorationSprite = sprite;
  };
  WorldBlock.prototype.createTileGrid = function () {
    var tileRowIndex,
      tileColumnIndex,
      tileColumnList,
      originWorldColumn = this.regionColumn * this.widthInTiles,
      originWorldRow = this.regionRow * this.heightInTiles;
    for (tileColumnIndex = 0; tileColumnIndex < this.widthInTiles; tileColumnIndex++) {
      tileColumnList = [];
      for (tileRowIndex = 0; tileRowIndex < this.heightInTiles; tileRowIndex++) {
        tileColumnList.push(new WorldTile(originWorldColumn + tileColumnIndex, originWorldRow + tileRowIndex));
      }
      this.tileGrid.push(tileColumnList);
    }
  };
  WorldMap.prototype.getTileAtPixel = function (pixelX, pixelY) {
    var blockColumnIndex = (pixelX / WORLD_BLOCK_COLUMNS | 0) - this.blockOriginColumn,
      blockRowIndex = (pixelY / WORLD_BLOCK_ROWS | 0) - this.blockOriginRow;
    if (0 > blockColumnIndex || 3 <= blockColumnIndex || 0 > blockRowIndex || 3 <= blockRowIndex) {
      return null;
    }
    var block = this.worldBlocks[blockColumnIndex][blockRowIndex];
    return getBlockTile(block, pixelX - (block.pixelLeft / TILE_SIZE | 0), pixelY - (block.pixelTop / TILE_SIZE | 0));
  };
  WorldMap.prototype.pixelToTileColumn = function (pixel) {
    return pixel / TILE_SIZE | 0;
  };
  WorldMap.prototype.pixelToTileRow = function (pixel) {
    return pixel / TILE_SIZE | 0;
  };
  WorldMap.prototype.pixelToBlockColumn = function (pixel) {
    var map = /** @type {WorldMap & {pixelToTileColumn: (a: number) => number}} */ (/** @type {unknown} */ (this));
    return map.pixelToTileColumn(pixel) / WORLD_BLOCK_COLUMNS | 0;
  };
  WorldMap.prototype.pixelToBlockRow = function (pixel) {
    var map = /** @type {WorldMap & {pixelToTileRow: (a: number) => number}} */ (/** @type {unknown} */ (this));
    return map.pixelToTileRow(pixel) / WORLD_BLOCK_ROWS | 0;
  };
  WorldMap.prototype.tileToPixelX = function (tile) {
    return tile * TILE_SIZE | 0;
  };
  WorldMap.prototype.tileToPixelY = function (tile) {
    return tile * TILE_SIZE | 0;
  };
}
