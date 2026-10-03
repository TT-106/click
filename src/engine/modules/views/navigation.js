/** 游戏导航、分页及暂停。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { CompositeView, View, resetChildViews, updateChildViews } from "./base.js";
import { clearElementById, createElement, getElement, hideElement, showElement } from "./dom.js";
/** @param {() => import('../characters/character.js').Character[]} readAdventurers
 * @param {() => boolean} canShowOfflineProgress */
export function GameView(readAdventurers, canShowOfflineProgress) {
  this.readAdventurers = readAdventurers;
  this.canShowOfflineProgress = canShowOfflineProgress;
  this.elementId = "gameContainer";
  this.visible = true;
  this.cachedSkillPoints = [0, 0, 0, 0, 0];
  this.tabStates = [];
  this.panels = [];
  this.tabBar = null;
}
/** @param {() => boolean} readPaused @param {() => void} togglePause */
export function PauseView(readPaused, togglePause) {
  this.readPaused = readPaused;
  this.togglePause = togglePause;
  this.cachedPaused = !readPaused();
  this.pauseButton = null;
  this.elementId = "pauseButtonContainer";
  this.visible = true;
}
export function bindPauseButton(pauseView) {
  pauseView.pauseButton = getElement("pauseButton");
  pauseView.pauseButton.onmouseup = function () {
    pauseView.togglePause();
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
  var container = getElement(tabBar.elementId);
  if (container) {
    var tabList = createElement("ul", container, null, null);
    var tabButtonView;
    var tabIndex;
    if (0 < tabBar.tabBarContainer.length) {
      tabBar.tabBarContainer.length = 0;
    }
    for (tabIndex = 0; tabIndex < tabBar.tabs.length; tabIndex++) {
      tabButtonView = new TabButtonView(tabBar.tabs[tabIndex]);
      mountTabButton(tabButtonView, tabList, tabBar);
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
    if (this.canShowOfflineProgress()) {
      var panelIndex;
      for (panelIndex = 0; panelIndex < this.panels.length; panelIndex++) {
        this.panels[panelIndex].onOfflineStart();
      }
    }
  };
  GameView.prototype.onOfflineFinish = function () {
    if (this.canShowOfflineProgress()) {
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
  /** @this {GameView & { getAvailableSkillPoints: (adventurer: import('../characters/character.js').Character) => number }} */
  GameView.prototype.update = function () {
    var adventurerIndex, adventurer, availableSkillPoints;
    const adventurers = this.readAdventurers();
    for (adventurerIndex = 0; adventurerIndex < adventurers.length; adventurerIndex++) {
      adventurer = adventurers[adventurerIndex];
      availableSkillPoints = this.getAvailableSkillPoints(adventurer);
      if (this.cachedSkillPoints[adventurerIndex] !== availableSkillPoints) {
        this.cachedSkillPoints[adventurerIndex] = availableSkillPoints;
        const shortName = adventurer.classDefinition.shortName;
        if (0 < availableSkillPoints) {
          this.tabStates[adventurerIndex].label = shortName + " " + availableSkillPoints;
          this.tabStates[adventurerIndex].highlighted = true;
        } else {
          this.tabStates[adventurerIndex].label = shortName;
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
    if (this.cachedPaused != this.readPaused()) {
      if (this.cachedPaused = this.readPaused()) {
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
    var enabled = this.tabState.enabled;
    if (this.enabled !== enabled) {
      if (this.enabled = enabled) {
        showElement(this.tabListItem);
      } else {
        hideElement(this.tabListItem);
      }
    }
    if (enabled) {
      var label = this.tabState.label;
      if (this.cachedLabel !== label) {
        this.cachedLabel = label;
        this.labelElement.innerHTML = label;
      }
      var selected = this.tabState.selected,
        highlighted = this.tabState.highlighted;
      if (this.selected != selected || this.highlighted != highlighted) {
        this.selected = selected;
        this.highlighted = highlighted;
        this.tabListItem.className = selected ? highlighted ? "selectedTab tabHighlighted" : "selectedTab" : highlighted ? "tabHighlighted" : "";
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
