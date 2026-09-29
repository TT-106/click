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
      classDefinition,
      newAdventurer,
      classNamesSummary = "";
    for (selectionIndex = 0; selectionIndex < selectedCharacters.length; selectionIndex++) {
      classDefinition = selectedCharacters[selectionIndex].classIndex;
      classDefinition = adventurerClasses[classDefinition];
      newAdventurer = selectedCharacters[selectionIndex].defaultName;
      var spriteName = classDefinition.spriteName;
      newAdventurer = new Character(newAdventurer, ADVENTURER_TYPE, classDefinition.characterClass, classDefinition, new Inventory(game.state.victoryCount));
      var characterStats = newAdventurer.stats;
      newAdventurer.sprite = game.monsterSprites.getSprite(spriteName);
      var behaviorQueue = createBehaviorQueue(classDefinition.createBehaviors());
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
      if (classDefinition.startsWithSpell) {
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
      applyLevelStats(characterStats, 1, classDefinition.statMultipliers);
      var adventurer = newAdventurer;
      game.state.adventurers.push(adventurer);
      if (0 < selectionIndex) {
        classNamesSummary += ", ";
      }
      classNamesSummary += adventurer.classDefinition.className;
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
export function mountPartyIntroduction(containerElement) {
  var headerElement = createElement("div", containerElement, "partyCreationHeader", "partyCreationIntroductionPanel");
  var textElement = createElement("div", headerElement, null, "sectionTitle");
  textElement.style.fontSize = "14px";
  textElement.innerHTML = "末日大陆需要你的力量!";
  textElement = createElement("p", headerElement, null, null);
  textElement.style.fontSize = "13px";
  textElement.innerHTML = "所有地牢,被遗忘的神庙,封禁的高塔,黑暗矿洞,拷问室,和幽闭的洞穴,那些曾经一片美好的地方,环境优美宜人,都陷入怪物的蹂躏之下,你要做的只有杀戮.";
  var paragraphElement = createElement("p", headerElement, null, null);
  paragraphElement.style.fontSize = "13px";
  paragraphElement.innerHTML = "只有你有这个能力让一切回归旧貌,选择你的队友,杀光大陆上所有的怪物.";
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
    rowIndex = 0,
    classCell,
    classIndex;
  for (classIndex = 0; classIndex < adventurerClasses.length; classIndex++) {
    var currentRow = selectionPanelTable.insertRow(rowIndex);
    rowIndex++;
    classCell = currentRow.insertCell(0);
    if (game.state.victoryCount < adventurerClasses[classIndex].requiredVictories) {
      var viewRef = view,
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
      viewRef.characterSelectionButtons.push(null);
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
export function mountClassChoice(view, containerElement, classIndex) {
  var classDefinition = adventurerClasses[classIndex],
    portraitRow,
    portraitElement,
    classSprite;
  var buttonTable = createElement("table", containerElement, null, "characterSelectionButton");
  view.characterSelectionButtons.push(buttonTable);
  buttonTable.onclick = function () {
    if (!(view.selectedCharacters.length >= 4 + partyCapacityBonus.currentValue)) {
      view.selectedCharacters.push({
        classIndex: classIndex,
        defaultName: adventurerClasses[classIndex].defaultName
      });
      view.selectedPartyDirty = true;
      validateSelectedParty(view);
    }
  };
  portraitRow = buttonTable.insertRow(0);
  var row = buttonTable.insertRow(1);
  portraitElement = portraitRow.insertCell(0);
  portraitElement.style.width = "35px";
  portraitElement.style.textAlign = "center";
  classSprite = game.monsterSprites.getSprite(classDefinition.spriteName);
  portraitElement = createElement("img", portraitElement, null, "characterImage");
  portraitElement.src = "images/Transparent.gif";
  portraitElement.style.height = "35px";
  portraitElement.style.width = "35px";
  portraitElement.style.background = "url('spritesheet/monsters.png') -" + (classSprite.sourceX + 10) + "px -" + (classSprite.sourceY + 12) + "px";
  var nameCell = portraitRow.insertCell(1);
  nameCell.style.width = "410px";
  nameCell.style.textAlign = "left";
  var nameSpan = createElement("span", nameCell, null, null);
  nameSpan.style.fontWeight = "bold";
  nameSpan.style.fontSize = "13px";
  nameSpan.innerHTML = classDefinition.className;
  var cell = row.insertCell(0);
  cell.colSpan = 2;
  cell.innerHTML = classDefinition.descriptionText;
}
export function mountSelectedCharacter(view, selectionCell, selectedCharacter, selectionIndex) {
  var classDefinition = adventurerClasses[selectedCharacter.classIndex],
    selectionTable,
    portraitRow,
    descriptionElement,
    portraitElement,
    classSprite,
    nameInput;
  var containerElement = createElement("div", selectionCell, null, "selectedCharacterContainer");
  selectionTable = createElement("table", containerElement, null, "selectedCharacterSelectionTable");
  if (!(selectedCharacter.defaultName && "" !== selectedCharacter.defaultName)) {
    selectionTable.className = "errorSelectedCharacterSelectionTable";
  }
  portraitRow = selectionTable.insertRow(0);
  descriptionElement = selectionTable.insertRow(1);
  portraitElement = portraitRow.insertCell(0);
  portraitElement.style.width = "35px";
  portraitElement.style.textAlign = "center";
  classSprite = game.monsterSprites.getSprite(classDefinition.spriteName);
  portraitElement = createElement("img", portraitElement, null, "characterImage");
  portraitElement.src = "images/Transparent.gif";
  portraitElement.style.height = "35px";
  portraitElement.style.width = "35px";
  portraitElement.style.background = "url('spritesheet/monsters.png') -" + (classSprite.sourceX + 10) + "px -" + (classSprite.sourceY + 12) + "px";
  var nameCell = portraitRow.insertCell(1);
  nameCell.style.width = "400px";
  nameCell.style.textAlign = "left";
  nameInput = createElement("input", nameCell, null, null);
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
  var nameSpan = createElement("span", nameCell, null, null);
  nameSpan.style.fontWeight = "bold";
  nameSpan.style.fontSize = "13px";
  nameSpan.style.marginLeft = "5px";
  nameSpan.innerHTML = " " + classDefinition.className;
  descriptionElement = descriptionElement.insertCell(0);
  descriptionElement.colSpan = 2;
  descriptionElement.innerHTML = classDefinition.descriptionText;
  var deselectButton = createElement("div", containerElement, null, "deselectCharacterButton");
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
  var moveUpButton = createElement("div", containerElement, null, canMoveUp ? "moveUpButton" : "disabledMoveUpButton");
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
  var moveDownButton = createElement("div", containerElement, null, canMoveDown ? "moveDownButton" : "disabledMoveDownButton");
  moveDownButton.title = "下移";
  moveDownButton.innerHTML = "&#9660;";
  if (canMoveDown) {
    moveDownButton.onmouseup = function () {
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
export function renameSelectedCharacter(view, selectedCharacter, newName, selectionTable) {
  var hadName = null != selectedCharacter.defaultName && "" != selectedCharacter.defaultName;
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
  selectedCharacter.defaultName = newName;
  var hasName = null != selectedCharacter.defaultName && "" != selectedCharacter.defaultName;
  if (hadName && !hasName) {
    selectionTable.className = "errorSelectedCharacterSelectionTable";
  } else {
    if (!hadName && hasName) {
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
        var rowIndex = /** @type {any} */ (0),
          selectionIndex;
        for (selectionIndex = 0; selectionIndex < this.selectedCharacters.length; selectionIndex++) {
          var row = this.selectedCharactersTable.insertRow(rowIndex);
          rowIndex++;
          var rowCell = row.insertCell(0);
          mountSelectedCharacter(this, rowCell, this.selectedCharacters[selectionIndex], selectionIndex);
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
