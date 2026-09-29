/** 成就、点数明细和永久奖励。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { View, addChildView, resetChildViews } from "./base.js";
import { appendHeaderCell, clearElementById, createElement, getElement, setElementHtml } from "./dom.js";
import { UpgradeButtonView } from "./upgrade-details.js";
/**
 * 本模块只看会话状态，不再反向依赖组合根 runtime/game.js。
 * 绑的是 game.state 本身（本文件同时读 achievements 与 adventurePoints 两个子对象），
 * 与 bindStatistics / bindAdventurePoints 同一约定：state 身份在会话内稳定，
 * 存档恢复走原位更新，所以绑一次即可。未绑定就取用一律抛错，不静默读 undefined。
 */
var boundState = null;
export function bindAchievementViews(state) {
  boundState = state;
}
function achievementViewsState() {
  if (!boundState) {
    throw new Error('achievements 视图尚未绑定会话状态：请在组合根调用 bindAchievementViews(game.state)');
  }
  return boundState;
}
import { AchievementUpgrade, UpgradeCollection, refreshUpgradeCollection } from "../progression/upgrades.js";
import { pointEventDefinitions, pointEventsById } from "../progression/points.js";
import { formatAmount, formatGroupedAmount } from "../core/math.js";
import { AdventurePointsView } from "./expedition.js";
import { TabView } from "./navigation.js";
export function AchievementListView(elementId) {
  this.elementId = elementId;
  this.visible = true;
  this.thirdColumnCollection = this.secondColumnCollection = this.firstColumnCollection = this.tableElement = null;
  this.firstColumnButtons = [];
  this.secondColumnButtons = [];
  this.buttons = [];
  this.headerElementId = "achievementsHeaderSpan";
  this.cachedAchievementCount = -1;
}
export function AdventurePointBreakdownView() {
  this.elementId = "pointsBreakdownContainer";
  this.visible = true;
  this.tableElement = null;
  this.cachedPointsByEventType = {};
  this.cachedCountsByEventType = {};
  this.cachedPointReward = {};
  this.pointsCells = {};
  this.countCells = {};
  this.rewardCells = {};
}
export function mountPointBreakdown(breakdownView) {
  clearElementById(breakdownView.elementId);
  breakdownView.tableElement = createElement("table", getElement(breakdownView.elementId), null, "pointsTable");
  var nextRowIndex = 0;
  breakdownView.createHeaderRow(nextRowIndex++);
  var eventIndex;
  for (eventIndex = 0; eventIndex < pointEventDefinitions.length; eventIndex++) {
    var self = breakdownView,
      pointEventTypeId = pointEventDefinitions[eventIndex].pointEventTypeId,
      rowIndex = nextRowIndex++,
      row = self.tableElement.insertRow(rowIndex),
      labelCell = row.insertCell(0);
    labelCell.style.textAlign = "right";
    labelCell.style.width = "120px";
    labelCell.innerHTML = pointEventsById[pointEventTypeId].shortEventLabel;
    var countCell = row.insertCell(1);
    countCell.style.textAlign = "right";
    countCell.style.width = "60px";
    self.countCells[pointEventTypeId] = countCell;
    var rewardCell = row.insertCell(2);
    rewardCell.style.textAlign = "right";
    rewardCell.style.width = "60px";
    self.rewardCells[pointEventTypeId] = rewardCell;
    var pointsCell = row.insertCell(3);
    pointsCell.style.textAlign = "right";
    self.pointsCells[pointEventTypeId] = pointsCell;
  }
}
export function PointUpgradeListView(elementId) {
  this.elementId = elementId;
  this.visible = true;
  this.skillTreeCollection = this.skillCollection = this.tableElement = null;
  this.firstColumnButtons = [];
  this.secondColumnButtons = [];
}
export function PointsView(tabState) {
  this.elementId = "pointsTabContent";
  this.tabState = tabState;
  addChildView(this, new AdventurePointsView("achievementsTabAdventurePointsPanel"));
  addChildView(this, new AdventurePointBreakdownView());
  addChildView(this, new PointUpgradeListView("pointUpgradesContainer"));
  addChildView(this, new AchievementListView("achievementsContainer"));
}
export function initializeViewsAchievements() {
  AchievementListView.prototype = new View();
  AchievementListView.prototype.reset = function () {
    /** @type {{rebuild: () => void}} */ (/** @type {unknown} */ (this)).rebuild();
  };
  AchievementListView.prototype.rebuild = function () {
    clearElementById(this.elementId);
    this.tableElement = null;
    this.firstColumnButtons.length = 0;
    this.secondColumnButtons.length = 0;
    this.buttons.length = 0;
    /** @type {{refreshCollections: () => void}} */ (/** @type {unknown} */ (this)).refreshCollections();
    var elementId = this.elementId,
      container = getElement(elementId);
    if (container) {
      this.tableElement = createElement("table", container, null, "adventurerSkillTreeTable");
      var firstColumnUpgrades = this.firstColumnCollection.upgrades,
        secondColumnUpgrades = this.secondColumnCollection.upgrades,
        thirdColumnUpgrades = this.thirdColumnCollection.upgrades,
        rowCount = Math.max(firstColumnUpgrades.length, Math.max(secondColumnUpgrades.length, thirdColumnUpgrades.length)),
        rowIndex,
        row,
        thirdColumnCell,
        firstColumnCell,
        secondColumnCell;
      for (rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        row = this.tableElement.insertRow(rowIndex);
        firstColumnCell = row.insertCell(0);
        secondColumnCell = row.insertCell(1);
        thirdColumnCell = row.insertCell(2);
        firstColumnCell.id = elementId + "_" + rowIndex + "_0";
        secondColumnCell.id = elementId + "_" + rowIndex + "_1";
        thirdColumnCell.id = elementId + "_" + rowIndex + "_2";
        firstColumnCell.width = 150;
        secondColumnCell.width = 150;
        thirdColumnCell.width = 150;
        if (rowIndex < firstColumnUpgrades.length) {
          this.firstColumnButtons.push(new UpgradeButtonView(firstColumnCell.id, firstColumnUpgrades[rowIndex], rowIndex, true));
        }
        if (rowIndex < secondColumnUpgrades.length) {
          this.secondColumnButtons.push(new UpgradeButtonView(secondColumnCell.id, secondColumnUpgrades[rowIndex], rowIndex, true));
        }
        if (rowIndex < thirdColumnUpgrades.length) {
          this.buttons.push(new UpgradeButtonView(thirdColumnCell.id, thirdColumnUpgrades[rowIndex], rowIndex, true));
        }
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
  };
  AchievementListView.prototype.refreshCollections = function () {
    var achievementList = achievementViewsState().achievements.achievementList,
      firstColumnAchievements = [],
      secondColumnAchievements = [],
      thirdColumnAchievements = [],
      rowStartIndex;
    for (rowStartIndex = 0; rowStartIndex < achievementList.length; rowStartIndex += 3) {
      firstColumnAchievements.push(new AchievementUpgrade(achievementList[rowStartIndex]));
      if (rowStartIndex + 1 < achievementList.length) {
        secondColumnAchievements.push(new AchievementUpgrade(achievementList[rowStartIndex + 1]));
        if (rowStartIndex + 2 < achievementList.length) {
          thirdColumnAchievements.push(new AchievementUpgrade(achievementList[rowStartIndex + 2]));
        }
      }
    }
    this.firstColumnCollection = new UpgradeCollection([firstColumnAchievements], false);
    this.secondColumnCollection = new UpgradeCollection([secondColumnAchievements], false);
    this.thirdColumnCollection = new UpgradeCollection([thirdColumnAchievements], false);
  };
  AchievementListView.prototype.update = function () {
    if (!(this.firstColumnCollection && this.tableElement)) {
      /** @type {{rebuild: () => void}} */ (/** @type {unknown} */ (this)).rebuild();
    }
    refreshUpgradeCollection(this.firstColumnCollection);
    refreshUpgradeCollection(this.secondColumnCollection);
    refreshUpgradeCollection(this.thirdColumnCollection);
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
    var achievements = achievementViewsState().achievements;
    var achievementTotal = achievements.achievementList.length;
    var achievementCount = achievements.claimQueue.length + (achievementTotal - achievements.obtainedList.length);
    if (this.cachedAchievementCount != achievementCount) {
      this.cachedAchievementCount = achievementCount;
      setElementHtml(this.headerElementId, "成就(" + achievementCount + "/" + achievementTotal + ")");
    }
  };
  AdventurePointBreakdownView.prototype = new View();
  AdventurePointBreakdownView.prototype.reset = function () {
    this.cachedPointsByEventType = {};
    this.pointsCells = {};
    this.countCells = {};
    this.rewardCells = {};
    var eventIndex, pointEventTypeId;
    for (eventIndex = 0; eventIndex < pointEventDefinitions.length; eventIndex++) {
      pointEventTypeId = pointEventDefinitions[eventIndex].pointEventTypeId;
      this.cachedPointsByEventType[pointEventTypeId] = -1;
      this.cachedCountsByEventType[pointEventTypeId] = -1;
      this.cachedPointReward[pointEventTypeId] = -1;
    }
    mountPointBreakdown(this);
  };
  AdventurePointBreakdownView.prototype.update = function () {
    if (!this.tableElement) {
      mountPointBreakdown(this);
    }
    var eventIndex,
      eventTypeId,
      cachedPoints,
      eventPoints,
      cachedPointsReread,
      eventCount,
      cachedPointReward,
      currentPointReward,
      adventurePoints = achievementViewsState().adventurePoints;
    for (eventIndex = 0; eventIndex < pointEventDefinitions.length; eventIndex++) {
      eventTypeId = pointEventDefinitions[eventIndex].pointEventTypeId;
      cachedPoints = this.cachedPointsByEventType[eventTypeId];
      eventPoints = adventurePoints.pointsByEventType[eventTypeId];
      cachedPointsReread = this.cachedPointsByEventType[eventTypeId];
      eventCount = adventurePoints.countsByEventType[eventTypeId];
      cachedPointReward = this.cachedPointReward[eventTypeId];
      currentPointReward = pointEventDefinitions[eventIndex].currentPointReward;
      if (cachedPoints != eventPoints) {
        this.cachedPointsByEventType[eventTypeId] = eventPoints;
        var pointsCell = this.pointsCells[eventTypeId];
        pointsCell.innerHTML = formatGroupedAmount(eventPoints);
      }
      if (cachedPointsReread != eventCount) {
        this.cachedCountsByEventType[eventTypeId] = eventCount;
        var countCell = this.countCells[eventTypeId];
        countCell.innerHTML = formatAmount(eventCount);
      }
      if (cachedPointReward != currentPointReward) {
        this.cachedPointReward[eventTypeId] = currentPointReward;
        var rewardCell = this.rewardCells[eventTypeId];
        rewardCell.innerHTML = formatAmount(currentPointReward);
      }
    }
  };
  AdventurePointBreakdownView.prototype.createHeaderRow = function (rowIndex) {
    var row = this.tableElement.insertRow(rowIndex);
    var labelHeaderCell = appendHeaderCell(row);
    labelHeaderCell.style.textAlign = "right";
    labelHeaderCell.innerHTML = "冒险行动";
    var countHeaderCell = appendHeaderCell(row);
    countHeaderCell.style.textAlign = "right";
    countHeaderCell.innerHTML = "计数";
    var rewardHeaderCell = appendHeaderCell(row);
    rewardHeaderCell.style.textAlign = "right";
    rewardHeaderCell.innerHTML = "AP/行动";
    var pointsHeaderCell = appendHeaderCell(row);
    pointsHeaderCell.style.textAlign = "right";
    pointsHeaderCell.innerHTML = "冒险点数";
  };
  PointUpgradeListView.prototype = new View();
  PointUpgradeListView.prototype.reset = function () {
    /** @type {{rebuild: () => void}} */ (/** @type {unknown} */ (this)).rebuild();
  };
  PointUpgradeListView.prototype.rebuild = function () {
    clearElementById(this.elementId);
    this.tableElement = null;
    this.firstColumnButtons.length = 0;
    this.secondColumnButtons.length = 0;
    /** @type {{refreshCollections: () => void}} */ (/** @type {unknown} */ (this)).refreshCollections();
    var elementId = this.elementId,
      container = getElement(elementId);
    if (container) {
      this.tableElement = createElement("table", container, null, "adventurerSkillTreeTable");
      var skillUpgrades = this.skillCollection.upgrades,
        skillTreeUpgrades = this.skillTreeCollection.upgrades,
        rowCount = Math.max(skillUpgrades.length, skillTreeUpgrades.length),
        rowIndex,
        row,
        secondColumnCell,
        firstColumnCell;
      for (rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        row = this.tableElement.insertRow(rowIndex);
        firstColumnCell = row.insertCell(0);
        secondColumnCell = row.insertCell(1);
        firstColumnCell.id = elementId + "_" + rowIndex + "_0";
        secondColumnCell.id = elementId + "_" + rowIndex + "_1";
        firstColumnCell.width = 150;
        secondColumnCell.width = 150;
        if (rowIndex < skillUpgrades.length) {
          this.firstColumnButtons.push(new UpgradeButtonView(firstColumnCell.id, skillUpgrades[rowIndex], rowIndex, true));
        }
        if (rowIndex < skillTreeUpgrades.length) {
          this.secondColumnButtons.push(new UpgradeButtonView(secondColumnCell.id, skillTreeUpgrades[rowIndex], rowIndex, true));
        }
      }
    }
    for (var buttonIndex = 0; buttonIndex < this.firstColumnButtons.length; buttonIndex++) {
      this.firstColumnButtons[buttonIndex].reset();
    }
    for (buttonIndex = 0; buttonIndex < this.secondColumnButtons.length; buttonIndex++) {
      this.secondColumnButtons[buttonIndex].reset();
    }
  };
  PointUpgradeListView.prototype.refreshCollections = function () {
    var pointUpgrades = achievementViewsState().adventurePoints.pointUpgrades,
      firstColumnUpgrades = [],
      secondColumnUpgrades = [],
      rowStartIndex;
    for (rowStartIndex = 0; rowStartIndex < pointUpgrades.length; rowStartIndex += 2) {
      firstColumnUpgrades.push(pointUpgrades[rowStartIndex]);
      if (rowStartIndex + 1 < pointUpgrades.length) {
        secondColumnUpgrades.push(pointUpgrades[rowStartIndex + 1]);
      }
    }
    this.skillCollection = new UpgradeCollection([firstColumnUpgrades], false);
    this.skillTreeCollection = new UpgradeCollection([secondColumnUpgrades], false);
  };
  PointUpgradeListView.prototype.update = function () {
    if (!(this.skillCollection && this.tableElement)) {
      /** @type {{rebuild: () => void}} */ (/** @type {unknown} */ (this)).rebuild();
    }
    refreshUpgradeCollection(this.skillCollection);
    refreshUpgradeCollection(this.skillTreeCollection);
    var buttonIndex;
    for (buttonIndex = 0; buttonIndex < this.firstColumnButtons.length; buttonIndex++) {
      this.firstColumnButtons[buttonIndex].render();
    }
    for (buttonIndex = 0; buttonIndex < this.secondColumnButtons.length; buttonIndex++) {
      this.secondColumnButtons[buttonIndex].render();
    }
  };
  PointsView.prototype = new TabView();
  PointsView.prototype.onGameWon = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
  };
  PointsView.prototype.onOfflineFinish = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
  };
  PointsView.prototype.onOfflineStart = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  PointsView.prototype.reset = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
    resetChildViews(this);
  };
}
