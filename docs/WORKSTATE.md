# WORKSTATE — Clickpocalypse II 语义恢复与现代化工程

> 本文件是长程自治任务的**唯一续跑入口**。上下文压缩或中断后，先读本文件 + `git log --oneline`，再继续。
> 最后更新：2026-09-26（cc/dc/ec/bc/ac 方法族修复后；下文较早批次的快照保留为历史记录）

## 当前续跑状态（优先阅读）

- 交接时的损坏工作树已修复：`entities.js` 的 `h` 是 CharacterPosition，存档 `worldX/worldY` 读取 `getWorldPositionX/Y()`；`Vector2.ac` 的 20 个调用点、RenderCommand 排序比较器与 `WorldMap.vw()` 的内部 `bc(a)` 均已同步。调用点按接收者逐项核对。
- 本批 `npm run check`（107 文件语法、typecheck、9 单测）、`npm run test:parity`（0/1/99/900 回合）、`npm run test:scenarios`（12 场景）、`npm run test:e2e` 全绿；`git diff --check` 通过。测试使用现有 `http://127.0.0.1:4173` 服务。
- 方法身份映射已记入 `docs/reverse-engineering/semantic-map.md`。接下来按第八批队列独立切片推进 `jc`、`kc`、`mc`、`Zb`；再做 StatisticsRecorder、M10、U3/U4。每个代码切片仍需四套全绿。
- `jc` → `potionSprite` 已独立完成：药水定义 PNG 名、Potion 构造转换、渲染和按钮读取点同步；四套验证全绿。接下来是 `kc` → `spellDefinitions`。
- `kc` → `spellDefinitions` 已独立完成：职业定义字面量与 game-save.js 载入反查同步；四套验证全绿。接下来是 `mc` → `descriptionText`。
- `mc` → `descriptionText` 已独立完成：23 个冒险点定义键与 getDescription 读取同步；四套验证全绿。接下来是 `Zb` → `character`。
- `Zb` → `character` 已独立完成：CharacterSkillUpgrade/LearnSpellUpgrade 的 24 个所有者引用同步；四套验证全绿。第八批此四项已完，下一项为 StatisticsRecorder 计数字段取证与切片落地。
- 统计推进事件组已完成：`On/Lk/qn/Mj/wi/uk` → `turnCount/doorsOpened/roomsCleared/levelsCleared/dungeonsCleared/castlesConquered`；含 `views/results.js` 离线进度直读点，存档 JSON 键不变。四套验证全绿；其余计数字段仍待分组落地。
- 统计活动组已完成：`Xj/Rk/Xk/Wk/si/Dl/Sd/oj` 八字段落地，`Sd` 的 Dungeon 同名字段保持原状；四套验证全绿。待战斗组和物品组。
- 统计战斗组已完成：`hl/wl/Gl/ul/El/kl` 六字段落地；四套验证全绿。待物品组九字段。
- 统计物品组已完成：`Ph/Gi/Ol/xl/Zk/nk/Nl/Sl/tk` 九字段落地；四套验证全绿。RunStatistics 的 29 个原混淆计数字段全部完成，原已语义化的 `minionKills` 未改。下一项 M10 类成员 JSDoc 专项，随后 U3/U4。
- M10 首个重文件 `views/castles.js` 已摘除 `@ts-nocheck`：原型后挂载方法在五个调用点作窄签名标注，混用的局部变量拆开；tsc 与四套回归全绿。其余重文件继续逐个纳入。
- M10 `views/achievements.js` 也已摘除 `@ts-nocheck`：六处后挂载方法调用作窄签名标注，行索引和表行、容器和升级数组拆开；tsc 与四套回归全绿。剩余 `@ts-nocheck` 文件 19 个（以实时 `rg` 为准）。
- M10 `views/dungeons.js` 已摘除 `@ts-nocheck`：表容器与表行变量拆开，后挂载的 `qi/Ro/ct/pf/mk/Ri` 在调用处限定签名；tsc 与四套回归全绿。剩余 18 个。
- M10 `runtime/game.js` 摘除 `@ts-nocheck` 后直接零类型错误，四套回归全绿。剩余 17 个。
- M10 `simulation/tick.js` 摘除忽略标记后零错误；`characters/party.js` 将 `targetCastle.dungeonList` 从复用的数值局部变量 `n` 拆为 `castleDungeons` 后零错误。两文件同批四套回归全绿，剩余 15 个。
- M10 `persistence/game-save.js` 已摘除 `@ts-nocheck`：七个重复索引声明合并，CharacterStats 后挂载的 `setMinionKills` 在调用点标注签名；四套回归全绿，存档 JSON 键无改动。剩余 14 个。
- U4 的 12h 离线上限截断差分已补：`offline-13h-capped` 在两端载入后直接断言待结算时长 12h，再比较离线结算完整状态和后续 200 回合。场景总数 13，四套回归全绿；U4 仍缺胜利瞬间和部分法术分支。
- U4 增加 `fireball-blast-stun`：class 4 法师唯一已学法术为火球，断言两端实际施法并推进 6000 回合完整差分。场景总数 14，四套回归全绿；Blast Stun 入队未独立观测，不能据此关闭全部法术分支缺口。
- U4 增加 `castle-victory`（提交 da5cbd4）：`withCastleVictory()` 只留一座待攻克城堡，两端各自走"进城—到出口—离城"的征服尾部，15,000 回合分 5 个检查点比较完整存档，终点在两端分别断言 `gameWon`/`victoryCount=1`/`castlesConquered=1`/全城堡征服。场景总数 15，四套回归与 8h/24h soak 全绿。
- 该场景抓到并修掉两处重构遗留缺陷（提交 90a6cbb、789e2b3）：`world/rooms.js` 金堆房对 DungeonTile 误调 CharacterPosition 的 `getLevelPositionX/Y`，首次进入该分支即 TypeError；`progression/achievements.js` 定义表 22 处 `Hb:` 与读端 `a.characterClass` 未同步，职业胜利成就在重构版永不达成、胜利瞬间两端 `obtained` 集合分叉。两处按原版语义修复，未动数值与存档键。
- Blast Stun 取证结论：`blastStunSpell` 是可学法术的假设不成立——注入法师 `spells` 后两端 `spellCastCount` 均不增长（原版同样不施放），它只在 `simulation/tick.js:346-348` 作为二段打击动作的 `actionDefinition` 懒创建并入队。直接入队计数断言仍开放，详见 `docs/reverse-engineering/unresolved.md` U4。
- U4 再补两条法术分支差分（17 场景全绿）：`spell-status-transform` 注入火系"转变怪物"（spellCategoryId=2、statusEffectTypeId=4），`spell-buff-armor` 注入牧师"提高护甲"（cat=3、effect=5）；两端各自断言 `spellCastCount` 增长并在 3000/6000 回合比较完整存档。增量是给 cat2/cat3 的 `applySpellEffect` 分支补上"职业主动施法"这条驱动路径——此前该分支只有卷轴施放（`combat/scrolls.js:153`）和怪物 AI 施法两个入口，且没有场景单独断言两端确实施放了该类法术。
- 新恢复的语义：未改名的 `td` 标记决定效果施加时机 — `td: true` 时由 `combat/actions.js:60-70` 在命中特效首次生成时施加，`td` 为假时由 `actions.js:116` 在动作收尾时施加。cat2/cat3 的 11 条法术定义全部 `td: true`，Blast Stun 亦在此列。
- Blast Stun 的取证补充：它的效果施加走的正是上面这条 cat=2 分支（`spellCategoryId: 2` + `statusEffectDefinitions[14]`），入队点在 `simulation/tick.js:346-348`。怪物效果队列不入存档、`characterStunnedCount` 只统计冒险者，所以早期的直接计数缺口由下一条的 harness 观察器补上。
- Blast Stun 的直接观察已补上（提交 479e95a）：harness 增加逐帧扫描活怪物效果队列的只读计数器（原版 `w.Gf.Og`/`Ja.of`/`e.X`，重构版 `game.monsters.Og`/`effects.of`/`statusEffectTypeId`），场景步骤带 `effectType` 即改为"推进的同时计数，两端各自必须 > 0，且数值相等，然后照常做完整存档差分"。`fireball-blast-stun` 实测两端各 31 次 type=14 施加。计数口径：同一次采样间隔内对同一只怪的重复施加会合并，但一次采样只有 15ms 而眩晕时长以回合计（≥250ms），因此实际等于施加次数。type=14 在全仓库只有 `blastStunSpell` 一个来源（另一处 `new StatusEffect` 硬编码 type=13），所以这个计数就是 Blast Stun 的执行次数。
- U4 再补三条法术分支差分（提交 3543b4e，场景矩阵 17 → 20）：`tests/scenarios/save-mutations.mjs` 新增 `withReclassedSpell(save, index, class, spellName)`，把 fixture 队伍里没有的职业装载到指定队员上（死灵法师 9、德鲁伊 10），驱动 `spell-summon-ghost-skeleton`（cat=9 召唤）、`spell-summon-skeleton-army`（cat=11 先把目标怪从活怪物列表移除再召唤）、`spell-sleep`（cat=2、statusEffectTypeId=0，逐帧扫描直接计数）。前两条两端各自断言 `spellCastCount` 与 `minionsSummoned` 增长，第三条另需 type=0 计数两端同值；随后照常比较完整存档。check/parity/20 场景/e2e 全绿。
- 直接计数的口径补充：`spell-sleep` 的 type=0 计数在全矩阵里两端各 69 次，只跑这三条场景时两端各 66 次——同一 page 会话里前序场景会留下运行期状态，因此断言的是"两端在同一执行顺序下数值相同"，不是跨运行常量。`fireball-blast-stun` 的 type=14 两次都是 31。runner 另加 `SCENARIO_FILTER` 便于单场景迭代，末行改为 "N / 总数"。
- U4 再补六条法术分支差分（场景矩阵 20 → 26）：`spell-heal`（cat=1）、`spell-area-bounce`（cat=4 弹射）、`spell-chain-lightning`（cat=5）、`spell-rain-damage`（cat=6）、`spell-bouncing-projectile`（cat=13）、`spell-chicken-swarm`（cat=17，`Math.random` 概率选模板，另断言两端各自 `minionsSummoned` 增长）。同批尝试的 cat=12/14/15（忍者 快速打击、盗贼 立即搜索/发现财宝箱）未能纳入：装载这三条法术的职业在远程攻击分支上命中原版自带的空武器解引用，原版栈 `Aw (c2.js:21119) ← yw (21061)` 与重构版栈 `getProjectileAnimation (combat/actions.js:558) ← createAttackAction (466)` 同点同错（`Cannot read properties of null (reading 'sw')`），属于忠实保留的原版缺陷，按红线未修补；cat=16（牧师 复活）在 3000 回合内两端都未施法（需要场上已有昏迷冒险者）。四条一并记为仍开放。
- U4 再补三条并收敛到 29 场景（矩阵 26 → 29）：`tests/scenarios/save-mutations.mjs` 新增 `withEquippedItem(save, index, itemTypeId, itemSlot, characterClass)`，往存档的 `equippedItemCollection` 注入真实投射武器类型（盗贼槽 61"闪电"=哈希 41393542、忍者槽 62"星星"=哈希 2081168329，后者 `projectileAnimationId=3` 走 `3 === sw()` 的飞镖分支）。据此 `spell-deferred-strike`（cat=12，唯一 `td: false`）、`spell-instant-search`（cat=14 拾取全层掉落）、`spell-find-chest`（cat=15 发现财宝箱）三条落地，29/29 全绿。原因链已取证：改职业后 `equipItem` 因 `characterClass` 不符把原装备整批跳过 → `equipment.Ey` 为空 → 远程攻击分支进 `getProjectileAnimation` 首行空指针；原版与重构版在同一处、以同一条消息抛错，属忠实保留的原版缺陷，按红线未修补。仅剩 cat=16（牧师 复活）开放：把其他队员存档生命压到 1 跑 6000 回合，两端 `characterStunnedCount` 与 `spellCastCount` 仍恒为 0（两端逐检查点存档一致），即 fixture 造不出"已有昏迷队友"的前置。（该条已由下文 29 → 30 的提交关闭。）
- U4 第 3 项收口（矩阵 29 → 30 场景，30/30 全绿）：`withResurrectionTrial()` 关闭最后一条法术分支 cat=16（牧师 复活）。关键判断是"缺的是致命敌人，不只是低血量"——早前只压生命的两轮实验两端 `characterStunnedCount` 恒为 0；改为激活 `randomBossEncounter` 药水 + 三名队友 1 级 1 血清零伤害分量 + 清空其他队员 `spells` 后，两端实测昏迷计数同为 22、`spellCastCount` 各自增长，再比较完整存档一致。`recordSpellCast` 只对 `isAdventurerOrMinion` 记账（`characters/character.js:991`），故增长可唯一归因于牧师。至此 `content/spells.js` 出现过的 16 个 `spellCategoryId`（1–6、8–17，目录无 cat=7）每条都有专属差分场景。
- M13 补测：`npm run build` 产出 dist/ 174 个文件。`npm run perf` 三次实测（HEAD 7ca07df、6c4be10、1811296）：回合推进 0.080/0.077/0.076 ms vs 原版 0.075/0.064/0.070 ms（1.06x / 1.20x / 1.09x），存档序列化 0.13/0.11/0.10 ms vs 0.07/0.07/0.08 ms，存档导入 32.8/24.1/27.2 ms vs 28.2/27.4/30.6 ms，离线 1h 结算 CPU 178/179/198 ms vs 156/167/160 ms（同为 18,925 回合）。同一份代码多次比值在 1.06x~1.20x 之间波动，属单样本 CPU 噪声，不能当作精确倍数；可确认的是模块化未引入数量级退化。
- U3 8h/24h 等价回合 soak 已连续六次实测通过（115,200/345,600 回合，完整存档两端相等，0 pageerror）。最近一次在 HEAD 1474019（30 场景矩阵、引擎代码与 1811296 完全相同）：CDP 主动 GC 后原版 JS 堆 8h→24h 为 6,269,880→6,287,652 bytes（增量 17,772），重构版 7,071,028→7,088,200 bytes（增量 17,172），两端完整存档一致。`npm run test:soak` 独立于常规快测，样本输出 `output/soak/last-run.json`；短期稳定不等于严格泄漏证明，六个样本只说明未观察到台阶式增长。
- M10 `world/rooms.js` 已摘除 `@ts-nocheck`：`revealRoom/revealHallway` 初始布尔位与后续复用变量分名，两个后挂载 `Lw` 调用标注签名；四套回归全绿。剩余 13 个忽略文件。
- M10 `world/generation.js` 已摘除 `@ts-nocheck`：`LayoutMethods` 明确后挂载布局方法签名，生成随机流与入场角色的复用变量分开，最后楼层布尔条件分开；四套回归全绿。剩余 12 个。
- M10 `simulation/characters.js` 已摘除 `@ts-nocheck`：随从与守卫创建时对象/等级复用变量分开，掉落计算中的金币、卷轴、药水对象各自持有；随机调用与构造顺序不变。四套回归和 8h/24h soak 全绿；剩余 11 个。
- M10 `combat/actions.js` 已摘除 `@ts-nocheck`：施法拾取分支的统计、掉落、特效和物品所有者变量分开，死亡处理的眩晕效果与后挂载 `Cb` 方法作窄签名标注；四套回归全绿。剩余 10 个忽略文件。
- M10 `combat/encounters.js` 已摘除 `@ts-nocheck`：普通怪和首领生成的数量、模板、角色、坐标变量分开，后挂载怪物方法限定签名；四套回归及 8h/24h soak 全绿。剩余 9 个忽略文件。
- M10 `rendering/scene.js` 已摘除 `@ts-nocheck`：画布 DOM 类型收窄、后挂载 `pf` 与可见状态限定签名，闪电坐标的重复声明合并；四套回归全绿。剩余 8 个忽略文件。
- M10 `views/character.js` 已摘除 `@ts-nocheck`：表格、角色统计和技能视图的后挂载方法限定签名，角色可用性、表格单元格与技能升级列表变量分开；四套回归全绿。剩余 7 个忽略文件。
- M10 `views/upgrade-details.js` 已摘除 `@ts-nocheck`：16 个后挂载 DOM 创建方法和升级按钮生命周期在调用点限定签名，三个动态缓存字段在构造时初始化，角色索引与标题变量分开；四套回归全绿。剩余 6 个忽略文件。
- M10 `progression/upgrades.js` 已摘除 `@ts-nocheck`：升级排序的布尔状态与升级对象、装备扫描索引与可装备状态分开；后挂载价格、可见性、法术和卷轴方法按调用点限定签名。四套回归全绿，剩余 5 个忽略文件。
- M10 `ai/behaviors.js` 已摘除 `@ts-nocheck`：行为队列、优先级和地牢探索的后挂载方法限定签名，法力消耗与房间边界变量分开；四套回归及 8h/24h soak 全绿。剩余 4 个忽略文件。
- M10 `simulation/loop.js` 已摘除 `@ts-nocheck`：`tick()` 初始化分支的复用 `var`（视图/14 个 TabState/15 个 View）全部拆为具名变量，创建与注册顺序不变；存档读取回退逻辑保留，PersistencePort 在 `storage-port.js` JSDoc 补充可选 `onLoadError`。tsc 错误清零，四套回归及 8h/24h soak（完整存档两端一致，0 pageerror）全绿。剩余 3 个忽略文件（character.js / information.js / terrain.js）。
- M10 `world/terrain.js` 已摘除 `@ts-nocheck`：`sampleNoise` 的重复 `var` 声明拆为逐条赋值并把菱形分支的 `n/p` 拆成 `e/o`，`populateWorldBlock` 中被复用为 tile 的 `g/n/h` 拆成 `shoreTile`/`lockedTile`/`decoTile`/`entranceTile`/`castleTile` 等具名变量，相邻区块比较的 `g/h/l` 拆为 `northCastle`/`westCastle`/`nwCastle`；`getTileAtPixel` 的 `c` 拆出 `block`；后挂载的 `random`/`Aw`/`pixelToTileColumn`/`pixelToTileRow` 在调用点作窄签名标注。数值、噪声调用与区块生成顺序未改。tsc 全仓库清零，四套回归及 8h/24h soak 全绿（完整存档两端一致）。剩余 2 个忽略文件。
- M10 `characters/character.js` 已摘除 `@ts-nocheck`：新增 `TargetedCombatAction`/`SlotEquipment` 两个窄签名 typedef，8 个后挂载 `CombatAction.Cb` 调用点和 `equipment.ef`/`equipment.So` 按其标注；两处同一 `var` 列表内先 `undefined` 后被循环初值立即覆盖的重复声明（`jb`、`Ph`）去掉冗余的首次赋值。战斗数值、随机调用与目标选择顺序未改。tsc 清零，四套回归与 8h/24h soak 全绿。剩余 1 个忽略文件。
- M10 `views/information.js` 已摘除 `@ts-nocheck`，**`src/engine/modules` 下 `@ts-nocheck` 已清零**（仅 `src/vendor/lz-string-1.3.3.js` 保留，属第三方 vendored 代码）：`StatisticsView.prototype = new View()` 整体替换原型使后挂成员不可见，给 `reset`/`update`/`fr` 加 `@this {StatisticsView & MountedStatisticsViewMethods}`；`fr` 内复用为行号的 `a` 和复用为行元素的 `b` 拆成 `container`/`rowIndex`/`row`，30 组“`b = a++; b = appendStatisticsRow(...)`”合并为一次 `rowIndex++`；导出/导入框与 7 个复选框按 `HTMLInputElement` 收窄。首版脚本把 `Checkbox` 后缀重复拼成 `xxxCheckboxCheckbox`，四套回归当场全红（`OptionsView.reset` 设置 null.checked）——已修正并逐字比对字符串字面量集合不变，四套回归重新全绿。
- 脚本化行级替换的新教训：捕获组若已含后缀，替换串不得再拼一次同名词；类型检查与 `node --check` 都抓不到错误 DOM id，只有浏览器回归能抓到。批量替换后必须比对字符串字面量计数并跑完整回归。
- 本节优先于下方旧快照中的“当前工作树干净”“M10 未开始”“9 场景”“剩余 23 个”等过时文字；提交与实际状态以 `git status`、`git log`、`rg -l '^// @ts-nocheck' src/engine/modules --glob '*.js'` 为准。

## 当前续跑状态（第九轮，2026-09-26 下午）

- U5 长尾重命名继续推进：**Potion 定义三元组 `uc/tc/vc` → `displayName/effectLabel/modifierId` 已落地**（构造点 + 20 条定义字面量 + `views/expedition.js` 两个读取点，全 `src` 已无这三个成员访问；存档只存 `potionId`，无键需要成对同步）。`check`/`typecheck`/`parity`/30 场景/`e2e` 全绿，混淆属性清单 1,238 → 1,235，`docs/symbol-map.json` fields 段 202 → 205。
- 新增受守卫执行器 `scripts/rename-field.mjs`：写盘前校验命中总数、行数、逐行缩进与字符串字面量多重集。动因是内联 `node -e` 两次真实破坏（bash 吞掉 `$1` 抹平缩进；`\s*` 在 CRLF 上吃掉换行并行），此类破坏过不了 `node --check`/tsc。**后续批次一律用该工具，不要再写内联 shell 替换。**
- `COMPATIBILITY_REPORT.md` 第 2/5/7 节仍写着 12 场景、c2c "UNRESOLVED" 与旧性能样本，与 30 场景矩阵、`unresolved.md` U2 已关闭、最新 perf 实测相互矛盾——属于目标规范 §3.1 的"文档与代码矛盾"项，需与后续代码批次一起收口。
- 下一批取证目标（按 `artifacts/obfuscated-fields.json` 频次）：`Cb`(r25/w2, 6 文件)、`Wb`(r16/w9)、`Bc`、`oc`、`zc`、`Ac`、`Ec`、`yc`/`Fc`/`Dc`/`Gc`（各 21 写，成组的数据表键）；单文件成组键优先，风险最低。

## 当前续跑状态（第十轮，2026-09-26 下午）

- 累计落地 12 个混淆字母清零：Potion 三元组（`uc/tc/vc`）＋升级行四字段（`Ic/Hc/qc/xc` → `achievement/purchased/canPurchaseNow/castle`）＋点位事件四元组（`Dc/yc/Fc/Gc` → `basePointReward/achievementPointBonus/fullEventLabel/shortEventLabel`）＋内容表三组（`Ec`→`opened`、`zc`→`isDirectional`、`Ac`→`doorSprites`）＋`Wb`→`targetDungeon`。混淆属性清单 1,238 → 1,223，`symbol-map.json` fields 202 → 217。
- 每批均为"取命中数 → `scripts/rename-field.mjs` 守卫替换 → check/typecheck/parity/30 场景/e2e 全绿 → 一 commit"。三次真实拦截均由工具或 tsc 抓到：bash 吞 `$1` 抹平缩进、`\s*` 在 CRLF 上并行、M10 的 `@typedef` 窄签名漏改（工具已加注释行规则）。
- **U6 已闭合**：`Cb` 是双主方法，已按所有者拆为 `Character.prototype.setCombatTarget` 与 `CombatAction.prototype.setTargetCharacter`（behaviors 5 / targeting 4 / scrolls 1 / tick 2 / actions 7 / character 11+1 行级改回），`src` 内 `.Cb` 与 `Cb:` 命中为 0；因双主语义未写入全局 fields 段。四套回归 + typecheck 全绿。
- 下一步：继续按排行榜取组（`Bc`、`oc`、`Cc`、`Nc`、`Sc`、`Jc`、`Uc/Vc/Rc/Oc/Qc` 与 `views/*` 表行字段），并把 §56 验收矩阵与三份报告对齐到当前代码与测试实况。

## 1. 项目概况

- 原始遗产：`archive/original/c2.js`（46,980 行混淆单体，sha256 见 `archive/migration/recovery-manifest.json`）。
- `src/engine/`：经 AST 工具从 c2.js **机械恢复**的模块化引擎（非重写），74 模块；`src/app.js`+`src/ui/` 为新 UI 壳。
- 语义事实库：`docs/reverse-engineering/facts.md`（20 条已验证事实）+ `semantic-map.md`（重命名日志）+ `docs/symbol-map.json`（1,231 符号）。

## 2. 里程碑状态

| Milestone | 状态 |
|---|---|
| M0-M3 | ✅ 基线/静态图/运行时恢复/行为 harness 全部完成且实测通过 |
| M4 High-Confidence Rename | 🟡 符号 99.8% 已命名；**字段重命名已完成 30+ 个字段身份**（动画帧表、Achievement 组、Upgrade.canPurchase、视图 upgrade、Vector2 x/y、Character.position、CharacterPosition.levelPosition/room、Item.slot/characteristic、tb slot/statType（含 guardians/minions）、怪物 name、WorldMap worldBlocks/blockOrigin*/tileGrid、spriteName、getSprite 方法族、tabState、数值组 currentValue/levelIncrement/activeValue/baseValue/purchasedLevels/perLevelIncrement）|
| M5-M9 | ✅ 结构完成（见 MIGRATION_MAP.md） |
| M10 Type Hardening | ✅ 完成：`src/engine/modules` 下 `@ts-nocheck` 为 0（仅 `src/vendor/lz-string-1.3.3.js` 保留），全仓库 tsc 错误 0；每切片均过四套回归 |
| M11 Performance | ✅ 基线完成（docs/performance-baseline.md）：重构/原版比值实测在 1.0-1.2x 之间波动（回合推进两次为 1.06x、1.20x，属单样本 CPU 噪声）；优化未开始（也无必要——模拟占回合预算 0.03%） |
| M12 Legacy Reduction | 🟡 技能/法术/状态效果/视图高频字段已清（e/f/g/X/V/W/c 组落地）；剩余长尾字段约 1,300 处访问（Y/Z/aa/ca 等，需新取证） |
| M13 Final Regression | ✅ check/parity/30 场景/e2e/soak 全绿，build 与 perf 已实测；城堡征服→胜利瞬间（castle-victory）、Blast Stun 直接计数（两端各 31 次 type=14）、召唤族（cat=9/11）、睡眠（cat=2、type=0 直接计数）与其余全部法术类别（含 cat=12/14/15 需注入投射武器、cat=16 需首领药水制造昏迷）均已闭合；U4 三项缺口全部关闭 |

## 3. 可运行状态与命令（全部实测通过 @ commit 4665924+）

```bash
npm run dev              # http://127.0.0.1:4173（静态服务，测试前置）
npm test                 # 单测 9 项：RNG 差分(提取原版 ga 对照 6 种子×100k)、codec 契约、格式化表
npm run test:parity      # 原版 vs 重构：同存档+固定 RNG/时钟，0/1/99/900 回合全状态相等
npm run test:scenarios   # 30 场景差分矩阵：长跑/离线四态/药水×2/卷轴/16 类法术分支全覆盖/城堡胜利/金币/后期/veteran/prestige/full reset
npm run test:e2e         # 浏览器 E2E：建队/暂停/面板/设置/导入导出/非法存档/刷新/三视口
npm run check            # 语法检查(104 文件) + 单测
npm run perf             # 性能基线测量（重构 vs 原版）
```

## 4. 本会话关键发现（防重复踩坑）

1. **RNG 是 JS 浮点变体 MT19937**（seed 5489 首值 1859732469 ≠ C 标准 3499211612）——禁止替换"更标准"实现。
2. **存档 4,477 个键全为语义化命名，无单字母键**——运行时字段重命名安全，但 game-save.js/entities.js 的映射行必须成对同步。
3. **离线结算由帧循环驱动**（每帧≤200 回合；分支条件 `1E3 < 帧差`）——harness 用 `advanceOffline()`（每帧+2000ms）。
4. **数据字面量键分布在多个 content 文件**（classes/guardians/minions/monsters/skills/*）——重命名数据键必须全库 grep；漏改会在后期内容触发崩溃（guardians 教训，facts.md 第 13/20 条）。
5. **Windows Git-Bash**：`grep -rl | xargs sed` 会因反斜杠路径失败；复合 sed `'s/a/b; s/c/d'` 静默无效——必须逐表达式或 find 循环。
6. 场景矩阵曾抓住 parity-900 抓不到的真实回归（guardians 崩溃）——**每个重命名批次必须跑全部三套测试**。

## 5. Git

- 每个可验证切片一个 commit（本次会话约 20 个）；baseline tag `baseline/original-runnable`。
- 当前工作树干净，三套测试全绿。

## 6. 下一步（按优先级）

1. **波次 4/5 状态**：Ja/ka/Oa/Fa/Ca/ra/Y/Z(slotList) + 法术族 + B 组九项 + 第五轮七项（$/Ea/Ga/Ma/Na/Wa/Qa）+ aa(statisticsRecorder/runStatistics) 全部落地全绿。**`Da` 三路拆分（combatTarget/targetCharacter/selectedTarget）已落地并验证关闭（U1）**——早前"两轮调试仍分叉、已回退"的记录已过期：当时的根因是把 616/682 动作自有字段误标为 `Da`，且 `createSpellAction/nu` 的接收者是多态角色；修正后 `applyActionDamage` 等读端已按语义名落地，26 场景矩阵与四套回归全绿。历史证据链仍在 `docs/reverse-engineering/unresolved.md` U1。
2. ~~已取证待落地~~ ✅ B 组九项全部落地（每字母独立全回归）。
3. ~~交付物收尾~~ ✅ 已完成（REFACTOR_REPORT.md、PERFORMANCE_REPORT.md、COMPATIBILITY_REPORT.md、MIGRATION_MAP.md）。
4. ~~扩展差分场景：prestige/victory~~ ✅ 30 场景矩阵已含 veteran-run/prestige-restart/full-reset、城堡征服→胜利瞬间、cat2/cat3 法术分支、Blast Stun 直接执行计数（两端各 31 次 type=14）、两条召唤分支（cat=9/11）与睡眠直接计数（type=0），并补齐 `content/spells.js` 里全部 16 个 `spellCategoryId`（1–6、8–17）：cat=12/14/15 需先用 `withEquippedItem()` 注入投射武器（否则命中原版自带的空武器解引用），cat=16 需 `withResurrectionTrial()` 用随机首领药水真正打出昏迷前置。U4 三项缺口至此全部关闭。
5. **M10 类型体系**：✅ 完成（`src/engine/modules` 下 `@ts-nocheck` 为 0，仅 vendored `src/vendor/lz-string-1.3.3.js` 保留；tsconfig checkJs + `npm run typecheck` 入门禁）。工具：`m10-round.cjs`（按文件移除并报告各自错误）、`m10-nocheck.mjs`/`restore-nocheck-baseline.cjs`（范围管理）；跨文件原型挂载成员仍需调用点窄签名或 JSDoc typedef（不能用整文件 any-cast）。
6. symbol-map.json 元数据刷新：`symbols` 段（1,231 条）已含本轮恢复的函数名（`applySpellEffect`/`isDisablingEffect`/`summonSpellMinion`/`spawnMinion`/`getProjectileAnimation` 等）；`fields` 段仍是 202 条"原字母 → 语义名"全局映射，新恢复的 StatusEffect 内部成员（`X`/`jD`/`Qd`/`Ok`/`bg`）与 `spellCategoryId`/`statusEffectTypeId`/`potencyPercent` 尚未写入——这些字母在 c2.js 里跨类复用，逐条写回前必须先确认唯一性，因此仍开放（对照表见 `docs/reverse-engineering/semantic-map.md`）。

## 8. 智能体产出验收状态

- 取证×5（字段语义四轮 + 文档三轮）：✅ 第四轮 A（角色/战斗 14 字段，含行为命名错位线索）、B（内容/物品 14 字段）已返回；A、B 两组全部落地。
- 文档×3：✅ 已提交并抽查。

## 7. 禁止回退的文件

`archive/original/**`、`tests/fixtures/original.c2save`、`docs/symbol-map.json`、`docs/reverse-engineering/**`、`src/vendor/lz-string-1.3.3.js`、`output/perf/perf-baseline.json`（基线数据）。

## 8. 智能体产出验收状态

- 取证×3（字段语义）：✅ 已验证并落地/记录（27 字段身份全 HIGH）。
- 文档×3（architecture/runtime-entrypoints、game-state-schema/persistence、rng/time-model/baseline）：✅ 已提交；architecture.md 的 file:line 引用经智能体脚本核验；game-state 智能体发现 facts.md"29 键"笔误已修正为 30 键。
