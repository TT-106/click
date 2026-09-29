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
export function calculatePartyMinLevel(a) {
  a = getPartyMaxLevel(a);
  var adventurerLevel, adventurerIndex;
  for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
    adventurerLevel = game.state.adventurers[adventurerIndex].stats.characterLevel;
    if (a > adventurerLevel) {
      a = adventurerLevel;
    }
  }
  return a;
}
export function findNextUnopenedDoor() {
  var leader = game.state.leader,
    currentHallway,
    doorIndex,
    d,
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
  if (d = leader.position.room) {
    var doorList = d.doorList;
    for (doorIndex = 0; doorIndex < doorList.length; doorIndex++) {
      d = doorList[doorIndex];
      if (!d.isOpen) {
        if (nearestUnopenedDoor) {
          doorDistance = distanceSquaredToPoint(leaderLevelPosition, d.pixelColumn, d.pixelRow);
          if (doorDistance < bestDistanceSquared) {
            nearestUnopenedDoor = d;
            bestDistanceSquared = doorDistance;
          }
        } else {
          nearestUnopenedDoor = d;
          bestDistanceSquared = distanceSquaredToPoint(leaderLevelPosition, d.pixelColumn, d.pixelRow);
        }
      }
    }
    if (nearestUnopenedDoor) {
      return nearestUnopenedDoor;
    }
  }
  for (var roomIndex = 0; roomIndex < roomList.length; roomIndex++) {
    if (d = roomList[roomIndex], d.discovered) {
      for (doorList = d.doorList, doorIndex = 0; doorIndex < doorList.length; doorIndex++) {
        d = doorList[doorIndex];
        if (!d.isOpen) {
          if (nearestUnopenedDoor) {
            doorDistance = distanceSquaredToPoint(leaderLevelPosition, d.pixelColumn, d.pixelRow);
            if (doorDistance < bestDistanceSquared) {
              nearestUnopenedDoor = d;
              bestDistanceSquared = doorDistance;
            }
          } else {
            nearestUnopenedDoor = d;
            bestDistanceSquared = distanceSquaredToPoint(leaderLevelPosition, d.pixelColumn, d.pixelRow);
          }
        }
      }
    }
  }
  for (var hallwayIndex = 0; hallwayIndex < hallwayList.length; hallwayIndex++) {
    var hallway = hallwayList[hallwayIndex];
    if (hallway.discovered) {
      d = hallway.doorA;
      if (!d.isOpen) {
        if (nearestUnopenedDoor) {
          doorDistance = distanceSquaredToPoint(leaderLevelPosition, d.pixelColumn, d.pixelRow);
          if (doorDistance < bestDistanceSquared) {
            nearestUnopenedDoor = d;
            bestDistanceSquared = doorDistance;
          }
        } else {
          nearestUnopenedDoor = d;
          bestDistanceSquared = distanceSquaredToPoint(leaderLevelPosition, d.pixelColumn, d.pixelRow);
        }
      }
      d = hallway.doorB;
      if (!d.isOpen) {
        if (nearestUnopenedDoor) {
          doorDistance = distanceSquaredToPoint(leaderLevelPosition, d.pixelColumn, d.pixelRow);
          if (doorDistance < bestDistanceSquared) {
            nearestUnopenedDoor = d;
            bestDistanceSquared = doorDistance;
          }
        } else {
          nearestUnopenedDoor = d;
          bestDistanceSquared = distanceSquaredToPoint(leaderLevelPosition, d.pixelColumn, d.pixelRow);
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
      var a = game.currentCastle;
      game.currentCastle = null;
      game.worldActive = true;
      var b,
        c = getAllies(),
        d,
        f;
      for (f = 0; f < c.length; f++) {
        d = c[f];
        b = d.position;
        clearMovementTarget(b);
        b.currentHallway = null;
        b.room = null;
        d.actionType = IDLE_ACTION;
      }
      clearItemDrops(game.itemDrops);
      a.attackScheduled = false;
      invalidateCastleRevision();
      a.conquered = true;
      b = [];
      var adjacentLockedCastle;
      for (d = 0; d < a.regions.length; d++) {
        f = a.regions[d];
        c = f.regionColumn;
        f = f.regionRow;
        if ((adjacentLockedCastle = findCastleByRegion(c - 1 + "_" + f)) && adjacentLockedCastle !== a && adjacentLockedCastle.regionLocked && 0 > b.indexOf(adjacentLockedCastle)) {
          b.push(adjacentLockedCastle);
        }
        if ((adjacentLockedCastle = findCastleByRegion(c + 1 + "_" + f)) && adjacentLockedCastle !== a && adjacentLockedCastle.regionLocked && 0 > b.indexOf(adjacentLockedCastle)) {
          b.push(adjacentLockedCastle);
        }
        if ((adjacentLockedCastle = findCastleByRegion(c + "_" + (f - 1))) && adjacentLockedCastle !== a && adjacentLockedCastle.regionLocked && 0 > b.indexOf(adjacentLockedCastle)) {
          b.push(adjacentLockedCastle);
        }
        if ((adjacentLockedCastle = findCastleByRegion(c + "_" + (f + 1))) && adjacentLockedCastle !== a && adjacentLockedCastle.regionLocked && 0 > b.indexOf(adjacentLockedCastle)) {
          b.push(adjacentLockedCastle);
        }
      }
      for (c = 0; c < b.length; c++) {
        b[c].regionLocked = false;
      }
      invalidateCastleRevision();
      refreshWorldBlocks(game.world);
      recordGameEvent("Castle", "已清空:" + a.castleName);
      game.state.statisticsRecorder.recordCastleConquered();
      refreshAttackableCastles(a);
      refreshScheduledCastles(a);
      awardAdventurePoints(19);
      if (a = a.dungeonList) {
        for (c = 0; c < a.length; c++) {
          refreshFarmableDungeons(game.dungeons, a[c]);
        }
      }
      a = game.castles;
      for (b = c = 0; b < a.castleList.length; b++) {
        if (!a.castleList[b].conquered) {
          c++;
        }
      }
      if (0 === c) {
        game.state.victoryCount++;
        game.gameWon = true;
        game.finishOfflineProgress();
        saveProgress(game.saves);
        game.view.onGameWon();
        a = game.state.victoryStatistics;
        b = game.state.adventurers.length;
        if (4 > b) {
          if (1 === b) {
            a.partySize1Victories += 1;
            c = game.state.adventurers[0].characterClass;
            if (!(d = a.soloClassVictories[c])) {
              d = 0;
            }
            a.soloClassVictories[c] = d + 1;
          } else {
            if (2 === b) {
              a.partySize2Victories += 1;
            } else {
              if (3 === b) {
                a.partySize3Victories += 1;
              }
            }
          }
        }
        for (c = 0; c < b; c++) {
          d = game.state.adventurers[c].characterClass;
          if (!(f = a.classVictories[d])) {
            f = 0;
          }
          a.classVictories[d] = f + 1;
        }
        c = a.currentContinueCount;
        if (0 < c) {
          if (c > a.maxContinuationVictories) {
            a.maxContinuationVictories = c;
          }
          a.currentContinuationVictories = c;
        }
        if (4 <= b) {
          d = true;
          f = game.state.adventurers[0].characterClass;
          for (c = 1; c < b; c++) {
            if (f != game.state.adventurers[c].characterClass) {
              d = false;
              break;
            }
          }
          if (d) {
            a.singleClassVictories += 1;
          }
        }
        c = game.state.runStatistics.playedMillis;
        a = floorNumber(c / 36E5);
        b = floorNumber(c / 6E4 % 60);
        c = floorNumber(c / 1E3 % 60);
        b = "Time: " + ((10 > a ? "0" : "") + a + ":" + (10 > b ? "0" : "") + b + ":" + (10 > c ? "0" : "") + c) + ",胜利:" + game.state.victoryCount;
        for (a = 0; a < game.state.adventurers.length; a++) {
          b += ", " + game.state.adventurers[a].classDefinition.className + " (" + game.state.adventurers[a].stats.characterLevel + ")";
        }
        recordGameEvent("Victory", b);
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
      var a = game.castles,
        b = game.state.leader.position.worldPosition,
        c = null,
        d = 0,
        f,
        g,
        h;
      for (h = 0; h < a.castleList.length; h++) {
        if (f = a.castleList[h], !f.regionLocked && !f.conquered && (g = distanceSquaredToPoint(b, game.world.tileToPixelX(f.worldPixelX), game.world.tileToPixelY(f.worldPixelY)), !c || g < d)) {
          c = f;
          d = g;
        }
      }
      this.targetCastle = c;
    }
    if (this.targetCastle) {
      a = false;
      for (b = c = 0; b < game.state.adventurers.length; b++) {
        d = game.state.adventurers[b];
        f = (/** @type {any} */ (d)).inventory.items;
        if (0 === f.length) {
          d = 0;
        } else {
          var l = h = g = undefined,
            n = 0;
          for (g = 0; g < f.length; g++) {
            h = f[g];
            if ((l = (/** @type {any} */ (d)).getSlotItem(h.slot)) && !isBetterItem(h, l)) {
              n++;
            }
          }
          d = n;
        }
        c += d;
      }
      b = c;
      if (this.targetShop) {
        if (0 === b) {
          this.targetShop = null;
        }
      } else if (0 < b) {
        a = game.shops;
        b = game.state.leader.position.worldPosition;
        c = null;
        for (h = d = 0; h < a.shopList.length; h++) {
          if (f = a.shopList[h], g = distanceSquaredToPoint(b, game.world.tileToPixelX(f.worldColumn), game.world.tileToPixelY(f.worldRow)), !c || g < d) {
            c = f;
            d = g;
          }
        }
        this.targetShop = c;
        a = true;
      }
      if (this.targetShop) {
        this.activeCastle = null;
        b = false;
      } else if (b = false, this.activeCastle) {
        if (!this.activeCastle.dungeonsConquered) {
          this.activeCastle = null;
        }
      } else if (this.targetCastle.attackScheduled && !this.targetCastle.conquered) {
        this.activeCastle = this.targetCastle;
        b = true;
      } else {
        c = game.castles;
        d = game.state.leader.position.worldPosition;
        f = null;
        for (n = g = 0; n < c.scheduledCastles.length; n++) {
          if (h = c.scheduledCastles[n], l = distanceSquaredToPoint(d, game.world.tileToPixelX(h.worldPixelX), game.world.tileToPixelY(h.worldPixelY)), !f || l < g) {
            f = h;
            g = l;
          }
        }
        if (c = f) {
          this.targetCastle = this.activeCastle = c;
          b = true;
        }
      }
      if (this.targetShop || this.activeCastle) {
        this.targetDungeon = null;
        f = false;
      } else {
        c = false;
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
          d = game.state.leader.position.worldPosition;
          f = null;
          g = 0;
          const castleDungeons = this.targetCastle.dungeonList;
          var dungeonIndex;
          for (dungeonIndex = 0; dungeonIndex < castleDungeons.length; dungeonIndex++) {
            if (h = castleDungeons[dungeonIndex], !h.conquered && (l = distanceSquaredToPoint(d, h.getPixelX(), h.getPixelY()), !f || l < g)) {
              f = h;
              g = l;
            }
          }
          this.targetDungeon = f;
          if (!this.targetDungeon) {
            f = game.dungeons;
            g = null;
            for (dungeonIndex = h = 0; dungeonIndex < f.dungeonList.length; dungeonIndex++) {
              if (!(l = f.dungeonList[dungeonIndex], l.isFarm || l.region.regionLocked || l.conquered || (n = distanceSquaredToPoint(d, l.getPixelX(), l.getPixelY()), g && !(n < h)))) {
                g = l;
                h = n;
              }
            }
            this.targetDungeon = g;
            if (!this.targetDungeon) {
              f = game.dungeons;
              g = null;
              for (dungeonIndex = h = 0; dungeonIndex < f.dungeonList.length; dungeonIndex++) {
                if (!(l = f.dungeonList[dungeonIndex], l.isFarm || l.region.regionLocked || l.discovered && (!l.discovered || l.cleared) || (n = distanceSquaredToPoint(d, l.getPixelX(), l.getPixelY()), g && !(n < h)))) {
                  g = l;
                  h = n;
                }
              }
              this.targetDungeon = g;
              if (!this.targetDungeon) {
                f = game.dungeons;
                g = null;
                for (dungeonIndex = h = 0; dungeonIndex < f.dungeonList.length; dungeonIndex++) {
                  if (l = f.dungeonList[dungeonIndex], !l.isFarm && !l.region.regionLocked && (n = distanceSquaredToPoint(d, l.getPixelX(), l.getPixelY()), !g || n < h)) {
                    g = l;
                    h = n;
                  }
                }
                this.targetDungeon = g;
              }
            }
          }
          if (this.targetDungeon) {
            c = true;
          }
        }
        f = c;
      }
      if (this.targetShop) {
        c = this.targetShop.worldColumn;
        d = this.targetShop.worldRow;
      } else if (this.activeCastle) {
        c = this.activeCastle.worldPixelX;
        d = this.activeCastle.worldPixelY;
      } else if (this.targetDungeon) {
        c = this.targetDungeon.getWorldColumn();
        d = this.targetDungeon.getWorldRow();
      } else {
        return;
      }
      if (a || f || b) {
        if (game.world.getTileAtPixel(c, d)) {
          calculateWorldCosts(this.worldPathfinder, c, d, game.world);
          this.destinationOffWorld = false;
        } else {
          this.destinationOffWorld = true;
          this.worldDestColumn = findNearestWorldColumn(c);
          this.worldDestRow = findNearestWorldRow(d);
          calculateWorldCosts(this.worldPathfinder, this.worldDestColumn, this.worldDestRow, game.world);
        }
      } else {
        if (a = this.destinationOffWorld) {
          b = game.state.leader.position;
          a = this.worldDestColumn - game.world.pixelToTileColumn(b.getWorldPositionX());
          b = this.worldDestRow - game.world.pixelToTileRow(b.getWorldPositionY());
          a = 8 > Math.sqrt(a * a + b * b);
        }
        if (a) {
          if (game.world.getTileAtPixel(c, d)) {
            calculateWorldCosts(this.worldPathfinder, c, d, game.world);
            this.destinationOffWorld = false;
          } else {
            this.worldDestColumn = findNearestWorldColumn(c);
            this.worldDestRow = findNearestWorldRow(d);
            calculateWorldCosts(this.worldPathfinder, this.worldDestColumn, this.worldDestRow, game.world);
          }
        }
      }
    }
  };
  PartyState.prototype.updateDungeonMode = function () {
    a: {
      var a,
        allies = getAllies(),
        disabledAlly;
      for (a = 0; a < allies.length; a++) {
        if (disabledAlly = allies[a], disabledAlly.position.room && disabledAlly.effects.isDisabled) {
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
          if (a = this.destinationRoom.discovered) {
            a = getMonsters();
            a = 0 === a.length ? true : this.destinationRoom !== a[0].position.room;
          }
          if (a) {
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
