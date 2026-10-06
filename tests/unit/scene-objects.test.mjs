// 场景物件生产者：数据格式校验、pattern 取格、确定性物化、生成期接线。
// 关键不变量：不消耗 RNG（scatter 走确定性散列）、默认主题无规则时结果为空（对既有地图零影响）。
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SCENE_OBJECT_LAYERS,
  installSceneObjects,
  installThemeSceneObjects,
  materializeSceneObjects,
  sceneObjectTiles,
  validateSceneObjectRule
} from '../../src/engine/modules/world/scene-objects.js';

const room = { roomId: 7, tileColumn: 3, tileRow: 5, widthInTiles: 4, heightInTiles: 3, encounterType: 0 };

test('规则校验：合法通过，非法 fail loud', () => {
  assert.ok(validateSceneObjectRule({ visualId: 'village.hay', pattern: 'corners' }));
  assert.deepEqual([...SCENE_OBJECT_LAYERS], ['ground', 'scenery', 'effect', 'overlay']);
  assert.throws(() => validateSceneObjectRule({ pattern: 'corners' }), /visualId/);
  assert.throws(() => validateSceneObjectRule({ visualId: 'x', pattern: 'nope' }), /pattern/);
  assert.throws(() => validateSceneObjectRule({ visualId: 'x', pattern: 'corners', layer: 'sky' }), /未知绘制层/);
  assert.throws(() => validateSceneObjectRule({ visualId: 'x', pattern: 'scatter', chance: 1.5 }), /chance/);
  assert.throws(() => validateSceneObjectRule({ visualId: 'x', pattern: 'corners', chance: 0.5 }), /只对 pattern='scatter'/);
  assert.throws(() => validateSceneObjectRule({ visualId: 'x', pattern: 'corners', footprint: { columns: 0, rows: 1 } }), /footprint/);
});

test('pattern 取格：corners=4、center=1、perimeter=外环、scatter=全内部', () => {
  assert.deepEqual(sceneObjectTiles(room, 'corners'), [
    { column: 3, row: 5 }, { column: 6, row: 5 }, { column: 3, row: 7 }, { column: 6, row: 7 }
  ]);
  assert.deepEqual(sceneObjectTiles(room, 'center'), [{ column: 4, row: 6 }]);
  // 4×3 房间外环 = 2*4 + 2*3 - 4 = 10
  assert.equal(sceneObjectTiles(room, 'perimeter').length, 10);
  assert.equal(sceneObjectTiles(room, 'scatter').length, 12);
});

test('物化：无规则 ⇒ 空；位置按格 ×27 且确定性', () => {
  assert.deepEqual(materializeSceneObjects({ rooms: [room], rules: [], seed: 1 }), []);
  const rules = [{ visualId: 'village.hay', pattern: 'corners', layer: 'scenery' }];
  const objects = materializeSceneObjects({ rooms: [room], rules, seed: 1 });
  assert.equal(objects.length, 4);
  assert.deepEqual(objects[0], {
    visualId: 'village.hay',
    position: { x: 3 * 27, y: 5 * 27 },
    layer: 'scenery',
    footprint: { columns: 1, rows: 1 },
    elevation: 0
  });
  // 同输入同输出（确定性）
  assert.deepEqual(materializeSceneObjects({ rooms: [room], rules, seed: 1 }), objects);
});

test('scatter 用确定性散列而非 RNG：同种子稳定、不同种子会变', () => {
  const rules = [{ visualId: 'village.corn', pattern: 'scatter', chance: 0.5 }];
  const a = materializeSceneObjects({ rooms: [room], rules, seed: 42 });
  const b = materializeSceneObjects({ rooms: [room], rules, seed: 42 });
  assert.deepEqual(a, b);
  assert.ok(a.length <= 12 && a.length >= 1, `scatter 命中数应在 1..12，实得 ${a.length}`);
  const seeds = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((seed) => materializeSceneObjects({ rooms: [room], rules, seed }).length));
  assert.ok(seeds.size > 1, '不同种子应给出不同的散列命中集合');
});

test('onlyEncounterType 过滤房间', () => {
  const rules = [{ visualId: 'village.hay', pattern: 'center', onlyEncounterType: 2 }];
  assert.equal(materializeSceneObjects({ rooms: [room], rules, seed: 0 }).length, 0);
  assert.equal(materializeSceneObjects({ rooms: [{ ...room, encounterType: 2 }], rules, seed: 0 }).length, 1);
});

test('生成期接线：主题无规则不动、有规则按批次替换', () => {
  const map = { roomList: [room], sceneObjects: [{ visualId: 'stale' }] };
  installThemeSceneObjects(map, {}, 1);
  assert.deepEqual(map.sceneObjects, [{ visualId: 'stale' }]); // 无规则：保持原样
  installThemeSceneObjects(map, { sceneObjects: [{ visualId: 'village.hay', pattern: 'center' }] }, 1);
  assert.equal(map.sceneObjects.length, 1); // replace：替换旧批次
  assert.equal(map.sceneObjects[0].visualId, 'village.hay');
  assert.deepEqual(map.sceneObjects[0].position, { x: 4 * 27, y: 6 * 27 });
});

test('installSceneObjects 支持追加', () => {
  const map = { sceneObjects: [] };
  installSceneObjects(map, [{ visualId: 'a' }]);
  installSceneObjects(map, [{ visualId: 'b' }]);
  assert.deepEqual(map.sceneObjects.map((o) => o.visualId), ['a', 'b']);
});
