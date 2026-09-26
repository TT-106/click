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
  this.SD = "lastSaveDiv";
  this.tr = -1;
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
 * @property {function(): void} fr 重建统计表 DOM。
 * @property {function(number, number, number): string} Er 拼时、分、秒。
 * @property {function(number): void} St 在表尾插入一行表头。
 * @property {function(HTMLTableRowElement, number): HTMLTableCellElement} getStatisticCell 取指定行的单元格。
 */
export function StatisticsView() {
  this.elementId = "statisticsContainer";
  this.visible = true;
  this.st = null;
  this.Jx = this.Au = this.Ux = this.bv = this.fy = this.Cv = this.my = this.Yv = this.Vx = this.Ek = this.Wx = this.Fk = this.iy = this.Iv = this.dy = this.Av = this.jy = this.Nv = this.ey = this.Bv = this.Yx = this.nv = this.Mx = this.Ku = this.Qx = this.Tu = this.Zx = this.Ik = this.hy = this.Hv = this.Nx = this.Qu = this.Sx = this.Xu = this.Tx = this.Yu = this.Kx = this.Eu = this.ny = this.$v = this.ky = this.Wv = this.$x = this.qv = this.Rx = this.Uu = this.Lx = this.Hu = this.Px = this.Ck = this.Xx = this.Hk = this.gy = this.Ev = this.Ox = this.Ru = this.ly = this.Xv = this.cy = this.by = this.ay = this.yv = this.xv = this.wv = this.Zv = -1;
  this.UB = this.Fy = this.eC = this.Vz = this.oC = this.eB = this.wC = this.DC = this.fC = this.Tm = this.gC = this.Um = this.rC = this.nB = this.mC = this.UA = this.sC = this.BB = this.nC = this.dB = this.iC = this.zA = this.tC = this.aj = this.aC = this.Iz = this.jC = this.Ap = this.qC = this.lB = this.YB = this.mz = this.cC = this.Qz = this.dC = this.Rz = this.VB = this.Ky = this.yC = this.LC = this.uC = this.AC = this.kC = this.GA = this.bC = this.Jz = this.WB = this.Oy = this.$B = this.vm = this.hC = this.Vm = this.ZB = this.Dz = this.pC = this.jB = this.vC = this.CC = this.SA = this.lC = this.xC = null;
  this.AA = 36E5;
}
export function appendStatisticsRow(a, b, c) {
  a = a.st.insertRow(c);
  c = a.insertCell(0);
  c.className = "statisticsTableLabel";
  c.innerHTML = b;
  return a;
}
export function OptionsView() {
  this.elementId = "gameOptionsContainer";
  this.visible = true;
  this.tA = false;
}
export function initializeViewsInformation() {
  SaveControlsView.prototype = new View();
  SaveControlsView.prototype.reset = function () {
    this.tr = -1;
  };
  SaveControlsView.prototype.update = function () {
    var a;
    a = game.saves.lastSavedAt;
    if (this.tr !== a && 0 < a) {
      this.tr = a;
      setElementHtml(this.SD, "最后保存于: " + new Date(this.tr).toLocaleTimeString());
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
    this.Jx = this.Au = this.Ux = this.bv = this.fy = this.Cv = this.my = this.Yv = this.Vx = this.Ek = this.Wx = this.Fk = this.iy = this.Iv = this.dy = this.Av = this.jy = this.Nv = this.ey = this.Bv = this.Yx = this.nv = this.Mx = this.Ku = this.Qx = this.Tu = this.Zx = this.Ik = this.hy = this.Hv = this.Nx = this.Qu = this.Sx = this.Xu = this.Tx = this.Yu = this.Kx = this.Eu = this.ny = this.$v = this.ky = this.Wv = this.$x = this.qv = this.Rx = this.Uu = this.Lx = this.Hu = this.Px = this.Ck = this.Xx = this.Hk = this.Ox = this.Ru = this.gy = this.Ev = this.ly = this.Xv = this.cy = this.by = this.ay = this.yv = this.xv = this.wv = this.Zv = -1;
    this.fr();
  };
  StatisticsView.prototype.update = /** @this {StatisticsView & MountedStatisticsViewMethods} */ function () {
    if (!this.st) {
      this.fr();
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
    if (this.Zv != c) {
      this.Zv = c;
      this.xC.innerHTML = formatAmount(c);
    }
    if (this.Xv != h) {
      this.Xv = h;
      this.CC.innerHTML = formatAmount(h);
    }
    if (this.ly != g) {
      this.ly = g;
      this.vC.innerHTML = formatAmount(g);
    }
    if (this.Ev != n) {
      this.Ev = n;
      this.jB.innerHTML = formatAmount(n);
    }
    if (this.gy != l) {
      this.gy = l;
      this.pC.innerHTML = formatAmount(l);
    }
    if (this.Ru != s) {
      this.Ru = s;
      this.Dz.innerHTML = formatAmount(s);
    }
    if (this.Ox != p) {
      this.Ox = p;
      this.ZB.innerHTML = formatAmount(p);
    }
    if (this.Hk != y) {
      this.Hk = y;
      this.Vm.innerHTML = formatAmount(y);
    }
    if (this.Xx != u) {
      this.Xx = u;
      this.hC.innerHTML = formatAmount(u);
    }
    if (this.Ck != C) {
      this.Ck = C;
      this.vm.innerHTML = formatAmount(C);
    }
    if (this.Px != A) {
      this.Px = A;
      this.$B.innerHTML = formatAmount(A);
    }
    if (this.Hu != D) {
      this.Hu = D;
      this.Oy.innerHTML = formatAmount(D) + "/" + game.castles.pd.length;
    }
    if (this.Lx != v) {
      this.Lx = v;
      this.WB.innerHTML = formatAmount(v);
    }
    if (this.Uu != I) {
      this.Uu = I;
      this.Jz.innerHTML = formatAmount(I);
    }
    if (this.Rx != N) {
      this.Rx = N;
      this.bC.innerHTML = formatAmount(N);
    }
    if (this.qv != z) {
      this.qv = z;
      this.GA.innerHTML = formatAmount(z);
    }
    if (this.$x != x) {
      this.$x = x;
      this.kC.innerHTML = formatAmount(x);
    }
    if (this.Wv != J) {
      this.Wv = J;
      this.AC.innerHTML = formatAmount(J);
    }
    if (this.ky != O) {
      this.ky = O;
      this.uC.innerHTML = formatAmount(O);
    }
    if (this.$v != Q) {
      this.$v = Q;
      this.LC.innerHTML = formatAmount(Q);
    }
    if (this.ny != la) {
      this.ny = la;
      this.yC.innerHTML = formatAmount(la);
    }
    if (this.Eu != na) {
      this.Eu = na;
      this.Ky.innerHTML = formatAmount(na);
    }
    if (this.Kx != V) {
      this.Kx = V;
      this.VB.innerHTML = formatAmount(V);
    }
    if (this.Yu != H) {
      this.Yu = H;
      this.Rz.innerHTML = formatAmount(H);
    }
    if (this.Tx != K) {
      this.Tx = K;
      this.dC.innerHTML = formatAmount(K);
    }
    if (this.Xu != da) {
      this.Xu = da;
      this.Qz.innerHTML = formatAmount(da);
    }
    if (this.Sx != S) {
      this.Sx = S;
      this.cC.innerHTML = formatAmount(S);
    }
    if (this.Qu != ia) {
      this.Qu = ia;
      this.mz.innerHTML = formatAmount(ia);
    }
    if (this.Nx != W) {
      this.Nx = W;
      this.YB.innerHTML = formatAmount(W);
    }
    if (this.Hv != va) {
      this.Hv = va;
      this.lB.innerHTML = formatAmount(va);
    }
    if (this.hy != ea) {
      this.hy = ea;
      this.qC.innerHTML = formatAmount(ea);
    }
    if (this.Ik != Fb) {
      this.Ik = Fb;
      this.Ap.innerHTML = formatAmount(Fb);
    }
    if (this.Zx != yb) {
      this.Zx = yb;
      this.jC.innerHTML = formatAmount(yb);
    }
    if (this.Tu != T) {
      this.Tu = T;
      this.Iz.innerHTML = formatAmount(T);
    }
    if (this.Qx != pa) {
      this.Qx = pa;
      this.aC.innerHTML = formatAmount(pa);
    }
    if (this.Ku != Ca) {
      this.Ku = Ca;
      this.aj.innerHTML = formatAmount(Ca);
    }
    if (this.Mx != X) {
      this.Mx = X;
      this.tC.innerHTML = formatAmount(X);
    }
    if (this.nv != ta) {
      this.nv = ta;
      this.zA.innerHTML = formatAmount(ta);
    }
    if (this.Yx != qa) {
      this.Yx = qa;
      this.iC.innerHTML = formatAmount(qa);
    }
    if (this.Bv != Gb) {
      this.Bv = Gb;
      this.dB.innerHTML = formatAmount(Gb);
    }
    if (this.ey != eb) {
      this.ey = eb;
      this.nC.innerHTML = formatAmount(eb);
    }
    if (this.Nv != ub) {
      this.Nv = ub;
      this.BB.innerHTML = formatAmount(ub);
    }
    if (this.jy != Da) {
      this.jy = Da;
      this.sC.innerHTML = formatAmount(Da);
    }
    if (this.Av != Ea) {
      this.Av = Ea;
      this.UA.innerHTML = formatAmount(Ea);
    }
    if (this.dy != mb) {
      this.dy = mb;
      this.mC.innerHTML = formatAmount(mb);
    }
    if (this.Iv != wa) {
      this.Iv = wa;
      this.nB.innerHTML = formatAmount(wa);
    }
    if (this.iy != La) {
      this.iy = La;
      this.rC.innerHTML = formatAmount(La);
    }
    if (this.Fk != ha) {
      this.Fk = ha;
      this.Um.innerHTML = formatAmount(ha);
    }
    if (this.Wx != Fa) {
      this.Wx = Fa;
      this.gC.innerHTML = formatAmount(Fa);
    }
    if (this.Ek != Ga) {
      this.Ek = Ga;
      this.Tm.innerHTML = formatAmount(Ga);
    }
    if (this.Vx != ja) {
      this.Vx = ja;
      this.fC.innerHTML = formatAmount(ja);
    }
    if (this.Yv != za) {
      this.Yv = za;
      this.DC.innerHTML = formatAmount(za);
    }
    if (this.my != bb) {
      this.my = bb;
      this.wC.innerHTML = formatAmount(bb);
    }
    if (this.Cv != fb) {
      this.Cv = fb;
      this.eB.innerHTML = formatAmount(fb);
    }
    if (this.fy != nb) {
      this.fy = nb;
      this.oC.innerHTML = formatAmount(nb);
    }
    if (this.bv != Ua) {
      this.bv = Ua;
      this.Vz.innerHTML = formatAmount(Ua);
    }
    if (this.Ux != cb) {
      this.Ux = cb;
      this.eC.innerHTML = formatAmount(cb);
    }
    if (this.Au != a) {
      this.Au = a;
      this.Fy.innerHTML = formatAmount(a);
    }
    if (this.Jx != b) {
      this.Jx = b;
      this.UB.innerHTML = formatAmount(b);
    }
    c = floorNumber(d / this.AA);
    g = floorNumber(d / 6E4 % 60);
    d = floorNumber(d / 1E3 % 60);
    h = floorNumber(f / this.AA);
    l = floorNumber(f / 6E4 % 60);
    f = floorNumber(f / 1E3 % 60);
    if (this.ay != c || this.by != g || this.cy != d) {
      this.ay = c;
      this.by = g;
      this.cy = d;
      this.lC.innerHTML = this.Er(c, g, d);
    }
    if (this.wv != h || this.xv != l || this.yv != f) {
      this.wv = h;
      this.xv = l;
      this.yv = f;
      this.SA.innerHTML = this.Er(h, l, f);
    }
  };
  StatisticsView.prototype.Er = function (a, b, c) {
    return (10 > a ? "0" : "") + a + ":" + (10 > b ? "0" : "") + b + ":" + (10 > c ? "0" : "") + c;
  };
  StatisticsView.prototype.fr = /** @this {StatisticsView & MountedStatisticsViewMethods} */ function () {
    clearElementById(this.elementId);
    var container = /** @type {HTMLDivElement} */ (getElement(this.elementId));
    createElement("div", container, null, "sectionTitle").innerHTML = "统计";
    this.st = createElement("table", container, null, "statisticsTable");
    var rowIndex = 0;
    this.St(rowIndex++);
    var row = appendStatisticsRow(this, "游戏胜利:", rowIndex++);
    this.getStatisticCell(row, 1).innerHTML = "无";
    this.xC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "游戏时间:", rowIndex++);
    this.SA = this.getStatisticCell(row, 1);
    this.lC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "游戏回合:", rowIndex++);
    this.CC = this.getStatisticCell(row, 1);
    this.vC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "打开大门:", rowIndex++);
    this.Dz = this.getStatisticCell(row, 1);
    this.ZB = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "清理房间:", rowIndex++);
    this.jB = this.getStatisticCell(row, 1);
    this.pC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "清理管卡:", rowIndex++);
    this.Vm = this.getStatisticCell(row, 1);
    this.hC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "清理地牢:", rowIndex++);
    this.vm = this.getStatisticCell(row, 1);
    this.$B = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "征服城堡:", rowIndex++);
    this.Oy = this.getStatisticCell(row, 1);
    this.WB = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "购买农场:", rowIndex++);
    this.Jz = this.getStatisticCell(row, 1);
    this.bC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "召唤宠物:", rowIndex++);
    this.GA = this.getStatisticCell(row, 1);
    this.kC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "财宝箱:", rowIndex++);
    this.AC = this.getStatisticCell(row, 1);
    this.uC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "武器架:", rowIndex++);
    this.LC = this.getStatisticCell(row, 1);
    this.yC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "书架:", rowIndex++);
    this.Ky = this.getStatisticCell(row, 1);
    this.VB = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "怪物黄金:", rowIndex++);
    this.Rz = this.getStatisticCell(row, 1);
    this.dC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "道具黄金:", rowIndex++);
    this.Qz = this.getStatisticCell(row, 1);
    this.cC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "直接杀死:", rowIndex++);
    this.mz = this.getStatisticCell(row, 1);
    this.YB = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "卷轴杀死:", rowIndex++);
    this.lB = this.getStatisticCell(row, 1);
    this.qC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "宠物杀死:", rowIndex++);
    this.Ap = this.getStatisticCell(row, 1);
    this.jC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "农场杀戮:", rowIndex++);
    this.Iz = this.getStatisticCell(row, 1);
    this.aC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "昏迷次数:", rowIndex++);
    this.aj = this.getStatisticCell(row, 1);
    this.tC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "近战攻击:", rowIndex++);
    this.zA = this.getStatisticCell(row, 1);
    this.iC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "远程攻击:", rowIndex++);
    this.dB = this.getStatisticCell(row, 1);
    this.nC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "施放法术:", rowIndex++);
    this.BB = this.getStatisticCell(row, 1);
    this.sC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "使用药剂:", rowIndex++);
    this.UA = this.getStatisticCell(row, 1);
    this.mC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "使用卷轴:", rowIndex++);
    this.nB = this.getStatisticCell(row, 1);
    this.rC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "卖出道具:", rowIndex++);
    this.Um = this.getStatisticCell(row, 1);
    this.gC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "找到道具:", rowIndex++);
    this.Tm = this.getStatisticCell(row, 1);
    this.fC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "罕见道具:", rowIndex++);
    this.DC = this.getStatisticCell(row, 1);
    this.wC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "稀有道具:", rowIndex++);
    this.eB = this.getStatisticCell(row, 1);
    this.oC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "历史道具:", rowIndex++);
    this.Vz = this.getStatisticCell(row, 1);
    this.eC = this.getStatisticCell(row, 2);
    row = appendStatisticsRow(this, "远古道具:", rowIndex++);
    this.Fy = this.getStatisticCell(row, 1);
    this.UB = this.getStatisticCell(row, 2);
  };
  StatisticsView.prototype.St = function (a) {
    a = this.st.insertRow(a);
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
    if (!this.tA) {
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
      this.tA = true;
    }
  };
}
