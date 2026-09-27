/** 成就、点数明细和永久奖励。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { View, addChildView, resetChildViews } from "./base.js";
import { appendHeaderCell, clearElementById, createElement, getElement, setElementHtml } from "./dom.js";
import { UpgradeButtonView } from "./upgrade-details.js";
import { game } from "../runtime/game.js";
import { AchievementUpgrade, UpgradeCollection, refreshUpgradeCollection } from "../progression/upgrades.js";
import { pointEventDefinitions, pointEventsById } from "../progression/points.js";
import { formatAmount, formatGroupedAmount } from "../core/math.js";
import { AdventurePointsView } from "./expedition.js";
import { TabView } from "./navigation.js";
export function AchievementListView(a) {
  this.elementId = a;
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
export function mountPointBreakdown(a) {
  clearElementById(a.elementId);
  a.tableElement = createElement("table", getElement(a.elementId), null, "pointsTable");
  var b = 0;
  a.createHeaderRow(b++);
  var c;
  for (c = 0; c < pointEventDefinitions.length; c++) {
    var d = a,
      f = pointEventDefinitions[c].pointEventTypeId,
      rowIndex = b++,
      g = d.tableElement.insertRow(rowIndex),
      h = g.insertCell(0);
    h.style.textAlign = "right";
    h.style.width = "120px";
    h.innerHTML = pointEventsById[f].shortEventLabel;
    h = g.insertCell(1);
    h.style.textAlign = "right";
    h.style.width = "60px";
    d.countCells[f] = h;
    h = g.insertCell(2);
    h.style.textAlign = "right";
    h.style.width = "60px";
    d.rewardCells[f] = h;
    g = g.insertCell(3);
    g.style.textAlign = "right";
    d.pointsCells[f] = g;
  }
}
export function PointUpgradeListView(a) {
  this.elementId = a;
  this.visible = true;
  this.skillTreeCollection = this.skillCollection = this.tableElement = null;
  this.firstColumnButtons = [];
  this.secondColumnButtons = [];
}
export function PointsView(a) {
  this.elementId = "pointsTabContent";
  this.tabState = a;
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
    var a = this.elementId,
      container = getElement(a);
    if (container) {
      this.tableElement = createElement("table", container, null, "adventurerSkillTreeTable");
      var b = this.firstColumnCollection.upgrades,
        c = this.secondColumnCollection.upgrades,
        d = this.thirdColumnCollection.upgrades,
        f = Math.max(b.length, Math.max(c.length, d.length)),
        g,
        h,
        l,
        n;
      for (g = 0; g < f; g++) {
        h = this.tableElement.insertRow(g);
        l = h.insertCell(0);
        n = h.insertCell(1);
        h = h.insertCell(2);
        l.id = a + "_" + g + "_0";
        n.id = a + "_" + g + "_1";
        h.id = a + "_" + g + "_2";
        l.width = 150;
        n.width = 150;
        h.width = 150;
        if (g < b.length) {
          this.firstColumnButtons.push(new UpgradeButtonView(l.id, b[g], g, true));
        }
        if (g < c.length) {
          this.secondColumnButtons.push(new UpgradeButtonView(n.id, c[g], g, true));
        }
        if (g < d.length) {
          this.buttons.push(new UpgradeButtonView(h.id, d[g], g, true));
        }
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
  };
  AchievementListView.prototype.refreshCollections = function () {
    var a = game.state.achievements.achievementList,
      b = [],
      c = [],
      d = [],
      f;
    for (f = 0; f < a.length; f += 3) {
      b.push(new AchievementUpgrade(a[f]));
      if (f + 1 < a.length) {
        c.push(new AchievementUpgrade(a[f + 1]));
        if (f + 2 < a.length) {
          d.push(new AchievementUpgrade(a[f + 2]));
        }
      }
    }
    this.firstColumnCollection = new UpgradeCollection([b], false);
    this.secondColumnCollection = new UpgradeCollection([c], false);
    this.thirdColumnCollection = new UpgradeCollection([d], false);
  };
  AchievementListView.prototype.update = function () {
    if (!(this.firstColumnCollection && this.tableElement)) {
      /** @type {{rebuild: () => void}} */ (/** @type {unknown} */ (this)).rebuild();
    }
    refreshUpgradeCollection(this.firstColumnCollection);
    refreshUpgradeCollection(this.secondColumnCollection);
    refreshUpgradeCollection(this.thirdColumnCollection);
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
    var b = game.state.achievements;
    a = b.achievementList.length;
    b = b.claimQueue.length + (a - b.obtainedList.length);
    if (this.cachedAchievementCount != b) {
      this.cachedAchievementCount = b;
      setElementHtml(this.headerElementId, "成就(" + b + "/" + a + ")");
    }
  };
  AdventurePointBreakdownView.prototype = new View();
  AdventurePointBreakdownView.prototype.reset = function () {
    this.cachedPointsByEventType = {};
    this.pointsCells = {};
    this.countCells = {};
    this.rewardCells = {};
    var a, b;
    for (a = 0; a < pointEventDefinitions.length; a++) {
      b = pointEventDefinitions[a].pointEventTypeId;
      this.cachedPointsByEventType[b] = -1;
      this.cachedCountsByEventType[b] = -1;
      this.cachedPointReward[b] = -1;
    }
    mountPointBreakdown(this);
  };
  AdventurePointBreakdownView.prototype.update = function () {
    if (!this.tableElement) {
      mountPointBreakdown(this);
    }
    var a,
      b,
      c,
      d,
      f,
      g,
      h,
      l,
      n = game.state.adventurePoints;
    for (a = 0; a < pointEventDefinitions.length; a++) {
      b = pointEventDefinitions[a].pointEventTypeId;
      c = this.cachedPointsByEventType[b];
      d = n.pointsByEventType[b];
      f = this.cachedPointsByEventType[b];
      g = n.countsByEventType[b];
      h = this.cachedPointReward[b];
      l = pointEventDefinitions[a].currentPointReward;
      if (c != d) {
        this.cachedPointsByEventType[b] = d;
        c = this.pointsCells[b];
        c.innerHTML = formatGroupedAmount(d);
      }
      if (f != g) {
        this.cachedCountsByEventType[b] = g;
        d = this.countCells[b];
        d.innerHTML = formatAmount(g);
      }
      if (h != l) {
        this.cachedPointReward[b] = l;
        b = this.rewardCells[b];
        b.innerHTML = formatAmount(l);
      }
    }
  };
  AdventurePointBreakdownView.prototype.createHeaderRow = function (a) {
    a = this.tableElement.insertRow(a);
    var b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.innerHTML = "冒险行动";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.innerHTML = "计数";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.innerHTML = "AP/行动";
    a = appendHeaderCell(a);
    a.style.textAlign = "right";
    a.innerHTML = "冒险点数";
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
    var a = this.elementId,
      container = getElement(a);
    if (container) {
      this.tableElement = createElement("table", container, null, "adventurerSkillTreeTable");
      var b = this.skillCollection.upgrades,
        c = this.skillTreeCollection.upgrades,
        d = Math.max(b.length, c.length),
        f,
        g,
        h;
      for (f = 0; f < d; f++) {
        g = this.tableElement.insertRow(f);
        h = g.insertCell(0);
        g = g.insertCell(1);
        h.id = a + "_" + f + "_0";
        g.id = a + "_" + f + "_1";
        h.width = 150;
        g.width = 150;
        if (f < b.length) {
          this.firstColumnButtons.push(new UpgradeButtonView(h.id, b[f], f, true));
        }
        if (f < c.length) {
          this.secondColumnButtons.push(new UpgradeButtonView(g.id, c[f], f, true));
        }
      }
    }
    for (a = 0; a < this.firstColumnButtons.length; a++) {
      this.firstColumnButtons[a].reset();
    }
    for (a = 0; a < this.secondColumnButtons.length; a++) {
      this.secondColumnButtons[a].reset();
    }
  };
  PointUpgradeListView.prototype.refreshCollections = function () {
    var a = game.state.adventurePoints.pointUpgrades,
      b = [],
      c = [],
      d;
    for (d = 0; d < a.length; d += 2) {
      b.push(a[d]);
      if (d + 1 < a.length) {
        c.push(a[d + 1]);
      }
    }
    this.skillCollection = new UpgradeCollection([b], false);
    this.skillTreeCollection = new UpgradeCollection([c], false);
  };
  PointUpgradeListView.prototype.update = function () {
    if (!(this.skillCollection && this.tableElement)) {
      /** @type {{rebuild: () => void}} */ (/** @type {unknown} */ (this)).rebuild();
    }
    refreshUpgradeCollection(this.skillCollection);
    refreshUpgradeCollection(this.skillTreeCollection);
    var a;
    for (a = 0; a < this.firstColumnButtons.length; a++) {
      this.firstColumnButtons[a].render();
    }
    for (a = 0; a < this.secondColumnButtons.length; a++) {
      this.secondColumnButtons[a].render();
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
