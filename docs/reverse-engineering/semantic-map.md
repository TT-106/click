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
| Z | slotList | Character / Equipment / ItemType（equipment.js 51 处字面量，含 split(" ") 变体） | 无 |
| Da | combatTarget（Character）/ targetCharacter（CombatAction）/ selectedTarget（Explore 系 Behavior） | 三类所有者三名的多态字段（第四轮 A 组证据 + 运行时类型观察器验证） | entities.js positionComponent 无关；CombatAction.Cb/Behavior.Cb 写入侧已同步 |
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

## 第八批方法族续：按接收者拆分（2026-09-26）

| 原方法 | 新名 | 接收者与行为 |
|---|---|---|
| bc() | getWorldColumn() | WorldTile / Dungeon：读取世界瓦片列 |
| bc(a) | pixelToTileColumn(a) | WorldMap：像素列换算为瓦片列，内部 vw() 同步 |
| dc() / ec() | getPixelX() / getPixelY() | WorldTile / Dungeon：读取世界像素坐标 |
| dc(a) / ec(a) | tileToPixelX(a) / tileToPixelY(a) | WorldMap：瓦片坐标换算为像素坐标 |
| dc() / ec() | getWorldPositionX() / getWorldPositionY() | CharacterPosition：读取世界坐标；存档键 worldX/worldY 不变 |
| ac(a) | distanceTo(a) | Vector2：欧氏距离 |
| ac() | getRenderSortKey() | RenderCommand：深度排序键 ur-vr |

首次批量脚本误把 entities.js 的 CharacterPosition `h` 当作 WorldTile，且遗漏 Vector2、RenderCommand 调用点及 WorldMap.vw() 的内部调用；修正后 check、parity、12 场景、E2E 均通过。

## 第八批字段续：药水图片（2026-09-26）

`jc` → `potionSprite`：药水定义中的值为 PNG 名，`Potion` 构造函数用 `game.itemSprites.getSprite()` 转为 Sprite 实例；世界掉落渲染与药水按钮均读取实例 Sprite。定义、构造桥接及两个读取点同批更新，存档键不涉及此字段。

`kc` → `spellDefinitions`：职业定义保存“法术键 → 定义记录”的对象或 null；存档载入时 `game-save.js` 遍历此对象，按法术名称反查定义。classes/guardians/minions 的字面量键与载入读取同批更新，存档 `spellName` 键不变。

`mc` → `descriptionText`：23 条冒险点升级定义的说明文字；`AdventurePointUpgrade.getDescription()` 读取该字段。定义键与消费点同批更新，无存档映射。

`Zb` → `character`：CharacterSkillUpgrade 与 LearnSpellUpgrade 持有的目标 Character，赋值、清空、购买和可购买性判断共 24 个所有者引用同批更新；存档通过既有升级状态映射，不直接保存该运行时引用。

## 统计计数字段：推进事件组（2026-09-26）

RunStatistics 的 `On/Lk/qn/Mj/wi/uk` → `turnCount/doorsOpened/roomsCleared/levelsCleared/dungeonsCleared/castlesConquered`。证据为各 `record*` 的自增目标及 `entities.js` 同名存档键；构造与 reset、存档读写、成就、信息面板，以及额外发现的 `views/results.js` 离线进度面板同步。`LifetimeStatistics.prototype = new RunStatistics()` 的继承关系保留，六个 JSON 键未改。

统计活动组：`Xj/Rk/Xk/Wk/si/Dl/Sd/oj` → `playedMillis/farmsPurchased/totalGoldFromMonsters/totalGoldFromItems/directKills/scrollKills/farmedKills/characterStunnedCount`。存档键、record 方法、成就和视图互证；`party.js` 读取 `playedMillis`。`Sd` 同时存在于 Dungeon 相关对象，本批仅修改已核对的 RunStatistics 接收者。

统计战斗组：`hl/wl/Gl/ul/El/kl` → `meleeAttackCount/rangedAttackCount/spellCastCount/potionsUsed/scrollsUsed/minionsSummoned`。RunStatistics 记录方法、存档读写、成就分支与信息面板同步；JSON 键不变。

统计物品组：`Ph/Gi/Ol/xl/Zk/nk/Nl/Sl/tk` → `itemsSold/itemsFound/uncommonItemsFound/rareItemsFound/historicItemsFound/ancientItemsFound/treasureChestsLooted/weaponRacksLooted/bookcasesLooted`。存档读写、`recordItemFound` 按稀有度分发、成就、信息面板及离线结果视图同步；JSON 键不变。

## 城堡征服与胜利瞬间（2026-09-26，U4 差分驱动）

`PartyState.prototype.iw`（`characters/party.js:205`）是"离开已清空城堡"的收尾函数：清空队员移动目标与掉落物 → `game.currentCastle = null`、`game.worldActive = true` → `castle.ye = false`、`castle.conquered = true` → 遍历 `castle.ck` 的四个相邻区域解锁邻堡 `regionLocked` → `invalidateCastleRevision()` + `refreshWorldBlocks()` + `recordGameEvent("Castle", "已清空:"+castleName)` → `recordCastleConquered()` → `awardAdventurePoints(19)` → 统计 `game.castles.pd` 中未征服者，数量为 0 时执行 `victoryCount++`、`game.gameWon = true`、`finishOfflineProgress()`、`saveProgress()`、`view.onGameWon()`，再按队伍规模写 `victoryStatistics.hn/jn/kn`、按队员职业写 `victoryStatistics.qo[class]`。

触发点在 `characters/character.js:407`：非世界态下角色抵达 `moveTargetPoint` 且其 `position.ed` 非空即调用 `iw()`。`position.ed` 由 `ai/behaviors.js:1004` 从 `PartyState.ed` 复制，而 `PartyState.ed` 只在 `characters/party.js:562` 被赋值为 `game.level.tf`（出口房间），因此征服只能由"走进城堡、走到出口楼梯、离开"这条物理路径触发；引擎不存在"地牢已全部征服即直接占领城堡"的捷径（战斗中 `castle.conquered` 只有 `iw` 一处赋值，另一处是存档 `tx()`）。城堡的攻击计划位 `ye`（存档键 `attackScheduled`）只由 `progression/upgrades.js:327` 的"攻击城堡"升级购买写入，载入时按存档值重建 `Jg`/`Dh` 两个列表。

## 成就职业字段：定义表与读端补齐（2026-09-26）

`Hb` → `characterClass`：成就实例字段与 `hasVictoryAchievement` 的读取早已用语义名（`progression/achievements.js:16,56,60`），而定义表里 22 条职业胜利/独职业胜利记录仍写作 `Hb:`（原版同名键，见 `c2.js` 的 `barbarianVictory` 等）。读端因此恒为 undefined，`getClassVictories()` 取 `qo[undefined]` 得 0，requirementType 25/27 的成就在重构版永远无法置为 obtained。本批把 22 个定义键改为 `characterClass:`，与读端同名。涉及的存档键只有 `achievementManager.achievements[].obtained` 与 `victoryStatistics.classVictories`，均未改动。

## Ob/Pb 接收者修正：房间金币堆（2026-09-26）

`world/rooms.js` 的揭示房间分支（`roomType 3` 金堆房）对 `a.tileGrid[col][row]` 取到的 DungeonTile 调用了 CharacterPosition 变体 `getLevelPositionX/Y`。原版此处接收者是 DungeonTile（`f.Ob()/f.Pb()` 返回 `VD/WD`，即语义化后的 `pixelColumn/pixelRow`），已改回 `getPixelX()/getPixelY()`。这条分支在既有 14 个场景里从未被执行，城堡征服差分推进到约 6900 回合时以 `TypeError: f.getLevelPositionX is not a function` 暴露。全仓库其余 22 处 `getLevelPosition*` 调用点已逐一核对接收者，均为 CharacterPosition。

## 法术效果施加时机与分发（2026-09-26，U4 法术差分驱动）

`Spell.td`（仍未改名）决定效果在动作的哪一刻施加：`combat/actions.js:62-70` 在 `impactEffect` 首次生成（`hasSpawned` 为假）时，若 `actionDefinition.td` 为真立即调用 `applySpellEffect`；`actions.js:116` 在动作收尾（命中特效播放完毕 `bl()`）时对 `td` 为假的定义补调同一函数。`content/spells.js` 的 15 处 `td` 中，14 处为 `true`，唯一 `td: false` 是忍者怪"快速打击"（cat=12），它同时在 `actions.js:91` 的伤害分支里走 `applyActionDamage`。

`applySpellEffect`（`actions.js:118`）按 `spellCategoryId` 分发：cat 2/3 用 `statusEffectDefinitions[statusEffectTypeId]` 构造 StatusEffect 并 `effects.of.push`，禁用类效果再置 `effects.Kd = true`（`actions.js:121-153`）；cat 9/10 走 `summonSpellMinion`；cat 11 先把目标从 `game.monsters.Og` 移除再召唤；cat 17 按召唤者概率产出小鸡。进入该函数的既有三条路径：职业主动施法、卷轴施放（`combat/scrolls.js:149-160` 把 `Spell` 挂到 `scrollCaster.ld` 并置 `actionType = CAST_ACTION_TYPE`）、怪物 AI 施法（`ai/targeting.js:299-419` 的 `spellDefinition`）。`blastStunSpell`（cat=2、statusEffectTypeId=14）不属这三条，它由 `simulation/tick.js:346-348` 懒创建为二段打击动作的 `actionDefinition`，仍落在 cat 2/3 分支。怪物效果队列不入存档，所以"某类效果被施加了几次"只能靠下一节的只读逐帧扫描观察。

## 怪物效果队列的两端符号对照（2026-09-26，Blast Stun 直接计数）

原版 `archive/original/c2.js` 是顶层平铺的 classic script（`'use strict'; var aa=[…]` 起头，末尾 `window.Game = w;`），因此顶层 `function`/`var` 都是全局绑定，harness 才能直接取 `window.lB`、`window.pB`。据此确认的对照：

| 原版 | 重构版 | 语义 |
|---|---|---|
| `function pw(a,b,c,d,f,g,h)` | `StatusEffect` | 效果实例；`this.X` → `statusEffectTypeId`，`this.jD` 起始回合，`this.Qd` 持续回合，`this.Ok` 强度，`this.bg` 过期位 |
| `function kw(a,b)` | `applySpellEffect` | 效果施加分发 |
| `function qw(d)` | `isDisablingEffect` | type 0/1/13/14 为致效型控制 |
| `w.Gf`（`Gf: new Di`）/ `this.Og = []` | `game.monsters` / `Og` | 活怪物列表 |
| `b.Da.Ja.of.push(d)` | `targetCharacter.effects.of.push(d)` | 写入角色的效果数组 |
| `w.i.$a` | `game.state.turnNumber` | 当前回合 |
| `b.Ib` | `actionDefinition` | 动作携带的法术定义 |
| `function rw(a,b,c)` | `summonSpellMinion` | 按 `kv[a.ta]` → `minionsBySpell[a.name]` 反查随从模板，找不到时打印 `Failed to find minion for summon spell.` |
| `function sw(a,b,c)` | `spawnMinion` | 模板命中后真正生成随从 |
| `function Aw(a,b)`（`c2.js:21118`） | `getProjectileAnimation` | 远程动作的投射物动画名；首行 `3 === a.sw()` 无空值保护 |
| `yw` 的远程分支（`c2.js:21057-21061`） | `createAttackAction` 的 `actions.js:459-467` | `h` 为假时以 `Aw(b, null)` 建投射特效，`b` 即 `equipment.Ey` |

## 远程武器槽与空武器崩溃（2026-09-26，U4 法术分支驱动）

装备侧取证：`Equipment.Qk(item)` 在 `item.Cw()` 为真时写入 `this.Ey`，而 `Cw()` 就是 `ItemType.isProjectileItem`（`loot/items.js:317-319`）；`sw()` 是 `ItemType.projectileAnimationId`（`items.js:314`）。注册表里槽 61（盗贼，基名"闪电"，animId 2）与槽 62（忍者，基名"星星"，animId 3）是投射武器，animId 3 正是 `getProjectileAnimation` 首行 `3 === a.sw()` 返回 "Ninja Star" 的那一支。存档条目经 `restoreItem()` → `equipItem()` 装载，后者有 `item.characterClass === character.characterClass` 校验，不符就整批跳过并打印 `failed to equip non-equipable item`。

因此用 `withReclassedSpell()` 改职业后，原职业装备全部被跳过、`Ey` 为空，一旦该角色走远程攻击分支，两端就在同一处抛 `TypeError: Cannot read properties of null (reading 'sw')`：原版栈 `Aw (c2.js:21119) ← yw (21061) ← Lq (21805) ← pB (29943)`，重构版栈 `getProjectileAnimation (combat/actions.js:558) ← createAttackAction (actions.js:466) ← updateCharacter (characters/character.js:461) ← advanceSimulation (simulation/tick.js:267)`。两条栈逐帧同构，说明这是原版自带、重构版原样保留的缺陷（该函数对 `a` 无空值保护），按"不改写原始机制"的红线未修补。补上 `withEquippedItem()` 注入真实投射武器类型后，cat=12/14/15 三条法术分支即可正常驱动并通过完整存档差分。

这条对照是 `tests/engine-harness.js` 里 `countEffectApplications(turns, typeId)` 的依据：两端用同一套扫描逻辑、各自的名字表，逐帧统计"某类效果新落到某只活怪物身上"的次数。引擎效果队列不入存档，因此这类只读扫描是唯一能把瞬态行为变成可对比数字的入口。

## 第九轮落地：Potion 定义三元组（2026-09-26，独立全回归）

| 原字段 | 新名 | 证据 |
|---|---|---|
| `uc` | `displayName` | `views/expedition.js:687` 把该值写入药水按钮第一行 `innerHTML`；20 条定义取值均为药水面板主标题 |
| `tc` | `effectLabel` | 同按钮第二行 `Op.innerHTML`（`expedition.js:688`）；取值均为效果短句（"黄金掉落x2"） |
| `vc` | `modifierId` | `potions.js:15` 把它交给 `getPotionModifier` 的 `switch`，19 个分支各对应一条 `content/balance.js` 修正器 |

作用域与持久化：三键只在 `combat/potions.js`（构造 + 20 条定义字面量）与 `views/expedition.js` 两个读取点出现，重命名后全 `src` 已无 `.uc/.tc/.vc` 成员访问。存档侧只写 `potionId`（`persistence/game-save.js:877`），载入时按 `potionId` 反查 `potionDefinitions`（`game-save.js:666-668`）再构造 `Potion`，因此三个运行时字段不参与序列化，无存档键需要成对同步。

回归：`npm run check`（9 单测）、`npm run typecheck`（0 错误）、`test:parity`（0/1/99/900 回合）、`test:scenarios`（30/30，含 `potions-active`、`potions-inactive-auto`）、`test:e2e` 全绿。混淆属性清单由 1,238 项降至 1,235 项。

## 第十轮落地：点位事件四元组 + 内容表三组 + 目标地牢（2026-09-26，全回归通过）

子智能体取证 + 主智能体逐条复核命中数后一次落八项，`src` 内这八个字母的成员访问已全部归零。

| 原字段 | 新名 | 所有者 | 决定性证据 | 存档参与 |
|---|---|---|---|---|
| `Dc` | `basePointReward` | PointEventDefinition | `points.js:15` `c.currentPointReward = c.basePointReward` —— 它是可变当前值的原值 | 否 |
| `yc` | `achievementPointBonus` | PointEventDefinition | `achievements.js:18` 读入 `Vt` 后经 `increasePointEventReward` 作为奖励增量 | 否（DTO 只写 pointEventType/points/count） |
| `Fc` | `fullEventLabel` | PointEventDefinition | `a.Pt = "+" + a.Vt + "成就点每" + …` 拼进整句，取值为量词短句 | 否 |
| `Gc` | `shortEventLabel` | PointEventDefinition | `views/achievements.js:48` 写入 120px 统计表单元格，取值为短形式 | 否 |
| `Ec` | `opened` | 宝箱/书架皮肤变体对象 | `this.PA = f ? d.xh.opened : d.hh.opened`，与既有英文键 `closed` 对称；`Kg`（存档 `opened` 位）选择用哪张 | 否 |
| `zc` | `isDirectional` | 动画表条目 / SpriteAnimation | `tick.js:463` 该位为真时用"转向朝向"取代逐帧推进，仅弹道类条目携带 | 否 |
| `Ac` | `doorSprites` | DungeonTheme | `rooms.js` 门圈层 12 处 `theme.doorSprites.kg/Vf/jg/Uf`，同级键已叫 floor/stairs/wallSprites | 否 |
| `Wb` | `targetDungeon` | PartyState | 赋值源全是 `dungeonList` 过滤出的最近地牢，读取为 `getWorldColumn/Row`，兄弟字段已叫 targetCastle/targetShop | 否 |

同名冲突排查：`Cb` 经取证确认在 `Character.prototype` 与 `CombatAction.prototype` 上是**两个不同语义的 setter**（`setCombatTarget` / `setTargetCharacter`），而 `characters/character.js` 一个文件里同时含定义与 8 处另一主的调用点，按接收者拆分无法用逐文件工具完成，因此本轮不动、留作线级专项（见 unresolved U6）。
**U6 已随后闭合**：`Cb` 按所有者拆为 `Character.prototype.setCombatTarget` 与 `CombatAction.prototype.setTargetCharacter`，30 处命中全部清零；`character.js:1237` 那一行是逐文件工具做不到、需单独改回的一处。因双主语义，该字母不进全局 fields 段。

工具边界（本轮实测）：`rename-field.mjs` 的字符串字面量守卫比较的是全部字面量的多重集（含重复项），且基准取自替换前的原文，因此"改坏一处重复字面量"不会被放过；但它只能做逐文件的替换，`Cb` 这类"同一文件里既有本类定义又有他类调用点"的按接收者拆分超出它的能力，需要线级人工处理。

回归：`check`（9 单测）/`typecheck`（0 错误）/`parity`（0/1/99/900 回合）/`test:scenarios`（30/30）/`test:e2e` 全绿；混淆属性清单自本轮会话开始（1,238 项，含 Potion 三元组与升级行四字段）降至 1,223 项，共 12 个字母在 `src` 内清零。

## 第十一轮落地：升级族的三个虚方法（2026-09-26，全回归通过）

| 原符号 | 新名 | 所有者 | 决定性证据 |
|---|---|---|---|
| `Oc` | `isDisplayable` | Upgrade 及 17 个子类 | 基类 `return true`，子类 `canPurchase \|\| affordableSoon`；`UpgradeButtonView.isVisible` 直接返回它，`attachUpgrade` 里为假时 `hideElement(buttonElement)` |
| `Qc` | `purchase`（Upgrade 侧）/ `onPurchaseClicked`（按钮侧） | 双主，按所有者拆开 | `Upgrade.prototype.Qc` 基类空实现，子类里花钱/杀怪/加等级；`UpgradeButtonView.prototype.Qc` 只做 `if (this.upgrade.canPurchaseNow()) this.upgrade.Qc()`，且由 `buttonElement.onmouseup` 触发 |
| `Rc` | `attachUpgrade` | UpgradeButtonView + 17 个 *Details 视图 | `this.upgrade = a;` 后转发给子视图 `this.Ag.Rc(a)`；`views/dungeons.js` 也在升级按钮上调用同一方法 |

与 `Cb` 同样是双主字母：`Qc` 在 `progression/upgrades.js` 里是升级执行、在 `views/upgrade-details.js` 里是按钮点击处理，两处同名会误导，因此逐文件工具先统一改名为 `purchase`（21 处），再线级把按钮侧两处（`onmouseup` 调用点与 `UpgradeButtonView.prototype.purchase` 定义）改回 `onPurchaseClicked`。`Qc` 因此不写入 fields 段。

同时补上 `test-browser.mjs` 的 c2c 外部 DOM 契约断言（U2 的真实落地）与 U7（UI 独占路径未进差分）记录；混淆属性清单 1,222 → 1,219。

## 第十二轮落地：状态效果位、掉落物认领与地牢几何（2026-09-26，十五个字母，全回归通过）

| 原字段 | 新名 | 所有者 | 决定性证据 | 存档参与 |
|---|---|---|---|---|
| `Kf` | `isStunned` | CharacterEffects | `actions.js` 击倒分支里 `recordCharacterStunned()` 与 `new StatusEffect(13,…)` 同处置位，与 `removeStunEffects` 成对清除 | 否（效果队列不入档） |
| `wg` | `isStealthed` | CharacterEffects | 技能效果 type 11 定义 `cf:"潜行模式"`；渲染侧按它把角色画成半透明；`respondToTaunt` 里潜行会清空战斗目标 | 否 |
| `bi` | `isConverted` | CharacterEffects | type 4 定义 `cf:"转变"`；`getOpponents` 的敌我判定在该位为真时整体翻转 | 否 |
| `Zc` | `claimedBy` | 四个掉落类（Item/Gold/Potion/Scroll Drop） | 四类同构 `Re(a){this.Zc=a}`；行为侧 `this.goldDrop.claimedBy === a` 判"这是我的"，释放时 `Re(null)` | 否 |
| `qd`/`bd`/`ad` | `goldDrop`/`scrollDrop`/`potionDrop` | 各行为类 | 分别扫描 `game.goldDrops.pe` / `scrollDrops.kf` / `potionDrops.Hf`，与已语义化的 `ChangeFloorBehavior.treasureChest` 同构 | 否 |
| `Sk` | `pathTiles` | DungeonHallway | A* 结果 `l.pathTiles.push(d)` 逐个写入，角色按 `H[p.fg+1]` 沿线走 | 索引 `fg` 入档为 `floorPositionIndex`，未动 |
| `af`/`Be` | `doorA`/`doorB` | DungeonHallway | 存档行 `doorAOpen: Fa.doorA.isOpen, doorBOpen: Fa.doorB.isOpen` —— 键名本身即证据，两行必须同批改 | 键 `doorAOpen/doorBOpen` 不变 |
| `Yk` | `hallway` | DungeonDoor | `g.hallway = l; h.hallway = l;` 里 `l` 是 `new DungeonHallway(...)`；`getOppositeDoor(c.hallway, c)` | 否 |
| `cd` | `currentHallway` | CharacterPosition | 与已语义化的 `position.room` 成对：`p.currentHallway = Q.hallway` / `= null`；存档 `hallwayId: n ? n.hallwayId : -1` | 键 `hallwayId` 不变（entities.js:78 ↔ game-save.js:441 同批） |
| `Wc` | `separationDelta` | CharacterPosition | `separateDungeonCharacters` 里 `copyVector→subtractVector→normalizeVector→addVector` 的临时差值向量 | 否 |
| `me`/`ne` | `pixelColumn`/`pixelRow` | DungeonDoor | `p.wj = s; p.xj = n; p.me = s * game.tileSize; p.ne = n * game.tileSize;` —— 与 DungeonTile 已有的 tile/pixel 四件套同构 | 否 |

刻意未做：`oc` 在同文件里有两个所有者（VisualEffect/RenderCommand 的播放游标 + 从未被读取的 AnimationFrame 写入位），后者证据只到 MEDIUM，不与其共用 `frameIndex`；`$c` 待与方法族一批处理。

`rc`/`sc`（三个所有者同为"以瓦片计的列/行数"，`terrain.js:323` `sc = WORLD_BLOCK_ROWS; rc = WORLD_BLOCK_COLUMNS` 定死方向）已落为 `widthInTiles`/`heightInTiles`，只喂 generation.js 与 terrain.js 两个文件——scene.js / tick.js / initialization.js 里 `rc,`/`sc,` 是 `var` 声明简写，工具的简写规则会误伤，故不入文件表。

回归：check（9 单测 + 109 文件语法）/typecheck 0 错误/parity 四档/34 场景/e2e 全绿；混淆属性清单 1,219 → 1,202（本批十七个字母全部清零），fields 段 219 → 236。

## 第十三轮落地：怪物目录解锁位、冒险点管理器与行进度文本（2026-09-26）

| 原字段 | 新名 | 所有者 | 决定性证据 | 存档配对 |
|---|---|---|---|---|
| `hd` | `minUnlockedLevel` | `game.monsterCatalog` | 日志原文 `"getMonsterTypesForLevel. monsterLevel (" + b + ") less than min unlocked level: " + a.minUnlockedLevel` | `entities.js:324` 读端 ↔ `game-save.js:944` 写端 `minUnlockedLevel: sa.minUnlockedLevel`，存档键不变 |
| `ae` | `adventurePoints` | GameState 内联点管理器 | `recalculateAdventurePoints(game.state.adventurePoints)`、`canPurchase = ... <= game.state.adventurePoints.Dd`；`runtime/game.js:155` 的对象字面量键同批 | 值 `Dd` 的 DTO 键不变（`adapter.js` 的 `points` 输出键亦不变） |
| `kd` | `progressTextElement` | CastleRowView 与 MonsterRowView（两个所有者同一语义） | 构造链里紧跟已语义化的 `progressFillElement`，且 `innerHTML = a > b ? "最大" : formatAmount(a) + " / " + formatAmount(b)` | 否（UI） |

回归：check/typecheck/parity/34 场景/e2e 全绿；混淆清单 1,202 → 1,199。

## 重命名执行器 `scripts/rename-field.mjs`

本批起改用手写守卫的执行器，用法 `node scripts/rename-field.mjs <old>=<new> <file...> --expect <total>`。写盘前强制四项校验：命中总数等于 `--expect`、行数不变、逐行缩进不变、字符串字面量多重集不变，任一失败整批不落盘。

动因是本轮两次真实踩坑：`node -e "..."` 在双引号里被 bash 吞掉替换串的 `$1`，导致缩进被抹平；而 `^(\s*)key:` 的 `\s*` 在 CRLF 文件里可从 `\r` 后的行首位置吃掉 `\n`，把相邻两行并成一行。两者 `node --check` 与 tsc 都不报错，只有逐字结构比对能抓到。后续批次不应再用内联 shell 脚本改源码。

## 待取证残留（约 1,300 处访问）

高频：`Y/Z/aa/ca/ea/ga/fa/ka/na` 等长尾——工作清单 `artifacts/obfuscated-fields.json`（按频次排序，含样例代码）。取证方法与产出格式见 WORKSTATE.md 第 6 节。
