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
  var a = game.saves;
  persistence.remove();
  a.lastSavedAt = nowMilliseconds();
  recordGameEvent("SaveManager", "Delete");
}
export function saveProgress(a) {
  var b = serializeGame(a);
  if (b) {
    persistence.write(b);
    a.lastSavedAt = nowMilliseconds();
  }
}
export function restoreGameState(a, b) {
  if (b) {
    var c = saveCodec.decompress(b);
    if (c) {
      var d = JSON.parse(c);
      if (d) {
        game.resetRun(true);
        game.initialized = d.gameInitialized;
        if (game.initialized) {
          game.worldActive = d.worldActive;
          game.partyCreated = d.partyCreated;
          game.gameWon = d.gameWon;
          var f = d.gameTimestamp;
          game.lastActiveAt = f ? f : Date.now();
          var g = d.turnNumber,
            h = d.frameNumber,
            l = d.victoryCount;
          game.state.turnNumber = g ? g : 0;
          game.state.frameNumber = h ? h : 0;
          game.state.victoryCount = l ? l : 0;
          var n = d.statistics,
            p = d.totalStatistics,
            s = d.world,
            u = s.worldCenterX,
            y = s.worldCenterY,
            A = s.blockShiftRow,
            C = game.world;
          C.blockOriginColumn = s.blockShiftCol;
          C.blockOriginRow = A;
          C.worldBlocks = createWorldBlocks(C);
          refreshWorldBlocks(C);
          C.worldCenterX = u;
          C.worldCenterY = y;
          C.hasPartyPlaced = true;
          var v = d.dungeonManagerState,
            D = v.farmedKills,
            N = v.dungeonCostLevel,
            I = v.dungeonStates;
          if (I) {
            game.dungeons.lt = false;
            var x;
            for (x = 0; x < I.length; x++) {
              var z = I[x];
              if (z) {
                var O = z.dungeonId,
                  J = z.discovered,
                  la = z.cleared,
                  Q = z.conquered,
                  V = z.clearedTurn,
                  na = z.dungeonFarm,
                  K = z.farmStartTurn,
                  H = z.dungeonFarmCost,
                  S = z.dungeonType,
                  da = z.levelCount;
                if (O) {
                  var W = game.dungeons.dungeonRegistry[O];
                  if (W) {
                    W.cleared = la ? true : false;
                    W.clearedTurn = V ? V : 0;
                    W.discovered = J ? true : false;
                    W.isFarm = na ? true : false;
                    W.tx(Q ? true : false);
                    W.farmStartTurn = K ? K : 0;
                    W.farmCost = H;
                    var ia = S ? S : 0;
                    W.dungeonType = ia;
                    W.hasSecondEntrance = !(4 === ia || 5 === ia || 7 === ia || 8 === ia);
                    W.mapSprite = getDungeonMapSprite(ia);
                    W.levelCount = da;
                    if (J) {
                      discoverDungeon(W);
                      if (na) {
                        registerDungeonFarm(W);
                      } else {
                        if (la) {
                          game.dungeons.Is(W);
                        }
                      }
                    }
                  } else {
                    console.log("Failed to load dungeon state for: " + O);
                  }
                }
              }
            }
            game.dungeons.lt = true;
            var ea = game.dungeons;
            if (ea.lt) {
              sortDungeons(ea, ea.discovered);
              sortDungeons(ea, ea.attackable);
              sortDungeons(ea, ea.cleared);
              sortDungeons(ea, ea.farms);
              sortDungeons(ea, ea.farmable);
            }
          }
          game.dungeons.setFarmedKills(D ? D : 0);
          game.dungeons.discoveredDungeonCount = N ? N : 0;
          var va = d.currentDungeon;
          if (va) {
            var yb = va.dungeonId,
              Fb = va.currentLevelIndex,
              pa = game.dungeons.dungeonRegistry[yb];
            if (pa) {
              pa.currentLevelIndex = Fb;
              game.currentDungeon = pa;
            } else {
              console.log("Failed to lookup dungeon by id: " + yb);
              game.currentDungeon = null;
            }
          } else {
            game.currentDungeon = null;
          }
          var T = d.castleManager;
          if (T) {
            var X = T.castleStates;
            game.castles.nextRequiredMonsterLevel = T.nextRequiredMonsterLevel;
            var Ca;
            for (Ca = 0; Ca < X.length; Ca++) {
              var qa = X[Ca];
              if (qa) {
                var ta = qa.castleId,
                  eb = qa.conquered,
                  Gb = qa.dungeonsConquered,
                  Da = qa.castleRegionLocked,
                  ub = qa.attackScheduled,
                  mb = qa.requiredMonsterLevel;
                if (ta) {
                  var Ea = game.castles.castleRegistry[ta];
                  if (Ea) {
                    Ea.tx(eb ? true : false);
                    Ea.dungeonsConquered = Gb ? true : false;
                    Ea.regionLocked = Da ? true : false;
                    Ea.attackScheduled = ub ? true : false;
                    invalidateCastleRevision();
                    Ea.requiredMonsterLevel = mb ? mb : 0;
                  } else {
                    console.log("Failed to load castle state for: " + ta);
                  }
                }
              }
            }
            var La = game.castles,
              wa,
              Fa;
            for (wa = 0; wa < La.castleList.length; wa++) {
              Fa = La.castleList[wa];
              if (canAttackCastle(Fa)) {
                La.attackableCastles.push(Fa);
              }
              if (Fa.attackScheduled && !Fa.conquered) {
                La.scheduledCastles.push(Fa);
              }
              refreshCastleConquest(Fa);
            }
            sortCastles(La, La.scheduledCastles);
            sortCastles(La, La.attackableCastles);
            var ha = game.dungeons,
              ja;
            for (ja = 0; ja < ha.dungeonList.length; ja++) {
              refreshFarmableDungeons(ha, ha.dungeonList[ja]);
            }
          }
          var Ga = d.currentCastle;
          if (Ga) {
            var bb = Ga.castleId,
              za = game.castles.castleRegistry[bb];
            if (za) {
              game.currentCastle = za;
            } else {
              console.log("Failed to lookup castle by id: " + bb);
              game.currentCastle = null;
            }
          } else {
            game.currentCastle = null;
          }
          var nb = d.shopManager,
            fb = 0;
          if (nb) {
            fb = nb.collectedGold;
          }
          game.shops.collectedGold = fb ? fb : 0;
          var cb = d.farms;
          if (cb) {
            var Ua;
            for (Ua = 0; Ua < cb.length; Ua++) {
              var Va = cb[Ua];
              if (Va) {
                var mc = Va.dungeonId,
                  vb = Va.farmCol,
                  Sb = Va.farmRow;
                if (mc) {
                  registerFarm(game.farms, new Farm(mc, vb, Sb));
                }
              }
            }
          }
          var Ma = d.level;
          if (Ma && !game.worldActive) {
            var zb, Hb;
            if (game.currentDungeon) {
              zb = game.currentDungeon.dungeonType;
              Hb = game.currentDungeon.hasSecondEntrance;
            } else {
              zb = 11;
              Hb = false;
            }
            var ac = Ma.levelCenterX,
              ob = Ma.levelCenterY,
              pb = Ma.roomVisibility,
              Ha = Ma.hallways;
            generateDungeonLevel(Ma.levelSeed, zb, Hb, false);
            var jb = game.level;
            jb.centerX = ac;
            jb.centerY = ob;
            var Ab,
              Bb = game.level.hallwayList;
            if (Bb.length !== Ha.length) {
              console.log("hallway array length mismatch. state=" + Ha.length + " hallways=" + Bb.length);
            } else {
              for (Ab = 0; Ab < Ha.length; Ab++) {
                var qb = Bb[Ab],
                  wb = Ha[Ab],
                  Ib = wb.doorAOpen,
                  Ec = wb.doorBOpen;
                revealHallway(qb, wb.visible);
                qb.doorA.isOpen = Ib;
                qb.doorB.isOpen = Ec;
              }
            }
            var bc,
              Wa = game.level.roomList;
            if (Wa.length !== pb.length) {
              console.log("room array length mismatch");
            } else {
              for (bc = 0; bc < pb.length; bc++) {
                if (pb[bc]) {
                  revealRoom(Wa[bc]);
                }
              }
            }
          }
          var cc = d.treasureChestManager;
          if (cc) {
            var Qa, nc;
            for (Qa = 0; Qa < cc.length; Qa++) {
              var sa = cc[Qa],
                Tb = sa.levelX,
                qc = sa.levelY,
                Fc = sa.opened,
                Cb = sa.westWall,
                kb = sa.roomId,
                Ra;
              b: {
                for (var Ja = sa.settingsId, Db = game.treasure, gb = 0; gb < Db.targetDefinitions.length; gb++) {
                  if (Db.targetDefinitions[gb].settingsId === Ja) {
                    Ra = Db.targetDefinitions[gb];
                    break b;
                  }
                }
                console.log("failed to find treasure chest settings: " + Ja);
                Ra = Db.targetDefinitions[0];
              }
              var rb = new TreasureChest(Tb, qc, findRoom(kb), Ra, Cb);
              setChestOpened(rb, Fc);
              if (nc = rb) {
                var dc = game.treasure,
                  Ka = nc;
                dc.targets.push(Ka);
                dc.targetByRoomId[Ka.room.roomId] = Ka;
              }
            }
          }
          var Xa = d.party;
          if (Xa) {
            var hb = game.state.party,
              lb = Xa.gold,
              rc = Xa.kills,
              sc = Xa.experiencePoints;
            hb.gold = lb ? lb : 0;
            hb.kills = rc ? rc : 0;
            hb.experiencePoints = sc ? sc : 0;
          }
          var Aa = d.gameOptions;
          if (Aa) {
            var db = game.options,
              Mc = Aa.infoTextVisible,
              ec = Aa.spellEffectsVisible,
              Ub = Aa.mapOverlayVisible,
              sb = Aa.offlineProcessingEnabled,
              ka = Aa.fpsVisible,
              Eb;
            Eb = undefined === Aa.inactiveTabProcessingEnabled ? true : Aa.inactiveTabProcessingEnabled;
            var xb;
            xb = undefined === Aa.spriteRenderOrderEnabled ? true : Aa.spriteRenderOrderEnabled;
            db.showCombatText = !!Mc;
            db.showSpellEffects = !!ec;
            db.showMapOverlay = !!Ub;
            db.allowOfflineProgress = !!sb;
            db.allowBackgroundProgress = !!Eb;
            db.depthSortSprites = !!xb;
            db.showFps = !!ka;
          }
          if (n) {
            restoreStatistics(n, game.state.runStatistics, false);
          }
          if (p) {
            restoreStatistics(p, game.state.lifetimeStatistics, false);
          } else {
            if (n) {
              restoreStatistics(n, game.state.lifetimeStatistics, true);
            }
          }
          var Na = d.victoryStatistics;
          if (Na) {
            var Ya = game.state.victoryStatistics,
              tc = Na.partySize1Victories,
              me = Na.partySize2Victories,
              ne = Na.partySize3Victories,
              Le = Na.maxContinuationVictories,
              Td = Na.currentContinuationVictories,
              oe = Na.singleClassVictories,
              Y = Na.classVictories,
              nf = Na.soloClassVictories,
              Nc = Na.currentContinueCount;
            Ya.partySize1Victories = tc ? tc : 0;
            Ya.partySize2Victories = me ? me : 0;
            Ya.partySize3Victories = ne ? ne : 0;
            Ya.maxContinuationVictories = Le ? Le : 0;
            Ya.currentContinuationVictories = Td ? Td : 0;
            Ya.singleClassVictories = oe ? oe : 0;
            if (undefined === Nc) {
              Nc = Ya.currentContinuationVictories;
            }
            Ya.currentContinueCount = Nc;
            if (Y) {
              var gd, uc, U;
              for (U = 0; U < adventurerClasses.length; U++) {
                gd = adventurerClasses[U].characterClass;
                if (uc = Y[gd]) {
                  game.state.victoryStatistics.classVictories[gd] = uc;
                }
              }
            }
            if (nf) {
              var Z, $, ba;
              for (ba = 0; ba < adventurerClasses.length; ba++) {
                Z = adventurerClasses[ba].characterClass;
                if ($ = nf[Z]) {
                  game.state.victoryStatistics.soloClassVictories[Z] = $;
                }
              }
            }
          }
          var ca = d.adventurers;
          if (ca) {
            var q, pe;
            for (q = 0; q < ca.length; q++) {
              var fc = ca[q],
                vd = fc.characterClass,
                qe = fc.spriteName,
                gc = fc.characteristicsComponent,
                vc = fc.positionComponent,
                $c = fc.spells,
                Gc = fc.inventory,
                ad = fc.equippedItemCollection,
                Vb = fc.skillPoints,
                Tc = fc.initialSpellSkillPoint,
                hd = fc.upgrades1,
                id = fc.upgrades2,
                jd = fc.upgrades3,
                kd = fc.upgrades4,
                eg = classesById[vd],
                hc = new Character(fc.adventurerName, fc.characterType, vd, eg, new Inventory()),
                re = createBehaviorQueue(eg.createBehaviors());
              hc.behaviors = re;
              hc.sprite = game.monsterSprites.getSprite(qe);
              var of = hc;
              of.skillPoints = Vb ? Vb : 0;
              of.hasUnspentSkills = hasUnspentSkills(of);
              hc.initialSpellSkillPoint = Tc ? Tc : 0;
              var wd = hc.position,
                rl = vc.worldX,
                cj = vc.worldY,
                Ah = vc.roomId,
                dj = vc.hallwayId,
                Bh = vc.floorPositionIndex;
              setVector(wd.levelPosition, vc.levelX, vc.levelY);
              setVector(wd.worldPosition, rl, cj);
              if (-1 < Ah) {
                wd.room = findRoom(Ah);
              }
              if (-1 < dj) {
                var Me;
                b: {
                  for (var Ne = game.level, Oe = 0; Oe < Ne.hallwayList.length; Oe++) {
                    if (Ne.hallwayList[Oe].hallwayId === dj) {
                      Me = Ne.hallwayList[Oe];
                      break b;
                    }
                  }
                  Me = null;
                }
                wd.currentHallway = Me;
                wd.floorPositionIndex = Bh;
              }
              var fg = hc,
                ld = $c;
              if (ld) {
                for (var qf = undefined, pf = 0; pf < ld.length; pf++) {
                  var rf = fg.classDefinition.spellDefinitions,
                    sf = undefined;
                  if (rf) {
                    c: {
                      var Ch = ld[pf].spellName,
                        gg = undefined,
                        se = undefined;
                      for (se in rf) {
                        if (Object.prototype.hasOwnProperty.call(rf, se)) {
                          if (gg = rf[se], !gg) {
                            console.log("spell lookup failure for key: " + se);
                          } else if (gg.name === Ch) {
                            sf = gg;
                            break c;
                          }
                        }
                      }
                      console.log("failed to lookup spell: " + Ch);
                      sf = null;
                    }
                    qf = sf ? new Spell(sf) : null;
                  } else {
                    qf = null;
                  }
                  if (qf) {
                    learnSpell(fg, qf);
                  }
                }
              }
              var Md = hc.inventory,
                tf = Gc;
              if (tf) {
                for (var Dh = undefined, uf = 0; uf < tf.length; uf++) {
                  if (Dh = restoreItem(tf[uf])) {
                    addInventoryItem(Md, Dh);
                  }
                }
              }
              var ej = hc,
                hg = ad;
              if (hg) {
                for (var Eh = undefined, ig = 0; ig < hg.length; ig++) {
                  if (Eh = restoreItem(hg[ig])) {
                    equipItem(ej, Eh);
                  }
                }
              }
              var Sa = hc.stats,
                bd = gc.characterLevel,
                Fh = gc.characterHealth,
                Gh = gc.characterSpirit,
                Hh = gc.kills,
                Ih = gc.damageComponent,
                fj = gc.armorComponent,
                vf = gc.attackRatingComponent,
                wf = gc.defenceRatingComponent,
                Jh = gc.maxHealthComponent,
                te = gc.maxSpiritComponent,
                Ud = gc.stunCount,
                xf = gc.minionKills,
                yf = gc.damageGiven,
                xd = gc.damageReceived;
              Sa.characterLevel = bd ? bd : 1;
              var sl = scaleByLevel(Sa.characterLevel, experienceCurve, 1);
              Sa.experienceToLevelUp = sl;
              var Kh = scaleByLevel(Sa.characterLevel, damageCurve, 1);
              Sa.spellSpiritCost = Kh;
              Sa.health = floorNumber(Fh ? Fh : Sa.health);
              Sa.spirit = Gh ? Gh : Sa.spirit;
              Sa.kills = Hh ? Hh : Sa.kills;
              /** @type {{setMinionKills: (count: number) => void}} */ (/** @type {unknown} */ (Sa)).setMinionKills(xf ? xf : Sa.minionKills);
              Sa.stunCount = Ud ? Ud : Sa.stunCount;
              Sa.damageGiven = yf ? yf : Sa.damageGiven;
              Sa.damageReceived = xd ? xd : Sa.damageReceived;
              restoreStatComponent(Sa.damage, Ih);
              restoreStatComponent(Sa.armor, fj);
              restoreStatComponent(Sa.attackRating, vf);
              restoreStatComponent(Sa.defenceRating, wf);
              restoreStatComponent(Sa.maxHealth, Jh);
              restoreStatComponent(Sa.maxSpirit, te);
              Sa.baseAttackCooldown = 12;
              Sa.baseHealthRegenPercent = 2;
              Sa.baseSpiritRegenPercent = 3;
              restoreUpgradeFlags(hc.skillTree1.upgrades, hd);
              restoreUpgradeFlags(hc.skillTree2.upgrades, id);
              restoreUpgradeFlags(hc.skillTree3.upgrades, jd);
              restoreUpgradeFlags(hc.skillTree4.upgrades, kd);
              if (pe = hc) {
                game.state.adventurers.push(pe);
              }
            }
            game.state.leader = game.state.adventurers[0];
            game.state.scrollCaster = chooseScrollCaster();
          }
          a.monsterAdapter.Kw(d.monsterTypes);
          var jg = d.settings.upgrades,
            Vd,
            Nd;
          for (Vd in jg) {
            if (Object.prototype.hasOwnProperty.call(jg, Vd)) {
              if (Nd = globalUpgradesById[Vd]) {
                Nd.purchasedLevels = jg[Vd];
              } else {
                console.log("failed to lookup settingsId: " + Vd);
              }
            }
          }
          var tl = a.statisticsAdapter,
            kg = d.scrollInventory;
          if (kg) {
            var ue;
            for (ue = 0; ue < kg.length; ue++) {
              tl.ts(kg[ue]);
            }
          }
          var Uc = d.pointManagerState;
          if (Uc) {
            var ve = Uc.spentAdventurePoints,
              zf = Uc.pointsByType,
              we = Uc.pointUpgrades;
            game.state.adventurePoints.spentPoints = ve ? ve : 0;
            if (zf && 0 !== zf.length) {
              var xe;
              for (xe = 0; xe < zf.length; xe++) {
                var Wd = zf[xe];
                if (Wd) {
                  var yd = Wd.pointEventType,
                    lg = Wd.points,
                    mg = Wd.count;
                  if (yd) {
                    game.state.adventurePoints.pointsByEventType[yd] = lg ? lg : 0;
                    game.state.adventurePoints.countsByEventType[yd] = mg ? mg : 0;
                  }
                }
              }
            }
            if (we && 0 !== we.length) {
              var Af;
              for (Af = 0; Af < we.length; Af++) {
                var ng = we[Af];
                if (ng) {
                  var Lh = ng.upgradeId;
                  if (Lh) {
                    var ul = !!ng.upgradePurchased,
                      Bf = undefined;
                    b: {
                      for (var Mh = game.state.adventurePoints, Pe = 0; Pe < Mh.pointUpgrades.length; Pe++) {
                        if (Mh.pointUpgrades[Pe].definition.upgradeId === Lh) {
                          Bf = Mh.pointUpgrades[Pe];
                          break b;
                        }
                      }
                      Bf = null;
                    }
                    if (Bf) {
                      Bf.ft(ul);
                    }
                  }
                }
              }
            }
            recalculateAdventurePoints(game.state.adventurePoints);
          }
          var gj = d.achievementManager;
          if (gj) {
            var Qe = gj.achievements;
            if (Qe) {
              var Cf;
              for (Cf = 0; Cf < Qe.length; Cf++) {
                var Xd = Qe[Cf];
                if (Xd) {
                  var Oc = Xd.achievementId,
                    Yd = Xd.obtained,
                    Re = Xd.applied;
                  if (Oc) {
                    var Zd = game.state.achievements.Lt[Oc];
                    if (Zd) {
                      Zd.obtained = Yd ? true : false;
                      Zd.applied = Re ? true : false;
                    } else {
                      console.log("Failed to find achievement: " + Oc);
                    }
                  }
                }
              }
            }
          }
          var Vc = game.state.achievements;
          if (0 != Vc.obtainedList.length) {
            Vc.obtainedList.length = 0;
          }
          if (0 != Vc.claimQueue.length) {
            Vc.claimQueue.length = 0;
          }
          var Od, wc;
          for (Od = 0; Od < Vc.achievementList.length; Od++) {
            wc = Vc.achievementList[Od];
            if (wc.obtained) {
              if (wc.applied) {
                if (wc.obtained && wc.applied) {
                  increasePointEventReward(wc.pointEventTypeId, wc.pointRewardBonus);
                }
              } else {
                Vc.claimQueue.push(wc);
              }
            } else {
              Vc.obtainedList.push(wc);
            }
          }
          var zd = d.potionInventory;
          if (zd) {
            var Ad;
            for (Ad = 0; Ad < zd.length; Ad++) {
              var Nh = zd[Ad],
                hj = Nh.active,
                vl = Nh.activeStartTurn,
                og;
              b: {
                for (var ij = Nh.potionId, Df = 0; Df < potionDefinitions.length; Df++) {
                  if (ij === potionDefinitions[Df].potionId) {
                    og = potionDefinitions[Df];
                    break b;
                  }
                }
                console.log("failed to find potion by id: " + ij);
                og = null;
              }
              if (og) {
                var Oh = new Potion(og);
                setPotionActive(Oh, hj);
                Oh.activationTurn = vl;
                addPotion(Oh);
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
export function serializeGame(a) {
  return (a = JSON.stringify(createSaveState(a))) ? saveCodec.compress(a) : null;
}
export function createSaveState(a) {
  var b;
  if (game.initialized) {
    var c = a.saveKey,
      d = Date.now(),
      f = game.initialized,
      g = game.state.turnNumber,
      h = game.state.frameNumber,
      l = game.worldActive,
      n = game.partyCreated,
      p = game.gameWon,
      s = game.state.victoryCount,
      u,
      y = game.world;
    u = {
      worldCenterX: y.worldCenterX,
      worldCenterY: y.worldCenterY,
      blockShiftCol: y.blockOriginColumn,
      blockShiftRow: y.blockOriginRow
    };
    var A,
      C = game.options;
    A = {
      infoTextVisible: C.showCombatText,
      spellEffectsVisible: C.showSpellEffects,
      mapOverlayVisible: C.showMapOverlay,
      offlineProcessingEnabled: C.allowOfflineProgress,
      inactiveTabProcessingEnabled: C.allowBackgroundProgress,
      spriteRenderOrderEnabled: C.depthSortSprites,
      fpsVisible: C.showFps
    };
    var v = game.dungeons.pendingFarmKills,
      D = game.dungeons.discoveredDungeonCount,
      N = [],
      I = game.dungeons.dungeonList,
      x,
      z;
    for (z = 0; z < I.length; z++) {
      var O = I[z];
      x = {
        dungeonId: O.dungeonId,
        discovered: O.discovered,
        conquered: O.conquered,
        cleared: O.cleared,
        clearedTurn: O.clearedTurn,
        dungeonFarm: O.isFarm,
        farmStartTurn: O.farmStartTurn,
        dungeonFarmCost: O.farmCost,
        dungeonType: O.dungeonType,
        levelCount: O.levelCount
      };
      N.push(x);
    }
    var J = {
        farmedKills: v,
        dungeonCostLevel: D,
        dungeonStates: N
      },
      la = {
        collectedGold: game.shops.collectedGold
      },
      Q = game.castles.nextRequiredMonsterLevel,
      V = [],
      na = game.castles.castleList,
      K,
      H;
    for (H = 0; H < na.length; H++) {
      var S = na[H];
      K = {
        castleId: S.castleId,
        conquered: S.conquered,
        dungeonsConquered: S.dungeonsConquered,
        castleRegionLocked: S.regionLocked,
        attackScheduled: S.attackScheduled,
        requiredMonsterLevel: S.requiredMonsterLevel
      };
      V.push(K);
    }
    var da = {
        nextRequiredMonsterLevel: Q,
        castleStates: V
      },
      W = [],
      ia = game.farms.nw,
      ea,
      va;
    for (va = 0; va < ia.length; va++) {
      var yb = ia[va];
      ea = {
        dungeonId: yb.dungeonId,
        farmCol: yb.kw,
        farmRow: yb.lw
      };
      W.push(ea);
    }
    var Fb,
      pa = game.currentDungeon;
    Fb = pa ? {
      dungeonId: pa.dungeonId,
      currentLevelIndex: pa.currentLevelIndex
    } : null;
    var T,
      X = game.currentCastle;
    T = X ? {
      castleId: X.castleId
    } : null;
    var Ca;
    if (game.worldActive) {
      Ca = null;
    } else {
      var qa = game.level,
        ta = qa.centerX,
        eb = qa.centerY,
        Gb = qa.sp,
        Da = qa.roomList,
        ub = [],
        mb;
      for (mb = 0; mb < Da.length; mb++) {
        ub.push(Da[mb].discovered);
      }
      var Ea = qa.hallwayList,
        La = [],
        wa;
      for (wa = 0; wa < Ea.length; wa++) {
        var Fa = Ea[wa];
        La.push({
          visible: Fa.discovered,
          doorAOpen: Fa.doorA.isOpen,
          doorBOpen: Fa.doorB.isOpen
        });
      }
      Ca = {
        levelCenterX: ta,
        levelCenterY: eb,
        levelSeed: Gb,
        roomVisibility: ub,
        hallways: La
      };
    }
    var ha;
    if (game.worldActive) {
      ha = null;
    } else {
      var ja = game.treasure.targets,
        Ga = [],
        bb;
      for (bb = 0; bb < ja.length; bb++) {
        var za = ja[bb];
        Ga.push({
          levelX: za.levelX,
          levelY: za.levelY,
          opened: za.opened,
          settingsId: za.definition.settingsId,
          westWall: za.westWall,
          roomId: za.room.roomId
        });
      }
      ha = Ga;
    }
    var nb = game.scrolls.at,
      fb = [],
      cb;
    for (cb = 0; cb < nb.length; cb++) {
      var Ua = nb[cb];
      fb.push({
        scrollId: Ua.scrollId,
        count: Ua.quantity,
        locked: Ua.locked,
        upgradeCount: Ua.upgradeCount
      });
    }
    var Va = game.potions.potionList,
      mc = [],
      vb;
    for (vb = 0; vb < Va.length; vb++) {
      var Sb = Va[vb];
      mc.push({
        potionId: Sb.potionId,
        active: Sb.active,
        activeStartTurn: Sb.activationTurn
      });
    }
    var Ma,
      zb = game.state.party;
    Ma = {
      gold: zb.gold,
      kills: zb.kills,
      experiencePoints: zb.experiencePoints
    };
    var Hb = serializeStatistics(game.state.runStatistics),
      ac = serializeStatistics(game.state.lifetimeStatistics),
      ob,
      pb = game.state.victoryStatistics,
      Ha = game.state.victoryStatistics,
      jb = {},
      Ab,
      Bb,
      qb;
    for (qb = 0; qb < adventurerClasses.length; qb++) {
      Ab = adventurerClasses[qb].characterClass;
      Bb = getSoloClassVictories(Ha, Ab);
      if (0 < Bb) {
        jb[Ab] = Bb;
      }
    }
    var wb = game.state.victoryStatistics,
      Ib = {},
      Ec,
      bc,
      Wa;
    for (Wa = 0; Wa < adventurerClasses.length; Wa++) {
      Ec = adventurerClasses[Wa].characterClass;
      bc = getClassVictories(wb, Ec);
      if (0 < bc) {
        Ib[Ec] = bc;
      }
    }
    ob = {
      partySize1Victories: pb.partySize1Victories,
      partySize2Victories: pb.partySize2Victories,
      partySize3Victories: pb.partySize3Victories,
      maxContinuationVictories: pb.maxContinuationVictories,
      currentContinuationVictories: pb.currentContinuationVictories,
      singleClassVictories: pb.singleClassVictories,
      classVictories: Ib,
      soloClassVictories: jb,
      currentContinueCount: pb.currentContinueCount
    };
    var cc = [],
      Qa;
    for (Qa = 0; Qa < game.state.adventurers.length; Qa++) {
      cc.push(serializeCharacter(game.state.adventurers[Qa]));
    }
    var nc,
      sa = game.monsterCatalog,
      Tb = [],
      qc = game.monsterCatalog,
      Fc = qc.maxUnlockedLevel,
      Cb;
    for (Cb = qc.minUnlockedLevel; Cb <= Fc; Cb++) {
      Tb.push(serializeMonsterLevel(Cb, getMonsterTypesForLevel(qc, Cb)));
    }
    nc = {
      monsterLevelStates: Tb,
      minUnlockedLevel: sa.minUnlockedLevel,
      maxUnlockedLevel: sa.maxUnlockedLevel
    };
    var kb,
      Ra,
      Ja = {};
    for (kb in globalUpgradeDefinitions) {
      if (Object.prototype.hasOwnProperty.call(globalUpgradeDefinitions, kb)) {
        Ra = globalUpgradeDefinitions[kb];
        Ja[Ra.settingId] = Ra.purchasedLevels;
      }
    }
    var Db = {
        upgrades: Ja
      },
      gb = game.state.adventurePoints.spentPoints,
      rb = game.state.adventurePoints,
      dc = [],
      Ka,
      Xa,
      hb,
      lb;
    for (lb = 0; lb < pointEventDefinitions.length; lb++) {
      Ka = pointEventDefinitions[lb].pointEventTypeId;
      Xa = rb.pointsByEventType[Ka];
      hb = rb.countsByEventType[Ka];
      dc.push({
        pointEventType: Ka,
        points: Xa,
        count: hb
      });
    }
    var rc = [],
      sc = game.state.adventurePoints.pointUpgrades,
      Aa;
    for (Aa = 0; Aa < sc.length; Aa++) {
      var db = sc[Aa];
      rc.push({
        upgradeId: db.definition.upgradeId,
        upgradePurchased: db.isOwned()
      });
    }
    var Mc = Ca,
      ec = ha,
      Ub = {
        spentAdventurePoints: gb,
        pointsByType: dc,
        pointUpgrades: rc
      },
      sb = [],
      ka = game.state.achievements.achievementList,
      Eb,
      xb;
    for (xb = 0; xb < ka.length; xb++) {
      var Na = ka[xb];
      Eb = {
        achievementId: Na.id,
        obtained: Na.obtained,
        applied: Na.applied
      };
      sb.push(Eb);
    }
    b = {
      saveKey: c,
      gameTimestamp: d,
      gameInitialized: f,
      turnNumber: g,
      frameNumber: h,
      worldActive: l,
      partyCreated: n,
      gameWon: p,
      victoryCount: s,
      world: u,
      gameOptions: A,
      dungeonManagerState: J,
      shopManager: la,
      castleManager: da,
      farms: W,
      currentDungeon: Fb,
      currentCastle: T,
      level: Mc,
      treasureChestManager: ec,
      scrollInventory: fb,
      potionInventory: mc,
      party: Ma,
      statistics: Hb,
      totalStatistics: ac,
      victoryStatistics: ob,
      adventurers: cc,
      monsterTypes: nc,
      settings: Db,
      pointManagerState: Ub,
      achievementManager: {
        achievements: sb
      }
    };
  } else {
    b = {
      saveKey: a.saveKey,
      gameInitialized: false,
      partyCreated: false,
      gameWon: false
    };
  }
  return b;
}
export function initializePersistenceGameSave() {}
