# 剩余工作说明书（交接给下一个 agent）

> 生成时间：2026-09-27。基于 `REFACTOR_REPORT.md` 附录 A、`docs/WORKSTATE.md`、`docs/reverse-engineering/unresolved.md` 与当前 HEAD 的实测。
> **本文档只描述"没做完的部分"**；已完成的部分与证据见 `REFACTOR_REPORT.md`。
> **阅读顺序**：§1 红线 → §2 现状与验证命令 → §3 逐项缺口 → §5 建议顺序。**不要跳过 §1。**

---

## 1. 硬约束（违反即任务失败，不可协商）

这些是从 `archive/original/c2.js` 恢复出来的游戏，**行为正确性优先于一切**。任何"改善"都不得改变可观测行为。

| # | 红线 | 具体含义 |
|---|---|---|
| R1 | **不改数值/概率/曲线/节奏** | 暴击率、掉落率、XP 曲线、移速、药水时长、冒险点价格、离线收益、UI 尺寸一律不动 |
| R2 | **不改存档 JSON 键** | 存档格式是外部契约；运行时字段 ↔ 存档键的映射行必须同批修改。首选做法是直接用 DTO 键名命名字段 |
| R3 | **不改 RNG** | `SeededRandom` 是 JS 浮点变体 MT19937（seed 5489 首值 1859732469），**不得**替换成"更标准"的实现；不得改变随机调用**顺序**；下标参与贴图/存档的数组不得重排或去重（例：`shopSpriteNames` 里 `L2_Terrain077` 出现两次是**权重**，不是笔误） |
| R4 | **原版缺陷按原样保留** | 例：`combat/actions.js` 的 `getProjectileAnimation` 对空投射武器无保护（两端同点同错）。修它=制造差异，测试会红，且违背任务目标 |
| R5 | **禁止回退/覆盖**这些文件 | `archive/original/**`、`tests/fixtures/original.c2save`、`docs/symbol-map.json`（只增改不重置）、`docs/reverse-engineering/**`、`src/vendor/lz-string-1.3.3.js`、`output/perf/perf-baseline.json` |
| R6 | **禁止对引擎文件用 `git checkout --`** | 曾静默抹掉同批未提交的改名。要回退用 `git stash` + 逐字段确认 |
| R7 | **不许把 PARTIAL 写成 PASS** | 附录 A 的判定口径是本表自己的定义："PARTIAL = 已驱动但存在写明缺口"。本轮已因此把 7 行从 PASS 改判为 PARTIAL |

**工作流纪律**（每条都是踩过坑换来的）：
- 每批改动：取证（证据等级 HIGH 才落地）→ 改 → `node --check` 每个改动文件 → 跑门禁 → **回显退出码** → commit。
- 门禁命令**必须回显退出码**：`npm run x >output/g.log 2>&1; echo "X=$?"`。**禁止 `| tail`**——退出码会取自 tail，套件崩了也报成功。
- 任何"已修复/已覆盖"的声明，**必须有可复跑的检查覆盖到它**，否则等于没做（本轮真实踩过：3 条越界引用在报告里写了"已修好"，实际从未写入文件）。
- 新增断言**必须反向验证**（故意破坏 → 确认它会红）。本轮因此发现 3 处"写了却从未接上"的空断言。

---

## 2. 工程现状与验证命令（先跑一遍，建立基线）

```bash
npm install && npm run dev        # 开发服务器（部分门禁需要它）
npm run lint                      # 9 条不变量守卫（零依赖）
npm run typecheck                 # tsc，当前 0 错误
npm run check                     # 133 文件语法 + 15 单测
npm run test:parity               # 0/1/99/900 回合完整 DTO 相等
npm run test:scenarios            # 62 场景差分（可用 SCENARIO_FILTER=a,b 单跑）
npm run test:e2e                  # 浏览器 E2E
npm run test:soak                 # 8h/24h 等价回合
npm run perf && npm run perf:frames
node scripts/analyze-fields.mjs           # 混淆属性名（当前 0）
node scripts/check-spell-coverage.mjs     # 法术类别覆盖（当前 16/16，可观测量 15/16）
node scripts/check-achievement-requirements.mjs  # 成就定义表 ↔ 判定实现（328 条 × 28 类，已入 lint）
node scripts/check-doc-counts.mjs         # 文档可数指标 ↔ 源码实况（已入 lint）
node scripts/check-doc-snippets.mjs       # 文档片段漂移（当前 15/76）
node scripts/verify-doc-refs.mjs          # 文档 file:line 引用（当前 0 越界）
node scripts/audit-architecture.mjs       # 架构债只读审计（依赖图/SCC/初始化顺序/game 热点）
node scripts/find-invisible-name-files.mjs
node scripts/find-unused-modules.mjs
node scripts/show-field-backlog.mjs
node scripts/find-field-refs.mjs <owner> <names>
```

**当前实测基线**（2026-09-27 第二轮，日志 `output/g-*.log`）：10 门禁全绿；混淆字段 **0**；差分场景 **62/62**；验收矩阵 **45 PASS / 6 PARTIAL / 0 未覆盖**；`@type {any}` **42** 处；JSDoc `unknown` **142** 行；文档片段漂移 **15/76**。

---

## 3. 剩余工作逐项详解

### 3.1 验收矩阵的 PARTIAL（**主线工作**；2026-09-27 起为 6 条，P-4 已闭合）

判定口径：PASS = 有自动化检查真的驱动该系统并对它断言；PARTIAL = 已驱动但存在写明缺口。以下每项都给出「闭合它需要什么」与「完成定义」。

---

#### P-1 角色技能/技能树 — 缺"逐项技能的战斗效果"

- **现状**：`upgrades-purchased` 遍历每名角色的四棵技能树，两端各自断言 `upgrades1..4` 已解锁布尔位总数增长、`LearnSpellUpgrade`（type=6）实际购买、`spells` 数量增长，逐检查点完整存档相等。`skill-combat-effects` 直接对账了**两个**技能效果（战士多重攻击 `statType 18/19` → `performMultiAttack`；游侠跳弹链 `statType 23/24` → `createChainAction`），1,500 回合伤害飘字两端 149 次 / 累计 -52345 完全一致。
- **缺口**：其余被动属性类技能（`statType` 1-17、20-22、25-32）**没有逐项的战斗效果断言**。
- **已有可复用机制**：`tests/scenarios/save-mutations.mjs` 的 `withReclassedSpell` / `withCharacterClass` / `withEquippedItem` 变异器；`scripts/test-scenarios.mjs` 的步骤旗标 `damageNumbers` / `healNumbers` / `effectType` / `allyEffectType`。
- **闭合方案（建议）**：
  1. 先取证：读 `content/skills/*.js`（12 个职业各一文件）与 `characters/stats.js` 的 `StatComponent`，建立 `statType → 字段 → 消费点（file:line）` 对照表。
  2. 对**被动属性类**技能：不必造新场景——它们改的是 `stats` 字段，而 `stats` 全量参与完整存档 DTO 差分。真正缺的是"**该字段真的被读**"的证据。建议做法：仿照 `docs/reverse-engineering/facts.md#26-28` 记录过的那类缺陷（`movement.js` 曾把 `a.characteristic` 误读为 `a.statType`，武器特效静默丢失），写一个**读取点审计**：对每个 `statType` 字段列出全部读点 file:line，并断言"至少有 1 个非平凡读点"。
  3. 对**主动效果类**技能（多重攻击、跳弹链已覆盖）：按 `skill-combat-effects` 的模式补同类断言。
- **风险**：容易被"技能树点亮了就代表生效"误导。点亮 ≠ 生效——`movement.js` 那个缺陷就是点了技能但读错字段。**必须断言到消费点。**
- **完成定义（DoD）**：附录 A 该行的"缺口"文字被删除，改为"全部 `statType` 均有消费点证据（列出条数）"；`npm run test:scenarios` 全绿。
- **难度**：中高（需先建对照表，但建成后是机械工作）。

---

#### P-2 法术 — 仅 cat=15 仍为计数归因

- **现状**：16 个 `spellCategoryId`（1–6、8–17；目录中**不存在 cat=7**）各有专属场景，由 `scripts/check-spell-coverage.mjs` 机械核对。**15/16 有直接可观测量**：cat=1 治疗浮动文字（91 次 / +279）、cat=2/8 活怪物效果队列计数、cat=3 盟友效果队列计数（20 次）、cat=4/5/6/12/13 伤害浮动文字（379–559 次 / -4688 ~ -5943）、cat=9/10/11 随从数、cat=14 拾取统计、cat=16 昏迷前置、cat=17 伤害+随从双观测。
- **缺口**：**cat=15（`发现财宝箱` / `findTreasureSpell`）** 仍靠"唯一注入法术 + 施法计数增长 + 完整存档差分"归因。
- **为什么没做**：该法术的实现是 `combat/actions.js:719-724` —— `getRoomTreasure(game.treasure, room)` 命中后 `a.selected = true` 并 `party.setTargetTreasureChest(a)`。`selected` 是运行时字段（`loot/treasure.js:39`），**不入存档**；是否最终开箱取决于 AI 是否走到箱子。实测：用 `treasureChestsLooted` 增长做断言，**单跑通过、整矩阵失败**（场景顺序相关）→ 属 flaky，已回退。
- **闭合方案（选一，按推荐度排序）**：
  1. **加一个只读观察器**：仿 `tests/engine-harness.js` 的 `countEffectApplications`，新增 `countTreasureTargetAcquired(turns)` —— 逐帧扫描 `game.state.party`（原版侧需先查 `archive/original/c2.js` 对应字段）的目标财宝箱从 `null` 变为非 null 的次数。**只读、不消耗随机数**。断言两端 > 0 且相等。这样把"是否走到箱子"从断言里摘出去，只断言"法术确实选中了目标"。
  2. 或：在场景里额外做一步"手动把队伍挪到财宝所在房间"，使开箱成为确定事件。风险是引入了非原版的驱动路径。
  3. 或：接受现状，把该行缺口写得再明确一点（**最保守**）。
- **风险**：方案 1 需要先在原版侧找到等价字段（`archive/original/c2.js` 里 `setTargetTreasureChest` 对应的混淆名），并在 harness 里做双端分支——harness 的既有模式是 `original ? window.Game.xxx : game.xxx`。
- **DoD**：`node scripts/check-spell-coverage.mjs` 报"无直接可观测量 0 个"；矩阵该行缺口文字随之删除。
- **难度**：中（一个新观察器 + 双端字段名取证）。

---

#### P-3 物品 — 远古稀有度档位未出现

- **现状**：稀有度计数增长且两端相等。
- **缺口**：**远古（rarity 4）档位在 fixture 场景内从未出现**，因此该分支（`statistics.js:115` 的 `ancientItemsFound++`）从未被执行到。
- **关键事实（对方案有决定性影响）**：`loot/items.js` 的 `rollRarity` 用 `Math.random() * a` 逐档扣减 `itemRarityProbabilities`；而 harness **把 `Math.random` 替换成了固定 LCG**。所以稀有度在本测试环境下是**确定性**的——远古档没出现，是因为当前固定种子下它的概率没被命中，而不是"随机没抽到"。
- **闭合方案**：
  1. 用 `save-mutations.mjs` 的既有模式写一个变异器：把一件 `rarity=4` 的物品放进某个财宝箱/地面掉落，或直接塞进背包后驱动 `recordItemFound`。
  2. 断言 `snap.statistics.ancientItemsFound > base.statistics.ancientItemsFound`，两端相等。
  3. **必须先取证**：`rarity` 字段在存档 DTO 里的键名与取值域（查 `persistence/game-save.js` 的 Item 序列化段），不可臆造。
- **风险**：低。但注意**不要**为了"让远古出现"去调概率或换 LCG 种子（违反 R1/R3）。
- **DoD**：新场景（如 `ancient-item-found`）两端各自断言远古统计增长 + 完整存档相等；矩阵「物品」行缺口删除。
- **难度**：低（最容易闭合的一条，**建议第一个做**）。

---

#### P-4 成就 — requirementType 1-27 进度计算未逐项断言 — ✅ **已闭合（2026-09-27）**

- **结论**：该行已由 PARTIAL 升为 **PASS**。闭合证据（全部可复跑）：
  1. `scripts/check-achievement-requirements.mjs`（已挂进 `npm run lint`）：对 **328 条定义 × 28 种 `requirementType`** 表驱动核对——用 `achievementId` 命名约定独立推导"该读哪个统计字段"，与实现逐条对账（596 条非胜利类 + 210 条胜利类断言），并断言 `isVictoryAchievement ⇔ requirementType ∈ {23..27}` 与两个原版怪癖（未知类型 → `undefined` / `false`）。反向验证：把 `case 1` 改成读 `scrollKills` → 立刻报 11 处不符并指名 `monsterKills*`，恢复后转绿。
  2. `tests/unit/achievement-progress.test.mjs`：在**不启动 `runtime/index.js`、不构造 `game`** 的前提下覆盖 28 类字段映射、23-27 的 `requiredCount`/`characterClass` 分支、`partyMaxLevel` 惰性（非 16 类读取即失败）与兼容入口的耦合。反向验证：让 `partyMaxLevel` 提前求值 → 惰性测试立刻失败。
  3. `achievement-threshold-below` / `achievement-threshold-met` 两条差分场景：把 `farmsPurchased` 摆在 requiredCount=5 的两侧（4 与 5），同时把 `doorsOpened` 摆到恰好达标作为正对照，两端各自断言"未达成 / 已达成"后比较完整存档（矩阵 60 → 62）。反向验证：把 `case 9` 改成返回常量 → 场景立刻分叉并失败。
- **残留（不构成 PARTIAL，如实记录）**：两条场景的 verdict 断言在"实现分叉"时会先被完整存档比对拦下，因此它们实际保护的是**场景前提**（"这条场景真的坐在临界值两侧"）而不是行为分叉本身——与既有 `changed`/`unchanged` 一类"场景有效性断言"同性质。

---

#### P-5 旧版存档兼容 — 只有一份存档、一个版本

- **现状**：真实原版 fixture（`tests/fixtures/original.c2save`）解码/载入/推进全通；4,477 键审计确认全部语义化、无单字母键。
- **缺口**：**只有一份存档、一个版本**，没有多版本迁移样本。
- **这条大概率无法在本环境闭合**：需要更多真实历史存档（不同游戏版本导出的 `.c2save`）。仓库里没有第二份。
- **可行的部分闭合**：
  1. 用**构造法**覆盖字段级向后兼容：写变异器，逐个**删除**存档 DTO 里的可选字段，断言载入不崩且用默认值补齐（这验证的是 `game-save.js` 恢复路径的健壮性，而非真实历史版本）。
  2. 用**版本号字段**（若存档里有）构造"旧版本号 + 新结构"的组合。
- **必须先取证**：存档里是否有版本字段、恢复路径对缺失字段的行为（是 `undefined` 还是默认值）。查 `persistence/game-save.js` 与 `persistence/entities.js`。
- **DoD（可达成的版本）**：新增"字段缺失健壮性"场景并全绿；矩阵该行缺口改写为"多版本真实存档样本仍缺（需外部提供）"——**这是 PARTIAL 的合理终态**，不要硬写成 PASS。
- **难度**：中（可部分闭合，无法完全闭合）。

---

#### P-6 长期稳定性 — 加速等价回合，未测真机

- **现状**：`test:soak` 跑 8h/24h 等价回合（115,200 / 345,600 回合），两端完整存档相等；CDP 主动 GC 后堆采样：原版 6.28→6.30 MB、重构 7.11→7.13 MB，增量同为 ~0.02 MB。重构版相对原版有约 **0.83 MB 稳定偏移**（非增长，来源是 ES 模块化后的模块对象）。
- **缺口**：soak 是**直接推回合**（加速），不是真机帧循环；未测真机帧时间、长时间真实运行、低端设备。
- **这条也无法在本环境闭合**：需要真机（或至少真实浏览器长跑 + 帧时间采集）。
- **可行的部分闭合**：
  1. 用 Playwright 的 CDP 采集**真实帧循环**下更长的 P95/P99 帧时间（现有 `perf:frames` 只测 599 帧、两种页面状态），例如 10 分钟真实 rAF 跑批。
  2. 仍缺**原版页面同口径基线**——这是关键缺口，且原版页面可以加载（`archive/original/index.html`），**理论上可测**。若能补上，这条可显著收窄。
- **风险**：headless 的 rAF 不受 vsync 约束，间隔含浏览器调度时间，**不能当作真机掉帧率**。任何结论都要带这个限定。
- **DoD（可达成版本）**：补上"原版页面同口径帧时间基线"；矩阵该行缺口改写为"真机/低端设备仍缺（需真机）"。
- **难度**：中（补原版基线可行且价值高）。

---

#### P-7 Canvas 渲染 — 指纹只在 2 场景 × 2 视口

- **现状**：`rendered-scene`（默认视口 1,300 帧）+ `rendered-scene-narrow`（700×900 视口 1,300 帧），两端主画布逐像素 FNV-1a 指纹相同、落盘存档一致、渲染异常纳入失败条件；E2E 另有 1440/1024/375 三档视口的 DOM 溢出与面板检查。
- **缺口**：逐像素指纹只覆盖 2 场景 × 2 视口；未覆盖全部视口/分辨率组合，未做跨浏览器比对。
- **关键事实**：`scripts/test-scenarios.mjs:761-763` 已支持场景声明 `viewport: {width, height}`，在两端同时 `setViewportSize`。**加视口是改配置，不是写代码。**
- **闭合方案（最省力的一条）**：
  1. 复制 `rendered-scene-narrow` 的步骤体，新增若干场景：例如 `rendered-scene-wide`（1920×1080）、`rendered-scene-tiny`（375×667）、`rendered-scene-tall`（900×1600），各自 1,300 帧 + 指纹断言。
  2. 注意成本：每个 frames 场景要跑 1,300 帧 × 两端，**矩阵总时长会线性上升**。建议挑 2 个有代表性的（如最窄 + 最宽），而不是全铺。
  3. 若要覆盖不同**游戏内状态**（远征视图 / 冒险点面板 / 战斗特效密集 / 地牢切换），需要新的变异器与场景，成本高得多。
- **风险**：低。但注意指纹对**任何**渲染差异都敏感——如果某个视口下两端真的有差异，那是**真缺陷**，不要改指纹算法或容差来"过"。
- **DoD**：至少新增 1 个视口的逐像素指纹场景并全绿；矩阵该行缺口改写为"仍为有限视口组合（列出实际覆盖）"。
- **难度**：低（**与 P-3 并列最易**）。

---

### 3.2 15 条"节选/伪码"型文档片段

- **现状**：`docs/formulas/{combat,items,progression}.md` 共 76 条内嵌 JS 片段；`scripts/check-doc-snippets.mjs` 报 **61 条已与源码逐字同步**，**15 条漂移**。
- **性质**：这 15 条**不是"忘了同步"，而是它们本身就不是逐字摘录**——含 `...` 省略号、或把跨多处/跨文件的代码拼成一段"伪码"。因此自动重同步的相似度判据（≥50%）不成立。
- **清单**（`node scripts/check-doc-snippets.mjs` 输出，格式 `文档位置 -> 源码位置`）：
  | 文档 | 声明的位置 | 问题 |
  |---|---|---|
  | `docs/formulas/combat.md:202` | `combat/scrolls.js:22-34` | 首行即不同 |
  | `docs/formulas/combat.md:1165` | `ai/targeting.js:29-51` | 含 `…` 省略号 |
  | `docs/formulas/combat.md:1397` | `combat/encounters.js:266-282` | 首行即不同 |
  | `docs/formulas/items.md:70` | `loot/items.js:332-343` | 首行即不同 |
  | `docs/formulas/items.md:274` | `loot/items.js:77-111` | 含 `...` |
  | `docs/formulas/items.md:390` | `characters/character.js:1195-1207` | 首行同、后文不同 |
  | `docs/formulas/items.md:438` | `combat/actions.js:326-414` | 首行即不同 |
  | `docs/formulas/items.md:452` | `combat/actions.js:374-403` | 首行同、后文不同 |
  | `docs/formulas/items.md:480` | `simulation/characters.js:298-325` | 首行即不同 |
  | `docs/formulas/items.md:551` | `simulation/characters.js:309-313` | 首行即不同 |
  | `docs/formulas/items.md:584` | `characters/character.js:142-184` | 第 5 行不同 |
  | `docs/formulas/progression.md:343` | `progression/points.js:6-25` | 单行压缩形态 |
  | `docs/formulas/progression.md:561` | `simulation/tick.js:214-236` | 首行即不同 |
  | `docs/formulas/progression.md:631` | `progression/achievements.js:34-47` | 第 2 行不同 |
  | `docs/formulas/progression.md:724` | `persistence/entities.js:283-319` | 首行同、后文不同 |
- **闭合方案（二选一，建议逐条判断而非一刀切）**：
  - **A. 转成逐字摘录**：若该片段本意就是"这段代码长这样"，就把 ref 的行号范围与内容都改成与源码一致（`check-doc-snippets.mjs --rewrite` 会在相似度 ≥50% 时自动做，其余需手工定位）。
  - **B. 明确标注为"节选/伪码"**：若片段本就是示意（含 `...`、或跨文件拼接），**在片段上方加一行**"（节选，非逐字摘录；权威以 `file:line` 指向的源码为准）"，并**同时修正 `check-doc-snippets.mjs` 让它跳过被显式标注的片段**（加一个 `<!-- snippet: abridged -->` 或代码块语言标记 ` ```js-abridged ` 的约定）。
- **推荐**：做 **B**。因为 A 对这些片段不成立（它们本就是示意），硬改成逐字摘录会**丢失"这里有两处调用"这类信息**。B 同时让检查器变成"0 漂移"，把噪音消掉。
- **风险**：低。唯一要求是**不要为了让检查器变绿而删掉信息**。
- **DoD**：`node scripts/check-doc-snippets.mjs` 报 0 漂移，且每处改动都能说清"为什么这条是节选"。
- **难度**：低。

---

### 3.3 M10 类型债务（42 处 `any` + 142 行 `unknown`）

- **现状**：`tsc` 0 错误；77/77 引擎模块无 `@ts-nocheck`；0 处 `@ts-ignore`/`eslint-disable`。**但**仍有 42 处 `@type {any}`（精确统计命令见下）。
- **分布**（按文件降序）：
  ```
  views/expedition.js 7      simulation/tick.js 4      views/party-creation.js 3
  views/monsters.js 3        views/base.js 3           characters/party.js 3
  world/initialization.js 2  views/navigation.js 2     runtime/game.js 2
  rendering/sprites.js 2     persistence/entities.js 2 characters/minions.js 2
  views/results.js 1         world/{regions,pathfinding,dungeons}.js 各 1
  loot/items.js 1            combat/scrolls.js 1       ai/targeting.js 1
  合计 42（命令：grep -ro "/\*\* @type {any} \*/" src/ | wc -l；**不要**用宽松的 @type {any} 匹配，会把注释里的提及也算进去）
  ```
- **根因（结构性，不是"没写完"）**：
  1. **原型后挂载**：本项目用 `function X(){}` + `initializeXxx()` 里逐条 `X.prototype.m = function(){}`。tsc 在**函数边界**外看不到这些成员，于是调用点写成 `(/** @type {any} */ (this)).m()`。
  2. **AST 恢复期的变量复用**：`var a,b,c` 承载不同形状的值（如 `simulation/tick.js` 的三元表达式 cast）。
- **已经试过并失败的方案（省得重试）**：给 `views/base.js` 的 `View` 加 `@property {boolean} visible` **tsc 不认**；给构造器补 `this.visible = true` **会改变对象形状与 `isVisible()` 返回值**，违反 R1/R4 → 已回退，这三处 cast **保持原样**。
- **可行的收窄配方（按收益/风险排序）**：
  1. **一个 typedef 消掉多处 cast**（收益最高）：`views/expedition.js` 的 4 处 `createDomElements()` 可用一个 `& { createDomElements: () => void }` 交叉类型消掉；`views/monsters.js`、`views/party-creation.js` 同理。**已完成的先例**：`views/results.js` 的 9 处 → 1 个 `OfflineProgressViewWithCells` typedef（该文件 `any` 9 → 1）。
  2. **表达式型 cast**（如 `tick.js` 的三元）：需要先把复用变量按分支拆成不同类型——**属"重写函数"，风险高，收益低，建议不动**。
  3. **绝不**为了消 cast 而改运行时行为（补默认字段、改原型链）。
- **另一条更高价值的线索**：`persistence/save-dto.js` 是 **119 行纯 JSDoc typedef 的 schema 文件**（无运行时导出），目前**未被任何 `@type` 引用**——它是"可加载但未生效"的类型资产。把它接到 `game-save.js` 的序列化/恢复函数上，可获得**真正的存档形状校验**（能抓到"运行时字段 ↔ 存档键"映射写错）。这是 M10 最值得做的一步，但它**触碰存档路径**，必须在差分矩阵保护下逐函数推进，且**不得改任何存档键**（R2）。
- **DoD**：不设"归零"目标（不现实）。可达成目标是：① 把 43 降到 ~25（做完配方 1 的所有可做项）；② 完成 `save-dto.js` 接线并保持 tsc 0 错误 + 10 门禁全绿；③ `docs/m10-type-debt.md` 的数字随之更新。
- **难度**：配方 1 低；`save-dto.js` 接线中高（触碰存档，需谨慎）。

---

### 3.4 未决台账仍开放的两项

`docs/reverse-engineering/unresolved.md`：
- **U4（差分覆盖缺口）**：主体已关闭（城堡征服、Blast Stun 直接计数、16 类法术场景等）。**残留**：法术归因口径（= 上面的 P-2）与"怪物/首领 AI 施法、卷轴施法两条入口未按类别单独设场景"。
- **U7（UI 独占路径）**：升级长尾、农场收获、拾取类型已大量闭合。**残留**：`views/upgrade-details.js` 的 19 个升级实现未逐项驱动；逐件手动装备未专项驱动；DOM 点击路线已实测不可行（按钮全为 `disabledUpgradeButton` 且矩形 0×0）。
- **DoD**：U4 随 P-2 收口；U7 需为每个未覆盖的 `Upgrade` 子类写变异器 + 场景，工作量线性于 19。

---

### 3.5 P4 类（**不属于可执行任务，须先问用户**）

交接文档 §9-P4 明说："需要产品决策的冲突（例如是否修原版缺陷、是否 UI redesign）**不属于本任务**；如要推进，先问用户。"
具体包括：
- 是否修复原版缺陷（如 `getProjectileAnimation` 的空值解引用）——**当前按 R4 原样保留**，修它需要用户明确授权。
- 是否做 UI 重设计。
- 真机帧时间/低端设备测试（需真机）。
- 多版本真实存档样本（需外部提供 `.c2save`）。

---

## 4. 每一项的验收命令速查

| 项 | 验收命令 | 期望 |
|---|---|---|
| P-1 技能 | `npm run test:scenarios` | 全绿；附录 A 该行缺口文字被替换 |
| P-2 法术 | `node scripts/check-spell-coverage.mjs` | "无直接可观测量 0 个" |
| P-3 物品 | `SCENARIO_FILTER=<新场景> npm run test:scenarios` | 通过且远古统计两端增长 |
| P-4 成就 ✅ | `npm test` + `npm run test:scenarios` + `node scripts/check-achievement-requirements.mjs` | 15 单测通过 + 2 条新场景全绿 + 表驱动核对 0 不符（**2026-09-27 已闭合**） |
| P-5 存档 | `npm run test:parity` + `npm run test:scenarios` | 全绿；缺口改写为"需外部样本" |
| P-6 帧时间 | `npm run perf:frames` | 有原版同口径基线（新增） |
| P-7 渲染 | `npm run test:scenarios` | 新视口场景指纹两端相同 |
| 文档片段 | `node scripts/check-doc-snippets.mjs` | 0 漂移 |
| 类型 | `npm run typecheck && npm run lint` | tsc 0 错误 + 9 不变量绿 |
| **总门禁** | `npm run lint && npm run build && npm run typecheck && npm run check && npm run test:parity && npm run test:scenarios && npm run test:e2e && npm run test:soak && npm run perf && npm run perf:frames` | **10/10 退出码为 0** |

---

## 5. 建议推进顺序（按"收益 ÷ 风险"排序）

1. **P-3 远古稀有度** — 最简单，一条场景即可把 1 条 PARTIAL 推向 PASS。**先做这个建立手感。**
2. ~~**P-4 成就 requirementType**~~ — ✅ 已于 2026-09-27 闭合（表驱动检查 + 表驱动单测 + 两条临界值差分场景）。
3. **P-7 渲染多视口** — 改配置即可，能再推 1 条（或至少显著收窄）。
4. **P-2 法术 cat=15** — 需一个新观察器 + 原版字段名取证，中等工作量。
5. **P-6 原版帧时间基线** — 原版页面可加载，补基线价值高。
6. **3.2 文档片段** — 独立、低风险，可与其他并行。
7. **P-1 技能逐项** — 需先建 `statType → 消费点` 对照表，最费时但价值最高（能抓到"点了技能但读错字段"这类静默缺陷）。
8. **P-5 存档多版本** — 只能部分闭合，最后做。
9. **3.3 类型债务** — 长期债，穿插做配方 1；`save-dto.js` 接线单独排期。

**每完成一项都要**：更新 `REFACTOR_REPORT.md` 附录 A 对应行的判定与缺口文字 + `docs/WORKSTATE.md` 顶部加一条 bullet（含符号、证据、命令）+ 单独 commit。

---

## 6. 明确不要做的事

- ❌ 不要为了"让测试变绿"而改断言、改容差、改指纹算法。**红就是红，先判"谁分叉"（原版还是重构版）**，见 `unresolved.md` 的方法论。
- ❌ 不要删掉任何"看起来没用"的东西——先按 §71 的 Dead Code 判定（搜不到调用 ≠ dead code；要查动态访问、字符串访问、外部 userscript 契约）。
- ❌ 不要动 `archive/original/**`（连格式化都不要）。
- ❌ 不要引入新依赖来解决类型/测试问题（现有 devDependencies 只有 babel 三件套 + playwright + typescript）。`npm run lint` 是**零依赖**的，请保持。
- ❌ 不要把 PARTIAL 写成 PASS；也不要因为"只剩 1/16"就把它写成 PASS。
- ❌ 不要在 commit message 里写反引号（会被 shell 当命令替换执行，本轮因此凭空生成了两个 0 字节文件并被提交）。

---

## 7. 环境陷阱（本机 Windows + Git-Bash，已实测）

| 现象 | 原因 | 对策 |
|---|---|---|
| `spawnSync`/`execFileSync` 用管道 stdio 必抛 `EBUSY` | 本机环境限制 | 用 `stdio:'inherit'` 或异步 `spawn`（`scripts/check.mjs` 已如此） |
| 一轮内批量删除超过 ~50 个文件失败 | 注入的 `node-safe-delete-shim` 按"每 agent 轮次 50 次删除"限额 | 分批删；`fs.cp` 整目录覆盖也会假红，`scripts/build.mjs` 已改**增量拷贝** |
| 内联 `node -e "…"` 里的 `${}` 或反引号被 shell 吃掉 | shell 展开 | 复杂脚本写成文件再跑（`output/` 已 gitignore，可放临时脚本） |
| `git add` 报 LF/CRLF warning | 仓库多为 CRLF | 噪音，忽略 |
| 后台跑长命令（soak/perf）时前台门禁超时 | 命令耗时长 | 用 `run_in_background`，完成后会收到通知，**不要轮询** |

---

## 8. 一句话交接

**可执行的清单（P0–P3）已 100% 完成；剩下的是"证据广度"与"类型债务"两类。**
本环境**物理上无法闭合**的是：真机帧时间/低端设备、多版本真实存档样本。**其余 6 条 PARTIAL（P-1/P-2/P-3/P-5/P-6/P-7）+ 15 条文档片段 + 类型债务都可以推进**，且 P-3 与 P-7 各自只需一条场景/一次配置改动就能把一条 PARTIAL 真正推向 PASS。
**请从 §5 的第 1 项开始，并严格遵守 §1 的红线。**
