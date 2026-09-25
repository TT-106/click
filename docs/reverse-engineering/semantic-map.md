# 语义映射日志（2026-09-26 会话）

> 本文件记录本次会话确认并落地的符号/字段语义映射。证据等级均为 HIGH（原版 c2.js 同构对照 + 引擎内消费点 + 序列化路径验证），每个批次落地后均通过 parity + 场景矩阵 + E2E 三重回归。
> 历史映射（1,228 符号 + 202 字段）见 `docs/symbol-map.json`。

## 已落地的字段重命名（12 个批次，全部回归通过）

| 原字段 | 新名 | 所有对象 | 序列化同步点 |
|---|---|---|---|
| O / P / M / N | firstFrameColumn / firstFrameRow / lastRowFrameCount / lastFrameRow | 动画帧表条目（animations.js） | 无（静态定义） |
| k / h / j / l / m | id / pointEventTypeId / requiredCount / name / requirementType | Achievement | game-save.js achievementId/648 |
| h | pointEventTypeId | PointEventDefinition | game-save.js→pointEventType |
| A | canPurchase | Upgrade 及 15 个子类 | 无（每帧重算） |
| H | upgrade | UpgradeButtonView / *Details 视图 | 无（视图层） |
| T / U | x / y | Vector2（全引擎） | 无（经访问器序列化） |
| o | name | 怪物定义 | 无（存档为 name） |
| r / s | slot / characteristic | Item | entities.js（itemSlot/itemCharacteristic） |
| r / s | slot / statType | 类定义 tb 槽条目（classes/**guardians/minions**） | 无 |
| p | position | Character | entities.js positionComponent |
| u / w | levelPosition / room | CharacterPosition | entities.js levelX/levelY/roomId |
| q / R / L | worldBlocks / blockOriginColumn / blockOriginRow | WorldMap | game-save.js blockShiftCol/Row |
| G | tileGrid | DungeonLevel / 房间 / 走廊寻路器 | 无 |
| d | spriteName | 职业/怪物/BOSS 定义、MonsterType | 存档键为 sprite（值经 getName()） |
| v() | getSprite | SpriteSheet / Character | 无 |
| v() | getBackgroundSpriteAt / getDecorationSpriteAt | TerrainBiome / DecorationBiome | 无 |
| C | tabState | 面板视图 / TabButtonView | 无（UI） |
| t / lf / nc / xf / md / $g | currentValue / levelIncrement / activeValue / baseValue / purchasedLevels / perLevelIncrement | 冒险点加成、药水修正、全局升级定义三组 | game-save.js settings.upgrades 值位（md→purchasedLevels，键不变） |
| c | id | 技能定义（skills/*.js）、法术定义（targeting.js）——**统一为 id**（serializeUpgradeFlags 多态读取） | entities.js upgrades1-4（键为 id 的**值**，不变） |
| c | settingId | 全局升级定义（balance.js） | game-save.js settings.upgrades 的**键**=值（"treasureChestChance"），不变 |

## 符号映射（原版全局/方法）

| 原符号 | 语义 | 位置 |
|---|---|---|
| ga | SeededRandom（JS 浮点变体 MT19937） | core/math.js |
| lB | 序列化存档 DTO | 原版全局（harness snapshot） |
| pB(15) | 单回合步进 advanceSimulation(15) | 原版全局（harness advance） |
| hE | 导入存档 | game.importSave |
| Hr / Hr.Hr() | GameLoop 实例 / 帧 tick | sB.prototype.Hr |
| Em / ig / jf / Vj | initialized / processingOffline / offlineDuration / offlineProcessed | 原版字段 |
| Ba() | nowMilliseconds | 原版 |
| Ta | recordGameEvent | 原版 |
| kD / xu | beginOfflineProgress / finishOfflineProgress | 原版 |
| Jp / bp | allowOfflineProgress / allowBackgroundProgress（options） | 原版 |
| KD | Character 的 slot→statType 映射 | character.js |
| Z | Character 的槽位列表 | character.js |
| ps / os | ItemGenerator 的 slot→types 缓存 / hash→type 表 | items.js |
| ef | Equipment 按槽位取装备 | movement.js |
| it / oq | CharacterSkillUpgrade 的技能定义 / LearnSpellUpgrade 的法术定义（Jr() 多态访问） | upgrades.js |
| mg / mb | 药水条目的修正对象 / GlobalUpgrade 的定义对象 | potions.js / upgrades.js |

## 波次 3 追加（第四轮取证落地）

| 原字段 | 新名 | 所有对象 |
|---|---|---|
| e | description | 技能/全局升级定义 |
| e | descriptionLabel | Upgrade 实例动态按钮文案 |
| f / g | statType / statBonusValue | 技能/卷轴/守卫/随从加成条目（applyStatBonus 唯一消费漏斗） |
| X | statusEffectTypeId | 状态效果定义/法术定义/Spell/StatusEffect/行为（枚举 0-14） |
| V | getStatisticCell / getOfflineProgressCell | StatisticsView / OfflineProgressView |
| W | buttonElement / contentContainer / upgradeButton | UpgradeButtonView / *Details / DungeonRowView |

## 待取证残留（约 1,300 处访问）

高频：`Y/Z/aa/ca/ea/ga/fa/ka/na` 等长尾——工作清单 `artifacts/obfuscated-fields.json`（按频次排序，含样例代码）。取证方法与产出格式见 WORKSTATE.md 第 6 节。
