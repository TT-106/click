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
  this.returns = this.chains = false;
  this.chainCount = this.currentChainStep = 0;
  this.returnOriginPosition = null;
}
/** @typedef {CombatAction & { setTargetCharacter: (target: unknown) => void }} TargetedCombatAction */
export function findTargetsInRange(attacker, sourceCharacter, targetLimit, maxDistance) {
  var opponents = getOpponents(attacker);
  if (0 === opponents.length) {
    return null;
  }
  var sourceRoom = sourceCharacter.position.room;
  if (!sourceRoom) {
    return null;
  }
  var targetIndex, opponent,
    sourcePosition = sourceCharacter.position.levelPosition,
    distance,
    targets = [];
  for (targetIndex = 0; targetIndex < opponents.length && (opponent = opponents[targetIndex], opponent.isDead || opponent.position.room !== sourceRoom || (distance = sourcePosition.distanceTo(opponent.position.levelPosition), !(distance <= maxDistance && (targets.push(opponent), targets.length >= targetLimit)))); targetIndex++) {}
  return targets;
}
export function CombatQueue() {
  this.queue = [];
}
export function clearCombatQueue() {
  var combatQueue = game.combatQueue;
  if (0 < combatQueue.queue.length) {
    combatQueue.queue.length = 0;
  }
}
export function advanceCombatAction(combatQueue, combatAction) {
  var impactEffect = combatAction.impactEffect, recheckDefinition;
  if (impactEffect && !impactEffect.hasSpawned) {
    if (combatAction.noDamage) {
      return combatAction.resolved = true;
    }
    addVisualEffect(game.effects, impactEffect);
    var actionDefinition = combatAction.actionDefinition, chainedAction, returningAction, targetStats;
    if (actionDefinition && actionDefinition.applyEffectOnImpact) {
      applySpellEffect(combatQueue, combatAction);
    }
    if (0 < combatAction.remainingDamage) {
      showDamageText(combatAction.targetCharacter, combatAction.remainingDamage);
    }
    if (combatAction.chains) {
      if (chainedAction = createChainAction(combatAction)) {
        enqueueCombatAction(combatQueue, chainedAction);
      }
    } else {
      if (combatAction.returns && (returningAction = createReturningAction(combatAction))) {
        enqueueCombatAction(combatQueue, returningAction);
      }
    }
  }
  if ((impactEffect = combatAction.impactEffect) && impactEffect.previousFrameIndex !== impactEffect.frameIndex) {
    var effectFrameCount = impactEffect.getFrameCount(), healAmount;
    if (combatAction.actionDefinition) {
      var targetCharacter = combatAction.targetCharacter,
        definition = combatAction.actionDefinition,
        spellCategoryId = definition.spellCategoryId, maxHealth, potencyPercent, floatingTextLayer;
      if (targetCharacter) {
        if (targetStats = targetCharacter.stats, 4 === spellCategoryId || 5 === spellCategoryId || 8 === spellCategoryId || 13 === spellCategoryId || 12 === spellCategoryId) {
          applyActionDamage(combatAction);
        } else if (1 === spellCategoryId && (potencyPercent = definition.potencyPercent, maxHealth = statValue(targetStats.maxHealth), targetStats.health < maxHealth)) {
          var healPotency = combatAction.attacker.stats.healPotency;
          if (1 < healPotency) {
            potencyPercent = Math.min(100, potencyPercent * healPotency);
          }
          healAmount = Math.max(1, floorNumber(potencyPercent / 100 * maxHealth / effectFrameCount));
          floatingTextLayer = game.floatingText;
          if (0 < healAmount) {
            showFloatingText(floatingTextLayer, targetCharacter, "+" + healAmount, "#00FF00");
          }
          targetStats.health += floorNumber(healAmount);
          maxHealth = statValue(targetStats.maxHealth);
          if (targetStats.health > maxHealth) {
            targetStats.health = maxHealth;
          }
        }
      }
    } else {
      if (0 < combatAction.remainingDamage) {
        applyActionDamage(combatAction);
      }
    }
  }
  return impactEffect && impactEffect.isFinished() ? ((recheckDefinition = combatAction.actionDefinition) && (recheckDefinition.applyEffectOnImpact || applySpellEffect(combatQueue, combatAction)), combatAction.resolved = true) : false;
}
export function applySpellEffect(combatQueue, combatAction) {
  var actionDefinition = combatAction.actionDefinition,
    spellCategoryId = actionDefinition.spellCategoryId, statusEffect, targetEffects, reviveAttacker, revivePosition, reviveTarget, monsterRegistry, reviveIndex, chickenCaster, chickenTargetPosition, barbarianChance, ninjaChance, rogueChance, chickenMinionDefinition, claimedItem, claimedRarity, cleanseTarget, cleanseEffects;
  if (2 === spellCategoryId || 3 === spellCategoryId) {
    var attacker = combatAction.attacker,
      statusEffectTypeId = actionDefinition.statusEffectTypeId,
      potencyPercent = actionDefinition.potencyPercent,
      effectDefinition = statusEffectDefinitions[statusEffectTypeId];
    if (effectDefinition) {
      var casterStats = attacker.stats,
        potencyMultiplier = 1;
      switch (statusEffectTypeId) {
        case 5:
          potencyMultiplier = casterStats.buffArmorPotency;
          break;
        case 6:
          potencyMultiplier = casterStats.buffDamagePotency;
          break;
        case 7:
          potencyMultiplier = casterStats.buffAttackRatingPotency;
          break;
        case 8:
          potencyMultiplier = casterStats.buffDefenceRatingPotency;
      }
      statusEffect = new StatusEffect(statusEffectTypeId, game.state.turnNumber, effectDefinition.durationTurns, game.animations.getAnimation(effectDefinition.animationName), effectDefinition.overlayFrameIndex, effectDefinition.hasAnimation, 1 > potencyMultiplier ? potencyPercent : potencyPercent * potencyMultiplier);
    } else {
      console.log("Failed to find char effect description: " + statusEffectTypeId);
      statusEffect = null;
    }
    targetEffects = combatAction.targetCharacter.effects;
    if (statusEffect) {
      targetEffects.activeEffects.push(statusEffect);
      if (isDisablingEffect(statusEffect)) {
        targetEffects.isDisabled = true;
      }
    }
  } else if (10 === spellCategoryId || 9 === spellCategoryId) {
    summonSpellMinion(actionDefinition, combatAction.attacker, combatAction.impactEffect.targetPosition);
  } else if (11 === spellCategoryId) {
    reviveAttacker = combatAction.attacker;
    revivePosition = combatAction.impactEffect.targetPosition;
    reviveTarget = combatAction.targetCharacter;
    monsterRegistry = game.monsters;
    if (reviveTarget) {
      reviveIndex = monsterRegistry.defeatedMonsters.indexOf(reviveTarget);
      if (-1 < reviveIndex) {
        monsterRegistry.defeatedMonsters.splice(reviveIndex, 1);
      }
    }
    summonSpellMinion(actionDefinition, reviveAttacker, revivePosition);
  } else if (17 === spellCategoryId) {
    chickenCaster = combatAction.attacker;
    chickenTargetPosition = combatAction.impactEffect.targetPosition;
    var chickenStats = chickenCaster.stats;
    barbarianChance = chickenStats.barbarianChickenChance;
    ninjaChance = chickenStats.ninjaChickenChance;
    rogueChance = chickenStats.rogueChickenChance;
    if (0 < barbarianChance && Math.random() < barbarianChance / 100) {
      chickenMinionDefinition = barbarianChickenMinion;
      showFloatingText(game.floatingText, chickenCaster, "野蛮人小鸡!", "blue");
    } else {
      if (0 < ninjaChance && Math.random() < ninjaChance / 100) {
        chickenMinionDefinition = ninjaChickenMinion;
        showFloatingText(game.floatingText, chickenCaster, "忍者小鸡!", "blue");
      } else {
        if (0 < rogueChance && Math.random() < rogueChance / 100) {
          chickenMinionDefinition = rogueChickenMinion;
          showFloatingText(game.floatingText, chickenCaster, "盗贼小鸡!", "blue");
        } else {
          chickenMinionDefinition = chickenMinion;
        }
      }
    }
    spawnMinion(chickenMinionDefinition, chickenCaster, chickenTargetPosition);
  } else if (14 === spellCategoryId) {
    var collectorPosition = combatAction.attacker.position.levelPosition,
      dropList = game.goldDrops.drops, dropIndex, drop;
    for (dropIndex = dropList.length - 1; 0 <= dropIndex; dropIndex--) {
      drop = dropList[dropIndex];
      if (!drop.collected) {
        var goldOffset = new Vector2();
        setVector(goldOffset, drop.levelPositionX, drop.levelPositionY);
        var goldEffect = new VisualEffect("Gold Sparkles", collectorPosition, goldOffset, false, 1);
        addVisualEffect(game.effects, goldEffect);
        addGold(drop.goldAmount);
        game.state.statisticsRecorder.recordGoldFromMonsters(drop.goldAmount);
        drop.setCollected(true);
        removeGoldDrop(drop);
        awardAdventurePoints(9);
      }
    }
    collectorPosition = combatAction.attacker.position.levelPosition;
    dropList = game.itemDrops.drops;
    for (dropIndex = dropList.length - 1; 0 <= dropIndex; dropIndex--) {
      var itemDrop = dropList[dropIndex];
      if (!itemDrop.collected) {
        var itemOffset = new Vector2();
        setVector(itemOffset, itemDrop.levelPositionX, itemDrop.levelPositionY);
        var itemEffect = new VisualEffect("Blue Sparkles", collectorPosition, itemOffset, false, 1);
        addVisualEffect(game.effects, itemEffect);
        claimedItem = itemDrop.getItem();
        itemDrop.setCollected(true);
        removeItemDrop(itemDrop, game.itemDrops);
        findOwner: {
          var itemOwner = undefined;
          for (var ownerIndex = 0; ownerIndex < game.state.adventurers.length; ownerIndex++) {
            if (game.state.adventurers[ownerIndex].characterClass === claimedItem.characterClass) {
              itemOwner = game.state.adventurers[ownerIndex];
              break findOwner;
            }
          }
          console.log("failed to find item character");
          itemOwner = null;
        }
        game.state.statisticsRecorder.recordItemFound(claimedItem);
        addInventoryItem(itemOwner.inventory, claimedItem, game.inventories);
        awardAdventurePoints(12);
        claimedRarity = claimedItem.getRarity();
        if (0 != claimedRarity) {
          switch (claimedRarity) {
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
    collectorPosition = combatAction.attacker.position.levelPosition;
    dropList = game.scrollDrops.drops;
    for (dropIndex = dropList.length - 1; 0 <= dropIndex; dropIndex--) {
      drop = dropList[dropIndex];
      if (!drop.collected) {
        var scrollOffset = new Vector2();
        setVector(scrollOffset, drop.levelPositionX, drop.levelPositionY);
        var scrollEffect = new VisualEffect("Pink Sparkles", collectorPosition, scrollOffset, false, 1);
        addVisualEffect(game.effects, scrollEffect);
        drop.setCollected(true);
        removeScrollDrop(drop);
        addScrollCharge(drop.getScroll());
        awardAdventurePoints(10);
      }
    }
    collectorPosition = combatAction.attacker.position.levelPosition;
    dropList = game.potionDrops.drops;
    for (dropIndex = dropList.length - 1; 0 <= dropIndex; dropIndex--) {
      drop = dropList[dropIndex];
      if (!drop.collected) {
        var potionOffset = new Vector2();
        setVector(potionOffset, drop.levelPositionX, drop.levelPositionY);
        var potionEffect = new VisualEffect("Green Sparkles", collectorPosition, potionOffset, false, 1);
        addVisualEffect(game.effects, potionEffect);
        drop.setCollected(true);
        removePotionDrop(drop, game.potionDrops);
        addPotion(drop.potion, game.potions);
        awardAdventurePoints(11);
      }
    }
  } else {
    if (15 === spellCategoryId) {
      combatQueue.findTreasureSpell(combatAction);
    } else {
      if (16 === spellCategoryId && (cleanseTarget = combatAction.targetCharacter)) {
        cleanseEffects = cleanseTarget.effects;
        cleanseEffects.isStunned = false;
        removeStunEffects(cleanseEffects);
      }
    }
  }
}
export function summonSpellMinion(spell, attacker, targetPosition) {
  var minionDefinition = minionsBySpell[spell.name]; if (minionDefinition) {
    spawnMinion(minionDefinition, attacker, targetPosition);
  } else {
    console.log("Failed to find minion for summon spell.");
  }
}
export function applyActionDamage(combatAction) {
  var targetCharacter = combatAction.targetCharacter,
    targetStats = targetCharacter.stats,
    remainingDamage = combatAction.remainingDamage;
  if (0 !== remainingDamage) {
    var rollDamage = 1 + randomInt(remainingDamage - 1);
    if (0 !== rollDamage) {
      remainingDamage = Math.max(0, remainingDamage - rollDamage);
      combatAction.remainingDamage = remainingDamage;
      targetStats.health -= floorNumber(rollDamage);
      if (0 > targetStats.health) {
        targetStats.health = 0;
      }
      var attacker = combatAction.attacker,
        attackerStats = 1 === attacker.characterType ? attacker.summoner.stats : attacker.stats;
      attackerStats.damageGiven += rollDamage;
      targetStats = targetCharacter.stats;
      targetStats.damageReceived += rollDamage;
      if (0 === targetStats.health) {
        resolveCharacterDefeat(combatAction.attacker, targetCharacter);
      }
    }
  }
}
export function resolveCharacterDefeat(attacker, defeated) {
  if (defeated.characterType === ADVENTURER_TYPE) {
    if (!defeated.effects.isStunned) {
      game.state.statisticsRecorder.recordCharacterStunned();
      defeated.effects.isStunned = true;
      var defeatedLevelPosition = defeated.position.levelPosition, stunVisual,
        stunEffect = new StatusEffect(13, game.state.turnNumber, stunEffectDefinition.durationTurns, game.animations.getAnimation(stunEffectDefinition.animationName), stunEffectDefinition.overlayFrameIndex, stunEffectDefinition.hasAnimation, 0);
      stunVisual = new VisualEffect(stunEffectDefinition.animationName, defeatedLevelPosition, defeatedLevelPosition, false, 1);
      defeated.stats.stunCount++;
      var stunEffects = defeated.effects;
      if (stunEffect) {
        stunEffects.activeEffects.push(stunEffect);
        if (isDisablingEffect(stunEffect)) {
          stunEffects.isDisabled = true;
        }
      }
      stunVisual.loopsWhileStunned = true;
      stunVisual.boundCharacter = defeated;
      addVisualEffect(game.effects, stunVisual);
      showFloatingText(game.floatingText, defeated, "昏迷!", "white");
    }
  } else if (1 === defeated.characterType) {
    game.lifecycle.despawnMinion(defeated);
  } else if (4 === defeated.characterType) {
    if (!defeated.isDead) {
      var defeatedPosition = defeated.position,
        killer = 1 === attacker.characterType ? attacker.summoner : attacker, defeatedMonsterType;
      if (isAdventurerOrMinion(killer)) {
        killer.stats.kills++;
        addKills(doubleKillsModifier.currentValue);
        game.state.statisticsRecorder.recordDirectKill();
        if (5 === killer.characterType) {
          game.state.statisticsRecorder.recordScrollKill();
        }
        if (1 === attacker.characterType) {
          game.state.statisticsRecorder.recordMinionKill();
        }
        defeatedMonsterType = defeated.monsterType;
        addExperience(defeatedMonsterType.experienceReward * doubleExperienceModifier.currentValue);
        recordMonsterTypeKill(defeatedMonsterType);
      }
      var dropRoom = defeatedPosition.room,
        westBound = roomLeftPixels(dropRoom) + game.tileSize;
      eastBound = roomRightPixels(dropRoom) - game.tileSize;
      var northBound = roomTopPixels(dropRoom) + game.tileSize,
        southBound = roomBottomPixels(dropRoom) - game.tileSize,
        defeatedX = defeatedPosition.getLevelPositionX(),
        defeatedY = defeatedPosition.getLevelPositionY(),
        goldDropCount = 10 + randomInt(10),
        goldAmount, goldDrop, dropIndex, eastBound, itemCount, scrollCount, potionCount, unlockedScrolls, scrollDefinition, scrollDrop, potion, potionDrop, corpseSprite;
      if (doubleGoldDropsModifier.currentValue) {
        goldDropCount *= 2;
      }
      for (dropIndex = 0; dropIndex < goldDropCount; dropIndex++) {
        goldAmount = 1 + rollGoldDrop();
        goldDrop = new GoldDrop(goldAmount, tickCharacterTurn(defeatedX, westBound, eastBound), tickCharacterTurn(defeatedY, northBound, southBound), dropRoom);
        game.goldDrops.drops.push(goldDrop);
      }
      itemCount = 7 + randomInt(8);
      if (doubleItemDropsModifier.currentValue) {
        itemCount *= 2;
      }
      for (dropIndex = 0; dropIndex < itemCount; dropIndex++) {
        spawnItemDrop(game.itemDrops, tickCharacterTurn(defeatedX, westBound, eastBound), tickCharacterTurn(defeatedY, northBound, southBound), dropRoom, defeated.stats.characterLevel, game.itemGenerator, game.state.adventurers);
      }
      scrollCount = 2 + randomInt(5);
      for (dropIndex = 0; dropIndex < scrollCount; dropIndex++) {
        unlockedScrolls = game.scrolls.unlockedScrolls;
        scrollDefinition = unlockedScrolls[randomInt(unlockedScrolls.length)];
        scrollDrop = new ScrollDrop(scrollDefinition, tickCharacterTurn(defeatedX, westBound, eastBound), tickCharacterTurn(defeatedY, northBound, southBound), dropRoom);
        game.scrollDrops.drops.push(scrollDrop);
      }
      potionCount = 0 + randomInt(2);
      for (dropIndex = 0; dropIndex < potionCount && game.potions.potionList.length < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue; dropIndex++) {
        potion = new Potion(potionDefinitions[randomInt(potionDefinitions.length)], game.itemSprites);
        potionDrop = new PotionDrop(potion, tickCharacterTurn(defeatedX, westBound, eastBound), tickCharacterTurn(defeatedY, northBound, southBound), dropRoom);
        game.potionDrops.drops.push(potionDrop);
      }
      defeated.isDead = true;
      corpseSprite = updateWorldTravel();
      defeated.sprite = corpseSprite;
      game.monsters.clearEncounter(defeated);
      game.state.encounter.clearEncounter();
      recordGameEvent("Boss Defeated", "等级:" + defeated.stats.characterLevel);
      showFloatingText(game.floatingText, defeated, "击杀首领!", "white");
    }
  } else {
    game.lifecycle.clearEncounter(attacker, defeated);
  }
}
export function enqueueCombatAction(combatQueue, combatAction) {
  combatQueue.queue.push(combatAction);
}
export function performMultiAttack(attacker, isRangedAttack) {
  var attackerStats = attacker.stats, targets,
    extraAttackChance = attackerStats.extraAttackChance / 100,
    triggeredExtraAttacks = 0,
    attemptIndex, targetIndex;
  for (attemptIndex = 0; attemptIndex < attackerStats.extraAttackCount; attemptIndex++) {
    if (Math.random() < extraAttackChance) {
      triggeredExtraAttacks++;
    } else {
      break;
    }
  }
  if ((targets = findTargetsInRange(attacker, attacker, 1 + triggeredExtraAttacks, isRangedAttack ? attacker === game.state.scrollCaster ? 100 * RANGED_ATTACK_RANGE : RANGED_ATTACK_RANGE : MELEE_ATTACK_RANGE)) && 0 !== targets.length) {
    for (targetIndex = 0; targetIndex < targets.length; targetIndex++) {
      createAttackAction(attacker, targets[targetIndex], isRangedAttack);
    }
  }
}
export function createAttackAction(attacker, target, isRangedAttack) {
  var combatAction = new CombatAction(), impactVisual, targetPosition, meleeDamage, effectItem, itemEffect;
  combatAction.attacker = attacker;
  (/** @type {TargetedCombatAction} */ (combatAction)).setTargetCharacter(target);
  if (12 == attacker.characterClass) {
    targetPosition = target.position.levelPosition;
    meleeDamage = calculateAttackDamage(attacker, target);
    combatAction.remainingDamage = meleeDamage;
    combatAction.noDamage = 0 === meleeDamage;
    combatAction.hasProjectilePhase = false;
    impactVisual = new VisualEffect("Red Splat", targetPosition, targetPosition, false, 1);
  } else if (isRangedAttack) {
    targetPosition = target.position.levelPosition;
    var attackerPosition = attacker.position.levelPosition,
      rangedDamage = calculateAttackDamage(attacker, target), projectileWeapon, rangedImpactAnimationName, itemEffectName, projectileVisual;
    projectileWeapon = attacker.equipment ? attacker.equipment.projectileWeapon : null;
    effectItem = attacker.getEffectItem();
    itemEffect = effectItem ? effectItem.itemEffect : null;
    combatAction.remainingDamage = rangedDamage;
    combatAction.noDamage = 0 === rangedDamage;
    combatAction.hasProjectilePhase = true;
    rangedImpactAnimationName = "Red Splat";
    if (itemEffect) {
      itemEffectName = itemEffect.itemEffectName;
      if (itemEffectName) {
        rangedImpactAnimationName = itemEffectName;
      }
      projectileVisual = new VisualEffect(getProjectileAnimation(projectileWeapon, itemEffect.itemEffectType), attackerPosition, targetPosition, true, 1);
    } else {
      projectileVisual = new VisualEffect(getProjectileAnimation(projectileWeapon, null), attackerPosition, targetPosition, true, 1);
    }
    projectileVisual.boundCharacter = attacker;
    combatAction.projectileEffect = projectileVisual;
    var chainCount = attacker.stats.rollChainCount();
    if (0 < chainCount) {
      combatAction.chains = true;
      combatAction.chainCount = chainCount;
    }
    impactVisual = new VisualEffect(rangedImpactAnimationName, targetPosition, targetPosition, false, 1);
  } else {
    targetPosition = target.position.levelPosition;
    meleeDamage = calculateAttackDamage(attacker, target);
    effectItem = attacker.getEffectItem(); itemEffect = effectItem ? effectItem.itemEffect : null;
    impactVisual = null;
    combatAction.remainingDamage = meleeDamage;
    combatAction.noDamage = 0 === meleeDamage;
    combatAction.hasProjectilePhase = false;
    if (itemEffect && (itemEffectName = itemEffect.itemEffectName)) {
      impactVisual = new VisualEffect(itemEffectName, targetPosition, targetPosition, false, 1);
    }
    if (!impactVisual) {
      impactVisual = new VisualEffect("Red Splat", targetPosition, targetPosition, false, 1);
    }
  }
  combatAction.impactEffect = impactVisual;
  enqueueCombatAction(game.combatQueue, combatAction);
}
export function createSpellAction(caster) {
  var combatTarget = caster.combatTarget;
  if (!combatTarget || combatTarget.isDead) {
    return null;
  }
  var spellDefinition = caster.spellToCast;
  if (!spellDefinition) {
    return null;
  }
  var combatAction = new CombatAction();
  combatAction.attacker = caster;
  (/** @type {TargetedCombatAction} */ (combatAction)).setTargetCharacter(combatTarget);
  var targetPosition = combatTarget.position.levelPosition,
    casterPosition = caster.position.levelPosition;
  combatAction.actionDefinition = spellDefinition;
  combatAction.hasProjectilePhase = true;
  var projectileEffectName = spellDefinition.projectileEffectName, projectileVisual, impactEffectName, impactVisual, spellCategoryId, spellDamage, casterStats, spiritCost;
  if (projectileEffectName) {
    projectileVisual = new VisualEffect(projectileEffectName, casterPosition, targetPosition, true, 1);
    projectileVisual.boundCharacter = caster;
    combatAction.projectileEffect = projectileVisual;
  }
  if ((impactEffectName = spellDefinition.impactEffectName)) {
    impactVisual = new VisualEffect(impactEffectName, casterPosition, targetPosition, false, 1);
    combatAction.impactEffect = impactVisual;
  }
  spellCategoryId = spellDefinition.spellCategoryId;
  if (4 === spellCategoryId) {
    spellDamage = calculateAttackDamage(caster, combatTarget);
    combatAction.noDamage = 0 === spellDamage;
    combatAction.remainingDamage = spellDamage;
  } else {
    if (13 === spellCategoryId) {
      spellDamage = Math.max(1, calculateAttackDamage(caster, combatTarget));
      combatAction.noDamage = false;
      combatAction.remainingDamage = spellDamage;
    }
  }
  casterStats = caster.stats;
  spiritCost = getSpellSpiritCost(casterStats);
  spendSpirit(casterStats, spiritCost);
  enqueueCombatAction(game.combatQueue, combatAction);
  return combatAction;
}
export function randomPointInRoom(origin, clampRoom) {
  var point = new Vector2(),
    originX = origin.x,
    originY = origin.y,
    xJitter = randomInt(40),
    yJitter = randomInt(40),
    jitteredX = 0.5 >= Math.random() ? originX + xJitter : originX - xJitter,
    jitteredY = 0.5 >= Math.random() ? originY + yJitter : originY - yJitter;
  setVector(point, jitteredX, jitteredY);
  if (clampRoom) {
    clampPointToRoom(clampRoom, point, game.halfTileSize);
  }
  return point;
}
export function applyAreaTileEffect(tileColumn, tileRow, minColumn, maxColumn, minRow, maxRow, tileEffect) {
  var tile; if (tileColumn >= minColumn && tileColumn <= maxColumn && tileRow >= minRow && tileRow <= maxRow && (tile = game.level.getTileAt(tileColumn, tileRow))) {
    setTileEffect(tile, tileEffect);
  }
}
export function getProjectileAnimation(projectileWeapon, itemEffectType) {
  if (3 === projectileWeapon.getProjectileAnimationId()) {
    return "Ninja Star";
  }
  if (itemEffectType) {
    switch (itemEffectType) {
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
export function calculateAttackDamage(attacker, defender) {
  var attackerStats = attacker.stats,
    defenderStats = defender.stats,
    attackRating = statValue(attackerStats.attackRating),
    damage = statValue(attackerStats.damage),
    defenceRating = statValue(defenderStats.defenceRating),
    armor = statValue(defenderStats.armor),
    damageResistance = defenderStats.damageResistance,
    critChance = attackerStats.critChance;
  if (!defender.effects.isDisabled && Math.random() > attackRating / (attackRating + defenceRating)) {
    return 0;
  }
  if (0 < critChance && Math.random() < critChance / 100) {
    return showFloatingText(game.floatingText, attacker, "暴击!", "#FFFF00"), damage;
  }
  var armorReduction = floorNumber(armor / 2);
  damage -= armorReduction + randomInt(armorReduction);
  return 0 >= damage ? 0 : 0 < damageResistance ? Math.max(0, damage - floorNumber(damageResistance / 100 * damage)) : damage;
}
export function calculateSpellDamage(attacker, defender) {
  var attackerStats = attacker.stats,
    damage = statValue(attackerStats.damage),
    armor = statValue(defender.stats.armor),
    critChance = attackerStats.critChance;
  if (0 < critChance && Math.random() < critChance / 100) {
    return showFloatingText(game.floatingText, attacker, "暴击!", "#FFFF00"), damage;
  }
  var armorReduction = floorNumber(armor / 2);
  damage -= armorReduction + randomInt(armorReduction);
  return 0 >= damage ? 0 : damage;
}
export function createChainAction(previousAction) {
  var currentChainStep = previousAction.getChainCount(),
    chainCount = previousAction.chainCount;
  if (currentChainStep >= chainCount) {
    return null;
  }
  var chainTarget = findChainTarget(previousAction.targetCharacter);
  if (!chainTarget) {
    return null;
  }
  var previousProjectileEffect = previousAction.projectileEffect;
  if (!previousProjectileEffect) {
    return null;
  }
  var previousImpactEffect = previousAction.impactEffect;
  if (!previousImpactEffect) {
    return null;
  }
  var chainAction = new CombatAction(),
    impactPosition = previousImpactEffect.targetPosition,
    chainTargetPosition = chainTarget.position.levelPosition;
  chainAction.attacker = previousAction.attacker;
  (/** @type {TargetedCombatAction} */ (chainAction)).setTargetCharacter(chainTarget);
  var impactVisual = new VisualEffect(previousImpactEffect.impactEffectName, impactPosition, chainTargetPosition, false, 1);
  chainAction.impactEffect = impactVisual;
  var projectileVisual = new VisualEffect(previousProjectileEffect.impactEffectName, impactPosition, chainTargetPosition, true, 1);
  chainAction.projectileEffect = projectileVisual;
  chainAction.hasProjectilePhase = true;
  var chainDamage = calculateAttackDamage(previousAction.attacker, chainTarget);
  chainAction.remainingDamage = chainDamage;
  chainAction.noDamage = 0 === chainDamage;
  chainAction.actionDefinition = previousAction.actionDefinition;
  chainAction.currentChainStep = currentChainStep + 1;
  chainAction.chains = true;
  chainAction.chainCount = chainCount;
  return chainAction;
}
export function createReturningAction(previousAction) {
  var currentChainStep = previousAction.getChainCount(),
    chainCount = previousAction.chainCount,
    previousImpactEffect, impactPosition, chainTargetPosition;
  if (currentChainStep === chainCount) {
    var returnAction = new CombatAction();
    returnAction.attacker = previousAction.attacker;
    (/** @type {TargetedCombatAction} */ (returnAction)).setTargetCharacter(previousAction.attacker);
    returnAction.hasProjectilePhase = true;
    returnAction.actionDefinition = previousAction.actionDefinition;
    returnAction.returns = true;
    returnAction.currentChainStep = 1;
    returnAction.chainCount = 0;
    var previousProjectileEffect = previousAction.projectileEffect,
      returnTargetPosition = previousAction.attacker.position.levelPosition,
      returnOriginPosition = previousAction.returnOriginPosition;
    previousImpactEffect = previousAction.impactEffect;
    returnAction.noDamage = false;
    if (previousProjectileEffect) {
      var returningProjectile = new VisualEffect(previousProjectileEffect.impactEffectName, returnTargetPosition, returnOriginPosition, true, 1);
      returningProjectile.isReturning = true;
      returningProjectile.boundCharacter = previousAction.attacker;
      returnAction.projectileEffect = returningProjectile;
    }
    var impactVisual = new VisualEffect(previousImpactEffect.impactEffectName, returnTargetPosition, returnOriginPosition, false, 1);
    returnAction.impactEffect = impactVisual;
    return returnAction;
  }
  if (currentChainStep > chainCount) {
    return null;
  }
  previousImpactEffect = previousAction.impactEffect;
  if (!previousImpactEffect) {
    return null;
  }
  var chainTarget = findChainTarget(previousAction.targetCharacter);
  if (!chainTarget) {
    return null;
  }
  returnAction = new CombatAction();
  returnAction.attacker = previousAction.attacker;
  returnAction.hasProjectilePhase = true;
  returnAction.actionDefinition = previousAction.actionDefinition;
  returnAction.currentChainStep = currentChainStep + 1;
  returnAction.returns = true;
  returnAction.chainCount = chainCount;
  returnAction.returnOriginPosition = previousAction.returnOriginPosition;
  previousProjectileEffect = previousAction.projectileEffect,
    impactPosition = previousImpactEffect.targetPosition,
    chainTargetPosition = chainTarget.position.levelPosition;
  (/** @type {TargetedCombatAction} */ (returnAction)).setTargetCharacter(chainTarget);
  var chainDamage = calculateSpellDamage(previousAction.attacker, chainTarget);
  returnAction.remainingDamage = chainDamage;
  returnAction.noDamage = 0 === chainDamage;
  if (previousProjectileEffect) {
    returningProjectile = new VisualEffect(previousProjectileEffect.impactEffectName, impactPosition, chainTargetPosition, true, 1);
    returningProjectile.isReturning = true;
    returningProjectile.boundCharacter = previousAction.attacker;
    returnAction.projectileEffect = returningProjectile;
  }
  impactVisual = new VisualEffect(previousImpactEffect.impactEffectName, impactPosition, chainTargetPosition, false, 1);
  returnAction.impactEffect = impactVisual;
  return returnAction;
}
export function initializeCombatActions() {
  CombatAction.prototype.setTargetCharacter = function (target) {
    this.targetCharacter = target;
  };
  CombatAction.prototype.getChainCount = function () {
    return this.currentChainStep;
  };
  CombatQueue.prototype.findTreasureSpell = function (combatAction) {
    var treasure; if ((treasure = getRoomTreasure(game.treasure, combatAction.attacker.position.room))) {
      treasure.selected = true;
      game.state.party.setTargetTreasureChest(treasure);
    }
  };
}
