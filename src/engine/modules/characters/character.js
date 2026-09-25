/** 角色实体、技能、装备和帧更新。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { ADVENTURER_TYPE, CAST_ACTION_TYPE, IDLE_ACTION, MELEE_ACTION_TYPE, MONSTER_TYPE, selectScrollTarget } from "../ai/targeting.js";
import { CharacterPosition, Equipment, clearMovementTarget, findCheapestNeighbor, separateDungeonCharacters, separateWorldCharacters } from "./movement.js";
import { BASE_POTION_CAPACITY, CHEST_ITEM_LEVEL_BONUS, CHEST_ITEM_QUALITY_BONUS, DUNGEON_WALK_SPEED, RETREAT_HEALTH_RATIO, RETREAT_SPIRIT_RATIO, WORLD_WALK_SPEED, dungeonPriceCurve, equipmentQualityBonus, globalUpgradeDefinitions, potionCapacityBonus, rollGoldDrop, walkingSpeedBonus, walkingSpeedModifier } from "../content/balance.js";
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
export function Character(a, b, c, d, f) {
  this.adventurerName = a;
  this.characterType = b;
  this.classDefinition = d;
  this.characterClass = c;
  if ((a = d.tb) && 0 !== a.length) {
    c = [];
    var g;
    for (g = 0; g < a.length; g++) {
      c.push(a[g].r);
    }
    a = c;
  } else {
    a = null;
  }
  this.Z = a;
  if (d = d.tb) {
    a = {};
    for (c = 0; c < d.length; c++) {
      a[d[c].r] = d[c].s;
    }
    d = a;
  } else {
    d = null;
  }
  this.KD = d;
  this.equipment = b != MONSTER_TYPE ? new Equipment(this.Z, this.characterClass) : null;
  this.Sb = this.ee = null;
  this.p = new CharacterPosition(WORLD_WALK_SPEED, DUNGEON_WALK_SPEED);
  this.Ja = new CharacterEffects(this);
  if (this.inventory = f) {
    this.inventory.Bw = this;
  }
  this.Y = IDLE_ACTION;
  this.Va = false;
  this.ld = this.Ue = this.bj = this.hk = this.Zh = this.rh = this.Da = this.behaviors = null;
  this.stats = new CharacterStats(this);
  this.au = -3 * getAttackCooldown(this.stats, true);
  this.summoner = null;
  this.summonedAtTurn = this.lifetimeTurns = 0;
  this.companion = this.summonedMinions = null;
  this.spells = this.characterType === ADVENTURER_TYPE ? [] : null;
  this.initialSpellSkillPoint = this.skillPoints = 0;
  this.hasUnspentSkills = false;
  this.skillTree4 = this.skillTree3 = this.skillTree2 = this.skillTree1 = null;
  if (this.characterType === ADVENTURER_TYPE) {
    b = this.classDefinition.Qg();
    f = this.classDefinition.Rg();
    d = this.classDefinition.Sg();
    a = this.classDefinition.Tg();
    bindSkillTree(this, b);
    bindSkillTree(this, f);
    bindSkillTree(this, d);
    bindSkillTree(this, a);
    this.skillTree1 = new UpgradeCollection([b], false);
    this.skillTree2 = new UpgradeCollection([f], false);
    this.skillTree3 = new UpgradeCollection([d], false);
    this.skillTree4 = new UpgradeCollection([a], false);
  }
}
export function bindSkillTree(a, b) {
  if (b) {
    var c, d;
    for (c = 0; c < b.length; c++) {
      d = b[c];
      d.og();
      d.sx(a);
      if (0 < c) {
        d.Wp = b[c - 1];
      }
    }
  }
}
export function learnSpell(a, b) {
  if (!a.spells) {
    a.spells = [];
  }
  resetSpellCooldown(b);
  a.spells.push(b);
  if (a.behaviors) {
    a.behaviors.Oa(b);
  }
}
export function hasUnpurchasedUpgrade(a) {
  if (a) {
    var b;
    for (b = 0; b < a.length; b++) {
      if (!a[b].He()) {
        return true;
      }
    }
  }
  return false;
}
export function hasUnspentSkills(a) {
  return hasUnpurchasedUpgrade(a.skillTree1.upgrades) || hasUnpurchasedUpgrade(a.skillTree2.upgrades) || hasUnpurchasedUpgrade(a.skillTree3.upgrades) || hasUnpurchasedUpgrade(a.skillTree4.upgrades);
}
export function countSummonedMinions(a) {
  return a.summonedMinions && 0 !== a.summonedMinions.length ? a.companion ? Math.max(0, a.summonedMinions.length - 1) : a.summonedMinions.length : 0;
}
export function markAttackTurn(a) {
  a.au = game.state.turnNumber;
}
export function canAttack(a) {
  return game.state.turnNumber - a.au >= getAttackCooldown(a.stats, isAdventurerOrMinion(a));
}
export function isAdventurerOrMinion(a) {
  return a.characterType === ADVENTURER_TYPE || 1 === a.characterType || 5 === a.characterType;
}
export function isHostile(a) {
  return a.characterType === MONSTER_TYPE || 3 === a.characterType || 4 === a.characterType;
}
export function equipItem(a, b) {
  if (b.characterClass !== a.characterClass) {
    console.log("failed to equip non-equipable item. itemSlot=" + b.r + " charClass=" + a.characterClass);
  } else if (a.equipment) {
    var c = a.equipment.ef(b.r);
    a.equipment.Qk(b);
    if (a.inventory) {
      a.inventory.removeItem(b);
      if (c) {
        addInventoryItem(a.inventory, c);
      }
    }
    var c = a.stats,
      d,
      f;
    c.attackRating.itemValue = 0;
    c.defenceRating.itemValue = 0;
    c.armor.itemValue = 0;
    c.damage.itemValue = 0;
    c.maxHealth.itemValue = 0;
    c.maxSpirit.itemValue = 0;
    var g = c.no.Z,
      h = c.no.equipment;
    for (d = 0; d < g.length; d++) {
      if (f = h.ef(g[d])) {
        var l = c.damage;
        l.itemValue += 1 === f.s ? f.itemValue : 0;
        l = c.armor;
        l.itemValue += 2 === f.s ? f.itemValue : 0;
        l = c.attackRating;
        l.itemValue += 3 === f.s ? f.itemValue : 0;
        l = c.defenceRating;
        l.itemValue += 4 === f.s ? f.itemValue : 0;
        l = c.maxHealth;
        l.itemValue += 5 === f.s ? f.itemValue : 0;
        l = c.maxSpirit;
        l.itemValue += 6 === f.s ? f.itemValue : 0;
      }
    }
    c.health = Math.min(c.health, statValue(c.maxHealth));
    c.spirit = Math.min(c.spirit, statValue(c.maxSpirit));
  }
}
export function updateCharacter(a, b) {
  if (!a.Va && a.Y !== IDLE_ACTION) {
    if (1 === a.Y) {
      if (game.worldActive) {
        var c = a.p;
        if (a === game.state.leader) {
          a: {
            assignVector(c.ra, c.Ul);
            subtractVector(c.ra, c.Db);
            var d = b * c.MC * walkingSpeedBonus.t * walkingSpeedModifier.t,
              f = game.world.bc(c.Db.T),
              g = game.world.cc(c.Db.U);
            if (vectorLength(c.ra) <= d) {
              assignVector(c.Db, c.Ul);
              c.dd = true;
            } else if (f === c.Rn && g === c.Sn) {
              c.dd = true;
            } else {
              if (!c.Hh || !c.qj || c.qj.bc() !== f || c.qj.cc() !== g) {
                c.aB = c.qj;
                c.qj = game.world.hb(f, g);
                if (!c.qj) {
                  console.log("no current world tile!");
                  break a;
                }
                if (1 >= Math.abs(f - c.Rn) && 1 >= Math.abs(g - c.Sn)) {
                  c.Hh = game.world.hb(c.Rn, c.Sn);
                } else {
                  c.Hh = findCheapestNeighbor(c.qj, c.aB);
                  if (c.Hh && c.Hh.bc() !== c.Rn && c.Hh.cc() !== c.Sn) {
                    c.Hh = findCheapestNeighbor(c.Hh, c.qj);
                  }
                }
              }
              setVector(c.ra, c.Hh.dc() + 1, c.Hh.ec() + 1);
              subtractVector(c.ra, c.Db);
              if (separateWorldCharacters(c)) {
                normalizeVector(c.ra);
                multiplyVector(c.Tl, 0.5);
                addVector(c.ra, c.Tl);
              }
              normalizeVector(c.ra);
              multiplyVector(c.ra, d);
              addVector(c.Db, c.ra);
            }
          }
        } else {
          assignVector(c.ra, c.Ul);
          subtractVector(c.ra, c.Db);
          var h = b * c.MC * walkingSpeedBonus.t * walkingSpeedModifier.t,
            l = game.world.bc(c.Db.T),
            n = game.world.cc(c.Db.U);
          if (vectorLength(c.ra) <= h) {
            assignVector(c.Db, c.Ul);
            c.dd = true;
          } else {
            if (l === c.Rn && n === c.Sn) {
              c.dd = true;
            } else {
              setVector(c.ra, c.Ul.T + 1, c.Ul.U + 1);
              subtractVector(c.ra, c.Db);
              if (separateWorldCharacters(c)) {
                normalizeVector(c.ra);
                multiplyVector(c.Tl, 0.5);
                addVector(c.ra, c.Tl);
              }
              normalizeVector(c.ra);
              multiplyVector(c.ra, h);
              addVector(c.Db, c.ra);
            }
          }
        }
      } else {
        var p = a.p,
          s;
        s = isAdventurerOrMinion(a) ? b * p.Jw * walkingSpeedBonus.t * walkingSpeedModifier.t : p.Jw * b;
        if (null != p.Ug && 0 < p.Ug.length) {
          var u = p.Ug[0];
          setVector(p.ra, u.me, u.ne);
          subtractVector(p.ra, p.u);
          if (vectorLength(p.ra) <= s) {
            var y;
            if (!(y = u.Mb)) {
              var A;
              a: {
                var C,
                  v = getAllies(),
                  D = v[0].p,
                  N = D.w,
                  I = D.cd;
                for (C = 1; C < v.length; C++) {
                  if (D = v[C].p, D.cd != I || D.w != N) {
                    A = false;
                    break a;
                  }
                }
                A = true;
              }
              var x;
              if (x = A) {
                a: {
                  var z,
                    O = getAllies(),
                    J,
                    la = u.Yk.Km;
                  for (z = 0; z < O.length; z++) {
                    if (O[z].Ja.Kd) {
                      x = false;
                      break a;
                    }
                    if (la && (J = O[z].stats, O[z].characterType === ADVENTURER_TYPE && (J.health / statValue(J.maxHealth) < RETREAT_HEALTH_RATIO || J.spirit / statValue(J.maxSpirit) < RETREAT_SPIRIT_RATIO))) {
                      x = false;
                      break a;
                    }
                  }
                  x = true;
                }
              }
              y = x;
            }
            if (y) {
              setVector(p.u, u.me | 0, u.ne | 0);
              var Q = p.Ug.shift();
              if (!Q.Mb) {
                a: {
                  var V = game.state.party;
                  if (!Q.Mb) {
                    Q.Mb = true;
                    game.state.aa.Ur();
                    awardAdventurePoints(2);
                    if (!Q.$d.Xi) {
                      populateEncounter(Q.$d);
                      revealRoom(Q.$d);
                      spawnRoomTreasure(Q.$d);
                    }
                    var na = Q.Yk;
                    if (!na.Km) {
                      revealHallway(na, true);
                      var K = getOppositeDoor(na, Q);
                      if (!K.Mb) {
                        V.et(K);
                        V.Cc = K.$d;
                        break a;
                      }
                    }
                    if (Q === V.Bc) {
                      V.Cc = V.Bc.$d;
                      V.Bc = null;
                    }
                  }
                }
              }
              if (p.w) {
                p.cd = Q.Yk;
                p.w = null;
              } else {
                p.cd = null;
                p.w = Q.$d;
              }
              p.fg = -1;
              if (0 === p.Ug.length) {
                if (!p.ed) {
                  clearMovementTarget(p);
                }
              }
            }
          } else if (p.cd) {
            var H = p.cd.Sk,
              S = u === p.cd.Be;
            if (-1 === p.fg) {
              p.fg = S ? 0 : H.length - 1;
            }
            var da = null,
              W;
            if (S) {
              if (p.fg < H.length - 1) {
                W = H[p.fg + 1];
                da = game.level.hb(W.T, W.U);
              }
            } else {
              if (0 < p.fg) {
                W = H[p.fg - 1];
                da = game.level.hb(W.T, W.U);
              }
            }
            if (da) {
              setVector(p.ra, da.Ob(), da.Pb());
            } else {
              setVector(p.ra, u.me, u.ne);
            }
            subtractVector(p.ra, p.u);
            if (vectorLength(p.ra) <= s) {
              if (da) {
                setVector(p.u, da.Ob() | 0, da.Pb() | 0);
              } else {
                setVector(p.u, u.me | 0, u.ne | 0);
              }
              if (S) {
                p.fg++;
              } else {
                p.fg--;
              }
            } else {
              normalizeVector(p.ra);
              multiplyVector(p.ra, s);
              addVector(p.u, p.ra);
            }
          } else {
            if (separateDungeonCharacters(p)) {
              normalizeVector(p.ra);
              addVector(p.ra, p.lj);
            }
            normalizeVector(p.ra);
            multiplyVector(p.ra, s);
            addVector(p.u, p.ra);
          }
        } else {
          assignVector(p.ra, p.Qb);
          subtractVector(p.ra, p.u);
          if (vectorLength(p.ra) <= s) {
            assignVector(p.u, p.Qb);
            if (p.ed) {
              game.state.party.iw();
            }
            clearMovementTarget(p);
          } else {
            if (separateDungeonCharacters(p)) {
              normalizeVector(p.ra);
              addVector(p.ra, p.lj);
            }
            normalizeVector(p.ra);
            multiplyVector(p.ra, s);
            addVector(p.u, p.ra);
          }
        }
        if (p.w) {
          if (isAdventurerOrMinion(a)) {
            if (p.w) {
              var ia = p.w,
                ea = p.u,
                va = game.halfTileSize;
              if (ea) {
                if (!(isPointNearDoor(ia, ea) || ia.stairs && distanceToPoint(ea, ia.stairs.tq, ia.stairs.uq) < game.tileSize)) {
                  clampPointToRoom(ia, ea, va);
                }
              }
            }
          } else {
            if (p.w) {
              clampPointToRoom(p.w, p.u, game.halfTileSize);
            }
          }
        }
      }
    } else {
      if (2 === a.Y) {
        if (a.Da && !a.Da.Va) {
          if (0 < a.stats.extraAttackCount) {
            performMultiAttack(a, false);
          } else {
            var yb = a.Da;
            if (yb) {
              createAttackAction(a, yb, false);
            }
          }
          if (isAdventurerOrMinion(a)) {
            game.state.aa.as();
          }
        }
      } else if (a.Y === MELEE_ACTION_TYPE) {
        if (a.Da && !a.Da.Va) {
          if (0 < a.stats.extraAttackCount) {
            performMultiAttack(a, true);
          } else {
            var Fb = a.Da;
            if (Fb) {
              createAttackAction(a, Fb, true);
            }
          }
          if (isAdventurerOrMinion(a)) {
            game.state.aa.ds();
          }
        }
      } else if (a.Y === CAST_ACTION_TYPE) {
        if (a.ld) {
          var pa = a.ld.ga,
            T = a.ld.X;
          if (2 !== pa || 4 !== T && 1 !== T && 0 !== T) {
            if (3 === pa) {
              var X = a.ld;
              if (X) {
                var Ca,
                  qa,
                  ta,
                  eb,
                  Gb,
                  Da = X.ya,
                  ub = X.ca,
                  mb = a.p.u,
                  Ea = getFriendlyTargets(a);
                for (Ca = 0; Ca < Ea.length; Ca++) {
                  qa = Ea[Ca];
                  ta = new CombatAction();
                  ta.Ca = a;
                  ta.Cb(qa);
                  ta.Ib = X;
                  ta.yd = true;
                  eb = qa.p.u;
                  if (Da) {
                    Gb = new VisualEffect(Da, mb, eb, true, 1);
                    Gb.ud = a;
                    ta.Xb = Gb;
                  }
                  if (ub) {
                    var La = new VisualEffect(ub, mb, eb, false, 1);
                    ta.xb = La;
                  }
                  enqueueCombatAction(game.combatQueue, ta);
                }
                var wa = a.stats,
                  Fa = getSpellSpiritCost(wa);
                spendSpirit(wa, Fa);
              }
            } else if (5 === pa) {
              var ha = a.ld;
              if (ha) {
                var ja = a.Da;
                if (ja && !ja.Va) {
                  var Ga = 1 + (a.stats.ar + 1),
                    bb = null,
                    za = null,
                    nb = null,
                    fb = null,
                    cb = null,
                    Ua,
                    Va,
                    mc,
                    vb = ha.ca,
                    Sb,
                    Ma,
                    zb = a.p.u;
                  for (Ua = 0; Ua < Ga && ja; Ua++) {
                    Va = new CombatAction();
                    Va.Ca = a;
                    Va.Cb(ja);
                    Va.Ib = ha;
                    Va.yd = true;
                    mc = ja.p.u;
                    Sb = new VisualEffect(null, zb, mc, true, 2);
                    Sb.ud = a;
                    Va.Xb = Sb;
                    var Hb = new VisualEffect(vb, mc, mc, false, 1);
                    Va.xb = Hb;
                    zb = mc;
                    Ma = Math.max(1, calculateAttackDamage(a, ja));
                    Va.Rd = 0 === Ma;
                    Va.Jc = Ma;
                    enqueueCombatAction(game.combatQueue, Va);
                    var ac = RANGED_ATTACK_RANGE,
                      ob = getFriendlyTargets(ja);
                    if (0 === ob.length) {
                      bb = null;
                    } else {
                      var pb = ja.p.w;
                      if (pb) {
                        for (var Ha = undefined, jb = undefined, Ab = ja.p.u, Bb = null, qb = null, wb = undefined, Ib = undefined, Ec = -1, jb = 0; jb < ob.length; jb++) {
                          Ha = ob[jb];
                          if (!(Ha === ja || Ha === za || Ha === nb || Ha === fb || Ha === cb || Ha.Va || Ha.p.w !== pb)) {
                            wb = Ab.ac(Ha.p.u);
                            if (wb <= ac && (0 > Ec || wb < Ec)) {
                              Ib = Ha.Ja;
                              if (Ib.wg || Ib.Kd || Ib.bi) {
                                qb = Ha;
                              } else {
                                Bb = Ha;
                                Ec = wb;
                              }
                            }
                          }
                        }
                        bb = Bb ? Bb : qb;
                      } else {
                        bb = null;
                      }
                    }
                    cb = fb;
                    fb = nb;
                    nb = za;
                    za = ja;
                    ja = bb;
                  }
                  var bc = a.stats,
                    Wa = getSpellSpiritCost(bc);
                  spendSpirit(bc, Wa);
                }
              }
            } else if (6 === pa) {
              var cc = a.ld;
              if (cc) {
                var Qa = a.Da;
                if (Qa && !Qa.Va) {
                  var nc = a.stats.Qq + 1,
                    sa,
                    Tb,
                    qc = cc.ya,
                    Fc = cc.ca,
                    Cb = a.p.u,
                    kb = a.p.w,
                    Ra = Qa.p.u,
                    Ja,
                    Db;
                  if (kb) {
                    if (Fc) {
                      sa = new CombatAction();
                      sa.Ca = a;
                      sa.Cb(Qa);
                      sa.Ib = cc;
                      sa.yd = true;
                      if (qc) {
                        Tb = new VisualEffect(qc, Cb, Ra, true, 1);
                        Tb.ud = a;
                        sa.Xb = Tb;
                      }
                      Ja = statValue(a.stats.damage);
                      sa.Rd = false;
                      sa.Jc = Ja;
                      Db = new VisualEffect(Fc, Cb, Ra, false, TARGETED_EFFECT);
                      Db.ud = a;
                      Db.ew = kb;
                      Db.li = Ja;
                      sa.xb = Db;
                      var gb = Qa.p,
                        rb = gb.w,
                        dc = game.level.Ai(gb.Ob()),
                        Ka = game.level.Bi(gb.Pb()),
                        Xa,
                        hb = rb.tileColumn,
                        lb = rb.tileRow,
                        rc = hb + rb.widthInTiles,
                        sc = lb + rb.heightInTiles,
                        Aa,
                        db,
                        Mc = Math.max(hb, dc - nc),
                        ec = Math.min(rc, dc + nc),
                        Ub = Math.max(lb, Ka - nc),
                        sb = Math.min(sc, Ka + nc);
                      for (Aa = Mc; Aa <= ec; Aa++) {
                        for (db = Ub; db <= sb; db++) {
                          if ((Xa = game.level.hb(Aa, db)) && 0.5 > Math.random()) {
                            setTileEffect(Xa, Db);
                          }
                        }
                      }
                      enqueueCombatAction(game.combatQueue, sa);
                      var ka = a.stats,
                        Eb = getSpellSpiritCost(ka);
                      spendSpirit(ka, Eb);
                    } else {
                      console.log("no effect name for rain damage spell");
                    }
                  }
                }
              }
            } else if (8 === pa) {
              var xb = a.Da;
              if (xb && !xb.Va) {
                var Na = a.ld;
                if (Na) {
                  var Ya = new CombatAction();
                  Ya.Ca = a;
                  Ya.Cb(xb);
                  var tc = xb.p.u,
                    me = a.p.u;
                  Ya.Ib = Na;
                  Ya.yd = true;
                  var ne = Na.ya;
                  if (ne) {
                    var Le = new VisualEffect(ne, me, tc, true, 1);
                    Le.ud = a;
                    Ya.Xb = Le;
                  }
                  var Td = Na.ca;
                  if (Td) {
                    var oe = statValue(a.stats.damage);
                    Ya.Rd = false;
                    Ya.Jc = oe;
                    var Y = new VisualEffect(Td, me, tc, false, TARGETED_EFFECT),
                      nf = xb.p.w;
                    Y.ud = a;
                    Y.ew = nf;
                    Y.li = oe;
                    Ya.xb = Y;
                    var Nc = a.stats.ho + 1,
                      gd = xb.p,
                      uc = gd.w,
                      U = game.level.Ai(gd.Ob()),
                      Z = game.level.Bi(gd.Pb()),
                      $ = uc.tileColumn,
                      ba = uc.tileRow,
                      ca = $ + uc.widthInTiles,
                      q = ba + uc.heightInTiles;
                    applyAreaTileEffect(U, Z, $, ca, ba, q, Y);
                    if (0 < Nc) {
                      applyAreaTileEffect(U, Z - 1, $, ca, ba, q, Y);
                      applyAreaTileEffect(U, Z + 1, $, ca, ba, q, Y);
                      applyAreaTileEffect(U - 1, Z, $, ca, ba, q, Y);
                      applyAreaTileEffect(U + 1, Z, $, ca, ba, q, Y);
                      applyAreaTileEffect(U - 1, Z - 1, $, ca, ba, q, Y);
                      applyAreaTileEffect(U - 1, Z + 1, $, ca, ba, q, Y);
                      applyAreaTileEffect(U + 1, Z - 1, $, ca, ba, q, Y);
                      applyAreaTileEffect(U + 1, Z + 1, $, ca, ba, q, Y);
                      if (1 < Nc) {
                        applyAreaTileEffect(U, Z - 2, $, ca, ba, q, Y);
                        applyAreaTileEffect(U, Z + 2, $, ca, ba, q, Y);
                        applyAreaTileEffect(U - 2, Z, $, ca, ba, q, Y);
                        applyAreaTileEffect(U + 2, Z, $, ca, ba, q, Y);
                        applyAreaTileEffect(U - 2, Z - 1, $, ca, ba, q, Y);
                        applyAreaTileEffect(U - 2, Z + 1, $, ca, ba, q, Y);
                        applyAreaTileEffect(U + 2, Z - 1, $, ca, ba, q, Y);
                        applyAreaTileEffect(U + 2, Z + 1, $, ca, ba, q, Y);
                        applyAreaTileEffect(U - 1, Z - 2, $, ca, ba, q, Y);
                        applyAreaTileEffect(U - 1, Z + 2, $, ca, ba, q, Y);
                        applyAreaTileEffect(U + 1, Z - 2, $, ca, ba, q, Y);
                        applyAreaTileEffect(U + 1, Z + 2, $, ca, ba, q, Y);
                        if (2 < Nc) {
                          applyAreaTileEffect(U - 2, Z - 2, $, ca, ba, q, Y);
                          applyAreaTileEffect(U - 2, Z + 2, $, ca, ba, q, Y);
                          applyAreaTileEffect(U + 2, Z - 2, $, ca, ba, q, Y);
                          applyAreaTileEffect(U + 2, Z + 2, $, ca, ba, q, Y);
                          applyAreaTileEffect(U - 3, Z - 1, $, ca, ba, q, Y);
                          applyAreaTileEffect(U - 3, Z, $, ca, ba, q, Y);
                          applyAreaTileEffect(U - 3, Z + 1, $, ca, ba, q, Y);
                          applyAreaTileEffect(U + 3, Z - 1, $, ca, ba, q, Y);
                          applyAreaTileEffect(U + 3, Z, $, ca, ba, q, Y);
                          applyAreaTileEffect(U + 3, Z + 1, $, ca, ba, q, Y);
                          applyAreaTileEffect(U - 1, Z - 3, $, ca, ba, q, Y);
                          applyAreaTileEffect(U, Z - 3, $, ca, ba, q, Y);
                          applyAreaTileEffect(U + 1, Z - 3, $, ca, ba, q, Y);
                          applyAreaTileEffect(U - 1, Z + 3, $, ca, ba, q, Y);
                          applyAreaTileEffect(U, Z + 3, $, ca, ba, q, Y);
                          applyAreaTileEffect(U + 1, Z + 3, $, ca, ba, q, Y);
                        }
                      }
                    }
                    var pe = a.stats,
                      fc = getSpellSpiritCost(pe);
                    spendSpirit(pe, fc);
                    enqueueCombatAction(game.combatQueue, Ya);
                  } else {
                    console.log("error: blast spell has no effect name!");
                  }
                }
              }
            } else if (10 === pa || 17 === pa) {
              if (a.ld) {
                var vd = a.stats,
                  qe = vd.maxSummonedMinions,
                  gc = countSummonedMinions(a),
                  vc = Math.max(0, qe - gc);
                if (!(1 > vc)) {
                  var $c;
                  for ($c = 0; $c < vc; $c++) {
                    var Gc = a,
                      ad = Gc.ld,
                      Vb = new CombatAction();
                    Vb.Ca = Gc;
                    Vb.Cb(Gc);
                    Vb.Rd = false;
                    Vb.Jc = 0;
                    Vb.Ib = ad;
                    Vb.yd = false;
                    var Tc = Gc.p.u,
                      hd = randomPointInRoom(Tc, Gc.p.w),
                      id = ad.ya;
                    if (id) {
                      var jd = new VisualEffect(id, Tc, hd, true, 1);
                      jd.ud = Gc;
                      Vb.Xb = jd;
                    }
                    var kd = ad.ca;
                    if (kd) {
                      var eg = new VisualEffect(kd, Tc, hd, false, 1);
                      Vb.xb = eg;
                      enqueueCombatAction(game.combatQueue, Vb);
                    } else {
                      console.log("error: summon spell has no effect name!");
                    }
                  }
                  spendSpirit(vd, getSpellSpiritCost(vd));
                }
              }
            } else if (11 === pa) {
              if (a.ld) {
                var hc = a.stats,
                  re = hc.maxSummonedMinions,
                  of = countSummonedMinions(a),
                  wd = game.monsters.Og,
                  rl = Math.max(0, re - of),
                  cj = Math.min(rl, wd.length),
                  Ah = 0,
                  dj = a.p.w,
                  Bh;
                if (!(0 >= cj)) {
                  var Me;
                  for (Me = 0; Me < wd.length && Ah < cj; Me++) {
                    if (Bh = wd[Me], Bh.p.w === dj) {
                      var Ne = a,
                        Oe = Bh,
                        fg = Ne.ld,
                        ld = new CombatAction();
                      ld.Ca = Ne;
                      ld.Cb(Oe);
                      ld.Rd = false;
                      ld.Jc = 0;
                      ld.Ib = fg;
                      ld.yd = true;
                      var pf = Ne.p.u,
                        qf = Oe.p.u,
                        rf = fg.ya;
                      if (rf) {
                        var sf = new VisualEffect(rf, pf, qf, true, 1);
                        sf.ud = Ne;
                        ld.Xb = sf;
                      }
                      var Ch = fg.ca;
                      if (Ch) {
                        var gg = new VisualEffect(Ch, pf, qf, false, 1);
                        ld.xb = gg;
                        enqueueCombatAction(game.combatQueue, ld);
                      } else {
                        console.log("error: summon spell has no effect name!");
                      }
                      Ah++;
                    }
                  }
                  spendSpirit(hc, getSpellSpiritCost(hc));
                }
              }
            } else if (9 === pa) {
              var se = a.ld;
              if (se) {
                var Md = new CombatAction();
                Md.Ca = a;
                Md.Cb(a);
                Md.Rd = false;
                Md.Jc = 0;
                Md.Ib = se;
                Md.yd = false;
                var tf = a.p.u,
                  uf = randomPointInRoom(tf, a.p.w),
                  Dh = se.ya;
                if (Dh) {
                  var ej = new VisualEffect(Dh, tf, uf, true, 1);
                  ej.ud = a;
                  Md.Xb = ej;
                }
                var hg = se.ca;
                if (hg) {
                  var ig = new VisualEffect(hg, tf, uf, false, 1);
                  Md.xb = ig;
                  var Eh = a.stats,
                    Sa = getSpellSpiritCost(Eh);
                  spendSpirit(Eh, Sa);
                  enqueueCombatAction(game.combatQueue, Md);
                } else {
                  console.log("error: summon spell has no effect name!");
                }
              }
            } else if (12 === pa) {
              var bd = createSpellAction(a);
              if (bd) {
                bd.ut = true;
                bd.chainCount = a.stats.vt + 1;
                var Fh = a.p.u;
                if (Fh) {
                  if (!bd.pl) {
                    bd.pl = new Vector2();
                  }
                  assignVector(bd.pl, Fh);
                } else {
                  bd.pl = null;
                }
                var Gh = calculateSpellDamage(a, bd.Da);
                bd.Jc = Gh;
                bd.Rd = 0 === Gh;
                var Hh = bd.Xb;
                if (Hh) {
                  Hh.Gs = true;
                }
              }
            } else if (13 === pa) {
              var Ih = createSpellAction(a);
              if (Ih) {
                var fj = a.stats.nt + 1;
                if (0 < fj) {
                  Ih.Xs = true;
                  Ih.chainCount = fj;
                }
              }
            } else {
              createSpellAction(a);
            }
          } else {
            a: {
              var vf = a.ld;
              if (vf) {
                var wf = a.Da;
                if (!wf || wf.Va) {
                  if (wf = selectScrollTarget(a), !wf) {
                    break a;
                  }
                }
                var Jh,
                  te = vf.X;
                if (1 === te || 0 === te) {
                  Jh = a.stats.mr + 1;
                } else if (4 === te) {
                  Jh = a.stats.Ft + 1;
                } else {
                  console.log("wrong effect type: " + te);
                  break a;
                }
                var Ud;
                var xf = wf,
                  yf = Jh,
                  xd;
                var sl = RANGED_ATTACK_RANGE,
                  Kh = getOpponents(a);
                if (0 === Kh.length) {
                  xd = null;
                } else {
                  var jg = xf.p.w;
                  if (jg) {
                    var Vd,
                      Nd,
                      tl = xf.p.u,
                      kg,
                      ue = [];
                    for (Vd = 0; Vd < Kh.length && (Nd = Kh[Vd], Nd.Va || Nd.p.w !== jg || hasStatusEffect(Nd.Ja, te) || (Nd === xf ? ue.push(Nd) : (kg = tl.ac(Nd.p.u), kg <= sl && ue.push(Nd)), !(1E3 <= ue.length))); Vd++) {}
                    xd = ue;
                  } else {
                    xd = null;
                  }
                }
                if (xd) {
                  if (xd.length < yf) {
                    Ud = xd;
                  } else {
                    var Uc = [],
                      ve,
                      zf = 0;
                    for (Uc.push(xf); Uc.length < yf && 10 > zf;) {
                      ve = xd[randomInt(Uc.length)];
                      if (0 > Uc.indexOf(ve)) {
                        Uc.push(ve);
                      } else {
                        zf++;
                      }
                    }
                    if (Uc.length < yf) {
                      var we;
                      for (we = 0; we < xd.length && !(ve = xd[we], 0 > Uc.indexOf(ve) && (Uc.push(ve), Uc.length >= yf)); we++) {}
                    }
                    Ud = Uc;
                  }
                } else {
                  Ud = null;
                }
                if (Ud && 0 !== Ud.length) {
                  var xe,
                    Wd,
                    yd,
                    lg,
                    mg,
                    Af = vf.ya,
                    ng = vf.ca,
                    Lh = a.p.u;
                  for (xe = 0; xe < Ud.length; xe++) {
                    if (Wd = Ud[xe], 4 !== Wd.characterType || 1 !== te && 0 !== te) {
                      yd = new CombatAction();
                      yd.Ca = a;
                      yd.Cb(Wd);
                      yd.Ib = vf;
                      yd.yd = true;
                      lg = Wd.p.u;
                      if (Af) {
                        mg = new VisualEffect(Af, Lh, lg, true, 1);
                        mg.ud = a;
                        yd.Xb = mg;
                      }
                      if (ng) {
                        var ul = new VisualEffect(ng, Lh, lg, false, 1);
                        yd.xb = ul;
                      }
                      enqueueCombatAction(game.combatQueue, yd);
                    } else {
                      showFloatingText(game.floatingText, Wd, "免疫!", "white");
                    }
                  }
                  var Bf = a.stats,
                    Mh = getSpellSpiritCost(Bf);
                  spendSpirit(Bf, Mh);
                }
              }
            }
          }
          if (isAdventurerOrMinion(a)) {
            game.state.aa.gs();
          }
        }
      } else if (5 === a.Y) {
        if (a.rh && !a.rh.gc) {
          var Pe = a.rh.Xl,
            gj = game.floatingText;
          if (0 < Pe) {
            showFloatingText(gj, a, Pe + "黄金", "yellow");
          }
          addGold(a.rh.Xl);
          game.state.aa.dp(a.rh.Xl);
          a.rh.oh(true);
          removeGoldDrop(a.rh);
          a.rh = null;
          awardAdventurePoints(9);
        }
      } else if (7 === a.Y) {
        if (a.Zh && !a.Zh.gc) {
          showFloatingText(game.floatingText, a, "卷轴!", "white");
          addScrollCharge(a.Zh.vf());
          a.Zh.oh(true);
          removeScrollDrop(a.Zh);
          a.Zh = null;
          awardAdventurePoints(10);
        }
      } else if (8 === a.Y) {
        if (a.hk && !a.hk.gc) {
          showFloatingText(game.floatingText, a, "药剂!", "white");
          a.hk.oh(true);
          removePotionDrop(a.hk);
          addPotion(a.hk.hc);
          a.Zh = null;
          awardAdventurePoints(11);
        }
      } else if (6 === a.Y) {
        if (a.bj && !a.bj.gc) {
          a.bj.oh(true);
          removeItemDrop(a.bj);
          var Qe = a.bj.getItem(),
            Cf = Qe.uf();
          addInventoryItem(Qe.nj.inventory, Qe);
          game.state.aa.ep(Qe);
          awardAdventurePoints(12);
          if (0 != Cf) {
            switch (Cf) {
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
          a.bj = null;
        }
      } else if (12 === a.Y) {
        if (a.Ue && !a.Ue.Kg) {
          var Xd = a.Ue,
            Oc,
            Yd = Xd.Nn,
            Re = roomLeftPixels(Yd) + game.tileSize,
            Zd = roomRightPixels(Yd) - game.tileSize,
            Vc = roomTopPixels(Yd) + game.tileSize,
            Od = roomBottomPixels(Yd) - game.tileSize,
            wc = Xd.zq,
            zd = Xd.Aq,
            Ad = Xd.Mf;
          if (wc < Re) {
            wc = Re;
          } else {
            if (wc > Zd) {
              wc = Zd;
            }
          }
          if (zd < Vc) {
            zd = Vc;
          } else {
            if (zd > Od) {
              zd = Od;
            }
          }
          setChestOpened(Xd, true);
          if (1 === Ad) {
            var Nh = 10 + randomInt(10),
              hj;
            for (Oc = 0; Oc < Nh; Oc++) {
              hj = 1 + rollGoldDrop();
              var vl = new GoldDrop(hj, tickCharacterTurn(wc, Re, Zd), tickCharacterTurn(zd, Vc, Od), Yd);
              game.goldDrops.pe.push(vl);
            }
          }
          if (1 === Ad || 2 === Ad) {
            var og = 7 + randomInt(8);
            for (Oc = 0; Oc < og; Oc++) {
              var ij = game.itemDrops,
                Df = tickCharacterTurn(wc, Re, Zd),
                Oh = tickCharacterTurn(zd, Vc, Od),
                wA = Yd,
                Np,
                Op = game.itemGenerator,
                wl = game.state.adventurers[randomInt(game.state.adventurers.length)],
                Pp = wl.Z,
                xA = Pp[randomInt(Pp.length)],
                zA = (100 - Math.min(90, globalUpgradeDefinitions.itemQualityChance.t + CHEST_ITEM_QUALITY_BONUS)) / 100,
                AA = Op.uf(zA),
                CA = (100 - Math.min(90, globalUpgradeDefinitions.higherLevelItemChance.t + CHEST_ITEM_LEVEL_BONUS)) / 100,
                DA = randomizeItemLevel(wl.stats.characterLevel, CA);
              if (Np = generateItem(Op, xA, wl, DA, AA)) {
                ij.yf.push(new ItemDrop(Np, Df, Oh, wA));
              }
            }
          }
          if (1 === Ad || 3 === Ad) {
            var EA = 2 + randomInt(5);
            for (Oc = 0; Oc < EA; Oc++) {
              var Qp = game.scrolls.Pl,
                FA = Qp[randomInt(Qp.length)],
                GA = new ScrollDrop(FA, tickCharacterTurn(wc, Re, Zd), tickCharacterTurn(zd, Vc, Od), Yd);
              game.scrollDrops.kf.push(GA);
            }
          }
          if (1 === Ad) {
            var HA = 0 + randomInt(2);
            for (Oc = 0; Oc < HA && game.potions.re.length < BASE_POTION_CAPACITY + potionCapacityBonus.t; Oc++) {
              var IA = new Potion(potionDefinitions[randomInt(potionDefinitions.length)]),
                JA = new PotionDrop(IA, tickCharacterTurn(wc, Re, Zd), tickCharacterTurn(zd, Vc, Od), Yd);
              game.potionDrops.Hf.push(JA);
            }
          }
          showFloatingText(game.floatingText, a, "搜索!!!", "#FFF");
          switch (Ad) {
            case 1:
              game.state.aa.hs();
              awardAdventurePoints(6);
              break;
            case 2:
              game.state.aa.js();
              awardAdventurePoints(7);
              break;
            case 3:
              game.state.aa.Rr();
              awardAdventurePoints(8);
          }
          recordGameEvent("Treasure Chest", "Looted");
          a.Ue = null;
        }
      } else if (9 === a.Y) {
        if (game.state.party.Wb) {
          var Ef = game.state.party;
          if (Ef.Wb && !Ef.Wb.isFarm) {
            Ef.Cc = null;
            Ef.Bc = null;
            Ef.ed = null;
            Ef.Ue = null;
            var ye = Ef.Wb;
            game.currentDungeon = ye;
            ye.currentLevelIndex = 0;
            generateDungeonLevel(ye.er(), ye.dungeonType, ye.Aj, true);
            game.worldActive = false;
            if (ye.discovered) {
              recordGameEvent("Dungeon", "Entering Dungeon Again");
            } else {
              ye.discovered = true;
              ye.farmCost = scaleByLevel(game.dungeons.Mk + 1, dungeonPriceCurve, 1);
              discoverDungeon(ye);
              recordGameEvent("Dungeon", "Discovered Dungeon");
            }
          }
        }
      } else if (11 === a.Y) {
        if (game.state.party.ge) {
          var Se = game.state.party;
          if (Se.ge) {
            if (Se.ge.cb) {
              Se.ge = null;
            } else {
              Se.Cc = null;
              Se.Bc = null;
              Se.ed = null;
              Se.Ue = null;
              var xl = Se.ge;
              game.currentCastle = xl;
              generateDungeonLevel(xl.er(), 11, false, true);
              game.worldActive = false;
              recordGameEvent("Castle", "正在进入城堡:" + xl.castleName);
            }
          }
        }
      } else if (10 === a.Y && game.state.party.Lf) {
        var Rp = game.state.party;
        if (Rp.Lf) {
          var jj;
          for (jj = 0; jj < game.state.adventurers.length; jj++) {
            var yl = game.state.adventurers[jj],
              Sp = yl.inventory,
              zl = Sp.items;
            if (0 !== zl.length) {
              for (var Ph = undefined, kj = undefined, Tp = 0, Up = undefined, Al = 0, LA = 0.1 + equipmentQualityBonus.t, Ph = zl.length - 1; 0 <= Ph; Ph--) {
                kj = zl[Ph];
                if ((Up = yl.ef(kj.r)) && !isBetterItem(kj, Up)) {
                  Al += kj.zf * LA;
                  Tp++;
                  awardAdventurePoints(17);
                  removeInventoryItemAt(Sp, Ph);
                }
              }
              game.state.aa.Zr(Tp);
              showFloatingText(game.floatingText, yl, "黄金!", "yellow");
              var Vp = game.shops;
              Vp.ni += floorNumber(Al);
            }
          }
          recordGameEvent("Shop", "卖出所有道具");
          Rp.Lf = null;
        }
      }
      a.Y = IDLE_ACTION;
    }
  }
}
export function initializeCharactersCharacter() {
  Character.prototype.ef = function (a) {
    return this.equipment ? this.equipment.ef(a) : null;
  };
  Character.prototype.So = function () {
    return this.equipment ? this.equipment.So() : null;
  };
  Character.prototype.Qk = function (a) {
    equipItem(this, a);
    if (this.characterType === ADVENTURER_TYPE) {
      awardAdventurePoints(21);
    }
  };
  Character.prototype.gq = function (a) {
    this.Sb = a;
  };
  Character.prototype.v = function () {
    return this.ee;
  };
  Character.prototype.Cb = function (a) {
    this.Da = a;
  };
  Character.prototype.hq = function (a) {
    this.Ue = a;
  };
  Character.prototype.dr = function () {
    if (this.behaviors && !this.Va) {
      this.behaviors.dr(this);
    }
  };
}
