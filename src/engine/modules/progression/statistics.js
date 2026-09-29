/** 本轮、累计统计与事件记账。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export function RunStatistics() {
  this.bookcasesLooted = this.weaponRacksLooted = this.treasureChestsLooted = this.ancientItemsFound = this.historicItemsFound = this.rareItemsFound = this.uncommonItemsFound = this.itemsFound = this.itemsSold = this.minionsSummoned = this.playedMillis = this.scrollsUsed = this.potionsUsed = this.spellCastCount = this.rangedAttackCount = this.meleeAttackCount = this.characterStunnedCount = this.farmedKills = this.minionKills = this.scrollKills = this.directKills = this.totalGoldFromItems = this.totalGoldFromMonsters = this.farmsPurchased = this.castlesConquered = this.dungeonsCleared = this.levelsCleared = this.roomsCleared = this.doorsOpened = this.turnCount = 0;
}
export function LifetimeStatistics() {}
export function getClassVictories(statistics, classId) {
  const victories = statistics.classVictories[classId];
  return victories ? victories : 0;
}
export function getSoloClassVictories(statistics, classId) {
  const victories = statistics.soloClassVictories[classId];
  return victories ? victories : 0;
}
export function StatisticsRecorder() {
  this.lifetimeStatistics = this.statisticsRecorder = null;
}
/**
 * 将本轮与累计统计接到同一个记录器。状态由调用者提供，避免统计模块依赖全局游戏实例。
 * @param {{ statisticsRecorder: StatisticsRecorder, runStatistics: RunStatistics, lifetimeStatistics: LifetimeStatistics }} state
 */
export function bindStatistics(state) {
  const recorder = state.statisticsRecorder;
  recorder.statisticsRecorder = state.runStatistics;
  recorder.lifetimeStatistics = state.lifetimeStatistics;
}
export function initializeProgressionStatistics() {
  RunStatistics.prototype.resetRunStatistics = function () {
    this.bookcasesLooted = this.weaponRacksLooted = this.treasureChestsLooted = this.ancientItemsFound = this.historicItemsFound = this.rareItemsFound = this.uncommonItemsFound = this.itemsFound = this.itemsSold = this.minionsSummoned = this.playedMillis = this.scrollsUsed = this.potionsUsed = this.spellCastCount = this.rangedAttackCount = this.meleeAttackCount = this.characterStunnedCount = this.farmedKills = this.minionKills = this.scrollKills = this.directKills = this.totalGoldFromItems = this.totalGoldFromMonsters = this.farmsPurchased = this.castlesConquered = this.dungeonsCleared = this.levelsCleared = this.roomsCleared = this.doorsOpened = this.turnCount = 0;
  };
  RunStatistics.prototype.recordTurn = function () {
    this.turnCount++;
  };
  RunStatistics.prototype.recordRoomCleared = function () {
    this.roomsCleared++;
  };
  RunStatistics.prototype.recordDoorOpened = function () {
    this.doorsOpened++;
  };
  RunStatistics.prototype.recordLevelCleared = function () {
    this.levelsCleared++;
  };
  RunStatistics.prototype.recordDungeonCleared = function () {
    this.dungeonsCleared++;
  };
  RunStatistics.prototype.recordCastleConquered = function () {
    this.castlesConquered++;
  };
  RunStatistics.prototype.recordFarmPurchased = function () {
    this.farmsPurchased++;
  };
  RunStatistics.prototype.recordGoldFromItems = function (amount) {
    this.totalGoldFromItems += amount;
  };
  RunStatistics.prototype.recordGoldFromMonsters = function (amount) {
    this.totalGoldFromMonsters += amount;
  };
  RunStatistics.prototype.recordFarmHarvest = function (kills) {
    this.farmedKills += kills;
  };
  RunStatistics.prototype.setFarmedKills = function (kills) {
    this.farmedKills = kills;
  };
  RunStatistics.prototype.recordDirectKill = function () {
    this.directKills++;
  };
  RunStatistics.prototype.recordScrollKill = function () {
    this.scrollKills++;
  };
  RunStatistics.prototype.recordMinionKill = function () {
    this.minionKills++;
  };
  RunStatistics.prototype.setMinionKills = function (kills) {
    this.minionKills = kills;
  };
  RunStatistics.prototype.recordMinionSummoned = function () {
    this.minionsSummoned++;
  };
  RunStatistics.prototype.recordCharacterStunned = function () {
    this.characterStunnedCount++;
  };
  RunStatistics.prototype.recordMeleeAttack = function () {
    this.meleeAttackCount++;
  };
  RunStatistics.prototype.recordRangedAttack = function () {
    this.rangedAttackCount++;
  };
  RunStatistics.prototype.recordSpellCast = function () {
    this.spellCastCount++;
  };
  RunStatistics.prototype.recordPotionUsed = function () {
    this.potionsUsed++;
  };
  RunStatistics.prototype.recordScrollUsed = function () {
    this.scrollsUsed++;
  };
  RunStatistics.prototype.recordPlayedMilliseconds = function (milliseconds) {
    this.playedMillis += milliseconds;
  };
  RunStatistics.prototype.recordItemsSold = function (count) {
    this.itemsSold += count;
  };
  RunStatistics.prototype.recordItemFound = function (item) {
    this.itemsFound++;
    switch (item.getRarity()) {
      case 1:
        this.uncommonItemsFound++;
        break;
      case 2:
        this.rareItemsFound++;
        break;
      case 3:
        this.historicItemsFound++;
        break;
      case 4:
        this.ancientItemsFound++;
    }
  };
  RunStatistics.prototype.recordTreasureChestLooted = function () {
    this.treasureChestsLooted++;
  };
  RunStatistics.prototype.recordWeaponRackLooted = function () {
    this.weaponRacksLooted++;
  };
  RunStatistics.prototype.recordBookcaseLooted = function () {
    this.bookcasesLooted++;
  };
  LifetimeStatistics.prototype = new RunStatistics();
  LifetimeStatistics.prototype.resetRunStatistics = function () {
    console.log("Reset invoked on total statistics. Not resetting anything.");
  };
  StatisticsRecorder.prototype.recordTurn = function () {
    this.statisticsRecorder.recordTurn();
    this.lifetimeStatistics.recordTurn();
  };
  StatisticsRecorder.prototype.recordDoorOpened = function () {
    this.statisticsRecorder.recordDoorOpened();
    this.lifetimeStatistics.recordDoorOpened();
  };
  StatisticsRecorder.prototype.recordRoomCleared = function () {
    this.statisticsRecorder.recordRoomCleared();
    this.lifetimeStatistics.recordRoomCleared();
  };
  StatisticsRecorder.prototype.recordLevelCleared = function () {
    this.statisticsRecorder.recordLevelCleared();
    this.lifetimeStatistics.recordLevelCleared();
  };
  StatisticsRecorder.prototype.recordDungeonCleared = function () {
    this.statisticsRecorder.recordDungeonCleared();
    this.lifetimeStatistics.recordDungeonCleared();
  };
  StatisticsRecorder.prototype.recordCastleConquered = function () {
    this.statisticsRecorder.recordCastleConquered();
    this.lifetimeStatistics.recordCastleConquered();
  };
  StatisticsRecorder.prototype.recordGoldFromItems = function (amount) {
    this.statisticsRecorder.recordGoldFromItems(amount);
    this.lifetimeStatistics.recordGoldFromItems(amount);
  };
  StatisticsRecorder.prototype.recordGoldFromMonsters = function (amount) {
    this.statisticsRecorder.recordGoldFromMonsters(amount);
    this.lifetimeStatistics.recordGoldFromMonsters(amount);
  };
  StatisticsRecorder.prototype.recordFarmHarvest = function (kills) {
    this.statisticsRecorder.recordFarmHarvest(kills);
    this.lifetimeStatistics.recordFarmHarvest(kills);
  };
  StatisticsRecorder.prototype.recordDirectKill = function () {
    this.statisticsRecorder.recordDirectKill();
    this.lifetimeStatistics.recordDirectKill();
  };
  StatisticsRecorder.prototype.recordScrollKill = function () {
    this.statisticsRecorder.recordScrollKill();
    this.lifetimeStatistics.recordScrollKill();
  };
  StatisticsRecorder.prototype.recordMinionKill = function () {
    this.statisticsRecorder.recordMinionKill();
    this.lifetimeStatistics.recordMinionKill();
  };
  StatisticsRecorder.prototype.recordMinionSummoned = function () {
    this.statisticsRecorder.recordMinionSummoned();
    this.lifetimeStatistics.recordMinionSummoned();
  };
  StatisticsRecorder.prototype.recordCharacterStunned = function () {
    this.statisticsRecorder.recordCharacterStunned();
    this.lifetimeStatistics.recordCharacterStunned();
  };
  StatisticsRecorder.prototype.recordMeleeAttack = function () {
    this.statisticsRecorder.recordMeleeAttack();
    this.lifetimeStatistics.recordMeleeAttack();
  };
  StatisticsRecorder.prototype.recordRangedAttack = function () {
    this.statisticsRecorder.recordRangedAttack();
    this.lifetimeStatistics.recordRangedAttack();
  };
  StatisticsRecorder.prototype.recordSpellCast = function () {
    this.statisticsRecorder.recordSpellCast();
    this.lifetimeStatistics.recordSpellCast();
  };
  StatisticsRecorder.prototype.recordPotionUsed = function () {
    this.statisticsRecorder.recordPotionUsed();
    this.lifetimeStatistics.recordPotionUsed();
  };
  StatisticsRecorder.prototype.recordScrollUsed = function () {
    this.statisticsRecorder.recordScrollUsed();
    this.lifetimeStatistics.recordScrollUsed();
  };
  StatisticsRecorder.prototype.recordFarmPurchased = function () {
    this.statisticsRecorder.recordFarmPurchased();
    this.lifetimeStatistics.recordFarmPurchased();
  };
  StatisticsRecorder.prototype.recordPlayedMilliseconds = function (milliseconds) {
    this.statisticsRecorder.recordPlayedMilliseconds(milliseconds);
    this.lifetimeStatistics.recordPlayedMilliseconds(milliseconds);
  };
  StatisticsRecorder.prototype.recordItemsSold = function (count) {
    this.statisticsRecorder.recordItemsSold(count);
    this.lifetimeStatistics.recordItemsSold(count);
  };
  StatisticsRecorder.prototype.recordItemFound = function (item) {
    this.statisticsRecorder.recordItemFound(item);
    this.lifetimeStatistics.recordItemFound(item);
  };
  StatisticsRecorder.prototype.recordTreasureChestLooted = function () {
    this.statisticsRecorder.recordTreasureChestLooted();
    this.lifetimeStatistics.recordTreasureChestLooted();
  };
  StatisticsRecorder.prototype.recordWeaponRackLooted = function () {
    this.statisticsRecorder.recordWeaponRackLooted();
    this.lifetimeStatistics.recordWeaponRackLooted();
  };
  StatisticsRecorder.prototype.recordBookcaseLooted = function () {
    this.statisticsRecorder.recordBookcaseLooted();
    this.lifetimeStatistics.recordBookcaseLooted();
  };
}
