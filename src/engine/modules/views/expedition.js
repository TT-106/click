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
  this.summaryTable = null;
  this.effectIconIds = ["adventurerEffectIconA" + a, "adventurerEffectIconB" + a, "adventurerEffectIconC" + a, "adventurerEffectIconD" + a, "adventurerEffectIconE" + a, "adventurerEffectIconF" + a];
  this.healthSliderId = "adventurerHealthSlider" + a;
  this.healthTextId = "adventurerHealth" + a;
  this.damageTextId = "adventurerDamage" + a;
  this.armorTextId = "adventurerArmor" + a;
  this.attackRatingTextId = "adventurerAR" + a;
  this.defenceRatingTextId = "adventurerDR" + a;
  this.levelClassTextId = "adventurerLevelClass" + a;
  this.spiritSliderId = "adventurerSpiritPowerSlider" + a;
  this.spiritTextId = "adventurerSpiritPower" + a;
  this.vacantOverlay = this.defenceHeaderCell = this.attackRatingHeaderCell = this.potionButton = this.damageHeaderCell = null;
  this.cachedMonsterDefenceRating = this.cachedMonsterAttackRating = this.cachedMonsterDamage = this.cachedMonsterArmor = this.cachedLevel = this.cachedDefenceRating = this.cachedAttackRating = this.cachedArmor = this.cachedDamage = this.cachedMaxSpirit = this.cachedSpirit = this.cachedMaxHealth = this.cachedHealth = -1;
  this.shownEffectTypeIds = [null, null, null, null, null, null];
  this.potionSlots = [null, null, null, null, null, null];
  this.effectFrameIndices = [0, 0, 0, 0, 0, 0];
  this.effectFrameInterval = 8;
  this.frameAge = 0;
  this.comparisonEncounterIndex = -1;
  this.isLocked = false;
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
  this.notificationElement = null;
  this.cachedDungeonLevel = this.cachedDungeonName = "";
}
export function EncounterNotificationView() {
  this.elementId = "encounterNotificationPanel";
  this.visible = false;
  this.notificationElement = null;
  this.encounterTotalMonsters = this.cachedMonsterCount = this.cachedEncounterIndex = -1;
  this.isBossEncounter = false;
}
export function CurrencyView() {
  this.elementId = "currencyPanel";
  this.visible = true;
  this.experienceCellId = "expCell";
  this.goldCellId = "goldAmountCell";
  this.killsCellId = "killsCountCell";
  this.cachedKills = this.cachedGold = this.cachedExperience = -1;
}
export function AdventurePointsView(a) {
  this.elementId = a;
  this.visible = true;
  this.pointsCell = null;
  this.cachedPoints = -1;
}
export function mountAdventurePoints(a) {
  var b = createElement("table", getElement(a.elementId), null, null);
  b.style.width = "100%";
  b = b.insertRow(0);
  a.pointsCell = b.insertCell(0);
  b = b.insertCell(1);
  a.pointsCell.style.textAlign = "right";
  a.pointsCell.style.paddingTop = "5px";
  b.style.width = "30px";
  b.style.paddingTop = "5px";
  b.style.textAlign = "left";
  b.title = "冒险点数";
  b.innerHTML = "AP";
}
export function ScrollButtonCollection(a) {
  this.keyStates = {};
  this.buttons = [];
  var b, c, d;
  for (b = 0; b < (/** @type {any} */ (a)).length; b++) {
    for (d = a[b], c = 0; c < d.length; c++) {
      this.buttons.push(d[c]);
    }
  }
  scrollButtonsChanged(this);
  clearScrollButtons(this);
}
export function clearScrollButtons(a) {
  document.onkeyup = function (b) {
    a.keyStates[b.keyCode] = true;
  };
}
export function scrollButtonsChanged(a) {
  var b;
  for (b = 0; b < a.buttons.length; b++) {
    a.keyStates[a.buttons[b]] = false;
  }
}
export function ScrollButtonView(a, b, c, d) {
  this.elementId = a;
  this.visible = true;
  this.itemImage = this.quantityCell = this.nameCell = this.buttonElement = this.cachedScroll = this.scroll = null;
  this.isEnabled = false;
  this.wasEnabled = !this.isEnabled;
  this.cachedQuantity = -1;
  this.cachedLabel = null;
  this.cachedLocked = true;
  this.casterIndex = b;
  this.collection = c;
  this.keyBindings = d;
}
export function getScrollButtonClass(a) {
  if (a.scroll && (0 < a.scroll.quantity || infiniteScrollsModifier.currentValue)) {
    positionScrollCaster(a.casterIndex);
    castScroll(a.scroll, infiniteScrollsModifier.currentValue);
  }
}
export function mountScrollButton(a) {
  a.buttonElement = createElement("div", getElement(a.elementId), null, "scrollButtonDisabled");
  a.wasEnabled = false;
  var b = createElement("table", a.buttonElement, null, null),
    c = b.insertRow(0),
    b = b.insertRow(1),
    d = c.insertCell(0);
  d.rowSpan = 2;
  a.nameCell = c.insertCell(1);
  a.quantityCell = b.insertCell(0);
  a.nameCell.style.textAlign = "left";
  a.quantityCell.style.textAlign = "left";
  a.itemImage = createElement("img", d, null, "itemImage");
  a.itemImage.style.height = "30px";
  a.itemImage.src = "images/Transparent.gif";
  a.buttonElement.onmouseup = function () {
    getScrollButtonClass(a);
    return false;
  };
}
export function ScrollBarView() {
  this.elementId = "scrollButtonContainer";
  this.visible = true;
  this.tableElement = null;
  this.buttonViews = [];
  this.keyBindings = [[49, 35, 97], [50, 40, 98], [51, 34, 99], [52, 37, 100], [53, 12, 101], [54, 39, 102]];
  this.collection = new ScrollButtonCollection(this.keyBindings);
}
export function PotionButtonView(a, b) {
  this.elementId = a;
  this.visible = true;
  this.potion = null;
  this.slotIndex = b;
  this.cachedButtonClass = this.cachedPotion = null;
  this.progressBarWidth = 192;
  this.potionImage = this.effectLabelCell = this.nameCell = this.dropPotionButton = this.tableElement = this.progressFillElement = this.contentContainer = null;
  this.dropButtonVisible = false;
  this.cachedFillWidth = -1;
  this.isLocked = this.dropButtonShown = false;
}
export function mountPotionButton(a) {
  a.contentContainer = createElement("div", getElement(a.elementId), null, "potionContentContainer");
  a.isLocked = a.slotIndex >= BASE_POTION_CAPACITY + potionCapacityBonus.currentValue;
  a.tableElement = createElement("table", a.contentContainer, null, a.isLocked ? "potionButtonLocked" : "potionButtonDisabled");
  var b = a.tableElement.insertRow(0),
    c = a.tableElement.insertRow(1),
    d = b.insertCell(0);
  d.rowSpan = 2;
  a.nameCell = b.insertCell(1);
  a.effectLabelCell = c.insertCell(0);
  a.nameCell.style.textAlign = "left";
  a.effectLabelCell.style.textAlign = "left";
  a.potionImage = createElement("img", d, null, "itemImage");
  a.potionImage.src = "images/Transparent.gif";
  a.contentContainer.onmouseup = function () {
    a.aw();
    return false;
  };
  a.progressFillElement = createElement("div", a.contentContainer, null, "potionButtonProgressSlider");
  a.dropButtonVisible = false;
  a.dropPotionButton = createElement("div", a.contentContainer, null, "dropPotionButton");
  a.dropPotionButton.title = "丢弃药剂";
  a.dropPotionButton.innerHTML = "X";
  a.dropPotionButton.style.display = "none";
  a.dropButtonShown = false;
  a.dropPotionButton.onmouseup = function () {
    a.bw();
    return false;
  };
}
export function PotionBarView() {
  this.elementId = "potionButtonContainer";
  this.visible = true;
  this.mounted = false;
  this.buttonViews = [];
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
    this.summaryTable = null;
    this.isLocked = false;
    this.vacantOverlay = null;
    if (0 > this.adventurerIndex || this.adventurerIndex >= game.state.adventurers.length) {
      if (this.adventurerIndex >= 4 + partyCapacityBonus.currentValue) {
        this.vacantOverlay = createElement("div", getElement(this.elementId), null, "gameTabLockedAdventurerInfo");
        createElement("span", this.vacantOverlay, null, "lockedSpanText").innerHTML = "未解锁";
        this.isLocked = true;
      } else {
        this.vacantOverlay = createElement("div", getElement(this.elementId), null, "gameTabBlankAdventurerInfo");
      }
    } else {
      this.comparisonEncounterIndex = this.cachedDefenceRating = this.cachedAttackRating = this.cachedArmor = this.cachedDamage = this.cachedMaxSpirit = this.cachedSpirit = this.cachedMaxHealth = this.cachedHealth = this.cachedLevel = -1;
      var a;
      for (a = 0; a < this.shownEffectTypeIds.length; a++) {
        this.shownEffectTypeIds[a] = null;
        this.potionSlots[a] = null;
        this.effectFrameIndices[a] = 0;
      }
      this.summaryTable = createElement("table", getElement(this.elementId), null, "adventurerInfoTable");
      a = this.summaryTable.insertRow(0);
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
      createElement("div", d, this.healthSliderId, "gameTabAdventurerHealthSlider");
      createElement("div", c, this.healthTextId, "gameTabAdventurerSliderOverlay");
      c = a.insertCell(3);
      c.style.width = "30px";
      c.style.textAlign = "left";
      c.style.paddingLeft = "4px";
      c.title = "生命值";
      c.innerHTML = "HP";
      c = a.insertCell(4);
      c.id = this.damageTextId;
      c.title = "伤害:提高攻击伤害";
      c.className = "gameTabAdventurerInfoHpAc";
      this.damageHeaderCell = a.insertCell(5);
      this.damageHeaderCell.style.width = "30px";
      this.damageHeaderCell.style.textAlign = "left";
      this.damageHeaderCell.title = "伤害:提高攻击伤害";
      this.damageHeaderCell.innerHTML = "伤害";
      c = a.insertCell(6);
      c.id = this.attackRatingTextId;
      c.className = "gameTabAdventurerInfoHpAc";
      c.title = "攻击率：增加成功攻击的机会，可以理解为命中属性";
      this.attackRatingHeaderCell = a.insertCell(7);
      this.attackRatingHeaderCell.style.width = "30px";
      this.attackRatingHeaderCell.style.textAlign = "left";
      this.attackRatingHeaderCell.title = "攻击率：增加成功攻击的机会，可以理解为命中属性";
      this.attackRatingHeaderCell.innerHTML = "攻击";
      d = 8;
      for (c = 0; c < this.effectIconIds.length; c++) {
        b = a.insertCell(d++);
        b.rowSpan = 2;
        b = createElement("div", b, null, "gameTabAdventurerInfoEffect");
        b = createElement("img", b, this.effectIconIds[c], "itemImage");
        b.src = "images/Transparent.gif";
        b.style.width = "30px";
        b.style.height = "30px";
        b.style.display = "none";
      }
      a = this.summaryTable.insertRow(1);
      c = a.insertCell(0);
      c.id = this.levelClassTextId;
      c.style.width = "120px";
      c = a.insertCell(1);
      c.className = "gameTabAdventurerSliderCell";
      c.title = "法力值";
      d = createElement("div", c, null, "gameTabAdventurerSliderDiv");
      createElement("div", d, this.spiritSliderId, "gameTabAdventurerSpiritPointsSlider");
      createElement("div", c, this.spiritTextId, "gameTabAdventurerSliderOverlay");
      c = a.insertCell(2);
      c.style.width = "30px";
      c.style.textAlign = "left";
      c.style.paddingLeft = "4px";
      c.title = "法力值";
      c.innerHTML = "SP";
      c = a.insertCell(3);
      c.id = this.armorTextId;
      c.className = "gameTabAdventurerInfoHpAc";
      c.title = "护甲:降低受到的伤害";
      this.potionButton = a.insertCell(4);
      this.potionButton.style.width = "30px";
      this.potionButton.style.textAlign = "left";
      this.potionButton.title = "护甲:降低受到的伤害";
      this.potionButton.innerHTML = "护甲";
      c = a.insertCell(5);
      c.id = this.defenceRatingTextId;
      c.className = "gameTabAdventurerInfoHpAc";
      c.title = "防御率：防止敌人成功攻击，可以理解为闪避属性";
      this.defenceHeaderCell = a.insertCell(6);
      this.defenceHeaderCell.style.width = "30px";
      this.defenceHeaderCell.style.textAlign = "left";
      this.defenceHeaderCell.title = "防御率：防止敌人成功攻击，可以理解为闪避属性";
      this.defenceHeaderCell.innerHTML = "防御";
    }
  };
  AdventurerSummaryView.prototype.update = function () {
    if (!(0 > this.adventurerIndex)) {
      if (this.adventurerIndex >= game.state.adventurers.length) {
        if (this.isLocked && this.adventurerIndex < 4 + partyCapacityBonus.currentValue) {
          this.isLocked = false;
          this.vacantOverlay.className = "gameTabBlankAdventurerInfo";
          clearElement(this.vacantOverlay);
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
        if (this.cachedHealth !== c || this.cachedMaxHealth !== d) {
          setElementHtml(this.healthTextId, formatAmount(c) + "/" + formatAmount(d));
          var s = Math.min(100, floorNumber(100 * c / d));
          getElement(this.healthSliderId).style.width = s + "%";
          this.cachedHealth = c;
          this.cachedMaxHealth = d;
        }
        if (this.cachedSpirit !== f || this.cachedMaxSpirit !== g) {
          setElementHtml(this.spiritTextId, formatAmount(f) + "/" + formatAmount(g));
          c = Math.min(100, floorNumber(100 * f / g));
          getElement(this.spiritSliderId).style.width = c + "%";
          this.cachedSpirit = f;
          this.cachedMaxSpirit = g;
        }
        if (this.cachedLevel !== b) {
          this.cachedLevel = b;
          setElementHtml(this.levelClassTextId, "等级" + b + " " + game.state.adventurers[this.adventurerIndex].classDefinition.className);
        }
        if (this.cachedDamage !== h) {
          setElementHtml(this.damageTextId, formatAmount(h));
        }
        if (this.cachedArmor !== l) {
          setElementHtml(this.armorTextId, formatAmount(l));
        }
        if (this.cachedAttackRating !== n) {
          setElementHtml(this.attackRatingTextId, formatAmount(n));
        }
        if (this.cachedDefenceRating !== p) {
          setElementHtml(this.defenceRatingTextId, formatAmount(p));
        }
        c = a.effects.activeEffects;
        f = false;
        this.frameAge++;
        if (this.frameAge >= this.effectFrameInterval) {
          this.frameAge = 0;
          f = true;
        }
        for (a = 0; a < this.potionSlots.length; a++) {
          this.potionSlots[a] = null;
        }
        for (a = d = 0; a < c.length; a++) {
          g = c[a].statusEffectTypeId;
          b = this.potionSlots.indexOf(g);
          if (0 > b && d < this.potionSlots.length) {
            this.potionSlots[d] = g;
            d++;
          }
        }
        for (a = 0; a < this.shownEffectTypeIds.length; a++) {
          if (g = a < this.potionSlots.length ? this.potionSlots[a] : null, c = this.shownEffectTypeIds[a], g) {
            if (c && c === g) {
              if (f) {
                g = statusEffectDefinitions[c];
                c = g.spritesheetPath;
                d = game.animations.getAnimation(g.animationName);
                this.effectFrameIndices[a]++;
                if (this.effectFrameIndices[a] >= d.To()) {
                  this.effectFrameIndices[a] = 0;
                }
                d = d.frames[this.effectFrameIndices[a]];
                b = getElement(this.effectIconIds[a]);
                b.style.background = "url('" + c + "') -" + d.frameSourceX + "px -" + d.frameSourceY + "px";
              }
            } else {
              c = g;
              this.shownEffectTypeIds[a] = c;
              g = statusEffectDefinitions[c];
              c = g.spritesheetPath;
              d = game.animations.getAnimation(g.animationName);
              this.effectFrameIndices[a] = 0;
              d = d.frames[0];
              b = getElement(this.effectIconIds[a]);
              b.style.background = "url('" + c + "') -" + d.frameSourceX + "px -" + d.frameSourceY + "px";
              b.title = g.tooltipLabel;
              showElementById(this.effectIconIds[a]);
            }
          } else {
            if (c) {
              hideElementById(this.effectIconIds[a]);
              this.shownEffectTypeIds[a] = null;
            }
          }
        }
        a = getMonsters();
        if (0 === a.length) {
          if (-1 < this.comparisonEncounterIndex) {
            getElement(this.damageTextId).style.color = "#FFF";
            getElement(this.armorTextId).style.color = "#FFF";
            getElement(this.attackRatingTextId).style.color = "#FFF";
            getElement(this.defenceRatingTextId).style.color = "#FFF";
            this.damageHeaderCell.style.color = "#FFF";
            this.potionButton.style.color = "#FFF";
            this.attackRatingHeaderCell.style.color = "#FFF";
            this.defenceHeaderCell.style.color = "#FFF";
            this.cachedMonsterDefenceRating = this.cachedMonsterAttackRating = this.cachedMonsterArmor = this.cachedMonsterDamage = this.comparisonEncounterIndex = -1;
          }
        } else {
          c = a[0].stats;
          a = statValue(c.damage);
          f = statValue(c.armor);
          g = statValue(c.attackRating);
          c = statValue(c.defenceRating);
          this.comparisonEncounterIndex = game.state.encounter.encounterCount;
          colorComparedStats(this.damageTextId, h, f, this.cachedDamage, this.cachedMonsterDamage, this.damageHeaderCell);
          colorComparedStats(this.armorTextId, l, a, this.cachedArmor, this.cachedMonsterArmor, this.potionButton);
          colorComparedStats(this.attackRatingTextId, n, c, this.cachedAttackRating, this.cachedMonsterDefenceRating, this.attackRatingHeaderCell);
          colorComparedStats(this.defenceRatingTextId, p, g, this.cachedDefenceRating, this.cachedMonsterAttackRating, this.defenceHeaderCell);
          this.cachedMonsterDamage = f;
          this.cachedMonsterArmor = a;
          this.cachedMonsterAttackRating = g;
          this.cachedMonsterDefenceRating = c;
        }
        this.cachedDamage = h;
        this.cachedArmor = l;
        this.cachedAttackRating = n;
        this.cachedDefenceRating = p;
      }
    }
  };
  DungeonNotificationView.prototype = new View();
  DungeonNotificationView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.cachedDungeonLevel = this.cachedDungeonName = "";
    var a = getElement(this.elementId);
    this.notificationElement = createElement("div", a, null, "dungeonNotificationDiv");
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
    if (b !== this.cachedDungeonLevel || a !== this.cachedDungeonName) {
      this.cachedDungeonLevel = b;
      this.cachedDungeonName = a;
      this.notificationElement.innerHTML = 0 < b ? a + " (等级." + b + ")" : a;
    }
  };
  EncounterNotificationView.prototype = new View();
  EncounterNotificationView.prototype.reset = function () {
    if (!this.notificationElement) {
      this.notificationElement = createElement("div", getElement(this.elementId), null, "encounterNotificationDiv");
    }
  };
  EncounterNotificationView.prototype.isVisible = function () {
    return !game.state.encounter.noMonstersLeft;
  };
  EncounterNotificationView.prototype.update = function () {
    var a = game.state.encounter.encounterCount,
      b = getMonsters().length;
    if (this.cachedEncounterIndex !== a || this.cachedMonsterCount != b) {
      if (this.cachedEncounterIndex !== a) {
        this.encounterTotalMonsters = b;
      }
      this.cachedEncounterIndex = a;
      this.cachedMonsterCount = b;
      var c;
      c = game.state.encounter.encounterName;
      a = game.state.encounter.isBossEncounter;
      this.notificationElement.innerHTML = a ? "遭遇首领!<br/> " + c : "一场遭遇战!<br/>" + b + "/" + this.encounterTotalMonsters + " " + c;
      if (this.isBossEncounter != a) {
        this.isBossEncounter = a;
        this.notificationElement.className = a ? "bossEncounterNotificationDiv" : "encounterNotificationDiv";
      }
    }
  };
  CurrencyView.prototype = new View();
  CurrencyView.prototype.reset = function () {};
  CurrencyView.prototype.update = function () {
    var a = game.state.party.experiencePoints,
      b = game.state.party.gold,
      c = game.state.party.kills;
    if (a !== this.cachedExperience) {
      this.cachedExperience = a;
      setElementHtml(this.experienceCellId, "" + formatAmount(a));
    }
    if (b !== this.cachedGold) {
      this.cachedGold = b;
      setElementHtml(this.goldCellId, "" + formatAmount(b));
    }
    if (c !== this.cachedKills) {
      this.cachedKills = c;
      setElementHtml(this.killsCellId, "" + formatAmount(c));
    }
  };
  AdventurePointsView.prototype = new View();
  AdventurePointsView.prototype.reset = function () {
    clearElementById(this.elementId);
    mountAdventurePoints(this);
  };
  AdventurePointsView.prototype.update = function () {
    if (!this.pointsCell) {
      mountAdventurePoints(this);
    }
    var a = game.state.adventurePoints.availablePoints;
    if (a !== this.cachedPoints) {
      this.cachedPoints = a;
      this.pointsCell.innerHTML = formatGroupedAmount(a);
    }
  };
  ScrollButtonView.prototype = new View();
  ScrollButtonView.prototype.reset = function () {};
  ScrollButtonView.prototype.update = function () {
    if (!this.buttonElement) {
      mountScrollButton(this);
    }
    var a = false;
    if (this.scroll != this.cachedScroll && (this.cachedScroll = this.scroll, a = true, this.scroll)) {
      var b = this.scroll.spriteName;
      this.itemImage.style.background = "url('spritesheet/items.png') -" + b.sourceX + "px -" + b.sourceY + "px";
    }
    b = this.scroll.label;
    if (this.cachedLabel !== b) {
      this.cachedLabel = b;
      this.nameCell.innerHTML = b;
    }
    b = this.scroll ? this.scroll.quantity : -1;
    if (infiniteScrollsModifier.currentValue) {
      b = -2;
    }
    var c = 0 < b || infiniteScrollsModifier.currentValue;
    this.isEnabled = !this.scroll.locked && c && !game.worldActive && 0 < getMonsters().length;
    if (a || this.wasEnabled != this.isEnabled) {
      this.wasEnabled = this.isEnabled;
      this.buttonElement.className = this.isEnabled ? "scrollButton" : "scrollButtonDisabled";
    }
    a = this.scroll.locked;
    if (this.cachedQuantity !== b || this.cachedLocked != a) {
      this.cachedQuantity = b;
      this.cachedLocked = a;
      this.quantityCell.innerHTML = a ? "" : infiniteScrollsModifier.currentValue ? "无限" : "x" + b;
    }
    a: {
      a = this.keyBindings;
      for (b = 0; b < (/** @type {any} */ (a)).length; b++) {
        if (this.collection.keyStates[a[b]]) {
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
    this.buttonViews.length = 0;
    (/** @type {any} */ (this)).createDomElements();
  };
  ScrollBarView.prototype.update = function () {
    if (!this.tableElement) {
      (/** @type {any} */ (this)).createDomElements();
    }
    var a,
      b = game.scrolls.scrollList,
      c,
      d;
    for (a = 0; a < this.buttonViews.length; a++) {
      d = b.length > a ? b[a] : null;
      c = this.buttonViews[a];
      c.scroll = d;
      c.render();
    }
    scrollButtonsChanged(this.collection);
  };
  ScrollBarView.prototype.createDomElements = function () {
    this.tableElement = createElement("table", getElement(this.elementId), null, null);
    var a = this.tableElement.insertRow(0),
      b,
      c,
      d;
    for (d = 0; 6 > d; d++) {
      c = a.insertCell(d);
      b = "scrollButtonCell" + d;
      createElement("div", c, b, null);
      this.buttonViews.push(new ScrollButtonView(b, d, this.collection, this.keyBindings[d]));
    }
  };
  PotionButtonView.prototype = new View();
  PotionButtonView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.potionImage = this.effectLabelCell = this.nameCell = this.dropPotionButton = this.tableElement = this.progressFillElement = this.contentContainer = this.cachedButtonClass = this.cachedPotion = this.potion = null;
    this.dropButtonVisible = this.isLocked = false;
  };
  PotionButtonView.prototype.update = function () {
    if (!this.tableElement) {
      mountPotionButton(this);
    }
    if (this.isLocked && this.slotIndex < BASE_POTION_CAPACITY + potionCapacityBonus.currentValue) {
      this.isLocked = false;
      this.tableElement.className = "potionButtonDisabled";
    }
    if (this.potion) {
      if (!this.cachedPotion) {
        showElement(this.tableElement);
      }
      var a;
      a = (a = this.potion) ? !a.active && isPotionModifierActive(a) ? "potionButtonDisabled" : a.active ? "potionButtonActive" : "potionButton" : "potionButtonDisabled";
      if (this.cachedButtonClass != a) {
        this.cachedButtonClass = a;
        this.tableElement.className = a;
      }
      if (this.potion != this.cachedPotion) {
        this.nameCell.innerHTML = this.potion.displayName;
        this.effectLabelCell.innerHTML = this.potion.effectLabel;
        a = this.potion.potionSprite;
        this.potionImage.style.background = "url('spritesheet/items.png') -" + a.sourceX + "px -" + a.sourceY + "px";
      }
      this.cachedPotion = this.potion;
      if (this.potion.active) {
        if (!this.dropButtonVisible) {
          showElement(this.progressFillElement);
          this.dropButtonVisible = true;
        }
        a = Math.min(1, (game.state.turnNumber - this.potion.activationTurn) / (800 + potionDurationBonus.currentValue));
        a *= this.progressBarWidth;
        if (this.cachedFillWidth !== a) {
          this.cachedFillWidth = a;
          this.progressFillElement.style.width = a + "px";
        }
      } else {
        if (this.dropButtonVisible) {
          hideElement(this.progressFillElement);
          this.dropButtonVisible = false;
        }
      }
      if (!this.dropButtonShown) {
        this.dropButtonShown = true;
        this.dropPotionButton.style.display = "block";
      }
    } else {
      if (this.cachedPotion) {
        this.cachedPotion = null;
        this.nameCell.innerHTML = "";
        this.effectLabelCell.innerHTML = "";
        this.potionImage.style.background = "";
        if (this.dropButtonShown) {
          this.dropButtonShown = false;
          this.dropPotionButton.style.display = "none";
        }
        if (this.dropButtonVisible) {
          hideElement(this.progressFillElement);
          this.dropButtonVisible = false;
        }
        this.cachedButtonClass = "potionButtonDisabled";
        this.tableElement.className = this.cachedButtonClass;
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
    this.buttonViews.length = 0;
    this.mounted = false;
    (/** @type {any} */ (this)).createDomElements();
  };
  PotionBarView.prototype.update = function () {
    if (!this.mounted) {
      (/** @type {any} */ (this)).createDomElements();
    }
    var a,
      b = game.potions.potionList,
      c,
      d;
    for (a = 0; a < this.buttonViews.length; a++) {
      d = a < b.length ? b[a] : null;
      c = this.buttonViews[a];
      c.potion = d;
      c.render();
    }
  };
  PotionBarView.prototype.createDomElements = function () {
    var a = getElement(this.elementId);
    this.mounted = true;
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
        this.buttonViews.push(new PotionButtonView(l, h));
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
