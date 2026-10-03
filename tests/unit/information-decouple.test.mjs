import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeCoreMath } from '../../src/engine/modules/core/math.js';
import { initializeViewsBase } from '../../src/engine/modules/views/base.js';
import { initializeViewsNavigation } from '../../src/engine/modules/views/navigation.js';
import { SaveControlsView, StatisticsView, OptionsView, initializeViewsInformation } from '../../src/engine/modules/views/information.js';
import { RunStatistics, LifetimeStatistics, initializeProgressionStatistics } from '../../src/engine/modules/progression/statistics.js';

initializeCoreMath();
initializeProgressionStatistics();
initializeViewsBase();
initializeViewsNavigation();
initializeViewsInformation();

// 从产品模板取得实际 ID；拼错选择器会失败。这个最小 DOM 只承载独立视图的交互。
const template = fs.readFileSync(new URL('../../src/ui/panels/info.html', import.meta.url), 'utf8');
class Element {
  constructor() { this.style = {}; this.children = []; this.listeners = {}; this.value = ''; this.selections = 0; }
  get firstChild() { return this.children[0]; }
  appendChild(child) { this.children.push(child); }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); }
  insertRow(index) { return this.insertChild(index); }
  insertCell(index) { return this.insertChild(index); }
  insertChild(index) { const child = new Element(); this.children.splice(index < 0 ? this.children.length : index, 0, child); return child; }
  addEventListener(event, listener) { (this.listeners[event] ??= []).push(listener); }
  select() { this.selections++; }
}
function withDocument(run) {
  const previous = globalThis.document;
  const elements = new Map([...template.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element()]));
  const element = id => { assert.ok(elements.has(id), `模板中缺少 ${id}`); return elements.get(id); };
  globalThis.document = { getElementById: element, createElement: () => new Element() };
  try { run(element); }
  finally { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; }
}
function makeActions(events) {
  return { saveNow: () => events.push('save'), restartRun: () => events.push('restart'), resetGame: () => events.push('delete'),
    exportSave: () => 'exported-save', importSave: text => { events.push(['import', text]); return text === 'valid-save'; } };
}

test('保存、重启、删除仍经过原确认流程并调用注入操作', () => withDocument(element => {
  const events = [];
  new SaveControlsView(makeActions(events), () => 0);
  assert.equal(element('saveButton').onclick(), false);
  element('firstResetButton').onclick();
  assert.equal(element('resetConfirmContainer').style.display, 'block');
  assert.deepEqual(events, ['save']);
  element('cancelResetButton').onclick();
  assert.equal(element('resetConfirmContainer').style.display, 'none');
  element('firstResetButton').onclick();
  element('realResetButton').onclick();
  element('firstDeleteButton').onclick();
  assert.deepEqual(events, ['save', 'restart']);
  element('cancelDeleteButton').onclick();
  assert.equal(element('deleteSaveConfirmContainer').style.display, 'none');
  element('firstDeleteButton').onclick();
  element('realDeleteButton').onclick();
  assert.deepEqual(events, ['save', 'restart', 'delete']);
}));

test('导出选中文本，导入保留成功/失败反馈与关闭时清空', () => withDocument(element => {
  const events = [];
  new SaveControlsView(makeActions(events), () => 0);
  element('exportSaveButton').onclick();
  assert.equal(element('exportSaveInput').value, 'exported-save');
  assert.equal(element('exportSaveInput').selections, 1);
  element('cancelExportButton').onclick();
  assert.equal(element('exportSaveInput').value, '');
  element('importSaveButton').onclick();
  element('importSaveInput').value = 'bad-save';
  element('importOkButton').onclick();
  assert.equal(element('importErrorMessage').style.display, 'block');
  element('importSaveInput').value = 'valid-save';
  element('importOkButton').onclick();
  assert.equal(element('importSuccessMessage').style.display, 'block');
  assert.equal(element('importErrorMessage').style.display, 'none');
  element('importCloseButton').onclick();
  assert.equal(element('importSaveInput').value, '');
  assert.deepEqual(events, [['import', 'bad-save'], ['import', 'valid-save']]);
}));

test('七项设置读写注入对象；反复重置不重复绑定监听', () => withDocument(element => {
  const mappings = [['infoTextEnabledCheckbox', 'showCombatText'], ['spellEffectsEnabledCheckbox', 'showSpellEffects'],
    ['mapOverlayEnabledCheckbox', 'showMapOverlay'], ['offlineProcessingEnabledCheckbox', 'allowOfflineProgress'],
    ['inactiveTabProcessingEnabledCheckbox', 'allowBackgroundProgress'], ['spriteRenderOrderEnabledCheckbox', 'depthSortSprites'],
    ['fpsVisibleCheckbox', 'showFps']];
  const options = Object.fromEntries(mappings.map(([, key]) => [key, true]));
  const view = new OptionsView(options);
  view.reset();
  view.reset();
  for (const [id, key] of mappings) {
    const checkbox = element(id);
    assert.equal(checkbox.checked, true);
    assert.equal(checkbox.listeners.change.length, 1);
    checkbox.checked = false;
    checkbox.listeners.change[0]();
    assert.equal(options[key], false);
  }
}));

test('统计更新读取当前记录，重生替换对象后刷新；保存时间保留正值门控', () => withDocument(element => {
  let snapshot = { runStatistics: new RunStatistics(), lifetimeStatistics: new LifetimeStatistics(), victoryCount: 0 };
  let castleCount = 12;
  const view = new StatisticsView(() => snapshot, () => castleCount);
  view.update();
  snapshot = { runStatistics: new RunStatistics(), lifetimeStatistics: new LifetimeStatistics(), victoryCount: 2 };
  snapshot.runStatistics.castlesConquered = 3;
  snapshot.lifetimeStatistics.castlesConquered = 7;
  castleCount = 14;
  view.update();
  assert.equal(view.runCastlesConqueredCell.innerHTML, '3/14');
  assert.equal(view.lifetimeCastlesConqueredCell.innerHTML, '7');
  assert.equal(view.victoryCountCell.innerHTML, '2');
  let savedAt = 0;
  const controls = new SaveControlsView(makeActions([]), () => savedAt);
  controls.update();
  assert.equal(controls.cachedLastSavedAt, -1);
  savedAt = 1600000000000;
  controls.update();
  assert.equal(controls.cachedLastSavedAt, savedAt);
  assert.equal(element('lastSaveDiv').innerHTML, '最后保存于: ' + new Date(savedAt).toLocaleTimeString());
}));
