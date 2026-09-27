/** 原版存档控件、统计和说明。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { appendHeaderCell, clearElementById, createElement, getElement, hideElementById, setElementHtml, showElementById } from "./dom.js";
import { game } from "../runtime/game.js";
import { serializeGame } from "../persistence/game-save.js";
import { View, addChildView, resetChildViews } from "./base.js";
import { TabView } from "./navigation.js";
import { floorNumber, formatAmount } from "../core/math.js";
export function SaveControlsView() {
  this.elementId = "infoTabSaveLoadContainer";
  this.visible = true;
  this.lastSaveDivElementId = "lastSaveDiv";
  this.cachedLastSavedAt = -1;
  getElement("saveButton").onclick = function () {
    game.saveNow();
    return false;
  };
  getElement("firstResetButton").onclick = function () {
    showElementById("resetConfirmContainer");
    hideElementById("firstResetButtonContainer");
    return false;
  };
  getElement("realResetButton").onclick = function () {
    game.restartRun();
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
    game.resetGame();
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
    var a = /** @type {HTMLInputElement} */ (getElement("exportSaveInput"));
    a.value = serializeGame(game.saves);
    showElementById("exportSaveContainer");
    hideElementById("exportSaveButton");
    a.select();
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
    if (game.importSave(/** @type {HTMLInputElement} */ (getElement("importSaveInput")).value)) {
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
export function InformationView(a) {
  this.elementId = "infoTabContent";
  this.tabState = a;
  addChildView(this, new SaveControlsView());
  addChildView(this, new StatisticsView());
  addChildView(this, new OptionsView());
}
/** StatisticsView.prototype 在初始化里被 new View() 替换，后挂成员对 TS 不可见；用 this 类型标注这几个方法。
 * @typedef {Object} MountedStatisticsViewMethods
 * @property {function(): void} buildStatisticsTable 重建统计表 DOM。
 * @property {function(number, number, number): string} formatHoursMinutesSeconds 拼时、分、秒。
 * @property {function(number): void} createHeaderRow 在表尾插入一行表头。
 * @property {function(HTMLTableRowElement, number): HTMLTableCellElement} getStatisticCell 取指定行的单元格。
 */
export function StatisticsView() {
  this.elementId = "statisticsContainer";
  this.visible = true;
  this.tableElement = null;
  this.cachedLifetimeAncientItemsFound = this.cachedRunAncientItemsFound = this.cachedLifetimeHistoricItemsFound = this.cachedRunHistoricItemsFound = this.cachedLifetimeRareItemsFound = this.cachedRunRareItemsFound = this.cachedLifetimeUncommonItemsFound = this.cachedRunUncommonItemsFound = this.cachedLifetimeItemsFound = this.cachedRunItemsFound = this.cachedLifetimeItemsSold = this.cachedRunItemsSold = this.cachedLifetimeScrollsUsed = this.cachedRunScrollsUsed = this.cachedLifetimePotionsUsed = this.cachedRunPotionsUsed = this.cachedLifetimeSpellCasts = this.cachedRunSpellCasts = this.cachedLifetimeRangedAttacks = this.cachedRunRangedAttacks = this.cachedLifetimeMeleeAttacks = this.cachedRunMeleeAttacks = this.cachedLifetimeStunnedCount = this.cachedRunStunnedCount = this.cachedLifetimeFarmedKills = this.cachedRunFarmedKills = this.cachedLifetimeMinionKills = this.cachedRunMinionKills = this.cachedLifetimeScrollKills = this.cachedRunScrollKills = this.cachedLifetimeDirectKills = this.cachedRunDirectKills = this.cachedLifetimeGoldFromItems = this.cachedRunGoldFromItems = this.cachedLifetimeGoldFromMonsters = this.cachedRunGoldFromMonsters = this.cachedLifetimeBookcasesLooted = this.cachedRunBookcasesLooted = this.cachedLifetimeWeaponRacksLooted = this.cachedRunWeaponRacksLooted = this.cachedLifetimeTreasureChestsLooted = this.cachedRunTreasureChestsLooted = this.cachedLifetimeMinionsSummoned = this.cachedRunMinionsSummoned = this.cachedLifetimeFarmsPurchased = this.cachedRunFarmsPurchased = this.cachedLifetimeCastlesConquered = this.cachedRunCastlesConquered = this.cachedLifetimeDungeonsCleared = this.cachedRunDungeonsCleared = this.cachedLifetimeLevelsCleared = this.cachedRunLevelsCleared = this.cachedLifetimeRoomsCleared = this.cachedRunRoomsCleared = this.cachedLifetimeDoorsOpened = this.cachedRunDoorsOpened = this.cachedLifetimeTurnCount = this.cachedRunTurnCount = this.cachedLifetimePlaySeconds = this.cachedLifetimePlayMinutes = this.cachedLifetimePlayHours = this.cachedRunPlaySeconds = this.cachedRunPlayMinutes = this.cachedRunPlayHours = this.cachedVictoryCount = -1;
  this.lifetimeAncientItemsFoundCell = this.runAncientItemsFoundCell = this.lifetimeHistoricItemsFoundCell = this.runHistoricItemsFoundCell = this.lifetimeRareItemsFoundCell = this.runRareItemsFoundCell = this.lifetimeUncommonItemsFoundCell = this.runUncommonItemsFoundCell = this.lifetimeItemsFoundCell = this.runItemsFoundCell = this.lifetimeItemsSoldCell = this.runItemsSoldCell = this.lifetimeScrollsUsedCell = this.runScrollsUsedCell = this.lifetimePotionsUsedCell = this.runPotionsUsedCell = this.lifetimeSpellCastsCell = this.runSpellCastsCell = this.lifetimeRangedAttacksCell = this.runRangedAttacksCell = this.lifetimeMeleeAttacksCell = this.runMeleeAttacksCell = this.lifetimeStunnedCountCell = this.runStunnedCountCell = this.lifetimeFarmedKillsCell = this.runFarmedKillsCell = this.lifetimeMinionKillsCell = this.runMinionKillsCell = this.lifetimeScrollKillsCell = this.runScrollKillsCell = this.lifetimeDirectKillsCell = this.runDirectKillsCell = this.lifetimeGoldFromItemsCell = this.runGoldFromItemsCell = this.lifetimeGoldFromMonstersCell = this.runGoldFromMonstersCell = this.lifetimeBookcasesLootedCell = this.runBookcasesLootedCell = this.lifetimeWeaponRacksLootedCell = this.runWeaponRacksLootedCell = this.lifetimeTreasureChestsLootedCell = this.runTreasureChestsLootedCell = this.lifetimeMinionsSummonedCell = this.runMinionsSummonedCell = this.lifetimeFarmsPurchasedCell = this.runFarmsPurchasedCell = this.lifetimeCastlesConqueredCell = this.runCastlesConqueredCell = this.lifetimeDungeonsClearedCell = this.runDungeonsClearedCell = this.lifetimeLevelsClearedCell = this.runLevelsClearedCell = this.lifetimeDoorsOpenedCell = this.runDoorsOpenedCell = this.lifetimeRoomsClearedCell = this.runRoomsClearedCell = this.lifetimeTurnCountCell = this.runTurnCountCell = this.runPlayTimeCell = this.lifetimePlayTimeCell = this.victoryCountCell = null;
  this.millisecondsPerHour = 36E5;
}
export function appendStatisticsRow(a, b, c) {
  a = a.tableElement.insertRow(c);
  c = a.insertCell(0);
  c.className = "statisticsTableLabel";
  c.innerHTML = b;
  return a;
}
export function OptionsView() {
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
    var a;
    a = game.saves.lastSavedAt;
    if (this.cachedLastSavedAt !== a && 0 < a) {
      this.cachedLastSavedAt = a;
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
    var a = game.state.runStatistics,
      b = game.state.lifetimeStatistics,
      c = game.state.victoryCount,
      d = b.playedMillis,
      f = a.playedMillis,
      g = b.turnCount,
      h = a.turnCount,
      l = b.roomsCleared,
      n = a.roomsCleared,
      p = b.doorsOpened,
      s = a.doorsOpened,
      u = b.levelsCleared,
      y = a.levelsCleared,
      A = b.dungeonsCleared,
      C = a.dungeonsCleared,
      v = b.castlesConquered,
      D = a.castlesConquered,
      N = b.farmsPurchased,
      I = a.farmsPurchased,
      x = b.minionsSummoned,
      z = a.minionsSummoned,
      O = b.treasureChestsLooted,
      J = a.treasureChestsLooted,
      la = b.weaponRacksLooted,
      Q = a.weaponRacksLooted,
      V = b.bookcasesLooted,
      na = a.bookcasesLooted,
      K = b.totalGoldFromMonsters,
      H = a.totalGoldFromMonsters,
      S = b.totalGoldFromItems,
      da = a.totalGoldFromItems,
      W = b.directKills,
      ia = a.directKills,
      ea = b.scrollKills,
      va = a.scrollKills,
      yb = b.minionKills,
      Fb = a.minionKills,
      pa = b.farmedKills,
      T = a.farmedKills,
      X = b.characterStunnedCount,
      Ca = a.characterStunnedCount,
      qa = b.meleeAttackCount,
      ta = a.meleeAttackCount,
      eb = b.rangedAttackCount,
      Gb = a.rangedAttackCount,
      Da = b.spellCastCount,
      ub = a.spellCastCount,
      mb = b.potionsUsed,
      Ea = a.potionsUsed,
      La = b.scrollsUsed,
      wa = a.scrollsUsed,
      Fa = b.itemsSold,
      ha = a.itemsSold,
      ja = b.itemsFound,
      Ga = a.itemsFound,
      bb = b.uncommonItemsFound,
      za = a.uncommonItemsFound,
      nb = b.rareItemsFound,
      fb = a.rareItemsFound,
      cb = b.historicItemsFound,
      Ua = a.historicItemsFound,
      b = b.ancientItemsFound,
      a = a.ancientItemsFound;
    if (this.cachedVictoryCount != c) {
      this.cachedVictoryCount = c;
      this.victoryCountCell.innerHTML = formatAmount(c);
    }
    if (this.cachedRunTurnCount != h) {
      this.cachedRunTurnCount = h;
      this.runTurnCountCell.innerHTML = formatAmount(h);
    }
    if (this.cachedLifetimeTurnCount != g) {
      this.cachedLifetimeTurnCount = g;
      this.lifetimeTurnCountCell.innerHTML = formatAmount(g);
    }
    if (this.cachedRunRoomsCleared != n) {
      this.cachedRunRoomsCleared = n;
      this.runRoomsClearedCell.innerHTML = formatAmount(n);
    }
    if (this.cachedLifetimeRoomsCleared != l) {
      this.cachedLifetimeRoomsCleared = l;
      this.lifetimeRoomsClearedCell.innerHTML = formatAmount(l);
    }
    if (this.cachedRunDoorsOpened != s) {
      this.cachedRunDoorsOpened = s;
      this.runDoorsOpenedCell.innerHTML = formatAmount(s);
    }
    if (this.cachedLifetimeDoorsOpened != p) {
      this.cachedLifetimeDoorsOpened = p;
      this.lifetimeDoorsOpenedCell.innerHTML = formatAmount(p);
    }
    if (this.cachedRunLevelsCleared != y) {
      this.cachedRunLevelsCleared = y;
      this.runLevelsClearedCell.innerHTML = formatAmount(y);
    }
    if (this.cachedLifetimeLevelsCleared != u) {
      this.cachedLifetimeLevelsCleared = u;
      this.lifetimeLevelsClearedCell.innerHTML = formatAmount(u);
    }
    if (this.cachedRunDungeonsCleared != C) {
      this.cachedRunDungeonsCleared = C;
      this.runDungeonsClearedCell.innerHTML = formatAmount(C);
    }
    if (this.cachedLifetimeDungeonsCleared != A) {
      this.cachedLifetimeDungeonsCleared = A;
      this.lifetimeDungeonsClearedCell.innerHTML = formatAmount(A);
    }
    if (this.cachedRunCastlesConquered != D) {
      this.cachedRunCastlesConquered = D;
      this.runCastlesConqueredCell.innerHTML = formatAmount(D) + "/" + game.castles.castleList.length;
    }
    if (this.cachedLifetimeCastlesConquered != v) {
      this.cachedLifetimeCastlesConquered = v;
      this.lifetimeCastlesConqueredCell.innerHTML = formatAmount(v);
    }
    if (this.cachedRunFarmsPurchased != I) {
      this.cachedRunFarmsPurchased = I;
      this.runFarmsPurchasedCell.innerHTML = formatAmount(I);
    }
    if (this.cachedLifetimeFarmsPurchased != N) {
      this.cachedLifetimeFarmsPurchased = N;
      this.lifetimeFarmsPurchasedCell.innerHTML = formatAmount(N);
    }
    if (this.cachedRunMinionsSummoned != z) {
      this.cachedRunMinionsSummoned = z;
      this.runMinionsSummonedCell.innerHTML = formatAmount(z);
    }
    if (this.cachedLifetimeMinionsSummoned != x) {
      this.cachedLifetimeMinionsSummoned = x;
      this.lifetimeMinionsSummonedCell.innerHTML = formatAmount(x);
    }
    if (this.cachedRunTreasureChestsLooted != J) {
      this.cachedRunTreasureChestsLooted = J;
      this.runTreasureChestsLootedCell.innerHTML = formatAmount(J);
    }
    if (this.cachedLifetimeTreasureChestsLooted != O) {
      this.cachedLifetimeTreasureChestsLooted = O;
      this.lifetimeTreasureChestsLootedCell.innerHTML = formatAmount(O);
    }
    if (this.cachedRunWeaponRacksLooted != Q) {
      this.cachedRunWeaponRacksLooted = Q;
      this.runWeaponRacksLootedCell.innerHTML = formatAmount(Q);
    }
    if (this.cachedLifetimeWeaponRacksLooted != la) {
      this.cachedLifetimeWeaponRacksLooted = la;
      this.lifetimeWeaponRacksLootedCell.innerHTML = formatAmount(la);
    }
    if (this.cachedRunBookcasesLooted != na) {
      this.cachedRunBookcasesLooted = na;
      this.runBookcasesLootedCell.innerHTML = formatAmount(na);
    }
    if (this.cachedLifetimeBookcasesLooted != V) {
      this.cachedLifetimeBookcasesLooted = V;
      this.lifetimeBookcasesLootedCell.innerHTML = formatAmount(V);
    }
    if (this.cachedRunGoldFromMonsters != H) {
      this.cachedRunGoldFromMonsters = H;
      this.runGoldFromMonstersCell.innerHTML = formatAmount(H);
    }
    if (this.cachedLifetimeGoldFromMonsters != K) {
      this.cachedLifetimeGoldFromMonsters = K;
      this.lifetimeGoldFromMonstersCell.innerHTML = formatAmount(K);
    }
    if (this.cachedRunGoldFromItems != da) {
      this.cachedRunGoldFromItems = da;
      this.runGoldFromItemsCell.innerHTML = formatAmount(da);
    }
    if (this.cachedLifetimeGoldFromItems != S) {
      this.cachedLifetimeGoldFromItems = S;
      this.lifetimeGoldFromItemsCell.innerHTML = formatAmount(S);
    }
    if (this.cachedRunDirectKills != ia) {
      this.cachedRunDirectKills = ia;
      this.runDirectKillsCell.innerHTML = formatAmount(ia);
    }
    if (this.cachedLifetimeDirectKills != W) {
      this.cachedLifetimeDirectKills = W;
      this.lifetimeDirectKillsCell.innerHTML = formatAmount(W);
    }
    if (this.cachedRunScrollKills != va) {
      this.cachedRunScrollKills = va;
      this.runScrollKillsCell.innerHTML = formatAmount(va);
    }
    if (this.cachedLifetimeScrollKills != ea) {
      this.cachedLifetimeScrollKills = ea;
      this.lifetimeScrollKillsCell.innerHTML = formatAmount(ea);
    }
    if (this.cachedRunMinionKills != Fb) {
      this.cachedRunMinionKills = Fb;
      this.runMinionKillsCell.innerHTML = formatAmount(Fb);
    }
    if (this.cachedLifetimeMinionKills != yb) {
      this.cachedLifetimeMinionKills = yb;
      this.lifetimeMinionKillsCell.innerHTML = formatAmount(yb);
    }
    if (this.cachedRunFarmedKills != T) {
      this.cachedRunFarmedKills = T;
      this.runFarmedKillsCell.innerHTML = formatAmount(T);
    }
    if (this.cachedLifetimeFarmedKills != pa) {
      this.cachedLifetimeFarmedKills = pa;
      this.lifetimeFarmedKillsCell.innerHTML = formatAmount(pa);
    }
    if (this.cachedRunStunnedCount != Ca) {
      this.cachedRunStunnedCount = Ca;
      this.runStunnedCountCell.innerHTML = formatAmount(Ca);
    }
    if (this.cachedLifetimeStunnedCount != X) {
      this.cachedLifetimeStunnedCount = X;
      this.lifetimeStunnedCountCell.innerHTML = formatAmount(X);
    }
    if (this.cachedRunMeleeAttacks != ta) {
      this.cachedRunMeleeAttacks = ta;
      this.runMeleeAttacksCell.innerHTML = formatAmount(ta);
    }
    if (this.cachedLifetimeMeleeAttacks != qa) {
      this.cachedLifetimeMeleeAttacks = qa;
      this.lifetimeMeleeAttacksCell.innerHTML = formatAmount(qa);
    }
    if (this.cachedRunRangedAttacks != Gb) {
      this.cachedRunRangedAttacks = Gb;
      this.runRangedAttacksCell.innerHTML = formatAmount(Gb);
    }
    if (this.cachedLifetimeRangedAttacks != eb) {
      this.cachedLifetimeRangedAttacks = eb;
      this.lifetimeRangedAttacksCell.innerHTML = formatAmount(eb);
    }
    if (this.cachedRunSpellCasts != ub) {
      this.cachedRunSpellCasts = ub;
      this.runSpellCastsCell.innerHTML = formatAmount(ub);
    }
    if (this.cachedLifetimeSpellCasts != Da) {
      this.cachedLifetimeSpellCasts = Da;
      this.lifetimeSpellCastsCell.innerHTML = formatAmount(Da);
    }
    if (this.cachedRunPotionsUsed != Ea) {
      this.cachedRunPotionsUsed = Ea;
      this.runPotionsUsedCell.innerHTML = formatAmount(Ea);
    }
    if (this.cachedLifetimePotionsUsed != mb) {
      this.cachedLifetimePotionsUsed = mb;
      this.lifetimePotionsUsedCell.innerHTML = formatAmount(mb);
    }
    if (this.cachedRunScrollsUsed != wa) {
      this.cachedRunScrollsUsed = wa;
      this.runScrollsUsedCell.innerHTML = formatAmount(wa);
    }
    if (this.cachedLifetimeScrollsUsed != La) {
      this.cachedLifetimeScrollsUsed = La;
      this.lifetimeScrollsUsedCell.innerHTML = formatAmount(La);
    }
    if (this.cachedRunItemsSold != ha) {
      this.cachedRunItemsSold = ha;
      this.runItemsSoldCell.innerHTML = formatAmount(ha);
    }
    if (this.cachedLifetimeItemsSold != Fa) {
      this.cachedLifetimeItemsSold = Fa;
      this.lifetimeItemsSoldCell.innerHTML = formatAmount(Fa);
    }
    if (this.cachedRunItemsFound != Ga) {
      this.cachedRunItemsFound = Ga;
      this.runItemsFoundCell.innerHTML = formatAmount(Ga);
    }
    if (this.cachedLifetimeItemsFound != ja) {
      this.cachedLifetimeItemsFound = ja;
      this.lifetimeItemsFoundCell.innerHTML = formatAmount(ja);
    }
    if (this.cachedRunUncommonItemsFound != za) {
      this.cachedRunUncommonItemsFound = za;
      this.runUncommonItemsFoundCell.innerHTML = formatAmount(za);
    }
    if (this.cachedLifetimeUncommonItemsFound != bb) {
      this.cachedLifetimeUncommonItemsFound = bb;
      this.lifetimeUncommonItemsFoundCell.innerHTML = formatAmount(bb);
    }
    if (this.cachedRunRareItemsFound != fb) {
      this.cachedRunRareItemsFound = fb;
      this.runRareItemsFoundCell.innerHTML = formatAmount(fb);
    }
    if (this.cachedLifetimeRareItemsFound != nb) {
      this.cachedLifetimeRareItemsFound = nb;
      this.lifetimeRareItemsFoundCell.innerHTML = formatAmount(nb);
    }
    if (this.cachedRunHistoricItemsFound != Ua) {
      this.cachedRunHistoricItemsFound = Ua;
      this.runHistoricItemsFoundCell.innerHTML = formatAmount(Ua);
    }
    if (this.cachedLifetimeHistoricItemsFound != cb) {
      this.cachedLifetimeHistoricItemsFound = cb;
      this.lifetimeHistoricItemsFoundCell.innerHTML = formatAmount(cb);
    }
    if (this.cachedRunAncientItemsFound != a) {
      this.cachedRunAncientItemsFound = a;
      this.runAncientItemsFoundCell.innerHTML = formatAmount(a);
    }
    if (this.cachedLifetimeAncientItemsFound != b) {
      this.cachedLifetimeAncientItemsFound = b;
      this.lifetimeAncientItemsFoundCell.innerHTML = formatAmount(b);
    }
    c = floorNumber(d / this.millisecondsPerHour);
    g = floorNumber(d / 6E4 % 60);
    d = floorNumber(d / 1E3 % 60);
    h = floorNumber(f / this.millisecondsPerHour);
    l = floorNumber(f / 6E4 % 60);
    f = floorNumber(f / 1E3 % 60);
    if (this.cachedLifetimePlayHours != c || this.cachedLifetimePlayMinutes != g || this.cachedLifetimePlaySeconds != d) {
      this.cachedLifetimePlayHours = c;
      this.cachedLifetimePlayMinutes = g;
      this.cachedLifetimePlaySeconds = d;
      this.lifetimePlayTimeCell.innerHTML = this.formatHoursMinutesSeconds(c, g, d);
    }
    if (this.cachedRunPlayHours != h || this.cachedRunPlayMinutes != l || this.cachedRunPlaySeconds != f) {
      this.cachedRunPlayHours = h;
      this.cachedRunPlayMinutes = l;
      this.cachedRunPlaySeconds = f;
      this.runPlayTimeCell.innerHTML = this.formatHoursMinutesSeconds(h, l, f);
    }
  };
  StatisticsView.prototype.formatHoursMinutesSeconds = function (a, b, c) {
    return (10 > a ? "0" : "") + a + ":" + (10 > b ? "0" : "") + b + ":" + (10 > c ? "0" : "") + c;
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
  StatisticsView.prototype.createHeaderRow = function (a) {
    a = this.tableElement.insertRow(a);
    appendHeaderCell(a).innerHTML = "";
    var b = appendHeaderCell(a);
    b.style.textAlign = "right";
    b.innerHTML = "当前";
    a = appendHeaderCell(a);
    a.style.textAlign = "right";
    a.innerHTML = "总计";
  };
  StatisticsView.prototype.getStatisticCell = function (a, b) {
    var c = a.insertCell(b);
    c.style.textAlign = "right";
    c.style.width = "70px";
    return c;
  };
  OptionsView.prototype = new View();
  OptionsView.prototype.reset = function () {
    var a = /** @type {HTMLInputElement} */ (getElement("infoTextEnabledCheckbox")),
      b = /** @type {HTMLInputElement} */ (getElement("spellEffectsEnabledCheckbox")),
      c = /** @type {HTMLInputElement} */ (getElement("mapOverlayEnabledCheckbox")),
      d = /** @type {HTMLInputElement} */ (getElement("offlineProcessingEnabledCheckbox")),
      f = /** @type {HTMLInputElement} */ (getElement("inactiveTabProcessingEnabledCheckbox")),
      g = /** @type {HTMLInputElement} */ (getElement("spriteRenderOrderEnabledCheckbox")),
      h = /** @type {HTMLInputElement} */ (getElement("fpsVisibleCheckbox"));
    a.checked = game.options.showCombatText;
    b.checked = game.options.showSpellEffects;
    c.checked = game.options.showMapOverlay;
    d.checked = game.options.allowOfflineProgress;
    f.checked = game.options.allowBackgroundProgress;
    g.checked = game.options.depthSortSprites;
    h.checked = game.options.showFps;
    if (!this.hasBoundOptionListeners) {
      a.addEventListener("change", function () {
        game.options.showCombatText = a.checked;
      });
      b.addEventListener("change", function () {
        game.options.showSpellEffects = b.checked;
      });
      c.addEventListener("change", function () {
        game.options.showMapOverlay = c.checked;
      });
      d.addEventListener("change", function () {
        game.options.allowOfflineProgress = d.checked;
      });
      f.addEventListener("change", function () {
        game.options.allowBackgroundProgress = f.checked;
      });
      g.addEventListener("change", function () {
        game.options.depthSortSprites = g.checked;
      });
      h.addEventListener("change", function () {
        game.options.showFps = h.checked;
      });
      this.hasBoundOptionListeners = true;
    }
  };
}
