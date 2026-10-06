import { game } from './modules/runtime/index.js';
import { configurePersistence } from './modules/runtime/storage-port.js';
import { configureFaults } from './modules/runtime/fault-port.js';
import { adventurerClasses } from './modules/content/classes.js';
import { partyCapacityBonus } from './modules/content/balance.js';
import { statValue } from './modules/characters/stats.js';
import { serializeGame, createSaveState } from './modules/persistence/game-save.js';
import { compress, decompress } from './save-codec.js';

// 恢复引擎内部接口；产品仅通过 adapter.js 的快照与命令访问。
export const runtime = {
  game,
  classes: adventurerClasses,
  partyBonus: partyCapacityBonus,
  statValue,
  serialize: () => serializeGame(game.saves),
  snapshot: () => createSaveState(game.saves),
  decode: decompress,
  encode: compress,
  importSave: value => game.importSave(value),
  setPersistence: configurePersistence,
  setFaults: configureFaults,
};
