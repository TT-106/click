# glm5.3flash 实施提示词：深化胜利后的继续征程

> **历史档案，停止执行和更新。** 下文的“当前/最新/下一步”、数字、权限和命令只适用于原批次；不能用于当前开发或表示本轮验证。当前入口是 [文档索引](../../README.md)。


> **历史任务书，已执行完（R42，2026-10-03）。** 胜利后继续征程的生命周期改造已按本任务书交付，
> 现状以 `docs/WORKSTATE.md` 顶部与 `docs/README.md` 为准；下文仅供追溯，不要再当作新任务执行。
> 本任务由用户从架构审查候选中明确选定。工作目录：`D:\下载\clickpocalypse2-main`；系统：Windows / PowerShell；全程中文。
> 任务性质：行为保持的架构改造。执行本提示词意味着实施代码、验证、同步必要文档并交付可审查结果。
> 本文由前一位 agent 于 2026-10-03 核实当前源码后编写；它没有实施下面的代码变更。开工时重新检查 HEAD 和工作树。

## 1. 目标与完成标准

玩家在胜利面板点击“继续 - 用你当前的队伍征服新的城堡.”后，恢复版应保持原版的队伍、成长、世界复位、随机结果、事件、界面与存档行为。

本轮集中解决一个架构问题：继续按钮仍在视图里编排 8 个底层操作和一个事件。把完整业务顺序收进现有的当前实例生命周期 module，使视图只跨一次 seam 表达玩家选择。

采用以下范围明确的方案：
- 在 `src/engine/modules/runtime/game.js` 的现有生命周期实现中增加同步的 `game.continueRun()`。
- `GameOverView` 的继续按钮只调用注入的 `continueRun`。
- `simulation/loop.js` 只装配这个意图级操作。
- `resetContinuation()` 保持现有底层语义。
- 用真实继续后的游戏状态、真实落盘结果和原版差分验收，而非仅用 spy 顺序验收。

深度（depth）的衡量：调用者的 interface 不再要求知道复位、计数、放置、解锁、盟友重建、视图刷新与保存的顺序。locality 来自这些知识归属现有生命周期 module；leverage 来自显示代码与玩法流程可以分别修改和验证。文件数增加、game 导入数降低或 SCC 变小都不是本轮的必达指标。

完成需同时满足：真实按钮接入；原顺序和状态保持；共享依赖从 17 项收至 11 项；新增验收能被针对性破坏触发；最终工作树通过规定检查。只移动代码而没有行为证据不算完成。

## 2. 开工快照与证据等级

编写时：
- 分支 `main`；HEAD `2ba7b230d9c4106345c547da2ced2e48cd954e34`。
- 前一轮在同一源码工作树实跑：架构审计 exit 0；48/48 现有单元测试通过；初始化顺序守卫 exit 0。
- 审计：95 个 src JS、79 个引擎 module、546 条导入边、19 个 game 直接导入者、最大 SCC 39、单字母绑定 0、白名单外混淆短名 2。
- 初始化守卫核对 74 个 initialize 与 11 个 bind；架构审计识别 40 条初始化期跨模块依赖。
- 前一轮没有复跑完整浏览器差分、soak、性能与构建门禁。这些数字不能写成“当前全部门禁全绿”。
- 单元测试最初因受限沙箱 `spawn EPERM` 未启动；获准在沙箱外重跑后 48/48 通过。环境阻断与代码失败必须分开报告。

下列改动在本轮提示词之前已存在，逐一保留：
```text
 M PERFORMANCE_REPORT.md
 M docs/DEVELOPMENT.md
 M docs/history/tasks/NEXT-OVERNIGHT-LONG-RUN-PROMPT.md
 M docs/history/tasks/OVERNIGHT-DEVELOPMENT-ROADMAP-PROMPT.md
 M docs/REMAINING-WORK.md
 M docs/WORKSTATE.md
 M docs/m13-exhaustion-audit.md
 M docs/performance-after.md
 M docs/performance-baseline.md
?? docs/README.md
```

本文件也是交接产物，不能当作你已完成实施的证据。开工后记录你实际看到的状态；若 HEAD 漂移，按当前代码重新定位下面的语义，不回退仓库。

保护对象的 SHA256（编写时）：
- `tests/fixtures/original.c2save`：`9C9A8FA34D32A0B3EB027E7311B7261337BDEC312AA92FFA77589FC667B9A0E8`
- `archive/original/c2.js`：`B9DD4F566645CDC252A5340AD1D89262A6A7C2E1D2CBC5D4DB36D89113222153`

## 3. 先读这些证据

按顺序阅读，并在实施报告写出读到的当前行号：
1. `CONTEXT.md` 和 `docs/adr/0001-retain-original-as-test-oracle.md`。
2. `docs/REMAINING-WORK.md` §1 红线；`docs/README.md` 的当前态/历史快照区分。
3. `src/engine/modules/views/results.js:19–49, 81–106`：共享依赖检查、重生与继续按钮。
4. `src/engine/modules/simulation/loop.js:165–186`：真实依赖装配。
5. `src/engine/modules/runtime/game.js:433–481`：继续时底层复位；`:519–539`：导入、重生与完全重置，帮助识别本轮未涉及的路径。
6. `src/engine/modules/world/terrain.js:432–444`：放置队伍；`world/regions.js:215–225`：起始区域解锁。
7. `combat/encounters.js:284–293`：盟友重建；`views/navigation.js:123–128`：视图重置；`persistence/game-save.js:32–36`：真实保存。
8. `tests/unit/results-decouple.test.mjs`、`tests/engine-harness.js`、`tests/scenarios/save-mutations.mjs`、`scripts/test-scenarios.mjs`。
9. 原版 `archive/original/c2.js:28048–28057` 与 `:46893–46936`，只读。

`castle-victory`（当前 `scripts/test-scenarios.mjs:444–453`）已经驱动真实胜利，但只检查终局和面板显示。当前 `harness.observeVictoryPanel()`（330–337）只观察可见性与文本。现有浏览器测试未覆盖真实继续点击。结果面板单测（110–121）只证明 spy 调用顺序。利用这些设施扩展覆盖，保留既有用例。

## 4. 动作顺序：逐项保持

原版按钮与恢复版当前顺序一致，新的 `game.continueRun()` 完整承接下列顺序：
1. `game.gameWon = false`
2. `recordGameEvent("Victory", "Decision: Continue")`
3. `game.resetContinuation()`
4. `game.state.victoryStatistics.currentContinueCount++`
5. `placePartyInWorld()`
6. `unlockStartingRegion()`
7. `game.allies.reset()`
8. `game.view.reset()`
9. `saveProgress(game.saves)`

实现参考（放在当前生命周期 module 中，按实际代码风格接入）：
```js
continueRun: function () {
  game.gameWon = false;
  recordGameEvent("Victory", "Decision: Continue");
  game.resetContinuation();
  game.state.victoryStatistics.currentContinueCount++;
  placePartyInWorld();
  unlockStartingRegion();
  game.allies.reset();
  game.view.reset();
  saveProgress(game.saves);
},
```

这里使用既有 `game` 活绑定，保持该 module 的调用习惯。方法无新参数、无新返回值、无异步等待；每次调用读取当前状态、世界、视图和保存管理器。

`game.js` 已导入 `WorldMap` 和 `resetCastles` 对应的 module，可在原 import 中补充 `placePartyInWorld`、`unlockStartingRegion`。继续事件在现有 math import 中已可用。由组合根使用已有依赖，视图不重新导入 game。

只迁移编排。不要用 `resetRun(false)`、`restartRun()` 或 `resetGame()` 代替第 3 步，它们清空队伍或具有不同保存语义。

原版按钮没有胜利前置检查、重复点击保护或幂等策略。保持这个已存在的调用行为；如发现改善需求，只记在后续建议，不在本轮添加新的 guard、事务、去抖、超时或异步调度。

## 5. 依赖收缩与文件范围

`ResultsDeps` 同时用于胜利和离线面板。17 项不是全部属于继续征程，本轮保持共享方式，不另做类型体系重构。

新增：
- `continueRun: () => void`

删除以下 7 项，涵盖 typedef、必填字段检查、真实装配与测试桩：
- `resetContinuation`
- `incrementContinueCount`
- `resetAllies`
- `resetView`
- `placePartyInWorld`
- `unlockStartingRegion`
- `saveGame`

保留以下 10 项：
- `readVictoryCount`、`clearGameWon`、`restartRun`
- `getMonsterSprite`
- `readOfflineDuration`、`readOfflineProcessed`、`readRunStatistics`
- `readAttackableCastleCount`、`readAchievementClaimQueueLength`、`finishOfflineProgress`

最终共享依赖应为 11 项。重生仍使用 `clearGameWon → Decision: Prestige → restartRun`；所以 `clearGameWon` 与视图里的事件 import 仍需要保留。继续按钮只执行 `gameOverView.deps.continueRun()`；不要在视图再记录一次 Continue 事件。loop 用 `continueRun: () => game.continueRun()` 注入，不缓存状态子对象。

主要修改文件：
- `src/engine/modules/runtime/game.js`
- `src/engine/modules/views/results.js`
- `src/engine/modules/simulation/loop.js`
- `tests/unit/results-decouple.test.mjs`
- `tests/engine-harness.js`
- `scripts/test-scenarios.mjs`
- 必要时 `tests/scenarios/save-mutations.mjs`、`scripts/test-browser.mjs`

loop 的 terrain/regions import 若删除注入后无其他用途，移除；保留仍用于自动保存、导入等路径的依赖。先全仓 `rg` 检查实际使用，避免误删。

允许按本轮实际需要同步：
- `CONTEXT.md`：补充唯一领域术语“继续征程”：胜利后保留当前队伍与成长，开始征服新的城堡。保持词汇表形式，不写方法或存档实现。
- `docs/WORKSTATE.md`：在顶部追加本轮记录，保留原有未提交内容和历史段落。
- `docs/runtime-entrypoints.md`、`docs/formulas/progression.md`、`docs/architecture.md` 等：更新受到本轮移动影响的当前引用，公式与原版事实不变。
- `artifacts/structure-allowlist.json`：仅按第 9 节审查实际结构迁移。
- `artifacts/architecture-audit.json`：由既有审计生成，变更属于验证产物。

本轮不改启动、离线结算、存档恢复、Godot 分支或总体 singleton 架构。也不新增一个接收 8 个回调、再逐个转发的“管理器”；这种做法仅把宽 interface 换个位置。

## 6. 行为账本与特殊情况

在实现前，从原版、恢复版及实际继续后结果交叉确认下表。对观察到的完整流程结果作断言，不把静态推断冒充实测。

| 对象或状态 | 应保持的语义 |
| --- | --- |
| 队伍与队员 | 当前队伍与队员身份保留；不是新建 1 级队伍 |
| 成长和财富 | 职业、等级、XP、生命/精神、技能、装备、背包、金币和卷轴库存保留；按原版完整流程核实 |
| 本轮统计 | 通过现有 resetRunStatistics 重置；不替换成不相容的统计对象 |
| 累计与胜利进度 | 保留胜利次数、累计统计及其他胜利进度；当前继续次数仅由本次动作加一 |
| 游戏回合与目标 | 游戏回合归零；队伍及队员行动目标、战斗目标按原版清除 |
| 当前实例 | 世界和地牢层替换；当前地牢/城堡引用清除；队伍放回世界并解锁起始区域 |
| 药水与瞬态内容 | 药水库存及激活清空；掉落装备、卷轴目标、农场、商店、战斗队列、视觉效果、怪物和召唤物按原版复位 |
| 攻击与法术 | 保留法术能力，重置相应冷却；不能只比较法术 DTO 而忽略随后实际行动 |
| 盟友 | 清场后重新包含保留的队员，不能停留在空列表 |
| 暂停与显示 | 继续后按原版解除暂停，退出胜利显示并恢复可进行的游戏显示 |
| 存档 | 在放置、解锁、盟友与视图刷新之后，通过既有宿主端口保存当前完整结果 |

承重细节：
- `resetContinuation` 中 `discoveredDungeonCount` 被设为**重置前的 farms.length**（原版 46922–46924；恢复版 462–464）。不得改成保留原发现数。
- `castles.nextRequiredMonsterLevel` 在重置城堡前读取、后恢复（恢复版 465–467）。
- 药水清空而卷轴库存保留，不统一处理。
- 不能把“全部掉落清空”等宽泛描述写成断言；只断言已由源码和原版核实的行为。
- 胜利面板挂载产生 4×19=76 次随机头像选择，保持调用位置、次数和顺序。不要为了测试或快照额外挂载一次。
- 放置队员时每人有两次 `randomInt(30)`，但世界生成/刷新还可能消费随机数。不能把整个继续流程的随机消费断言为只有 2N 次。
- 原 RNG 算法、消费顺序、数组登记顺序、250ms 游戏回合、存档 JSON 键及 `C2_V1_001` / `_backup` 语义保持。
- 保护原版档案、fixture、素材、vendor、反编译证据和既有外部 DOM 契约。保护文件最终哈希必须与开工时一致。

## 7. 分阶段实施与每阶段完成条件

### A. 建立基线

记录 HEAD、分支、完整 status、diff stat、保护文件哈希、节点与 npm 版本。先看当前工作树，不自动安装或升级依赖。

读取第 3 节的证据，列出动作顺序与保留/复位状态。确认开发服务器是否已经存在；可用则复用。需要启动时使用单独 PowerShell 会话运行 `npm run dev`，默认地址 `http://127.0.0.1:4173`；不要混在浏览器命令里。

先跑现有结果面板单测、typecheck、初始化守卫、只读架构审计与 `castle-victory` 定向差分。发现基线失败时保留日志，判定环境/既有工作树/测试设施原因；不把它归因于尚未实施的代码。

完成条件：可复核基线、9 步顺序、状态账本、受影响调用者齐全。

### B. 先建立真实继续验收

扩展既有差分 harness 和场景矩阵：
- 新增 `victory-continue-run`：用 `withCastleVictory(base)` 驱动实际胜利，确认面板显示，再点击真实继续按钮。
- 原版和恢复版在各自页面内找唯一按钮，确认可点击并触发真实 handler。不要手工重写 9 步模拟继续，也不要只调用 `resetContinuation`。
- 新场景追加在矩阵后方，保留现有 `castle-victory`。
- harness 新能力仅供测试；每个新分支、返回值和判定字段都必须被 runner 接收并断言，不能有孤儿观察器或无人读取的布尔键。
- runner 具有未知 verdict 字段检查；新增字段必须有明确断言语义，不能扩大兜底白名单掩盖断言遗漏。

当前旧实现应能通过行为测试。这是等价重构的基线，不强求现有正确业务先变红。

完成条件：真实按钮在两端各调用一次；零回合即时状态及真实保存可比较；断言数据有足够非零前提。

### C. 迁移编排与更新视图测试

按第 4、5 节迁移 9 步动作。每个改动 JS 用 `node --check` 检查，更新 JSDoc 与所有调用方。

调整结果面板单测：
- 继续按钮调用一个意图级操作，保持 76 次头像查询；依赖桩只观察这个操作，视图不产生额外 Continue 事件。
- 保留重生的旧顺序测试。
- 保留离线基线/差值刷新测试。
- 缺少 `continueRun` 必须在构造依赖检查处立刻失败。
- 七个被删除字段不再是必填项；不要保留“没人用但为了兼容还要求传入”的空依赖。

用实际继续结果验收新生命周期入口；不要新增一份复制实现顺序的纯 spy 单测作为主要证据。

完成条件：真实按钮仍过差分；视图只发出一个继续意图；typedef、检查器、装配、测试桩一致，17→11。

### D. 强化保真、反向验证与文档

完成第 8 节测试和第 9 节结构审查。同步受影响当前文档，实际测量测试数/场景数/语法文件数，不复制旧数字。

如果已存在的历史段落和行号属于冻结范围，保留它们并追加当前说明；不得批量改写历史“通过”记录。新增领域术语按第 5 节补到 CONTEXT。

完成条件：每个关键验收都有非空前提、至少一项有效破坏及恢复后通过日志；文档、类型和结构检查无新增漂移。

### E. 最终工作树验证与交付

撤销全部实验破坏与临时生产插桩，确认仅剩正式改造。执行第 10 节完整门禁；完整门禁后只新增不受运行影响的报告时，可定向复查文档；若再动源码/测试/断言，重新验证最终版本。

完成条件：最终文件与日志对齐、保护文件哈希不变、剩余限制明确、交付第 11 节报告。

## 8. 验收设计：interface 是测试面

### 8.1 真正点击后的即时比较

在同一固定时钟、相同初始存档和各自连续随机流下，双端真实胜利、面板挂载、点击继续。

点击后不额外推进回合，先做以下比较：
- 完整 DTO 双端 deepEqual，不只 compare summary。
- 各自落盘的 `C2_V1_001` 解码后与各自即时 DTO 一致，并做双端比较。只有保存时间等已有合法口径差异才沿用既有工具处理，不能新增删字段规则掩盖差异。
- 点击前后队伍、队员、装备/背包、技能与财富；按第 6 节选择允许变化的内容（位置、目标与冷却需要变化，不能对整个队员对象生硬要求不变）。
- 当前继续次数与点击前相比恰好 +1；胜利次数不因继续按钮额外增长。
- 真实世界对象替换、队员身份保留、起始区域解锁、盟友恰为当前保留队员。
- Continue 事件恰好一次，且发生于清除胜利标记之后、底层复位之前。可用恢复版已有 `subscribeGameEvents` 作只读观察；不要为取证在原版源码里插桩。

读引用身份的 harness 钩子只暴露判定结果，不把整棵引擎树交给产品。点击方法必须断言唯一按钮存在；“没有找到就忽略”必须是失败。

### 8.2 随后真实推进

即时比较后继续推进 1/99/900 回合的累计检查点（例如依次推进 1、98、801）。每次比较完整 DTO并确认模拟确实前进。这用于抓动作目标、冷却、旧世界引用和随机流漂移。

不能在继续后额外 resetRandom 或重新载入快照来对齐随机流；它会掩盖新代码多消耗或少消耗随机数。测试初始化/初次载入按既有 harness 约定固定随机即可。

### 8.3 非空状态与再次进入

新增 `victory-continue-run-populated`，或等效独立场景：
- 构造合法的已胜利存档，带队员成长、非空装备背包、金币、卷轴、药水和非零继续次数。
- 必须证明恢复后对应前提存在，再点击真实按钮。用现有变异工具生成新测试数据，保留原 fixture。
- 为 farms.length 与 discoveredDungeonCount 不同、城堡下一要求等级非默认值建立可观察前提；合法恢复若会归一化，改在测试专用钩子中构造两端等价状态并写明证据，不能悄悄改玩法。
- 检查药水清空、卷轴保留、发现数的特殊复位与城堡要求等级保留。
- 用同一页面再经合法导入/胜利流程进入一次，并点击新按钮，确保操作读取当前状态，而非缓存旧对象。按原版流程驱动，不强行添加产品幂等规则。

测试数据可以是构造样本，但不能冒称第二份真实历史存档，也不能把 P-5 因此升级为 PASS。

### 8.4 反向验证

至少验证以下相互独立的破坏，单项临时修改后跑对应定向测试，记录明确断言失败，再撤销该修改并复跑：
1. 移除继续次数增加：计数断言变红。
2. 把保存提前到放置/解锁之前：真实落盘与即时状态比较变红。
3. 把底层复位误换成重生：队员身份或成长保留断言变红。
4. 将发现数设为旧 discoveredDungeonCount 而非重置前 farms.length，或移除盟友重建：对应特殊状态断言变红。
5. 移除冷却复位或改变随机消费：随后推进差分能变红；若该前提未命中，改进测试，不假报覆盖。

前 4 项必须有有效敏感性证据；第 5 项必须至少命中冷却或随机其中一个，并说明测试覆盖的限制。

正常继续所需的状态不要在断言前用测试代码补齐。反向验证的失败必须来自目标行为断言，不能把语法错误、缺服务或 TS 错误当作行为敏感性成功。

变异恢复用精确 patch 或开工备份逐项还原；复核没有误覆盖本轮实现与用户已有修改。生产源码最终不含调试探针、替代分支或临时 getter。

## 9. 结构守卫：审查迁移，不绕过

现有 `npm run lint` 会比较工作树与 HEAD 的非标识符结构。本任务明确授权编排迁移，可能触发该守卫；这不是要求再向用户确认已选定的迁移。

先运行：
```powershell
node scripts/verify-structure-invariant.mjs HEAD --explain
```

读取每个差异 hunk，对实际新增/删除的骨架逐条解释。确有必要时在 `artifacts/structure-allowlist.json` 添加精确 file、line 骨架、有限 max 与具体 reason，理由关联本任务中的动作或依赖迁移。

保持归一化算法、保护名单和门槛。不得广泛授权任意调用、清零守卫、切换对比基点或靠提前 commit 逃过检查。通用骨架如 `I.I();` 必须限定文件与次数，并人工审查该文件每个匹配 hunk。

最终同时保留人工 diff 审查和真实差分证据。结构白名单只说明本轮形状变化已审查，不替代行为等价证明。新条目存在时报告其具体用途；后续维护按仓库已有纪律处理，不自行删除用户条目。

## 10. Windows 命令与最终验证

工作目录：
```powershell
Set-Location -LiteralPath 'D:\下载\clickpocalypse2-main'
git status --short --branch
git status --short --untracked-files=all
git rev-parse HEAD
git diff --stat
node --version
npm --version
```

在独立 PowerShell 会话启动或复用开发服务器。开始浏览器检查前验证 `http://127.0.0.1:4173`；若使用其他端口，以 `TEST_URL` 统一指定。后台启动辅助进程时使用 `-WindowStyle Hidden`，不要关闭或复用来历不明的进程。

日志目录使用唯一时间戳，如 `output/continuation-<timestamp>/`。每条命令保存完整 stdout/stderr，并立刻读取 `$LASTEXITCODE`。可用：
```powershell
$continuationLogDir = Join-Path 'output' ('continuation-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $continuationLogDir | Out-Null

npm test *> (Join-Path $continuationLogDir 'unit.log')
$continuationExit = $LASTEXITCODE
Add-Content -LiteralPath (Join-Path $continuationLogDir 'exits.txt') -Value "npm test=$continuationExit"
if ($continuationExit -ne 0) { throw '单元测试失败，先检查日志' }
```

定向差分：
```powershell
$previousScenarioFilter = $env:SCENARIO_FILTER
try {
  $env:SCENARIO_FILTER = 'castle-victory,victory-continue-run,victory-continue-run-populated,prestige-restart,full-reset'
  npm run test:scenarios *> (Join-Path $continuationLogDir 'targeted-scenarios.log')
  $continuationExit = $LASTEXITCODE
  Add-Content -LiteralPath (Join-Path $continuationLogDir 'exits.txt') -Value "targeted scenarios=$continuationExit"
  if ($continuationExit -ne 0) { throw '定向差分失败' }
} finally {
  if ($null -eq $previousScenarioFilter) {
    Remove-Item Env:SCENARIO_FILTER -ErrorAction SilentlyContinue
  } else {
    $env:SCENARIO_FILTER = $previousScenarioFilter
  }
}
```

新增场景采用上面的约定名；若按当前 runner 作了等效组织，更新定向列表，并让 runner 的未知场景检查继续生效。

最终至少执行：
- `npm test`、`npm run typecheck`、`npm run audit:initialization-order`
- `npm run audit:doc-counts`（新增测试/场景后同步当前指标）
- `node scripts/verify-structure-invariant.mjs HEAD --explain`
- 无 `--quick` 的 `node scripts/gate-sweep.mjs`

完整 sweep 运行前暂时清除 `SCENARIO_FILTER`，运行后恢复用户原值。收官不得只跑新增场景。现有 sweep 还负责 lint、build、check、单测、架构棘轮、死读取、文档映射/片段/锚点/引用、法术与成就检查、产品依赖、parity、全场景、画面、地图运动、源码和 dist E2E、性能、soak、帧性能；以实际脚本为准，不在报告虚构门禁数。

最后保存：
```powershell
git diff --check
git diff --stat
git status --short --untracked-files=all
Get-FileHash -LiteralPath 'tests/fixtures/original.c2save','archive/original/c2.js' -Algorithm SHA256
```

如果受限沙箱阻止 Node 子进程或 Chrome 启动，记录 `EPERM` 等完整错误，按执行环境支持的机制申请允许的运行方式。自动审批拒绝且无可行方式时，完成可独立的工作并报告未验证项；不得写“全部通过”。

如果某门禁基线已红，证明它在改造前就红并区分影响。不能降低断言、扩大容差、修改原版/fixture、忽略错误或放宽保护名单来得到绿色。源码修改后的真实分叉优先排查首个不一致字段及随机/时序，不用全局替换碰运气。

默认不自动提交、推送或切分支，留下可审查工作树。用户另行要求提交时，仅选择本任务明确修改的文件，避免 `git add .` 收入已有工作；可用提交标题 `refactor: move victory continuation into runtime lifecycle`。

## 11. 最终交付

写 `output/continuation-<timestamp>/final-report.md`，中文，按以下结构：
1. 实际起点：HEAD/分支/已有工作树；本轮产品、测试、文档、自动生成产物的归属。
2. 改造结果：旧视图承担什么；当前生命周期 module 承担什么；ResultsDeps 实际计数；interface、depth、seam、adapter、locality、leverage 分别体现在哪。
3. 保真证据：原版动作对应、真实按钮、即时完整 DTO、落盘、1/99/900 回合、非空特殊状态与再次进入。
4. 反向验证表：变异位置、目标断言、失败日志、恢复后通过日志。清楚写哪些分支仍未命中。
5. 检查结果：命令、真实 exit、日志路径、运行时 HEAD/最终工作树；报告未跑或环境阻断项。
6. 文件清单与保护哈希；结构授权条目说明；文档计数和行号同步。
7. 状态标识：VERIFIED / PARTIALLY VERIFIED / UNRESOLVED。只对已证明的本轮 slice 下结论，不声称整体现代化完成。

最后给用户一段简短总结和报告路径。若未达到完成条件，写出已经交付的结果与具体缺口，不用“继续按钮代码更简洁”代替验收。

## 12. 第一性原理与对抗性自检

交付前逐项回答：
- 正确执行继续征程所需的知识是否已离开视图，还是只是给原回调换了名字？
- 调用者只表达玩家选择后，实施和验证是否集中到了同一 seam？
- 若删掉新的完整继续入口，业务顺序是否会重新散回调用者？若删掉一个新增转发文件却毫无影响，它是否值得存在？
- 队伍保留与重生清队伍是否被测试明确区分？
- 真实点击、真实保存和随后推进是否都发生了，还是两个空结果互相比对？
- 测试观察是否额外消耗随机数、触发挂载、补齐状态或重置随机流？
- 是否错误“修正”了 farms 长度恢复发现数、药水/卷轴差异或无重复调用守卫？
- 是否漏接了 typedef、必填字段、loop 装配、旧测试或 runner 分支？
- 结构白名单、测试和报告是否正好对应最终改动，没有扩大任务到启动或存档重构？

全部回答以源码、断言和日志支撑。遇到 routine 实现选择，自行据已核实证据解决，持续推进到交付；只有超出用户既定范围的玩法改变或无法恢复的外部阻断，才需要提出新的决策。
