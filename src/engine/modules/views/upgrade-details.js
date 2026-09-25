// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 升级按钮及各类详情显示。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { View } from "./base.js";
import { clearElement, clearElementById, createElement, getElement, hideElement, showElement } from "./dom.js";
import { SKILL_UPGRADE_TYPE } from "../progression/upgrades.js";
import { floorNumber, formatAmount, formatGroupedAmount, randomInt, scaleByLevel } from "../core/math.js";
import { healthCurve, monsterAttackCurve, monsterDefenceCurve, monsterHealthCurve, monsterSpiritCurve, spiritCurve } from "../content/balance.js";
import { getHighlightedItemName, getItemRarityLabel, getItemStatLabel } from "../loot/items.js";
import { game } from "../runtime/game.js";
import { minionsBySpell } from "../content/minions.js";
import { getMonsterTypesForLevel } from "../combat/encounters.js";
import { getPartyMinLevel } from "../characters/party.js";
import { statValue } from "../characters/stats.js";
export function UpgradeButtonView(a, b, c, d) {
  this.elementId = a + "_" + c;
  this.visible = true;
  this.QA = a;
  this.upgrade = b;
  this.Ag = null;
  this.GC = d;
  this.zo = this.buttonElement = null;
  this.ti = "";
}
export function mountUpgradeButton(a) {
  var b = getElement(a.QA);
  a.ti = a.Ro();
  a.buttonElement = createElement("div", b, a.elementId, a.ti);
  a.buttonElement.onmouseup = function () {
    a.Qc();
    return false;
  };
}
export function createUpgradeDetails(a, b) {
  switch (b) {
    case 1:
      return new ItemPurchaseDetails(a.upgrade, a.buttonElement);
    case 2:
      return new EquipmentDetails(a.upgrade, a.buttonElement);
    case 3:
      return new GlobalUpgradeDetails(a.upgrade, a.buttonElement);
    case 4:
      return new EquipmentSetDetails(a.upgrade, a.buttonElement);
    case SKILL_UPGRADE_TYPE:
      return new SkillUpgradeDetails(a.upgrade, a.buttonElement);
    case 6:
      return new SpellUpgradeDetails(a.upgrade, a.buttonElement);
    case 7:
      return new MonsterLevelDetails(a.upgrade, a.buttonElement);
    case 8:
      return new DungeonPurchaseDetails(a.upgrade, a.buttonElement);
    case 9:
      return new CastlePurchaseDetails(a.upgrade, a.buttonElement);
    case 10:
      return new FarmUpgradeDetails(a.upgrade, a.buttonElement);
    case 11:
      return new CharacterLevelDetails(a.upgrade, a.buttonElement);
    case 12:
      return new ScrollUpgradeDetails(a.upgrade, a.buttonElement);
    case 13:
      return new AutoDungeonDetails(a.upgrade, a.buttonElement);
    case 14:
      return new AchievementClaimDetails(a.upgrade, a.buttonElement);
    case 15:
      return new AchievementProgressDetails(a.upgrade, a.buttonElement);
    case 16:
      return new PointUpgradeDetails(a.upgrade, a.buttonElement);
    default:
      return null;
  }
}
export function ItemPurchaseDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.Ii = this.Ji = this.Hi = this.rp = this.Lj = null;
  this.shown = false;
  this.Lb = -1;
  this.gb = this.fb = null;
}
export function EquipmentDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.Sy = this.Py = this.Ry = this.Ty = this.hm = this.table = null;
  this.shown = false;
  this.Iu = null;
  this.Ju = -1;
}
export function GlobalUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.ks = this.iA = this.Fw = this.jA = this.Qm = this.kp = this.Bf = null;
  this.shown = false;
  this.cv = null;
}
export function AutoDungeonDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.mf = this.we = this.mo = this.$e = null;
  this.shown = false;
  this.oz = this.fb = "";
}
export function EquipmentSetDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.IA = [];
  this.JA = [];
  this.Rw = [];
  this.Bf = null;
  this.shown = false;
  this.sr = [];
}
export function appendEquipmentRow(a, b) {
  var c = a.Bf.insertRow(b),
    d = c.insertCell(0);
  d.style.width = "30px";
  d.style.height = "30px";
  d.style.textAlign = "center";
  d = createElement("img", d, null, null);
  d.src = "images/Transparent.gif";
  d.style.width = "30px";
  d.style.height = "30px";
  a.IA.push(d);
  c = c.insertCell(1);
  c.style.textAlign = "left";
  a.JA.push(createElement("span", c, null, null));
  a.Rw.push(createElement("span", c, null, null));
}
export function SkillUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.sb = this.jb = this.kq = this.wn = null;
  this.shown = false;
  this.gb = this.fb = null;
}
export function SpellUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.vu = this.Ml = this.yn = this.table = null;
  this.shown = false;
  this.zn = this.Dx = this.Lv = null;
  this.nd = true;
  this.De = this.oc = 0;
  this.qw = 8;
}
export function MonsterLevelDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.ej = this.fj = this.dj = this.Dq = this.kk = null;
  this.shown = false;
  this.Lb = -1;
  this.gb = this.fb = null;
}
export function DungeonPurchaseDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.ui = this.Vg = this.we = this.Nd = this.bf = this.Cq = null;
  this.shown = false;
  this.Lb = -1;
}
export function ScrollUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.tm = this.dq = this.we = this.Vh = this.sn = this.Cq = null;
  this.shown = false;
  this.Az = null;
  this.Lb = -1;
}
export function CastlePurchaseDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.ui = this.Vg = this.we = this.Nd = this.Cm = this.Uz = null;
  this.shown = false;
  this.Gk = -1;
}
export function FarmUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.ui = this.Vg = this.we = this.Nd = this.Hm = this.Tz = null;
  this.shown = false;
  this.Dk = -1;
}
export function CharacterLevelDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.jr = this.hr = this.gr = this.ir = this.cn = this.an = this.$m = this.bn = 0;
  this.lr = this.Sq = this.Rq = this.kr = this.sb = this.jb = this.pi = this.Zm = this.table = null;
  this.shown = false;
  this.Lb = -1;
  this.gb = this.Bs = null;
  this.vi = -1;
}
export function AchievementClaimDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.sb = this.jb = null;
  this.shown = false;
  this.gb = this.fb = null;
}
export function AchievementProgressDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.sb = this.jb = null;
  this.shown = false;
  this.gb = this.fb = null;
}
export function PointUpgradeDetails(a, b) {
  this.upgrade = a;
  this.contentContainer = b;
  this.pi = this.sb = this.jb = null;
  this.shown = false;
  this.gb = this.fb = null;
  this.Lb = -1;
}
export function UpgradeListView(a, b, c) {
  this.elementId = a;
  this.visible = true;
  this.py = b;
  this.mj = -100;
  this.gj = [];
  var d = b.upgrades;
  for (b = 0; b < d.length; b++) {
    this.gj.push(new UpgradeButtonView(a, d[b], b, c));
  }
}
export function getRarityClass(a) {
  switch (a) {
    case 1:
      return "itemRarityUncommon";
    case 2:
      return "itemRarityRare";
    case 3:
      return "itemRarityHistoric";
    case 4:
      return "itemRarityAncient";
  }
  return "itemRarityCommon";
}
export function initializeViewsUpgradeDetails() {
  UpgradeButtonView.prototype = new View();
  UpgradeButtonView.prototype.Rc = function (a) {
    this.upgrade = a;
    if (this.Ag) {
      this.Ag.Rc(a);
    }
    if (!(this.GC || this.upgrade.Oc())) {
      if (this.buttonElement) {
        hideElement(this.buttonElement);
      }
    }
  };
  UpgradeButtonView.prototype.isVisible = function () {
    return this.GC ? true : this.upgrade && this.upgrade.Oc();
  };
  UpgradeButtonView.prototype.reset = function () {
    if (getElement(this.QA)) {
      this.buttonElement = null;
      mountUpgradeButton(this);
      this.zo = this.Ag = null;
    }
  };
  UpgradeButtonView.prototype.Qc = function () {
    if (this.upgrade.qc()) {
      this.upgrade.Qc();
    }
  };
  UpgradeButtonView.prototype.update = function () {
    var a = this.upgrade.Na(),
      b = this.Ro();
    if (!this.buttonElement) {
      mountUpgradeButton(this);
    }
    if (this.zo !== a) {
      this.zo = a;
      if (this.Ag && this.zo !== this.Ag.Na()) {
        clearElement(this.buttonElement);
        this.Ag = null;
      }
      if (!this.Ag) {
        this.Ag = createUpgradeDetails(this, this.zo);
      }
      if (this.Ag) {
        this.Ag.te();
      }
    }
    if (this.Ag) {
      this.Ag.update();
    }
    if (this.ti !== b) {
      this.ti = b;
      this.buttonElement.className = b;
    }
  };
  UpgradeButtonView.prototype.Ro = function () {
    return this.upgrade.qc() ? "upgradeButton centeredElement topMargin" : this.upgrade.He() ? "ownedUpgradeButton centeredElement topMargin" : "disabledUpgradeButton centeredElement topMargin";
  };
  ItemPurchaseDetails.prototype.Na = function () {
    return 1;
  };
  ItemPurchaseDetails.prototype.reset = function () {
    this.Lb = -1;
    this.gb = this.fb = null;
  };
  ItemPurchaseDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  ItemPurchaseDetails.prototype.te = function () {
    if (!this.Lj) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.Lj);
      showElement(this.rp);
      this.shown = true;
    }
  };
  ItemPurchaseDetails.prototype.update = function () {
    var a = this.upgrade.Bb(),
      b = this.upgrade.ib(),
      c = this.upgrade.lb();
    if (this.Lb !== a) {
      this.Lb = a;
      this.Hi.innerHTML = formatAmount(a);
    }
    if (this.gb !== b) {
      this.gb = b;
      this.Ji.innerHTML = b;
    }
    if (this.fb !== c) {
      this.fb = c;
      this.Ii.innerHTML = c;
    }
  };
  ItemPurchaseDetails.prototype.eb = function () {
    this.Lj = createElement("div", this.contentContainer, null, null);
    this.Lj.style.position = "relative";
    this.Lj.style.height = "30px";
    this.rp = createElement("div", this.contentContainer, null, null);
    this.rp.style.position = "relative";
    this.rp.style.height = "30px";
    var a = createElement("div", this.Lj, null, null);
    a.style.position = "absolute";
    a.style.right = "3px";
    a.style.top = "0";
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.Hi = createElement("div", this.Lj, null, null);
    this.Hi.style.position = "absolute";
    this.Hi.style.right = "36px";
    this.Hi.style.top = "0";
    this.Hi.style.width = "40px";
    this.Hi.style.height = "25px";
    this.Hi.style.paddingTop = "5px";
    this.Hi.style.textAlign = "right";
    this.Ji = createElement("div", this.Lj, null, null);
    this.Ji.style.position = "absolute";
    this.Ji.style.right = "82px";
    this.Ji.style.top = "0";
    this.Ji.style.left = "3px";
    this.Ji.style.height = "25px";
    this.Ji.style.paddingTop = "5px";
    this.Ji.style.textAlign = "left";
    this.Ii = createElement("div", this.rp, null, null);
    this.Ii.style.position = "absolute";
    this.Ii.style.left = "3px";
    this.Ii.style.top = "0";
    this.Ii.style.right = "0";
    this.Ii.style.height = "25px";
    this.Ii.style.paddingTop = "5px";
    this.Ii.style.textAlign = "left";
  };
  EquipmentDetails.prototype.Na = function () {
    return 2;
  };
  EquipmentDetails.prototype.reset = function () {
    this.Iu = null;
    this.Ju = -1;
  };
  EquipmentDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  EquipmentDetails.prototype.te = function () {
    if (!this.table) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.table);
      this.shown = true;
    }
  };
  EquipmentDetails.prototype.update = function () {
    if (this.upgrade.Vo()) {
      var a = this.upgrade.Vo(),
        b = a.stats.characterLevel;
      if (this.Iu !== a || this.Ju != b) {
        this.Iu = a;
        this.Ju = b;
        var c = a.getSprite(),
          d = a.classDefinition.Ma;
        this.hm.style.background = "url('spritesheet/monsters.png') -" + (c.sourceX + 10) + "px -" + (c.sourceY + 12) + "px";
        this.Ty.innerHTML = this.upgrade.lb();
        this.aD.innerHTML = formatAmount(a.stats.Am) + " XP";
        this.Ry.innerHTML = "等级 " + (b + 1);
        this.Py.innerHTML = ", " + formatAmount(scaleByLevel(b + 1, healthCurve, d.Cf)) + " HP";
        this.Sy.innerHTML = ", " + formatAmount(scaleByLevel(b + 1, spiritCurve, d.Ef)) + " SP";
      }
    } else {
      console.log("bug in upgrade button");
    }
  };
  EquipmentDetails.prototype.eb = function () {
    this.table = createElement("table", this.contentContainer, null, null);
    this.table.style.width = "100%";
    var a = this.table.insertRow(0),
      b = this.table.insertRow(1),
      c = a.insertCell(0);
    c.style.width = "30px";
    c.style.height = "30px";
    c.style.verticalAlign = "top";
    this.hm = createElement("img", c, null, null);
    this.hm.className = "characterImage";
    this.hm.src = "images/Transparent.gif";
    this.hm.style.height = "30px";
    this.hm.style.width = "30px";
    c = a.insertCell(1);
    c.style.width = "180px";
    c.style.textAlign = "left";
    c.style.paddingLeft = "3px";
    this.Ty = createElement("span", c, null, null);
    a = a.insertCell(2);
    a.style.width = "40px";
    a.style.textAlign = "right";
    this.aD = createElement("span", a, null, null);
    b = b.insertCell(0);
    b.colSpan = 3;
    b.style.paddingLeft = "2px";
    b.style.textAlign = "left";
    b.style.verticalAlign = "middle";
    this.Ry = createElement("span", b, null, null);
    this.Py = createElement("span", b, null, null);
    this.Sy = createElement("span", b, null, null);
  };
  GlobalUpgradeDetails.prototype.Na = function () {
    return 3;
  };
  GlobalUpgradeDetails.prototype.reset = function () {
    this.cv = null;
  };
  GlobalUpgradeDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  GlobalUpgradeDetails.prototype.te = function () {
    if (!this.Bf) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.Bf);
      this.shown = true;
    }
  };
  GlobalUpgradeDetails.prototype.update = function () {
    var a = this.upgrade.Oz();
    if (this.cv !== a) {
      this.cv = a;
      var b = a.Uk(),
        c = a.nj.getSprite();
      this.kp.style.background = "url('spritesheet/items.png') -" + b.sourceX + "px -" + b.sourceY + "px";
      this.jA.innerHTML = getHighlightedItemName(a);
      this.Fw.className = getRarityClass(a.uf());
      this.Fw.innerHTML = " (" + getItemRarityLabel(a) + ")";
      this.Qm.style.background = "url('spritesheet/monsters.png') -" + (c.sourceX + 10) + "px -" + (c.sourceY + 12) + "px";
      this.iA.innerHTML = "等级" + a.ns;
      b = (b = a.nj.ef(a.slot)) ? a.itemValue - b.itemValue : a.itemValue;
      this.ks.innerHTML = 0 < b ? "+" + formatAmount(b) + " " + getItemStatLabel(a) : formatAmount(b) + " " + getItemStatLabel(a);
    }
  };
  GlobalUpgradeDetails.prototype.eb = function () {
    this.Bf = createElement("table", this.contentContainer, null, null);
    this.Bf.style.width = "100%";
    var a = this.Bf.insertRow(0),
      b = this.Bf.insertRow(1),
      c = a.insertCell(0);
    c.style.width = "30px";
    c.style.height = "30px";
    c.style.textAlign = "center";
    this.kp = createElement("img", c, null, null);
    this.kp.src = "images/Transparent.gif";
    this.kp.style.width = "30px";
    this.kp.style.height = "30px";
    a = a.insertCell(1);
    a.style.textAlign = "left";
    a.colSpan = 2;
    this.jA = createElement("span", a, null, null);
    this.Fw = createElement("span", a, null, null);
    a = b.insertCell(0);
    a.style.width = "30px";
    a.style.height = "30px";
    a.style.verticalAlign = "top";
    this.Qm = createElement("img", a, null, null);
    this.Qm.className = "characterImage";
    this.Qm.src = "images/Transparent.gif";
    this.Qm.style.height = "30px";
    this.Qm.style.width = "30px";
    a = b.insertCell(1);
    a.style.width = "70px";
    a.style.paddingLeft = "2px";
    a.style.textAlign = "left";
    this.iA = createElement("span", a, null, null);
    b = b.insertCell(2);
    b.style.width = "140px";
    b.style.paddingLeft = "2px";
    b.style.textAlign = "right";
    this.ks = createElement("span", b, null, null);
    this.ks.style.marginLeft = "10px";
    this.ks.style.color = "#0A0";
  };
  AutoDungeonDetails.prototype.Na = function () {
    return 13;
  };
  AutoDungeonDetails.prototype.reset = function () {
    this.gb = this.fb = "";
  };
  AutoDungeonDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  AutoDungeonDetails.prototype.te = function () {
    if (!this.$e) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.$e);
      this.shown = true;
    }
  };
  AutoDungeonDetails.prototype.update = function () {
    var a = this.upgrade.lb(),
      b = this.upgrade.ib();
    if (this.oz != b) {
      this.oz = b;
      this.we.innerHTML = b;
    }
    if (this.fb != a) {
      this.fb = a;
      this.mf.innerHTML = a;
    }
  };
  AutoDungeonDetails.prototype.eb = function () {
    this.$e = createElement("table", this.contentContainer, null, null);
    this.$e.style.width = "100%";
    var a = this.$e.insertRow(0),
      b = this.$e.insertRow(1),
      c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.mo = createElement("img", c, null, null);
    this.mo.src = "images/Transparent.gif";
    this.mo.style.width = "50px";
    this.mo.style.height = "50px";
    c = game.terrainSprites.getSprite(game.castles.Ny);
    this.mo.style.background = "url('spritesheet/terrain.png') -" + c.sourceX + "px -" + c.sourceY + "px";
    a = a.insertCell(1);
    a.style.textAlign = "left";
    this.we = createElement("span", a, null, null);
    this.we.innerHTML = this.upgrade.ib();
    this.mf = b.insertCell(0);
    this.mf.colSpan = 2;
    this.mf.style.width = "200px";
    this.mf.style.textAlign = "left";
  };
  EquipmentSetDetails.prototype.Na = function () {
    return 4;
  };
  EquipmentSetDetails.prototype.reset = function () {
    this.sr.length = 0;
  };
  EquipmentSetDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  EquipmentSetDetails.prototype.te = function () {
    if (!this.Bf) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.Bf);
      this.shown = true;
    }
  };
  EquipmentSetDetails.prototype.update = function () {
    var a = this.upgrade.Nz(),
      b,
      c,
      d,
      f = Math.min(5, a.length);
    for (b = 0; b < f; b++) {
      if (c = a[b], this.sr.length < b || this.sr[b] !== c) {
        this.sr[b] = c;
        d = c.Uk();
        this.IA[b].style.background = "url('spritesheet/items.png') -" + d.sourceX + "px -" + d.sourceY + "px";
        this.JA[b].innerHTML = getHighlightedItemName(c);
        this.Rw[b].className = getRarityClass(c.uf());
        this.Rw[b].innerHTML = " (" + getItemRarityLabel(c) + ")";
      }
    }
  };
  EquipmentSetDetails.prototype.eb = function () {
    this.Bf = createElement("table", this.contentContainer, null, null);
    this.Bf.style.width = "100%";
    var a = this.Bf.insertRow(0).insertCell(0);
    a.colSpan = 2;
    a.style.textAlign = "left";
    a.innerHTML = "装备所有道具升级";
    appendEquipmentRow(this, 1);
    appendEquipmentRow(this, 2);
    appendEquipmentRow(this, 3);
    appendEquipmentRow(this, 4);
    appendEquipmentRow(this, 5);
  };
  SkillUpgradeDetails.prototype.Na = function () {
    return SKILL_UPGRADE_TYPE;
  };
  SkillUpgradeDetails.prototype.reset = function () {
    this.gb = this.fb = null;
  };
  SkillUpgradeDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  SkillUpgradeDetails.prototype.te = function () {
    if (!this.wn) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.wn);
      showElement(this.kq);
      this.shown = true;
    }
  };
  SkillUpgradeDetails.prototype.update = function () {
    var a = this.upgrade.ib(),
      b = this.upgrade.lb();
    if (this.gb !== a) {
      this.gb = a;
      this.jb.innerHTML = a;
    }
    if (this.fb !== b) {
      this.fb = b;
      this.sb.innerHTML = b;
    }
  };
  SkillUpgradeDetails.prototype.eb = function () {
    this.wn = createElement("div", this.contentContainer, null, null);
    this.wn.style.position = "relative";
    this.wn.style.height = "30px";
    this.kq = createElement("div", this.contentContainer, null, null);
    this.kq.style.position = "relative";
    this.kq.style.height = "30px";
    this.jb = createElement("div", this.wn, null, null);
    this.jb.style.position = "absolute";
    this.jb.style.top = "0";
    this.jb.style.left = "3px";
    this.jb.style.right = "3px";
    this.jb.style.height = "25px";
    this.jb.style.paddingTop = "5px";
    this.jb.style.textAlign = "left";
    this.sb = createElement("div", this.kq, null, null);
    this.sb.style.position = "absolute";
    this.sb.style.left = "3px";
    this.sb.style.top = "0";
    this.sb.style.right = "0";
    this.sb.style.height = "25px";
    this.sb.style.paddingTop = "5px";
    this.sb.style.textAlign = "left";
  };
  SpellUpgradeDetails.prototype.Na = function () {
    return 6;
  };
  SpellUpgradeDetails.prototype.reset = function () {
    this.Lv = null;
  };
  SpellUpgradeDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  SpellUpgradeDetails.prototype.te = function () {
    if (!this.table) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.table);
      this.shown = true;
    }
  };
  SpellUpgradeDetails.prototype.update = function () {
    var a = this.upgrade.uw();
    if (this.Lv !== a) {
      this.Lv = a;
      var b = a.spellCategoryId;
      if (10 === b || 9 === b || 17 === b || 11 === b) {
        a = minionsBySpell[a.name].spriteName;
        this.Dx = game.monsterSprites;
        this.zn = game.monsterSprites.getSprite(a);
        this.nd = false;
        this.yn.style.background = "url('spritesheet/monsters.png') -" + (this.zn.sourceX + 10) + "px -" + (this.zn.sourceY + 12) + "px";
      } else {
        a = a.impactEffectName;
        this.Dx = game.animations.Yh[a];
        this.zn = game.animations.Zg(a);
        this.De = this.oc = 0;
        this.nd = true;
      }
      this.Ml.innerHTML = this.upgrade.ib();
      this.vu.innerHTML = this.upgrade.lb();
    }
    if (this.nd) {
      this.De++;
      if (this.De >= this.qw) {
        this.De = 0;
        this.oc++;
        if (this.oc >= this.zn.To()) {
          this.oc = 0;
        }
        a = this.zn.frames[this.oc];
        this.yn.style.background = "url('" + this.Dx.fileName + "') -" + a.frameSourceX + "px -" + a.frameSourceY + "px";
      }
    }
  };
  SpellUpgradeDetails.prototype.eb = function () {
    this.table = createElement("table", this.contentContainer, null, null);
    this.table.style.width = "100%";
    this.table.style.height = "60px";
    var a = this.table.insertRow(0),
      b = this.table.insertRow(1),
      c = a.insertCell(0),
      a = a.insertCell(1);
    c.style.width = "29px";
    c.style.height = "29px";
    c.style.textAlign = "center";
    a.style.width = "180px";
    a.style.textAlign = "left";
    this.yn = createElement("img", c, null, null);
    this.yn.src = "images/Transparent.gif";
    this.yn.style.width = "29px";
    this.yn.style.height = "29px";
    this.Ml = createElement("span", a, null, null);
    this.Ml.style.paddingTop = "5px";
    this.Ml.style.textAlign = "left";
    b = b.insertCell(0);
    b.colSpan = 2;
    b.style.textAlign = "left";
    this.vu = createElement("span", b, null, null);
    this.vu.style.paddingTop = "5px";
  };
  MonsterLevelDetails.prototype.Na = function () {
    return 7;
  };
  MonsterLevelDetails.prototype.reset = function () {
    this.Lb = -1;
    this.gb = this.fb = null;
  };
  MonsterLevelDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  MonsterLevelDetails.prototype.te = function () {
    if (!this.kk) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.kk);
      showElement(this.Dq);
      this.shown = true;
    }
  };
  MonsterLevelDetails.prototype.update = function () {
    var a = this.upgrade.Bb(),
      b = this.upgrade.ib(),
      c = this.upgrade.lb();
    if (this.Lb !== a) {
      this.Lb = a;
      this.dj.innerHTML = formatAmount(a);
    }
    if (this.gb !== b) {
      this.gb = b;
      this.fj.innerHTML = b;
    }
    if (this.fb !== c) {
      this.fb = c;
      this.ej.innerHTML = c;
    }
  };
  MonsterLevelDetails.prototype.eb = function () {
    this.kk = createElement("div", this.contentContainer, null, null);
    this.kk.style.position = "relative";
    this.kk.style.height = "30px";
    this.Dq = createElement("div", this.contentContainer, null, null);
    this.Dq.style.position = "relative";
    this.Dq.style.height = "30px";
    var a = createElement("div", this.kk, null, null);
    a.style.position = "absolute";
    a.style.right = "3px";
    a.style.top = "0";
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.dj = createElement("div", this.kk, null, null);
    this.dj.style.position = "absolute";
    this.dj.style.right = "36px";
    this.dj.style.top = "0";
    this.dj.style.width = "40px";
    this.dj.style.height = "25px";
    this.dj.style.paddingTop = "5px";
    this.dj.style.textAlign = "right";
    this.fj = createElement("div", this.kk, null, null);
    this.fj.style.position = "absolute";
    this.fj.style.right = "82px";
    this.fj.style.top = "0";
    this.fj.style.left = "3px";
    this.fj.style.height = "25px";
    this.fj.style.paddingTop = "5px";
    this.fj.style.textAlign = "left";
    this.ej = createElement("div", this.Dq, null, null);
    this.ej.style.position = "absolute";
    this.ej.style.left = "3px";
    this.ej.style.top = "0";
    this.ej.style.right = "0";
    this.ej.style.height = "25px";
    this.ej.style.paddingTop = "5px";
    this.ej.style.textAlign = "left";
  };
  DungeonPurchaseDetails.prototype.Na = function () {
    return 8;
  };
  DungeonPurchaseDetails.prototype.reset = function () {
    this.Lb = -1;
    this.ui = null;
  };
  DungeonPurchaseDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  DungeonPurchaseDetails.prototype.te = function () {
    if (!this.bf) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.bf);
      this.shown = true;
    }
  };
  DungeonPurchaseDetails.prototype.update = function () {
    var a = this.upgrade.Bb(),
      b = this.upgrade.Wo();
    if (this.Lb !== a) {
      this.Lb = a;
      this.Cq.innerHTML = formatAmount(a);
    }
    if (this.ui !== b && (this.ui = b)) {
      a = game.terrainSprites.getSprite(b.Fo);
      this.Nd.style.background = "url('spritesheet/terrain.png') -" + a.sourceX + "px -" + a.sourceY + "px";
      this.Vg.innerHTML = b.dungeonName;
    }
  };
  DungeonPurchaseDetails.prototype.eb = function () {
    this.bf = createElement("table", this.contentContainer, null, null);
    this.bf.style.width = "100%";
    var a = this.bf.insertRow(0),
      b = this.bf.insertRow(1),
      c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.Nd = createElement("img", c, null, null);
    this.Nd.src = "images/Transparent.gif";
    this.Nd.style.width = "50px";
    this.Nd.style.height = "50px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    this.we = createElement("span", c, null, null);
    this.we.innerHTML = this.upgrade.ib();
    c = a.insertCell(2);
    this.Cq = createElement("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = createElement("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.Vg = b.insertCell(0);
    this.Vg.colSpan = 3;
    this.Vg.style.width = "200px";
    this.Vg.style.textAlign = "left";
  };
  ScrollUpgradeDetails.prototype.Na = function () {
    return 12;
  };
  ScrollUpgradeDetails.prototype.reset = function () {
    this.Lb = -1;
    this.tm = null;
  };
  ScrollUpgradeDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  ScrollUpgradeDetails.prototype.te = function () {
    if (!this.sn) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.sn);
      this.shown = true;
    }
  };
  ScrollUpgradeDetails.prototype.update = function () {
    var a = this.upgrade.Bb(),
      b = this.upgrade.Pz(),
      c = this.upgrade.ib(),
      d = this.upgrade.lb();
    if (this.Lb !== a) {
      this.Lb = a;
      this.Cq.innerHTML = formatAmount(a);
    }
    if (this.tm !== b && (this.tm = b)) {
      a = b.Wh;
      this.Vh.style.background = "url('spritesheet/items.png') -" + a.sourceX + "px -" + a.sourceY + "px";
    }
    if (this.gb !== c) {
      this.gb = c;
      this.dq.innerHTML = c;
    }
    if (this.Az !== d) {
      this.Az = d;
      this.we.innerHTML = this.upgrade.lb();
    }
  };
  ScrollUpgradeDetails.prototype.eb = function () {
    this.sn = createElement("table", this.contentContainer, null, null);
    this.sn.style.width = "100%";
    var a = this.sn.insertRow(0),
      b = this.sn.insertRow(1),
      c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "30px";
    c.style.height = "30px";
    c.style.textAlign = "center";
    this.Vh = createElement("img", c, null, null);
    this.Vh.src = "images/Transparent.gif";
    this.Vh.style.width = "30px";
    this.Vh.style.height = "30px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    this.we = createElement("span", c, null, null);
    this.we.innerHTML = this.upgrade.ib();
    c = a.insertCell(2);
    this.Cq = createElement("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = createElement("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.dq = b.insertCell(0);
    this.dq.colSpan = 3;
    this.dq.style.width = "200px";
    this.dq.style.textAlign = "left";
  };
  CastlePurchaseDetails.prototype.Na = function () {
    return 9;
  };
  CastlePurchaseDetails.prototype.reset = function () {
    this.Gk = -1;
  };
  CastlePurchaseDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  CastlePurchaseDetails.prototype.te = function () {
    if (!this.Cm) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.Cm);
      this.shown = true;
    }
  };
  CastlePurchaseDetails.prototype.update = function () {
    var a = game.dungeons.Sd;
    if (this.Gk !== a) {
      this.Gk = a;
      this.Uz.innerHTML = "+" + formatAmount(a);
    }
  };
  CastlePurchaseDetails.prototype.eb = function () {
    this.Cm = createElement("table", this.contentContainer, null, null);
    this.Cm.style.width = "100%";
    var a = this.Cm.insertRow(0),
      b = this.Cm.insertRow(1),
      c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.Nd = createElement("img", c, null, null);
    this.Nd.src = "images/Transparent.gif";
    this.Nd.style.width = "50px";
    this.Nd.style.height = "50px";
    c = game.terrainSprites.getSprite("L2_DungeonE.PNG");
    this.Nd.style.background = "url('spritesheet/terrain.png') -" + c.sourceX + "px -" + c.sourceY + "px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    c.style.width = "150px";
    this.we = createElement("span", c, null, null);
    this.we.innerHTML = this.upgrade ? this.upgrade.ib() : "收获地牢";
    c = a.insertCell(2);
    this.Uz = createElement("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = createElement("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    b = b.insertCell(0);
    b.colSpan = 3;
    b.style.textAlign = "left";
    b.innerHTML = this.upgrade ? this.upgrade.lb() : "收集杀戮农场";
  };
  FarmUpgradeDetails.prototype.Na = function () {
    return 10;
  };
  FarmUpgradeDetails.prototype.reset = function () {
    this.Dk = -1;
  };
  FarmUpgradeDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  FarmUpgradeDetails.prototype.te = function () {
    if (!this.Hm) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.Hm);
      this.shown = true;
    }
  };
  FarmUpgradeDetails.prototype.update = function () {
    var a = game.shops.ni;
    if (this.Dk !== a) {
      this.Dk = a;
      this.Tz.innerHTML = "+" + formatAmount(a);
    }
  };
  FarmUpgradeDetails.prototype.eb = function () {
    this.Hm = createElement("table", this.contentContainer, null, null);
    this.Hm.style.width = "100%";
    var a = this.Hm.insertRow(0),
      b = this.Hm.insertRow(1),
      c = a.insertCell(0);
    c.rowSpan = 2;
    c.style.width = "50px";
    c.style.height = "50px";
    c.style.textAlign = "center";
    this.Nd = createElement("img", c, null, null);
    this.Nd.src = "images/Transparent.gif";
    this.Nd.style.width = "50px";
    this.Nd.style.height = "50px";
    c = game.terrainSprites.getSprite("L2_Terrain077.PNG");
    this.Nd.style.background = "url('spritesheet/terrain.png') -" + c.sourceX + "px -" + c.sourceY + "px";
    c = a.insertCell(1);
    c.style.textAlign = "left";
    c.style.width = "150px";
    this.we = createElement("span", c, null, null);
    this.we.innerHTML = this.upgrade ? this.upgrade.ib() : "收集道具黄金";
    c = a.insertCell(2);
    this.Tz = createElement("span", c, null, null);
    a = a.insertCell(3);
    a.style.width = "30px";
    a = createElement("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/items.png') -1464px -73px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    b = b.insertCell(0);
    b.colSpan = 3;
    b.style.textAlign = "left";
    b.innerHTML = this.upgrade ? this.upgrade.lb() : "卖掉道具得到黄金";
  };
  CharacterLevelDetails.prototype.Na = function () {
    return 11;
  };
  CharacterLevelDetails.prototype.reset = function () {
    this.Lb = -1;
    this.gb = this.Bs = null;
    this.vi = -1;
    this.cn = this.an = this.$m = this.bn = this.jr = this.hr = this.ir = this.gr = 0;
  };
  CharacterLevelDetails.prototype.Rc = function (a) {
    this.upgrade = a;
    this.Lb = -1;
    this.gb = this.Bs = null;
    this.vi = -1;
    this.cn = this.an = this.$m = this.bn = this.jr = this.hr = this.ir = this.gr = 0;
  };
  CharacterLevelDetails.prototype.te = function () {
    if (!this.table) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.table);
      this.shown = true;
    }
  };
  CharacterLevelDetails.prototype.update = function () {
    var a = this.upgrade.Bb(),
      b = this.upgrade.ib(),
      c = this.upgrade.Kr();
    if (this.Lb != a) {
      this.Lb = a;
      this.pi.innerHTML = formatAmount(a);
    }
    if (this.gb != b) {
      this.gb = b;
      this.jb.innerHTML = b;
    }
    if (this.vi != c) {
      this.vi = c;
      a = Math.max(1, 10 * (this.vi - 1)) + 1;
      this.bn = scaleByLevel(a, monsterHealthCurve, 1);
      this.$m = scaleByLevel(a, monsterSpiritCurve, 1);
      this.an = scaleByLevel(a, monsterAttackCurve, 1);
      this.cn = scaleByLevel(a, monsterDefenceCurve, 1);
      this.kr.innerHTML = formatAmount(this.bn) + " 伤害";
      this.Rq.innerHTML = formatAmount(this.$m) + " 护甲";
      this.Sq.innerHTML = formatAmount(this.an) + " 攻击";
      this.lr.innerHTML = formatAmount(this.cn) + " 防御";
      c = getMonsterTypesForLevel(game.monsterCatalog, c);
      c = c[randomInt(c.length)].ll;
      this.Zm.style.background = "url('spritesheet/monsters.png') -" + (c.sourceX + 10) + "px -" + (c.sourceY + 12) + "px";
    }
    for (var d, f = 0, g = 0, h = 0, l = 0, c = getPartyMinLevel(), a = this.upgrade.Kr(), b = 0; b < game.state.adventurers.length; b++) {
      d = game.state.adventurers[b].stats;
      f += statValue(d.damage);
      g += statValue(d.armor);
      h += statValue(d.attackRating);
      l += statValue(d.defenceRating);
    }
    f = floorNumber(f / game.state.adventurers.length);
    g = floorNumber(g / game.state.adventurers.length);
    h = floorNumber(h / game.state.adventurers.length);
    l = floorNumber(l / game.state.adventurers.length);
    if (this.ir !== f) {
      this.Rq.style.color = this.$m >= f ? "#F00" : "#0A0";
      this.ir = f;
    }
    if (this.gr !== g) {
      this.kr.style.color = this.bn >= g ? "#F00" : "#0A0";
      this.gr = g;
    }
    if (this.hr !== h) {
      this.lr.style.color = this.cn >= h ? "#F00" : "#0A0";
      this.hr = h;
    }
    if (this.jr !== l) {
      this.Sq.style.color = this.an >= l ? "#F00" : "#0A0";
      this.jr = l;
    }
    b = (f > this.$m ? 1 : 0) + (g > this.bn ? 1 : 0) + (h > this.cn ? 1 : 0) + (l > this.an ? 1 : 0);
    c = c < a ? "最低角色等级需求: " + a : 4 === b ? "评定: 小菜一碟" : 3 === b ? "评定: 有点挑战" : 2 === b ? "评定: 非常困难!" : "评定: 难如登天!";
    if (this.Bs !== c) {
      this.Bs = c;
      this.sb.innerHTML = c;
    }
  };
  CharacterLevelDetails.prototype.eb = function () {
    this.table = createElement("table", this.contentContainer, null, null);
    this.table.style.width = "100%";
    var a = this.table.insertRow(0),
      b = this.table.insertRow(1),
      c = this.table.insertRow(2),
      d = a.insertCell(0),
      f = a.insertCell(1),
      a = a.insertCell(2),
      b = b.insertCell(0);
    d.style.width = "190px";
    f.style.width = "40px";
    f.style.textAlign = "right";
    f.style.paddingTop = "0";
    a.style.width = "30px";
    a.style.height = "30px";
    b.style.height = "20px";
    b.colSpan = 4;
    a = createElement("div", a, null, null);
    a.style.width = "30px";
    a.style.height = "100%";
    a.style.textAlign = "left";
    a.style.background = "url('spritesheet/terrain.png') -1302px -363px";
    a = createElement("img", a, null, null);
    a.src = "images/Transparent.gif";
    a.style.width = "100%";
    a.style.height = "15px";
    this.pi = createElement("span", f, null, null);
    this.pi.style.width = "40px";
    this.pi.style.height = "25px";
    this.jb = createElement("div", d, null, null);
    this.jb.style.textAlign = "left";
    this.sb = createElement("div", b, null, null);
    this.sb.style.textAlign = "left";
    c = c.insertCell(0);
    c.colSpan = 3;
    c = createElement("table", c, null, null);
    c.style.width = "100%";
    d = c.insertRow(0);
    c = c.insertRow(1);
    f = d.insertCell(0);
    b = d.insertCell(1);
    d = d.insertCell(2);
    f.rowSpan = 2;
    f.style.width = "30px";
    f.style.height = "30px";
    b.style.width = "100px";
    b.style.textAlign = "right";
    d.style.width = "100px";
    d.style.textAlign = "right";
    this.Zm = createElement("img", f, null, null);
    this.Zm.className = "characterImage";
    this.Zm.src = "images/Transparent.gif";
    this.Zm.style.height = "30px";
    this.Zm.style.width = "30px";
    this.kr = createElement("span", b, null, null);
    this.kr.style.marginLeft = "3px";
    this.Sq = createElement("span", d, null, null);
    this.Sq.style.marginLeft = "15px";
    d = c.insertCell(0);
    c = c.insertCell(1);
    d.style.width = "100px";
    d.style.textAlign = "right";
    c.style.width = "100px";
    c.style.textAlign = "right";
    this.Rq = createElement("span", d, null, null);
    this.Rq.style.marginLeft = "3px";
    this.lr = createElement("span", c, null, null);
    this.lr.style.marginLeft = "15px";
  };
  AchievementClaimDetails.prototype.Na = function () {
    return 14;
  };
  AchievementClaimDetails.prototype.reset = function () {
    this.gb = this.fb = null;
  };
  AchievementClaimDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  AchievementClaimDetails.prototype.te = function () {
    if (!this.jb) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.jb);
      showElement(this.sb);
      this.shown = true;
    }
  };
  AchievementClaimDetails.prototype.update = function () {
    var a = this.upgrade.ib(),
      b = this.upgrade.lb();
    if (this.gb !== a) {
      this.gb = a;
      this.jb.innerHTML = a;
    }
    if (this.fb !== b) {
      this.fb = b;
      this.sb.innerHTML = b;
    }
  };
  AchievementClaimDetails.prototype.eb = function () {
    var a = createElement("div", this.contentContainer, null, null);
    a.style.padding = "5px";
    a.style.color = "#FA0";
    a.style.fontWeight = "bold";
    a.innerHTML = "成就!";
    this.jb = createElement("div", this.contentContainer, null, null);
    this.jb.style.padding = "5px";
    this.sb = createElement("div", this.contentContainer, null, null);
    this.sb.style.padding = "5px";
  };
  AchievementProgressDetails.prototype.Na = function () {
    return 15;
  };
  AchievementProgressDetails.prototype.reset = function () {
    this.gb = this.fb = null;
  };
  AchievementProgressDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  AchievementProgressDetails.prototype.te = function () {
    if (!this.jb) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.jb);
      showElement(this.sb);
      this.shown = true;
    }
  };
  AchievementProgressDetails.prototype.update = function () {
    var a = this.upgrade.ib(),
      b = this.upgrade.lb();
    if (this.gb !== a) {
      this.gb = a;
      this.jb.innerHTML = a;
    }
    if (this.fb !== b) {
      this.fb = b;
      this.sb.innerHTML = b;
    }
  };
  AchievementProgressDetails.prototype.eb = function () {
    this.jb = createElement("div", this.contentContainer, null, null);
    this.jb.style.padding = "5px";
    this.sb = createElement("div", this.contentContainer, null, null);
    this.sb.style.padding = "5px";
  };
  PointUpgradeDetails.prototype.Na = function () {
    return 16;
  };
  PointUpgradeDetails.prototype.reset = function () {
    this.gb = this.fb = null;
    this.Lb = -1;
  };
  PointUpgradeDetails.prototype.Rc = function (a) {
    this.upgrade = a;
  };
  PointUpgradeDetails.prototype.te = function () {
    if (!this.jb) {
      this.eb();
    }
    if (!this.shown) {
      showElement(this.jb);
      showElement(this.sb);
      showElement(this.pi);
      this.shown = true;
    }
  };
  PointUpgradeDetails.prototype.update = function () {
    var a = this.upgrade.ib(),
      b = this.upgrade.lb(),
      c = this.upgrade.Bb();
    if (this.gb != a) {
      this.gb = a;
      this.jb.innerHTML = a;
    }
    if (this.fb != b) {
      this.fb = b;
      this.sb.innerHTML = b;
    }
    if (this.Lb != c) {
      this.Lb = c;
      this.pi.innerHTML = formatGroupedAmount(c) + " AP";
    }
  };
  PointUpgradeDetails.prototype.eb = function () {
    this.jb = createElement("div", this.contentContainer, null, null);
    this.jb.style.padding = "5px";
    this.sb = createElement("div", this.contentContainer, null, null);
    this.sb.style.padding = "5px";
    this.pi = createElement("div", this.contentContainer, null, null);
    this.pi.style.padding = "5px";
  };
  UpgradeListView.prototype = new View();
  UpgradeListView.prototype.reset = function () {
    clearElementById(this.elementId);
    var a;
    for (a = 0; a < this.gj.length; a++) {
      this.gj[a].reset();
    }
    var b = this.py.upgrades;
    for (a = 0; a < this.gj.length; a++) {
      this.gj[a].Rc(b[a]);
    }
    this.mj = -100;
  };
  UpgradeListView.prototype.update = function () {
    var a;
    a = this.py.mj;
    if (this.mj !== a) {
      this.mj = a;
      var b = this.py.upgrades;
      for (a = 0; a < this.gj.length; a++) {
        this.gj[a].Rc(b[a]);
      }
    }
    for (a = 0; a < this.gj.length; a++) {
      this.gj[a].render();
    }
  };
}
