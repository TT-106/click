/** 城堡地图、列表与状态。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { canAttackCastle, findCastle } from "../world/regions.js";
import { game } from "../runtime/game.js";
import { View, addChildView, resetChildViews } from "./base.js";
import { appendHeaderCell, clearElementById, createElement, getElement } from "./dom.js";
import { TabView } from "./navigation.js";
export function getCastleStatusColor(castle) {
  return castle.regionLocked ? "#222" : castle.conquered ? "#080" : canAttackCastle(castle) ? game.monsterCatalog.maxUnlockedLevel >= castle.requiredMonsterLevel ? "#850" : "#A30" : castle.attackScheduled ? "#A80" : "#AAA";
}
export function CastleMapView() {
  this.elementId = "castleMapContainer";
  this.visible = true;
  this.tableElement = null;
  this.mapCells = [];
  this.cachedRevision = -1;
}
export function CastleTableView() {
  this.elementId = "castleTableContainer";
  this.visible = true;
  this.tableElement = null;
  this.rowViews = [];
}
export function CastleRowView(rowElement) {
  this.rowElement = rowElement;
  this.progressTextElement = this.progressFillElement = this.progressCell = this.nameCell = this.castle = null;
  this.progressWidth = 120;
  this.cachedStatusText = this.cachedStatusColor = this.cachedDescriptionText = "";
  this.cachedProgressWidth = 0;
  /** @type {{createRowCells: () => void}} */ (/** @type {unknown} */ (this)).createRowCells();
}
export function setCastleRowModel(rowView, castle) {
  rowView.castle = castle;
  rowView.cachedStatusColor = "";
  rowView.cachedStatusText = "";
  rowView.cachedProgressWidth = 0;
  rowView.unusedCachedText = "";
}
export function CastlesView(tabState) {
  this.elementId = "castlesTabContent";
  this.tabState = tabState;
  addChildView(this, new CastleTableView());
  addChildView(this, new CastleMapView());
}
export function initializeViewsCastles() {
  CastleMapView.prototype = new View();
  CastleMapView.prototype.reset = function () {
    this.cachedRevision = -1;
    clearElementById(this.elementId);
    this.tableElement = null;
    this.mapCells.length = 0;
  };
  CastleMapView.prototype.update = function () {
    if (!this.tableElement) {
      /** @type {{createDomElements: () => void}} */ (/** @type {unknown} */ (this)).createDomElements();
    }
    var castleRevision;
    castleRevision = game.castles.revision;
    if (this.cachedRevision != castleRevision) {
      this.cachedRevision = castleRevision;
      var regionManager = game.regions;
      var columnIndex,
        rowIndex,
        columnCount = regionManager.regionGridOriginColumn + regionManager.regionGridSpan - regionManager.regionGridOriginColumn,
        rowCount = regionManager.regionGridOriginRow + regionManager.regionGridSpan - regionManager.regionGridOriginRow,
        mapCell,
        h;
      for (rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        for (columnIndex = 0; columnIndex < columnCount; columnIndex++) {
          if (mapCell = this.mapCells[columnIndex][rowIndex], h = regionManager.regionGrid[columnIndex][rowIndex]) {
            h = h.castle;
            h = getCastleStatusColor(h);
            if (mapCell.style.backgroundColor != h) {
              mapCell.style.backgroundColor = h;
            }
          }
        }
      }
    }
  };
  CastleMapView.prototype.createDomElements = function () {
    var containerId = this.elementId;
    clearElementById(containerId);
    var regionManager = game.regions,
      originColumn = regionManager.regionGridOriginColumn,
      d = regionManager.regionGridOriginRow,
      maxRegionColumn = regionManager.regionGridOriginColumn + regionManager.regionGridSpan,
      maxRegionRow = regionManager.regionGridOriginRow + regionManager.regionGridSpan,
      h;
    this.tableElement = createElement("table", getElement(containerId), null, null);
    var columnCount = maxRegionColumn - originColumn,
      l;
    d = maxRegionRow - d;
    for (var columnIndex = 0; columnIndex < columnCount; columnIndex++) {
      this.mapCells.push([]);
    }
    for (var rowIndex = 0; rowIndex < d; rowIndex++) {
      for (var tableRow = this.tableElement.insertRow(rowIndex), columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        l = tableRow.insertCell(columnIndex);
        l = createElement("div", l, null, null);
        l.style.width = "39px";
        l.style.height = "39px";
        if (h = regionManager.regionGrid[columnIndex][rowIndex]) {
          if (h = findCastle(h.regionKey)) {
            var crownImage = createElement("img", l, null, null);
            crownImage.src = "images/Transparent.gif";
            crownImage.style.width = "35px";
            crownImage.style.height = "35px";
            var crownSprite = game.itemSprites.getSprite("CrownGolden.PNG");
            crownImage.style.background = "url('spritesheet/items.png') -" + crownSprite.sourceX + "px -" + crownSprite.sourceY + "px";
          }
        }
        this.mapCells[columnIndex].push(l);
      }
    }
  };
  CastleTableView.prototype = new View();
  CastleTableView.prototype.reset = function () {
    this.rowViews.length = 0;
    clearElementById(this.elementId);
    this.tableElement = null;
  };
  CastleTableView.prototype.update = function () {
    if (!this.tableElement) {
      /** @type {{createDomElements: () => void}} */ (/** @type {unknown} */ (this)).createDomElements();
    }
    var castleList = game.castles.castleList;
    if (castleList.length !== this.rowViews.length) {
      /** @type {{setRowCount: (count: number) => void}} */ (/** @type {unknown} */ (this)).setRowCount(castleList.length);
    }
    var rowIndex;
    for (rowIndex = 0; rowIndex < this.rowViews.length; rowIndex++) {
      if (this.rowViews[rowIndex].castle !== castleList[rowIndex]) {
        setCastleRowModel(this.rowViews[rowIndex], castleList[rowIndex]);
      }
      this.rowViews[rowIndex].render();
    }
  };
  CastleTableView.prototype.setRowCount = function (rowCount) {
    for (; this.rowViews.length > rowCount;) {
      this.tableElement.deleteRow(-1);
      this.rowViews.splice(this.rowViews.length - 1, 1);
    }
    for (; this.rowViews.length < rowCount;) {
      this.rowViews.push(new CastleRowView(this.tableElement.insertRow(this.rowViews.length + 1)));
    }
  };
  CastleTableView.prototype.createDomElements = function () {
    var elementId = this.elementId;
    clearElementById(elementId);
    var castleList = game.castles.castleList,
      castleIndex;
    this.tableElement = createElement("table", getElement(elementId), null, "monsterTable");
    /** @type {{createHeaderRow: (row: HTMLTableRowElement) => void}} */ (/** @type {unknown} */ (this)).createHeaderRow(this.tableElement.insertRow(0));
    for (castleIndex = 0; castleIndex < castleList.length; castleIndex++) {
      var rowView = new CastleRowView(this.tableElement.insertRow(castleIndex + 1));
      setCastleRowModel(rowView, castleList[castleIndex]);
      this.rowViews.push(rowView);
    }
  };
  CastleTableView.prototype.createHeaderRow = function (headerRow) {
    appendHeaderCell(headerRow).innerHTML = "名称";
    appendHeaderCell(headerRow).innerHTML = "状态";
  };
  CastleRowView.prototype.reset = function () {};
  CastleRowView.prototype.createRowCells = function () {
    var rowElement = this.rowElement;
    this.nameCell = rowElement.insertCell(0);
    this.nameCell.style.width = "240px";
    this.progressCell = rowElement.insertCell(1);
    this.progressCell.style.width = this.progressWidth + "px";
    this.progressCell.style.paddingLeft = "5px";
    this.progressCell.style.paddingRight = "5px";
    var progressContainer = createElement("div", this.progressCell, null, null);
    progressContainer.style.position = "relative";
    progressContainer.style.border = "1px solid #2c2c50";
    progressContainer.style.height = "15px";
    progressContainer.style.width = this.progressWidth + "px";
    this.progressFillElement = createElement("div", progressContainer, null, null);
    this.progressFillElement.style.position = "absolute";
    this.progressFillElement.style.top = "0";
    this.progressFillElement.style.left = "0";
    this.progressFillElement.style.backgroundColor = "#F00";
    this.progressFillElement.style.height = "15px";
    this.progressFillElement.style.width = "0px";
    this.progressTextElement = createElement("div", progressContainer, null, null);
    this.progressTextElement.style.position = "absolute";
    this.progressTextElement.style.textAlign = "center";
    this.progressTextElement.style.top = "0";
    this.progressTextElement.style.left = "0";
    this.progressTextElement.style.height = "15px";
    this.progressTextElement.style.width = "100%";
    this.progressTextElement.style.zIndex = "10";
  };
  CastleRowView.prototype.render = function () {
    if (this.castle) {
      var castleName = this.castle.castleName;
      if (this.cachedDescriptionText !== castleName) {
        this.cachedDescriptionText = castleName;
        this.nameCell.innerHTML = castleName;
      }
      var statusColor = getCastleStatusColor(this.castle);
      if (this.cachedStatusColor != statusColor) {
        this.cachedStatusColor = statusColor;
        this.progressFillElement.style.backgroundColor = statusColor;
      }
      var a = this.castle;
      a = a.regionLocked ? "未解锁" : a.conquered ? "已征服" : canAttackCastle(a) ? game.monsterCatalog.maxUnlockedLevel >= a.requiredMonsterLevel ? "准备攻击" : "怪物等级" + a.requiredMonsterLevel : a.attackScheduled ? "计划攻击" : "地牢" + a.conqueredDungeonCount + " / " + a.dungeonList.length;
      if (this.cachedStatusText != a) {
        this.cachedStatusText = a;
        this.progressTextElement.innerHTML = a;
      }
      a = this.castle;
      if (a.regionLocked) {
        a = 0;
      } else if (a.conquered || canAttackCastle(a) || a.attackScheduled || a.dungeonsConquered) {
        a = this.progressWidth;
      } else {
        a = this.castle.conqueredDungeonCount;
        var dungeonList = this.castle.dungeonList;
        a = 0 === dungeonList.length ? 1 : Math.min(1, a / dungeonList.length);
        a = this.progressWidth * a | 0;
      }
      if (this.cachedProgressWidth != a) {
        this.cachedProgressWidth = a;
        this.progressFillElement.style.width = a + "px";
      }
    }
  };
  CastlesView.prototype = new TabView();
  CastlesView.prototype.onGameWon = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  CastlesView.prototype.onOfflineFinish = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
  };
  CastlesView.prototype.onOfflineStart = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  CastlesView.prototype.reset = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
    resetChildViews(this);
  };
}
