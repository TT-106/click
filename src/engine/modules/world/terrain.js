// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 世界地形定义、噪声生成与滚动区块。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { SeededRandom, SimplexNoise, randomInt, setVector } from "../core/math.js";
import { game } from "../runtime/game.js";
import { WORLD_BLOCK_COLUMNS, WORLD_BLOCK_ROWS, WORLD_ORIGIN_COLUMN, WORLD_ORIGIN_ROW, findCastle, findCastleByRegion } from "./regions.js";
import { Shop, randomShopSprite } from "./dungeons.js";
export var OCEAN_TERRAIN_CODE, shoreTileLookup, L2_ForestCanopy01Sprite, L2_ForestCanopy03Sprite, L2_ForestMaple03Sprite, L2_ForestPine01Sprite, L2_ForestPine02Sprite, L2_ForestPine03Sprite, L2_ForestPine07Sprite, L2_ForestPine08Sprite, L2_ForestPine09Sprite, L2_ForestMixed05Sprite, L2_ForestWillow03Sprite, L1_HillsSprite, L2_MountainBigEarth01Sprite, L2_MountainBigRock01Sprite, L2_MountainBigVolcano01Sprite, L2_MountainBigVolcanoActive01Sprite, L2_MountainBigVolcanoErupt01Sprite, L2_MountainRocky01Sprite, L2_MountainRocky02Sprite, L2_MountainRocky03Sprite, L2_MountainRocky04Sprite, L2_MountainRocky05Sprite, L2_Terrain041Sprite, L1_Terrain033Sprite, L2_MountainDesert01Sprite, L2_MountainDesert02Sprite, L2_MountainDesert03Sprite, L2_MountainDesert04Sprite, L2_MountainDesert05Sprite, L2_MountainDesert06Sprite, L2_ForestPine04Sprite, L2_ForestPine05Sprite, L2_ForestPine06Sprite, L2_Terrain040Sprite, L1_Terrain039Sprite;
export function FractalNoise(a, b, c, d, f) {
  var g = this.RA = new SimplexNoise(),
    h,
    l;
  h = new SeededRandom(a);
  l = [];
  for (a = 0; 256 > a; a++) {
    l[a] = Math.floor(256 * h.random());
  }
  g.Wj = [];
  for (a = 0; 512 > a; a++) {
    g.Wj[a] = l[a & 255];
  }
  this.NE = 1;
  this.QE = b;
  this.PE = c;
  this.RE = d;
  this.OE = f;
}
export function sampleNoise(a, b, c) {
  var d = 0,
    f = a.NE,
    g = a.OE,
    h;
  for (h = 0; h < a.RE; h++) {
    var l = a.RA,
      n = b * g,
      p = c * g,
      s = undefined,
      u = undefined,
      y = undefined,
      A = y = undefined,
      C = undefined,
      v = undefined,
      D = s = u = y = u = undefined,
      N = u = undefined,
      I = v = y = undefined,
      x = undefined,
      N = D = x = I = C = A = undefined,
      y = 0.5 * (n + p) * (l.HB - 1),
      A = Math.floor(n + y),
      C = Math.floor(p + y),
      v = (3 - l.HB) / 6,
      u = (A + C) * v,
      y = A - u,
      u = C - u,
      s = n - y,
      D = p - u,
      p = n = undefined;
    if (s > D) {
      n = 1;
      p = 0;
    } else {
      n = 0;
      p = 1;
    }
    u = s - n + v;
    N = D - p + v;
    y = s - 1 + 2 * v;
    v = D - 1 + 2 * v;
    I = A & 255;
    x = C & 255;
    A = l.Wj[I + l.Wj[x]] % 12;
    C = l.Wj[I + n + l.Wj[x + p]] % 12;
    I = l.Wj[I + 1 + l.Wj[x + 1]] % 12;
    x = 0.5 - s * s - D * D;
    if (0 > x) {
      s = 0;
    } else {
      x *= x;
      s = x * x * (l.Im[A][0] * s + l.Im[A][1] * D);
    }
    D = 0.5 - u * u - N * N;
    if (0 > D) {
      u = 0;
    } else {
      D *= D;
      u = D * D * (l.Im[C][0] * u + l.Im[C][1] * N);
    }
    N = 0.5 - y * y - v * v;
    if (0 > N) {
      y = 0;
    } else {
      N *= N;
      y = N * N * (l.Im[I][0] * y + l.Im[I][1] * v);
    }
    d += 70 * f * (s + u + y);
    f *= a.PE;
    g *= a.QE;
  }
  return d;
}
export function TerrainBiome() {
  this.ow = new FractalNoise(5, 2, 0.5, 4, 0.003);
  this.qD = new FractalNoise(2, 2, 0.5, 2, 1E-4);
  this.Dr = [];
}
export function addTerrainTileSet(a, b) {
  a.Dr.push(b);
}
export function DecorationBiome() {
  this.ow = new FractalNoise(9, 2, 0.5, 4, 0.003);
  this.fE = new FractalNoise(7, 2, 0.9, 1, 0.02);
  this.Fs = [];
}
export function addDecorationTileSet(a, b) {
  a.Fs.push(b);
}
export function WorldGenerator(a, b) {
  this.pE = new FractalNoise(10, 2.012, 0.5, 5, 1E-4);
  this.ox = new FractalNoise(2, 2, 0.5, 3, 5E-4);
  this.eg = new TerrainBiome();
  addTerrainTileSet(this.eg, L2_ForestCanopy01Sprite);
  addTerrainTileSet(this.eg, L2_ForestCanopy03Sprite);
  addTerrainTileSet(this.eg, L2_ForestPine01Sprite);
  addTerrainTileSet(this.eg, L2_ForestPine02Sprite);
  addTerrainTileSet(this.eg, L2_ForestPine03Sprite);
  addTerrainTileSet(this.eg, L2_ForestPine07Sprite);
  addTerrainTileSet(this.eg, L2_ForestPine08Sprite);
  addTerrainTileSet(this.eg, L2_ForestPine09Sprite);
  addTerrainTileSet(this.eg, L2_ForestWillow03Sprite);
  addTerrainTileSet(this.eg, L2_ForestMixed05Sprite);
  addTerrainTileSet(this.eg, L2_ForestMaple03Sprite);
  this.wf = new DecorationBiome();
  addDecorationTileSet(this.wf, L2_MountainBigEarth01Sprite);
  addDecorationTileSet(this.wf, L2_MountainBigRock01Sprite);
  addDecorationTileSet(this.wf, L2_MountainBigVolcano01Sprite);
  addDecorationTileSet(this.wf, L2_MountainBigVolcanoActive01Sprite);
  addDecorationTileSet(this.wf, L2_MountainBigVolcanoErupt01Sprite);
  addDecorationTileSet(this.wf, L2_MountainRocky01Sprite);
  addDecorationTileSet(this.wf, L2_MountainRocky02Sprite);
  addDecorationTileSet(this.wf, L2_MountainRocky03Sprite);
  addDecorationTileSet(this.wf, L2_MountainRocky04Sprite);
  addDecorationTileSet(this.wf, L2_MountainRocky05Sprite);
  addDecorationTileSet(this.wf, L2_Terrain041Sprite);
  addDecorationTileSet(this.wf, L1_HillsSprite);
  this.kt = new TerrainBiome();
  addTerrainTileSet(this.kt, L2_ForestPine04Sprite);
  addTerrainTileSet(this.kt, L2_ForestPine05Sprite);
  addTerrainTileSet(this.kt, L2_ForestPine06Sprite);
  this.Bx = new DecorationBiome();
  addDecorationTileSet(this.Bx, L1_Terrain039Sprite);
  addDecorationTileSet(this.Bx, L2_Terrain040Sprite);
  this.tj = new DecorationBiome();
  addDecorationTileSet(this.tj, L2_MountainDesert01Sprite);
  addDecorationTileSet(this.tj, L2_MountainDesert02Sprite);
  addDecorationTileSet(this.tj, L1_Terrain033Sprite);
  addDecorationTileSet(this.tj, L2_MountainDesert03Sprite);
  addDecorationTileSet(this.tj, L2_MountainDesert04Sprite);
  addDecorationTileSet(this.tj, L2_MountainDesert05Sprite);
  addDecorationTileSet(this.tj, L2_MountainDesert06Sprite);
  this.rc = a;
  this.sc = b;
  this.tE = this.ZD = "L1_Terrain015.PNG";
}
export function populateWorldBlock(a, b) {
  var c = findCastleByRegion(b.Hd + "_" + b.Id),
    d,
    f,
    g = b.Hd * a.rc,
    h = b.Id * a.sc;
  for (f = 0; f <= a.rc; f++) {
    for (d = 0; d <= a.sc; d++) {
      var l = b,
        n = f,
        p = d,
        s = getTerrainCode(a, g + f, h + d, c),
        u = undefined;
      if (u = getBlockTile(l, n - 1, p - 1)) {
        u.xB = s;
      }
      if (u = getBlockTile(l, n, p - 1)) {
        u.yB = s;
      }
      if (u = getBlockTile(l, n - 1, p)) {
        u.KA = s;
      }
      if (u = getBlockTile(l, n, p)) {
        u.LA = s;
      }
    }
  }
  for (f = 0; f < a.rc; f++) {
    for (d = 0; d < a.sc; d++) {
      g = getBlockTile(b, f, d);
      h = undefined;
      if (!c || c.$b) {
        h = a.ZD;
        g.Kn = null;
        g.Ln = 1E5;
      } else {
        l = g.LA + g.KA + g.yB + g.xB;
        h = shoreTileLookup[l];
        g.Kn = l;
        if (!h) {
          console.log("no sprite found for key: [" + l + "]");
          h = shoreTileLookup.JD;
        }
        g.Ln = "PPPP" === g.Kn || "OOOO" === g.Kn || "IIII" === g.Kn ? 1E5 : 0;
      }
      if (h = game.terrainSprites.getSprite(h)) {
        g.setBackgroundSprite(h);
      }
    }
  }
  g = b.Hd * a.rc;
  h = b.Id * a.sc;
  if (!c || c.$b) {
    for (f = 0; f < a.rc; f++) {
      for (d = 0; d < a.sc; d++) {
        n = getBlockTile(b, f, d);
        n.setDecorationSprite(null);
        n.Ln = 1E5;
      }
    }
  } else {
    for (f = 0; f < a.rc; f++) {
      for (d = 0; d < a.sc; d++) {
        n = getBlockTile(b, f, d);
        if (l = n.Kn) {
          s = null;
          p = 0;
          if ("GGGG" === l) {
            if (s = a.eg.getBackgroundSpriteAt(g + f, h + d)) {
              p = 10;
            } else {
              if (s = a.wf.getDecorationSpriteAt(g + f, h + d)) {
                p = 1E4;
              }
            }
          } else {
            if ("DDDD" === l) {
              if (s = a.tj.getDecorationSpriteAt(g + f, h + d)) {
                p = 1E4;
              }
            } else {
              if ("SSSS" === l) {
                if (s = a.kt.getBackgroundSpriteAt(g + f, h + d)) {
                  p = 10;
                } else {
                  if (s = a.Bx.getDecorationSpriteAt(g + f, h + d)) {
                    p = 1E4;
                  }
                }
              }
            }
          }
          if (s) {
            n.Ln += p;
            n.setDecorationSprite(s);
          } else {
            n.setDecorationSprite(null);
          }
        } else {
          n.setDecorationSprite(null);
        }
      }
    }
  }
  if (c && !c.$b && ((d = (d = game.dungeons.Do[b.Hd + "_" + b.Id]) ? d : null) ? (f = d.bc(), g = d.cc(), (h = game.world.hb(f, g)) ? h.setDecorationSprite(game.terrainSprites.getSprite(d.Fo)) : (console.log("no tile for: col=" + f + " row=" + g), d = null)) : d = null, d && ((f = game.farms.jw[d.dungeonId]) && (f = game.world.hb(f.kw, f.lw)) && f.setDecorationSprite(game.terrainSprites.getSprite(game.farms.Gz)), a.Ut(d)), f = findCastle(b.Hd + "_" + b.Id))) {
    d = f.dm;
    f = f.em;
    if (g = game.world.hb(d, f)) {
      g.setDecorationSprite(game.terrainSprites.getSprite(game.castles.Ny));
    } else {
      console.log("no tile for: col=" + d + " row=" + f);
    }
  }
  f = game.terrainSprites.getSprite(a.tE);
  g = findCastleByRegion(b.Hd + "_" + (b.Id - 1));
  h = findCastleByRegion(b.Hd - 1 + "_" + b.Id);
  l = findCastleByRegion(b.Hd - 1 + "_" + (b.Id - 1));
  if (c != g) {
    for (n = 0; n < a.rc; n++) {
      d = getBlockTile(b, n, 0);
      d.setBackgroundSprite(f);
      d.setDecorationSprite(null);
    }
  }
  if (c != h) {
    for (n = 0; n < a.sc; n++) {
      d = getBlockTile(b, 0, n);
      d.setBackgroundSprite(f);
      d.setDecorationSprite(null);
    }
  }
  if (c === g && c === h && c != l) {
    d = getBlockTile(b, 0, 0);
    d.setBackgroundSprite(f);
    d.setDecorationSprite(null);
  }
}
export function getTerrainCode(a, b, c, d) {
  b *= game.tileSize;
  c *= game.tileSize;
  var f = sampleNoise(a.pE, b, c);
  return !d || d.$b ? 0.5 > f && (a = sampleNoise(a.ox, b, c), -0.6 > a) ? "P" : "D" : d.conquered ? 0.5 > f && (a = sampleNoise(a.ox, b, c), -0.6 > a) ? OCEAN_TERRAIN_CODE : "G" : 0.5 > f && (a = sampleNoise(a.ox, b, c), -0.6 > a) ? "I" : "S";
}
export function WorldTile(a, b) {
  this.worldColumn = a;
  this.worldRow = b;
  this.NC = a * game.tileSize;
  this.OC = b * game.tileSize;
  this.Yf = this.Jn = null;
  this.Kn = "GGGG";
  this.xB = this.KA = this.yB = this.LA = OCEAN_TERRAIN_CODE;
  this.Ln = this.ln = 0;
}
export function WorldBlock(a, b, c) {
  this.jo = [];
  this.Hd = a;
  this.Id = b;
  this.sc = WORLD_BLOCK_ROWS;
  this.rc = WORLD_BLOCK_COLUMNS;
  this.Qj = a * this.rc;
  this.Rj = b * this.sc;
  this.wp = this.Qj + this.rc;
  this.xp = this.Rj + this.sc;
  this.yp = this.Qj * game.tileSize;
  this.Mw = this.wp * game.tileSize;
  this.zp = this.Rj * game.tileSize;
  this.Nw = this.xp * game.tileSize;
  this.wt = c;
  this.Aw();
}
export function repositionWorldBlock(a, b, c, d) {
  a.Hd = b;
  a.Id = c;
  a.Qj = b * a.rc;
  a.Rj = c * a.sc;
  a.wp = a.Qj + a.rc;
  a.xp = a.Rj + a.sc;
  a.yp = a.Qj * game.tileSize;
  a.Mw = a.wp * game.tileSize;
  a.zp = a.Rj * game.tileSize;
  a.Nw = a.xp * game.tileSize;
  if (d) {
    for (c = 0; c < a.rc; c++) {
      for (d = a.jo[c], b = 0; b < a.sc; b++) {
        var f = d[b],
          g = a.Qj + c,
          h = a.Rj + b;
        f.worldColumn = g;
        f.worldRow = h;
        f.NC = g * game.tileSize;
        f.OC = h * game.tileSize;
      }
    }
    populateWorldBlock(a.wt, a);
  }
}
export function worldBlockContains(a, b, c) {
  return b >= a.yp && b < a.Mw && c >= a.zp && c < a.Nw;
}
export function getBlockTile(a, b, c) {
  return 0 > b || b >= a.rc || 0 > c || c >= a.sc ? null : a.jo[b][c];
}
export function WorldMap() {
  this.wt = new WorldGenerator(WORLD_BLOCK_COLUMNS, WORLD_BLOCK_ROWS);
  this.ie = this.he = 0;
  this.blockOriginColumn = WORLD_ORIGIN_COLUMN;
  this.blockOriginRow = WORLD_ORIGIN_ROW;
  this.worldBlocks = [];
  this.ty = false;
}
export function createWorldBlocks(a) {
  var b = [],
    c,
    d,
    f;
  for (d = 0; 3 > d; d++) {
    c = [];
    for (f = 0; 3 > f; f++) {
      c.push(new WorldBlock(d + a.blockOriginColumn, f + a.blockOriginRow, a.wt));
    }
    b.push(c);
  }
  return b;
}
export function placePartyInWorld() {
  var a = game.world;
  a.worldBlocks = createWorldBlocks(a);
  refreshWorldBlocks(a);
  a.he = a.worldBlocks[1][1].yp + WORLD_BLOCK_COLUMNS * game.tileSize / 2 | 0;
  a.ie = a.worldBlocks[1][1].zp + WORLD_BLOCK_ROWS * game.tileSize / 2 | 0;
  var b;
  for (b = 0; b < game.state.adventurers.length; b++) {
    var c = a.he + randomInt(30),
      d = a.ie + randomInt(30);
    setVector(game.state.adventurers[b].position.Db, c, d);
  }
  a.ty = true;
}
export function refreshWorldBlocks(a) {
  var b, c;
  for (c = 0; 3 > c; c++) {
    for (b = 0; 3 > b; b++) {
      var d = a.worldBlocks[c][b];
      populateWorldBlock(d.wt, d);
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
    d = a < d.Qj ? d.Qj : a >= d.wp ? d.wp - 1 : a;
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
    c = a < c.Rj ? c.Rj : a >= c.xp ? c.xp - 1 : a;
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
    JD: "L1_Terrain048.PNG"
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
    if (-0.3 < sampleNoise(this.ow, c, d)) {
      return null;
    }
    c = (sampleNoise(this.qD, c, d) - -0.8) / (2 / this.Dr.length) | 0;
    return c > this.Dr.length ? game.terrainSprites.getSprite("L2_Town01.PNG") : game.terrainSprites.getSprite(this.Dr[c]);
  };
  DecorationBiome.prototype.getDecorationSpriteAt = function (a, b) {
    var c = a * game.tileSize,
      d = b * game.tileSize;
    if (-0.3 < sampleNoise(this.ow, c, d)) {
      return null;
    }
    c = (sampleNoise(this.fE, c, d) - -0.8) / (0.1 / this.Fs.length) | 0;
    return c > this.Fs.length ? null : game.terrainSprites.getSprite(this.Fs[c]);
  };
  WorldGenerator.prototype.Ut = function (a) {
    var b;
    if (b = game.shops.zx[a.dungeonId]) {
      if (a = game.world.hb(b.iq, b.jq)) {
        b = game.terrainSprites.getSprite(randomShopSprite(game.shops));
        a.setDecorationSprite(b);
      }
    } else {
      b = game.shops;
      for (var c = a.vw(), d = a.ww(), f = a.bc(), g = a.cc(), h = 1 + c * WORLD_BLOCK_COLUMNS + randomInt(WORLD_BLOCK_COLUMNS - 1), l = 1 + d * WORLD_BLOCK_ROWS + randomInt(WORLD_BLOCK_ROWS - 1); h === f && l === g;) {
        h = 1 + c * WORLD_BLOCK_COLUMNS + randomInt(WORLD_BLOCK_COLUMNS - 1);
        l = 1 + d * WORLD_BLOCK_ROWS + randomInt(WORLD_BLOCK_ROWS - 1);
      }
      b.Ut(new Shop(a.dungeonId, h, l));
    }
  };
  WorldTile.prototype.dc = function () {
    return this.NC;
  };
  WorldTile.prototype.ec = function () {
    return this.OC;
  };
  WorldTile.prototype.bc = function () {
    return this.worldColumn;
  };
  WorldTile.prototype.cc = function () {
    return this.worldRow;
  };
  WorldTile.prototype.setBackgroundSprite = function (a) {
    this.Jn = a;
  };
  WorldTile.prototype.setDecorationSprite = function (a) {
    this.Yf = a;
  };
  WorldBlock.prototype.Aw = function () {
    var a,
      b,
      c,
      d = this.Hd * this.rc,
      f = this.Id * this.sc;
    for (b = 0; b < this.rc; b++) {
      c = [];
      for (a = 0; a < this.sc; a++) {
        c.push(new WorldTile(d + b, f + a));
      }
      this.jo.push(c);
    }
  };
  WorldMap.prototype.hb = function (a, b) {
    var c = (a / WORLD_BLOCK_COLUMNS | 0) - this.blockOriginColumn,
      d = (b / WORLD_BLOCK_ROWS | 0) - this.blockOriginRow;
    if (0 > c || 3 <= c || 0 > d || 3 <= d) {
      return null;
    }
    c = this.worldBlocks[c][d];
    return getBlockTile(c, a - (c.yp / game.tileSize | 0), b - (c.zp / game.tileSize | 0));
  };
  WorldMap.prototype.bc = function (a) {
    return a / game.tileSize | 0;
  };
  WorldMap.prototype.cc = function (a) {
    return a / game.tileSize | 0;
  };
  WorldMap.prototype.vw = function (a) {
    return this.bc(a) / WORLD_BLOCK_COLUMNS | 0;
  };
  WorldMap.prototype.ww = function (a) {
    return this.cc(a) / WORLD_BLOCK_ROWS | 0;
  };
  WorldMap.prototype.dc = function (a) {
    return a * game.tileSize | 0;
  };
  WorldMap.prototype.ec = function (a) {
    return a * game.tileSize | 0;
  };
}
