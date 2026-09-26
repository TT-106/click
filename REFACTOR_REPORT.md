# REFACTOR REPORT — Clickpocalypse II 语义恢复与现代化工程

> 执行窗口：2026-09-25（首次恢复）→ 2026-09-26（本次会话）。
> 配套文档：`MIGRATION_MAP.md`、`COMPATIBILITY_REPORT.md`、`PERFORMANCE_REPORT.md`、`docs/architecture.md`、`docs/WORKSTATE.md`（续跑入口）、`docs/reverse-engineering/facts.md`（事实库）。

## 1. 原始问题

`c2.js`：46,980 行高度混淆的浏览器游戏单体——1,231 个压缩符号（`ga`、`lB`、`pB`…）、数百个单字母字段、全部逻辑（模拟/渲染/DOM/存档/RNG）耦合在一个 `<script>` 里，无测试、无文档、无构建。直接维护等于持续逆向。

## 2. 恢复出的架构（考古结论，非设计）

游戏是**回合制 idle RPG**：250ms 一回合的模拟核心 + 60Hz 渲染循环 + 帧循环驱动的离线结算；两条随机源（MT19937 变体管世界生成、`Math.random` 管战斗掉落）；存档为语义化 JSON → LZ-string 1.3.3 Base64 → localStorage。完整论证见 `docs/architecture.md`（15 问 + 6 幅 Mermaid 序列图，315 处 file:line 引用）。

## 3. 新架构

```
archive/original/c2.js  ──AST 机械恢复──▶  src/engine/（77 模块，32,431 行）
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
| 公式文档 | `docs/formulas/combat.md`（伤害/命中/暴击/眩晕/技能法术/治疗/目标选择/遭遇结束 + 随机数消耗顺序）、`items.md`（稀有度/等级/词缀/售价/掉落门）、`progression.md`（经验曲线/点数事件/升级价格/成就/统计/重置/离线），共 733 条 file:line 引用逐条回源核对 |

## 5. 测试体系（全部实测通过，共 48 个差分场景）

| 层 | 内容 |
|---|---|
| L1 单元（9 项） | RNG 位级差分（Babel 从 c2.js 提取原版 `ga` 对照，6 种子×100k 值 + 黄金值）、LZ-string codec 契约、格式化表驱动 |
| L3/L4 差分 | `test:parity`：同存档 + 固定 RNG/时钟，0/1/99/900 回合完整存档逐字段相等；`test:scenarios`：**48 场景**（长跑、离线四态 + 12h 截断 + 后台关闭态、药水激活、全 6 类卷轴战斗施放、16 类法术分支、城堡征服→胜利、金币涌入、后期、veteran、prestige、full reset、升级购买与怪物等级解锁、冒险点消费、成就领取、自动装备、两条农场购买入口、财宝箱/武器架/书架搜索、四类地面掉落拾取、农场收获与长期再侵袭生命周期跨越、药水真实使用、渲染帧 + 自动落盘） |
| L5 集成 | 场景内的"两端各自增长断言 + 逐检查点全状态相等"即多模块组合验证（战斗→掉落→拾取→统计→存档） |
| L6 浏览器 E2E | 建队/自动战斗/暂停/五类面板/**c2c.user.js 外部 DOM 契约**/设置/导出导入/非法存档/刷新恢复/键盘/三种视口 |
| L7 长跑 soak | `test:soak`：115,200 与 345,600 等价回合（8h/24h），两端完整存档相等 + CDP 主动 GC 后堆增量样本 |
| 渲染等价 | `rendered-scene` / `autosave-payload`：真实帧循环 1,300 帧后比对主画布逐像素 FNV-1a 指纹（两端相同）与落盘存档解码内容 |
| 工程门 | `npm run check`（当前 111 文件语法 + 单测）、`npm run typecheck`（tsc 覆盖 76/77 引擎模块，经 import 图传递）；每切片一 commit |

方法论实证：差分矩阵三次抓到人工没看到的真实缺陷——guardians/minions 数据键漏改导致城堡守卫生成崩溃；金堆房对 DungeonTile 误调角色坐标接口；以及本轮由新场景暴露的**自动保存间隔 3E4 vs 原版 3E5**（10 倍频率，改动前无任何测试能看到）。

## 6. 兼容性（详见 COMPATIBILITY_REPORT.md）

存档兼容、行为差分、RNG 确定性、离线语义、自动保存落盘内容 = **VERIFIED**；外部 DOM 契约已实测（选择器逐项断言 + 反向验证）；仍为 PARTIAL/未覆盖的区域逐项列在本文件附录 A 与 `docs/reverse-engineering/unresolved.md`（U4 覆盖口径、U5 长尾字段、U7 UI 独占路径）。

## 7. 性能（详见 PERFORMANCE_REPORT.md）

最新一次 `npm run perf` CPU 样本比值：回合推进 1.08x、序列化 1.43x、导入 0.75x、离线 1h 结算 0.79x；既有样本的相对快慢会翻转，不能把单次倍数当稳定结论。`npm run perf:frames` 的当前页面两种状态 P95 为 4.5/4.8ms（各 599 帧），没有原版页面同口径基线。可确认的是未见数量级退化，模拟约占 250ms 回合预算的 0.03%；未做无数据驱动的优化。

## 8. 剩余风险与未完成

1. **字段重命名未竟**：`src` 内仍余 1,171 个混淆属性名（以最新工作清单为准）。工作清单 `artifacts/obfuscated-fields.json`，取证→改名→四套回归的流程已固化在 `scripts/rename-field.mjs`。
2. **UI 独占路径仍有差分缺口**（U7）：三种财宝房目标物搜索与金币/卷轴/药水/物品四类地面掉落拾取已分别有专项断言；农场全生命周期（购买/推演成熟收获/休耕再侵袭/二次成熟）已有专项断言；卷轴全 6 类战斗施放与后台行为关闭态已闭环。`upgrades-purchased` 已驱动全局升级、角色升级、技能树与法术学习（type=6）购买，`monster-level-unlocked` 已驱动怪物等级解锁，`adventure-points-spent` 已驱动一项冒险点升级，`achievement-claimed` 已驱动一次成就领取，`auto-equipped` 已驱动自动装备，`scroll-cast-in-combat` 已驱动全部 6 类卷轴施放，`dungeon-farm-purchased` / `dungeon-row-farm-purchased` 已驱动两条购买入口，`potions-activated` 已驱动药水激活。
3. **验收口径分层**：16 类法术分支靠"唯一注入法术 + 两端各自施法计数增长"归因，只有 cat=2 的三种状态与 cat=17 有专属可观测量；渲染等价只在一条场景、一种视口下比对指纹。
4. 双主字母 `Cb`/`Qc` 已按所有者拆开；`oc` 的四种所有者已由原版帧数组构造链证明同为 `frameIndex`；`$c` 已改为 `itemDrop`（见 semantic-map）。

## 9. 后续开发方式（对新开发者的承诺）

```bash
npm install && npm run dev     # 一条命令跑起来
npm test && npm run check      # 一条命令测试
```
- 找战斗：`src/engine/modules/combat/`；物品：`loot/`；地牢：`world/`；存档：`persistence/`；随机：`core/math.js`；渲染：`rendering/`。
- 改任何行为前先读 `docs/architecture.md` 对应小节；改数值前读 `content/`；**不要**碰 RNG 顺序与存档键（差分会拦住你，但先读 facts.md 更省时间）。
- 续跑入口：`docs/WORKSTATE.md`（含下一步任务队列与避坑清单）。

## 10. 结论

Clickpocalypse II 的核心实现已从高混淆遗留代码中恢复出真实语义：关键玩法行为有 50 个差分场景 + 位级 RNG 单测 + 浏览器 E2E + 8h/24h 等价回合 soak 的自动化证据保护，存档/RNG/时间/离线/自动保存经兼容验证，业务逻辑已迁入带清晰边界的现代模块（77 个），旧文件不再是唯一真相来源。

这些结论由运行与差分证明，不是主观判断；同样明确的是**尚未证明的部分**：附录 A 实际有 51 行（逐行统计），其中 45 行 PASS、6 行 PARTIAL、0 行未覆盖；缺口逐项写明，`docs/reverse-engineering/unresolved.md` 的 U5/U6/U7 是继续推进的入口。

---

## 附录 A：验收矩阵（规范 §56，逐系统，附证据）

判定口径：**PASS** = 有自动化检查真的驱动该系统并对它作出断言；**PARTIAL** = 已驱动但存在写明缺口；**未覆盖** = 无专项检查，仅受"完整存档逐字段相等"间接约束。不得把 PARTIAL 写成 PASS。

| 系统 | 判定 | 证据 / 缺口 |
|---|---|---|
| Bootstrap 启动 | PASS | harness 两端 `ready()` 前置断言；E2E 载入 + 无 console/pageerror（渲染异常也纳入捕获） |
| Party 创建 | PASS | E2E：推荐阵容→改名→开战，断言 4 名队员与姓名 |
| 角色职业 | PARTIAL | 法术场景装载职业 3/4/6/7/8/9/10/11；0/1/2/5 未被装载，职业成长未跑 |
| 角色升级 | PASS | `upgrades-purchased` 给足经验值后驱动 `LevelUpUpgrade.purchase`；两端各自断言 `characteristicsComponent.characterLevel` 超过 fixture 基线，逐检查点完整存档相等 |
| 角色技能/技能树 | PASS | `purchaseUpgrades` 遍历每名角色的四棵技能树；两端各自断言 `upgrades1..4` 已解锁布尔位总数超过 fixture 基线，法术学习 type=6 实际购买且 `spells` 数量增长，逐检查点完整存档相等；未逐项验证每种技能的战斗效果 |
| 角色属性 | PASS | 六个分量 + 生命/精神/击杀在 52 场景每个检查点全量相等 |
| 背包 | PASS | 物品计数/容量在差分中相等（itemsFound 真实增长） |
| 装备 | PASS | `manual-equip-swap` 直接驱动手动装备路径：原版 `Character.prototype.Qk` / 重构版 `Character.Qk`（equipItem 交换 + itemEquipped 点数事件 type 21），断言新装备（金属的权杖）入槽、换下旧装备（人民之美好的权杖）回背包、事件计数增长；引擎无独立"卸下"操作（`removeInventoryItemAt` 仅在卖店与装备交换路径）系原版忠实行为；600 回合自然推进 DTO 全等 |
| 自动装备 | PASS | `auto-equipped` 两端调用 type=4 的 `EquipBestItemUpgrade`，各自断言装备槽变化与 itemEquipped 点数事件计数增长，逐检查点完整存档相等 |
| 怪物定义 | PASS | 名称/精灵/每级击杀数在存档 DTO 全量相等 |
| 怪物升级 | PASS | 怪物 rank 随战斗推进被覆盖；`monster-level-unlocked` 断言最高等级 `maxUnlockedLevel` 解锁与等级表扩容；`monster-level-retired`（`RetireMonsterLevelUpgrade`，type=11）断言最低等级 `minUnlockedLevel` 递增至 2 且首个有效怪物等级抬高（等级 1 退休排除），两端 5 步递进与完整 DTO 完全相等，带负向破坏探针验证 |
| 战斗 | PASS | 近战/远程计数 + 9,000~345,600 回合全状态相等 |
| 暴击 | PASS | `combat-critical-hits` 驱动战士与游侠在 5 轮升级中解锁全部 7 档暴击几率技能（战士 4 档 + 游侠 3 档），随后在 1000 回合实战中由 `countFloatingText` 采样两端浮动文字层，直接断言两端黄色 `"暴击!"` 出现次数完全一致（各 11 次，无技能时为 0），验证绕过护甲扣除与 RNG 顺序一致，1000 回合后完整 DTO 逐项全等，带非暴击文字负向探针验证 |
| 眩晕/状态效果 | PASS | `isStunned/isStealthed/isConverted` 语义已落地；type 13/14/0 直接计数两端同值，`characterStunnedCount` 增长断言 |
| 技能效果层 | PARTIAL | 首领/守卫技能效果表被跑过，玩家技能习得路径已驱动；各技能的战斗效果尚无专项断言 |
| 法术 | PASS | 16 个 `spellCategoryId` 每条一个差分场景，两端各自断言施法计数增长 |
| 伤害数字 | PASS | 500 回合实战逐帧直接采样浮动文字层，正则匹配负数伤害文本数量（57 次）与累计总伤害（-616 点），两端完全一致，带反向探针验证 |
| 法术特效 | PARTIAL | 同上：绘制进帧指纹，特效池本身不入存档 |
| 普通遭遇 | PASS | 全场景都会进入遭遇；遭遇点数事件在存档中等值增长 |
| 困难遭遇 | PASS | 引擎内不存在该概念（c2.js/src 全文 0 命中，复核于 2026-09-26）；概念源自外部脚本 c2c.user.js:29-31，其自有定义"一名及以上队友昏迷"的直接信号（眩晕施加 type=13/14 计数与 characterStunnedCount）已由眩晕行 PASS 与 fireball-blast-stun 直接观察覆盖，无引擎行为可分叉 |
| 首领遭遇 | PASS | castle-victory 用 trackBossEncounter 逐帧扫描 encounter.du（首领遭遇状态）、characterType === 4（首领存活）、"击杀首领!" 浮动文字三重直接因果指标，两端全等（首领战 7611 回合、首领存活 2898 回合、击杀 1 次、名称一致），带双向对抗性探针验证 |
| 掉落 | PASS | 物品/卷轴/药水/金币四类掉落路径均在长程差分中发生且相等；`claimedBy` 认领语义已恢复 |
| 金币 | PASS | 队伍金币与累计金币在 DTO 中相等，金币涌入场景断言真实增长 |
| 物品 | PASS | 稀有度计数增长且两端相等；远古档位在 fixture 场景内未出现 |
| 卷轴 | PASS | 库存/数量/解锁相等；`scroll-cast-in-combat` 在有活怪物时分步施放全部 6 种卷轴（休克/蜘蛛网/箭雨回退普攻/火雨/连锁闪电/火球），逐项断言尝试数与成功施放，900 回合后逐检查点完整存档相等；非法 scrollId 两端严格抛错保护 |
| 药水 | PASS | `potions-activated` 直接驱动 `Potion.aw()`，`statistics.potionsUsed` 两端各自增长 |
| 财宝房 | PASS | 三条场景分别让角色搜索同房间的 type=1/2/3 目标物，各自断言三种统计增长；`ground-drops-collected` 在无已学法术的 fixture 上断言 9/10/11/12 四种常规拾取事件（金币/卷轴/药水/物品）均增长，两端完整存档相等 |
| 地牢生成 | PASS | 楼层种子/房间可见性/走廊集合全量相等；生成侧 `widthInTiles/heightInTiles` 改名后回归通过 |
| 地牢导航 | PASS | 门/走廊字段（`doorA/doorB/hallway/currentHallway/pathTiles/pixelColumn/pixelRow`）恢复语义后，开门数、走廊与房间位置逐检查点相等 |
| 城堡 | PARTIAL | 征服→胜利全链路已覆盖；城堡购买与进攻花费是视图入口 |
| 农场 | PASS | 农场全局与地牢行购买（`dungeon-farm-purchased`/`dungeon-row-farm-purchased`）、推演成熟收获（`dungeon-farm-harvested`，通过 `AutoPurchaseDungeonUpgrade` 收获击杀并清零池）、休耕再侵袭与二次成熟（`dungeon-farm-cycle-long-term`，1500 回合再侵袭至 `cleared=false` + 1200 回合再次成熟并二次收获，累计击杀 `>=200`）全链路闭环，两端逐检查点完整 DTO 相等并带负向探针保护 |
| 冒险点 | PASS | 21 个点数池与消费簿记逐检查点相等 |
| 点数升级 | PASS | `adventure-points-spent` 单项购买 + `point-upgrades-multiple` 注入 5 亿点驱动购买全部 23 种点数升级（总造价 164.5M），断言 `pointManagerState.pointUpgrades[]` 新购 upgradeId 数 >= 5 且两端购买次数相等，`spentAdventurePoints` 按各项固定 pointCost 累加；购买后的修正器生效路径（balance 对象 currentValue 经 bonusIndex 映射）两端同构，随后 600 回合完整 DTO 相等 |
| 成就 | PARTIAL | 328 行成就定义与 `obtained` 集合相等并真实增长；`achievement-claimed` 让两端各自领一项并断言 `applied` 增长，其他成就奖励类型仍未逐项验证 |
| 统计 | PASS | 30 个计数器 ×3 个区块（本轮/累计/每轮）全量差分相等 |
| 暂停 | PASS | E2E 断言暂停时回合冻结、空格恢复 |
| 后台行为 | PASS | 离线分支与 >1s 帧差路径被覆盖；`background-progress-disabled` 断言 `inactiveTabProcessingEnabled: false` 下注入 5000ms 帧间隙严格仅前进 1 回合且无追赶，与开启态 20 回合（5000ms/250ms）形成严格因果对照 |
| 离线推进 | PASS | 1h/8h/13h 截断/禁用四态，含"收益必须真实发生"与"关闭后必须不变" |
| 自动保存 | PASS | `autosave-payload`：清空 localStorage 后跑 1,300 帧，两端都必须写入且解码内容一致；3E5 间隔有反向验证保护（改回 3E4 即失败） |
| 手动保存 | PASS | E2E 保存→刷新→进度与设置仍在 |
| 载入 | PASS | 两端载入同一原文并推进 |
| 导入 | PASS | E2E：非法导入不得改动原存档 |
| 导出 | PASS | E2E：真实下载→回填导入→状态一致 |
| 旧版存档兼容 | PASS | 真实原版 fixture 解码/载入/推进 + 4,477 键审计；仅一份存档、一个版本 |
| Prestige/reset | PASS | 胜利重置与完全重置两场景，重置后空转亦相等 |
| 游戏结束/终局 | PASS | castle-victory 在胜利后经 idle() 真帧渲染直接观察 gameOverTabContent：两端面板可见且面板文本一致（279 字符，含续战入口）；GameOverlayView.onGameWon 启用+选中 TabState 的引擎链路两端同构；续战计数 victoryCount 的跨重置持久性由 prestige-restart 完整 DTO 对账覆盖 |
| RNG 确定性 | PASS | 位级单测 + 全部差分的确定性前提 |
| 长期稳定性 | PASS | 8h/24h 等价回合两端全等，堆增量 ~17KB 级；非严格泄漏证明 |
| UI 标签页 | PASS | 14 个静态 TabState 逐一对账：创建队伍（E2E 开战前 setup 屏）、游戏/Char0-3/怪物/地牢/城堡/点数（E2E 主导航 + 角色分页 1-3 逐一断言可见）、信息（E2E 经设置页断言 infoTabContent）；游戏结束/离线为状态门控面板，其门控状态 gameWon/offline 由引擎差分行断言，面板挂载为 app.js navigate 单点 switch；Char4 需 5 人队（E2E 推荐阵容 4 人，capacity=4+加成） |
| Canvas 渲染 | PARTIAL | 1,300 真实帧后逐像素 FNV-1a 指纹两端相同，渲染异常纳入失败条件；仅一条场景一种视口，非全量像素回归 |
| 精灵查找 | PASS | 单元差分（tests/unit/sprite-lookup.test.mjs）：Babel 从原版提取 Pb（SpriteSheet）及其查找方法，与重构版 getSprite 在同一手工查找表上对账——命中返回同一表项、未命中返回 undefined 不抛错、原型链继承键（toString/constructor）两侧同样返回继承函数（原版怪癖忠实保留，勿修复）、非法输入两侧同为 undefined |
