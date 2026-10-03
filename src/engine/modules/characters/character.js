/** 角色实体、技能、装备和帧更新。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { ADVENTURER_TYPE, CAST_ACTION_TYPE, IDLE_ACTION, MELEE_ACTION_TYPE, MONSTER_TYPE, selectScrollTarget } from "../ai/targeting.js";
import { CharacterPosition, Equipment, clearMovementTarget, findCheapestNeighbor, separateDungeonCharacters, separateWorldCharacters } from "./movement.js";
import { BASE_POTION_CAPACITY, CHEST_ITEM_LEVEL_BONUS, CHEST_ITEM_QUALITY_BONUS, DEFAULT_CHAIN_CHANCE, DEFAULT_MINION_LIMIT, DEFAULT_MULTI_ATTACK_CHANCE, DUNGEON_WALK_SPEED, RETREAT_HEALTH_RATIO, RETREAT_SPIRIT_RATIO, WORLD_WALK_SPEED, attackCooldownBonus, dungeonPriceCurve, equipmentQualityBonus, freeSpellsModifier, globalUpgradeDefinitions, potionCapacityBonus, rollGoldDrop, walkingSpeedBonus, walkingSpeedModifier } from "../content/balance.js";
import { CharacterEffects, hasStatusEffect } from "./effects.js";
import { CharacterStats, getAttackCooldown, getSpellSpiritCost, spendSpirit, statValue } from "./stats.js";
import { UpgradeCollection } from "../progression/upgrades.js";
import { ScrollDrop, addScrollCharge, removeScrollDrop, resetSpellCooldown } from "../combat/scrolls.js";
import { game } from "../runtime/game.js";
import { awardAdventurePoints } from "../progression/points.js";
import { addInventoryItem, removeInventoryItemAt } from "../loot/inventory.js";
import { Vector2, addVector, assignVector, distanceToPoint, floorNumber, multiplyVector, normalizeVector, randomInt, recordGameEvent, scaleByLevel, setVector, subtractVector, vectorLength } from "../core/math.js";
import { getAllies, getFriendlyTargets, getOpponents, populateEncounter } from "../combat/encounters.js";
import { clampPointToRoom, getOppositeDoor, isPointNearDoor, revealHallway, revealRoom, roomBottomPixels, roomLeftPixels, roomRightPixels, roomTopPixels, setTileEffect } from "../world/rooms.js";
import { GoldDrop, removeGoldDrop, setChestOpened, spawnRoomTreasure } from "../loot/treasure.js";
import { CombatAction, applyAreaTileEffect, calculateAttackDamage, calculateSpellDamage, createAttackAction, createSpellAction, enqueueCombatAction, performMultiAttack, randomPointInRoom } from "../combat/actions.js";
import { TARGETED_EFFECT, VisualEffect } from "../rendering/sprites.js";
import { RANGED_ATTACK_RANGE } from "../content/classes.js";
import { showFloatingText } from "../rendering/floating-text.js";
import { addGold } from "./party.js";
import { Potion, PotionDrop, addPotion, potionDefinitions, removePotionDrop } from "../combat/potions.js";
import { ItemDrop, generateItem, isBetterItem, randomizeItemLevel, removeItemDrop } from "../loot/items.js";
import { tickCharacterTurn } from "../simulation/characters.js";
import { generateDungeonLevel } from "../world/generation.js";
import { discoverDungeon } from "../world/dungeons.js";
import { HALF_TILE_SIZE, TILE_SIZE } from "../core/screen-layout.js";
/** CombatAction.setTargetCharacter 由 combat/actions.js 后挂到原型，调用点窄签名。 @typedef {CombatAction & { setTargetCharacter: (target: unknown) => void }} TargetedCombatAction */
/** Equipment.getSlotItem/So 由 characters/movement.js 后挂到原型，调用点窄签名。 @typedef {Equipment & { getSlotItem: (slot: unknown) => unknown, getEffectItem: () => unknown }} SlotEquipment */
export function Character(adventurerName, characterType, characterClass, classDefinition, inventory) {
  this.adventurerName = adventurerName;
  this.characterType = characterType;
  this.classDefinition = classDefinition;
  this.characterClass = characterClass;
  if ((slotList = classDefinition.slotStatBonusList) && 0 !== slotList.length) {
    var slotList, slotStatTypes, slotNameList = [];
    var slotBonusIndex;
    for (slotBonusIndex = 0; slotBonusIndex < slotList.length; slotBonusIndex++) {
      slotNameList.push(slotList[slotBonusIndex].slot);
    }
    slotList = slotNameList;
  } else {
    slotList = null;
  }
  this.slotList = slotList;
  if (slotStatTypes = classDefinition.slotStatBonusList) {
    var slotStatTypeMap = {};
    for (var slotStatBonusIndex = 0; slotStatBonusIndex < slotStatTypes.length; slotStatBonusIndex++) {
      slotStatTypeMap[slotStatTypes[slotStatBonusIndex].slot] = slotStatTypes[slotStatBonusIndex].statType;
    }
    slotStatTypes = slotStatTypeMap;
  } else {
    slotStatTypes = null;
  }
  this.slotStatTypes = slotStatTypes;
  this.equipment = characterType != MONSTER_TYPE ? new Equipment(this.slotList, this.characterClass) : null;
  this.monsterType = this.sprite = null;
  this.position = new CharacterPosition(WORLD_WALK_SPEED, DUNGEON_WALK_SPEED);
  this.effects = new CharacterEffects(this);
  if (this.inventory = inventory) {
    this.inventory.owner = this;
  }
  this.actionType = IDLE_ACTION;
  this.isDead = false;
  this.spellToCast = this.targetTreasureChest = this.targetItemDrop = this.targetPotionDrop = this.targetScrollDrop = this.targetGoldDrop = this.combatTarget = this.behaviors = null;
  this.stats = new CharacterStats(this, getCharacterStatRules());
  this.lastAttackTurn = -3 * getAttackCooldown(this.stats, true);
  this.summoner = null;
  this.summonedAtTurn = this.lifetimeTurns = 0;
  this.companion = this.summonedMinions = null;
  this.spells = this.characterType === ADVENTURER_TYPE ? [] : null;
  this.initialSpellSkillPoint = this.skillPoints = 0;
  this.hasUnspentSkills = false;
  this.skillTree4 = this.skillTree3 = this.skillTree2 = this.skillTree1 = null;
  if (this.characterType === ADVENTURER_TYPE) {
    var skillTree1Upgrades = this.classDefinition.buildSkillTree1();
    var skillTree2Upgrades = this.classDefinition.buildSkillTree2();
    var skillTree3Upgrades = this.classDefinition.buildSkillTree3();
    var skillTree4Upgrades = this.classDefinition.buildSkillTree4();
    bindSkillTree(this, skillTree1Upgrades);
    bindSkillTree(this, skillTree2Upgrades);
    bindSkillTree(this, skillTree3Upgrades);
    bindSkillTree(this, skillTree4Upgrades);
    this.skillTree1 = new UpgradeCollection([skillTree1Upgrades], false);
    this.skillTree2 = new UpgradeCollection([skillTree2Upgrades], false);
    this.skillTree3 = new UpgradeCollection([skillTree3Upgrades], false);
    this.skillTree4 = new UpgradeCollection([skillTree4Upgrades], false);
  }
}
export function bindSkillTree(character, skillTreeUpgrades) {
  if (skillTreeUpgrades) {
    var upgradeIndex, upgrade;
    for (upgradeIndex = 0; upgradeIndex < skillTreeUpgrades.length; upgradeIndex++) {
      upgrade = skillTreeUpgrades[upgradeIndex];
      upgrade.resetState();
      upgrade.bindCharacter(character);
      if (0 < upgradeIndex) {
        upgrade.prerequisite = skillTreeUpgrades[upgradeIndex - 1];
      }
    }
  }
}
export function learnSpell(character, spell) {
  if (!character.spells) {
    character.spells = [];
  }
  resetSpellCooldown(spell);
  character.spells.push(spell);
  if (character.behaviors) {
    character.behaviors.notifySpellLearned(spell);
  }
}
export function hasUnpurchasedUpgrade(upgrades) {
  if (upgrades) {
    var upgradeIndex;
    for (upgradeIndex = 0; upgradeIndex < upgrades.length; upgradeIndex++) {
      if (!upgrades[upgradeIndex].isOwned()) {
        return true;
      }
    }
  }
  return false;
}
export function hasUnspentSkills(character) {
  return hasUnpurchasedUpgrade(character.skillTree1.upgrades) || hasUnpurchasedUpgrade(character.skillTree2.upgrades) || hasUnpurchasedUpgrade(character.skillTree3.upgrades) || hasUnpurchasedUpgrade(character.skillTree4.upgrades);
}
export function countSummonedMinions(character) {
  return character.summonedMinions && 0 !== character.summonedMinions.length ? character.companion ? Math.max(0, character.summonedMinions.length - 1) : character.summonedMinions.length : 0;
}
export function markAttackTurn(character) {
  character.lastAttackTurn = game.state.turnNumber;
}
export function canAttack(character) {
  return game.state.turnNumber - character.lastAttackTurn >= getAttackCooldown(character.stats, isAdventurerOrMinion(character));
}
export function isAdventurerOrMinion(character) {
  return character.characterType === ADVENTURER_TYPE || 1 === character.characterType || 5 === character.characterType;
}
export function isHostile(character) {
  return character.characterType === MONSTER_TYPE || 3 === character.characterType || 4 === character.characterType;
}
export function equipItem(character, item) {
  if (item.characterClass !== character.characterClass) {
    console.log("failed to equip non-equipable item. itemSlot=" + item.slot + " charClass=" + character.characterClass);
  } else if (character.equipment) {
    var replacedItem = character.equipment.getSlotItem(item.slot);
    character.equipment.equipItem(item);
    if (character.inventory) {
      character.inventory.removeItem(item);
      if (replacedItem) {
        addInventoryItem(character.inventory, replacedItem, game.inventories);
      }
    }
    var stats = character.stats,
      slotIndex,
      equippedItem;
    stats.attackRating.itemValue = 0;
    stats.defenceRating.itemValue = 0;
    stats.armor.itemValue = 0;
    stats.damage.itemValue = 0;
    stats.maxHealth.itemValue = 0;
    stats.maxSpirit.itemValue = 0;
    var slotList = stats.owner.slotList,
      equipment = stats.owner.equipment;
    for (slotIndex = 0; slotIndex < slotList.length; slotIndex++) {
      if (equippedItem = equipment.getSlotItem(slotList[slotIndex])) {
        var damageStat = stats.damage;
        damageStat.itemValue += 1 === equippedItem.characteristic ? equippedItem.itemValue : 0;
        var armorStat = stats.armor;
        armorStat.itemValue += 2 === equippedItem.characteristic ? equippedItem.itemValue : 0;
        var attackRatingStat = stats.attackRating;
        attackRatingStat.itemValue += 3 === equippedItem.characteristic ? equippedItem.itemValue : 0;
        var defenceRatingStat = stats.defenceRating;
        defenceRatingStat.itemValue += 4 === equippedItem.characteristic ? equippedItem.itemValue : 0;
        var maxHealthStat = stats.maxHealth;
        maxHealthStat.itemValue += 5 === equippedItem.characteristic ? equippedItem.itemValue : 0;
        var maxSpiritStat = stats.maxSpirit;
        maxSpiritStat.itemValue += 6 === equippedItem.characteristic ? equippedItem.itemValue : 0;
      }
    }
    stats.health = Math.min(stats.health, statValue(stats.maxHealth));
    stats.spirit = Math.min(stats.spirit, statValue(stats.maxSpirit));
  }
}
export function updateCharacter(character, simulationUnits) {
  if (!character.isDead && character.actionType !== IDLE_ACTION) {
    if (1 === character.actionType) {
      if (game.worldActive) {
        var position = character.position;
        if (character === game.state.leader) {
          a: {
            assignVector(position.velocity, position.worldDestinationPoint);
            subtractVector(position.velocity, position.worldPosition);
            var leaderStepDistance = simulationUnits * position.worldWalkSpeed * walkingSpeedBonus.currentValue * walkingSpeedModifier.currentValue,
              leaderWorldTileColumn = game.world.pixelToTileColumn(position.worldPosition.x),
              leaderWorldTileRow = game.world.pixelToTileRow(position.worldPosition.y);
            if (vectorLength(position.velocity) <= leaderStepDistance) {
              assignVector(position.worldPosition, position.worldDestinationPoint);
              position.movementTargetCleared = true;
            } else if (leaderWorldTileColumn === position.destTileColumn && leaderWorldTileRow === position.destTileRow) {
              position.movementTargetCleared = true;
            } else {
              if (!position.nextWorldTile || !position.currentWorldTile || position.currentWorldTile.getWorldColumn() !== leaderWorldTileColumn || position.currentWorldTile.getWorldRow() !== leaderWorldTileRow) {
                position.previousWorldTile = position.currentWorldTile;
                position.currentWorldTile = game.world.getTileAtPixel(leaderWorldTileColumn, leaderWorldTileRow);
                if (!position.currentWorldTile) {
                  console.log("no current world tile!");
                  break a;
                }
                if (1 >= Math.abs(leaderWorldTileColumn - position.destTileColumn) && 1 >= Math.abs(leaderWorldTileRow - position.destTileRow)) {
                  position.nextWorldTile = game.world.getTileAtPixel(position.destTileColumn, position.destTileRow);
                } else {
                  position.nextWorldTile = findCheapestNeighbor(position.currentWorldTile, position.previousWorldTile);
                  if (position.nextWorldTile && position.nextWorldTile.getWorldColumn() !== position.destTileColumn && position.nextWorldTile.getWorldRow() !== position.destTileRow) {
                    position.nextWorldTile = findCheapestNeighbor(position.nextWorldTile, position.currentWorldTile);
                  }
                }
              }
              setVector(position.velocity, position.nextWorldTile.getPixelX() + 1, position.nextWorldTile.getPixelY() + 1);
              subtractVector(position.velocity, position.worldPosition);
              if (separateWorldCharacters(position)) {
                normalizeVector(position.velocity);
                multiplyVector(position.worldSeparationVector, 0.5);
                addVector(position.velocity, position.worldSeparationVector);
              }
              normalizeVector(position.velocity);
              multiplyVector(position.velocity, leaderStepDistance);
              addVector(position.worldPosition, position.velocity);
            }
          }
        } else {
          assignVector(position.velocity, position.worldDestinationPoint);
          subtractVector(position.velocity, position.worldPosition);
          var memberStepDistance = simulationUnits * position.worldWalkSpeed * walkingSpeedBonus.currentValue * walkingSpeedModifier.currentValue,
            memberWorldTileColumn = game.world.pixelToTileColumn(position.worldPosition.x),
            memberWorldTileRow = game.world.pixelToTileRow(position.worldPosition.y);
          if (vectorLength(position.velocity) <= memberStepDistance) {
            assignVector(position.worldPosition, position.worldDestinationPoint);
            position.movementTargetCleared = true;
          } else {
            if (memberWorldTileColumn === position.destTileColumn && memberWorldTileRow === position.destTileRow) {
              position.movementTargetCleared = true;
            } else {
              setVector(position.velocity, position.worldDestinationPoint.x + 1, position.worldDestinationPoint.y + 1);
              subtractVector(position.velocity, position.worldPosition);
              if (separateWorldCharacters(position)) {
                normalizeVector(position.velocity);
                multiplyVector(position.worldSeparationVector, 0.5);
                addVector(position.velocity, position.worldSeparationVector);
              }
              normalizeVector(position.velocity);
              multiplyVector(position.velocity, memberStepDistance);
              addVector(position.worldPosition, position.velocity);
            }
          }
        }
      } else {
        var dungeonPosition = character.position,
          dungeonStepDistance;
        dungeonStepDistance = isAdventurerOrMinion(character) ? simulationUnits * dungeonPosition.dungeonWalkSpeed * walkingSpeedBonus.currentValue * walkingSpeedModifier.currentValue : dungeonPosition.dungeonWalkSpeed * simulationUnits;
        if (null != dungeonPosition.routeQueue && 0 < dungeonPosition.routeQueue.length) {
          var nextRouteDoor = dungeonPosition.routeQueue[0];
          setVector(dungeonPosition.velocity, nextRouteDoor.pixelColumn, nextRouteDoor.pixelRow);
          subtractVector(dungeonPosition.velocity, dungeonPosition.levelPosition);
          if (vectorLength(dungeonPosition.velocity) <= dungeonStepDistance) {
            var canPassRouteDoor;
            if (!(canPassRouteDoor = nextRouteDoor.isOpen)) {
              var isPartyAtSameLocation;
              a: {
                var locationAllyIndex,
                  locationAllies = getAllies(),
                  allyPosition = locationAllies[0].position,
                  firstAllyRoom = allyPosition.room,
                  firstAllyHallway = allyPosition.currentHallway;
                for (locationAllyIndex = 1; locationAllyIndex < locationAllies.length; locationAllyIndex++) {
                  if (allyPosition = locationAllies[locationAllyIndex].position, allyPosition.currentHallway != firstAllyHallway || allyPosition.room != firstAllyRoom) {
                    isPartyAtSameLocation = false;
                    break a;
                  }
                }
                isPartyAtSameLocation = true;
              }
              var isPartyFitToPassDoor;
              if (isPartyFitToPassDoor = isPartyAtSameLocation) {
                a: {
                  var fitnessAllyIndex,
                    fitnessAllies = getAllies(),
                    allyStats,
                    routeHallwayDiscovered = nextRouteDoor.hallway.discovered;
                  for (fitnessAllyIndex = 0; fitnessAllyIndex < fitnessAllies.length; fitnessAllyIndex++) {
                    if (fitnessAllies[fitnessAllyIndex].effects.isDisabled) {
                      isPartyFitToPassDoor = false;
                      break a;
                    }
                    if (routeHallwayDiscovered && (allyStats = fitnessAllies[fitnessAllyIndex].stats, fitnessAllies[fitnessAllyIndex].characterType === ADVENTURER_TYPE && (allyStats.health / statValue(allyStats.maxHealth) < RETREAT_HEALTH_RATIO || allyStats.spirit / statValue(allyStats.maxSpirit) < RETREAT_SPIRIT_RATIO))) {
                      isPartyFitToPassDoor = false;
                      break a;
                    }
                  }
                  isPartyFitToPassDoor = true;
                }
              }
              canPassRouteDoor = isPartyFitToPassDoor;
            }
            if (canPassRouteDoor) {
              setVector(dungeonPosition.levelPosition, nextRouteDoor.pixelColumn | 0, nextRouteDoor.pixelRow | 0);
              var reachedRouteDoor = dungeonPosition.routeQueue.shift();
              if (!reachedRouteDoor.isOpen) {
                a: {
                  var party = game.state.party;
                  if (!reachedRouteDoor.isOpen) {
                    reachedRouteDoor.isOpen = true;
                    game.state.statisticsRecorder.recordDoorOpened();
                    awardAdventurePoints(2);
                    if (!reachedRouteDoor.leadsTo.discovered) {
                      populateEncounter(reachedRouteDoor.leadsTo);
                      revealRoom(reachedRouteDoor.leadsTo);
                      spawnRoomTreasure(reachedRouteDoor.leadsTo);
                    }
                    var reachedDoorHallway = reachedRouteDoor.hallway;
                    if (!reachedDoorHallway.discovered) {
                      revealHallway(reachedDoorHallway, true);
                      var oppositeDoor = getOppositeDoor(reachedDoorHallway, reachedRouteDoor);
                      if (!oppositeDoor.isOpen) {
                        party.setTargetDoor(oppositeDoor);
                        party.destinationRoom = oppositeDoor.leadsTo;
                        break a;
                      }
                    }
                    if (reachedRouteDoor === party.targetDoor) {
                      party.destinationRoom = party.targetDoor.leadsTo;
                      party.targetDoor = null;
                    }
                  }
                }
              }
              if (dungeonPosition.room) {
                dungeonPosition.currentHallway = reachedRouteDoor.hallway;
                dungeonPosition.room = null;
              } else {
                dungeonPosition.currentHallway = null;
                dungeonPosition.room = reachedRouteDoor.leadsTo;
              }
              dungeonPosition.floorPositionIndex = -1;
              if (0 === dungeonPosition.routeQueue.length) {
                if (!dungeonPosition.targetRoom) {
                  clearMovementTarget(dungeonPosition);
                }
              }
            }
          } else if (dungeonPosition.currentHallway) {
            var pathTiles = dungeonPosition.currentHallway.pathTiles,
              nextDoorIsDoorB = nextRouteDoor === dungeonPosition.currentHallway.doorB;
            if (-1 === dungeonPosition.floorPositionIndex) {
              dungeonPosition.floorPositionIndex = nextDoorIsDoorB ? 0 : pathTiles.length - 1;
            }
            var nextPathLevelTile = null,
              nextPathTile;
            if (nextDoorIsDoorB) {
              if (dungeonPosition.floorPositionIndex < pathTiles.length - 1) {
                nextPathTile = pathTiles[dungeonPosition.floorPositionIndex + 1];
                nextPathLevelTile = game.level.getTileAt(nextPathTile.x, nextPathTile.y);
              }
            } else {
              if (0 < dungeonPosition.floorPositionIndex) {
                nextPathTile = pathTiles[dungeonPosition.floorPositionIndex - 1];
                nextPathLevelTile = game.level.getTileAt(nextPathTile.x, nextPathTile.y);
              }
            }
            if (nextPathLevelTile) {
              setVector(dungeonPosition.velocity, nextPathLevelTile.getPixelX(), nextPathLevelTile.getPixelY());
            } else {
              setVector(dungeonPosition.velocity, nextRouteDoor.pixelColumn, nextRouteDoor.pixelRow);
            }
            subtractVector(dungeonPosition.velocity, dungeonPosition.levelPosition);
            if (vectorLength(dungeonPosition.velocity) <= dungeonStepDistance) {
              if (nextPathLevelTile) {
                setVector(dungeonPosition.levelPosition, nextPathLevelTile.getPixelX() | 0, nextPathLevelTile.getPixelY() | 0);
              } else {
                setVector(dungeonPosition.levelPosition, nextRouteDoor.pixelColumn | 0, nextRouteDoor.pixelRow | 0);
              }
              if (nextDoorIsDoorB) {
                dungeonPosition.floorPositionIndex++;
              } else {
                dungeonPosition.floorPositionIndex--;
              }
            } else {
              normalizeVector(dungeonPosition.velocity);
              multiplyVector(dungeonPosition.velocity, dungeonStepDistance);
              addVector(dungeonPosition.levelPosition, dungeonPosition.velocity);
            }
          } else {
            if (separateDungeonCharacters(dungeonPosition)) {
              normalizeVector(dungeonPosition.velocity);
              addVector(dungeonPosition.velocity, dungeonPosition.separationVector);
            }
            normalizeVector(dungeonPosition.velocity);
            multiplyVector(dungeonPosition.velocity, dungeonStepDistance);
            addVector(dungeonPosition.levelPosition, dungeonPosition.velocity);
          }
        } else {
          assignVector(dungeonPosition.velocity, dungeonPosition.moveTargetPoint);
          subtractVector(dungeonPosition.velocity, dungeonPosition.levelPosition);
          if (vectorLength(dungeonPosition.velocity) <= dungeonStepDistance) {
            assignVector(dungeonPosition.levelPosition, dungeonPosition.moveTargetPoint);
            if (dungeonPosition.targetRoom) {
              game.state.party.completeLevel();
            }
            clearMovementTarget(dungeonPosition);
          } else {
            if (separateDungeonCharacters(dungeonPosition)) {
              normalizeVector(dungeonPosition.velocity);
              addVector(dungeonPosition.velocity, dungeonPosition.separationVector);
            }
            normalizeVector(dungeonPosition.velocity);
            multiplyVector(dungeonPosition.velocity, dungeonStepDistance);
            addVector(dungeonPosition.levelPosition, dungeonPosition.velocity);
          }
        }
        if (dungeonPosition.room) {
          if (isAdventurerOrMinion(character)) {
            if (dungeonPosition.room) {
              var clampRoom = dungeonPosition.room,
                clampPosition = dungeonPosition.levelPosition,
                clampPadding = HALF_TILE_SIZE;
              if (clampPosition) {
                if (!(isPointNearDoor(clampRoom, clampPosition) || clampRoom.stairs && distanceToPoint(clampPosition, clampRoom.stairs.pixelColumn, clampRoom.stairs.pixelRow) < TILE_SIZE)) {
                  clampPointToRoom(clampRoom, clampPosition, clampPadding);
                }
              }
            }
          } else {
            if (dungeonPosition.room) {
              clampPointToRoom(dungeonPosition.room, dungeonPosition.levelPosition, HALF_TILE_SIZE);
            }
          }
        }
      }
    } else {
      if (2 === character.actionType) {
        if (character.combatTarget && !character.combatTarget.isDead) {
          if (0 < character.stats.extraAttackCount) {
            performMultiAttack(character, false);
          } else {
            var meleeAttackTarget = character.combatTarget;
            if (meleeAttackTarget) {
              createAttackAction(character, meleeAttackTarget, false);
            }
          }
          if (isAdventurerOrMinion(character)) {
            game.state.statisticsRecorder.recordMeleeAttack();
          }
        }
      } else if (character.actionType === MELEE_ACTION_TYPE) {
        if (character.combatTarget && !character.combatTarget.isDead) {
          if (0 < character.stats.extraAttackCount) {
            performMultiAttack(character, true);
          } else {
            var rangedAttackTarget = character.combatTarget;
            if (rangedAttackTarget) {
              createAttackAction(character, rangedAttackTarget, true);
            }
          }
          if (isAdventurerOrMinion(character)) {
            game.state.statisticsRecorder.recordRangedAttack();
          }
        }
      } else if (character.actionType === CAST_ACTION_TYPE) {
        if (character.spellToCast) {
          var spellCategoryId = character.spellToCast.spellCategoryId,
            statusEffectTypeId = character.spellToCast.statusEffectTypeId;
          if (2 !== spellCategoryId || 4 !== statusEffectTypeId && 1 !== statusEffectTypeId && 0 !== statusEffectTypeId) {
            if (3 === spellCategoryId) {
              var spellToCast = character.spellToCast;
              if (spellToCast) {
                var friendlyTargetIndex,
                  friendlyTarget,
                  friendlySpellAction,
                  friendlyTargetPosition,
                  friendlyProjectileVisual,
                  friendlyProjectileEffectName = spellToCast.projectileEffectName,
                  friendlyImpactEffectName = spellToCast.impactEffectName,
                  casterLevelPosition = character.position.levelPosition,
                  friendlyTargets = getFriendlyTargets(character);
                for (friendlyTargetIndex = 0; friendlyTargetIndex < friendlyTargets.length; friendlyTargetIndex++) {
                  friendlyTarget = friendlyTargets[friendlyTargetIndex];
                  friendlySpellAction = new CombatAction();
                  friendlySpellAction.attacker = character;
                  (/** @type {TargetedCombatAction} */ (friendlySpellAction)).setTargetCharacter(friendlyTarget);
                  friendlySpellAction.actionDefinition = spellToCast;
                  friendlySpellAction.hasProjectilePhase = true;
                  friendlyTargetPosition = friendlyTarget.position.levelPosition;
                  if (friendlyProjectileEffectName) {
                    friendlyProjectileVisual = new VisualEffect(friendlyProjectileEffectName, casterLevelPosition, friendlyTargetPosition, true, 1);
                    friendlyProjectileVisual.boundCharacter = character;
                    friendlySpellAction.projectileEffect = friendlyProjectileVisual;
                  }
                  if (friendlyImpactEffectName) {
                    var friendlyImpactVisual = new VisualEffect(friendlyImpactEffectName, casterLevelPosition, friendlyTargetPosition, false, 1);
                    friendlySpellAction.impactEffect = friendlyImpactVisual;
                  }
                  enqueueCombatAction(game.combatQueue, friendlySpellAction);
                }
                var buffCasterStats = character.stats,
                  buffSpiritCost = getSpellSpiritCost(buffCasterStats);
                spendSpirit(buffCasterStats, buffSpiritCost);
              }
            } else if (5 === spellCategoryId) {
              var chainLightningSpell = character.spellToCast;
              if (chainLightningSpell) {
                var currentChainTarget = character.combatTarget;
                if (currentChainTarget && !currentChainTarget.isDead) {
                  var chainArcLimit = 1 + (character.stats.chainArcBonus + 1),
                    nextChainTarget = null,
                    previousArcTarget1 = null,
                    previousArcTarget2 = null,
                    previousArcTarget3 = null,
                    previousArcTarget4 = null,
                    arcIndex,
                    arcSpellAction,
                    arcTargetPosition,
                    arcImpactEffectName = chainLightningSpell.impactEffectName,
                    arcProjectileVisual,
                    arcDamage,
                    arcOriginPosition = character.position.levelPosition;
                  for (arcIndex = 0; arcIndex < chainArcLimit && currentChainTarget; arcIndex++) {
                    arcSpellAction = new CombatAction();
                    arcSpellAction.attacker = character;
                    (/** @type {TargetedCombatAction} */ (arcSpellAction)).setTargetCharacter(currentChainTarget);
                    arcSpellAction.actionDefinition = chainLightningSpell;
                    arcSpellAction.hasProjectilePhase = true;
                    arcTargetPosition = currentChainTarget.position.levelPosition;
                    arcProjectileVisual = new VisualEffect(null, arcOriginPosition, arcTargetPosition, true, 2);
                    arcProjectileVisual.boundCharacter = character;
                    arcSpellAction.projectileEffect = arcProjectileVisual;
                    var arcImpactVisual = new VisualEffect(arcImpactEffectName, arcTargetPosition, arcTargetPosition, false, 1);
                    arcSpellAction.impactEffect = arcImpactVisual;
                    arcOriginPosition = arcTargetPosition;
                    arcDamage = Math.max(1, calculateAttackDamage(character, currentChainTarget));
                    arcSpellAction.noDamage = 0 === arcDamage;
                    arcSpellAction.remainingDamage = arcDamage;
                    enqueueCombatAction(game.combatQueue, arcSpellAction);
                    var arcRange = RANGED_ATTACK_RANGE,
                      arcCandidateTargets = getFriendlyTargets(currentChainTarget);
                    if (0 === arcCandidateTargets.length) {
                      nextChainTarget = null;
                    } else {
                      var arcCandidateRoom = currentChainTarget.position.room;
                      if (arcCandidateRoom) {
                        for (var arcCandidate = undefined, arcDistanceOrigin = currentChainTarget.position.levelPosition, nearestArcCandidate = null, debuffedArcCandidate = null, arcCandidateDistance = undefined, arcCandidateEffects = undefined, bestArcCandidateDistance = -1, arcCandidateIndex = 0; arcCandidateIndex < arcCandidateTargets.length; arcCandidateIndex++) {
                          arcCandidate = arcCandidateTargets[arcCandidateIndex];
                          if (!(arcCandidate === currentChainTarget || arcCandidate === previousArcTarget1 || arcCandidate === previousArcTarget2 || arcCandidate === previousArcTarget3 || arcCandidate === previousArcTarget4 || arcCandidate.isDead || arcCandidate.position.room !== arcCandidateRoom)) {
                            arcCandidateDistance = arcDistanceOrigin.distanceTo(arcCandidate.position.levelPosition);
                            if (arcCandidateDistance <= arcRange && (0 > bestArcCandidateDistance || arcCandidateDistance < bestArcCandidateDistance)) {
                              arcCandidateEffects = arcCandidate.effects;
                              if (arcCandidateEffects.isStealthed || arcCandidateEffects.isDisabled || arcCandidateEffects.isConverted) {
                                debuffedArcCandidate = arcCandidate;
                              } else {
                                nearestArcCandidate = arcCandidate;
                                bestArcCandidateDistance = arcCandidateDistance;
                              }
                            }
                          }
                        }
                        nextChainTarget = nearestArcCandidate ? nearestArcCandidate : debuffedArcCandidate;
                      } else {
                        nextChainTarget = null;
                      }
                    }
                    previousArcTarget4 = previousArcTarget3;
                    previousArcTarget3 = previousArcTarget2;
                    previousArcTarget2 = previousArcTarget1;
                    previousArcTarget1 = currentChainTarget;
                    currentChainTarget = nextChainTarget;
                  }
                  var chainCasterStats = character.stats,
                    chainSpiritCost = getSpellSpiritCost(chainCasterStats);
                  spendSpirit(chainCasterStats, chainSpiritCost);
                }
              }
            } else if (6 === spellCategoryId) {
              var rainSpellDefinition = character.spellToCast;
              if (rainSpellDefinition) {
                var rainTarget = character.combatTarget;
                if (rainTarget && !rainTarget.isDead) {
                  var rainAreaRadius = character.stats.rainAreaBonus + 1,
                    rainSpellAction,
                    rainProjectileVisual,
                    rainProjectileEffectName = rainSpellDefinition.projectileEffectName,
                    rainImpactEffectName = rainSpellDefinition.impactEffectName,
                    rainCasterPosition = character.position.levelPosition,
                    rainCasterRoom = character.position.room,
                    rainTargetPosition = rainTarget.position.levelPosition,
                    rainDamage,
                    rainImpactVisual;
                  if (rainCasterRoom) {
                    if (rainImpactEffectName) {
                      rainSpellAction = new CombatAction();
                      rainSpellAction.attacker = character;
                      (/** @type {TargetedCombatAction} */ (rainSpellAction)).setTargetCharacter(rainTarget);
                      rainSpellAction.actionDefinition = rainSpellDefinition;
                      rainSpellAction.hasProjectilePhase = true;
                      if (rainProjectileEffectName) {
                        rainProjectileVisual = new VisualEffect(rainProjectileEffectName, rainCasterPosition, rainTargetPosition, true, 1);
                        rainProjectileVisual.boundCharacter = character;
                        rainSpellAction.projectileEffect = rainProjectileVisual;
                      }
                      rainDamage = statValue(character.stats.damage);
                      rainSpellAction.noDamage = false;
                      rainSpellAction.remainingDamage = rainDamage;
                      rainImpactVisual = new VisualEffect(rainImpactEffectName, rainCasterPosition, rainTargetPosition, false, TARGETED_EFFECT);
                      rainImpactVisual.boundCharacter = character;
                      rainImpactVisual.room = rainCasterRoom;
                      rainImpactVisual.remainingEffectDamage = rainDamage;
                      rainSpellAction.impactEffect = rainImpactVisual;
                      var rainTargetCharacterPosition = rainTarget.position,
                        rainTargetRoom = rainTargetCharacterPosition.room,
                        rainTargetTileColumn = game.level.pixelToTileColumn(rainTargetCharacterPosition.getLevelPositionX()),
                        rainTargetTileRow = game.level.pixelToTileRow(rainTargetCharacterPosition.getLevelPositionY()),
                        rainAreaTile,
                        rainRoomLeftTileColumn = rainTargetRoom.tileColumn,
                        rainRoomTopTileRow = rainTargetRoom.tileRow,
                        rainRoomRightTileColumn = rainRoomLeftTileColumn + rainTargetRoom.widthInTiles,
                        rainRoomBottomTileRow = rainRoomTopTileRow + rainTargetRoom.heightInTiles,
                        rainTileColumnCursor,
                        db,
                        rainAreaMinTileColumn = Math.max(rainRoomLeftTileColumn, rainTargetTileColumn - rainAreaRadius),
                        rainAreaMaxTileColumn = Math.min(rainRoomRightTileColumn, rainTargetTileColumn + rainAreaRadius),
                        rainAreaMinTileRow = Math.max(rainRoomTopTileRow, rainTargetTileRow - rainAreaRadius),
                        rainAreaMaxTileRow = Math.min(rainRoomBottomTileRow, rainTargetTileRow + rainAreaRadius);
                      for (rainTileColumnCursor = rainAreaMinTileColumn; rainTileColumnCursor <= rainAreaMaxTileColumn; rainTileColumnCursor++) {
                        for (db = rainAreaMinTileRow; db <= rainAreaMaxTileRow; db++) {
                          if ((rainAreaTile = game.level.getTileAt(rainTileColumnCursor, db)) && 0.5 > Math.random()) {
                            setTileEffect(rainAreaTile, rainImpactVisual);
                          }
                        }
                      }
                      enqueueCombatAction(game.combatQueue, rainSpellAction);
                      var rainCasterStats = character.stats,
                        rainSpiritCost = getSpellSpiritCost(rainCasterStats);
                      spendSpirit(rainCasterStats, rainSpiritCost);
                    } else {
                      console.log("no effect name for rain damage spell");
                    }
                  }
                }
              }
            } else if (8 === spellCategoryId) {
              var blastTarget = character.combatTarget;
              if (blastTarget && !blastTarget.isDead) {
                var blastSpellDefinition = character.spellToCast;
                if (blastSpellDefinition) {
                  var blastSpellAction = new CombatAction();
                  blastSpellAction.attacker = character;
                  (/** @type {TargetedCombatAction} */ (blastSpellAction)).setTargetCharacter(blastTarget);
                  var blastTargetPosition = blastTarget.position.levelPosition,
                    blastCasterPosition = character.position.levelPosition;
                  blastSpellAction.actionDefinition = blastSpellDefinition;
                  blastSpellAction.hasProjectilePhase = true;
                  var blastProjectileEffectName = blastSpellDefinition.projectileEffectName;
                  if (blastProjectileEffectName) {
                    var blastProjectileVisual = new VisualEffect(blastProjectileEffectName, blastCasterPosition, blastTargetPosition, true, 1);
                    blastProjectileVisual.boundCharacter = character;
                    blastSpellAction.projectileEffect = blastProjectileVisual;
                  }
                  var blastImpactEffectName = blastSpellDefinition.impactEffectName;
                  if (blastImpactEffectName) {
                    var blastDamage = statValue(character.stats.damage);
                    blastSpellAction.noDamage = false;
                    blastSpellAction.remainingDamage = blastDamage;
                    var impactEffect = new VisualEffect(blastImpactEffectName, blastCasterPosition, blastTargetPosition, false, TARGETED_EFFECT),
                      blastImpactEffectRoom = blastTarget.position.room;
                    impactEffect.boundCharacter = character;
                    impactEffect.room = blastImpactEffectRoom;
                    impactEffect.remainingEffectDamage = blastDamage;
                    blastSpellAction.impactEffect = impactEffect;
                    var blastAreaRadius = character.stats.areaRadiusBonus + 1,
                      blastTargetCharacterPosition = blastTarget.position,
                      blastTargetRoom = blastTargetCharacterPosition.room,
                      targetTileColumn = game.level.pixelToTileColumn(blastTargetCharacterPosition.getLevelPositionX()),
                      targetTileRow = game.level.pixelToTileRow(blastTargetCharacterPosition.getLevelPositionY()),
                      blastRoomLeftTileColumn = blastTargetRoom.tileColumn,
                      blastRoomTopTileRow = blastTargetRoom.tileRow,
                      blastRoomRightTileColumn = blastRoomLeftTileColumn + blastTargetRoom.widthInTiles,
                      roomBottomTileRow = blastRoomTopTileRow + blastTargetRoom.heightInTiles;
                    applyAreaTileEffect(targetTileColumn, targetTileRow, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                    if (0 < blastAreaRadius) {
                      applyAreaTileEffect(targetTileColumn, targetTileRow - 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                      applyAreaTileEffect(targetTileColumn, targetTileRow + 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                      applyAreaTileEffect(targetTileColumn - 1, targetTileRow, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                      applyAreaTileEffect(targetTileColumn + 1, targetTileRow, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                      applyAreaTileEffect(targetTileColumn - 1, targetTileRow - 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                      applyAreaTileEffect(targetTileColumn - 1, targetTileRow + 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                      applyAreaTileEffect(targetTileColumn + 1, targetTileRow - 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                      applyAreaTileEffect(targetTileColumn + 1, targetTileRow + 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                      if (1 < blastAreaRadius) {
                        applyAreaTileEffect(targetTileColumn, targetTileRow - 2, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn, targetTileRow + 2, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn - 2, targetTileRow, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn + 2, targetTileRow, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn - 2, targetTileRow - 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn - 2, targetTileRow + 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn + 2, targetTileRow - 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn + 2, targetTileRow + 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn - 1, targetTileRow - 2, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn - 1, targetTileRow + 2, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn + 1, targetTileRow - 2, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        applyAreaTileEffect(targetTileColumn + 1, targetTileRow + 2, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        if (2 < blastAreaRadius) {
                          applyAreaTileEffect(targetTileColumn - 2, targetTileRow - 2, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn - 2, targetTileRow + 2, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn + 2, targetTileRow - 2, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn + 2, targetTileRow + 2, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn - 3, targetTileRow - 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn - 3, targetTileRow, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn - 3, targetTileRow + 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn + 3, targetTileRow - 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn + 3, targetTileRow, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn + 3, targetTileRow + 1, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn - 1, targetTileRow - 3, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn, targetTileRow - 3, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn + 1, targetTileRow - 3, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn - 1, targetTileRow + 3, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn, targetTileRow + 3, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                          applyAreaTileEffect(targetTileColumn + 1, targetTileRow + 3, blastRoomLeftTileColumn, blastRoomRightTileColumn, blastRoomTopTileRow, roomBottomTileRow, impactEffect);
                        }
                      }
                    }
                    var blastCasterStats = character.stats,
                      blastSpiritCost = getSpellSpiritCost(blastCasterStats);
                    spendSpirit(blastCasterStats, blastSpiritCost);
                    enqueueCombatAction(game.combatQueue, blastSpellAction);
                  } else {
                    console.log("error: blast spell has no effect name!");
                  }
                }
              }
            } else if (10 === spellCategoryId || 17 === spellCategoryId) {
              if (character.spellToCast) {
                var summonCasterStats = character.stats,
                  summonLimit = summonCasterStats.maxSummonedMinions,
                  activeMinionCount = countSummonedMinions(character),
                  remainingSummonSlots = Math.max(0, summonLimit - activeMinionCount);
                if (!(1 > remainingSummonSlots)) {
                  var summonSlotIndex;
                  for (summonSlotIndex = 0; summonSlotIndex < remainingSummonSlots; summonSlotIndex++) {
                    var summoningCharacter = character,
                      summonSpellDefinition = summoningCharacter.spellToCast,
                      summonSpellAction = new CombatAction();
                    summonSpellAction.attacker = summoningCharacter;
                    (/** @type {TargetedCombatAction} */ (summonSpellAction)).setTargetCharacter(summoningCharacter);
                    summonSpellAction.noDamage = false;
                    summonSpellAction.remainingDamage = 0;
                    summonSpellAction.actionDefinition = summonSpellDefinition;
                    summonSpellAction.hasProjectilePhase = false;
                    var summonOriginPosition = summoningCharacter.position.levelPosition,
                      summonSpawnPosition = randomPointInRoom(summonOriginPosition, summoningCharacter.position.room),
                      id = summonSpellDefinition.projectileEffectName;
                    if (id) {
                      var summonProjectileVisual = new VisualEffect(id, summonOriginPosition, summonSpawnPosition, true, 1);
                      summonProjectileVisual.boundCharacter = summoningCharacter;
                      summonSpellAction.projectileEffect = summonProjectileVisual;
                    }
                    var summonImpactEffectName = summonSpellDefinition.impactEffectName;
                    if (summonImpactEffectName) {
                      var summonImpactVisual = new VisualEffect(summonImpactEffectName, summonOriginPosition, summonSpawnPosition, false, 1);
                      summonSpellAction.impactEffect = summonImpactVisual;
                      enqueueCombatAction(game.combatQueue, summonSpellAction);
                    } else {
                      console.log("error: summon spell has no effect name!");
                    }
                  }
                  spendSpirit(summonCasterStats, getSpellSpiritCost(summonCasterStats));
                }
              }
            } else if (11 === spellCategoryId) {
              if (character.spellToCast) {
                var raiseCasterStats = character.stats,
                  raiseSummonLimit = raiseCasterStats.maxSummonedMinions,
                  of = countSummonedMinions(character),
                  defeatedMonsters = game.monsters.defeatedMonsters,
                  raiseRemainingSlots = Math.max(0, raiseSummonLimit - of),
                  maxRaiseableCount = Math.min(raiseRemainingSlots, defeatedMonsters.length),
                  raisedCount = 0,
                  raiseRoom = character.position.room,
                  defeatedMonsterCandidate;
                if (!(0 >= maxRaiseableCount)) {
                  var defeatedMonsterIndex;
                  for (defeatedMonsterIndex = 0; defeatedMonsterIndex < defeatedMonsters.length && raisedCount < maxRaiseableCount; defeatedMonsterIndex++) {
                    if (defeatedMonsterCandidate = defeatedMonsters[defeatedMonsterIndex], defeatedMonsterCandidate.position.room === raiseRoom) {
                      var raisingCharacter = character,
                        raisedMonster = defeatedMonsterCandidate,
                        raiseSpellDefinition = raisingCharacter.spellToCast,
                        raiseSpellAction = new CombatAction();
                      raiseSpellAction.attacker = raisingCharacter;
                      (/** @type {TargetedCombatAction} */ (raiseSpellAction)).setTargetCharacter(raisedMonster);
                      raiseSpellAction.noDamage = false;
                      raiseSpellAction.remainingDamage = 0;
                      raiseSpellAction.actionDefinition = raiseSpellDefinition;
                      raiseSpellAction.hasProjectilePhase = true;
                      var raiseOriginPosition = raisingCharacter.position.levelPosition,
                        raiseTargetPosition = raisedMonster.position.levelPosition,
                        raiseProjectileEffectName = raiseSpellDefinition.projectileEffectName;
                      if (raiseProjectileEffectName) {
                        var raiseProjectileVisual = new VisualEffect(raiseProjectileEffectName, raiseOriginPosition, raiseTargetPosition, true, 1);
                        raiseProjectileVisual.boundCharacter = raisingCharacter;
                        raiseSpellAction.projectileEffect = raiseProjectileVisual;
                      }
                      var raiseImpactEffectName = raiseSpellDefinition.impactEffectName;
                      if (raiseImpactEffectName) {
                        var raiseImpactVisual = new VisualEffect(raiseImpactEffectName, raiseOriginPosition, raiseTargetPosition, false, 1);
                        raiseSpellAction.impactEffect = raiseImpactVisual;
                        enqueueCombatAction(game.combatQueue, raiseSpellAction);
                      } else {
                        console.log("error: summon spell has no effect name!");
                      }
                      raisedCount++;
                    }
                  }
                  spendSpirit(raiseCasterStats, getSpellSpiritCost(raiseCasterStats));
                }
              }
            } else if (9 === spellCategoryId) {
              var selfSummonSpellDefinition = character.spellToCast;
              if (selfSummonSpellDefinition) {
                var selfSummonSpellAction = new CombatAction();
                selfSummonSpellAction.attacker = character;
                (/** @type {TargetedCombatAction} */ (selfSummonSpellAction)).setTargetCharacter(character);
                selfSummonSpellAction.noDamage = false;
                selfSummonSpellAction.remainingDamage = 0;
                selfSummonSpellAction.actionDefinition = selfSummonSpellDefinition;
                selfSummonSpellAction.hasProjectilePhase = false;
                var selfSummonOriginPosition = character.position.levelPosition,
                  selfSummonSpawnPosition = randomPointInRoom(selfSummonOriginPosition, character.position.room),
                  selfSummonProjectileEffectName = selfSummonSpellDefinition.projectileEffectName;
                if (selfSummonProjectileEffectName) {
                  var selfSummonProjectileVisual = new VisualEffect(selfSummonProjectileEffectName, selfSummonOriginPosition, selfSummonSpawnPosition, true, 1);
                  selfSummonProjectileVisual.boundCharacter = character;
                  selfSummonSpellAction.projectileEffect = selfSummonProjectileVisual;
                }
                var selfSummonImpactEffectName = selfSummonSpellDefinition.impactEffectName;
                if (selfSummonImpactEffectName) {
                  var selfSummonImpactVisual = new VisualEffect(selfSummonImpactEffectName, selfSummonOriginPosition, selfSummonSpawnPosition, false, 1);
                  selfSummonSpellAction.impactEffect = selfSummonImpactVisual;
                  var selfSummonCasterStats = character.stats,
                    selfSummonSpiritCost = getSpellSpiritCost(selfSummonCasterStats);
                  spendSpirit(selfSummonCasterStats, selfSummonSpiritCost);
                  enqueueCombatAction(game.combatQueue, selfSummonSpellAction);
                } else {
                  console.log("error: summon spell has no effect name!");
                }
              }
            } else if (12 === spellCategoryId) {
              var swiftStrikeAction = createSpellAction(character);
              if (swiftStrikeAction) {
                swiftStrikeAction.returns = true;
                swiftStrikeAction.chainCount = character.stats.swiftStrikeTargetBonus + 1;
                var swiftStrikeCasterPosition = character.position.levelPosition;
                if (swiftStrikeCasterPosition) {
                  if (!swiftStrikeAction.returnOriginPosition) {
                    swiftStrikeAction.returnOriginPosition = new Vector2();
                  }
                  assignVector(swiftStrikeAction.returnOriginPosition, swiftStrikeCasterPosition);
                } else {
                  swiftStrikeAction.returnOriginPosition = null;
                }
                var swiftStrikeDamage = calculateSpellDamage(character, swiftStrikeAction.targetCharacter);
                swiftStrikeAction.remainingDamage = swiftStrikeDamage;
                swiftStrikeAction.noDamage = 0 === swiftStrikeDamage;
                var swiftStrikeProjectileVisual = swiftStrikeAction.projectileEffect;
                if (swiftStrikeProjectileVisual) {
                  swiftStrikeProjectileVisual.isReturning = true;
                }
              }
            } else if (13 === spellCategoryId) {
              var ricochetAction = createSpellAction(character);
              if (ricochetAction) {
                var ricochetCount = character.stats.ricochetCountBonus + 1;
                if (0 < ricochetCount) {
                  ricochetAction.chains = true;
                  ricochetAction.chainCount = ricochetCount;
                }
              }
            } else {
              createSpellAction(character);
            }
          } else {
            a: {
              var statusSpellDefinition = character.spellToCast;
              if (statusSpellDefinition) {
                var statusSpellTarget = character.combatTarget;
                if (!statusSpellTarget || statusSpellTarget.isDead) {
                  if (statusSpellTarget = selectScrollTarget(character), !statusSpellTarget) {
                    break a;
                  }
                }
                var allowedStatusTargetCount,
                  statusSpellEffectTypeId = statusSpellDefinition.statusEffectTypeId;
                if (1 === statusSpellEffectTypeId || 0 === statusSpellEffectTypeId) {
                  allowedStatusTargetCount = character.stats.controlTargetBonus + 1;
                } else if (4 === statusSpellEffectTypeId) {
                  allowedStatusTargetCount = character.stats.transformTargetBonus + 1;
                } else {
                  console.log("wrong effect type: " + statusSpellEffectTypeId);
                  break a;
                }
                var selectedStatusTargets;
                var primaryStatusTarget = statusSpellTarget,
                  requestedStatusTargetCount = allowedStatusTargetCount,
                  statusTargetCandidates;
                var statusSpellRange = RANGED_ATTACK_RANGE,
                  opponentList = getOpponents(character);
                if (0 === opponentList.length) {
                  statusTargetCandidates = null;
                } else {
                  var primaryTargetRoom = primaryStatusTarget.position.room;
                  if (primaryTargetRoom) {
                    var opponentIndex,
                      opponentCandidate,
                      primaryTargetPosition = primaryStatusTarget.position.levelPosition,
                      opponentCandidateDistance,
                      collectedStatusCandidates = [];
                    for (opponentIndex = 0; opponentIndex < opponentList.length && (opponentCandidate = opponentList[opponentIndex], opponentCandidate.isDead || opponentCandidate.position.room !== primaryTargetRoom || hasStatusEffect(opponentCandidate.effects, statusSpellEffectTypeId) || (opponentCandidate === primaryStatusTarget ? collectedStatusCandidates.push(opponentCandidate) : (opponentCandidateDistance = primaryTargetPosition.distanceTo(opponentCandidate.position.levelPosition), opponentCandidateDistance <= statusSpellRange && collectedStatusCandidates.push(opponentCandidate)), !(1E3 <= collectedStatusCandidates.length))); opponentIndex++) {}
                    statusTargetCandidates = collectedStatusCandidates;
                  } else {
                    statusTargetCandidates = null;
                  }
                }
                if (statusTargetCandidates) {
                  if (statusTargetCandidates.length < requestedStatusTargetCount) {
                    selectedStatusTargets = statusTargetCandidates;
                  } else {
                    var randomlyChosenStatusTargets = [],
                      pendingStatusCandidate,
                      duplicatePickAttempts = 0;
                    for (randomlyChosenStatusTargets.push(primaryStatusTarget); randomlyChosenStatusTargets.length < requestedStatusTargetCount && 10 > duplicatePickAttempts;) {
                      pendingStatusCandidate = statusTargetCandidates[randomInt(randomlyChosenStatusTargets.length)];
                      if (0 > randomlyChosenStatusTargets.indexOf(pendingStatusCandidate)) {
                        randomlyChosenStatusTargets.push(pendingStatusCandidate);
                      } else {
                        duplicatePickAttempts++;
                      }
                    }
                    if (randomlyChosenStatusTargets.length < requestedStatusTargetCount) {
                      var fillCandidateIndex;
                      for (fillCandidateIndex = 0; fillCandidateIndex < statusTargetCandidates.length && !(pendingStatusCandidate = statusTargetCandidates[fillCandidateIndex], 0 > randomlyChosenStatusTargets.indexOf(pendingStatusCandidate) && (randomlyChosenStatusTargets.push(pendingStatusCandidate), randomlyChosenStatusTargets.length >= requestedStatusTargetCount)); fillCandidateIndex++) {}
                    }
                    selectedStatusTargets = randomlyChosenStatusTargets;
                  }
                } else {
                  selectedStatusTargets = null;
                }
                if (selectedStatusTargets && 0 !== selectedStatusTargets.length) {
                  var statusTargetIndex,
                    statusTarget,
                    spellAction,
                    statusTargetPosition,
                    statusProjectileVisual,
                    statusProjectileEffectName = statusSpellDefinition.projectileEffectName,
                    statusImpactEffectName = statusSpellDefinition.impactEffectName,
                    statusCasterPosition = character.position.levelPosition;
                  for (statusTargetIndex = 0; statusTargetIndex < selectedStatusTargets.length; statusTargetIndex++) {
                    if (statusTarget = selectedStatusTargets[statusTargetIndex], 4 !== statusTarget.characterType || 1 !== statusSpellEffectTypeId && 0 !== statusSpellEffectTypeId) {
                      spellAction = new CombatAction();
                      spellAction.attacker = character;
                      (/** @type {TargetedCombatAction} */ (spellAction)).setTargetCharacter(statusTarget);
                      spellAction.actionDefinition = statusSpellDefinition;
                      spellAction.hasProjectilePhase = true;
                      statusTargetPosition = statusTarget.position.levelPosition;
                      if (statusProjectileEffectName) {
                        statusProjectileVisual = new VisualEffect(statusProjectileEffectName, statusCasterPosition, statusTargetPosition, true, 1);
                        statusProjectileVisual.boundCharacter = character;
                        spellAction.projectileEffect = statusProjectileVisual;
                      }
                      if (statusImpactEffectName) {
                        var statusImpactVisual = new VisualEffect(statusImpactEffectName, statusCasterPosition, statusTargetPosition, false, 1);
                        spellAction.impactEffect = statusImpactVisual;
                      }
                      enqueueCombatAction(game.combatQueue, spellAction);
                    } else {
                      showFloatingText(game.floatingText, statusTarget, "免疫!", "white");
                    }
                  }
                  var statusCasterStats = character.stats,
                    statusSpiritCost = getSpellSpiritCost(statusCasterStats);
                  spendSpirit(statusCasterStats, statusSpiritCost);
                }
              }
            }
          }
          if (isAdventurerOrMinion(character)) {
            game.state.statisticsRecorder.recordSpellCast();
          }
        }
      } else if (5 === character.actionType) {
        if (character.targetGoldDrop && !character.targetGoldDrop.collected) {
          var collectedGoldAmount = character.targetGoldDrop.goldAmount,
            floatingTextLayer = game.floatingText;
          if (0 < collectedGoldAmount) {
            showFloatingText(floatingTextLayer, character, collectedGoldAmount + "黄金", "yellow");
          }
          addGold(character.targetGoldDrop.goldAmount);
          game.state.statisticsRecorder.recordGoldFromMonsters(character.targetGoldDrop.goldAmount);
          character.targetGoldDrop.setCollected(true);
          removeGoldDrop(character.targetGoldDrop);
          character.targetGoldDrop = null;
          awardAdventurePoints(9);
        }
      } else if (7 === character.actionType) {
        if (character.targetScrollDrop && !character.targetScrollDrop.collected) {
          showFloatingText(game.floatingText, character, "卷轴!", "white");
          addScrollCharge(character.targetScrollDrop.getScroll());
          character.targetScrollDrop.setCollected(true);
          removeScrollDrop(character.targetScrollDrop);
          character.targetScrollDrop = null;
          awardAdventurePoints(10);
        }
      } else if (8 === character.actionType) {
        if (character.targetPotionDrop && !character.targetPotionDrop.collected) {
          showFloatingText(game.floatingText, character, "药剂!", "white");
          character.targetPotionDrop.setCollected(true);
          removePotionDrop(character.targetPotionDrop, game.potionDrops);
          addPotion(character.targetPotionDrop.potion, game.potions);
          character.targetScrollDrop = null;
          awardAdventurePoints(11);
        }
      } else if (6 === character.actionType) {
        if (character.targetItemDrop && !character.targetItemDrop.collected) {
          character.targetItemDrop.setCollected(true);
          removeItemDrop(character.targetItemDrop, game.itemDrops);
          var droppedItem = character.targetItemDrop.getItem(),
            droppedItemRarity = droppedItem.getRarity();
          addInventoryItem(droppedItem.inventory.inventory, droppedItem, game.inventories);
          game.state.statisticsRecorder.recordItemFound(droppedItem);
          awardAdventurePoints(12);
          if (0 != droppedItemRarity) {
            switch (droppedItemRarity) {
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
          character.targetItemDrop = null;
        }
      } else if (12 === character.actionType) {
        if (character.targetTreasureChest && !character.targetTreasureChest.opened) {
          var targetChest = character.targetTreasureChest,
            chestLootIndex,
            chestRoom = targetChest.room,
            chestSpawnMinX = roomLeftPixels(chestRoom) + TILE_SIZE,
            chestSpawnMaxX = roomRightPixels(chestRoom) - TILE_SIZE,
            chestSpawnMinY = roomTopPixels(chestRoom) + TILE_SIZE,
            chestSpawnMaxY = roomBottomPixels(chestRoom) - TILE_SIZE,
            chestSpawnX = targetChest.levelX,
            chestSpawnY = targetChest.levelY,
            chestKind = targetChest.kind;
          if (chestSpawnX < chestSpawnMinX) {
            chestSpawnX = chestSpawnMinX;
          } else {
            if (chestSpawnX > chestSpawnMaxX) {
              chestSpawnX = chestSpawnMaxX;
            }
          }
          if (chestSpawnY < chestSpawnMinY) {
            chestSpawnY = chestSpawnMinY;
          } else {
            if (chestSpawnY > chestSpawnMaxY) {
              chestSpawnY = chestSpawnMaxY;
            }
          }
          setChestOpened(targetChest, true);
          if (1 === chestKind) {
            var goldDropCount = 10 + randomInt(10),
              rolledGoldAmount;
            for (chestLootIndex = 0; chestLootIndex < goldDropCount; chestLootIndex++) {
              rolledGoldAmount = 1 + rollGoldDrop();
              var spawnedGoldDrop = new GoldDrop(rolledGoldAmount, tickCharacterTurn(chestSpawnX, chestSpawnMinX, chestSpawnMaxX), tickCharacterTurn(chestSpawnY, chestSpawnMinY, chestSpawnMaxY), chestRoom);
              game.goldDrops.drops.push(spawnedGoldDrop);
            }
          }
          if (1 === chestKind || 2 === chestKind) {
            var itemDropCount = 7 + randomInt(8);
            for (chestLootIndex = 0; chestLootIndex < itemDropCount; chestLootIndex++) {
              var itemDropRegistry = game.itemDrops,
                itemDropX = tickCharacterTurn(chestSpawnX, chestSpawnMinX, chestSpawnMaxX),
                itemDropY = tickCharacterTurn(chestSpawnY, chestSpawnMinY, chestSpawnMaxY),
                itemDropRoom = chestRoom,
                generatedItem,
                itemGenerator = game.itemGenerator,
                randomAdventurer = game.state.adventurers[randomInt(game.state.adventurers.length)],
                randomAdventurerSlotList = randomAdventurer.slotList,
                randomItemSlot = randomAdventurerSlotList[randomInt(randomAdventurerSlotList.length)],
                chestRarityChanceScale = (100 - Math.min(90, globalUpgradeDefinitions.itemQualityChance.currentValue + CHEST_ITEM_QUALITY_BONUS)) / 100,
                chestRolledRarity = itemGenerator.rollRarity(chestRarityChanceScale),
                chestItemLevelChanceScale = (100 - Math.min(90, globalUpgradeDefinitions.higherLevelItemChance.currentValue + CHEST_ITEM_LEVEL_BONUS)) / 100,
                chestRolledItemLevel = randomizeItemLevel(randomAdventurer.stats.characterLevel, chestItemLevelChanceScale, game.itemGenerator.rules);
              if (generatedItem = generateItem(itemGenerator, randomItemSlot, randomAdventurer, chestRolledItemLevel, chestRolledRarity)) {
                itemDropRegistry.drops.push(new ItemDrop(generatedItem, itemDropX, itemDropY, itemDropRoom));
              }
            }
          }
          if (1 === chestKind || 3 === chestKind) {
            var scrollDropCount = 2 + randomInt(5);
            for (chestLootIndex = 0; chestLootIndex < scrollDropCount; chestLootIndex++) {
              var unlockedScrolls = game.scrolls.unlockedScrolls,
                randomScroll = unlockedScrolls[randomInt(unlockedScrolls.length)],
                spawnedScrollDrop = new ScrollDrop(randomScroll, tickCharacterTurn(chestSpawnX, chestSpawnMinX, chestSpawnMaxX), tickCharacterTurn(chestSpawnY, chestSpawnMinY, chestSpawnMaxY), chestRoom);
              game.scrollDrops.drops.push(spawnedScrollDrop);
            }
          }
          if (1 === chestKind) {
            var potionDropCount = 0 + randomInt(2);
            for (chestLootIndex = 0; chestLootIndex < potionDropCount && game.potions.potionList.length < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue; chestLootIndex++) {
              var spawnedPotion = new Potion(potionDefinitions[randomInt(potionDefinitions.length)], game.itemSprites),
                spawnedPotionDrop = new PotionDrop(spawnedPotion, tickCharacterTurn(chestSpawnX, chestSpawnMinX, chestSpawnMaxX), tickCharacterTurn(chestSpawnY, chestSpawnMinY, chestSpawnMaxY), chestRoom);
              game.potionDrops.drops.push(spawnedPotionDrop);
            }
          }
          showFloatingText(game.floatingText, character, "搜索!!!", "#FFF");
          switch (chestKind) {
            case 1:
              game.state.statisticsRecorder.recordTreasureChestLooted();
              awardAdventurePoints(6);
              break;
            case 2:
              game.state.statisticsRecorder.recordWeaponRackLooted();
              awardAdventurePoints(7);
              break;
            case 3:
              game.state.statisticsRecorder.recordBookcaseLooted();
              awardAdventurePoints(8);
          }
          recordGameEvent("Treasure Chest", "Looted");
          character.targetTreasureChest = null;
        }
      } else if (9 === character.actionType) {
        if (game.state.party.targetDungeon) {
          var partyEnteringDungeon = game.state.party;
          if (partyEnteringDungeon.targetDungeon && !partyEnteringDungeon.targetDungeon.isFarm) {
            partyEnteringDungeon.destinationRoom = null;
            partyEnteringDungeon.targetDoor = null;
            partyEnteringDungeon.targetRoom = null;
            partyEnteringDungeon.targetTreasureChest = null;
            var targetDungeon = partyEnteringDungeon.targetDungeon;
            game.currentDungeon = targetDungeon;
            targetDungeon.currentLevelIndex = 0;
            generateDungeonLevel(targetDungeon.levelSeed(), targetDungeon.dungeonType, targetDungeon.hasSecondEntrance, true);
            game.worldActive = false;
            if (targetDungeon.discovered) {
              recordGameEvent("Dungeon", "Entering Dungeon Again");
            } else {
              targetDungeon.discovered = true;
              targetDungeon.farmCost = scaleByLevel(game.dungeons.discoveredDungeonCount + 1, dungeonPriceCurve, 1);
              discoverDungeon(targetDungeon);
              recordGameEvent("Dungeon", "Discovered Dungeon");
            }
          }
        }
      } else if (11 === character.actionType) {
        if (game.state.party.activeCastle) {
          var partyEnteringCastle = game.state.party;
          if (partyEnteringCastle.activeCastle) {
            if (partyEnteringCastle.activeCastle.conquered) {
              partyEnteringCastle.activeCastle = null;
            } else {
              partyEnteringCastle.destinationRoom = null;
              partyEnteringCastle.targetDoor = null;
              partyEnteringCastle.targetRoom = null;
              partyEnteringCastle.targetTreasureChest = null;
              var targetCastle = partyEnteringCastle.activeCastle;
              game.currentCastle = targetCastle;
              generateDungeonLevel(targetCastle.levelSeed(), 11, false, true);
              game.worldActive = false;
              recordGameEvent("Castle", "正在进入城堡:" + targetCastle.castleName);
            }
          }
        }
      } else if (10 === character.actionType && game.state.party.targetShop) {
        var partyAtShop = game.state.party;
        if (partyAtShop.targetShop) {
          var shopAdventurerIndex;
          for (shopAdventurerIndex = 0; shopAdventurerIndex < game.state.adventurers.length; shopAdventurerIndex++) {
            var shopAdventurer = game.state.adventurers[shopAdventurerIndex],
              shopAdventurerInventory = shopAdventurer.inventory,
              shopInventoryItems = shopAdventurerInventory.items;
            if (0 !== shopInventoryItems.length) {
              for (var inventoryItemToSell = undefined, soldItemCount = 0, equippedItemForSlot = undefined, soldItemGoldTotal = 0, goldRecoveryRate = 0.1 + equipmentQualityBonus.currentValue, inventorySellIndex = shopInventoryItems.length - 1; 0 <= inventorySellIndex; inventorySellIndex--) {
                inventoryItemToSell = shopInventoryItems[inventorySellIndex];
                if ((equippedItemForSlot = shopAdventurer.getSlotItem(inventoryItemToSell.slot)) && !isBetterItem(inventoryItemToSell, equippedItemForSlot)) {
                  soldItemGoldTotal += inventoryItemToSell.itemGold * goldRecoveryRate;
                  soldItemCount++;
                  awardAdventurePoints(17);
                  removeInventoryItemAt(shopAdventurerInventory, inventorySellIndex);
                }
              }
              game.state.statisticsRecorder.recordItemsSold(soldItemCount);
              showFloatingText(game.floatingText, shopAdventurer, "黄金!", "yellow");
              var shopRegistry = game.shops;
              shopRegistry.collectedGold += floorNumber(soldItemGoldTotal);
            }
          }
          recordGameEvent("Shop", "卖出所有道具");
          partyAtShop.targetShop = null;
        }
      }
      character.actionType = IDLE_ACTION;
    }
  }
}
export function initializeCharactersCharacter() {
  Character.prototype.getSlotItem = function (slot) {
    return this.equipment ? (/** @type {SlotEquipment} */ (this.equipment)).getSlotItem(slot) : null;
  };
  Character.prototype.getEffectItem = function () {
    return this.equipment ? (/** @type {SlotEquipment} */ (this.equipment)).getEffectItem() : null;
  };
  Character.prototype.equipItem = function (item) {
    equipItem(this, item);
    if (this.characterType === ADVENTURER_TYPE) {
      awardAdventurePoints(21);
    }
  };
  Character.prototype.setMonsterType = function (monsterType) {
    this.monsterType = monsterType;
  };
  Character.prototype.getSprite = function () {
    return this.sprite;
  };
  Character.prototype.setCombatTarget = function (targetCharacter) {
    this.combatTarget = targetCharacter;
  };
  Character.prototype.setTargetTreasureChest = function (treasureChest) {
    this.targetTreasureChest = treasureChest;
  };
  Character.prototype.updateBehaviors = function () {
    if (this.behaviors && !this.isDead) {
      this.behaviors.updateBehaviors(this);
    }
  };
}
let sharedStatRules;
function getCharacterStatRules() {
  if (!sharedStatRules) {
    sharedStatRules = {
      defaultChainChance: DEFAULT_CHAIN_CHANCE,
      defaultMinionLimit: DEFAULT_MINION_LIMIT,
      defaultMultiAttackChance: DEFAULT_MULTI_ATTACK_CHANCE,
      attackCooldownBonus,
      freeSpellsModifier
    };
  }
  return sharedStatRules;
}
