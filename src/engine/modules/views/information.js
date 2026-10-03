/** 原版存档控件、统计和说明。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { appendHeaderCell, clearElementById, createElement, getElement, hideElementById, setElementHtml, showElementById } from "./dom.js";
import { View, addChildView, resetChildViews } from "./base.js";
import { TabView } from "./navigation.js";
import { floorNumber, formatAmount } from "../core/math.js";
/** @typedef {Object} SaveControlActions
 * @property {() => void} saveNow
 * @property {() => void} restartRun
 * @property {() => void} resetGame
 * @property {() => string} exportSave
 * @property {(saveText: string) => boolean} importSave
 *
 * @typedef {Object} StatisticsSnapshot
 * @property {import('../progression/statistics.js').RunStatistics} runStatistics
 * @property {import('../progression/statistics.js').RunStatistics} lifetimeStatistics 累计统计继承同一组运行统计字段。
 * @property {number} victoryCount
 *
 * @typedef {Object} GameOptions
 * @property {boolean} showCombatText
 * @property {boolean} showSpellEffects
 * @property {boolean} showMapOverlay
 * @property {boolean} allowOfflineProgress
 * @property {boolean} allowBackgroundProgress
 * @property {boolean} depthSortSprites
 * @property {boolean} showFps
 *
 * @typedef {Object} InformationInputs
 * @property {SaveControlActions} saveActions
 * @property {() => number} readLastSavedAt
 * @property {() => StatisticsSnapshot} readStatistics
 * @property {() => number} readCastleCount
 * @property {GameOptions} options
 */
/** @param {SaveControlActions} actions @param {() => number} readLastSavedAt */
export function SaveControlsView(actions, readLastSavedAt) {
  this.readLastSavedAt = readLastSavedAt;
  this.elementId = "infoTabSaveLoadContainer";
  this.visible = true;
  this.lastSaveDivElementId = "lastSaveDiv";
  this.cachedLastSavedAt = -1;
  getElement("saveButton").onclick = function () {
    actions.saveNow();
    return false;
  };
  getElement("firstResetButton").onclick = function () {
    showElementById("resetConfirmContainer");
    hideElementById("firstResetButtonContainer");
    return false;
  };
  getElement("realResetButton").onclick = function () {
    actions.restartRun();
    hideElementById("resetConfirmContainer");
    showElementById("firstResetButtonContainer");
    return false;
  };
  getElement("cancelResetButton").onclick = function () {
    hideElementById("resetConfirmContainer");
    showElementById("firstResetButtonContainer");
    return false;
  };
  getElement("firstDeleteButton").onclick = function () {
    showElementById("deleteSaveConfirmContainer");
    hideElementById("firstDeleteSaveButtonContainer");
    return false;
  };
  getElement("realDeleteButton").onclick = function () {
    actions.resetGame();
    hideElementById("deleteSaveConfirmContainer");
    showElementById("firstDeleteSaveButtonContainer");
    return false;
  };
  getElement("cancelDeleteButton").onclick = function () {
    hideElementById("deleteSaveConfirmContainer");
    showElementById("firstDeleteSaveButtonContainer");
    return false;
  };
  getElement("exportSaveButton").onclick = function () {
    var exportSaveInput = /** @type {HTMLInputElement} */ (getElement("exportSaveInput"));
    exportSaveInput.value = actions.exportSave();
    showElementById("exportSaveContainer");
    hideElementById("exportSaveButton");
    exportSaveInput.select();
    return false;
  };
  getElement("cancelExportButton").onclick = function () {
    hideElementById("exportSaveContainer");
    showElementById("exportSaveButton");
    /** @type {HTMLInputElement} */ (getElement("exportSaveInput")).value = "";
    return false;
  };
  getElement("importSaveButton").onclick = function () {
    hideElementById("importErrorMessage");
    hideElementById("importSuccessMessage");
    /** @type {HTMLInputElement} */ (getElement("importSaveInput")).value = "";
    showElementById("importSaveContainer");
    hideElementById("importSaveButton");
    return false;
  };
  getElement("importOkButton").onclick = function () {
    if (actions.importSave(/** @type {HTMLInputElement} */ (getElement("importSaveInput")).value)) {
      hideElementById("importErrorMessage");
      showElementById("importSuccessMessage");
    } else {
      showElementById("importErrorMessage");
      hideElementById("importSuccessMessage");
    }
    return false;
  };
  getElement("importCloseButton").onclick = function () {
    hideElementById("importErrorMessage");
    hideElementById("importSuccessMessage");
    /** @type {HTMLInputElement} */ (getElement("importSaveInput")).value = "";
    hideElementById("importSaveContainer");
    showElementById("importSaveButton");
    return false;
  };
}
/** @param {InformationInputs} inputs */
export function InformationView(tabState, inputs) {
  this.elementId = "infoTabContent";
  this.tabState = tabState;
  addChildView(this, new SaveControlsView(inputs.saveActions, inputs.readLastSavedAt));
  addChildView(this, new StatisticsView(inputs.readStatistics, inputs.readCastleCount));
  addChildView(this, new OptionsView(inputs.options));
}
/** StatisticsView.prototype 在初始化里被 new View() 替换，后挂成员对 TS 不可见；用 this 类型标注这几个方法。
 * @typedef {Object} MountedStatisticsViewMethods
 * @property {function(): void} buildStatisticsTable 重建统计表 DOM。
 * @property {function(number, number, number): string} formatHoursMinutesSeconds 拼时、分、秒。
 * @property {function(number): void} createHeaderRow 在表尾插入一行表头。
 * @property {function(HTMLTableRowElement, number): HTMLTableCellElement} getStatisticCell 取指定行的单元格。
 */
/** @param {() => StatisticsSnapshot} readStatistics @param {() => number} readCastleCount */
export function StatisticsView(readStatistics, readCastleCount) {
  this.readStatistics = readStatistics;
  this.readCastleCount = readCastleCount;
  this.elementId = "statisticsContainer";
  this.visible = true;
  this.tableElement = null;
  this.cachedLifetimeAncientItemsFound = this.cachedRunAncientItemsFound = this.cachedLifetimeHistoricItemsFound = this.cachedRunHistoricItemsFound = this.cachedLifetimeRareItemsFound = this.cachedRunRareItemsFound = this.cachedLifetimeUncommonItemsFound = this.cachedRunUncommonItemsFound = this.cachedLifetimeItemsFound = this.cachedRunItemsFound = this.cachedLifetimeItemsSold = this.cachedRunItemsSold = this.cachedLifetimeScrollsUsed = this.cachedRunScrollsUsed = this.cachedLifetimePotionsUsed = this.cachedRunPotionsUsed = this.cachedLifetimeSpellCasts = this.cachedRunSpellCasts = this.cachedLifetimeRangedAttacks = this.cachedRunRangedAttacks = this.cachedLifetimeMeleeAttacks = this.cachedRunMeleeAttacks = this.cachedLifetimeStunnedCount = this.cachedRunStunnedCount = this.cachedLifetimeFarmedKills = this.cachedRunFarmedKills = this.cachedLifetimeMinionKills = this.cachedRunMinionKills = this.cachedLifetimeScrollKills = this.cachedRunScrollKills = this.cachedLifetimeDirectKills = this.cachedRunDirectKills = this.cachedLifetimeGoldFromItems = this.cachedRunGoldFromItems = this.cachedLifetimeGoldFromMonsters = this.cachedRunGoldFromMonsters = this.cachedLifetimeBookcasesLooted = this.cachedRunBookcasesLooted = this.cachedLifetimeWeaponRacksLooted = this.cachedRunWeaponRacksLooted = this.cachedLifetimeTreasureChestsLooted = this.cachedRunTreasureChestsLooted = this.cachedLifetimeMinionsSummoned = this.cachedRunMinionsSummoned = this.cachedLifetimeFarmsPurchased = this.cachedRunFarmsPurchased = this.cachedLifetimeCastlesConquered = this.cachedRunCastlesConquered = this.cachedLifetimeDungeonsCleared = this.cachedRunDungeonsCleared = this.cachedLifetimeLevelsCleared = this.cachedRunLevelsCleared = this.cachedLifetimeRoomsCleared = this.cachedRunRoomsCleared = this.cachedLifetimeDoorsOpened = this.cachedRunDoorsOpened = this.cachedLifetimeTurnCount = this.cachedRunTurnCount = this.cachedLifetimePlaySeconds = this.cachedLifetimePlayMinutes = this.cachedLifetimePlayHours = this.cachedRunPlaySeconds = this.cachedRunPlayMinutes = this.cachedRunPlayHours = this.cachedVictoryCount = -1;
  this.lifetimeAncientItemsFoundCell = this.runAncientItemsFoundCell = this.lifetimeHistoricItemsFoundCell = this.runHistoricItemsFoundCell = this.lifetimeRareItemsFoundCell = this.runRareItemsFoundCell = this.lifetimeUncommonItemsFoundCell = this.runUncommonItemsFoundCell = this.lifetimeItemsFoundCell = this.runItemsFoundCell = this.lifetimeItemsSoldCell = this.runItemsSoldCell = this.lifetimeScrollsUsedCell = this.runScrollsUsedCell = this.lifetimePotionsUsedCell = this.runPotionsUsedCell = this.lifetimeSpellCastsCell = this.runSpellCastsCell = this.lifetimeRangedAttacksCell = this.runRangedAttacksCell = this.lifetimeMeleeAttacksCell = this.runMeleeAttacksCell = this.lifetimeStunnedCountCell = this.runStunnedCountCell = this.lifetimeFarmedKillsCell = this.runFarmedKillsCell = this.lifetimeMinionKillsCell = this.runMinionKillsCell = this.lifetimeScrollKillsCell = this.runScrollKillsCell = this.lifetimeDirectKillsCell = this.runDirectKillsCell = this.lifetimeGoldFromItemsCell = this.runGoldFromItemsCell = this.lifetimeGoldFromMonstersCell = this.runGoldFromMonstersCell = this.lifetimeBookcasesLootedCell = this.runBookcasesLootedCell = this.lifetimeWeaponRacksLootedCell = this.runWeaponRacksLootedCell = this.lifetimeTreasureChestsLootedCell = this.runTreasureChestsLootedCell = this.lifetimeMinionsSummonedCell = this.runMinionsSummonedCell = this.lifetimeFarmsPurchasedCell = this.runFarmsPurchasedCell = this.lifetimeCastlesConqueredCell = this.runCastlesConqueredCell = this.lifetimeDungeonsClearedCell = this.runDungeonsClearedCell = this.lifetimeLevelsClearedCell = this.runLevelsClearedCell = this.lifetimeDoorsOpenedCell = this.runDoorsOpenedCell = this.lifetimeRoomsClearedCell = this.runRoomsClearedCell = this.lifetimeTurnCountCell = this.runTurnCountCell = this.runPlayTimeCell = this.lifetimePlayTimeCell = this.victoryCountCell = null;
  this.millisecondsPerHour = 36E5;
}
export function appendStatisticsRow(statisticsView, label, rowIndex) {
  var statisticsRow = statisticsView.tableElement.insertRow(rowIndex);
  var labelCell = statisticsRow.insertCell(0);
  labelCell.className = "statisticsTableLabel";
  labelCell.innerHTML = label;
  return statisticsRow;
}
/** @param {GameOptions} options */
export function OptionsView(options) {
  this.options = options;
  this.elementId = "gameOptionsContainer";
  this.visible = true;
  this.hasBoundOptionListeners = false;
}
export function initializeViewsInformation() {
  SaveControlsView.prototype = new View();
  SaveControlsView.prototype.reset = function () {
    this.cachedLastSavedAt = -1;
  };
  SaveControlsView.prototype.update = function () {
    var lastSavedAt;
    lastSavedAt = this.readLastSavedAt();
    if (this.cachedLastSavedAt !== lastSavedAt && 0 < lastSavedAt) {
      this.cachedLastSavedAt = lastSavedAt;
      setElementHtml(this.lastSaveDivElementId, "最后保存于: " + new Date(this.cachedLastSavedAt).toLocaleTimeString());
    }
  };
  InformationView.prototype = new TabView();
  InformationView.prototype.onGameWon = function () {
    this.tabState.selected = false;
    this.tabState.enabled = true;
  };
  InformationView.prototype.onOfflineFinish = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
  };
  InformationView.prototype.onOfflineStart = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  InformationView.prototype.reset = function () {
    this.tabState.enabled = true;
    this.tabState.selected = false;
    resetChildViews(this);
  };
  StatisticsView.prototype = new View();
  StatisticsView.prototype.reset = /** @this {StatisticsView & MountedStatisticsViewMethods} */ function () {
    this.cachedLifetimeAncientItemsFound = this.cachedRunAncientItemsFound = this.cachedLifetimeHistoricItemsFound = this.cachedRunHistoricItemsFound = this.cachedLifetimeRareItemsFound = this.cachedRunRareItemsFound = this.cachedLifetimeUncommonItemsFound = this.cachedRunUncommonItemsFound = this.cachedLifetimeItemsFound = this.cachedRunItemsFound = this.cachedLifetimeItemsSold = this.cachedRunItemsSold = this.cachedLifetimeScrollsUsed = this.cachedRunScrollsUsed = this.cachedLifetimePotionsUsed = this.cachedRunPotionsUsed = this.cachedLifetimeSpellCasts = this.cachedRunSpellCasts = this.cachedLifetimeRangedAttacks = this.cachedRunRangedAttacks = this.cachedLifetimeMeleeAttacks = this.cachedRunMeleeAttacks = this.cachedLifetimeStunnedCount = this.cachedRunStunnedCount = this.cachedLifetimeFarmedKills = this.cachedRunFarmedKills = this.cachedLifetimeMinionKills = this.cachedRunMinionKills = this.cachedLifetimeScrollKills = this.cachedRunScrollKills = this.cachedLifetimeDirectKills = this.cachedRunDirectKills = this.cachedLifetimeGoldFromItems = this.cachedRunGoldFromItems = this.cachedLifetimeGoldFromMonsters = this.cachedRunGoldFromMonsters = this.cachedLifetimeBookcasesLooted = this.cachedRunBookcasesLooted = this.cachedLifetimeWeaponRacksLooted = this.cachedRunWeaponRacksLooted = this.cachedLifetimeTreasureChestsLooted = this.cachedRunTreasureChestsLooted = this.cachedLifetimeMinionsSummoned = this.cachedRunMinionsSummoned = this.cachedLifetimeFarmsPurchased = this.cachedRunFarmsPurchased = this.cachedLifetimeCastlesConquered = this.cachedRunCastlesConquered = this.cachedLifetimeDungeonsCleared = this.cachedRunDungeonsCleared = this.cachedLifetimeLevelsCleared = this.cachedRunLevelsCleared = this.cachedLifetimeDoorsOpened = this.cachedRunDoorsOpened = this.cachedLifetimeRoomsCleared = this.cachedRunRoomsCleared = this.cachedLifetimeTurnCount = this.cachedRunTurnCount = this.cachedLifetimePlaySeconds = this.cachedLifetimePlayMinutes = this.cachedLifetimePlayHours = this.cachedRunPlaySeconds = this.cachedRunPlayMinutes = this.cachedRunPlayHours = this.cachedVictoryCount = -1;
    this.buildStatisticsTable();
  };
  StatisticsView.prototype.update = /** @this {StatisticsView & MountedStatisticsViewMethods} */ function () {
    if (!this.tableElement) {
      this.buildStatisticsTable();
    }
    var statistics = this.readStatistics(),
      runStatistics = statistics.runStatistics,
      lifetimeStatistics = statistics.lifetimeStatistics,
      victoryCount = statistics.victoryCount,
      lifetimePlayedMillis = lifetimeStatistics.playedMillis,
      runPlayedMillis = runStatistics.playedMillis,
      lifetimeTurnCount = lifetimeStatistics.turnCount,
      runTurnCount = runStatistics.turnCount,
      lifetimeRoomsCleared = lifetimeStatistics.roomsCleared,
      runRoomsCleared = runStatistics.roomsCleared,
      lifetimeDoorsOpened = lifetimeStatistics.doorsOpened,
      runDoorsOpened = runStatistics.doorsOpened,
      lifetimeLevelsCleared = lifetimeStatistics.levelsCleared,
      runLevelsCleared = runStatistics.levelsCleared,
      lifetimeDungeonsCleared = lifetimeStatistics.dungeonsCleared,
      runDungeonsCleared = runStatistics.dungeonsCleared,
      lifetimeCastlesConquered = lifetimeStatistics.castlesConquered,
      runCastlesConquered = runStatistics.castlesConquered,
      lifetimeFarmsPurchased = lifetimeStatistics.farmsPurchased,
      runFarmsPurchased = runStatistics.farmsPurchased,
      lifetimeMinionsSummoned = lifetimeStatistics.minionsSummoned,
      runMinionsSummoned = runStatistics.minionsSummoned,
      lifetimeTreasureChestsLooted = lifetimeStatistics.treasureChestsLooted,
      runTreasureChestsLooted = runStatistics.treasureChestsLooted,
      lifetimeWeaponRacksLooted = lifetimeStatistics.weaponRacksLooted,
      runWeaponRacksLooted = runStatistics.weaponRacksLooted,
      lifetimeBookcasesLooted = lifetimeStatistics.bookcasesLooted,
      runBookcasesLooted = runStatistics.bookcasesLooted,
      lifetimeGoldFromMonsters = lifetimeStatistics.totalGoldFromMonsters,
      runGoldFromMonsters = runStatistics.totalGoldFromMonsters,
      lifetimeGoldFromItems = lifetimeStatistics.totalGoldFromItems,
      runGoldFromItems = runStatistics.totalGoldFromItems,
      lifetimeDirectKills = lifetimeStatistics.directKills,
      runDirectKills = runStatistics.directKills,
      lifetimeScrollKills = lifetimeStatistics.scrollKills,
      runScrollKills = runStatistics.scrollKills,
      lifetimeMinionKills = lifetimeStatistics.minionKills,
      runMinionKills = runStatistics.minionKills,
      lifetimeFarmedKills = lifetimeStatistics.farmedKills,
      runFarmedKills = runStatistics.farmedKills,
      lifetimeStunnedCount = lifetimeStatistics.characterStunnedCount,
      runStunnedCount = runStatistics.characterStunnedCount,
      lifetimeMeleeAttacks = lifetimeStatistics.meleeAttackCount,
      runMeleeAttacks = runStatistics.meleeAttackCount,
      lifetimeRangedAttacks = lifetimeStatistics.rangedAttackCount,
      runRangedAttacks = runStatistics.rangedAttackCount,
      lifetimeSpellCasts = lifetimeStatistics.spellCastCount,
      runSpellCasts = runStatistics.spellCastCount,
      lifetimePotionsUsed = lifetimeStatistics.potionsUsed,
      runPotionsUsed = runStatistics.potionsUsed,
      lifetimeScrollsUsed = lifetimeStatistics.scrollsUsed,
      runScrollsUsed = runStatistics.scrollsUsed,
      lifetimeItemsSold = lifetimeStatistics.itemsSold,
      runItemsSold = runStatistics.itemsSold,
      lifetimeItemsFound = lifetimeStatistics.itemsFound,
      runItemsFound = runStatistics.itemsFound,
      lifetimeUncommonItemsFound = lifetimeStatistics.uncommonItemsFound,
      runUncommonItemsFound = runStatistics.uncommonItemsFound,
      lifetimeRareItemsFound = lifetimeStatistics.rareItemsFound,
      runRareItemsFound = runStatistics.rareItemsFound,
      lifetimeHistoricItemsFound = lifetimeStatistics.historicItemsFound,
      runHistoricItemsFound = runStatistics.historicItemsFound,
      lifetimeAncientItemsFound = lifetimeStatistics.ancientItemsFound,
      runAncientItemsFound = runStatistics.ancientItemsFound;
    if (this.cachedVictoryCount != victoryCount) {
      this.cachedVictoryCount = victoryCount;
      this.victoryCountCell.innerHTML = formatAmount(victoryCount);
    }
    if (this.cachedRunTurnCount != runTurnCount) {
      this.cachedRunTurnCount = runTurnCount;
      this.runTurnCountCell.innerHTML = formatAmount(runTurnCount);
    }
    if (this.cachedLifetimeTurnCount != lifetimeTurnCount) {
      this.cachedLifetimeTurnCount = lifetimeTurnCount;
      this.lifetimeTurnCountCell.innerHTML = formatAmount(lifetimeTurnCount);
    }
    if (this.cachedRunRoomsCleared != runRoomsCleared) {
      this.cachedRunRoomsCleared = runRoomsCleared;
      this.runRoomsClearedCell.innerHTML = formatAmount(runRoomsCleared);
    }
    if (this.cachedLifetimeRoomsCleared != lifetimeRoomsCleared) {
      this.cachedLifetimeRoomsCleared = lifetimeRoomsCleared;
      this.lifetimeRoomsClearedCell.innerHTML = formatAmount(lifetimeRoomsCleared);
    }
    if (this.cachedRunDoorsOpened != runDoorsOpened) {
      this.cachedRunDoorsOpened = runDoorsOpened;
      this.runDoorsOpenedCell.innerHTML = formatAmount(runDoorsOpened);
    }
    if (this.cachedLifetimeDoorsOpened != lifetimeDoorsOpened) {
      this.cachedLifetimeDoorsOpened = lifetimeDoorsOpened;
      this.lifetimeDoorsOpenedCell.innerHTML = formatAmount(lifetimeDoorsOpened);
    }
    if (this.cachedRunLevelsCleared != runLevelsCleared) {
      this.cachedRunLevelsCleared = runLevelsCleared;
      this.runLevelsClearedCell.innerHTML = formatAmount(runLevelsCleared);
    }
    if (this.cachedLifetimeLevelsCleared != lifetimeLevelsCleared) {
      this.cachedLifetimeLevelsCleared = lifetimeLevelsCleared;
      this.lifetimeLevelsClearedCell.innerHTML = formatAmount(lifetimeLevelsCleared);
    }
    if (this.cachedRunDungeonsCleared != runDungeonsCleared) {
      this.cachedRunDungeonsCleared = runDungeonsCleared;
      this.runDungeonsClearedCell.innerHTML = formatAmount(runDungeonsCleared);
    }
    if (this.cachedLifetimeDungeonsCleared != lifetimeDungeonsCleared) {
      this.cachedLifetimeDungeonsCleared = lifetimeDungeonsCleared;
      this.lifetimeDungeonsClearedCell.innerHTML = formatAmount(lifetimeDungeonsCleared);
    }
    if (this.cachedRunCastlesConquered != runCastlesConquered) {
      this.cachedRunCastlesConquered = runCastlesConquered;
      this.runCastlesConqueredCell.innerHTML = formatAmount(runCastlesConquered) + "/" + this.readCastleCount();
    }
    if (this.cachedLifetimeCastlesConquered != lifetimeCastlesConquered) {
      this.cachedLifetimeCastlesConquered = lifetimeCastlesConquered;
      this.lifetimeCastlesConqueredCell.innerHTML = formatAmount(lifetimeCastlesConquered);
    }
    if (this.cachedRunFarmsPurchased != runFarmsPurchased) {
      this.cachedRunFarmsPurchased = runFarmsPurchased;
      this.runFarmsPurchasedCell.innerHTML = formatAmount(runFarmsPurchased);
    }
    if (this.cachedLifetimeFarmsPurchased != lifetimeFarmsPurchased) {
      this.cachedLifetimeFarmsPurchased = lifetimeFarmsPurchased;
      this.lifetimeFarmsPurchasedCell.innerHTML = formatAmount(lifetimeFarmsPurchased);
    }
    if (this.cachedRunMinionsSummoned != runMinionsSummoned) {
      this.cachedRunMinionsSummoned = runMinionsSummoned;
      this.runMinionsSummonedCell.innerHTML = formatAmount(runMinionsSummoned);
    }
    if (this.cachedLifetimeMinionsSummoned != lifetimeMinionsSummoned) {
      this.cachedLifetimeMinionsSummoned = lifetimeMinionsSummoned;
      this.lifetimeMinionsSummonedCell.innerHTML = formatAmount(lifetimeMinionsSummoned);
    }
    if (this.cachedRunTreasureChestsLooted != runTreasureChestsLooted) {
      this.cachedRunTreasureChestsLooted = runTreasureChestsLooted;
      this.runTreasureChestsLootedCell.innerHTML = formatAmount(runTreasureChestsLooted);
    }
    if (this.cachedLifetimeTreasureChestsLooted != lifetimeTreasureChestsLooted) {
      this.cachedLifetimeTreasureChestsLooted = lifetimeTreasureChestsLooted;
      this.lifetimeTreasureChestsLootedCell.innerHTML = formatAmount(lifetimeTreasureChestsLooted);
    }
    if (this.cachedRunWeaponRacksLooted != runWeaponRacksLooted) {
      this.cachedRunWeaponRacksLooted = runWeaponRacksLooted;
      this.runWeaponRacksLootedCell.innerHTML = formatAmount(runWeaponRacksLooted);
    }
    if (this.cachedLifetimeWeaponRacksLooted != lifetimeWeaponRacksLooted) {
      this.cachedLifetimeWeaponRacksLooted = lifetimeWeaponRacksLooted;
      this.lifetimeWeaponRacksLootedCell.innerHTML = formatAmount(lifetimeWeaponRacksLooted);
    }
    if (this.cachedRunBookcasesLooted != runBookcasesLooted) {
      this.cachedRunBookcasesLooted = runBookcasesLooted;
      this.runBookcasesLootedCell.innerHTML = formatAmount(runBookcasesLooted);
    }
    if (this.cachedLifetimeBookcasesLooted != lifetimeBookcasesLooted) {
      this.cachedLifetimeBookcasesLooted = lifetimeBookcasesLooted;
      this.lifetimeBookcasesLootedCell.innerHTML = formatAmount(lifetimeBookcasesLooted);
    }
    if (this.cachedRunGoldFromMonsters != runGoldFromMonsters) {
      this.cachedRunGoldFromMonsters = runGoldFromMonsters;
      this.runGoldFromMonstersCell.innerHTML = formatAmount(runGoldFromMonsters);
    }
    if (this.cachedLifetimeGoldFromMonsters != lifetimeGoldFromMonsters) {
      this.cachedLifetimeGoldFromMonsters = lifetimeGoldFromMonsters;
      this.lifetimeGoldFromMonstersCell.innerHTML = formatAmount(lifetimeGoldFromMonsters);
    }
    if (this.cachedRunGoldFromItems != runGoldFromItems) {
      this.cachedRunGoldFromItems = runGoldFromItems;
      this.runGoldFromItemsCell.innerHTML = formatAmount(runGoldFromItems);
    }
    if (this.cachedLifetimeGoldFromItems != lifetimeGoldFromItems) {
      this.cachedLifetimeGoldFromItems = lifetimeGoldFromItems;
      this.lifetimeGoldFromItemsCell.innerHTML = formatAmount(lifetimeGoldFromItems);
    }
    if (this.cachedRunDirectKills != runDirectKills) {
      this.cachedRunDirectKills = runDirectKills;
      this.runDirectKillsCell.innerHTML = formatAmount(runDirectKills);
    }
    if (this.cachedLifetimeDirectKills != lifetimeDirectKills) {
      this.cachedLifetimeDirectKills = lifetimeDirectKills;
      this.lifetimeDirectKillsCell.innerHTML = formatAmount(lifetimeDirectKills);
    }
    if (this.cachedRunScrollKills != runScrollKills) {
      this.cachedRunScrollKills = runScrollKills;
      this.runScrollKillsCell.innerHTML = formatAmount(runScrollKills);
    }
    if (this.cachedLifetimeScrollKills != lifetimeScrollKills) {
      this.cachedLifetimeScrollKills = lifetimeScrollKills;
      this.lifetimeScrollKillsCell.innerHTML = formatAmount(lifetimeScrollKills);
    }
    if (this.cachedRunMinionKills != runMinionKills) {
      this.cachedRunMinionKills = runMinionKills;
      this.runMinionKillsCell.innerHTML = formatAmount(runMinionKills);
    }
    if (this.cachedLifetimeMinionKills != lifetimeMinionKills) {
      this.cachedLifetimeMinionKills = lifetimeMinionKills;
      this.lifetimeMinionKillsCell.innerHTML = formatAmount(lifetimeMinionKills);
    }
    if (this.cachedRunFarmedKills != runFarmedKills) {
      this.cachedRunFarmedKills = runFarmedKills;
      this.runFarmedKillsCell.innerHTML = formatAmount(runFarmedKills);
    }
    if (this.cachedLifetimeFarmedKills != lifetimeFarmedKills) {
      this.cachedLifetimeFarmedKills = lifetimeFarmedKills;
      this.lifetimeFarmedKillsCell.innerHTML = formatAmount(lifetimeFarmedKills);
    }
    if (this.cachedRunStunnedCount != runStunnedCount) {
      this.cachedRunStunnedCount = runStunnedCount;
      this.runStunnedCountCell.innerHTML = formatAmount(runStunnedCount);
    }
    if (this.cachedLifetimeStunnedCount != lifetimeStunnedCount) {
      this.cachedLifetimeStunnedCount = lifetimeStunnedCount;
      this.lifetimeStunnedCountCell.innerHTML = formatAmount(lifetimeStunnedCount);
    }
    if (this.cachedRunMeleeAttacks != runMeleeAttacks) {
      this.cachedRunMeleeAttacks = runMeleeAttacks;
      this.runMeleeAttacksCell.innerHTML = formatAmount(runMeleeAttacks);
    }
    if (this.cachedLifetimeMeleeAttacks != lifetimeMeleeAttacks) {
      this.cachedLifetimeMeleeAttacks = lifetimeMeleeAttacks;
      this.lifetimeMeleeAttacksCell.innerHTML = formatAmount(lifetimeMeleeAttacks);
    }
    if (this.cachedRunRangedAttacks != runRangedAttacks) {
      this.cachedRunRangedAttacks = runRangedAttacks;
      this.runRangedAttacksCell.innerHTML = formatAmount(runRangedAttacks);
    }
    if (this.cachedLifetimeRangedAttacks != lifetimeRangedAttacks) {
      this.cachedLifetimeRangedAttacks = lifetimeRangedAttacks;
      this.lifetimeRangedAttacksCell.innerHTML = formatAmount(lifetimeRangedAttacks);
    }
    if (this.cachedRunSpellCasts != runSpellCasts) {
      this.cachedRunSpellCasts = runSpellCasts;
      this.runSpellCastsCell.innerHTML = formatAmount(runSpellCasts);
    }
    if (this.cachedLifetimeSpellCasts != lifetimeSpellCasts) {
      this.cachedLifetimeSpellCasts = lifetimeSpellCasts;
      this.lifetimeSpellCastsCell.innerHTML = formatAmount(lifetimeSpellCasts);
    }
    if (this.cachedRunPotionsUsed != runPotionsUsed) {
      this.cachedRunPotionsUsed = runPotionsUsed;
      this.runPotionsUsedCell.innerHTML = formatAmount(runPotionsUsed);
    }
    if (this.cachedLifetimePotionsUsed != lifetimePotionsUsed) {
      this.cachedLifetimePotionsUsed = lifetimePotionsUsed;
      this.lifetimePotionsUsedCell.innerHTML = formatAmount(lifetimePotionsUsed);
    }
    if (this.cachedRunScrollsUsed != runScrollsUsed) {
      this.cachedRunScrollsUsed = runScrollsUsed;
      this.runScrollsUsedCell.innerHTML = formatAmount(runScrollsUsed);
    }
    if (this.cachedLifetimeScrollsUsed != lifetimeScrollsUsed) {
      this.cachedLifetimeScrollsUsed = lifetimeScrollsUsed;
      this.lifetimeScrollsUsedCell.innerHTML = formatAmount(lifetimeScrollsUsed);
    }
    if (this.cachedRunItemsSold != runItemsSold) {
      this.cachedRunItemsSold = runItemsSold;
      this.runItemsSoldCell.innerHTML = formatAmount(runItemsSold);
    }
    if (this.cachedLifetimeItemsSold != lifetimeItemsSold) {
      this.cachedLifetimeItemsSold = lifetimeItemsSold;
      this.lifetimeItemsSoldCell.innerHTML = formatAmount(lifetimeItemsSold);
    }
    if (this.cachedRunItemsFound != runItemsFound) {
      this.cachedRunItemsFound = runItemsFound;
      this.runItemsFoundCell.innerHTML = formatAmount(runItemsFound);
    }
    if (this.cachedLifetimeItemsFound != lifetimeItemsFound) {
      this.cachedLifetimeItemsFound = lifetimeItemsFound;
      this.lifetimeItemsFoundCell.innerHTML = formatAmount(lifetimeItemsFound);
    }
    if (this.cachedRunUncommonItemsFound != runUncommonItemsFound) {
      this.cachedRunUncommonItemsFound = runUncommonItemsFound;
      this.runUncommonItemsFoundCell.innerHTML = formatAmount(runUncommonItemsFound);
    }
    if (this.cachedLifetimeUncommonItemsFound != lifetimeUncommonItemsFound) {
      this.cachedLifetimeUncommonItemsFound = lifetimeUncommonItemsFound;
      this.lifetimeUncommonItemsFoundCell.innerHTML = formatAmount(lifetimeUncommonItemsFound);
    }
    if (this.cachedRunRareItemsFound != runRareItemsFound) {
      this.cachedRunRareItemsFound = runRareItemsFound;
      this.runRareItemsFoundCell.innerHTML = formatAmount(runRareItemsFound);
    }
    if (this.cachedLifetimeRareItemsFound != lifetimeRareItemsFound) {
      this.cachedLifetimeRareItemsFound = lifetimeRareItemsFound;
      this.lifetimeRareItemsFoundCell.innerHTML = formatAmount(lifetimeRareItemsFound);
    }
    if (this.cachedRunHistoricItemsFound != runHistoricItemsFound) {
      this.cachedRunHistoricItemsFound = runHistoricItemsFound;
      this.runHistoricItemsFoundCell.innerHTML = formatAmount(runHistoricItemsFound);
    }
    if (this.cachedLifetimeHistoricItemsFound != lifetimeHistoricItemsFound) {
      this.cachedLifetimeHistoricItemsFound = lifetimeHistoricItemsFound;
      this.lifetimeHistoricItemsFoundCell.innerHTML = formatAmount(lifetimeHistoricItemsFound);
    }
    if (this.cachedRunAncientItemsFound != runAncientItemsFound) {
      this.cachedRunAncientItemsFound = runAncientItemsFound;
      this.runAncientItemsFoundCell.innerHTML = formatAmount(runAncientItemsFound);
    }
    if (this.cachedLifetimeAncientItemsFound != lifetimeAncientItemsFound) {
      this.cachedLifetimeAncientItemsFound = lifetimeAncientItemsFound;
      this.lifetimeAncientItemsFoundCell.innerHTML = formatAmount(lifetimeAncientItemsFound);
    }
    var lifetimePlayHours = floorNumber(lifetimePlayedMillis / this.millisecondsPerHour);
    var lifetimePlayMinutes = floorNumber(lifetimePlayedMillis / 6E4 % 60);
    var lifetimePlaySeconds = floorNumber(lifetimePlayedMillis / 1E3 % 60);
    var runPlayHours = floorNumber(runPlayedMillis / this.millisecondsPerHour);
    var runPlayMinutes = floorNumber(runPlayedMillis / 6E4 % 60);
    var runPlaySeconds = floorNumber(runPlayedMillis / 1E3 % 60);
    if (this.cachedLifetimePlayHours != lifetimePlayHours || this.cachedLifetimePlayMinutes != lifetimePlayMinutes || this.cachedLifetimePlaySeconds != lifetimePlaySeconds) {
      this.cachedLifetimePlayHours = lifetimePlayHours;
      this.cachedLifetimePlayMinutes = lifetimePlayMinutes;
      this.cachedLifetimePlaySeconds = lifetimePlaySeconds;
      this.lifetimePlayTimeCell.innerHTML = this.formatHoursMinutesSeconds(lifetimePlayHours, lifetimePlayMinutes, lifetimePlaySeconds);
    }
    if (this.cachedRunPlayHours != runPlayHours || this.cachedRunPlayMinutes != runPlayMinutes || this.cachedRunPlaySeconds != runPlaySeconds) {
      this.cachedRunPlayHours = runPlayHours;
      this.cachedRunPlayMinutes = runPlayMinutes;
      this.cachedRunPlaySeconds = runPlaySeconds;
      this.runPlayTimeCell.innerHTML = this.formatHoursMinutesSeconds(runPlayHours, runPlayMinutes, runPlaySeconds);
    }
  };
  StatisticsView.prototype.formatHoursMinutesSeconds = function (hours, minutes, seconds) {
    return (10 > hours ? "0" : "") + hours + ":" + (10 > minutes ? "0" : "") + minutes + ":" + (10 > seconds ? "0" : "") + seconds;
  };
  StatisticsView.prototype.buildStatisticsTable = /** @this {StatisticsView & MountedStatisticsViewMethods} */ function () {
    clearElementById(this.elementId);
    var container = /** @type {HTMLDivElement} */ (getElement(this.elementId));
    createElement("div", container, null, "sectionTitle").innerHTML = "统计";
    this.tableElement = createElement("table", container, null, "statisticsTable");
    var rowIndex = 0;
    this.createHeaderRow(rowIndex++);
    var row = appendStatisticsRow(this, "游戏胜利:", rowIndex++);
    this.getStatisticCell(row, 1).innerHTML = "无";
    this.victoryCountCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "游戏时间:", rowIndex++);
    this.runPlayTimeCell = this.getStatisticCell(row, 1);
    this.lifetimePlayTimeCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "游戏回合:", rowIndex++);
    this.runTurnCountCell = this.getStatisticCell(row, 1);
    this.lifetimeTurnCountCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "打开大门:", rowIndex++);
    this.runDoorsOpenedCell = this.getStatisticCell(row, 1);
    this.lifetimeDoorsOpenedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "清理房间:", rowIndex++);
    this.runRoomsClearedCell = this.getStatisticCell(row, 1);
    this.lifetimeRoomsClearedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "清理管卡:", rowIndex++);
    this.runLevelsClearedCell = this.getStatisticCell(row, 1);
    this.lifetimeLevelsClearedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "清理地牢:", rowIndex++);
    this.runDungeonsClearedCell = this.getStatisticCell(row, 1);
    this.lifetimeDungeonsClearedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "征服城堡:", rowIndex++);
    this.runCastlesConqueredCell = this.getStatisticCell(row, 1);
    this.lifetimeCastlesConqueredCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "购买农场:", rowIndex++);
    this.runFarmsPurchasedCell = this.getStatisticCell(row, 1);
    this.lifetimeFarmsPurchasedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "召唤宠物:", rowIndex++);
    this.runMinionsSummonedCell = this.getStatisticCell(row, 1);
    this.lifetimeMinionsSummonedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "财宝箱:", rowIndex++);
    this.runTreasureChestsLootedCell = this.getStatisticCell(row, 1);
    this.lifetimeTreasureChestsLootedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "武器架:", rowIndex++);
    this.runWeaponRacksLootedCell = this.getStatisticCell(row, 1);
    this.lifetimeWeaponRacksLootedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "书架:", rowIndex++);
    this.runBookcasesLootedCell = this.getStatisticCell(row, 1);
    this.lifetimeBookcasesLootedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "怪物黄金:", rowIndex++);
    this.runGoldFromMonstersCell = this.getStatisticCell(row, 1);
    this.lifetimeGoldFromMonstersCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "道具黄金:", rowIndex++);
    this.runGoldFromItemsCell = this.getStatisticCell(row, 1);
    this.lifetimeGoldFromItemsCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "直接杀死:", rowIndex++);
    this.runDirectKillsCell = this.getStatisticCell(row, 1);
    this.lifetimeDirectKillsCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "卷轴杀死:", rowIndex++);
    this.runScrollKillsCell = this.getStatisticCell(row, 1);
    this.lifetimeScrollKillsCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "宠物杀死:", rowIndex++);
    this.runMinionKillsCell = this.getStatisticCell(row, 1);
    this.lifetimeMinionKillsCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "农场杀戮:", rowIndex++);
    this.runFarmedKillsCell = this.getStatisticCell(row, 1);
    this.lifetimeFarmedKillsCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "昏迷次数:", rowIndex++);
    this.runStunnedCountCell = this.getStatisticCell(row, 1);
    this.lifetimeStunnedCountCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "近战攻击:", rowIndex++);
    this.runMeleeAttacksCell = this.getStatisticCell(row, 1);
    this.lifetimeMeleeAttacksCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "远程攻击:", rowIndex++);
    this.runRangedAttacksCell = this.getStatisticCell(row, 1);
    this.lifetimeRangedAttacksCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "施放法术:", rowIndex++);
    this.runSpellCastsCell = this.getStatisticCell(row, 1);
    this.lifetimeSpellCastsCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "使用药剂:", rowIndex++);
    this.runPotionsUsedCell = this.getStatisticCell(row, 1);
    this.lifetimePotionsUsedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "使用卷轴:", rowIndex++);
    this.runScrollsUsedCell = this.getStatisticCell(row, 1);
    this.lifetimeScrollsUsedCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "卖出道具:", rowIndex++);
    this.runItemsSoldCell = this.getStatisticCell(row, 1);
    this.lifetimeItemsSoldCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "找到道具:", rowIndex++);
    this.runItemsFoundCell = this.getStatisticCell(row, 1);
    this.lifetimeItemsFoundCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "罕见道具:", rowIndex++);
    this.runUncommonItemsFoundCell = this.getStatisticCell(row, 1);
    this.lifetimeUncommonItemsFoundCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "稀有道具:", rowIndex++);
    this.runRareItemsFoundCell = this.getStatisticCell(row, 1);
    this.lifetimeRareItemsFoundCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "历史道具:", rowIndex++);
    this.runHistoricItemsFoundCell = this.getStatisticCell(row, 1);
    this.lifetimeHistoricItemsFoundCell = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "远古道具:", rowIndex++);
    this.runAncientItemsFoundCell = this.getStatisticCell(row, 1);
    this.lifetimeAncientItemsFoundCell = this.getStatisticCell(row, 2);
  };
  StatisticsView.prototype.createHeaderRow = function (rowIndex) {
    var headerRow = this.tableElement.insertRow(rowIndex);
    appendHeaderCell(headerRow).innerHTML = "";
    var runHeaderCell = appendHeaderCell(headerRow);
    runHeaderCell.style.textAlign = "right";
    runHeaderCell.innerHTML = "当前";
    var totalHeaderCell = appendHeaderCell(headerRow);
    totalHeaderCell.style.textAlign = "right";
    totalHeaderCell.innerHTML = "总计";
  };
  StatisticsView.prototype.getStatisticCell = function (row, columnIndex) {
    var statisticCell = row.insertCell(columnIndex);
    statisticCell.style.textAlign = "right";
    statisticCell.style.width = "70px";
    return statisticCell;
  };
  OptionsView.prototype = new View();
  OptionsView.prototype.reset = function () {
    var showCombatTextCheckbox = /** @type {HTMLInputElement} */ (getElement("infoTextEnabledCheckbox")),
      showSpellEffectsCheckbox = /** @type {HTMLInputElement} */ (getElement("spellEffectsEnabledCheckbox")),
      showMapOverlayCheckbox = /** @type {HTMLInputElement} */ (getElement("mapOverlayEnabledCheckbox")),
      allowOfflineProgressCheckbox = /** @type {HTMLInputElement} */ (getElement("offlineProcessingEnabledCheckbox")),
      allowBackgroundProgressCheckbox = /** @type {HTMLInputElement} */ (getElement("inactiveTabProcessingEnabledCheckbox")),
      depthSortSpritesCheckbox = /** @type {HTMLInputElement} */ (getElement("spriteRenderOrderEnabledCheckbox")),
      showFpsCheckbox = /** @type {HTMLInputElement} */ (getElement("fpsVisibleCheckbox"));
    var options = this.options;
    showCombatTextCheckbox.checked = options.showCombatText;
    showSpellEffectsCheckbox.checked = options.showSpellEffects;
    showMapOverlayCheckbox.checked = options.showMapOverlay;
    allowOfflineProgressCheckbox.checked = options.allowOfflineProgress;
    allowBackgroundProgressCheckbox.checked = options.allowBackgroundProgress;
    depthSortSpritesCheckbox.checked = options.depthSortSprites;
    showFpsCheckbox.checked = options.showFps;
    if (!this.hasBoundOptionListeners) {
      showCombatTextCheckbox.addEventListener("change", function () {
        options.showCombatText = showCombatTextCheckbox.checked;
      });
      showSpellEffectsCheckbox.addEventListener("change", function () {
        options.showSpellEffects = showSpellEffectsCheckbox.checked;
      });
      showMapOverlayCheckbox.addEventListener("change", function () {
        options.showMapOverlay = showMapOverlayCheckbox.checked;
      });
      allowOfflineProgressCheckbox.addEventListener("change", function () {
        options.allowOfflineProgress = allowOfflineProgressCheckbox.checked;
      });
      allowBackgroundProgressCheckbox.addEventListener("change", function () {
        options.allowBackgroundProgress = allowBackgroundProgressCheckbox.checked;
      });
      depthSortSpritesCheckbox.addEventListener("change", function () {
        options.depthSortSprites = depthSortSpritesCheckbox.checked;
      });
      showFpsCheckbox.addEventListener("change", function () {
        options.showFps = showFpsCheckbox.checked;
      });
      this.hasBoundOptionListeners = true;
    }
  };
}
