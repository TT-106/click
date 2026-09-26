/** 远征资源、队员摘要、卷轴与药水。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { View, addChildView, resetChildViews } from "./base.js";
import { clearElement, clearElementById, createElement, getElement, hideElement, hideElementById, setElementHtml, showElement, showElementById } from "./dom.js";
import { game } from "../runtime/game.js";
import { BASE_POTION_CAPACITY, infiniteScrollsModifier, partyCapacityBonus, potionCapacityBonus, potionDurationBonus, quickUpgradeCollection } from "../content/balance.js";
import { statValue } from "../characters/stats.js";
import { floorNumber, formatAmount, formatGroupedAmount } from "../core/math.js";
import { statusEffectDefinitions } from "../combat/skill-effects.js";
import { getMonsters } from "../combat/encounters.js";
import { positionScrollCaster } from "../simulation/tick.js";
import { castScroll } from "../combat/scrolls.js";
import { isPotionModifierActive } from "../combat/potions.js";
import { GameCanvasView } from "../rendering/scene.js";
import { UpgradeListView } from "./upgrade-details.js";
import { TreasureLootView } from "./dungeons.js";
import { TabView } from "./navigation.js";
export function AdventurerSummaryView(a) {
  this.elementId = "gameTabAdventurerInfo" + a;
  this.visible = true;
  this.adventurerIndex = a;
  this.Nq = null;
  this.Wl = ["adventurerEffectIconA" + a, "adventurerEffectIconB" + a, "adventurerEffectIconC" + a, "adventurerEffectIconD" + a, "adventurerEffectIconE" + a, "adventurerEffectIconF" + a];
  this.Ay = "adventurerHealthSlider" + a;
  this.zy = "adventurerHealth" + a;
  this.Lq = "adventurerDamage" + a;
  this.Jq = "adventurerArmor" + a;
  this.Kq = "adventurerAR" + a;
  this.Mq = "adventurerDR" + a;
  this.By = "adventurerLevelClass" + a;
  this.Dy = "adventurerSpiritPowerSlider" + a;
  this.Cy = "adventurerSpiritPower" + a;
  this.nn = this.Ak = this.pk = this.ok = this.zk = null;
  this.uv = this.sv = this.rv = this.tv = this.cachedLevel = this.rr = this.pr = this.or = this.qr = this.mv = this.Jk = this.kv = this.av = -1;
  this.qm = [null, null, null, null, null, null];
  this.lk = [null, null, null, null, null, null];
  this.Dm = [0, 0, 0, 0, 0, 0];
  this.qw = 8;
  this.frameAge = 0;
  this.vj = -1;
  this.Oq = false;
}
export function colorComparedStats(a, b, c, d, f, g) {
  if (b != d || c != f) {
    if (b < c) {
      getElement(a).style.color = "#F00";
      g.style.color = "#F00";
    } else {
      if (b > c) {
        getElement(a).style.color = "#0A0";
        g.style.color = "#0A0";
      } else {
        getElement(a).style.color = "#FFF";
        g.style.color = "#FFF";
      }
    }
  }
}
export function DungeonNotificationView() {
  this.elementId = "dungeonNotificationPanel";
  this.visible = false;
  this.dungeonName = "";
  this.nl = null;
  this.Su = this.Bk = "";
}
export function EncounterNotificationView() {
  this.elementId = "encounterNotificationPanel";
  this.visible = false;
  this.nl = null;
  this.bA = this.xz = this.vj = -1;
  this.Bz = false;
}
export function CurrencyView() {
  this.elementId = "currencyPanel";
  this.visible = true;
  this.pD = "expCell";
  this.tD = "goldAmountCell";
  this.Hw = "killsCountCell";
  this.rm = this.vz = this.uz = -1;
}
export function AdventurePointsView(a) {
  this.elementId = a;
  this.visible = true;
  this.Np = null;
  this.qz = -1;
}
export function mountAdventurePoints(a) {
  var b = createElement("table", getElement(a.elementId), null, null);
  b.style.width = "100%";
  b = b.insertRow(0);
  a.Np = b.insertCell(0);
  b = b.insertCell(1);
  a.Np.style.textAlign = "right";
  a.Np.style.paddingTop = "5px";
  b.style.width = "30px";
  b.style.paddingTop = "5px";
  b.style.textAlign = "left";
  b.title = "冒险点数";
  b.innerHTML = "AP";
}
export function ScrollButtonCollection(a) {
  this.Gw = {};
  this.qp = [];
  var b, c, d;
  for (b = 0; b < (/** @type {any} */ (a)).length; b++) {
    for (d = a[b], c = 0; c < d.length; c++) {
      this.qp.push(d[c]);
    }
  }
  scrollButtonsChanged(this);
  clearScrollButtons(this);
}
export function clearScrollButtons(a) {
  document.onkeyup = function (b) {
    a.Gw[b.keyCode] = true;
  };
}
export function scrollButtonsChanged(a) {
  var b;
  for (b = 0; b < a.qp.length; b++) {
    a.Gw[a.qp[b]] = false;
  }
}
export function ScrollButtonView(a, b, c, d) {
  this.elementId = a;
  this.visible = true;
  this.itemImage = this.Cx = this.mx = this.$p = this.tm = this.scroll = null;
  this.aq = false;
  this.Gv = !this.aq;
  this.rz = -1;
  this.yz = null;
  this.wz = true;
  this.YC = b;
  this.Qr = c;
  this.qp = d;
}
export function getScrollButtonClass(a) {
  if (a.scroll && (0 < a.scroll.quantity || infiniteScrollsModifier.currentValue)) {
    positionScrollCaster(a.YC);
    castScroll(a.scroll, infiniteScrollsModifier.currentValue);
  }
}
export function mountScrollButton(a) {
  a.$p = createElement("div", getElement(a.elementId), null, "scrollButtonDisabled");
  a.Gv = false;
  var b = createElement("table", a.$p, null, null),
    c = b.insertRow(0),
    b = b.insertRow(1),
    d = c.insertCell(0);
  d.rowSpan = 2;
  a.mx = c.insertCell(1);
  a.Cx = b.insertCell(0);
  a.mx.style.textAlign = "left";
  a.Cx.style.textAlign = "left";
  a.itemImage = createElement("img", d, null, "itemImage");
  a.itemImage.style.height = "30px";
  a.itemImage.src = "images/Transparent.gif";
  a.$p.onmouseup = function () {
    getScrollButtonClass(a);
    return false;
  };
}
export function ScrollBarView() {
  this.elementId = "scrollButtonContainer";
  this.visible = true;
  this.fu = null;
  this.Zs = [];
  this.oA = [[49, 35, 97], [50, 40, 98], [51, 34, 99], [52, 37, 100], [53, 12, 101], [54, 39, 102]];
  this.Qr = new ScrollButtonCollection(this.oA);
}
export function PotionButtonView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.potion = null;
  this.TA = b;
  this.yo = this.sm = null;
  this.gu = 192;
  this.Pp = this.Op = this.Tp = this.yj = this.Si = this.progressFillElement = this.km = null;
  this.ak = false;
  this.Jh = -1;
  this.Sp = this.Bo = false;
}
export function mountPotionButton(a) {
  a.km = createElement("div", getElement(a.elementId), null, "potionContentContainer");
  a.Sp = a.TA >= BASE_POTION_CAPACITY + potionCapacityBonus.currentValue;
  a.Si = createElement("table", a.km, null, a.Sp ? "potionButtonLocked" : "potionButtonDisabled");
  var b = a.Si.insertRow(0),
    c = a.Si.insertRow(1),
    d = b.insertCell(0);
  d.rowSpan = 2;
  a.Tp = b.insertCell(1);
  a.Op = c.insertCell(0);
  a.Tp.style.textAlign = "left";
  a.Op.style.textAlign = "left";
  a.Pp = createElement("img", d, null, "itemImage");
  a.Pp.src = "images/Transparent.gif";
  a.km.onmouseup = function () {
    a.aw();
    return false;
  };
  a.progressFillElement = createElement("div", a.km, null, "potionButtonProgressSlider");
  a.ak = false;
  a.yj = createElement("div", a.km, null, "dropPotionButton");
  a.yj.title = "丢弃药剂";
  a.yj.innerHTML = "X";
  a.yj.style.display = "none";
  a.Bo = false;
  a.yj.onmouseup = function () {
    a.bw();
    return false;
  };
}
export function PotionBarView() {
  this.elementId = "potionButtonContainer";
  this.visible = true;
  this.su = false;
  this.Ms = [];
}
export function ExpeditionView(a) {
  this.elementId = "gameTabContent";
  this.tabState = a;
  addChildView(this, new GameCanvasView());
  addChildView(this, new DungeonNotificationView());
  addChildView(this, new EncounterNotificationView());
  addChildView(this, new CurrencyView());
  addChildView(this, new AdventurePointsView("adventurePointsPanel"));
  addChildView(this, new UpgradeListView("upgradeButtonContainer", quickUpgradeCollection, false));
  addChildView(this, new TreasureLootView());
  addChildView(this, new ScrollBarView());
  addChildView(this, new PotionBarView());
  addChildView(this, new AdventurerSummaryView(0));
  addChildView(this, new AdventurerSummaryView(1));
  addChildView(this, new AdventurerSummaryView(2));
  addChildView(this, new AdventurerSummaryView(3));
  addChildView(this, new AdventurerSummaryView(4));
}
export function initializeViewsExpedition() {
  AdventurerSummaryView.prototype = new View();
  AdventurerSummaryView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.Nq = null;
    this.Oq = false;
    this.nn = null;
    if (0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length) {
      if (this.adventurerIndex >= 4 + partyCapacityBonus.currentValue) {
        this.nn = createElement("div", getElement(this.elementId), null, "gameTabLockedAdventurerInfo");
        createElement("span", this.nn, null, "lockedSpanText").innerHTML = "未解锁";
        this.Oq = true;
      } else {
        this.nn = createElement("div", getElement(this.elementId), null, "gameTabBlankAdventurerInfo");
      }
    } else {
      this.vj = this.rr = this.pr = this.or = this.qr = this.mv = this.Jk = this.kv = this.av = this.cachedLevel = -1;
      var a;
      for (a = 0; a < this.qm.length; a++) {
        this.qm[a] = null;
        this.lk[a] = null;
        this.Dm[a] = 0;
      }
      this.Nq = createElement("table", getElement(this.elementId), null, "adventurerInfoTable");
      a = this.Nq.insertRow(0);
      var b = a.insertCell(0);
      b.className = "gameTabAdventurerIconCell";
      b.rowSpan = 2;
      var c = game.state.adventurers[this.adventurerIndex],
        d = c.getSprite(),
        b = createElement("img", b, null, "characterImage");
      b.src = "images/Transparent.gif";
      b.style.height = "35px";
      b.style.background = "url('spritesheet/monsters.png') -" + d.sourceX + "px -" + (d.sourceY + 8) + "px";
      d = a.insertCell(1);
      d.style.width = "123px";
      d.innerHTML = c.adventurerName;
      c = a.insertCell(2);
      c.className = "gameTabAdventurerSliderCell";
      c.title = "生命值";
      d = createElement("div", c, null, null);
      d.className = "gameTabAdventurerSliderDiv";
      createElement("div", d, this.Ay, "gameTabAdventurerHealthSlider");
      createElement("div", c, this.zy, "gameTabAdventurerSliderOverlay");
      c = a.insertCell(3);
      c.style.width = "30px";
      c.style.textAlign = "left";
      c.style.paddingLeft = "4px";
      c.title = "生命值";
      c.innerHTML = "HP";
      c = a.insertCell(4);
      c.id = this.Lq;
      c.title = "伤害:提高攻击伤害";
      c.className = "gameTabAdventurerInfoHpAc";
      this.zk = a.insertCell(5);
      this.zk.style.width = "30px";
      this.zk.style.textAlign = "left";
      this.zk.title = "伤害:提高攻击伤害";
      this.zk.innerHTML = "伤害";
      c = a.insertCell(6);
      c.id = this.Kq;
      c.className = "gameTabAdventurerInfoHpAc";
      c.title = "攻击率：增加成功攻击的机会，可以理解为命中属性";
      this.pk = a.insertCell(7);
      this.pk.style.width = "30px";
      this.pk.style.textAlign = "left";
      this.pk.title = "攻击率：增加成功攻击的机会，可以理解为命中属性";
      this.pk.innerHTML = "攻击";
      d = 8;
      for (c = 0; c < this.Wl.length; c++) {
        b = a.insertCell(d++);
        b.rowSpan = 2;
        b = createElement("div", b, null, "gameTabAdventurerInfoEffect");
        b = createElement("img", b, this.Wl[c], "itemImage");
        b.src = "images/Transparent.gif";
        b.style.width = "30px";
        b.style.height = "30px";
        b.style.display = "none";
      }
      a = this.Nq.insertRow(1);
      c = a.insertCell(0);
      c.id = this.By;
      c.style.width = "120px";
      c = a.insertCell(1);
      c.className = "gameTabAdventurerSliderCell";
      c.title = "法力值";
      d = createElement("div", c, null, "gameTabAdventurerSliderDiv");
      createElement("div", d, this.Dy, "gameTabAdventurerSpiritPointsSlider");
      createElement("div", c, this.Cy, "gameTabAdventurerSliderOverlay");
      c = a.insertCell(2);
      c.style.width = "30px";
      c.style.textAlign = "left";
      c.style.paddingLeft = "4px";
      c.title = "法力值";
      c.innerHTML = "SP";
      c = a.insertCell(3);
      c.id = this.Jq;
      c.className = "gameTabAdventurerInfoHpAc";
      c.title = "护甲:降低受到的伤害";
      this.ok = a.insertCell(4);
      this.ok.style.width = "30px";
      this.ok.style.textAlign = "left";
      this.ok.title = "护甲:降低受到的伤害";
      this.ok.innerHTML = "护甲";
      c = a.insertCell(5);
      c.id = this.Mq;
      c.className = "gameTabAdventurerInfoHpAc";
      c.title = "防御率：防止敌人成功攻击，可以理解为闪避属性";
      this.Ak = a.insertCell(6);
      this.Ak.style.width = "30px";
      this.Ak.style.textAlign = "left";
      this.Ak.title = "防御率：防止敌人成功攻击，可以理解为闪避属性";
      this.Ak.innerHTML = "防御";
    }
  };
  AdventurerSummaryView.prototype.update = function () {
    if (!(0 > this.adventurerIndex)) {
      if (this.adventurerIndex >= game.state.adventurers.length) {
        if (this.Oq && this.adventurerIndex < 4 + partyCapacityBonus.currentValue) {
          this.Oq = false;
          this.nn.className = "gameTabBlankAdventurerInfo";
          clearElement(this.nn);
        }
      } else {
        var a = game.state.adventurers[this.adventurerIndex],
          b = a.stats,
          c = b.health,
          d = statValue(b.maxHealth),
          f = b.spirit,
          g = statValue(b.maxSpirit),
          h = statValue(b.damage),
          l = statValue(b.armor),
          n = statValue(b.attackRating),
          p = statValue(b.defenceRating),
          b = b.characterLevel;
        if (this.av !== c || this.kv !== d) {
          setElementHtml(this.zy, formatAmount(c) + "/" + formatAmount(d));
          var s = Math.min(100, floorNumber(100 * c / d));
          getElement(this.Ay).style.width = s + "%";
          this.av = c;
          this.kv = d;
        }
        if (this.Jk !== f || this.mv !== g) {
          setElementHtml(this.Cy, formatAmount(f) + "/" + formatAmount(g));
          c = Math.min(100, floorNumber(100 * f / g));
          getElement(this.Dy).style.width = c + "%";
          this.Jk = f;
          this.mv = g;
        }
        if (this.cachedLevel !== b) {
          this.cachedLevel = b;
          setElementHtml(this.By, "等级" + b + " " + game.state.adventurers[this.adventurerIndex].classDefinition.className);
        }
        if (this.qr !== h) {
          setElementHtml(this.Lq, formatAmount(h));
        }
        if (this.or !== l) {
          setElementHtml(this.Jq, formatAmount(l));
        }
        if (this.pr !== n) {
          setElementHtml(this.Kq, formatAmount(n));
        }
        if (this.rr !== p) {
          setElementHtml(this.Mq, formatAmount(p));
        }
        c = a.effects.activeEffects;
        f = false;
        this.frameAge++;
        if (this.frameAge >= this.qw) {
          this.frameAge = 0;
          f = true;
        }
        for (a = 0; a < this.lk.length; a++) {
          this.lk[a] = null;
        }
        for (a = d = 0; a < c.length; a++) {
          g = c[a].statusEffectTypeId;
          b = this.lk.indexOf(g);
          if (0 > b && d < this.lk.length) {
            this.lk[d] = g;
            d++;
          }
        }
        for (a = 0; a < this.qm.length; a++) {
          if (g = a < this.lk.length ? this.lk[a] : null, c = this.qm[a], g) {
            if (c && c === g) {
              if (f) {
                g = statusEffectDefinitions[c];
                c = g.spritesheetPath;
                d = game.animations.getAnimation(g.animationName);
                this.Dm[a]++;
                if (this.Dm[a] >= d.To()) {
                  this.Dm[a] = 0;
                }
                d = d.frames[this.Dm[a]];
                b = getElement(this.Wl[a]);
                b.style.background = "url('" + c + "') -" + d.frameSourceX + "px -" + d.frameSourceY + "px";
              }
            } else {
              c = g;
              this.qm[a] = c;
              g = statusEffectDefinitions[c];
              c = g.spritesheetPath;
              d = game.animations.getAnimation(g.animationName);
              this.Dm[a] = 0;
              d = d.frames[0];
              b = getElement(this.Wl[a]);
              b.style.background = "url('" + c + "') -" + d.frameSourceX + "px -" + d.frameSourceY + "px";
              b.title = g.tooltipLabel;
              showElementById(this.Wl[a]);
            }
          } else {
            if (c) {
              hideElementById(this.Wl[a]);
              this.qm[a] = null;
            }
          }
        }
        a = getMonsters();
        if (0 === a.length) {
          if (-1 < this.vj) {
            getElement(this.Lq).style.color = "#FFF";
            getElement(this.Jq).style.color = "#FFF";
            getElement(this.Kq).style.color = "#FFF";
            getElement(this.Mq).style.color = "#FFF";
            this.zk.style.color = "#FFF";
            this.ok.style.color = "#FFF";
            this.pk.style.color = "#FFF";
            this.Ak.style.color = "#FFF";
            this.uv = this.sv = this.tv = this.rv = this.vj = -1;
          }
        } else {
          c = a[0].stats;
          a = statValue(c.damage);
          f = statValue(c.armor);
          g = statValue(c.attackRating);
          c = statValue(c.defenceRating);
          this.vj = game.state.encounter.Ar;
          colorComparedStats(this.Lq, h, f, this.qr, this.rv, this.zk);
          colorComparedStats(this.Jq, l, a, this.or, this.tv, this.ok);
          colorComparedStats(this.Kq, n, c, this.pr, this.uv, this.pk);
          colorComparedStats(this.Mq, p, g, this.rr, this.sv, this.Ak);
          this.rv = f;
          this.tv = a;
          this.sv = g;
          this.uv = c;
        }
        this.qr = h;
        this.or = l;
        this.pr = n;
        this.rr = p;
      }
    }
  };
  DungeonNotificationView.prototype = new View();
  DungeonNotificationView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.Su = this.Bk = "";
    var a = getElement(this.elementId);
    this.nl = createElement("div", a, null, "dungeonNotificationDiv");
    hideElement(a);
    (/** @type {any} */ (this)).cachedVisible = false;
  };
  DungeonNotificationView.prototype.isVisible = function () {
    return !game.worldActive;
  };
  DungeonNotificationView.prototype.update = function () {
    var a, b;
    if (game.currentDungeon) {
      a = game.currentDungeon.dungeonName;
      b = game.currentDungeon.currentLevelIndex + 1;
    } else {
      a = game.currentCastle.castleName;
      b = 0;
    }
    if (b !== this.Su || a !== this.Bk) {
      this.Su = b;
      this.Bk = a;
      this.nl.innerHTML = 0 < b ? a + " (等级." + b + ")" : a;
    }
  };
  EncounterNotificationView.prototype = new View();
  EncounterNotificationView.prototype.reset = function () {
    if (!this.nl) {
      this.nl = createElement("div", getElement(this.elementId), null, "encounterNotificationDiv");
    }
  };
  EncounterNotificationView.prototype.isVisible = function () {
    return !game.state.encounter.ym;
  };
  EncounterNotificationView.prototype.update = function () {
    var a = game.state.encounter.Ar,
      b = getMonsters().length;
    if (this.vj !== a || this.xz != b) {
      if (this.vj !== a) {
        this.bA = b;
      }
      this.vj = a;
      this.xz = b;
      var c;
      c = game.state.encounter.fw;
      a = game.state.encounter.du;
      this.nl.innerHTML = a ? "遭遇首领!<br/> " + c : "一场遭遇战!<br/>" + b + "/" + this.bA + " " + c;
      if (this.Bz != a) {
        this.Bz = a;
        this.nl.className = a ? "bossEncounterNotificationDiv" : "encounterNotificationDiv";
      }
    }
  };
  CurrencyView.prototype = new View();
  CurrencyView.prototype.reset = function () {};
  CurrencyView.prototype.update = function () {
    var a = game.state.party.experiencePoints,
      b = game.state.party.gold,
      c = game.state.party.kills;
    if (a !== this.uz) {
      this.uz = a;
      setElementHtml(this.pD, "" + formatAmount(a));
    }
    if (b !== this.vz) {
      this.vz = b;
      setElementHtml(this.tD, "" + formatAmount(b));
    }
    if (c !== this.rm) {
      this.rm = c;
      setElementHtml(this.Hw, "" + formatAmount(c));
    }
  };
  AdventurePointsView.prototype = new View();
  AdventurePointsView.prototype.reset = function () {
    clearElementById(this.elementId);
    mountAdventurePoints(this);
  };
  AdventurePointsView.prototype.update = function () {
    if (!this.Np) {
      mountAdventurePoints(this);
    }
    var a = game.state.adventurePoints.availablePoints;
    if (a !== this.qz) {
      this.qz = a;
      this.Np.innerHTML = formatGroupedAmount(a);
    }
  };
  ScrollButtonView.prototype = new View();
  ScrollButtonView.prototype.reset = function () {};
  ScrollButtonView.prototype.update = function () {
    if (!this.$p) {
      mountScrollButton(this);
    }
    var a = false;
    if (this.scroll != this.tm && (this.tm = this.scroll, a = true, this.scroll)) {
      var b = this.scroll.spriteName;
      this.itemImage.style.background = "url('spritesheet/items.png') -" + b.sourceX + "px -" + b.sourceY + "px";
    }
    b = this.scroll.label;
    if (this.yz !== b) {
      this.yz = b;
      this.mx.innerHTML = b;
    }
    b = this.scroll ? this.scroll.quantity : -1;
    if (infiniteScrollsModifier.currentValue) {
      b = -2;
    }
    var c = 0 < b || infiniteScrollsModifier.currentValue;
    this.aq = !this.scroll.locked && c && !game.worldActive && 0 < getMonsters().length;
    if (a || this.Gv != this.aq) {
      this.Gv = this.aq;
      this.$p.className = this.aq ? "scrollButton" : "scrollButtonDisabled";
    }
    a = this.scroll.locked;
    if (this.rz !== b || this.wz != a) {
      this.rz = b;
      this.wz = a;
      this.Cx.innerHTML = a ? "" : infiniteScrollsModifier.currentValue ? "无限" : "x" + b;
    }
    a: {
      a = this.qp;
      for (b = 0; b < (/** @type {any} */ (a)).length; b++) {
        if (this.Qr.Gw[a[b]]) {
          a = true;
          break a;
        }
      }
      a = false;
    }
    if (a) {
      getScrollButtonClass(this);
    }
  };
  ScrollBarView.prototype = new View();
  ScrollBarView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.Zs.length = 0;
    (/** @type {any} */ (this)).createDomElements();
  };
  ScrollBarView.prototype.update = function () {
    if (!this.fu) {
      (/** @type {any} */ (this)).createDomElements();
    }
    var a,
      b = game.scrolls.at,
      c,
      d;
    for (a = 0; a < this.Zs.length; a++) {
      d = b.length > a ? b[a] : null;
      c = this.Zs[a];
      c.scroll = d;
      c.render();
    }
    scrollButtonsChanged(this.Qr);
  };
  ScrollBarView.prototype.createDomElements = function () {
    this.fu = createElement("table", getElement(this.elementId), null, null);
    var a = this.fu.insertRow(0),
      b,
      c,
      d;
    for (d = 0; 6 > d; d++) {
      c = a.insertCell(d);
      b = "scrollButtonCell" + d;
      createElement("div", c, b, null);
      this.Zs.push(new ScrollButtonView(b, d, this.Qr, this.oA[d]));
    }
  };
  PotionButtonView.prototype = new View();
  PotionButtonView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.Pp = this.Op = this.Tp = this.yj = this.Si = this.progressFillElement = this.km = this.yo = this.sm = this.potion = null;
    this.ak = this.Sp = false;
  };
  PotionButtonView.prototype.update = function () {
    if (!this.Si) {
      mountPotionButton(this);
    }
    if (this.Sp && this.TA < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue) {
      this.Sp = false;
      this.Si.className = "potionButtonDisabled";
    }
    if (this.potion) {
      if (!this.sm) {
        showElement(this.Si);
      }
      var a;
      a = (a = this.potion) ? !a.active && isPotionModifierActive(a) ? "potionButtonDisabled" : a.active ? "potionButtonActive" : "potionButton" : "potionButtonDisabled";
      if (this.yo != a) {
        this.yo = a;
        this.Si.className = a;
      }
      if (this.potion != this.sm) {
        this.Tp.innerHTML = this.potion.displayName;
        this.Op.innerHTML = this.potion.effectLabel;
        a = this.potion.potionSprite;
        this.Pp.style.background = "url('spritesheet/items.png') -" + a.sourceX + "px -" + a.sourceY + "px";
      }
      this.sm = this.potion;
      if (this.potion.active) {
        if (!this.ak) {
          showElement(this.progressFillElement);
          this.ak = true;
        }
        a = Math.min(1, (game.state.turnNumber - this.potion.activationTurn) / (800 + potionDurationBonus.currentValue));
        a *= this.gu;
        if (this.Jh !== a) {
          this.Jh = a;
          this.progressFillElement.style.width = a + "px";
        }
      } else {
        if (this.ak) {
          hideElement(this.progressFillElement);
          this.ak = false;
        }
      }
      if (!this.Bo) {
        this.Bo = true;
        this.yj.style.display = "block";
      }
    } else {
      if (this.sm) {
        this.sm = null;
        this.Tp.innerHTML = "";
        this.Op.innerHTML = "";
        this.Pp.style.background = "";
        if (this.Bo) {
          this.Bo = false;
          this.yj.style.display = "none";
        }
        if (this.ak) {
          hideElement(this.progressFillElement);
          this.ak = false;
        }
        this.yo = "potionButtonDisabled";
        this.Si.className = this.yo;
      }
    }
  };
  PotionButtonView.prototype.aw = function () {
    if (this.potion) {
      if (!(this.potion.active || !this.potion.active && isPotionModifierActive(this.potion))) {
        this.potion.aw();
      }
    }
  };
  PotionButtonView.prototype.bw = function () {
    if (this.potion) {
      game.potions.bw(this.potion);
      this.potion = null;
    }
  };
  PotionBarView.prototype = new View();
  PotionBarView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.Ms.length = 0;
    this.su = false;
    (/** @type {any} */ (this)).createDomElements();
  };
  PotionBarView.prototype.update = function () {
    if (!this.su) {
      (/** @type {any} */ (this)).createDomElements();
    }
    var a,
      b = game.potions.potionList,
      c,
      d;
    for (a = 0; a < this.Ms.length; a++) {
      d = a < b.length ? b[a] : null;
      c = this.Ms[a];
      c.potion = d;
      c.render();
    }
  };
  PotionBarView.prototype.createDomElements = function () {
    var a = getElement(this.elementId);
    this.su = true;
    var b,
      c,
      d = 0;
    for (b = 0; 4 > b; b++) {
      for (c = 0; 2 > c; c++) {
        var f = c,
          g = b,
          h = d++,
          l = "potionButton_Row" + g + "_Col" + f,
          n = createElement("div", a, null, "potionCellDiv");
        n.id = l;
        n.style.left = 196 * f + "px";
        n.style.top = 47 * g + "px";
        this.Ms.push(new PotionButtonView(l, h));
      }
    }
  };
  ExpeditionView.prototype = new TabView();
  ExpeditionView.prototype.onGameWon = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  ExpeditionView.prototype.onOfflineFinish = function () {
    this.tabState.enabled = true;
    this.tabState.selected = true;
  };
  ExpeditionView.prototype.onOfflineStart = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  ExpeditionView.prototype.reset = function () {
    this.tabState.enabled = true;
    this.tabState.selected = true;
    resetChildViews(this);
  };
}
