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
  this.EC = false;
  this.lastChangeFrame = 0;
}
export function refreshUpgradeAvailability(a) {
  if (game.state.frameNumber != a.lastAvailabilityFrame) {
    a.lastAvailabilityFrame = game.state.frameNumber;
    a.EC = a.refreshAvailabilityState();
  }
  return a.EC;
}
export function markUpgradeChanged(a) {
  a.lastChangeFrame = game.state.frameNumber;
}
export function UpgradeCollection(a, b) {
  this.upgradeRows = a;
  var c,
    d,
    f,
    g = [];
  for (c = 0; c < a.length; c++) {
    for (f = a[c], d = 0; d < f.length; d++) {
      g.push(f[d]);
    }
  }
  this.upgrades = g;
  if (b) {
    for (c = [], d = 0; d < this.upgrades.length; d++) {
      c.push(null);
    }
  } else {
    c = null;
  }
  this.sortedUpgrades = c;
  this.updateCounter = 0;
  this.sortEnabled = b;
  this.lastSortFrame = 0;
}
export function resetUpgradeCollection(a) {
  var b;
  for (b = 0; b < a.upgrades.length; b++) {
    a.upgrades[b].resetState();
  }
  a.updateCounter = 0;
  a.lastSortFrame = game.state.frameNumber - 1;
}
export function restoreUpgradeCollection(a) {
  var b, c, d;
  for (b = 0; b < a.upgradeRows.length; b++) {
    for (d = a.upgradeRows[b], c = 0; c < d.length; c++) {
      d[c].us();
    }
  }
  a.updateCounter = 0;
}
export function refreshUpgradeCollection(a) {
  var b,
    c = false,
    d;
  for (b = 0; b < a.upgrades.length; b++) {
    if (d = refreshUpgradeAvailability(a.upgrades[b])) {
      c = true;
    }
  }
  if (c) {
    if (a.sortEnabled) {
      d = 0;
      var f = a.lastSortFrame;
      for (b = 0; b < a.upgrades.length; b++) {
        var sortUpgrade = /** @type {SortableUpgrade} */ (/** @type {unknown} */ (a.upgrades[b]));
        if (sortUpgrade.canPurchaseNow() && sortUpgrade.lastChangeFrame < f) {
          a.sortedUpgrades[d++] = a.upgrades[b];
        }
      }
      for (b = 0; b < a.upgrades.length; b++) {
        sortUpgrade = /** @type {SortableUpgrade} */ (/** @type {unknown} */ (a.upgrades[b]));
        if (sortUpgrade.canPurchaseNow() && sortUpgrade.lastChangeFrame >= f) {
          a.sortedUpgrades[d++] = a.upgrades[b];
        }
      }
      for (b = 0; b < a.upgrades.length; b++) {
        sortUpgrade = /** @type {SortableUpgrade} */ (/** @type {unknown} */ (a.upgrades[b]));
        if (!sortUpgrade.canPurchaseNow()) {
          a.sortedUpgrades[d++] = a.upgrades[b];
        }
      }
      b = a.upgrades;
      a.upgrades = a.sortedUpgrades;
      a.sortedUpgrades = b;
      a.lastSortFrame = game.state.frameNumber;
    }
    a.updateCounter++;
  }
}
export function PurchaseItemUpgrade(a) {
  this.Ly = a;
  this.castle = null;
  this.cachedDescription = "计划攻击";
  this.cachedAffordableSoon = this.cachedCanPurchase = this.affordableSoon = this.canPurchase = false;
}
export function GlobalUpgrade(a) {
  this.definition = a;
  this.canPurchase = this.affordableSoon = false;
  this.$A = -1;
  this.cachedDescription = this.cachedCanPurchase = this.cachedAffordableSoon = false;
  recalculateGlobalUpgrade(this);
}
export function recalculateGlobalUpgrade(a) {
  a.definition.cost = scaleByLevel(a.definition.baseCost + a.definition.purchasedLevels * a.definition.costPerLevel, globalUpgradePriceCurve, 1);
  a.definition.currentValue = a.definition.baseValue + a.definition.purchasedLevels * a.definition.perLevelIncrement;
  if (a.definition.currentValue > a.definition.maxValue) {
    a.definition.currentValue = a.definition.maxValue;
  }
}
export function EquipBestItemUpgrade(a) {
  this.hasCandidate = false;
  this.Yz = -1;
  this.descriptionLabel = "";
  this.vp = a;
}
export function EquipItemUpgrade(a, b) {
  this.hasCandidate = false;
  this.hA = a;
  this.descriptionLabel = this.item = null;
  this.vp = b;
}
export function LevelUpUpgrade(a) {
  this.cachedCanPurchase = this.cachedAffordableSoon = this.canPurchase = this.affordableSoon = false;
  this.cachedRequiredExperience = -1;
  this.descriptionLabel = null;
  this.requiredExperience = 0;
  this.adventurerIndex = a;
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
export function CharacterSkillUpgrade(a) {
  this.skillDefinition = a;
  this.character = null;
  this.purchased = this.canPurchase = false;
}
export function LearnSpellUpgrade(a) {
  this.spellDefinition = a;
  this.character = null;
  this.purchased = this.canPurchase = false;
  this.spell = null;
}
export function PurchaseDungeonUpgrade(a) {
  this.dungeon = a;
  this.cachedDescription = this.cachedCanPurchase = this.cachedAffordableSoon = this.canPurchase = this.affordableSoon = false;
}
export function PurchaseCastleUpgrade(a) {
  this.Ez = a;
  this.dungeon = null;
  this.cachedDescription = this.cachedCanPurchase = this.cachedAffordableSoon = this.canPurchase = this.affordableSoon = false;
}
export function AutoPurchaseDungeonUpgrade() {
  this.cachedCanPurchase = this.canPurchase = false;
}
export function ScrollUpgrade(a) {
  this.scrollId = a;
  this.affordableSoon = this.canPurchase = false;
  this.scroll = null;
}
export function ClaimAchievementUpgrade(a) {
  this.vy = a;
  this.achievement = null;
  this.cachedTitle = "Achievement";
  this.cachedDescription = "Reward";
  this.cachedCanPurchase = this.canPurchase = false;
}
export function AchievementUpgrade(a) {
  this.achievement = a;
  this.cachedTitle = this.achievement.obtained ? this.achievement.name : getAchievementRequirementLabel(this.achievement);
  this.cachedDescription = getAchievementActionLabel(this);
  this.YA = this.VA = this.canPurchase = false;
}
export function getAchievementActionLabel(a) {
  return a.achievement.obtained ? getAchievementRewardLabel(a.achievement) : "奖励不明";
}
export function AdventurePointUpgrade(a) {
  this.definition = a;
  this.cachedCanPurchase = this.purchased = this.canPurchase = false;
}
export function applyPointUpgrade(a) {
  a = getPointUpgradeModifier(a);
  a.currentValue += a.levelIncrement;
}
export function getPointUpgradeModifier(a) {
  switch (a.definition.bonusIndex) {
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
  console.log("Failed to find point upgrade setting: " + a.definition.bonusIndex);
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
  Upgrade.prototype.us = function () {};
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
    var a;
    a = game.castles.attackableCastles;
    if (a = this.Ly < a.length ? a[this.Ly] : null) {
      this.canPurchase = game.monsterCatalog.maxUnlockedLevel >= a.requiredMonsterLevel;
      this.affordableSoon = !this.canPurchase;
    } else {
      this.affordableSoon = this.canPurchase = false;
    }
    var b = this.castle != a || this.cachedCanPurchase != this.canPurchase || this.cachedAffordableSoon != this.affordableSoon;
    if (b && a) {
      this.cachedDescription = this.canPurchase ? a.castleName : "需要怪物等级: " + a.requiredMonsterLevel;
    }
    this.castle = a;
    this.cachedCanPurchase = this.canPurchase;
    this.cachedAffordableSoon = this.affordableSoon;
    return b;
  };
  GlobalUpgrade.prototype = new Upgrade();
  GlobalUpgrade.prototype.us = function () {
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
    var a = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).isDisplayable(),
      b = this.$A !== this.definition.purchasedLevels || this.cachedCanPurchase !== this.canPurchase || this.cachedDescription !== this.affordableSoon || this.cachedAffordableSoon !== a;
    this.$A = this.definition.purchasedLevels;
    this.cachedCanPurchase = this.canPurchase;
    this.cachedDescription = this.affordableSoon;
    this.cachedAffordableSoon = a;
    return b;
  };
  GlobalUpgrade.prototype.isNearlyAffordable = function () {
    var a = game.state.party.kills;
    if (a >= this.definition.cost) {
      return false;
    }
    a = this.definition.cost - a;
    return 400 >= a || a <= 0.3 * this.definition.cost;
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
    var a = game.inventories,
      b;
    for (b = 0; b < game.state.adventurers.length; b++) {
      a.equipBestForCharacter(game.state.adventurers[b]);
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
    var a,
      b = 0;
    for (a = 0; a < game.state.adventurers.length; a++) {
      var c;
      c = game.state.adventurers[a];
      var d = c.inventory.items;
      if (d && 0 !== d.length) {
        for (var g = undefined, h = undefined, l = 0, itemIndex = 0; itemIndex < d.length; itemIndex++) {
          g = d[itemIndex];
          if (!((h = c.getSlotItem(g.slot)) && !isBetterItem(g, h))) {
            l++;
          }
        }
        c = l;
      } else {
        c = 0;
      }
      b += c;
    }
    a = b;
    var hasBetterItems = a > this.vp;
    if (c = this.hasCandidate !== hasBetterItems || this.Yz !== a) {
      this.descriptionLabel = "装备所有更好的道具(" + a + ")";
    }
    this.hasCandidate = hasBetterItems;
    this.Yz = a;
    return c;
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
    var a = this.item.inventory;
    if (a) {
      a.equipItem(this.item);
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
    var a = game.inventories.list,
      b = this.hasCandidate,
      c = this.item;
    if (a.length <= this.vp && a.length > this.hA) {
      this.item = a[this.hA];
      if (c != this.item) {
        this.descriptionLabel = "Equip " + this.item.itemName;
      }
      this.hasCandidate = true;
    } else {
      this.descriptionLabel = this.item = null;
      this.hasCandidate = false;
    }
    return b != this.hasCandidate || c != this.item;
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
      var a = game.state.adventurers[this.adventurerIndex],
        b = a.stats,
        c = b.experienceToLevelUp,
        d = getPartyMinLevel();
      if (!(game.state.party.experiencePoints < c)) {
        var f = game.state.party;
        f.experiencePoints -= c;
        if (0 > f.experiencePoints) {
          f.experiencePoints = 0;
        }
        c = b.characterLevel + 1;
        applyLevelStats(b, c, a.classDefinition.statMultipliers);
        a.skillPoints++;
        a.hasUnspentSkills = hasUnspentSkills(a);
        b.characterLevel = c;
        if ((b = a.summonedMinions) && 0 < b.length) {
          for (f = 0; f < b.length; f++) {
            var g = b[f],
              h = c;
            g.stats.characterLevel = h;
            applyLevelStats(g.stats, h, g.classDefinition.statMultipliers);
            initializeCharacterSkills(g, h);
          }
        }
        refreshPartyLevels();
        b = getPartyMinLevel();
        if (d !== b) {
          d = game.state.scrollCaster;
          b = d.stats;
          f = getPartyMinLevel();
          initializeCharacterSkills(d, f);
          applyLevelStats(b, f, d.classDefinition.statMultipliers);
          b.characterLevel = f;
        }
        awardAdventurePoints(22);
        recordGameEvent("Adventurer", "升级" + a.classDefinition.className + ": " + c);
      }
      markUpgradeChanged(this);
    }
  };
  LevelUpUpgrade.prototype.isNearlyAffordable = function () {
    var a = game.state.party.experiencePoints,
      b = game.state.adventurers[this.adventurerIndex].stats.experienceToLevelUp;
    if (a >= b) {
      return false;
    }
    a = b - a;
    return 300 >= a ? true : a <= 0.2 * b;
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
      var a = game.state.adventurers[this.adventurerIndex];
      if (!this.descriptionLabel) {
        this.descriptionLabel = "升级" + a.adventurerName;
      }
      this.requiredExperience = a.stats.experienceToLevelUp;
      this.canPurchase = game.state.party.experiencePoints >= this.requiredExperience;
      this.affordableSoon = !this.canPurchase && (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).isNearlyAffordable();
      a = this.cachedCanPurchase !== this.canPurchase || this.cachedAffordableSoon !== this.affordableSoon || this.cachedRequiredExperience !== this.requiredExperience;
      this.cachedCanPurchase = this.canPurchase;
      this.cachedAffordableSoon = this.affordableSoon;
      this.cachedRequiredExperience = this.requiredExperience;
      return a;
    }
  };
  UnlockMonsterLevelUpgrade.prototype = new Upgrade();
  UnlockMonsterLevelUpgrade.prototype.us = function () {
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
      var a = game.monsterCatalog;
      a.maxUnlockedLevel = Math.max(a.maxUnlockedLevel, this.unlockLevel);
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
    var a = this.canPurchase,
      b = this.unlockLevel,
      c = game.monsterCatalog.maxUnlockedLevel + 1;
    if (this.unlockLevel != c) {
      this.unlockLevel = c;
      this.cachedUnlockCost = scaleByLevel(this.unlockLevel, monsterUnlockPriceCurve, 1);
      this.cachedTitle = "解锁怪物等级" + this.unlockLevel;
    }
    if (c = game.state.party.kills >= (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost()) {
      if (c = getPartyMinLevel() >= this.unlockLevel) {
        c = game.monsterCatalog;
        c = 1 + c.maxUnlockedLevel - c.minUnlockedLevel < VISIBLE_MONSTER_LEVELS;
      }
    }
    this.canPurchase = c;
    return a !== this.canPurchase || b !== this.unlockLevel;
  };
  RetireMonsterLevelUpgrade.prototype = new Upgrade();
  RetireMonsterLevelUpgrade.prototype.us = function () {
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
      var a = this.retireLevel,
        b = game.monsterCatalog;
      if (a >= b.maxUnlockedLevel) {
        console.log("setMonsterLevelRetired attempt to retire max level");
      } else {
        if (a < b.minUnlockedLevel) {
          console.log("setMonsterLevelRetired attempt to retire previously retired level");
        } else {
          if (a > b.minUnlockedLevel) {
            console.log("setMonsterLevelRetired attempt to retire non-min level");
          } else {
            b.minUnlockedLevel++;
            delete b.monsterTypesByLevelCache[a + ""];
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
    var a = this.canPurchase,
      b = this.affordableSoon,
      c = this.retireLevel;
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
    return a != this.canPurchase || b != this.affordableSoon || c != this.retireLevel;
  };
  CharacterSkillUpgrade.prototype = new Upgrade();
  CharacterSkillUpgrade.prototype.bindCharacter = function (a) {
    this.character = a;
  };
  CharacterSkillUpgrade.prototype.getUpgradeDefinition = function () {
    return this.skillDefinition;
  };
  CharacterSkillUpgrade.prototype.isOwned = function () {
    return this.purchased;
  };
  CharacterSkillUpgrade.prototype.setPurchased = function (a) {
    this.purchased = a;
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
        var a = this.character;
        a.skillPoints--;
        if (0 > a.skillPoints) {
          a.skillPoints = 0;
        }
        a.hasUnspentSkills = hasUnspentSkills(a);
        recalculateCharacterSkills(this.character);
        markUpgradeChanged(this);
        recordGameEvent("Skill", this.character.classDefinition.className + " " + this.skillDefinition.title);
      }
    }
  };
  CharacterSkillUpgrade.prototype.refreshAvailabilityState = function () {
    if (this.character) {
      var a = this.canPurchase;
      var prerequisite = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).prerequisite;
      this.canPurchase = !this.purchased && (!prerequisite || prerequisite.isOwned()) && 0 < this.character.skillPoints;
      return a !== this.canPurchase;
    }
    console.log("error: adventurer not assigned to skill upgrade");
  };
  LearnSpellUpgrade.prototype = new Upgrade();
  LearnSpellUpgrade.prototype.bindCharacter = function (a) {
    this.character = a;
  };
  LearnSpellUpgrade.prototype.getUpgradeDefinition = function () {
    return this.spellDefinition;
  };
  LearnSpellUpgrade.prototype.isOwned = function () {
    return this.purchased;
  };
  LearnSpellUpgrade.prototype.setPurchased = function (a) {
    this.purchased = a;
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
        var a = this.character.initialSpellSkillPoint;
        if (!(1 > this.character.skillPoints && 1 > a)) {
          this.purchased = true;
          a = this.character;
          if (0 < a.initialSpellSkillPoint) {
            a.initialSpellSkillPoint = 0;
          } else {
            a.skillPoints--;
            if (0 > a.skillPoints) {
              a.skillPoints = 0;
            }
          }
          a.hasUnspentSkills = hasUnspentSkills(a);
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
      var a = this.canPurchase,
        b = this.character.skillPoints,
        c = this.character.initialSpellSkillPoint;
      var prerequisite = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).prerequisite;
      this.canPurchase = !this.purchased && (!prerequisite || prerequisite.isOwned()) && (0 < b || c);
      return a !== this.canPurchase;
    }
    console.log("error: adventurer not assigned to spell upgrade: " + (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getTitle());
  };
  PurchaseDungeonUpgrade.prototype = new Upgrade();
  PurchaseDungeonUpgrade.prototype.getDungeon = function () {
    return this.dungeon;
  };
  PurchaseDungeonUpgrade.prototype.setDungeon = function (a) {
    this.dungeon = a;
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
    var a = canFarmDungeon(this.dungeon);
    this.canPurchase = a && game.state.party.gold >= (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost();
    this.affordableSoon = a && !this.canPurchase && 120 > (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost() - game.state.party.gold;
    a = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).isDisplayable();
    var b = this.cachedCanPurchase !== this.canPurchase || this.cachedDescription !== this.affordableSoon || this.cachedAffordableSoon !== a;
    this.cachedCanPurchase = this.canPurchase;
    this.cachedDescription = this.affordableSoon;
    this.cachedAffordableSoon = a;
    return b;
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
    var a;
    a = game.dungeons.farmable;
    if (a = this.Ez < a.length ? a[this.Ez] : null) {
      if (a.region.conquered) {
        this.canPurchase = game.state.party.gold >= (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getCost();
        this.affordableSoon = !this.canPurchase;
      } else {
        this.affordableSoon = this.canPurchase = false;
      }
    } else {
      this.affordableSoon = this.canPurchase = false;
    }
    var b = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).isDisplayable(),
      c = this.dungeon != a || this.cachedCanPurchase != this.canPurchase || this.cachedDescription != this.affordableSoon || this.cachedAffordableSoon != b;
    this.dungeon = a;
    this.cachedCanPurchase = this.canPurchase;
    this.cachedDescription = this.affordableSoon;
    this.cachedAffordableSoon = b;
    return c;
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
    var a = game.dungeons.pendingFarmKills;
    game.state.statisticsRecorder.recordFarmHarvest(a);
    addKills(a);
    game.dungeons.setFarmedKills(0);
    this.canPurchase = false;
    markUpgradeChanged(this);
  };
  AutoPurchaseDungeonUpgrade.prototype.refreshAvailabilityState = function () {
    this.canPurchase = 0 < game.dungeons.pendingFarmKills;
    var a = this.cachedCanPurchase !== this.canPurchase;
    this.cachedCanPurchase = this.canPurchase;
    return a;
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
    var a = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getScroll(),
      b = a.upgradeCost;
    if (!(game.state.party.gold < b)) {
      spendGold(b);
      a: {
        if (a.locked) {
          a.locked = false;
          registerUnlockedScroll(game.scrolls, a);
          recordGameEvent("Scroll Unlock", a.label);
        } else {
          if (a.upgradeCount >= a.maxCharges) {
            break a;
          }
          a.upgradeCount++;
          if (a.statBonusPerUpgrade) {
            applyStatBonus(game.state.scrollCaster, a.statBonusPerUpgrade.statType, a.statBonusPerUpgrade.statBonusValue);
            updateScrollAccuracy();
          }
          recordGameEvent("Scroll Upgrade", a.label + " (数量=" + a.upgradeCount + ")");
        }
        a.label = getScrollLabel(a);
        a.nextLabel = getNextScrollLabel(a);
        a.upgradeCost = getScrollUpgradeCost(a);
      }
      markUpgradeChanged(this);
      this.canPurchase = false;
    }
  };
  ScrollUpgrade.prototype.refreshAvailabilityState = function () {
    var a = (/** @type {UpgradeMethods} */ (/** @type {unknown} */ (this))).getScroll(),
      b = this.canPurchase,
      c = game.state.scrollCaster.stats.characterLevel,
      d = a.locked ? a.baseCapacity : a.baseCapacity + (a.upgradeCount + 1) * a.capacityIncrement;
    if (a.locked) {
      this.canPurchase = c >= d && game.state.party.gold >= a.upgradeCost;
      this.affordableSoon = !this.canPurchase && c >= d;
    } else {
      this.canPurchase = a.upgradeCount < a.maxCharges && c >= d && game.state.party.gold >= a.upgradeCost;
      this.affordableSoon = !this.canPurchase && a.upgradeCount < a.maxCharges && c >= d;
    }
    return b !== this.canPurchase;
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
    var a;
    a = game.state.achievements.claimQueue;
    a = this.vy < a.length ? a[this.vy] : null;
    this.canPurchase = null != a;
    var b = this.achievement != a || this.cachedCanPurchase != this.canPurchase;
    if (b && a) {
      this.cachedTitle = a.name;
      this.cachedDescription = "奖励:" + getAchievementRewardLabel(a);
    }
    this.achievement = a;
    this.cachedCanPurchase = this.canPurchase;
    return b;
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
    var a = this.achievement.applied,
      b = this.achievement.obtained;
    this.canPurchase = b && !a;
    var c = this.VA != a || this.YA != b;
    if (c) {
      this.cachedTitle = this.achievement.obtained ? this.achievement.name : getAchievementRequirementLabel(this.achievement);
      this.cachedDescription = getAchievementActionLabel(this);
    }
    this.VA = a;
    this.YA = b;
    return c;
  };
  AdventurePointUpgrade.prototype = new Upgrade();
  AdventurePointUpgrade.prototype.resetState = function () {
    this.purchased = this.canPurchase = false;
    this.cachedCanPurchase = !this.canPurchase;
    var a = getPointUpgradeModifier(this);
    a.currentValue = a.defaultValue;
  };
  AdventurePointUpgrade.prototype.isOwned = function () {
    return this.purchased;
  };
  AdventurePointUpgrade.prototype.setPurchased = function (a) {
    if (this.purchased = a) {
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
      var a = this.definition.pointCost,
        b = game.state.adventurePoints;
      b.spentPoints += a;
      b.availablePoints -= a;
      if (0 > b.availablePoints) {
        b.availablePoints = 0;
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
    var a = this.cachedCanPurchase !== this.canPurchase;
    this.cachedCanPurchase = this.canPurchase;
    return a;
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
    var a = game.shops.collectedGold;
    addGold(a);
    game.state.statisticsRecorder.recordGoldFromItems(a);
    game.shops.collectedGold = 0;
    this.canPurchase = false;
    markUpgradeChanged(this);
  };
  CollectFarmUpgrade.prototype.refreshAvailabilityState = function () {
    this.canPurchase = 0 < game.shops.collectedGold;
    var a = this.cachedCanPurchase !== this.canPurchase;
    this.cachedCanPurchase = this.canPurchase;
    return a;
  };
}
