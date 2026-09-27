# 交接提示词 — Clickpocalypse II 语义恢复与现代化工程

> 把本文件整段作为新 Agent 的任务说明（配合仓库根目录的 `clickpocalypse2_glm53flash_overnight_refactor_goal.md` 全文作为执行规范）。它是**执行手册**，不是项目介绍。
> 写作时间：2026-09-27，最后落地批次 **U112**（统计/离线视图 + 运行时注册表子对象，六门禁逐条回显退出码全绿）。接手第一件事：`git log --oneline -6` 与 `git status` 确认工作树干净，然后按 §9-P0 继续下一簇。

---

## 0. 你要继续的目标（不变）

把一个 46,980 行的高混淆单体 `archive/original/c2.js`（Clickpocalypse II，浏览器 idle RPG）恢复成**语义清晰、可测试、可继续开发**的现代代码库，同时满足：玩法与数值不变、原版存档可用、RNG/时间/离线行为不变、原版缺陷按原样保留、旧文件不再是唯一真相来源。

判定完成的唯一标准不是"代码变整齐了"，而是**差分/单测/E2E/存档兼容/长程 soak 的自动化证据**。禁止用主观判断宣布完成。这是长程自治任务：不要只写分析、不要中途问"是否继续"、不要因为跑久了就收尾。

---

## 1. 现状（本轮实测，不是回忆）

| 项 | 现状 |
|---|---|
| 引擎 | `src/engine/modules/**`：77 个模块，由 AST 工具从 c2.js **机械恢复**（不是重写） |
| 入口 | 产品入口 `src/engine/adapter.js`（命令校验 + 只读快照）；UI 壳 `src/app.js` + `src/ui/`；原版单体仍在 `archive/original/` 作差分参照 |
| 测试 | `npm test`（10 单测）· `test:parity`（0/1/99/900 回合完整 DTO 相等）· **`test:scenarios`（59 场景差分矩阵，全绿）** · `test:e2e`（浏览器：建队/暂停/五类面板/c2c DOM 契约/导入导出/坏档/刷新/三视口）· `test:soak`（8h/24h 等价回合） |
| 静态门 | `npm run check`（111 文件语法 + 单测）· `npm run typecheck`（tsc 0 错误，`src/engine/modules` 下 `@ts-nocheck` 已清零）· `npm run build`（dist 174 文件） |
| 改名进度 | 混淆字段清单 **806 → 41**（U66–U112 共 47 批）；`docs/symbol-map.json` 的 `fields` 段 **1,010 条**；剩余积压以 `node scripts/show-field-backlog.mjs` 为唯一口径（41 项分布在 25 个模块） |
| 验收矩阵 | `REFACTOR_REPORT.md` 附录 A：51 行 **全 PASS / 0 PARTIAL / 0 未覆盖**（每行带证据场景名） |
| 报告 | `REFACTOR_REPORT.md`、`COMPATIBILITY_REPORT.md`（59 场景表 + RNG/存档/离线口径）、`PERFORMANCE_REPORT.md`、`MIGRATION_MAP.md`，本轮已把场景数从 45/48/50/52 统一为 59 并补齐表内缺失的 7 条场景 |
| 公式文档 | `docs/formulas/{combat,items,progression}.md`，733 条 `file:line` 引用逐条回源过 |
| 里程碑 | M0–M10、M13（回归矩阵）已完成；**M11 有 baseline 未做优化（也无必要）**；M12 长尾改名是当前主线，剩 ~41 项 |

---

## 2. 环境准备（每次开工先做）

```bash
cd /d/下载/clickpocalypse2-main
git log --oneline -10 && git status --porcelain=v1        # 先看有没有上一轮没收尾的在飞批次
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4173/index.html   # 期望 200
# 不是 200 就：nohup npm run dev >output/dev.log 2>&1 &   （所有浏览器测试依赖这个静态服务）
node scripts/analyze-fields.mjs | head -2                  # 实时剩余数，别信文档里的数字
```

Windows + Git-Bash 已知陷阱（都真实坑过）：
- 禁止内联 `node -e "…"` 或 `sed` 改源码：`$1`、`$k`、反斜杠会被 bash 吃掉，`\s*` 在 CRLF 文件里能吃掉换行把两行并一行。一律写脚本文件 + 断言。
- 仓库文件多为 **CRLF**：按行号定位/替换时要先探测 `\r`，`git add` 的 LF/CRLF warning 是噪音。
- `grep -rl | xargs sed` 因反斜杠路径失败。

---

## 3. 唯一真相来源与阅读顺序（不要凭记忆工作）

1. **`docs/WORKSTATE.md`** — 续跑入口。顶部"当前轮次状态"逐批记录：改了哪些符号、证据链、混淆清单从几降到几、踩坑。**每批完成必须更新它**（新增 bullet 在顶部，不要追加到底部；文档下方有若干过期快照，以顶部与 git 为准）。
2. `docs/reverse-engineering/facts.md` — 已验证事实与方法论条目。
3. `docs/reverse-engineering/semantic-map.md` — 早期按"第 N 轮"组织的改名日志（U66 之后由 WORKSTATE 承接）。
4. `docs/reverse-engineering/unresolved.md` — U1…U8 台账与红线案例。
5. `docs/architecture.md` / `game-state-schema.md` / `persistence.md` / `rng.md` / `time-model.md` / `rendering.md` / `formulas/*`。
6. `artifacts/obfuscated-fields.json` + `node scripts/show-field-backlog.mjs` — 实时工作清单与按模块积压。

规矩：**任何判断落盘才算存在**。上下文被压缩后从 1→6 重读，不要重做已完成分析。

---

## 4. 红线（违反即任务失败）

1. 不改任何数值/概率/曲线/节奏（暴击、掉率、XP、移速、药水时长、AP 价格、离线收益、UI 尺寸）。想改 → 记 `unresolved.md`，不动代码。
2. 不改存档 JSON 键。运行时字段可改，但 `persistence/entities.js`、`persistence/game-save.js` 的"运行时字段 ↔ 存档键"映射行**必须同批改**；**首选做法是直接用 DTO 键名命名字段**（本轮 `itemEffectType/Amount/Description/Name`、`partySize1Victories`、`cachedApplied/cachedObtained` 都是这么定的）。
3. 不改 RNG：`SeededRandom` 是 **JS 浮点变体 MT19937**（seed 5489 首值 1859732469），不得"标准化"，不得改变随机调用**顺序**（分布对但顺序变，整个轨迹就变）。数组下标参与贴图/存档的表**不得重排或去重**（例：`shopSpriteNames` 里 `L2_Terrain077.PNG` 出现两次是权重）。
4. 原版缺陷按原样保留并写 reproduction（例：`getProjectileAnimation` 对空投射武器无保护，两端同点同错）。
5. 不做大爆炸重写、不引入 React/Vue、不做 UI redesign；绞杀者式一小片一小片迁移。不许"看起来现代"（wrapper、满屏 `any`、只拆文件不改语义）。
6. 不做没有 baseline 的"性能优化"。
7. 禁止回退/覆盖：`archive/original/**`、`tests/fixtures/original.c2save`、`docs/symbol-map.json`（只增改不重置）、`docs/reverse-engineering/**`、`src/vendor/lz-string-1.3.3.js`、`output/perf/perf-baseline.json`。
8. **禁止对引擎文件用 `git checkout --` 回退**（会把同批未提交的改名一起抹掉，真发生过）；要回退用 `git stash` + 逐字段确认。

---

## 5. 每个切片（一批改名）的固定流水线

```
① 取证：读全部读写站点 + 存档 DTO + DOM/中文文案 + c2.js 旁证 → 只有 HIGH 才落地
   （派子智能体取证可以，但**它的每条 file:line 都要自己复验**，见 §7.4）
② 定名：同义可并名；异主必须拆名；死字段用 unusedXxx 诚实命名；先 grep 确认新名 0 命中
③ 落地：写 scripts/mappings/<组名>.json → node scripts/rename-fields-batch.mjs <file> --dry → 去掉 --dry
   （批处理是事务性的：任一 expect 不符就不写盘）
④ 立刻 node --check 每个被改文件（脚本破坏语法时只有它能抓到）
⑤ 六门禁（退出码必须自己回显，见下方警告）
⑥ 双 commit：refactor: …（src + mappings/*.json） → docs: …（WORKSTATE + symbol-map fields + artifacts）
```

门禁命令（**复制这个形态**）：

```bash
npm run typecheck >output/g1.log 2>&1; echo "TSC=$?"
npm run check     >output/g2.log 2>&1; echo "CHECK=$?"
npm run test:parity >output/g3.log 2>&1; echo "PARITY=$?"
npm run test:scenarios >output/g4.log 2>&1; echo "SCEN=$?"
npm run test:e2e  >output/g5.log 2>&1; echo "E2E=$?"
npm run build     >output/g6.log 2>&1; echo "BUILD=$?"
```

> ⚠ 不要写 `npm run test:scenarios 2>&1 | tail -3 && echo OK` —— 管道的退出码属于 `tail`，套件崩了也会报成功。本轮就因此差点提交了一份 tsc 直接拒绝的代码。

单场景快速迭代：`SCENARIO_FILTER=castle-victory SCENARIO_VERBOSE=1 npm run test:scenarios`。
改了视图层/DOM/瞬时态：差分看不见，必须浏览器侧验证，并对新断言做**反向验证**（故意改坏一处，确认它会红）。

---

## 6. 工具清单

| 工具 | 用法 | 要点 |
|---|---|---|
| `scripts/rename-fields-batch.mjs` | `node scripts/rename-fields-batch.mjs scripts/mappings/x.json [--dry]` | 多字段事务替换。**数组形态**才带 `expect`（紧凑 `{files,map}` 形态会忽略期望值）。校验：命中总数、行数、逐行缩进、字符串字面量多重集、typedef 里的 `name:`；写盘后全库回扫旧名残留 |
| `scripts/rename-field.mjs` | 单字段版 | 同上，用于手工小批 |
| `scripts/rename-identifiers-atomic.mjs` | 名字**置换**（A↔B、A→B→C） | 逐条 rename 会产生中间态污染，必须单 pass 查表替换 |
| `scripts/show-field-backlog.mjs [topN]` | 剩余混淆名按模块聚合 | 挑批依据：**单文件成组风险最低** |
| `scripts/analyze-fields.mjs` | 直接跑 | 重写 `artifacts/obfuscated-fields.json` 并打印总数 |
| `scripts/find-field-refs.mjs` / `show-field-uses.mjs` / `count-field-uses.mjs` | 跨文件字段取证 | 属主边界判定（"别的文件也有引用"→ 不写全局表） |
| `scripts/analyze-statistics-view.mjs` | 视图取证样板 | 从 update()/行标签/列号三路交叉配对，自动导表 |
| `tests/engine-harness.js` | 双端驱动与只读观察 | 每个观察器都有"原版分支用旧字母、重构分支用新名"的成对写法（如 `isOriginal ? enc.du : enc.isBossEncounter`）；改字段名时要逐扫描器同步 |
| `scripts/test-soak.mjs` / `measure-perf.mjs` / `measure-frames.mjs` | soak 与性能 | 长期稳定 ≠ 无泄漏；倍数样本会翻转，别当结论 |

---

## 7. 踩过的坑（逐条来自真实事故，接手前必读）

1. **数据表键与读取端分文件**：只喂读取端 → 键留下 → 属性 NaN → parity 与 32 场景同时爆红。改完键才绿。工具的回扫报告必须读懂。
2. **一个字母两种语义**（`Cb`/`Qc`/`oc`/`ts`/`Lp`/`Tt`/`Is`/`vw`/`ww`/`Ut`/`fr`/`vp`）：批处理按**文件**粒度，同文件内两个宿主无法区分 → 先按接收者手工拆开（线级或整行替换），再跑批；这类字母**不写入** `symbol-map.json` 的 `fields` 段（那是一对一表）。
3. **`Array.prototype.join(fn)` 不是 map**：本轮 `s.split(from).join(() => to)` 把函数源码 `() => to` 当分隔符插进了 10 行引擎代码，而"行数/缩进/字符串字面量多重集"三项校验**全部通过**。→ `join` 只传字符串；任何脚本化改写后立刻 `node --check`。
4. **子智能体的结论 = 意图，不是状态**：`unresolved.md` 曾写"c2c DOM 契约断言已加入"，实测该文件里那些选择器出现 **0 次**；审计报告里的"38 个垃圾文件"实测为 0。每条 file:line 自己复验后再落库。
5. **JSDoc 的 `@property {function(): void} fr 说明` 形态不被批处理捕获**（它只认 `fr:` 形态）→ 改完必须跑 tsc，剩下 3 个 TS2339 就是它。
6. **`npm run x | tail` 吞掉失败退出码**（见 §5 警告）。
7. 差分看不见瞬时态：装备武器特效曾因 `movement.js` 读 `a.statType`（原版是 `a.s`→`characteristic`）而静默丢失，34 场景当时全绿。
8. harness 与场景脚本里 `window.<字母>`（`pB/Hq/Nx/lB/Es/Game`）是**原版全局函数**，不可改名；这类字母会一直留在清单里（如 `pB`、`Hq`），不是漏改。
9. 原版 `loop.js` 把 `view.render()` 异常吞成 `console.log`；矩阵同时监听 `pageerror` 与 console。localStorage 用 `_backup` 后缀，差分两端各自 `browser.newContext()`。
10. `String.replace(a, b)` 会把 `$'` 展开为"匹配后全部尾部"→ 必须函数替换。

---

## 8. 必须知道的机制事实（已验证，别重新推导）

- 存档：JSON → LZ-string **1.3.3** Base64 → localStorage `C2_V1_001`；4,477 个键全语义化，**无单字母键** → 运行时字段改名安全，映射行必须成对改。
- 自动保存间隔 = **300,000 ms**（`c2.js:44345` `this.Uc = 3E5`；曾错写 3E4，由 `autosave-payload` 守住）。
- 离线结算由**帧循环驱动**（每帧 ≤200 回合，分支条件 `1E3 < 帧差`），阈值 120s，上限 12h + 加成；harness 用 `advanceOffline()`。
- 药水时长单位是**回合数**（800 + 加成）。两条随机流：`SeededRandom`（世界/地牢生成）与 `Math.random`（战斗/掉落）。
- 原版全局访问路径（harness 原版侧）：`window.Game`、`window.pB(15)`=单回合步进、`window.lB()`=序列化、`Game.Hr.Hr()`=帧 tick、`Game.Gf.Og`=活怪物、`window.Nx`=upgradeCollections、`Game.Yj`=potions、角色 `ei/fi/gi/hi`=技能树（重构版 `skillTree1..4`）。
- `docs/symbol-map.json` 四段：`symbols`(1,231)、`fields`(997，原字母→语义名，**仅单主或同义并名可入**)、`gameFields`(43)、`modules`/`dependencies`。

---

## 9. 剩余工作队列（P0 最高）

### P0 — 收尾 U112 并继续 M12（约 41 项，按簇推进，每簇一 commit）
实时清单以 `node scripts/show-field-backlog.mjs` 为准。已知成组的候选：
1. **模拟层孪生字母**（`simulation/tick.js` 与 `simulation/characters.js` 共用）：`yw Jo cw Qt zD gD PC` — 同一批宿主方法/字段跨两文件，务必两文件同批；另有 `ip`（`loot/inventory.js` + tick）、`qB`（tick + sprites + rooms）。
2. **渲染/贴纸层**：`rendering/sprites.js` 的 `$w Zt FB a b qB PI iD`（注意 `a`/`b` 是**合法的字段名**，`.a`/`.b` 匹配面极广，必须逐点核对宿主，别按字母全局改）+ `rendering/scene.js` 的 `kE PI iD`。
3. **墙体贴纸/房间三兄弟**：`world/rooms.js`、`world/generation.js`、`loot/treasure.js` 共用的 `Zw Xw`、`Lw`、`sp`（`sp` 亦在 `game-save.js` → 先判同主与否）。
4. **职业表**：`content/classes.js` 的 `eF bF cF tb`（对照已落地的 `innateSpells`/`statBonusList`/`slotStatBonusList`/`statMultipliers` 定名）。
5. **区域表**：`world/regions.js` + `world/initialization.js` 的 `BA EA`；`characters/movement.js` 的 `hw fz`；`combat/potions.js` + `views/expedition.js` 的 `aw bw`；`loot/inventory.js` 的 `Wt IE`；零散 `VC uD ok YE bo HB`。
   - 死字段（写入但全库 0 读，含 `archive/original/c2.js` 也 0 读）→ `unusedXxx`，并在 WORKSTATE 里给证据（先例：`Ws`→unusedClassFlag、`fb`→unusedCachedText）。

### P1 — 规范 §88 的完整回归收尾（本轮未全跑）
`test:soak`（8h/24h）与 `perf`/`perf:frames` 在 U105–U112 之后**还没重跑**；六门禁每批都跑了。收尾时按顺序全跑一遍并如实记录任何红。若出现分叉，先判"谁分叉"（原版还是重构版），不要默认改重构版——见 `unresolved.md` 的方法论。

### P2 — 验收矩阵与报告的持续对齐（防"文档与代码矛盾"）
`REFACTOR_REPORT.md` 附录 A 51 行目前全 PASS；**每行证据必须仍可回源**（场景名还在 `scripts/test-scenarios.mjs` 里、file:line 还指得对）。改名批会移动行号，收尾时抽查若干行的 file:line。已知的口径弱点（**不得写成 PASS**）：法术 16 类中只有 cat=2 的三种状态与 cat=17 有专属可观测量；渲染等价只在两条 frames 场景、两种视口下比指纹；soak 是加速等价回合，未测真机帧时间与低端设备；~~`upgradeRegistry` 这个宿主名可能本身是误名~~ **已复核并修正（2026-09-27）**：该宿主唯一成员是 `blastStunSpellCache`，已更名为 `game.spellCaches`（`runtime/game.js` + `tick.js` + `gameFields.RC` + 三处文档同步）。

### P3 — Exhaustion Pass（规范 §87）
`TODO|FIXME|HACK|unknown|@ts-ignore|eslint-disable|console.log` + 未使用文件/重复实现/临时 adapter/注释掉的旧实现，逐条判定"合理保留 / 必须修 / 记录风险"。上一版结论在 `docs/m13-exhaustion-audit.md`，需按当前 HEAD 复跑。

### P4 — 只有真机/人工才能闭合的部分
需要产品决策的冲突（例如是否修原版缺陷、是否 UI redesign）**不属于本任务**；如要推进，先问用户。

---

## 10. 汇报纪律与指标定义

不许写"完成 80%"。只用这些量：剩余混淆字段数（`analyze-fields` 输出）、`fields` 条数、单测数、差分场景数、`check/typecheck/parity/scenarios/e2e/build/soak` 各自绿或红、验收矩阵 PASS/PARTIAL/未覆盖行数。最终报告必须区分 VERIFIED / HIGH CONFIDENCE / PARTIALLY VERIFIED / UNRESOLVED，PARTIAL 要写清缺什么。

每批完成：更新 `docs/WORKSTATE.md` 顶部（改了哪些符号、证据、清单从几降到几、门禁状态）+ `docs/symbol-map.json` 的 `fields` + 重跑 `analyze-fields.mjs`。

## 11. 你接手后的第一条命令

```bash
cd /d/下载/clickpocalypse2-main && git log --oneline -6 && git status --porcelain=v1 \
  && node scripts/analyze-fields.mjs | head -1 \
  && curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4173/index.html
```

若工作树不干净：那是 §9-P0 的在飞批次，按 §5 把六门禁跑完（用回显退出码的形态）→ 提交 → 再继续下一簇。若干净：直接从 §9-P0 的簇 1 开始取证。
