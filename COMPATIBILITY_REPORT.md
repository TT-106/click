# COMPATIBILITY REPORT — 兼容性验证报告

> 结论分级遵循目标规范 §89：VERIFIED（有自动化证据）/ PARTIALLY VERIFIED / UNRESOLVED。
> 测试环境：Node 22.19 / Chrome (playwright channel) headless / Win32。数据截至 2026-09-26。

## 1. 存档兼容 — VERIFIED

| 验证项 | 方法 | 结果 |
|---|---|---|
| 原版存档可解码 | `tests/unit/save-codec.test.mjs`：fixture 经 LZ-string 1.3.3 Base64 解码、JSON 解析、30 个顶层键校验 | ✅ 通过 |
| 原版存档可载入并推进 | `scripts/test-parity.mjs`：同一 fixture 载入原版与重构引擎，推进 0/1/99/900 回合 | ✅ 双端完整存档状态逐字段相等 |
| 存档往返（load→save→load） | parity 的比较基准即 `createSaveState`（与写入磁盘的同一 DTO） | ✅ |
| 非法存档不破坏进度 | `scripts/test-browser.mjs`：导入 `"invalid-save"` 后 localStorage 原值不变 | ✅ 通过 |
| 导出→导入往返（UI 层） | 同 E2E：导出下载文件→回填导入→名字/设置保持 | ✅ 通过 |
| 刷新恢复 | 同 E2E：reload 后进度与设置持久 | ✅ 通过 |

存档格式契约：JSON → LZ-string **1.3.3** Base64（vendor 版本固定，见 `src/vendor/`）；解码实测 **4,477 个键全部为语义化命名**（无单字母键），重构版全部字段重命名均未触碰存档 JSON 键；`game-save.js`/`entities.js` 中"运行时字段 ↔ 存档键"的映射行成对同步并有 parity 保护。

## 2. 行为兼容（原版 vs 重构差分）— VERIFIED（覆盖范围内）

`scripts/test-scenarios.mjs` 的 12 个场景全部通过（固定 LCG 随机 + 固定时钟，双端逐字段比较完整存档 DTO）：

| 场景 | 变异 | 验证点 | 结果 |
|---|---|---|---|
| long-run-9000 | 基线存档连推 3000×3 回合 | 全状态相等 | ✅ |
| offline-1h | 时间戳 -1h | 离线结算后金币**实际增长**且双端相等 | ✅ |
| offline-8h | 时间戳 -8h | 离线结算后击杀**实际增长**且双端相等 | ✅ |
| offline-disabled | 关闭离线开关 | 载入后金币**必须不变** | ✅ |
| potions-active | 3 个药水（含激活态） | 600+600 回合相等 | ✅ |
| potions-inactive-auto | 3 个药水（待自动激活） | 600+600 回合相等 | ✅ |
| scrolls-stocked | 4 种卷轴入库解锁 | 600+600 回合相等 | ✅ |
| gold-windfall | 金币 1,000,000 | 600+600 回合相等 | ✅ |
| late-horizon | 回合数 +1,000,000 | 500+500 回合相等 | ✅ |
| veteran-run | victoryCount=3（解锁门槛内容） | 600+600 回合相等 | ✅ |
| prestige-restart | 胜利重置（保留统计、清当前冒险） | 重置状态相等 + 空转 300×2 相等 | ✅ |
| full-reset | 完全重置回开局 | 重置状态相等 + 空转相等 | ✅ |

## 3. RNG 确定性 — VERIFIED

- 重构版 `SeededRandom` 与**从原版 c2.js 按 AST 提取的原始实现**在 6 个种子（含 0、1、2³²-1）下随机流逐值一致（各 100,000 值）。
- 黄金值锁定：这是 JS 浮点乘法变体 MT19937（seed 5489 首值 1859732469），**不得**替换为"更标准"实现（会破坏回放）。
- 差分 harness 通过 LCG 替换 `Math.random` + 固定 `Date.now` 实现双端完全确定性——两条随机源路径都被覆盖。

## 4. 时间/离线语义 — VERIFIED（机制级）

- 触发阈值（>120s）、时长上限（12h + 加成）、帧循环驱动（每帧≤200 回合）、后台标签页累加路径——两端代码同构且离线场景差分通过。
- 药水时长单位为**回合数**（800 + 加成）——已在 rng/time-model 文档中锁定，防止未来"毫秒化"漂移。

## 5. DOM/外部契约 — PARTIALLY VERIFIED

- 原版 DOM 面板结构由 `archive/migration/legacy-dom.html` 恢复并挂载，E2E 覆盖五类面板显示、设置持久化、暂停、键盘（VERIFIED）。
- `c2c.user.js`（外部自动化脚本）依赖的 DOM 结构保留；但**未用该脚本实测**（UNRESOLVED，低风险）。
- `window.Game` 已私有化（恢复工程的既定决策）；外部如直接依赖 `window.Game` 需走 `adapter.js`（有意的边界，非回归）。

## 6. 未覆盖区域（如实陈述）— UNRESOLVED

以下法术分支仍未进入差分场景：
- cat=16（牧师 复活）：分支要求场上已有昏迷的冒险者，而昏迷只在 `resolveCharacterDefeat` 里产生。两轮实验（其他队员存档生命 1、跑 6000 回合；再压到 1 级 + 1 血 + 伤害分量清零、跑 3000 回合）两端 `characterStunnedCount` 与 `spellCastCount` 都恒为 0，且逐检查点完整存档一致——该 fixture 下冒险者从未被击倒。

已转入差分覆盖（2026-09-26）：城堡攻防战全程与胜利瞬间（`castle-victory`，两端各自断言 gameWon/victoryCount/castlesConquered 后比较完整存档）、12h 离线截断（`offline-13h-capped`）、火球与两条控制/增益法术分支、召唤族两条分支（cat=9/11，两端各自断言 `minionsSummoned` 增长）、睡眠（cat=2、type=0），以及 Blast Stun 的直接执行计数——harness 逐帧扫描两端活怪物效果队列，`fireball-blast-stun` 实测原版与重构版各 31 次 type=14 施加，数值相等。同批次再补 9 条：cat=1 治疗、cat=4 火环、cat=5 连锁闪电、cat=6 闪电雨、cat=13 绿色死亡、cat=17 召唤鸡群（含 `Math.random` 概率模板分支），以及需要注入投射武器的 cat=12 快速打击（唯一 `td: false`）、cat=14 立即搜索、cat=15 发现财宝箱——后三条在注入前会命中原版自带的空武器解引用（`Aw`/`getProjectileAnimation` 对 `equipment.Ey` 无空值保护，两端同点同错，栈逐帧同构），属忠实保留而非重构差异，因此未改动引擎，只在存档里补回真实武器类型（盗贼槽 61、忍者槽 62）。

后续扩展路径：在 `tests/scenarios/save-mutations.mjs` 增加对应变异器，即可纳入 `test:scenarios` 矩阵（当前 29 个场景）。

## 7. 性能兼容 — VERIFIED

重构引擎相对原版：回合推进 1.06x、序列化 ~1.0x、导入 0.94x、离线结算 1.07x（详见 `docs/performance-baseline.md`）。模块化未引入可测量的性能退化。
