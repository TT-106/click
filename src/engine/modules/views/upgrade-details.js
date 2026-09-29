/** 升级按钮及各类详情显示。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { View } from "./base.js";
import { clearElement, clearElementById, createElement, getElement, hideElement, showElement } from "./dom.js";
import { SKILL_UPGRADE_TYPE } from "../progression/upgrades.js";
import { floorNumber, formatAmount, formatGroupedAmount, randomInt, scaleByLevel } from "../core/math.js";
import { healthCurve, monsterAttackCurve, monsterDefenceCurve, monsterDamageCurve, monsterArmorCurve, spiritCurve } from "../content/balance.js";
import { getHighlightedItemName, getItemRarityLabel, getItemStatLabel } from "../loot/items.js";
import { game } from "../runtime/game.js";
import { minionsBySpell } from "../content/minions.js";
import { getMonsterTypesForLevel } from "../combat/encounters.js";
import { getPartyMinLevel } from "../characters/party.js";
import { statValue } from "../characters/stats.js";
/** @typedef {{ createDomElements: () => void }} DomDetails */
/** @typedef {{ reset: () => void, render: () => void, attachUpgrade: (upgrade: unknown) => void }} ActiveUpgradeButton */
export function UpgradeButtonView(baseElementId, upgrade, buttonIndex, alwaysVisible) {
  this.elementId = baseElementId + "_" + buttonIndex;
  this.visible = true;
  this.baseElementId = baseElementId;
  this.upgrade = upgrade;
  this.activeDetails = null;
  this.alwaysVisible = alwaysVisible;
  this.cachedUpgradeType = this.buttonElement = null;
  this.buttonLabel = "";
}
export function mountUpgradeButton(view) {
  var parentElement = getElement(view.baseElementId);
  view.buttonLabel = view.getButtonClass();
  view.buttonElement = createElement("div", parentElement, view.elementId, view.buttonLabel);
  view.buttonElement.onmouseup = function () {
    view.onPurchaseClicked();
    return false;
  };
}
export function createUpgradeDetails(view, upgradeType) {
  switch (upgradeType) {
    case 1:
      return new ItemPurchaseDetails(view.upgrade, view.buttonElement);
    case 2:
      return new EquipmentDetails(view.upgrade, view.buttonElement);
    case 3:
      return new GlobalUpgradeDetails(view.upgrade, view.buttonElement);
    case 4:
      return new EquipmentSetDetails(view.upgrade, view.buttonElement);
    case SKILL_UPGRADE_TYPE:
      return new SkillUpgradeDetails(view.upgrade, view.buttonElement);
    case 6:
      return new SpellUpgradeDetails(view.upgrade, view.buttonElement);
    case 7:
      return new MonsterLevelDetails(view.upgrade, view.buttonElement);
    case 8:
      return new DungeonPurchaseDetails(view.upgrade, view.buttonElement);
    case 9:
      return new CastlePurchaseDetails(view.upgrade, view.buttonElement);
    case 10:
      return new FarmUpgradeDetails(view.upgrade, view.buttonElement);
    case 11:
      return new CharacterLevelDetails(view.upgrade, view.buttonElement);
    case 12:
      return new ScrollUpgradeDetails(view.upgrade, view.buttonElement);
    case 13:
      return new AutoDungeonDetails(view.upgrade, view.buttonElement);
    case 14:
      return new AchievementClaimDetails(view.upgrade, view.buttonElement);
    case 15:
      return new AchievementProgressDetails(view.upgrade, view.buttonElement);
    case 16:
      return new PointUpgradeDetails(view.upgrade, view.buttonElement);
    default:
      return null;
  }
}
export function ItemPurchaseDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.descriptionLabel = this.titleLabel = this.costElement = this.descriptionContainer = this.detailsContainer = null;
  this.shown = false;
  this.cachedCostValue = -1;
  this.cachedTitleText = this.cachedDescriptionText = null;
}
export function EquipmentDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.experienceLabel = this.spiritPreviewLabel = this.healthPreviewLabel = this.levelLabel = this.descriptionLabel = this.characterImage = this.table = null;
  this.shown = false;
  this.cachedCharacter = null;
  this.cachedCharacterLevel = -1;
}
export function GlobalUpgradeDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.itemStatLabel = this.levelLabel = this.rarityLabel = this.itemNameLabel = this.monsterImage = this.itemImage = this.tableElement = null;
  this.shown = false;
  this.cachedItem = null;
}
export function AutoDungeonDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.labelCell = this.titleElement = this.previewImage = this.tableElement = null;
  this.shown = false;
  this.cachedTitleText = this.cachedTitle = this.cachedDescriptionText = "";
}
export function EquipmentSetDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.iconElements = [];
  this.nameElements = [];
  this.rarityElements = [];
  this.tableElement = null;
  this.shown = false;
  this.cachedItems = [];
}
export function appendEquipmentRow(details, rowIndex) {
  var row = details.tableElement.insertRow(rowIndex),
    iconCell = row.insertCell(0);
  iconCell.style.width = "30px";
  iconCell.style.height = "30px";
  iconCell.style.textAlign = "center";
  var iconImage = createElement("img", iconCell, null, null);
  iconImage.src = "images/Transparent.gif";
  iconImage.style.width = "30px";
  iconImage.style.height = "30px";
  details.iconElements.push(iconImage);
  var nameCell = row.insertCell(1);
  nameCell.style.textAlign = "left";
  details.nameElements.push(createElement("span", nameCell, null, null));
  details.rarityElements.push(createElement("span", nameCell, null, null));
}
export function SkillUpgradeDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.descriptionElement = this.titleElement = this.descriptionContainer = this.titleContainer = null;
  this.shown = false;
  this.cachedTitleText = this.cachedDescriptionText = null;
}
export function SpellUpgradeDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.descriptionLabel = this.actionLabel = this.spellImage = this.table = null;
  this.shown = false;
  this.asset = this.assetSource = this.cachedSpell = null;
  this.isAnimated = true;
  this.frameAge = this.frameIndex = 0;
  this.effectFrameInterval = 8;
}
export function MonsterLevelDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.descriptionLabel = this.titleLabel = this.costLabel = this.descriptionContainer = this.tableContainer = null;
  this.shown = false;
  this.cachedCostValue = -1;
  this.cachedTitleText = this.cachedDescriptionText = null;
}
export function DungeonPurchaseDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.selectedDungeon = this.labelCell = this.titleElement = this.previewImageElement = this.tableElement = this.costElement = null;
  this.shown = false;
  this.cachedCostValue = -1;
}
export function ScrollUpgradeDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.cachedScroll = this.titleCell = this.titleElement = this.scrollImage = this.tableElement = this.costElement = null;
  this.shown = false;
  this.cachedDescriptionText = null;
  this.cachedCostValue = -1;
  this.cachedTitleText = null;
}
export function CastlePurchaseDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.selectedDungeon = this.labelCell = this.titleElement = this.previewImageElement = this.tableElement = this.bonusLabel = null;
  this.shown = false;
  this.cachedRequiredLevel = -1;
}
export function FarmUpgradeDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.selectedDungeon = this.labelCell = this.titleElement = this.previewImageElement = this.tableElement = this.bonusLabel = null;
  this.shown = false;
  this.cachedBonus = -1;
}
export function CharacterLevelDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.cachedPartyDefenceRating = this.cachedPartyAttackRating = this.cachedPartyArmor = this.cachedPartyDamage = this.monsterDefence = this.monsterAttack = this.monsterSpirit = this.monsterHealth = 0;
  this.monsterDefenceLabel = this.monsterAttackLabel = this.monsterArmorLabel = this.monsterDamageLabel = this.descriptionElement = this.titleElement = this.costLabel = this.monsterPreviewImage = this.table = null;
  this.shown = false;
  this.cachedCostValue = -1;
  this.cachedTitleText = this.cachedAssessmentText = null;
  this.cachedLevel = -1;
}
export function AchievementClaimDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.descriptionElement = this.titleElement = null;
  this.shown = false;
  this.cachedTitleText = this.cachedDescriptionText = null;
}
export function AchievementProgressDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.descriptionElement = this.titleElement = null;
  this.shown = false;
  this.cachedTitleText = this.cachedDescriptionText = null;
}
export function PointUpgradeDetails(upgrade, contentContainer) {
  this.upgrade = upgrade;
  this.contentContainer = contentContainer;
  this.costLabel = this.descriptionElement = this.titleElement = null;
  this.shown = false;
  this.cachedTitleText = this.cachedDescriptionText = null;
  this.cachedCostValue = -1;
}
export function UpgradeListView(elementId, upgradeCollection, alwaysVisible) {
  this.elementId = elementId;
  this.visible = true;
  this.upgradeCollection = upgradeCollection;
  this.cachedUpdateCounter = -100;
  this.buttons = [];
  var upgrades = upgradeCollection.upgrades;
  for (var upgradeIndex = 0; upgradeIndex < upgrades.length; upgradeIndex++) {
    this.buttons.push(new UpgradeButtonView(elementId, upgrades[upgradeIndex], upgradeIndex, alwaysVisible));
  }
}
export function getRarityClass(rarity) {
  switch (rarity) {
    case 1:
      return "itemRarityUncommon";
    case 2:
      return "itemRarityRare";
    case 3:
      return "itemRarityHistoric";
    case 4:
      return "itemRarityAncient";
  }
  return "itemRarityCommon";
}
export function initializeViewsUpgradeDetails() {
  UpgradeButtonView.prototype = new View();
  UpgradeButtonView.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
    if (this.activeDetails) {
      this.activeDetails.attachUpgrade(upgrade);
    }
    if (!(this.alwaysVisible || this.upgrade.isDisplayable())) {
      if (this.buttonElement) {
        hideElement(this.buttonElement);
      }
    }
  };
  UpgradeButtonView.prototype.isVisible = function () {
    return this.alwaysVisible ? true : this.upgrade && this.upgrade.isDisplayable();
  };
  UpgradeButtonView.prototype.reset = function () {
    if (getElement(this.baseElementId)) {
      this.buttonElement = null;
      mountUpgradeButton(this);
      this.cachedUpgradeType = this.activeDetails = null;
    }
  };
  UpgradeButtonView.prototype.onPurchaseClicked = function () {
    if (this.upgrade.canPurchaseNow()) {
      this.upgrade.purchase();
    }
  };
  UpgradeButtonView.prototype.update = function () {
    var upgradeType = this.upgrade.getUpgradeType(),
      buttonClass = (/** @type {UpgradeButtonView & { getButtonClass: () => string }} */ (/** @type {unknown} */ (this))).getButtonClass();
    if (!this.buttonElement) {
      mountUpgradeButton(this);
    }
    if (this.cachedUpgradeType !== upgradeType) {
      this.cachedUpgradeType = upgradeType;
      if (this.activeDetails && this.cachedUpgradeType !== this.activeDetails.getUpgradeType()) {
        clearElement(this.buttonElement);
        this.activeDetails = null;
      }
      if (!this.activeDetails) {
        this.activeDetails = createUpgradeDetails(this, this.cachedUpgradeType);
      }
      if (this.activeDetails) {
        this.activeDetails.showDetails();
      }
    }
    if (this.activeDetails) {
      this.activeDetails.update();
    }
    if (this.buttonLabel !== buttonClass) {
      this.buttonLabel = buttonClass;
      this.buttonElement.className = buttonClass;
    }
  };
  UpgradeButtonView.prototype.getButtonClass = function () {
    return this.upgrade.canPurchaseNow() ? "upgradeButton centeredElement topMargin" : this.upgrade.isOwned() ? "ownedUpgradeButton centeredElement topMargin" : "disabledUpgradeButton centeredElement topMargin";
  };
  ItemPurchaseDetails.prototype.getUpgradeType = function () {
    return 1;
  };
  ItemPurchaseDetails.prototype.reset = function () {
    this.cachedCostValue = -1;
    this.cachedTitleText = this.cachedDescriptionText = null;
  };
  ItemPurchaseDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  ItemPurchaseDetails.prototype.showDetails = function () {
    if (!this.detailsContainer) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.detailsContainer);
      showElement(this.descriptionContainer);
      this.shown = true;
    }
  };
  ItemPurchaseDetails.prototype.update = function () {
    var cost = this.upgrade.getCost(),
      title = this.upgrade.getTitle(),
      description = this.upgrade.getDescription();
    if (this.cachedCostValue !== cost) {
      this.cachedCostValue = cost;
      this.costElement.innerHTML = formatAmount(cost);
    }
    if (this.cachedTitleText !== title) {
      this.cachedTitleText = title;
      this.titleLabel.innerHTML = title;
    }
    if (this.cachedDescriptionText !== description) {
      this.cachedDescriptionText = description;
      this.descriptionLabel.innerHTML = description;
    }
  };
  ItemPurchaseDetails.prototype.createDomElements = function () {
    this.detailsContainer = createElement("div", this.contentContainer, null, null);
    this.detailsContainer.style.position = "relative";
    this.detailsContainer.style.height = "30px";
    this.descriptionContainer = createElement("div", this.contentContainer, null, null);
    this.descriptionContainer.style.position = "relative";
    this.descriptionContainer.style.height = "30px";
    var costIconBox = createElement("div", this.detailsContainer, null, null);
    costIconBox.style.position = "absolute";
    costIconBox.style.right = "3px";
    costIconBox.style.top = "0";
    costIconBox.style.width = "30px";
    costIconBox.style.height = "100%";
    costIconBox.style.textAlign = "left";
    costIconBox.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    var costIconImage = createElement("img", costIconBox, null, null);
    costIconImage.src = "images/Transparent.gif";
    costIconImage.style.width = "100%";
    costIconImage.style.height = "15px";
    this.costElement = createElement("div", this.detailsContainer, null, null);
    this.costElement.style.position = "absolute";
    this.costElement.style.right = "36px";
    this.costElement.style.top = "0";
    this.costElement.style.width = "40px";
    this.costElement.style.height = "25px";
    this.costElement.style.paddingTop = "5px";
    this.costElement.style.textAlign = "right";
    this.titleLabel = createElement("div", this.detailsContainer, null, null);
    this.titleLabel.style.position = "absolute";
    this.titleLabel.style.right = "82px";
    this.titleLabel.style.top = "0";
    this.titleLabel.style.left = "3px";
    this.titleLabel.style.height = "25px";
    this.titleLabel.style.paddingTop = "5px";
    this.titleLabel.style.textAlign = "left";
    this.descriptionLabel = createElement("div", this.descriptionContainer, null, null);
    this.descriptionLabel.style.position = "absolute";
    this.descriptionLabel.style.left = "3px";
    this.descriptionLabel.style.top = "0";
    this.descriptionLabel.style.right = "0";
    this.descriptionLabel.style.height = "25px";
    this.descriptionLabel.style.paddingTop = "5px";
    this.descriptionLabel.style.textAlign = "left";
  };
  EquipmentDetails.prototype.getUpgradeType = function () {
    return 2;
  };
  EquipmentDetails.prototype.reset = function () {
    this.cachedCharacter = null;
    this.cachedCharacterLevel = -1;
  };
  EquipmentDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  EquipmentDetails.prototype.showDetails = function () {
    if (!this.table) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.table);
      this.shown = true;
    }
  };
  EquipmentDetails.prototype.update = function () {
    if (this.upgrade.getCharacter()) {
      var character = this.upgrade.getCharacter(),
        characterLevel = character.stats.characterLevel;
      if (this.cachedCharacter !== character || this.cachedCharacterLevel != characterLevel) {
        this.cachedCharacter = character;
        this.cachedCharacterLevel = characterLevel;
        var sprite = character.getSprite(),
          statMultipliers = character.classDefinition.statMultipliers;
        this.characterImage.style.background = "url('spritesheet/monsters.png') -" + (sprite.sourceX + 10) + "px -" + (sprite.sourceY + 12) + "px";
        this.descriptionLabel.innerHTML = this.upgrade.getDescription();
        this.experienceLabel.innerHTML = formatAmount(character.stats.experienceToLevelUp) + " XP";
        this.levelLabel.innerHTML = "等级 " + (characterLevel + 1);
        this.healthPreviewLabel.innerHTML = ", " + formatAmount(scaleByLevel(characterLevel + 1, healthCurve, statMultipliers.maxHealthMultiplier)) + " HP";
        this.spiritPreviewLabel.innerHTML = ", " + formatAmount(scaleByLevel(characterLevel + 1, spiritCurve, statMultipliers.maxSpiritMultiplier)) + " SP";
      }
    } else {
      console.log("bug in upgrade button");
    }
  };
  EquipmentDetails.prototype.createDomElements = function () {
    this.table = createElement("table", this.contentContainer, null, null);
    this.table.style.width = "100%";
    var headerRow = this.table.insertRow(0),
      previewRow = this.table.insertRow(1),
      portraitCell = headerRow.insertCell(0);
    portraitCell.style.width = "30px";
    portraitCell.style.height = "30px";
    portraitCell.style.verticalAlign = "top";
    this.characterImage = createElement("img", portraitCell, null, null);
    this.characterImage.className = "characterImage";
    this.characterImage.src = "images/Transparent.gif";
    this.characterImage.style.height = "30px";
    this.characterImage.style.width = "30px";
    var descriptionCell = headerRow.insertCell(1);
    descriptionCell.style.width = "180px";
    descriptionCell.style.textAlign = "left";
    descriptionCell.style.paddingLeft = "3px";
    this.descriptionLabel = createElement("span", descriptionCell, null, null);
    var experienceCell = headerRow.insertCell(2);
    experienceCell.style.width = "40px";
    experienceCell.style.textAlign = "right";
    this.experienceLabel = createElement("span", experienceCell, null, null);
    var levelCell = previewRow.insertCell(0);
    levelCell.colSpan = 3;
    levelCell.style.paddingLeft = "2px";
    levelCell.style.textAlign = "left";
    levelCell.style.verticalAlign = "middle";
    this.levelLabel = createElement("span", levelCell, null, null);
    this.healthPreviewLabel = createElement("span", levelCell, null, null);
    this.spiritPreviewLabel = createElement("span", levelCell, null, null);
  };
  GlobalUpgradeDetails.prototype.getUpgradeType = function () {
    return 3;
  };
  GlobalUpgradeDetails.prototype.reset = function () {
    this.cachedItem = null;
  };
  GlobalUpgradeDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  GlobalUpgradeDetails.prototype.showDetails = function () {
    if (!this.tableElement) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.tableElement);
      this.shown = true;
    }
  };
  GlobalUpgradeDetails.prototype.update = function () {
    var item = this.upgrade.getUpgradeItem();
    if (this.cachedItem !== item) {
      this.cachedItem = item;
      var iconSprite = item.getIconSprite(),
        inventorySprite = item.inventory.getSprite();
      this.itemImage.style.background = "url('spritesheet/items.png') -" + iconSprite.sourceX + "px -" + iconSprite.sourceY + "px";
      this.itemNameLabel.innerHTML = getHighlightedItemName(item);
      this.rarityLabel.className = getRarityClass(item.getRarity());
      this.rarityLabel.innerHTML = " (" + getItemRarityLabel(item) + ")";
      this.monsterImage.style.background = "url('spritesheet/monsters.png') -" + (inventorySprite.sourceX + 10) + "px -" + (inventorySprite.sourceY + 12) + "px";
      this.levelLabel.innerHTML = "等级" + item.itemLevel;
      var equippedItem = item.inventory.getSlotItem(item.slot);
      var statDelta = equippedItem ? item.itemValue - equippedItem.itemValue : item.itemValue;
      this.itemStatLabel.innerHTML = 0 < statDelta ? "+" + formatAmount(statDelta) + " " + getItemStatLabel(item) : formatAmount(statDelta) + " " + getItemStatLabel(item);
    }
  };
  GlobalUpgradeDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var headerRow = this.tableElement.insertRow(0),
      previewRow = this.tableElement.insertRow(1),
      iconCell = headerRow.insertCell(0);
    iconCell.style.width = "30px";
    iconCell.style.height = "30px";
    iconCell.style.textAlign = "center";
    this.itemImage = createElement("img", iconCell, null, null);
    this.itemImage.src = "images/Transparent.gif";
    this.itemImage.style.width = "30px";
    this.itemImage.style.height = "30px";
    var nameCell = headerRow.insertCell(1);
    nameCell.style.textAlign = "left";
    nameCell.colSpan = 2;
    this.itemNameLabel = createElement("span", nameCell, null, null);
    this.rarityLabel = createElement("span", nameCell, null, null);
    var monsterCell = previewRow.insertCell(0);
    monsterCell.style.width = "30px";
    monsterCell.style.height = "30px";
    monsterCell.style.verticalAlign = "top";
    this.monsterImage = createElement("img", monsterCell, null, null);
    this.monsterImage.className = "characterImage";
    this.monsterImage.src = "images/Transparent.gif";
    this.monsterImage.style.height = "30px";
    this.monsterImage.style.width = "30px";
    var levelCell = previewRow.insertCell(1);
    levelCell.style.width = "70px";
    levelCell.style.paddingLeft = "2px";
    levelCell.style.textAlign = "left";
    this.levelLabel = createElement("span", levelCell, null, null);
    var statCell = previewRow.insertCell(2);
    statCell.style.width = "140px";
    statCell.style.paddingLeft = "2px";
    statCell.style.textAlign = "right";
    this.itemStatLabel = createElement("span", statCell, null, null);
    this.itemStatLabel.style.marginLeft = "10px";
    this.itemStatLabel.style.color = "#0A0";
  };
  AutoDungeonDetails.prototype.getUpgradeType = function () {
    return 13;
  };
  AutoDungeonDetails.prototype.reset = function () {
    this.cachedTitleText = this.cachedDescriptionText = "";
  };
  AutoDungeonDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  AutoDungeonDetails.prototype.showDetails = function () {
    if (!this.tableElement) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.tableElement);
      this.shown = true;
    }
  };
  AutoDungeonDetails.prototype.update = function () {
    var description = this.upgrade.getDescription(),
      title = this.upgrade.getTitle();
    if (this.cachedTitle != title) {
      this.cachedTitle = title;
      this.titleElement.innerHTML = title;
    }
    if (this.cachedDescriptionText != description) {
      this.cachedDescriptionText = description;
      this.labelCell.innerHTML = description;
    }
  };
  AutoDungeonDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var titleRow = this.tableElement.insertRow(0),
      labelRow = this.tableElement.insertRow(1),
      previewCell = titleRow.insertCell(0);
    previewCell.rowSpan = 2;
    previewCell.style.width = "50px";
    previewCell.style.height = "50px";
    previewCell.style.textAlign = "center";
    this.previewImage = createElement("img", previewCell, null, null);
    this.previewImage.src = "images/Transparent.gif";
    this.previewImage.style.width = "50px";
    this.previewImage.style.height = "50px";
    var castleSprite = game.terrainSprites.getSprite(game.castles.castleSpriteName);
    this.previewImage.style.background = "url('spritesheet/terrain.png') -" + castleSprite.sourceX + "px -" + castleSprite.sourceY + "px";
    var titleCell = titleRow.insertCell(1);
    titleCell.style.textAlign = "left";
    this.titleElement = createElement("span", titleCell, null, null);
    this.titleElement.innerHTML = this.upgrade.getTitle();
    this.labelCell = labelRow.insertCell(0);
    this.labelCell.colSpan = 2;
    this.labelCell.style.width = "200px";
    this.labelCell.style.textAlign = "left";
  };
  EquipmentSetDetails.prototype.getUpgradeType = function () {
    return 4;
  };
  EquipmentSetDetails.prototype.reset = function () {
    this.cachedItems.length = 0;
  };
  EquipmentSetDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  EquipmentSetDetails.prototype.showDetails = function () {
    if (!this.tableElement) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.tableElement);
      this.shown = true;
    }
  };
  EquipmentSetDetails.prototype.update = function () {
    var items = this.upgrade.getItems(),
      itemIndex,
      item,
      iconSprite,
      slotCount = Math.min(5, items.length);
    for (itemIndex = 0; itemIndex < slotCount; itemIndex++) {
      if (item = items[itemIndex], this.cachedItems.length < itemIndex || this.cachedItems[itemIndex] !== item) {
        this.cachedItems[itemIndex] = item;
        iconSprite = item.getIconSprite();
        this.iconElements[itemIndex].style.background = "url('spritesheet/items.png') -" + iconSprite.sourceX + "px -" + iconSprite.sourceY + "px";
        this.nameElements[itemIndex].innerHTML = getHighlightedItemName(item);
        this.rarityElements[itemIndex].className = getRarityClass(item.getRarity());
        this.rarityElements[itemIndex].innerHTML = " (" + getItemRarityLabel(item) + ")";
      }
    }
  };
  EquipmentSetDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var headerCell = this.tableElement.insertRow(0).insertCell(0);
    headerCell.colSpan = 2;
    headerCell.style.textAlign = "left";
    headerCell.innerHTML = "装备所有道具升级";
    appendEquipmentRow(this, 1);
    appendEquipmentRow(this, 2);
    appendEquipmentRow(this, 3);
    appendEquipmentRow(this, 4);
    appendEquipmentRow(this, 5);
  };
  SkillUpgradeDetails.prototype.getUpgradeType = function () {
    return SKILL_UPGRADE_TYPE;
  };
  SkillUpgradeDetails.prototype.reset = function () {
    this.cachedTitleText = this.cachedDescriptionText = null;
  };
  SkillUpgradeDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  SkillUpgradeDetails.prototype.showDetails = function () {
    if (!this.titleContainer) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.titleContainer);
      showElement(this.descriptionContainer);
      this.shown = true;
    }
  };
  SkillUpgradeDetails.prototype.update = function () {
    var title = this.upgrade.getTitle(),
      description = this.upgrade.getDescription();
    if (this.cachedTitleText !== title) {
      this.cachedTitleText = title;
      this.titleElement.innerHTML = title;
    }
    if (this.cachedDescriptionText !== description) {
      this.cachedDescriptionText = description;
      this.descriptionElement.innerHTML = description;
    }
  };
  SkillUpgradeDetails.prototype.createDomElements = function () {
    this.titleContainer = createElement("div", this.contentContainer, null, null);
    this.titleContainer.style.position = "relative";
    this.titleContainer.style.height = "30px";
    this.descriptionContainer = createElement("div", this.contentContainer, null, null);
    this.descriptionContainer.style.position = "relative";
    this.descriptionContainer.style.height = "30px";
    this.titleElement = createElement("div", this.titleContainer, null, null);
    this.titleElement.style.position = "absolute";
    this.titleElement.style.top = "0";
    this.titleElement.style.left = "3px";
    this.titleElement.style.right = "3px";
    this.titleElement.style.height = "25px";
    this.titleElement.style.paddingTop = "5px";
    this.titleElement.style.textAlign = "left";
    this.descriptionElement = createElement("div", this.descriptionContainer, null, null);
    this.descriptionElement.style.position = "absolute";
    this.descriptionElement.style.left = "3px";
    this.descriptionElement.style.top = "0";
    this.descriptionElement.style.right = "0";
    this.descriptionElement.style.height = "25px";
    this.descriptionElement.style.paddingTop = "5px";
    this.descriptionElement.style.textAlign = "left";
  };
  SpellUpgradeDetails.prototype.getUpgradeType = function () {
    return 6;
  };
  SpellUpgradeDetails.prototype.reset = function () {
    this.cachedSpell = null;
  };
  SpellUpgradeDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  SpellUpgradeDetails.prototype.showDetails = function () {
    if (!this.table) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.table);
      this.shown = true;
    }
  };
  SpellUpgradeDetails.prototype.update = function () {
    var spell = this.upgrade.getSpell();
    if (this.cachedSpell !== spell) {
      this.cachedSpell = spell;
      var spellCategoryId = spell.spellCategoryId;
      if (10 === spellCategoryId || 9 === spellCategoryId || 17 === spellCategoryId || 11 === spellCategoryId) {
        var minionSpriteName = minionsBySpell[spell.name].spriteName;
        this.assetSource = game.monsterSprites;
        this.asset = game.monsterSprites.getSprite(minionSpriteName);
        this.isAnimated = false;
        this.spellImage.style.background = "url('spritesheet/monsters.png') -" + (this.asset.sourceX + 10) + "px -" + (this.asset.sourceY + 12) + "px";
      } else {
        var effectName = spell.impactEffectName;
        this.assetSource = game.animations.animationMap[effectName];
        this.asset = game.animations.getAnimation(effectName);
        this.frameAge = this.frameIndex = 0;
        this.isAnimated = true;
      }
      this.actionLabel.innerHTML = this.upgrade.getTitle();
      this.descriptionLabel.innerHTML = this.upgrade.getDescription();
    }
    if (this.isAnimated) {
      this.frameAge++;
      if (this.frameAge >= this.effectFrameInterval) {
        this.frameAge = 0;
        this.frameIndex++;
        if (this.frameIndex >= this.asset.getFrameCount()) {
          this.frameIndex = 0;
        }
        var frame = this.asset.frames[this.frameIndex];
        this.spellImage.style.background = "url('" + this.assetSource.fileName + "') -" + frame.frameSourceX + "px -" + frame.frameSourceY + "px";
      }
    }
  };
  SpellUpgradeDetails.prototype.createDomElements = function () {
    this.table = createElement("table", this.contentContainer, null, null);
    this.table.style.width = "100%";
    this.table.style.height = "60px";
    var actionRow = this.table.insertRow(0),
      descriptionRow = this.table.insertRow(1),
      imageCell = actionRow.insertCell(0),
      actionCell = actionRow.insertCell(1);
    imageCell.style.width = "29px";
    imageCell.style.height = "29px";
    imageCell.style.textAlign = "center";
    actionCell.style.width = "180px";
    actionCell.style.textAlign = "left";
    this.spellImage = createElement("img", imageCell, null, null);
    this.spellImage.src = "images/Transparent.gif";
    this.spellImage.style.width = "29px";
    this.spellImage.style.height = "29px";
    this.actionLabel = createElement("span", actionCell, null, null);
    this.actionLabel.style.paddingTop = "5px";
    this.actionLabel.style.textAlign = "left";
    var descriptionCell = descriptionRow.insertCell(0);
    descriptionCell.colSpan = 2;
    descriptionCell.style.textAlign = "left";
    this.descriptionLabel = createElement("span", descriptionCell, null, null);
    this.descriptionLabel.style.paddingTop = "5px";
  };
  MonsterLevelDetails.prototype.getUpgradeType = function () {
    return 7;
  };
  MonsterLevelDetails.prototype.reset = function () {
    this.cachedCostValue = -1;
    this.cachedTitleText = this.cachedDescriptionText = null;
  };
  MonsterLevelDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  MonsterLevelDetails.prototype.showDetails = function () {
    if (!this.tableContainer) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.tableContainer);
      showElement(this.descriptionContainer);
      this.shown = true;
    }
  };
  MonsterLevelDetails.prototype.update = function () {
    var cost = this.upgrade.getCost(),
      title = this.upgrade.getTitle(),
      description = this.upgrade.getDescription();
    if (this.cachedCostValue !== cost) {
      this.cachedCostValue = cost;
      this.costLabel.innerHTML = formatAmount(cost);
    }
    if (this.cachedTitleText !== title) {
      this.cachedTitleText = title;
      this.titleLabel.innerHTML = title;
    }
    if (this.cachedDescriptionText !== description) {
      this.cachedDescriptionText = description;
      this.descriptionLabel.innerHTML = description;
    }
  };
  MonsterLevelDetails.prototype.createDomElements = function () {
    this.tableContainer = createElement("div", this.contentContainer, null, null);
    this.tableContainer.style.position = "relative";
    this.tableContainer.style.height = "30px";
    this.descriptionContainer = createElement("div", this.contentContainer, null, null);
    this.descriptionContainer.style.position = "relative";
    this.descriptionContainer.style.height = "30px";
    var costIconBox = createElement("div", this.tableContainer, null, null);
    costIconBox.style.position = "absolute";
    costIconBox.style.right = "3px";
    costIconBox.style.top = "0";
    costIconBox.style.width = "30px";
    costIconBox.style.height = "100%";
    costIconBox.style.textAlign = "left";
    costIconBox.style.background = "url('spritesheet/items.png') -1464px -73px";
    var costIconImage = createElement("img", costIconBox, null, null);
    costIconImage.src = "images/Transparent.gif";
    costIconImage.style.width = "100%";
    costIconImage.style.height = "15px";
    this.costLabel = createElement("div", this.tableContainer, null, null);
    this.costLabel.style.position = "absolute";
    this.costLabel.style.right = "36px";
    this.costLabel.style.top = "0";
    this.costLabel.style.width = "40px";
    this.costLabel.style.height = "25px";
    this.costLabel.style.paddingTop = "5px";
    this.costLabel.style.textAlign = "right";
    this.titleLabel = createElement("div", this.tableContainer, null, null);
    this.titleLabel.style.position = "absolute";
    this.titleLabel.style.right = "82px";
    this.titleLabel.style.top = "0";
    this.titleLabel.style.left = "3px";
    this.titleLabel.style.height = "25px";
    this.titleLabel.style.paddingTop = "5px";
    this.titleLabel.style.textAlign = "left";
    this.descriptionLabel = createElement("div", this.descriptionContainer, null, null);
    this.descriptionLabel.style.position = "absolute";
    this.descriptionLabel.style.left = "3px";
    this.descriptionLabel.style.top = "0";
    this.descriptionLabel.style.right = "0";
    this.descriptionLabel.style.height = "25px";
    this.descriptionLabel.style.paddingTop = "5px";
    this.descriptionLabel.style.textAlign = "left";
  };
  DungeonPurchaseDetails.prototype.getUpgradeType = function () {
    return 8;
  };
  DungeonPurchaseDetails.prototype.reset = function () {
    this.cachedCostValue = -1;
    this.selectedDungeon = null;
  };
  DungeonPurchaseDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  DungeonPurchaseDetails.prototype.showDetails = function () {
    if (!this.tableElement) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.tableElement);
      this.shown = true;
    }
  };
  DungeonPurchaseDetails.prototype.update = function () {
    var cost = this.upgrade.getCost(),
      dungeon = this.upgrade.getDungeon();
    if (this.cachedCostValue !== cost) {
      this.cachedCostValue = cost;
      this.costElement.innerHTML = formatAmount(cost);
    }
    if (this.selectedDungeon !== dungeon && (this.selectedDungeon = dungeon)) {
      var mapSprite = game.terrainSprites.getSprite(dungeon.mapSprite);
      this.previewImageElement.style.background = "url('spritesheet/terrain.png') -" + mapSprite.sourceX + "px -" + mapSprite.sourceY + "px";
      this.labelCell.innerHTML = dungeon.dungeonName;
    }
  };
  DungeonPurchaseDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var headerRow = this.tableElement.insertRow(0),
      labelRow = this.tableElement.insertRow(1),
      previewCell = headerRow.insertCell(0);
    previewCell.rowSpan = 2;
    previewCell.style.width = "50px";
    previewCell.style.height = "50px";
    previewCell.style.textAlign = "center";
    this.previewImageElement = createElement("img", previewCell, null, null);
    this.previewImageElement.src = "images/Transparent.gif";
    this.previewImageElement.style.width = "50px";
    this.previewImageElement.style.height = "50px";
    var titleCell = headerRow.insertCell(1);
    titleCell.style.textAlign = "left";
    this.titleElement = createElement("span", titleCell, null, null);
    this.titleElement.innerHTML = this.upgrade.getTitle();
    var costCell = headerRow.insertCell(2);
    this.costElement = createElement("span", costCell, null, null);
    var iconCell = headerRow.insertCell(3);
    iconCell.style.width = "30px";
    var costIconBox = createElement("div", iconCell, null, null);
    costIconBox.style.width = "30px";
    costIconBox.style.height = "100%";
    costIconBox.style.textAlign = "left";
    costIconBox.style.background = "url('spritesheet/items.png') -1464px -73px";
    var costIconImage = createElement("img", costIconBox, null, null);
    costIconImage.src = "images/Transparent.gif";
    costIconImage.style.width = "100%";
    costIconImage.style.height = "15px";
    this.labelCell = labelRow.insertCell(0);
    this.labelCell.colSpan = 3;
    this.labelCell.style.width = "200px";
    this.labelCell.style.textAlign = "left";
  };
  ScrollUpgradeDetails.prototype.getUpgradeType = function () {
    return 12;
  };
  ScrollUpgradeDetails.prototype.reset = function () {
    this.cachedCostValue = -1;
    this.cachedScroll = null;
  };
  ScrollUpgradeDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  ScrollUpgradeDetails.prototype.showDetails = function () {
    if (!this.tableElement) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.tableElement);
      this.shown = true;
    }
  };
  ScrollUpgradeDetails.prototype.update = function () {
    var cost = this.upgrade.getCost(),
      scrollItem = this.upgrade.getScrollItem(),
      title = this.upgrade.getTitle(),
      description = this.upgrade.getDescription();
    if (this.cachedCostValue !== cost) {
      this.cachedCostValue = cost;
      this.costElement.innerHTML = formatAmount(cost);
    }
    if (this.cachedScroll !== scrollItem && (this.cachedScroll = scrollItem)) {
      var scrollSprite = scrollItem.spriteName;
      this.scrollImage.style.background = "url('spritesheet/items.png') -" + scrollSprite.sourceX + "px -" + scrollSprite.sourceY + "px";
    }
    if (this.cachedTitleText !== title) {
      this.cachedTitleText = title;
      this.titleCell.innerHTML = title;
    }
    if (this.cachedDescriptionText !== description) {
      this.cachedDescriptionText = description;
      this.titleElement.innerHTML = this.upgrade.getDescription();
    }
  };
  ScrollUpgradeDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var headerRow = this.tableElement.insertRow(0),
      titleRow = this.tableElement.insertRow(1),
      previewCell = headerRow.insertCell(0);
    previewCell.rowSpan = 2;
    previewCell.style.width = "30px";
    previewCell.style.height = "30px";
    previewCell.style.textAlign = "center";
    this.scrollImage = createElement("img", previewCell, null, null);
    this.scrollImage.src = "images/Transparent.gif";
    this.scrollImage.style.width = "30px";
    this.scrollImage.style.height = "30px";
    var titleElementCell = headerRow.insertCell(1);
    titleElementCell.style.textAlign = "left";
    this.titleElement = createElement("span", titleElementCell, null, null);
    this.titleElement.innerHTML = this.upgrade.getTitle();
    var costCell = headerRow.insertCell(2);
    this.costElement = createElement("span", costCell, null, null);
    var iconCell = headerRow.insertCell(3);
    iconCell.style.width = "30px";
    var costIconBox = createElement("div", iconCell, null, null);
    costIconBox.style.width = "30px";
    costIconBox.style.height = "100%";
    costIconBox.style.textAlign = "left";
    costIconBox.style.background = "url('spritesheet/items.png') -1464px -73px";
    var costIconImage = createElement("img", costIconBox, null, null);
    costIconImage.src = "images/Transparent.gif";
    costIconImage.style.width = "100%";
    costIconImage.style.height = "15px";
    this.titleCell = titleRow.insertCell(0);
    this.titleCell.colSpan = 3;
    this.titleCell.style.width = "200px";
    this.titleCell.style.textAlign = "left";
  };
  CastlePurchaseDetails.prototype.getUpgradeType = function () {
    return 9;
  };
  CastlePurchaseDetails.prototype.reset = function () {
    this.cachedRequiredLevel = -1;
  };
  CastlePurchaseDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  CastlePurchaseDetails.prototype.showDetails = function () {
    if (!this.tableElement) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.tableElement);
      this.shown = true;
    }
  };
  CastlePurchaseDetails.prototype.update = function () {
    var pendingFarmKills = game.dungeons.pendingFarmKills;
    if (this.cachedRequiredLevel !== pendingFarmKills) {
      this.cachedRequiredLevel = pendingFarmKills;
      this.bonusLabel.innerHTML = "+" + formatAmount(pendingFarmKills);
    }
  };
  CastlePurchaseDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var headerRow = this.tableElement.insertRow(0),
      descriptionRow = this.tableElement.insertRow(1),
      previewCell = headerRow.insertCell(0);
    previewCell.rowSpan = 2;
    previewCell.style.width = "50px";
    previewCell.style.height = "50px";
    previewCell.style.textAlign = "center";
    this.previewImageElement = createElement("img", previewCell, null, null);
    this.previewImageElement.src = "images/Transparent.gif";
    this.previewImageElement.style.width = "50px";
    this.previewImageElement.style.height = "50px";
    var dungeonSprite = game.terrainSprites.getSprite("L2_DungeonE.PNG");
    this.previewImageElement.style.background = "url('spritesheet/terrain.png') -" + dungeonSprite.sourceX + "px -" + dungeonSprite.sourceY + "px";
    var titleCell = headerRow.insertCell(1);
    titleCell.style.textAlign = "left";
    titleCell.style.width = "150px";
    this.titleElement = createElement("span", titleCell, null, null);
    this.titleElement.innerHTML = this.upgrade ? this.upgrade.getTitle() : "收获地牢";
    var bonusCell = headerRow.insertCell(2);
    this.bonusLabel = createElement("span", bonusCell, null, null);
    var iconCell = headerRow.insertCell(3);
    iconCell.style.width = "30px";
    var costIconBox = createElement("div", iconCell, null, null);
    costIconBox.style.width = "30px";
    costIconBox.style.height = "100%";
    costIconBox.style.textAlign = "left";
    costIconBox.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    var costIconImage = createElement("img", costIconBox, null, null);
    costIconImage.src = "images/Transparent.gif";
    costIconImage.style.width = "100%";
    costIconImage.style.height = "15px";
    var descriptionCell = descriptionRow.insertCell(0);
    descriptionCell.colSpan = 3;
    descriptionCell.style.textAlign = "left";
    descriptionCell.innerHTML = this.upgrade ? this.upgrade.getDescription() : "收集杀戮农场";
  };
  FarmUpgradeDetails.prototype.getUpgradeType = function () {
    return 10;
  };
  FarmUpgradeDetails.prototype.reset = function () {
    this.cachedBonus = -1;
  };
  FarmUpgradeDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  FarmUpgradeDetails.prototype.showDetails = function () {
    if (!this.tableElement) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.tableElement);
      this.shown = true;
    }
  };
  FarmUpgradeDetails.prototype.update = function () {
    var collectedGold = game.shops.collectedGold;
    if (this.cachedBonus !== collectedGold) {
      this.cachedBonus = collectedGold;
      this.bonusLabel.innerHTML = "+" + formatAmount(collectedGold);
    }
  };
  FarmUpgradeDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var headerRow = this.tableElement.insertRow(0),
      descriptionRow = this.tableElement.insertRow(1),
      previewCell = headerRow.insertCell(0);
    previewCell.rowSpan = 2;
    previewCell.style.width = "50px";
    previewCell.style.height = "50px";
    previewCell.style.textAlign = "center";
    this.previewImageElement = createElement("img", previewCell, null, null);
    this.previewImageElement.src = "images/Transparent.gif";
    this.previewImageElement.style.width = "50px";
    this.previewImageElement.style.height = "50px";
    var farmSprite = game.terrainSprites.getSprite("L2_Terrain077.PNG");
    this.previewImageElement.style.background = "url('spritesheet/terrain.png') -" + farmSprite.sourceX + "px -" + farmSprite.sourceY + "px";
    var titleCell = headerRow.insertCell(1);
    titleCell.style.textAlign = "left";
    titleCell.style.width = "150px";
    this.titleElement = createElement("span", titleCell, null, null);
    this.titleElement.innerHTML = this.upgrade ? this.upgrade.getTitle() : "收集道具黄金";
    var bonusCell = headerRow.insertCell(2);
    this.bonusLabel = createElement("span", bonusCell, null, null);
    var iconCell = headerRow.insertCell(3);
    iconCell.style.width = "30px";
    var costIconBox = createElement("div", iconCell, null, null);
    costIconBox.style.width = "30px";
    costIconBox.style.height = "100%";
    costIconBox.style.textAlign = "left";
    costIconBox.style.background = "url('spritesheet/items.png') -1464px -73px";
    var costIconImage = createElement("img", costIconBox, null, null);
    costIconImage.src = "images/Transparent.gif";
    costIconImage.style.width = "100%";
    costIconImage.style.height = "15px";
    var descriptionCell = descriptionRow.insertCell(0);
    descriptionCell.colSpan = 3;
    descriptionCell.style.textAlign = "left";
    descriptionCell.innerHTML = this.upgrade ? this.upgrade.getDescription() : "卖掉道具得到黄金";
  };
  CharacterLevelDetails.prototype.getUpgradeType = function () {
    return 11;
  };
  CharacterLevelDetails.prototype.reset = function () {
    this.cachedCostValue = -1;
    this.cachedTitleText = this.cachedAssessmentText = null;
    this.cachedLevel = -1;
    this.monsterDefence = this.monsterAttack = this.monsterSpirit = this.monsterHealth = this.cachedPartyDefenceRating = this.cachedPartyAttackRating = this.cachedPartyDamage = this.cachedPartyArmor = 0;
  };
  CharacterLevelDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
    this.cachedCostValue = -1;
    this.cachedTitleText = this.cachedAssessmentText = null;
    this.cachedLevel = -1;
    this.monsterDefence = this.monsterAttack = this.monsterSpirit = this.monsterHealth = this.cachedPartyDefenceRating = this.cachedPartyAttackRating = this.cachedPartyDamage = this.cachedPartyArmor = 0;
  };
  CharacterLevelDetails.prototype.showDetails = function () {
    if (!this.table) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.table);
      this.shown = true;
    }
  };
  CharacterLevelDetails.prototype.update = function () {
    var cost = this.upgrade.getCost(),
      title = this.upgrade.getTitle(),
      monsterLevel = this.upgrade.getMonsterLevel();
    if (this.cachedCostValue != cost) {
      this.cachedCostValue = cost;
      this.costLabel.innerHTML = formatAmount(cost);
    }
    if (this.cachedTitleText != title) {
      this.cachedTitleText = title;
      this.titleElement.innerHTML = title;
    }
    if (this.cachedLevel != monsterLevel) {
      this.cachedLevel = monsterLevel;
      var scaledLevel = Math.max(1, 10 * (this.cachedLevel - 1)) + 1;
      this.monsterHealth = scaleByLevel(scaledLevel, monsterDamageCurve, 1);
      this.monsterSpirit = scaleByLevel(scaledLevel, monsterArmorCurve, 1);
      this.monsterAttack = scaleByLevel(scaledLevel, monsterAttackCurve, 1);
      this.monsterDefence = scaleByLevel(scaledLevel, monsterDefenceCurve, 1);
      this.monsterDamageLabel.innerHTML = formatAmount(this.monsterHealth) + " 伤害";
      this.monsterArmorLabel.innerHTML = formatAmount(this.monsterSpirit) + " 护甲";
      this.monsterAttackLabel.innerHTML = formatAmount(this.monsterAttack) + " 攻击";
      this.monsterDefenceLabel.innerHTML = formatAmount(this.monsterDefence) + " 防御";
      var monsterTypes = getMonsterTypesForLevel(game.monsterCatalog, monsterLevel);
      var monsterSprite = monsterTypes[randomInt(monsterTypes.length)].sprite;
      this.monsterPreviewImage.style.background = "url('spritesheet/monsters.png') -" + (monsterSprite.sourceX + 10) + "px -" + (monsterSprite.sourceY + 12) + "px";
    }
    var totalDamage = 0,
      totalArmor = 0,
      totalAttackRating = 0,
      totalDefenceRating = 0,
      partyMinLevel = getPartyMinLevel(),
      requiredMonsterLevel = this.upgrade.getMonsterLevel(),
      adventurerStats;
    for (var adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
      adventurerStats = game.state.adventurers[adventurerIndex].stats;
      totalDamage += statValue(adventurerStats.damage);
      totalArmor += statValue(adventurerStats.armor);
      totalAttackRating += statValue(adventurerStats.attackRating);
      totalDefenceRating += statValue(adventurerStats.defenceRating);
    }
    var averageDamage = floorNumber(totalDamage / game.state.adventurers.length);
    var averageArmor = floorNumber(totalArmor / game.state.adventurers.length);
    var averageAttackRating = floorNumber(totalAttackRating / game.state.adventurers.length);
    var averageDefenceRating = floorNumber(totalDefenceRating / game.state.adventurers.length);
    if (this.cachedPartyDamage !== averageDamage) {
      this.monsterArmorLabel.style.color = this.monsterSpirit >= averageDamage ? "#F00" : "#0A0";
      this.cachedPartyDamage = averageDamage;
    }
    if (this.cachedPartyArmor !== averageArmor) {
      this.monsterDamageLabel.style.color = this.monsterHealth >= averageArmor ? "#F00" : "#0A0";
      this.cachedPartyArmor = averageArmor;
    }
    if (this.cachedPartyAttackRating !== averageAttackRating) {
      this.monsterDefenceLabel.style.color = this.monsterDefence >= averageAttackRating ? "#F00" : "#0A0";
      this.cachedPartyAttackRating = averageAttackRating;
    }
    if (this.cachedPartyDefenceRating !== averageDefenceRating) {
      this.monsterAttackLabel.style.color = this.monsterAttack >= averageDefenceRating ? "#F00" : "#0A0";
      this.cachedPartyDefenceRating = averageDefenceRating;
    }
    var threatCount = (averageDamage > this.monsterSpirit ? 1 : 0) + (averageArmor > this.monsterHealth ? 1 : 0) + (averageAttackRating > this.monsterDefence ? 1 : 0) + (averageDefenceRating > this.monsterAttack ? 1 : 0);
    var assessmentText = partyMinLevel < requiredMonsterLevel ? "最低角色等级需求: " + requiredMonsterLevel : 4 === threatCount ? "评定: 小菜一碟" : 3 === threatCount ? "评定: 有点挑战" : 2 === threatCount ? "评定: 非常困难!" : "评定: 难如登天!";
    if (this.cachedAssessmentText !== assessmentText) {
      this.cachedAssessmentText = assessmentText;
      this.descriptionElement.innerHTML = assessmentText;
    }
  };
  CharacterLevelDetails.prototype.createDomElements = function () {
    this.table = createElement("table", this.contentContainer, null, null);
    this.table.style.width = "100%";
    var headerRow = this.table.insertRow(0),
      previewRow = this.table.insertRow(1),
      statsRow = this.table.insertRow(2),
      titleCell = headerRow.insertCell(0),
      costCell = headerRow.insertCell(1),
      iconCell = headerRow.insertCell(2),
      descriptionCell = previewRow.insertCell(0);
    titleCell.style.width = "190px";
    costCell.style.width = "40px";
    costCell.style.textAlign = "right";
    costCell.style.paddingTop = "0";
    iconCell.style.width = "30px";
    iconCell.style.height = "30px";
    descriptionCell.style.height = "20px";
    descriptionCell.colSpan = 4;
    var costIconBox = createElement("div", iconCell, null, null);
    costIconBox.style.width = "30px";
    costIconBox.style.height = "100%";
    costIconBox.style.textAlign = "left";
    costIconBox.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    var costIconImage = createElement("img", costIconBox, null, null);
    costIconImage.src = "images/Transparent.gif";
    costIconImage.style.width = "100%";
    costIconImage.style.height = "15px";
    this.costLabel = createElement("span", costCell, null, null);
    this.costLabel.style.width = "40px";
    this.costLabel.style.height = "25px";
    this.titleElement = createElement("div", titleCell, null, null);
    this.titleElement.style.textAlign = "left";
    this.descriptionElement = createElement("div", descriptionCell, null, null);
    this.descriptionElement.style.textAlign = "left";
    var statsCell = statsRow.insertCell(0);
    statsCell.colSpan = 3;
    var statsTable = createElement("table", statsCell, null, null);
    statsTable.style.width = "100%";
    var monsterRowTop = statsTable.insertRow(0);
    var monsterRowBottom = statsTable.insertRow(1);
    var previewCell = monsterRowTop.insertCell(0);
    var damageCell = monsterRowTop.insertCell(1);
    var attackCell = monsterRowTop.insertCell(2);
    previewCell.rowSpan = 2;
    previewCell.style.width = "30px";
    previewCell.style.height = "30px";
    damageCell.style.width = "100px";
    damageCell.style.textAlign = "right";
    attackCell.style.width = "100px";
    attackCell.style.textAlign = "right";
    this.monsterPreviewImage = createElement("img", previewCell, null, null);
    this.monsterPreviewImage.className = "characterImage";
    this.monsterPreviewImage.src = "images/Transparent.gif";
    this.monsterPreviewImage.style.height = "30px";
    this.monsterPreviewImage.style.width = "30px";
    this.monsterDamageLabel = createElement("span", damageCell, null, null);
    this.monsterDamageLabel.style.marginLeft = "3px";
    this.monsterAttackLabel = createElement("span", attackCell, null, null);
    this.monsterAttackLabel.style.marginLeft = "15px";
    var armorCell = monsterRowBottom.insertCell(0);
    var defenceCell = monsterRowBottom.insertCell(1);
    armorCell.style.width = "100px";
    armorCell.style.textAlign = "right";
    defenceCell.style.width = "100px";
    defenceCell.style.textAlign = "right";
    this.monsterArmorLabel = createElement("span", armorCell, null, null);
    this.monsterArmorLabel.style.marginLeft = "3px";
    this.monsterDefenceLabel = createElement("span", defenceCell, null, null);
    this.monsterDefenceLabel.style.marginLeft = "15px";
  };
  AchievementClaimDetails.prototype.getUpgradeType = function () {
    return 14;
  };
  AchievementClaimDetails.prototype.reset = function () {
    this.cachedTitleText = this.cachedDescriptionText = null;
  };
  AchievementClaimDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  AchievementClaimDetails.prototype.showDetails = function () {
    if (!this.titleElement) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.titleElement);
      showElement(this.descriptionElement);
      this.shown = true;
    }
  };
  AchievementClaimDetails.prototype.update = function () {
    var title = this.upgrade.getTitle(),
      description = this.upgrade.getDescription();
    if (this.cachedTitleText !== title) {
      this.cachedTitleText = title;
      this.titleElement.innerHTML = title;
    }
    if (this.cachedDescriptionText !== description) {
      this.cachedDescriptionText = description;
      this.descriptionElement.innerHTML = description;
    }
  };
  AchievementClaimDetails.prototype.createDomElements = function () {
    var headingElement = createElement("div", this.contentContainer, null, null);
    headingElement.style.padding = "5px";
    headingElement.style.color = "#FA0";
    headingElement.style.fontWeight = "bold";
    headingElement.innerHTML = "成就!";
    this.titleElement = createElement("div", this.contentContainer, null, null);
    this.titleElement.style.padding = "5px";
    this.descriptionElement = createElement("div", this.contentContainer, null, null);
    this.descriptionElement.style.padding = "5px";
  };
  AchievementProgressDetails.prototype.getUpgradeType = function () {
    return 15;
  };
  AchievementProgressDetails.prototype.reset = function () {
    this.cachedTitleText = this.cachedDescriptionText = null;
  };
  AchievementProgressDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  AchievementProgressDetails.prototype.showDetails = function () {
    if (!this.titleElement) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.titleElement);
      showElement(this.descriptionElement);
      this.shown = true;
    }
  };
  AchievementProgressDetails.prototype.update = function () {
    var title = this.upgrade.getTitle(),
      description = this.upgrade.getDescription();
    if (this.cachedTitleText !== title) {
      this.cachedTitleText = title;
      this.titleElement.innerHTML = title;
    }
    if (this.cachedDescriptionText !== description) {
      this.cachedDescriptionText = description;
      this.descriptionElement.innerHTML = description;
    }
  };
  AchievementProgressDetails.prototype.createDomElements = function () {
    this.titleElement = createElement("div", this.contentContainer, null, null);
    this.titleElement.style.padding = "5px";
    this.descriptionElement = createElement("div", this.contentContainer, null, null);
    this.descriptionElement.style.padding = "5px";
  };
  PointUpgradeDetails.prototype.getUpgradeType = function () {
    return 16;
  };
  PointUpgradeDetails.prototype.reset = function () {
    this.cachedTitleText = this.cachedDescriptionText = null;
    this.cachedCostValue = -1;
  };
  PointUpgradeDetails.prototype.attachUpgrade = function (upgrade) {
    this.upgrade = upgrade;
  };
  PointUpgradeDetails.prototype.showDetails = function () {
    if (!this.titleElement) {
      (/** @type {DomDetails} */ (/** @type {unknown} */ (this))).createDomElements();
    }
    if (!this.shown) {
      showElement(this.titleElement);
      showElement(this.descriptionElement);
      showElement(this.costLabel);
      this.shown = true;
    }
  };
  PointUpgradeDetails.prototype.update = function () {
    var title = this.upgrade.getTitle(),
      description = this.upgrade.getDescription(),
      cost = this.upgrade.getCost();
    if (this.cachedTitleText != title) {
      this.cachedTitleText = title;
      this.titleElement.innerHTML = title;
    }
    if (this.cachedDescriptionText != description) {
      this.cachedDescriptionText = description;
      this.descriptionElement.innerHTML = description;
    }
    if (this.cachedCostValue != cost) {
      this.cachedCostValue = cost;
      this.costLabel.innerHTML = formatGroupedAmount(cost) + " AP";
    }
  };
  PointUpgradeDetails.prototype.createDomElements = function () {
    this.titleElement = createElement("div", this.contentContainer, null, null);
    this.titleElement.style.padding = "5px";
    this.descriptionElement = createElement("div", this.contentContainer, null, null);
    this.descriptionElement.style.padding = "5px";
    this.costLabel = createElement("div", this.contentContainer, null, null);
    this.costLabel.style.padding = "5px";
  };
  UpgradeListView.prototype = new View();
  UpgradeListView.prototype.reset = function () {
    clearElementById(this.elementId);
    var buttonIndex;
    for (buttonIndex = 0; buttonIndex < this.buttons.length; buttonIndex++) {
      (/** @type {UpgradeButtonView & ActiveUpgradeButton} */ (/** @type {unknown} */ (this.buttons[buttonIndex]))).reset();
    }
    var upgrades = this.upgradeCollection.upgrades;
    for (buttonIndex = 0; buttonIndex < this.buttons.length; buttonIndex++) {
      (/** @type {UpgradeButtonView & ActiveUpgradeButton} */ (/** @type {unknown} */ (this.buttons[buttonIndex]))).attachUpgrade(upgrades[buttonIndex]);
    }
    this.cachedUpdateCounter = -100;
  };
  UpgradeListView.prototype.update = function () {
    var updateCounter;
    updateCounter = this.upgradeCollection.updateCounter;
    if (this.cachedUpdateCounter !== updateCounter) {
      this.cachedUpdateCounter = updateCounter;
      var upgrades = this.upgradeCollection.upgrades;
      for (var buttonIndex = 0; buttonIndex < this.buttons.length; buttonIndex++) {
        (/** @type {UpgradeButtonView & ActiveUpgradeButton} */ (/** @type {unknown} */ (this.buttons[buttonIndex]))).attachUpgrade(upgrades[buttonIndex]);
      }
    }
    for (buttonIndex = 0; buttonIndex < this.buttons.length; buttonIndex++) {
      (/** @type {UpgradeButtonView & ActiveUpgradeButton} */ (/** @type {unknown} */ (this.buttons[buttonIndex]))).render();
    }
  };
}
