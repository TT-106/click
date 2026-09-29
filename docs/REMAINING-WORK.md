# 剩余工作说明书（交接给下一个 agent）

> 本文件主要跟踪 U134 恢复与差分矩阵的历史范围。用户要求的完整命名与架构现代化仍在进行，当前状态见 `docs/modernization-status.md`。

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
npm run lint                      # 10 条不变量守卫（零依赖）
npm run typecheck                 # tsc，当前 0 错误
npm run check                     # 140 文件语法 + 24 单测
npm run test:parity               # 0/1/99/900 回合完整 DTO 相等
npm run test:scenarios            # 89 场景差分（可用 SCENARIO_FILTER=a,b 单跑）
npm run test:e2e                  # 浏览器 E2E
npm run test:soak                 # 8h/24h 等价回合
npm run perf && npm run perf:frames
node scripts/analyze-fields.mjs           # 混淆属性名（当前 0）
node scripts/check-spell-coverage.mjs     # 法术类别覆盖（当前 16/16，可观测量 16/16，U132 起 cat=15 闭合）
node scripts/check-achievement-requirements.mjs  # 成就定义表 ↔ 判定实现（328 条 × 28 类，已入 lint）
node scripts/check-doc-counts.mjs         # 文档可数指标 ↔ 源码实况（已入 lint）
node scripts/check-doc-snippets.mjs       # 片段检查（当前 0 漂移 + 18 条已标注节选，见 §3.2）
node scripts/verify-doc-refs.mjs          # 文档 file:line 引用（当前 0 越界）
node scripts/audit-architecture.mjs       # 架构债只读审计（依赖图/SCC/初始化顺序/game 热点）
node scripts/find-invisible-name-files.mjs
node scripts/find-unused-modules.mjs
node scripts/show-field-backlog.mjs
node scripts/find-field-refs.mjs <owner> <names>
```

**当前实测基线**（2026-09-28 U134 后，日志 `output/u134-*.log`）：10 门禁全绿；混淆字段 **0**；差分场景 **89/89**；验收矩阵 **47 PASS / 4 PARTIAL / 0 未覆盖**（P-1 缺口大幅收窄：32/32 statType 消费映射，分级 L3×8/L2×24/L1×0，U133 期间新增 21 条场景 + U134 新增 2 条（U7 EquipItemUpgrade 拾取先行、P-7 竖长视口），见 `docs/p1-skill-consumption.md`）；`@type {any}` **42** 处；JSDoc `unknown` **142** 行；文档片段 **0 漂移（18 条已标注节选，U133）**。

---

## 3. 剩余工作逐项详解

### 3.1 验收矩阵的 PARTIAL（**主线工作**；2026-09-27 彻夜会话起为 4 条：P-2/P-3 已闭合，剩 P-1/P-5/P-6/P-7）

判定口径：PASS = 有自动化检查真的驱动该系统并对它断言；PARTIAL = 已驱动但存在写明缺口。以下每项都给出「闭合它需要什么」与「完成定义」。

---

#### P-1 角色技能/技能树 — 映射表全量交付（U133 定稿：L3×8/L2×24/L1×0），仍 PARTIAL

- **现状（U133 定稿）**：全量消费映射表 `docs/p1-skill-consumption.md` 交付——32/32 种 statType
  均有真实战斗路径消费点（file:line 人工核读），分级 **L3 ×8（17/18/19/23/24/30/31/32 的直接战斗差分）、
  L2 ×24（公式探针 2-7/10 共 7 种 + 字段写入探针 1/8/9/11-16/20-22/25/26/27-29 共 17 种）、L1 ×0**。
  U133 期间新增 15 条技能族差分/探针场景；基础设施：`purchaseCharacterSkill`（前置链顺序购买）、
  `readStatValue`/`readAttackCooldown`/`readSummonLimit`/`readBuffPotencies`/`readSkillFields`/
  `readRegenBonus` 只读探针。反向验证逐 case 的记录见映射表与 `output/overnight-u133/progress.md` CP15-17。
- **缺口（精确，U133 定稿后）**：L2 的 24 种仍是"公式/字段写入探针直读"，不是战斗效果活体差分。
  **已以证据否决的路径（不得重试）**：statType 11-15 活体量级对账（治疗/增益浮动文字无施法者/目标归因，
  目标 maxHealth 与动画帧数是引擎内部量）；statType 16 施法次数对账（需跨场景基线，RNG 流不可比，
  已由 22→18 公式探针替代）；buff-potency 后段 9000 回合活体窗口（固定窗口内 0 次效果，
  按位置敏感场景否决并移除，字段探针保留）；statType 28/29 活体化（受 R4 空投射武器缺陷限制，
  仅 turns:0 写入侧探针）。**在 8 种 L3 之外取得新的可靠活体证据前该行保持 PARTIAL。**
- **已有可复用机制**：`tests/scenarios/save-mutations.mjs` 的 `withReclassedSpell` / `withCharacterClass` / `withEquippedItem` 变异器；`scripts/test-scenarios.mjs` 的步骤旗标 `damageNumbers` / `healNumbers` / `effectType` / `allyEffectType`。
- **历史方案（已执行）**：本节原先建议的"先建 `statType → 字段 → 消费点` 对照表 + 读取点审计"
  已于 U133 完成——映射表即交付物（静态 grep + 人工核读；动态属性访问与原型后挂载的漏报风险
  已在表头"审计边界"声明）。
- **风险**：容易被"技能树点亮了就代表生效"误导。点亮 ≠ 生效——`movement.js` 那个缺陷就是点了技能但读错字段。新证据必须断言到消费点或活体效果。
- **完成定义（DoD）**：新的活体差分证据入映射表并升级对应分级，附录 A 该行缺口文字随之改写；`npm run test:scenarios` 全绿。
- **难度**：高（剩余路径均需绕开已否决的归因障碍，机械增量已用尽）。

---

#### P-2 法术 — 仅 cat=15 仍为计数归因 — ✅ **已闭合（2026-09-27 彻夜会话）**

- **结论**：该行已由 PARTIAL 升为 **PASS**（16/16 类有直接可观测量，`check-spell-coverage.mjs` 报"无直接可观测量 0 个"）。
- **闭合方式**：`tests/engine-harness.js` 新增 `countSelectedTreasure({turns})` 只读观察器——财宝目标的 `selected` 旗标（原版 `el`）全库只有两个写点：`findTreasureSpell`（`actions.js:721` ↔ `c2.js:20955`）与财宝房 UI 按钮（`c2.js:27719`，场景从不驱动）；且该法术的 AI 行为评分（`behaviors.js` 的 `getFinalScore`）只在"所在房间有未开启、未选中财宝"时非零，故**施法成功 ⟺ selected 被置真**。关键实现细节：**必须逐帧统计 false→true 跳变**而非终态计数——`setChestOpened`（`loot/treasure.js:41`）会在开箱时把 `selected` 清回 false（AI 会自然开箱，实测 4 次施法后终态为 0）。`spell-find-chest` 场景改用该观察器推进 3000 回合，实测两端各 **4 次跳变**且相等；`selected` 不入存档，是 DTO 差分盲区之外的独立证据。反向验证：删掉重构侧 `a.selected = true` → 场景立刻变红。
- **原 DoD 已满足**：`node scripts/check-spell-coverage.mjs` 报 0；附录 A「法术」行缺口文字已删除。

---

#### P-3 物品 — 远古稀有度档位未出现 — ✅ **已闭合（2026-09-27 彻夜会话）**

- **结论**：该行已由 PARTIAL 升为 **PASS**。新场景 `ancient-item-found`（矩阵 62 → 63 起步）。
- **闭合方式**：`tests/engine-harness.js` 新增 `seedAncientItemDrop({maxTurns, rarity})`——两端**各自引擎的 `generateItem`**（原版 `Nv`，c2.js:20619）构造一件合法 rarity=4 物品（随机消费两端同序，名字/数值走原版生成路径，远古名字池产出如「独步荒废之徒劳的剑」），作为**真实 ItemDrop**（原版 `zv`，c2.js:20453）放进某队员所在房间脚下，随后完全交给原版 AI 的认领→行走→拾取路径（`TravelWorldBehavior` → `targetItemDrop` → actionType 6 → `character.js` 拾取分支的 `recordItemFound` case 4）。fixture 队伍从世界地图出发（roomId=-1），harness 先推进到有人进房再放置。断言：两端 `drop.collected`（原版 `gc`）为真、拾取与等进房回合数两端相等、`ancientItemsFound` 增长、拾取后完整 DTO 相等（远古物品以一致字段进入同一队员 inventory）。
- **踩坑记录**：原版 Vector2（`Za`，c2.js:7014）的字段是 **`T`/`U`** 而非 `x`/`y`——首版给 `zv` 传了 `undefined` 坐标导致掉落永不倍认领，已修。
- **反向验证**：把重构侧 `case 4` 的 `ancientItemsFound++` 删掉 → 场景立刻分叉变红；恢复后转绿。
- **不越线**：不掉概率、不碰固定 LCG、不直接写统计字段（原 DoD 的约束全部保持）。

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

#### P-7 Canvas 渲染 — 已扩到 7 条指纹场景 × 5 视口 + 2 游戏内状态，仍为有限组合

- **现状（U134 更新）**：`rendered-scene`（默认视口）+ `rendered-scene-narrow`（700×900）+ `rendered-scene-wide`（1920×1080）+ `rendered-scene-tiny`（375×667）+ **`rendered-scene-tall`（900×1600，U134 新增）**，各自 1,300 帧真实帧循环，两端主画布逐像素 FNV-1a 指纹相同、落盘存档一致、渲染异常纳入失败条件；游戏内状态维度另有 `rendered-scene-spellstorm`（特效密集）与 `rendered-scene-farm`（农场主题）；E2E 另有 1440/1024/375 三档视口的 DOM 溢出与面板检查。新场景全部追加在矩阵末尾，不扰动既有场景的采样窗口。
- **缺口**：仍为有限视口组合（当前 7 条指纹场景：5 视口 + 2 游戏内状态）；未覆盖全部视口/分辨率/**游戏内状态**组合（远征视图/冒险点面板/地牢切换各有独立布局），未做跨浏览器比对。矩阵该行**维持 PARTIAL**（按 R7 不因覆盖扩大而升 PASS）。
- ~~**可行的下一步**：按旧方案补 `rendered-scene-tall`（900×1600）等更多视口~~ —— `rendered-scene-tall` 已于 U134 交付；再扩是纯配置，更高价值但成本高的是覆盖不同游戏内状态。
- **DoD（不变）**：每加一个组合都要全绿且不能改指纹算法或容差；若某视口下两端真有差异，那是真缺陷。

---

### 3.2 文档片段节选标注 — ✅ **已闭合（U133）**

- **结论**：`check-doc-snippets.mjs` 报 **0 漂移 + 18 条已标注节选（ref 均验证可解析）**，exit 0。
- **闭合方式**：检查器新增 `<!-- snippet: abridged -->` 标注约定——ref 行上一行有该标注即声明"本片段是节选/伪码示意"。**标注只豁免内容比对，不豁免 ref 可解析性与行号边界**（标注损坏同样 exit 1，防止用标注绕过检查）。18 条逐一插入标注（combat 6 / items 8 / progression 4）。
- **反向验证 ×3**：①篡改一条未标注的逐字片段 → 漂移 1、exit 1；②已标注片段引用不存在文件 → "标注损坏 1"、exit 1；③已标注片段行号越界（99999）→ exit 1。恢复后 0 漂移。
- **历史说明**：原记录 15 条低估——combat.md:424/771/936 三条 tick.js 漂移在本轮之前已存在（双方文件均不在本轮 diff 内）。
- **清单**（`node scripts/check-doc-snippets.mjs` 输出，格式 `文档位置 -> 源码位置`）：
  | 文档 | 声明的位置 | 问题 |
  |---|---|---|
  | `docs/formulas/combat.md:202` | `combat/scrolls.js:22-34` | 首行即不同 |
  | `docs/formulas/combat.md:424` | `simulation/tick.js:413-430` | 首行即不同（U133 复核补录：本轮之前已漂移） |
  | `docs/formulas/combat.md:771` | `simulation/tick.js:788-800` | 首行即不同（同上补录） |
  | `docs/formulas/combat.md:936` | `simulation/tick.js:339-355` | 首行即不同（同上补录） |
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
- **DoD（已达成）**：0 漂移 + 每处标注均有 §3.2 清单中的"为什么是节选"依据（含 `...`/跨文件拼接/伪码）。
- **难度**：低。

---

### 3.3 M10 类型债务（41 处 `any` + 146 行 `unknown`，R25 轮实测）

- **现状**：`tsc` 0 错误；77/77 引擎模块无 `@ts-nocheck`；0 处 `@ts-ignore`/`eslint-disable`。**但**仍有 41 处 `@type {any}`（精确统计命令见下；R25 轮实测）。
- **分布**（按文件降序）：
  ```
  views/expedition.js 7      simulation/tick.js 4      characters/party.js 3
  views/base.js 3            views/monsters.js 3       characters/minions.js 2
  persistence/entities.js 2  rendering/sprites.js 2    runtime/game.js 2
  views/navigation.js 2      views/party-creation.js 2 world/initialization.js 2
  ai/targeting.js 1          combat/scrolls.js 1       loot/items.js 1
  views/results.js 1         world/{regions,pathfinding,dungeons}.js 各 1
  合计 41（命令：grep -ro "/\*\* @type {any} \*/" src/ | wc -l；**不要**用宽松的 @type {any} 匹配，会把注释里的提及也算进去）
  ```
- **根因（结构性，不是"没写完"）**：
  1. **原型后挂载**：本项目用 `function X(){}` + `initializeXxx()` 里逐条 `X.prototype.m = function(){}`。tsc 在**函数边界**外看不到这些成员，于是调用点写成 `(/** @type {any} */ (this)).m()`。
  2. **AST 恢复期的变量复用**：`var a,b,c` 承载不同形状的值（如 `simulation/tick.js` 的三元表达式 cast）。
- **已经试过并失败的方案（省得重试）**：给 `views/base.js` 的 `View` 加 `@property {boolean} visible` **tsc 不认**；给构造器补 `this.visible = true` **会改变对象形状与 `isVisible()` 返回值**，违反 R1/R4 → 已回退，这三处 cast **保持原样**。
- **可行的收窄配方（按收益/风险排序）**：
  1. **一个 typedef 消掉多处 cast**（收益最高）：`views/expedition.js` 的 4 处 `createDomElements()` 可用一个 `& { createDomElements: () => void }` 交叉类型消掉；`views/monsters.js`、`views/party-creation.js` 同理。**已完成的先例**：`views/results.js` 的 9 处 → 1 个 `OfflineProgressViewWithCells` typedef（该文件 `any` 9 → 1）。
  2. **表达式型 cast**（如 `tick.js` 的三元）：需要先把复用变量按分支拆成不同类型——**属"重写函数"，风险高，收益低，建议不动**。
  3. **绝不**为了消 cast 而改运行时行为（补默认字段、改原型链）。
- ~~**另一条更高价值的线索**：`persistence/save-dto.js` 未被任何 `@type` 引用~~ —— **已完成**：U131 接线 `createSaveState` 返回与 `restoreGameState` 解析；U132 起 `dungeonManagerState`、U133 起 `pointManagerState`、U134 起 `monsterTypes`（三层 + 恢复/序列化两侧接线 + 审计 3 条 spot-check）均已具名 typedef 并挂进 `SaveData`。**剩余**：`world`/`statistics`/`castleManager`/`shopManager` 等仍为 `{Object}`，照同一套路（typedef + fixture 核对 + spot-check + 负向编译验证）增量推进即可。
- **DoD**：不设"归零"目标（不现实）。可达成目标是：① 把 43 降到 ~25（做完配方 1 的所有可做项）；② 完成 `save-dto.js` 接线并保持 tsc 0 错误 + 10 门禁全绿；③ `docs/m10-type-debt.md` 的数字随之更新。
- **难度**：配方 1 低；`save-dto.js` 接线中高（触碰存档，需谨慎）。

---

### 3.4 未决台账仍开放的两项

`docs/reverse-engineering/unresolved.md`：
- **U4（差分覆盖缺口）**：主体已关闭（城堡征服、Blast Stun 直接计数、16 类法术场景等；P-2/cat=15 已于 U132 闭合，16/16 类有直接可观测量）。**残留**：仅"怪物/首领 AI 施法、卷轴施法两条入口未按类别单独设场景"——不把"16 类每类一个职业施法场景"表述成"所有入口全覆盖"。
- **U7（UI 独占路径）**：升级长尾、农场收获、拾取类型已大量闭合。**现状（U134 更新，逐项清单见 `docs/u7-upgrade-usage.md`）**：19 个升级实现**全部**有端到端差分或探针——U133 以 `scroll-upgrades-purchased` 闭合 ScrollUpgrade（type 12），U134 以 `equip-item-upgrade-pickup-first` 闭合 EquipItemUpgrade（type 3）的道具效果级断言（清空背包 → 真实掉落 AI 拾取建背链 → 驱动 type 3 行 → 两端装备槽摘要真实变化 + 反向验证；并勘误 U133"恢复存档惰性"归因——真实门控是候选列表 `≤5` 条件，见该场景注释与 u7 文档）。逐件手动装备已由 `manual-equip-swap` 专项驱动（附录 A 装备行 PASS）。DOM 点击路线已实测不可行（按钮全为 `disabledUpgradeButton` 且矩形 0×0），harness 驱动是唯一稳定入口。
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
| P-2 法术 ✅ | `node scripts/check-spell-coverage.mjs` + `SCENARIO_FILTER=spell-find-chest npm run test:scenarios` | "无直接可观测量 0 个" + 选中跳变两端相等（**2026-09-27 彻夜会话已闭合**） |
| P-3 物品 ✅ | `SCENARIO_FILTER=ancient-item-found npm run test:scenarios` | 通过且远古统计两端增长（**2026-09-27 彻夜会话已闭合**） |
| P-4 成就 ✅ | `npm test` + `npm run test:scenarios` + `node scripts/check-achievement-requirements.mjs` | 24 单测通过（含后增切片；2026-09-27 闭合时为 19）+ 2 条新场景全绿 + 表驱动核对 0 不符（**2026-09-27 已闭合**） |
| P-5 存档 | `npm run test:parity` + `npm run test:scenarios` | 全绿；缺口改写为"需外部样本" |
| P-6 帧时间 | `npm run perf:frames` | 有原版同口径基线（新增） |
| P-7 渲染 | `npm run test:scenarios` | 新视口场景指纹两端相同 |
| 文档片段 ✅ | `node scripts/check-doc-snippets.mjs` | 0 漂移 + 18 条已标注节选（**U133 已闭合**） |
| 类型 | `npm run typecheck && npm run lint` | tsc 0 错误 + 10 不变量绿 |
| **总门禁** | `npm run lint && npm run build && npm run typecheck && npm run check && npm run test:parity && npm run test:scenarios && npm run test:e2e && npm run test:soak && npm run perf && npm run perf:frames` | **10/10 退出码为 0** |

---

## 5. 建议推进顺序（按"收益 ÷ 风险"排序；彻夜会话后更新）

1. ~~**P-3 远古稀有度**~~ — ✅ 已于 2026-09-27 彻夜会话闭合（`ancient-item-found`，带反向验证）。
2. ~~**P-4 成就 requirementType**~~ — ✅ 已于 2026-09-27 闭合（表驱动检查 + 表驱动单测 + 两条临界值差分场景）。
3. ~~**P-2 法术 cat=15**~~ — ✅ 已于 2026-09-27 彻夜会话闭合（`countSelectedTreasure` 跳变观察器，带反向验证）。
4. **P-7 渲染多视口** — 已扩到 5 视口 + 2 游戏内状态（`rendered-scene-tall` 为 U134 新增）仍 PARTIAL；再加视口是纯配置，覆盖游戏内状态则成本高。
5. ~~**P-6 原版帧时间基线**~~ — **U133 实测受阻（如实）**：资产剥离的冻结档案下原版生产页 boot 无法到达组队挂载（`Game.Em=false`，可复现探针 `output/overnight-u133/probe-original2.mjs`），原版同口径腿已写入 `measure-frames.mjs` 但记录为不可用；补基线需**未剥离的原版档案**（外部条件）。
6. ~~**3.2 文档片段**~~ — ✅ 已于 U133 闭合（0 漂移 + 18 条标注节选，反向验证 ×3）。
7. ~~**P-1 技能逐项对照表**~~ — ✅ 已于 U133 交付（32/32 映射表，L3×8/L2×24/L1×0）；该行仍 PARTIAL，剩余为活体差分设计，已否决路径见 §3.1（不得重试）。
8. **P-5 存档多版本** — 只能部分闭合，最后做。
9. **3.3 类型债务** — 长期债，穿插做配方 1；嵌套 typedef 已有 `dungeonManagerState` 先例（含审计 spot-check 套路），`pointManagerState` 等可照做。

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
本环境**物理上无法闭合**的是：真机帧时间/低端设备、多版本真实存档样本。（开局创建路径的原版差分已由 `party-creation-differential` 场景交付，见 `docs/architecture-debt.md` §1.4。）**剩余 4 条 PARTIAL（P-1/P-5/P-6/P-7）+ 类型债务都可以推进**（18 条文档片段已于 U133 标注闭合）——P-2/P-3 已于 2026-09-27 彻夜会话闭合（各自带反向验证），**U7 升级族 19 个实现已于 U134 全部闭合**（最后一个是 EquipItemUpgrade，见 `docs/u7-upgrade-usage.md`），验收矩阵现为 47 PASS / 4 PARTIAL（差分矩阵 89/89，U134 后 10 门禁全绿，日志 `output/u134-f-*.log` + `output/g` 前缀历史日志；U134 逐轮验收记录 `output/u134-final-report.md`）。
**请从 §5 的第 4 项开始（或做 §3.3 的 save-dto 剩余嵌套 typedef），并严格遵守 §1 的红线。**
