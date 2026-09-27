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
export function UpgradeButtonView(a, b, c, d) {
  this.elementId = a + "_" + c;
  this.visible = true;
  this.baseElementId = a;
  this.upgrade = b;
  this.activeDetails = null;
  this.alwaysVisible = d;
  this.cachedUpgradeType = this.buttonElement = null;
  this.buttonLabel = "";
}
export function mountUpgradeButton(a) {
  var b = getElement(a.baseElementId);
  a.buttonLabel = a.getButtonClass();
  a.buttonElement = createElement("div", b, a.elementId, a.buttonLabel);
  a.buttonElement.onmouseup = function () {
    a.onPurchaseClicked();
    return false;
  };
}
export function createUpgradeDetails(a, b) {
  switch (b) {
    case 1:
      return new ItemPurchaseDetails(a.upgrade, a.buttonElement);
    case 2:
      return new EquipmentDetails(a.upgrade, a.buttonElement);
    case 3:
      return new GlobalUpgradeDetails(a.upgrade, a.buttonElement);
    case 4:
      return new EquipmentSetDetails(a.upgrade, a.buttonElement);
    case SKILL_UPGRADE_TYPE:
      return new SkillUpgradeDetails(a.upgrade, a.buttonElement);
    case 6:
      return new SpellUpgradeDetails(a.upgrade, a.buttonElement);
    case 7:
      return new MonsterLevelDetails(a.upgrade, a.buttonElement);
    case 8:
      return new DungeonPurchaseDetails(a.upgrade, a.buttonElement);
    case 9:
      return new CastlePurchaseDetails(a.upgrade, a.buttonElement);
    case 10:
      return new FarmUpgradeDetails(a.upgrade, a.buttonElement);
    case 11:
      return new CharacterLevelDetails(a.upgrade, a.buttonElement);
    case 12:
      return new ScrollUpgradeDetails(a.upgrade, a.buttonElement);
    case 13:
      return new AutoDungeonDetails(a.upgrade, a.buttonElement);
    case 14:
      return new AchievementClaimDetails(a.upgrade, a.buttonElement);
    case 15:
      return new AchievementProgressDetails(a.upgrade, a.buttonElement);
    case 16:
      return new PointUpgradeDetails(a.upgrade, a.buttonElement);
    default:
      return null;
  }
}
export function ItemPurchaseDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.descriptionLabel = this.titleLabel = this.costElement = this.descriptionContainer = this.detailsContainer = null;
  this.shown = false;
  this.cachedCostValue = -1;
  this.cachedTitleText = this.cachedDescriptionText = null;
}
export function EquipmentDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.experienceLabel = this.spiritPreviewLabel = this.healthPreviewLabel = this.levelLabel = this.descriptionLabel = this.characterImage = this.table = null;
  this.shown = false;
  this.cachedCharacter = null;
  this.cachedCharacterLevel = -1;
}
export function GlobalUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.itemStatLabel = this.levelLabel = this.rarityLabel = this.itemNameLabel = this.monsterImage = this.itemImage = this.tableElement = null;
  this.shown = false;
  this.cachedItem = null;
}
export function AutoDungeonDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.labelCell = this.titleElement = this.previewImage = this.tableElement = null;
  this.shown = false;
  this.cachedTitleText = this.cachedTitle = this.cachedDescriptionText = "";
}
export function EquipmentSetDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.iconElements = [];
  this.nameElements = [];
  this.rarityElements = [];
  this.tableElement = null;
  this.shown = false;
  this.cachedItems = [];
}
export function appendEquipmentRow(a, b) {
  var c = a.tableElement.insertRow(b),
    d = c.insertCell(0);
  d.style.width = "30px";
  d.style.height = "30px";
  d.style.textAlign = "center";
  d = createElement("img", d, null, null);
  d.src = "images/Transparent.gif";
  d.style.width = "30px";
  d.style.height = "30px";
  a.iconElements.push(d);
  c = c.insertCell(1);
  c.style.textAlign = "left";
  a.nameElements.push(createElement("span", c, null, null));
  a.rarityElements.push(createElement("span", c, null, null));
}
export function SkillUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.descriptionElement = this.titleElement = this.descriptionContainer = this.titleContainer = null;
  this.shown = false;
  this.cachedTitleText = this.cachedDescriptionText = null;
}
export function SpellUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.descriptionLabel = this.actionLabel = this.spellImage = this.table = null;
  this.shown = false;
  this.asset = this.assetSource = this.cachedSpell = null;
  this.isAnimated = true;
  this.frameAge = this.frameIndex = 0;
  this.effectFrameInterval = 8;
}
export function MonsterLevelDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.descriptionLabel = this.titleLabel = this.costLabel = this.descriptionContainer = this.tableContainer = null;
  this.shown = false;
  this.cachedCostValue = -1;
  this.cachedTitleText = this.cachedDescriptionText = null;
}
export function DungeonPurchaseDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.selectedDungeon = this.labelCell = this.titleElement = this.previewImageElement = this.tableElement = this.costElement = null;
  this.shown = false;
  this.cachedCostValue = -1;
}
export function ScrollUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.cachedScroll = this.titleCell = this.titleElement = this.scrollImage = this.tableElement = this.costElement = null;
  this.shown = false;
  this.cachedDescriptionText = null;
  this.cachedCostValue = -1;
  this.cachedTitleText = null;
}
export function CastlePurchaseDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.selectedDungeon = this.labelCell = this.titleElement = this.previewImageElement = this.tableElement = this.bonusLabel = null;
  this.shown = false;
  this.cachedRequiredLevel = -1;
}
export function FarmUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.selectedDungeon = this.labelCell = this.titleElement = this.previewImageElement = this.tableElement = this.bonusLabel = null;
  this.shown = false;
  this.cachedBonus = -1;
}
export function CharacterLevelDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.cachedPartyDefenceRating = this.cachedPartyAttackRating = this.cachedPartyArmor = this.cachedPartyDamage = this.monsterDefence = this.monsterAttack = this.monsterSpirit = this.monsterHealth = 0;
  this.monsterDefenceLabel = this.monsterAttackLabel = this.monsterArmorLabel = this.monsterDamageLabel = this.descriptionElement = this.titleElement = this.costLabel = this.monsterPreviewImage = this.table = null;
  this.shown = false;
  this.cachedCostValue = -1;
  this.cachedTitleText = this.cachedAssessmentText = null;
  this.cachedLevel = -1;
}
export function AchievementClaimDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.descriptionElement = this.titleElement = null;
  this.shown = false;
  this.cachedTitleText = this.cachedDescriptionText = null;
}
export function AchievementProgressDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.descriptionElement = this.titleElement = null;
  this.shown = false;
  this.cachedTitleText = this.cachedDescriptionText = null;
}
export function PointUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.costLabel = this.descriptionElement = this.titleElement = null;
  this.shown = false;
  this.cachedTitleText = this.cachedDescriptionText = null;
  this.cachedCostValue = -1;
}
export function UpgradeListView(a, b, c) {
  this.elementId = a;
  this.visible = true;
  this.upgradeCollection = b;
  this.cachedUpdateCounter = -100;
  this.buttons = [];
  var d = b.upgrades;
  for (b = 0; b < d.length; b++) {
    this.buttons.push(new UpgradeButtonView(a, d[b], b, c));
  }
}
export function getRarityClass(a) {
  switch (a) {
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
  UpgradeButtonView.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
    if (this.activeDetails) {
      this.activeDetails.attachUpgrade(a);
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
    var a = this.upgrade.getUpgradeType(),
      b = (/** @type {UpgradeButtonView & { getButtonClass: () => string }} */ (/** @type {unknown} */ (this))).getButtonClass();
    if (!this.buttonElement) {
      mountUpgradeButton(this);
    }
    if (this.cachedUpgradeType !== a) {
      this.cachedUpgradeType = a;
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
    if (this.buttonLabel !== b) {
      this.buttonLabel = b;
      this.buttonElement.className = b;
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
  ItemPurchaseDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getCost(),
      b = this.upgrade.getTitle(),
      c = this.upgrade.getDescription();
    if (this.cachedCostValue !== a) {
      this.cachedCostValue = a;
      this.costElement.innerHTML = formatAmount(a);
    }
    if (this.cachedTitleText !== b) {
      this.cachedTitleText = b;
      this.titleLabel.innerHTML = b;
    }
    if (this.cachedDescriptionText !== c) {
      this.cachedDescriptionText = c;
      this.descriptionLabel.innerHTML = c;
    }
  };
  ItemPurchaseDetails.prototype.createDomElements = function () {
    this.detailsContainer = createElement("div", this.contentContainer, null, null);
    this.detailsContainer.style.position = "relative";
    this.detailsContainer.style.height = "30px";
    this.descriptionContainer = createElement("div", this.contentContainer, null, null);
    this.descriptionContainer.style.position = "relative";
    this.descriptionContainer.style.height = "30px";
    var a = createElement("div", this.detailsContainer, null, null);
    a.style.position = "absolute";
    a.style.right = "3px";
    a.style.top = "0";
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
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
  EquipmentDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
      var a = this.upgrade.getCharacter(),
        b = a.stats.characterLevel;
      if (this.cachedCharacter !== a || this.cachedCharacterLevel != b) {
        this.cachedCharacter = a;
        this.cachedCharacterLevel = b;
        var c = a.getSprite(),
          d = a.classDefinition.statMultipliers;
        this.characterImage.style.background = "url('spritesheet/monsters.png') -" + (c.sourceX + 10) + "px -" + (c.sourceY + 12) + "px";
        this.descriptionLabel.innerHTML = this.upgrade.getDescription();
        this.experienceLabel.innerHTML = formatAmount(a.stats.experienceToLevelUp) + " XP";
        this.levelLabel.innerHTML = "等级 " + (b + 1);
        this.healthPreviewLabel.innerHTML = ", " + formatAmount(scaleByLevel(b + 1, healthCurve, d.maxHealthMultiplier)) + " HP";
        this.spiritPreviewLabel.innerHTML = ", " + formatAmount(scaleByLevel(b + 1, spiritCurve, d.maxSpiritMultiplier)) + " SP";
      }
    } else {
      console.log("bug in upgrade button");
    }
  };
  EquipmentDetails.prototype.createDomElements = function () {
    this.table = createElement("table", this.contentContainer, null, null);
    this.table.style.width = "100%";
    var a = this.table.insertRow(0),
      b = this.table.insertRow(1),
      c = a.insertCell(0);
    c.style.width = "30px";
    c.style.height = "30px";
    c.style.verticalAlign = "top";
    this.characterImage = createElement("img", c, null, null);
    this.characterImage.className = "characterImage";
    this.characterImage.src = "images/Transparent.gif";
    this.characterImage.style.height = "30px";
    this.characterImage.style.width = "30px";
    c = a.insertCell(1);
    c.style.width = "180px";
    c.style.textAlign = "left";
    c.style.paddingLeft = "3px";
    this.descriptionLabel = createElement("span", c, null, null);
    a = a.insertCell(2);
    a.style.width = "40px";
    a.style.textAlign = "right";
    this.experienceLabel = createElement("span", a, null, null);
    b = b.insertCell(0);
    b.colSpan = 3;
    b.style.paddingLeft = "2px";
    b.style.textAlign = "left";
    b.style.verticalAlign = "middle";
    this.levelLabel = createElement("span", b, null, null);
    this.healthPreviewLabel = createElement("span", b, null, null);
    this.spiritPreviewLabel = createElement("span", b, null, null);
  };
  GlobalUpgradeDetails.prototype.getUpgradeType = function () {
    return 3;
  };
  GlobalUpgradeDetails.prototype.reset = function () {
    this.cachedItem = null;
  };
  GlobalUpgradeDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getUpgradeItem();
    if (this.cachedItem !== a) {
      this.cachedItem = a;
      var b = a.getIconSprite(),
        c = a.inventory.getSprite();
      this.itemImage.style.background = "url('spritesheet/items.png') -" + b.sourceX + "px -" + b.sourceY + "px";
      this.itemNameLabel.innerHTML = getHighlightedItemName(a);
      this.rarityLabel.className = getRarityClass(a.getRarity());
      this.rarityLabel.innerHTML = " (" + getItemRarityLabel(a) + ")";
      this.monsterImage.style.background = "url('spritesheet/monsters.png') -" + (c.sourceX + 10) + "px -" + (c.sourceY + 12) + "px";
      this.levelLabel.innerHTML = "等级" + a.itemLevel;
      b = (b = a.inventory.getSlotItem(a.slot)) ? a.itemValue - b.itemValue : a.itemValue;
      this.itemStatLabel.innerHTML = 0 < b ? "+" + formatAmount(b) + " " + getItemStatLabel(a) : formatAmount(b) + " " + getItemStatLabel(a);
    }
  };
  GlobalUpgradeDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var a = this.tableElement.insertRow(0),
      b = this.tableElement.insertRow(1),
      c = a.insertCell(0);
    c.style.width = "30px";
    c.style.height = "30px";
    c.style.textAlign = "center";
    this.itemImage = createElement("img", c, null, null);
    this.itemImage.src = "images/Transparent.gif";
    this.itemImage.style.width = "30px";
    this.itemImage.style.height = "30px";
    a = a.insertCell(1);
    a.style.textAlign = "left";
    a.colSpan = 2;
    this.itemNameLabel = createElement("span", a, null, null);
    this.rarityLabel = createElement("span", a, null, null);
    a = b.insertCell(0);
    a.style.width = "30px";
    a.style.height = "30px";
    a.style.verticalAlign = "top";
    this.monsterImage = createElement("img", a, null, null);
    this.monsterImage.className = "characterImage";
    this.monsterImage.src = "images/Transparent.gif";
    this.monsterImage.style.height = "30px";
    this.monsterImage.style.width = "30px";
    a = b.insertCell(1);
    a.style.width = "70px";
    a.style.paddingLeft = "2px";
    a.style.textAlign = "left";
    this.levelLabel = createElement("span", a, null, null);
    b = b.insertCell(2);
    b.style.width = "140px";
    b.style.paddingLeft = "2px";
    b.style.textAlign = "right";
    this.itemStatLabel = createElement("span", b, null, null);
    this.itemStatLabel.style.marginLeft = "10px";
    this.itemStatLabel.style.color = "#0A0";
  };
  AutoDungeonDetails.prototype.getUpgradeType = function () {
    return 13;
  };
  AutoDungeonDetails.prototype.reset = function () {
    this.cachedTitleText = this.cachedDescriptionText = "";
  };
  AutoDungeonDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getDescription(),
      b = this.upgrade.getTitle();
    if (this.cachedTitle != b) {
      this.cachedTitle = b;
      this.titleElement.innerHTML = b;
    }
    if (this.cachedDescriptionText != a) {
      this.cachedDescriptionText = a;
      this.labelCell.innerHTML = a;
    }
  };
  AutoDungeonDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var a = this.tableElement.insertRow(0),
      b = this.tableElement.insertRow(1),
      c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.previewImage = createElement("img", c, null, null);
    this.previewImage.src = "images/Transparent.gif";
    this.previewImage.style.width = "50px";
    this.previewImage.style.height = "50px";
    c = game.terrainSprites.getSprite(game.castles.Ny);
    this.previewImage.style.background = "url('spritesheet/terrain.png') -" + c.sourceX + "px -" + c.sourceY + "px";
    a = a.insertCell(1);
    a.style.textAlign = "left";
    this.titleElement = createElement("span", a, null, null);
    this.titleElement.innerHTML = this.upgrade.getTitle();
    this.labelCell = b.insertCell(0);
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
  EquipmentSetDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getItems(),
      b,
      c,
      d,
      f = Math.min(5, a.length);
    for (b = 0; b < f; b++) {
      if (c = a[b], this.cachedItems.length < b || this.cachedItems[b] !== c) {
        this.cachedItems[b] = c;
        d = c.getIconSprite();
        this.iconElements[b].style.background = "url('spritesheet/items.png') -" + d.sourceX + "px -" + d.sourceY + "px";
        this.nameElements[b].innerHTML = getHighlightedItemName(c);
        this.rarityElements[b].className = getRarityClass(c.getRarity());
        this.rarityElements[b].innerHTML = " (" + getItemRarityLabel(c) + ")";
      }
    }
  };
  EquipmentSetDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var a = this.tableElement.insertRow(0).insertCell(0);
    a.colSpan = 2;
    a.style.textAlign = "left";
    a.innerHTML = "装备所有道具升级";
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
  SkillUpgradeDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getTitle(),
      b = this.upgrade.getDescription();
    if (this.cachedTitleText !== a) {
      this.cachedTitleText = a;
      this.titleElement.innerHTML = a;
    }
    if (this.cachedDescriptionText !== b) {
      this.cachedDescriptionText = b;
      this.descriptionElement.innerHTML = b;
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
  SpellUpgradeDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getSpell();
    if (this.cachedSpell !== a) {
      this.cachedSpell = a;
      var b = a.spellCategoryId;
      if (10 === b || 9 === b || 17 === b || 11 === b) {
        a = minionsBySpell[a.name].spriteName;
        this.assetSource = game.monsterSprites;
        this.asset = game.monsterSprites.getSprite(a);
        this.isAnimated = false;
        this.spellImage.style.background = "url('spritesheet/monsters.png') -" + (this.asset.sourceX + 10) + "px -" + (this.asset.sourceY + 12) + "px";
      } else {
        a = a.impactEffectName;
        this.assetSource = game.animations.animationMap[a];
        this.asset = game.animations.getAnimation(a);
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
        if (this.frameIndex >= this.asset.To()) {
          this.frameIndex = 0;
        }
        a = this.asset.frames[this.frameIndex];
        this.spellImage.style.background = "url('" + this.assetSource.fileName + "') -" + a.frameSourceX + "px -" + a.frameSourceY + "px";
      }
    }
  };
  SpellUpgradeDetails.prototype.createDomElements = function () {
    this.table = createElement("table", this.contentContainer, null, null);
    this.table.style.width = "100%";
    this.table.style.height = "60px";
    var a = this.table.insertRow(0),
      b = this.table.insertRow(1),
      c = a.insertCell(0),
      a = a.insertCell(1);
    c.style.width = "29px";
    c.style.height = "29px";
    c.style.textAlign = "center";
    a.style.width = "180px";
    a.style.textAlign = "left";
    this.spellImage = createElement("img", c, null, null);
    this.spellImage.src = "images/Transparent.gif";
    this.spellImage.style.width = "29px";
    this.spellImage.style.height = "29px";
    this.actionLabel = createElement("span", a, null, null);
    this.actionLabel.style.paddingTop = "5px";
    this.actionLabel.style.textAlign = "left";
    b = b.insertCell(0);
    b.colSpan = 2;
    b.style.textAlign = "left";
    this.descriptionLabel = createElement("span", b, null, null);
    this.descriptionLabel.style.paddingTop = "5px";
  };
  MonsterLevelDetails.prototype.getUpgradeType = function () {
    return 7;
  };
  MonsterLevelDetails.prototype.reset = function () {
    this.cachedCostValue = -1;
    this.cachedTitleText = this.cachedDescriptionText = null;
  };
  MonsterLevelDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getCost(),
      b = this.upgrade.getTitle(),
      c = this.upgrade.getDescription();
    if (this.cachedCostValue !== a) {
      this.cachedCostValue = a;
      this.costLabel.innerHTML = formatAmount(a);
    }
    if (this.cachedTitleText !== b) {
      this.cachedTitleText = b;
      this.titleLabel.innerHTML = b;
    }
    if (this.cachedDescriptionText !== c) {
      this.cachedDescriptionText = c;
      this.descriptionLabel.innerHTML = c;
    }
  };
  MonsterLevelDetails.prototype.createDomElements = function () {
    this.tableContainer = createElement("div", this.contentContainer, null, null);
    this.tableContainer.style.position = "relative";
    this.tableContainer.style.height = "30px";
    this.descriptionContainer = createElement("div", this.contentContainer, null, null);
    this.descriptionContainer.style.position = "relative";
    this.descriptionContainer.style.height = "30px";
    var a = createElement("div", this.tableContainer, null, null);
    a.style.position = "absolute";
    a.style.right = "3px";
    a.style.top = "0";
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
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
  DungeonPurchaseDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getCost(),
      b = this.upgrade.getDungeon();
    if (this.cachedCostValue !== a) {
      this.cachedCostValue = a;
      this.costElement.innerHTML = formatAmount(a);
    }
    if (this.selectedDungeon !== b && (this.selectedDungeon = b)) {
      a = game.terrainSprites.getSprite(b.mapSprite);
      this.previewImageElement.style.background = "url('spritesheet/terrain.png') -" + a.sourceX + "px -" + a.sourceY + "px";
      this.labelCell.innerHTML = b.dungeonName;
    }
  };
  DungeonPurchaseDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var a = this.tableElement.insertRow(0),
      b = this.tableElement.insertRow(1),
      c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.previewImageElement = createElement("img", c, null, null);
    this.previewImageElement.src = "images/Transparent.gif";
    this.previewImageElement.style.width = "50px";
    this.previewImageElement.style.height = "50px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    this.titleElement = createElement("span", c, null, null);
    this.titleElement.innerHTML = this.upgrade.getTitle();
    c = a.insertCell(2);
    this.costElement = createElement("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = createElement("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.labelCell = b.insertCell(0);
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
  ScrollUpgradeDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getCost(),
      b = this.upgrade.getScrollItem(),
      c = this.upgrade.getTitle(),
      d = this.upgrade.getDescription();
    if (this.cachedCostValue !== a) {
      this.cachedCostValue = a;
      this.costElement.innerHTML = formatAmount(a);
    }
    if (this.cachedScroll !== b && (this.cachedScroll = b)) {
      a = b.spriteName;
      this.scrollImage.style.background = "url('spritesheet/items.png') -" + a.sourceX + "px -" + a.sourceY + "px";
    }
    if (this.cachedTitleText !== c) {
      this.cachedTitleText = c;
      this.titleCell.innerHTML = c;
    }
    if (this.cachedDescriptionText !== d) {
      this.cachedDescriptionText = d;
      this.titleElement.innerHTML = this.upgrade.getDescription();
    }
  };
  ScrollUpgradeDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var a = this.tableElement.insertRow(0),
      b = this.tableElement.insertRow(1),
      c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "30px";
    c.style.height = "30px";
    c.style.textAlign = "center";
    this.scrollImage = createElement("img", c, null, null);
    this.scrollImage.src = "images/Transparent.gif";
    this.scrollImage.style.width = "30px";
    this.scrollImage.style.height = "30px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    this.titleElement = createElement("span", c, null, null);
    this.titleElement.innerHTML = this.upgrade.getTitle();
    c = a.insertCell(2);
    this.costElement = createElement("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = createElement("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.titleCell = b.insertCell(0);
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
  CastlePurchaseDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = game.dungeons.pendingFarmKills;
    if (this.cachedRequiredLevel !== a) {
      this.cachedRequiredLevel = a;
      this.bonusLabel.innerHTML = "+" + formatAmount(a);
    }
  };
  CastlePurchaseDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var a = this.tableElement.insertRow(0),
      b = this.tableElement.insertRow(1),
      c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.previewImageElement = createElement("img", c, null, null);
    this.previewImageElement.src = "images/Transparent.gif";
    this.previewImageElement.style.width = "50px";
    this.previewImageElement.style.height = "50px";
    c = game.terrainSprites.getSprite("L2_DungeonE.PNG");
    this.previewImageElement.style.background = "url('spritesheet/terrain.png') -" + c.sourceX + "px -" + c.sourceY + "px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    c.style.width = "150px";
    this.titleElement = createElement("span", c, null, null);
    this.titleElement.innerHTML = this.upgrade ? this.upgrade.getTitle() : "收获地牢";
    c = a.insertCell(2);
    this.bonusLabel = createElement("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = createElement("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    b = b.insertCell(0);
    b.colSpan = 3;
    b.style.textAlign = "left";
    b.innerHTML = this.upgrade ? this.upgrade.getDescription() : "收集杀戮农场";
  };
  FarmUpgradeDetails.prototype.getUpgradeType = function () {
    return 10;
  };
  FarmUpgradeDetails.prototype.reset = function () {
    this.cachedBonus = -1;
  };
  FarmUpgradeDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = game.shops.collectedGold;
    if (this.cachedBonus !== a) {
      this.cachedBonus = a;
      this.bonusLabel.innerHTML = "+" + formatAmount(a);
    }
  };
  FarmUpgradeDetails.prototype.createDomElements = function () {
    this.tableElement = createElement("table", this.contentContainer, null, null);
    this.tableElement.style.width = "100%";
    var a = this.tableElement.insertRow(0),
      b = this.tableElement.insertRow(1),
      c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.previewImageElement = createElement("img", c, null, null);
    this.previewImageElement.src = "images/Transparent.gif";
    this.previewImageElement.style.width = "50px";
    this.previewImageElement.style.height = "50px";
    c = game.terrainSprites.getSprite("L2_Terrain077.PNG");
    this.previewImageElement.style.background = "url('spritesheet/terrain.png') -" + c.sourceX + "px -" + c.sourceY + "px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    c.style.width = "150px";
    this.titleElement = createElement("span", c, null, null);
    this.titleElement.innerHTML = this.upgrade ? this.upgrade.getTitle() : "收集道具黄金";
    c = a.insertCell(2);
    this.bonusLabel = createElement("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = createElement("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    b = b.insertCell(0);
    b.colSpan = 3;
    b.style.textAlign = "left";
    b.innerHTML = this.upgrade ? this.upgrade.getDescription() : "卖掉道具得到黄金";
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
  CharacterLevelDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getCost(),
      b = this.upgrade.getTitle(),
      c = this.upgrade.getMonsterLevel();
    if (this.cachedCostValue != a) {
      this.cachedCostValue = a;
      this.costLabel.innerHTML = formatAmount(a);
    }
    if (this.cachedTitleText != b) {
      this.cachedTitleText = b;
      this.titleElement.innerHTML = b;
    }
    if (this.cachedLevel != c) {
      this.cachedLevel = c;
      a = Math.max(1, 10 * (this.cachedLevel - 1)) + 1;
      this.monsterHealth = scaleByLevel(a, monsterDamageCurve, 1);
      this.monsterSpirit = scaleByLevel(a, monsterArmorCurve, 1);
      this.monsterAttack = scaleByLevel(a, monsterAttackCurve, 1);
      this.monsterDefence = scaleByLevel(a, monsterDefenceCurve, 1);
      this.monsterDamageLabel.innerHTML = formatAmount(this.monsterHealth) + " 伤害";
      this.monsterArmorLabel.innerHTML = formatAmount(this.monsterSpirit) + " 护甲";
      this.monsterAttackLabel.innerHTML = formatAmount(this.monsterAttack) + " 攻击";
      this.monsterDefenceLabel.innerHTML = formatAmount(this.monsterDefence) + " 防御";
      c = getMonsterTypesForLevel(game.monsterCatalog, c);
      c = c[randomInt(c.length)].sprite;
      this.monsterPreviewImage.style.background = "url('spritesheet/monsters.png') -" + (c.sourceX + 10) + "px -" + (c.sourceY + 12) + "px";
    }
    for (var d, f = 0, g = 0, h = 0, l = 0, c = getPartyMinLevel(), a = this.upgrade.getMonsterLevel(), adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
      d = game.state.adventurers[adventurerIndex].stats;
      f += statValue(d.damage);
      g += statValue(d.armor);
      h += statValue(d.attackRating);
      l += statValue(d.defenceRating);
    }
    f = floorNumber(f / game.state.adventurers.length);
    g = floorNumber(g / game.state.adventurers.length);
    h = floorNumber(h / game.state.adventurers.length);
    l = floorNumber(l / game.state.adventurers.length);
    if (this.cachedPartyDamage !== f) {
      this.monsterArmorLabel.style.color = this.monsterSpirit >= f ? "#F00" : "#0A0";
      this.cachedPartyDamage = f;
    }
    if (this.cachedPartyArmor !== g) {
      this.monsterDamageLabel.style.color = this.monsterHealth >= g ? "#F00" : "#0A0";
      this.cachedPartyArmor = g;
    }
    if (this.cachedPartyAttackRating !== h) {
      this.monsterDefenceLabel.style.color = this.monsterDefence >= h ? "#F00" : "#0A0";
      this.cachedPartyAttackRating = h;
    }
    if (this.cachedPartyDefenceRating !== l) {
      this.monsterAttackLabel.style.color = this.monsterAttack >= l ? "#F00" : "#0A0";
      this.cachedPartyDefenceRating = l;
    }
    b = (f > this.monsterSpirit ? 1 : 0) + (g > this.monsterHealth ? 1 : 0) + (h > this.monsterDefence ? 1 : 0) + (l > this.monsterAttack ? 1 : 0);
    c = c < a ? "最低角色等级需求: " + a : 4 === b ? "评定: 小菜一碟" : 3 === b ? "评定: 有点挑战" : 2 === b ? "评定: 非常困难!" : "评定: 难如登天!";
    if (this.cachedAssessmentText !== c) {
      this.cachedAssessmentText = c;
      this.descriptionElement.innerHTML = c;
    }
  };
  CharacterLevelDetails.prototype.createDomElements = function () {
    this.table = createElement("table", this.contentContainer, null, null);
    this.table.style.width = "100%";
    var a = this.table.insertRow(0),
      b = this.table.insertRow(1),
      c = this.table.insertRow(2),
      d = a.insertCell(0),
      f = a.insertCell(1),
      a = a.insertCell(2),
      b = b.insertCell(0);
    d.style.width = "190px";
    f.style.width = "40px";
    f.style.textAlign = "right";
    f.style.paddingTop = "0";
    a.style.width = "30px";
    a.style.height = "30px";
    b.style.height = "20px";
    b.colSpan = 4;
    a = createElement("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.costLabel = createElement("span", f, null, null);
    this.costLabel.style.width = "40px";
    this.costLabel.style.height = "25px";
    this.titleElement = createElement("div", d, null, null);
    this.titleElement.style.textAlign = "left";
    this.descriptionElement = createElement("div", b, null, null);
    this.descriptionElement.style.textAlign = "left";
    c = c.insertCell(0);
    c.colSpan = 3;
    c = createElement("table", c, null, null);
    c.style.width = "100%";
    d = c.insertRow(0);
    c = c.insertRow(1);
    f = d.insertCell(0);
    b = d.insertCell(1);
    d = d.insertCell(2);
    f.rowSpan = 2;
    f.style.width = "30px";
    f.style.height = "30px";
    b.style.width = "100px";
    b.style.textAlign = "right";
    d.style.width = "100px";
    d.style.textAlign = "right";
    this.monsterPreviewImage = createElement("img", f, null, null);
    this.monsterPreviewImage.className = "characterImage";
    this.monsterPreviewImage.src = "images/Transparent.gif";
    this.monsterPreviewImage.style.height = "30px";
    this.monsterPreviewImage.style.width = "30px";
    this.monsterDamageLabel = createElement("span", b, null, null);
    this.monsterDamageLabel.style.marginLeft = "3px";
    this.monsterAttackLabel = createElement("span", d, null, null);
    this.monsterAttackLabel.style.marginLeft = "15px";
    d = c.insertCell(0);
    c = c.insertCell(1);
    d.style.width = "100px";
    d.style.textAlign = "right";
    c.style.width = "100px";
    c.style.textAlign = "right";
    this.monsterArmorLabel = createElement("span", d, null, null);
    this.monsterArmorLabel.style.marginLeft = "3px";
    this.monsterDefenceLabel = createElement("span", c, null, null);
    this.monsterDefenceLabel.style.marginLeft = "15px";
  };
  AchievementClaimDetails.prototype.getUpgradeType = function () {
    return 14;
  };
  AchievementClaimDetails.prototype.reset = function () {
    this.cachedTitleText = this.cachedDescriptionText = null;
  };
  AchievementClaimDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getTitle(),
      b = this.upgrade.getDescription();
    if (this.cachedTitleText !== a) {
      this.cachedTitleText = a;
      this.titleElement.innerHTML = a;
    }
    if (this.cachedDescriptionText !== b) {
      this.cachedDescriptionText = b;
      this.descriptionElement.innerHTML = b;
    }
  };
  AchievementClaimDetails.prototype.createDomElements = function () {
    var a = createElement("div", this.contentContainer, null, null);
    a.style.padding = "5px";
    a.style.color = "#FA0";
    a.style.fontWeight = "bold";
    a.innerHTML = "成就!";
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
  AchievementProgressDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getTitle(),
      b = this.upgrade.getDescription();
    if (this.cachedTitleText !== a) {
      this.cachedTitleText = a;
      this.titleElement.innerHTML = a;
    }
    if (this.cachedDescriptionText !== b) {
      this.cachedDescriptionText = b;
      this.descriptionElement.innerHTML = b;
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
  PointUpgradeDetails.prototype.attachUpgrade = function (a) {
    this.upgrade = a;
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
    var a = this.upgrade.getTitle(),
      b = this.upgrade.getDescription(),
      c = this.upgrade.getCost();
    if (this.cachedTitleText != a) {
      this.cachedTitleText = a;
      this.titleElement.innerHTML = a;
    }
    if (this.cachedDescriptionText != b) {
      this.cachedDescriptionText = b;
      this.descriptionElement.innerHTML = b;
    }
    if (this.cachedCostValue != c) {
      this.cachedCostValue = c;
      this.costLabel.innerHTML = formatGroupedAmount(c) + " AP";
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
    var a;
    for (a = 0; a < this.buttons.length; a++) {
      (/** @type {UpgradeButtonView & ActiveUpgradeButton} */ (/** @type {unknown} */ (this.buttons[a]))).reset();
    }
    var b = this.upgradeCollection.upgrades;
    for (a = 0; a < this.buttons.length; a++) {
      (/** @type {UpgradeButtonView & ActiveUpgradeButton} */ (/** @type {unknown} */ (this.buttons[a]))).attachUpgrade(b[a]);
    }
    this.cachedUpdateCounter = -100;
  };
  UpgradeListView.prototype.update = function () {
    var a;
    a = this.upgradeCollection.updateCounter;
    if (this.cachedUpdateCounter !== a) {
      this.cachedUpdateCounter = a;
      var b = this.upgradeCollection.upgrades;
      for (a = 0; a < this.buttons.length; a++) {
        (/** @type {UpgradeButtonView & ActiveUpgradeButton} */ (/** @type {unknown} */ (this.buttons[a]))).attachUpgrade(b[a]);
      }
    }
    for (a = 0; a < this.buttons.length; a++) {
      (/** @type {UpgradeButtonView & ActiveUpgradeButton} */ (/** @type {unknown} */ (this.buttons[a]))).render();
    }
  };
}
