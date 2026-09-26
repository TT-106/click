// 存档 DTO 变异工具：场景差分通过修改共享存档格式驱动两个引擎，
// 避免依赖原版混淆 API。字段形状依据 tests/fixtures/original.c2save 实测。
import fs from 'node:fs';
import codec from '../../src/engine/save-codec.js';

export const HARNESS_FIXED_NOW = 1750000000000;

export function decodeFixture(path = 'tests/fixtures/original.c2save') {
  return JSON.parse(codec.decompress(fs.readFileSync(path, 'utf8').trim()));
}

export function encodeSave(save) {
  return codec.compress(JSON.stringify(save));
}

export function clone(save) {
  return JSON.parse(JSON.stringify(save));
}

/** 药水：追加（或替换）指定药水条目。默认未激活；设 active=true 时从当前回合开始计时。 */
export function withPotions(save, potionIds, { active = false } = {}) {
  const out = clone(save);
  for (const potionId of potionIds) {
    const existing = out.potionInventory.find(p => p.potionId === potionId);
    if (existing) {
      existing.active = active;
      existing.activeStartTurn = active ? out.turnNumber : 0;
    } else {
      out.potionInventory.push({ potionId, active, activeStartTurn: active ? out.turnNumber : 0 });
    }
  }
  return out;
}

/** 卷轴：设置若干卷轴的数量并解锁。 */
export function withScrolls(save, entries) {
  const out = clone(save);
  for (const { scrollId, count } of entries) {
    const slot = out.scrollInventory.find(s => s.scrollId === scrollId);
    if (slot) { slot.count = count; slot.locked = false; }
    else out.scrollInventory.push({ scrollId, count, locked: false, upgradeCount: 0 });
  }
  return out;
}

export function withGold(save, gold) {
  const out = clone(save);
  out.party.gold = gold;
  return out;
}

export function withTurns(save, turnNumber) {
  const out = clone(save);
  out.turnNumber = turnNumber;
  return out;
}

/** 把存档时间戳拨到"现在"之前 msAgo 毫秒（HARNESS_FIXED_NOW 为 harness 固定时钟）。 */
export function withElapsed(save, msAgo) {
  const out = clone(save);
  out.gameTimestamp = HARNESS_FIXED_NOW - msAgo;
  return out;
}

export function withOfflineProcessing(save, enabled) {
  const out = clone(save);
  out.gameOptions.offlineProcessingEnabled = enabled;
  return out;
}

/** 胜利次数（veteran 运：解锁按胜利数门槛的职业内容）。 */
export function withVictories(save, count) {
  const out = clone(save);
  out.victoryCount = count;
  return out;
}

/** 给存档中指定职业的角色装载一项已学法术；用于差分驱动具体法术分支。 */
export function withClassSpell(save, characterClass, spellName) {
  const out = clone(save);
  const character = out.adventurers.find(a => a.characterClass === characterClass);
  if (!character) throw new Error(`fixture 缺少职业 ${characterClass}`);
  character.spells = [{ spellName }];
  return out;
}

/** 收集快照中与玩法相关的可观察量，用于"断言场景确实产生了变化"。 */
export function summarize(snapshot) {
  return {
    turn: snapshot.turnNumber,
    gold: snapshot.party.gold,
    kills: snapshot.party.kills,
    experience: snapshot.party.experiencePoints,
    potions: snapshot.potionInventory.map(p => [p.potionId, p.active, p.activeStartTurn]),
    scrolls: snapshot.scrollInventory.map(s => [s.scrollId, s.count]),
    timestamp: snapshot.gameTimestamp,
  };
}
