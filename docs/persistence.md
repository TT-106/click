# 存档管线（persistence）

> 完整描述 Clickpocalypse II 存档的编码链、DTO 结构、触发时机、时间戳语义与兼容性保障。
> 事实源：`docs/reverse-engineering/facts.md` #5-#8、#19；状态字段语义见 `docs/game-state-schema.md`。

## 1. 编码链与解码链

### 1.1 编码（保存）

```
game 内存状态
  → createSaveState(game.saves)        # 组装语义化 DTO（纯 JSON 对象）
      src/engine/modules/persistence/game-save.js:700-1049
  → JSON.stringify                      # game-save.js:698
  → saveCodec.compress                  # LZ-string 1.3.3 compressToBase64
      src/engine/save-codec.js:4 → src/vendor/lz-string-1.3.3.js（文件头注明 "version 1.3.3"，:9）
  → persistence.write(base64 字符串)    # 宿主注入端口
      src/engine/modules/persistence/game-save.js:32-38（saveProgress）
  → localStorage['C2_V1_001']           # 宿主实现 src/services/saves.js:22-31
      （写入前把旧值挪到 'C2_V1_001_backup'，仅当新旧不同，saves.js:25-27）
```

入口三个：
- `saveProgress(a)`（game-save.js:32-38）：写存储并刷新 `saves.lastSavedAt`。自动/手动保存都走它。
- `serializeGame(a)`（game-save.js:697-699）：只产出 Base64 字符串不落盘。首帧初始化备份用（loop.js:102），内部接口 `runtime.serialize()`（internal-api.js:15）供服务层导出。
- `game.importSave` 成功后回写（game.js:508，内部调 `saveProgress`）。

### 1.2 解码（载入）

引擎侧（信任链的终点，**自身不做防御性校验**）：

```
Base64 字符串
  → saveCodec.decompress → JSON.parse     # restoreGameState 前置，game-save.js:41-43
  → game.resetRun(true)（先清场）          # game-save.js:45
  → 逐键恢复（game-save.js:46-686）
  → refreshWorldBlocks / refreshPartyLevels / refreshUnspentSkillFlags / allies.reset  # :683-686
  → game.restoreRuntimeState()（升级重挂 + 离线判定）                                    # :690
```

宿主侧（产品导入/启动的唯一防御层）：

```
文本 → decodeSave（src/services/save-validation.js:42-52）
  trim → 长度 ≤ 2MiB（:43）→ Base64 字符集白名单正则（:45）
  → decompress → 解压结果 ≤ 8MiB（:48）→ JSON.parse（:50）→ validateSave（:9-40）
在 Web Worker 中执行（src/services/save-worker.js:1-5，超时 5000ms，src/services/saves.js:8）
```

`validateSave` 检查：`saveKey === 'C2_V1_001'` 且 `gameInitialized === true`（:10）；11 个必须为对象的顶层键（:11-13）；10 个必须为数组（≤20000 元素，:14-15）；`adventurers ≤ 5` 且 `partyCreated` 与队伍非空一致（:17）；资源/时间/回合数为有限数（:18-19）；`!worldActive` 时必须带 `level`（:20）；每个角色 `characterClass ∈ [0..4,6..11]`、名字 ≤200 字符、必备组件存在、等级 ≥1（:21-26）；全树拒绝 `<>` 字符、超长字符串、非有限数、`__proto__/constructor/prototype` 键、节点数 >50 万、深度 >40（:28-38，防遗留面板 innerHTML 注入与原型污染）。

### 1.3 存储端口（依赖倒置）

引擎不直接碰 localStorage：`src/engine/modules/runtime/storage-port.js:2-3` 定义 `{read, write, remove}` 可替换端口（默认全空实现），`configurePersistence`（:3）由产品启动时注入（app.js:124 → adapter.js:20-21 → internal-api.js:20）。产品实现是 `createSaveService(...).persistence`（saves.js:45-51）：`read` 返回启动时校验过的 `bootSave`；`write` 带 backup 语义；**`remove` 是空操作**——引擎 `deleteStoredSave`（game-save.js:26-31）调用它不会真删键，重置流程实际是"覆盖写一份未初始化空档"（见 §4.5）。

## 2. 存档 DTO 结构

### 2.1 顶层键清单

实测解码 fixture（`tests/fixtures/original.c2save`）得**顶层 30 键**、全树 4,477 键，与 serialize 构造对象（game-save.js:1006-1039）完全一致。**注意：facts.md 第 6 条写"顶层 29 键"为笔误——其罗列的名字本身有 30 个**，本表以代码与 fixture 实测为准：

| # | 键 | 写入源（serialize，game-save.js 行号） | 恢复目标（restore 行号） |
|---|---|---|---|
| 1 | `saveKey` | `saves.saveKey`（:703→:1007） | 仅作格式标识（validation:10 校验） |
| 2 | `gameTimestamp` | `Date.now()`（:704→:1008） | `game.lastActiveAt`（:51-52） |
| 3 | `gameInitialized` | `game.initialized`（:705/:1009） | `game.initialized`（:46） |
| 4 | `turnNumber` | `state.turnNumber`（:706/:1010） | `state.turnNumber`（:56） |
| 5 | `frameNumber` | `state.frameNumber`（:707/:1011） | `state.frameNumber`（:57） |
| 6 | `worldActive` | （:708/:1012） | （:48） |
| 7 | `partyCreated` | （:709/:1013） | （:49） |
| 8 | `gameWon` | （:710/:1014） | （:50） |
| 9 | `victoryCount` | （:711/:1015） | （:58） |
| 10 | `world` | `{worldCenterX/Y, blockShiftCol/Row}`（:714-719） | `world.R/L/he/ie` + 重建区块（:62-72） |
| 11 | `gameOptions` | 7 开关（:721-730） | `game.options`（:321-340） |
| 12 | `dungeonManagerState` | `{farmedKills, dungeonCostLevel, dungeonStates[]}`（:731-757） | 地牢注册表（:73-135） |
| 13 | `shopManager` | `{collectedGold}`（:758-760） | `shops.ni`（:214-219） |
| 14 | `castleManager` | `{nextRequiredMonsterLevel, castleStates[]}`（:761-781） | 城堡注册表（:151-199） |
| 15 | `farms` | `[{dungeonId, farmCol, farmRow}]`（:782-794） | `farms.nw`（:220-234） |
| 16 | `currentDungeon` | `{dungeonId, currentLevelIndex}` 或 null（:795-800） | （:136-150） |
| 17 | `currentCastle` | `{castleId}` 或 null（:801-805） | （:201-213） |
| 18 | `level` | 楼层 DTO 或 null（仅 `!worldActive`，:806-838） | 重新生成楼层再覆盖可见性（:235-279） |
| 19 | `treasureChestManager` | 宝箱数组或 null（:839-858） | 重建 `TreasureChest`（:280-310） |
| 20 | `scrollInventory` | `[{scrollId, count, locked, upgradeCount}]`（:859-870） | 经 `statisticsAdapter.ts`（:555-562；entities.js:334-342） |
| 21 | `potionInventory` | `[{potionId, active, activeStartTurn}]`（:871-881） | 重建 `Potion`（:657-682） |
| 22 | `party` | `{gold, kills, experiencePoints}`（:882-888） | （:311-320） |
| 23 | `statistics` | 周目统计，30 字段（:889 → entities.js:219-252） | `runStatistics`（:341-343） |
| 24 | `totalStatistics` | 累计统计，同形状（:890） | `lifetimeStatistics`（:344-350；缺失时从 `statistics` 回退） |
| 25 | `victoryStatistics` | 9 标量 + `classVictories`/`soloClassVictories` map（:892-927） | （:351-391） |
| 26 | `adventurers` | `serializeCharacter` 数组（:928-932 → entities.js:52-137） | 重建 `Character`（:392-541） |
| 27 | `monsterTypes` | `{monsterLevelStates[], minUnlockedLevel, maxUnlockedLevel}`（:933-946） | 经 `monsterAdapter.Kw`（:542；entities.js:322-333） |
| 28 | `settings` | `{upgrades: {升级 c 键: 等级}}`（:947-956） | `globalUpgradesById[].md`（:543-554） |
| 29 | `pointManagerState` | `{spentAdventurePoints, pointsByType[], pointUpgrades[]}`（:958-992） | `state.ae`（:563-610） |
| 30 | `achievementManager` | `{achievements: [{achievementId, obtained, applied}]}`（:993-1004,1036-1038） | 成就实例 `We/Of`（:611-656） |

未初始化档（游戏尚未开局即保存）退化为 **4 键**：`{saveKey, gameInitialized:false, partyCreated:false, gameWon:false}`（game-save.js:1040-1047）。

### 2.2 嵌套关键结构

**`adventurers[]`（entities.js:120-136）**——每元素：

| 键 | 内容 | 恢复要点（game-save.js:392-541） |
|---|---|---|
| `adventurerName/characterClass/characterType/spriteName` | 身份 | 按 `classesById` 重建（:410-411）；`spriteName` 查 `monsterSprites`（:414） |
| `characteristicsComponent` | 等级/血/精神/击杀/六维组件/眩晕/伤害统计（entities.js:59-74） | 等级重算经验曲线与法力耗（:510-514）；组件经 `restoreStatComponent`（:522-527）；基础冷却/回复固定 12/2/3（:528-530） |
| `positionComponent` | `{levelX, levelY, worldX, worldY, roomId, hallwayId, floorPositionIndex}`（entities.js:79-87） | 楼层坐标 `setVector`，房间/走廊按 id 反查（:419-443） |
| `spells` | `[{spellName}]`（entities.js:88-97） | 按职业定义 `kc` 表反查后 `learnSpell`（:446-476） |
| `inventory` / `equippedItemCollection` | `serializeItem` 数组（entities.js:7-31，仅存 `itemTypeId` 引用 + 实例属性） | `restoreItem` 按 `itemTypeId` 查 `itemGenerator.os`（entities.js:32-51）后 `addInventoryItem`/`equipItem`（:477-494） |
| `skillPoints/initialSpellSkillPoint` | 数值 | （:416-418） |
| `upgrades1..4` | `{升级 c 键: bool}`（entities.js:138-147） | `restoreUpgradeFlags` 按序号对位（:531-534） |

其余：`dungeonManagerState.dungeonStates[]` = `{dungeonId, discovered, cleared, clearedTurn, dungeonFarm, farmStartTurn, dungeonFarmCost, dungeonType, levelCount, conquered}`（:739-750）；`level` = `{levelCenterX/Y, levelSeed, roomVisibility[], hallways:[{visible, doorAOpen, doorBOpen}]}`（:831-837）——**楼层地形不存方块，只存 `levelSeed` 重新生成再回放可见性/门态**（:249-278）；`pointManagerState.pointsByType[]` = `{pointEventType, points, count}`（:970-974）；`pointUpgrades[]` = `{upgradeId, upgradePurchased}`（:981-984）；`monsterTypes.monsterLevelStates[]` = `{level, monsterTypes:[{name, sprite, kills}]}`（entities.js:178-195）。

## 3. 保存触发时机（产品层，src/app.js + src/services/saves.js）

| 触发 | 路径 | 证据 |
|---|---|---|
| **自动保存** | 帧循环内、`!processingOffline` 时检查 `now - saves.lastSavedAt > saves.autoSaveInterval` → `saveProgress` | loop.js:87-92；**周期 `autoSaveInterval = 3E4`（30,000ms = 30 秒）**，game.js:132；`lastSavedAt` 仅由 `saveProgress`/`deleteStoredSave` 刷新（game-save.js:36,29） |
| 手动按钮 | `#save-now` → `saves.save()`；设置页 `#settings-save` 同 | app.js:88,109 |
| 快捷键 | Ctrl/Cmd+S → `saves.save()` | app.js:110-111 |
| 页面隐藏/关闭 | `pagehide` 与 `visibilitychange(hidden)` → `saves.save(true)`（静默） | app.js:115-116 |
| 建队完成/导入成功后 | 各流程回写 | app.js:127、game.js:508 |

服务层 `saves.save()`（saves.js:52-58）的前置：未被 `blocked`（原档待恢复时拒绝覆盖，保护磁盘原档）、`engine.snapshot().ready`（引擎已初始化）。写入统一走 `write()`（saves.js:22-31）：localStorage 异常时提示"先导出"，不抛出。

**导出**（saves.js:59-68）：`export()` 序列化当前内存态；`export(true)` 直接读 localStorage 原文。文件名 `clickpocalypse[-original]-YYYY-MM-DD.c2save`（:65），Blob 下载。按钮绑定 app.js:89-90。

**导入**（saves.js:69-84 + app.js:91-102）：
1. 文件 ≤2MiB 前置检查（app.js:94），文本进 `#save-code`；
2. `saves.import(text)`：worker 内 `decodeSave` 校验（5 秒超时，saves.js:8）；
3. 置 `transaction = true`（阻塞自动写，saves.js:22-23），先快照当前进度 `previous = engine.serialize()`；
4. `engine.importSave(text.trim())` → `game.importSave`（game.js:505-509）→ `restoreGameState`；失败则回滚导入 `previous` 并恢复暂停态（saves.js:75-79）；
5. 成功后 `write(新档, previous)`——**被替换的旧进度自动存入 backup 键**（saves.js:82,25-27）。

**重置**（saves.js:90-97 + app.js:106-107）：`#reset-game` 要求输入框精确键入"重新开始"（app.js:106）→ `saves.reset()` → `engine.reset()`（adapter.js:153-155）→ `game.resetGame()`（game.js:521-526）＝ `resetRun(true)` + `deleteStoredSave` + `saveProgress`（覆盖写 4 键空档，旧档先进 backup）+ 视图重置 → `location.reload()`（saves.js:94）。另有轻度重开 `restartRun`（保留跨周目统计，game.js:513-520，results.js:50 / information.js:25）。

**启动恢复**（app.js:119-133 + loop.js:97-110）：
1. `saves.prepare()`：读 `C2_V1_001`，worker 校验；失败 → `blocked = true`，**原档留在磁盘不动**，提示导出或恢复备份（saves.js:33-41）；
2. `engine.boot(saves.persistence)` → 首帧资源就绪后：`initializeWorld` → 先序列化一份空白世界 `initialSave` → 读存储尝试 `restoreGameState`；**失败则回退到空白世界并继续用 `initialSave`，保证导出入口可用**，同时 `onLoadError` 置 blocked（loop.js:100-109，saves.js:47-50）。

## 4. 时间戳语义（facts.md #7）

- **写入侧**：`createSaveState` 内 `d = Date.now()`（game-save.js:704），作为 `gameTimestamp`（:1008）。即**存档时间戳永远是"保存那一刻"，不是"最后活跃那一刻"**——自动保存 30 秒一次意味着它近似 lastActive。
- **恢复侧**：`f = d.gameTimestamp; game.lastActiveAt = f ? f : Date.now()`（game-save.js:51-52）——旧值被读回为 `lastActiveAt`。
- **离线推导**：`restoreRuntimeState`（restore 末尾，game-save.js:690 → game.js:482-504）计算 `offlineDuration = Date.now() - lastActiveAt`；`> 12E4ms（120 秒）`且 `allowOfflineProgress` 时 `beginOfflineProgress`（game.js:498-503）。离线上限 `min(offlineDuration, 432E5 + offlineTimeBonus.t)` = **12 小时 + 升级加成**（game.js:471；balance.js:167-170，`t` 初始 0）。
- **结算驱动**：离线由帧循环推进——每帧最多 200 回合，每回合 `advanceSimulation(15)` 且 `offlineProcessed += 250`（loop.js:43-48，`turnDuration=250` loop.js:25），`offlineProcessed ≥ offlineDuration` 时 `finishOfflineProgress`（loop.js:49-51）。后台标签页（帧差 >1E3ms 且 `allowBackgroundProgress`）走同一分支累加（loop.js:42）。
- **测试约束**：场景矩阵显式断言"离线结算后序列化时间戳必须已前移（> 固定时钟）"（scripts/test-scenarios.mjs 离线分支 `after.timestamp > HARNESS_FIXED_NOW`）。

## 5. 兼容性保障（facts.md #19）

| 层 | 内容 | 位置 |
|---|---|---|
| 原版 fixture | 真实原版存档（2026-09-25 采集，含进行中冒险），解码后 30 顶层键 / 4,477 全键全语义命名 | `tests/fixtures/original.c2save`；facts.md #6 |
| codec 单测 | 往返恒等 + **能解原版 fixture 且键齐全**（saveKey/gameTimestamp/... ） | `tests/unit/save-codec.test.mjs:7-23`；`npm test`（package.json:14） |
| parity 差分 | 同一 fixture 驱动原版（archive/original/c2.js，`?original` harness）与重构引擎，固定 LCG + 固定 `Date.now`，推进 **0/1/99/900 回合**后全量快照 `deepEqual` | `scripts/test-parity.mjs:1-36`；`npm run test:parity` |
| 场景矩阵 | **9 个变异场景**两端对拍：`long-run-9000`、`offline-1h`、`offline-8h`、`offline-disabled`、`potions-active`、`potions-inactive-auto`、`scrolls-stocked`、`gold-windfall`、`late-horizon`（+100 万回合），每场景多步推进并校验场景确实生效 | `scripts/test-scenarios.mjs:14-73`；变异工具 `tests/scenarios/save-mutations.mjs` |
| 服务层校验 | 导入/启动的 schema + 安全校验（见 §1.2），worker 隔离 + 超时 | `src/services/save-validation.js`、`save-worker.js`、saves.js:8 |
| E2E | 含导出导入/非法存档/刷新恢复等浏览器级冒烟 | `scripts/test-browser.mjs`（WORKSTATE §3：2026-09-26 全过） |

## 6. 关键数值速查（均出自代码）

| 数值 | 值 | 证据 |
|---|---|---|
| 主存档键 | `C2_V1_001` | save-validation.js:3；game.js:130 |
| 备份键 | `C2_V1_001_backup` | saves.js:21 |
| 编码 | LZ-string **1.3.3** Base64 | vendor 文件头 :9；save-codec.js:3-5 |
| 导入文本上限 | `MAX_SAVE_BYTES = 2 * 1024 * 1024`（2 MiB） | save-validation.js:4；saves.js:5；app.js:94 |
| 解压后 JSON 上限 | 8 MiB | save-validation.js:48 |
| 自动保存周期 | `3E4` ms = 30 秒 | game.js:132（检查逻辑 loop.js:87-92） |
| worker 校验超时 | 5000 ms | saves.js:8 |
| 离线触发阈值 | `12E4` ms = 120 秒 | game.js:500 |
| 离线时长上限 | `432E5` ms = 12 小时 + `offlineTimeBonus.t`（初始 0） | game.js:471；balance.js:167-170 |
| 后台分支阈值 | 帧差 > `1E3` ms | loop.js:42 |
| 离线每帧回合上限 | 200 回合 × 250ms | loop.js:43-45 |
| 回合/帧时长 | 250ms / `1000/60` ms | loop.js:25,24 |
| 冒险者上限 | 5 | save-validation.js:17 |
| 顶层 DTO 键数 | **30**（facts.md #6 的"29"为笔误）；未初始化档 4 键 | 实测 fixture；game-save.js:1006-1047 |
| 全树键数 | 4,477 | facts.md #6（本次复测一致） |
| 统计 DTO 字段数 | 30 | entities.js:220-251 |
