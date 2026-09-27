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
  this.raiseOffset = this.sortKey = this.frameIndex = 0;
  this.isSet = false;
  this.alpha = this.renderSize = this.screenY = this.screenX = 0;
}
export function resetRenderCommand(a) {
  a.isSet = false;
  a.sprite = null;
  a.animation = null;
  a.sortKey = 1E5;
  a.raiseOffset = 0;
}
export function setSpriteRenderCommand(a, b, c, d, f, g, h) {
  a.sprite = b;
  a.sortKey = c;
  a.screenX = d;
  a.screenY = f;
  a.renderSize = g;
  a.alpha = h;
  a.isSet = true;
}
export function setAnimationRenderCommand(a, b, c, d, f, g, h, l) {
  a.animation = b;
  a.frameIndex = c;
  a.sortKey = d;
  a.screenX = f;
  a.screenY = g;
  a.renderSize = h;
  a.alpha = l;
  a.isSet = true;
}
export function DepthSortedRenderer() {
  this.compareRenderSortKey = function (a, b) {
    return a.getRenderSortKey() - b.getRenderSortKey();
  };
  this.scratchVector = new Vector2();
  this.renderCommands = [];
  this.commandIndex = 0;
  this.context = null;
}
export function acquireRenderCommand(a) {
  var b;
  if (a.commandIndex >= a.renderCommands.length) {
    b = new RenderCommand();
    a.renderCommands.push(b);
  } else {
    b = a.renderCommands[a.commandIndex];
  }
  a.commandIndex++;
  return b;
}
export function ImmediateRenderer() {
  this.context = null;
  this.command = new RenderCommand();
}
export function acquireImmediateCommand(a) {
  resetRenderCommand(a.command);
  return a.command;
}
export function SceneRenderer(a) {
  this.context = a;
  this.spriteRenderer = null;
  this.depthSortedRenderer = new DepthSortedRenderer();
  this.immediateRenderer = new ImmediateRenderer();
}
export function drawWorldTileRow(a, b, c, d) {
  for (; c < d; c++) {
    var f = a,
      g = game.world.getTileAtPixel(c, b);
    if (g) {
      var h;
      h = game.camera;
      h = game.viewportHalfWidth + (c - h.tileColumn - (b - h.tileRow)) * game.tileSize - h.viewportOffsetX;
      var l;
      l = game.camera;
      l = game.viewportHalfHeight + (c - l.tileColumn + (b - l.tileRow)) * game.halfTileSize - l.viewportOffsetY;
      f.drawSprite(g.backgroundSprite, h, l);
      var n = g.decorationSprite;
      if (n) {
        f.spriteRenderer.drawSpriteDepth(n, g.getPixelX(), g.getPixelY(), h, l, n.spriteSheet.spriteSize, 0);
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
      h = game.viewportHalfWidth + (c - h.tileColumn - (b - h.tileRow)) * game.tileSize - h.viewportOffsetX;
      var l;
      l = game.camera;
      l = game.viewportHalfHeight + (c - l.tileColumn + (b - l.tileRow)) * game.halfTileSize - l.viewportOffsetY;
      f.drawSprite(g.backgroundSprite, h, l);
      var n = g.decorationSprite;
      if (n) {
        f.spriteRenderer.drawSpriteDepth(n, g.getPixelX(), g.getPixelY(), h, l, n.spriteSheet.spriteSize, 0);
      }
      if (n = g.cachedBackgroundSprite) {
        f.spriteRenderer.drawSpriteDepthRaised(n, g.getPixelX(), g.getPixelY(), h, l, n.spriteSheet.spriteSize, 0);
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
    a.spriteRenderer.drawSpriteDepth(c, d, f, game.viewportHalfWidth + (d - game.world.worldCenterX - (f - game.world.worldCenterY)), game.viewportHalfHeight + 0.5 * (d - game.world.worldCenterX + (f - game.world.worldCenterY)), c.spriteSheet.spriteSize, 0);
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
    a.spriteRenderer.drawSpriteDepth(c, d, f, g, h, c.spriteSheet.spriteSize, l ? 0.4 : 0);
  }
}
export function drawCharacterEffects(a, b) {
  var c, d, f, g, h, l, n, p, s, u, y;
  for (c = 0; c < b.length; c++) {
    if (f = b[c], !f.isDead) {
      for (y = false, p = f.effects.activeEffects, d = 0; d < p.length; d++) {
        if (s = p[d], s.hasAnimation && (s = s.animation)) {
          u = p[d].overlayFrameIndex;
          if (!y) {
            g = f.position.getLevelPositionX();
            h = f.position.getLevelPositionY();
            l = projectDungeonX(g, h) + 10;
            n = projectDungeonY(g, h) + 10;
            y = true;
          }
          a.spriteRenderer.drawAnimationRaised(s, u, g, h, l, n, s.spriteSheet.spriteSize, 0);
        }
      }
    }
  }
}
export function drawFloatingText(a) {
  var b, c, d;
  d = game.floatingText.texts;
  if (0 !== d.length) {
    for (a.context.font = "12px Georgia", b = 0; b < d.length; b++) {
      c = d[b];
      a.context.fillStyle = c.color;
      a.context.fillText(c.text, c.screenX, c.screenY);
    }
  }
}
export function drawEntityHighlight(a, b, c, d) {
  b = b.regions;
  var f, g;
  g = game.regions;
  var h = g.regionGridOriginColumn,
    l = g.regionGridOriginRow,
    n;
  for (g = 0; g < b.length; g++) {
    f = b[g];
    n = c * (f.regionColumn - h);
    f = d * (f.regionRow - l);
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
  this.renderer = null;
}
export function initializeRenderingScene() {
  RenderCommand.prototype.getRenderSortKey = function () {
    return this.sortKey - this.raiseOffset;
  };
  RenderCommand.prototype.draw = function (a) {
    if (this.isSet) {
      if (0 < this.alpha) {
        a.save();
        a.globalAlpha = 0.4;
      }
      var b;
      if (this.sprite) {
        b = this.sprite.spriteSheet.spriteSize;
        a.drawImage(this.sprite.getSheetImage(), this.sprite.sourceX, this.sprite.sourceY, b, b, this.screenX, this.screenY, this.renderSize, this.renderSize);
      } else if (this.animation) {
        var c = this.animation.frames[this.frameIndex];
        b = this.animation.spriteSheet.spriteSize;
        a.drawImage(this.animation.getSheetImage(), c.frameSourceX, c.frameSourceY, b, b, this.screenX, this.screenY, this.renderSize, this.renderSize);
      }
      if (0 < this.alpha) {
        a.restore();
      }
    }
  };
  DepthSortedRenderer.prototype.setContext = function (a) {
    this.context = a;
    for (a = this.commandIndex = 0; a < this.renderCommands.length; a++) {
      resetRenderCommand(this.renderCommands[a]);
    }
    var b = game.viewportWidth / 2,
      c = 2 * game.viewportHeight;
    if (game.worldActive) {
      a = game.world.worldCenterX + (0.5 * (b - game.viewportHalfWidth) + (c - game.viewportHalfHeight)) | 0;
      b = game.world.worldCenterY + (c - game.viewportHalfHeight - 0.5 * (b - game.viewportHalfWidth)) | 0;
    } else {
      a = game.level.centerX + (0.5 * (b - game.viewportHalfWidth) + (c - game.viewportHalfHeight)) | 0;
      b = game.level.centerY + (c - game.viewportHalfHeight - 0.5 * (b - game.viewportHalfWidth)) | 0;
    }
    setVector(this.scratchVector, a, b);
  };
  DepthSortedRenderer.prototype.drawSpriteDepth = function (a, b, c, d, f, g, h) {
    if (a) {
      b = distanceToPoint(this.scratchVector, b, c);
      setSpriteRenderCommand(acquireRenderCommand(this), a, b, d, f, g, h);
    }
  };
  DepthSortedRenderer.prototype.drawSpriteDepthRaised = function (a, b, c, d, f, g, h) {
    if (a) {
      b = distanceToPoint(this.scratchVector, b, c);
      c = acquireRenderCommand(this);
      setSpriteRenderCommand(c, a, b, d, f, g, h);
      c.raiseOffset = 0.1;
    }
  };
  DepthSortedRenderer.prototype.drawAnimation = function (a, b, c, d, f, g, h, l) {
    if (a) {
      c = distanceToPoint(this.scratchVector, c, d);
      setAnimationRenderCommand(acquireRenderCommand(this), a, b, c, f, g, h, l);
    }
  };
  DepthSortedRenderer.prototype.drawAnimationRaised = function (a, b, c, d, f, g, h, l) {
    if (a) {
      c = distanceToPoint(this.scratchVector, c, d);
      d = acquireRenderCommand(this);
      setAnimationRenderCommand(d, a, b, c, f, g, h, l);
      d.raiseOffset = 0.1;
    }
  };
  DepthSortedRenderer.prototype.sortCommands = function () {
    if (!(2 > this.commandIndex)) {
      this.renderCommands.sort(this.compareRenderSortKey);
    }
    var a;
    for (a = this.commandIndex - 1; 0 <= a; a--) {
      this.renderCommands[a].draw(this.context);
    }
  };
  ImmediateRenderer.prototype.setContext = function (a) {
    this.context = a;
  };
  ImmediateRenderer.prototype.drawSpriteDepth = function (a, b, c, d, f, g, h) {
    if (a) {
      b = acquireImmediateCommand(this);
      setSpriteRenderCommand(b, a, 0, d, f, g, h);
      b.draw(this.context);
    }
  };
  ImmediateRenderer.prototype.drawSpriteDepthRaised = function (a, b, c, d, f, g, h) {
    if (a) {
      b = acquireImmediateCommand(this);
      setSpriteRenderCommand(b, a, 0, d, f, g, h);
      b.draw(this.context);
    }
  };
  ImmediateRenderer.prototype.drawAnimation = function (a, b, c, d, f, g, h, l) {
    if (a) {
      c = acquireImmediateCommand(this);
      setAnimationRenderCommand(c, a, b, 0, f, g, h, l);
      c.draw(this.context);
    }
  };
  ImmediateRenderer.prototype.drawAnimationRaised = function (a, b, c, d, f, g, h, l) {
    if (a) {
      c = acquireImmediateCommand(this);
      setAnimationRenderCommand(c, a, b, 0, f, g, h, l);
      c.draw(this.context);
    }
  };
  ImmediateRenderer.prototype.sortCommands = function () {};
  SceneRenderer.prototype.drawSprite = function (a, b, c) {
    if (a) {
      var d = a.spriteSheet.spriteSize;
      this.context.drawImage(a.getSheetImage(), a.sourceX, a.sourceY, d, d, b, c, d, d);
    }
  };
  GameCanvasView.prototype = new View();
  GameCanvasView.prototype.reset = function () {
    (/** @type {GameCanvasView & { createDomElements: () => void }} */ (/** @type {unknown} */ (this))).createDomElements();
  };
  GameCanvasView.prototype.update = function () {
    var a = this.renderer;
    a.spriteRenderer = game.options.depthSortSprites ? a.depthSortedRenderer : a.immediateRenderer;
    a.spriteRenderer.setContext(a.context);
    if (game.world.hasPartyPlaced) {
      if (a.context.fillStyle = "#000000", a.context.fillRect(0, 0, game.viewportWidth, game.viewportHeight), game.worldActive) {
        var b = game.world.pixelToTileColumn(game.world.worldCenterX),
          c = game.world.pixelToTileRow(game.world.worldCenterY) - 18;
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
        drawWorldCharacters(a, game.minions.minionList);
        drawWorldCharacters(a, game.state.adventurers);
        if (game.options.showCombatText) {
          drawFloatingText(a);
        }
        a.spriteRenderer.sortCommands();
        if (game.options.showMapOverlay) {
          var d = game.regions,
            f = d.regionGridOriginColumn,
            g = d.regionGridOriginRow,
            h = 120 / (d.regionGridOriginColumn + d.regionGridSpan - f) | 0,
            l = 120 / (d.regionGridOriginRow + d.regionGridSpan - g) | 0;
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
            if (s.attackScheduled) {
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
            if (!(canAttackCastle(s) || s.regionLocked || s.attackScheduled || s.conquered)) {
              drawEntityHighlight(a, s, h, l);
            }
          }
          var y = game.world.worldBlocks[1][1],
            A = h * (y.regionColumn - f),
            C = l * (y.regionRow - g);
          a.context.fillStyle = "blue";
          a.context.fillRect(A + 2, C + 2, 4, 4);
          a.context.restore();
        }
      } else {
        var v = game.level.pixelToTileColumn(game.level.centerX),
          D = game.level.pixelToTileRow(game.level.centerY) - 18;
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
        var N = game.goldDrops.drops,
          I,
          x,
          z,
          O,
          J,
          la;
        for (la = 0; la < N.length; la++) {
          I = N[la];
          x = I.levelPositionX;
          z = I.levelPositionY;
          O = projectWorldX(x, z);
          J = projectWorldY(x, z);
          var Q = I.goldAmount,
            V = game.goldDrops;
          a.drawSprite(100 > Q ? V.smallGoldSprite : 1E3 > Q ? V.mediumGoldSprite : V.largeGoldSprite, O, J);
        }
        var na = game.scrollDrops.drops,
          K,
          H,
          S,
          da,
          W,
          ia;
        for (ia = 0; ia < na.length; ia++) {
          K = na[ia];
          H = K.levelPositionX;
          S = K.levelPositionY;
          da = projectWorldX(H, S);
          W = projectWorldY(H, S);
          a.drawSprite(getScrollSprite(K.getScroll()), da, W);
        }
        var ea = game.potionDrops.drops,
          va,
          yb,
          Fb,
          pa,
          T,
          X;
        for (X = 0; X < ea.length; X++) {
          va = ea[X];
          yb = va.levelPositionX;
          Fb = va.levelPositionY;
          pa = projectWorldX(yb, Fb);
          T = projectWorldY(yb, Fb);
          a.drawSprite(va.potion.potionSprite, pa, T);
        }
        var Ca = game.itemDrops.drops,
          qa,
          ta,
          eb,
          Gb,
          Da,
          ub;
        for (ub = 0; ub < Ca.length; ub++) {
          qa = Ca[ub];
          ta = qa.levelPositionX;
          eb = qa.levelPositionY;
          Gb = projectWorldX(ta, eb);
          Da = projectWorldY(ta, eb);
          a.drawSprite(qa.getItem().getIconSprite(), Gb, Da);
        }
        var mb = game.treasure.targets,
          Ea,
          La,
          wa,
          Fa,
          ha,
          ja,
          Ga;
        for (ja = 0; ja < mb.length; ja++) {
          Ea = mb[ja];
          if (Ea.room.discovered) {
            La = Ea.levelX;
            wa = Ea.levelY;
            Fa = projectWorldX(La, wa);
            ha = projectWorldY(La, wa);
            Ga = Ea.opened ? Ea.openedSpriteName : Ea.closedSpriteName;
            if (Ea.definition.flushPlacement) {
              a.spriteRenderer.drawSpriteDepthRaised(Ga, La, wa, Fa, ha, Ga.spriteSheet.spriteSize, 0);
            } else {
              a.spriteRenderer.drawSpriteDepth(Ga, La, wa, Fa, ha, Ga.spriteSheet.spriteSize, 0);
            }
          }
        }
        var bb = game.monsters.defeatedMonsters,
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
          a.drawSprite(za.getSprite(), cb, Ua);
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
            a.spriteRenderer.drawSpriteDepth(pb, Sb, Ma, zb - ac, Hb - ac, 3 * game.tileSize, 0);
          } else {
            a.spriteRenderer.drawSpriteDepth(pb, Sb, Ma, zb, Hb, pb.spriteSheet.spriteSize, 0);
          }
        }
        drawDungeonCharacters(a, game.minions.minionList);
        drawDungeonCharacters(a, game.state.adventurers);
        drawCharacterEffects(a, getMonsters());
        drawCharacterEffects(a, game.minions.minionList);
        drawCharacterEffects(a, game.state.adventurers);
        if (game.options.showSpellEffects) {
          var Ha = game.effects.pool;
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
              if (Wa = Ha[jb], cc = Wa.effectType, 1 === cc) {
                Ab = Wa.getAnimation();
                Bb = Wa.currentPosition;
                bc = Wa.frameIndex;
                qb = Bb.x;
                wb = Bb.y;
                Ib = projectDungeonX(qb, wb) + 10;
                Ec = projectDungeonY(qb, wb) + 10;
                a.spriteRenderer.drawAnimationRaised(Ab, bc, qb, wb, Ib, Ec, Ab.spriteSheet.spriteSize, 0);
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
                qc = Tb.targetPosition;
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
                  Qa = Wa.room;
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
                  if ((ec = game.level.getTileAt(xb, Na)) && (hb = ec.tileEffect) && hb.hasSpawned && !hb.isFinished()) {
                    lb = hb.getAnimation();
                    rc = hb.frameIndex;
                    Ub = ec.getPixelX();
                    sb = ec.getPixelY();
                    ka = projectDungeonX(Ub, sb) + 10;
                    Eb = projectDungeonY(Ub, sb) + 10;
                    a.spriteRenderer.drawAnimation(lb, rc, Ub, sb, ka, Eb, lb.spriteSheet.spriteSize, 0);
                  }
                }
              }
            }
          }
        }
        a.spriteRenderer.sortCommands();
        drawCharacterHighlights(a, getMonsters(), "red");
        if (!game.state.encounter.noMonstersLeft) {
          drawCharacterHighlights(a, game.minions.minionList, "#007FFF");
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
      a.context.fillText("帧数: " + game.state.fps, 10, 20);
    }
  };
  GameCanvasView.prototype.createDomElements = function () {
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
      this.renderer = new SceneRenderer(c.getContext("2d"));
      (/** @type {GameCanvasView & { visible: boolean }} */ (/** @type {unknown} */ (this))).visible = true;
    }
  };
}
