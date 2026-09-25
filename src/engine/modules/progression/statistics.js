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
  RunStatistics.prototype.jx = function () {
    this.tk = this.Sl = this.Nl = this.nk = this.Zk = this.xl = this.Ol = this.Gi = this.Ph = this.kl = this.Xj = this.El = this.ul = this.Gl = this.wl = this.hl = this.oj = this.Sd = this.minionKills = this.Dl = this.si = this.Wk = this.Xk = this.Rk = this.uk = this.wi = this.Mj = this.qn = this.Lk = this.On = 0;
  };
  RunStatistics.prototype.is = function () {
    this.On++;
  };
  RunStatistics.prototype.es = function () {
    this.qn++;
  };
  RunStatistics.prototype.Ur = function () {
    this.Lk++;
  };
  RunStatistics.prototype.$r = function () {
    this.Mj++;
  };
  RunStatistics.prototype.Vr = function () {
    this.wi++;
  };
  RunStatistics.prototype.Sr = function () {
    this.uk++;
  };
  RunStatistics.prototype.Xr = function () {
    this.Rk++;
  };
  RunStatistics.prototype.Yr = function (a) {
    this.Wk += a;
  };
  RunStatistics.prototype.dp = function (a) {
    this.Xk += a;
  };
  RunStatistics.prototype.Wr = function (a) {
    this.Sd += a;
  };
  RunStatistics.prototype.dt = function (a) {
    this.Sd = a;
  };
  RunStatistics.prototype.cp = function () {
    this.si++;
  };
  RunStatistics.prototype.gp = function () {
    this.Dl++;
  };
  RunStatistics.prototype.$k = function () {
    this.minionKills++;
  };
  RunStatistics.prototype.wx = function (a) {
    this.minionKills = a;
  };
  RunStatistics.prototype.bs = function () {
    this.kl++;
  };
  RunStatistics.prototype.Tr = function () {
    this.oj++;
  };
  RunStatistics.prototype.as = function () {
    this.hl++;
  };
  RunStatistics.prototype.ds = function () {
    this.wl++;
  };
  RunStatistics.prototype.gs = function () {
    this.Gl++;
  };
  RunStatistics.prototype.cs = function () {
    this.ul++;
  };
  RunStatistics.prototype.fs = function () {
    this.El++;
  };
  RunStatistics.prototype.fp = function (a) {
    this.Xj += a;
  };
  RunStatistics.prototype.Zr = function (a) {
    this.Ph += a;
  };
  RunStatistics.prototype.ep = function (a) {
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
  RunStatistics.prototype.hs = function () {
    this.Nl++;
  };
  RunStatistics.prototype.js = function () {
    this.Sl++;
  };
  RunStatistics.prototype.Rr = function () {
    this.tk++;
  };
  LifetimeStatistics.prototype = new RunStatistics();
  LifetimeStatistics.prototype.jx = function () {
    console.log("Reset invoked on total statistics. Not resetting anything.");
  };
  StatisticsRecorder.prototype.is = function () {
    this.statisticsRecorder.is();
    this.lifetimeStatistics.is();
  };
  StatisticsRecorder.prototype.Ur = function () {
    this.statisticsRecorder.Ur();
    this.lifetimeStatistics.Ur();
  };
  StatisticsRecorder.prototype.es = function () {
    this.statisticsRecorder.es();
    this.lifetimeStatistics.es();
  };
  StatisticsRecorder.prototype.$r = function () {
    this.statisticsRecorder.$r();
    this.lifetimeStatistics.$r();
  };
  StatisticsRecorder.prototype.Vr = function () {
    this.statisticsRecorder.Vr();
    this.lifetimeStatistics.Vr();
  };
  StatisticsRecorder.prototype.Sr = function () {
    this.statisticsRecorder.Sr();
    this.lifetimeStatistics.Sr();
  };
  StatisticsRecorder.prototype.Yr = function (a) {
    this.statisticsRecorder.Yr(a);
    this.lifetimeStatistics.Yr(a);
  };
  StatisticsRecorder.prototype.dp = function (a) {
    this.statisticsRecorder.dp(a);
    this.lifetimeStatistics.dp(a);
  };
  StatisticsRecorder.prototype.Wr = function (a) {
    this.statisticsRecorder.Wr(a);
    this.lifetimeStatistics.Wr(a);
  };
  StatisticsRecorder.prototype.cp = function () {
    this.statisticsRecorder.cp();
    this.lifetimeStatistics.cp();
  };
  StatisticsRecorder.prototype.gp = function () {
    this.statisticsRecorder.gp();
    this.lifetimeStatistics.gp();
  };
  StatisticsRecorder.prototype.$k = function () {
    this.statisticsRecorder.$k();
    this.lifetimeStatistics.$k();
  };
  StatisticsRecorder.prototype.bs = function () {
    this.statisticsRecorder.bs();
    this.lifetimeStatistics.bs();
  };
  StatisticsRecorder.prototype.Tr = function () {
    this.statisticsRecorder.Tr();
    this.lifetimeStatistics.Tr();
  };
  StatisticsRecorder.prototype.as = function () {
    this.statisticsRecorder.as();
    this.lifetimeStatistics.as();
  };
  StatisticsRecorder.prototype.ds = function () {
    this.statisticsRecorder.ds();
    this.lifetimeStatistics.ds();
  };
  StatisticsRecorder.prototype.gs = function () {
    this.statisticsRecorder.gs();
    this.lifetimeStatistics.gs();
  };
  StatisticsRecorder.prototype.cs = function () {
    this.statisticsRecorder.cs();
    this.lifetimeStatistics.cs();
  };
  StatisticsRecorder.prototype.fs = function () {
    this.statisticsRecorder.fs();
    this.lifetimeStatistics.fs();
  };
  StatisticsRecorder.prototype.Xr = function () {
    this.statisticsRecorder.Xr();
    this.lifetimeStatistics.Xr();
  };
  StatisticsRecorder.prototype.fp = function (a) {
    this.statisticsRecorder.fp(a);
    this.lifetimeStatistics.fp(a);
  };
  StatisticsRecorder.prototype.Zr = function (a) {
    this.statisticsRecorder.Zr(a);
    this.lifetimeStatistics.Zr(a);
  };
  StatisticsRecorder.prototype.ep = function (a) {
    this.statisticsRecorder.ep(a);
    this.lifetimeStatistics.ep(a);
  };
  StatisticsRecorder.prototype.hs = function () {
    this.statisticsRecorder.hs();
    this.lifetimeStatistics.hs();
  };
  StatisticsRecorder.prototype.js = function () {
    this.statisticsRecorder.js();
    this.lifetimeStatistics.js();
  };
  StatisticsRecorder.prototype.Rr = function () {
    this.statisticsRecorder.Rr();
    this.lifetimeStatistics.Rr();
  };
}
