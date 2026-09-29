/** 队伍资源、旅行目标与等级聚合。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { WorldPathfinder, calculateWorldCosts } from "../world/travel-costs.js";
import { game } from "../runtime/game.js";
import { getAllies, getMonsters } from "../combat/encounters.js";
import { clearMovementTarget } from "./movement.js";
import { IDLE_ACTION } from "../ai/targeting.js";
import { clearItemDrops, isBetterItem } from "../loot/items.js";
import { findCastleByRegion, invalidateCastleRevision, refreshAttackableCastles, refreshScheduledCastles } from "../world/regions.js";
import { findNearestWorldColumn, findNearestWorldRow, refreshWorldBlocks } from "../world/terrain.js";
import { distanceSquaredToPoint, floorNumber, recordGameEvent } from "../core/math.js";
import { awardAdventurePoints } from "../progression/points.js";
import { refreshFarmableDungeons } from "../world/dungeons.js";
import { saveProgress } from "../persistence/game-save.js";
export function PartyState() {
  this.gold = this.experiencePoints = this.kills = 0;
  this.cachedMinLevel = this.cachedMaxLevel = -1;
  this.targetRoom = this.targetDoor = this.destinationRoom = this.targetTreasureChest = this.targetCastle = this.targetShop = this.activeCastle = this.targetDungeon = null;
  this.forcedTravelActive = false;
  this.forcedDestinationRoom = null;
  this.travellingToDisabledAlly = false;
  this.worldPathfinder = new WorldPathfinder();
  this.destinationOffWorld = false;
  this.worldDestRow = this.worldDestColumn = 0;
}
export function forcePartyDestination(forcedDestinationRoom) {
  var party = game.state.party;
  setPartyDestination(party, forcedDestinationRoom);
  party.forcedTravelActive = true;
}
export function setPartyDestination(party, forcedDestinationRoom) {
  party.forcedDestinationRoom = forcedDestinationRoom;
  if (party.forcedDestinationRoom) {
    party.destinationRoom = party.forcedDestinationRoom;
    party.targetRoom = null;
    party.targetDoor = null;
  }
}
export function isPartyTravelling(party) {
  return party.travellingToDisabledAlly || party.forcedTravelActive;
}
export function addKills(killsToAdd) {
  var party = game.state.party;
  party.kills += killsToAdd;
}
export function spendKills(party, killsToSpend) {
  party.kills -= killsToSpend;
  if (0 > party.kills) {
    party.kills = 0;
  }
}
export function addExperience(experiencePointsToAdd) {
  var party = game.state.party;
  party.experiencePoints += experiencePointsToAdd;
}
export function addGold(goldToAdd) {
  var party = game.state.party;
  party.gold += goldToAdd;
}
export function spendGold(goldToSpend) {
  var party = game.state.party;
  party.gold -= goldToSpend;
  if (0 > party.gold) {
    party.gold = 0;
  }
}
export function getPartyMaxLevel(party) {
  if (0 > party.cachedMaxLevel) {
    party.cachedMaxLevel = calculatePartyMaxLevel();
  }
  return party.cachedMaxLevel;
}
export function getPartyMinLevel() {
  var party = game.state.party;
  if (0 > party.cachedMinLevel) {
    party.cachedMinLevel = calculatePartyMinLevel(party);
  }
  return party.cachedMinLevel;
}
export function refreshPartyLevels() {
  var party = game.state.party;
  party.cachedMaxLevel = calculatePartyMaxLevel();
  party.cachedMinLevel = calculatePartyMinLevel(party);
}
export function calculatePartyMaxLevel() {
  var maxLevel = -1,
    adventurerLevel,
    adventurerIndex;
  for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
    adventurerLevel = game.state.adventurers[adventurerIndex].stats.characterLevel;
    if (maxLevel < adventurerLevel) {
      maxLevel = adventurerLevel;
    }
  }
  return maxLevel;
}
export function calculatePartyMinLevel(party) {
  var minLevel = getPartyMaxLevel(party);
  var adventurerLevel, adventurerIndex;
  for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
    adventurerLevel = game.state.adventurers[adventurerIndex].stats.characterLevel;
    if (minLevel > adventurerLevel) {
      minLevel = adventurerLevel;
    }
  }
  return minLevel;
}
export function findNextUnopenedDoor() {
  var leader = game.state.leader,
    currentHallway,
    doorIndex,
    leaderRoom,
    doorDistance,
    nearestUnopenedDoor = null,
    leaderLevelPosition = leader.position.levelPosition,
    roomList = game.level.roomList,
    hallwayList = game.level.hallwayList,
    bestDistanceSquared = 1E5;
  if (currentHallway = leader.position.currentHallway) {
    if (!currentHallway.doorA.isOpen) {
      return currentHallway.doorA;
    }
    if (!currentHallway.doorB.isOpen) {
      return currentHallway.doorB;
    }
  }
  if (leaderRoom = leader.position.room) {
    var doorList = leaderRoom.doorList;
    for (doorIndex = 0; doorIndex < doorList.length; doorIndex++) {
      var leaderRoomDoor = doorList[doorIndex];
      if (!leaderRoomDoor.isOpen) {
        if (nearestUnopenedDoor) {
          doorDistance = distanceSquaredToPoint(leaderLevelPosition, leaderRoomDoor.pixelColumn, leaderRoomDoor.pixelRow);
          if (doorDistance < bestDistanceSquared) {
            nearestUnopenedDoor = leaderRoomDoor;
            bestDistanceSquared = doorDistance;
          }
        } else {
          nearestUnopenedDoor = leaderRoomDoor;
          bestDistanceSquared = distanceSquaredToPoint(leaderLevelPosition, leaderRoomDoor.pixelColumn, leaderRoomDoor.pixelRow);
        }
      }
    }
    if (nearestUnopenedDoor) {
      return nearestUnopenedDoor;
    }
  }
  for (var roomIndex = 0; roomIndex < roomList.length; roomIndex++) {
    var discoveredRoom = roomList[roomIndex];
    if (discoveredRoom.discovered) {
      for (doorList = discoveredRoom.doorList, doorIndex = 0; doorIndex < doorList.length; doorIndex++) {
        var discoveredRoomDoor = doorList[doorIndex];
        if (!discoveredRoomDoor.isOpen) {
          if (nearestUnopenedDoor) {
            doorDistance = distanceSquaredToPoint(leaderLevelPosition, discoveredRoomDoor.pixelColumn, discoveredRoomDoor.pixelRow);
            if (doorDistance < bestDistanceSquared) {
              nearestUnopenedDoor = discoveredRoomDoor;
              bestDistanceSquared = doorDistance;
            }
          } else {
            nearestUnopenedDoor = discoveredRoomDoor;
            bestDistanceSquared = distanceSquaredToPoint(leaderLevelPosition, discoveredRoomDoor.pixelColumn, discoveredRoomDoor.pixelRow);
          }
        }
      }
    }
  }
  for (var hallwayIndex = 0; hallwayIndex < hallwayList.length; hallwayIndex++) {
    var hallway = hallwayList[hallwayIndex];
    if (hallway.discovered) {
      var hallwayDoor = hallway.doorA;
      if (!hallwayDoor.isOpen) {
        if (nearestUnopenedDoor) {
          doorDistance = distanceSquaredToPoint(leaderLevelPosition, hallwayDoor.pixelColumn, hallwayDoor.pixelRow);
          if (doorDistance < bestDistanceSquared) {
            nearestUnopenedDoor = hallwayDoor;
            bestDistanceSquared = doorDistance;
          }
        } else {
          nearestUnopenedDoor = hallwayDoor;
          bestDistanceSquared = distanceSquaredToPoint(leaderLevelPosition, hallwayDoor.pixelColumn, hallwayDoor.pixelRow);
        }
      }
      hallwayDoor = hallway.doorB;
      if (!hallwayDoor.isOpen) {
        if (nearestUnopenedDoor) {
          doorDistance = distanceSquaredToPoint(leaderLevelPosition, hallwayDoor.pixelColumn, hallwayDoor.pixelRow);
          if (doorDistance < bestDistanceSquared) {
            nearestUnopenedDoor = hallwayDoor;
            bestDistanceSquared = doorDistance;
          }
        } else {
          nearestUnopenedDoor = hallwayDoor;
          bestDistanceSquared = distanceSquaredToPoint(leaderLevelPosition, hallwayDoor.pixelColumn, hallwayDoor.pixelRow);
        }
      }
    }
  }
  return nearestUnopenedDoor;
}
export function initializeCharactersParty() {
  PartyState.prototype.setTargetTreasureChest = function (treasureChest) {
    this.targetTreasureChest = treasureChest;
  };
  PartyState.prototype.completeLevel = function () {
    this.targetTreasureChest = this.targetRoom = this.targetDoor = this.destinationRoom = null;
    if (game.currentDungeon) {
      game.currentDungeon.advanceLevel();
    } else if (game.currentCastle) {
      var conqueredCastle = game.currentCastle;
      game.currentCastle = null;
      game.worldActive = true;
      var allyPosition,
        allies = getAllies(),
        idleAlly,
        allyIndex;
      for (allyIndex = 0; allyIndex < allies.length; allyIndex++) {
        idleAlly = allies[allyIndex];
        allyPosition = idleAlly.position;
        clearMovementTarget(allyPosition);
        allyPosition.currentHallway = null;
        allyPosition.room = null;
        idleAlly.actionType = IDLE_ACTION;
      }
      clearItemDrops(game.itemDrops);
      conqueredCastle.attackScheduled = false;
      invalidateCastleRevision();
      conqueredCastle.conquered = true;
      var adjacentLockedCastles = [];
      var adjacentLockedCastle;
      var castleRegionIndex = 0;
      for (; castleRegionIndex < conqueredCastle.regions.length; castleRegionIndex++) {
        var castleRegion = conqueredCastle.regions[castleRegionIndex];
        var regionColumn = castleRegion.regionColumn;
        var regionRow = conqueredCastle.regions[castleRegionIndex].regionRow;
        if ((adjacentLockedCastle = findCastleByRegion(regionColumn - 1 + "_" + regionRow)) && adjacentLockedCastle !== conqueredCastle && adjacentLockedCastle.regionLocked && 0 > adjacentLockedCastles.indexOf(adjacentLockedCastle)) {
          adjacentLockedCastles.push(adjacentLockedCastle);
        }
        if ((adjacentLockedCastle = findCastleByRegion(regionColumn + 1 + "_" + regionRow)) && adjacentLockedCastle !== conqueredCastle && adjacentLockedCastle.regionLocked && 0 > adjacentLockedCastles.indexOf(adjacentLockedCastle)) {
          adjacentLockedCastles.push(adjacentLockedCastle);
        }
        if ((adjacentLockedCastle = findCastleByRegion(regionColumn + "_" + (regionRow - 1))) && adjacentLockedCastle !== conqueredCastle && adjacentLockedCastle.regionLocked && 0 > adjacentLockedCastles.indexOf(adjacentLockedCastle)) {
          adjacentLockedCastles.push(adjacentLockedCastle);
        }
        if ((adjacentLockedCastle = findCastleByRegion(regionColumn + "_" + (regionRow + 1))) && adjacentLockedCastle !== conqueredCastle && adjacentLockedCastle.regionLocked && 0 > adjacentLockedCastles.indexOf(adjacentLockedCastle)) {
          adjacentLockedCastles.push(adjacentLockedCastle);
        }
      }
      var lockedCastleIndex = 0;
      for (; lockedCastleIndex < adjacentLockedCastles.length; lockedCastleIndex++) {
        adjacentLockedCastles[lockedCastleIndex].regionLocked = false;
      }
      invalidateCastleRevision();
      refreshWorldBlocks(game.world);
      recordGameEvent("Castle", "已清空:" + conqueredCastle.castleName);
      game.state.statisticsRecorder.recordCastleConquered();
      refreshAttackableCastles(conqueredCastle);
      refreshScheduledCastles(conqueredCastle);
      awardAdventurePoints(19);
      var castleDungeonList = conqueredCastle.dungeonList;
      if (castleDungeonList) {
        var castleDungeonIndex = 0;
        for (; castleDungeonIndex < castleDungeonList.length; castleDungeonIndex++) {
          refreshFarmableDungeons(game.dungeons, castleDungeonList[castleDungeonIndex]);
        }
      }
      var castles = game.castles;
      var unconqueredCastleIndex = 0;
      var castleIndex = 0;
      for (; castleIndex < castles.castleList.length; castleIndex++) {
        if (!castles.castleList[castleIndex].conquered) {
          unconqueredCastleIndex++;
        }
      }
      if (0 === unconqueredCastleIndex) {
        game.state.victoryCount++;
        game.gameWon = true;
        game.finishOfflineProgress();
        saveProgress(game.saves);
        game.view.onGameWon();
        var victoryStatistics = game.state.victoryStatistics;
        var partySize = game.state.adventurers.length;
        if (4 > partySize) {
          if (1 === partySize) {
            victoryStatistics.partySize1Victories += 1;
            var soloAdventurerClass = game.state.adventurers[0].characterClass;
            var soloClassWinCount = victoryStatistics.soloClassVictories[soloAdventurerClass];
            if (!soloClassWinCount) {
              soloClassWinCount = 0;
            }
            victoryStatistics.soloClassVictories[soloAdventurerClass] = soloClassWinCount + 1;
          } else {
            if (2 === partySize) {
              victoryStatistics.partySize2Victories += 1;
            } else {
              if (3 === partySize) {
                victoryStatistics.partySize3Victories += 1;
              }
            }
          }
        }
        var classTallyIndex = 0;
        for (; classTallyIndex < partySize; classTallyIndex++) {
          var allyClass = game.state.adventurers[classTallyIndex].characterClass;
          var classWinCount = victoryStatistics.classVictories[allyClass];
          if (!classWinCount) {
            classWinCount = 0;
          }
          victoryStatistics.classVictories[allyClass] = classWinCount + 1;
        }
        var continueCount = victoryStatistics.currentContinueCount;
        if (0 < continueCount) {
          if (continueCount > victoryStatistics.maxContinuationVictories) {
            victoryStatistics.maxContinuationVictories = continueCount;
          }
          victoryStatistics.currentContinuationVictories = continueCount;
        }
        if (4 <= partySize) {
          var allAdventurersSameClass = true;
          var firstAllyClass = game.state.adventurers[0].characterClass;
          var sameClassCheckIndex = 1;
          for (; sameClassCheckIndex < partySize; sameClassCheckIndex++) {
            if (firstAllyClass != game.state.adventurers[sameClassCheckIndex].characterClass) {
              allAdventurersSameClass = false;
              break;
            }
          }
          if (allAdventurersSameClass) {
            victoryStatistics.singleClassVictories += 1;
          }
        }
        var playedMillis = game.state.runStatistics.playedMillis;
        var elapsedHours = floorNumber(playedMillis / 36E5);
        var elapsedMinutes = floorNumber(playedMillis / 6E4 % 60);
        var elapsedSeconds = floorNumber(playedMillis / 1E3 % 60);
        var victoryLabel = "Time: " + ((10 > elapsedHours ? "0" : "") + elapsedHours + ":" + (10 > elapsedMinutes ? "0" : "") + elapsedMinutes + ":" + (10 > elapsedSeconds ? "0" : "") + elapsedSeconds) + ",胜利:" + game.state.victoryCount;
        var adventurerIndex = 0;
        for (; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
          victoryLabel += ", " + game.state.adventurers[adventurerIndex].classDefinition.className + " (" + game.state.adventurers[adventurerIndex].stats.characterLevel + ")";
        }
        recordGameEvent("Victory", victoryLabel);
      }
    }
  };
  PartyState.prototype.setTargetDoor = function (targetDoor) {
    this.targetDoor = targetDoor;
  };
  PartyState.prototype.setTargetRoom = function (targetRoom) {
    this.targetRoom = targetRoom;
  };
  PartyState.prototype.updateWorldMode = function () {
    if (this.targetCastle && this.targetCastle.conquered) {
      this.targetCastle = null;
    }
    if (!this.targetCastle) {
      var castles = game.castles,
        leaderWorldPosition = game.state.leader.position.worldPosition,
        nearestCastleCandidate = null,
        nearestCastleDistanceSquared = 0,
        scannedCastle,
        scannedCastleDistanceSquared,
        castleScanIndex;
      for (castleScanIndex = 0; castleScanIndex < castles.castleList.length; castleScanIndex++) {
        scannedCastle = castles.castleList[castleScanIndex];
        if (!scannedCastle.regionLocked && !scannedCastle.conquered) {
          scannedCastleDistanceSquared = distanceSquaredToPoint(leaderWorldPosition, game.world.tileToPixelX(scannedCastle.worldPixelX), game.world.tileToPixelY(scannedCastle.worldPixelY));
          if (!nearestCastleCandidate || scannedCastleDistanceSquared < nearestCastleDistanceSquared) {
            nearestCastleCandidate = scannedCastle;
            nearestCastleDistanceSquared = scannedCastleDistanceSquared;
          }
        }
      }
      this.targetCastle = nearestCastleCandidate;
    }
    if (this.targetCastle) {
      var shopTargetChosen = false;
      var unfitItemTotal = 0;
      var adventurerIndex = 0;
      for (; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
        var scannedAdventurer = game.state.adventurers[adventurerIndex];
        var adventurerItems = (/** @type {any} */ (scannedAdventurer)).inventory.items;
        if (0 === adventurerItems.length) {
          scannedAdventurer = 0;
        } else {
          var itemScanIndex = undefined;
          var scannedInventoryItem = undefined;
          var equippedItem = undefined,
            unfitItemCount = 0;
          for (itemScanIndex = 0; itemScanIndex < adventurerItems.length; itemScanIndex++) {
            scannedInventoryItem = adventurerItems[itemScanIndex];
            equippedItem = (/** @type {any} */ (scannedAdventurer)).getSlotItem(scannedInventoryItem.slot);
            if (equippedItem && !isBetterItem(scannedInventoryItem, equippedItem)) {
              unfitItemCount++;
            }
          }
          scannedAdventurer = unfitItemCount;
        }
        unfitItemTotal += scannedAdventurer;
      }
      var unfitItemSum = unfitItemTotal;
      if (this.targetShop) {
        if (0 === unfitItemSum) {
          this.targetShop = null;
        }
      } else if (0 < unfitItemSum) {
        var shops = game.shops;
        var shopSearchOrigin = game.state.leader.position.worldPosition;
        var nearestShopCandidate = null;
        var shopBestDistanceSquared = 0;
        var shopScanIndex = 0;
        for (; shopScanIndex < shops.shopList.length; shopScanIndex++) {
          var scannedShop = shops.shopList[shopScanIndex];
          var shopDistanceSquared = distanceSquaredToPoint(shopSearchOrigin, game.world.tileToPixelX(scannedShop.worldColumn), game.world.tileToPixelY(scannedShop.worldRow));
          if (!nearestShopCandidate || shopDistanceSquared < shopBestDistanceSquared) {
            nearestShopCandidate = scannedShop;
            shopBestDistanceSquared = shopDistanceSquared;
          }
        }
        this.targetShop = nearestShopCandidate;
        shopTargetChosen = true;
      }
      var castleAttackChosen = false;
      if (this.targetShop) {
        this.activeCastle = null;
      } else if (this.activeCastle) {
        if (!this.activeCastle.dungeonsConquered) {
          this.activeCastle = null;
        }
      } else if (this.targetCastle.attackScheduled && !this.targetCastle.conquered) {
        this.activeCastle = this.targetCastle;
        castleAttackChosen = true;
      } else {
        var scheduledCastleCollection = game.castles;
        var leaderWorldPositionForScheduled = game.state.leader.position.worldPosition;
        var nearestScheduledCastle = null;
        var scheduledCastleBestDistance = 0;
        var scheduledCastleIndex = 0;
        for (; scheduledCastleIndex < scheduledCastleCollection.scheduledCastles.length; scheduledCastleIndex++) {
          var scannedScheduledCastle = scheduledCastleCollection.scheduledCastles[scheduledCastleIndex];
          var scheduledCastleDistanceSquared = distanceSquaredToPoint(leaderWorldPositionForScheduled, game.world.tileToPixelX(scannedScheduledCastle.worldPixelX), game.world.tileToPixelY(scannedScheduledCastle.worldPixelY));
          if (!nearestScheduledCastle || scheduledCastleDistanceSquared < scheduledCastleBestDistance) {
            nearestScheduledCastle = scannedScheduledCastle;
            scheduledCastleBestDistance = scheduledCastleDistanceSquared;
          }
        }
        var scheduledCastleChosen = nearestScheduledCastle;
        if (scheduledCastleChosen) {
          this.targetCastle = this.activeCastle = scheduledCastleChosen;
          castleAttackChosen = true;
        }
      }
      if (this.targetShop || this.activeCastle) {
        this.targetDungeon = null;
        var dungeonTargetFound = false;
      } else {
        var dungeonTargetChosen = false;
        if (this.targetDungeon) {
          if (this.targetDungeon.isFarm) {
            this.targetDungeon = null;
          } else {
            if (this.targetDungeon.cleared) {
              this.targetDungeon = null;
            }
          }
        }
        if (!this.targetDungeon) {
          var dungeonSearchOrigin = game.state.leader.position.worldPosition;
          var nearestCastleDungeon = null;
          var castleDungeonBestDistance = 0;
          const castleDungeons = this.targetCastle.dungeonList;
          var dungeonIndex;
          for (dungeonIndex = 0; dungeonIndex < castleDungeons.length; dungeonIndex++) {
            var scannedCastleDungeon = castleDungeons[dungeonIndex];
            if (!scannedCastleDungeon.conquered) {
              var castleDungeonDistanceSquared = distanceSquaredToPoint(dungeonSearchOrigin, scannedCastleDungeon.getPixelX(), scannedCastleDungeon.getPixelY());
              if (!nearestCastleDungeon || castleDungeonDistanceSquared < castleDungeonBestDistance) {
                nearestCastleDungeon = scannedCastleDungeon;
                castleDungeonBestDistance = castleDungeonDistanceSquared;
              }
            }
          }
          this.targetDungeon = nearestCastleDungeon;
          if (!this.targetDungeon) {
            var farmableDungeons = game.dungeons;
            var farmableDungeon = null;
            var farmableDungeonBestDistance = 0;
            dungeonIndex = 0;
            for (; dungeonIndex < farmableDungeons.dungeonList.length; dungeonIndex++) {
              var scannedDungeon = farmableDungeons.dungeonList[dungeonIndex];
              if (!(scannedDungeon.isFarm || scannedDungeon.region.regionLocked || scannedDungeon.conquered)) {
                var farmableDungeonDistanceSquared = distanceSquaredToPoint(dungeonSearchOrigin, scannedDungeon.getPixelX(), scannedDungeon.getPixelY());
                if (!farmableDungeon || farmableDungeonDistanceSquared < farmableDungeonBestDistance) {
                  farmableDungeon = scannedDungeon;
                  farmableDungeonBestDistance = farmableDungeonDistanceSquared;
                }
              }
            }
            this.targetDungeon = farmableDungeon;
            if (!this.targetDungeon) {
              var unlockedDungeons = game.dungeons;
              var unlockedDungeon = null;
              var unlockedDungeonBestDistance = 0;
              dungeonIndex = 0;
              for (; dungeonIndex < unlockedDungeons.dungeonList.length; dungeonIndex++) {
                var unlockedDungeonScan = unlockedDungeons.dungeonList[dungeonIndex];
                if (!(unlockedDungeonScan.isFarm || unlockedDungeonScan.region.regionLocked || unlockedDungeonScan.discovered && (!unlockedDungeonScan.discovered || unlockedDungeonScan.cleared))) {
                  var unlockedDungeonDistanceSquared = distanceSquaredToPoint(dungeonSearchOrigin, unlockedDungeonScan.getPixelX(), unlockedDungeonScan.getPixelY());
                  if (!unlockedDungeon || unlockedDungeonDistanceSquared < unlockedDungeonBestDistance) {
                    unlockedDungeon = unlockedDungeonScan;
                    unlockedDungeonBestDistance = unlockedDungeonDistanceSquared;
                  }
                }
              }
              this.targetDungeon = unlockedDungeon;
              if (!this.targetDungeon) {
                var allDungeons = game.dungeons;
                var allDungeonCandidate = null;
                var allDungeonBestDistance = 0;
                dungeonIndex = 0;
                for (; dungeonIndex < allDungeons.dungeonList.length; dungeonIndex++) {
                  var openDungeonScan = allDungeons.dungeonList[dungeonIndex];
                  if (!openDungeonScan.isFarm && !openDungeonScan.region.regionLocked) {
                    var openDungeonDistanceSquared = distanceSquaredToPoint(dungeonSearchOrigin, openDungeonScan.getPixelX(), openDungeonScan.getPixelY());
                    if (!allDungeonCandidate || openDungeonDistanceSquared < allDungeonBestDistance) {
                      allDungeonCandidate = openDungeonScan;
                      allDungeonBestDistance = openDungeonDistanceSquared;
                    }
                  }
                }
                this.targetDungeon = allDungeonCandidate;
              }
            }
          }
          if (this.targetDungeon) {
            dungeonTargetChosen = true;
          }
        }
        dungeonTargetFound = dungeonTargetChosen;
      }
      if (this.targetShop) {
        var destinationColumn = this.targetShop.worldColumn;
        var destinationRow = this.targetShop.worldRow;
      } else if (this.activeCastle) {
        destinationColumn = this.activeCastle.worldPixelX;
        destinationRow = this.activeCastle.worldPixelY;
      } else if (this.targetDungeon) {
        destinationColumn = this.targetDungeon.getWorldColumn();
        destinationRow = this.targetDungeon.getWorldRow();
      } else {
        return;
      }
      if (shopTargetChosen || dungeonTargetFound || castleAttackChosen) {
        if (game.world.getTileAtPixel(destinationColumn, destinationRow)) {
          calculateWorldCosts(this.worldPathfinder, destinationColumn, destinationRow, game.world);
          this.destinationOffWorld = false;
        } else {
          this.destinationOffWorld = true;
          this.worldDestColumn = findNearestWorldColumn(destinationColumn);
          this.worldDestRow = findNearestWorldRow(destinationRow);
          calculateWorldCosts(this.worldPathfinder, this.worldDestColumn, this.worldDestRow, game.world);
        }
      } else {
        var offWorldDestination = this.destinationOffWorld;
        if (offWorldDestination) {
          var leaderPosition = game.state.leader.position;
          var destColumnDelta = this.worldDestColumn - game.world.pixelToTileColumn(leaderPosition.getWorldPositionX());
          var destRowDelta = this.worldDestRow - game.world.pixelToTileRow(leaderPosition.getWorldPositionY());
          var withinRecalcRange = 8 > Math.sqrt(destColumnDelta * destColumnDelta + destRowDelta * destRowDelta);
        }
        if (withinRecalcRange) {
          if (game.world.getTileAtPixel(destinationColumn, destinationRow)) {
            calculateWorldCosts(this.worldPathfinder, destinationColumn, destinationRow, game.world);
            this.destinationOffWorld = false;
          } else {
            this.worldDestColumn = findNearestWorldColumn(destinationColumn);
            this.worldDestRow = findNearestWorldRow(destinationRow);
            calculateWorldCosts(this.worldPathfinder, this.worldDestColumn, this.worldDestRow, game.world);
          }
        }
      }
    }
  };
  PartyState.prototype.updateDungeonMode = function () {
    a: {
      var allyIndex,
        allies = getAllies(),
        disabledAlly;
      for (allyIndex = 0; allyIndex < allies.length; allyIndex++) {
        if (disabledAlly = allies[allyIndex], disabledAlly.position.room && disabledAlly.effects.isDisabled) {
          this.travellingToDisabledAlly = true;
          setPartyDestination(this, disabledAlly.position.room);
          break a;
        }
      }
      this.travellingToDisabledAlly = false;
    }
    if (!isPartyTravelling(this)) {
      if (this.targetTreasureChest) {
        this.destinationRoom = this.targetTreasureChest.room;
        this.targetDoor = this.targetRoom = null;
      } else if (!this.targetRoom && (!this.targetDoor || this.targetDoor.isOpen)) {
        if (this.destinationRoom) {
          var destinationRoomDiscovered = this.destinationRoom.discovered;
          if (destinationRoomDiscovered) {
            var destinationRoomMonsters = getMonsters();
            var noMonstersInDestination = 0 === destinationRoomMonsters.length ? true : this.destinationRoom !== destinationRoomMonsters[0].position.room;
          }
          if (noMonstersInDestination) {
            this.destinationRoom = null;
          } else {
            return;
          }
        }
        (/** @type {any} */ (this)).setTargetDoor(findNextUnopenedDoor());
        this.destinationRoom = this.targetDoor ? this.targetDoor ? this.targetDoor.leadsTo : null : (this.targetRoom = game.level.exitDoor) ? this.targetRoom.leadsTo : null;
      }
    }
  };
}
