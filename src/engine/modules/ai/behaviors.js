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
  this.fo = [];
}
export function IdleBehavior(a) {
  this.kB = a;
  this.lastWanderRoom = null;
}
export function ExploreDungeonBehavior() {
  this.priorityWeight = 10;
  this.selectedTarget = null;
  this.SB = 0;
  this.actionTarget = null;
  this.actionRange = 100;
  this.Yt = false;
}
export function FollowLeaderBehavior() {
  this.priorityWeight = 100;
  this.zE = RANGED_MIN_DISTANCE;
  this.AD = 0.8;
  this.Uq = null;
}
export function RangedAttackBehavior(a, b, c) {
  this.priorityWeight = c;
  this.targetCharacter = null;
  this.CA = a;
  this.actionRange = b;
  this.fleeDirection = new Vector2();
  this.kiteVector = new Vector2();
  this.consecutiveAttackTurns = this.ax = 0;
}
export function MeleeAttackBehavior(a, b, c, d) {
  this.priorityWeight = b;
  this.targetCharacter = null;
  this.targetDistance = 0;
  this.actionRange = a;
  this.behaviorActionType = c;
  this.YD = d;
}
export function LootGoldBehavior(a) {
  this.learnedSpell = null;
  this.priorityWeight = a;
  this.actionRange = 10;
}
export function OpportunisticAttackBehavior(a) {
  this.priorityWeight = a;
  this.targetCharacter = null;
  this.targetDistance = 0;
  this.actionRange = RANGED_ATTACK_RANGE;
  this.behaviorActionType = MELEE_ACTION_TYPE;
}
export function LootItemBehavior(a) {
  this.learnedSpell = null;
  this.priorityWeight = a;
  this.actionRange = 10;
}
export function LootScrollBehavior(a) {
  this.learnedSpell = null;
  this.priorityWeight = a;
  this.actionRange = 10;
}
export function GuardRangedBehavior(a, b, c) {
  this.Vq = new RangedAttackBehavior(a, b, c);
}
export function TargetSpellBehavior(a, b) {
  this.priorityWeight = b;
  this.targetCharacter = this.learnedSpell = null;
  this.targetDistance = 0;
  this.actionRange = a;
}
export function HealBehavior(a, b) {
  this.learnedSpell = null;
  this.priorityWeight = b;
  this.actionRange = a;
}
export function ApplyEffectBehavior(a, b, c) {
  this.learnedSpell = null;
  this.statusEffectTypeId = c;
  this.priorityWeight = b;
  this.actionRange = a;
}
export function AreaDamageBehavior(a, b) {
  this.learnedSpell = null;
  this.priorityWeight = b;
  this.actionRange = a;
}
export function ChainDamageBehavior(a, b) {
  this.learnedSpell = null;
  this.priorityWeight = b;
  this.actionRange = a;
}
export function SummonBehavior(a, b, c) {
  this.spell = null;
  this.expectedSpellCategoryId = c;
  this.priorityWeight = b;
  this.actionRange = a;
}
export function LifeDrainBehavior(a, b) {
  this.priorityWeight = b;
  this.actionRange = a;
  this.learnedSpell = null;
}
export function ReviveBehavior(a, b) {
  this.priorityWeight = b;
  this.actionRange = a;
  this.learnedSpell = null;
}
export function PartyBuffBehavior(a, b, c) {
  this.priorityWeight = c;
  this.actionRange = a;
  this.statusEffectTypeId = b;
  this.spell = null;
}
export function WaitBehavior() {
  this.eo = 2;
}
export function hasForcedDestination(a) {
  var b;
  return (b = game.state.party.forcedDestinationRoom) ? a.position.destinationRoom === b ? false : true : false;
}
export function LootChestBehavior(a) {
  this.learnedSpell = null;
  this.priorityWeight = a;
  this.Yt = true;
  this.actionRange = 10;
}
export function hasPendingLoot() {
  return 0 < game.goldDrops.drops.length || 0 < game.itemDrops.drops.length || 0 < game.scrollDrops.drops.length;
}
export function LootPotionBehavior(a) {
  this.learnedSpell = null;
  this.priorityWeight = a;
  this.Yt = true;
  this.actionRange = 10;
}
export function UseShopBehavior(a, b) {
  this.pickupRadius = game.tileSize + 5;
  this.priorityWeight = a;
  this.minPriorityValue = b;
  this.goldDrop = null;
  this.cachedDropDistance = 0;
}
export function EnterDungeonBehavior(a, b) {
  this.pickupRadius = game.tileSize + 5;
  this.priorityWeight = a;
  this.minPriorityValue = b;
  this.scrollDrop = null;
  this.cachedDropDistance = 0;
}
export function EnterCastleBehavior(a, b) {
  this.pickupRadius = game.tileSize + 5;
  this.priorityWeight = a;
  this.minPriorityValue = b;
  this.potionDrop = null;
  this.cachedDropDistance = 0;
}
export function TravelWorldBehavior(a, b) {
  this.pickupRadius = game.tileSize + 5;
  this.priorityWeight = a;
  this.minPriorityValue = b;
  this.itemDrop = null;
  this.cachedDropDistance = 0;
}
export function ChangeFloorBehavior() {
  this.pickupRadius = game.tileSize + 1;
  this.priorityWeight = 90;
  this.treasureChest = null;
}
export function SelfSpellBehavior(a) {
  this.spell = null;
  this.priorityWeight = a;
  this.actionRange = 10;
}
export function AreaSpellBehavior(a, b, c) {
  this.spell = null;
  this.KE = c;
  this.priorityWeight = b;
  this.actionRange = a;
}
export function CompanionSpellBehavior(a, b) {
  this.spell = null;
  this.priorityWeight = b;
  this.actionRange = a;
}
export function CooldownBehavior(a, b) {
  this.priorityWeight = b;
  this.Uw = a;
}
export function SpecialAttackBehavior(a, b, c, d) {
  this.priorityWeight = c;
  this.targetCharacter = null;
  this.targetDistance = 0;
  this.actionRange = a;
  this.Uw = b;
  this.behaviorActionType = d;
}
export function StunnedBehavior(a) {
  this.eo = a;
}
export function initializeAiBehaviors() {
  BehaviorQueue.prototype.updateBehaviors = function (a) {
    if (game.worldActive) {
      (/** @type {BehaviorQueue & { ou: (character: unknown) => void }} */ (/** @type {unknown} */ (this))).ou(a);
    } else {
      (/** @type {BehaviorQueue & { nu: (character: unknown) => void }} */ (/** @type {unknown} */ (this))).nu(a);
    }
  };
  BehaviorQueue.prototype.ou = function (a) {
    var b, c;
    b = game.state.party;
    c = b.targetShop;
    var d = b.activeCastle,
      f = b.targetDungeon;
    if (c || f || d) {
      if (a === game.state.leader) {
        if (c) {
          if (b = c.worldColumn, c = c.worldRow, d = game.world.getTileAtPixel(b, c)) {
            b = a.position;
            if (game.world.getTileAtPixel(game.world.pixelToTileColumn(b.getWorldPositionX()), game.world.pixelToTileRow(b.getWorldPositionY())) === d) {
              a.actionType = 10;
            } else {
              setWorldDestination(b, d.getWorldColumn(), d.getWorldRow());
              a.actionType = 1;
            }
            return;
          }
        } else if (d) {
          if (b = d.worldPixelX, c = d.worldPixelY, d = game.world.getTileAtPixel(b, c)) {
            b = a.position;
            if (game.world.getTileAtPixel(game.world.pixelToTileColumn(b.getWorldPositionX()), game.world.pixelToTileRow(b.getWorldPositionY())) === d) {
              a.actionType = 11;
            } else {
              setWorldDestination(b, d.getWorldColumn(), d.getWorldRow());
              a.actionType = 1;
            }
            return;
          }
        } else if (b = f.getWorldColumn(), c = f.getWorldRow(), d = game.world.getTileAtPixel(b, c)) {
          b = a.position;
          if (game.world.getTileAtPixel(game.world.pixelToTileColumn(b.getWorldPositionX()), game.world.pixelToTileRow(b.getWorldPositionY())) === d) {
            a.actionType = 9;
          } else {
            setWorldDestination(b, d.getWorldColumn(), d.getWorldRow());
            a.actionType = 1;
          }
          return;
        }
        d = a.position;
        if (d.movementTargetCleared || a.actionType === IDLE_ACTION) {
          setWorldDestination(d, b, c);
          a.actionType = 1;
          d.movementTargetCleared = false;
        }
      } else {
        b = getAllies();
        c = b.indexOf(a);
        b = 1 === a.characterType ? a.summoner : 0 > c ? game.state.leader : b[c - 1];
        setWorldDestination(a.position, game.world.pixelToTileColumn(b.position.getWorldPositionX()), game.world.pixelToTileRow(b.position.getWorldPositionY()));
        a.actionType = 1;
      }
    } else {
      a.actionType = IDLE_ACTION;
    }
  };
  BehaviorQueue.prototype.nu = function (a) {
    a.actionType = IDLE_ACTION;
    a.targetGoldDrop = null;
    a.combatTarget = null;
    a.targetItemDrop = null;
    a.targetTreasureChest = null;
    a.spellToCast = null;
    a.targetScrollDrop = null;
    a.targetPotionDrop = null;
    var b,
      c = 0,
      d,
      f = null,
      g;
    for (b = 0; b < this.fo.length && !(d = this.fo[b], d.getPriority() > c && (g = d.getBehaviorScore(a), g > c && (c = g, f = d), 100 <= c)); b++) {}
    if (f) {
      f.execute(a);
    }
  };
  BehaviorQueue.prototype.notifySpellLearned = function (a) {
    var b;
    for (b = 0; b < this.fo.length; b++) {
      this.fo[b].notifySpellLearned(a);
    }
  };
  IdleBehavior.prototype.resetBehaviorState = function () {};
  IdleBehavior.prototype.notifySpellLearned = function () {};
  IdleBehavior.prototype.execute = function (a) {
    var b = a.position,
      c = b.room;
    if (c) {
      if (b.movementTargetCleared || this.lastWanderRoom != c) {
        this.lastWanderRoom = c;
        var d = roomTopPixels(c) + game.tileSize,
          f = (c.heightInTiles - 1) * game.tileSize;
        setVector(b.moveTargetPoint, roomLeftPixels(c) + game.tileSize + randomInt((c.widthInTiles - 1) * game.tileSize), d + randomInt(f));
        b.movementTargetCleared = false;
      }
      a.actionType = 1;
    }
  };
  IdleBehavior.prototype.getBehaviorScore = function (a) {
    return a.position.room ? this.kB : 0;
  };
  IdleBehavior.prototype.getPriority = function () {
    return this.kB;
  };
  ExploreDungeonBehavior.prototype.resetBehaviorState = function () {
    this.selectedTarget = this.actionTarget = null;
  };
  ExploreDungeonBehavior.prototype.notifySpellLearned = function () {};
  ExploreDungeonBehavior.prototype.execute = function (a) {
    if (this.selectedTarget && this.actionTarget) {
      a.setCombatTarget(this.selectedTarget);
      var b = a.position;
      this.SB = a === this.selectedTarget ? 0 : b.levelPosition.distanceTo(this.selectedTarget.position.levelPosition);
      if (this.SB <= this.actionRange) {
        if (!this.Yt && !canAttack(a)) {
          return;
        }
        markAttackTurn(a);
        this.actionTarget.lastCastTurn = game.state.turnNumber;
        a.spellToCast = this.actionTarget;
        a.actionType = CAST_ACTION_TYPE;
        (/** @type {DungeonBehaviorMethods} */ (/** @type {unknown} */ (this))).performOnArrival(a);
      } else {
        assignVector(b.moveTargetPoint, this.selectedTarget.position.levelPosition);
        a.actionType = 1;
      }
      clearMovementTarget(b);
      if ((b = a.position.room) && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
    }
  };
  ExploreDungeonBehavior.prototype.performOnArrival = function () {};
  ExploreDungeonBehavior.prototype.getBehaviorScore = function (a) {
    var b = a.position.room;
    if (!b || !(/** @type {DungeonBehaviorMethods} */ (/** @type {unknown} */ (this))).canExecute(a)) {
      return 0;
    }
    if (!freeSpellsModifier.currentValue) {
      var stats = a.stats,
        spirit = stats.spirit,
        spellCost = getSpellSpiritCost(stats);
      if (spirit < spellCost) {
        return 0;
      }
    }
    this.selectedTarget = (/** @type {DungeonBehaviorMethods} */ (/** @type {unknown} */ (this))).selectTarget(a);
    return this.selectedTarget && this.selectedTarget.position.room === b ? (this.actionTarget = (/** @type {DungeonBehaviorMethods} */ (/** @type {unknown} */ (this))).getActionTarget()) ? (/** @type {DungeonBehaviorMethods} */ (/** @type {unknown} */ (this))).getFinalScore(a) : 0 : 0;
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
  FollowLeaderBehavior.prototype.execute = function (a) {
    if (this.Uq) {
      var b = a.position.room;
      if (a.position.movementTargetCleared) {
        if (!b) {
          return;
        }
        (/** @type {MovingBehavior} */ (/** @type {unknown} */ (this))).repositionInsideRoom(a);
      }
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
      a.actionType = 1;
      a.position.movementTargetCleared = false;
      if (0 === game.state.turnNumber % 2) {
        showFloatingText(game.floatingText, a, "快逃!", "yellow");
      }
    }
  };
  FollowLeaderBehavior.prototype.repositionInsideRoom = function (a) {
    var b = randomInt(3);
    a = a.position;
    var room = a.room,
      d = roomLeftPixels(room),
      f = roomTopPixels(room),
      g = roomRightPixels(room),
      c = roomBottomPixels(room);
    if (0 === b) {
      setVector(a.moveTargetPoint, d + 1, f + 1);
    } else {
      if (1 === b) {
        setVector(a.moveTargetPoint, g - 1, f + 1);
      } else {
        if (2 === b) {
          setVector(a.moveTargetPoint, d + 1, c - 1);
        } else {
          setVector(a.moveTargetPoint, g - 1, c - 1);
        }
      }
    }
  };
  FollowLeaderBehavior.prototype.getBehaviorScore = function (a) {
    var b = a.stats.health / statValue(a.stats.maxHealth);
    if (b > this.AD) {
      return 0;
    }
    var c;
    a: {
      c = getOpponents(a);
      var d, f;
      for (f = 0; f < c.length; f++) {
        if (d = c[f], a !== d && d.combatTarget === a) {
          c = d;
          break a;
        }
      }
      c = null;
    }
    this.Uq = c;
    return !this.Uq || a.position.levelPosition.distanceTo(this.Uq.position.levelPosition) > this.zE ? 0 : (1 - b) * this.priorityWeight;
  };
  FollowLeaderBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  RangedAttackBehavior.prototype.resetBehaviorState = function () {
    this.consecutiveAttackTurns = this.ax = 0;
    this.targetCharacter = null;
  };
  RangedAttackBehavior.prototype.notifySpellLearned = function () {};
  RangedAttackBehavior.prototype.execute = function (a) {
    if (this.ax == game.state.turnNumber - 1) {
      this.consecutiveAttackTurns++;
    } else {
      this.consecutiveAttackTurns = 0;
    }
    if (this.targetCharacter && !(this.targetCharacter.isDead || this.targetCharacter.effects.isDisabled || this.targetCharacter.effects.isConverted) && (/** @type {MovingBehavior} */ (/** @type {unknown} */ (this))).repositionInsideRoom(a)) {
      this.ax = game.state.turnNumber;
      var b = a.position.room;
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
      a.actionType = 1;
      a.position.movementTargetCleared = false;
    }
  };
  RangedAttackBehavior.prototype.repositionInsideRoom = function (a) {
    var b = a.position,
      c = b.levelPosition,
      d = b.room,
      f = roomLeftPixels(d),
      g = roomTopPixels(d),
      h = roomRightPixels(d),
      l = roomBottomPixels(d);
    a = getOpponents(a);
    var n,
      p,
      s,
      u = 0;
    setVector(this.fleeDirection, 0, 0);
    setVector(this.kiteVector, 0, 0);
    for (s = 0; s < a.length; s++) {
      n = a[s];
      if (!(n.isDead || n.effects.isDisabled || n.effects.isConverted || n.position.room != d)) {
        p = n.position.levelPosition;
        n = c.distanceTo(p);
        if (!(n > this.CA)) {
          if (0 === n) {
            setVector(this.fleeDirection, Math.random(), Math.random());
          } else {
            assignVector(this.fleeDirection, c);
            subtractVector(this.fleeDirection, p);
            multiplyVector(this.fleeDirection, 1 / n);
          }
          addVector(this.kiteVector, this.fleeDirection);
          u++;
        }
      }
    }
    if (0 === u) {
      return false;
    }
    normalizeVector(this.kiteVector);
    multiplyVector(this.kiteVector, this.actionRange);
    addVector(this.kiteVector, c);
    c = this.kiteVector.x;
    d = this.kiteVector.y;
    if (c < f) {
      c = f;
    } else {
      if (c > h) {
        c = h;
      }
    }
    if (d < g) {
      d = g;
    } else {
      if (d > l) {
        d = l;
      }
    }
    setVector(b.moveTargetPoint, c, d);
    return true;
  };
  RangedAttackBehavior.prototype.getBehaviorScore = function (a) {
    this.targetCharacter = findNearestVisibleOpponent(a);
    return this.targetCharacter ? 2 < this.consecutiveAttackTurns ? this.consecutiveAttackTurns = 0 : a.position.levelPosition.distanceTo(this.targetCharacter.position.levelPosition) > this.CA ? 0 : this.priorityWeight : 0;
  };
  RangedAttackBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  MeleeAttackBehavior.prototype.resetBehaviorState = function () {};
  MeleeAttackBehavior.prototype.notifySpellLearned = function () {};
  MeleeAttackBehavior.prototype.execute = function (a) {
    if (this.targetCharacter && !this.targetCharacter.isDead) {
      a.setCombatTarget(this.targetCharacter);
      if (this.targetDistance <= this.actionRange) {
        if (!canAttack(a)) {
          return;
        }
        markAttackTurn(a);
        a.actionType = this.behaviorActionType;
      } else {
        choosePointNearTarget(a.position.moveTargetPoint, this.targetCharacter.position.levelPosition, a.position.room);
        a.actionType = 1;
      }
      var b = a.position.room;
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
      clearMovementTarget(a.position);
    }
  };
  MeleeAttackBehavior.prototype.getBehaviorScore = function (a) {
    if (!a.position.room) {
      return 0;
    }
    this.targetCharacter = this.YD ? findNearbyOpponent(a) : selectScrollTarget(a);
    if (!this.targetCharacter) {
      return 0;
    }
    this.targetDistance = a.position.levelPosition.distanceTo(this.targetCharacter.position.levelPosition);
    return this.priorityWeight;
  };
  MeleeAttackBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  LootGoldBehavior.prototype = new ExploreDungeonBehavior();
  LootGoldBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LootGoldBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 10 !== a.statusEffectTypeId)) {
      this.learnedSpell = a;
    }
  };
  LootGoldBehavior.prototype.performOnArrival = function (a) {
    var b;
    switch (randomInt(8)) {
      case 0:
        b = "嘿,傻兮兮的头!";
        break;
      case 1:
        b = "榆木脑袋!";
        break;
      case 2:
        b = "哟!屌丝!";
        break;
      case 3:
        b = "愚蠢的怪物!";
        break;
      case 4:
        b = "你弱爆了!";
        break;
      case 5:
        b = "屌丝!";
        break;
      case 6:
        b = "胆小鬼!";
        break;
      default:
        b = "嘿,蠢货!";
    }
    showFloatingText(game.floatingText, a, b, "white");
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
  LootGoldBehavior.prototype.selectTarget = function (a) {
    if (a.effects.hasStealthEffect || !hasOpponentsInRoom(a, a.position.room)) {
      return null;
    }
    var b = a.stats;
    return 0.8 > b.health / statValue(b.maxHealth) ? null : a;
  };
  OpportunisticAttackBehavior.prototype.resetBehaviorState = function () {
    this.targetCharacter = null;
    this.targetDistance = 0;
  };
  OpportunisticAttackBehavior.prototype.notifySpellLearned = function () {};
  OpportunisticAttackBehavior.prototype.execute = function (a) {
    if (this.targetCharacter && !this.targetCharacter.isDead) {
      a.setCombatTarget(this.targetCharacter);
      if (this.targetDistance <= this.actionRange) {
        if (!canAttack(a)) {
          return;
        }
        markAttackTurn(a);
        a.actionType = this.behaviorActionType;
      } else {
        choosePointNearTarget(a.position.moveTargetPoint, this.targetCharacter.position.levelPosition, a.position.room);
        a.actionType = 1;
      }
      var b = a.position.room;
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
      clearMovementTarget(a.position);
    }
  };
  OpportunisticAttackBehavior.prototype.getBehaviorScore = function (a) {
    this.targetCharacter = selectScrollTarget(a);
    if (!this.targetCharacter) {
      return 0;
    }
    if (a.effects.isStealthed) {
      this.actionRange = MELEE_ATTACK_RANGE;
      this.behaviorActionType = 2;
    } else {
      this.actionRange = RANGED_ATTACK_RANGE;
      this.behaviorActionType = MELEE_ACTION_TYPE;
    }
    this.targetDistance = a.position.levelPosition.distanceTo(this.targetCharacter.position.levelPosition);
    return this.priorityWeight;
  };
  OpportunisticAttackBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  LootItemBehavior.prototype = new ExploreDungeonBehavior();
  LootItemBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LootItemBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 11 !== a.statusEffectTypeId)) {
      this.learnedSpell = a;
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
  LootItemBehavior.prototype.selectTarget = function (a) {
    return a.effects.isStealthed || !hasOpponentsInRoom(a, a.position.room) ? null : a;
  };
  LootScrollBehavior.prototype = new ExploreDungeonBehavior();
  LootScrollBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LootScrollBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 12 !== a.statusEffectTypeId)) {
      this.learnedSpell = a;
    }
  };
  LootScrollBehavior.prototype.performOnArrival = function (a) {
    var b;
    switch (randomInt(8)) {
      case 0:
        b = "杀戮!";
        break;
      case 1:
        b = "去死!";
        break;
      case 2:
        b = "万物皆杀!";
        break;
      case 3:
        b = "啊啊啊啊啊!";
        break;
      case 4:
        b = "凶手!";
        break;
      case 5:
        b = "怒了!";
        break;
      case 6:
        b = "我真的怒了.";
        break;
      default:
        b = "杀!";
    }
    showFloatingText(game.floatingText, a, b, "white");
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
  LootScrollBehavior.prototype.selectTarget = function (a) {
    return a.effects.Vs || !hasOpponentsInRoom(a, a.position.room) ? null : a;
  };
  GuardRangedBehavior.prototype.resetBehaviorState = function () {
    (/** @type {RangedAttackBehavior & RangedBehaviorMethods} */ (/** @type {unknown} */ (this.Vq))).resetBehaviorState();
  };
  GuardRangedBehavior.prototype.notifySpellLearned = function () {};
  GuardRangedBehavior.prototype.execute = function (a) {
    (/** @type {RangedAttackBehavior & RangedBehaviorMethods} */ (/** @type {unknown} */ (this.Vq))).execute(a);
  };
  GuardRangedBehavior.prototype.getBehaviorScore = function (a) {
    return a.effects.isStealthed ? 0 : (/** @type {RangedAttackBehavior & RangedBehaviorMethods} */ (/** @type {unknown} */ (this.Vq))).getBehaviorScore(a);
  };
  GuardRangedBehavior.prototype.getPriority = function () {
    return (/** @type {RangedAttackBehavior & RangedBehaviorMethods} */ (/** @type {unknown} */ (this.Vq))).getPriority();
  };
  TargetSpellBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  TargetSpellBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  TargetSpellBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 6 !== a.spellCategoryId)) {
      this.learnedSpell = a;
    }
  };
  TargetSpellBehavior.prototype.execute = function (a) {
    if (this.learnedSpell && canAttack(a) && isSpellReady(this.learnedSpell)) {
      if (a.setCombatTarget(this.targetCharacter), this.targetDistance <= this.actionRange) {
        if (canAttack(a)) {
          markAttackTurn(a);
          this.learnedSpell.lastCastTurn = game.state.turnNumber;
          a.spellToCast = this.learnedSpell;
          a.actionType = CAST_ACTION_TYPE;
          clearMovementTarget(a.position);
          var b = a.position.room;
          if (b && isAdventurerOrMinion(a)) {
            forcePartyDestination(b);
          }
        }
      } else {
        assignVector(a.position.moveTargetPoint, this.targetCharacter.position.levelPosition);
        a.actionType = 1;
      }
    }
  };
  TargetSpellBehavior.prototype.getBehaviorScore = function (a) {
    if (!this.learnedSpell || !isSpellReady(this.learnedSpell) || !a.position.room) {
      return 0;
    }
    if (!freeSpellsModifier.currentValue) {
      var b = a.stats,
        c = b.spirit,
        spellCost = getSpellSpiritCost(b);
      if (c < spellCost) {
        return 0;
      }
    }
    return (this.targetCharacter = selectScrollTarget(a)) ? this.priorityWeight : 0;
  };
  HealBehavior.prototype = new ExploreDungeonBehavior();
  HealBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  HealBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 5 !== a.spellCategoryId)) {
      this.learnedSpell = a;
    }
  };
  HealBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  HealBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  HealBehavior.prototype.getFinalScore = function (a) {
    a = getOpponents(a);
    return 0 === a.length ? 0 : Math.min((/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority(), 5 / a.length * (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority());
  };
  HealBehavior.prototype.selectTarget = function (a) {
    return selectScrollTarget(a);
  };
  ApplyEffectBehavior.prototype = new ExploreDungeonBehavior();
  ApplyEffectBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  ApplyEffectBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || a.statusEffectTypeId !== this.statusEffectTypeId)) {
      this.learnedSpell = a;
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
  ApplyEffectBehavior.prototype.selectTarget = function (a) {
    return selectScrollTarget(a);
  };
  AreaDamageBehavior.prototype = new ExploreDungeonBehavior();
  AreaDamageBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  AreaDamageBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 8 !== a.spellCategoryId)) {
      this.learnedSpell = a;
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
  AreaDamageBehavior.prototype.selectTarget = function (a) {
    return selectScrollTarget(a);
  };
  ChainDamageBehavior.prototype = new ExploreDungeonBehavior();
  ChainDamageBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  ChainDamageBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 12 !== a.spellCategoryId)) {
      this.learnedSpell = a;
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
  ChainDamageBehavior.prototype.selectTarget = function (a) {
    return selectScrollTarget(a);
  };
  SummonBehavior.prototype = new ExploreDungeonBehavior();
  SummonBehavior.prototype.resetBehaviorState = function () {
    this.spell = null;
  };
  SummonBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.spell || a.spellCategoryId !== this.expectedSpellCategoryId)) {
      this.spell = a;
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
  SummonBehavior.prototype.selectTarget = function (a) {
    return selectScrollTarget(a);
  };
  LifeDrainBehavior.prototype = new ExploreDungeonBehavior();
  LifeDrainBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LifeDrainBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 1 !== a.spellCategoryId)) {
      this.learnedSpell = a;
    }
  };
  LifeDrainBehavior.prototype.getFinalScore = function () {
    var a = (/** @type {LifeDrainBehavior & { selectedTarget: import("../characters/character.js").Character }} */ (/** @type {unknown} */ (this))).selectedTarget;
    return Math.max(0, (1 - a.stats.health / statValue(a.stats.maxHealth)) * (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority());
  };
  LifeDrainBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  LifeDrainBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  LifeDrainBehavior.prototype.selectTarget = function (a) {
    var b = null,
      c = 1,
      d = getFriendlyTargets(a),
      f,
      g,
      h;
    for (a = 0; a < d.length; a++) {
      if (f = d[a], h = f.stats, g = h.health, h = statValue(h.maxHealth), g !== h && (g /= h, !b || g < c)) {
        c = g;
        b = f;
      }
    }
    return 0.9 < c ? null : b;
  };
  ReviveBehavior.prototype = new ExploreDungeonBehavior();
  ReviveBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  ReviveBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 16 !== a.spellCategoryId)) {
      this.learnedSpell = a;
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
  ReviveBehavior.prototype.selectTarget = function (a) {
    var b,
      c = game.state.adventurers,
      d;
    for (b = 0; b < c.length; b++) {
      if (d = c[b], d !== a && d.effects.isStunned) {
        return d;
      }
    }
    return null;
  };
  PartyBuffBehavior.prototype = new ExploreDungeonBehavior();
  PartyBuffBehavior.prototype.resetBehaviorState = function () {
    this.spell = null;
  };
  PartyBuffBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.spell || a.statusEffectTypeId !== this.statusEffectTypeId)) {
      this.spell = a;
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
  PartyBuffBehavior.prototype.selectTarget = function (a) {
    return a;
  };
  WaitBehavior.prototype.resetBehaviorState = function () {};
  WaitBehavior.prototype.notifySpellLearned = function () {};
  WaitBehavior.prototype.execute = function (a) {
    if (!isPartyTravelling(game.state.party) || !hasForcedDestination(a)) {
      var b = game.state.party,
        c = b.destinationRoom,
        d = b.targetDoor,
        b = b.targetRoom,
        f = a.position;
      if (d && d != f.targetDoor) {
        var g = findRouteToDoor(a, d);
        f.routeQueue = g;
        f.movementTargetCleared = false;
      } else {
        if (b && b != f.targetRoom) {
          g = findRouteToRoom(a, b.leadsTo);
          f.routeQueue = g;
          f.movementTargetCleared = false;
        } else {
          if (c && c != f.destinationRoom) {
            g = findRouteToRoom(a, c);
            f.routeQueue = g;
            f.movementTargetCleared = false;
          }
        }
      }
      f.et(d);
      f.destinationRoom = c;
      f.setTargetRoom(b);
      if (d) {
        setVector(f.moveTargetPoint, d.pixelColumn, d.pixelRow);
        a.actionType = 1;
      } else {
        if (b) {
          setVector(f.moveTargetPoint, b.pixelColumn, b.pixelRow);
          a.actionType = 1;
        } else {
          if (c) {
            a.actionType = 1;
          }
        }
      }
    }
  };
  WaitBehavior.prototype.getBehaviorScore = function (a) {
    if (game.worldActive || isPartyTravelling(game.state.party) && hasForcedDestination(a)) {
      return 0;
    }
    var b = getOpponents(a);
    return 0 < b.length && a.position.room === b[0].position.room ? 0 : this.eo;
  };
  WaitBehavior.prototype.getPriority = function () {
    return this.eo;
  };
  LootChestBehavior.prototype = new ExploreDungeonBehavior();
  LootChestBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LootChestBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 14 !== a.spellCategoryId)) {
      this.learnedSpell = a;
    }
  };
  LootChestBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  LootChestBehavior.prototype.getFinalScore = function (a) {
    return hasOpponentsInRoom(a, a.position.room) ? 0 : hasPendingLoot() ? (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority() : 0;
  };
  LootChestBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  LootChestBehavior.prototype.selectTarget = function (a) {
    return hasPendingLoot() ? a : null;
  };
  LootPotionBehavior.prototype = new ExploreDungeonBehavior();
  LootPotionBehavior.prototype.resetBehaviorState = function () {
    this.learnedSpell = null;
  };
  LootPotionBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.learnedSpell || 15 !== a.spellCategoryId)) {
      this.learnedSpell = a;
    }
  };
  LootPotionBehavior.prototype.canExecute = function () {
    return this.learnedSpell && isSpellReady(this.learnedSpell);
  };
  LootPotionBehavior.prototype.getFinalScore = function (a) {
    var b = a.position.room;
    if (!b || hasOpponentsInRoom(a, b)) {
      return 0;
    }
    a = getRoomTreasure(game.treasure, b);
    return !a || a.opened || a.selected ? 0 : (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  LootPotionBehavior.prototype.getActionTarget = function () {
    return this.learnedSpell;
  };
  LootPotionBehavior.prototype.selectTarget = function (a) {
    return a;
  };
  UseShopBehavior.prototype.resetBehaviorState = function () {
    this.goldDrop = null;
  };
  UseShopBehavior.prototype.notifySpellLearned = function () {};
  UseShopBehavior.prototype.execute = function (a) {
    if (this.goldDrop) {
      if (this.goldDrop.collected) {
        this.goldDrop = null;
      } else if (this.goldDrop.claimedBy == a) {
        a.targetGoldDrop = this.goldDrop;
        if (distanceToPoint(a.position.levelPosition, this.goldDrop.levelPositionX, this.goldDrop.levelPositionY) < this.pickupRadius) {
          a.actionType = 5;
        } else {
          setVector(a.position.moveTargetPoint, this.goldDrop.levelPositionX, this.goldDrop.levelPositionY);
          a.actionType = 1;
        }
        clearMovementTarget(a.position);
        var b = a.position.room;
        if (b && isAdventurerOrMinion(a)) {
          forcePartyDestination(b);
        }
      }
    }
  };
  UseShopBehavior.prototype.getBehaviorScore = function (a) {
    var b = a.position.room;
    if (!b || hasOpponentsInRoom(a, b)) {
      return 0;
    }
    if (this.goldDrop && this.goldDrop.claimedBy === a) {
      this.goldDrop.setClaimedBy(null);
      this.goldDrop.setClaimDistance(0);
    }
    var b = game.goldDrops.drops,
      c,
      d,
      f = a.position.levelPosition,
      g = null,
      h,
      l = a.position.room,
      n = -1;
    if (l) {
      for (d = 0; d < b.length; d++) {
        c = b[d];
        if (!(c.collected || c.vD !== l)) {
          h = distanceSquaredToPoint(f, c.levelPositionX, c.levelPositionY);
          if (!(c.claimedBy && h > c.getClaimDistance() || !(0 > n || h < n))) {
            g = c;
            n = h;
          }
        }
      }
      if (this.goldDrop = g) {
        this.goldDrop.setClaimedBy(a);
        this.goldDrop.setClaimDistance(n);
        this.cachedDropDistance = Math.sqrt(n);
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
  EnterDungeonBehavior.prototype.execute = function (a) {
    if (this.scrollDrop) {
      if (this.scrollDrop.collected) {
        this.scrollDrop = null;
      } else if (this.scrollDrop.claimedBy == a) {
        a.targetScrollDrop = this.scrollDrop;
        if (distanceToPoint(a.position.levelPosition, this.scrollDrop.levelPositionX, this.scrollDrop.levelPositionY) < this.pickupRadius) {
          a.actionType = 7;
        } else {
          setVector(a.position.moveTargetPoint, this.scrollDrop.levelPositionX, this.scrollDrop.levelPositionY);
          a.actionType = 1;
        }
        clearMovementTarget(a.position);
        var b = a.position.room;
        if (b && isAdventurerOrMinion(a)) {
          forcePartyDestination(b);
        }
      }
    }
  };
  EnterDungeonBehavior.prototype.getBehaviorScore = function (a) {
    var b = a.position.room;
    if (!b || hasOpponentsInRoom(a, b)) {
      return 0;
    }
    if (this.scrollDrop && this.scrollDrop.claimedBy === a) {
      this.scrollDrop.setClaimedBy(null);
      this.scrollDrop.setClaimDistance(0);
    }
    var b = game.scrollDrops.drops,
      c,
      d,
      f = a.position.levelPosition,
      g = null,
      h,
      l = a.position.room,
      n = -1;
    if (l) {
      for (d = 0; d < b.length; d++) {
        c = b[d];
        if (!(c.collected || c.BE !== l)) {
          h = distanceSquaredToPoint(f, c.levelPositionX, c.levelPositionY);
          if (!(c.claimedBy && h > c.getClaimDistance() || !(0 > n || h < n))) {
            g = c;
            n = h;
          }
        }
      }
      if (this.scrollDrop = g) {
        this.scrollDrop.setClaimedBy(a);
        this.scrollDrop.setClaimDistance(n);
        this.cachedDropDistance = Math.sqrt(n);
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
  EnterCastleBehavior.prototype.execute = function (a) {
    if (this.potionDrop) {
      if (this.potionDrop.collected) {
        this.potionDrop = null;
      } else if (this.potionDrop.claimedBy == a) {
        a.targetPotionDrop = this.potionDrop;
        if (distanceToPoint(a.position.levelPosition, this.potionDrop.levelPositionX, this.potionDrop.levelPositionY) < this.pickupRadius) {
          a.actionType = 8;
        } else {
          setVector(a.position.moveTargetPoint, this.potionDrop.levelPositionX, this.potionDrop.levelPositionY);
          a.actionType = 1;
        }
        clearMovementTarget(a.position);
        var b = a.position.room;
        if (b && isAdventurerOrMinion(a)) {
          forcePartyDestination(b);
        }
      }
    }
  };
  EnterCastleBehavior.prototype.getBehaviorScore = function (a) {
    var b = a.position.room;
    if (!b || hasOpponentsInRoom(a, b)) {
      return 0;
    }
    if (this.potionDrop && this.potionDrop.claimedBy === a) {
      this.potionDrop.setClaimedBy(null);
      this.potionDrop.setClaimDistance(0);
    }
    var b = game.potionDrops.drops,
      c,
      d,
      f = a.position.levelPosition,
      g = null,
      h,
      l = a.position.room,
      n = -1;
    if (l) {
      for (d = 0; d < b.length; d++) {
        c = b[d];
        if (!(c.collected || c.oE !== l)) {
          h = distanceSquaredToPoint(f, c.levelPositionX, c.levelPositionY);
          if (!(c.claimedBy && h > c.getClaimDistance() || !(0 > n || h < n))) {
            g = c;
            n = h;
          }
        }
      }
      if (this.potionDrop = g) {
        this.potionDrop.setClaimedBy(a);
        this.potionDrop.setClaimDistance(n);
        this.cachedDropDistance = Math.sqrt(n);
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
  TravelWorldBehavior.prototype.execute = function (a) {
    if (this.itemDrop) {
      if (this.itemDrop.collected) {
        this.itemDrop = null;
      } else if (this.itemDrop.claimedBy == a) {
        a.targetItemDrop = this.itemDrop;
        if (distanceToPoint(a.position.levelPosition, this.itemDrop.levelPositionX, this.itemDrop.levelPositionY) < this.pickupRadius) {
          a.actionType = 6;
        } else {
          setVector(a.position.moveTargetPoint, this.itemDrop.levelPositionX, this.itemDrop.levelPositionY);
          a.actionType = 1;
        }
        clearMovementTarget(a.position);
        var b = a.position.room;
        if (b && isAdventurerOrMinion(a)) {
          forcePartyDestination(b);
        }
      }
    }
  };
  TravelWorldBehavior.prototype.getBehaviorScore = function (a) {
    var b = a.position.room;
    if (!b || hasOpponentsInRoom(a, b)) {
      return 0;
    }
    if (this.itemDrop && this.itemDrop.claimedBy === a) {
      this.itemDrop.setClaimedBy(null);
      this.itemDrop.setClaimDistance(0);
    }
    var b = game.itemDrops.drops,
      c,
      d,
      f = a.position.levelPosition,
      g = null,
      h,
      l = a.position.room,
      n = -1;
    if (l) {
      for (d = 0; d < b.length; d++) {
        c = b[d];
        if (!(c.collected || c.PD !== l)) {
          h = distanceSquaredToPoint(f, c.levelPositionX, c.levelPositionY);
          if (!(c.claimedBy && h > c.getClaimDistance() || !(0 > n || h < n))) {
            g = c;
            n = h;
          }
        }
      }
      if (this.itemDrop = g) {
        this.itemDrop.setClaimedBy(a);
        this.itemDrop.setClaimDistance(n);
        this.cachedDropDistance = Math.sqrt(n);
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
  ChangeFloorBehavior.prototype.execute = function (a) {
    if (this.treasureChest && !this.treasureChest.opened) {
      a.setTargetTreasureChest(this.treasureChest);
      if (distanceToPoint(a.position.levelPosition, this.treasureChest.levelX, this.treasureChest.levelY) < this.pickupRadius) {
        a.actionType = 12;
      } else {
        setVector(a.position.moveTargetPoint, this.treasureChest.levelX, this.treasureChest.levelY);
        a.actionType = 1;
      }
      clearMovementTarget(a.position);
      var b = a.position.room;
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
    }
  };
  ChangeFloorBehavior.prototype.getBehaviorScore = function (a) {
    var b = a.position.room;
    if (!b) {
      return 0;
    }
    this.treasureChest = getRoomTreasure(game.treasure, b);
    return !this.treasureChest || this.treasureChest.opened || !this.treasureChest.selected || hasOpponentsInRoom(a, b) ? 0 : this.priorityWeight;
  };
  ChangeFloorBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  SelfSpellBehavior.prototype = new ExploreDungeonBehavior();
  SelfSpellBehavior.prototype.resetBehaviorState = function () {
    this.spell = null;
  };
  SelfSpellBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.spell || 9 !== a.spellCategoryId)) {
      this.spell = a;
    }
  };
  SelfSpellBehavior.prototype.performOnArrival = function (a) {
    showFloatingText(game.floatingText, a, "Protect me", "white");
  };
  SelfSpellBehavior.prototype.canExecute = function (a) {
    return this.spell && isSpellReady(this.spell) && !a.companion ? true : false;
  };
  SelfSpellBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  SelfSpellBehavior.prototype.getActionTarget = function () {
    return this.spell;
  };
  SelfSpellBehavior.prototype.selectTarget = function (a) {
    return a;
  };
  AreaSpellBehavior.prototype = new ExploreDungeonBehavior();
  AreaSpellBehavior.prototype.resetBehaviorState = function () {
    this.spell = null;
  };
  AreaSpellBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.spell || a.spellCategoryId !== this.KE)) {
      this.spell = a;
    }
  };
  AreaSpellBehavior.prototype.canExecute = function (a) {
    if (!this.spell || !isSpellReady(this.spell)) {
      return false;
    }
    var b = a.stats.maxSummonedMinions;
    return countSummonedMinions(a) < b;
  };
  AreaSpellBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  AreaSpellBehavior.prototype.getActionTarget = function () {
    return this.spell;
  };
  AreaSpellBehavior.prototype.selectTarget = function (a) {
    return a;
  };
  CompanionSpellBehavior.prototype = new ExploreDungeonBehavior();
  CompanionSpellBehavior.prototype.resetBehaviorState = function () {
    this.spell = null;
  };
  CompanionSpellBehavior.prototype.notifySpellLearned = function (a) {
    if (!(this.spell || 11 !== a.spellCategoryId)) {
      this.spell = a;
    }
  };
  CompanionSpellBehavior.prototype.canExecute = function (a) {
    if (!this.spell || !isSpellReady(this.spell)) {
      return false;
    }
    var b = a.position.room;
    if (!b) {
      return false;
    }
    var c = game.monsters.defeatedMonsters;
    if (!c || 0 === c.length) {
      return false;
    }
    var d,
      f = false;
    for (d = 0; d < c.length; d++) {
      if (c[d].position.room === b) {
        f = true;
        break;
      }
    }
    if (!f) {
      return false;
    }
    b = a.stats.maxSummonedMinions;
    return countSummonedMinions(a) < b;
  };
  CompanionSpellBehavior.prototype.getFinalScore = function () {
    return (/** @type {PrioritizedBehavior} */ (/** @type {unknown} */ (this))).getPriority();
  };
  CompanionSpellBehavior.prototype.getActionTarget = function () {
    return this.spell;
  };
  CompanionSpellBehavior.prototype.selectTarget = function (a) {
    var b = game.monsters.defeatedMonsters;
    if (0 === b.length) {
      return null;
    }
    var c = a.position.room;
    if (!c) {
      return null;
    }
    var d,
      f = a.position.levelPosition,
      g = null,
      h,
      l = -1;
    for (d = 0; d < b.length; d++) {
      if (a = b[d], a.position.room === c && (h = f.squaredDistanceTo(a.position.levelPosition), 0 > l || h < l)) {
        g = a;
        l = h;
      }
    }
    return g;
  };
  CooldownBehavior.prototype.resetBehaviorState = function () {};
  CooldownBehavior.prototype.notifySpellLearned = function () {};
  CooldownBehavior.prototype.execute = function (a) {
    choosePointNearTarget(a.position.moveTargetPoint, a.summoner.position.levelPosition, a.position.room);
    a.actionType = 1;
    clearMovementTarget(a.position);
  };
  CooldownBehavior.prototype.getBehaviorScore = function (a) {
    if (game.worldActive) {
      return 0;
    }
    var b = a.position;
    a = a.summoner.position;
    return !b.room || !a.room || b.room !== a.room || b.levelPosition.distanceTo(a.levelPosition) < this.Uw ? 0 : this.priorityWeight;
  };
  CooldownBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  SpecialAttackBehavior.prototype.resetBehaviorState = function () {};
  SpecialAttackBehavior.prototype.notifySpellLearned = function () {};
  SpecialAttackBehavior.prototype.execute = function (a) {
    if (this.targetCharacter && !this.targetCharacter.isDead) {
      a.setCombatTarget(this.targetCharacter);
      if (this.targetDistance <= this.actionRange) {
        if (!canAttack(a)) {
          return;
        }
        markAttackTurn(a);
        a.actionType = this.behaviorActionType;
      } else {
        choosePointNearTarget(a.position.moveTargetPoint, this.targetCharacter.position.levelPosition, a.position.room);
        a.actionType = 1;
      }
      var b = a.position.room;
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
      clearMovementTarget(a.position);
    }
  };
  SpecialAttackBehavior.prototype.getBehaviorScore = function (a) {
    if (game.worldActive) {
      return 0;
    }
    var b = a.summoner;
    a = a.position;
    var c = b.position;
    if (!a.room || !c.room || a.room !== c.room) {
      return 0;
    }
    this.targetCharacter = selectScrollTarget(b);
    if (!this.targetCharacter) {
      return 0;
    }
    b = this.targetCharacter.position.levelPosition;
    if (c.levelPosition.distanceTo(b) > this.Uw) {
      return 0;
    }
    this.targetDistance = a.levelPosition.distanceTo(b);
    return this.priorityWeight;
  };
  SpecialAttackBehavior.prototype.getPriority = function () {
    return this.priorityWeight;
  };
  StunnedBehavior.prototype.resetBehaviorState = function () {};
  StunnedBehavior.prototype.notifySpellLearned = function () {};
  StunnedBehavior.prototype.execute = function (a) {
    var b = a.position;
    if (b.room) {
      var c = b.room,
        d = b.moveTargetPoint;
      assignVector(d, b.levelPosition);
      clampPointToRoom(c, d, game.tileSize + 1);
      b.movementTargetCleared = false;
      b.movementTargetCleared = false;
      a.actionType = 1;
    }
  };
  StunnedBehavior.prototype.getBehaviorScore = function (a) {
    if (game.worldActive) {
      return 0;
    }
    var b = a.position;
    if (b.routeQueue && 0 < b.routeQueue.length || b.targetDoor || b.targetRoom || b.destinationRoom) {
      return 0;
    }
    a = b.room;
    if (!a) {
      return 0;
    }
    b = b.levelPosition;
    return isPointNearDoor(a, b) || a.stairs && distanceToPoint(b, a.stairs.pixelColumn, a.stairs.pixelRow) < game.tileSize ? this.eo : 0;
  };
  StunnedBehavior.prototype.getPriority = function () {
    return this.eo;
  };
}
