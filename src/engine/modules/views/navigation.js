/** 游戏导航、分页及暂停。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { CompositeView, View, resetChildViews, updateChildViews } from "./base.js";
import { game } from "../runtime/game.js";
import { clearElementById, createElement, getElement, hideElement, showElement } from "./dom.js";
export function GameView() {
  this.elementId = "gameContainer";
  this.visible = true;
  this.cachedSkillPoints = [0, 0, 0, 0, 0];
  this.tabStates = [];
  this.panels = [];
  this.tabBar = null;
}
export function PauseView() {
  this.cachedPaused = !game.paused;
  this.pauseButton = null;
  this.elementId = "pauseButtonContainer";
  this.visible = true;
}
export function bindPauseButton(pauseView) {
  pauseView.pauseButton = getElement("pauseButton");
  pauseView.pauseButton.onmouseup = function () {
    game.paused = !game.paused;
    return false;
  };
}
export function TabState(label, initiallyEnabled) {
  this.label = label;
  this.enabled = this.initiallyEnabled = initiallyEnabled;
  this.highlighted = this.selected = false;
}
export function TabButtonView(tabState) {
  this.tabState = tabState;
  this.labelElement = this.tabListItem = null;
  this.enabled = !tabState.initiallyEnabled;
  this.selected = !tabState.selected;
  this.highlighted = !tabState.highlighted;
  this.cachedLabel = null;
}
export function mountTabButton(tabButtonView, tabListElement, tabBar) {
  tabButtonView.tabListItem = createElement("li", tabListElement, null, null);
  if (!tabButtonView.enabled) {
    hideElement(tabButtonView.tabListItem);
  }
  tabButtonView.tabListItem.className = tabButtonView.selected ? "selectedTab" : "";
  tabButtonView.labelElement = createElement("a", tabButtonView.tabListItem, null, null);
  tabButtonView.labelElement.innerHTML = tabButtonView.tabState.label;
  tabButtonView.labelElement.onclick = function () {
    var clickedTabState = tabButtonView.tabState,
      tabIndex;
    for (tabIndex = 0; tabIndex < tabBar.tabs.length; tabIndex++) {
      tabBar.tabs[tabIndex].selected = tabBar.tabs[tabIndex] === clickedTabState;
    }
    return false;
  };
}
export function TabBar(elementId) {
  this.elementId = elementId;
  this.tabs = [];
  this.tabBarContainer = [];
}
export function addTab(tabBar, tabState) {
  tabBar.tabs.push(tabState);
}
export function mountTabBar(tabBar) {
  clearElementById(tabBar.elementId);
  var b = getElement(tabBar.elementId);
  if (b) {
    b = createElement("ul", /** @type {any} */ (b), null, null);
    var tabButtonView;
    var tabIndex;
    if (0 < tabBar.tabBarContainer.length) {
      tabBar.tabBarContainer.length = 0;
    }
    for (tabIndex = 0; tabIndex < tabBar.tabs.length; tabIndex++) {
      tabButtonView = new TabButtonView(tabBar.tabs[tabIndex]);
      mountTabButton(tabButtonView, b, tabBar);
      tabBar.tabBarContainer.push(tabButtonView);
    }
  }
}
export function TabView() {
  this.tabState = null;
}
export function initializeViewsNavigation() {
  GameView.prototype = new CompositeView();
  GameView.prototype.onGameWon = function () {
    var panelIndex;
    for (panelIndex = 0; panelIndex < this.panels.length; panelIndex++) {
      this.panels[panelIndex].onGameWon();
    }
  };
  GameView.prototype.onOfflineStart = function () {
    if (!game.gameWon && game.partyCreated) {
      var panelIndex;
      for (panelIndex = 0; panelIndex < this.panels.length; panelIndex++) {
        this.panels[panelIndex].onOfflineStart();
      }
    }
  };
  GameView.prototype.onOfflineFinish = function () {
    if (!game.gameWon && game.partyCreated) {
      var panelIndex;
      for (panelIndex = 0; panelIndex < this.panels.length; panelIndex++) {
        this.panels[panelIndex].onOfflineFinish();
      }
    }
  };
  GameView.prototype.resetTabs = function () {
    this.tabBar.resetTabs();
    var adventurerIndex;
    for (adventurerIndex = 0; adventurerIndex < this.cachedSkillPoints.length; adventurerIndex++) {
      this.cachedSkillPoints[adventurerIndex] = 0;
    }
  };
  GameView.prototype.reset = function () {
    var adventurerIndex;
    for (adventurerIndex = 0; adventurerIndex < this.cachedSkillPoints.length; adventurerIndex++) {
      this.cachedSkillPoints[adventurerIndex] = 0;
    }
    resetChildViews(this);
  };
  GameView.prototype.update = function () {
    var adventurerIndex, b, availableSkillPoints;
    for (adventurerIndex = 0; adventurerIndex < game.state.adventurers.length; adventurerIndex++) {
      b = game.state.adventurers[adventurerIndex];
      availableSkillPoints = (/** @type {any} */ (this)).getAvailableSkillPoints(b);
      if (this.cachedSkillPoints[adventurerIndex] !== availableSkillPoints) {
        this.cachedSkillPoints[adventurerIndex] = availableSkillPoints;
        b = b.classDefinition.shortName;
        if (0 < availableSkillPoints) {
          this.tabStates[adventurerIndex].label = b + " " + availableSkillPoints;
          this.tabStates[adventurerIndex].highlighted = true;
        } else {
          this.tabStates[adventurerIndex].label = b;
          this.tabStates[adventurerIndex].highlighted = false;
        }
      }
    }
    updateChildViews(this);
  };
  GameView.prototype.getAvailableSkillPoints = function (adventurer) {
    return adventurer.hasUnspentSkills ? adventurer.skillPoints + adventurer.initialSpellSkillPoint : 0;
  };
  PauseView.prototype = new View();
  PauseView.prototype.update = function () {
    if (!this.pauseButton) {
      bindPauseButton(this);
    }
    if (this.cachedPaused != game.paused) {
      if (this.cachedPaused = game.paused) {
        this.pauseButton.innerHTML = "恢复";
        this.pauseButton.className = "ownedUpgradeButton";
      } else {
        this.pauseButton.innerHTML = "暂停";
        this.pauseButton.className = "upgradeButton";
      }
    }
  };
  TabButtonView.prototype.reset = function () {
    this.cachedLabel = null;
  };
  TabButtonView.prototype.render = function () {
    var a = this.tabState.enabled;
    if (this.enabled !== a) {
      if (this.enabled = a) {
        showElement(this.tabListItem);
      } else {
        hideElement(this.tabListItem);
      }
    }
    if (a) {
      a = this.tabState.label;
      if (this.cachedLabel !== a) {
        this.cachedLabel = a;
        this.labelElement.innerHTML = a;
      }
      var a = this.tabState.selected,
        highlighted = this.tabState.highlighted;
      if (this.selected != a || this.highlighted != highlighted) {
        this.selected = a;
        this.highlighted = highlighted;
        this.tabListItem.className = a ? highlighted ? "selectedTab tabHighlighted" : "selectedTab" : highlighted ? "tabHighlighted" : "";
      }
    }
  };
  TabBar.prototype.reset = function () {
    mountTabBar(this);
  };
  TabBar.prototype.render = function () {
    var tabButtonIndex;
    for (tabButtonIndex = 0; tabButtonIndex < this.tabBarContainer.length; tabButtonIndex++) {
      this.tabBarContainer[tabButtonIndex].render();
    }
  };
  TabBar.prototype.resetTabs = function () {
    var tabButtonIndex, tabState;
    for (tabButtonIndex = 0; tabButtonIndex < this.tabBarContainer.length; tabButtonIndex++) {
      tabState = this.tabBarContainer[tabButtonIndex].tabState;
      tabState.enabled = tabState.initiallyEnabled;
      tabState.highlighted = false;
      tabState.selected = 0 === tabButtonIndex;
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
