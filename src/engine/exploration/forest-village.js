import { cellAt, cellKey, pathField, pathFrom } from './navigation.js';
import { BUILDING_PRESETS } from './building-presets.js';
import { planVillageLayout } from './village-layout.js';
import { generateLegacyVillage } from './legacy-village.js';

export const GENERATOR_VERSION = 3;
const WIDTH = 40, HEIGHT = 32;

/** 独立随机源，绝不消费经典游戏 RNG。子流使增添装饰不改变建筑和路线。 */
function randomStream(seed, salt) {
  let state = 2166136261;
  for (const char of `${seed}:${salt}`) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

/** 先放地表和建筑，再按真实路程连通道路，最后放植被。旧记录保持原生成规则。 */
export function generateForestVillage(seed = '旧村-01', version = GENERATOR_VERSION) {
  if (version === 2) return generateLegacyVillage(seed);
  if (version !== GENERATOR_VERSION) throw new Error('不支持的地图生成器版本');
  seed = String(seed).trim().slice(0, 64) || '旧村-01';
  const layout = planVillageLayout(randomStream(seed, 'layout'), WIDTH, HEIGHT), decorRandom = randomStream(seed, 'decor');
  const world = {
    seed, generatorVersion: GENERATOR_VERSION, width: WIDTH, height: HEIGHT, layout: { id: layout.id, label: layout.label },
    cells: Array.from({ length: WIDTH * HEIGHT }, (_, index) => {
      const x = index % WIDTH, y = Math.floor(index / WIDTH);
      return { x, y, kind: 'grass', walkable: x > 0 && y > 0 && x < WIDTH - 1 && y < HEIGHT - 1, area: 'forest', elevation: 0, variant: 0 };
    }),
    objects: [], buildings: [], points: [], roads: [], crossings: [], entrance: layout.entrance, exit: layout.exit,
  };
  const set = (x, y, kind, walkable = true, area = 'outside') => {
    if (x > 0 && y > 0 && x < WIDTH - 1 && y < HEIGHT - 1) Object.assign(cellAt(world, x, y), { kind, walkable, area });
  };
  const object = (x, y, visualId, properties = {}) => world.objects.push({ id: `object-${world.objects.length}`, x, y, visualId, ...properties });
  const clearing = (center, radiusX, radiusY, kind, area) => {
    for (let y = center.y - radiusY; y <= center.y + radiusY; y++) for (let x = center.x - radiusX; x <= center.x + radiusX; x++) {
      if (x > 0 && y > 0 && x < WIDTH - 1 && y < HEIGHT - 1 && !['water', 'bridge'].includes(cellAt(world, x, y).kind)
        && ((x - center.x) / radiusX) ** 2 + ((y - center.y) / radiusY) ** 2 <= 1) set(x, y, kind, true, area);
    }
  };
  // 两格宽的连续河道；岸边独立于水面，通行规则不由显示轮廓决定。
  for (let y = 1; y < HEIGHT - 1; y++) {
    for (let x = layout.river[y] - 1; x <= layout.river[y] + 2; x++) set(x, y, 'bank', true, 'riverbank');
  }
  for (let y = 1; y < HEIGHT - 1; y++) for (let x = layout.river[y]; x <= layout.river[y] + 1; x++) set(x, y, 'water', false, 'river');
  for (const y of layout.bridges) {
    const left = layout.river[y], cells = [];
    for (let row = y; row <= y + 1; row++) for (let x = left; x <= left + 1; x++) { set(x, row, 'bridge', true, 'bridge'); cells.push({ x, y: row }); }
    world.crossings.push({ cells, west: { x: left - 1, y }, east: { x: left + 2, y } });
  }
  clearing(layout.plaza, 3, 2, 'path', 'plaza');
  clearing(layout.garden, 3, 3, 'grass', 'garden');
  clearing(world.exit, 2, 2, 'path', 'ruins');

  const identities = { workshop: ['house-mill', '林间工坊'], herbalist: ['house-herb', '药师木屋'], storehouse: ['house-store', '村口仓房'] };
  const approaches = [];
  for (const placement of layout.houses) {
    const preset = BUILDING_PRESETS[placement.preset], { width, height } = preset, left = placement.x, top = placement.y;
    const [id, label] = identities[placement.preset], door = { x: left + preset.door.x, y: top + preset.door.y };
    const building = { id, label, left, top, width, height, door, preset: placement.preset };
    world.buildings.push(building);
    for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
      const boundary = y === top || x === left || y === top + height - 1 || x === left + width - 1;
      const isDoor = x === door.x && y === door.y;
      set(x, y, 'floor', !boundary || isDoor, id); cellAt(world, x, y).outsideKind = 'grass';
      if (boundary) object(x, y, x === left || x === left + width - 1 ? 'village.wall.sw' : 'village.wall.se',
        { building: id, door: isDoor, interiorOnly: true, cutaway: x === left + width - 1 || y === top + height - 1 });
    }
    cellAt(world, left + 1, top + 1).walkable = false;
    object(left + 1, top + 1, 'village.hay', { building: id });
    object(left + Math.floor((width - 1) / 2), top + Math.floor((height - 1) / 2), preset.exterior, { building: id, exterior: true });
    world.points.push({ id, label, x: left + width - 2, y: top + height - 2, building: id });
    approaches.push({ x: door.x + preset.approach.x, y: door.y + preset.approach.y });
  }
  world.points.push({ id: 'plaza', label: '村落广场', ...layout.plaza }, { id: 'garden', label: '林间药园', ...layout.garden }, { id: 'ruins', label: '溪北遗迹', ...world.exit });
  for (const [dx, dy] of [[-2, -1], [-2, 0], [-1, -1], [-1, 0], [1, 2]]) {
    const x = layout.garden.x + dx, y = layout.garden.y + dy;
    cellAt(world, x, y).walkable = false; object(x, y, 'village.corn');
  }
  for (const dx of [-1, 1]) { object(world.exit.x + dx, world.exit.y - 1, 'village.ruin'); cellAt(world, world.exit.x + dx, world.exit.y - 1).walkable = false; }
  connectRoads(world, [world.entrance, layout.plaza, ...approaches, layout.garden, world.exit, ...world.crossings.flatMap(crossing => [crossing.west, crossing.east])]);
  // 实际河岸的道路不变成可过河的泥土；道路边留空，林间产生疏密不同的树丛。
  const groves = Array.from({ length: 4 }, () => ({ x: 2 + decorRandom() * (WIDTH - 4), y: 2 + decorRandom() * (HEIGHT - 4) }));
  for (const cell of world.cells) {
    cell.variant = Math.floor(decorRandom() * 4);
    if (cell.kind !== 'grass' || cell.area !== 'forest') continue;
    if (world.buildings.some(building => cell.x >= building.left - 2 && cell.x < building.left + building.width + 2 && cell.y >= building.top - 2 && cell.y < building.top + building.height + 2)) continue;
    if (world.points.some(point => Math.abs(cell.x - point.x) + Math.abs(cell.y - point.y) <= 2)) continue;
    if ([[cell.x - 1, cell.y], [cell.x + 1, cell.y], [cell.x, cell.y - 1], [cell.x, cell.y + 1]]
      .some(([x, y]) => x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT && cellAt(world, x, y).kind === 'path')) continue;
    const dense = groves.some(grove => Math.hypot(cell.x - grove.x, cell.y - grove.y) < 6);
    if (decorRandom() < (cell.walkable ? dense ? .27 : .08 : .7)) {
      cell.walkable = false; object(cell.x, cell.y, decorRandom() < .55 ? 'village.tree.oak' : 'village.tree.pine');
    }
  }
  const field = pathField(world, world.entrance);
  world.reachable = [...field.distances.keys()];
  if (world.points.some(point => !field.distances.has(cellKey(point.x, point.y)))) throw new Error(`生成失败：兴趣点不连通 (${seed})`);
  return world;
}

/** 最短路上的最小连接树连接所有地点，额外连接两岸和桥构成环路。 */
function connectRoads(world, nodes) {
  const fields = nodes.map(node => pathField(world, node)), connected = new Set([0]);
  const stamp = (from, to) => {
    const cells = [nodes[from], ...pathFrom(fields[from], nodes[to])];
    if (cells.length < 2 && from !== to) throw new Error('生成失败：道路目标不可达');
    world.roads.push({ start: { ...nodes[from] }, end: { ...nodes[to] }, cells });
    for (const position of cells) {
      const cell = cellAt(world, position.x, position.y);
      if (['grass', 'bank'].includes(cell.kind)) { cell.kind = 'path'; cell.area = 'road'; }
    }
  };
  while (connected.size < nodes.length) {
    let best = null;
    for (const from of connected) for (let to = 0; to < nodes.length; to++) {
      if (connected.has(to)) continue;
      const distance = fields[from].distances.get(cellKey(nodes[to].x, nodes[to].y));
      if (distance !== undefined && (!best || distance < best.distance)) best = { sourceIndex: from, targetIndex: to, distance };
    }
    if (!best) throw new Error('生成失败：无法连接地图地点');
    stamp(best.sourceIndex, best.targetIndex); connected.add(best.targetIndex);
  }
  const first = nodes.length - 4;
  for (const [from, to] of [[first, first + 1], [first + 2, first + 3], [first, first + 2], [first + 1, first + 3]]) stamp(from, to);
}
