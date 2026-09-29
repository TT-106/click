/** 逐帧与逐回合推进。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { getAllies, getMonsters, getOpponents } from "../combat/encounters.js";
import { statValue } from "../characters/stats.js";
import { FRAME_DURATION_MS, addVector, assignVector, floorNumber, multiplyVector, normalizeVector, randomInt, recordGameEvent, setVector, subtractVector, vectorLength } from "../core/math.js";
import { autoScrollsModifier, farmKillsModifier, fasterFarmingModifier, fasterInfestationModifier, healthRegenerationBonus, potionDurationBonus, potionDurationModifier, potionPowerBonus, spiritRegenerationBonus, upgradeCollections } from "../content/balance.js";
import { updateCharacterEffects } from "../characters/effects.js";
import { setPotionActive } from "../combat/potions.js";
import { Spell, castScroll } from "../combat/scrolls.js";
import { Farm, registerDungeonFarm, registerFarm, sortDungeons } from "../world/dungeons.js";
import { getAchievementCheckData, getAchievementProgress, hasVictoryAchievement } from "../progression/achievements.js";
import { clampPointToRoom, setTileEffect } from "../world/rooms.js";
import { updateCharacter } from "../characters/character.js";
import { TARGETED_EFFECT, VisualEffect, addVisualEffect, advanceEffectFrame, directionScratchVector, getEffectDirection } from "../rendering/sprites.js";
import { CombatAction, advanceCombatAction, calculateAttackDamage, enqueueCombatAction, findTargetsInRange, resolveCharacterDefeat } from "../combat/actions.js";
import { applySeparationForce } from "../characters/movement.js";
import { blastStunSpell } from "../content/spells.js";
import { showDamageText } from "../rendering/floating-text.js";
import { isBetterItem } from "../loot/items.js";
import { sortInventory } from "../loot/inventory.js";
import { refreshUpgradeCollection } from "../progression/upgrades.js";
import { repositionWorldBlock, worldBlockContains } from "../world/terrain.js";
import { IDLE_ACTION } from "../ai/targeting.js";
import { spendGold } from "../characters/party.js";
export function advanceSimulation(simulationUnits) {
  var lifecycle = game.lifecycle;
  lifecycle.turnTimeAccumulator += simulationUnits;
  if (15 <= lifecycle.turnTimeAccumulator) {
    game.state.turnNumber++;
    lifecycle.turnTimeAccumulator -= 15;
    lifecycle.regenTurnCounter++;
    if (lifecycle.regenTurnCounter >= lifecycle.regenIntervalTurns) {
      lifecycle.regenTurnCounter = 0;
      var allyIndex,
        allies = getAllies();
      for (allyIndex = 0; allyIndex < allies.length; allyIndex++) {
        var allyStats = allies[allyIndex].stats,
          maxHealth = statValue(allyStats.maxHealth);
        if (allyStats.health < maxHealth) {
          var healthRegen = Math.max(1, floorNumber(maxHealth * (allyStats.baseHealthRegenPercent + allyStats.healthRegenBonus + healthRegenerationBonus.currentValue) / 100));
          allyStats.health = Math.min(maxHealth, allyStats.health + healthRegen);
        }
        var maxSpirit = statValue(allyStats.maxSpirit);
        if (allyStats.spirit < maxSpirit) {
          var spiritRegen = Math.max(1, floorNumber(maxSpirit * (allyStats.baseSpiritRegenPercent + allyStats.spiritRegenBonus + spiritRegenerationBonus.currentValue) / 100));
          allyStats.spirit = Math.min(maxSpirit, allyStats.spirit + spiritRegen);
        }
      }
    }
    var minionList = game.minions.minionList,
      minion,
      summoner,
      y,
      lifetimeTurns,
      minionIndex;
    for (minionIndex = minionList.length - 1; 0 <= minionIndex; minionIndex--) {
      minion = minionList[minionIndex];
      summoner = minion.summoner;
      if (summoner.isDead) {
        showDeathEffect(minion);
        game.lifecycle.despawnMinion(minion);
      } else {
        y = minion.summonedAtTurn;
        lifetimeTurns = minion.lifetimeTurns;
        if (!(0 > lifetimeTurns)) {
          if (y > game.state.turnNumber) {
            console.log("minion bug: start turn in future.");
          } else {
            if (game.state.turnNumber - y > lifetimeTurns) {
              showDeathEffect(minion);
              game.lifecycle.despawnMinion(minion);
            }
          }
        }
      }
    }
    var monstersWithEffects = getMonsters(),
      allyList = getAllies(),
      effectTargetIndex;
    for (effectTargetIndex = 0; effectTargetIndex < allyList.length; effectTargetIndex++) {
      updateCharacterEffects(allyList[effectTargetIndex].effects, true, game.state.turnNumber);
    }
    for (effectTargetIndex = 0; effectTargetIndex < monstersWithEffects.length; effectTargetIndex++) {
      updateCharacterEffects(monstersWithEffects[effectTargetIndex].effects, false, game.state.turnNumber);
    }
    game.state.statisticsRecorder.recordTurn();
    var party = game.state.party;
    if (game.worldActive) {
      party.updateWorldMode();
    } else {
      party.forcedTravelActive = false;
      party.forcedDestinationRoom = null;
      party.travellingToDisabledAlly = false;
      party.updateDungeonMode();
    }
    if (!game.worldActive) {
      game.goldDrops.releaseClaims();
      game.scrollDrops.releaseClaims();
      game.potionDrops.releaseClaims();
      game.itemDrops.releaseClaims();
    }
    updateCharacterBehaviors(getAllies());
    updateCharacterBehaviors(getMonsters());
    var x = game.potions,
      z = 0 === game.state.turnNumber % 3,
      potionIndex,
      potion,
      expiredPotionIndex,
      activationTurn,
      potionDurationTurns = 800 + potionDurationBonus.currentValue;
    for (potionIndex = x.potionList.length - 1; 0 <= potionIndex; potionIndex--) {
      potion = x.potionList[potionIndex];
      if (potion.active) {
        activationTurn = potion.activationTurn;
        if (z && potionDurationModifier.currentValue && activationTurn < game.state.turnNumber) {
          activationTurn++;
          potion.activationTurn = activationTurn;
        }
        if (game.state.turnNumber - activationTurn >= potionDurationTurns) {
          setPotionActive(potion, false);
          expiredPotionIndex = x.potionList.indexOf(potion);
          if (-1 < expiredPotionIndex) {
            x.potionList.splice(expiredPotionIndex, 1);
          }
        }
      }
    }
    if (autoScrollsModifier.currentValue && 0 < getMonsters().length && (lifecycle.autoScrollTurnCounter++, lifecycle.autoScrollTurnCounter >= lifecycle.autoScrollInterval)) {
      lifecycle.autoScrollTurnCounter = 0;
      var unlockedScrolls = game.scrolls.unlockedScrolls;
      if (lifecycle.autoScrollIndex >= unlockedScrolls.length) {
        lifecycle.autoScrollIndex = 0;
      }
      positionScrollCaster(lifecycle.autoScrollIndex);
      castScroll(unlockedScrolls[lifecycle.autoScrollIndex], true);
      lifecycle.autoScrollIndex++;
      if (lifecycle.autoScrollIndex >= unlockedScrolls.length) {
        lifecycle.autoScrollIndex = 0;
      }
    }
    lifecycle.dungeonRespawnTurnCounter++;
    if (lifecycle.dungeonRespawnTurnCounter >= lifecycle.dungeonRespawnIntervalTurns) {
      lifecycle.dungeonRespawnTurnCounter = 0;
      var dungeons = game.dungeons,
        clearedDungeonIndex,
        dungeon,
        dungeonReinfested = false,
        attackableIndex,
        turnNumber = game.state.turnNumber;
      for (clearedDungeonIndex = 0; clearedDungeonIndex < dungeons.cleared.length; clearedDungeonIndex++) {
        dungeon = dungeons.cleared[clearedDungeonIndex];
        if (1500 <= turnNumber - dungeon.clearedTurn) {
          dungeonReinfested = true;
          dungeon.cleared = false;
          dungeon.clearedTurn = 0;
        }
      }
      if (dungeonReinfested) {
        for (clearedDungeonIndex = dungeons.cleared.length - 1; 0 <= clearedDungeonIndex; clearedDungeonIndex--) {
          dungeon = dungeons.cleared[clearedDungeonIndex];
          if (!dungeon.cleared) {
            dungeons.cleared.splice(clearedDungeonIndex, 1);
            if (dungeon.discovered && !dungeon.cleared) {
              attackableIndex = dungeons.attackable.indexOf(dungeon);
              if (0 > attackableIndex) {
                dungeons.attackable.push(dungeon);
              }
            }
          }
        }
        sortDungeons(dungeons, dungeons.attackable);
      }
      var clearedTurn,
        farmStartTurn,
        fasterFarming = fasterFarmingModifier.currentValue,
        fasterInfestation = fasterInfestationModifier.currentValue,
        farmKillAward = (100 + potionPowerBonus.currentValue) * farmKillsModifier.currentValue;
      for (var farmDungeonIndex = 0; farmDungeonIndex < dungeons.farms.length; farmDungeonIndex++) {
        var farmDungeon = dungeons.farms[farmDungeonIndex];
        clearedTurn = farmDungeon.clearedTurn;
        farmStartTurn = farmDungeon.farmStartTurn;
        if (clearedTurn > turnNumber) {
          clearedTurn = 0;
          farmDungeon.clearedTurn = clearedTurn;
        }
        if (farmStartTurn > turnNumber) {
          farmStartTurn = 0;
          farmDungeon.farmStartTurn = farmStartTurn;
        }
        if (farmDungeon.cleared) {
          if (fasterInfestation) {
            clearedTurn -= 2;
            farmDungeon.clearedTurn = clearedTurn;
          }
          if (1500 <= turnNumber - clearedTurn) {
            farmDungeon.cleared = false;
            farmDungeon.farmStartTurn = turnNumber;
          }
        } else {
          if (fasterFarming) {
            farmStartTurn -= 2;
            farmDungeon.farmStartTurn = farmStartTurn;
          }
          if (1200 <= turnNumber - farmStartTurn) {
            dungeons.pendingFarmKills += farmKillAward;
            farmDungeon.cleared = true;
            farmDungeon.clearedTurn = turnNumber;
          }
        }
      }
    }
    lifecycle.achievementCheckTurnCounter++;
    if (lifecycle.achievementCheckTurnCounter >= lifecycle.achievementCheckIntervalTurns) {
      lifecycle.achievementCheckTurnCounter = 0;
      var achievements = game.state.achievements,
        achievementIndex,
        achievement,
        // 一次取好判定数据：待判定成就最多 328 条，逐条现取会为每条各建一个对象（实测每回合 +0.02ms）。
        // 取值本身不受本次判定影响（lifetimeStatistics/victoryStatistics 是稳定引用），故提升到循环外是等价的。
        achievementData = getAchievementCheckData();
      for (achievementIndex = achievements.obtainedList.length - 1; 0 <= achievementIndex; achievementIndex--) {
        var achievementCandidate = achievement = achievements.obtainedList[achievementIndex];
        if (!achievementCandidate.obtained) {
          achievementCandidate.obtained = achievementCandidate.isVictoryAchievement ? hasVictoryAchievement(achievementCandidate, achievementData) : getAchievementProgress(achievementCandidate, achievementData) >= achievementCandidate.requiredCount;
        }
        if (achievementCandidate.obtained) {
          achievements.obtainedList.splice(achievementIndex, 1);
          achievements.claimQueue.push(achievement);
        }
      }
      for (achievementIndex = achievements.claimQueue.length - 1; 0 <= achievementIndex; achievementIndex--) {
        achievement = achievements.claimQueue[achievementIndex];
        if (achievement.applied) {
          achievements.claimQueue.splice(achievementIndex, 1);
        }
      }
    }
  }
  game.state.frameNumber++;
  var monstersToSteer = getMonsters(),
    monsterPosition,
    monsterIndex;
  for (monsterIndex = 0; monsterIndex < monstersToSteer.length; monsterIndex++) {
    if (monsterPosition = monstersToSteer[monsterIndex].position, null != monsterPosition.steeringVector) {
      var steeringPosition = monsterPosition;
      if (steeringPosition.steeringVector) {
        var steeringStepDistance = steeringPosition.dungeonWalkSpeed * simulationUnits * 3;
        assignVector(steeringPosition.velocity, steeringPosition.steeringVector);
        normalizeVector(steeringPosition.velocity);
        multiplyVector(steeringPosition.velocity, steeringStepDistance);
        var steeringDistanceRemaining = vectorLength(steeringPosition.steeringVector);
        if (steeringStepDistance >= steeringDistanceRemaining) {
          steeringPosition.steeringVector = null;
        } else {
          multiplyVector(steeringPosition.steeringVector, (steeringDistanceRemaining - steeringStepDistance) / steeringDistanceRemaining);
        }
        addVector(steeringPosition.levelPosition, steeringPosition.velocity);
        if (steeringPosition.room) {
          clampPointToRoom(steeringPosition.room, steeringPosition.levelPosition, game.halfTileSize);
        }
      }
    }
  }
  var monstersToAdvance = getMonsters(),
    alliesToAdvance = getAllies(),
    characterIndex;
  for (characterIndex = 0; characterIndex < alliesToAdvance.length; characterIndex++) {
    updateCharacter(alliesToAdvance[characterIndex], simulationUnits);
  }
  for (characterIndex = 0; characterIndex < monstersToAdvance.length; characterIndex++) {
    updateCharacter(monstersToAdvance[characterIndex], simulationUnits);
  }
  var actionQueue = game.combatQueue,
    actionIndex,
    queuedAction,
    attacker,
    hasResolvedAction = false,
    queuedImpactEffect,
    hasSpawnedImpactEffect = false;
  for (actionIndex = 0; actionIndex < actionQueue.queue.length; actionIndex++) {
    if (queuedAction = actionQueue.queue[actionIndex], attacker = queuedAction.attacker, (queuedImpactEffect = queuedAction.impactEffect) && queuedImpactEffect.effectType === TARGETED_EFFECT) {
      var impactResolved;
      a: {
        var targetedAction = queuedAction,
          projectileEffect = targetedAction.projectileEffect;
        if (projectileEffect && !projectileEffect.hasSpawned) {
          addVisualEffect(game.effects, targetedAction.projectileEffect);
        }
        if (!projectileEffect || projectileEffect.reachedTarget || projectileEffect.finished) {
          var impactEffect = targetedAction.impactEffect;
          if (!impactEffect.hasSpawned) {
            var actionDefinition = targetedAction.actionDefinition;
            if (actionDefinition && 8 == actionDefinition.spellCategoryId) {
              var blastAction = targetedAction,
                spellCaches = game.spellCaches,
                targetCharacter = blastAction.targetCharacter,
                blastAttacker = blastAction.attacker,
                blastRadius = floorNumber((blastAttacker.stats.areaRadiusBonus + 1) * game.tileSize),
                targetsInRange = findTargetsInRange(blastAttacker, targetCharacter, 200, blastRadius);
              if (targetsInRange && 0 !== targetsInRange.length) {
                var targetIndex = undefined,
                  splashDamage = undefined,
                  attackerLevelPosition = blastAttacker.position.levelPosition,
                  targetLevelPosition = targetCharacter.position.levelPosition,
                  hitTargetPosition = undefined,
                  hitTargetLevelPosition = undefined,
                  hitTarget = undefined,
                  impactEffectName = undefined,
                  spellDefinition = blastAction.actionDefinition;
                if (spellDefinition) {
                  impactEffectName = spellDefinition.impactEffectName;
                } else {
                  var effectItem = blastAttacker.getEffectItem(),
                    itemEffect = effectItem ? effectItem.itemEffect : null,
                    impactEffectName = itemEffect ? itemEffect.itemEffectName : null;
                }
                if (!impactEffectName) {
                  impactEffectName = "Red Splat";
                }
                for (var secondaryDamageAction = undefined, targetIndex = /** @type {any} */ (0); targetIndex < targetsInRange.length; targetIndex++) {
                  hitTarget = targetsInRange[targetIndex];
                  hitTargetPosition = hitTarget.position;
                  hitTargetLevelPosition = hitTargetPosition.levelPosition;
                  if (hitTarget === targetCharacter) {
                    applySeparationForce(hitTargetPosition, attackerLevelPosition, targetLevelPosition, blastRadius);
                  } else {
                    secondaryDamageAction = new CombatAction();
                    secondaryDamageAction.attacker = blastAttacker;
                    (/** @type {any} */ (secondaryDamageAction)).setTargetCharacter(hitTarget);
                    secondaryDamageAction.hasProjectilePhase = false;
                    secondaryDamageAction.actionDefinition = spellDefinition;
                    applySeparationForce(hitTargetPosition, attackerLevelPosition, targetLevelPosition, blastRadius);
                    var secondaryImpactEffect = new VisualEffect(impactEffectName, targetLevelPosition, hitTargetLevelPosition, false, 1);
                    secondaryDamageAction.impactEffect = secondaryImpactEffect;
                    splashDamage = Math.max(1, calculateAttackDamage(blastAttacker, targetCharacter));
                    secondaryDamageAction.noDamage = false;
                    secondaryDamageAction.remainingDamage = splashDamage;
                    enqueueCombatAction(game.combatQueue, secondaryDamageAction);
                  }
                  var blastStunCaches = spellCaches,
                    stunTarget = hitTarget,
                    stunTargetLevelPosition = stunTarget.position.levelPosition,
                    stunAction = new CombatAction();
                  stunAction.attacker = blastAction.attacker;
                  (/** @type {any} */ (stunAction)).setTargetCharacter(stunTarget);
                  stunAction.hasProjectilePhase = false;
                  stunAction.actionDefinition = blastStunCaches.blastStunSpellCache;
                  if (!blastStunCaches.blastStunSpellCache) {
                    blastStunCaches.blastStunSpellCache = new Spell(blastStunSpell);
                  }
                  var stunImpactEffectName = blastStunCaches.blastStunSpellCache.impactEffectName;
                  if (stunImpactEffectName) {
                    var stunImpactEffect = new VisualEffect(stunImpactEffectName, stunTargetLevelPosition, stunTargetLevelPosition, false, 1);
                    stunAction.impactEffect = stunImpactEffect;
                  }
                  enqueueCombatAction(game.combatQueue, stunAction);
                }
              }
            }
            addVisualEffect(game.effects, impactEffect);
          } else if (impactEffect.isFinished()) {
            impactResolved = targetedAction.resolved = true;
            break a;
          }
        }
        impactResolved = false;
      }
      if (impactResolved) {
        hasResolvedAction = true;
      } else {
        if (queuedImpactEffect.hasSpawned) {
          hasSpawnedImpactEffect = true;
        }
      }
    } else if (attacker.isDead) {
      hasResolvedAction = queuedAction.resolved = true;
    } else if (queuedAction.hasProjectilePhase) {
      var combatQueue = actionQueue,
        combatAction = queuedAction,
        activeProjectile = combatAction.projectileEffect;
      if (activeProjectile && !activeProjectile.hasSpawned) {
        addVisualEffect(game.effects, activeProjectile);
      }
      if (activeProjectile) {
        var phaseActionDefinition = combatAction.actionDefinition;
        if (phaseActionDefinition && 12 === phaseActionDefinition.spellCategoryId) {
          var projectilePosition = activeProjectile.currentPosition;
          setVector(combatAction.attacker.position.levelPosition, projectilePosition.x, projectilePosition.y);
        }
      }
      if ((!activeProjectile || activeProjectile.reachedTarget || activeProjectile.finished) && advanceCombatAction(combatQueue, combatAction)) {
        hasResolvedAction = true;
      }
    } else {
      if (advanceCombatAction(actionQueue, queuedAction)) {
        hasResolvedAction = true;
      }
    }
  }
  if (hasSpawnedImpactEffect) {
    var opponents = getOpponents(attacker),
      opponent,
      opponentLevelPosition,
      tileColumn,
      tileRow,
      tile,
      tileEffect,
      opponentStats,
      remainingEffectDamage,
      damageRoll,
      db,
      attackerStats = 1 === attacker.characterType ? attacker.summoner.stats : attacker.stats;
    for (db = 0; db < opponents.length; db++) {
      if (opponent = opponents[db], !opponent.isDead && (opponentLevelPosition = opponent.position.levelPosition, tileColumn = game.level.pixelToTileColumn(opponentLevelPosition.x), tileRow = game.level.pixelToTileRow(opponentLevelPosition.y), (tile = game.level.getTileAt(tileColumn, tileRow)) && (tileEffect = tile.tileEffect) && tileEffect.hasSpawned)) {
        if (tileEffect.isFinished()) {
          setTileEffect(tile, null);
        } else if (tileEffect.previousFrameIndex !== tileEffect.frameIndex && (remainingEffectDamage = tile.remainingEffectDamage, 0 !== remainingEffectDamage && (damageRoll = randomInt(remainingEffectDamage + 1), 0 !== damageRoll))) {
          tile.setRemainingEffectDamage(Math.max(0, remainingEffectDamage - damageRoll));
          var hitStats = opponentStats = opponent.stats;
          hitStats.health -= floorNumber(damageRoll);
          if (0 > hitStats.health) {
            hitStats.health = 0;
          }
          attackerStats.damageGiven += damageRoll;
          opponentStats.damageReceived += damageRoll;
          showDamageText(opponent, damageRoll);
          if (0 === opponentStats.health) {
            resolveCharacterDefeat(tileEffect.boundCharacter, opponent);
          }
        }
      }
    }
  }
  if (hasResolvedAction) {
    for (actionIndex = actionQueue.queue.length - 1; 0 <= actionIndex; actionIndex--) {
      if (actionQueue.queue[actionIndex].resolved) {
        actionQueue.queue.splice(actionIndex, 1);
      }
    }
  }
  var visualEffects = game.effects,
    effectIndex;
  for (effectIndex = 0; effectIndex < visualEffects.pool.length; effectIndex++) {
    var visualEffect = visualEffects.pool[effectIndex],
      elapsedUnits = simulationUnits;
    visualEffect.hasSpawned = true;
    if (1 === visualEffect.effectType) {
      if (visualEffect.projectileEffect && !visualEffect.reachedTarget) {
        assignVector(directionScratchVector, visualEffect.targetPosition);
        subtractVector(directionScratchVector, visualEffect.currentPosition);
        var distanceToTarget = vectorLength(directionScratchVector),
          projectileStepDistance = undefined,
          projectileStepDistance = /** @type {any} */ (visualEffect.boundCharacter === game.state.scrollCaster ? 11 * elapsedUnits : visualEffect.isReturning ? 5 * elapsedUnits : 7 * elapsedUnits);
        if (distanceToTarget <= projectileStepDistance) {
          assignVector(visualEffect.currentPosition, visualEffect.targetPosition);
          visualEffect.reachedTarget = true;
          visualEffect.finished = true;
        } else {
          normalizeVector(directionScratchVector);
          multiplyVector(directionScratchVector, projectileStepDistance);
          addVector(visualEffect.currentPosition, directionScratchVector);
        }
      }
      if (visualEffect.animation.isDirectional) {
        visualEffect.frameIndex = getEffectDirection(visualEffect);
      } else {
        advanceEffectFrame(visualEffect, elapsedUnits);
      }
    } else {
      if (visualEffect.effectType === TARGETED_EFFECT) {
        advanceEffectFrame(visualEffect, elapsedUnits);
      } else {
        if (2 === visualEffect.effectType) {
          visualEffect.elapsedMs += elapsedUnits * FRAME_DURATION_MS;
          if (400 <= visualEffect.elapsedMs) {
            visualEffect.finished = true;
            visualEffect.reachedTarget = true;
          }
        }
      }
    }
  }
  for (effectIndex = visualEffects.pool.length - 1; 0 <= effectIndex; effectIndex--) {
    if (visualEffects.pool[effectIndex].isFinished()) {
      visualEffects.pool.splice(effectIndex, 1);
    }
  }
  var inventories = game.inventories,
    adventurerIndex,
    inventory,
    items,
    inventoryDirty = false;
  for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
    inventory = game.state.adventurers[adventurerIndex].inventory;
    if (inventory.dirty) {
      inventoryDirty = true;
      inventory.dirty = false;
    }
  }
  if (inventoryDirty) {
    inventories.list.length = 0;
    var itemIndex, inventoryOwner, item, slotItem;
    for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
      for (inventoryOwner = game.state.adventurers[adventurerIndex], items = inventoryOwner.inventory.items, itemIndex = 0; itemIndex < items.length; itemIndex++) {
        item = items[itemIndex];
        if (!((slotItem = inventoryOwner.getSlotItem(item.slot)) && !isBetterItem(item, slotItem))) {
          inventories.list.push(item);
        }
      }
    }
    if (1 < inventories.list.length) {
      sortInventory(inventories, inventories.list);
    }
  }
  game.floatingText.update();
  if (!game.processingOffline) {
    var upgradeRefreshIndex;
    for (upgradeRefreshIndex = 0; upgradeRefreshIndex < upgradeCollections.length; upgradeRefreshIndex++) {
      refreshUpgradeCollection(upgradeCollections[upgradeRefreshIndex]);
    }
    var adventurer;
    for (upgradeRefreshIndex = 0; upgradeRefreshIndex < game.state.adventurers.length; upgradeRefreshIndex++) {
      adventurer = game.state.adventurers[upgradeRefreshIndex];
      refreshUpgradeCollection(adventurer.skillTree1);
      refreshUpgradeCollection(adventurer.skillTree2);
      refreshUpgradeCollection(adventurer.skillTree3);
      refreshUpgradeCollection(adventurer.skillTree4);
    }
  }
  var partyMemberIndex,
    adventurers = game.state.adventurers,
    positionSumX = 0,
    $ = 0;
  if (game.worldActive) {
    for (partyMemberIndex = 0; partyMemberIndex < adventurers.length; partyMemberIndex++) {
      positionSumX += adventurers[partyMemberIndex].position.getWorldPositionX();
      $ += adventurers[partyMemberIndex].position.getWorldPositionY();
    }
    var partyCenterWorldX = positionSumX / adventurers.length,
      partyCenterWorldY = $ / adventurers.length,
      world = game.world;
    if (null == partyCenterWorldX || null == partyCenterWorldY) {
      console.log("Setting world center x/y to null. worldCenterX=" + partyCenterWorldX + " y=" + partyCenterWorldY);
    } else if (world.worldCenterX = partyCenterWorldX, world.worldCenterY = partyCenterWorldY, !worldBlockContains(world.worldBlocks[1][1], world.worldCenterX, world.worldCenterY)) {
      var gridBlocksRepositioned;
      var foundCenterBlock = false,
        slotColumn,
        slotRow,
        centerSlotColumn,
        centerSlotRow;
      for (slotColumn = 0; 3 > slotColumn; slotColumn++) {
        for (slotRow = 0; 3 > slotRow; slotRow++) {
          if (worldBlockContains(world.worldBlocks[slotColumn][slotRow], world.worldCenterX, world.worldCenterY)) {
            foundCenterBlock = true;
            centerSlotColumn = slotColumn;
            centerSlotRow = slotRow;
            break;
          }
        }
      }
      if (foundCenterBlock) {
        var $c = world.worldBlocks[0][0],
          blockAtCol0Row1 = world.worldBlocks[0][1],
          blockAtCol0Row2 = world.worldBlocks[0][2],
          blockAtCol1Row0 = world.worldBlocks[1][0],
          blockAtCol1Row1 = world.worldBlocks[1][1],
          blockAtCol1Row2 = world.worldBlocks[1][2],
          id = world.worldBlocks[2][0],
          blockAtCol2Row1 = world.worldBlocks[2][1],
          blockAtCol2Row2 = world.worldBlocks[2][2];
        if (0 === centerSlotColumn) {
          world.blockOriginColumn--;
          if (0 === centerSlotRow) {
            world.blockOriginRow--;
            world.worldBlocks[0][0] = blockAtCol2Row2;
            world.worldBlocks[0][1] = id;
            world.worldBlocks[0][2] = blockAtCol2Row1;
            world.worldBlocks[1][0] = blockAtCol0Row2;
            world.worldBlocks[1][1] = $c;
            world.worldBlocks[1][2] = blockAtCol0Row1;
            world.worldBlocks[2][0] = blockAtCol1Row2;
            world.worldBlocks[2][1] = blockAtCol1Row0;
            world.worldBlocks[2][2] = blockAtCol1Row1;
            repositionWorldBlock(world.worldBlocks[0][0], world.blockOriginColumn, world.blockOriginRow, true);
            repositionWorldBlock(world.worldBlocks[0][1], world.blockOriginColumn, world.blockOriginRow + 1, true);
            repositionWorldBlock(world.worldBlocks[0][2], world.blockOriginColumn, world.blockOriginRow + 2, true);
            repositionWorldBlock(world.worldBlocks[1][0], world.blockOriginColumn + 1, world.blockOriginRow, true);
            repositionWorldBlock(world.worldBlocks[1][1], world.blockOriginColumn + 1, world.blockOriginRow + 1, false);
            repositionWorldBlock(world.worldBlocks[1][2], world.blockOriginColumn + 1, world.blockOriginRow + 2, false);
            repositionWorldBlock(world.worldBlocks[2][0], world.blockOriginColumn + 2, world.blockOriginRow, true);
            repositionWorldBlock(world.worldBlocks[2][1], world.blockOriginColumn + 2, world.blockOriginRow + 1, false);
            repositionWorldBlock(world.worldBlocks[2][2], world.blockOriginColumn + 2, world.blockOriginRow + 2, false);
          } else {
            if (1 === centerSlotRow) {
              world.worldBlocks[0][0] = id;
              world.worldBlocks[0][1] = blockAtCol2Row1;
              world.worldBlocks[0][2] = blockAtCol2Row2;
              world.worldBlocks[1][0] = $c;
              world.worldBlocks[1][1] = blockAtCol0Row1;
              world.worldBlocks[1][2] = blockAtCol0Row2;
              world.worldBlocks[2][0] = blockAtCol1Row0;
              world.worldBlocks[2][1] = blockAtCol1Row1;
              world.worldBlocks[2][2] = blockAtCol1Row2;
              repositionWorldBlock(world.worldBlocks[0][0], world.blockOriginColumn, world.blockOriginRow, true);
              repositionWorldBlock(world.worldBlocks[0][1], world.blockOriginColumn, world.blockOriginRow + 1, true);
              repositionWorldBlock(world.worldBlocks[0][2], world.blockOriginColumn, world.blockOriginRow + 2, true);
              repositionWorldBlock(world.worldBlocks[1][0], world.blockOriginColumn + 1, world.blockOriginRow, false);
              repositionWorldBlock(world.worldBlocks[1][1], world.blockOriginColumn + 1, world.blockOriginRow + 1, false);
              repositionWorldBlock(world.worldBlocks[1][2], world.blockOriginColumn + 1, world.blockOriginRow + 2, false);
              repositionWorldBlock(world.worldBlocks[2][0], world.blockOriginColumn + 2, world.blockOriginRow, false);
              repositionWorldBlock(world.worldBlocks[2][1], world.blockOriginColumn + 2, world.blockOriginRow + 1, false);
              repositionWorldBlock(world.worldBlocks[2][2], world.blockOriginColumn + 2, world.blockOriginRow + 2, false);
            } else {
              world.blockOriginRow++;
              world.worldBlocks[0][0] = blockAtCol2Row1;
              world.worldBlocks[0][1] = blockAtCol2Row2;
              world.worldBlocks[0][2] = id;
              world.worldBlocks[1][0] = blockAtCol0Row1;
              world.worldBlocks[1][1] = blockAtCol0Row2;
              world.worldBlocks[1][2] = $c;
              world.worldBlocks[2][0] = blockAtCol1Row1;
              world.worldBlocks[2][1] = blockAtCol1Row2;
              world.worldBlocks[2][2] = blockAtCol1Row0;
              repositionWorldBlock(world.worldBlocks[0][0], world.blockOriginColumn, world.blockOriginRow, true);
              repositionWorldBlock(world.worldBlocks[0][1], world.blockOriginColumn, world.blockOriginRow + 1, true);
              repositionWorldBlock(world.worldBlocks[0][2], world.blockOriginColumn, world.blockOriginRow + 2, true);
              repositionWorldBlock(world.worldBlocks[1][0], world.blockOriginColumn + 1, world.blockOriginRow, false);
              repositionWorldBlock(world.worldBlocks[1][1], world.blockOriginColumn + 1, world.blockOriginRow + 1, false);
              repositionWorldBlock(world.worldBlocks[1][2], world.blockOriginColumn + 1, world.blockOriginRow + 2, true);
              repositionWorldBlock(world.worldBlocks[2][0], world.blockOriginColumn + 2, world.blockOriginRow, false);
              repositionWorldBlock(world.worldBlocks[2][1], world.blockOriginColumn + 2, world.blockOriginRow + 1, false);
              repositionWorldBlock(world.worldBlocks[2][2], world.blockOriginColumn + 2, world.blockOriginRow + 2, true);
            }
          }
        } else {
          if (1 === centerSlotColumn) {
            if (0 === centerSlotRow) {
              world.blockOriginRow--;
              world.worldBlocks[0][0] = blockAtCol0Row2;
              world.worldBlocks[0][1] = $c;
              world.worldBlocks[0][2] = blockAtCol0Row1;
              world.worldBlocks[1][0] = blockAtCol1Row2;
              world.worldBlocks[1][1] = blockAtCol1Row0;
              world.worldBlocks[1][2] = blockAtCol1Row1;
              world.worldBlocks[2][0] = blockAtCol2Row2;
              world.worldBlocks[2][1] = id;
              world.worldBlocks[2][2] = blockAtCol2Row1;
              repositionWorldBlock(world.worldBlocks[0][0], world.blockOriginColumn, world.blockOriginRow, true);
              repositionWorldBlock(world.worldBlocks[0][1], world.blockOriginColumn, world.blockOriginRow + 1, false);
              repositionWorldBlock(world.worldBlocks[0][2], world.blockOriginColumn, world.blockOriginRow + 2, false);
              repositionWorldBlock(world.worldBlocks[1][0], world.blockOriginColumn + 1, world.blockOriginRow, true);
              repositionWorldBlock(world.worldBlocks[1][1], world.blockOriginColumn + 1, world.blockOriginRow + 1, false);
              repositionWorldBlock(world.worldBlocks[1][2], world.blockOriginColumn + 1, world.blockOriginRow + 2, false);
              repositionWorldBlock(world.worldBlocks[2][0], world.blockOriginColumn + 2, world.blockOriginRow, true);
              repositionWorldBlock(world.worldBlocks[2][1], world.blockOriginColumn + 2, world.blockOriginRow + 1, false);
              repositionWorldBlock(world.worldBlocks[2][2], world.blockOriginColumn + 2, world.blockOriginRow + 2, false);
            } else {
              if (1 === centerSlotRow) {
                console.log("error? new center block already in the center of the grid.");
              } else {
                world.blockOriginRow++;
                world.worldBlocks[0][0] = blockAtCol0Row1;
                world.worldBlocks[0][1] = blockAtCol0Row2;
                world.worldBlocks[0][2] = $c;
                world.worldBlocks[1][0] = blockAtCol1Row1;
                world.worldBlocks[1][1] = blockAtCol1Row2;
                world.worldBlocks[1][2] = blockAtCol1Row0;
                world.worldBlocks[2][0] = blockAtCol2Row1;
                world.worldBlocks[2][1] = blockAtCol2Row2;
                world.worldBlocks[2][2] = id;
                repositionWorldBlock(world.worldBlocks[0][0], world.blockOriginColumn, world.blockOriginRow, false);
                repositionWorldBlock(world.worldBlocks[0][1], world.blockOriginColumn, world.blockOriginRow + 1, false);
                repositionWorldBlock(world.worldBlocks[0][2], world.blockOriginColumn, world.blockOriginRow + 2, true);
                repositionWorldBlock(world.worldBlocks[1][0], world.blockOriginColumn + 1, world.blockOriginRow, false);
                repositionWorldBlock(world.worldBlocks[1][1], world.blockOriginColumn + 1, world.blockOriginRow + 1, false);
                repositionWorldBlock(world.worldBlocks[1][2], world.blockOriginColumn + 1, world.blockOriginRow + 2, true);
                repositionWorldBlock(world.worldBlocks[2][0], world.blockOriginColumn + 2, world.blockOriginRow, false);
                repositionWorldBlock(world.worldBlocks[2][1], world.blockOriginColumn + 2, world.blockOriginRow + 1, false);
                repositionWorldBlock(world.worldBlocks[2][2], world.blockOriginColumn + 2, world.blockOriginRow + 2, true);
              }
            }
          } else {
            world.blockOriginColumn++;
            if (0 === centerSlotRow) {
              world.blockOriginRow--;
              world.worldBlocks[0][0] = blockAtCol1Row2;
              world.worldBlocks[0][1] = blockAtCol1Row0;
              world.worldBlocks[0][2] = blockAtCol1Row1;
              world.worldBlocks[1][0] = blockAtCol2Row2;
              world.worldBlocks[1][1] = id;
              world.worldBlocks[1][2] = blockAtCol2Row1;
              world.worldBlocks[2][0] = blockAtCol0Row2;
              world.worldBlocks[2][1] = $c;
              world.worldBlocks[2][2] = blockAtCol0Row1;
              repositionWorldBlock(world.worldBlocks[0][0], world.blockOriginColumn, world.blockOriginRow, true);
              repositionWorldBlock(world.worldBlocks[0][1], world.blockOriginColumn, world.blockOriginRow + 1, false);
              repositionWorldBlock(world.worldBlocks[0][2], world.blockOriginColumn, world.blockOriginRow + 2, false);
              repositionWorldBlock(world.worldBlocks[1][0], world.blockOriginColumn + 1, world.blockOriginRow, true);
              repositionWorldBlock(world.worldBlocks[1][1], world.blockOriginColumn + 1, world.blockOriginRow + 1, false);
              repositionWorldBlock(world.worldBlocks[1][2], world.blockOriginColumn + 1, world.blockOriginRow + 2, false);
            } else {
              if (1 === centerSlotRow) {
                world.worldBlocks[0][0] = blockAtCol1Row0;
                world.worldBlocks[0][1] = blockAtCol1Row1;
                world.worldBlocks[0][2] = blockAtCol1Row2;
                world.worldBlocks[1][0] = id;
                world.worldBlocks[1][1] = blockAtCol2Row1;
                world.worldBlocks[1][2] = blockAtCol2Row2;
                world.worldBlocks[2][0] = $c;
                world.worldBlocks[2][1] = blockAtCol0Row1;
                world.worldBlocks[2][2] = blockAtCol0Row2;
                repositionWorldBlock(world.worldBlocks[0][0], world.blockOriginColumn, world.blockOriginRow, false);
                repositionWorldBlock(world.worldBlocks[0][1], world.blockOriginColumn, world.blockOriginRow + 1, false);
                repositionWorldBlock(world.worldBlocks[0][2], world.blockOriginColumn, world.blockOriginRow + 2, false);
                repositionWorldBlock(world.worldBlocks[1][0], world.blockOriginColumn + 1, world.blockOriginRow, false);
                repositionWorldBlock(world.worldBlocks[1][1], world.blockOriginColumn + 1, world.blockOriginRow + 1, false);
                repositionWorldBlock(world.worldBlocks[1][2], world.blockOriginColumn + 1, world.blockOriginRow + 2, false);
              } else {
                world.blockOriginRow++;
                world.worldBlocks[0][0] = blockAtCol1Row1;
                world.worldBlocks[0][1] = blockAtCol1Row2;
                world.worldBlocks[0][2] = blockAtCol1Row0;
                world.worldBlocks[1][0] = blockAtCol2Row1;
                world.worldBlocks[1][1] = blockAtCol2Row2;
                world.worldBlocks[1][2] = id;
                world.worldBlocks[2][0] = blockAtCol0Row1;
                world.worldBlocks[2][1] = blockAtCol0Row2;
                world.worldBlocks[2][2] = $c;
                repositionWorldBlock(world.worldBlocks[0][0], world.blockOriginColumn, world.blockOriginRow, false);
                repositionWorldBlock(world.worldBlocks[0][1], world.blockOriginColumn, world.blockOriginRow + 1, false);
                repositionWorldBlock(world.worldBlocks[0][2], world.blockOriginColumn, world.blockOriginRow + 2, true);
                repositionWorldBlock(world.worldBlocks[1][0], world.blockOriginColumn + 1, world.blockOriginRow, false);
                repositionWorldBlock(world.worldBlocks[1][1], world.blockOriginColumn + 1, world.blockOriginRow + 1, false);
                repositionWorldBlock(world.worldBlocks[1][2], world.blockOriginColumn + 1, world.blockOriginRow + 2, true);
              }
            }
            repositionWorldBlock(world.worldBlocks[2][0], world.blockOriginColumn + 2, world.blockOriginRow, true);
            repositionWorldBlock(world.worldBlocks[2][1], world.blockOriginColumn + 2, world.blockOriginRow + 1, true);
            repositionWorldBlock(world.worldBlocks[2][2], world.blockOriginColumn + 2, world.blockOriginRow + 2, true);
          }
        }
        gridBlocksRepositioned = true;
      } else {
        console.log("Failed to find new center block!");
        gridBlocksRepositioned = false;
      }
      if (!gridBlocksRepositioned) {
        console.log("Bug: party not contained by block grid. fixing.");
        var centerBlockColumn = world.pixelToBlockColumn(world.worldCenterX),
          centerBlockRow = world.pixelToBlockRow(world.worldCenterY);
        console.log("old: blockShiftCol=" + world.blockOriginColumn + " blockShiftRow=" + world.blockOriginRow);
        world.blockOriginColumn = centerBlockColumn - 1;
        world.blockOriginRow = centerBlockRow - 1;
        console.log("new: blockShiftCol=" + world.blockOriginColumn + " blockShiftRow=" + world.blockOriginRow);
        repositionWorldBlock(world.worldBlocks[0][0], world.blockOriginColumn, world.blockOriginRow, true);
        repositionWorldBlock(world.worldBlocks[0][1], world.blockOriginColumn, world.blockOriginRow + 1, true);
        repositionWorldBlock(world.worldBlocks[0][2], world.blockOriginColumn, world.blockOriginRow + 2, true);
        repositionWorldBlock(world.worldBlocks[1][0], world.blockOriginColumn + 1, world.blockOriginRow, true);
        repositionWorldBlock(world.worldBlocks[1][1], world.blockOriginColumn + 1, world.blockOriginRow + 1, true);
        repositionWorldBlock(world.worldBlocks[1][2], world.blockOriginColumn + 1, world.blockOriginRow + 2, true);
        repositionWorldBlock(world.worldBlocks[2][0], world.blockOriginColumn + 2, world.blockOriginRow, true);
        repositionWorldBlock(world.worldBlocks[2][1], world.blockOriginColumn + 2, world.blockOriginRow + 1, true);
        repositionWorldBlock(world.worldBlocks[2][2], world.blockOriginColumn + 2, world.blockOriginRow + 2, true);
        var centerBlock = world.worldBlocks[1][1];
        if (!worldBlockContains(centerBlock, world.worldCenterX, world.worldCenterY)) {
          console.log("Failed to fix world block grid issue.");
          console.log("posX: " + world.worldCenterX + " posY: " + world.worldCenterY);
          console.log("minX: " + centerBlock.pixelLeft + " maxX: " + centerBlock.pixelRight);
          console.log("minY: " + centerBlock.pixelTop + " maxY: " + centerBlock.pixelBottom);
        }
      }
    }
  } else {
    for (partyMemberIndex = 0; partyMemberIndex < adventurers.length; partyMemberIndex++) {
      positionSumX += adventurers[partyMemberIndex].position.getLevelPositionX();
      $ += adventurers[partyMemberIndex].position.getLevelPositionY();
    }
    var of = $ / adventurers.length,
      level = game.level;
    level.centerX = positionSumX / adventurers.length;
    level.centerY = of;
  }
}
export function positionScrollCaster(scrollIndex) {
  var casterOffset = 30 + 126 * scrollIndex;
  var viewportBottomY = game.viewportHeight - 80;
  setVector(game.state.scrollCaster.position.levelPosition, game.level.centerX + (0.5 * (casterOffset - game.viewportHalfWidth) + (viewportBottomY - game.viewportHalfHeight)) | 0, game.level.centerY + (viewportBottomY - game.viewportHalfHeight - 0.5 * (casterOffset - game.viewportHalfWidth)) | 0);
}
export function updateCharacterBehaviors(characters) {
  var characterIndex, character;
  for (characterIndex = 0; characterIndex < characters.length; characterIndex++) {
    character = characters[characterIndex];
    if (!character.isDead) {
      if (character.effects.isDisabled) {
        character.actionType = IDLE_ACTION;
      } else {
        character.updateBehaviors();
      }
    }
  }
}
export function showDeathEffect(character) {
  var deathPosition = game.worldActive ? character.position.worldPosition : character.position.levelPosition;
  addVisualEffect(game.effects, new VisualEffect("Red Splat", deathPosition, deathPosition, false, 1));
}
export function purchaseDungeonFarm(dungeon, farmCost) {
  if (!(game.state.party.gold < farmCost)) {
    recordGameEvent("Dungeon", "Farm Purchased");
    spendGold(farmCost);
    dungeon.isFarm = true;
    dungeon.farmStartTurn = game.state.turnNumber;
    registerDungeonFarm(dungeon);
    var farms = game.farms,
      farmColumn = farms.jitterCoordinate(dungeon.getWorldColumn()),
      farmRow = farms.jitterCoordinate(dungeon.getWorldRow());
    registerFarm(farms, new Farm(dungeon.dungeonId, farmColumn, farmRow));
    game.state.statisticsRecorder.recordFarmPurchased();
  }
}
export function initializeSimulationTick() {}
