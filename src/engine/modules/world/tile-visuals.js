/** tile 的显示层：语义数据 + 兼容访问器。
 *
 * 背景：旧 tile 只有三个**固定字段**（background/decoration/cachedBackground）——世界 tile 用前两个、
 * 地牢 tile 用三个；这三个字段"叫什么、什么顺序、走哪个绘制通道"同时散落在三处：
 * rooms.js/terrain.js 的访问器安装、scene.js 两个 draw*TileRow 里各抄一遍的三段绘制代码。
 * 加第四层（家具/屋顶/前景）要同时改这三处。
 *
 * 本模块把"有哪些层、什么顺序、什么绘制通道"提成**单一数据来源** TILE_VISUAL_SLOTS：
 *   - 访问器安装（本文件）按 slots 生成 `tile.<entity> -> tile.<idField>` 的晚解析访问器；
 *   - 渲染（scene.js 的 drawTileVisuals）按同一 slots 顺序与 mode 分派到绘制通道。
 * 因此新增/调整一层只改这一张表，不再需要碰渲染代码。
 *
 * mode 三种，对应现有的三条绘制调用：
 *   ground        —— 立即绘制（地面层）
 *   scenery       —— 深度队列（脚点排序，scenery 层）
 *   sceneryRaised —— 深度队列 + raised 偏移（贴墙底图用）
 *
 * 另支持**逐 tile 的动态层** `tile.visualLayers = [{ assetId, mode }]`，追加在固定层之后，
 * 用于生成器/编辑器摆放家具、屋顶、前景等；是显示数据，不写入存档（见 docs/rendering.md）。
 * 默认没有该字段时为空操作，因此对既有地图零影响。
 */
export const TILE_LAYER_MODES = Object.freeze(['ground', 'scenery', 'sceneryRaised']);

/** 世界 tile 的两层（地板 + 装饰）。 */
export const WORLD_TILE_VISUAL_SLOTS = Object.freeze([
  { entity: 'backgroundSprite', idField: 'backgroundAssetId', mode: 'ground' },
  { entity: 'decorationSprite', idField: 'decorationAssetId', mode: 'scenery' }
]);

/** 地牢 tile 的三层（地板 + 装饰 + 贴墙底图）。 */
export const DUNGEON_TILE_VISUAL_SLOTS = Object.freeze([
  ...WORLD_TILE_VISUAL_SLOTS,
  { entity: 'cachedBackgroundSprite', idField: 'cachedBackgroundAssetId', mode: 'sceneryRaised' }
]);

/** 按 slots 生成晚解析访问器：读 tile[entity] 时经目录取当前资源，写入时记 assetId。
 * @param {any} prototype
 * @param {() => ({ getSprite: (key: string) => any } | null | undefined)} catalogProvider
 * @param {ReadonlyArray<{ entity: string, idField: string, mode: string }>} slots
 */
export function installTileVisualAccessors(prototype, catalogProvider, slots) {
  for (const { entity, idField } of slots) {
    const fallback = `_${entity}Fallback`;
    Object.defineProperty(prototype, entity, {
      configurable: true,
      get() {
        const id = this[idField];
        if (!id) return this[fallback] || null;
        return catalogProvider()?.getSprite(id) || this[fallback] || null;
      },
      set(value) {
        this[idField] = typeof value === 'string' ? value : value?.id || value?.name || null;
        // 无名称的 mock 仍可用于既有工具；已注册素材始终由目录晚解析。
        this[fallback] = value && typeof value !== 'string' && !catalogProvider()?.getSprite(this[idField]) ? value : null;
      }
    });
  }
}

/** 追加一个逐 tile 的动态显示层（家具/屋顶/前景等）。不动固定层，不进存档。 */
export function addTileVisualLayer(tile, assetId, mode = 'scenery') {
  if (!TILE_LAYER_MODES.includes(mode)) throw new Error(`未知 tile 显示层通道: ${mode}`);
  (tile.visualLayers || (tile.visualLayers = [])).push({ assetId, mode });
  return tile;
}

/** 收集一个 tile 的显示调用（**顺序即绘制顺序**）：固定层在前，动态层在后。
 * 纯函数：`resolve` 把"默认字段/assetId"变成绘制帧，跳过解析不到的空层。
 * @param {any} tile
 * @param {ReadonlyArray<{ entity: string, mode: string }>} slots
 * @param {(value: any) => any} resolve
 * @returns {Array<{ mode: string, sprite: any }>}
 */
export function tileVisualCalls(tile, slots, resolve) {
  const calls = [];
  for (const slot of slots) {
    const sprite = resolve(tile[slot.entity]);
    if (sprite) calls.push({ mode: slot.mode, sprite });
  }
  for (const layer of tile.visualLayers || []) {
    const sprite = resolve(layer.assetId ?? layer.sprite);
    if (sprite) calls.push({ mode: layer.mode || 'scenery', sprite });
  }
  return calls;
}
