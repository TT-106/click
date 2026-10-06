import test from 'node:test';
import assert from 'node:assert/strict';
import { drawFrame, frameGeometry, resolveAnimationFrame, resolveSpriteFrame } from '../../src/engine/modules/rendering/frame.js';

const makeFrame = (width, height) => ({
  image: {}, source: { x: 3, y: 7, width, height }, size: { width, height },
  anchor: { x: width / 2, y: height }, origin: { x: 27, y: 40 },
  offset: { x: 0, y: 0 }, depthOffset: { x: 0, y: 0 }, footprint: { columns: 1, rows: 1 }
});

test('不同高宽动画帧共用脚点，保持矩形比例；显式缩放也围绕锚点', () => {
  for (const frame of [makeFrame(32, 64), makeFrame(48, 96), makeFrame(80, 128)]) {
    for (const scale of [1, 2]) {
      const geometry = frameGeometry(frame, 100, 200, frame.size.width * scale);
      assert.equal(geometry.x + frame.anchor.x * scale, 127);
      assert.equal(geometry.y + frame.anchor.y * scale, 240);
      assert.equal(geometry.height / geometry.width, frame.size.height / frame.size.width);
    }
  }
});

test('旧 atlas 静态帧与特效保持原 source rect / 绘制位置与尺寸', () => {
  const image = {};
  const sheet = { spriteSize: 54 };
  const sprite = { spriteSheet: sheet, sourceX: 112, sourceY: 224, getSheetImage: () => image };
  const frame = resolveSpriteFrame(sprite);
  assert.equal(resolveSpriteFrame(sprite), frame);
  assert.deepEqual(frameGeometry(frame, 10, 20, 81), { x: 10, y: 20, width: 81, height: 81 });
  const draws = [];
  drawFrame({ drawImage: (...args) => draws.push(args) }, frame, 10, 20, 81);
  assert.deepEqual(draws[0], [image, 112, 224, 54, 54, 10, 20, 81, 81]);
  const animation = { spriteSheet: { spriteSize: 31 }, frames: [{ frameSourceX: 62, frameSourceY: 93 }], getSheetImage: () => image };
  assert.deepEqual(resolveAnimationFrame(animation, 0).source, { x: 62, y: 93, width: 31, height: 31 });
  assert.throws(() => resolveAnimationFrame(animation, 1), /缺少第 1 帧/);
});
