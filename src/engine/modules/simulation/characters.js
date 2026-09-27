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
  return Math.round(game.viewportHalfWidth + (a - game.level.centerX - (b - game.level.centerY)));
}
export function projectDungeonY(a, b) {
  return Math.round(game.viewportHalfHeight + 0.5 * (a - game.level.centerX + (b - game.level.centerY)));
}
export function projectWorldX(a, b) {
  var c = game.camera;
  return game.viewportHalfWidth + ((a / game.tileSize | 0) - c.tileColumn - ((b / game.tileSize | 0) - c.tileRow)) * game.tileSize + ((a % game.tileSize | 0) - (b % game.tileSize | 0)) - c.zt;
}
export function projectWorldY(a, b) {
  var c = game.camera;
  return game.viewportHalfHeight + ((a / game.tileSize | 0) - c.tileColumn + ((b / game.tileSize | 0) - c.tileRow)) * game.halfTileSize + (((a % game.tileSize | 0) + (b % game.tileSize | 0)) / 2 | 0) - c.At;
}
export function CharacterLifecycle() {
  this.yw = this.Jo = 0;
  this.zD = 3;
  this.gD = 2;
  this.cw = 0;
  this.PC = 4;
  this.Qt = 0;
  this.autoScrollInterval = 2;
  this.autoScrollIndex = this.autoScrollTurnCounter = 0;
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
  d.sprite = game.monsterSprites.getSprite(a.spriteName);
  var behaviorQueue = createBehaviorQueue(a.createBehaviors());
  d.behaviors = behaviorQueue;
  var position = d.position;
  position.room = b.position.room;
  position.currentHallway = b.position.currentHallway;
  setVector(position.levelPosition, c.x, c.y);
  var h = b.position.worldPosition;
  c = h.x + floorNumber(-10 + 20 * Math.random());
  h = h.y + floorNumber(-10 + 20 * Math.random());
  setVector(position.worldPosition, c, h);
  var level = b.stats.characterLevel;
  d.summoner = b;
  if (!b.summonedMinions) {
    b.summonedMinions = [];
  }
  b.summonedMinions.push(d);
  if (1 === d.characterType && d.classDefinition.isCompanion) {
    b.companion = d;
  }
  d.summonedAtTurn = game.state.turnNumber;
  d.lifetimeTurns = a.lifetimeTurnsLimit;
  initializeCharacterSkills(d, level);
  f.characterLevel = level;
  applyLevelStats(f, level, a.statMultipliers);
  if (a.innateSpells) {
    for (b = 0; b < a.innateSpells.length; b++) {
      learnSpell(d, new Spell(a.innateSpells[b]));
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
      const bonus = a[b];
      applyStatBonus(d, bonus.statType, bonus.statBonusValue);
    }
  }
  game.minions.Tt(d);
  game.state.statisticsRecorder.recordMinionSummoned();
  awardAdventurePoints(18);
}
export function createCastleGuardian(a, b, c) {
  var d = new MonsterType(a.className, a.spriteName, b),
    f = new Character(a.defaultName, 3, a.characterClass, a, null),
    g = f.stats;
  /** @type {{gq: (monster: MonsterType) => void}} */ (/** @type {unknown} */ (f)).gq(d);
  f.sprite = d.sprite;
  const behaviorQueue = createBehaviorQueue(a.createBehaviors());
  f.behaviors = behaviorQueue;
  initializeCharacterSkills(f, b);
  g.characterLevel = b;
  applyLevelStats(g, b, a.statMultipliers);
  if (a.Jm) {
    for (b = 0; b < a.Jm.length; b++) {
      learnSpell(f, new Spell(a.Jm[b]));
    }
  }
  b = f.position;
  b.room = c;
  b.currentHallway = null;
  var h = roomLeftPixels(c) + game.tileSize,
    top = roomTopPixels(c) + game.tileSize,
    bottom = roomBottomPixels(c) - game.tileSize;
  c = h + randomInt(roomRightPixels(c) - game.tileSize - h);
  top += randomInt(bottom - top);
  setVector(b.levelPosition, c, top);
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
        n = l.rollRarity((100 - globalUpgradeDefinitions.itemQualityChance.currentValue) / 100);
      if (d = generateItem(l, d, g, h, n)) {
        a.equipItem(d);
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
  applyLevelStats(b, c, scrollCasterClass.statMultipliers);
  return a;
}
export function createBehaviorQueue(a) {
  var b = new BehaviorQueue(),
    c,
    d;
  for (d = 0; d < a.length; d++) {
    c = a[d];
    c.resetBehaviorState();
    b.fo.push(c);
  }
  return b;
}
export function applyLevelStats(a, b, c) {
  var d = scaleByLevel(b, experienceCurve, 1);
  a.experienceToLevelUp = d;
  d = scaleByLevel(b, armorCurve, c.armorMultiplier);
  a.armor.levelValue = d;
  d = scaleByLevel(b, armorCurve, c.attackRatingMultiplier);
  a.attackRating.levelValue = d;
  d = scaleByLevel(b, armorCurve, c.defenceRatingMultiplier);
  a.defenceRating.levelValue = d;
  d = scaleByLevel(b, armorCurve, c.damageMultiplier);
  a.damage.levelValue = d;
  d = scaleByLevel(b, healthCurve, c.maxHealthMultiplier);
  a.maxHealth.levelValue = d;
  c = scaleByLevel(b, spiritCurve, c.maxSpiritMultiplier);
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
    upper = Math.min(a + d, c);
  if (f >= upper) {
    return a < b ? b : a > c ? c : a;
  }
  a = f + randomInt(upper - f);
  return a < b ? b : a > c ? c : a;
}
export function initializeSimulationCharacters() {
  CharacterLifecycle.prototype.Lp = function (a) {
    if (!a.isDead) {
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
      a.isDead = true;
      game.minions.Lp(a);
    }
  };
  CharacterLifecycle.prototype.clearEncounter = function (a, b) {
    if (!b.isDead) {
      var c = b.position,
        d = b.stats.characterLevel,
        f = 1 === a.characterType ? a.summoner : a;
      if (isAdventurerOrMinion(f)) {
        f.stats.kills++;
        addKills(doubleKillsModifier.currentValue);
        game.state.statisticsRecorder.recordDirectKill();
        if (5 === f.characterType) {
          game.state.statisticsRecorder.recordScrollKill();
        }
        if (1 === a.characterType) {
          game.state.statisticsRecorder.recordMinionKill();
          f.stats.recordMinionKill();
        }
        f = b.monsterType;
        addExperience(f.No * doubleExperienceModifier.currentValue);
        recordMonsterTypeKill(f);
      }
      var f = c.room,
        g = roomLeftPixels(f) + game.tileSize,
        h = roomRightPixels(f) - game.tileSize,
        l = roomTopPixels(f) + game.tileSize,
        n = roomBottomPixels(f) - game.tileSize;
      if (randomInt(100) <= globalUpgradeDefinitions.Lr.currentValue) {
        var goldAmount = rollGoldDrop();
        if (0 < goldAmount) {
          var s = new GoldDrop(goldAmount, updateCharacterFrames(c.getLevelPositionX(), g, h), updateCharacterFrames(c.getLevelPositionY(), l, n), f);
          game.goldDrops.drops.push(s);
          if (doubleGoldDropsModifier.currentValue) {
            const extraGoldDrop = new GoldDrop(goldAmount, updateCharacterFrames(c.getLevelPositionX(), g, h), updateCharacterFrames(c.getLevelPositionY(), l, n), f);
            game.goldDrops.drops.push(extraGoldDrop);
          }
        }
      }
      if (randomInt(100) <= globalUpgradeDefinitions.$s.currentValue) {
        const scrolls = game.scrolls.unlockedScrolls;
        const scroll = scrolls[randomInt(scrolls.length)];
        const scrollDrop = new ScrollDrop(scroll, updateCharacterFrames(c.getLevelPositionX(), g, h), updateCharacterFrames(c.getLevelPositionY(), l, n), f);
        game.scrollDrops.drops.push(scrollDrop);
      }
      if (100 * Math.random() <= globalUpgradeDefinitions.Ns.currentValue) {
        const potion = new Potion(potionDefinitions[randomInt(potionDefinitions.length)]);
        const potionDrop = new PotionDrop(potion, updateCharacterFrames(c.getLevelPositionX(), g, h), updateCharacterFrames(c.getLevelPositionY(), l, n), f);
        game.potionDrops.drops.push(potionDrop);
      }
      if (randomInt(100) <= globalUpgradeDefinitions.itemDropChance.currentValue || guaranteedItemDropsModifier.currentValue) {
        spawnItemDrop(game.itemDrops, updateCharacterFrames(c.getLevelPositionX(), g, h), updateCharacterFrames(c.getLevelPositionY(), l, n), f, d);
        if (doubleItemDropsModifier.currentValue) {
          spawnItemDrop(game.itemDrops, updateCharacterFrames(c.getLevelPositionX(), g, h), updateCharacterFrames(c.getLevelPositionY(), l, n), f, d);
        }
      }
      b.isDead = true;
      c = updateWorldTravel();
      b.sprite = c;
      game.monsters.clearEncounter(b);
      game.state.encounter.clearEncounter();
      awardAdventurePoints(1);
      if (0.15 > Math.random()) {
        c = updateDungeonTravel();
        showFloatingText(game.floatingText, b, c, "white");
      }
    }
  };
}
