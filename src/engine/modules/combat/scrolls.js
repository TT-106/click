/** 卷轴库存、冷却、升级与施放。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { scrollCapacityBonus, scrollPriceCurve } from "../content/balance.js";
import { randomInt, scaleByLevel } from "../core/math.js";
import { applyStatBonus } from "./skill-effects.js";
import { updateScrollAccuracy } from "../characters/stats.js";
import { getMonsters, getOpponents } from "./encounters.js";
import { CAST_ACTION_TYPE, MELEE_ACTION_TYPE, selectScrollTarget } from "../ai/targeting.js";
import { VisualEffect, addVisualEffect } from "../rendering/sprites.js";
import { updateCharacter } from "../characters/character.js";
import { electricSpellDefinitions, fireSpellDefinitions } from "../content/spells.js";
/** 卷轴系统所需的六个依赖由组合根注入。state / scrolls / scrollTargets / scrollDrops /
 *  itemSprites / effects 六个容器对象都在 runtime 的 game 模块对象字面量里只构造一次、
 *  从不整体重新赋值（src/ 内 0 处 `game.X =`，判据见 docs/reverse-engineering/facts.md），
 *  所以按引用绑安全。注意 game.scrolls 就是本模块定义的 ScrollInventory 在组合根里的单例实例，
 *  绑定它只是把"模块从全局找自己"改成"由根注入"，字段值（scrollsById、scrollList、recentTargets、
 *  drops 等）随游戏进程变化，读的始终是同一对象；而 game.state.scrollCaster / game.state.adventurers
 *  这类**子对象**会被整体替换（存档恢复、移动），但绑的是 game.state 容器本身，每次现读子字段安全。
 *  未绑定就用到会立刻抛，避免"装配漏一步"退化成静默的 undefined 读取。 */
var boundState = null;
var boundScrolls = null;
var boundScrollTargets = null;
var boundScrollDrops = null;
var boundItemSprites = null;
var boundEffects = null;
export function bindCombatScrolls(state, scrolls, scrollTargets, scrollDrops, itemSprites, effects) {
  boundState = state;
  boundScrolls = scrolls;
  boundScrollTargets = scrollTargets;
  boundScrollDrops = scrollDrops;
  boundItemSprites = itemSprites;
  boundEffects = effects;
}
function stateRef() {
  if (!boundState) {
    throw new Error('卷轴系统尚未绑定游戏状态：请在组合根调用 bindCombatScrolls(game.state, game.scrolls, game.scrollTargets, game.scrollDrops, game.itemSprites, game.effects)');
  }
  return boundState;
}
function scrollsRef() {
  if (!boundScrolls) {
    throw new Error('卷轴系统尚未绑定卷轴库存：请在组合根调用 bindCombatScrolls(game.state, game.scrolls, game.scrollTargets, game.scrollDrops, game.itemSprites, game.effects)');
  }
  return boundScrolls;
}
function scrollTargetsRef() {
  if (!boundScrollTargets) {
    throw new Error('卷轴系统尚未绑定卷轴目标注册表：请在组合根调用 bindCombatScrolls(game.state, game.scrolls, game.scrollTargets, game.scrollDrops, game.itemSprites, game.effects)');
  }
  return boundScrollTargets;
}
function scrollDropsRef() {
  if (!boundScrollDrops) {
    throw new Error('卷轴系统尚未绑定卷轴掉落注册表：请在组合根调用 bindCombatScrolls(game.state, game.scrolls, game.scrollTargets, game.scrollDrops, game.itemSprites, game.effects)');
  }
  return boundScrollDrops;
}
function itemSpritesRef() {
  if (!boundItemSprites) {
    throw new Error('卷轴系统尚未绑定物品精灵表：请在组合根调用 bindCombatScrolls(game.state, game.scrolls, game.scrollTargets, game.scrollDrops, game.itemSprites, game.effects)');
  }
  return boundItemSprites;
}
function effectsRef() {
  if (!boundEffects) {
    throw new Error('卷轴系统尚未绑定视觉效果容器：请在组合根调用 bindCombatScrolls(game.state, game.scrolls, game.scrollTargets, game.scrollDrops, game.itemSprites, game.effects)');
  }
  return boundEffects;
}
export var scrollDefinitions;
export function Spell(spellDefinition) {
  this.name = spellDefinition.name;
  this.spellCategoryId = spellDefinition.spellCategoryId;
  this.impactEffectName = spellDefinition.impactEffectName;
  this.projectileEffectName = spellDefinition.projectileEffectName;
  this.statusEffectTypeId = spellDefinition.statusEffectTypeId;
  this.potencyPercent = spellDefinition.potencyPercent;
  this.cooldownTurns = spellDefinition.cooldownTurns;
  this.lastCastTurn = stateRef().turnNumber - 3 * this.cooldownTurns;
  this.applyEffectOnImpact = spellDefinition.applyEffectOnImpact;
}
export function resetSpellCooldown(spell) {
  spell.lastCastTurn = stateRef().turnNumber - 3 * spell.cooldownTurns;
}
export function isSpellReady(spell) {
  if (spell.lastCastTurn > stateRef().turnNumber) {
    resetSpellCooldown(spell);
  }
  return stateRef().turnNumber - spell.lastCastTurn >= spell.cooldownTurns;
}
export function Scroll(scrollDefinition, scrollTargets) {
  this.scrollTargets = scrollTargets;
  this.scrollId = scrollDefinition.scrollId;
  this.spriteName = itemSpritesRef().getSprite(scrollDefinition.spriteName);
  this.baseName = scrollDefinition.baseName;
  this.baseCapacity = scrollDefinition.baseCapacity;
  this.capacityIncrement = scrollDefinition.capacityIncrement;
  this.maxCharges = scrollDefinition.maxCharges;
  this.scrollSpell = scrollDefinition.spellDefinition ? new Spell(scrollDefinition.spellDefinition) : null;
  this.statBonusPerUpgrade = scrollDefinition.statBonusPerUpgrade;
  this.locked = true;
  this.quantity = this.upgradeCount = 0;
  this.upgradeCost = getScrollUpgradeCost(this);
  this.label = getScrollLabel(this);
  this.nextLabel = getNextScrollLabel(this);
}
export function getScrollSprite(scroll) {
  return scroll.spriteName;
}
export function addScrollCharge(scroll) {
  scroll.quantity++;
  var scrollCapacity = 30 + scrollCapacityBonus.currentValue;
  if (scroll.quantity > scrollCapacity) {
    scroll.quantity = scrollCapacity;
  }
}
export function getScrollUpgradeCost(scroll) {
  return scaleByLevel(scroll.locked ? scroll.baseCapacity : scroll.baseCapacity + (scroll.upgradeCount + 1) * scroll.capacityIncrement, scrollPriceCurve, 1);
}
export function getScrollLabel(scroll) {
  if (scroll.locked) {
    return "未解锁";
  }
  switch (scroll.upgradeCount) {
    case 1:
      return scroll.baseName + " II";
    case 2:
      return scroll.baseName + " III";
    case 3:
      return scroll.baseName + " IV";
    case 4:
      return scroll.baseName + " V";
    case 5:
      return scroll.baseName + " VI";
    case 6:
      return scroll.baseName + " VII";
    case 7:
      return scroll.baseName + " VIII";
  }
  return scroll.baseName;
}
export function getNextScrollLabel(scroll) {
  if (!scroll.locked) {
    switch (scroll.upgradeCount) {
      case 0:
        return scroll.baseName + " II";
      case 1:
        return scroll.baseName + " III";
      case 2:
        return scroll.baseName + " IV";
      case 3:
        return scroll.baseName + " V";
      case 4:
        return scroll.baseName + " VI";
      case 5:
        return scroll.baseName + " VII";
      case 6:
        return scroll.baseName + " VIII";
    }
  }
  return scroll.baseName;
}
export function castScroll(scroll, hasInfiniteScrolls) {
  if (!scroll.locked && (0 < scroll.quantity || hasInfiniteScrolls)) {
    var randomAdventurer;
    randomAdventurer = stateRef().adventurers[randomInt(stateRef().adventurers.length)];
    var opponents = getOpponents(randomAdventurer);
    if (0 === opponents.length) {
      randomAdventurer = null;
    } else {
      var searchRoom = randomAdventurer.position.room;
      if (searchRoom) {
        var candidate,
          opponentIndex,
          adventurerLevelPosition = randomAdventurer.position.levelPosition,
          nearestOpponent = null,
          p,
          bestDistanceSquared = -1;
        for (opponentIndex = 0; opponentIndex < opponents.length; opponentIndex++) {
          if (!(candidate = opponents[opponentIndex], randomAdventurer === candidate || candidate.isDead || candidate.position.room !== searchRoom || (p = candidate.effects, p.isStealthed || p.isDisabled || p.isConverted || -1 < scroll.scrollTargets.recentTargets.indexOf(candidate) || (p = adventurerLevelPosition.squaredDistanceTo(candidate.position.levelPosition), !(0 > bestDistanceSquared || p < bestDistanceSquared))))) {
            nearestOpponent = candidate;
            bestDistanceSquared = p;
          }
        }
        var castTarget = nearestOpponent;
      } else {
        castTarget = null;
      }
    }
    if (!castTarget) {
      castTarget = selectScrollTarget(stateRef().adventurers[randomInt(stateRef().adventurers.length)]);
      if (!castTarget) {
        castTarget = getMonsters();
        castTarget = 0 === castTarget.length ? null : castTarget[randomInt(castTarget.length)];
      }
    }
    if (castTarget) {
      var scrollTargets = scroll.scrollTargets;
      if (0 > scrollTargets.recentTargets.indexOf(castTarget)) {
        scrollTargets.recentTargets.push(castTarget);
        if (4 <= scrollTargets.recentTargets.length) {
          scrollTargets.recentTargets.shift();
        }
      }
      var casterPosition = stateRef().scrollCaster.position;
      casterPosition.room = castTarget.position.room;
      stateRef().scrollCaster.setCombatTarget(castTarget);
      if (scroll.scrollSpell) {
        stateRef().scrollCaster.spellToCast = scroll.scrollSpell;
        stateRef().scrollCaster.actionType = CAST_ACTION_TYPE;
      } else {
        stateRef().scrollCaster.actionType = MELEE_ACTION_TYPE;
      }
      var impactVisual = new VisualEffect("Red Damage", casterPosition.levelPosition, casterPosition.levelPosition, false, 1);
      addVisualEffect(effectsRef(), impactVisual);
      updateCharacter(stateRef().scrollCaster, 1);
      stateRef().statisticsRecorder.recordScrollUsed();
      if (!hasInfiniteScrolls) {
        scroll.quantity--;
        if (0 > scroll.quantity) {
          scroll.quantity = 0;
        }
      }
    }
  }
}
export function clearScrollTargets() {
  var scrollTargets = scrollTargetsRef();
  if (0 < scrollTargets.recentTargets.length) {
    scrollTargets.recentTargets.length = 0;
  }
}
export function ScrollDrop(scroll, x, y, room) {
  this.scroll = scroll;
  this.levelPositionX = x;
  this.levelPositionY = y;
  this.room = room;
  this.collected = false;
  this.claimedBy = null;
  this.claimDistance = 0;
}
export function ScrollDropRegistry() {
  this.drops = [];
}
export function removeScrollDrop(a) {
  var dropRegistry = scrollDropsRef();
  a = dropRegistry.drops.indexOf(a);
  if (-1 < a) {
    dropRegistry.drops.splice(a, 1);
  }
}
export function ScrollInventory() {
  this.scrollsById = {};
  this.scrollList = [];
  this.unlockedScrolls = [];
}
export function resetScrollInventory() {
  var scrollInventory = scrollsRef();
  scrollInventory.scrollsById = {};
  scrollInventory.scrollList.length = 0;
  scrollInventory.unlockedScrolls.length = 0;
  var definitionIndex, scroll;
  for (definitionIndex = 0; definitionIndex < scrollDefinitions.length; definitionIndex++) {
    scroll = new Scroll(scrollDefinitions[definitionIndex], scrollTargetsRef());
    (/** @type {any} */ (scroll)).applyLockedAndUpgradeState(0 < scrollDefinitions[definitionIndex].baseCapacity, 0);
    scrollInventory.scrollList.push(scroll);
    scrollInventory.scrollsById[scroll.scrollId] = scroll;
    if (!scroll.locked) {
      registerUnlockedScroll(scrollInventory, scroll);
    }
  }
}
export function registerUnlockedScroll(scrollInventory, scroll) {
  if (0 > scrollInventory.unlockedScrolls.indexOf(scroll)) {
    scrollInventory.unlockedScrolls.push(scroll);
  }
}
export function initializeCombatScrolls() {
  Scroll.prototype.applyLockedAndUpgradeState = function (locked, upgradeCount) {
    if (this.locked && !locked) {
      this.locked = false;
      registerUnlockedScroll(scrollsRef(), this);
    }
    this.upgradeCount = upgradeCount;
    if (0 < upgradeCount && this.statBonusPerUpgrade) {
      var level;
      for (level = 0; level < this.upgradeCount; level++) {
        applyStatBonus(stateRef().scrollCaster, this.statBonusPerUpgrade.statType, this.statBonusPerUpgrade.statBonusValue);
      }
      updateScrollAccuracy(stateRef().scrollCaster.stats);
    }
    this.label = getScrollLabel(this);
    this.nextLabel = getNextScrollLabel(this);
    this.upgradeCost = getScrollUpgradeCost(this);
  };
  ScrollDrop.prototype.getScroll = function () {
    return this.scroll;
  };
  ScrollDrop.prototype.setCollected = function (collected) {
    this.collected = collected;
  };
  ScrollDrop.prototype.setClaimedBy = function (character) {
    this.claimedBy = character;
  };
  ScrollDrop.prototype.getClaimDistance = function () {
    return this.claimDistance;
  };
  ScrollDrop.prototype.setClaimDistance = function (distance) {
    this.claimDistance = distance;
  };
  ScrollDropRegistry.prototype.releaseClaims = function () {
    var dropIndex;
    for (dropIndex = 0; dropIndex < this.drops.length; dropIndex++) {
      this.drops[dropIndex].setClaimedBy(null);
      this.drops[dropIndex].setClaimDistance(0);
    }
  };
  scrollDefinitions = [{
    scrollId: "shockScroll",
    baseName: "休克",
    spriteName: "Scroll0028.PNG",
    spellDefinition: electricSpellDefinitions.shockSpell,
    baseCapacity: 0,
    capacityIncrement: 4,
    maxCharges: 0
  }, {
    scrollId: "spiderWebScroll",
    baseName: "蛛网",
    spriteName: "Scroll0054.PNG",
    spellDefinition: electricSpellDefinitions.spiderWebSpell,
    baseCapacity: 3,
    capacityIncrement: 4,
    maxCharges: 4,
    statBonusPerUpgrade: {
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
    statBonusPerUpgrade: {
      statType: 23,
      statBonusValue: 1
    }
  }, {
    scrollId: "fireRainScroll",
    baseName: "火雨",
    spriteName: "Scroll0022.PNG",
    spellDefinition: fireSpellDefinitions.fireRainSpell,
    baseCapacity: 9,
    capacityIncrement: 4,
    maxCharges: 2,
    statBonusPerUpgrade: {
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
    statBonusPerUpgrade: {
      statType: 21,
      statBonusValue: 1
    }
  }, {
    scrollId: "fireBallScroll",
    baseName: "火球",
    spriteName: "Scroll0097.PNG",
    spellDefinition: fireSpellDefinitions.fireBallSpell,
    baseCapacity: 15,
    capacityIncrement: 4,
    maxCharges: 2,
    statBonusPerUpgrade: {
      statType: 25,
      statBonusValue: 1
    }
  }];
  ScrollInventory.prototype.getScrollById = function (scrollId) {
    return this.scrollsById[scrollId];
  };
}
