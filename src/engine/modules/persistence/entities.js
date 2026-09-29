/** 角色、装备、怪物与统计序列化。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
/** @typedef {import('./save-dto.js').SaveMonsterTypesState} SaveMonsterTypesState */
/** @typedef {import('./save-dto.js').SaveMonsterTypeState} SaveMonsterTypeState */
/** @typedef {import('./save-dto.js').SaveMonsterTypeEntry} SaveMonsterTypeEntry */
import { Item, ItemEffect } from "../loot/items.js";
import { game } from "../runtime/game.js";
import { MonsterType, advanceMonsterTypeRank } from "../combat/encounters.js";
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
export function restoreItem(a) {
  var itemSlot = a.itemSlot,
    characterClass = a.characterClass,
    itemName = a.itemName,
    itemRarity = a.itemRarity,
    itemLevel = a.itemLevel,
    itemGold = a.itemGold,
    itemValue = a.itemValue,
    itemCharacteristic = a.itemCharacteristic,
    itemEffect;
  if (itemEffect = a.itemEffect) {
    var itemEffectType = itemEffect.itemEffectType,
      itemEffectDescription = itemEffect.itemEffectDescription;
    itemEffect = itemEffectType && itemEffectDescription ? new ItemEffect(itemEffectType, itemEffect.itemEffectAmount, itemEffectDescription, itemEffect.itemEffectName) : null;
  } else {
    itemEffect = null;
  }
  a = game.itemGenerator.itemTypesById[a.itemTypeId];
  return a ? new Item(a, itemSlot, characterClass, itemName ? itemName : "Error", itemLevel ? itemLevel : 1, itemRarity ? itemRarity : 0, itemGold ? itemGold : 0, itemValue ? itemValue : 0, itemCharacteristic ? itemCharacteristic : 1, itemEffect) : (console.log("failed to lookup item type"), null);
}
export function serializeCharacter(character) {
  var adventurerName = character.adventurerName,
    characterClass = character.characterClass,
    characterType = character.characterType,
    spriteName = character.getSprite().getName(),
    g;
  g = character.stats;
  g = {
    characterLevel: g.characterLevel,
    characterHealth: g.health,
    characterSpirit: g.spirit,
    kills: g.kills,
    damageComponent: serializeStatComponent(g.damage),
    armorComponent: serializeStatComponent(g.armor),
    attackRatingComponent: serializeStatComponent(g.attackRating),
    defenceRatingComponent: serializeStatComponent(g.defenceRating),
    maxHealthComponent: serializeStatComponent(g.maxHealth),
    maxSpiritComponent: serializeStatComponent(g.maxSpirit),
    stunCount: g.stunCount,
    minionKills: g.minionKills,
    damageGiven: g.damageGiven,
    damageReceived: g.damageReceived
  };
  var h;
  h = character.position;
  var room = h.room,
    n = h.currentHallway;
  h = {
    levelX: h.getLevelPositionX(),
    levelY: h.getLevelPositionY(),
    worldX: h.getWorldPositionX(),
    worldY: h.getWorldPositionY(),
    roomId: room ? room.roomId : -1,
    floorPositionIndex: h.floorPositionIndex,
    hallwayId: n ? n.hallwayId : -1
  };
  var n = character.spells,
    spellStateList = /** @type {any} */ ([]),
    spellIndex;
  if (n) {
    for (spellIndex = 0; spellIndex < n.length; spellIndex++) {
      spellStateList.push({
        spellName: n[spellIndex].name
      });
    }
  }
  var inventory = character.inventory;
  n = [];
  if (inventory) {
    inventory = inventory.items;
    var itemIndex;
    for (itemIndex = 0; itemIndex < inventory.length; itemIndex++) {
      n.push(serializeItem(inventory[itemIndex]));
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
    characteristicsComponent: g,
    positionComponent: h,
    spells: spellStateList,
    inventory: n,
    equippedItemCollection: equippedItemList,
    skillPoints: character.skillPoints,
    initialSpellSkillPoint: character.initialSpellSkillPoint,
    upgrades1: serializeUpgradeFlags(character.skillTree1.upgrades),
    upgrades2: serializeUpgradeFlags(character.skillTree2.upgrades),
    upgrades3: serializeUpgradeFlags(character.skillTree3.upgrades),
    upgrades4: serializeUpgradeFlags(character.skillTree4.upgrades)
  };
}
export function serializeUpgradeFlags(upgradeList) {
  var ownedFlagsById = {},
    upgrade,
    upgradeIndex;
  for (upgradeIndex = 0; upgradeIndex < upgradeList.length; upgradeIndex++) {
    upgrade = upgradeList[upgradeIndex];
    ownedFlagsById[upgrade.getUpgradeDefinition().id] = upgrade.isOwned();
  }
  return ownedFlagsById;
}
export function restoreUpgradeFlags(upgradeList, ownedFlagsById) {
  var upgradeIndex, d, upgrade;
  for (upgradeIndex = 0; upgradeIndex < upgradeList.length; upgradeIndex++) {
    upgrade = upgradeList[upgradeIndex];
    d = upgradeList[upgradeIndex].getUpgradeDefinition();
    d = ownedFlagsById[d.id];
    upgrade.setPurchased(d);
  }
}
export function serializeStatComponent(statComponent) {
  return statComponent ? {
    itemValue: statComponent.itemValue,
    levelValue: statComponent.levelValue,
    spellBonusPercent: statComponent.spellBonusPercent,
    skillBonusPercent: statComponent.skillBonusPercent
  } : null;
}
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
export function restoreStatistics(a, statistics, isLifetime) {
  var totalPlayedMillis = a.totalPlayedMillis,
    playedMillis = a.playedMillis,
    turnCount = a.turnCount,
    doorsOpened = a.doorsOpened,
    roomsCleared = a.roomsCleared,
    levelsCleared = a.levelsCleared,
    dungeonsCleared = a.dungeonsCleared,
    castlesConquered = a.castlesConquered,
    farmsPurchased = a.farmsPurchased,
    totalGoldFromMonsters = a.totalGoldFromMonsters,
    totalGoldFromItems = a.totalGoldFromItems,
    directKills = a.directKills,
    scrollKills = a.scrollKills,
    minionKills = a.minionKills,
    farmedKills = a.farmedKills,
    characterStunnedCount = a.characterStunnedCount,
    meleeAttackCount = a.meleeAttackCount,
    rangedAttackCount = a.rangedAttackCount,
    spellCastCount = a.spellCastCount,
    potionsUsed = a.potionsUsed,
    scrollsUsed = a.scrollsUsed,
    minionsSummoned = a.minionsSummoned,
    itemsSold = a.itemsSold,
    itemsFound = a.itemsFound,
    uncommonItemsFound = a.uncommonItemsFound,
    rareItemsFound = a.rareItemsFound,
    historicItemsFound = a.historicItemsFound,
    ancientItemsFound = a.ancientItemsFound,
    treasureChestsLooted = a.treasureChestsLooted,
    weaponRacksLooted = a.weaponRacksLooted,
    legacyWeaponsRacksLooted = a.weaponsRacksLooted;
  a = a.bookcasesLooted;
  if (!farmsPurchased) {
    farmsPurchased = game.dungeons.farms.length;
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
  statistics.bookcasesLooted = a ? a : 0;
  var maxWeaponRacksLooted = Math.max(weaponRacksLooted ? weaponRacksLooted : 0, legacyWeaponsRacksLooted ? legacyWeaponsRacksLooted : 0);
  statistics.weaponRacksLooted = maxWeaponRacksLooted;
}
export function initializePersistenceEntities() {
  // U134：顶层键读取用行内 cast 守卫（SaveMonsterTypesState 已进 SaveData；JS 里 JSDoc
  // 参数标注不被赋值收窄覆盖——参数 a 在下方被复用为 levelStates 数组，属 AST 恢复期
  // 写法，勿重排、勿改复用形态，故不给参数标注而给读取点 cast，负向验证 TS2339 红/还原绿）。
  MonsterSaveAdapter.prototype.restoreMonsterTypes = function (a) {
    var monsterCatalog = game.monsterCatalog;
    monsterCatalog.minUnlockedLevel = (/** @type {SaveMonsterTypesState} */ (a)).minUnlockedLevel;
    monsterCatalog.maxUnlockedLevel = (/** @type {SaveMonsterTypesState} */ (a)).maxUnlockedLevel;
    a = a.monsterLevelStates;
    for (var levelStateIndex = 0; levelStateIndex < a.length; levelStateIndex++) {
      for (var c = a[levelStateIndex], monsterLevel = c.level, c = c.monsterTypes, restoredMonsterTypes = [], monsterTypeIndex = undefined, monsterTypeIndex = /** @type {any} */ (0); monsterTypeIndex < c.length; monsterTypeIndex++) {
        restoredMonsterTypes.push(restoreMonsterType(c[monsterTypeIndex], monsterLevel));
      }
      game.monsterCatalog.monsterTypesByLevelCache[monsterLevel + ""] = restoredMonsterTypes;
    }
  };
  StatisticsSaveAdapter.prototype.restoreScroll = function (entry) {
    var count = entry.count,
      locked = entry.locked,
      upgradeCount = entry.upgradeCount;
    if (entry = game.scrolls.getScrollById(entry.scrollId)) {
      entry.quantity = count;
      entry.applyLockedAndUpgradeState(locked, upgradeCount);
    }
  };
}
