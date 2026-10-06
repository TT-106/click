import { spriteBackground } from '../rendering/preview.js';
/** 胜利、继承与离线收益面板。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { TabView } from "./navigation.js";
import { clearElement, clearElementById, createElement, getElement } from "./dom.js";
import { MAX_PRESTIGE_INVENTORY_BONUS } from "../content/balance.js";
import { floorNumber, formatAmount, randomInt, recordGameEvent } from "../core/math.js";
import { adventurerClasses } from "../content/classes.js";
import { monsterSpriteDefinitions } from "../core/bootstrap-data.js";
/**
 * `buildOfflineProgressTable` 与 `getOfflineProgressCell` 都在 `initializeViewsResults()` 里后挂到原型上，
 * tsc 在函数边界外看不到它们，此前用 `@type {any}` 绕过（8 处）。用交叉类型把方法显式声明出来，
 * 既去掉 `any`，也让参数/返回值的误用能被 tsc 抓到（DOM 类型来自 tsconfig 的 `lib: ["ES2022","DOM"]`）。
 * @typedef {OfflineProgressView & { getOfflineProgressCell: (table: HTMLTableElement, label: string, rowIndex: number) => HTMLTableCellElement }} OfflineProgressViewWithCells
 */
/**
 * 胜利/离线面板所需的运行时依赖。全部为取现值函数（调用时才读取运行时全局状态），
 * 因为运行统计、城堡列表、存档对象都可能被整体替换。
 * @typedef {Object} ResultsDeps
 * @property {() => number} readVictoryCount
 * @property {() => void} clearGameWon
 * @property {() => void} restartRun
 * @property {() => void} continueRun
 * @property {(monsterName: string) => any} getMonsterSprite
 * @property {() => number} readOfflineDuration
 * @property {() => number} readOfflineProcessed
 * @property {() => import('../progression/statistics.js').RunStatistics} readRunStatistics
 * @property {() => number} readAttackableCastleCount
 * @property {() => number} readAchievementClaimQueueLength
 * @property {() => void} finishOfflineProgress
 */
var resultsDepsFields = ["readVictoryCount", "clearGameWon", "restartRun", "continueRun", "getMonsterSprite", "readOfflineDuration", "readOfflineProcessed", "readRunStatistics", "readAttackableCastleCount", "readAchievementClaimQueueLength", "finishOfflineProgress"];
/** @param {ResultsDeps} deps */
function assertResultsDeps(deps) {
  if (!deps) {
    throw new Error("results.js: 缺少依赖对象");
  }
  for (var fieldIndex = 0; fieldIndex < resultsDepsFields.length; fieldIndex++) {
    if (typeof deps[resultsDepsFields[fieldIndex]] !== "function") {
      throw new Error("results.js: 缺少依赖 " + resultsDepsFields[fieldIndex]);
    }
  }
}
/** @param {import('./navigation.js').TabState} tabState @param {ResultsDeps} deps */
export function GameOverView(tabState, deps) {
  assertResultsDeps(deps);
  this.deps = deps;
  this.elementId = "gameOverTabContent";
  this.tabState = tabState;
  this.gameOverMounted = false;
}
export function mountGameOver(gameOverView) {
  clearElementById(gameOverView.elementId);
  var tabElement = getElement(gameOverView.elementId);
  mountVictoryDecoration(tabElement, gameOverView.deps);
  var contentsDiv = createElement("div", tabElement, null, "gameOverContentsDiv");
  createElement("div", contentsDiv, null, "gameOverHeading").innerHTML = "末日危机2胜利!";
  var victoryBlurbDiv = createElement("div", contentsDiv, null, "gameOverBlurb");
  createElement("p", victoryBlurbDiv, null, null).innerHTML = "你征服了每一座城堡,并将冰冻的世界变为绿色的国度.";
  createElement("p", victoryBlurbDiv, null, null).innerHTML = "末日大陆上的人民终于从怪物的蹂躏下解放出来,不再需要战战兢兢的度日!";
  createElement("p", victoryBlurbDiv, null, null).innerHTML = "你可以重新选择队友开始新的一轮征程,也可以用当前的队伍继续.";
  createElement("p", victoryBlurbDiv, null, null).innerHTML = "重新开始征程你将获得以下加成:";
  var victoryCount = gameOverView.deps.readVictoryCount(),
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
  var restartButtonDiv = createElement("div", contentsDiv, null, "gameOverBlurb");
  restartButtonDiv = createElement("div", restartButtonDiv, null, "upgradeButton");
  restartButtonDiv.style.padding = "15px";
  restartButtonDiv.style.textAlign = "center";
  restartButtonDiv.innerHTML = "重生 - 以1级的队伍重新开始游戏.";
  restartButtonDiv.onclick = function () {
    gameOverView.deps.clearGameWon();
    recordGameEvent("Victory", "Decision: Prestige");
    gameOverView.deps.restartRun();
  };
  var continueBlurbDiv = createElement("div", contentsDiv, null, "gameOverBlurb");
  var continueButtonDiv = createElement("div", continueBlurbDiv, null, "upgradeButton");
  continueButtonDiv.style.padding = "15px";
  continueButtonDiv.style.textAlign = "center";
  continueButtonDiv.innerHTML = "继续 - 用你当前的队伍征服新的城堡.";
  continueButtonDiv.onclick = function () {
    gameOverView.deps.continueRun();
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
/** @param {HTMLElement} parentElement @param {ResultsDeps} deps */
export function mountVictoryDecoration(parentElement, deps) {
  var firstTopPortraitRow = createElement("table", parentElement, null, "gameOverTableTopRow").insertRow(0),
    firstTopCellIndex;
  for (firstTopCellIndex = 0; 19 > firstTopCellIndex; firstTopCellIndex++) {
    appendRandomMonsterPortrait(firstTopPortraitRow.insertCell(firstTopCellIndex), deps);
  }
  var secondTopPortraitTable = createElement("table", parentElement, null, "gameOverTableTopRow");
  secondTopPortraitTable.style.top = "41px";
  var secondTopPortraitRow = secondTopPortraitTable.insertRow(0);
  for (var secondTopCellIndex = 0; 19 > secondTopCellIndex; secondTopCellIndex++) {
    appendRandomMonsterPortrait(secondTopPortraitRow.insertCell(secondTopCellIndex), deps);
  }
  var firstBottomPortraitTable = createElement("table", parentElement, null, "gameOverTableBottomRow");
  firstBottomPortraitTable.style.bottom = "41px";
  var firstBottomPortraitRow = firstBottomPortraitTable.insertRow(0);
  for (var firstBottomCellIndex = 0; 19 > firstBottomCellIndex; firstBottomCellIndex++) {
    appendRandomMonsterPortrait(firstBottomPortraitRow.insertCell(firstBottomCellIndex), deps);
  }
  var bottomPortraitRow = createElement("table", parentElement, null, "gameOverTableBottomRow").insertRow(0);
  for (var secondBottomCellIndex = 0; 19 > secondBottomCellIndex; secondBottomCellIndex++) {
    appendRandomMonsterPortrait(bottomPortraitRow.insertCell(secondBottomCellIndex), deps);
  }
}
/** @param {HTMLTableCellElement} portraitCell @param {ResultsDeps} deps */
export function appendRandomMonsterPortrait(portraitCell, deps) {
  var monsterDefinition = monsterSpriteDefinitions[randomInt(monsterSpriteDefinitions.length)],
    monsterSprite = deps.getMonsterSprite(monsterDefinition.name);
  var portraitImage = createElement("img", portraitCell, null, "characterImage");
  portraitImage.src = "images/Transparent.gif";
  portraitImage.style.background = spriteBackground(monsterSprite, 'monster');
  portraitImage.style.height = "30px";
  portraitImage.style.width = "52px";
}
/** @param {import('./navigation.js').TabState} tabState @param {ResultsDeps} deps */
export function OfflineProgressView(tabState, deps) {
  assertResultsDeps(deps);
  this.deps = deps;
  this.elementId = "offlineTabContent";
  this.tabState = tabState;
  this.cancelButton = this.progressFillElement = null;
  this.progressBarWidth = 500;
  this.cachedFillWidth = -1;
  this.achievementsDeltaCell = this.stunnedCountDeltaCell = this.attackableCastlesDeltaCell = this.dungeonsClearedDeltaCell = this.levelsClearedDeltaCell = this.itemsSoldDeltaCell = this.itemsFoundDeltaCell = this.directKillsDeltaCell = null;
  this.cachedAchievementsDelta = this.cachedStunnedCountDelta = this.cachedAttackableCastlesDelta = this.cachedDungeonsClearedDelta = this.cachedLevelsClearedDelta = this.cachedItemsSoldDelta = this.cachedItemsFoundDelta = this.cachedDirectKillsDelta = this.achievementsBaseline = this.stunnedCountBaseline = this.attackableCastlesBaseline = this.dungeonsClearedBaseline = this.levelsClearedBaseline = this.itemsSoldBaseline = this.itemsFoundBaseline = this.directKillsBaseline = -1;
}
export function mountOfflineProgress(offlineProgressView) {
  var offlineTabElement = getElement(offlineProgressView.elementId);
  clearElement(offlineTabElement);
  var offlineHeaderDiv = createElement("div", offlineTabElement, null, "offlineHeader"),
    formattedOfflineDuration = offlineProgressView.formatHoursMinutesSeconds(floorNumber(offlineProgressView.deps.readOfflineDuration() / 36E5), floorNumber(offlineProgressView.deps.readOfflineDuration() / 6E4 % 60), floorNumber(offlineProgressView.deps.readOfflineDuration() / 1E3 % 60));
  createElement("div", offlineHeaderDiv, null, "offlineTitleText").innerHTML = "末日危机2";
  createElement("div", offlineHeaderDiv, null, "offlineSubHeader").innerHTML = "离线:" + formattedOfflineDuration;
  createElement("div", offlineHeaderDiv, null, "offlineSubHeader").innerHTML = "正在清算你离开时发生了什么...";
  var offlineProgressBarDiv = createElement("div", offlineTabElement, null, "offlineProgressBarContainer");
  offlineProgressBarDiv = createElement("div", offlineProgressBarDiv, null, "offlineProgressBar");
  offlineProgressView.progressFillElement = createElement("div", offlineProgressBarDiv, null, "offlineProgressSlider");
  var offlineStatsContainerDiv = createElement("div", offlineTabElement, null, "offlineProgressStatsContainer");
  offlineProgressView.buildOfflineProgressTable(offlineStatsContainerDiv);
  var cancelButtonContainer = createElement("div", offlineTabElement, null, "offlineCancelButtonContainer");
  offlineProgressView.cancelButton = createElement("div", cancelButtonContainer, null, "offlineCancelButton");
  offlineProgressView.cancelButton.innerHTML = "跳过这个.我只是想杀杀怪物.";
  offlineProgressView.cancelButton.onclick = function () {
    offlineProgressView.deps.finishOfflineProgress();
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
    var runStatistics = this.deps.readRunStatistics();
    this.directKillsBaseline = runStatistics.directKills;
    this.itemsFoundBaseline = runStatistics.itemsFound;
    this.itemsSoldBaseline = runStatistics.itemsSold;
    this.levelsClearedBaseline = runStatistics.levelsCleared;
    this.dungeonsClearedBaseline = runStatistics.dungeonsCleared;
    this.attackableCastlesBaseline = this.deps.readAttackableCastleCount();
    this.stunnedCountBaseline = runStatistics.characterStunnedCount;
    this.achievementsBaseline = this.deps.readAchievementClaimQueueLength();
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
    var progressFraction = Math.min(1, this.deps.readOfflineProcessed() / this.deps.readOfflineDuration()),
      progressFillWidth = this.progressBarWidth * progressFraction;
    if (this.cachedFillWidth != progressFillWidth) {
      this.cachedFillWidth = progressFillWidth;
      this.progressFillElement.style.width = progressFillWidth + "px";
    }
    var runStatistics = this.deps.readRunStatistics(),
      directKillsDelta = runStatistics.directKills - this.directKillsBaseline,
      itemsFoundDelta = runStatistics.itemsFound - this.itemsFoundBaseline,
      itemsSoldDelta = runStatistics.itemsSold - this.itemsSoldBaseline,
      levelsClearedDelta = runStatistics.levelsCleared - this.levelsClearedBaseline,
      dungeonsClearedDelta = runStatistics.dungeonsCleared - this.dungeonsClearedBaseline,
      attackableCastlesDelta = this.deps.readAttackableCastleCount() - this.attackableCastlesBaseline,
      stunnedCountDelta = /** @type {any} */ (runStatistics.characterStunnedCount - this.stunnedCountBaseline),
      achievementsDelta = this.deps.readAchievementClaimQueueLength() - this.achievementsBaseline;
    if (this.cachedDirectKillsDelta != directKillsDelta) {
      this.cachedDirectKillsDelta = directKillsDelta;
      this.directKillsDeltaCell.innerHTML = formatAmount(directKillsDelta);
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
    if (this.cachedStunnedCountDelta != stunnedCountDelta) {
      this.cachedStunnedCountDelta = stunnedCountDelta;
      this.stunnedCountDeltaCell.innerHTML = formatAmount(stunnedCountDelta);
    }
    if (this.cachedAchievementsDelta != achievementsDelta) {
      this.cachedAchievementsDelta = achievementsDelta;
      this.achievementsDeltaCell.innerHTML = formatAmount(achievementsDelta);
    }
  };
  OfflineProgressView.prototype.buildOfflineProgressTable = function (statsContainer) {
    var progressTable = createElement("table", statsContainer, null, "centeredElement");
    var rowIndex = 0,
      self = /** @type {OfflineProgressViewWithCells} */ (/** @type {unknown} */ (this));
    this.directKillsDeltaCell = self.getOfflineProgressCell(progressTable, "杀死怪物", rowIndex++);
    this.itemsFoundDeltaCell = self.getOfflineProgressCell(progressTable, "找到道具", rowIndex++);
    this.itemsSoldDeltaCell = self.getOfflineProgressCell(progressTable, "卖出道具", rowIndex++);
    this.levelsClearedDeltaCell = self.getOfflineProgressCell(progressTable, "清理关卡", rowIndex++);
    this.dungeonsClearedDeltaCell = self.getOfflineProgressCell(progressTable, "清理地牢", rowIndex++);
    this.attackableCastlesDeltaCell = self.getOfflineProgressCell(progressTable, "攻击城堡", rowIndex++);
    this.stunnedCountDeltaCell = self.getOfflineProgressCell(progressTable, "昏迷次数", rowIndex++);
    this.achievementsDeltaCell = self.getOfflineProgressCell(progressTable, "成就", rowIndex);
  };
  OfflineProgressView.prototype.getOfflineProgressCell = function (progressTable, label, rowIndex) {
    var progressRow = progressTable.insertRow(rowIndex);
    var labelCell = progressRow.insertCell(0);
    labelCell.className = "statisticsTableLabel";
    labelCell.innerHTML = label;
    var valueCell = progressRow.insertCell(1);
    valueCell.style.textAlign = "right";
    valueCell.style.width = "70px";
    return valueCell;
  };
  OfflineProgressView.prototype.formatHoursMinutesSeconds = function (hours, minutes, seconds) {
    return (10 > hours ? "0" : "") + hours + ":" + (10 > minutes ? "0" : "") + minutes + ":" + (10 > seconds ? "0" : "") + seconds;
  };
}
