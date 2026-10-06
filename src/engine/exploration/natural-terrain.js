/** 全局坐标采样，不依赖访问顺序、分块边界或经典 RNG。 */
export const WORLD_CHUNK_SIZE = 32;
export const WORLD_GENERATOR_VERSION = 1;

export function seedCode(seed) {
  let result = 2166136261;
  for (const character of seed) result = Math.imul(result ^ character.charCodeAt(0), 16777619) >>> 0;
  return result;
}

export function coordinateRandom(code, x, y, salt = 0) {
  let value = code ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 1274126177);
  value = Math.imul(value ^ (value >>> 13), 1274126177); value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

export function createNaturalTerrain(seed) {
  const code = seedCode(seed), cache = new Map();
  const noise = (x, y, scale, salt) => {
    const column = Math.floor(x / scale), row = Math.floor(y / scale);
    const smooth = value => value * value * (3 - 2 * value);
    const fractionX = smooth(x / scale - column), fractionY = smooth(y / scale - row);
    const top = coordinateRandom(code, column, row, salt) * (1 - fractionX) + coordinateRandom(code, column + 1, row, salt) * fractionX;
    const bottom = coordinateRandom(code, column, row + 1, salt) * (1 - fractionX) + coordinateRandom(code, column + 1, row + 1, salt) * fractionX;
    return top * (1 - fractionY) + bottom * fractionY;
  };
  const fractal = (x, y, salt) => noise(x, y, 64, salt) * .58 + noise(x, y, 32, salt + 1) * .28 + noise(x, y, 16, salt + 2) * .14;
  const field = (x, y) => {
    const key = `${x},${y}`;
    if (cache.has(key)) return cache.get(key);
    const height = fractal(x, y, 11), moisture = fractal(x, y, 31);
    const warpX = (noise(x, y, 80, 61) - .5) * 28, warpY = (noise(x, y, 80, 62) - .5) * 28;
    const channel = Math.abs(noise(x + warpX, y + warpY, 40, 71) - .5);
    const water = height < .29 || (channel < .026 && height < .66);
    const biome = height > .65 ? 'highland' : moisture > .56 ? 'forest' : height < .4 ? 'wetland' : 'meadow';
    const result = { height, moisture, water, biome };
    cache.set(key, result);
    if (cache.size > 32768) cache.delete(cache.keys().next().value);
    return result;
  };
  return {
    code, field,
    sample(x, y) {
      const terrain = field(x, y), shore = !terrain.water && [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([column, row]) => field(column, row).water);
      const kind = terrain.water ? 'water' : shore ? 'bank' : terrain.biome === 'forest' ? 'grass' : terrain.biome;
      const tree = !terrain.water && !shore && coordinateRandom(code, x, y, 81) < (terrain.biome === 'forest' ? .21 : terrain.biome === 'meadow' ? .025 : .065);
      return { x, y, ...terrain, kind, tree, walkable: !terrain.water && !tree, area: 'outside', elevation: 0,
        variant: Math.floor(coordinateRandom(code, x, y, 91) * 4) };
    }
  };
}
