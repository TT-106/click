/** 本轮、累计统计与事件记账。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
export function RunStatistics() {
  this.tk = this.Sl = this.Nl = this.nk = this.Zk = this.xl = this.Ol = this.Gi = this.Ph = this.kl = this.Xj = this.El = this.ul = this.Gl = this.wl = this.hl = this.oj = this.Sd = this.minionKills = this.Dl = this.si = this.Wk = this.Xk = this.Rk = this.uk = this.wi = this.Mj = this.qn = this.Lk = this.On = 0;
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
    this.tk = this.Sl = this.Nl = this.nk = this.Zk = this.xl = this.Ol = this.Gi = this.Ph = this.kl = this.Xj = this.El = this.ul = this.Gl = this.wl = this.hl = this.oj = this.Sd = this.minionKills = this.Dl = this.si = this.Wk = this.Xk = this.Rk = this.uk = this.wi = this.Mj = this.qn = this.Lk = this.On = 0;
  };
  RunStatistics.prototype.recordTurn = function () {
    this.On++;
  };
  RunStatistics.prototype.recordRoomCleared = function () {
    this.qn++;
  };
  RunStatistics.prototype.recordDoorOpened = function () {
    this.Lk++;
  };
  RunStatistics.prototype.$r = function () {
    this.Mj++;
  };
  RunStatistics.prototype.recordDungeonCleared = function () {
    this.wi++;
  };
  RunStatistics.prototype.recordCastleConquered = function () {
    this.uk++;
  };
  RunStatistics.prototype.recordFarmPurchased = function () {
    this.Rk++;
  };
  RunStatistics.prototype.recordGoldFromItems = function (a) {
    this.Wk += a;
  };
  RunStatistics.prototype.recordGoldFromMonsters = function (a) {
    this.Xk += a;
  };
  RunStatistics.prototype.recordFarmHarvest = function (a) {
    this.Sd += a;
  };
  RunStatistics.prototype.setFarmedKills = function (a) {
    this.Sd = a;
  };
  RunStatistics.prototype.recordDirectKill = function () {
    this.si++;
  };
  RunStatistics.prototype.recordScrollKill = function () {
    this.Dl++;
  };
  RunStatistics.prototype.$k = function () {
    this.minionKills++;
  };
  RunStatistics.prototype.setMinionKills = function (a) {
    this.minionKills = a;
  };
  RunStatistics.prototype.recordMinionSummoned = function () {
    this.kl++;
  };
  RunStatistics.prototype.recordCharacterStunned = function () {
    this.oj++;
  };
  RunStatistics.prototype.recordMeleeAttack = function () {
    this.hl++;
  };
  RunStatistics.prototype.recordRangedAttack = function () {
    this.wl++;
  };
  RunStatistics.prototype.recordSpellCast = function () {
    this.Gl++;
  };
  RunStatistics.prototype.recordPotionUsed = function () {
    this.ul++;
  };
  RunStatistics.prototype.recordScrollUsed = function () {
    this.El++;
  };
  RunStatistics.prototype.recordPlayedMilliseconds = function (a) {
    this.Xj += a;
  };
  RunStatistics.prototype.recordItemsSold = function (a) {
    this.Ph += a;
  };
  RunStatistics.prototype.recordItemFound = function (a) {
    this.Gi++;
    switch (a.uf()) {
      case 1:
        this.Ol++;
        break;
      case 2:
        this.xl++;
        break;
      case 3:
        this.Zk++;
        break;
      case 4:
        this.nk++;
    }
  };
  RunStatistics.prototype.recordTreasureChestLooted = function () {
    this.Nl++;
  };
  RunStatistics.prototype.recordWeaponRackLooted = function () {
    this.Sl++;
  };
  RunStatistics.prototype.recordBookcaseLooted = function () {
    this.tk++;
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
