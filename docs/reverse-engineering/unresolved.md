# 未解/待办问题清单

> 规范 §33 要求的 unresolved 台账。每项含已知证据与下一步动作。

## U1 — `Da` 字段三路拆分引发行为分叉（重命名被回退）

- 状态：**重命名已回退**，运行时字段仍是 `.Da`。
- 现象：按第四轮取证（Character→combatTarget、CombatAction→targetCharacter、Explore 系 Behavior→selectedTarget）落地后，6 个差分场景（potions×2/scrolls/gold/veteran/late-horizon——全部是**存档变异类**）出现 levelCenter/levelSeed±1/currentLevelIndex 漂移；基线与 long-run-9000 不受影响。逐行复核未发现明显错分类（behaviors.js:442 已做 combatTarget 例外）。
- 已排除：`.Ja/.ka/.Oa/.Fa/.Ca/.ra/.Y` 单独或组合落地均 12/12 通过（每个字母独立回归）。
- 怀疑方向：① dossiers 的所有者分类在某个文件有遗漏（如 actions.js 中某 `.Da` 实为 Character）；② 存在 `X.Da` 的**链式/计算访问**未被静态 grep 覆盖；③ 某处对 `.Da` 的 `+`/字符串拼接依赖了 undefined 语义。
- 下一步：用 harness 的 RNG 栈记录器（`window.__rngLogFrom/To`，tests/engine-harness.js）在分叉回合（3926 附近的多回合窗口）逐调用对比两端调用点；或对 behaviors.js/actions.js 的每个 `.Da` 做运行时类型断言（`instanceof Character/CombatAction`）验证所有者分类。
- 关联提交：2588e9a 之后的波次 4b-1 系列提交。

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
