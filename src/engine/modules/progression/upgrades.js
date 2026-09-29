/** 可购买升级、技能树与购买条件。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { floorNumber, recordGameEvent, scaleByLevel } from "../core/math.js";
import { invalidateCastleRevision, refreshAttackableCastles, refreshScheduledCastles } from "../world/regions.js";
import { addGold, addKills, getPartyMinLevel, refreshPartyLevels, spendGold, spendKills } from "../characters/party.js";
import { VISIBLE_MONSTER_LEVELS, attackCooldownBonus, dungeonCostBonus, equipmentQualityBonus, globalUpgradePriceCurve, healthRegenerationBonus, itemCostBonus, monsterUnlockPriceCurve, offlineTimeBonus, partyCapacityBonus, potionCapacityBonus, potionDurationBonus, potionPowerBonus, scrollCapacityBonus, spiritRegenerationBonus, walkingSpeedBonus } from "../content/balance.js";
import { isBetterItem } from "../loot/items.js";
import { applyLevelStats, initializeCharacterSkills } from "../simulation/characters.js";
import { hasUnspentSkills, learnSpell } from "../characters/character.js";
import { awardAdventurePoints } from "./points.js";
import { applyStatBonus, recalculateCharacterSkills } from "../combat/skill-effects.js";
import { Spell, getNextScrollLabel, getScrollLabel, getScrollUpgradeCost, registerUnlockedScroll } from "../combat/scrolls.js";
import { canFarmDungeon } from "../world/dungeons.js";
import { purchaseDungeonFarm } from "../simulation/tick.js";
import { updateScrollAccuracy } from "../characters/stats.js";
import { applyAchievementReward, getAchievementRequirementLabel, getAchievementRewardLabel } from "./achievements.js";
/** @typedef {{ canPurchaseNow: () => boolean, lastChangeFrame: number }} SortableUpgrade */
/** @typedef {{ getCost: () => number, isDisplayable: () => boolean, isNearlyAffordable: () => boolean, getSpell: () => Spell, getTitle: () => string, getScroll: () => import("../combat/scrolls.js").Scroll, prerequisite: { isOwned: () => boolean } | null }} UpgradeMethods */
export var SKILL_UPGRADE_TYPE;
export function Upgrade() {
  this.lastAvailabilityFrame = -100;
  this.prerequisite = null;
  this.availabilityChanged = false;
  this.lastChangeFrame = 0;
}
export function refreshUpgradeAvailability(upgrade) {
  if (game.state.frameNumber != upgrade.lastAvailabilityFrame) {
    upgrade.lastAvailabilityFrame = game.state.frameNumber;
    upgrade.availabilityChanged = upgrade.refreshAvailabilityState();
  }
  return upgrade.availabilityChanged;
}
export function markUpgradeChanged(upgrade) {
  upgrade.lastChangeFrame = game.state.frameNumber;
}
export function UpgradeCollection(upgradeRows, sortEnabled) {
  this.upgradeRows = upgradeRows;
  var rowIndex, sortedUpgrades,
    upgradeIndex,
    upgradeRow,
    allUpgrades = [];
  for (rowIndex = 0; rowIndex < upgradeRows.length; rowIndex++) {
    for (upgradeRow = upgradeRows[rowIndex], upgradeIndex = 0; upgradeIndex < upgradeRow.length; upgradeIndex++) {
      allUpgrades.push(upgradeRow[upgradeIndex]);
    }
  }
  this.upgrades = allUpgrades;
  if (sortEnabled) {
    for (sortedUpgrades = [], upgradeIndex = 0; upgradeIndex < this.upgrades.length; upgradeIndex++) {
      sortedUpgrades.push(null);
    }
  } else {
    sortedUpgrades = null;
  }
  this.sortedUpgrades = sortedUpgrades;
  this.updateCounter = 0;
  this.sortEnabled = sortEnabled;
  this.lastSortFrame = 0;
}
export function resetUpgradeCollection(collection) {
  var upgradeIndex;
  for (upgradeIndex = 0; upgradeIndex < collection.upgrades.length; upgradeIndex++) {
    collection.upgrades[upgradeIndex].resetState();
  }
  collection.updateCounter = 0;
  collection.lastSortFrame = game.state.frameNumber - 1;
}
export function restoreUpgradeCollection(collection) {
  var rowIndex, upgradeIndex, upgradeRow;
  for (rowIndex = 0; rowIndex < collection.upgradeRows.length; rowIndex++) {
    for (upgradeRow = collection.upgradeRows[rowIndex], upgradeIndex = 0; upgradeIndex < upgradeRow.length; upgradeIndex++) {
      upgradeRow[upgradeIndex].restoreState();
    }
  }
  collection.updateCounter = 0;
}
export function refreshUpgradeCollection(collection) {
  var upgradeIndex, upgradesSwap,
    changed = false,
    sortedCount, upgradeChanged;
  for (upgradeIndex = 0; upgradeIndex < collection.upgrades.length; upgradeIndex++) {
    if (upgradeChanged = refreshUpgradeAvailability(collection.upgrades[upgradeIndex])) {
      changed = true;
    }
  }
  if (changed) {
    if (collection.sortEnabled) {
      sortedCount = 0;
      var lastSortFrame = collection.lastSortFrame;
      for (upgradeIndex = 0; upgradeIndex < collection.upgrades.length; upgradeIndex++) {
        var sortUpgrade = /** @type {SortableUpgrade} */ (/** @type {unknown} */ (collection.upgrades[upgradeIndex]));
        if (sortUpgrade.canPurchaseNow() && sortUpgrade.lastChangeFrame < lastSortFrame) {
          collection.sortedUpgrades[sortedCount++] = collection.upgrades[upgradeIndex];
        }
      }
      for (upgradeIndex = 0; upgradeIndex < collection.upgrades.length; upgradeIndex++) {
        sortUpgrade = /** @type {SortableUpgrade} */ (/** @type {unknown} */ (collection.upgrades[upgradeIndex]));
        if (sortUpgrade.canPurchaseNow() && sortUpgrade.lastChangeFrame >= lastSortFrame) {
          collection.sortedUpgrades[sortedCount++] = collection.upgrades[upgradeIndex];
        }
      }
      for (upgradeIndex = 0; upgradeIndex < collection.upgrades.length; upgradeIndex++) {
        sortUpgrade = /** @type {SortableUpgrade} */ (/** @type {unknown} */ (collection.upgrades[upgradeIndex]));
        if (!sortUpgrade.canPurchaseNow()) {
          collection.sortedUpgrades[sortedCount++] = collection.upgrades[upgradeIndex];
        }
      }
      upgradesSwap = collection.upgrades;
      collection.upgrades = collection.sortedUpgrades;
      collection.sortedUpgrades = upgradesSwap;
      collection.lastSortFrame = game.state.frameNumber;
    }
    collection.updateCounter++;
  }
}
export function PurchaseItemUpgrade(castleIndex) {
  this.castleIndex = castleIndex;
  this.castle = null;
  this.cachedDescription = "计划攻击";
  this.cachedAffordableSoon = this.cachedCanPurchase = this.affordableSoon = this.canPurchase = false;
}
export function GlobalUpgrade(definition) {
  this.definition = definition;
  this.canPurchase = this.affordableSoon = false;
  this.cachedPurchasedLevels = -1;
  this.cachedDescription = this.cachedCanPurchase = this.cachedAffordableSoon = false;
  recalculateGlobalUpgrade(this);
}
export function recalculateGlobalUpgrade(upgrade) {
  upgrade.definition.cost = scaleByLevel(upgrade.definition.baseCost + upgrade.definition.purchasedLevels * upgrade.definition.costPerLevel, globalUpgradePriceCurve, 1);
  upgrade.definition.currentValue = upgrade.definition.baseValue + upgrade.definition.purchasedLevels * upgrade.definition.perLevelIncrement;
  if (upgrade.definition.currentValue > upgrade.definition.maxValue) {
    upgrade.definition.currentValue = upgrade.definition.maxValue;
  }
}
export function EquipBestItemUpgrade(itemCountThreshold) {
  this.hasCandidate = false;
  this.cachedCandidateCount = -1;
  this.descriptionLabel = "";
  this.itemCountThreshold = itemCountThreshold;
}
export function EquipItemUpgrade(inventoryIndex, itemCountThreshold) {
  this.hasCandidate = false;
  this.inventoryIndex = inventoryIndex;
  this.descriptionLabel = this.item = null;
  this.itemCountThreshold = itemCountThreshold;
}
export function LevelUpUpgrade(adventurerIndex) {
  this.cachedCanPurchase = this.cachedAffordableSoon = this.canPurchase = this.affordableSoon = false;
  this.cachedRequiredExperience = -1;
  this.descriptionLabel = null;
  this.requiredExperience = 0;
  this.adventurerIndex = adventurerIndex;
}
export function UnlockMonsterLevelUpgrade() {
  this.unlockLevel = -1;
  this.cachedUnlockCost = 1;
  this.displayableSoon = this.canPurchase = false;
  this.cachedTitle = "解锁怪物等级";
}
export function RetireMonsterLevelUpgrade() {
  this.retireLevel = -1;
  this.cachedRetireCost = 1;
  this.displayableSoon = this.affordableSoon = this.canPurchase = false;
  this.cachedTitle = "退休怪物等级";
}
export function CharacterSkillUpgrade(skillDefinition) {
  this.skillDefinition = skillDefinition;
  this.character = null;
  this.purchased = this.canPurchase = false;
}
export function LearnSpellUpgrade(spellDefinition) {
  this.spellDefinition = spellDefinition;
  this.character = null;
  this.purchased = this.canPurchase = false;
  this.spell = null;
}
export function PurchaseDungeonUpgrade(dungeon) {
  this.dungeon = dungeon;
  this.cachedDescription = this.cachedCanPurchase = this.cachedAffordableSoon = this.canPurchase = this.affordableSoon = false;
}
export function PurchaseCastleUpgrade(dungeonIndex) {
  this.dungeonIndex = dungeonIndex;
  this.dungeon = null;
  this.cachedDescription = this.cachedCanPurchase = this.cachedAffordableSoon = this.canPurchase = this.affordableSoon = false;
}
export function AutoPurchaseDungeonUpgrade() {
  this.cachedCanPurchase = this.canPurchase = false;
}
export function ScrollUpgrade(scrollId) {
  this.scrollId = scrollId;
  this.affordableSoon = this.canPurchase = false;
  this.scroll = null;
}
export function ClaimAchievementUpgrade(claimQueueIndex) {
  this.claimQueueIndex = claimQueueIndex;
  this.achievement = null;
  this.cachedTitle = "Achievement";
  this.cachedDescription = "Reward";
  this.cachedCanPurchase = this.canPurchase = false;
}
export function AchievementUpgrade(achievement) {
  this.achievement = achievement;
  this.cachedTitle = this.achievement.obtained ? this.achievement.name : getAchievementRequirementLabel(this.achievement);
  this.cachedDescription = getAchievementActionLabel(this);
  this.cachedObtained = this.cachedApplied = this.canPurchase = false;
}
export function getAchievementActionLabel(upgrade) {
  return upgrade.achievement.obtained ? getAchievementRewardLabel(upgrade.achievement) : "奖励不明";
}
export function AdventurePointUpgrade(definition) {
  this.definition = definition;
  this.cachedCanPurchase = this.purchased = this.canPurchase = false;
}
export function applyPointUpgrade(upgrade) {
  var modifier = getPointUpgradeModifier(upgrade);
  modifier.currentValue += modifier.levelIncrement;
}
export function getPointUpgradeModifier(upgrade) {
  switch (upgrade.definition.bonusIndex) {
    case 5:
      return dungeonCostBonus;
    case 4:
      return partyCapacityBonus;
    case 3:
      return potionCapacityBonus;
    case 1:
      return scrollCapacityBonus;
    case 6:
      return itemCostBonus;
    case 2:
      return walkingSpeedBonus;
    case 7:
      return potionDurationBonus;
    case 8:
      return potionPowerBonus;
    case 9:
      return offlineTimeBonus;
    case 10:
      return equipmentQualityBonus;
    case 11:
      return attackCooldownBonus;
    case 12:
      return healthRegenerationBonus;
    case 13:
      return spiritRegenerationBonus;
  }
  console.log("Failed to find point upgrade setting: " + upgrade.definition.bonusIndex);
  return null;
}
export function CollectFarmUpgrade() {
  this.cachedCanPurchase = this.canPurchase = false;
}
export function initializeProgressionUpgrades() {
  SKILL_UPGRADE_TYPE = 5;
  Upgrade.prototype.bindCharacter = function () {};
  Upgrade.prototype.isDisplayable = function () {
    return true;
  };
  Upgrade.prototype.canPurchaseNow = function () {
    return false;
  };
  Upgrade.prototype.getDungeon = function () {
    return null;
  };
  Upgrade.prototype.getScrollItem = function () {
    return null;
  };
  Upgrade.prototype.getTitle = function () {
    return "upgrade title";
  };
  Upgrade.prototype.resetState = function () {};
  Upgrade.prototype.isOwned = function () {
    return false;
  };
  Upgrade.prototype.getUpgradeType = function () {
    return null;
  };
  Upgrade.prototype.getSpell = function () {
    return null;
  };
  Upgrade.prototype.getCharacter = function () {
    return null;
  };
  Upgrade.prototype.getMonsterLevel = function () {
    return 1;
  };
  Upgrade.prototype.getItems = function () {
    return null;
  };
  Upgrade.prototype.restoreState = function () {};
  Upgrade.prototype.purchase = function () {};
  Upgrade.prototype.getDescription = function () {};
  Upgrade.prototype.getUpgradeItem = function () {
    return null;
  };
  Upgrade.prototype.getCost = function () {
    return 0;
  };
  Upgrade.prototype.refreshAvailabilityState = function () {
    return false;
  };
  PurchaseItemUpgrade.prototype = new Upgrade();
  PurchaseItemUpgrade.prototype.isDisplayable = function () {
    return this.canPurchase || this.affordableSoon;
  };
  PurchaseItemUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  PurchaseItemUpgrade.prototype.getDescription = function () {
    return this.cachedDescription;
  };
  PurchaseItemUpgrade.prototype.getTitle = function () {
    return "攻击城堡";
  };
  PurchaseItemUpgrade.prototype.isOwned = function () {
    return this.castle && (this.castle.attackScheduled || this.castle.conquered);
  };
  PurchaseItemUpgrade.prototype.getUpgradeType = function () {
    return 13;
  };
  PurchaseItemUpgrade.prototype.purchase = function () {
    if (this.castle) {
      recordGameEvent("Castle", "计划攻击:" + this.castle.castleName);
      this.castle.attackScheduled = true;
      invalidateCastleRevision();
      refreshScheduledCastles(this.castle);
      refreshAttackableCastles(this.castle);
      this.canPurchase = false;
      this.castle = null;
      markUpgradeChanged(this);
    }
  };
  PurchaseItemUpgrade.prototype.refreshAvailabilityState = function () {
    var attackableCastles, castle;
    attackableCastles = game.castles.attackableCastles;
    if (castle = this.castleIndex < attackableCastles.length ? attackableCastles[this.castleIndex] : null) {
      this.canPurchase = game.monsterCatalog.maxUnlockedLevel >= castle.requiredMonsterLevel;
      this.affordableSoon = !this.canPurchase;
    } else {
      this.affordableSoon = this.canPurchase = false;
    }
    var changed = this.castle != castle || this.cachedCanPurchase != this.canPurchase || this.cachedAffordableSoon != this.affordableSoon;
    if (changed && castle) {
      this.cachedDescription = this.canPurchase ? castle.castleName : "需要怪物等级: " + castle.requiredMonsterLevel;
    }
    this.castle = castle;
    this.cachedCanPurchase = this.canPurchase;
    this.cachedAffordableSoon = this.affordableSoon;
    return changed;
  };
  GlobalUpgrade.prototype = new Upgrade();
  GlobalUpgrade.prototype.restoreState = function () {
    if (0 < this.definition.purchasedLevels) {
      recalculateGlobalUpgrade(this);
    }
  };
  GlobalUpgrade.prototype.resetState = function () {
    this.definition.purchasedLevels = 0;
    recalculateGlobalUpgrade(this);
  };
  GlobalUpgrade.prototype.getTitle = function () {
    return this.definition.title;
  };
  GlobalUpgrade.prototype.getUpgradeType = function () {
    return 1;
  };
  GlobalUpgrade.prototype.isDisplayable = function () {
    return this.canPurchase || this.affordableSoon;
  };
  GlobalUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  GlobalUpgrade.prototype.purchase = function () {
    if (!(this.definition.cost > game.state.party.kills)) {
      spendKills(game.state.party, this.definition.cost);
      this.definition.purchasedLevels++;
      this.canPurchase = false;
      recalculateGlobalUpgrade(this);
      markUpgradeChanged(this);
      recordGameEvent("Upgrade", this.definition.title + " 数值:" + this.definition.currentValue);
    }
  };
  GlobalUpgrade.prototype.getCost = function () {
    return this.definition.cost;
  };
  GlobalUpgrade.prototype.getDescription = function () {
    return this.definition.description;
  };
  GlobalUpgrade.prototype.refreshAvailabilityState = function () {
    if (this.definition.currentValue >= this.definition.maxValue) {
      this.affordableSoon = this.canPurchase = false;
    } else {
      this.canPurchase = this.definition.cost <= game.state.party.kills;
      this.affordableSoon = !this.canPurchase && (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).isNearlyAffordable();
    }
    var displayable = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).isDisplayable(),
      changed = this.cachedPurchasedLevels !== this.definition.purchasedLevels || this.cachedCanPurchase !== this.canPurchase || this.cachedDescription !== this.affordableSoon || this.cachedAffordableSoon !== displayable;
    this.cachedPurchasedLevels = this.definition.purchasedLevels;
    this.cachedCanPurchase = this.canPurchase;
    this.cachedDescription = this.affordableSoon;
    this.cachedAffordableSoon = displayable;
    return changed;
  };
  GlobalUpgrade.prototype.isNearlyAffordable = function () {
    var kills = game.state.party.kills, killGap;
    if (kills >= this.definition.cost) {
      return false;
    }
    killGap = this.definition.cost - kills;
    return 400 >= killGap || killGap <= 0.3 * this.definition.cost;
  };
  EquipBestItemUpgrade.prototype = new Upgrade();
  EquipBestItemUpgrade.prototype.getDungeon = function () {
    return null;
  };
  EquipBestItemUpgrade.prototype.getItems = function () {
    return game.inventories.list;
  };
  EquipBestItemUpgrade.prototype.getTitle = function () {
    return "装备所有道具";
  };
  EquipBestItemUpgrade.prototype.getUpgradeType = function () {
    return 4;
  };
  EquipBestItemUpgrade.prototype.getDescription = function () {
    return this.descriptionLabel;
  };
  EquipBestItemUpgrade.prototype.purchase = function () {
    var inventories = game.inventories,
      adventurerIndex;
    for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
      inventories.equipBestForCharacter(game.state.adventurers[adventurerIndex]);
    }
    markUpgradeChanged(this);
  };
  EquipBestItemUpgrade.prototype.isDisplayable = function () {
    return this.hasCandidate;
  };
  EquipBestItemUpgrade.prototype.canPurchaseNow = function () {
    return this.hasCandidate;
  };
  EquipBestItemUpgrade.prototype.refreshAvailabilityState = function () {
    var adventurerIndex, candidateCount,
      betterItemCount = 0;
    for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
      var adventurer, adventurerCandidateCount, changed;
      adventurer = game.state.adventurers[adventurerIndex];
      var inventoryItems = adventurer.inventory.items;
      if (inventoryItems && 0 !== inventoryItems.length) {
        for (var item = undefined, equippedItem = undefined, adventurerBetterItemCount = 0, itemIndex = 0; itemIndex < inventoryItems.length; itemIndex++) {
          item = inventoryItems[itemIndex];
          if (!((equippedItem = adventurer.getSlotItem(item.slot)) && !isBetterItem(item, equippedItem))) {
            adventurerBetterItemCount++;
          }
        }
        adventurerCandidateCount = adventurerBetterItemCount;
      } else {
        adventurerCandidateCount = 0;
      }
      betterItemCount += adventurerCandidateCount;
    }
    candidateCount = betterItemCount;
    var hasBetterItems = candidateCount > this.itemCountThreshold;
    if (changed = this.hasCandidate !== hasBetterItems || this.cachedCandidateCount !== candidateCount) {
      this.descriptionLabel = "装备所有更好的道具(" + candidateCount + ")";
    }
    this.hasCandidate = hasBetterItems;
    this.cachedCandidateCount = candidateCount;
    return changed;
  };
  EquipItemUpgrade.prototype = new Upgrade();
  EquipItemUpgrade.prototype.getDungeon = function () {
    return null;
  };
  EquipItemUpgrade.prototype.resetState = function () {
    this.descriptionLabel = this.item = null;
  };
  EquipItemUpgrade.prototype.getUpgradeItem = function () {
    return this.item;
  };
  EquipItemUpgrade.prototype.getUpgradeType = function () {
    return 3;
  };
  EquipItemUpgrade.prototype.getDescription = function () {
    return this.descriptionLabel;
  };
  EquipItemUpgrade.prototype.purchase = function () {
    var inventory = this.item.inventory;
    if (inventory) {
      inventory.equipItem(this.item);
      markUpgradeChanged(this);
    }
  };
  EquipItemUpgrade.prototype.isDisplayable = function () {
    return this.hasCandidate;
  };
  EquipItemUpgrade.prototype.canPurchaseNow = function () {
    return this.hasCandidate;
  };
  EquipItemUpgrade.prototype.refreshAvailabilityState = function () {
    var inventoryList = game.inventories.list,
      previousHasCandidate = this.hasCandidate,
      previousItem = this.item;
    if (inventoryList.length <= this.itemCountThreshold && inventoryList.length > this.inventoryIndex) {
      this.item = inventoryList[this.inventoryIndex];
      if (previousItem != this.item) {
        this.descriptionLabel = "Equip " + this.item.itemName;
      }
      this.hasCandidate = true;
    } else {
      this.descriptionLabel = this.item = null;
      this.hasCandidate = false;
    }
    return previousHasCandidate != this.hasCandidate || previousItem != this.item;
  };
  LevelUpUpgrade.prototype = new Upgrade();
  LevelUpUpgrade.prototype.resetState = function () {
    this.descriptionLabel = null;
  };
  LevelUpUpgrade.prototype.getCharacter = function () {
    return this.adventurerIndex >= game.state.adventurers.length ? null : game.state.adventurers[this.adventurerIndex];
  };
  LevelUpUpgrade.prototype.getUpgradeType = function () {
    return 2;
  };
  LevelUpUpgrade.prototype.getDescription = function () {
    return this.descriptionLabel;
  };
  LevelUpUpgrade.prototype.purchase = function () {
    if (!(this.adventurerIndex >= game.state.adventurers.length)) {
      this.canPurchase = false;
      var adventurer = game.state.adventurers[this.adventurerIndex],
        stats = adventurer.stats, minionList, newPartyMinLevel, scrollCasterStats,
        requiredExperience = stats.experienceToLevelUp, newLevel,
        previousPartyMinLevel = getPartyMinLevel(), scrollCaster;
      if (!(game.state.party.experiencePoints < requiredExperience)) {
        var party = game.state.party, minionIndex, scrollCasterLevel;
        party.experiencePoints -= requiredExperience;
        if (0 > party.experiencePoints) {
          party.experiencePoints = 0;
        }
        newLevel = stats.characterLevel + 1;
        applyLevelStats(stats, newLevel, adventurer.classDefinition.statMultipliers);
        adventurer.skillPoints++;
        adventurer.hasUnspentSkills = hasUnspentSkills(adventurer);
        stats.characterLevel = newLevel;
        if ((minionList = adventurer.summonedMinions) && 0 < minionList.length) {
          for (minionIndex = 0; minionIndex < minionList.length; minionIndex++) {
            var minion = minionList[minionIndex],
              minionLevel = newLevel;
            minion.stats.characterLevel = minionLevel;
            applyLevelStats(minion.stats, minionLevel, minion.classDefinition.statMultipliers);
            initializeCharacterSkills(minion, minionLevel);
          }
        }
        refreshPartyLevels();
        newPartyMinLevel = getPartyMinLevel();
        if (previousPartyMinLevel !== newPartyMinLevel) {
          scrollCaster = game.state.scrollCaster;
          scrollCasterStats = scrollCaster.stats;
          scrollCasterLevel = getPartyMinLevel();
          initializeCharacterSkills(scrollCaster, scrollCasterLevel);
          applyLevelStats(scrollCasterStats, scrollCasterLevel, scrollCaster.classDefinition.statMultipliers);
          scrollCasterStats.characterLevel = scrollCasterLevel;
        }
        awardAdventurePoints(22);
        recordGameEvent("Adventurer", "升级" + adventurer.classDefinition.className + ": " + newLevel);
      }
      markUpgradeChanged(this);
    }
  };
  LevelUpUpgrade.prototype.isNearlyAffordable = function () {
    var partyExperience = game.state.party.experiencePoints, experienceGap,
      requiredExperience = game.state.adventurers[this.adventurerIndex].stats.experienceToLevelUp;
    if (partyExperience >= requiredExperience) {
      return false;
    }
    experienceGap = requiredExperience - partyExperience;
    return 300 >= experienceGap ? true : experienceGap <= 0.2 * requiredExperience;
  };
  LevelUpUpgrade.prototype.isDisplayable = function () {
    return this.canPurchase || this.affordableSoon;
  };
  LevelUpUpgrade.prototype.getCost = function () {
    return this.requiredExperience;
  };
  LevelUpUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  LevelUpUpgrade.prototype.refreshAvailabilityState = function () {
    if (this.adventurerIndex >= game.state.adventurers.length) {
      this.affordableSoon = this.canPurchase = false;
    } else {
      var adventurer = game.state.adventurers[this.adventurerIndex], changed;
      if (!this.descriptionLabel) {
        this.descriptionLabel = "升级" + adventurer.adventurerName;
      }
      this.requiredExperience = adventurer.stats.experienceToLevelUp;
      this.canPurchase = game.state.party.experiencePoints >= this.requiredExperience;
      this.affordableSoon = !this.canPurchase && (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).isNearlyAffordable();
      changed = this.cachedCanPurchase !== this.canPurchase || this.cachedAffordableSoon !== this.affordableSoon || this.cachedRequiredExperience !== this.requiredExperience;
      this.cachedCanPurchase = this.canPurchase;
      this.cachedAffordableSoon = this.affordableSoon;
      this.cachedRequiredExperience = this.requiredExperience;
      return changed;
    }
  };
  UnlockMonsterLevelUpgrade.prototype = new Upgrade();
  UnlockMonsterLevelUpgrade.prototype.restoreState = function () {
    if (!this.displayableSoon) {
      this.displayableSoon = true;
      this.unlockLevel = game.monsterCatalog.maxUnlockedLevel + 1;
      this.cachedUnlockCost = scaleByLevel(this.unlockLevel, monsterUnlockPriceCurve, 1);
      this.cachedTitle = "解锁怪物等级" + this.unlockLevel;
    }
  };
  UnlockMonsterLevelUpgrade.prototype.getMonsterLevel = function () {
    return this.unlockLevel;
  };
  UnlockMonsterLevelUpgrade.prototype.resetState = function () {
    this.displayableSoon = false;
    this.unlockLevel = game.monsterCatalog.maxUnlockedLevel + 1;
    this.cachedUnlockCost = scaleByLevel(this.unlockLevel, monsterUnlockPriceCurve, 1);
    this.cachedTitle = "解锁怪物等级" + this.unlockLevel;
  };
  UnlockMonsterLevelUpgrade.prototype.getTitle = function () {
    return this.cachedTitle;
  };
  UnlockMonsterLevelUpgrade.prototype.getUpgradeType = function () {
    return 11;
  };
  UnlockMonsterLevelUpgrade.prototype.getDescription = function () {
    return "";
  };
  UnlockMonsterLevelUpgrade.prototype.purchase = function () {
    if (this.canPurchase) {
      spendKills(game.state.party, (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost());
      var monsterCatalog = game.monsterCatalog;
      monsterCatalog.maxUnlockedLevel = Math.max(monsterCatalog.maxUnlockedLevel, this.unlockLevel);
      this.canPurchase = false;
      markUpgradeChanged(this);
      recordGameEvent("Monster Level", "解锁等级" + this.unlockLevel);
    }
  };
  UnlockMonsterLevelUpgrade.prototype.isDisplayable = function () {
    return true;
  };
  UnlockMonsterLevelUpgrade.prototype.getCost = function () {
    return floorNumber(this.cachedUnlockCost * itemCostBonus.currentValue);
  };
  UnlockMonsterLevelUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  UnlockMonsterLevelUpgrade.prototype.refreshAvailabilityState = function () {
    var previousCanPurchase = this.canPurchase,
      previousUnlockLevel = this.unlockLevel,
      nextUnlockLevel = game.monsterCatalog.maxUnlockedLevel + 1, canUnlock;
    if (this.unlockLevel != nextUnlockLevel) {
      this.unlockLevel = nextUnlockLevel;
      this.cachedUnlockCost = scaleByLevel(this.unlockLevel, monsterUnlockPriceCurve, 1);
      this.cachedTitle = "解锁怪物等级" + this.unlockLevel;
    }
    if (canUnlock = game.state.party.kills >= (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost()) {
      if (canUnlock = getPartyMinLevel() >= this.unlockLevel) {
        var catalog = game.monsterCatalog;
        canUnlock = 1 + catalog.maxUnlockedLevel - catalog.minUnlockedLevel < VISIBLE_MONSTER_LEVELS;
      }
    }
    this.canPurchase = canUnlock;
    return previousCanPurchase !== this.canPurchase || previousUnlockLevel !== this.unlockLevel;
  };
  RetireMonsterLevelUpgrade.prototype = new Upgrade();
  RetireMonsterLevelUpgrade.prototype.restoreState = function () {
    if (!this.displayableSoon) {
      this.displayableSoon = true;
      this.retireLevel = game.monsterCatalog.minUnlockedLevel;
      this.cachedRetireCost = scaleByLevel(this.retireLevel, monsterUnlockPriceCurve, 1);
      this.cachedTitle = "退休怪物等级" + this.retireLevel;
    }
  };
  RetireMonsterLevelUpgrade.prototype.getMonsterLevel = function () {
    return this.retireLevel;
  };
  RetireMonsterLevelUpgrade.prototype.resetState = function () {
    this.displayableSoon = false;
    this.retireLevel = game.monsterCatalog.minUnlockedLevel;
    this.cachedRetireCost = scaleByLevel(this.retireLevel, monsterUnlockPriceCurve, 1);
    this.cachedTitle = "退休怪物等级" + this.retireLevel;
  };
  RetireMonsterLevelUpgrade.prototype.getTitle = function () {
    return this.cachedTitle;
  };
  RetireMonsterLevelUpgrade.prototype.getUpgradeType = function () {
    return 11;
  };
  RetireMonsterLevelUpgrade.prototype.getDescription = function () {
    return "";
  };
  RetireMonsterLevelUpgrade.prototype.purchase = function () {
    if (this.canPurchase) {
      spendKills(game.state.party, (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost());
      var retireLevel = this.retireLevel,
        monsterCatalog = game.monsterCatalog;
      if (retireLevel >= monsterCatalog.maxUnlockedLevel) {
        console.log("setMonsterLevelRetired attempt to retire max level");
      } else {
        if (retireLevel < monsterCatalog.minUnlockedLevel) {
          console.log("setMonsterLevelRetired attempt to retire previously retired level");
        } else {
          if (retireLevel > monsterCatalog.minUnlockedLevel) {
            console.log("setMonsterLevelRetired attempt to retire non-min level");
          } else {
            monsterCatalog.minUnlockedLevel++;
            delete monsterCatalog.monsterTypesByLevelCache[retireLevel + ""];
          }
        }
      }
      this.canPurchase = false;
      markUpgradeChanged(this);
      recordGameEvent("Monster Level", "退休等级" + this.retireLevel);
    }
  };
  RetireMonsterLevelUpgrade.prototype.isDisplayable = function () {
    return this.canPurchase || this.affordableSoon;
  };
  RetireMonsterLevelUpgrade.prototype.getCost = function () {
    return floorNumber(this.cachedRetireCost * itemCostBonus.currentValue);
  };
  RetireMonsterLevelUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  RetireMonsterLevelUpgrade.prototype.refreshAvailabilityState = function () {
    var previousCanPurchase = this.canPurchase,
      previousAffordableSoon = this.affordableSoon,
      previousRetireLevel = this.retireLevel;
    if (this.retireLevel != game.monsterCatalog.minUnlockedLevel) {
      this.retireLevel = game.monsterCatalog.minUnlockedLevel;
      this.cachedRetireCost = scaleByLevel(this.retireLevel, monsterUnlockPriceCurve, 1);
      this.cachedTitle = "退休怪物等级" + this.retireLevel;
    }
    if (this.retireLevel < getPartyMinLevel() && this.retireLevel < game.monsterCatalog.maxUnlockedLevel - 1) {
      this.canPurchase = game.state.party.kills >= (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost();
      this.affordableSoon = !this.canPurchase;
    } else {
      this.affordableSoon = this.canPurchase = false;
    }
    return previousCanPurchase != this.canPurchase || previousAffordableSoon != this.affordableSoon || previousRetireLevel != this.retireLevel;
  };
  CharacterSkillUpgrade.prototype = new Upgrade();
  CharacterSkillUpgrade.prototype.bindCharacter = function (character) {
    this.character = character;
  };
  CharacterSkillUpgrade.prototype.getUpgradeDefinition = function () {
    return this.skillDefinition;
  };
  CharacterSkillUpgrade.prototype.isOwned = function () {
    return this.purchased;
  };
  CharacterSkillUpgrade.prototype.setPurchased = function (isPurchased) {
    this.purchased = isPurchased;
  };
  CharacterSkillUpgrade.prototype.resetState = function () {
    this.character = null;
    this.purchased = false;
  };
  CharacterSkillUpgrade.prototype.getCharacter = function () {
    return this.character;
  };
  CharacterSkillUpgrade.prototype.getTitle = function () {
    return this.skillDefinition.title;
  };
  CharacterSkillUpgrade.prototype.getCost = function () {
    return 1;
  };
  CharacterSkillUpgrade.prototype.getDescription = function () {
    return this.skillDefinition.description;
  };
  CharacterSkillUpgrade.prototype.getUpgradeType = function () {
    return SKILL_UPGRADE_TYPE;
  };
  CharacterSkillUpgrade.prototype.isDisplayable = function () {
    return true;
  };
  CharacterSkillUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  CharacterSkillUpgrade.prototype.purchase = function () {
    if (!this.purchased) {
      if (!this.character) {
        console.log("error: adventurer not assigned to skill upgrade");
      } else if (!(1 > this.character.skillPoints)) {
        this.purchased = true;
        var character = this.character;
        character.skillPoints--;
        if (0 > character.skillPoints) {
          character.skillPoints = 0;
        }
        character.hasUnspentSkills = hasUnspentSkills(character);
        recalculateCharacterSkills(this.character);
        markUpgradeChanged(this);
        recordGameEvent("Skill", this.character.classDefinition.className + " " + this.skillDefinition.title);
      }
    }
  };
  CharacterSkillUpgrade.prototype.refreshAvailabilityState = function () {
    if (this.character) {
      var previousCanPurchase = this.canPurchase;
      var prerequisite = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).prerequisite;
      this.canPurchase = !this.purchased && (!prerequisite || prerequisite.isOwned()) && 0 < this.character.skillPoints;
      return previousCanPurchase !== this.canPurchase;
    }
    console.log("error: adventurer not assigned to skill upgrade");
  };
  LearnSpellUpgrade.prototype = new Upgrade();
  LearnSpellUpgrade.prototype.bindCharacter = function (character) {
    this.character = character;
  };
  LearnSpellUpgrade.prototype.getUpgradeDefinition = function () {
    return this.spellDefinition;
  };
  LearnSpellUpgrade.prototype.isOwned = function () {
    return this.purchased;
  };
  LearnSpellUpgrade.prototype.setPurchased = function (isPurchased) {
    this.purchased = isPurchased;
  };
  LearnSpellUpgrade.prototype.resetState = function () {
    this.character = null;
    this.purchased = false;
    this.spell = null;
  };
  LearnSpellUpgrade.prototype.getSpell = function () {
    if (!this.spell) {
      this.spell = new Spell(this.spellDefinition.spellDefinition);
    }
    return this.spell;
  };
  LearnSpellUpgrade.prototype.getCharacter = function () {
    return this.character;
  };
  LearnSpellUpgrade.prototype.getTitle = function () {
    return this.spellDefinition.spellDefinition.name;
  };
  LearnSpellUpgrade.prototype.getCost = function () {
    return 1;
  };
  LearnSpellUpgrade.prototype.getDescription = function () {
    return this.spellDefinition.spellDefinition.description;
  };
  LearnSpellUpgrade.prototype.getUpgradeType = function () {
    return 6;
  };
  LearnSpellUpgrade.prototype.isDisplayable = function () {
    return true;
  };
  LearnSpellUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  LearnSpellUpgrade.prototype.purchase = function () {
    if (!this.purchased) {
      if (this.character) {
        var initialSpellSkillPoint = this.character.initialSpellSkillPoint, character;
        if (!(1 > this.character.skillPoints && 1 > initialSpellSkillPoint)) {
          this.purchased = true;
          character = this.character;
          if (0 < character.initialSpellSkillPoint) {
            character.initialSpellSkillPoint = 0;
          } else {
            character.skillPoints--;
            if (0 > character.skillPoints) {
              character.skillPoints = 0;
            }
          }
          character.hasUnspentSkills = hasUnspentSkills(character);
          learnSpell(this.character, (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getSpell());
          markUpgradeChanged(this);
          recordGameEvent("Spell", this.character.classDefinition.className + " " + this.spellDefinition.spellDefinition.name);
        }
      } else {
        console.log("error: adventurer not assigned to spell upgrade");
      }
    }
  };
  LearnSpellUpgrade.prototype.refreshAvailabilityState = function () {
    if (this.character) {
      var previousCanPurchase = this.canPurchase,
        skillPoints = this.character.skillPoints,
        initialSpellSkillPoint = this.character.initialSpellSkillPoint;
      var prerequisite = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).prerequisite;
      this.canPurchase = !this.purchased && (!prerequisite || prerequisite.isOwned()) && (0 < skillPoints || initialSpellSkillPoint);
      return previousCanPurchase !== this.canPurchase;
    }
    console.log("error: adventurer not assigned to spell upgrade: " + (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getTitle());
  };
  PurchaseDungeonUpgrade.prototype = new Upgrade();
  PurchaseDungeonUpgrade.prototype.getDungeon = function () {
    return this.dungeon;
  };
  PurchaseDungeonUpgrade.prototype.setDungeon = function (dungeon) {
    this.dungeon = dungeon;
  };
  PurchaseDungeonUpgrade.prototype.isDisplayable = function () {
    return this.canPurchase || this.affordableSoon;
  };
  PurchaseDungeonUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  PurchaseDungeonUpgrade.prototype.getDescription = function () {
    if (this.dungeon && !canFarmDungeon(this.dungeon)) {
      if (this.dungeon.isFarm) {
        return "收获地牢";
      }
      if (!this.dungeon.region.conquered) {
        return "先要征服城堡";
      }
    }
    return "购买地牢农场";
  };
  PurchaseDungeonUpgrade.prototype.getTitle = function () {
    return "地牢农场";
  };
  PurchaseDungeonUpgrade.prototype.isOwned = function () {
    return this.dungeon && this.dungeon.isFarm;
  };
  PurchaseDungeonUpgrade.prototype.getUpgradeType = function () {
    return 7;
  };
  PurchaseDungeonUpgrade.prototype.getCost = function () {
    return this.dungeon ? floorNumber(this.dungeon.farmCost * dungeonCostBonus.currentValue) : 0;
  };
  PurchaseDungeonUpgrade.prototype.purchase = function () {
    if (!(game.state.party.gold < (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost())) {
      purchaseDungeonFarm(this.dungeon, (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost());
      markUpgradeChanged(this);
    }
  };
  PurchaseDungeonUpgrade.prototype.refreshAvailabilityState = function () {
    var canFarm = canFarmDungeon(this.dungeon), displayable;
    this.canPurchase = canFarm && game.state.party.gold >= (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost();
    this.affordableSoon = canFarm && !this.canPurchase && 120 > (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost() - game.state.party.gold;
    displayable = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).isDisplayable();
    var changed = this.cachedCanPurchase !== this.canPurchase || this.cachedDescription !== this.affordableSoon || this.cachedAffordableSoon !== displayable;
    this.cachedCanPurchase = this.canPurchase;
    this.cachedDescription = this.affordableSoon;
    this.cachedAffordableSoon = displayable;
    return changed;
  };
  PurchaseCastleUpgrade.prototype = new Upgrade();
  PurchaseCastleUpgrade.prototype.getDungeon = function () {
    return this.dungeon;
  };
  PurchaseCastleUpgrade.prototype.isDisplayable = function () {
    return this.canPurchase || this.affordableSoon;
  };
  PurchaseCastleUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  PurchaseCastleUpgrade.prototype.getDescription = function () {
    return "购买地牢农场";
  };
  PurchaseCastleUpgrade.prototype.getTitle = function () {
    return "购买怪物农场";
  };
  PurchaseCastleUpgrade.prototype.isOwned = function () {
    return this.dungeon && this.dungeon.isFarm;
  };
  PurchaseCastleUpgrade.prototype.getUpgradeType = function () {
    return 8;
  };
  PurchaseCastleUpgrade.prototype.getCost = function () {
    return this.dungeon ? floorNumber(this.dungeon.farmCost * dungeonCostBonus.currentValue) : 0;
  };
  PurchaseCastleUpgrade.prototype.purchase = function () {
    if (!(!this.dungeon || game.state.party.gold < (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost())) {
      this.canPurchase = false;
      purchaseDungeonFarm(this.dungeon, (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost());
      markUpgradeChanged(this);
    }
  };
  PurchaseCastleUpgrade.prototype.refreshAvailabilityState = function () {
    var farmableDungeons, dungeon;
    farmableDungeons = game.dungeons.farmable;
    if (dungeon = this.dungeonIndex < farmableDungeons.length ? farmableDungeons[this.dungeonIndex] : null) {
      if (dungeon.region.conquered) {
        this.canPurchase = game.state.party.gold >= (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost();
        this.affordableSoon = !this.canPurchase;
      } else {
        this.affordableSoon = this.canPurchase = false;
      }
    } else {
      this.affordableSoon = this.canPurchase = false;
    }
    var displayable = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).isDisplayable(),
      changed = this.dungeon != dungeon || this.cachedCanPurchase != this.canPurchase || this.cachedDescription != this.affordableSoon || this.cachedAffordableSoon != displayable;
    this.dungeon = dungeon;
    this.cachedCanPurchase = this.canPurchase;
    this.cachedDescription = this.affordableSoon;
    this.cachedAffordableSoon = displayable;
    return changed;
  };
  AutoPurchaseDungeonUpgrade.prototype = new Upgrade();
  AutoPurchaseDungeonUpgrade.prototype.isDisplayable = function () {
    return this.canPurchase;
  };
  AutoPurchaseDungeonUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  AutoPurchaseDungeonUpgrade.prototype.getDescription = function () {
    return "收集农场杀戮";
  };
  AutoPurchaseDungeonUpgrade.prototype.getTitle = function () {
    return "收获奖励";
  };
  AutoPurchaseDungeonUpgrade.prototype.getUpgradeType = function () {
    return 9;
  };
  AutoPurchaseDungeonUpgrade.prototype.purchase = function () {
    recordGameEvent("Dungeon", "农场已收获");
    var pendingFarmKills = game.dungeons.pendingFarmKills;
    game.state.statisticsRecorder.recordFarmHarvest(pendingFarmKills);
    addKills(pendingFarmKills);
    game.dungeons.setFarmedKills(0);
    this.canPurchase = false;
    markUpgradeChanged(this);
  };
  AutoPurchaseDungeonUpgrade.prototype.refreshAvailabilityState = function () {
    this.canPurchase = 0 < game.dungeons.pendingFarmKills;
    var changed = this.cachedCanPurchase !== this.canPurchase;
    this.cachedCanPurchase = this.canPurchase;
    return changed;
  };
  ScrollUpgrade.prototype = new Upgrade();
  ScrollUpgrade.prototype.resetState = function () {
    this.scroll = null;
    this.affordableSoon = this.canPurchase = false;
  };
  ScrollUpgrade.prototype.getScroll = function () {
    if (!this.scroll) {
      this.scroll = game.scrolls.getScrollById(this.scrollId);
    }
    return this.scroll;
  };
  ScrollUpgrade.prototype.getScrollItem = function () {
    return (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getScroll();
  };
  ScrollUpgrade.prototype.getTitle = function () {
    return (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getScroll().nextLabel;
  };
  ScrollUpgrade.prototype.getCost = function () {
    return (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getScroll().upgradeCost;
  };
  ScrollUpgrade.prototype.getDescription = function () {
    return (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getScroll().locked ? "解锁卷轴" : "升级卷轴";
  };
  ScrollUpgrade.prototype.getUpgradeType = function () {
    return 12;
  };
  ScrollUpgrade.prototype.isDisplayable = function () {
    return this.canPurchase || this.affordableSoon;
  };
  ScrollUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  ScrollUpgrade.prototype.purchase = function () {
    var scroll = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getScroll(),
      upgradeCost = scroll.upgradeCost;
    if (!(game.state.party.gold < upgradeCost)) {
      spendGold(upgradeCost);
      applyScrollUpgrade: {
        if (scroll.locked) {
          scroll.locked = false;
          registerUnlockedScroll(game.scrolls, scroll);
          recordGameEvent("Scroll Unlock", scroll.label);
        } else {
          if (scroll.upgradeCount >= scroll.maxCharges) {
            break applyScrollUpgrade;
          }
          scroll.upgradeCount++;
          if (scroll.statBonusPerUpgrade) {
            applyStatBonus(game.state.scrollCaster, scroll.statBonusPerUpgrade.statType, scroll.statBonusPerUpgrade.statBonusValue);
            updateScrollAccuracy(game.state.scrollCaster.stats);
          }
          recordGameEvent("Scroll Upgrade", scroll.label + " (数量=" + scroll.upgradeCount + ")");
        }
        scroll.label = getScrollLabel(scroll);
        scroll.nextLabel = getNextScrollLabel(scroll);
        scroll.upgradeCost = getScrollUpgradeCost(scroll);
      }
      markUpgradeChanged(this);
      this.canPurchase = false;
    }
  };
  ScrollUpgrade.prototype.refreshAvailabilityState = function () {
    var scroll = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getScroll(),
      previousCanPurchase = this.canPurchase,
      casterLevel = game.state.scrollCaster.stats.characterLevel,
      requiredLevel = scroll.locked ? scroll.baseCapacity : scroll.baseCapacity + (scroll.upgradeCount + 1) * scroll.capacityIncrement;
    if (scroll.locked) {
      this.canPurchase = casterLevel >= requiredLevel && game.state.party.gold >= scroll.upgradeCost;
      this.affordableSoon = !this.canPurchase && casterLevel >= requiredLevel;
    } else {
      this.canPurchase = scroll.upgradeCount < scroll.maxCharges && casterLevel >= requiredLevel && game.state.party.gold >= scroll.upgradeCost;
      this.affordableSoon = !this.canPurchase && scroll.upgradeCount < scroll.maxCharges && casterLevel >= requiredLevel;
    }
    return previousCanPurchase !== this.canPurchase;
  };
  ClaimAchievementUpgrade.prototype = new Upgrade();
  ClaimAchievementUpgrade.prototype.isOwned = function () {
    return this.achievement ? this.achievement.applied : false;
  };
  ClaimAchievementUpgrade.prototype.getTitle = function () {
    return this.cachedTitle;
  };
  ClaimAchievementUpgrade.prototype.getDescription = function () {
    return this.cachedDescription;
  };
  ClaimAchievementUpgrade.prototype.getUpgradeType = function () {
    return 14;
  };
  ClaimAchievementUpgrade.prototype.isDisplayable = function () {
    return this.canPurchase;
  };
  ClaimAchievementUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  ClaimAchievementUpgrade.prototype.purchase = function () {
    if (this.achievement) {
      applyAchievementReward(this.achievement);
      this.achievement = null;
      this.canPurchase = false;
      markUpgradeChanged(this);
    }
  };
  ClaimAchievementUpgrade.prototype.refreshAvailabilityState = function () {
    var claimQueue, achievement;
    claimQueue = game.state.achievements.claimQueue;
    achievement = this.claimQueueIndex < claimQueue.length ? claimQueue[this.claimQueueIndex] : null;
    this.canPurchase = null != achievement;
    var changed = this.achievement != achievement || this.cachedCanPurchase != this.canPurchase;
    if (changed && achievement) {
      this.cachedTitle = achievement.name;
      this.cachedDescription = "奖励:" + getAchievementRewardLabel(achievement);
    }
    this.achievement = achievement;
    this.cachedCanPurchase = this.canPurchase;
    return changed;
  };
  AchievementUpgrade.prototype = new Upgrade();
  AchievementUpgrade.prototype.isOwned = function () {
    return this.achievement.applied;
  };
  AchievementUpgrade.prototype.getTitle = function () {
    return this.cachedTitle;
  };
  AchievementUpgrade.prototype.getDescription = function () {
    return this.cachedDescription;
  };
  AchievementUpgrade.prototype.getUpgradeType = function () {
    return 15;
  };
  AchievementUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  AchievementUpgrade.prototype.purchase = function () {
    applyAchievementReward(this.achievement);
    this.canPurchase = false;
    markUpgradeChanged(this);
  };
  AchievementUpgrade.prototype.refreshAvailabilityState = function () {
    var applied = this.achievement.applied,
      obtained = this.achievement.obtained;
    this.canPurchase = obtained && !applied;
    var changed = this.cachedApplied != applied || this.cachedObtained != obtained;
    if (changed) {
      this.cachedTitle = this.achievement.obtained ? this.achievement.name : getAchievementRequirementLabel(this.achievement);
      this.cachedDescription = getAchievementActionLabel(this);
    }
    this.cachedApplied = applied;
    this.cachedObtained = obtained;
    return changed;
  };
  AdventurePointUpgrade.prototype = new Upgrade();
  AdventurePointUpgrade.prototype.resetState = function () {
    this.purchased = this.canPurchase = false;
    this.cachedCanPurchase = !this.canPurchase;
    var modifier = getPointUpgradeModifier(this);
    modifier.currentValue = modifier.defaultValue;
  };
  AdventurePointUpgrade.prototype.isOwned = function () {
    return this.purchased;
  };
  AdventurePointUpgrade.prototype.setPurchased = function (isPurchased) {
    if (this.purchased = isPurchased) {
      applyPointUpgrade(this);
    }
  };
  AdventurePointUpgrade.prototype.getTitle = function () {
    return this.definition.title;
  };
  AdventurePointUpgrade.prototype.getUpgradeType = function () {
    return 16;
  };
  AdventurePointUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  AdventurePointUpgrade.prototype.purchase = function () {
    if (!(this.purchased || this.definition.pointCost > game.state.adventurePoints.availablePoints)) {
      var pointCost = this.definition.pointCost,
        adventurePoints = game.state.adventurePoints;
      adventurePoints.spentPoints += pointCost;
      adventurePoints.availablePoints -= pointCost;
      if (0 > adventurePoints.availablePoints) {
        adventurePoints.availablePoints = 0;
      }
      this.purchased = true;
      this.canPurchase = false;
      applyPointUpgrade(this);
      markUpgradeChanged(this);
      recordGameEvent("Points Upgrade", this.definition.title);
    }
  };
  AdventurePointUpgrade.prototype.getCost = function () {
    return this.definition.pointCost;
  };
  AdventurePointUpgrade.prototype.getDescription = function () {
    return this.definition.descriptionText;
  };
  AdventurePointUpgrade.prototype.refreshAvailabilityState = function () {
    this.canPurchase = !this.purchased && this.definition.pointCost <= game.state.adventurePoints.availablePoints;
    var changed = this.cachedCanPurchase !== this.canPurchase;
    this.cachedCanPurchase = this.canPurchase;
    return changed;
  };
  CollectFarmUpgrade.prototype = new Upgrade();
  CollectFarmUpgrade.prototype.isDisplayable = function () {
    return this.canPurchase;
  };
  CollectFarmUpgrade.prototype.canPurchaseNow = function () {
    return this.canPurchase;
  };
  CollectFarmUpgrade.prototype.getDescription = function () {
    return "卖出道具获得黄金";
  };
  CollectFarmUpgrade.prototype.getTitle = function () {
    return "收集黄金";
  };
  CollectFarmUpgrade.prototype.getUpgradeType = function () {
    return 10;
  };
  CollectFarmUpgrade.prototype.purchase = function () {
    recordGameEvent("Shop", "Gold Collected");
    var collectedGold = game.shops.collectedGold;
    addGold(collectedGold);
    game.state.statisticsRecorder.recordGoldFromItems(collectedGold);
    game.shops.collectedGold = 0;
    this.canPurchase = false;
    markUpgradeChanged(this);
  };
  CollectFarmUpgrade.prototype.refreshAvailabilityState = function () {
    this.canPurchase = 0 < game.shops.collectedGold;
    var changed = this.cachedCanPurchase !== this.canPurchase;
    this.cachedCanPurchase = this.canPurchase;
    return changed;
  };
}
