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

`scripts/test-scenarios.mjs` 的 **42 个场景**全部通过（同一变异存档 + 固定 LCG 随机流 + 固定时钟，双端逐字段比较完整存档 DTO；矩阵可用 `SCENARIO_FILTER=a,b` 单跑）：

| 组 | 场景 | 除全状态相等外的专项断言 |
|---|---|---|
| 长跑/后期 | long-run-9000、late-horizon | 9,000 与 +1,000,000 回合起点下逐检查点全等 |
| 离线 | offline-1h、offline-8h、offline-13h-capped、offline-disabled | 金币/击杀必须真实增长；13h 必须被截为 12h；关闭离线后金币必须不变 |
| 药水 | potions-active、potions-inactive-auto、**potions-activated** | 第三条直接驱动 `Potion.aw()`，两端 `statistics.potionsUsed` 各自增长 |
| 卷轴 | scrolls-stocked、**scroll-cast-in-combat** | 库存/数量/解锁相等；第二条在活怪物存在时施放休克卷轴，两端各自断言 `scrollsUsed` 增长后比较完整存档；其他卷轴类型未逐一施放 |
| 法术 | fireball-blast-stun、spell-status-transform、spell-buff-armor、spell-summon-ghost-skeleton、spell-summon-skeleton-army、spell-sleep、spell-heal、spell-area-bounce、spell-chain-lightning、spell-rain-damage、spell-bouncing-projectile、spell-chicken-swarm、spell-deferred-strike、spell-instant-search、spell-find-chest、spell-resurrect | 16 个 `spellCategoryId` 每条一个场景；cat=2 的 type 0/4/14 与 cat=17 另有直接计数/随从数对账；其余为"唯一注入法术 + 两端各自施法计数增长" |
| 战斗与终局 | castle-victory | 两端各自断言 `gameWon`/`victoryCount=1`/`castlesConquered=1`/全城堡征服 |
| 视图独占路径 | **upgrades-purchased** | 独立运行时两端各完成 28+24 次购买；逐检查点分别断言 `settings.upgrades`、角色等级、`upgrades1..4` 解锁位超过 fixture 基线，并比较完整存档 |
| 怪物等级解锁 | **monster-level-unlocked** | 提供击杀余额与经验值，先把队伍升至解锁门槛，再购买怪物等级；两端各自断言 `maxUnlockedLevel` 与 `monsterLevelStates` 长度从 1 增至 2，逐检查点完整存档相等 |
| 冒险点消费 | **adventure-points-spent** | 按事件次数构造足额点数，刷新可购状态后两端各自购买一项点数升级；断言 `spentAdventurePoints` 增长与 `upgradePurchased` 置位，逐检查点完整存档相等 |
| 成就领取 | **achievement-claimed** | 真实 fixture 已有一项 `obtained=true/applied=false`；两端刷新可领取升级并各领一次，断言 `applied` 增长，逐检查点完整存档相等 |
| 自动装备 | **auto-equipped** | 真实 fixture 背包已有更好的装备；两端走 type=4 的升级入口，分别断言装备槽变化、装备事件点数计数增长并比较完整存档 |
| 农场购买 | **dungeon-farm-purchased、dungeon-row-farm-purchased** | 同一合成前置存档分别驱动全局升级 type=8 与地牢行私有 type=7；两端各自断言 `farms` 实体和 `farmsPurchased` 统计增长并比较完整存档 |
| 财宝箱搜索 | **treasure-chest-looted** | 只选角色所在房间的未打开宝箱，走按钮同一目标设置入口；两端各自断言 `treasureChestsLooted` 增长，逐检查点完整存档相等；禁用目标设置的反向验证会失败 |
| 经济与成长 | gold-windfall、veteran-run、prestige-restart、full-reset | 重置后状态相等 + 空转相等 |
| 渲染与落盘 | **rendered-scene、autosave-payload** | 1,300 真实帧后主画布逐像素 FNV-1a 指纹两端相同；清空 localStorage 后两端都必须写入且解码内容一致（守住原版 3E5 自动保存间隔） |

矩阵的失败诊断保持"定位第一次分叉"：首处差异的字节偏移、两侧上下文与全保真序列化复核都会打印，差异样本落 `output/scenarios/`。

## 3. RNG 确定性 — VERIFIED

- 重构版 `SeededRandom` 与**从原版 c2.js 按 AST 提取的原始实现**在 6 个种子（含 0、1、2³²-1）下随机流逐值一致（各 100,000 值）。
- 黄金值锁定：这是 JS 浮点乘法变体 MT19937（seed 5489 首值 1859732469），**不得**替换为"更标准"实现（会破坏回放）。
- 差分 harness 通过 LCG 替换 `Math.random` + 固定 `Date.now` 实现双端完全确定性——两条随机源路径都被覆盖。

## 4. 时间、暂停与自动保存 — VERIFIED（机制级）

- 触发阈值（>120s）、时长上限（12h + 加成）、帧循环驱动（每帧≤200 回合）、后台标签页累加路径——两端代码同构且离线场景差分通过。
- 药水时长单位为**回合数**（800 + 加成）——已在 rng/time-model 文档中锁定，防止未来"毫秒化"漂移。
- **自动保存间隔 = 300,000 ms**（原版 `c2.js:44345` `this.UC = 3E5`）。重构版曾为 3E4（10 倍频率），由新增的 `autosave-payload` 场景暴露并修正；该场景改回 3E4 会失败，因此这个常量现在被测试守住。

## 5. DOM/外部契约 — VERIFIED（选择器级），非零散手工验证

- 外部自动化脚本 `archive/original/c2c.user.js` 只通过 jQuery 选择器观察/操作游戏。`scripts/test-browser.mjs` 现在逐项断言它实际使用的 10 个选择器在活动 DOM 中存在：`#encounterNotificationPanel`、`#treasureChestLootButtonPanel`、`.gameTabLootButtonPanel`、`#adventurerEffectIconA0/B0`、`#potionButton_Row0_Col0`、`.potionContentContainer`、`#scrollButtonCell0`、`#pointUpgradesContainer_0_0_0`、`[id^="characterSkillsContainer0_0_0_"]`。缺失即失败，且经过反向验证（把 `#scrollButtonCell0` 指向不存在的 id 后 E2E 如期报错）。
- 只在瞬时状态出现的契约（`.bossEncounterNotificationDiv`、`.lootButton`、`.potionButtonActive`、`.scrollButton`）未纳入，需要专门场景才有意义。
- 本轮另断言角色技能表第二列的按钮容器实际存在；把列号改成不存在的值后 E2E 按预期失败。冒险点列表在起始存档中第二列为空，因此没有将该列的存在性作为通用条件。
- `window.Game` 已私有化（恢复工程的既定决策）；外部若直接依赖 `window.Game` 需走 `adapter.js`。这是有意的边界，不是回归——但确实意味着旧脚本若用全局对象而非 DOM 就需要改。

## 6. 未覆盖区域（如实陈述）— 法术类别已全覆盖，余下为归因与入口分层

法术类别覆盖已收口：`content/spells.js` 里出现的 16 个 `spellCategoryId`（1–6、8–17，目录中不存在 cat=7）每条都有专属差分场景。仍要如实说明的边界有两条：
- 归因方式分层。只有 cat=2 的 type 0/4/14（harness 逐帧扫描活怪物效果队列的直接计数）与 cat=17（存档内 `minionsSummoned` 对账）有专属可观测量；其余类别依赖"该角色唯一注入法术 + 两端各自 `spellCastCount` 增长"的归因，再叠加逐检查点完整存档差分。
- 入口分层。怪物/首领 AI 施法与卷轴施法两条入口与职业施法共用同一 `applySpellEffect` 分发，但没有按类别为这两条入口单独设场景（`scrolls-stocked` 抽到哪类卷轴取决于随机池，未被逐类别断言）。

已转入差分覆盖（2026-09-26）：城堡攻防战全程与胜利瞬间（`castle-victory`，两端各自断言 gameWon/victoryCount/castlesConquered 后比较完整存档）、12h 离线截断（`offline-13h-capped`）、火球与两条控制/增益法术分支、召唤族两条分支（cat=9/11，两端各自断言 `minionsSummoned` 增长）、睡眠（cat=2、type=0），以及 Blast Stun 的直接执行计数——harness 逐帧扫描两端活怪物效果队列，`fireball-blast-stun` 实测原版与重构版各 31 次 type=14 施加，数值相等。同批次再补 10 条：cat=1 治疗、cat=4 火环、cat=5 连锁闪电、cat=6 闪电雨、cat=13 绿色死亡、cat=17 召唤鸡群（含 `Math.random` 概率模板分支），需要注入投射武器的 cat=12 快速打击（唯一 `td: false`）、cat=14 立即搜索、cat=15 发现财宝箱——后三条在注入前会命中原版自带的空武器解引用（`Aw`/`getProjectileAnimation` 对 `equipment.Ey` 无空值保护，两端同点同错，栈逐帧同构），属忠实保留而非重构差异，因此未改动引擎，只在存档里补回真实武器类型（盗贼槽 61、忍者槽 62）；以及 cat=16 复活（`withResurrectionTrial()` 激活 `randomBossEncounter` 药水并把三名队友压到 1 级 1 血，两端实测 `characterStunnedCount` 同为 22，真正打出"已有昏迷队友"的前置）。

后续扩展路径：在 `tests/scenarios/save-mutations.mjs` 增加对应变异器，即可纳入 `test:scenarios` 矩阵（当前 42 个场景）。

## 7. 性能兼容 — PARTIALLY VERIFIED

当前 `output/perf/perf-baseline.json` 的单次 CPU 样本：回合推进 0.0824 vs 0.0764 ms（1.08x）、序列化 0.114 vs 0.080 ms（1.43x）、导入 22.4 vs 30.0 ms（0.75x）、离线 1h 结算 199.8 vs 251.7 ms（0.79x，同为 18,925 回合）。旧样本的相对快慢曾翻转，倍数不是稳定结论；只能确认无数量级退化，单回合模拟约占 250ms 预算的 0.03%。`npm run perf:frames` 另测当前页面两种状态各 599 次 rAF 间隔，P95 为 4.5/4.8ms、>50ms 为 0；间隔含浏览器调度，且没有原版页面同口径基线或真机 vsync 测量，故页面帧时间等价仍未验证。
