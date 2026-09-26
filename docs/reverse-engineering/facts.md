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
19. 存档兼容契约：`tests/fixtures/original.c2save` + parity（0/1/99/900 回合）+ 场景矩阵（当前 37 场景）+ codec 单测 + `autosave-payload` 场景（比对真正落盘的原文）。

## 已修复的回归（方法论证据）

20. 差分场景矩阵曾在重命名波次中抓住 900 回合 parity 无法覆盖的回归：guardians.js/minions.js 的 `r:`/`s:` 数据键漏改 → 城堡守卫生成 `generateItem(undefined)` 崩溃。教训：**数据字面量键重命名必须全库 grep（含所有 content/*.js）**。

## 自动保存与渲染的可观察量（2026-09-26 实测）

21. 原版自动保存间隔是 **300,000 ms**（`c2.js:44345` `this.UC = 3E5`，运行时读到的 `Game.pg` 即保存管理器为 `{qs: lastSavedAt, UC: 300000}`）。重构版曾写成 `3E4`，等于把自动保存频率放大 10 倍——`autosave-payload` 场景把它抓了出来：清掉 localStorage 后跑 1300 帧（325s 模拟时间），原版与重构版必须各自写入且解码后内容一致；把常量改回 3E4 该场景立刻失败（已实测该反向验证）。
22. 渲染层可以逐像素对比，不需要截图基线：`harness.canvasInk()` 直接读主画布 `getImageData`，返回不透明像素数、非背景像素数与 FNV-1a 逐像素指纹；两端在同一固定时钟下指纹相同（例：`1853346327`，非背景 203,763）。该检查有牙齿——把 `rendering/scene.js:341` 的 `drawImage` 目标横移 2 像素，指纹即分叉、场景失败。
23. `loop.js` 把 `view.render()` 的异常吞成 `console.log("Caught error. …")`，所以只听 `pageerror` 的差分矩阵看不见渲染崩溃；场景 runner 现在同时监听 console 并过滤 harness 页自发的 `/favicon.ico` 404（浏览器行为，非引擎行为）。

## 改名的危险形状（第二次事故后固化）

24. **数据表键与读取端分文件**是逐文件改名最危险的形状：稀有度表的 `Vp/pp/jp` 声明在 `content/balance.js:447-467`，读取端只在 `loot/items.js:158/167/170`。第一次改名只喂了读取端，键被留在原处 → `tier.statMultiplier` 为 undefined → 物品属性 NaN → 99 回合后 `characterHealth` 109 变 99，被 parity 与场景矩阵同时拦下。`rename-field.mjs` 因此新增写盘后全库回扫，列出未被本次文件表覆盖的同名残留。
25. 物品运行时字段与存档 DTO 键现已同词：`restoreItem` 的入参名本身就是 `itemName/itemRarity/itemLevel/itemGold/itemValue/itemCharacteristic/itemEffect`（`entities.js:33-42`），把运行时字段改成同名后，"运行时字段 ↔ 存档键必须成对同步"的心智负担在该类字段上不复存在。

## 恢复期错映射的实例与检测手段的边界（2026-09-26）

26. `Equipment.Qk`（重构版 `movement.js:195-205`）的判断条件曾写成 `1 === a.statType`，而原版是 `1 === a.s`（`c2.js:21419`），Item 上从未有 `statType` 字段——恢复时把 Item 的 `s` 在构造点映射成 `characteristic`、在这个判断点映射成了 `statType`，于是分支恒假、`fz`（携带武器特效的伤害装备）永不记录，攻击时的武器特效视觉静默消失。已按 `c2.js:21419` 改回 `1 === a.characteristic`。
27. **该缺陷是差分看不见的**：`fz` 只影响 `VisualEffect` 瞬时视觉，不入存档，34 场景与 parity 全程绿。它是公式文档逐行核对时被发现的（子智能体报告"读了一个不存在的字段"），不是测试发现的。
28. `scripts/find-dead-reads.mjs`（`npm run audit:dead-reads`）能抓的是"全库任何地方都没写过的属性名"；它抓不到 #26 这类错映射，因为 `statType` 作为**别的类**（卷轴定义）的字段确实存在。当前全库 12,904 个读取点里剩 10 个未定义名，逐个查明为宿主 API（`event.key`/`MediaQueryList.matches`/`keyCode`）、JSDoc 里的 `import(...).Character` 与两个**原版就有的遗留存档键回退**（`entities.js:254 a.totalPlayedMillis`、`:284 a.weaponsRacksLooted`，原版同一位置同样只读不写：`c2.js:28681/28711`）。也就是说：本工具是粗筛，不是类型检查，语义正确性仍要靠逐行对照源码。

## UI 独占入口的取证纠错（2026-09-26）

29. `farmAndDungeonUpgrades` 的名称会误导测试设计：`content/balance.js:497` 的两个实例是 `AutoPurchaseDungeonUpgrade`（`upgrades.js:1020-1028` 记录农场收获并增加击杀）和 `CollectFarmUpgrade`（`:1253-1260` 收集商店金币），**都不是购买农场**。购买入口是 `PurchaseCastleUpgrade`（`balance.js:494`）与 `views/dungeons.js:68` 直接持有的 `PurchaseDungeonUpgrade`；原版分别在 `c2.js:23399/27759` 构造对应对象。`PurchaseDungeonUpgrade` 虽不在全局升级集合，仍被地牢行视图使用，不能据全局 import 图误判为死实现。
