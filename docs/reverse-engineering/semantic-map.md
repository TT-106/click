# 语义映射日志（2026-09-26 会话）

> 本文件记录本次会话确认并落地的符号/字段语义映射。证据等级均为 HIGH（原版 c2.js 同构对照 + 引擎内消费点 + 序列化路径验证）。
> 历史映射（1,228 符号 + 202 字段）见 `docs/symbol-map.json`。

## 已落地的字段重命名（全部通过 parity + 场景矩阵 + E2E 回归）

| 原字段 | 新名 | 所有对象 | 同步的序列化映射点 |
|---|---|---|---|
| O / P / M / N | firstFrameColumn / firstFrameRow / lastRowFrameCount / lastFrameRow | 动画帧表条目（animations.js） | 无（静态定义） |
| k / h / j / l / m | id / pointEventTypeId / requiredCount / name / requirementType | Achievement | game-save.js:1000(achievementId), 648 |
| h | pointEventTypeId | PointEventDefinition | game-save.js:967→pointEventType |
| A | canPurchase | Upgrade 及 15 个子类 | 无（每帧重算的运行时缓存） |
| H | upgrade | UpgradeButtonView / 16 个 *Details 视图 | 无（视图层） |
| T / U | x / y | Vector2（全引擎） | 无（经访问器序列化为 levelX 等） |
| o | name | 怪物定义（monsters.js） | 无（存档为 name） |
| r / s | slot / characteristic | Item 实例 | entities.js serializeItem/restoreItem（itemSlot/itemCharacteristic） |
| r / s | slot / statType | 类定义 tb 槽条目（classes.js、**guardians.js、minions.js**） | 无（内容数据） |
| d（monster defs）| name | 怪物定义 | 无 |

## 已取证待落地（下一波重命名，证据 HIGH）

| 字段 | 提案名 | 所有对象 | 备注 |
|---|---|---|---|
| c | settingId / skillId / spellId | 全局升级定义 / 技能定义 / 法术定义 | 存档键是**值**（"treasureChestChance"）非属性名，重命名安全；同步 game-save.js:953/543-551 与 entities.js:138-156 |
| d | spriteName | 职业定义 / 怪物目录条目 / MonsterType | MonsterType 的存档键为 "sprite"（entities.js:192） |
| v() | getSprite | SpriteSheet / Character | TerrainBiome.v→getBackgroundSpriteAt；DecorationBiome.v→getDecorationSpriteAt |
| t | currentValue | 冒险点加成 {t,defaultValue,lf} / 药水修正 {t,defaultValue,nc} / 全局升级 {t,xf,md,$g} | 建议整组一起（lf=每级增量, nc=激活值, xf=初始, md=已购级数, $g=每级增量） |
| C | tabState | 面板视图 / TabButtonView | 纯 UI |
| q / R / L | worldBlocks / blockOriginColumn / blockOriginRow | WorldMap | 同步 game-save.js:66-67/717-718（blockShiftCol/Row）；tick.js 中同名成员属其他对象，需甄别 |
| G | tileGrid | DungeonLevel / 布局生成器 | |
| u / w | levelPosition / room | CharacterPosition | 同步 entities.js（levelX/levelY/roomId）；`.w` 需防 width 撞名 |
| p | position | Character | 259 处读取、18 文件，需按所有者甄别 |

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
