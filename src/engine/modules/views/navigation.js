/** 游戏导航、分页及暂停。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { CompositeView, View, resetChildViews, updateChildViews } from "./base.js";
import { game } from "../runtime/game.js";
import { clearElementById, createElement, getElement, hideElement, showElement } from "./dom.js";
export function GameView() {
  this.elementId = "gameContainer";
  this.visible = true;
  this.um = [0, 0, 0, 0, 0];
  this.tabStates = [];
  this.panels = [];
  this.tabBar = null;
}
export function PauseView() {
  this.Vu = !game.paused;
  this.sl = null;
  this.elementId = "pauseButtonContainer";
  this.visible = true;
}
export function bindPauseButton(a) {
  a.sl = getElement("pauseButton");
  a.sl.onmouseup = function () {
    game.paused = !game.paused;
    return false;
  };
}
export function TabState(a, b) {
  this.label = a;
  this.enabled = this.initiallyEnabled = b;
  this.highlighted = this.selected = false;
}
export function TabButtonView(a) {
  this.tabState = a;
  this.tt = this.Kl = null;
  this.enabled = !a.initiallyEnabled;
  this.selected = !a.selected;
  this.highlighted = !a.highlighted;
  this.gv = null;
}
export function mountTabButton(a, b, c) {
  a.Kl = createElement("li", b, null, null);
  if (!a.enabled) {
    hideElement(a.Kl);
  }
  a.Kl.className = a.selected ? "selectedTab" : "";
  a.tt = createElement("a", a.Kl, null, null);
  a.tt.innerHTML = a.tabState.label;
  a.tt.onclick = function () {
    var b = a.tabState,
      f;
    for (f = 0; f < c.tabs.length; f++) {
      c.tabs[f].selected = c.tabs[f] === b;
    }
    return false;
  };
}
export function TabBar(a) {
  this.elementId = a;
  this.tabs = [];
  this.Ll = [];
}
export function addTab(a, b) {
  a.tabs.push(b);
}
export function mountTabBar(a) {
  clearElementById(a.elementId);
  var b = getElement(a.elementId);
  if (b) {
    b = createElement("ul", /** @type {any} */ (b), null, null);
    var c;
    var d;
    if (0 < a.Ll.length) {
      a.Ll.length = 0;
    }
    for (d = 0; d < a.tabs.length; d++) {
      c = new TabButtonView(a.tabs[d]);
      mountTabButton(c, b, a);
      a.Ll.push(c);
    }
  }
}
export function TabView() {
  this.tabState = null;
}
export function initializeViewsNavigation() {
  GameView.prototype = new CompositeView();
  GameView.prototype.onGameWon = function () {
    var a;
    for (a = 0; a < this.panels.length; a++) {
      this.panels[a].onGameWon();
    }
  };
  GameView.prototype.onOfflineStart = function () {
    if (!game.gameWon && game.partyCreated) {
      var a;
      for (a = 0; a < this.panels.length; a++) {
        this.panels[a].onOfflineStart();
      }
    }
  };
  GameView.prototype.onOfflineFinish = function () {
    if (!game.gameWon && game.partyCreated) {
      var a;
      for (a = 0; a < this.panels.length; a++) {
        this.panels[a].onOfflineFinish();
      }
    }
  };
  GameView.prototype.Js = function () {
    this.tabBar.Js();
    var a;
    for (a = 0; a < this.um.length; a++) {
      this.um[a] = 0;
    }
  };
  GameView.prototype.reset = function () {
    var a;
    for (a = 0; a < this.um.length; a++) {
      this.um[a] = 0;
    }
    resetChildViews(this);
  };
  GameView.prototype.update = function () {
    var a, b, c;
    for (a = 0; a < game.state.adventurers.length; a++) {
      b = game.state.adventurers[a];
      c = (/** @type {any} */ (this)).tw(b);
      if (this.um[a] !== c) {
        this.um[a] = c;
        b = b.classDefinition.shortName;
        if (0 < c) {
          this.tabStates[a].label = b + " " + c;
          this.tabStates[a].highlighted = true;
        } else {
          this.tabStates[a].label = b;
          this.tabStates[a].highlighted = false;
        }
      }
    }
    updateChildViews(this);
  };
  GameView.prototype.tw = function (a) {
    return a.hasUnspentSkills ? a.skillPoints + a.initialSpellSkillPoint : 0;
  };
  PauseView.prototype = new View();
  PauseView.prototype.update = function () {
    if (!this.sl) {
      bindPauseButton(this);
    }
    if (this.Vu != game.paused) {
      if (this.Vu = game.paused) {
        this.sl.innerHTML = "恢复";
        this.sl.className = "ownedUpgradeButton";
      } else {
        this.sl.innerHTML = "暂停";
        this.sl.className = "upgradeButton";
      }
    }
  };
  TabButtonView.prototype.reset = function () {
    this.gv = null;
  };
  TabButtonView.prototype.render = function () {
    var a = this.tabState.enabled;
    if (this.enabled !== a) {
      if (this.enabled = a) {
        showElement(this.Kl);
      } else {
        hideElement(this.Kl);
      }
    }
    if (a) {
      a = this.tabState.label;
      if (this.gv !== a) {
        this.gv = a;
        this.tt.innerHTML = a;
      }
      var a = this.tabState.selected,
        b = this.tabState.highlighted;
      if (this.selected != a || this.highlighted != b) {
        this.selected = a;
        this.highlighted = b;
        this.Kl.className = a ? b ? "selectedTab tabHighlighted" : "selectedTab" : b ? "tabHighlighted" : "";
      }
    }
  };
  TabBar.prototype.reset = function () {
    mountTabBar(this);
  };
  TabBar.prototype.render = function () {
    var a;
    for (a = 0; a < this.Ll.length; a++) {
      this.Ll[a].render();
    }
  };
  TabBar.prototype.Js = function () {
    var a, b;
    for (a = 0; a < this.Ll.length; a++) {
      b = this.Ll[a].tabState;
      b.enabled = b.initiallyEnabled;
      b.highlighted = false;
      b.selected = 0 === a;
    }
  };
  TabView.prototype = new CompositeView();
  TabView.prototype.update = function () {
    if (this.tabState.enabled && this.tabState.selected) {
      updateChildViews(this);
    }
  };
  TabView.prototype.isVisible = function () {
    return this.tabState.enabled && this.tabState.selected;
  };
  TabView.prototype.onGameWon = function () {};
  TabView.prototype.onOfflineStart = function () {};
  TabView.prototype.onOfflineFinish = function () {};
}
