/** 角色属性、技能、背包和装备界面。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { getHighlightedItemName, getItemRarityLabel, getItemStatLabel } from "../loot/items.js";
import { formatAmount } from "../core/math.js";
import { game } from "../runtime/game.js";
import { UpgradeButtonView, UpgradeListView, getRarityClass } from "./upgrade-details.js";
import { appendAttributeRow, appendHeaderCell, clearElementById, createElement, getElement } from "./dom.js";
import { CompositeView, View, addChildView, resetChildViews, updateChildViews } from "./base.js";
import { TabBar, TabState, TabView, addTab } from "./navigation.js";
import { getAttackCooldown, statValue } from "../characters/stats.js";
import { characterLevelUpgrades, healthRegenerationBonus, spiritRegenerationBonus } from "../content/balance.js";
import { UpgradeCollection } from "../progression/upgrades.js";
/** @typedef {{ reset: () => void, render: () => void }} ViewLifecycle */
/** @typedef {{ pf: () => void, mk: (rowCount: number) => void, Ri: (row: HTMLTableRowElement) => void }} TableLifecycle */
export function ItemRowBase() {}
export function InventoryItemView(a, b) {
  this.lh = a;
  this.adventurerIndex = b;
  this.Ej = this.Cr = this.gf = this.Oh = this.Af = this.Ie = this.Fi = this.Ei = this.item = null;
  (/** @type {InventoryItemView & { qi: () => void }} */ (/** @type {unknown} */ (this))).qi();
}
export function InventoryTableView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.adventurerIndex = b;
  this.Jj = null;
  this.bh = [];
}
export function EquipmentItemRowView(a, b) {
  this.lh = a;
  this.adventurerIndex = b;
  this.Cr = this.gf = this.Oh = this.Af = this.Ie = this.Fi = this.Ei = this.item = null;
  (/** @type {EquipmentItemRowView & { qi: () => void }} */ (/** @type {unknown} */ (this))).qi();
}
export function EquipmentTableView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.adventurerIndex = b;
  this.zm = null;
  this.sf = [];
}
export function EquipAllView(a) {
  this.elementId = "equipAllButtonContainer" + a;
  this.visible = true;
  this.adventurerIndex = a;
  this.Xq = false;
  this.gw = getElement("equipImprovements" + a);
  var b = this;
  this.gw.onclick = function () {
    (/** @type {EquipAllView & { Br: () => void }} */ (/** @type {unknown} */ (b))).Br();
    return false;
  };
}
export function InventoryTabView(a, b, c) {
  this.elementId = b;
  this.tabState = a;
  this.adventurerIndex = c;
  this.QD = "itemTableAdventurer" + c;
  this.mD = "adventurerEquippedItems" + c;
  this.nD = new EquipmentTableView(this.mD, c);
  this.Jj = new InventoryTableView(this.QD, c);
  addChildView(this, this.nD);
  addChildView(this, new EquipAllView(c));
  addChildView(this, this.Jj);
}
export function CharacterTabsView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.adventurerIndex = b;
  this.jt = new TabState("技能", true);
  this.fA = new TabState("背包", true);
  this.jt.selected = true;
  this.zz = false;
  var c = new TabBar("characterTabMenu" + this.adventurerIndex),
    d = new SkillsTabView(this.jt, "characterSkillsContainer" + this.adventurerIndex, this.adventurerIndex),
    f = new InventoryTabView(this.fA, "characterInventoryContainer" + this.adventurerIndex, this.adventurerIndex);
  addTab(c, this.jt);
  addTab(c, this.fA);
  addChildView(this, c);
  addChildView(this, d);
  addChildView(this, f);
}
export function CharacterSummaryView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.adventurerIndex = b;
  this.dD = this.xy = this.Jy = this.AB = this.hz = this.gz = this.ez = this.aj = this.Ap = this.pA = this.EB = this.Wz = this.bz = this.DB = this.Ij = this.rA = this.be = null;
  this.zu = this.iv = this.Mu = this.Ov = this.Pu = this.Ou = this.Nu = this.Kk = this.Ik = this.Gk = this.Pv = this.$u = this.Lu = this.Jk = this.Zu = this.$f = -1;
}
export function StatBreakdownView(a, b, c, d) {
  this.elementId = a;
  this.visible = true;
  this.qE = c;
  this.bD = d;
  this.adventurerIndex = b;
  this.zB = this.vB = this.qA = this.gA = this.XB = this.Cn = null;
  this.Mv = this.Jv = this.hv = this.dv = this.Tv = -1;
}
export function getStatByIndex(a, b) {
  switch (b) {
    case 0:
      return a.damage;
    case 1:
      return a.armor;
    case 2:
      return a.attackRating;
    case 3:
      return a.defenceRating;
    case 4:
      return a.maxHealth;
    case 5:
      return a.maxSpirit;
  }
  return null;
}
export function CharacterAttributesView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.adventurerIndex = b;
  /** @type {CharacterSummaryView & ViewLifecycle} */
  this.bB = /** @type {CharacterSummaryView & ViewLifecycle} */ (/** @type {unknown} */ (new CharacterSummaryView(a, b)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.iz = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "伤害", 0)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.Gy = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "护甲", 1)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.Hy = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "攻击等级", 2)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.lz = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "防御等级", 3)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.vA = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "最大生命", 4)));
  /** @type {StatBreakdownView & ViewLifecycle} */
  this.yA = /** @type {StatBreakdownView & ViewLifecycle} */ (/** @type {unknown} */ (new StatBreakdownView(a, b, "最大法力", 5)));
}
export function CharacterView(a, b, c) {
  this.elementId = b;
  this.tabState = a;
  this.adventurerIndex = c;
  a = new UpgradeCollection([[characterLevelUpgrades[c]]], false);
  addChildView(this, new CharacterAttributesView("characterPropertiesContainer" + c, c));
  addChildView(this, new UpgradeListView("characterLevelUpButtonContainer" + c, a, true));
  addChildView(this, new CharacterTabsView("characterTabContainer" + c, c));
}
export function mountCharacterView(a) {
  var hasAdventurer = a.adventurerIndex < game.state.adventurers.length,
    c = a.tabState;
  c.enabled = hasAdventurer;
  c.selected = false;
  if (hasAdventurer) {
    var adventurer = game.state.adventurers[a.adventurerIndex];
    a = a.tw(adventurer);
    var className = adventurer.classDefinition.shortName;
    if (0 < a) {
      c.label = className + " " + a;
      c.highlighted = true;
    } else {
      c.label = className;
      c.highlighted = false;
    }
  }
}
export function SkillsTabView(a, b, c) {
  this.elementId = b;
  this.tabState = a;
  this.adventurerIndex = c;
  this.ry = this.qy = this.Rl = this.hj = this.Ax = null;
  this.Uc = [];
  this.Vc = [];
  this.Nf = [];
  this.Pn = [];
}
export function initializeViewsCharacter() {
  ItemRowBase.prototype.reset = function () {};
  InventoryItemView.prototype = new ItemRowBase();
  InventoryItemView.prototype.render = function () {};
  InventoryItemView.prototype.onOfflineFinish = function () {};
  InventoryItemView.prototype.onOfflineStart = function () {};
  InventoryItemView.prototype.ux = function (a) {
    if (this.item = a) {
      var b = this.item.Uk();
      this.Ei.style.background = "url('spritesheet/items.png') -" + b.sourceX + "px -" + b.sourceY + "px";
      this.Fi.innerHTML = getHighlightedItemName(this.item);
      this.Ie.innerHTML = getItemRarityLabel(this.item);
      this.Af.innerHTML = this.item.ns + "";
      this.gf.innerHTML = formatAmount(this.item.zf);
      this.Oh.innerHTML = formatAmount(this.item.itemValue) + " " + getItemStatLabel(this.item);
      var c = game.state.adventurers[this.adventurerIndex],
        b = c.ef(a.slot);
      this.Oh.className = b ? this.item.itemValue > b.itemValue ? "itemValueBetter" : this.item.itemValue < b.itemValue ? "itemValueWorse" : "" : "itemValueBetter";
      this.gf.className = b ? a.zf > b.zf ? "itemValueBetter" : a.zf < b.zf ? "itemValueWorse" : "" : "itemValueBetter";
      this.Ie.className = getRarityClass(this.item.uf());
      if (!b || this.item.itemValue > b.itemValue) {
        this.Ej.style.display = "block";
        this.Ej.onclick = function () {
          c.Qk(a);
          return false;
        };
      } else {
        this.Ej.style.display = "none";
      }
    } else {
      this.Ei.style.background = "";
      this.Fi.innerHTML = "";
      this.Ie.innerHTML = "";
      this.Af.innerHTML = "";
      this.Oh.innerHTML = "";
      this.gf.className = "";
      this.Ej.style.display = "none";
      this.Ej.onclick = null;
      this.Ie.className = "";
    }
  };
  InventoryItemView.prototype.qi = function () {
    var a = this.lh,
      b = a.insertCell(0);
    b.style.width = "50px";
    b.style.padding = "0";
    b.style.textAlign = "center";
    this.Ei = createElement("img", b, null, "itemImage");
    this.Ei.src = "images/Transparent.gif";
    this.Fi = a.insertCell(1);
    this.Fi.style.width = "250px";
    this.Ie = a.insertCell(2);
    this.Ie.style.width = "110px";
    this.Ie.style.textAlign = "center";
    this.Af = a.insertCell(3);
    this.Af.style.textAlign = "right";
    this.Af.style.paddingRight = "5px";
    this.Af.style.width = "60px";
    this.Oh = a.insertCell(4);
    this.Oh.style.width = "120px";
    this.gf = a.insertCell(5);
    this.gf.style.textAlign = "right";
    this.gf.style.paddingRight = "5px";
    this.gf.style.width = "70px";
    this.Cr = a.insertCell(6);
    this.Cr.style.width = "100px";
    this.Ej = createElement("div", this.Cr, null, "equipButtonDiv");
    this.Ej.innerHTML = "装备";
    this.Ej.style.display = "none";
  };
  InventoryTableView.prototype = new View();
  InventoryTableView.prototype.reset = function () {
    this.bh.length = 0;
    clearElementById(this.elementId);
    this.Jj = null;
  };
  InventoryTableView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      if (!this.Jj) {
        (/** @type {InventoryTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).pf();
      }
      var a = game.state.adventurers[this.adventurerIndex].inventory.items;
      if (a.length !== this.bh.length) {
        (/** @type {InventoryTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).mk(a.length);
      }
      var b;
      for (b = 0; b < this.bh.length; b++) {
        if (a[b] !== this.bh[b].item) {
          this.bh[b].ux(a[b]);
        }
      }
    }
  };
  InventoryTableView.prototype.mk = function (a) {
    for (; this.bh.length > a;) {
      this.Jj.deleteRow(-1);
      this.bh.splice(this.bh.length - 1, 1);
    }
    for (; this.bh.length < a;) {
      this.bh.push(new InventoryItemView(this.Jj.insertRow(this.bh.length + 1), this.adventurerIndex));
    }
  };
  InventoryTableView.prototype.pf = function () {
    var a = this.elementId;
    clearElementById(a);
    this.Jj = createElement("table", getElement(a), null, "monsterTable");
    (/** @type {InventoryTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).Ri(this.Jj.insertRow(0));
  };
  InventoryTableView.prototype.Ri = function (a) {
    var b = appendHeaderCell(a);
    b.style.textAlign = "center";
    b.style.padding = "0";
    b.innerHTML = "图标";
    appendHeaderCell(a).innerHTML = "道具名称";
    b = appendHeaderCell(a);
    b.style.textAlign = "center";
    b.innerHTML = "稀有度";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "等级";
    b = appendHeaderCell(a);
    b.style.textAlign = "left";
    b.style.paddingRight = "5px";
    b.innerHTML = "效果";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "黄金";
    a = appendHeaderCell(a);
    a.style.textAlign = "center";
    a.innerHTML = "装备";
  };
  EquipmentItemRowView.prototype = new ItemRowBase();
  EquipmentItemRowView.prototype.render = function () {};
  EquipmentItemRowView.prototype.onOfflineFinish = function () {};
  EquipmentItemRowView.prototype.onOfflineStart = function () {};
  EquipmentItemRowView.prototype.ux = function (a) {
    if (this.item = a) {
      a = this.item.Uk();
      this.Ei.style.background = "url('spritesheet/items.png') -" + a.sourceX + "px -" + a.sourceY + "px";
      this.Fi.innerHTML = getHighlightedItemName(this.item);
      this.Ie.innerHTML = getItemRarityLabel(this.item);
      this.Af.innerHTML = this.item.ns + "";
      this.Oh.innerHTML = formatAmount(this.item.itemValue) + " " + getItemStatLabel(this.item);
      this.gf.innerHTML = formatAmount(this.item.zf);
      this.Ie.className = getRarityClass(this.item.uf());
    } else {
      this.Ei.style.background = "";
      this.Fi.innerHTML = "";
      this.Ie.innerHTML = "";
      this.Af.innerHTML = "";
      this.Oh.innerHTML = "";
      this.gf.innerHTML = "";
      this.Ie.className = "";
    }
  };
  EquipmentItemRowView.prototype.qi = function () {
    var a = this.lh,
      b = a.insertCell(0);
    b.style.width = "50px";
    b.style.padding = "0";
    b.style.textAlign = "center";
    this.Ei = createElement("img", b, null, "itemImage");
    this.Ei.src = "images/Transparent.gif";
    this.Fi = a.insertCell(1);
    this.Fi.style.width = "280px";
    this.Ie = a.insertCell(2);
    this.Ie.style.width = "110px";
    this.Ie.style.textAlign = "center";
    this.Af = a.insertCell(3);
    this.Af.style.textAlign = "right";
    this.Af.style.paddingRight = "5px";
    this.Af.style.width = "70px";
    this.Oh = a.insertCell(4);
    this.Oh.style.width = "120px";
    this.gf = a.insertCell(5);
    this.gf.style.textAlign = "right";
    this.gf.style.paddingRight = "5px";
    this.gf.style.width = "80px";
  };
  EquipmentTableView.prototype = new View();
  EquipmentTableView.prototype.reset = function () {
    var a;
    for (a = 0; a < this.sf.length; a++) {
      this.sf[a].reset();
    }
    this.sf.length = 0;
    clearElementById(this.elementId);
    this.zm = null;
  };
  EquipmentTableView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      if (!this.zm) {
        (/** @type {EquipmentTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).pf();
      }
      var a = game.state.adventurers[this.adventurerIndex],
        b = a.slotList;
      if (b.length !== this.sf.length) {
        (/** @type {EquipmentTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).mk(b.length);
      }
      var c, d;
      for (c = 0; c < this.sf.length; c++) {
        d = a.ef(b[c]);
        if (d !== this.sf[c].item) {
          this.sf[c].ux(d);
        }
      }
    }
  };
  EquipmentTableView.prototype.mk = function (a) {
    for (; this.sf.length > a;) {
      this.zm.deleteRow(-1);
      this.sf.splice(this.sf.length - 1, 1);
    }
    for (; this.sf.length < a;) {
      this.sf.push(new EquipmentItemRowView(this.zm.insertRow(this.sf.length + 1), this.adventurerIndex));
    }
  };
  EquipmentTableView.prototype.pf = function () {
    var a = this.elementId;
    clearElementById(a);
    this.zm = createElement("table", getElement(a), null, "monsterTable");
    (/** @type {EquipmentTableView & TableLifecycle} */ (/** @type {unknown} */ (this))).Ri(this.zm.insertRow(0));
  };
  EquipmentTableView.prototype.Ri = function (a) {
    var b = appendHeaderCell(a);
    b.style.textAlign = "center";
    b.style.padding = "0";
    b.innerHTML = "图标";
    appendHeaderCell(a).innerHTML = "道具名称";
    b = appendHeaderCell(a);
    b.style.textAlign = "center";
    b.innerHTML = "稀有度";
    b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.style.paddingRight = "5px";
    b.innerHTML = "等级";
    b = appendHeaderCell(a);
    b.style.textAlign = "left";
    b.style.paddingRight = "5px";
    b.innerHTML = "效果";
    a = appendHeaderCell(a);
    a.style.textAlign = "right";
    a.style.paddingRight = "5px";
    a.innerHTML = "黄金";
  };
  EquipAllView.prototype = new View();
  EquipAllView.prototype.reset = function () {};
  EquipAllView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      if ((/** @type {EquipAllView & { Wt: () => boolean }} */ (/** @type {unknown} */ (this))).Wt()) {
        if (!this.Xq) {
          this.Xq = true;
          this.gw.className = "upgradeButton";
        }
      } else {
        if (this.Xq) {
          this.Xq = false;
          this.gw.className = "disabledUpgradeButton";
        }
      }
    }
  };
  EquipAllView.prototype.Br = function () {
    game.inventories.Br(game.state.adventurers[this.adventurerIndex]);
  };
  EquipAllView.prototype.Wt = function () {
    return game.inventories.Wt(game.state.adventurers[this.adventurerIndex]);
  };
  InventoryTabView.prototype = new TabView();
  CharacterTabsView.prototype = new CompositeView();
  CharacterTabsView.prototype.update = function () {
    var a = game.state.adventurers[this.adventurerIndex],
      a = 0 < a.skillPoints && a.hasUnspentSkills;
    if (this.zz !== a) {
      this.zz = a;
      this.jt.highlighted = a ? true : false;
    }
    updateChildViews(this);
  };
  CharacterSummaryView.prototype = new View();
  CharacterSummaryView.prototype.reset = function () {
    this.zu = this.iv = this.Mu = this.Ov = this.Pu = this.Ou = this.Nu = this.Kk = this.Ik = this.Gk = this.Pv = this.$u = this.Lu = this.Jk = this.Zu = this.$f = -1;
    var a = 0;
    this.be = createElement("table", getElement(this.elementId), null, "characteristicsTable");
    this.rA = appendAttributeRow(this.be, "等级:", a++);
    this.Ij = appendAttributeRow(this.be, "生命:", a++);
    this.DB = appendAttributeRow(this.be, "法力:", a++);
    this.Wz = appendAttributeRow(this.be, "生命回复:", a++);
    this.EB = appendAttributeRow(this.be, "法力回复:", a++);
    this.pA = appendAttributeRow(this.be, "杀死:", a++);
    this.Ap = appendAttributeRow(this.be, "宠物杀死:", a++);
    this.aj = appendAttributeRow(this.be, "昏迷次数:", a++);
    this.ez = appendAttributeRow(this.be, "输出伤害:", a++);
    this.gz = appendAttributeRow(this.be, "受到伤害:", a++);
    this.hz = appendAttributeRow(this.be, "伤害抵抗:", a++);
    this.AB = appendAttributeRow(this.be, "法术忽视:", a++);
    this.dD = appendAttributeRow(this.be, "暴击几率:", a++);
    this.bz = appendAttributeRow(this.be, "冷却回合:", a++);
    this.Jy = appendAttributeRow(this.be, "每回合攻击次数:", a++);
    this.xy = appendAttributeRow(this.be, "额外攻击:", a);
  };
  CharacterSummaryView.prototype.update = function () {
    var a = game.state.adventurers[this.adventurerIndex].stats,
      b = a.characterLevel,
      c = a.health,
      d = a.spirit,
      f = getAttackCooldown(a, true),
      g = a.baseHealthRegenPercent + a.healthRegenBonus + healthRegenerationBonus.currentValue,
      h = a.baseSpiritRegenPercent + a.spiritRegenBonus + spiritRegenerationBonus.currentValue,
      l = a.kills,
      n = a.minionKills,
      p = a.stunCount,
      s = a.damageGiven,
      u = a.damageReceived,
      y = a.wo,
      A = a.spellCostReduction,
      C = a.lm,
      v = 1 + a.extraAttackCount,
      a = 0 < a.extraAttackCount ? a.extraAttackChance : 0;
    if (this.$f !== b) {
      this.$f = b;
      this.rA.innerHTML = b + "";
    }
    if (this.Zu !== c) {
      this.Zu = c;
      this.Ij.innerHTML = formatAmount(c);
    }
    if (this.Jk !== d) {
      this.Jk = d;
      this.DB.innerHTML = formatAmount(d);
    }
    if (this.Lu !== f) {
      this.Lu = f;
      this.bz.innerHTML = f + "";
    }
    if (this.$u !== g) {
      this.$u = g;
      this.Wz.innerHTML = g + "%";
    }
    if (this.Pv !== h) {
      this.Pv = h;
      this.EB.innerHTML = h + "%";
    }
    if (this.Gk !== l) {
      this.Gk = l;
      this.pA.innerHTML = formatAmount(l);
    }
    if (this.Ik !== n) {
      this.Ik = n;
      this.Ap.innerHTML = formatAmount(n);
    }
    if (this.Kk !== p) {
      this.Kk = p;
      this.aj.innerHTML = formatAmount(p);
    }
    if (this.Nu !== s) {
      this.Nu = s;
      this.ez.innerHTML = formatAmount(s);
    }
    if (this.Ou !== u) {
      this.Ou = u;
      this.gz.innerHTML = formatAmount(u);
    }
    if (this.Pu !== y) {
      this.Pu = y;
      this.hz.innerHTML = y + "%";
    }
    if (this.Ov !== A) {
      this.Ov = A;
      this.AB.innerHTML = A + "%";
    }
    if (this.Mu !== C) {
      this.Mu = C;
      this.dD.innerHTML = C + "%";
    }
    if (this.iv != v) {
      this.iv = v;
      this.Jy.innerHTML = v + "";
    }
    if (this.zu != a) {
      this.zu = a;
      this.xy.innerHTML = a + "%";
    }
  };
  StatBreakdownView.prototype = new View();
  StatBreakdownView.prototype.reset = function () {
    this.Mv = this.Jv = this.hv = this.dv = this.Tv = -1;
    this.Cn = createElement("table", getElement(this.elementId), null, "characteristicsTable");
    var label = this.qE + ":",
      b = this.Cn.insertRow(0),
      c = document.createElement("th");
    c.className = "characteristicsTableLabel";
    b.appendChild(c);
    c.innerHTML = label;
    var valueCell = document.createElement("th");
    valueCell.style.textAlign = "left";
    b.appendChild(valueCell);
    this.XB = valueCell;
    this.gA = appendAttributeRow(this.Cn, "道具加成:", 1);
    this.qA = appendAttributeRow(this.Cn, "等级加成:", 2);
    this.vB = appendAttributeRow(this.Cn, "技能加成:", 3);
    this.zB = appendAttributeRow(this.Cn, "法术加成:", 4);
  };
  StatBreakdownView.prototype.update = function () {
    var a = getStatByIndex(game.state.adventurers[this.adventurerIndex].stats, this.bD),
      b = statValue(a),
      c = a.itemValue,
      d = a.levelValue,
      f = a.spellBonusPercent,
      a = a.skillBonusPercent;
    if (this.Tv !== b) {
      this.Tv = b;
      this.XB.innerHTML = formatAmount(b);
    }
    if (this.dv !== c) {
      this.dv = c;
      this.gA.innerHTML = formatAmount(c);
    }
    if (this.hv !== d) {
      this.hv = d;
      this.qA.innerHTML = formatAmount(d);
    }
    if (this.Mv !== f) {
      this.Mv = f;
      this.zB.innerHTML = formatAmount(f) + "%";
    }
    if (this.Jv !== a) {
      this.Jv = a;
      this.vB.innerHTML = formatAmount(a) + "%";
    }
  };
  CharacterAttributesView.prototype = new View();
  CharacterAttributesView.prototype.reset = function () {
    clearElementById(this.elementId);
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      this.bB.reset();
      this.iz.reset();
      this.Gy.reset();
      this.Hy.reset();
      this.lz.reset();
      this.vA.reset();
      this.yA.reset();
    }
  };
  CharacterAttributesView.prototype.update = function () {
    if (!(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      this.bB.render();
      this.iz.render();
      this.Gy.render();
      this.Hy.render();
      this.lz.render();
      this.vA.render();
      this.yA.render();
    }
  };
  CharacterView.prototype = new TabView();
  CharacterView.prototype.onGameWon = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  CharacterView.prototype.onOfflineStart = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  CharacterView.prototype.onOfflineFinish = function () {
    mountCharacterView(this);
  };
  CharacterView.prototype.reset = function () {
    resetChildViews(this);
    mountCharacterView(this);
  };
  CharacterView.prototype.tw = function (a) {
    return a.hasUnspentSkills ? a.skillPoints + a.initialSpellSkillPoint : 0;
  };
  SkillsTabView.prototype = new TabView();
  SkillsTabView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.Ax = null;
    this.Uc.length = 0;
    this.Vc.length = 0;
    this.Nf.length = 0;
    this.Pn.length = 0;
    (/** @type {SkillsTabView & { Zn: () => void }} */ (/** @type {unknown} */ (this))).Zn();
    var a = this.elementId,
      b = getElement(a);
    if (b && !(0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length)) {
      if (this.hj) {
        this.Ax = createElement("table", b, null, "adventurerSkillTreeTable");
        var skillUpgrades = this.hj.upgrades,
          c = this.Rl.upgrades,
          d = this.qy.upgrades,
          f = this.ry.upgrades,
          g = Math.max(skillUpgrades.length, Math.max(c.length, Math.max(d.length, f.length))),
          h,
          l,
          n,
          p,
          s;
        for (h = 0; h < g; h++) {
          l = this.Ax.insertRow(h);
          n = l.insertCell(0);
          p = l.insertCell(1);
          s = l.insertCell(2);
          l = l.insertCell(3);
          n.id = a + "_" + h + "_0";
          p.id = a + "_" + h + "_1";
          s.id = a + "_" + h + "_2";
          l.id = a + "_" + h + "_3";
          n.width = 150;
          p.width = 150;
          s.width = 150;
          l.width = 150;
          if (h < skillUpgrades.length) {
            this.Uc.push(new UpgradeButtonView(n.id, skillUpgrades[h], h, true));
          }
          if (h < c.length) {
            this.Vc.push(new UpgradeButtonView(p.id, c[h], h, true));
          }
          if (h < d.length) {
            this.Nf.push(new UpgradeButtonView(s.id, d[h], h, true));
          }
          if (h < f.length) {
            this.Pn.push(new UpgradeButtonView(l.id, f[h], h, true));
          }
        }
      } else {
        console.log("no upgrades configured for character");
      }
    }
    for (a = 0; a < this.Uc.length; a++) {
      this.Uc[a].reset();
    }
    for (a = 0; a < this.Vc.length; a++) {
      this.Vc[a].reset();
    }
    for (a = 0; a < this.Nf.length; a++) {
      this.Nf[a].reset();
    }
    for (a = 0; a < this.Pn.length; a++) {
      this.Pn[a].reset();
    }
  };
  SkillsTabView.prototype.Zn = function () {
    if (0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length) {
      this.ry = this.qy = this.Rl = this.hj = null;
    } else {
      var a = game.state.adventurers[this.adventurerIndex];
      this.hj = a.skillTree1;
      this.Rl = a.skillTree2;
      this.qy = a.skillTree3;
      this.ry = a.skillTree4;
    }
  };
  SkillsTabView.prototype.update = function () {
    var a;
    for (a = 0; a < this.Uc.length; a++) {
      this.Uc[a].render();
    }
    for (a = 0; a < this.Vc.length; a++) {
      this.Vc[a].render();
    }
    for (a = 0; a < this.Nf.length; a++) {
      this.Nf[a].render();
    }
    for (a = 0; a < this.Pn.length; a++) {
      this.Pn[a].render();
    }
  };
}
