/** 城堡地图、列表与状态。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { canAttackCastle, findCastle } from "../world/regions.js";
import { game } from "../runtime/game.js";
import { View, addChildView, resetChildViews } from "./base.js";
import { appendHeaderCell, clearElementById, createElement, getElement } from "./dom.js";
import { TabView } from "./navigation.js";
export function getCastleStatusColor(a) {
  return a.regionLocked ? "#222" : a.conquered ? "#080" : canAttackCastle(a) ? game.monsterCatalog.maxUnlockedLevel >= a.requiredMonsterLevel ? "#850" : "#A30" : a.attackScheduled ? "#A80" : "#AAA";
}
export function CastleMapView() {
  this.elementId = "castleMapContainer";
  this.visible = true;
  this.ws = null;
  this.vs = [];
  this.Fu = -1;
}
export function CastleTableView() {
  this.elementId = "castleTableContainer";
  this.visible = true;
  this.tableElement = null;
  this.rowViews = [];
}
export function CastleRowView(a) {
  this.rowElement = a;
  this.progressTextElement = this.progressFillElement = this.progressCell = this.nameCell = this.castle = null;
  this.Us = 120;
  this.Rv = this.Cu = this.cachedDescriptionText = "";
  this.Kv = 0;
  /** @type {{createRowCells: () => void}} */ (/** @type {unknown} */ (this)).createRowCells();
}
export function setCastleRowModel(a, b) {
  a.castle = b;
  a.Cu = "";
  a.Rv = "";
  a.Kv = 0;
  a.fb = "";
}
export function CastlesView(a) {
  this.elementId = "castlesTabContent";
  this.tabState = a;
  addChildView(this, new CastleTableView());
  addChildView(this, new CastleMapView());
}
export function initializeViewsCastles() {
  CastleMapView.prototype = new View();
  CastleMapView.prototype.reset = function () {
    this.Fu = -1;
    clearElementById(this.elementId);
    this.ws = null;
    this.vs.length = 0;
  };
  CastleMapView.prototype.update = function () {
    if (!this.ws) {
      /** @type {{createDomElements: () => void}} */ (/** @type {unknown} */ (this)).createDomElements();
    }
    var a;
    a = game.castles.cm;
    if (this.Fu != a) {
      this.Fu = a;
      a = game.regions;
      var b,
        c,
        d = a.regionGridOriginColumn + a.regionGridSpan - a.regionGridOriginColumn,
        f = a.regionGridOriginRow + a.regionGridSpan - a.regionGridOriginRow,
        g,
        h;
      for (c = 0; c < f; c++) {
        for (b = 0; b < d; b++) {
          if (g = this.vs[b][c], h = a.Mr[b][c]) {
            h = h.cu;
            h = getCastleStatusColor(h);
            if (g.style.backgroundColor != h) {
              g.style.backgroundColor = h;
            }
          }
        }
      }
    }
  };
  CastleMapView.prototype.createDomElements = function () {
    var containerId = this.elementId;
    clearElementById(containerId);
    var b = game.regions,
      c = b.regionGridOriginColumn,
      d = b.regionGridOriginRow,
      f = b.regionGridOriginColumn + b.regionGridSpan,
      g = b.regionGridOriginRow + b.regionGridSpan,
      h;
    this.ws = createElement("table", getElement(containerId), null, null);
    var a = f - c,
      l;
    d = g - d;
    for (g = 0; g < a; g++) {
      this.vs.push([]);
    }
    for (c = 0; c < d; c++) {
      for (f = this.ws.insertRow(c), g = 0; g < a; g++) {
        l = f.insertCell(g);
        l = createElement("div", l, null, null);
        l.style.width = "39px";
        l.style.height = "39px";
        if (h = b.Mr[g][c]) {
          if (h = findCastle(h.io)) {
            h = createElement("img", l, null, null);
            h.src = "images/Transparent.gif";
            h.style.width = "35px";
            h.style.height = "35px";
            var n = game.itemSprites.getSprite("CrownGolden.PNG");
            h.style.background = "url('spritesheet/items.png') -" + n.sourceX + "px -" + n.sourceY + "px";
          }
        }
        this.vs[g].push(l);
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
    var a = game.castles.castleList;
    if (a.length !== this.rowViews.length) {
      /** @type {{mk: (count: number) => void}} */ (/** @type {unknown} */ (this)).mk(a.length);
    }
    var b;
    for (b = 0; b < this.rowViews.length; b++) {
      if (this.rowViews[b].castle !== a[b]) {
        setCastleRowModel(this.rowViews[b], a[b]);
      }
      this.rowViews[b].render();
    }
  };
  CastleTableView.prototype.mk = function (a) {
    for (; this.rowViews.length > a;) {
      this.tableElement.deleteRow(-1);
      this.rowViews.splice(this.rowViews.length - 1, 1);
    }
    for (; this.rowViews.length < a;) {
      this.rowViews.push(new CastleRowView(this.tableElement.insertRow(this.rowViews.length + 1)));
    }
  };
  CastleTableView.prototype.createDomElements = function () {
    var a = this.elementId;
    clearElementById(a);
    var b = game.castles.castleList,
      c;
    this.tableElement = createElement("table", getElement(a), null, "monsterTable");
    /** @type {{createHeaderRow: (row: HTMLTableRowElement) => void}} */ (/** @type {unknown} */ (this)).createHeaderRow(this.tableElement.insertRow(0));
    for (c = 0; c < b.length; c++) {
      var rowView = new CastleRowView(this.tableElement.insertRow(c + 1));
      setCastleRowModel(rowView, b[c]);
      this.rowViews.push(rowView);
    }
  };
  CastleTableView.prototype.createHeaderRow = function (a) {
    appendHeaderCell(a).innerHTML = "名称";
    appendHeaderCell(a).innerHTML = "状态";
  };
  CastleRowView.prototype.reset = function () {};
  CastleRowView.prototype.createRowCells = function () {
    var a = this.rowElement;
    this.nameCell = a.insertCell(0);
    this.nameCell.style.width = "240px";
    this.progressCell = a.insertCell(1);
    this.progressCell.style.width = this.Us + "px";
    this.progressCell.style.paddingLeft = "5px";
    this.progressCell.style.paddingRight = "5px";
    a = createElement("div", this.progressCell, null, null);
    a.style.position = "relative";
    a.style.border = "1px solid #2c2c50";
    a.style.height = "15px";
    a.style.width = this.Us + "px";
    this.progressFillElement = createElement("div", a, null, null);
    this.progressFillElement.style.position = "absolute";
    this.progressFillElement.style.top = "0";
    this.progressFillElement.style.left = "0";
    this.progressFillElement.style.backgroundColor = "#F00";
    this.progressFillElement.style.height = "15px";
    this.progressFillElement.style.width = "0px";
    this.progressTextElement = createElement("div", a, null, null);
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
      var a = this.castle.castleName;
      if (this.cachedDescriptionText !== a) {
        this.cachedDescriptionText = a;
        this.nameCell.innerHTML = a;
      }
      a = getCastleStatusColor(this.castle);
      if (this.Cu != a) {
        this.Cu = a;
        this.progressFillElement.style.backgroundColor = a;
      }
      a = this.castle;
      a = a.regionLocked ? "未解锁" : a.conquered ? "已征服" : canAttackCastle(a) ? game.monsterCatalog.maxUnlockedLevel >= a.requiredMonsterLevel ? "准备攻击" : "怪物等级" + a.requiredMonsterLevel : a.attackScheduled ? "计划攻击" : "地牢" + a.yk + " / " + a.dungeonList.length;
      if (this.Rv != a) {
        this.Rv = a;
        this.progressTextElement.innerHTML = a;
      }
      a = this.castle;
      if (a.regionLocked) {
        a = 0;
      } else if (a.conquered || canAttackCastle(a) || a.attackScheduled || a.dungeonsConquered) {
        a = this.Us;
      } else {
        a = this.castle.yk;
        var b = this.castle.dungeonList;
        a = 0 === b.length ? 1 : Math.min(1, a / b.length);
        a = this.Us * a | 0;
      }
      if (this.Kv != a) {
        this.Kv = a;
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
