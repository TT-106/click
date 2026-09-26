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

/** 城堡征服终局：只保留一座待攻克城堡，其余标记已征服，地牢全部已清空。
 *  用于驱动征服尾部（regionLocked 解锁、recordCastleConquered）与胜利瞬间
 *  （victoryCount++ / gameWon）——两端都必须真的走到 iw() 的离开城堡分支。 */
export function withCastleVictory(save) {
  const out = clone(save);
  for (const dungeon of out.dungeonManagerState.dungeonStates) {
    dungeon.discovered = true;
    dungeon.conquered = true;
    dungeon.cleared = true;
  }
  const unlocked = out.castleManager.castleStates.filter(c => !c.castleRegionLocked);
  if (unlocked.length !== 1) throw new Error(`fixture 应恰好有一座未锁城堡，实际 ${unlocked.length}`);
  const finalCastleId = unlocked[0].castleId;
  for (const castle of out.castleManager.castleStates) {
    castle.conquered = castle.castleId !== finalCastleId;
    castle.dungeonsConquered = true;
    castle.attackScheduled = castle.castleId === finalCastleId;
  }
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

/** 把指定下标的队员改成目标职业并装载法术；用于 fixture 队伍里没有的职业分支（召唤、睡眠等）。
 *  两端载入同一份改动存档，职业定义由各自的存档载入路径按 characterClass 重建。 */
export function withReclassedSpell(save, index, characterClass, spellName) {
  const out = clone(save);
  const character = out.adventurers[index];
  if (!character) throw new Error(`fixture 缺少队员下标 ${index}`);
  character.characterClass = characterClass;
  character.spells = [{ spellName }];
  return out;
}

/** 给指定队员追加一件已装备物品（存档里的 equippedItemCollection 条目）。
 *  改职业后原职业的装备会因 characterClass 不符被 equipItem 跳过，远程武器槽因此为空；
 *  盗贼槽 61（isProjectileItem）与忍者槽 62（飞镖，projectileAnimationId=3）用于驱动远程法术分支。 */
export function withEquippedItem(save, index, itemTypeId, itemSlot, characterClass) {
  const out = clone(save);
  const character = out.adventurers[index];
  if (!character) throw new Error(`fixture 缺少队员下标 ${index}`);
  character.equippedItemCollection = [...(character.equippedItemCollection ?? []), {
    itemTypeId,
    itemSlot,
    characterClass,
    itemName: "差分探针武器",
    itemRarity: 0,
    itemLevel: 1,
    itemGold: 1,
    itemValue: 1,
    itemCharacteristic: 1,
    itemEffect: null,
  }];
  return out;
}

/** 构造"牧师独占施法、队友会被击倒"的复活试验存档：
 *  1) 指定队员改为牧师 6 且只学 复活；2) 激活随机首领药水提供致命敌人；
 *  3) 指定 victim 下标压到 1 级 1 血并清零其伤害/生命分量，使其真的被击倒；
 *  4) 清空其余队员法术，让 spellCastCount 的增长只能归因到牧师。
 *  两端载入同一份存档，昏迷只在引擎的 resolveCharacterDefeat 里产生。 */
export function withResurrectionTrial(save, { casterIndex, victimIndexes }) {
  const out = clone(save);
  const caster = out.adventurers[casterIndex];
  if (!caster) throw new Error(`fixture 缺少队员下标 ${casterIndex}`);
  caster.characterClass = 6;
  caster.spells = [{ spellName: '复活' }];
  out.adventurers.forEach((character, index) => {
    if (index !== casterIndex) character.spells = [];
  });
  for (const index of victimIndexes) {
    const stats = out.adventurers[index].characteristicsComponent;
    stats.characterLevel = 1;
    stats.characterHealth = 1;
    stats.maxHealthComponent = { itemValue: 0, levelValue: 0, spellBonusPercent: 0, skillBonusPercent: 0 };
    stats.damageComponent = { itemValue: 0, levelValue: 0, spellBonusPercent: 0, skillBonusPercent: 0 };
  }
  return withPotions(out, ['randomBossEncounter'], { active: true });
}

/** 收集快照中与玩法相关的可观察量，用于"断言场景确实产生了变化"。 */
/** 给全部冒险者发放技能点：让"技能升级"这条只有视图层能进入的购买路径变成可购。 */
export function withSkillPoints(save, points) {
  const out = clone(save);
  for (const adventurer of out.adventurers) {
    adventurer.skillPoints = points;
  }
  return out;
}

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
