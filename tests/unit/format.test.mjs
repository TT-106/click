// 数量格式化函数的原版行为 characterization（阈值边界来自 formatPositiveAmount 的比较链）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAmount, formatGroupedAmount, formatPositiveAmount } from '../../src/engine/modules/core/math.js';

test('formatPositiveAmount 单位阈值与原版一致', () => {
  const cases = [
    [0, '0'], [999, '999'], [9999, '9999'],
    [10000, '10.0K'], [99999, '100.0K'], [150000, '150K'],
    [999999, '999K'], [1000000, '1.00M'], [1234567, '1.23M'],
    [12345678, '12.3M'], [123456789, '123M'], [1234567890, '1.23B'],
    [-5000, '-5000'],
  ];
  for (const [input, expected] of cases) {
    assert.equal(formatAmount(input), expected, `formatAmount(${input})`);
  }
});

test('formatPositiveAmount 大数单位链（T/P/Z/Y）', () => {
  assert.equal(formatPositiveAmount(2e12), '2.00T');
  assert.equal(formatPositiveAmount(3e15), '3.00P');
  assert.equal(formatPositiveAmount(4e21), '4.00Z');
  assert.equal(formatPositiveAmount(5e24), '5.00Y');
});

test('formatGroupedAmount 千分位分组（parseInt 截断小数）', () => {
  assert.equal(formatGroupedAmount(1234567.89), '1,234,567');
  assert.equal(formatGroupedAmount(-9876543), '-9,876,543');
  assert.equal(formatGroupedAmount(42), '42');
  assert.equal(formatGroupedAmount(0), '0');
});
