/** 城堡地图、列表与状态。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { canAttackCastle, findCastle } from "../world/regions.js";
import { View, addChildView, resetChildViews } from "./base.js";
import { appendHeaderCell, clearElementById, createElement, getElement } from "./dom.js";
import { TabView } from "./navigation.js";
/** 城堡视图所需的四个依赖由组合根注入。monsterCatalog / castles / regions / itemSprites
 *  四个容器对象都在 runtime 的 game 模块对象字面量里只构造一次、从不整体重新赋值
 *  （src/ 内 0 处 `game.X =`，判据见 docs/reverse-engineering/facts.md），所以按引用绑安全；
 *  字段值（maxUnlockedLevel、revision、castleList 等）随游戏进程变化，读的始终是同一对象。
 *  未绑定就用到会立刻抛，避免"装配漏一步"退化成静默的 undefined 读取。 */
var boundMonsterCatalog = null;
var boundCastleManager = null;
var boundRegionManager = null;
var boundItemSprites = null;
export function bindCastleViews(monsterCatalog, castles, regions, itemSprites) {
  boundMonsterCatalog = monsterCatalog;
  boundCastleManager = castles;
  boundRegionManager = regions;
  boundItemSprites = itemSprites;
}
function monsterCatalogRef() {
  if (!boundMonsterCatalog) {
    throw new Error('城堡视图尚未绑定怪物目录：请在组合根调用 bindCastleViews(game.monsterCatalog, game.castles, game.regions, game.itemSprites)');
  }
  return boundMonsterCatalog;
}
function castleManagerRef() {
  if (!boundCastleManager) {
    throw new Error('城堡视图尚未绑定城堡管理器：请在组合根调用 bindCastleViews(game.monsterCatalog, game.castles, game.regions, game.itemSprites)');
  }
  return boundCastleManager;
}
function regionManagerRef() {
  if (!boundRegionManager) {
    throw new Error('城堡视图尚未绑定区域管理器：请在组合根调用 bindCastleViews(game.monsterCatalog, game.castles, game.regions, game.itemSprites)');
  }
  return boundRegionManager;
}
function itemSpritesRef() {
  if (!boundItemSprites) {
    throw new Error('城堡视图尚未绑定物品精灵表：请在组合根调用 bindCastleViews(game.monsterCatalog, game.castles, game.regions, game.itemSprites)');
  }
  return boundItemSprites;
}
export function getCastleStatusColor(castle) {
  return castle.regionLocked ? "#222" : castle.conquered ? "#080" : canAttackCastle(castle) ? monsterCatalogRef().maxUnlockedLevel >= castle.requiredMonsterLevel ? "#850" : "#A30" : castle.attackScheduled ? "#A80" : "#AAA";
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
/** @this {CastleRowView & { createRowCells: () => void }} */
export function CastleRowView(rowElement) {
  this.rowElement = rowElement;
  this.progressTextElement = this.progressFillElement = this.progressCell = this.nameCell = this.castle = null;
  this.progressWidth = 120;
  this.cachedStatusText = this.cachedStatusColor = this.cachedDescriptionText = "";
  this.cachedProgressWidth = 0;
  this.createRowCells();
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
  /** @this {CastleMapView & { createDomElements: () => void }} */
  CastleMapView.prototype.update = function () {
    if (!this.tableElement) {
      this.createDomElements();
    }
    var castleRevision;
    castleRevision = castleManagerRef().revision;
    if (this.cachedRevision != castleRevision) {
      this.cachedRevision = castleRevision;
      var regionManager = regionManagerRef();
      var columnIndex,
        rowIndex,
        columnCount = regionManager.regionGridOriginColumn + regionManager.regionGridSpan - regionManager.regionGridOriginColumn,
        rowCount = regionManager.regionGridOriginRow + regionManager.regionGridSpan - regionManager.regionGridOriginRow,
        mapCell,
        region;
      for (rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        for (columnIndex = 0; columnIndex < columnCount; columnIndex++) {
          mapCell = this.mapCells[columnIndex][rowIndex];
          region = regionManager.regionGrid[columnIndex][rowIndex];
          if (region) {
            var castle = region.castle;
            var statusColor = getCastleStatusColor(castle);
            if (mapCell.style.backgroundColor != statusColor) {
              mapCell.style.backgroundColor = statusColor;
            }
          }
        }
      }
    }
  };
  CastleMapView.prototype.createDomElements = function () {
    var containerId = this.elementId;
    clearElementById(containerId);
    var regionManager = regionManagerRef(),
      originColumn = regionManager.regionGridOriginColumn,
      originRow = regionManager.regionGridOriginRow,
      maxRegionColumn = regionManager.regionGridOriginColumn + regionManager.regionGridSpan,
      maxRegionRow = regionManager.regionGridOriginRow + regionManager.regionGridSpan,
      region;
    this.tableElement = createElement("table", getElement(containerId), null, null);
    var columnCount = maxRegionColumn - originColumn,
      tableCell,
      mapTile;
    var rowCount = maxRegionRow - originRow;
    for (var columnIndex = 0; columnIndex < columnCount; columnIndex++) {
      this.mapCells.push([]);
    }
    for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      for (var tableRow = this.tableElement.insertRow(rowIndex), columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        tableCell = tableRow.insertCell(columnIndex);
        mapTile = createElement("div", tableCell, null, null);
        mapTile.style.width = "39px";
        mapTile.style.height = "39px";
        region = regionManager.regionGrid[columnIndex][rowIndex];
        if (region) {
          var castle = findCastle(region.regionKey);
          if (castle) {
            var crownImage = createElement("img", mapTile, null, null);
            crownImage.src = "images/Transparent.gif";
            crownImage.style.width = "35px";
            crownImage.style.height = "35px";
            var crownSprite = itemSpritesRef().getSprite("CrownGolden.PNG");
            crownImage.style.background = "url('spritesheet/items.png') -" + crownSprite.sourceX + "px -" + crownSprite.sourceY + "px";
          }
        }
        this.mapCells[columnIndex].push(mapTile);
      }
    }
  };
  CastleTableView.prototype = new View();
  CastleTableView.prototype.reset = function () {
    this.rowViews.length = 0;
    clearElementById(this.elementId);
    this.tableElement = null;
  };
  /** @this {CastleTableView & { createDomElements: () => void, setRowCount: (count: number) => void }} */
  CastleTableView.prototype.update = function () {
    if (!this.tableElement) {
      this.createDomElements();
    }
    var castleList = castleManagerRef().castleList;
    if (castleList.length !== this.rowViews.length) {
      this.setRowCount(castleList.length);
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
  /** @this {CastleTableView & { createHeaderRow: (row: HTMLTableRowElement) => void }} */
  CastleTableView.prototype.createDomElements = function () {
    var elementId = this.elementId;
    clearElementById(elementId);
    var castleList = castleManagerRef().castleList,
      castleIndex;
    this.tableElement = createElement("table", getElement(elementId), null, "monsterTable");
    this.createHeaderRow(this.tableElement.insertRow(0));
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
      var statusCastle = this.castle;
      var statusText = statusCastle.regionLocked ? "未解锁" : statusCastle.conquered ? "已征服" : canAttackCastle(statusCastle) ? monsterCatalogRef().maxUnlockedLevel >= statusCastle.requiredMonsterLevel ? "准备攻击" : "怪物等级" + statusCastle.requiredMonsterLevel : statusCastle.attackScheduled ? "计划攻击" : "地牢" + statusCastle.conqueredDungeonCount + " / " + statusCastle.dungeonList.length;
      if (this.cachedStatusText != statusText) {
        this.cachedStatusText = statusText;
        this.progressTextElement.innerHTML = statusText;
      }
      var progressCastle = this.castle;
      var progressWidth;
      if (progressCastle.regionLocked) {
        progressWidth = 0;
      } else if (progressCastle.conquered || canAttackCastle(progressCastle) || progressCastle.attackScheduled || progressCastle.dungeonsConquered) {
        progressWidth = this.progressWidth;
      } else {
        var conqueredDungeonCount = this.castle.conqueredDungeonCount;
        var dungeonList = this.castle.dungeonList;
        var progressFraction = 0 === dungeonList.length ? 1 : Math.min(1, conqueredDungeonCount / dungeonList.length);
        progressWidth = this.progressWidth * progressFraction | 0;
      }
      if (this.cachedProgressWidth != progressWidth) {
        this.cachedProgressWidth = progressWidth;
        this.progressFillElement.style.width = progressWidth + "px";
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
