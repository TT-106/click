# 未解/待办问题清单

> 规范 §33 要求的 unresolved 台账。每项含已知证据与下一步动作。

## U1 — `Da` 字段三路拆分引发行为分叉（重命名被回退）

- 状态：**重命名已回退**，运行时字段仍是 `.Da`。
- 现象：按第四轮取证（Character→combatTarget、CombatAction→targetCharacter、Explore 系 Behavior→selectedTarget）落地后，6 个差分场景（potions×2/scrolls/gold/veteran/late-horizon——全部是**存档变异类**）出现 levelCenter/levelSeed±1/currentLevelIndex 漂移；基线与 long-run-9000 不受影响。
- **本轮新增实证**（RNG 计数器 + 栈记录器）：
  1. 推进期 RNG delta 全程 0/0（600 回合逐 50 回合步进）——分叉是**非随机决策**，不是随机流错位。
  2. 载入期 RNG 消耗两端不同（restore 时 chooseScrollCaster→initializeCharacterSkills 的武器生成），但 harness 在载入后重置种子，不影响载入后状态（parity(0) 通过）。
  3. `createSpellAction(a)`/`createChainAction(a)` 的入参 `a` 是**施法者角色**（character.js:853/875/884 调用），其内部 `a.Da` = **combatTarget**——actions.js:494/616/682 是 Character 所有，dossier 误标为 CombatAction.targetCharacter。
  4. `BehaviorQueue.prototype.nu(a)`（behaviors.js:285）的 `a` 是**角色**（清 actionType/rh/ld 等角色字段），`a.Da = null` = 清 combatTarget——dossier 同样误标。
  5. 已修正 3/442/494/616/682/285 全部已知误标后**仍分叉**——说明还有未发现的读写点或语义分叉（`hasOpponentsInRoom`/442 语义链最可疑：FollowLeaderBehavior.wd 的"谁在打我"判定直接影响移动决策，而 levelCenter 恰是位移差异）。
- 已排除：`.Ja/.ka/.Oa/.Fa/.Ca/.ra/.Y` 单独或组合落地均 12/12 通过。
- 下一步（按序）：
  1. 在 Da 拆分状态下，对每个 `.combatTarget`/`.targetCharacter` 读写点加运行时类型断言（`instanceof Character` / `instanceof CombatAction`），跑 600 回合抓第一个断言失败点——直接定位错分类行。
  2. 或改用**运行时观测**：差分两端同时 dump `FollowLeaderBehavior.wd` 的入参/返回（分叉首现的移动决策），二分到具体角色。
- **第三轮实证（2026-09-26，运行时观察器）**：
  1. harness 已内置 ?watchDa 观察器（defineProperty 拦截 combatTarget/targetCharacter 全部写操作并校验值形状）。
  2. 修正 6 处误标后的拆分在单页 600 回合下**值流 100% 正确**（零违例），standalone potions-active 通过。
  3. 但多场景 runner 历史下 LifeDrainBehavior.Jd 崩溃（selectedTarget undefined → 'stats'）——**场景顺序依赖**，非值流错误。
  4. 结论：拆分语义正确但与页面历史状态交互存在未解缺陷；下一步应对比两端 behaviors 队列内部状态（un/Lm/selectedTarget）在场景切换时的差异。
- 经验教训（已入 facts#20 扩展）：**重命名跨文件字段时，"读点全集"必须包含工厂函数/工具函数内按多态入参的访问**；Babel 静态 grep 对 `a.Da`（a 的类型随调用方变化）天然失真，应配运行时类型断言。

## U2 — 外部自动化脚本（c2c.user.js）DOM 契约未实测

- `archive/original/c2c.user.js` 依赖的 DOM 结构已随 legacy-dom.html 保留，但未实际运行该脚本验证。
- 下一步：在浏览器 E2E 中加载 userscript 模拟其核心选择器读取。

## U3 — 长时 wall-clock soak 未跑

- 8h/24h 加速等价场景 + 内存采样。差分 harness 已具备能力，待加 performance.memory 采样。

## U4 — 差分覆盖缺口

- 胜利瞬间（城堡征服全流程）、部分法术分支（blastStun 系）、12h 离线上限截断路径。
- 扩展方式：`tests/scenarios/save-mutations.mjs` 增加对应变异器。

## U5 — 长尾字段重命名

- 剩余约 1,300 处；第四轮取证已覆盖 fa/ea/wa/sa/ua/xa/$/La/Ia/na/ma/la 的证据（见下方"已取证待落地"），Y/Z/aa 等其余字母待新取证。

## 已取证待落地（第四轮智能体 B，证据在手）

| 字段 | 对象 | 提案名 | 置信度 | 备注 |
|---|---|---|---|---|
| fa | ItemType + equipment.js 52 字面量 | baseName | HIGH | 改名安全；**值**参与 itemTypeId 哈希，勿改值 |
| oa (+SC, Xn) | ItemType + equipment.js | isProjectile / isProjectileItem / projectileAnimationId | HIGH | 组名需同步 equipment.js 键 + items.js 字段 |
| ea | WorldTile/DungeonTile 方法 | setDecorationSprite | HIGH | |
| wa | 布局/装饰/命名生成器 | seededRandom | HIGH | |
| sa | 16 个 *Details 视图 | shown | HIGH | |
| ua | PurchaseDungeon/CastleUpgrade、DungeonRowView | dungeon | HIGH | |
| xa | 法术包装定义（targeting.js ~37 个） | spellDefinition | HIGH | |
| $ | LevelUpUpgrade | adventurerIndex | HIGH | |
| La (+mq) | Spell + spells.js 定义键 | cooldownTurns（mq=lastCastTurn） | HIGH | |
| na/ma/la | ItemType | isMeleeWeapon/isArmor/isOffhandOrMagic | LOW/MEDIUM | write-only 死字段，语义来自数据模式；改名需注记 |
| Ia | bossSpriteDefinitions | bossName | MEDIUM | write-only 死数据 |

## 已落地（第四轮，全部 12/12 回归通过）

| 字段 | 新名 | 对象 |
|---|---|---|
| Ja | effects | Character |
| ka | priorityWeight | 全部 Behavior |
| Oa | notifySpellLearned | BehaviorQueue + Behavior 原型方法 |
| Fa | targetCharacter | 攻击类 Behavior |
| Ca | attacker | CombatAction |
| ra | velocity | CharacterPosition |
| Y | actionType | Character（含 party.js/tick.js 全覆盖——初版因 grep head 截断漏 2 处导致分叉，已修复并记入 facts#20 教训） |
| ta/ca/ya/Ra/ga/X | name/impactEffectName/projectileEffectName/potencyPercent/spellCategoryId/statusEffectTypeId | 法术定义族（第四轮取证 A） |
