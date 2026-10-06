import { coordinateRandom } from './natural-terrain.js';
import { cellKey } from './navigation.js';

export const RESOURCE_VERSION = 1;
const BIOME_RESOURCES = {
  forest: ['wood', 'wood', 'wood', 'feather', 'iron'],
  meadow: ['feather', 'feather', 'wood', 'copper'],
  highland: ['iron', 'iron', 'copper', 'silver'],
  wetland: ['wood', 'feather', 'crystal'],
};

/** 资源是独立的世界覆盖层，不改变 v1 的地形、道路、碰撞或经典随机流。 */
export function resourceAt(generator, cell) {
  if (!cell?.walkable || cell.water || cell.kind === 'bridge') return null;
  const random = salt => coordinateRandom(generator.terrain.code, cell.x, cell.y, salt);
  const indoors = cell.area.startsWith('structure:');
  if (random(301) > (indoors ? .16 : .085)) return null;
  const choices = indoors ? ['leather', 'wood', 'silver'] : BIOME_RESOURCES[cell.biome] || BIOME_RESOURCES.forest;
  const itemId = choices[Math.floor(random(302) * choices.length)];
  return { id: `resource:${cellKey(cell.x, cell.y)}`, x: cell.x, y: cell.y, itemId, amount: 1 + Math.floor(random(303) * (itemId === 'wood' ? 3 : 2)) };
}
