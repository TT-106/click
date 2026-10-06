import { cellAt, cellKey } from './navigation.js';

// 双格网的四个角对应四个逻辑格中心：NW=1、NE=2、SE=4、SW=8。
// 曲线控制点也是世界比例坐标。斜向相接的 5/10 分成两块，符合四邻格导航。
const corner = [['M', 0, 0], ['L', .5, 0], ['Q', .5, .5, 0, .5], ['Z']];
const half = [['M', 0, 0], ['L', 1, 0], ['L', 1, .5], ['L', 0, .5], ['Z']];
const missing = [['M', .5, 0], ['L', 1, 0], ['L', 1, 1], ['L', 0, 1], ['L', 0, .5], ['Q', .5, .5, .5, 0], ['Z']];
const rotate = (commands, turns) => commands.map(([operation, ...numbers]) => {
  const result = [operation];
  for (let index = 0; index < numbers.length; index += 2) {
    let x = numbers[index], y = numbers[index + 1];
    for (let turn = 0; turn < turns; turn++) [x, y] = [1 - y, x];
    result.push(x, y);
  }
  return result;
});
const cases = Array.from({ length: 16 }, () => []);
for (let rotation = 0; rotation < 4; rotation++) {
  cases[1 << rotation] = [rotate(corner, rotation)];
  cases[[3, 6, 12, 9][rotation]] = [rotate(half, rotation)];
  cases[15 ^ (1 << rotation)] = [rotate(missing, rotation)];
}
cases[5] = [rotate(corner, 0), rotate(corner, 2)];
cases[10] = [rotate(corner, 1), rotate(corner, 3)];
cases[15] = [[['M', 0, 0], ['L', 1, 0], ['L', 1, 1], ['L', 0, 1], ['Z']]];

export function terrainContours(mask) {
  if (!Number.isInteger(mask) || mask < 0 || mask > 15) throw new Error('地表邻接掩码无效');
  return cases[mask];
}

/** 仅已知格参与连接；未知格的类型和变体不影响输出，不泄漏隐藏地形。 */
export function buildGroundPatches(world, discovered, inside, layers, bounds = null) {
  const patches = [];
  const originX = world.originX || 0, originY = world.originY || 0;
  const left = Math.max(originX, bounds?.left ?? originX), top = Math.max(originY, bounds?.top ?? originY);
  const right = Math.min(originX + world.width - 1, bounds?.right ?? originX + world.width - 1);
  const bottom = Math.min(originY + world.height - 1, bounds?.bottom ?? originY + world.height - 1);
  for (const layer of layers) {
    const members = new Set(layer.members);
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      const cells = [cellAt(world, x, y), cellAt(world, x + 1, y), cellAt(world, x + 1, y + 1), cellAt(world, x, y + 1)];
      let mask = 0, variant = 0;
      cells.forEach((cell, index) => {
        if (!discovered.has(cellKey(cell.x, cell.y))) return;
        const kind = cell.outsideKind && !inside.has(cell.area) ? cell.outsideKind : cell.kind;
        if (members.has(kind)) { if (!mask) variant = cell.variant || 0; mask |= 1 << index; }
      });
      if (mask) patches.push({ x, y, layer: layer.kind, mask, variant, contours: terrainContours(mask) });
    }
  }
  return patches;
}
