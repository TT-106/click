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
  this.kd = this.progressFillElement = this.ng = this.xo = this.$n = this.Yn = this.vo = this.Ij = this.Mo = this.wq = this.yq = this.Es = null;
  this.Sv = this.$f = this.Jh = this.Uv = -1;
  this.dx = 80;
  this.Cp = null;
  (/** @type {any} */ (this)).qi();
}
export function MonsterLevelTabView(a, b) {
  this.elementId = b;
  this.tabState = a;
  this.Dp = null;
  this.vi = this.xd = -1;
  this.Tj = [];
}
export function MonsterView(a) {
  this.elementId = "monstersTabContent";
  this.tabState = a;
  this.zg = [];
  for (a = 0; a < VISIBLE_MONSTER_LEVELS; a++) {
    this.zg.push(mountMonsterTable(a, a + 1));
  }
  var b = new TabBar("monsterTabMenu");
  for (a = 0; a < this.zg.length; a++) {
    addTab(b, this.zg[a].tabState);
  }
  addChildView(this, new MonsterUpgradeSummaryView());
  addChildView(this, new MonsterLevelView());
  addChildView(this, new UpgradeListView("monsterUpgradeButtonsContainer", monsterUpgradeCollection, false));
  addChildView(this, b);
  for (a = 0; a < this.zg.length; a++) {
    addChildView(this, this.zg[a].view);
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
  c.view.xd = b;
  return c;
}
export function updateMonsterTabLabels(a) {
  var b,
    c = game.monsterCatalog.hd,
    d,
    f;
  for (f = 0; f < a.zg.length; f++) {
    d = a.zg[f];
    b = d.view.xd;
    if (b !== c) {
      d.tabState.label = "等级 " + c;
      d.view.xd = c;
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
  for (c = 0; c < a.zg.length; c++) {
    f = a.zg[c];
    d = f.view.xd;
    d = b.hd <= d && d <= b.maxUnlockedLevel;
    f.tabState.enabled = d;
    if (!d && f.tabState.selected) {
      f.tabState.selected = false;
      g = true;
    }
  }
  if (g) {
    for (c = 0; c < a.zg.length; c++) {
      if (a.zg[c].tabState.enabled) {
        a.zg[c].tabState.selected = true;
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
  MonsterRowView.prototype.qi = function () {
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
    this.ng = a.insertCell(10);
    this.ng.style.width = this.dx + "px";
    this.ng.style.paddingLeft = "5px";
    this.ng.style.paddingRight = "5px";
    a = createElement("div", this.ng, null, null);
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
    this.kd = createElement("div", a, null, null);
    this.kd.style.position = "absolute";
    this.kd.style.textAlign = "center";
    this.kd.style.top = "0";
    this.kd.style.left = "0";
    this.kd.style.height = "15px";
    this.kd.style.width = "100%";
    this.kd.style.zIndex = "10";
  };
  MonsterRowView.prototype.reset = function () {
    this.Jh = this.Uv = this.$f = this.Sv = -1;
  };
  MonsterRowView.prototype.render = function () {
    var a = this.monsterType.ml,
      b = this.monsterType.ek,
      c = this.monsterType.xq,
      d = Math.min(1, a / b),
      d = this.dx * d | 0;
    if (this.$f != this.monsterType.xd || this.Sv != this.monsterType.Sj) {
      this.Mo.innerHTML = formatAmount(this.monsterType.No);
      this.Ij.innerHTML = formatAmount(this.monsterType.$o);
      this.vo.innerHTML = formatAmount(this.monsterType.Gp);
      this.Yn.innerHTML = formatAmount(this.monsterType.Ep);
      this.$n.innerHTML = formatAmount(this.monsterType.Fp);
      this.xo.innerHTML = formatAmount(this.monsterType.Hp);
      this.wq.innerHTML = formatAmount(this.monsterType.Sj);
      if (this.$f != this.monsterType.xd) {
        this.Es.innerHTML = this.monsterType.Vk();
        var f = this.monsterType.ll;
        this.Cp.style.background = "url('spritesheet/monsters.png') -" + f.sourceX + "px -" + (f.sourceY + 10) + "px";
      }
      this.$f = this.monsterType.xd;
      this.Sv = this.monsterType.Sj;
    }
    if (this.Uv !== c) {
      this.Uv = c;
      this.yq.innerHTML = formatAmount(c);
    }
    if (this.Jh !== d) {
      this.Jh = d;
      this.progressFillElement.style.width = d + "px";
      this.kd.innerHTML = a > b ? "最大" : formatAmount(a) + " / " + formatAmount(b);
    }
  };
  MonsterLevelTabView.prototype = new TabView();
  MonsterLevelTabView.prototype.reset = function () {
    if (this.Dp) {
      var a;
      for (a = 0; a < this.Tj.length; a++) {
        this.Tj[a].reset();
      }
    }
    this.xd = -1;
    this.vi = -2;
  };
  MonsterLevelTabView.prototype.update = function () {
    if (1 > this.xd) {
      console.log("MonsterTableView.updateViewContents  monsterLevel=" + this.xd);
    } else {
      if (this.Dp) {
        if (this.vi !== this.xd) {
          var a = getMonsterTypesForLevel(game.monsterCatalog, this.xd),
            b;
          if (a.length !== this.Tj.length) {
            console.log("MonsterTableView.updateMonsterLevelRows length mismatch");
          } else {
            for (b = 0; b < this.Tj.length; b++) {
              this.Tj[b].gq(a[b]);
            }
          }
        }
      } else {
        (/** @type {any} */ (this)).pf();
      }
      this.vi = this.xd;
      for (a = 0; a < this.Tj.length; a++) {
        this.Tj[a].render();
      }
    }
  };
  MonsterLevelTabView.prototype.pf = function () {
    var a = this.elementId;
    clearElementById(a);
    var b = getElement(a),
      a = getMonsterTypesForLevel(game.monsterCatalog, this.xd);
    this.Dp = createElement("table", b, null, "monsterTable");
    (/** @type {any} */ (this)).Ri(this.Dp.insertRow(0));
    for (var bi = 0; bi < a.length; bi++) {
      this.Tj.push(new MonsterRowView(this.Dp.insertRow(bi + 1), a[bi]));
    }
  };
  MonsterLevelTabView.prototype.Ri = function (a) {
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
