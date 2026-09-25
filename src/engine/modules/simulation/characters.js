// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 角色创建、成长、旅行与坐标投影。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { Character, hasUnspentSkills, isAdventurerOrMinion, learnSpell } from "../characters/character.js";
import { floorNumber, randomInt, scaleByLevel, setVector } from "../core/math.js";
import { ScrollDrop, Spell } from "../combat/scrolls.js";
import { resetSkillStatBonuses, statValue } from "../characters/stats.js";
import { applyBonusList, applySkillTreeBonuses, applyStatBonus } from "../combat/skill-effects.js";
import { awardAdventurePoints } from "../progression/points.js";
import { MonsterType, recordMonsterTypeKill } from "../combat/encounters.js";
import { roomBottomPixels, roomLeftPixels, roomRightPixels, roomTopPixels } from "../world/rooms.js";
import { armorCurve, damageCurve, doubleExperienceModifier, doubleGoldDropsModifier, doubleItemDropsModifier, doubleKillsModifier, experienceCurve, globalUpgradeDefinitions, guaranteedItemDropsModifier, healthCurve, rollGoldDrop, spiritCurve } from "../content/balance.js";
import { generateItem, spawnItemDrop } from "../loot/items.js";
import { scrollCasterClass } from "../content/classes.js";
import { addExperience, addKills, getPartyMinLevel } from "../characters/party.js";
import { BehaviorQueue } from "../ai/behaviors.js";
import { GoldDrop } from "../loot/treasure.js";
import { Potion, PotionDrop, potionDefinitions } from "../combat/potions.js";
import { showFloatingText } from "../rendering/floating-text.js";
export function projectDungeonX(a, b) {
  return Math.round(game.viewportHalfWidth + (a - game.level.Ki - (b - game.level.Li)));
}
export function projectDungeonY(a, b) {
  return Math.round(game.viewportHalfHeight + 0.5 * (a - game.level.Ki + (b - game.level.Li)));
}
export function projectWorldX(a, b) {
  var c = game.camera;
  return game.viewportHalfWidth + ((a / game.tileSize | 0) - c.vk - ((b / game.tileSize | 0) - c.wk)) * game.tileSize + ((a % game.tileSize | 0) - (b % game.tileSize | 0)) - c.zt;
}
export function projectWorldY(a, b) {
  var c = game.camera;
  return game.viewportHalfHeight + ((a / game.tileSize | 0) - c.vk + ((b / game.tileSize | 0) - c.wk)) * game.halfTileSize + (((a % game.tileSize | 0) + (b % game.tileSize | 0)) / 2 | 0) - c.At;
}
export function CharacterLifecycle() {
  this.yw = this.Jo = 0;
  this.zD = 3;
  this.gD = 2;
  this.cw = 0;
  this.PC = 4;
  this.Qt = 0;
  this.TC = 2;
  this.rk = this.bu = 0;
}
export function refreshUnspentSkillFlags() {
  var a, b;
  for (a = 0; a < game.state.adventurers.length; a++) {
    b = game.state.adventurers[a];
    b.hasUnspentSkills = hasUnspentSkills(b);
  }
}
export function spawnMinion(a, b, c) {
  var d = new Character(a.defaultName, 1, a.characterClass, a, null),
    f = d.stats;
  d.ee = game.monsterSprites.getSprite(a.spriteName);
  var g = createBehaviorQueue(a.nb());
  d.behaviors = g;
  g = d.position;
  g.room = b.position.room;
  g.cd = b.position.cd;
  setVector(g.levelPosition, c.x, c.y);
  var h = b.position.Db;
  c = h.x + floorNumber(-10 + 20 * Math.random());
  h = h.y + floorNumber(-10 + 20 * Math.random());
  setVector(g.Db, c, h);
  g = b.stats.characterLevel;
  d.summoner = b;
  if (!b.summonedMinions) {
    b.summonedMinions = [];
  }
  b.summonedMinions.push(d);
  if (1 === d.characterType && d.classDefinition.oi) {
    b.companion = d;
  }
  d.summonedAtTurn = game.state.turnNumber;
  d.lifetimeTurns = a.Oi;
  initializeCharacterSkills(d, g);
  f.characterLevel = g;
  applyLevelStats(f, g, a.Ma);
  if (a.jl) {
    for (b = 0; b < a.jl.length; b++) {
      learnSpell(d, new Spell(a.jl[b]));
    }
  }
  b = d.summoner;
  a = d.classDefinition.Bp;
  resetSkillStatBonuses(d.stats);
  applySkillTreeBonuses(d, b.skillTree1);
  applySkillTreeBonuses(d, b.skillTree2);
  applySkillTreeBonuses(d, b.skillTree3);
  applySkillTreeBonuses(d, b.skillTree4);
  if (a) {
    for (b = 0; b < a.length; b++) {
      f = a[b];
      applyStatBonus(d, f.statType, f.statBonusValue);
    }
  }
  game.minions.Tt(d);
  game.state.aa.bs();
  awardAdventurePoints(18);
}
export function createCastleGuardian(a, b, c) {
  var d = new MonsterType(a.className, a.spriteName, b),
    f = new Character(a.defaultName, 3, a.characterClass, a, null),
    g = f.stats;
  f.gq(d);
  f.ee = d.ll;
  d = createBehaviorQueue(a.nb());
  f.behaviors = d;
  initializeCharacterSkills(f, b);
  g.characterLevel = b;
  applyLevelStats(g, b, a.Ma);
  if (a.Jm) {
    for (b = 0; b < a.Jm.length; b++) {
      learnSpell(f, new Spell(a.Jm[b]));
    }
  }
  b = f.position;
  b.room = c;
  b.cd = null;
  var h = roomLeftPixels(c) + game.tileSize,
    g = roomTopPixels(c) + game.tileSize,
    d = roomBottomPixels(c) - game.tileSize;
  c = h + randomInt(roomRightPixels(c) - game.tileSize - h);
  g += randomInt(d - g);
  setVector(b.levelPosition, c, g);
  applyBonusList(f, a.Nr);
  return f;
}
export function initializeCharacterSkills(a, b) {
  var c = a.slotList;
  if (c && 0 < c.length) {
    var d, f;
    for (f = 0; f < c.length; f++) {
      d = c[f];
      var g = a,
        h = b,
        l = game.itemGenerator,
        n = l.uf((100 - globalUpgradeDefinitions.itemQualityChance.currentValue) / 100);
      if (d = generateItem(l, d, g, h, n)) {
        a.Qk(d);
      }
    }
  }
}
export function chooseScrollCaster() {
  var a = new Character(scrollCasterClass.defaultName, 5, 0, scrollCasterClass, null),
    b = a.stats,
    c = getPartyMinLevel();
  initializeCharacterSkills(a, c);
  b.characterLevel = c;
  applyLevelStats(b, c, scrollCasterClass.Ma);
  return a;
}
export function createBehaviorQueue(a) {
  var b = new BehaviorQueue(),
    c,
    d;
  for (d = 0; d < a.length; d++) {
    c = a[d];
    c.Wa();
    b.fo.push(c);
  }
  return b;
}
export function applyLevelStats(a, b, c) {
  var d = scaleByLevel(b, experienceCurve, 1);
  a.Am = d;
  d = scaleByLevel(b, armorCurve, c.Qf);
  a.armor.levelValue = d;
  d = scaleByLevel(b, armorCurve, c.Rf);
  a.attackRating.levelValue = d;
  d = scaleByLevel(b, armorCurve, c.Zf);
  a.defenceRating.levelValue = d;
  d = scaleByLevel(b, armorCurve, c.Xf);
  a.damage.levelValue = d;
  d = scaleByLevel(b, healthCurve, c.Cf);
  a.maxHealth.levelValue = d;
  c = scaleByLevel(b, spiritCurve, c.Ef);
  a.maxSpirit.levelValue = c;
  a.health = floorNumber(statValue(a.maxHealth));
  a.spirit = statValue(a.maxSpirit);
  b = scaleByLevel(b, damageCurve, 1);
  a.spellSpiritCost = b;
}
export function updateWorldTravel() {
  switch (randomInt(3)) {
    case 0:
      return game.terrainSprites.getSprite("L2_SkeletonHumanLarge.PNG");
    case 1:
      return game.terrainSprites.getSprite("L2_SkeletonHumanMedium.PNG");
    case 2:
      return game.terrainSprites.getSprite("L2_SkeletonDog.PNG");
    case 3:
      return game.terrainSprites.getSprite("L2_SkeletonHumanSmall.PNG");
    default:
      return game.terrainSprites.getSprite("L2_SkeletonHumanMedium2.PNG");
  }
}
export function updateDungeonTravel() {
  switch (randomInt(16)) {
    case 0:
      return "死亡!";
    case 1:
      return "不!";
    case 2:
      return "啊啊啊!";
    case 3:
      return "哦哦哦";
    case 4:
      return "呃呃呃";
    case 5:
      return "哎呀!";
    case 6:
      return "##$@#!";
    case 7:
      return "哎哟!";
    case 8:
      return "我的腿!";
    case 9:
      return "呃!";
    case 10:
      return "嘿!";
    case 11:
      return "粗鲁!";
    case 12:
      return "不公平!";
    case 13:
      return "神啊!";
    case 14:
      return "亲爱的.";
    default:
      return "我已经死了.";
  }
}
export function tickCharacterTurn(a, b, c) {
  var d = 3 * game.tileSize,
    f = Math.max(b, a - d),
    d = Math.min(a + d, c);
  if (f >= d) {
    return a < b ? b : a > c ? c : a;
  }
  a = f + randomInt(d - f);
  return a < b ? b : a > c ? c : a;
}
export function updateCharacterFrames(a, b, c) {
  var d = game.halfTileSize,
    f = Math.max(b, a - d),
    d = Math.min(a + d, c);
  if (f >= d) {
    return a < b ? b : a > c ? c : a;
  }
  a = f + randomInt(d - f);
  return a < b ? b : a > c ? c : a;
}
export function initializeSimulationCharacters() {
  CharacterLifecycle.prototype.Lp = function (a) {
    if (!a.Va) {
      var b = a.summoner;
      if (b && b.summonedMinions) {
        var c = b.summonedMinions.indexOf(a);
        if (-1 < c) {
          b.summonedMinions.splice(c, 1);
        }
        if (b.companion === a) {
          b.companion = null;
        }
      }
      a.Va = true;
      game.minions.Lp(a);
    }
  };
  CharacterLifecycle.prototype.ol = function (a, b) {
    if (!b.Va) {
      var c = b.position,
        d = b.stats.characterLevel,
        f = 1 === a.characterType ? a.summoner : a;
      if (isAdventurerOrMinion(f)) {
        f.stats.kills++;
        addKills(doubleKillsModifier.currentValue);
        game.state.aa.cp();
        if (5 === f.characterType) {
          game.state.aa.gp();
        }
        if (1 === a.characterType) {
          game.state.aa.$k();
          f.stats.$k();
        }
        f = b.Sb;
        addExperience(f.No * doubleExperienceModifier.currentValue);
        recordMonsterTypeKill(f);
      }
      var f = c.room,
        g = roomLeftPixels(f) + game.tileSize,
        h = roomRightPixels(f) - game.tileSize,
        l = roomTopPixels(f) + game.tileSize,
        n = roomBottomPixels(f) - game.tileSize;
      if (randomInt(100) <= globalUpgradeDefinitions.Lr.currentValue) {
        var p = rollGoldDrop();
        if (0 < p) {
          var s = new GoldDrop(p, updateCharacterFrames(c.Ob(), g, h), updateCharacterFrames(c.Pb(), l, n), f);
          game.goldDrops.pe.push(s);
          if (doubleGoldDropsModifier.currentValue) {
            p = new GoldDrop(p, updateCharacterFrames(c.Ob(), g, h), updateCharacterFrames(c.Pb(), l, n), f);
            game.goldDrops.pe.push(p);
          }
        }
      }
      if (randomInt(100) <= globalUpgradeDefinitions.$s.currentValue) {
        p = game.scrolls.Pl;
        p = p[randomInt(p.length)];
        p = new ScrollDrop(p, updateCharacterFrames(c.Ob(), g, h), updateCharacterFrames(c.Pb(), l, n), f);
        game.scrollDrops.kf.push(p);
      }
      if (100 * Math.random() <= globalUpgradeDefinitions.Ns.currentValue) {
        p = new Potion(potionDefinitions[randomInt(potionDefinitions.length)]);
        p = new PotionDrop(p, updateCharacterFrames(c.Ob(), g, h), updateCharacterFrames(c.Pb(), l, n), f);
        game.potionDrops.Hf.push(p);
      }
      if (randomInt(100) <= globalUpgradeDefinitions.itemDropChance.currentValue || guaranteedItemDropsModifier.currentValue) {
        spawnItemDrop(game.itemDrops, updateCharacterFrames(c.Ob(), g, h), updateCharacterFrames(c.Pb(), l, n), f, d);
        if (doubleItemDropsModifier.currentValue) {
          spawnItemDrop(game.itemDrops, updateCharacterFrames(c.Ob(), g, h), updateCharacterFrames(c.Pb(), l, n), f, d);
        }
      }
      b.Va = true;
      c = updateWorldTravel();
      b.ee = c;
      game.monsters.ol(b);
      game.state.encounter.ol();
      awardAdventurePoints(1);
      if (0.15 > Math.random()) {
        c = updateDungeonTravel();
        showFloatingText(game.floatingText, b, c, "white");
      }
    }
  };
}
