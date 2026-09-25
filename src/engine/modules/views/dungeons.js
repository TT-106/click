// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
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
  this.ti = "";
  this.om = this.Ml = this.po = this.lc = this.button = null;
}
export function mountTreasureLoot(a) {
  var b = getElement(a.elementId);
  if (b) {
    clearElement(b);
    a.ti = a.Ro();
    a.button = createElement("div", b, a.elementId, a.ti);
    a.button.onmouseup = function () {
      if (a.lc && !a.lc.Kg) {
        var b = a.lc;
        b.el = true;
        game.state.party.hq(b);
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
    a.po = createElement("img", d, null, null);
    a.po.src = "images/Transparent.gif";
    a.po.style.width = "50px";
    a.po.style.height = "50px";
    b = b.insertCell(1);
    b.style.textAlign = "left";
    a.Ml = createElement("span", b, null, null);
    a.om = c.insertCell(0);
    a.om.colSpan = 2;
    a.om.style.width = "200px";
    a.om.style.textAlign = "left";
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
  this.lh = a;
  this.ui = this.ua = null;
  this.yr = new PurchaseDungeonUpgrade(this.ua);
  this.px = this.Gx = this.mf = this.Vg = this.wr = this.Co = null;
  this.pB = "secureCell_" + b + "_" + this.lh.rowIndex;
  this.upgradeButton = this.cj = this.ai = this.sh = this.ng = this.Ix = null;
  this.Gu = this.Bk = this.Qv = "";
  this.mw = this.pu = -1;
  this.Bt = false;
  this.Ct = 260;
  this.qi();
}
export function DungeonListView(a, b, c) {
  this.elementId = c;
  this.tabState = a;
  this.dw = b;
  this.bf = null;
  this.rf = [];
}
export function getDungeonList(a) {
  switch (a.dw) {
    case 0:
      return game.dungeons.uj;
    case 1:
      return game.dungeons.Ge;
    case 2:
      return game.dungeons.ze;
    case 3:
      return game.dungeons.dg;
    default:
      return game.dungeons.uj;
  }
}
export function DungeonsView(a) {
  this.elementId = "dungeonsTabContent";
  this.tabState = a;
  this.nr = new TabState(getDungeonTabLabel(0, 0), true);
  this.zw = new TabState(getDungeonTabLabel(1, 0), true);
  this.qu = new TabState(getDungeonTabLabel(2, 0), true);
  this.qx = new TabState(getDungeonTabLabel(3, 0), true);
  a = new TabBar("dungeonTabMenu");
  var b = new DungeonListView(this.nr, 0, "discoveredDungeonsTableContainer"),
    c = new DungeonListView(this.zw, 1, "infestedDungeonsTableContainer"),
    d = new DungeonListView(this.qu, 2, "clearedDungeonsTableContainer"),
    f = new DungeonListView(this.qx, 3, "farmedDungeonsTableContainer");
  this.nr.selected = true;
  addTab(a, this.nr);
  addTab(a, this.zw);
  addTab(a, this.qu);
  addTab(a, this.qx);
  this.Hz = this.Uy = this.aA = this.nz = -1;
  addChildView(this, new GoldView());
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
    return a && !a.Kg;
  };
  TreasureLootView.prototype.reset = function () {
    this.lc = null;
    mountTreasureLoot(this);
  };
  TreasureLootView.prototype.update = function () {
    if (!this.button) {
      mountTreasureLoot(this);
    }
    var a = getVisibleTreasure();
    if (a != this.lc && (this.lc = a)) {
      var b = this.lc.Mf;
      this.Ml.innerHTML = 1 === b ? "搜索财宝箱!" : 2 === b ? "搜索武器架!" : 3 === b ? "搜索书架!" : "搜索事物!";
      this.om.innerHTML = "在房间内点击.";
      if (a) {
        b = a.Kg ? a.PA : a.Vy;
        this.po.style.background = "url('spritesheet/terrain.png') -" + b.sourceX + "px -" + b.sourceY + "px";
      }
    }
    b = this.Ro();
    if (this.ti !== b) {
      this.ti = b;
      this.button.className = b;
      if (a && a.el) {
        this.om.innerHTML = "正在搜索中...";
      }
    }
  };
  TreasureLootView.prototype.Ro = function () {
    return !this.lc || this.lc.Kg || this.lc.el ? "lootButtonDisabled centeredElement" : "lootButton centeredElement";
  };
  DungeonRowView.prototype.reset = function () {
    this.ui = null;
    if (this.ua) {
      this.upgradeButton.reset();
    }
  };
  DungeonRowView.prototype.ct = function (a) {
    var b = !this.ua;
    this.ua = a;
    this.yr.ct(this.ua);
    this.upgradeButton.Rc(this.yr);
    this.mw = this.pu = -1;
    this.Gu = this.Bk = this.Qv = "";
    if (b) {
      this.upgradeButton.reset();
    }
  };
  DungeonRowView.prototype.qi = function () {
    var a = this.lh;
    this.Co = a.insertCell(0);
    this.Co.style.width = "50px";
    this.Co.style.padding = "0";
    this.Co.style.textAlign = "center";
    this.wr = createElement("img", this.Co, null, "terrainImage");
    this.wr.src = "images/Transparent.gif";
    if (this.ua) {
      var b = game.terrainSprites.getSprite(this.ua.Fo);
      this.wr.style.background = "url('spritesheet/terrain.png') -" + b.sourceX + "px -" + b.sourceY + "px";
    }
    this.Vg = a.insertCell(1);
    this.Vg.style.width = "200px";
    this.mf = a.insertCell(2);
    this.mf.style.width = "200px";
    this.Gx = a.insertCell(3);
    this.Gx.style.width = "90px";
    this.px = a.insertCell(4);
    this.px.style.width = "200px";
    this.px.id = this.pB;
    this.Ix = a.insertCell(5);
    this.Ix.style.width = this.Ct + "px";
    this.upgradeButton = new UpgradeButtonView(this.pB, this.yr, this.lh.rowIndex, true);
    this.cj = createElement("div", this.Ix, null, null);
    this.cj.style.position = "relative";
    this.cj.style.border = "1px solid #2c2c50";
    this.cj.style.height = "15px";
    this.cj.style.width = this.Ct + "px";
    this.sh = createElement("div", this.cj, null, null);
    this.sh.style.position = "absolute";
    this.sh.style.top = "0";
    this.sh.style.left = "0";
    this.sh.style.backgroundColor = "#F00";
    this.sh.style.height = "15px";
    this.sh.style.width = "0px";
    this.ai = createElement("div", this.cj, null, null);
    this.ai.style.position = "absolute";
    this.ai.style.textAlign = "center";
    this.ai.style.top = "0";
    this.ai.style.left = "0";
    this.ai.style.height = "15px";
    this.ai.style.width = "100%";
    this.ai.style.zIndex = "10";
    this.Bt = true;
  };
  DungeonRowView.prototype.render = function () {
    if (this.ua) {
      var a = this.ua.discovered,
        b = this.ua.cleared,
        c = this.ua.dungeonName,
        d = this.ua.zj.castleName,
        f = this.ua.isFarm,
        g;
      g = this.ua;
      g = g.isFarm ? g.cleared ? "等待中" : g.discovered && !g.cleared ? "收获中" : "收获" : g.cleared ? "已清空" : g.discovered && !g.cleared ? "探索中" : "已探索?";
      var h;
      h = this.ua;
      h = h.cleared ? Math.max(0, Math.min(100, 100 * (game.state.turnNumber - h.clearedTurn) / 1500 | 0)) : 0;
      var l;
      l = this.ua;
      l = l.cleared ? 0 : Math.max(0, Math.min(100, 100 * (game.state.turnNumber - l.farmStartTurn) / 1200 | 0));
      a = a && (f || b);
      if (this.ui !== this.ua) {
        this.ui = this.ua;
        f = game.terrainSprites.getSprite(this.ua.Fo);
        this.wr.style.background = "url('spritesheet/terrain.png') -" + f.sourceX + "px -" + f.sourceY + "px";
      }
      if (this.Bk !== c) {
        this.Bk = c;
        this.Vg.innerHTML = c;
      }
      if (this.Gu !== d) {
        this.Gu = d;
        this.mf.innerHTML = d;
      }
      if (this.Qv !== g) {
        this.Qv = g;
        this.Gx.innerHTML = g;
      }
      if (this.Bt !== a) {
        if (this.Bt = a) {
          showElement(this.cj);
        } else {
          hideElement(this.cj);
        }
      }
      if (a) {
        if (b) {
          if (this.pu !== h) {
            this.pu = h;
            b = h / 100 * this.Ct | 0;
            this.sh.style.width = b + "px";
            this.sh.style.backgroundColor = "#F00";
            this.ai.innerHTML = "地牢再次受到侵袭 " + h + "%";
          }
        } else {
          if (this.mw !== l) {
            this.mw = l;
            b = l / 100 * this.Ct | 0;
            this.sh.style.width = b + "px";
            this.sh.style.backgroundColor = "#080";
            this.ai.innerHTML = "收获地牢 " + l + "%";
          }
        }
      }
      if (this.ua) {
        refreshUpgradeAvailability(this.yr);
        this.upgradeButton.render();
      }
    }
  };
  DungeonListView.prototype = new TabView();
  DungeonListView.prototype.reset = function () {
    this.rf.length = 0;
    clearElementById(this.elementId);
    this.bf = null;
  };
  DungeonListView.prototype.update = function () {
    if (!this.bf) {
      this.pf();
    }
    var a = getDungeonList(this);
    if (a.length !== this.rf.length) {
      this.mk(a.length);
    }
    var b;
    for (b = 0; b < this.rf.length; b++) {
      if (this.rf[b].ua !== a[b]) {
        this.rf[b].ct(a[b]);
      }
      this.rf[b].render();
    }
  };
  DungeonListView.prototype.mk = function (a) {
    for (; this.rf.length > a;) {
      this.bf.deleteRow(-1);
      this.rf.splice(this.rf.length - 1, 1);
    }
    for (; this.rf.length < a;) {
      this.rf.push(new DungeonRowView(this.bf.insertRow(this.rf.length + 1), this.dw));
    }
  };
  DungeonListView.prototype.pf = function () {
    var a = this.elementId;
    clearElementById(a);
    var b = getDungeonList(this),
      c;
    this.bf = createElement("table", getElement(a), null, "monsterTable");
    this.Ri(this.bf.insertRow(0));
    for (c = 0; c < b.length; c++) {
      a = new DungeonRowView(this.bf.insertRow(c + 1), this.dw);
      a.ct(b[c]);
      this.rf.push(a);
    }
  };
  DungeonListView.prototype.Ri = function (a) {
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
    var a = game.dungeons.uj.length,
      b = game.dungeons.Ge.length,
      c = game.dungeons.ze.length,
      d = game.dungeons.dg.length;
    if (this.nz !== a) {
      this.nz = a;
      this.nr.label = getDungeonTabLabel(0, a);
    }
    if (this.aA !== b) {
      this.aA = b;
      this.zw.label = getDungeonTabLabel(1, b);
    }
    if (this.Uy !== c) {
      this.Uy = c;
      this.qu.label = getDungeonTabLabel(2, c);
    }
    if (this.Hz !== d) {
      this.Hz = d;
      this.qx.label = getDungeonTabLabel(3, d);
    }
    updateChildViews(this);
  };
}
