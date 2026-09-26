# REFACTOR REPORT — Clickpocalypse II 语义恢复与现代化工程

> 执行窗口：2026-09-25（首次恢复）→ 2026-09-26（本次会话）。
> 配套文档：`MIGRATION_MAP.md`、`COMPATIBILITY_REPORT.md`、`PERFORMANCE_REPORT.md`、`docs/architecture.md`、`docs/WORKSTATE.md`（续跑入口）、`docs/reverse-engineering/facts.md`（事实库）。

## 1. 原始问题

`c2.js`：46,980 行高度混淆的浏览器游戏单体——1,231 个压缩符号（`ga`、`lB`、`pB`…）、数百个单字母字段、全部逻辑（模拟/渲染/DOM/存档/RNG）耦合在一个 `<script>` 里，无测试、无文档、无构建。直接维护等于持续逆向。

## 2. 恢复出的架构（考古结论，非设计）

游戏是**回合制 idle RPG**：250ms 一回合的模拟核心 + 60Hz 渲染循环 + 帧循环驱动的离线结算；两条随机源（MT19937 变体管世界生成、`Math.random` 管战斗掉落）；存档为语义化 JSON → LZ-string 1.3.3 Base64 → localStorage。完整论证见 `docs/architecture.md`（15 问 + 6 幅 Mermaid 序列图，315 处 file:line 引用）。

## 3. 新架构

```
archive/original/c2.js  ──AST 机械恢复──▶  src/engine/（74 模块，约 5.3 万行）
                                            core ← content/characters/combat/loot/world/…
                                                   ← simulation ← runtime(组合根)
                                            唯一产品入口：src/engine/adapter.js（命令校验+只读快照）
新增 UI 壳：src/app.js + src/ui/（中文界面，经 adapter 访问引擎，DOM 面板契约保留）
```

- **不是重写**：恢复清单 `archive/migration/recovery-manifest.json`（atlas 抽取、codec 复用、ES module 化、初始化函数化、Game 私有化）。
- 依赖方向单向；`core/` 不依赖 `game`；循环依赖由 `runtime/index.js` 初始化顺序打破。

## 4. 关键语义恢复（证据分级均为 HIGH）

| 领域 | 恢复内容 |
|---|---|
| RNG | `ga`=SeededRandom（**JS 浮点变体 MT19937**，黄金值锁定）；`randomInt` 走全局 `Math.random`；两条随机流的消费顺序受差分保护 |
| 存档 | 30 顶层键语义化 DTO；4,477 键实测无混淆键；LZ-string 1.3.3 契约；`gameTimestamp` 写当前时刻/恢复为 lastActiveAt |
| 离线 | 120s 阈值、12h+加成上限、帧循环驱动（每帧≤200 回合）、后台标签页累加路径 |
| 领域字段 | 30+ 字段身份重命名落地（position/levelPosition/room/slot/characteristic/statType/spriteName/canPurchase/tabState/currentValue 组/tileGrid/worldBlocks 组/动画帧表组/Achievement 组…），映射与证据见 `docs/reverse-engineering/semantic-map.md` |
| 外部契约 | `window.Game/lB/pB/hE` → adapter/runtime API（MIGRATION_MAP.md 对照表） |

## 5. 测试体系（全部实测通过）

| 层 | 内容 |
|---|---|
| L1 单元 | RNG 位级差分（Babel 提取原版 `ga` 对照，6 种子×100k 值+黄金值）、codec 契约、格式化表驱动（9 项） |
| L3/L4 差分 | parity：同存档+固定 RNG/时钟，0/1/99/900 回合全状态相等；场景矩阵 12 场景（离线 1h/8h/disabled 含"必须真增长/必须不变"断言、药水、卷轴、金币、后期、9000 回合、veteran 解锁、prestige 重置、完全重置） |
| L6 E2E | 建队/自动战斗/暂停/五面板/设置/导出导入/非法存档/刷新恢复/键盘/三视口 |
| 工程门 | `npm run check`（104 文件语法+单测）；每切片一 commit（本次会话 20+ 个，格式 `refactor:/test:/docs:/perf:`） |

方法论实证：**场景矩阵抓住了 parity-900 无法覆盖的真实回归**（guardians.js/minions.js 数据键漏改 → 城堡守卫生成崩溃）——垂直内容只有长程场景能触达。

## 6. 兼容性（详见 COMPATIBILITY_REPORT.md）

存档兼容、行为差分、RNG 确定性、离线语义 = **VERIFIED**；DOM 外部契约 = PARTIALLY VERIFIED（未用 c2c.user.js 实测）；prestige/victory/部分法术/城堡战 = UNRESOLVED（未纳入差分场景，非已知不兼容）。

## 7. 性能（详见 PERFORMANCE_REPORT.md）

重构/原版比值 1.0–1.1x（推进/序列化/导入/离线四项）；模拟占回合预算 0.03%。未做无数据驱动的优化。

## 8. 剩余风险与未完成

1. **字段重命名未竟**：约 1,300 处单字母字段访问残留（技能定义表 `c/e/f/g/h` 为主）；`c` 已有 HIGH 证据待落地，其余需新取证。工作清单：`artifacts/obfuscated-fields.json`。
2. **差分覆盖缺口**：prestige/victory、法术分支、城堡战（扩展 `save-mutations.mjs` 变异器即可纳入矩阵）。
3. **M10 类型体系**未开始（建议 JSDoc 从 core/ 与 persistence/ 起步）。
4. 渲染层真实帧时间/内存 soak 未测（harness 基线已就位）。
5. 一处语义推断标注"待验证"（room.Yp 的 0/1/2 标签，见 architecture.md）。

## 9. 后续开发方式（对新开发者的承诺）

```bash
npm install && npm run dev     # 一条命令跑起来
npm test && npm run check      # 一条命令测试
```
- 找战斗：`src/engine/modules/combat/`；物品：`loot/`；地牢：`world/`；存档：`persistence/`；随机：`core/math.js`；渲染：`rendering/`。
- 改任何行为前先读 `docs/architecture.md` 对应小节；改数值前读 `content/`；**不要**碰 RNG 顺序与存档键（差分会拦住你，但先读 facts.md 更省时间）。
- 续跑入口：`docs/WORKSTATE.md`（含下一步任务队列与避坑清单）。

## 10. 结论

Clickpocalypse II 的核心实现已从高混淆遗留代码中恢复出真实语义：关键玩法行为有自动化差分证据保护，存档/RNG/时间/离线机制经兼容验证，业务逻辑已迁入带清晰边界的现代模块，旧文件不再是唯一真相来源。这些改善由运行与差分证明，而非主观判断。

---

## 附录 A：验收矩阵（规范 §56，截至 2026-09-26）

判定依据：VERIFIED=有差分/单测/E2E 自动化证据；PARTIAL=有证据但覆盖不全；未列出的长尾系统=依赖同构恢复+全局差分间接保护。

| 系统 | 判定 | 证据 |
|---|---|---|
| Bootstrap/启动 | PASS | architecture.md §1 + E2E 启动断言 |
| Party 创建 | PASS | E2E（建队/改名/开战）+ adapter.startParty 校验 |
| 角色等级/XP/属性 | PASS | 差分 12 场景（adventurers 全字段逐回合相等） |
| 角色技能/技能树 | PARTIAL | 差分覆盖常规技能升级；个别技能分支未专项触发 |
| Inventory/Equipment/Auto equip | PASS | 场景矩阵（金币涌入触发购买/掉落/自动装备路径）+ itemsFound 统计相等 |
| 怪物定义/升级 | PASS | 差分（monsterTypes 全量相等） |
| Combat/Crit/Stun/Skills/Spells | PARTIAL | 9000 回合 + 12 场景战斗统计相等（melee/ranged 计数）；法术专项分支未逐一触发 |
| Loot/Gold/Items | PASS | 场景矩阵 + 统计相等 |
| Scrolls/Potions | PASS | 专项场景（激活/自动激活/库存） |
| Treasure | PASS | 宝箱管理器状态差分相等（treasure 场景注入） |
| Dungeon 生成/导航 | PASS | 差分（level/hallways/roomVisibility 全量相等） |
| Castle/Farming | PARTIAL | 状态差分相等；城堡征服全程未专项触发 |
| Adventure Points/Point upgrades | PASS | pointManagerState 差分相等（离线/长跑覆盖重算路径） |
| Achievements/Statistics | PASS | achievementManager/statistics 全量差分相等 |
| Pause/Background | PASS | E2E 暂停断言 + loop 守卫差分 |
| Offline progression | PASS | offline-1h/8h/disabled 三向验证（收益真实发生 + 双端相等） |
| Auto/Manual save/Load/Import/Export | PASS | parity + E2E + codec 单测 |
| Legacy save compatibility | PASS | fixture 载入 + 往返 + 4477 键审计 |
| Prestige/reset | PASS | prestige-restart/full-reset 场景（本次新增） |
| RNG determinism | PASS | 单测位级差分 + 全部差分场景的确定性前提 |
| Long-running stability | PARTIAL | 9000 回合 + 离线 18925 回合无 NaN/漂移；8h+ 连续 wall-clock soak 未跑 |
| UI tabs/Canvas/Sprite lookup | PASS | E2E 面板断言 + 渲染路径差分（spriteName/getSprite 重命名后回归） |
| 类型体系/TypeScript | PARTIAL（M10 已启动） | tsconfig checkJs：core/+persistence/+save-codec 全量 0 错误；SaveData DTO typedef；16 个引擎模块已纳入（tick/game/targeting/scrolls/items/treasure/dungeons/pathfinding/regions/travel-costs/minions/party/sprites/navigation/base/party-creation/initialization）；剩余 22 个重文件 @ts-nocheck 待类成员 JSDoc 专项 |
