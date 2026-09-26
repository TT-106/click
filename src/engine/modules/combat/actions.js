// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
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
  this.Jc = 0;
  this.yd = this.Vn = this.Rd = false;
  this.impactEffect = this.projectileEffect = this.attacker = this.targetCharacter = this.actionDefinition = null;
  this.ut = this.Xs = false;
  this.chainCount = this.Ys = 0;
  this.pl = null;
}
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
  for (b = 0; b < a.length && (g = a[b], g.isDead || g.position.room !== f || (l = h.ac(g.position.levelPosition), !(l <= d && (n.push(g), n.length >= c)))); b++) {}
  return n;
}
export function CombatQueue() {
  this.kj = [];
}
export function clearCombatQueue() {
  var a = game.combatQueue;
  if (0 < a.kj.length) {
    a.kj.length = 0;
  }
}
export function advanceCombatAction(a, b) {
  var c = b.impactEffect;
  if (c && !c.Cj) {
    if (b.Rd) {
      return b.Vn = true;
    }
    addVisualEffect(game.effects, c);
    var d = b.actionDefinition;
    if (d && d.td) {
      applySpellEffect(a, b);
    }
    if (0 < b.Jc) {
      showDamageText(b.targetCharacter, b.Jc);
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
  if ((d = b.impactEffect) && d.bx !== d.oc) {
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
      if (0 < b.Jc) {
        applyActionDamage(b);
      }
    }
  }
  return c && c.bl() ? ((c = b.actionDefinition) && (c.td || applySpellEffect(a, b)), b.Vn = true) : false;
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
      d = new StatusEffect(d, game.state.turnNumber, g.Qd, game.animations.Zg(g.vd), g.Od, g.Pd, 1 > h ? c : c * h);
    } else {
      console.log("Failed to find char effect description: " + d);
      d = null;
    }
    c = b.targetCharacter.effects;
    if (d) {
      c.of.push(d);
      if (isDisablingEffect(d)) {
        c.Kd = true;
      }
    }
  } else if (10 === d || 9 === d) {
    summonSpellMinion(c, b.attacker, b.impactEffect.xi);
  } else if (11 === d) {
    d = b.attacker;
    g = b.impactEffect.xi;
    h = b.targetCharacter;
    f = game.monsters;
    if (h) {
      h = f.Og.indexOf(h);
      if (-1 < h) {
        f.Og.splice(h, 1);
      }
    }
    summonSpellMinion(c, d, g);
  } else if (17 === d) {
    c = b.attacker;
    d = b.impactEffect.xi;
    h = c.stats;
    g = h.ku;
    f = h.lu;
    h = h.mu;
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
    g = game.goldDrops.pe;
    for (c = g.length - 1; 0 <= c; c--) {
      f = g[c];
      if (!f.gc) {
        h = new Vector2();
        setVector(h, f.Xo, f.Yo);
        h = new VisualEffect("Gold Sparkles", d, h, false, 1);
        addVisualEffect(game.effects, h);
        addGold(f.Xl);
        game.state.statisticsRecorder.dp(f.Xl);
        f.oh(true);
        removeGoldDrop(f);
        awardAdventurePoints(9);
      }
    }
    d = b.attacker.position.levelPosition;
    g = game.itemDrops.yf;
    for (c = g.length - 1; 0 <= c; c--) {
      if (h = g[c], !h.gc) {
        f = new Vector2();
        setVector(f, h.mp, h.np);
        f = new VisualEffect("Blue Sparkles", d, f, false, 1);
        addVisualEffect(game.effects, f);
        f = h.getItem();
        h.oh(true);
        removeItemDrop(h);
        a: {
          h = undefined;
          for (h = 0; h < game.state.adventurers.length; h++) {
            if (game.state.adventurers[h].characterClass === f.characterClass) {
              h = game.state.adventurers[h];
              break a;
            }
          }
          console.log("failed to find item character");
          h = null;
        }
        game.state.statisticsRecorder.ep(f);
        addInventoryItem(h.inventory, f);
        awardAdventurePoints(12);
        f = f.uf();
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
    g = game.scrollDrops.kf;
    for (c = g.length - 1; 0 <= c; c--) {
      f = g[c];
      if (!f.gc) {
        h = new Vector2();
        setVector(h, f.bq, f.cq);
        h = new VisualEffect("Pink Sparkles", d, h, false, 1);
        addVisualEffect(game.effects, h);
        f.oh(true);
        removeScrollDrop(f);
        addScrollCharge(f.vf());
        awardAdventurePoints(10);
      }
    }
    d = b.attacker.position.levelPosition;
    g = game.potionDrops.Hf;
    for (c = g.length - 1; 0 <= c; c--) {
      f = g[c];
      if (!f.gc) {
        h = new Vector2();
        setVector(h, f.Qp, f.Rp);
        h = new VisualEffect("Green Sparkles", d, h, false, 1);
        addVisualEffect(game.effects, h);
        f.oh(true);
        removePotionDrop(f);
        addPotion(f.hc);
        awardAdventurePoints(11);
      }
    }
  } else {
    if (15 === d) {
      a.wu(b);
    } else {
      if (16 === d && (c = b.targetCharacter)) {
        c = c.effects;
        c.Kf = false;
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
    d = a.Jc;
  if (0 !== d) {
    var f = 1 + randomInt(d - 1);
    if (0 !== f) {
      d = Math.max(0, d - f);
      a.Jc = d;
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
    if (!b.effects.Kf) {
      game.state.statisticsRecorder.Tr();
      b.effects.Kf = true;
      var c = b.position.levelPosition,
        d = new StatusEffect(13, game.state.turnNumber, stunEffectDefinition.Qd, game.animations.Zg(stunEffectDefinition.vd), stunEffectDefinition.Od, stunEffectDefinition.Pd, 0),
        c = new VisualEffect(stunEffectDefinition.vd, c, c, false, 1);
      b.stats.stunCount++;
      var f = b.effects;
      if (d) {
        f.of.push(d);
        if (isDisablingEffect(d)) {
          f.Kd = true;
        }
      }
      c.uA = true;
      c.ud = b;
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
        game.state.statisticsRecorder.cp();
        if (5 === d.characterType) {
          game.state.statisticsRecorder.gp();
        }
        if (1 === a.characterType) {
          game.state.statisticsRecorder.$k();
        }
        d = b.Sb;
        addExperience(d.No * doubleExperienceModifier.currentValue);
        recordMonsterTypeKill(d);
      }
      var d = g.room,
        c = roomLeftPixels(d) + game.tileSize,
        f = roomRightPixels(d) - game.tileSize,
        h = roomTopPixels(d) + game.tileSize,
        l = roomBottomPixels(d) - game.tileSize,
        n = g.Ob(),
        p = g.Pb(),
        s = 10 + randomInt(10),
        u;
      if (doubleGoldDropsModifier.currentValue) {
        s *= 2;
      }
      for (g = 0; g < s; g++) {
        u = 1 + rollGoldDrop();
        u = new GoldDrop(u, tickCharacterTurn(n, c, f), tickCharacterTurn(p, h, l), d);
        game.goldDrops.pe.push(u);
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
        u = game.scrolls.Pl;
        u = u[randomInt(u.length)];
        u = new ScrollDrop(u, tickCharacterTurn(n, c, f), tickCharacterTurn(p, h, l), d);
        game.scrollDrops.kf.push(u);
      }
      s = 0 + randomInt(2);
      for (g = 0; g < s && game.potions.re.length < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue; g++) {
        u = new Potion(potionDefinitions[randomInt(potionDefinitions.length)]);
        u = new PotionDrop(u, tickCharacterTurn(n, c, f), tickCharacterTurn(p, h, l), d);
        game.potionDrops.Hf.push(u);
      }
      b.isDead = true;
      d = updateWorldTravel();
      b.ee = d;
      game.monsters.ol(b);
      game.state.encounter.ol();
      recordGameEvent("Boss Defeated", "等级:" + b.stats.characterLevel);
      showFloatingText(game.floatingText, b, "击杀首领!", "white");
    }
  } else {
    game.lifecycle.ol(a, b);
  }
}
export function enqueueCombatAction(a, b) {
  a.kj.push(b);
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
  d.Cb(b);
  if (12 == a.characterClass) {
    c = b.position.levelPosition;
    a = calculateAttackDamage(a, b);
    d.Jc = a;
    d.Rd = 0 === a;
    d.yd = false;
    a = new VisualEffect("Red Splat", c, c, false, 1);
  } else if (c) {
    c = b.position.levelPosition;
    var f = a.position.levelPosition,
      g = calculateAttackDamage(a, b);
    b = a.equipment ? a.equipment.Ey : null;
    var h = a.So(),
      h = h ? h.Rm : null;
    d.Jc = g;
    d.Rd = 0 === g;
    d.yd = true;
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
    f.ud = a;
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
    b = (a = a.So()) ? a.Rm : null;
    a = null;
    d.Jc = f;
    d.Rd = 0 === f;
    d.yd = false;
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
  var c = a.ld;
  if (!c) {
    return null;
  }
  var d = new CombatAction();
  d.attacker = a;
  d.Cb(b);
  var f = b.position.levelPosition,
    g = a.position.levelPosition;
  d.actionDefinition = c;
  d.yd = true;
  var h = c.projectileEffectName;
  if (h) {
    h = new VisualEffect(h, g, f, true, 1);
    h.ud = a;
    d.projectileEffect = h;
  }
  if (h = c.impactEffectName) {
    f = new VisualEffect(h, g, f, false, 1);
    d.impactEffect = f;
  }
  c = c.spellCategoryId;
  if (4 === c) {
    b = calculateAttackDamage(a, b);
    d.Rd = 0 === b;
    d.Jc = b;
  } else {
    if (13 === c) {
      b = Math.max(1, calculateAttackDamage(a, b));
      d.Rd = false;
      d.Jc = b;
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
  if (a >= c && a <= d && b >= f && b <= g && (a = game.level.hb(a, b))) {
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
  if (!b.effects.Kd && Math.random() > f / (f + h)) {
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
    l = g.xi,
    n = d.position.levelPosition;
  h.attacker = a.attacker;
  h.Cb(d);
  g = new VisualEffect(g.impactEffectName, l, n, false, 1);
  h.impactEffect = g;
  f = new VisualEffect(f.impactEffectName, l, n, true, 1);
  h.projectileEffect = f;
  h.yd = true;
  d = calculateAttackDamage(a.attacker, d);
  h.Jc = d;
  h.Rd = 0 === d;
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
    f.Cb(a.attacker);
    f.yd = true;
    f.actionDefinition = a.actionDefinition;
    f.ut = true;
    f.Ys = 1;
    f.chainCount = 0;
    c = a.projectileEffect;
    d = a.attacker.position.levelPosition;
    var g = a.pl,
      b = a.impactEffect;
    f.Rd = false;
    if (c) {
      c = new VisualEffect(c.impactEffectName, d, g, true, 1);
      c.Gs = true;
      c.ud = a.attacker;
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
  f.yd = true;
  f.actionDefinition = a.actionDefinition;
  f.Ys = b + 1;
  f.ut = true;
  f.chainCount = c;
  f.pl = a.pl;
  var h = a.projectileEffect,
    b = d.xi,
    c = g.position.levelPosition;
  f.Cb(g);
  g = calculateSpellDamage(a.attacker, g);
  f.Jc = g;
  f.Rd = 0 === g;
  if (h) {
    g = new VisualEffect(h.impactEffectName, b, c, true, 1);
    g.Gs = true;
    g.ud = a.attacker;
    f.projectileEffect = g;
  }
  a = new VisualEffect(d.impactEffectName, b, c, false, 1);
  f.impactEffect = a;
  return f;
}
export function initializeCombatActions() {
  CombatAction.prototype.Cb = function (a) {
    this.targetCharacter = a;
  };
  CombatAction.prototype.Ir = function () {
    return this.Ys;
  };
  CombatQueue.prototype.wu = function (a) {
    if (a = getRoomTreasure(game.treasure, a.attacker.position.room)) {
      a.el = true;
      game.state.party.hq(a);
    }
  };
}
