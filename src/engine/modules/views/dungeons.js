/** 宝箱交互、地牢列表与状态。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { View, addChildView, resetChildViews, updateChildViews } from "./base.js";
import { appendHeaderCell, clearElement, clearElementById, createElement, getElement, hideElement, showElement } from "./dom.js";
import { game } from "../runtime/game.js";
import { getRoomTreasure } from "../loot/treasure.js";
import { PurchaseDungeonUpgrade, refreshUpgradeAvailability } from "../progression/upgrades.js";
import { UpgradeButtonView } from "./upgrade-details.js";
import { TabBar, TabState, TabView, addTab } from "./navigation.js";
import { GoldView } from "./resources.js";
export function TreasureLootView() {
  this.elementId = "treasureChestLootButtonPanel";
  this.visible = false;
  this.buttonLabel = "";
  this.messageCell = this.actionLabel = this.treasureImage = this.treasureChest = this.button = null;
}
export function mountTreasureLoot(treasureLootView) {
  var container = getElement(treasureLootView.elementId);
  if (container) {
    clearElement(container);
    treasureLootView.buttonLabel = treasureLootView.getButtonClass();
    treasureLootView.button = createElement("div", container, treasureLootView.elementId, treasureLootView.buttonLabel);
    treasureLootView.button.onmouseup = function () {
      if (treasureLootView.treasureChest && !treasureLootView.treasureChest.opened) {
        var treasureChest = treasureLootView.treasureChest;
        treasureChest.selected = true;
        game.state.party.setTargetTreasureChest(treasureChest);
      }
      return false;
    };
    var c = createElement("table", treasureLootView.button, null, null);
    c.style.width = "100%";
    var b = c.insertRow(0),
      c = c.insertRow(1),
      treasureImageCell = b.insertCell(0);
    treasureImageCell.rowSpan = 2;
    treasureImageCell.style.width = "50px";
    treasureImageCell.style.height = "50px";
    treasureImageCell.style.textAlign = "center";
    treasureLootView.treasureImage = createElement("img", treasureImageCell, null, null);
    treasureLootView.treasureImage.src = "images/Transparent.gif";
    treasureLootView.treasureImage.style.width = "50px";
    treasureLootView.treasureImage.style.height = "50px";
    b = b.insertCell(1);
    b.style.textAlign = "left";
    treasureLootView.actionLabel = createElement("span", b, null, null);
    treasureLootView.messageCell = c.insertCell(0);
    treasureLootView.messageCell.colSpan = 2;
    treasureLootView.messageCell.style.width = "200px";
    treasureLootView.messageCell.style.textAlign = "left";
  }
}
export function getVisibleTreasure() {
  if (!game.worldActive) {
    var adventurerIndex, treasureChest;
    for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
      if (treasureChest = getRoomTreasure(game.treasure, game.state.adventurers[adventurerIndex].position.room)) {
        return treasureChest;
      }
    }
  }
  return null;
}
export function DungeonRowView(rowElement, categoryId) {
  this.rowElement = rowElement;
  this.selectedDungeon = this.dungeon = null;
  this.dungeonUpgrade = new PurchaseDungeonUpgrade(this.dungeon);
  this.actionCell = this.descriptionCell = this.labelCell = this.labelCell = this.terrainImage = this.iconCell = null;
  this.actionCellId = "secureCell_" + categoryId + "_" + this.rowElement.rowIndex;
  this.upgradeButton = this.progressContainer = this.progressTextElement = this.progressFillElement = this.progressCell = this.progressBarCell = null;
  this.cachedCastleName = this.cachedDungeonName = this.cachedStatusText = "";
  this.cachedFarmProgress = this.cachedInvasionProgress = -1;
  this.showsProgress = false;
  this.columnWidth = 260;
  /** @type {{createRowCells: () => void}} */ (/** @type {unknown} */ (this)).createRowCells();
}
export function DungeonListView(tabState, categoryId, elementId) {
  this.elementId = elementId;
  this.tabState = tabState;
  this.categoryId = categoryId;
  this.tableElement = null;
  this.rowViews = [];
}
export function getDungeonList(dungeonListView) {
  switch (dungeonListView.categoryId) {
    case 0:
      return game.dungeons.discovered;
    case 1:
      return game.dungeons.attackable;
    case 2:
      return game.dungeons.cleared;
    case 3:
      return game.dungeons.farms;
    default:
      return game.dungeons.discovered;
  }
}
export function DungeonsView(tabState) {
  this.elementId = "dungeonsTabContent";
  this.tabState = tabState;
  this.discoveredTab = new TabState(getDungeonTabLabel(0, 0), true);
  this.infestedTab = new TabState(getDungeonTabLabel(1, 0), true);
  this.clearedTab = new TabState(getDungeonTabLabel(2, 0), true);
  this.farmedTab = new TabState(getDungeonTabLabel(3, 0), true);
  var tabBar = new TabBar("dungeonTabMenu");
  var discoveredListView = new DungeonListView(this.discoveredTab, 0, "discoveredDungeonsTableContainer"),
    infestedListView = new DungeonListView(this.infestedTab, 1, "infestedDungeonsTableContainer"),
    clearedListView = new DungeonListView(this.clearedTab, 2, "clearedDungeonsTableContainer"),
    farmedListView = new DungeonListView(this.farmedTab, 3, "farmedDungeonsTableContainer");
  this.discoveredTab.selected = true;
  addTab(tabBar, this.discoveredTab);
  addTab(tabBar, this.infestedTab);
  addTab(tabBar, this.clearedTab);
  addTab(tabBar, this.farmedTab);
  this.cachedFarmCount = this.cachedClearedCount = this.cachedAttackableCount = this.cachedDiscoveredCount = -1;
  addChildView(this, new GoldView(() => game.state.party.gold));
  addChildView(this, tabBar);
  addChildView(this, discoveredListView);
  addChildView(this, infestedListView);
  addChildView(this, clearedListView);
  addChildView(this, farmedListView);
}
export function getDungeonTabLabel(categoryId, dungeonCount) {
  return getDungeonStatusLabel(categoryId) + " (" + dungeonCount + ")";
}
export function getDungeonStatusLabel(categoryId) {
  switch (categoryId) {
    case 0:
      return "发现的地牢";
    case 1:
      return "探索中的地牢";
    case 2:
      return "清空的地牢";
    case 3:
      return "地牢农场";
    default:
      return "Error";
  }
}
export function initializeViewsDungeons() {
  TreasureLootView.prototype = new View();
  TreasureLootView.prototype.isVisible = function () {
    var visibleTreasure = getVisibleTreasure();
    return visibleTreasure && !visibleTreasure.opened;
  };
  TreasureLootView.prototype.reset = function () {
    this.treasureChest = null;
    mountTreasureLoot(this);
  };
  TreasureLootView.prototype.update = function () {
    if (!this.button) {
      mountTreasureLoot(this);
    }
    var visibleTreasure = getVisibleTreasure();
    if (visibleTreasure != this.treasureChest && (this.treasureChest = visibleTreasure)) {
      var treasureKind = this.treasureChest.kind;
      this.actionLabel.innerHTML = 1 === treasureKind ? "搜索财宝箱!" : 2 === treasureKind ? "搜索武器架!" : 3 === treasureKind ? "搜索书架!" : "搜索事物!";
      this.messageCell.innerHTML = "在房间内点击.";
      if (visibleTreasure) {
        var treasureSprite = visibleTreasure.opened ? visibleTreasure.openedSpriteName : visibleTreasure.closedSpriteName;
        this.treasureImage.style.background = "url('spritesheet/terrain.png') -" + treasureSprite.sourceX + "px -" + treasureSprite.sourceY + "px";
      }
    }
    var buttonClass = /** @type {{getButtonClass: () => string}} */ (/** @type {unknown} */ (this)).getButtonClass();
    if (this.buttonLabel !== buttonClass) {
      this.buttonLabel = buttonClass;
      this.button.className = buttonClass;
      if (visibleTreasure && visibleTreasure.selected) {
        this.messageCell.innerHTML = "正在搜索中...";
      }
    }
  };
  TreasureLootView.prototype.getButtonClass = function () {
    return !this.treasureChest || this.treasureChest.opened || this.treasureChest.selected ? "lootButtonDisabled centeredElement" : "lootButton centeredElement";
  };
  DungeonRowView.prototype.reset = function () {
    this.selectedDungeon = null;
    if (this.dungeon) {
      this.upgradeButton.reset();
    }
  };
  DungeonRowView.prototype.setDungeon = function (dungeon) {
    var hadNoDungeon = !this.dungeon;
    this.dungeon = dungeon;
    /** @type {{setDungeon: (dungeon: unknown) => void}} */ (/** @type {unknown} */ (this.dungeonUpgrade)).setDungeon(this.dungeon);
    this.upgradeButton.attachUpgrade(this.dungeonUpgrade);
    this.cachedFarmProgress = this.cachedInvasionProgress = -1;
    this.cachedCastleName = this.cachedDungeonName = this.cachedStatusText = "";
    if (hadNoDungeon) {
      this.upgradeButton.reset();
    }
  };
  DungeonRowView.prototype.createRowCells = function () {
    var rowElement = this.rowElement;
    this.iconCell = rowElement.insertCell(0);
    this.iconCell.style.width = "50px";
    this.iconCell.style.padding = "0";
    this.iconCell.style.textAlign = "center";
    this.terrainImage = createElement("img", this.iconCell, null, "terrainImage");
    this.terrainImage.src = "images/Transparent.gif";
    if (this.dungeon) {
      var mapSprite = game.terrainSprites.getSprite(this.dungeon.mapSprite);
      this.terrainImage.style.background = "url('spritesheet/terrain.png') -" + mapSprite.sourceX + "px -" + mapSprite.sourceY + "px";
    }
    this.labelCell = rowElement.insertCell(1);
    this.labelCell.style.width = "200px";
    this.labelCell = rowElement.insertCell(2);
    this.labelCell.style.width = "200px";
    this.descriptionCell = rowElement.insertCell(3);
    this.descriptionCell.style.width = "90px";
    this.actionCell = rowElement.insertCell(4);
    this.actionCell.style.width = "200px";
    this.actionCell.id = this.actionCellId;
    this.progressBarCell = rowElement.insertCell(5);
    this.progressBarCell.style.width = this.columnWidth + "px";
    this.upgradeButton = new UpgradeButtonView(this.actionCellId, this.dungeonUpgrade, this.rowElement.rowIndex, true);
    this.progressContainer = createElement("div", this.progressBarCell, null, null);
    this.progressContainer.style.position = "relative";
    this.progressContainer.style.border = "1px solid #2c2c50";
    this.progressContainer.style.height = "15px";
    this.progressContainer.style.width = this.columnWidth + "px";
    this.progressFillElement = createElement("div", this.progressContainer, null, null);
    this.progressFillElement.style.position = "absolute";
    this.progressFillElement.style.top = "0";
    this.progressFillElement.style.left = "0";
    this.progressFillElement.style.backgroundColor = "#F00";
    this.progressFillElement.style.height = "15px";
    this.progressFillElement.style.width = "0px";
    this.progressTextElement = createElement("div", this.progressContainer, null, null);
    this.progressTextElement.style.position = "absolute";
    this.progressTextElement.style.textAlign = "center";
    this.progressTextElement.style.top = "0";
    this.progressTextElement.style.left = "0";
    this.progressTextElement.style.height = "15px";
    this.progressTextElement.style.width = "100%";
    this.progressTextElement.style.zIndex = "10";
    this.showsProgress = true;
  };
  DungeonRowView.prototype.render = function () {
    if (this.dungeon) {
      var a = this.dungeon.discovered,
        isCleared = this.dungeon.cleared,
        dungeonName = this.dungeon.dungeonName,
        castleName = this.dungeon.region.castleName,
        isFarm = this.dungeon.isFarm,
        g;
      g = this.dungeon;
      g = g.isFarm ? g.cleared ? "等待中" : g.discovered && !g.cleared ? "收获中" : "收获" : g.cleared ? "已清空" : g.discovered && !g.cleared ? "探索中" : "已探索?";
      var h;
      h = this.dungeon;
      h = h.cleared ? Math.max(0, Math.min(100, 100 * (game.state.turnNumber - h.clearedTurn) / 1500 | 0)) : 0;
      var l;
      l = this.dungeon;
      l = l.cleared ? 0 : Math.max(0, Math.min(100, 100 * (game.state.turnNumber - l.farmStartTurn) / 1200 | 0));
      a = a && (isFarm || isCleared);
      if (this.selectedDungeon !== this.dungeon) {
        this.selectedDungeon = this.dungeon;
        var mapSprite = game.terrainSprites.getSprite(this.dungeon.mapSprite);
        this.terrainImage.style.background = "url('spritesheet/terrain.png') -" + mapSprite.sourceX + "px -" + mapSprite.sourceY + "px";
      }
      if (this.cachedDungeonName !== dungeonName) {
        this.cachedDungeonName = dungeonName;
        this.labelCell.innerHTML = dungeonName;
      }
      if (this.cachedCastleName !== castleName) {
        this.cachedCastleName = castleName;
        this.labelCell.innerHTML = castleName;
      }
      if (this.cachedStatusText !== g) {
        this.cachedStatusText = g;
        this.descriptionCell.innerHTML = g;
      }
      if (this.showsProgress !== a) {
        if (this.showsProgress = a) {
          showElement(this.progressContainer);
        } else {
          hideElement(this.progressContainer);
        }
      }
      if (a) {
        if (isCleared) {
          if (this.cachedInvasionProgress !== h) {
            this.cachedInvasionProgress = h;
            var progressFillWidth = h / 100 * this.columnWidth | 0;
            this.progressFillElement.style.width = progressFillWidth + "px";
            this.progressFillElement.style.backgroundColor = "#F00";
            this.progressTextElement.innerHTML = "地牢再次受到侵袭 " + h + "%";
          }
        } else {
          if (this.cachedFarmProgress !== l) {
            this.cachedFarmProgress = l;
            progressFillWidth = l / 100 * this.columnWidth | 0;
            this.progressFillElement.style.width = progressFillWidth + "px";
            this.progressFillElement.style.backgroundColor = "#080";
            this.progressTextElement.innerHTML = "收获地牢 " + l + "%";
          }
        }
      }
      if (this.dungeon) {
        refreshUpgradeAvailability(this.dungeonUpgrade);
        this.upgradeButton.render();
      }
    }
  };
  DungeonListView.prototype = new TabView();
  DungeonListView.prototype.reset = function () {
    this.rowViews.length = 0;
    clearElementById(this.elementId);
    this.tableElement = null;
  };
  DungeonListView.prototype.update = function () {
    if (!this.tableElement) {
      /** @type {{createDomElements: () => void}} */ (/** @type {unknown} */ (this)).createDomElements();
    }
    var dungeonList = getDungeonList(this);
    if (dungeonList.length !== this.rowViews.length) {
      /** @type {{setRowCount: (count: number) => void}} */ (/** @type {unknown} */ (this)).setRowCount(dungeonList.length);
    }
    var rowIndex;
    for (rowIndex = 0; rowIndex < this.rowViews.length; rowIndex++) {
      if (this.rowViews[rowIndex].dungeon !== dungeonList[rowIndex]) {
        this.rowViews[rowIndex].setDungeon(dungeonList[rowIndex]);
      }
      this.rowViews[rowIndex].render();
    }
  };
  DungeonListView.prototype.setRowCount = function (rowCount) {
    for (; this.rowViews.length > rowCount;) {
      this.tableElement.deleteRow(-1);
      this.rowViews.splice(this.rowViews.length - 1, 1);
    }
    for (; this.rowViews.length < rowCount;) {
      this.rowViews.push(new DungeonRowView(this.tableElement.insertRow(this.rowViews.length + 1), this.categoryId));
    }
  };
  DungeonListView.prototype.createDomElements = function () {
    var a = this.elementId;
    clearElementById(a);
    var dungeonList = getDungeonList(this),
      dungeonIndex;
    this.tableElement = createElement("table", getElement(a), null, "monsterTable");
    /** @type {{createHeaderRow: (row: HTMLTableRowElement) => void}} */ (/** @type {unknown} */ (this)).createHeaderRow(this.tableElement.insertRow(0));
    for (dungeonIndex = 0; dungeonIndex < dungeonList.length; dungeonIndex++) {
      a = new DungeonRowView(this.tableElement.insertRow(dungeonIndex + 1), this.categoryId);
      a.setDungeon(dungeonList[dungeonIndex]);
      this.rowViews.push(a);
    }
  };
  DungeonListView.prototype.createHeaderRow = function (headerRow) {
    appendHeaderCell(headerRow).innerHTML = "图标";
    appendHeaderCell(headerRow).innerHTML = "地牢";
    appendHeaderCell(headerRow).innerHTML = "城堡";
    appendHeaderCell(headerRow).innerHTML = "状态";
    appendHeaderCell(headerRow).innerHTML = "收获";
    appendHeaderCell(headerRow).innerHTML = "倒计时";
  };
  DungeonsView.prototype = new TabView();
  DungeonsView.prototype.onGameWon = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  DungeonsView.prototype.onOfflineFinish = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
  };
  DungeonsView.prototype.onOfflineStart = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  DungeonsView.prototype.reset = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
    resetChildViews(this);
  };
  DungeonsView.prototype.update = function () {
    var discoveredCount = game.dungeons.discovered.length,
      attackableCount = game.dungeons.attackable.length,
      clearedCount = game.dungeons.cleared.length,
      farmCount = game.dungeons.farms.length;
    if (this.cachedDiscoveredCount !== discoveredCount) {
      this.cachedDiscoveredCount = discoveredCount;
      this.discoveredTab.label = getDungeonTabLabel(0, discoveredCount);
    }
    if (this.cachedAttackableCount !== attackableCount) {
      this.cachedAttackableCount = attackableCount;
      this.infestedTab.label = getDungeonTabLabel(1, attackableCount);
    }
    if (this.cachedClearedCount !== clearedCount) {
      this.cachedClearedCount = clearedCount;
      this.clearedTab.label = getDungeonTabLabel(2, clearedCount);
    }
    if (this.cachedFarmCount !== farmCount) {
      this.cachedFarmCount = farmCount;
      this.farmedTab.label = getDungeonTabLabel(3, farmCount);
    }
    updateChildViews(this);
  };
}
