// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 遭遇战、怪物种类、敌我集合与首领生成。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { Spell, clearScrollTargets } from "./scrolls.js";
import { POINT_EVENT_ENCOUNTER, awardAdventurePoints } from "../progression/points.js";
import { removeStunEffects } from "../characters/effects.js";
import { MONSTER_RANK_KILL_STEP, bossEncounterModifier, extraMonstersModifier, frailMonstersModifier, globalUpgradeDefinitions, monsterArmorCurve, monsterAttackCurve, monsterDamageCurve, monsterDefenceCurve, monsterHealthCurve, monsterSpiritCurve } from "../content/balance.js";
import { endsWithText, floorNumber, randomInt, scaleByLevel, setVector } from "../core/math.js";
import { Character, isHostile, learnSpell } from "../characters/character.js";
import { AttackBehavior, MONSTER_TYPE } from "../ai/targeting.js";
import { MELEE_ATTACK_RANGE, monsterClass } from "../content/classes.js";
import { statValue } from "../characters/stats.js";
import { roomBottomPixels, roomLeftPixels, roomRightPixels, roomTopPixels } from "../world/rooms.js";
import { getPartyMaxLevel } from "../characters/party.js";
import { bossClass, bossSpriteDefinitions, castleGuardianDefinitions } from "../content/guardians.js";
import { applyLevelStats, createBehaviorQueue, createCastleGuardian, initializeCharacterSkills } from "../simulation/characters.js";
import { applyBonusList } from "./skill-effects.js";
export function EncounterState() {
  this.Ar = 0;
  this.fw = "";
  this.ym = true;
  this.du = false;
}
export function resetEncounter() {
  var a = game.state.encounter;
  a.Ar = 0;
  a.fw = "";
  a.ym = true;
  a.du = false;
}
export function beginEncounter(a, b) {
  var c = game.state.encounter;
  c.Ar++;
  c.fw = a;
  c.ym = false;
  c.du = b;
}
export function populateEncounter(a) {
  var b = game.monsterNames;
  if (game.state.encounter.ym) {
    var c = a.Yp;
    if (0 === c) {
      if (bossEncounterModifier.currentValue && 0.2 > Math.random()) {
        spawnDungeonBoss(b, a);
      } else {
        var c = globalUpgradeDefinitions.minMonsters.currentValue,
          d = Math.max(globalUpgradeDefinitions.maxMonsters.currentValue, c),
          c = c + randomInt(d - c),
          c = c + extraMonstersModifier.currentValue;
        if (0 < c) {
          for (var d = game.monsterCatalog, f = d.hd + randomInt(1 + d.fc - d.hd), d = getMonsterTypesForLevel(d, f), d = d[randomInt(d.length)], f = d.xd, b = b.dn.Vk(d.nE) + " (等级." + f + ")", f = 0; f < c; f++) {
            var g = game.monsters,
              h = a,
              l = d,
              n = new Character("Monster", MONSTER_TYPE, 12, monsterClass, null),
              p = n.stats;
            n.ee = l.ll;
            n.gq(l);
            p.characterLevel = l.xd;
            n.behaviors = new AttackBehavior(h, MELEE_ATTACK_RANGE);
            n.position.room = h;
            if (frailMonstersModifier.currentValue) {
              p.damage.levelValue = floorNumber(0.7 * l.Gp);
              p.armor.levelValue = floorNumber(0.7 * l.Ep);
              p.attackRating.levelValue = floorNumber(0.7 * l.Fp);
              p.defenceRating.levelValue = floorNumber(0.7 * l.Hp);
              p.maxHealth.levelValue = floorNumber(0.7 * l.$o);
              p.health = floorNumber(floorNumber(0.7 * statValue(p.maxHealth)));
            } else {
              p.damage.levelValue = l.Gp;
              p.armor.levelValue = l.Ep;
              p.attackRating.levelValue = l.Fp;
              p.defenceRating.levelValue = l.Hp;
              p.maxHealth.levelValue = l.$o;
              p.health = floorNumber(statValue(p.maxHealth));
            }
            var s = roomLeftPixels(h) + game.tileSize,
              l = roomTopPixels(h) + game.tileSize,
              p = roomBottomPixels(h) - game.tileSize,
              h = s + randomInt(roomRightPixels(h) - game.tileSize - s),
              l = l + randomInt(p - l);
            setVector(n.position.levelPosition, h, l);
            g.Pi.push(n);
          }
          beginEncounter(b, false);
        }
      }
    } else {
      if (1 === c) {
        c = Math.max(globalUpgradeDefinitions.maxMonsters.baseValue, globalUpgradeDefinitions.minMonsters.currentValue);
        d = Math.max(globalUpgradeDefinitions.maxMonsters.currentValue, c);
        d = c + randomInt(d - c);
        c = game.monsterCatalog.fc;
        d += extraMonstersModifier.currentValue;
        spawnCastleGuardians(d, a);
        a = game.currentCastle ? generateMonsterName(b.dn, game.currentCastle.castleName) : generateMonsterName(b.dn, "Unknown Castle");
        beginEncounter(a + " (等级." + c + ")", false);
      } else {
        if (2 === c) {
          spawnDungeonBoss(b, a);
        }
      }
    }
  }
}
export function spawnDungeonBoss(a, b) {
  var c = getPartyMaxLevel(game.state.party),
    d;
  d = game.currentCastle ? generateBossName(a.dn, game.currentCastle.castleName) : game.currentDungeon ? generateBossName(a.dn, game.currentDungeon.dungeonName) : generateBossName(a.dn, "Unknown Castle");
  var f = bossSpriteDefinitions[randomInt(bossSpriteDefinitions.length)];
  d = d + " (等级." + c + ")";
  var g = game.monsters,
    h = new MonsterType(bossClass.className, f.spriteName, c),
    f = new Character(bossClass.defaultName, 4, bossClass.characterClass, bossClass, null),
    l = f.stats;
  f.gq(h);
  f.ee = h.ll;
  h = createBehaviorQueue(bossClass.createBehaviors());
  f.behaviors = h;
  initializeCharacterSkills(f, c);
  l.characterLevel = c;
  applyLevelStats(l, c, bossClass.statMultipliers);
  if (bossClass.eu) {
    for (c = 0; c < bossClass.eu.length; c++) {
      learnSpell(f, new Spell(bossClass.eu[c]));
    }
  }
  c = f.position;
  c.room = b;
  c.cd = null;
  var n = roomLeftPixels(b) + game.tileSize,
    l = roomTopPixels(b) + game.tileSize,
    h = roomBottomPixels(b) - game.tileSize,
    n = n + randomInt(roomRightPixels(b) - game.tileSize - n),
    l = l + randomInt(h - l);
  setVector(c.levelPosition, n, l);
  applyBonusList(f, bossClass.WC);
  g.Pi.push(f);
  g = Math.max(globalUpgradeDefinitions.maxMonsters.baseValue, globalUpgradeDefinitions.minMonsters.currentValue);
  f = Math.max(globalUpgradeDefinitions.maxMonsters.currentValue, g);
  g += randomInt(f - g);
  g += extraMonstersModifier.currentValue;
  spawnCastleGuardians(g, b);
  beginEncounter(d, true);
}
export function spawnCastleGuardians(a, b) {
  var c,
    d = game.monsterCatalog.fc,
    f;
  if (0.5 > Math.random()) {
    for (c = 0; c < a; c++) {
      f = castleGuardianDefinitions[randomInt(castleGuardianDefinitions.length)];
      f = createCastleGuardian(f, d, b);
      game.monsters.Pi.push(f);
    }
  } else {
    for (f = castleGuardianDefinitions[randomInt(castleGuardianDefinitions.length)], c = 0; c < a; c++) {
      var g = createCastleGuardian(f, d, b);
      game.monsters.Pi.push(g);
    }
  }
}
export function AllyRegistry() {
  this.Pf = [];
}
export function getAllies() {
  return game.allies.Pf;
}
export function getOpponents(a) {
  var b = game.allies;
  return a.effects.bi ? isHostile(a) ? getMonsters() : b.Pf : isHostile(a) ? b.Pf : getMonsters();
}
export function getFriendlyTargets(a) {
  var b = game.allies;
  return isHostile(a) ? getMonsters() : b.Pf;
}
export function MonsterType(a, b, c) {
  this.dE = a;
  this.nE = endsWithText(a, "y") ? a.substring(0, a.length - 1) + "" : endsWithText(a, "Man") ? a.substring(0, a.length - 3) + "Men" : endsWithText(a, "fish") ? a : a + "";
  this.spriteName = b;
  this.xd = c;
  this.ll = game.monsterSprites.getSprite(b);
  this.$o = this.Sj = this.Hp = this.Fp = this.Ep = this.Gp = this.No = this.ek = this.ml = this.xq = 0;
  advanceMonsterTypeRank(this);
}
export function recordMonsterTypeKill(a) {
  a.xq++;
  a.ml++;
  if (a.ml >= a.ek && 5 > a.Sj) {
    a.ml -= a.ek;
    advanceMonsterTypeRank(a);
  }
}
export function advanceMonsterTypeRank(a) {
  if (!(5 <= a.Sj)) {
    a.Sj++;
    a.ek += MONSTER_RANK_KILL_STEP;
    var b = 10 * (a.xd - 1) + a.Sj;
    a.$o = scaleByLevel(b, monsterDamageCurve, 1);
    a.No = scaleByLevel(b, monsterArmorCurve, 1);
    a.Gp = scaleByLevel(b, monsterHealthCurve, 1);
    a.Ep = scaleByLevel(b, monsterSpiritCurve, 1);
    a.Fp = scaleByLevel(b, monsterAttackCurve, 1);
    a.Hp = scaleByLevel(b, monsterDefenceCurve, 1);
  }
}
export function MonsterNameGenerator() {
  this.Pw = "沉溺的;惊人的;腐坏的;敏捷的;好斗的;冷漠的;愤怒的;敌对的;弯曲的;狡猾的;对抗的;可恶的;讨厌的;血腥的;沉思的;勇敢的;无耻的;破碎的;基础的;漂亮的;对抗的;聪明的;诅咒的;谴责的;神秘的;恐怖的;懦弱的;刻薄的;混乱的;天上的;黑暗的;恐惧的;不满的;失宠的;贫穷的;伪装的;喝醉的;悲惨的;卑鄙的;恶心的;不安的;羞辱的;宅男的;著名的;绝望的;可憎的;开除的;兴奋的;进取的;可怕的;冰冻的;火焰的;惊恐的;可怕的;有爱的;恶魔的;友善的;吓人的;皮毛的;堕落的;虚弱的;冻结的;传说的;凶猛的;未来的;狂乱的;疯狂的;可怕的;预感的;强大的;遗忘的;残忍的;阴森的;郁闷的;惊人的;催眠的;可憎的;错误的;肮脏的;无瑕的;沉醉的;难耐的;智能的;无礼的;缺陷的;监禁的;发炎的;讨厌的;不朽的;险恶的;无情的;厚重的;高尚的;噩梦的;有序的;失格的;卑劣的;丑恶的;资深的;浮华的;投机的;冒险的;掠夺的;阶段的;多产的;幽默的;性感的;邪门的;悚然的;特殊的;灭魂的;狂暴的;浮夸的;严肃的;机密的;阴影的;卑鄙的;反感的;矛盾的;威胁的;糟糕的;浑浊的;高耸的;不幸的;离群的;不正的;无益的;倔强的;亵渎的;无道的;缺德的;无德的;不死的;过去的;呆板的".split(";");
  this.XC = "男爵 首领 教主 首席 独裁者 主管 君主 国王 太保 领主 巨头 帝王 主人 霸王 督导 王子 总统 统治者 元首 苏丹 寡头".split(" ");
  this.oD = "遗弃的 美丽的 破碎的 燃烧的 反叛的 贫瘠的 痛苦的 血液的 血腥的 困扰的 毁坏的 结晶的 寒冷的 死亡的 深渊的 黑暗的 雾霾的 遥远的 烦扰的 荒凉的 发狂的 潮湿的 矮胖的 恶心的 不安的 发狂的 乌木的 冻结的 孤单的 忘却的 禁止的 畏惧的 金典的 黑暗的 潮湿的 感染的 绝命的 迷失的 残忍的 神秘的 模糊的 幽冥的 美好的 就近的 肮脏 顽皮的 普通的 北方的 苍白的 污染的 粉碎的 阴影的 秘密的 覆盖的 痛苦的 悲伤地 折磨的 虐待的 亵渎的 未知的 无名的 卑鄙的 窃语的".split(" ");
  this.mE = "学院;沼泽;废矿;洞穴;地穴;城市;山洞;峡谷;黑暗;领域;地牢;次元;区域;梦想;帝国;森林;工厂;墓地;洞穴;地狱;山谷;地狱景象;阴间;王国;国土;图书馆;沼泽;陵墓;太平间;泥泞平原;附近;位面;省;大门;行星;领域;过往;坑;宫殿;河流;河流水域;丛林;沼泽;屠宰场;郊外;冻土;地形;坟墓;寺庙;塔;地底".split(";");
}
export function generateMonsterName(a, b) {
  return b + "之" + a.mn(a.Pw);
}
export function generateBossName(a, b) {
  return b + "之" + a.mn(a.Pw) + "" + a.mn(a.XC);
}
export function getMonsterTypesForLevel(a, b) {
  if (b < a.hd) {
    console.log("getMonsterTypesForLevel. monsterLevel (" + b + ") less than min unlocked level: " + a.hd);
  }
  if (b > a.fc + 1) {
    console.log("getMonsterTypesForLevel. monsterLevel (" + b + ") greater than max unlocked level: " + a.fc);
  }
  var c = b + "",
    d = a.en[c];
  if (!d) {
    for (var d = [], f = [], g, h = 0; 20 > d.length;) {
      g = a.n[randomInt(a.n.length)];
      if (!(-1 < f.indexOf(g))) {
        f.push(g);
        d.push(new MonsterType(g.name, g.spriteName, b));
        h++;
      }
    }
    d.sort(a.HE);
    a.en[c] = d;
  }
  return d;
}
export function MonsterRegistry() {
  this.Pi = [];
  this.Og = [];
  this.aE = 50;
}
export function getMonsters() {
  return game.monsters.Pi;
}
export function clearMonsters() {
  var a = game.monsters;
  if (0 != a.Pi.length) {
    a.Pi.length = 0;
  }
  if (0 != a.Og.length) {
    a.Og.length = 0;
  }
}
export function initializeCombatEncounters() {
  EncounterState.prototype.ol = function () {
    if (1 > getMonsters().length) {
      this.ym = true;
      game.state.statisticsRecorder.es();
      clearScrollTargets();
      awardAdventurePoints(POINT_EVENT_ENCOUNTER);
      var a, b;
      for (a = 0; a < game.state.adventurers.length; a++) {
        b = game.state.adventurers[a].effects;
        if (b.Kf) {
          b.Kf = false;
          removeStunEffects(b);
        }
      }
    }
  };
  AllyRegistry.prototype.reset = function () {
    if (0 < this.Pf.length) {
      console.log("teams array in invalid state on party creation");
      this.Pf.length = 0;
    }
    var a = game.state.adventurers,
      b;
    for (b = 0; b < a.length; b++) {
      this.Pf.push(a[b]);
    }
  };
  AllyRegistry.prototype.Tt = function (a) {
    this.Pf.push(a);
  };
  MonsterType.prototype.Vk = function () {
    return this.dE;
  };
  MonsterNameGenerator.prototype.mn = function (a) {
    return a[randomInt(a.length)];
  };
  MonsterNameGenerator.prototype.Vk = function (a) {
    return 0.5 > Math.random() ? this.mn(this.Pw) + "" + a : this.mn(this.oD) + "" + this.mn(this.mE) + "的" + a;
  };
  MonsterRegistry.prototype.ol = function (a) {
    if (a) {
      var b = this.Pi.indexOf(a);
      if (-1 < b) {
        this.Pi.splice(b, 1);
      }
      for (this.Og.push(a); this.Og.length > this.aE;) {
        this.Og.shift();
      }
    }
  };
}
