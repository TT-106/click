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
export function mountTreasureLoot(a) {
  var container = getElement(a.elementId);
  if (container) {
    clearElement(container);
    a.buttonLabel = a.getButtonClass();
    a.button = createElement("div", container, a.elementId, a.buttonLabel);
    a.button.onmouseup = function () {
      if (a.treasureChest && !a.treasureChest.opened) {
        var b = a.treasureChest;
        b.selected = true;
        game.state.party.setTargetTreasureChest(b);
      }
      return false;
    };
    var c = createElement("table", a.button, null, null);
    c.style.width = "100%";
    var b = c.insertRow(0),
      c = c.insertRow(1),
      d = b.insertCell(0);
    d.rowSpan = 2;
    d.style.width = "50px";
    d.style.height = "50px";
    d.style.textAlign = "center";
    a.treasureImage = createElement("img", d, null, null);
    a.treasureImage.src = "images/Transparent.gif";
    a.treasureImage.style.width = "50px";
    a.treasureImage.style.height = "50px";
    b = b.insertCell(1);
    b.style.textAlign = "left";
    a.actionLabel = createElement("span", b, null, null);
    a.messageCell = c.insertCell(0);
    a.messageCell.colSpan = 2;
    a.messageCell.style.width = "200px";
    a.messageCell.style.textAlign = "left";
  }
}
export function getVisibleTreasure() {
  if (!game.worldActive) {
    var a, b;
    for (a = 0; a < game.state.adventurers.length; a++) {
      if (b = getRoomTreasure(game.treasure, game.state.adventurers[a].position.room)) {
        return b;
      }
    }
  }
  return null;
}
export function DungeonRowView(a, b) {
  this.rowElement = a;
  this.selectedDungeon = this.dungeon = null;
  this.dungeonUpgrade = new PurchaseDungeonUpgrade(this.dungeon);
  this.actionCell = this.descriptionCell = this.labelCell = this.labelCell = this.terrainImage = this.iconCell = null;
  this.actionCellId = "secureCell_" + b + "_" + this.rowElement.rowIndex;
  this.upgradeButton = this.progressContainer = this.progressTextElement = this.progressFillElement = this.progressCell = this.progressBarCell = null;
  this.cachedCastleName = this.cachedDungeonName = this.cachedStatusText = "";
  this.cachedFarmProgress = this.cachedInvasionProgress = -1;
  this.showsProgress = false;
  this.columnWidth = 260;
  /** @type {{createRowCells: () => void}} */ (/** @type {unknown} */ (this)).createRowCells();
}
export function DungeonListView(a, b, c) {
  this.elementId = c;
  this.tabState = a;
  this.categoryId = b;
  this.tableElement = null;
  this.rowViews = [];
}
export function getDungeonList(a) {
  switch (a.categoryId) {
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
export function DungeonsView(a) {
  this.elementId = "dungeonsTabContent";
  this.tabState = a;
  this.discoveredTab = new TabState(getDungeonTabLabel(0, 0), true);
  this.infestedTab = new TabState(getDungeonTabLabel(1, 0), true);
  this.clearedTab = new TabState(getDungeonTabLabel(2, 0), true);
  this.farmedTab = new TabState(getDungeonTabLabel(3, 0), true);
  a = new TabBar("dungeonTabMenu");
  var b = new DungeonListView(this.discoveredTab, 0, "discoveredDungeonsTableContainer"),
    c = new DungeonListView(this.infestedTab, 1, "infestedDungeonsTableContainer"),
    d = new DungeonListView(this.clearedTab, 2, "clearedDungeonsTableContainer"),
    f = new DungeonListView(this.farmedTab, 3, "farmedDungeonsTableContainer");
  this.discoveredTab.selected = true;
  addTab(a, this.discoveredTab);
  addTab(a, this.infestedTab);
  addTab(a, this.clearedTab);
  addTab(a, this.farmedTab);
  this.cachedFarmCount = this.cachedClearedCount = this.cachedAttackableCount = this.cachedDiscoveredCount = -1;
  addChildView(this, new GoldView(() => game.state.party.gold));
  addChildView(this, a);
  addChildView(this, b);
  addChildView(this, c);
  addChildView(this, d);
  addChildView(this, f);
}
export function getDungeonTabLabel(a, b) {
  return getDungeonStatusLabel(a) + " (" + b + ")";
}
export function getDungeonStatusLabel(a) {
  switch (a) {
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
    var a = getVisibleTreasure();
    return a && !a.opened;
  };
  TreasureLootView.prototype.reset = function () {
    this.treasureChest = null;
    mountTreasureLoot(this);
  };
  TreasureLootView.prototype.update = function () {
    if (!this.button) {
      mountTreasureLoot(this);
    }
    var a = getVisibleTreasure();
    if (a != this.treasureChest && (this.treasureChest = a)) {
      var b = this.treasureChest.kind;
      this.actionLabel.innerHTML = 1 === b ? "搜索财宝箱!" : 2 === b ? "搜索武器架!" : 3 === b ? "搜索书架!" : "搜索事物!";
      this.messageCell.innerHTML = "在房间内点击.";
      if (a) {
        b = a.opened ? a.openedSpriteName : a.closedSpriteName;
        this.treasureImage.style.background = "url('spritesheet/terrain.png') -" + b.sourceX + "px -" + b.sourceY + "px";
      }
    }
    b = /** @type {{getButtonClass: () => string}} */ (/** @type {unknown} */ (this)).getButtonClass();
    if (this.buttonLabel !== b) {
      this.buttonLabel = b;
      this.button.className = b;
      if (a && a.selected) {
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
  DungeonRowView.prototype.setDungeon = function (a) {
    var b = !this.dungeon;
    this.dungeon = a;
    /** @type {{setDungeon: (dungeon: unknown) => void}} */ (/** @type {unknown} */ (this.dungeonUpgrade)).setDungeon(this.dungeon);
    this.upgradeButton.attachUpgrade(this.dungeonUpgrade);
    this.cachedFarmProgress = this.cachedInvasionProgress = -1;
    this.cachedCastleName = this.cachedDungeonName = this.cachedStatusText = "";
    if (b) {
      this.upgradeButton.reset();
    }
  };
  DungeonRowView.prototype.createRowCells = function () {
    var a = this.rowElement;
    this.iconCell = a.insertCell(0);
    this.iconCell.style.width = "50px";
    this.iconCell.style.padding = "0";
    this.iconCell.style.textAlign = "center";
    this.terrainImage = createElement("img", this.iconCell, null, "terrainImage");
    this.terrainImage.src = "images/Transparent.gif";
    if (this.dungeon) {
      var b = game.terrainSprites.getSprite(this.dungeon.mapSprite);
      this.terrainImage.style.background = "url('spritesheet/terrain.png') -" + b.sourceX + "px -" + b.sourceY + "px";
    }
    this.labelCell = a.insertCell(1);
    this.labelCell.style.width = "200px";
    this.labelCell = a.insertCell(2);
    this.labelCell.style.width = "200px";
    this.descriptionCell = a.insertCell(3);
    this.descriptionCell.style.width = "90px";
    this.actionCell = a.insertCell(4);
    this.actionCell.style.width = "200px";
    this.actionCell.id = this.actionCellId;
    this.progressBarCell = a.insertCell(5);
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
        b = this.dungeon.cleared,
        c = this.dungeon.dungeonName,
        d = this.dungeon.region.castleName,
        f = this.dungeon.isFarm,
        g;
      g = this.dungeon;
      g = g.isFarm ? g.cleared ? "等待中" : g.discovered && !g.cleared ? "收获中" : "收获" : g.cleared ? "已清空" : g.discovered && !g.cleared ? "探索中" : "已探索?";
      var h;
      h = this.dungeon;
      h = h.cleared ? Math.max(0, Math.min(100, 100 * (game.state.turnNumber - h.clearedTurn) / 1500 | 0)) : 0;
      var l;
      l = this.dungeon;
      l = l.cleared ? 0 : Math.max(0, Math.min(100, 100 * (game.state.turnNumber - l.farmStartTurn) / 1200 | 0));
      a = a && (f || b);
      if (this.selectedDungeon !== this.dungeon) {
        this.selectedDungeon = this.dungeon;
        f = game.terrainSprites.getSprite(this.dungeon.mapSprite);
        this.terrainImage.style.background = "url('spritesheet/terrain.png') -" + f.sourceX + "px -" + f.sourceY + "px";
      }
      if (this.cachedDungeonName !== c) {
        this.cachedDungeonName = c;
        this.labelCell.innerHTML = c;
      }
      if (this.cachedCastleName !== d) {
        this.cachedCastleName = d;
        this.labelCell.innerHTML = d;
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
        if (b) {
          if (this.cachedInvasionProgress !== h) {
            this.cachedInvasionProgress = h;
            b = h / 100 * this.columnWidth | 0;
            this.progressFillElement.style.width = b + "px";
            this.progressFillElement.style.backgroundColor = "#F00";
            this.progressTextElement.innerHTML = "地牢再次受到侵袭 " + h + "%";
          }
        } else {
          if (this.cachedFarmProgress !== l) {
            this.cachedFarmProgress = l;
            b = l / 100 * this.columnWidth | 0;
            this.progressFillElement.style.width = b + "px";
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
    var a = getDungeonList(this);
    if (a.length !== this.rowViews.length) {
      /** @type {{setRowCount: (count: number) => void}} */ (/** @type {unknown} */ (this)).setRowCount(a.length);
    }
    var b;
    for (b = 0; b < this.rowViews.length; b++) {
      if (this.rowViews[b].dungeon !== a[b]) {
        this.rowViews[b].setDungeon(a[b]);
      }
      this.rowViews[b].render();
    }
  };
  DungeonListView.prototype.setRowCount = function (a) {
    for (; this.rowViews.length > a;) {
      this.tableElement.deleteRow(-1);
      this.rowViews.splice(this.rowViews.length - 1, 1);
    }
    for (; this.rowViews.length < a;) {
      this.rowViews.push(new DungeonRowView(this.tableElement.insertRow(this.rowViews.length + 1), this.categoryId));
    }
  };
  DungeonListView.prototype.createDomElements = function () {
    var a = this.elementId;
    clearElementById(a);
    var b = getDungeonList(this),
      c;
    this.tableElement = createElement("table", getElement(a), null, "monsterTable");
    /** @type {{createHeaderRow: (row: HTMLTableRowElement) => void}} */ (/** @type {unknown} */ (this)).createHeaderRow(this.tableElement.insertRow(0));
    for (c = 0; c < b.length; c++) {
      a = new DungeonRowView(this.tableElement.insertRow(c + 1), this.categoryId);
      a.setDungeon(b[c]);
      this.rowViews.push(a);
    }
  };
  DungeonListView.prototype.createHeaderRow = function (a) {
    appendHeaderCell(a).innerHTML = "图标";
    appendHeaderCell(a).innerHTML = "地牢";
    appendHeaderCell(a).innerHTML = "城堡";
    appendHeaderCell(a).innerHTML = "状态";
    appendHeaderCell(a).innerHTML = "收获";
    appendHeaderCell(a).innerHTML = "倒计时";
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
    var a = game.dungeons.discovered.length,
      b = game.dungeons.attackable.length,
      c = game.dungeons.cleared.length,
      d = game.dungeons.farms.length;
    if (this.cachedDiscoveredCount !== a) {
      this.cachedDiscoveredCount = a;
      this.discoveredTab.label = getDungeonTabLabel(0, a);
    }
    if (this.cachedAttackableCount !== b) {
      this.cachedAttackableCount = b;
      this.infestedTab.label = getDungeonTabLabel(1, b);
    }
    if (this.cachedClearedCount !== c) {
      this.cachedClearedCount = c;
      this.clearedTab.label = getDungeonTabLabel(2, c);
    }
    if (this.cachedFarmCount !== d) {
      this.cachedFarmCount = d;
      this.farmedTab.label = getDungeonTabLabel(3, d);
    }
    updateChildViews(this);
  };
}
