import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readInitializationPlan, verifyInitializationPlan } from '../../scripts/check-initialization-order.mjs';

const source = fs.readFileSync(new URL('../../src/engine/modules/runtime/index.js', import.meta.url), 'utf8');
const baseline = JSON.parse(fs.readFileSync(new URL('../../artifacts/initialization-order.json', import.meta.url), 'utf8'));
test('当前组合根的初始化与绑定契约一致', () => {
  verifyInitializationPlan(readInitializationPlan(source), baseline);
});
test('交换或删除一个初始化调用都会被拒绝', () => {
  const changed = source.replace('initializeCharactersStats();', '__SWAP_INITIALIZER__')
    .replace('initializeCharactersEffects();', 'initializeCharactersStats();')
    .replace('__SWAP_INITIALIZER__', 'initializeCharactersEffects();');
  assert.throws(() => verifyInitializationPlan(readInitializationPlan(changed), baseline), /顺序或参数变化/);
  assert.throws(() => verifyInitializationPlan(readInitializationPlan(source.replace('initializeCharactersStats();', '')), baseline));
});
test('增加、重复或删除绑定调用都会被拒绝', () => {
  const call = 'bindTargetingPathfinder(game.pathfinder);';
  assert.throws(() => verifyInitializationPlan(readInitializationPlan(source.replace(call, `${call}\n${call}`)), baseline));
  assert.throws(() => verifyInitializationPlan(readInitializationPlan(source.replace(call, '')), baseline));
});
test('绑定参数改变或把装配藏入条件语句会被拒绝', () => {
  assert.throws(() => verifyInitializationPlan(readInitializationPlan(source.replace('bindTargetingPathfinder(game.pathfinder)', 'bindTargetingPathfinder(game.world)')), baseline));
  assert.throws(() => readInitializationPlan(source.replace('initializeCharactersStats();', 'if (game) initializeCharactersStats();')), /不是直接装配调用/);
});
test('未登记的导入调用和来源变化不能静默绕过', () => {
  assert.throws(() => readInitializationPlan(source + '\ngame();'), /未识别/);
  assert.throws(() => verifyInitializationPlan(readInitializationPlan(source.replace("from '../characters/stats.js'", "from '../characters/effects.js'")), baseline));
});
