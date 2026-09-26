# 交接提示词 — Clickpocalypse II 语义恢复与现代化工程

> 把本文件整段作为新 Agent 的任务说明。它是**执行手册**，不是项目介绍。
> 写作时间：2026-09-26，HEAD `39efd25`，工作树干净，四套回归全绿。

---

## 0. 你要继续的目标（不变）

把一个 46,980 行的高混淆单体 `archive/original/c2.js`（Clickpocalypse II，浏览器 idle RPG）恢复成**语义清晰、可测试、可继续开发**的现代代码库，同时满足：玩法与数值不变、原版存档可用、RNG/时间/离线行为不变、原版缺陷按原样保留、旧文件不再是唯一真相来源。

判定完成的唯一标准不是"代码变整齐了"，而是**差分/单测/E2E/存档兼容/长程 soak 的自动化证据**。禁止用主观判断宣布完成。

---

## 1. 接手前必须知道的现状（已实测）

| 项 | 现状 |
|---|---|
| 引擎 | `src/engine/modules/**`：77 个模块、32,431 行，由 AST 工具从 c2.js **机械恢复**（不是重写） |
| 入口 | 产品入口唯一：`src/engine/adapter.js`（命令校验 + 只读快照）；UI 壳 `src/app.js` + `src/ui/` |
| 测试 | `npm test`(9 单测) / `test:parity`(0/1/99/900 回合) / **`test:scenarios`(34 场景)** / `test:e2e` / `test:soak`(8h/24h 等价回合) |
| 静态门 | `npm run check`（109 文件语法 + 单测）、`npm run typecheck`（tsc 经 import 图覆盖 76/77 引擎模块，0 错误） |
| 类型治理 | `src/engine/modules` 下 `@ts-nocheck` 已清零，仅 `src/vendor/lz-string-1.3.3.js` 保留（第三方） |
| 改名进度 | `src` 内混淆属性名 **1,175 个**（本次会话从 1,238 清零 63 个字母）；`docs/symbol-map.json` fields 段 263 条 |
| 报告 | `REFACTOR_REPORT.md`（含 §56 验收矩阵 50 行：28 PASS / 17 PARTIAL / 5 未覆盖）、`COMPATIBILITY_REPORT.md`、`PERFORMANCE_REPORT.md`、`MIGRATION_MAP.md` |
| 公式文档 | `docs/formulas/{combat,items,progression}.md`，共 733 条 `file:line` 引用已逐条回源 |
| 里程碑 | M0–M10 完成；M11 基线完成（无优化必要）；M12 长尾改名进行中；M13 回归矩阵已扩到 34 场景但**尚未收尾**（见 §9） |

**两处刚发生的好消息，矩阵文案还没同步**（你的第一份文档工作）：`角色升级`与`角色技能/技能树`两行现已由 `upgrades-purchased` 场景真实驱动（两端各 28+24 次购买，命中 settings / 技能布尔表 / 等级），验收矩阵应相应上调并补证据；`REFACTOR_REPORT.md` §8 第 2 条的清单也要照 §9 改写。

---

## 2. 环境准备（每次开工先做）

```bash
cd /d/下载/clickpocalypse2-main          # Bash 工具的工作目录会跨命令保留，务必确认 pwd
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4173/index.html   # 期望 200
# 若不是 200：npm run dev（后台运行），测试依赖这个静态服务
git log --oneline -5 && git status --porcelain=v1
```

Windows + Git-Bash 已知陷阱（都真实坑过）：
- `grep -rl | xargs sed` 因反斜杠路径失败；复合 `sed 's/a/b; s/c/d'` 静默不生效。
- `node -e "…"` 双引号里 `$1`、`$k`、反斜杠会被 bash 吃掉 → **禁止用内联 shell 改源码**，一律写脚本文件或走 `scripts/rename-field.mjs`。
- `\s` 在含 CRLF 的文件里能从 `\r` 后的行首位置吃掉 `\n`，把两行并成一行。
- 文件多为 CRLF；`git add` 时的 LF/CRLF warning 是噪音，可忽略。

---

## 3. 唯一真相来源与阅读顺序（不要凭记忆工作）

1. `docs/WORKSTATE.md` — 续跑入口，含"当前轮次状态"与禁改文件清单。
2. `docs/reverse-engineering/facts.md` — 28 条已验证事实（含踩坑方法论）。
3. `docs/reverse-engineering/semantic-map.md` — 已落地改名日志，按"第 N 轮"组织，每条带证据与存档配对点。
4. `docs/reverse-engineering/unresolved.md` — U1…U7 未闭合项，**这是你的任务队列来源**。
5. `docs/architecture.md` / `game-state-schema.md` / `persistence.md` / `rng.md` / `time-model.md` / `rendering.md` — 分系统实况。
6. `artifacts/obfuscated-fields.json` — 混淆属性工作清单（按频次排序，带样例）。

规矩：**任何判断落盘才算存在**。上下文被压缩后，从 §3 的 1→5 重读，不要重做已完成分析。

---

## 4. 红线（违反即任务失败）

1. 不改任何数值/概率/曲线/节奏：暴击、掉率、XP、移速、药水时长、AP 价格、离线收益、UI 尺寸。发现想改 → 记进 `unresolved.md`，不动代码。
2. 不改存档 JSON 键。运行时字段可改，但 `entities.js` / `game-save.js` 的"运行时字段 ↔ 存档键"映射行**必须同批改**（同名对齐是首选做法，见 facts#25）。
3. 不改 RNG：`SeededRandom` 是 **JS 浮点变体 MT19937**（seed 5489 首值 1859732469），不得"标准化"；不得改变随机调用的**顺序**（分布对但顺序变，整个轨迹就变）。
4. 原版缺陷按原样保留并写 reproduction；只有阻塞现代浏览器运行或用户明确要求才修。已按此原则保留：`getProjectileAnimation` 对空投射武器无保护（原版与重构版同点同错）。
5. 不做大爆炸重写，不引入 React/Vue，不做 UI redesign；绞杀者式一小片一小片迁移。
6. 不许"看起来现代"：wrapper、满屏 `any`、只拆文件不改语义都算未完成。
7. 不做没有 baseline 的"性能优化"。

禁止回退/覆盖：`archive/original/**`、`tests/fixtures/original.c2save`、`docs/symbol-map.json`、`docs/reverse-engineering/**`、`src/vendor/lz-string-1.3.3.js`、`output/perf/perf-baseline.json`。

---

## 5. 每个切片的固定流水线（一步都不能省）

```
取证（读源码 + 对照 c2.js / 历史版 / 字符串 / 存档参与）
  ↓ 写成 HIGH 证据，否则不改名
落地一小片（一次一个语义组）
  ↓
npm run check          # 语法 + 单测
npm run typecheck      # tsc
npm run test:parity    # 0/1/99/900 回合完整 DTO 相等
npm run test:scenarios # 34 场景差分（可用 SCENARIO_FILTER 先跑相关场景）
npm run test:e2e       # 浏览器
  ↓ 全绿
更新文档：semantic-map.md（带证据）+ WORKSTATE.md + facts.md（若得到新事实）+ symbol-map.json + artifacts（跑 analyze-fields）
  ↓
一个 commit（说清"为什么"，禁止 "update/fix/refactor code" 这类信息量为零的消息）
```

- 改了视图层/事件处理器/DOM：差分看不见，**必须**做浏览器侧验证，并对新断言做**反向验证**（故意改坏一处，确认它会红）。本会话两次靠反向验证确认检查有效（DOM 契约断言、逐像素指纹）。
- 改了常量或守卫条件：先想"这会不会只影响瞬时态"。若是，差分不会红，必须靠逐行对照原版。

---

## 6. 工具与用法

| 工具 | 用法 | 要点 |
|---|---|---|
| `scripts/rename-field.mjs` | `node scripts/rename-field.mjs <old>=<new> <file...> --expect <总命中>` | 写盘前强制：命中总数=期望、行数不变、逐行缩进不变、字符串字面量**多重集**不变；`@typedef`/`@type {` 注释里的成员名也会改；写盘后**全库回扫**同名残留并报告。名字含正则元字符（如 `$c`）已做转义。 |
| `scripts/analyze-fields.mjs` | 直接跑 | 重写 `artifacts/obfuscated-fields.json`，输出频次榜；每组改完跑一次记录"清单从 N 降到 M" |
| `scripts/find-dead-reads.mjs` | `npm run audit:dead-reads` | 粗筛"全库无人写入的属性名"。当前 `--min=2` 为 0。**局限见 facts#28**：抓不到"该名字在别的类上存在"的错映射 |
| `tests/scenarios/save-mutations.mjs` | 加变异器 | 现有：`withGold/withTurns/withElapsed/withOfflineProcessing/withVictories/withPotions/withScrolls/withClassSpell/withReclassedSpell/withEquippedItem/withResurrectionTrial/withCastleVictory/withSkillPoints/withExperience` |
| `tests/engine-harness.js` | 双端只读观察与驱动 | `purchaseUpgrades({turns,limit})`、`activatePotions({turns,limit})`、`countEffectApplications(turns,typeId)`、`canvasInk()`（不透明像素/非背景像素/FNV-1a 逐像素指纹）、`idle(n)`（真实帧循环，含 `view.render()`）、`advanceOffline()` |
| `scripts/test-scenarios.mjs` | `SCENARIO_FILTER=a,b SCENARIO_VERBOSE=1 npm run test:scenarios` | 单场景快速迭代；失败会打印首处字节分叉与两侧上下文，并落盘 `output/scenarios/` |
| `npm run perf` / `npm run perf:frames` | 性能 | 前者 harness CPU，后者真实页面 rAF 分布 + 渲染异常捕获 |

场景步骤三种形态：`[turns, check]`、`{turns, check, effectType}`、`{turns, check, purchaseUpgrades|activatePotions}`、`{frames}`。新增驱动命令时沿用"两端各自断言可观察量增长 + 逐检查点完整 DTO 相等"的既有约定。

---

## 7. 本会话踩过的坑（不要再踩，逐条来自真实事故）

1. **数据表键与读取端分文件**（最危险）：`itemRarityTiers` 的键在 `content/balance.js`，读取端只在 `loot/items.js`。只喂读取端 → 键留下 → `tier.statMultiplier` 为 undefined → 物品属性 NaN → 99 回合后 `characterHealth` 109→99，parity + 32 场景同时爆红。改完键才绿。→ 工具已加写盘后回扫，但你必须**读懂它的报告**。
2. **一个字母两种语义**：`Cb`（Character 写 `combatTarget` / CombatAction 写 `targetCharacter`）、`Qc`（Upgrade 执行购买 / 按钮 onmouseup  shim）、`oc`（VisualEffect 播放游标 / AnimationFrame 从未被读的写入位）。逐文件工具无法拆，先统一改再**线级改回**那一行；`Qc/Cb` 这类双主字母**不写入** `symbol-map.json` 的 fields 段（该段是一对一表）。
3. `git checkout -- <file>` 会把**未提交**的修复一起抹掉（本会话抹掉过一次 3E5 修复，靠重跑测试发现）。反向验证优先用脚本改回，别用 checkout。
4. 子智能体的"已关闭"结论必须逐行核实：`unresolved.md` 曾写着"c2c DOM 契约断言已加入 test-browser.mjs"，实测该文件里那些选择器出现 **0 次**——假闭环。本会话把断言真的写进去并做了反向验证。
5. 子智能体会误报：同一份审计报告里"38 个含私有码点文件名的垃圾文件"经 `git ls-files` 实测为 0。任何"清理建议"先验证存在性。
6. harness 页自发的 `/favicon.ico` 404 是浏览器行为，不是引擎回归；console 监听要过滤它。
7. 两版共用一个浏览器上下文时 localStorage 键互相覆盖 → 差分两端各自 `browser.newContext()`。
8. 原版 `loop.js` 把 `view.render()` 异常吞成 `console.log("Caught error. …")`：只听 `pageerror` 的矩阵看不见渲染崩溃（现已同时监听 console）。
9. **差分看不见瞬时态**：被静默禁用的装备武器特效（`movement.js` 读 `a.statType`，原版 `c2.js:21419` 是 `a.s`→应为 `a.characteristic`）在 34 场景全绿的情况下存活了很久，是逐行读代码发现的（facts#26-28）。

---

## 8. 必须知道的机制事实（已验证，别重新推导）

- 存档：JSON → LZ-string **1.3.3** Base64 → localStorage `C2_V1_001`（宿主服务另写 `_backup`）；4,477 个键全为语义化命名。
- 自动保存间隔 = **300,000 ms**（`c2.js:44345` `this.UC = 3E5`）。曾错写 3E4（10 倍频率），由 `autosave-payload` 场景守住。
- 离线结算由**帧循环驱动**（每帧 ≤200 回合，分支条件 `1E3 < 帧差`），上限 12h + 加成，阈值 120s；harness 用 `advanceOffline()`。
- 药水时长单位是**回合数**（800 + 加成），不是毫秒。
- 两条随机流：`SeededRandom`（世界生成等）与 `Math.random`（战斗/掉落），消费顺序受差分保护。
- 原版全局访问路径（harness 原版侧用）：`window.Game`、`Game.Hr.Hr()`=帧 tick、`window.lB()`=序列化、`window.pB(15)`=单回合步进、`game.hE(text)`=导入存档、`Game.Em`=initialized、`Game.pg`=saves、`Game.Yj`=potions、`Game.Gf.Og`=活怪物列表、`window.Nx`=upgradeCollections、`Game.i.D`=adventurers、角色的 `ei/fi/gi/hi`=技能树（重构版 `skillTree1..4`）。
- 符号定位：`docs/symbol-map.json` 的 `symbols`（1,231 条，含 original/line/module）、`gameFields`（43 条 Game 字段）、`fields`（263 条原字母→语义名）。

---

## 9. 剩余工作队列（按优先级，P0 最高）

### P0 — 收尾 M13 与文档一致性（成本低、收益直接）
1. 把 §1 提到的两行矩阵（角色升级、角色技能）与 `REFACTOR_REPORT.md` §8 第 2 条按事实更新；`COMPATIBILITY_REPORT.md` §2 场景数已由 12 改 34，若再加场景需同步。
2. 跑一次完整 §88 回归清单：clean install（无 lockfile 变更则跳过）→ `npm run check` → `typecheck` → `test` → `test:parity` → `test:scenarios` → `test:e2e` → `test:soak` → `npm run build` → `npm run perf`/`perf:frames`，并如实记录任何红。
3. Exhaustion pass：`TODO|FIXME|HACK|unknown|legacy|@ts-ignore|eslint-disable|console.log` 与"未使用文件/重复实现/临时 adapter/注释掉的旧实现"逐条判定。

### P1 — U7：把剩下只有视图入口的家族纳入差分（矩阵里 5 行"未覆盖"大多卡在这）
入口都已备好，缺的是**前置变异器**和**遍历**：
- `UnlockMonsterLevelUpgrade`：断言 `monsterTypes.monsterLevelStates` 长度较 fixture 增长（`BASELINE_MONSTER_LEVELS` 已存在）。
- `AdventurePointUpgrade`：需要"对应点类型有余额 + 前置满足"，可加 `withPointPools(save, {typeId: points})`（DTO：`pointManagerState.pointsByType[{pointEventType,points,count}]`、`spentAdventurePoints`）。
- 农场/地牢购买：`farmAndDungeonUpgrades` 在 `upgradeCollections` 里，成本是金币；断言 `dungeonManagerState`/`farms` 相关字段变化（先确认 DTO 键名）。
- `ClaimAchievementUpgrade`：需要 `achievements[].obtained=true` 且 `applied=false`，断言 `applied` 变 true。
- `EquipBestItemUpgrade`（自动装备）：背包里注入一件更好的物品（DTO：`adventurers[].inventory`、`equippedItemCollection`），断言装备槽变化。
- `castScroll()`：要求**当场有可打目标**（`getOpponents` 非空），需在遭遇进行中触发——可用 `withPotions(['randomBossEncounter'])` 提高遭遇频率，再在 `advance` 中间调 `castScroll`；原版侧函数名需从 `scrolls.js` 的 `castScroll` 反查 c2.js 对应符号。
- 宝箱/架子/书架拾取：目前没有场景让角色真正进入宝箱房（`treasureChestsLooted` 恒 0）。

### P2 — M12：长尾混淆名（`artifacts/obfuscated-fields.json` 榜首）
`oc`（双主，需线级）、`Uc/Vc`（views/achievements.js + views/character.js 的按钮池数组，**每个类含义不同，先消歧**）、`ed`、`yd`、以及 `Equipment` 上未改名的 `hw/Ey/fz/So()`、`Item.nj` 等。`$c` 已落为 `itemDrop`，`Bc/Cc/Sc/Nc/ld/Jc/zd/wd/od` 已落。规则：先取证（读消费点 + 对原版），HIGH 才落地，一组一 commit，四套全绿。

### P3 — 交接时在飞的审计（结果尚未入库）
一个子智能体正被派去专找"差分看不见的那类恢复期错映射"（形状 A 同一字母两种映射 / B 读了本类没有的字段 / C 只影响瞬时态的守卫错值），范围：rendering→views→combat/actions→ai→effects/stats→tick/world→content 表。**它的结论不在本仓库里，也不得直接采信**：接手后要么让它汇报，要么自己重做该审计。已确认的一例就是 §7.9。

### P4 — 验收矩阵仍偏弱之处（不要把它们写成 PASS）
- 法术 16 类只有 cat=2 的三种状态与 cat=17 有专属可观测量，其余靠"唯一注入法术 + 两端各自施法计数增长"。
- 渲染等价只覆盖一条场景、一种视口，且只比指纹不比位置图。
- 长程 soak 是加速等价回合，未测真机帧时间分布与低端设备。
- 背景行为：`allowBackgroundProgress` 的关闭态、`renderEnabled=!document.hidden`、隐藏时保存路径均未断言。

---

## 10. 汇报纪律

- 每次切片完成：更新 `docs/WORKSTATE.md` 顶部"当前轮次状态"（不要追加到底部），写清改了哪些符号、证据、混淆清单从几降到几、四套回归状态。
- 不写"完成 80%"这类无定义百分比；用量：混淆名剩余数、fields 条数、场景数、PASS/PARTIAL/未覆盖行数。
- 最终报告必须区分 VERIFIED / HIGH CONFIDENCE / PARTIALLY VERIFIED / UNRESOLVED；PARTIAL 必须写清缺什么。
- 不要因为"已经做了不少"就停下问是否继续——除真正需要产品决策的冲突外，自行决定并继续；上下文将耗尽时先确保 §3 的四个文件已落盘。

## 11. 你现在接手时的第一条命令

```bash
cd /d/下载/clickpocalypse2-main && git log --oneline -8 && git status --porcelain=v1 \
  && curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4173/index.html
npm run check && npm run test:scenarios 2>&1 | tail -3     # 先确认基线是绿的，再动任何东西
```

然后从 §9 的 P0 开始（更新两行矩阵 + 一次全量回归），再进 P1。
