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
/** CombatAction.setTargetCharacter 由 combat/actions.js 后挂到原型，调用点窄签名。 @typedef {CombatAction & { setTargetCharacter: (target: unknown) => void }} TargetedCombatAction */
/** Equipment.ef/So 由 characters/movement.js 后挂到原型，调用点窄签名。 @typedef {Equipment & { ef: (slot: unknown) => unknown, So: () => unknown }} SlotEquipment */
export function Character(a, b, c, d, f) {
  this.adventurerName = a;
  this.characterType = b;
  this.classDefinition = d;
  this.characterClass = c;
  if ((a = d.slotStatBonusList) && 0 !== a.length) {
    c = [];
    var g;
    for (g = 0; g < a.length; g++) {
      c.push(a[g].slot);
    }
    a = c;
  } else {
    a = null;
  }
  this.slotList = a;
  if (d = d.slotStatBonusList) {
    a = {};
    for (c = 0; c < d.length; c++) {
      a[d[c].slot] = d[c].statType;
    }
    d = a;
  } else {
    d = null;
  }
  this.KD = d;
  this.equipment = b != MONSTER_TYPE ? new Equipment(this.slotList, this.characterClass) : null;
  this.monsterType = this.sprite = null;
  this.position = new CharacterPosition(WORLD_WALK_SPEED, DUNGEON_WALK_SPEED);
  this.effects = new CharacterEffects(this);
  if (this.inventory = f) {
    this.inventory.Bw = this;
  }
  this.actionType = IDLE_ACTION;
  this.isDead = false;
  this.spellToCast = this.targetTreasureChest = this.bj = this.hk = this.Zh = this.rh = this.combatTarget = this.behaviors = null;
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
        d.prerequisite = b[c - 1];
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
    a.behaviors.notifySpellLearned(b);
  }
}
export function hasUnpurchasedUpgrade(a) {
  if (a) {
    var b;
    for (b = 0; b < a.length; b++) {
      if (!a[b].isOwned()) {
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
    console.log("failed to equip non-equipable item. itemSlot=" + b.slot + " charClass=" + a.characterClass);
  } else if (a.equipment) {
    var c = a.equipment.ef(b.slot);
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
    var g = c.no.slotList,
      h = c.no.equipment;
    for (d = 0; d < g.length; d++) {
      if (f = h.ef(g[d])) {
        var l = c.damage;
        l.itemValue += 1 === f.characteristic ? f.itemValue : 0;
        l = c.armor;
        l.itemValue += 2 === f.characteristic ? f.itemValue : 0;
        l = c.attackRating;
        l.itemValue += 3 === f.characteristic ? f.itemValue : 0;
        l = c.defenceRating;
        l.itemValue += 4 === f.characteristic ? f.itemValue : 0;
        l = c.maxHealth;
        l.itemValue += 5 === f.characteristic ? f.itemValue : 0;
        l = c.maxSpirit;
        l.itemValue += 6 === f.characteristic ? f.itemValue : 0;
      }
    }
    c.health = Math.min(c.health, statValue(c.maxHealth));
    c.spirit = Math.min(c.spirit, statValue(c.maxSpirit));
  }
}
export function updateCharacter(a, b) {
  if (!a.isDead && a.actionType !== IDLE_ACTION) {
    if (1 === a.actionType) {
      if (game.worldActive) {
        var c = a.position;
        if (a === game.state.leader) {
          a: {
            assignVector(c.velocity, c.Ul);
            subtractVector(c.velocity, c.worldPosition);
            var d = b * c.MC * walkingSpeedBonus.currentValue * walkingSpeedModifier.currentValue,
              f = game.world.pixelToTileColumn(c.worldPosition.x),
              g = game.world.pixelToTileRow(c.worldPosition.y);
            if (vectorLength(c.velocity) <= d) {
              assignVector(c.worldPosition, c.Ul);
              c.movementTargetCleared = true;
            } else if (f === c.Rn && g === c.Sn) {
              c.movementTargetCleared = true;
            } else {
              if (!c.Hh || !c.qj || c.qj.getWorldColumn() !== f || c.qj.getWorldRow() !== g) {
                c.aB = c.qj;
                c.qj = game.world.getTileAtPixel(f, g);
                if (!c.qj) {
                  console.log("no current world tile!");
                  break a;
                }
                if (1 >= Math.abs(f - c.Rn) && 1 >= Math.abs(g - c.Sn)) {
                  c.Hh = game.world.getTileAtPixel(c.Rn, c.Sn);
                } else {
                  c.Hh = findCheapestNeighbor(c.qj, c.aB);
                  if (c.Hh && c.Hh.getWorldColumn() !== c.Rn && c.Hh.getWorldRow() !== c.Sn) {
                    c.Hh = findCheapestNeighbor(c.Hh, c.qj);
                  }
                }
              }
              setVector(c.velocity, c.Hh.getPixelX() + 1, c.Hh.getPixelY() + 1);
              subtractVector(c.velocity, c.worldPosition);
              if (separateWorldCharacters(c)) {
                normalizeVector(c.velocity);
                multiplyVector(c.Tl, 0.5);
                addVector(c.velocity, c.Tl);
              }
              normalizeVector(c.velocity);
              multiplyVector(c.velocity, d);
              addVector(c.worldPosition, c.velocity);
            }
          }
        } else {
          assignVector(c.velocity, c.Ul);
          subtractVector(c.velocity, c.worldPosition);
          var h = b * c.MC * walkingSpeedBonus.currentValue * walkingSpeedModifier.currentValue,
            l = game.world.pixelToTileColumn(c.worldPosition.x),
            n = game.world.pixelToTileRow(c.worldPosition.y);
          if (vectorLength(c.velocity) <= h) {
            assignVector(c.worldPosition, c.Ul);
            c.movementTargetCleared = true;
          } else {
            if (l === c.Rn && n === c.Sn) {
              c.movementTargetCleared = true;
            } else {
              setVector(c.velocity, c.Ul.x + 1, c.Ul.y + 1);
              subtractVector(c.velocity, c.worldPosition);
              if (separateWorldCharacters(c)) {
                normalizeVector(c.velocity);
                multiplyVector(c.Tl, 0.5);
                addVector(c.velocity, c.Tl);
              }
              normalizeVector(c.velocity);
              multiplyVector(c.velocity, h);
              addVector(c.worldPosition, c.velocity);
            }
          }
        }
      } else {
        var p = a.position,
          s;
        s = isAdventurerOrMinion(a) ? b * p.Jw * walkingSpeedBonus.currentValue * walkingSpeedModifier.currentValue : p.Jw * b;
        if (null != p.Ug && 0 < p.Ug.length) {
          var u = p.Ug[0];
          setVector(p.velocity, u.pixelColumn, u.pixelRow);
          subtractVector(p.velocity, p.levelPosition);
          if (vectorLength(p.velocity) <= s) {
            var y;
            if (!(y = u.isOpen)) {
              var A;
              a: {
                var C,
                  v = getAllies(),
                  D = v[0].position,
                  N = D.room,
                  I = D.currentHallway;
                for (C = 1; C < v.length; C++) {
                  if (D = v[C].position, D.currentHallway != I || D.room != N) {
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
                    la = u.hallway.Km;
                  for (z = 0; z < O.length; z++) {
                    if (O[z].effects.isDisabled) {
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
              setVector(p.levelPosition, u.pixelColumn | 0, u.pixelRow | 0);
              var Q = p.Ug.shift();
              if (!Q.isOpen) {
                a: {
                  var V = game.state.party;
                  if (!Q.isOpen) {
                    Q.isOpen = true;
                    game.state.statisticsRecorder.recordDoorOpened();
                    awardAdventurePoints(2);
                    if (!Q.leadsTo.Xi) {
                      populateEncounter(Q.leadsTo);
                      revealRoom(Q.leadsTo);
                      spawnRoomTreasure(Q.leadsTo);
                    }
                    var na = Q.hallway;
                    if (!na.Km) {
                      revealHallway(na, true);
                      var K = getOppositeDoor(na, Q);
                      if (!K.isOpen) {
                        V.et(K);
                        V.destinationRoom = K.leadsTo;
                        break a;
                      }
                    }
                    if (Q === V.targetDoor) {
                      V.destinationRoom = V.targetDoor.leadsTo;
                      V.targetDoor = null;
                    }
                  }
                }
              }
              if (p.room) {
                p.currentHallway = Q.hallway;
                p.room = null;
              } else {
                p.currentHallway = null;
                p.room = Q.leadsTo;
              }
              p.fg = -1;
              if (0 === p.Ug.length) {
                if (!p.targetRoom) {
                  clearMovementTarget(p);
                }
              }
            }
          } else if (p.currentHallway) {
            var H = p.currentHallway.pathTiles,
              S = u === p.currentHallway.doorB;
            if (-1 === p.fg) {
              p.fg = S ? 0 : H.length - 1;
            }
            var da = null,
              W;
            if (S) {
              if (p.fg < H.length - 1) {
                W = H[p.fg + 1];
                da = game.level.getTileAt(W.x, W.y);
              }
            } else {
              if (0 < p.fg) {
                W = H[p.fg - 1];
                da = game.level.getTileAt(W.x, W.y);
              }
            }
            if (da) {
              setVector(p.velocity, da.getPixelX(), da.getPixelY());
            } else {
              setVector(p.velocity, u.pixelColumn, u.pixelRow);
            }
            subtractVector(p.velocity, p.levelPosition);
            if (vectorLength(p.velocity) <= s) {
              if (da) {
                setVector(p.levelPosition, da.getPixelX() | 0, da.getPixelY() | 0);
              } else {
                setVector(p.levelPosition, u.pixelColumn | 0, u.pixelRow | 0);
              }
              if (S) {
                p.fg++;
              } else {
                p.fg--;
              }
            } else {
              normalizeVector(p.velocity);
              multiplyVector(p.velocity, s);
              addVector(p.levelPosition, p.velocity);
            }
          } else {
            if (separateDungeonCharacters(p)) {
              normalizeVector(p.velocity);
              addVector(p.velocity, p.lj);
            }
            normalizeVector(p.velocity);
            multiplyVector(p.velocity, s);
            addVector(p.levelPosition, p.velocity);
          }
        } else {
          assignVector(p.velocity, p.moveTargetPoint);
          subtractVector(p.velocity, p.levelPosition);
          if (vectorLength(p.velocity) <= s) {
            assignVector(p.levelPosition, p.moveTargetPoint);
            if (p.targetRoom) {
              game.state.party.iw();
            }
            clearMovementTarget(p);
          } else {
            if (separateDungeonCharacters(p)) {
              normalizeVector(p.velocity);
              addVector(p.velocity, p.lj);
            }
            normalizeVector(p.velocity);
            multiplyVector(p.velocity, s);
            addVector(p.levelPosition, p.velocity);
          }
        }
        if (p.room) {
          if (isAdventurerOrMinion(a)) {
            if (p.room) {
              var ia = p.room,
                ea = p.levelPosition,
                va = game.halfTileSize;
              if (ea) {
                if (!(isPointNearDoor(ia, ea) || ia.stairs && distanceToPoint(ea, ia.stairs.tq, ia.stairs.uq) < game.tileSize)) {
                  clampPointToRoom(ia, ea, va);
                }
              }
            }
          } else {
            if (p.room) {
              clampPointToRoom(p.room, p.levelPosition, game.halfTileSize);
            }
          }
        }
      }
    } else {
      if (2 === a.actionType) {
        if (a.combatTarget && !a.combatTarget.isDead) {
          if (0 < a.stats.extraAttackCount) {
            performMultiAttack(a, false);
          } else {
            var yb = a.combatTarget;
            if (yb) {
              createAttackAction(a, yb, false);
            }
          }
          if (isAdventurerOrMinion(a)) {
            game.state.statisticsRecorder.recordMeleeAttack();
          }
        }
      } else if (a.actionType === MELEE_ACTION_TYPE) {
        if (a.combatTarget && !a.combatTarget.isDead) {
          if (0 < a.stats.extraAttackCount) {
            performMultiAttack(a, true);
          } else {
            var Fb = a.combatTarget;
            if (Fb) {
              createAttackAction(a, Fb, true);
            }
          }
          if (isAdventurerOrMinion(a)) {
            game.state.statisticsRecorder.recordRangedAttack();
          }
        }
      } else if (a.actionType === CAST_ACTION_TYPE) {
        if (a.spellToCast) {
          var pa = a.spellToCast.spellCategoryId,
            T = a.spellToCast.statusEffectTypeId;
          if (2 !== pa || 4 !== T && 1 !== T && 0 !== T) {
            if (3 === pa) {
              var X = a.spellToCast;
              if (X) {
                var Ca,
                  qa,
                  ta,
                  eb,
                  Gb,
                  Da = X.projectileEffectName,
                  ub = X.impactEffectName,
                  mb = a.position.levelPosition,
                  Ea = getFriendlyTargets(a);
                for (Ca = 0; Ca < Ea.length; Ca++) {
                  qa = Ea[Ca];
                  ta = new CombatAction();
                  ta.attacker = a;
                  (/** @type {TargetedCombatAction} */ (ta)).setTargetCharacter(qa);
                  ta.actionDefinition = X;
                  ta.hasProjectilePhase = true;
                  eb = qa.position.levelPosition;
                  if (Da) {
                    Gb = new VisualEffect(Da, mb, eb, true, 1);
                    Gb.boundCharacter = a;
                    ta.projectileEffect = Gb;
                  }
                  if (ub) {
                    var La = new VisualEffect(ub, mb, eb, false, 1);
                    ta.impactEffect = La;
                  }
                  enqueueCombatAction(game.combatQueue, ta);
                }
                var wa = a.stats,
                  Fa = getSpellSpiritCost(wa);
                spendSpirit(wa, Fa);
              }
            } else if (5 === pa) {
              var ha = a.spellToCast;
              if (ha) {
                var ja = a.combatTarget;
                if (ja && !ja.isDead) {
                  var Ga = 1 + (a.stats.ar + 1),
                    bb = null,
                    za = null,
                    nb = null,
                    fb = null,
                    cb = null,
                    Ua,
                    Va,
                    mc,
                    vb = ha.impactEffectName,
                    Sb,
                    Ma,
                    zb = a.position.levelPosition;
                  for (Ua = 0; Ua < Ga && ja; Ua++) {
                    Va = new CombatAction();
                    Va.attacker = a;
                    (/** @type {TargetedCombatAction} */ (Va)).setTargetCharacter(ja);
                    Va.actionDefinition = ha;
                    Va.hasProjectilePhase = true;
                    mc = ja.position.levelPosition;
                    Sb = new VisualEffect(null, zb, mc, true, 2);
                    Sb.boundCharacter = a;
                    Va.projectileEffect = Sb;
                    var Hb = new VisualEffect(vb, mc, mc, false, 1);
                    Va.impactEffect = Hb;
                    zb = mc;
                    Ma = Math.max(1, calculateAttackDamage(a, ja));
                    Va.noDamage = 0 === Ma;
                    Va.remainingDamage = Ma;
                    enqueueCombatAction(game.combatQueue, Va);
                    var ac = RANGED_ATTACK_RANGE,
                      ob = getFriendlyTargets(ja);
                    if (0 === ob.length) {
                      bb = null;
                    } else {
                      var pb = ja.position.room;
                      if (pb) {
                        for (var Ha = undefined, Ab = ja.position.levelPosition, Bb = null, qb = null, wb = undefined, Ib = undefined, Ec = -1, jb = 0; jb < ob.length; jb++) {
                          Ha = ob[jb];
                          if (!(Ha === ja || Ha === za || Ha === nb || Ha === fb || Ha === cb || Ha.isDead || Ha.position.room !== pb)) {
                            wb = Ab.distanceTo(Ha.position.levelPosition);
                            if (wb <= ac && (0 > Ec || wb < Ec)) {
                              Ib = Ha.effects;
                              if (Ib.isStealthed || Ib.isDisabled || Ib.isConverted) {
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
              var cc = a.spellToCast;
              if (cc) {
                var Qa = a.combatTarget;
                if (Qa && !Qa.isDead) {
                  var nc = a.stats.Qq + 1,
                    sa,
                    Tb,
                    qc = cc.projectileEffectName,
                    Fc = cc.impactEffectName,
                    Cb = a.position.levelPosition,
                    kb = a.position.room,
                    Ra = Qa.position.levelPosition,
                    Ja,
                    Db;
                  if (kb) {
                    if (Fc) {
                      sa = new CombatAction();
                      sa.attacker = a;
                      (/** @type {TargetedCombatAction} */ (sa)).setTargetCharacter(Qa);
                      sa.actionDefinition = cc;
                      sa.hasProjectilePhase = true;
                      if (qc) {
                        Tb = new VisualEffect(qc, Cb, Ra, true, 1);
                        Tb.boundCharacter = a;
                        sa.projectileEffect = Tb;
                      }
                      Ja = statValue(a.stats.damage);
                      sa.noDamage = false;
                      sa.remainingDamage = Ja;
                      Db = new VisualEffect(Fc, Cb, Ra, false, TARGETED_EFFECT);
                      Db.boundCharacter = a;
                      Db.ew = kb;
                      Db.li = Ja;
                      sa.impactEffect = Db;
                      var gb = Qa.position,
                        rb = gb.room,
                        dc = game.level.Ai(gb.getLevelPositionX()),
                        Ka = game.level.Bi(gb.getLevelPositionY()),
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
                          if ((Xa = game.level.getTileAt(Aa, db)) && 0.5 > Math.random()) {
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
              var xb = a.combatTarget;
              if (xb && !xb.isDead) {
                var Na = a.spellToCast;
                if (Na) {
                  var Ya = new CombatAction();
                  Ya.attacker = a;
                  (/** @type {TargetedCombatAction} */ (Ya)).setTargetCharacter(xb);
                  var tc = xb.position.levelPosition,
                    me = a.position.levelPosition;
                  Ya.actionDefinition = Na;
                  Ya.hasProjectilePhase = true;
                  var ne = Na.projectileEffectName;
                  if (ne) {
                    var Le = new VisualEffect(ne, me, tc, true, 1);
                    Le.boundCharacter = a;
                    Ya.projectileEffect = Le;
                  }
                  var Td = Na.impactEffectName;
                  if (Td) {
                    var oe = statValue(a.stats.damage);
                    Ya.noDamage = false;
                    Ya.remainingDamage = oe;
                    var Y = new VisualEffect(Td, me, tc, false, TARGETED_EFFECT),
                      nf = xb.position.room;
                    Y.boundCharacter = a;
                    Y.ew = nf;
                    Y.li = oe;
                    Ya.impactEffect = Y;
                    var Nc = a.stats.ho + 1,
                      gd = xb.position,
                      uc = gd.room,
                      U = game.level.Ai(gd.getLevelPositionX()),
                      Z = game.level.Bi(gd.getLevelPositionY()),
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
              if (a.spellToCast) {
                var vd = a.stats,
                  qe = vd.maxSummonedMinions,
                  gc = countSummonedMinions(a),
                  vc = Math.max(0, qe - gc);
                if (!(1 > vc)) {
                  var $c;
                  for ($c = 0; $c < vc; $c++) {
                    var Gc = a,
                      ad = Gc.spellToCast,
                      Vb = new CombatAction();
                    Vb.attacker = Gc;
                    (/** @type {TargetedCombatAction} */ (Vb)).setTargetCharacter(Gc);
                    Vb.noDamage = false;
                    Vb.remainingDamage = 0;
                    Vb.actionDefinition = ad;
                    Vb.hasProjectilePhase = false;
                    var Tc = Gc.position.levelPosition,
                      hd = randomPointInRoom(Tc, Gc.position.room),
                      id = ad.projectileEffectName;
                    if (id) {
                      var jd = new VisualEffect(id, Tc, hd, true, 1);
                      jd.boundCharacter = Gc;
                      Vb.projectileEffect = jd;
                    }
                    var kd = ad.impactEffectName;
                    if (kd) {
                      var eg = new VisualEffect(kd, Tc, hd, false, 1);
                      Vb.impactEffect = eg;
                      enqueueCombatAction(game.combatQueue, Vb);
                    } else {
                      console.log("error: summon spell has no effect name!");
                    }
                  }
                  spendSpirit(vd, getSpellSpiritCost(vd));
                }
              }
            } else if (11 === pa) {
              if (a.spellToCast) {
                var hc = a.stats,
                  re = hc.maxSummonedMinions,
                  of = countSummonedMinions(a),
                  wd = game.monsters.Og,
                  rl = Math.max(0, re - of),
                  cj = Math.min(rl, wd.length),
                  Ah = 0,
                  dj = a.position.room,
                  Bh;
                if (!(0 >= cj)) {
                  var Me;
                  for (Me = 0; Me < wd.length && Ah < cj; Me++) {
                    if (Bh = wd[Me], Bh.position.room === dj) {
                      var Ne = a,
                        Oe = Bh,
                        fg = Ne.spellToCast,
                        ld = new CombatAction();
                      ld.attacker = Ne;
                      (/** @type {TargetedCombatAction} */ (ld)).setTargetCharacter(Oe);
                      ld.noDamage = false;
                      ld.remainingDamage = 0;
                      ld.actionDefinition = fg;
                      ld.hasProjectilePhase = true;
                      var pf = Ne.position.levelPosition,
                        qf = Oe.position.levelPosition,
                        rf = fg.projectileEffectName;
                      if (rf) {
                        var sf = new VisualEffect(rf, pf, qf, true, 1);
                        sf.boundCharacter = Ne;
                        ld.projectileEffect = sf;
                      }
                      var Ch = fg.impactEffectName;
                      if (Ch) {
                        var gg = new VisualEffect(Ch, pf, qf, false, 1);
                        ld.impactEffect = gg;
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
              var se = a.spellToCast;
              if (se) {
                var Md = new CombatAction();
                Md.attacker = a;
                (/** @type {TargetedCombatAction} */ (Md)).setTargetCharacter(a);
                Md.noDamage = false;
                Md.remainingDamage = 0;
                Md.actionDefinition = se;
                Md.hasProjectilePhase = false;
                var tf = a.position.levelPosition,
                  uf = randomPointInRoom(tf, a.position.room),
                  Dh = se.projectileEffectName;
                if (Dh) {
                  var ej = new VisualEffect(Dh, tf, uf, true, 1);
                  ej.boundCharacter = a;
                  Md.projectileEffect = ej;
                }
                var hg = se.impactEffectName;
                if (hg) {
                  var ig = new VisualEffect(hg, tf, uf, false, 1);
                  Md.impactEffect = ig;
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
                var Fh = a.position.levelPosition;
                if (Fh) {
                  if (!bd.pl) {
                    bd.pl = new Vector2();
                  }
                  assignVector(bd.pl, Fh);
                } else {
                  bd.pl = null;
                }
                var Gh = calculateSpellDamage(a, bd.targetCharacter);
                bd.remainingDamage = Gh;
                bd.noDamage = 0 === Gh;
                var Hh = bd.projectileEffect;
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
              var vf = a.spellToCast;
              if (vf) {
                var wf = a.combatTarget;
                if (!wf || wf.isDead) {
                  if (wf = selectScrollTarget(a), !wf) {
                    break a;
                  }
                }
                var Jh,
                  te = vf.statusEffectTypeId;
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
                  var jg = xf.position.room;
                  if (jg) {
                    var Vd,
                      Nd,
                      tl = xf.position.levelPosition,
                      kg,
                      ue = [];
                    for (Vd = 0; Vd < Kh.length && (Nd = Kh[Vd], Nd.isDead || Nd.position.room !== jg || hasStatusEffect(Nd.effects, te) || (Nd === xf ? ue.push(Nd) : (kg = tl.distanceTo(Nd.position.levelPosition), kg <= sl && ue.push(Nd)), !(1E3 <= ue.length))); Vd++) {}
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
                    spellAction,
                    lg,
                    mg,
                    Af = vf.projectileEffectName,
                    ng = vf.impactEffectName,
                    Lh = a.position.levelPosition;
                  for (xe = 0; xe < Ud.length; xe++) {
                    if (Wd = Ud[xe], 4 !== Wd.characterType || 1 !== te && 0 !== te) {
                      spellAction = new CombatAction();
                      spellAction.attacker = a;
                      (/** @type {TargetedCombatAction} */ (spellAction)).setTargetCharacter(Wd);
                      spellAction.actionDefinition = vf;
                      spellAction.hasProjectilePhase = true;
                      lg = Wd.position.levelPosition;
                      if (Af) {
                        mg = new VisualEffect(Af, Lh, lg, true, 1);
                        mg.boundCharacter = a;
                        spellAction.projectileEffect = mg;
                      }
                      if (ng) {
                        var ul = new VisualEffect(ng, Lh, lg, false, 1);
                        spellAction.impactEffect = ul;
                      }
                      enqueueCombatAction(game.combatQueue, spellAction);
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
            game.state.statisticsRecorder.recordSpellCast();
          }
        }
      } else if (5 === a.actionType) {
        if (a.rh && !a.rh.collected) {
          var Pe = a.rh.Xl,
            gj = game.floatingText;
          if (0 < Pe) {
            showFloatingText(gj, a, Pe + "黄金", "yellow");
          }
          addGold(a.rh.Xl);
          game.state.statisticsRecorder.recordGoldFromMonsters(a.rh.Xl);
          a.rh.oh(true);
          removeGoldDrop(a.rh);
          a.rh = null;
          awardAdventurePoints(9);
        }
      } else if (7 === a.actionType) {
        if (a.Zh && !a.Zh.collected) {
          showFloatingText(game.floatingText, a, "卷轴!", "white");
          addScrollCharge(a.Zh.getScroll());
          a.Zh.oh(true);
          removeScrollDrop(a.Zh);
          a.Zh = null;
          awardAdventurePoints(10);
        }
      } else if (8 === a.actionType) {
        if (a.hk && !a.hk.collected) {
          showFloatingText(game.floatingText, a, "药剂!", "white");
          a.hk.oh(true);
          removePotionDrop(a.hk);
          addPotion(a.hk.potion);
          a.Zh = null;
          awardAdventurePoints(11);
        }
      } else if (6 === a.actionType) {
        if (a.bj && !a.bj.collected) {
          a.bj.oh(true);
          removeItemDrop(a.bj);
          var Qe = a.bj.getItem(),
            Cf = Qe.uf();
          addInventoryItem(Qe.nj.inventory, Qe);
          game.state.statisticsRecorder.recordItemFound(Qe);
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
      } else if (12 === a.actionType) {
        if (a.targetTreasureChest && !a.targetTreasureChest.opened) {
          var Xd = a.targetTreasureChest,
            Oc,
            Yd = Xd.room,
            Re = roomLeftPixels(Yd) + game.tileSize,
            Zd = roomRightPixels(Yd) - game.tileSize,
            Vc = roomTopPixels(Yd) + game.tileSize,
            Od = roomBottomPixels(Yd) - game.tileSize,
            wc = Xd.levelX,
            zd = Xd.levelY,
            Ad = Xd.kind;
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
              game.goldDrops.drops.push(vl);
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
                Pp = wl.slotList,
                xA = Pp[randomInt(Pp.length)],
                zA = (100 - Math.min(90, globalUpgradeDefinitions.itemQualityChance.currentValue + CHEST_ITEM_QUALITY_BONUS)) / 100,
                AA = Op.uf(zA),
                CA = (100 - Math.min(90, globalUpgradeDefinitions.higherLevelItemChance.currentValue + CHEST_ITEM_LEVEL_BONUS)) / 100,
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
            for (Oc = 0; Oc < HA && game.potions.potionList.length < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue; Oc++) {
              var IA = new Potion(potionDefinitions[randomInt(potionDefinitions.length)]),
                JA = new PotionDrop(IA, tickCharacterTurn(wc, Re, Zd), tickCharacterTurn(zd, Vc, Od), Yd);
              game.potionDrops.Hf.push(JA);
            }
          }
          showFloatingText(game.floatingText, a, "搜索!!!", "#FFF");
          switch (Ad) {
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
          a.targetTreasureChest = null;
        }
      } else if (9 === a.actionType) {
        if (game.state.party.targetDungeon) {
          var Ef = game.state.party;
          if (Ef.targetDungeon && !Ef.targetDungeon.isFarm) {
            Ef.destinationRoom = null;
            Ef.targetDoor = null;
            Ef.targetRoom = null;
            Ef.targetTreasureChest = null;
            var ye = Ef.targetDungeon;
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
      } else if (11 === a.actionType) {
        if (game.state.party.activeCastle) {
          var Se = game.state.party;
          if (Se.activeCastle) {
            if (Se.activeCastle.conquered) {
              Se.activeCastle = null;
            } else {
              Se.destinationRoom = null;
              Se.targetDoor = null;
              Se.targetRoom = null;
              Se.targetTreasureChest = null;
              var xl = Se.activeCastle;
              game.currentCastle = xl;
              generateDungeonLevel(xl.er(), 11, false, true);
              game.worldActive = false;
              recordGameEvent("Castle", "正在进入城堡:" + xl.castleName);
            }
          }
        }
      } else if (10 === a.actionType && game.state.party.targetShop) {
        var Rp = game.state.party;
        if (Rp.targetShop) {
          var jj;
          for (jj = 0; jj < game.state.adventurers.length; jj++) {
            var yl = game.state.adventurers[jj],
              Sp = yl.inventory,
              zl = Sp.items;
            if (0 !== zl.length) {
              for (var kj = undefined, Tp = 0, Up = undefined, Al = 0, LA = 0.1 + equipmentQualityBonus.currentValue, Ph = zl.length - 1; 0 <= Ph; Ph--) {
                kj = zl[Ph];
                if ((Up = yl.ef(kj.slot)) && !isBetterItem(kj, Up)) {
                  Al += kj.itemGold * LA;
                  Tp++;
                  awardAdventurePoints(17);
                  removeInventoryItemAt(Sp, Ph);
                }
              }
              game.state.statisticsRecorder.recordItemsSold(Tp);
              showFloatingText(game.floatingText, yl, "黄金!", "yellow");
              var Vp = game.shops;
              Vp.ni += floorNumber(Al);
            }
          }
          recordGameEvent("Shop", "卖出所有道具");
          Rp.targetShop = null;
        }
      }
      a.actionType = IDLE_ACTION;
    }
  }
}
export function initializeCharactersCharacter() {
  Character.prototype.ef = function (a) {
    return this.equipment ? (/** @type {SlotEquipment} */ (this.equipment)).ef(a) : null;
  };
  Character.prototype.So = function () {
    return this.equipment ? (/** @type {SlotEquipment} */ (this.equipment)).So() : null;
  };
  Character.prototype.Qk = function (a) {
    equipItem(this, a);
    if (this.characterType === ADVENTURER_TYPE) {
      awardAdventurePoints(21);
    }
  };
  Character.prototype.gq = function (a) {
    this.monsterType = a;
  };
  Character.prototype.getSprite = function () {
    return this.sprite;
  };
  Character.prototype.setCombatTarget = function (a) {
    this.combatTarget = a;
  };
  Character.prototype.setTargetTreasureChest = function (a) {
    this.targetTreasureChest = a;
  };
  Character.prototype.dr = function () {
    if (this.behaviors && !this.isDead) {
      this.behaviors.dr(this);
    }
  };
}
