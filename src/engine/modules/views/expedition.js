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
export function AdventurerSummaryView(adventurerIndex) {
  this.elementId = "gameTabAdventurerInfo" + adventurerIndex;
  this.visible = true;
  this.adventurerIndex = adventurerIndex;
  this.summaryTable = null;
  this.effectIconIds = ["adventurerEffectIconA" + adventurerIndex, "adventurerEffectIconB" + adventurerIndex, "adventurerEffectIconC" + adventurerIndex, "adventurerEffectIconD" + adventurerIndex, "adventurerEffectIconE" + adventurerIndex, "adventurerEffectIconF" + adventurerIndex];
  this.healthSliderId = "adventurerHealthSlider" + adventurerIndex;
  this.healthTextId = "adventurerHealth" + adventurerIndex;
  this.damageTextId = "adventurerDamage" + adventurerIndex;
  this.armorTextId = "adventurerArmor" + adventurerIndex;
  this.attackRatingTextId = "adventurerAR" + adventurerIndex;
  this.defenceRatingTextId = "adventurerDR" + adventurerIndex;
  this.levelClassTextId = "adventurerLevelClass" + adventurerIndex;
  this.spiritSliderId = "adventurerSpiritPowerSlider" + adventurerIndex;
  this.spiritTextId = "adventurerSpiritPower" + adventurerIndex;
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
export function colorComparedStats(statTextId, adventurerValue, monsterValue, cachedAdventurerValue, cachedMonsterValue, headerCell) {
  if (adventurerValue != cachedAdventurerValue || monsterValue != cachedMonsterValue) {
    if (adventurerValue < monsterValue) {
      getElement(statTextId).style.color = "#F00";
      headerCell.style.color = "#F00";
    } else {
      if (adventurerValue > monsterValue) {
        getElement(statTextId).style.color = "#0A0";
        headerCell.style.color = "#0A0";
      } else {
        getElement(statTextId).style.color = "#FFF";
        headerCell.style.color = "#FFF";
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
export function AdventurePointsView(elementId) {
  this.elementId = elementId;
  this.visible = true;
  this.pointsCell = null;
  this.cachedPoints = -1;
}
export function mountAdventurePoints(view) {
  var pointsTable = createElement("table", getElement(view.elementId), null, null);
  pointsTable.style.width = "100%";
  var pointsRow = pointsTable.insertRow(0);
  view.pointsCell = pointsRow.insertCell(0);
  var apLabelCell = pointsRow.insertCell(1);
  view.pointsCell.style.textAlign = "right";
  view.pointsCell.style.paddingTop = "5px";
  apLabelCell.style.width = "30px";
  apLabelCell.style.paddingTop = "5px";
  apLabelCell.style.textAlign = "left";
  apLabelCell.title = "冒险点数";
  apLabelCell.innerHTML = "AP";
}
export function ScrollButtonCollection(keyBindings) {
  this.keyStates = {};
  this.buttons = [];
  var buttonIndex, keyIndex, buttonKeyCodes;
  for (buttonIndex = 0; buttonIndex < (/** @type {any} */ (keyBindings)).length; buttonIndex++) {
    for (buttonKeyCodes = keyBindings[buttonIndex], keyIndex = 0; keyIndex < buttonKeyCodes.length; keyIndex++) {
      this.buttons.push(buttonKeyCodes[keyIndex]);
    }
  }
  scrollButtonsChanged(this);
  clearScrollButtons(this);
}
export function clearScrollButtons(collection) {
  document.onkeyup = function (event) {
    collection.keyStates[event.keyCode] = true;
  };
}
export function scrollButtonsChanged(collection) {
  var buttonIndex;
  for (buttonIndex = 0; buttonIndex < collection.buttons.length; buttonIndex++) {
    collection.keyStates[collection.buttons[buttonIndex]] = false;
  }
}
export function ScrollButtonView(elementId, casterIndex, collection, keyBindings) {
  this.elementId = elementId;
  this.visible = true;
  this.itemImage = this.quantityCell = this.nameCell = this.buttonElement = this.cachedScroll = this.scroll = null;
  this.isEnabled = false;
  this.wasEnabled = !this.isEnabled;
  this.cachedQuantity = -1;
  this.cachedLabel = null;
  this.cachedLocked = true;
  this.casterIndex = casterIndex;
  this.collection = collection;
  this.keyBindings = keyBindings;
}
export function getScrollButtonClass(view) {
  if (view.scroll && (0 < view.scroll.quantity || infiniteScrollsModifier.currentValue)) {
    positionScrollCaster(view.casterIndex);
    castScroll(view.scroll, infiniteScrollsModifier.currentValue);
  }
}
export function mountScrollButton(view) {
  view.buttonElement = createElement("div", getElement(view.elementId), null, "scrollButtonDisabled");
  view.wasEnabled = false;
  var buttonTable = createElement("table", view.buttonElement, null, null),
    nameRow = buttonTable.insertRow(0),
    quantityRow = buttonTable.insertRow(1),
    iconCell = nameRow.insertCell(0);
  iconCell.rowSpan = 2;
  view.nameCell = nameRow.insertCell(1);
  view.quantityCell = quantityRow.insertCell(0);
  view.nameCell.style.textAlign = "left";
  view.quantityCell.style.textAlign = "left";
  view.itemImage = createElement("img", iconCell, null, "itemImage");
  view.itemImage.style.height = "30px";
  view.itemImage.src = "images/Transparent.gif";
  view.buttonElement.onmouseup = function () {
    getScrollButtonClass(view);
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
export function PotionButtonView(elementId, slotIndex) {
  this.elementId = elementId;
  this.visible = true;
  this.potion = null;
  this.slotIndex = slotIndex;
  this.cachedButtonClass = this.cachedPotion = null;
  this.progressBarWidth = 192;
  this.potionImage = this.effectLabelCell = this.nameCell = this.dropPotionButton = this.tableElement = this.progressFillElement = this.contentContainer = null;
  this.dropButtonVisible = false;
  this.cachedFillWidth = -1;
  this.isLocked = this.dropButtonShown = false;
}
export function mountPotionButton(view) {
  view.contentContainer = createElement("div", getElement(view.elementId), null, "potionContentContainer");
  view.isLocked = view.slotIndex >= BASE_POTION_CAPACITY + potionCapacityBonus.currentValue;
  view.tableElement = createElement("table", view.contentContainer, null, view.isLocked ? "potionButtonLocked" : "potionButtonDisabled");
  var nameRow = view.tableElement.insertRow(0),
    effectLabelRow = view.tableElement.insertRow(1),
    iconCell = nameRow.insertCell(0);
  iconCell.rowSpan = 2;
  view.nameCell = nameRow.insertCell(1);
  view.effectLabelCell = effectLabelRow.insertCell(0);
  view.nameCell.style.textAlign = "left";
  view.effectLabelCell.style.textAlign = "left";
  view.potionImage = createElement("img", iconCell, null, "itemImage");
  view.potionImage.src = "images/Transparent.gif";
  view.contentContainer.onmouseup = function () {
    view.activate();
    return false;
  };
  view.progressFillElement = createElement("div", view.contentContainer, null, "potionButtonProgressSlider");
  view.dropButtonVisible = false;
  view.dropPotionButton = createElement("div", view.contentContainer, null, "dropPotionButton");
  view.dropPotionButton.title = "丢弃药剂";
  view.dropPotionButton.innerHTML = "X";
  view.dropPotionButton.style.display = "none";
  view.dropButtonShown = false;
  view.dropPotionButton.onmouseup = function () {
    view.removePotion();
    return false;
  };
}
export function PotionBarView() {
  this.elementId = "potionButtonContainer";
  this.visible = true;
  this.mounted = false;
  this.buttonViews = [];
}
export function ExpeditionView(tabState) {
  this.elementId = "gameTabContent";
  this.tabState = tabState;
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
      var effectSlotIndex;
      for (effectSlotIndex = 0; effectSlotIndex < this.shownEffectTypeIds.length; effectSlotIndex++) {
        this.shownEffectTypeIds[effectSlotIndex] = null;
        this.potionSlots[effectSlotIndex] = null;
        this.effectFrameIndices[effectSlotIndex] = 0;
      }
      this.summaryTable = createElement("table", getElement(this.elementId), null, "adventurerInfoTable");
      var healthRow = this.summaryTable.insertRow(0);
      var portraitElement = healthRow.insertCell(0);
      portraitElement.className = "gameTabAdventurerIconCell";
      portraitElement.rowSpan = 2;
      var adventurer = game.state.adventurers[this.adventurerIndex],
        sprite = adventurer.getSprite(),
        portraitElement = createElement("img", portraitElement, null, "characterImage");
      portraitElement.src = "images/Transparent.gif";
      portraitElement.style.height = "35px";
      portraitElement.style.background = "url('spritesheet/monsters.png') -" + sprite.sourceX + "px -" + (sprite.sourceY + 8) + "px";
      var nameCell = healthRow.insertCell(1);
      nameCell.style.width = "123px";
      nameCell.innerHTML = adventurer.adventurerName;
      var healthSliderCell = healthRow.insertCell(2);
      healthSliderCell.className = "gameTabAdventurerSliderCell";
      healthSliderCell.title = "生命值";
      var healthSliderDiv = createElement("div", healthSliderCell, null, null);
      healthSliderDiv.className = "gameTabAdventurerSliderDiv";
      createElement("div", healthSliderDiv, this.healthSliderId, "gameTabAdventurerHealthSlider");
      createElement("div", healthSliderCell, this.healthTextId, "gameTabAdventurerSliderOverlay");
      var healthLabelCell = healthRow.insertCell(3);
      healthLabelCell.style.width = "30px";
      healthLabelCell.style.textAlign = "left";
      healthLabelCell.style.paddingLeft = "4px";
      healthLabelCell.title = "生命值";
      healthLabelCell.innerHTML = "HP";
      var damageTextCell = healthRow.insertCell(4);
      damageTextCell.id = this.damageTextId;
      damageTextCell.title = "伤害:提高攻击伤害";
      damageTextCell.className = "gameTabAdventurerInfoHpAc";
      this.damageHeaderCell = healthRow.insertCell(5);
      this.damageHeaderCell.style.width = "30px";
      this.damageHeaderCell.style.textAlign = "left";
      this.damageHeaderCell.title = "伤害:提高攻击伤害";
      this.damageHeaderCell.innerHTML = "伤害";
      var attackRatingTextCell = healthRow.insertCell(6);
      attackRatingTextCell.id = this.attackRatingTextId;
      attackRatingTextCell.className = "gameTabAdventurerInfoHpAc";
      attackRatingTextCell.title = "攻击率：增加成功攻击的机会，可以理解为命中属性";
      this.attackRatingHeaderCell = healthRow.insertCell(7);
      this.attackRatingHeaderCell.style.width = "30px";
      this.attackRatingHeaderCell.style.textAlign = "left";
      this.attackRatingHeaderCell.title = "攻击率：增加成功攻击的机会，可以理解为命中属性";
      this.attackRatingHeaderCell.innerHTML = "攻击";
      var columnIndex = 8;
      for (var effectIconIndex = 0; effectIconIndex < this.effectIconIds.length; effectIconIndex++) {
        var effectIconElement = healthRow.insertCell(columnIndex++);
        effectIconElement.rowSpan = 2;
        effectIconElement = createElement("div", effectIconElement, null, "gameTabAdventurerInfoEffect");
        effectIconElement = createElement("img", effectIconElement, this.effectIconIds[effectIconIndex], "itemImage");
        effectIconElement.src = "images/Transparent.gif";
        effectIconElement.style.width = "30px";
        effectIconElement.style.height = "30px";
        effectIconElement.style.display = "none";
      }
      var spiritRow = this.summaryTable.insertRow(1);
      var levelClassCell = spiritRow.insertCell(0);
      levelClassCell.id = this.levelClassTextId;
      levelClassCell.style.width = "120px";
      var spiritSliderCell = spiritRow.insertCell(1);
      spiritSliderCell.className = "gameTabAdventurerSliderCell";
      spiritSliderCell.title = "法力值";
      var spiritSliderDiv = createElement("div", spiritSliderCell, null, "gameTabAdventurerSliderDiv");
      createElement("div", spiritSliderDiv, this.spiritSliderId, "gameTabAdventurerSpiritPointsSlider");
      createElement("div", spiritSliderCell, this.spiritTextId, "gameTabAdventurerSliderOverlay");
      var spiritLabelCell = spiritRow.insertCell(2);
      spiritLabelCell.style.width = "30px";
      spiritLabelCell.style.textAlign = "left";
      spiritLabelCell.style.paddingLeft = "4px";
      spiritLabelCell.title = "法力值";
      spiritLabelCell.innerHTML = "SP";
      var armorTextCell = spiritRow.insertCell(3);
      armorTextCell.id = this.armorTextId;
      armorTextCell.className = "gameTabAdventurerInfoHpAc";
      armorTextCell.title = "护甲:降低受到的伤害";
      this.potionButton = spiritRow.insertCell(4);
      this.potionButton.style.width = "30px";
      this.potionButton.style.textAlign = "left";
      this.potionButton.title = "护甲:降低受到的伤害";
      this.potionButton.innerHTML = "护甲";
      var defenceRatingTextCell = spiritRow.insertCell(5);
      defenceRatingTextCell.id = this.defenceRatingTextId;
      defenceRatingTextCell.className = "gameTabAdventurerInfoHpAc";
      defenceRatingTextCell.title = "防御率：防止敌人成功攻击，可以理解为闪避属性";
      this.defenceHeaderCell = spiritRow.insertCell(6);
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
        var adventurer = game.state.adventurers[this.adventurerIndex],
          stats = adventurer.stats,
          health = stats.health,
          maxHealth = statValue(stats.maxHealth),
          spirit = stats.spirit,
          maxSpirit = statValue(stats.maxSpirit),
          damage = statValue(stats.damage),
          armor = statValue(stats.armor),
          attackRating = statValue(stats.attackRating),
          defenceRating = statValue(stats.defenceRating),
          characterLevel = stats.characterLevel;
        if (this.cachedHealth !== health || this.cachedMaxHealth !== maxHealth) {
          setElementHtml(this.healthTextId, formatAmount(health) + "/" + formatAmount(maxHealth));
          var healthSliderPercent = Math.min(100, floorNumber(100 * health / maxHealth));
          getElement(this.healthSliderId).style.width = healthSliderPercent + "%";
          this.cachedHealth = health;
          this.cachedMaxHealth = maxHealth;
        }
        if (this.cachedSpirit !== spirit || this.cachedMaxSpirit !== maxSpirit) {
          setElementHtml(this.spiritTextId, formatAmount(spirit) + "/" + formatAmount(maxSpirit));
          var spiritSliderPercent = Math.min(100, floorNumber(100 * spirit / maxSpirit));
          getElement(this.spiritSliderId).style.width = spiritSliderPercent + "%";
          this.cachedSpirit = spirit;
          this.cachedMaxSpirit = maxSpirit;
        }
        if (this.cachedLevel !== characterLevel) {
          this.cachedLevel = characterLevel;
          setElementHtml(this.levelClassTextId, "等级" + characterLevel + " " + game.state.adventurers[this.adventurerIndex].classDefinition.className);
        }
        if (this.cachedDamage !== damage) {
          setElementHtml(this.damageTextId, formatAmount(damage));
        }
        if (this.cachedArmor !== armor) {
          setElementHtml(this.armorTextId, formatAmount(armor));
        }
        if (this.cachedAttackRating !== attackRating) {
          setElementHtml(this.attackRatingTextId, formatAmount(attackRating));
        }
        if (this.cachedDefenceRating !== defenceRating) {
          setElementHtml(this.defenceRatingTextId, formatAmount(defenceRating));
        }
        var activeEffects = adventurer.effects.activeEffects;
        var shouldAdvanceEffectFrame = false;
        this.frameAge++;
        if (this.frameAge >= this.effectFrameInterval) {
          this.frameAge = 0;
          shouldAdvanceEffectFrame = true;
        }
        for (var potionSlotIndex = 0; potionSlotIndex < this.potionSlots.length; potionSlotIndex++) {
          this.potionSlots[potionSlotIndex] = null;
        }
        var potionSlotCounter = 0;
        for (var activeEffectIndex = 0; activeEffectIndex < activeEffects.length; activeEffectIndex++) {
          var statusEffectTypeId = activeEffects[activeEffectIndex].statusEffectTypeId;
          var potionSlotPosition = this.potionSlots.indexOf(statusEffectTypeId);
          if (0 > potionSlotPosition && potionSlotCounter < this.potionSlots.length) {
            this.potionSlots[potionSlotCounter] = statusEffectTypeId;
            potionSlotCounter++;
          }
        }
        for (var effectIconIndex = 0; effectIconIndex < this.shownEffectTypeIds.length; effectIconIndex++) {
          var potionSlotTypeId = effectIconIndex < this.potionSlots.length ? this.potionSlots[effectIconIndex] : null;
          var shownEffectTypeId = this.shownEffectTypeIds[effectIconIndex];
          if (potionSlotTypeId) {
            if (shownEffectTypeId && shownEffectTypeId === potionSlotTypeId) {
              if (shouldAdvanceEffectFrame) {
                var currentEffectDefinition = statusEffectDefinitions[shownEffectTypeId];
                var currentSpritesheetPath = currentEffectDefinition.spritesheetPath;
                var currentEffectAnimation = game.animations.getAnimation(currentEffectDefinition.animationName);
                this.effectFrameIndices[effectIconIndex]++;
                if (this.effectFrameIndices[effectIconIndex] >= currentEffectAnimation.getFrameCount()) {
                  this.effectFrameIndices[effectIconIndex] = 0;
                }
                var currentEffectFrame = currentEffectAnimation.frames[this.effectFrameIndices[effectIconIndex]];
                var effectIconElement = getElement(this.effectIconIds[effectIconIndex]);
                effectIconElement.style.background = "url('" + currentSpritesheetPath + "') -" + currentEffectFrame.frameSourceX + "px -" + currentEffectFrame.frameSourceY + "px";
              }
            } else {
              var adoptedEffectTypeId = potionSlotTypeId;
              this.shownEffectTypeIds[effectIconIndex] = adoptedEffectTypeId;
              var newEffectDefinition = statusEffectDefinitions[adoptedEffectTypeId];
              var newSpritesheetPath = newEffectDefinition.spritesheetPath;
              var newEffectAnimation = game.animations.getAnimation(newEffectDefinition.animationName);
              this.effectFrameIndices[effectIconIndex] = 0;
              var newEffectFrame = newEffectAnimation.frames[0];
              var newEffectIconElement = getElement(this.effectIconIds[effectIconIndex]);
              newEffectIconElement.style.background = "url('" + newSpritesheetPath + "') -" + newEffectFrame.frameSourceX + "px -" + newEffectFrame.frameSourceY + "px";
              newEffectIconElement.title = newEffectDefinition.tooltipLabel;
              showElementById(this.effectIconIds[effectIconIndex]);
            }
          } else {
            if (shownEffectTypeId) {
              hideElementById(this.effectIconIds[effectIconIndex]);
              this.shownEffectTypeIds[effectIconIndex] = null;
            }
          }
        }
        var monsters = getMonsters();
        if (0 === monsters.length) {
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
          var monsterStats = monsters[0].stats;
          var monsterDamage = statValue(monsterStats.damage);
          var monsterArmor = statValue(monsterStats.armor);
          var monsterAttackRating = statValue(monsterStats.attackRating);
          var monsterDefenceRating = statValue(monsterStats.defenceRating);
          this.comparisonEncounterIndex = game.state.encounter.encounterCount;
          colorComparedStats(this.damageTextId, damage, monsterArmor, this.cachedDamage, this.cachedMonsterDamage, this.damageHeaderCell);
          colorComparedStats(this.armorTextId, armor, monsterDamage, this.cachedArmor, this.cachedMonsterArmor, this.potionButton);
          colorComparedStats(this.attackRatingTextId, attackRating, monsterDefenceRating, this.cachedAttackRating, this.cachedMonsterDefenceRating, this.attackRatingHeaderCell);
          colorComparedStats(this.defenceRatingTextId, defenceRating, monsterAttackRating, this.cachedDefenceRating, this.cachedMonsterAttackRating, this.defenceHeaderCell);
          this.cachedMonsterDamage = monsterArmor;
          this.cachedMonsterArmor = monsterDamage;
          this.cachedMonsterAttackRating = monsterAttackRating;
          this.cachedMonsterDefenceRating = monsterDefenceRating;
        }
        this.cachedDamage = damage;
        this.cachedArmor = armor;
        this.cachedAttackRating = attackRating;
        this.cachedDefenceRating = defenceRating;
      }
    }
  };
  DungeonNotificationView.prototype = new View();
  DungeonNotificationView.prototype.reset = function () {
    clearElementById(this.elementId);
    this.cachedDungeonLevel = this.cachedDungeonName = "";
    var panelElement = getElement(this.elementId);
    this.notificationElement = createElement("div", panelElement, null, "dungeonNotificationDiv");
    hideElement(panelElement);
    (/** @type {any} */ (this)).cachedVisible = false;
  };
  DungeonNotificationView.prototype.isVisible = function () {
    return !game.worldActive;
  };
  DungeonNotificationView.prototype.update = function () {
    var dungeonName, dungeonLevel;
    if (game.currentDungeon) {
      dungeonName = game.currentDungeon.dungeonName;
      dungeonLevel = game.currentDungeon.currentLevelIndex + 1;
    } else {
      dungeonName = game.currentCastle.castleName;
      dungeonLevel = 0;
    }
    if (dungeonLevel !== this.cachedDungeonLevel || dungeonName !== this.cachedDungeonName) {
      this.cachedDungeonLevel = dungeonLevel;
      this.cachedDungeonName = dungeonName;
      this.notificationElement.innerHTML = 0 < dungeonLevel ? dungeonName + " (等级." + dungeonLevel + ")" : dungeonName;
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
    var encounterCount = game.state.encounter.encounterCount,
      monsterCount = getMonsters().length;
    if (this.cachedEncounterIndex !== encounterCount || this.cachedMonsterCount != monsterCount) {
      if (this.cachedEncounterIndex !== encounterCount) {
        this.encounterTotalMonsters = monsterCount;
      }
      this.cachedEncounterIndex = encounterCount;
      this.cachedMonsterCount = monsterCount;
      var encounterName;
      encounterName = game.state.encounter.encounterName;
      var isBossEncounter = game.state.encounter.isBossEncounter;
      this.notificationElement.innerHTML = isBossEncounter ? "遭遇首领!<br/> " + encounterName : "一场遭遇战!<br/>" + monsterCount + "/" + this.encounterTotalMonsters + " " + encounterName;
      if (this.isBossEncounter != isBossEncounter) {
        this.isBossEncounter = isBossEncounter;
        this.notificationElement.className = isBossEncounter ? "bossEncounterNotificationDiv" : "encounterNotificationDiv";
      }
    }
  };
  CurrencyView.prototype = new View();
  CurrencyView.prototype.reset = function () {};
  CurrencyView.prototype.update = function () {
    var experiencePoints = game.state.party.experiencePoints,
      gold = game.state.party.gold,
      kills = game.state.party.kills;
    if (experiencePoints !== this.cachedExperience) {
      this.cachedExperience = experiencePoints;
      setElementHtml(this.experienceCellId, "" + formatAmount(experiencePoints));
    }
    if (gold !== this.cachedGold) {
      this.cachedGold = gold;
      setElementHtml(this.goldCellId, "" + formatAmount(gold));
    }
    if (kills !== this.cachedKills) {
      this.cachedKills = kills;
      setElementHtml(this.killsCellId, "" + formatAmount(kills));
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
    var availablePoints = game.state.adventurePoints.availablePoints;
    if (availablePoints !== this.cachedPoints) {
      this.cachedPoints = availablePoints;
      this.pointsCell.innerHTML = formatGroupedAmount(availablePoints);
    }
  };
  ScrollButtonView.prototype = new View();
  ScrollButtonView.prototype.reset = function () {};
  ScrollButtonView.prototype.update = function () {
    if (!this.buttonElement) {
      mountScrollButton(this);
    }
    var scrollChanged = false;
    if (this.scroll != this.cachedScroll && (this.cachedScroll = this.scroll, scrollChanged = true, this.scroll)) {
      var scrollSprite = this.scroll.spriteName;
      this.itemImage.style.background = "url('spritesheet/items.png') -" + scrollSprite.sourceX + "px -" + scrollSprite.sourceY + "px";
    }
    var scrollLabel = this.scroll.label;
    if (this.cachedLabel !== scrollLabel) {
      this.cachedLabel = scrollLabel;
      this.nameCell.innerHTML = scrollLabel;
    }
    var scrollQuantity = this.scroll ? this.scroll.quantity : -1;
    if (infiniteScrollsModifier.currentValue) {
      scrollQuantity = -2;
    }
    var hasQuantity = 0 < scrollQuantity || infiniteScrollsModifier.currentValue;
    this.isEnabled = !this.scroll.locked && hasQuantity && !game.worldActive && 0 < getMonsters().length;
    if (scrollChanged || this.wasEnabled != this.isEnabled) {
      this.wasEnabled = this.isEnabled;
      this.buttonElement.className = this.isEnabled ? "scrollButton" : "scrollButtonDisabled";
    }
    var isScrollLocked = this.scroll.locked;
    if (this.cachedQuantity !== scrollQuantity || this.cachedLocked != isScrollLocked) {
      this.cachedQuantity = scrollQuantity;
      this.cachedLocked = isScrollLocked;
      this.quantityCell.innerHTML = isScrollLocked ? "" : infiniteScrollsModifier.currentValue ? "无限" : "x" + scrollQuantity;
    }
    a: {
      var keyBindings = this.keyBindings;
      for (var keyIndex = 0; keyIndex < (/** @type {any} */ (keyBindings)).length; keyIndex++) {
        if (this.collection.keyStates[keyBindings[keyIndex]]) {
          var hasReleasedKey = true;
          break a;
        }
      }
      hasReleasedKey = false;
    }
    if (hasReleasedKey) {
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
    var buttonIndex,
      scrollList = game.scrolls.scrollList,
      buttonView,
      scroll;
    for (buttonIndex = 0; buttonIndex < this.buttonViews.length; buttonIndex++) {
      scroll = scrollList.length > buttonIndex ? scrollList[buttonIndex] : null;
      buttonView = this.buttonViews[buttonIndex];
      buttonView.scroll = scroll;
      buttonView.render();
    }
    scrollButtonsChanged(this.collection);
  };
  ScrollBarView.prototype.createDomElements = function () {
    this.tableElement = createElement("table", getElement(this.elementId), null, null);
    var buttonRow = this.tableElement.insertRow(0),
      cellElementId,
      buttonCell,
      buttonIndex;
    for (buttonIndex = 0; 6 > buttonIndex; buttonIndex++) {
      buttonCell = buttonRow.insertCell(buttonIndex);
      cellElementId = "scrollButtonCell" + buttonIndex;
      createElement("div", buttonCell, cellElementId, null);
      this.buttonViews.push(new ScrollButtonView(cellElementId, buttonIndex, this.collection, this.keyBindings[buttonIndex]));
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
      var buttonClass;
      buttonClass = (buttonClass = this.potion) ? !buttonClass.active && isPotionModifierActive(buttonClass) ? "potionButtonDisabled" : buttonClass.active ? "potionButtonActive" : "potionButton" : "potionButtonDisabled";
      if (this.cachedButtonClass != buttonClass) {
        this.cachedButtonClass = buttonClass;
        this.tableElement.className = buttonClass;
      }
      if (this.potion != this.cachedPotion) {
        this.nameCell.innerHTML = this.potion.displayName;
        this.effectLabelCell.innerHTML = this.potion.effectLabel;
        var potionSprite = this.potion.potionSprite;
        this.potionImage.style.background = "url('spritesheet/items.png') -" + potionSprite.sourceX + "px -" + potionSprite.sourceY + "px";
      }
      this.cachedPotion = this.potion;
      if (this.potion.active) {
        if (!this.dropButtonVisible) {
          showElement(this.progressFillElement);
          this.dropButtonVisible = true;
        }
        var fillWidth = Math.min(1, (game.state.turnNumber - this.potion.activationTurn) / (800 + potionDurationBonus.currentValue));
        fillWidth *= this.progressBarWidth;
        if (this.cachedFillWidth !== fillWidth) {
          this.cachedFillWidth = fillWidth;
          this.progressFillElement.style.width = fillWidth + "px";
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
  PotionButtonView.prototype.activate = function () {
    if (this.potion) {
      if (!(this.potion.active || !this.potion.active && isPotionModifierActive(this.potion))) {
        this.potion.activate(game.state);
      }
    }
  };
  PotionButtonView.prototype.removePotion = function () {
    if (this.potion) {
      game.potions.removePotion(this.potion);
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
    var buttonIndex,
      potionList = game.potions.potionList,
      buttonView,
      potion;
    for (buttonIndex = 0; buttonIndex < this.buttonViews.length; buttonIndex++) {
      potion = buttonIndex < potionList.length ? potionList[buttonIndex] : null;
      buttonView = this.buttonViews[buttonIndex];
      buttonView.potion = potion;
      buttonView.render();
    }
  };
  PotionBarView.prototype.createDomElements = function () {
    var containerElement = getElement(this.elementId);
    this.mounted = true;
    var rowIndex,
      columnIndex,
      slotCounter = 0;
    for (rowIndex = 0; 4 > rowIndex; rowIndex++) {
      for (columnIndex = 0; 2 > columnIndex; columnIndex++) {
        var column = columnIndex,
          row = rowIndex,
          slotIndex = slotCounter++,
          elementId = "potionButton_Row" + row + "_Col" + column,
          cellElement = createElement("div", containerElement, null, "potionCellDiv");
        cellElement.id = elementId;
        cellElement.style.left = 196 * column + "px";
        cellElement.style.top = 47 * row + "px";
        this.buttonViews.push(new PotionButtonView(elementId, slotIndex));
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
