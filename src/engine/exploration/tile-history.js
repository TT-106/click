import { WORLD_CHUNK_SIZE } from './natural-terrain.js';

const BYTE_COUNT = WORLD_CHUNK_SIZE * WORLD_CHUNK_SIZE / 8;
const coordinate = value => Number.isInteger(value) && Math.abs(value) <= 1000000;
const address = key => {
  if (typeof key !== 'string' || !/^-?\d+,-?\d+$/.test(key)) throw new Error('世界格坐标无效');
  const [x, y] = key.split(',').map(Number);
  if (!coordinate(x) || !coordinate(y)) throw new Error('世界格坐标超出支持范围');
  const chunkX = Math.floor(x / WORLD_CHUNK_SIZE), chunkY = Math.floor(y / WORLD_CHUNK_SIZE);
  return { chunkX, chunkY, index: (y - chunkY * WORLD_CHUNK_SIZE) * WORLD_CHUNK_SIZE + x - chunkX * WORLD_CHUNK_SIZE };
};

/** Set 的必要接口，按区块位图保存；历史增长不会要求保留旧区块的图片或世界对象。 */
export class TileHistory {
  constructor() { this.chunks = new Map(); this.size = 0; }
  has(key) {
    const { chunkX, chunkY, index } = address(key), bytes = this.chunks.get(`${chunkX},${chunkY}`);
    return !!bytes && !!(bytes[index >> 3] & (1 << (index & 7)));
  }
  add(key) {
    const { chunkX, chunkY, index } = address(key), chunkKey = `${chunkX},${chunkY}`;
    let bytes = this.chunks.get(chunkKey);
    if (!bytes) { bytes = new Uint8Array(BYTE_COUNT); this.chunks.set(chunkKey, bytes); }
    const mask = 1 << (index & 7);
    if (!(bytes[index >> 3] & mask)) { bytes[index >> 3] |= mask; this.size++; }
    return this;
  }
  serialize() {
    return [...this.chunks].sort(([left], [right]) => left.localeCompare(right)).map(([key, bytes]) => {
      const [chunkX, chunkY] = key.split(',').map(Number);
      return { chunkX, chunkY, bits: btoa(String.fromCharCode(...bytes)) };
    });
  }
  *[Symbol.iterator]() {
    for (const [key, bytes] of this.chunks) {
      const [chunkX, chunkY] = key.split(',').map(Number);
      for (let index = 0; index < WORLD_CHUNK_SIZE ** 2; index++) if (bytes[index >> 3] & (1 << (index & 7))) {
        yield `${chunkX * WORLD_CHUNK_SIZE + index % WORLD_CHUNK_SIZE},${chunkY * WORLD_CHUNK_SIZE + Math.floor(index / WORLD_CHUNK_SIZE)}`;
      }
    }
  }
  static restore(records) {
    if (!Array.isArray(records) || records.length > 8192) throw new Error('世界探索历史无效');
    const result = new TileHistory();
    for (const record of records) {
      if (!record || !coordinate(record.chunkX * WORLD_CHUNK_SIZE) || !coordinate(record.chunkY * WORLD_CHUNK_SIZE)
        || !Number.isInteger(record.chunkX) || !Number.isInteger(record.chunkY) || typeof record.bits !== 'string' || record.bits.length !== 172) throw new Error('世界历史区块无效');
      const text = atob(record.bits), key = `${record.chunkX},${record.chunkY}`;
      if (text.length !== BYTE_COUNT || result.chunks.has(key)) throw new Error('世界历史位图或重复区块无效');
      const bytes = Uint8Array.from(text, character => character.charCodeAt(0));
      if (btoa(String.fromCharCode(...bytes)) !== record.bits) throw new Error('世界历史编码无效');
      result.chunks.set(key, bytes);
      for (const byte of bytes) for (let bit = 0; bit < 8; bit++) if (byte & (1 << bit)) result.size++;
    }
    return result;
  }
}
