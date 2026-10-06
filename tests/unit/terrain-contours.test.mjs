import test from 'node:test';
import assert from 'node:assert/strict';
import { terrainContours, buildGroundPatches } from '../../src/engine/exploration/terrain-contours.js';
import { FOREST_VILLAGE_BLENDS } from '../../src/engine/exploration/theme.js';

const world = () => ({ width: 2, height: 2, cells: [{ x: 0, y: 0, kind: 'path' }, { x: 1, y: 0, kind: 'grass' },
  { x: 0, y: 1, kind: 'grass' }, { x: 1, y: 1, kind: 'path' }] });

test('地表轮廓：覆盖全部邻接组合，斜向接触不连通，曲线始终在对应世界格内', () => {
  assert.deepEqual(terrainContours(0), []);
  for (let mask = 1; mask < 16; mask++) {
    const contours = terrainContours(mask);
    assert.equal(contours.length, mask === 5 || mask === 10 ? 2 : 1);
    for (const contour of contours) {
      assert.equal(contour[0][0], 'M'); assert.equal(contour.at(-1)[0], 'Z');
      for (const [, ...coordinates] of contour) assert.ok(coordinates.every(number => number >= 0 && number <= 1), '曲线不能伸入不相关地块');
    }
  }
  assert.ok(terrainContours(1)[0].some(command => command[0] === 'Q'), '末端需要连续曲线');
  for (const mask of [-1, 16, .5, NaN]) assert.throws(() => terrainContours(mask));
});

test('地表迷雾：修改未知格类型和变体不改变已知轮廓，也不改写世界数据', () => {
  const first = world(), second = structuredClone(first), discovered = new Set(['0,0']), inside = new Set();
  second.cells.slice(1).forEach(cell => { cell.kind = 'water'; cell.variant = 99; });
  const before = structuredClone(first);
  assert.deepEqual(buildGroundPatches(first, discovered, inside, FOREST_VILLAGE_BLENDS), buildGroundPatches(second, discovered, inside, FOREST_VILLAGE_BLENDS));
  assert.deepEqual(first, before);
  assert.deepEqual(buildGroundPatches(first, new Set(), inside, FOREST_VILLAGE_BLENDS), []);
});

test('地表连接：桥下水面连续，室内不会把闭合房屋的地面当成室外道路', () => {
  const map = world(), known = new Set(['0,0', '1,0', '0,1', '1,1']);
  map.cells.forEach(cell => { cell.kind = 'bridge'; });
  assert.equal(buildGroundPatches(map, known, new Set(), FOREST_VILLAGE_BLENDS).find(patch => patch.layer === 'water').mask, 15);
  map.cells.forEach(cell => { cell.kind = 'path'; cell.area = 'house'; cell.outsideKind = 'grass'; });
  assert.deepEqual(buildGroundPatches(map, known, new Set(), FOREST_VILLAGE_BLENDS), []);
  assert.equal(buildGroundPatches(map, known, new Set(['house']), FOREST_VILLAGE_BLENDS)[0].mask, 15);
});
