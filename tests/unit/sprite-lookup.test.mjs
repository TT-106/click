// 精灵查找命中/未命中路径的单元差分：从原版 c2.js 提取 Pb（SpriteSheet）及其查找方法 v，
// 与重构版 SpriteSheet.getSprite 在同一张手工填充的查找表上对账——
// 命中返回同一表项、未命中返回 undefined 不抛错、原型链继承键（toString/constructor）
// 在两侧同样返回继承函数（忠实保留的原版怪癖，勿"修复"）。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';

const walk = traverseModule.default ?? traverseModule;
const gen = generateModule.default ?? generateModule;

function extractOriginalSheet(source) {
  const ast = parse(source, { sourceType: 'script' });
  const chunks = [];
  walk(ast, {
    FunctionDeclaration(path) {
      if (path.node.id?.name === 'Pb') chunks.push(gen(path.node).code);
    },
    ExpressionStatement(path) {
      const e = path.node.expression;
      if (e?.type === 'AssignmentExpression') {
        let root = e.left;
        while (root?.type === 'MemberExpression') root = root.object;
        if (root?.name === 'Pb' && e.left.property?.name === 'v') {
          chunks.push(gen(e).code);
        }
      }
    },
  });
  if (!chunks.length) throw new Error('未能从原版提取 Pb（SpriteSheet）');
  return chunks.join('\n');
}

const originalCode = extractOriginalSheet(fs.readFileSync('archive/original/c2.js', 'utf8'));

// Node 无 Image：垫片不触发 onload（查找表由测试手工填充，绕开图片加载）
globalThis.Image = class { set src(_) {} };
const OriginalSheet = new Function(`${originalCode}; return Pb;`)();

const sprites = await import('../../src/engine/modules/rendering/sprites.js');
const { SpriteSheet } = sprites;
// getSprite 与原版 v 同为 init 期原型挂载；Node 侧垫片 Image 不触发 onload
sprites.initializeRenderingSprites();

function makePair() {
  const orig = new OriginalSheet('orig.png', 32, []);
  const refa = new SpriteSheet('refa.png', 32, []);
  const entry = { sourceX: 7, sourceY: 9, spriteSize: 32 };
  orig.Yh['Known.PNG'] = entry;
  refa.Yh['Known.PNG'] = entry;
  return [orig, refa];
}

test('精灵查找命中/未命中/继承键行为双端一致', () => {
  const [orig, refa] = makePair();
  // 命中：返回同一表项
  assert.deepEqual(orig.v('Known.PNG'), refa.getSprite('Known.PNG'));
  // 未命中：undefined 且不抛错
  assert.equal(orig.v('Missing.PNG'), undefined);
  assert.equal(refa.getSprite('Missing.PNG'), undefined);
  // 继承键：两侧同样返回 Object.prototype 的继承函数（原版怪癖忠实保留）
  assert.equal(typeof orig.v('toString'), 'function');
  assert.equal(typeof refa.getSprite('toString'), 'function');
  // 非法输入：两侧同样返回 undefined
  assert.equal(orig.v(undefined), undefined);
  assert.equal(refa.getSprite(undefined), undefined);
});
