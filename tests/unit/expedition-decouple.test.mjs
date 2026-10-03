// 远征视图（views/expedition.js）的单元差分（game 直连解耦切片）。
//
// 切片前：expedition.js 顶部 import { game }，直接读 game.state / game.animations /
// game.worldActive / game.currentDungeon / game.currentCastle / game.scrolls / game.potions，
// 无法脱离引擎验证。
// 切片后：依赖经 bindExpeditionViews(...) 注入（缺字段或未绑定即抛错），本文件**不启动引擎、
// 不构造 game**，只用最小 DOM 桩验证 fail-loud 与真实读取路径。
//
// 覆盖四件事：
//   1) 未绑定就使用视图 → 立刻抛错；
//   2) bindExpeditionViews 缺字段 → 抛错，且失败不产生半绑定；
//   3) CurrencyView.update 的 DOM 随注入 party 变化，同值第二次不重写（缓存字段）；
//   4) DungeonNotificationView 的 readDungeonHeader 每次现读，isWorldActive 可变标量现读。
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAmount } from '../../src/engine/modules/core/math.js';
import { initializeViewsBase } from '../../src/engine/modules/views/base.js';
import { CurrencyView, DungeonNotificationView, initializeViewsExpedition, bindExpeditionViews } from '../../src/engine/modules/views/expedition.js';

initializeViewsBase();
initializeViewsExpedition();

// 最小 DOM：createElement 一律造新元素，appendChild/insertRow/insertCell 维护 children。
class Element {
  constructor() {
    this.style = {};
    this.children = [];
    this.className = '';
    this.id = '';
    this.innerHTML = '';
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
  const elements = new Map([['expCell', new Element()], ['goldAmountCell', new Element()], ['killsCountCell', new Element()]]);
  globalThis.document = {
    getElementById(id) { assert.ok(elements.has(id), `模板中缺少 ${id}`); return elements.get(id); },
    createElement: () => new Element(),
  };
  try { run(elements); }
  finally { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; }
}

// 注意：本文件依赖 node:test 默认的串行执行顺序——fail-loud 用例必须先于任何绑定用例。
test('未调用 bindExpeditionViews 就使用视图 → 立刻抛错（fail-loud）', () => {
  assert.throws(() => new DungeonNotificationView().isVisible(), /尚未绑定依赖/);
  assert.throws(() => new CurrencyView().update(), /尚未绑定依赖/);
});

test('bindExpeditionViews 缺字段 → 抛错，且不产生半绑定', () => {
  assert.throws(() => bindExpeditionViews({}), /缺少依赖字段 readState/);
  assert.throws(() => bindExpeditionViews({
    readState: () => ({}),
    readAnimation: () => ({}),
    isWorldActive: () => false,
    readDungeonHeader: () => ({ name: '', level: 0 }),
    readScrollList: () => [],
    readPotionList: () => [],
  }), /缺少依赖字段 removePotion/);
  // 上一条缺 removePotion 的绑定必须整体失败：此时仍未绑定，使用视图仍抛错。
  assert.throws(() => new CurrencyView().update(), /尚未绑定依赖/);
});

test('CurrencyView.update：DOM 随注入 party 变化，同值第二次不重复写', () => {
  const party = { experiencePoints: 100, gold: 200, kills: 3 };
  bindExpeditionViews({
    readState: () => ({ party }),
    readAnimation: () => { throw new Error('CurrencyView 不应读取动画'); },
    isWorldActive: () => false,
    readDungeonHeader: () => ({ name: '', level: 0 }),
    readScrollList: () => [],
    readPotionList: () => [],
    removePotion: () => { throw new Error('CurrencyView 不应移除药剂'); },
  });
  withDocument(elements => {
    const view = new CurrencyView();
    view.update();
    assert.equal(elements.get('expCell').innerHTML, formatAmount(100));
    assert.equal(elements.get('goldAmountCell').innerHTML, formatAmount(200));
    assert.equal(elements.get('killsCountCell').innerHTML, formatAmount(3));
    // 同值第二次 update：缓存命中，不重写（用哨兵值证明）。
    elements.get('expCell').innerHTML = 'sentinel';
    view.update();
    assert.equal(elements.get('expCell').innerHTML, 'sentinel');
    // 换值后必须重写。
    party.experiencePoints = 250;
    view.update();
    assert.equal(elements.get('expCell').innerHTML, formatAmount(250));
  });
});

test('DungeonNotificationView：readDungeonHeader 每次现读，isWorldActive 可变标量现读', () => {
  let worldActive = false;
  let dungeonMode = true;
  let headerReads = 0;
  bindExpeditionViews({
    readState: () => ({ encounter: {} }),
    readAnimation: () => { throw new Error('DungeonNotificationView 不应读取动画'); },
    isWorldActive: () => worldActive,
    readDungeonHeader: () => {
      headerReads++;
      return dungeonMode ? { name: '地牢A', level: 2 } : { name: '城堡B', level: 0 };
    },
    readScrollList: () => [],
    readPotionList: () => [],
    removePotion: () => { throw new Error('DungeonNotificationView 不应移除药剂'); },
  });
  const view = new DungeonNotificationView();
  view.notificationElement = new Element();
  // isWorldActive 是可变标量：两次调用必须读到不同现值。
  assert.equal(view.isVisible(), true);
  worldActive = true;
  assert.equal(view.isVisible(), false);
  // currentDungeon 为真 → 名字 + 等级；为假 → 城堡名（无等级）。
  view.update();
  assert.equal(headerReads, 1);
  assert.equal(view.notificationElement.innerHTML, '地牢A (等级.2)');
  dungeonMode = false;
  view.update();
  assert.equal(headerReads, 2);
  assert.equal(view.notificationElement.innerHTML, '城堡B');
});
