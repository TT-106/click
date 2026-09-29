/** 冒险者行为优先级、移动、拾取和施法策略。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { clearMovementTarget, setWorldDestination } from "../characters/movement.js";
import { CAST_ACTION_TYPE, IDLE_ACTION, MELEE_ACTION_TYPE, approachValue, choosePointNearTarget, findNearbyOpponent, findNearestVisibleOpponent, findRouteToDoor, findRouteToRoom, hasOpponentsInRoom, selectScrollTarget } from "./targeting.js";
import { getAllies, getFriendlyTargets, getOpponents } from "../combat/encounters.js";
import { clampPointToRoom, isPointNearDoor, roomBottomPixels, roomLeftPixels, roomRightPixels, roomTopPixels } from "../world/rooms.js";
import { Vector2, addVector, assignVector, distanceSquaredToPoint, distanceToPoint, multiplyVector, normalizeVector, randomInt, setVector, subtractVector } from "../core/math.js";
import { canAttack, countSummonedMinions, isAdventurerOrMinion, markAttackTurn } from "../characters/character.js";
import { forcePartyDestination, isPartyTravelling } from "../characters/party.js";
import { freeSpellsModifier } from "../content/balance.js";
import { getSpellSpiritCost, statValue } from "../characters/stats.js";
import { MELEE_ATTACK_RANGE, RANGED_ATTACK_RANGE, RANGED_MIN_DISTANCE } from "../content/classes.js";
import { showFloatingText } from "../rendering/floating-text.js";
import { isSpellReady } from "../combat/scrolls.js";
import { getRoomTreasure } from "../loot/treasure.js";
/** @typedef {{ getPriority: () => number }} PrioritizedBehavior */
/** @typedef {{ repositionInsideRoom: (character: unknown) => unknown }} MovingBehavior */
/** @typedef {{ performOnArrival: (character: unknown) => void, canExecute: (character: unknown) => boolean, selectTarget: (character: unknown) => any, getActionTarget: () => any, getFinalScore: (character: unknown) => number }} DungeonBehaviorMethods */
/** @typedef {{ resetBehaviorState: () => void, execute: (character: unknown) => void, getBehaviorScore: (character: unknown) => number, getPriority: () => number }} RangedBehaviorMethods */
export function BehaviorQueue() {
  this.behaviorList = [];
}
export function IdleBehavior(priorityWeight) {
  this.priorityWeight = priorityWeight;
  this.lastWanderRoom = null;
}
export function ExploreDungeonBehavior() {
  this.priorityWeight = 10;
  this.selectedTarget = null;
  this.targetDistance = 0;
  this.actionTarget = null;
  this.actionRange = 100;
  this.canActWithoutAttack = false;
}
export function FollowLeaderBehavior() {
  this.priorityWeight = 100;
  this.threatDistance = RANGED_MIN_DISTANCE;
  this.fleeHealthRatio = 0.8;
  this.threatTarget = null;
}
export function RangedAttackBehavior(engagementDistance, actionRange, priorityWeight) {
  this.priorityWeight = priorityWeight;
  this.targetCharacter = null;
  this.engagementDistance = engagementDistance;
  this.actionRange = actionRange;
  this.fleeDirection = new Vector2();
  this.kiteVector = new Vector2();
  this.consecutiveAttackTurns = this.lastAttackTurn = 0;
}
export function MeleeAttackBehavior(actionRange, priorityWeight, behaviorActionType, preferNearbyOpponent) {
  this.priorityWeight = priorityWeight;
  this.targetCharacter = null;
  this.targetDistance = 0;
  this.actionRange = actionRange;
  this.behaviorActionType = behaviorActionType;
  this.preferNearbyOpponent = preferNearbyOpponent;
}
export function LootGoldBehavior(priorityWeight) {
  this.learnedSpell = null;
  this.priorityWeight = priorityWeight;
  this.actionRange = 10;
}
export function OpportunisticAttackBehavior(priorityWeight) {
  this.priorityWeight = priorityWeight;
  this.targetCharacter = null;
  this.targetDistance = 0;
  this.actionRange = RANGED_ATTACK_RANGE;
  this.behaviorActionType = MELEE_ACTION_TYPE;
}
export function LootItemBehavior(priorityWeight) {
  this.learnedSpell = null;
  this.priorityWeight = priorityWeight;
  this.actionRange = 10;
}
export function LootScrollBehavior(priorityWeight) {
  this.learnedSpell = null;
  this.priorityWeight = priorityWeight;
  this.actionRange = 10;
}
export function GuardRangedBehavior(engagementDistance, actionRange, priorityWeight) {
  this.delegateBehavior = new RangedAttackBehavior(engagementDistance, actionRange, priorityWeight);
}
export function TargetSpellBehavior(actionRange, priorityWeight) {
  this.priorityWeight = priorityWeight;
  this.targetCharacter = this.learnedSpell = null;
  this.targetDistance = 0;
  this.actionRange = actionRange;
}
export function HealBehavior(actionRange, priorityWeight) {
  this.learnedSpell = null;
  this.priorityWeight = priorityWeight;
  this.actionRange = actionRange;
}
export function ApplyEffectBehavior(actionRange, priorityWeight, statusEffectTypeId) {
  this.learnedSpell = null;
  this.statusEffectTypeId = statusEffectTypeId;
  this.priorityWeight = priorityWeight;
  this.actionRange = actionRange;
}
export function AreaDamageBehavior(actionRange, priorityWeight) {
  this.learnedSpell = null;
  this.priorityWeight = priorityWeight;
  this.actionRange = actionRange;
}
export function ChainDamageBehavior(actionRange, priorityWeight) {
  this.learnedSpell = null;
  this.priorityWeight = priorityWeight;
  this.actionRange = actionRange;
}
export function SummonBehavior(actionRange, priorityWeight, expectedSpellCategoryId) {
  this.spell = null;
  this.expectedSpellCategoryId = expectedSpellCategoryId;
  this.priorityWeight = priorityWeight;
  this.actionRange = actionRange;
}
export function LifeDrainBehavior(actionRange, priorityWeight) {
  this.priorityWeight = priorityWeight;
  this.actionRange = actionRange;
  this.learnedSpell = null;
}
export function ReviveBehavior(actionRange, priorityWeight) {
  this.priorityWeight = priorityWeight;
  this.actionRange = actionRange;
  this.learnedSpell = null;
}
export function PartyBuffBehavior(actionRange, priorityWeight, statusEffectTypeId) {
  this.priorityWeight = statusEffectTypeId;
  this.actionRange = actionRange;
  this.statusEffectTypeId = priorityWeight;
  this.spell = null;
}
export function WaitBehavior() {
  this.priorityWeight = 2;
}
export function hasForcedDestination(character) {
  var forcedRoom;
  return (forcedRoom = game.state.party.forcedDestinationRoom) ? character.position.destinationRoom === forcedRoom ? false : true : false;
}
export function LootChestBehavior(priorityWeight) {
  this.learnedSpell = null;
  this.priorityWeight = priorityWeight;
  this.canActWithoutAttack = true;
  this.actionRange = 10;
}
export function hasPendingLoot() {
  return 0 < game.goldDrops.drops.length || 0 < game.itemDrops.drops.length || 0 < game.scrollDrops.drops.length;
}
export function LootPotionBehavior(priorityWeight) {
  this.learnedSpell = null;
  this.priorityWeight = priorityWeight;
  this.canActWithoutAttack = true;
  this.actionRange = 10;
}
export function UseShopBehavior(priorityWeight, minPriorityValue) {
  this.pickupRadius = game.tileSize + 5;
  this.priorityWeight = priorityWeight;
  this.minPriorityValue = minPriorityValue;
  this.goldDrop = null;
  this.cachedDropDistance = 0;
}
export function EnterDungeonBehavior(priorityWeight, minPriorityValue) {
  this.pickupRadius = game.tileSize + 5;
  this.priorityWeight = priorityWeight;
  this.minPriorityValue = minPriorityValue;
  this.scrollDrop = null;
  this.cachedDropDistance = 0;
}
export function EnterCastleBehavior(priorityWeight, minPriorityValue) {
  this.pickupRadius = game.tileSize + 5;
  this.priorityWeight = priorityWeight;
  this.minPriorityValue = minPriorityValue;
  this.potionDrop = null;
  this.cachedDropDistance = 0;
}
export function TravelWorldBehavior(priorityWeight, minPriorityValue) {
  this.pickupRadius = game.tileSize + 5;
  this.priorityWeight = priorityWeight;
  this.minPriorityValue = minPriorityValue;
  this.itemDrop = null;
  this.cachedDropDistance = 0;
}
export function ChangeFloorBehavior() {
  this.pickupRadius = game.tileSize + 1;
  this.priorityWeight = 90;
  this.treasureChest = null;
}
export function SelfSpellBehavior(priorityWeight) {
  this.spell = null;
  this.priorityWeight = priorityWeight;
  this.actionRange = 10;
}
export function AreaSpellBehavior(actionRange, priorityWeight, expectedSpellCategoryId) {
  this.spell = null;
  this.expectedSpellCategoryId = expectedSpellCategoryId;
  this.priorityWeight = priorityWeight;
  this.actionRange = actionRange;
}
export function CompanionSpellBehavior(actionRange, priorityWeight) {
  this.spell = null;
  this.priorityWeight = priorityWeight;
  this.actionRange = actionRange;
}
export function CooldownBehavior(leashDistance, priorityWeight) {
  this.priorityWeight = priorityWeight;
  this.leashDistance = leashDistance;
}
export function SpecialAttackBehavior(actionRange, maxEngageDistance, priorityWeight, behaviorActionType) {
  this.priorityWeight = priorityWeight;
  this.targetCharacter = null;
  this.targetDistance = 0;
  this.actionRange = actionRange;
  this.maxEngageDistance = maxEngageDistance;
  this.behaviorActionType = behaviorActionType;
}
export function StunnedBehavior(priorityWeight) {
  this.priorityWeight = priorityWeight;
}
export function initializeAiBehaviors() {
  BehaviorQueue.prototype.updateBehaviors = function (character) {
    if (game.worldActive) {
      (/** @type {BehaviorQueue & { updateWorldMode: (character: unknown) => void }} */ (/** @type {unknown} */ (this))).updateWorldMode(character);
    } else {
      (/** @type {BehaviorQueue & { updateDungeonMode: (character: unknown) => void }} */ (/** @type {unknown} */ (this))).updateDungeonMode(character);
    }
  };
  BehaviorQueue.prototype.updateWorldMode = function (character) {
    var party = game.state.party;
    var targetShop = party.targetShop;
    var activeCastle = party.activeCastle,
      targetDungeon = party.targetDungeon;
    if (targetShop || targetDungeon || activeCastle) {
      if (character === game.state.leader) {
        var targetColumn, targetRow, targetTile;
        if (targetShop) {
          targetColumn = targetShop.worldColumn;
          targetRow = targetShop.worldRow;
          targetTile = game.world.getTileAtPixel(targetColumn, targetRow);
          if (targetTile) {
            var position = character.position;
            if (game.world.getTileAtPixel(game.world.pixelToTileColumn(position.getWorldPositionX()), game.world.pixelToTileRow(position.getWorldPositionY())) === targetTile) {
              character.actionType = 10;
            } else {
              setWorldDestination(position, targetTile.getWorldColumn(), targetTile.getWorldRow());
              character.actionType = 1;
            }
            return;
          }
        } else if (activeCastle) {
          targetColumn = activeCastle.worldPixelX;
          targetRow = activeCastle.worldPixelY;
          targetTile = game.world.getTileAtPixel(targetColumn, targetRow);
          if (targetTile) {
            position = character.position;
            if (game.world.getTileAtPixel(game.world.pixelToTileColumn(position.getWorldPositionX()), game.world.pixelToTileRow(position.getWorldPositionY())) === targetTile) {
              character.actionType = 11;
            } else {
              setWorldDestination(position, targetTile.getWorldColumn(), targetTile.getWorldRow());
              character.actionType = 1;
            }
            return;
          }
        } else {
          targetColumn = targetDungeon.getWorldColumn();
          targetRow = targetDungeon.getWorldRow();
          targetTile = game.world.getTileAtPixel(targetColumn, targetRow);
          if (targetTile) {
            position = character.position;
            if (game.world.getTileAtPixel(game.world.pixelToTileColumn(position.getWorldPositionX()), game.world.pixelToTileRow(position.getWorldPositionY())) === targetTile) {
              character.actionType = 9;
            } else {
              setWorldDestination(position, targetTile.getWorldColumn(), targetTile.getWorldRow());
              character.actionType = 1;
            }
            return;
          }
        }
        position = character.position;
        if (position.movementTargetCleared || character.actionType === IDLE_ACTION) {
          setWorldDestination(position, targetColumn, targetRow);
          character.actionType = 1;
          position.movementTargetCleared = false;
        }
      } else {
        var allies = getAllies();
        var allyIndex = allies.indexOf(character);
        var followTarget = 1 === character.characterType ? character.summoner : 0 > allyIndex ? game.state.leader : allies[allyIndex - 1];
        setWorldDestination(character.position, game.world.pixelToTileColumn(followTarget.position.getWorldPositionX()), game.world.pixelToTileRow(followTarget.position.getWorldPositionY()));
        character.actionType = 1;
      }
    } else {
      character.actionType = IDLE_ACTION;
    }
  };
  BehaviorQueue.prototype.updateDungeonMode = function (character) {
    character.actionType = IDLE_ACTION;
    character.targetGoldDrop = null;
    character.combatTarget = null;
    character.targetItemDrop = null;
    character.targetTreasureChest = null;
    character.spellToCast = null;
    character.targetScrollDrop = null;
    character.targetPotionDrop = null;
    var behaviorIndex,
      bestScore = 0,
      behavior,
      bestBehavior = null,
      behaviorScore;
    for (behaviorIndex = 0; behaviorIndex < this.behaviorList.length && !(behavior = this.behaviorList[behaviorIndex], behavior.getPriority() > bestScore && (behaviorScore = behavior.getBehaviorScore(character), behaviorScore > bestScore && (bestScore = behaviorScore, bestBehavior = behavior), 100 <= bestScore)); behaviorIndex++) {}
    if (bestBehavior) {
      bestBehavior.execute(character);
    }
  };
  BehaviorQueue.prototype.notifySpellLearned = function (spellDefinition) {
    var behaviorIndex;
    for (behaviorIndex = 0; behaviorIndex < this.behaviorList.length; behaviorIndex++) {
      this.behaviorList[behaviorIndex].notifySpellLearned(spellDefinition);
    }
  };
  IdleBehavior.prototype.resetBehaviorState = function () {};
  IdleBehavior.prototype.notifySpellLearned = function () {};
  IdleBehavior.prototype.execute = function (character) {
    var position = character.position,
      room = position.room;
    if (room) {
      if (position.movementTargetCleared || this.lastWanderRoom != room) {
        this.lastWanderRoom = room;
        var wanderMinY = roomTopPixels(room) + game.tileSize,
          wanderSpanY = (room.heightInTiles - 1) * game.tileSize;
        setVector(position.moveTargetPoint, roomLeftPixels(room) + game.tileSize + randomInt((room.widthInTiles - 1) * game.tileSize), wanderMinY + randomInt(wanderSpanY));
        position.movementTargetCleared = false;
      }
      character.actionType = 1;
    }
  };
  IdleBehavior.prototype.getBehaviorScore = function (character) {
    return character.position.room ? this.priorityWeight : 0;
  };
  IdleBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  ExploreDungeonBehavior.prototype.resetBehaviorState = function () {
    this.selectedTarget = this.actionTarget = null;
  };
  ExploreDungeonBehavior.prototype.notifySpellLearned = function () {};
  ExploreDungeonBehavior.prototype.execute = function (character) {
    if (this.selectedTarget && this.actionTarget) {
      character.setCombatTarget(this.selectedTarget);
      var position = character.position;
      this.targetDistance = character === this.selectedTarget ? 0 : position.levelPosition.distanceTo(this.selectedTarget.position.levelPosition);
      if (this.targetDistance <= this.actionRange) {
        if (!this.canActWithoutAttack && !canAttack(character)) {
          return;
        }
        markAttackTurn(character);
        this.actionTarget.lastCastTurn = game.state.turnNumber;
        character.spellToCast = this.actionTarget;
        character.actionType = CAST_ACTION_TYPE;
        (/** @type {DungeonBehaviorMethods} */ (/** @type {unknown} */ (this))).performOnArrival(character);
      } else {
        assignVector(position.moveTargetPoint, this.selectedTarget.position.levelPosition);
        character.actionType = 1;
      }
      clearMovementTarget(position);
      var room = position.room;
      if (room && isAdventurerOrMinion(character)) {
        forcePartyDestination(room);
      }
    }
  };
  ExploreDungeonBehavior.prototype.performOnArrival = function () {};
  ExploreDungeonBehavior.prototype.getBehaviorScore = function (character) {
    var room = character.position.room;
    if (!room || !(/** @type {DungeonBehaviorMethods} */ (/** @type {unknown} */ (this))).canExecute(character)) {
      return 0;
    }
    if (!freeSpellsModifier.currentValue) {
      var stats = character.stats,
        spirit = stats.spirit,
        spellCost = getSpellSpiritCost(stats);
      if (spirit < spellCost) {
        return 0;
      }
    }
    this.selectedTarget = (/** @type {DungeonBehaviorMethods} */ (/** @type {unknown} */ (this))).selectTarget(character);
    return this.selectedTarget && this.selectedTarget.position.room === room ? (this.actionTarget = (/** @type {DungeonBehaviorMethods} */ (/** @type {unknown} */ (this))).getActionTarget()) ? (/** @type {DungeonBehaviorMethods} */ (/** @type {unknown} */ (this))).getFinalScore(character) : 0 : 0;
  };
  ExploreDungeonBehavior.prototype.canExecute = function () {
    return true;
  };
  ExploreDungeonBehavior.prototype.getFinalScore = function () {
    return 0;
  };
  ExploreDungeonBehavior.prototype.getActionTarget = function () {
    return null;
  };
  ExploreDungeonBehavior.prototype.selectTarget = function () {
    return null;
  };
  ExploreDungeonBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  FollowLeaderBehavior.prototype.resetBehaviorState = function () {};
  FollowLeaderBehavior.prototype.notifySpellLearned = function () {};
  FollowLeaderBehavior.prototype.execute = function (character) {
    if (this.threatTarget) {
      var room = character.position.room;
      if (character.position.movementTargetCleared) {
        if (!room) {
          return;
        }
        (/** @type {MovingBehavior} */ (/** @type {unknown} */ (this))).repositionInsideRoom(character);
      }
      if (room && isAdventurerOrMinion(character)) {
        forcePartyDestination(room);
      }
      character.actionType = 1;
      character.position.movementTargetCleared = false;
      if (0 === game.state.turnNumber % 2) {
        showFloatingText(game.floatingText, character, "快逃!", "yellow");
      }
    }
  };
  FollowLeaderBehavior.prototype.repositionInsideRoom = function (character) {
    var cornerIndex = randomInt(3);
    var position = character.position;
    var room = position.room,
      roomLeft = roomLeftPixels(room),
      roomTop = roomTopPixels(room),
      roomRight = roomRightPixels(room),
      roomBottom = roomBottomPixels(room);
    if (0 === cornerIndex) {
      setVector(position.moveTargetPoint, roomLeft + 1, roomTop + 1);
    } else {
      if (1 === cornerIndex) {
        setVector(position.moveTargetPoint, roomRight - 1, roomTop + 1);
      } else {
        if (2 === cornerIndex) {
          setVector(position.moveTargetPoint, roomLeft + 1, roomBottom - 1);
        } else {
          setVector(position.moveTargetPoint, roomRight - 1, roomBottom - 1);
        }
      }
    }
  };
  FollowLeaderBehavior.prototype.getBehaviorScore = function (character) {
    var healthRatio = character.stats.health / statValue(character.stats.maxHealth);
    if (healthRatio > this.fleeHealthRatio) {
      return 0;
    }
    var threat;
    threatSearch: {
      threat = getOpponents(character);
      var candidate, opponentIndex;
      for (opponentIndex = 0; opponentIndex < threat.length; opponentIndex++) {
        if (candidate = threat[opponentIndex], character !== candidate && candidate.combatTarget === character) {
          threat = candidate;
          break threatSearch;
        }
      }
      threat = null;
    }
    this.threatTarget = threat;
    return !this.threatTarget || character.position.levelPosition.distanceTo(this.threatTarget.position.levelPosition) > this.threatDistance ? 0 : (1 - healthRatio) * this.priorityWeight;
  };
  FollowLeaderBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  RangedAttackBehavior.prototype.resetBehaviorState = function () {
    this.consecutiveAttackTurns = this.lastAttackTurn = 0;
    this.targetCharacter = null;
  };
  RangedAttackBehavior.prototype.notifySpellLearned = function () {};
  RangedAttackBehavior.prototype.execute = function (character) {
    if (this.lastAttackTurn == game.state.turnNumber - 1) {
      this.consecutiveAttackTurns++;
    } else {
      this.consecutiveAttackTurns = 0;
    }
    if (this.targetCharacter && !(this.targetCharacter.isDead || this.targetCharacter.effects.isDisabled || this.targetCharacter.effects.isConverted) && (/** @type {MovingBehavior} */ (/** @type {unknown} */ (this))).repositionInsideRoom(character)) {
      this.lastAttackTurn = game.state.turnNumber;
      var room = character.position.room;
      if (room && isAdventurerOrMinion(character)) {
        forcePartyDestination(room);
      }
      character.actionType = 1;
      character.position.movementTargetCleared = false;
    }
  };
  RangedAttackBehavior.prototype.repositionInsideRoom = function (character) {
    var position = character.position,
      characterLevelPosition = position.levelPosition,
      room = position.room,
      roomLeft = roomLeftPixels(room),
      roomTop = roomTopPixels(room),
      roomRight = roomRightPixels(room),
      roomBottom = roomBottomPixels(room);
    var opponents = getOpponents(character);
    var opponent,
      opponentPosition,
      opponentIndex,
      distance,
      nearbyCount = 0;
    setVector(this.fleeDirection, 0, 0);
    setVector(this.kiteVector, 0, 0);
    for (opponentIndex = 0; opponentIndex < opponents.length; opponentIndex++) {
      opponent = opponents[opponentIndex];
      if (!(opponent.isDead || opponent.effects.isDisabled || opponent.effects.isConverted || opponent.position.room != room)) {
        opponentPosition = opponent.position.levelPosition;
        distance = characterLevelPosition.distanceTo(opponentPosition);
        if (!(distance > this.engagementDistance)) {
          if (0 === distance) {
            setVector(this.fleeDirection, Math.random(), Math.random());
          } else {
            assignVector(this.fleeDirection, characterLevelPosition);
            subtractVector(this.fleeDirection, opponentPosition);
            multiplyVector(this.fleeDirection, 1 / distance);
          }
          addVector(this.kiteVector, this.fleeDirection);
          nearbyCount++;
        }
      }
    }
    if (0 === nearbyCount) {
      return false;
    }
    normalizeVector(this.kiteVector);
    multiplyVector(this.kiteVector, this.actionRange);
    addVector(this.kiteVector, characterLevelPosition);
    var clampedX = this.kiteVector.x;
    var clampedY = this.kiteVector.y;
    if (clampedX < roomLeft) {
      clampedX = roomLeft;
    } else {
      if (clampedX > roomRight) {
        clampedX = roomRight;
      }
    }
    if (clampedY < roomTop) {
      clampedY = roomTop;
    } else {
      if (clampedY > roomBottom) {
        clampedY = roomBottom;
      }
    }
    setVector(position.moveTargetPoint, clampedX, clampedY);
    return true;
  };
  RangedAttackBehavior.prototype.getBehaviorScore = function (character) {
    this.targetCharacter = findNearestVisibleOpponent(character);
    return this.targetCharacter ? 2 < this.consecutiveAttackTurns ? this.consecutiveAttackTurns = 0 : character.position.levelPosition.distanceTo(this.targetCharacter.position.levelPosition) > this.engagementDistance ? 0 : this.priorityWeight : 0;
  };
  RangedAttackBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  MeleeAttackBehavior.prototype.resetBehaviorState = function () {};
  MeleeAttackBehavior.prototype.notifySpellLearned = function () {};
  MeleeAttackBehavior.prototype.execute = function (character) {
    if (this.targetCharacter && !this.targetCharacter.isDead) {
      character.setCombatTarget(this.targetCharacter);
      if (this.targetDistance <= this.actionRange) {
        if (!canAttack(character)) {
          return;
        }
        markAttackTurn(character);
        character.actionType = this.behaviorActionType;
      } else {
        choosePointNearTarget(character.position.moveTargetPoint, this.targetCharacter.position.levelPosition, character.position.room);
        character.actionType = 1;
      }
      var room = character.position.room;
      if (room && isAdventurerOrMinion(character)) {
        forcePartyDestination(room);
      }
      clearMovementTarget(character.position);
    }
  };
  MeleeAttackBehavior.prototype.getBehaviorScore = function (character) {
    if (!character.position.room) {
      return 0;
    }
    this.targetCharacter = this.preferNearbyOpponent ? findNearbyOpponent(character) : selectScrollTarget(character);
    if (!this.targetCharacter) {
      return 0;
    }
    this.targetDistance = character.position.levelPosition.distanceTo(this.targetCharacter.position.levelPosition);
    return this.priorityWeight;
  };
  MeleeAttackBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  LootGoldBehavior.prototype = new ExploreDungeonBehavior();
  LootGoldBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LootGoldBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 10 !== spellDefinition.statusEffectTypeId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  LootGoldBehavior.prototype.performOnArrival = function (character) {
    var taunt;
    switch (randomInt(8)) {
      case 0:
        taunt = "嘿,傻兮兮的头!";
        break;
      case 1:
        taunt = "榆木脑袋!";
        break;
      case 2:
        taunt = "哟!屌丝!";
        break;
      case 3:
        taunt = "愚蠢的怪物!";
        break;
      case 4:
        taunt = "你弱爆了!";
        break;
      case 5:
        taunt = "屌丝!";
        break;
      case 6:
        taunt = "胆小鬼!";
        break;
      default:
        taunt = "嘿,蠢货!";
    }
    showFloatingText(game.floatingText, character, taunt, "white");
  };
  LootGoldBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  LootGoldBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  LootGoldBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  LootGoldBehavior.prototype.selectTarget = function (character) {
    if (character.effects.hasStealthEffect || !hasOpponentsInRoom(character, character.position.room)) {
      return null;
    }
    var stats = character.stats;
    return 0.8 > stats.health / statValue(stats.maxHealth) ? null : character;
  };
  OpportunisticAttackBehavior.prototype.resetBehaviorState = function () {
    this.targetCharacter = null;
    this.targetDistance = 0;
  };
  OpportunisticAttackBehavior.prototype.notifySpellLearned = function () {};
  OpportunisticAttackBehavior.prototype.execute = function (character) {
    if (this.targetCharacter && !this.targetCharacter.isDead) {
      character.setCombatTarget(this.targetCharacter);
      if (this.targetDistance <= this.actionRange) {
        if (!canAttack(character)) {
          return;
        }
        markAttackTurn(character);
        character.actionType = this.behaviorActionType;
      } else {
        choosePointNearTarget(character.position.moveTargetPoint, this.targetCharacter.position.levelPosition, character.position.room);
        character.actionType = 1;
      }
      var room = character.position.room;
      if (room && isAdventurerOrMinion(character)) {
        forcePartyDestination(room);
      }
      clearMovementTarget(character.position);
    }
  };
  OpportunisticAttackBehavior.prototype.getBehaviorScore = function (character) {
    this.targetCharacter = selectScrollTarget(character);
    if (!this.targetCharacter) {
      return 0;
    }
    if (character.effects.isStealthed) {
      this.actionRange = MELEE_ATTACK_RANGE;
      this.behaviorActionType = 2;
    } else {
      this.actionRange = RANGED_ATTACK_RANGE;
      this.behaviorActionType = MELEE_ACTION_TYPE;
    }
    this.targetDistance = character.position.levelPosition.distanceTo(this.targetCharacter.position.levelPosition);
    return this.priorityWeight;
  };
  OpportunisticAttackBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  LootItemBehavior.prototype = new ExploreDungeonBehavior();
  LootItemBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LootItemBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 11 !== spellDefinition.statusEffectTypeId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  LootItemBehavior.prototype.performOnArrival = function () {};
  LootItemBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  LootItemBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  LootItemBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  LootItemBehavior.prototype.selectTarget = function (character) {
    return character.effects.isStealthed || !hasOpponentsInRoom(character, character.position.room) ? null : character;
  };
  LootScrollBehavior.prototype = new ExploreDungeonBehavior();
  LootScrollBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LootScrollBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 12 !== spellDefinition.statusEffectTypeId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  LootScrollBehavior.prototype.performOnArrival = function (character) {
    var battleCry;
    switch (randomInt(8)) {
      case 0:
        battleCry = "杀戮!";
        break;
      case 1:
        battleCry = "去死!";
        break;
      case 2:
        battleCry = "万物皆杀!";
        break;
      case 3:
        battleCry = "啊啊啊啊啊!";
        break;
      case 4:
        battleCry = "凶手!";
        break;
      case 5:
        battleCry = "怒了!";
        break;
      case 6:
        battleCry = "我真的怒了.";
        break;
      default:
        battleCry = "杀!";
    }
    showFloatingText(game.floatingText, character, battleCry, "white");
  };
  LootScrollBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  LootScrollBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  LootScrollBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  LootScrollBehavior.prototype.selectTarget = function (character) {
    return character.effects.isEnraged || !hasOpponentsInRoom(character, character.position.room) ? null : character;
  };
  GuardRangedBehavior.prototype.resetBehaviorState = function () {
    (/** @type {RangedAttackBehavior & RangedBehaviorMethods} */ (/** @type {unknown} */ (this.delegateBehavior))).resetBehaviorState();
  };
  GuardRangedBehavior.prototype.notifySpellLearned = function () {};
  GuardRangedBehavior.prototype.execute = function (character) {
    (/** @type {RangedAttackBehavior & RangedBehaviorMethods} */ (/** @type {unknown} */ (this.delegateBehavior))).execute(character);
  };
  GuardRangedBehavior.prototype.getBehaviorScore = function (character) {
    return character.effects.isStealthed ? 0 : (/** @type {RangedAttackBehavior & RangedBehaviorMethods} */ (/** @type {unknown} */ (this.delegateBehavior))).getBehaviorScore(character);
  };
  GuardRangedBehavior.prototype.getPriority = function () {
    return (/** @type {RangedAttackBehavior & RangedBehaviorMethods} */ (/** @type {unknown} */ (this.delegateBehavior))).getPriority();
  };
  TargetSpellBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  TargetSpellBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  TargetSpellBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 6 !== spellDefinition.spellCategoryId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  TargetSpellBehavior.prototype.execute = function (character) {
    if (this.learnedSpell && canAttack(character) && isSpellReady(this.learnedSpell)) {
      if (character.setCombatTarget(this.targetCharacter), this.targetDistance <= this.actionRange) {
        if (canAttack(character)) {
          markAttackTurn(character);
          this.learnedSpell.lastCastTurn = game.state.turnNumber;
          character.spellToCast = this.learnedSpell;
          character.actionType = CAST_ACTION_TYPE;
          clearMovementTarget(character.position);
          var room = character.position.room;
          if (room && isAdventurerOrMinion(character)) {
            forcePartyDestination(room);
          }
        }
      } else {
        assignVector(character.position.moveTargetPoint, this.targetCharacter.position.levelPosition);
        character.actionType = 1;
      }
    }
  };
  TargetSpellBehavior.prototype.getBehaviorScore = function (character) {
    if (!this.learnedSpell || !isSpellReady(this.learnedSpell) || !character.position.room) {
      return 0;
    }
    if (!freeSpellsModifier.currentValue) {
      var stats = character.stats,
        spirit = stats.spirit,
        spellCost = getSpellSpiritCost(stats);
      if (spirit < spellCost) {
        return 0;
      }
    }
    return (this.targetCharacter = selectScrollTarget(character)) ? this.priorityWeight : 0;
  };
  HealBehavior.prototype = new ExploreDungeonBehavior();
  HealBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  HealBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 5 !== spellDefinition.spellCategoryId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  HealBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  HealBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  HealBehavior.prototype.getFinalScore = function (character) {
    var opponents = getOpponents(character);
    return 0 === opponents.length ? 0 : Math.min((/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority(), 5 / opponents.length * (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority());
  };
  HealBehavior.prototype.selectTarget = function (character) {
    return selectScrollTarget(character);
  };
  ApplyEffectBehavior.prototype = new ExploreDungeonBehavior();
  ApplyEffectBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  ApplyEffectBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || spellDefinition.statusEffectTypeId !== this.statusEffectTypeId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  ApplyEffectBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  ApplyEffectBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  ApplyEffectBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  ApplyEffectBehavior.prototype.selectTarget = function (character) {
    return selectScrollTarget(character);
  };
  AreaDamageBehavior.prototype = new ExploreDungeonBehavior();
  AreaDamageBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  AreaDamageBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 8 !== spellDefinition.spellCategoryId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  AreaDamageBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  AreaDamageBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  AreaDamageBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  AreaDamageBehavior.prototype.selectTarget = function (character) {
    return selectScrollTarget(character);
  };
  ChainDamageBehavior.prototype = new ExploreDungeonBehavior();
  ChainDamageBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  ChainDamageBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 12 !== spellDefinition.spellCategoryId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  ChainDamageBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  ChainDamageBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  ChainDamageBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  ChainDamageBehavior.prototype.selectTarget = function (character) {
    return selectScrollTarget(character);
  };
  SummonBehavior.prototype = new ExploreDungeonBehavior();
  SummonBehavior.prototype.resetBehaviorState = function () {
    this.spell = null;
  };
  SummonBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.spell || spellDefinition.spellCategoryId !== this.expectedSpellCategoryId)) {
      this.spell = spellDefinition;
    }
  };
  SummonBehavior.prototype.canExecute = function () {
    return this.spell && isSpellReady(this.spell);
  };
  SummonBehavior.prototype.getActionTarget = function () {
    return this.spell;
  };
  SummonBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  SummonBehavior.prototype.selectTarget = function (character) {
    return selectScrollTarget(character);
  };
  LifeDrainBehavior.prototype = new ExploreDungeonBehavior();
  LifeDrainBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LifeDrainBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 1 !== spellDefinition.spellCategoryId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  LifeDrainBehavior.prototype.getFinalScore = function () {
    var targetCharacter = (/** @type {LifeDrainBehavior & { selectedTarget: import("../characters/character.js").Character }} */ (/** @type {unknown} */ (this))).selectedTarget;
    return Math.max(0, (1 - targetCharacter.stats.health / statValue(targetCharacter.stats.maxHealth)) * (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority());
  };
  LifeDrainBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  LifeDrainBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  LifeDrainBehavior.prototype.selectTarget = function (character) {
    var weakestAlly = null,
      lowestHealthRatio = 1,
      allies = getFriendlyTargets(character),
      ally,
      allyHealth,
      allyStats,
      maxHealthValue;
    for (var allyIndex = 0; allyIndex < allies.length; allyIndex++) {
      if (ally = allies[allyIndex], allyStats = ally.stats, allyHealth = allyStats.health, maxHealthValue = statValue(allyStats.maxHealth), allyHealth !== maxHealthValue && (allyHealth /= maxHealthValue, !weakestAlly || allyHealth < lowestHealthRatio)) {
        lowestHealthRatio = allyHealth;
        weakestAlly = ally;
      }
    }
    return 0.9 < lowestHealthRatio ? null : weakestAlly;
  };
  ReviveBehavior.prototype = new ExploreDungeonBehavior();
  ReviveBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  ReviveBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 16 !== spellDefinition.spellCategoryId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  ReviveBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  ReviveBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  ReviveBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  ReviveBehavior.prototype.selectTarget = function (character) {
    var adventurerIndex,
      adventurers = game.state.adventurers,
      candidate;
    for (adventurerIndex = 0; adventurerIndex < adventurers.length; adventurerIndex++) {
      if (candidate = adventurers[adventurerIndex], candidate !== character && candidate.effects.isStunned) {
        return candidate;
      }
    }
    return null;
  };
  PartyBuffBehavior.prototype = new ExploreDungeonBehavior();
  PartyBuffBehavior.prototype.resetBehaviorState = function () {
    this.spell = null;
  };
  PartyBuffBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.spell || spellDefinition.statusEffectTypeId !== this.statusEffectTypeId)) {
      this.spell = spellDefinition;
    }
  };
  PartyBuffBehavior.prototype.canExecute = function () {
    return this.spell && isSpellReady(this.spell);
  };
  PartyBuffBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  PartyBuffBehavior.prototype.getActionTarget = function () {
    return this.spell;
  };
  PartyBuffBehavior.prototype.selectTarget = function (character) {
    return character;
  };
  WaitBehavior.prototype.resetBehaviorState = function () {};
  WaitBehavior.prototype.notifySpellLearned = function () {};
  WaitBehavior.prototype.execute = function (character) {
    if (!isPartyTravelling(game.state.party) || !hasForcedDestination(character)) {
      var party = game.state.party,
        destinationRoom = party.destinationRoom,
        targetDoor = party.targetDoor,
        targetRoom = party.targetRoom,
        position = character.position;
      if (targetDoor && targetDoor != position.targetDoor) {
        var route = findRouteToDoor(character, targetDoor);
        position.routeQueue = route;
        position.movementTargetCleared = false;
      } else {
        if (targetRoom && targetRoom != position.targetRoom) {
          route = findRouteToRoom(character, targetRoom.leadsTo);
          position.routeQueue = route;
          position.movementTargetCleared = false;
        } else {
          if (destinationRoom && destinationRoom != position.destinationRoom) {
            route = findRouteToRoom(character, destinationRoom);
            position.routeQueue = route;
            position.movementTargetCleared = false;
          }
        }
      }
      position.setTargetDoor(targetDoor);
      position.destinationRoom = destinationRoom;
      position.setTargetRoom(targetRoom);
      if (targetDoor) {
        setVector(position.moveTargetPoint, targetDoor.pixelColumn, targetDoor.pixelRow);
        character.actionType = 1;
      } else {
        if (targetRoom) {
          setVector(position.moveTargetPoint, targetRoom.pixelColumn, targetRoom.pixelRow);
          character.actionType = 1;
        } else {
          if (destinationRoom) {
            character.actionType = 1;
          }
        }
      }
    }
  };
  WaitBehavior.prototype.getBehaviorScore = function (character) {
    if (game.worldActive || isPartyTravelling(game.state.party) && hasForcedDestination(character)) {
      return 0;
    }
    var opponents = getOpponents(character);
    return 0 < opponents.length && character.position.room === opponents[0].position.room ? 0 : this.priorityWeight;
  };
  WaitBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  LootChestBehavior.prototype = new ExploreDungeonBehavior();
  LootChestBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LootChestBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 14 !== spellDefinition.spellCategoryId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  LootChestBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  LootChestBehavior.prototype.getFinalScore = function (character) {
    return hasOpponentsInRoom(character, character.position.room) ? 0 : hasPendingLoot() ? (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority() : 0;
  };
  LootChestBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  LootChestBehavior.prototype.selectTarget = function (character) {
    return hasPendingLoot() ? character : null;
  };
  LootPotionBehavior.prototype = new ExploreDungeonBehavior();
  LootPotionBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LootPotionBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.learnedSpell || 15 !== spellDefinition.spellCategoryId)) {
      this.learnedSpell = spellDefinition;
    }
  };
  LootPotionBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  LootPotionBehavior.prototype.getFinalScore = function (character) {
    var room = character.position.room;
    if (!room || hasOpponentsInRoom(character, room)) {
      return 0;
    }
    var roomTreasure = getRoomTreasure(game.treasure, room);
    return !roomTreasure || roomTreasure.opened || roomTreasure.selected ? 0 : (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  LootPotionBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  LootPotionBehavior.prototype.selectTarget = function (character) {
    return character;
  };
  UseShopBehavior.prototype.resetBehaviorState = function () {
    this.goldDrop = null;
  };
  UseShopBehavior.prototype.notifySpellLearned = function () {};
  UseShopBehavior.prototype.execute = function (character) {
    if (this.goldDrop) {
      if (this.goldDrop.collected) {
        this.goldDrop = null;
      } else if (this.goldDrop.claimedBy == character) {
        character.targetGoldDrop = this.goldDrop;
        if (distanceToPoint(character.position.levelPosition, this.goldDrop.levelPositionX, this.goldDrop.levelPositionY) < this.pickupRadius) {
          character.actionType = 5;
        } else {
          setVector(character.position.moveTargetPoint, this.goldDrop.levelPositionX, this.goldDrop.levelPositionY);
          character.actionType = 1;
        }
        clearMovementTarget(character.position);
        var room = character.position.room;
        if (room && isAdventurerOrMinion(character)) {
          forcePartyDestination(room);
        }
      }
    }
  };
  UseShopBehavior.prototype.getBehaviorScore = function (character) {
    var room = character.position.room;
    if (!room || hasOpponentsInRoom(character, room)) {
      return 0;
    }
    if (this.goldDrop && this.goldDrop.claimedBy === character) {
      this.goldDrop.setClaimedBy(null);
      this.goldDrop.setClaimDistance(0);
    }
    var drops = game.goldDrops.drops,
      drop,
      dropIndex,
      characterPosition = character.position.levelPosition,
      bestDrop = null,
      dropDistance,
      searchRoom = character.position.room,
      bestDistanceSquared = -1;
    if (searchRoom) {
      for (dropIndex = 0; dropIndex < drops.length; dropIndex++) {
        drop = drops[dropIndex];
        if (!(drop.collected || drop.room !== searchRoom)) {
          dropDistance = distanceSquaredToPoint(characterPosition, drop.levelPositionX, drop.levelPositionY);
          if (!(drop.claimedBy && dropDistance > drop.getClaimDistance() || !(0 > bestDistanceSquared || dropDistance < bestDistanceSquared))) {
            bestDrop = drop;
            bestDistanceSquared = dropDistance;
          }
        }
      }
      if (this.goldDrop = bestDrop) {
        this.goldDrop.setClaimedBy(character);
        this.goldDrop.setClaimDistance(bestDistanceSquared);
        this.cachedDropDistance = Math.sqrt(bestDistanceSquared);
      }
    }
    return this.goldDrop ? approachValue(this.priorityWeight, this.minPriorityValue, this.cachedDropDistance) : 0;
  };
  UseShopBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  EnterDungeonBehavior.prototype.resetBehaviorState = function () {
    this.scrollDrop = null;
  };
  EnterDungeonBehavior.prototype.notifySpellLearned = function () {};
  EnterDungeonBehavior.prototype.execute = function (character) {
    if (this.scrollDrop) {
      if (this.scrollDrop.collected) {
        this.scrollDrop = null;
      } else if (this.scrollDrop.claimedBy == character) {
        character.targetScrollDrop = this.scrollDrop;
        if (distanceToPoint(character.position.levelPosition, this.scrollDrop.levelPositionX, this.scrollDrop.levelPositionY) < this.pickupRadius) {
          character.actionType = 7;
        } else {
          setVector(character.position.moveTargetPoint, this.scrollDrop.levelPositionX, this.scrollDrop.levelPositionY);
          character.actionType = 1;
        }
        clearMovementTarget(character.position);
        var room = character.position.room;
        if (room && isAdventurerOrMinion(character)) {
          forcePartyDestination(room);
        }
      }
    }
  };
  EnterDungeonBehavior.prototype.getBehaviorScore = function (character) {
    var room = character.position.room;
    if (!room || hasOpponentsInRoom(character, room)) {
      return 0;
    }
    if (this.scrollDrop && this.scrollDrop.claimedBy === character) {
      this.scrollDrop.setClaimedBy(null);
      this.scrollDrop.setClaimDistance(0);
    }
    var drops = game.scrollDrops.drops,
      drop,
      dropIndex,
      characterPosition = character.position.levelPosition,
      bestDrop = null,
      dropDistance,
      searchRoom = character.position.room,
      bestDistanceSquared = -1;
    if (searchRoom) {
      for (dropIndex = 0; dropIndex < drops.length; dropIndex++) {
        drop = drops[dropIndex];
        if (!(drop.collected || drop.room !== searchRoom)) {
          dropDistance = distanceSquaredToPoint(characterPosition, drop.levelPositionX, drop.levelPositionY);
          if (!(drop.claimedBy && dropDistance > drop.getClaimDistance() || !(0 > bestDistanceSquared || dropDistance < bestDistanceSquared))) {
            bestDrop = drop;
            bestDistanceSquared = dropDistance;
          }
        }
      }
      if (this.scrollDrop = bestDrop) {
        this.scrollDrop.setClaimedBy(character);
        this.scrollDrop.setClaimDistance(bestDistanceSquared);
        this.cachedDropDistance = Math.sqrt(bestDistanceSquared);
      }
    }
    return this.scrollDrop ? approachValue(this.priorityWeight, this.minPriorityValue, this.cachedDropDistance) : 0;
  };
  EnterDungeonBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  EnterCastleBehavior.prototype.resetBehaviorState = function () {
    this.potionDrop = null;
  };
  EnterCastleBehavior.prototype.notifySpellLearned = function () {};
  EnterCastleBehavior.prototype.execute = function (character) {
    if (this.potionDrop) {
      if (this.potionDrop.collected) {
        this.potionDrop = null;
      } else if (this.potionDrop.claimedBy == character) {
        character.targetPotionDrop = this.potionDrop;
        if (distanceToPoint(character.position.levelPosition, this.potionDrop.levelPositionX, this.potionDrop.levelPositionY) < this.pickupRadius) {
          character.actionType = 8;
        } else {
          setVector(character.position.moveTargetPoint, this.potionDrop.levelPositionX, this.potionDrop.levelPositionY);
          character.actionType = 1;
        }
        clearMovementTarget(character.position);
        var room = character.position.room;
        if (room && isAdventurerOrMinion(character)) {
          forcePartyDestination(room);
        }
      }
    }
  };
  EnterCastleBehavior.prototype.getBehaviorScore = function (character) {
    var room = character.position.room;
    if (!room || hasOpponentsInRoom(character, room)) {
      return 0;
    }
    if (this.potionDrop && this.potionDrop.claimedBy === character) {
      this.potionDrop.setClaimedBy(null);
      this.potionDrop.setClaimDistance(0);
    }
    var drops = game.potionDrops.drops,
      drop,
      dropIndex,
      characterPosition = character.position.levelPosition,
      bestDrop = null,
      dropDistance,
      searchRoom = character.position.room,
      bestDistanceSquared = -1;
    if (searchRoom) {
      for (dropIndex = 0; dropIndex < drops.length; dropIndex++) {
        drop = drops[dropIndex];
        if (!(drop.collected || drop.room !== searchRoom)) {
          dropDistance = distanceSquaredToPoint(characterPosition, drop.levelPositionX, drop.levelPositionY);
          if (!(drop.claimedBy && dropDistance > drop.getClaimDistance() || !(0 > bestDistanceSquared || dropDistance < bestDistanceSquared))) {
            bestDrop = drop;
            bestDistanceSquared = dropDistance;
          }
        }
      }
      if (this.potionDrop = bestDrop) {
        this.potionDrop.setClaimedBy(character);
        this.potionDrop.setClaimDistance(bestDistanceSquared);
        this.cachedDropDistance = Math.sqrt(bestDistanceSquared);
      }
    }
    return this.potionDrop ? approachValue(this.priorityWeight, this.minPriorityValue, this.cachedDropDistance) : 0;
  };
  EnterCastleBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  TravelWorldBehavior.prototype.resetBehaviorState = function () {
    this.itemDrop = null;
  };
  TravelWorldBehavior.prototype.notifySpellLearned = function () {};
  TravelWorldBehavior.prototype.execute = function (character) {
    if (this.itemDrop) {
      if (this.itemDrop.collected) {
        this.itemDrop = null;
      } else if (this.itemDrop.claimedBy == character) {
        character.targetItemDrop = this.itemDrop;
        if (distanceToPoint(character.position.levelPosition, this.itemDrop.levelPositionX, this.itemDrop.levelPositionY) < this.pickupRadius) {
          character.actionType = 6;
        } else {
          setVector(character.position.moveTargetPoint, this.itemDrop.levelPositionX, this.itemDrop.levelPositionY);
          character.actionType = 1;
        }
        clearMovementTarget(character.position);
        var room = character.position.room;
        if (room && isAdventurerOrMinion(character)) {
          forcePartyDestination(room);
        }
      }
    }
  };
  TravelWorldBehavior.prototype.getBehaviorScore = function (character) {
    var room = character.position.room;
    if (!room || hasOpponentsInRoom(character, room)) {
      return 0;
    }
    if (this.itemDrop && this.itemDrop.claimedBy === character) {
      this.itemDrop.setClaimedBy(null);
      this.itemDrop.setClaimDistance(0);
    }
    var drops = game.itemDrops.drops,
      drop,
      dropIndex,
      characterPosition = character.position.levelPosition,
      bestDrop = null,
      dropDistance,
      searchRoom = character.position.room,
      bestDistanceSquared = -1;
    if (searchRoom) {
      for (dropIndex = 0; dropIndex < drops.length; dropIndex++) {
        drop = drops[dropIndex];
        if (!(drop.collected || drop.room !== searchRoom)) {
          dropDistance = distanceSquaredToPoint(characterPosition, drop.levelPositionX, drop.levelPositionY);
          if (!(drop.claimedBy && dropDistance > drop.getClaimDistance() || !(0 > bestDistanceSquared || dropDistance < bestDistanceSquared))) {
            bestDrop = drop;
            bestDistanceSquared = dropDistance;
          }
        }
      }
      if (this.itemDrop = bestDrop) {
        this.itemDrop.setClaimedBy(character);
        this.itemDrop.setClaimDistance(bestDistanceSquared);
        this.cachedDropDistance = Math.sqrt(bestDistanceSquared);
      }
    }
    return this.itemDrop ? approachValue(this.priorityWeight, this.minPriorityValue, this.cachedDropDistance) : 0;
  };
  TravelWorldBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  ChangeFloorBehavior.prototype.resetBehaviorState = function () {
    this.treasureChest = null;
  };
  ChangeFloorBehavior.prototype.notifySpellLearned = function () {};
  ChangeFloorBehavior.prototype.execute = function (character) {
    if (this.treasureChest && !this.treasureChest.opened) {
      character.setTargetTreasureChest(this.treasureChest);
      if (distanceToPoint(character.position.levelPosition, this.treasureChest.levelX, this.treasureChest.levelY) < this.pickupRadius) {
        character.actionType = 12;
      } else {
        setVector(character.position.moveTargetPoint, this.treasureChest.levelX, this.treasureChest.levelY);
        character.actionType = 1;
      }
      clearMovementTarget(character.position);
      var room = character.position.room;
      if (room && isAdventurerOrMinion(character)) {
        forcePartyDestination(room);
      }
    }
  };
  ChangeFloorBehavior.prototype.getBehaviorScore = function (character) {
    var room = character.position.room;
    if (!room) {
      return 0;
    }
    this.treasureChest = getRoomTreasure(game.treasure, room);
    return !this.treasureChest || this.treasureChest.opened || !this.treasureChest.selected || hasOpponentsInRoom(character, room) ? 0 : this.priorityWeight;
  };
  ChangeFloorBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  SelfSpellBehavior.prototype = new ExploreDungeonBehavior();
  SelfSpellBehavior.prototype.resetBehaviorState = function () {
    this.spell = null;
  };
  SelfSpellBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.spell || 9 !== spellDefinition.spellCategoryId)) {
      this.spell = spellDefinition;
    }
  };
  SelfSpellBehavior.prototype.performOnArrival = function (character) {
    showFloatingText(game.floatingText, character, "Protect me", "white");
  };
  SelfSpellBehavior.prototype.canExecute = function (character) {
    return this.spell && isSpellReady(this.spell) && !character.companion ? true : false;
  };
  SelfSpellBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  SelfSpellBehavior.prototype.getActionTarget = function () {
    return this.spell;
  };
  SelfSpellBehavior.prototype.selectTarget = function (character) {
    return character;
  };
  AreaSpellBehavior.prototype = new ExploreDungeonBehavior();
  AreaSpellBehavior.prototype.resetBehaviorState = function () {
    this.spell = null;
  };
  AreaSpellBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.spell || spellDefinition.spellCategoryId !== this.expectedSpellCategoryId)) {
      this.spell = spellDefinition;
    }
  };
  AreaSpellBehavior.prototype.canExecute = function (character) {
    if (!this.spell || !isSpellReady(this.spell)) {
      return false;
    }
    var maxSummonedMinions = character.stats.maxSummonedMinions;
    return countSummonedMinions(character) < maxSummonedMinions;
  };
  AreaSpellBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  AreaSpellBehavior.prototype.getActionTarget = function () {
    return this.spell;
  };
  AreaSpellBehavior.prototype.selectTarget = function (character) {
    return character;
  };
  CompanionSpellBehavior.prototype = new ExploreDungeonBehavior();
  CompanionSpellBehavior.prototype.resetBehaviorState = function () {
    this.spell = null;
  };
  CompanionSpellBehavior.prototype.notifySpellLearned = function (spellDefinition) {
    if (!(this.spell || 11 !== spellDefinition.spellCategoryId)) {
      this.spell = spellDefinition;
    }
  };
  CompanionSpellBehavior.prototype.canExecute = function (character) {
    if (!this.spell || !isSpellReady(this.spell)) {
      return false;
    }
    var room = character.position.room;
    if (!room) {
      return false;
    }
    var defeatedMonsters = game.monsters.defeatedMonsters;
    if (!defeatedMonsters || 0 === defeatedMonsters.length) {
      return false;
    }
    var monsterIndex,
      foundDefeatedInRoom = false;
    for (monsterIndex = 0; monsterIndex < defeatedMonsters.length; monsterIndex++) {
      if (defeatedMonsters[monsterIndex].position.room === room) {
        foundDefeatedInRoom = true;
        break;
      }
    }
    if (!foundDefeatedInRoom) {
      return false;
    }
    var maxSummonedMinions = character.stats.maxSummonedMinions;
    return countSummonedMinions(character) < maxSummonedMinions;
  };
  CompanionSpellBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  CompanionSpellBehavior.prototype.getActionTarget = function () {
    return this.spell;
  };
  CompanionSpellBehavior.prototype.selectTarget = function (character) {
    var defeatedMonsters = game.monsters.defeatedMonsters;
    if (0 === defeatedMonsters.length) {
      return null;
    }
    var room = character.position.room;
    if (!room) {
      return null;
    }
    var defeatedIndex,
      characterLevelPosition = character.position.levelPosition,
      closestDefeated = null,
      distanceSquared,
      bestDistanceSquared = -1;
    for (defeatedIndex = 0; defeatedIndex < defeatedMonsters.length; defeatedIndex++) {
      var candidate = defeatedMonsters[defeatedIndex];
      if (candidate.position.room === room && (distanceSquared = characterLevelPosition.squaredDistanceTo(candidate.position.levelPosition), 0 > bestDistanceSquared || distanceSquared < bestDistanceSquared)) {
        closestDefeated = candidate;
        bestDistanceSquared = distanceSquared;
      }
    }
    return closestDefeated;
  };
  CooldownBehavior.prototype.resetBehaviorState = function () {};
  CooldownBehavior.prototype.notifySpellLearned = function () {};
  CooldownBehavior.prototype.execute = function (character) {
    choosePointNearTarget(character.position.moveTargetPoint, character.summoner.position.levelPosition, character.position.room);
    character.actionType = 1;
    clearMovementTarget(character.position);
  };
  CooldownBehavior.prototype.getBehaviorScore = function (character) {
    if (game.worldActive) {
      return 0;
    }
    var position = character.position;
    var summonerPosition = character.summoner.position;
    return !position.room || !summonerPosition.room || position.room !== summonerPosition.room || position.levelPosition.distanceTo(summonerPosition.levelPosition) < this.leashDistance ? 0 : this.priorityWeight;
  };
  CooldownBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  SpecialAttackBehavior.prototype.resetBehaviorState = function () {};
  SpecialAttackBehavior.prototype.notifySpellLearned = function () {};
  SpecialAttackBehavior.prototype.execute = function (character) {
    if (this.targetCharacter && !this.targetCharacter.isDead) {
      character.setCombatTarget(this.targetCharacter);
      if (this.targetDistance <= this.actionRange) {
        if (!canAttack(character)) {
          return;
        }
        markAttackTurn(character);
        character.actionType = this.behaviorActionType;
      } else {
        choosePointNearTarget(character.position.moveTargetPoint, this.targetCharacter.position.levelPosition, character.position.room);
        character.actionType = 1;
      }
      var room = character.position.room;
      if (room && isAdventurerOrMinion(character)) {
        forcePartyDestination(room);
      }
      clearMovementTarget(character.position);
    }
  };
  SpecialAttackBehavior.prototype.getBehaviorScore = function (character) {
    if (game.worldActive) {
      return 0;
    }
    var summoner = character.summoner;
    var position = character.position;
    var summonerPosition = summoner.position;
    if (!position.room || !summonerPosition.room || position.room !== summonerPosition.room) {
      return 0;
    }
    this.targetCharacter = selectScrollTarget(summoner);
    if (!this.targetCharacter) {
      return 0;
    }
    var targetLevelPosition = this.targetCharacter.position.levelPosition;
    if (summonerPosition.levelPosition.distanceTo(targetLevelPosition) > this.maxEngageDistance) {
      return 0;
    }
    this.targetDistance = position.levelPosition.distanceTo(targetLevelPosition);
    return this.priorityWeight;
  };
  SpecialAttackBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  StunnedBehavior.prototype.resetBehaviorState = function () {};
  StunnedBehavior.prototype.notifySpellLearned = function () {};
  StunnedBehavior.prototype.execute = function (character) {
    var position = character.position;
    if (position.room) {
      var room = position.room,
        moveTargetPoint = position.moveTargetPoint;
      assignVector(moveTargetPoint, position.levelPosition);
      clampPointToRoom(room, moveTargetPoint, game.tileSize + 1);
      position.movementTargetCleared = false;
      position.movementTargetCleared = false;
      character.actionType = 1;
    }
  };
  StunnedBehavior.prototype.getBehaviorScore = function (character) {
    if (game.worldActive) {
      return 0;
    }
    var position = character.position;
    if (position.routeQueue && 0 < position.routeQueue.length || position.targetDoor || position.targetRoom || position.destinationRoom) {
      return 0;
    }
    var room = position.room;
    if (!room) {
      return 0;
    }
    var levelPosition = position.levelPosition;
    return isPointNearDoor(room, levelPosition) || room.stairs && distanceToPoint(levelPosition, room.stairs.pixelColumn, room.stairs.pixelRow) < game.tileSize ? this.priorityWeight : 0;
  };
  StunnedBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
}
