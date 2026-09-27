/** 世界地形定义、噪声生成与滚动区块。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { SeededRandom, SimplexNoise, randomInt, setVector } from "../core/math.js";
import { game } from "../runtime/game.js";
import { WORLD_BLOCK_COLUMNS, WORLD_BLOCK_ROWS, WORLD_ORIGIN_COLUMN, WORLD_ORIGIN_ROW, findCastle, findCastleByRegion } from "./regions.js";
import { Shop, randomShopSprite } from "./dungeons.js";
export var OCEAN_TERRAIN_CODE, shoreTileLookup, L2_ForestCanopy01Sprite, L2_ForestCanopy03Sprite, L2_ForestMaple03Sprite, L2_ForestPine01Sprite, L2_ForestPine02Sprite, L2_ForestPine03Sprite, L2_ForestPine07Sprite, L2_ForestPine08Sprite, L2_ForestPine09Sprite, L2_ForestMixed05Sprite, L2_ForestWillow03Sprite, L1_HillsSprite, L2_MountainBigEarth01Sprite, L2_MountainBigRock01Sprite, L2_MountainBigVolcano01Sprite, L2_MountainBigVolcanoActive01Sprite, L2_MountainBigVolcanoErupt01Sprite, L2_MountainRocky01Sprite, L2_MountainRocky02Sprite, L2_MountainRocky03Sprite, L2_MountainRocky04Sprite, L2_MountainRocky05Sprite, L2_Terrain041Sprite, L1_Terrain033Sprite, L2_MountainDesert01Sprite, L2_MountainDesert02Sprite, L2_MountainDesert03Sprite, L2_MountainDesert04Sprite, L2_MountainDesert05Sprite, L2_MountainDesert06Sprite, L2_ForestPine04Sprite, L2_ForestPine05Sprite, L2_ForestPine06Sprite, L2_Terrain040Sprite, L1_Terrain039Sprite;
export function FractalNoise(a, b, c, d, f) {
  var g = this.simplexNoise = new SimplexNoise(),
    h,
    l;
  h = new SeededRandom(a);
  l = [];
  for (a = 0; 256 > a; a++) {
    l[a] = Math.floor(256 * (/** @type {{random: () => number}} */ (/** @type {unknown} */ (h))).random());
  }
  g.permutation = [];
  for (a = 0; 512 > a; a++) {
    g.permutation[a] = l[a & 255];
  }
  this.initialAmplitude = 1;
  this.lacunarity = b;
  this.persistence = c;
  this.octaveCount = d;
  this.baseFrequency = f;
}
export function sampleNoise(a, b, c) {
  var d = 0,
    f = a.initialAmplitude,
    g = a.baseFrequency,
    h;
  for (h = 0; h < a.octaveCount; h++) {
    var l = a.simplexNoise,
      n = b * g,
      p = c * g,
      s = undefined,
      u = undefined,
      y = undefined,
      A = undefined,
      C = undefined,
      v = undefined,
      D = undefined,
      N = undefined,
      I = undefined,
      x = undefined;
    y = 0.5 * (n + p) * (l.HB - 1);
    A = Math.floor(n + y);
    C = Math.floor(p + y);
    v = (3 - l.HB) / 6;
    u = (A + C) * v;
    y = A - u;
    u = C - u;
    s = n - y;
    D = p - u;
    var e = undefined, o = undefined;
    if (s > D) {
      e = 1;
      o = 0;
    } else {
      e = 0;
      o = 1;
    }
    n = e;
    p = o;
    u = s - n + v;
    N = D - p + v;
    y = s - 1 + 2 * v;
    v = D - 1 + 2 * v;
    I = A & 255;
    x = C & 255;
    A = l.permutation[I + l.permutation[x]] % 12;
    C = l.permutation[I + n + l.permutation[x + p]] % 12;
    I = l.permutation[I + 1 + l.permutation[x + 1]] % 12;
    x = 0.5 - s * s - D * D;
    if (0 > x) {
      s = 0;
    } else {
      x *= x;
      s = x * x * (l.gradients[A][0] * s + l.gradients[A][1] * D);
    }
    D = 0.5 - u * u - N * N;
    if (0 > D) {
      u = 0;
    } else {
      D *= D;
      u = D * D * (l.gradients[C][0] * u + l.gradients[C][1] * N);
    }
    N = 0.5 - y * y - v * v;
    if (0 > N) {
      y = 0;
    } else {
      N *= N;
      y = N * N * (l.gradients[I][0] * y + l.gradients[I][1] * v);
    }
    d += 70 * f * (s + u + y);
    f *= a.persistence;
    g *= a.lacunarity;
  }
  return d;
}
export function TerrainBiome() {
  this.densityNoise = new FractalNoise(5, 2, 0.5, 4, 0.003);
  this.variantNoise = new FractalNoise(2, 2, 0.5, 2, 1E-4);
  this.tileSpriteNames = [];
}
export function addTerrainTileSet(a, b) {
  a.tileSpriteNames.push(b);
}
export function DecorationBiome() {
  this.densityNoise = new FractalNoise(9, 2, 0.5, 4, 0.003);
  this.variantNoise = new FractalNoise(7, 2, 0.9, 1, 0.02);
  this.tileSpriteNames = [];
}
export function addDecorationTileSet(a, b) {
  a.tileSpriteNames.push(b);
}
export function WorldGenerator(a, b) {
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
  this.widthInTiles = a;
  this.heightInTiles = b;
  this.mapEdgeSpriteName = this.lockedRegionSpriteName = "L1_Terrain015.PNG";
}
export function populateWorldBlock(a, b) {
  var c = findCastleByRegion(b.regionColumn + "_" + b.regionRow),
    d,
    f,
    g = b.regionColumn * a.widthInTiles,
    h = b.regionRow * a.heightInTiles;
  for (f = 0; f <= a.widthInTiles; f++) {
    for (d = 0; d <= a.heightInTiles; d++) {
      var l = b,
        n = f,
        p = d,
        s = getTerrainCode(a, g + f, h + d, c),
        u = undefined;
      if (u = getBlockTile(l, n - 1, p - 1)) {
        u.quadBottomRightTerrainCode = s;
      }
      if (u = getBlockTile(l, n, p - 1)) {
        u.quadBottomLeftTerrainCode = s;
      }
      if (u = getBlockTile(l, n - 1, p)) {
        u.quadTopRightTerrainCode = s;
      }
      if (u = getBlockTile(l, n, p)) {
        u.quadTopLeftTerrainCode = s;
      }
    }
  }
  for (f = 0; f < a.widthInTiles; f++) {
    for (d = 0; d < a.heightInTiles; d++) {
      var shoreTile = getBlockTile(b, f, d);
      var shoreSpriteName = undefined;
      if (!c || c.regionLocked) {
        shoreSpriteName = a.lockedRegionSpriteName;
        shoreTile.terrainTypeKey = null;
        shoreTile.terrainMoveCost = 1E5;
      } else {
        l = shoreTile.quadTopLeftTerrainCode + shoreTile.quadTopRightTerrainCode + shoreTile.quadBottomLeftTerrainCode + shoreTile.quadBottomRightTerrainCode;
        shoreSpriteName = shoreTileLookup[l];
        shoreTile.terrainTypeKey = l;
        if (!shoreSpriteName) {
          console.log("no sprite found for key: [" + l + "]");
          shoreSpriteName = shoreTileLookup.fallbackShoreSprite;
        }
        shoreTile.terrainMoveCost = "PPPP" === shoreTile.terrainTypeKey || "OOOO" === shoreTile.terrainTypeKey || "IIII" === shoreTile.terrainTypeKey ? 1E5 : 0;
      }
      if (shoreSpriteName = game.terrainSprites.getSprite(shoreSpriteName)) {
        shoreTile.setBackgroundSprite(shoreSpriteName);
      }
    }
  }
  g = b.regionColumn * a.widthInTiles;
  h = b.regionRow * a.heightInTiles;
  if (!c || c.regionLocked) {
    for (f = 0; f < a.widthInTiles; f++) {
      for (d = 0; d < a.heightInTiles; d++) {
        var lockedTile = getBlockTile(b, f, d);
        lockedTile.setDecorationSprite(null);
        lockedTile.terrainMoveCost = 1E5;
      }
    }
  } else {
    for (f = 0; f < a.widthInTiles; f++) {
      for (d = 0; d < a.heightInTiles; d++) {
        var decoTile = getBlockTile(b, f, d);
        if (l = decoTile.terrainTypeKey) {
          s = null;
          p = 0;
          if ("GGGG" === l) {
            if (s = a.terrainBiome.getBackgroundSpriteAt(g + f, h + d)) {
              p = 10;
            } else {
              if (s = a.decorationBiome.getDecorationSpriteAt(g + f, h + d)) {
                p = 1E4;
              }
            }
          } else {
            if ("DDDD" === l) {
              if (s = a.mountainDesertDecorationBiome.getDecorationSpriteAt(g + f, h + d)) {
                p = 1E4;
              }
            } else {
              if ("SSSS" === l) {
                if (s = a.snowTerrainBiome.getBackgroundSpriteAt(g + f, h + d)) {
                  p = 10;
                } else {
                  if (s = a.snowDecorationBiome.getDecorationSpriteAt(g + f, h + d)) {
                    p = 1E4;
                  }
                }
              }
            }
          }
          if (s) {
            decoTile.terrainMoveCost += p;
            decoTile.setDecorationSprite(s);
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
  if (c && !c.regionLocked && ((d = (d = game.dungeons.dungeonRegistry[b.regionColumn + "_" + b.regionRow]) ? d : null) ? (f = d.getWorldColumn(), g = d.getWorldRow(), (entranceTile = game.world.getTileAtPixel(f, g)) ? entranceTile.setDecorationSprite(game.terrainSprites.getSprite(d.mapSprite)) : (console.log("no tile for: col=" + f + " row=" + g), d = null)) : d = null, d && ((f = game.farms.farmsById[d.dungeonId]) && (f = game.world.getTileAtPixel(f.farmColumn, f.farmRow)) && f.setDecorationSprite(game.terrainSprites.getSprite(game.farms.farmSpriteName)), a.ensureShopForDungeon(d)), f = findCastle(b.regionColumn + "_" + b.regionRow))) {
    d = f.worldPixelX;
    f = f.worldPixelY;
    if (castleTile = game.world.getTileAtPixel(d, f)) {
      castleTile.setDecorationSprite(game.terrainSprites.getSprite(game.castles.Ny));
    } else {
      console.log("no tile for: col=" + d + " row=" + f);
    }
  }
  f = game.terrainSprites.getSprite(a.mapEdgeSpriteName);
  var northCastle = findCastleByRegion(b.regionColumn + "_" + (b.regionRow - 1));
  var westCastle = findCastleByRegion(b.regionColumn - 1 + "_" + b.regionRow);
  var nwCastle = findCastleByRegion(b.regionColumn - 1 + "_" + (b.regionRow - 1));
  if (c != northCastle) {
    for (n = 0; n < a.widthInTiles; n++) {
      d = getBlockTile(b, n, 0);
      d.setBackgroundSprite(f);
      d.setDecorationSprite(null);
    }
  }
  if (c != westCastle) {
    for (n = 0; n < a.heightInTiles; n++) {
      d = getBlockTile(b, 0, n);
      d.setBackgroundSprite(f);
      d.setDecorationSprite(null);
    }
  }
  if (c === northCastle && c === westCastle && c != nwCastle) {
    d = getBlockTile(b, 0, 0);
    d.setBackgroundSprite(f);
    d.setDecorationSprite(null);
  }
}
export function getTerrainCode(a, b, c, d) {
  b *= game.tileSize;
  c *= game.tileSize;
  var f = sampleNoise(a.terrainNoise, b, c);
  return !d || d.regionLocked ? 0.5 > f && (a = sampleNoise(a.detailNoise, b, c), -0.6 > a) ? "P" : "D" : d.conquered ? 0.5 > f && (a = sampleNoise(a.detailNoise, b, c), -0.6 > a) ? OCEAN_TERRAIN_CODE : "G" : 0.5 > f && (a = sampleNoise(a.detailNoise, b, c), -0.6 > a) ? "I" : "S";
}
export function WorldTile(a, b) {
  this.worldColumn = a;
  this.worldRow = b;
  this.pixelX = a * game.tileSize;
  this.pixelY = b * game.tileSize;
  this.decorationSprite = this.backgroundSprite = null;
  this.terrainTypeKey = "GGGG";
  this.quadBottomRightTerrainCode = this.quadTopRightTerrainCode = this.quadBottomLeftTerrainCode = this.quadTopLeftTerrainCode = OCEAN_TERRAIN_CODE;
  this.terrainMoveCost = this.pathDistanceToDestination = 0;
}
export function WorldBlock(a, b, c) {
  this.tileGrid = [];
  this.regionColumn = a;
  this.regionRow = b;
  this.heightInTiles = WORLD_BLOCK_ROWS;
  this.widthInTiles = WORLD_BLOCK_COLUMNS;
  this.tileOriginColumn = a * this.widthInTiles;
  this.tileOriginRow = b * this.heightInTiles;
  this.tileEndColumn = this.tileOriginColumn + this.widthInTiles;
  this.tileEndRow = this.tileOriginRow + this.heightInTiles;
  this.pixelLeft = this.tileOriginColumn * game.tileSize;
  this.pixelRight = this.tileEndColumn * game.tileSize;
  this.pixelTop = this.tileOriginRow * game.tileSize;
  this.pixelBottom = this.tileEndRow * game.tileSize;
  this.generator = c;
  (/** @type {WorldBlock & {createTileGrid: () => void}} */ (/** @type {unknown} */ (this))).createTileGrid();
}
export function repositionWorldBlock(a, b, c, d) {
  a.regionColumn = b;
  a.regionRow = c;
  a.tileOriginColumn = b * a.widthInTiles;
  a.tileOriginRow = c * a.heightInTiles;
  a.tileEndColumn = a.tileOriginColumn + a.widthInTiles;
  a.tileEndRow = a.tileOriginRow + a.heightInTiles;
  a.pixelLeft = a.tileOriginColumn * game.tileSize;
  a.pixelRight = a.tileEndColumn * game.tileSize;
  a.pixelTop = a.tileOriginRow * game.tileSize;
  a.pixelBottom = a.tileEndRow * game.tileSize;
  if (d) {
    for (c = 0; c < a.widthInTiles; c++) {
      for (d = a.tileGrid[c], b = 0; b < a.heightInTiles; b++) {
        var f = d[b],
          g = a.tileOriginColumn + c,
          h = a.tileOriginRow + b;
        f.worldColumn = g;
        f.worldRow = h;
        f.pixelX = g * game.tileSize;
        f.pixelY = h * game.tileSize;
      }
    }
    populateWorldBlock(a.generator, a);
  }
}
export function worldBlockContains(a, b, c) {
  return b >= a.pixelLeft && b < a.pixelRight && c >= a.pixelTop && c < a.pixelBottom;
}
export function getBlockTile(a, b, c) {
  return 0 > b || b >= a.widthInTiles || 0 > c || c >= a.heightInTiles ? null : a.tileGrid[b][c];
}
export function WorldMap() {
  this.generator = new WorldGenerator(WORLD_BLOCK_COLUMNS, WORLD_BLOCK_ROWS);
  this.worldCenterY = this.worldCenterX = 0;
  this.blockOriginColumn = WORLD_ORIGIN_COLUMN;
  this.blockOriginRow = WORLD_ORIGIN_ROW;
  this.worldBlocks = [];
  this.hasPartyPlaced = false;
}
export function createWorldBlocks(a) {
  var b = [],
    c,
    d,
    f;
  for (d = 0; 3 > d; d++) {
    c = [];
    for (f = 0; 3 > f; f++) {
      c.push(new WorldBlock(d + a.blockOriginColumn, f + a.blockOriginRow, a.generator));
    }
    b.push(c);
  }
  return b;
}
export function placePartyInWorld() {
  var a = game.world;
  a.worldBlocks = createWorldBlocks(a);
  refreshWorldBlocks(a);
  a.worldCenterX = a.worldBlocks[1][1].pixelLeft + WORLD_BLOCK_COLUMNS * game.tileSize / 2 | 0;
  a.worldCenterY = a.worldBlocks[1][1].pixelTop + WORLD_BLOCK_ROWS * game.tileSize / 2 | 0;
  var b;
  for (b = 0; b < game.state.adventurers.length; b++) {
    var c = a.worldCenterX + randomInt(30),
      d = a.worldCenterY + randomInt(30);
    setVector(game.state.adventurers[b].position.worldPosition, c, d);
  }
  a.hasPartyPlaced = true;
}
export function refreshWorldBlocks(a) {
  var b, c;
  for (c = 0; 3 > c; c++) {
    for (b = 0; 3 > b; b++) {
      var d = a.worldBlocks[c][b];
      populateWorldBlock(d.generator, d);
    }
  }
}
export function findNearestWorldColumn(a) {
  var b = game.world,
    c,
    d,
    f,
    g = 1E9,
    h = -1;
  for (c = 0; c < b.worldBlocks.length; c++) {
    d = b.worldBlocks[c][0];
    d = a < d.tileOriginColumn ? d.tileOriginColumn : a >= d.tileEndColumn ? d.tileEndColumn - 1 : a;
    f = Math.abs(a - d);
    if (f < g) {
      h = d;
      g = f;
    }
  }
  return h;
}
export function findNearestWorldRow(a) {
  var b,
    c,
    d,
    f = game.world.worldBlocks[0],
    g = 1E8,
    h = -1;
  for (b = 0; b < f.length; b++) {
    c = f[b];
    c = a < c.tileOriginRow ? c.tileOriginRow : a >= c.tileEndRow ? c.tileEndRow - 1 : a;
    d = Math.abs(a - c);
    if (d < g) {
      g = d;
      h = c;
    }
  }
  return h;
}
export function initializeWorldTerrain() {
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
  TerrainBiome.prototype.getBackgroundSpriteAt = function (a, b) {
    var c = a * game.tileSize,
      d = b * game.tileSize;
    if (-0.3 < sampleNoise(this.densityNoise, c, d)) {
      return null;
    }
    c = (sampleNoise(this.variantNoise, c, d) - -0.8) / (2 / this.tileSpriteNames.length) | 0;
    return c > this.tileSpriteNames.length ? game.terrainSprites.getSprite("L2_Town01.PNG") : game.terrainSprites.getSprite(this.tileSpriteNames[c]);
  };
  DecorationBiome.prototype.getDecorationSpriteAt = function (a, b) {
    var c = a * game.tileSize,
      d = b * game.tileSize;
    if (-0.3 < sampleNoise(this.densityNoise, c, d)) {
      return null;
    }
    c = (sampleNoise(this.variantNoise, c, d) - -0.8) / (0.1 / this.tileSpriteNames.length) | 0;
    return c > this.tileSpriteNames.length ? null : game.terrainSprites.getSprite(this.tileSpriteNames[c]);
  };
  WorldGenerator.prototype.ensureShopForDungeon = function (a) {
    var b;
    if (b = game.shops.shopsById[a.dungeonId]) {
      if (a = game.world.getTileAtPixel(b.worldColumn, b.worldRow)) {
        b = game.terrainSprites.getSprite(randomShopSprite(game.shops));
        a.setDecorationSprite(b);
      }
    } else {
      b = game.shops;
      for (var c = a.getRegionColumn(), d = a.getRegionRow(), f = a.getWorldColumn(), g = a.getWorldRow(), h = 1 + c * WORLD_BLOCK_COLUMNS + randomInt(WORLD_BLOCK_COLUMNS - 1), l = 1 + d * WORLD_BLOCK_ROWS + randomInt(WORLD_BLOCK_ROWS - 1); h === f && l === g;) {
        h = 1 + c * WORLD_BLOCK_COLUMNS + randomInt(WORLD_BLOCK_COLUMNS - 1);
        l = 1 + d * WORLD_BLOCK_ROWS + randomInt(WORLD_BLOCK_ROWS - 1);
      }
      b.addShop(new Shop(a.dungeonId, h, l));
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
  WorldTile.prototype.setBackgroundSprite = function (a) {
    this.backgroundSprite = a;
  };
  WorldTile.prototype.setDecorationSprite = function (a) {
    this.decorationSprite = a;
  };
  WorldBlock.prototype.createTileGrid = function () {
    var a,
      b,
      c,
      d = this.regionColumn * this.widthInTiles,
      f = this.regionRow * this.heightInTiles;
    for (b = 0; b < this.widthInTiles; b++) {
      c = [];
      for (a = 0; a < this.heightInTiles; a++) {
        c.push(new WorldTile(d + b, f + a));
      }
      this.tileGrid.push(c);
    }
  };
  WorldMap.prototype.getTileAtPixel = function (a, b) {
    var c = (a / WORLD_BLOCK_COLUMNS | 0) - this.blockOriginColumn,
      d = (b / WORLD_BLOCK_ROWS | 0) - this.blockOriginRow;
    if (0 > c || 3 <= c || 0 > d || 3 <= d) {
      return null;
    }
    var block = this.worldBlocks[c][d];
    return getBlockTile(block, a - (block.pixelLeft / game.tileSize | 0), b - (block.pixelTop / game.tileSize | 0));
  };
  WorldMap.prototype.pixelToTileColumn = function (a) {
    return a / game.tileSize | 0;
  };
  WorldMap.prototype.pixelToTileRow = function (a) {
    return a / game.tileSize | 0;
  };
  WorldMap.prototype.pixelToBlockColumn = function (a) {
    var map = /** @type {WorldMap & {pixelToTileColumn: (a: number) => number}} */ (/** @type {unknown} */ (this));
    return map.pixelToTileColumn(a) / WORLD_BLOCK_COLUMNS | 0;
  };
  WorldMap.prototype.pixelToBlockRow = function (a) {
    var map = /** @type {WorldMap & {pixelToTileRow: (a: number) => number}} */ (/** @type {unknown} */ (this));
    return map.pixelToTileRow(a) / WORLD_BLOCK_ROWS | 0;
  };
  WorldMap.prototype.tileToPixelX = function (a) {
    return a * game.tileSize | 0;
  };
  WorldMap.prototype.tileToPixelY = function (a) {
    return a * game.tileSize | 0;
  };
}
