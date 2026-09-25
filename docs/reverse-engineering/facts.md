# 逆向事实库（已验证）

> 每条事实都有代码证据或运行时实验支持。上下文压缩后以本文件为语义事实源。

## RNG

1. **原版 RNG 是"JS 浮点变体 MT19937"**，不是 C 标准 MT19937。种子循环 `1812433253 * (prev ^ prev>>30) + i` 用 64 位浮点乘法、未做 int32 截断，精度丢失导致与标准序列不同（seed 5489 首值 = 1859732469，标准版为 3499211612）。
   - 证据：tests/unit/rng.test.mjs（黄金值 + 与 archive/original/c2.js 提取的 `ga` 逐值差分 6 种子 × 100,000 值）。
   - **警告**：任何"更标准"的 RNG 替换都会破坏回放/差分确定性。
2. 原符号：`ga`=SeededRandom（构造器）、`ma`=randomIntFrom、`k`=randomInt（**用全局 Math.random**）、`oa`=SimplexNoise。
3. 双随机源：SeededRandom（MT）+ Math.random（游戏内 `randomInt` 等）。测试 harness 用 LCG(1664525,1013904223) 替换 Math.random + 固定 Date.now 实现双端确定性。
4. 每回合固定 15 个模拟单位（`advanceSimulation(15)`/`pB(15)`）；帧假设 60Hz（FRAME_DURATION_MS = 1000/60）；回合时长 250ms（loop.turnDuration）。

## 存档格式（最高风险区）

5. 存档 = JSON → LZ-string 1.3.3 Base64（`src/vendor/lz-string-1.3.3.js`，与原发行包同版本）→ localStorage `C2_V1_001`（备份键 `C2_V1_001_backup`）。
6. **存档 JSON 的所有 4,477 个键（实测解码 fixture 全量扫描）都是语义化命名，无任何单字母键**。顶层 30 键（实测）：saveKey, gameTimestamp, gameInitialized, turnNumber, frameNumber, worldActive, partyCreated, gameWon, victoryCount, world, gameOptions, dungeonManagerState, shopManager, castleManager, farms, currentDungeon, currentCastle, level, treasureChestManager, scrollInventory, potionInventory, party, statistics, totalStatistics, victoryStatistics, adventurers, monsterTypes, settings, pointManagerState, achievementManager。
7. 序列化时 `gameTimestamp` 写入的是**当前时刻**（lB/serializeGame 内 `Date.now()`），恢复时读回旧值作为 `lastActiveAt`。
8. 运行时字段名（如 WorldMap.R/L）与存档键（blockShiftCol/Row）之间是显式映射（game-save.js 恢复/序列化两处成对出现）——重命名运行时字段必须同步这两处，存档 JSON 不变。

## 离线/后台结算

9. 触发：restore 末尾 `allowOfflineProgress && lastActiveAt && elapsed > 120000ms` → `beginOfflineProgress`（上限 `432e5 + offlineTimeBonus.t` = 12 小时 + 加成）。
10. **结算由帧循环驱动**：`loop.tick()` 在 `processingOffline` 时每帧最多 200 回合（每回合 `advanceSimulation(15)`、`offlineProcessed += 250`），完成时 `finishOfflineProgress`。直连 `advanceSimulation` 会**绕过**离线结算——harness 必须用 `advanceOffline()`（每帧 +2000ms 虚拟时钟，因为分支条件为 `1E3 < 帧差`）。
11. 后台标签页（`allowBackgroundProgress` + 帧差 > 1s）走同一离线分支并累加 `offlineDuration`。
12. 差分验证：offline-1h/8h 场景两端金币/击杀实际增长且逐字段相等；offline-disabled 无增长。

## 内容定义结构（重命名高风险点）

13. **角色类定义（adventurerClasses、bossClass、castle guardians、minions）共用形状**：`tb: [{slot, statType}]`（装备槽→属性类型映射）→ Character 构造器读 `.tb[].slot`（Z 槽位列表）与 `.tb[].statType`（KD slot→statType 映射）。**数据定义分布在多个文件**：classes.js、guardians.js、minions.js——重命名数据键时必须全库 grep，漏一个文件会在后期内容（城堡守卫/随从）触发 `generateItem(slot=undefined)` 崩溃。
14. `Character.Z`（槽位列表）→ 装备表；`Character.KD`（slot→statType）→ `generateItem` 的属性成长与特效判定（`1 === statType` 武器特效）。
15. 物品类型注册：equipment.js `registerItemType(gen, def, png)`，按 `def.Z`（槽位列表）建 `ItemGenerator.ps[slot]` 缓存；槽位值如 "20"/"80"/"230"。
16. 成就定义 `{id, name, requirementType, requiredCount, Hb(职业), pointEventTypeId}`；存档只存 `{achievementId, obtained, applied}`。点数事件定义 `h`=pointEventTypeId → 存档键 `pointEventType`。

## 运行时入口

17. 原版全局：`window.Game`（=w）、`Game.Hr`=GameLoop（sB 实例）、`Game.Hr.Hr()`=帧 tick、`window.lB()`=序列化、`window.pB(15)`=单回合步进、`game.hE(text)`=导入存档、`game.Em`=initialized、`game.ig`=processingOffline、`game.jf/Vj`=offlineDuration/offlineProcessed。
18. 重构版入口：`src/engine/adapter.js`（唯一产品入口，命令校验 + 只读快照）；内部接口 `src/engine/internal-api.js`。
19. 存档兼容契约：`tests/fixtures/original.c2save` + parity（0/1/99/900 回合）+ 场景矩阵（9 场景）+ codec 单测。

## 已修复的回归（方法论证据）

20. 差分场景矩阵曾在重命名波次中抓住 900 回合 parity 无法覆盖的回归：guardians.js/minions.js 的 `r:`/`s:` 数据键漏改 → 城堡守卫生成 `generateItem(undefined)` 崩溃。教训：**数据字面量键重命名必须全库 grep（含所有 content/*.js）**。
