import { spriteBackground } from '../rendering/preview.js';
/** 角色属性、技能、背包和装备界面。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { getHighlightedItemName, getItemRarityLabel, getItemStatLabel } from "../loot/items.js";
import { formatAmount } from "../core/math.js";
import { UpgradeButtonView, UpgradeListView, getRarityClass } from "./upgrade-details.js";
import { appendAttributeRow, appendHeaderCell, clearElementById, createElement, getElement } from "./dom.js";
import { CompositeView, View, addChildView, resetChildViews, updateChildViews } from "./base.js";
import { TabBar, TabState, TabView, addTab } from "./navigation.js";
import { getAttackCooldown, statValue } from "../characters/stats.js";
import { characterLevelUpgrades, healthRegenerationBonus, spiritRegenerationBonus } from "../content/balance.js";
import { UpgradeCollection } from "../progression/upgrades.js";
/** @typedef {{ reset: () => void, render: () => void }} ViewLifecycle */
/** @typedef {{ createDomElements: () => void, setRowCount: (rowCount: number) => void, createHeaderRow: (row: HTMLTableRowElement) => void }} TableLifecycle */
export function ItemRowBase() {}
export function InventoryItemView(rowElement, adventurerIndex) {
  this.rowElement = rowElement;
  this.adventurerIndex = adventurerIndex;
  this.equipButtonDiv = this.equipCell = this.goldCell = this.valueCell = this.levelCell = this.rarityCell = this.nameLabel = this.descriptionLabel = this.item = null;
  (/** @type {InventoryItemView & { createRowCells: () => void }} */ (/** @type {unknown} */ (this))).createRowCells();
}
export function InventoryTableView(elementId, adventurerIndex) {
  this.elementId = elementId;
  this.visible = true;
  this.adventurerIndex = adventurerIndex;
  this.inventoryTable = null;
  this.rowViews = [];
}
export function EquipmentItemRowView(rowElement, adventurerIndex) {
  this.rowElement = rowElement;
  this.adventurerIndex = adventurerIndex;
  this.equipCell = this.goldCell = this.valueCell = this.levelCell = this.rarityCell = this.nameLabel = this.descriptionLabel = this.item = null;
  (/** @type {EquipmentItemRowView & { createRowCells: () => void }} */ (/** @type {unknown} */ (this))).createRowCells();
}
export function EquipmentTableView(elementId, adventurerIndex) {
  this.elementId = elementId;
  this.visible = true;
  this.adventurerIndex = adventurerIndex;
  this.equipmentTable = null;
  this.rowViews = [];
}
export function EquipAllView(adventurerIndex) {
  this.elementId = "equipAllButtonContainer" + adventurerIndex;
  this.visible = true;
  this.adventurerIndex = adventurerIndex;
  this.equipAllEnabled = false;
  this.equipImprovementsButton = getElement("equipImprovements" + adventurerIndex);
  var self = this;
  this.equipImprovementsButton.onclick = function () {
    (/** @type {EquipAllView & { equipBestForCharacter: () => void }} */ (/** @type {unknown} */ (self))).equipBestForCharacter();
    return false;
  };
}
export function InventoryTabView(tabState, elementId, adventurerIndex) {
  this.elementId = elementId;
  this.tabState = tabState;
  this.adventurerIndex = adventurerIndex;
  this.inventoryTableElementId = "itemTableAdventurer" + adventurerIndex;
  this.equipmentTableElementId = "adventurerEquippedItems" + adventurerIndex;
  this.equipmentTableView = new EquipmentTableView(this.equipmentTableElementId, adventurerIndex);
  this.inventoryTable = new InventoryTableView(this.inventoryTableElementId, adventurerIndex);
  addChildView(this, this.equipmentTableView);
  addChildView(this, new EquipAllView(adventurerIndex));
  addChildView(this, this.inventoryTable);
}
export function CharacterTabsView(elementId, adventurerIndex) {
  this.elementId = elementId;
  this.visible = true;
  this.adventurerIndex = adventurerIndex;
  this.skillsTab = new TabState("技能", true);
  this.inventoryTab = new TabState("背包", true);
  this.skillsTab.selected = true;
  this.cachedHasUnspentSkills = false;
  var tabBar = new TabBar("characterTabMenu" + this.adventurerIndex),
    skillsTabView = new SkillsTabView(this.skillsTab, "characterSkillsContainer" + this.adventurerIndex, this.adventurerIndex),
    inventoryTabView = new InventoryTabView(this.inventoryTab, "characterInventoryContainer" + this.adventurerIndex, this.adventurerIndex);
  addTab(tabBar, this.skillsTab);
  addTab(tabBar, this.inventoryTab);
  addChildView(this, tabBar);
  addChildView(this, skillsTabView);
  addChildView(this, inventoryTabView);
}
export function CharacterSummaryView(elementId, adventurerIndex) {
  this.elementId = elementId;
  this.visible = true;
  this.adventurerIndex = adventurerIndex;
  this.critChanceCell = this.extraAttackCell = this.attacksPerTurnCell = this.spellPenetrationCell = this.damageResistanceCell = this.damageReceivedCell = this.damageGivenCell = this.stunCountCell = this.petKillsCell = this.killsCell = this.spiritRegenCell = this.healthRegenCell = this.attackCooldownCell = this.spiritCell = this.healthCell = this.levelCell = this.tableElement = null;
  this.cachedExtraAttackChance = this.cachedAttacksPerTurn = this.cachedCritChance = this.cachedSpellCostReduction = this.cachedDamageResistance = this.cachedDamageReceived = this.cachedDamageGiven = this.cachedStunCount = this.cachedMinionKills = this.cachedKills = this.cachedSpiritRegenPercent = this.cachedHealthRegenPercent = this.cachedAttackCooldown = this.cachedSpirit = this.cachedHealth = this.cachedLevel = -1;
}
export function StatBreakdownView(elementId, adventurerIndex, statLabel, statIndex) {
  this.elementId = elementId;
  this.visible = true;
  this.statLabel = statLabel;
  this.statIndex = statIndex;
  this.adventurerIndex = adventurerIndex;
  this.spellBonusCell = this.skillBonusCell = this.levelValueCell = this.itemValueCell = this.statValueCell = this.tableElement = null;
  this.cachedSpellBonusPercent = this.cachedSkillBonusPercent = this.cachedLevelValue = this.cachedItemValue = this.cachedStatValue = -1;
}
export function getStatByIndex(stats, statIndex) {
  switch (statIndex) {
    case 0:
      return stats.damage;
    case 1:
      return stats.armor;
    case 2:
      return stats.attackRating;
    case 3:
      return stats.defenceRating;
    case 4:
      return stats.maxHealth;
    case 5:
      return stats.maxSpirit;
  }
  return null;
}
export function CharacterAttributesView(elementId, adventurerIndex) {
  this.elementId = elementId;
  this.visible = true;
  this.adventurerIndex = adventurerIndex;
  /** @type {CharacterSummaryView & ViewLifecycle} */
  this.summaryView = /** @type {CharacterSummaryView & ViewLifecycle} */ (/** @type {unknown} */ (new CharacterSummaryView(elementId, adventurerIndex)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.damageView = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(elementId, adventurerIndex, "伤害", 0)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.armorView = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(elementId, adventurerIndex, "护甲", 1)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.attackRatingView = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(elementId, adventurerIndex, "攻击等级", 2)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.defenceRatingView = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(elementId, adventurerIndex, "防御等级", 3)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.maxHealthView = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(elementId, adventurerIndex, "最大生命", 4)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.maxSpiritView = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(elementId, adventurerIndex, "最大法力", 5)));
}
export function CharacterView(tabState, elementId, adventurerIndex) {
  this.elementId = elementId;
  this.tabState = tabState;
  this.adventurerIndex = adventurerIndex;
  var levelUpgradeCollection = new UpgradeCollection([[characterLevelUpgrades[adventurerIndex]]], false);
  addChildView(this, new CharacterAttributesView("characterPropertiesContainer" + adventurerIndex, adventurerIndex));
  addChildView(this, new UpgradeListView("characterLevelUpButtonContainer" + adventurerIndex, levelUpgradeCollection, true));
  addChildView(this, new CharacterTabsView("characterTabContainer" + adventurerIndex, adventurerIndex));
}
/** 角色面板所需的两个依赖由组合根注入（statistics / points / progression.achievements / views.monsters 已是同一形状）。
 *  绑的是 game.state 与 game.inventories 这两个**容器对象本身**：它们在 runtime/game.js 里只构造一次，
 *  src/ 内没有任何 `game.state =` 或 `.inventories =` 的整对象重赋值；字段级重置（adventurers.length 清零、装备改写）
 *  不影响容器身份，所以按引用绑定不会读到过期快照。未绑定就用到会立刻抛，装配漏一步不会退化成 undefined 属性读取。 */
var boundSessionState = null;
var boundInventories = null;
export function bindCharacterViews(state, inventories) {
  boundSessionState = state;
  boundInventories = inventories;
}
function characterViewState() {
  if (!boundSessionState) {
    throw new Error('角色面板尚未绑定会话状态：请在组合根调用 bindCharacterViews(game.state, game.inventories)');
  }
  return boundSessionState;
}
function characterInventories() {
  if (!boundInventories) {
    throw new Error('角色面板尚未绑定背包管理器：请在组合根调用 bindCharacterViews(game.state, game.inventories)');
  }
  return boundInventories;
}
export function mountCharacterView(view) {
  var hasAdventurer = view.adventurerIndex < characterViewState().adventurers.length,
    tabState = view.tabState;
  tabState.enabled = hasAdventurer;
  tabState.selected = false;
  if (hasAdventurer) {
    var adventurer = characterViewState().adventurers[view.adventurerIndex];
    var availableSkillPoints = view.getAvailableSkillPoints(adventurer);
    var className = adventurer.classDefinition.shortName;
    if (0 < availableSkillPoints) {
      tabState.label = className + " " + availableSkillPoints;
      tabState.highlighted = true;
    } else {
      tabState.label = className;
      tabState.highlighted = false;
    }
  }
}
export function SkillsTabView(tabState, elementId, adventurerIndex) {
  this.elementId = elementId;
  this.tabState = tabState;
  this.adventurerIndex = adventurerIndex;
  this.fourthSkillTree = this.thirdSkillTree = this.skillTreeCollection = this.skillCollection = this.skillTreeTableElement = null;
  this.firstColumnButtons = [];
  this.secondColumnButtons = [];
  this.buttons = [];
  this.fourthColumnButtons = [];
}
export function initializeViewsCharacter() {
  ItemRowBase.prototype.reset = function () {};
  InventoryItemView.prototype = new ItemRowBase();
  InventoryItemView.prototype.render = function () {};
  InventoryItemView.prototype.onOfflineFinish = function () {};
  InventoryItemView.prototype.onOfflineStart = function () {};
  InventoryItemView.prototype.setItem = function (item) {
    if (this.item = item) {
      var iconSprite = this.item.getIconSprite();
      this.descriptionLabel.style.background = spriteBackground(iconSprite, 'icon');
      this.nameLabel.innerHTML = getHighlightedItemName(this.item);
      this.rarityCell.innerHTML = getItemRarityLabel(this.item);
      this.levelCell.innerHTML = this.item.itemLevel + "";
      this.goldCell.innerHTML = formatAmount(this.item.itemGold);
      this.valueCell.innerHTML = formatAmount(this.item.itemValue) + " " + getItemStatLabel(this.item);
      var adventurer = characterViewState().adventurers[this.adventurerIndex],
        equippedItem = adventurer.getSlotItem(item.slot);
      this.valueCell.className = equippedItem ? this.item.itemValue > equippedItem.itemValue ? "itemValueBetter" : this.item.itemValue < equippedItem.itemValue ? "itemValueWorse" : "" : "itemValueBetter";
      this.goldCell.className = equippedItem ? item.itemGold > equippedItem.itemGold ? "itemValueBetter" : item.itemGold < equippedItem.itemGold ? "itemValueWorse" : "" : "itemValueBetter";
      this.rarityCell.className = getRarityClass(this.item.getRarity());
      if (!equippedItem || this.item.itemValue > equippedItem.itemValue) {
        this.equipButtonDiv.style.display = "block";
        this.equipButtonDiv.onclick = function () {
          adventurer.equipItem(item);
          return false;
        };
      } else {
        this.equipButtonDiv.style.display = "none";
      }
    } else {
      this.descriptionLabel.style.background = "";
      this.nameLabel.innerHTML = "";
      this.rarityCell.innerHTML = "";
      this.levelCell.innerHTML = "";
      this.valueCell.innerHTML = "";
      this.goldCell.className = "";
      this.equipButtonDiv.style.display = "none";
      this.equipButtonDiv.onclick = null;
      this.rarityCell.className = "";
    }
  };
  InventoryItemView.prototype.createRowCells = function () {
    var rowElement = this.rowElement,
      iconCell = rowElement.insertCell(0);
    iconCell.style.width = "50px";
    iconCell.style.padding = "0";
    iconCell.style.textAlign = "center";
    this.descriptionLabel = createElement("img", iconCell, null, "itemImage");
    this.descriptionLabel.src = "images/Transparent.gif";
    this.nameLabel = rowElement.insertCell(1);
    this.nameLabel.style.width = "250px";
    this.rarityCell = rowElement.insertCell(2);
    this.rarityCell.style.width = "110px";
    this.rarityCell.style.textAlign = "center";
    this.levelCell = rowElement.insertCell(3);
    this.levelCell.style.textAlign = "right";
    this.levelCell.style.paddingRight = "5px";
    this.levelCell.style.width = "60px";
    this.valueCell = rowElement.insertCell(4);
    this.valueCell.style.width = "120px";
    this.goldCell = rowElement.insertCell(5);
    this.goldCell.style.textAlign = "right";
    this.goldCell.style.paddingRight = "5px";
    this.goldCell.style.width = "70px";
    this.equipCell = rowElement.insertCell(6);
    this.equipCell.style.width = "100px";
    this.equipButtonDiv = createElement("div", this.equipCell, null, "equipButtonDiv");
    this.equipButtonDiv.innerHTML = "装备";
    this.equipButtonDiv.style.display = "none";
  };
  InventoryTableView.prototype = new View();
  InventoryTableView.prototype.reset = function () {
    this.rowViews.length = 0;
    clearElementById(this.elementId);
    this.inventoryTable = null;
  };
  InventoryTableView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= characterViewState().adventurers.length)) {
      if (!this.inventoryTable) {
        (/** @type {InventoryTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).createDomElements();
      }
      var items = characterViewState().adventurers[this.adventurerIndex].inventory.items;
      if (items.length !== this.rowViews.length) {
        (/** @type {InventoryTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).setRowCount(items.length);
      }
      var rowIndex;
      for (rowIndex = 0; rowIndex < this.rowViews.length; rowIndex++) {
        if (items[rowIndex] !== this.rowViews[rowIndex].item) {
          this.rowViews[rowIndex].setItem(items[rowIndex]);
        }
      }
    }
  };
  InventoryTableView.prototype.setRowCount = function (rowCount) {
    for (; this.rowViews.length > rowCount;) {
      this.inventoryTable.deleteRow(-1);
      this.rowViews.splice(this.rowViews.length - 1, 1);
    }
    for (; this.rowViews.length < rowCount;) {
      this.rowViews.push(new InventoryItemView(this.inventoryTable.insertRow(this.rowViews.length + 1), this.adventurerIndex));
    }
  };
  InventoryTableView.prototype.createDomElements = function () {
    var elementId = this.elementId;
    clearElementById(elementId);
    this.inventoryTable = createElement("table", getElement(elementId), null, "monsterTable");
    (/** @type {InventoryTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).createHeaderRow(this.inventoryTable.insertRow(0));
  };
  InventoryTableView.prototype.createHeaderRow = function (headerRow) {
    var iconHeaderCell = appendHeaderCell(headerRow);
    iconHeaderCell.style.textAlign = "center";
    iconHeaderCell.style.padding = "0";
    iconHeaderCell.innerHTML = "图标";
    appendHeaderCell(headerRow).innerHTML = "道具名称";
    var rarityHeaderCell = appendHeaderCell(headerRow);
    rarityHeaderCell.style.textAlign = "center";
    rarityHeaderCell.innerHTML = "稀有度";
    var levelHeaderCell = appendHeaderCell(headerRow);
    levelHeaderCell.style.textAlign = "right";
    levelHeaderCell.style.paddingRight = "5px";
    levelHeaderCell.innerHTML = "等级";
    var effectHeaderCell = appendHeaderCell(headerRow);
    effectHeaderCell.style.textAlign = "left";
    effectHeaderCell.style.paddingRight = "5px";
    effectHeaderCell.innerHTML = "效果";
    var goldHeaderCell = appendHeaderCell(headerRow);
    goldHeaderCell.style.textAlign = "right";
    goldHeaderCell.style.paddingRight = "5px";
    goldHeaderCell.innerHTML = "黄金";
    var equipHeaderCell = appendHeaderCell(headerRow);
    equipHeaderCell.style.textAlign = "center";
    equipHeaderCell.innerHTML = "装备";
  };
  EquipmentItemRowView.prototype = new ItemRowBase();
  EquipmentItemRowView.prototype.render = function () {};
  EquipmentItemRowView.prototype.onOfflineFinish = function () {};
  EquipmentItemRowView.prototype.onOfflineStart = function () {};
  EquipmentItemRowView.prototype.setItem = function (item) {
    if (this.item = item) {
      var iconSprite = this.item.getIconSprite();
      this.descriptionLabel.style.background = spriteBackground(iconSprite, 'icon');
      this.nameLabel.innerHTML = getHighlightedItemName(this.item);
      this.rarityCell.innerHTML = getItemRarityLabel(this.item);
      this.levelCell.innerHTML = this.item.itemLevel + "";
      this.valueCell.innerHTML = formatAmount(this.item.itemValue) + " " + getItemStatLabel(this.item);
      this.goldCell.innerHTML = formatAmount(this.item.itemGold);
      this.rarityCell.className = getRarityClass(this.item.getRarity());
    } else {
      this.descriptionLabel.style.background = "";
      this.nameLabel.innerHTML = "";
      this.rarityCell.innerHTML = "";
      this.levelCell.innerHTML = "";
      this.valueCell.innerHTML = "";
      this.goldCell.innerHTML = "";
      this.rarityCell.className = "";
    }
  };
  EquipmentItemRowView.prototype.createRowCells = function () {
    var rowElement = this.rowElement,
      iconCell = rowElement.insertCell(0);
    iconCell.style.width = "50px";
    iconCell.style.padding = "0";
    iconCell.style.textAlign = "center";
    this.descriptionLabel = createElement("img", iconCell, null, "itemImage");
    this.descriptionLabel.src = "images/Transparent.gif";
    this.nameLabel = rowElement.insertCell(1);
    this.nameLabel.style.width = "280px";
    this.rarityCell = rowElement.insertCell(2);
    this.rarityCell.style.width = "110px";
    this.rarityCell.style.textAlign = "center";
    this.levelCell = rowElement.insertCell(3);
    this.levelCell.style.textAlign = "right";
    this.levelCell.style.paddingRight = "5px";
    this.levelCell.style.width = "70px";
    this.valueCell = rowElement.insertCell(4);
    this.valueCell.style.width = "120px";
    this.goldCell = rowElement.insertCell(5);
    this.goldCell.style.textAlign = "right";
    this.goldCell.style.paddingRight = "5px";
    this.goldCell.style.width = "80px";
  };
  EquipmentTableView.prototype = new View();
  EquipmentTableView.prototype.reset = function () {
    var rowIndex;
    for (rowIndex = 0; rowIndex < this.rowViews.length; rowIndex++) {
      this.rowViews[rowIndex].reset();
    }
    this.rowViews.length = 0;
    clearElementById(this.elementId);
    this.equipmentTable = null;
  };
  EquipmentTableView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= characterViewState().adventurers.length)) {
      if (!this.equipmentTable) {
        (/** @type {EquipmentTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).createDomElements();
      }
      var adventurer = characterViewState().adventurers[this.adventurerIndex],
        slotList = adventurer.slotList;
      if (slotList.length !== this.rowViews.length) {
        (/** @type {EquipmentTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).setRowCount(slotList.length);
      }
      var rowIndex, equippedItem;
      for (rowIndex = 0; rowIndex < this.rowViews.length; rowIndex++) {
        equippedItem = adventurer.getSlotItem(slotList[rowIndex]);
        if (equippedItem !== this.rowViews[rowIndex].item) {
          this.rowViews[rowIndex].setItem(equippedItem);
        }
      }
    }
  };
  EquipmentTableView.prototype.setRowCount = function (rowCount) {
    for (; this.rowViews.length > rowCount;) {
      this.equipmentTable.deleteRow(-1);
      this.rowViews.splice(this.rowViews.length - 1, 1);
    }
    for (; this.rowViews.length < rowCount;) {
      this.rowViews.push(new EquipmentItemRowView(this.equipmentTable.insertRow(this.rowViews.length + 1), this.adventurerIndex));
    }
  };
  EquipmentTableView.prototype.createDomElements = function () {
    var elementId = this.elementId;
    clearElementById(elementId);
    this.equipmentTable = createElement("table", getElement(elementId), null, "monsterTable");
    (/** @type {EquipmentTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).createHeaderRow(this.equipmentTable.insertRow(0));
  };
  EquipmentTableView.prototype.createHeaderRow = function (headerRow) {
    var iconHeaderCell = appendHeaderCell(headerRow);
    iconHeaderCell.style.textAlign = "center";
    iconHeaderCell.style.padding = "0";
    iconHeaderCell.innerHTML = "图标";
    appendHeaderCell(headerRow).innerHTML = "道具名称";
    var rarityHeaderCell = appendHeaderCell(headerRow);
    rarityHeaderCell.style.textAlign = "center";
    rarityHeaderCell.innerHTML = "稀有度";
    var levelHeaderCell = appendHeaderCell(headerRow);
    levelHeaderCell.style.textAlign = "right";
    levelHeaderCell.style.paddingRight = "5px";
    levelHeaderCell.innerHTML = "等级";
    var effectHeaderCell = appendHeaderCell(headerRow);
    effectHeaderCell.style.textAlign = "left";
    effectHeaderCell.style.paddingRight = "5px";
    effectHeaderCell.innerHTML = "效果";
    var goldHeaderCell = appendHeaderCell(headerRow);
    goldHeaderCell.style.textAlign = "right";
    goldHeaderCell.style.paddingRight = "5px";
    goldHeaderCell.innerHTML = "黄金";
  };
  EquipAllView.prototype = new View();
  EquipAllView.prototype.reset = function () {};
  EquipAllView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= characterViewState().adventurers.length)) {
      if ((/** @type {EquipAllView & { hasImprovement: () => boolean }} */ (/** @type {unknown} */ (this))).hasImprovement()) {
        if (!this.equipAllEnabled) {
          this.equipAllEnabled = true;
          this.equipImprovementsButton.className = "upgradeButton";
        }
      } else {
        if (this.equipAllEnabled) {
          this.equipAllEnabled = false;
          this.equipImprovementsButton.className = "disabledUpgradeButton";
        }
      }
    }
  };
  EquipAllView.prototype.equipBestForCharacter = function () {
    characterInventories().equipBestForCharacter(characterViewState().adventurers[this.adventurerIndex]);
  };
  EquipAllView.prototype.hasImprovement = function () {
    return characterInventories().hasImprovement(characterViewState().adventurers[this.adventurerIndex]);
  };
  InventoryTabView.prototype = new TabView();
  CharacterTabsView.prototype = new CompositeView();
  CharacterTabsView.prototype.update = function () {
    var adventurer = characterViewState().adventurers[this.adventurerIndex],
      hasUnspentSkillPoints = 0 < adventurer.skillPoints && adventurer.hasUnspentSkills;
    if (this.cachedHasUnspentSkills !== hasUnspentSkillPoints) {
      this.cachedHasUnspentSkills = hasUnspentSkillPoints;
      this.skillsTab.highlighted = hasUnspentSkillPoints ? true : false;
    }
    updateChildViews(this);
  };
  CharacterSummaryView.prototype = new View();
  CharacterSummaryView.prototype.reset = function () {
    this.cachedExtraAttackChance = this.cachedAttacksPerTurn = this.cachedCritChance = this.cachedSpellCostReduction = this.cachedDamageResistance = this.cachedDamageReceived = this.cachedDamageGiven = this.cachedStunCount = this.cachedMinionKills = this.cachedKills = this.cachedSpiritRegenPercent = this.cachedHealthRegenPercent = this.cachedAttackCooldown = this.cachedSpirit = this.cachedHealth = this.cachedLevel = -1;
    var rowIndex = 0;
    this.tableElement = createElement("table", getElement(this.elementId), null, "characteristicsTable");
    this.levelCell = appendAttributeRow(this.tableElement, "等级:", rowIndex++);
    this.healthCell = appendAttributeRow(this.tableElement, "生命:", rowIndex++);
    this.spiritCell = appendAttributeRow(this.tableElement, "法力:", rowIndex++);
    this.healthRegenCell = appendAttributeRow(this.tableElement, "生命回复:", rowIndex++);
    this.spiritRegenCell = appendAttributeRow(this.tableElement, "法力回复:", rowIndex++);
    this.killsCell = appendAttributeRow(this.tableElement, "杀死:", rowIndex++);
    this.petKillsCell = appendAttributeRow(this.tableElement, "宠物杀死:", rowIndex++);
    this.stunCountCell = appendAttributeRow(this.tableElement, "昏迷次数:", rowIndex++);
    this.damageGivenCell = appendAttributeRow(this.tableElement, "输出伤害:", rowIndex++);
    this.damageReceivedCell = appendAttributeRow(this.tableElement, "受到伤害:", rowIndex++);
    this.damageResistanceCell = appendAttributeRow(this.tableElement, "伤害抵抗:", rowIndex++);
    this.spellPenetrationCell = appendAttributeRow(this.tableElement, "法术忽视:", rowIndex++);
    this.critChanceCell = appendAttributeRow(this.tableElement, "暴击几率:", rowIndex++);
    this.attackCooldownCell = appendAttributeRow(this.tableElement, "冷却回合:", rowIndex++);
    this.attacksPerTurnCell = appendAttributeRow(this.tableElement, "每回合攻击次数:", rowIndex++);
    this.extraAttackCell = appendAttributeRow(this.tableElement, "额外攻击:", rowIndex);
  };
  CharacterSummaryView.prototype.update = function () {
    var stats = characterViewState().adventurers[this.adventurerIndex].stats,
      characterLevel = stats.characterLevel,
      health = stats.health,
      spirit = stats.spirit,
      attackCooldown = getAttackCooldown(stats, true),
      healthRegenPercent = stats.baseHealthRegenPercent + stats.healthRegenBonus + healthRegenerationBonus.currentValue,
      spiritRegenPercent = stats.baseSpiritRegenPercent + stats.spiritRegenBonus + spiritRegenerationBonus.currentValue,
      kills = stats.kills,
      minionKills = stats.minionKills,
      stunCount = stats.stunCount,
      damageGiven = stats.damageGiven,
      damageReceived = stats.damageReceived,
      damageResistance = stats.damageResistance,
      spellCostReduction = stats.spellCostReduction,
      critChance = stats.critChance,
      attacksPerTurn = 1 + stats.extraAttackCount,
      extraAttackChance = 0 < stats.extraAttackCount ? stats.extraAttackChance : 0;
    if (this.cachedLevel !== characterLevel) {
      this.cachedLevel = characterLevel;
      this.levelCell.innerHTML = characterLevel + "";
    }
    if (this.cachedHealth !== health) {
      this.cachedHealth = health;
      this.healthCell.innerHTML = formatAmount(health);
    }
    if (this.cachedSpirit !== spirit) {
      this.cachedSpirit = spirit;
      this.spiritCell.innerHTML = formatAmount(spirit);
    }
    if (this.cachedAttackCooldown !== attackCooldown) {
      this.cachedAttackCooldown = attackCooldown;
      this.attackCooldownCell.innerHTML = attackCooldown + "";
    }
    if (this.cachedHealthRegenPercent !== healthRegenPercent) {
      this.cachedHealthRegenPercent = healthRegenPercent;
      this.healthRegenCell.innerHTML = healthRegenPercent + "%";
    }
    if (this.cachedSpiritRegenPercent !== spiritRegenPercent) {
      this.cachedSpiritRegenPercent = spiritRegenPercent;
      this.spiritRegenCell.innerHTML = spiritRegenPercent + "%";
    }
    if (this.cachedKills !== kills) {
      this.cachedKills = kills;
      this.killsCell.innerHTML = formatAmount(kills);
    }
    if (this.cachedMinionKills !== minionKills) {
      this.cachedMinionKills = minionKills;
      this.petKillsCell.innerHTML = formatAmount(minionKills);
    }
    if (this.cachedStunCount !== stunCount) {
      this.cachedStunCount = stunCount;
      this.stunCountCell.innerHTML = formatAmount(stunCount);
    }
    if (this.cachedDamageGiven !== damageGiven) {
      this.cachedDamageGiven = damageGiven;
      this.damageGivenCell.innerHTML = formatAmount(damageGiven);
    }
    if (this.cachedDamageReceived !== damageReceived) {
      this.cachedDamageReceived = damageReceived;
      this.damageReceivedCell.innerHTML = formatAmount(damageReceived);
    }
    if (this.cachedDamageResistance !== damageResistance) {
      this.cachedDamageResistance = damageResistance;
      this.damageResistanceCell.innerHTML = damageResistance + "%";
    }
    if (this.cachedSpellCostReduction !== spellCostReduction) {
      this.cachedSpellCostReduction = spellCostReduction;
      this.spellPenetrationCell.innerHTML = spellCostReduction + "%";
    }
    if (this.cachedCritChance !== critChance) {
      this.cachedCritChance = critChance;
      this.critChanceCell.innerHTML = critChance + "%";
    }
    if (this.cachedAttacksPerTurn != attacksPerTurn) {
      this.cachedAttacksPerTurn = attacksPerTurn;
      this.attacksPerTurnCell.innerHTML = attacksPerTurn + "";
    }
    if (this.cachedExtraAttackChance != extraAttackChance) {
      this.cachedExtraAttackChance = extraAttackChance;
      this.extraAttackCell.innerHTML = extraAttackChance + "%";
    }
  };
  StatBreakdownView.prototype = new View();
  StatBreakdownView.prototype.reset = function () {
    this.cachedSpellBonusPercent = this.cachedSkillBonusPercent = this.cachedLevelValue = this.cachedItemValue = this.cachedStatValue = -1;
    this.tableElement = createElement("table", getElement(this.elementId), null, "characteristicsTable");
    var label = this.statLabel + ":",
      headerRow = this.tableElement.insertRow(0),
      labelCell = document.createElement("th");
    labelCell.className = "characteristicsTableLabel";
    headerRow.appendChild(labelCell);
    labelCell.innerHTML = label;
    var valueCell = document.createElement("th");
    valueCell.style.textAlign = "left";
    headerRow.appendChild(valueCell);
    this.statValueCell = valueCell;
    this.itemValueCell = appendAttributeRow(this.tableElement, "道具加成:", 1);
    this.levelValueCell = appendAttributeRow(this.tableElement, "等级加成:", 2);
    this.skillBonusCell = appendAttributeRow(this.tableElement, "技能加成:", 3);
    this.spellBonusCell = appendAttributeRow(this.tableElement, "法术加成:", 4);
  };
  StatBreakdownView.prototype.update = function () {
    var stat = getStatByIndex(characterViewState().adventurers[this.adventurerIndex].stats, this.statIndex),
      totalStatValue = statValue(stat),
      itemValue = stat.itemValue,
      levelValue = stat.levelValue,
      spellBonusPercent = stat.spellBonusPercent,
      skillBonusPercent = stat.skillBonusPercent;
    if (this.cachedStatValue !== totalStatValue) {
      this.cachedStatValue = totalStatValue;
      this.statValueCell.innerHTML = formatAmount(totalStatValue);
    }
    if (this.cachedItemValue !== itemValue) {
      this.cachedItemValue = itemValue;
      this.itemValueCell.innerHTML = formatAmount(itemValue);
    }
    if (this.cachedLevelValue !== levelValue) {
      this.cachedLevelValue = levelValue;
      this.levelValueCell.innerHTML = formatAmount(levelValue);
    }
    if (this.cachedSpellBonusPercent !== spellBonusPercent) {
      this.cachedSpellBonusPercent = spellBonusPercent;
      this.spellBonusCell.innerHTML = formatAmount(spellBonusPercent) + "%";
    }
    if (this.cachedSkillBonusPercent !== skillBonusPercent) {
      this.cachedSkillBonusPercent = skillBonusPercent;
      this.skillBonusCell.innerHTML = formatAmount(skillBonusPercent) + "%";
    }
  };
  CharacterAttributesView.prototype = new View();
  CharacterAttributesView.prototype.reset = function () {
    clearElementById(this.elementId);
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= characterViewState().adventurers.length)) {
      this.summaryView.reset();
      this.damageView.reset();
      this.armorView.reset();
      this.attackRatingView.reset();
      this.defenceRatingView.reset();
      this.maxHealthView.reset();
      this.maxSpiritView.reset();
    }
  };
  CharacterAttributesView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= characterViewState().adventurers.length)) {
      this.summaryView.render();
      this.damageView.render();
      this.armorView.render();
      this.attackRatingView.render();
      this.defenceRatingView.render();
      this.maxHealthView.render();
      this.maxSpiritView.render();
    }
  };
  CharacterView.prototype = new TabView();
  CharacterView.prototype.onGameWon = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  CharacterView.prototype.onOfflineStart = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  CharacterView.prototype.onOfflineFinish = function () {
    mountCharacterView(this);
  };
  CharacterView.prototype.reset = function () {
    resetChildViews(this);
    mountCharacterView(this);
  };
  CharacterView.prototype.getAvailableSkillPoints = function (adventurer) {
    return adventurer.hasUnspentSkills ? adventurer.skillPoints + adventurer.initialSpellSkillPoint : 0;
  };
  SkillsTabView.prototype = new TabView();
  SkillsTabView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.skillTreeTableElement = null;
    this.firstColumnButtons.length = 0;
    this.secondColumnButtons.length = 0;
    this.buttons.length = 0;
    this.fourthColumnButtons.length = 0;
    (/** @type {SkillsTabView & { refreshCollections: () => void }} */ (/** @type {unknown} */ (this))).refreshCollections();
    var baseElementId = this.elementId,
      container = getElement(baseElementId);
    if (container && !(0 > this.adventurerIndex || this.adventurerIndex >= characterViewState().adventurers.length)) {
      if (this.skillCollection) {
        this.skillTreeTableElement = createElement("table", container, null, "adventurerSkillTreeTable");
        var skillUpgrades = this.skillCollection.upgrades,
          secondColumnUpgrades = this.skillTreeCollection.upgrades,
          thirdColumnUpgrades = this.thirdSkillTree.upgrades,
          fourthColumnUpgrades = this.fourthSkillTree.upgrades,
          rowCount = Math.max(skillUpgrades.length, Math.max(secondColumnUpgrades.length, Math.max(thirdColumnUpgrades.length, fourthColumnUpgrades.length))),
          rowIndex,
          row,
          firstColumnCell,
          secondColumnCell,
          thirdColumnCell;
        for (rowIndex = 0; rowIndex < rowCount; rowIndex++) {
          row = this.skillTreeTableElement.insertRow(rowIndex);
          firstColumnCell = row.insertCell(0);
          secondColumnCell = row.insertCell(1);
          thirdColumnCell = row.insertCell(2);
          var fourthColumnCell = row.insertCell(3);
          firstColumnCell.id = baseElementId + "_" + rowIndex + "_0";
          secondColumnCell.id = baseElementId + "_" + rowIndex + "_1";
          thirdColumnCell.id = baseElementId + "_" + rowIndex + "_2";
          fourthColumnCell.id = baseElementId + "_" + rowIndex + "_3";
          firstColumnCell.width = 150;
          secondColumnCell.width = 150;
          thirdColumnCell.width = 150;
          fourthColumnCell.width = 150;
          if (rowIndex < skillUpgrades.length) {
            this.firstColumnButtons.push(new UpgradeButtonView(firstColumnCell.id, skillUpgrades[rowIndex], rowIndex, true));
          }
          if (rowIndex < secondColumnUpgrades.length) {
            this.secondColumnButtons.push(new UpgradeButtonView(secondColumnCell.id, secondColumnUpgrades[rowIndex], rowIndex, true));
          }
          if (rowIndex < thirdColumnUpgrades.length) {
            this.buttons.push(new UpgradeButtonView(thirdColumnCell.id, thirdColumnUpgrades[rowIndex], rowIndex, true));
          }
          if (rowIndex < fourthColumnUpgrades.length) {
            this.fourthColumnButtons.push(new UpgradeButtonView(fourthColumnCell.id, fourthColumnUpgrades[rowIndex], rowIndex, true));
          }
        }
      } else {
        console.log("no upgrades configured for character");
      }
    }
    for (var buttonIndex = 0; buttonIndex < this.firstColumnButtons.length; buttonIndex++) {
      this.firstColumnButtons[buttonIndex].reset();
    }
    for (buttonIndex = 0; buttonIndex < this.secondColumnButtons.length; buttonIndex++) {
      this.secondColumnButtons[buttonIndex].reset();
    }
    for (buttonIndex = 0; buttonIndex < this.buttons.length; buttonIndex++) {
      this.buttons[buttonIndex].reset();
    }
    for (buttonIndex = 0; buttonIndex < this.fourthColumnButtons.length; buttonIndex++) {
      this.fourthColumnButtons[buttonIndex].reset();
    }
  };
  SkillsTabView.prototype.refreshCollections = function () {
    if (0 > this.adventurerIndex || this.adventurerIndex >= characterViewState().adventurers.length) {
      this.fourthSkillTree = this.thirdSkillTree = this.skillTreeCollection = this.skillCollection = null;
    } else {
      var adventurer = characterViewState().adventurers[this.adventurerIndex];
      this.skillCollection = adventurer.skillTree1;
      this.skillTreeCollection = adventurer.skillTree2;
      this.thirdSkillTree = adventurer.skillTree3;
      this.fourthSkillTree = adventurer.skillTree4;
    }
  };
  SkillsTabView.prototype.update = function () {
    var buttonIndex;
    for (buttonIndex = 0; buttonIndex < this.firstColumnButtons.length; buttonIndex++) {
      this.firstColumnButtons[buttonIndex].render();
    }
    for (buttonIndex = 0; buttonIndex < this.secondColumnButtons.length; buttonIndex++) {
      this.secondColumnButtons[buttonIndex].render();
    }
    for (buttonIndex = 0; buttonIndex < this.buttons.length; buttonIndex++) {
      this.buttons[buttonIndex].render();
    }
    for (buttonIndex = 0; buttonIndex < this.fourthColumnButtons.length; buttonIndex++) {
      this.fourthColumnButtons[buttonIndex].render();
    }
  };
}
