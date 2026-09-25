// RNG 差分：从原版 c2.js 中按 AST 提取原始 Mersenne Twister（符号 ga），
// 与重构版 SeededRandom 在相同种子下逐值对比随机流。
// 该测试保证重命名/模块化没有改变任何随机数位型。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import { SeededRandom, initializeCoreMath } from '../../src/engine/modules/core/math.js';

const walk = traverseModule.default ?? traverseModule;
const generate = generateModule.default ?? generateModule;

function extractOriginalRng(source) {
  const ast = parse(source, { sourceType: 'script' });
  const chunks = [];
  const rootName = node => {
    let cur = node;
    while (cur?.type === 'MemberExpression') cur = cur.object;
    return cur?.type === 'Identifier' ? cur.name : null;
  };
  walk(ast, {
    FunctionDeclaration(path) {
      if (path.node.id?.name === 'ga') chunks.push(generate(path.node).code);
    },
    ExpressionStatement(path) {
      const expr = path.node.expression;
      if (expr?.type === 'AssignmentExpression' && rootName(expr.left) === 'ga') {
        chunks.push(generate(path.node).code);
      }
    },
  });
  if (!chunks.length) throw new Error('未能从原版 c2.js 提取 ga（Mersenne Twister）');
  return chunks.join('\n');
}

const originalSource = fs.readFileSync('archive/original/c2.js', 'utf8');
const originalCode = extractOriginalRng(originalSource);
const OriginalRandom = new Function(`${originalCode}; return ga;`)();

// 原型方法由 initializeCoreMath() 挂载（恢复工程的启动顺序保留），单测需显式调用。
initializeCoreMath();

function sampleStream(Rng, seed, count) {
  const rng = new Rng(seed);
  const out = new Array(count);
  for (let i = 0; i < count; i++) out[i] = rng.random();
  return out;
}

test('重构版与原版 ga 在多种子下随机流完全一致（每个 100,000 值）', () => {
  for (const seed of [0, 1, 42, 5489, 123456789, 4294967295]) {
    const a = sampleStream(OriginalRandom, seed, 100000);
    const b = sampleStream(SeededRandom, seed, 100000);
    assert.deepEqual(b, a, `种子 ${seed} 的随机流出现分叉`);
  }
});

test('黄金值：这是 JS 浮点变体 MT，不是 C 标准 MT19937', () => {
  // 关键事实：种子循环用 64 位浮点乘法（1812433253 * x 未截断），
  // 与 C 标准 MT19937（seed 5489 → 3499211612…）序列不同。
  // 以下值提取自原版实现输出（与 extracted ga 差分一致），替换为"更标准"的 RNG 会破坏回放确定性。
  const rng = new SeededRandom(5489);
  const golden = [1859732469, 3401144660, 1032891371];
  for (const value of golden) {
    assert.equal(Math.floor(rng.random() * 4294967296), value);
  }
});

test('同种子确定性：两次实例化产生相同流', () => {
  assert.deepEqual(sampleStream(SeededRandom, 777, 5000), sampleStream(SeededRandom, 777, 5000));
});

test('不同种子产生不同流（前 1000 值内）', () => {
  const a = sampleStream(SeededRandom, 1, 1000);
  const b = sampleStream(SeededRandom, 2, 1000);
  assert.notDeepEqual(a, b);
});
