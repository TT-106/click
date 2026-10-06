# 经典战斗公式与消费点

本文件描述当前经典实现，不适用于原野准备层。数值来自 `src/engine/modules`；符号和输入前置条件必须一起看。旧逐项取证、疑似缺陷与原版对照完整保留在 [历史稿](../history/formulas-combat-before-governance.md)，其中短名和“尚未修复”结论不代表现状。

## 时间、属性与冷却

`floorNumber` 是原版取整函数：小于2^31的输入走 `value | 0`，其它走 `Math.floor`；负数不能直接当普通向下取整。`randomInt(n)` 在n≤0时返回0，否则取 `floorNumber(Math.random()*n)`。下列F均表示这个函数，不得改变随机消费或浮点运算顺序。

| 量 | 当前公式/规则 | 源码位置与符号 |
|---|---|---|
| 回合 | 15个模拟单位；经典离线每回合记250ms | `simulation/tick.js` / `advanceSimulation`；[时间模型](../time-model.md) |
| 属性值 | B + F((skillBonusPercent + spellBonusPercent)/100 * B)，B=itemValue+levelValue | `characters/stats.js` / `statValue` |
| 攻击冷却 | max(4, baseAttackCooldown - attackCooldownReduction + 有资格时的attackCooldownBonus) | 同文件 / `getAttackCooldown`；调用资格见 `characters/character.js` |
| 法术就绪 | turnNumber-lastCastTurn ≥ cooldownTurns；未来时间戳先重置为turnNumber-3*cooldownTurns | `combat/scrolls.js` / `isSpellReady`、`resetSpellCooldown` |
| 连锁次数 | 对chainCount次尝试连续成功到首次失败，概率chainChance/100 | `characters/stats.js` / `rollChainCount` |
| 多重攻击 | 对extraAttackCount次尝试连续成功到首次失败，概率extraAttackChance/100；各动作独立算伤害 | `combat/actions.js` / `performMultiAttack` |
| 随从过期 | turnNumber-summonedAtTurn > lifetimeTurns；负寿命跳过该检查 | `simulation/tick.js` / `advanceSimulation` |

## 普通攻击与法术伤害

AR、DR分别是攻击者攻击等级和目标防御等级，D是攻击者伤害属性，A是目标护甲，R是目标damageResistance。它们由 `statValue` 读取。

1. 目标非isDisabled时，随机值 > AR/(AR+DR) 则返回0；目标失能会跳过此随机消费。
2. critChance>0时另掷随机值，命中critChance/100则直接返回D，跳过护甲与R。
3. h=F(A/2)，剩余伤害g=D-h-randomInt(h)。g≤0则返回0。
4. R>0时返回max(0, g-F(R/100*g))，否则返回g。

顺序证据如下；不能用“护甲从A/2到A均匀抽样”替代实际半开整数区间。AR+DR=0、非法负值等输入没有新增防护。

`src/engine/modules/combat/actions.js:581-611`

```js
export function calculateAttackDamage(attacker, defender) {
  var attackerStats = attacker.stats,
    defenderStats = defender.stats,
    attackRating = statValue(attackerStats.attackRating),
    damage = statValue(attackerStats.damage),
    defenceRating = statValue(defenderStats.defenceRating),
    armor = statValue(defenderStats.armor),
    damageResistance = defenderStats.damageResistance,
    critChance = attackerStats.critChance;
  if (!defender.effects.isDisabled && Math.random() > attackRating / (attackRating + defenceRating)) {
    return 0;
  }
  if (0 < critChance && Math.random() < critChance / 100) {
    return showFloatingText(game.floatingText, attacker, "暴击!", "#FFFF00"), damage;
  }
  var armorReduction = floorNumber(armor / 2);
  damage -= armorReduction + randomInt(armorReduction);
  return 0 >= damage ? 0 : 0 < damageResistance ? Math.max(0, damage - floorNumber(damageResistance / 100 * damage)) : damage;
}
export function calculateSpellDamage(attacker, defender) {
  var attackerStats = attacker.stats,
    damage = statValue(attackerStats.damage),
    armor = statValue(defender.stats.armor),
    critChance = attackerStats.critChance;
  if (0 < critChance && Math.random() < critChance / 100) {
    return showFloatingText(game.floatingText, attacker, "暴击!", "#FFFF00"), damage;
  }
  var armorReduction = floorNumber(armor / 2);
  damage -= armorReduction + randomInt(armorReduction);
  return 0 >= damage ? 0 : damage;
}
```

`calculateSpellDamage` 不做命中或R检查，但仍做暴击与护甲；**是否属于这条路径按调用点判断**，不能声称所有法术统一使用它。

`createAttackAction` / `createSpellAction` 写remainingDamage与noDamage。`advanceCombatAction` 在对应动画阶段推进伤害；`applyActionDamage` 每次取1+randomInt(remainingDamage-1)，扣本次份额并记录伤害，生命夹到0后调用 `resolveCharacterDefeat`。零伤害动作的视觉/效果闸门要看 `advanceCombatAction`，不等价于独立“miss”系统。

## 治疗、效果、目标与遭遇

| 主题 | 当前规则/定位 |
|---|---|
| 治疗cat1 | `combat/actions.js` / `advanceCombatAction`：按potencyPercent、healPotency、最大生命和动画帧数分帧治疗，单次至少1，生命夹到最大值 |
| 自然再生 | `simulation/tick.js`：每3回合按max(1,F(最大值*基础/技能/升级百分比之和/100))补生命或精神，上限最大值 |
| 耗蓝 | `characters/stats.js` / `getSpellSpiritCost`、`spendSpirit`；`combat/actions.js` / `createSpellAction`。免费药水会跳过扣蓝 |
| 效果定义/增益 | `combat/skill-effects.js` 的定义和 `applyBonusList`；`characters/effects.js` 的 `updateCharacterEffects`。技能与动作法术分别处理 |
| 效果到期/失能 | `characters/effects.js` / `isDisablingEffect`、`updateCharacterEffects`；行为停手见 `simulation/tick.js` / `updateCharacterBehaviors` |
| 溅射/地面伤害 | `simulation/tick.js` 的category8和tileEffect分支；地面掷randomInt(remainingEffectDamage+1)，未重新套普通攻击命中/护甲公式 |
| 召唤/复活/清除状态 | `combat/actions.js` / `applySpellEffect`、`summonSpellMinion`；不可仅由spellCategory名称推断全部行为 |
| 阵营与对手 | `combat/encounters.js` / `getAllies`、`getOpponents`；转变/控制的效果位影响集合 |
| 目标选择 | `ai/targeting.js` / `findNearestOpponent`、`findNearestVisibleOpponent`、`findChainTarget`；范围取样在 `combat/actions.js` / `findTargetsInRange`，按数组顺序而非全局距离排序 |
| 行为优先级 | `ai/behaviors.js` / `BehaviorQueue.updateBehaviors`；具体行为与职业模板见该模块，不能按文档旧短名调用 |
| 死亡分派 | `resolveCharacterDefeat`：冒险者置倒地效果，随从走despawnMinion，首领固定爆发，普通敌人走lifecycle.clearEncounter |
| 开始/结束遭遇 | `combat/encounters.js` / `populateEncounter`、`EncounterState.clearEncounter`；清场按怪物集合判定，倒地队友不是死亡出队 |
| 怪物属性 | `combat/encounters.js` / `advanceMonsterTypeRank`、`populateEncounter`；曲线名与消费属性一致，见 [成长公式](progression.md) |

## 已修复与仍需判断的问题

- 当前 `Scroll` 构造器和六条定义均使用spellDefinition；五种施法，箭雨为null并回退普通攻击。旧“全部不施法”迁移错配已有 `scroll-cast-in-combat` 覆盖，证据见 [facts第30条](../reverse-engineering/facts.md)。本轮仅核对源码/场景定义，未重跑浏览器差分。
- 当前 `Equipment.equipItem` 以characteristic===1赋effectItem。旧“永远没有武器元素效果”因读取不存在statType的结论已过期；这不证明每个特效已做交互验收。
- 当前R55捕获模拟故障，停止模拟/自动存档/时长累计，显示帧仍继续。原投射物空值前置条件可能仍触发异常，不能把异常处理说成该玩法缺陷已修复。
- 溅射眩晕action先读缓存再初始化、旁目标伤害按主目标计算等结构仍存在；历史疑似怪癖不自动获得改规则授权。

完整行为等价性以 [经典验收矩阵](../../REFACTOR_REPORT.md) 及对应输入的差分为准。随机源/消费边界见 [rng](../rng.md)；绿色片段检查只说明本页摘录一致。
