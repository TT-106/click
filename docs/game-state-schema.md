# game 单例状态结构（game-state-schema）

> 描述 `game` 单例（`src/engine/modules/runtime/game.js`）的完整状态结构：字段分组、所有权、生命周期、持久化与变异点。
> 符号与原版混淆名对照见 `docs/symbol-map.json`；已验证事实源见 `docs/reverse-engineering/facts.md`；存档管线细节见 `docs/persistence.md`。

## 0. 单例的创建与五类状态

`game` 是模块级导出变量（game.js:39），由 `initializeRuntimeGame()` 在模块初始化序列末尾一次性赋值（runtime/index.js:150，序列顺序 runtime/index.js:77-150）。整个引擎共享这一个对象；产品层唯一入口 `src/engine/adapter.js` 只通过命令与只读快照访问它（adapter.js:18-19）。

本文用五类标签区分每个字段的角色：

| 类别 | 含义 | 例子 |
|---|---|---|
| **Definition** | 静态内容定义，模块加载时构建，运行期只读 | `monsterDefinitions`、`achievementDefinitions`、宝箱设置 |
| **Instance** | 运行期创建的可变实体对象，活在某个注册表/数组里 | `Character`、`Dungeon`、`Achievement` 实例 |
| **RuntimeState** | 只存在于内存的会话状态，不入档 | `paused`、`camera`、`offlineProcessed` |
| **PersistentState** | 被 `game-save.js` 显式映射进存档 DTO 的状态 | `state.turnNumber`、`world.R`、`state.party.gold` |
| **DerivedViewModel** | 由其他状态推导、供显示层消费的值 | `state.dz`（FPS）、`camera.zt/At`、`adapter.snapshot()` |

注意：同一个对象可以同时承载 PersistentState 与 RuntimeState（如 `Character` 的等级入档、`behaviors` 队列不入档），下面按字段逐一标注。

## 1. 运行时标志（game.js:136-145）

| 字段 | 初始值 | 所有权（写者） | 生命周期 | 持久化 |
|---|---|---|---|---|
| `initialized` | `false` (136) | 写 `true`：world/initialization.js:187（开局）；写回：restore（game-save.js:46） | boot 建 `false`；首帧 `initializeWorld` 后 `true`（loop.js:98）；restore 覆盖 | ✅ `gameInitialized`（serialize 侧 game-save.js:705,1009；restore 侧 :46） |
| `partyCreated` | `false` (137) | 写 `true`：views/party-creation.js:93；写 `false`：resetRun（game.js:358） | resetRun/restore 重置 | ✅ `partyCreated`（game.js:709→:1013；game-save.js:49） |
| `gameWon` | `false` (138) | 写 `true`：characters/party.js:271（通关）；写 `false`：resetRun :359、resetContinuation :437、views/results.js:48,58（续关） | resetRun/续关/restore 重置 | ✅ `gameWon`（game.js:710→:1014；game-save.js:50） |
| `paused` | `false` (139) | views/navigation.js:24（暂停键）、adapter.js:69,133；写 `false`：resetRun :378、resetContinuation :439、initialization.js:186 | **RuntimeState，不入档**（每次载入从暂停态起步） | ❌ runtime-only |
| `worldActive` | `true` (140) | 写 `false`：characters/character.js:1154,1179（进入地牢/城堡楼层）；写 `true`：resetRun :379、resetContinuation :440、party.js:212、world/dungeons.js:221（撤出） | 决定序列化/恢复哪套空间（world vs level） | ✅ `worldActive`（game.js:708→:1012；game-save.js:48） |
| `processingOffline` | `false` (141) | 写 `true`：beginOfflineProgress（game.js:472）、后台分支（loop.js:42）；写 `false`：finishOfflineProgress（game.js:477，调用方 loop.js:50、party.js:272、views/results.js:137） | **RuntimeState**；自动保存期间被跳过（loop.js:87） | ❌ runtime-only |
| `lastActiveAt` | `Date.now()` (142) | restore 写入（game-save.js:51-52） | boot 取当前时刻；恢复时读旧档时间戳 | ⚠️ 间接持久化：存档键是 `gameTimestamp`，**写入侧永远是当下时刻**，恢复时读回变 `lastActiveAt`（facts.md #7；game-save.js:704,1008 ↔ :52） |
| `offlineDuration` | `0` (143) | restoreRuntimeState 计算（game.js:499）；后台分支累加（loop.js:42）；beginOfflineProgress 封顶（game.js:471）；finish 清零（:479） | **RuntimeState** | ❌ runtime-only |
| `offlineProcessed` | `0` (144) | beginOfflineProgress 清零（game.js:473）；离线循环每回合 `+= 250`（loop.js:45）；finish 清零（game.js:478） | 同上 | ❌ runtime-only |
| `renderEnabled` | `true` (145) | handleVisibility/bindVisibility（game.js:192-199，visibilitychange） | **RuntimeState** | ❌ runtime-only |

离线触发链：restore 末尾 `restoreRuntimeState()`（game-save.js:690 → game.js:482-504）在 `options.allowOfflineProgress && lastActiveAt` 时计算 `Date.now() - lastActiveAt`，超过 **120,000ms** 才 `beginOfflineProgress`（game.js:498-503）；封顶 `432E5ms（12h）+ offlineTimeBonus.t`（game.js:471；balance.js:167-170，`t` 初始 0）。

## 2. `game.state`（game.js:146-191）

| 字段 | 类别 | 所有权 / 变异点 | 生命周期 | 持久化 |
|---|---|---|---|---|
| `turnNumber` (147) | PersistentState | `++`：simulation/tick.js:31；清零：resetRun（game.js:352）、resetContinuation（:420）；restore 覆盖（game-save.js:56） | resetRun/restore 重置 | ✅ `turnNumber`（game.js:706→:1010） |
| `frameNumber` (148) | PersistentState | `++`：tick.js:238；restore 覆盖（game-save.js:57） | 同上（不随 resetRun 清零） | ✅ `frameNumber`（game.js:707→:1011） |
| `dz` (149) | DerivedViewModel | loop.js:84（每 60 帧算一次 FPS） | 持续覆盖 | ❌ runtime-only |
| `encounter` (150) | RuntimeState | `EncounterState`（combat/encounters.js，字段 `Ar/fw/ym/du`）；resetEncounter：game.js:353 | resetRun 清空 | ❌ runtime-only |
| `party` (151) | PersistentState（部分） | `PartyState`（characters/party.js:15-25）；金币 `gold`：party.js:59-65；restore：game-save.js:311-320 | resetRun 换新实例（game.js:354）；resetContinuation 只清导航字段（:422-435） | ✅ `party` 仅 `{gold,kills,experiencePoints}`（game.js:882-888；game-save.js:313-319）；导航/寻路字段（`Wb/ge/Lf/.../Nm/Om`）runtime-only |
| `adventurers` (152) | Instance 容器 + PersistentState | 建队：views/party-creation.js（≤5 人）；restore 重建：game-save.js:392-541（`push` @ :536）；清空：game.js:355 | resetRun 清空 | ✅ `adventurers[]`（serialize：game.js:928-932 → entities.js:52-137） |
| `leader` (153) | DerivedViewModel | game-save.js:539（恢复后取 `adventurers[0]`）；清 null：game.js:356 | 派生缓存 | ❌ runtime-only |
| `scrollCaster` (154) | DerivedViewModel | game-save.js:540（`chooseScrollCaster()`）；清 null：game.js:357 | 派生缓存 | ❌ runtime-only |
| `ae`（点数管理器，155-165） | Instance 容器 + PersistentState | 构造：`AdventurePointUpgrade` 列表 `tl`；写 `Dd`（可用点）/`An`（已花点）/`Qi`（按事件类型点数）/`pj`（计数）：progression/points.js:8-70 | 不随 resetRun(false) 清；`resetAdventurePoints`（game.js:374，仅硬重置）；restore：game-save.js:563-610 | ✅ `pointManagerState`（serialize：game.js:958-992；键 `spentAdventurePoints/pointsByType/pointUpgrades`） |
| `achievements` (166-180) | Instance 容器 + PersistentState | 构造：逐条 `achievementDefinitions` → `Achievement`（`jj`=全部、`Lt`=按 id、`ik`=未达成、`Ze`=达成未应用，achievements.js:11,35-43,179-185）；restore：game-save.js:611-656；重置：resetAchievements（game.js:375） | 硬重置（`resetRun(true)`）时重建 | ✅ `achievementManager.achievements[]`，每条仅 `{achievementId,obtained,applied}`（serialize：game.js:993-1004；restore：game-save.js:617-631，映射 `We→obtained`、`Of→applied`；facts.md #16） |
| `runStatistics` (181) | PersistentState | `RunStatistics`；写入口 StatisticsRecorder（`aa`）；resetRun 软重置 `jx()`（game.js:377）；restore：game-save.js:341-343 | 每周目重置 | ✅ `statistics`（serialize：game.js:889 → entities.js:219-252，30 个语义字段） |
| `lifetimeStatistics` (182) | PersistentState | `LifetimeStatistics`；restore：game-save.js:344-350（**旧档无 `totalStatistics` 时回退从 `statistics` 恢复**，`:346-349`） | 跨周目累计 | ✅ `totalStatistics`（game.js:890） |
| `aa` (183) | RuntimeState | `StatisticsRecorder`（progression/statistics.js:16-18），`bindStatistics(state)` 接线（game.js:363）；计帧 `fp()`：loop.js:46,94 | boot 接线一次，resetRun(true) 重接 | ❌ runtime-only（纯中转） |
| `victoryStatistics` (184-189) | PersistentState | 字段 `hn/jn/kn/Xm/mm/vn`（各队伍规模/单职业胜利数）、`qo/lq`（按职业 map）、`nm`（当前续关数）；restore：game-save.js:351-391；清零：game.js:364-373 | 硬重置清零 | ✅ `victoryStatistics`（serialize：game.js:892-927） |
| `victoryCount` (190) | PersistentState | 通关时 `++`（胜利流程）；清零仅硬重置（game.js:415-417）；restore（game-save.js:58）；职业解锁读它（adapter.js:39,58） | 硬重置清零 | ✅ `victoryCount`（game.js:711→:1015） |

## 3. 管理器 / 注册表（game.js:48-135 等）

以下对象在 boot 时构造一次；除标注外**容器本身 runtime-only，入档靠 game-save.js 的显式键映射**。

### 3.1 世界与空间
| 字段 | 构造 | 内部结构（关键混淆字段） | 持久化 |
|---|---|---|---|
| `world` (56) | `new WorldMap()`（world/terrain.js:366-372） | `R/L`=区块偏移列/行（初值 100/100，regions.js:285-286）、`he/ie`=世界中心、`q`=区块缓存、`ty` | ✅ `world`：`blockShiftCol↔R`、`blockShiftRow↔L`、`worldCenterX↔he`、`worldCenterY↔ie`（restore game-save.js:62-72；serialize :714-719）；`q/ty` 恢复时重建（:68-69,72） |
| `level` (85) | `new DungeonLevel()`（world/generation.js） | `Ki/Li`=楼层中心、`sc/rc`=尺寸、`G`、`Pa`=房间、`gd`=走廊、`sp`=楼层种子 | ✅ `level`（仅 `!worldActive` 时非 null）：`levelSeed↔sp` 等restore game-save.js:235-279；serialize :806-838。`worldActive` 时存 `null`（:807-808） |
| `regions` (61-69) | 内联对象 | `Eh`=16、`Rh/Sh`=原点 100/100、`sk`、`Mr` | ❌ 由 `initializeRegionsAndCastles()` 每次启动重建（game.js:349） |
| `castles` (70-82) | 内联对象 | `pd`=全部城堡、`Jg`=可攻击、`Dh`=已排程、`bm`=按 id、`Uj`=nextRequiredMonsterLevel、`GE`=排序器 | ✅ `castleManager`：`castleStates[]` 映射 `cb→conquered`、`Bj→dungeonsConquered`、`$b→castleRegionLocked`、`ye→attackScheduled`（restore game-save.js:151-199；serialize :761-781）；列表容器重建 |
| `currentDungeon` (86) / `currentCastle` (87) | `null` | 指向注册表内 Instance | ✅ `currentDungeon`（restore :136-150 / serialize :795-800）、`currentCastle`（restore :201-213 / serialize :801-805） |

### 3.2 地牢 / 农场 / 商店
| 字段 | 构造 | 内部结构 | 持久化 |
|---|---|---|---|
| `dungeons` (60) | `DungeonRegistry`（world/dungeons.js:62-77） | `dungeonList`=全部地牢、`dungeonRegistry`=按 id 索引、`discovered`/`attackable`/`cleared`/`farms`/`farmable`=五个视图列表（persistence adapter 的仪表盘键同名消费）、`discoveredDungeonCount`=已发现数（驱动农场造价 `scaleByLevel(count+1,…)`）、`pendingFarmKills`=农场待收击杀、`sortingEnabled`=自动排序开关（载入期间置 false，载入结束一次性批量排序；**并非"脏标记"**）、`compareByFarmCost`=按 `floorNumber(farmCost * dungeonCostBonus.currentValue)` 升序的比较器 | ✅ `dungeonManagerState`：`farmedKills↔pendingFarmKills`、`dungeonCostLevel↔discoveredDungeonCount`、`dungeonStates[]` 映射 `cb→conquered`、`isFarm→dungeonFarm`、`farmCost→dungeonFarmCost`、`hasSecondEntrance`/`mapSprite` 由 `dungeonType` 派生（restore game-save.js:73-135；serialize :731-757） |
| `farms` (83) | `FarmRegistry` | `farmList`=农场列表（元素 `farmColumn`/`farmRow`，序列化顺序即列表顺序，不可重排）、`farmsById`=按 dungeonId、`farmSpriteName`=农场地块装饰贴纸（"L2_Town01.PNG"） | ✅ `farms[]`：`farmCol↔farmColumn`、`farmRow↔farmRow`（restore game-save.js:220-234；serialize :782-794） |
| `shops` (84) | `ShopRegistry` | `shopList`=商店列表、`shopsById`=按 dungeonId、`collectedGold`=待收金币池、`shopSpriteNames`=9 个候选装饰贴纸（`shopSpriteNames[randomInt(length)]` 抽取，重复项是权重而非笔误，不可去重） | ✅ `shopManager.collectedGold`（restore :214-219；serialize :758-760） |

### 3.3 战斗 / 掉落 / 物品（全部 runtime-only，不入档）
- `monsters`(57)/`minions`(58)/`allies`(59)：`MonsterRegistry`/`MinionRegistry`/`AllyRegistry`；resetRun 清空（game.js:408-410），restore 末尾 `allies.reset()`（game-save.js:686）。
- `monsterCatalog` (95-104)：`n`=定义数组、`hd/fc`=最小/最大解锁等级、`en`=按等级的 `MonsterType` 缓存。✅ 持久化为 `monsterTypes`（`minUnlockedLevel↔hd`、`maxUnlockedLevel↔fc`、`monsterLevelStates[]`；restore 走 `MonsterSaveAdapter.Kw`，entities.js:322-333，击杀数经 `advanceMonsterTypeRank` 重放军衔，entities.js:196-217；serialize game.js:933-946）。
- `itemGenerator` (109)：`ItemGenerator`（loot/items.js：`OD` 命名器、`ND` 特效器、`ps`=槽位→类型缓存、`os`=按 id）；`initializeItemCatalog()` 重建（game.js:211）。Definition 类，不入档（物品实例内只存 `itemTypeId` 引用，entities.js:49）。
- `itemDrops`(110)/`goldDrops`(105)/`scrollDrops`(106)/`potionDrops`(107)/`treasure`(108)/`inventories`(111)：掉落与战利品注册表；`treasure.ve` 是**宝箱设置（Definition）**，`initializeWorld` 每次 boot 填充（game.js:218-348），`treasure.Mn` 是楼层宝箱 Instance，✅ 以 `treasureChestManager` 持久化（仅 `!worldActive`，restore game-save.js:280-310；serialize :839-858）。
- `scrolls`(112)/`potions`(113)：`ScrollInventory.at`（scrolls.js:198）/`PotionInventory.re`（potions.js:99）。✅ 分别持久化为 `scrollInventory[]`（`{scrollId,count,locked,upgradeCount}`，restore 经 `StatisticsSaveAdapter.ts`，game-save.js:555-562 + entities.js:334-342；serialize :859-870）与 `potionInventory[]`（`{potionId,active,activeStartTurn}`，restore :657-682；serialize :871-881）。
- `combatQueue`(123)/`scrollTargets`(114-116)/`effects`(120-122)/`floatingText`(127)：战斗队列、卷轴目标、视觉特效。RuntimeState，`clearCombatQueue`/`clearVisualEffects`/`clearScrollTargets` 在 resetRun 调用（game.js:391,396-397）。

### 3.4 调度 / 渲染 / 存档
| 字段 | 内容 | 持久化 |
|---|---|---|
| `loop` (88) | `GameLoop`（simulation/loop.js:20-31）：`frameDuration=1000/60`(:24)、`turnDuration=250`(:25)、`resourcesReady`、`lastTickAt/lastFrameAt`、fps 计数 | ❌ runtime-only |
| `view` (89) | `GameView`（views/navigation.js）：`Gh`/`panels`/`tabBar`/`um` | ❌ DerivedViewModel；restore 后由 loop.js:112-216 重建 UI |
| `camera` (52-54) | `At/zt/wk/vk`，loop.js:57-71 每帧由世界/楼层中心推导 | ❌ DerivedViewModel |
| `options` (90-92) | 7 个布尔开关，初值全 `true`；新档强制 `showFps=false`（adapter.js:29） | ✅ `gameOptions`：`showCombatText→infoTextVisible`、`showSpellEffects→spellEffectsVisible`、`showMapOverlay→mapOverlayVisible`、`allowOfflineProgress→offlineProcessingEnabled`、`allowBackgroundProgress→inactiveTabProcessingEnabled`、`depthSortSprites→spriteRenderOrderEnabled`、`showFps→fpsVisible`（restore game-save.js:321-340，缺省键默认 `true`；serialize game.js:721-730） |
| `saves` (129-135) | `saveKey="C2_V1_001"`(:130)、`lastSavedAt`(:131)、**`autoSaveInterval=3E4`（30 秒，:132）**、`statisticsAdapter`/`monsterAdapter`(:133-134) | `saveKey` ✅ 进 DTO 首键（game.js:703→:1007）；`lastSavedAt` ❌（自动保存节拍器，loop.js:87-92）；两个 adapter ❌（无状态恢复器） |
| `monsterSprites/terrainSprites/itemSprites/animations` (48-51) | SpriteSheet/动画目录，`cl()` 就绪探测（loop.js:219） | ❌ Definition + 资源缓存 |
| `lifecycle` (55) | `CharacterLifecycle`（simulation/characters.js） | ❌ runtime-only |
| `pathfinder`(93)/`decorations`(94)/`spellCaches`(124-126)/`unusedPlaceholder`(128) | 空壳/装饰生成器 | ❌ runtime-only |

**注意**：`game.saves.saveKey`（game.js:130）与宿主侧 `SAVE_KEY`（services/save-validation.js:3）是**两处独立定义**的同一常量，改存储键必须同步。

## 4. 生命周期方法（挂在 game 上，game.js:192-526）

| 方法 | 行号 | 语义 | 调用方 |
|---|---|---|---|
| `onLoad` | 200-203 | 绑定 visibility + 启动首帧 tick | adapter.js:22 |
| `initializeWorld` | 204-350 | 填怪物目录、物品目录、宝箱设置、区域与城堡（Definition 装配） | loop.js:98（首帧）、game-save.js:688（载入未初始化档） |
| `resetRun(a)` | 351-418 | 清回合数/ encounter / party / 世界 / 楼层 / 各注册表；`a=true`（硬重置）另清统计、点数、成就、`victoryCount` | restoreGameState（game-save.js:45）、`restartRun`(:516)、`resetGame`(:522) |
| `resetContinuation` | 419-468 | 续关：保留队伍与 `castles.Uj`/`dungeons.Mk` 进度，只清战斗/空间态 | views/results.js:60 |
| `beginOfflineProgress` / `finishOfflineProgress` | 469-481 | 离线结算开/关 | game.js:501、loop.js:42-50、party.js:272、results.js:137 |
| `restoreRuntimeState` | 482-504 | 重挂全局升级集合、重算角色技能，并触发离线判定 | restoreGameState 末尾（game-save.js:690） |
| `importSave` | 505-509 | `restoreGameState` 成功后**立即回写一份存档**（`saveProgress`），并按状态重放视图 | 服务层导入（services/saves.js:74）经 adapter.js:150-152 |
| `saveNow` | 510-512 | 手动保存 | 遗留信息面板（views/information.js:16） |
| `restartRun` | 513-520 | `resetRun(false)` + 删档 + 存空档 | results.js:50、information.js:25 |
| `resetGame` | 521-526 | `resetRun(true)` + 删档 + 存空档 | adapter.js:153-155（服务层 reset）、information.js:41 |

## 5. 存档键 ↔ 运行时字段映射（映射只在 game-save.js 成对出现）

facts.md #8：两侧映射必须同步改，存档 JSON 键不变。以 `world.blockShiftCol ↔ WorldMap.R` 为例：

```js
// 恢复侧 game-save.js:62-67
C = game.world;
C.R = s.blockShiftCol;   // s = d.world
C.L = A;                 // A = s.blockShiftRow

// 序列化侧 game-save.js:713-719
y = game.world;
u = {
  worldCenterX: y.he,
  worldCenterY: y.ie,
  blockShiftCol: y.R,
  blockShiftRow: y.L
};
```

同型成对映射（节选）：`turnNumber↔state.turnNumber`（:56 / :706/:1010）、`gameTimestamp↔lastActiveAt`（:52 / :704/:1008，**语义不对称**，见 docs/persistence.md §6）、`nextRequiredMonsterLevel↔castles.Uj`（:154 / :761）、`farmedKills↔dungeons.Sd`（:134 / :754）、`collectedGold↔shops.ni`（:219 / :759）、`spentAdventurePoints↔state.ae.An`（:568 / :959）、`obtained/applied↔achievements.jj[].We/Of`（:623-626 / :999-1003）、`farmCol/farmRow↔farms.nw[].kw/lw`（:227-228 / :790-791）。

因此：**重命名运行时混淆字段（如 `R/L`、`We/Of`、`An`）不改变存档格式**；但漏改 game-save.js 任何一侧会静默丢档/回退默认值（restore 侧大量 `x ? x : 默认值` 容错会掩盖漏配，game-save.js:56-58,317-319,510-521 等）。

## 6. 变异点速查（谁写 game 的关键状态）

- **simulation/tick.js**：`state.turnNumber++`(:31)、`state.frameNumber++`(:238)、农场起始回合(:810)。
- **simulation/loop.js**：离线分支与 `offlineDuration/offlineProcessed`(:42-51)、`state.dz`(:84)、自动保存(:87-92)、首帧初始化与恢复(:97-110)。
- **characters/party.js**：`party.gold/kills/experiencePoints`(:59-65)、`worldActive=true`(:212)、`gameWon=true` + 终止离线(:271-272)。
- **characters/character.js**：`worldActive=false`（进入楼层，:1154,1179）。
- **world/initialization.js**：开局 `initialized=true`(:187)。
- **views/***：`paused`（navigation.js:24）、`partyCreated`（party-creation.js:93）、`gameWon`（results.js:48,58）、重开/续关（results.js:50,60）。
- **persistence/game-save.js**：restore 覆盖上述几乎所有 PersistentState（:39-696）；`lastSavedAt`（:29,36）。
- **runtime/game.js 自身方法**：resetRun/resetContinuation/begin/finishOfflineProgress（:351-481）。
- **adapter.js（产品命令层）**：`paused`(:69,133)、`options.*`(:135-146)、reset(:153-155)。
