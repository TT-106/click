/** 遭遇战、怪物种类、敌我集合与首领生成。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { Spell, clearScrollTargets } from "./scrolls.js";
import { POINT_EVENT_ENCOUNTER, awardAdventurePoints } from "../progression/points.js";
import { removeStunEffects } from "../characters/effects.js";
import { MONSTER_RANK_KILL_STEP, bossEncounterModifier, extraMonstersModifier, frailMonstersModifier, globalUpgradeDefinitions, monsterExperienceCurve, monsterAttackCurve, monsterHealthCurve, monsterDefenceCurve, monsterDamageCurve, monsterArmorCurve } from "../content/balance.js";
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
import { TILE_SIZE } from "../core/screen-layout.js";
/** @typedef {Character & { setMonsterType: (monsterType: MonsterType) => void }} TypedMonster */
/** @typedef {MonsterNameGenerator & { pickWord: (words: string[]) => string }} NamedMonsterGenerator */
export function EncounterState() {
  this.encounterCount = 0;
  this.encounterName = "";
  this.noMonstersLeft = true;
  this.isBossEncounter = false;
}
export function resetEncounter() {
  var encounter = game.state.encounter;
  encounter.encounterCount = 0;
  encounter.encounterName = "";
  encounter.noMonstersLeft = true;
  encounter.isBossEncounter = false;
}
export function beginEncounter(encounterName, isBossEncounter) {
  var encounter = game.state.encounter;
  encounter.encounterCount++;
  encounter.encounterName = encounterName;
  encounter.noMonstersLeft = false;
  encounter.isBossEncounter = isBossEncounter;
}
export function populateEncounter(encounterRoom) {
  var monsterNames = game.monsterNames;
  if (game.state.encounter.noMonstersLeft) {
    var encounterType = encounterRoom.encounterType;
    if (0 === encounterType) {
      if (bossEncounterModifier.currentValue && 0.2 > Math.random()) {
        spawnDungeonBoss(monsterNames, encounterRoom);
      } else {
        var minMonsters = globalUpgradeDefinitions.minMonsters.currentValue,
          maxMonsters = Math.max(globalUpgradeDefinitions.maxMonsters.currentValue, minMonsters),
          monsterCount = minMonsters + randomInt(maxMonsters - minMonsters);
        monsterCount += extraMonstersModifier.currentValue;
        if (0 < monsterCount) {
          var catalog = game.monsterCatalog,
            monsterLevel = catalog.minUnlockedLevel + randomInt(1 + catalog.maxUnlockedLevel - catalog.minUnlockedLevel),
            monsterTypes = getMonsterTypesForLevel(catalog, monsterLevel),
            monsterType = monsterTypes[randomInt(monsterTypes.length)],
            encounterName = monsterNames.nameGenerator.generateName(monsterType.pluralName) + " (等级." + monsterType.level + ")";
          for (var monsterIndex = 0; monsterIndex < monsterCount; monsterIndex++) {
            var registry = game.monsters,
              room = encounterRoom,
              monster = new Character("Monster", MONSTER_TYPE, 12, monsterClass, null),
              stats = monster.stats;
            monster.sprite = monsterType.sprite;
            (/** @type {TypedMonster} */ (monster)).setMonsterType(monsterType);
            stats.characterLevel = monsterType.level;
            monster.behaviors = new AttackBehavior(room, MELEE_ATTACK_RANGE);
            monster.position.room = room;
            if (frailMonstersModifier.currentValue) {
              stats.damage.levelValue = floorNumber(0.7 * monsterType.damage);
              stats.armor.levelValue = floorNumber(0.7 * monsterType.armor);
              stats.attackRating.levelValue = floorNumber(0.7 * monsterType.attackRating);
              stats.defenceRating.levelValue = floorNumber(0.7 * monsterType.defenceRating);
              stats.maxHealth.levelValue = floorNumber(0.7 * monsterType.maxHealth);
              stats.health = floorNumber(floorNumber(0.7 * statValue(stats.maxHealth)));
            } else {
              stats.damage.levelValue = monsterType.damage;
              stats.armor.levelValue = monsterType.armor;
              stats.attackRating.levelValue = monsterType.attackRating;
              stats.defenceRating.levelValue = monsterType.defenceRating;
              stats.maxHealth.levelValue = monsterType.maxHealth;
              stats.health = floorNumber(statValue(stats.maxHealth));
            }
            var left = roomLeftPixels(room) + TILE_SIZE,
              top = roomTopPixels(room) + TILE_SIZE,
              bottom = roomBottomPixels(room) - TILE_SIZE,
              spawnX = left + randomInt(roomRightPixels(room) - TILE_SIZE - left),
              spawnY = top + randomInt(bottom - top);
            setVector(monster.position.levelPosition, spawnX, spawnY);
            registry.activeMonsters.push(monster);
          }
          beginEncounter(encounterName, false);
        }
      }
    } else {
      if (1 === encounterType) {
        var castleMinMonsters = Math.max(globalUpgradeDefinitions.maxMonsters.baseValue, globalUpgradeDefinitions.minMonsters.currentValue);
        var castleMaxMonsters = Math.max(globalUpgradeDefinitions.maxMonsters.currentValue, castleMinMonsters);
        var castleMonsterCount = castleMinMonsters + randomInt(castleMaxMonsters - castleMinMonsters);
        var castleLevel = game.monsterCatalog.maxUnlockedLevel;
        castleMonsterCount += extraMonstersModifier.currentValue;
        spawnCastleGuardians(castleMonsterCount, encounterRoom);
        var castleEncounterName = game.currentCastle ? generateMonsterName(monsterNames.nameGenerator, game.currentCastle.castleName) : generateMonsterName(monsterNames.nameGenerator, "Unknown Castle");
        beginEncounter(castleEncounterName + " (等级." + castleLevel + ")", false);
      } else {
        if (2 === encounterType) {
          spawnDungeonBoss(monsterNames, encounterRoom);
        }
      }
    }
  }
}
export function spawnDungeonBoss(monsterNames, dungeonRoom) {
  var bossLevel = getPartyMaxLevel(game.state.party),
    bossEncounterName;
  bossEncounterName = game.currentCastle ? generateBossName(monsterNames.nameGenerator, game.currentCastle.castleName) : game.currentDungeon ? generateBossName(monsterNames.nameGenerator, game.currentDungeon.dungeonName) : generateBossName(monsterNames.nameGenerator, "Unknown Castle");
  var spriteDefinition = bossSpriteDefinitions[randomInt(bossSpriteDefinitions.length)];
  bossEncounterName = bossEncounterName + " (等级." + bossLevel + ")";
  var monsterRegistry = game.monsters,
    bossType = new MonsterType(bossClass.className, spriteDefinition.spriteName, bossLevel),
    boss = new Character(bossClass.defaultName, 4, bossClass.characterClass, bossClass, null),
    bossStats = boss.stats;
  (/** @type {TypedMonster} */ (boss)).setMonsterType(bossType);
  boss.sprite = bossType.sprite;
  boss.behaviors = createBehaviorQueue(bossClass.createBehaviors());
  initializeCharacterSkills(boss, bossLevel);
  bossStats.characterLevel = bossLevel;
  applyLevelStats(bossStats, bossLevel, bossClass.statMultipliers);
  if (bossClass.innateSpells) {
    for (var innateSpellIndex = 0; innateSpellIndex < bossClass.innateSpells.length; innateSpellIndex++) {
      learnSpell(boss, new Spell(bossClass.innateSpells[innateSpellIndex]));
    }
  }
  var bossPosition = boss.position;
  bossPosition.room = dungeonRoom;
  bossPosition.currentHallway = null;
  var left = roomLeftPixels(dungeonRoom) + TILE_SIZE,
    top = roomTopPixels(dungeonRoom) + TILE_SIZE,
    bottom = roomBottomPixels(dungeonRoom) - TILE_SIZE,
    spawnX = left + randomInt(roomRightPixels(dungeonRoom) - TILE_SIZE - left),
    spawnY = top + randomInt(bottom - top);
  setVector(bossPosition.levelPosition, spawnX, spawnY);
  applyBonusList(boss, bossClass.statBonusList);
  monsterRegistry.activeMonsters.push(boss);
  var guardianCount = Math.max(globalUpgradeDefinitions.maxMonsters.baseValue, globalUpgradeDefinitions.minMonsters.currentValue);
  var maxCount = Math.max(globalUpgradeDefinitions.maxMonsters.currentValue, guardianCount);
  guardianCount += randomInt(maxCount - guardianCount);
  guardianCount += extraMonstersModifier.currentValue;
  spawnCastleGuardians(guardianCount, dungeonRoom);
  beginEncounter(bossEncounterName, true);
}
export function spawnCastleGuardians(guardianCount, dungeonRoom) {
  var guardianIndex,
    guardianLevel = game.monsterCatalog.maxUnlockedLevel,
    guardianDefinition, guardian;
  if (0.5 > Math.random()) {
    for (guardianIndex = 0; guardianIndex < guardianCount; guardianIndex++) {
      guardianDefinition = castleGuardianDefinitions[randomInt(castleGuardianDefinitions.length)];
      guardian = createCastleGuardian(guardianDefinition, guardianLevel, dungeonRoom);
      game.monsters.activeMonsters.push(guardian);
    }
  } else {
    for (guardianDefinition = castleGuardianDefinitions[randomInt(castleGuardianDefinitions.length)], guardianIndex = 0; guardianIndex < guardianCount; guardianIndex++) {
      guardian = createCastleGuardian(guardianDefinition, guardianLevel, dungeonRoom);
      game.monsters.activeMonsters.push(guardian);
    }
  }
}
export function AllyRegistry() {
  this.allies = [];
}
export function getAllies() {
  return game.allies.allies;
}
export function getOpponents(character) {
  var allyRegistry = game.allies;
  return character.effects.isConverted ? isHostile(character) ? getMonsters() : allyRegistry.allies : isHostile(character) ? allyRegistry.allies : getMonsters();
}
export function getFriendlyTargets(character) {
  var allyRegistry = game.allies;
  return isHostile(character) ? getMonsters() : allyRegistry.allies;
}
export function MonsterType(baseName, spriteName, level) {
  this.baseName = baseName;
  this.pluralName = endsWithText(baseName, "y") ? baseName.substring(0, baseName.length - 1) + "" : endsWithText(baseName, "Man") ? baseName.substring(0, baseName.length - 3) + "Men" : endsWithText(baseName, "fish") ? baseName : baseName + "";
  this.spriteName = spriteName;
  this.level = level;
  this.sprite = game.monsterSprites.getSprite(spriteName);
  this.maxHealth = this.rank = this.defenceRating = this.attackRating = this.armor = this.damage = this.experienceReward = this.rankKillThreshold = this.rankProgressKills = this.killCount = 0;
  advanceMonsterTypeRank(this);
}
export function recordMonsterTypeKill(monsterType) {
  monsterType.killCount++;
  monsterType.rankProgressKills++;
  if (monsterType.rankProgressKills >= monsterType.rankKillThreshold && 5 > monsterType.rank) {
    monsterType.rankProgressKills -= monsterType.rankKillThreshold;
    advanceMonsterTypeRank(monsterType);
  }
}
export function advanceMonsterTypeRank(monsterType) {
  if (!(5 <= monsterType.rank)) {
    monsterType.rank++;
    monsterType.rankKillThreshold += MONSTER_RANK_KILL_STEP;
    var effectiveLevel = 10 * (monsterType.level - 1) + monsterType.rank;
    monsterType.maxHealth = scaleByLevel(effectiveLevel, monsterHealthCurve, 1);
    monsterType.experienceReward = scaleByLevel(effectiveLevel, monsterExperienceCurve, 1);
    monsterType.damage = scaleByLevel(effectiveLevel, monsterDamageCurve, 1);
    monsterType.armor = scaleByLevel(effectiveLevel, monsterArmorCurve, 1);
    monsterType.attackRating = scaleByLevel(effectiveLevel, monsterAttackCurve, 1);
    monsterType.defenceRating = scaleByLevel(effectiveLevel, monsterDefenceCurve, 1);
  }
}
export function MonsterNameGenerator() {
  this.adjectives = "沉溺的;惊人的;腐坏的;敏捷的;好斗的;冷漠的;愤怒的;敌对的;弯曲的;狡猾的;对抗的;可恶的;讨厌的;血腥的;沉思的;勇敢的;无耻的;破碎的;基础的;漂亮的;对抗的;聪明的;诅咒的;谴责的;神秘的;恐怖的;懦弱的;刻薄的;混乱的;天上的;黑暗的;恐惧的;不满的;失宠的;贫穷的;伪装的;喝醉的;悲惨的;卑鄙的;恶心的;不安的;羞辱的;宅男的;著名的;绝望的;可憎的;开除的;兴奋的;进取的;可怕的;冰冻的;火焰的;惊恐的;可怕的;有爱的;恶魔的;友善的;吓人的;皮毛的;堕落的;虚弱的;冻结的;传说的;凶猛的;未来的;狂乱的;疯狂的;可怕的;预感的;强大的;遗忘的;残忍的;阴森的;郁闷的;惊人的;催眠的;可憎的;错误的;肮脏的;无瑕的;沉醉的;难耐的;智能的;无礼的;缺陷的;监禁的;发炎的;讨厌的;不朽的;险恶的;无情的;厚重的;高尚的;噩梦的;有序的;失格的;卑劣的;丑恶的;资深的;浮华的;投机的;冒险的;掠夺的;阶段的;多产的;幽默的;性感的;邪门的;悚然的;特殊的;灭魂的;狂暴的;浮夸的;严肃的;机密的;阴影的;卑鄙的;反感的;矛盾的;威胁的;糟糕的;浑浊的;高耸的;不幸的;离群的;不正的;无益的;倔强的;亵渎的;无道的;缺德的;无德的;不死的;过去的;呆板的".split(";");
  this.bossTitles = "男爵 首领 教主 首席 独裁者 主管 君主 国王 太保 领主 巨头 帝王 主人 霸王 督导 王子 总统 统治者 元首 苏丹 寡头".split(" ");
  this.bossAdjectives = "遗弃的 美丽的 破碎的 燃烧的 反叛的 贫瘠的 痛苦的 血液的 血腥的 困扰的 毁坏的 结晶的 寒冷的 死亡的 深渊的 黑暗的 雾霾的 遥远的 烦扰的 荒凉的 发狂的 潮湿的 矮胖的 恶心的 不安的 发狂的 乌木的 冻结的 孤单的 忘却的 禁止的 畏惧的 金典的 黑暗的 潮湿的 感染的 绝命的 迷失的 残忍的 神秘的 模糊的 幽冥的 美好的 就近的 肮脏 顽皮的 普通的 北方的 苍白的 污染的 粉碎的 阴影的 秘密的 覆盖的 痛苦的 悲伤地 折磨的 虐待的 亵渎的 未知的 无名的 卑鄙的 窃语的".split(" ");
  this.bossLocations = "学院;沼泽;废矿;洞穴;地穴;城市;山洞;峡谷;黑暗;领域;地牢;次元;区域;梦想;帝国;森林;工厂;墓地;洞穴;地狱;山谷;地狱景象;阴间;王国;国土;图书馆;沼泽;陵墓;太平间;泥泞平原;附近;位面;省;大门;行星;领域;过往;坑;宫殿;河流;河流水域;丛林;沼泽;屠宰场;郊外;冻土;地形;坟墓;寺庙;塔;地底".split(";");
}
export function generateMonsterName(nameGenerator, baseName) {
  return baseName + "之" + nameGenerator.pickWord(nameGenerator.adjectives);
}
export function generateBossName(nameGenerator, baseName) {
  return baseName + "之" + nameGenerator.pickWord(nameGenerator.adjectives) + "" + nameGenerator.pickWord(nameGenerator.bossTitles);
}
export function getMonsterTypesForLevel(monsterCatalog, monsterLevel) {
  if (monsterLevel < monsterCatalog.minUnlockedLevel) {
    console.log("getMonsterTypesForLevel. monsterLevel (" + monsterLevel + ") less than min unlocked level: " + monsterCatalog.minUnlockedLevel);
  }
  if (monsterLevel > monsterCatalog.maxUnlockedLevel + 1) {
    console.log("getMonsterTypesForLevel. monsterLevel (" + monsterLevel + ") greater than max unlocked level: " + monsterCatalog.maxUnlockedLevel);
  }
  var cacheKey = monsterLevel + "",
    monsterTypes = monsterCatalog.monsterTypesByLevelCache[cacheKey];
  if (!monsterTypes) {
    for (var generatedTypes = [], selectedTemplates = [], monsterTemplate, selectedTemplateCount = 0; 20 > generatedTypes.length;) {
      monsterTemplate = monsterCatalog.monsterTemplates[randomInt(monsterCatalog.monsterTemplates.length)];
      if (!(-1 < selectedTemplates.indexOf(monsterTemplate))) {
        selectedTemplates.push(monsterTemplate);
        generatedTypes.push(new MonsterType(monsterTemplate.name, monsterTemplate.spriteName, monsterLevel));
        selectedTemplateCount++;
      }
    }
    generatedTypes.sort(monsterCatalog.compareMonsterTypes);
    monsterCatalog.monsterTypesByLevelCache[cacheKey] = generatedTypes;
    monsterTypes = generatedTypes;
  }
  return monsterTypes;
}
export function MonsterRegistry() {
  this.activeMonsters = [];
  this.defeatedMonsters = [];
  this.maxDefeatedMonsters = 50;
}
export function getMonsters() {
  return game.monsters.activeMonsters;
}
export function clearMonsters() {
  var monsterRegistry = game.monsters;
  if (0 != monsterRegistry.activeMonsters.length) {
    monsterRegistry.activeMonsters.length = 0;
  }
  if (0 != monsterRegistry.defeatedMonsters.length) {
    monsterRegistry.defeatedMonsters.length = 0;
  }
}
export function initializeCombatEncounters() {
  EncounterState.prototype.clearEncounter = function () {
    if (1 > getMonsters().length) {
      this.noMonstersLeft = true;
      game.state.statisticsRecorder.recordRoomCleared();
      clearScrollTargets();
      awardAdventurePoints(POINT_EVENT_ENCOUNTER);
      var adventurerIndex, adventurerEffects;
      for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
        adventurerEffects = game.state.adventurers[adventurerIndex].effects;
        if (adventurerEffects.isStunned) {
          adventurerEffects.isStunned = false;
          removeStunEffects(adventurerEffects);
        }
      }
    }
  };
  AllyRegistry.prototype.reset = function () {
    if (0 < this.allies.length) {
      console.log("teams array in invalid state on party creation");
      this.allies.length = 0;
    }
    var adventurers = game.state.adventurers,
      adventurerIndex;
    for (adventurerIndex = 0; adventurerIndex < adventurers.length; adventurerIndex++) {
      this.allies.push(adventurers[adventurerIndex]);
    }
  };
  AllyRegistry.prototype.addAlly = function (ally) {
    this.allies.push(ally);
  };
  MonsterType.prototype.getName = function () {
    return this.baseName;
  };
  MonsterNameGenerator.prototype.pickWord = function (words) {
    return words[randomInt(words.length)];
  };
  MonsterNameGenerator.prototype.generateName = function (monsterName) {
    var nameGenerator = /** @type {NamedMonsterGenerator} */ (/** @type {unknown} */ (this));
    return 0.5 > Math.random() ? nameGenerator.pickWord(this.adjectives) + "" + monsterName : nameGenerator.pickWord(this.bossAdjectives) + "" + nameGenerator.pickWord(this.bossLocations) + "的" + monsterName;
  };
  MonsterRegistry.prototype.clearEncounter = function (defeatedMonster) {
    if (defeatedMonster) {
      var monsterIndex = this.activeMonsters.indexOf(defeatedMonster);
      if (-1 < monsterIndex) {
        this.activeMonsters.splice(monsterIndex, 1);
      }
      for (this.defeatedMonsters.push(defeatedMonster); this.defeatedMonsters.length > this.maxDefeatedMonsters;) {
        this.defeatedMonsters.shift();
      }
    }
  };
}
