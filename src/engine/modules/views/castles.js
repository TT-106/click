// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 城堡地图、列表与状态。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { canAttackCastle, findCastle } from "../world/regions.js";
import { game } from "../runtime/game.js";
import { View, addChildView, resetChildViews } from "./base.js";
import { appendHeaderCell, clearElementById, createElement, getElement } from "./dom.js";
import { TabView } from "./navigation.js";
export function getCastleStatusColor(a) {
  return a.$b ? "#222" : a.conquered ? "#080" : canAttackCastle(a) ? game.monsterCatalog.fc >= a.requiredMonsterLevel ? "#850" : "#A30" : a.ye ? "#A80" : "#AAA";
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
  this.$e = null;
  this.nf = [];
}
export function CastleRowView(a) {
  this.lh = a;
  this.kd = this.pb = this.ng = this.mf = this.xc = null;
  this.Us = 120;
  this.Rv = this.Cu = this.fb = "";
  this.Kv = 0;
  this.qi();
}
export function setCastleRowModel(a, b) {
  a.xc = b;
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
      this.pf();
    }
    var a;
    a = game.castles.cm;
    if (this.Fu != a) {
      this.Fu = a;
      a = game.regions;
      var b,
        c,
        d = a.Rh + a.Eh - a.Rh,
        f = a.Sh + a.Eh - a.Sh,
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
  CastleMapView.prototype.pf = function () {
    var a = this.elementId;
    clearElementById(a);
    var b = game.regions,
      c = b.Rh,
      d = b.Sh,
      f = b.Rh + b.Eh,
      g = b.Sh + b.Eh,
      h;
    this.ws = createElement("table", getElement(a), null, null);
    for (var a = f - c, d = g - d, l, g = 0; g < a; g++) {
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
    this.nf.length = 0;
    clearElementById(this.elementId);
    this.$e = null;
  };
  CastleTableView.prototype.update = function () {
    if (!this.$e) {
      this.pf();
    }
    var a = game.castles.pd;
    if (a.length !== this.nf.length) {
      this.mk(a.length);
    }
    var b;
    for (b = 0; b < this.nf.length; b++) {
      if (this.nf[b].xc !== a[b]) {
        setCastleRowModel(this.nf[b], a[b]);
      }
      this.nf[b].render();
    }
  };
  CastleTableView.prototype.mk = function (a) {
    for (; this.nf.length > a;) {
      this.$e.deleteRow(-1);
      this.nf.splice(this.nf.length - 1, 1);
    }
    for (; this.nf.length < a;) {
      this.nf.push(new CastleRowView(this.$e.insertRow(this.nf.length + 1)));
    }
  };
  CastleTableView.prototype.pf = function () {
    var a = this.elementId;
    clearElementById(a);
    var b = game.castles.pd,
      c;
    this.$e = createElement("table", getElement(a), null, "monsterTable");
    this.Ri(this.$e.insertRow(0));
    for (c = 0; c < b.length; c++) {
      a = new CastleRowView(this.$e.insertRow(c + 1));
      setCastleRowModel(a, b[c]);
      this.nf.push(a);
    }
  };
  CastleTableView.prototype.Ri = function (a) {
    appendHeaderCell(a).innerHTML = "名称";
    appendHeaderCell(a).innerHTML = "状态";
  };
  CastleRowView.prototype.reset = function () {};
  CastleRowView.prototype.qi = function () {
    var a = this.lh;
    this.mf = a.insertCell(0);
    this.mf.style.width = "240px";
    this.ng = a.insertCell(1);
    this.ng.style.width = this.Us + "px";
    this.ng.style.paddingLeft = "5px";
    this.ng.style.paddingRight = "5px";
    a = createElement("div", this.ng, null, null);
    a.style.position = "relative";
    a.style.border = "1px solid #2c2c50";
    a.style.height = "15px";
    a.style.width = this.Us + "px";
    this.pb = createElement("div", a, null, null);
    this.pb.style.position = "absolute";
    this.pb.style.top = "0";
    this.pb.style.left = "0";
    this.pb.style.backgroundColor = "#F00";
    this.pb.style.height = "15px";
    this.pb.style.width = "0px";
    this.kd = createElement("div", a, null, null);
    this.kd.style.position = "absolute";
    this.kd.style.textAlign = "center";
    this.kd.style.top = "0";
    this.kd.style.left = "0";
    this.kd.style.height = "15px";
    this.kd.style.width = "100%";
    this.kd.style.zIndex = "10";
  };
  CastleRowView.prototype.render = function () {
    if (this.xc) {
      var a = this.xc.castleName;
      if (this.fb !== a) {
        this.fb = a;
        this.mf.innerHTML = a;
      }
      a = getCastleStatusColor(this.xc);
      if (this.Cu != a) {
        this.Cu = a;
        this.pb.style.backgroundColor = a;
      }
      a = this.xc;
      a = a.$b ? "未解锁" : a.conquered ? "已征服" : canAttackCastle(a) ? game.monsterCatalog.fc >= a.requiredMonsterLevel ? "准备攻击" : "怪物等级" + a.requiredMonsterLevel : a.ye ? "计划攻击" : "地牢" + a.yk + " / " + a.Ab.length;
      if (this.Rv != a) {
        this.Rv = a;
        this.kd.innerHTML = a;
      }
      a = this.xc;
      if (a.$b) {
        a = 0;
      } else if (a.conquered || canAttackCastle(a) || a.ye || a.Bj) {
        a = this.Us;
      } else {
        var a = this.xc.yk,
          b = this.xc.Ab,
          a = 0 === b.length ? 1 : Math.min(1, a / b.length),
          a = this.Us * a | 0;
      }
      if (this.Kv != a) {
        this.Kv = a;
        this.pb.style.width = a + "px";
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
