/** 原版存档格式、全状态恢复与保存。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { floorNumber, nowMilliseconds, recordGameEvent, scaleByLevel, setVector } from "../core/math.js";
import { createWorldBlocks, refreshWorldBlocks } from "../world/terrain.js";
import { canAttackCastle, getDungeonMapSprite, invalidateCastleRevision, refreshCastleConquest, sortCastles } from "../world/regions.js";
import { Farm, discoverDungeon, refreshFarmableDungeons, registerDungeonFarm, registerFarm, sortDungeons } from "../world/dungeons.js";
import { findRoom, generateDungeonLevel } from "../world/generation.js";
import { revealHallway, revealRoom } from "../world/rooms.js";
import { TreasureChest, setChestOpened } from "../loot/treasure.js";
import { restoreItem, restoreStatComponent, restoreStatistics, restoreUpgradeFlags, serializeCharacter, serializeMonsterLevel, serializeStatistics } from "./entities.js";
import { adventurerClasses, classesById } from "../content/classes.js";
import { Character, equipItem, hasUnspentSkills, learnSpell } from "../characters/character.js";
import { Inventory, addInventoryItem } from "../loot/inventory.js";
import { chooseScrollCaster, createBehaviorQueue, refreshUnspentSkillFlags } from "../simulation/characters.js";
import { Spell } from "../combat/scrolls.js";
import { damageCurve, experienceCurve, globalUpgradeDefinitions, globalUpgradesById } from "../content/balance.js";
import { increasePointEventReward, pointEventDefinitions, recalculateAdventurePoints } from "../progression/points.js";
import { Potion, addPotion, potionDefinitions, setPotionActive } from "../combat/potions.js";
import { refreshPartyLevels } from "../characters/party.js";
import { getClassVictories, getSoloClassVictories } from "../progression/statistics.js";
import { getMonsterTypesForLevel } from "../combat/encounters.js";
import saveCodec from "../../save-codec.js";
import { persistence } from "../runtime/storage-port.js";
export function deleteStoredSave() {
  var saveManager = game.saves;
  persistence.remove();
  saveManager.lastSavedAt = nowMilliseconds();
  recordGameEvent("SaveManager", "Delete");
}
export function saveProgress(saveManager) {
  var compressedSave = serializeGame(saveManager);
  if (compressedSave) {
    persistence.write(compressedSave);
    saveManager.lastSavedAt = nowMilliseconds();
  }
}
export function restoreGameState(saveManager, compressedSave) {
  if (compressedSave) {
    var saveJsonText = saveCodec.decompress(compressedSave);
    if (saveJsonText) {
      /** 存档 DTO 的**恢复侧**类型接入：saveData 上每个被读的键都必须存在于 SaveData，
       *  读错键（改名时漏改映射行）会由 `npm run typecheck` 直接报出来。
       *  注意：这里只标已初始化形态——空白档只有 4 个键，而 `if (game.initialized)`
       *  分支保证了其余键只在已开局时才被读；**空白档形态本身由
       *  scripts/audit-save-schema.mjs 机械比对**（四种形态的键集逐一核对），
       *  不靠这条注解假装覆盖。
       *  @type {SaveData} */
      var saveData = JSON.parse(saveJsonText);
      if (saveData) {
        game.resetRun(true);
        game.initialized = saveData.gameInitialized;
        if (game.initialized) {
          game.worldActive = saveData.worldActive;
          game.partyCreated = saveData.partyCreated;
          game.gameWon = saveData.gameWon;
          var savedGameTimestamp = saveData.gameTimestamp;
          game.lastActiveAt = savedGameTimestamp ? savedGameTimestamp : Date.now();
          var savedTurnNumber = saveData.turnNumber,
            savedFrameNumber = saveData.frameNumber,
            savedVictoryCount = saveData.victoryCount;
          game.state.turnNumber = savedTurnNumber ? savedTurnNumber : 0;
          game.state.frameNumber = savedFrameNumber ? savedFrameNumber : 0;
          game.state.victoryCount = savedVictoryCount ? savedVictoryCount : 0;
          var savedStatistics = saveData.statistics,
            savedTotalStatistics = saveData.totalStatistics,
            worldDto = saveData.world,
            worldCenterX = worldDto.worldCenterX,
            worldCenterY = worldDto.worldCenterY,
            blockShiftRow = worldDto.blockShiftRow,
            worldMap = game.world;
          worldMap.blockOriginColumn = worldDto.blockShiftCol;
          worldMap.blockOriginRow = blockShiftRow;
          worldMap.worldBlocks = createWorldBlocks(worldMap);
          refreshWorldBlocks(worldMap);
          worldMap.worldCenterX = worldCenterX;
          worldMap.worldCenterY = worldCenterY;
          worldMap.hasPartyPlaced = true;
          var dungeonManagerDto = saveData.dungeonManagerState,
            savedFarmedKills = dungeonManagerDto.farmedKills,
            savedDungeonCostLevel = dungeonManagerDto.dungeonCostLevel,
            dungeonStates = dungeonManagerDto.dungeonStates;
          if (dungeonStates) {
            game.dungeons.sortingEnabled = false;
            var dungeonStateIndex;
            for (dungeonStateIndex = 0; dungeonStateIndex < dungeonStates.length; dungeonStateIndex++) {
              var dungeonStateDto = dungeonStates[dungeonStateIndex];
              if (dungeonStateDto) {
                var dungeonId = dungeonStateDto.dungeonId,
                  discovered = dungeonStateDto.discovered,
                  cleared = dungeonStateDto.cleared,
                  conquered = dungeonStateDto.conquered,
                  clearedTurn = dungeonStateDto.clearedTurn,
                  dungeonFarm = dungeonStateDto.dungeonFarm,
                  farmStartTurn = dungeonStateDto.farmStartTurn,
                  dungeonFarmCost = dungeonStateDto.dungeonFarmCost,
                  dungeonType = dungeonStateDto.dungeonType,
                  levelCount = dungeonStateDto.levelCount;
                if (dungeonId) {
                  var dungeon = game.dungeons.dungeonRegistry[dungeonId];
                  if (dungeon) {
                    dungeon.cleared = cleared ? true : false;
                    dungeon.clearedTurn = clearedTurn ? clearedTurn : 0;
                    dungeon.discovered = discovered ? true : false;
                    dungeon.isFarm = dungeonFarm ? true : false;
                    dungeon.setConquered(conquered ? true : false);
                    dungeon.farmStartTurn = farmStartTurn ? farmStartTurn : 0;
                    dungeon.farmCost = dungeonFarmCost;
                    var normalizedDungeonType = dungeonType ? dungeonType : 0;
                    dungeon.dungeonType = normalizedDungeonType;
                    dungeon.hasSecondEntrance = !(4 === normalizedDungeonType || 5 === normalizedDungeonType || 7 === normalizedDungeonType || 8 === normalizedDungeonType);
                    dungeon.mapSprite = getDungeonMapSprite(normalizedDungeonType);
                    dungeon.levelCount = levelCount;
                    if (discovered) {
                      discoverDungeon(dungeon);
                      if (dungeonFarm) {
                        registerDungeonFarm(dungeon);
                      } else {
                        if (cleared) {
                          game.dungeons.registerClearedDungeon(dungeon);
                        }
                      }
                    }
                  } else {
                    console.log("Failed to load dungeon state for: " + dungeonId);
                  }
                }
              }
            }
            game.dungeons.sortingEnabled = true;
            var dungeons = game.dungeons;
            if (dungeons.sortingEnabled) {
              sortDungeons(dungeons, dungeons.discovered);
              sortDungeons(dungeons, dungeons.attackable);
              sortDungeons(dungeons, dungeons.cleared);
              sortDungeons(dungeons, dungeons.farms);
              sortDungeons(dungeons, dungeons.farmable);
            }
          }
          game.dungeons.setFarmedKills(savedFarmedKills ? savedFarmedKills : 0);
          game.dungeons.discoveredDungeonCount = savedDungeonCostLevel ? savedDungeonCostLevel : 0;
          var currentDungeonDto = saveData.currentDungeon;
          if (currentDungeonDto) {
            var currentDungeonId = currentDungeonDto.dungeonId,
              savedCurrentLevelIndex = currentDungeonDto.currentLevelIndex,
              currentDungeon = game.dungeons.dungeonRegistry[currentDungeonId];
            if (currentDungeon) {
              currentDungeon.currentLevelIndex = savedCurrentLevelIndex;
              game.currentDungeon = currentDungeon;
            } else {
              console.log("Failed to lookup dungeon by id: " + currentDungeonId);
              game.currentDungeon = null;
            }
          } else {
            game.currentDungeon = null;
          }
          var castleManagerDto = saveData.castleManager;
          if (castleManagerDto) {
            var castleStates = castleManagerDto.castleStates;
            game.castles.nextRequiredMonsterLevel = castleManagerDto.nextRequiredMonsterLevel;
            var castleStateIndex;
            for (castleStateIndex = 0; castleStateIndex < castleStates.length; castleStateIndex++) {
              var castleStateDto = castleStates[castleStateIndex];
              if (castleStateDto) {
                var castleId = castleStateDto.castleId,
                  castleConquered = castleStateDto.conquered,
                  castleDungeonsConquered = castleStateDto.dungeonsConquered,
                  castleRegionLocked = castleStateDto.castleRegionLocked,
                  castleAttackScheduled = castleStateDto.attackScheduled,
                  castleRequiredMonsterLevel = castleStateDto.requiredMonsterLevel;
                if (castleId) {
                  var castle = game.castles.castleRegistry[castleId];
                  if (castle) {
                    castle.setConquered(castleConquered ? true : false);
                    castle.dungeonsConquered = castleDungeonsConquered ? true : false;
                    castle.regionLocked = castleRegionLocked ? true : false;
                    castle.attackScheduled = castleAttackScheduled ? true : false;
                    invalidateCastleRevision();
                    castle.requiredMonsterLevel = castleRequiredMonsterLevel ? castleRequiredMonsterLevel : 0;
                  } else {
                    console.log("Failed to load castle state for: " + castleId);
                  }
                }
              }
            }
            var castles = game.castles,
              castleIndex,
              castleFromList;
            for (castleIndex = 0; castleIndex < castles.castleList.length; castleIndex++) {
              castleFromList = castles.castleList[castleIndex];
              if (canAttackCastle(castleFromList)) {
                castles.attackableCastles.push(castleFromList);
              }
              if (castleFromList.attackScheduled && !castleFromList.conquered) {
                castles.scheduledCastles.push(castleFromList);
              }
              refreshCastleConquest(castleFromList);
            }
            sortCastles(castles, castles.scheduledCastles);
            sortCastles(castles, castles.attackableCastles);
            var dungeonRegistry = game.dungeons,
              dungeonListIndex;
            for (dungeonListIndex = 0; dungeonListIndex < dungeonRegistry.dungeonList.length; dungeonListIndex++) {
              refreshFarmableDungeons(dungeonRegistry, dungeonRegistry.dungeonList[dungeonListIndex]);
            }
          }
          var currentCastleDto = saveData.currentCastle;
          if (currentCastleDto) {
            var currentCastleId = currentCastleDto.castleId,
              currentCastle = game.castles.castleRegistry[currentCastleId];
            if (currentCastle) {
              game.currentCastle = currentCastle;
            } else {
              console.log("Failed to lookup castle by id: " + currentCastleId);
              game.currentCastle = null;
            }
          } else {
            game.currentCastle = null;
          }
          var shopManagerDto = saveData.shopManager,
            collectedGold = 0;
          if (shopManagerDto) {
            collectedGold = shopManagerDto.collectedGold;
          }
          game.shops.collectedGold = collectedGold ? collectedGold : 0;
          var farmEntries = saveData.farms;
          if (farmEntries) {
            var farmIndex;
            for (farmIndex = 0; farmIndex < farmEntries.length; farmIndex++) {
              var farmEntry = farmEntries[farmIndex];
              if (farmEntry) {
                var farmDungeonId = farmEntry.dungeonId,
                  farmCol = farmEntry.farmCol,
                  farmRow = farmEntry.farmRow;
                if (farmDungeonId) {
                  registerFarm(game.farms, new Farm(farmDungeonId, farmCol, farmRow));
                }
              }
            }
          }
          var levelDto = saveData.level;
          if (levelDto && !game.worldActive) {
            var levelDungeonType, levelHasSecondEntrance;
            if (game.currentDungeon) {
              levelDungeonType = game.currentDungeon.dungeonType;
              levelHasSecondEntrance = game.currentDungeon.hasSecondEntrance;
            } else {
              levelDungeonType = 11;
              levelHasSecondEntrance = false;
            }
            var levelCenterX = levelDto.levelCenterX,
              levelCenterY = levelDto.levelCenterY,
              roomVisibility = levelDto.roomVisibility,
              hallwayStates = levelDto.hallways;
            generateDungeonLevel(levelDto.levelSeed, levelDungeonType, levelHasSecondEntrance, false);
            var level = game.level;
            level.centerX = levelCenterX;
            level.centerY = levelCenterY;
            var hallwayIndex,
              hallwayList = game.level.hallwayList;
            if (hallwayList.length !== hallwayStates.length) {
              console.log("hallway array length mismatch. state=" + hallwayStates.length + " hallways=" + hallwayList.length);
            } else {
              for (hallwayIndex = 0; hallwayIndex < hallwayStates.length; hallwayIndex++) {
                var hallway = hallwayList[hallwayIndex],
                  hallwayState = hallwayStates[hallwayIndex],
                  doorAOpen = hallwayState.doorAOpen,
                  doorBOpen = hallwayState.doorBOpen;
                revealHallway(hallway, hallwayState.visible);
                hallway.doorA.isOpen = doorAOpen;
                hallway.doorB.isOpen = doorBOpen;
              }
            }
            var roomIndex,
              roomList = game.level.roomList;
            if (roomList.length !== roomVisibility.length) {
              console.log("room array length mismatch");
            } else {
              for (roomIndex = 0; roomIndex < roomVisibility.length; roomIndex++) {
                if (roomVisibility[roomIndex]) {
                  revealRoom(roomList[roomIndex]);
                }
              }
            }
          }
          var treasureChestStates = saveData.treasureChestManager;
          if (treasureChestStates) {
            var chestIndex, chestInstance;
            for (chestIndex = 0; chestIndex < treasureChestStates.length; chestIndex++) {
              var chestStateDto = treasureChestStates[chestIndex],
                chestLevelX = chestStateDto.levelX,
                chestLevelY = chestStateDto.levelY,
                chestOpened = chestStateDto.opened,
                chestWestWall = chestStateDto.westWall,
                chestRoomId = chestStateDto.roomId,
                chestDefinition;
              b: {
                for (var chestSettingsId = chestStateDto.settingsId, treasureRegistry = game.treasure, chestDefinitionIndex = 0; chestDefinitionIndex < treasureRegistry.targetDefinitions.length; chestDefinitionIndex++) {
                  if (treasureRegistry.targetDefinitions[chestDefinitionIndex].settingsId === chestSettingsId) {
                    chestDefinition = treasureRegistry.targetDefinitions[chestDefinitionIndex];
                    break b;
                  }
                }
                console.log("failed to find treasure chest settings: " + chestSettingsId);
                chestDefinition = treasureRegistry.targetDefinitions[0];
              }
              var chest = new TreasureChest(chestLevelX, chestLevelY, findRoom(chestRoomId), chestDefinition, chestWestWall);
              setChestOpened(chest, chestOpened);
              if (chestInstance = chest) {
                var chestTargetRegistry = game.treasure,
                  chestTarget = chestInstance;
                chestTargetRegistry.targets.push(chestTarget);
                chestTargetRegistry.targetByRoomId[chestTarget.room.roomId] = chestTarget;
              }
            }
          }
          var partyDto = saveData.party;
          if (partyDto) {
            var partyState = game.state.party,
              savedPartyGold = partyDto.gold,
              savedPartyKills = partyDto.kills,
              savedPartyExperiencePoints = partyDto.experiencePoints;
            partyState.gold = savedPartyGold ? savedPartyGold : 0;
            partyState.kills = savedPartyKills ? savedPartyKills : 0;
            partyState.experiencePoints = savedPartyExperiencePoints ? savedPartyExperiencePoints : 0;
          }
          var gameOptionsDto = saveData.gameOptions;
          if (gameOptionsDto) {
            var db = game.options,
              infoTextVisible = gameOptionsDto.infoTextVisible,
              spellEffectsVisible = gameOptionsDto.spellEffectsVisible,
              mapOverlayVisible = gameOptionsDto.mapOverlayVisible,
              offlineProcessingEnabled = gameOptionsDto.offlineProcessingEnabled,
              fpsVisible = gameOptionsDto.fpsVisible,
              inactiveTabProcessingEnabled;
            inactiveTabProcessingEnabled = undefined === gameOptionsDto.inactiveTabProcessingEnabled ? true : gameOptionsDto.inactiveTabProcessingEnabled;
            var spriteRenderOrderEnabled;
            spriteRenderOrderEnabled = undefined === gameOptionsDto.spriteRenderOrderEnabled ? true : gameOptionsDto.spriteRenderOrderEnabled;
            db.showCombatText = !!infoTextVisible;
            db.showSpellEffects = !!spellEffectsVisible;
            db.showMapOverlay = !!mapOverlayVisible;
            db.allowOfflineProgress = !!offlineProcessingEnabled;
            db.allowBackgroundProgress = !!inactiveTabProcessingEnabled;
            db.depthSortSprites = !!spriteRenderOrderEnabled;
            db.showFps = !!fpsVisible;
          }
          if (savedStatistics) {
            restoreStatistics(savedStatistics, game.state.runStatistics, false);
          }
          if (savedTotalStatistics) {
            restoreStatistics(savedTotalStatistics, game.state.lifetimeStatistics, false);
          } else {
            if (savedStatistics) {
              restoreStatistics(savedStatistics, game.state.lifetimeStatistics, true);
            }
          }
          var victoryStatisticsDto = saveData.victoryStatistics;
          if (victoryStatisticsDto) {
            var victoryStatistics = game.state.victoryStatistics,
              savedPartySize1Victories = victoryStatisticsDto.partySize1Victories,
              savedPartySize2Victories = victoryStatisticsDto.partySize2Victories,
              savedPartySize3Victories = victoryStatisticsDto.partySize3Victories,
              savedMaxContinuationVictories = victoryStatisticsDto.maxContinuationVictories,
              savedCurrentContinuationVictories = victoryStatisticsDto.currentContinuationVictories,
              savedSingleClassVictories = victoryStatisticsDto.singleClassVictories,
              classVictories = victoryStatisticsDto.classVictories,
              savedSoloClassVictories = victoryStatisticsDto.soloClassVictories,
              savedCurrentContinueCount = victoryStatisticsDto.currentContinueCount;
            victoryStatistics.partySize1Victories = savedPartySize1Victories ? savedPartySize1Victories : 0;
            victoryStatistics.partySize2Victories = savedPartySize2Victories ? savedPartySize2Victories : 0;
            victoryStatistics.partySize3Victories = savedPartySize3Victories ? savedPartySize3Victories : 0;
            victoryStatistics.maxContinuationVictories = savedMaxContinuationVictories ? savedMaxContinuationVictories : 0;
            victoryStatistics.currentContinuationVictories = savedCurrentContinuationVictories ? savedCurrentContinuationVictories : 0;
            victoryStatistics.singleClassVictories = savedSingleClassVictories ? savedSingleClassVictories : 0;
            if (undefined === savedCurrentContinueCount) {
              savedCurrentContinueCount = victoryStatistics.currentContinuationVictories;
            }
            victoryStatistics.currentContinueCount = savedCurrentContinueCount;
            if (classVictories) {
              var classKey, classVictoryCount, adventurerClassIndex;
              for (adventurerClassIndex = 0; adventurerClassIndex < adventurerClasses.length; adventurerClassIndex++) {
                classKey = adventurerClasses[adventurerClassIndex].characterClass;
                if (classVictoryCount = classVictories[classKey]) {
                  game.state.victoryStatistics.classVictories[classKey] = classVictoryCount;
                }
              }
            }
            if (savedSoloClassVictories) {
              var classId, $, soloClassIndex;
              for (soloClassIndex = 0; soloClassIndex < adventurerClasses.length; soloClassIndex++) {
                classId = adventurerClasses[soloClassIndex].characterClass;
                if ($ = savedSoloClassVictories[classId]) {
                  game.state.victoryStatistics.soloClassVictories[classId] = $;
                }
              }
            }
          }
          var savedAdventurers = saveData.adventurers;
          if (savedAdventurers) {
            var adventurerIndex, adventurerToRegister;
            for (adventurerIndex = 0; adventurerIndex < savedAdventurers.length; adventurerIndex++) {
              var adventurerDto = savedAdventurers[adventurerIndex],
                savedCharacterClass = adventurerDto.characterClass,
                savedSpriteName = adventurerDto.spriteName,
                characteristicsComponent = adventurerDto.characteristicsComponent,
                positionComponent = adventurerDto.positionComponent,
                $c = adventurerDto.spells,
                inventoryDto = adventurerDto.inventory,
                equippedItemsDto = adventurerDto.equippedItemCollection,
                savedSkillPoints = adventurerDto.skillPoints,
                savedInitialSpellSkillPoint = adventurerDto.initialSpellSkillPoint,
                upgrades1 = adventurerDto.upgrades1,
                id = adventurerDto.upgrades2,
                upgrades3 = adventurerDto.upgrades3,
                upgrades4 = adventurerDto.upgrades4,
                classDefinition = classesById[savedCharacterClass],
                character = new Character(adventurerDto.adventurerName, adventurerDto.characterType, savedCharacterClass, classDefinition, new Inventory(game.state.victoryCount)),
                behaviors = createBehaviorQueue(classDefinition.createBehaviors());
              character.behaviors = behaviors;
              character.sprite = game.monsterSprites.getSprite(savedSpriteName);
              var of = character;
              of.skillPoints = savedSkillPoints ? savedSkillPoints : 0;
              of.hasUnspentSkills = hasUnspentSkills(of);
              character.initialSpellSkillPoint = savedInitialSpellSkillPoint ? savedInitialSpellSkillPoint : 0;
              var position = character.position,
                savedWorldX = positionComponent.worldX,
                savedWorldY = positionComponent.worldY,
                savedRoomId = positionComponent.roomId,
                savedHallwayId = positionComponent.hallwayId,
                savedFloorPositionIndex = positionComponent.floorPositionIndex;
              setVector(position.levelPosition, positionComponent.levelX, positionComponent.levelY);
              setVector(position.worldPosition, savedWorldX, savedWorldY);
              if (-1 < savedRoomId) {
                position.room = findRoom(savedRoomId);
              }
              if (-1 < savedHallwayId) {
                var matchedHallway;
                b: {
                  for (var hallwayLevel = game.level, hallwayLookupIndex = 0; hallwayLookupIndex < hallwayLevel.hallwayList.length; hallwayLookupIndex++) {
                    if (hallwayLevel.hallwayList[hallwayLookupIndex].hallwayId === savedHallwayId) {
                      matchedHallway = hallwayLevel.hallwayList[hallwayLookupIndex];
                      break b;
                    }
                  }
                  matchedHallway = null;
                }
                position.currentHallway = matchedHallway;
                position.floorPositionIndex = savedFloorPositionIndex;
              }
              var spellLearner = character,
                savedSpells = $c;
              if (savedSpells) {
                for (var restoredSpell = undefined, spellIndex = 0; spellIndex < savedSpells.length; spellIndex++) {
                  var spellDefinitions = spellLearner.classDefinition.spellDefinitions,
                    matchedSpellDefinition = undefined;
                  if (spellDefinitions) {
                    c: {
                      var spellName = savedSpells[spellIndex].spellName,
                        lookedUpSpellDefinition = undefined,
                        spellKey = undefined;
                      for (spellKey in spellDefinitions) {
                        if (Object.prototype.hasOwnProperty.call(spellDefinitions, spellKey)) {
                          if (lookedUpSpellDefinition = spellDefinitions[spellKey], !lookedUpSpellDefinition) {
                            console.log("spell lookup failure for key: " + spellKey);
                          } else if (lookedUpSpellDefinition.name === spellName) {
                            matchedSpellDefinition = lookedUpSpellDefinition;
                            break c;
                          }
                        }
                      }
                      console.log("failed to lookup spell: " + spellName);
                      matchedSpellDefinition = null;
                    }
                    restoredSpell = matchedSpellDefinition ? new Spell(matchedSpellDefinition) : null;
                  } else {
                    restoredSpell = null;
                  }
                  if (restoredSpell) {
                    learnSpell(spellLearner, restoredSpell);
                  }
                }
              }
              var characterInventory = character.inventory,
                savedInventoryItems = inventoryDto;
              if (savedInventoryItems) {
                for (var restoredItem = undefined, inventoryItemIndex = 0; inventoryItemIndex < savedInventoryItems.length; inventoryItemIndex++) {
                  if (restoredItem = restoreItem(savedInventoryItems[inventoryItemIndex])) {
                    addInventoryItem(characterInventory, restoredItem, game.inventories);
                  }
                }
              }
              var equipTarget = character,
                savedEquippedItems = equippedItemsDto;
              if (savedEquippedItems) {
                for (var equippedItem = undefined, equippedItemIndex = 0; equippedItemIndex < savedEquippedItems.length; equippedItemIndex++) {
                  if (equippedItem = restoreItem(savedEquippedItems[equippedItemIndex])) {
                    equipItem(equipTarget, equippedItem);
                  }
                }
              }
              var characterStats = character.stats,
                savedCharacterLevel = characteristicsComponent.characterLevel,
                savedHealth = characteristicsComponent.characterHealth,
                savedSpirit = characteristicsComponent.characterSpirit,
                savedKills = characteristicsComponent.kills,
                savedDamageComponent = characteristicsComponent.damageComponent,
                savedArmorComponent = characteristicsComponent.armorComponent,
                savedAttackRatingComponent = characteristicsComponent.attackRatingComponent,
                savedDefenceRatingComponent = characteristicsComponent.defenceRatingComponent,
                savedMaxHealthComponent = characteristicsComponent.maxHealthComponent,
                savedMaxSpiritComponent = characteristicsComponent.maxSpiritComponent,
                savedStunCount = characteristicsComponent.stunCount,
                savedMinionKills = characteristicsComponent.minionKills,
                savedDamageGiven = characteristicsComponent.damageGiven,
                savedDamageReceived = characteristicsComponent.damageReceived;
              characterStats.characterLevel = savedCharacterLevel ? savedCharacterLevel : 1;
              var experienceToLevelUp = scaleByLevel(characterStats.characterLevel, experienceCurve, 1);
              characterStats.experienceToLevelUp = experienceToLevelUp;
              var spellSpiritCost = scaleByLevel(characterStats.characterLevel, damageCurve, 1);
              characterStats.spellSpiritCost = spellSpiritCost;
              characterStats.health = floorNumber(savedHealth ? savedHealth : characterStats.health);
              characterStats.spirit = savedSpirit ? savedSpirit : characterStats.spirit;
              characterStats.kills = savedKills ? savedKills : characterStats.kills;
              /** @type {{setMinionKills: (count: number) => void}} */ (/** @type {unknown} */ (characterStats)).setMinionKills(savedMinionKills ? savedMinionKills : characterStats.minionKills);
              characterStats.stunCount = savedStunCount ? savedStunCount : characterStats.stunCount;
              characterStats.damageGiven = savedDamageGiven ? savedDamageGiven : characterStats.damageGiven;
              characterStats.damageReceived = savedDamageReceived ? savedDamageReceived : characterStats.damageReceived;
              restoreStatComponent(characterStats.damage, savedDamageComponent);
              restoreStatComponent(characterStats.armor, savedArmorComponent);
              restoreStatComponent(characterStats.attackRating, savedAttackRatingComponent);
              restoreStatComponent(characterStats.defenceRating, savedDefenceRatingComponent);
              restoreStatComponent(characterStats.maxHealth, savedMaxHealthComponent);
              restoreStatComponent(characterStats.maxSpirit, savedMaxSpiritComponent);
              characterStats.baseAttackCooldown = 12;
              characterStats.baseHealthRegenPercent = 2;
              characterStats.baseSpiritRegenPercent = 3;
              restoreUpgradeFlags(character.skillTree1.upgrades, upgrades1);
              restoreUpgradeFlags(character.skillTree2.upgrades, id);
              restoreUpgradeFlags(character.skillTree3.upgrades, upgrades3);
              restoreUpgradeFlags(character.skillTree4.upgrades, upgrades4);
              if (adventurerToRegister = character) {
                game.state.adventurers.push(adventurerToRegister);
              }
            }
            game.state.leader = game.state.adventurers[0];
            game.state.scrollCaster = chooseScrollCaster();
          }
          saveManager.monsterAdapter.restoreMonsterTypes(saveData.monsterTypes);
          var purchasedLevelsBySetting = saveData.settings.upgrades,
            settingId,
            upgradeDefinition;
          for (settingId in purchasedLevelsBySetting) {
            if (Object.prototype.hasOwnProperty.call(purchasedLevelsBySetting, settingId)) {
              if (upgradeDefinition = globalUpgradesById[settingId]) {
                upgradeDefinition.purchasedLevels = purchasedLevelsBySetting[settingId];
              } else {
                console.log("failed to lookup settingsId: " + settingId);
              }
            }
          }
          var statisticsAdapter = saveManager.statisticsAdapter,
            scrollInventoryDto = saveData.scrollInventory;
          if (scrollInventoryDto) {
            var scrollIndex;
            for (scrollIndex = 0; scrollIndex < scrollInventoryDto.length; scrollIndex++) {
              statisticsAdapter.restoreScroll(scrollInventoryDto[scrollIndex]);
            }
          }
          var pointManagerDto = saveData.pointManagerState;
          if (pointManagerDto) {
            var savedSpentPoints = pointManagerDto.spentAdventurePoints,
              pointsByTypeDto = pointManagerDto.pointsByType,
              pointUpgradesDto = pointManagerDto.pointUpgrades;
            game.state.adventurePoints.spentPoints = savedSpentPoints ? savedSpentPoints : 0;
            if (pointsByTypeDto && 0 !== pointsByTypeDto.length) {
              var pointEventIndex;
              for (pointEventIndex = 0; pointEventIndex < pointsByTypeDto.length; pointEventIndex++) {
                var pointEventDto = pointsByTypeDto[pointEventIndex];
                if (pointEventDto) {
                  var pointEventType = pointEventDto.pointEventType,
                    savedPoints = pointEventDto.points,
                    savedCount = pointEventDto.count;
                  if (pointEventType) {
                    game.state.adventurePoints.pointsByEventType[pointEventType] = savedPoints ? savedPoints : 0;
                    game.state.adventurePoints.countsByEventType[pointEventType] = savedCount ? savedCount : 0;
                  }
                }
              }
            }
            if (pointUpgradesDto && 0 !== pointUpgradesDto.length) {
              var pointUpgradeIndex;
              for (pointUpgradeIndex = 0; pointUpgradeIndex < pointUpgradesDto.length; pointUpgradeIndex++) {
                var pointUpgradeDto = pointUpgradesDto[pointUpgradeIndex];
                if (pointUpgradeDto) {
                  var upgradeId = pointUpgradeDto.upgradeId;
                  if (upgradeId) {
                    var isPurchased = !!pointUpgradeDto.upgradePurchased,
                      matchedPointUpgrade = undefined;
                    b: {
                      for (var adventurePoints = game.state.adventurePoints, pointUpgradeLookupIndex = 0; pointUpgradeLookupIndex < adventurePoints.pointUpgrades.length; pointUpgradeLookupIndex++) {
                        if (adventurePoints.pointUpgrades[pointUpgradeLookupIndex].definition.upgradeId === upgradeId) {
                          matchedPointUpgrade = adventurePoints.pointUpgrades[pointUpgradeLookupIndex];
                          break b;
                        }
                      }
                      matchedPointUpgrade = null;
                    }
                    if (matchedPointUpgrade) {
                      matchedPointUpgrade.setPurchased(isPurchased);
                    }
                  }
                }
              }
            }
            recalculateAdventurePoints(game.state.adventurePoints);
          }
          var achievementManagerDto = saveData.achievementManager;
          if (achievementManagerDto) {
            var achievementsDto = achievementManagerDto.achievements;
            if (achievementsDto) {
              var achievementIndex;
              for (achievementIndex = 0; achievementIndex < achievementsDto.length; achievementIndex++) {
                var achievementDto = achievementsDto[achievementIndex];
                if (achievementDto) {
                  var achievementId = achievementDto.achievementId,
                    savedObtained = achievementDto.obtained,
                    savedApplied = achievementDto.applied;
                  if (achievementId) {
                    var storedAchievement = game.state.achievements.byId[achievementId];
                    if (storedAchievement) {
                      storedAchievement.obtained = savedObtained ? true : false;
                      storedAchievement.applied = savedApplied ? true : false;
                    } else {
                      console.log("Failed to find achievement: " + achievementId);
                    }
                  }
                }
              }
            }
          }
          var achievements = game.state.achievements;
          if (0 != achievements.obtainedList.length) {
            achievements.obtainedList.length = 0;
          }
          if (0 != achievements.claimQueue.length) {
            achievements.claimQueue.length = 0;
          }
          var achievementListIndex, achievement;
          for (achievementListIndex = 0; achievementListIndex < achievements.achievementList.length; achievementListIndex++) {
            achievement = achievements.achievementList[achievementListIndex];
            if (achievement.obtained) {
              if (achievement.applied) {
                if (achievement.obtained && achievement.applied) {
                  increasePointEventReward(achievement.pointEventTypeId, achievement.pointRewardBonus);
                }
              } else {
                achievements.claimQueue.push(achievement);
              }
            } else {
              achievements.obtainedList.push(achievement);
            }
          }
          var potionInventoryDto = saveData.potionInventory;
          if (potionInventoryDto) {
            var potionIndex;
            for (potionIndex = 0; potionIndex < potionInventoryDto.length; potionIndex++) {
              var potionDto = potionInventoryDto[potionIndex],
                savedPotionActive = potionDto.active,
                savedActivationTurn = potionDto.activeStartTurn,
                matchedPotionDefinition;
              b: {
                for (var potionId = potionDto.potionId, potionDefinitionIndex = 0; potionDefinitionIndex < potionDefinitions.length; potionDefinitionIndex++) {
                  if (potionId === potionDefinitions[potionDefinitionIndex].potionId) {
                    matchedPotionDefinition = potionDefinitions[potionDefinitionIndex];
                    break b;
                  }
                }
                console.log("failed to find potion by id: " + potionId);
                matchedPotionDefinition = null;
              }
              if (matchedPotionDefinition) {
                var potion = new Potion(matchedPotionDefinition, game.itemSprites);
                setPotionActive(potion, savedPotionActive);
                potion.activationTurn = savedActivationTurn;
                addPotion(potion, game.potions);
              }
            }
          }
          refreshWorldBlocks(game.world);
          refreshPartyLevels();
          refreshUnspentSkillFlags();
          game.allies.reset();
        } else {
          game.initializeWorld();
        }
        game.restoreRuntimeState();
        return true;
      }
    }
  }
  return false;
}
/** @typedef {import('./save-dto.js').SaveData} SaveData */
/** @typedef {import('./save-dto.js').SaveDataUninitialized} SaveDataUninitialized */

export function serializeGame(saveManager) {
  return (saveManager = JSON.stringify(createSaveState(saveManager))) ? saveCodec.compress(saveManager) : null;
}
/**
 * 内存 → 存档 DTO。返回类型接上 `SaveData`（或空白档形态 `SaveDataUninitialized`）后，
 * 少写/写错顶层键会由 `npm run typecheck` 直接报出来——此前这块没有任何类型检查，
 * 只有差分测试兜底。
 * @returns {SaveData|SaveDataUninitialized}
 */
export function createSaveState(saveManager) {
  var saveData;
  if (game.initialized) {
    var saveKey = saveManager.saveKey,
      gameTimestamp = Date.now(),
      gameInitialized = game.initialized,
      turnNumber = game.state.turnNumber,
      frameNumber = game.state.frameNumber,
      worldActive = game.worldActive,
      partyCreated = game.partyCreated,
      gameWon = game.gameWon,
      victoryCount = game.state.victoryCount,
      worldDto,
      worldMap = game.world;
    worldDto = {
      worldCenterX: worldMap.worldCenterX,
      worldCenterY: worldMap.worldCenterY,
      blockShiftCol: worldMap.blockOriginColumn,
      blockShiftRow: worldMap.blockOriginRow
    };
    var gameOptionsDto,
      gameOptions = game.options;
    gameOptionsDto = {
      infoTextVisible: gameOptions.showCombatText,
      spellEffectsVisible: gameOptions.showSpellEffects,
      mapOverlayVisible: gameOptions.showMapOverlay,
      offlineProcessingEnabled: gameOptions.allowOfflineProgress,
      inactiveTabProcessingEnabled: gameOptions.allowBackgroundProgress,
      spriteRenderOrderEnabled: gameOptions.depthSortSprites,
      fpsVisible: gameOptions.showFps
    };
    var pendingFarmKills = game.dungeons.pendingFarmKills,
      discoveredDungeonCount = game.dungeons.discoveredDungeonCount,
      dungeonStates = [],
      dungeonList = game.dungeons.dungeonList,
      dungeonStateDto,
      dungeonIndex;
    for (dungeonIndex = 0; dungeonIndex < dungeonList.length; dungeonIndex++) {
      var dungeon = dungeonList[dungeonIndex];
      dungeonStateDto = {
        dungeonId: dungeon.dungeonId,
        discovered: dungeon.discovered,
        conquered: dungeon.conquered,
        cleared: dungeon.cleared,
        clearedTurn: dungeon.clearedTurn,
        dungeonFarm: dungeon.isFarm,
        farmStartTurn: dungeon.farmStartTurn,
        dungeonFarmCost: dungeon.farmCost,
        dungeonType: dungeon.dungeonType,
        levelCount: dungeon.levelCount
      };
      dungeonStates.push(dungeonStateDto);
    }
    var dungeonManagerDto = {
        farmedKills: pendingFarmKills,
        dungeonCostLevel: discoveredDungeonCount,
        dungeonStates: dungeonStates
      },
      shopManagerDto = {
        collectedGold: game.shops.collectedGold
      },
      nextRequiredMonsterLevel = game.castles.nextRequiredMonsterLevel,
      castleStates = [],
      castleList = game.castles.castleList,
      castleStateDto,
      castleIndex;
    for (castleIndex = 0; castleIndex < castleList.length; castleIndex++) {
      var castle = castleList[castleIndex];
      castleStateDto = {
        castleId: castle.castleId,
        conquered: castle.conquered,
        dungeonsConquered: castle.dungeonsConquered,
        castleRegionLocked: castle.regionLocked,
        attackScheduled: castle.attackScheduled,
        requiredMonsterLevel: castle.requiredMonsterLevel
      };
      castleStates.push(castleStateDto);
    }
    var castleManagerDto = {
        nextRequiredMonsterLevel: nextRequiredMonsterLevel,
        castleStates: castleStates
      },
      farmEntries = [],
      farmList = game.farms.farmList,
      farmEntry,
      farmIndex;
    for (farmIndex = 0; farmIndex < farmList.length; farmIndex++) {
      var farm = farmList[farmIndex];
      farmEntry = {
        dungeonId: farm.dungeonId,
        farmCol: farm.farmColumn,
        farmRow: farm.farmRow
      };
      farmEntries.push(farmEntry);
    }
    var currentDungeonDto,
      currentDungeon = game.currentDungeon;
    currentDungeonDto = currentDungeon ? {
      dungeonId: currentDungeon.dungeonId,
      currentLevelIndex: currentDungeon.currentLevelIndex
    } : null;
    var currentCastleDto,
      currentCastle = game.currentCastle;
    currentCastleDto = currentCastle ? {
      castleId: currentCastle.castleId
    } : null;
    var levelState;
    if (game.worldActive) {
      levelState = null;
    } else {
      var level = game.level,
        levelCenterX = level.centerX,
        levelCenterY = level.centerY,
        levelSeed = level.levelSeed,
        roomList = level.roomList,
        roomVisibility = [],
        roomIndex;
      for (roomIndex = 0; roomIndex < roomList.length; roomIndex++) {
        roomVisibility.push(roomList[roomIndex].discovered);
      }
      var hallwayList = level.hallwayList,
        hallwayStates = [],
        hallwayIndex;
      for (hallwayIndex = 0; hallwayIndex < hallwayList.length; hallwayIndex++) {
        var hallway = hallwayList[hallwayIndex];
        hallwayStates.push({
          visible: hallway.discovered,
          doorAOpen: hallway.doorA.isOpen,
          doorBOpen: hallway.doorB.isOpen
        });
      }
      levelState = {
        levelCenterX: levelCenterX,
        levelCenterY: levelCenterY,
        levelSeed: levelSeed,
        roomVisibility: roomVisibility,
        hallways: hallwayStates
      };
    }
    var chestStates;
    if (game.worldActive) {
      chestStates = null;
    } else {
      var chestTargets = game.treasure.targets,
        chestEntries = [],
        chestIndex;
      for (chestIndex = 0; chestIndex < chestTargets.length; chestIndex++) {
        var chest = chestTargets[chestIndex];
        chestEntries.push({
          levelX: chest.levelX,
          levelY: chest.levelY,
          opened: chest.opened,
          settingsId: chest.definition.settingsId,
          westWall: chest.westWall,
          roomId: chest.room.roomId
        });
      }
      chestStates = chestEntries;
    }
    var scrollList = game.scrolls.scrollList,
      scrollInventory = [],
      scrollIndex;
    for (scrollIndex = 0; scrollIndex < scrollList.length; scrollIndex++) {
      var scroll = scrollList[scrollIndex];
      scrollInventory.push({
        scrollId: scroll.scrollId,
        count: scroll.quantity,
        locked: scroll.locked,
        upgradeCount: scroll.upgradeCount
      });
    }
    var potionList = game.potions.potionList,
      potionInventory = [],
      potionIndex;
    for (potionIndex = 0; potionIndex < potionList.length; potionIndex++) {
      var potion = potionList[potionIndex];
      potionInventory.push({
        potionId: potion.potionId,
        active: potion.active,
        activeStartTurn: potion.activationTurn
      });
    }
    var partyDto,
      partyState = game.state.party;
    partyDto = {
      gold: partyState.gold,
      kills: partyState.kills,
      experiencePoints: partyState.experiencePoints
    };
    var serializedStatistics = serializeStatistics(game.state.runStatistics),
      serializedLifetimeStatistics = serializeStatistics(game.state.lifetimeStatistics),
      victoryStatisticsDto,
      victoryStatistics = game.state.victoryStatistics,
      soloVictoryStatistics = game.state.victoryStatistics,
      soloClassVictories = {},
      soloClassId,
      soloVictoryCount,
      soloClassIndex;
    for (soloClassIndex = 0; soloClassIndex < adventurerClasses.length; soloClassIndex++) {
      soloClassId = adventurerClasses[soloClassIndex].characterClass;
      soloVictoryCount = getSoloClassVictories(soloVictoryStatistics, soloClassId);
      if (0 < soloVictoryCount) {
        soloClassVictories[soloClassId] = soloVictoryCount;
      }
    }
    var classVictoryStatistics = game.state.victoryStatistics,
      classVictories = {},
      classId,
      classVictoryCount,
      classIndex;
    for (classIndex = 0; classIndex < adventurerClasses.length; classIndex++) {
      classId = adventurerClasses[classIndex].characterClass;
      classVictoryCount = getClassVictories(classVictoryStatistics, classId);
      if (0 < classVictoryCount) {
        classVictories[classId] = classVictoryCount;
      }
    }
    victoryStatisticsDto = {
      partySize1Victories: victoryStatistics.partySize1Victories,
      partySize2Victories: victoryStatistics.partySize2Victories,
      partySize3Victories: victoryStatistics.partySize3Victories,
      maxContinuationVictories: victoryStatistics.maxContinuationVictories,
      currentContinuationVictories: victoryStatistics.currentContinuationVictories,
      singleClassVictories: victoryStatistics.singleClassVictories,
      classVictories: classVictories,
      soloClassVictories: soloClassVictories,
      currentContinueCount: victoryStatistics.currentContinueCount
    };
    var serializedAdventurers = [],
      adventurerIndex;
    for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
      serializedAdventurers.push(serializeCharacter(game.state.adventurers[adventurerIndex]));
    }
    var monsterTypesDto,
      monsterCatalog = game.monsterCatalog,
      monsterLevelStates = [],
      catalog = game.monsterCatalog,
      maxUnlockedLevel = catalog.maxUnlockedLevel,
      monsterLevel;
    for (monsterLevel = catalog.minUnlockedLevel; monsterLevel <= maxUnlockedLevel; monsterLevel++) {
      monsterLevelStates.push(serializeMonsterLevel(monsterLevel, getMonsterTypesForLevel(catalog, monsterLevel)));
    }
    monsterTypesDto = {
      monsterLevelStates: monsterLevelStates,
      minUnlockedLevel: monsterCatalog.minUnlockedLevel,
      maxUnlockedLevel: monsterCatalog.maxUnlockedLevel
    };
    var definitionKey,
      upgradeDefinition,
      // 键是 settingId、值是已购级数（存档 DTO: settings.upgrades）。
      // 类型只标注，不改运行时行为；少了这条注解，createSaveState 的 SaveData 返回类型会不成立。
      /** @type {Object<string, number>} */
      purchasedLevelsBySetting = {};
    for (definitionKey in globalUpgradeDefinitions) {
      if (Object.prototype.hasOwnProperty.call(globalUpgradeDefinitions, definitionKey)) {
        upgradeDefinition = globalUpgradeDefinitions[definitionKey];
        purchasedLevelsBySetting[upgradeDefinition.settingId] = upgradeDefinition.purchasedLevels;
      }
    }
    var settingsDto = {
        upgrades: purchasedLevelsBySetting
      },
      spentPoints = game.state.adventurePoints.spentPoints,
      adventurePoints = game.state.adventurePoints,
      pointEventStates = [],
      pointEventTypeId,
      eventTypePoints,
      eventTypeCount,
      pointEventIndex;
    for (pointEventIndex = 0; pointEventIndex < pointEventDefinitions.length; pointEventIndex++) {
      pointEventTypeId = pointEventDefinitions[pointEventIndex].pointEventTypeId;
      eventTypePoints = adventurePoints.pointsByEventType[pointEventTypeId];
      eventTypeCount = adventurePoints.countsByEventType[pointEventTypeId];
      pointEventStates.push({
        pointEventType: pointEventTypeId,
        points: eventTypePoints,
        count: eventTypeCount
      });
    }
    var pointUpgradeStates = [],
      pointUpgrades = game.state.adventurePoints.pointUpgrades,
      pointUpgradeIndex;
    for (pointUpgradeIndex = 0; pointUpgradeIndex < pointUpgrades.length; pointUpgradeIndex++) {
      var db = pointUpgrades[pointUpgradeIndex];
      pointUpgradeStates.push({
        upgradeId: db.definition.upgradeId,
        upgradePurchased: db.isOwned()
      });
    }
    var levelDto = levelState,
      treasureChestStates = chestStates,
      pointManagerDto = {
        spentAdventurePoints: spentPoints,
        pointsByType: pointEventStates,
        pointUpgrades: pointUpgradeStates
      },
      achievementStates = [],
      achievementList = game.state.achievements.achievementList,
      achievementDto,
      achievementIndex;
    for (achievementIndex = 0; achievementIndex < achievementList.length; achievementIndex++) {
      var achievement = achievementList[achievementIndex];
      achievementDto = {
        achievementId: achievement.id,
        obtained: achievement.obtained,
        applied: achievement.applied
      };
      achievementStates.push(achievementDto);
    }
    saveData = {
      saveKey: saveKey,
      gameTimestamp: gameTimestamp,
      gameInitialized: gameInitialized,
      turnNumber: turnNumber,
      frameNumber: frameNumber,
      worldActive: worldActive,
      partyCreated: partyCreated,
      gameWon: gameWon,
      victoryCount: victoryCount,
      world: worldDto,
      gameOptions: gameOptionsDto,
      dungeonManagerState: dungeonManagerDto,
      shopManager: shopManagerDto,
      castleManager: castleManagerDto,
      farms: farmEntries,
      currentDungeon: currentDungeonDto,
      currentCastle: currentCastleDto,
      level: levelDto,
      treasureChestManager: treasureChestStates,
      scrollInventory: scrollInventory,
      potionInventory: potionInventory,
      party: partyDto,
      statistics: serializedStatistics,
      totalStatistics: serializedLifetimeStatistics,
      victoryStatistics: victoryStatisticsDto,
      adventurers: serializedAdventurers,
      monsterTypes: monsterTypesDto,
      settings: settingsDto,
      pointManagerState: pointManagerDto,
      achievementManager: {
        achievements: achievementStates
      }
    };
  } else {
    saveData = {
      saveKey: saveManager.saveKey,
      gameInitialized: false,
      partyCreated: false,
      gameWon: false
    };
  }
  return saveData;
}
export function initializePersistenceGameSave() {}
