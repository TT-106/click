// 经典地图窗口的金标准：MAP_WINDOW_ROWS 必须逐行等价于重构前 scene.js 里展开的 35 行绘制调用。
//
// 由来：重构前 `GameCanvasView.update` 在 world / dungeon 两处各展开 35 行
// `draw{World,Dungeon}TileRow(renderer, XRowCursor++, centerTileColumn + a, centerTileColumn + b)`。
// 下面的 OFFSETS 是从重构前源码（commit be35a8a 的 scene.js，第 494–528 行）机械提取的
// (b - a) 偏移对，作为**冻结点**：任何改变窗口形状的改动都会让本测试失败。
// 该窗口是 classic 逐像素 oracle 的一部分，不能"顺手算成对称菱形"。
import test from 'node:test';
import assert from 'node:assert/strict';

import { MAP_WINDOW_FIRST_ROW_OFFSET, MAP_WINDOW_ROWS, drawClassicTileWindow } from '../../src/engine/modules/rendering/map-window.js';

// 逐行取自重构前 scene.js（世界分支；地牢分支与之逐项相同，已核对）。
const OFFSETS = [
  [-5, -3], [-6, -2], [-7, -1], [-8, 0], [-9, 1], [-10, 2], [-11, 3], [-12, 4], [-13, 5], [-14, 6],
  [-15, 7], [-16, 8], [-17, 9], [-18, 10], [-19, 11], [-20, 12], [-19, 13], [-18, 14], [-17, 15], [-16, 16],
  [-14, 16], [-13, 16], [-12, 15], [-11, 14], [-10, 13], [-9, 12], [-8, 11], [-7, 10], [-6, 9], [-5, 8],
  [-4, 7], [-3, 6], [-2, 5], [-1, 4], [0, 3]
];

test('窗口行数与首行偏移固定（35 行，首行 -18）', () => {
  assert.equal(MAP_WINDOW_ROWS.length, 35);
  assert.equal(MAP_WINDOW_FIRST_ROW_OFFSET, -18);
});

test('MAP_WINDOW_ROWS 逐行等价于重构前展开序列', () => {
  assert.deepEqual(MAP_WINDOW_ROWS.map((pair) => [...pair]), OFFSETS);
});

test('drawClassicTileWindow 按同参同序发出 35 次 drawRow 调用', () => {
  const calls = [];
  const drawRow = (renderer, row, startColumn, endColumn) => calls.push([renderer, row, startColumn, endColumn]);
  const map = { pixelToTileColumn: (x) => x, pixelToTileRow: (y) => y, worldCenterX: 100, worldCenterY: 100 };
  drawClassicTileWindow('R', map, true, drawRow);
  assert.equal(calls.length, 35);
  // 第一行：row = 100 - 18 + 0 = 82，列区间 [100-5, 100-3]
  assert.deepEqual(calls[0], ['R', 82, 95, 97]);
  // 第 16 行（index 15）：偏移 [-20, 12] → row 97
  assert.deepEqual(calls[15], ['R', 97, 80, 112]);
  // 第 21 行（index 20）：左缘回到 [-14, 16]（非对称窗口，公式化会写错这里）
  assert.deepEqual(calls[20], ['R', 102, 86, 116]);
  // 末行（index 34）：row = 100 - 18 + 34 = 116，区间 [0, 3]
  assert.deepEqual(calls[34], ['R', 116, 100, 103]);
});

test('地牢分支改用 centerX/centerY（worldActive=false）', () => {
  const calls = [];
  const drawRow = (renderer, row, startColumn, endColumn) => calls.push([row, startColumn, endColumn]);
  const map = { pixelToTileColumn: (x) => x, pixelToTileRow: (y) => y, centerX: 10, centerY: 20 };
  drawClassicTileWindow(null, map, false, drawRow);
  assert.equal(calls.length, 35);
  assert.deepEqual(calls[0], [2, 5, 7]); // row 20-18=2，列 10-5..10-3
  assert.deepEqual(calls[34], [36, 10, 13]); // row 20-18+34=36，列 10..10+3
});
