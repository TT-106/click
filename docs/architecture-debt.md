# 架构债台账（Clickpocalypse II 现代化，2026-09-27 首版）

> 依据 `docs/NEXT-ARCHITECTURE-PROMPT.md` §3 编写。**本文件只记录可复核的事实与显式标注的推断**；
> 每个数字都能用文中给出的命令重跑出来。事实来源 = `scripts/audit-architecture.mjs`（`npm run audit:arch`，
> 结果落 `artifacts/architecture-audit.json`）与直接读源码；**不引用任何旧报告里的结论**。
>
> 约定：**FACT** = 脚本/命令可复跑得到；**INFERENCE** = 我的设计判断，可能被反例推翻；**REJECTED** = 试过并放弃，附原因。

---

## 1. 事实：模块依赖的实测形状（FACT）

复跑：`npm run audit:arch -- --json` → `artifacts/architecture-audit.json`（Babel 解析全部 `src/**/*.js` 的 import 边）。

| 指标 | 实测值 |
|---|---|
| `src` 下 `.js` 文件 | 93 |
| 其中 `src/engine/modules/**` | 77 |
| import 边（解析到仓库内文件的） | 564 |
| 直接 import `runtime/game.js` 的文件 | **49**（其中真正绑定 `game` 的 48 个） |
| 强连通分量（SCC，成员 >1） | **1 个，含 55 个模块** |
| `runtime/index.js` 里的 `initialize*()` 调用 | 74 |
| 其中**初始化期真正执行**的跨模块调用 | **41**，且**没有一条**是"被调方排在调用方之后" |
| 产品壳（`src/app.js` + `src/ui/**` + `src/services/**`）对 `src/engine/**` 的直接 import | **2** 条 |

### 1.1 `game` 的导入者分布（FACT）

```
 12  engine/modules/views          8  engine/modules/world        6  engine/modules/characters
  4  engine/modules/combat         4  engine/modules/progression  3  engine/modules/loot
  3  engine/modules/rendering      3  engine/modules/simulation   2  engine/modules/ai
  2  engine/modules/persistence    1  engine/modules/content      1  engine/modules/runtime
```

`core/` 是唯一不 import `game` 的目录（`core/math.js`、`core/bootstrap-data.js`）。

### 1.2 循环依赖不是"若干小环"，而是**一整个 55 节点的大环**（FACT）

唯一的 SCC 含 55 个模块，覆盖 `ai / characters / combat / content / loot / persistence / progression /
rendering / runtime / simulation / views / world` 全部域目录（仅 `core/`、`world/` 的两个文件与少数几个
`views/` 模块不在其中）。

**INFERENCE**：这意味着**目录拆分不等于依赖方向单一**。任何"分层架构"的说法在这里只能成立于
**初始化时序**这一层，不能成立于 import 层。对维护的实际影响是：想知道"改 A 会不会波及 B"，
不能靠目录，只能靠这 564 条边或运行时行为。

### 1.3 初始化顺序确实是运行契约，且可以量化（FACT）

74 个 `initialize*()` 按固定顺序调用。脚本只统计**初始化期真正会被执行**的跨模块调用
（进入 `initializeX()` 函数体后跳过所有嵌套函数体，避免把"以后才发生"的回调算成依赖），得到 41 条边：

- `initializeRuntimeGame(73)` 一条就贡献 18 条（它是组合根，排在最后——`runtime/index.js:150`）；
- 视图族 19 条指向 `initializeViewsBase(54)` / `initializeViewsNavigation(55)`（原型挂载必须先于子类）；
- **41 条边里 0 条违反声明顺序** ⇒ 声明的顺序是这 41 条依赖的一个合法拓扑序。

**INFERENCE**：因此顺序是**承重**的，而不是"随便排的"。新增模块时，`initialize*()` 的插入位置必须与这
41 条边相容；除 `runtime/index.js` 的调用顺序外，**没有第二个机制**在守护这件事（没有断言、没有测试）。
**INFERENCE**：这也是为什么 `runtime/index.js` 注释写"模块初始化阶段只有这里拥有调用顺序"——那句话
描述的是一条隐式契约。

### 1.4 产品 UI 没有绕过 adapter（import 层面）；但在对象层面有两处旁路（FACT）

产品壳对引擎的直接 import 只有两条：
- `src/app.js` → `engine/adapter.js`（唯一引擎入口）
- `src/services/save-validation.js` → `engine/save-codec.js`（纯编解码，无状态）

**但**：
1. `adapter.js:63-68` 的 `startParty()` 把"开局"这条命令实现为**直接改写遗留视图的内部字段**：
   `controller.selectedCharacters = …`、`controller.validParty = true`、`controller.startButton.onclick()`。
   即命令层的抽象在对象层面被穿透（快照/命令契约只覆盖了读路径与部分写路径）。
2. 引擎自带的 12 个 `views/**` 模块仍直接持有并操作 DOM，产品壳通过 `mountExpedition()` 搬运节点
   （`src/ui/legacy-panels.js`）。这是"UI 独占路径"的根因（`docs/reverse-engineering/unresolved.md` U7）。

**INFERENCE**：把 `startParty` 改成"调用引擎自己的开局入口"是可行的收窄方向，但它会改动
`views/party-creation.js` 的调用关系，属于第二个切片的候选，不在本轮范围内。

### 1.5 跨目录最常被读写的状态（FACT）

按"读它的文件数 + 写它的文件数"排序（只统计 `game.*` 静态成员链）：

| 字段 | 读文件数 | 写文件数 | 跨目录数 |
|---|---|---|---|
| `game.state` | 35 | 0 | 10 |
| `game.state.adventurers` | 20 | 0 | 10 |
| `game.state.adventurers.length` | 18 | 0 | 9 |
| `game.state.party` | 14 | 0 | 9 |
| `game.tileSize` | 14 | 0 | 7 |
| `game.state.turnNumber` | 12 | 2 | 7 |
| `game.world` | 13 | 0 | 7 |
| `game.state.statisticsRecorder` | 12 | 0 | 5 |
| `game.dungeons` | 11 | 0 | 6 |
| `game.castles` | 11 | 0 | 6 |
| `game.worldActive` | 9 | **4** | 7 |
| `game.currentDungeon` / `game.currentCastle` | 5 | **3** | 5 / 6 |

**INFERENCE**：`game.worldActive` 是"可变全局开关"里扇出最大的一处（9 读 4 写，横跨
ai/characters/persistence/rendering/simulation/views/world）。但把它收进显式接口需要同时改动行为决策、
渲染与存档恢复三条路径，且现有测试只能靠差分"整体相等"来验证——**收益不明确、验证手段弱**，
故列为后续候选而非本轮切片（见 §4）。

### 1.6 存档 DTO 的类型资产没有被使用（FACT）

`persistence/save-dto.js` 有 9 个 typedef（`SaveItemEffect / SaveItem / SavePosition / SaveAdventurer /
SavePotion / SaveScroll / SaveAchievement / SaveGameOptions / SaveData`）。用 Babel 扫全部 `src/**/*.js`：

- 除 `save-dto.js` 自身外，**没有任何文件引用这 9 个名字**。
- `tsconfig.json` 的 `include` 只有 `src/engine/save-codec.js`、`core/**/*.js`、`persistence/**/*.js`；
  `strict: false`、`checkJs: true`。经 import 图传递，`tsc --listFiles` 实际加载 **76/77** 个引擎模块。

**INFERENCE**：`SaveData` 目前只是"存档 schema 的文档化来源"，不是被检查的契约。
把它接到 `game-save.js` 的序列化/恢复函数上能获得真正的 DTO 形状校验，但那条路径
**没有单测、只有差分**，任何接线错误都会表现为"存档损坏"，风险高于本切片收益 → 列为下一候选（§4）。

---

## 2. 候选切入点的比较（INFERENCE）

按"未来功能带来的修改范围缩减 / 接口简洁度 / 行为风险 / 现有测试能否验证"四项比较。

| 候选 | 修改范围缩减 | 接口简洁度 | 行为风险 | 现有测试能否验证 |
|---|---|---|---|---|
| **A. 成就进度判定**（`progression/achievements.js` 的 `getAchievementProgress` / `hasVictoryAchievement`） | 中：把"判定需要哪些数据"从"顺着全局单例找"变成"一个具名数据结构" | 高：28 个 `case` 全部退化为"读一个字段"，输入可完全显式化 | **低**：`switch` 是纯读，无 RNG、无写、无 DOM；唯一副作用是 `case 16` 会写 `party.cachedMaxLevel`（用惰性 getter 规避） | **能**：`achievement-claimed` / `achievement-rewards-multiple` 两条差分 + parity 4 个检查点都在跑这条路径 |
| **B. 相邻的冒险点/统计**（`progression/points.js` + `statistics.js`） | 中：`game.state.statisticsRecorder` 被 5 个目录读 | 中：统计写入点是事件驱动的，接口天然是"一堆 setter" | 中高：点数与统计都**入存档**（`pointManagerState` / `statistics` / `totalStatistics`），改错即存档分叉 | 能（差分），但**单测无法触及**（需要引擎） |

**选 A**，理由按证据排：

1. **A 的判定逻辑是纯读**：`getAchievementProgress` 是 `switch (a.requirementType)` 里 23 个
   `return b.<字段>`，唯一例外是 `case 16` 读队伍最高等级；`hasVictoryAchievement` 是 5 个
   `return <布尔表达式>`。没有 `Math.random`、没有写、没有 DOM。
2. **A 的调用点只有一个**：`simulation/tick.js:223`（grep 实测 `getAchievementProgress` /
   `hasVictoryAchievement` 在 `src/` 与 `tests/` 里各只有 1 处调用）。收窄接口的传播范围天然最小。
3. **A 正好覆盖验收矩阵的一条 PARTIAL**（成就 requirementType 逐项进度），而 B 对应的"统计"行已是 PASS。
4. **A 已有差分保护网**：`achievement-claimed`、`achievement-rewards-multiple` 两条场景 + parity 的
   0/1/99/900 回合检查点都会执行这条 `switch`。

**反例（我主动找的，并据此调整了方案）**：

- 反例 1：`case 16` 依赖 `getPartyMaxLevel(game.state.party)`，而 `getPartyMaxLevel` 会**写**
  `party.cachedMaxLevel`。若为了"接口干净"把 `partyMaxLevel` 提前求值，就改变了"哪些回合写入缓存"的
  时序 ⇒ **属行为变更**。对策：`AchievementCheckData.partyMaxLevel` 做成惰性 getter，只有 `case 16`
  读它才求值（单测断言"非 16 类读取即失败"）。
- 反例 2：把数据快照提到 `tick.js` 的循环外是"更干净"，但如果不做提升、让 328 条成就各自现取一份，
  实测每回合 +0.02ms（见 §3.4）。⇒ 提升是**必要**的，不是可选的洁癖。

---

## 3. 已落地的切片：成就进度判定（迁移卡 + 结果）

### 3.1 迁移卡

| 项 | 内容 |
|---|---|
| **当前调用关系** | `simulation/tick.js:223` 每 4 回合遍历 `game.state.achievements.obtainedList`，逐条调 `getAchievementProgress(qa)` / `hasVictoryAchievement(qa)`；两个函数内部各自读 `game.state.lifetimeStatistics`、`game.state.victoryStatistics`，`case 16` 还读 `game.state.party` |
| **拟定接口** | `getAchievementCheckData(): AchievementCheckData`（本文件**唯一**读 `game` 的位置）+ `getAchievementProgress(achievement, data?)` / `hasVictoryAchievement(achievement, data?)`。`AchievementCheckData = { lifetimeStatistics, victoryStatistics, partyMaxLevel }`，其中 `partyMaxLevel` 是惰性 getter |
| **状态所有者** | 不变：`game.state.lifetimeStatistics` / `victoryStatistics` / `party` 仍归 `runtime/game.js` 的组合根所有。本切片**只改变读取位置**，不改所有权 |
| **被保留的兼容入口** | 省略 `data` 时 `data = data || getAchievementCheckData()` ⇒ 原调用路径 `getAchievementProgress(qa)` 一字未改仍可用（单测断言"未启动引擎时省略 data 会抛错"，把这条耦合显式化） |
| **可观测行为** | 判定结果逐条不变；存档 DTO 不变；RNG 调用顺序不变；`party.cachedMaxLevel` 的写入时机不变（惰性 getter） |
| **需要的测试** | ① `scripts/check-achievement-requirements.mjs`（已入 `npm run lint`）：328 条定义 × 28 类 requirementType 的表驱动核对 + `isVictoryAchievement` 等价性 + 未知类型怪癖；② `tests/unit/achievement-progress.test.mjs`：不启动引擎的 28 类映射 / 23-27 分支 / `partyMaxLevel` 惰性 / 兼容入口耦合；③ 两条差分场景把阈值两侧都驱动起来（矩阵 60 → 62） |
| **回退方式** | 单个 commit 可 `git revert`；三个改动文件互不依赖其它切片（`progression/achievements.js`、`simulation/tick.js`、测试与脚本）。**不使用 `git checkout --`**（见 `docs/REMAINING-WORK.md` R6） |

### 3.2 修改前后的可数量化

| 指标 | 前 | 后 |
|---|---|---|
| `achievements.js` 里读全局 `game` 的位置（判定相关） | 3 处（`victoryStatistics`、`lifetimeStatistics`、`case 16` 的 `party`） | **1 处**（`getAchievementCheckData()`） |
| 判定函数直接读全局的次数 | 每个函数 1-2 次 | **0 次** |
| 调用者要理解的接口 | `getAchievementProgress(achievement)` —— 数据来源**只能读实现才知道** | `getAchievementProgress(achievement, data?)`，`data` 有 `@typedef` 文档化三个字段 |
| 判定逻辑能否脱离引擎测试 | **否**（必须启动 `runtime/index.js` 并造出统计状态） | **是**（`tests/unit/achievement-progress.test.mjs`，不 import `game`） |
| 覆盖 `requirementType` 的机械断言数 | 0 | **806**（596 非胜利类 + 210 胜利类） |
| 差分场景数 | 60 | **62** |

### 3.3 反向验证（每条新断言都故意破坏过）

| 断言 | 破坏方式 | 结果 |
|---|---|---|
| 需求表核对（`check-achievement-requirements.mjs`） | 把 `case 1: return b.directKills` 改成 `b.scrollKills` | 立刻报 **11 处**不符并指名 `monsterKills*`；恢复后转绿 |
| `partyMaxLevel` 惰性（单测） | 在 `getAchievementProgress` 里加 `var eagerProbe = data.partyMaxLevel;` | `not ok 4`，`# fail 1`，退出码 1；移除后转绿 |
| 阈值差分场景 | 把 `case 9` 改成 `return 1E9`（永远达标） | `achievement-threshold-below` / `-met` 双双失败并打印首处分叉 |
| 场景前提（verdict） | 把共享定义表里 `farmsPurchased5` 的 `requiredCount` 由 5 改成 6 | 场景失败 |

**诚实说明**：最后两条的失败发生在"完整存档比对"这一步，verdict 断言本身没有先触发。
即两条场景的 verdict 实际保护的是**场景前提**（"这条场景真的坐在临界值两侧"），
与既有 `changed` / `unchanged` 一类"场景有效性断言"同性质——**不写成"直接断言了实现分叉"**。

### 3.4 性能：一次真实的回归与修复（FACT）

第一版实现让 `getAchievementProgress(qa)` 保持单参调用（每条成就现取一份数据）。用**交替 A/B**
（`git stash` 切换实现、同机同轮交替跑 `npm run perf`）测得：

| 轮次 | HEAD（未改） | 单参版（每条现取） | 提升版（本轮最终） |
|---|---|---|---|
| 1 | 0.067 | 0.086 | 0.074 |
| 2 | 0.058 | 0.079 | 0.077 |
| 3 | 0.065 | 0.096 | 0.077 |

**结论**：每条成就各建一个带 getter 的对象（一次检查最多 328 个）是**真实的**每回合约 +0.02ms 退化；
把 `getAchievementCheckData()` 提到 `tick.js` 的循环外（一次检查 1 个对象）后与 HEAD 无显著差异
（本机单次样本波动 ±0.02ms/回合，大于该效应，故**不声明收益**）。

**教训（与 `PERFORMANCE_REPORT.md` 的口径一致）**：单批对比会给出 1.31x 这种假信号；
必须交替 A/B 才能区分"实现差异"与"机器漂移"。

---

## 4. 被否决的方案（REJECTED）

| 方案 | 否决原因 |
|---|---|
| 给 `getAchievementProgress` 再加一层"纯函数 + 兼容包装"两个导出（`*From` + 旧名） | 与 `docs/NEXT-ARCHITECTURE-PROMPT.md` §2"不要添加一层只转发调用的空壳"冲突；改用**可选参数**，一个函数一个名字，无死代码 |
| 把 `partyMaxLevel` 在 `getAchievementCheckData()` 里提前求值 | 改变 `party.cachedMaxLevel` 的写入时机 ⇒ 行为变更（§2 反例 1） |
| 不改 `tick.js`，让 328 条成就各自现取数据 | 实测每回合 +0.02ms（§3.4） |
| 把 `game.worldActive`（9 读 4 写、7 个目录）收进显式接口 | 需要同时改行为决策 / 渲染 / 存档恢复三条路径，而验证手段只有"整体差分相等"，收益不明确（§1.5） |
| 把 `save-dto.js` 的 `SaveData` 接到 `game-save.js` | 触碰存档路径且该路径只有差分没有单测，风险高于本切片收益（§1.6）→ 列为下一候选 |
| 为"减少 `game` 导入数"而拆分/合并模块 | 模块数不是成果（§4 原话）；唯一 SCC 有 55 个成员，机械消除循环会引入转发层而不减少调用者需要知道的东西 |

---

## 5. 下一步候选（按证据排序）

1. **`save-dto.js` 接入 `game-save.js`**（`persistence`）：把 `SaveData` 变成被 tsc 检查的契约。
   入口证据：`save-dto.js` 的 9 个 typedef 目前 0 引用（§1.6）；`tsc --listFiles` 已覆盖 76/77 模块，
   接线不会扩大检查范围。**风险控制**：逐函数接线，每个函数一次 parity + 62 场景。
2. **`views/party-creation.js` 的开局入口收窄**：让 `adapter.startParty` 不再写视图内部字段（§1.4）。
   入口证据：`adapter.js:63-68` 的三处直接字段写入。**风险**：`partyCreationTabContent` 是 c2c 外部
   契约的一部分，需先确认选择器不变。
3. **`game.worldActive` 的状态归属**：先把"谁在写"收敛到一处（4 个写点），再考虑是否做接口。
   **前提**：先补一条能直接观察"世界/地牢模式切换"的差分断言，否则无法验证。
4. **相邻的 `progression/statistics.js`**：把"统计写入"从"每个调用点各自找 recorder"收敛为具名入口。
   入口证据：`game.state.statisticsRecorder` 被 5 个目录读（§1.5）。

**没有真实历史存档或真机时，以下两项保持 PARTIAL，不用构造数据冒充**：多版本存档迁移样本、
真机帧时间/低端设备（见 `docs/REMAINING-WORK.md` §3.1）。

---

## 6. 本轮未做的事（避免被读成"已完成"）

- **没有**引入任何依赖、框架或打包器；**没有**重写任何领域逻辑；**没有**改动数值/概率/RNG/存档键。
- **没有**消除那个 55 节点的 SCC，也**没有**声称架构已分层。
- `docs/architecture.md` 的依赖图本轮只补实测数字，**没有**逐条重绘。
- 成就切片的**调用点**（`tick.js:223`）本身仍调用同名的两个函数；改变的是"它们的数据从哪来"，
  不是"调用者少写了几行"。
