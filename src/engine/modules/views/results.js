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
export function GameOverView(a) {
  this.elementId = "gameOverTabContent";
  this.tabState = a;
  this.gameOverMounted = false;
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
    game.state.victoryStatistics.currentContinueCount++;
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
    b = game.monsterSprites.getSprite(b.name);
  a = createElement("img", a, null, "characterImage");
  a.src = "images/Transparent.gif";
  a.style.background = "url('spritesheet/monsters.png') -" + b.sourceX + "px -" + (b.sourceY + 10) + "px";
  a.style.height = "30px";
  a.style.width = "52px";
}
export function OfflineProgressView(a) {
  this.elementId = "offlineTabContent";
  this.tabState = a;
  this.cancelButton = this.progressFillElement = null;
  this.progressBarWidth = 500;
  this.cachedFillWidth = -1;
  this.achievementsDeltaCell = this.stunnedCountDeltaCell = this.attackableCastlesDeltaCell = this.dungeonsClearedDeltaCell = this.levelsClearedDeltaCell = this.itemsSoldDeltaCell = this.itemsFoundDeltaCell = this.directKillsDeltaCell = null;
  this.cachedAchievementsDelta = this.cachedStunnedCountDelta = this.cachedAttackableCastlesDelta = this.cachedDungeonsClearedDelta = this.cachedLevelsClearedDelta = this.cachedItemsSoldDelta = this.cachedItemsFoundDelta = this.cachedDirectKillsDelta = this.achievementsBaseline = this.stunnedCountBaseline = this.attackableCastlesBaseline = this.dungeonsClearedBaseline = this.levelsClearedBaseline = this.itemsSoldBaseline = this.itemsFoundBaseline = this.directKillsBaseline = -1;
}
export function mountOfflineProgress(a) {
  var b = getElement(a.elementId);
  clearElement(b);
  var c = createElement("div", b, null, "offlineHeader"),
    d = a.formatHoursMinutesSeconds(floorNumber(game.offlineDuration / 36E5), floorNumber(game.offlineDuration / 6E4 % 60), floorNumber(game.offlineDuration / 1E3 % 60));
  createElement("div", c, null, "offlineTitleText").innerHTML = "末日危机2";
  createElement("div", c, null, "offlineSubHeader").innerHTML = "离线:" + d;
  createElement("div", c, null, "offlineSubHeader").innerHTML = "正在清算你离开时发生了什么...";
  c = createElement("div", b, null, "offlineProgressBarContainer");
  c = createElement("div", c, null, "offlineProgressBar");
  a.progressFillElement = createElement("div", c, null, "offlineProgressSlider");
  c = createElement("div", b, null, "offlineProgressStatsContainer");
  a.buildOfflineProgressTable(c);
  b = createElement("div", b, null, "offlineCancelButtonContainer");
  a.cancelButton = createElement("div", b, null, "offlineCancelButton");
  a.cancelButton.innerHTML = "跳过这个.我只是想杀杀怪物.";
  a.cancelButton.onclick = function () {
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
    var a = this.tabState;
    a.enabled = true;
    a.selected = true;
    this.cachedFillWidth = -1;
    a = game.state.runStatistics;
    this.directKillsBaseline = a.directKills;
    this.itemsFoundBaseline = a.itemsFound;
    this.itemsSoldBaseline = a.itemsSold;
    this.levelsClearedBaseline = a.levelsCleared;
    this.dungeonsClearedBaseline = a.dungeonsCleared;
    this.attackableCastlesBaseline = game.castles.attackableCastles.length;
    this.stunnedCountBaseline = a.characterStunnedCount;
    this.achievementsBaseline = game.state.achievements.claimQueue.length;
    this.cachedAchievementsDelta = this.cachedStunnedCountDelta = this.cachedAttackableCastlesDelta = this.cachedDungeonsClearedDelta = this.cachedLevelsClearedDelta = this.cachedItemsSoldDelta = this.cachedItemsFoundDelta = this.cachedDirectKillsDelta = -1;
  };
  OfflineProgressView.prototype.onOfflineFinish = function () {
    var a = this.tabState;
    a.enabled = false;
    a.selected = false;
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
      c = b.itemsFound - this.itemsFoundBaseline,
      d = b.itemsSold - this.itemsSoldBaseline,
      f = b.levelsCleared - this.levelsClearedBaseline,
      g = b.dungeonsCleared - this.dungeonsClearedBaseline,
      h = game.castles.attackableCastles.length - this.attackableCastlesBaseline,
      b = /** @type {any} */ (b.characterStunnedCount - this.stunnedCountBaseline),
      l = game.state.achievements.claimQueue.length - this.achievementsBaseline;
    if (this.cachedDirectKillsDelta != a) {
      this.cachedDirectKillsDelta = a;
      this.directKillsDeltaCell.innerHTML = formatAmount(a);
    }
    if (this.cachedItemsFoundDelta != c) {
      this.cachedItemsFoundDelta = c;
      this.itemsFoundDeltaCell.innerHTML = formatAmount(c);
    }
    if (this.cachedItemsSoldDelta != d) {
      this.cachedItemsSoldDelta = d;
      this.itemsSoldDeltaCell.innerHTML = formatAmount(d);
    }
    if (this.cachedLevelsClearedDelta != f) {
      this.cachedLevelsClearedDelta = f;
      this.levelsClearedDeltaCell.innerHTML = formatAmount(f);
    }
    if (this.cachedDungeonsClearedDelta != g) {
      this.cachedDungeonsClearedDelta = g;
      this.dungeonsClearedDeltaCell.innerHTML = formatAmount(g);
    }
    if (this.cachedAttackableCastlesDelta != h) {
      this.cachedAttackableCastlesDelta = h;
      this.attackableCastlesDeltaCell.innerHTML = formatAmount(h);
    }
    if (this.cachedStunnedCountDelta != b) {
      this.cachedStunnedCountDelta = b;
      this.stunnedCountDeltaCell.innerHTML = formatAmount(b);
    }
    if (this.cachedAchievementsDelta != l) {
      this.cachedAchievementsDelta = l;
      this.achievementsDeltaCell.innerHTML = formatAmount(l);
    }
  };
  OfflineProgressView.prototype.buildOfflineProgressTable = function (a) {
    a = createElement("table", a, null, "centeredElement");
    var b = 0,
      self = /** @type {OfflineProgressViewWithCells} */ (/** @type {unknown} */ (this));
    this.directKillsDeltaCell = self.getOfflineProgressCell(a, "杀死怪物", b++);
    this.itemsFoundDeltaCell = self.getOfflineProgressCell(a, "找到道具", b++);
    this.itemsSoldDeltaCell = self.getOfflineProgressCell(a, "卖出道具", b++);
    this.levelsClearedDeltaCell = self.getOfflineProgressCell(a, "清理关卡", b++);
    this.dungeonsClearedDeltaCell = self.getOfflineProgressCell(a, "清理地牢", b++);
    this.attackableCastlesDeltaCell = self.getOfflineProgressCell(a, "攻击城堡", b++);
    this.stunnedCountDeltaCell = self.getOfflineProgressCell(a, "昏迷次数", b++);
    this.achievementsDeltaCell = self.getOfflineProgressCell(a, "成就", b);
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
  OfflineProgressView.prototype.formatHoursMinutesSeconds = function (a, b, c) {
    return (10 > a ? "0" : "") + a + ":" + (10 > b ? "0" : "") + b + ":" + (10 > c ? "0" : "") + c;
  };
}
