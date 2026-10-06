/** 本场景只存在一层可行走地表。导航与图片尺寸、相机、发现状态相互独立。 */
export const cellKey = (x, y) => `${x},${y}`;
export const cellAt = (world, x, y) => {
  const column = x - (world.originX || 0), row = y - (world.originY || 0);
  if (!Number.isInteger(column) || !Number.isInteger(row) || column < 0 || row < 0 || column >= world.width || row >= world.height) return undefined;
  return world.cells[row * world.width + column];
};
export function neighbors(world, x, y) {
  return [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]
    .filter(([column, row]) => cellAt(world, column, row)?.walkable);
}

/** 小地图等成本格使用 BFS；同一遍搜索同时得到实际路程和可回溯路径。 */
export function pathField(world, start, allowed = () => true, maxDistance = Infinity) {
  const startKey = cellKey(start.x, start.y);
  const distances = new Map([[startKey, 0]]), previous = new Map();
  const queue = [{ x: start.x, y: start.y }];
  if (!cellAt(world, start.x, start.y)?.walkable) return { distances: new Map(), previous: new Map() };
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index], currentKey = cellKey(current.x, current.y);
    if (distances.get(currentKey) >= maxDistance) continue;
    for (const [x, y] of neighbors(world, current.x, current.y)) {
      const key = cellKey(x, y);
      if (!distances.has(key) && allowed(key)) {
        distances.set(key, distances.get(currentKey) + 1);
        previous.set(key, currentKey); queue.push({ x, y });
      }
    }
  }
  return { distances, previous };
}

export function pathFrom(field, target) {
  let key = cellKey(target.x, target.y);
  if (!field.distances.has(key)) return [];
  const path = [];
  while (key) {
    const [x, y] = key.split(',').map(Number); path.push({ x, y });
    key = field.previous.get(key);
  }
  return path.reverse().slice(1);
}
