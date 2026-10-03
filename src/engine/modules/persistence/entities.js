/** 角色、装备、怪物与统计序列化。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
/** @typedef {import('./save-dto.js').SaveMonsterTypesState} SaveMonsterTypesState */
/** @typedef {import('./save-dto.js').SaveMonsterTypeState} SaveMonsterTypeState */
/** @typedef {import('./save-dto.js').SaveMonsterTypeEntry} SaveMonsterTypeEntry */
import { Item, ItemEffect } from "../loot/items.js";
import { MonsterType, advanceMonsterTypeRank } from "../combat/encounters.js";
/** 存档实体所需的四个依赖由组合根注入。itemGenerator / dungeons / monsterCatalog / scrolls
 *  四个容器对象都在 runtime 的 game 模块对象字面量里只构造一次、从不整体重新赋值
 *  （src/ 内 0 处 `game.X =`，判据见 docs/reverse-engineering/facts.md），所以按引用绑安全；
 *  字段值（itemTypesById、farms、monsterTypesByLevelCache 等）随游戏进程变化，读的始终是同一对象。
 *  未绑定就用到会立刻抛，避免"装配漏一步"退化成静默的 undefined 读取。 */
var boundItemGenerator = null;
var boundDungeons = null;
var boundMonsterCatalog = null;
var boundScrolls = null;
export function bindPersistenceEntities(itemGenerator, dungeons, monsterCatalog, scrolls) {
  boundItemGenerator = itemGenerator;
  boundDungeons = dungeons;
  boundMonsterCatalog = monsterCatalog;
  boundScrolls = scrolls;
}
function itemGeneratorRef() {
  if (!boundItemGenerator) {
    throw new Error('存档实体尚未绑定物品生成器：请在组合根调用 bindPersistenceEntities(game.itemGenerator, game.dungeons, game.monsterCatalog, game.scrolls)');
  }
  return boundItemGenerator;
}
function dungeonsRef() {
  if (!boundDungeons) {
    throw new Error('存档实体尚未绑定地牢注册表：请在组合根调用 bindPersistenceEntities(game.itemGenerator, game.dungeons, game.monsterCatalog, game.scrolls)');
  }
  return boundDungeons;
}
function monsterCatalogRef() {
  if (!boundMonsterCatalog) {
    throw new Error('存档实体尚未绑定怪物目录：请在组合根调用 bindPersistenceEntities(game.itemGenerator, game.dungeons, game.monsterCatalog, game.scrolls)');
  }
  return boundMonsterCatalog;
}
function scrollsRef() {
  if (!boundScrolls) {
    throw new Error('存档实体尚未绑定卷轴背包：请在组合根调用 bindPersistenceEntities(game.itemGenerator, game.dungeons, game.monsterCatalog, game.scrolls)');
  }
  return boundScrolls;
}
export function serializeItem(item) {
  var itemTypeId = item.itemType.itemTypeId,
    slot = item.slot,
    characterClass = item.characterClass,
    itemName = item.itemName,
    itemRarity = item.getRarity(),
    itemEffect = item.itemEffect;
  return {
    itemTypeId: itemTypeId,
    itemSlot: slot,
    characterClass: characterClass,
    itemName: itemName,
    itemRarity: itemRarity,
    itemLevel: item.itemLevel,
    itemGold: item.itemGold,
    itemValue: item.itemValue,
    itemCharacteristic: item.characteristic,
    itemEffect: itemEffect ? {
      itemEffectType: itemEffect.itemEffectType,
      itemEffectAmount: itemEffect.itemEffectAmount,
      itemEffectDescription: itemEffect.itemEffectDescription,
      itemEffectName: itemEffect.itemEffectName
    } : null
  };
}
export function restoreItem(savedItemRecord) {
  var itemSlot = savedItemRecord.itemSlot,
    characterClass = savedItemRecord.characterClass,
    itemName = savedItemRecord.itemName,
    itemRarity = savedItemRecord.itemRarity,
    itemLevel = savedItemRecord.itemLevel,
    itemGold = savedItemRecord.itemGold,
    itemValue = savedItemRecord.itemValue,
    itemCharacteristic = savedItemRecord.itemCharacteristic,
    itemEffect;
  if (itemEffect = savedItemRecord.itemEffect) {
    var itemEffectType = itemEffect.itemEffectType,
      itemEffectDescription = itemEffect.itemEffectDescription;
    itemEffect = itemEffectType && itemEffectDescription ? new ItemEffect(itemEffectType, itemEffect.itemEffectAmount, itemEffectDescription, itemEffect.itemEffectName) : null;
  } else {
    itemEffect = null;
  }
  var itemType = itemGeneratorRef().itemTypesById[savedItemRecord.itemTypeId];
  return itemType ? new Item(itemType, itemSlot, characterClass, itemName ? itemName : "Error", itemLevel ? itemLevel : 1, itemRarity ? itemRarity : 0, itemGold ? itemGold : 0, itemValue ? itemValue : 0, itemCharacteristic ? itemCharacteristic : 1, itemEffect) : (console.log("failed to lookup item type"), null);
}
/** @returns {import('./save-dto.js').SaveAdventurer} */
export function serializeCharacter(character) {
  var adventurerName = character.adventurerName,
    characterClass = character.characterClass,
    characterType = character.characterType,
    spriteName = character.getSprite().getName(),
    characterStats;
  characterStats = character.stats;
  /** @type {import('./save-dto.js').SaveCharacterStats} */
  var serializedStats = {
    characterLevel: characterStats.characterLevel,
    characterHealth: characterStats.health,
    characterSpirit: characterStats.spirit,
    kills: characterStats.kills,
    damageComponent: serializeStatComponent(characterStats.damage),
    armorComponent: serializeStatComponent(characterStats.armor),
    attackRatingComponent: serializeStatComponent(characterStats.attackRating),
    defenceRatingComponent: serializeStatComponent(characterStats.defenceRating),
    maxHealthComponent: serializeStatComponent(characterStats.maxHealth),
    maxSpiritComponent: serializeStatComponent(characterStats.maxSpirit),
    stunCount: characterStats.stunCount,
    minionKills: characterStats.minionKills,
    damageGiven: characterStats.damageGiven,
    damageReceived: characterStats.damageReceived
  };
  var characterPosition;
  characterPosition = character.position;
  var room = characterPosition.room,
    currentHallway = characterPosition.currentHallway;
  var serializedPosition = {
    levelX: characterPosition.getLevelPositionX(),
    levelY: characterPosition.getLevelPositionY(),
    worldX: characterPosition.getWorldPositionX(),
    worldY: characterPosition.getWorldPositionY(),
    roomId: room ? room.roomId : -1,
    floorPositionIndex: characterPosition.floorPositionIndex,
    hallwayId: currentHallway ? currentHallway.hallwayId : -1
  };
  var spellList = character.spells,
    spellStateList = /** @type {import('./save-dto.js').SaveSpellState[]} */ ([]),
    spellIndex;
  if (spellList) {
    for (spellIndex = 0; spellIndex < spellList.length; spellIndex++) {
      spellStateList.push({
        spellName: spellList[spellIndex].name
      });
    }
  }
  var inventory = character.inventory;
  var serializedInventory = [];
  if (inventory) {
    inventory = inventory.items;
    var itemIndex;
    for (itemIndex = 0; itemIndex < inventory.length; itemIndex++) {
      serializedInventory.push(serializeItem(inventory[itemIndex]));
    }
  }
  var slotList = character.slotList;
  var equipment = character.equipment;
  var equippedItemList = [];
  if (equipment && slotList) {
    var slotItem, slotIndex;
    for (slotIndex = 0; slotIndex < slotList.length; slotIndex++) {
      if (slotItem = equipment.getSlotItem(slotList[slotIndex])) {
        equippedItemList.push(serializeItem(slotItem));
      }
    }
  } else {
    console.log("failed to generate equipped item state array");
  }
  return {
    adventurerName: adventurerName,
    characterClass: characterClass,
    characterType: characterType,
    spriteName: spriteName,
    characteristicsComponent: serializedStats,
    positionComponent: serializedPosition,
    spells: spellStateList,
    inventory: serializedInventory,
    equippedItemCollection: equippedItemList,
    skillPoints: character.skillPoints,
    initialSpellSkillPoint: character.initialSpellSkillPoint,
    upgrades1: serializeUpgradeFlags(character.skillTree1.upgrades),
    upgrades2: serializeUpgradeFlags(character.skillTree2.upgrades),
    upgrades3: serializeUpgradeFlags(character.skillTree3.upgrades),
    upgrades4: serializeUpgradeFlags(character.skillTree4.upgrades)
  };
}
/** @returns {Object<string, boolean>} */
export function serializeUpgradeFlags(upgradeList) {
  /** @type {Object<string, boolean>} */
  var ownedFlagsById = {};
  var upgrade,
    upgradeIndex;
  for (upgradeIndex = 0; upgradeIndex < upgradeList.length; upgradeIndex++) {
    upgrade = upgradeList[upgradeIndex];
    ownedFlagsById[upgrade.getUpgradeDefinition().id] = upgrade.isOwned();
  }
  return ownedFlagsById;
}
export function restoreUpgradeFlags(upgradeList, ownedFlagsById) {
  var upgradeIndex, upgradeDefinition, ownedFlag, upgrade;
  for (upgradeIndex = 0; upgradeIndex < upgradeList.length; upgradeIndex++) {
    upgrade = upgradeList[upgradeIndex];
    upgradeDefinition = upgradeList[upgradeIndex].getUpgradeDefinition();
    ownedFlag = ownedFlagsById[upgradeDefinition.id];
    upgrade.setPurchased(ownedFlag);
  }
}
/** @param {import('../characters/stats.js').StatComponent|null} statComponent
 * @returns {import('./save-dto.js').SaveStatComponent|null} */
export function serializeStatComponent(statComponent) {
  return statComponent ? {
    itemValue: statComponent.itemValue,
    levelValue: statComponent.levelValue,
    spellBonusPercent: statComponent.spellBonusPercent,
    skillBonusPercent: statComponent.skillBonusPercent
  } : null;
}
/** @param {import('../characters/stats.js').StatComponent|null} statComponent
 * @param {import('./save-dto.js').SaveStatComponent|null} savedStatComponent */
export function restoreStatComponent(statComponent, savedStatComponent) {
  if (statComponent && savedStatComponent) {
    var itemValue = savedStatComponent.itemValue,
      levelValue = savedStatComponent.levelValue,
      spellBonusPercent = savedStatComponent.spellBonusPercent,
      skillBonusPercent = savedStatComponent.skillBonusPercent;
    statComponent.itemValue = itemValue ? itemValue : 0;
    statComponent.levelValue = levelValue ? levelValue : 0;
    statComponent.spellBonusPercent = spellBonusPercent ? spellBonusPercent : 0;
    statComponent.skillBonusPercent = skillBonusPercent ? skillBonusPercent : 0;
  }
}
export function MonsterSaveAdapter() {}
/** @returns {SaveMonsterTypeState} U134：序列化器接进 save-dto.js——写出侧键名/缺失由 tsc 对账 */
export function serializeMonsterLevel(monsterLevel, monsterTypeList) {
  var monsterTypeEntryList = [],
    monsterTypeIndex;
  for (monsterTypeIndex = 0; monsterTypeIndex < monsterTypeList.length; monsterTypeIndex++) {
    monsterTypeEntryList.push(serializeMonsterType(monsterTypeList[monsterTypeIndex]));
  }
  return {
    level: monsterLevel,
    monsterTypes: monsterTypeEntryList
  };
}
/** @returns {SaveMonsterTypeEntry} U134：写出侧多键/少键（如 nameTypo）由 tsc TS2322/2741 报出 */
export function serializeMonsterType(monsterType) {
  return {
    name: monsterType.getName(),
    sprite: monsterType.sprite.getName(),
    kills: monsterType.killCount
  };
}
/** @param {SaveMonsterTypeEntry} monsterTypeEntry 存档里的怪物种类行 @param {number} monsterLevel 怪物等级 */
export function restoreMonsterType(monsterTypeEntry, monsterLevel) {
  var savedKillCount = monsterTypeEntry.kills,
    monsterType = new MonsterType(monsterTypeEntry.name, monsterTypeEntry.sprite, monsterLevel),
    savedKillCount = savedKillCount ? savedKillCount : 0;
  monsterType.killCount = 0;
  monsterType.rankProgressKills = 0;
  monsterType.rank = 0;
  monsterType.armor = 0;
  monsterType.damage = 0;
  monsterType.attackRating = 0;
  monsterType.defenceRating = 0;
  monsterType.experienceReward = 0;
  monsterType.maxHealth = 0;
  monsterType.rankKillThreshold = 0;
  advanceMonsterTypeRank(monsterType);
  for (monsterType.killCount = savedKillCount; savedKillCount > monsterType.rankKillThreshold;) {
    savedKillCount -= monsterType.rankKillThreshold;
    advanceMonsterTypeRank(monsterType);
  }
  monsterType.rankProgressKills = savedKillCount;
  return monsterType;
}
export function StatisticsSaveAdapter() {}
export function serializeStatistics(statistics) {
  return {
    playedMillis: statistics.playedMillis,
    turnCount: statistics.turnCount,
    doorsOpened: statistics.doorsOpened,
    roomsCleared: statistics.roomsCleared,
    levelsCleared: statistics.levelsCleared,
    dungeonsCleared: statistics.dungeonsCleared,
    castlesConquered: statistics.castlesConquered,
    farmsPurchased: statistics.farmsPurchased,
    totalGoldFromMonsters: statistics.totalGoldFromMonsters,
    totalGoldFromItems: statistics.totalGoldFromItems,
    directKills: statistics.directKills,
    scrollKills: statistics.scrollKills,
    minionKills: statistics.minionKills,
    farmedKills: statistics.farmedKills,
    characterStunnedCount: statistics.characterStunnedCount,
    meleeAttackCount: statistics.meleeAttackCount,
    rangedAttackCount: statistics.rangedAttackCount,
    spellCastCount: statistics.spellCastCount,
    potionsUsed: statistics.potionsUsed,
    scrollsUsed: statistics.scrollsUsed,
    minionsSummoned: statistics.minionsSummoned,
    itemsSold: statistics.itemsSold,
    itemsFound: statistics.itemsFound,
    uncommonItemsFound: statistics.uncommonItemsFound,
    rareItemsFound: statistics.rareItemsFound,
    historicItemsFound: statistics.historicItemsFound,
    ancientItemsFound: statistics.ancientItemsFound,
    treasureChestsLooted: statistics.treasureChestsLooted,
    weaponRacksLooted: statistics.weaponRacksLooted,
    bookcasesLooted: statistics.bookcasesLooted
  };
}
export function restoreStatistics(savedStatistics, statistics, isLifetime) {
  var totalPlayedMillis = savedStatistics.totalPlayedMillis,
    playedMillis = savedStatistics.playedMillis,
    turnCount = savedStatistics.turnCount,
    doorsOpened = savedStatistics.doorsOpened,
    roomsCleared = savedStatistics.roomsCleared,
    levelsCleared = savedStatistics.levelsCleared,
    dungeonsCleared = savedStatistics.dungeonsCleared,
    castlesConquered = savedStatistics.castlesConquered,
    farmsPurchased = savedStatistics.farmsPurchased,
    totalGoldFromMonsters = savedStatistics.totalGoldFromMonsters,
    totalGoldFromItems = savedStatistics.totalGoldFromItems,
    directKills = savedStatistics.directKills,
    scrollKills = savedStatistics.scrollKills,
    minionKills = savedStatistics.minionKills,
    farmedKills = savedStatistics.farmedKills,
    characterStunnedCount = savedStatistics.characterStunnedCount,
    meleeAttackCount = savedStatistics.meleeAttackCount,
    rangedAttackCount = savedStatistics.rangedAttackCount,
    spellCastCount = savedStatistics.spellCastCount,
    potionsUsed = savedStatistics.potionsUsed,
    scrollsUsed = savedStatistics.scrollsUsed,
    minionsSummoned = savedStatistics.minionsSummoned,
    itemsSold = savedStatistics.itemsSold,
    itemsFound = savedStatistics.itemsFound,
    uncommonItemsFound = savedStatistics.uncommonItemsFound,
    rareItemsFound = savedStatistics.rareItemsFound,
    historicItemsFound = savedStatistics.historicItemsFound,
    ancientItemsFound = savedStatistics.ancientItemsFound,
    treasureChestsLooted = savedStatistics.treasureChestsLooted,
    weaponRacksLooted = savedStatistics.weaponRacksLooted,
    legacyWeaponsRacksLooted = savedStatistics.weaponsRacksLooted;
  var bookcasesLootedCount = savedStatistics.bookcasesLooted;
  if (!farmsPurchased) {
    farmsPurchased = dungeonsRef().farms.length;
  }
  statistics.playedMillis = isLifetime ? Math.max(0, totalPlayedMillis ? totalPlayedMillis : playedMillis) : Math.max(0, playedMillis ? playedMillis : 0);
  statistics.turnCount = turnCount ? turnCount : 0;
  statistics.doorsOpened = doorsOpened ? doorsOpened : 0;
  statistics.roomsCleared = roomsCleared ? roomsCleared : 0;
  statistics.levelsCleared = levelsCleared ? levelsCleared : 0;
  statistics.dungeonsCleared = dungeonsCleared ? dungeonsCleared : 0;
  statistics.castlesConquered = castlesConquered ? castlesConquered : 0;
  statistics.farmsPurchased = farmsPurchased;
  statistics.totalGoldFromMonsters = totalGoldFromMonsters ? totalGoldFromMonsters : 0;
  statistics.totalGoldFromItems = totalGoldFromItems ? totalGoldFromItems : 0;
  statistics.directKills = directKills ? directKills : 0;
  statistics.scrollKills = scrollKills ? scrollKills : 0;
  statistics.setMinionKills(minionKills ? minionKills : 0);
  statistics.setFarmedKills(farmedKills ? farmedKills : 0);
  statistics.characterStunnedCount = characterStunnedCount ? characterStunnedCount : 0;
  statistics.meleeAttackCount = meleeAttackCount ? meleeAttackCount : 0;
  statistics.rangedAttackCount = rangedAttackCount ? rangedAttackCount : 0;
  statistics.spellCastCount = spellCastCount ? spellCastCount : 0;
  statistics.potionsUsed = potionsUsed ? potionsUsed : 0;
  statistics.scrollsUsed = scrollsUsed ? scrollsUsed : 0;
  statistics.minionsSummoned = minionsSummoned ? minionsSummoned : 0;
  statistics.itemsSold = itemsSold ? itemsSold : 0;
  statistics.itemsFound = itemsFound ? itemsFound : 0;
  statistics.uncommonItemsFound = uncommonItemsFound ? uncommonItemsFound : 0;
  statistics.rareItemsFound = rareItemsFound ? rareItemsFound : 0;
  statistics.historicItemsFound = historicItemsFound ? historicItemsFound : 0;
  statistics.ancientItemsFound = ancientItemsFound ? ancientItemsFound : 0;
  statistics.treasureChestsLooted = treasureChestsLooted ? treasureChestsLooted : 0;
  statistics.bookcasesLooted = bookcasesLootedCount ? bookcasesLootedCount : 0;
  var maxWeaponRacksLooted = Math.max(weaponRacksLooted ? weaponRacksLooted : 0, legacyWeaponsRacksLooted ? legacyWeaponsRacksLooted : 0);
  statistics.weaponRacksLooted = maxWeaponRacksLooted;
}
export function initializePersistenceEntities() {
  // U134：顶层键读取用行内 cast 守卫（SaveMonsterTypesState 已进 SaveData；参数无 JSDoc
  // 标注，故不给参数标注而给读取点 cast——存档态 savedMonsterTypes 只读 min/max 两键，
  // 怪物等级数组另拆 levelStates，属 AST 恢复期写法，勿重排，负向验证 TS2339 红/还原绿）。
  MonsterSaveAdapter.prototype.restoreMonsterTypes = function (savedMonsterTypes) {
    var monsterCatalog = monsterCatalogRef();
    monsterCatalog.minUnlockedLevel = (/** @type {SaveMonsterTypesState} */ (savedMonsterTypes)).minUnlockedLevel;
    monsterCatalog.maxUnlockedLevel = (/** @type {SaveMonsterTypesState} */ (savedMonsterTypes)).maxUnlockedLevel;
    var levelStates = savedMonsterTypes.monsterLevelStates;
    for (var levelStateIndex = 0; levelStateIndex < levelStates.length; levelStateIndex++) {
      for (var levelState = levelStates[levelStateIndex], monsterLevel = levelState.level, monsterTypes = levelState.monsterTypes, restoredMonsterTypes = [], monsterTypeIndex = undefined, monsterTypeIndex = /** @type {any} */ (0); monsterTypeIndex < monsterTypes.length; monsterTypeIndex++) {
        restoredMonsterTypes.push(restoreMonsterType(monsterTypes[monsterTypeIndex], monsterLevel));
      }
      monsterCatalogRef().monsterTypesByLevelCache[monsterLevel + ""] = restoredMonsterTypes;
    }
  };
  StatisticsSaveAdapter.prototype.restoreScroll = function (entry) {
    var count = entry.count,
      locked = entry.locked,
      upgradeCount = entry.upgradeCount;
    if (entry = scrollsRef().getScrollById(entry.scrollId)) {
      entry.quantity = count;
      entry.applyLockedAndUpgradeState(locked, upgradeCount);
    }
  };
}
