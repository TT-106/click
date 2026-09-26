// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
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
  this.ed = this.Bc = this.Cc = this.Ue = this.Wf = this.Lf = this.ge = this.Wb = null;
  this.Ks = false;
  this.gn = null;
  this.Mp = false;
  this.Ht = new WorldPathfinder();
  this.hp = false;
  this.Om = this.Nm = 0;
}
export function forcePartyDestination(a) {
  var b = game.state.party;
  setPartyDestination(b, a);
  b.Ks = true;
}
export function setPartyDestination(a, b) {
  a.gn = b;
  if (a.gn) {
    a.Cc = a.gn;
    a.ed = null;
    a.Bc = null;
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
    n = game.level.gd,
    p = 1E5;
  if (b = a.position.cd) {
    if (!b.af.isOpen) {
      return b.af;
    }
    if (!b.Be.isOpen) {
      return b.Be;
    }
  }
  if (d = a.position.room) {
    b = d.Nc;
    for (c = 0; c < b.length; c++) {
      d = b[c];
      if (!d.isOpen) {
        if (g) {
          f = distanceSquaredToPoint(h, d.me, d.ne);
          if (f < p) {
            g = d;
            p = f;
          }
        } else {
          g = d;
          p = distanceSquaredToPoint(h, d.me, d.ne);
        }
      }
    }
    if (g) {
      return g;
    }
  }
  for (a = 0; a < l.length; a++) {
    if (d = l[a], d.Xi) {
      for (b = d.Nc, c = 0; c < b.length; c++) {
        d = b[c];
        if (!d.isOpen) {
          if (g) {
            f = distanceSquaredToPoint(h, d.me, d.ne);
            if (f < p) {
              g = d;
              p = f;
            }
          } else {
            g = d;
            p = distanceSquaredToPoint(h, d.me, d.ne);
          }
        }
      }
    }
  }
  for (a = 0; a < n.length; a++) {
    b = n[a];
    if (b.Km) {
      d = b.af;
      if (!d.isOpen) {
        if (g) {
          f = distanceSquaredToPoint(h, d.me, d.ne);
          if (f < p) {
            g = d;
            p = f;
          }
        } else {
          g = d;
          p = distanceSquaredToPoint(h, d.me, d.ne);
        }
      }
      d = b.Be;
      if (!d.isOpen) {
        if (g) {
          f = distanceSquaredToPoint(h, d.me, d.ne);
          if (f < p) {
            g = d;
            p = f;
          }
        } else {
          g = d;
          p = distanceSquaredToPoint(h, d.me, d.ne);
        }
      }
    }
  }
  return g;
}
export function initializeCharactersParty() {
  PartyState.prototype.hq = function (a) {
    this.Ue = a;
  };
  PartyState.prototype.iw = function () {
    this.Ue = this.ed = this.Bc = this.Cc = null;
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
        b.cd = null;
        b.room = null;
        d.actionType = IDLE_ACTION;
      }
      clearItemDrops();
      a.ye = false;
      invalidateCastleRevision();
      a.conquered = true;
      b = [];
      var g;
      for (d = 0; d < a.ck.length; d++) {
        f = a.ck[d];
        c = f.Hd;
        f = f.Id;
        if ((g = findCastleByRegion(c - 1 + "_" + f)) && g !== a && g.$b && 0 > b.indexOf(g)) {
          b.push(g);
        }
        if ((g = findCastleByRegion(c + 1 + "_" + f)) && g !== a && g.$b && 0 > b.indexOf(g)) {
          b.push(g);
        }
        if ((g = findCastleByRegion(c + "_" + (f - 1))) && g !== a && g.$b && 0 > b.indexOf(g)) {
          b.push(g);
        }
        if ((g = findCastleByRegion(c + "_" + (f + 1))) && g !== a && g.$b && 0 > b.indexOf(g)) {
          b.push(g);
        }
      }
      for (c = 0; c < b.length; c++) {
        b[c].$b = false;
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
      for (b = c = 0; b < a.pd.length; b++) {
        if (!a.pd[b].conquered) {
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
        c = game.state.runStatistics.Xj;
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
    this.Bc = a;
  };
  PartyState.prototype.rB = function (a) {
    this.ed = a;
  };
  PartyState.prototype.ou = function () {
    if (this.Wf && this.Wf.conquered) {
      this.Wf = null;
    }
    if (!this.Wf) {
      var a = game.castles,
        b = game.state.leader.position.worldPosition,
        c = null,
        d = 0,
        f,
        g,
        h;
      for (h = 0; h < a.pd.length; h++) {
        if (f = a.pd[h], !f.$b && !f.conquered && (g = distanceSquaredToPoint(b, game.world.dc(f.dm), game.world.ec(f.em)), !c || g < d)) {
          c = f;
          d = g;
        }
      }
      this.Wf = c;
    }
    if (this.Wf) {
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
            if ((l = (/** @type {any} */ (d)).ef(h.slot)) && !isBetterItem(h, l)) {
              n++;
            }
          }
          d = n;
        }
        c += d;
      }
      b = c;
      if (this.Lf) {
        if (0 === b) {
          this.Lf = null;
        }
      } else if (0 < b) {
        a = game.shops;
        b = game.state.leader.position.worldPosition;
        c = null;
        for (h = d = 0; h < a.ht.length; h++) {
          if (f = a.ht[h], g = distanceSquaredToPoint(b, game.world.dc(f.iq), game.world.ec(f.jq)), !c || g < d) {
            c = f;
            d = g;
          }
        }
        this.Lf = c;
        a = true;
      }
      if (this.Lf) {
        this.ge = null;
        b = false;
      } else if (b = false, this.ge) {
        if (!this.ge.Bj) {
          this.ge = null;
        }
      } else if (this.Wf.ye && !this.Wf.conquered) {
        this.ge = this.Wf;
        b = true;
      } else {
        c = game.castles;
        d = game.state.leader.position.worldPosition;
        f = null;
        for (n = g = 0; n < c.Dh.length; n++) {
          if (h = c.Dh[n], l = distanceSquaredToPoint(d, game.world.dc(h.dm), game.world.ec(h.em)), !f || l < g) {
            f = h;
            g = l;
          }
        }
        if (c = f) {
          this.Wf = this.ge = c;
          b = true;
        }
      }
      if (this.Lf || this.ge) {
        this.Wb = null;
        f = false;
      } else {
        c = false;
        if (this.Wb) {
          if (this.Wb.isFarm) {
            this.Wb = null;
          } else {
            if (this.Wb.cleared) {
              this.Wb = null;
            }
          }
        }
        if (!this.Wb) {
          d = game.state.leader.position.worldPosition;
          f = null;
          g = 0;
          var n = /** @type {any} */ (this.Wf.dungeonList),
            p;
          for (p = 0; p < n.length; p++) {
            if (h = n[p], !h.conquered && (l = distanceSquaredToPoint(d, h.dc(), h.ec()), !f || l < g)) {
              f = h;
              g = l;
            }
          }
          this.Wb = f;
          if (!this.Wb) {
            f = game.dungeons;
            g = null;
            for (p = h = 0; p < f.dungeonList.length; p++) {
              if (!(l = f.dungeonList[p], l.isFarm || l.zj.$b || l.conquered || (n = distanceSquaredToPoint(d, l.dc(), l.ec()), g && !(n < h)))) {
                g = l;
                h = n;
              }
            }
            this.Wb = g;
            if (!this.Wb) {
              f = game.dungeons;
              g = null;
              for (p = h = 0; p < f.dungeonList.length; p++) {
                if (!(l = f.dungeonList[p], l.isFarm || l.zj.$b || l.discovered && (!l.discovered || l.cleared) || (n = distanceSquaredToPoint(d, l.dc(), l.ec()), g && !(n < h)))) {
                  g = l;
                  h = n;
                }
              }
              this.Wb = g;
              if (!this.Wb) {
                f = game.dungeons;
                g = null;
                for (p = h = 0; p < f.dungeonList.length; p++) {
                  if (l = f.dungeonList[p], !l.isFarm && !l.zj.$b && (n = distanceSquaredToPoint(d, l.dc(), l.ec()), !g || n < h)) {
                    g = l;
                    h = n;
                  }
                }
                this.Wb = g;
              }
            }
          }
          if (this.Wb) {
            c = true;
          }
        }
        f = c;
      }
      if (this.Lf) {
        c = this.Lf.iq;
        d = this.Lf.jq;
      } else if (this.ge) {
        c = this.ge.dm;
        d = this.ge.em;
      } else if (this.Wb) {
        c = this.Wb.bc();
        d = this.Wb.getWorldRow();
      } else {
        return;
      }
      if (a || f || b) {
        if (game.world.getTileAtPixel(c, d)) {
          calculateWorldCosts(this.Ht, c, d);
          this.hp = false;
        } else {
          this.hp = true;
          this.Nm = findNearestWorldColumn(c);
          this.Om = findNearestWorldRow(d);
          calculateWorldCosts(this.Ht, this.Nm, this.Om);
        }
      } else {
        if (a = this.hp) {
          b = game.state.leader.position;
          a = this.Nm - game.world.bc(b.dc());
          b = this.Om - game.world.pixelToTileRow(b.ec());
          a = 8 > Math.sqrt(a * a + b * b);
        }
        if (a) {
          if (game.world.getTileAtPixel(c, d)) {
            calculateWorldCosts(this.Ht, c, d);
            this.hp = false;
          } else {
            this.Nm = findNearestWorldColumn(c);
            this.Om = findNearestWorldRow(d);
            calculateWorldCosts(this.Ht, this.Nm, this.Om);
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
        if (c = b[a], c.position.room && c.effects.Kd) {
          this.Mp = true;
          setPartyDestination(this, c.position.room);
          break a;
        }
      }
      this.Mp = false;
    }
    if (!isPartyTravelling(this)) {
      if (this.Ue) {
        this.Cc = this.Ue.Nn;
        this.Bc = this.ed = null;
      } else if (!this.ed && (!this.Bc || this.Bc.isOpen)) {
        if (this.Cc) {
          if (a = this.Cc.Xi) {
            a = getMonsters();
            a = 0 === a.length ? true : this.Cc !== a[0].position.room;
          }
          if (a) {
            this.Cc = null;
          } else {
            return;
          }
        }
        (/** @type {any} */ (this)).et(findNextUnopenedDoor());
        this.Cc = this.Bc ? this.Bc ? this.Bc.$d : null : (this.ed = game.level.tf) ? this.ed.$d : null;
      }
    }
  };
}
