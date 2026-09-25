/** 职业法术绑定、目标选择与房间寻路。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { barbarianSpellDefinitions, chickenSpellDefinitions, druidSpellDefinitions, electricSpellDefinitions, fighterSpellDefinitions, fireSpellDefinitions, necromancerSpellDefinitions, ninjaSpellDefinitions, priestSpellDefinitions, rogueSpellDefinitions } from "../content/spells.js";
import { getFriendlyTargets, getOpponents } from "../combat/encounters.js";
import { randomInt, setVector } from "../core/math.js";
import { game } from "../runtime/game.js";
import { clampPointToRoom, getOppositeDoor } from "../world/rooms.js";
import { docileMonstersModifier } from "../content/balance.js";
import { canAttack, markAttackTurn } from "../characters/character.js";
import { clearMovementTarget } from "../characters/movement.js";
export var ADVENTURER_TYPE, MONSTER_TYPE, summonDogSpellDefinition, summonWolfPackSpellDefinition, minorHealSpellDefinition, sleepSpellDefinition, summonChickensSpellDefinition, summonGuardChickenSpellDefinition, swiftStrikeSpellDefinition, hurtSpellDefinition, greenDeathSpellDefinition, summonSkeletonArmySpellDefinition, summonPhantomSkullSpellDefinition, tauntSpellDefinition, rageSpellDefinition, sledgeHammerSpellDefinition, stealthSpellDefinition, instantLootSpellDefinition, detectTreasureChestSpellDefinition, healSpellDefinition, armorSpellDefinition, damageSpellDefinition, attackRatingSpellDefinition, defenseRatingSpellDefinition, reviveSpellDefinition, shockSpellDefinition, spiderWebSpellDefinition, lightningRainSpellDefinition, chainedLightningSpellDefinition, fireBlastSpellDefinition, fireBallSpellDefinition, fireRainSpellDefinition, turnMonsterSpellDefinition, IDLE_ACTION, MELEE_ACTION_TYPE, CAST_ACTION_TYPE;
export function hasOpponentsInRoom(a, b) {
  if (!b) {
    return false;
  }
  var c = getOpponents(a);
  if (0 === c.length) {
    return false;
  }
  var d;
  for (d = 0; d < c.length; d++) {
    if (a !== c[d] && c[d].position.room === b) {
      return true;
    }
  }
  return false;
}
export function findNearestOpponent(a) {
  var b = getOpponents(a);
  if (0 === b.length) {
    return null;
  }
  var c = a.position.room;
  if (!c) {
    return null;
  }
  var d,
    f,
    g = a.position.levelPosition,
    h = null,
    l,
    n = -1;
  for (f = 0; f < b.length; f++) {
    if (!(d = b[f], a === d || d.Va || d.position.room != c || (l = d.Ja, l.wg || d.characterType === ADVENTURER_TYPE && l.Kd || (l = g.Ud(d.position.levelPosition), !(0 > n || l < n))))) {
      h = d;
      n = l;
    }
  }
  return h;
}
export function findNearestVisibleOpponent(a) {
  var b = a.position.room;
  if (!b) {
    return null;
  }
  var c = getOpponents(a);
  if (0 === c.length) {
    return null;
  }
  var d,
    f,
    g = a.position.levelPosition,
    h = null,
    l,
    n = -1;
  for (f = 0; f < c.length; f++) {
    if (!(d = c[f], a === d || d.Va || d.position.room != b || (l = d.Ja, l.wg || l.Kd || l.bi || (l = g.Ud(d.position.levelPosition), !(0 > n || l < n))))) {
      h = d;
      n = l;
    }
  }
  return h;
}
export function selectScrollTarget(a) {
  var b = findNearestVisibleOpponent(a);
  return b ? b : findNearestOpponent(a);
}
export function findChainTarget(a) {
  var b;
  b = getFriendlyTargets(a);
  if (0 === b.length) {
    b = null;
  } else {
    var c = a.position.room;
    if (c) {
      var d,
        f,
        g = a.position.levelPosition,
        h = null,
        l,
        n = -1;
      for (f = 0; f < b.length; f++) {
        if (!(d = b[f], a === d || d.Va || d.position.room != c || (l = d.Ja, l.wg || l.Kd || l.bi || (l = g.Ud(d.position.levelPosition), !(0 > n || l < n))))) {
          h = d;
          n = l;
        }
      }
      b = h;
    } else {
      b = null;
    }
  }
  if (b) {
    return b;
  }
  c = 0;
  d = getFriendlyTargets(a);
  if (1 >= d.length) {
    return null;
  }
  for (b = d[randomInt(d.length)]; b === a && 6 > c;) {
    b = d[randomInt(d.length)];
    if (!b.position.room) {
      b = null;
    }
    c++;
  }
  return b === a ? null : b;
}
export function findNearbyOpponent(a) {
  var b = findNearestOpponent(a);
  return !b || 100 < a.position.levelPosition.ac(b.position.levelPosition) ? null : b;
}
export function approachValue(a, b, c) {
  return Math.max(b, (a - b) * (1 - c / 1E3) + b);
}
export function choosePointNearTarget(a, b, c) {
  var d = randomInt(game.halfTileSize);
  if (0.5 > Math.random()) {
    d = -d;
  }
  var f = randomInt(game.halfTileSize);
  if (0.5 > Math.random()) {
    f = -f;
  }
  setVector(a, b.x + d, b.y + f);
  if (c) {
    clampPointToRoom(c, a, 0);
  }
}
export function findRouteToDoor(a, b) {
  var c = game.pathfinder;
  if (!b) {
    return null;
  }
  var d = a.position.room,
    f = [];
  if (d) {
    var g = d.Nc,
      h;
    for (h = 0; h < g.length; h++) {
      if (d = searchDoorRoute(c, b, g[h], f, true)) {
        return d;
      }
    }
  } else if (g = a.position.cd, (d = searchDoorRoute(c, b, g.af, f, false)) || (d = searchDoorRoute(c, b, g.Be, f, false))) {
    return d;
  }
  return null;
}
export function findRouteToRoom(a, b) {
  var c = game.pathfinder;
  if (!b) {
    return null;
  }
  var d = a.position.room,
    f = [];
  if (d === b) {
    return null;
  }
  if (d) {
    var g = d.Nc,
      h;
    for (h = 0; h < g.length; h++) {
      if (d = searchRoomRoute(c, b, g[h], f, true)) {
        return d;
      }
    }
  } else if (g = a.position.cd, (d = searchRoomRoute(c, b, g.af, f, false)) || (d = searchRoomRoute(c, b, g.Be, f, false))) {
    return d;
  }
  return null;
}
export function searchDoorRoute(a, b, c, d, f) {
  var g;
  if (c === b) {
    return g = [], g.push(c), g;
  }
  if (!c.Mb) {
    return null;
  }
  if (-1 < d.indexOf(c)) {
    return console.log("reached a door that we already checked."), null;
  }
  d.push(c);
  if (f) {
    if (f = getOppositeDoor(c.Yk, c), g = searchDoorRoute(a, b, f, d, false)) {
      return g.unshift(c), g;
    }
  } else {
    var h = c.$d;
    f = h.Nc;
    if (!h.Xi) {
      return null;
    }
    for (h = 0; h < f.length; h++) {
      if (g = f[h], g !== c && (g = searchDoorRoute(a, b, g, d, true))) {
        return g.unshift(c), g;
      }
    }
  }
  return null;
}
export function searchRoomRoute(a, b, c, d, f) {
  var g;
  if (c.$d === b) {
    return g = [], g.push(c), g;
  }
  if (!c.Mb) {
    return null;
  }
  if (-1 < d.indexOf(c)) {
    return console.log("reached a door that we already checked [path to room]."), null;
  }
  d.push(c);
  if (f) {
    if (f = getOppositeDoor(c.Yk, c), g = searchRoomRoute(a, b, f, d, false)) {
      return g.unshift(c), g;
    }
  } else {
    var h = c.$d;
    f = h.Nc;
    if (!h.Xi) {
      return null;
    }
    for (h = 0; h < f.length; h++) {
      if (g = f[h], g !== c && (g = searchRoomRoute(a, b, g, d, true))) {
        return g.unshift(c), g;
      }
    }
  }
  return null;
}
export function AttackBehavior(a, b) {
  this.Al = a;
  this.bb = b;
}
export function respondToTaunt(a, b) {
  if (docileMonstersModifier.t) {
    return false;
  }
  var c = b.Da;
  if (c && c.Va) {
    c = null;
    b.Cb(null);
  }
  if (c && c.Ja.Kf) {
    c = null;
    b.Cb(null);
  }
  if (c && c.Ja.wg) {
    c = null;
    b.Cb(null);
  }
  if (c && c.Ja.Gn) {
    return attackTauntingTarget(a, b), true;
  }
  for (var d = getOpponents(b), f, g = b.position.levelPosition, h, l = null, n = -1, c = 0; c < d.length; c++) {
    if (f = d[c], b !== f && (h = f.Ja, h.Gn && !h.Kd && (h = g.Ud(f.position.levelPosition), 0 > n || h < n))) {
      l = f;
      n = h;
    }
  }
  return (c = l) || (c = findNearbyOpponent(b)) ? (b.Cb(c), attackTauntingTarget(a, b), true) : false;
}
export function attackTauntingTarget(a, b) {
  var c = b.Da.position,
    d = b.position;
  if (c.room === d.room) {
    if (d.levelPosition.ac(c.levelPosition) <= a.bb) {
      if (!canAttack(b)) {
        return;
      }
      markAttackTurn(b);
      b.Y = 2;
    } else {
      choosePointNearTarget(d.Qb, c.levelPosition, b.position.room);
      b.Y = 1;
    }
    clearMovementTarget(d);
  }
}
export function initializeAiTargeting() {
  ADVENTURER_TYPE = 0;
  MONSTER_TYPE = 2;
  summonDogSpellDefinition = {
    c: "summonDogSpell",
    xa: druidSpellDefinitions.LB
  };
  summonWolfPackSpellDefinition = {
    c: "summonWolfPackSpell",
    xa: druidSpellDefinitions.PB
  };
  minorHealSpellDefinition = {
    c: "minorHealSpell",
    xa: druidSpellDefinitions.cE
  };
  sleepSpellDefinition = {
    c: "sleepSpell",
    xa: druidSpellDefinitions.DE
  };
  summonChickensSpellDefinition = {
    c: "summonChickensSpell",
    xa: chickenSpellDefinitions.KB
  };
  summonGuardChickenSpellDefinition = {
    c: "summonGuardChickenSpell",
    xa: chickenSpellDefinitions.MB
  };
  swiftStrikeSpellDefinition = {
    c: "swiftStrikeSpell",
    xa: ninjaSpellDefinitions.Hx
  };
  hurtSpellDefinition = {
    c: "hurtSpell",
    xa: necromancerSpellDefinitions.CD
  };
  greenDeathSpellDefinition = {
    c: "greenDeathSpell",
    xa: necromancerSpellDefinitions.xD
  };
  summonSkeletonArmySpellDefinition = {
    c: "summonSkeletonArmySpell",
    xa: necromancerSpellDefinitions.OB
  };
  summonPhantomSkullSpellDefinition = {
    c: "summonPhantomSkullSpell",
    xa: necromancerSpellDefinitions.NB
  };
  tauntSpellDefinition = {
    c: "tauntSpell",
    xa: fighterSpellDefinitions.ME
  };
  rageSpellDefinition = {
    c: "rageSpell",
    xa: barbarianSpellDefinitions.rE
  };
  sledgeHammerSpellDefinition = {
    c: "sledgeHammerSpell",
    xa: barbarianSpellDefinitions.wB
  };
  stealthSpellDefinition = {
    c: "stealthSpell",
    xa: rogueSpellDefinitions.IB
  };
  instantLootSpellDefinition = {
    c: "instantLootSpell",
    xa: rogueSpellDefinitions.ID
  };
  detectTreasureChestSpellDefinition = {
    c: "detectTreasureChestSpell",
    xa: rogueSpellDefinitions.wu
  };
  healSpellDefinition = {
    c: "healSpell",
    xa: priestSpellDefinitions.yD
  };
  armorSpellDefinition = {
    c: "armorSpell",
    xa: priestSpellDefinitions.Zz
  };
  damageSpellDefinition = {
    c: "damageSpell",
    xa: priestSpellDefinitions.FD
  };
  attackRatingSpellDefinition = {
    c: "attackRatingSpell",
    xa: priestSpellDefinitions.ED
  };
  defenseRatingSpellDefinition = {
    c: "defenseRatingSpell",
    xa: priestSpellDefinitions.$z
  };
  reviveSpellDefinition = {
    c: "reviveSpell",
    xa: priestSpellDefinitions.xE
  };
  shockSpellDefinition = {
    c: "shockSpell",
    xa: electricSpellDefinitions.sB
  };
  spiderWebSpellDefinition = {
    c: "spiderWebSpell",
    xa: electricSpellDefinitions.CB
  };
  lightningRainSpellDefinition = {
    c: "lightningRainSpell",
    xa: electricSpellDefinitions.XD
  };
  chainedLightningSpellDefinition = {
    c: "chainedLightningSpell",
    xa: electricSpellDefinitions.br
  };
  fireBlastSpellDefinition = {
    c: "fireBlastSpell",
    xa: fireSpellDefinitions.rD
  };
  fireBallSpellDefinition = {
    c: "fireBallSpell",
    xa: fireSpellDefinitions.Kz
  };
  fireRainSpellDefinition = {
    c: "fireRainSpell",
    xa: fireSpellDefinitions.Lz
  };
  turnMonsterSpellDefinition = {
    c: "turnMonsterSpell",
    xa: fireSpellDefinitions.TE
  };
  IDLE_ACTION = 0;
  MELEE_ACTION_TYPE = 3;
  CAST_ACTION_TYPE = 4;
  AttackBehavior.prototype.Oa = function () {};
  AttackBehavior.prototype.dr = function (a) {
    if (!respondToTaunt(this, a) && (a.position.dd || a.Y === IDLE_ACTION)) {
      var b = (this.Al.tileRow + 1) * game.tileSize,
        c = (this.Al.heightInTiles - 1) * game.tileSize;
      setVector(a.position.Qb, (this.Al.tileColumn + 1) * game.tileSize + randomInt((this.Al.widthInTiles - 1) * game.tileSize), b + randomInt(c));
      a.Y = 1;
      a.position.dd = false;
    }
  };
}
