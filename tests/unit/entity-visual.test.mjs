import test from 'node:test';
import assert from 'node:assert/strict';
import { entityDirection, presentationTimeMs, resolveEntityVisual, resolveSceneVisual } from '../../src/engine/modules/rendering/entity-visual.js';

const frame = (name, width = 32, height = 64) => ({ name, image: {}, source: { x: 0, y: 0, width, height }, size: { width, height }, anchor: { x: width / 2, y: height } });
const entity = () => ({ lastAttackTurn: -10, isDead: false, position: { worldPosition: { x: 0, y: 0 }, levelPosition: { x: 0, y: 0 } } });
const skin = () => ({ name: 'Slime.PNG', getName() { return this.name; }, clips: {
  idle: { frames: [frame('idle0', 32, 64), frame('idle1', 48, 80)], fps: 4 },
  walk: { frames: [frame('walk0'), frame('walk1')], fps: 8, directions: Object.fromEntries(['NE', 'NW', 'SE', 'SW'].map(direction => [direction, [frame(direction + '0'), frame(direction + '1')]])) },
  attack: { frames: [frame('attack0'), frame('attack1')], fps: 10, loop: false },
  death: { frames: [frame('death0'), frame('death1')], fps: 10, loop: false },
  hurt: { frames: [frame('hurt0'), frame('hurt1')], fps: 10, loop: false },
} });
const read = (who, sprite, timeMs, x = 0, y = 0, rest = {}) => resolveEntityVisual(who, sprite, { timeMs, x, y, ...rest });

test('显示时钟按累计模拟单位推进；批量和细粒度推进一致', () => {
  let turn = 6, remainder = 3, units = 0;
  const initial = presentationTimeMs(turn, remainder);
  for (const step of [.25, 1.5, 15, 30.8, .4]) {
    units += step; remainder += step;
    if (remainder >= 15) { turn++; remainder -= 15; }
    assert.ok(Math.abs(presentationTimeMs(turn, remainder) - initial - units * (1000 / 60)) < 1e-8);
  }
});

test('静态兼容；多尺寸帧按 fps 播放，暂停时间不推进，原对象与素材名不变', () => {
  const who = entity(), sprite = skin(), serialized = JSON.stringify(who);
  assert.equal(read(who, { name: 'static' }, 0).name, 'static');
  assert.equal(read(who, sprite, 100).frame.name, 'idle0');
  const next = read(who, sprite, 350);
  assert.equal(next.frame.name, 'idle1');
  assert.deepEqual(next.frame.size, { width: 48, height: 80 });
  assert.equal(read(who, sprite, 350).frame, next.frame);
  assert.equal(read(who, sprite, 600).frame.name, 'idle0');
  assert.equal(next.getName(), 'Slime.PNG');
  assert.equal(JSON.stringify(who), serialized);
});

test('四方向以真实地图投影为准；方向缺图回退主 frames', () => {
  assert.deepEqual([[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, y]) => entityDirection(x, y)), ['SE', 'NW', 'SW', 'NE']);
  assert.equal(entityDirection(0, 0, 'NW'), 'NW');
  const who = entity(), sprite = skin();
  read(who, sprite, 0);
  assert.equal(read(who, sprite, 1, 1).frame.name, 'SE0');
  assert.equal(read(who, sprite, 2, 0).frame.name, 'NW0');
  assert.equal(read(who, sprite, 3, 0, 1).frame.name, 'SW0');
  assert.equal(read(who, sprite, 4, 0, 0).frame.name, 'NE0');
  delete sprite.clips.walk.directions.NE;
  assert.equal(read(who, sprite, 5, 0, -1).frame.name, 'walk0');
});

test('攻击只由新 lastAttackTurn 触发，播完回到普通状态，死亡停最后帧', () => {
  const who = entity(), sprite = skin();
  who.lastAttackTurn = 100;
  assert.equal(read(who, sprite, 0).visualState, 'idle', '首次观察不得重播存档的历史攻击');
  who.lastAttackTurn = 101;
  assert.equal(read(who, sprite, 10).frame.name, 'attack0');
  assert.equal(read(who, sprite, 110).frame.name, 'attack1');
  assert.equal(read(who, sprite, 210).visualState, 'idle');
  who.lastAttackTurn = 10;
  assert.equal(read(who, sprite, 211).visualState, 'idle');
  who.isDead = true;
  assert.equal(read(who, sprite, 220).frame.name, 'death0');
  assert.equal(read(who, sprite, 1220).frame.name, 'death1');
});

test('换皮、地图切换和时钟回退都重置播放，不挟带旧帧', () => {
  const who = entity(), original = skin(), replacement = skin();
  replacement.clips.idle.frames = [frame('skin0'), frame('skin1')];
  read(who, original, 0);
  assert.equal(read(who, original, 300).frame.name, 'idle1');
  assert.equal(read(who, replacement, 300).frame.name, 'skin0');
  assert.equal(read(who, replacement, 600).frame.name, 'skin1');
  assert.equal(read(who, replacement, 600, 200, 200, { worldActive: true }).frame.name, 'skin0');
  assert.equal(read(who, replacement, 900, 200, 200, { worldActive: true }).frame.name, 'skin1');
  assert.equal(read(who, replacement, 100, 200, 200, { worldActive: true }).frame.name, 'skin0');
});

test('显式 hurt/interact 等状态和 token 可重播，缺失 clip 安全回退；播放不调用 RNG', () => {
  const who = entity(), sprite = skin(), originalRandom = Math.random;
  Math.random = () => { throw new Error('显示动画不得消耗游戏 RNG'); };
  try {
    assert.equal(read(who, sprite, 0, 0, 0, { visualState: 'hurt', visualToken: 1 }).frame.name, 'hurt0');
    assert.equal(read(who, sprite, 1000, 0, 0, { visualState: 'hurt', visualToken: 1 }).frame.name, 'hurt1');
    assert.equal(read(who, sprite, 1001, 0, 0, { visualState: 'hurt', visualToken: 2 }).frame.name, 'hurt0');
    assert.equal(read(who, sprite, 1100, 0, 0, { visualState: 'interact' }).visualState, 'idle');
    const noIdle = { clips: { cast: { frames: [frame('cast')] } } };
    assert.equal(read(who, noIdle, 1200), noIdle);
  } finally { Math.random = originalRandom; }
});

test('静态场景动画按同一会话时钟选帧，调用顺序和重复绘制不影响结果', () => {
  const sprite = skin();
  const later = resolveSceneVisual(sprite, 350);
  assert.equal(later.frame.name, 'idle1');
  assert.equal(later.visualResolved, true);
  assert.equal(resolveSceneVisual(sprite, 0).frame.name, 'idle0');
  assert.equal(resolveSceneVisual(sprite, 350).frame, later.frame);
  assert.equal(resolveSceneVisual(sprite, 500).frame.name, 'idle0');
  sprite.clips.idle.loop = false;
  assert.equal(resolveSceneVisual(sprite, 5000).frame.name, 'idle1');
  const staticSprite = { name: 'static' };
  assert.equal(resolveSceneVisual(staticSprite, 500), staticSprite);
});
