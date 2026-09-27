/** 角色属性、技能、背包和装备界面。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { getHighlightedItemName, getItemRarityLabel, getItemStatLabel } from "../loot/items.js";
import { formatAmount } from "../core/math.js";
import { game } from "../runtime/game.js";
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
export function InventoryItemView(a, b) {
  this.rowElement = a;
  this.adventurerIndex = b;
  this.equipButtonDiv = this.Cr = this.goldCell = this.valueCell = this.levelCell = this.rarityCell = this.nameLabel = this.descriptionLabel = this.item = null;
  (/** @type {InventoryItemView & { createRowCells: () => void }} */ (/** @type {unknown} */ (this))).createRowCells();
}
export function InventoryTableView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.adventurerIndex = b;
  this.inventoryTable = null;
  this.rowViews = [];
}
export function EquipmentItemRowView(a, b) {
  this.rowElement = a;
  this.adventurerIndex = b;
  this.Cr = this.goldCell = this.valueCell = this.levelCell = this.rarityCell = this.nameLabel = this.descriptionLabel = this.item = null;
  (/** @type {EquipmentItemRowView & { createRowCells: () => void }} */ (/** @type {unknown} */ (this))).createRowCells();
}
export function EquipmentTableView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.adventurerIndex = b;
  this.zm = null;
  this.rowViews = [];
}
export function EquipAllView(a) {
  this.elementId = "equipAllButtonContainer" + a;
  this.visible = true;
  this.adventurerIndex = a;
  this.Xq = false;
  this.gw = getElement("equipImprovements" + a);
  var b = this;
  this.gw.onclick = function () {
    (/** @type {EquipAllView & { equipBestForCharacter: () => void }} */ (/** @type {unknown} */ (b))).equipBestForCharacter();
    return false;
  };
}
export function InventoryTabView(a, b, c) {
  this.elementId = b;
  this.tabState = a;
  this.adventurerIndex = c;
  this.QD = "itemTableAdventurer" + c;
  this.mD = "adventurerEquippedItems" + c;
  this.nD = new EquipmentTableView(this.mD, c);
  this.inventoryTable = new InventoryTableView(this.QD, c);
  addChildView(this, this.nD);
  addChildView(this, new EquipAllView(c));
  addChildView(this, this.inventoryTable);
}
export function CharacterTabsView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.adventurerIndex = b;
  this.skillsTab = new TabState("技能", true);
  this.inventoryTab = new TabState("背包", true);
  this.skillsTab.selected = true;
  this.cachedHasUnspentSkills = false;
  var c = new TabBar("characterTabMenu" + this.adventurerIndex),
    d = new SkillsTabView(this.skillsTab, "characterSkillsContainer" + this.adventurerIndex, this.adventurerIndex),
    f = new InventoryTabView(this.inventoryTab, "characterInventoryContainer" + this.adventurerIndex, this.adventurerIndex);
  addTab(c, this.skillsTab);
  addTab(c, this.inventoryTab);
  addChildView(this, c);
  addChildView(this, d);
  addChildView(this, f);
}
export function CharacterSummaryView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.adventurerIndex = b;
  this.critChanceCell = this.extraAttackCell = this.attacksPerTurnCell = this.spellPenetrationCell = this.damageResistanceCell = this.damageReceivedCell = this.damageGivenCell = this.stunCountCell = this.petKillsCell = this.killsCell = this.spiritRegenCell = this.healthRegenCell = this.attackCooldownCell = this.spiritCell = this.healthCell = this.levelCell = this.tableElement = null;
  this.cachedExtraAttackChance = this.cachedAttacksPerTurn = this.cachedCritChance = this.cachedSpellCostReduction = this.cachedDamageResistance = this.cachedDamageReceived = this.cachedDamageGiven = this.cachedStunCount = this.cachedMinionKills = this.cachedKills = this.cachedSpiritRegenPercent = this.cachedHealthRegenPercent = this.cachedAttackCooldown = this.cachedSpirit = this.cachedHealth = this.cachedLevel = -1;
}
export function StatBreakdownView(a, b, c, d) {
  this.elementId = a;
  this.visible = true;
  this.statLabel = c;
  this.statIndex = d;
  this.adventurerIndex = b;
  this.spellBonusCell = this.skillBonusCell = this.levelValueCell = this.itemValueCell = this.statValueCell = this.tableElement = null;
  this.cachedSpellBonusPercent = this.cachedSkillBonusPercent = this.cachedLevelValue = this.cachedItemValue = this.cachedStatValue = -1;
}
export function getStatByIndex(a, b) {
  switch (b) {
    case 0:
      return a.damage;
    case 1:
      return a.armor;
    case 2:
      return a.attackRating;
    case 3:
      return a.defenceRating;
    case 4:
      return a.maxHealth;
    case 5:
      return a.maxSpirit;
  }
  return null;
}
export function CharacterAttributesView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.adventurerIndex = b;
  /** @type {CharacterSummaryView & ViewLifecycle} */
  this.bB = /** @type {CharacterSummaryView & ViewLifecycle} */ (/** @type {unknown} */ (new CharacterSummaryView(a, b)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.iz = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "伤害", 0)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.Gy = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "护甲", 1)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.Hy = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "攻击等级", 2)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.lz = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "防御等级", 3)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.vA = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "最大生命", 4)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.yA = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "最大法力", 5)));
}
export function CharacterView(a, b, c) {
  this.elementId = b;
  this.tabState = a;
  this.adventurerIndex = c;
  a = new UpgradeCollection([[characterLevelUpgrades[c]]], false);
  addChildView(this, new CharacterAttributesView("characterPropertiesContainer" + c, c));
  addChildView(this, new UpgradeListView("characterLevelUpButtonContainer" + c, a, true));
  addChildView(this, new CharacterTabsView("characterTabContainer" + c, c));
}
export function mountCharacterView(a) {
  var hasAdventurer = a.adventurerIndex < game.state.adventurers.length,
    c = a.tabState;
  c.enabled = hasAdventurer;
  c.selected = false;
  if (hasAdventurer) {
    var adventurer = game.state.adventurers[a.adventurerIndex];
    a = a.tw(adventurer);
    var className = adventurer.classDefinition.shortName;
    if (0 < a) {
      c.label = className + " " + a;
      c.highlighted = true;
    } else {
      c.label = className;
      c.highlighted = false;
    }
  }
}
export function SkillsTabView(a, b, c) {
  this.elementId = b;
  this.tabState = a;
  this.adventurerIndex = c;
  this.ry = this.qy = this.skillTreeCollection = this.skillCollection = this.Ax = null;
  this.firstColumnButtons = [];
  this.secondColumnButtons = [];
  this.buttons = [];
  this.Pn = [];
}
export function initializeViewsCharacter() {
  ItemRowBase.prototype.reset = function () {};
  InventoryItemView.prototype = new ItemRowBase();
  InventoryItemView.prototype.render = function () {};
  InventoryItemView.prototype.onOfflineFinish = function () {};
  InventoryItemView.prototype.onOfflineStart = function () {};
  InventoryItemView.prototype.ux = function (a) {
    if (this.item = a) {
      var b = this.item.getIconSprite();
      this.descriptionLabel.style.background = "url('spritesheet/items.png') -" + b.sourceX + "px -" + b.sourceY + "px";
      this.nameLabel.innerHTML = getHighlightedItemName(this.item);
      this.rarityCell.innerHTML = getItemRarityLabel(this.item);
      this.levelCell.innerHTML = this.item.itemLevel + "";
      this.goldCell.innerHTML = formatAmount(this.item.itemGold);
      this.valueCell.innerHTML = formatAmount(this.item.itemValue) + " " + getItemStatLabel(this.item);
      var c = game.state.adventurers[this.adventurerIndex],
        b = c.getSlotItem(a.slot);
      this.valueCell.className = b ? this.item.itemValue > b.itemValue ? "itemValueBetter" : this.item.itemValue < b.itemValue ? "itemValueWorse" : "" : "itemValueBetter";
      this.goldCell.className = b ? a.itemGold > b.itemGold ? "itemValueBetter" : a.itemGold < b.itemGold ? "itemValueWorse" : "" : "itemValueBetter";
      this.rarityCell.className = getRarityClass(this.item.getRarity());
      if (!b || this.item.itemValue > b.itemValue) {
        this.equipButtonDiv.style.display = "block";
        this.equipButtonDiv.onclick = function () {
          c.equipItem(a);
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
    var a = this.rowElement,
      b = a.insertCell(0);
    b.style.width = "50px";
    b.style.padding = "0";
    b.style.textAlign = "center";
    this.descriptionLabel = createElement("img", b, null, "itemImage");
    this.descriptionLabel.src = "images/Transparent.gif";
    this.nameLabel = a.insertCell(1);
    this.nameLabel.style.width = "250px";
    this.rarityCell = a.insertCell(2);
    this.rarityCell.style.width = "110px";
    this.rarityCell.style.textAlign = "center";
    this.levelCell = a.insertCell(3);
    this.levelCell.style.textAlign = "right";
    this.levelCell.style.paddingRight = "5px";
    this.levelCell.style.width = "60px";
    this.valueCell = a.insertCell(4);
    this.valueCell.style.width = "120px";
    this.goldCell = a.insertCell(5);
    this.goldCell.style.textAlign = "right";
    this.goldCell.style.paddingRight = "5px";
    this.goldCell.style.width = "70px";
    this.Cr = a.insertCell(6);
    this.Cr.style.width = "100px";
    this.equipButtonDiv = createElement("div", this.Cr, null, "equipButtonDiv");
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
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      if (!this.inventoryTable) {
        (/** @type {InventoryTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).createDomElements();
      }
      var a = game.state.adventurers[this.adventurerIndex].inventory.items;
      if (a.length !== this.rowViews.length) {
        (/** @type {InventoryTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).setRowCount(a.length);
      }
      var b;
      for (b = 0; b < this.rowViews.length; b++) {
        if (a[b] !== this.rowViews[b].item) {
          this.rowViews[b].ux(a[b]);
        }
      }
    }
  };
  InventoryTableView.prototype.setRowCount = function (a) {
    for (; this.rowViews.length > a;) {
      this.inventoryTable.deleteRow(-1);
      this.rowViews.splice(this.rowViews.length - 1, 1);
    }
    for (; this.rowViews.length < a;) {
      this.rowViews.push(new InventoryItemView(this.inventoryTable.insertRow(this.rowViews.length + 1), this.adventurerIndex));
    }
  };
  InventoryTableView.prototype.createDomElements = function () {
    var a = this.elementId;
    clearElementById(a);
    this.inventoryTable = createElement("table", getElement(a), null, "monsterTable");
    (/** @type {InventoryTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).createHeaderRow(this.inventoryTable.insertRow(0));
  };
  InventoryTableView.prototype.createHeaderRow = function (a) {
    var b = appendHeaderCell(a);
    b.style.textAlign = "center";
    b.style.padding = "0";
    b.innerHTML = "图标";
    appendHeaderCell(a).innerHTML = "道具名称";
    b = appendHeaderCell(a);
    b.style.textAlign = "center";
    b.innerHTML = "稀有度";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "等级";
    b = appendHeaderCell(a);
    b.style.textAlign = "left";
    b.style.paddingRight = "5px";
    b.innerHTML = "效果";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "黄金";
    a = appendHeaderCell(a);
    a.style.textAlign = "center";
    a.innerHTML = "装备";
  };
  EquipmentItemRowView.prototype = new ItemRowBase();
  EquipmentItemRowView.prototype.render = function () {};
  EquipmentItemRowView.prototype.onOfflineFinish = function () {};
  EquipmentItemRowView.prototype.onOfflineStart = function () {};
  EquipmentItemRowView.prototype.ux = function (a) {
    if (this.item = a) {
      a = this.item.getIconSprite();
      this.descriptionLabel.style.background = "url('spritesheet/items.png') -" + a.sourceX + "px -" + a.sourceY + "px";
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
    var a = this.rowElement,
      b = a.insertCell(0);
    b.style.width = "50px";
    b.style.padding = "0";
    b.style.textAlign = "center";
    this.descriptionLabel = createElement("img", b, null, "itemImage");
    this.descriptionLabel.src = "images/Transparent.gif";
    this.nameLabel = a.insertCell(1);
    this.nameLabel.style.width = "280px";
    this.rarityCell = a.insertCell(2);
    this.rarityCell.style.width = "110px";
    this.rarityCell.style.textAlign = "center";
    this.levelCell = a.insertCell(3);
    this.levelCell.style.textAlign = "right";
    this.levelCell.style.paddingRight = "5px";
    this.levelCell.style.width = "70px";
    this.valueCell = a.insertCell(4);
    this.valueCell.style.width = "120px";
    this.goldCell = a.insertCell(5);
    this.goldCell.style.textAlign = "right";
    this.goldCell.style.paddingRight = "5px";
    this.goldCell.style.width = "80px";
  };
  EquipmentTableView.prototype = new View();
  EquipmentTableView.prototype.reset = function () {
    var a;
    for (a = 0; a < this.rowViews.length; a++) {
      this.rowViews[a].reset();
    }
    this.rowViews.length = 0;
    clearElementById(this.elementId);
    this.zm = null;
  };
  EquipmentTableView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      if (!this.zm) {
        (/** @type {EquipmentTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).createDomElements();
      }
      var a = game.state.adventurers[this.adventurerIndex],
        b = a.slotList;
      if (b.length !== this.rowViews.length) {
        (/** @type {EquipmentTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).setRowCount(b.length);
      }
      var c, d;
      for (c = 0; c < this.rowViews.length; c++) {
        d = a.getSlotItem(b[c]);
        if (d !== this.rowViews[c].item) {
          this.rowViews[c].ux(d);
        }
      }
    }
  };
  EquipmentTableView.prototype.setRowCount = function (a) {
    for (; this.rowViews.length > a;) {
      this.zm.deleteRow(-1);
      this.rowViews.splice(this.rowViews.length - 1, 1);
    }
    for (; this.rowViews.length < a;) {
      this.rowViews.push(new EquipmentItemRowView(this.zm.insertRow(this.rowViews.length + 1), this.adventurerIndex));
    }
  };
  EquipmentTableView.prototype.createDomElements = function () {
    var a = this.elementId;
    clearElementById(a);
    this.zm = createElement("table", getElement(a), null, "monsterTable");
    (/** @type {EquipmentTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).createHeaderRow(this.zm.insertRow(0));
  };
  EquipmentTableView.prototype.createHeaderRow = function (a) {
    var b = appendHeaderCell(a);
    b.style.textAlign = "center";
    b.style.padding = "0";
    b.innerHTML = "图标";
    appendHeaderCell(a).innerHTML = "道具名称";
    b = appendHeaderCell(a);
    b.style.textAlign = "center";
    b.innerHTML = "稀有度";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "等级";
    b = appendHeaderCell(a);
    b.style.textAlign = "left";
    b.style.paddingRight = "5px";
    b.innerHTML = "效果";
    a = appendHeaderCell(a);
    a.style.textAlign = "right";
    a.style.paddingRight = "5px";
    a.innerHTML = "黄金";
  };
  EquipAllView.prototype = new View();
  EquipAllView.prototype.reset = function () {};
  EquipAllView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      if ((/** @type {EquipAllView & { Wt: () => boolean }} */ (/** @type {unknown} */ (this))).Wt()) {
        if (!this.Xq) {
          this.Xq = true;
          this.gw.className = "upgradeButton";
        }
      } else {
        if (this.Xq) {
          this.Xq = false;
          this.gw.className = "disabledUpgradeButton";
        }
      }
    }
  };
  EquipAllView.prototype.equipBestForCharacter = function () {
    game.inventories.equipBestForCharacter(game.state.adventurers[this.adventurerIndex]);
  };
  EquipAllView.prototype.Wt = function () {
    return game.inventories.Wt(game.state.adventurers[this.adventurerIndex]);
  };
  InventoryTabView.prototype = new TabView();
  CharacterTabsView.prototype = new CompositeView();
  CharacterTabsView.prototype.update = function () {
    var a = game.state.adventurers[this.adventurerIndex],
      a = 0 < a.skillPoints && a.hasUnspentSkills;
    if (this.cachedHasUnspentSkills !== a) {
      this.cachedHasUnspentSkills = a;
      this.skillsTab.highlighted = a ? true : false;
    }
    updateChildViews(this);
  };
  CharacterSummaryView.prototype = new View();
  CharacterSummaryView.prototype.reset = function () {
    this.cachedExtraAttackChance = this.cachedAttacksPerTurn = this.cachedCritChance = this.cachedSpellCostReduction = this.cachedDamageResistance = this.cachedDamageReceived = this.cachedDamageGiven = this.cachedStunCount = this.cachedMinionKills = this.cachedKills = this.cachedSpiritRegenPercent = this.cachedHealthRegenPercent = this.cachedAttackCooldown = this.cachedSpirit = this.cachedHealth = this.cachedLevel = -1;
    var a = 0;
    this.tableElement = createElement("table", getElement(this.elementId), null, "characteristicsTable");
    this.levelCell = appendAttributeRow(this.tableElement, "等级:", a++);
    this.healthCell = appendAttributeRow(this.tableElement, "生命:", a++);
    this.spiritCell = appendAttributeRow(this.tableElement, "法力:", a++);
    this.healthRegenCell = appendAttributeRow(this.tableElement, "生命回复:", a++);
    this.spiritRegenCell = appendAttributeRow(this.tableElement, "法力回复:", a++);
    this.killsCell = appendAttributeRow(this.tableElement, "杀死:", a++);
    this.petKillsCell = appendAttributeRow(this.tableElement, "宠物杀死:", a++);
    this.stunCountCell = appendAttributeRow(this.tableElement, "昏迷次数:", a++);
    this.damageGivenCell = appendAttributeRow(this.tableElement, "输出伤害:", a++);
    this.damageReceivedCell = appendAttributeRow(this.tableElement, "受到伤害:", a++);
    this.damageResistanceCell = appendAttributeRow(this.tableElement, "伤害抵抗:", a++);
    this.spellPenetrationCell = appendAttributeRow(this.tableElement, "法术忽视:", a++);
    this.critChanceCell = appendAttributeRow(this.tableElement, "暴击几率:", a++);
    this.attackCooldownCell = appendAttributeRow(this.tableElement, "冷却回合:", a++);
    this.attacksPerTurnCell = appendAttributeRow(this.tableElement, "每回合攻击次数:", a++);
    this.extraAttackCell = appendAttributeRow(this.tableElement, "额外攻击:", a);
  };
  CharacterSummaryView.prototype.update = function () {
    var a = game.state.adventurers[this.adventurerIndex].stats,
      b = a.characterLevel,
      c = a.health,
      d = a.spirit,
      f = getAttackCooldown(a, true),
      g = a.baseHealthRegenPercent + a.healthRegenBonus + healthRegenerationBonus.currentValue,
      h = a.baseSpiritRegenPercent + a.spiritRegenBonus + spiritRegenerationBonus.currentValue,
      l = a.kills,
      n = a.minionKills,
      p = a.stunCount,
      s = a.damageGiven,
      u = a.damageReceived,
      y = a.wo,
      A = a.spellCostReduction,
      C = a.lm,
      v = 1 + a.extraAttackCount,
      a = 0 < a.extraAttackCount ? a.extraAttackChance : 0;
    if (this.cachedLevel !== b) {
      this.cachedLevel = b;
      this.levelCell.innerHTML = b + "";
    }
    if (this.cachedHealth !== c) {
      this.cachedHealth = c;
      this.healthCell.innerHTML = formatAmount(c);
    }
    if (this.cachedSpirit !== d) {
      this.cachedSpirit = d;
      this.spiritCell.innerHTML = formatAmount(d);
    }
    if (this.cachedAttackCooldown !== f) {
      this.cachedAttackCooldown = f;
      this.attackCooldownCell.innerHTML = f + "";
    }
    if (this.cachedHealthRegenPercent !== g) {
      this.cachedHealthRegenPercent = g;
      this.healthRegenCell.innerHTML = g + "%";
    }
    if (this.cachedSpiritRegenPercent !== h) {
      this.cachedSpiritRegenPercent = h;
      this.spiritRegenCell.innerHTML = h + "%";
    }
    if (this.cachedKills !== l) {
      this.cachedKills = l;
      this.killsCell.innerHTML = formatAmount(l);
    }
    if (this.cachedMinionKills !== n) {
      this.cachedMinionKills = n;
      this.petKillsCell.innerHTML = formatAmount(n);
    }
    if (this.cachedStunCount !== p) {
      this.cachedStunCount = p;
      this.stunCountCell.innerHTML = formatAmount(p);
    }
    if (this.cachedDamageGiven !== s) {
      this.cachedDamageGiven = s;
      this.damageGivenCell.innerHTML = formatAmount(s);
    }
    if (this.cachedDamageReceived !== u) {
      this.cachedDamageReceived = u;
      this.damageReceivedCell.innerHTML = formatAmount(u);
    }
    if (this.cachedDamageResistance !== y) {
      this.cachedDamageResistance = y;
      this.damageResistanceCell.innerHTML = y + "%";
    }
    if (this.cachedSpellCostReduction !== A) {
      this.cachedSpellCostReduction = A;
      this.spellPenetrationCell.innerHTML = A + "%";
    }
    if (this.cachedCritChance !== C) {
      this.cachedCritChance = C;
      this.critChanceCell.innerHTML = C + "%";
    }
    if (this.cachedAttacksPerTurn != v) {
      this.cachedAttacksPerTurn = v;
      this.attacksPerTurnCell.innerHTML = v + "";
    }
    if (this.cachedExtraAttackChance != a) {
      this.cachedExtraAttackChance = a;
      this.extraAttackCell.innerHTML = a + "%";
    }
  };
  StatBreakdownView.prototype = new View();
  StatBreakdownView.prototype.reset = function () {
    this.cachedSpellBonusPercent = this.cachedSkillBonusPercent = this.cachedLevelValue = this.cachedItemValue = this.cachedStatValue = -1;
    this.tableElement = createElement("table", getElement(this.elementId), null, "characteristicsTable");
    var label = this.statLabel + ":",
      b = this.tableElement.insertRow(0),
      c = document.createElement("th");
    c.className = "characteristicsTableLabel";
    b.appendChild(c);
    c.innerHTML = label;
    var valueCell = document.createElement("th");
    valueCell.style.textAlign = "left";
    b.appendChild(valueCell);
    this.statValueCell = valueCell;
    this.itemValueCell = appendAttributeRow(this.tableElement, "道具加成:", 1);
    this.levelValueCell = appendAttributeRow(this.tableElement, "等级加成:", 2);
    this.skillBonusCell = appendAttributeRow(this.tableElement, "技能加成:", 3);
    this.spellBonusCell = appendAttributeRow(this.tableElement, "法术加成:", 4);
  };
  StatBreakdownView.prototype.update = function () {
    var a = getStatByIndex(game.state.adventurers[this.adventurerIndex].stats, this.statIndex),
      b = statValue(a),
      c = a.itemValue,
      d = a.levelValue,
      f = a.spellBonusPercent,
      a = a.skillBonusPercent;
    if (this.cachedStatValue !== b) {
      this.cachedStatValue = b;
      this.statValueCell.innerHTML = formatAmount(b);
    }
    if (this.cachedItemValue !== c) {
      this.cachedItemValue = c;
      this.itemValueCell.innerHTML = formatAmount(c);
    }
    if (this.cachedLevelValue !== d) {
      this.cachedLevelValue = d;
      this.levelValueCell.innerHTML = formatAmount(d);
    }
    if (this.cachedSpellBonusPercent !== f) {
      this.cachedSpellBonusPercent = f;
      this.spellBonusCell.innerHTML = formatAmount(f) + "%";
    }
    if (this.cachedSkillBonusPercent !== a) {
      this.cachedSkillBonusPercent = a;
      this.skillBonusCell.innerHTML = formatAmount(a) + "%";
    }
  };
  CharacterAttributesView.prototype = new View();
  CharacterAttributesView.prototype.reset = function () {
    clearElementById(this.elementId);
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      this.bB.reset();
      this.iz.reset();
      this.Gy.reset();
      this.Hy.reset();
      this.lz.reset();
      this.vA.reset();
      this.yA.reset();
    }
  };
  CharacterAttributesView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      this.bB.render();
      this.iz.render();
      this.Gy.render();
      this.Hy.render();
      this.lz.render();
      this.vA.render();
      this.yA.render();
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
  CharacterView.prototype.tw = function (a) {
    return a.hasUnspentSkills ? a.skillPoints + a.initialSpellSkillPoint : 0;
  };
  SkillsTabView.prototype = new TabView();
  SkillsTabView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.Ax = null;
    this.firstColumnButtons.length = 0;
    this.secondColumnButtons.length = 0;
    this.buttons.length = 0;
    this.Pn.length = 0;
    (/** @type {SkillsTabView & { Zn: () => void }} */ (/** @type {unknown} */ (this))).Zn();
    var a = this.elementId,
      b = getElement(a);
    if (b && !(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      if (this.skillCollection) {
        this.Ax = createElement("table", b, null, "adventurerSkillTreeTable");
        var skillUpgrades = this.skillCollection.upgrades,
          c = this.skillTreeCollection.upgrades,
          d = this.qy.upgrades,
          f = this.ry.upgrades,
          g = Math.max(skillUpgrades.length, Math.max(c.length, Math.max(d.length, f.length))),
          h,
          l,
          n,
          p,
          s;
        for (h = 0; h < g; h++) {
          l = this.Ax.insertRow(h);
          n = l.insertCell(0);
          p = l.insertCell(1);
          s = l.insertCell(2);
          l = l.insertCell(3);
          n.id = a + "_" + h + "_0";
          p.id = a + "_" + h + "_1";
          s.id = a + "_" + h + "_2";
          l.id = a + "_" + h + "_3";
          n.width = 150;
          p.width = 150;
          s.width = 150;
          l.width = 150;
          if (h < skillUpgrades.length) {
            this.firstColumnButtons.push(new UpgradeButtonView(n.id, skillUpgrades[h], h, true));
          }
          if (h < c.length) {
            this.secondColumnButtons.push(new UpgradeButtonView(p.id, c[h], h, true));
          }
          if (h < d.length) {
            this.buttons.push(new UpgradeButtonView(s.id, d[h], h, true));
          }
          if (h < f.length) {
            this.Pn.push(new UpgradeButtonView(l.id, f[h], h, true));
          }
        }
      } else {
        console.log("no upgrades configured for character");
      }
    }
    for (a = 0; a < this.firstColumnButtons.length; a++) {
      this.firstColumnButtons[a].reset();
    }
    for (a = 0; a < this.secondColumnButtons.length; a++) {
      this.secondColumnButtons[a].reset();
    }
    for (a = 0; a < this.buttons.length; a++) {
      this.buttons[a].reset();
    }
    for (a = 0; a < this.Pn.length; a++) {
      this.Pn[a].reset();
    }
  };
  SkillsTabView.prototype.Zn = function () {
    if (0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length) {
      this.ry = this.qy = this.skillTreeCollection = this.skillCollection = null;
    } else {
      var a = game.state.adventurers[this.adventurerIndex];
      this.skillCollection = a.skillTree1;
      this.skillTreeCollection = a.skillTree2;
      this.qy = a.skillTree3;
      this.ry = a.skillTree4;
    }
  };
  SkillsTabView.prototype.update = function () {
    var a;
    for (a = 0; a < this.firstColumnButtons.length; a++) {
      this.firstColumnButtons[a].render();
    }
    for (a = 0; a < this.secondColumnButtons.length; a++) {
      this.secondColumnButtons[a].render();
    }
    for (a = 0; a < this.buttons.length; a++) {
      this.buttons[a].render();
    }
    for (a = 0; a < this.Pn.length; a++) {
      this.Pn[a].render();
    }
  };
}
