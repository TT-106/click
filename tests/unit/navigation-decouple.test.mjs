import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeViewsBase } from '../../src/engine/modules/views/base.js';
import {
  GameView, PauseView, TabState, bindPauseButton, initializeViewsNavigation,
} from '../../src/engine/modules/views/navigation.js';

initializeViewsBase();
initializeViewsNavigation();

test('导航构造不提前读取组合根；每次更新读取当前角色并保留技能提醒', () => {
  let ready = false;
  let adventurers = [];
  const view = new GameView(() => {
    assert.ok(ready, '根装配完成前不可读取角色');
    return adventurers;
  }, () => true);
  ready = true;
  let rendered = 0;
  view.childViews = [{ render() { rendered++; } }];
  view.tabStates = [new TabState('F', true)];
  adventurers = [{ hasUnspentSkills: true, skillPoints: 2, initialSpellSkillPoint: 1,
    classDefinition: { shortName: 'F' } }];
  view.update();
  assert.equal(view.tabStates[0].label, 'F 3');
  assert.equal(view.tabStates[0].highlighted, true);
  adventurers = [{ hasUnspentSkills: false, skillPoints: 9, initialSpellSkillPoint: 1,
    classDefinition: { shortName: 'P' } }];
  view.update();
  assert.equal(view.tabStates[0].label, 'P');
  assert.equal(view.tabStates[0].highlighted, false);
  assert.equal(rendered, 2);
});

test('离线通知只在注入的资格成立时发送，结束时重新判定', () => {
  let eligible = false;
  const events = [];
  const view = new GameView(() => [], () => eligible);
  view.panels = [{ onOfflineStart() { events.push('start'); },
    onOfflineFinish() { events.push('finish'); }, onGameWon() { events.push('won'); } }];
  view.onOfflineStart();
  eligible = true;
  view.onOfflineStart();
  eligible = false;
  view.onOfflineFinish();
  eligible = true;
  view.onOfflineFinish();
  view.onGameWon();
  assert.deepEqual(events, ['start', 'finish', 'won']);
});

test('暂停按钮通过注入操作切换状态，保留文字、样式与事件返回值', () => {
  let paused = false;
  const button = {};
  const previousDocument = globalThis.document;
  globalThis.document = { getElementById(id) { assert.equal(id, 'pauseButton'); return button; } };
  try {
    const view = new PauseView(() => paused, () => { paused = !paused; });
    bindPauseButton(view);
    view.update();
    assert.deepEqual([button.innerHTML, button.className], ['暂停', 'upgradeButton']);
    assert.equal(button.onmouseup(), false);
    assert.equal(paused, true);
    view.update();
    assert.deepEqual([button.innerHTML, button.className], ['恢复', 'ownedUpgradeButton']);
    button.onmouseup();
    view.update();
    assert.equal(button.innerHTML, '暂停');
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test('遗漏导航依赖会显式失败，不回退到全局 game', () => {
  const view = new GameView();
  assert.throws(() => view.update(), TypeError);
  assert.throws(() => new PauseView(), TypeError);
});
