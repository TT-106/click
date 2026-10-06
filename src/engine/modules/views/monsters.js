import { spriteBackground } from '../rendering/preview.js';
/** 怪物升级与图鉴。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { View, addChildView, resetChildViews, updateChildViews } from "./base.js";
import { appendHeaderCell, clearElement, clearElementById, createElement, getElement, hideElement, setElementHtml } from "./dom.js";
import { formatAmount, formatGroupedAmount } from "../core/math.js";
import { escapeHtmlText } from "../core/html-text.js";
import { VISIBLE_MONSTER_LEVELS, globalUpgradeDefinitions, monsterUpgradeCollection } from "../content/balance.js";
import { TabBar, TabState, TabView, addTab } from "./navigation.js";
import { getMonsterTypesForLevel } from "../combat/encounters.js";
import { UpgradeListView } from "./upgrade-details.js";
/** 怪物图鉴视图所需的两个依赖由组合根注入（statistics / points / progression.achievements /
 *  views.achievements 已是同一形状）：目录对象 game.monsterCatalog 在 runtime/game.js 里
 *  只构造一次、从不整体重新赋值（.monsterCatalog = 在 src/ 内 0 处），会话状态同理，
 *  所以按引用绑定是安全的；字段值（minUnlockedLevel 等）随游戏进程变化，读的始终是同一对象。
 *  未绑定就用到会立刻抛，避免"装配漏一步"退化成静默的 undefined 读取。 */
var boundMonsterCatalog = null;
var boundSessionState = null;
export function bindMonsterViews(monsterCatalog, state) {
  boundMonsterCatalog = monsterCatalog;
  boundSessionState = state;
}
function monsterCatalogRef() {
  if (!boundMonsterCatalog) {
    throw new Error('怪物图鉴尚未绑定怪物目录：请在组合根调用 bindMonsterViews(game.monsterCatalog, game.state)');
  }
  return boundMonsterCatalog;
}
function monsterViewsState() {
  if (!boundSessionState) {
    throw new Error('怪物图鉴尚未绑定会话状态：请在组合根调用 bindMonsterViews(game.monsterCatalog, game.state)');
  }
  return boundSessionState;
}
export function MonsterUpgradeSummaryView() {
  this.elementId = "monsterKillCountContainer";
  this.visible = true;
  this.killCountPanelId = "killCountPanel";
  this.cachedKills = -1;
}
export function MonsterLevelView() {
  this.elementId = "monsterUpgradeValuesContainer";
  this.visible = true;
  this.cachedMinGoldPerDrop = this.cachedMaxGoldPerDrop = this.cachedTreasureChance = this.cachedPotionDropChance = this.cachedScrollDropChance = this.cachedGoldDropChance = this.cachedHigherLevelItemChance = this.cachedItemQualityChance = this.cachedMinMonsters = this.cachedMaxMonsters = this.cachedItemDropChance = -1;
}
/** @this {MonsterRowView & { createRowCells: () => void }} */
export function MonsterRowView(rowElement, monsterType) {
  this.rowElement = rowElement;
  this.monsterType = monsterType;
  this.progressTextElement = this.progressFillElement = this.progressCell = this.defenceRatingCell = this.attackRatingCell = this.armorCell = this.damageCell = this.healthCell = this.experienceCell = this.rankCell = this.killCountCell = this.nameCell = null;
  this.cachedRank = this.cachedLevel = this.cachedFillWidth = this.cachedKills = -1;
  this.progressBarWidth = 80;
  this.spriteImage = null;
  this.createRowCells();
}
export function MonsterLevelTabView(tabState, elementId) {
  this.elementId = elementId;
  this.tabState = tabState;
  this.tableElement = null;
  this.cachedLevel = this.level = -1;
  this.rowViews = [];
}
export function MonsterView(tabState) {
  this.elementId = "monstersTabContent";
  this.tabState = tabState;
  this.levelTables = [];
  for (var levelTableIndex = 0; levelTableIndex < VISIBLE_MONSTER_LEVELS; levelTableIndex++) {
    this.levelTables.push(mountMonsterTable(levelTableIndex, levelTableIndex + 1));
  }
  var monsterTabBar = new TabBar("monsterTabMenu");
  for (levelTableIndex = 0; levelTableIndex < this.levelTables.length; levelTableIndex++) {
    addTab(monsterTabBar, this.levelTables[levelTableIndex].tabState);
  }
  addChildView(this, new MonsterUpgradeSummaryView());
  addChildView(this, new MonsterLevelView());
  addChildView(this, new UpgradeListView("monsterUpgradeButtonsContainer", monsterUpgradeCollection, false));
  addChildView(this, monsterTabBar);
  for (levelTableIndex = 0; levelTableIndex < this.levelTables.length; levelTableIndex++) {
    addChildView(this, this.levelTables[levelTableIndex].view);
  }
}
export function mountMonsterTable(tableIndex, monsterLevel) {
  var levelTable = {},
    isDefaultLevelTab = 1 === monsterLevel;
  levelTable.tabState = new TabState("等级 " + monsterLevel, isDefaultLevelTab);
  if (isDefaultLevelTab) {
    levelTable.tabState.selected = true;
  }
  var containerElementId = "monstersTabContainer" + tableIndex,
    containerElement = getElement(containerElementId);
  if (containerElement) {
    clearElement(containerElement);
  } else {
    containerElement = createElement("div", getElement("monsterTabContainerParent"), containerElementId, "tabContainer scrollingContainer");
    if (!isDefaultLevelTab) {
      hideElement(containerElement);
    }
  }
  levelTable.view = new MonsterLevelTabView(levelTable.tabState, containerElementId);
  levelTable.view.level = monsterLevel;
  return levelTable;
}
export function updateMonsterTabLabels(monsterView) {
  var displayedLevel,
    tabLevel = monsterCatalogRef().minUnlockedLevel,
    levelTable,
    levelTableIndex;
  for (levelTableIndex = 0; levelTableIndex < monsterView.levelTables.length; levelTableIndex++) {
    levelTable = monsterView.levelTables[levelTableIndex];
    displayedLevel = levelTable.view.level;
    if (displayedLevel !== tabLevel) {
      levelTable.tabState.label = "等级 " + tabLevel;
      levelTable.view.level = tabLevel;
    }
    tabLevel++;
  }
}
export function refreshMonsterTabVisibility(monsterView) {
  var monsterCatalog = monsterCatalogRef(),
    levelTableIndex,
    displayedLevel,
    levelTable,
    needsNewSelection = false;
  for (levelTableIndex = 0; levelTableIndex < monsterView.levelTables.length; levelTableIndex++) {
    levelTable = monsterView.levelTables[levelTableIndex];
    displayedLevel = levelTable.view.level;
    var enabled = monsterCatalog.minUnlockedLevel <= displayedLevel && displayedLevel <= monsterCatalog.maxUnlockedLevel;
    levelTable.tabState.enabled = enabled;
    if (!enabled && levelTable.tabState.selected) {
      levelTable.tabState.selected = false;
      needsNewSelection = true;
    }
  }
  if (needsNewSelection) {
    for (levelTableIndex = 0; levelTableIndex < monsterView.levelTables.length; levelTableIndex++) {
      if (monsterView.levelTables[levelTableIndex].tabState.enabled) {
        monsterView.levelTables[levelTableIndex].tabState.selected = true;
        break;
      }
    }
  }
}
export function initializeViewsMonsters() {
  MonsterUpgradeSummaryView.prototype = new View();
  MonsterUpgradeSummaryView.prototype.reset = function () {
    this.cachedKills = -1;
  };
  MonsterUpgradeSummaryView.prototype.update = function () {
    var killCount = monsterViewsState().party.kills;
    if (killCount !== this.cachedKills) {
      this.cachedKills = killCount;
      setElementHtml(this.killCountPanelId, "" + formatGroupedAmount(killCount));
    }
  };
  MonsterLevelView.prototype = new View();
  MonsterLevelView.prototype.reset = function () {};
  MonsterLevelView.prototype.update = function () {
    if (this.cachedGoldDropChance !== globalUpgradeDefinitions.goldDropChance.currentValue) {
      this.cachedGoldDropChance = globalUpgradeDefinitions.goldDropChance.currentValue;
      setElementHtml("goldDropChance", this.cachedGoldDropChance + "%");
    }
    if (this.cachedMaxGoldPerDrop !== globalUpgradeDefinitions.maxGoldPerDrop.currentValue) {
      this.cachedMaxGoldPerDrop = globalUpgradeDefinitions.maxGoldPerDrop.currentValue;
      setElementHtml("maxGoldPerDrop", this.cachedMaxGoldPerDrop + "");
    }
    if (this.cachedMinGoldPerDrop !== globalUpgradeDefinitions.minGoldPerDrop.currentValue) {
      this.cachedMinGoldPerDrop = globalUpgradeDefinitions.minGoldPerDrop.currentValue;
      setElementHtml("minGoldPerDrop", this.cachedMinGoldPerDrop + "");
    }
    if (this.cachedItemDropChance !== globalUpgradeDefinitions.itemDropChance.currentValue) {
      this.cachedItemDropChance = globalUpgradeDefinitions.itemDropChance.currentValue;
      setElementHtml("itemDropChance", this.cachedItemDropChance + "%");
    }
    if (this.cachedScrollDropChance !== globalUpgradeDefinitions.scrollDropChance.currentValue) {
      this.cachedScrollDropChance = globalUpgradeDefinitions.scrollDropChance.currentValue;
      setElementHtml("scrollDropChance", this.cachedScrollDropChance + "%");
    }
    if (this.cachedPotionDropChance !== globalUpgradeDefinitions.potionDropChance.currentValue) {
      this.cachedPotionDropChance = globalUpgradeDefinitions.potionDropChance.currentValue;
      setElementHtml("potionDropChance", this.cachedPotionDropChance + "%");
    }
    if (this.cachedHigherLevelItemChance !== globalUpgradeDefinitions.higherLevelItemChance.currentValue) {
      this.cachedHigherLevelItemChance = globalUpgradeDefinitions.higherLevelItemChance.currentValue;
      setElementHtml("itemLevelBonus", this.cachedHigherLevelItemChance + "%");
    }
    if (this.cachedItemQualityChance !== globalUpgradeDefinitions.itemQualityChance.currentValue) {
      this.cachedItemQualityChance = globalUpgradeDefinitions.itemQualityChance.currentValue;
      setElementHtml("itemRarityChance", this.cachedItemQualityChance + "%");
    }
    if (this.cachedTreasureChance !== globalUpgradeDefinitions.treasureChance.currentValue) {
      this.cachedTreasureChance = globalUpgradeDefinitions.treasureChance.currentValue;
      setElementHtml("treasureChestChance", this.cachedTreasureChance + "%");
    }
    if (this.cachedMaxMonsters !== globalUpgradeDefinitions.maxMonsters.currentValue) {
      this.cachedMaxMonsters = globalUpgradeDefinitions.maxMonsters.currentValue;
      setElementHtml("maxMonstersPerRoom", this.cachedMaxMonsters + "");
    }
    if (this.cachedMinMonsters !== globalUpgradeDefinitions.minMonsters.currentValue) {
      this.cachedMinMonsters = globalUpgradeDefinitions.minMonsters.currentValue;
      setElementHtml("minMonstersPerRoom", this.cachedMinMonsters + "");
    }
  };
  MonsterRowView.prototype.setMonsterType = function (monsterType) {
    this.monsterType = monsterType;
  };
  MonsterRowView.prototype.createRowCells = function () {
    var rowElement = this.rowElement,
      monsterSprite = this.monsterType.sprite,
      iconCell = rowElement.insertCell(0);
    iconCell.style.width = "50px";
    iconCell.style.padding = "0";
    iconCell.style.textAlign = "center";
    this.spriteImage = createElement("img", iconCell, null, "characterImage");
    this.spriteImage.src = "images/Transparent.gif";
    this.spriteImage.style.background = spriteBackground(monsterSprite, 'monster');
    this.spriteImage.style.height = "30px";
    this.nameCell = rowElement.insertCell(1);
    this.nameCell.style.width = "200px";
    this.nameCell.innerHTML = escapeHtmlText(this.monsterType.getName());
    this.experienceCell = rowElement.insertCell(2);
    this.experienceCell.style.width = "80px";
    this.experienceCell.style.textAlign = "right";
    this.experienceCell.style.paddingRight = "5px";
    this.healthCell = rowElement.insertCell(3);
    this.healthCell.style.width = "80px";
    this.healthCell.style.textAlign = "right";
    this.healthCell.style.paddingRight = "5px";
    this.damageCell = rowElement.insertCell(4);
    this.damageCell.style.width = "80px";
    this.damageCell.style.textAlign = "right";
    this.damageCell.style.paddingRight = "5px";
    this.armorCell = rowElement.insertCell(5);
    this.armorCell.style.width = "80px";
    this.armorCell.style.textAlign = "right";
    this.armorCell.style.paddingRight = "5px";
    this.attackRatingCell = rowElement.insertCell(6);
    this.attackRatingCell.style.width = "80px";
    this.attackRatingCell.style.textAlign = "right";
    this.attackRatingCell.style.paddingRight = "5px";
    this.defenceRatingCell = rowElement.insertCell(7);
    this.defenceRatingCell.style.width = "80px";
    this.defenceRatingCell.style.textAlign = "right";
    this.defenceRatingCell.style.paddingRight = "5px";
    this.killCountCell = rowElement.insertCell(8);
    this.killCountCell.style.width = "80px";
    this.killCountCell.style.textAlign = "right";
    this.killCountCell.style.paddingRight = "5px";
    this.rankCell = rowElement.insertCell(9);
    this.rankCell.style.width = "80px";
    this.rankCell.style.textAlign = "right";
    this.rankCell.style.paddingRight = "5px";
    this.progressCell = rowElement.insertCell(10);
    this.progressCell.style.width = this.progressBarWidth + "px";
    this.progressCell.style.paddingLeft = "5px";
    this.progressCell.style.paddingRight = "5px";
    var progressBarElement = createElement("div", this.progressCell, null, null);
    progressBarElement.style.position = "relative";
    progressBarElement.style.border = "1px solid #2c2c50";
    progressBarElement.style.height = "15px";
    progressBarElement.style.width = this.progressBarWidth + "px";
    this.progressFillElement = createElement("div", progressBarElement, null, null);
    this.progressFillElement.style.position = "absolute";
    this.progressFillElement.style.top = "0";
    this.progressFillElement.style.left = "0";
    this.progressFillElement.style.backgroundColor = "#F00";
    this.progressFillElement.style.height = "15px";
    this.progressFillElement.style.width = "0px";
    this.progressTextElement = createElement("div", progressBarElement, null, null);
    this.progressTextElement.style.position = "absolute";
    this.progressTextElement.style.textAlign = "center";
    this.progressTextElement.style.top = "0";
    this.progressTextElement.style.left = "0";
    this.progressTextElement.style.height = "15px";
    this.progressTextElement.style.width = "100%";
    this.progressTextElement.style.zIndex = "10";
  };
  MonsterRowView.prototype.reset = function () {
    this.cachedFillWidth = this.cachedKills = this.cachedLevel = this.cachedRank = -1;
  };
  MonsterRowView.prototype.render = function () {
    var rankProgressKills = this.monsterType.rankProgressKills,
      rankKillThreshold = this.monsterType.rankKillThreshold,
      killCount = this.monsterType.killCount,
      progressFraction = Math.min(1, rankProgressKills / rankKillThreshold),
      fillWidth = this.progressBarWidth * progressFraction | 0;
    if (this.cachedLevel != this.monsterType.level || this.cachedRank != this.monsterType.rank) {
      this.experienceCell.innerHTML = formatAmount(this.monsterType.experienceReward);
      this.healthCell.innerHTML = formatAmount(this.monsterType.maxHealth);
      this.damageCell.innerHTML = formatAmount(this.monsterType.damage);
      this.armorCell.innerHTML = formatAmount(this.monsterType.armor);
      this.attackRatingCell.innerHTML = formatAmount(this.monsterType.attackRating);
      this.defenceRatingCell.innerHTML = formatAmount(this.monsterType.defenceRating);
      this.rankCell.innerHTML = formatAmount(this.monsterType.rank);
      if (this.cachedLevel != this.monsterType.level) {
        this.nameCell.innerHTML = escapeHtmlText(this.monsterType.getName());
        var monsterSprite = this.monsterType.sprite;
        this.spriteImage.style.background = spriteBackground(monsterSprite, 'monster');
      }
      this.cachedLevel = this.monsterType.level;
      this.cachedRank = this.monsterType.rank;
    }
    if (this.cachedKills !== killCount) {
      this.cachedKills = killCount;
      this.killCountCell.innerHTML = formatAmount(killCount);
    }
    if (this.cachedFillWidth !== fillWidth) {
      this.cachedFillWidth = fillWidth;
      this.progressFillElement.style.width = fillWidth + "px";
      this.progressTextElement.innerHTML = rankProgressKills > rankKillThreshold ? "最大" : formatAmount(rankProgressKills) + " / " + formatAmount(rankKillThreshold);
    }
  };
  MonsterLevelTabView.prototype = new TabView();
  MonsterLevelTabView.prototype.reset = function () {
    if (this.tableElement) {
      var rowIndex;
      for (rowIndex = 0; rowIndex < this.rowViews.length; rowIndex++) {
        this.rowViews[rowIndex].reset();
      }
    }
    this.level = -1;
    this.cachedLevel = -2;
  };
  /** @this {MonsterLevelTabView & { createDomElements: () => void }} */
  MonsterLevelTabView.prototype.update = function () {
    if (1 > this.level) {
      console.log("MonsterTableView.updateViewContents  monsterLevel=" + this.level);
    } else {
      if (this.tableElement) {
        if (this.cachedLevel !== this.level) {
          var monsterTypes = getMonsterTypesForLevel(monsterCatalogRef(), this.level),
            rowIndex;
          if (monsterTypes.length !== this.rowViews.length) {
            console.log("MonsterTableView.updateMonsterLevelRows length mismatch");
          } else {
            for (rowIndex = 0; rowIndex < this.rowViews.length; rowIndex++) {
              this.rowViews[rowIndex].setMonsterType(monsterTypes[rowIndex]);
            }
          }
        }
      } else {
        this.createDomElements();
      }
      this.cachedLevel = this.level;
      for (var renderRowIndex = 0; renderRowIndex < this.rowViews.length; renderRowIndex++) {
        this.rowViews[renderRowIndex].render();
      }
    }
  };
  /** @this {MonsterLevelTabView & { createHeaderRow: (row: HTMLTableRowElement) => void }} */
  MonsterLevelTabView.prototype.createDomElements = function () {
    var elementId = this.elementId;
    clearElementById(elementId);
    var containerElement = getElement(elementId),
      monsterTypes = getMonsterTypesForLevel(monsterCatalogRef(), this.level);
    this.tableElement = createElement("table", containerElement, null, "monsterTable");
    this.createHeaderRow(this.tableElement.insertRow(0));
    for (var rowIndex = 0; rowIndex < monsterTypes.length; rowIndex++) {
      this.rowViews.push(new MonsterRowView(this.tableElement.insertRow(rowIndex + 1), monsterTypes[rowIndex]));
    }
  };
  MonsterLevelTabView.prototype.createHeaderRow = function (headerRow) {
    var iconHeaderCell = appendHeaderCell(headerRow);
    iconHeaderCell.style.textAlign = "center";
    iconHeaderCell.style.padding = "0";
    iconHeaderCell.innerHTML = "图标";
    appendHeaderCell(headerRow).innerHTML = "怪物类型";
    var experienceHeaderCell = appendHeaderCell(headerRow);
    experienceHeaderCell.style.textAlign = "right";
    experienceHeaderCell.style.paddingRight = "5px";
    experienceHeaderCell.innerHTML = "经验";
    var healthHeaderCell = appendHeaderCell(headerRow);
    healthHeaderCell.style.textAlign = "right";
    healthHeaderCell.style.paddingRight = "5px";
    healthHeaderCell.innerHTML = "生命";
    var damageHeaderCell = appendHeaderCell(headerRow);
    damageHeaderCell.style.textAlign = "right";
    damageHeaderCell.style.paddingRight = "5px";
    damageHeaderCell.innerHTML = "伤害";
    var armorHeaderCell = appendHeaderCell(headerRow);
    armorHeaderCell.style.textAlign = "right";
    armorHeaderCell.style.paddingRight = "5px";
    armorHeaderCell.innerHTML = "护甲";
    var attackRatingHeaderCell = appendHeaderCell(headerRow);
    attackRatingHeaderCell.style.textAlign = "right";
    attackRatingHeaderCell.style.paddingRight = "5px";
    attackRatingHeaderCell.innerHTML = "攻击";
    var defenceRatingHeaderCell = appendHeaderCell(headerRow);
    defenceRatingHeaderCell.style.textAlign = "right";
    defenceRatingHeaderCell.style.paddingRight = "5px";
    defenceRatingHeaderCell.innerHTML = "防御";
    var killCountHeaderCell = appendHeaderCell(headerRow);
    killCountHeaderCell.style.textAlign = "right";
    killCountHeaderCell.style.paddingRight = "5px";
    killCountHeaderCell.innerHTML = "总计杀死";
    var rankHeaderCell = appendHeaderCell(headerRow);
    rankHeaderCell.style.textAlign = "right";
    rankHeaderCell.style.paddingRight = "5px";
    rankHeaderCell.innerHTML = "怪物等级";
    appendHeaderCell(headerRow).innerHTML = "进度";
  };
  MonsterView.prototype = new TabView();
  MonsterView.prototype.onGameWon = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  MonsterView.prototype.onOfflineFinish = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
  };
  MonsterView.prototype.onOfflineStart = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  MonsterView.prototype.reset = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
    updateMonsterTabLabels(this);
    refreshMonsterTabVisibility(this);
    resetChildViews(this);
  };
  MonsterView.prototype.update = function () {
    updateMonsterTabLabels(this);
    refreshMonsterTabVisibility(this);
    updateChildViews(this);
  };
}
