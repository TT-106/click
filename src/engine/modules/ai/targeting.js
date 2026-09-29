/** 职业法术绑定、目标选择与房间寻路。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { barbarianSpellDefinitions, chickenSpellDefinitions, druidSpellDefinitions, electricSpellDefinitions, fighterSpellDefinitions, fireSpellDefinitions, necromancerSpellDefinitions, ninjaSpellDefinitions, priestSpellDefinitions, rogueSpellDefinitions } from "../content/spells.js";
import { getFriendlyTargets, getOpponents } from "../combat/encounters.js";
import { randomInt, setVector } from "../core/math.js";
import { clampPointToRoom, getOppositeDoor } from "../world/rooms.js";
import { docileMonstersModifier } from "../content/balance.js";
import { canAttack, markAttackTurn } from "../characters/character.js";
import { clearMovementTarget } from "../characters/movement.js";
import { HALF_TILE_SIZE, TILE_SIZE } from "../core/screen-layout.js";
/** 房间寻路所需的 game.pathfinder 由组合根注入（与 views.monsters / views.character 同一形状）。
 *  绑的是寻路器容器对象本身：它在 runtime/game.js 的对象字面量里只构造一次
 *  （pathfinder: new function () {}()），src/ 内 `.pathfinder =` 整对象重赋值 0 处，字段级改动不影响
 *  容器身份，所以按引用绑定读到的永远是同一个对象；未绑定就用到会立刻抛——静默回落到别处会让
 *  "装配漏了一步"在差分测试里看不出来。 */
var boundPathfinder = null;
export function bindTargetingPathfinder(pathfinder) {
  boundPathfinder = pathfinder;
}
function targetingPathfinder() {
  if (!boundPathfinder) {
    throw new Error('AI 寻路尚未绑定寻路器：请在组合根调用 bindTargetingPathfinder(game.pathfinder)');
  }
  return boundPathfinder;
}
export var ADVENTURER_TYPE, MONSTER_TYPE, summonDogSpellDefinition, summonWolfPackSpellDefinition, minorHealSpellDefinition, sleepSpellDefinition, summonChickensSpellDefinition, summonGuardChickenSpellDefinition, swiftStrikeSpellDefinition, hurtSpellDefinition, greenDeathSpellDefinition, summonSkeletonArmySpellDefinition, summonPhantomSkullSpellDefinition, tauntSpellDefinition, rageSpellDefinition, sledgeHammerSpellDefinition, stealthSpellDefinition, instantLootSpellDefinition, detectTreasureChestSpellDefinition, healSpellDefinition, armorSpellDefinition, damageSpellDefinition, attackRatingSpellDefinition, defenseRatingSpellDefinition, reviveSpellDefinition, shockSpellDefinition, spiderWebSpellDefinition, lightningRainSpellDefinition, chainedLightningSpellDefinition, fireBlastSpellDefinition, fireBallSpellDefinition, fireRainSpellDefinition, turnMonsterSpellDefinition, IDLE_ACTION, MELEE_ACTION_TYPE, CAST_ACTION_TYPE;
export function hasOpponentsInRoom(character, room) {
  if (!room) {
    return false;
  }
  var opponents = getOpponents(character);
  if (0 === opponents.length) {
    return false;
  }
  var opponentIndex;
  for (opponentIndex = 0; opponentIndex < opponents.length; opponentIndex++) {
    if (character !== opponents[opponentIndex] && opponents[opponentIndex].position.room === room) {
      return true;
    }
  }
  return false;
}
export function findNearestOpponent(character) {
  var opponents = getOpponents(character);
  if (0 === opponents.length) {
    return null;
  }
  var searchRoom = character.position.room;
  if (!searchRoom) {
    return null;
  }
  var candidate,
    opponentIndex,
    characterLevelPosition = character.position.levelPosition,
    nearestOpponent = null,
    l,
    bestDistanceSquared = -1;
  for (opponentIndex = 0; opponentIndex < opponents.length; opponentIndex++) {
    if (!(candidate = opponents[opponentIndex], character === candidate || candidate.isDead || candidate.position.room != searchRoom || (l = candidate.effects, l.isStealthed || candidate.characterType === ADVENTURER_TYPE && l.isDisabled || (l = characterLevelPosition.squaredDistanceTo(candidate.position.levelPosition), !(0 > bestDistanceSquared || l < bestDistanceSquared))))) {
      nearestOpponent = candidate;
      bestDistanceSquared = l;
    }
  }
  return nearestOpponent;
}
export function findNearestVisibleOpponent(character) {
  var searchRoom = character.position.room;
  if (!searchRoom) {
    return null;
  }
  var opponents = getOpponents(character);
  if (0 === opponents.length) {
    return null;
  }
  var candidate,
    opponentIndex,
    characterLevelPosition = character.position.levelPosition,
    nearestOpponent = null,
    l,
    bestDistanceSquared = -1;
  for (opponentIndex = 0; opponentIndex < opponents.length; opponentIndex++) {
    if (!(candidate = opponents[opponentIndex], character === candidate || candidate.isDead || candidate.position.room != searchRoom || (l = candidate.effects, l.isStealthed || l.isDisabled || l.isConverted || (l = characterLevelPosition.squaredDistanceTo(candidate.position.levelPosition), !(0 > bestDistanceSquared || l < bestDistanceSquared))))) {
      nearestOpponent = candidate;
      bestDistanceSquared = l;
    }
  }
  return nearestOpponent;
}
export function selectScrollTarget(character) {
  var visibleOpponent = findNearestVisibleOpponent(character);
  return visibleOpponent ? visibleOpponent : findNearestOpponent(character);
}
export function findChainTarget(sourceCharacter) {
  var friendlyTargets;
  friendlyTargets = getFriendlyTargets(sourceCharacter);
  if (0 === friendlyTargets.length) {
    friendlyTargets = null;
  } else {
    var searchRoom = sourceCharacter.position.room;
    if (searchRoom) {
      var candidate,
        candidateIndex,
        sourcePosition = sourceCharacter.position.levelPosition,
        nearestTarget = null,
        l,
        bestDistanceSquared = -1;
      for (candidateIndex = 0; candidateIndex < friendlyTargets.length; candidateIndex++) {
        if (!(candidate = friendlyTargets[candidateIndex], sourceCharacter === candidate || candidate.isDead || candidate.position.room != searchRoom || (l = candidate.effects, l.isStealthed || l.isDisabled || l.isConverted || (l = sourcePosition.squaredDistanceTo(candidate.position.levelPosition), !(0 > bestDistanceSquared || l < bestDistanceSquared))))) {
          nearestTarget = candidate;
          bestDistanceSquared = l;
        }
      }
      var chainTarget = nearestTarget;
    } else {
      chainTarget = null;
    }
  }
  if (chainTarget) {
    return chainTarget;
  }
  var redrawAttempts = 0;
  var candidatePool = getFriendlyTargets(sourceCharacter);
  if (1 >= candidatePool.length) {
    return null;
  }
  for (var randomCandidate = candidatePool[randomInt(candidatePool.length)]; randomCandidate === sourceCharacter && 6 > redrawAttempts;) {
    randomCandidate = candidatePool[randomInt(candidatePool.length)];
    if (!randomCandidate.position.room) {
      randomCandidate = null;
    }
    redrawAttempts++;
  }
  return randomCandidate === sourceCharacter ? null : randomCandidate;
}
export function findNearbyOpponent(character) {
  var nearestOpponent = findNearestOpponent(character);
  return !nearestOpponent || 100 < character.position.levelPosition.distanceTo(nearestOpponent.position.levelPosition) ? null : nearestOpponent;
}
export function approachValue(maxValue, minValue, distance) {
  return Math.max(minValue, (maxValue - minValue) * (1 - distance / 1E3) + minValue);
}
export function choosePointNearTarget(moveTargetPoint, targetLevelPosition, room) {
  var offsetX = randomInt(HALF_TILE_SIZE);
  if (0.5 > Math.random()) {
    offsetX = -offsetX;
  }
  var offsetY = randomInt(HALF_TILE_SIZE);
  if (0.5 > Math.random()) {
    offsetY = -offsetY;
  }
  setVector(moveTargetPoint, targetLevelPosition.x + offsetX, targetLevelPosition.y + offsetY);
  if (room) {
    clampPointToRoom(room, moveTargetPoint, 0);
  }
}
export function findRouteToDoor(character, targetDoor) {
  var pathfinder = targetingPathfinder();
  if (!targetDoor) {
    return null;
  }
  var d = character.position.room,
    visitedDoors = [];
  if (d) {
    var doorSource = d.doorList,
      doorIndex;
    for (doorIndex = 0; doorIndex < doorSource.length; doorIndex++) {
      if (d = searchDoorRoute(pathfinder, targetDoor, doorSource[doorIndex], visitedDoors, true)) {
        return d;
      }
    }
  } else if (doorSource = character.position.currentHallway, (d = searchDoorRoute(pathfinder, targetDoor, doorSource.doorA, visitedDoors, false)) || (d = searchDoorRoute(pathfinder, targetDoor, doorSource.doorB, visitedDoors, false))) {
    return d;
  }
  return null;
}
export function findRouteToRoom(character, targetRoom) {
  var pathfinder = targetingPathfinder();
  if (!targetRoom) {
    return null;
  }
  var d = character.position.room,
    visitedDoors = [];
  if (d === targetRoom) {
    return null;
  }
  if (d) {
    var doorSource = d.doorList,
      doorIndex;
    for (doorIndex = 0; doorIndex < doorSource.length; doorIndex++) {
      if (d = searchRoomRoute(pathfinder, targetRoom, doorSource[doorIndex], visitedDoors, true)) {
        return d;
      }
    }
  } else if (doorSource = character.position.currentHallway, (d = searchRoomRoute(pathfinder, targetRoom, doorSource.doorA, visitedDoors, false)) || (d = searchRoomRoute(pathfinder, targetRoom, doorSource.doorB, visitedDoors, false))) {
    return d;
  }
  return null;
}
export function searchDoorRoute(pathfinder, targetDoor, currentDoor, visitedDoors, f) {
  var g;
  if (currentDoor === targetDoor) {
    return g = [], g.push(currentDoor), g;
  }
  if (!currentDoor.isOpen) {
    return null;
  }
  if (-1 < visitedDoors.indexOf(currentDoor)) {
    return console.log("reached a door that we already checked."), null;
  }
  visitedDoors.push(currentDoor);
  if (f) {
    if (f = getOppositeDoor(currentDoor.hallway, currentDoor), g = searchDoorRoute(pathfinder, targetDoor, f, visitedDoors, false)) {
      return g.unshift(currentDoor), g;
    }
  } else {
    var leadsToRoom = currentDoor.leadsTo;
    f = leadsToRoom.doorList;
    if (!leadsToRoom.discovered) {
      return null;
    }
    for (var doorIndex = 0; doorIndex < f.length; doorIndex++) {
      if (g = f[doorIndex], g !== currentDoor && (g = searchDoorRoute(pathfinder, targetDoor, g, visitedDoors, true))) {
        return g.unshift(currentDoor), g;
      }
    }
  }
  return null;
}
export function searchRoomRoute(pathfinder, targetRoom, currentDoor, visitedDoors, f) {
  var g;
  if (currentDoor.leadsTo === targetRoom) {
    return g = [], g.push(currentDoor), g;
  }
  if (!currentDoor.isOpen) {
    return null;
  }
  if (-1 < visitedDoors.indexOf(currentDoor)) {
    return console.log("reached a door that we already checked [path to room]."), null;
  }
  visitedDoors.push(currentDoor);
  if (f) {
    if (f = getOppositeDoor(currentDoor.hallway, currentDoor), g = searchRoomRoute(pathfinder, targetRoom, f, visitedDoors, false)) {
      return g.unshift(currentDoor), g;
    }
  } else {
    var leadsToRoom = currentDoor.leadsTo;
    f = leadsToRoom.doorList;
    if (!leadsToRoom.discovered) {
      return null;
    }
    for (var doorIndex = 0; doorIndex < f.length; doorIndex++) {
      if (g = f[doorIndex], g !== currentDoor && (g = searchRoomRoute(pathfinder, targetRoom, g, visitedDoors, true))) {
        return g.unshift(currentDoor), g;
      }
    }
  }
  return null;
}
export function AttackBehavior(patrolRoom, actionRange) {
  this.patrolRoom = patrolRoom;
  this.actionRange = actionRange;
}
export function respondToTaunt(attackBehavior, character) {
  if (docileMonstersModifier.currentValue) {
    return false;
  }
  var c = character.combatTarget;
  if (c && c.isDead) {
    c = null;
    character.setCombatTarget(null);
  }
  if (c && c.effects.isStunned) {
    c = null;
    character.setCombatTarget(null);
  }
  if (c && c.effects.isStealthed) {
    c = null;
    character.setCombatTarget(null);
  }
  if (c && c.effects.hasStealthEffect) {
    return attackTauntingTarget(attackBehavior, character), true;
  }
  for (var opponents = getOpponents(character), candidate, characterLevelPosition = character.position.levelPosition, h, nearestTauntingOpponent = null, bestDistanceSquared = -1, c = /** @type {any} */ (0); c < opponents.length; c++) {
    if (candidate = opponents[c], character !== candidate && (h = candidate.effects, h.hasStealthEffect && !h.isDisabled && (h = characterLevelPosition.squaredDistanceTo(candidate.position.levelPosition), 0 > bestDistanceSquared || h < bestDistanceSquared))) {
      nearestTauntingOpponent = candidate;
      bestDistanceSquared = h;
    }
  }
  return (c = nearestTauntingOpponent) || (c = findNearbyOpponent(character)) ? (character.setCombatTarget(c), attackTauntingTarget(attackBehavior, character), true) : false;
}
export function attackTauntingTarget(attackBehavior, character) {
  var targetPosition = character.combatTarget.position,
    characterPosition = character.position;
  if (targetPosition.room === characterPosition.room) {
    if (characterPosition.levelPosition.distanceTo(targetPosition.levelPosition) <= attackBehavior.actionRange) {
      if (!canAttack(character)) {
        return;
      }
      markAttackTurn(character);
      character.actionType = 2;
    } else {
      choosePointNearTarget(characterPosition.moveTargetPoint, targetPosition.levelPosition, character.position.room);
      character.actionType = 1;
    }
    clearMovementTarget(characterPosition);
  }
}
export function initializeAiTargeting() {
  ADVENTURER_TYPE = 0;
  MONSTER_TYPE = 2;
  summonDogSpellDefinition = {
    id: "summonDogSpell",
    spellDefinition: druidSpellDefinitions.dogGuardianSpell
  };
  summonWolfPackSpellDefinition = {
    id: "summonWolfPackSpell",
    spellDefinition: druidSpellDefinitions.wolfPackSpell
  };
  minorHealSpellDefinition = {
    id: "minorHealSpell",
    spellDefinition: druidSpellDefinitions.lesserHealSpell
  };
  sleepSpellDefinition = {
    id: "sleepSpell",
    spellDefinition: druidSpellDefinitions.sleepSpell
  };
  summonChickensSpellDefinition = {
    id: "summonChickensSpell",
    spellDefinition: chickenSpellDefinitions.summonChickensSpell
  };
  summonGuardChickenSpellDefinition = {
    id: "summonGuardChickenSpell",
    spellDefinition: chickenSpellDefinitions.chickenGuardianSpell
  };
  swiftStrikeSpellDefinition = {
    id: "swiftStrikeSpell",
    spellDefinition: ninjaSpellDefinitions.quickStrikeSpell
  };
  hurtSpellDefinition = {
    id: "hurtSpell",
    spellDefinition: necromancerSpellDefinitions.agonySpell
  };
  greenDeathSpellDefinition = {
    id: "greenDeathSpell",
    spellDefinition: necromancerSpellDefinitions.greenDeathSpell
  };
  summonSkeletonArmySpellDefinition = {
    id: "summonSkeletonArmySpell",
    spellDefinition: necromancerSpellDefinitions.skeletonArmySpell
  };
  summonPhantomSkullSpellDefinition = {
    id: "summonPhantomSkullSpell",
    spellDefinition: necromancerSpellDefinitions.ghostSkeletonSpell
  };
  tauntSpellDefinition = {
    id: "tauntSpell",
    spellDefinition: fighterSpellDefinitions.tauntSpell
  };
  rageSpellDefinition = {
    id: "rageSpell",
    spellDefinition: barbarianSpellDefinitions.rageSpell
  };
  sledgeHammerSpellDefinition = {
    id: "sledgeHammerSpell",
    spellDefinition: barbarianSpellDefinitions.hammerSpell
  };
  stealthSpellDefinition = {
    id: "stealthSpell",
    spellDefinition: rogueSpellDefinitions.stealthSpell
  };
  instantLootSpellDefinition = {
    id: "instantLootSpell",
    spellDefinition: rogueSpellDefinitions.instantSearchSpell
  };
  detectTreasureChestSpellDefinition = {
    id: "detectTreasureChestSpell",
    spellDefinition: rogueSpellDefinitions.findTreasureSpell
  };
  healSpellDefinition = {
    id: "healSpell",
    spellDefinition: priestSpellDefinitions.healSpell
  };
  armorSpellDefinition = {
    id: "armorSpell",
    spellDefinition: priestSpellDefinitions.buffArmorSpell
  };
  damageSpellDefinition = {
    id: "damageSpell",
    spellDefinition: priestSpellDefinitions.buffDamageSpell
  };
  attackRatingSpellDefinition = {
    id: "attackRatingSpell",
    spellDefinition: priestSpellDefinitions.buffAttackRatingSpell
  };
  defenseRatingSpellDefinition = {
    id: "defenseRatingSpell",
    spellDefinition: priestSpellDefinitions.buffDefenceRatingSpell
  };
  reviveSpellDefinition = {
    id: "reviveSpell",
    spellDefinition: priestSpellDefinitions.resurrectSpell
  };
  shockSpellDefinition = {
    id: "shockSpell",
    spellDefinition: electricSpellDefinitions.shockSpell
  };
  spiderWebSpellDefinition = {
    id: "spiderWebSpell",
    spellDefinition: electricSpellDefinitions.spiderWebSpell
  };
  lightningRainSpellDefinition = {
    id: "lightningRainSpell",
    spellDefinition: electricSpellDefinitions.lightningRainSpell
  };
  chainedLightningSpellDefinition = {
    id: "chainedLightningSpell",
    spellDefinition: electricSpellDefinitions.chainLightningSpell
  };
  fireBlastSpellDefinition = {
    id: "fireBlastSpell",
    spellDefinition: fireSpellDefinitions.fireRingSpell
  };
  fireBallSpellDefinition = {
    id: "fireBallSpell",
    spellDefinition: fireSpellDefinitions.fireBallSpell
  };
  fireRainSpellDefinition = {
    id: "fireRainSpell",
    spellDefinition: fireSpellDefinitions.fireRainSpell
  };
  turnMonsterSpellDefinition = {
    id: "turnMonsterSpell",
    spellDefinition: fireSpellDefinitions.transformMonsterSpell
  };
  IDLE_ACTION = 0;
  MELEE_ACTION_TYPE = 3;
  CAST_ACTION_TYPE = 4;
  AttackBehavior.prototype.notifySpellLearned = function () {};
  AttackBehavior.prototype.updateBehaviors = function (character) {
    if (!respondToTaunt(this, character) && (character.position.movementTargetCleared || character.actionType === IDLE_ACTION)) {
      var wanderMinY = (this.patrolRoom.tileRow + 1) * TILE_SIZE,
        wanderSpanY = (this.patrolRoom.heightInTiles - 1) * TILE_SIZE;
      setVector(character.position.moveTargetPoint, (this.patrolRoom.tileColumn + 1) * TILE_SIZE + randomInt((this.patrolRoom.widthInTiles - 1) * TILE_SIZE), wanderMinY + randomInt(wanderSpanY));
      character.actionType = 1;
      character.position.movementTargetCleared = false;
    }
  };
}
