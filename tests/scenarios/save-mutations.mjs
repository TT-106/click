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

/** 清空全部队员背包。EquipItemUpgrade（type 3）的 canPurchase 要求候选列表
 *  game.inventories.list 长度 ≤ 5，而 fixture 背包塞满时该列表长约 60 恒不满足
 *  （U133"12 次购买零装备变化"的真实根因；"恢复路径未建 item.inventory 背链"假说
 *  已被取证否定——两端恢复路径都经 addInventoryItem 建背链：game-save.js:489 ↔ c2.js:29097）。
 *  清空后由场景的真实拾取建立唯一候选。 */
export function withEmptyBackpacks(save) {
  const out = clone(save);
  for (const adventurer of out.adventurers ?? []) adventurer.inventory = [];
  return out;
}

/** 卷轴：设置若干卷轴的数量并解锁。 */
export function withScrolls(save, entries) {  const out = clone(save);
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

/** 只抬高队伍可消费的击杀数，供怪物等级解锁的真实价格与前置检查使用。 */
export function withKills(save, kills) {
  const out = clone(save);
  out.party.kills = kills;
  return out;
}

/** 调整已发生的冒险点事件；载入时会由 count × 事件奖励重新计算余额。 */
export function withPointPools(save, overrides) {
  const out = clone(save);
  for (const [typeId, { points, count }] of Object.entries(overrides)) {
    const row = out.pointManagerState.pointsByType.find(p => p.pointEventType === Number(typeId));
    if (!row) throw new Error(`冒险点事件类型不存在: ${typeId}`);
    row.points = points;
    row.count = count;
  }
  return out;
}

/** 让一座已登记的城堡及同坐标地牢满足农场购买条件，价格只改测试存档。 */
export function withFarmableDungeon(save, cost = 1000) {
  const out = clone(save);
  const castle = out.castleManager.castleStates.find(c =>
    out.dungeonManagerState.dungeonStates.some(d => d.dungeonId === c.castleId));
  if (!castle) throw new Error('fixture 中没有城堡与地牢同坐标');
  const dungeon = out.dungeonManagerState.dungeonStates.find(d => d.dungeonId === castle.castleId);
  castle.conquered = true;
  castle.dungeonsConquered = true;
  castle.castleRegionLocked = false;
  dungeon.discovered = true;
  dungeon.conquered = true;
  dungeon.cleared = true;
  dungeon.dungeonFarm = false;
  dungeon.dungeonFarmCost = cost;
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

export function withBackgroundProcessing(save, enabled) {
  const out = clone(save);
  out.gameOptions.inactiveTabProcessingEnabled = enabled;
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

/** 把 count 个未获得的击杀类成就置为"已达成未领取"（优先 achievementId 含 Kills 的条目），
 *  供多次领取场景驱动成就队列（原版 Ze 队列 4 个领取槽）。成就奖励统一走
 *  increasePointEventReward(pointEventTypeId, Vt)：领取后对应事件类型的 currentPointReward 抬升，
 *  在注入 count>0 的 pointsByType 行上表现为 points = reward × count 真实增长。 */
export function withClaimableAchievements(save, count = 8) {
  const out = clone(save);
  const am = out.achievementManager.achievements;
  const killPool = am.filter(a => !a.obtained && /Kills/i.test(a.achievementId));
  const restPool = am.filter(a => !a.obtained && !/Kills/i.test(a.achievementId));
  const pool = killPool.concat(restPool);
  if (pool.length < count) throw new Error(`fixture 可领取成就不足 ${count}（仅 ${pool.length}）`);
  for (let i = 0; i < count; i++) {
    pool[i].obtained = true;
    pool[i].applied = false;
  }
  return out;
}

/** 成就进度临界值：把两个累计统计字段精确摆在阈值两侧。
 *  farmsPurchased=4 使 farmsPurchased5（requiredCount 5）差 1 未达成；doorsOpened=100000 使
 *  doorsOpened100K（requiredCount 100000）恰好达成。选这两个字段是因为它们在几十回合的自然推进里
 *  不会增长（购买农场需要已征服城堡与金币，door 计数只会被自然推进抬高，不影响"恰好达标"）。
 *  同时把这两条成就重置为未获得，避免 fixture 已有的 obtained 状态干扰判定。 */
export function withAchievementThresholds(save, { farmsPurchased, doorsOpened }) {
  const out = clone(save);
  out.totalStatistics.farmsPurchased = farmsPurchased;
  out.totalStatistics.doorsOpened = doorsOpened;
  for (const achievement of out.achievementManager.achievements) {
    if (achievement.achievementId === 'farmsPurchased5' || achievement.achievementId === 'doorsOpened100K') {
      achievement.obtained = false;
      achievement.applied = false;
    }
  }
  return out;
}

/** 城堡进攻计划前置态：把唯一未锁城堡（100_100）变成"可进攻"——
 *  地牢清空并标记 dungeonsConquered（载入时直接恢复为 Bj，使 canAttackCastle 成立），
 *  未征服、未计划攻击、所需怪物等级清零。载入时 game-save 按 canAttackCastle 重建
 *  进攻列表 Jg，type=13 的"攻击城堡"升级（原版 ms）即可经视图同路径购买。 */
export function withAttackableCastle(save) {
  const out = clone(save);
  const unlocked = out.castleManager.castleStates.filter(c => !c.castleRegionLocked);
  if (unlocked.length !== 1) throw new Error(`fixture 应恰好有一座未锁城堡，实际 ${unlocked.length}`);
  const castle = unlocked[0];
  for (const dungeon of out.dungeonManagerState.dungeonStates) {
    if (dungeon.dungeonId === castle.castleId) {
      dungeon.discovered = true;
      dungeon.conquered = true;
      dungeon.cleared = true;
    }
  }
  castle.conquered = false;
  castle.dungeonsConquered = true;
  castle.attackScheduled = false;
  castle.requiredMonsterLevel = 0;
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

/** 把指定下标的队员改成目标职业（不带法术）；用于装载 fixture 队伍里没有的职业本身。
 *  改职业后原职业装备在载入时被 equipItem 的 characterClass 校验跳过，近战武器槽为空，
 *  需按职业的 slotStatBonusList 槽位用 withEquippedItem 补一件职业匹配武器。 */
export function withCharacterClass(save, index, characterClass) {
  const out = clone(save);
  const character = out.adventurers[index];
  if (!character) throw new Error(`fixture 缺少队员下标 ${index}`);
  character.characterClass = characterClass;
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
/** 直接抬高队伍经验值：让"升级冒险者"这类只有视图入口的升级变为可购。 */
export function withExperience(save, experiencePoints) {
  const out = clone(save);
  out.party.experiencePoints = experiencePoints;
  return out;
}

/** 给全部冒险者发放技能点：让"技能升级"这条只有视图层能进入的购买路径变成可购。 */
export function withSkillPoints(save, points) {
  const out = clone(save);
  for (const adventurer of out.adventurers) {
    adventurer.skillPoints = points;
  }
  return out;
}

/** P-5 健壮性矩阵：按点路径删除字段后返回克隆（'a.b' 或 'a.b.3.c' 形态）。
 *  用于验证恢复路径对缺失字段的容忍度——原版与重构版必须同接受或同拒绝。 */
export function withoutFields(save, paths) {
  const out = clone(save);
  for (const path of paths) {
    const keys = path.split('.');
    let node = out;
    for (let i = 0; i < keys.length - 1; i++) {
      node = node?.[keys[i]];
      if (node == null) break;
    }
    if (node == null) continue;
    const last = keys[keys.length - 1];
    if (Array.isArray(node) && /^\d+$/.test(last)) {
      node.splice(Number(last), 1); // 数组索引用 splice，delete 会留洞
    } else {
      delete node[last];
    }
  }
  return out;
}

/** P-5 边界值变异：按点路径直接赋值（不做类型/范围校验，忠实写入门控外） */
export function withFieldValues(save, entries) {
  const out = clone(save);
  for (const [path, value] of entries) {
    const keys = path.split('.');
    let node = out;
    for (let i = 0; i < keys.length - 1; i++) {
      node = node?.[keys[i]];
      if (node == null) break;
    }
    if (node != null) node[keys[keys.length - 1]] = value;
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
