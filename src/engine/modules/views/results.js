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
export function GameOverView(a) {
  this.elementId = "gameOverTabContent";
  this.tabState = a;
  this.ql = false;
}
export function mountGameOver(a) {
  clearElementById(a.elementId);
  a = getElement(a.elementId);
  mountVictoryDecoration(a);
  a = createElement("div", a, null, "gameOverContentsDiv");
  createElement("div", a, null, "gameOverHeading").innerHTML = "末日危机2胜利!";
  var b = createElement("div", a, null, "gameOverBlurb");
  createElement("p", b, null, null).innerHTML = "你征服了每一座城堡,并将冰冻的世界变为绿色的国度.";
  createElement("p", b, null, null).innerHTML = "末日大陆上的人民终于从怪物的蹂躏下解放出来,不再需要战战兢兢的度日!";
  createElement("p", b, null, null).innerHTML = "你可以重新选择队友开始新的一轮征程,也可以用当前的队伍继续.";
  createElement("p", b, null, null).innerHTML = "重新开始征程你将获得以下加成:";
  var c = game.state.victoryCount,
    d = getNewlyUnlockedClasses(c),
    f = Math.min(40, c),
    g = Math.min(MAX_PRESTIGE_INVENTORY_BONUS, c),
    h;
  for (h = 0; h < d.length; h++) {
    createElement("p", b, null, "gameOverBonus").innerHTML = "解锁角色职业:" + d[h];
  }
  if (c <= MAX_PRESTIGE_INVENTORY_BONUS) {
    createElement("p", b, null, "gameOverBonus").innerHTML = "背包大小加成:" + g;
  }
  createElement("p", b, null, "gameOverBonus").innerHTML = "技能点加成:" + f;
  b = createElement("div", a, null, "gameOverBlurb");
  b = createElement("div", b, null, "upgradeButton");
  b.style.padding = "15px";
  b.style.textAlign = "center";
  b.innerHTML = "重生 - 以1级的队伍重新开始游戏.";
  b.onclick = function () {
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
    game.state.victoryStatistics.nm++;
    placePartyInWorld();
    unlockStartingRegion();
    game.allies.reset();
    game.view.reset();
    saveProgress(game.saves);
  };
}
export function getNewlyUnlockedClasses(a) {
  var b = [],
    c;
  for (c = 0; c < adventurerClasses.length; c++) {
    if (adventurerClasses[c].requiredVictories === a) {
      b.push(adventurerClasses[c].className);
    }
  }
  return b;
}
export function mountVictoryDecoration(a) {
  var b = createElement("table", a, null, "gameOverTableTopRow").insertRow(0),
    c;
  for (c = 0; 19 > c; c++) {
    appendRandomMonsterPortrait(b.insertCell(c));
  }
  c = createElement("table", a, null, "gameOverTableTopRow");
  c.style.top = "41px";
  b = c.insertRow(0);
  for (c = 0; 19 > c; c++) {
    appendRandomMonsterPortrait(b.insertCell(c));
  }
  c = createElement("table", a, null, "gameOverTableBottomRow");
  c.style.bottom = "41px";
  b = c.insertRow(0);
  for (c = 0; 19 > c; c++) {
    appendRandomMonsterPortrait(b.insertCell(c));
  }
  a = createElement("table", a, null, "gameOverTableBottomRow").insertRow(0);
  for (c = 0; 19 > c; c++) {
    appendRandomMonsterPortrait(a.insertCell(c));
  }
}
export function appendRandomMonsterPortrait(a) {
  var b = monsterSpriteDefinitions[randomInt(monsterSpriteDefinitions.length)],
    b = game.monsterSprites.getSprite(b.a);
  a = createElement("img", a, null, "characterImage");
  a.src = "images/Transparent.gif";
  a.style.background = "url('spritesheet/monsters.png') -" + b.sourceX + "px -" + (b.sourceY + 10) + "px";
  a.style.height = "30px";
  a.style.width = "52px";
}
export function OfflineProgressView(a) {
  this.elementId = "offlineTabContent";
  this.tabState = a;
  this.$l = this.progressFillElement = null;
  this.gu = 500;
  this.cachedFillWidth = -1;
  this.Mt = this.stunCountCell = this.$t = this.vm = this.Vm = this.Um = this.Tm = this.Qw = null;
  this.yu = this.Kk = this.Bu = this.Ck = this.Hk = this.Fk = this.Ek = this.vv = this.wy = this.JB = this.Iy = this.Fz = this.sA = this.nA = this.mA = this.HA = -1;
}
export function mountOfflineProgress(a) {
  var b = getElement(a.elementId);
  clearElement(b);
  var c = createElement("div", b, null, "offlineHeader"),
    d = a.Er(floorNumber(game.offlineDuration / 36E5), floorNumber(game.offlineDuration / 6E4 % 60), floorNumber(game.offlineDuration / 1E3 % 60));
  createElement("div", c, null, "offlineTitleText").innerHTML = "末日危机2";
  createElement("div", c, null, "offlineSubHeader").innerHTML = "离线:" + d;
  createElement("div", c, null, "offlineSubHeader").innerHTML = "正在清算你离开时发生了什么...";
  c = createElement("div", b, null, "offlineProgressBarContainer");
  c = createElement("div", c, null, "offlineProgressBar");
  a.progressFillElement = createElement("div", c, null, "offlineProgressSlider");
  c = createElement("div", b, null, "offlineProgressStatsContainer");
  a.fr(c);
  b = createElement("div", b, null, "offlineCancelButtonContainer");
  a.$l = createElement("div", b, null, "offlineCancelButton");
  a.$l.innerHTML = "跳过这个.我只是想杀杀怪物.";
  a.$l.onclick = function () {
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
    this.ql = false;
  };
  GameOverView.prototype.update = function () {
    if (!this.ql) {
      mountGameOver(this);
      this.ql = true;
    }
  };
  OfflineProgressView.prototype = new TabView();
  OfflineProgressView.prototype.onGameWon = function () {
    this.tabState.enabled = false;
    this.tabState.selected = false;
  };
  OfflineProgressView.prototype.onOfflineStart = function () {
    var a = this.tabState;
    a.enabled = true;
    a.selected = true;
    this.cachedFillWidth = -1;
    a = game.state.runStatistics;
    this.HA = a.directKills;
    this.mA = a.itemsFound;
    this.nA = a.itemsSold;
    this.sA = a.levelsCleared;
    this.Fz = a.dungeonsCleared;
    this.Iy = game.castles.attackableCastles.length;
    this.JB = a.characterStunnedCount;
    this.wy = game.state.achievements.claimQueue.length;
    this.yu = this.Kk = this.Bu = this.Ck = this.Hk = this.Fk = this.Ek = this.vv = -1;
  };
  OfflineProgressView.prototype.onOfflineFinish = function () {
    var a = this.tabState;
    a.enabled = false;
    a.selected = false;
    if (this.$l) {
      clearElementById(this.elementId);
      this.Mt = this.stunCountCell = this.$t = this.vm = this.Vm = this.Um = this.Tm = this.Qw = this.progressFillElement = this.$l = null;
    }
  };
  OfflineProgressView.prototype.reset = function () {
    this.tabState.enabled = false;
  };
  OfflineProgressView.prototype.update = function () {
    if (!this.$l) {
      mountOfflineProgress(this);
    }
    var a = Math.min(1, game.offlineProcessed / game.offlineDuration),
      a = this.gu * a;
    if (this.cachedFillWidth != a) {
      this.cachedFillWidth = a;
      this.progressFillElement.style.width = a + "px";
    }
    var b = game.state.runStatistics,
      a = b.directKills - this.HA,
      c = b.itemsFound - this.mA,
      d = b.itemsSold - this.nA,
      f = b.levelsCleared - this.sA,
      g = b.dungeonsCleared - this.Fz,
      h = game.castles.attackableCastles.length - this.Iy,
      b = /** @type {any} */ (b.characterStunnedCount - this.JB),
      l = game.state.achievements.claimQueue.length - this.wy;
    if (this.vv != a) {
      this.vv = a;
      this.Qw.innerHTML = formatAmount(a);
    }
    if (this.Ek != c) {
      this.Ek = c;
      this.Tm.innerHTML = formatAmount(c);
    }
    if (this.Fk != d) {
      this.Fk = d;
      this.Um.innerHTML = formatAmount(d);
    }
    if (this.Hk != f) {
      this.Hk = f;
      this.Vm.innerHTML = formatAmount(f);
    }
    if (this.Ck != g) {
      this.Ck = g;
      this.vm.innerHTML = formatAmount(g);
    }
    if (this.Bu != h) {
      this.Bu = h;
      this.$t.innerHTML = formatAmount(h);
    }
    if (this.Kk != b) {
      this.Kk = b;
      this.stunCountCell.innerHTML = formatAmount(b);
    }
    if (this.yu != l) {
      this.yu = l;
      this.Mt.innerHTML = formatAmount(l);
    }
  };
  OfflineProgressView.prototype.fr = function (a) {
    a = createElement("table", a, null, "centeredElement");
    var b = 0;
    this.Qw = (/** @type {any} */ (this)).getOfflineProgressCell(a, "杀死怪物", b++);
    this.Tm = (/** @type {any} */ (this)).getOfflineProgressCell(a, "找到道具", b++);
    this.Um = (/** @type {any} */ (this)).getOfflineProgressCell(a, "卖出道具", b++);
    this.Vm = (/** @type {any} */ (this)).getOfflineProgressCell(a, "清理关卡", b++);
    this.vm = (/** @type {any} */ (this)).getOfflineProgressCell(a, "清理地牢", b++);
    this.$t = (/** @type {any} */ (this)).getOfflineProgressCell(a, "攻击城堡", b++);
    this.stunCountCell = (/** @type {any} */ (this)).getOfflineProgressCell(a, "昏迷次数", b++);
    this.Mt = (/** @type {any} */ (this)).getOfflineProgressCell(a, "成就", b);
  };
  OfflineProgressView.prototype.getOfflineProgressCell = function (a, b, c) {
    a = a.insertRow(c);
    c = a.insertCell(0);
    c.className = "statisticsTableLabel";
    c.innerHTML = b;
    b = a.insertCell(1);
    b.style.textAlign = "right";
    b.style.width = "70px";
    return b;
  };
  OfflineProgressView.prototype.Er = function (a, b, c) {
    return (10 > a ? "0" : "") + a + ":" + (10 > b ? "0" : "") + b + ":" + (10 > c ? "0" : "") + c;
  };
}
