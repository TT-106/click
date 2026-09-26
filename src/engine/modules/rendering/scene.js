/** 深度排序、即时渲染与地图画面。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { Vector2, distanceToPoint, randomInt, setVector } from "../core/math.js";
import { game } from "../runtime/game.js";
import { EMPTY_TILE } from "../world/rooms.js";
import { projectDungeonX, projectDungeonY, projectWorldX, projectWorldY } from "../simulation/characters.js";
import { statValue } from "../characters/stats.js";
import { View } from "../views/base.js";
import { canAttackCastle } from "../world/regions.js";
import { getScrollSprite } from "../combat/scrolls.js";
import { getMonsters } from "../combat/encounters.js";
import { TARGETED_EFFECT } from "./sprites.js";
import { createElement, getElement } from "../views/dom.js";
export function RenderCommand() {
  this.animation = this.sprite = null;
  this.vr = this.ur = this.frameIndex = 0;
  this.pt = false;
  this.alpha = this.am = this.$q = this.Zq = 0;
}
export function resetRenderCommand(a) {
  a.pt = false;
  a.sprite = null;
  a.animation = null;
  a.ur = 1E5;
  a.vr = 0;
}
export function setSpriteRenderCommand(a, b, c, d, f, g, h) {
  a.sprite = b;
  a.ur = c;
  a.Zq = d;
  a.$q = f;
  a.am = g;
  a.alpha = h;
  a.pt = true;
}
export function setAnimationRenderCommand(a, b, c, d, f, g, h, l) {
  a.animation = b;
  a.frameIndex = c;
  a.ur = d;
  a.Zq = f;
  a.$q = g;
  a.am = h;
  a.alpha = l;
  a.pt = true;
}
export function DepthSortedRenderer() {
  this.FE = function (a, b) {
    return a.getRenderSortKey() - b.getRenderSortKey();
  };
  this.ko = new Vector2();
  this.Hl = [];
  this.Bn = 0;
  this.context = null;
}
export function acquireRenderCommand(a) {
  var b;
  if (a.Bn >= a.Hl.length) {
    b = new RenderCommand();
    a.Hl.push(b);
  } else {
    b = a.Hl[a.Bn];
  }
  a.Bn++;
  return b;
}
export function ImmediateRenderer() {
  this.context = null;
  this.uB = new RenderCommand();
}
export function acquireImmediateCommand(a) {
  resetRenderCommand(a.uB);
  return a.uB;
}
export function SceneRenderer(a) {
  this.context = a;
  this.se = null;
  this.uE = new DepthSortedRenderer();
  this.DD = new ImmediateRenderer();
}
export function drawWorldTileRow(a, b, c, d) {
  for (; c < d; c++) {
    var f = a,
      g = game.world.getTileAtPixel(c, b);
    if (g) {
      var h;
      h = game.camera;
      h = game.viewportHalfWidth + (c - h.vk - (b - h.wk)) * game.tileSize - h.zt;
      var l;
      l = game.camera;
      l = game.viewportHalfHeight + (c - l.vk + (b - l.wk)) * game.halfTileSize - l.At;
      f.If(g.Jn, h, l);
      var n = g.Yf;
      if (n) {
        f.se.dk(n, g.getPixelX(), g.getPixelY(), h, l, n.spriteSheet.spriteSize, 0);
      }
    }
  }
}
export function drawDungeonTileRow(a, b, c, d) {
  for (; c < d; c++) {
    var f = a,
      g = game.level.getTileAt(c, b);
    if (g && g.floorType !== EMPTY_TILE) {
      var h;
      h = game.camera;
      h = game.viewportHalfWidth + (c - h.vk - (b - h.wk)) * game.tileSize - h.zt;
      var l;
      l = game.camera;
      l = game.viewportHalfHeight + (c - l.vk + (b - l.wk)) * game.halfTileSize - l.At;
      f.If(g.Jn, h, l);
      var n = g.Yf;
      if (n) {
        f.se.dk(n, g.getPixelX(), g.getPixelY(), h, l, n.spriteSheet.spriteSize, 0);
      }
      if (n = g.bt) {
        f.se.gx(n, g.getPixelX(), g.getPixelY(), h, l, n.spriteSheet.spriteSize, 0);
      }
    }
  }
}
export function drawWorldCharacters(a, b) {
  var c, d, f, g;
  for (g = b.length - 1; 0 <= g; g--) {
    c = b[g];
    d = c.position.getWorldPositionX();
    f = c.position.getWorldPositionY();
    c = c.getSprite();
    a.se.dk(c, d, f, game.viewportHalfWidth + (d - game.world.he - (f - game.world.ie)), game.viewportHalfHeight + 0.5 * (d - game.world.he + (f - game.world.ie)), c.spriteSheet.spriteSize, 0);
  }
}
export function drawDungeonCharacters(a, b) {
  var c,
    d,
    f,
    g,
    h,
    l = false,
    n;
  for (n = b.length - 1; 0 <= n; n--) {
    c = b[n];
    d = c.position.getLevelPositionX();
    f = c.position.getLevelPositionY();
    g = projectDungeonX(d, f);
    h = projectDungeonY(d, f);
    l = c.effects.isStealthed;
    c = c.getSprite();
    a.se.dk(c, d, f, g, h, c.spriteSheet.spriteSize, l ? 0.4 : 0);
  }
}
export function drawCharacterEffects(a, b) {
  var c, d, f, g, h, l, n, p, s, u, y;
  for (c = 0; c < b.length; c++) {
    if (f = b[c], !f.isDead) {
      for (y = false, p = f.effects.of, d = 0; d < p.length; d++) {
        if (s = p[d], s.Pd && (s = s.hD)) {
          u = p[d].Od;
          if (!y) {
            g = f.position.getLevelPositionX();
            h = f.position.getLevelPositionY();
            l = projectDungeonX(g, h) + 10;
            n = projectDungeonY(g, h) + 10;
            y = true;
          }
          a.se.fx(s, u, g, h, l, n, s.spriteSheet.spriteSize, 0);
        }
      }
    }
  }
}
export function drawFloatingText(a) {
  var b, c, d;
  d = game.floatingText.al;
  if (0 !== d.length) {
    for (a.context.font = "12px Georgia", b = 0; b < d.length; b++) {
      c = d[b];
      a.context.fillStyle = c.SE;
      a.context.fillText(c.text, c.xt, c.yt);
    }
  }
}
export function drawEntityHighlight(a, b, c, d) {
  b = b.ck;
  var f, g;
  g = game.regions;
  var h = g.Rh,
    l = g.Sh,
    n;
  for (g = 0; g < b.length; g++) {
    f = b[g];
    n = c * (f.Hd - h);
    f = d * (f.Id - l);
    a.context.fillRect(n, f, c, d);
  }
}
export function drawCharacterHighlights(a, b, c) {
  var d, f, g, h, l;
  for (d = 0; d < b.length; d++) {
    l = b[d];
    if (!l.isDead) {
      f = l.position.getLevelPositionX();
      g = l.position.getLevelPositionY();
      h = projectDungeonX(f, g);
      f = projectDungeonY(f, g);
      g = l.stats;
      l = g.health;
      g = statValue(g.maxHealth);
      if (l === g) {
        a.context.fillStyle = c;
        a.context.fillRect(h + 10, f + 0, 30, 4);
      } else {
        a.context.fillStyle = "white";
        a.context.fillRect(h + 10, f + 0, 30, 4);
        a.context.fillStyle = c;
        a.context.fillRect(h + 10, f + 0, l / g * 30 | 0, 4);
      }
    }
  }
}
export function randomLightningOffset() {
  var a = Math.max(2, randomInt(5));
  return 0.5 > Math.random() ? -a : a;
}
export function GameCanvasView() {
  this.kE = "gameTabContent";
  this.elementId = "gameCanvas";
  this.gB = null;
}
export function initializeRenderingScene() {
  RenderCommand.prototype.getRenderSortKey = function () {
    return this.ur - this.vr;
  };
  RenderCommand.prototype.If = function (a) {
    if (this.pt) {
      if (0 < this.alpha) {
        a.save();
        a.globalAlpha = 0.4;
      }
      var b;
      if (this.sprite) {
        b = this.sprite.spriteSheet.spriteSize;
        a.drawImage(this.sprite.Hj(), this.sprite.sourceX, this.sprite.sourceY, b, b, this.Zq, this.$q, this.am, this.am);
      } else if (this.animation) {
        var c = this.animation.frames[this.frameIndex];
        b = this.animation.spriteSheet.spriteSize;
        a.drawImage(this.animation.Hj(), c.frameSourceX, c.frameSourceY, b, b, this.Zq, this.$q, this.am, this.am);
      }
      if (0 < this.alpha) {
        a.restore();
      }
    }
  };
  DepthSortedRenderer.prototype.hB = function (a) {
    this.context = a;
    for (a = this.Bn = 0; a < this.Hl.length; a++) {
      resetRenderCommand(this.Hl[a]);
    }
    var b = game.viewportWidth / 2,
      c = 2 * game.viewportHeight;
    if (game.worldActive) {
      a = game.world.he + (0.5 * (b - game.viewportHalfWidth) + (c - game.viewportHalfHeight)) | 0;
      b = game.world.ie + (c - game.viewportHalfHeight - 0.5 * (b - game.viewportHalfWidth)) | 0;
    } else {
      a = game.level.Ki + (0.5 * (b - game.viewportHalfWidth) + (c - game.viewportHalfHeight)) | 0;
      b = game.level.Li + (c - game.viewportHalfHeight - 0.5 * (b - game.viewportHalfWidth)) | 0;
    }
    setVector(this.ko, a, b);
  };
  DepthSortedRenderer.prototype.dk = function (a, b, c, d, f, g, h) {
    if (a) {
      b = distanceToPoint(this.ko, b, c);
      setSpriteRenderCommand(acquireRenderCommand(this), a, b, d, f, g, h);
    }
  };
  DepthSortedRenderer.prototype.gx = function (a, b, c, d, f, g, h) {
    if (a) {
      b = distanceToPoint(this.ko, b, c);
      c = acquireRenderCommand(this);
      setSpriteRenderCommand(c, a, b, d, f, g, h);
      c.vr = 0.1;
    }
  };
  DepthSortedRenderer.prototype.fB = function (a, b, c, d, f, g, h, l) {
    if (a) {
      c = distanceToPoint(this.ko, c, d);
      setAnimationRenderCommand(acquireRenderCommand(this), a, b, c, f, g, h, l);
    }
  };
  DepthSortedRenderer.prototype.fx = function (a, b, c, d, f, g, h, l) {
    if (a) {
      c = distanceToPoint(this.ko, c, d);
      d = acquireRenderCommand(this);
      setAnimationRenderCommand(d, a, b, c, f, g, h, l);
      d.vr = 0.1;
    }
  };
  DepthSortedRenderer.prototype.hx = function () {
    if (!(2 > this.Bn)) {
      this.Hl.sort(this.FE);
    }
    var a;
    for (a = this.Bn - 1; 0 <= a; a--) {
      this.Hl[a].If(this.context);
    }
  };
  ImmediateRenderer.prototype.hB = function (a) {
    this.context = a;
  };
  ImmediateRenderer.prototype.dk = function (a, b, c, d, f, g, h) {
    if (a) {
      b = acquireImmediateCommand(this);
      setSpriteRenderCommand(b, a, 0, d, f, g, h);
      b.If(this.context);
    }
  };
  ImmediateRenderer.prototype.gx = function (a, b, c, d, f, g, h) {
    if (a) {
      b = acquireImmediateCommand(this);
      setSpriteRenderCommand(b, a, 0, d, f, g, h);
      b.If(this.context);
    }
  };
  ImmediateRenderer.prototype.fB = function (a, b, c, d, f, g, h, l) {
    if (a) {
      c = acquireImmediateCommand(this);
      setAnimationRenderCommand(c, a, b, 0, f, g, h, l);
      c.If(this.context);
    }
  };
  ImmediateRenderer.prototype.fx = function (a, b, c, d, f, g, h, l) {
    if (a) {
      c = acquireImmediateCommand(this);
      setAnimationRenderCommand(c, a, b, 0, f, g, h, l);
      c.If(this.context);
    }
  };
  ImmediateRenderer.prototype.hx = function () {};
  SceneRenderer.prototype.If = function (a, b, c) {
    if (a) {
      var d = a.spriteSheet.spriteSize;
      this.context.drawImage(a.Hj(), a.sourceX, a.sourceY, d, d, b, c, d, d);
    }
  };
  GameCanvasView.prototype = new View();
  GameCanvasView.prototype.reset = function () {
    (/** @type {GameCanvasView & { pf: () => void }} */ (/** @type {unknown} */ (this))).pf();
  };
  GameCanvasView.prototype.update = function () {
    var a = this.gB;
    a.se = game.options.depthSortSprites ? a.uE : a.DD;
    a.se.hB(a.context);
    if (game.world.ty) {
      if (a.context.fillStyle = "#000000", a.context.fillRect(0, 0, game.viewportWidth, game.viewportHeight), game.worldActive) {
        var b = game.world.pixelToTileColumn(game.world.he),
          c = game.world.pixelToTileRow(game.world.ie) - 18;
        drawWorldTileRow(a, c++, b - 5, b - 3);
        drawWorldTileRow(a, c++, b - 6, b - 2);
        drawWorldTileRow(a, c++, b - 7, b - 1);
        drawWorldTileRow(a, c++, b - 8, b);
        drawWorldTileRow(a, c++, b - 9, b + 1);
        drawWorldTileRow(a, c++, b - 10, b + 2);
        drawWorldTileRow(a, c++, b - 11, b + 3);
        drawWorldTileRow(a, c++, b - 12, b + 4);
        drawWorldTileRow(a, c++, b - 13, b + 5);
        drawWorldTileRow(a, c++, b - 14, b + 6);
        drawWorldTileRow(a, c++, b - 15, b + 7);
        drawWorldTileRow(a, c++, b - 16, b + 8);
        drawWorldTileRow(a, c++, b - 17, b + 9);
        drawWorldTileRow(a, c++, b - 18, b + 10);
        drawWorldTileRow(a, c++, b - 19, b + 11);
        drawWorldTileRow(a, c++, b - 20, b + 12);
        drawWorldTileRow(a, c++, b - 19, b + 13);
        drawWorldTileRow(a, c++, b - 18, b + 14);
        drawWorldTileRow(a, c++, b - 17, b + 15);
        drawWorldTileRow(a, c++, b - 16, b + 16);
        drawWorldTileRow(a, c++, b - 14, b + 16);
        drawWorldTileRow(a, c++, b - 13, b + 16);
        drawWorldTileRow(a, c++, b - 12, b + 15);
        drawWorldTileRow(a, c++, b - 11, b + 14);
        drawWorldTileRow(a, c++, b - 10, b + 13);
        drawWorldTileRow(a, c++, b - 9, b + 12);
        drawWorldTileRow(a, c++, b - 8, b + 11);
        drawWorldTileRow(a, c++, b - 7, b + 10);
        drawWorldTileRow(a, c++, b - 6, b + 9);
        drawWorldTileRow(a, c++, b - 5, b + 8);
        drawWorldTileRow(a, c++, b - 4, b + 7);
        drawWorldTileRow(a, c++, b - 3, b + 6);
        drawWorldTileRow(a, c++, b - 2, b + 5);
        drawWorldTileRow(a, c++, b - 1, b + 4);
        drawWorldTileRow(a, c, b, b + 3);
        drawWorldCharacters(a, game.minions.eh);
        drawWorldCharacters(a, game.state.adventurers);
        if (game.options.showCombatText) {
          drawFloatingText(a);
        }
        a.se.hx();
        if (game.options.showMapOverlay) {
          var d = game.regions,
            f = d.Rh,
            g = d.Sh,
            h = 120 / (d.Rh + d.Eh - f) | 0,
            l = 120 / (d.Sh + d.Eh - g) | 0;
          a.context.save();
          a.context.translate(650, 280);
          a.context.rotate(Math.PI / 4);
          var n = game.monsterCatalog.maxUnlockedLevel,
            p = game.castles.castleList,
            s,
            u;
          a.context.fillStyle = "gray";
          for (u = 0; u < p.length; u++) {
            s = p[u];
            if (s.regionLocked) {
              drawEntityHighlight(a, s, h, l);
            }
          }
          a.context.fillStyle = "green";
          for (u = 0; u < p.length; u++) {
            s = p[u];
            if (s.conquered) {
              drawEntityHighlight(a, s, h, l);
            }
          }
          a.context.fillStyle = "#AA8800";
          for (u = 0; u < p.length; u++) {
            s = p[u];
            if (s.ye) {
              drawEntityHighlight(a, s, h, l);
            }
          }
          a.context.fillStyle = "#885500";
          for (u = 0; u < p.length; u++) {
            s = p[u];
            if (canAttackCastle(s) && n >= s.requiredMonsterLevel) {
              drawEntityHighlight(a, s, h, l);
            }
          }
          a.context.fillStyle = "#AA3300";
          for (u = 0; u < p.length; u++) {
            s = p[u];
            if (canAttackCastle(s) && n < s.requiredMonsterLevel) {
              drawEntityHighlight(a, s, h, l);
            }
          }
          a.context.fillStyle = "white";
          for (u = 0; u < p.length; u++) {
            s = p[u];
            if (!(canAttackCastle(s) || s.regionLocked || s.ye || s.conquered)) {
              drawEntityHighlight(a, s, h, l);
            }
          }
          var y = game.world.worldBlocks[1][1],
            A = h * (y.Hd - f),
            C = l * (y.Id - g);
          a.context.fillStyle = "blue";
          a.context.fillRect(A + 2, C + 2, 4, 4);
          a.context.restore();
        }
      } else {
        var v = game.level.Ai(game.level.Ki),
          D = game.level.Bi(game.level.Li) - 18;
        drawDungeonTileRow(a, D++, v - 5, v - 3);
        drawDungeonTileRow(a, D++, v - 6, v - 2);
        drawDungeonTileRow(a, D++, v - 7, v - 1);
        drawDungeonTileRow(a, D++, v - 8, v);
        drawDungeonTileRow(a, D++, v - 9, v + 1);
        drawDungeonTileRow(a, D++, v - 10, v + 2);
        drawDungeonTileRow(a, D++, v - 11, v + 3);
        drawDungeonTileRow(a, D++, v - 12, v + 4);
        drawDungeonTileRow(a, D++, v - 13, v + 5);
        drawDungeonTileRow(a, D++, v - 14, v + 6);
        drawDungeonTileRow(a, D++, v - 15, v + 7);
        drawDungeonTileRow(a, D++, v - 16, v + 8);
        drawDungeonTileRow(a, D++, v - 17, v + 9);
        drawDungeonTileRow(a, D++, v - 18, v + 10);
        drawDungeonTileRow(a, D++, v - 19, v + 11);
        drawDungeonTileRow(a, D++, v - 20, v + 12);
        drawDungeonTileRow(a, D++, v - 19, v + 13);
        drawDungeonTileRow(a, D++, v - 18, v + 14);
        drawDungeonTileRow(a, D++, v - 17, v + 15);
        drawDungeonTileRow(a, D++, v - 16, v + 16);
        drawDungeonTileRow(a, D++, v - 14, v + 16);
        drawDungeonTileRow(a, D++, v - 13, v + 16);
        drawDungeonTileRow(a, D++, v - 12, v + 15);
        drawDungeonTileRow(a, D++, v - 11, v + 14);
        drawDungeonTileRow(a, D++, v - 10, v + 13);
        drawDungeonTileRow(a, D++, v - 9, v + 12);
        drawDungeonTileRow(a, D++, v - 8, v + 11);
        drawDungeonTileRow(a, D++, v - 7, v + 10);
        drawDungeonTileRow(a, D++, v - 6, v + 9);
        drawDungeonTileRow(a, D++, v - 5, v + 8);
        drawDungeonTileRow(a, D++, v - 4, v + 7);
        drawDungeonTileRow(a, D++, v - 3, v + 6);
        drawDungeonTileRow(a, D++, v - 2, v + 5);
        drawDungeonTileRow(a, D++, v - 1, v + 4);
        drawDungeonTileRow(a, D, v, v + 3);
        var N = game.goldDrops.pe,
          I,
          x,
          z,
          O,
          J,
          la;
        for (la = 0; la < N.length; la++) {
          I = N[la];
          x = I.Xo;
          z = I.Yo;
          O = projectWorldX(x, z);
          J = projectWorldY(x, z);
          var Q = I.Xl,
            V = game.goldDrops;
          a.If(100 > Q ? V.Sz : 1E3 > Q ? V.xw : V.wD, O, J);
        }
        var na = game.scrollDrops.kf,
          K,
          H,
          S,
          da,
          W,
          ia;
        for (ia = 0; ia < na.length; ia++) {
          K = na[ia];
          H = K.bq;
          S = K.cq;
          da = projectWorldX(H, S);
          W = projectWorldY(H, S);
          a.If(getScrollSprite(K.vf()), da, W);
        }
        var ea = game.potionDrops.Hf,
          va,
          yb,
          Fb,
          pa,
          T,
          X;
        for (X = 0; X < ea.length; X++) {
          va = ea[X];
          yb = va.Qp;
          Fb = va.Rp;
          pa = projectWorldX(yb, Fb);
          T = projectWorldY(yb, Fb);
          a.If(va.potion.potionSprite, pa, T);
        }
        var Ca = game.itemDrops.yf,
          qa,
          ta,
          eb,
          Gb,
          Da,
          ub;
        for (ub = 0; ub < Ca.length; ub++) {
          qa = Ca[ub];
          ta = qa.mp;
          eb = qa.np;
          Gb = projectWorldX(ta, eb);
          Da = projectWorldY(ta, eb);
          a.If(qa.getItem().Uk(), Gb, Da);
        }
        var mb = game.treasure.Mn,
          Ea,
          La,
          wa,
          Fa,
          ha,
          ja,
          Ga;
        for (ja = 0; ja < mb.length; ja++) {
          Ea = mb[ja];
          if (Ea.Nn.Xi) {
            La = Ea.zq;
            wa = Ea.Aq;
            Fa = projectWorldX(La, wa);
            ha = projectWorldY(La, wa);
            Ga = Ea.Kg ? Ea.PA : Ea.Vy;
            if (Ea.BC.jh) {
              a.se.gx(Ga, La, wa, Fa, ha, Ga.spriteSheet.spriteSize, 0);
            } else {
              a.se.dk(Ga, La, wa, Fa, ha, Ga.spriteSheet.spriteSize, 0);
            }
          }
        }
        var bb = game.monsters.Og,
          za,
          nb,
          fb,
          cb,
          Ua,
          Va;
        for (Va = 0; Va < bb.length; Va++) {
          za = bb[Va];
          nb = za.position.getLevelPositionX();
          fb = za.position.getLevelPositionY();
          cb = projectWorldX(nb, fb);
          Ua = projectWorldY(nb, fb);
          a.If(za.getSprite(), cb, Ua);
        }
        var mc = getMonsters(),
          vb,
          Sb,
          Ma,
          zb,
          Hb,
          ac = game.tileSize / 2 | 0,
          ob,
          pb;
        for (ob = 0; ob < mc.length; ob++) {
          vb = mc[ob];
          Sb = vb.position.getLevelPositionX();
          Ma = vb.position.getLevelPositionY();
          zb = projectDungeonX(Sb, Ma);
          Hb = projectDungeonY(Sb, Ma);
          pb = vb.getSprite();
          if (4 === vb.characterType) {
            a.se.dk(pb, Sb, Ma, zb - ac, Hb - ac, 3 * game.tileSize, 0);
          } else {
            a.se.dk(pb, Sb, Ma, zb, Hb, pb.spriteSheet.spriteSize, 0);
          }
        }
        drawDungeonCharacters(a, game.minions.eh);
        drawDungeonCharacters(a, game.state.adventurers);
        drawCharacterEffects(a, getMonsters());
        drawCharacterEffects(a, game.minions.eh);
        drawCharacterEffects(a, game.state.adventurers);
        if (game.options.showSpellEffects) {
          var Ha = game.effects.Wg;
          if (Ha && 0 !== Ha.length) {
            var jb,
              Ab,
              Bb,
              qb,
              wb,
              Ib,
              Ec,
              bc,
              Wa,
              cc,
              Qa = null,
              nc = false;
            for (jb = 0; jb < Ha.length; jb++) {
              if (Wa = Ha[jb], cc = Wa.Io, 1 === cc) {
                Ab = Wa.Zg();
                Bb = Wa.wm;
                bc = Wa.frameIndex;
                qb = Bb.x;
                wb = Bb.y;
                Ib = projectDungeonX(qb, wb) + 10;
                Ec = projectDungeonY(qb, wb) + 10;
                a.se.fx(Ab, bc, qb, wb, Ib, Ec, Ab.spriteSheet.spriteSize, 0);
              } else if (2 === cc) {
                var sa = a,
                  Tb = Wa,
                  qc = undefined,
                  Fc = undefined,
                  Cb = undefined,
                  kb = undefined,
                  Ra = undefined,
                  Ja = undefined,
                  Db = undefined,
                  gb = undefined,
                  rb = undefined,
                  dc = undefined;
                sa.context.lineWidth = 1;
                sa.context.strokeStyle = "#FFD700";
                Ja = Tb.iD;
                Db = Ja.x;
                gb = Ja.y;
                rb = projectDungeonX(Db, gb) + game.tileSize;
                dc = projectDungeonY(Db, gb) + game.tileSize;
                qc = Tb.xi;
                Fc = qc.x;
                Cb = qc.y;
                kb = projectDungeonX(Fc, Cb) + game.tileSize;
                Ra = projectDungeonY(Fc, Cb) + game.tileSize;
                sa.context.beginPath();
                sa.context.moveTo(rb, dc);
                var Ka = rb + (kb - rb) / 3 | 0,
                  Xa = dc + (Ra - dc) / 3 | 0;
                Ka = Ka + randomLightningOffset();
                Xa = Xa + randomLightningOffset();
                sa.context.lineTo(Ka, Xa);
                Ka = Ka + (kb - Ka) / 2 | 0;
                Xa = Xa + (Ra - Xa) / 2 | 0;
                Ka += randomLightningOffset();
                Xa += randomLightningOffset();
                sa.context.lineTo(Ka, Xa);
                sa.context.lineTo(kb, Ra);
                sa.context.stroke();
              } else {
                if (cc === TARGETED_EFFECT) {
                  Qa = Wa.ew;
                  nc = true;
                }
              }
            }
            if (nc && Qa) {
              var hb,
                lb,
                rc,
                sc = Qa.tileColumn,
                Aa = Qa.tileRow,
                db = sc + Qa.widthInTiles,
                Mc = Aa + Qa.heightInTiles,
                ec,
                Ub,
                sb,
                ka,
                Eb,
                xb,
                Na;
              for (xb = sc; xb <= db; xb++) {
                for (Na = Aa; Na <= Mc; Na++) {
                  if ((ec = game.level.getTileAt(xb, Na)) && (hb = ec.tileEffect) && hb.hasSpawned && !hb.bl()) {
                    lb = hb.Zg();
                    rc = hb.frameIndex;
                    Ub = ec.getPixelX();
                    sb = ec.getPixelY();
                    ka = projectDungeonX(Ub, sb) + 10;
                    Eb = projectDungeonY(Ub, sb) + 10;
                    a.se.fB(lb, rc, Ub, sb, ka, Eb, lb.spriteSheet.spriteSize, 0);
                  }
                }
              }
            }
          }
        }
        a.se.hx();
        drawCharacterHighlights(a, getMonsters(), "red");
        if (!game.state.encounter.ym) {
          drawCharacterHighlights(a, game.minions.eh, "#007FFF");
          drawCharacterHighlights(a, game.state.adventurers, "#8B008B");
        }
        if (game.options.showCombatText) {
          drawFloatingText(a);
        }
      }
    }
    if (game.options.showFps) {
      a.context.font = "12px Georgia";
      a.context.fillStyle = "white";
      a.context.fillText("帧数: " + game.state.dz, 10, 20);
    }
  };
  GameCanvasView.prototype.pf = function () {
    var a = getElement(this.kE);
    if (a) {
      var b = this.elementId,
        c = /** @type {HTMLCanvasElement | null} */ (getElement(b));
        if (!c) {
          c = /** @type {HTMLCanvasElement} */ (createElement("canvas", a, b, "gameTabTopLeftPanel"));
        c.width = game.viewportWidth;
        c.height = game.viewportHeight;
        c.innerHTML = "你的浏览器不支持Html5.请升级你的浏览器.";
      }
      this.gB = new SceneRenderer(c.getContext("2d"));
      (/** @type {GameCanvasView & { visible: boolean }} */ (/** @type {unknown} */ (this))).visible = true;
    }
  };
}
