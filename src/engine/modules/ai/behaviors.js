/** 冒险者行为优先级、移动、拾取和施法策略。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { clearMovementTarget, setWorldDestination } from "../characters/movement.js";
import { CAST_ACTION_TYPE, IDLE_ACTION, MELEE_ACTION_TYPE, approachValue, choosePointNearTarget, findNearbyOpponent, findNearestVisibleOpponent, findRouteToDoor, findRouteToRoom, hasOpponentsInRoom, selectScrollTarget } from "./targeting.js";
import { getAllies, getFriendlyTargets, getOpponents } from "../combat/encounters.js";
import { clampPointToRoom, isPointNearDoor, roomBottomPixels, roomLeftPixels, roomRightPixels, roomTopPixels } from "../world/rooms.js";
import { Vector2, addVector, assignVector, distanceSquaredToPoint, distanceToPoint, multiplyVector, normalizeVector, randomInt, setVector, subtractVector } from "../core/math.js";
import { canAttack, countSummonedMinions, isAdventurerOrMinion, markAttackTurn } from "../characters/character.js";
import { forcePartyDestination, isPartyTravelling } from "../characters/party.js";
import { freeSpellsModifier } from "../content/balance.js";
import { getSpellSpiritCost, statValue } from "../characters/stats.js";
import { MELEE_ATTACK_RANGE, RANGED_ATTACK_RANGE, RANGED_MIN_DISTANCE } from "../content/classes.js";
import { showFloatingText } from "../rendering/floating-text.js";
import { isSpellReady } from "../combat/scrolls.js";
import { getRoomTreasure } from "../loot/treasure.js";
export function BehaviorQueue() {
  this.fo = [];
}
export function IdleBehavior(a) {
  this.kB = a;
  this.Al = null;
}
export function ExploreDungeonBehavior() {
  this.ka = 10;
  this.Da = null;
  this.SB = 0;
  this.un = null;
  this.bb = 100;
  this.Yt = false;
}
export function FollowLeaderBehavior() {
  this.ka = 100;
  this.zE = RANGED_MIN_DISTANCE;
  this.AD = 0.8;
  this.Uq = null;
}
export function RangedAttackBehavior(a, b, c) {
  this.ka = c;
  this.Fa = null;
  this.CA = a;
  this.bb = b;
  this.fn = new Vector2();
  this.Jl = new Vector2();
  this.co = this.ax = 0;
}
export function MeleeAttackBehavior(a, b, c, d) {
  this.ka = b;
  this.Fa = null;
  this.Ng = 0;
  this.bb = a;
  this.qk = c;
  this.YD = d;
}
export function LootGoldBehavior(a) {
  this.Hn = null;
  this.ka = a;
  this.bb = 10;
}
export function OpportunisticAttackBehavior(a) {
  this.ka = a;
  this.Fa = null;
  this.Ng = 0;
  this.bb = RANGED_ATTACK_RANGE;
  this.qk = MELEE_ACTION_TYPE;
}
export function LootItemBehavior(a) {
  this.Dn = null;
  this.ka = a;
  this.bb = 10;
}
export function LootScrollBehavior(a) {
  this.on = null;
  this.ka = a;
  this.bb = 10;
}
export function GuardRangedBehavior(a, b, c) {
  this.Vq = new RangedAttackBehavior(a, b, c);
}
export function TargetSpellBehavior(a, b) {
  this.ka = b;
  this.Fa = this.Vi = null;
  this.Ng = 0;
  this.bb = a;
}
export function HealBehavior(a, b) {
  this.fm = null;
  this.ka = b;
  this.bb = a;
}
export function ApplyEffectBehavior(a, b, c) {
  this.gm = null;
  this.X = c;
  this.ka = b;
  this.bb = a;
}
export function AreaDamageBehavior(a, b) {
  this.Zl = null;
  this.ka = b;
  this.bb = a;
}
export function ChainDamageBehavior(a, b) {
  this.In = null;
  this.ka = b;
  this.bb = a;
}
export function SummonBehavior(a, b, c) {
  this.zd = null;
  this.ga = c;
  this.ka = b;
  this.bb = a;
}
export function LifeDrainBehavior(a, b) {
  this.ka = b;
  this.bb = a;
  this.Lm = null;
}
export function ReviveBehavior(a, b) {
  this.ka = b;
  this.bb = a;
  this.pn = null;
}
export function PartyBuffBehavior(a, b, c) {
  this.ka = c;
  this.bb = a;
  this.X = b;
  this.zd = null;
}
export function WaitBehavior() {
  this.eo = 2;
}
export function hasForcedDestination(a) {
  var b;
  return (b = game.state.party.gn) ? a.p.Cc === b ? false : true : false;
}
export function LootChestBehavior(a) {
  this.Wm = null;
  this.ka = a;
  this.Yt = true;
  this.bb = 10;
}
export function hasPendingLoot() {
  return 0 < game.goldDrops.pe.length || 0 < game.itemDrops.yf.length || 0 < game.scrollDrops.kf.length;
}
export function LootPotionBehavior(a) {
  this.pm = null;
  this.ka = a;
  this.Yt = true;
  this.bb = 10;
}
export function UseShopBehavior(a, b) {
  this.Mi = game.tileSize + 5;
  this.ka = a;
  this.il = b;
  this.qd = null;
  this.Wy = 0;
}
export function EnterDungeonBehavior(a, b) {
  this.Mi = game.tileSize + 5;
  this.ka = a;
  this.il = b;
  this.bd = null;
  this.Zy = 0;
}
export function EnterCastleBehavior(a, b) {
  this.Mi = game.tileSize + 5;
  this.ka = a;
  this.il = b;
  this.ad = null;
  this.Yy = 0;
}
export function TravelWorldBehavior(a, b) {
  this.Mi = game.tileSize + 5;
  this.ka = a;
  this.il = b;
  this.$c = null;
  this.Xy = 0;
}
export function ChangeFloorBehavior() {
  this.Mi = game.tileSize + 1;
  this.ka = 90;
  this.lc = null;
}
export function SelfSpellBehavior(a) {
  this.Sc = null;
  this.ka = a;
  this.bb = 10;
}
export function AreaSpellBehavior(a, b, c) {
  this.Sc = null;
  this.KE = c;
  this.ka = b;
  this.bb = a;
}
export function CompanionSpellBehavior(a, b) {
  this.Sc = null;
  this.ka = b;
  this.bb = a;
}
export function CooldownBehavior(a, b) {
  this.ka = b;
  this.Uw = a;
}
export function SpecialAttackBehavior(a, b, c, d) {
  this.ka = c;
  this.Fa = null;
  this.Ng = 0;
  this.bb = a;
  this.Uw = b;
  this.qk = d;
}
export function StunnedBehavior(a) {
  this.eo = a;
}
export function initializeAiBehaviors() {
  BehaviorQueue.prototype.dr = function (a) {
    if (game.worldActive) {
      this.ou(a);
    } else {
      this.nu(a);
    }
  };
  BehaviorQueue.prototype.ou = function (a) {
    var b, c;
    b = game.state.party;
    c = b.Lf;
    var d = b.ge,
      f = b.Wb;
    if (c || f || d) {
      if (a === game.state.leader) {
        if (c) {
          if (b = c.iq, c = c.jq, d = game.world.hb(b, c)) {
            b = a.p;
            if (game.world.hb(game.world.bc(b.dc()), game.world.cc(b.ec())) === d) {
              a.Y = 10;
            } else {
              setWorldDestination(b, d.bc(), d.cc());
              a.Y = 1;
            }
            return;
          }
        } else if (d) {
          if (b = d.dm, c = d.em, d = game.world.hb(b, c)) {
            b = a.p;
            if (game.world.hb(game.world.bc(b.dc()), game.world.cc(b.ec())) === d) {
              a.Y = 11;
            } else {
              setWorldDestination(b, d.bc(), d.cc());
              a.Y = 1;
            }
            return;
          }
        } else if (b = f.bc(), c = f.cc(), d = game.world.hb(b, c)) {
          b = a.p;
          if (game.world.hb(game.world.bc(b.dc()), game.world.cc(b.ec())) === d) {
            a.Y = 9;
          } else {
            setWorldDestination(b, d.bc(), d.cc());
            a.Y = 1;
          }
          return;
        }
        d = a.p;
        if (d.dd || a.Y === IDLE_ACTION) {
          setWorldDestination(d, b, c);
          a.Y = 1;
          d.dd = false;
        }
      } else {
        b = getAllies();
        c = b.indexOf(a);
        b = 1 === a.characterType ? a.summoner : 0 > c ? game.state.leader : b[c - 1];
        setWorldDestination(a.p, game.world.bc(b.p.dc()), game.world.cc(b.p.ec()));
        a.Y = 1;
      }
    } else {
      a.Y = IDLE_ACTION;
    }
  };
  BehaviorQueue.prototype.nu = function (a) {
    a.Y = IDLE_ACTION;
    a.rh = null;
    a.Da = null;
    a.bj = null;
    a.Ue = null;
    a.ld = null;
    a.Zh = null;
    a.hk = null;
    var b,
      c = 0,
      d,
      f = null,
      g;
    for (b = 0; b < this.fo.length && !(d = this.fo[b], d.Ta() > c && (g = d.wd(a), g > c && (c = g, f = d), 100 <= c)); b++) {}
    if (f) {
      f.od(a);
    }
  };
  BehaviorQueue.prototype.Oa = function (a) {
    var b;
    for (b = 0; b < this.fo.length; b++) {
      this.fo[b].Oa(a);
    }
  };
  IdleBehavior.prototype.Wa = function () {};
  IdleBehavior.prototype.Oa = function () {};
  IdleBehavior.prototype.od = function (a) {
    var b = a.p,
      c = b.w;
    if (c) {
      if (b.dd || this.Al != c) {
        this.Al = c;
        var d = roomTopPixels(c) + game.tileSize,
          f = (c.heightInTiles - 1) * game.tileSize;
        setVector(b.Qb, roomLeftPixels(c) + game.tileSize + randomInt((c.widthInTiles - 1) * game.tileSize), d + randomInt(f));
        b.dd = false;
      }
      a.Y = 1;
    }
  };
  IdleBehavior.prototype.wd = function (a) {
    return a.p.w ? this.kB : 0;
  };
  IdleBehavior.prototype.Ta = function () {
    return this.kB;
  };
  ExploreDungeonBehavior.prototype.Wa = function () {
    this.Da = this.un = null;
  };
  ExploreDungeonBehavior.prototype.Oa = function () {};
  ExploreDungeonBehavior.prototype.od = function (a) {
    if (this.Da && this.un) {
      a.Cb(this.Da);
      var b = a.p;
      this.SB = a === this.Da ? 0 : b.u.ac(this.Da.p.u);
      if (this.SB <= this.bb) {
        if (!this.Yt && !canAttack(a)) {
          return;
        }
        markAttackTurn(a);
        this.un.mq = game.state.turnNumber;
        a.ld = this.un;
        a.Y = CAST_ACTION_TYPE;
        this.Kp(a);
      } else {
        assignVector(b.Qb, this.Da.p.u);
        a.Y = 1;
      }
      clearMovementTarget(b);
      if ((b = a.p.w) && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
    }
  };
  ExploreDungeonBehavior.prototype.Kp = function () {};
  ExploreDungeonBehavior.prototype.wd = function (a) {
    var b = a.p.w;
    if (!b || !this.Wd(a)) {
      return 0;
    }
    if (!freeSpellsModifier.t) {
      var c = a.stats,
        d = c.spirit,
        c = getSpellSpiritCost(c);
      if (d < c) {
        return 0;
      }
    }
    this.Da = this.Td(a);
    return this.Da && this.Da.p.w === b ? (this.un = this.Md()) ? this.Jd(a) : 0 : 0;
  };
  ExploreDungeonBehavior.prototype.Wd = function () {
    return true;
  };
  ExploreDungeonBehavior.prototype.Jd = function () {
    return 0;
  };
  ExploreDungeonBehavior.prototype.Md = function () {
    return null;
  };
  ExploreDungeonBehavior.prototype.Td = function () {
    return null;
  };
  ExploreDungeonBehavior.prototype.Ta = function () {
    return this.ka;
  };
  FollowLeaderBehavior.prototype.Wa = function () {};
  FollowLeaderBehavior.prototype.Oa = function () {};
  FollowLeaderBehavior.prototype.od = function (a) {
    if (this.Uq) {
      var b = a.p.w;
      if (a.p.dd) {
        if (!b) {
          return;
        }
        this.vx(a);
      }
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
      a.Y = 1;
      a.p.dd = false;
      if (0 === game.state.turnNumber % 2) {
        showFloatingText(game.floatingText, a, "快逃!", "yellow");
      }
    }
  };
  FollowLeaderBehavior.prototype.vx = function (a) {
    var b = randomInt(3);
    a = a.p;
    var c = a.w,
      d = roomLeftPixels(c),
      f = roomTopPixels(c),
      g = roomRightPixels(c),
      c = roomBottomPixels(c);
    if (0 === b) {
      setVector(a.Qb, d + 1, f + 1);
    } else {
      if (1 === b) {
        setVector(a.Qb, g - 1, f + 1);
      } else {
        if (2 === b) {
          setVector(a.Qb, d + 1, c - 1);
        } else {
          setVector(a.Qb, g - 1, c - 1);
        }
      }
    }
  };
  FollowLeaderBehavior.prototype.wd = function (a) {
    var b = a.stats.health / statValue(a.stats.maxHealth);
    if (b > this.AD) {
      return 0;
    }
    var c;
    a: {
      c = getOpponents(a);
      var d, f;
      for (f = 0; f < c.length; f++) {
        if (d = c[f], a !== d && d.Da === a) {
          c = d;
          break a;
        }
      }
      c = null;
    }
    this.Uq = c;
    return !this.Uq || a.p.u.ac(this.Uq.p.u) > this.zE ? 0 : (1 - b) * this.ka;
  };
  FollowLeaderBehavior.prototype.Ta = function () {
    return this.ka;
  };
  RangedAttackBehavior.prototype.Wa = function () {
    this.co = this.ax = 0;
    this.Fa = null;
  };
  RangedAttackBehavior.prototype.Oa = function () {};
  RangedAttackBehavior.prototype.od = function (a) {
    if (this.ax == game.state.turnNumber - 1) {
      this.co++;
    } else {
      this.co = 0;
    }
    if (this.Fa && !(this.Fa.Va || this.Fa.Ja.Kd || this.Fa.Ja.bi) && this.vx(a)) {
      this.ax = game.state.turnNumber;
      var b = a.p.w;
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
      a.Y = 1;
      a.p.dd = false;
    }
  };
  RangedAttackBehavior.prototype.vx = function (a) {
    var b = a.p,
      c = b.u,
      d = b.w,
      f = roomLeftPixels(d),
      g = roomTopPixels(d),
      h = roomRightPixels(d),
      l = roomBottomPixels(d);
    a = getOpponents(a);
    var n,
      p,
      s,
      u = 0;
    setVector(this.fn, 0, 0);
    setVector(this.Jl, 0, 0);
    for (s = 0; s < a.length; s++) {
      n = a[s];
      if (!(n.Va || n.Ja.Kd || n.Ja.bi || n.p.w != d)) {
        p = n.p.u;
        n = c.ac(p);
        if (!(n > this.CA)) {
          if (0 === n) {
            setVector(this.fn, Math.random(), Math.random());
          } else {
            assignVector(this.fn, c);
            subtractVector(this.fn, p);
            multiplyVector(this.fn, 1 / n);
          }
          addVector(this.Jl, this.fn);
          u++;
        }
      }
    }
    if (0 === u) {
      return false;
    }
    normalizeVector(this.Jl);
    multiplyVector(this.Jl, this.bb);
    addVector(this.Jl, c);
    c = this.Jl.x;
    d = this.Jl.y;
    if (c < f) {
      c = f;
    } else {
      if (c > h) {
        c = h;
      }
    }
    if (d < g) {
      d = g;
    } else {
      if (d > l) {
        d = l;
      }
    }
    setVector(b.Qb, c, d);
    return true;
  };
  RangedAttackBehavior.prototype.wd = function (a) {
    this.Fa = findNearestVisibleOpponent(a);
    return this.Fa ? 2 < this.co ? this.co = 0 : a.p.u.ac(this.Fa.p.u) > this.CA ? 0 : this.ka : 0;
  };
  RangedAttackBehavior.prototype.Ta = function () {
    return this.ka;
  };
  MeleeAttackBehavior.prototype.Wa = function () {};
  MeleeAttackBehavior.prototype.Oa = function () {};
  MeleeAttackBehavior.prototype.od = function (a) {
    if (this.Fa && !this.Fa.Va) {
      a.Cb(this.Fa);
      if (this.Ng <= this.bb) {
        if (!canAttack(a)) {
          return;
        }
        markAttackTurn(a);
        a.Y = this.qk;
      } else {
        choosePointNearTarget(a.p.Qb, this.Fa.p.u, a.p.w);
        a.Y = 1;
      }
      var b = a.p.w;
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
      clearMovementTarget(a.p);
    }
  };
  MeleeAttackBehavior.prototype.wd = function (a) {
    if (!a.p.w) {
      return 0;
    }
    this.Fa = this.YD ? findNearbyOpponent(a) : selectScrollTarget(a);
    if (!this.Fa) {
      return 0;
    }
    this.Ng = a.p.u.ac(this.Fa.p.u);
    return this.ka;
  };
  MeleeAttackBehavior.prototype.Ta = function () {
    return this.ka;
  };
  LootGoldBehavior.prototype = new ExploreDungeonBehavior();
  LootGoldBehavior.prototype.Wa = function () {
    this.Hn = null;
  };
  LootGoldBehavior.prototype.Oa = function (a) {
    if (!(this.Hn || 10 !== a.X)) {
      this.Hn = a;
    }
  };
  LootGoldBehavior.prototype.Kp = function (a) {
    var b;
    switch (randomInt(8)) {
      case 0:
        b = "嘿,傻兮兮的头!";
        break;
      case 1:
        b = "榆木脑袋!";
        break;
      case 2:
        b = "哟!屌丝!";
        break;
      case 3:
        b = "愚蠢的怪物!";
        break;
      case 4:
        b = "你弱爆了!";
        break;
      case 5:
        b = "屌丝!";
        break;
      case 6:
        b = "胆小鬼!";
        break;
      default:
        b = "嘿,蠢货!";
    }
    showFloatingText(game.floatingText, a, b, "white");
  };
  LootGoldBehavior.prototype.Wd = function () {
    return this.Hn && isSpellReady(this.Hn);
  };
  LootGoldBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  LootGoldBehavior.prototype.Md = function () {
    return this.Hn;
  };
  LootGoldBehavior.prototype.Td = function (a) {
    if (a.Ja.Gn || !hasOpponentsInRoom(a, a.p.w)) {
      return null;
    }
    var b = a.stats;
    return 0.8 > b.health / statValue(b.maxHealth) ? null : a;
  };
  OpportunisticAttackBehavior.prototype.Wa = function () {
    this.Fa = null;
    this.Ng = 0;
  };
  OpportunisticAttackBehavior.prototype.Oa = function () {};
  OpportunisticAttackBehavior.prototype.od = function (a) {
    if (this.Fa && !this.Fa.Va) {
      a.Cb(this.Fa);
      if (this.Ng <= this.bb) {
        if (!canAttack(a)) {
          return;
        }
        markAttackTurn(a);
        a.Y = this.qk;
      } else {
        choosePointNearTarget(a.p.Qb, this.Fa.p.u, a.p.w);
        a.Y = 1;
      }
      var b = a.p.w;
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
      clearMovementTarget(a.p);
    }
  };
  OpportunisticAttackBehavior.prototype.wd = function (a) {
    this.Fa = selectScrollTarget(a);
    if (!this.Fa) {
      return 0;
    }
    if (a.Ja.wg) {
      this.bb = MELEE_ATTACK_RANGE;
      this.qk = 2;
    } else {
      this.bb = RANGED_ATTACK_RANGE;
      this.qk = MELEE_ACTION_TYPE;
    }
    this.Ng = a.p.u.ac(this.Fa.p.u);
    return this.ka;
  };
  OpportunisticAttackBehavior.prototype.Ta = function () {
    return this.ka;
  };
  LootItemBehavior.prototype = new ExploreDungeonBehavior();
  LootItemBehavior.prototype.Wa = function () {
    this.Dn = null;
  };
  LootItemBehavior.prototype.Oa = function (a) {
    if (!(this.Dn || 11 !== a.X)) {
      this.Dn = a;
    }
  };
  LootItemBehavior.prototype.Kp = function () {};
  LootItemBehavior.prototype.Wd = function () {
    return this.Dn && isSpellReady(this.Dn);
  };
  LootItemBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  LootItemBehavior.prototype.Md = function () {
    return this.Dn;
  };
  LootItemBehavior.prototype.Td = function (a) {
    return a.Ja.wg || !hasOpponentsInRoom(a, a.p.w) ? null : a;
  };
  LootScrollBehavior.prototype = new ExploreDungeonBehavior();
  LootScrollBehavior.prototype.Wa = function () {
    this.on = null;
  };
  LootScrollBehavior.prototype.Oa = function (a) {
    if (!(this.on || 12 !== a.X)) {
      this.on = a;
    }
  };
  LootScrollBehavior.prototype.Kp = function (a) {
    var b;
    switch (randomInt(8)) {
      case 0:
        b = "杀戮!";
        break;
      case 1:
        b = "去死!";
        break;
      case 2:
        b = "万物皆杀!";
        break;
      case 3:
        b = "啊啊啊啊啊!";
        break;
      case 4:
        b = "凶手!";
        break;
      case 5:
        b = "怒了!";
        break;
      case 6:
        b = "我真的怒了.";
        break;
      default:
        b = "杀!";
    }
    showFloatingText(game.floatingText, a, b, "white");
  };
  LootScrollBehavior.prototype.Wd = function () {
    return this.on && isSpellReady(this.on);
  };
  LootScrollBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  LootScrollBehavior.prototype.Md = function () {
    return this.on;
  };
  LootScrollBehavior.prototype.Td = function (a) {
    return a.Ja.Vs || !hasOpponentsInRoom(a, a.p.w) ? null : a;
  };
  GuardRangedBehavior.prototype.Wa = function () {
    this.Vq.Wa();
  };
  GuardRangedBehavior.prototype.Oa = function () {};
  GuardRangedBehavior.prototype.od = function (a) {
    this.Vq.od(a);
  };
  GuardRangedBehavior.prototype.wd = function (a) {
    return a.Ja.wg ? 0 : this.Vq.wd(a);
  };
  GuardRangedBehavior.prototype.Ta = function () {
    return this.Vq.Ta();
  };
  TargetSpellBehavior.prototype.Wa = function () {
    this.Vi = null;
  };
  TargetSpellBehavior.prototype.Ta = function () {
    return this.ka;
  };
  TargetSpellBehavior.prototype.Oa = function (a) {
    if (!(this.Vi || 6 !== a.ga)) {
      this.Vi = a;
    }
  };
  TargetSpellBehavior.prototype.od = function (a) {
    if (this.Vi && canAttack(a) && isSpellReady(this.Vi)) {
      if (a.Cb(this.Fa), this.Ng <= this.bb) {
        if (canAttack(a)) {
          markAttackTurn(a);
          this.Vi.mq = game.state.turnNumber;
          a.ld = this.Vi;
          a.Y = CAST_ACTION_TYPE;
          clearMovementTarget(a.p);
          var b = a.p.w;
          if (b && isAdventurerOrMinion(a)) {
            forcePartyDestination(b);
          }
        }
      } else {
        assignVector(a.p.Qb, this.Fa.p.u);
        a.Y = 1;
      }
    }
  };
  TargetSpellBehavior.prototype.wd = function (a) {
    if (!this.Vi || !isSpellReady(this.Vi) || !a.p.w) {
      return 0;
    }
    if (!freeSpellsModifier.t) {
      var b = a.stats,
        c = b.spirit,
        b = getSpellSpiritCost(b);
      if (c < b) {
        return 0;
      }
    }
    return (this.Fa = selectScrollTarget(a)) ? this.ka : 0;
  };
  HealBehavior.prototype = new ExploreDungeonBehavior();
  HealBehavior.prototype.Wa = function () {
    this.fm = null;
  };
  HealBehavior.prototype.Oa = function (a) {
    if (!(this.fm || 5 !== a.ga)) {
      this.fm = a;
    }
  };
  HealBehavior.prototype.Wd = function () {
    return this.fm && isSpellReady(this.fm);
  };
  HealBehavior.prototype.Md = function () {
    return this.fm;
  };
  HealBehavior.prototype.Jd = function (a) {
    a = getOpponents(a);
    return 0 === a.length ? 0 : Math.min(this.Ta(), 5 / a.length * this.Ta());
  };
  HealBehavior.prototype.Td = function (a) {
    return selectScrollTarget(a);
  };
  ApplyEffectBehavior.prototype = new ExploreDungeonBehavior();
  ApplyEffectBehavior.prototype.Wa = function () {
    this.gm = null;
  };
  ApplyEffectBehavior.prototype.Oa = function (a) {
    if (!(this.gm || a.X !== this.X)) {
      this.gm = a;
    }
  };
  ApplyEffectBehavior.prototype.Wd = function () {
    return this.gm && isSpellReady(this.gm);
  };
  ApplyEffectBehavior.prototype.Md = function () {
    return this.gm;
  };
  ApplyEffectBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  ApplyEffectBehavior.prototype.Td = function (a) {
    return selectScrollTarget(a);
  };
  AreaDamageBehavior.prototype = new ExploreDungeonBehavior();
  AreaDamageBehavior.prototype.Wa = function () {
    this.Zl = null;
  };
  AreaDamageBehavior.prototype.Oa = function (a) {
    if (!(this.Zl || 8 !== a.ga)) {
      this.Zl = a;
    }
  };
  AreaDamageBehavior.prototype.Wd = function () {
    return this.Zl && isSpellReady(this.Zl);
  };
  AreaDamageBehavior.prototype.Md = function () {
    return this.Zl;
  };
  AreaDamageBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  AreaDamageBehavior.prototype.Td = function (a) {
    return selectScrollTarget(a);
  };
  ChainDamageBehavior.prototype = new ExploreDungeonBehavior();
  ChainDamageBehavior.prototype.Wa = function () {
    this.In = null;
  };
  ChainDamageBehavior.prototype.Oa = function (a) {
    if (!(this.In || 12 !== a.ga)) {
      this.In = a;
    }
  };
  ChainDamageBehavior.prototype.Wd = function () {
    return this.In && isSpellReady(this.In);
  };
  ChainDamageBehavior.prototype.Md = function () {
    return this.In;
  };
  ChainDamageBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  ChainDamageBehavior.prototype.Td = function (a) {
    return selectScrollTarget(a);
  };
  SummonBehavior.prototype = new ExploreDungeonBehavior();
  SummonBehavior.prototype.Wa = function () {
    this.zd = null;
  };
  SummonBehavior.prototype.Oa = function (a) {
    if (!(this.zd || a.ga !== this.ga)) {
      this.zd = a;
    }
  };
  SummonBehavior.prototype.Wd = function () {
    return this.zd && isSpellReady(this.zd);
  };
  SummonBehavior.prototype.Md = function () {
    return this.zd;
  };
  SummonBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  SummonBehavior.prototype.Td = function (a) {
    return selectScrollTarget(a);
  };
  LifeDrainBehavior.prototype = new ExploreDungeonBehavior();
  LifeDrainBehavior.prototype.Wa = function () {
    this.Lm = null;
  };
  LifeDrainBehavior.prototype.Oa = function (a) {
    if (!(this.Lm || 1 !== a.ga)) {
      this.Lm = a;
    }
  };
  LifeDrainBehavior.prototype.Jd = function () {
    var a = this.Da;
    return Math.max(0, (1 - a.stats.health / statValue(a.stats.maxHealth)) * this.Ta());
  };
  LifeDrainBehavior.prototype.Wd = function () {
    return this.Lm && isSpellReady(this.Lm);
  };
  LifeDrainBehavior.prototype.Md = function () {
    return this.Lm;
  };
  LifeDrainBehavior.prototype.Td = function (a) {
    var b = null,
      c = 1,
      d = getFriendlyTargets(a),
      f,
      g,
      h;
    for (a = 0; a < d.length; a++) {
      if (f = d[a], h = f.stats, g = h.health, h = statValue(h.maxHealth), g !== h && (g /= h, !b || g < c)) {
        c = g;
        b = f;
      }
    }
    return 0.9 < c ? null : b;
  };
  ReviveBehavior.prototype = new ExploreDungeonBehavior();
  ReviveBehavior.prototype.Wa = function () {
    this.pn = null;
  };
  ReviveBehavior.prototype.Oa = function (a) {
    if (!(this.pn || 16 !== a.ga)) {
      this.pn = a;
    }
  };
  ReviveBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  ReviveBehavior.prototype.Wd = function () {
    return this.pn && isSpellReady(this.pn);
  };
  ReviveBehavior.prototype.Md = function () {
    return this.pn;
  };
  ReviveBehavior.prototype.Td = function (a) {
    var b,
      c = game.state.adventurers,
      d;
    for (b = 0; b < c.length; b++) {
      if (d = c[b], d !== a && d.Ja.Kf) {
        return d;
      }
    }
    return null;
  };
  PartyBuffBehavior.prototype = new ExploreDungeonBehavior();
  PartyBuffBehavior.prototype.Wa = function () {
    this.zd = null;
  };
  PartyBuffBehavior.prototype.Oa = function (a) {
    if (!(this.zd || a.X !== this.X)) {
      this.zd = a;
    }
  };
  PartyBuffBehavior.prototype.Wd = function () {
    return this.zd && isSpellReady(this.zd);
  };
  PartyBuffBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  PartyBuffBehavior.prototype.Md = function () {
    return this.zd;
  };
  PartyBuffBehavior.prototype.Td = function (a) {
    return a;
  };
  WaitBehavior.prototype.Wa = function () {};
  WaitBehavior.prototype.Oa = function () {};
  WaitBehavior.prototype.od = function (a) {
    if (!isPartyTravelling(game.state.party) || !hasForcedDestination(a)) {
      var b = game.state.party,
        c = b.Cc,
        d = b.Bc,
        b = b.ed,
        f = a.p;
      if (d && d != f.Bc) {
        var g = findRouteToDoor(a, d);
        f.Ug = g;
        f.dd = false;
      } else {
        if (b && b != f.ed) {
          g = findRouteToRoom(a, b.$d);
          f.Ug = g;
          f.dd = false;
        } else {
          if (c && c != f.Cc) {
            g = findRouteToRoom(a, c);
            f.Ug = g;
            f.dd = false;
          }
        }
      }
      f.et(d);
      f.Cc = c;
      f.rB(b);
      if (d) {
        setVector(f.Qb, d.me, d.ne);
        a.Y = 1;
      } else {
        if (b) {
          setVector(f.Qb, b.tq, b.uq);
          a.Y = 1;
        } else {
          if (c) {
            a.Y = 1;
          }
        }
      }
    }
  };
  WaitBehavior.prototype.wd = function (a) {
    if (game.worldActive || isPartyTravelling(game.state.party) && hasForcedDestination(a)) {
      return 0;
    }
    var b = getOpponents(a);
    return 0 < b.length && a.p.w === b[0].p.w ? 0 : this.eo;
  };
  WaitBehavior.prototype.Ta = function () {
    return this.eo;
  };
  LootChestBehavior.prototype = new ExploreDungeonBehavior();
  LootChestBehavior.prototype.Wa = function () {
    this.Wm = null;
  };
  LootChestBehavior.prototype.Oa = function (a) {
    if (!(this.Wm || 14 !== a.ga)) {
      this.Wm = a;
    }
  };
  LootChestBehavior.prototype.Wd = function () {
    return this.Wm && isSpellReady(this.Wm);
  };
  LootChestBehavior.prototype.Jd = function (a) {
    return hasOpponentsInRoom(a, a.p.w) ? 0 : hasPendingLoot() ? this.Ta() : 0;
  };
  LootChestBehavior.prototype.Md = function () {
    return this.Wm;
  };
  LootChestBehavior.prototype.Td = function (a) {
    return hasPendingLoot() ? a : null;
  };
  LootPotionBehavior.prototype = new ExploreDungeonBehavior();
  LootPotionBehavior.prototype.Wa = function () {
    this.pm = null;
  };
  LootPotionBehavior.prototype.Oa = function (a) {
    if (!(this.pm || 15 !== a.ga)) {
      this.pm = a;
    }
  };
  LootPotionBehavior.prototype.Wd = function () {
    return this.pm && isSpellReady(this.pm);
  };
  LootPotionBehavior.prototype.Jd = function (a) {
    var b = a.p.w;
    if (!b || hasOpponentsInRoom(a, b)) {
      return 0;
    }
    a = getRoomTreasure(game.treasure, b);
    return !a || a.Kg || a.el ? 0 : this.Ta();
  };
  LootPotionBehavior.prototype.Md = function () {
    return this.pm;
  };
  LootPotionBehavior.prototype.Td = function (a) {
    return a;
  };
  UseShopBehavior.prototype.Wa = function () {
    this.qd = null;
  };
  UseShopBehavior.prototype.Oa = function () {};
  UseShopBehavior.prototype.od = function (a) {
    if (this.qd) {
      if (this.qd.gc) {
        this.qd = null;
      } else if (this.qd.Zc == a) {
        a.rh = this.qd;
        if (distanceToPoint(a.p.u, this.qd.Xo, this.qd.Yo) < this.Mi) {
          a.Y = 5;
        } else {
          setVector(a.p.Qb, this.qd.Xo, this.qd.Yo);
          a.Y = 1;
        }
        clearMovementTarget(a.p);
        var b = a.p.w;
        if (b && isAdventurerOrMinion(a)) {
          forcePartyDestination(b);
        }
      }
    }
  };
  UseShopBehavior.prototype.wd = function (a) {
    var b = a.p.w;
    if (!b || hasOpponentsInRoom(a, b)) {
      return 0;
    }
    if (this.qd && this.qd.Zc === a) {
      this.qd.Re(null);
      this.qd.Se(0);
    }
    var b = game.goldDrops.pe,
      c,
      d,
      f = a.p.u,
      g = null,
      h,
      l = a.p.w,
      n = -1;
    if (l) {
      for (d = 0; d < b.length; d++) {
        c = b[d];
        if (!(c.gc || c.vD !== l)) {
          h = distanceSquaredToPoint(f, c.Xo, c.Yo);
          if (!(c.Zc && h > c.Ud() || !(0 > n || h < n))) {
            g = c;
            n = h;
          }
        }
      }
      if (this.qd = g) {
        this.qd.Re(a);
        this.qd.Se(n);
        this.Wy = Math.sqrt(n);
      }
    }
    return this.qd ? approachValue(this.ka, this.il, this.Wy) : 0;
  };
  UseShopBehavior.prototype.Ta = function () {
    return this.ka;
  };
  EnterDungeonBehavior.prototype.Wa = function () {
    this.bd = null;
  };
  EnterDungeonBehavior.prototype.Oa = function () {};
  EnterDungeonBehavior.prototype.od = function (a) {
    if (this.bd) {
      if (this.bd.gc) {
        this.bd = null;
      } else if (this.bd.Zc == a) {
        a.Zh = this.bd;
        if (distanceToPoint(a.p.u, this.bd.bq, this.bd.cq) < this.Mi) {
          a.Y = 7;
        } else {
          setVector(a.p.Qb, this.bd.bq, this.bd.cq);
          a.Y = 1;
        }
        clearMovementTarget(a.p);
        var b = a.p.w;
        if (b && isAdventurerOrMinion(a)) {
          forcePartyDestination(b);
        }
      }
    }
  };
  EnterDungeonBehavior.prototype.wd = function (a) {
    var b = a.p.w;
    if (!b || hasOpponentsInRoom(a, b)) {
      return 0;
    }
    if (this.bd && this.bd.Zc === a) {
      this.bd.Re(null);
      this.bd.Se(0);
    }
    var b = game.scrollDrops.kf,
      c,
      d,
      f = a.p.u,
      g = null,
      h,
      l = a.p.w,
      n = -1;
    if (l) {
      for (d = 0; d < b.length; d++) {
        c = b[d];
        if (!(c.gc || c.BE !== l)) {
          h = distanceSquaredToPoint(f, c.bq, c.cq);
          if (!(c.Zc && h > c.Ud() || !(0 > n || h < n))) {
            g = c;
            n = h;
          }
        }
      }
      if (this.bd = g) {
        this.bd.Re(a);
        this.bd.Se(n);
        this.Zy = Math.sqrt(n);
      }
    }
    return this.bd ? approachValue(this.ka, this.il, this.Zy) : 0;
  };
  EnterDungeonBehavior.prototype.Ta = function () {
    return this.ka;
  };
  EnterCastleBehavior.prototype.Wa = function () {
    this.ad = null;
  };
  EnterCastleBehavior.prototype.Oa = function () {};
  EnterCastleBehavior.prototype.od = function (a) {
    if (this.ad) {
      if (this.ad.gc) {
        this.ad = null;
      } else if (this.ad.Zc == a) {
        a.hk = this.ad;
        if (distanceToPoint(a.p.u, this.ad.Qp, this.ad.Rp) < this.Mi) {
          a.Y = 8;
        } else {
          setVector(a.p.Qb, this.ad.Qp, this.ad.Rp);
          a.Y = 1;
        }
        clearMovementTarget(a.p);
        var b = a.p.w;
        if (b && isAdventurerOrMinion(a)) {
          forcePartyDestination(b);
        }
      }
    }
  };
  EnterCastleBehavior.prototype.wd = function (a) {
    var b = a.p.w;
    if (!b || hasOpponentsInRoom(a, b)) {
      return 0;
    }
    if (this.ad && this.ad.Zc === a) {
      this.ad.Re(null);
      this.ad.Se(0);
    }
    var b = game.potionDrops.Hf,
      c,
      d,
      f = a.p.u,
      g = null,
      h,
      l = a.p.w,
      n = -1;
    if (l) {
      for (d = 0; d < b.length; d++) {
        c = b[d];
        if (!(c.gc || c.oE !== l)) {
          h = distanceSquaredToPoint(f, c.Qp, c.Rp);
          if (!(c.Zc && h > c.Ud() || !(0 > n || h < n))) {
            g = c;
            n = h;
          }
        }
      }
      if (this.ad = g) {
        this.ad.Re(a);
        this.ad.Se(n);
        this.Yy = Math.sqrt(n);
      }
    }
    return this.ad ? approachValue(this.ka, this.il, this.Yy) : 0;
  };
  EnterCastleBehavior.prototype.Ta = function () {
    return this.ka;
  };
  TravelWorldBehavior.prototype.Wa = function () {
    this.$c = null;
  };
  TravelWorldBehavior.prototype.Oa = function () {};
  TravelWorldBehavior.prototype.od = function (a) {
    if (this.$c) {
      if (this.$c.gc) {
        this.$c = null;
      } else if (this.$c.Zc == a) {
        a.bj = this.$c;
        if (distanceToPoint(a.p.u, this.$c.mp, this.$c.np) < this.Mi) {
          a.Y = 6;
        } else {
          setVector(a.p.Qb, this.$c.mp, this.$c.np);
          a.Y = 1;
        }
        clearMovementTarget(a.p);
        var b = a.p.w;
        if (b && isAdventurerOrMinion(a)) {
          forcePartyDestination(b);
        }
      }
    }
  };
  TravelWorldBehavior.prototype.wd = function (a) {
    var b = a.p.w;
    if (!b || hasOpponentsInRoom(a, b)) {
      return 0;
    }
    if (this.$c && this.$c.Zc === a) {
      this.$c.Re(null);
      this.$c.Se(0);
    }
    var b = game.itemDrops.yf,
      c,
      d,
      f = a.p.u,
      g = null,
      h,
      l = a.p.w,
      n = -1;
    if (l) {
      for (d = 0; d < b.length; d++) {
        c = b[d];
        if (!(c.gc || c.PD !== l)) {
          h = distanceSquaredToPoint(f, c.mp, c.np);
          if (!(c.Zc && h > c.Ud() || !(0 > n || h < n))) {
            g = c;
            n = h;
          }
        }
      }
      if (this.$c = g) {
        this.$c.Re(a);
        this.$c.Se(n);
        this.Xy = Math.sqrt(n);
      }
    }
    return this.$c ? approachValue(this.ka, this.il, this.Xy) : 0;
  };
  TravelWorldBehavior.prototype.Ta = function () {
    return this.ka;
  };
  ChangeFloorBehavior.prototype.Wa = function () {
    this.lc = null;
  };
  ChangeFloorBehavior.prototype.Oa = function () {};
  ChangeFloorBehavior.prototype.od = function (a) {
    if (this.lc && !this.lc.Kg) {
      a.hq(this.lc);
      if (distanceToPoint(a.p.u, this.lc.zq, this.lc.Aq) < this.Mi) {
        a.Y = 12;
      } else {
        setVector(a.p.Qb, this.lc.zq, this.lc.Aq);
        a.Y = 1;
      }
      clearMovementTarget(a.p);
      var b = a.p.w;
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
    }
  };
  ChangeFloorBehavior.prototype.wd = function (a) {
    var b = a.p.w;
    if (!b) {
      return 0;
    }
    this.lc = getRoomTreasure(game.treasure, b);
    return !this.lc || this.lc.Kg || !this.lc.el || hasOpponentsInRoom(a, b) ? 0 : this.ka;
  };
  ChangeFloorBehavior.prototype.Ta = function () {
    return this.ka;
  };
  SelfSpellBehavior.prototype = new ExploreDungeonBehavior();
  SelfSpellBehavior.prototype.Wa = function () {
    this.Sc = null;
  };
  SelfSpellBehavior.prototype.Oa = function (a) {
    if (!(this.Sc || 9 !== a.ga)) {
      this.Sc = a;
    }
  };
  SelfSpellBehavior.prototype.Kp = function (a) {
    showFloatingText(game.floatingText, a, "Protect me", "white");
  };
  SelfSpellBehavior.prototype.Wd = function (a) {
    return this.Sc && isSpellReady(this.Sc) && !a.companion ? true : false;
  };
  SelfSpellBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  SelfSpellBehavior.prototype.Md = function () {
    return this.Sc;
  };
  SelfSpellBehavior.prototype.Td = function (a) {
    return a;
  };
  AreaSpellBehavior.prototype = new ExploreDungeonBehavior();
  AreaSpellBehavior.prototype.Wa = function () {
    this.Sc = null;
  };
  AreaSpellBehavior.prototype.Oa = function (a) {
    if (!(this.Sc || a.ga !== this.KE)) {
      this.Sc = a;
    }
  };
  AreaSpellBehavior.prototype.Wd = function (a) {
    if (!this.Sc || !isSpellReady(this.Sc)) {
      return false;
    }
    var b = a.stats.maxSummonedMinions;
    return countSummonedMinions(a) < b;
  };
  AreaSpellBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  AreaSpellBehavior.prototype.Md = function () {
    return this.Sc;
  };
  AreaSpellBehavior.prototype.Td = function (a) {
    return a;
  };
  CompanionSpellBehavior.prototype = new ExploreDungeonBehavior();
  CompanionSpellBehavior.prototype.Wa = function () {
    this.Sc = null;
  };
  CompanionSpellBehavior.prototype.Oa = function (a) {
    if (!(this.Sc || 11 !== a.ga)) {
      this.Sc = a;
    }
  };
  CompanionSpellBehavior.prototype.Wd = function (a) {
    if (!this.Sc || !isSpellReady(this.Sc)) {
      return false;
    }
    var b = a.p.w;
    if (!b) {
      return false;
    }
    var c = game.monsters.Og;
    if (!c || 0 === c.length) {
      return false;
    }
    var d,
      f = false;
    for (d = 0; d < c.length; d++) {
      if (c[d].p.w === b) {
        f = true;
        break;
      }
    }
    if (!f) {
      return false;
    }
    b = a.stats.maxSummonedMinions;
    return countSummonedMinions(a) < b;
  };
  CompanionSpellBehavior.prototype.Jd = function () {
    return this.Ta();
  };
  CompanionSpellBehavior.prototype.Md = function () {
    return this.Sc;
  };
  CompanionSpellBehavior.prototype.Td = function (a) {
    var b = game.monsters.Og;
    if (0 === b.length) {
      return null;
    }
    var c = a.p.w;
    if (!c) {
      return null;
    }
    var d,
      f = a.p.u,
      g = null,
      h,
      l = -1;
    for (d = 0; d < b.length; d++) {
      if (a = b[d], a.p.w === c && (h = f.Ud(a.p.u), 0 > l || h < l)) {
        g = a;
        l = h;
      }
    }
    return g;
  };
  CooldownBehavior.prototype.Wa = function () {};
  CooldownBehavior.prototype.Oa = function () {};
  CooldownBehavior.prototype.od = function (a) {
    choosePointNearTarget(a.p.Qb, a.summoner.p.u, a.p.w);
    a.Y = 1;
    clearMovementTarget(a.p);
  };
  CooldownBehavior.prototype.wd = function (a) {
    if (game.worldActive) {
      return 0;
    }
    var b = a.p;
    a = a.summoner.p;
    return !b.w || !a.w || b.w !== a.w || b.u.ac(a.u) < this.Uw ? 0 : this.ka;
  };
  CooldownBehavior.prototype.Ta = function () {
    return this.ka;
  };
  SpecialAttackBehavior.prototype.Wa = function () {};
  SpecialAttackBehavior.prototype.Oa = function () {};
  SpecialAttackBehavior.prototype.od = function (a) {
    if (this.Fa && !this.Fa.Va) {
      a.Cb(this.Fa);
      if (this.Ng <= this.bb) {
        if (!canAttack(a)) {
          return;
        }
        markAttackTurn(a);
        a.Y = this.qk;
      } else {
        choosePointNearTarget(a.p.Qb, this.Fa.p.u, a.p.w);
        a.Y = 1;
      }
      var b = a.p.w;
      if (b && isAdventurerOrMinion(a)) {
        forcePartyDestination(b);
      }
      clearMovementTarget(a.p);
    }
  };
  SpecialAttackBehavior.prototype.wd = function (a) {
    if (game.worldActive) {
      return 0;
    }
    var b = a.summoner;
    a = a.p;
    var c = b.p;
    if (!a.w || !c.w || a.w !== c.w) {
      return 0;
    }
    this.Fa = selectScrollTarget(b);
    if (!this.Fa) {
      return 0;
    }
    b = this.Fa.p.u;
    if (c.u.ac(b) > this.Uw) {
      return 0;
    }
    this.Ng = a.u.ac(b);
    return this.ka;
  };
  SpecialAttackBehavior.prototype.Ta = function () {
    return this.ka;
  };
  StunnedBehavior.prototype.Wa = function () {};
  StunnedBehavior.prototype.Oa = function () {};
  StunnedBehavior.prototype.od = function (a) {
    var b = a.p;
    if (b.w) {
      var c = b.w,
        d = b.Qb;
      assignVector(d, b.u);
      clampPointToRoom(c, d, game.tileSize + 1);
      b.dd = false;
      b.dd = false;
      a.Y = 1;
    }
  };
  StunnedBehavior.prototype.wd = function (a) {
    if (game.worldActive) {
      return 0;
    }
    var b = a.p;
    if (b.Ug && 0 < b.Ug.length || b.Bc || b.ed || b.Cc) {
      return 0;
    }
    a = b.w;
    if (!a) {
      return 0;
    }
    b = b.u;
    return isPointNearDoor(a, b) || a.stairs && distanceToPoint(b, a.stairs.tq, a.stairs.uq) < game.tileSize ? this.eo : 0;
  };
  StunnedBehavior.prototype.Ta = function () {
    return this.eo;
  };
}
