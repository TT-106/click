/** 逐帧与逐回合推进。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { getAllies, getMonsters, getOpponents } from "../combat/encounters.js";
import { statValue } from "../characters/stats.js";
import { FRAME_DURATION_MS, addVector, assignVector, floorNumber, multiplyVector, normalizeVector, randomInt, recordGameEvent, setVector, subtractVector, vectorLength } from "../core/math.js";
import { autoScrollsModifier, farmKillsModifier, fasterFarmingModifier, fasterInfestationModifier, healthRegenerationBonus, potionDurationBonus, potionDurationModifier, potionPowerBonus, spiritRegenerationBonus, upgradeCollections } from "../content/balance.js";
import { updateCharacterEffects } from "../characters/effects.js";
import { setPotionActive } from "../combat/potions.js";
import { Spell, castScroll } from "../combat/scrolls.js";
import { Farm, registerDungeonFarm, registerFarm, sortDungeons } from "../world/dungeons.js";
import { getAchievementProgress, hasVictoryAchievement } from "../progression/achievements.js";
import { clampPointToRoom, setTileEffect } from "../world/rooms.js";
import { updateCharacter } from "../characters/character.js";
import { TARGETED_EFFECT, VisualEffect, addVisualEffect, advanceEffectFrame, directionScratchVector, getEffectDirection } from "../rendering/sprites.js";
import { CombatAction, advanceCombatAction, calculateAttackDamage, enqueueCombatAction, findTargetsInRange, resolveCharacterDefeat } from "../combat/actions.js";
import { applySeparationForce } from "../characters/movement.js";
import { blastStunSpell } from "../content/spells.js";
import { showDamageText } from "../rendering/floating-text.js";
import { isBetterItem } from "../loot/items.js";
import { sortInventory } from "../loot/inventory.js";
import { refreshUpgradeCollection } from "../progression/upgrades.js";
import { repositionWorldBlock, worldBlockContains } from "../world/terrain.js";
import { IDLE_ACTION } from "../ai/targeting.js";
import { spendGold } from "../characters/party.js";
export function advanceSimulation(a) {
  var b = game.lifecycle;
  b.Jo += a;
  if (15 <= b.Jo) {
    game.state.turnNumber++;
    b.Jo -= 15;
    b.yw++;
    if (b.yw >= b.zD) {
      b.yw = 0;
      var c,
        d = getAllies();
      for (c = 0; c < d.length; c++) {
        var f = d[c].stats,
          g = statValue(f.maxHealth);
        if (f.health < g) {
          var h = Math.max(1, floorNumber(g * (f.baseHealthRegenPercent + f.healthRegenBonus + healthRegenerationBonus.currentValue) / 100));
          f.health = Math.min(g, f.health + h);
        }
        var l = statValue(f.maxSpirit);
        if (f.spirit < l) {
          var n = Math.max(1, floorNumber(l * (f.baseSpiritRegenPercent + f.spiritRegenBonus + spiritRegenerationBonus.currentValue) / 100));
          f.spirit = Math.min(l, f.spirit + n);
        }
      }
    }
    var p = game.minions.minionList,
      s,
      u,
      y,
      A,
      C;
    for (C = p.length - 1; 0 <= C; C--) {
      s = p[C];
      u = s.summoner;
      if (u.isDead) {
        showDeathEffect(s);
        game.lifecycle.Lp(s);
      } else {
        y = s.summonedAtTurn;
        A = s.lifetimeTurns;
        if (!(0 > A)) {
          if (y > game.state.turnNumber) {
            console.log("minion bug: start turn in future.");
          } else {
            if (game.state.turnNumber - y > A) {
              showDeathEffect(s);
              game.lifecycle.Lp(s);
            }
          }
        }
      }
    }
    var v = getMonsters(),
      D = getAllies(),
      N;
    for (N = 0; N < D.length; N++) {
      updateCharacterEffects(D[N].effects, true);
    }
    for (N = 0; N < v.length; N++) {
      updateCharacterEffects(v[N].effects, false);
    }
    game.state.statisticsRecorder.recordTurn();
    var I = game.state.party;
    if (game.worldActive) {
      I.ou();
    } else {
      I.Ks = false;
      I.forcedDestinationRoom = null;
      I.Mp = false;
      I.nu();
    }
    if (!game.worldActive) {
      game.goldDrops.releaseClaims();
      game.scrollDrops.releaseClaims();
      game.potionDrops.releaseClaims();
      game.itemDrops.releaseClaims();
    }
    updateCharacterBehaviors(getAllies());
    updateCharacterBehaviors(getMonsters());
    var x = game.potions,
      z = 0 === game.state.turnNumber % 3,
      O,
      J,
      la,
      Q,
      V = 800 + potionDurationBonus.currentValue;
    for (O = x.potionList.length - 1; 0 <= O; O--) {
      J = x.potionList[O];
      if (J.active) {
        Q = J.activationTurn;
        if (z && potionDurationModifier.currentValue && Q < game.state.turnNumber) {
          Q++;
          J.activationTurn = Q;
        }
        if (game.state.turnNumber - Q >= V) {
          setPotionActive(J, false);
          la = x.potionList.indexOf(J);
          if (-1 < la) {
            x.potionList.splice(la, 1);
          }
        }
      }
    }
    if (autoScrollsModifier.currentValue && 0 < getMonsters().length && (b.autoScrollTurnCounter++, b.autoScrollTurnCounter >= b.autoScrollInterval)) {
      b.autoScrollTurnCounter = 0;
      var na = game.scrolls.unlockedScrolls;
      if (b.autoScrollIndex >= na.length) {
        b.autoScrollIndex = 0;
      }
      positionScrollCaster(b.autoScrollIndex);
      castScroll(na[b.autoScrollIndex], true);
      b.autoScrollIndex++;
      if (b.autoScrollIndex >= na.length) {
        b.autoScrollIndex = 0;
      }
    }
    b.cw++;
    if (b.cw >= b.gD) {
      b.cw = 0;
      var K = game.dungeons,
        H,
        S,
        da = false,
        W,
        ia = game.state.turnNumber;
      for (H = 0; H < K.cleared.length; H++) {
        S = K.cleared[H];
        if (1500 <= ia - S.clearedTurn) {
          da = true;
          S.cleared = false;
          S.clearedTurn = 0;
        }
      }
      if (da) {
        for (H = K.cleared.length - 1; 0 <= H; H--) {
          S = K.cleared[H];
          if (!S.cleared) {
            K.cleared.splice(H, 1);
            if (S.discovered && !S.cleared) {
              W = K.attackable.indexOf(S);
              if (0 > W) {
                K.attackable.push(S);
              }
            }
          }
        }
        sortDungeons(K, K.attackable);
      }
      var ea,
        va,
        yb = fasterFarmingModifier.currentValue,
        Fb = fasterInfestationModifier.currentValue,
        pa = (100 + potionPowerBonus.currentValue) * farmKillsModifier.currentValue;
      for (H = 0; H < K.farms.length; H++) {
        S = K.farms[H];
        ea = S.clearedTurn;
        va = S.farmStartTurn;
        if (ea > ia) {
          ea = 0;
          S.clearedTurn = ea;
        }
        if (va > ia) {
          va = 0;
          S.farmStartTurn = va;
        }
        if (S.cleared) {
          if (Fb) {
            ea -= 2;
            S.clearedTurn = ea;
          }
          if (1500 <= ia - ea) {
            S.cleared = false;
            S.farmStartTurn = ia;
          }
        } else {
          if (yb) {
            va -= 2;
            S.farmStartTurn = va;
          }
          if (1200 <= ia - va) {
            K.pendingFarmKills += pa;
            S.cleared = true;
            S.clearedTurn = ia;
          }
        }
      }
    }
    b.Qt++;
    if (b.Qt >= b.PC) {
      b.Qt = 0;
      var T = game.state.achievements,
        X,
        Ca;
      for (X = T.obtainedList.length - 1; 0 <= X; X--) {
        var qa = Ca = T.obtainedList[X];
        if (!qa.obtained) {
          qa.obtained = qa.isVictoryAchievement ? hasVictoryAchievement(qa) : getAchievementProgress(qa) >= qa.requiredCount;
        }
        if (qa.obtained) {
          T.obtainedList.splice(X, 1);
          T.claimQueue.push(Ca);
        }
      }
      for (X = T.claimQueue.length - 1; 0 <= X; X--) {
        Ca = T.claimQueue[X];
        if (Ca.applied) {
          T.claimQueue.splice(X, 1);
        }
      }
    }
  }
  game.state.frameNumber++;
  var ta = getMonsters(),
    eb,
    Gb;
  for (Gb = 0; Gb < ta.length; Gb++) {
    if (eb = ta[Gb].position, null != eb.steeringVector) {
      var Da = eb;
      if (Da.steeringVector) {
        var ub = Da.Jw * a * 3;
        assignVector(Da.velocity, Da.steeringVector);
        normalizeVector(Da.velocity);
        multiplyVector(Da.velocity, ub);
        var mb = vectorLength(Da.steeringVector);
        if (ub >= mb) {
          Da.steeringVector = null;
        } else {
          multiplyVector(Da.steeringVector, (mb - ub) / mb);
        }
        addVector(Da.levelPosition, Da.velocity);
        if (Da.room) {
          clampPointToRoom(Da.room, Da.levelPosition, game.halfTileSize);
        }
      }
    }
  }
  var Ea = getMonsters(),
    La = getAllies(),
    wa;
  for (wa = 0; wa < La.length; wa++) {
    updateCharacter(La[wa], a);
  }
  for (wa = 0; wa < Ea.length; wa++) {
    updateCharacter(Ea[wa], a);
  }
  var Fa = game.combatQueue,
    ha,
    ja,
    Ga,
    bb = false,
    za,
    nb = false;
  for (ha = 0; ha < Fa.queue.length; ha++) {
    if (ja = Fa.queue[ha], Ga = ja.attacker, (za = ja.impactEffect) && za.effectType === TARGETED_EFFECT) {
      var fb;
      a: {
        var cb = ja,
          Ua = cb.projectileEffect;
        if (Ua && !Ua.hasSpawned) {
          addVisualEffect(game.effects, cb.projectileEffect);
        }
        if (!Ua || Ua.reachedTarget || Ua.finished) {
          var Va = cb.impactEffect;
          if (!Va.hasSpawned) {
            var mc = cb.actionDefinition;
            if (mc && 8 == mc.spellCategoryId) {
              var vb = cb,
                Sb = game.upgradeRegistry,
                Ma = vb.targetCharacter,
                zb = vb.attacker,
                Hb = floorNumber((zb.stats.ho + 1) * game.tileSize),
                ac = findTargetsInRange(zb, Ma, 200, Hb);
              if (ac && 0 !== ac.length) {
                var ob = undefined,
                  pb = undefined,
                  Ha = zb.position.levelPosition,
                  jb = Ma.position.levelPosition,
                  Ab = undefined,
                  Bb = undefined,
                  qb = undefined,
                  wb = undefined,
                  Ib = vb.actionDefinition;
                if (Ib) {
                  wb = Ib.impactEffectName;
                } else {
                  var Ec = zb.getEffectItem(),
                    bc = Ec ? Ec.itemEffect : null,
                    wb = bc ? bc.ms : null;
                }
                if (!wb) {
                  wb = "Red Splat";
                }
                for (var Wa = undefined, ob = /** @type {any} */ (0); ob < ac.length; ob++) {
                  qb = ac[ob];
                  Ab = qb.position;
                  Bb = Ab.levelPosition;
                  if (qb === Ma) {
                    applySeparationForce(Ab, Ha, jb, Hb);
                  } else {
                    Wa = new CombatAction();
                    Wa.attacker = zb;
                    (/** @type {any} */ (Wa)).setTargetCharacter(qb);
                    Wa.hasProjectilePhase = false;
                    Wa.actionDefinition = Ib;
                    applySeparationForce(Ab, Ha, jb, Hb);
                    var cc = new VisualEffect(wb, jb, Bb, false, 1);
                    Wa.impactEffect = cc;
                    pb = Math.max(1, calculateAttackDamage(zb, Ma));
                    Wa.noDamage = false;
                    Wa.remainingDamage = pb;
                    enqueueCombatAction(game.combatQueue, Wa);
                  }
                  var Qa = Sb,
                    nc = qb,
                    sa = nc.position.levelPosition,
                    Tb = new CombatAction();
                  Tb.attacker = vb.attacker;
                  (/** @type {any} */ (Tb)).setTargetCharacter(nc);
                  Tb.hasProjectilePhase = false;
                  Tb.actionDefinition = Qa.Wq;
                  if (!Qa.Wq) {
                    Qa.Wq = new Spell(blastStunSpell);
                  }
                  var qc = Qa.Wq.impactEffectName;
                  if (qc) {
                    var Fc = new VisualEffect(qc, sa, sa, false, 1);
                    Tb.impactEffect = Fc;
                  }
                  enqueueCombatAction(game.combatQueue, Tb);
                }
              }
            }
            addVisualEffect(game.effects, Va);
          } else if (Va.isFinished()) {
            fb = cb.resolved = true;
            break a;
          }
        }
        fb = false;
      }
      if (fb) {
        bb = true;
      } else {
        if (za.hasSpawned) {
          nb = true;
        }
      }
    } else if (Ga.isDead) {
      bb = ja.resolved = true;
    } else if (ja.hasProjectilePhase) {
      var Cb = Fa,
        kb = ja,
        Ra = kb.projectileEffect;
      if (Ra && !Ra.hasSpawned) {
        addVisualEffect(game.effects, Ra);
      }
      if (Ra) {
        var Ja = kb.actionDefinition;
        if (Ja && 12 === Ja.spellCategoryId) {
          var Db = Ra.currentPosition;
          setVector(kb.attacker.position.levelPosition, Db.x, Db.y);
        }
      }
      if ((!Ra || Ra.reachedTarget || Ra.finished) && advanceCombatAction(Cb, kb)) {
        bb = true;
      }
    } else {
      if (advanceCombatAction(Fa, ja)) {
        bb = true;
      }
    }
  }
  if (nb) {
    var gb = getOpponents(Ga),
      rb,
      dc,
      Ka,
      Xa,
      hb,
      lb,
      rc,
      sc,
      Aa,
      db,
      Mc = 1 === Ga.characterType ? Ga.summoner.stats : Ga.stats;
    for (db = 0; db < gb.length; db++) {
      if (rb = gb[db], !rb.isDead && (dc = rb.position.levelPosition, Ka = game.level.pixelToTileColumn(dc.x), Xa = game.level.pixelToTileRow(dc.y), (hb = game.level.getTileAt(Ka, Xa)) && (lb = hb.tileEffect) && lb.hasSpawned)) {
        if (lb.isFinished()) {
          setTileEffect(hb, null);
        } else if (lb.bx !== lb.frameIndex && (sc = hb.remainingEffectDamage, 0 !== sc && (Aa = randomInt(sc + 1), 0 !== Aa))) {
          hb.qB(Math.max(0, sc - Aa));
          var ec = rc = rb.stats;
          ec.health -= floorNumber(Aa);
          if (0 > ec.health) {
            ec.health = 0;
          }
          Mc.damageGiven += Aa;
          rc.damageReceived += Aa;
          showDamageText(rb, Aa);
          if (0 === rc.health) {
            resolveCharacterDefeat(lb.boundCharacter, rb);
          }
        }
      }
    }
  }
  if (bb) {
    for (ha = Fa.queue.length - 1; 0 <= ha; ha--) {
      if (Fa.queue[ha].resolved) {
        Fa.queue.splice(ha, 1);
      }
    }
  }
  var Ub = game.effects,
    sb;
  for (sb = 0; sb < Ub.pool.length; sb++) {
    var ka = Ub.pool[sb],
      Eb = a;
    ka.hasSpawned = true;
    if (1 === ka.effectType) {
      if (ka.projectileEffect && !ka.reachedTarget) {
        assignVector(directionScratchVector, ka.targetPosition);
        subtractVector(directionScratchVector, ka.currentPosition);
        var xb = vectorLength(directionScratchVector),
          Na = undefined,
          Na = /** @type {any} */ (ka.boundCharacter === game.state.scrollCaster ? 11 * Eb : ka.isReturning ? 5 * Eb : 7 * Eb);
        if (xb <= Na) {
          assignVector(ka.currentPosition, ka.targetPosition);
          ka.reachedTarget = true;
          ka.finished = true;
        } else {
          normalizeVector(directionScratchVector);
          multiplyVector(directionScratchVector, Na);
          addVector(ka.currentPosition, directionScratchVector);
        }
      }
      if (ka.animation.isDirectional) {
        ka.frameIndex = getEffectDirection(ka);
      } else {
        advanceEffectFrame(ka, Eb);
      }
    } else {
      if (ka.effectType === TARGETED_EFFECT) {
        advanceEffectFrame(ka, Eb);
      } else {
        if (2 === ka.effectType) {
          ka.elapsedMs += Eb * FRAME_DURATION_MS;
          if (400 <= ka.elapsedMs) {
            ka.finished = true;
            ka.reachedTarget = true;
          }
        }
      }
    }
  }
  for (sb = Ub.pool.length - 1; 0 <= sb; sb--) {
    if (Ub.pool[sb].isFinished()) {
      Ub.pool.splice(sb, 1);
    }
  }
  var Ya = game.inventories,
    tc,
    me,
    ne,
    Le = false;
  for (tc = 0; tc < game.state.adventurers.length; tc++) {
    me = game.state.adventurers[tc].inventory;
    if (me.ip) {
      Le = true;
      me.ip = false;
    }
  }
  if (Le) {
    Ya.list.length = 0;
    var Td, oe, Y, nf;
    for (tc = 0; tc < game.state.adventurers.length; tc++) {
      for (oe = game.state.adventurers[tc], ne = oe.inventory.items, Td = 0; Td < ne.length; Td++) {
        Y = ne[Td];
        if (!((nf = oe.getSlotItem(Y.slot)) && !isBetterItem(Y, nf))) {
          Ya.list.push(Y);
        }
      }
    }
    if (1 < Ya.list.length) {
      sortInventory(Ya, Ya.list);
    }
  }
  game.floatingText.oy();
  if (!game.processingOffline) {
    var Nc;
    for (Nc = 0; Nc < upgradeCollections.length; Nc++) {
      refreshUpgradeCollection(upgradeCollections[Nc]);
    }
    var gd;
    for (Nc = 0; Nc < game.state.adventurers.length; Nc++) {
      gd = game.state.adventurers[Nc];
      refreshUpgradeCollection(gd.skillTree1);
      refreshUpgradeCollection(gd.skillTree2);
      refreshUpgradeCollection(gd.skillTree3);
      refreshUpgradeCollection(gd.skillTree4);
    }
  }
  var uc,
    U = game.state.adventurers,
    Z = 0,
    $ = 0;
  if (game.worldActive) {
    for (uc = 0; uc < U.length; uc++) {
      Z += U[uc].position.getWorldPositionX();
      $ += U[uc].position.getWorldPositionY();
    }
    var ba = Z / U.length,
      ca = $ / U.length,
      q = game.world;
    if (null == ba || null == ca) {
      console.log("Setting world center x/y to null. worldCenterX=" + ba + " y=" + ca);
    } else if (q.worldCenterX = ba, q.worldCenterY = ca, !worldBlockContains(q.worldBlocks[1][1], q.worldCenterX, q.worldCenterY)) {
      var pe;
      var fc = false,
        vd,
        qe,
        gc,
        vc;
      for (vd = 0; 3 > vd; vd++) {
        for (qe = 0; 3 > qe; qe++) {
          if (worldBlockContains(q.worldBlocks[vd][qe], q.worldCenterX, q.worldCenterY)) {
            fc = true;
            gc = vd;
            vc = qe;
            break;
          }
        }
      }
      if (fc) {
        var $c = q.worldBlocks[0][0],
          Gc = q.worldBlocks[0][1],
          ad = q.worldBlocks[0][2],
          Vb = q.worldBlocks[1][0],
          Tc = q.worldBlocks[1][1],
          hd = q.worldBlocks[1][2],
          id = q.worldBlocks[2][0],
          jd = q.worldBlocks[2][1],
          kd = q.worldBlocks[2][2];
        if (0 === gc) {
          q.blockOriginColumn--;
          if (0 === vc) {
            q.blockOriginRow--;
            q.worldBlocks[0][0] = kd;
            q.worldBlocks[0][1] = id;
            q.worldBlocks[0][2] = jd;
            q.worldBlocks[1][0] = ad;
            q.worldBlocks[1][1] = $c;
            q.worldBlocks[1][2] = Gc;
            q.worldBlocks[2][0] = hd;
            q.worldBlocks[2][1] = Vb;
            q.worldBlocks[2][2] = Tc;
            repositionWorldBlock(q.worldBlocks[0][0], q.blockOriginColumn, q.blockOriginRow, true);
            repositionWorldBlock(q.worldBlocks[0][1], q.blockOriginColumn, q.blockOriginRow + 1, true);
            repositionWorldBlock(q.worldBlocks[0][2], q.blockOriginColumn, q.blockOriginRow + 2, true);
            repositionWorldBlock(q.worldBlocks[1][0], q.blockOriginColumn + 1, q.blockOriginRow, true);
            repositionWorldBlock(q.worldBlocks[1][1], q.blockOriginColumn + 1, q.blockOriginRow + 1, false);
            repositionWorldBlock(q.worldBlocks[1][2], q.blockOriginColumn + 1, q.blockOriginRow + 2, false);
            repositionWorldBlock(q.worldBlocks[2][0], q.blockOriginColumn + 2, q.blockOriginRow, true);
            repositionWorldBlock(q.worldBlocks[2][1], q.blockOriginColumn + 2, q.blockOriginRow + 1, false);
            repositionWorldBlock(q.worldBlocks[2][2], q.blockOriginColumn + 2, q.blockOriginRow + 2, false);
          } else {
            if (1 === vc) {
              q.worldBlocks[0][0] = id;
              q.worldBlocks[0][1] = jd;
              q.worldBlocks[0][2] = kd;
              q.worldBlocks[1][0] = $c;
              q.worldBlocks[1][1] = Gc;
              q.worldBlocks[1][2] = ad;
              q.worldBlocks[2][0] = Vb;
              q.worldBlocks[2][1] = Tc;
              q.worldBlocks[2][2] = hd;
              repositionWorldBlock(q.worldBlocks[0][0], q.blockOriginColumn, q.blockOriginRow, true);
              repositionWorldBlock(q.worldBlocks[0][1], q.blockOriginColumn, q.blockOriginRow + 1, true);
              repositionWorldBlock(q.worldBlocks[0][2], q.blockOriginColumn, q.blockOriginRow + 2, true);
              repositionWorldBlock(q.worldBlocks[1][0], q.blockOriginColumn + 1, q.blockOriginRow, false);
              repositionWorldBlock(q.worldBlocks[1][1], q.blockOriginColumn + 1, q.blockOriginRow + 1, false);
              repositionWorldBlock(q.worldBlocks[1][2], q.blockOriginColumn + 1, q.blockOriginRow + 2, false);
              repositionWorldBlock(q.worldBlocks[2][0], q.blockOriginColumn + 2, q.blockOriginRow, false);
              repositionWorldBlock(q.worldBlocks[2][1], q.blockOriginColumn + 2, q.blockOriginRow + 1, false);
              repositionWorldBlock(q.worldBlocks[2][2], q.blockOriginColumn + 2, q.blockOriginRow + 2, false);
            } else {
              q.blockOriginRow++;
              q.worldBlocks[0][0] = jd;
              q.worldBlocks[0][1] = kd;
              q.worldBlocks[0][2] = id;
              q.worldBlocks[1][0] = Gc;
              q.worldBlocks[1][1] = ad;
              q.worldBlocks[1][2] = $c;
              q.worldBlocks[2][0] = Tc;
              q.worldBlocks[2][1] = hd;
              q.worldBlocks[2][2] = Vb;
              repositionWorldBlock(q.worldBlocks[0][0], q.blockOriginColumn, q.blockOriginRow, true);
              repositionWorldBlock(q.worldBlocks[0][1], q.blockOriginColumn, q.blockOriginRow + 1, true);
              repositionWorldBlock(q.worldBlocks[0][2], q.blockOriginColumn, q.blockOriginRow + 2, true);
              repositionWorldBlock(q.worldBlocks[1][0], q.blockOriginColumn + 1, q.blockOriginRow, false);
              repositionWorldBlock(q.worldBlocks[1][1], q.blockOriginColumn + 1, q.blockOriginRow + 1, false);
              repositionWorldBlock(q.worldBlocks[1][2], q.blockOriginColumn + 1, q.blockOriginRow + 2, true);
              repositionWorldBlock(q.worldBlocks[2][0], q.blockOriginColumn + 2, q.blockOriginRow, false);
              repositionWorldBlock(q.worldBlocks[2][1], q.blockOriginColumn + 2, q.blockOriginRow + 1, false);
              repositionWorldBlock(q.worldBlocks[2][2], q.blockOriginColumn + 2, q.blockOriginRow + 2, true);
            }
          }
        } else {
          if (1 === gc) {
            if (0 === vc) {
              q.blockOriginRow--;
              q.worldBlocks[0][0] = ad;
              q.worldBlocks[0][1] = $c;
              q.worldBlocks[0][2] = Gc;
              q.worldBlocks[1][0] = hd;
              q.worldBlocks[1][1] = Vb;
              q.worldBlocks[1][2] = Tc;
              q.worldBlocks[2][0] = kd;
              q.worldBlocks[2][1] = id;
              q.worldBlocks[2][2] = jd;
              repositionWorldBlock(q.worldBlocks[0][0], q.blockOriginColumn, q.blockOriginRow, true);
              repositionWorldBlock(q.worldBlocks[0][1], q.blockOriginColumn, q.blockOriginRow + 1, false);
              repositionWorldBlock(q.worldBlocks[0][2], q.blockOriginColumn, q.blockOriginRow + 2, false);
              repositionWorldBlock(q.worldBlocks[1][0], q.blockOriginColumn + 1, q.blockOriginRow, true);
              repositionWorldBlock(q.worldBlocks[1][1], q.blockOriginColumn + 1, q.blockOriginRow + 1, false);
              repositionWorldBlock(q.worldBlocks[1][2], q.blockOriginColumn + 1, q.blockOriginRow + 2, false);
              repositionWorldBlock(q.worldBlocks[2][0], q.blockOriginColumn + 2, q.blockOriginRow, true);
              repositionWorldBlock(q.worldBlocks[2][1], q.blockOriginColumn + 2, q.blockOriginRow + 1, false);
              repositionWorldBlock(q.worldBlocks[2][2], q.blockOriginColumn + 2, q.blockOriginRow + 2, false);
            } else {
              if (1 === vc) {
                console.log("error? new center block already in the center of the grid.");
              } else {
                q.blockOriginRow++;
                q.worldBlocks[0][0] = Gc;
                q.worldBlocks[0][1] = ad;
                q.worldBlocks[0][2] = $c;
                q.worldBlocks[1][0] = Tc;
                q.worldBlocks[1][1] = hd;
                q.worldBlocks[1][2] = Vb;
                q.worldBlocks[2][0] = jd;
                q.worldBlocks[2][1] = kd;
                q.worldBlocks[2][2] = id;
                repositionWorldBlock(q.worldBlocks[0][0], q.blockOriginColumn, q.blockOriginRow, false);
                repositionWorldBlock(q.worldBlocks[0][1], q.blockOriginColumn, q.blockOriginRow + 1, false);
                repositionWorldBlock(q.worldBlocks[0][2], q.blockOriginColumn, q.blockOriginRow + 2, true);
                repositionWorldBlock(q.worldBlocks[1][0], q.blockOriginColumn + 1, q.blockOriginRow, false);
                repositionWorldBlock(q.worldBlocks[1][1], q.blockOriginColumn + 1, q.blockOriginRow + 1, false);
                repositionWorldBlock(q.worldBlocks[1][2], q.blockOriginColumn + 1, q.blockOriginRow + 2, true);
                repositionWorldBlock(q.worldBlocks[2][0], q.blockOriginColumn + 2, q.blockOriginRow, false);
                repositionWorldBlock(q.worldBlocks[2][1], q.blockOriginColumn + 2, q.blockOriginRow + 1, false);
                repositionWorldBlock(q.worldBlocks[2][2], q.blockOriginColumn + 2, q.blockOriginRow + 2, true);
              }
            }
          } else {
            q.blockOriginColumn++;
            if (0 === vc) {
              q.blockOriginRow--;
              q.worldBlocks[0][0] = hd;
              q.worldBlocks[0][1] = Vb;
              q.worldBlocks[0][2] = Tc;
              q.worldBlocks[1][0] = kd;
              q.worldBlocks[1][1] = id;
              q.worldBlocks[1][2] = jd;
              q.worldBlocks[2][0] = ad;
              q.worldBlocks[2][1] = $c;
              q.worldBlocks[2][2] = Gc;
              repositionWorldBlock(q.worldBlocks[0][0], q.blockOriginColumn, q.blockOriginRow, true);
              repositionWorldBlock(q.worldBlocks[0][1], q.blockOriginColumn, q.blockOriginRow + 1, false);
              repositionWorldBlock(q.worldBlocks[0][2], q.blockOriginColumn, q.blockOriginRow + 2, false);
              repositionWorldBlock(q.worldBlocks[1][0], q.blockOriginColumn + 1, q.blockOriginRow, true);
              repositionWorldBlock(q.worldBlocks[1][1], q.blockOriginColumn + 1, q.blockOriginRow + 1, false);
              repositionWorldBlock(q.worldBlocks[1][2], q.blockOriginColumn + 1, q.blockOriginRow + 2, false);
            } else {
              if (1 === vc) {
                q.worldBlocks[0][0] = Vb;
                q.worldBlocks[0][1] = Tc;
                q.worldBlocks[0][2] = hd;
                q.worldBlocks[1][0] = id;
                q.worldBlocks[1][1] = jd;
                q.worldBlocks[1][2] = kd;
                q.worldBlocks[2][0] = $c;
                q.worldBlocks[2][1] = Gc;
                q.worldBlocks[2][2] = ad;
                repositionWorldBlock(q.worldBlocks[0][0], q.blockOriginColumn, q.blockOriginRow, false);
                repositionWorldBlock(q.worldBlocks[0][1], q.blockOriginColumn, q.blockOriginRow + 1, false);
                repositionWorldBlock(q.worldBlocks[0][2], q.blockOriginColumn, q.blockOriginRow + 2, false);
                repositionWorldBlock(q.worldBlocks[1][0], q.blockOriginColumn + 1, q.blockOriginRow, false);
                repositionWorldBlock(q.worldBlocks[1][1], q.blockOriginColumn + 1, q.blockOriginRow + 1, false);
                repositionWorldBlock(q.worldBlocks[1][2], q.blockOriginColumn + 1, q.blockOriginRow + 2, false);
              } else {
                q.blockOriginRow++;
                q.worldBlocks[0][0] = Tc;
                q.worldBlocks[0][1] = hd;
                q.worldBlocks[0][2] = Vb;
                q.worldBlocks[1][0] = jd;
                q.worldBlocks[1][1] = kd;
                q.worldBlocks[1][2] = id;
                q.worldBlocks[2][0] = Gc;
                q.worldBlocks[2][1] = ad;
                q.worldBlocks[2][2] = $c;
                repositionWorldBlock(q.worldBlocks[0][0], q.blockOriginColumn, q.blockOriginRow, false);
                repositionWorldBlock(q.worldBlocks[0][1], q.blockOriginColumn, q.blockOriginRow + 1, false);
                repositionWorldBlock(q.worldBlocks[0][2], q.blockOriginColumn, q.blockOriginRow + 2, true);
                repositionWorldBlock(q.worldBlocks[1][0], q.blockOriginColumn + 1, q.blockOriginRow, false);
                repositionWorldBlock(q.worldBlocks[1][1], q.blockOriginColumn + 1, q.blockOriginRow + 1, false);
                repositionWorldBlock(q.worldBlocks[1][2], q.blockOriginColumn + 1, q.blockOriginRow + 2, true);
              }
            }
            repositionWorldBlock(q.worldBlocks[2][0], q.blockOriginColumn + 2, q.blockOriginRow, true);
            repositionWorldBlock(q.worldBlocks[2][1], q.blockOriginColumn + 2, q.blockOriginRow + 1, true);
            repositionWorldBlock(q.worldBlocks[2][2], q.blockOriginColumn + 2, q.blockOriginRow + 2, true);
          }
        }
        pe = true;
      } else {
        console.log("Failed to find new center block!");
        pe = false;
      }
      if (!pe) {
        console.log("Bug: party not contained by block grid. fixing.");
        var eg = q.vw(q.worldCenterX),
          hc = q.ww(q.worldCenterY);
        console.log("old: blockShiftCol=" + q.blockOriginColumn + " blockShiftRow=" + q.blockOriginRow);
        q.blockOriginColumn = eg - 1;
        q.blockOriginRow = hc - 1;
        console.log("new: blockShiftCol=" + q.blockOriginColumn + " blockShiftRow=" + q.blockOriginRow);
        repositionWorldBlock(q.worldBlocks[0][0], q.blockOriginColumn, q.blockOriginRow, true);
        repositionWorldBlock(q.worldBlocks[0][1], q.blockOriginColumn, q.blockOriginRow + 1, true);
        repositionWorldBlock(q.worldBlocks[0][2], q.blockOriginColumn, q.blockOriginRow + 2, true);
        repositionWorldBlock(q.worldBlocks[1][0], q.blockOriginColumn + 1, q.blockOriginRow, true);
        repositionWorldBlock(q.worldBlocks[1][1], q.blockOriginColumn + 1, q.blockOriginRow + 1, true);
        repositionWorldBlock(q.worldBlocks[1][2], q.blockOriginColumn + 1, q.blockOriginRow + 2, true);
        repositionWorldBlock(q.worldBlocks[2][0], q.blockOriginColumn + 2, q.blockOriginRow, true);
        repositionWorldBlock(q.worldBlocks[2][1], q.blockOriginColumn + 2, q.blockOriginRow + 1, true);
        repositionWorldBlock(q.worldBlocks[2][2], q.blockOriginColumn + 2, q.blockOriginRow + 2, true);
        var re = q.worldBlocks[1][1];
        if (!worldBlockContains(re, q.worldCenterX, q.worldCenterY)) {
          console.log("Failed to fix world block grid issue.");
          console.log("posX: " + q.worldCenterX + " posY: " + q.worldCenterY);
          console.log("minX: " + re.pixelLeft + " maxX: " + re.pixelRight);
          console.log("minY: " + re.pixelTop + " maxY: " + re.pixelBottom);
        }
      }
    }
  } else {
    for (uc = 0; uc < U.length; uc++) {
      Z += U[uc].position.getLevelPositionX();
      $ += U[uc].position.getLevelPositionY();
    }
    var of = $ / U.length,
      wd = game.level;
    wd.centerX = Z / U.length;
    wd.centerY = of;
  }
}
export function positionScrollCaster(a) {
  a = 30 + 126 * a;
  var b = game.viewportHeight - 80;
  setVector(game.state.scrollCaster.position.levelPosition, game.level.centerX + (0.5 * (a - game.viewportHalfWidth) + (b - game.viewportHalfHeight)) | 0, game.level.centerY + (b - game.viewportHalfHeight - 0.5 * (a - game.viewportHalfWidth)) | 0);
}
export function updateCharacterBehaviors(a) {
  var b, c;
  for (b = 0; b < a.length; b++) {
    c = a[b];
    if (!c.isDead) {
      if (c.effects.isDisabled) {
        c.actionType = IDLE_ACTION;
      } else {
        c.dr();
      }
    }
  }
}
export function showDeathEffect(a) {
  a = game.worldActive ? a.position.worldPosition : a.position.levelPosition;
  addVisualEffect(game.effects, new VisualEffect("Red Splat", a, a, false, 1));
}
export function purchaseDungeonFarm(a, b) {
  if (!(game.state.party.gold < b)) {
    recordGameEvent("Dungeon", "Farm Purchased");
    spendGold(b);
    a.isFarm = true;
    a.farmStartTurn = game.state.turnNumber;
    registerDungeonFarm(a);
    var c = game.farms,
      d = c.Yw(a.getWorldColumn()),
      f = c.Yw(a.getWorldRow());
    registerFarm(c, new Farm(a.dungeonId, d, f));
    game.state.statisticsRecorder.recordFarmPurchased();
  }
}
export function initializeSimulationTick() {}
