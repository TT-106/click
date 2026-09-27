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
  this.zs = this.xs = -1;
  this.targetRoom = this.targetDoor = this.destinationRoom = this.targetTreasureChest = this.targetCastle = this.targetShop = this.activeCastle = this.targetDungeon = null;
  this.Ks = false;
  this.forcedDestinationRoom = null;
  this.Mp = false;
  this.Ht = new WorldPathfinder();
  this.hp = false;
  this.worldDestRow = this.worldDestColumn = 0;
}
export function forcePartyDestination(a) {
  var b = game.state.party;
  setPartyDestination(b, a);
  b.Ks = true;
}
export function setPartyDestination(a, b) {
  a.forcedDestinationRoom = b;
  if (a.forcedDestinationRoom) {
    a.destinationRoom = a.forcedDestinationRoom;
    a.targetRoom = null;
    a.targetDoor = null;
  }
}
export function isPartyTravelling(a) {
  return a.Mp || a.Ks;
}
export function addKills(a) {
  var b = game.state.party;
  b.kills += a;
}
export function spendKills(a, b) {
  a.kills -= b;
  if (0 > a.kills) {
    a.kills = 0;
  }
}
export function addExperience(a) {
  var b = game.state.party;
  b.experiencePoints += a;
}
export function addGold(a) {
  var b = game.state.party;
  b.gold += a;
}
export function spendGold(a) {
  var b = game.state.party;
  b.gold -= a;
  if (0 > b.gold) {
    b.gold = 0;
  }
}
export function getPartyMaxLevel(a) {
  if (0 > a.xs) {
    a.xs = calculatePartyMaxLevel();
  }
  return a.xs;
}
export function getPartyMinLevel() {
  var a = game.state.party;
  if (0 > a.zs) {
    a.zs = calculatePartyMinLevel(a);
  }
  return a.zs;
}
export function refreshPartyLevels() {
  var a = game.state.party;
  a.xs = calculatePartyMaxLevel();
  a.zs = calculatePartyMinLevel(a);
}
export function calculatePartyMaxLevel() {
  var a = -1,
    b,
    c;
  for (c = 0; c < game.state.adventurers.length; c++) {
    b = game.state.adventurers[c].stats.characterLevel;
    if (a < b) {
      a = b;
    }
  }
  return a;
}
export function calculatePartyMinLevel(a) {
  a = getPartyMaxLevel(a);
  var b, c;
  for (c = 0; c < game.state.adventurers.length; c++) {
    b = game.state.adventurers[c].stats.characterLevel;
    if (a > b) {
      a = b;
    }
  }
  return a;
}
export function findNextUnopenedDoor() {
  var a = game.state.leader,
    b,
    c,
    d,
    f,
    g = null,
    h = a.position.levelPosition,
    l = game.level.roomList,
    n = game.level.hallwayList,
    p = 1E5;
  if (b = a.position.currentHallway) {
    if (!b.doorA.isOpen) {
      return b.doorA;
    }
    if (!b.doorB.isOpen) {
      return b.doorB;
    }
  }
  if (d = a.position.room) {
    b = d.doorList;
    for (c = 0; c < b.length; c++) {
      d = b[c];
      if (!d.isOpen) {
        if (g) {
          f = distanceSquaredToPoint(h, d.pixelColumn, d.pixelRow);
          if (f < p) {
            g = d;
            p = f;
          }
        } else {
          g = d;
          p = distanceSquaredToPoint(h, d.pixelColumn, d.pixelRow);
        }
      }
    }
    if (g) {
      return g;
    }
  }
  for (a = 0; a < l.length; a++) {
    if (d = l[a], d.discovered) {
      for (b = d.doorList, c = 0; c < b.length; c++) {
        d = b[c];
        if (!d.isOpen) {
          if (g) {
            f = distanceSquaredToPoint(h, d.pixelColumn, d.pixelRow);
            if (f < p) {
              g = d;
              p = f;
            }
          } else {
            g = d;
            p = distanceSquaredToPoint(h, d.pixelColumn, d.pixelRow);
          }
        }
      }
    }
  }
  for (a = 0; a < n.length; a++) {
    b = n[a];
    if (b.Km) {
      d = b.doorA;
      if (!d.isOpen) {
        if (g) {
          f = distanceSquaredToPoint(h, d.pixelColumn, d.pixelRow);
          if (f < p) {
            g = d;
            p = f;
          }
        } else {
          g = d;
          p = distanceSquaredToPoint(h, d.pixelColumn, d.pixelRow);
        }
      }
      d = b.doorB;
      if (!d.isOpen) {
        if (g) {
          f = distanceSquaredToPoint(h, d.pixelColumn, d.pixelRow);
          if (f < p) {
            g = d;
            p = f;
          }
        } else {
          g = d;
          p = distanceSquaredToPoint(h, d.pixelColumn, d.pixelRow);
        }
      }
    }
  }
  return g;
}
export function initializeCharactersParty() {
  PartyState.prototype.setTargetTreasureChest = function (a) {
    this.targetTreasureChest = a;
  };
  PartyState.prototype.iw = function () {
    this.targetTreasureChest = this.targetRoom = this.targetDoor = this.destinationRoom = null;
    if (game.currentDungeon) {
      game.currentDungeon.iw();
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
      clearItemDrops();
      a.attackScheduled = false;
      invalidateCastleRevision();
      a.conquered = true;
      b = [];
      var g;
      for (d = 0; d < a.regions.length; d++) {
        f = a.regions[d];
        c = f.regionColumn;
        f = f.regionRow;
        if ((g = findCastleByRegion(c - 1 + "_" + f)) && g !== a && g.regionLocked && 0 > b.indexOf(g)) {
          b.push(g);
        }
        if ((g = findCastleByRegion(c + 1 + "_" + f)) && g !== a && g.regionLocked && 0 > b.indexOf(g)) {
          b.push(g);
        }
        if ((g = findCastleByRegion(c + "_" + (f - 1))) && g !== a && g.regionLocked && 0 > b.indexOf(g)) {
          b.push(g);
        }
        if ((g = findCastleByRegion(c + "_" + (f + 1))) && g !== a && g.regionLocked && 0 > b.indexOf(g)) {
          b.push(g);
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
            a.hn += 1;
            c = game.state.adventurers[0].characterClass;
            if (!(d = a.lq[c])) {
              d = 0;
            }
            a.lq[c] = d + 1;
          } else {
            if (2 === b) {
              a.jn += 1;
            } else {
              if (3 === b) {
                a.kn += 1;
              }
            }
          }
        }
        for (c = 0; c < b; c++) {
          d = game.state.adventurers[c].characterClass;
          if (!(f = a.qo[d])) {
            f = 0;
          }
          a.qo[d] = f + 1;
        }
        c = a.nm;
        if (0 < c) {
          if (c > a.Xm) {
            a.Xm = c;
          }
          a.mm = c;
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
            a.vn += 1;
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
  PartyState.prototype.et = function (a) {
    this.targetDoor = a;
  };
  PartyState.prototype.setTargetRoom = function (a) {
    this.targetRoom = a;
  };
  PartyState.prototype.ou = function () {
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
        for (h = d = 0; h < a.ht.length; h++) {
          if (f = a.ht[h], g = distanceSquaredToPoint(b, game.world.tileToPixelX(f.iq), game.world.tileToPixelY(f.jq)), !c || g < d) {
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
          var p;
          for (p = 0; p < castleDungeons.length; p++) {
            if (h = castleDungeons[p], !h.conquered && (l = distanceSquaredToPoint(d, h.getPixelX(), h.getPixelY()), !f || l < g)) {
              f = h;
              g = l;
            }
          }
          this.targetDungeon = f;
          if (!this.targetDungeon) {
            f = game.dungeons;
            g = null;
            for (p = h = 0; p < f.dungeonList.length; p++) {
              if (!(l = f.dungeonList[p], l.isFarm || l.region.regionLocked || l.conquered || (n = distanceSquaredToPoint(d, l.getPixelX(), l.getPixelY()), g && !(n < h)))) {
                g = l;
                h = n;
              }
            }
            this.targetDungeon = g;
            if (!this.targetDungeon) {
              f = game.dungeons;
              g = null;
              for (p = h = 0; p < f.dungeonList.length; p++) {
                if (!(l = f.dungeonList[p], l.isFarm || l.region.regionLocked || l.discovered && (!l.discovered || l.cleared) || (n = distanceSquaredToPoint(d, l.getPixelX(), l.getPixelY()), g && !(n < h)))) {
                  g = l;
                  h = n;
                }
              }
              this.targetDungeon = g;
              if (!this.targetDungeon) {
                f = game.dungeons;
                g = null;
                for (p = h = 0; p < f.dungeonList.length; p++) {
                  if (l = f.dungeonList[p], !l.isFarm && !l.region.regionLocked && (n = distanceSquaredToPoint(d, l.getPixelX(), l.getPixelY()), !g || n < h)) {
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
        c = this.targetShop.iq;
        d = this.targetShop.jq;
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
          calculateWorldCosts(this.Ht, c, d);
          this.hp = false;
        } else {
          this.hp = true;
          this.worldDestColumn = findNearestWorldColumn(c);
          this.worldDestRow = findNearestWorldRow(d);
          calculateWorldCosts(this.Ht, this.worldDestColumn, this.worldDestRow);
        }
      } else {
        if (a = this.hp) {
          b = game.state.leader.position;
          a = this.worldDestColumn - game.world.pixelToTileColumn(b.getWorldPositionX());
          b = this.worldDestRow - game.world.pixelToTileRow(b.getWorldPositionY());
          a = 8 > Math.sqrt(a * a + b * b);
        }
        if (a) {
          if (game.world.getTileAtPixel(c, d)) {
            calculateWorldCosts(this.Ht, c, d);
            this.hp = false;
          } else {
            this.worldDestColumn = findNearestWorldColumn(c);
            this.worldDestRow = findNearestWorldRow(d);
            calculateWorldCosts(this.Ht, this.worldDestColumn, this.worldDestRow);
          }
        }
      }
    }
  };
  PartyState.prototype.nu = function () {
    a: {
      var a,
        b = getAllies(),
        c;
      for (a = 0; a < b.length; a++) {
        if (c = b[a], c.position.room && c.effects.isDisabled) {
          this.Mp = true;
          setPartyDestination(this, c.position.room);
          break a;
        }
      }
      this.Mp = false;
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
        (/** @type {any} */ (this)).et(findNextUnopenedDoor());
        this.destinationRoom = this.targetDoor ? this.targetDoor ? this.targetDoor.leadsTo : null : (this.targetRoom = game.level.exitDoor) ? this.targetRoom.leadsTo : null;
      }
    }
  };
}
