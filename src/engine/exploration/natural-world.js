import { createNaturalTerrain, coordinateRandom, WORLD_CHUNK_SIZE, WORLD_GENERATOR_VERSION } from './natural-terrain.js';
import { BUILDING_PRESETS, NATURAL_BUILDING_RULES } from './building-presets.js';
import { cellKey } from './navigation.js';

const SITE_SIZE = 18, CACHE_LIMIT = 25;
const intersects = (building, bounds) => building.left < bounds.right && building.left + building.width > bounds.left
  && building.top < bounds.bottom && building.top + building.height > bounds.top;
const boundedCache = (cache, key, value, limit) => {
  cache.set(key, value);
  if (cache.size > limit) cache.delete(cache.keys().next().value);
  return value;
};

/** 全局自然世界。窗口和缓存可丢弃，种子及坐标足以重建地形、道路和建筑。 */
export class NaturalWorld {
  constructor(seed = '原野-01') {
    this.seed = String(seed).trim().slice(0, 64) || '原野-01';
    this.terrain = createNaturalTerrain(this.seed);
    this.chunks = new Map(); this.generated = new Set();
    this.sites = new Map(); this.routes = new Map(); this.view = null;
  }

  structure(siteX, siteY) {
    const key = cellKey(siteX, siteY);
    if (this.sites.has(key)) return this.sites.get(key);
    const random = salt => coordinateRandom(this.terrain.code, siteX, siteY, salt);
    if (random(101) > .43) return boundedCache(this.sites, key, null, 1024);
    const left = siteX * SITE_SIZE + 4 + Math.floor(random(102) * 6), top = siteY * SITE_SIZE + 4 + Math.floor(random(103) * 6);
    const center = this.terrain.field(left + 2, top + 2);
    let low = 1, high = 0, nearWater = false;
    for (const [x, y] of [[left - 4, top + 2], [left + 8, top + 2], [left + 2, top - 4], [left + 2, top + 8]]) nearWater ||= this.terrain.field(x, y).water;
    const eligible = NATURAL_BUILDING_RULES.filter(rule => center.moisture > (rule.minimumMoisture ?? -1) && center.moisture <= (rule.maximumMoisture ?? 1)
      && (rule.nearWater === undefined || rule.nearWater === nearWater));
    const priority = Math.max(...eligible.map(rule => rule.priority));
    const choices = eligible.filter(rule => rule.priority === priority);
    let weight = random(104) * choices.reduce((sum, rule) => sum + rule.weight, 0);
    const selected = choices.find(rule => { weight -= rule.weight; return weight < 0; });
    if (!selected) return boundedCache(this.sites, key, null, 1024);
    const presetId = selected.preset, preset = BUILDING_PRESETS[presetId];
    if (!preset || preset.width < 4 || preset.height < 4 || left + preset.width >= (siteX + 1) * SITE_SIZE || top + preset.height >= (siteY + 1) * SITE_SIZE) throw new Error('自然建筑预设超出选址单元或缺少内部空间');
    // 连院落一起检查：不在河中盖房，不覆盖陡变地带，不用固定村落布局补齐数量。
    for (let y = top - 1; y <= top + preset.height; y++) for (let x = left - 1; x <= left + preset.width; x++) {
      const sample = this.terrain.field(x, y);
      if (sample.water) return boundedCache(this.sites, key, null, 1024);
      low = Math.min(low, sample.height); high = Math.max(high, sample.height);
    }
    if (high - low > .14 || center.height > .72) return boundedCache(this.sites, key, null, 1024);
    const id = `structure:${siteX},${siteY}`;
    const door = { x: left + preset.door.x, y: top + preset.door.y };
    return boundedCache(this.sites, key, { id, label: selected.label, siteX, siteY, left, top, width: preset.width, height: preset.height,
      preset: presetId, door, approach: { x: door.x + preset.approach.x, y: door.y + preset.approach.y } }, 1024);
  }

  structures(bounds) {
    const result = [];
    for (let y = Math.floor(bounds.top / SITE_SIZE) - 1; y <= Math.floor(bounds.bottom / SITE_SIZE); y++) {
      for (let x = Math.floor(bounds.left / SITE_SIZE) - 1; x <= Math.floor(bounds.right / SITE_SIZE); x++) {
        const building = this.structure(x, y);
        if (building && intersects(building, bounds)) result.push(building);
      }
    }
    return result;
  }

  /** 有界地形寻路修路：湖泊不强制连通，短水段才生成桥；房屋占地不可穿越。 */
  road(building, neighbor) {
    const key = `${building.id}/${neighbor.id}`;
    if (this.routes.has(key)) return this.routes.get(key);
    const start = building.approach, end = neighbor.approach;
    const bounds = { left: Math.min(start.x, end.x) - 5, top: Math.min(start.y, end.y) - 5,
      right: Math.max(start.x, end.x) + 6, bottom: Math.max(start.y, end.y) + 6 };
    const blocked = new Set();
    for (const house of this.structures(bounds)) for (let y = house.top; y < house.top + house.height; y++) for (let x = house.left; x < house.left + house.width; x++) blocked.add(cellKey(x, y));
    const heuristic = point => Math.abs(point.x - end.x) + Math.abs(point.y - end.y);
    const queue = [{ ...start, cost: 0, score: heuristic(start) }], costs = new Map([[cellKey(start.x, start.y), 0]]), previous = new Map();
    let destination = null, budget = 2500;
    while (queue.length && budget-- > 0) {
      queue.sort((a, b) => b.score - a.score || b.cost - a.cost || b.y - a.y || b.x - a.x);
      const current = queue.pop(), currentKey = cellKey(current.x, current.y);
      if (current.cost !== costs.get(currentKey)) continue;
      if (current.x === end.x && current.y === end.y) { destination = currentKey; break; }
      for (const [x, y] of [[current.x, current.y - 1], [current.x + 1, current.y], [current.x, current.y + 1], [current.x - 1, current.y]]) {
        if (x < bounds.left || y < bounds.top || x >= bounds.right || y >= bounds.bottom || blocked.has(cellKey(x, y))) continue;
        const sample = this.terrain.sample(x, y), cost = current.cost + (sample.water ? 12 : sample.tree ? 1.8 : 1);
        const nextKey = cellKey(x, y);
        if (cost >= (costs.get(nextKey) ?? Infinity)) continue;
        costs.set(nextKey, cost); previous.set(nextKey, currentKey); queue.push({ x, y, cost, score: cost + heuristic({ x, y }) });
      }
    }
    const cells = [];
    while (destination) { const [x, y] = destination.split(',').map(Number); cells.push({ x, y }); destination = previous.get(destination); }
    cells.reverse();
    let waterRun = 0, waterDirection = null;
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      if (this.terrain.field(cell.x, cell.y).water) {
        waterRun++;
        const previousCell = cells[index - 1], direction = previousCell && `${cell.x - previousCell.x},${cell.y - previousCell.y}`;
        if (waterRun > 4 || (waterDirection && direction !== waterDirection)) return boundedCache(this.routes, key, null, 256);
        waterDirection = direction;
      } else { waterRun = 0; waterDirection = null; }
    }
    return boundedCache(this.routes, key, cells.length ? { id: key, start, end, cells } : null, 256);
  }

  crossings(bounds) {
    const result = [];
    for (let row = Math.floor(bounds.top / 8) - 1; row <= Math.floor(bounds.bottom / 8); row++) for (let column = Math.floor(bounds.left / 8) - 1; column <= Math.floor(bounds.right / 8); column++) {
      const random = salt => coordinateRandom(this.terrain.code, column, row, salt);
      if (random(121) > .65) continue;
      const start = { x: column * 8 + Math.floor(random(122) * 8), y: row * 8 + Math.floor(random(123) * 8) };
      if (this.terrain.field(start.x, start.y).water) continue;
      for (const [stepX, stepY] of [[1, 0], [0, 1]]) {
        const cells = []; let end = null;
        for (let distance = 1; distance <= 5; distance++) {
          const position = { x: start.x + stepX * distance, y: start.y + stepY * distance };
          if (!this.terrain.field(position.x, position.y).water) { if (cells.length) end = position; break; }
          cells.push(position);
        }
        if (end && cells.length <= 4) result.push({ id: `crossing:${column},${row}:${stepX}`, start, end, cells });
      }
    }
    return result;
  }

  getChunk(chunkX, chunkY) {
    if (!Number.isInteger(chunkX) || !Number.isInteger(chunkY) || Math.abs(chunkX * WORLD_CHUNK_SIZE) > 1000000 || Math.abs(chunkY * WORLD_CHUNK_SIZE) > 1000000) throw new Error('世界区块坐标无效');
    const key = cellKey(chunkX, chunkY);
    this.generated.add(key);
    if (this.chunks.has(key)) { const chunk = this.chunks.get(key); this.chunks.delete(key); this.chunks.set(key, chunk); return chunk; }
    const originX = chunkX * WORLD_CHUNK_SIZE, originY = chunkY * WORLD_CHUNK_SIZE;
    const bounds = { left: originX, top: originY, right: originX + WORLD_CHUNK_SIZE, bottom: originY + WORLD_CHUNK_SIZE };
    const cells = Array.from({ length: WORLD_CHUNK_SIZE ** 2 }, (_, index) => this.terrain.sample(originX + index % WORLD_CHUNK_SIZE, originY + Math.floor(index / WORLD_CHUNK_SIZE)));
    const lookup = (x, y) => x >= bounds.left && y >= bounds.top && x < bounds.right && y < bounds.bottom ? cells[(y - originY) * WORLD_CHUNK_SIZE + x - originX] : null;
    const buildings = this.structures({ left: bounds.left - 1, top: bounds.top - 1, right: bounds.right + 1, bottom: bounds.bottom + 1 }), objects = [], points = [], roads = [];
    // 同一候选边不受当前区块影响。足够的邻域包含所有可能穿过此区块的短道路。
    for (const house of this.structures({ left: bounds.left - SITE_SIZE * 2, top: bounds.top - SITE_SIZE * 2, right: bounds.right + SITE_SIZE, bottom: bounds.bottom + SITE_SIZE })) {
      for (const [stepX, stepY] of [[1, 0], [0, 1]]) {
        const other = this.structure(house.siteX + stepX, house.siteY + stepY);
        if (!other) continue;
        const route = this.road(house, other);
        if (route && route.cells.some(cell => lookup(cell.x, cell.y))) roads.push(route);
      }
    }
    const crossings = this.crossings(bounds);
    for (const route of [...roads, ...crossings]) for (const position of [route.start, ...route.cells, route.end]) {
      const cell = lookup(position.x, position.y);
      if (cell) Object.assign(cell, { kind: cell.water ? 'bridge' : 'path', walkable: true, tree: false, area: 'road' });
    }
    const object = (x, y, visualId, extra = {}) => { if (lookup(x, y)) objects.push({ id: `${visualId}:${x},${y}`, x, y, visualId, ...extra }); };
    for (const building of buildings) {
      const preset = BUILDING_PRESETS[building.preset];
      for (let y = building.top - 1; y <= building.top + building.height; y++) for (let x = building.left - 1; x <= building.left + building.width; x++) {
        const cell = lookup(x, y); if (!cell) continue;
        cell.tree = false; cell.walkable = !cell.water;
        if (x < building.left || y < building.top || x >= building.left + building.width || y >= building.top + building.height) continue;
        const boundary = x === building.left || y === building.top || x === building.left + building.width - 1 || y === building.top + building.height - 1;
        const door = x === building.door.x && y === building.door.y;
        Object.assign(cell, { outsideKind: cell.kind, kind: 'floor', walkable: !boundary || door, area: building.id });
        if (boundary) object(x, y, x === building.left || x === building.left + building.width - 1 ? 'village.wall.sw' : 'village.wall.se',
          { building: building.id, door, interiorOnly: true, cutaway: x === building.left + building.width - 1 || y === building.top + building.height - 1 });
      }
      const furniture = lookup(building.left + 1, building.top + 1);
      if (furniture) furniture.walkable = false;
      object(building.left + 1, building.top + 1, 'village.hay', { building: building.id });
      object(building.left + Math.floor((building.width - 1) / 2), building.top + Math.floor((building.height - 1) / 2), preset.exterior, { building: building.id, exterior: true });
      const point = { id: building.id, label: building.label, x: building.left + building.width - 2, y: building.top + building.height - 2, building: building.id };
      if (lookup(point.x, point.y)) points.push(point);
    }
    for (const cell of cells) if (cell.tree) object(cell.x, cell.y, coordinateRandom(this.terrain.code, cell.x, cell.y, 131) < .55 ? 'village.tree.oak' : 'village.tree.pine', { canopy: true });
    return boundedCache(this.chunks, key, { chunkX, chunkY, originX, originY, cells, buildings, objects, points, roads, crossings }, CACHE_LIMIT);
  }

  getCell(x, y) {
    if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error('世界格坐标无效');
    const chunk = this.getChunk(Math.floor(x / WORLD_CHUNK_SIZE), Math.floor(y / WORLD_CHUNK_SIZE));
    return chunk.cells[(y - chunk.originY) * WORLD_CHUNK_SIZE + x - chunk.originX];
  }

  findEntrance() {
    // 从全局原点向外搜索实际陆地，避免把任何种子的起点改造成固定村庄。
    for (let radius = 0; radius <= 256; radius++) for (let y = -radius; y <= radius; y++) for (let x = -radius; x <= radius; x++) {
      if (Math.max(Math.abs(x), Math.abs(y)) !== radius || !this.terrain.sample(x, y).walkable) continue;
      const cell = this.getCell(x, y);
      if (!cell.walkable || cell.area.startsWith('structure:')) continue;
      const queue = [{ x, y }], reached = new Set([cellKey(x, y)]);
      for (let index = 0; index < queue.length && reached.size < 32; index++) {
        const current = queue[index];
        for (const [column, row] of [[current.x - 1, current.y], [current.x + 1, current.y], [current.x, current.y - 1], [current.x, current.y + 1]]) {
          if (Math.abs(column - x) > 8 || Math.abs(row - y) > 8 || reached.has(cellKey(column, row)) || !this.getCell(column, row).walkable) continue;
          reached.add(cellKey(column, row)); queue.push({ x: column, y: row });
        }
      }
      if (reached.size >= 32) return { x: x || 0, y: y || 0 };
    }
    throw new Error('此种子在起点附近没有可通行陆地');
  }

  ensureAround(position) {
    const chunkX = Math.floor(position.x / WORLD_CHUNK_SIZE), chunkY = Math.floor(position.y / WORLD_CHUNK_SIZE);
    if (this.view?.chunkX === chunkX && this.view.chunkY === chunkY) return this.view;
    const chunks = [];
    for (let y = chunkY - 1; y <= chunkY + 1; y++) for (let x = chunkX - 1; x <= chunkX + 1; x++) chunks.push(this.getChunk(x, y));
    const originX = (chunkX - 1) * WORLD_CHUNK_SIZE, originY = (chunkY - 1) * WORLD_CHUNK_SIZE, width = WORLD_CHUNK_SIZE * 3;
    const cells = new Array(width ** 2);
    for (const chunk of chunks) for (const cell of chunk.cells) cells[(cell.y - originY) * width + cell.x - originX] = cell;
    const collect = property => [...new Map(chunks.flatMap(chunk => chunk[property]).map(value => [value.id, value])).values()];
    this.view = { seed: this.seed, generatorVersion: WORLD_GENERATOR_VERSION, chunkX, chunkY, originX, originY, width, height: width, cells,
      buildings: collect('buildings'), objects: collect('objects'), points: collect('points'), roads: collect('roads'), crossings: collect('crossings'), continuous: true };
    return this.view;
  }

  resolvePoint(id) {
    if (typeof id !== 'string' || !/^structure:-?\d+,-?\d+$/.test(id)) return null;
    const [siteX, siteY] = id.slice(10).split(',').map(Number);
    if (!Number.isInteger(siteX) || !Number.isInteger(siteY) || Math.abs(siteX * SITE_SIZE) > 999900 || Math.abs(siteY * SITE_SIZE) > 999900) return null;
    const building = this.structure(siteX, siteY);
    return building?.id === id ? { id, label: building.label, x: building.left + building.width - 2, y: building.top + building.height - 2, building: id } : null;
  }
}
