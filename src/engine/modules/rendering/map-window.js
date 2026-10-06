/** 经典地图（世界 / 地牢）的候选地块窗口。
 *
 * 背景：`drawExpandedTiles` 处理"新素材比旧 54px 方格更大"时的扩展候选区；当所有素材都在旧方格里时
 * 它返回 false，由调用方回退到**固定的经典候选窗**。原实现把这个窗口以 35 行 `draw*TileRow` 调用
 * 逐行展开，且在 world / dungeon 两处各抄一份（约 70 行、两处必须同步改）。本模块把同一份窗口
 * 提成语义数据，成为唯一来源。
 *
 * 这不是一个几何公式能算出来的对称菱形：它是 740×450 逻辑视口 + 27/13 等距投影下手调出来的
 * 非对称窗口（左缘在第 16→第 20 行之间从 -16 跳到 -14，右缘在 19–21 行保持 +16）。所以保持为**数据**，
 * 而不是"看起来更优雅"的公式——公式化会改变绘制调用序列，进而改变 classic 逐像素 oracle。
 *
 * 每项 `[startOffset, endOffset]` 是相对中心地块列的列区间（右开，供 drawRow 直接使用）。
 * 行偏移从 MAP_WINDOW_FIRST_ROW_OFFSET 起逐行 +1。
 *
 * 契约保护：窗口是 classic 逐像素 oracle 的一部分。改动它必须同时通过
 * `tests/unit/map-window.test.mjs`（金标准：逐行等价于历史展开序列）与 `npm run test:presentation`
 * （7 条像素指纹）。本文件不改绘制函数本身，只决定"调用哪些行、哪些列、什么顺序"。
 */
export const MAP_WINDOW_FIRST_ROW_OFFSET = -18;
export const MAP_WINDOW_ROWS = Object.freeze([
  [-5, -3], [-6, -2], [-7, -1], [-8, 0], [-9, 1], [-10, 2], [-11, 3], [-12, 4], [-13, 5], [-14, 6],
  [-15, 7], [-16, 8], [-17, 9], [-18, 10], [-19, 11], [-20, 12], [-19, 13], [-18, 14], [-17, 15], [-16, 16],
  [-14, 16], [-13, 16], [-12, 15], [-11, 14], [-10, 13], [-9, 12], [-8, 11], [-7, 10], [-6, 9], [-5, 8],
  [-4, 7], [-3, 6], [-2, 5], [-1, 4], [0, 3]
]);

/** 用固定窗口绘制一格地图行。drawRow(renderer, row, startColumn, endColumn) 与原展开调用同参同序。
 * @param {any} renderer
 * @param {any} map 具备 pixelToTileColumn/pixelToTileRow 与中心坐标
 * @param {boolean} worldActive
 * @param {(renderer: any, row: number, startColumn: number, endColumn: number) => void} drawRow
 */
export function drawClassicTileWindow(renderer, map, worldActive, drawRow) {
  const centerColumn = worldActive ? map.pixelToTileColumn(map.worldCenterX) : map.pixelToTileColumn(map.centerX);
  const firstRow = (worldActive ? map.pixelToTileRow(map.worldCenterY) : map.pixelToTileRow(map.centerY)) + MAP_WINDOW_FIRST_ROW_OFFSET;
  for (let index = 0; index < MAP_WINDOW_ROWS.length; index++) {
    const [startOffset, endOffset] = MAP_WINDOW_ROWS[index];
    drawRow(renderer, firstRow + index, centerColumn + startOffset, centerColumn + endOffset);
  }
}
