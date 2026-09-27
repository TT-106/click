# 原版行为基线说明（Behavior Baseline）

> 本文定义"原版行为"指什么、如何运行原版、以及用哪套差分体系证明重构版与原版行为一致。
> 配套文档：RNG 语义见 `docs/rng.md`，时间与离线语义见 `docs/time-model.md`，已验证事实见 `docs/reverse-engineering/facts.md`。

## 1. 原版是什么、在哪里

| 路径 | 内容 |
|---|---|
| `archive/original/c2.js` | **行为基准本体**：原发行包的混淆单体脚本（约 46,980 行 / 956KB，2015-09-18 版）。全部差分以它为参照 |
| `archive/original/c2-ver=20150918.js` | 同版本的另一份发行快照（1.06MB，原站带 `?ver=` 查询参数的文件） |
| `archive/original/index.html` / `index2.html` | 原发行页面：加载 `c2.css?ver=20150726` 与 `c2.js?ver=20150918`，并引用汉化站外链脚本（jquery/kf，见 `archive/original/index.html:904-908`）。脱离外链时游戏主体仍可运行 |
| `archive/original/c2.css`、`c2-ver=20150726.css` | 原版样式 |
| `archive/original/chs.js` | 汉化词典脚本 |
| `archive/original/c2c.user.js`、`README-js.md` | 第三方点击挂机用户脚本及其说明（非基准） |
| `archive/original/README.md` | 来源说明（英文版 minmaxia.com/c2，汉化版 likexia.gitee.io） |
| `images/`、`spritesheet/` | 原版美术资源（sprite atlas 已抽取为 `data/*-atlas.js`，计数见 recovery-manifest） |

**基准完整性凭证**：`archive/migration/recovery-manifest.json` —
`c2.js` 的 sha256 = `b9dd4f566645cdc252a5340ad1d89262a6a7c2e1d2cbc5d4db36d89113222153`；
atlas 条目数 monsters 939 / terrain 1183 / items 714；
声明的六项机械变换：`extract-sprite-atlases`、`extract-original-lz-codec`、`isolate-es-module-scope`、`inject-persistence`、`autosave-30-seconds`、`replace-window-game-with-private-export`。
`archive/original/**` 是禁止回退/修改文件（`docs/WORKSTATE.md` §8）。

## 2. 原版如何运行（差分加载方式）

原版**不是**直接打开 `archive/original/index.html` 跑的；那样无法固定随机与时间。差分通过统一 harness 加载：

1. **前置**：`npm run dev` → `scripts/serve.mjs` 在 `http://127.0.0.1:4173` 提供仓库根静态服务（无构建步骤；playwright 走 `channel: 'chrome'`，Node ≥ 22）。
2. **harness 页面**：`tests/engine-harness.html`（根为 `/`，引入 `src/styles/game.css`，脚本 `tests/engine-harness.js`）。
3. **环境固定**（在任何引擎代码之前）：`window.requestAnimationFrame = () => 0`（禁自动帧循环，一切推进由测试显式驱动）；`Math.random` 替换为 LCG(1664525, 1013904223)、`Date.now` 固定为 1750000000000（`tests/engine-harness.js:4-9`）。
4. **双端切换**：URL 带 `?original` 时，动态 `<script src="archive/original/c2.js">` 注入原版并适配其混淆全局入口（`engine-harness.js:12-25`）：
   - `game = window.Game`、`initialize = () => game.Hr.Hr()`（帧 tick）、`ready = () => game.Em`（initialized）、
     `snapshot = () => window.lB(game.pg)`（序列化完整存档 JSON）、`load = text => game.hE(text)`（导入）、
     `advance = () => window.pB(15)`（单回合步进）、`isOffline = () => game.ig === true`、`loopTick = () => game.Hr.Hr()`。
   不带参数时加载重构版 `src/engine/modules/runtime/index.js`，以同接口适配（`engine-harness.js:26-36`）。两端最终暴露**同一组** `window.harness` API：`load / snapshot / setTime / advance(turns) / advanceOffline()`（`engine-harness.js:44-56`）。
5. **离线驱动**：`advanceOffline()` 每轮 `fixedNow += 2000` 后调用一次 `loopTick()`，直到 `processingOffline` 结束（上限 2000 帧）——必须如此，因为离线分支的进入条件是帧差 > 1000ms（`docs/time-model.md` §2，facts.md 第 10 条）。

原版全局入口与重构入口的对应关系（facts.md 第 17-18 条）：`window.Game` ↔ 私有 `game`（`src/engine/modules/runtime/game.js`），产品入口经 `src/engine/adapter.js`。

## 3. 行为基线 = 四层差分体系

"重构没有改变行为"不是单次测试结论，而是四层证据链。运行命令（前三层需 dev server 与 Chrome）：

```bash
npm run test          # 第 4 层：node --test tests/unit/*.test.mjs
npm run test:parity   # 第 1 层
npm run test:scenarios # 第 2 层
npm run test:e2e      # 第 3 层
```

### 3.1 第 1 层：parity（`scripts/test-parity.mjs`）

同一基准存档 `tests/fixtures/original.c2save`（2026-09-25 采集、含进行中冒险，LZ-string Base64）在两端载入，依次推进 **0 / 1 / 99 / 900 回合**，每步把**完整存档快照**（两端各自的 `snapshot()`）`deepEqual`（`test-parity.mjs:25-28`），并断言双端无 `pageerror`（`:29`）。0 回合验证纯恢复路径（存档字段映射，facts.md 第 8 条），900 回合验证长程模拟收敛。失败时双端快照落盘 `output/parity/` 供 diff。

### 3.2 第 2 层：场景差分矩阵（`scripts/test-scenarios.mjs`，9 场景）

对 `tests/fixtures/original.c2save` 解码后的 JSON 做变异（`tests/scenarios/save-mutations.mjs`：`withPotions / withScrolls / withGold / withTurns / withElapsed / withOfflineProcessing`），同一变异存档驱动双端，逐步推进并比较完整快照。矩阵与验证点：

| # | 场景 | 构造 | 步进 | 场景有效性验证点（对两端独立断言） |
|---|---|---|---|---|
| 1 | `long-run-9000` | 原始 fixture | 3 × 3000 回合 | 每步双端快照 deepEqual（所有场景的公共断言，下同） |
| 2 | `offline-1h` | `gameTimestamp` 拨早 1h + 离线开 | 离线结算 + 200 回合 | 结算后**金币确实增长**；结算后 `gameTimestamp` 已前移 |
| 3 | `offline-8h` | 拨早 8h + 离线开 | 离线结算 + 200 回合 | 结算后**击杀确实增长**；时间戳前移 |
| 4 | `offline-disabled` | 拨早 1h + **离线关** | 离线结算 + 200 回合 | **金币不得变化**（验证开关真实生效） |
| 5 | `potions-active` | 注入 3 种已激活药水（doubleKills/randomBossEncounter/doubleGold） | 2 × 600 回合 | 快照含药水激活状态 |
| 6 | `potions-inactive-auto` | 注入 3 种未激活药水（doubleKills/doubleExperience/randomTreasureRoom） | 2 × 600 回合 | 验证拾取/自动激活路径 |
| 7 | `scrolls-stocked` | 注入 4 种卷轴（shock×99 / spiderWeb×50 / arrow×50 / fireBall×20）并解锁 | 2 × 600 回合 | 卷轴消耗路径 |
| 8 | `gold-windfall` | 金币改 1,000,000 | 2 × 600 回合 | 大额金币下的购买/升级路径 |
| 9 | `late-horizon` | `turnNumber += 1,000,000` | 2 × 500 回合 | 超长回合数下的曲线与再感染周期 |

公共断言：每步双端快照逐字段相等、两端浏览器无异常；失败时把双端 JSON 落盘 `output/scenarios/`（`test-scenarios.mjs:100-105,123-129`）。`harness.load` 前后重置 LCG 相位，保证两端从同一随机流起点出发（`:89-91`）。

### 3.3 第 3 层：E2E 冒烟（`scripts/test-browser.mjs`，针对新 UI 壳 + 重构引擎）

覆盖列表（单次浏览器会话顺序执行）：推荐队伍建队 → 改名"远征队长" → 开局 → 自动战斗 turn>2 → 4 名英雄与改名生效 → **暂停冻结**（700ms 内 turn 不变）→ 五类面板（heroes/monsters/dungeons/castles/points）可见性 → 设置持久化（effects/offline 开关写入快照）→ 导出存档下载 → **非法存档导入被拒且不覆盖 localStorage 进度** → 合法再导入成功 → 备份键 `C2_V1_001_backup` 存在 → **刷新恢复**（名字与设置还在）→ 1024/375 视口无横向溢出 → 空格键恢复冒险 → 全程无 console error/pageerror（`:12-74`）。

### 3.4 第 4 层：单测（`tests/unit/`，`npm run test` 纯 Node，无需浏览器）

| 文件 | 覆盖点 |
|---|---|
| `tests/unit/rng.test.mjs` | 原版 `ga` 的 Babel AST 提取与重构版 `SeededRandom` 逐值差分（6 种子 × 100,000 值）；JS 浮点变体黄金值 `[1859732469, 3401144660, 1032891371]`（seed 5489）；同种子确定性；异种子分叉。方法详见 `docs/rng.md` §3 |
| `tests/unit/save-codec.test.mjs` | LZ-string 1.3.3 Base64 codec 往返（空串/中文/emoji/100KB）；**原版 fixture 可被当前 codec 解码**且顶层语义键存在（saveKey/gameTimestamp/turnNumber/world/party/adventurers/statistics）；重压缩后仍可互通 |
| `tests/unit/format.test.mjs` | `formatPositiveAmount/formatAmount/formatGroupedAmount` 的单位阈值链（K/M/B/T/P/Z/Y）与千分位分组的 characterization（阈值边界来自原版比较链） |

### 3.5 存档兼容契约（贯穿四层）

`tests/fixtures/original.c2save` + 解码后 4,477 个全语义化键、29 个顶层键（facts.md 第 5-6 条）；序列化时间戳语义（第 7 条）；运行时字段 ↔ 存档键显式映射（第 8 条）。任何触碰 `persistence/` 或字段重命名的工作，必须四层全绿后才算完成。

## 4. 已知合法差异

**无。** 截至 2026-09-26，四层全部实测通过：parity 4 项、场景矩阵 9 项、E2E 冒烟、单测（`docs/WORKSTATE.md` §3 记录 parity/E2E 实测时间戳；facts.md 第 12、19-20 条记录离线场景与差分方法论验证）。工程不维护"合法偏差清单"——任何 deepEqual 失败即回归，处理方式是修复重构版或回退改动，而不是放宽断言。

## 5. 已知未覆盖区域（如实陈述）

以下区域**没有**专门的差分场景，行为一致性仅被现有测试间接覆盖或完全未验证：

1. **prestige/victory 全流程**：`gameWon=true` 的存档、胜利结算视图、`victoryCount`/`victoryStatistics` 累计、胜利后继续（continuation）与点数/成就回收的端到端链路，均无差分场景（fixture 处于冒险中段，场景矩阵不含胜利态构造；`resetContinuation` 路径无差分覆盖）。
2. **部分法术分支**：场景 7 只注入 shock/web/arrow/fireball 四种卷轴；`content/spells.js` 中其余法术效果分支（如 stun 冲击波 `blastStunSpell` 的部分路径、电系/火系高阶效果）未被任何差分场景触发，仅靠 parity 的顺路执行覆盖。
3. **大型城堡战**：fixture 未处于城堡攻坚阶段；`spawnCastleGuardians`/随从（minions）的多波大规模战斗、城堡升级购买链没有专项场景。注意该区域恰是历史回归发生地（facts.md 第 20 条：`guardians.js`/`minions.js` 数据键漏改导致 `generateItem(undefined)` 崩溃，当时由 900 回合 parity 间接暴露）——在此区域做重命名时，建议先补"城堡中段存档"差分场景再动手。
4. （源自 `docs/WORKSTATE.md` §6 的遗留说明：离线/药水/卷轴/长跑专项场景现已由本基线 §3.2 覆盖，但"1500/5000 回合中段注入、多 fixture"仍无。）

以上未覆盖区域在扩展测试时的入口均为 `tests/scenarios/save-mutations.mjs`（新增存档变异器）+ `scripts/test-scenarios.mjs`（追加场景行），无需改动 harness。
