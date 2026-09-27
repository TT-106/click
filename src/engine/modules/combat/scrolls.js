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
  this.name = a.name;
  this.spellCategoryId = a.spellCategoryId;
  this.impactEffectName = a.impactEffectName;
  this.projectileEffectName = a.projectileEffectName;
  this.statusEffectTypeId = a.statusEffectTypeId;
  this.potencyPercent = a.potencyPercent;
  this.cooldownTurns = a.cooldownTurns;
  this.lastCastTurn = game.state.turnNumber - 3 * this.cooldownTurns;
  this.applyEffectOnImpact = a.applyEffectOnImpact;
}
export function resetSpellCooldown(a) {
  a.lastCastTurn = game.state.turnNumber - 3 * a.cooldownTurns;
}
export function isSpellReady(a) {
  if (a.lastCastTurn > game.state.turnNumber) {
    resetSpellCooldown(a);
  }
  return game.state.turnNumber - a.lastCastTurn >= a.cooldownTurns;
}
export function Scroll(a, b) {
  this.eq = b;
  this.scrollId = a.scrollId;
  this.spriteName = game.itemSprites.getSprite(a.spriteName);
  this.baseName = a.baseName;
  this.baseCapacity = a.baseCapacity;
  this.capacityIncrement = a.capacityIncrement;
  this.maxCharges = a.maxCharges;
  this.mB = a.spellDefinition ? new Spell(a.spellDefinition) : null;
  this.tn = a.fq;
  this.locked = true;
  this.quantity = this.upgradeCount = 0;
  this.rn = getScrollUpgradeCost(this);
  this.label = getScrollLabel(this);
  this.lx = getNextScrollLabel(this);
}
export function getScrollSprite(a) {
  return a.spriteName;
}
export function addScrollCharge(a) {
  a.quantity++;
  var b = 30 + scrollCapacityBonus.currentValue;
  if (a.quantity > b) {
    a.quantity = b;
  }
}
export function getScrollUpgradeCost(a) {
  return scaleByLevel(a.locked ? a.baseCapacity : a.baseCapacity + (a.upgradeCount + 1) * a.capacityIncrement, scrollPriceCurve, 1);
}
export function getScrollLabel(a) {
  if (a.locked) {
    return "未解锁";
  }
  switch (a.upgradeCount) {
    case 1:
      return a.baseName + " II";
    case 2:
      return a.baseName + " III";
    case 3:
      return a.baseName + " IV";
    case 4:
      return a.baseName + " V";
    case 5:
      return a.baseName + " VI";
    case 6:
      return a.baseName + " VII";
    case 7:
      return a.baseName + " VIII";
  }
  return a.baseName;
}
export function getNextScrollLabel(a) {
  if (!a.locked) {
    switch (a.upgradeCount) {
      case 0:
        return a.baseName + " II";
      case 1:
        return a.baseName + " III";
      case 2:
        return a.baseName + " IV";
      case 3:
        return a.baseName + " V";
      case 4:
        return a.baseName + " VI";
      case 5:
        return a.baseName + " VII";
      case 6:
        return a.baseName + " VIII";
    }
  }
  return a.baseName;
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
          if (!(g = d[h], c === g || g.isDead || g.position.room !== f || (p = g.effects, p.isStealthed || p.isDisabled || p.isConverted || -1 < a.eq.recentTargets.indexOf(g) || (p = l.squaredDistanceTo(g.position.levelPosition), !(0 > s || p < s))))) {
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
      if (0 > d.recentTargets.indexOf(c)) {
        d.recentTargets.push(c);
        if (4 <= d.recentTargets.length) {
          d.recentTargets.shift();
        }
      }
      d = game.state.scrollCaster.position;
      d.room = c.position.room;
      game.state.scrollCaster.setCombatTarget(c);
      if (a.mB) {
        game.state.scrollCaster.spellToCast = a.mB;
        game.state.scrollCaster.actionType = CAST_ACTION_TYPE;
      } else {
        game.state.scrollCaster.actionType = MELEE_ACTION_TYPE;
      }
      c = new VisualEffect("Red Damage", d.levelPosition, d.levelPosition, false, 1);
      addVisualEffect(game.effects, c);
      updateCharacter(game.state.scrollCaster, 1);
      game.state.statisticsRecorder.recordScrollUsed();
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
  if (0 < a.recentTargets.length) {
    a.recentTargets.length = 0;
  }
}
export function ScrollDrop(a, b, c, d) {
  this.scroll = a;
  this.bq = b;
  this.cq = c;
  this.BE = d;
  this.collected = false;
  this.claimedBy = null;
  this.claimDistance = 0;
}
export function ScrollDropRegistry() {
  this.drops = [];
}
export function removeScrollDrop(a) {
  var b = game.scrollDrops;
  a = b.drops.indexOf(a);
  if (-1 < a) {
    b.drops.splice(a, 1);
  }
}
export function ScrollInventory() {
  this.kx = {};
  this.at = [];
  this.unlockedScrolls = [];
}
export function resetScrollInventory() {
  var a = game.scrolls;
  a.kx = {};
  a.at.length = 0;
  a.unlockedScrolls.length = 0;
  var b, c;
  for (b = 0; b < scrollDefinitions.length; b++) {
    c = new Scroll(scrollDefinitions[b], game.scrollTargets);
    (/** @type {any} */ (c)).ts(0 < scrollDefinitions[b].baseCapacity, 0);
    a.at.push(c);
    a.kx[c.scrollId] = c;
    if (!c.locked) {
      registerUnlockedScroll(a, c);
    }
  }
}
export function registerUnlockedScroll(a, b) {
  if (0 > a.unlockedScrolls.indexOf(b)) {
    a.unlockedScrolls.push(b);
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
        applyStatBonus(game.state.scrollCaster, this.tn.statType, this.tn.statBonusValue);
      }
      updateScrollAccuracy();
    }
    this.label = getScrollLabel(this);
    this.lx = getNextScrollLabel(this);
    this.rn = getScrollUpgradeCost(this);
  };
  ScrollDrop.prototype.getScroll = function () {
    return this.scroll;
  };
  ScrollDrop.prototype.setCollected = function (a) {
    this.collected = a;
  };
  ScrollDrop.prototype.setClaimedBy = function (a) {
    this.claimedBy = a;
  };
  ScrollDrop.prototype.getClaimDistance = function () {
    return this.claimDistance;
  };
  ScrollDrop.prototype.setClaimDistance = function (a) {
    this.claimDistance = a;
  };
  ScrollDropRegistry.prototype.releaseClaims = function () {
    var a;
    for (a = 0; a < this.drops.length; a++) {
      this.drops[a].setClaimedBy(null);
      this.drops[a].setClaimDistance(0);
    }
  };
  scrollDefinitions = [{
    scrollId: "shockScroll",
    baseName: "休克",
    spriteName: "Scroll0028.PNG",
    spellDefinition: electricSpellDefinitions.sB,
    baseCapacity: 0,
    capacityIncrement: 4,
    maxCharges: 0
  }, {
    scrollId: "spiderWebScroll",
    baseName: "蛛网",
    spriteName: "Scroll0054.PNG",
    spellDefinition: electricSpellDefinitions.CB,
    baseCapacity: 3,
    capacityIncrement: 4,
    maxCharges: 4,
    fq: {
      statType: 20,
      statBonusValue: 2
    }
  }, {
    scrollId: "arrowScroll",
    baseName: "箭矢",
    spriteName: "Scroll0012.PNG",
    spellDefinition: null,
    baseCapacity: 6,
    capacityIncrement: 4,
    maxCharges: 4,
    fq: {
      statType: 23,
      statBonusValue: 1
    }
  }, {
    scrollId: "fireRainScroll",
    baseName: "火雨",
    spriteName: "Scroll0022.PNG",
    spellDefinition: fireSpellDefinitions.Lz,
    baseCapacity: 9,
    capacityIncrement: 4,
    maxCharges: 2,
    fq: {
      statType: 22,
      statBonusValue: 1
    }
  }, {
    scrollId: "chainedLightningScroll",
    baseName: "闪电",
    spriteName: "Scroll0034.PNG",
    spellDefinition: electricSpellDefinitions.chainLightningSpell,
    baseCapacity: 12,
    capacityIncrement: 4,
    maxCharges: 3,
    fq: {
      statType: 21,
      statBonusValue: 1
    }
  }, {
    scrollId: "fireBallScroll",
    baseName: "火球",
    spriteName: "Scroll0097.PNG",
    spellDefinition: fireSpellDefinitions.Kz,
    baseCapacity: 15,
    capacityIncrement: 4,
    maxCharges: 2,
    fq: {
      statType: 25,
      statBonusValue: 1
    }
  }];
  ScrollInventory.prototype.getScrollById = function (a) {
    return this.kx[a];
  };
}
