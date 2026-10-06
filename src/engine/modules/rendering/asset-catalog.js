/** 语义资源注册表。旧图集留在加载门面后；尺寸、锚点、动画数据不进入游戏规则和存档。 */
export const ASSET_GROUPS = Object.freeze(['actors', 'terrain', 'items']);
export const ANIMATION_STATES = Object.freeze(['idle', 'walk', 'attack', 'hurt', 'death', 'cast', 'interact']);
const DIRECTIONS = new Set(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
const defaults = { actors: { x: 27, y: 40 }, terrain: { x: 27, y: 40 }, items: { x: 0, y: 0 } };

function fail(message) { throw new Error(`素材配置错误: ${message}`); }
function positive(value, label) { if (!Number.isFinite(value) || value <= 0) fail(`${label} 必须是正数`); }
function point(value, label) {
  if (value && (!Number.isFinite(value.x) || !Number.isFinite(value.y))) fail(`${label} 必须包含有限的 x、y`);
}
function validateFrame(value, label) {
  if (!value || !value.source || typeof value.source.image !== 'string' || !value.source.image.trim()) fail(`${label}.source.image 缺失`);
  const rect = value.source.rect;
  if (rect) {
    if (!Number.isFinite(rect.x) || !Number.isFinite(rect.y) || rect.x < 0 || rect.y < 0) fail(`${label}.source.rect 起点必须非负`);
    positive(rect.width, `${label}.source.rect.width`); positive(rect.height, `${label}.source.rect.height`);
  }
  if (value.size) { positive(value.size.width, `${label}.size.width`); positive(value.size.height, `${label}.size.height`); }
  for (const key of ['anchor', 'origin', 'offset', 'depthOffset']) point(value[key], `${label}.${key}`);
  if (value.footprint) { positive(value.footprint.columns, `${label}.footprint.columns`); positive(value.footprint.rows, `${label}.footprint.rows`); }
  if (value.layer !== undefined && !['ground', 'scenery', 'actor', 'effect', 'overlay'].includes(value.layer)) fail(`${label}.layer 是未知绘制层`);
}

/** 导入器和运行时共用校验；不创建 Image。 */
export function validateAssetDefinition(definition) {
  if (!definition || typeof definition.id !== 'string' || !definition.id.trim()) fail('id 缺失');
  const label = definition.id;
  if (definition.bundle !== undefined && (typeof definition.bundle !== 'string' || !/^[a-z][a-z0-9-]*$/.test(definition.bundle))) fail(`${label}.bundle 必须是小写资源包名称`);
  if (!ASSET_GROUPS.includes(definition.group)) fail(`${label}.group 必须是 actors/terrain/items`);
  if (definition.replace !== undefined && (typeof definition.replace !== 'string' || !definition.replace)) fail(`${label}.replace 必须是单个旧资源名称`);
  if (definition.saveName !== undefined && (typeof definition.saveName !== 'string' || !definition.saveName)) fail(`${label}.saveName 必须是非空字符串`);
  if (definition.aliases !== undefined && (!Array.isArray(definition.aliases) || definition.aliases.some(alias => typeof alias !== 'string' || !alias))) fail(`${label}.aliases 必须是非空名称数组`);
  if (definition.source) validateFrame(definition, label);
  const frames = definition.frames || {};
  if (!definition.source && !Object.keys(frames).length) fail(`${label} 必须包含 source 或 frames`);
  for (const [name, frame] of Object.entries(frames)) validateFrame(frame, `${label}.frames.${name}`);
  for (const key of ['anchor', 'origin', 'offset', 'depthOffset']) point(definition[key], `${label}.${key}`);
  if (definition.size) { positive(definition.size.width, `${label}.size.width`); positive(definition.size.height, `${label}.size.height`); }
  if (definition.footprint) { positive(definition.footprint.columns, `${label}.footprint.columns`); positive(definition.footprint.rows, `${label}.footprint.rows`); }
  if (definition.layer !== undefined && !['ground', 'scenery', 'actor', 'effect', 'overlay'].includes(definition.layer)) fail(`${label}.layer 是未知绘制层`);
  const checkSequence = (sequence, sequenceLabel) => {
    if (!Array.isArray(sequence) || !sequence.length) fail(`${sequenceLabel} 必须是非空帧列表`);
    for (const entry of sequence) {
      if (typeof entry === 'string') { if (!Object.hasOwn(frames, entry)) fail(`${sequenceLabel} 找不到帧 ${entry}`); }
      else validateFrame(entry, sequenceLabel);
    }
  };
  for (const [state, clip] of Object.entries(definition.clips || {})) {
    if (!ANIMATION_STATES.includes(state)) fail(`${label}.clips.${state} 是未知动画状态`);
    positive(clip.fps ?? 8, `${label}.clips.${state}.fps`);
    if (clip.loop !== undefined && typeof clip.loop !== 'boolean') fail(`${label}.clips.${state}.loop 必须是布尔值`);
    if (clip.frames) checkSequence(clip.frames, `${label}.clips.${state}.frames`);
    if (!clip.frames && !Object.keys(clip.directions || {}).length) fail(`${label}.clips.${state} 没有帧`);
    for (const [direction, sequence] of Object.entries(clip.directions || {})) {
      if (!DIRECTIONS.has(direction)) fail(`${label}.clips.${state} 未知方向 ${direction}`);
      checkSequence(sequence, `${label}.clips.${state}.${direction}`);
    }
  }
  return definition;
}

export class AssetCatalog {
  /** @param {{legacyGroups?: Record<string, any>, definitions?: any[], bundle?: string, imageFactory?: () => HTMLImageElement}} options */
  constructor({ legacyGroups = {}, definitions = [], bundle = 'default', imageFactory = () => new Image() } = {}) {
    this.legacyGroups = legacyGroups;
    this.imageFactory = imageFactory;
    this.images = new Map();
    this.sprites = new Map();
    this.reservations = new Map();
    this.aliases = new Map(ASSET_GROUPS.map(group => [group, new Map()]));
    this.reservedAliases = new Map(ASSET_GROUPS.map(group => [group, new Map()]));
    this.errors = [];
    this.definitionErrors = new Map();
    this.pending = new Set();
    this.facades = new Map();
    this.visualExtent = { left: 0, right: 54, top: 0, bottom: 54 };
    this.groupVisualExtents = new Map(ASSET_GROUPS.map(group => [group, { left: 0, right: group === 'items' ? 32 : 54, top: 0, bottom: group === 'items' ? 32 : 54 }]));
    this.legacyReadiness = new Map(Object.entries(legacyGroups).map(([name, legacy]) => [name, this.waitForLegacy(legacy)]));
    // 不同主题使用独立目录实例，避免未进入的场景加载图片或扩大经典地图裁剪窗。
    for (const definition of definitions) if ((definition.bundle || 'default') === bundle) this.register(definition).catch(() => {});
  }

  group(name) {
    if (!ASSET_GROUPS.includes(name)) fail(`未知资源组 ${name}`);
    if (!this.facades.has(name)) {
      const catalog = this;
      const legacy = this.legacyGroups[name];
      this.facades.set(name, {
        getSprite(key) { return catalog.aliases.get(name).get(key) || legacy?.getSprite(key); },
        getSheetImage() { return legacy?.getSheetImage(); },
        isLoaded() { return catalog.isLoaded(); },
        getErrors() { return catalog.getErrors(); },
        getVisualExtent() { return catalog.getVisualExtent(name); }
      });
    }
    return this.facades.get(name);
  }

  resolve(sprite, group) {
    if (typeof sprite === 'string') return this.group(group || 'actors').getSprite(sprite);
    if (!sprite || sprite.visualResolved || (sprite.frame && !sprite.id && !sprite.name && !sprite.getName)) return sprite;
    const ownerGroup = group || sprite.group || Object.entries(this.legacyGroups).find(([, legacy]) => legacy === sprite.spriteSheet)?.[0] || 'actors';
    const key = sprite.getName ? sprite.getName() : sprite.name || sprite.id;
    const direct = this.sprites.get(sprite.id);
    return this.aliases.get(ownerGroup)?.get(key) || (direct?.group === ownerGroup ? direct : sprite);
  }

  loadImage(url) {
    if (this.images.get(url)?.state === 'error') this.images.delete(url);
    if (!this.images.has(url)) {
      const image = this.imageFactory();
      const record = { image, state: 'loading', error: null, promise: null };
      record.promise = new Promise(resolve => {
        image.onload = () => { record.state = 'ready'; resolve(record); };
        image.onerror = () => {
          record.state = 'error'; record.error = `图片加载失败: ${url}`;
          resolve(record);
        };
      });
      this.images.set(url, record);
      image.src = url;
    }
    return this.images.get(url);
  }

  waitForLegacy(legacy) {
    if (legacy.isLoaded() || legacy.error || !legacy.image?.addEventListener) return Promise.resolve();
    return new Promise(resolve => {
      legacy.image.addEventListener('load', () => resolve(), { once: true });
      legacy.image.addEventListener('error', () => resolve(), { once: true });
    });
  }

  /** 成功加载整组帧后才发布替换；失败保留已有精灵，Promise 报告具体错误。 */
  register(definition) {
    validateAssetDefinition(definition);
    if (this.reservations.has(definition.id)) fail(`重复 id ${definition.id}`);
    const names = [...new Set([definition.id, ...(definition.aliases || []), definition.saveName, definition.replace].filter(Boolean))];
    const reserved = this.reservedAliases.get(definition.group);
    for (const name of names) {
      if (reserved.has(name)) fail(`重复 alias ${definition.group}/${name}`);
      const legacy = this.legacyGroups[definition.group];
      const collides = legacy?.getSprite(name);
      if (collides && typeof collides !== 'function' && definition.replace !== name) fail(`${name} 已存在；请显式使用 replace`);
    }
    this.reservations.set(definition.id, definition);
    const previousError = this.definitionErrors.get(definition.id);
    if (previousError) { this.errors = this.errors.filter(error => error !== previousError); this.definitionErrors.delete(definition.id); }
    for (const name of names) reserved.set(name, definition.id);
    const records = new Set();
    const allFrames = [];
    const normalize = (value, frameName) => {
      const record = this.loadImage(value.source.image);
      records.add(record);
      const rect = value.source.rect;
      const source = rect ? { ...rect } : { x: 0, y: 0, width: 0, height: 0 };
      const size = { ...(value.size || definition.size || { width: source.width, height: source.height }) };
      const explicitAnchor = value.anchor || definition.anchor;
      const layer = value.layer || definition.layer;
      const frame = {
        image: record.image, source, size,
        anchor: { ...(explicitAnchor || { x: size.width / 2, y: layer === 'ground' ? size.height / 2 : size.height }) },
        offset: { ...(value.offset || definition.offset || { x: 0, y: 0 }) },
        origin: { ...(value.origin || definition.origin || defaults[definition.group]) },
        depthOffset: { ...(value.depthOffset || definition.depthOffset || { x: 0, y: 0 }) },
        footprint: { ...(value.footprint || definition.footprint || { columns: 1, rows: 1 }) },
        layer,
        cacheKey: `${definition.id}:${frameName}`
      };
      allFrames.push({ frame, record, fullImage: !rect, naturalSize: !value.size && !definition.size, defaultAnchor: !explicitAnchor });
      return frame;
    };
    const frames = Object.fromEntries(Object.entries(definition.frames || {}).map(([name, value]) => [name, normalize(value, name)]));
    const clips = Object.fromEntries(Object.entries(definition.clips || {}).map(([state, clip]) => {
      let index = 0;
      const sequence = values => values.map(value => typeof value === 'string' ? frames[value] : normalize(value, `${state}:${index++}`));
      const directions = Object.fromEntries(Object.entries(clip.directions || {}).map(([direction, values]) => [direction, sequence(values)]));
      return [state, { frames: clip.frames ? sequence(clip.frames) : Object.values(directions)[0], directions, fps: clip.fps ?? 8, loop: clip.loop ?? !['attack', 'hurt', 'death', 'cast', 'interact'].includes(state) }];
    }));
    const frame = definition.source ? normalize(definition, 'default') : clips.idle?.frames[0] || Object.values(clips)[0]?.frames[0] || Object.values(frames)[0];
    const savedName = definition.replace || definition.saveName || definition.id;
    const sprite = {
      id: definition.id, name: savedName, group: definition.group, frame, frames, clips,
      sourceX: frame.source.x, sourceY: frame.source.y,
      spriteSheet: { spriteSize: frame.size.width, getSheetImage: () => frame.image },
      getName() { return savedName; }, getSheetImage() { return frame.image; }
    };
    const operation = Promise.all([...records].map(record => record.promise).concat(this.legacyReadiness.get(definition.group) || Promise.resolve())).then(() => {
      const loadError = [...records].find(record => record.error);
      if (loadError) throw new Error(loadError.error);
      const legacy = this.legacyGroups[definition.group];
      if (definition.replace && !legacy?.getSprite(definition.replace)) throw new Error(`${definition.id}: replace 找不到旧资源 ${definition.replace}`);
      for (const name of names) {
        const collision = legacy?.getSprite(name);
        if (collision && typeof collision !== 'function' && definition.replace !== name) throw new Error(`${definition.id}: ${name} 已存在；请显式使用 replace`);
      }
      for (const entry of allFrames) {
        const width = entry.record.image.naturalWidth || entry.record.image.width;
        const height = entry.record.image.naturalHeight || entry.record.image.height;
        if (!(width > 0 && height > 0)) throw new Error(`${definition.id}: 图片尺寸无效`);
        if (entry.fullImage) { entry.frame.source.width = width; entry.frame.source.height = height; }
        if (entry.frame.source.x + entry.frame.source.width > width || entry.frame.source.y + entry.frame.source.height > height) throw new Error(`${definition.id}: 裁切区域超出图片尺寸`);
        if (entry.naturalSize) { entry.frame.size.width = entry.frame.source.width; entry.frame.size.height = entry.frame.source.height; }
        if (entry.defaultAnchor) { entry.frame.anchor.x = entry.frame.size.width / 2; entry.frame.anchor.y = entry.frame.layer === 'ground' ? entry.frame.size.height / 2 : entry.frame.size.height; }
      }
      sprite.spriteSheet.spriteSize = frame.size.width;
      this.sprites.set(definition.id, sprite);
      for (const name of names) this.aliases.get(definition.group).set(name, sprite);
      for (const { frame: item } of allFrames) {
        const left = item.origin.x + item.offset.x - item.anchor.x;
        const top = item.origin.y + item.offset.y - item.anchor.y;
        for (const extent of [this.visualExtent, this.groupVisualExtents.get(definition.group)]) {
          extent.left = Math.min(extent.left, left); extent.right = Math.max(extent.right, left + item.size.width);
          extent.top = Math.min(extent.top, top); extent.bottom = Math.max(extent.bottom, top + item.size.height);
        }
      }
      return sprite;
    }).catch(error => {
      const message = `${definition.id}: ${error.message}`;
      this.definitionErrors.set(definition.id, message);
      if (!this.errors.includes(message)) this.errors.push(message);
      this.reservations.delete(definition.id);
      for (const name of names) if (reserved.get(name) === definition.id) reserved.delete(name);
      throw error;
    }).finally(() => { this.pending.delete(operation); });
    this.pending.add(operation);
    return operation;
  }

  getErrors() {
    return [...this.errors, ...Object.entries(this.legacyGroups).flatMap(([group, legacy]) => legacy.error ? [`${group}: ${legacy.error}`] : [])];
  }
  isLoaded() { return this.pending.size === 0 && this.getErrors().length === 0 && Object.values(this.legacyGroups).every(legacy => legacy.isLoaded()); }
  getStatus() { return { loaded: this.isLoaded(), pending: this.pending.size, registered: this.sprites.size, images: this.images.size, errors: this.getErrors() }; }
  getVisualExtent(group) {
    if (group && !ASSET_GROUPS.includes(group)) fail(`未知资源组 ${group}`);
    return { ...(group ? this.groupVisualExtents.get(group) : this.visualExtent) };
  }
}

export function createAssetCatalog(options) { return new AssetCatalog(options); }
