/** 攻击和施法动作、命中、伤害及死亡处理。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { getOpponents, recordMonsterTypeKill } from "./encounters.js";
import { game } from "../runtime/game.js";
import { VisualEffect, addVisualEffect } from "../rendering/sprites.js";
import { showDamageText, showFloatingText } from "../rendering/floating-text.js";
import { getSpellSpiritCost, spendSpirit, statValue } from "../characters/stats.js";
import { Vector2, floorNumber, randomInt, recordGameEvent, setVector } from "../core/math.js";
import { statusEffectDefinitions, stunEffectDefinition } from "./skill-effects.js";
import { StatusEffect, isDisablingEffect, removeStunEffects } from "../characters/effects.js";
import { barbarianChickenMinion, chickenMinion, minionsBySpell, ninjaChickenMinion, rogueChickenMinion } from "../content/minions.js";
import { spawnMinion, tickCharacterTurn, updateWorldTravel } from "../simulation/characters.js";
import { addExperience, addGold, addKills } from "../characters/party.js";
import { GoldDrop, getRoomTreasure, removeGoldDrop } from "../loot/treasure.js";
import { awardAdventurePoints } from "../progression/points.js";
import { FIRE_ITEM_EFFECT, ICE_ITEM_EFFECT, POISON_ITEM_EFFECT, SHOCK_ITEM_EFFECT, SONIC_ITEM_EFFECT, removeItemDrop, spawnItemDrop } from "../loot/items.js";
import { addInventoryItem } from "../loot/inventory.js";
import { ScrollDrop, addScrollCharge, removeScrollDrop } from "./scrolls.js";
import { Potion, PotionDrop, addPotion, potionDefinitions, removePotionDrop } from "./potions.js";
import { ADVENTURER_TYPE, findChainTarget } from "../ai/targeting.js";
import { isAdventurerOrMinion } from "../characters/character.js";
import { BASE_POTION_CAPACITY, doubleExperienceModifier, doubleGoldDropsModifier, doubleItemDropsModifier, doubleKillsModifier, potionCapacityBonus, rollGoldDrop } from "../content/balance.js";
import { clampPointToRoom, roomBottomPixels, roomLeftPixels, roomRightPixels, roomTopPixels, setTileEffect } from "../world/rooms.js";
import { MELEE_ATTACK_RANGE, RANGED_ATTACK_RANGE } from "../content/classes.js";
export function CombatAction() {
  this.remainingDamage = 0;
  this.hasProjectilePhase = this.resolved = this.noDamage = false;
  this.impactEffect = this.projectileEffect = this.attacker = this.targetCharacter = this.actionDefinition = null;
  this.ut = this.Xs = false;
  this.chainCount = this.Ys = 0;
  this.returnOriginPosition = null;
}
/** @typedef {CombatAction & { setTargetCharacter: (target: unknown) => void }} TargetedCombatAction */
export function findTargetsInRange(a, b, c, d) {
  a = getOpponents(a);
  if (0 === a.length) {
    return null;
  }
  var f = b.position.room;
  if (!f) {
    return null;
  }
  var g,
    h = b.position.levelPosition,
    l,
    n = [];
  for (b = 0; b < a.length && (g = a[b], g.isDead || g.position.room !== f || (l = h.distanceTo(g.position.levelPosition), !(l <= d && (n.push(g), n.length >= c)))); b++) {}
  return n;
}
export function CombatQueue() {
  this.queue = [];
}
export function clearCombatQueue() {
  var a = game.combatQueue;
  if (0 < a.queue.length) {
    a.queue.length = 0;
  }
}
export function advanceCombatAction(a, b) {
  var c = b.impactEffect;
  if (c && !c.hasSpawned) {
    if (b.noDamage) {
      return b.resolved = true;
    }
    addVisualEffect(game.effects, c);
    var d = b.actionDefinition;
    if (d && d.applyEffectOnImpact) {
      applySpellEffect(a, b);
    }
    if (0 < b.remainingDamage) {
      showDamageText(b.targetCharacter, b.remainingDamage);
    }
    if (b.Xs) {
      if (d = createChainAction(b)) {
        enqueueCombatAction(a, d);
      }
    } else {
      if (b.ut && (d = createReturningAction(b))) {
        enqueueCombatAction(a, d);
      }
    }
  }
  if ((d = b.impactEffect) && d.bx !== d.frameIndex) {
    var f = d.To();
    if (b.actionDefinition) {
      var g = b.targetCharacter,
        h = b.actionDefinition,
        l = h.spellCategoryId;
      if (g) {
        if (d = g.stats, 4 === l || 5 === l || 8 === l || 13 === l || 12 === l) {
          applyActionDamage(b);
        } else if (1 === l && (h = h.potencyPercent, l = statValue(d.maxHealth), d.health < l)) {
          var n = b.attacker.stats.Ts;
          if (1 < n) {
            h = Math.min(100, h * n);
          }
          f = Math.max(1, floorNumber(h / 100 * l / f));
          h = game.floatingText;
          if (0 < f) {
            showFloatingText(h, g, "+" + f, "#00FF00");
          }
          d.health += floorNumber(f);
          g = statValue(d.maxHealth);
          if (d.health > g) {
            d.health = g;
          }
        }
      }
    } else {
      if (0 < b.remainingDamage) {
        applyActionDamage(b);
      }
    }
  }
  return c && c.isFinished() ? ((c = b.actionDefinition) && (c.applyEffectOnImpact || applySpellEffect(a, b)), b.resolved = true) : false;
}
export function applySpellEffect(a, b) {
  var c = b.actionDefinition,
    d = c.spellCategoryId;
  if (2 === d || 3 === d) {
    var f = b.attacker,
      d = c.statusEffectTypeId,
      c = c.potencyPercent,
      g = statusEffectDefinitions[d];
    if (g) {
      var f = f.stats,
        h = 1;
      switch (d) {
        case 5:
          h = f.Ps;
          break;
        case 6:
          h = f.Rs;
          break;
        case 7:
          h = f.Qs;
          break;
        case 8:
          h = f.Ss;
      }
      d = new StatusEffect(d, game.state.turnNumber, g.durationTurns, game.animations.getAnimation(g.animationName), g.overlayFrameIndex, g.hasAnimation, 1 > h ? c : c * h);
    } else {
      console.log("Failed to find char effect description: " + d);
      d = null;
    }
    c = b.targetCharacter.effects;
    if (d) {
      c.activeEffects.push(d);
      if (isDisablingEffect(d)) {
        c.isDisabled = true;
      }
    }
  } else if (10 === d || 9 === d) {
    summonSpellMinion(c, b.attacker, b.impactEffect.targetPosition);
  } else if (11 === d) {
    d = b.attacker;
    g = b.impactEffect.targetPosition;
    h = b.targetCharacter;
    f = game.monsters;
    if (h) {
      h = f.defeatedMonsters.indexOf(h);
      if (-1 < h) {
        f.defeatedMonsters.splice(h, 1);
      }
    }
    summonSpellMinion(c, d, g);
  } else if (17 === d) {
    c = b.attacker;
    d = b.impactEffect.targetPosition;
    var chickenStats = c.stats;
    g = chickenStats.ku;
    f = chickenStats.lu;
    h = chickenStats.mu;
    if (0 < g && Math.random() < g / 100) {
      g = barbarianChickenMinion;
      showFloatingText(game.floatingText, c, "野蛮人小鸡!", "blue");
    } else {
      if (0 < f && Math.random() < f / 100) {
        g = ninjaChickenMinion;
        showFloatingText(game.floatingText, c, "忍者小鸡!", "blue");
      } else {
        if (0 < h && Math.random() < h / 100) {
          g = rogueChickenMinion;
          showFloatingText(game.floatingText, c, "盗贼小鸡!", "blue");
        } else {
          g = chickenMinion;
        }
      }
    }
    spawnMinion(g, c, d);
  } else if (14 === d) {
    d = b.attacker.position.levelPosition;
    g = game.goldDrops.drops;
    for (c = g.length - 1; 0 <= c; c--) {
      f = g[c];
      if (!f.collected) {
        var goldOffset = new Vector2();
        setVector(goldOffset, f.levelPositionX, f.levelPositionY);
        var goldEffect = new VisualEffect("Gold Sparkles", d, goldOffset, false, 1);
        addVisualEffect(game.effects, goldEffect);
        addGold(f.goldAmount);
        game.state.statisticsRecorder.recordGoldFromMonsters(f.goldAmount);
        f.setCollected(true);
        removeGoldDrop(f);
        awardAdventurePoints(9);
      }
    }
    d = b.attacker.position.levelPosition;
    g = game.itemDrops.drops;
    for (c = g.length - 1; 0 <= c; c--) {
      var itemDrop = g[c];
      if (!itemDrop.collected) {
        var itemOffset = new Vector2();
        setVector(itemOffset, itemDrop.levelPositionX, itemDrop.levelPositionY);
        var itemEffect = new VisualEffect("Blue Sparkles", d, itemOffset, false, 1);
        addVisualEffect(game.effects, itemEffect);
        f = itemDrop.getItem();
        itemDrop.setCollected(true);
        removeItemDrop(itemDrop);
        a: {
          var itemOwner = undefined;
          for (var ownerIndex = 0; ownerIndex < game.state.adventurers.length; ownerIndex++) {
            if (game.state.adventurers[ownerIndex].characterClass === f.characterClass) {
              itemOwner = game.state.adventurers[ownerIndex];
              break a;
            }
          }
          console.log("failed to find item character");
          itemOwner = null;
        }
        game.state.statisticsRecorder.recordItemFound(f);
        addInventoryItem(itemOwner.inventory, f);
        awardAdventurePoints(12);
        f = f.getRarity();
        if (0 != f) {
          switch (f) {
            case 1:
              awardAdventurePoints(13);
              break;
            case 2:
              awardAdventurePoints(14);
              break;
            case 3:
              awardAdventurePoints(15);
              break;
            case 4:
              awardAdventurePoints(16);
          }
        }
      }
    }
    d = b.attacker.position.levelPosition;
    g = game.scrollDrops.drops;
    for (c = g.length - 1; 0 <= c; c--) {
      f = g[c];
      if (!f.collected) {
        var scrollOffset = new Vector2();
        setVector(scrollOffset, f.levelPositionX, f.levelPositionY);
        var scrollEffect = new VisualEffect("Pink Sparkles", d, scrollOffset, false, 1);
        addVisualEffect(game.effects, scrollEffect);
        f.setCollected(true);
        removeScrollDrop(f);
        addScrollCharge(f.getScroll());
        awardAdventurePoints(10);
      }
    }
    d = b.attacker.position.levelPosition;
    g = game.potionDrops.drops;
    for (c = g.length - 1; 0 <= c; c--) {
      f = g[c];
      if (!f.collected) {
        var potionOffset = new Vector2();
        setVector(potionOffset, f.levelPositionX, f.levelPositionY);
        var potionEffect = new VisualEffect("Green Sparkles", d, potionOffset, false, 1);
        addVisualEffect(game.effects, potionEffect);
        f.setCollected(true);
        removePotionDrop(f);
        addPotion(f.potion);
        awardAdventurePoints(11);
      }
    }
  } else {
    if (15 === d) {
      a.findTreasureSpell(b);
    } else {
      if (16 === d && (c = b.targetCharacter)) {
        c = c.effects;
        c.isStunned = false;
        removeStunEffects(c);
      }
    }
  }
}
export function summonSpellMinion(a, b, c) {
  if (a = minionsBySpell[a.name]) {
    spawnMinion(a, b, c);
  } else {
    console.log("Failed to find minion for summon spell.");
  }
}
export function applyActionDamage(a) {
  var b = a.targetCharacter,
    c = b.stats,
    d = a.remainingDamage;
  if (0 !== d) {
    var f = 1 + randomInt(d - 1);
    if (0 !== f) {
      d = Math.max(0, d - f);
      a.remainingDamage = d;
      c.health -= floorNumber(f);
      if (0 > c.health) {
        c.health = 0;
      }
      d = a.attacker;
      d = 1 === d.characterType ? d.summoner.stats : d.stats;
      d.damageGiven += f;
      d = b.stats;
      d.damageReceived += f;
      if (0 === c.health) {
        resolveCharacterDefeat(a.attacker, b);
      }
    }
  }
}
export function resolveCharacterDefeat(a, b) {
  if (b.characterType === ADVENTURER_TYPE) {
    if (!b.effects.isStunned) {
      game.state.statisticsRecorder.recordCharacterStunned();
      b.effects.isStunned = true;
      var c = b.position.levelPosition,
        stunEffect = new StatusEffect(13, game.state.turnNumber, stunEffectDefinition.durationTurns, game.animations.getAnimation(stunEffectDefinition.animationName), stunEffectDefinition.overlayFrameIndex, stunEffectDefinition.hasAnimation, 0);
      c = new VisualEffect(stunEffectDefinition.animationName, c, c, false, 1);
      b.stats.stunCount++;
      var f = b.effects;
      if (stunEffect) {
        f.activeEffects.push(stunEffect);
        if (isDisablingEffect(stunEffect)) {
          f.isDisabled = true;
        }
      }
      c.uA = true;
      c.boundCharacter = b;
      addVisualEffect(game.effects, c);
      showFloatingText(game.floatingText, b, "昏迷!", "white");
    }
  } else if (1 === b.characterType) {
    game.lifecycle.Lp(b);
  } else if (4 === b.characterType) {
    if (!b.isDead) {
      var g = b.position,
        d = 1 === a.characterType ? a.summoner : a;
      if (isAdventurerOrMinion(d)) {
        d.stats.kills++;
        addKills(doubleKillsModifier.currentValue);
        game.state.statisticsRecorder.recordDirectKill();
        if (5 === d.characterType) {
          game.state.statisticsRecorder.recordScrollKill();
        }
        if (1 === a.characterType) {
          game.state.statisticsRecorder.recordMinionKill();
        }
        d = b.monsterType;
        addExperience(d.experienceReward * doubleExperienceModifier.currentValue);
        recordMonsterTypeKill(d);
      }
      var d = g.room,
        c = roomLeftPixels(d) + game.tileSize;
      f = roomRightPixels(d) - game.tileSize;
      var h = roomTopPixels(d) + game.tileSize,
        l = roomBottomPixels(d) - game.tileSize,
        n = g.getLevelPositionX(),
        p = g.getLevelPositionY(),
        s = 10 + randomInt(10),
        u;
      if (doubleGoldDropsModifier.currentValue) {
        s *= 2;
      }
      for (g = 0; g < s; g++) {
        u = 1 + rollGoldDrop();
        u = new GoldDrop(u, tickCharacterTurn(n, c, f), tickCharacterTurn(p, h, l), d);
        game.goldDrops.drops.push(u);
      }
      s = 7 + randomInt(8);
      if (doubleItemDropsModifier.currentValue) {
        s *= 2;
      }
      for (g = 0; g < s; g++) {
        spawnItemDrop(game.itemDrops, tickCharacterTurn(n, c, f), tickCharacterTurn(p, h, l), d, b.stats.characterLevel);
      }
      s = 2 + randomInt(5);
      for (g = 0; g < s; g++) {
        u = game.scrolls.unlockedScrolls;
        u = u[randomInt(u.length)];
        u = new ScrollDrop(u, tickCharacterTurn(n, c, f), tickCharacterTurn(p, h, l), d);
        game.scrollDrops.drops.push(u);
      }
      s = 0 + randomInt(2);
      for (g = 0; g < s && game.potions.potionList.length < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue; g++) {
        u = new Potion(potionDefinitions[randomInt(potionDefinitions.length)]);
        u = new PotionDrop(u, tickCharacterTurn(n, c, f), tickCharacterTurn(p, h, l), d);
        game.potionDrops.drops.push(u);
      }
      b.isDead = true;
      d = updateWorldTravel();
      b.sprite = d;
      game.monsters.clearEncounter(b);
      game.state.encounter.clearEncounter();
      recordGameEvent("Boss Defeated", "等级:" + b.stats.characterLevel);
      showFloatingText(game.floatingText, b, "击杀首领!", "white");
    }
  } else {
    game.lifecycle.clearEncounter(a, b);
  }
}
export function enqueueCombatAction(a, b) {
  a.queue.push(b);
}
export function performMultiAttack(a, b) {
  var c = a.stats,
    d = c.extraAttackChance / 100,
    f = 0,
    g;
  for (g = 0; g < c.extraAttackCount; g++) {
    if (Math.random() < d) {
      f++;
    } else {
      break;
    }
  }
  if ((c = findTargetsInRange(a, a, 1 + f, b ? a === game.state.scrollCaster ? 100 * RANGED_ATTACK_RANGE : RANGED_ATTACK_RANGE : MELEE_ATTACK_RANGE)) && 0 !== c.length) {
    for (d = 0; d < c.length; d++) {
      createAttackAction(a, c[d], b);
    }
  }
}
export function createAttackAction(a, b, c) {
  var d = new CombatAction();
  d.attacker = a;
  (/** @type {TargetedCombatAction} */ (d)).setTargetCharacter(b);
  if (12 == a.characterClass) {
    c = b.position.levelPosition;
    a = calculateAttackDamage(a, b);
    d.remainingDamage = a;
    d.noDamage = 0 === a;
    d.hasProjectilePhase = false;
    a = new VisualEffect("Red Splat", c, c, false, 1);
  } else if (c) {
    c = b.position.levelPosition;
    var f = a.position.levelPosition,
      g = calculateAttackDamage(a, b);
    b = a.equipment ? a.equipment.Ey : null;
    var h = a.getEffectItem(),
      h = h ? h.itemEffect : null;
    d.remainingDamage = g;
    d.noDamage = 0 === g;
    d.hasProjectilePhase = true;
    g = "Red Splat";
    if (h) {
      var l = h.ms;
      if (l) {
        g = l;
      }
      f = new VisualEffect(getProjectileAnimation(b, h.Dw), f, c, true, 1);
    } else {
      f = new VisualEffect(getProjectileAnimation(b, null), f, c, true, 1);
    }
    f.boundCharacter = a;
    d.projectileEffect = f;
    a = a.stats.Ir();
    if (0 < a) {
      d.Xs = true;
      d.chainCount = a;
    }
    a = new VisualEffect(g, c, c, false, 1);
  } else {
    c = b.position.levelPosition;
    f = calculateAttackDamage(a, b);
    b = (a = a.getEffectItem()) ? a.itemEffect : null;
    a = null;
    d.remainingDamage = f;
    d.noDamage = 0 === f;
    d.hasProjectilePhase = false;
    if (b && (f = b.ms)) {
      a = new VisualEffect(f, c, c, false, 1);
    }
    if (!a) {
      a = new VisualEffect("Red Splat", c, c, false, 1);
    }
  }
  d.impactEffect = a;
  enqueueCombatAction(game.combatQueue, d);
}
export function createSpellAction(a) {
  var b = a.combatTarget;
  if (!b || b.isDead) {
    return null;
  }
  var c = a.spellToCast;
  if (!c) {
    return null;
  }
  var d = new CombatAction();
  d.attacker = a;
  (/** @type {TargetedCombatAction} */ (d)).setTargetCharacter(b);
  var f = b.position.levelPosition,
    g = a.position.levelPosition;
  d.actionDefinition = c;
  d.hasProjectilePhase = true;
  var h = c.projectileEffectName;
  if (h) {
    h = new VisualEffect(h, g, f, true, 1);
    h.boundCharacter = a;
    d.projectileEffect = h;
  }
  if (h = c.impactEffectName) {
    f = new VisualEffect(h, g, f, false, 1);
    d.impactEffect = f;
  }
  c = c.spellCategoryId;
  if (4 === c) {
    b = calculateAttackDamage(a, b);
    d.noDamage = 0 === b;
    d.remainingDamage = b;
  } else {
    if (13 === c) {
      b = Math.max(1, calculateAttackDamage(a, b));
      d.noDamage = false;
      d.remainingDamage = b;
    }
  }
  a = a.stats;
  b = getSpellSpiritCost(a);
  spendSpirit(a, b);
  enqueueCombatAction(game.combatQueue, d);
  return d;
}
export function randomPointInRoom(a, b) {
  var c = new Vector2(),
    d = a.x,
    f = a.y,
    g = randomInt(40),
    h = randomInt(40),
    d = 0.5 >= Math.random() ? d + g : d - g,
    f = 0.5 >= Math.random() ? f + h : f - h;
  setVector(c, d, f);
  if (b) {
    clampPointToRoom(b, c, game.halfTileSize);
  }
  return c;
}
export function applyAreaTileEffect(a, b, c, d, f, g, h) {
  if (a >= c && a <= d && b >= f && b <= g && (a = game.level.getTileAt(a, b))) {
    setTileEffect(a, h);
  }
}
export function getProjectileAnimation(a, b) {
  if (3 === a.sw()) {
    return "Ninja Star";
  }
  if (b) {
    switch (b) {
      case FIRE_ITEM_EFFECT:
        return "Fire Arrow";
      case ICE_ITEM_EFFECT:
        return "Ice Arrow";
      case POISON_ITEM_EFFECT:
        return "Small Green Projectiles";
      case SHOCK_ITEM_EFFECT:
        return "Lightning Arrow";
      case SONIC_ITEM_EFFECT:
        return "Green Arrow";
      default:
        return "Red Arrow";
    }
  } else {
    return "Red Arrow";
  }
}
export function calculateAttackDamage(a, b) {
  var c = a.stats,
    d = b.stats,
    f = statValue(c.attackRating),
    g = statValue(c.damage),
    h = statValue(d.defenceRating),
    l = statValue(d.armor),
    d = d.wo,
    c = c.lm;
  if (!b.effects.isDisabled && Math.random() > f / (f + h)) {
    return 0;
  }
  if (0 < c && Math.random() < c / 100) {
    return showFloatingText(game.floatingText, a, "暴击!", "#FFFF00"), g;
  }
  f = floorNumber(l / 2);
  g -= f + randomInt(f);
  return 0 >= g ? 0 : 0 < d ? Math.max(0, g - floorNumber(d / 100 * g)) : g;
}
export function calculateSpellDamage(a, b) {
  var c = a.stats,
    d = statValue(c.damage),
    f = statValue(b.stats.armor),
    c = c.lm;
  if (0 < c && Math.random() < c / 100) {
    return showFloatingText(game.floatingText, a, "暴击!", "#FFFF00"), d;
  }
  f = floorNumber(f / 2);
  d -= f + randomInt(f);
  return 0 >= d ? 0 : d;
}
export function createChainAction(a) {
  var b = a.Ir(),
    c = a.chainCount;
  if (b >= c) {
    return null;
  }
  var d = findChainTarget(a.targetCharacter);
  if (!d) {
    return null;
  }
  var f = a.projectileEffect;
  if (!f) {
    return null;
  }
  var g = a.impactEffect;
  if (!g) {
    return null;
  }
  var h = new CombatAction(),
    l = g.targetPosition,
    n = d.position.levelPosition;
  h.attacker = a.attacker;
  (/** @type {TargetedCombatAction} */ (h)).setTargetCharacter(d);
  g = new VisualEffect(g.impactEffectName, l, n, false, 1);
  h.impactEffect = g;
  f = new VisualEffect(f.impactEffectName, l, n, true, 1);
  h.projectileEffect = f;
  h.hasProjectilePhase = true;
  d = calculateAttackDamage(a.attacker, d);
  h.remainingDamage = d;
  h.noDamage = 0 === d;
  h.actionDefinition = a.actionDefinition;
  h.Ys = b + 1;
  h.Xs = true;
  h.chainCount = c;
  return h;
}
export function createReturningAction(a) {
  var b = a.Ir(),
    c = a.chainCount,
    d;
  if (b === c) {
    var f = new CombatAction();
    f.attacker = a.attacker;
    (/** @type {TargetedCombatAction} */ (f)).setTargetCharacter(a.attacker);
    f.hasProjectilePhase = true;
    f.actionDefinition = a.actionDefinition;
    f.ut = true;
    f.Ys = 1;
    f.chainCount = 0;
    c = a.projectileEffect;
    d = a.attacker.position.levelPosition;
    var g = a.returnOriginPosition,
      b = a.impactEffect;
    f.noDamage = false;
    if (c) {
      c = new VisualEffect(c.impactEffectName, d, g, true, 1);
      c.isReturning = true;
      c.boundCharacter = a.attacker;
      f.projectileEffect = c;
    }
    a = new VisualEffect(b.impactEffectName, d, g, false, 1);
    f.impactEffect = a;
    return f;
  }
  if (b > c) {
    return null;
  }
  d = a.impactEffect;
  if (!d) {
    return null;
  }
  g = findChainTarget(a.targetCharacter);
  if (!g) {
    return null;
  }
  f = new CombatAction();
  f.attacker = a.attacker;
  f.hasProjectilePhase = true;
  f.actionDefinition = a.actionDefinition;
  f.Ys = b + 1;
  f.ut = true;
  f.chainCount = c;
  f.returnOriginPosition = a.returnOriginPosition;
  var h = a.projectileEffect,
    b = d.targetPosition,
    c = g.position.levelPosition;
  (/** @type {TargetedCombatAction} */ (f)).setTargetCharacter(g);
  g = calculateSpellDamage(a.attacker, g);
  f.remainingDamage = g;
  f.noDamage = 0 === g;
  if (h) {
    g = new VisualEffect(h.impactEffectName, b, c, true, 1);
    g.isReturning = true;
    g.boundCharacter = a.attacker;
    f.projectileEffect = g;
  }
  a = new VisualEffect(d.impactEffectName, b, c, false, 1);
  f.impactEffect = a;
  return f;
}
export function initializeCombatActions() {
  CombatAction.prototype.setTargetCharacter = function (a) {
    this.targetCharacter = a;
  };
  CombatAction.prototype.Ir = function () {
    return this.Ys;
  };
  CombatQueue.prototype.findTreasureSpell = function (a) {
    if (a = getRoomTreasure(game.treasure, a.attacker.position.room)) {
      a.selected = true;
      game.state.party.setTargetTreasureChest(a);
    }
  };
}
