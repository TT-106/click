/** 画面布局常量：格子尺寸与视口尺寸。
 *
 * 原先是 runtime/game.js 单例字面量里的六个硬编码值，任何模块要用都得反向依赖整个组合根。
 * 集中到这里后它们有了唯一来源，纯几何的消费方（寻路、掉落、渲染）不必再导入 game。
 *
 * 这些数值直接参与像素坐标换算、相机与画布绘制，属可观测布局契约：
 * 改动会立即改变渲染结果与移动速度，不在本工程的"等价恢复"范围内，需先有明确设计决策。
 * halfTileSize 保持原样的字面量 13（= 27 / 2 取整），不做派生计算，避免舍入路径变化。
 */
export const TILE_SIZE = 27;
export const HALF_TILE_SIZE = 13;
export const VIEWPORT_WIDTH = 740;
export const VIEWPORT_HEIGHT = 450;
export const VIEWPORT_HALF_WIDTH = 370;
export const VIEWPORT_HALF_HEIGHT = 225;
