/** 胜利、继承与离线收益面板。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { TabView } from "./navigation.js";
import { clearElement, clearElementById, createElement, getElement } from "./dom.js";
import { game } from "../runtime/game.js";
import { MAX_PRESTIGE_INVENTORY_BONUS } from "../content/balance.js";
import { floorNumber, formatAmount, randomInt, recordGameEvent } from "../core/math.js";
import { placePartyInWorld } from "../world/terrain.js";
import { unlockStartingRegion } from "../world/regions.js";
import { saveProgress } from "../persistence/game-save.js";
import { adventurerClasses } from "../content/classes.js";
import { monsterSpriteDefinitions } from "../core/bootstrap-data.js";
/**
 * `buildOfflineProgressTable` 与 `getOfflineProgressCell` 都在 `initializeViewsResults()` 里后挂到原型上，
 * tsc 在函数边界外看不到它们，此前用 `@type {any}` 绕过（8 处）。用交叉类型把方法显式声明出来，
 * 既去掉 `any`，也让参数/返回值的误用能被 tsc 抓到（DOM 类型来自 tsconfig 的 `lib: ["ES2022","DOM"]`）。
 * @typedef {OfflineProgressView & { getOfflineProgressCell: (table: HTMLTableElement, label: string, rowIndex: number) => HTMLTableCellElement }} OfflineProgressViewWithCells
 */
export function GameOverView(tabState) {
  this.elementId = "gameOverTabContent";
  this.tabState = tabState;
  this.gameOverMounted = false;
}
export function mountGameOver(a) {
  clearElementById(a.elementId);
  a = getElement(a.elementId);
  mountVictoryDecoration(a);
  a = createElement("div", a, null, "gameOverContentsDiv");
  createElement("div", a, null, "gameOverHeading").innerHTML = "末日危机2胜利!";
  var victoryBlurbDiv = createElement("div", a, null, "gameOverBlurb");
  createElement("p", victoryBlurbDiv, null, null).innerHTML = "你征服了每一座城堡,并将冰冻的世界变为绿色的国度.";
  createElement("p", victoryBlurbDiv, null, null).innerHTML = "末日大陆上的人民终于从怪物的蹂躏下解放出来,不再需要战战兢兢的度日!";
  createElement("p", victoryBlurbDiv, null, null).innerHTML = "你可以重新选择队友开始新的一轮征程,也可以用当前的队伍继续.";
  createElement("p", victoryBlurbDiv, null, null).innerHTML = "重新开始征程你将获得以下加成:";
  var victoryCount = game.state.victoryCount,
    newlyUnlockedClassNames = getNewlyUnlockedClasses(victoryCount),
    skillPointBonus = Math.min(40, victoryCount),
    inventorySizeBonus = Math.min(MAX_PRESTIGE_INVENTORY_BONUS, victoryCount),
    unlockedClassIndex;
  for (unlockedClassIndex = 0; unlockedClassIndex < newlyUnlockedClassNames.length; unlockedClassIndex++) {
    createElement("p", victoryBlurbDiv, null, "gameOverBonus").innerHTML = "解锁角色职业:" + newlyUnlockedClassNames[unlockedClassIndex];
  }
  if (victoryCount <= MAX_PRESTIGE_INVENTORY_BONUS) {
    createElement("p", victoryBlurbDiv, null, "gameOverBonus").innerHTML = "背包大小加成:" + inventorySizeBonus;
  }
  createElement("p", victoryBlurbDiv, null, "gameOverBonus").innerHTML = "技能点加成:" + skillPointBonus;
  var restartButtonDiv = createElement("div", a, null, "gameOverBlurb");
  restartButtonDiv = createElement("div", restartButtonDiv, null, "upgradeButton");
  restartButtonDiv.style.padding = "15px";
  restartButtonDiv.style.textAlign = "center";
  restartButtonDiv.innerHTML = "重生 - 以1级的队伍重新开始游戏.";
  restartButtonDiv.onclick = function () {
    game.gameWon = false;
    recordGameEvent("Victory", "Decision: Prestige");
    game.restartRun();
  };
  a = createElement("div", a, null, "gameOverBlurb");
  a = createElement("div", a, null, "upgradeButton");
  a.style.padding = "15px";
  a.style.textAlign = "center";
  a.innerHTML = "继续 - 用你当前的队伍征服新的城堡.";
  a.onclick = function () {
    game.gameWon = false;
    recordGameEvent("Victory", "Decision: Continue");
    game.resetContinuation();
    game.state.victoryStatistics.currentContinueCount++;
    placePartyInWorld();
    unlockStartingRegion();
    game.allies.reset();
    game.view.reset();
    saveProgress(game.saves);
  };
}
export function getNewlyUnlockedClasses(victoryCount) {
  var classNames = [],
    classIndex;
  for (classIndex = 0; classIndex < adventurerClasses.length; classIndex++) {
    if (adventurerClasses[classIndex].requiredVictories === victoryCount) {
      classNames.push(adventurerClasses[classIndex].className);
    }
  }
  return classNames;
}
export function mountVictoryDecoration(a) {
  var firstTopPortraitRow = createElement("table", a, null, "gameOverTableTopRow").insertRow(0),
    firstTopCellIndex;
  for (firstTopCellIndex = 0; 19 > firstTopCellIndex; firstTopCellIndex++) {
    appendRandomMonsterPortrait(firstTopPortraitRow.insertCell(firstTopCellIndex));
  }
  var secondTopPortraitTable = createElement("table", a, null, "gameOverTableTopRow");
  secondTopPortraitTable.style.top = "41px";
  var secondTopPortraitRow = secondTopPortraitTable.insertRow(0);
  for (var secondTopCellIndex = 0; 19 > secondTopCellIndex; secondTopCellIndex++) {
    appendRandomMonsterPortrait(secondTopPortraitRow.insertCell(secondTopCellIndex));
  }
  var firstBottomPortraitTable = createElement("table", a, null, "gameOverTableBottomRow");
  firstBottomPortraitTable.style.bottom = "41px";
  var firstBottomPortraitRow = firstBottomPortraitTable.insertRow(0);
  for (var firstBottomCellIndex = 0; 19 > firstBottomCellIndex; firstBottomCellIndex++) {
    appendRandomMonsterPortrait(firstBottomPortraitRow.insertCell(firstBottomCellIndex));
  }
  a = createElement("table", a, null, "gameOverTableBottomRow").insertRow(0);
  for (var secondBottomCellIndex = 0; 19 > secondBottomCellIndex; secondBottomCellIndex++) {
    appendRandomMonsterPortrait(a.insertCell(secondBottomCellIndex));
  }
}
export function appendRandomMonsterPortrait(a) {
  var b = monsterSpriteDefinitions[randomInt(monsterSpriteDefinitions.length)],
    b = game.monsterSprites.getSprite(b.name);
  a = createElement("img", a, null, "characterImage");
  a.src = "images/Transparent.gif";
  a.style.background = "url('spritesheet/monsters.png') -" + b.sourceX + "px -" + (b.sourceY + 10) + "px";
  a.style.height = "30px";
  a.style.width = "52px";
}
export function OfflineProgressView(tabState) {
  this.elementId = "offlineTabContent";
  this.tabState = tabState;
  this.cancelButton = this.progressFillElement = null;
  this.progressBarWidth = 500;
  this.cachedFillWidth = -1;
  this.achievementsDeltaCell = this.stunnedCountDeltaCell = this.attackableCastlesDeltaCell = this.dungeonsClearedDeltaCell = this.levelsClearedDeltaCell = this.itemsSoldDeltaCell = this.itemsFoundDeltaCell = this.directKillsDeltaCell = null;
  this.cachedAchievementsDelta = this.cachedStunnedCountDelta = this.cachedAttackableCastlesDelta = this.cachedDungeonsClearedDelta = this.cachedLevelsClearedDelta = this.cachedItemsSoldDelta = this.cachedItemsFoundDelta = this.cachedDirectKillsDelta = this.achievementsBaseline = this.stunnedCountBaseline = this.attackableCastlesBaseline = this.dungeonsClearedBaseline = this.levelsClearedBaseline = this.itemsSoldBaseline = this.itemsFoundBaseline = this.directKillsBaseline = -1;
}
export function mountOfflineProgress(offlineProgressView) {
  var b = getElement(offlineProgressView.elementId);
  clearElement(b);
  var offlineHeaderDiv = createElement("div", b, null, "offlineHeader"),
    formattedOfflineDuration = offlineProgressView.formatHoursMinutesSeconds(floorNumber(game.offlineDuration / 36E5), floorNumber(game.offlineDuration / 6E4 % 60), floorNumber(game.offlineDuration / 1E3 % 60));
  createElement("div", offlineHeaderDiv, null, "offlineTitleText").innerHTML = "末日危机2";
  createElement("div", offlineHeaderDiv, null, "offlineSubHeader").innerHTML = "离线:" + formattedOfflineDuration;
  createElement("div", offlineHeaderDiv, null, "offlineSubHeader").innerHTML = "正在清算你离开时发生了什么...";
  var offlineProgressBarDiv = createElement("div", b, null, "offlineProgressBarContainer");
  offlineProgressBarDiv = createElement("div", offlineProgressBarDiv, null, "offlineProgressBar");
  offlineProgressView.progressFillElement = createElement("div", offlineProgressBarDiv, null, "offlineProgressSlider");
  var offlineStatsContainerDiv = createElement("div", b, null, "offlineProgressStatsContainer");
  offlineProgressView.buildOfflineProgressTable(offlineStatsContainerDiv);
  b = createElement("div", b, null, "offlineCancelButtonContainer");
  offlineProgressView.cancelButton = createElement("div", b, null, "offlineCancelButton");
  offlineProgressView.cancelButton.innerHTML = "跳过这个.我只是想杀杀怪物.";
  offlineProgressView.cancelButton.onclick = function () {
    game.finishOfflineProgress();
  };
}
export function initializeViewsResults() {
  GameOverView.prototype = new TabView();
  GameOverView.prototype.onGameWon = function () {
    this.tabState.enabled = true;
    this.tabState.selected = true;
  };
  GameOverView.prototype.onOfflineFinish = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  GameOverView.prototype.onOfflineStart = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  GameOverView.prototype.reset = function () {
    this.tabState.enabled = false;
    this.tabState.enabled = false;
    clearElementById(this.elementId);
    this.gameOverMounted = false;
  };
  GameOverView.prototype.update = function () {
    if (!this.gameOverMounted) {
      mountGameOver(this);
      this.gameOverMounted = true;
    }
  };
  OfflineProgressView.prototype = new TabView();
  OfflineProgressView.prototype.onGameWon = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  OfflineProgressView.prototype.onOfflineStart = function () {
    var tabState = this.tabState;
    tabState.enabled = true;
    tabState.selected = true;
    this.cachedFillWidth = -1;
    var runStatistics = game.state.runStatistics;
    this.directKillsBaseline = runStatistics.directKills;
    this.itemsFoundBaseline = runStatistics.itemsFound;
    this.itemsSoldBaseline = runStatistics.itemsSold;
    this.levelsClearedBaseline = runStatistics.levelsCleared;
    this.dungeonsClearedBaseline = runStatistics.dungeonsCleared;
    this.attackableCastlesBaseline = game.castles.attackableCastles.length;
    this.stunnedCountBaseline = runStatistics.characterStunnedCount;
    this.achievementsBaseline = game.state.achievements.claimQueue.length;
    this.cachedAchievementsDelta = this.cachedStunnedCountDelta = this.cachedAttackableCastlesDelta = this.cachedDungeonsClearedDelta = this.cachedLevelsClearedDelta = this.cachedItemsSoldDelta = this.cachedItemsFoundDelta = this.cachedDirectKillsDelta = -1;
  };
  OfflineProgressView.prototype.onOfflineFinish = function () {
    var tabState = this.tabState;
    tabState.enabled = false;
    tabState.selected = false;
    if (this.cancelButton) {
      clearElementById(this.elementId);
      this.achievementsDeltaCell = this.stunnedCountDeltaCell = this.attackableCastlesDeltaCell = this.dungeonsClearedDeltaCell = this.levelsClearedDeltaCell = this.itemsSoldDeltaCell = this.itemsFoundDeltaCell = this.directKillsDeltaCell = this.progressFillElement = this.cancelButton = null;
    }
  };
  OfflineProgressView.prototype.reset = function () {
    this.tabState.enabled = false;
  };
  OfflineProgressView.prototype.update = function () {
    if (!this.cancelButton) {
      mountOfflineProgress(this);
    }
    var a = Math.min(1, game.offlineProcessed / game.offlineDuration),
      a = this.progressBarWidth * a;
    if (this.cachedFillWidth != a) {
      this.cachedFillWidth = a;
      this.progressFillElement.style.width = a + "px";
    }
    var b = game.state.runStatistics,
      a = b.directKills - this.directKillsBaseline,
      itemsFoundDelta = b.itemsFound - this.itemsFoundBaseline,
      itemsSoldDelta = b.itemsSold - this.itemsSoldBaseline,
      levelsClearedDelta = b.levelsCleared - this.levelsClearedBaseline,
      dungeonsClearedDelta = b.dungeonsCleared - this.dungeonsClearedBaseline,
      attackableCastlesDelta = game.castles.attackableCastles.length - this.attackableCastlesBaseline,
      b = /** @type {any} */ (b.characterStunnedCount - this.stunnedCountBaseline),
      achievementsDelta = game.state.achievements.claimQueue.length - this.achievementsBaseline;
    if (this.cachedDirectKillsDelta != a) {
      this.cachedDirectKillsDelta = a;
      this.directKillsDeltaCell.innerHTML = formatAmount(a);
    }
    if (this.cachedItemsFoundDelta != itemsFoundDelta) {
      this.cachedItemsFoundDelta = itemsFoundDelta;
      this.itemsFoundDeltaCell.innerHTML = formatAmount(itemsFoundDelta);
    }
    if (this.cachedItemsSoldDelta != itemsSoldDelta) {
      this.cachedItemsSoldDelta = itemsSoldDelta;
      this.itemsSoldDeltaCell.innerHTML = formatAmount(itemsSoldDelta);
    }
    if (this.cachedLevelsClearedDelta != levelsClearedDelta) {
      this.cachedLevelsClearedDelta = levelsClearedDelta;
      this.levelsClearedDeltaCell.innerHTML = formatAmount(levelsClearedDelta);
    }
    if (this.cachedDungeonsClearedDelta != dungeonsClearedDelta) {
      this.cachedDungeonsClearedDelta = dungeonsClearedDelta;
      this.dungeonsClearedDeltaCell.innerHTML = formatAmount(dungeonsClearedDelta);
    }
    if (this.cachedAttackableCastlesDelta != attackableCastlesDelta) {
      this.cachedAttackableCastlesDelta = attackableCastlesDelta;
      this.attackableCastlesDeltaCell.innerHTML = formatAmount(attackableCastlesDelta);
    }
    if (this.cachedStunnedCountDelta != b) {
      this.cachedStunnedCountDelta = b;
      this.stunnedCountDeltaCell.innerHTML = formatAmount(b);
    }
    if (this.cachedAchievementsDelta != achievementsDelta) {
      this.cachedAchievementsDelta = achievementsDelta;
      this.achievementsDeltaCell.innerHTML = formatAmount(achievementsDelta);
    }
  };
  OfflineProgressView.prototype.buildOfflineProgressTable = function (a) {
    a = createElement("table", a, null, "centeredElement");
    var rowIndex = 0,
      self = /** @type {OfflineProgressViewWithCells} */ (/** @type {unknown} */ (this));
    this.directKillsDeltaCell = self.getOfflineProgressCell(a, "杀死怪物", rowIndex++);
    this.itemsFoundDeltaCell = self.getOfflineProgressCell(a, "找到道具", rowIndex++);
    this.itemsSoldDeltaCell = self.getOfflineProgressCell(a, "卖出道具", rowIndex++);
    this.levelsClearedDeltaCell = self.getOfflineProgressCell(a, "清理关卡", rowIndex++);
    this.dungeonsClearedDeltaCell = self.getOfflineProgressCell(a, "清理地牢", rowIndex++);
    this.attackableCastlesDeltaCell = self.getOfflineProgressCell(a, "攻击城堡", rowIndex++);
    this.stunnedCountDeltaCell = self.getOfflineProgressCell(a, "昏迷次数", rowIndex++);
    this.achievementsDeltaCell = self.getOfflineProgressCell(a, "成就", rowIndex);
  };
  OfflineProgressView.prototype.getOfflineProgressCell = function (a, label, rowIndex) {
    a = a.insertRow(rowIndex);
    var labelCell = a.insertCell(0);
    labelCell.className = "statisticsTableLabel";
    labelCell.innerHTML = label;
    var valueCell = a.insertCell(1);
    valueCell.style.textAlign = "right";
    valueCell.style.width = "70px";
    return valueCell;
  };
  OfflineProgressView.prototype.formatHoursMinutesSeconds = function (hours, minutes, seconds) {
    return (10 > hours ? "0" : "") + hours + ":" + (10 > minutes ? "0" : "") + minutes + ":" + (10 > seconds ? "0" : "") + seconds;
  };
}
