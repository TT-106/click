/** 地表语义到美术资源的主题配置；新增地面变体只改数据，不改 Renderer。 */
export const FOREST_VILLAGE_GROUND = {
  grass: ['village.grass', 'village.grass.alt-1', 'village.grass.alt-2', 'village.grass.alt-3'],
  path: ['village.path'], bank: ['village.path'], floor: ['village.floor'], bridge: ['village.bridge'], water: ['village.water'],
  meadow: ['village.grass.alt-1'], wetland: ['village.grass.alt-2'], highland: ['village.path'],
};

/** 顺序为岸土、道路、水面；纹理选择和调色属于主题，不改变碰撞和导航。 */
export const FOREST_VILLAGE_BLENDS = [
  { kind: 'meadow', members: ['meadow'], color: '#84925c', textureAlpha: .45 },
  { kind: 'wetland', members: ['wetland'], color: '#607c51', textureAlpha: .4 },
  { kind: 'highland', members: ['highland'], color: '#99977e', textureAlpha: .5, detail: { kind: 'grass', alpha: .25 } },
  { kind: 'bank', members: ['bank', 'water', 'bridge'], color: '#65734c', textureAlpha: .2, detail: { kind: 'grass', alpha: .35 } },
  { kind: 'path', members: ['path'], color: '#877554', textureAlpha: .6, detail: { kind: 'grass', alpha: .18 } },
  { kind: 'water', members: ['water', 'bridge'], color: '#406b72', gradient: ['#35595f', '#47808a'], textureAlpha: 0,
    ripples: { color: '#bdd8d2', alpha: .2, length: .28 } },
];
export const FOREST_VILLAGE_SURFACES = ['floor', 'bridge'];
