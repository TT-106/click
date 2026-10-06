import { cellAt, cellKey, pathField } from './navigation.js';
// 版本 2 的布局连同建筑参数冻结；后续修改正式预设不会改变旧存档的地图。
const BUILDING_PRESETS = {
  workshop: { width: 5, height: 5, door: { x: 4, y: 2 }, approach: { x: 1, y: 0 }, exterior: 'village.cabin.workshop' },
  herbalist: { width: 5, height: 5, door: { x: 1, y: 4 }, approach: { x: 0, y: 1 }, exterior: 'village.cabin.herbalist' },
  storehouse: { width: 5, height: 5, door: { x: 4, y: 3 }, approach: { x: 1, y: 0 }, exterior: 'village.cabin.storehouse' },
};

export const GENERATOR_VERSION = 2;
const WIDTH = 40, HEIGHT = 32;

/** 独立随机源，绝不消费经典游戏 RNG。子流使增添装饰不改变建筑和路线。 */
function randomStream(seed, salt) {
  let state = 2166136261;
  for (const char of `${seed}:${salt}`) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

export function generateLegacyVillage(seed = '旧村-01') {
  seed = String(seed).trim().slice(0, 64) || '旧村-01';
  const layoutRandom = randomStream(seed, 'layout'), decorRandom = randomStream(seed, 'decor');
  const world = {
    seed, generatorVersion: GENERATOR_VERSION, width: WIDTH, height: HEIGHT,
    cells: Array.from({ length: WIDTH * HEIGHT }, (_, index) => {
      const x = index % WIDTH, y = Math.floor(index / WIDTH);
      return { x, y, kind: 'grass', walkable: x > 0 && y > 0 && x < WIDTH - 1 && y < HEIGHT - 1, area: 'forest', elevation: 0, variant: 0 };
    }),
    objects: [], buildings: [], points: [], entrance: { x: 4, y: 26 }, exit: { x: 34, y: 5 },
  };
  const set = (x, y, kind, walkable = true, area = 'outside') => {
    if (x > 0 && y > 0 && x < WIDTH - 1 && y < HEIGHT - 1) Object.assign(cellAt(world, x, y), { kind, walkable, area });
  };
  const object = (x, y, visualId, properties = {}) => world.objects.push({ id: `object-${world.objects.length}`, x, y, visualId, ...properties });
  const rectangle = (left, top, width, height, kind, area = 'outside') => {
    for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) set(x, y, kind, true, area);
  };
  const route = (from, to, width = 1) => {
    let { x, y } = from;
    const stamp = () => { for (let dy = 0; dy < width; dy++) for (let dx = 0; dx < width; dx++) set(x + dx, y + dy, 'path'); };
    stamp();
    while (x !== to.x) { x += Math.sign(to.x - x); stamp(); }
    while (y !== to.y) { y += Math.sign(to.y - y); stamp(); }
  };
  // 连通骨架：广场和林道组成环路；河只有两处桥可通行，形成路线选择。
  rectangle(9, 17, 12, 9, 'path', 'plaza');
  route(world.entrance, { x: 12, y: 23 }, 2);
  const north = 8 + Math.floor(layoutRandom() * 3);
  const loop = [{ x: 15, y: 21 }, { x: 15, y: north }, { x: 31, y: north }, { x: 31, y: 23 }, { x: 15, y: 23 }];
  for (let index = 1; index < loop.length; index++) route(loop[index - 1], loop[index], 2);
  route({ x: 31, y: north }, world.exit, 2);
  rectangle(28, 16, 8, 9, 'grass', 'garden');
  rectangle(30, 3, 7, 5, 'path', 'ruins');
  // 河在骨架之后写入，桥保存被切断的两条主路线。
  for (let y = 1; y < HEIGHT - 1; y++) for (let x = 24; x <= 25; x++) set(x, y, 'water', false, 'river');
  for (const bridgeY of [north, 23]) rectangle(24, bridgeY, 2, 2, 'bridge', 'bridge');

  const house = (id, label, left, top, presetName) => {
    const preset = BUILDING_PRESETS[presetName], { width, height } = preset;
    const door = { x: left + preset.door.x, y: top + preset.door.y };
    const building = { id, label, left, top, width, height, door, preset: presetName };
    world.buildings.push(building);
    rectangle(left, top, width, height, 'floor', id);
    for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
      cellAt(world, x, y).outsideKind = 'grass';
      const boundary = y === top || x === left || y === top + height - 1 || x === left + width - 1;
      if (boundary && (x !== door.x || y !== door.y)) cellAt(world, x, y).walkable = false;
      // 墙分段而非整栋图片，一个基点能正确支持人物前后交替遮挡。
      if (boundary) object(x, y, x === left || x === left + width - 1 ? 'village.wall.sw' : 'village.wall.se', { building: id, door: x === door.x && y === door.y, interiorOnly: true, cutaway: x === left + width - 1 || y === top + height - 1 });
    }
    const furniture = { x: left + 1, y: top + 1 };
    cellAt(world, furniture.x, furniture.y).walkable = false;
    object(furniture.x, furniture.y, 'village.hay', { building: id });
    object(left + Math.floor((width - 1) / 2), top + Math.floor((height - 1) / 2), preset.exterior, { building: id, exterior: true });
    world.points.push({ id, label, x: left + width - 2, y: top + height - 2, building: id });
    const outside = { x: door.x + preset.approach.x, y: door.y + preset.approach.y };
    if (preset.approach.x) {
      route(outside, { x: 15, y: outside.y });
      route({ x: 15, y: outside.y }, { x: 15, y: 23 });
    } else route(outside, { x: outside.x, y: 23 });
  };
  house('house-mill', '林间工坊', 8, 11, 'workshop');
  house('house-herb', '药师木屋', 17, 11, 'herbalist');
  house('house-store', '村口仓房', 3, 17, 'storehouse');
  world.points.push({ id: 'plaza', label: '村落广场', x: 15, y: 22 }, { id: 'garden', label: '林间药园', x: 33, y: 19 }, { id: 'ruins', label: '溪北遗迹', x: 34, y: 5 });
  for (const [x, y] of [[30, 18], [30, 19], [31, 18], [31, 19], [33, 22]]) {
    cellAt(world, x, y).walkable = false; object(x, y, 'village.corn');
  }
  object(33, 4, 'village.ruin'); cellAt(world, 33, 4).walkable = false;
  object(35, 4, 'village.ruin'); cellAt(world, 35, 4).walkable = false;
  for (const cell of world.cells) {
    cell.variant = Math.floor(decorRandom() * 4);
    if (cell.kind !== 'grass' || cell.area !== 'forest') continue;
    // 屋檐和入口留两格庭院，防止树冠遮住门。草地本身可走，实际树干才阻挡导航。
    if (world.buildings.some(building => cell.x >= building.left - 2 && cell.x < building.left + building.width + 2 && cell.y >= building.top - 2 && cell.y < building.top + building.height + 2)) continue;
    if (decorRandom() < (cell.walkable ? .18 : .7)) {
      cell.walkable = false; object(cell.x, cell.y, decorRandom() < .55 ? 'village.tree.oak' : 'village.tree.pine');
    }
  }
  const field = pathField(world, world.entrance);
  world.reachable = [...field.distances.keys()];
  if (world.points.some(point => !field.distances.has(cellKey(point.x, point.y)))) throw new Error(`生成失败：兴趣点不连通 (${seed})`);
  return world;
}
