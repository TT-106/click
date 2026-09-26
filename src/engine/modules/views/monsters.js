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
  this.Hw = "killCountPanel";
  this.rm = -1;
}
export function MonsterLevelView() {
  this.elementId = "monsterUpgradeValuesContainer";
  this.visible = true;
  this.ov = this.jv = this.Vv = this.zv = this.Fv = this.Wu = this.fv = this.Du = this.pv = this.lv = this.ev = -1;
}
export function MonsterRowView(a, b) {
  this.lh = a;
  this.monsterType = b;
  this.progressTextElement = this.progressFillElement = this.progressCell = this.xo = this.$n = this.Yn = this.vo = this.Ij = this.Mo = this.wq = this.yq = this.Es = null;
  this.Sv = this.cachedLevel = this.Jh = this.Uv = -1;
  this.dx = 80;
  this.Cp = null;
  (/** @type {any} */ (this)).createRowCells();
}
export function MonsterLevelTabView(a, b) {
  this.elementId = b;
  this.tabState = a;
  this.tableElement = null;
  this.vi = this.level = -1;
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
    this.rm = -1;
  };
  MonsterUpgradeSummaryView.prototype.update = function () {
    var a = game.state.party.kills;
    if (a !== this.rm) {
      this.rm = a;
      setElementHtml(this.Hw, "" + formatGroupedAmount(a));
    }
  };
  MonsterLevelView.prototype = new View();
  MonsterLevelView.prototype.reset = function () {};
  MonsterLevelView.prototype.update = function () {
    if (this.Wu !== globalUpgradeDefinitions.Lr.currentValue) {
      this.Wu = globalUpgradeDefinitions.Lr.currentValue;
      setElementHtml("goldDropChance", this.Wu + "%");
    }
    if (this.jv !== globalUpgradeDefinitions.ys.currentValue) {
      this.jv = globalUpgradeDefinitions.ys.currentValue;
      setElementHtml("maxGoldPerDrop", this.jv + "");
    }
    if (this.ov !== globalUpgradeDefinitions.As.currentValue) {
      this.ov = globalUpgradeDefinitions.As.currentValue;
      setElementHtml("minGoldPerDrop", this.ov + "");
    }
    if (this.ev !== globalUpgradeDefinitions.itemDropChance.currentValue) {
      this.ev = globalUpgradeDefinitions.itemDropChance.currentValue;
      setElementHtml("itemDropChance", this.ev + "%");
    }
    if (this.Fv !== globalUpgradeDefinitions.$s.currentValue) {
      this.Fv = globalUpgradeDefinitions.$s.currentValue;
      setElementHtml("scrollDropChance", this.Fv + "%");
    }
    if (this.zv !== globalUpgradeDefinitions.Ns.currentValue) {
      this.zv = globalUpgradeDefinitions.Ns.currentValue;
      setElementHtml("potionDropChance", this.zv + "%");
    }
    if (this.fv !== globalUpgradeDefinitions.higherLevelItemChance.currentValue) {
      this.fv = globalUpgradeDefinitions.higherLevelItemChance.currentValue;
      setElementHtml("itemLevelBonus", this.fv + "%");
    }
    if (this.Du !== globalUpgradeDefinitions.itemQualityChance.currentValue) {
      this.Du = globalUpgradeDefinitions.itemQualityChance.currentValue;
      setElementHtml("itemRarityChance", this.Du + "%");
    }
    if (this.Vv !== globalUpgradeDefinitions.treasureChance.currentValue) {
      this.Vv = globalUpgradeDefinitions.treasureChance.currentValue;
      setElementHtml("treasureChestChance", this.Vv + "%");
    }
    if (this.lv !== globalUpgradeDefinitions.maxMonsters.currentValue) {
      this.lv = globalUpgradeDefinitions.maxMonsters.currentValue;
      setElementHtml("maxMonstersPerRoom", this.lv + "");
    }
    if (this.pv !== globalUpgradeDefinitions.minMonsters.currentValue) {
      this.pv = globalUpgradeDefinitions.minMonsters.currentValue;
      setElementHtml("minMonstersPerRoom", this.pv + "");
    }
  };
  MonsterRowView.prototype.gq = function (a) {
    this.monsterType = a;
  };
  MonsterRowView.prototype.createRowCells = function () {
    var a = this.lh,
      b = this.monsterType.ll,
      c = a.insertCell(0);
    c.style.width = "50px";
    c.style.padding = "0";
    c.style.textAlign = "center";
    this.Cp = createElement("img", c, null, "characterImage");
    this.Cp.src = "images/Transparent.gif";
    this.Cp.style.background = "url('spritesheet/monsters.png') -" + b.sourceX + "px -" + (b.sourceY + 10) + "px";
    this.Cp.style.height = "30px";
    this.Es = a.insertCell(1);
    this.Es.style.width = "200px";
    this.Es.innerHTML = this.monsterType.Vk();
    this.Mo = a.insertCell(2);
    this.Mo.style.width = "80px";
    this.Mo.style.textAlign = "right";
    this.Mo.style.paddingRight = "5px";
    this.Ij = a.insertCell(3);
    this.Ij.style.width = "80px";
    this.Ij.style.textAlign = "right";
    this.Ij.style.paddingRight = "5px";
    this.vo = a.insertCell(4);
    this.vo.style.width = "80px";
    this.vo.style.textAlign = "right";
    this.vo.style.paddingRight = "5px";
    this.Yn = a.insertCell(5);
    this.Yn.style.width = "80px";
    this.Yn.style.textAlign = "right";
    this.Yn.style.paddingRight = "5px";
    this.$n = a.insertCell(6);
    this.$n.style.width = "80px";
    this.$n.style.textAlign = "right";
    this.$n.style.paddingRight = "5px";
    this.xo = a.insertCell(7);
    this.xo.style.width = "80px";
    this.xo.style.textAlign = "right";
    this.xo.style.paddingRight = "5px";
    this.yq = a.insertCell(8);
    this.yq.style.width = "80px";
    this.yq.style.textAlign = "right";
    this.yq.style.paddingRight = "5px";
    this.wq = a.insertCell(9);
    this.wq.style.width = "80px";
    this.wq.style.textAlign = "right";
    this.wq.style.paddingRight = "5px";
    this.progressCell = a.insertCell(10);
    this.progressCell.style.width = this.dx + "px";
    this.progressCell.style.paddingLeft = "5px";
    this.progressCell.style.paddingRight = "5px";
    a = createElement("div", this.progressCell, null, null);
    a.style.position = "relative";
    a.style.border = "1px solid #2c2c50";
    a.style.height = "15px";
    a.style.width = this.dx + "px";
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
    this.Jh = this.Uv = this.cachedLevel = this.Sv = -1;
  };
  MonsterRowView.prototype.render = function () {
    var a = this.monsterType.ml,
      b = this.monsterType.ek,
      c = this.monsterType.xq,
      d = Math.min(1, a / b),
      d = this.dx * d | 0;
    if (this.cachedLevel != this.monsterType.level || this.Sv != this.monsterType.Sj) {
      this.Mo.innerHTML = formatAmount(this.monsterType.No);
      this.Ij.innerHTML = formatAmount(this.monsterType.$o);
      this.vo.innerHTML = formatAmount(this.monsterType.Gp);
      this.Yn.innerHTML = formatAmount(this.monsterType.Ep);
      this.$n.innerHTML = formatAmount(this.monsterType.Fp);
      this.xo.innerHTML = formatAmount(this.monsterType.Hp);
      this.wq.innerHTML = formatAmount(this.monsterType.Sj);
      if (this.cachedLevel != this.monsterType.level) {
        this.Es.innerHTML = this.monsterType.Vk();
        var f = this.monsterType.ll;
        this.Cp.style.background = "url('spritesheet/monsters.png') -" + f.sourceX + "px -" + (f.sourceY + 10) + "px";
      }
      this.cachedLevel = this.monsterType.level;
      this.Sv = this.monsterType.Sj;
    }
    if (this.Uv !== c) {
      this.Uv = c;
      this.yq.innerHTML = formatAmount(c);
    }
    if (this.Jh !== d) {
      this.Jh = d;
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
    this.vi = -2;
  };
  MonsterLevelTabView.prototype.update = function () {
    if (1 > this.level) {
      console.log("MonsterTableView.updateViewContents  monsterLevel=" + this.level);
    } else {
      if (this.tableElement) {
        if (this.vi !== this.level) {
          var a = getMonsterTypesForLevel(game.monsterCatalog, this.level),
            b;
          if (a.length !== this.rowViews.length) {
            console.log("MonsterTableView.updateMonsterLevelRows length mismatch");
          } else {
            for (b = 0; b < this.rowViews.length; b++) {
              this.rowViews[b].gq(a[b]);
            }
          }
        }
      } else {
        (/** @type {any} */ (this)).createDomElements();
      }
      this.vi = this.level;
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
