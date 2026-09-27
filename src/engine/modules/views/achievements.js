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
  this.Ot = this.Nt = this.Hq = this.Iq = null;
  this.firstColumnButtons = [];
  this.secondColumnButtons = [];
  this.buttons = [];
  this.QC = "achievementsHeaderSpan";
  this.pz = -1;
}
export function AdventurePointBreakdownView() {
  this.elementId = "pointsBreakdownContainer";
  this.visible = true;
  this.Ls = null;
  this.Ao = {};
  this.sz = {};
  this.Dv = {};
  this.sy = {};
  this.tu = {};
  this.ex = {};
}
export function mountPointBreakdown(a) {
  clearElementById(a.elementId);
  a.Ls = createElement("table", getElement(a.elementId), null, "pointsTable");
  var b = 0;
  a.St(b++);
  var c;
  for (c = 0; c < pointEventDefinitions.length; c++) {
    var d = a,
      f = pointEventDefinitions[c].pointEventTypeId,
      rowIndex = b++,
      g = d.Ls.insertRow(rowIndex),
      h = g.insertCell(0);
    h.style.textAlign = "right";
    h.style.width = "120px";
    h.innerHTML = pointEventsById[f].shortEventLabel;
    h = g.insertCell(1);
    h.style.textAlign = "right";
    h.style.width = "60px";
    d.tu[f] = h;
    h = g.insertCell(2);
    h.style.textAlign = "right";
    h.style.width = "60px";
    d.ex[f] = h;
    g = g.insertCell(3);
    g.style.textAlign = "right";
    d.sy[f] = g;
  }
}
export function PointUpgradeListView(a) {
  this.elementId = a;
  this.visible = true;
  this.skillTreeCollection = this.skillCollection = this.Gt = null;
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
    /** @type {{uo: () => void}} */ (/** @type {unknown} */ (this)).uo();
  };
  AchievementListView.prototype.uo = function () {
    clearElementById(this.elementId);
    this.Iq = null;
    this.firstColumnButtons.length = 0;
    this.secondColumnButtons.length = 0;
    this.buttons.length = 0;
    /** @type {{Zn: () => void}} */ (/** @type {unknown} */ (this)).Zn();
    var a = this.elementId,
      container = getElement(a);
    if (container) {
      this.Iq = createElement("table", container, null, "adventurerSkillTreeTable");
      var b = this.Hq.upgrades,
        c = this.Nt.upgrades,
        d = this.Ot.upgrades,
        f = Math.max(b.length, Math.max(c.length, d.length)),
        g,
        h,
        l,
        n;
      for (g = 0; g < f; g++) {
        h = this.Iq.insertRow(g);
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
  AchievementListView.prototype.Zn = function () {
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
    this.Hq = new UpgradeCollection([b], false);
    this.Nt = new UpgradeCollection([c], false);
    this.Ot = new UpgradeCollection([d], false);
  };
  AchievementListView.prototype.update = function () {
    if (!(this.Hq && this.Iq)) {
      /** @type {{uo: () => void}} */ (/** @type {unknown} */ (this)).uo();
    }
    refreshUpgradeCollection(this.Hq);
    refreshUpgradeCollection(this.Nt);
    refreshUpgradeCollection(this.Ot);
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
    if (this.pz != b) {
      this.pz = b;
      setElementHtml(this.QC, "成就(" + b + "/" + a + ")");
    }
  };
  AdventurePointBreakdownView.prototype = new View();
  AdventurePointBreakdownView.prototype.reset = function () {
    this.Ao = {};
    this.sy = {};
    this.tu = {};
    this.ex = {};
    var a, b;
    for (a = 0; a < pointEventDefinitions.length; a++) {
      b = pointEventDefinitions[a].pointEventTypeId;
      this.Ao[b] = -1;
      this.sz[b] = -1;
      this.Dv[b] = -1;
    }
    mountPointBreakdown(this);
  };
  AdventurePointBreakdownView.prototype.update = function () {
    if (!this.Ls) {
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
      c = this.Ao[b];
      d = n.pointsByEventType[b];
      f = this.Ao[b];
      g = n.countsByEventType[b];
      h = this.Dv[b];
      l = pointEventDefinitions[a].currentPointReward;
      if (c != d) {
        this.Ao[b] = d;
        c = this.sy[b];
        c.innerHTML = formatGroupedAmount(d);
      }
      if (f != g) {
        this.sz[b] = g;
        d = this.tu[b];
        d.innerHTML = formatAmount(g);
      }
      if (h != l) {
        this.Dv[b] = l;
        b = this.ex[b];
        b.innerHTML = formatAmount(l);
      }
    }
  };
  AdventurePointBreakdownView.prototype.St = function (a) {
    a = this.Ls.insertRow(a);
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
    /** @type {{uo: () => void}} */ (/** @type {unknown} */ (this)).uo();
  };
  PointUpgradeListView.prototype.uo = function () {
    clearElementById(this.elementId);
    this.Gt = null;
    this.firstColumnButtons.length = 0;
    this.secondColumnButtons.length = 0;
    /** @type {{Zn: () => void}} */ (/** @type {unknown} */ (this)).Zn();
    var a = this.elementId,
      container = getElement(a);
    if (container) {
      this.Gt = createElement("table", container, null, "adventurerSkillTreeTable");
      var b = this.skillCollection.upgrades,
        c = this.skillTreeCollection.upgrades,
        d = Math.max(b.length, c.length),
        f,
        g,
        h;
      for (f = 0; f < d; f++) {
        g = this.Gt.insertRow(f);
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
  PointUpgradeListView.prototype.Zn = function () {
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
    if (!(this.skillCollection && this.Gt)) {
      /** @type {{uo: () => void}} */ (/** @type {unknown} */ (this)).uo();
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
