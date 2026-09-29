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
export function projectDungeonX(levelX, levelY) {
  return Math.round(game.viewportHalfWidth + (levelX - game.level.centerX - (levelY - game.level.centerY)));
}
export function projectDungeonY(levelX, levelY) {
  return Math.round(game.viewportHalfHeight + 0.5 * (levelX - game.level.centerX + (levelY - game.level.centerY)));
}
export function projectWorldX(worldX, worldY) {
  var camera = game.camera;
  return game.viewportHalfWidth + ((worldX / game.tileSize | 0) - camera.tileColumn - ((worldY / game.tileSize | 0) - camera.tileRow)) * game.tileSize + ((worldX % game.tileSize | 0) - (worldY % game.tileSize | 0)) - camera.viewportOffsetX;
}
export function projectWorldY(worldX, worldY) {
  var camera = game.camera;
  return game.viewportHalfHeight + ((worldX / game.tileSize | 0) - camera.tileColumn + ((worldY / game.tileSize | 0) - camera.tileRow)) * game.halfTileSize + (((worldX % game.tileSize | 0) + (worldY % game.tileSize | 0)) / 2 | 0) - camera.viewportOffsetY;
}
export function CharacterLifecycle() {
  this.regenTurnCounter = this.turnTimeAccumulator = 0;
  this.regenIntervalTurns = 3;
  this.dungeonRespawnIntervalTurns = 2;
  this.dungeonRespawnTurnCounter = 0;
  this.achievementCheckIntervalTurns = 4;
  this.achievementCheckTurnCounter = 0;
  this.autoScrollInterval = 2;
  this.autoScrollIndex = this.autoScrollTurnCounter = 0;
}
export function refreshUnspentSkillFlags() {
  var adventurerIndex, adventurer;
  for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
    adventurer = game.state.adventurers[adventurerIndex];
    adventurer.hasUnspentSkills = hasUnspentSkills(adventurer);
  }
}
export function spawnMinion(minionDefinition, summoner, targetPosition) {
  var minion = new Character(minionDefinition.defaultName, 1, minionDefinition.characterClass, minionDefinition, null),
    minionStats = minion.stats;
  minion.sprite = game.monsterSprites.getSprite(minionDefinition.spriteName);
  var behaviorQueue = createBehaviorQueue(minionDefinition.createBehaviors());
  minion.behaviors = behaviorQueue;
  var position = minion.position;
  position.room = summoner.position.room;
  position.currentHallway = summoner.position.currentHallway;
  setVector(position.levelPosition, targetPosition.x, targetPosition.y);
  var h = summoner.position.worldPosition;
  var spawnX = h.x + floorNumber(-10 + 20 * Math.random());
  h = h.y + floorNumber(-10 + 20 * Math.random());
  setVector(position.worldPosition, spawnX, h);
  var level = summoner.stats.characterLevel;
  minion.summoner = summoner;
  if (!summoner.summonedMinions) {
    summoner.summonedMinions = [];
  }
  summoner.summonedMinions.push(minion);
  if (1 === minion.characterType && minion.classDefinition.isCompanion) {
    summoner.companion = minion;
  }
  minion.summonedAtTurn = game.state.turnNumber;
  minion.lifetimeTurns = minionDefinition.lifetimeTurnsLimit;
  initializeCharacterSkills(minion, level);
  minionStats.characterLevel = level;
  applyLevelStats(minionStats, level, minionDefinition.statMultipliers);
  if (minionDefinition.innateSpells) {
    for (var innateSpellIndex = 0; innateSpellIndex < minionDefinition.innateSpells.length; innateSpellIndex++) {
      learnSpell(minion, new Spell(minionDefinition.innateSpells[innateSpellIndex]));
    }
  }
  summoner = minion.summoner;
  var statBonusList = minion.classDefinition.statBonusList;
  resetSkillStatBonuses(minion.stats);
  applySkillTreeBonuses(minion, summoner.skillTree1);
  applySkillTreeBonuses(minion, summoner.skillTree2);
  applySkillTreeBonuses(minion, summoner.skillTree3);
  applySkillTreeBonuses(minion, summoner.skillTree4);
  if (statBonusList) {
    for (var bonusIndex = 0; bonusIndex < statBonusList.length; bonusIndex++) {
      const bonus = statBonusList[bonusIndex];
      applyStatBonus(minion, bonus.statType, bonus.statBonusValue);
    }
  }
  game.minions.addMinion(minion);
  game.state.statisticsRecorder.recordMinionSummoned();
  awardAdventurePoints(18);
}
export function createCastleGuardian(guardianClass, guardianLevel, c) {
  var monsterType = new MonsterType(guardianClass.className, guardianClass.spriteName, guardianLevel),
    guardian = new Character(guardianClass.defaultName, 3, guardianClass.characterClass, guardianClass, null),
    guardianStats = guardian.stats;
  /** @type {{setMonsterType: (monster: MonsterType) => void}} */ (/** @type {unknown} */ (guardian)).setMonsterType(monsterType);
  guardian.sprite = monsterType.sprite;
  const behaviorQueue = createBehaviorQueue(guardianClass.createBehaviors());
  guardian.behaviors = behaviorQueue;
  initializeCharacterSkills(guardian, guardianLevel);
  guardianStats.characterLevel = guardianLevel;
  applyLevelStats(guardianStats, guardianLevel, guardianClass.statMultipliers);
  if (guardianClass.innateSpells) {
    for (var innateSpellIndex = 0; innateSpellIndex < guardianClass.innateSpells.length; innateSpellIndex++) {
      learnSpell(guardian, new Spell(guardianClass.innateSpells[innateSpellIndex]));
    }
  }
  var position = guardian.position;
  position.room = c;
  position.currentHallway = null;
  var left = roomLeftPixels(c) + game.tileSize,
    top = roomTopPixels(c) + game.tileSize,
    bottom = roomBottomPixels(c) - game.tileSize;
  c = left + randomInt(roomRightPixels(c) - game.tileSize - left);
  top += randomInt(bottom - top);
  setVector(position.levelPosition, c, top);
  applyBonusList(guardian, guardianClass.statBonusList);
  return guardian;
}
export function initializeCharacterSkills(character, characterLevel) {
  var slotList = character.slotList;
  if (slotList && 0 < slotList.length) {
    var d, slotIndex;
    for (slotIndex = 0; slotIndex < slotList.length; slotIndex++) {
      d = slotList[slotIndex];
      var itemHolder = character,
        itemLevel = characterLevel,
        itemGenerator = game.itemGenerator,
        rarityId = itemGenerator.rollRarity((100 - globalUpgradeDefinitions.itemQualityChance.currentValue) / 100);
      if (d = generateItem(itemGenerator, d, itemHolder, itemLevel, rarityId)) {
        character.equipItem(d);
      }
    }
  }
}
export function chooseScrollCaster() {
  var scrollCaster = new Character(scrollCasterClass.defaultName, 5, 0, scrollCasterClass, null),
    scrollCasterStats = scrollCaster.stats,
    partyMinLevel = getPartyMinLevel();
  initializeCharacterSkills(scrollCaster, partyMinLevel);
  scrollCasterStats.characterLevel = partyMinLevel;
  applyLevelStats(scrollCasterStats, partyMinLevel, scrollCasterClass.statMultipliers);
  return scrollCaster;
}
export function createBehaviorQueue(behaviors) {
  var behaviorQueue = new BehaviorQueue(),
    behavior,
    behaviorIndex;
  for (behaviorIndex = 0; behaviorIndex < behaviors.length; behaviorIndex++) {
    behavior = behaviors[behaviorIndex];
    behavior.resetBehaviorState();
    behaviorQueue.behaviorList.push(behavior);
  }
  return behaviorQueue;
}
export function applyLevelStats(stats, b, c) {
  var scaledLevelValue = scaleByLevel(b, experienceCurve, 1);
  stats.experienceToLevelUp = scaledLevelValue;
  scaledLevelValue = scaleByLevel(b, armorCurve, c.armorMultiplier);
  stats.armor.levelValue = scaledLevelValue;
  scaledLevelValue = scaleByLevel(b, armorCurve, c.attackRatingMultiplier);
  stats.attackRating.levelValue = scaledLevelValue;
  scaledLevelValue = scaleByLevel(b, armorCurve, c.defenceRatingMultiplier);
  stats.defenceRating.levelValue = scaledLevelValue;
  scaledLevelValue = scaleByLevel(b, armorCurve, c.damageMultiplier);
  stats.damage.levelValue = scaledLevelValue;
  scaledLevelValue = scaleByLevel(b, healthCurve, c.maxHealthMultiplier);
  stats.maxHealth.levelValue = scaledLevelValue;
  c = scaleByLevel(b, spiritCurve, c.maxSpiritMultiplier);
  stats.maxSpirit.levelValue = c;
  stats.health = floorNumber(statValue(stats.maxHealth));
  stats.spirit = statValue(stats.maxSpirit);
  b = scaleByLevel(b, damageCurve, 1);
  stats.spellSpiritCost = b;
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
export function tickCharacterTurn(coordinate, minBound, maxBound) {
  var d = 3 * game.tileSize,
    lowerTarget = Math.max(minBound, coordinate - d),
    d = Math.min(coordinate + d, maxBound);
  if (lowerTarget >= d) {
    return coordinate < minBound ? minBound : coordinate > maxBound ? maxBound : coordinate;
  }
  coordinate = lowerTarget + randomInt(d - lowerTarget);
  return coordinate < minBound ? minBound : coordinate > maxBound ? maxBound : coordinate;
}
export function updateCharacterFrames(coordinate, minBound, maxBound) {
  var maxStepPixels = game.halfTileSize,
    lowerTarget = Math.max(minBound, coordinate - maxStepPixels),
    upper = Math.min(coordinate + maxStepPixels, maxBound);
  if (lowerTarget >= upper) {
    return coordinate < minBound ? minBound : coordinate > maxBound ? maxBound : coordinate;
  }
  coordinate = lowerTarget + randomInt(upper - lowerTarget);
  return coordinate < minBound ? minBound : coordinate > maxBound ? maxBound : coordinate;
}
export function initializeSimulationCharacters() {
  CharacterLifecycle.prototype.despawnMinion = function (minion) {
    if (!minion.isDead) {
      var summoner = minion.summoner;
      if (summoner && summoner.summonedMinions) {
        var minionIndex = summoner.summonedMinions.indexOf(minion);
        if (-1 < minionIndex) {
          summoner.summonedMinions.splice(minionIndex, 1);
        }
        if (summoner.companion === minion) {
          summoner.companion = null;
        }
      }
      minion.isDead = true;
      game.minions.removeMinion(minion);
    }
  };
  CharacterLifecycle.prototype.clearEncounter = function (attacker, defeated) {
    if (!defeated.isDead) {
      var monsterPosition = defeated.position,
        monsterLevel = defeated.stats.characterLevel,
        killerCharacter = 1 === attacker.characterType ? attacker.summoner : attacker;
      if (isAdventurerOrMinion(killerCharacter)) {
        killerCharacter.stats.kills++;
        addKills(doubleKillsModifier.currentValue);
        game.state.statisticsRecorder.recordDirectKill();
        if (5 === killerCharacter.characterType) {
          game.state.statisticsRecorder.recordScrollKill();
        }
        if (1 === attacker.characterType) {
          game.state.statisticsRecorder.recordMinionKill();
          killerCharacter.stats.recordMinionKill();
        }
        var monsterType = defeated.monsterType;
        addExperience(monsterType.experienceReward * doubleExperienceModifier.currentValue);
        recordMonsterTypeKill(monsterType);
      }
      var room = monsterPosition.room,
        westBound = roomLeftPixels(room) + game.tileSize,
        eastBound = roomRightPixels(room) - game.tileSize,
        northBound = roomTopPixels(room) + game.tileSize,
        southBound = roomBottomPixels(room) - game.tileSize;
      if (randomInt(100) <= globalUpgradeDefinitions.goldDropChance.currentValue) {
        var goldAmount = rollGoldDrop();
        if (0 < goldAmount) {
          var goldDrop = new GoldDrop(goldAmount, updateCharacterFrames(monsterPosition.getLevelPositionX(), westBound, eastBound), updateCharacterFrames(monsterPosition.getLevelPositionY(), northBound, southBound), room);
          game.goldDrops.drops.push(goldDrop);
          if (doubleGoldDropsModifier.currentValue) {
            const extraGoldDrop = new GoldDrop(goldAmount, updateCharacterFrames(monsterPosition.getLevelPositionX(), westBound, eastBound), updateCharacterFrames(monsterPosition.getLevelPositionY(), northBound, southBound), room);
            game.goldDrops.drops.push(extraGoldDrop);
          }
        }
      }
      if (randomInt(100) <= globalUpgradeDefinitions.scrollDropChance.currentValue) {
        const scrolls = game.scrolls.unlockedScrolls;
        const scroll = scrolls[randomInt(scrolls.length)];
        const scrollDrop = new ScrollDrop(scroll, updateCharacterFrames(monsterPosition.getLevelPositionX(), westBound, eastBound), updateCharacterFrames(monsterPosition.getLevelPositionY(), northBound, southBound), room);
        game.scrollDrops.drops.push(scrollDrop);
      }
      if (100 * Math.random() <= globalUpgradeDefinitions.potionDropChance.currentValue) {
        const potion = new Potion(potionDefinitions[randomInt(potionDefinitions.length)], game.itemSprites);
        const potionDrop = new PotionDrop(potion, updateCharacterFrames(monsterPosition.getLevelPositionX(), westBound, eastBound), updateCharacterFrames(monsterPosition.getLevelPositionY(), northBound, southBound), room);
        game.potionDrops.drops.push(potionDrop);
      }
      if (randomInt(100) <= globalUpgradeDefinitions.itemDropChance.currentValue || guaranteedItemDropsModifier.currentValue) {
        spawnItemDrop(game.itemDrops, updateCharacterFrames(monsterPosition.getLevelPositionX(), westBound, eastBound), updateCharacterFrames(monsterPosition.getLevelPositionY(), northBound, southBound), room, monsterLevel, game.itemGenerator, game.state.adventurers);
        if (doubleItemDropsModifier.currentValue) {
          spawnItemDrop(game.itemDrops, updateCharacterFrames(monsterPosition.getLevelPositionX(), westBound, eastBound), updateCharacterFrames(monsterPosition.getLevelPositionY(), northBound, southBound), room, monsterLevel, game.itemGenerator, game.state.adventurers);
        }
      }
      defeated.isDead = true;
      var corpseSprite = updateWorldTravel();
      defeated.sprite = corpseSprite;
      game.monsters.clearEncounter(defeated);
      game.state.encounter.clearEncounter();
      awardAdventurePoints(1);
      if (0.15 > Math.random()) {
        var deathMessage = updateDungeonTravel();
        showFloatingText(game.floatingText, defeated, deathMessage, "white");
      }
    }
  };
}
