/** 建筑预设描述世界占地、入口和显示部件，不含任何 PNG 路径或像素裁切。 */
export const BUILDING_PRESETS = Object.freeze({
  workshop: { width: 5, height: 5, door: { x: 4, y: 2 }, approach: { x: 1, y: 0 }, exterior: 'village.cabin.workshop' },
  herbalist: { width: 5, height: 5, door: { x: 1, y: 4 }, approach: { x: 0, y: 1 }, exterior: 'village.cabin.herbalist' },
  storehouse: { width: 5, height: 5, door: { x: 4, y: 3 }, approach: { x: 1, y: 0 }, exterior: 'village.cabin.storehouse' },
});

/** 环境选型和权重是内容数据；同一优先级的规则按权重选取。 */
export const NATURAL_BUILDING_RULES = Object.freeze([
  { preset: 'herbalist', label: '林缘药师屋', minimumMoisture: .55, priority: 2, weight: 1 },
  { preset: 'workshop', label: '溪边工坊', nearWater: true, priority: 1, weight: 1 },
  { preset: 'workshop', label: '林间工坊', priority: 0, weight: 1 },
  { preset: 'storehouse', label: '原野仓房', priority: 0, weight: 3 },
]);
