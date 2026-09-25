import { decompress } from '../engine/save-codec.js';

export const SAVE_KEY = 'C2_V1_001';
export const MAX_SAVE_BYTES = 2 * 1024 * 1024;
const fail = message => { throw new Error(message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const array = value => Array.isArray(value) && value.length <= 20000;

export function validateSave(state) {
  if (!object(state) || state.saveKey !== SAVE_KEY || state.gameInitialized !== true) fail('这不是有效的 Clickpocalypse II 存档。');
  for (const name of ['world', 'gameOptions', 'dungeonManagerState', 'castleManager', 'party', 'statistics', 'totalStatistics', 'monsterTypes', 'settings', 'pointManagerState', 'achievementManager']) {
    if (!object(state[name])) fail(`存档缺少必要数据：${name}`);
  }
  for (const [name, value] of Object.entries({ adventurers: state.adventurers, scrollInventory: state.scrollInventory, potionInventory: state.potionInventory, farms: state.farms, dungeons: state.dungeonManagerState.dungeonStates, castles: state.castleManager.castleStates, monsters: state.monsterTypes.monsterLevelStates, achievements: state.achievementManager.achievements, pointUpgrades: state.pointManagerState.pointUpgrades, pointsByType: state.pointManagerState.pointsByType })) {
    if (!array(value)) fail(`存档列表无效：${name}`);
  }
  if (typeof state.partyCreated !== 'boolean' || typeof state.worldActive !== 'boolean' || state.adventurers.length > 5 || (state.partyCreated && !state.adventurers.length)) fail('队伍数据不完整。');
  for (const key of ['gold', 'kills', 'experiencePoints']) if (!Number.isFinite(state.party[key]) || state.party[key] < 0) fail('资源数据无效。');
  if (!Number.isFinite(state.gameTimestamp) || !Number.isFinite(state.turnNumber) || state.turnNumber < 0) fail('存档时间或回合数据无效。');
  if (!state.worldActive && (!object(state.level) || !array(state.level.roomVisibility) || !array(state.level.hallways))) fail('地牢楼层数据不完整。');
  for (const hero of state.adventurers) {
    if (!object(hero) || ![0,1,2,3,4,6,7,8,9,10,11].includes(hero.characterClass) || typeof hero.adventurerName !== 'string' || hero.adventurerName.length > 200) fail('角色数据无效。');
    for (const key of ['characteristicsComponent', 'positionComponent', 'upgrades1', 'upgrades2', 'upgrades3', 'upgrades4']) if (!object(hero[key])) fail(`角色数据缺少 ${key}`);
    for (const key of ['spells', 'inventory', 'equippedItemCollection']) if (!array(hero[key])) fail(`角色列表缺少 ${key}`);
    if (!Number.isFinite(hero.characteristicsComponent.characterLevel) || hero.characteristicsComponent.characterLevel < 1) fail('角色等级无效。');
  }
  // 遗留面板使用 innerHTML。拒绝活动标记和对象原型键，不让导入文本成为页面代码。
  let nodes = 0;
  function inspect(value, depth = 0) {
    if (++nodes > 500000 || depth > 40) fail('存档结构过于复杂。');
    if (typeof value === 'string' && (/[<>]/.test(value) || value.length > 10000)) fail('存档包含不支持的文本。');
    if (typeof value === 'number' && !Number.isFinite(value)) fail('存档包含无效数字。');
    if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) fail('存档包含不支持的字段。');
      inspect(item, depth + 1);
    }
  }
  inspect(state);
  return state;
}

export function decodeSave(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_SAVE_BYTES) fail('存档为空或超过 2 MB。');
  const trimmed = text.trim();
  if (!/^[A-Za-z0-9+/=\s]+$/.test(trimmed)) fail('请使用原版导出的存档代码或 .c2save 文件。');
  let decoded;
  try { decoded = decompress(trimmed); } catch { fail('存档无法解压，文件可能已损坏。'); }
  if (!decoded || decoded.length > 8 * 1024 * 1024) fail('存档数据无效或过大。');
  let parsed;
  try { parsed = JSON.parse(decoded); } catch { fail('存档内容已损坏。'); }
  return validateSave(parsed);
}
