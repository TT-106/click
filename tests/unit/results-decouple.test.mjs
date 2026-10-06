// 胜利/离线面板（results.js）的单元差分（game 直连解耦切片）。
//
// 切片前：results.js 顶部 import { game }，直接读写 game.state.victoryCount、
// game.gameWon、game.offlineDuration、game.state.runStatistics、game.castles、
// game.state.achievements、game.monsterSprites 等，无法脱离引擎验证。
// 切片后：GameOverView/OfflineProgressView 构造时接收显式 deps（缺失即抛错），
// 本文件**不启动引擎、不构造 game**，只用最小 DOM 桩验证行为等价与调用顺序。
//
// 覆盖四件事：
//   1) 「重生」回调顺序：clearGameWon → recordGameEvent → restartRun；
//   2) 「继续」回调：视图只发出一个意图级操作 continueRun（顺序/复位/计数/放置/解锁/
//      盟友重建/视图刷新/保存的完整业务顺序归属运行时生命周期 module，不在视图内编排），
//      并锁定随机头像消费 76 次精灵查询；视图不产生额外的 Continue 事件；
//   3) 离线面板 onOfflineStart 读取注入基线，update 用差值刷新且同值不重写；
//   4) 缺少必需依赖时立即抛错——绑定遗漏不可能静默通过。
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeCoreMath, subscribeGameEvents, formatAmount } from '../../src/engine/modules/core/math.js';
import { initializeCoreBootstrapData } from '../../src/engine/modules/core/bootstrap-data.js';
import { initializeContentClasses } from '../../src/engine/modules/content/classes.js';
import { initializeViewsBase } from '../../src/engine/modules/views/base.js';
import { initializeViewsNavigation } from '../../src/engine/modules/views/navigation.js';
import { GameOverView, OfflineProgressView, initializeViewsResults } from '../../src/engine/modules/views/results.js';

initializeCoreMath();
initializeCoreBootstrapData();
initializeContentClasses();
initializeViewsBase();
initializeViewsNavigation();
initializeViewsResults();

// 最小 DOM：createElement 一律造新元素，appendChild/insertRow/insertCell 维护 children。
class Element {
  constructor() {
    this.style = {};
    this.children = [];
    this.className = '';
    this.id = '';
    this.innerHTML = '';
    this.onclick = null;
    this.src = '';
  }
  get firstChild() { return this.children[0]; }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); }
  insertRow(index) { return this.insertChild(index); }
  insertCell(index) { return this.insertChild(index); }
  insertChild(index) {
    const child = new Element();
    this.children.splice(index < 0 ? this.children.length : index, 0, child);
    return child;
  }
}

function withDocument(run) {
  const previous = globalThis.document;
  const elements = new Map([['gameOverTabContent', new Element()], ['offlineTabContent', new Element()]]);
  globalThis.document = {
    getElementById(id) { assert.ok(elements.has(id), `模板中缺少 ${id}`); return elements.get(id); },
    createElement: () => new Element(),
  };
  try { run(elements.get('gameOverTabContent'), elements.get('offlineTabContent')); }
  finally { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; }
}

function collect(element, result = []) {
  result.push(element);
  for (const child of element.children) collect(child, result);
  return result;
}
function findButton(root, label) {
  const match = collect(root).find(element => element.innerHTML.indexOf(label) === 0);
  assert.ok(match, `未找到按钮 ${label}`);
  return match;
}

function makeDeps(ops, sprites, overrides) {
  return Object.assign({
    readVictoryCount: () => 3,
    clearGameWon: () => ops.push('clearGameWon'),
    restartRun: () => ops.push('restartRun'),
    continueRun: () => ops.push('continueRun'),
    getMonsterSprite: monsterName => { sprites.push(monsterName); return { sourceX: 1, sourceY: 2 }; },
    readOfflineDuration: () => 7200000,
    readOfflineProcessed: () => 0,
    readRunStatistics: () => ({ directKills: 0, itemsFound: 0, itemsSold: 0, levelsCleared: 0, dungeonsCleared: 0, characterStunnedCount: 0 }),
    readAttackableCastleCount: () => 0,
    readAchievementClaimQueueLength: () => 0,
    finishOfflineProgress: () => ops.push('finishOfflineProgress'),
  }, overrides);
}

test('重生按钮：先清除胜利标记再记录事件，最后重启（顺序锁定）', () => withDocument(gameOver => {
  const timeline = [];
  const unsubscribe = subscribeGameEvents(event => timeline.push(`event:${event.category}:${event.action}`));
  try {
    const view = new GameOverView({}, makeDeps(timeline, []));
    view.update();
    findButton(gameOver, '重生').onclick();
  } finally { unsubscribe(); }
  assert.deepEqual(timeline, ['clearGameWon', 'event:Victory:Decision: Prestige', 'restartRun']);
}));

test('继续按钮：只发出一个意图级操作 continueRun；随机头像消费 76 次精灵查询', () => withDocument(gameOver => {
  const timeline = [];
  const sprites = [];
  const unsubscribe = subscribeGameEvents(event => timeline.push(`event:${event.category}:${event.action}`));
  try {
    const view = new GameOverView({}, makeDeps(timeline, sprites));
    view.update();
    assert.equal(sprites.length, 76);
    findButton(gameOver, '继续').onclick();
  } finally { unsubscribe(); }
  // 视图只跨一次 seam 表达玩家选择：不自行记录 Continue 事件，也不编排底层复位顺序
  assert.deepEqual(timeline, ['continueRun']);
}));

test('离线面板：onOfflineStart 读取注入基线，update 用差值刷新且同值不重写', () => withDocument((gameOver, offline) => {
  const runStatistics = { directKills: 10, itemsFound: 2, itemsSold: 3, levelsCleared: 4, dungeonsCleared: 5, characterStunnedCount: 6 };
  const attackableCastles = 7;
  const claimQueue = 8;
  const deps = makeDeps([], [], {
    readRunStatistics: () => runStatistics,
    readAttackableCastleCount: () => attackableCastles,
    readAchievementClaimQueueLength: () => claimQueue,
  });
  const view = new OfflineProgressView({}, deps);
  view.onOfflineStart();
  assert.equal(view.directKillsBaseline, 10);
  assert.equal(view.itemsFoundBaseline, 2);
  assert.equal(view.attackableCastlesBaseline, 7);
  assert.equal(view.achievementsBaseline, 8);
  runStatistics.directKills = 15;
  view.update();
  assert.equal(view.directKillsDeltaCell.innerHTML, formatAmount(5));
  view.directKillsDeltaCell.innerHTML = 'sentinel';
  view.update();
  assert.equal(view.directKillsDeltaCell.innerHTML, 'sentinel');
  runStatistics.directKills = 20;
  view.update();
  assert.equal(view.directKillsDeltaCell.innerHTML, formatAmount(10));
}));

test('缺少必需依赖时立即抛错，不回退到全局 game', () => {
  assert.throws(() => new GameOverView({}, {}), /缺少依赖/);
  assert.throws(() => new GameOverView({}, undefined), /缺少依赖/);
  assert.throws(() => new OfflineProgressView({}, { readVictoryCount: () => 0 }), /缺少依赖/);
});
