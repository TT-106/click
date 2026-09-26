/** 本轮、累计统计与事件记账。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
export function RunStatistics() {
  this.bookcasesLooted = this.weaponRacksLooted = this.treasureChestsLooted = this.ancientItemsFound = this.historicItemsFound = this.rareItemsFound = this.uncommonItemsFound = this.itemsFound = this.itemsSold = this.minionsSummoned = this.playedMillis = this.scrollsUsed = this.potionsUsed = this.spellCastCount = this.rangedAttackCount = this.meleeAttackCount = this.characterStunnedCount = this.farmedKills = this.minionKills = this.scrollKills = this.directKills = this.totalGoldFromItems = this.totalGoldFromMonsters = this.farmsPurchased = this.castlesConquered = this.dungeonsCleared = this.levelsCleared = this.roomsCleared = this.doorsOpened = this.turnCount = 0;
}
export function LifetimeStatistics() {}
export function getClassVictories(a, b) {
  var c = a.qo[b];
  return c ? c : 0;
}
export function getSoloClassVictories(a, b) {
  var c = a.lq[b];
  return c ? c : 0;
}
export function StatisticsRecorder() {
  this.lifetimeStatistics = this.statisticsRecorder = null;
}
export function bindStatistics() {
  var a = game.state.statisticsRecorder,
    b = game.state.lifetimeStatistics;
  a.statisticsRecorder = game.state.runStatistics;
  a.lifetimeStatistics = b;
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
  RunStatistics.prototype.$r = function () {
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
  RunStatistics.prototype.recordGoldFromItems = function (a) {
    this.totalGoldFromItems += a;
  };
  RunStatistics.prototype.recordGoldFromMonsters = function (a) {
    this.totalGoldFromMonsters += a;
  };
  RunStatistics.prototype.recordFarmHarvest = function (a) {
    this.farmedKills += a;
  };
  RunStatistics.prototype.setFarmedKills = function (a) {
    this.farmedKills = a;
  };
  RunStatistics.prototype.recordDirectKill = function () {
    this.directKills++;
  };
  RunStatistics.prototype.recordScrollKill = function () {
    this.scrollKills++;
  };
  RunStatistics.prototype.$k = function () {
    this.minionKills++;
  };
  RunStatistics.prototype.setMinionKills = function (a) {
    this.minionKills = a;
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
  RunStatistics.prototype.recordPlayedMilliseconds = function (a) {
    this.playedMillis += a;
  };
  RunStatistics.prototype.recordItemsSold = function (a) {
    this.itemsSold += a;
  };
  RunStatistics.prototype.recordItemFound = function (a) {
    this.itemsFound++;
    switch (a.getRarity()) {
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
  StatisticsRecorder.prototype.$r = function () {
    this.statisticsRecorder.$r();
    this.lifetimeStatistics.$r();
  };
  StatisticsRecorder.prototype.recordDungeonCleared = function () {
    this.statisticsRecorder.recordDungeonCleared();
    this.lifetimeStatistics.recordDungeonCleared();
  };
  StatisticsRecorder.prototype.recordCastleConquered = function () {
    this.statisticsRecorder.recordCastleConquered();
    this.lifetimeStatistics.recordCastleConquered();
  };
  StatisticsRecorder.prototype.recordGoldFromItems = function (a) {
    this.statisticsRecorder.recordGoldFromItems(a);
    this.lifetimeStatistics.recordGoldFromItems(a);
  };
  StatisticsRecorder.prototype.recordGoldFromMonsters = function (a) {
    this.statisticsRecorder.recordGoldFromMonsters(a);
    this.lifetimeStatistics.recordGoldFromMonsters(a);
  };
  StatisticsRecorder.prototype.recordFarmHarvest = function (a) {
    this.statisticsRecorder.recordFarmHarvest(a);
    this.lifetimeStatistics.recordFarmHarvest(a);
  };
  StatisticsRecorder.prototype.recordDirectKill = function () {
    this.statisticsRecorder.recordDirectKill();
    this.lifetimeStatistics.recordDirectKill();
  };
  StatisticsRecorder.prototype.recordScrollKill = function () {
    this.statisticsRecorder.recordScrollKill();
    this.lifetimeStatistics.recordScrollKill();
  };
  StatisticsRecorder.prototype.$k = function () {
    this.statisticsRecorder.$k();
    this.lifetimeStatistics.$k();
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
  StatisticsRecorder.prototype.recordPlayedMilliseconds = function (a) {
    this.statisticsRecorder.recordPlayedMilliseconds(a);
    this.lifetimeStatistics.recordPlayedMilliseconds(a);
  };
  StatisticsRecorder.prototype.recordItemsSold = function (a) {
    this.statisticsRecorder.recordItemsSold(a);
    this.lifetimeStatistics.recordItemsSold(a);
  };
  StatisticsRecorder.prototype.recordItemFound = function (a) {
    this.statisticsRecorder.recordItemFound(a);
    this.lifetimeStatistics.recordItemFound(a);
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
