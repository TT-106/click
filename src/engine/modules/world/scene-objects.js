/** 地图场景物件（scene objects）的数据格式、校验与物化。
 *
 * 背景：`rendering/scene.js` 的 `drawSceneObjects` 早就支持
 * `{ visualId, position, footprint, elevation, layer }` 并**经语义资源目录解析** visualId
 * （新美术可直接用；见 docs/rendering.md）——但**没有任何生产者**写入 `map.sceneObjects`，
 * 所以这条通道一直是空的、无法"配置化摆放装饰"。
 *
 * 本模块补上生产者：地图（地牢/城堡）的主题可以声明一组**规则**，生成时把规则物化成
 * 具体的场景物件。目标是让"加装饰"变成**加数据**（原则 P1），而不是改生成器/渲染代码。
 *
 * 数据形态（每条规则）：
 *   {
 *     visualId: string          // 必填：语义资源 id（或兼容的旧图集名），经目录解析
 *     pattern: 'corners' | 'perimeter' | 'center' | 'scatter'
 *     layer?: 'ground' | 'scenery' | 'effect' | 'overlay'   // 默认 scenery
 *     chance?: 0..1             // 仅 scatter：按确定性散列筛选，不是 Math.random
 *     offset?: { x, y }         // 逻辑像素微调（TSize=27/格）
 *     elevation?: number        // 屏幕 Y 偏移（显示用）
 *     footprint?: { columns, rows }   // 仅显示排序占地，不参与碰撞
 *     onlyEncounterType?: 0..3  // 只作用于该遭遇类型的房间
 *   }
 *
 * **不消耗 RNG**：scatter 用独立的确定性散列（FNV-1a 混合，见 `hashToUnit`），不碰
 * `SeededRandom` 也不碰 `Math.random`，因此不改变原版随机流、不影响存档与差分
 * （`map.sceneObjects` 本就是显示数据，不进存档）。
 * 默认没有任何主题声明规则 ⇒ 物化结果为空 ⇒ 对既有地图零影响。
 *
 * 注：不复用 `core/math.js` 的 `hashCoordinates`——它是给 `SeededRandom` 当种子用的，
 * 输出值域很小（个位到百位），直接归一化会让所有 scatter 都命中（实测过）。
 */
import { TILE_SIZE } from '../core/screen-layout.js';

/** 独立的确定性 [0,1) 散列：FNV-1a 混合，纯函数、不读任何全局状态。 */
export function hashToUnit(...keys) {
  let hash = 2166136261 >>> 0;
  for (const key of keys) {
    hash ^= (key | 0) >>> 0;
    hash = Math.imul(hash, 16777619) >>> 0;
    hash ^= hash >>> 13;
  }
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909) >>> 0;
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

export const SCENE_OBJECT_LAYERS = Object.freeze(['ground', 'scenery', 'effect', 'overlay']);
export const SCENE_OBJECT_PATTERNS = Object.freeze(['corners', 'perimeter', 'center', 'scatter']);

function fail(message) { throw new Error(`场景物件配置错误: ${message}`); }
function point(value, label) {
  if (value && (!Number.isFinite(value.x) || !Number.isFinite(value.y))) fail(`${label} 必须包含有限的 x、y`);
}
function positive(value, label) { if (!Number.isFinite(value) || value <= 0) fail(`${label} 必须是正数`); }

/** 导入器与运行时共用校验；不创建任何资源。 */
export function validateSceneObjectRule(rule, label = 'sceneObject') {
  if (!rule || typeof rule !== 'object') fail(`${label} 必须是对象`);
  if (typeof rule.visualId !== 'string' || !rule.visualId.trim()) fail(`${label}.visualId 缺失`);
  if (!SCENE_OBJECT_PATTERNS.includes(rule.pattern)) fail(`${label}.pattern 必须是 ${SCENE_OBJECT_PATTERNS.join('/')}`);
  if (rule.layer !== undefined && !SCENE_OBJECT_LAYERS.includes(rule.layer)) fail(`${label}.layer 是未知绘制层`);
  if (rule.chance !== undefined) {
    if (!Number.isFinite(rule.chance) || rule.chance < 0 || rule.chance > 1) fail(`${label}.chance 必须在 0..1`);
    if (rule.pattern !== 'scatter') fail(`${label}.chance 只对 pattern='scatter' 有意义`);
  }
  point(rule.offset, `${label}.offset`);
  if (rule.elevation !== undefined && !Number.isFinite(rule.elevation)) fail(`${label}.elevation 必须是有限数`);
  if (rule.footprint) { positive(rule.footprint.columns, `${label}.footprint.columns`); positive(rule.footprint.rows, `${label}.footprint.rows`); }
  if (rule.onlyEncounterType !== undefined && ![0, 1, 2, 3].includes(rule.onlyEncounterType)) fail(`${label}.onlyEncounterType 必须是 0..3`);
  return rule;
}

/** 房间内部（地板）的 tile 坐标。房间字段与 `world/rooms.js` 的 DungeonRoom 一致：
 * tileColumn/tileRow 起、widthInTiles/heightInTiles 是**内部**地板范围，外墙在紧邻的一圈。
 * 返回行主序、去重后的稳定顺序（同一房间同一 pattern 恒得同一序列）。
 */
export function sceneObjectTiles(room, pattern) {
  const left = room.tileColumn, top = room.tileRow;
  const right = left + room.widthInTiles - 1, bottom = top + room.heightInTiles - 1;
  const tiles = [];
  const push = (column, row) => { if (!tiles.some((t) => t.column === column && t.row === row)) tiles.push({ column, row }); };
  if (pattern === 'center') {
    push(Math.floor((left + right) / 2), Math.floor((top + bottom) / 2));
  } else if (pattern === 'corners') {
    push(left, top); push(right, top); push(left, bottom); push(right, bottom);
  } else {
    for (let row = top; row <= bottom; row++) {
      for (let column = left; column <= right; column++) {
        const isPerimeter = row === top || row === bottom || column === left || column === right;
        if (pattern === 'scatter' || isPerimeter) push(column, row);
      }
    }
  }
  return tiles;
}

/** 把规则物化成场景物件数组。roomId 参与散列，保证同种子同房间得到同一结果。 */
export function materializeSceneObjects({ rooms, rules, seed = 0 }) {
  const objects = [];
  if (!rules || !rules.length || !rooms || !rooms.length) return objects;
  rules.forEach((rule, index) => validateSceneObjectRule(rule, `sceneObjects[${index}]`));
  rooms.forEach((room, roomIndex) => {
    const roomId = Number.isFinite(room.roomId) ? room.roomId : roomIndex;
    rules.forEach((rule, ruleIndex) => {
      if (rule.onlyEncounterType !== undefined && room.encounterType !== rule.onlyEncounterType) return;
      const offset = rule.offset || { x: 0, y: 0 };
      sceneObjectTiles(room, rule.pattern).forEach((tile, tileIndex) => {
        if (rule.chance !== undefined && rule.chance < 1) {
          if (hashToUnit(seed, roomId, ruleIndex, tileIndex) >= rule.chance) return;
        }
        objects.push({
          visualId: rule.visualId,
          position: { x: tile.column * TILE_SIZE + offset.x, y: tile.row * TILE_SIZE + offset.y },
          layer: rule.layer || 'scenery',
          footprint: { columns: rule.footprint?.columns ?? 1, rows: rule.footprint?.rows ?? 1 },
          elevation: rule.elevation || 0
        });
      });
    });
  });
  return objects;
}

/** 把物件写回地图（默认追加；`replace` 用于重新生成时整批替换）。 */
export function installSceneObjects(map, objects, { replace = false } = {}) {
  if (!Array.isArray(map.sceneObjects)) map.sceneObjects = [];
  if (replace) map.sceneObjects.length = 0;
  if (objects) map.sceneObjects.push(...objects);
  return map.sceneObjects;
}

/** 生成期入口：主题声明了 rules 才物化（否则保持为空，对既有地图零影响）。 */
export function installThemeSceneObjects(map, theme, seed) {
  const rules = theme && theme.sceneObjects;
  if (!rules || !rules.length) return map.sceneObjects;
  return installSceneObjects(map, materializeSceneObjects({ rooms: map.roomList || [], rules, seed }), { replace: true });
}
