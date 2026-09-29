/** 原版组队规则及创建动作。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { TabView } from "./navigation.js";
import { clearElement, clearElementById, createElement, getElement, hideElement, showElement } from "./dom.js";
import { game } from "../runtime/game.js";
import { adventurerClasses } from "../content/classes.js";
import { Character, hasUnspentSkills } from "../characters/character.js";
import { ADVENTURER_TYPE } from "../ai/targeting.js";
import { Inventory } from "../loot/inventory.js";
import { applyLevelStats, chooseScrollCaster, createBehaviorQueue, refreshUnspentSkillFlags } from "../simulation/characters.js";
import { refreshPartyLevels } from "../characters/party.js";
import { generateItem } from "../loot/items.js";
import { placePartyInWorld } from "../world/terrain.js";
import { unlockStartingRegion } from "../world/regions.js";
import { recordGameEvent } from "../core/math.js";
import { partyCapacityBonus } from "../content/balance.js";
export function PartyCreationView(tabState) {
  this.elementId = "partyCreationTabContent";
  this.tabState = tabState;
  this.selectedCharacters = [];
  this.characterSelectionButtons = [];
  this.validParty = false;
  this.selectedCharactersTable = null;
  this.cachedHasDuplicateName = this.hasDuplicateName = this.selectedPartyDirty = false;
  this.startButton = this.nameWarningElement = null;
  this.victoryOptionsApplied = false;
}
export function mountPartyCreation(view) {
  var containerElement = getElement(view.elementId);
  clearElement(containerElement);
  mountPartyIntroduction(containerElement);
  mountClassChoices(view, containerElement);
  mountSelectedParty(view, containerElement);
  containerElement = createElement("div", containerElement, null, "partyConfirmationPanel");
  view.startButton = createElement("div", containerElement, "startQuestButton", "disabledUpgradeButton");
  view.startButton.style.padding = "15px";
  view.startButton.style.textAlign = "center";
  view.startButton.innerHTML = getPartyCapacityLabel();
  view.startButton.onclick = function () {
    createAdventurerPartyFromSelection(view);
  };
}
/** 创建小队的真实引擎入口（U132 自 startButton.onclick 闭包逐字提取，随机消费顺序不变）：
 *  遗留按钮与产品壳 adapter.startParty 经 PartyCreationView.prototype.startParty 共用本函数，
 *  两边不再各自驱动开局。守卫（非空选择 + validParty）与函数体保持原语义。 */
function createAdventurerPartyFromSelection(view) {
  if (!(1 > view.selectedCharacters.length) && view.validParty) {
    var selectedCharacters = view.selectedCharacters,
      selectionIndex,
      f,
      newAdventurer,
      classNamesSummary = "";
    for (selectionIndex = 0; selectionIndex < selectedCharacters.length; selectionIndex++) {
      f = selectedCharacters[selectionIndex].classIndex;
      f = adventurerClasses[f];
      newAdventurer = selectedCharacters[selectionIndex].defaultName;
      var spriteName = f.spriteName;
      newAdventurer = new Character(newAdventurer, ADVENTURER_TYPE, f.characterClass, f, new Inventory(game.state.victoryCount));
      var characterStats = newAdventurer.stats;
      newAdventurer.sprite = game.monsterSprites.getSprite(spriteName);
      var behaviorQueue = createBehaviorQueue(f.createBehaviors());
      newAdventurer.behaviors = behaviorQueue;
      characterStats.baseAttackCooldown = 12;
      characterStats.baseHealthRegenPercent = 2;
      characterStats.baseSpiritRegenPercent = 3;
      characterStats.characterLevel = 1;
      var startingSkillPoints = Math.min(40, game.state.victoryCount);
      if (0 < startingSkillPoints) {
        var skillPointAdventurer = newAdventurer;
        skillPointAdventurer.skillPoints = startingSkillPoints;
        skillPointAdventurer.hasUnspentSkills = hasUnspentSkills(skillPointAdventurer);
      }
      if (f.startsWithSpell) {
        newAdventurer.initialSpellSkillPoint = 1;
      }
      refreshPartyLevels();
      const startingSlots = newAdventurer.slotList;
      for (let slotIndex = 0; slotIndex < startingSlots.length; slotIndex++) {
        const startingItem = generateItem(game.itemGenerator, startingSlots[slotIndex], newAdventurer, 1, 0);
        if (startingItem) {
          (/** @type {any} */ (newAdventurer)).equipItem(startingItem);
        }
      }
      applyLevelStats(characterStats, 1, f.statMultipliers);
      f = newAdventurer;
      game.state.adventurers.push(f);
      if (0 < selectionIndex) {
        classNamesSummary += ", ";
      }
      classNamesSummary += f.classDefinition.className;
    }
    game.state.leader = game.state.adventurers[0];
    game.state.scrollCaster = chooseScrollCaster();
    game.partyCreated = true;
    placePartyInWorld();
    unlockStartingRegion();
    refreshUnspentSkillFlags();
    game.allies.reset();
    game.view.reset();
    recordGameEvent("Party Creation", classNamesSummary);
  }
}
export function mountPartyIntroduction(a) {
  a = createElement("div", a, "partyCreationHeader", "partyCreationIntroductionPanel");
  var textElement = createElement("div", a, null, "sectionTitle");
  textElement.style.fontSize = "14px";
  textElement.innerHTML = "末日大陆需要你的力量!";
  textElement = createElement("p", a, null, null);
  textElement.style.fontSize = "13px";
  textElement.innerHTML = "所有地牢,被遗忘的神庙,封禁的高塔,黑暗矿洞,拷问室,和幽闭的洞穴,那些曾经一片美好的地方,环境优美宜人,都陷入怪物的蹂躏之下,你要做的只有杀戮.";
  a = createElement("p", a, null, null);
  a.style.fontSize = "13px";
  a.innerHTML = "只有你有这个能力让一切回归旧貌,选择你的队友,杀光大陆上所有的怪物.";
}
export function getPartyCapacityLabel() {
  var partyCapacity = 4 + partyCapacityBonus.currentValue;
  if (4 === partyCapacity) {
    return "最多选择4名队员";
  }
  if (5 === partyCapacity) {
    return "最多选择5名队员";
  }
}
export function mountClassChoices(view, tabContentElement) {
  var headerContainer = createElement("div", tabContentElement, null, "partySelectionHeaderContainer");
  createElement("span", headerContainer, null, "partySelectionHeaderSpan").innerHTML = getPartyCapacityLabel();
  var selectionPanelTable = createElement("div", tabContentElement, null, "partySelectionPanel"),
    selectionPanelTable = createElement("table", selectionPanelTable, null, "partySelectionTable"),
    d = null,
    rowIndex = 0,
    classCell,
    classIndex;
  for (classIndex = 0; classIndex < adventurerClasses.length; classIndex++) {
    if (d = selectionPanelTable.insertRow(rowIndex), rowIndex++, classCell = d.insertCell(0), d = game.state.victoryCount < adventurerClasses[classIndex].requiredVictories) {
      var d = view,
        lockedClassIndex = classIndex;
      classCell = createElement("table", classCell, null, "lockedCharacterSelectionTable").insertRow(0).insertCell(0);
      var classSprite = game.monsterSprites.getSprite(adventurerClasses[lockedClassIndex].spriteName),
        characterImage = createElement("img", classCell, null, "characterImage");
      characterImage.src = "images/Transparent.gif";
      characterImage.style.height = "35px";
      characterImage.style.width = "35px";
      characterImage.style.background = "url('spritesheet/monsters.png') -" + (classSprite.sourceX + 10) + "px -" + (classSprite.sourceY + 12) + "px";
      classCell = createElement("div", classCell, null, null);
      var lockMessageText = undefined;
      switch (adventurerClasses[lockedClassIndex].requiredVictories) {
        case 0:
          lockMessageText = "角色已经解锁了(bug?)";
          break;
        case 1:
          lockMessageText = "二周目时解锁该角色";
          break;
        case 2:
          lockMessageText = "三周目时解锁该角色";
          break;
        case 3:
          lockMessageText = "四周目时解锁该角色";
          break;
        case 4:
          lockMessageText = "五周目时解锁该角色";
          break;
        case 5:
          lockMessageText = "六周目时解锁该角色";
          break;
        case 6:
          lockMessageText = "七周目时解锁该角色";
          break;
        default:
          lockMessageText = "稍后解锁该角色";
      }
      classCell.innerHTML = lockMessageText;
      d.characterSelectionButtons.push(null);
    } else {
      mountClassChoice(view, classCell, classIndex);
    }
  }
}
export function mountSelectedParty(view, tabContentElement) {
  var sectionContainer = createElement("div", tabContentElement, null, "selectedCharactersHeaderContainer");
  createElement("span", sectionContainer, null, "partySelectionHeaderSpan").innerHTML = "已选择角色";
  sectionContainer = createElement("div", tabContentElement, null, "selectedCharactersPanel");
  view.selectedCharactersTable = createElement("table", sectionContainer, null, "partySelectionTable");
  view.nameWarningElement = createElement("div", sectionContainer, null, "partySelectionNameWarning");
  view.nameWarningElement.innerHTML = "给你的角色取个独特的名字.";
  view.nameWarningElement.style.display = "none";
}
export function mountClassChoice(view, b, classIndex) {
  var classDefinition = adventurerClasses[classIndex],
    f,
    portraitElement,
    classSprite;
  b = createElement("table", b, null, "characterSelectionButton");
  view.characterSelectionButtons.push(b);
  b.onclick = function () {
    if (!(view.selectedCharacters.length >= 4 + partyCapacityBonus.currentValue)) {
      view.selectedCharacters.push({
        classIndex: classIndex,
        defaultName: adventurerClasses[classIndex].defaultName
      });
      view.selectedPartyDirty = true;
      validateSelectedParty(view);
    }
  };
  f = b.insertRow(0);
  b = b.insertRow(1);
  portraitElement = f.insertCell(0);
  portraitElement.style.width = "35px";
  portraitElement.style.textAlign = "center";
  classSprite = game.monsterSprites.getSprite(classDefinition.spriteName);
  portraitElement = createElement("img", portraitElement, null, "characterImage");
  portraitElement.src = "images/Transparent.gif";
  portraitElement.style.height = "35px";
  portraitElement.style.width = "35px";
  portraitElement.style.background = "url('spritesheet/monsters.png') -" + (classSprite.sourceX + 10) + "px -" + (classSprite.sourceY + 12) + "px";
  f = f.insertCell(1);
  f.style.width = "410px";
  f.style.textAlign = "left";
  f = createElement("span", f, null, null);
  f.style.fontWeight = "bold";
  f.style.fontSize = "13px";
  f.innerHTML = classDefinition.className;
  b = b.insertCell(0);
  b.colSpan = 2;
  b.innerHTML = classDefinition.descriptionText;
}
export function mountSelectedCharacter(view, b, selectedCharacter, selectionIndex) {
  var classDefinition = adventurerClasses[selectedCharacter.classIndex],
    selectionTable,
    h,
    descriptionElement,
    portraitElement,
    classSprite,
    nameInput;
  b = createElement("div", b, null, "selectedCharacterContainer");
  selectionTable = createElement("table", b, null, "selectedCharacterSelectionTable");
  if (!(selectedCharacter.defaultName && "" !== selectedCharacter.defaultName)) {
    selectionTable.className = "errorSelectedCharacterSelectionTable";
  }
  h = selectionTable.insertRow(0);
  descriptionElement = selectionTable.insertRow(1);
  portraitElement = h.insertCell(0);
  portraitElement.style.width = "35px";
  portraitElement.style.textAlign = "center";
  classSprite = game.monsterSprites.getSprite(classDefinition.spriteName);
  portraitElement = createElement("img", portraitElement, null, "characterImage");
  portraitElement.src = "images/Transparent.gif";
  portraitElement.style.height = "35px";
  portraitElement.style.width = "35px";
  portraitElement.style.background = "url('spritesheet/monsters.png') -" + (classSprite.sourceX + 10) + "px -" + (classSprite.sourceY + 12) + "px";
  h = h.insertCell(1);
  h.style.width = "400px";
  h.style.textAlign = "left";
  nameInput = createElement("input", h, null, null);
  nameInput.type = "text";
  nameInput.size = 15;
  nameInput.maxLength = 15;
  nameInput.value = selectedCharacter.defaultName;
  nameInput.onkeyup = function () {
    renameSelectedCharacter(view, selectedCharacter, nameInput.value, selectionTable);
  };
  nameInput.onchange = function () {
    renameSelectedCharacter(view, selectedCharacter, nameInput.value, selectionTable);
  };
  h = createElement("span", h, null, null);
  h.style.fontWeight = "bold";
  h.style.fontSize = "13px";
  h.style.marginLeft = "5px";
  h.innerHTML = " " + classDefinition.className;
  descriptionElement = descriptionElement.insertCell(0);
  descriptionElement.colSpan = 2;
  descriptionElement.innerHTML = classDefinition.descriptionText;
  var deselectButton = createElement("div", b, null, "deselectCharacterButton");
  deselectButton.title = "移除角色";
  deselectButton.innerHTML = "X";
  deselectButton.onmouseup = function () {
    if (!(0 > selectionIndex || selectionIndex >= view.selectedCharacters.length)) {
      view.selectedCharacters.splice(selectionIndex, 1);
      view.selectedPartyDirty = true;
      validateSelectedParty(view);
    }
    return false;
  };
  var canMoveUp = 0 < selectionIndex;
  var moveUpButton = createElement("div", b, null, canMoveUp ? "moveUpButton" : "disabledMoveUpButton");
  moveUpButton.title = "上移";
  moveUpButton.innerHTML = "&#9650";
  if (canMoveUp) {
    moveUpButton.onmouseup = function () {
      if (0 !== selectionIndex) {
        var previousEntry = view.selectedCharacters[selectionIndex - 1];
        view.selectedCharacters[selectionIndex - 1] = view.selectedCharacters[selectionIndex];
        view.selectedCharacters[selectionIndex] = previousEntry;
        view.selectedPartyDirty = true;
        validateSelectedParty(view);
      }
      return false;
    };
  }
  var canMoveDown = selectionIndex < view.selectedCharacters.length - 1;
  b = createElement("div", b, null, canMoveDown ? "moveDownButton" : "disabledMoveDownButton");
  b.title = "下移";
  b.innerHTML = "&#9660;";
  if (canMoveDown) {
    b.onmouseup = function () {
      if (!(selectionIndex >= view.selectedCharacters.length - 1)) {
        var nextEntry = view.selectedCharacters[selectionIndex + 1];
        view.selectedCharacters[selectionIndex + 1] = view.selectedCharacters[selectionIndex];
        view.selectedCharacters[selectionIndex] = nextEntry;
        view.selectedPartyDirty = true;
        validateSelectedParty(view);
      }
      return false;
    };
  }
}
export function renameSelectedCharacter(view, b, newName, selectionTable) {
  var hadName = null != b.defaultName && "" != b.defaultName;
  if (newName) {
    newName = newName.replace("&", "&amp;");
    newName = newName.replace("<", "&lt;");
    newName = newName.replace(">", "&gt;");
    newName = newName.replace('"', "&quot;");
    newName = newName.replace("'", "&#x27;");
    newName = newName.replace("/", "&#x2F;");
  } else {
    newName = "";
  }
  b.defaultName = newName;
  b = null != b.defaultName && "" != b.defaultName;
  if (hadName && !b) {
    selectionTable.className = "errorSelectedCharacterSelectionTable";
  } else {
    if (!hadName && b) {
      selectionTable.className = "selectedCharacterSelectionTable";
    }
  }
  validateSelectedParty(view);
}
export function validateSelectedParty(view) {
  var isPartyValid = true,
    selectedName,
    selectionIndex,
    partyCapacity = 4 + partyCapacityBonus.currentValue,
    collectedNames = [],
    hasDuplicateName = false;
  for (selectionIndex = 0; selectionIndex < view.selectedCharacters.length; selectionIndex++) {
    if (!((selectedName = view.selectedCharacters[selectionIndex].defaultName) && "" !== selectedName)) {
      isPartyValid = false;
    }
    if (-1 < collectedNames.indexOf(selectedName)) {
      hasDuplicateName = true;
      isPartyValid = false;
    }
    collectedNames.push(selectedName);
  }
  for (var classIndex = 0; classIndex < adventurerClasses.length; classIndex++) {
    var isClassLocked = game.state.victoryCount < adventurerClasses[classIndex].requiredVictories;
    if (!isClassLocked) {
      view.characterSelectionButtons[classIndex].className = view.selectedCharacters.length === partyCapacity ? "disabledCharacterSelectionButton" : "characterSelectionButton";
    }
  }
  if (0 === view.selectedCharacters.length) {
    isPartyValid = false;
  }
  var remainingSlots = partyCapacity - view.selectedCharacters.length;
  var startButtonLabel = getPartyCapacityLabel();
  if (isPartyValid) {
    switch (view.startButton.className = "upgradeButton", remainingSlots) {
      case 1:
        startButtonLabel = "你还可以添加1个角色,或是直接开始游戏.";
        break;
      case 2:
        startButtonLabel = "你还可以添加2个角色,或是直接开始游戏.";
        break;
      case 3:
        startButtonLabel = "你还可以添加3个角色,或是直接开始游戏.";
        break;
      case 4:
        startButtonLabel = "你还可以添加4个角色,或是直接开始游戏.";
        break;
      default:
        startButtonLabel = "开始冒险!";
    }
  } else {
    view.startButton.className = "disabledUpgradeButton";
  }
  view.startButton.innerHTML = startButtonLabel;
  view.hasDuplicateName = hasDuplicateName;
  view.validParty = isPartyValid;
}
export function initializeViewsPartyCreation() {
  PartyCreationView.prototype = new TabView();
  PartyCreationView.prototype.onGameWon = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  PartyCreationView.prototype.onOfflineFinish = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  PartyCreationView.prototype.onOfflineStart = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  PartyCreationView.prototype.reset = function () {
    this.tabState.enabled = false;
    clearElementById(this.elementId);
    this.victoryOptionsApplied = false;
    this.selectedCharacters.length = 0;
    this.characterSelectionButtons.length = 0;
    this.validParty = false;
    this.startButton = null;
  };
  /** 产品壳（adapter.startParty）与遗留 startButton 共用的唯一"创建小队"入口（U132）。
   *  调用者只需传入 {classIndex, defaultName} 列表，不必再了解 selectedCharacters/validParty
   *  两个视图私有字段，也不必调用 startButton.onclick 这个 DOM 回调。
   *  语义：写自身选择状态（update 据此渲染已选表）→ 按视图同一条校验（重名/空名/容量，
   *  结果写 validParty 并刷新按钮文案）→ 共用创建函数。守卫不过时静默不创建（与原按钮一致）。 */
  PartyCreationView.prototype.startParty = function (selectedCharacters) {
    this.selectedCharacters = selectedCharacters;
    validateSelectedParty(this);
    createAdventurerPartyFromSelection(this);
  };
  PartyCreationView.prototype.update = function () {
    if (!(0 < game.state.adventurers.length)) {
      if (!this.victoryOptionsApplied) {
        mountPartyCreation(this);
        this.victoryOptionsApplied = true;
      }
      if (this.selectedPartyDirty) {
        this.selectedPartyDirty = false;
        var selectedCharactersTable = this.selectedCharactersTable;
        if (selectedCharactersTable) {
          for (; 0 < selectedCharactersTable.rows.length;) {
            selectedCharactersTable.deleteRow(0);
          }
        }
        var b = null,
          rowIndex = /** @type {any} */ (0),
          selectionIndex;
        for (selectionIndex = 0; selectionIndex < this.selectedCharacters.length; selectionIndex++) {
          b = this.selectedCharactersTable.insertRow(rowIndex);
          rowIndex++;
          b = b.insertCell(0);
          mountSelectedCharacter(this, b, this.selectedCharacters[selectionIndex], selectionIndex);
        }
      }
      if (this.cachedHasDuplicateName != this.hasDuplicateName) {
        if (this.cachedHasDuplicateName = this.hasDuplicateName) {
          showElement(this.nameWarningElement);
        } else {
          hideElement(this.nameWarningElement);
        }
      }
    }
  };
}
