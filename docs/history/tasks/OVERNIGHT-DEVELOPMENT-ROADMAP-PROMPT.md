# Clickpocalypse II 下一阶段总路线与彻夜执行提示词

> **历史档案，停止执行和更新。** 下文的“当前/最新/下一步”、数字、权限和命令只适用于原批次；不能用于当前开发或表示本轮验证。当前入口是 [文档索引](../../README.md)。


> **历史任务书（已执行完）。** 本文件对应 **U131 → U132** 批次，其中 P-2、P-3 与组队入口切片均已完成。
> **不要再把本文当作新任务执行。** 当前入口见 `docs/README.md`；接手顺序见 `docs/WORKSTATE.md` 顶部。
> 下文保留供追溯，其中的日期、计数与测试结果都是**交接时的观测**，不是当前值。

> 适用工作区：`D:\下载\clickpocalypse2-main`，Windows / PowerShell。编写于 2026-09-27。下面“给执行代理的提示词”可整段交给另一个 agent。日期、计数和测试结果只是交接时的观测；开工后以工作树和重跑结果为准。

## 给执行代理的提示词

你接手的是已经恢复并大规模语义化的 Clickpocalypse II 浏览器游戏。请全程用中文沟通，在 Windows 的 `D:\下载\clickpocalypse2-main` 工作。用户希望你在一个长时间自治会话中继续开发，交付实际代码、验证和可续跑记录。不要在读完文档后只交一份计划。

### 一、任务目标与判断方法

目标按优先级排列：

1. 保住原版玩法、数值、随机流、离线节奏、存档兼容与像素素材的可观测行为。
2. 补足对未来改动最有保护力的行为证据，尤其是当前验收矩阵里的可闭合缺口。
3. 在证据充分时完成小型纵向架构切片，让下一次修改需要理解的状态与接口更少。
4. 保持文档、类型标注、测试和实际源码一致，诚实列出尚未验证的部分。

从第一性原理判断：一项改动是否减少了调用者需要了解的细节，能否用现有证据检验它的行为，失败时能否定位和回退？每个方案写一个能推翻它的反例。不要把“文件更多、模块更多、循环依赖数字更小、`any` 数字更少、测试数量更多”本身当作成功。

**本夜建议目标**：完成一次干净的当前态基线；核验并保护已有 U131 存档类型工作；优先补 1–2 个有明确行为观测的差分场景；若前述门禁稳定，再做一个边界清晰的架构切片。剩余任务排入有证据的待办，不追求强行把所有 `PARTIAL` 改成 `PASS`。

### 二、先建立真实的当前状态

按这个顺序读并对照源码：

1. `git status --short --untracked-files=all`、`git log -6 --oneline`、`package.json`、`tsconfig.json`。
2. `docs/WORKSTATE.md` 顶部 U130/U131、`docs/REMAINING-WORK.md`、`docs/architecture-debt.md`、`docs/architecture.md`、`docs/m10-type-debt.md`、`REFACTOR_REPORT.md` 附录 A。
3. `docs/reverse-engineering/facts.md` 与 `unresolved.md`、`docs/persistence.md`、`docs/time-model.md`、`docs/rng.md`、`MIGRATION_MAP.md`。
4. 实际入口与契约：`index.html` → `src/app.js` → `src/engine/adapter.js` → `src/engine/internal-api.js` → `src/engine/modules/runtime/index.js` / `game.js`；`src/services/saves.js` / `save-validation.js`；`tests/engine-harness.js`、`scripts/test-{parity,scenarios,browser}.mjs`。

**交接时的工作树已经不干净。** 2026-09-27 观测到 U131 相关未提交改动：`REFACTOR_REPORT.md`、`docs/{REMAINING-WORK,WORKSTATE,architecture-debt,architecture,m10-type-debt}.md`、`package.json`、`scripts/lint-invariants.mjs`、`src/engine/modules/persistence/{game-save,save-dto}.js`，以及未跟踪的 `scripts/audit-save-schema.mjs`。它们不属于你可随意丢弃的临时文件。先查看 diff、记录归属与意图；不做 `reset --hard`、`clean`、整树格式化，不把别人的改动混进自己的提交。若发现另一个 agent 正在同一目录改文件，应在无冲突区域工作或使用独立工作树；不要覆盖其文件。

**资料优先级**：当前源码与真实测试输出 > 顶部最新工作状态 > 历史报告。`docs/DEVELOPMENT.md` 是 U130 前的旧执行提示，里面“成就切片尚未实施、SaveData 尚未接入、lint 因隐形文件名失败”等叙述已过期。`docs/history/tasks/HANDOFF-PROMPT.md` 更早。`docs/WORKSTATE.md` 顶部记录 U131，但后部仍有“当前工作树干净”“30 场景”“M10 已完成”等历史段落；不得摘一段旧话当作当前事实。

交接时重新跑过的**当前基线**：`npm run lint` 退出码 0（10 条不变量），`npm run check` 退出码 0（134 文件语法、typecheck、15 单测），`npm run audit:arch -- --json` 与 `npm run audit:save-schema` 退出码 0，`npm run test:parity` 的 0/1/99/900 回合通过，`npm run test:e2e` 通过，完整 `npm run test:scenarios` **62/62** 通过。soak/perf 的当前工作树结果仍应由你自己复跑；交接时的绿灯不是今夜后续修改的通行证。

若 4173 端口占用，先确认 `http://127.0.0.1:4173/index.html` 与所需源码确实来自本工作树，再复用服务。不要结束不明来源的进程。PowerShell 设置筛选场景的写法是 `$env:SCENARIO_FILTER='a,b'; npm run test:scenarios`，结束后 `Remove-Item Env:SCENARIO_FILTER`。

### 三、真实代码结构与不能越过的边界

- `archive/original/**` 是冻结的原版参照；`archive/migration/**` 是恢复过程的工具和遗产；原版存档 fixture 是 `tests/fixtures/original.c2save`。这些文件及 `src/vendor/lz-string-1.3.3.js` 不能因现代化而改写。
- `src/engine/modules/` 有 77 个引擎模块，分在 `ai / characters / combat / content / core / loot / persistence / progression / rendering / runtime / simulation / views / world`。`runtime/index.js` 顺序调用 74 个 `initialize*()`；已审计到 41 条初始化期跨模块依赖，当前顺序是合法拓扑序。新增或移动初始化调用前先证明执行时序。
- `runtime/game.js` 是组合根和全局可变 `game` 单例。当前审计：49 个文件直接 import 它，48 个实际绑定；55 个模块处于同一个强连通分量。目录边界不等于依赖边界。优先处理有实际修改收益的局部 seam，禁止为数字好看机械消环。
- `src/app.js` 和产品 UI 通过 `adapter.js` 的快照与命令读写引擎；纯编解码是唯一例外。`adapter.startParty()` 当前直接改遗留视图的 `selectedCharacters`、`validParty`，再调用 `startButton.onclick()`，是值得研究的对象层旁路；但不要未经取证直接换成新的建队实现。
- 引擎的 `views/**` 自己操作 DOM，产品壳还保留 `archive/original/c2c.user.js` 使用的选择器。改建队、面板、Canvas、样式时，浏览器 E2E 里的 c2c 选择器断言和视觉检查都属于契约。
- 主循环在 `simulation/loop.js`：正常节奏约 250ms/回合；离线恢复是帧循环分批推进，非一次性 `advanceSimulation`。随机性有两路：种子随机与 `Math.random`；测试 harness 固定后者。改变随机调用数量或顺序，即使一时 DTO 相等，也可能导致后续分叉。
- 存档由 `persistence/game-save.js` 与 `entities.js` 编解码，产品层 `services/saves.js` 负责 Worker 预检、localStorage、备份与坏档保护。`C2_V1_001`、存档 JSON 键及编码格式是外部契约。当前 fixture 和已初始化序列化器有 30 个顶层键；空白档只有 4 个键。这是两种形态，不是“四种形态都同构”。
- 现有类型检查使用 JSDoc + `checkJs` 且 `strict:false`。U131 已把 `SaveData|SaveDataUninitialized` 接到序列化返回、把 `SaveData` 标在恢复侧 `JSON.parse` 结果；这能抓部分顶层键误读写，却**不证明外部 JSON 已通过运行时校验**。`SaveData` 的多层嵌套仍是 `{Object}`；`audit-save-schema.mjs` 只核对顶层声明/fixture/序列化器的集合与少数 fixture 样本。样本缺席会被脚本跳过，不能称为完整 schema 证明。

未经用户明确授权，不改原版规则、平衡数值、内容、像素素材、RNG、存档键、原版自身缺陷或产品 UI 的总体设计；不要引入框架、打包器和新依赖。若遇到原版固有缺陷，记录复现及影响，继续做独立工作。所有新 UI 文案和状态反馈应保持简洁、可读，并遵守现有产品语气。

### 四、彻夜执行顺序

#### 阶段 0：基线、风险与工作隔离

1. 记录当前 diff 和未跟踪文件，确认 U131 的实际文件内容。运行 `npm run audit:arch -- --json`、`npm run audit:save-schema`，核对报告与源码。不要因为 audit 绿就推断存档全部嵌套字段安全。
2. 确认本地服务。逐项执行 `npm run lint`、`npm run build`、`npm run typecheck`、`npm run check`、`npm run test:parity`、`npm run test:scenarios`、`npm run test:e2e`。记录**每项真实退出码**、日志文件和发生时间；PowerShell 中管道后的 `$LASTEXITCODE` 不一定代表前面测试，避免把输出处理器的退出码当成门禁结果。长耗时测试独立运行，不与 `build` 交叉修改文件。
3. 若有红灯，先判定基线既有问题、服务/浏览器设施问题还是本轮修改。保留最小复现与失败日志；不要通过删断言、改容差、改原版或改变随机种子修绿。基线不稳时先处理可证明的阻塞，不开始大范围架构改造。

#### 阶段 1：保护 U131 存档契约，查清它的真实边界

1. 审读未提交的 `game-save.js` / `save-dto.js` / `audit-save-schema.mjs`，确认这批变更确实只加类型、审计和文档，不改变运行时序列化或恢复的任何键、值、顺序、调用副作用。用 parity、存档导入导出 E2E、损坏档保留和刷新恢复核验。
2. 明确 audit 的盲区：顶层键序目前只报告、不作为失败；空白档 4 键与已初始化 30 键只是在各自形态内检查；`JSON.parse` 的 JSDoc 属静态断言；少数嵌套 spot check 不能覆盖所有结构。尤其核查 `SAVE_BLANK_TOP_LEVEL_KEYS`：当前审计脚本只 import 了 `SAVE_TOP_LEVEL_KEYS`，并没有实际比较这个新导出的空白档常量与序列化器空白分支；“空白档已守护”的结论可能过宽。先用最小反向破坏实验确认这些假绿风险，再决定是否修检查器。不要仅为增加检查数量而重复现有断言。
3. 在证据充分时只挑一个高价值嵌套结构（建议 `dungeonManagerState` 或 `pointManagerState`，按调用点和 fixture 实际样本选），用真实 fixture、序列化器、恢复器三边比对后添加具名 typedef 或更明确的运行时验证。每加一层运行 `npm run typecheck` 和目标差分场景。不能用 `any`、宽泛 `Object` 断言或猜字段让编译过。
4. U131 原有未提交改动的提交权属不明时，保留其状态并在报告里列出；只提交你能明确归属的新增切片，不夹带它。

#### 阶段 2：先补能直接观察到的行为证据

每个场景都遵循“真实入口/有效前提 → 两端各自发生目标事件 → 双端值相等 → 完整 DTO 相等 → 反向破坏能让断言变红”。先单跑，再跑整套 62+ 场景；检查场景顺序依赖，不能接受只在 `SCENARIO_FILTER` 下通过的结果。`tests/scenarios/save-mutations.mjs` 负责输入状态，`tests/engine-harness.js` 负责需要的只读观察器，`scripts/test-scenarios.mjs` 负责场景和断言。

1. **P-3 远古稀有度：优先。** 查 `loot/items.js`、`progression/statistics.js`、存档物品形态和掉落/拾取入口。构造一件合法 `rarity=4` 的物品，驱动原版已有拾取或记录路径；两端分别断言 `ancientItemsFound` 真正增长，再完整差分。不要调整稀有度概率、固定 LCG 或直接改统计字段。若只能人为改最终统计，则不能把“物品”行改 PASS。
2. **P-2 法术 cat=15：次优先。** 当前 16 类法术都有场景，15 类有直接可观测量；cat=15“发现财宝箱”只通过施法计数归因。先在原版和重构版各查到“财宝被设置为队伍目标”的等价字段或回调，做无副作用观察器，断言两端都观察到目标选择且值一致；加入未施法对照或反向破坏验证。不要用最终开箱统计充数，它曾单跑通过、全矩阵失败，受 AI 路径和场景顺序影响。若找不到等价观察点，明确保留 PARTIAL。
3. **P-7 Canvas 视口与状态：视耗时推进。** 现有 `rendered-scene` / `rendered-scene-narrow` 在两视口比较逐像素指纹。先选一个边界视口（如 375×667 或 1920×1080）加场景，保留固定输入和两端相同的视口/时间/随机流；若指纹差异出现，查第一个像素或渲染阶段分叉，不能改指纹算法或容差。只多一个视口依然是有限覆盖，验收矩阵应写清扩大了哪些组合，不能自动升 PASS。
4. **P-1 角色技能（若还有时间）。** 现有“买到技能”和少数战斗效果已有证据。先把 `content/skills/*`、`characters/stats.js`、`combat/skill-effects.js` 中“定义 → statType/效果字段 → 消费点 → 可观察结果”做表格；挑一个此前未直测、能稳定观察的技能族做完整差分。不要一夜强行铺 19 个升级或所有技能，尤其不要把“购买后 DTO 相等”写成“战斗效果逐项验证”。

阶段 2 的验收状态写回 `REFACTOR_REPORT.md` 附录 A 与 `docs/REMAINING-WORK.md`：有明确直接观测且所有门禁通过才关闭对应缺口。多版本真实存档 P-5 和真机长期稳定 P-6 需要外部样本/设备，可缩小缺口但不能伪造 PASS。

#### 阶段 3：一个能证明收益的架构切片

默认候选是**开局命令的所有权**。先完整追踪 `src/engine/adapter.js:startParty`、`src/engine/modules/views/party-creation.js` 中 `startButton.onclick` 的全部副作用、`runtime/game.js` 的队伍创建、`src/ui/party-builder.js` 的输入与 c2c 选择器。写一张迁移卡：旧调用链、拟议的唯一“创建小队”入口、谁负责校验、谁持有内部状态、旧按钮路径怎么共用它、哪些 DOM 选择器必须不变、失败如何回退。优先让产品命令与遗留按钮共用引擎内一个真实行为入口；不要复制开局逻辑，也不要只给 `onclick()` 包一层新名字。

实施范围限定在一个纵向切片。验收至少包含：推荐阵容建队/改名、非法阵容与重复名字的拒绝、原版存档载入后不可重复建队、c2c 选择器、刷新恢复、E2E 无 console/pageerror、差分原版正常开局路径。若发现遗留按钮流程和产品流程确有不可轻易分离的副作用，则把调用链、反例和最小安全下一步写入架构债台账，改选 `progression/statistics.js` 的一条具名记录入口；禁止硬拆。

改完用实数衡量：调用者此前必须知道几个视图私有字段/DOM 回调，之后需要知道什么；是否减少直接状态触碰；新增接口的参数和错误语义是否更简单；测试是否无需启动整个运行时即可覆盖一部分行为。`game` import 数或 SCC 数不变并不表示失败；接口变厚、参数层层传递、初始化更脆弱则是可推翻方案的证据。

#### 阶段 4：按剩余时间处理文档与类型噪音

- 15 条公式文档片段属于节选或拼接伪码。逐条判定：是真实逐字摘录则同步源码；是示意则显式标记并让 `scripts/check-doc-snippets.mjs` 识别该标记，保留原信息。不要靠删除片段取得“0 漂移”。
- 类型债务当前约 42 处 `@type {any}`、142 行 `unknown`（重跑精确计数）。优先一个交叉 typedef 消除多处重复 cast，例如 `views/expedition.js` 的 `createDomElements`；不要为了减数改构造器默认字段、原型链或大段复用变量行为。相关视图改动必须跑 E2E 与 Canvas 场景。
- P-6 可研究给 `scripts/measure-frames.mjs` 加原版同口径 headless 基线，但 rAF 间隔包含浏览器调度，不等于真机掉帧率；没有真实设备仍保持 PARTIAL。P-5 可测字段缺失健壮性，但构造档不能冒充真实历史版本。

### 五、门禁、证据与对抗性检查

每个独立切片至少跑 `npm run typecheck`、`npm run check`、`npm run test:parity`、目标 `SCENARIO_FILTER`、全量 `npm run test:scenarios`；碰 UI/开局/存档再跑 `npm run test:e2e`。收官逐项跑完 10 门禁：

```powershell
npm run lint
npm run build
npm run typecheck
npm run check
npm run test:parity
npm run test:scenarios
npm run test:e2e
npm run test:soak
npm run perf
npm run perf:frames
git diff --check
git diff --stat
git status --short --untracked-files=all
```

每条命令单独记录退出码和日志。性能使用同机、同环境、交替 A/B 与多次样本；不能拿一次比值或 headless rAF 数据声称真机改善。`test:soak` 的 8h/24h 是加速等价回合，不能当真实 24h 浏览器运行。Canvas 指纹只证明指定场景、指定浏览器与视口。完整 DTO 相等不能观察未序列化的效果、目标选择、DOM 或绘制；这些路径要各自直接测。新断言应临时故意破坏目标条件确认失败，再恢复并复跑。不要新增重复实现的测试或只会确认测试夹具被改过的空断言。

出现失败时按顺序问自己：是否复现于未改源码？是否只在某个场景顺序下失败？两端分别是否真的触发目标路径？第一个不同的随机消费、状态写入、DOM/Canvas 观察点在哪里？修的是代码、夹具还是错误的断言？必须保留原始失败和最小复现，不能用降低检查强度掩盖它。

### 六、最终交付与续跑格式

在 `docs/WORKSTATE.md` **顶部**追加本轮简要事实，更新 `docs/architecture-debt.md` 的迁移卡、指标和被否决方案；涉及验收矩阵才更新 `REFACTOR_REPORT.md` 附录 A 与 `docs/REMAINING-WORK.md`。旧文档里已过期的段落若会误导下一位 agent，应明确标成历史记录或修正当前态入口，不要让同一文件同时声称“工作树干净”和“有未提交 U131”。更新文档后运行 `npm run lint` 中的引用/计数检查。

最终中文报告必须包含：

1. 实际完成的每个切片、修改文件、为何比旧接口更易维护；未完成项单列。
2. 逐条命令、退出码、日志路径、关键场景与反向验证结果；当前 51 行矩阵有多少 PASS/PARTIAL/未覆盖，依据是什么。
3. 当前工作树改动的归属：起始已有 U131 哪些文件、你新增哪些文件、是否提交；不要把未提交的既有改动描述成自己完成。
4. 仍需外部提供的真实历史 `.c2save`、真机/低端设备条件，以及原版缺陷或 UI 设计决策点。没有这些条件时给可独立执行的后续动作，不停掉其他已授权工作。
5. 一个可直接复制给下一位 agent 的“继续从哪里开始”段落，包括最后一次全量门禁时间、失败项、当前切片、下一步最小动作。

每个切片的成果应可独立回退。若提交，只提交你明确拥有且已验证的切片，提交前检查暂存区；不得夹带原版资产、生成的 `output/`、别人正在编辑的 U131 文件。全程尊重用户已授权的可逆开发工作，遇到需要玩法或产品方向决策的点记录后继续推进其他切片。

## 本提示词的取证摘要（交接人记录）

- 当天重新运行的静态架构审计：93 个 `src` JS 文件、77 个引擎模块、564 条 import 边、49 个文件直接导入 `game`、55 节点 SCC、74 个初始化调用与 41 条初始化期跨模块依赖。审计命令：`npm run audit:arch -- --json`。
- 存档审计：已初始化顶层键在声明、fixture、序列化器各 30 个；空白档 4 个；嵌套类型只对 6 类 fixture 样本做 spot check。命令：`npm run audit:save-schema`。这批 U131 文件在交接时未提交。
- 交接时已复跑并通过：`npm run lint`、`npm run check`、`npm run test:parity`、`npm run test:e2e`、`npm run test:scenarios`（62/62）。soak、perf 和后续修改后的全套门禁须由执行代理再确认。
