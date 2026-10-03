# 完整现代化目标与当前状态（2026-09-28）

> **当前产品范围（R35，2026-10-03）**：Godot 继续独立保留并暂缓。用户授权浏览器 UI 上移、去顶栏、保留像素风减少杂乱及修复墙地闪动；产品默认 `clean`，引擎默认 `classic` 保留原版逐像素 oracle。`clean` 是有意变化的表现，不承诺其像素与原版相同。玩法/RNG/存档契约继续保持。当前源码审计：95 个 JS、79 个引擎模块、552 条导入边；game 直连 23、最大 SCC 41、单字母绑定 57、短名 46。仍存在完整现代化与 4 条 PARTIAL 的缺口。验证入口新增 `npm run test:presentation`，本批结果与日志见 `docs/WORKSTATE.md`。

本文件跟踪用户的完整目标：**产品运行不依赖原版高混淆反编译文件，原有玩法与功能尽量等价，源码采用可维护的命名与架构**。U134 的 89 条差分场景和 10 门禁证明了当时的恢复工作达到其验收范围，**不等于完整现代化已经完成**。

## 验收口径

| 目标 | 当前证据 | 判定 |
|---|---|---|
| 产品与原版反编译文件分离 | `index.html` 只加载 `src/app.js`；`npm run build` 现审计全部源码模块的导入及实际 `dist/`，原版档案依赖 0。**R26 重新做越界注入反向验证**：临时在 `src/app.js` 加一行 `import "../archive/original/c2.js"`，审计立刻以 `导入越过 src 或目标不存在：src\app.js -> ../archive/original/c2.js` 退出码 1；撤掉后恢复通过且计数回到 94 模块 / 549 导入 / 136 产物（`git diff` 对 `src/app.js` 为空，确认逐字节还原）。原版仅作为差分测试 oracle。 | 产品运行路径已分离；守卫本身经过破坏性验证，不是只跑一次的成功路径。 |
| 行为与功能保真 | 本轮 0/1/99/900 回合完整存档对照、89/89 差分场景、浏览器端到端测试通过；U134 验收矩阵仍为 47 PASS / 4 PARTIAL。 | 已覆盖的行为通过；全功能等价尚不能宣称。 |
| 现代命名与架构 | `statistics.js`、`stats.js`、`effects.js` 的局部语义命名与显式输入已落地；装备目录 39 个类型名和 903 处关联引用已语义化；物品生成与掉落显式接收依赖；黄金视图经只读函数取状态；R22–R25 已把全库八大热点（behaviors 264、scene 196、upgrade-details 152、terrain 131、generation 130、actions 116、rooms 116、upgrades 110）全部语义化归零，inventory.js 退出 game 依赖；R30 把 `views/dungeons.js`、`views/results.js` 归零并让 `views/castles.js`、`persistence/entities.js` 退出直连；R31 授权"语句拆分改写"类，把 `world/regions.js`、`simulation/characters.js`、`views/achievements.js`、`views/party-creation.js` 归零并让 `rendering/floating-text.js` 退出直连；R32 用它啃下嵌套短路表达式，把 `ai/targeting.js`、`world/pathfinding.js`、`views/character.js`、`loot/treasure.js` 归零并让 `views/upgrade-details.js` 退出直连。 | 单字母局部绑定已从 2,833 降到 **95**（R32 实测，分布 23 个文件），game 直连模块 49 → **24**，最大强连通分量仍 41 个模块，未完成。 |

验收时必须保留存档 JSON 键、随机数算法与调用顺序、回合节拍、画布及外部 DOM 契约，除非先有明确的版本迁移或设计决策。对每个行为切片先做原版差分和反向验证，再合入新的边界；不能把源代码行数或门禁数量当成功能覆盖率。

## 本轮可复核修改

- `progression/statistics.js`：`bindStatistics(state)` 显式接收状态，记录器不再读取全局 `game`；本轮与累计统计调用仍双写。反向验证：断开统计记录器后原版存档差分转红，恢复后转绿（`output/modernization-r1-negative.log`）。
- `characters/stats.js`：卷轴命中率更新显式接收施法者属性，属性运算与随机连锁的变量改成语义名；掷骰循环与调用次数保持原样。
- `characters/effects.js`：状态效果构造、结算、到期移除改成语义名；当前回合由调用者传入；处理顺序、眩晕解除回血条件保持不变。
- `characters/character.js` 与 `characters/stats.js`：角色属性所需的默认值与可变修正由角色构造时共享注入，属性模块不再导入内容参数；角色属性与状态效果模块因此退出最大循环依赖组。
- `content/equipment.js`：目录初始化由组合根传入物品生成器；基于语法树的绑定关系精确改名，`catalog` 为 459 处、39 个物品类型定义与其 444 处引用为同一绑定替换。此处没有更改物品登记顺序或字段。
- `loot/items.js`：物品登记、物品生成、稀有度掷点与掉落更新改成语义名；装备贴图、掉落表、冒险者列表和物品数值规则由组合根提供。哈希算法、随机消费顺序和注册顺序保留。将生成的 `itemValue` 暂时乘 2 时，拾取先行差分场景在 0 回合变红（24↔48），恢复后转绿（`output/modernization-r21-negative.log` / `r21-restored.log`）。
- `views/party-creation.js`：初始装备生成改用独立的 `startingItem`，消除角色与物品共用变量导致的类型冲突；相关组队差分场景通过。
- `views/resources.js`：黄金视图通过 `readGold()` 获取当前金币，避免捕获重置前的 `party` 对象；由 `views/dungeons.js` 提供读取函数。
- `scripts/audit-production-boundary.mjs`：审计产品入口、源码模块与构建产物；`npm run build` 自动执行。隔离注入旧脚本后检查转红，未修改产品源码。
- `scripts/audit-architecture.mjs`：增报单字母局部绑定数量，用作人工审查线索。单字母坐标或数学变量可能合理，因此此数字不是自动验收阈值。
- `content/balance.js`：升级构造器与卷轴目录在 `runtime/index.js` 组合根处提供，内容参数模块不再反向导入玩法实现；最大循环依赖组再减少一个模块。

本轮行为证据位于 `output/modernization-r*-*.log`（`output/` 是本地忽略目录）；交接时重新执行命令，不能把本地日志视为仓库永久证据。

## 2026-09-29 续轮（R24：地牢生成命名归零 + sprites.js 退出 game 依赖）

- `src/engine/modules/world/generation.js`（热点第五，130 个）：**语义化归零**。纯重命名 158 处由作用域感知脚本落地（`LayoutGenerator` 构造器五参、`canPlaceDoorAt`/`CastleLayoutGenerator.connectRooms` 族等）；16 个复用/别名函数手工拆分——`generate` 的 `g/h` 三义复用（房宽→房间号→房间别名）拆为 `roomWidth/roomId/placedRoom`、`h`（房高→undefined→抖动轮次）拆为 `roomHeight/jitterRound`；`connectRooms` 的 `a/g` 复用（房间号→时间戳、开始时间→走廊号）引入 `startTime/endTime/hallwayId`，失败分支由"逗号表达式 return"改为显式语句（日志文本与耗时不変）；`moveUpLeft/shiftLeft/shiftUp` 三胞胎的 `b`（moved 旗标↔列坐标）拆为 `moved/previousColumn/previousRow`；`placeHorizontalStairs/placeVerticalStairs` 的 `a = new DungeonStairs(b)` 参数覆写消除。**取证纠错**：`generateDungeonLevel` 第三参实为 `hasSecondEntrance`（三个调用方 character.js:1155/1180、dungeons.js:216 均传该字段），非"房间数"——首版误命名已当场修正。`LayoutMethods` typedef 补 `generate` 声明。证据：parity = 0（0/1/99/900 回合地牢布局逐字节一致——生成逻辑的最强差分）、89/89 场景 = 0、e2e = 0。
- **`rendering/sprites.js` 退出 game 依赖**（game 直连 39 → **38**，产品边界 550 → **549** 条导入）：`VisualEffect` 构造查动画改经 `bindEffectAnimations(catalog)`（在 `initializeRuntimeGame` 尾部绑定，`game.animations` 单例恢复时不替换）；`clearVisualEffects()` 改为**显式接收特效管理器**（3 个调用方：game.js reset 两处、generation.js 清场，均传 `game.effects`）。证据：typecheck/lint/check/build = 0；parity/scenarios/e2e/soak = 0；`tests/unit/sprite-lookup.test.mjs` 不受影响（不触这两 API）。
- **累计指标**（R22 起）：单字母绑定 2,833 → **1,944**；game 直连 49 → **38**；最大 SCC 55 → **43**。下一热点：`combat/actions.js`（116）、`world/rooms.js`（116）、`progression/upgrades.js`（110）、`characters/character.js`（98）；解耦候选：`loot/inventory.js`（4 处 game 引用）、`persistence/entities.js`（6）。日志 `output/goal-r2/`。

## 2026-09-28 续轮（R23：渲染/地形热点命名归零 + points.js 退出 game 依赖）

- `src/engine/modules/rendering/scene.js`（热点第二，196 个）：**语义化归零**。渲染管线参数按职责定名（`setSpriteRenderCommand(command, sprite, sortKey, screenX, screenY, renderSize, alpha)` 等）；`GameCanvasView.update` 的约 70 个绑定按渲染对象族命名（`worldRowCursor`/`goldDropList`/`treasureSprite`/`effectPool`/`lightningStartX`…），闪电分支的反编译别名（`sa = renderer`、`Tb = effect`）消除；`drawWorldTileRow`/`drawDungeonTileRow` 的 `f = a` 别名与 `h = game.camera` 死双写改为单读局部。证据：**7 条逐像素指纹场景全过（渲染输出零变化）** + parity/scenarios/e2e = 0。
- `src/engine/modules/world/terrain.js`（热点第四，131 个）：**语义化归零**。`sampleNoise` 由 22 个复用变量的反编译形态重写为标准 F2 单纯形命名（`skewSum/unskewFactor/cellOriginX/corner0X/gradientIndex0/…`，逐行对应、调用序列不变）；`populateWorldBlock` 的三组别名（`l = b`、`n = f`、`p = d`）与密集逗号表达式拆为命名变量（语句与调用顺序保持，RNG 消费序列不变）；`ensureShopForDungeon` 的商店重掷循环保持原调用次数。证据：parity/scenarios/e2e/soak = 0。
- **`progression/points.js` 退出 game 依赖**（game 直连 40 → **39**，最大 SCC 44 → **43**）：新增 `bindAdventurePoints(state)`（取 `state.adventurePoints` 子对象；该子对象存档恢复时原位更新、引用稳定），在两个组合根（`runtime/game.js` resetRun、`world/initialization.js`）与 `bindStatistics` 同点调用；三个记账函数与 `recalculateAdventurePoints` 的单字母局部一并语义化。新增引擎无关单测 `tests/unit/point-awards.test.mjs`（4 条：reset 建零账户/award 记账与未知类型怪癖/increase+recalculate 重算扣减与截断/未绑定必抛错）。**反向验证**：注释掉 initialization.js 的绑定调用 → 场景红；恢复 → 绿（`output/goal-r2/f-negative.log` / `f-restored2.log`）。切片中曾把 `game.state` 整体绑入导致 boot 报 `undefined.length`——被 boot 探针当场抓住并修正（教训：bind 语义必须与 bindStatistics 同约定，收 state 取子对象）。
- **累计指标**（本轮 R22+R23）：单字母绑定 2,833 → **2,077**（behaviors 264→0、upgrade-details 152→0、scene 196→0、terrain 131→0，合计归零 743 个 + points.js 局部）；game 直连 49 → **39**；最大 SCC 55 → **43**；dist 可复现纯净 136 文件。下一热点：`combat/actions.js`（116）、`world/rooms.js`（116）、`progression/upgrades.js`（110）、`world/generation.js`（130→已归零后为 `rendering/sprites.js` 等）；解耦候选：`rendering/sprites.js`（3 处 game 引用）、`loot/inventory.js`（4）、`persistence/entities.js`（6）。日志 `output/goal-r2/`。

## 2026-09-28 续轮（R22：AI 行为热点命名归零 + 可复现纯净构建 + 升级详情视图命名归零）

- `src/engine/modules/ai/behaviors.js`（全库单字母绑定热点第一，264 个）：**全部语义化归零**。做法分两层——
  ① 纯重命名（绑定在函数内语义单一，约 540 处标识符）用 Babel 作用域感知脚本 `output/goal-r2/rename-behaviors-auto.mjs` 批量落地：只替换 `binding.identifier`/`referencePaths`/赋值左值，不触碰成员属性 `x.a`、对象键、JSDoc 与字符串；脚本内置"行数不变 + 字符串字面量多重集不变 + 每表项必须命中"三重断言。
  ② 复用变量（一处字母多义，19 个函数）逐个手工拆分为独立命名（如 `updateWorldMode` 的 `b/c/d/f` 拆为 `party/targetShop/activeCastle/targetDungeon/targetColumn/targetRow/targetTile/position`；`FollowLeaderBehavior.getBehaviorScore` 的标号 `a` 改 `threatSearch`；四个掉落认领 `getBehaviorScore` 的 `b/g/h/l/n` 拆为 `room/drops/drop/dropIndex/characterPosition/bestDrop/dropDistance/searchRoom/bestDistanceSquared`）。语句顺序、条件结构与随机消费顺序均未改动。
  证据：改名后 typecheck/lint/check = 0；0/1/99/900 回合 parity = 0；89/89 差分场景 = 0（AI 行为主要被场景矩阵覆盖）。
- `src/engine/modules/views/upgrade-details.js`（热点第三，152 个）：**同套路归零**——自动脚本 267 处纯重命名（16 个详情类构造器 `upgrade/contentContainer`、全部 `attachUpgrade(upgrade)`、各 `update()` 的 `cost/title/description` 等）+ 21 个复用变量函数手工拆分（`createDomElements` 族的 `row→cell→img` 复用拆为 `headerRow/previewCell/costIconBox/costIconImage` 等；`CharacterLevelDetails.update` 的 8 个复用变量拆为 `cost/title/monsterLevel/scaledLevel/partyMinLevel/requiredMonsterLevel/totalDamage…averageDamage…/threatCount/assessmentText`，四项队伍均值与怪物四项的对比方向、评定文案分支逐行保持）。证据：typecheck/lint/check/build = 0；parity = 0；e2e = 0；89/89 场景 = 0；doc-snippets 0 漂移。
- `scripts/build.mjs`：拷贝后新增**陈旧产物清理**——dist/ 中不在本次源清单内的文件逐一 `rm`，双重护栏（陈旧路径必须落在拷贝根之下；单轮超过 45 个中止并提示分轮，规避 safe-delete-shim 限额）。实测清掉 38 个带 U+F00D 尾随字符的 99 字节历史垃圾文件，dist 174 → **136 个文件**，与源清单精确一致；第二次构建 0 回写/0 清理，构建可复现纯净。清理只作用于 `dist/`，源工作树不受影响。
- **累计指标**：全库单字母绑定 2,833 → **2,421**（behaviors.js 264→0、upgrade-details.js 152→0）；日志 `output/goal-r2/`。

## 2026-09-29 续轮（R25：命名热点前三归零 + inventory.js 退出 game 依赖；智能体编排轮）

本轮起按用户要求改为**每切片一个执行智能体，落地后 code-review 双轴（Standards/Spec）审查**的编排：R25 共 4 个执行切片 + 6 轴审查；审查发现的命名问题全部落实后复审放行。证据与备份在 `output/goal-r25/`（`*.bak` 起点快照、`*-slice.diff` 逐切片 diff、`f-*.log` 最终门禁）。

- `src/engine/modules/combat/actions.js`（116 个）：**语义化归零**（主智能体执行）。725 行逐行对位，机械四断言（行数/字符串/数字/导出）全过，153 处 `actions.js:行号` 文档引用零漂移。一字母多义全拆：`advanceCombatAction` 的 d 四义、h 四义；`applySpellEffect` 按法术分支拆 19 名（拾取四连统一 collectorPosition/dropList/dropIndex/drop）；`resolveCharacterDefeat` 掉落段四边界 + 计数族；`createReturningAction` 双分支共享声明；label `a:`→`findOwner:`。**审查双轴 PASS**；落实两处审查修正：`effectType`→`tileEffect`（实参是完整特效对象，`remainingEffectDamage` 取证）、`goldRoll`→`goldAmount`（`1+rollGoldDrop()` 即最终金额）。
- `src/engine/modules/world/rooms.js`（116 个）：**语义化归零**（执行智能体）。657 行对位保持；1237 对标识符逐位置配对校验；`revealHallway` 12 拐角分支方向布尔几何取证（北=小行、西=小列）。**双轴 PASS**；按审查补齐双字母 `la`/`na`→`previousIsEast`/`nextIsEast`（不在单字母指标内的漏网）。
- `src/engine/modules/progression/upgrades.js`（110 个）：**语义化归零**（执行智能体）。1268 行对位保持；217 函数中仅 15 个有声明性结构差异（全为声明的拆分/同行 var 转换）；previousXxx 快照族赋值时机逐一核对。**双轴 PASS**（5 个自报把握不足点全部判定诚实命名）。
- **`src/engine/modules/loot/inventory.js` 退出 game 依赖**（game 直连 38→**37**，最大 SCC 43→**41**，产品边界 549→**548** 导入）（执行智能体）。4 处引用取证后选**调用点显式传参**（R24 `clearVisualEffects(effects)` 同款先例，非 bind）：`Inventory(victoryCount)` 容量仍构造时急切求值（时序零变化，party-creation.js:59 与 game-save.js:418 两个调用点都在 victoryCount 定值之后）；`addInventoryItem(a, b, inventories)` 第三参收 InventoryRegistry（5 调用方改传；组合根无 inventory 相关 hunk）。**反向验证红→绿**（`inv-decouple-negative.log`：破坏注入→两拾取场景 DTO 分叉红；恢复绿）。新增引擎无关单测 `tests/unit/inventory-decouple.test.mjs` 5 条（注入遗漏必抛错）。**双轴 PASS**。
- **门禁（R25 后对最终工作树逐项回显，`output/goal-r25/f-*.log`）**：lint=0 build=0 typecheck=0 check=0 parity=0 scenarios=0（89/89）e2e=0 soak=0 perf=0 perf:frames=0；`git diff --check`=0。文档可数指标同步：单测 19→**24**、语法文件 136→**137**、类型债台账 **41 `any`**/146 `unknown`（lint 口径实测）。
- **累计指标**（R22 起）：单字母绑定 2,833 → **1,602**（累计归零 behaviors 264/scene 196/upgrade-details 152/terrain 131/generation 130/actions 116/rooms 116/upgrades 110）；game 直连 49 → **37**；最大 SCC 55 → **41**。下一热点：`views/character.js`（98）、`persistence/entities.js`（94）、`ai/targeting.js`（89）、`views/expedition.js`（84）；解耦候选以 `npm run audit:arch` 实测为准（`persistence/entities.js` 6 处）。

## 2026-09-29 R26（基线复验 + 布局常量解耦 + 指标棘轮 + 改名工具固化）

本轮开局先做**状态复验**而非继续加码：`docs/modernization-status.md` 与 `docs/REMAINING-WORK.md` 描述
的 R22–R25 成果此前散在 66 个未提交文件里，一旦后续批次覆盖就无从恢复。先在实测全绿后固化为提交
`0459879`（6 门禁 + 89/89 场景 + e2e + perf 逐项回显退出码 = 0），此后工作树可回退。

- **画面布局常量退出组合根**：`tileSize: 27`/`halfTileSize: 13`/`viewport*` 六个值原先是
  `runtime/game.js` 单例字面量里的硬编码常量，实测**从未被写过**（全库仅 1 处局部变量重算
  `game.tileSize / 2 | 0`，非对 game 的赋值），也不在任何外部契约上（`tests/`、`scripts/`、
  `index.html` 均无读取点），却要求每个用到格子尺寸的模块反向依赖整个组合根。现集中到零依赖的
  `src/engine/modules/core/screen-layout.js` 作唯一来源，`game` 上的六个字段改为由常量赋值
  （**对外对象形状不变**）。`world/pathfinding.js` 只用到 `game.tileSize`，因此整条 game 依赖消失：
  **直连模块 37 → 36**（`npm run audit:arch` 实测），产品边界导入随之减少。证据：
  `node --check` 全过、`npm run test:parity` = 0（0/1/99/900 回合完整存档逐字节一致）、
  `SCENARIO_FILTER=party-creation-differential npm run test:scenarios` = 0。
  剩余 14 个模块共 149 个布局常量读取点仍混用其它 game 成员，属可机械推进的后续批次。
- **指标棘轮（防回退）**：`scripts/audit-architecture.mjs` 新增第 9 节，与受版本管理的
  `artifacts/architecture-baseline.json` 对比——总数、`game` 直连模块数、最大强连通分量，
  外加 **39 个文件各自的单字母绑定数逐项对账**，任何一项变差即退出码 1。
  这样并行批次不可能悄悄把命名债或依赖加回来（单文件维度是必要的：只比总数会让"消 A 处加 B 处"蒙混过关）。
  **反向验证**：把基线里 `singleLetterBindings` 与 `views/character.js` 各调小 1，命令立刻
  退出码 1 并指名 `单字母绑定 views/character.js: 97 -> 98 (+1)`；恢复基线后通过
  （`output/r26-ratchet-negative.log` / `output/r26-ratchet-restored.log`）。
- **改名工具固化为受版本管理资产**：R22/R25 的作用域感知改名脚本都留在被忽略的 `output/` 里，
  每轮重新发明一遍。新增 `scripts/rename-bindings-auto.mjs`：`--report` 按函数键输出单字母绑定
  工作表（形态、出现次数、行区间、重赋值次数），`--table` 按表落地，内置断言 = 函数键必须命中、
  旧名绑定必须存在、一名多义拆分的行区间必须**穷尽且不重叠**、写盘前重新解析、
  行数不变、字符串+数字+正则字面量多重集不变、导出集合不变。口径与审计一致
  （实测该工具对 `views/character.js` 报 98、对全库报 1,602，与 `audit:arch` 完全相同）。
  匿名作用域（内联 `new function(){}`、块作用域、对象方法）里的同名绑定彼此独立，
  报表与表统一用 `名@声明行` 寻址，避免按名查表静默命中最后一个绑定。

## 2026-09-29 R27（布局常量批量落地 + 结构对账门禁 + 改名工具 v2 + 会话级结构审计）

- **布局常量读取点批量替换**：`core/screen-layout.js` 的 6 个常量在 14 个引擎模块里替掉 149 处 `game.tileSize / game.halfTileSize / game.viewport*` 读取（每文件新增 1 行 import，故行数 +1）。替换由 `scripts/replace-member-reads.mjs` 按 AST 位置完成，配置里带**逐文件命中数断言**，任何一处对不上就整体不写盘。src/ 内对 `game.tileSize|halfTileSize|viewport*` 的读取已归零，字段本身仍留在 `runtime/game.js`（对外形状不变）。
- **新增结构对账门禁 `scripts/verify-structure-invariant.mjs`**：把标识符全抹成 `I` 后比对代码骨架（字符串、数字、运算符、标点、行结构保留），用"两端收缩 + 中段 LCS"对齐，只放行三条已授权结构模式——新增/改写 import 行、`game.X` 换成裸标识符带来的成员深度变化、改名工具 autoDeclare 补的 `var` 关键字。它存在的理由是本轮真出过一次事故：检查点提交把某智能体的反向验证探针 `camera.tileRowTYPO = centerY / game.tileSize | 0;` 收进了历史（7a2c981），而 parity / 89 场景 / 像素指纹 / e2e / typecheck 全绿。反向验证用那次真实提交做：`node scripts/verify-structure-invariant.mjs 7a2c981^ --file=src/engine/modules/simulation/loop.js`（在 7a2c981 的工作树里跑）报出第 72 行的孤立插入并 exit 1。盲区如实写在文件头：成员名Only 的改动（`this.a` 换成 `this.b`）骨架看不出，那类破坏由 typecheck、`audit:dead-reads` 与 lint 第 4 条的标记词检查负责。
- **改名工具 v2 `scripts/rename-bindings-v2.mjs`**：新增 `rhsKeep`（区间第一次出现的右值读到本绑定时，把右值映射到上一段的新名，`a = a + 1` 才不会被改写成 `var y = y + 1` 得 NaN）；新增支配性检查（要插的 `var` 落在 if/循环/try/三元/逻辑表达式内，而同区间还有跳出该分支的出现 → 拒，除非给 `dominationWaiver` 写出"这条分支必走"的证明，豁免条目会打印出来复核）；裸 `var a;` 重声明、循环体内携带值、逗号表达式与 for 头里的插 `var` 位置一律拒并给可读诊断。夹具与跑批已进仓库：`tests/rename-tool/run-tests.mjs`（`npm run test:rename-tool`，52 条全绿），其中两条是"不给豁免必须拒且一字节不写"与"原支配性缺口现已关闭"。旧版 `scripts/rename-bindings-auto.mjs` 暂留，供该套件的 legacy 对照使用。
- **会话级结构审计（只读，三个子智能体分组）**：base `8bb7451` → 工作树共 143 处"无配对插入行"分三组逐条判定，三组结论都是 UNEXPLAINED 为空；每组另做数字与字符串字面量多重集比对（数值字面量 0 处漂移，字符串差异全部是 import 路径与一条绑定错误提示）与"写而不读"成员扫描（0 处孤儿写入，检测器用真探针 `camera.tileRowTYPO` 验过能亮）。判定中被点名复核过的两处：`world/travel-costs.js` 的整函数重写按原版 `gx`（c2.js:22373-22381）逐语句对齐，`characters/character.js:1250` 起的新记忆化表依赖 `initializeContentBalance`（runtime/index.js:129）先于 `initializeRuntimeGame()`（同文件 165）且 balance.js 对 `attackCooldownBonus`/`freeSpellsModifier` 各只赋一次（177、243 行）。
- **参数名修正 `ai/behaviors.js`**：`PartyBuffBehavior` 的参数名与自身赋值流向交叉——原版构造函数把**第三个**实存档进 `priorityWeight`（原版 `tu(a,b,c)` 里 `this.ka = c`，`ka` 是同族行为共用的优先级字段），本轮按数据流改名并加注释记录该怪癖，赋值语句一个字节未动。


## 2026-09-29 R27 续（结构对账成门禁 + 两处组合根注入 + 命名波次及其拒绝记录）

- **结构对账接进 `npm run lint` 成为第 11 条不变量**：拿 HEAD 对工作树跑骨架对账，未提交改动里出现"改名之外且未逐条授权"的结构变动即失败。为了能长期跑而不是变成噪音，加了两个授权通道（都写在脚本文件头）：纯括号行按"本文件变动行花括号收支为 0"放行（完整块的骨架收支必然为 0，多塞一个闭括号就不为 0；先前用无符号计数误判过一次，改完重新验证）；其余插入/删除要在 `artifacts/structure-allowlist.json` 逐条列出，键是抹平后的骨架文本加计数上限，切片落地即删（本轮剪掉已提交的 15 条，留 19 条对应当前未提交改动，闲置条目会被门禁自己点名报出）。明确**拒绝**把归一化放宽成"`I()` 折成 `I`"：那会让"把一个成员读取换成函数调用"这类破坏正好隐身，而插调用就是本会话事故的类型。反向验证仍然成立——`7a2c981` 的工作树对 `7a2c981^` 跑，报 `simulation/loop.js:72` 的孤立插入并 exit 1。
- **两个模块退出 game 直连**：`progression/achievements.js`（5 处 `game.state.*` → `bindAchievementProgress(game.state)` 加未绑定即抛的访问器；`world/initialization.js` 里必须绑在 `resetAchievements()` 之前，第 187 行就要用）与 `views/monsters.js`（4 处 `game.monsterCatalog` + 1 处 `game.state.party.kills` → `bindMonsterViews(game.monsterCatalog, game.state)`，绑在 `runtime/index.js` 的 `initializeRuntimeGame()` 之后，组合根本来就已 import 这两个模块，没有新增依赖边）。绑的是容器对象本身而不是会被整体重置替换的子对象，这点写进注释。`npm run audit:arch` 实测直连模块 **35 → 33**。注意口径：用 `grep -c '^import .*runtime/game\.js'` 数会少算一个——`runtime/index.js` 写的是 `from './game.js'`，同目录相对路径不含 runtime/，模式匹配不到（这就是"计数模式必须覆盖语料"那条老坑）。功能探针输出实证 fail-loud 真的会抛：未绑定时抛"怪物图鉴尚未绑定怪物目录…"，绑定后才进入更深的真实逻辑。
- **命名波次（一文件一智能体，只自查，门禁由主智能体统一跑）**：`world/regions.js` 9 → 7、`world/pathfinding.js` 10 → 8（A* 角色 `grid`/`startNode`/`currentNode`/`doorFrom`/`builtHallway`，`PathOpenSet.remove` 用 `rhsKeep` 拆成 `node`+`nodeIndex`）、`characters/party.js` 17 → 16、`ai/targeting.js` **11 → 11 零改名**。后两个的"改不动"是穷举出来的：targeting 把 11 个绑定的全部 344 种按行切分灌进工具，14 种通过，其中 11 种就是"整段共用一个名字"（给 2-3 个不同含义的值起一个名，另一半必然撒谎），剩下 3 种把布尔/下标与 Character/Door 粘在一起，由智能体判掉；party 的 16 个剩余绑定每个都至少有一条"赋值不在整条语句就是这次赋值的语法位置"的拒绝（`for (b = c = 0; ...)`、`if (d = roomList[i], d.discovered)`、`var l = h = g = undefined`）。两个智能体都没有使用 `dominationWaiver`，并各自说明理由（条件是运行时状态而非常量）。
- **由此确定的下一步形状**：命名残量现在卡在"表达式位置的赋值"这一类，不是工具能力问题，而是"只改绑定名"的授权边界问题。要继续推进必须先定义并单独授权一类**语句拆分改写**（把 `if (x = f())` 的赋值提成前置独立语句），逐处对齐求值顺序与副作用，并由差分场景 + 存档 parity + 结构对账三重兜底。


## 2026-09-29 R28（角色面板退出 game 直连：一次批量注入的授权成本记账）

- `views/character.js` 的 18 处 `game.state.*` 与 2 处 `game.inventories.*` 改为组合根注入
  `bindCharacterViews(game.state, game.inventories)`，绑定点在 `runtime/index.js`（该文件本来就已 import
  这个视图模块，无新增依赖边）。替换前验证过两个前提：`^\s*game\.state\s*=` 在 src/ 内 0 处、
  `\.inventories\s*=` 也 0 处，即两个都是"只构造一次的容器对象"，所以按引用绑定不会读到过期快照；
  字段级重置（`adventurers.length` 清零、装备改写）不影响容器身份。功能探针 `output/probe-character-views.mjs`
  实证未绑定时 `mountCharacterView` 抛点名错误、绑定后走 `hasAdventurer=false` 分支正常返回。
  `npm run audit:arch` 实测 game 直连 33 → 32。
- 这一片给"结构对账授权清单"的规模提了个醒：一次机械的 20 点替换产生了 32 条授权条目（每个不同的
  骨架形状一条，含被替换侧）。做法上是让门禁自己吐出形状清单、按形状去重加计数上限，而不是手抄——
  手抄会漏、漏了就倾向"干脆放宽归一化"，那正是本文件头明令拒绝的路子。条目随切片落地即删（本轮剪掉
  已提交的 monsters/index 19 条）。


### 注入形状备忘：容器按引用绑、会被整体替换的走取现值回调

- 注入之前必须先跑 `grep -rnE '^\s*game\.[A-Za-z_$][\w$]*\s*=[^=]' src`。实测只有
  `game.world = new WorldMap()`、`game.level = new DungeonLevel()`（runtime/game.js:394-397、455-458 两条重置路径）
  与 `game.currentDungeon` / `game.currentCastle`（存档恢复、角色移动里指向新对象）会被整体替换；
  `game.state`、`game.inventories`、`game.minions`、`game.monsterCatalog`、`game.animations`、`game.pathfinder`、
  `game.goldDrops`、`game.treasure` 等在 src/ 内没有任何整对象赋值，按引用绑安全。全量清单与判据写在
  `docs/reverse-engineering/facts.md`。
- 因此 `characters/movement.js` 的 `bindCharacterMovement(game.state, game.minions, () => game.world)` 里
  第三个参数是**提供者回调**而不是引用。功能探针 `output/probe-movement-world.mjs` 直接演示差别：
  绑 `() => current`，先把 current 换成 WORLD-A 再换成 WORLD-B，两次 `setWorldDestination` 读到的
  分别是 WORLD-A 与 WORLD-B；若按引用绑定，第二次仍会拿到 WORLD-A（移动逻辑朝已被丢弃的旧地图走，
  而字段级差分看不见这件事）。
- 行尾判据也修了：`grep -c $

$` 这类写法在 Git Bash 下对**纯 LF 文件也逐行命中**
  （movement.js 实为 0 个 CRLF，却报 224/224），本仓库行尾是混合的（party.js 全 CRLF、movement.js 全 LF、
  docs/formulas/combat.md 全 LF），要按字节量或采信改名工具自己的"行尾保持"断言。


### R28 第二组：targeting / treasure / movement 退出 game 直连，并新增"正文引用锚点"检查

- `ai/targeting.js`（`game.pathfinder` 2 处）、`loot/treasure.js`（`game.goldDrops` / `game.state.party` /
  `game.treasure`）、`characters/movement.js`（`game.world` 3 / `game.state` 2 / `game.minions` 1）三个模块
  去掉 `import { game }`，改由组合根注入。`npm run audit:arch` 实测 game 直连模块 **33 → 30**（plan 口径同为 30）。
- movement 的 world 用 **`() => game.world` 回调**而不是引用，因为 `game.world = new WorldMap()` 在两条重置路径上
  整体换对象；treasure 反过来证明"绑 state 容器 + 每次现读 `.party`"是足够的——`game.state.party = new PartyState()`
  只换子对象，容器身份不变。两个判据都写进 `docs/reverse-engineering/facts.md`。
- 新增 `scripts/check-doc-ref-anchors.mjs`（`npm run audit:doc-anchors`，已进 gate-sweep）：`verify-doc-refs`
  只能判断引用是否**越界**，而本会话的切片一律让文件**变长**，于是所有旧行号仍然界内却指向别的代码——
  这是静默的"文档与代码矛盾"。新检查用引用所在文档行里反引号包住的标识符当锚点，看被引用区间（±4 行缓冲）
  里有没有出现任意一个；一个都没有就进待复核清单，并按基线棘轮只在**增加**时失败。
  敏感性已被真实场景验证：写基线之后紧接着的 targeting/treasure 改动就让它 +1 报红。
  实测 597 条带锚点引用 / 206 条待复核（历史欠账，非本轮制造；本轮 5 个模块直接相关的引用已单独列出、尚未逐条搬正（写在下面的待办里））。
  反向验证：把 movement 模块里 `effectItem` 赋值的旧行号（搬到注入块之前是 202 至 204 行，现在是 232 至 233 行）故意写成引用留在文档里，检查器会把它报进待复核清单；这条已从文档里改写掉，以免文档自身制造假阳性。


## 2026-09-29 R29（regions 退出直连 + 上一提交数字的自纠）

- `world/regions.js` 的 17 处 `game.regions` / `game.castles` / `game.world` 读取改为
  `bindWorldRegions(game.regions, game.castles, () => game.world)`：前两者按引用绑（只构造一次、
  无整对象重赋值），`world` 必须走回调（`game.world = new WorldMap()` 在两条重置路径上换容器本身）。
  探针实测：未绑定时抛点名错误；连续两次调用之间把 provider 的返回值换掉，provider 计数随之从 1 到 2，
  证明"每次现读当前 world"——按引用绑做不到这一点。
- `npm run audit:arch` 实测 game 直连 **29 → 28**；本轮整波合计 33 → 28。
- 自纠：d4c25da 的提交信息写"33 → 30"，那个 30 取自当时还没修好说明符解析的 plan 工具（漏 `./game.js`）。
  在 d4c25da 自己的快照上重测得 **29**。历史提交不去改写，以这条记录和 docs 为准；
  教训是"引用别处的数字必须先在自己脚下的树上复量一次"——尤其当那个工具的已知缺陷正是我本轮刚修的那个。
- 结构对账授权清单随落地清空（0 条），`artifacts/architecture-baseline.json` 按当前实测重写，
  这样"退回 33 个直连"不再被门禁当作允许范围。


## 2026-09-29 R30（两个模块退出 game 直连 + 两个视图命名归零 + 结构对账门禁"静默空转"缺陷修复）

四个执行切片（一文件一智能体）+ 一项门禁基础设施修复；证据在 `output/goal-r30/`。

- **`views/castles.js` 退出 game 直连**：9 处 `game.*`（4 个容器）→ `bindCastleViews(game.monsterCatalog, game.castles, game.regions, game.itemSprites)` + 四个 fail-loud 访问器。取证 `grep -rnE '^\s*game\.(monsterCatalog|castles|regions|itemSprites)\s*=[^=]' src` 命中 0，四者都是 `initializeRuntimeGame()` 里只构造一次的容器，按引用绑安全。
- **`persistence/entities.js` 退出 game 直连**：6 处 `game.*`（4 个容器）→ `bindPersistenceEntities(game.itemGenerator, game.dungeons, game.monsterCatalog, game.scrolls)`。该模块被 `runtime/game.js` 反向 import，但两个 SaveAdapter 的恢复方法只在**存档恢复期**被调用，晚于组合根绑定。`npm run audit:arch` 实测 game 直连 **28 → 26**。
- **`views/dungeons.js` 单字母 7 → 0**、**`views/results.js` 单字母 9 → 0**（`scripts/rename-bindings-v2.mjs` 表驱动，逐函数读代码定名）。dungeons 的工具 autoDeclare 曾补出三处冗余 `var dungeon;`（同作用域重声明，no-op 但是噪音），主智能体收成一处。
- **`scripts/verify-structure-invariant.mjs` 的假绿缺陷（本轮最重要的发现）**：该门禁用 `execFileSync('git', ['show', …])` 取 base 内容，默认 stdio 会给 **stdin 建管道**，在本机稳定抛 `EBUSY`；`catch { continue; }` 把它吞掉，于是每轮都输出"0 个文件、待判定 0 行"并 **exit 0**——**R27 立起来的"唯一能发现'改名之外结构改动'的门禁"自建立起从未真正比对过文件**。修复三件套：显式 `stdio: ['ignore','pipe','pipe']`；把非 `status===128`（"路径不在 base 里"）的 git 失败收集为 `infraErrors` 判失败；新增空转护栏（`compared===0` 且有待比对文件即 exit 1）。修复后实测 78 个文件、82 行待判定（含被替换侧），按骨架去重授权 50 条后归零。同款 trap 也修掉 `tests/rename-tool/run-tests.mjs` 的两处 `spawnSync`（不修则 `r.status` 恒为 null，52 条夹具整体失真）。
- **文档引用随行号漂移搬正**：`persistence/entities.js` 顶部 +38 行使 5 条引用失效（`formulas/items.md` 2、`formulas/progression.md` 3），逐条搬到真实行号；`doc-anchors` 从"比基线 +3"回到 204 条（与 HEAD 侧实测相同，0 新增）。类型债台账同步修正：`unknown` 146 → **149**（R25 记的 146 在 R26–R29 已漂到 148，本轮 dungeons 类型收窄 cast 再 +1），`any` 41 持平。
- **累计指标**（R22 起）：单字母绑定 2,833 → **152**（29 个文件）；混淆短名 154 → **138**；game 直连 49 → **26**；最大 SCC 55 → **41**；import 边 554。`gate-sweep` 23 项全绿。


## 2026-09-29 R31（授权"语句拆分改写"类 + 5 个切片）

五个执行切片（一文件一智能体）+ 一类新的授权改写。证据 `output/goal-r31/`。

- **`rendering/floating-text.js` 退出 game 直连**：`bindFloatingTextRender(game.floatingText, () => game.processingOffline, () => game.worldActive, () => game.world)`。判据：`floatingText` 是稳定容器 → 按引用绑；`processingOffline`/`worldActive` 是**可变布尔**、`world` 会被 `resetRun` **整体替换** → 三者必须走 provider 回调（按值绑会读到装配那一刻的过期值）。game 直连 **26 → 25**。
- **`world/regions.js` 7 → 1**、**`simulation/characters.js` 6 → 1**、**`views/achievements.js` 6 → 0**、**`views/party-creation.js` 9 → 0**。
- **授权类：语句拆分改写（本轮定义并首次执行）**。R27 续写明"命名残量卡在'表达式位置的赋值'、要继续必须单独授权一类语句拆分改写"，本轮落地。规则：(a) 只把"表达式位置的赋值"提成前置独立语句，或给重赋值的绑定换新名，**不改调用的先后/次数/短路语义/副作用**；(b) 逐处人工写出求值顺序对照；(c) 机械兜底 `output/goal-r31/verify-call-order.mjs`（抽取方法调用序列与 HEAD 逐项比对，本轮 5 文件全一致）；(d) 行为兜底 parity + 89 场景 + e2e + soak；(e) 结构兜底逐条授权清单。
  - **试点**：regions.js 的四个方向 getter（`regionManagerRef()` 仍只在 `!occupied[key]` 为真时调用，短路语义逐处对齐）+ `findCastle`/`findCastleByRegion`；achievements.js 的四处复合名（`rowOrPointsCell` 一族，按 R27 判例属被"判掉"的形态）；party-creation.js 的两处一名多义。
  - **仍未授权**：**渲染层**的同类改写——差分与场景比对的是存档 DTO，**看不见画布坐标**；`floating-text.js` 的 `showFloatingText` 三个单字母因此**故意保留**，等有"含浮动文字的画布指纹场景"再动。
- **文档**：`doc-snippets` 抓到 `applyLevelStats` 片段漂移（已同步）；顺带修掉 R25 改名 `progression/upgrades.js` 时遗留、**无门禁覆盖**的旧字母片段——`combat.md` 的 `applyLevelStats(a, b, c)` 与 `scaleByLevel(a, b, c)` 两段、`progression.md` 的两段 `LevelUpPurchase` 摘录与两处 `:行号` 引用。这些块没有 `snippet` 标注，检查器不比对内容，属静默的文档-代码矛盾。
- **累计指标**（R22 起）：单字母绑定 2,833 → **126**（27 个文件）；混淆短名 **112**；game 直连 49 → **25**；最大 SCC 55 → **41**。`gate-sweep` 23 项全绿。


## 2026-09-29 R32（嵌套短路表达式拆分 + 文档盲区欠账清偿）

五个执行切片（一文件一智能体）+ 文档搬正。证据 `output/goal-r32/`。

- **`views/upgrade-details.js` 退出 game 直连**：8 参 `bindUpgradeDetailViews(game.state, game.terrainSprites, game.monsterSprites, game.monsterCatalog, game.shops, game.dungeons, game.castles, game.animations)` + 8 个 fail-loud 访问器。直连 **25 → 24**。
- **`ai/targeting.js` 11 → 0**、**`world/pathfinding.js` 8 → 0**、**`views/character.js` 7 → 0**、**`loot/treasure.js` 5 → 0**。
- **难点：嵌套短路表达式**。targeting.js 四处 `if (!(candidate = opponents[i], A || B || (effects = candidate.effects, C || (distance = pos.dist(candidate.pos), !(D || distance < D)))))` 与 pathfinding.js 的 A\* 主循环（`d`/`f`/`h`/`n` 各承载 2–3 义、被复用为循环计数器与路径数组）都按 R31 授权类展开成嵌套 `if`。判据：`effects` 仍只在 A/B/C 全假时读取、`squaredDistanceTo` 仍只在更内层条件成立时调用；`verify-call-order.mjs` 对 pathfinding 报**全序列一致**（41 个调用 + 全部赋值与字面量序列相同）。
  - 附带修掉一处命名瑕疵：`getPathNode` 里 `node = grid.nodePool` 让 `node` 短暂持有池对象 → 拆出 `nodePool`。
  - `loot/treasure.js` 的 `wallPointCandidate` 在同一变量里先存布尔后存坐标对象 → 拆成 `hasWallPoint` + `wallPoint`。
- **文档盲区清偿**：`doc-snippets` 只比对带 ref 标注的片段、`doc-anchors` 会过滤掉反引号里的路径型 chunk —— 于是 `ai/targeting.js` 的 7 条行号引用自 R27 起就偏了 15 行（本轮 +47 使其更偏）而两条门禁都看不见。逐条核对源码后全部搬正（`ADVENTURER_TYPE`/`MONSTER_TYPE` 295-296→357-358、`IDLE_ACTION` 等 421-423→483-485、`MELEE_ACTION_TYPE` 422→484、`updateBehaviors` 425→487、`rng.md` 三条同类引用）。锚点待复核 203 → **199**。
- **累计指标**（R22 起）：单字母绑定 2,833 → **95**（23 个文件）；混淆短名 **81**；game 直连 49 → **24**；最大 SCC 55 → **41**。`gate-sweep` 23 项全绿。


## 尚未完成的主要工作

1. **拆开中心状态与循环依赖**：R32 实测 **24** 个模块直接导入 `runtime/game.js`（`views/upgrade-details.js` 本轮退出），一个强连通分量仍包含 41 个模块；74 个初始化调用仍依赖固定顺序。装备目录、物品生成、角色属性、状态效果、内容参数、冒险点数、特效动画目录、背包、旅行代价、区域、瞄准、宝箱、角色移动、角色/怪物/城堡/升级详情视图、存档实体、浮动文字已退出该循环，但整个领域图仍需继续拆分。应按领域建立明确输入与组合根，再逐个移动依赖方向，避免只增加转发包装。
2. **清理恢复期命名与原型装配**：`npm run audit:arch` 实测单字母局部绑定 **95** 个（分布 23 个引擎模块，R22–R32 已从 2,833 降下来），混淆器风格 1–2 字母短名 **81** 个（分布 22 个文件）。当前热点：`characters/party.js`（16，`updateWorldMode` 单函数占 9 个、最密）、`core/math.js`（12）、`views/information.js`（9）、`persistence/entities.js`（8）、`views/expedition.js`（6）。剩余量按阻塞机制分三类：单条重赋值型已由 `rename-bindings-v2.mjs` 的 rhsKeep 开闸；**表达式位置的赋值**已由 R31 授权的"语句拆分改写"类开闸（协议见 R31 段，R32 已用它啃下嵌套短路表达式）；循环携带与支配性不足者工具按设计拒绝，仍需逐处人工读；`core/math.js` 里多为有意义的坐标/向量分量，要判的是"改了是否更清楚"，不是"必须归零"。大量运行方法仍在 `initialize*()` 内挂到原型上；改装配方式必须保住初始化时序与存档构造行为。
3. **继续证明功能保真**：U134 的 P-1、P-5、P-6、P-7 维持 PARTIAL。真实多版本存档、未剥离的原版页面、真机帧时间和第二浏览器依赖外部材料；在现有环境内仍可扩展玩法与 UI 的差分覆盖，但不得把模拟数据称为真实样本。
4. ~~**构建快照的遗留文件**~~ — ✅ **已闭合（本轮）**：`build.mjs` 拷贝后按源清单清理 dist/ 陈旧文件（带拷贝根归属 + 单轮上限双重护栏），38 个 U+F00D 垃圾产物已清除，dist 136 文件与源清单一致，重复构建 0 回写/0 清理。

## 下一切片入口

先复核 `git status --short`，不得重置或清理混合工作树。运行 `npm run audit:arch` 与 `node scripts/verify-structure-invariant.mjs HEAD` 固定最新指标（后者每切片改完都要跑：它是唯一能发现"改名之外的结构改动"的门禁，`npm run test:rename-tool` 保证改名工具自身不回退；**R30 已修掉它"管道 stdin 抛 EBUSY 被 catch 吞掉 → 0 个文件假绿"的缺陷，并加了空转护栏，现在它真的会比对**）。命名切片从 `characters/party.js`（16）、`core/math.js`（12）、`views/information.js`（9）或 `persistence/entities.js`（8）起步——用 `scripts/rename-bindings-v2.mjs`（`--report` 看形态、`--table` 出表），单条重赋值型走 `rhsKeep`；被支配性/循环携带闸拒下的必须逐处读代码，**不要绕过闸、也不要用 `xOrY` 复合名糊过去**（R27 判例：那是"整段共用一个名字"，另一半必然撒谎）。卡在"表达式位置的赋值"或**嵌套短路表达式**时，套用 R31 授权的**语句拆分改写**协议（逐处对齐求值顺序 → `output/goal-r31/verify-call-order.mjs` 机械比对调用序列 → parity + 89 场景 + e2e + soak → 结构授权清单）；**渲染层例外**：差分看不见画布坐标，动渲染代码前先确认有对应的画布指纹场景。`core/math.js` 里多是坐标分量，先判断改了是否更清楚。解耦切片按 `audit:arch` 第 2 节实测挑（剩余 24 个直连模块里 `views/` 占 7 个），先跑 `grep -rnE '^\s*game\.[A-Za-z_$][\w$]*\s*=[^=]' src` 确认被绑容器不会整体替换；会被整体替换的（`game.world`/`game.level`/`game.currentDungeon`/`game.currentCastle`）与**可变标量**（布尔/数字）都必须走 provider 回调。R25 起的编排惯例：每切片一个执行智能体（行数保持 + 机械四断言 + 只改自己文件），落地后由 code-review 双轴（Standards/Spec）审查、修正落实后主智能体统一跑门禁。每个切片至少核对存档差分、相关差分场景、浏览器入口和文档引用（行号会漂，跑 `npm run audit:doc-anchors`；**注意该检查器会过滤掉反引号里的路径型 chunk，`file:line` 引用仍要人工抽查**），并同步 `npm run check` 的文件数表述（`npm run lint` 第 10 条会核对）；最后对精确工作树重跑 `node scripts/gate-sweep.mjs` 与 `git diff --check`。若实际指标、场景数或外部材料变动，以新一轮实测为准。
