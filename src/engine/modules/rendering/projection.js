/** 地图几何。逻辑平面仍是正交网格，投影和素材尺寸彼此独立。
 * 旧地图每格 (27,13)，旧角色每格 (27,13.5)；这些历史差异必须显式保留。
 */
import { TILE_SIZE, HALF_TILE_SIZE, VIEWPORT_HALF_WIDTH, VIEWPORT_HALF_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../core/screen-layout.js';

/** 旧角色连续投影，worldX/Y 是模拟使用的逻辑平面单位。 */
export function projectActor(worldX, worldY, centerX, centerY, elevation = 0) {
  return {
    x: VIEWPORT_HALF_WIDTH + (worldX - centerX - (worldY - centerY)),
    y: VIEWPORT_HALF_HEIGHT + .5 * (worldX - centerX + (worldY - centerY)) - elevation
  };
}

/** 旧地图相机的格子商/余数路径，供 classic 的像素兼容使用。 */
export function projectLegacyTile(column, row, camera) {
  return {
    x: VIEWPORT_HALF_WIDTH + (column - camera.tileColumn - (row - camera.tileRow)) * TILE_SIZE - camera.viewportOffsetX,
    y: VIEWPORT_HALF_HEIGHT + (column - camera.tileColumn + row - camera.tileRow) * HALF_TILE_SIZE - camera.viewportOffsetY
  };
}

/** 旧掉落物投影；故意保留商、余数和整数截断的顺序。 */
export function projectLegacyPosition(worldX, worldY, camera) {
  return {
    x: VIEWPORT_HALF_WIDTH + ((worldX / TILE_SIZE | 0) - camera.tileColumn - ((worldY / TILE_SIZE | 0) - camera.tileRow)) * TILE_SIZE + ((worldX % TILE_SIZE | 0) - (worldY % TILE_SIZE | 0)) - camera.viewportOffsetX,
    y: VIEWPORT_HALF_HEIGHT + ((worldX / TILE_SIZE | 0) - camera.tileColumn + ((worldY / TILE_SIZE | 0) - camera.tileRow)) * HALF_TILE_SIZE + (((worldX % TILE_SIZE | 0) + (worldY % TILE_SIZE | 0)) / 2 | 0) - camera.viewportOffsetY
  };
}

/** 地面几何的连续版本。用于新场景物件、编辑器拾取和可见范围计算。 */
export function projectMap(worldX, worldY, centerX, centerY, elevation = 0) {
  return {
    x: VIEWPORT_HALF_WIDTH + worldX - centerX - (worldY - centerY),
    y: VIEWPORT_HALF_HEIGHT + (worldX - centerX + worldY - centerY) * HALF_TILE_SIZE / TILE_SIZE - elevation
  };
}

export function unprojectMap(screenX, screenY, centerX, centerY, elevation = 0) {
  const difference = screenX - VIEWPORT_HALF_WIDTH;
  const sum = (screenY - VIEWPORT_HALF_HEIGHT + elevation) * TILE_SIZE / HALF_TILE_SIZE;
  return { x: centerX + (sum + difference) / 2, y: centerY + (sum - difference) / 2 };
}

/** 图像基点允许在视口外，图像边缘仍可进入视口。extent 是相对基点的像素边界。 */
export function visibleTileBounds(centerX, centerY, extent = {}, width = VIEWPORT_WIDTH, height = VIEWPORT_HEIGHT) {
  const left = Math.min(0, extent.left || 0), top = Math.min(0, extent.top || 0);
  const right = Math.max(0, extent.right || 0), bottom = Math.max(0, extent.bottom || 0);
  const points = [
    unprojectMap(-right, -bottom, centerX, centerY),
    unprojectMap(width - left, -bottom, centerX, centerY),
    unprojectMap(-right, height - top, centerX, centerY),
    unprojectMap(width - left, height - top, centerX, centerY)
  ];
  return {
    minColumn: Math.floor(Math.min(...points.map(point => point.x)) / TILE_SIZE) - 1,
    maxColumn: Math.ceil(Math.max(...points.map(point => point.x)) / TILE_SIZE) + 1,
    minRow: Math.floor(Math.min(...points.map(point => point.y)) / TILE_SIZE) - 1,
    maxRow: Math.ceil(Math.max(...points.map(point => point.y)) / TILE_SIZE) + 1
  };
}

/** 单基点 painter 排序。图片高度不参与前后关系，多格物件使用 footprint 前沿。
 * 长斜墙的交叉遮挡需要分段；footprint 不改变寻路或战斗碰撞。
 */
export function visualDepthPosition(worldX, worldY, frame, footprint = frame?.footprint) {
  const offset = frame?.depthOffset || {};
  return {
    x: worldX + (offset.x || 0) + Math.max(0, (footprint?.columns || 1) - 1) * TILE_SIZE,
    y: worldY + (offset.y || 0) + Math.max(0, (footprint?.rows || 1) - 1) * TILE_SIZE
  };
}
