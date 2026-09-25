/** 卷轴库存、冷却、升级与施放。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { scrollCapacityBonus, scrollPriceCurve } from "../content/balance.js";
import { randomInt, scaleByLevel } from "../core/math.js";
import { applyStatBonus } from "./skill-effects.js";
import { updateScrollAccuracy } from "../characters/stats.js";
import { getMonsters, getOpponents } from "./encounters.js";
import { CAST_ACTION_TYPE, MELEE_ACTION_TYPE, selectScrollTarget } from "../ai/targeting.js";
import { VisualEffect, addVisualEffect } from "../rendering/sprites.js";
import { updateCharacter } from "../characters/character.js";
import { electricSpellDefinitions, fireSpellDefinitions } from "../content/spells.js";
export var scrollDefinitions;
export function Spell(a) {
  this.ta = a.ta;
  this.ga = a.ga;
  this.ca = a.ca;
  this.ya = a.ya;
  this.X = a.X;
  this.Ra = a.Ra;
  this.La = a.La;
  this.mq = game.state.turnNumber - 3 * this.La;
  this.td = a.td;
}
export function resetSpellCooldown(a) {
  a.mq = game.state.turnNumber - 3 * a.La;
}
export function isSpellReady(a) {
  if (a.mq > game.state.turnNumber) {
    resetSpellCooldown(a);
  }
  return game.state.turnNumber - a.mq >= a.La;
}
export function Scroll(a, b) {
  this.eq = b;
  this.scrollId = a.scrollId;
  this.Wh = game.itemSprites.getSprite(a.Wh);
  this.ke = a.rg;
  this.sg = a.sg;
  this.Yi = a.Yi;
  this.Qh = a.Qh;
  this.mB = a.xa ? new Spell(a.xa) : null;
  this.tn = a.fq;
  this.locked = true;
  this.quantity = this.upgradeCount = 0;
  this.rn = getScrollUpgradeCost(this);
  this.rg = getScrollLabel(this);
  this.lx = getNextScrollLabel(this);
}
export function getScrollSprite(a) {
  return a.Wh;
}
export function addScrollCharge(a) {
  a.quantity++;
  var b = 30 + scrollCapacityBonus.currentValue;
  if (a.quantity > b) {
    a.quantity = b;
  }
}
export function getScrollUpgradeCost(a) {
  return scaleByLevel(a.locked ? a.sg : a.sg + (a.upgradeCount + 1) * a.Yi, scrollPriceCurve, 1);
}
export function getScrollLabel(a) {
  if (a.locked) {
    return "未解锁";
  }
  switch (a.upgradeCount) {
    case 1:
      return a.ke + " II";
    case 2:
      return a.ke + " III";
    case 3:
      return a.ke + " IV";
    case 4:
      return a.ke + " V";
    case 5:
      return a.ke + " VI";
    case 6:
      return a.ke + " VII";
    case 7:
      return a.ke + " VIII";
  }
  return a.ke;
}
export function getNextScrollLabel(a) {
  if (!a.locked) {
    switch (a.upgradeCount) {
      case 0:
        return a.ke + " II";
      case 1:
        return a.ke + " III";
      case 2:
        return a.ke + " IV";
      case 3:
        return a.ke + " V";
      case 4:
        return a.ke + " VI";
      case 5:
        return a.ke + " VII";
      case 6:
        return a.ke + " VIII";
    }
  }
  return a.ke;
}
export function castScroll(a, b) {
  if (!a.locked && (0 < a.quantity || b)) {
    var c;
    c = game.state.adventurers[randomInt(game.state.adventurers.length)];
    var d = getOpponents(c);
    if (0 === d.length) {
      c = null;
    } else {
      var f = c.position.room;
      if (f) {
        var g,
          h,
          l = c.position.levelPosition,
          n = null,
          p,
          s = -1;
        for (h = 0; h < d.length; h++) {
          if (!(g = d[h], c === g || g.Va || g.position.room !== f || (p = g.Ja, p.wg || p.Kd || p.bi || -1 < a.eq.yl.indexOf(g) || (p = l.Ud(g.position.levelPosition), !(0 > s || p < s))))) {
            n = g;
            s = p;
          }
        }
        c = n;
      } else {
        c = null;
      }
    }
    if (!c) {
      c = selectScrollTarget(game.state.adventurers[randomInt(game.state.adventurers.length)]);
      if (!c) {
        c = getMonsters();
        c = 0 === c.length ? null : c[randomInt(c.length)];
      }
    }
    if (c) {
      d = a.eq;
      if (0 > d.yl.indexOf(c)) {
        d.yl.push(c);
        if (4 <= d.yl.length) {
          d.yl.shift();
        }
      }
      d = game.state.scrollCaster.position;
      d.room = c.position.room;
      game.state.scrollCaster.Cb(c);
      if (a.mB) {
        game.state.scrollCaster.ld = a.mB;
        game.state.scrollCaster.Y = CAST_ACTION_TYPE;
      } else {
        game.state.scrollCaster.Y = MELEE_ACTION_TYPE;
      }
      c = new VisualEffect("Red Damage", d.levelPosition, d.levelPosition, false, 1);
      addVisualEffect(game.effects, c);
      updateCharacter(game.state.scrollCaster, 1);
      game.state.aa.fs();
      if (!b) {
        a.quantity--;
        if (0 > a.quantity) {
          a.quantity = 0;
        }
      }
    }
  }
}
export function clearScrollTargets() {
  var a = game.scrollTargets;
  if (0 < a.yl.length) {
    a.yl.length = 0;
  }
}
export function ScrollDrop(a, b, c, d) {
  this.scroll = a;
  this.bq = b;
  this.cq = c;
  this.BE = d;
  this.gc = false;
  this.Zc = null;
  this.ph = 0;
}
export function ScrollDropRegistry() {
  this.kf = [];
}
export function removeScrollDrop(a) {
  var b = game.scrollDrops;
  a = b.kf.indexOf(a);
  if (-1 < a) {
    b.kf.splice(a, 1);
  }
}
export function ScrollInventory() {
  this.kx = {};
  this.at = [];
  this.Pl = [];
}
export function resetScrollInventory() {
  var a = game.scrolls;
  a.kx = {};
  a.at.length = 0;
  a.Pl.length = 0;
  var b, c;
  for (b = 0; b < scrollDefinitions.length; b++) {
    c = new Scroll(scrollDefinitions[b], game.scrollTargets);
    c.ts(0 < scrollDefinitions[b].sg, 0);
    a.at.push(c);
    a.kx[c.scrollId] = c;
    if (!c.locked) {
      registerUnlockedScroll(a, c);
    }
  }
}
export function registerUnlockedScroll(a, b) {
  if (0 > a.Pl.indexOf(b)) {
    a.Pl.push(b);
  }
}
export function initializeCombatScrolls() {
  Scroll.prototype.ts = function (a, b) {
    if (this.locked && !a) {
      this.locked = false;
      registerUnlockedScroll(game.scrolls, this);
    }
    this.upgradeCount = b;
    if (0 < b && this.tn) {
      var c;
      for (c = 0; c < this.upgradeCount; c++) {
        applyStatBonus(game.state.scrollCaster, this.tn.f, this.tn.g);
      }
      updateScrollAccuracy();
    }
    this.rg = getScrollLabel(this);
    this.lx = getNextScrollLabel(this);
    this.rn = getScrollUpgradeCost(this);
  };
  ScrollDrop.prototype.vf = function () {
    return this.scroll;
  };
  ScrollDrop.prototype.oh = function (a) {
    this.gc = a;
  };
  ScrollDrop.prototype.Re = function (a) {
    this.Zc = a;
  };
  ScrollDrop.prototype.Ud = function () {
    return this.ph;
  };
  ScrollDrop.prototype.Se = function (a) {
    this.ph = a;
  };
  ScrollDropRegistry.prototype.zl = function () {
    var a;
    for (a = 0; a < this.kf.length; a++) {
      this.kf[a].Re(null);
      this.kf[a].Se(0);
    }
  };
  scrollDefinitions = [{
    scrollId: "shockScroll",
    rg: "休克",
    Wh: "Scroll0028.PNG",
    xa: electricSpellDefinitions.sB,
    sg: 0,
    Yi: 4,
    Qh: 0
  }, {
    scrollId: "spiderWebScroll",
    rg: "蛛网",
    Wh: "Scroll0054.PNG",
    xa: electricSpellDefinitions.CB,
    sg: 3,
    Yi: 4,
    Qh: 4,
    fq: {
      f: 20,
      g: 2
    }
  }, {
    scrollId: "arrowScroll",
    rg: "箭矢",
    Wh: "Scroll0012.PNG",
    xa: null,
    sg: 6,
    Yi: 4,
    Qh: 4,
    fq: {
      f: 23,
      g: 1
    }
  }, {
    scrollId: "fireRainScroll",
    rg: "火雨",
    Wh: "Scroll0022.PNG",
    xa: fireSpellDefinitions.Lz,
    sg: 9,
    Yi: 4,
    Qh: 2,
    fq: {
      f: 22,
      g: 1
    }
  }, {
    scrollId: "chainedLightningScroll",
    rg: "闪电",
    Wh: "Scroll0034.PNG",
    xa: electricSpellDefinitions.br,
    sg: 12,
    Yi: 4,
    Qh: 3,
    fq: {
      f: 21,
      g: 1
    }
  }, {
    scrollId: "fireBallScroll",
    rg: "火球",
    Wh: "Scroll0097.PNG",
    xa: fireSpellDefinitions.Kz,
    sg: 15,
    Yi: 4,
    Qh: 2,
    fq: {
      f: 25,
      g: 1
    }
  }];
  ScrollInventory.prototype.vf = function (a) {
    return this.kx[a];
  };
}
