import test from 'node:test';
import assert from 'node:assert/strict';
import { StatComponent } from '../../src/engine/modules/characters/stats.js';
import { serializeStatComponent, restoreStatComponent } from '../../src/engine/modules/persistence/entities.js';

test('属性组件跨存档保留小数、零值与负修正，不重新计算数值', () => {
  const source = new StatComponent({});
  Object.assign(source, { itemValue: 12.5, levelValue: 0, spellBonusPercent: -4, skillBonusPercent: 25 });
  const target = new StatComponent({});
  restoreStatComponent(target, serializeStatComponent(source));
  assert.deepEqual(serializeStatComponent(target), {
    itemValue: 12.5, levelValue: 0, spellBonusPercent: -4, skillBonusPercent: 25,
  });
});

test('属性空组件与历史缺失字段沿用原版回读语义', () => {
  const target = new StatComponent({});
  target.itemValue = 17;
  assert.equal(serializeStatComponent(null), null);
  restoreStatComponent(target, null);
  assert.equal(target.itemValue, 17);
  restoreStatComponent(null, { itemValue: 8 });
  restoreStatComponent(target, { levelValue: 3 });
  assert.deepEqual(serializeStatComponent(target), {
    itemValue: 0, levelValue: 3, spellBonusPercent: 0, skillBonusPercent: 0,
  });
});
