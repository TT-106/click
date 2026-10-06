/** 宏观布局数据。位置是世界格坐标，图像尺寸、路径和 atlas 均不进入这一层。 */
export const VILLAGE_LAYOUTS = Object.freeze([
  { id: 'riverside', label: '河畔聚落', riverX: 24, bend: 2, plaza: { x: 13, y: 23 },
    houses: [{ preset: 'workshop', x: 7, y: 9 }, { preset: 'herbalist', x: 15, y: 14 }, { preset: 'storehouse', x: 3, y: 19 }] },
  { id: 'two-banks', label: '双岸村落', riverX: 23, bend: 1, plaza: { x: 13, y: 18 },
    houses: [{ preset: 'workshop', x: 5, y: 10 }, { preset: 'herbalist', x: 30, y: 13 }, { preset: 'storehouse', x: 10, y: 23 }] },
  { id: 'woodland', label: '林间散村', riverX: 28, bend: 1, plaza: { x: 17, y: 13 },
    houses: [{ preset: 'workshop', x: 5, y: 6 }, { preset: 'herbalist', x: 16, y: 21 }, { preset: 'storehouse', x: 5, y: 18 }] },
]);

/** 布局随机流与植被流分离。两格桥面处河宽和朝向保持稳定。 */
export function planVillageLayout(random, width, height) {
  const template = VILLAGE_LAYOUTS[Math.floor(random() * VILLAGE_LAYOUTS.length)];
  const jitter = () => Math.floor(random() * 3) - 1;
  const phase = random() * Math.PI * 2, bridges = [8 + Math.floor(random() * 2), 24 + Math.floor(random() * 2)];
  const river = Array.from({ length: height }, (_, y) => Math.round(template.riverX + Math.sin(y * .22 + phase) * template.bend));
  for (const y of bridges) river[y + 1] = river[y];
  return {
    id: template.id, label: template.label, river, bridges,
    plaza: { x: template.plaza.x + jitter(), y: template.plaza.y },
    houses: template.houses.map(house => ({ ...house, x: house.x + jitter(), y: house.y + jitter() })),
    entrance: { x: 4, y: height - 5 }, exit: { x: width - 6, y: 4 }, garden: { x: width - 5, y: 21 },
  };
}
