# 经典成长、成本与生命周期

本页负责当前经典数值和保留集合；原野生产/装备是未接线设计。旧P-1至P-8、统计事件明细和逐条疑似怪癖保留在 [历史取证稿](../history/formulas-progression-before-governance.md)，不作为当前字段API。

## 曲线求值器与常量

F为原版floorNumber：小于2^31时用value|0，其它用Math.floor。S(L,C,m)=F(m*(C.base+C.coefficient*z^C.power*C.growth^z))，z=max(0,L-1)。道具再乘独立的1.1-0.2*Math.random()抖动后F；价格/经验不调用道具抖动器。

`src/engine/modules/core/math.js:72-80`

```js
export function scaleByLevel(level, curve, multiplier) {
  level = Math.max(0, level - 1);
  return floorNumber(multiplier * (curve.base + curve.coefficient * Math.pow(level, curve.power) * Math.pow(curve.growth, level)));
}
export function randomizeScaledValue(level, curve, multiplier) {
  var scaledValue = scaleByLevel(level, curve, multiplier);
  var jitterFactor = 1.1 - 0.2 * Math.random();
  return floorNumber(scaledValue * jitterFactor);
}
```

下表从本轮 `content/balance.js` 的明确常量录入；代码改变时同步，不把表当第二份平衡配置。

| 曲线 | power | coefficient | growth | base |
|---|---|---|---|---|
| experienceCurve | 2.1 | 500 | 1.005 | 100 |
| healthCurve | 1.5 | 15 | 1.017 | 85 |
| spiritCurve | 1.5 | 15 | 1.017 | 85 |
| damageCurve | 1.6 | 25 | 1.017 | 22 |
| armorCurve | 1.8 | 15 | 1.015 | 15 |
| monsterDamageCurve | 1.7 | 1 | 1.0017 | 30 |
| monsterArmorCurve | 1.7 | 1 | 1.0017 | 25 |
| monsterAttackCurve | 1.7 | 1 | 1.0017 | 30 |
| monsterDefenceCurve | 1.7 | 1 | 1.0017 | 25 |
| monsterHealthCurve | 1.7 | 1 | 1.0018 | 15 |
| monsterExperienceCurve | 1.24 | 1 | 1.0002 | 4 |
| itemStatCurve | 1.8 | 15 | 1.015 | 15 |
| itemGoldCurve | 1.8 | 15 | 1.015 | 15 |
| dungeonPriceCurve | 1.7 | 120 | 1.018 | 100 |
| monsterUnlockPriceCurve | 1.02 | 100 | 1.01 | 100 |
| scrollPriceCurve | 1.4 | 250 | 1.018 | 100 |
| globalUpgradePriceCurve | 1.02 | 50 | 1.01 | 100 |

## 等级、怪物与成本

| 项目 | 当前公式/消费位置 |
|---|---|
| 下一等级XP | S(当前等级,experienceCurve,1)；`simulation/characters.js` / `applyLevelStats`；升级由LevelUpUpgrade.purchase驱动而非经验自动触发 |
| 冒险者属性 | armor/attackRating/defenceRating/damage四项levelValue共用armorCurve，各乘职业系数；生命/精神用各自曲线；damageCurve给spellSpiritCost |
| 怪物属性 | effectiveLevel=10*(monsterType.level-1)+rank；`advanceMonsterTypeRank`将六条monster曲线写入对应属性/experienceReward。旧“名字与用途交叉”是命名史，不是当前规则 |
| 怪物阶位 | rank最高5，rankKillThreshold每阶增加20；recordMonsterTypeKill按当前阈值消费rankProgressKills余数；不是永远每20次升阶 |
| 全局升级价 | S(baseCost+purchasedLevels*costPerLevel,globalUpgradePriceCurve,1)，用杀戮支付；效果=min(maxValue,baseValue+purchasedLevels*perLevelIncrement) |
| 地牢价格 | 发现时S(discoveredDungeonCount+1,dungeonPriceCurve,1)；实付再F(farmCost*dungeonCostBonus)；见characters/character.js和PurchaseDungeonUpgrade |
| 怪物等级解锁 | S(目标等级,monsterUnlockPriceCurve,1)后再乘itemCostBonus取整；要求杀戮足够、队伍最低等级足够、解锁窗口小于VISIBLE_MONSTER_LEVELS(5) |
| 怪物等级退休 | 同曲线，但以minUnlockedLevel为下标；退休递增下界并删该等级缓存；见RetireMonsterLevelUpgrade |
| 卷轴升级 | idx=locked?baseCapacity:baseCapacity+(upgradeCount+1)*capacityIncrement；价S(idx,scrollPriceCurve,1)，同时用idx作施法者等级门；已解锁还受maxCharges限制 |
| 胜场 | 背包构造额外容量最多10；新角色额外技能点最多40；职业解锁按requiredVictories。展示读点不构成额外加成 |

成本和资格都在 `progression/upgrades.js` 的相应getCost/refreshAvailabilityState/purchase中校验；近似可买只是显示，不等于支付许可。物品量的公式另见 [道具](items.md)。

## 冒险点、成就和统计

`progression/points.js` 通过bindAdventurePoints绑定会话：awardAdventurePoints累加该事件次数和当前单价；increasePointEventReward改变事件单价后会按历史countsByEventType重建pointsByEventType，availablePoints=max(0,各事件点数总和-spentPoints)。因此成就奖励追溯既往事件，不只是影响未来。

成就每4回合检查一次；`getAchievementProgress(achievement,data)` 多数读lifetimeStatistics，类型16读当前partyMaxLevel，胜利成就走hasVictoryAchievement。obtained与applied是两阶段，领取才调用applyAchievementReward增加单价；保存回读会重建状态，不应重复发奖。代码入口见 `progression/achievements.js` 和 `simulation/tick.js`。

三组统计分别为runStatistics/lifetimeStatistics/victoryStatistics；字段与旧键适配见 [状态模型](../game-state-schema.md)、`progression/statistics.js` / `persistence/entities.js`。weaponRacksLooted读取兼容旧weaponsRacksLooted并取最大值；farmsPurchased的falsy回填可能把真实0与缺失混同，作为遗留风险保留而未修改代码。

## 重生、继续与完整重置

`runtime/game.js` 是生命周期所有者。读档先resetRun(true)再回填DTO；恢复后重新接绑定端口。resetRun会清除simulationFault。

| 状态 | restartRun重生 | continueRun继续 | resetGame完整重置 |
|---|---|---|---|
| victoryCount / 冒险点 / 成就 / 累计统计 | 保留 | 保留 | 清空 |
| 本轮统计 | 清空 | 清空 | 清空 |
| 胜利统计 | 保留，当前继续计数和当前连续胜利归0 | 保留，currentContinueCount加1 | 清空 |
| 角色等级 / 技能 / 装备 / 背包实例 | 清空重建 | 保留 | 清空 |
| 全局升级 / 卷轴 / 怪物等级目录 | 归初值 | 保留 | 归初值 |
| 药水库存 / 世界层 / 掉落 / 战斗队列 | 清空或重建 | 清空或重建 | 清空或重建 |
| 地牢 / 城堡 / 农场 / 商店 | 重建 | 重建；发现计数恢复为重置前农场数，城堡nextRequiredMonsterLevel保留 | 重建 |

继续路径的发现计数是实际遗留实现，不自动视为合理产品目标；完整规则变更需要差分/设计证据。

## 离线结算与故障

读档离线要求超过120000ms，beginOfflineProgress把时长上限设为43200000+offlineTimeBonus（12/14/16小时）。后台标签页的离线累加不经过这个上限。正常无胜利/故障且结算完成时，回合数为ceil(offlineDuration/250)，每帧最多200；不是floor。原野没有此收益路径。

离线期间不自动购买/刷新普通可购状态、不自动存档；模拟异常会停止后续模拟、时长记账和自动保存，不能称“与在线全条件等价”。统一时间与故障边界见 [time-model](../time-model.md)。本轮未重新运行所有差分和长跑；经典验收判定见 [REFACTOR_REPORT](../../REFACTOR_REPORT.md)。
