/** 怪物升级与图鉴。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { View, addChildView, resetChildViews, updateChildViews } from "./base.js";
import { game } from "../runtime/game.js";
import { appendHeaderCell, clearElement, clearElementById, createElement, getElement, hideElement, setElementHtml } from "./dom.js";
import { formatAmount, formatGroupedAmount } from "../core/math.js";
import { VISIBLE_MONSTER_LEVELS, globalUpgradeDefinitions, monsterUpgradeCollection } from "../content/balance.js";
import { TabBar, TabState, TabView, addTab } from "./navigation.js";
import { getMonsterTypesForLevel } from "../combat/encounters.js";
import { UpgradeListView } from "./upgrade-details.js";
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
export function MonsterRowView(a, b) {
  this.rowElement = a;
  this.monsterType = b;
  this.progressTextElement = this.progressFillElement = this.progressCell = this.defenceRatingCell = this.attackRatingCell = this.armorCell = this.damageCell = this.healthCell = this.experienceCell = this.rankCell = this.killCountCell = this.nameCell = null;
  this.cachedRank = this.cachedLevel = this.cachedFillWidth = this.cachedKills = -1;
  this.progressBarWidth = 80;
  this.spriteImage = null;
  (/** @type {any} */ (this)).createRowCells();
}
export function MonsterLevelTabView(a, b) {
  this.elementId = b;
  this.tabState = a;
  this.tableElement = null;
  this.cachedLevel = this.level = -1;
  this.rowViews = [];
}
export function MonsterView(a) {
  this.elementId = "monstersTabContent";
  this.tabState = a;
  this.levelTables = [];
  for (a = 0; a < VISIBLE_MONSTER_LEVELS; a++) {
    this.levelTables.push(mountMonsterTable(a, a + 1));
  }
  var b = new TabBar("monsterTabMenu");
  for (a = 0; a < this.levelTables.length; a++) {
    addTab(b, this.levelTables[a].tabState);
  }
  addChildView(this, new MonsterUpgradeSummaryView());
  addChildView(this, new MonsterLevelView());
  addChildView(this, new UpgradeListView("monsterUpgradeButtonsContainer", monsterUpgradeCollection, false));
  addChildView(this, b);
  for (a = 0; a < this.levelTables.length; a++) {
    addChildView(this, this.levelTables[a].view);
  }
}
export function mountMonsterTable(a, b) {
  var c = {},
    d = 1 === b;
  c.tabState = new TabState("等级 " + b, d);
  if (d) {
    c.tabState.selected = true;
  }
  var f = "monstersTabContainer" + a,
    g = getElement(f);
  if (g) {
    clearElement(g);
  } else {
    g = createElement("div", getElement("monsterTabContainerParent"), f, "tabContainer scrollingContainer");
    if (!d) {
      hideElement(g);
    }
  }
  c.view = new MonsterLevelTabView(c.tabState, f);
  c.view.level = b;
  return c;
}
export function updateMonsterTabLabels(a) {
  var b,
    c = game.monsterCatalog.minUnlockedLevel,
    d,
    f;
  for (f = 0; f < a.levelTables.length; f++) {
    d = a.levelTables[f];
    b = d.view.level;
    if (b !== c) {
      d.tabState.label = "等级 " + c;
      d.view.level = c;
    }
    c++;
  }
}
export function refreshMonsterTabVisibility(a) {
  var b = game.monsterCatalog,
    c,
    d,
    f,
    g = false;
  for (c = 0; c < a.levelTables.length; c++) {
    f = a.levelTables[c];
    d = f.view.level;
    d = b.minUnlockedLevel <= d && d <= b.maxUnlockedLevel;
    f.tabState.enabled = d;
    if (!d && f.tabState.selected) {
      f.tabState.selected = false;
      g = true;
    }
  }
  if (g) {
    for (c = 0; c < a.levelTables.length; c++) {
      if (a.levelTables[c].tabState.enabled) {
        a.levelTables[c].tabState.selected = true;
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
    var a = game.state.party.kills;
    if (a !== this.cachedKills) {
      this.cachedKills = a;
      setElementHtml(this.killCountPanelId, "" + formatGroupedAmount(a));
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
  MonsterRowView.prototype.setMonsterType = function (a) {
    this.monsterType = a;
  };
  MonsterRowView.prototype.createRowCells = function () {
    var a = this.rowElement,
      b = this.monsterType.sprite,
      c = a.insertCell(0);
    c.style.width = "50px";
    c.style.padding = "0";
    c.style.textAlign = "center";
    this.spriteImage = createElement("img", c, null, "characterImage");
    this.spriteImage.src = "images/Transparent.gif";
    this.spriteImage.style.background = "url('spritesheet/monsters.png') -" + b.sourceX + "px -" + (b.sourceY + 10) + "px";
    this.spriteImage.style.height = "30px";
    this.nameCell = a.insertCell(1);
    this.nameCell.style.width = "200px";
    this.nameCell.innerHTML = this.monsterType.getName();
    this.experienceCell = a.insertCell(2);
    this.experienceCell.style.width = "80px";
    this.experienceCell.style.textAlign = "right";
    this.experienceCell.style.paddingRight = "5px";
    this.healthCell = a.insertCell(3);
    this.healthCell.style.width = "80px";
    this.healthCell.style.textAlign = "right";
    this.healthCell.style.paddingRight = "5px";
    this.damageCell = a.insertCell(4);
    this.damageCell.style.width = "80px";
    this.damageCell.style.textAlign = "right";
    this.damageCell.style.paddingRight = "5px";
    this.armorCell = a.insertCell(5);
    this.armorCell.style.width = "80px";
    this.armorCell.style.textAlign = "right";
    this.armorCell.style.paddingRight = "5px";
    this.attackRatingCell = a.insertCell(6);
    this.attackRatingCell.style.width = "80px";
    this.attackRatingCell.style.textAlign = "right";
    this.attackRatingCell.style.paddingRight = "5px";
    this.defenceRatingCell = a.insertCell(7);
    this.defenceRatingCell.style.width = "80px";
    this.defenceRatingCell.style.textAlign = "right";
    this.defenceRatingCell.style.paddingRight = "5px";
    this.killCountCell = a.insertCell(8);
    this.killCountCell.style.width = "80px";
    this.killCountCell.style.textAlign = "right";
    this.killCountCell.style.paddingRight = "5px";
    this.rankCell = a.insertCell(9);
    this.rankCell.style.width = "80px";
    this.rankCell.style.textAlign = "right";
    this.rankCell.style.paddingRight = "5px";
    this.progressCell = a.insertCell(10);
    this.progressCell.style.width = this.progressBarWidth + "px";
    this.progressCell.style.paddingLeft = "5px";
    this.progressCell.style.paddingRight = "5px";
    a = createElement("div", this.progressCell, null, null);
    a.style.position = "relative";
    a.style.border = "1px solid #2c2c50";
    a.style.height = "15px";
    a.style.width = this.progressBarWidth + "px";
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
  MonsterRowView.prototype.reset = function () {
    this.cachedFillWidth = this.cachedKills = this.cachedLevel = this.cachedRank = -1;
  };
  MonsterRowView.prototype.render = function () {
    var a = this.monsterType.rankProgressKills,
      b = this.monsterType.rankKillThreshold,
      c = this.monsterType.killCount,
      d = Math.min(1, a / b),
      d = this.progressBarWidth * d | 0;
    if (this.cachedLevel != this.monsterType.level || this.cachedRank != this.monsterType.rank) {
      this.experienceCell.innerHTML = formatAmount(this.monsterType.experienceReward);
      this.healthCell.innerHTML = formatAmount(this.monsterType.maxHealth);
      this.damageCell.innerHTML = formatAmount(this.monsterType.damage);
      this.armorCell.innerHTML = formatAmount(this.monsterType.armor);
      this.attackRatingCell.innerHTML = formatAmount(this.monsterType.attackRating);
      this.defenceRatingCell.innerHTML = formatAmount(this.monsterType.defenceRating);
      this.rankCell.innerHTML = formatAmount(this.monsterType.rank);
      if (this.cachedLevel != this.monsterType.level) {
        this.nameCell.innerHTML = this.monsterType.getName();
        var f = this.monsterType.sprite;
        this.spriteImage.style.background = "url('spritesheet/monsters.png') -" + f.sourceX + "px -" + (f.sourceY + 10) + "px";
      }
      this.cachedLevel = this.monsterType.level;
      this.cachedRank = this.monsterType.rank;
    }
    if (this.cachedKills !== c) {
      this.cachedKills = c;
      this.killCountCell.innerHTML = formatAmount(c);
    }
    if (this.cachedFillWidth !== d) {
      this.cachedFillWidth = d;
      this.progressFillElement.style.width = d + "px";
      this.progressTextElement.innerHTML = a > b ? "最大" : formatAmount(a) + " / " + formatAmount(b);
    }
  };
  MonsterLevelTabView.prototype = new TabView();
  MonsterLevelTabView.prototype.reset = function () {
    if (this.tableElement) {
      var a;
      for (a = 0; a < this.rowViews.length; a++) {
        this.rowViews[a].reset();
      }
    }
    this.level = -1;
    this.cachedLevel = -2;
  };
  MonsterLevelTabView.prototype.update = function () {
    if (1 > this.level) {
      console.log("MonsterTableView.updateViewContents  monsterLevel=" + this.level);
    } else {
      if (this.tableElement) {
        if (this.cachedLevel !== this.level) {
          var a = getMonsterTypesForLevel(game.monsterCatalog, this.level),
            b;
          if (a.length !== this.rowViews.length) {
            console.log("MonsterTableView.updateMonsterLevelRows length mismatch");
          } else {
            for (b = 0; b < this.rowViews.length; b++) {
              this.rowViews[b].setMonsterType(a[b]);
            }
          }
        }
      } else {
        (/** @type {any} */ (this)).createDomElements();
      }
      this.cachedLevel = this.level;
      for (a = 0; a < this.rowViews.length; a++) {
        this.rowViews[a].render();
      }
    }
  };
  MonsterLevelTabView.prototype.createDomElements = function () {
    var a = this.elementId;
    clearElementById(a);
    var b = getElement(a),
      a = getMonsterTypesForLevel(game.monsterCatalog, this.level);
    this.tableElement = createElement("table", b, null, "monsterTable");
    (/** @type {any} */ (this)).createHeaderRow(this.tableElement.insertRow(0));
    for (var bi = 0; bi < a.length; bi++) {
      this.rowViews.push(new MonsterRowView(this.tableElement.insertRow(bi + 1), a[bi]));
    }
  };
  MonsterLevelTabView.prototype.createHeaderRow = function (a) {
    var b = appendHeaderCell(a);
    b.style.textAlign = "center";
    b.style.padding = "0";
    b.innerHTML = "图标";
    appendHeaderCell(a).innerHTML = "怪物类型";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "经验";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "生命";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "伤害";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "护甲";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "攻击";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "防御";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "总计杀死";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "怪物等级";
    appendHeaderCell(a).innerHTML = "进度";
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
