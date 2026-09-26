// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 地牢网格、房间、门、走廊与可见性。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { distanceToPoint, randomInt, randomIntFrom, setVector } from "../core/math.js";
import { game } from "../runtime/game.js";
import { rollGoldDrop, treasureRoomModifier } from "../content/balance.js";
import { GoldDrop } from "../loot/treasure.js";
export var EMPTY_TILE;
export function DungeonTile(a, b, c, d) {
  this.tileColumn = a;
  this.tileRow = b;
  this.pixelColumn = c;
  this.pixelRow = d;
  this.bt = this.Yf = this.Jn = null;
  this.Rb = EMPTY_TILE;
  this.Pq = null;
  this.li = 0;
}
export function setTileEffect(a, b) {
  a.Pq = b;
  a.li = b ? randomInt(b.li) : 0;
}
export function DungeonRoom(a, b, c, d, f) {
  this.roomId = 0;
  this.tileColumn = a;
  this.tileRow = b;
  this.widthInTiles = c;
  this.heightInTiles = d;
  this.Yp = f;
  this.ro = [];
  this.Nc = [];
  this.tileGrid = this.theme = this.stairs = null;
  this.Xi = false;
}
export function roomLeftPixels(a) {
  return a.tileColumn * game.tileSize;
}
export function roomRightPixels(a) {
  return a.tileColumn * game.tileSize + a.widthInTiles * game.tileSize;
}
export function roomTopPixels(a) {
  return a.tileRow * game.tileSize;
}
export function roomBottomPixels(a) {
  return a.tileRow * game.tileSize + a.heightInTiles * game.tileSize;
}
export function roomContainsTile(a, b, c) {
  return b >= a.tileColumn && b < a.tileColumn + a.widthInTiles && c >= a.tileRow && c < a.tileRow + a.heightInTiles;
}
export function isRoomBorder(a, b, c) {
  return c === a.tileRow - 1 || c === a.tileRow + a.heightInTiles ? b >= a.tileColumn - 1 && b <= a.tileColumn + a.widthInTiles : b === a.tileColumn - 1 || b === a.tileColumn + a.widthInTiles ? c >= a.tileRow - 1 && c <= a.tileRow + a.heightInTiles : false;
}
export function revealRoom(a) {
  var b = !a.Xi;
  a.Xi = true;
  if (b) {
    if (0 === a.Yp && treasureRoomModifier.currentValue && 0.25 > Math.random()) {
      a.Yp = 3;
    }
    var c = a.tileColumn,
      d = c + a.widthInTiles,
      f = a.tileRow,
      g = f + a.heightInTiles,
      b = a.Nc,
      h,
      l,
      n,
      p = game.terrainSprites.getSprite(a.theme.floor);
    n = game.terrainSprites.getSprite(a.theme.wallSprites.Cg);
    var s = game.terrainSprites.getSprite(a.theme.wallSprites.Eg);
    h = a.tileGrid[c - 1][f - 1];
    h.setBackgroundSprite(p);
    h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.wallSprites.Gg));
    h = a.tileGrid[d][f - 1];
    h.setBackgroundSprite(p);
    h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.wallSprites.Hg));
    h = a.tileGrid[c - 1][g];
    h.setBackgroundSprite(p);
    h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.wallSprites.Dg));
    h = a.tileGrid[d][g];
    h.setBackgroundSprite(p);
    h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.wallSprites.Fg));
    for (l = c; l < d; l++) {
      h = a.tileGrid[l][f - 1];
      h.setBackgroundSprite(p);
      if (!h.Yf) {
        h.setDecorationSprite(n);
      }
    }
    for (l = c; l < d; l++) {
      h = a.tileGrid[l][g];
      h.setBackgroundSprite(p);
      if (!h.Yf) {
        h.setDecorationSprite(n);
      }
    }
    for (n = f; n < g; n++) {
      h = a.tileGrid[c - 1][n];
      h.setBackgroundSprite(p);
      if (!h.Yf) {
        h.setDecorationSprite(s);
      }
    }
    for (n = f; n < g; n++) {
      h = a.tileGrid[d][n];
      h.setBackgroundSprite(p);
      if (!h.Yf) {
        h.setDecorationSprite(s);
      }
    }
    for (l = c; l < d; l++) {
      for (c = a.tileGrid[l], n = f; n < g; n++) {
        h = c[n];
        h.setBackgroundSprite(p);
      }
    }
    for (d = 0; d < b.length; d++) {
      f = b[d];
      h = a.tileGrid[f.wj][f.xj];
      h.setBackgroundSprite(p);
      if (f.Ho) {
        if (f.isOpen) {
          h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.kg));
        } else {
          h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.Vf));
        }
      } else {
        if (f.isOpen) {
          h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.jg));
        } else {
          h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.Uf));
        }
      }
    }
    if (a.stairs) {
      h = a.tileGrid[a.stairs.Ex][a.stairs.Fx];
      h.setBackgroundSprite(p);
      if (a.stairs.Fq) {
        if (a.stairs.sq) {
          h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.stairs.Lh));
        } else {
          h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.stairs.di));
        }
      } else {
        if (a.stairs.sq) {
          h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.stairs.Kh));
        } else {
          h.setDecorationSprite(game.terrainSprites.getSprite(a.theme.stairs.ci));
        }
      }
    }
    p = a.theme.Th;
    h = a.tileGrid;
    b = game.decorations;
    if (!(!p || 0 === p.length || 0.2 > b.seededRandom.random() || !(p = 1 === p.length ? p[0] : randomIntFrom(b.seededRandom, p.length)))) {
      if (p.Oo && 0 < p.Oo.length) {
        if (g = a.tileColumn, d = a.tileRow, f = d + a.heightInTiles - 1, g = g + 1 + randomIntFrom(b.seededRandom, g + a.widthInTiles - 1 - g - 2), d = d + 1 + randomIntFrom(b.seededRandom, f - d - 2), setVector(b.yh, g, d), f = b.yh, d = h[f.x][f.y], d) {
          if (!d.Yf) {
            if (f = p.Oo[randomIntFrom(b.seededRandom, p.Oo.length)]) {
              d.setDecorationSprite(game.terrainSprites.getSprite(f));
            } else {
              console.log("failed to select floor sprite.");
            }
          }
        } else {
          console.log("invalid level tile. col=" + f.x + " row=" + f.y);
        }
      }
      if (0.5 > b.seededRandom.random()) {
        d = b.Xw(a);
        p = p.JC;
      } else {
        d = b.Zw(a);
        p = p.KC;
      }
      if (d && p && 0 !== p.length && canPlaceRoomObject(a, d)) {
        if (h = h[d.x][d.y], h) {
          if (!h.bt) {
            if (b = p[randomIntFrom(b.seededRandom, p.length)]) {
              h.bt = game.terrainSprites.getSprite(b);
            } else {
              console.log("failed to select wall sprite.");
            }
          }
        } else {
          console.log("invalid level tile. col=" + d.x + " row=" + d.y);
        }
      }
    }
    if (3 === a.Yp) {
      for (d = a.tileColumn + 1, b = d + a.widthInTiles, h = a.tileRow + 1, p = h + a.heightInTiles, l = d; l < b; l++) {
        for (g = a.tileGrid[l], c = h; c < p; c++) {
          if (0.8 > Math.random()) {
            d = 2 * rollGoldDrop();
            if (0 < d) {
              f = g[c];
              game.goldDrops.pe.push(new GoldDrop(d, f.getLevelPositionX(), f.getLevelPositionY(), a));
            }
          }
        }
      }
    }
  }
}
export function clampPointToRoom(a, b, c) {
  if (b) {
    var d = b.x,
      f = b.y,
      g = (a.tileColumn - 1) * game.tileSize + c,
      h = roomRightPixels(a) - c,
      l = (a.tileRow - 1) * game.tileSize + c;
    a = roomBottomPixels(a) - c;
    if (d < g) {
      d = g;
    } else {
      if (d > h) {
        d = h;
      }
    }
    if (f < l) {
      f = l;
    } else {
      if (f > a) {
        f = a;
      }
    }
    setVector(b, d, f);
  }
}
export function isPointNearDoor(a, b) {
  if (!a.Nc) {
    return false;
  }
  var c;
  for (c = 0; c < a.Nc.length; c++) {
    if (distanceToPoint(b, a.Nc[c].me, a.Nc[c].ne) < game.tileSize) {
      return true;
    }
  }
  return false;
}
export function canPlaceRoomObject(a, b) {
  var c = b.x,
    d = b.y,
    f;
  for (f = 0; f < a.Nc.length; f++) {
    if (c === a.Nc[f].wj && d === a.Nc[f].xj) {
      return false;
    }
  }
  return a.stairs && c === a.stairs.Ex && d === a.stairs.Fx ? false : true;
}
export function DungeonDoor(a) {
  this.ne = this.me = this.xj = this.wj = 0;
  this.isOpen = false;
  this.Ho = true;
  this.$d = a;
  this.Yk = null;
}
export function DungeonStairs(a) {
  this.$d = a;
  this.uq = this.tq = this.Fx = this.Ex = 0;
  this.sq = this.Fq = true;
}
export function positionStairs(a, b, c) {
  a.Ex = b;
  a.Fx = c;
  a.tq = b * game.tileSize;
  a.uq = c * game.tileSize;
}
export function DungeonHallway(a, b, c, d) {
  this.hallwayId = 0;
  this.Bl = a;
  this.af = b;
  this.Cl = c;
  this.Be = d;
  this.Sk = [];
  this.tileGrid = this.theme = null;
  this.Km = false;
}
export function getOppositeDoor(a, b) {
  if (b === a.af) {
    return a.Be;
  }
  if (b === a.Be) {
    return a.af;
  }
  console.log("failed to find opposite door in hallway");
  return null;
}
export function revealHallway(a, b) {
  var c = b && !a.Km;
  a.Km = b;
  if (c) {
    var c = a.Sk,
      d,
      f,
      g,
      h = game.terrainSprites.getSprite(a.theme.floor),
      l = game.terrainSprites.getSprite(a.theme.wallSprites.Cg),
      n = game.terrainSprites.getSprite(a.theme.wallSprites.Eg),
      p = game.terrainSprites.getSprite(a.theme.wallSprites.Hg),
      s = game.terrainSprites.getSprite(a.theme.wallSprites.Gg),
      u = game.terrainSprites.getSprite(a.theme.wallSprites.Fg),
      y = game.terrainSprites.getSprite(a.theme.wallSprites.Dg),
      A = game.terrainSprites.getSprite(a.theme.wallSprites.Bh),
      C = game.terrainSprites.getSprite(a.theme.wallSprites.Ah),
      v = game.terrainSprites.getSprite(a.theme.wallSprites.zh),
      D = game.terrainSprites.getSprite(a.theme.wallSprites.Ch);
    for (g = 0; g < c.length; g++) {
      d = c[g];
      f = a.tileGrid[d.x][d.y];
      f.setBackgroundSprite(h);
    }
    var N = null,
      I = null,
      x,
      z,
      O,
      J,
      la,
      Q,
      V,
      na,
      K;
    for (g = 0; g < c.length; g++) {
      d = c[g];
      I = g + 1 < c.length ? c[g + 1] : null;
      x = d.x;
      z = d.y;
      if (!N) {
        f = a.tileGrid[x][z];
        f.setBackgroundSprite(h);
        if (a.af.Ho) {
          if (a.af.isOpen) {
            f.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.kg));
          } else {
            f.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.Vf));
          }
        } else {
          if (a.af.isOpen) {
            f.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.jg));
          } else {
            f.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.Uf));
          }
        }
        Q = z > I.y;
        V = z < I.y;
        K = x > I.x;
        na = x < I.x;
        if (K) {
          f = a.tileGrid[x][z - 1];
          f.setBackgroundSprite(h);
          f.setDecorationSprite(A);
          f = a.tileGrid[x][z + 1];
          f.setBackgroundSprite(h);
          f.setDecorationSprite(A);
        } else {
          if (na) {
            f = a.tileGrid[x][z - 1];
            f.setBackgroundSprite(h);
            f.setDecorationSprite(C);
            f = a.tileGrid[x][z + 1];
            f.setBackgroundSprite(h);
            f.setDecorationSprite(C);
          } else {
            if (Q) {
              f = a.tileGrid[x + 1][z];
              f.setBackgroundSprite(h);
              f.setDecorationSprite(v);
              f = a.tileGrid[x - 1][z];
              f.setBackgroundSprite(h);
              f.setDecorationSprite(v);
            } else {
              if (V) {
                f = a.tileGrid[x + 1][z];
                f.setBackgroundSprite(h);
                f.setDecorationSprite(D);
                f = a.tileGrid[x - 1][z];
                f.setBackgroundSprite(h);
                f.setDecorationSprite(D);
              }
            }
          }
        }
      }
      if (!I) {
        f = a.tileGrid[x][z];
        f.setBackgroundSprite(h);
        if (a.Be.Ho) {
          if (a.Be.isOpen) {
            f.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.kg));
          } else {
            f.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.Vf));
          }
        } else {
          if (a.Be.isOpen) {
            f.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.jg));
          } else {
            f.setDecorationSprite(game.terrainSprites.getSprite(a.theme.Ac.Uf));
          }
        }
        f = z < N.y;
        O = z > N.y;
        la = x < N.x;
        if (J = x > N.x) {
          f = a.tileGrid[x][z - 1];
          f.setBackgroundSprite(h);
          f.setDecorationSprite(A);
          f = a.tileGrid[x][z + 1];
          f.setBackgroundSprite(h);
          f.setDecorationSprite(A);
        } else {
          if (la) {
            f = a.tileGrid[x][z - 1];
            f.setBackgroundSprite(h);
            f.setDecorationSprite(C);
            f = a.tileGrid[x][z + 1];
            f.setBackgroundSprite(h);
            f.setDecorationSprite(C);
          } else {
            if (O) {
              f = a.tileGrid[x + 1][z];
              f.setBackgroundSprite(h);
              f.setDecorationSprite(v);
              f = a.tileGrid[x - 1][z];
              f.setBackgroundSprite(h);
              f.setDecorationSprite(v);
            } else {
              if (f) {
                f = a.tileGrid[x + 1][z];
                f.setBackgroundSprite(h);
                f.setDecorationSprite(D);
                f = a.tileGrid[x - 1][z];
                f.setBackgroundSprite(h);
                f.setDecorationSprite(D);
              }
            }
          }
        }
      }
      if (N && I) {
        f = z < N.y;
        O = z > N.y;
        la = x < N.x;
        J = x > N.x;
        Q = z > I.y;
        V = z < I.y;
        K = x > I.x;
        na = x < I.x;
        if (f && K) {
          paintHallwayTile(a.tileGrid[x + 1][z], h, n, false);
          paintHallwayTile(a.tileGrid[x + 1][z - 1], h, p, true);
          paintHallwayTile(a.tileGrid[x][z - 1], h, l, false);
          paintHallwayTile(a.tileGrid[x - 1][z + 1], h, p, true);
        } else {
          if (f && Q) {
            paintHallwayTile(a.tileGrid[x - 1][z], h, n, false);
            paintHallwayTile(a.tileGrid[x + 1][z], h, n, false);
          } else {
            if (f && na) {
              paintHallwayTile(a.tileGrid[x - 1][z], h, n, false);
              paintHallwayTile(a.tileGrid[x - 1][z - 1], h, s, true);
              paintHallwayTile(a.tileGrid[x][z - 1], h, l, false);
              paintHallwayTile(a.tileGrid[x + 1][z + 1], h, s, true);
            } else {
              if (O && K) {
                paintHallwayTile(a.tileGrid[x + 1][z], h, n, false);
                paintHallwayTile(a.tileGrid[x + 1][z + 1], h, u, true);
                paintHallwayTile(a.tileGrid[x][z + 1], h, l, false);
                paintHallwayTile(a.tileGrid[x - 1][z - 1], h, u, true);
              } else {
                if (O && V) {
                  paintHallwayTile(a.tileGrid[x - 1][z], h, n, false);
                  paintHallwayTile(a.tileGrid[x + 1][z], h, n, false);
                } else {
                  if (O && na) {
                    paintHallwayTile(a.tileGrid[x - 1][z], h, n, false);
                    paintHallwayTile(a.tileGrid[x - 1][z + 1], h, y, true);
                    paintHallwayTile(a.tileGrid[x][z + 1], h, l, false);
                    paintHallwayTile(a.tileGrid[x + 1][z - 1], h, y, true);
                  } else {
                    if (la && K) {
                      paintHallwayTile(a.tileGrid[x][z - 1], h, l, false);
                      paintHallwayTile(a.tileGrid[x][z + 1], h, l, false);
                    } else {
                      if (la && V) {
                        paintHallwayTile(a.tileGrid[x - 1][z], h, n, false);
                        paintHallwayTile(a.tileGrid[x - 1][z - 1], h, s, true);
                        paintHallwayTile(a.tileGrid[x][z - 1], h, l, false);
                        paintHallwayTile(a.tileGrid[x + 1][z + 1], h, s, true);
                      } else {
                        if (la && Q) {
                          paintHallwayTile(a.tileGrid[x - 1][z], h, n, false);
                          paintHallwayTile(a.tileGrid[x - 1][z + 1], h, y, true);
                          paintHallwayTile(a.tileGrid[x][z + 1], h, l, false);
                          paintHallwayTile(a.tileGrid[x + 1][z - 1], h, y, true);
                        } else {
                          if (J && Q) {
                            paintHallwayTile(a.tileGrid[x + 1][z], h, n, false);
                            paintHallwayTile(a.tileGrid[x + 1][z + 1], h, u, true);
                            paintHallwayTile(a.tileGrid[x][z + 1], h, l, false);
                            paintHallwayTile(a.tileGrid[x - 1][z - 1], h, u, true);
                          } else {
                            if (J && V) {
                              paintHallwayTile(a.tileGrid[x + 1][z], h, n, false);
                              paintHallwayTile(a.tileGrid[x + 1][z - 1], h, p, true);
                              paintHallwayTile(a.tileGrid[x][z - 1], h, l, false);
                              paintHallwayTile(a.tileGrid[x - 1][z + 1], h, p, true);
                            } else {
                              if (J && na) {
                                paintHallwayTile(a.tileGrid[x][z - 1], h, l, false);
                                paintHallwayTile(a.tileGrid[x][z + 1], h, l, false);
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
      N = d;
    }
  }
}
export function paintHallwayTile(a, b, c, d) {
  if (1 !== a.Rb) {
    a.setBackgroundSprite(b);
    if (!(!d && a.Yf)) {
      a.setDecorationSprite(c);
    }
  }
}
export function initializeWorldRooms() {
  DungeonTile.prototype.Ai = function () {
    return this.tileColumn;
  };
  DungeonTile.prototype.Bi = function () {
    return this.tileRow;
  };
  DungeonTile.prototype.getPixelX = function () {
    return this.pixelColumn;
  };
  DungeonTile.prototype.getPixelY = function () {
    return this.pixelRow;
  };
  DungeonTile.prototype.setBackgroundSprite = function (a) {
    this.Jn = a;
  };
  DungeonTile.prototype.setDecorationSprite = function (a) {
    this.Yf = a;
  };
  DungeonTile.prototype.qB = function (a) {
    this.li = a;
  };
  EMPTY_TILE = 0;
  DungeonRoom.prototype.xx = function (a, b) {
    this.theme = a;
    this.tileGrid = b;
  };
  DungeonRoom.prototype.yx = function () {
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
  DungeonRoom.prototype.gt = function () {
    if (1 < this.tileRow) {
      this.tileRow--;
    }
  };
  DungeonRoom.prototype.Bq = function (a) {
    this.Lw(a);
    var b, c;
    c = this.tileRow - 1;
    for (b = this.tileColumn - 1; b < this.tileColumn + this.widthInTiles + 1; b++) {
      a[b][c].Rb = 2;
    }
    c = this.tileRow + this.heightInTiles;
    for (b = this.tileColumn - 1; b < this.tileColumn + this.widthInTiles + 1; b++) {
      a[b][c].Rb = 2;
    }
    b = this.tileColumn - 1;
    b = a[b];
    for (c = this.tileRow - 1; c < this.tileRow + this.heightInTiles + 1; c++) {
      b[c].Rb = 2;
    }
    b = this.tileColumn + this.widthInTiles;
    b = a[b];
    for (c = this.tileRow - 1; c < this.tileRow + this.heightInTiles + 1; c++) {
      b[c].Rb = 2;
    }
  };
  DungeonRoom.prototype.Lw = function (a) {
    var b,
      c,
      d = this.tileColumn + this.widthInTiles,
      f = this.tileRow + this.heightInTiles,
      g;
    for (c = this.tileColumn; c < d; c++) {
      for (b = a[c], g = this.tileRow; g < f; g++) {
        b[g].Rb = 1;
      }
    }
  };
  DungeonRoom.prototype.Ud = function (a) {
    var b = a.tileColumn + a.widthInTiles / 2 - (this.tileColumn + this.widthInTiles / 2);
    a = a.tileRow + a.heightInTiles / 2 - (this.tileRow + this.heightInTiles / 2);
    return b * b + a * a;
  };
  DungeonHallway.prototype.xx = function (a, b) {
    this.theme = a;
    this.tileGrid = b;
  };
  DungeonHallway.prototype.Bq = function (a) {
    var b, c;
    for (c = 0; c < this.Sk.length; c++) {
      b = this.Sk[c];
      var d = b.x;
      b = b.y;
      var f = a[d - 1],
        g = a[d],
        d = a[d + 1];
      f[b - 1].Rb = 2;
      f[b].Rb = 2;
      f[b + 1].Rb = 2;
      g[b - 1].Rb = 2;
      g[b].Rb = 2;
      g[b + 1].Rb = 2;
      d[b - 1].Rb = 2;
      d[b].Rb = 2;
      d[b + 1].Rb = 2;
    }
    this.Lw(a);
  };
  DungeonHallway.prototype.Lw = function (a) {
    var b, c;
    for (c = 0; c < this.Sk.length; c++) {
      b = this.Sk[c];
      a[b.x][b.y].Rb = 1;
    }
    a[this.af.wj][this.af.xj].Rb = 3;
    a[this.Be.wj][this.Be.xj].Rb = 3;
  };
}
